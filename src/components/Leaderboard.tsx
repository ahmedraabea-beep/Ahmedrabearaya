import React from 'react';
import { SalesRecord, Currency, Language } from '../types/sales';
import { formatCurrencyNumber, formatPercent } from '../utils/calculations';
import { translations } from '../utils/i18n';
import { Trophy, ChevronLeft, ChevronRight } from 'lucide-react';

interface LeaderboardProps {
  records: SalesRecord[];
  currency: Currency;
  onSelectEmployee: (name: string) => void;
  language: Language;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  records,
  currency,
  onSelectEmployee,
  language,
}) => {
  const t = translations[language];

  // Get top achievers by achievement rate
  const topAchievers = [...records]
    .filter((r) => r.isAchieved)
    .sort((a, b) => b.achievementRate - a.achievementRate)
    .slice(0, 4);

  if (topAchievers.length === 0) return null;

  return (
    <section id="leaderboard" className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center">
            <Trophy className="w-4 h-4" />
          </div>
          <h2 className="text-base font-bold text-slate-900">
            {t.leaderboardTitle}
          </h2>
        </div>
        <span className="text-xs text-slate-500">{t.leaderboardSubtitle}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {topAchievers.map((emp, index) => {
          const rank = index + 1;
          const badgeColor =
            rank === 1
              ? 'bg-amber-100 text-amber-800 border-amber-300'
              : rank === 2
              ? 'bg-slate-100 text-slate-800 border-slate-300'
              : rank === 3
              ? 'bg-orange-100 text-orange-800 border-orange-300'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200';

          return (
            <div
              key={emp.id}
              onClick={() => onSelectEmployee(emp.employee)}
              className="group p-4 rounded-xl border border-slate-200 hover:border-emerald-400 hover:shadow-xs transition-all cursor-pointer bg-gradient-to-b from-white to-slate-50/50"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border ${badgeColor}`}
                  >
                    {rank === 1 ? <Trophy className="w-3.5 h-3.5" /> : rank}
                  </span>
                  <div>
                    <span className="font-bold text-slate-900 text-sm block">{emp.employee}</span>
                    {emp.employeeId && (
                      <span className="text-[10px] text-slate-400 font-mono tabular-nums">
                        ID: {emp.employeeId}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-xs font-mono tabular-nums font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                  {formatPercent(emp.achievementRate)}
                </span>
              </div>

              <div className="mt-3 text-xs text-slate-500">
                <span>{emp.branch}</span>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">{language === 'ar' ? 'المحقق:' : 'Actual:'}</span>
                <span className="font-mono tabular-nums font-bold text-slate-900">
                  {formatCurrencyNumber(emp.actual, currency, true, language)}
                </span>
              </div>

              <div className="mt-2 flex items-center justify-end text-[11px] text-emerald-700 group-hover:underline gap-1">
                <span>{t.viewInTable}</span>
                {language === 'ar' ? (
                  <ChevronLeft className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
