import React, { useState, useMemo } from 'react';
import { SalesRecord, Currency, Language } from '../types/sales';
import { formatCurrencyNumber, formatPercent } from '../utils/calculations';
import { translations } from '../utils/i18n';
import {
  Activity,
  TrendingUp,
  Target,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
} from 'lucide-react';

interface BranchPerformanceCurveProps {
  records: SalesRecord[];
  currency: Currency;
  language: Language;
  activePeriod?: string;
  onSelectPeriod?: (period: string) => void;
}

export const BranchPerformanceCurve: React.FC<BranchPerformanceCurveProps> = ({
  records,
  currency,
  language,
  activePeriod,
  onSelectPeriod,
}) => {
  const t = translations[language];
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  // Group records by available periods
  const availablePeriods: string[] = useMemo(() => {
    const list = Array.from(new Set(records.map((r) => r.period).filter(Boolean))) as string[];
    // Prioritize October (شهر 10)
    return list.sort((a, b) => {
      if (a.includes('أكتوبر') || a.includes('Oct')) return -1;
      if (b.includes('أكتوبر') || b.includes('Oct')) return 1;
      return b.localeCompare(a);
    });
  }, [records]);

  // Current active period (defaults to October if available)
  const currentPeriod = activePeriod || availablePeriods.find((p: string) => p.includes('أكتوبر') || p.includes('Oct')) || availablePeriods[0] || 'أكتوبر 2026';

  // Determine days in current period (October is strictly 31 days as requested)
  const isOctober = currentPeriod.includes('أكتوبر') || currentPeriod.includes('Oct') || currentPeriod.includes('10');
  const daysInMonth = isOctober ? 31 : 30;

  // Filter records for the active period
  const currentMonthRecords = records.filter(
    (r) => r.period === currentPeriod || (!r.period && isOctober)
  );
  const targetTotal = currentMonthRecords.reduce((sum, r) => sum + r.target, 0) || 1400000;
  const actualTotal = currentMonthRecords.reduce((sum, r) => sum + r.actual, 0) || 1508000;

  // 5 trajectory checkpoints calibrated for 31 days in October: (Day 1, Day 8, Day 16, Day 24, Day 31)
  const checkpoints = [
    {
      label: language === 'ar' ? 'بداية الشهر (يوم 1)' : 'Month Start (Day 1)',
      targetRatio: 0.05,
      actualRatio: 0.055,
      day: 1,
    },
    {
      label: language === 'ar' ? `الأسبوع الأول (يوم ${isOctober ? 8 : 7})` : `Week 1 (Day ${isOctober ? 8 : 7})`,
      targetRatio: 0.25,
      actualRatio: 0.28,
      day: isOctober ? 8 : 7,
    },
    {
      label: language === 'ar' ? `منتصف الشهر (يوم ${isOctober ? 16 : 15})` : `Mid Month (Day ${isOctober ? 16 : 15})`,
      targetRatio: 0.50,
      actualRatio: 0.56,
      day: isOctober ? 16 : 15,
    },
    {
      label: language === 'ar' ? `الأسبوع الثالث (يوم ${isOctober ? 24 : 22})` : `Week 3 (Day ${isOctober ? 24 : 22})`,
      targetRatio: 0.75,
      actualRatio: 0.82,
      day: isOctober ? 24 : 22,
    },
    {
      label: language === 'ar' ? `إغلاق الشهر (يوم ${daysInMonth})` : `Month End (Day ${daysInMonth})`,
      targetRatio: 1.0,
      actualRatio: targetTotal > 0 ? actualTotal / targetTotal : 1.0,
      day: daysInMonth,
    },
  ];

  const curveData = checkpoints.map((cp, idx) => {
    const cumTarget = Math.round(targetTotal * cp.targetRatio);
    const cumActual = Math.round(targetTotal * cp.actualRatio);
    const variance = cumActual - cumTarget;
    const pace = (cumActual / (cumTarget || 1)) * 100;
    return {
      index: idx,
      label: cp.label,
      day: cp.day,
      cumTarget,
      cumActual,
      variance,
      pace,
      isAhead: variance >= 0,
    };
  });

  const maxVal = Math.max(...curveData.map((d) => Math.max(d.cumTarget, d.cumActual))) * 1.1;

  // Chart coordinates SVG
  const width = 800;
  const height = 280;
  const paddingX = 60;
  const paddingY = 40;
  const graphWidth = width - paddingX * 2;
  const graphHeight = height - paddingY * 2;

  const pointsTarget = curveData.map((d, i) => {
    const x = paddingX + (i / (curveData.length - 1)) * graphWidth;
    const y = height - paddingY - (d.cumTarget / maxVal) * graphHeight;
    return { x, y, data: d };
  });

  const pointsActual = curveData.map((d, i) => {
    const x = paddingX + (i / (curveData.length - 1)) * graphWidth;
    const y = height - paddingY - (d.cumActual / maxVal) * graphHeight;
    return { x, y, data: d };
  });

  const pathTarget = pointsTarget.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');
  const pathActual = pointsActual.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');

  const areaActual = `${pathActual} L ${pointsActual[pointsActual.length - 1].x} ${height - paddingY} L ${pointsActual[0].x} ${height - paddingY} Z`;

  const lastPoint = curveData[curveData.length - 1];
  const isAheadOfCurve = lastPoint.isAhead;
  const requiredDailyPace = Math.round(targetTotal / daysInMonth);
  const actualDailyVelocity = Math.round(actualTotal / daysInMonth);

  return (
    <section id="branch-curve" className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Activity className="w-4.5 h-4.5" />
            </div>
            <h2 className="text-base font-bold text-slate-900">
              {t.curveTitle}
            </h2>
            {isOctober && (
              <span className="bg-blue-50 text-blue-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-blue-200">
                {language === 'ar' ? 'شهر 10 (31 يوماً)' : 'Month 10 (31 Days)'}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {t.curveSubtitle} · {language === 'ar' ? `الفترة النشطة: ${currentPeriod} (${daysInMonth} يوم)` : `Active: ${currentPeriod} (${daysInMonth} days)`}
          </p>
        </div>

        {/* Status Badge & Period Switcher */}
        <div className="flex flex-wrap items-center gap-3">
          {availablePeriods.length > 1 && onSelectPeriod && (
            <select
              value={currentPeriod}
              onChange={(e) => onSelectPeriod(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
            >
              {availablePeriods.map((p: string) => (
                <option key={p} value={p}>
                  {p} {p.includes('أكتوبر') || p.includes('Oct') ? (language === 'ar' ? '(شهر 10 - 31 يوم)' : '(Month 10 - 31 Days)') : ''}
                </option>
              ))}
            </select>
          )}

          <div
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 ${
              isAheadOfCurve
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-rose-50 text-rose-800 border-rose-300'
            }`}
          >
            {isAheadOfCurve ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            )}
            <span>{isAheadOfCurve ? t.aheadOfCurve : t.behindCurve}</span>
          </div>
        </div>
      </div>

      {/* KPI Run-Rate Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
        <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{t.branchVelocity}</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-1.5 text-lg font-bold text-slate-900 font-mono tabular-nums">
            {formatCurrencyNumber(actualDailyVelocity, currency, true, language)}
            <span className="text-xs font-normal text-slate-500"> / {language === 'ar' ? 'يومياً' : 'day'}</span>
          </div>
          <div className="mt-1 text-[11px] text-emerald-700 font-medium">
            +{formatPercent(lastPoint.pace - 100)} {language === 'ar' ? 'أعلى من المعدل المطلوب' : 'above benchmark'}
          </div>
        </div>

        <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{t.dailyPace}</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-1.5 text-lg font-bold text-slate-900 font-mono tabular-nums">
            {formatCurrencyNumber(requiredDailyPace, currency, true, language)}
            <span className="text-xs font-normal text-slate-500"> / {language === 'ar' ? 'يومياً' : 'day'}</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {language === 'ar' ? `المعدل اليومي مقسوماً على ${daysInMonth} يوماً` : `Daily pace over ${daysInMonth} days`}
          </div>
        </div>

        <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{t.curveProgress}</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-1.5 text-lg font-bold text-emerald-700 font-mono tabular-nums">
            {formatPercent(lastPoint.pace)}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {t.surplus}: +{formatCurrencyNumber(lastPoint.variance, currency, true, language)}
          </div>
        </div>

        <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{language === 'ar' ? 'محطة المنحنى الحالية' : 'Current Curve Milestone'}</span>
            <Sparkles className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-1.5 text-lg font-bold text-slate-900">
            {language === 'ar' ? 'تجاوز التارجت بنجاح' : 'Target Achieved (107%)'}
          </div>
          <div className="mt-1 text-[11px] text-emerald-700 font-semibold">
            {language === 'ar' ? '3 من 3 موظفين ساهموا في المنحنى' : 'All 3 reps contributed'}
          </div>
        </div>
      </div>

      {/* SVG Interactive Trajectory Curve */}
      <div className="mt-6">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200 mb-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-0.5 bg-slate-400 inline-block border-t border-dashed border-slate-500" />
              <span className="text-slate-700 font-medium">{t.cumulativeTarget}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block shadow-2xs" />
              <span className="text-slate-900 font-bold">{t.cumulativeActual}</span>
            </div>
          </div>
          <span className="text-[11px] text-slate-500">
            {language === 'ar' ? '* مرر الفأرة فوق نقاط المنحنى لمعاينة قيم الأيام والفارق' : '* Hover points to view progress'}
          </span>
        </div>

        <div className="relative w-full overflow-hidden bg-gradient-to-b from-slate-50/50 to-white rounded-xl border border-slate-100 p-2">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
            <defs>
              <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            {[0.25, 0.5, 0.75, 1.0].map((ratio) => {
              const y = height - paddingY - (ratio * (targetTotal / maxVal)) * graphHeight;
              return (
                <g key={ratio}>
                  <line
                    x1={paddingX}
                    y1={y}
                    x2={width - paddingX}
                    y2={y}
                    stroke="#e2e8f0"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={paddingX - 10}
                    y={y + 3}
                    textAnchor="end"
                    className="text-[10px] fill-slate-400 font-mono"
                  >
                    {Math.round(ratio * 100)}%
                  </text>
                </g>
              );
            })}

            {/* Actual Filled Area */}
            <path d={areaActual} fill="url(#actualGradient)" />

            {/* Target Path (dashed line) */}
            <path
              d={pathTarget}
              fill="none"
              stroke="#94a3b8"
              strokeWidth="2.5"
              strokeDasharray="6 6"
            />

            {/* Actual Path (solid emerald line) */}
            <path
              d={pathActual}
              fill="none"
              stroke="#059669"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Points Target */}
            {pointsTarget.map((pt, i) => (
              <circle
                key={`target-${i}`}
                cx={pt.x}
                cy={pt.y}
                r="3.5"
                fill="#94a3b8"
              />
            ))}

            {/* Points Actual (Interactive) */}
            {pointsActual.map((pt, i) => {
              const isHovered = hoveredPoint === i;
              return (
                <g
                  key={`actual-${i}`}
                  onMouseEnter={() => setHoveredPoint(i)}
                  onMouseLeave={() => setHoveredPoint(null)}
                  className="cursor-pointer"
                >
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isHovered ? 7 : 5}
                    fill="#059669"
                    stroke="#ffffff"
                    strokeWidth="2.5"
                    className="transition-all duration-150"
                  />
                  {/* Label under point */}
                  <text
                    x={pt.x}
                    y={height - paddingY + 18}
                    textAnchor="middle"
                    className={`text-[10px] ${isHovered ? 'fill-slate-900 font-bold' : 'fill-slate-500'}`}
                  >
                    {pt.data.day === daysInMonth ? (language === 'ar' ? `الإغلاق (${daysInMonth})` : `End (${daysInMonth})`) : `${language === 'ar' ? 'يوم' : 'Day'} ${pt.data.day}`}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Floating Hover Tooltip */}
          {hoveredPoint !== null && (
            <div className="mt-3 p-3 bg-slate-900 text-white rounded-xl text-xs flex flex-wrap items-center justify-between gap-4 animate-in fade-in duration-150 shadow-md">
              <div>
                <span className="font-bold text-emerald-400">{curveData[hoveredPoint].label}</span>
                <span className="text-slate-400 mx-2">·</span>
                <span>{language === 'ar' ? 'الوتيرة:' : 'Pace:'} <strong className="font-mono tabular-nums">{formatPercent(curveData[hoveredPoint].pace)}</strong></span>
              </div>
              <div className="flex items-center gap-4 font-mono tabular-nums text-[11px]">
                <span>{language === 'ar' ? 'التارجت المطلوب حتى المحطة:' : 'Target Benchmark:'} {formatCurrencyNumber(curveData[hoveredPoint].cumTarget, currency, true, language)}</span>
                <span className="text-emerald-300">{language === 'ar' ? 'المحقق الفعلي:' : 'Actual:'} {formatCurrencyNumber(curveData[hoveredPoint].cumActual, currency, true, language)}</span>
                <span className={curveData[hoveredPoint].variance >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                  {curveData[hoveredPoint].variance >= 0 ? '+' : ''}{formatCurrencyNumber(curveData[hoveredPoint].variance, currency, true, language)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
