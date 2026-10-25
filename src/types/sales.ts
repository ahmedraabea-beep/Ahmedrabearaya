export type Language = 'ar' | 'en';

export interface SalesRecord {
  id: string;
  employeeId?: string; // الرقم الوظيفي
  branch: string;
  employee: string;
  target: number; // تارجت الريفينيو المطلوب
  actual: number; // المبيعات المحققة (المعيار الأساسي)
  actualBeforeVat?: number; // إجمالي المبيعات قبل إضافة ضريبة القيمة المضافة
  vatAmount?: number; // قيمة ضريبة القيمة المضافة (14%)
  actualAfterVat?: number; // إجمالي المبيعات بعد إضافة ضريبة القيمة المضافة (شامل الضريبة)
  mobilesActual?: number; // محقق الموبايلات للموظف
  accessoriesActual?: number; // محقق الإكسسوارات للموظف
  otherActual?: number; // محقق أجهزة أخرى (شاشات وتكييفات) للموظف
  installmentActual?: number; // مبيعات التقسيط المحققة بواسطة الموظف
  period?: string;
  date?: string; // YYYY-MM-DD تاريخ المعاملة أو أحدث تاريخ مسجل
  dateFormattedAr?: string; // تاريخ المعاملة المنسق بالعربية (مثل: 20 أكتوبر 2026)
  earnedIncentive?: number; // الحافز المستحق بالجنيه المصري
  incentiveItems?: EmployeeIncentiveItem[]; // تفاصيل حوافز المنتجات
  transactionItems?: Array<{
    itemCode?: string;
    description: string;
    qty: number;
    price?: number;
    amount: number;
    department: 'mobiles' | 'accessories' | 'other';
  }>;
  // Computed fields
  achievementRate: number; // percentage, e.g. 115.5
  difference: number; // actual - target
  isAchieved: boolean; // actual >= target
}

export interface ProductIncentiveRule {
  id: string;
  productCategory: string; // اسم المنتج أو الفئة
  incentiveAmount: number; // قيمة الحافز لكل وحدة أو نسبة
  incentiveType: 'fixed' | 'percentage'; // مبلغ ثابت أو نسبة
  minTargetQty?: number; // الحد الأدنى المطلوب
  description?: string;
}

export interface EmployeeIncentiveItem {
  productCategory: string;
  quantitySold: number;
  unitIncentive: number;
  totalEarned: number;
}

export interface EmployeeIncentiveSummary {
  employeeId: string;
  employeeName: string;
  baseTargetBonus: number;
  productIncentives: EmployeeIncentiveItem[];
  totalIncentive: number;
}

export type TargetDistributionMethod = 'equal' | 'percentage' | 'seniority' | 'custom';

export interface BranchRevenueBreakdown {
  mobiles: number; // تارجت الموبايلات
  accessories: number; // تارجت الإكسسوارات
  other: number; // تارجت أجهزة أخرى (شاشات وتكييفات وأجهزة منزلية)
}

export interface BranchActualsTracking {
  totalActual: number; // إجمالي مبيعات الفرع
  totalActualBeforeVat: number; // إجمالي المبيعات قبل الضريبة
  totalVatAmount: number; // ضريبة القيمة المضافة (14%)
  totalActualAfterVat: number; // إجمالي المبيعات بعد الضريبة
  overallAchievementRate: number; // نسبة تحقيق الفرع الكلية الشاملة
  revenueActual: number; // محقق الريفينيو للفرع
  revenueAchievementRate: number; // نسبة تحقيق تارجت الريفينيو
  installmentActual: number; // محقق التقسيط كلياً للفرع
  installmentAchievementRate: number; // نسبة تحقيق تارجت التقسيط الكلي
  mobilesActual: number; // محقق الموبايل للفرع
  accessoriesActual: number; // محقق الإكسسوار للفرع
  otherActual: number; // محقق الشاشات والتكييفات للفرع
}

