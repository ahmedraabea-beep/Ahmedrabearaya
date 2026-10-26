import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import {
  X,
  Target,
  Sliders,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  Percent,
  Calendar,
  Sparkles,
  Users,
  Coins,
  Smartphone,
  Headphones,
  Tv,
  CreditCard,
  Layers,
  Info,
  TrendingUp,
} from 'lucide-react';
import {
  Language,
  Currency,
  TargetDistributionMethod,
  BranchTargetConfig,
  SalesRecord,
  BranchTotalTargetStructure,
  EmployeeTargetAllocation,
} from '../types/sales';
import { formatCurrencyNumber, formatPercent } from '../utils/calculations';
import { translations } from '../utils/i18n';
import { parseArabicOrWesternNumber } from '../utils/excelParser';
import { CONCORD_BRANCH_NAME } from '../data/sampleData';

interface TargetAllocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  currency: Currency;
  records: SalesRecord[];
  currentTargetStructure?: BranchTotalTargetStructure | null;
  onApplyNewTargets: (
    allocations: { employeeId?: string; employeeName: string; target: number }[],
    updatedStructure?: BranchTotalTargetStructure
  ) => void;
}

export const TargetAllocationModal: React.FC<TargetAllocationModalProps> = ({
  isOpen,
  onClose,
  language,
  currency,
  records,
  currentTargetStructure,
  onApplyNewTargets,
}) => {
  const t = translations[language];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isAr = language === 'ar';

  // Default team staff
  const initialStaff = [
    { id: '140729', name: 'أحمد ربيع سيد', role: 'مستشار مبيعات أول (Senior Advisor)', percentage: 40 },
    { id: '41308', name: 'عمرو عبد الحليم', role: 'مستشار مبيعات (Sales Advisor)', percentage: 35 },
    { id: '125177', name: 'طارق محمود', role: 'مستشار مبيعات (Sales Advisor)', percentage: 25 },
  ];

  // Base config from current target structure or clean empty structure
  const baseStructure: BranchTotalTargetStructure = currentTargetStructure || {
    grandTotal: 0,
    installmentTarget: 0,
    revenueTarget: 0,
    revenueBreakdown: { mobiles: 0, accessories: 0, other: 0 },
    period: records[0]?.period || '',
    daysInMonth: 30,
    dailyRevenueTarget: 0,
    dailyGrandTotalTarget: 0,
  };

  const [targetPeriod, setTargetPeriod] = useState<string>(baseStructure.period || records[0]?.period || (isAr ? 'الفترة الحالية' : 'Current Period'));
  const [daysInMonth, setDaysInMonth] = useState<number>(baseStructure.daysInMonth || 30);

  // Targets Breakdown
  const [installmentTarget, setInstallmentTarget] = useState<number>(baseStructure.installmentTarget || 0);
  const [mobilesTarget, setMobilesTarget] = useState<number>(baseStructure.revenueBreakdown?.mobiles || 0);
  const [accessoriesTarget, setAccessoriesTarget] = useState<number>(baseStructure.revenueBreakdown?.accessories || 0);
  const [otherTarget, setOtherTarget] = useState<number>(baseStructure.revenueBreakdown?.other || 0);

  const [method, setMethod] = useState<TargetDistributionMethod>('percentage');
  const [staffPercentages, setStaffPercentages] = useState(initialStaff);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Sync state if baseStructure changes
  useEffect(() => {
    if (currentTargetStructure) {
      setTargetPeriod(currentTargetStructure.period);
      setDaysInMonth(currentTargetStructure.daysInMonth);
      setInstallmentTarget(currentTargetStructure.installmentTarget);
      setMobilesTarget(currentTargetStructure.revenueBreakdown.mobiles);
      setAccessoriesTarget(currentTargetStructure.revenueBreakdown.accessories);
      setOtherTarget(currentTargetStructure.revenueBreakdown.other);
    }
  }, [currentTargetStructure]);

  if (!isOpen) return null;

  // Calculated totals
  const revenueTarget = mobilesTarget + accessoriesTarget + otherTarget;
  const grandTotal = revenueTarget + installmentTarget;
  const dailyRevenueTarget = Math.round(revenueTarget / (daysInMonth || 31));
  const dailyGrandTotalTarget = Math.round(grandTotal / (daysInMonth || 31));
  const dailyInstallmentTarget = Math.round(installmentTarget / (daysInMonth || 31));

  // Handle changing method
  const handleMethodChange = (newMethod: TargetDistributionMethod) => {
    setMethod(newMethod);
    if (newMethod === 'equal') {
      setStaffPercentages([
        { ...staffPercentages[0], percentage: 33.34 },
        { ...staffPercentages[1], percentage: 33.33 },
        { ...staffPercentages[2], percentage: 33.33 },
      ]);
    } else if (newMethod === 'seniority') {
      setStaffPercentages([
        { ...staffPercentages[0], percentage: 45 },
        { ...staffPercentages[1], percentage: 30 },
        { ...staffPercentages[2], percentage: 25 },
      ]);
    } else {
      setStaffPercentages(initialStaff);
    }
  };

  const handlePercentageChange = (id: string, newPct: number) => {
    setStaffPercentages((prev) =>
      prev.map((s) => (s.id === id ? { ...s, percentage: Math.max(0, Math.min(100, newPct)) } : s))
    );
  };

  const totalPercentage = Math.round(
    staffPercentages.reduce((sum, s) => sum + s.percentage, 0)
  );

  const isPercentageValid = Math.abs(totalPercentage - 100) <= 0.5;

  // Compute allocated target per staff ONLY FROM REVENUE (Excluding installment target!)
  const allocations: EmployeeTargetAllocation[] = staffPercentages.map((s) => {
    const targetAmount = Math.round(revenueTarget * (s.percentage / 100));
    const dailyTarget = Math.round(targetAmount / daysInMonth);
    const mobilesShare = Math.round(mobilesTarget * (s.percentage / 100));
    const accessoriesShare = Math.round(accessoriesTarget * (s.percentage / 100));
    const otherShare = Math.round(otherTarget * (s.percentage / 100));

    return {
      employeeId: s.id,
      employeeName: s.name,
      percentage: s.percentage,
      targetAmount,
      dailyTarget,
      role: s.role,
      mobilesShare,
      accessoriesShare,
      otherShare,
    };
  });

  const handleApply = () => {
    if (!isPercentageValid) {
      setErrorMessage(
        isAr
          ? `مجموع النسب الحالية هو ${totalPercentage}%، يجب أن يكون مجموع نسب التوزيع 100% تماماً.`
          : `Total percentage is ${totalPercentage}%. It must equal 100%.`
      );
      return;
    }

    if (revenueTarget <= 0) {
      setErrorMessage(
        isAr ? 'يجب أن يكون تارجت الريفينيو أكبر من صفر.' : 'Revenue target must be greater than zero.'
      );
      return;
    }

    const updatedStructure: BranchTotalTargetStructure = {
      grandTotal,
      installmentTarget,
      revenueTarget,
      revenueBreakdown: {
        mobiles: mobilesTarget,
        accessories: accessoriesTarget,
        other: otherTarget,
      },
      period: targetPeriod,
      daysInMonth,
      dailyRevenueTarget,
      dailyGrandTotalTarget,
    };

    onApplyNewTargets(
      allocations.map((a) => ({
        employeeId: a.employeeId,
        employeeName: a.employeeName,
        target: a.targetAmount,
      })),
      updatedStructure
    );

    setSuccessMessage(
      isAr
        ? `تم تطبيق هيكل تارجت شهر 10 بنجاح: إجمالي الريفينيو ${formatCurrencyNumber(revenueTarget, currency, true, language)} مقسماً على الموظفين الثلاثة، وتارجت التقسيط الكلي ${formatCurrencyNumber(installmentTarget, currency, true, language)} للفرع على ${daysInMonth} يوماً.`
        : 'October target structure applied successfully!'
    );

    setTimeout(() => {
      setSuccessMessage('');
      onClose();
    }, 1800);
  };

  // Download Sample Target Allocation Template with full category breakdown
  const handleDownloadTemplate = () => {
    const sampleRows = allocations.map((a) => ({
      'الرقم الوظيفي': a.employeeId,
      'اسم الموظف': a.employeeName,
      'المسمى الوظيفي': a.role || 'مستشار مبيعات',
      'اسم الفرع': CONCORD_BRANCH_NAME,
      'النسبة المئوية %': `${a.percentage}%`,
      'تارجت الريفينيو الموزع (ج.م)': a.targetAmount,
      'حصة الموبايلات (ج.م)': a.mobilesShare,
      'حصة الإكسسوارات (ج.م)': a.accessoriesShare,
      'حصة شاشات وتكييفات وأخرى (ج.م)': a.otherShare,
      'عدد أيام الشهر': daysInMonth,
      'التارجت اليومي (ج.م/يوم)': a.dailyTarget,
      'تارجت التقسيط الكلي للفرع (ج.م)': `${installmentTarget} (تارجت جماعي للفرع)`,
      'الشهر': targetPeriod,
    }));

    // Add Revenue Total Summary Row
    sampleRows.push({
      'الرقم الوظيفي': 'TOTAL-REV',
      'اسم الموظف': 'إجمالي تارجت الريفينيو للفرع',
      'المسمى الوظيفي': 'موزع على الـ 3 موظفين',
      'اسم الفرع': CONCORD_BRANCH_NAME,
      'النسبة المئوية %': '100%',
      'تارجت الريفينيو الموزع (ج.م)': revenueTarget,
      'حصة الموبايلات (ج.م)': mobilesTarget,
      'حصة الإكسسوارات (ج.م)': accessoriesTarget,
      'حصة شاشات وتكييفات وأخرى (ج.م)': otherTarget,
      'عدد أيام الشهر': daysInMonth,
      'التارجت اليومي (ج.م/يوم)': dailyRevenueTarget,
      'تارجت التقسيط الكلي للفرع (ج.م)': '-',
      'الشهر': targetPeriod,
    });

    // Add Grand Total Row (Revenue + Installment)
    sampleRows.push({
      'الرقم الوظيفي': 'GRAND-TOTAL',
      'اسم الموظف': 'إجمالي مستهدف الفرع الكلي الشامل',
      'المسمى الوظيفي': 'ريفينيو + تقسيط كلي',
      'اسم الفرع': CONCORD_BRANCH_NAME,
      'النسبة المئوية %': '100%',
      'تارجت الريفينيو الموزع (ج.م)': grandTotal,
      'حصة الموبايلات (ج.م)': mobilesTarget,
      'حصة الإكسسوارات (ج.م)': accessoriesTarget,
      'حصة شاشات وتكييفات وأخرى (ج.م)': otherTarget,
      'عدد أيام الشهر': daysInMonth,
      'التارجت اليومي (ج.م/يوم)': dailyGrandTotalTarget,
      'تارجت التقسيط الكلي للفرع (ج.م)': `${installmentTarget} (تارجت كلي عام للفرع)`,
      'الشهر': targetPeriod,
    });

    const worksheet = XLSX.utils.json_to_sheet(sampleRows);
    worksheet['!cols'] = [
      { wch: 14 },
      { wch: 22 },
      { wch: 26 },
      { wch: 24 },
      { wch: 16 },
      { wch: 24 },
      { wch: 20 },
      { wch: 20 },
      { wch: 26 },
      { wch: 14 },
      { wch: 22 },
      { wch: 28 },
      { wch: 16 },
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'تارجت_شهر_10_كونكورد');
    XLSX.writeFile(workbook, `تارجت_فرع_راية_كونكورد_شهر_10_مقسم_${daysInMonth}_يوم.xlsx`);
  };

  // Upload Custom Target Sheet
  const handleUploadTargetSheet = async (file: File) => {
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: '' });

      if (rows.length > 0) {
        let detectedRevenue = 0;
        let detectedInstallment = installmentTarget;
        const newAllocations: { employeeId?: string; employeeName: string; target: number }[] = [];

        rows.forEach((row) => {
          const keys = Object.keys(row);
          const nameKey = keys.find((k) => k.includes('موظف') || k.toLowerCase().includes('name')) || keys[1];
          const idKey = keys.find((k) => k.includes('وظيفي') || k.toLowerCase().includes('id')) || keys[0];
          const targetKey = keys.find((k) => k.includes('ريفينيو') || k.includes('تارجت') || k.toLowerCase().includes('target')) || keys[4];
          const instKey = keys.find((k) => k.includes('تقسيط') || k.toLowerCase().includes('installment'));

          const name = String(row[nameKey] || '').trim();
          const id = String(row[idKey] || '').trim();
          const target = parseArabicOrWesternNumber(row[targetKey]);

          if (instKey && row[instKey]) {
            const parsedInst = parseArabicOrWesternNumber(row[instKey]);
            if (parsedInst > 0) detectedInstallment = parsedInst;
          }

          if (name && target > 0 && !name.includes('إجمالي') && !name.includes('TOTAL') && !name.includes('GRAND')) {
            detectedRevenue += target;
            newAllocations.push({
              employeeId: id,
              employeeName: name,
              target,
            });
          }
        });

        if (newAllocations.length > 0) {
          const updatedMobiles = Math.round(detectedRevenue * 0.643);
          const updatedAccessories = Math.round(detectedRevenue * 0.1785);
          const updatedOther = detectedRevenue - updatedMobiles - updatedAccessories;

          setMobilesTarget(updatedMobiles);
          setAccessoriesTarget(updatedAccessories);
          setOtherTarget(updatedOther);
          setInstallmentTarget(detectedInstallment);

          const updatedStructure: BranchTotalTargetStructure = {
            grandTotal: detectedRevenue + detectedInstallment,
            installmentTarget: detectedInstallment,
            revenueTarget: detectedRevenue,
            revenueBreakdown: {
              mobiles: updatedMobiles,
              accessories: updatedAccessories,
              other: updatedOther,
            },
            period: targetPeriod,
            daysInMonth,
            dailyRevenueTarget: Math.round(detectedRevenue / daysInMonth),
            dailyGrandTotalTarget: Math.round((detectedRevenue + detectedInstallment) / daysInMonth),
          };

          onApplyNewTargets(newAllocations, updatedStructure);
          setSuccessMessage(
            isAr
              ? `تم استيراد تارجت الفرع بنجاح بإجمالي رفينيو ${formatCurrencyNumber(detectedRevenue, currency, true, language)} وتوزيعه على ${newAllocations.length} موظفين.`
              : `Imported target allocations for ${newAllocations.length} staff.`
          );
          setTimeout(() => {
            setSuccessMessage('');
            onClose();
          }, 1800);
        }
      }
    } catch {
      setErrorMessage(isAr ? 'فشل قراءة شيت التارجت، يرجى مراجعة التنسيق.' : 'Error reading target sheet.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  {isAr ? 'محرك هيكلة وتقسيم تارجت الفرع الكلي' : 'Branch Total Target & Allocation Engine'}
                </h3>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-300 font-mono">
                  {daysInMonth} {isAr ? 'يوماً' : 'days'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {isAr
                  ? 'تارجت الفرع مقسم إلى رفينيو وتقسيط، مع تقسيم الريفينيو لموبايلات وإكسسوارات وأخرى، وتوزيعه على الموظفين الثلاثة'
                  : 'Total target split into Revenue & Installment, sub-divided into Mobiles, Accessories & Other'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs text-emerald-800 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-800 font-semibold">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Quick Upload / Download Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleUploadTargetSheet(e.target.files[0]);
                }
              }}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-3 rounded-xl border border-dashed border-blue-300 bg-blue-50/50 hover:bg-blue-50 flex items-center gap-2.5 text-right transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4 text-blue-600 shrink-0" />
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  {isAr ? 'رفع شيت التارجت المقسم جاهزاً' : 'Upload Target Sheet'}
                </span>
                <span className="text-[11px] text-slate-500">
                  {isAr ? 'استيراد التارجت ونسب التوزيع من Excel' : 'Import allocation from Excel'}
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center gap-2.5 text-right transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  {isAr ? 'تحميل نموذج تقسيم التارجت المعتمد' : 'Download Official Template'}
                </span>
                <span className="text-[11px] text-slate-500">
                  {isAr ? 'شيت Excel به تقسيم الريفينيو، التقسيط الكلي، والـ 3 موظفين' : 'Excel with Revenue, Installment & 3 Staff'}
                </span>
              </div>
            </button>
          </div>

          {/* Period & Month Days Settings Banner */}
          <div className="bg-gradient-to-r from-blue-950 via-indigo-900 to-slate-900 text-white rounded-xl p-4 border border-blue-500/30 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-300 flex items-center justify-center font-bold">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>{isAr ? `إعدادات الشهر المستهدف (${targetPeriod})` : `Target Period (${targetPeriod})`}</span>
                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] px-2 py-0.2 rounded-full font-mono">
                      {daysInMonth} {isAr ? 'يوماً' : 'days'}
                    </span>
                  </h4>
                  <p className="text-[11px] text-blue-200 mt-0.5">
                    {isAr
                      ? 'يتم حساب معدل الجري اليومي (Daily Run-rate) تلقائياً على مدار 31 يوماً كاملة'
                      : 'Daily run rate calculated dynamically across all 31 days'}
                  </p>
                </div>
              </div>

              <div className="text-right sm:text-left bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 font-mono">
                <div className="text-[10px] text-blue-200">
                  {isAr ? `المستهدف اليومي الشامل (${daysInMonth} يوم)` : `Daily Grand Target (${daysInMonth}d)`}
                </div>
                <div className="text-sm font-bold text-emerald-300 tabular-nums">
                  {formatCurrencyNumber(dailyGrandTotalTarget, currency, true, language)}
                  <span className="text-[10px] text-white/70"> / {isAr ? 'يوم' : 'day'}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/10 text-xs">
              <div>
                <label className="text-[11px] text-blue-200 block mb-1 font-medium">
                  {isAr ? 'الشهر المستهدف:' : 'Target Month:'}
                </label>
                <select
                  value={targetPeriod}
                  onChange={(e) => setTargetPeriod(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-2.5 py-1.5 text-white font-medium text-xs focus:ring-1 focus:ring-blue-400"
                >
                  <option value="أكتوبر 2026">أكتوبر 2026 (شهر 10 - 31 يوماً)</option>
                  <option value="مارس 2026">مارس 2026 (31 يوماً)</option>
                  <option value="فبراير 2026">فبراير 2026 (28 يوماً)</option>
                  <option value="يناير 2026">يناير 2026 (31 يوماً)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-blue-200 block mb-1 font-medium">
                  {isAr ? 'عدد أيام الشهر:' : 'Days in Month:'}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="28"
                    max="31"
                    value={daysInMonth}
                    onChange={(e) => setDaysInMonth(Math.max(28, Math.min(31, Number(e.target.value) || 31)))}
                    className="w-20 bg-slate-800 border border-slate-600 rounded-lg px-2.5 py-1.5 text-white font-mono font-bold text-xs"
                  />
                  <span className="text-xs text-blue-200 font-medium">
                    {isAr ? 'يوماً (شهر 10 = 31 يوماً كاملاً)' : 'days (Oct = 31 full days)'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 1: Total Branch Target Split: Revenue & Installment */}
          <div className="bg-slate-50/90 rounded-2xl p-4 sm:p-5 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-blue-600" />
                  <span>{isAr ? '1. هيكل تارجت الفرع الكلي (ريفينيو + تقسيط)' : '1. Total Branch Target Breakdown'}</span>
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {isAr
                    ? 'إجمالي تارجت الفرع مقسم إلى رفينيو وتقسيط، وتارجت التقسيط تارجت كلي عام للفرع'
                    : 'Grand total split into Revenue & Collective Installment'}
                </p>
              </div>

              <div className="text-right sm:text-left bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs font-mono">
                <span className="text-[10px] text-slate-500 block">{isAr ? 'الإجمالي الكلي الشامل:' : 'Grand Total:'}</span>
                <span className="text-base font-extrabold text-blue-950 tabular-nums">
                  {formatCurrencyNumber(grandTotal, currency, true, language)}
                </span>
              </div>
            </div>

            {/* Two Pillars: Collective Installment vs Revenue */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Pillar A: Installment Target (Collective) */}
              <div className="bg-amber-50/60 rounded-xl p-4 border border-amber-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                    <CreditCard className="w-4 h-4 text-amber-600" />
                    <span>{isAr ? 'تارجت التقسيط والتمويل (تارجت كلي للفرع)' : 'Installment Target (Collective)'}</span>
                  </div>
                  <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-300">
                    {isAr ? 'تارجت كلي عام' : 'Branch-wide'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    value={installmentTarget}
                    onChange={(e) => setInstallmentTarget(Math.max(0, Number(e.target.value) || 0))}
                    className="flex-1 px-3 py-2 text-sm font-mono tabular-nums font-bold bg-white border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500/20 text-left"
                  />
                  <span className="text-xs font-bold text-amber-900 font-mono">
                    {formatCurrencyNumber(installmentTarget, currency, true, language)}
                  </span>
                </div>

                <div className="p-2 bg-amber-100/70 rounded-lg text-[11px] text-amber-900 leading-relaxed flex items-start gap-1.5">
                  <Info className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                  <span>
                    {isAr
                      ? 'ملاحظة: تارجت التقسيط تارجت كلي للفرع بالكامل، لذا يُستبعد من التقسيم الفردي ويُتابع جماعياً على مستوى الفرع.'
                      : 'Installment target is a collective branch goal, excluded from individual splits.'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-amber-900 pt-1 border-t border-amber-200/60">
                  <span>{isAr ? `المعدل اليومي للتقسيط (${daysInMonth} يوم):` : `Daily Installment Pace:`}</span>
                  <span className="font-bold">{formatCurrencyNumber(dailyInstallmentTarget, currency, true, language)} / {isAr ? 'يوم' : 'day'}</span>
                </div>
              </div>

              {/* Pillar B: Revenue Target (To be split among 3 staff) */}
              <div className="bg-emerald-50/60 rounded-xl p-4 border border-emerald-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-950">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <span>{isAr ? 'إجمالي تارجت الريفينيو (الموزع على الموظفين)' : 'Revenue Target (To Divide)'}</span>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                    {isAr ? 'يُقسّم على 3 موظفين' : 'Split on 3 Staff'}
                  </span>
                </div>

                <div className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-emerald-300">
                  <span className="text-xs text-slate-500 font-medium">
                    {isAr ? 'مجموع (موبايلات + إكسسوارات + أخرى):' : 'Sum of categories:'}
                  </span>
                  <span className="text-sm sm:text-base font-extrabold text-emerald-950 font-mono tabular-nums">
                    {formatCurrencyNumber(revenueTarget, currency, true, language)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-emerald-900 pt-1 border-t border-emerald-200/60">
                  <span>{isAr ? `المعدل اليومي للريفينيو (${daysInMonth} يوم):` : `Daily Revenue Pace:`}</span>
                  <span className="font-bold">{formatCurrencyNumber(dailyRevenueTarget, currency, true, language)} / {isAr ? 'يوم' : 'day'}</span>
                </div>
              </div>
            </div>

            {/* Revenue Sub-Division: Mobiles + Accessories + Other (Screens & ACs) */}
            <div className="pt-2 border-t border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900">
                  {isAr
                    ? '2. تقسيم تارجت الريفينيو إلى (موبايلات، إكسسوارات، و Other كالشاشات والتكييفات):'
                    : '2. Revenue Sub-division (Mobiles, Accessories, Other):'}
                </span>
                <span className="text-[11px] text-blue-700 font-mono font-bold">
                  {formatCurrencyNumber(revenueTarget, currency, true, language)}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. Mobiles Target */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 flex items-center gap-1">
                      <Smartphone className="w-3.5 h-3.5 text-blue-600" />
                      {isAr ? 'تارجت الموبايلات' : 'Mobiles Target'}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono font-bold">
                      {revenueTarget > 0 ? formatPercent((mobilesTarget / revenueTarget) * 100) : '0%'}
                    </span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    value={mobilesTarget}
                    onChange={(e) => setMobilesTarget(Math.max(0, Number(e.target.value) || 0))}
                    className="w-full px-2.5 py-1.5 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 text-left"
                  />
                  <div className="text-[11px] text-slate-600 font-mono text-left rtl:text-right">
                    {formatCurrencyNumber(mobilesTarget, currency, true, language)}
                  </div>
                </div>

                {/* 2. Accessories Target */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 flex items-center gap-1">
                      <Headphones className="w-3.5 h-3.5 text-purple-600" />
                      {isAr ? 'تارجت الإكسسوارات' : 'Accessories Target'}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono font-bold">
                      {revenueTarget > 0 ? formatPercent((accessoriesTarget / revenueTarget) * 100) : '0%'}
                    </span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    value={accessoriesTarget}
                    onChange={(e) => setAccessoriesTarget(Math.max(0, Number(e.target.value) || 0))}
                    className="w-full px-2.5 py-1.5 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-purple-500 text-left"
                  />
                  <div className="text-[11px] text-slate-600 font-mono text-left rtl:text-right">
                    {formatCurrencyNumber(accessoriesTarget, currency, true, language)}
                  </div>
                </div>

                {/* 3. Other Target (Screens, Air Conditioners, etc.) */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 flex items-center gap-1" title={isAr ? 'شاشات وتكييفات وأجهزة أخرى' : 'Screens & ACs'}>
                      <Tv className="w-3.5 h-3.5 text-amber-600" />
                      {isAr ? 'تارجت أخرى (شاشات/تكييف)' : 'Other Target (TV/AC)'}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono font-bold">
                      {revenueTarget > 0 ? formatPercent((otherTarget / revenueTarget) * 100) : '0%'}
                    </span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    value={otherTarget}
                    onChange={(e) => setOtherTarget(Math.max(0, Number(e.target.value) || 0))}
                    className="w-full px-2.5 py-1.5 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-amber-500 text-left"
                  />
                  <div className="text-[11px] text-slate-600 font-mono text-left rtl:text-right">
                    {formatCurrencyNumber(otherTarget, currency, true, language)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Division of Revenue Target Among the 3 Sales Advisors */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span>{isAr ? '3. قسمة تارجت الريفينيو على الموظفين الثلاثة (دون التقسيط):' : '3. Revenue Split Among the 3 Staff:'}</span>
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {isAr
                    ? `يتم توزيع تارجت الريفينيو (${formatCurrencyNumber(revenueTarget, currency, true, language)}) فقط، لأن تارجت التقسيط تارجت كلي عام للفرع.`
                    : `Distributing only the Revenue Target (${formatCurrencyNumber(revenueTarget, currency, true, language)}).`}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`font-mono tabular-nums font-bold text-xs px-2.5 py-1 rounded-lg ${
                    isPercentageValid ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-rose-100 text-rose-800 border border-rose-300'
                  }`}
                >
                  {isAr ? 'مجموع النسب:' : 'Total:'} {totalPercentage}% {isPercentageValid ? '✓' : '(غير مكتمل)'}
                </span>
              </div>
            </div>

            {/* Preset split buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleMethodChange('percentage')}
                className={`p-2.5 rounded-xl border text-right transition-colors cursor-pointer ${
                  method === 'percentage'
                    ? 'border-blue-500 bg-blue-50/70 font-bold text-blue-900 ring-1 ring-blue-500'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="font-bold flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5 text-blue-600" />
                  <span>{isAr ? 'نسب مخصصة (40/35/25)' : 'Custom % (40/35/25)'}</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {isAr ? 'التوزيع المعتمد لفرع كونكورد' : 'Standard Concorde split'}
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleMethodChange('equal')}
                className={`p-2.5 rounded-xl border text-right transition-colors cursor-pointer ${
                  method === 'equal'
                    ? 'border-blue-500 bg-blue-50/70 font-bold text-blue-900 ring-1 ring-blue-500'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="font-bold flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{isAr ? 'تقسيم متساوي (33.3%)' : 'Equal Split (33.3%)'}</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {isAr ? 'توزيع الريفينيو بالتساوي التام' : 'Equal split across 3 reps'}
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleMethodChange('seniority')}
                className={`p-2.5 rounded-xl border text-right transition-colors cursor-pointer ${
                  method === 'seniority'
                    ? 'border-blue-500 bg-blue-50/70 font-bold text-blue-900 ring-1 ring-blue-500'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  <span>{isAr ? 'حسب الأقدمية (45/30/25)' : 'By Seniority (45/30/25)'}</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {isAr ? 'مستشار مبيعات أول vs مستشارين' : 'Senior advisor vs advisors'}
                </div>
              </button>
            </div>

            {/* Individual Employee Cards with category split */}
            <div className="space-y-3">
              {allocations.map((staff) => {
                return (
                  <div
                    key={staff.employeeId}
                    className="p-3.5 sm:p-4 rounded-xl border border-slate-200 bg-white space-y-2.5 text-xs shadow-2xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div>
                        <span className="font-bold text-slate-900 text-sm">{staff.employeeName}</span>
                        <span className="text-[11px] text-slate-400 mx-2 font-mono">ID: {staff.employeeId}</span>
                        <span className="text-[11px] text-slate-500 font-medium">({staff.role})</span>
                      </div>

                      <div className="flex flex-col items-end text-left">
                        <span className="font-mono tabular-nums font-extrabold text-blue-700 text-sm sm:text-base">
                          {formatCurrencyNumber(staff.targetAmount, currency, true, language)}
                        </span>
                        <span className="text-[10px] text-emerald-700 font-semibold font-mono tabular-nums">
                          {isAr ? `المستهدف اليومي (${daysInMonth} يوم): ${formatCurrencyNumber(staff.dailyTarget || 0, currency, true, language)} / يوم` : `Daily (${daysInMonth}d): ${formatCurrencyNumber(staff.dailyTarget || 0, currency, true, language)}/day`}
                        </span>
                      </div>
                    </div>

                    {/* Percentage Slider */}
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={staff.percentage}
                        onChange={(e) => handlePercentageChange(staff.employeeId, Number(e.target.value))}
                        className="flex-1 h-2 bg-slate-200 rounded-lg accent-blue-600 cursor-pointer"
                      />
                      <div className="w-16 flex items-center justify-end font-mono tabular-nums font-bold text-slate-900">
                        <span>{staff.percentage}%</span>
                      </div>
                    </div>

                    {/* Category Share Per Advisor */}
                    <div className="pt-2 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-[11px] font-mono">
                      <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-200/60">
                        <span className="text-[10px] text-slate-500 block">
                          {isAr ? 'موبايلات' : 'Mobiles'}
                        </span>
                        <span className="font-bold text-slate-800">
                          {formatCurrencyNumber(staff.mobilesShare || 0, currency, true, language)}
                        </span>
                      </div>

                      <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-200/60">
                        <span className="text-[10px] text-slate-500 block">
                          {isAr ? 'إكسسوارات' : 'Accessories'}
                        </span>
                        <span className="font-bold text-slate-800">
                          {formatCurrencyNumber(staff.accessoriesShare || 0, currency, true, language)}
                        </span>
                      </div>

                      <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-200/60">
                        <span className="text-[10px] text-slate-500 block">
                          {isAr ? 'شاشات/تكييفات' : 'TV/AC/Other'}
                        </span>
                        <span className="font-bold text-slate-800">
                          {formatCurrencyNumber(staff.otherShare || 0, currency, true, language)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-600">
            <span className="font-bold text-slate-800">{isAr ? 'تأكيد التوزيع:' : 'Confirmation:'}</span>{' '}
            {isAr
              ? `إجمالي رفينيو ${formatCurrencyNumber(revenueTarget, currency, true, language)} على 3 موظفين + تقسيط كلي ${formatCurrencyNumber(installmentTarget, currency, true, language)}.`
              : 'Target distribution ready to apply.'}
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>

            <button
              type="button"
              onClick={handleApply}
              disabled={!isPercentageValid || revenueTarget <= 0}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              <Target className="w-4 h-4" />
              <span>{isAr ? 'تطبيق التارجت المقسم وتحديث النظام' : 'Apply Targets & Update'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
