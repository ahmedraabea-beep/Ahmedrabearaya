import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Copy,
  Download,
  RotateCcw,
  TrendingUp,
  Coins,
  Smartphone,
  Headphones,
  Tv,
  Check,
  ChevronDown,
  ChevronUp,
  Sliders,
  Send,
  Zap,
  Info,
  ShieldCheck,
  Tag,
  Boxes,
} from 'lucide-react';
import {
  reconcileThreeSheetsData,
  ThreeSheetsReconciliationResult,
  DepartmentAchievementItem,
  DetailedSoldProductIncentive,
  ProductMatchingIssue,
} from '../utils/rayaThreeSheetsReconciler';
import { SalesRecord, Language, Currency } from '../types/sales';
import { formatCurrencyNumber, formatPercent } from '../utils/calculations';
import { exportRecordsToExcel } from '../utils/excelParser';
import { CONCORD_BRANCH_NAME } from '../data/sampleData';

interface RayaThreeSheetsReconciliationCardProps {
  language: Language;
  currency: Currency;
  onApplyRecordsToDashboard: (records: SalesRecord[]) => void;
  onOpenMonthlyReport?: () => void;
}

// Default Authentic Concorde Plaza Sample Data Blocks for Quick Testing
const SAMPLE_SALES_TSV = `Sales Rep Name\tSales Rep HR\tItem Code\tItem Description\tQ\tPrice\tAmount\tDepartment Name
أحمد ربيع سيد\t140729\tSAM-S24U-512\tSamsung Galaxy S24 Ultra 512GB\t6\t62000\t372000\tHandsets
أحمد ربيع سيد\t140729\tSAM-A55-256\tSamsung Galaxy A55 5G 256GB\t12\t19800\t237600\tHandsets
أحمد ربيع سيد\t140729\tANK-65W-GAN2\tAnker 735 Charger GaNPrime 65W\t24\t2150\t51600\tAccessories
أحمد ربيع سيد\t140729\tAPP-AIRPODS-PRO2\tApple AirPods Pro 2nd Gen USB-C\t6\t12500\t75000\tAccessories
عمرو عبد الحليم\t41308\tAPP-IPH16PM-256\tApple iPhone 16 Pro Max 256GB\t5\t78500\t392500\tHandsets
عمرو عبد الحليم\t41308\tAPP-AIRPODS-PRO2\tApple AirPods Pro 2nd Gen USB-C\t8\t12500\t100000\tAccessories
عمرو عبد الحليم\t41308\tANK-65W-GAN2\tAnker 735 Charger GaNPrime 65W\t15\t2150\t32250\tAccessories
عمرو عبد الحليم\t41308\tAPP-MBA-M3\tApple MacBook Air 13.6 M3 Chip 256GB\t1\t54000\t54000\tLaptops
طارق محمود\t125177\tXIA-RN13P-256\tXiaomi Redmi Note 13 Pro 256GB\t15\t14200\t213000\tHandsets
طارق محمود\t125177\tSAM-A15-128\tSamsung Galaxy A15 128GB\t10\t7800\t78000\tHandsets
طارق محمود\t125177\tJOY-T03S-PLUS\tJoyroom JR-T03S Plus Earbuds\t20\t1150\t23000\tAccessories
طارق محمود\t125177\tTOR-TV-55-4K\tTornado 55 Inch 4K Smart TV\t2\t18500\t37000\tHome Appliances`;

const SAMPLE_STOCK_TSV = `كود الصنف\tاسم الصنف\tالقسم المعتمد
SAM-S24U-512\tSamsung Galaxy S24 Ultra 512GB\tموبايلات
SAM-A55-256\tSamsung Galaxy A55 5G 256GB\tموبايلات
APP-IPH16PM-256\tApple iPhone 16 Pro Max 256GB\tموبايلات
XIA-RN13P-256\tXiaomi Redmi Note 13 Pro 256GB\tموبايلات
SAM-A15-128\tSamsung Galaxy A15 128GB\tموبايلات
APP-AIRPODS-PRO2\tApple AirPods Pro 2nd Gen USB-C\tإكسسوارات
ANK-65W-GAN2\tAnker 735 Charger GaNPrime 65W\tإكسسوارات
JOY-T03S-PLUS\tJoyroom JR-T03S Plus Earbuds\tإكسسوارات
APP-MBA-M3\tApple MacBook Air 13.6 M3 Chip 256GB\tأجهزة أخرى
TOR-TV-55-4K\tTornado 55 Inch 4K Smart TV\tأجهزة أخرى`;