export interface BranchTotalTargetStructure {
  grandTotal: number; // إجمالي مستهدف الفرع الكلي (ريفينيو + تقسيط)
  installmentTarget: number; // تارجت التقسيط (تارجت كلي عام للفرع - لا يوزع على الموظفين فردياً)
  revenueTarget: number; // إجمالي تارجت الريفينيو (يوزع على الموظفين الثلاثة)
  revenueBreakdown: BranchRevenueBreakdown;
  installmentActual?: number; // محقق التقسيط كلياً للفرع
  period: string; // e.g. "أكتوبر 2026"
  daysInMonth: number; // 31
  dailyRevenueTarget: number; // revenueTarget / daysInMonth
  dailyGrandTotalTarget: number; // grandTotal / daysInMonth
}

export interface EmployeeTargetAllocation {
  employeeId: string;
  employeeName: string;
  percentage: number; // e.g. 40%
  targetAmount: number; // e.g. 560,000 EGP (حصته من تارجت الريفينيو)
  dailyTarget?: number; // e.g. 18,065 EGP/day
  role?: string;
  mobilesShare?: number; // حصة الموظف من تارجت الموبايلات
  accessoriesShare?: number; // حصة الموظف من تارجت الإكسسوارات
  otherShare?: number; // حصة الموظف من تارجت أجهزة أخرى (شاشات وتكييفات)
}

export interface BranchTargetConfig {
  branchName: string;
  totalTarget: number; // grandTotal or revenueTarget
  revenueTarget?: number;
  installmentTarget?: number; // تارجت كلي للفرع
  categoryBreakdown?: BranchRevenueBreakdown;
  period: string;
  daysInMonth?: number;
  dailyTarget?: number;
  method: TargetDistributionMethod;
  allocations: EmployeeTargetAllocation[];
  weeklyPhasing?: {
    week1: number;
    week2: number;
    week3: number;
    week4: number;
  };
}

export interface BranchPerformance {
  branch: string;
  totalTarget: number;
  totalActual: number;
  achievementRate: number;
  difference: number;
  isAchieved: boolean;
  employeeCount: number;
  achievedCount: number;
  topEmployee?: {
    name: string;
    actual: number;
    rate: number;
  };
}

export interface OverallStats {
  totalTarget: number;
  totalActual: number;
  achievementRate: number;
  difference: number;
  totalEmployees: number;
  achievedEmployeesCount: number;
  unachievedEmployeesCount: number;
  achievementPercentageEmployees: number;
  totalBranches: number;
  bestBranch: BranchPerformance | null;
  bestEmployee: SalesRecord | null;
}

export type FilterStatus = 'all' | 'achieved' | 'unachieved' | 'near';

export type Currency = 'SAR' | 'EGP' | 'AED' | 'USD';

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  SAR: 'ر.س',
  EGP: 'ج.م',
  AED: 'د.إ',
  USD: '$',
};

export interface MonthlySalesDataPoint {
  period: string; // e.g., "نوفمبر 2025", "ديسمبر 2025"
  periodIndex: number;
  totalActual: number;
  totalTarget: number;
  achievementRate: number;
  isForecast?: boolean;
  forecastLow?: number;
  forecastHigh?: number;
}

export interface GrowthForecast {
  historicalMonths: MonthlySalesDataPoint[];
  projectedMonths: MonthlySalesDataPoint[];
  slope: number; // Linear growth per month (Currency amount)
  intercept: number;
  averageMoMGrowthRate: number; // Percentage, e.g. +6.4%
  trendDirection: 'up' | 'stable' | 'down';
  projectedNextMonthSales: number;
  projectedNextMonthGrowthPct: number;
  projectedQuarterSales: number;
  rSquared: number; // Goodness of fit (0-1)
  branchName?: string; // If filtered to specific branch
}

export interface AnnualMonthProjection {
  monthIndex: number; // 0 (Jan) to 11 (Dec)
  monthNameAr: string; // يناير، فبراير...
  monthNameEn: string;
  periodLabel: string; // e.g. "يناير 2026"
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  target: number;
  actual?: number; // Realized historical actual
  projectedActual: number; // Actual if historical, or projected if future
  achievementRate: number;
  difference: number; // projectedActual - target
  isHistorical: boolean;
  scenarioRealistic: number;
  scenarioOptimistic: number;
  scenarioConservative: number;
}

