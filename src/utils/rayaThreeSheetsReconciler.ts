import {
  SalesRecord,
  Language,
  Currency,
} from '../types/sales';
import { InventoryItem } from '../types/inventory';
import {
  parseArabicOrWesternNumber,
  normalizeArabicText,
  detectDelimiter,
  parseDelimitedLine,
  cleanHeader,
  matchKnownAdvisor,
  KNOWN_CONCORDE_ADVISORS,
} from './excelParser';
import { CONCORD_BRANCH_NAME, enrichSalesRecords } from '../data/sampleData';
import { loadSavedConcordeInventoryItems } from './inventoryOptimizerService';
import {
  classifyProductCategory,
  matchStrictProductIncentive,
  IncentiveRuleItem,
} from './calculations';

export interface DepartmentAchievementItem {
  department: 'mobiles' | 'accessories' | 'other' | 'total';
  departmentNameAr: string;
  departmentNameEn: string;
  actualSales: number;
  targetRequired: number;
  achievementRate: number; // percentage
  difference: number;
  isAchieved: boolean;
}

export interface DetailedSoldProductIncentive {
  id: string;
  salesRepName: string;
  employeeId?: string;
  productSold: string;
  itemCode?: string;
  quantity: number;
  unitIncentive: number;
  totalEarnedIncentive: number;
  department: 'mobiles' | 'accessories' | 'other';
  departmentAr: string;
  unitPrice?: number;
  totalSalesAmount: number;
  matchedRuleName?: string;
  isEligible: boolean;
}

export interface ProductMatchingIssue {
  id: string;
  itemCode?: string;
  productDescription: string;
  salesRepName?: string;
  quantity: number;
  amount: number;
  stockStatus: 'found_in_stock' | 'not_in_stock';
  assignedDepartment: 'mobiles' | 'accessories' | 'other';
  departmentAr: string;
  classificationMethod: 'stock_sheet_match' | 'fallback_nature' | 'unrecognized';
  classificationMethodAr: string;
  incentiveStatus: 'eligible' | 'zero_incentive_unlisted';
  incentiveStatusAr: string;
  notesAr: string;
}

export interface ThreeSheetsReconciliationResult {
  departmentAchievements: DepartmentAchievementItem[];
  detailedIncentives: DetailedSoldProductIncentive[];
  matchingIssues: ProductMatchingIssue[];
  auditedRecords: SalesRecord[];
  summary: {
    totalSales: number;
    totalTarget: number;
    totalIncentives: number;
    overallAchievementRate: number;
    totalTransactionsCount: number;
    totalUnitsSold: number;
    matchedIncentiveUnits: number;
    zeroIncentiveUnits: number;
    stockMatchedItemsCount: number;
    fallbackMatchedItemsCount: number;
  };
}

export interface ReconcileOptions {
  salesData: string | Record<string, unknown>[];
  stockData?: string | Record<string, unknown>[] | InventoryItem[];
  incentiveData?: string | Record<string, unknown>[];
  targets?: {
    mobilesTarget?: number;
    accessoriesTarget?: number;
    otherTarget?: number;
    grandTotalTarget?: number;
  };
  period?: string;
  branchName?: string;
}

/**
 * Standardizes delimiter line parsing from raw string or TSV
 */
function parseTextToRows(rawText: string): Record<string, unknown>[] {
  const clean = rawText.replace(/^\uFEFF/, '').trim();
  if (!clean) return [];

  const lines = clean
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('#') && !l.startsWith('//'));

  if (lines.length < 2) return [];

  const delimiter = detectDelimiter(clean);
  const headers = parseDelimitedLine(lines[0], delimiter).map((h) => h.trim());
  const rows: Record<string, unknown>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const vals = parseDelimitedLine(lines[i], delimiter);
    if (vals.every((v) => !v)) continue;
    const row: Record<string, unknown> = {};
    headers.forEach((h, hIdx) => {
      row[h] = vals[hIdx] !== undefined ? vals[hIdx] : '';
    });
    rows.push(row);
  }

  return rows;
}

/**
 * Classifies a category string from a stock item into the 3 departments:
 * Mobiles, Accessories, Other
 */
