import { SalesRecord, ProductIncentiveRule, EmployeeIncentiveItem, BranchTotalTargetStructure } from '../types/sales';

export const CONCORD_BRANCH_NAME = 'راية - فرع كونكورد بلازا';
export const CONCORD_BRANCH_NAME_EN = 'Raya Concorde Plaza';

export const BRANCH_MANAGER = {
  name: 'هاني حنا',
  nameEn: 'Hany Hanna',
  role: 'مدير الفرع (Branch Manager)',
  branch: CONCORD_BRANCH_NAME,
};

// هيكل تارجت فرع كونكورد لشهر 10 (أكتوبر - 31 يوماً) مقسم إلى رفينيو وتقسيط، مع تقسيم الريفينيو لموبايلات وإكسسوارات و other
export const DEFAULT_OCTOBER_TARGET_STRUCTURE: BranchTotalTargetStructure = {
  grandTotal: 1750000, // إجمالي تارجت الفرع الكلي الشامل (1,400,000 رفينيو + 350,000 تقسيط)
  installmentTarget: 350000, // تارجت التقسيط (تارجت كلي عام للفرع - لا يُقسّم على الموظفين فردياً)
  revenueTarget: 1400000, // إجمالي تارجت الريفينيو (الموزع على الموظفين الثلاثة)
  revenueBreakdown: {
    mobiles: 900000, // تارجت الموبايلات والهواتف الذكية (64.3%)
    accessories: 250000, // تارجت الإكسسوارات والسماعات والشواحن (17.85%)
    other: 250000, // تارجت مبيعات أخرى بعيداً عن الموبايل والإكسسوار (شاشات وتكييفات وأجهزة منزلية) (17.85%)
  },
  period: 'أكتوبر 2026',
  daysInMonth: 31,
  dailyRevenueTarget: 45161, // 1,400,000 / 31
  dailyGrandTotalTarget: 56452, // 1,750,000 / 31
};

// Official default corporate incentive rules for Raya retail products & services
export const DEFAULT_PRODUCT_INCENTIVE_RULES: ProductIncentiveRule[] = [
  {
    id: 'inc-1',
    productCategory: 'هواتف ذكية Flagship (Samsung S / iPhone)',
    incentiveAmount: 200,
    incentiveType: 'fixed',
    minTargetQty: 10,
    description: 'حافز نقدي لكل جهاز فئة رائدة مباع',
  },
  {
    id: 'inc-2',
    productCategory: 'هواتف ذكية فئة متوسطة (A-Series / Xiaomi / Realme)',
    incentiveAmount: 100,
    incentiveType: 'fixed',
    minTargetQty: 15,
    description: 'حافز لكل جهاز فئة متوسطة واقتصادية',
  },
  {
    id: 'inc-3',
    productCategory: 'أجهزة لابتوب وكمبيوتر (Dell / HP / Lenovo)',
    incentiveAmount: 350,
    incentiveType: 'fixed',
    minTargetQty: 4,
    description: 'حافز أجهزة الكمبيوتر المحمولة والمكتبية',
  },
  {
    id: 'inc-4',
    productCategory: 'خدمات تمويل وتقسيط أمان (Aman Consumer Finance)',
    incentiveAmount: 250,
    incentiveType: 'fixed',
    minTargetQty: 8,
    description: 'حافز لكل عقد تمويلي ناجح عبر أمان',
  },
  {
    id: 'inc-5',
    productCategory: 'خدمة ضمان راية الممتد (Raya Protect Warranty)',
    incentiveAmount: 150,
    incentiveType: 'fixed',
    minTargetQty: 10,
    description: 'حافز بيع شهادات الحماية والضمان',
  },
  {
    id: 'inc-6',
    productCategory: 'إكسسوارات وسماعات وملحقات أصلية',
    incentiveAmount: 50,
    incentiveType: 'fixed',
    minTargetQty: 20,
    description: 'حافز ملحقات وإكسسوارات الهواتف واللابتوب',
  },
];

// Helper to calculate total earned incentive from items + base bonus
export function calculateIncentiveForEmployee(
  actual: number,
  target: number,
  items: EmployeeIncentiveItem[]
): number {
  const itemsTotal = items.reduce((sum, item) => sum + item.totalEarned, 0);
  // Base bonus: 2% of excess sales over target if achieved
  const excess = actual > target ? (actual - target) * 0.02 : 0;
  return Math.round(itemsTotal + excess);
}

