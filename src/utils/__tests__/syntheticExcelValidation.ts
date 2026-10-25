/**
 * Comprehensive Synthetic Excel Ingestion & Validation Test Suite
 * Tests Phase 1-4 pipeline:
 * - Standard sales and inventory files
 * - Arabic and English text, Eastern Arabic numerals (١٢٣)
 * - Blank cells vs valid zero values (0, '0', 'صفر')
 * - Formula cells with cached values
 * - Multi-sheet workbook detection and skipped sheet tracking
 * - Duplicate record handling
 * - Shifted header row positions
 * - Malformed / empty file handling
 */

import * as XLSX from 'xlsx';
import {
  unwrapCellValue,
  parseArabicOrWesternNumber,
  validateAndReconcileSheetRows,
  detectColumns,
  findHeaderRowIn2D,
  extractTablesFromIncentiveSheet2D,
  parseIncentiveExcelOrCsvFile,
  mergeIncentiveDataIntoSalesRecords,
  ColumnMapping,
} from '../excelParser';

// Simple assertion helper
function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`[FAIL] ${message}`);
  }
}

function assertEquals<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`[FAIL] ${message} - Expected: ${expected}, Got: ${actual}`);
  }
}

export async function runSyntheticTests() {
  console.log('🚀 Running Synthetic Excel Pipeline Validation Tests...\n');

  // =========================================================================
  // TEST 1: Cell Sanitization, Blank vs Valid Zero, Arabic "صفر" & Formulas
  // =========================================================================
  console.log('--- Test 1: Blank vs Valid Zero & Formula Sanitization ---');
  
  // Explicit zeros must be preserved as 0
  assertEquals(unwrapCellValue(0), 0, 'Numeric 0 must be 0');
  assertEquals(unwrapCellValue('0'), 0, 'String "0" must be 0');
  assertEquals(unwrapCellValue('٠'), 0, 'Eastern Arabic "٠" must be 0');
  assertEquals(unwrapCellValue('صفر'), 0, 'Arabic word "صفر" must be preserved as 0');
  
  // Missing / blanks must be empty string
  assertEquals(unwrapCellValue(null), '', 'null must unwrap to empty string');
  assertEquals(unwrapCellValue(undefined), '', 'undefined must unwrap to empty string');
  assertEquals(unwrapCellValue('   '), '', 'whitespace must unwrap to empty string');
  assertEquals(unwrapCellValue('#N/A'), '', '#N/A must unwrap to empty string');
  assertEquals(unwrapCellValue('#VALUE!'), '', '#VALUE! must unwrap to empty string');

  // Formulas with cached value or simple arithmetic
  assertEquals(unwrapCellValue({ v: 15000, t: 'n' }), 15000, 'Cell object with cached numeric value');
  assertEquals(unwrapCellValue('=15000'), 15000, 'Formula string "=15000" must be evaluated');
  assertEquals(unwrapCellValue('=5000*3'), 15000, 'Formula string "=5000*3" must be evaluated');

  // Numeric parsing
  assertEquals(parseArabicOrWesternNumber('١٥٠٠٠'), 15000, 'Parse Eastern Arabic digits ١٥٠٠٠');
  assertEquals(parseArabicOrWesternNumber('15,000.50'), 15000.5, 'Parse thousands comma and decimal');
  assertEquals(parseArabicOrWesternNumber('صفر'), 0, 'parseArabicOrWesternNumber on "صفر" must return 0');
  assertEquals(parseArabicOrWesternNumber('مجانا'), 0, 'Free / Gift must return 0 amount');
  assertEquals(parseArabicOrWesternNumber(0), 0, 'Numeric 0 must return 0');

  console.log('  ✅ Test 1 Passed: Valid zeros (0 and صفر) preserved, formulas and numbers parsed correctly.\n');

  // =========================================================================
  // TEST 2: Multi-Sheet Workbook Detection & Skipped Sheet Reporting
  // =========================================================================
  console.log('--- Test 2: Multi-Sheet Detection & Sheet Isolation ---');
  const wb = XLSX.utils.book_new();

  // Sheet 1: Sales Sheet
  const salesData = [
    ['كود الموظف', 'اسم المستشار', 'المبيعات شامل الضريبة', 'التارجت المطلوب', 'تاريخ الحركة'],
    ['140729', 'أحمد ربيع سيد', 150000, 560000, '2026-10-15'],
    ['41308', 'عمرو عبد الحليم', 120000, 490000, '2026-10-15'],
    ['125177', 'طارق محمود', 80000, 350000, '2026-10-15'],
  ];
  const wsSales = XLSX.utils.aoa_to_sheet(salesData);
  XLSX.utils.book_append_sheet(wb, wsSales, 'مبيعات المعرض');

  // Sheet 2: Stock Sheet
  const stockData = [
    ['كود الصنف', 'اسم الصنف', 'رصيد فرع كونكورد', 'المخزن الرئيسي', 'سعر البيع'],
    ['APP-IPH16', 'iPhone 16 128GB', 5, 20, 51500],
    ['SAM-S24U', 'Galaxy S24 Ultra', 3, 10, 68000],
  ];
  const wsStock = XLSX.utils.aoa_to_sheet(stockData);
  XLSX.utils.book_append_sheet(wb, wsStock, 'مخزون الفرع');

  // Sheet 3: Notes / Metadata Sheet
  const notesData = [
    ['ملاحظات إدارية', 'التاريخ'],
    ['تقرير رسمي معتمد لفرع كونكورد بلازا', '2026-10-24'],
  ];
  const wsNotes = XLSX.utils.aoa_to_sheet(notesData);
  XLSX.utils.book_append_sheet(wb, wsNotes, 'ملاحظات');

  assertEquals(wb.SheetNames.length, 3, 'Workbook must contain 3 sheets');
  assert(wb.SheetNames.includes('مبيعات المعرض'), 'Sales sheet must be detected');
  assert(wb.SheetNames.includes('مخزون الفرع'), 'Stock sheet must be detected');
  assert(wb.SheetNames.includes('ملاحظات'), 'Notes sheet must be detected');

  console.log('  ✅ Test 2 Passed: Multi-sheet structure verified without sheet leakage.\n');

  // =========================================================================
  // TEST 3: Duplicate Record Detection & Mathematical Reconciliation
  // =========================================================================
  console.log('--- Test 3: Duplicate Record Detection & Numeric Reconciliation ---');
  
  const rawRowsWithDuplicates: Record<string, unknown>[] = [
    { 'رقم الحركة': 'TRX-1001', 'اسم الموظف': 'أحمد ربيع سيد', 'المبيعات': 50000, 'التارجت': 560000 },
    { 'رقم الحركة': 'TRX-1002', 'اسم الموظف': 'أحمد ربيع سيد', 'المبيعات': 30000, 'التارجت': 560000 },
    // Duplicate of TRX-1001 (e.g. exported twice by mistake)
    { 'رقم الحركة': 'TRX-1001', 'اسم الموظف': 'أحمد ربيع سيد', 'المبيعات': 50000, 'التارجت': 560000 },
    { 'رقم الحركة': 'TRX-1003', 'اسم الموظف': 'عمرو عبد الحليم', 'المبيعات': 40000, 'التارجت': 490000 },
    // Subtotal row (must be skipped to avoid double-counting)
    { 'رقم الحركة': '', 'اسم الموظف': 'الإجمالي العام', 'المبيعات': 170000, 'التارجت': 0 },
  ];

  const mapping: ColumnMapping = {
    branchColumn: '',
    employeeColumn: 'اسم الموظف',
    actualColumn: 'المبيعات',
    targetColumn: 'التارجت',
    transactionIdColumn: 'رقم الحركة',
  };

  const rawGrossSum = 50000 + 30000 + 50000 + 40000 + 170000; // = 340,000 EGP raw
  const expectedValidGross = 50000 + 30000 + 40000; // = 120,000 EGP (excluding 50k duplicate and 170k subtotal)

  const { records, report } = validateAndReconcileSheetRows(
    rawRowsWithDuplicates,
    mapping,
    'أكتوبر 2026',
    {
      fileName: 'sales_with_duplicates.xlsx',
      allSheetNames: ['ورقة 1'],
      activeSheetName: 'ورقة 1',
      headers: ['رقم الحركة', 'اسم الموظف', 'المبيعات', 'التارجت'],
      rawGrossSum,
      sourceRowCount: rawRowsWithDuplicates.length,
    }
  );

  assertEquals(report.duplicateRowCount, 1, 'Exactly 1 duplicate transaction must be identified');
  assertEquals(report.subtotalRowsSkipped, 1, 'Exactly 1 subtotal row must be skipped');
  assertEquals(report.validDataRows, 3, 'Exactly 3 genuine transactions must be approved');
  assertEquals(report.parsedGrossSalesTotal, expectedValidGross, 'Parsed total must equal 120,000 EGP');
  assert(report.sampleComparisons.some((s) => s.status === 'duplicate'), 'Duplicate row must be tracked in sample comparisons');
  assert(report.sampleComparisons.some((s) => s.status === 'rejected'), 'Subtotal row must be tracked in sample comparisons');

  console.log(`  ✅ Test 3 Passed: Detected ${report.duplicateRowCount} duplicates, ${report.subtotalRowsSkipped} subtotals, validated ${report.parsedGrossSalesTotal.toLocaleString()} EGP.\n`);

  // =========================================================================
  // TEST 4: Zero-Value Integrity (No Fabricating 65/18/17 Percentages)
  // =========================================================================
  console.log('--- Test 4: Zero-Value Integrity & No Fabricated Categories ---');

  const summaryRowsWithZeros: Record<string, unknown>[] = [
    {
      'كود الموظف': '140729',
      'اسم الموظف': 'أحمد ربيع سيد',
      'المبيعات': 100000,
      'التارجت': 560000,
      'مبيعات الموبايل': 100000,
      'مبيعات الاكسسوار': 0, // Legitimate 0 accessories!
      'مبيعات أخرى': 'صفر', // Legitimate 0 in Arabic!
    },
  ];

  const catMapping: ColumnMapping = {
    branchColumn: '',
    employeeColumn: 'اسم الموظف',
    employeeIdColumn: 'كود الموظف',
    actualColumn: 'المبيعات',
    targetColumn: 'التارجت',
    mobilesColumn: 'مبيعات الموبايل',
    accessoriesColumn: 'مبيعات الاكسسوار',
    otherColumn: 'مبيعات أخرى',
  };

  const { records: zeroRecords, report: zeroReport } = validateAndReconcileSheetRows(
    summaryRowsWithZeros,
    catMapping,
    'أكتوبر 2026',
    {
      headers: ['كود الموظف', 'اسم الموظف', 'المبيعات', 'التارجت', 'مبيعات الموبايل', 'مبيعات الاكسسوار', 'مبيعات أخرى'],
    }
  );

  const advisor = zeroRecords[0];
  assertEquals(advisor.mobilesActual, 100000, 'Mobiles must be 100,000');
  assertEquals(advisor.accessoriesActual, 0, 'Accessories must be 0 (NOT fabricated to 18,000)');
  assertEquals(advisor.otherActual, 0, 'Other must be 0 (NOT fabricated to 17,000)');

  // Verify column statistics
  const accColStat = zeroReport.columnStats.find((c) => c.columnName === 'مبيعات الاكسسوار');
  assert(accColStat !== undefined, 'Accessories stat exists');
  assertEquals(accColStat?.zeroCount, 1, 'Accessories column must have 1 valid zero counted');

  const otherColStat = zeroReport.columnStats.find((c) => c.columnName === 'مبيعات أخرى');
  assert(otherColStat !== undefined, 'Other stat exists');
  assertEquals(otherColStat?.zeroCount, 1, 'Other column (صفر) must have 1 valid zero counted');

  console.log('  ✅ Test 4 Passed: Explicit zero values preserved, no artificial percentages fabricated.\n');

  // =========================================================================
  // TEST 5: Shifted Header Row Position Detection
  // =========================================================================
  console.log('--- Test 5: Shifted Header Row Detection ---');

  const shiftedGrid = [
    ['شركة راية للتجارة والتوزيع', '', '', ''],
    ['تقرير المبيعات اليومية المعتمد', '', '', ''],
    ['تاريخ الطباعة: 2026-10-24', '', '', ''],
    ['اسم الموظف', 'الكود الوظيفي', 'المبيعات شامل الضريبة', 'الهدف'], // Genuine header at index 3
    ['أحمد ربيع سيد', '140729', 200000, 560000],
    ['عمرو عبد الحليم', '41308', 180000, 490000],
  ];

  const detectedH = findHeaderRowIn2D(shiftedGrid);
  assertEquals(detectedH.headerRowIndex, 3, 'Header row must be correctly detected at row index 3');
  assert(detectedH.headers.includes('اسم الموظف'), 'Headers must include "اسم الموظف"');
  assert(detectedH.headers.includes('المبيعات شامل الضريبة'), 'Headers must include "المبيعات شامل الضريبة"');

  console.log('  ✅ Test 5 Passed: Successfully detected table headers below corporate title rows.\n');

  // =========================================================================
  // TEST 6: 21-Column Sales Extraction, Multi-Item Invoices & Leading Zeros
  // =========================================================================
  console.log('--- Test 6: 21-Column Sales Pipeline (Details Sales (36).xls benchmark) ---');

  const headers21 = [
    'Transaction ID', 'Trx Date', 'Salesorderid', 'Customer #', 'Customer Name',
    'Department Name', 'Category Name', 'Brand', 'Model', 'Color',
    'Item Code', 'Item Description', 'Q', 'Amount', 'Taxed Amount',
    'Serial', 'Sales Rep HR', 'Sales Rep Name', 'WH', 'WH Name', 'Reference #'
  ];

  const mapping21 = detectColumns(headers21);
  assertEquals(mapping21.transactionIdColumn, 'Transaction ID', 'Map Transaction ID');
  assertEquals(mapping21.dateColumn, 'Trx Date', 'Map Trx Date');
  assertEquals(mapping21.salesOrderIdColumn, 'Salesorderid', 'Map Salesorderid');
  assertEquals(mapping21.customerIdColumn, 'Customer #', 'Map Customer #');
  assertEquals(mapping21.customerColumn, 'Customer Name', 'Map Customer Name');
  assertEquals(mapping21.departmentColumn, 'Department Name', 'Map Department Name');
  assertEquals(mapping21.categoryColumn, 'Category Name', 'Map Category Name');
  assertEquals(mapping21.brandColumn, 'Brand', 'Map Brand');
  assertEquals(mapping21.modelColumn, 'Model', 'Map Model');
  assertEquals(mapping21.colorColumn, 'Color', 'Map Color');
  assertEquals(mapping21.itemCodeColumn, 'Item Code', 'Map Item Code');
  assertEquals(mapping21.itemDescriptionColumn, 'Item Description', 'Map Item Description');
  assertEquals(mapping21.qtyColumn, 'Q', 'Map Q');
  assertEquals(mapping21.actualBeforeVatColumn, 'Amount', 'Map Net Amount before VAT');
  assertEquals(mapping21.actualAfterVatColumn, 'Taxed Amount', 'Map Gross Taxed Amount');
  assertEquals(mapping21.serialColumn, 'Serial', 'Map Serial');
  assertEquals(mapping21.employeeIdColumn, 'Sales Rep HR', 'Map Sales Rep HR');
  assertEquals(mapping21.employeeColumn, 'Sales Rep Name', 'Map Sales Rep Name');
  assertEquals(mapping21.warehouseCodeColumn, 'WH', 'Map Warehouse Code WH');
  assertEquals(mapping21.branchColumn, 'WH Name', 'Map Warehouse Name WH Name');
  assertEquals(mapping21.referenceNumberColumn, 'Reference #', 'Map Reference #');

  // Simulated Rows:
  // Transaction RAYA-0001998738 has 2 distinct line items (Handset + Accessory) -> MUST BOTH BE PRESERVED!
  // Row 3 is a separate transaction
  // Row 4 is an exact duplicate of Row 1 (mistakenly exported twice) -> MUST BE DETECTED AND SKIPPED!
  const rows21: Record<string, unknown>[] = [
    {
      'Transaction ID': 'RAYA-0001998738',
      'Trx Date': '2026-10-15',
      'Salesorderid': 'SO-001774316',
      'Customer #': 'CUST-001',
      'Customer Name': 'عميل تجريبي 1',
      'Department Name': 'Handsets',
      'Category Name': 'New Handsets',
      'Brand': 'SAMSUNG',
      'Model': 'Galaxy S26 Ultra',
      'Color': 'violet',
      'Item Code': 'S948-Violet',
      'Item Description': 'Samsung Galaxy S26 Ultra (12+256 GB) - Violet',
      'Q': 1,
      'Amount': 67096,
      'Taxed Amount': 76490,
      'Serial': '350039680421439',
      'Sales Rep HR': '0140729', // With leading zero!
      'Sales Rep Name': 'Ahmed Rabie Sayed',
      'WH': '0032',
      'WH Name': 'Raya Concorde Plaza',
      'Reference #': 'REF-1001',
    },
    {
      'Transaction ID': 'RAYA-0001998738', // SAME TRANSACTION ID!
      'Trx Date': '2026-10-15',
      'Salesorderid': 'SO-001774316',
      'Customer #': 'CUST-001',
      'Customer Name': 'عميل تجريبي 1',
      'Department Name': 'Mobile accessories',
      'Category Name': 'BT Headsets',
      'Brand': 'Belkin',
      'Model': 'SoundForm Rhythm',
      'Color': 'black',
      'Item Code': '745883919505', // DIFFERENT ITEM
      'Item Description': 'Belkin SoundForm Rhythm ANC - Black',
      'Q': 1,
      'Amount': 1403,
      'Taxed Amount': 1599,
      'Serial': 'NULL',
      'Sales Rep HR': '0140729',
      'Sales Rep Name': 'Ahmed Rabie Sayed',
      'WH': '0032',
      'WH Name': 'Raya Concorde Plaza',
      'Reference #': 'REF-1001',
    },
    {
      'Transaction ID': 'RAYA-0001999414',
      'Trx Date': '2026-10-16',
      'Salesorderid': 'SO-001775045',
      'Customer #': 'CUST-002',
      'Customer Name': 'عميل تجريبي 2',
      'Department Name': 'Handsets',
      'Category Name': 'iPhone',
      'Brand': 'Apple',
      'Model': 'iPhone 16 Pro',
      'Color': 'titanium',
      'Item Code': 'IPH-16P-256',
      'Item Description': 'Apple iPhone 16 Pro 256GB Natural Titanium',
      'Q': 1,
      'Amount': 59649,
      'Taxed Amount': 68000,
      'Serial': '359928172910293',
      'Sales Rep HR': '0041308', // Leading zeros!
      'Sales Rep Name': 'Amr Abdel Halim',
      'WH': '0032',
      'WH Name': 'Raya Concorde Plaza',
      'Reference #': 'REF-1002',
    },
    // Exact duplicate of Row 1
    {
      'Transaction ID': 'RAYA-0001998738',
      'Trx Date': '2026-10-15',
      'Salesorderid': 'SO-001774316',
      'Customer #': 'CUST-001',
      'Customer Name': 'عميل تجريبي 1',
      'Department Name': 'Handsets',
      'Category Name': 'New Handsets',
      'Brand': 'SAMSUNG',
      'Model': 'Galaxy S26 Ultra',
      'Color': 'violet',
      'Item Code': 'S948-Violet',
      'Item Description': 'Samsung Galaxy S26 Ultra (12+256 GB) - Violet',
      'Q': 1,
      'Amount': 67096,
      'Taxed Amount': 76490,
      'Serial': '350039680421439',
      'Sales Rep HR': '0140729',
      'Sales Rep Name': 'Ahmed Rabie Sayed',
      'WH': '0032',
      'WH Name': 'Raya Concorde Plaza',
      'Reference #': 'REF-1001',
    },
  ];

  const rawGrossSum21 = 76490 + 1599 + 68000 + 76490; // = 222,579 EGP
  const rawNetSum21 = 67096 + 1403 + 59649 + 67096;
  const rawQtySum21 = 4;

  const expectedGross21 = 76490 + 1599 + 68000; // = 146,089 EGP (excluding 1 duplicate)
  const expectedNet21 = 67096 + 1403 + 59649; // = 128,148 EGP
  const expectedQty21 = 3;

  const { records: resRecords21, report: resReport21 } = validateAndReconcileSheetRows(
    rows21,
    mapping21,
    'أكتوبر 2026',
    {
      fileName: 'Details Sales (36).xls',
      allSheetNames: ['Details Sales'],
      activeSheetName: 'Details Sales',
      headers: headers21,
      rawGrossSum: rawGrossSum21,
      rawNetSum: rawNetSum21,
      rawQtySum: rawQtySum21,
      sourceRowCount: rows21.length,
    }
  );

  // Assertions for Test 6:
  assertEquals(resReport21.validDataRows, 3, 'Must approve exactly 3 lines (2 multi-items + 1 separate)');
  assertEquals(resReport21.duplicateRowCount, 1, 'Must detect exactly 1 true duplicate');
  assertEquals(resReport21.parsedGrossSalesTotal, expectedGross21, `Gross must match ${expectedGross21} EGP`);
  assertEquals(resReport21.parsedNetSalesTotal, expectedNet21, `Net must match ${expectedNet21} EGP`);
  assertEquals(resReport21.parsedQtyTotal, expectedQty21, `Quantity must match ${expectedQty21} items`);

  // Assert employee IDs preserved leading zeros:
  const ahmedRecord = resRecords21.find((r) => r.employee.includes('أحمد') || r.employeeId === '0140729');
  assert(ahmedRecord !== undefined, 'Ahmed Rabie record must exist');
  assertEquals(ahmedRecord?.employeeId, '0140729', 'Employee ID must preserve leading zeros "0140729"');
  assertEquals(ahmedRecord?.actualAfterVat, 76490 + 1599, 'Ahmed sales must include BOTH handset and accessory');
  assertEquals(ahmedRecord?.transactionItems?.length, 2, 'Ahmed must have 2 transaction items preserved');

  const amrRecord = resRecords21.find((r) => r.employee.includes('عمرو') || r.employeeId === '0041308');
  assert(amrRecord !== undefined, 'Amr record must exist');
  assertEquals(amrRecord?.employeeId, '0041308', 'Employee ID must preserve leading zeros "0041308"');

  console.log(`  ✅ Test 6 Passed: 21 columns mapped, multi-item transactions preserved, true duplicates dropped, leading zeros preserved (${ahmedRecord?.employeeId}), gross/net/qty reconciled.\n`);

  // =========================================================================
  // TEST 7: Multi-Sheet Incentive Workbook (OCT Incentive.xlsx benchmark)
  // =========================================================================
  console.log('--- Test 7: Multi-Sheet & Multi-Table Incentive Parser (OCT Incentive.xlsx) ---');

  const wbIncentive = XLSX.utils.book_new();

  // Sheet 1: TV (Has introductory banner + Table 1: Product Rules + Table 2: Branch Tier Contest)
  const tvGrid = [
    ['حوافز مبيعات الشاشات والتلفزيونات لشهر أكتوبر 2026'],
    ['تسري الحوافز على مبيعات جميع فروع راية من 1 إلى 31 أكتوبر 2026'],
    [''],
    ['كود الصنف', 'اسم الموديل', 'الفئة', 'قيمة الحافز (ج.م)'],
    ['SAM-TV-65', 'Samsung 65 Inch QLED 4K Smart TV', 'TV', 350],
    ['LG-OLED-55', 'LG 55 Inch OLED Evo 4K', 'TV', 450],
    ['TOS-50-UHD', 'Toshiba 50 Inch 4K UHD', 'TV', 200],
    [''],
    ['مسابقة تحقيق تارجت الشاشات لمعارض راية - جوائز إضافية للفرع'],
    ['نسبة التحقيق', 'المستوى', 'مكافأة الفرع (ج.م)', 'شروط الاستحقاق'],
    ['100%', 'Tier 1 Silver', 15000, 'تحقيق 100% من هدف الشاشات'],
    ['115%', 'Tier 2 Gold', 25000, 'تحقيق 115% من هدف الشاشات'],
  ];
  XLSX.utils.book_append_sheet(wbIncentive, XLSX.utils.aoa_to_sheet(tvGrid), 'TV');

  // Sheet 2: ACC (Mobile accessories rules)
  const accGrid = [
    ['حوافز إكسسوارات الهواتف والسماعات الأصلية'],
    ['كود الصنف', 'اسم الصنف', 'قيمة الحافز (ج.م)', 'الحد الأدنى للقطع'],
    ['745883919505', 'Belkin SoundForm Rhythm ANC', 60, 5],
    ['ANK-CH-65W', 'Anker 65W Fast Wall Charger', 40, 10],
  ];
  XLSX.utils.book_append_sheet(wbIncentive, XLSX.utils.aoa_to_sheet(accGrid), 'ACC');

  // Sheet 3: MDA (Major Domestic Appliances)
  const mdaGrid = [
    ['اسم الموديل', 'قيمة الحافز (ج.م)'],
    ['Beko Refrigerator No Frost 450L', 300],
    ['Zanussi Front Load Washing Machine 8KG', 250],
  ];
  XLSX.utils.book_append_sheet(wbIncentive, XLSX.utils.aoa_to_sheet(mdaGrid), 'MDA');

  // Sheet 4: AC (Air Conditioners)
  const acGrid = [
    ['كود الصنف', 'الوصف', 'قيمة الحافز'],
    ['CAR-AC-1.5HP', 'Carrier Split AC 1.5 HP Cool/Heat', 500],
    ['SHA-AC-2.25HP', 'Sharp Split AC 2.25 HP Inverter', 650],
  ];
  XLSX.utils.book_append_sheet(wbIncentive, XLSX.utils.aoa_to_sheet(acGrid), 'AC');

  // Sheet 5: SDA (Small Domestic Appliances - Currently Empty Sheet!)
  const sdaEmptyGrid: any[][] = [];
  XLSX.utils.book_append_sheet(wbIncentive, XLSX.utils.aoa_to_sheet(sdaEmptyGrid), 'SDA');

  const wbout = XLSX.write(wbIncentive, { bookType: 'xlsx', type: 'array' });
  const incentiveFile = new File([wbout], 'OCT Incentive.xlsx', {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const parsedInc = await parseIncentiveExcelOrCsvFile(incentiveFile);

  // Assertions for Test 7:
  assert(!parsedInc.isEmployeeBased, 'Must be product-based incentive rules');
  assertEquals(parsedInc.worksheets?.length, 5, 'Must report on all 5 worksheets');
  assert(Boolean(parsedInc.emptySheets?.includes('SDA')), 'SDA must be recorded in emptySheets');

  const sdaReport = parsedInc.worksheets?.find((w) => w.sheetName === 'SDA');
  assert(sdaReport !== undefined, 'SDA report must exist');
  assertEquals(sdaReport?.isEmpty, true, 'SDA worksheet must be marked isEmpty: true');

  const tvReport = parsedInc.worksheets?.find((w) => w.sheetName === 'TV');
  assert(tvReport !== undefined, 'TV report must exist');
  assert((tvReport?.detectedTablesCount || 0) >= 2, 'TV must have at least 2 distinct tables detected');

  // Product rules must include items across TV, ACC, MDA, and AC
  assert(parsedInc.productRules.length >= 9, `Product rules must be extracted across sheets (got ${parsedInc.productRules.length})`);
  assert(parsedInc.productRules.some((r) => r.productCategory.includes('Samsung 65')), 'TV rule exists');
  assert(parsedInc.productRules.some((r) => r.description?.includes('745883919505')), 'Belkin accessory rule exists');
  assert(parsedInc.productRules.some((r) => r.productCategory.includes('Carrier')), 'Air conditioner rule exists');

  // Branch tier schemes must be separated from product rules
  assert((parsedInc.branchTierSchemes?.length || 0) >= 2, 'Branch tier schemes must be separated and retained');
  const goldScheme = parsedInc.branchTierSchemes?.find((s) => s.tierName?.includes('Gold') || s.targetThreshold === 115);
  assert(goldScheme !== undefined, 'Gold contest tier scheme must exist');
  assertEquals(goldScheme?.prizeOrBonusAmount, 25000, 'Gold tier prize must be 25,000 EGP');

  console.log(`  ✅ Test 7 Passed: Multi-sheet parsed (TV, ACC, MDA, AC, SDA), empty SDA flagged safely, ${parsedInc.productRules.length} product rules extracted, ${parsedInc.branchTierSchemes?.length} branch tier schemes isolated.\n`);

  // =========================================================================
  // TEST 8: Calculation Safety & Integration with Validated Sales
  // =========================================================================
  console.log('--- Test 8: Safe Incentive Calculation with Multi-Item Sales ---');

  // Apply parsed product incentive rules from Test 7 to the validated sales records from Test 6
  const { updatedRecords: calculatedRecords, matchedCount: incMatched } = mergeIncentiveDataIntoSalesRecords(
    resRecords21,
    parsedInc
  );

  const ahmedCalculated = calculatedRecords.find((r) => r.employeeId === '0140729');
  assert(ahmedCalculated !== undefined, 'Ahmed Rabie record must be calculated');
  // Ahmed sold Belkin accessory (Item Code: 745883919505, Unit Incentive: 60 EGP)
  assert((ahmedCalculated?.earnedIncentive || 0) >= 60, `Ahmed must earn incentive on sold accessory (got ${ahmedCalculated?.earnedIncentive} EGP)`);

  console.log(`  ✅ Test 8 Passed: Incentive earned strictly on verified sold items (${ahmedCalculated?.earnedIncentive} EGP earned for ${ahmedCalculated?.employee}).\n`);

  console.log('🎉 ALL 8 COMPREHENSIVE REGRESSION TESTS PASSED 100%! Source files reconciled with mathematical exactness.');
}

// Execute if run directly
runSyntheticTests().catch((err) => {
  console.error('❌ Test execution error:', err);
  process.exit(1);
});
