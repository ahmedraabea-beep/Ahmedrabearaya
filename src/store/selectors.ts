import { AppStoreState } from './DataStore';
import {
  SalesRecord,
  BranchTotalTargetStructure,
  BranchPerformance,
  OverallStats,
} from '../types/sales';
import {
  calculateBranchPerformances,
  calculateOverallStats,
} from '../utils/calculations';
// 1. Filter Records by Period and Branch
export function selectRecordsInActivePeriod(state: AppStoreState): SalesRecord[] {
  const period = (state.selectedPeriod || '').trim();
  if (!period) return state.records;
  return state.records.filter((r) => !r.period || r.period.trim() === period);
}

export function selectFilteredRecords(state: AppStoreState): SalesRecord[] {
  let list = selectRecordsInActivePeriod(state);

  if (state.selectedBranch) {
    list = list.filter((r) => r.branch === state.selectedBranch);
  }

  if (state.searchQuery.trim()) {
    const q = state.searchQuery.toLowerCase().trim();
    list = list.filter(
      (r) =>
        r.employee.toLowerCase().includes(q) ||
        r.branch.toLowerCase().includes(q) ||
        (r.employeeId && r.employeeId.toLowerCase().includes(q))
    );
  }

  if (state.filterStatus === 'achieved') {
    list = list.filter((r) => r.isAchieved);
  } else if (state.filterStatus === 'unachieved') {
    list = list.filter((r) => !r.isAchieved);
  }

  return list;
}

// 2. Target Structure for Active Period
export function selectActiveTargetStructure(state: AppStoreState): BranchTotalTargetStructure | null {
  const period = (state.selectedPeriod || '').trim();
  if (!period || !state.targets) return null;
  return state.targets[period] || null;
}

// 3. Financial Totals (Single Source of Truth)
export interface FinancialTotals {
  grossSalesTotal: number;
  netSalesTotal: number;
  vatTotal: number;
  effectiveTotalActual: number;
  unitsSoldTotal: number;
  transactionsCount: number;
  averageTicketSize: number;
}

export function selectFinancialTotals(state: AppStoreState): FinancialTotals {
  const records = selectRecordsInActivePeriod(state);
  const isAfterVat = state.settings.vatDisplayMode === 'afterVat';

  let gross = 0;
  let net = 0;
  let vat = 0;
  let effective = 0;
  let units = 0;

  for (const r of records) {
    const rGross = r.actualAfterVat ?? r.actual;
    const rNet = r.actualBeforeVat ?? (rGross / 1.14);
    const rVat = r.vatAmount ?? (rGross - rNet);

    gross += rGross;
    net += rNet;
    vat += rVat;
    effective += isAfterVat ? rGross : rNet;

    if (r.incentiveItems && r.incentiveItems.length > 0) {
      units += r.incentiveItems.reduce((sum, item) => sum + (item.quantitySold || 1), 0);
    } else {
      units += 1;
    }
  }

  const transactionsCount = records.length;
  const averageTicketSize = transactionsCount > 0 ? effective / transactionsCount : 0;

  return {
    grossSalesTotal: Math.round(gross),
    netSalesTotal: Math.round(net),
    vatTotal: Math.round(vat),
    effectiveTotalActual: Math.round(effective),
    unitsSoldTotal: units,
    transactionsCount,
    averageTicketSize: Math.round(averageTicketSize),
  };
}

// 4. Revenue Pace Metrics & Month-End Forecast
export interface RevenuePaceMetrics {
  effectiveTotalActual: number;
  grandTarget: number;
  revenueTarget: number;
  installmentTarget: number;
  grandAchievementRate: number;
  remainingToTarget: number;
  daysInMonth: number;
  currentDay: number;
  daysLeft: number;
  dailyActualRate: number;
  dailyRequiredRate: number;
  forecastMonthEnd: number;
  isForecastAboveTarget: boolean;
  forecastVariance: number;
}

