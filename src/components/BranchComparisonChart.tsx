import React, { useState } from 'react';
import { BranchPerformance, Currency, Language } from '../types/sales';
import { formatCurrencyNumber, formatPercent } from '../utils/calculations';
import { translations } from '../utils/i18n';
import { BarChart3, ArrowUpDown, CheckCircle, AlertTriangle } from 'lucide-react';

interface BranchComparisonChartProps {
  branches: BranchPerformance[];
  currency: Currency;
  selectedBranch: string;
  onSelectBranch: (branch: string) => void;
  language: Language;
}

export const BranchComparisonChart: React.FC<BranchComparisonChartProps> = ({
  branches,
  currency,
  selectedBranch,
  onSelectBranch,
  language,
}) => {
  const t = translations[language];
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'actual' | 'rate' | 'target'>('actual');

  if (branches.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
        {language === 'ar' ? 'لا توجد بيانات فروع لعرض الرسم البياني.' : 'No branch data available to display chart.'}
      </div>
    );
  }

  // Sort branches according to selection
  const sortedBranches = [...branches].sort((a, b) => {
    if (sortBy === 'rate') return b.achievementRate - a.achievementRate;
    if (sortBy === 'target') return b.totalTarget - a.totalTarget;
    return b.totalActual - a.totalActual;
  });

  const maxVal = Math.max(
    ...sortedBranches.flatMap((b) => [b.totalTarget, b.totalActual]),
    1
  );

  return (
    <div id="branches-chart" className="bg-white rounded-xl border border-slate-200 p-6">
      {/* Chart Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900">
              {t.branchComparisonTitle}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {t.branchComparisonDesc}
          </p>
        </div>

        {/* Controls and Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs">
          {/* Legend */}
          <div className="flex items-center gap-4 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-slate-400 inline-block" />
              <span className="text-slate-700 font-medium">{t.targetLegend}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-emerald-500 inline-block" />
              <span className="text-slate-700 font-medium">≥ 100%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-rose-500 inline-block" />
              <span className="text-slate-700 font-medium">&lt; 100%</span>
            </div>
          </div>

          {/* Sort selector */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            <span className="text-slate-500 text-[11px] px-1.5 flex items-center gap-1">
              <ArrowUpDown className="w-3 h-3" />
              {t.sortBy}:
            </span>
            <button
              onClick={() => setSortBy('actual')}
              className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                sortBy === 'actual' ? 'bg-white text-slate-900 font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.sortActual}
            </button>
            <button
              onClick={() => setSortBy('rate')}
              className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                sortBy === 'rate' ? 'bg-white text-slate-900 font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.sortRate}
            </button>
            <button
              onClick={() => setSortBy('target')}
              className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                sortBy === 'target' ? 'bg-white text-slate-900 font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.sortTarget}
            </button>
          </div>
        </div>
      </div>

      {/* Bar Chart Visualization */}
      <div className="mt-6 space-y-5">
        {sortedBranches.map((item, index) => {
          const isSelected = selectedBranch === item.branch;
          const targetPct = (item.totalTarget / maxVal) * 100;
          const actualPct = (item.totalActual / maxVal) * 100;
          const isOver = item.totalActual >= item.totalTarget;

          return (
            <div
              key={item.branch}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={() => onSelectBranch(isSelected ? '' : item.branch)}
              className={`group p-4 rounded-xl transition-all cursor-pointer border ${
                isSelected
                  ? 'border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500/30'
                  : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50/60'
              }`}
            >
              {/* Branch Meta Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">{item.branch}</span>
                  {isSelected && (
                    <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                      {language === 'ar' ? 'محدد للتصفية' : 'Selected filter'}
                    </span>
                  )}
                  <span className="text-slate-400 text-xs" aria-hidden="true">·</span>
                  <span className="text-xs text-slate-500">{item.employeeCount} {t.salesReps}</span>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1.5 font-medium">
                    {isOver ? (
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        {t.surplus}: +{formatCurrencyNumber(item.difference, currency, true, language)}
                      </span>
                    ) : (
                      <span className="text-rose-700 font-semibold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                        {t.deficit}: {formatCurrencyNumber(item.difference, currency, true, language)}
                      </span>
                    )}
                  </div>

                  <span
                    className={`font-mono tabular-nums font-bold px-2 py-0.5 rounded-md text-xs ${
                      isOver
                        ? 'bg-emerald-100 text-emerald-800'
                        : item.achievementRate >= 85
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {formatPercent(item.achievementRate)}
                  </span>
                </div>
              </div>

              {/* Dual Bar Comparison */}
              <div className="space-y-2">
                {/* 1. Target Bar */}
                <div className="flex items-center gap-3 text-xs">
                  <span className="w-16 text-slate-500 text-[11px] shrink-0">{t.targetLegend}:</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden relative">
                    <div
                      className="h-full bg-slate-400 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(targetPct, 100)}%` }}
                    />
                  </div>
                  <span className="w-32 text-left font-mono tabular-nums font-medium text-slate-600 shrink-0 text-xs">
                    {formatCurrencyNumber(item.totalTarget, currency, true, language)}
                  </span>
                </div>

                {/* 2. Actual Sales Bar */}
                <div className="flex items-center gap-3 text-xs">
                  <span className="w-16 text-slate-700 font-medium text-[11px] shrink-0">{t.actualLegend}:</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden relative">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isOver
                          ? 'bg-emerald-500'
                          : item.achievementRate >= 85
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${Math.min(actualPct, 100)}%` }}
                    />
                  </div>
                  <span
                    className={`w-32 text-left font-mono tabular-nums font-bold shrink-0 text-xs ${
                      isOver ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {formatCurrencyNumber(item.totalActual, currency, true, language)}
                  </span>
                </div>
              </div>

              {/* Hover / Detail Subtext */}
              {item.topEmployee && (
                <div className="mt-2.5 pt-2 border-t border-slate-100/80 flex items-center justify-between text-[11px] text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <span>{t.starPerformer}:</span>
                    <strong className="text-slate-700 font-semibold">{item.topEmployee.name}</strong>
                    <span>({formatCurrencyNumber(item.topEmployee.actual, currency, true, language)})</span>
                  </div>
                  <span className="text-slate-400 font-mono tabular-nums">
                    {item.achievedCount} {t.outOf} {item.employeeCount} {t.targetAchieved}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