export interface AnnualQuarterSummary {
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  quarterNameAr: string;
  quarterNameEn: string;
  totalTarget: number;
  totalActualOrProjected: number;
  achievementRate: number;
  difference: number;
  isHistorical: boolean;
  isPartial: boolean;
}

export interface AnnualProjection {
  year: number;
  branchName?: string;
  months: AnnualMonthProjection[];
  quarters: AnnualQuarterSummary[];
  totalAnnualTarget: number;
  totalAnnualProjected: number;
  totalAnnualActualToDate: number;
  annualAchievementRate: number;
  annualProjectedVariance: number;
  annualRunRate: number;
  historicalMonthsCount: number;
  remainingMonthsCount: number;
  avgMonthlyGrowthRate: number;
  scenarios: {
    realistic: number;
    optimistic: number;
    conservative: number;
  };
  seasonalFactors: Record<string, number>;
}

export interface DataAuditIssue {
  id: string;
  type: 'error' | 'warning' | 'info';
  category: 'vat' | 'target' | 'employee' | 'category_split' | 'numbers' | 'incentive';
  message: string;
  messageEn: string;
  fixedAutomatically: boolean;
  affectedEmployee?: string;
  remedyAction?: string;
}

export interface AuditReport {
  isValid: boolean;
  totalRecordsChecked: number;
  issuesCount: number;
  autoFixedCount: number;
  issues: DataAuditIssue[];
  summaryMessage: string;
  reconciledTotalNet: number;
  reconciledTotalVat: number;
  reconciledTotalGross: number;
  reconciledTotalIncentives: number;
  evaluatedAt: string;
}

export interface IncentiveUploadSummary {
  fileName: string;
  isEmployeeBased: boolean;
  matchedCount: number;
  unmatchedCount: number;
  totalIncentivePaid: number;
  ruleCount?: number;
  processedTimeMs: number;
}

export type MilestoneAlertType = 'near_90' | 'achieved_100';

export interface TargetMilestoneAlert {
  id: string;
  employeeId?: string;
  employeeName: string;
  branch: string;
  target: number;
  actual: number;
  achievementRate: number; // e.g. 96.2% or 118.8%
  type: MilestoneAlertType;
  remainingAmount: number; // target - actual (for near_90) or surplus (for achieved_100)
  timestamp: string;
  read?: boolean;
}

export interface SalesDeviationAlert {
  id: string;
  employeeId?: string;
  employeeName: string;
  branch: string;
  target: number;
  actual: number;
  achievementRate: number; // e.g. 74.2%
  deviationPct: number; // e.g. 25.8% deficit (>20%)
  deficitAmount: number; // target - actual
  weakestCategory: 'mobiles' | 'accessories' | 'installments' | 'general';
  actionTitleAr?: string;
  actionTitleEn?: string;
  suggestedActionAr: string;
  suggestedActionEn: string;
  remedyPlanSteps?: string[];
  expectedRecoveryAmount?: number;
  actionPriority: 'urgent' | 'high';
  actionType: 'shift_reallocation' | 'attach_rate_focus' | 'installment_coaching' | 'flagship_pairing';
  timestamp: string;
  isActionApproved?: boolean;
  approvedAt?: string;
  managerNotes?: string;
}

export interface SimulatedEmailReport {
  id: string;
  employeeName: string;
  employeeId?: string;
  recipientEmail: string;
  subject: string;
  body: string;
  sentAt: string;
  status: 'sent' | 'delivered';
  deliveryStatus?: string;
  previewSnippet?: string;
  actualSales: number;
  targetSales: number;
  achievementRate: number;
  surplusAmount: number;
  earnedIncentive?: number;
  mobilesActual?: number;
  accessoriesActual?: number;
  installmentActual?: number;
  period?: string;
}

