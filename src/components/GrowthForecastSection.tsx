import React, { useState } from 'react';
import { SalesRecord, Currency, Language } from '../types/sales';
import { formatCurrencyNumber, formatPercent } from '../utils/calculations';
import { translations } from '../utils/i18n';
import {
  extractMonthlyDataPoints,
  calculateGrowthForecast,
  calculateAnnualProjection,
} from '../utils/forecasting';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Calendar,
  Building2,
  LineChart,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  HelpCircle,
} from 'lucide-react';

interface GrowthForecastSectionProps {
  records: SalesRecord[];
  currency: Currency;
  branches: string[];
  language: Language;
}

export const GrowthForecastSection: React.FC<GrowthForecastSectionProps> = ({
  records,
  currency,
  branches,
  language,
}) => {
  const t = translations[language];
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'chart' | 'table' | 'annual'>('chart');
  const [hoveredMonth, setHoveredMonth] = useState<string | null>(null);

  // Extract monthly data and calculate linear trend forecast
  const historicalPoints = extractMonthlyDataPoints(records, selectedBranch || undefined);
  const forecast = calculateGrowthForecast(historicalPoints, selectedBranch || undefined);
  const annualProjection = calculateAnnualProjection(records, selectedBranch || undefined, 2026);

  const allMonths = [...forecast.historicalMonths, ...forecast.projectedMonths];

  const maxVal = Math.max(
    ...allMonths.map((m) => Math.max(m.totalActual, m.totalTarget, m.forecastHigh || 0)),
    1000
  );

  const isUp = forecast.trendDirection === 'up';
  const isDown = forecast.trendDirection === 'down';
  const nextMonth = forecast.projectedMonths[0];

  return (
    <section id="growth-forecast" className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900">
              {t.forecastTitle}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {t.forecastDesc}
          </p>
        </div>

        {/* Branch Selector and View Switcher */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Branch filter */}
          <div className="relative">
            <Building2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="text-xs pr-8 pl-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="">{t.allBranchesOption}</option>
              {branches.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* Tab switcher */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-medium">
            <button
              onClick={() => setActiveTab('chart')}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                activeTab === 'chart'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.chartTab}
            </button>
            <button
              onClick={() => setActiveTab('table')}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                activeTab === 'table'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.tableTab}
            </button>
            <button
              onClick={() => setActiveTab('annual')}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
                activeTab === 'annual'
                  ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-3 h-3" />
              <span>{language === 'ar' ? 'التوقعات السنوية (12 شهراً)' : 'Annual Projection'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Forecast Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {/* 1. Next Month Projected Sales */}
        <div className="bg-slate-50/80 rounded-xl border border-slate-200/90 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              {t.forecastNextMonth} ({nextMonth?.period})
            </span>
            <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Calendar className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 text-xl font-bold text-slate-900 font-mono tabular-nums">
            {formatCurrencyNumber(forecast.projectedNextMonthSales, currency, true, language)}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs">
            <span
              className={`font-semibold font-mono tabular-nums flex items-center ${
                forecast.projectedNextMonthGrowthPct >= 0 ? 'text-emerald-700' : 'text-rose-600'
              }`}
            >
              {forecast.projectedNextMonthGrowthPct >= 0 ? (
                <ArrowUpRight className="w-3.5 h-3.5" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5" />
              )}
              {formatPercent(Math.abs(forecast.projectedNextMonthGrowthPct))}
            </span>
            <span className="text-slate-400">{t.expectedGrowth}</span>
          </div>
          {nextMonth?.forecastLow && nextMonth?.forecastHigh && (
            <div className="mt-2 pt-2 border-t border-slate-200/70 text-[11px] text-slate-400 font-mono tabular-nums">
              {t.forecastInterval}: {formatCurrencyNumber(nextMonth.forecastLow, currency, false, language)} - {formatCurrencyNumber(nextMonth.forecastHigh, currency, false, language)}
            </div>
          )}
        </div>

        {/* 2. Monthly Trend & Growth Rate */}
        <div className="bg-slate-50/80 rounded-xl border border-slate-200/90 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">{t.forecastMoMRate}</span>
            <div
              className={`w-6 h-6 rounded-md flex items-center justify-center ${
                isUp
                  ? 'bg-emerald-100 text-emerald-700'
                  : isDown
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {isUp ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : isDown ? (
                <TrendingDown className="w-3.5 h-3.5" />
              ) : (
                <Minus className="w-3.5 h-3.5" />
              )}
            </div>
          </div>
          <div className="mt-2 text-xl font-bold text-slate-900 font-mono tabular-nums flex items-baseline gap-2">
            <span>{forecast.averageMoMGrowthRate >= 0 ? '+' : ''}{formatPercent(forecast.averageMoMGrowthRate)}</span>
            <span
              className={`text-xs font-semibold ${
                isUp ? 'text-emerald-700' : isDown ? 'text-rose-700' : 'text-slate-600'
              }`}
            >
              {isUp ? t.trendUp : isDown ? t.trendDown : t.trendStable}
            </span>
          </div>
          <div className="mt-1 text-xs text-slate-500">
            <span>{t.monthlyAvg}</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-200/70 text-[11px] text-slate-400">
            {t.monthlyVelocity}: +{formatCurrencyNumber(Math.max(0, forecast.slope), currency, true, language)}
          </div>
        </div>

        {/* 3. Next Quarter Projection */}
        <div className="bg-slate-50/80 rounded-xl border border-slate-200/90 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">{t.forecastQuarter}</span>
            <div className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center">
              <Target className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 text-xl font-bold text-slate-900 font-mono tabular-nums">
            {formatCurrencyNumber(forecast.projectedQuarterSales, currency, true, language)}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            <span>{t.next3Months}</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-200/70 text-[11px] text-slate-400 font-mono tabular-nums">
            {t.quarterMonthlyAvg}: {formatCurrencyNumber(forecast.projectedQuarterSales / 3, currency, true, language)}
          </div>
        </div>

        {/* 4. Model Reliability & Trend Fit */}
        <div className="bg-slate-50/80 rounded-xl border border-slate-200/90 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">{t.forecastRSquared}</span>
            <div className="w-6 h-6 rounded-md bg-purple-100 text-purple-700 flex items-center justify-center">
              <LineChart className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 text-xl font-bold text-slate-900 font-mono tabular-nums">
            {(forecast.rSquared * 100).toFixed(0)}%
          </div>
          <div className="mt-1 text-xs text-slate-500">
            <span>{language === 'ar' ? 'مؤشر ثبات واستقرار الاتجاه الخطي' : 'Linear trend regression confidence'}</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-200/70 text-[11px] text-slate-400">
            {forecast.historicalMonths.length} {language === 'ar' ? 'فترات تاريخية مسجلة' : 'historical periods'}
          </div>
        </div>
      </div>

      {/* Main Visualization Section */}
      <div className="mt-6">
        {activeTab === 'chart' ? (
          <div className="space-y-4">
            {/* Chart Legend */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-slate-400 inline-block" />
                  <span className="text-slate-700 font-medium">{t.targetLegend}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-emerald-600 inline-block" />
                  <span className="text-slate-700 font-medium">{t.actualLegend}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-blue-500 border border-dashed border-blue-400 inline-block" />
                  <span className="text-slate-700 font-medium">{t.forecastLegend}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'الخطوط المنقطة تمثل الأشهر المتوقعة مستقبلياً' : 'Dotted elements indicate future projections'}</span>
              </div>
            </div>

            {/* Monthly Trend Bars */}
            <div className="space-y-3.5 pt-2">
              {allMonths.map((m) => {
                const targetPct = (m.totalTarget / maxVal) * 100;
                const actualPct = (m.totalActual / maxVal) * 100;
                const isHovered = hoveredMonth === m.period;

                return (
                  <div
                    key={m.period}
                    onMouseEnter={() => setHoveredMonth(m.period)}
                    onMouseLeave={() => setHoveredMonth(null)}
                    className={`p-3.5 rounded-xl transition-all border ${
                      m.isForecast
                        ? 'border-blue-200 bg-blue-50/30 hover:bg-blue-50/60'
                        : isHovered
                        ? 'border-emerald-300 bg-emerald-50/30'
                        : 'border-slate-100 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{m.period}</span>
                        {m.isForecast ? (
                          <span className="text-[11px] font-semibold text-blue-700 bg-blue-100 border border-blue-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            {t.forecastFutureBadge}
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                            {t.actualBadge}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs font-mono tabular-nums">
                        <span className="text-slate-500">
                          {t.targetLegend}: {formatCurrencyNumber(m.totalTarget, currency, true, language)}
                        </span>
                        <span aria-hidden="true" className="text-slate-300">·</span>
                        <span
                          className={`font-bold ${
                            m.isForecast ? 'text-blue-700' : 'text-emerald-700'
                          }`}
                        >
                          {m.isForecast ? (language === 'ar' ? 'المتوقع: ' : 'Forecast: ') : (language === 'ar' ? 'المحقق: ' : 'Actual: ')}
                          {formatCurrencyNumber(m.totalActual, currency, true, language)}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                            m.achievementRate >= 100
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {formatPercent(m.achievementRate)}
                        </span>
                      </div>
                    </div>

                    {/* Bars */}
                    <div className="space-y-1.5">
                      {/* Target bar */}
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="w-14 text-slate-400 shrink-0">{t.targetLegend}</span>
                        <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full bg-slate-400 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(targetPct, 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Actual/Forecast bar */}
                      <div className="flex items-center gap-2 text-[11px]">
                        <span
                          className={`w-14 font-medium shrink-0 ${
                            m.isForecast ? 'text-blue-600' : 'text-emerald-700'
                          }`}
                        >
                          {m.isForecast ? t.forecastFutureBadge : t.actualBadge}
                        </span>
                        <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              m.isForecast
                                ? 'bg-gradient-to-r from-blue-500 to-indigo-500'
                                : 'bg-emerald-600'
                            }`}
                            style={{ width: `${Math.min(actualPct, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Table View */
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                <tr>
                  <th className="py-2.5 px-4">{language === 'ar' ? 'الفترة / الشهر' : 'Period / Month'}</th>
                  <th className="py-2.5 px-4">{t.forecastTableType}</th>
                  <th className="py-2.5 px-4 text-left">{t.forecastTableTarget}</th>
                  <th className="py-2.5 px-4 text-left">{t.forecastTableSales}</th>
                  <th className="py-2.5 px-4 text-left">{t.forecastTableDiff}</th>
                  <th className="py-2.5 px-4 text-center">{t.forecastTableRate}</th>
                  <th className="py-2.5 px-4">{t.forecastTableNotes}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allMonths.map((m, idx) => {
                  const prevMonth = idx > 0 ? allMonths[idx - 1] : null;
                  const momGrowth = prevMonth
                    ? ((m.totalActual - prevMonth.totalActual) / prevMonth.totalActual) * 100
                    : null;
                  const diff = m.totalActual - m.totalTarget;

                  return (
                    <tr
                      key={m.period}
                      className={
                        m.isForecast ? 'bg-blue-50/20 hover:bg-blue-50/40' : 'hover:bg-slate-50'
                      }
                    >
                      <td className="py-3 px-4 font-bold text-slate-900">{m.period}</td>
                      <td className="py-3 px-4">
                        {m.isForecast ? (
                          <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                            {t.forecastFutureBadge}
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                            {t.actualBadge}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-left font-mono tabular-nums text-slate-600">
                        {formatCurrencyNumber(m.totalTarget, currency, true, language)}
                      </td>
                      <td className="py-3 px-4 text-left font-mono tabular-nums font-bold">
                        <span className={m.isForecast ? 'text-blue-700' : 'text-emerald-700'}>
                          {formatCurrencyNumber(m.totalActual, currency, true, language)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-left font-mono tabular-nums font-medium">
                        {diff >= 0 ? (
                          <span className="text-emerald-700">+{formatCurrencyNumber(diff, currency, true, language)}</span>
                        ) : (
                          <span className="text-rose-600">{formatCurrencyNumber(diff, currency, true, language)}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center font-mono tabular-nums font-bold">
                        <span
                          className={
                            m.achievementRate >= 100 ? 'text-emerald-700' : 'text-amber-700'
                          }
                        >
                          {formatPercent(m.achievementRate)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {momGrowth !== null ? (
                          <span
                            className={`font-mono tabular-nums font-semibold ${
                              momGrowth >= 0 ? 'text-emerald-700' : 'text-rose-600'
                            }`}
                          >
                            {momGrowth >= 0 ? '+' : ''}{formatPercent(momGrowth)} {t.vsPreviousMonth}
                          </span>
                        ) : (
                          <span className="text-slate-400">{t.basePeriod}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 3. Annual Projection View (12 Months) */}
        {activeTab === 'annual' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Annual Milestone Cards Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500 font-semibold block">
                  {language === 'ar' ? 'المبيعات السنوية المتوقعة (2026)' : 'Projected Annual Sales'}
                </span>
                <div className="text-xl font-bold font-mono text-emerald-800 mt-1">
                  {formatCurrencyNumber(annualProjection.totalAnnualProjected, currency, true, language)}
                </div>
                <span className="text-[11px] text-emerald-700 font-semibold font-mono mt-1 block">
                  {annualProjection.annualAchievementRate.toFixed(1)}% {language === 'ar' ? 'من التارجت السنوي' : 'of annual target'}
                </span>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500 font-semibold block">
                  {language === 'ar' ? 'التارجت السنوي المخطط' : 'Annual Planned Target'}
                </span>
                <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                  {formatCurrencyNumber(annualProjection.totalAnnualTarget, currency, true, language)}
                </div>
                <span className="text-[11px] text-slate-500 font-mono mt-1 block">
                  {language === 'ar' ? 'موزع على 12 شهراً' : '12 months distribution'}
                </span>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500 font-semibold block">
                  {language === 'ar' ? 'الفائض السنوي المتوقع' : 'Projected Annual Surplus'}
                </span>
                <div className={`text-xl font-bold font-mono mt-1 ${annualProjection.annualProjectedVariance >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                  {annualProjection.annualProjectedVariance >= 0 ? '+' : ''}
                  {formatCurrencyNumber(annualProjection.annualProjectedVariance, currency, true, language)}
                </div>
                <span className="text-[11px] text-slate-600 font-semibold mt-1 block">
                  {language === 'ar' ? 'بناءً على الأداء التراكمي' : 'Based on past actuals'}
                </span>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500 font-semibold block">
                  {language === 'ar' ? 'معدل التشغيل السنوي (Run-Rate)' : 'Annual Run-Rate'}
                </span>
                <div className="text-xl font-bold font-mono text-purple-900 mt-1">
                  {formatCurrencyNumber(annualProjection.annualRunRate, currency, true, language)}
                </div>
                <span className="text-[11px] text-purple-700 font-semibold mt-1 block">
                  {language === 'ar' ? `متوسط ${formatCurrencyNumber(Math.round(annualProjection.annualRunRate / 12), currency, true, language)} / شهر` : 'Avg monthly run'}
                </span>
              </div>
            </div>

            {/* 12-Month Bar Visualizer */}
            <div className="bg-slate-50/60 p-5 rounded-xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900">
                  {language === 'ar' ? 'مسار المبيعات السنوي (يناير - ديسمبر 2026):' : 'Annual Sales Trajectory (Jan - Dec 2026):'}
                </span>
                <div className="flex items-center gap-3 text-[11px] text-slate-600 font-medium">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-xs bg-emerald-600 inline-block" />
                    <span>{language === 'ar' ? 'محقق فعلي' : 'Actual'}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-xs bg-teal-400 border border-teal-600 border-dashed inline-block" />
                    <span>{language === 'ar' ? 'متوقع' : 'Projected'}</span>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-12 gap-1.5 sm:gap-2 h-48 items-end border-b border-slate-200 pb-2">
                {(() => {
                  const maxM = Math.max(...annualProjection.months.map((m) => Math.max(m.target, m.projectedActual)), 1000);
                  return annualProjection.months.map((m) => {
                    const h = Math.max(15, (m.projectedActual / maxM) * 100);
                    return (
                      <div key={m.monthIndex} className="flex flex-col items-center justify-end h-full group relative">
                        <div
                          className={`w-full rounded-t-lg transition-all ${
                            m.isHistorical
                              ? 'bg-emerald-600 group-hover:bg-emerald-700'
                              : 'bg-teal-400/80 border border-dashed border-teal-600 group-hover:bg-teal-500'
                          }`}
                          style={{ height: `${h}%` }}
                          title={`${m.monthNameAr}: ${formatCurrencyNumber(m.projectedActual, currency, true, language)}`}
                        />
                        <span className="text-[10px] font-bold text-slate-600 mt-2 truncate max-w-full">
                          {language === 'ar' ? m.monthNameAr.slice(0, 4) : m.monthNameEn.slice(0, 3)}
                        </span>
                      </div>
                    );
                  });
                })()}
              </div>

              {/* 4 Quarters Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                {annualProjection.quarters.map((q) => (
                  <div key={q.quarter} className="bg-white p-3 rounded-lg border border-slate-200 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{language === 'ar' ? q.quarterNameAr : q.quarterNameEn}</span>
                      <span className="text-[10px] font-bold font-mono text-emerald-700">{q.achievementRate.toFixed(0)}%</span>
                    </div>
                    <div className="text-sm font-black font-mono text-slate-900 mt-1">
                      {formatCurrencyNumber(q.totalActualOrProjected, currency, true, language)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
