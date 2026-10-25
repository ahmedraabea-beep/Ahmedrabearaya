import React, { useState, useMemo } from 'react';
import {
  SalesRecord,
  Currency,
  Language,
  BranchTotalTargetStructure,
} from '../types/sales';
import { formatCurrencyNumber, formatPercent } from '../utils/calculations';
import { exportRecordsToExcel } from '../utils/excelParser';
import { calculateAnnualProjection, EGYPT_RETAIL_SEASONAL_FACTORS } from '../utils/forecasting';
import {
  Trophy,
  Award,
  TrendingUp,
  Target,
  Users,
  CheckCircle2,
  Calendar,
  Smartphone,
  Headphones,
  Tv,
  CreditCard,
  DollarSign,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Copy,
  Check,
  Search,
  Filter,
  BarChart3,
  Percent,
  Receipt,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Activity,
  Flame,
  Crown,
  ChevronRight,
  Coins,
  UserPlus,
  UserMinus,
} from 'lucide-react';
import { EmployeeIncentiveProjectionTab } from './EmployeeIncentiveProjectionTab';
import { FutureHiringAndExpansionTab } from './FutureHiringAndExpansionTab';
import { StaffAttritionAndRetentionTab } from './StaffAttritionAndRetentionTab';
import { calculateStaffAttritionMetrics } from '../utils/attritionService';

interface AllAchievementsDashboardProps {
  records: SalesRecord[];
  targetStructure: BranchTotalTargetStructure;
  currency: Currency;
  language: Language;
  vatDisplayMode?: 'afterVat' | 'beforeVat';
  onToggleVatMode?: (mode: 'afterVat' | 'beforeVat') => void;
  onSelectEmployee?: (employeeName: string) => void;
  onOpenMonthlyReport?: () => void;
  onOpenIncentives?: () => void;
}