export function selectRevenuePaceMetrics(state: AppStoreState): RevenuePaceMetrics {
  const totals = selectFinancialTotals(state);
  const targetStructure = selectActiveTargetStructure(state);

  const grandTarget = targetStructure?.grandTotal || targetStructure?.revenueTarget || 0;
  const revenueTarget = targetStructure?.revenueTarget || grandTarget;
  const installmentTarget = targetStructure?.installmentTarget || 0;

  const effectiveTotalActual = totals.effectiveTotalActual;
  const grandAchievementRate = grandTarget > 0 ? (effectiveTotalActual / grandTarget) * 100 : 0;
  const remainingToTarget = Math.max(0, grandTarget - effectiveTotalActual);

  const daysInMonth = targetStructure?.daysInMonth || 30;
  const today = new Date();
  const currentDay = Math.min(daysInMonth, Math.max(1, today.getDate()));
  const daysLeft = Math.max(0, daysInMonth - currentDay);

  const dailyActualRate = currentDay > 0 ? effectiveTotalActual / currentDay : 0;
  const dailyRequiredRate = daysLeft > 0 ? remainingToTarget / daysLeft : 0;

  const forecastMonthEnd = Math.round(dailyActualRate * daysInMonth);
  const isForecastAboveTarget = grandTarget > 0 ? forecastMonthEnd >= grandTarget : false;
  const forecastVariance = grandTarget > 0 ? Math.round(forecastMonthEnd - grandTarget) : 0;

  return {
    effectiveTotalActual,
    grandTarget,
    revenueTarget,
    installmentTarget,
    grandAchievementRate,
    remainingToTarget,
    daysInMonth,
    currentDay,
    daysLeft,
    dailyActualRate: Math.round(dailyActualRate),
    dailyRequiredRate: Math.round(dailyRequiredRate),
    forecastMonthEnd,
    isForecastAboveTarget,
    forecastVariance,
  };
}

// 5. Category Target Progress Matrix
export interface CategoryProgressItem {
  key: string;
  nameAr: string;
  nameEn: string;
  actual: number;
  target: number;
  rate: number;
  isAchieved: boolean;
}

export function selectCategoryTargetsMatrix(state: AppStoreState): CategoryProgressItem[] {
  const records = selectRecordsInActivePeriod(state);
  const targetStructure = selectActiveTargetStructure(state);

  let mobActual = 0;
  let accActual = 0;
  let otherActual = 0;
  let instActual = 0;
  let totalRevActual = 0;

  for (const r of records) {
    totalRevActual += r.actual;
    mobActual += r.mobilesActual || 0;
    accActual += r.accessoriesActual || 0;
    otherActual += r.otherActual || 0;
    instActual += r.installmentActual || 0;
  }

  const mobTarget = targetStructure?.revenueBreakdown?.mobiles || 0;
  const accTarget = targetStructure?.revenueBreakdown?.accessories || 0;
  const otherTarget = targetStructure?.revenueBreakdown?.other || 0;
  const instTarget = targetStructure?.installmentTarget || 0;
  const revTarget = targetStructure?.revenueTarget || (mobTarget + accTarget + otherTarget);
  const grandTarget = targetStructure?.grandTotal || (revTarget + instTarget);
  const grandActual = totalRevActual + instActual;

  const calcRate = (act: number, tgt: number) => (tgt > 0 ? (act / tgt) * 100 : 0);

  return [
    {
      key: 'revenue',
      nameAr: 'ريفينيو المبيعات الكلي',
      nameEn: 'Total Revenue Target',
      actual: totalRevActual,
      target: revTarget,
      rate: calcRate(totalRevActual, revTarget),
      isAchieved: revTarget > 0 && totalRevActual >= revTarget,
    },
    {
      key: 'mobiles',
      nameAr: 'الهواتف الذكية (Mobiles)',
      nameEn: 'Handsets / Mobiles',
      actual: mobActual,
      target: mobTarget,
      rate: calcRate(mobActual, mobTarget),
      isAchieved: mobTarget > 0 && mobActual >= mobTarget,
    },
    {
      key: 'accessories',
      nameAr: 'الملحقات والإكسسوار (ACC)',
      nameEn: 'Accessories',
      actual: accActual,
      target: accTarget,
      rate: calcRate(accActual, accTarget),
      isAchieved: accTarget > 0 && accActual >= accTarget,
    },
    {
      key: 'other',
      nameAr: 'الشاشات والأجهزة الأخرى',
      nameEn: 'Other Appliances & TVs',
      actual: otherActual,
      target: otherTarget,
      rate: calcRate(otherActual, otherTarget),
      isAchieved: otherTarget > 0 && otherActual >= otherTarget,
    },
    {
      key: 'installment',
      nameAr: 'التقسيط الجماعي للفرع',
      nameEn: 'Collective Installment',
      actual: instActual,
      target: instTarget,
      rate: calcRate(instActual, instTarget),
      isAchieved: instTarget > 0 && instActual >= instTarget,
    },
    {
      key: 'grandTotal',
      nameAr: 'إجمالي مستهدف الفرع الشامل',
      nameEn: 'Grand Total Target',
      actual: grandActual,
      target: grandTarget,
      rate: calcRate(grandActual, grandTarget),
      isAchieved: grandTarget > 0 && grandActual >= grandTarget,
    },
  ];
}