// Initial March sample incentive items for the 3 sales advisors
const AHMED_RABEA_MARCH_ITEMS: EmployeeIncentiveItem[] = [
  { productCategory: 'هواتف ذكية Flagship (Samsung S / iPhone)', quantitySold: 28, unitIncentive: 200, totalEarned: 5600 },
  { productCategory: 'أجهزة لابتوب وكمبيوتر (Dell / HP / Lenovo)', quantitySold: 6, unitIncentive: 350, totalEarned: 2100 },
  { productCategory: 'خدمات تمويل وتقسيط أمان (Aman Consumer Finance)', quantitySold: 18, unitIncentive: 250, totalEarned: 4500 },
  { productCategory: 'خدمة ضمان راية الممتد (Raya Protect Warranty)', quantitySold: 22, unitIncentive: 150, totalEarned: 3300 },
  { productCategory: 'إكسسوارات وسماعات وملحقات أصلية', quantitySold: 35, unitIncentive: 50, totalEarned: 1750 },
];

const AMR_ABDELHALEEM_MARCH_ITEMS: EmployeeIncentiveItem[] = [
  { productCategory: 'هواتف ذكية Flagship (Samsung S / iPhone)', quantitySold: 15, unitIncentive: 200, totalEarned: 3000 },
  { productCategory: 'هواتف ذكية فئة متوسطة (A-Series / Xiaomi / Realme)', quantitySold: 32, unitIncentive: 100, totalEarned: 3200 },
  { productCategory: 'خدمات تمويل وتقسيط أمان (Aman Consumer Finance)', quantitySold: 14, unitIncentive: 250, totalEarned: 3500 },
  { productCategory: 'إكسسوارات وسماعات وملحقات أصلية', quantitySold: 40, unitIncentive: 50, totalEarned: 2000 },
];

const TAREK_MAHMOUD_MARCH_ITEMS: EmployeeIncentiveItem[] = [
  { productCategory: 'هواتف ذكية فئة متوسطة (A-Series / Xiaomi / Realme)', quantitySold: 24, unitIncentive: 100, totalEarned: 2400 },
  { productCategory: 'أجهزة لابتوب وكمبيوتر (Dell / HP / Lenovo)', quantitySold: 5, unitIncentive: 350, totalEarned: 1750 },
  { productCategory: 'خدمات تمويل وتقسيط أمان (Aman Consumer Finance)', quantitySold: 10, unitIncentive: 250, totalEarned: 2500 },
  { productCategory: 'إكسسوارات وسماعات وملحقات أصلية', quantitySold: 22, unitIncentive: 50, totalEarned: 1100 },
];

