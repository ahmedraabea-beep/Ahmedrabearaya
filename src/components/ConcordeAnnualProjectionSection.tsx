import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Target,
  Award,
  Calendar,
  Sparkles,
  Building2,
  CheckCircle2,
  AlertCircle,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Layers,
  Copy,
  Check,
  Download,
  Info,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { SalesRecord, Currency, Language, BranchTotalTargetStructure } from '../types/sales';
import { calculateAnnualProjection, EGYPT_RETAIL_SEASONAL_FACTORS } from '../utils/forecasting';
import { formatCurrencyNumber, formatPercent } from '../utils/calculations';
import { exportRecordsToExcel } from '../utils/excelParser';

interface ConcordeAnnualProjectionSectionProps {
  records: SalesRecord[];
  currency: Currency;
  language: Language;
  targetStructure?: BranchTotalTargetStructure;
}

export const ConcordeAnnualProjectionSection: React.FC<ConcordeAnnualProjectionSectionProps> = ({
  records,
  currency,
  language,
  targetStructure,
}) => {
  const isAr = language === 'ar';

  const [scenario, setScenario] = useState<'realistic' | 'optimistic' | 'conservative'>('realistic');
  const [viewMode, setViewMode] = useState<'cumulative' | 'monthly'>('cumulative');
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number | null>(null);
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Calculate annual projection using the forecasting engine for Concorde Plaza
  const annual = useMemo(() => {
    return calculateAnnualProjection(records, undefined, 2026);
  }, [records]);

  // Compute Cumulative series from Month 0 to Month 11
  const cumulativeData = useMemo(() => {
    let runningTarget = 0;
    let runningActualOrProjected = 0;
    let runningRealistic = 0;
    let runningOptimistic = 0;
    let runningConservative = 0;

    return annual.months.map((m) => {
      runningTarget += m.target;

      // Realistic uses actual if historical, or projected
      const monthlyVal =
        scenario === 'optimistic'
          ? m.scenarioOptimistic
          : scenario === 'conservative'
          ? m.scenarioConservative
          : m.projectedActual;

      runningActualOrProjected += monthlyVal;
      runningRealistic += m.scenarioRealistic;
      runningOptimistic += m.scenarioOptimistic;
      runningConservative += m.scenarioConservative;

      const cumulativeRate = runningTarget > 0 ? (runningActualOrProjected / runningTarget) * 100 : 0;
      const cumulativeVariance = runningActualOrProjected - runningTarget;

      return {
        ...m,
        selectedMonthlyValue: monthlyVal,
        cumulativeTarget: runningTarget,
        cumulativeActualOrProjected: runningActualOrProjected,
        cumulativeRealistic: runningRealistic,
        cumulativeOptimistic: runningOptimistic,
        cumulativeConservative: runningConservative,
        cumulativeRate,
        cumulativeVariance,
      };
    });
  }, [annual, scenario]);

  // Active month for detail inspector
  const activeMonth = useMemo(() => {
    if (selectedMonthIndex !== null && cumulativeData[selectedMonthIndex]) {
      return cumulativeData[selectedMonthIndex];
    }
    // Default to the current month or first future month
    const cur = cumulativeData.find((m) => m.monthIndex === 9) || cumulativeData[cumulativeData.length - 1];
    return cur;
  }, [cumulativeData, selectedMonthIndex]);

  // Chart Dimensions & Scalers
  const chartHeight = 280;
  const chartWidth = 900;
  const paddingX = 55;
  const paddingY = 40;

  const maxVal = useMemo(() => {
    if (viewMode === 'cumulative') {
      const highestCum = Math.max(
        cumulativeData[cumulativeData.length - 1].cumulativeOptimistic,
        cumulativeData[cumulativeData.length - 1].cumulativeTarget
      );
      return highestCum * 1.08;
    } else {
      const highestMonth = Math.max(...cumulativeData.map((m) => Math.max(m.scenarioOptimistic, m.target)));
      return highestMonth * 1.15;
    }
  }, [cumulativeData, viewMode]);

  const getY = (val: number) => {
    const usableHeight = chartHeight - paddingY * 2;
    return chartHeight - paddingY - (val / (maxVal || 1)) * usableHeight;
  };

  const getX = (index: number) => {
    const usableWidth = chartWidth - paddingX * 2;
    return paddingX + (index / 11) * usableWidth;
  };

  // Build SVG Path strings for lines & areas
  const targetPath = useMemo(() => {
    return cumulativeData
      .map((d, i) => {
        const val = viewMode === 'cumulative' ? d.cumulativeTarget : d.target;
        return `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(val)}`;
      })
      .join(' ');
  }, [cumulativeData, viewMode, maxVal]);

  const actualPath = useMemo(() => {
    return cumulativeData
      .map((d, i) => {
        const val = viewMode === 'cumulative' ? d.cumulativeActualOrProjected : d.selectedMonthlyValue;
        return `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(val)}`;
      })
      .join(' ');
  }, [cumulativeData, viewMode, maxVal]);

  const areaPath = useMemo(() => {
    const firstX = getX(0);
    const lastX = getX(11);
    const zeroY = getY(0);
    const lineCommands = cumulativeData
      .map((d, i) => {
        const val = viewMode === 'cumulative' ? d.cumulativeActualOrProjected : d.selectedMonthlyValue;
        return `L ${getX(i)} ${getY(val)}`;
      })
      .join(' ');

    const initialVal = viewMode === 'cumulative' ? cumulativeData[0].cumulativeActualOrProjected : cumulativeData[0].selectedMonthlyValue;
    return `M ${firstX} ${zeroY} L ${firstX} ${getY(initialVal)} ${lineCommands} L ${lastX} ${zeroY} Z`;
  }, [cumulativeData, viewMode, maxVal]);

  // Copy Executive Summary text
  const handleCopySummary = () => {
    const activeScenarioTotal =
      scenario === 'optimistic'
        ? annual.scenarios.optimistic
        : scenario === 'conservative'
        ? annual.scenarios.conservative
        : annual.totalAnnualProjected;

    const text = isAr
      ? `ملخص تحليل المبيعات السنوي المتوقع لفرع راية كونكورد بلازا (2026):\n` +
        `• التارجت السنوي المطلوب: ${formatCurrencyNumber(annual.totalAnnualTarget, currency)}\n` +
        `• المبيعات السنوية المتوقعة (${scenario === 'optimistic' ? 'المتفائل' : scenario === 'conservative' ? 'التحفظي' : 'الواقعي'}): ${formatCurrencyNumber(activeScenarioTotal, currency)}\n` +
        `• نسبة الإنجاز السنوية المتوقعة: ${((activeScenarioTotal / annual.totalAnnualTarget) * 100).toFixed(1)}%\n` +
        `• الفائض المالي المتوقع: +${formatCurrencyNumber(Math.max(0, activeScenarioTotal - annual.totalAnnualTarget), currency)}\n` +
        `• المبيعات المحققة فعلياً حتى أكتوبر: ${formatCurrencyNumber(annual.totalAnnualActualToDate, currency)}\n` +
        `• متوسط وتيرة النمو الشهري: +${annual.avgMonthlyGrowthRate.toFixed(1)}%\n` +
        `• أعلى ربع مساهمة: الربع الرابع (Q4) بدعم موسم الجمعة البيضاء وعروض التقسيط عبر أمان.`
      : `Concorde Plaza Annual Sales Projection Summary 2026:\n` +
        `• Annual Target: ${formatCurrencyNumber(annual.totalAnnualTarget, currency)}\n` +
        `• Projected Annual Sales: ${formatCurrencyNumber(activeScenarioTotal, currency)} (${((activeScenarioTotal / annual.totalAnnualTarget) * 100).toFixed(1)}%)\n` +
        `• Actual to Date: ${formatCurrencyNumber(annual.totalAnnualActualToDate, currency)}\n` +
        `• Projected Variance: +${formatCurrencyNumber(activeScenarioTotal - annual.totalAnnualTarget, currency)}`;

    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 3000);
  };

  const selectedScenarioTotal =
    scenario === 'optimistic'
      ? annual.scenarios.optimistic
      : scenario === 'conservative'
      ? annual.scenarios.conservative
      : annual.totalAnnualProjected;

  const annualVariance = selectedScenarioTotal - annual.totalAnnualTarget;
  const annualRate = annual.totalAnnualTarget > 0 ? (selectedScenarioTotal / annual.totalAnnualTarget) * 100 : 0;

  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Top Header Strip with Corporate Identity */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-700/60">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 flex items-center justify-center font-bold shadow-inner">
            <TrendingUp className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black tracking-tight">
                {isAr ? 'تحليل المبيعات السنوي المتوقع ومسار النمو التراكمي' : 'Annual Sales Forecast & Cumulative Trajectory'}
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                2026 Full Year
              </span>
            </div>
            <p className="text-xs text-slate-300">
              {isAr
                ? 'نموذج التوقع السنوي التراكمي لفرع راية كونكورد بلازا بناءً على المعدلات الشهرية المحققة حتى نهاية العام'
                : 'Cumulative run-rate model and trajectory projection for Raya Concorde Plaza Branch through year-end'}
            </p>
          </div>
        </div>

        {/* Header Action Controls: Scenario & Copy */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Scenario Selector */}
          <div className="flex items-center gap-1 bg-white/10 backdrop-blur-xs p-1 rounded-xl border border-white/15 text-xs font-bold">
            <button
              onClick={() => setScenario('conservative')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                scenario === 'conservative' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-300 hover:text-white'
              }`}
            >
              {isAr ? 'تحفظي (-8%)' : 'Conservative'}
            </button>
            <button
              onClick={() => setScenario('realistic')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                scenario === 'realistic' ? 'bg-emerald-500 text-slate-950 shadow-xs' : 'text-slate-300 hover:text-white'
              }`}
            >
              {isAr ? 'الواقعي (الأساس)' : 'Realistic'}
            </button>
            <button
              onClick={() => setScenario('optimistic')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                scenario === 'optimistic' ? 'bg-purple-400 text-slate-950 shadow-xs' : 'text-slate-300 hover:text-white'
              }`}
            >
              {isAr ? 'متفائل (+12%)' : 'Optimistic'}
            </button>
          </div>

          <button
            onClick={handleCopySummary}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all cursor-pointer"
            title={isAr ? 'نسخ ملخص التوقعات السنوية' : 'Copy annual summary'}
          >
            {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedSummary ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ الملخص' : 'Copy')}</span>
          </button>
        </div>
      </div>

      {/* 4 Analytical KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 sm:p-5 bg-slate-50 border-b border-slate-200">
        {/* Total Projected Sales */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-300 bg-gradient-to-br from-emerald-50/50 to-white shadow-2xs">
          <div className="flex items-center justify-between text-xs text-emerald-800 font-bold mb-1">
            <span>{isAr ? 'المبيعات السنوية المتوقعة (2026)' : 'Projected Annual Sales'}</span>
            <Sparkles className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-900 font-mono">
            {formatCurrencyNumber(selectedScenarioTotal, currency)}
          </div>
          <div className="text-[11px] text-emerald-700 font-bold mt-1 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>
              {annualRate.toFixed(1)}% {isAr ? 'من المستهدف السنوي المعتمد' : 'of annual target'}
            </span>
          </div>
        </div>

        {/* Historical Actuals to Date */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>{isAr ? 'المحقق فعلياً حتى أكتوبر' : 'Actual to Date (Jan-Oct)'}</span>
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
            {formatCurrencyNumber(annual.totalAnnualActualToDate, currency)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {isAr
              ? `تم تسجيل ${annual.historicalMonthsCount} أشهراً موثقة رسمياً بالدفاتر`
              : `${annual.historicalMonthsCount} certified months recorded`}
          </p>
        </div>

        {/* Projected Annual Variance */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>{isAr ? 'الفائض السنوي المتوقع' : 'Projected Annual Surplus'}</span>
            <Award className="w-4 h-4 text-purple-600" />
          </div>
          <div className={`text-xl sm:text-2xl font-black font-mono ${annualVariance >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
            {annualVariance >= 0 ? '+' : ''}
            {formatCurrencyNumber(annualVariance, currency)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {annualVariance >= 0
              ? (isAr ? 'فائض مالي إيجابي عن المستهدف الإجمالي' : 'Net positive variance over target')
              : (isAr ? 'عجز مطلوب تعويضه في شهري 11 و 12' : 'Gap to cover in Q4')}
          </p>
        </div>

        {/* Q4 Prime Momentum */}
        <div className="bg-white p-4 rounded-2xl border border-amber-300 bg-gradient-to-br from-amber-50/40 to-white shadow-2xs">
          <div className="flex items-center justify-between text-xs text-amber-800 font-bold mb-1">
            <span>{isAr ? 'ذروة الزخم وموسم الجمعة البيضاء' : 'Q4 Peak Growth Momentum'}</span>
            <Flame className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-950 font-mono">
            +{annual.avgMonthlyGrowthRate.toFixed(1)}% / {isAr ? 'شهر' : 'mo'}
          </div>
          <p className="text-[11px] text-amber-800 mt-1 font-medium">
            {isAr ? 'معامل صعود (+35%) لشهر نوفمبر وديسمبر' : '+35% White Friday & holiday seasonal factor'}
          </p>
        </div>
      </div>

      {/* Chart View Toggle Bar */}
      <div className="px-5 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs bg-white">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-700">{isAr ? 'نوع الرسم البياني:' : 'Chart Trajectory View:'}</span>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('cumulative')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                viewMode === 'cumulative' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isAr ? 'اتجاه النمو التراكمي (Cumulative Trajectory)' : 'Cumulative Trajectory'}
            </button>
            <button
              onClick={() => setViewMode('monthly')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                viewMode === 'monthly' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isAr ? 'المبيعات الشهرية المفردة (Monthly Run-Rate)' : 'Monthly Run-Rate'}
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-emerald-600 inline-block rounded" />
            <span className="w-2 h-2 rounded-full bg-emerald-600 -mr-1" />
            <span className="font-bold text-slate-800">
              {viewMode === 'cumulative' ? (isAr ? 'التراكمي الفعلي / المتوقع' : 'Cumulative Actual/Projected') : (isAr ? 'المبيعات الشهرية' : 'Monthly Sales')}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 border-t-2 border-dashed border-slate-400 inline-block" />
            <span className="text-slate-500">
              {viewMode === 'cumulative' ? (isAr ? 'المستهدف التراكمي' : 'Cumulative Target') : (isAr ? 'المستهدف الشهري' : 'Target')}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500/20 border border-purple-500" />
            <span className="text-purple-700 font-bold">{isAr ? 'توقع مستقبلي (Q4)' : 'Projected (Q4)'}</span>
          </div>
        </div>
      </div>

      {/* The Hero Vector SVG Interactive Line/Area Chart */}
      <div className="p-4 sm:p-6 bg-slate-50/50">
        <div className="relative w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-auto min-w-[700px] select-none"
          >
            <defs>
              <linearGradient id="concordeAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#059669" stopOpacity="0.28" />
                <stop offset="60%" stopColor="#10b981" stopOpacity="0.10" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
              </linearGradient>

              <linearGradient id="concordeLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#047857" />
                <stop offset="75%" stopColor="#059669" />
                <stop offset="100%" stopColor="#7c3aed" />
              </linearGradient>
            </defs>

            {/* Horizontal Gridlines */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
              const y = getY(maxVal * pct);
              return (
                <g key={pct}>
                  <line
                    x1={paddingX}
                    y1={y}
                    x2={chartWidth - paddingX}
                    y2={y}
                    stroke="#e2e8f0"
                    strokeWidth="1"
                    strokeDasharray={pct === 0 ? '' : '3 3'}
                  />
                  <text
                    x={paddingX - 10}
                    y={y + 3}
                    textAnchor="end"
                    className="text-[9px] fill-slate-400 font-mono"
                  >
                    {formatCurrencyNumber(Math.round(maxVal * pct), currency, false).replace(/[^0-9.]/g, '')}
                  </text>
                </g>
              );
            })}

            {/* Quarterly Phase Background Strips */}
            <rect
              x={paddingX}
              y={paddingY}
              width={(getX(2) - paddingX) + (getX(1) - getX(0)) / 2}
              height={chartHeight - paddingY * 2}
              fill="#f8fafc"
              opacity="0.4"
            />
            <rect
              x={getX(9) - (getX(1) - getX(0)) / 2}
              y={paddingY}
              width={chartWidth - paddingX - (getX(9) - (getX(1) - getX(0)) / 2)}
              height={chartHeight - paddingY * 2}
              fill="#fdf4ff"
              opacity="0.5"
            />

            {/* Area Fill */}
            <path d={areaPath} fill="url(#concordeAreaGrad)" />

            {/* Target Line (Dashed) */}
            <path
              d={targetPath}
              fill="none"
              stroke="#94a3b8"
              strokeWidth="2"
              strokeDasharray="5 4"
            />

            {/* Actual & Projected Cumulative Line */}
            <path
              d={actualPath}
              fill="none"
              stroke="url(#concordeLineGrad)"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Data Points on each month */}
            {cumulativeData.map((d, i) => {
              const val = viewMode === 'cumulative' ? d.cumulativeActualOrProjected : d.selectedMonthlyValue;
              const cx = getX(i);
              const cy = getY(val);
              const isSelected = activeMonth.monthIndex === d.monthIndex;

              return (
                <g
                  key={d.monthIndex}
                  className="cursor-pointer group"
                  onClick={() => setSelectedMonthIndex(d.monthIndex)}
                >
                  {/* Vertical Guide Line on hover/select */}
                  <line
                    x1={cx}
                    y1={paddingY}
                    x2={cx}
                    y2={chartHeight - paddingY}
                    stroke={isSelected ? '#7c3aed' : '#cbd5e1'}
                    strokeWidth={isSelected ? '1.5' : '1'}
                    strokeDasharray={isSelected ? '' : '2 2'}
                    opacity={isSelected ? 1 : 0.4}
                  />

                  {/* Circle Indicator */}
                  {d.isHistorical ? (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isSelected ? 7 : 5}
                      className="fill-emerald-600 stroke-white transition-all"
                      strokeWidth={isSelected ? 3 : 2}
                    />
                  ) : (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isSelected ? 7 : 5}
                      className="fill-purple-600 stroke-white transition-all"
                      strokeWidth={isSelected ? 3 : 2}
                    />
                  )}

                  {/* Month Label below */}
                  <text
                    x={cx}
                    y={chartHeight - paddingY + 16}
                    textAnchor="middle"
                    className={`text-[10px] font-bold ${
                      isSelected
                        ? 'fill-purple-900 font-black'
                        : d.isHistorical
                        ? 'fill-slate-700'
                        : 'fill-purple-700'
                    }`}
                  >
                    {isAr ? d.monthNameAr : d.monthNameEn}
                  </text>

                  {/* Quarter Marker Tag */}
                  {(i === 2 || i === 5 || i === 8 || i === 11) && (
                    <text
                      x={cx}
                      y={chartHeight - paddingY + 30}
                      textAnchor="middle"
                      className="text-[9px] fill-slate-400 font-mono font-bold"
                    >
                      {d.quarter}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Selected Month Inspector Card */}
        <div className="mt-4 p-4 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in duration-150">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-xs ${
                activeMonth.isHistorical
                  ? 'bg-emerald-100 text-emerald-800 ring-2 ring-emerald-300'
                  : 'bg-purple-100 text-purple-800 ring-2 ring-purple-300'
              }`}
            >
              {isAr ? activeMonth.monthNameAr : activeMonth.monthNameEn}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-black text-slate-900 text-sm">{activeMonth.periodLabel}</h4>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 font-mono">
                  {activeMonth.quarter}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                    activeMonth.isHistorical
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-purple-100 text-purple-800 border border-purple-300'
                  }`}
                >
                  {activeMonth.isHistorical
                    ? (isAr ? 'محقق فعلياً بالدفاتر' : 'Historical Actual')
                    : (isAr ? 'توقع مستقبلي مبني على الزخم' : 'Projected Forecast')}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {isAr
                  ? `المعامل الموسمي للسوق المصري: ${activeMonth.isHistorical ? '1.0' : (EGYPT_RETAIL_SEASONAL_FACTORS[activeMonth.monthIndex] || 1.0)}x · فرع كونكورد بلازا`
                  : `Seasonal factor: ${EGYPT_RETAIL_SEASONAL_FACTORS[activeMonth.monthIndex] || 1.0}x`}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <div>
              <span className="block text-[10px] text-slate-500">{isAr ? 'المبيعات الشهرية:' : 'Monthly:'}</span>
              <strong className="font-mono text-slate-900 text-xs sm:text-sm">
                {formatCurrencyNumber(activeMonth.selectedMonthlyValue, currency)}
              </strong>
            </div>

            <div>
              <span className="block text-[10px] text-slate-500">{isAr ? 'التراكمي حتى الشهر:' : 'Cumulative:'}</span>
              <strong className="font-mono text-emerald-800 text-xs sm:text-sm">
                {formatCurrencyNumber(activeMonth.cumulativeActualOrProjected, currency)}
              </strong>
            </div>

            <div>
              <span className="block text-[10px] text-slate-500">{isAr ? 'المستهدف التراكمي:' : 'Target Cum:'}</span>
              <strong className="font-mono text-slate-700 text-xs sm:text-sm">
                {formatCurrencyNumber(activeMonth.cumulativeTarget, currency)}
              </strong>
            </div>

            <div>
              <span className="block text-[10px] text-slate-500">{isAr ? 'نسبة الإنجاز التراكمي:' : 'Achievement:'}</span>
              <strong
                className={`font-mono text-xs sm:text-sm ${
                  activeMonth.cumulativeRate >= 100 ? 'text-emerald-700' : 'text-amber-700'
                }`}
              >
                {activeMonth.cumulativeRate.toFixed(1)}%
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* 12-Month Cumulative Projection Ledger Table */}
      <div className="p-4 sm:p-5 border-t border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-4 rounded-full bg-emerald-600 inline-block" />
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              {isAr ? 'جدول وتفاصيل التوقعات التراكمية على مدار الـ 12 شهراً:' : '12-Month Cumulative Trajectory Ledger:'}
            </h4>
          </div>
          <span className="text-[11px] text-slate-500">
            {isAr ? 'اضغط على أي صف لتحديده بالرسم البياني' : 'Click row to highlight in chart'}
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-xs text-right border-collapse">
            <thead>
              <tr className="bg-slate-800 text-white font-bold border-b border-slate-700">
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">{isAr ? 'الشهر' : 'Month'}</th>
                <th className="py-2.5 px-3 text-center">{isAr ? 'الربع' : 'Qtr'}</th>
                <th className="py-2.5 px-3 text-center">{isAr ? 'حالة البيان' : 'Status'}</th>
                <th className="py-2.5 px-3 text-left font-mono">{isAr ? 'المبيعات الشهرية' : 'Monthly Sales'}</th>
                <th className="py-2.5 px-3 text-left font-mono">{isAr ? 'المستهدف الشهري' : 'Target'}</th>
                <th className="py-2.5 px-3 text-left font-mono text-emerald-400">{isAr ? 'التراكمي الفعلي/المتوقع' : 'Cum Actual'}</th>
                <th className="py-2.5 px-3 text-left font-mono text-slate-300">{isAr ? 'التراكمي المطلوب' : 'Cum Target'}</th>
                <th className="py-2.5 px-3 text-center">{isAr ? 'نسبة الإنجاز التراكمي' : 'Cum %'}</th>
                <th className="py-2.5 px-3 text-center">{isAr ? 'المعامل الموسمي' : 'Seasonality'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {cumulativeData.map((m, idx) => {
                const isSelected = activeMonth.monthIndex === m.monthIndex;

                return (
                  <tr
                    key={m.monthIndex}
                    onClick={() => setSelectedMonthIndex(m.monthIndex)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-purple-100/70 font-bold'
                        : m.isHistorical
                        ? 'hover:bg-emerald-50/30'
                        : 'bg-purple-50/20 hover:bg-purple-50/50'
                    }`}
                  >
                    <td className="py-2 px-3 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                    <td className="py-2 px-3 font-bold text-slate-900">
                      {isAr ? m.monthNameAr : m.monthNameEn} 2026
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 text-slate-700 font-bold font-mono">
                        {m.quarter}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          m.isHistorical
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {m.isHistorical ? (isAr ? 'محقق فعلياً' : 'Actual') : (isAr ? 'توقع مستقبلي' : 'Forecast')}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-left font-mono font-bold text-slate-900">
                      {formatCurrencyNumber(m.selectedMonthlyValue, currency)}
                    </td>
                    <td className="py-2 px-3 text-left font-mono text-slate-500">
                      {formatCurrencyNumber(m.target, currency)}
                    </td>
                    <td className="py-2 px-3 text-left font-mono font-black text-emerald-800">
                      {formatCurrencyNumber(m.cumulativeActualOrProjected, currency)}
                    </td>
                    <td className="py-2 px-3 text-left font-mono text-slate-600">
                      {formatCurrencyNumber(m.cumulativeTarget, currency)}
                    </td>
                    <td className="py-2 px-3 text-center font-mono">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-extrabold ${
                          m.cumulativeRate >= 100
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {m.cumulativeRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center font-mono text-slate-500 text-[11px]">
                      {EGYPT_RETAIL_SEASONAL_FACTORS[m.monthIndex]}x
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Strategic Directive Notes for Branch Manager */}
      <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 text-xs space-y-2">
        <h5 className="font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-700" />
          <span>{isAr ? 'التوجيهات التنفيذية للوصول للأهداف السنوية لفرع كونكورد بلازا (هاني حنا):' : 'Executive Directives for Year-End Target Achievement:'}</span>
        </h5>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-600 leading-relaxed">
          <div className="p-3 bg-white rounded-xl border border-slate-200">
            <strong className="text-slate-900 font-bold block mb-1">
              {isAr ? '1. الزخم الموسمي للربع الأخير (Q4):' : '1. Q4 Seasonal Momentum:'}
            </strong>
            <p>
              {isAr
                ? 'يستحوذ الربع الرابع تاريخياً على أكثر من 30% من إجمالي مبيعات العام بفضل موسم الجمعة البيضاء وعروض رأس السنة. ينصح بتأمين مخزون إضافي من هواتف الفلاج شيب (سلسلة سامسونج S والآيفون) لتلبية الطلب المرتفع دون نفاد للمخزون.'
                : 'Q4 captures over 30% of annual sales due to White Friday and holiday spending. Ensure buffer stock of flagship phones.'}
            </p>
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-200">
            <strong className="text-slate-900 font-bold block mb-1">
              {isAr ? '2. تعظيم عقود تقسيط أمان والإكسسوارات:' : '2. Aman Financing & Attach Multiplier:'}
            </strong>
            <p>
              {isAr
                ? 'تعتبر عقود التقسيط بدون فوائد عبر أمان المحرك الرئيسي لرفع متوسط الفاتورة بنسبة 40%، وتتيح للمستشارين (أحمد ربيع، عمرو عبد الحليم، طارق محمود) كسر الشرائح العليا للحوافز (110% و 120%+).'
                : 'Aman 0% installment promotions lift average order value by 40% and unlock champion incentive tiers for sales advisors.'}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
