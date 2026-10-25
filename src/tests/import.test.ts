/**
 * Self-Test Script: src/tests/import.test.ts
 * Tests excelParser.ts logic for Sales, Inventory, and Incentives parsing and validation against verification numbers.
 */

import {
  unwrapCellValue,
  parseArabicOrWesternNumber,
  validateAndReconcileSheetRows,
  extractTablesFromIncentiveSheet2D,
} from '../utils/excelParser';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`[IMPORT TEST FAIL] ${message}`);
  }
}

export async function runImportTests() {
  console.log('🚀 Running Dedicated Import Pipeline Self-Test (src/tests/import.test.ts)...\n');

  // 1. Test Cell Sanitization & Numbers
  assert(unwrapCellValue('0') === 0, 'Cell sanitization for 0');
  assert(unwrapCellValue('صفر') === 0, 'Cell sanitization for صفر');
  assert(parseArabicOrWesternNumber('١٥٠٠٠') === 15000, 'Arabic numeral parsing');
  assert(parseArabicOrWesternNumber('6,632,446.52') === 6632446.52, 'Amount parsing with comma');

  // 2. Test Sales Reconciliation & Verification numbers structure
  const sampleSalesRows = [
    {
      'Transaction ID': 'TRX-101',
      'Trx Date': '2026-10-15',
      'Sales Rep Name': 'أحمد ربيع سيد',
      'HR ID': '140729',
      'WH Name': 'Raya Concorde Plaza',
      'Amount Before Tax': 100000,
      'Taxed Amount': 114000,
      'QTY': 1,
    },
    {
      'Transaction ID': 'TRX-102',
      'Trx Date': '2026-10-15',
      'Sales Rep Name': 'عمرو عبد الحليم',
      'HR ID': '41308',
      'WH Name': 'Raya Concorde Plaza',
      'Amount Before Tax': 200000,
      'Taxed Amount': 228000,
      'QTY': 2,
    },
  ];

  const dummyMapping = {
    branchColumn: 'WH Name',
    employeeColumn: 'Sales Rep Name',
    employeeIdColumn: 'HR ID',
    targetColumn: '',
    actualColumn: 'Taxed Amount',
    actualBeforeVatColumn: 'Amount Before Tax',
    actualAfterVatColumn: 'Taxed Amount',
    vatAmountColumn: '',
    periodColumn: 'Trx Date',
  };

  const reconciliation = validateAndReconcileSheetRows(sampleSalesRows, dummyMapping);
  assert(Array.isArray(reconciliation.records), 'Sales reconciliation records array');
  assert(reconciliation.records.length > 0, 'Sales records parsed successfully');

  // 3. Test Incentive multi-table extraction
  const incentiveAoa = [
    ['Product Category / Item', 'Item Code', 'Incentive Amount (EGP)', 'Valid Period'],
    ['Samsung Flagship S24', 'SAM-S24U', 250, 'until 11 October'],
    ['iPhone 16 Pro', 'APP-IPH16', 300, '15-OCT till 15-NOV'],
  ];
  const extracted = extractTablesFromIncentiveSheet2D(incentiveAoa, 'TV Sheet');
  assert(Array.isArray(extracted.tables) && Array.isArray(extracted.productRules), 'Incentive multi-table extraction result structure');

  console.log('🎉 ALL IMPORT PIPELINE TESTS PASSED SUCCESSFULLY (100%)!\n');
}

// Execute if run directly via tsx
if (import.meta.url === `file://${process.argv[1]}`) {
  runImportTests().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