export interface NotificationSettings {
  pushEnabled: boolean;
  soundEnabled: boolean;
  notifyOnNear90: boolean;
  notifyOn100: boolean;
  notifyOnDeviation20?: boolean; // إرسال تنبيهات يومية للمدير عند وجود انحراف أكبر من 20% مع إجراء تصحيحي
  autoEmailOn100?: boolean; // الميزة الاختيارية: إرسال تقرير موجز تلقائياً عبر البريد الإلكتروني عند 100%
  managerEmail?: string; // بريد مدير الفرع المستلم للتقارير
}

export type ShiftType = 'morning' | 'evening_peak' | 'full_peak' | 'off';

export interface EmployeeShiftAssignment {
  employeeId?: string;
  employeeName: string;
  branch: string;
  shiftType: ShiftType;
  shiftNameAr: string;
  shiftNameEn: string;
  shiftHours: string; // e.g. "16:30 - 23:30" or "10:00 - 16:30"
  durationHours: number; // 7.0 or 6.5
  peakHoursCovered: number; // 4.0 or 0
  peakCoveragePercentage: number; // 100% or 0%
  sectionFocus: 'mobiles_flagship' | 'accessories_warranty' | 'installments_aman' | 'general';
  sectionFocusAr: string;
  sectionFocusEn: string;
  assignedRole: string;
  hourlyTarget: number;
  hourlyActual: number;
  achievementRate: number;
  actualSales: number;
  targetSales: number;
  date: string;
  notes?: string;
}

export interface ShiftScheduleSummary {
  date: string;
  branchName: string;
  totalScheduledStaff: number;
  morningStaffCount: number;
  eveningPeakStaffCount: number;
  fullDayStaffCount: number;
  offStaffCount: number;
  totalPeakHoursAvailable: number;
  totalStaffPeakHoursDelivered: number;
  peakStaffingStatus: 'optimal' | 'moderate' | 'understaffed';
  eveningRevenueSharePct: number;
  shifts: EmployeeShiftAssignment[];
}

export type AttritionRiskLevel = 'critical' | 'high' | 'moderate' | 'low';

export interface TalentRetentionAction {
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  actionType: 'promotion_title' | 'loyalty_bonus' | 'leadership_track' | 'commission_boost';
  estimatedCost: number; // e.g. 15,000 EGP
  expectedRiskReductionPct: number; // e.g. -65%
  status: 'pending' | 'applied';
  appliedAt?: string;
}

export interface TalentAttritionProfile {
  id: string;
  employeeName: string;
  employeeId?: string;
  branch: string;
  role: string;
  tenureMonths: number;
  achievementRate: number;
  monthlySalesContribution: number;
  annualSalesContribution: number;
  isHighPerformer: boolean;
  performanceTier: 'star' | 'core' | 'support';
  riskLevel: AttritionRiskLevel;
  attritionProbabilityPct: number; // e.g. 75%
  potentialDepartureDate: string; // e.g. "2027-03-31"
  potentialDepartureWindowAr: string;
  potentialDepartureWindowEn: string;
  daysUntilDepartureWindow: number;
  primaryRiskDriversAr: string[];
  primaryRiskDriversEn: string[];
  headhuntingCompetitors: string[];
  replacementCostEstimate: number;
  monthlyRevenueAtRisk: number;
  proactiveRetentionAction: TalentRetentionAction;
}

export interface BranchAttritionSummary {
  totalStaffEvaluated: number;
  highPerformersCount: number;
  projectedAttritionRatePct: number; // e.g. 25.0%
  adjustedAttritionRatePostActionsPct: number; // e.g. 6.2%
  atRiskStaffCount: number;
  nearestDepartureDate: string;
  nearestDepartureEmployee: string;
  totalMonthlyRevenueAtRisk: number;
  totalAnnualRevenueAtRisk: number;
  totalEstimatedReplacementCost: number;
  talentStabilityIndexPct: number;
  retentionRoiMultiplier: number;
  profiles: TalentAttritionProfile[];
}