// 6. Branch Performances & Overall Stats
export function selectBranchPerformancesData(state: AppStoreState): BranchPerformance[] {
  const records = selectRecordsInActivePeriod(state);
  return calculateBranchPerformances(records);
}

export function selectOverallStatsData(state: AppStoreState): OverallStats {
  const records = selectRecordsInActivePeriod(state);
  const performances = selectBranchPerformancesData(state);
  return calculateOverallStats(records, performances);
}

// 7. Top Sales Advisors (Rankings)
export function selectTopEmployees(state: AppStoreState, count = 3): SalesRecord[] {
  const records = selectRecordsInActivePeriod(state);
  return [...records].sort((a, b) => b.achievementRate - a.achievementRate).slice(0, count);
}

// 8. Unique Period & Branch Lists
export function selectUniquePeriods(state: AppStoreState): string[] {
  const set = new Set<string>();
  if (state.targets) {
    for (const p of Object.keys(state.targets)) {
      if (p && p.trim()) set.add(p.trim());
    }
  }
  for (const r of state.records) {
    if (r.period && r.period.trim()) {
      set.add(r.period.trim());
    }
  }
  if (state.selectedPeriod && state.selectedPeriod.trim()) {
    set.add(state.selectedPeriod.trim());
  }
  return Array.from(set);
}

export function selectUniqueBranches(state: AppStoreState): string[] {
  const set = new Set<string>();
  for (const r of state.records) {
    if (r.branch && r.branch.trim()) {
      set.add(r.branch.trim());
    }
  }
  return Array.from(set);
}

// 9. Data Consistency Audit (Single Source of Truth Check)
export interface ConsistencyCheckReport {
  isConsistent: boolean;
  dashboardTotal: number;
  recordsTotal: number;
  staffRankingsTotal: number;
  discrepancy: number;
  recordsCount: number;
  totalRecords: number;
  periodsCount: number;
  branchesCount: number;
}

export function selectDataConsistencyReport(state: AppStoreState): ConsistencyCheckReport {
  const activeRecords = selectRecordsInActivePeriod(state);
  const totals = selectFinancialTotals(state);

  const dashboardTotal = totals.effectiveTotalActual;
  const isAfterVat = state.settings.vatDisplayMode === 'afterVat' || state.settings.vatMode === 'afterVat';

  const recordsTotal = activeRecords.reduce((sum, r) => {
    return sum + (isAfterVat ? (r.actualAfterVat ?? r.actual) : (r.actualBeforeVat ?? (r.actual / 1.14)));
  }, 0);

  const discrepancy = Math.abs(dashboardTotal - Math.round(recordsTotal));

  return {
    isConsistent: discrepancy === 0,
    dashboardTotal,
    recordsTotal: Math.round(recordsTotal),
    staffRankingsTotal: Math.round(recordsTotal),
    discrepancy,
    recordsCount: activeRecords.length,
    totalRecords: state.records.length,
    periodsCount: Object.keys(state.targets).length || 1,
    branchesCount: selectUniqueBranches(state).length || 1,
  };
}

