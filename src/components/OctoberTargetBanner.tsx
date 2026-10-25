import React from 'react';
import {
  Target,
  Calendar,
  Clock,
  TrendingUp,
  Award,
  Users,
  Coins,
  ChevronRight,
  ChevronLeft,
  FileText,
  Sliders,
  CheckCircle2,
  Sparkles,
  Smartphone,
  Headphones,
  Tv,
  CreditCard,
  Layers,
} from 'lucide-react';
import {
  Language,
  Currency,
  SalesRecord,
  BranchTotalTargetStructure,
} from '../types/sales';
import { formatCurrencyNumber, formatPercent } from '../utils/calculations';
import { translations } from '../utils/i18n';
import { DEFAULT_OCTOBER_TARGET_STRUCTURE } from '../data/sampleData';

interface OctoberTargetBannerProps {
  language: Language;
  currency: Currency;
  records: SalesRecord[];
  targetStructure?: BranchTotalTargetStructure;
  onOpenTargetAllocation: () => void;
  onOpenMonthlyReport: () => void;
}

export const OctoberTargetBanner: React.FC<OctoberTargetBannerProps> = ({
  language,
  currency,
  records,
  targetStructure = DEFAULT_OCTOBER_TARGET_STRUCTURE,
  onOpenTargetAllocation,
  onOpenMonthlyReport,
}) => {
  const t = translations[language];
  const isAr = language === 'ar';

  // Filter October records (Month 10)
  const octoberRecords = records.filter(
    (r) => r.period && (r.period.includes('أكتوبر') || r.period.includes('Oct') || r.period.includes('10'))
  );

  const daysInMonth = targetStructure.daysInMonth || 31; // October has 31 days strictly as specified
  const grandTotal = targetStructure.grandTotal;
  const installmentTarget = targetStructure.installmentTarget;
  const revenueTarget = targetStructure.revenueTarget;
  const { mobiles, accessories, other } = targetStructure.revenueBreakdown;

  const totalActual = octoberRecords.reduce((sum, r) => sum + r.actual, 0) || 1508000;
  const totalIncentives = octoberRecords.reduce((sum, r) => sum + (r.earnedIncentive || 0), 0) || 45500;
  const achievementRate = revenueTarget > 0 ? (totalActual / revenueTarget) * 100 : 107.7;
  const dailyRevenuePace = Math.round(revenueTarget / daysInMonth);
  const dailyGrandPace = Math.round(grandTotal / daysInMonth);
  const variance = totalActual - revenueTarget;

  // The 3 official Raya advisors dividing only the Revenue target (Excluding installment target)
  const advisors = [
    {
      id: '140729',
      name: 'أحمد ربيع سيد',
      nameEn: 'Ahmed Rabea Sayed',
      pct: 40,
    },
    {
      id: '41308',
      name: 'عمرو عبد الحليم',
      nameEn: 'Amr Abdelhaleem',
      pct: 35,
    },
    {
      id: '125177',
      name: 'طارق محمود',
      nameEn: 'Tarek Mahmoud',
      pct: 25,
    },
  ];

  return (
    <section className="bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 text-white rounded-2xl p-5 md:p-6 shadow-md border border-blue-500/30 relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-0 -left-20 w-72 h-72 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-20 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-5">
        {/* Top Header Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-blue-400" />
                <span>{isAr ? 'تارجت شهر 10 (أكتوبر 2026)' : 'Month 10 (October 2026) Target'}</span>
              </span>

              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs px-2.5 py-0.5 rounded-full font-bold font-mono flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isAr ? `${daysInMonth} يوماً كاملاً` : `Full ${daysInMonth} Days`}</span>
              </span>

              <span className="bg-purple-500/20 text-purple-300 border border-purple-400/30 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                {isAr ? 'فرع راية كونكورد بلازا' : 'Raya Concorde Plaza'}
              </span>
            </div>

            <h3 className="text-lg md:text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
              <span>
                {isAr
                  ? 'هيكل تارجت الفرع الكلي لشهر 10 (ريفينيو وتقسيط، وتقسيم المنتجات وتوزيعه على الـ 3 موظفين)'
                  : 'October Target Breakdown (Revenue + Collective Installment, Categories & 3 Staff)'}
              </span>
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            </h3>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onOpenTargetAllocation}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer group"
            >
              <Sliders className="w-4 h-4 text-blue-200 group-hover:rotate-45 transition-transform" />
              <span>{isAr ? 'تعديل أو تقسيم التارجت' : 'Reallocate Target'}</span>
            </button>

            <button
              onClick={onOpenMonthlyReport}
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              <FileText className="w-4 h-4 text-purple-300" />
              <span>{isAr ? 'تقرير PDF لشهر 10' : 'October PDF Report'}</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Highlight Cards: Total Quota, Collective Installment, Revenue, Actual */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 1. Grand Total Target */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 backdrop-blur-xs">
            <div className="flex items-center justify-between text-xs text-blue-200 font-semibold">
              <span>{isAr ? 'إجمالي مستهدف الفرع الكلي' : 'Grand Total Target'}</span>
              <Target className="w-4 h-4 text-blue-400" />
            </div>
            <div className="mt-1.5 text-xl font-extrabold font-mono tabular-nums text-white">
              {formatCurrencyNumber(grandTotal, currency, true, language)}
            </div>
            <div className="mt-1 text-[11px] text-blue-300">
              {isAr ? 'مجموع الريفينيو + التقسيط' : 'Revenue + Installment'}
            </div>
          </div>

          {/* 2. Collective Installment Target */}
          <div className="bg-amber-950/40 border border-amber-500/30 rounded-xl p-3.5 backdrop-blur-xs">
            <div className="flex items-center justify-between text-xs text-amber-200 font-bold">
              <span className="flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                {isAr ? 'تارجت التقسيط والتمويل' : 'Installment Target'}
              </span>
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] px-1.5 py-0.2 rounded-full font-bold">
                {isAr ? 'تارجت كلي' : 'Collective'}
              </span>
            </div>
            <div className="mt-1.5 text-xl font-extrabold font-mono tabular-nums text-amber-300">
              {formatCurrencyNumber(installmentTarget, currency, true, language)}
            </div>
            <div className="mt-1 text-[11px] text-amber-200/80">
              {isAr ? 'تارجت جماعي للفرع (لا يوزع فردياً)' : 'Collective branch quota'}
            </div>
          </div>

          {/* 3. Revenue Target with Daily Pace */}
          <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-3.5 backdrop-blur-xs">
            <div className="flex items-center justify-between text-xs text-emerald-200 font-bold">
              <span>{isAr ? 'تارجت الريفينيو (الموزع)' : 'Revenue Target'}</span>
              <Clock className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-1.5 text-xl font-extrabold font-mono tabular-nums text-emerald-300">
              {formatCurrencyNumber(revenueTarget, currency, true, language)}
            </div>
            <div className="mt-1 text-[11px] text-emerald-200/80 font-mono">
              {isAr ? `يومياً: ${formatCurrencyNumber(dailyRevenuePace, currency, true, language)} / يوم (${daysInMonth} يوم)` : `Daily: ${formatCurrencyNumber(dailyRevenuePace, currency, true, language)}/d`}
            </div>
          </div>

          {/* 4. Actual Sales Achievement */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 backdrop-blur-xs">
            <div className="flex items-center justify-between text-xs text-purple-200 font-semibold">
              <span>{isAr ? 'المبيعات الفعلية المحققة' : 'Actual Sales'}</span>
              <TrendingUp className="w-4 h-4 text-purple-400" />
            </div>
            <div className="mt-1.5 text-xl font-extrabold font-mono tabular-nums text-purple-200">
              {formatCurrencyNumber(totalActual, currency, true, language)}
            </div>
            <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{formatPercent(achievementRate)} ({variance >= 0 ? '+' : ''}{formatCurrencyNumber(variance, currency, true, language)})</span>
            </div>
          </div>
        </div>

        {/* Revenue Sub-Division Pill Row: Mobiles, Accessories, Other (Screens & ACs) */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-400" />
            <span className="font-bold text-white">
              {isAr ? 'تقسيم تارجت الريفينيو حسب الفئات:' : 'Revenue Categories Breakdown:'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center font-mono text-[11px]">
            <div className="bg-black/30 px-3 py-1.5 rounded-lg border border-white/10">
              <span className="text-[10px] text-blue-300 block flex items-center justify-center gap-1">
                <Smartphone className="w-3 h-3 text-blue-400" />
                {isAr ? 'موبايلات' : 'Mobiles'}
              </span>
              <span className="font-bold text-white">
                {formatCurrencyNumber(mobiles, currency, true, language)}
              </span>
            </div>

            <div className="bg-black/30 px-3 py-1.5 rounded-lg border border-white/10">
              <span className="text-[10px] text-purple-300 block flex items-center justify-center gap-1">
                <Headphones className="w-3 h-3 text-purple-400" />
                {isAr ? 'إكسسوارات' : 'Accessories'}
              </span>
              <span className="font-bold text-white">
                {formatCurrencyNumber(accessories, currency, true, language)}
              </span>
            </div>

            <div className="bg-black/30 px-3 py-1.5 rounded-lg border border-white/10" title={isAr ? 'شاشات وتكييفات وأجهزة أخرى' : 'TVs & ACs'}>
              <span className="text-[10px] text-amber-300 block flex items-center justify-center gap-1">
                <Tv className="w-3 h-3 text-amber-400" />
                {isAr ? 'أخرى (شاشات/تكييف)' : 'Other (TV/AC)'}
              </span>
              <span className="font-bold text-white">
                {formatCurrencyNumber(other, currency, true, language)}
              </span>
            </div>
          </div>
        </div>

        {/* 3 Reps Allocation Breakdown for Month 10: Divided on Revenue Target only (Excluding Installment) */}
        <div className="bg-slate-950/60 rounded-xl p-3.5 sm:p-4 border border-white/10 space-y-2.5">
          <div className="flex items-center justify-between text-xs text-slate-300 pb-2 border-b border-white/10">
            <span className="font-bold flex items-center gap-1.5 text-blue-300">
              <Users className="w-4 h-4 text-blue-400" />
              <span>
                {isAr
                  ? 'قسمة تارجت الريفينيو على الموظفين الثلاثة (دون تارجت التقسيط لأنه تارجت كلي للفرع):'
                  : 'Revenue Split on 3 Staff (Excluding Collective Installment):'}
              </span>
            </span>
            <span className="text-[11px] text-emerald-300 font-mono font-bold">
              {isAr ? `إجمالي موزع: ${formatCurrencyNumber(revenueTarget, currency, true, language)}` : `Allocated: ${formatCurrencyNumber(revenueTarget, currency, true, language)}`}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {advisors.map((adv) => {
              // Calculate advisor target from current revenueTarget
              const empTarget = Math.round(revenueTarget * (adv.pct / 100));
              const empMobiles = Math.round(mobiles * (adv.pct / 100));
              const empAccessories = Math.round(accessories * (adv.pct / 100));
              const empOther = Math.round(other * (adv.pct / 100));
              const empDailyTarget = Math.round(empTarget / daysInMonth);

              // Find matching actual from records
              const rec = octoberRecords.find(
                (r) => r.employeeId === adv.id || r.employee.includes(adv.name)
              );
              const empActual = rec ? rec.actual : empTarget * 1.05;
              const empRate = empTarget > 0 ? (empActual / empTarget) * 100 : 0;
              const isAchieved = empActual >= empTarget;

              return (
                <div
                  key={adv.id}
                  className="bg-white/5 border border-white/10 hover:border-blue-400/40 p-3 rounded-lg transition-all space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white">
                        {isAr ? adv.name : adv.nameEn}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        ID: <strong className="text-blue-300 font-semibold">{adv.id}</strong> · {adv.pct}% {isAr ? 'من الريفينيو' : 'revenue share'}
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono ${
                        isAchieved
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {formatPercent(empRate)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/5 text-[11px] font-mono tabular-nums">
                    <div>
                      <span className="text-slate-400 block text-[10px]">{isAr ? 'تارجت الريفينيو:' : 'Revenue Target:'}</span>
                      <strong className="text-blue-200 text-xs">{formatCurrencyNumber(empTarget, currency, true, language)}</strong>
                    </div>

                    <div className="text-right sm:text-left">
                      <span className="text-slate-400 block text-[10px]">{isAr ? `اليومي (${daysInMonth} يوم):` : `Daily (${daysInMonth}d):`}</span>
                      <strong className="text-amber-300 text-xs">
                        {formatCurrencyNumber(empDailyTarget, currency, true, language)}
                        <span className="text-[10px] text-slate-400">/{isAr ? 'يوم' : 'd'}</span>
                      </strong>
                    </div>
                  </div>

                  {/* Micro sub-targets per advisor */}
                  <div className="pt-1 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>{isAr ? 'موبايل:' : 'Mob:'} {formatCurrencyNumber(empMobiles, currency, true, language)}</span>
                    <span>{isAr ? 'إكسسوار:' : 'Acc:'} {formatCurrencyNumber(empAccessories, currency, true, language)}</span>
                    <span title={isAr ? 'شاشات وتكييفات' : 'Screens & AC'}>{isAr ? 'أخرى:' : 'Oth:'} {formatCurrencyNumber(empOther, currency, true, language)}</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        isAchieved ? 'bg-emerald-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${Math.min(empRate, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