export function mapStockCategoryToDepartment(catStr: string, nameStr: string = ''): 'mobiles' | 'accessories' | 'other' {
  const norm = normalizeArabicText(`${catStr} ${nameStr}`);

  // Mobiles & Tablets
  if (
    /موبايل|هاتف|محمول|تليفون|تابلت|ايباد|smartphone|smartphones|handset|mobile|tablet|ipad|phone/i.test(
      norm
    )
  ) {
    return 'mobiles';
  }

  // Accessories
  if (
    /اكسسوار|إكسسوار|سماع|شاحن|كابل|ساعة|جراب|لاصق|باور\s*بانك|حزام|accessory|accessories|earbud|headset|airpod|buds|charger|cable|case|cover|watch|band|powerbank|glass|protector/i.test(
      norm
    )
  ) {
    return 'accessories';
  }

  // Other (Screens, Laptops, Coffee machines, Home appliances, etc.)
  return 'other';
}

/**
 * Fallback classification rule based on item description and brand (Rule 1b)
 */
export function classifyItemByNatureFallback(desc: string, brand: string = ''): 'mobiles' | 'accessories' | 'other' {
  const result = classifyProductCategory({
    description: desc,
    brand,
  });
  return result.department;
}

/**
 * Core 3-Way Reconciliation Engine:
 * Strictly processes:
 * 1. Sales Sheet (transactions / sales items)
 * 2. Stock Sheet (inventory classification)
 * 3. Incentive Sheet (strict per-piece incentive rules)
 *
 * Adheres strictly to the user-defined rules:
 * - Stock Sheet check first, followed by Nature fallback
 * - Per-piece Incentive strictly for listed products in the Incentive Sheet (unlisted = 0 EGP)
 * - Exact category targets and mathematical achievement percentages
 */