const SAMPLE_INCENTIVE_TSV = `كود الصنف أو المنتج\tقيمة الحافز لكل قطعة (ج.م)\tنوع الحافز
SAM-S24U-512\t200\tمبلغ ثابت للقطعة
APP-IPH16PM-256\t250\tمبلغ ثابت للقطعة
SAM-A55-256\t100\tمبلغ ثابت للقطعة
XIA-RN13P-256\t100\tمبلغ ثابت للقطعة
APP-AIRPODS-PRO2\t60\tمبلغ ثابت للقطعة
APP-MBA-M3\t350\tمبلغ ثابت للقطعة
JOY-T03S-PLUS\t30\tمبلغ ثابت للقطعة`;

export const RayaThreeSheetsReconciliationCard: React.FC<RayaThreeSheetsReconciliationCardProps> = ({
  language,
  currency,
  onApplyRecordsToDashboard,
  onOpenMonthlyReport,
}) => {
  const isAr = language === 'ar';

  // Target Configuration Inputs
  const [mobilesTargetInput, setMobilesTargetInput] = useState<number>(980000);
  const [accessoriesTargetInput, setAccessoriesTargetInput] = useState<number>(210000);
  const [otherTargetInput, setOtherTargetInput] = useState<number>(210000);

  // 3-Way TSV Inputs
  const [salesTsv, setSalesTsv] = useState<string>(SAMPLE_SALES_TSV);
  const [stockTsv, setStockTsv] = useState<string>(SAMPLE_STOCK_TSV);
  const [incentiveTsv, setIncentiveTsv] = useState<string>(SAMPLE_INCENTIVE_TSV);

  // Computed State
  const [reconciledResult, setReconciledResult] = useState<ThreeSheetsReconciliationResult | null>(() => {
    return reconcileThreeSheetsData({
      salesData: SAMPLE_SALES_TSV,
      stockData: SAMPLE_STOCK_TSV,
      incentiveData: SAMPLE_INCENTIVE_TSV,
      targets: {
        mobilesTarget: 980000,
        accessoriesTarget: 210000,
        otherTarget: 210000,
      },
    });
  });

  const [activeOutputTab, setActiveOutputTab] = useState<'targets' | 'incentives' | 'issues'>('targets');
  const [isCopiedMarkdown, setIsCopiedMarkdown] = useState(false);
  const [isCopiedTsv, setIsCopiedTsv] = useState(false);
  const [isAppliedSuccess, setIsAppliedSuccess] = useState(false);
  const [isEditorExpanded, setIsEditorExpanded] = useState(false);

  const grandTargetCalculated = mobilesTargetInput + accessoriesTargetInput + otherTargetInput;

  // Process the 3 tables on demand
  const handleExecuteReconciliation = () => {
    const result = reconcileThreeSheetsData({
      salesData: salesTsv.trim(),
      stockData: stockTsv.trim(),
      incentiveData: incentiveTsv.trim(),
      targets: {
        mobilesTarget: mobilesTargetInput,
        accessoriesTarget: accessoriesTargetInput,
        otherTarget: otherTargetInput,
        grandTotalTarget: grandTargetCalculated,
      },
    });
    setReconciledResult(result);
    setIsAppliedSuccess(false);
  };

  const handleResetToBaseline = () => {
    setMobilesTargetInput(980000);
    setAccessoriesTargetInput(210000);
    setOtherTargetInput(210000);
    setSalesTsv(SAMPLE_SALES_TSV);
    setStockTsv(SAMPLE_STOCK_TSV);
    setIncentiveTsv(SAMPLE_INCENTIVE_TSV);

    const result = reconcileThreeSheetsData({
      salesData: SAMPLE_SALES_TSV,
      stockData: SAMPLE_STOCK_TSV,
      incentiveData: SAMPLE_INCENTIVE_TSV,
      targets: {
        mobilesTarget: 980000,
        accessoriesTarget: 210000,
        otherTarget: 210000,
      },
    });
    setReconciledResult(result);
  };

  const handleApplyToDashboard = () => {
    if (!reconciledResult || reconciledResult.auditedRecords.length === 0) return;
    onApplyRecordsToDashboard(reconciledResult.auditedRecords);
    setIsAppliedSuccess(true);
    setTimeout(() => setIsAppliedSuccess(false), 4000);
  };

  // Build clean text/TSV report for sharing
  const generateExportText = (format: 'tsv' | 'markdown'): string => {
    if (!reconciledResult) return '';

    if (format === 'markdown') {
      let md = `### تقرير مطابقة وتحقيق التارجت والحوافز - فرع راية كونكورد بلازا\n\n`;
      md += `#### 1. جدول تحقيق التارجت المالي للأقسام\n`;
      md += `| القسم | إجمالي المبيعات المحققة | التارجت المطلوب | نسبة التحقيق % | الحالة |\n`;
      md += `| :--- | :---: | :---: | :---: | :---: |\n`;
      reconciledResult.departmentAchievements.forEach((d) => {
        md += `| ${d.departmentNameAr} | ${d.actualSales.toLocaleString()} ج.م | ${d.targetRequired.toLocaleString()} ج.م | ${d.achievementRate.toFixed(1)}% | ${d.isAchieved ? 'محقق ✅' : 'قيد المتابعة ⏳'} |\n`;
      });

      md += `\n#### 2. جدول الحوافز التفصيلي للقطع المباعة\n`;
      md += `| اسم المندوب | كود الصنف | المنتج المباع | الكمية | حافز القطعة | إجمالي الحافز |\n`;
      md += `| :--- | :---: | :--- | :---: | :---: | :---: |\n`;
      reconciledResult.detailedIncentives.forEach((inc) => {
        md += `| ${inc.salesRepName} | ${inc.itemCode || '-'} | ${inc.productSold} | ${inc.quantity} | ${inc.unitIncentive} ج.م | ${inc.totalEarnedIncentive.toLocaleString()} ج.م |\n`;
      });

      md += `\n#### 3. قائمة الملاحظات والأصناف بالقاعدة الاحتياطية (${reconciledResult.matchingIssues.length} صنف)\n`;
      md += `| كود الصنف | وصف المنتج | القسم | حالة المخزون | الحافز | الملاحظة والمعالجة |\n`;
      md += `| :---: | :--- | :---: | :---: | :---: | :--- |\n`;
      reconciledResult.matchingIssues.forEach((issue) => {
        md += `| ${issue.itemCode || '-'} | ${issue.productDescription} | ${issue.departmentAr} | ${issue.stockStatus === 'found_in_stock' ? 'موجود' : 'غير مدرج'} | ${issue.incentiveStatusAr} | ${issue.notesAr} |\n`;
      });

      return md;
    } else {
      let tsv = `القسم\tإجمالي المبيعات المحققة\tالتارجت المطلوب\tنسبة التحقيق %\tالحالة\n`;
      reconciledResult.departmentAchievements.forEach((d) => {
        tsv += `${d.departmentNameAr}\t${d.actualSales}\t${d.targetRequired}\t${d.achievementRate.toFixed(1)}%\t${d.isAchieved ? 'محقق' : 'غير محقق'}\n`;
      });
      tsv += `\nاسم المندوب\tكود الموظف\tكود الصنف\tالمنتج المباع\tالكمية\tحافز القطعة\tإجمالي الحافز المستحق\n`;
      reconciledResult.detailedIncentives.forEach((inc) => {
        tsv += `${inc.salesRepName}\t${inc.employeeId || ''}\t${inc.itemCode || ''}\t${inc.productSold}\t${inc.quantity}\t${inc.unitIncentive}\t${inc.totalEarnedIncentive}\n`;
      });
      return tsv;
    }
  };

  const handleCopyReport = (format: 'tsv' | 'markdown') => {
    const txt = generateExportText(format);
    navigator.clipboard.writeText(txt);
    if (format === 'markdown') {
      setIsCopiedMarkdown(true);
      setTimeout(() => setIsCopiedMarkdown(false), 3000);
    } else {
      setIsCopiedTsv(true);
      setTimeout(() => setIsCopiedTsv(false), 3000);
    }
  };

  return (
    <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950 text-white rounded-3xl border-2 border-indigo-500/40 shadow-2xl overflow-hidden mt-6">
      {/* 1. Header Banner */}
      <div className="p-5 sm:p-7 bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-900 border-b border-indigo-500/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-blue-500/20 text-blue-300 border border-blue-400/40 text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1.5 shadow-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>{isAr ? 'نظام التحويل والتوحيد المعتمد لمنظومة راية' : 'Certified Raya Unification System'}</span>
              </span>
              <span className="bg-amber-500/20 text-amber-300 border border-amber-400/40 text-xs px-2.5 py-0.5 rounded-full font-bold font-mono">
                {isAr ? 'فرع كونكورد بلازا · 0032' : 'Concorde Plaza 0032'}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <span>
                {isAr
                  ? 'محرك المطابقة الثلاثية الذكي (شيت المبيعات × المخزون × الحوافز والتارجت)'
                  : '3-Way Precision Reconciler (Sales × Stock × Incentives & Targets)'}
              </span>
              <Sparkles className="w-5 h-5 text-amber-400" />
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
              {isAr
                ? 'معالجة رياضية تامة دون افتراضات: تصنيف الصنف بالبحث في شيت المخزون أولاً ثم القاعدة الاحتياطية، احتساب الحافز حصرياً للأصناف المدرجة بلائحة الحوافز (الكمية × حافز القطعة)، والصفر للأصناف غير المدرجة.'
                : '100% Mathematical precision: Stock lookup with nature fallback, per-piece incentive calculation strictly for listed items, and category target tracking.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start lg:self-auto">
            <button
              type="button"
              onClick={() => setIsEditorExpanded(!isEditorExpanded)}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/20 cursor-pointer"
            >
              <Sliders className="w-4 h-4 text-blue-300" />
              <span>{isEditorExpanded ? (isAr ? 'إخفاء محررات الجداول' : 'Hide Editors') : (isAr ? 'تعديل الجداول والتارجت' : 'Edit Tables & Targets')}</span>
              {isEditorExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={handleApplyToDashboard}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs transition-all shadow-md cursor-pointer ${
                isAppliedSuccess
                  ? 'bg-emerald-500 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white active:scale-95'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span>{isAppliedSuccess ? (isAr ? 'تم التطبيق بنجاح!' : 'Applied!') : (isAr ? 'تطبيق النتائج في لوحة التحكم' : 'Apply to Dashboard')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Target Configuration & TSV Inputs Drawer (Expandable) */}
      {isEditorExpanded && (
        <div className="p-5 sm:p-6 bg-slate-950/80 border-b border-indigo-500/20 space-y-5 animate-in fade-in duration-200">
          {/* Target Inputs Row */}
          <div>
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                <span>{isAr ? 'تحديد أهداف الأقسام للفرع (Branch Category Targets):' : 'Branch Targets Split:'}</span>
              </h3>
              <button
                type="button"
                onClick={handleResetToBaseline}
                className="text-[11px] font-semibold text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{isAr ? 'استعادة الأهداف والبيانات النموذجية لكونكورد' : 'Reset to Concorde Baseline'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-slate-900/90 rounded-xl p-3 border border-emerald-500/30">
                <label className="text-[11px] font-bold text-emerald-300 block mb-1">
                  {isAr ? '1. تارجت قسم الموبايلات (ج.م):' : '1. Mobiles Target (EGP):'}
                </label>
                <input
                  type="number"
                  value={mobilesTargetInput}
                  onChange={(e) => setMobilesTargetInput(Number(e.target.value) || 0)}
                  className="w-full bg-slate-800 text-white text-sm font-bold font-mono px-3 py-1.5 rounded-lg border border-slate-700 focus:border-emerald-400 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  {isAr ? 'يمثل 70% من مستهدف الفرع' : '70% of branch revenue'}
                </span>
              </div>

              <div className="bg-slate-900/90 rounded-xl p-3 border border-blue-500/30">
                <label className="text-[11px] font-bold text-blue-300 block mb-1">
                  {isAr ? '2. تارجت قسم الإكسسوارات (ج.م):' : '2. Accessories Target (EGP):'}
                </label>
                <input
                  type="number"
                  value={accessoriesTargetInput}
                  onChange={(e) => setAccessoriesTargetInput(Number(e.target.value) || 0)}
                  className="w-full bg-slate-800 text-white text-sm font-bold font-mono px-3 py-1.5 rounded-lg border border-slate-700 focus:border-blue-400 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  {isAr ? 'يمثل 15% من مستهدف الفرع' : '15% of branch revenue'}
                </span>
              </div>

              <div className="bg-slate-900/90 rounded-xl p-3 border border-purple-500/30">
                <label className="text-[11px] font-bold text-purple-300 block mb-1">
                  {isAr ? '3. تارجت قسم Other والشاشات (ج.م):' : '3. Other Target (EGP):'}
                </label>
                <input
                  type="number"
                  value={otherTargetInput}
                  onChange={(e) => setOtherTargetInput(Number(e.target.value) || 0)}
                  className="w-full bg-slate-800 text-white text-sm font-bold font-mono px-3 py-1.5 rounded-lg border border-slate-700 focus:border-purple-400 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  {isAr ? 'يمثل 15% من مستهدف الفرع' : '15% of branch revenue'}
                </span>
              </div>

              <div className="bg-slate-900/90 rounded-xl p-3 border border-amber-500/40 flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-bold text-amber-300 block mb-1">
                    {isAr ? 'إجمالي مستهدف الفرع الكلي:' : 'Total Branch Target:'}
                  </span>
                  <strong className="text-base font-black text-white font-mono block">
                    {grandTargetCalculated.toLocaleString()} ج.م
                  </strong>
                </div>
                <span className="text-[10px] text-amber-200/80">
                  {isAr ? 'تارجت فرع كونكورد بلازا المعتمد' : 'Official Concorde Baseline'}
                </span>
              </div>
            </div>
          </div>

          {/* 3 TSV Text Input Editors */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-2">
            {/* Box 1: Sales TSV */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>[1. شيت المبيعات - TSV / جدول]</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {salesTsv.split('\n').filter(Boolean).length - 1} حركة
                </span>
              </div>
              <textarea
                value={salesTsv}
                onChange={(e) => setSalesTsv(e.target.value)}
                placeholder="(انسخ بيانات شيت المبيعات هنا بصيغة TSV أو فواصل)"
                rows={8}
                className="w-full bg-slate-900 text-emerald-200 text-xs font-mono p-3 rounded-xl border border-slate-700 focus:border-emerald-400 focus:outline-none resize-none leading-relaxed"
              />
            </div>

            {/* Box 2: Stock TSV */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                  <Boxes className="w-3.5 h-3.5" />
                  <span>[2. شيت المخزون - TSV / جدول]</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {stockTsv.split('\n').filter(Boolean).length - 1} صنف
                </span>
              </div>
              <textarea
                value={stockTsv}
                onChange={(e) => setStockTsv(e.target.value)}
                placeholder="(انسخ بيانات شيت المخزون وتصنيفاتها هنا)"
                rows={8}
                className="w-full bg-slate-900 text-blue-200 text-xs font-mono p-3 rounded-xl border border-slate-700 focus:border-blue-400 focus:outline-none resize-none leading-relaxed"
              />
            </div>

            {/* Box 3: Incentive TSV */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5" />
                  <span>[3. شيت الحافز المستحق - TSV / جدول]</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {incentiveTsv.split('\n').filter(Boolean).length - 1} قاعدة
                </span>
              </div>
              <textarea
                value={incentiveTsv}
                onChange={(e) => setIncentiveTsv(e.target.value)}
                placeholder="(انسخ المنتجات التي عليها حافز وقيمة الحافز لكل قطعة هنا)"
                rows={8}
                className="w-full bg-slate-900 text-amber-200 text-xs font-mono p-3 rounded-xl border border-slate-700 focus:border-amber-400 focus:outline-none resize-none leading-relaxed"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 flex-wrap gap-3">
            <p className="text-xs text-slate-400">
              {isAr
                ? '💡 يمكنك لصق الجداول مباشرة من إكسيل (Ctrl+V) كـ TSV بمجرد نسخها.'
                : '💡 Paste directly from Excel tables with tab separations.'}
            </p>
            <button
              type="button"
              onClick={handleExecuteReconciliation}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-md cursor-pointer transition-all active:scale-95"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              <span>{isAr ? 'إعادة معالجة واستخراج التقارير الثلاثة' : 'Re-run 3-Way Reconciliation'}</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. Output Tabs Navigation */}
      <div className="p-4 sm:px-6 bg-slate-900/70 border-b border-indigo-500/20 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveOutputTab('targets')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeOutputTab === 'targets'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>{isAr ? '1. جدول تحقيق التارجت المالي' : '1. Target Achievements'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveOutputTab('incentives')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeOutputTab === 'incentives'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            <Coins className="w-4 h-4 text-amber-300" />
            <span>{isAr ? '2. جدول الحوافز التفصيلي للقطع' : '2. Detailed Incentives'}</span>
            <span className="text-[10px] bg-black/20 px-1.5 py-0.2 rounded-full font-mono">
              {reconciledResult?.detailedIncentives.filter((i) => i.isEligible).length || 0}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveOutputTab('issues')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeOutputTab === 'issues'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            <Info className="w-4 h-4 text-purple-300" />
            <span>{isAr ? '3. تقرير المطابقة والملاحظات' : '3. Matching Issues'}</span>
            <span className="text-[10px] bg-black/20 px-1.5 py-0.2 rounded-full font-mono">
              {reconciledResult?.matchingIssues.length || 0}
            </span>
          </button>
        </div>

        {/* Copy & Export Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleCopyReport('markdown')}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title={isAr ? 'نسخ الجداول بصيغة Markdown' : 'Copy tables as Markdown'}
          >
            {isCopiedMarkdown ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{isCopiedMarkdown ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ التقرير' : 'Copy')}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (reconciledResult) {
                exportRecordsToExcel(reconciledResult.auditedRecords, undefined, language);
              }
            }}
            className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            title={isAr ? 'تصدير شيت المبيعات المعالج إلى إكسيل' : 'Export Excel'}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Excel</span>
          </button>
        </div>
      </div>

      {/* 4. Tab Body */}
      <div className="p-5 sm:p-6 space-y-6">
        {/* ========================================================= */}
        {/* TAB 1: TARGET ACHIEVEMENTS TABLE                          */}
        {/* ========================================================= */}
        {activeOutputTab === 'targets' && (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-800/80 border-b border-indigo-500/30 text-slate-300 font-bold select-none">
                    <th className="p-3.5 rounded-r-xl">
                      {isAr ? 'القسم التجاري' : 'Department'}
                    </th>
                    <th className="p-3.5 text-center">
                      {isAr ? 'إجمالي المبيعات المحققة' : 'Actual Sales'}
                    </th>
                    <th className="p-3.5 text-center">
                      {isAr ? 'التارجت المطلوب' : 'Target Required'}
                    </th>
                    <th className="p-3.5 text-center">
                      {isAr ? 'الفارق المالي (ج.م)' : 'Variance'}
                    </th>
                    <th className="p-3.5 text-center min-w-[140px]">
                      {isAr ? 'نسبة التحقيق (%)' : 'Achievement %'}
                    </th>
                    <th className="p-3.5 rounded-l-xl text-center">
                      {isAr ? 'الحالة المعتمدة' : 'Status'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                  {reconciledResult?.departmentAchievements.map((dept) => {
                    const isTotal = dept.department === 'total';
                    const isMobiles = dept.department === 'mobiles';
                    const isAccessories = dept.department === 'accessories';

                    return (
                      <tr
                        key={dept.department}
                        className={`transition-colors ${
                          isTotal
                            ? 'bg-indigo-950/60 font-black text-white text-sm border-t-2 border-indigo-500/50'
                            : 'hover:bg-slate-800/40 text-slate-200'
                        }`}
                      >
                        <td className="p-3.5 font-sans font-bold flex items-center gap-2">
                          {isMobiles && <Smartphone className="w-4 h-4 text-emerald-400" />}
                          {isAccessories && <Headphones className="w-4 h-4 text-blue-400" />}
                          {dept.department === 'other' && <Tv className="w-4 h-4 text-purple-400" />}
                          {isTotal && <Layers className="w-4 h-4 text-amber-400" />}
                          <span>{dept.departmentNameAr}</span>
                        </td>

                        <td className="p-3.5 text-center font-bold text-white">
                          {dept.actualSales.toLocaleString()} ج.م
                        </td>

                        <td className="p-3.5 text-center text-slate-300">
                          {dept.targetRequired.toLocaleString()} ج.م
                        </td>

                        <td className={`p-3.5 text-center font-bold ${dept.difference >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {dept.difference >= 0 ? `+${dept.difference.toLocaleString()}` : dept.difference.toLocaleString()} ج.م
                        </td>

                        <td className="p-3.5 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className={`font-black text-xs ${dept.achievementRate >= 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
                              {dept.achievementRate.toFixed(1)}%
                            </span>
                            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  dept.achievementRate >= 100 ? 'bg-emerald-500' : 'bg-amber-500'
                                }`}
                                style={{ width: `${Math.min(100, dept.achievementRate)}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        <td className="p-3.5 text-center">
                          {dept.isAchieved ? (
                            <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span>{isAr ? 'محقق وتجاوز الهدف' : 'Achieved'}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-400/40 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                              <span>{isAr ? 'قيد المتابعة' : 'Pending'}</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Quick KPI highlight banner */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
              <div className="bg-slate-900/90 rounded-2xl p-3.5 border border-indigo-500/30 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 block">{isAr ? 'إجمالي المبيعات المحققة' : 'Total Revenue'}</span>
                  <strong className="text-base font-black text-white font-mono">
                    {reconciledResult?.summary.totalSales.toLocaleString()} ج.م
                  </strong>
                </div>
                <TrendingUp className="w-6 h-6 text-emerald-400" />
              </div>

              <div className="bg-slate-900/90 rounded-2xl p-3.5 border border-indigo-500/30 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 block">{isAr ? 'إجمالي الحوافز المستحقة' : 'Total Earned Incentives'}</span>
                  <strong className="text-base font-black text-amber-400 font-mono">
                    {reconciledResult?.summary.totalIncentives.toLocaleString()} ج.م
                  </strong>
                </div>
                <Coins className="w-6 h-6 text-amber-400" />
              </div>

              <div className="bg-slate-900/90 rounded-2xl p-3.5 border border-indigo-500/30 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 block">{isAr ? 'نسبة التحقيق العامة للفرع' : 'Overall Achievement'}</span>
                  <strong className="text-base font-black text-blue-400 font-mono">
                    {reconciledResult?.summary.overallAchievementRate.toFixed(1)}%
                  </strong>
                </div>
                <CheckCircle2 className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: DETAILED INCENTIVES TABLE (Per-piece Incentive)     */}
        {/* ========================================================= */}
        {activeOutputTab === 'incentives' && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-400/30 text-xs text-amber-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  {isAr
                    ? 'قاعدة احتساب الحافز (Per-piece): يُستحق الحافز فقط للأصناف المدرجة حرفياً في شيت الحوافز (الكمية المباعة × قيمة حافز القطعة)، وقيمة الحافز = صفر لأي صنف غير مدرج.'
                    : 'Strict per-piece calculation: (Qty sold × Unit incentive). Unlisted items strictly earn 0 EGP.'}
                </span>
              </div>
              <span className="font-mono font-bold text-amber-300 shrink-0">
                {isAr ? 'إجمالي الحوافز:' : 'Total:'} {reconciledResult?.summary.totalIncentives.toLocaleString()} ج.م
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-800/80 border-b border-indigo-500/30 text-slate-300 font-bold select-none">
                    <th className="p-3 rounded-r-xl">#</th>
                    <th className="p-3">{isAr ? 'اسم المندوب' : 'Sales Advisor'}</th>
                    <th className="p-3">{isAr ? 'كود الصنف' : 'Item Code'}</th>
                    <th className="p-3">{isAr ? 'المنتج المباع' : 'Product Sold'}</th>
                    <th className="p-3 text-center">{isAr ? 'القسم' : 'Category'}</th>
                    <th className="p-3 text-center">{isAr ? 'الكمية' : 'Qty'}</th>
                    <th className="p-3 text-center">{isAr ? 'حافز القطعة' : 'Unit Incentive'}</th>
                    <th className="p-3 rounded-l-xl text-center font-bold text-amber-300">
                      {isAr ? 'إجمالي الحافز المستحق' : 'Total Incentive'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {reconciledResult?.detailedIncentives.map((item, idx) => (
                    <tr
                      key={item.id}
                      className={`transition-colors ${
                        item.isEligible
                          ? 'hover:bg-amber-500/10 text-slate-200'
                          : 'opacity-60 hover:opacity-100 text-slate-400'
                      }`}
                    >
                      <td className="p-3 text-slate-500 text-center">{idx + 1}</td>
                      <td className="p-3 font-sans font-bold text-white whitespace-nowrap">
                        {item.salesRepName}
                      </td>
                      <td className="p-3 text-slate-400 whitespace-nowrap">
                        {item.itemCode || '-'}
                      </td>
                      <td className="p-3 font-sans text-slate-200">
                        {item.productSold}
                      </td>
                      <td className="p-3 text-center">
                        <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded-full text-slate-300 font-sans">
                          {item.departmentAr}
                        </span>
                      </td>
                      <td className="p-3 text-center font-bold text-white">
                        {item.quantity}
                      </td>
                      <td className="p-3 text-center text-slate-300">
                        {item.unitIncentive > 0 ? `${item.unitIncentive} ج.م` : '0 (غير مدرج)'}
                      </td>
                      <td className="p-3 text-center font-bold text-amber-300">
                        {item.totalEarnedIncentive > 0 ? `${item.totalEarnedIncentive.toLocaleString()} ج.م` : '0 ج.م'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: MATCHING ISSUES & UNRECOGNIZED ITEMS               */}
        {/* ========================================================= */}
        {activeOutputTab === 'issues' && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-400/30 text-xs text-purple-200 flex items-center gap-2">
              <Info className="w-4 h-4 text-purple-400 shrink-0" />
              <span>
                {isAr
                  ? 'قائمة بالمنتجات المباعة التي صُنفت وفق القاعدة الاحتياطية (لعدم وجودها بشيت المخزون)، أو لم يتم العثور على حافز لها بلائحة العمولات فتم احتساب حافزها = 0 ج.م بدقة رياضية.'
                  : 'Items resolved via nature fallback rule or unlisted in the incentive sheet.'}
              </span>
            </div>

            {reconciledResult?.matchingIssues.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/60 rounded-2xl border border-slate-800 text-slate-400">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="font-bold text-white text-sm">
                  {isAr ? 'كافة المنتجات مطابقة 100% مع شيت المخزون ولائحة الحوافز' : 'All items 100% matched'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-800/80 border-b border-indigo-500/30 text-slate-300 font-bold select-none">
                      <th className="p-3 rounded-r-xl">#</th>
                      <th className="p-3">{isAr ? 'كود الصنف' : 'Item Code'}</th>
                      <th className="p-3">{isAr ? 'وصف المنتج في شيت المبيعات' : 'Product Description'}</th>
                      <th className="p-3 text-center">{isAr ? 'القسم المعتمد' : 'Category'}</th>
                      <th className="p-3 text-center">{isAr ? 'حالة شيت المخزون' : 'Stock Match'}</th>
                      <th className="p-3 text-center">{isAr ? 'حالة شيت الحوافز' : 'Incentive Match'}</th>
                      <th className="p-3 rounded-l-xl">{isAr ? 'المعالجة المعتمدة' : 'Resolution'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {reconciledResult?.matchingIssues.map((issue, idx) => (
                      <tr key={issue.id} className="hover:bg-slate-800/40 text-slate-200">
                        <td className="p-3 text-slate-500 text-center">{idx + 1}</td>
                        <td className="p-3 text-slate-400 whitespace-nowrap">{issue.itemCode || '-'}</td>
                        <td className="p-3 font-sans font-bold text-white">{issue.productDescription}</td>
                        <td className="p-3 text-center">
                          <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded-full text-slate-300 font-sans">
                            {issue.departmentAr}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          {issue.stockStatus === 'found_in_stock' ? (
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-sans">
                              {isAr ? 'مطابق بالمخزون' : 'In Stock'}
                            </span>
                          ) : (
                            <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-sans">
                              {isAr ? 'غير مدرج بالمخزون' : 'Not in Stock'}
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-center font-sans text-xs">
                          {issue.incentiveStatusAr}
                        </td>
                        <td className="p-3 font-sans text-xs text-slate-300">
                          {issue.notesAr}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
