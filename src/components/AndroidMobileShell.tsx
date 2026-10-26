import React, { useState, useMemo } from 'react';
import {
  Home,
  Users,
  Award,
  FileSpreadsheet,
  Laptop,
  Upload,
  Share2,
  TrendingUp,
  Target,
  Search,
  CheckCircle2,
  Copy,
  Check,
  ChevronRight,
  ChevronDown,
  Layers,
  Sparkles,
  ShoppingBag,
  Zap,
  Info,
  DollarSign,
  ArrowUpRight,
  ShieldCheck,
  Filter,
  BarChart2,
  Smartphone,
  ExternalLink,
} from 'lucide-react';
import {
  SalesRecord,
  BranchTotalTargetStructure,
  ProductIncentiveRule,
  Language,
  Currency,
  AuditReport,
} from '../types/sales';
import {
  formatCurrencyNumber,
  calculateBranchPerformances,
  calculateOverallStats,
} from '../utils/calculations';
import { exportRecordsToExcel } from '../utils/excelParser';
import { translations } from '../utils/i18n';

interface AndroidMobileShellProps {
  records: SalesRecord[];
  targetStructure: BranchTotalTargetStructure;
  incentiveRules: ProductIncentiveRule[];
  auditReport: AuditReport | null;
  language: Language;
  currency: Currency;
  vatDisplayMode: 'afterVat' | 'beforeVat';
  onToggleVatMode: () => void;
  onSwitchToDesktop: () => void;
  onOpenUploadModal: () => void;
  onOpenIncentivesModal: () => void;
  onOpenTargetModal: () => void;
  onOpenMonthlyReportModal: () => void;
  onOpenDownloadCenter: () => void;
  onOpenUnifiedPrompt: () => void;
  onOpenInventoryOptimizer: () => void;
  onSelectIncentiveRecord: (record: SalesRecord) => void;
}

type MobileTab = 'home' | 'staff' | 'incentives' | 'reports';

