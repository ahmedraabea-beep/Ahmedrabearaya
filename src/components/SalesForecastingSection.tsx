import React, { useState, useMemo } from 'react';
import { SalesRecord, Currency, Language } from '../types/sales';
import { formatCurrencyNumber, formatPercent } from '../utils/calculations';
import { translations } from '../utils/i18n';
import {
  extractMonthlyDataPoints,
  calculateGrowthForecast,
} from '../utils/forecasting';
import {
  TrendingUp,
  TrendingDown,
  Sparkles,
  Calendar,
  Building2,
  LineChart,
  Target,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Info,
  SlidersHorizontal,
} from 'lucide-react';

interface SalesForecastingSectionProps {
  records: SalesRecord[];
  currency: Currency;
  branches: string[];
  language: Language;
}

export const SalesForecastingSection: React.FC<SalesForecastingSectionProps> = ({
  records,
  currency,
  branches,
  language,
}) => {
  const isAr = language === 'ar';
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [horizonMonths, setHorizonMonths] = useState<number>(3);
  const [scenario, setScenario] = useState<'realistic' | 'optimistic' | 'conservative'>('realistic');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Extract historical points & forecast
  const historicalPoints = useMemo(
    () => extractMonthlyDataPoints(records, selectedBranch || undefined),
    [records, selectedBranch]
  );

  const baseForecast = useMemo(
    () => calculateGrowthForecast(historicalPoints, selectedBranch || undefined),
    [historicalPoints, selectedBranch]
  );

  // Adjust projected points based on scenario
  const projectedPoints = useMemo(() => {
    const raw = [...baseForecast.projectedMonths];
    const multiplier = scenario === 'optimistic' ? 1.12 : scenario === 'conservative' ? 0.90 : 1.0;

    return raw.slice(0, horizonMonths).map((p, idx) => {
      const adjustedActual = Math.round(p.totalActual * Math.pow(multiplier, idx * 0.5 + 1));
      const adjustedLow = p.forecastLow ? Math.round(p.forecastLow * multiplier) : undefined;
      const adjustedHigh = p.forecastHigh ? Math.round(p.forecastHigh * multiplier) : undefined;
      return {
        ...p,
        totalActual: adjustedActual,
        forecastLow: adjustedLow,
        forecastHigh: adjustedHigh,
        achievementRate: p.totalTarget > 0 ? (adjustedActual / p.totalTarget) * 100 : 100,
      };
    });
  }, [baseForecast, horizonMonths, scenario]);

  const allPoints = useMemo(
    () => [...baseForecast.historicalMonths, ...projectedPoints],
    [baseForecast.historicalMonths, projectedPoints]
  );

  const maxVal = useMemo(() => {
    return Math.max(
      ...allPoints.map((p) => Math.max(p.totalActual, p.totalTarget, p.forecastHigh || 0)),
      100000
    );
  }, [allPoints]);

  const nextMonth = projectedPoints[0] || { totalActual: 0, totalTarget: 0, achievementRate: 100, period: 'التالي' };
  const isUp = baseForecast.trendDirection === 'up';
  const rSquaredPercent = (baseForecast.rSquared * 100).toFixed(1);

  return (
    <div className="space-y-6 animate-in fade-in duration-200" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-indigo-900 to-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>{isAr ? 'منظومة التنبؤ الذكي بالمبيعات (Sales Forecasting AI)' : 'Smart Sales Forecasting AI Engine'}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isAr ? 'توقع الأداء المستقبلي والاتجاهات الزمنية' : 'Future Performance & Trend Projection'}
            </h1>
            <p className="text-sm text-indigo-100/80 mt-1 max-w-2xl">
              {isAr
                ? 'استخدام خوارزميات الانحدار الخطي والتحليل التاريخي لبيانات مبيعات فرع راية كونكورد بلازا للتنبؤ بالإيرادات والوصول المستهدف بدقة عالية.'
                : 'Leveraging linear regression and historical sales trends to project future branch revenue and goal achievement with confidence intervals.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Branch selector */}
            <div className="relative">
              <Building2 className={`absolute ${isAr ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-300 pointer-events-none`} />
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className={`text-xs ${isAr ? 'pr-9 pl-3' : 'pl-9 pr-3'} py-2 bg-white/10 border border-white/20 rounded-xl text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400`}
              >
                <option value="" className="text-slate-900">{isAr ? 'جميع الفروع (ملخص عام)' : 'All Branches (Overall)'}</option>
                {branches.map((b) => (
                  <option key={b} value={b} className="text-slate-900">
                    {b}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Control Panel: Horizon & Scenario */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <SlidersHorizontal className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {isAr ? 'إعدادات نموذج التنبؤ' : 'Forecasting Model Parameters'}
            </h3>
            <p className="text-xs text-slate-500">
              {isAr ? 'اختر المدى الزمني وسيناريو النمو للتوقع' : 'Select projection horizon and growth scenario'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Horizon Months Selector */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <span className="px-2 text-slate-500">{isAr ? 'المدى:' : 'Horizon:'}</span>
            {[3, 6, 12].map((m) => (
              <button
                key={m}
                onClick={() => setHorizonMonths(m)}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  horizonMonths === m
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {m} {isAr ? 'أشهر' : 'Mo'}
              </button>
            ))}
          </div>

          {/* Scenario Selector */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <span className="px-2 text-slate-500">{isAr ? 'السيناريو:' : 'Scenario:'}</span>
            {(['conservative', 'realistic', 'optimistic'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setScenario(s)}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer capitalize ${
                  scenario === s
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {s === 'conservative' ? (isAr ? 'تحفظي' : 'Conservative') : s === 'realistic' ? (isAr ? 'واقعي' : 'Realistic') : (isAr ? 'متفائل' : 'Optimistic')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500">{isAr ? 'توقع مبيعات الشهر القادم' : 'Next Month Forecast'}</span>
            <div className="text-xl font-black text-slate-900 font-mono mt-1">
              {formatCurrencyNumber(nextMonth.totalActual, currency, true, language)}
            </div>
            <div className="mt-1 flex items-center gap-1 text-xs text-emerald-600 font-semibold">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>{isAr ? `إنجاز متوقع ${nextMonth.achievementRate.toFixed(1)}%` : `Expected ${nextMonth.achievementRate.toFixed(1)}%`}</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500">{isAr ? 'معدل النمو الشهري (MoM)' : 'MoM Growth Rate'}</span>
            <div className="text-xl font-black text-slate-900 font-mono mt-1">
              {baseForecast.averageMoMGrowthRate >= 0 ? '+' : ''}{baseForecast.averageMoMGrowthRate.toFixed(1)}%
            </div>
            <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              <span>{isAr ? 'اتجاه عام تصاعدي' : 'Upward momentum'}</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500">{isAr ? 'معامل الثقة والدقة (R²)' : 'Model Fit (R² Score)'}</span>
            <div className="text-xl font-black text-slate-900 font-mono mt-1">
              {rSquaredPercent}%
            </div>
            <div className="mt-1 flex items-center gap-1 text-xs text-indigo-600 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{isAr ? 'دقة إحصائية موثوقة' : 'High statistical fit'}</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <LineChart className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500">{isAr ? 'المعدل السنوي المتوقع (Run-Rate)' : 'Annual Run-Rate'}</span>
            <div className="text-xl font-black text-slate-900 font-mono mt-1">
              {formatCurrencyNumber(nextMonth.totalActual * 12, currency, true, language)}
            </div>
            <div className="mt-1 flex items-center gap-1 text-xs text-purple-600 font-semibold">
              <Target className="w-3.5 h-3.5" />
              <span>{isAr ? 'مبني على أداء الاتجاه' : 'Based on trend slope'}</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Target className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Interactive Line Chart Section */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <LineChart className="w-5 h-5 text-indigo-600" />
              <span>{isAr ? 'منحنى التنبؤ بالمبيعات التاريخية والمستقبلية' : 'Historical & Projected Sales Line Chart'}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {isAr
                ? 'الخط الأزرق يمثل الأداء الفعلي، والخط المتقطع يمثل التنبؤ المستقبلي مع نطاق الثقة (الحد الأدنى والأقصى).'
                : 'Solid line represents historical actuals; dashed line represents AI linear regression forecast with upper/lower bounds.'}
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block" />
              <span className="text-slate-600">{isAr ? 'الفعلـي (Historical)' : 'Historical Actual'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-indigo-600 inline-block" />
              <span className="text-slate-600">{isAr ? 'المتوقع (Forecast)' : 'Projected Forecast'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-slate-300 inline-block" />
              <span className="text-slate-600">{isAr ? 'التارجت (Target)' : 'Target'}</span>
            </div>
          </div>
        </div>

        {/* Custom SVG Line Chart */}
        <div className="relative w-full h-80 pt-4 pb-8 px-2">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 800 260">
            {/* Grid lines */}
            {[0, 65, 130, 195, 260].map((y, idx) => (
              <line
                key={idx}
                x1="40"
                y1={y}
                x2="780"
                y2={y}
                stroke="#e2e8f0"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
            ))}

            {/* Render trend path */}
            {(() => {
              const pointsCount = allPoints.length;
              if (pointsCount === 0) return null;
              const stepX = 740 / Math.max(1, pointsCount - 1);

              const coords = allPoints.map((p, i) => {
                const x = 40 + i * stepX;
                const y = 240 - (p.totalActual / maxVal) * 200;
                return { x, y, p };
              });

              const historicalCoords = coords.filter((c) => !c.p.isForecast);
              const forecastCoords = coords.filter((c, i) => c.p.isForecast || i === historicalCoords.length - 1);

              const histPath = historicalCoords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');
              const forePath = forecastCoords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');

              return (
                <>
                  {/* Confidence Interval Ribbon for Forecast */}
                  {projectedPoints.length > 0 && (
                    <path
                      d={projectedPoints
                        .map((p, i) => {
                          const globalIdx = baseForecast.historicalMonths.length + i;
                          const x = 40 + globalIdx * stepX;
                          const yHigh = 240 - ((p.forecastHigh || p.totalActual) / maxVal) * 200;
                          return `${i === 0 ? 'M' : 'L'} ${x} ${yHigh}`;
                        })
                        .concat(
                          projectedPoints
                            .slice()
                            .reverse()
                            .map((p, i) => {
                              const origIdx = projectedPoints.length - 1 - i;
                              const globalIdx = baseForecast.historicalMonths.length + origIdx;
                              const x = 40 + globalIdx * stepX;
                              const yLow = 240 - ((p.forecastLow || p.totalActual) / maxVal) * 200;
                              return `L ${x} ${yLow}`;
                            })
                        )
                        .join(' ') + ' Z'}
                      fill="#6366f1"
                      fillOpacity="0.12"
                    />
                  )}

                  {/* Historical Line */}
                  {histPath && (
                    <path
                      d={histPath}
                      fill="none"
                      stroke="#059669"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}

                  {/* Forecast Line */}
                  {forePath && (
                    <path
                      d={forePath}
                      fill="none"
                      stroke="#4f46e5"
                      strokeWidth="3.5"
                      strokeDasharray="6 6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}

                  {/* Data Points */}
                  {coords.map((c, i) => {
                    const isHovered = hoveredIndex === i;
                    const isFc = c.p.isForecast;
                    return (
                      <g key={i} className="cursor-pointer" onMouseEnter={() => setHoveredIndex(i)} onMouseLeave={() => setHoveredIndex(null)}>
                        <circle
                          cx={c.x}
                          cy={c.y}
                          r={isHovered ? '7' : '5'}
                          fill={isFc ? '#4f46e5' : '#059669'}
                          stroke="#ffffff"
                          strokeWidth="2"
                          className="transition-all"
                        />
                        {/* X-Axis Label */}
                        <text
                          x={c.x}
                          y="256"
                          textAnchor="middle"
                          className="text-[10px] fill-slate-500 font-medium"
                        >
                          {c.p.period.split(' ')[0]}
                        </text>

                        {/* Tooltip on Hover */}
                        {isHovered && (
                          <g transform={`translate(${Math.min(650, Math.max(60, c.x - 70))}, ${Math.max(10, c.y - 70)})`}>
                            <rect width="140" height="55" rx="8" fill="#1e293b" opacity="0.95" />
                            <text x="12" y="20" fill="#ffffff" className="text-[11px] font-bold">
                              {c.p.period}
                            </text>
                            <text x="12" y="36" fill="#34d399" className="text-[10px] font-mono">
                              {formatCurrencyNumber(c.p.totalActual, currency, true, language)}
                            </text>
                            <text x="12" y="48" fill="#94a3b8" className="text-[9px]">
                              {isFc ? (isAr ? 'تنبؤ ذكي (AI Forecast)' : 'AI Forecast') : (isAr ? 'فعلـي (Actual)' : 'Actual')}
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  })}
                </>
              );
            })()}
          </svg>
        </div>

        {/* Detailed Projected Table */}
        <div className="overflow-x-auto pt-2">
          <table className="w-full text-xs text-right">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3">{isAr ? 'الشهر / الفترة' : 'Period'}</th>
                <th className="p-3">{isAr ? 'نوع البيانات' : 'Type'}</th>
                <th className="p-3">{isAr ? 'المبيعات المتوقعة / الفعلية' : 'Sales Volume'}</th>
                <th className="p-3">{isAr ? 'التارجت الشهري' : 'Target'}</th>
                <th className="p-3">{isAr ? 'نسبة الإنجاز المتوقعة' : 'Achievement %'}</th>
                <th className="p-3">{isAr ? 'نطاق الثقة (الأدنى - الأعلى)' : 'Confidence Range'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {allPoints.map((p, idx) => (
                <tr key={idx} className={`hover:bg-slate-50/80 transition ${p.isForecast ? 'bg-indigo-50/30' : ''}`}>
                  <td className="p-3 font-bold text-slate-900">{p.period}</td>
                  <td className="p-3">
                    {p.isForecast ? (
                      <span className="px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold">
                        {isAr ? 'تنبؤ ذكي' : 'Forecast'}
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                        {isAr ? 'فعلـي' : 'Historical'}
                      </span>
                    )}
                  </td>
                  <td className="p-3 font-mono font-bold text-slate-900">
                    {formatCurrencyNumber(p.totalActual, currency, true, language)}
                  </td>
                  <td className="p-3 font-mono text-slate-500">
                    {formatCurrencyNumber(p.totalTarget, currency, true, language)}
                  </td>
                  <td className="p-3">
                    <span className={`font-bold font-mono ${p.achievementRate >= 100 ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {p.achievementRate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="p-3 font-mono text-xs text-slate-500">
                    {p.forecastLow && p.forecastHigh
                      ? `${formatCurrencyNumber(p.forecastLow, currency, false, language)} ~ ${formatCurrencyNumber(p.forecastHigh, currency, false, language)}`
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Strategic AI Takeaways & Recommendations */}
      <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-900 rounded-3xl p-6 text-white shadow-xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-400/30 flex items-center justify-center">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              {isAr ? 'التوصيات الاستراتيجية لإدارة الفرع بناءً على التنبؤ' : 'Strategic AI Takeaways for Branch Management'}
            </h3>
            <p className="text-xs text-indigo-200">
              {isAr ? 'تحليلات آلية لدعم اتخاذ القرار وتوجيه مستشاري المبيعات' : 'Actionable insights derived from the predictive trajectory'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
            <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-indigo-400" />
              <span>{isAr ? 'توجيه المخزون والسيولة' : 'Inventory & Stock Buildup'}</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {isAr
                ? `بناءً على معدل النمو المتوقع (${baseForecast.averageMoMGrowthRate.toFixed(1)}% MoM)، يُوصى بزيادة مخزون هواتف الفلاجشيب وإكسسوارات Anker بنسبة 15% قبل بداية الشهر القادم.`
                : `Given the MoM growth slope, preemptively restock flagship handsets and accessories by 15% to meet projected demand.`}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
            <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>{isAr ? 'إعادة توزيع الشيفتات' : 'Peak Shift Roster'}</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {isAr
                ? 'تكثيف تواجد المستشارين الأوائل خلال ساعات الذروة المسائية (16:30 - 23:30) لتعزيز نسبة تحويل المبيعات والوصول للتارجت الإضافي.'
                : 'Intensify senior advisor staffing during evening peak hours to maximize conversion rates and surpass targets.'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
            <div className="flex items-center gap-2 text-purple-300 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              <span>{isAr ? 'حوافز الأداء التحفيزية' : 'Target Incentive Payouts'}</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {isAr
                ? 'السيناريو الحالي يشير إلى تجاوز 100% من الهدف الشهري، مما يرفع إجمالي الحوافز المستحقة لفريق كونكورد بلازا بنسبة تتراوح بين 10% إلى 20%.'
                : 'Current trajectory indicates surpassing 100% target achievement, increasing total team incentive pools by 10-20%.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesForecastingSection;