export const AllAchievementsDashboard: React.FC<AllAchievementsDashboardProps> = ({
  records,
  targetStructure,
  currency,
  language,
  vatDisplayMode = 'afterVat',
  onToggleVatMode,
  onSelectEmployee,
  onOpenMonthlyReport,
  onOpenIncentives,
}) => {
  const isAr = language === 'ar';

  // Filters & State
  const [timeframe, setTimeframe] = useState<'current_month' | 'quarter_q4' | 'all_time'>('current_month');
  const [activeTab, setActiveTab] = useState<'overview' | 'sections' | 'hall_of_fame' | 'velocity' | 'future_incentives' | 'hiring_expansion' | 'variance' | 'annual_projection' | 'attrition_retention'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [selectedConsultant, setSelectedConsultant] = useState<SalesRecord | null>(null);
  const [annualScenario, setAnnualScenario] = useState<'realistic' | 'optimistic' | 'conservative'>('realistic');
  const [selectedQuarterFilter, setSelectedQuarterFilter] = useState<'ALL' | 'Q1' | 'Q2' | 'Q3' | 'Q4'>('ALL');
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number | null>(null);
  const [retentionVersion, setRetentionVersion] = useState(0);

  // Sync cross-component retention updates
  React.useEffect(() => {
    const handleUpdated = () => {
      setRetentionVersion((v) => v + 1);
    };
    window.addEventListener('raya-retention-updated', handleUpdated);
    return () => window.removeEventListener('raya-retention-updated', handleUpdated);
  }, []);

  // Staff Attrition Metrics & Potential Departure Tracking
  const attritionSummary = useMemo(() => {
    return calculateStaffAttritionMetrics(records);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [records, retentionVersion]);

  // Annual projection based on cumulative previous months
  const annualProjection = useMemo(() => {
    return calculateAnnualProjection(records, undefined, 2026);
  }, [records]);

  // Active records based on timeframe
  const activeRecords = useMemo(() => {
    if (timeframe === 'current_month') {
      const monthRecs = records.filter(
        (r) => r.period && (r.period.includes('أكتوبر') || r.period.includes('Oct') || r.period.includes('10'))
      );
      return monthRecs.length > 0 ? monthRecs : records;
    }
    if (timeframe === 'quarter_q4') {
      const q4Recs = records.filter(
        (r) =>
          r.period &&
          (r.period.includes('أكتوبر') ||
            r.period.includes('نوفمبر') ||
            r.period.includes('ديسمبر') ||
            r.period.includes('Oct') ||
            r.period.includes('Nov') ||
            r.period.includes('Dec') ||
            r.period.includes('Q4'))
      );
      return q4Recs.length > 0 ? q4Recs : records;
    }
    // all_time
    return records;
  }, [records, timeframe]);

  // Aggregate Key Achievement Totals
  const achievements = useMemo(() => {
    const isGross = vatDisplayMode === 'afterVat';

    // Target totals
    const multiplier = timeframe === 'quarter_q4' ? 3 : timeframe === 'all_time' ? 4 : 1;
    const baseRevenueTarget = (targetStructure.revenueTarget || 1400000) * multiplier;
    const baseInstallmentTarget = (targetStructure.installmentTarget || 350000) * multiplier;
    const grandTotalTarget = baseRevenueTarget + baseInstallmentTarget;

    // Actual revenue sums
    const totalActualGross = activeRecords.reduce((sum, r) => sum + (r.actualAfterVat || r.actual), 0);
    const totalActualNet = activeRecords.reduce(
      (sum, r) => sum + (r.actualBeforeVat !== undefined ? r.actualBeforeVat : Math.round(r.actual / 1.14)),
      0
    );
    const totalVat = activeRecords.reduce((sum, r) => sum + (r.vatAmount || (r.actual - Math.round(r.actual / 1.14))), 0);
    const activeActualRevenue = isGross ? totalActualGross : totalActualNet;

    // Installments
    const totalInstallmentActual =
      activeRecords.reduce((sum, r) => sum + (r.installmentActual || 0), 0) ||
      (targetStructure.installmentActual || 380000) * multiplier;

    // Grand total actual (Revenue + Installments)
    const grandTotalActual = activeActualRevenue + totalInstallmentActual;

    // Achievement rates
    const revenueAchievementRate = baseRevenueTarget > 0 ? (activeActualRevenue / baseRevenueTarget) * 100 : 0;
    const installmentAchievementRate = baseInstallmentTarget > 0 ? (totalInstallmentActual / baseInstallmentTarget) * 100 : 0;
    const grandTotalAchievementRate = grandTotalTarget > 0 ? (grandTotalActual / grandTotalTarget) * 100 : 0;

    // Variances
    const revenueDifference = activeActualRevenue - baseRevenueTarget;
    const installmentDifference = totalInstallmentActual - baseInstallmentTarget;
    const grandTotalDifference = grandTotalActual - grandTotalTarget;

    // Total Earned Incentives
    const totalIncentives = activeRecords.reduce((sum, r) => sum + (r.earnedIncentive || 0), 0);

    // Consultant Achievers Count
    const totalConsultants = activeRecords.length;
    const achieversList = activeRecords.filter((r) => r.actual >= r.target);
    const nearAchieversList = activeRecords.filter((r) => r.actual < r.target && r.achievementRate >= 90);
    const achieversCount = achieversList.length;
    const achieversRate = totalConsultants > 0 ? (achieversCount / totalConsultants) * 100 : 0;

    // Top Performer
    const sortedByActual = [...activeRecords].sort((a, b) => b.actual - a.actual);
    const topByRevenue = sortedByActual[0];
    const sortedByRate = [...activeRecords].sort((a, b) => b.achievementRate - a.achievementRate);
    const topByRate = sortedByRate[0];
    const sortedByIncentive = [...activeRecords].sort((a, b) => (b.earnedIncentive || 0) - (a.earnedIncentive || 0));
    const topByIncentive = sortedByIncentive[0];

    // Category Breakdowns
    const mobilesTarget = (targetStructure.revenueBreakdown?.mobiles || 910000) * multiplier;
    const mobilesActual = activeRecords.reduce((s, r) => s + (r.mobilesActual || Math.round(r.actual * 0.65)), 0);
    const mobilesRate = mobilesTarget > 0 ? (mobilesActual / mobilesTarget) * 100 : 0;

    const accTarget = (targetStructure.revenueBreakdown?.accessories || 252000) * multiplier;
    const accActual = activeRecords.reduce((s, r) => s + (r.accessoriesActual || Math.round(r.actual * 0.18)), 0);
    const accRate = accTarget > 0 ? (accActual / accTarget) * 100 : 0;

    const otherTarget = (targetStructure.revenueBreakdown?.other || 238000) * multiplier;
    const otherActual = activeRecords.reduce((s, r) => s + (r.otherActual || Math.round(r.actual * 0.17)), 0);
    const otherRate = otherTarget > 0 ? (otherActual / otherTarget) * 100 : 0;

    // Velocity & Run Rate Calculations (for October - 31 Days)
    const daysInMonth = targetStructure.daysInMonth || 31;
    // Current simulated progress day in October (day 24)
    const elapsedDays = Math.min(24, daysInMonth);
    const remainingDays = Math.max(1, daysInMonth - elapsedDays);
    const dailyAchievedRate = elapsedDays > 0 ? activeActualRevenue / elapsedDays : 0;
    const dailyRequiredRate = baseRevenueTarget / daysInMonth;
    const dailyRemainingRequired = Math.max(0, (baseRevenueTarget - activeActualRevenue) / remainingDays);
    const projectedFinalRevenue = dailyAchievedRate * daysInMonth;
    const projectedFinalRate = baseRevenueTarget > 0 ? (projectedFinalRevenue / baseRevenueTarget) * 100 : 0;

    return {
      baseRevenueTarget,
      baseInstallmentTarget,
      grandTotalTarget,
      totalActualGross,
      totalActualNet,
      totalVat,
      activeActualRevenue,
      totalInstallmentActual,
      grandTotalActual,
      revenueAchievementRate,
      installmentAchievementRate,
      grandTotalAchievementRate,
      revenueDifference,
      installmentDifference,
      grandTotalDifference,
      totalIncentives,
      totalConsultants,
      achieversCount,
      achieversRate,
      achieversList,
      nearAchieversList,
      topByRevenue,
      topByRate,
      topByIncentive,
      mobilesTarget,
      mobilesActual,
      mobilesRate,
      accTarget,
      accActual,
      accRate,
      otherTarget,
      otherActual,
      otherRate,
      daysInMonth,
      elapsedDays,
      remainingDays,
      dailyAchievedRate,
      dailyRequiredRate,
      dailyRemainingRequired,
      projectedFinalRevenue,
      projectedFinalRate,
    };
  }, [activeRecords, timeframe, targetStructure, vatDisplayMode]);

  // Filtered consultants by search query
  const filteredConsultants = useMemo(() => {
    if (!searchQuery.trim()) return activeRecords;
    const q = searchQuery.toLowerCase().trim();
    return activeRecords.filter(
      (r) =>
        r.employee.toLowerCase().includes(q) ||
        (r.employeeId && r.employeeId.toLowerCase().includes(q))
    );
  }, [activeRecords, searchQuery]);

  // Copy Executive Achievement Summary to Clipboard
  const handleCopySummary = () => {
    const isGross = vatDisplayMode === 'afterVat';
    const text = `🏆 *تقرير ما تم تحقيقه - فرع راية كونكورد بلازا* 🏆
📅 الفترة: ${timeframe === 'current_month' ? 'أكتوبر 2026' : timeframe === 'quarter_q4' ? 'الربع الرابع Q4' : 'إجمالي كافة الفترات'}
------------------------------------
🎯 تارجت الريفينيو المطلوب: ${formatCurrencyNumber(achievements.baseRevenueTarget)} ج.م
💰 إجمالي ما تم تحقيقه (${isGross ? 'شامل الضريبة 14%' : 'صافي قبل الضريبة'}): ${formatCurrencyNumber(achievements.activeActualRevenue)} ج.م
📈 نسبة تحقيق الهدف: ${achievements.revenueAchievementRate.toFixed(1)}%
${achievements.revenueDifference >= 0 ? `✨ الفائض المحقق: +${formatCurrencyNumber(achievements.revenueDifference)} ج.م` : `⚠️ المتبقي: ${formatCurrencyNumber(Math.abs(achievements.revenueDifference))} ج.م`}

💳 إنجاز التقسيط (أمان/فاليو): ${formatCurrencyNumber(achievements.totalInstallmentActual)} ج.م (${achievements.installmentAchievementRate.toFixed(1)}%)
💎 إجمالي مستحقات الحوافز: ${formatCurrencyNumber(achievements.totalIncentives)} ج.م
👥 نسبة نجاح المستشارين: ${achievements.achieversCount} من أصل ${achievements.totalConsultants} (${achievements.achieversRate.toFixed(0)}%)

🥇 فارس المبيعات الأول: ${achievements.topByRevenue?.employee || 'مستشار راية'} (${formatCurrencyNumber(achievements.topByRevenue?.actual || 0)} ج.م)
🎯 أعلى نسبة تحقيق: ${achievements.topByRate?.employee || 'مستشار راية'} (${achievements.topByRate?.achievementRate.toFixed(1)}%)
------------------------------------
منظومة إدارة المبيعات والحوافز التنفيذية - فرع كونكورد بلازا`;

    navigator.clipboard.writeText(text).then(() => {
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2500);
    });
  };

  // Export to Excel
  const handleExportAchievementsExcel = () => {
    const filename = `تقرير_إنجازات_راية_كونكورد_${timeframe}.xlsx`;
    exportRecordsToExcel(activeRecords, filename, language);
  };

  return (
    <section
      id="achievements-dashboard"
      className="bg-white rounded-3xl border-2 border-emerald-600/30 shadow-xl overflow-hidden transition-all duration-300"
    >
      {/* 1. Header Banner & Executive Controls */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white p-5 sm:p-7 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1.5 shadow-xs">
                <Trophy className="w-3.5 h-3.5 text-amber-400 fill-amber-400 animate-bounce" />
                <span>{isAr ? 'لوحة قيادة الإنجازات والنتائج المحققة' : 'Achievements Command Center'}</span>
              </span>

              <span className="bg-amber-500/20 text-amber-300 border border-amber-400/40 text-xs px-2.5 py-0.5 rounded-full font-bold font-mono">
                {isAr ? 'راية كونكورد بلازا' : 'Raya Concorde Plaza'}
              </span>

              <span className="text-xs text-slate-300 font-medium">
                {isAr ? 'تحديث فوري لنتائج المبيعات والأهداف والحوافز' : 'Live Real-Time Actuals & Targets Sync'}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
              <span>
                {isAr
                  ? 'داش بورد شامل لكل ما تم تحقيقه في الفرع'
                  : 'Comprehensive Branch Achievements & Results Dashboard'}
              </span>
              <Sparkles className="w-6 h-6 text-amber-400 shrink-0" />
            </h2>

            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed max-w-3xl">
              {isAr
                ? 'رصد متكامل وشامل لكافة مبيعات الريفينيو المحققة، محفظة التقسيط، أداء الأقسام (موبايل، إكسسوار، شاشات)، عمولات وحوافز الفريق، مع مقارنة حية بين التارجت المطلوب والفعلي ونسب الإنجاز.'
                : 'Complete visibility into all achieved revenue, installment volume, product category breakdown, consultant incentives, and live variance vs target.'}
            </p>
          </div>

          {/* Timeframe Filter & Quick Export Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            {/* Segmented Timeframe Control */}
            <div className="inline-flex p-1 bg-slate-800/80 rounded-xl border border-slate-700">
              <button
                type="button"
                onClick={() => setTimeframe('current_month')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  timeframe === 'current_month'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {isAr ? 'أكتوبر (الحالي)' : 'Oct (Current)'}
              </button>

              <button
                type="button"
                onClick={() => setTimeframe('quarter_q4')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  timeframe === 'quarter_q4'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {isAr ? 'الربع الرابع Q4' : 'Q4 Quarter'}
              </button>

              <button
                type="button"
                onClick={() => setTimeframe('all_time')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  timeframe === 'all_time'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {isAr ? 'التراكمي الشامل' : 'All-Time'}
              </button>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopySummary}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 text-xs font-bold transition-all cursor-pointer shadow-xs"
                title={isAr ? 'نسخ ملخص الإنجازات للمدير الإقليمي' : 'Copy summary'}
              >
                {copiedSummary ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">{isAr ? 'تم النسخ!' : 'Copied!'}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-300" />
                    <span>{isAr ? 'نسخ التقرير' : 'Copy'}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleExportAchievementsExcel}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer shadow-md"
                title={isAr ? 'تصدير شيت الإنجازات إلى إكسيل' : 'Export to Excel'}
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isAr ? 'تصدير Excel' : 'Excel'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* VAT Display Mode Strip */}
        <div className="relative z-10 mt-5 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Receipt className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold">
              {isAr ? 'نظام العرض المحاسبي للمبيعات المحققة:' : 'VAT Accounting Mode:'}
            </span>
            <div className="inline-flex p-0.5 bg-slate-800 rounded-lg border border-slate-700">
              <button
                type="button"
                onClick={() => onToggleVatMode && onToggleVatMode('afterVat')}
                className={`px-2.5 py-1 rounded-md font-bold text-xs transition-colors cursor-pointer ${
                  vatDisplayMode === 'afterVat'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {isAr ? 'شامل ضريبة 14% (Gross)' : 'Post-VAT (14%)'}
              </button>
              <button
                type="button"
                onClick={() => onToggleVatMode && onToggleVatMode('beforeVat')}
                className={`px-2.5 py-1 rounded-md font-bold text-xs transition-colors cursor-pointer ${
                  vatDisplayMode === 'beforeVat'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {isAr ? 'صافي قبل الضريبة (Net)' : 'Pre-VAT (Net)'}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 text-slate-300 font-mono text-[11px]">
            <span>
              {isAr ? 'الصافي قبل الضريبة:' : 'Net Pre-VAT:'}{' '}
              <strong className="text-white">{formatCurrencyNumber(achievements.totalActualNet)} ج.م</strong>
            </span>
            <span className="text-slate-600">|</span>
            <span>
              {isAr ? 'ضريبة 14% الموردة:' : '14% VAT:'}{' '}
              <strong className="text-amber-300">{formatCurrencyNumber(achievements.totalVat)} ج.م</strong>
            </span>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-7 space-y-6">
        {/* 2. Top Tier: 4 Milestone Cards (المؤشرات الكبرى لما تم تحقيقه) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Revenue Achieved */}
          <div className="bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white rounded-2xl p-5 border border-emerald-200 shadow-sm relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                  {isAr ? 'إجمالي المبيعات المحققة' : 'Total Revenue Achieved'}
                </span>
                <div className="text-2xl sm:text-3xl font-black text-emerald-950 font-mono mt-1">
                  {formatCurrencyNumber(achievements.activeActualRevenue)}{' '}
                  <span className="text-xs font-normal text-slate-500">ج.م</span>
                </div>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shrink-0">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>

            <div className="mt-3.5 pt-3 border-t border-emerald-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <span
                  className={`inline-flex items-center gap-0.5 font-bold font-mono px-2 py-0.5 rounded-md text-[11px] ${
                    achievements.revenueAchievementRate >= 100
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>{achievements.revenueAchievementRate.toFixed(1)}%</span>
                </span>
                <span className="text-slate-600 text-[11px]">
                  {isAr ? 'من التارجت المطلوب' : 'of Target'}
                </span>
              </div>

              <span className="text-[11px] font-semibold text-emerald-700 font-mono">
                {achievements.revenueDifference >= 0
                  ? `+${formatCurrencyNumber(achievements.revenueDifference)} فائض`
                  : `${formatCurrencyNumber(Math.abs(achievements.revenueDifference))} متبقي`}
              </span>
            </div>

            {/* Achievement Bar */}
            <div className="w-full bg-emerald-100 rounded-full h-2 mt-2.5 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                style={{ width: `${Math.min(100, achievements.revenueAchievementRate)}%` }}
              />
            </div>
          </div>

          {/* Card 2: Installments & Consumer Finance Achieved */}
          <div className="bg-gradient-to-br from-blue-50 via-indigo-50/50 to-white rounded-2xl p-5 border border-blue-200 shadow-sm relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider block">
                  {isAr ? 'محفظة التقسيط المحققة (أمان/فاليو)' : 'Installment Portfolio Achieved'}
                </span>
                <div className="text-2xl sm:text-3xl font-black text-blue-950 font-mono mt-1">
                  {formatCurrencyNumber(achievements.totalInstallmentActual)}{' '}
                  <span className="text-xs font-normal text-slate-500">ج.م</span>
                </div>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shrink-0">
                <CreditCard className="w-6 h-6" />
              </div>
            </div>

            <div className="mt-3.5 pt-3 border-t border-blue-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <span
                  className={`inline-flex items-center gap-0.5 font-bold font-mono px-2 py-0.5 rounded-md text-[11px] ${
                    achievements.installmentAchievementRate >= 100
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>{achievements.installmentAchievementRate.toFixed(1)}%</span>
                </span>
                <span className="text-slate-600 text-[11px]">
                  {isAr ? 'من مستهدف التقسيط' : 'of Installment Goal'}
                </span>
              </div>

              <span className="text-[11px] font-semibold text-blue-700 font-mono">
                {achievements.installmentDifference >= 0
                  ? `+${formatCurrencyNumber(achievements.installmentDifference)} فائض`
                  : `${formatCurrencyNumber(Math.abs(achievements.installmentDifference))} متبقي`}
              </span>
            </div>

            <div className="w-full bg-blue-100 rounded-full h-2 mt-2.5 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
                style={{ width: `${Math.min(100, achievements.installmentAchievementRate)}%` }}
              />
            </div>
          </div>

          {/* Card 3: Incentives & Commissions Portfolio */}
          <div className="bg-gradient-to-br from-amber-50 via-orange-50/40 to-white rounded-2xl p-5 border border-amber-200 shadow-sm relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
                  {isAr ? 'الحوافز والعمولات المعتمدة' : 'Total Earned Incentives'}
                </span>
                <div className="text-2xl sm:text-3xl font-black text-amber-950 font-mono mt-1">
                  {formatCurrencyNumber(achievements.totalIncentives)}{' '}
                  <span className="text-xs font-normal text-slate-500">ج.م</span>
                </div>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shrink-0">
                <Award className="w-6 h-6" />
              </div>
            </div>

            <div className="mt-3.5 pt-3 border-t border-amber-100 flex items-center justify-between text-xs">
              <span className="text-slate-600 text-[11px]">
                {isAr ? 'أعلى حافز فردي:' : 'Top Incentive:'}
              </span>
              <span className="text-[11px] font-bold text-amber-900 font-mono">
                {achievements.topByIncentive?.employee || 'مستشار'}:{' '}
                {formatCurrencyNumber(achievements.topByIncentive?.earnedIncentive || 0)} ج.م
              </span>
            </div>

            <div className="w-full bg-amber-100 rounded-full h-2 mt-2.5 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-500"
                style={{
                  width: `${Math.min(
                    100,
                    achievements.activeActualRevenue > 0
                      ? (achievements.totalIncentives / (achievements.activeActualRevenue * 0.03)) * 100
                      : 80
                  )}%`,
                }}
              />
            </div>
          </div>

          {/* Card 4: Consultant Achievers Ratio */}
          <div className="bg-gradient-to-br from-purple-50 via-fuchsia-50/40 to-white rounded-2xl p-5 border border-purple-200 shadow-sm relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold text-purple-800 uppercase tracking-wider block">
                  {isAr ? 'كفاءة المستشارين المحققين' : 'Consultant Success Rate'}
                </span>
                <div className="text-2xl sm:text-3xl font-black text-purple-950 font-mono mt-1 flex items-baseline gap-1.5">
                  <span>{achievements.achieversCount}</span>
                  <span className="text-sm font-bold text-slate-400">/ {achievements.totalConsultants}</span>
                  <span className="text-xs font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full font-mono">
                    {achievements.achieversRate.toFixed(0)}%
                  </span>
                </div>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md shrink-0">
                <Users className="w-6 h-6" />
              </div>
            </div>

            <div className="mt-3.5 pt-3 border-t border-purple-100 flex items-center justify-between text-xs">
              <span className="text-slate-600 text-[11px]">
                {achievements.nearAchieversList.length > 0
                  ? isAr
                    ? `${achievements.nearAchieversList.length} مستشار على وشك الإغلاق (>90%)`
                    : `${achievements.nearAchieversList.length} near target`
                  : isAr
                  ? 'أداء متميز للفريق بالكامل'
                  : 'High team performance'}
              </span>

              <button
                type="button"
                onClick={() => setActiveTab('hall_of_fame')}
                className="text-[11px] font-bold text-purple-700 hover:text-purple-900 inline-flex items-center gap-0.5 cursor-pointer"
              >
                <span>{isAr ? 'لوحة الشرف' : 'Hall of Fame'}</span>
                <ChevronRight className={`w-3.5 h-3.5 ${isAr ? 'rotate-180' : ''}`} />
              </button>
            </div>

            <div className="w-full bg-purple-100 rounded-full h-2 mt-2.5 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-500 transition-all duration-500"
                style={{ width: `${Math.min(100, achievements.achieversRate)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Executive Staff Attrition Rate & Potential Departure Indicator (User Request) */}
        <div className="bg-gradient-to-r from-slate-900 via-rose-950/80 to-slate-900 text-white rounded-2xl p-4 sm:p-5 border border-rose-800/40 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center justify-center shrink-0 shadow-xs">
              <ShieldAlert className="w-5 h-5 text-rose-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-rose-300 uppercase tracking-wider">
                  {isAr ? 'مؤشر معدل استنزاف الموظفين (Staff Attrition Rate)' : 'Staff Attrition Risk Monitor'}
                </span>
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                    attritionSummary.adjustedAttritionRatePostActionsPct === 0
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : attritionSummary.adjustedAttritionRatePostActionsPct <= 15
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  }`}
                >
                  {attritionSummary.adjustedAttritionRatePostActionsPct === 0
                    ? (isAr ? '✓ تم تأمين الكفاءات' : 'Protected')
                    : (isAr ? '⚠️ مخاطر استنزاف للمتميزين' : 'Talent Risk')}
                </span>
              </div>

              <div className="flex items-baseline gap-2 mt-1 flex-wrap">
                <span className="text-2xl font-black text-white font-mono">
                  {attritionSummary.adjustedAttritionRatePostActionsPct}%
                </span>
                <span className="text-xs text-rose-200">
                  {isAr ? 'معدل الاستنزاف المتوقع للكوادر المتميزة' : 'projected star attrition'}
                </span>
                <span className="text-slate-500 text-xs">·</span>
                <span className="text-xs text-slate-300 font-mono">
                  {isAr ? 'أقرب نافذة مغادرة محتملة:' : 'Nearest departure window:'}{' '}
                  <strong className="text-amber-300 font-bold">
                    {attritionSummary.nearestDepartureEmployee} ({attritionSummary.nearestDepartureDate})
                  </strong>
                </span>
                <span className="text-slate-500 text-xs">·</span>
                <span className="text-xs text-indigo-200 font-mono">
                  {isAr ? 'مبيعات معرضة للخطر:' : 'Revenue at risk:'}{' '}
                  <strong className="text-white font-bold">
                    {formatCurrencyNumber(attritionSummary.totalMonthlyRevenueAtRisk)} ج.م/شهر
                  </strong>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab('attrition_retention')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <span>{isAr ? 'عرض قرارات الاستبقاء الاستباقية' : 'View Retention Decisions'}</span>
              <ChevronRight className={`w-3.5 h-3.5 ${isAr ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* 3. Middle Tier: Interactive Navigation Tabs */}
        <div className="flex items-center gap-1.5 border-b border-slate-200 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'overview', label: isAr ? 'نظرة شاملة ومقارنة الإنجاز' : 'Overview & Grand Balance', icon: BarChart3 },
            { id: 'sections', label: isAr ? 'إنجازات الأقسام والمنتجات' : 'Category Achievements', icon: Smartphone },
            { id: 'hall_of_fame', label: isAr ? 'لوحة شرف فرسان المبيعات' : 'Achievers Hall of Fame', icon: Crown },
            { id: 'velocity', label: isAr ? 'وتيرة التحقيق اليومية والمحاكاة' : 'Daily Run-Rate & Velocity', icon: Flame },
            { id: 'future_incentives', label: isAr ? 'توقع الحوافز المستقبلي والشرائح' : 'Incentive Forecast & Tiers', icon: Coins },
            { id: 'hiring_expansion', label: isAr ? 'احتياجات التوظيف والتوسع' : 'Staffing & Expansion', icon: UserPlus },
            { id: 'attrition_retention', label: isAr ? 'استنزاف واستبقاء المواهب' : 'Staff Attrition & Retention', icon: ShieldAlert },
            { id: 'variance', label: isAr ? 'جدول الميزان المحاسبي والفروقات' : 'Variance Ledger', icon: Receipt },
            { id: 'annual_projection', label: isAr ? 'التوقعات السنوية ونمو الفرع (Annual)' : 'Annual Projections & Growth', icon: TrendingUp },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-emerald-800 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-300' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: OVERVIEW & GRAND TOTAL BALANCE */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Grand Total Performance Banner */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white rounded-2xl p-6 border border-slate-700 shadow-md">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[11px] font-bold">
                      {isAr ? 'الإجمالي العام للفرع' : 'Branch Grand Total'}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {isAr ? 'المبيعات النقدية والآجلة + التقسيط الاستهلاكي' : 'Cash/Card Revenue + Consumer Installment'}
                    </span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-black text-white">
                    {formatCurrencyNumber(achievements.grandTotalActual)}{' '}
                    <span className="text-sm font-normal text-slate-400">ج.م محقق كلياً</span>
                  </h3>

                  <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                    {isAr
                      ? `حقق الفرع إجمالي مبيعات شاملة بقيمة ${formatCurrencyNumber(achievements.grandTotalActual)} ج.م مقابل المستهدف الكلي البالغ ${formatCurrencyNumber(achievements.grandTotalTarget)} ج.م، بنسبة إنجاز إجمالية تبلغ ${achievements.grandTotalAchievementRate.toFixed(1)}%.`
                      : `The branch generated a combined total of ${formatCurrencyNumber(achievements.grandTotalActual)} EGP against a grand target of ${formatCurrencyNumber(achievements.grandTotalTarget)} EGP, reaching an overall rate of ${achievements.grandTotalAchievementRate.toFixed(1)}%.`}
                  </p>
                </div>

                {/* Progress Ring / Gauge Simulation */}
                <div className="flex items-center gap-5 bg-slate-800/80 p-4 rounded-xl border border-slate-700/80 shrink-0">
                  <div className="text-center">
                    <div className="text-3xl sm:text-4xl font-black text-emerald-400 font-mono leading-none">
                      {achievements.grandTotalAchievementRate.toFixed(1)}%
                    </div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block mt-1">
                      {isAr ? 'نسبة الإنجاز الكلية' : 'Grand Target Rate'}
                    </span>
                  </div>

                  <div className="w-px h-12 bg-slate-700" />

                  <div className="space-y-1 text-xs">
                    <div className="flex items-center justify-between gap-3 font-mono">
                      <span className="text-slate-400">{isAr ? 'الريفينيو:' : 'Revenue:'}</span>
                      <strong className="text-emerald-300">{achievements.revenueAchievementRate.toFixed(1)}%</strong>
                    </div>
                    <div className="flex items-center justify-between gap-3 font-mono">
                      <span className="text-slate-400">{isAr ? 'التقسيط:' : 'Installment:'}</span>
                      <strong className="text-blue-300">{achievements.installmentAchievementRate.toFixed(1)}%</strong>
                    </div>
                    <div className="flex items-center justify-between gap-3 font-mono">
                      <span className="text-slate-400">{isAr ? 'الفارق المالي:' : 'Variance:'}</span>
                      <strong className={achievements.grandTotalDifference >= 0 ? 'text-amber-400' : 'text-rose-400'}>
                        {achievements.grandTotalDifference >= 0 ? '+' : ''}
                        {formatCurrencyNumber(achievements.grandTotalDifference)} ج.م
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Overview Columns: Key Strengths & Spotlight */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Highlight 1: Top Revenue Leader */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-500 uppercase">
                      {isAr ? '🥇 بطل المبيعات الأول' : 'Top Revenue Performer'}
                    </span>
                    <Crown className="w-5 h-5 text-amber-500" />
                  </div>
                  <h4 className="text-lg font-black text-slate-900">
                    {achievements.topByRevenue?.employee || 'مستشار المبيعات'}
                  </h4>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    {achievements.topByRevenue?.employeeId ? `كود: ${achievements.topByRevenue.employeeId}` : 'فرع كونكورد بلازا'}
                  </p>
                  <div className="mt-3 text-xl font-black text-emerald-800 font-mono">
                    {formatCurrencyNumber(achievements.topByRevenue?.actual || 0)} ج.م
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-600">
                    {isAr ? 'نسبة الإنجاز:' : 'Achievement:'}{' '}
                    <strong className="text-emerald-700 font-mono">
                      {achievements.topByRevenue?.achievementRate.toFixed(1)}%
                    </strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => onSelectEmployee && onSelectEmployee(achievements.topByRevenue?.employee || '')}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer"
                  >
                    {isAr ? 'عرض التفاصيل' : 'View'}
                  </button>
                </div>
              </div>

              {/* Highlight 2: Highest Target % */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-500 uppercase">
                      {isAr ? '🎯 أعلى نسبة تحقيق تارجت' : 'Highest Target %'}
                    </span>
                    <Target className="w-5 h-5 text-emerald-600" />
                  </div>
                  <h4 className="text-lg font-black text-slate-900">
                    {achievements.topByRate?.employee || 'مستشار المبيعات'}
                  </h4>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    {achievements.topByRate?.employeeId ? `كود: ${achievements.topByRate.employeeId}` : 'فرع كونكورد بلازا'}
                  </p>
                  <div className="mt-3 text-xl font-black text-emerald-700 font-mono">
                    {achievements.topByRate?.achievementRate.toFixed(1)}%
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-600">
                    {isAr ? 'المبيعات المحققة:' : 'Actual:'}{' '}
                    <strong className="text-slate-800 font-mono">
                      {formatCurrencyNumber(achievements.topByRate?.actual || 0)} ج.م
                    </strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => onSelectEmployee && onSelectEmployee(achievements.topByRate?.employee || '')}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer"
                  >
                    {isAr ? 'عرض التفاصيل' : 'View'}
                  </button>
                </div>
              </div>

              {/* Highlight 3: Top Commission & Incentive */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-500 uppercase">
                      {isAr ? '💎 أعلى مستحق حوافز' : 'Top Incentive Earner'}
                    </span>
                    <Award className="w-5 h-5 text-amber-500" />
                  </div>
                  <h4 className="text-lg font-black text-slate-900">
                    {achievements.topByIncentive?.employee || 'مستشار المبيعات'}
                  </h4>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    {achievements.topByIncentive?.employeeId ? `كود: ${achievements.topByIncentive.employeeId}` : 'فرع كونكورد بلازا'}
                  </p>
                  <div className="mt-3 text-xl font-black text-amber-900 font-mono">
                    {formatCurrencyNumber(achievements.topByIncentive?.earnedIncentive || 0)} ج.م
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-600">
                    {isAr ? 'نسبة التحقيق:' : 'Target %:'}{' '}
                    <strong className="text-amber-800 font-mono">
                      {achievements.topByIncentive?.achievementRate.toFixed(1)}%
                    </strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => onOpenIncentives && onOpenIncentives()}
                    className="text-xs font-bold text-amber-700 hover:text-amber-900 cursor-pointer"
                  >
                    {isAr ? 'شيت الحوافز' : 'Incentives'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CATEGORY ACHIEVEMENTS (إنجازات الأقسام والمنتجات) */}
        {activeTab === 'sections' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Category 1: Smartphones */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-emerald-300 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {achievements.mobilesRate.toFixed(1)}%
                    </span>
                  </div>
                  <h4 className="text-base font-black text-slate-900">
                    {isAr ? 'الهواتف الذكية (Mobiles)' : 'Smartphones'}
                  </h4>
                  <div className="text-2xl font-black text-emerald-950 font-mono mt-2">
                    {formatCurrencyNumber(achievements.mobilesActual)}{' '}
                    <span className="text-xs font-normal text-slate-500">ج.م</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-500">
                    <span>{isAr ? 'التارجت المطلوب:' : 'Target:'}</span>
                    <strong className="text-slate-800 font-mono">{formatCurrencyNumber(achievements.mobilesTarget)} ج.م</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-500">
                    <span>{isAr ? 'الفارق المالي:' : 'Variance:'}</span>
                    <strong className={achievements.mobilesActual >= achievements.mobilesTarget ? 'text-emerald-700 font-mono' : 'text-rose-600 font-mono'}>
                      {achievements.mobilesActual >= achievements.mobilesTarget ? '+' : ''}
                      {formatCurrencyNumber(achievements.mobilesActual - achievements.mobilesTarget)} ج.م
                    </strong>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden mt-1">
                    <div
                      className="h-full bg-emerald-600 rounded-full"
                      style={{ width: `${Math.min(100, achievements.mobilesRate)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Category 2: Accessories */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-blue-300 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center">
                      <Headphones className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                      {achievements.accRate.toFixed(1)}%
                    </span>
                  </div>
                  <h4 className="text-base font-black text-slate-900">
                    {isAr ? 'الإكسسوارات والسماعات' : 'Accessories'}
                  </h4>
                  <div className="text-2xl font-black text-blue-950 font-mono mt-2">
                    {formatCurrencyNumber(achievements.accActual)}{' '}
                    <span className="text-xs font-normal text-slate-500">ج.م</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-500">
                    <span>{isAr ? 'التارجت المطلوب:' : 'Target:'}</span>
                    <strong className="text-slate-800 font-mono">{formatCurrencyNumber(achievements.accTarget)} ج.م</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-500">
                    <span>{isAr ? 'الفارق المالي:' : 'Variance:'}</span>
                    <strong className={achievements.accActual >= achievements.accTarget ? 'text-blue-700 font-mono' : 'text-rose-600 font-mono'}>
                      {achievements.accActual >= achievements.accTarget ? '+' : ''}
                      {formatCurrencyNumber(achievements.accActual - achievements.accTarget)} ج.م
                    </strong>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden mt-1">
                    <div
                      className="h-full bg-blue-600 rounded-full"
                      style={{ width: `${Math.min(100, achievements.accRate)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Category 3: Screens & Other */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-amber-300 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center">
                      <Tv className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                      {achievements.otherRate.toFixed(1)}%
                    </span>
                  </div>
                  <h4 className="text-base font-black text-slate-900">
                    {isAr ? 'الشاشات والأجهزة المنزلية' : 'Screens & Appliances'}
                  </h4>
                  <div className="text-2xl font-black text-amber-950 font-mono mt-2">
                    {formatCurrencyNumber(achievements.otherActual)}{' '}
                    <span className="text-xs font-normal text-slate-500">ج.م</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-500">
                    <span>{isAr ? 'التارجت المطلوب:' : 'Target:'}</span>
                    <strong className="text-slate-800 font-mono">{formatCurrencyNumber(achievements.otherTarget)} ج.م</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-500">
                    <span>{isAr ? 'الفارق المالي:' : 'Variance:'}</span>
                    <strong className={achievements.otherActual >= achievements.otherTarget ? 'text-amber-700 font-mono' : 'text-rose-600 font-mono'}>
                      {achievements.otherActual >= achievements.otherTarget ? '+' : ''}
                      {formatCurrencyNumber(achievements.otherActual - achievements.otherTarget)} ج.م
                    </strong>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden mt-1">
                    <div
                      className="h-full bg-amber-600 rounded-full"
                      style={{ width: `${Math.min(100, achievements.otherRate)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Category 4: Aman Installments */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-purple-300 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-800 flex items-center justify-center">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200">
                      {achievements.installmentAchievementRate.toFixed(1)}%
                    </span>
                  </div>
                  <h4 className="text-base font-black text-slate-900">
                    {isAr ? 'تمويل أمان وفاليو (التقسيط)' : 'Consumer Installment'}
                  </h4>
                  <div className="text-2xl font-black text-purple-950 font-mono mt-2">
                    {formatCurrencyNumber(achievements.totalInstallmentActual)}{' '}
                    <span className="text-xs font-normal text-slate-500">ج.م</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-500">
                    <span>{isAr ? 'التارجت المطلوب:' : 'Target:'}</span>
                    <strong className="text-slate-800 font-mono">{formatCurrencyNumber(achievements.baseInstallmentTarget)} ج.م</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-500">
                    <span>{isAr ? 'الفارق المالي:' : 'Variance:'}</span>
                    <strong className={achievements.totalInstallmentActual >= achievements.baseInstallmentTarget ? 'text-purple-700 font-mono' : 'text-rose-600 font-mono'}>
                      {achievements.totalInstallmentActual >= achievements.baseInstallmentTarget ? '+' : ''}
                      {formatCurrencyNumber(achievements.installmentDifference)} ج.م
                    </strong>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden mt-1">
                    <div
                      className="h-full bg-purple-600 rounded-full"
                      style={{ width: `${Math.min(100, achievements.installmentAchievementRate)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ACHIEVERS HALL OF FAME (لوحة شرف فرسان المبيعات) */}
        {activeTab === 'hall_of_fame' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Search filter for consultants */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative max-w-sm w-full">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isAr ? 'ابحث عن مستشار أو كود وظيفي...' : 'Search consultant or code...'}
                  className="w-full pr-9 pl-4 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div className="text-xs text-slate-500 font-semibold">
                {isAr
                  ? `يتم عرض ${filteredConsultants.length} مستشار مبيعات معتمد`
                  : `Showing ${filteredConsultants.length} consultants`}
              </div>
            </div>

            {/* Consultant Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredConsultants.map((rec, index) => {
                const isTop1 = index === 0;
                const isOver100 = rec.actual >= rec.target;
                const mobilesVal = rec.mobilesActual || Math.round(rec.actual * 0.65);
                const accVal = rec.accessoriesActual || Math.round(rec.actual * 0.18);

                return (
                  <div
                    key={rec.id}
                    className={`bg-white rounded-2xl p-5 border transition-all duration-200 relative overflow-hidden ${
                      isTop1
                        ? 'border-amber-400 shadow-md ring-1 ring-amber-400/40 bg-gradient-to-br from-amber-50/20 via-white to-white'
                        : isOver100
                        ? 'border-emerald-200 shadow-xs hover:border-emerald-400'
                        : 'border-slate-200 shadow-xs hover:border-slate-300'
                    }`}
                  >
                    {isTop1 && (
                      <div className="absolute -top-3 -left-3 bg-amber-500 text-white w-12 h-12 rounded-full flex items-end justify-center pb-1 text-xs font-black shadow-md rotate-12">
                        👑
                      </div>
                    )}

                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-black text-slate-900 text-sm">{rec.employee}</h4>
                          {isOver100 ? (
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>{isAr ? 'محقق' : 'Achieved'}</span>
                            </span>
                          ) : (
                            <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              {isAr ? 'في المسار' : 'In Progress'}
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {rec.employeeId ? `كود: ${rec.employeeId}` : rec.branch}
                        </p>
                      </div>

                      <div className="text-right">
                        <div className="text-base font-black text-slate-900 font-mono">
                          {rec.achievementRate.toFixed(1)}%
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {isAr ? 'نسبة الهدف' : 'Target Rate'}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 rounded-full h-2 my-3 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isOver100
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                            : 'bg-gradient-to-r from-amber-400 to-amber-500'
                        }`}
                        style={{ width: `${Math.min(100, rec.achievementRate)}%` }}
                      />
                    </div>

                    {/* Numbers Grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs py-2 bg-slate-50/70 rounded-xl p-2.5 border border-slate-100 font-mono">
                      <div>
                        <span className="text-[10px] text-slate-500 block">
                          {isAr ? 'المبيعات المحققة:' : 'Actual:'}
                        </span>
                        <strong className="text-slate-900 font-bold">
                          {formatCurrencyNumber(rec.actual)} ج.م
                        </strong>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-500 block">
                          {isAr ? 'التارجت المطلوب:' : 'Target:'}
                        </span>
                        <strong className="text-slate-600 font-bold">
                          {formatCurrencyNumber(rec.target)} ج.م
                        </strong>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-500 block">
                          {isAr ? 'مبيعات الموبايل:' : 'Mobiles:'}
                        </span>
                        <strong className="text-emerald-700 font-bold">
                          {formatCurrencyNumber(mobilesVal)} ج.م
                        </strong>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-500 block">
                          {isAr ? 'الحافز المعتمد:' : 'Incentive:'}
                        </span>
                        <strong className="text-amber-800 font-bold">
                          {formatCurrencyNumber(rec.earnedIncentive || 0)} ج.م
                        </strong>
                      </div>
                    </div>

                    {/* Footer button */}
                    <div className="mt-3 flex items-center justify-between text-xs pt-2">
                      <span className="text-[11px] font-semibold text-slate-500 font-mono">
                        {rec.difference >= 0
                          ? `+${formatCurrencyNumber(rec.difference)} ج.م فائض`
                          : `${formatCurrencyNumber(Math.abs(rec.difference))} ج.م متبقي`}
                      </span>

                      <button
                        type="button"
                        onClick={() => onSelectEmployee && onSelectEmployee(rec.employee)}
                        className="text-xs font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer inline-flex items-center gap-1"
                      >
                        <span>{isAr ? 'عرض في الجدول' : 'Select'}</span>
                        <ChevronRight className={`w-3 h-3 ${isAr ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: VELOCITY & DAILY RUN-RATE (وتيرة التحقيق والمحاكاة) */}
        {activeTab === 'velocity' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
                <span className="text-xs font-bold text-slate-500 uppercase block mb-1">
                  {isAr ? 'وتيرة المبيعات اليومية الفعلية' : 'Actual Daily Run-Rate'}
                </span>
                <div className="text-2xl font-black text-emerald-950 font-mono">
                  {formatCurrencyNumber(Math.round(achievements.dailyAchievedRate))}{' '}
                  <span className="text-xs font-normal text-slate-500">ج.م / يوم</span>
                </div>
                <p className="text-xs text-slate-600 mt-2">
                  {isAr
                    ? `محسوبة على مدار ${achievements.elapsedDays} يوماً مضت من الشهر.`
                    : `Based on ${achievements.elapsedDays} elapsed days.`}
                </p>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
                <span className="text-xs font-bold text-slate-500 uppercase block mb-1">
                  {isAr ? 'المطلوب يومياً لتحقيق التارجت' : 'Required Daily Target'}
                </span>
                <div className="text-2xl font-black text-slate-900 font-mono">
                  {formatCurrencyNumber(Math.round(achievements.dailyRequiredRate))}{' '}
                  <span className="text-xs font-normal text-slate-500">ج.م / يوم</span>
                </div>
                <p className="text-xs text-slate-600 mt-2">
                  {achievements.dailyAchievedRate >= achievements.dailyRequiredRate ? (
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {isAr ? 'وتيرة المبيعات تتجاوز المطلوب بنجاح' : 'Ahead of pace'}
                    </span>
                  ) : (
                    <span className="text-amber-700 font-bold">
                      {isAr ? `مطلوب ${formatCurrencyNumber(Math.round(achievements.dailyRemainingRequired))} ج.م/يوم للأيام المتبقية` : 'Catch up required'}
                    </span>
                  )}
                </p>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
                <span className="text-xs font-bold text-slate-500 uppercase block mb-1">
                  {isAr ? 'المبيعات المتوقعة بنهاية الشهر' : 'Projected Month-End'}
                </span>
                <div className="text-2xl font-black text-purple-950 font-mono">
                  {formatCurrencyNumber(Math.round(achievements.projectedFinalRevenue))}{' '}
                  <span className="text-xs font-normal text-slate-500">ج.م</span>
                </div>
                <div className="mt-2 text-xs text-purple-800 font-bold">
                  {isAr
                    ? `توقع إغلاق الشهر بنسبة: ${achievements.projectedFinalRate.toFixed(1)}%`
                    : `Estimated close rate: ${achievements.projectedFinalRate.toFixed(1)}%`}
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 text-xs text-slate-700 space-y-2">
              <h4 className="font-bold text-slate-900 flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-500" />
                <span>{isAr ? 'تحليل مسار الزخم البيعي لفرع كونكورد بلازا:' : 'Branch Sales Velocity Insights:'}</span>
              </h4>
              <p className="leading-relaxed">
                {isAr
                  ? `بناءً على وتيرة التحقيق اليومية المسجلة (${formatCurrencyNumber(Math.round(achievements.dailyAchievedRate))} ج.م/يوم)، يتمتع الفرع بزخم إيجابي ممتاز يمكنه من تحقيق فائض مالي يتجاوز مستهدف الإدارة الإقليمية. يوصى بتركيز الأيام المتبقية (${achievements.remainingDays} يوم) على حزم إكسسوارات الهواتف وعروض التقسيط مع أمان لتحقيق أعلى عوائد حوافز للمستشارين.`
                  : `At the current run-rate of ${formatCurrencyNumber(Math.round(achievements.dailyAchievedRate))} EGP/day, the branch is trending to beat target expectations. Maintaining focus on accessories and installments will maximize team payouts.`}
              </p>
            </div>
          </div>
        )}

        {/* TAB: EMPLOYEE FUTURE INCENTIVE FORECAST & SMART TIER ALERTS */}
        {activeTab === 'future_incentives' && (
          <EmployeeIncentiveProjectionTab
            records={activeRecords}
            currency={currency}
            language={language}
            daysInMonth={targetStructure.daysInMonth || 31}
            initialElapsedDays={achievements.elapsedDays}
          />
        )}

        {/* TAB: FUTURE HIRING & RETAIL EXPANSION ADVISORY */}
        {activeTab === 'hiring_expansion' && (
          <FutureHiringAndExpansionTab
            records={activeRecords}
            currency={currency}
            language={language}
            targetStructure={targetStructure}
            annualProjectedRevenue={annualProjection.totalAnnualProjected}
            avgMonthlyGrowthRate={annualProjection.avgMonthlyGrowthRate}
          />
        )}

        {/* TAB: STAFF ATTRITION RATE & PROACTIVE TALENT RETENTION (User Request) */}
        {activeTab === 'attrition_retention' && (
          <StaffAttritionAndRetentionTab
            records={activeRecords}
            currency={currency}
            language={language}
          />
        )}

        {/* TAB 5: VARIANCE & ACCOUNTING LEDGER (ميزان الفروقات والمقارنة المحاسبية) */}
        {activeTab === 'variance' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-xs text-right">
                <thead className="bg-slate-800 text-white font-bold">
                  <tr>
                    <th className="px-3.5 py-3">{isAr ? 'مستشار المبيعات' : 'Consultant'}</th>
                    <th className="px-3.5 py-3">{isAr ? 'الكود الوظيفي' : 'Employee ID'}</th>
                    <th className="px-3.5 py-3">{isAr ? 'التارجت المطلوب' : 'Target'}</th>
                    <th className="px-3.5 py-3">{isAr ? 'صافي قبل الضريبة' : 'Pre-VAT Net'}</th>
                    <th className="px-3.5 py-3">{isAr ? 'ضريبة 14%' : '14% VAT'}</th>
                    <th className="px-3.5 py-3">{isAr ? 'المحقق بعد الضريبة' : 'Post-VAT Actual'}</th>
                    <th className="px-3.5 py-3">{isAr ? 'الفارق المالي' : 'Variance'}</th>
                    <th className="px-3.5 py-3">{isAr ? 'نسبة التحقيق' : 'Target %'}</th>
                    <th className="px-3.5 py-3">{isAr ? 'الحافز المعتمد' : 'Incentive'}</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100 font-mono">
                  {activeRecords.map((r) => {
                    const net = r.actualBeforeVat !== undefined ? r.actualBeforeVat : Math.round(r.actual / 1.14);
                    const vat = r.vatAmount !== undefined ? r.vatAmount : r.actual - net;
                    const gross = r.actualAfterVat || r.actual;
                    const isPositive = r.difference >= 0;

                    return (
                      <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-3.5 py-2.5 font-sans font-bold text-slate-900">{r.employee}</td>
                        <td className="px-3.5 py-2.5 text-slate-500">{r.employeeId || '-'}</td>
                        <td className="px-3.5 py-2.5 text-slate-700">{formatCurrencyNumber(r.target)}</td>
                        <td className="px-3.5 py-2.5 text-slate-800 font-semibold">{formatCurrencyNumber(net)}</td>
                        <td className="px-3.5 py-2.5 text-amber-700">{formatCurrencyNumber(vat)}</td>
                        <td className="px-3.5 py-2.5 text-emerald-800 font-bold">{formatCurrencyNumber(gross)}</td>
                        <td className={`px-3.5 py-2.5 font-bold ${isPositive ? 'text-emerald-700' : 'text-rose-600'}`}>
                          {isPositive ? '+' : ''}
                          {formatCurrencyNumber(r.difference)}
                        </td>
                        <td className="px-3.5 py-2.5 font-bold">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[11px] ${
                              r.achievementRate >= 100
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {r.achievementRate.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-3.5 py-2.5 text-amber-900 font-bold font-mono">
                          {formatCurrencyNumber(r.earnedIncentive || 0)} ج.م
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-100 text-slate-900 font-bold font-mono text-xs">
                  <tr>
                    <td className="px-3.5 py-3 font-sans">{isAr ? 'الإجمالي الكلي للفرع' : 'Total'}</td>
                    <td className="px-3.5 py-3 text-slate-500 font-sans">{activeRecords.length} مستشار</td>
                    <td className="px-3.5 py-3">{formatCurrencyNumber(achievements.baseRevenueTarget)}</td>
                    <td className="px-3.5 py-3">{formatCurrencyNumber(achievements.totalActualNet)}</td>
                    <td className="px-3.5 py-3 text-amber-800">{formatCurrencyNumber(achievements.totalVat)}</td>
                    <td className="px-3.5 py-3 text-emerald-800">{formatCurrencyNumber(achievements.totalActualGross)}</td>
                    <td className={`px-3.5 py-3 ${achievements.revenueDifference >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                      {achievements.revenueDifference >= 0 ? '+' : ''}
                      {formatCurrencyNumber(achievements.revenueDifference)}
                    </td>
                    <td className="px-3.5 py-3 text-emerald-800">
                      {achievements.revenueAchievementRate.toFixed(1)}%
                    </td>
                    <td className="px-3.5 py-3 text-amber-900">
                      {formatCurrencyNumber(achievements.totalIncentives)} ج.م
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: ANNUAL PROJECTION & CUMULATIVE GROWTH (التوقعات السنوية ونمو الفرع التراكمي) */}
        {activeTab === 'annual_projection' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* 1. Header Strip with Scenario Controls & Quarter Filters */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white rounded-2xl p-5 sm:p-6 border border-slate-700 shadow-md">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[11px] font-bold flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{isAr ? 'نموذج التوقعات السنوية التراكمية 2026' : '2026 Cumulative Annual Model'}</span>
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {isAr ? `مبني على أداء ${annualProjection.historicalMonthsCount} أشهر سابقة مع المؤشرات الموسمية` : `Based on ${annualProjection.historicalMonthsCount} historical months & seasonal weighting`}
                    </span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                    <span>
                      {isAr
                        ? 'توقعات المبيعات السنوية ومسار نمو فرع كونكورد بلازا'
                        : 'Annual Sales Projections & Trajectory'}
                    </span>
                    <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
                  </h3>

                  <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                    {isAr
                      ? 'محاكاة رياضية لنتائج السنة المالية الكاملة (12 شهراً) تمزج بين الانحدار الخطي لأداء المستشارين الفعلي والمؤشرات الموسمية لقطاع الإلكترونيات في مصر (مواسم الأعياد، العودة للدراسة، وموسم الجمعة البيضاء).'
                      : 'Statistical full-year forecast (12 months) synthesizing linear regression from past actuals and Egyptian retail seasonality (Ramadan/Eid, Back-to-school, and White Friday).'}
                  </p>
                </div>

                {/* Scenario Toggle & Quarter Filter */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
                  {/* Scenario Switcher */}
                  <div className="p-1 bg-slate-800/90 rounded-xl border border-slate-700 flex items-center gap-1 text-xs">
                    <button
                      type="button"
                      onClick={() => setAnnualScenario('realistic')}
                      className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                        annualScenario === 'realistic'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-slate-300 hover:text-white'
                      }`}
                      title={isAr ? 'السيناريو الواقعي المعتمد' : 'Realistic Baseline'}
                    >
                      {isAr ? 'الواقعي' : 'Realistic'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setAnnualScenario('optimistic')}
                      className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                        annualScenario === 'optimistic'
                          ? 'bg-amber-600 text-white shadow-sm'
                          : 'text-slate-300 hover:text-white'
                      }`}
                      title={isAr ? 'السيناريو المتفائل (+12% نمو حملات)' : 'Optimistic (+12%)'}
                    >
                      {isAr ? 'المتفائل (+12%)' : 'Optimistic'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setAnnualScenario('conservative')}
                      className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                        annualScenario === 'conservative'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-300 hover:text-white'
                      }`}
                      title={isAr ? 'السيناريو التحفظي (-8% تقلبات سوق)' : 'Conservative (-8%)'}
                    >
                      {isAr ? 'التحفظي (-8%)' : 'Conservative'}
                    </button>
                  </div>

                  {/* Quarter Selector */}
                  <div className="p-1 bg-slate-800/90 rounded-xl border border-slate-700 flex items-center gap-1 text-xs">
                    {(['ALL', 'Q1', 'Q2', 'Q3', 'Q4'] as const).map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => setSelectedQuarterFilter(q)}
                        className={`px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                          selectedQuarterFilter === q
                            ? 'bg-slate-700 text-white shadow-xs'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {q === 'ALL' ? (isAr ? 'السنة كاملة' : 'Year') : q}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Four Annual Milestone KPI Cards */}
            {(() => {
              const activeAnnualProjected =
                annualScenario === 'realistic'
                  ? annualProjection.scenarios.realistic
                  : annualScenario === 'optimistic'
                  ? annualProjection.scenarios.optimistic
                  : annualProjection.scenarios.conservative;
              const activeAnnualVariance = activeAnnualProjected - annualProjection.totalAnnualTarget;
              const activeAnnualRate =
                annualProjection.totalAnnualTarget > 0
                  ? (activeAnnualProjected / annualProjection.totalAnnualTarget) * 100
                  : 0;

              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Card 1: Total Annual Projected Sales */}
                  <div className="bg-gradient-to-br from-emerald-50 via-teal-50/40 to-white rounded-2xl p-5 border border-emerald-200 shadow-sm relative overflow-hidden">
                    <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                      {isAr ? 'المبيعات السنوية المتوقعة (2026)' : 'Projected Annual Sales'}
                    </span>
                    <div className="text-2xl sm:text-3xl font-black text-emerald-950 font-mono mt-1">
                      {formatCurrencyNumber(activeAnnualProjected)}{' '}
                      <span className="text-xs font-normal text-slate-500">ج.م</span>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-emerald-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500 text-[11px]">
                        {isAr ? 'التارجت السنوي المخطط:' : 'Annual Target:'}
                      </span>
                      <strong className="text-slate-800 font-mono">
                        {formatCurrencyNumber(annualProjection.totalAnnualTarget)} ج.م
                      </strong>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[11px] font-mono">
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <ArrowUpRight className="w-3 h-3" />
                        <span>{activeAnnualRate.toFixed(1)}% إنجاز سنوي</span>
                      </span>
                      <span className={activeAnnualVariance >= 0 ? 'text-emerald-800 font-bold' : 'text-rose-600 font-bold'}>
                        {activeAnnualVariance >= 0 ? `+${formatCurrencyNumber(activeAnnualVariance)} فائض` : `${formatCurrencyNumber(Math.abs(activeAnnualVariance))} عجز`}
                      </span>
                    </div>

                    <div className="w-full bg-emerald-100 rounded-full h-1.5 mt-2.5 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, activeAnnualRate)}%` }}
                      />
                    </div>
                  </div>

                  {/* Card 2: Actual Achieved to Date */}
                  <div className="bg-gradient-to-br from-blue-50 via-indigo-50/40 to-white rounded-2xl p-5 border border-blue-200 shadow-sm relative overflow-hidden">
                    <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider block">
                      {isAr ? 'المحقق الفعلي حتى تاريخه (YTD)' : 'Actual Achieved YTD'}
                    </span>
                    <div className="text-2xl sm:text-3xl font-black text-blue-950 font-mono mt-1">
                      {formatCurrencyNumber(annualProjection.totalAnnualActualToDate)}{' '}
                      <span className="text-xs font-normal text-slate-500">ج.م</span>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-blue-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500 text-[11px]">
                        {isAr ? 'نسبة ما تم إنجازه من السنة:' : 'YTD Progress:'}
                      </span>
                      <strong className="text-blue-900 font-mono">
                        {((annualProjection.totalAnnualActualToDate / annualProjection.totalAnnualTarget) * 100).toFixed(1)}%
                      </strong>
                    </div>

                    <div className="mt-2 text-[11px] text-slate-600 font-semibold flex items-center justify-between">
                      <span>{isAr ? `مسجل من ${annualProjection.historicalMonthsCount} أشهر معتمدة` : `From ${annualProjection.historicalMonthsCount} closed months`}</span>
                      <span className="text-blue-700 font-mono">{annualProjection.remainingMonthsCount} أشهر متبقية</span>
                    </div>

                    <div className="w-full bg-blue-100 rounded-full h-1.5 mt-2.5 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                        style={{
                          width: `${Math.min(
                            100,
                            (annualProjection.totalAnnualActualToDate / annualProjection.totalAnnualTarget) * 100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Card 3: Annual Run-Rate */}
                  <div className="bg-gradient-to-br from-purple-50 via-fuchsia-50/40 to-white rounded-2xl p-5 border border-purple-200 shadow-sm relative overflow-hidden">
                    <span className="text-[11px] font-bold text-purple-800 uppercase tracking-wider block">
                      {isAr ? 'معدل التشغيل السنوي (Run-Rate)' : 'Annualized Run-Rate'}
                    </span>
                    <div className="text-2xl sm:text-3xl font-black text-purple-950 font-mono mt-1">
                      {formatCurrencyNumber(annualProjection.annualRunRate)}{' '}
                      <span className="text-xs font-normal text-slate-500">ج.م/سنة</span>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-purple-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500 text-[11px]">
                        {isAr ? 'متوسط المبيعات الشهري:' : 'Avg Monthly Sales:'}
                      </span>
                      <strong className="text-purple-900 font-mono">
                        {formatCurrencyNumber(Math.round(annualProjection.annualRunRate / 12))} ج.م
                      </strong>
                    </div>

                    <div className="mt-2 text-[11px] text-slate-600 font-semibold flex items-center justify-between">
                      <span className="flex items-center gap-1 text-purple-700">
                        <CheckCircle2 className="w-3 h-3 text-purple-600" />
                        <span>{isAr ? 'طاقة تشغيلية مستقرة' : 'Stable run capacity'}</span>
                      </span>
                      <span className="text-slate-500 font-mono font-bold">12 شهراً</span>
                    </div>

                    <div className="w-full bg-purple-100 rounded-full h-1.5 mt-2.5 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-purple-500 to-fuchsia-500 rounded-full w-full" />
                    </div>
                  </div>

                  {/* Card 4: Average Monthly Growth Rate */}
                  <div className="bg-gradient-to-br from-amber-50 via-orange-50/40 to-white rounded-2xl p-5 border border-amber-200 shadow-sm relative overflow-hidden">
                    <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
                      {isAr ? 'متوسط الزخم الشهري (MoM)' : 'Average Monthly Momentum'}
                    </span>
                    <div className="text-2xl sm:text-3xl font-black text-amber-950 font-mono mt-1 flex items-baseline gap-1">
                      <span>+{annualProjection.avgMonthlyGrowthRate.toFixed(1)}%</span>
                      <span className="text-xs font-normal text-slate-500">{isAr ? 'شهرياً' : 'MoM'}</span>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-amber-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500 text-[11px]">
                        {isAr ? 'ذروة التوقع السنوية:' : 'Peak Month:'}
                      </span>
                      <strong className="text-amber-900 font-mono">
                        {isAr ? 'نوفمبر (الجمعة البيضاء)' : 'November (White Friday)'}
                      </strong>
                    </div>

                    <div className="mt-2 text-[11px] text-amber-800 font-semibold flex items-center justify-between">
                      <span>{isAr ? 'معامل الذروة: 125%' : 'Peak factor: 125%'}</span>
                      <span className="text-amber-700 font-mono font-bold">Q4 Mega Surge</span>
                    </div>

                    <div className="w-full bg-amber-100 rounded-full h-1.5 mt-2.5 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full w-[85%]" />
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* 3. Interactive 12-Month Projection Bar & Trajectory Chart */}
            {(() => {
              const displayedMonths =
                selectedQuarterFilter === 'ALL'
                  ? annualProjection.months
                  : annualProjection.months.filter((m) => m.quarter === selectedQuarterFilter);

              const maxMonthVal = Math.max(
                ...annualProjection.months.map((m) => Math.max(m.target, m.scenarioOptimistic, m.projectedActual)),
                1000
              );

              const selectedMonth =
                selectedMonthIndex !== null ? annualProjection.months[selectedMonthIndex] : null;

              return (
                <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <h4 className="font-black text-slate-900 text-sm sm:text-base flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-emerald-700" />
                        <span>
                          {isAr
                            ? 'الرسم البياني السنوي: المبيعات الفعلية والتوقعات على مدار الـ 12 شهراً'
                            : 'Full-Year Annual Trajectory Chart (12 Months)'}
                        </span>
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {isAr
                          ? 'اضغط على أي عمود شهري لعرض تفاصيل التوقع ومقارنة السيناريوهات الثلاثة والمعامل الموسمي.'
                          : 'Click any monthly bar to inspect detailed scenario values and seasonal index.'}
                      </p>
                    </div>

                    {/* Chart Legend */}
                    <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-600 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-sm bg-emerald-600" />
                        <span>{isAr ? 'محقق فعلياً' : 'Historical Actual'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-sm bg-teal-400 border border-teal-600 border-dashed" />
                        <span>{isAr ? 'توقع مبني على الزخم' : 'Projected Forecast'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-0.5 bg-amber-500" />
                        <span>{isAr ? 'خط التارجت' : 'Target Line'}</span>
                      </div>
                    </div>
                  </div>

                  {/* The Interactive Visual Columns Chart */}
                  <div className="pt-8 pb-4">
                    <div className="grid grid-cols-12 gap-1.5 sm:gap-2.5 h-64 sm:h-72 items-end border-b border-slate-200 relative px-1">
                      {displayedMonths.map((m) => {
                        const val =
                          annualScenario === 'realistic'
                            ? m.projectedActual
                            : annualScenario === 'optimistic'
                            ? m.scenarioOptimistic
                            : m.scenarioConservative;

                        const barHeightPct = Math.max(12, Math.min(100, (val / maxMonthVal) * 100));
                        const targetHeightPct = Math.max(8, Math.min(100, (m.target / maxMonthVal) * 100));
                        const isSelected = selectedMonthIndex === m.monthIndex;

                        return (
                          <div
                            key={m.monthIndex}
                            onClick={() =>
                              setSelectedMonthIndex(isSelected ? null : m.monthIndex)
                            }
                            className={`flex flex-col items-center h-full justify-end group cursor-pointer relative transition-all ${
                              isSelected ? 'scale-105 z-20' : 'hover:scale-102'
                            }`}
                          >
                            {/* Target threshold marker */}
                            <div
                              className="absolute w-full border-t-2 border-amber-500/90 z-10 pointer-events-none transition-all"
                              style={{ bottom: `${targetHeightPct}%` }}
                              title={`تارجت ${m.monthNameAr}: ${formatCurrencyNumber(m.target)} ج.م`}
                            />

                            {/* Floating Tooltip On Top of Bar */}
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-slate-900 text-white text-[10px] py-1 px-1.5 rounded-md shadow-lg pointer-events-none whitespace-nowrap z-30 font-mono">
                              {formatCurrencyNumber(val)} ج.م
                            </div>

                            {/* Value label on bar top (desktop) */}
                            <span className="text-[10px] font-bold font-mono text-slate-700 hidden md:block mb-1">
                              {(val / 1000).toFixed(0)}k
                            </span>

                            {/* The Bar */}
                            <div
                              className={`w-full rounded-t-xl transition-all duration-300 relative overflow-hidden shadow-xs ${
                                m.isHistorical
                                  ? 'bg-gradient-to-t from-emerald-700 via-emerald-600 to-teal-500'
                                  : 'bg-gradient-to-t from-teal-500/80 via-cyan-400/80 to-blue-300/80 border-2 border-dashed border-teal-600'
                              } ${
                                isSelected
                                  ? 'ring-3 ring-amber-400 shadow-md'
                                  : 'group-hover:opacity-90'
                              }`}
                              style={{ height: `${barHeightPct}%` }}
                            >
                              {/* Historical Check badge */}
                              {m.isHistorical && (
                                <div className="absolute top-1 left-1/2 -translate-x-1/2 text-white/90">
                                  <Check className="w-2.5 h-2.5" />
                                </div>
                              )}
                              {!m.isHistorical && (
                                <div className="absolute top-1 left-1/2 -translate-x-1/2 text-[8px] font-bold text-slate-800 bg-white/70 px-1 rounded-sm">
                                  ~
                                </div>
                              )}
                            </div>

                            {/* Month Label below axis */}
                            <div className="text-center mt-2.5">
                              <span
                                className={`text-[10px] sm:text-xs font-bold block truncate max-w-full ${
                                  isSelected
                                    ? 'text-emerald-900 font-black'
                                    : m.isHistorical
                                    ? 'text-slate-800'
                                    : 'text-slate-500'
                                }`}
                              >
                                {isAr ? m.monthNameAr : m.monthNameEn.substring(0, 3)}
                              </span>
                              <span
                                className={`text-[9px] font-mono font-semibold block ${
                                  m.achievementRate >= 100 ? 'text-emerald-700' : 'text-amber-700'
                                }`}
                              >
                                {m.achievementRate.toFixed(0)}%
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Selected Month Inspector Details Panel */}
                  {selectedMonth && (
                    <div className="bg-gradient-to-r from-emerald-50 via-teal-50/60 to-white rounded-xl p-4 border border-emerald-300 shadow-xs animate-in fade-in duration-150 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                          <h5 className="font-black text-slate-900 text-sm">
                            {isAr ? `تفاصيل شهر ${selectedMonth.periodLabel} (${selectedMonth.quarter})` : `${selectedMonth.periodLabel} Breakdown`}
                          </h5>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${selectedMonth.isHistorical ? 'bg-emerald-100 text-emerald-800' : 'bg-teal-100 text-teal-800'}`}>
                            {selectedMonth.isHistorical ? (isAr ? 'بيانات محققة رسمياً' : 'Historical Actual') : (isAr ? 'توقع مستقبلي مبني على الزخم' : 'Projected Forecast')}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelectedMonthIndex(null)}
                          className="text-xs text-slate-400 hover:text-slate-700 font-bold cursor-pointer"
                        >
                          ✕ {isAr ? 'إغلاق' : 'Close'}
                        </button>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                        <div className="bg-white p-2.5 rounded-lg border border-emerald-100">
                          <span className="text-[10px] text-slate-500 font-sans block">{isAr ? 'المبيعات في السيناريو الحالي:' : 'Current Value:'}</span>
                          <strong className="text-emerald-950 font-bold text-sm">
                            {formatCurrencyNumber(
                              annualScenario === 'realistic'
                                ? selectedMonth.projectedActual
                                : annualScenario === 'optimistic'
                                ? selectedMonth.scenarioOptimistic
                                : selectedMonth.scenarioConservative
                            )} ج.م
                          </strong>
                        </div>

                        <div className="bg-white p-2.5 rounded-lg border border-emerald-100">
                          <span className="text-[10px] text-slate-500 font-sans block">{isAr ? 'التارجت المطلوب:' : 'Target:'}</span>
                          <strong className="text-slate-800 font-bold text-sm">
                            {formatCurrencyNumber(selectedMonth.target)} ج.م
                          </strong>
                        </div>

                        <div className="bg-white p-2.5 rounded-lg border border-emerald-100">
                          <span className="text-[10px] text-slate-500 font-sans block">{isAr ? 'الفارق المالي المحقق/المتوقع:' : 'Variance:'}</span>
                          <strong className={selectedMonth.difference >= 0 ? 'text-emerald-700 font-bold text-sm' : 'text-rose-600 font-bold text-sm'}>
                            {selectedMonth.difference >= 0 ? '+' : ''}
                            {formatCurrencyNumber(selectedMonth.difference)} ج.م
                          </strong>
                        </div>

                        <div className="bg-white p-2.5 rounded-lg border border-emerald-100">
                          <span className="text-[10px] text-slate-500 font-sans block">{isAr ? 'المؤشر الموسمي للقطاع:' : 'Seasonal Index:'}</span>
                          <strong className="text-amber-800 font-bold text-sm">
                            {(EGYPT_RETAIL_SEASONAL_FACTORS[selectedMonth.monthIndex] * 100).toFixed(0)}%
                          </strong>
                        </div>
                      </div>

                      {/* Scenario Comparison Row for this month */}
                      <div className="flex flex-wrap items-center gap-3 pt-1 text-xs border-t border-emerald-200/60 font-mono">
                        <span className="text-slate-600 font-sans font-bold">{isAr ? 'مقارنة السيناريوهات للشهر:' : 'Scenarios:'}</span>
                        <span>{isAr ? 'واقعي:' : 'Real:'} <strong className="text-slate-900">{formatCurrencyNumber(selectedMonth.scenarioRealistic)} ج.م</strong></span>
                        <span className="text-slate-400">|</span>
                        <span>{isAr ? 'متفائل:' : 'Optimistic:'} <strong className="text-amber-700">{formatCurrencyNumber(selectedMonth.scenarioOptimistic)} ج.م</strong></span>
                        <span className="text-slate-400">|</span>
                        <span>{isAr ? 'تحفظي:' : 'Conservative:'} <strong className="text-blue-700">{formatCurrencyNumber(selectedMonth.scenarioConservative)} ج.م</strong></span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* 4. Four Quarters Matrix (مصفوفة الفصول الأربعة Q1, Q2, Q3, Q4) */}
            <div className="space-y-3">
              <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-700" />
                <span>{isAr ? 'مصفوفة إنجاز وتوقعات الفصول الأربعة (Quarterly Matrix)' : 'Quarterly Projections Matrix'}</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {annualProjection.quarters.map((q) => {
                  const isAchieved = q.difference >= 0;
                  return (
                    <div
                      key={q.quarter}
                      className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-emerald-300 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-black text-slate-900 font-mono">
                            {isAr ? q.quarterNameAr : q.quarterNameEn}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              q.isHistorical
                                ? 'bg-emerald-100 text-emerald-800'
                                : q.isPartial
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-teal-100 text-teal-800'
                            }`}
                          >
                            {q.isHistorical
                              ? (isAr ? 'مغلق ومحقق' : 'Closed')
                              : q.isPartial
                              ? (isAr ? 'قيد التنفيذ' : 'In Progress')
                              : (isAr ? 'متوقع بالكامل' : 'Projected')}
                          </span>
                        </div>

                        <div className="text-xl font-black text-slate-950 font-mono mt-1">
                          {formatCurrencyNumber(q.totalActualOrProjected)}{' '}
                          <span className="text-xs font-normal text-slate-500">ج.م</span>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                        <div className="flex items-center justify-between text-slate-500">
                          <span>{isAr ? 'المستهدف المخطط:' : 'Target:'}</span>
                          <strong className="text-slate-800 font-mono">{formatCurrencyNumber(q.totalTarget)} ج.م</strong>
                        </div>

                        <div className="flex items-center justify-between text-slate-500">
                          <span>{isAr ? 'الفارق المالي:' : 'Variance:'}</span>
                          <strong className={isAchieved ? 'text-emerald-700 font-mono' : 'text-rose-600 font-mono'}>
                            {isAchieved ? '+' : ''}
                            {formatCurrencyNumber(q.difference)} ج.م
                          </strong>
                        </div>

                        <div className="flex items-center justify-between text-slate-500">
                          <span>{isAr ? 'نسبة الإنجاز:' : 'Rate:'}</span>
                          <strong className="text-emerald-800 font-mono">{q.achievementRate.toFixed(1)}%</strong>
                        </div>

                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden mt-1">
                          <div
                            className={`h-full rounded-full ${isAchieved ? 'bg-emerald-600' : 'bg-amber-500'}`}
                            style={{ width: `${Math.min(100, q.achievementRate)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 5. 12-Month Annual Financial Ledger Table */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs space-y-3 p-5">
              <div className="flex items-center justify-between">
                <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-emerald-700" />
                  <span>{isAr ? 'جدول الميزانية والتوقعات السنوية شهر بشهر (12 شهراً)' : '12-Month Annual Ledger'}</span>
                </h4>
                <span className="text-xs text-slate-500 font-mono">
                  {isAr ? 'السنة المالية 2026' : 'Fiscal Year 2026'}
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-100">
                <table className="min-w-full divide-y divide-slate-200 text-xs text-right">
                  <thead className="bg-slate-800 text-white font-bold">
                    <tr>
                      <th className="px-3 py-2.5">{isAr ? 'الشهر' : 'Month'}</th>
                      <th className="px-3 py-2.5">{isAr ? 'الربع' : 'Quarter'}</th>
                      <th className="px-3 py-2.5">{isAr ? 'طبيعة السجل' : 'Status'}</th>
                      <th className="px-3 py-2.5">{isAr ? 'التارجت المخطط' : 'Target'}</th>
                      <th className="px-3 py-2.5">{isAr ? 'المحقق / المتوقع' : 'Projected / Actual'}</th>
                      <th className="px-3 py-2.5">{isAr ? 'الفارق المالي' : 'Variance'}</th>
                      <th className="px-3 py-2.5">{isAr ? 'نسبة التحقيق' : 'Target %'}</th>
                      <th className="px-3 py-2.5">{isAr ? 'المعامل الموسمي' : 'Seasonality'}</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100 font-mono">
                    {annualProjection.months.map((m) => {
                      const val =
                        annualScenario === 'realistic'
                          ? m.projectedActual
                          : annualScenario === 'optimistic'
                          ? m.scenarioOptimistic
                          : m.scenarioConservative;
                      const diff = val - m.target;
                      const rate = m.target > 0 ? (val / m.target) * 100 : 0;
                      const isPositive = diff >= 0;

                      return (
                        <tr key={m.monthIndex} className="hover:bg-slate-50 transition-colors">
                          <td className="px-3 py-2 font-sans font-bold text-slate-900">{m.monthNameAr}</td>
                          <td className="px-3 py-2 text-slate-600">{m.quarter}</td>
                          <td className="px-3 py-2 font-sans">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                m.isHistorical
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-teal-50 text-teal-700 border border-teal-200'
                              }`}
                            >
                              {m.isHistorical ? (isAr ? 'محقق فعلياً' : 'Actual') : (isAr ? 'توقع مبني' : 'Forecast')}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-slate-700">{formatCurrencyNumber(m.target)} ج.م</td>
                          <td className="px-3 py-2 text-emerald-950 font-bold">{formatCurrencyNumber(val)} ج.م</td>
                          <td className={`px-3 py-2 font-bold ${isPositive ? 'text-emerald-700' : 'text-rose-600'}`}>
                            {isPositive ? '+' : ''}{formatCurrencyNumber(diff)}
                          </td>
                          <td className="px-3 py-2 font-bold">
                            <span className={`px-2 py-0.5 rounded-md text-[11px] ${rate >= 100 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                              {rate.toFixed(1)}%
                            </span>
                          </td>
                          <td className="px-3 py-2 text-slate-500">
                            {(EGYPT_RETAIL_SEASONAL_FACTORS[m.monthIndex] * 100).toFixed(0)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-slate-100 font-bold font-mono text-xs text-slate-900">
                    <tr>
                      <td className="px-3 py-3 font-sans">{isAr ? 'إجمالي السنة الكاملة' : 'Full Year Total'}</td>
                      <td className="px-3 py-3 font-sans">4 فصول</td>
                      <td className="px-3 py-3 font-sans">12 شهراً</td>
                      <td className="px-3 py-3">{formatCurrencyNumber(annualProjection.totalAnnualTarget)} ج.م</td>
                      <td className="px-3 py-3 text-emerald-800">{formatCurrencyNumber(
                        annualScenario === 'realistic'
                          ? annualProjection.scenarios.realistic
                          : annualScenario === 'optimistic'
                          ? annualProjection.scenarios.optimistic
                          : annualProjection.scenarios.conservative
                      )} ج.م</td>
                      <td className={`px-3 py-3 ${annualProjection.annualProjectedVariance >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                        {annualProjection.annualProjectedVariance >= 0 ? '+' : ''}
                        {formatCurrencyNumber(annualProjection.annualProjectedVariance)}
                      </td>
                      <td className="px-3 py-3 text-emerald-800 font-bold">
                        {annualProjection.annualAchievementRate.toFixed(1)}%
                      </td>
                      <td className="px-3 py-3 text-slate-500">-</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* 6. Executive Strategic Recommendations */}
            <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white rounded-2xl p-5 border border-emerald-500/30 text-xs space-y-2.5">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-400" />
                <h5 className="font-bold text-white text-sm">
                  {isAr ? 'توصيات ورؤى الإدارة التنفيذية لفرع راية كونكورد بلازا لعام 2026:' : 'Executive Strategic Guidance for Concorde Plaza:'}
                </h5>
              </div>

              <p className="text-emerald-100/90 leading-relaxed">
                {isAr
                  ? `بناءً على الأداء التراكمي للأشهر السابقة ومسار النمو المحسوب (+${annualProjection.avgMonthlyGrowthRate.toFixed(1)}% شهرياً)، فإن فرع كونكورد بلازا يسير بثبات لتجاوز المستهدف السنوي بفائض متوقع يتخطى ${formatCurrencyNumber(Math.max(0, annualProjection.annualProjectedVariance))} ج.م. وتتركز أكبر فرصة تاريخية في الربع الرابع (Q4) خاصة شهري نوفمبر (موسم الجمعة البيضاء) وديسمبر، حيث ينصح برفع الجاهزية المخزنية لهواتف الفلاج شيب وتكثيف حملات التقسيط بدون فوائد عبر أمان لتحقيق أعلى عائد حوافز للمستشارين.`
                  : `Driven by positive cumulative historical momentum (+${annualProjection.avgMonthlyGrowthRate.toFixed(1)}% MoM), Concorde Plaza branch is projected to beat its annual corporate target by an estimated surplus of ${formatCurrencyNumber(Math.max(0, annualProjection.annualProjectedVariance))} EGP. Q4 presents the prime upside peak (White Friday & year-end promotions).`}
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