export const INITIAL_SAMPLE_RECORDS: Omit<SalesRecord, 'achievementRate' | 'difference' | 'isAchieved'>[] = [
  // --- شهر يناير 2026 (January 2026) ---
  {
    id: 'raya-jan-1',
    employeeId: '140729',
    branch: CONCORD_BRANCH_NAME,
    employee: 'أحمد ربيع سيد',
    target: 400000,
    actual: 445000,
    period: 'يناير 2026',
    earnedIncentive: 14800,
  },
  {
    id: 'raya-jan-2',
    employeeId: '41308',
    branch: CONCORD_BRANCH_NAME,
    employee: 'عمرو عبد الحليم',
    target: 380000,
    actual: 395000,
    period: 'يناير 2026',
    earnedIncentive: 11200,
  },
  {
    id: 'raya-jan-3',
    employeeId: '125177',
    branch: CONCORD_BRANCH_NAME,
    employee: 'طارق محمود',
    target: 350000,
    actual: 320000,
    period: 'يناير 2026',
    earnedIncentive: 6500,
  },

  // --- شهر فبراير 2026 (February 2026) ---
  {
    id: 'raya-feb-1',
    employeeId: '140729',
    branch: CONCORD_BRANCH_NAME,
    employee: 'أحمد ربيع سيد',
    target: 420000,
    actual: 480000,
    period: 'فبراير 2026',
    earnedIncentive: 16900,
  },
  {
    id: 'raya-feb-2',
    employeeId: '41308',
    branch: CONCORD_BRANCH_NAME,
    employee: 'عمرو عبد الحليم',
    target: 400000,
    actual: 415000,
    period: 'فبراير 2026',
    earnedIncentive: 12100,
  },
  {
    id: 'raya-feb-3',
    employeeId: '125177',
    branch: CONCORD_BRANCH_NAME,
    employee: 'طارق محمود',
    target: 370000,
    actual: 360000,
    period: 'فبراير 2026',
    earnedIncentive: 7200,
  },

  // --- شهر مارس 2026 (March 2026 - Current Month) ---
  {
    id: 'raya-mar-1',
    employeeId: '140729',
    branch: CONCORD_BRANCH_NAME,
    employee: 'أحمد ربيع سيد',
    target: 450000,
    actual: 535000,
    period: 'مارس 2026',
    earnedIncentive: calculateIncentiveForEmployee(535000, 450000, AHMED_RABEA_MARCH_ITEMS),
    incentiveItems: AHMED_RABEA_MARCH_ITEMS,
  },
  {
    id: 'raya-mar-2',
    employeeId: '41308',
    branch: CONCORD_BRANCH_NAME,
    employee: 'عمرو عبد الحليم',
    target: 420000,
    actual: 442000,
    period: 'مارس 2026',
    earnedIncentive: calculateIncentiveForEmployee(442000, 420000, AMR_ABDELHALEEM_MARCH_ITEMS),
    incentiveItems: AMR_ABDELHALEEM_MARCH_ITEMS,
  },
  {
    id: 'raya-mar-3',
    employeeId: '125177',
    branch: CONCORD_BRANCH_NAME,
    employee: 'طارق محمود',
    target: 390000,
    actual: 375000,
    period: 'مارس 2026',
    earnedIncentive: calculateIncentiveForEmployee(375000, 390000, TAREK_MAHMOUD_MARCH_ITEMS),
    incentiveItems: TAREK_MAHMOUD_MARCH_ITEMS,
  },

  // --- شهر أكتوبر 2026 (Month 10 - October 2026 - 31 Days) ---
  {
    id: 'raya-oct-1',
    employeeId: '140729',
    branch: CONCORD_BRANCH_NAME,
    employee: 'أحمد ربيع سيد',
    target: 560000,
    actual: 625000,
    period: 'أكتوبر 2026',
    earnedIncentive: 21500,
    incentiveItems: [
      { productCategory: 'هواتف ذكية Flagship (Samsung S / iPhone)', quantitySold: 32, unitIncentive: 200, totalEarned: 6400 },
      { productCategory: 'أجهزة لابتوب وكمبيوتر (Dell / HP / Lenovo)', quantitySold: 8, unitIncentive: 350, totalEarned: 2800 },
      { productCategory: 'خدمات تمويل وتقسيط أمان (Aman Consumer Finance)', quantitySold: 22, unitIncentive: 250, totalEarned: 5500 },
      { productCategory: 'خدمة ضمان راية الممتد (Raya Protect Warranty)', quantitySold: 26, unitIncentive: 150, totalEarned: 3900 },
      { productCategory: 'إكسسوارات وسماعات وملحقات أصلية', quantitySold: 42, unitIncentive: 50, totalEarned: 2100 },
    ],
  },
  {
    id: 'raya-oct-2',
    employeeId: '41308',
    branch: CONCORD_BRANCH_NAME,
    employee: 'عمرو عبد الحليم',
    target: 490000,
    actual: 515000,
    period: 'أكتوبر 2026',
    earnedIncentive: 14800,
    incentiveItems: [
      { productCategory: 'هواتف ذكية Flagship (Samsung S / iPhone)', quantitySold: 18, unitIncentive: 200, totalEarned: 3600 },
      { productCategory: 'هواتف ذكية فئة متوسطة (A-Series / Xiaomi / Realme)', quantitySold: 38, unitIncentive: 100, totalEarned: 3800 },
      { productCategory: 'خدمات تمويل وتقسيط أمان (Aman Consumer Finance)', quantitySold: 16, unitIncentive: 250, totalEarned: 4000 },
      { productCategory: 'إكسسوارات وسماعات وملحقات أصلية', quantitySold: 45, unitIncentive: 50, totalEarned: 2250 },
    ],
  },
  {
    id: 'raya-oct-3',
    employeeId: '125177',
    branch: CONCORD_BRANCH_NAME,
    employee: 'طارق محمود',
    target: 350000,
    actual: 368000,
    period: 'أكتوبر 2026',
    earnedIncentive: 9200,
    incentiveItems: [
      { productCategory: 'هواتف ذكية فئة متوسطة (A-Series / Xiaomi / Realme)', quantitySold: 26, unitIncentive: 100, totalEarned: 2600 },
      { productCategory: 'أجهزة لابتوب وكمبيوتر (Dell / HP / Lenovo)', quantitySold: 6, unitIncentive: 350, totalEarned: 2100 },
      { productCategory: 'خدمات تمويل وتقسيط أمان (Aman Consumer Finance)', quantitySold: 12, unitIncentive: 250, totalEarned: 3000 },
      { productCategory: 'إكسسوارات وسماعات وملحقات أصلية', quantitySold: 30, unitIncentive: 50, totalEarned: 1500 },
    ],
  },
];

