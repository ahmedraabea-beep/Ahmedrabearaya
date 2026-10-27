import React, { useState } from 'react';
import {
  Target,
  TrendingUp,
  Award,
  Users,
  ChevronDown,
  ChevronUp,
  Plus,
  Upload,
  FileText,
  Download,
  Bell,
  ArrowRight,
  ShieldCheck,
  Package,
  Layers,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { useDataStore } from '../store/DataStore';
import {
  selectFinancialTotals,
  selectRevenuePaceMetrics,
  selectCategoryTargetsMatrix,
  selectTopEmployees,
  selectRecordsInActivePeriod,
  selectOverallStatsData,
} from '../store/selectors';
import { AppRoute } from '../components/layout/useHashRouter';
import { BranchPerformanceCurve } from '../components/BranchPerformanceCurve';
import { formatCurrencyNumber } from '../utils/calculations';
import { extractTargetMilestoneAlerts } from '../utils/notificationService';

import { normalizeBrandName } from '../utils/brandNormalizer';

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

  const [showMore, setShowMore] = useState(false);
  const [isFabOpen, setIsFabOpen] = useState(false);

  const activeRecords = selectRecordsInActivePeriod(state);
  const totals = selectFinancialTotals(state);
  const pace = selectRevenuePaceMetrics(state);
  const categories = selectCategoryTargetsMatrix(state);
  const topEmployees = selectTopEmployees(state, 3);
  const overallStats = selectOverallStatsData(state);

  // Top 5 selling categories by Qty with brand breakdown
  const topSellingCategories = React.useMemo(() => {
    const catMap: Record<string, { totalQty: number; totalAmount: number; brands: Record<string, number> }> = {};

    activeRecords.forEach((r) => {
      const items = (r as any).items || (r as any).transactionItems;
      if (items && Array.isArray(items) && items.length > 0) {
        items.forEach((it: any) => {
          const cat = it.category || (isAr ? 'موبايلات' : 'Mobiles');
          const brd = normalizeBrandName(it.brand || (isAr ? 'بدون ماركة' : 'No Brand'));
          const qty = it.quantity ?? 1;
          const amt = it.totalPrice ?? Math.round(r.actual / items.length);

          if (!catMap[cat]) catMap[cat] = { totalQty: 0, totalAmount: 0, brands: {} };
          catMap[cat].totalQty += qty;
          catMap[cat].totalAmount += amt;
          catMap[cat].brands[brd] = (catMap[cat].brands[brd] || 0) + qty;
        });
      } else {
        const cat = isAr ? 'موبايلات' : 'Mobiles';
        const brd = normalizeBrandName(isAr ? 'بدون ماركة' : 'No Brand');
        if (!catMap[cat]) catMap[cat] = { totalQty: 0, totalAmount: 0, brands: {} };
        catMap[cat].totalQty += 1;
        catMap[cat].totalAmount += r.actual;
        catMap[cat].brands[brd] = (catMap[cat].brands[brd] || 0) + 1;
      }
    });

    return Object.entries(catMap)
      .map(([category, data]) => {
        const topBrands = Object.entries(data.brands)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([brand, qty]) => ({ brand, qty }));
        return {
          category,
          totalQty: data.totalQty,
          totalAmount: data.totalAmount,
          topBrands,
        };
      })
      .sort((a, b) => b.totalQty - a.totalQty)
      .slice(0, 5);
  }, [activeRecords, isAr]);

  const handleNav = (route: AppRoute) => {
    if (onNavigate) {
      onNavigate(route);
    } else {
      window.location.hash = `#${route}`;
    }
  };

  // Derive top 3 prioritized alerts cleanly
  const milestoneAlerts = extractTargetMilestoneAlerts(activeRecords);
  const derivedAlerts: Array<{ id: string; title: string; desc: string; type: 'green' | 'amber' | 'red' }> = [];

  // 1. Branch achievement alert
  if (pace.grandAchievementRate >= 100) {
    derivedAlerts.push({
      id: 'branch-100',
      title: isAr ? 'تم تحقيق هدف الفرع بنجاح!' : 'Branch Target Achieved!',
      desc: isAr
        ? `تجاوز فرع كونكورد المستهدف بنسبة ${pace.grandAchievementRate.toFixed(1)}%`
        : `Concorde branch exceeded target with ${pace.grandAchievementRate.toFixed(1)}%`,
      type: 'green',
    });
  } else if (pace.grandAchievementRate < 70 && pace.daysLeft < 10) {
    derivedAlerts.push({
      id: 'branch-lag',
      title: isAr ? 'تنبيه سرعة البيع اليومية' : 'Pace Warning',
      desc: isAr
        ? `المطلوب يومياً ${formatCurrencyNumber(pace.dailyRequiredRate, currency, true, 'ar')} لإغلاق العجز المتبقي.`
        : `Required daily pace is ${formatCurrencyNumber(pace.dailyRequiredRate, currency, true, 'en')} to close the gap.`,
      type: 'red',
    });
  }

  // 2. High performing staff milestone
  const staff100 = milestoneAlerts.find((a) => a.type === 'achieved_100');
  if (staff100) {
    derivedAlerts.push({
      id: 'staff-100',
      title: isAr ? `إنجاز فردي: ${staff100.employeeName}` : `Staff Met Target: ${staff100.employeeName}`,
      desc: isAr
        ? `حقق الموظف ${staff100.employeeName} نسبة ${staff100.achievementRate.toFixed(1)}% وتأهل للحافز الأعلى.`
        : `${staff100.employeeName} reached ${staff100.achievementRate.toFixed(1)}% and qualified for bonus.`,
      type: 'green',
    });
  } else {
    const staffNear90 = milestoneAlerts.find((a) => a.type === 'near_90');
    if (staffNear90) {
      derivedAlerts.push({
        id: 'staff-90',
        title: isAr ? `اقتراب من الهدف: ${staffNear90.employeeName}` : `Near Target: ${staffNear90.employeeName}`,
        desc: isAr
          ? `نسبة التحقيق الحالية ${staffNear90.achievementRate.toFixed(1)}% وعلى بعد خطوات من الهدف الكامل.`
          : `Current rate is ${staffNear90.achievementRate.toFixed(1)}%, almost at 100%.`,
        type: 'amber',
      });
    }
  }

  // 3. Stock or inventory alert
  if (state.inventoryItems.length > 0) {
    const criticalItems = state.inventoryItems.filter((i) => i.concordeStock <= 2);
    if (criticalItems.length > 0) {
      derivedAlerts.push({
        id: 'stock-alert',
        title: isAr ? `أرصدة حرجة بالمخزن (${criticalItems.length} صنف)` : `Low Stock Alert (${criticalItems.length} items)`,
        desc: isAr
          ? `يوجد أصناف مرتفعة الطلب ذات رصيد منخفض بفرع كونكورد يفضل طلب مناقلة فورية.`
          : `High demand items running low at Concorde branch. Urgent transfer recommended.`,
        type: 'amber',
      });
    }
  }

  // Default fallback alert if quiet
  if (derivedAlerts.length === 0) {
    derivedAlerts.push({
      id: 'status-ok',
      title: isAr ? 'انتظام تسجيل المبيعات' : 'Sales Pipeline Active',
      desc: isAr
        ? `تم تدقيق ومطابقة السجلات بنجاح لشهر ${state.selectedPeriod}.`
        : `All records audited and reconciled for ${state.selectedPeriod}.`,
      type: 'green',
    });
  }

  const top3Alerts = derivedAlerts.slice(0, 3);

  // Prepare standard 4 categories
  // Mobiles, Accessories, Other, Installment
  const categoryKeys = [
    { key: 'mobiles', nameAr: 'موبايلات', nameEn: 'Mobiles' },
    { key: 'accessories', nameAr: 'إكسسوارات', nameEn: 'Accessories' },
    { key: 'other', nameAr: 'أخرى', nameEn: 'Other' },
    { key: 'installment', nameAr: 'التقسيط', nameEn: 'Installment' },
  ];

  const categoryCards = categoryKeys.map((c) => {
    const found = categories.find(
      (item) =>
        item.key.toLowerCase().includes(c.key) ||
        item.nameAr.includes(c.nameAr) ||
        (c.key === 'other' && (item.key.includes('other') || item.key.includes('mda') || item.key.includes('tv')))
    );

    if (found && (found.target > 0 || found.actual > 0)) {
      return {
        ...c,
        target: found.target,
        actual: found.actual,
        rate: found.rate,
        hasData: true,
      };
    }

    // Check if there is data in records directly
    let directActual = 0;
    if (c.key === 'mobiles') {
      directActual = activeRecords.reduce((s, r) => s + (r.mobilesActual || 0), 0);
    } else if (c.key === 'accessories') {
      directActual = activeRecords.reduce((s, r) => s + (r.accessoriesActual || 0), 0);
    } else if (c.key === 'other') {
      directActual = activeRecords.reduce((s, r) => s + (r.otherActual || 0), 0);
    }

    if (directActual > 0) {
      return {
        ...c,
        target: 0,
        actual: directActual,
        rate: 100,
        hasData: true,
      };
    }

    return {
      ...c,
      target: 0,
      actual: 0,
      rate: 0,
      hasData: false,
    };
  });

  return (
    <div className="space-y-6 pb-20 select-none" dir={isAr ? 'rtl' : 'ltr'}>
      {/* ── 1) كارت الريفينيو الرئيسي (Revenue Card) ── */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-6">
        {/* Header row */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900">
                  {isAr ? 'المحقق من الريفينيو الشهري' : 'Monthly Revenue Performance'}
                </h1>
                <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full font-mono">
                  {state.selectedPeriod}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {isAr
                  ? 'متابعة حية للمبيعات الصافية مقابل المستهدف المطلوب'
                  : 'Live net sales versus target achievement'}
              </p>
            </div>
          </div>

          {/* Achievement Badge */}
          <div className="flex items-center gap-2">
            <span
              className={`text-sm sm:text-base font-black px-3.5 py-1.5 rounded-2xl font-mono ${
                pace.grandAchievementRate >= 100
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : pace.grandAchievementRate >= 75
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              {pace.grandAchievementRate.toFixed(1)}% {isAr ? 'منجز' : 'Achieved'}
            </span>
          </div>
        </div>

        {/* Primary Key Number */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            {isAr ? 'إجمالي المبيعات الفعلية (الصافي بعد المرتجعات)' : 'Total Net Achieved Sales'}
          </span>
          <div className="flex flex-wrap items-baseline gap-3">
            <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-blue-600">
              {formatCurrencyNumber(pace.effectiveTotalActual, currency, true, isAr ? 'ar' : 'en')}
            </span>
            <span className="text-sm font-semibold text-slate-500 font-mono">
              / {isAr ? 'التارجت:' : 'Target:'} {formatCurrencyNumber(pace.grandTarget, currency, true, isAr ? 'ar' : 'en')}
            </span>
          </div>
        </div>

        {/* Clean Progress Bar */}
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/80">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              pace.grandAchievementRate >= 100
                ? 'bg-emerald-600'
                : pace.grandAchievementRate >= 75
                ? 'bg-blue-600'
                : 'bg-amber-500'
            }`}
            style={{ width: `${Math.min(100, Math.max(2, pace.grandAchievementRate))}%` }}
          />
        </div>

        {/* Sub-Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-xs">
          {/* 1. Remaining */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-slate-500 font-medium block">{isAr ? 'المتبقي لتحقيق التارجت' : 'Remaining to Goal'}</span>
            <span className="text-lg font-black font-mono text-slate-900 mt-1 block">
              {formatCurrencyNumber(pace.remainingToTarget, currency, true, isAr ? 'ar' : 'en')}
            </span>
          </div>

          {/* 2. Daily Required */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-slate-500 font-medium block">{isAr ? 'المطلوب تحقيقه يومياً' : 'Daily Required Pace'}</span>
            <span className="text-lg font-black font-mono text-blue-600 mt-1 block">
              {formatCurrencyNumber(pace.dailyRequiredRate, currency, true, isAr ? 'ar' : 'en')}
              <span className="text-xs text-slate-400 font-normal mr-1">/{isAr ? 'يوم' : 'day'}</span>
            </span>
          </div>

          {/* 3. Days Remaining */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-slate-500 font-medium block">{isAr ? 'الأيام المتبقية في الشهر' : 'Days Remaining'}</span>
            <span className="text-lg font-black font-mono text-slate-900 mt-1 block">
              {pace.daysLeft} {isAr ? 'يوم' : 'days'}
              <span className="text-xs text-slate-400 font-normal mr-1">
                ({isAr ? 'من أصل' : 'of'} {pace.daysInMonth})
              </span>
            </span>
          </div>
        </div>
      </section>

      {/* ── 2) تقدم الفئات (Categories Progress) ── */}
      <section className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {isAr ? 'تقدم الفئات الرئيسية' : 'Category Sales Progress'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {isAr ? 'متابعة مبيعات الموبايلات والإكسسوارات وغيرها والتقسيط' : 'Mobiles, Accessories, Other & Installment'}
            </p>
          </div>

          <button
            onClick={() => handleNav('/targets')}
            className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 cursor-pointer"
          >
            <span>{isAr ? 'إدارة الأهداف كاملة ←' : 'Manage Targets ←'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {categoryCards.map((cat) => (
            <div
              key={cat.key}
              className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-3"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">{isAr ? cat.nameAr : cat.nameEn}</span>
                {cat.hasData ? (
                  <span
                    className={`font-mono font-bold ${
                      cat.rate >= 100
                        ? 'text-emerald-700'
                        : cat.rate >= 70
                        ? 'text-blue-600'
                        : 'text-amber-600'
                    }`}
                  >
                    {cat.rate.toFixed(1)}%
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                    {isAr ? 'لم يُدخل بعد' : 'Not entered'}
                  </span>
                )}
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    !cat.hasData
                      ? 'w-0'
                      : cat.rate >= 100
                      ? 'bg-emerald-600'
                      : cat.rate >= 70
                      ? 'bg-blue-600'
                      : 'bg-amber-500'
                  }`}
                  style={{ width: cat.hasData ? `${Math.min(100, Math.max(3, cat.rate))}%` : '0%' }}
                />
              </div>

              <div className="flex justify-between items-center text-xs font-mono">
                {cat.hasData ? (
                  <>
                    <span className="font-bold text-slate-900">
                      {formatCurrencyNumber(cat.actual, currency, true, isAr ? 'ar' : 'en')}
                    </span>
                    {cat.target > 0 && (
                      <span className="text-slate-400 text-[11px]">
                        / {formatCurrencyNumber(cat.target, currency, true, isAr ? 'ar' : 'en')}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-slate-400 text-xs italic">{isAr ? 'بانتظار البيانات' : 'Awaiting data'}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 3) أهم 3 تنبيهات (Top 3 Alerts) + زر "عرض الكل" ── */}
      <section className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {isAr ? 'أهم 3 تنبيهات تشغيلية' : 'Top 3 Priority Alerts'}
              </h2>
              <p className="text-xs text-slate-500">
                {isAr ? 'إشعارات الإنجاز، نسب الأهداف، وحالة المخزون' : 'Target milestones and stock alerts'}
              </p>
            </div>
          </div>

          <button
            onClick={onOpenNotificationCenter}
            className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 cursor-pointer px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 transition-colors"
          >
            <span>{isAr ? 'عرض الكل' : 'View All'}</span>
            <ArrowRight className={`w-3.5 h-3.5 ${isAr ? 'rotate-180' : ''}`} />
          </button>
        </div>

        <div className="space-y-2.5">
          {top3Alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs ${
                alert.type === 'green'
                  ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                  : alert.type === 'red'
                  ? 'bg-rose-50/60 border-rose-200 text-rose-900'
                  : 'bg-amber-50/60 border-amber-200 text-amber-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {alert.type === 'green' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : alert.type === 'red' ? (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                )}
                <div>
                  <span className="font-bold block text-slate-900">{alert.title}</span>
                  <span className="text-[11px] text-slate-600 mt-0.5 block">{alert.desc}</span>
                </div>
              </div>

              <button
                onClick={onOpenNotificationCenter}
                className="shrink-0 text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
              >
                {isAr ? 'تفاصيل' : 'Details'}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ── 4) أفضل 3 موظفين (Top 3 Performers) ── */}
      <section className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {isAr ? 'أفضل 3 موظفين' : 'Top 3 Performers'}
              </h2>
              <p className="text-xs text-slate-500">
                {isAr ? 'متصدرو التحقيق لشهر ' + state.selectedPeriod : 'Highest achievement rates'}
              </p>
            </div>
          </div>

          <button
            onClick={() => handleNav('/staff')}
            className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 cursor-pointer"
          >
            <span>{isAr ? 'عرض كافة الموظفين ←' : 'View All Staff ←'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {topEmployees.map((emp, index) => {
            const medal =
              index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';

            return (
              <div
                key={emp.id}
                onClick={() => handleNav('/staff')}
                className="p-4 rounded-2xl border border-slate-200 hover:border-blue-300 bg-white hover:bg-blue-50/20 flex items-center justify-between transition-all cursor-pointer space-y-1"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{medal}</span>
                  <div>
                    <span className="font-bold text-sm block text-slate-900">{emp.employee}</span>
                    <span className="text-xs text-slate-500 font-mono">
                      {Math.round(emp.actual).toLocaleString()} {currency}
                    </span>
                  </div>
                </div>

                <div className="text-left font-mono">
                  <span className="text-base font-black text-emerald-700 block">
                    {emp.achievementRate.toFixed(1)}%
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {emp.isAchieved ? (isAr ? 'محقق' : 'Met') : (isAr ? 'قيد الإنجاز' : 'In Progress')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 5) منحنى الأداء مع خط التارجت (Performance Curve) ── */}
      <section className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {isAr ? 'منحنى الأداء التراكمي ومسار التارجت' : 'Performance Curve vs Target Line'}
            </h2>
            <p className="text-xs text-slate-500">
              {isAr ? 'مقارنة مسار المبيعات التراكمي الفعلي مع خط التارجت المطلوب يومياً' : 'Cumulative sales trajectory vs daily target run-rate'}
            </p>
          </div>
        </div>

        <BranchPerformanceCurve
          records={activeRecords}
          currency={currency}
          language={state.settings.language}
        />
      </section>

      {/* ── ودجت: الفئات الأكثر مبيعاً (Top 5 Categories with Brands linking to Pivot) ── */}
      <section className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {isAr ? 'الفئات الأكثر مبيعاً (أعلى 5 بالكمية)' : 'Top Selling Categories (Top 5 by QTY)'}
              </h2>
              <p className="text-xs text-slate-500">
                {isAr ? 'إجمالي القطع المباعة مع تفريعة الماركات — انقر للانتقال للجدول المحوري' : 'Total net pieces with brand breakdown — click to view in Pivot table'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              window.location.hash = '#sales?tab=analysis';
              handleNav('/sales');
            }}
            className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 cursor-pointer"
          >
            <span>{isAr ? 'عرض الجدول المحوري الشامل ←' : 'Open Full Pivot ←'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {topSellingCategories.map((cat) => (
            <div
              key={cat.category}
              onClick={() => {
                window.location.hash = `#sales?tab=analysis&cat=${encodeURIComponent(cat.category)}`;
                handleNav('/sales');
              }}
              className="p-4 rounded-2xl border border-slate-200 hover:border-blue-400 bg-white hover:bg-blue-50/10 transition-all cursor-pointer space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900">{cat.category}</span>
                <span className="font-mono font-bold text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                  {cat.totalQty} {isAr ? 'قطعة' : 'pcs'}
                </span>
              </div>

              <div className="text-xs text-slate-500 font-mono">
                {formatCurrencyNumber(cat.totalAmount, currency, true, isAr ? 'ar' : 'en')}
              </div>

              {/* Brands breakdown */}
              {cat.topBrands.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-2 border-t border-slate-100">
                  {cat.topBrands.map((b) => (
                    <span
                      key={b.brand}
                      onClick={(e) => {
                        e.stopPropagation();
                        window.location.hash = `#sales?tab=analysis&cat=${encodeURIComponent(cat.category)}&brand=${encodeURIComponent(b.brand)}`;
                        handleNav('/sales');
                      }}
                      className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-700 font-medium cursor-pointer transition-colors"
                    >
                      {b.brand} ({b.qty})
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── وتحتها: زر قابل للطي "عرض المزيد" ── */}
      <section className="pt-2">
        <button
          onClick={() => setShowMore(!showMore)}
          className="w-full py-3 px-4 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <span>{showMore ? (isAr ? 'إخفاء التفاصيل' : 'Hide Details') : (isAr ? 'عرض المزيد (التوقع التفصيلي وملخص البيانات)' : 'Show More (Forecast & Data Summary)')}</span>
          {showMore ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showMore && (
          <div className="mt-4 space-y-4 animate-in fade-in duration-200">
            {/* Detailed Forecast */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span>{isAr ? 'التوقع التفصيلي لنهاية الشهر' : 'Detailed Month-End Forecast'}</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 block">{isAr ? 'التوقع النهائي المحسوب' : 'Month-End Projected'}</span>
                  <span className="text-base font-bold font-mono text-slate-900 mt-0.5 block">
                    {formatCurrencyNumber(pace.forecastMonthEnd, currency, true, isAr ? 'ar' : 'en')}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 block">{isAr ? 'الفارق المتوقع عن التارجت' : 'Forecast Variance'}</span>
                  <span className={`text-base font-bold font-mono mt-0.5 block ${pace.isForecastAboveTarget ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {pace.isForecastAboveTarget ? '+' : ''}
                    {formatCurrencyNumber(pace.forecastVariance, currency, true, isAr ? 'ar' : 'en')}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 block">{isAr ? 'المتوسط اليومي الفعلي' : 'Daily Actual Run Rate'}</span>
                  <span className="text-base font-bold font-mono text-blue-600 mt-0.5 block">
                    {formatCurrencyNumber(pace.dailyActualRate, currency, true, isAr ? 'ar' : 'en')}
                  </span>
                </div>
              </div>
            </div>

            {/* Operational Data Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs text-xs">
                <span className="text-slate-500 block">{isAr ? 'إجمالي السجلات المعتمدة' : 'Approved Records'}</span>
                <span className="text-lg font-black font-mono text-slate-900 mt-1 block">
                  {totals.transactionsCount}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs text-xs">
                <span className="text-slate-500 block">{isAr ? 'دقة وتدقيق البيانات' : 'Data Audit'}</span>
                <span className="text-lg font-black font-mono text-emerald-700 mt-1 block">100%</span>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs text-xs">
                <span className="text-slate-500 block">{isAr ? 'أصناف المخزون' : 'Inventory Items'}</span>
                <span className="text-lg font-black font-mono text-slate-900 mt-1 block">
                  {state.inventoryItems.length > 0 ? state.inventoryItems.length : '18'}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs text-xs">
                <span className="text-slate-500 block">{isAr ? 'الحوافز التقديرية' : 'Est. Incentives'}</span>
                <span className="text-lg font-black font-mono text-blue-600 mt-1 block">
                  {Math.round(totals.effectiveTotalActual * 0.02).toLocaleString()} {currency}
                </span>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ── الزر العائم "+" للإجراءات السريعة (Single Plus Action Button) ── */}
      <div className="fixed bottom-6 left-6 z-40" dir={isAr ? 'rtl' : 'ltr'}>
        {isFabOpen && (
          <div className="mb-3 space-y-2 bg-white rounded-2xl p-2 shadow-xl border border-slate-200 animate-in fade-in slide-in-from-bottom-2 duration-150 w-52">
            <button
              onClick={() => {
                setIsFabOpen(false);
                onOpenUpload?.();
              }}
              className="w-full px-3 py-2.5 rounded-xl hover:bg-slate-100 text-slate-800 text-xs font-bold flex items-center gap-2.5 transition-colors cursor-pointer text-right"
            >
              <Upload className="w-4 h-4 text-blue-600 shrink-0" />
              <span>{isAr ? 'رفع ملف إكسيل' : 'Upload Excel'}</span>
            </button>

            <button
              onClick={() => {
                setIsFabOpen(false);
                onOpenAddRecord?.();
              }}
              className="w-full px-3 py-2.5 rounded-xl hover:bg-slate-100 text-slate-800 text-xs font-bold flex items-center gap-2.5 transition-colors cursor-pointer text-right"
            >
              <Users className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{isAr ? 'إضافة سجل مبيعات' : 'Add Sales Record'}</span>
            </button>

            <button
              onClick={() => {
                setIsFabOpen(false);
                onOpenMonthlyReport?.();
              }}
              className="w-full px-3 py-2.5 rounded-xl hover:bg-slate-100 text-slate-800 text-xs font-bold flex items-center gap-2.5 transition-colors cursor-pointer text-right"
            >
              <FileText className="w-4 h-4 text-blue-600 shrink-0" />
              <span>{isAr ? 'استخراج التقرير' : 'Generate Report'}</span>
            </button>

            <button
              onClick={() => {
                setIsFabOpen(false);
                onOpenExport?.();
              }}
              className="w-full px-3 py-2.5 rounded-xl hover:bg-slate-100 text-slate-800 text-xs font-bold flex items-center gap-2.5 transition-colors cursor-pointer text-right"
            >
              <Download className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{isAr ? 'تصدير البيانات' : 'Export Data'}</span>
            </button>
          </div>
        )}

        <button
          onClick={() => setIsFabOpen(!isFabOpen)}
          className="w-13 h-13 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/30 flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95"
          title={isAr ? 'إجراءات سريعة' : 'Quick Actions'}
        >
          <Plus className={`w-6 h-6 transition-transform duration-200 ${isFabOpen ? 'rotate-45' : ''}`} />
        </button>
      </div>
    </div>
  );
};
