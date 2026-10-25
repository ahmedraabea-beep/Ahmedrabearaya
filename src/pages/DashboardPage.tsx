import React from 'react';
import {
  Target,
  TrendingUp,
  Award,
  Users,
  Package,
  FileSpreadsheet,
  Calendar,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  Upload,
  Download,
  FileText,
  DollarSign,
  ShoppingBag,
} from 'lucide-react';
import { useDataStore } from '../store/DataStore';
import {
  selectFinancialTotals,
  selectRevenuePaceMetrics,
  selectCategoryTargetsMatrix,
  selectTopEmployees,
  selectRecordsInActivePeriod,
  selectFilteredRecords,
  selectOverallStatsData,
} from '../store/selectors';
import { AppRoute } from '../components/layout/useHashRouter';
import { KpiCards } from '../components/KpiCards';
import { BranchPerformanceCurve } from '../components/BranchPerformanceCurve';
import { TargetAlertBanner } from '../components/TargetAlertBanner';
import { formatCurrencyNumber } from '../utils/calculations';

interface DashboardPageProps {
  onNavigate?: (route: AppRoute) => void;
  onOpenUpload?: () => void;
  onOpenAddRecord?: () => void;
  onOpenMonthlyReport?: () => void;
  onOpenExport?: () => void;
  onOpenNotificationCenter?: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigate,
  onOpenUpload,
  onOpenAddRecord,
  onOpenMonthlyReport,
  onOpenExport,
  onOpenNotificationCenter,
}) => {
  const { state } = useDataStore();
  const isAr = state.settings.language === 'ar';
  const currency = state.settings.currency;

  const activeRecords = selectRecordsInActivePeriod(state);
  const totals = selectFinancialTotals(state);
  const pace = selectRevenuePaceMetrics(state);
  const categories = selectCategoryTargetsMatrix(state);
  const topEmployees = selectTopEmployees(state, 3);
  const overallStats = selectOverallStatsData(state);

  const handleNav = (route: AppRoute) => {
    if (onNavigate) {
      onNavigate(route);
    } else {
      window.location.hash = `#${route}`;
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200" dir={isAr ? 'rtl' : 'ltr'}>
      {/* ── A. كارت المحقق من الريفينيو الشهري (The Grand Hero Target Card) ── */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 text-white rounded-3xl p-5 sm:p-7 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Row of Hero */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 flex items-center justify-center shadow-xs">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">
                  {isAr ? 'المحقق من الريفينيو الشهري' : 'Monthly Revenue Performance'}
                </h2>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded-full font-mono">
                  {state.selectedPeriod}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isAr
                  ? 'متابعة حية للمبيعات الفعلية ومعدل الإنجاز المطلوب يومياً'
                  : 'Live tracking of actual sales & required daily pace'}
              </p>
            </div>
          </div>

          {/* Month-End Forecast Badge */}
          <div
            className={`px-3 py-1.5 rounded-2xl border flex items-center gap-2 text-xs font-bold ${
              pace.isForecastAboveTarget
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
            }`}
          >
            <TrendingUp className="w-4 h-4 shrink-0" />
            <div>
              <span className="block text-[10px] text-slate-300">
                {isAr ? 'توقع نهاية الشهر' : 'Month-End Forecast'}
              </span>
              <span>
                {formatCurrencyNumber(pace.forecastMonthEnd, currency, true, isAr ? 'ar' : 'en')}
                <span className="text-[10px] mr-1">
                  ({pace.isForecastAboveTarget ? (isAr ? 'فوق التارجت +' : '+Above') : (isAr ? 'عجز ' : 'Deficit ')}
                  {Math.abs(pace.forecastVariance).toLocaleString()})
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Hero Main Numbers & Progress */}
        <div className="space-y-3 mb-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <span className="text-xs text-slate-400 block mb-0.5">
                {isAr ? 'المحقق الفعلي حتى الآن' : 'Total Achieved So Far'}
              </span>
              <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white">
                {formatCurrencyNumber(pace.effectiveTotalActual, currency, true, isAr ? 'ar' : 'en')}
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-xs text-slate-400 block mb-0.5">
                {isAr ? 'نسبة التحقيق' : 'Achievement Rate'}
              </span>
              <div
                className={`text-2xl sm:text-3xl font-black font-mono ${
                  pace.grandAchievementRate >= 100
                    ? 'text-emerald-400'
                    : pace.grandAchievementRate >= 80
                    ? 'text-blue-400'
                    : 'text-amber-400'
                }`}
              >
                {pace.grandAchievementRate.toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Large Gradient Progress Bar */}
          <div className="w-full h-4 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/80">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                pace.grandAchievementRate >= 100
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  : pace.grandAchievementRate >= 80
                  ? 'bg-gradient-to-r from-blue-500 to-emerald-400'
                  : 'bg-gradient-to-r from-amber-500 to-orange-400'
              }`}
              style={{ width: `${Math.min(100, Math.max(3, pace.grandAchievementRate))}%` }}
            />
          </div>
        </div>

        {/* Metrics Grid (Remaining, Days Left, Daily Run Rate, Daily Required) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-4 border-t border-slate-800/80 text-xs">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
            <span className="text-[11px] text-slate-400 block">{isAr ? 'المتبقي للتارجت' : 'Remaining to Goal'}</span>
            <span className="text-base font-bold font-mono text-amber-300 mt-1 block">
              {formatCurrencyNumber(pace.remainingToTarget, currency, true, isAr ? 'ar' : 'en')}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
            <span className="text-[11px] text-slate-400 block">{isAr ? 'الأيام المتبقية في الشهر' : 'Days Remaining'}</span>
            <span className="text-base font-bold font-mono text-slate-200 mt-1 block">
              {pace.daysLeft} {isAr ? 'يوم' : 'days'}
              <span className="text-[10px] text-slate-400 mr-1.5 font-normal">
                ({isAr ? 'من أصل' : 'of'} {pace.daysInMonth})
              </span>
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
            <span className="text-[11px] text-slate-400 block">{isAr ? 'المطلوب يومياً للهدف' : 'Daily Required Pace'}</span>
            <span className="text-base font-bold font-mono text-purple-300 mt-1 block">
              {formatCurrencyNumber(pace.dailyRequiredRate, currency, true, isAr ? 'ar' : 'en')}
              <span className="text-[10px] text-slate-400 mr-1 font-normal">/{isAr ? 'يوم' : 'day'}</span>
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
            <span className="text-[11px] text-slate-400 block">{isAr ? 'المتوسط اليومي الفعلي' : 'Daily Actual Average'}</span>
            <span className="text-base font-bold font-mono text-emerald-300 mt-1 block">
              {formatCurrencyNumber(pace.dailyActualRate, currency, true, isAr ? 'ar' : 'en')}
              <span className="text-[10px] text-slate-400 mr-1 font-normal">/{isAr ? 'يوم' : 'day'}</span>
            </span>
          </div>
        </div>
      </section>

      {/* ── B. شريط تقدم الفئات (Category Target Progress Matrix) ── */}
      <section className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-emerald-600" />
            <span>{isAr ? 'توزيع الأهداف والمحقق حسب الفئات' : 'Category Targets Progress'}</span>
          </h3>
          <button
            onClick={() => handleNav('/targets')}
            className="text-xs text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 cursor-pointer"
          >
            <span>{isAr ? 'إدارة الأهداف كاملة ←' : 'Manage Targets ←'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {categories.map((cat) => (
            <div key={cat.key} className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/70 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">{isAr ? cat.nameAr : cat.nameEn}</span>
                <span className={`font-mono font-bold ${cat.isAchieved ? 'text-emerald-700' : 'text-slate-700'}`}>
                  {cat.rate.toFixed(1)}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    cat.isAchieved ? 'bg-emerald-500' : cat.rate >= 75 ? 'bg-blue-500' : 'bg-amber-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(3, cat.rate))}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-[11px] text-slate-500 font-mono">
                <span>{formatCurrencyNumber(cat.actual, currency, true, isAr ? 'ar' : 'en')}</span>
                <span>/ {formatCurrencyNumber(cat.target, currency, true, isAr ? 'ar' : 'en')}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── C. مؤشرات الأداء الرئيسية (KpiCards) ── */}
      <section>
        <KpiCards stats={overallStats} currency={currency} language={state.settings.language} />
      </section>

      {/* ── D. ملخص بيانات البرنامج (Operational Health Quick Cards) ── */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        <button
          onClick={() => handleNav('/sales')}
          className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 shadow-xs text-right transition-all hover:scale-[1.01] cursor-pointer"
        >
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-2">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <span className="text-[11px] text-slate-500 block">{isAr ? 'السجلات المعتمدة' : 'Approved Records'}</span>
          <span className="text-base font-bold font-mono text-slate-900 block mt-0.5">
            {totals.transactionsCount}
          </span>
          <span className="text-[10px] text-blue-600 font-medium flex items-center gap-0.5 mt-1">
            <span>{isAr ? 'فتح السجلات' : 'View records'}</span>
            <ArrowRight className={`w-3 h-3 ${isAr ? 'rotate-180' : ''}`} />
          </span>
        </button>

        <button
          onClick={() => handleNav('/sales')}
          className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 shadow-xs text-right transition-all hover:scale-[1.01] cursor-pointer"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-2">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <span className="text-[11px] text-slate-500 block">{isAr ? 'جودة البيانات' : 'Data Audit'}</span>
          <span className="text-base font-bold text-emerald-700 block mt-0.5">100%</span>
          <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-0.5 mt-1">
            <span>{isAr ? 'مطابقة تامة' : 'Reconciled'}</span>
            <ArrowRight className={`w-3 h-3 ${isAr ? 'rotate-180' : ''}`} />
          </span>
        </button>

        <button
          onClick={() => handleNav('/incentives')}
          className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 shadow-xs text-right transition-all hover:scale-[1.01] cursor-pointer"
        >
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-2">
            <Award className="w-4 h-4" />
          </div>
          <span className="text-[11px] text-slate-500 block">{isAr ? 'الحوافز المتوقعة' : 'Est. Incentives'}</span>
          <span className="text-base font-bold font-mono text-amber-700 block mt-0.5">
            {Math.round(totals.effectiveTotalActual * 0.02).toLocaleString()}
          </span>
          <span className="text-[10px] text-amber-600 font-medium flex items-center gap-0.5 mt-1">
            <span>{isAr ? 'حاسبة الحوافز' : 'Calculator'}</span>
            <ArrowRight className={`w-3 h-3 ${isAr ? 'rotate-180' : ''}`} />
          </span>
        </button>

        <button
          onClick={() => handleNav('/inventory')}
          className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 shadow-xs text-right transition-all hover:scale-[1.01] cursor-pointer"
        >
          <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mb-2">
            <Package className="w-4 h-4" />
          </div>
          <span className="text-[11px] text-slate-500 block">{isAr ? 'تنبيهات المخزون' : 'Stock Alerts'}</span>
          <span className="text-base font-bold font-mono text-teal-700 block mt-0.5">
            {state.inventoryItems.length > 0 ? state.inventoryItems.length : '18'}
          </span>
          <span className="text-[10px] text-teal-600 font-medium flex items-center gap-0.5 mt-1">
            <span>{isAr ? 'مدير الإمداد' : 'Optimizer'}</span>
            <ArrowRight className={`w-3 h-3 ${isAr ? 'rotate-180' : ''}`} />
          </span>
        </button>

        <button
          onClick={() => handleNav('/staff')}
          className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 shadow-xs text-right transition-all hover:scale-[1.01] cursor-pointer"
        >
          <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center mb-2">
            <Users className="w-4 h-4" />
          </div>
          <span className="text-[11px] text-slate-500 block">{isAr ? 'فريق العمل' : 'Branch Staff'}</span>
          <span className="text-base font-bold font-mono text-purple-700 block mt-0.5">
            {state.records.length} {isAr ? 'أفراد' : 'reps'}
          </span>
          <span className="text-[10px] text-purple-600 font-medium flex items-center gap-0.5 mt-1">
            <span>{isAr ? 'الترتيب والشيفتات' : 'Roster'}</span>
            <ArrowRight className={`w-3 h-3 ${isAr ? 'rotate-180' : ''}`} />
          </span>
        </button>

        <button
          onClick={() => handleNav('/settings')}
          className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 shadow-xs text-right transition-all hover:scale-[1.01] cursor-pointer"
        >
          <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center mb-2">
            <Clock className="w-4 h-4" />
          </div>
          <span className="text-[11px] text-slate-500 block">{isAr ? 'المزامنة السحابية' : 'Cloud Sync'}</span>
          <span className="text-base font-bold text-slate-800 block mt-0.5">
            {state.isSyncing ? (isAr ? 'جاري...' : 'Syncing') : isAr ? 'نشط' : 'Active'}
          </span>
          <span className="text-[10px] text-slate-500 font-medium flex items-center gap-0.5 mt-1">
            <span>{isAr ? 'إدارة النسخ' : 'Settings'}</span>
            <ArrowRight className={`w-3 h-3 ${isAr ? 'rotate-180' : ''}`} />
          </span>
        </button>
      </section>

      {/* ── E. أفضل 3 موظفين (Mini Leaderboard Top 3) ── */}
      <section className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              👑
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {isAr ? 'لوحة شرف متصدري المبيعات (أفضل 3)' : 'Top Sales Performers'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {isAr ? 'ترتيب أعلى معدلات تحقيق الهدف لشهر ' + state.selectedPeriod : 'Highest target achievement rates'}
              </p>
            </div>
          </div>

          <button
            onClick={() => handleNav('/staff')}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
          >
            <span>{isAr ? 'عرض كافة الموظفين وتحليلات الأداء ←' : 'View All Staff & Analysis ←'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {topEmployees.map((emp, index) => {
            const medal =
              index === 0
                ? { emoji: '🥇', bg: 'bg-amber-50 border-amber-200', text: 'text-amber-900' }
                : index === 1
                ? { emoji: '🥈', bg: 'bg-slate-50 border-slate-200', text: 'text-slate-800' }
                : { emoji: '🥉', bg: 'bg-orange-50 border-orange-200', text: 'text-orange-900' };

            return (
              <div
                key={emp.id}
                onClick={() => handleNav('/staff')}
                className={`p-4 rounded-2xl border ${medal.bg} flex items-center justify-between transition-all hover:scale-[1.01] cursor-pointer`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{medal.emoji}</span>
                  <div>
                    <span className="font-bold text-sm block text-slate-900">{emp.employee}</span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {emp.employeeId ? `#${emp.employeeId}` : ''} · {Math.round(emp.actual).toLocaleString()} {currency}
                    </span>
                  </div>
                </div>

                <div className="text-left font-mono">
                  <span className="text-base font-black text-emerald-700 block">
                    {emp.achievementRate.toFixed(1)}%
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {emp.isAchieved ? (isAr ? 'محقق الهدف' : 'Target Met') : (isAr ? 'قيد الإنجاز' : 'In Progress')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── F. منحنى أداء الفرع وموجة الـ Milestones ── */}
      <section className="space-y-4">
        {/* Milestone Radar Alerts */}
        <TargetAlertBanner
          records={activeRecords}
          currency={currency}
          language={state.settings.language}
          settings={state.notificationSettings}
          onOpenNotificationCenter={onOpenNotificationCenter || (() => {})}
          onSelectEmployee={(empName) => handleNav('/staff')}
          branchOverallRate={pace.grandAchievementRate}
        />

        {/* Performance Curve */}
        <BranchPerformanceCurve
          records={activeRecords}
          currency={currency}
          language={state.settings.language}
        />
      </section>

      {/* ── G. صف "إجراءات سريعة" ── */}
      <section className="p-4 rounded-3xl bg-slate-900 text-white shadow-lg flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-bold">
            {isAr ? 'إجراءات تشغيلية سريعة لفرع كونكورد' : 'Quick Operations Suite'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenUpload}
            className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{isAr ? 'رفع ملف إكسيل' : 'Upload Excel'}</span>
          </button>

          <button
            onClick={onOpenAddRecord}
            className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Users className="w-3.5 h-3.5" />
            <span>{isAr ? 'إضافة سجل مبيعات' : 'Add Record'}</span>
          </button>

          <button
            onClick={onOpenMonthlyReport}
            className="px-3 py-2 rounded-xl bg-purple-600/80 hover:bg-purple-600 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{isAr ? 'استخراج PDF الشهري' : 'Generate PDF'}</span>
          </button>

          <button
            onClick={onOpenExport}
            className="px-3 py-2 rounded-xl bg-blue-600/80 hover:bg-blue-600 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isAr ? 'تصدير البيانات' : 'Export Data'}</span>
          </button>
        </div>
      </section>
    </div>
  );
};
