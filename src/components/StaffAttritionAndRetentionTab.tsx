import React, { useState, useMemo, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  UserMinus,
  UserCheck,
  Users,
  Award,
  Crown,
  Calendar,
  Clock,
  Sparkles,
  DollarSign,
  Download,
  Share2,
  Check,
  Zap,
  ArrowUpRight,
  Briefcase,
  HelpCircle,
  Flame,
  CheckCircle2,
  ChevronRight,
  Sliders,
  Target,
  FileSpreadsheet,
} from 'lucide-react';
import {
  SalesRecord,
  Currency,
  Language,
  TalentAttritionProfile,
  BranchAttritionSummary,
  AttritionRiskLevel,
} from '../types/sales';
import { formatCurrencyNumber, formatPercent } from '../utils/calculations';
import {
  calculateStaffAttritionMetrics,
  savePersistedRetentionAction,
  exportAttritionReportToExcel,
  generateRetentionMemoWhatsApp,
} from '../utils/attritionService';

interface StaffAttritionAndRetentionTabProps {
  records: SalesRecord[];
  currency: Currency;
  language: Language;
}

export const StaffAttritionAndRetentionTab: React.FC<StaffAttritionAndRetentionTabProps> = ({
  records,
  currency,
  language,
}) => {
  const isAr = language === 'ar';
  const [version, setVersion] = useState(0);
  const [copiedMemo, setCopiedMemo] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'high_risk' | 'retained'>('all');
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);

  // Re-calculate metrics whenever records or version changes
  const summary: BranchAttritionSummary = useMemo(() => {
    return calculateStaffAttritionMetrics(records);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [records, version]);

  // Listen to cross-component retention updates
  useEffect(() => {
    const handleUpdated = () => {
      setVersion((v) => v + 1);
    };
    window.addEventListener('raya-retention-updated', handleUpdated);
    return () => window.removeEventListener('raya-retention-updated', handleUpdated);
  }, []);

  const handleToggleAction = (employeeName: string, currentApplied: boolean) => {
    savePersistedRetentionAction(employeeName, !currentApplied);
    setVersion((v) => v + 1);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('raya-notification', {
          detail: {
            title: isAr
              ? !currentApplied
                ? 'تم تطبيق خطة الاستبقاء بنجاح'
                : 'تم إلغاء تفعيل خطة الاستبقاء'
              : !currentApplied
              ? 'Retention Plan Activated'
              : 'Retention Plan Deactivated',
            message: isAr
              ? `تم تحديث مؤشر استنزاف الموظفين لـ ${employeeName} واحتساب انخفاض المخاطر.`
              : `Updated attrition risk metrics for ${employeeName}.`,
            type: !currentApplied ? 'success' : 'info',
          },
        })
      );
    }
  };

  const handleApplyAllActions = () => {
    summary.profiles.forEach((p) => {
      savePersistedRetentionAction(p.employeeName, true);
    });
    setVersion((v) => v + 1);
  };

  const handleShareWhatsApp = () => {
    const memo = generateRetentionMemoWhatsApp(summary, language);
    navigator.clipboard.writeText(memo);
    setCopiedMemo(true);
    setTimeout(() => setCopiedMemo(false), 2500);

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(memo)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const handleExportExcel = () => {
    exportAttritionReportToExcel(summary, language);
  };

  const filteredProfiles = useMemo(() => {
    if (selectedFilter === 'high_risk') {
      return summary.profiles.filter(
        (p) =>
          (p.riskLevel === 'critical' || p.riskLevel === 'high') &&
          p.proactiveRetentionAction.status === 'pending'
      );
    }
    if (selectedFilter === 'retained') {
      return summary.profiles.filter((p) => p.proactiveRetentionAction.status === 'applied');
    }
    return summary.profiles;
  }, [summary.profiles, selectedFilter]);

  const nearestProfile = useMemo(() => {
    return summary.profiles.find((p) => p.employeeName === summary.nearestDepartureEmployee);
  }, [summary]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Executive Banner & Strategy Header */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-rose-950 text-white rounded-3xl p-6 sm:p-7 border border-rose-900/50 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-rose-500/20 text-rose-300 border border-rose-400/40 text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1.5 shadow-xs">
                <ShieldAlert className="w-4 h-4 text-rose-400 animate-pulse" />
                <span>
                  {isAr
                    ? 'منظومة مراقبة استنزاف الكفاءات والاحتفاظ بالمواهب'
                    : 'Talent Retention & Staff Attrition Command'}
                </span>
              </span>

              <span className="bg-amber-500/20 text-amber-300 border border-amber-400/40 text-xs px-2.5 py-0.5 rounded-full font-bold font-mono">
                {isAr ? 'فرع راية كونكورد بلازا' : 'Concorde Plaza Branch'}
              </span>

              <span className="text-xs text-slate-300 font-medium">
                {isAr ? 'قرارات استباقية مبنية على تاريخ المغادرة المحتمل' : 'Proactive Talent Protection'}
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
              <span>
                {isAr
                  ? 'مؤشر معدل استنزاف الموظفين (Staff Attrition Rate) وخطة الاستبقاء'
                  : 'Staff Attrition Rate & Proactive Talent Retention'}
              </span>
              <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
            </h3>

            <p className="text-xs sm:text-sm text-rose-100/90 leading-relaxed max-w-3xl">
              {isAr
                ? 'يقوم هذا النموذج بتحليل مخاطر استقطاب المنافسين (Headhunting) للمستشارين المتميزين، وتاريخ المغادرة المحتمل المتوقع بناءً على الأقدمية وسقف الحوافز وتكرار العروض السوقية، لاقتراح قرارات إدارية استباقية (ترقيات، حوافز ولاء، ومسارات قيادية) تحمي إيرادات الفرع واستقراره.'
                : 'Identifies competitor poaching risks, tenure saturation milestones, and potential departure windows for top retail advisors, delivering proactive retention packages to protect branch sales.'}
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleApplyAllActions}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer active:scale-95 whitespace-nowrap"
              title={isAr ? 'اعتماد وتطبيق كافة خطط الاستبقاء الاستباقية للكوادر' : 'Apply all retention packages'}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isAr ? 'تطبيق كافة خطط الاستبقاء' : 'Apply All Plans'}</span>
            </button>

            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
              title={isAr ? 'إرسال تقرير ومذكرة الاستبقاء للمدير عبر واتساب' : 'Share WhatsApp Memo'}
            >
              {copiedMemo ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4 text-indigo-400" />}
              <span>{copiedMemo ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'مذكرة واتساب' : 'WhatsApp')}</span>
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all cursor-pointer shadow-xs"
              title={isAr ? 'تصدير شيت الاستنزاف لـ Excel' : 'Export to Excel'}
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>{isAr ? 'Excel' : 'Export'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Top Tier 4 Executive KPI Indicator Cards (مؤشرات استنزاف الموظفين الكبرى) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Projected Staff Attrition Rate (معدل استنزاف الموظفين) */}
        <div className="bg-gradient-to-br from-rose-50 via-red-50/40 to-white rounded-2xl p-5 border border-rose-200 shadow-sm relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider block">
                {isAr ? 'معدل استنزاف الموظفين المتوقع' : 'Projected Staff Attrition Rate'}
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl sm:text-4xl font-black text-rose-950 font-mono">
                  {summary.adjustedAttritionRatePostActionsPct}%
                </span>
                {summary.projectedAttritionRatePct !== summary.adjustedAttritionRatePostActionsPct && (
                  <span className="text-xs font-bold line-through text-slate-400 font-mono">
                    {summary.projectedAttritionRatePct}%
                  </span>
                )}
              </div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-md shrink-0">
              <UserMinus className="w-6 h-6" />
            </div>
          </div>

          <div className="mt-3.5 pt-2.5 border-t border-rose-100 flex items-center justify-between text-xs">
            <span className="text-slate-600 text-[11px]">
              {summary.adjustedAttritionRatePostActionsPct === 0
                ? isAr
                  ? '✓ تم تحييد مخاطر الاستنزاف بالكامل'
                  : '✓ All risks mitigated'
                : isAr
                ? `${summary.atRiskStaffCount} موظف متميز معرض للمخاطر`
                : `${summary.atRiskStaffCount} talent at risk`}
            </span>
            <span
              className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                summary.adjustedAttritionRatePostActionsPct === 0
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : summary.adjustedAttritionRatePostActionsPct <= 15
                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse'
              }`}
            >
              {summary.adjustedAttritionRatePostActionsPct === 0
                ? isAr
                  ? 'استقرار تام'
                  : 'Stable'
                : summary.adjustedAttritionRatePostActionsPct <= 15
                ? isAr
                  ? 'مخاطر منخفضة'
                  : 'Low Risk'
                : isAr
                ? 'تدخل استباقي مطلوب'
                : 'Action Required'}
            </span>
          </div>

          <div className="w-full bg-rose-100 rounded-full h-2 mt-2.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                summary.adjustedAttritionRatePostActionsPct === 0
                  ? 'bg-emerald-500'
                  : summary.adjustedAttritionRatePostActionsPct <= 15
                  ? 'bg-amber-500'
                  : 'bg-rose-600'
              }`}
              style={{ width: `${Math.min(100, Math.max(10, summary.adjustedAttritionRatePostActionsPct))}%` }}
            />
          </div>
        </div>

        {/* Card 2: Nearest Potential Departure Date Window */}
        <div className="bg-gradient-to-br from-amber-50 via-orange-50/40 to-white rounded-2xl p-5 border border-amber-200 shadow-sm relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
                {isAr ? 'أقرب نافذة مغادرة محتملة' : 'Nearest Departure Window'}
              </span>
              <div className="text-xl sm:text-2xl font-black text-amber-950 font-mono mt-1">
                {nearestProfile ? (isAr ? nearestProfile.potentialDepartureWindowAr : nearestProfile.potentialDepartureWindowEn) : 'مارس 2027'}
              </div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shrink-0">
              <Calendar className="w-6 h-6" />
            </div>
          </div>

          <div className="mt-3.5 pt-2.5 border-t border-amber-100 flex items-center justify-between text-xs">
            <span className="text-slate-600 text-[11px]">
              {isAr ? 'الموظف الأقرب للمخاطر:' : 'At-Risk Performer:'}
            </span>
            <span className="font-bold text-amber-900 font-mono text-xs">
              {summary.nearestDepartureEmployee}
            </span>
          </div>

          <div className="mt-2 flex items-center justify-between text-[11px] text-amber-800 font-bold font-mono">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-600" />
              <span>
                {nearestProfile?.daysUntilDepartureWindow || 134} {isAr ? 'يوماً متبقية على النافذة' : 'days countdown'}
              </span>
            </span>
            <span>{isAr ? 'تجديد عقود Q1' : 'Q1 Renewal'}</span>
          </div>
        </div>

        {/* Card 3: Monthly Sales Revenue At Risk */}
        <div className="bg-gradient-to-br from-indigo-50 via-blue-50/40 to-white rounded-2xl p-5 border border-indigo-200 shadow-sm relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-indigo-800 uppercase tracking-wider block">
                {isAr ? 'المبيعات الشهرية المعرضة للخطر' : 'Monthly Sales at Risk'}
              </span>
              <div className="text-2xl sm:text-3xl font-black text-indigo-950 font-mono mt-1">
                {formatCurrencyNumber(summary.totalMonthlyRevenueAtRisk)}{' '}
                <span className="text-xs font-normal text-slate-500">ج.م</span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shrink-0">
              <Flame className="w-6 h-6" />
            </div>
          </div>

          <div className="mt-3.5 pt-2.5 border-t border-indigo-100 flex items-center justify-between text-xs">
            <span className="text-slate-600 text-[11px]">
              {isAr ? 'الخطر السنوي المحتمل:' : 'Annual Pipeline at Risk:'}
            </span>
            <strong className="text-indigo-950 font-mono text-xs">
              {formatCurrencyNumber(summary.totalAnnualRevenueAtRisk)} ج.م
            </strong>
          </div>

          <div className="w-full bg-indigo-100 rounded-full h-2 mt-2.5 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full w-[70%]" />
          </div>
        </div>

        {/* Card 4: Proactive Retention ROI & Replacement Savings */}
        <div className="bg-gradient-to-br from-emerald-50 via-teal-50/40 to-white rounded-2xl p-5 border border-emerald-200 shadow-sm relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                {isAr ? 'عائد استثمار خطط الاستبقاء (ROI)' : 'Retention Investment ROI'}
              </span>
              <div className="text-3xl sm:text-4xl font-black text-emerald-950 font-mono mt-1 flex items-baseline gap-1">
                <span>{summary.retentionRoiMultiplier}x</span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  {isAr ? 'عائد استثنائي' : 'High ROI'}
                </span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shrink-0">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>

          <div className="mt-3.5 pt-2.5 border-t border-emerald-100 flex items-center justify-between text-xs">
            <span className="text-slate-600 text-[11px]">
              {isAr ? 'تكاليف استبدال تم توفيرها:' : 'Replacement Saved:'}
            </span>
            <strong className="text-emerald-900 font-mono text-xs">
              {formatCurrencyNumber(summary.totalEstimatedReplacementCost)} ج.م
            </strong>
          </div>

          <div className="w-full bg-emerald-100 rounded-full h-2 mt-2.5 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full w-[95%]" />
          </div>
        </div>
      </div>

      {/* 3. Filter Pill Bar & Attrition Status Summary */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-bold text-slate-500 shrink-0 ml-1">
            {isAr ? 'تصفية الكوادر المتميزة:' : 'Filter Staff:'}
          </span>
          <button
            type="button"
            onClick={() => setSelectedFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            {isAr ? 'كافة المستشارين' : 'All Staff'} ({summary.profiles.length})
          </button>

          <button
            type="button"
            onClick={() => setSelectedFilter('high_risk')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              selectedFilter === 'high_risk'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            <span>{isAr ? 'بحاجة تدخل استباقي عاجل' : 'Action Required'}</span>
            <span className="bg-rose-200 text-rose-900 text-[10px] px-1.5 py-0.2 rounded-full font-mono">
              {summary.profiles.filter(
                (p) =>
                  (p.riskLevel === 'critical' || p.riskLevel === 'high') &&
                  p.proactiveRetentionAction.status === 'pending'
              ).length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedFilter('retained')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              selectedFilter === 'retained'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isAr ? 'تم تطبيق خطة الاستبقاء' : 'Protected / Retained'}</span>
            <span className="bg-emerald-200 text-emerald-900 text-[10px] px-1.5 py-0.2 rounded-full font-mono">
              {summary.profiles.filter((p) => p.proactiveRetentionAction.status === 'applied').length}
            </span>
          </button>
        </div>

        <div className="text-xs text-slate-500 flex items-center gap-2 shrink-0">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>
            {isAr ? 'مؤشر استقرار الفرع العام:' : 'Talent Stability Index:'}{' '}
            <strong className="text-emerald-800 font-mono text-sm">{summary.talentStabilityIndexPct}%</strong>
          </span>
        </div>
      </div>

      {/* 4. Detailed Performer Attrition & Proactive Retention Action Cards */}
      <div className="space-y-4">
        {filteredProfiles.map((profile) => {
          const isApplied = profile.proactiveRetentionAction.status === 'applied';
          const isExpanded = activeProfileId === profile.id;

          return (
            <div
              key={profile.id}
              className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden shadow-xs hover:shadow-md ${
                isApplied
                  ? 'border-emerald-300 ring-1 ring-emerald-200/60'
                  : profile.riskLevel === 'critical'
                  ? 'border-rose-400 ring-2 ring-rose-200/70'
                  : profile.riskLevel === 'high'
                  ? 'border-amber-300 ring-1 ring-amber-200/50'
                  : 'border-slate-200'
              }`}
            >
              {/* Profile Card Header */}
              <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-50/80 via-white to-slate-50/40 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg shrink-0 shadow-xs ${
                      isApplied
                        ? 'bg-emerald-600 text-white'
                        : profile.riskLevel === 'critical'
                        ? 'bg-rose-600 text-white animate-pulse'
                        : 'bg-amber-500 text-white'
                    }`}
                  >
                    {isApplied ? <ShieldCheck className="w-6 h-6" /> : <Award className="w-6 h-6" />}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-base font-black text-slate-900">{profile.employeeName}</h4>
                      {profile.employeeId && (
                        <span className="font-mono text-xs px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md border border-slate-200">
                          #{profile.employeeId}
                        </span>
                      )}
                      <span
                        className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border ${
                          isApplied
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : profile.riskLevel === 'critical'
                            ? 'bg-rose-100 text-rose-800 border-rose-300'
                            : profile.riskLevel === 'high'
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : 'bg-blue-100 text-blue-800 border-blue-300'
                        }`}
                      >
                        {isApplied
                          ? isAr
                            ? '✓ استبقاء نشط ومؤمّن'
                            : 'Active Retention Secured'
                          : profile.riskLevel === 'critical'
                          ? isAr
                            ? 'خطر استنزاف حرج جداً'
                            : 'Critical Attrition Risk'
                          : profile.riskLevel === 'high'
                          ? isAr
                            ? 'خطر استنزاف مرتفع'
                            : 'High Poaching Risk'
                          : isAr
                          ? 'مخاطر استنزاف معتدلة'
                          : 'Moderate Risk'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 mt-1 font-medium flex items-center gap-2 flex-wrap">
                      <span>{profile.role}</span>
                      <span>·</span>
                      <span>
                        {isAr ? `مدة الخدمة: ${profile.tenureMonths} شهراً` : `Tenure: ${profile.tenureMonths} mos`}
                      </span>
                      <span>·</span>
                      <span className="font-bold text-emerald-700">
                        {isAr ? 'نسبة التحقيق:' : 'Achievement:'} {profile.achievementRate.toFixed(1)}%
                      </span>
                    </p>
                  </div>
                </div>

                {/* Right side: Departure Window and Action CTA */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="bg-slate-100/90 rounded-xl px-3 py-2 border border-slate-200 text-left md:text-right">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">
                      {isAr ? 'تاريخ المغادرة المحتمل' : 'Predicted Departure'}
                    </span>
                    <strong className="text-xs font-black text-rose-900 font-mono block">
                      {isAr ? profile.potentialDepartureWindowAr : profile.potentialDepartureWindowEn}
                    </strong>
                    <span className="text-[10px] text-slate-500 font-mono">
                      ({profile.daysUntilDepartureWindow} {isAr ? 'يوماً متبقية' : 'days left'})
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleAction(profile.employeeName, isApplied)}
                    className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-xs active:scale-95 whitespace-nowrap ${
                      isApplied
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                        : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200'
                    }`}
                  >
                    {isApplied ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>{isAr ? 'تم اعتماد الخطة (إلغاء)' : 'Applied (Undo)'}</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4 text-white" />
                        <span>{isAr ? 'اعتماد خطة الاستبقاء الفورية' : 'Apply Retention Plan'}</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveProfileId(isExpanded ? null : profile.id)}
                    className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                    title={isAr ? 'عرض أو إخفاء التفاصيل' : 'Toggle details'}
                  >
                    <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Profile Card Body */}
              <div className="p-5 sm:p-6 space-y-4">
                {/* 3 Metric Mini-Strips */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-500 font-sans block">
                      {isAr ? 'المبيعات الشهرية للمستشار:' : 'Monthly Sales Velocity:'}
                    </span>
                    <strong className="text-slate-900 font-bold text-sm">
                      {formatCurrencyNumber(profile.monthlySalesContribution)} ج.م
                    </strong>
                    <span className="text-[10px] text-emerald-700 block mt-0.5">
                      {isAr ? 'ركيزة إيرادات رئيسية بالفرع' : 'Core branch revenue driver'}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-500 font-sans block">
                      {isAr ? 'احتمالية المغادرة بدون تدخل:' : 'Baseline Attrition Probability:'}
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <strong className={`font-bold text-sm ${isApplied ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {profile.attritionProbabilityPct}%
                      </strong>
                      {isApplied && (
                        <span className="text-[10px] text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded-md font-sans font-bold">
                          {isAr ? 'انخفض بنسبة -64%' : '-64% dropped'}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      {isApplied ? (isAr ? 'تم تأمين المستشار' : 'Advisor Secured') : (isAr ? 'معرض للاستقطاب' : 'Poaching Exposure')}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-500 font-sans block">
                      {isAr ? 'تكلفة الاستبدال البديل (توظيف وتدريب):' : 'Estimated Replacement Cost:'}
                    </span>
                    <strong className="text-rose-900 font-bold text-sm">
                      {formatCurrencyNumber(profile.replacementCostEstimate)} ج.م
                    </strong>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      {isAr ? 'تشمل توقف المبيعات 45 يوماً' : 'Includes 45-day ramp-up loss'}
                    </span>
                  </div>
                </div>

                {/* Risk Drivers & Headhunting Competitors */}
                <div className="bg-rose-50/50 rounded-xl p-4 border border-rose-100 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-rose-950 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      <span>{isAr ? 'دوافع الاستنزاف ومؤشرات استقطاب المنافسين:' : 'Poaching Drivers & Competitors:'}</span>
                    </h5>
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
                      <span className="text-slate-400">{isAr ? 'المنافسون المتربصون:' : 'Active Recruiters:'}</span>
                      <span className="text-rose-900 font-mono">
                        {profile.headhuntingCompetitors.join(' · ')}
                      </span>
                    </div>
                  </div>

                  <ul className="list-disc list-inside space-y-1 text-slate-700 text-[11px] pr-1">
                    {(isAr ? profile.primaryRiskDriversAr : profile.primaryRiskDriversEn).map((driver, dIdx) => (
                      <li key={dIdx} className="leading-relaxed">
                        {driver}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Proactive Retention Action Box */}
                <div
                  className={`rounded-xl p-4.5 border transition-colors ${
                    isApplied
                      ? 'bg-emerald-50/80 border-emerald-300'
                      : 'bg-gradient-to-r from-amber-50/70 via-white to-emerald-50/40 border-amber-300'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-ping" />
                        <span className="text-xs font-black text-slate-900">
                          {isAr ? 'القرار الإداري الاستباقي الموصى به للاحتفاظ:' : 'Recommended Proactive Retention Decision:'}
                        </span>
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md border border-amber-200">
                          {isAr ? profile.proactiveRetentionAction.titleAr : profile.proactiveRetentionAction.titleEn}
                        </span>
                      </div>

                      <p className="text-xs text-slate-700 leading-relaxed pr-4">
                        {isAr ? profile.proactiveRetentionAction.descriptionAr : profile.proactiveRetentionAction.descriptionEn}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60">
                      <div className="text-left sm:text-right font-mono">
                        <span className="text-[10px] text-slate-500 block">{isAr ? 'تكلفة الاستبقاء:' : 'Package Cost:'}</span>
                        <strong className="text-xs font-bold text-slate-900">
                          {formatCurrencyNumber(profile.proactiveRetentionAction.estimatedCost)} ج.م
                        </strong>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleAction(profile.employeeName, isApplied)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95 ${
                          isApplied
                            ? 'bg-emerald-700 text-white hover:bg-emerald-800'
                            : 'bg-emerald-600 text-white hover:bg-emerald-700'
                        }`}
                      >
                        {isApplied ? (isAr ? '✓ معتمد ومطبق' : 'Applied') : (isAr ? 'تطبيق الإجراء' : 'Apply')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. Executive Strategic Guidance on Talent Attrition */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 border border-indigo-800/60 text-xs space-y-3">
        <div className="flex items-center gap-2">
          <Crown className="w-5 h-5 text-amber-400" />
          <h5 className="font-bold text-white text-sm">
            {isAr
              ? 'توجيهات الإدارة التنفيذية لفرع كونكورد بلازا للاحتفاظ بالمواهب:'
              : 'Executive Guidance for Talent Preservation at Concorde Plaza:'}
          </h5>
        </div>

        <p className="text-indigo-100/90 leading-relaxed">
          {isAr
            ? `إن كلفة فقدان مستشار مبيعات أول كالمستشار أحمد ربيع أو عمرو عبد الحليم تتجاوز مجرد تكلفة التوظيف، حيث تشير البيانات التاريخية لفرع كونكورد بلازا إلى أن استبدال مستشار متميز يتسبب في تراجع وتيرة إغلاق هواتف الفلاج شيب والتقسيط بنسبة لا تقل عن 35% خلال أول 60 يوماً من تولي مستشار جديد، مما يعرض ما يزيد عن 500,000 ج.م من الإيرادات الشهرية للخطر. لذا فإن اعتماد حزم الاستبقاء الاستباقية (الترقية المهنية لـ Senior Consultant ومكافأة الولاء السنوية) يمثل استثماراً ذا عائد استثنائي يتجاوز 32x ويضمن استدامة التفوق المالي للفرع حتى نهاية العام.`
            : `Losing senior talent like Ahmed Rabie or Amr Abdelhalim carries operational risk far exceeding direct replacement costs. Concorde Plaza historical data shows that onboarding replacements causes a ~35% drop in flagship and installment closing velocity over the first 60 days. Proactive retention packages yield a 32x return, permanently safeguarding branch revenue momentum.`}
        </p>

        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-indigo-800/80 text-[11px] text-indigo-300">
          <span>{isAr ? 'إدارة الفرع:' : 'Branch Management:'} <strong>هاني حنا - راية للإلكترونيات</strong></span>
          <span>·</span>
          <span>{isAr ? 'دورة التقييم:' : 'Evaluation Cycle:'} <strong>Q4 2026 / Q1 2027</strong></span>
          <span>·</span>
          <span className="text-emerald-300 font-bold">
            {isAr ? 'تأثير الاستبقاء على التارجت السنوي: حماية فائض +445,000 ج.م' : 'Annual Target Protection: +445,000 EGP'}
          </span>
        </div>
      </div>
    </div>
  );
};