export function reconcileThreeSheetsData(options: ReconcileOptions): ThreeSheetsReconciliationResult {
  const {
    salesData,
    stockData,
    incentiveData,
    targets = {},
    period = 'أكتوبر 2026',
    branchName = CONCORD_BRANCH_NAME,
  } = options;

  // 1. Resolve Targets (Default Concorde targets if not entered)
  // Total Target: 1,400,000 EGP (Mobiles: 980,000 EGP, Accessories: 210,000 EGP, Other: 210,000 EGP)
  const mobilesTarget = targets.mobilesTarget !== undefined && targets.mobilesTarget > 0 ? targets.mobilesTarget : 980000;
  const accessoriesTarget = targets.accessoriesTarget !== undefined && targets.accessoriesTarget > 0 ? targets.accessoriesTarget : 210000;
  const otherTarget = targets.otherTarget !== undefined && targets.otherTarget > 0 ? targets.otherTarget : 210000;
  const grandTotalTarget = targets.grandTotalTarget !== undefined && targets.grandTotalTarget > 0
    ? targets.grandTotalTarget
    : (mobilesTarget + accessoriesTarget + otherTarget);

  // 2. Prepare Stock Lookup Maps
  let stockRows: Record<string, unknown>[] = [];
  if (typeof stockData === 'string') {
    stockRows = parseTextToRows(stockData);
  } else if (Array.isArray(stockData)) {
    if (stockData.length > 0 && 'sku' in stockData[0]) {
      // Already InventoryItem[]
      stockRows = (stockData as InventoryItem[]).map((it) => ({
        'كود الصنف': it.sku,
        'اسم الصنف': it.name,
        'القسم': it.categoryLabelAr || it.category,
      }));
    } else {
      stockRows = stockData as Record<string, unknown>[];
    }
  }

  // If no stock rows provided, load active stock items from storage
  if (stockRows.length === 0) {
    const savedItems = loadSavedConcordeInventoryItems();
    if (savedItems && savedItems.length > 0) {
      stockRows = savedItems.map((it) => ({
        'كود الصنف': it.sku,
        'اسم الصنف': it.name,
        'القسم': it.categoryLabelAr || it.category,
      }));
    }
  }

  const stockMapByCode = new Map<string, { department: 'mobiles' | 'accessories' | 'other'; rawCategory: string; name: string }>();
  const stockMapByName = new Map<string, { department: 'mobiles' | 'accessories' | 'other'; rawCategory: string; code: string }>();

  stockRows.forEach((row) => {
    let sku = '';
    let name = '';
    let cat = '';

    for (const [k, v] of Object.entries(row)) {
      const cleanK = cleanHeader(k);
      const strVal = String(v ?? '').trim();
      if (/كود|رمز|باركود|sku|code|itemcode|material/i.test(cleanK) && !sku) {
        sku = strVal;
      } else if (/اسم|صنف|موديل|وصف|name|desc|product|item/i.test(cleanK) && !name) {
        name = strVal;
      } else if (/قسم|فئة|تصنيف|نوع|category|dept|department/i.test(cleanK) && !cat) {
        cat = strVal;
      }
    }

    if (sku || name) {
      const dept = mapStockCategoryToDepartment(cat, name);
      if (sku) {
        stockMapByCode.set(sku.toLowerCase().trim(), { department: dept, rawCategory: cat, name });
      }
      if (name) {
        stockMapByName.set(normalizeArabicText(name), { department: dept, rawCategory: cat, code: sku });
      }
    }
  });

  // 3. Prepare Incentive Lookup Maps (Strict Per-Piece Incentive)
  let incentiveRows: Record<string, unknown>[] = [];
  if (typeof incentiveData === 'string') {
    incentiveRows = parseTextToRows(incentiveData);
  } else if (Array.isArray(incentiveData)) {
    incentiveRows = incentiveData as Record<string, unknown>[];
  }

  const incentiveRulesList: IncentiveRuleItem[] = [];
  const incentiveMapByCode = new Map<string, { unitIncentive: number; ruleName: string }>();
  const incentiveMapByName = new Map<string, { unitIncentive: number; ruleName: string }>();

  incentiveRows.forEach((row) => {
    let itemCode = '';
    let itemName = '';
    let unitIncentive = 0;

    for (const [k, v] of Object.entries(row)) {
      const cleanK = cleanHeader(k);
      const strVal = String(v ?? '').trim();
      if (/كود|رمز|sku|code/i.test(cleanK) && !itemCode) {
        itemCode = strVal;
      } else if (/منتج|صنف|فئة|موديل|وصف|اسم|product|item|description|model/i.test(cleanK) && !itemName) {
        itemName = strVal;
      } else if (/حافز.*قطعة|قيمة.*حافز|حافز|عمولة.*قطعة|عمولة|بونص|incentive|bonus|rate|amount|unit.*incentive/i.test(cleanK) && unitIncentive === 0) {
        unitIncentive = parseArabicOrWesternNumber(v, 0);
      }
    }

    if (unitIncentive > 0) {
      incentiveRulesList.push({
        itemCode: itemCode || undefined,
        productName: itemName || itemCode,
        unitIncentive,
        ruleName: itemName || itemCode,
      });
      if (itemCode) {
        incentiveMapByCode.set(itemCode.toLowerCase().trim(), { unitIncentive, ruleName: itemName || itemCode });
      }
      if (itemName) {
        incentiveMapByName.set(normalizeArabicText(itemName), { unitIncentive, ruleName: itemName });
      }
    }
  });

  // 4. Parse Sales Rows
  let salesRows: Record<string, unknown>[] = [];
  if (typeof salesData === 'string') {
    salesRows = parseTextToRows(salesData);
  } else if (Array.isArray(salesData)) {
    salesRows = salesData as Record<string, unknown>[];
  }

  // 5. Chain of Thought Row-by-Row Processing
  let mobilesActual = 0;
  let accessoriesActual = 0;
  let otherActual = 0;

  const detailedIncentives: DetailedSoldProductIncentive[] = [];
  const matchingIssues: ProductMatchingIssue[] = [];

  // Employee Aggregators
  interface AdvisorBucket {
    employeeId: string;
    employeeName: string;
    branch: string;
    actualGross: number;
    actualBeforeVat: number;
    vatAmount: number;
    mobilesActual: number;
    accessoriesActual: number;
    otherActual: number;
    installmentActual: number;
    earnedIncentive: number;
    incentiveItems: Array<{ productCategory: string; quantitySold: number; unitIncentive: number; totalEarned: number }>;
    transactionItems: Array<{ itemCode?: string; description: string; qty: number; price?: number; amount: number; department: 'mobiles' | 'accessories' | 'other' }>;
    transactionCount: number;
  }

  const advisorMap = new Map<string, AdvisorBucket>();

  let totalUnitsSold = 0;
  let matchedIncentiveUnits = 0;
  let zeroIncentiveUnits = 0;
  let stockMatchedCount = 0;
  let fallbackMatchedCount = 0;

  salesRows.forEach((row, idx) => {
    // Extract Row Values
    let empName = '';
    let empId = '';
    let itemCode = '';
    let itemDesc = '';
    let brand = '';
    let qty = 0;
    let price = 0;
    let amount = 0;
    let deptCol = '';

    for (const [k, v] of Object.entries(row)) {
      const cleanK = cleanHeader(k);
      const strVal = String(v ?? '').trim();

      if (/اسم.*(موظف|بائع|مندوب|مستشار)|sales.*rep.*name|employee.*name|rep/i.test(cleanK) && !empName) {
        empName = strVal;
      } else if (/رقم.*وظيفي|كود.*موظف|sales.*rep.*hr|emp.*id|job.*id/i.test(cleanK) && !empId) {
        empId = strVal;
      } else if (/كود.*صنف|رمز.*صنف|item.*code|sku|part.*no/i.test(cleanK) && !itemCode) {
        itemCode = strVal;
      } else if (/وصف.*صنف|اسم.*صنف|اسم.*منتج|item.*desc|product|model/i.test(cleanK) && !itemDesc) {
        itemDesc = strVal;
      } else if (/ماركة|براند|brand/i.test(cleanK) && !brand) {
        brand = strVal;
      } else if (/^(q|qty|الكمية|العدد|الكميه)$/i.test(cleanK) && qty === 0) {
        qty = parseArabicOrWesternNumber(v, 0);
      } else if (/^(سعر|سعر.*بيع|price|unit.*price)$/i.test(cleanK) && price === 0) {
        price = parseArabicOrWesternNumber(v, 0);
      } else if (/^(taxed.*amount|amount|المبيعات|المبلغ|صافي|gross|إجمالي)$/i.test(cleanK) && amount === 0) {
        amount = parseArabicOrWesternNumber(v, 0);
      } else if (/^(department|القسم|department.*name)$/i.test(cleanK) && !deptCol) {
        deptCol = strVal;
      }
    }

    // Default quantity to 1 if not specified or zero
    if (qty <= 0) qty = 1;

    // Calculate Amount if missing
    if (amount <= 0 && price > 0) {
      amount = Math.round(qty * price);
    } else if (amount <= 0 && price <= 0) {
      // Skip empty separator rows
      if (!itemCode && !itemDesc && !empName) return;
    }

    // Step 1: Category Classification (Stock Sheet lookup first, then Predefined Dictionary & Fallback)
    let assignedDept: 'mobiles' | 'accessories' | 'other' = 'other';
    let classMethod: 'stock_sheet_match' | 'fallback_nature' = 'fallback_nature';
    let isFoundInStock = false;
    let stockNote = '';

    const cleanCode = itemCode.toLowerCase().trim();
    const cleanDesc = normalizeArabicText(itemDesc);

    if (cleanCode && stockMapByCode.has(cleanCode)) {
      const match = stockMapByCode.get(cleanCode)!;
      assignedDept = match.department;
      classMethod = 'stock_sheet_match';
      isFoundInStock = true;
      stockMatchedCount++;
      stockNote = `تمت المطابقة مع شيت المخزون عبر كود الصنف (${match.rawCategory})`;
    } else if (cleanDesc && stockMapByName.has(cleanDesc)) {
      const match = stockMapByName.get(cleanDesc)!;
      assignedDept = match.department;
      classMethod = 'stock_sheet_match';
      isFoundInStock = true;
      stockMatchedCount++;
      stockNote = `تمت المطابقة مع شيت المخزون عبر اسم الصنف (${match.rawCategory})`;
    } else {
      // Enhanced classification via Predefined Department Dictionary
      const classRes = classifyProductCategory({
        itemCode,
        name: itemDesc,
        description: itemDesc,
        brand,
        model: itemDesc,
        departmentStr: deptCol,
      });
      assignedDept = classRes.department;
      classMethod = 'fallback_nature';
      isFoundInStock = false;
      fallbackMatchedCount++;
      stockNote = classRes.classificationRule;
    }

    // Accumulate Department Sales
    if (assignedDept === 'mobiles') {
      mobilesActual += amount;
    } else if (assignedDept === 'accessories') {
      accessoriesActual += amount;
    } else {
      otherActual += amount;
    }

    // Step 2: Strict Incentive Calculation (Per-piece Incentive via matchStrictProductIncentive)
    const incMatch = matchStrictProductIncentive(
      {
        itemCode,
        description: itemDesc,
        quantity: qty,
        amount,
        price,
      },
      incentiveRulesList
    );

    const unitIncentive = incMatch.unitIncentive;
    const matchedRuleName = incMatch.matchedRuleName || '';
    const isEligible = incMatch.isEligible;
    const totalEarnedIncentive = incMatch.totalEarnedIncentive;

    totalUnitsSold += qty;
    if (isEligible) {
      matchedIncentiveUnits += qty;
    } else {
      zeroIncentiveUnits += qty;
    }

    // Match Advisor
    const advisor = matchKnownAdvisor(empId, empName);
    const finalEmpName = advisor ? advisor.arabicName : (empName || 'مبيعات المعرض العامة');
    const finalEmpId = advisor ? advisor.id : (empId || 'CONCORDE-STORE-0032');
    const finalBranch = advisor ? advisor.branch : branchName;

    const advisorKey = (finalEmpId || finalEmpName).trim().toLowerCase();
    if (!advisorMap.has(advisorKey)) {
      advisorMap.set(advisorKey, {
        employeeId: finalEmpId,
        employeeName: finalEmpName,
        branch: finalBranch,
        actualGross: 0,
        actualBeforeVat: 0,
        vatAmount: 0,
        mobilesActual: 0,
        accessoriesActual: 0,
        otherActual: 0,
        installmentActual: 0,
        earnedIncentive: 0,
        incentiveItems: [],
        transactionItems: [],
        transactionCount: 0,
      });
    }

    const bucket = advisorMap.get(advisorKey)!;
    bucket.actualGross += amount;
    const net = Math.round(amount / 1.14);
    bucket.actualBeforeVat += net;
    bucket.vatAmount += (amount - net);
    if (assignedDept === 'mobiles') bucket.mobilesActual += amount;
    else if (assignedDept === 'accessories') bucket.accessoriesActual += amount;
    else bucket.otherActual += amount;

    bucket.earnedIncentive += totalEarnedIncentive;
    bucket.transactionCount += 1;

    bucket.transactionItems.push({
      itemCode,
      description: itemDesc || `صنف كود ${itemCode}`,
      qty,
      price,
      amount,
      department: assignedDept,
    });

    if (isEligible && totalEarnedIncentive > 0) {
      bucket.incentiveItems.push({
        productCategory: matchedRuleName || itemDesc,
        quantitySold: qty,
        unitIncentive,
        totalEarned: totalEarnedIncentive,
      });
    }

    // Add Detailed Incentive Row
    detailedIncentives.push({
      id: `inc-row-${idx + 1}`,
      salesRepName: finalEmpName,
      employeeId: finalEmpId,
      productSold: itemDesc || `كود: ${itemCode}`,
      itemCode,
      quantity: qty,
      unitIncentive,
      totalEarnedIncentive,
      department: assignedDept,
      departmentAr: assignedDept === 'mobiles' ? 'موبايلات' : assignedDept === 'accessories' ? 'إكسسوارات' : 'أخرى',
      unitPrice: price,
      totalSalesAmount: amount,
      matchedRuleName,
      isEligible,
    });

    // Add to Matching Issues & Discrepancies if applicable
    if (!isFoundInStock || !isEligible) {
      matchingIssues.push({
        id: `issue-row-${idx + 1}`,
        itemCode,
        productDescription: itemDesc || `صنف كود ${itemCode}`,
        salesRepName: finalEmpName,
        quantity: qty,
        amount,
        stockStatus: isFoundInStock ? 'found_in_stock' : 'not_in_stock',
        assignedDepartment: assignedDept,
        departmentAr: assignedDept === 'mobiles' ? 'موبايلات' : assignedDept === 'accessories' ? 'إكسسوارات' : 'أخرى',
        classificationMethod: classMethod,
        classificationMethodAr: classMethod === 'stock_sheet_match' ? 'مطابقة مع شيت المخزون' : 'القاعدة الاحتياطية لطبيعة الصنف',
        incentiveStatus: isEligible ? 'eligible' : 'zero_incentive_unlisted',
        incentiveStatusAr: isEligible ? `مستحق (${unitIncentive} ج.م/قطعة)` : 'صفر حافز (غير مدرج بلائحة الحوافز)',
        notesAr: isEligible ? stockNote : `${stockNote} • ${incMatch.reasonAr}`,
      });
    }
  });

  // Calculate Overall Category Achievements
  const totalSalesActual = mobilesActual + accessoriesActual + otherActual;

  const departmentAchievements: DepartmentAchievementItem[] = [
    {
      department: 'mobiles',
      departmentNameAr: 'قسم الموبايلات (Mobiles & Tablets)',
      departmentNameEn: 'Smartphones & Tablets',
      actualSales: mobilesActual,
      targetRequired: mobilesTarget,
      achievementRate: mobilesTarget > 0 ? (mobilesActual / mobilesTarget) * 100 : 0,
      difference: mobilesActual - mobilesTarget,
      isAchieved: mobilesActual >= mobilesTarget,
    },
    {
      department: 'accessories',
      departmentNameAr: 'قسم الإكسسوارات (Accessories)',
      departmentNameEn: 'Accessories & Wearables',
      actualSales: accessoriesActual,
      targetRequired: accessoriesTarget,
      achievementRate: accessoriesTarget > 0 ? (accessoriesActual / accessoriesTarget) * 100 : 0,
      difference: accessoriesActual - accessoriesTarget,
      isAchieved: accessoriesActual >= accessoriesTarget,
    },
    {
      department: 'other',
      departmentNameAr: 'قسم أجهزة أخرى (Other & Screens)',
      departmentNameEn: 'Screens, Laptops & Appliances',
      actualSales: otherActual,
      targetRequired: otherTarget,
      achievementRate: otherTarget > 0 ? (otherActual / otherTarget) * 100 : 0,
      difference: otherActual - otherTarget,
      isAchieved: otherActual >= otherTarget,
    },
    {
      department: 'total',
      departmentNameAr: 'الإجمالي العام لمبيعات الفرع',
      departmentNameEn: 'Total Branch Revenue',
      actualSales: totalSalesActual,
      targetRequired: grandTotalTarget,
      achievementRate: grandTotalTarget > 0 ? (totalSalesActual / grandTotalTarget) * 100 : 0,
      difference: totalSalesActual - grandTotalTarget,
      isAchieved: totalSalesActual >= grandTotalTarget,
    },
  ];

  // Convert Advisor Buckets to Standard SalesRecords
  const rawRecordsList = Array.from(advisorMap.values()).map((b, idx) => {
    const advisor = KNOWN_CONCORDE_ADVISORS.find((a) => a.id === b.employeeId || a.arabicName === b.employeeName);
    const target = advisor ? advisor.defaultTarget : Math.round(grandTotalTarget / Math.max(1, advisorMap.size));

    return {
      id: `reconciled-${b.employeeId || idx + 1}-${Date.now().toString(36)}`,
      employeeId: b.employeeId,
      branch: b.branch,
      employee: b.employeeName,
      target,
      actual: b.actualGross,
      actualBeforeVat: b.actualBeforeVat,
      vatAmount: b.vatAmount,
      actualAfterVat: b.actualGross,
      mobilesActual: b.mobilesActual,
      accessoriesActual: b.accessoriesActual,
      otherActual: b.otherActual,
      installmentActual: b.installmentActual,
      period,
      date: new Date().toISOString().split('T')[0],
      dateFormattedAr: '22 أكتوبر 2026',
      earnedIncentive: b.earnedIncentive,
      incentiveItems: b.incentiveItems.length > 0 ? b.incentiveItems : undefined,
      transactionItems: b.transactionItems,
    };
  });

  const auditedRecords = enrichSalesRecords(rawRecordsList);

  const totalIncentives = detailedIncentives.reduce((s, r) => s + r.totalEarnedIncentive, 0);

  return {
    departmentAchievements,
    detailedIncentives,
    matchingIssues,
    auditedRecords,
    summary: {
      totalSales: totalSalesActual,
      totalTarget: grandTotalTarget,
      totalIncentives,
      overallAchievementRate: grandTotalTarget > 0 ? (totalSalesActual / grandTotalTarget) * 100 : 0,
      totalTransactionsCount: salesRows.length,
      totalUnitsSold,
      matchedIncentiveUnits,
      zeroIncentiveUnits,
      stockMatchedItemsCount: stockMatchedCount,
      fallbackMatchedItemsCount: fallbackMatchedCount,
    },
  };
}