export function enrichSalesRecords(records: Omit<SalesRecord, 'achievementRate' | 'difference' | 'isAchieved'>[]): SalesRecord[] {
  return records.map((rec) => {
    const target = Number(rec.target) || 0;
    const actual = Number(rec.actual) || 0;
    const difference = actual - target;
    const achievementRate = target > 0 ? (actual / target) * 100 : 0;
    const isAchieved = actual >= target;

    // Handle Before / After VAT calculations (Egyptian VAT 14%)
    let actualBeforeVat = rec.actualBeforeVat;
    let actualAfterVat = rec.actualAfterVat;
    let vatAmount = rec.vatAmount;

    if (actualBeforeVat !== undefined && actualAfterVat !== undefined) {
      vatAmount = vatAmount !== undefined ? vatAmount : Math.round(actualAfterVat - actualBeforeVat);
    } else if (actualBeforeVat !== undefined) {
      vatAmount = Math.round(actualBeforeVat * 0.14);
      actualAfterVat = actualBeforeVat + vatAmount;
    } else if (actualAfterVat !== undefined) {
      actualBeforeVat = Math.round(actualAfterVat / 1.14);
      vatAmount = actualAfterVat - actualBeforeVat;
    } else {
      // By default, if only actual is given, treat as gross sales (after VAT) and derive net sales (before VAT)
      actualAfterVat = actual;
      actualBeforeVat = Math.round(actual / 1.14);
      vatAmount = actualAfterVat - actualBeforeVat;
    }

    // Check if record is from an uploaded file or contains transaction items
    const isUploaded = Boolean(
      (rec.id && rec.id.startsWith('uploaded-')) ||
      (rec.transactionItems && rec.transactionItems.length > 0)
    );

    // Default category actuals if not provided: DO NOT fabricate or split for uploaded records!
    const mobilesActual = rec.mobilesActual !== undefined
      ? rec.mobilesActual
      : (isUploaded ? 0 : Math.round(actual * 0.65));
    const accessoriesActual = rec.accessoriesActual !== undefined
      ? rec.accessoriesActual
      : (isUploaded ? 0 : Math.round(actual * 0.18));
    const otherActual = rec.otherActual !== undefined
      ? rec.otherActual
      : (isUploaded ? 0 : Math.max(0, actual - mobilesActual - accessoriesActual));
    const installmentActual = rec.installmentActual !== undefined
      ? rec.installmentActual
      : (isUploaded ? 0 : Math.round(actual * 0.25));

    // Default incentive calculation if not provided: DO NOT force 2% on uploaded sheets!
    let earnedIncentive = rec.earnedIncentive;
    if (earnedIncentive === undefined) {
      if (isUploaded) {
        earnedIncentive = 0;
      } else {
        // Estimated base for sample records only: 2% of sales + bonus for target
        const baseCommission = Math.round(actual * 0.02);
        const targetBonus = isAchieved ? Math.round(difference * 0.03) : 0;
        earnedIncentive = baseCommission + targetBonus;
      }
    }

    return {
      ...rec,
      target,
      actual,
      actualBeforeVat,
      vatAmount,
      actualAfterVat,
      mobilesActual,
      accessoriesActual,
      otherActual,
      installmentActual,
      earnedIncentive,
      achievementRate,
      difference,
      isAchieved,
    };
  });
}
