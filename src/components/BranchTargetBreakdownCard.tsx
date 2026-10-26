import React from 'react';
import {
  Target,
  Smartphone,
  Headphones,
  Tv,
  CreditCard,
  TrendingUp,
  Percent,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Users,
} from 'lucide-react';
import {
  Language,
  Currency,
  BranchTotalTargetStructure,
  EmployeeTargetAllocation,
} from '../types/sales';
import { formatCurrencyNumber, formatPercent } from '../utils/calculations';

interface BranchTargetBreakdownCardProps {
  language: Language;
  currency: Currency;
  targetStructure?: BranchTotalTargetStructure | null;
  allocations: EmployeeTargetAllocation[];
  onOpenTargetModal: () => void;
}

export const BranchTargetBreakdownCard: React.FC<BranchTargetBreakdownCardProps> = ({
  language,
  currency,
  targetStructure,
  allocations: propAllocations,
  onOpenTargetModal,
}) => {
  const isAr = language === 'ar';

  if (!targetStructure || (!targetStructure.grandTotal && !targetStructure.revenueTarget)) {
    return (
      <div className="bg-white rounded-2xl border border-amber-300 p-8 text-center space-y-4 shadow-xs">
        <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
          <Target className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-black text-slate-900">
            {isAr ? 'لم يتم تحديد مستهدف لهذا الشهر بعد' : 'No target defined for this month'}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {isAr
              ? 'يجب تحديد هيكل تارجت الفرع (الريفينيو والتقسيط وتوزيع المنتجات) للبدء في توزيع الحصص.'
              : 'Please set the branch target structure to allocate staff quotas.'}
          </p>
        </div>
        <button
          onClick={onOpenTargetModal}
          className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
        >
          <Target className="w-4 h-4" />
          <span>{isAr ? 'حدد تارجت الشهر' : 'Set Month Target'}</span>
        </button>
      </div>
    );
  }

  const allocations = Array.isArray(propAllocations) && propAllocations.length > 0 ? propAllocations : [
    { employeeId: '140729', employeeName: 'أحمد ربيع سيد', percentage: 40, targetAmount: 560000 },
    { employeeId: '41308', employeeName: 'عمرو عبد الحليم', percentage: 35, targetAmount: 490000 },
    { employeeId: '125177', employeeName: 'طارق محمود', percentage: 25, targetAmount: 350000 },
  ];
  const {
    grandTotal,
    installmentTarget,
    revenueTarget,
    revenueBreakdown,
    daysInMonth,
    period,
  } = targetStructure;

  const mobilesPct = revenueTarget > 0 ? (revenueBreakdown.mobiles / revenueTarget) * 100 : 0;
  const accessoriesPct = revenueTarget > 0 ? (revenueBreakdown.accessories / revenueTarget) * 100 : 0;
  const otherPct = revenueTarget > 0 ? (revenueBreakdown.other / revenueTarget) * 100 : 0;

  return (
    <section className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden transition-all hover:shadow-md">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 shadow-inner">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-white">
                {isAr ? `هيكل تارجت الفرع الكلي (${period || 'الفترة المحددة'})` : `Total Branch Target Structure (${period || 'Selected Period'})`}
              </h2>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] px-2.5 py-0.5 rounded-full font-mono font-bold">
                {daysInMonth} {isAr ? 'يوماً' : 'days'}
              </span>
            </div>
            <p className="text-xs text-blue-200/90 mt-0.5">
              {isAr
                ? 'تقسيم التارجت إلى (ريفينيو + تقسيط كلي)، وتقسيم الريفينيو إلى (موبايلات، إكسسوارات، وأجهزة أخرى كالشاشات والتكييفات) وتوزيعه على الـ 3 موظفين'
                : 'Split into (Revenue + Collective Installment), sub-divided into Mobiles, Accessories, Other (TVs/ACs) & distributed to 3 staff'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <button
            onClick={onOpenTargetModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/30 text-white border border-white/20 text-xs font-bold transition-all cursor-pointer backdrop-blur-xs"
          >
            <Target className="w-4 h-4 text-emerald-400" />
            <span>{isAr ? 'تعديل وتخصيص التارجت' : 'Customize Targets'}</span>
          </button>
        </div>
      </div>

      {/* Main Breakdown Grid: Grand Total -> Installment (Collective) & Revenue */}
      <div className="p-4 sm:p-5 space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Card 1: Grand Total Target (Col 1-4) */}
          <div className="lg:col-span-4 bg-gradient-to-br from-slate-50 to-blue-50/50 rounded-xl p-4 border border-blue-200/70 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-600 mb-2 font-semibold">
                <span className="flex items-center gap-1.5 text-blue-900 font-bold">
                  <Target className="w-4 h-4 text-blue-600" />
                  {isAr ? 'إجمالي مستهدف الفرع الكلي الشامل' : 'Grand Total Branch Target'}
                </span>
                <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded-md font-mono">
                  {period}
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-blue-950 font-mono tabular-nums tracking-tight">
                {formatCurrencyNumber(grandTotal, currency, true, language)}
              </div>
              <div className="mt-1 text-xs text-slate-500 font-medium">
                {isAr ? 'مجموع (تارجت الريفينيو + تارجت التقسيط)' : 'Sum of (Revenue Target + Installment Target)'}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-blue-200/60 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-600">{isAr ? `المعدل اليومي الشامل (${daysInMonth} يوم):` : `Daily Overall Rate (${daysInMonth}d):`}</span>
              <span className="font-bold text-blue-700">
                {formatCurrencyNumber(Math.round(grandTotal / daysInMonth), currency, true, language)} / {isAr ? 'يوم' : 'day'}
              </span>
            </div>
          </div>

          {/* Card 2: Installment Target - Collective / Branch-wide (Col 5-7) */}
          <div className="lg:col-span-3 bg-gradient-to-br from-amber-50/70 to-orange-50/50 rounded-xl p-4 border border-amber-200/80 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-2 left-2 rtl:left-auto rtl:right-2">
              <span className="bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                <Users className="w-3 h-3 text-amber-600" />
                {isAr ? 'تارجت كلي للفرع' : 'Collective Branch Target'}
              </span>
            </div>

            <div className="mt-5">
              <div className="flex items-center gap-1.5 text-xs text-amber-900 font-bold mb-1">
                <CreditCard className="w-4 h-4 text-amber-600" />
                <span>{isAr ? 'تارجت التقسيط والتمويل' : 'Installment & Financing'}</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-amber-950 font-mono tabular-nums">
                {formatCurrencyNumber(installmentTarget, currency, true, language)}
              </div>
              <div className="mt-1 text-[11px] text-amber-800 font-medium leading-relaxed">
                {isAr
                  ? '🔒 تارجت جماعي للفرع بالكامل، لا يتم تقسيمه على الموظفين فردياً'
                  : 'Collective branch target, NOT divided individually among staff'}
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-amber-200/70 flex items-center justify-between text-[11px] font-mono">
              <span className="text-amber-800">{isAr ? 'المعدل اليومي للتقسيط:' : 'Daily Installment:'}</span>
              <span className="font-bold text-amber-900">
                {formatCurrencyNumber(Math.round(installmentTarget / daysInMonth), currency, true, language)} / {isAr ? 'يوم' : 'day'}
              </span>
            </div>
          </div>

          {/* Card 3: Revenue Target - Divided on Staff (Col 8-12) */}
          <div className="lg:col-span-5 bg-gradient-to-br from-emerald-50/70 to-teal-50/50 rounded-xl p-4 border border-emerald-200/80 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-emerald-900 font-bold mb-1">
                <span className="flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  {isAr ? 'تارجت الريفينيو (الموزع على الموظفين)' : 'Revenue Target (Allocated to Staff)'}
                </span>
                <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {isAr ? 'يُقسّم على 3 موظفين' : 'Divided on 3 Staff'}
                </span>
              </div>

              <div className="flex items-baseline gap-2">
                <div className="text-xl sm:text-2xl font-black text-emerald-950 font-mono tabular-nums">
                  {formatCurrencyNumber(revenueTarget, currency, true, language)}
                </div>
                <span className="text-xs text-emerald-700 font-semibold font-mono">
                  ({formatPercent((revenueTarget / grandTotal) * 100)} {isAr ? 'من الإجمالي' : 'of total'})
                </span>
              </div>

              <div className="mt-1 text-xs text-emerald-800 font-medium">
                {isAr ? `المستهدف اليومي للريفينيو: ${formatCurrencyNumber(Math.round(revenueTarget / daysInMonth), currency, true, language)} / يوم (${daysInMonth} يوماً كاملة)` : `Daily Revenue Pace: ${formatCurrencyNumber(Math.round(revenueTarget / daysInMonth), currency, true, language)}/day`}
              </div>
            </div>

            {/* Sub-division pills: Mobiles + Accessories + Other */}
            <div className="mt-3 pt-2.5 border-t border-emerald-200/80 grid grid-cols-3 gap-2 text-center">
              <div className="bg-white/80 p-2 rounded-lg border border-emerald-200/60 shadow-2xs">
                <span className="text-[10px] text-slate-500 block font-semibold flex items-center justify-center gap-1">
                  <Smartphone className="w-3 h-3 text-blue-600" />
                  {isAr ? 'موبايلات' : 'Mobiles'}
                </span>
                <span className="text-xs font-bold text-slate-900 font-mono block mt-0.5">
                  {formatCurrencyNumber(revenueBreakdown.mobiles, currency, true, language)}
                </span>
                <span className="text-[9px] text-slate-500 font-mono">
                  {formatPercent(mobilesPct)}
                </span>
              </div>

              <div className="bg-white/80 p-2 rounded-lg border border-emerald-200/60 shadow-2xs">
                <span className="text-[10px] text-slate-500 block font-semibold flex items-center justify-center gap-1">
                  <Headphones className="w-3 h-3 text-purple-600" />
                  {isAr ? 'إكسسوارات' : 'Accessories'}
                </span>
                <span className="text-xs font-bold text-slate-900 font-mono block mt-0.5">
                  {formatCurrencyNumber(revenueBreakdown.accessories, currency, true, language)}
                </span>
                <span className="text-[9px] text-slate-500 font-mono">
                  {formatPercent(accessoriesPct)}
                </span>
              </div>

              <div className="bg-white/80 p-2 rounded-lg border border-emerald-200/60 shadow-2xs" title={isAr ? 'شاشات وتكييفات وأجهزة أخرى' : 'Screens, ACs & Other'}>
                <span className="text-[10px] text-slate-500 block font-semibold flex items-center justify-center gap-1">
                  <Tv className="w-3 h-3 text-amber-600" />
                  {isAr ? 'أخرى (شاشات/تكييف)' : 'Other (TV/AC)'}
                </span>
                <span className="text-xs font-bold text-slate-900 font-mono block mt-0.5">
                  {formatCurrencyNumber(revenueBreakdown.other, currency, true, language)}
                </span>
                <span className="text-[9px] text-slate-500 font-mono">
                  {formatPercent(otherPct)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Division of Revenue Target among the 3 Employees */}
        <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">
                  {isAr
                    ? 'قسمة تارجت الريفينيو الإجمالي على الموظفين الثلاثة (دون تارجت التقسيط الكلي)'
                    : 'Revenue Target Split Among the 3 Staff (Excluding Collective Installment)'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {isAr
                    ? `إجمالي رفينيو موزع: ${formatCurrencyNumber(revenueTarget, currency, true, language)} مقسم بنسب معتمدة مع بيان حصة كل مستشار من الموبايلات والإكسسوار والشاشات/التكييفات`
                    : `Total allocated revenue: ${formatCurrencyNumber(revenueTarget, currency, true, language)}`}
                </p>
              </div>
            </div>

            <div className="text-right sm:text-left text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              {isAr ? `الشهر: شهر 10 (${daysInMonth} يوماً)` : `Month 10 (${daysInMonth} Days)`}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {allocations.map((staff, idx) => {
              const staffDaily = Math.round(staff.targetAmount / daysInMonth);
              const staffMobiles = Math.round(revenueBreakdown.mobiles * (staff.percentage / 100));
              const staffAccessories = Math.round(revenueBreakdown.accessories * (staff.percentage / 100));
              const staffOther = Math.round(revenueBreakdown.other * (staff.percentage / 100));

              return (
                <div
                  key={staff.employeeId}
                  className="bg-white rounded-xl border border-slate-200 p-3.5 space-y-2.5 shadow-2xs hover:border-blue-400 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-mono flex items-center justify-center font-bold">
                          {idx + 1}
                        </span>
                        <span>{staff.employeeName}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        ID: {staff.employeeId} · {staff.role || (isAr ? 'مستشار مبيعات' : 'Sales Advisor')}
                      </div>
                    </div>

                    <span className="bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold font-mono px-2 py-0.5 rounded-lg">
                      {staff.percentage}%
                    </span>
                  </div>

                  {/* Allocated Target Amount & Daily Rate */}
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 block">
                        {isAr ? 'تارجت الريفينيو المستهدف:' : 'Allocated Target:'}
                      </span>
                      <span className="text-sm font-black text-slate-900 font-mono tabular-nums">
                        {formatCurrencyNumber(staff.targetAmount, currency, true, language)}
                      </span>
                    </div>

                    <div className="text-left rtl:text-right text-[11px] font-mono">
                      <span className="text-[10px] text-emerald-700 font-semibold block">
                        {isAr ? `يومياً (${daysInMonth} يوم):` : `Daily (${daysInMonth}d):`}
                      </span>
                      <span className="font-bold text-emerald-800">
                        {formatCurrencyNumber(staffDaily, currency, true, language)}/d
                      </span>
                    </div>
                  </div>

                  {/* Sub-breakdown per advisor */}
                  <div className="pt-1 space-y-1 text-[11px] font-mono text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-[10px] text-slate-500">
                        <Smartphone className="w-3 h-3 text-blue-600" />
                        {isAr ? 'موبايلات:' : 'Mobiles:'}
                      </span>
                      <span className="font-semibold text-slate-800">
                        {formatCurrencyNumber(staffMobiles, currency, true, language)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-[10px] text-slate-500">
                        <Headphones className="w-3 h-3 text-purple-600" />
                        {isAr ? 'إكسسوارات:' : 'Accessories:'}
                      </span>
                      <span className="font-semibold text-slate-800">
                        {formatCurrencyNumber(staffAccessories, currency, true, language)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between" title={isAr ? 'شاشات وتكييفات وأجهزة أخرى' : 'TVs & ACs'}>
                      <span className="flex items-center gap-1 text-[10px] text-slate-500">
                        <Tv className="w-3 h-3 text-amber-600" />
                        {isAr ? 'أخرى (شاشات/تكييفات):' : 'Other (Screens/AC):'}
                      </span>
                      <span className="font-semibold text-slate-800">
                        {formatCurrencyNumber(staffOther, currency, true, language)}
                      </span>
                    </div>
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
