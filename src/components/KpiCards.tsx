import React from 'react';
import { TrendingUp, Target, Users, Award, CheckCircle2, AlertCircle } from 'lucide-react';
import { OverallStats, Currency, Language } from '../types/sales';
import { formatCurrencyNumber, formatPercent } from '../utils/calculations';
import { translations } from '../utils/i18n';

interface KpiCardsProps {
  stats: OverallStats;
  currency: Currency;
  language: Language;
}

export const KpiCards: React.FC<KpiCardsProps> = ({ stats, currency, language }) => {
  const t = translations[language];
  const isSurplus = stats.difference >= 0;

  return (
    <section id="overview" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Actual Sales */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 transition-shadow hover:shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">{t.kpiActualSales}</span>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-3">
          <div className="text-2xl font-bold text-slate-900 tracking-tight font-mono tabular-nums">
            {formatCurrencyNumber(stats.totalActual, currency, true, language)}
          </div>

          <div className="mt-2 flex items-center gap-1.5 text-xs">
            {isSurplus ? (
              <span className="text-emerald-700 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {t.surplus}: +{formatCurrencyNumber(stats.difference, currency, true, language)}
              </span>
            ) : (
              <span className="text-rose-700 font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {t.deficit}: {formatCurrencyNumber(stats.difference, currency, true, language)}
              </span>
            )}
            <span className="text-slate-400" aria-hidden="true">·</span>
            <span className="text-slate-500">{t.vsTarget}</span>
          </div>
        </div>
      </div>

      {/* 2. Target Amount */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 transition-shadow hover:shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">{t.kpiTargetSales}</span>
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Target className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-3">
          <div className="text-2xl font-bold text-slate-900 tracking-tight font-mono tabular-nums">
            {formatCurrencyNumber(stats.totalTarget, currency, true, language)}
          </div>

          <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
            <span>{stats.totalBranches} {t.branchesCount}</span>
            <span aria-hidden="true">·</span>
            <span>{stats.totalEmployees} {t.salesReps}</span>
          </div>
        </div>
      </div>

      {/* 3. Overall Achievement Rate */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 transition-shadow hover:shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">{t.kpiOverallRate}</span>
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              stats.achievementRate >= 100
                ? 'bg-emerald-50 text-emerald-600'
                : stats.achievementRate >= 85
                ? 'bg-amber-50 text-amber-600'
                : 'bg-rose-50 text-rose-600'
            }`}
          >
            <Award className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 tracking-tight font-mono tabular-nums">
              {formatPercent(stats.achievementRate)}
            </span>
            <span
              className={`text-xs font-semibold ${
                stats.achievementRate >= 100
                  ? 'text-emerald-700'
                  : stats.achievementRate >= 85
                  ? 'text-amber-700'
                  : 'text-rose-700'
              }`}
            >
              {stats.achievementRate >= 100 ? t.targetAchieved : t.underTarget}
            </span>
          </div>

          {/* Clean progress bar */}
          <div className="mt-2.5 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                stats.achievementRate >= 100
                  ? 'bg-emerald-600'
                  : stats.achievementRate >= 85
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
              style={{ width: `${Math.min(stats.achievementRate, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 4. Achiever Employees Count */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 transition-shadow hover:shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">{t.kpiAchievers}</span>
          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-3">
          <div className="text-2xl font-bold text-slate-900 tracking-tight font-mono tabular-nums">
            {stats.achievedEmployeesCount}{' '}
            <span className="text-sm font-normal text-slate-500">{t.outOf} {stats.totalEmployees}</span>
          </div>

          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-600">
            <span className="text-emerald-700 font-semibold font-mono tabular-nums">
              {stats.achievedEmployeesCount} {t.achievedCountLabel}
            </span>
            <span aria-hidden="true">·</span>
            <span className="text-rose-600 font-semibold font-mono tabular-nums">
              {stats.unachievedEmployeesCount} {t.unachievedCountLabel}
            </span>
            <span aria-hidden="true">·</span>
            <span className="text-slate-400 font-mono tabular-nums">
              ({formatPercent(stats.achievementPercentageEmployees)})
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