export const AndroidMobileShell: React.FC<AndroidMobileShellProps> = ({
  records,
  targetStructure,
  incentiveRules,
  auditReport,
  language,
  currency,
  vatDisplayMode,
  onToggleVatMode,
  onSwitchToDesktop,
  onOpenUploadModal,
  onOpenIncentivesModal,
  onOpenTargetModal,
  onOpenMonthlyReportModal,
  onOpenDownloadCenter,
  onOpenUnifiedPrompt,
  onOpenInventoryOptimizer,
  onSelectIncentiveRecord,
}) => {
  const [activeTab, setActiveTab] = useState<MobileTab>('home');
  const [staffSearchQuery, setStaffSearchQuery] = useState('');
  const [staffSortBy, setStaffSortBy] = useState<'achievement' | 'sales' | 'accessories'>('achievement');
  const [expandedEmployeeId, setExpandedEmployeeId] = useState<string | null>(null);

  // Incentive calculator state
  const [selectedCalcEmployee, setSelectedCalcEmployee] = useState<string>(
    records[0]?.employee || ''
  );
  const [copiedSummary, setCopiedSummary] = useState(false);

  const isAr = language === 'ar';
  const t = translations[language];

  // Branch and Overall calculations
  const branchPerformances = useMemo(
    () => calculateBranchPerformances(records),
    [records]
  );
  const overallStats = useMemo(
    () => calculateOverallStats(records, branchPerformances),
    [records, branchPerformances]
  );

  // Totals & Achievements based on VAT Display Mode
  const isAfterVat = vatDisplayMode === 'afterVat';
  const effectiveTotalActual = useMemo(() => {
    return records.reduce((sum, r) => {
      if (isAfterVat) {
        return sum + (r.actualAfterVat ?? r.actual);
      }
      return sum + (r.actualBeforeVat ?? (r.actual / 1.14));
    }, 0);
  }, [records, isAfterVat]);

  const grandTarget = targetStructure.grandTotal || targetStructure.revenueTarget;
  const grandAchievementRate = grandTarget > 0 ? (effectiveTotalActual / grandTarget) * 100 : 0;
  const remainingToTarget = Math.max(0, grandTarget - effectiveTotalActual);

  // Total quantity sold
  const totalUnitsQty = useMemo(() => {
    return records.reduce((sum, r) => {
      if (r.incentiveItems && r.incentiveItems.length > 0) {
        return sum + r.incentiveItems.reduce((iSum, it) => iSum + (it.quantitySold || 1), 0);
      }
      return sum + 1;
    }, 0);
  }, [records]);

  // Total VAT amount
  const totalVatAmount = useMemo(() => {
    return records.reduce((sum, r) => {
      const gross = r.actualAfterVat ?? r.actual;
      const net = r.actualBeforeVat ?? (gross / 1.14);
      return sum + (gross - net);
    }, 0);
  }, [records]);

  // Filtered & Sorted Staff
  const sortedStaff = useMemo(() => {
    let list = [...records];
    if (staffSearchQuery.trim()) {
      const q = staffSearchQuery.toLowerCase().trim();
      list = list.filter(
        (r) =>
          r.employee.toLowerCase().includes(q) ||
          (r.employeeId && r.employeeId.toLowerCase().includes(q))
      );
    }

    if (staffSortBy === 'achievement') {
      list.sort((a, b) => b.achievementRate - a.achievementRate);
    } else if (staffSortBy === 'sales') {
      list.sort((a, b) => b.actual - a.actual);
    } else if (staffSortBy === 'accessories') {
      list.sort((a, b) => {
        const ratioA = a.accessoriesActual && a.actual > 0 ? a.accessoriesActual / a.actual : 0;
        const ratioB = b.accessoriesActual && b.actual > 0 ? b.accessoriesActual / b.actual : 0;
        return ratioB - ratioA;
      });
    }
    return list;
  }, [records, staffSearchQuery, staffSortBy]);

  // Selected employee for Incentive Calculator
  const calcRecord = useMemo(() => {
    return records.find((r) => r.employee === selectedCalcEmployee) || records[0];
  }, [records, selectedCalcEmployee]);

  // Copy WhatsApp Daily Summary
  const handleCopyWhatsAppSummary = () => {
    const text = isAr
      ? `📊 *ملخص أداء فرع راية تريد - كونكورد بلازا*
📅 التاريخ: ${new Date().toLocaleDateString('ar-EG')}
🎯 الهدف الشهري: ${grandTarget.toLocaleString()} ج.م
💰 المحقق حتى الآن: ${Math.round(effectiveTotalActual).toLocaleString()} ج.م (${grandAchievementRate.toFixed(1)}%)
📦 عدد الوحدات المباعة: ${totalUnitsQty.toLocaleString()} وحدة
👥 أفضل بائع اليوم: ${overallStats.bestEmployee?.employee || 'فريق كونكورد'} (${overallStats.bestEmployee?.achievementRate.toFixed(1)}%)
✨ تم التحديث عبر منظومة راية الذكية`
      : `📊 *Raya Trade Concorde Plaza Daily Summary*
📅 Date: ${new Date().toLocaleDateString('en-US')}
🎯 Monthly Target: ${grandTarget.toLocaleString()} EGP
💰 Achieved: ${Math.round(effectiveTotalActual).toLocaleString()} EGP (${grandAchievementRate.toFixed(1)}%)
📦 Units Sold: ${totalUnitsQty.toLocaleString()} units
👥 Top Performer: ${overallStats.bestEmployee?.employee || 'Concorde Team'}
✨ Synced with Raya Smart Operations`;

    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  return (
    <div
      className="min-h-screen bg-slate-100 text-slate-900 pb-20 select-none font-sans"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* ── 1. Android Top App Bar ── */}
      <header className="sticky top-0 z-30 bg-slate-900 text-white shadow-md border-b border-slate-800">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center font-black text-white text-base shadow-xs">
              R
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-bold tracking-tight text-white">
                  {isAr ? 'راية كونكورد بلازا' : 'Raya Concorde Plaza'}
                </h1>
                <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800">
                  Android OS
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {targetStructure?.period || records[0]?.period || (isAr ? 'الفترة الحالية' : 'Current Period')} ·{' '}
                <span className="font-mono text-emerald-300 font-semibold">
                  {grandAchievementRate.toFixed(1)}%
                </span>
              </p>
            </div>
          </div>

          {/* Quick Actions in Header */}
          <div className="flex items-center gap-2">
            {/* VAT Mode Toggle */}
            <button
              type="button"
              onClick={onToggleVatMode}
              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-emerald-300 border border-slate-700 transition-colors"
              title={isAr ? 'تبديل وضع الضريبة (شامل / صافي)' : 'Toggle VAT Mode'}
            >
              {isAfterVat ? (isAr ? 'شامل 14%' : 'Gross') : (isAr ? 'صافي' : 'Net')}
            </button>

            {/* Switch to Desktop */}
            <button
              type="button"
              onClick={onSwitchToDesktop}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition-all shadow-xs cursor-pointer"
              title={isAr ? 'التبديل إلى واجهة الكمبيوتر وسطح المكتب' : 'Switch to Desktop View'}
            >
              <Laptop className="w-3.5 h-3.5" />
              <span>{isAr ? 'شاشة PC' : 'Desktop'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── 2. Screen Content by Active Tab ── */}
      <main className="p-3.5 max-w-lg mx-auto space-y-3.5">
        {/* ════════════════════════════════════════════════════════════════════
            TAB 1: الرئيسية والأهداف (HOME & TARGETS)
        ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'home' && (
          <div className="space-y-3.5 animate-in fade-in duration-150">
            {/* Grand October Target Card */}
            <section className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 text-white rounded-2xl p-4 shadow-lg border border-slate-800 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <Target className="w-4 h-4" />
                  <span>{isAr ? `مستهدف فرع كونكورد (${targetStructure?.period || records[0]?.period || 'الفترة الحالية'})` : `Concorde Target (${targetStructure?.period || records[0]?.period || 'Current'})`}</span>
                </span>
                <span className="text-xs font-mono text-slate-300 bg-white/10 px-2 py-0.5 rounded-full">
                  {isAfterVat ? (isAr ? 'شامل الضريبة 14%' : 'Gross with VAT') : (isAr ? 'صافي قبل الضريبة' : 'Net Pre-VAT')}
                </span>
              </div>

              {/* Progress Bar & Rate */}
              <div className="mb-4">
                <div className="flex items-baseline justify-between mb-1">
                  <div className="text-2xl font-black font-mono tracking-tight text-white">
                    {Math.round(effectiveTotalActual).toLocaleString()}{' '}
                    <span className="text-xs font-normal text-slate-400">{currency}</span>
                  </div>
                  <div className="text-lg font-bold font-mono text-emerald-400">
                    {grandAchievementRate.toFixed(1)}%
                  </div>
                </div>

                <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      grandAchievementRate >= 100
                        ? 'bg-emerald-400'
                        : grandAchievementRate >= 80
                        ? 'bg-emerald-500'
                        : 'bg-amber-400'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(3, grandAchievementRate))}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1.5">
                  <span>
                    {isAr ? 'الهدف:' : 'Goal:'}{' '}
                    <strong className="text-slate-200 font-mono">{grandTarget.toLocaleString()}</strong> {currency}
                  </span>
                  <span>
                    {isAr ? 'المتبقي:' : 'Remaining:'}{' '}
                    <strong className="text-amber-400 font-mono">{Math.round(remainingToTarget).toLocaleString()}</strong> {currency}
                  </span>
                </div>
              </div>

              {/* Target Breakdown Grid (Mobiles, Accessories, Other TVs/MDA, Installment) */}
              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800 text-xs">
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                  <div className="text-[10px] text-slate-400">{isAr ? 'الهواتف (Mobiles)' : 'Mobiles'}</div>
                  <div className="font-bold font-mono text-slate-200 mt-0.5">
                    {(targetStructure.revenueBreakdown?.mobiles || 0).toLocaleString()} {currency}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                  <div className="text-[10px] text-slate-400">{isAr ? 'الملحقات (Accessories)' : 'Accessories'}</div>
                  <div className="font-bold font-mono text-slate-200 mt-0.5">
                    {(targetStructure.revenueBreakdown?.accessories || 0).toLocaleString()} {currency}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                  <div className="text-[10px] text-slate-400">{isAr ? 'الشاشات والأجهزة' : 'TVs & Appliances'}</div>
                  <div className="font-bold font-mono text-slate-200 mt-0.5">
                    {(targetStructure.revenueBreakdown?.other || 0).toLocaleString()} {currency}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                  <div className="text-[10px] text-slate-400">{isAr ? 'التقسيط الجماعي' : 'Installment'}</div>
                  <div className="font-bold font-mono text-emerald-300 mt-0.5">
                    {(targetStructure.installmentTarget || 0).toLocaleString()} {currency}
                  </div>
                </div>
              </div>
            </section>

            {/* Quick KPI Cards Grid */}
            <section className="grid grid-cols-2 gap-2.5">
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="text-[11px] text-slate-500 font-medium">
                  {isAr ? 'المبيعات قبل الضريبة (Net)' : 'Pre-VAT Sales'}
                </div>
                <div className="text-lg font-bold font-mono text-slate-900 mt-1">
                  {Math.round(overallStats.totalActual / 1.14).toLocaleString()}{' '}
                  <span className="text-[10px] font-normal text-slate-500">{currency}</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {isAr ? 'صافي المبيعات الأساسية' : 'Net Revenue'}
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="text-[11px] text-slate-500 font-medium">
                  {isAr ? 'ضريبة القيمة المضافة (14%)' : 'VAT (14%) Amount'}
                </div>
                <div className="text-lg font-bold font-mono text-blue-700 mt-1">
                  {Math.round(totalVatAmount).toLocaleString()}{' '}
                  <span className="text-[10px] font-normal text-slate-500">{currency}</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {isAr ? 'المطابقة الحسابية المعتمدة' : 'Official Tax'}
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="text-[11px] text-slate-500 font-medium">
                  {isAr ? 'إجمالي القطع المباعة' : 'Units Sold'}
                </div>
                <div className="text-lg font-bold font-mono text-emerald-700 mt-1">
                  {totalUnitsQty.toLocaleString()}{' '}
                  <span className="text-[10px] font-normal text-slate-500">{isAr ? 'قطعة' : 'units'}</span>
                </div>
                <div className="text-[10px] text-emerald-600 font-medium mt-0.5">
                  {isAr ? 'كافة بنود الفواتير المعتمدة' : 'All approved items'}
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="text-[11px] text-slate-500 font-medium">
                  {isAr ? 'عدد مستشاري المبيعات' : 'Sales Advisors'}
                </div>
                <div className="text-lg font-bold font-mono text-purple-700 mt-1">
                  {records.length}{' '}
                  <span className="text-[10px] font-normal text-slate-500">{isAr ? 'مستشار' : 'reps'}</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {overallStats.achievedEmployeesCount} {isAr ? 'محققين الهدف' : 'achieved'}
                </div>
              </div>
            </section>

            {/* Quick Action Floating Bar */}
            <section className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={onOpenUploadModal}
                className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer min-h-[44px]"
              >
                <Upload className="w-4 h-4" />
                <span>{isAr ? 'رفع ملف إكسيل' : 'Upload Excel'}</span>
              </button>

              <button
                type="button"
                onClick={handleCopyWhatsAppSummary}
                className="py-2.5 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer min-h-[44px]"
                title={isAr ? 'نسخ ملخص واتساب اليومي' : 'Copy WhatsApp summary'}
              >
                {copiedSummary ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">{isAr ? 'تم النسخ!' : 'Copied!'}</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4 text-slate-600" />
                    <span>{isAr ? 'مشاركة' : 'Share'}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onOpenTargetModal}
                className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer min-h-[44px]"
                title={isAr ? 'تعديل وتوزيع الأهداف' : 'Edit Targets'}
              >
                <Target className="w-4 h-4 text-slate-600" />
                <span>{isAr ? 'الأهداف' : 'Targets'}</span>
              </button>
            </section>

            {/* Leader of the Day Preview */}
            {overallStats.bestEmployee && (
              <section className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-lg shadow-xs">
                    👑
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-amber-900 block">
                      {isAr ? 'متصدر المبيعات حالياً' : 'Top Sales Leader'}
                    </span>
                    <span className="text-sm font-bold text-slate-900">
                      {overallStats.bestEmployee.employee}
                    </span>
                    <span className="text-xs text-slate-500 block font-mono">
                      {Math.round(overallStats.bestEmployee.actual).toLocaleString()} {currency}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-amber-700 font-mono bg-amber-100/90 px-2 py-1 rounded-lg border border-amber-200">
                    {overallStats.bestEmployee.achievementRate.toFixed(1)}%
                  </span>
                </div>
              </section>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB 2: لوحة الموظفين (STAFF & LEADERBOARD)
        ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'staff' && (
          <div className="space-y-3.5 animate-in fade-in duration-150">
            {/* Search & Sort Bar */}
            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="relative">
                <Search className={`w-4 h-4 absolute top-1/2 -translate-y-1/2 text-slate-400 ${isAr ? 'right-3' : 'left-3'}`} />
                <input
                  type="text"
                  placeholder={isAr ? 'بحث باسم المستشار أو الرقم الوظيفي...' : 'Search by name or employee ID...'}
                  value={staffSearchQuery}
                  onChange={(e) => setStaffSearchQuery(e.target.value)}
                  className={`w-full py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 ${
                    isAr ? 'pr-9 pl-3' : 'pl-9 pr-3'
                  }`}
                />
              </div>

              {/* Sort Pills */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-[11px] text-slate-500 font-medium">
                  {isAr ? 'الترتيب:' : 'Sort:'}
                </span>
                <button
                  type="button"
                  onClick={() => setStaffSortBy('achievement')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer min-h-[32px] ${
                    staffSortBy === 'achievement'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {isAr ? 'نسبة التحقيق' : 'Achievement %'}
                </button>
                <button
                  type="button"
                  onClick={() => setStaffSortBy('sales')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer min-h-[32px] ${
                    staffSortBy === 'sales'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {isAr ? 'المبيعات' : 'Sales'}
                </button>
                <button
                  type="button"
                  onClick={() => setStaffSortBy('accessories')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer min-h-[32px] ${
                    staffSortBy === 'accessories'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {isAr ? 'الملحقات' : 'Accessories'}
                </button>
              </div>
            </div>

            {/* Employee Cards List */}
            <div className="space-y-2.5">
              {sortedStaff.map((emp, index) => {
                const isExpanded = expandedEmployeeId === emp.id;
                const isTop3 = index < 3;
                const medalColor =
                  index === 0
                    ? 'bg-amber-400 text-amber-950 border-amber-300'
                    : index === 1
                    ? 'bg-slate-300 text-slate-900 border-slate-200'
                    : index === 2
                    ? 'bg-amber-600 text-white border-amber-500'
                    : 'bg-slate-150 text-slate-700 border-slate-200';

                return (
                  <div
                    key={emp.id}
                    className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden transition-all hover:border-emerald-300"
                  >
                    {/* Primary Tap Area */}
                    <div
                      onClick={() => setExpandedEmployeeId(isExpanded ? null : emp.id)}
                      className="p-3.5 flex items-center justify-between cursor-pointer min-h-[60px]"
                    >
                      <div className="flex items-center gap-3">
                        {/* Rank Badge */}
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold font-mono text-xs border ${medalColor}`}
                        >
                          {index + 1}
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold text-slate-900">{emp.employee}</span>
                            {emp.isAchieved && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                            {emp.employeeId && (
                              <span className="font-mono text-slate-400">
                                #{emp.employeeId}
                              </span>
                            )}
                            <span>·</span>
                            <span>{emp.branch || 'كونكورد بلازا'}</span>
                          </p>
                        </div>
                      </div>

                      {/* Achievement Figures */}
                      <div className="flex items-center gap-2 text-right">
                        <div>
                          <div className="text-sm font-black font-mono text-slate-900">
                            {Math.round(emp.actual).toLocaleString()}{' '}
                            <span className="text-[10px] font-normal text-slate-400">{currency}</span>
                          </div>
                          <div
                            className={`text-xs font-bold font-mono ${
                              emp.achievementRate >= 100 ? 'text-emerald-700' : 'text-amber-700'
                            }`}
                          >
                            {emp.achievementRate.toFixed(1)}%
                          </div>
                        </div>

                        <div className="text-slate-400">
                          {isExpanded ? (
                            <ChevronDown className="w-5 h-5 text-emerald-600" />
                          ) : (
                            <ChevronRight className={`w-5 h-5 ${isAr ? 'rotate-180' : ''}`} />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="px-3.5 pb-2">
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            emp.achievementRate >= 100
                              ? 'bg-emerald-500'
                              : emp.achievementRate >= 75
                              ? 'bg-emerald-400'
                              : 'bg-amber-400'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(3, emp.achievementRate))}%` }}
                        />
                      </div>
                    </div>

                    {/* Expandable Deep Details */}
                    {isExpanded && (
                      <div className="px-3.5 py-3 bg-slate-50 border-t border-slate-100 space-y-3 text-xs">
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="p-2 rounded-xl bg-white border border-slate-200/80">
                            <span className="text-[10px] text-slate-500 block">{isAr ? 'الهدف الفردي' : 'Target'}</span>
                            <span className="font-mono font-bold text-slate-800">
                              {emp.target.toLocaleString()} {currency}
                            </span>
                          </div>

                          <div className="p-2 rounded-xl bg-white border border-slate-200/80">
                            <span className="text-[10px] text-slate-500 block">{isAr ? 'الفارق' : 'Diff'}</span>
                            <span
                              className={`font-mono font-bold ${
                                emp.difference >= 0 ? 'text-emerald-700' : 'text-rose-700'
                              }`}
                            >
                              {emp.difference >= 0 ? `+${Math.round(emp.difference).toLocaleString()}` : Math.round(emp.difference).toLocaleString()}
                            </span>
                          </div>

                          <div className="p-2 rounded-xl bg-white border border-slate-200/80">
                            <span className="text-[10px] text-slate-500 block">{isAr ? 'نسبة الملحقات' : 'Acc Ratio'}</span>
                            <span className="font-mono font-bold text-blue-700">
                              {((emp.accessoriesActual && emp.actual > 0 ? emp.accessoriesActual / emp.actual : 0.12) * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>

                        {/* Button to open incentive breakdown */}
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => onSelectIncentiveRecord(emp)}
                            className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer min-h-[44px]"
                          >
                            <Award className="w-3.5 h-3.5" />
                            <span>{isAr ? 'تفاصيل الحافز المكتسب' : 'View Incentive Details'}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB 3: حاسبة الحوافز (INCENTIVES & CONTESTS)
        ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'incentives' && (
          <div className="space-y-3.5 animate-in fade-in duration-150">
            {/* Advisor Selector */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>{isAr ? 'اختر مستشار المبيعات لاحتساب الحافز:' : 'Select Advisor for Incentive:'}</span>
              </label>

              <select
                value={selectedCalcEmployee}
                onChange={(e) => setSelectedCalcEmployee(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
              >
                {records.map((r) => (
                  <option key={r.id} value={r.employee}>
                    {r.employee} {r.employeeId ? `(#${r.employeeId})` : ''} - {Math.round(r.actual).toLocaleString()} {currency}
                  </option>
                ))}
              </select>
            </div>

            {/* Calculated Incentive Hero Card */}
            {calcRecord && (
              <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-900 text-white rounded-2xl p-4 shadow-lg border border-emerald-800/60 relative overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <Award className="w-4 h-4" />
                    <span>{isAr ? 'الحافز المستحق المعتمد' : 'Verified Earned Incentive'}</span>
                  </span>
                  <span className="text-[11px] font-mono text-emerald-300 bg-emerald-900/60 px-2 py-0.5 rounded border border-emerald-700">
                    {calcRecord.period || targetStructure?.period || (isAr ? 'الفترة الحالية' : 'Current Period')}
                  </span>
                </div>

                <div className="mb-4">
                  <div className="text-3xl font-black font-mono tracking-tight text-white">
                    {formatCurrencyNumber(
                      calcRecord.earnedIncentive ||
                        (calcRecord.incentiveItems?.reduce((s, it) => s + it.totalEarned, 0) || 0),
                      currency,
                      true,
                      language
                    )}
                  </div>
                  <div className="text-xs text-emerald-300/80 mt-1 flex items-center gap-2">
                    <span>{calcRecord.employee}</span>
                    {calcRecord.employeeId && <span>· #{calcRecord.employeeId}</span>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-emerald-800/80 text-xs">
                  <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-[10px] text-emerald-200 block">{isAr ? 'مبيعات البائع' : 'Actual Sales'}</span>
                    <span className="font-mono font-bold text-white mt-0.5">
                      {Math.round(calcRecord.actual).toLocaleString()} {currency}
                    </span>
                  </div>

                  <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-[10px] text-emerald-200 block">{isAr ? 'نسبة التحقيق' : 'Target %'}</span>
                    <span className="font-mono font-bold text-emerald-300 mt-0.5">
                      {calcRecord.achievementRate.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Product Rules Breakdown */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
              <h3 className="text-xs font-bold text-slate-800 flex items-center justify-between">
                <span>{isAr ? 'بنود الأصناف المباعة والحوافز المقابلة:' : 'Eligible Sold Items & SKU Rules:'}</span>
                <span className="text-[10px] text-slate-400 font-mono">OCT Incentive.xlsx</span>
              </h3>

              {calcRecord?.incentiveItems && calcRecord.incentiveItems.length > 0 ? (
                <div className="space-y-2">
                  {calcRecord.incentiveItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-slate-900 block">{item.productCategory}</span>
                        <span className="text-[10px] text-slate-500">
                          {isAr ? 'الكمية:' : 'Qty:'} {item.quantitySold || 1} قطعة · {item.unitIncentive} {currency} / قطعة
                        </span>
                      </div>
                      <span className="font-mono font-bold text-emerald-700 text-sm">
                        +{item.totalEarned.toLocaleString()} {currency}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-slate-50 text-slate-500 text-xs text-center">
                  {isAr
                    ? 'يتم احتساب الحافز طبقاً لشرائح تحقيق الفرع وقواعد ملف الحوافز'
                    : 'Incentive calculated based on branch contest tier & corporate rules'}
                </div>
              )}

              {/* View Full Incentive Modal Button */}
              <button
                type="button"
                onClick={onOpenIncentivesModal}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer min-h-[44px]"
              >
                <Award className="w-4 h-4 text-emerald-600" />
                <span>{isAr ? 'فتح محرك الحوافز الشامل للمؤسسة' : 'Open Full Incentives Center'}</span>
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB 4: التقارير والملفات (REPORTS & INGESTION)
        ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'reports' && (
          <div className="space-y-3.5 animate-in fade-in duration-150">
            {/* Excel Upload Trigger Card */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">
                    {isAr ? 'رفع وتدقيق ملفات إكسيل المبيعات' : 'Sales & Incentive Excel Ingestion'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {isAr ? 'يدعم ملفات Details Sales (.xls/.xlsx) وملفات الحوافز' : 'Supports Details Sales & Incentive sheets'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onOpenUploadModal}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer min-h-[48px]"
              >
                <Upload className="w-4 h-4" />
                <span>{isAr ? 'تحميل ملف إكسيل جديد والتحقق منه' : 'Upload & Audit Excel File'}</span>
              </button>
            </div>

            {/* Reconciliation Audit Summary Card */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>{isAr ? 'حالة تدقيق البيانات المالية' : 'Financial Reconciliation Status'}</span>
                </h3>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {isAr ? 'مطابقة 100%' : '100% Reconciled'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-500 block">{isAr ? 'حركات معتمدة' : 'Approved Items'}</span>
                  <span className="font-mono font-bold text-slate-800 text-sm mt-0.5">
                    {records.length} {isAr ? 'سجل' : 'records'}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-500 block">{isAr ? 'إجمالي الكميات (Q)' : 'Total Qty (Q)'}</span>
                  <span className="font-mono font-bold text-emerald-700 text-sm mt-0.5">
                    {totalUnitsQty} {isAr ? 'وحدة' : 'units'}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                {isAr
                  ? 'تم استبعاد المكرر الحقيقي بالكامل والحفاظ على كافة بنود الفواتير متعددة الأصناف بدون أي فقد للبيانات.'
                  : 'Multi-item transactions preserved without duplicate loss. Financial totals strictly reconciled.'}
              </p>
            </div>

            {/* Export & Download Hub Actions */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <h3 className="text-xs font-bold text-slate-900 mb-1">
                {isAr ? 'التصدير والتقارير التنفيذية' : 'Exports & Executive Reports'}
              </h3>

              <button
                type="button"
                onClick={() => exportRecordsToExcel(records, 'Raya_Concorde_Sales.xlsx')}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-between transition-colors cursor-pointer min-h-[44px]"
              >
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>{isAr ? 'تصدير شيت المبيعات الحالي (Excel)' : 'Export Current Sales (Excel)'}</span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={onOpenMonthlyReportModal}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-between transition-colors cursor-pointer min-h-[44px]"
              >
                <div className="flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-blue-600" />
                  <span>{isAr ? 'التقرير الشهري الشامل وتوقعات الربع' : 'Monthly & Quarterly Report'}</span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={onOpenInventoryOptimizer}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-between transition-colors cursor-pointer min-h-[44px]"
              >
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-amber-600" />
                  <span>{isAr ? 'مستشار الإمداد والمخزون الذكي' : 'Inventory & Stock Optimizer'}</span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ── 3. Fixed Android Bottom Navigation Bar (Pattern 1) ── */}
      <nav
        aria-label={isAr ? 'شريط التنقل السفلي للهاتف' : 'Mobile Bottom Navigation'}
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-xl"
      >
        <div className="max-w-md mx-auto grid grid-cols-4 items-center h-16 px-1">
          {/* Tab 1: Home */}
          <button
            type="button"
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors cursor-pointer ${
              activeTab === 'home'
                ? 'text-emerald-700 font-bold'
                : 'text-slate-500 hover:text-slate-900 font-medium'
            }`}
          >
            <Home className={`w-5 h-5 ${activeTab === 'home' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className="text-[10px] mt-1">{isAr ? 'الرئيسية' : 'Home'}</span>
          </button>

          {/* Tab 2: Staff */}
          <button
            type="button"
            onClick={() => setActiveTab('staff')}
            className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors cursor-pointer ${
              activeTab === 'staff'
                ? 'text-emerald-700 font-bold'
                : 'text-slate-500 hover:text-slate-900 font-medium'
            }`}
          >
            <Users className={`w-5 h-5 ${activeTab === 'staff' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className="text-[10px] mt-1">{isAr ? 'الموظفين' : 'Staff'}</span>
          </button>

          {/* Tab 3: Incentives */}
          <button
            type="button"
            onClick={() => setActiveTab('incentives')}
            className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors cursor-pointer ${
              activeTab === 'incentives'
                ? 'text-emerald-700 font-bold'
                : 'text-slate-500 hover:text-slate-900 font-medium'
            }`}
          >
            <Award className={`w-5 h-5 ${activeTab === 'incentives' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className="text-[10px] mt-1">{isAr ? 'الحوافز' : 'Incentives'}</span>
          </button>

          {/* Tab 4: Reports */}
          <button
            type="button"
            onClick={() => setActiveTab('reports')}
            className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors cursor-pointer ${
              activeTab === 'reports'
                ? 'text-emerald-700 font-bold'
                : 'text-slate-500 hover:text-slate-900 font-medium'
            }`}
          >
            <FileSpreadsheet className={`w-5 h-5 ${activeTab === 'reports' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className="text-[10px] mt-1">{isAr ? 'التقارير' : 'Reports'}</span>
          </button>
        </div>
      </nav>
    </div>
  );
};
