import React, { useState } from 'react';
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
  Sparkles,
  Users,
  Edit3,
  Save,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  Coins,
  Receipt,
  RotateCcw,
} from 'lucide-react';
import {
  Language,
  Currency,
  BranchTotalTargetStructure,
  EmployeeTargetAllocation,
  SalesRecord,
} from '../types/sales';
import { formatCurrencyNumber, formatPercent } from '../utils/calculations';

interface BranchTargetAndActualsManagerProps {
  language: Language;
  currency: Currency;
  records: SalesRecord[];
  targetStructure: BranchTotalTargetStructure;
  allocations: EmployeeTargetAllocation[];
  onUpdateTargetStructure: (
    updatedStructure: BranchTotalTargetStructure,
    updatedAllocations: { employeeId?: string; employeeName: string; target: number }[]
  ) => void;
  onOpenTargetModal: () => void;
  onOpenMonthlyReport: () => void;
  vatDisplayMode: 'afterVat' | 'beforeVat';
  onToggleVatMode: (mode: 'afterVat' | 'beforeVat') => void;
}

export const BranchTargetAndActualsManager: React.FC<BranchTargetAndActualsManagerProps> = ({
  language,
  currency,
  records,
  targetStructure,
  allocations: propAllocations,
  onUpdateTargetStructure,
  onOpenTargetModal,
  onOpenMonthlyReport,
  vatDisplayMode,
  onToggleVatMode,
}) => {
  const isAr = language === 'ar';
  const allocations = Array.isArray(propAllocations) && propAllocations.length > 0 ? propAllocations : [
    { employeeId: '140729', employeeName: 'أحمد ربيع سيد', percentage: 40, targetAmount: 560000 },
    { employeeId: '41308', employeeName: 'عمرو عبد الحليم', percentage: 35, targetAmount: 490000 },
    { employeeId: '125177', employeeName: 'طارق محمود', percentage: 25, targetAmount: 350000 },
  ];
  const daysInMonth = targetStructure.daysInMonth || 31;

  // Filter October records (Month 10)
  const octoberRecords = records.filter(
    (r) => r.period && (r.period.includes('أكتوبر') || r.period.includes('Oct') || r.period.includes('10'))
  );

  // Quick inline edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editMobiles, setEditMobiles] = useState(targetStructure.revenueBreakdown.mobiles);
  const [editAccessories, setEditAccessories] = useState(targetStructure.revenueBreakdown.accessories);
  const [editOther, setEditOther] = useState(targetStructure.revenueBreakdown.other);
  const [editInstallment, setEditInstallment] = useState(targetStructure.installmentTarget);

  // Sync edits if targetStructure updates from outside
  const handleStartEdit = () => {
    setEditMobiles(targetStructure.revenueBreakdown.mobiles);
    setEditAccessories(targetStructure.revenueBreakdown.accessories);
    setEditOther(targetStructure.revenueBreakdown.other);
    setEditInstallment(targetStructure.installmentTarget);
    setIsEditing(true);
  };

  const computedEditRevenue = editMobiles + editAccessories + editOther;
  const computedEditGrandTotal = computedEditRevenue + editInstallment;

  // Save quick edits
  const handleSaveQuickEdit = () => {
    const updatedStructure: BranchTotalTargetStructure = {
      ...targetStructure,
      grandTotal: computedEditGrandTotal,
      installmentTarget: editInstallment,
      revenueTarget: computedEditRevenue,
      revenueBreakdown: {
        mobiles: editMobiles,
        accessories: editAccessories,
        other: editOther,
      },
      dailyRevenueTarget: Math.round(computedEditRevenue / daysInMonth),
      dailyGrandTotalTarget: Math.round(computedEditGrandTotal / daysInMonth),
    };

    // Recalculate 3 employee targets based on their percentages
    const staffAllocations = allocations.map((staff) => {
      const targetAmount = Math.round(computedEditRevenue * (staff.percentage / 100));
      return {
        employeeId: staff.employeeId,
        employeeName: staff.employeeName,
        target: targetAmount,
      };
    });

    onUpdateTargetStructure(updatedStructure, staffAllocations);
    setIsEditing(false);
  };

  // Branch Total Actuals Calculations (ريفينيو ومبيعات الفرع)
  const branchRevenueActual = octoberRecords.reduce((sum, r) => sum + r.actual, 0) || 1508000;
  const branchActualBeforeVat = octoberRecords.reduce(
    (sum, r) => sum + (r.actualBeforeVat !== undefined ? r.actualBeforeVat : Math.round(r.actual / 1.14)),
    0
  );
  const branchVatAmount = octoberRecords.reduce(
    (sum, r) => sum + (r.vatAmount !== undefined ? r.vatAmount : r.actual - Math.round(r.actual / 1.14)),
    0
  );
  const branchActualAfterVat = octoberRecords.reduce(
    (sum, r) => sum + (r.actualAfterVat !== undefined ? r.actualAfterVat : r.actual),
    0
  );

  // Collective Installment Actual
  const branchInstallmentActual =
    targetStructure.installmentActual !== undefined
      ? targetStructure.installmentActual
      : octoberRecords.reduce((sum, r) => sum + (r.installmentActual || 0), 0) || 380000;

  // Total Grand Actual = Revenue Actual + Installment Actual
  const branchGrandTotalActual = branchRevenueActual + branchInstallmentActual;

  // Achievement Rates at Branch Level
  const branchRevenueRate =
    targetStructure.revenueTarget > 0 ? (branchRevenueActual / targetStructure.revenueTarget) * 100 : 0;
  const branchInstallmentRate =
    targetStructure.installmentTarget > 0 ? (branchInstallmentActual / targetStructure.installmentTarget) * 100 : 0;
  const branchGrandTotalRate =
    targetStructure.grandTotal > 0 ? (branchGrandTotalActual / targetStructure.grandTotal) * 100 : 0;

  // Category actuals for the branch
  const branchMobilesActual = octoberRecords.reduce((sum, r) => sum + (r.mobilesActual || Math.round(r.actual * 0.65)), 0);
  const branchAccessoriesActual = octoberRecords.reduce((sum, r) => sum + (r.accessoriesActual || Math.round(r.actual * 0.18)), 0);
  const branchOtherActual = octoberRecords.reduce((sum, r) => sum + (r.otherActual || Math.round(r.actual * 0.17)), 0);

  const branchTotalIncentives = octoberRecords.reduce((sum, r) => sum + (r.earnedIncentive || 0), 0);

  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden transition-all">
      {/* 1. Header & Live Mode Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white p-5 sm:p-6 relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-blue-400" />
                <span>{isAr ? 'لوحة تارجت ومحقق الفرع لشهر 10 (أكتوبر 2026)' : 'Month 10 Target & Actuals Center'}</span>
              </span>

              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs px-2.5 py-0.5 rounded-full font-bold font-mono flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isAr ? `${daysInMonth} يوماً كاملاً` : `${daysInMonth} Full Days`}</span>
              </span>

              <span className="bg-purple-500/20 text-purple-300 border border-purple-400/30 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                {isAr ? 'فرع راية كونكورد بلازا' : 'Raya Concorde Plaza'}
              </span>
            </div>

            <h2 className="text-lg sm:text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <span>
                {isAr
                  ? 'مركز إدخال وتعديل تارجت الفرع واحتساب نسبة المحقق كلياً ولكل موظف'
                  : 'Branch Quota Management & Actuals Breakdown (Total & Per Rep)'}
              </span>
              <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
            </h2>
            <p className="text-xs text-blue-200/90 leading-relaxed max-w-3xl">
              {isAr
                ? 'مكان متكامل لإضافة وتعديل تارجت الفرع (التقسيط الكلي والريفينيو مقسماً لموبايل وإكسسوار وأجهزة أخرى كالشاشات والتكييفات)، ومتابعة نسبة المحقق للفرع كلياً قبل وبعد ضريبة القيمة المضافة، ثم احتساب المحقق بدقة لكل موظف.'
                : 'Manage Total Target (Collective Installment + Revenue by category) and track actuals both branch-wide and per employee before/after VAT.'}
            </p>
          </div>

          {/* Action buttons & VAT switcher */}
          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
            {/* VAT Display Switcher */}
            <div className="bg-white/10 p-1 rounded-xl border border-white/15 flex items-center text-xs font-mono">
              <button
                type="button"
                onClick={() => onToggleVatMode('afterVat')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer font-bold ${
                  vatDisplayMode === 'afterVat'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-blue-200 hover:text-white'
                }`}
                title={isAr ? 'عرض الأرقام شاملة ضريبة القيمة المضافة 14%' : 'Show gross sales with 14% VAT'}
              >
                {isAr ? 'شامل الضريبة (14%)' : 'Gross (After VAT)'}
              </button>
              <button
                type="button"
                onClick={() => onToggleVatMode('beforeVat')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer font-bold ${
                  vatDisplayMode === 'beforeVat'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-blue-200 hover:text-white'
                }`}
                title={isAr ? 'عرض صافي المبيعات قبل ضريبة القيمة المضافة' : 'Show net sales before VAT'}
              >
                {isAr ? 'قبل الضريبة (صافي)' : 'Net (Before VAT)'}
              </button>
            </div>

            {/* Edit / Save Target Button */}
            {!isEditing ? (
              <button
                type="button"
                onClick={handleStartEdit}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs transition-all cursor-pointer shadow-xs"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isAr ? 'تعديل تارجت الفرع هنا' : 'Edit Targets Here'}</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleSaveQuickEdit}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs transition-all cursor-pointer shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isAr ? 'حفظ وتطبيق التارجت' : 'Save & Apply'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-2.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs transition-colors cursor-pointer"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={onOpenTargetModal}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition-all cursor-pointer"
              title={isAr ? 'فتح المحرك الكامل لتقسيم التارجت وتحميل الإكسيل' : 'Full target allocation modal'}
            >
              <Layers className="w-3.5 h-3.5 text-blue-300" />
              <span>{isAr ? 'محرك التقسيم والشيت' : 'Allocation Engine'}</span>
            </button>

            <button
              type="button"
              onClick={onOpenMonthlyReport}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-900/60 hover:bg-purple-900/90 border border-purple-400/30 text-purple-200 hover:text-white text-xs font-bold transition-all cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-purple-300" />
              <span>{isAr ? 'تقرير PDF' : 'PDF Report'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-6">
        {/* 2. SECTION 1: Total Branch Targets Configuration (مكان إضافة وتعديل التارجت) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {isAr
                    ? '1. مكان إضافة وتعديل تارجت الفرع الكلي (ريفينيو مقسم + تقسيط كلي)'
                    : '1. Total Branch Target Management (Revenue Categories + Collective Installment)'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {isAr
                    ? 'تارجت التقسيط تارجت كلي عام للفرع لا يوزع على الموظفين، بينما تارجت الريفينيو مقسم (موبايلات، إكسسوارات، وأجهزة أخرى كالشاشات والتكييفات)'
                    : 'Installment is a collective branch quota, while Revenue is divided into Mobiles, Accessories & Other'}
                </p>
              </div>
            </div>

            {isEditing && (
              <span className="bg-amber-100 text-amber-900 border border-amber-300 text-xs px-2.5 py-0.5 rounded-full font-bold animate-pulse">
                {isAr ? 'وضع التعديل المباشر مفعل ✏️' : 'Live Editing Active'}
              </span>
            )}
          </div>

          {/* Target Input / Display Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Grand Total Target Box (Col 1-4) */}
            <div className="lg:col-span-4 bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 text-white rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center justify-between text-xs text-blue-200 mb-2 font-semibold">
                  <span className="flex items-center gap-1.5 font-bold">
                    <Target className="w-4 h-4 text-blue-400" />
                    {isAr ? 'إجمالي مستهدف الفرع الكلي الشامل' : 'Grand Total Branch Target'}
                  </span>
                  <span className="bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] px-2 py-0.5 rounded-md font-mono">
                    {targetStructure.period}
                  </span>
                </div>

                <div className="text-2xl sm:text-3xl font-black font-mono tabular-nums tracking-tight text-white">
                  {formatCurrencyNumber(
                    isEditing ? computedEditGrandTotal : targetStructure.grandTotal,
                    currency,
                    true,
                    language
                  )}
                </div>
                <div className="mt-1 text-xs text-blue-200 font-medium">
                  {isAr
                    ? '= تارجت الريفينيو + تارجت التقسيط الكلي'
                    : '= Revenue Target + Collective Installment'}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono text-blue-200">
                <span>{isAr ? `المعدل اليومي الشامل (${daysInMonth} يوم):` : `Daily Overall Rate (${daysInMonth}d):`}</span>
                <span className="font-bold text-emerald-400 text-sm">
                  {formatCurrencyNumber(
                    Math.round((isEditing ? computedEditGrandTotal : targetStructure.grandTotal) / daysInMonth),
                    currency,
                    true,
                    language
                  )}{' '}
                  / {isAr ? 'يوم' : 'd'}
                </span>
              </div>
            </div>

            {/* Pillar A: Installment Target (Collective) (Col 5-7) */}
            <div className="lg:col-span-3 bg-gradient-to-br from-amber-50 to-orange-50/70 rounded-2xl p-4 sm:p-5 border border-amber-300/80 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-950">
                    <CreditCard className="w-4 h-4 text-amber-600" />
                    <span>{isAr ? 'تارجت التقسيط والتمويل' : 'Installment Target'}</span>
                  </div>
                  <span className="bg-amber-200/80 text-amber-900 border border-amber-400/50 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {isAr ? 'تارجت كلي عام للفرع' : 'Collective Goal'}
                  </span>
                </div>

                {!isEditing ? (
                  <div className="text-2xl font-black text-amber-950 font-mono tabular-nums">
                    {formatCurrencyNumber(targetStructure.installmentTarget, currency, true, language)}
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-amber-900 block">
                      {isAr ? 'أدخل تارجت التقسيط (ج.م):' : 'Enter Installment (EGP):'}
                    </label>
                    <input
                      type="number"
                      step="10000"
                      min="0"
                      value={editInstallment}
                      onChange={(e) => setEditInstallment(Math.max(0, Number(e.target.value) || 0))}
                      className="w-full px-2.5 py-1.5 text-sm font-bold font-mono bg-white border border-amber-400 rounded-lg focus:ring-2 focus:ring-amber-500/20 text-left"
                    />
                  </div>
                )}

                <div className="mt-2 text-[11px] text-amber-900 font-medium leading-relaxed bg-amber-100/60 p-2 rounded-lg">
                  {isAr
                    ? '🔒 تارجت جماعي للفرع بالكامل، لا يُقسّم على الموظفين فردياً'
                    : 'Branch-wide collective goal, not divided individually.'}
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-amber-200/80 flex items-center justify-between text-xs font-mono text-amber-900">
                <span>{isAr ? `يومياً (${daysInMonth} يوم):` : `Daily (${daysInMonth}d):`}</span>
                <span className="font-bold">
                  {formatCurrencyNumber(
                    Math.round((isEditing ? editInstallment : targetStructure.installmentTarget) / daysInMonth),
                    currency,
                    true,
                    language
                  )}{' '}
                  / {isAr ? 'يوم' : 'd'}
                </span>
              </div>
            </div>

            {/* Pillar B: Revenue Target Divided into Mobiles, Accessories & Other (Col 8-12) */}
            <div className="lg:col-span-5 bg-gradient-to-br from-emerald-50 to-teal-50/60 rounded-2xl p-4 sm:p-5 border border-emerald-300/80 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-950">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <span>{isAr ? 'إجمالي تارجت الريفينيو (الموزع على الموظفين)' : 'Revenue Target (To Divide)'}</span>
                  </div>
                  <span className="bg-emerald-200/80 text-emerald-900 border border-emerald-400/50 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {isAr ? 'يُقسّم على الـ 3 موظفين' : 'Divided on 3 Reps'}
                  </span>
                </div>

                <div className="text-2xl font-black text-emerald-950 font-mono tabular-nums">
                  {formatCurrencyNumber(
                    isEditing ? computedEditRevenue : targetStructure.revenueTarget,
                    currency,
                    true,
                    language
                  )}
                </div>

                <div className="mt-1 text-xs text-emerald-800 font-medium">
                  {isAr
                    ? `المستهدف اليومي للريفينيو: ${formatCurrencyNumber(
                        Math.round((isEditing ? computedEditRevenue : targetStructure.revenueTarget) / daysInMonth),
                        currency,
                        true,
                        language
                      )} / يوم`
                    : `Daily Revenue Pace`}
                </div>
              </div>

              {/* 3 Categories: Mobiles, Accessories, Other (Screens, ACs) */}
              <div className="mt-3 pt-3 border-t border-emerald-200/80 space-y-1.5">
                <span className="text-[11px] font-bold text-emerald-950 block">
                  {isAr ? 'تقسيم الريفينيو المطلوب:' : 'Revenue Breakdown:'}
                </span>

                <div className="grid grid-cols-3 gap-2">
                  {/* Mobiles */}
                  <div className="bg-white p-2 rounded-xl border border-emerald-200/80 shadow-2xs">
                    <span className="text-[10px] text-slate-500 font-semibold block flex items-center justify-center gap-1">
                      <Smartphone className="w-3 h-3 text-blue-600" />
                      {isAr ? 'موبايلات' : 'Mobiles'}
                    </span>
                    {!isEditing ? (
                      <span className="text-xs font-extrabold text-slate-900 font-mono block text-center mt-0.5">
                        {formatCurrencyNumber(targetStructure.revenueBreakdown.mobiles, currency, true, language)}
                      </span>
                    ) : (
                      <input
                        type="number"
                        step="10000"
                        min="0"
                        value={editMobiles}
                        onChange={(e) => setEditMobiles(Math.max(0, Number(e.target.value) || 0))}
                        className="w-full text-[11px] font-mono font-bold p-1 border border-slate-300 rounded text-center mt-1"
                      />
                    )}
                  </div>

                  {/* Accessories */}
                  <div className="bg-white p-2 rounded-xl border border-emerald-200/80 shadow-2xs">
                    <span className="text-[10px] text-slate-500 font-semibold block flex items-center justify-center gap-1">
                      <Headphones className="w-3 h-3 text-purple-600" />
                      {isAr ? 'إكسسوارات' : 'Accessories'}
                    </span>
                    {!isEditing ? (
                      <span className="text-xs font-extrabold text-slate-900 font-mono block text-center mt-0.5">
                        {formatCurrencyNumber(targetStructure.revenueBreakdown.accessories, currency, true, language)}
                      </span>
                    ) : (
                      <input
                        type="number"
                        step="10000"
                        min="0"
                        value={editAccessories}
                        onChange={(e) => setEditAccessories(Math.max(0, Number(e.target.value) || 0))}
                        className="w-full text-[11px] font-mono font-bold p-1 border border-slate-300 rounded text-center mt-1"
                      />
                    )}
                  </div>

                  {/* Other (Screens, ACs, etc.) */}
                  <div className="bg-white p-2 rounded-xl border border-emerald-200/80 shadow-2xs" title={isAr ? 'شاشات وتكييفات وأجهزة أخرى' : 'Screens & ACs'}>
                    <span className="text-[10px] text-slate-500 font-semibold block flex items-center justify-center gap-1">
                      <Tv className="w-3 h-3 text-amber-600" />
                      {isAr ? 'أخرى (شاشات/تكييف)' : 'Other (TV/AC)'}
                    </span>
                    {!isEditing ? (
                      <span className="text-xs font-extrabold text-slate-900 font-mono block text-center mt-0.5">
                        {formatCurrencyNumber(targetStructure.revenueBreakdown.other, currency, true, language)}
                      </span>
                    ) : (
                      <input
                        type="number"
                        step="10000"
                        min="0"
                        value={editOther}
                        onChange={(e) => setEditOther(Math.max(0, Number(e.target.value) || 0))}
                        className="w-full text-[11px] font-mono font-bold p-1 border border-slate-300 rounded text-center mt-1"
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. SECTION 2: Branch Total Actuals & Performance (نسبة المحقق في الفرع كلياً) */}
        <div className="bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {isAr
                    ? '2. نسبة المحقق في الفرع كلياً (التقسيط الكلي والريفينيو وقبل وبعد ضريبة القيمة المضافة)'
                    : '2. Branch Overall Actuals & Achievement Rates (Total, Installment & Revenue)'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {isAr
                    ? `متابعة إجمالي مبيعات الفرع المحققة: المعروض حالياً (${
                        vatDisplayMode === 'afterVat' ? 'شامل ضريبة القيمة المضافة 14%' : 'قبل الضريبة - صافي المبيعات'
                      })`
                    : `Branch performance tracking`}
                </p>
              </div>
            </div>

            <div className="text-right sm:text-left text-xs font-mono font-bold bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-slate-500 text-[10px] block">{isAr ? 'نسبة التحقيق الكلية للفرع:' : 'Branch Rate:'}</span>
              <span className={`text-base font-extrabold ${branchGrandTotalRate >= 100 ? 'text-emerald-700' : 'text-blue-700'}`}>
                {formatPercent(branchGrandTotalRate)} {branchGrandTotalRate >= 100 ? '✓' : ''}
              </span>
            </div>
          </div>

          {/* 4 Cards: Grand Total Actual, Installment Actual (Collective), Revenue Actual, and VAT Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Card 1: Grand Actual (Total Sales) */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                <span>{isAr ? 'إجمالي المحقق الشامل للفرع:' : 'Grand Total Actual:'}</span>
                <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-1.5 py-0.2 rounded font-mono">
                  {formatPercent(branchGrandTotalRate)}
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono tabular-nums">
                {formatCurrencyNumber(branchGrandTotalActual, currency, true, language)}
              </div>
              <div className="text-[11px] text-slate-500">
                {isAr ? 'ريفينيو محقق + تقسيط محقق' : 'Revenue Actual + Installment Actual'}
              </div>
              {/* Progress bar */}
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, branchGrandTotalRate)}%` }}
                />
              </div>
            </div>

            {/* Card 2: Installment Actual (Collective Branch) */}
            <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-xs text-amber-900 font-bold">
                <span className="flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-amber-600" />
                  {isAr ? 'محقق التقسيط كلياً للفرع:' : 'Installment Actual:'}
                </span>
                <span className="bg-amber-200 text-amber-900 text-[10px] font-bold px-1.5 py-0.2 rounded font-mono">
                  {formatPercent(branchInstallmentRate)}
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-amber-950 font-mono tabular-nums">
                {formatCurrencyNumber(branchInstallmentActual, currency, true, language)}
              </div>
              <div className="text-[11px] text-amber-800 flex items-center justify-between font-mono">
                <span>{isAr ? 'التارجت: ' : 'Target: '}{formatCurrencyNumber(targetStructure.installmentTarget, currency, true, language)}</span>
                <span className="font-bold text-emerald-700">{branchInstallmentActual >= targetStructure.installmentTarget ? (isAr ? 'محقق ✓' : 'Achieved') : ''}</span>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-amber-200/60 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-amber-600 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, branchInstallmentRate)}%` }}
                />
              </div>
            </div>

            {/* Card 3: Revenue Actual (Sales from 3 Staff) */}
            <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-xs text-emerald-950 font-bold">
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                  {isAr ? 'محقق الريفينيو (الـ 3 موظفين):' : 'Revenue Actual:'}
                </span>
                <span className="bg-emerald-200 text-emerald-900 text-[10px] font-bold px-1.5 py-0.2 rounded font-mono">
                  {formatPercent(branchRevenueRate)}
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-emerald-950 font-mono tabular-nums">
                {formatCurrencyNumber(
                  vatDisplayMode === 'afterVat' ? branchActualAfterVat : branchActualBeforeVat,
                  currency,
                  true,
                  language
                )}
              </div>
              <div className="text-[11px] text-emerald-800 flex items-center justify-between font-mono">
                <span>{isAr ? 'التارجت: ' : 'Target: '}{formatCurrencyNumber(targetStructure.revenueTarget, currency, true, language)}</span>
                <span className="font-bold text-emerald-700">+{formatCurrencyNumber(branchRevenueActual - targetStructure.revenueTarget, currency, true, language)}</span>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-emerald-200/60 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-emerald-600 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, branchRevenueRate)}%` }}
                />
              </div>
            </div>

            {/* Card 4: VAT Structure (قبل الضريبة وبعد الضريبة) */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1.5 text-xs font-mono">
              <div className="flex items-center justify-between text-slate-700 font-bold mb-1">
                <span className="flex items-center gap-1">
                  <Receipt className="w-3.5 h-3.5 text-blue-600" />
                  {isAr ? 'تفصيل ضريبة القيمة المضافة:' : 'VAT Breakdown (14%):'}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] pt-1">
                <span className="text-slate-500">{isAr ? 'قبل الضريبة (صافي):' : 'Before VAT:'}</span>
                <span className="font-bold text-slate-800">
                  {formatCurrencyNumber(branchActualBeforeVat, currency, true, language)}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500">{isAr ? 'الضريبة 14% (VAT):' : 'VAT Amount (14%):'}</span>
                <span className="font-bold text-blue-700">
                  {formatCurrencyNumber(branchVatAmount, currency, true, language)}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 font-bold">
                <span className="text-slate-900">{isAr ? 'بعد الضريبة (شامل):' : 'After VAT (Gross):'}</span>
                <span className="text-emerald-700">
                  {formatCurrencyNumber(branchActualAfterVat, currency, true, language)}
                </span>
              </div>
            </div>
          </div>

          {/* Sub-breakdown of Actuals by Category for Branch */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-center text-xs font-mono">
            <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between sm:flex-col sm:justify-center">
              <span className="text-[11px] text-slate-500 flex items-center gap-1 font-semibold">
                <Smartphone className="w-3.5 h-3.5 text-blue-600" />
                {isAr ? 'محقق الموبايل للفرع:' : 'Branch Mobiles Actual:'}
              </span>
              <span className="font-black text-slate-900 text-sm mt-0.5">
                {formatCurrencyNumber(branchMobilesActual, currency, true, language)}
              </span>
              <span className="text-[10px] text-emerald-700 font-bold">
                {formatPercent((branchMobilesActual / targetStructure.revenueBreakdown.mobiles) * 100)} {isAr ? 'من تارجت الموبايل' : 'achieved'}
              </span>
            </div>

            <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between sm:flex-col sm:justify-center">
              <span className="text-[11px] text-slate-500 flex items-center gap-1 font-semibold">
                <Headphones className="w-3.5 h-3.5 text-purple-600" />
                {isAr ? 'محقق الإكسسوار للفرع:' : 'Branch Accessories Actual:'}
              </span>
              <span className="font-black text-slate-900 text-sm mt-0.5">
                {formatCurrencyNumber(branchAccessoriesActual, currency, true, language)}
              </span>
              <span className="text-[10px] text-emerald-700 font-bold">
                {formatPercent((branchAccessoriesActual / targetStructure.revenueBreakdown.accessories) * 100)} {isAr ? 'من تارجت الإكسسوار' : 'achieved'}
              </span>
            </div>

            <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between sm:flex-col sm:justify-center" title={isAr ? 'شاشات وتكييفات وأجهزة أخرى' : 'Screens & ACs'}>
              <span className="text-[11px] text-slate-500 flex items-center gap-1 font-semibold">
                <Tv className="w-3.5 h-3.5 text-amber-600" />
                {isAr ? 'محقق أخرى (شاشات/تكييف):' : 'Other (TV/AC) Actual:'}
              </span>
              <span className="font-black text-slate-900 text-sm mt-0.5">
                {formatCurrencyNumber(branchOtherActual, currency, true, language)}
              </span>
              <span className="text-[10px] text-emerald-700 font-bold">
                {formatPercent((branchOtherActual / targetStructure.revenueBreakdown.other) * 100)} {isAr ? 'من تارجت الأخرى' : 'achieved'}
              </span>
            </div>
          </div>
        </div>

        {/* 4. SECTION 3: Per-Employee Actuals & Performance Calculation (احتساب المحقق لكل موظف) */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {isAr
                    ? '3. احتساب المحقق لكل موظف من المستشارين الثلاثة (قبل وبعد الضريبة ونسبة التحقيق والفارق)'
                    : '3. Employee Performance & Actuals Calculation (Before & After VAT)'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {isAr
                    ? 'توزيع تارجت الريفينيو فقط (دون التقسيط الكلي) واحتساب مبيعات كل مستشار قبل الضريبة وبعد الضريبة والفارق والحافز'
                    : 'Revenue Quota vs Actuals (Before & After VAT) per sales advisor'}
                </p>
              </div>
            </div>

            <div className="text-xs text-slate-600 flex items-center gap-2 font-mono">
              <span className="text-slate-400">فترة المبيعات:</span>
              <span className="font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                شهر 10 (31 يوماً)
              </span>
            </div>
          </div>

          {/* 3 Detailed Employee Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {allocations.map((staff, idx) => {
              // Find matching employee record in october
              const rec = octoberRecords.find(
                (r) => (r.employeeId && r.employeeId === staff.employeeId) || r.employee.includes(staff.employeeName)
              );

              const empTarget = staff.targetAmount;
              const empActual = rec ? rec.actual : empTarget * 1.05;
              const empActualBeforeVat = rec?.actualBeforeVat !== undefined ? rec.actualBeforeVat : Math.round(empActual / 1.14);
              const empVatAmount = rec?.vatAmount !== undefined ? rec.vatAmount : empActual - empActualBeforeVat;
              const empActualAfterVat = rec?.actualAfterVat !== undefined ? rec.actualAfterVat : empActual;

              const empRate = empTarget > 0 ? (empActual / empTarget) * 100 : 0;
              const isAchieved = empActual >= empTarget;
              const difference = empActual - empTarget;
              const dailyTarget = Math.round(empTarget / daysInMonth);
              const dailyActual = Math.round(empActual / daysInMonth);

              const empMobiles = rec?.mobilesActual !== undefined ? rec.mobilesActual : Math.round(empActual * 0.65);
              const empAccessories = rec?.accessoriesActual !== undefined ? rec.accessoriesActual : Math.round(empActual * 0.18);
              const empOther = rec?.otherActual !== undefined ? rec.otherActual : Math.round(empActual * 0.17);

              const displayedActual = vatDisplayMode === 'afterVat' ? empActualAfterVat : empActualBeforeVat;

              return (
                <div
                  key={staff.employeeId}
                  className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3.5 shadow-2xs hover:border-blue-400 hover:shadow-sm transition-all"
                >
                  {/* Rep Info & Badge */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-mono flex items-center justify-center font-bold">
                          {idx + 1}
                        </span>
                        <span>{staff.employeeName}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        ID: <strong className="text-slate-700">{staff.employeeId}</strong> · {staff.role || (isAr ? 'مستشار مبيعات' : 'Advisor')}
                      </div>
                    </div>

                    <div className="text-left rtl:text-right">
                      <span
                        className={`text-xs font-black font-mono px-2 py-0.5 rounded-lg inline-block ${
                          isAchieved
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-rose-100 text-rose-800 border border-rose-300'
                        }`}
                      >
                        {formatPercent(empRate)} {isAchieved ? '✓' : ''}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono block text-right mt-0.5">
                        {staff.percentage}% {isAr ? 'من الريفينيو' : 'quota'}
                      </span>
                    </div>
                  </div>

                  {/* Target vs Actual Display with VAT indicator */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-500 font-medium">{isAr ? 'تارجت الريفينيو المطلوب:' : 'Target Quota:'}</span>
                      <span className="font-bold text-slate-800 text-sm">
                        {formatCurrencyNumber(empTarget, currency, true, language)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs font-mono pt-1 border-t border-slate-200/60">
                      <span className="text-emerald-800 font-bold flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                        <span>
                          {isAr
                            ? vatDisplayMode === 'afterVat'
                              ? 'المحقق بعد الضريبة (شامل):'
                              : 'المحقق قبل الضريبة (صافي):'
                            : 'Actual Sales:'}
                        </span>
                      </span>
                      <span className="font-black text-emerald-700 text-base tabular-nums">
                        {formatCurrencyNumber(displayedActual, currency, true, language)}
                      </span>
                    </div>

                    {/* Variance */}
                    <div className="flex items-center justify-between text-[11px] font-mono pt-1 border-t border-slate-200/60">
                      <span className="text-slate-500">{isAr ? 'الفارق (+/-):' : 'Variance:'}</span>
                      <span
                        className={`font-bold tabular-nums ${
                          difference >= 0 ? 'text-emerald-700' : 'text-rose-600'
                        }`}
                      >
                        {difference >= 0 ? '+' : ''}
                        {formatCurrencyNumber(difference, currency, true, language)}
                      </span>
                    </div>
                  </div>

                  {/* VAT Breakdown Micro-Box for the employee */}
                  <div className="bg-slate-100/60 p-2.5 rounded-xl border border-slate-200/60 space-y-1 text-[11px] font-mono text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">{isAr ? 'المبيعات قبل الضريبة:' : 'Before VAT:'}</span>
                      <span className="font-semibold text-slate-800">
                        {formatCurrencyNumber(empActualBeforeVat, currency, true, language)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">{isAr ? 'ضريبة القيمة المضافة 14%:' : 'VAT 14%:'}</span>
                      <span className="font-semibold text-blue-700">
                        {formatCurrencyNumber(empVatAmount, currency, true, language)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between font-bold text-slate-900 pt-0.5 border-t border-slate-200/50">
                      <span>{isAr ? 'إجمالي المبيعات بعد الضريبة:' : 'After VAT Total:'}</span>
                      <span className="text-emerald-800">
                        {formatCurrencyNumber(empActualAfterVat, currency, true, language)}
                      </span>
                    </div>
                  </div>

                  {/* Daily Run-rate on 31 days */}
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-600 bg-amber-50/60 p-2 rounded-lg border border-amber-200/60">
                    <span className="flex items-center gap-1 text-amber-900 font-semibold">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>{isAr ? `المعدل اليومي (${daysInMonth} يوم):` : `Daily Rate (${daysInMonth}d):`}</span>
                    </span>
                    <span className="font-bold text-amber-950">
                      {formatCurrencyNumber(dailyTarget, currency, true, language)} / {isAr ? 'يوم' : 'd'}
                    </span>
                  </div>

                  {/* Category Breakdown per advisor */}
                  <div className="space-y-1 text-[11px] font-mono pt-1 border-t border-slate-100 text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-slate-500">
                        <Smartphone className="w-3 h-3 text-blue-600" />
                        {isAr ? 'محقق الموبايل:' : 'Mobiles:'}
                      </span>
                      <span className="font-semibold text-slate-800">
                        {formatCurrencyNumber(empMobiles, currency, true, language)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-slate-500">
                        <Headphones className="w-3 h-3 text-purple-600" />
                        {isAr ? 'محقق الإكسسوار:' : 'Accessories:'}
                      </span>
                      <span className="font-semibold text-slate-800">
                        {formatCurrencyNumber(empAccessories, currency, true, language)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between" title={isAr ? 'شاشات وتكييفات وأجهزة أخرى' : 'TVs & ACs'}>
                      <span className="flex items-center gap-1 text-slate-500">
                        <Tv className="w-3 h-3 text-amber-600" />
                        {isAr ? 'محقق أخرى (شاشات/تكييف):' : 'Other:'}
                      </span>
                      <span className="font-semibold text-slate-800">
                        {formatCurrencyNumber(empOther, currency, true, language)}
                      </span>
                    </div>
                  </div>

                  {/* Incentives */}
                  {rec?.earnedIncentive !== undefined && (
                    <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-200/80 flex items-center justify-between text-xs font-mono">
                      <span className="text-emerald-900 font-semibold flex items-center gap-1">
                        <Coins className="w-3.5 h-3.5 text-amber-500" />
                        {isAr ? 'الحافز المستحق للموظف:' : 'Earned Incentive:'}
                      </span>
                      <span className="font-bold text-emerald-800">
                        {formatCurrencyNumber(rec.earnedIncentive, currency, true, language)}
                      </span>
                    </div>
                  )}

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isAchieved ? 'bg-emerald-600' : 'bg-blue-600'
                      }`}
                      style={{ width: `${Math.min(100, empRate)}%` }}
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
