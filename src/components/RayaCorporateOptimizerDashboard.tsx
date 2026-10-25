import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Boxes,
  UploadCloud,
  FileSpreadsheet,
  Download,
  Copy,
  CheckCircle2,
  AlertTriangle,
  Send,
  Mail,
  Sliders,
  ArrowRightLeft,
  Truck,
  Zap,
  TrendingUp,
  RefreshCw,
  Search,
  Check,
  Building,
  DollarSign,
  PackageCheck,
  Clock,
  Sparkles,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import {
  InventoryItem,
  InventoryAnalysisReport,
  UrgentTransferRecommendation,
  CrossBranchSellingItem,
  OverstockAgingItem,
  SmartAlternativeMapping,
} from '../types/inventory';
import {
  DEFAULT_CONCORDE_INVENTORY_ITEMS,
  loadSavedConcordeInventoryItems,
  saveConcordeInventoryItems,
  executeInventoryOptimization,
  parseUploadedInventorySheet,
  exportTransferOrderToExcel,
  generateOfficialExecutiveEmailText,
} from '../utils/inventoryOptimizerService';
import { Language, Currency, BranchTotalTargetStructure } from '../types/sales';
import * as XLSX from 'xlsx';

interface RayaCorporateOptimizerDashboardProps {
  language?: Language;
  currency?: Currency;
  targetStructure?: BranchTotalTargetStructure;
  totalActualSales?: number;
  items?: InventoryItem[];
  onUpdateItems?: (items: InventoryItem[], fileName?: string) => void;
}

export const RayaCorporateOptimizerDashboard: React.FC<RayaCorporateOptimizerDashboardProps> = ({
  language = 'ar',
  currency = 'EGP',
  targetStructure = {
    grandTotal: 1750000,
    installmentTarget: 350000,
    revenueTarget: 1400000,
    revenueBreakdown: { mobiles: 900000, accessories: 250000, other: 250000 },
    period: 'أكتوبر 2026',
    daysInMonth: 31,
    dailyRevenueTarget: 45161,
    dailyGrandTotalTarget: 56452,
  },
  totalActualSales = 1489450,
  items: externalItems,
  onUpdateItems,
}) => {
  const isAr = language === 'ar';
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Core inventory state initialized from localStorage
  const [internalItems, setInternalItems] = useState<InventoryItem[]>(() =>
    loadSavedConcordeInventoryItems()
  );

  useEffect(() => {
    const handleInvUpdate = () => {
      setInternalItems(loadSavedConcordeInventoryItems());
    };
    window.addEventListener('raya-inventory-updated', handleInvUpdate);
    return () => window.removeEventListener('raya-inventory-updated', handleInvUpdate);
  }, []);

  const items = externalItems && externalItems.length > 0 ? externalItems : internalItems;

  // Active Tab: 'transfers' | 'radar_alternatives' | 'simulator' | 'outlook_emails'
  const [activeTab, setActiveTab] = useState<
    'transfers' | 'radar_alternatives' | 'simulator' | 'outlook_emails'
  >('transfers');

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);
  const [notificationType, setNotificationType] = useState<'success' | 'error'>('success');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Target Simulator States
  const [simTransfersConversionPct, setSimTransfersConversionPct] = useState<number>(75); // % of urgent stock sold
  const [simCrossSellingConversionPct, setSimCrossSellingConversionPct] = useState<number>(30); // % of high ticket sold via warehouse
  const [simOverstockLiquidationPct, setSimOverstockLiquidationPct] = useState<number>(50); // % of overstock liquidated
  const [simAmanInstallmentBoostEgp, setSimAmanInstallmentBoostEgp] = useState<number>(60000); // EGP additional Aman installment sales

  // Execute optimization report
  const report: InventoryAnalysisReport = useMemo(() => {
    return executeInventoryOptimization(items);
  }, [items]);

  // Derived KPI calculations
  const totalConcordeSales = totalActualSales || report.totalConcordeStockValueEgp;
  const targetRevenue = targetStructure.revenueTarget || 1400000;
  const achievementRate = Number(((totalConcordeSales / targetRevenue) * 100).toFixed(1));
  const urgentItemsCount = report.urgentTransfers.length;
  const overstockItemsCount = report.overstockItems.length;

  // Simulator computed impact
  const simulatorMetrics = useMemo(() => {
    // 1. Revenue from urgent transfers converted to sales
    const urgentPotentialSales = report.urgentTransfers.reduce(
      (sum, t) => sum + t.suggestedTransferQty * t.item.priceEgp,
      0
    );
    const simulatedUrgentGain = Math.round(urgentPotentialSales * (simTransfersConversionPct / 100));

    // 2. Revenue from high-ticket cross-selling
    const simulatedCrossSellingGain = Math.round(
      report.potentialCrossSalesValueEgp * (simCrossSellingConversionPct / 100)
    );

    // 3. Liquidated capital from overstock items
    const simulatedOverstockFreedCapital = Math.round(
      report.totalTrappedOverstockCapitalEgp * (simOverstockLiquidationPct / 100)
    );

    // 4. Total simulated sales
    const totalAdditionalRevenue =
      simulatedUrgentGain + simulatedCrossSellingGain + simAmanInstallmentBoostEgp;
    const simulatedGrandActual = totalConcordeSales + totalAdditionalRevenue;
    const simulatedAchievementRate = Number(
      ((simulatedGrandActual / targetRevenue) * 100).toFixed(1)
    );
    const estimatedAdditionalIncentives = Math.round(totalAdditionalRevenue * 0.025);

    return {
      urgentPotentialSales,
      simulatedUrgentGain,
      simulatedCrossSellingGain,
      simulatedOverstockFreedCapital,
      totalAdditionalRevenue,
      simulatedGrandActual,
      simulatedAchievementRate,
      estimatedAdditionalIncentives,
    };
  }, [
    report,
    totalConcordeSales,
    targetRevenue,
    simTransfersConversionPct,
    simCrossSellingConversionPct,
    simOverstockLiquidationPct,
    simAmanInstallmentBoostEgp,
  ]);

  // File Upload Handler (CSV / XLSX)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setNotificationMsg(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const buffer = evt.target?.result as ArrayBuffer;
        const parsedResult = parseUploadedInventorySheet(buffer);
        saveConcordeInventoryItems(parsedResult.items);
        setInternalItems(parsedResult.items);
        onUpdateItems?.(parsedResult.items, file.name);
        setIsProcessing(false);
        setNotificationType('success');
        setNotificationMsg(
          isAr
            ? `تم رفع ومعالجة شيت "${file.name}" بنجاح (${parsedResult.items.length} صنف)! ${parsedResult.latestDateFormattedAr ? `[أرصدة المخزون حتى: ${parsedResult.latestDateFormattedAr}]` : ''}`
            : `Successfully parsed "${file.name}" (${parsedResult.items.length} items)!`
        );
        setTimeout(() => setNotificationMsg(null), 5000);
      } catch (err: any) {
        setIsProcessing(false);
        setNotificationType('error');
        setNotificationMsg(
          isAr
            ? `خطأ في قراءة ملف الإكسيل: ${err.message || 'يرجى مراجعة عناوين الأعمدة'}`
            : `Failed to read file: ${err.message}`
        );
      }
    };

    reader.onerror = () => {
      setIsProcessing(false);
      setNotificationType('error');
      setNotificationMsg(isAr ? 'تعذر فتح الملف من جهازك.' : 'Failed to read file.');
    };

    reader.readAsArrayBuffer(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCopyText = (text: string, key: string, successLabel: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setNotificationType('success');
    setNotificationMsg(successLabel);
    setTimeout(() => {
      setCopiedKey(null);
      setNotificationMsg(null);
    }, 3500);
  };

  const handleDownloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    const rows = items.map((item) => ({
      'كود الصنف (SKU)': item.sku,
      'اسم الصنف والموديل': item.name,
      'الفئة': item.categoryLabelAr,
      'سعر البيع (ج.م)': item.priceEgp,
      'رصيد فرع كونكورد': item.concordeStock,
      'رصيد المخزن الرئيسي': item.mainWarehouseStock,
      'معدل السحب الشهري': item.monthlySalesVelocity,
      'ملاحظات': item.notes || '',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'شيت_المخزون_والمبيعات');
    XLSX.writeFile(wb, 'شيت_مخزون_ومبيعات_راية_كونكورد_بلازا.xlsx');
  };

  const handleResetToRayaDefault = () => {
    saveConcordeInventoryItems(DEFAULT_CONCORDE_INVENTORY_ITEMS);
    setInternalItems(DEFAULT_CONCORDE_INVENTORY_ITEMS);
    onUpdateItems?.(DEFAULT_CONCORDE_INVENTORY_ITEMS);
    setSearchQuery('');
    setNotificationType('success');
    setNotificationMsg(
      isAr
        ? 'تمت استعادة بيانات فرع راية كونكورد بلازا المعتمدة بنجاح.'
        : 'Restored default Raya Concorde Plaza inventory records.'
    );
    setTimeout(() => setNotificationMsg(null), 4000);
  };

  // Outlook Emails Collection
  const outlookEmailTemplates = useMemo(() => {
    const dateStr = new Date().toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return [
      {
        id: 'email-supply-transfer',
        titleAr: 'طلب تحويل بضاعة عاجل للمخزن الرئيسي وسلاسل الإمداد',
        titleEn: 'Urgent Stock Transfer Order to Supply Chain',
        to: 'supplychain.retail@rayacorp.com, warehouse.logistics@rayacorp.com',
        cc: 'retail.director@rayacorp.com, area.manager.east@rayacorp.com, hany_hanna@rayacorp.com',
        subject: `[عاجل جداً] طلب تحويل بضاعة فوري لفرع راية كونكورد بلازا - ${report.totalSuggestedTransferUnits} قطعة (${dateStr})`,
        body: `السادة مسؤولي سلاسل الإمداد والمخزن الرئيسي بشركة راية،
تحية طيبة وبعد،،

نحيط سيادتكم علماً بأنه طبقاً لرصد حركة المبيعات الفعلية ومطابقة أرصدة فرع كونكورد بلازا مع المخزن الرئيسي، تم تحديد عدد (${report.urgentTransfers.length} أصناف استراتيجية) رصيدها بالفرع صفر أو قطعة واحدة فقط، بينما يتوفر مخزون كافي بالمخزن الرئيسي.

نرجو التكرم باعتماد أمر التحويل التالي لتسيير سيارة التوريد صباح الغد لمنع توقف البيع:

جدول الأصناف المطلوبة للتحويل فوراً:
${report.urgentTransfers
  .map(
    (t, i) =>
      `${i + 1}. [${t.item.sku}] ${t.item.name}
   - رصيد الفرع الحالي: ${t.item.concordeStock} قطعة | المتاح بالمخزن: ${t.item.mainWarehouseStock} قطعة | معدل السحب: ${t.item.monthlySalesVelocity} ق/شهر
   - الكمية المطلوبة للتحويل: ${t.suggestedTransferQty} قطعة (تكفي ${t.expectedCoverDaysPostTransfer} يوماً تشغيلياً)
   - درجة الأهمية: ${t.urgency === 'critical' ? 'حرجة جداً (توقف بيع)' : 'عالية'}`
  )
  .join('\n\n')}

إجمالي الكمية المطلوبة: ${report.totalSuggestedTransferUnits} قطعة.
شاكرين لسيادتكم سرعة الاستجابة ودعم مستهدفات مبيعات الفرع.

وتفضلوا بقبول فائق الاحترام والتقدير،،
إدارة مبيعات وإمداد راية - فرع كونكورد بلازا
هاتف الفرع: 01000000000`,
      },
      {
        id: 'email-overstock-clearance',
        titleAr: 'تقرير الرواكد وتكدس المخزون وخطة التصفية لمدير المنطقة',
        titleEn: 'Overstock Relief & Capital Clearance Plan to Area Manager',
        to: 'area.manager.east@rayacorp.com',
        cc: 'retail.operations@rayacorp.com, financial.controller@rayacorp.com',
        subject: `تقرير حصر الرواكد وتكدس المخزون وخطة تسييل السيولة - راية فرع كونكورد بلازا (${dateStr})`,
        body: `السيد مدير المنطقة المحترم،
تحية طيبة وبعد،،

في إطار جهود تحسين دوران رأس المال العامل بفرع كونكورد بلازا، قمنا بحصر الأصناف التي تشهد تكدساً وبطئاً في حركة السحب بإجمالي سيولة مجمدة تبلغ (${report.totalTrappedOverstockCapitalEgp.toLocaleString()} ج.م).

نرفع لسيادتكم الحلول العملية المعتمدة لكل صنف للبدء في تنفيذها فوراً:

${report.overstockItems
  .map(
    (o, i) =>
      `${i + 1}. الصنف: ${o.item.name} (${o.item.sku})
   - رصيد الفرع: ${o.item.concordeStock} قطعة | معدل السحب الحالي: ${o.item.monthlySalesVelocity} ق/شهر | مدة التغطية: ${o.monthsOfSupply} شهراً
   - رأس المال المجمد: ${o.totalTrappedCapitalEgp.toLocaleString()} ج.م
   - الإجراء المطلوب اعتماده: [${o.recommendedAction === 'bundle' ? 'باقة ترويجية Bundle' : o.recommendedAction === 'showroom_eye_level' ? 'تعديل موضع العرض لمستوى النظر' : 'طلب تحويل لفرع آخر'}]
   - تفاصيل الخطة: ${o.actionDetailsAr}`
  )
  .join('\n\n')}

نرجو التكرم بالموافقة على أذون التحويل والتخفيضات المقترحة لنتمكن من تحرير هذه السيولة.

شاكرين دعمكم المستمر،،
مدير فرع راية كونكورد بلازا`,
      },
      {
        id: 'email-sales-radar-directive',
        titleAr: 'توجيه رسمي لفريق مبيعات صالة العرض (رادار إنقاذ البيعة)',
        titleEn: 'Showroom Sales Directive (Cross-Branch Selling & Substitution)',
        to: 'concorde.sales.team@rayacorp.com',
        cc: 'hany_hanna@rayacorp.com',
        subject: `[إلزام مبيعات] رادار إنقاذ البيعة ومصفوفة البدائل - راية كونكورد بلازا`,
        body: `الزملاء الأعزاء مستشاري المبيعات بفرع كونكورد بلازا،
تحية طيبة وبعد،،

حرصاً على عدم ضياع أي بيعة ومنع خروج أي عميل من الفرع دون تلبية طلبه، يُلزم الفريق بالتعليمات التشغيلية التالية اعتباراً من اليوم:

أولاً: رادار أصناف المخزن الرئيسي (High-Ticket Cross-Selling):
"اعرضوا هذه الموديلات على العملاء بنظام الحجز بعربون أو التوصيل من المخزن الرئيسي ولا تعتذروا عن عدم توفرها نهائياً":
${report.crossBranchSellingItems
  .slice(0, 5)
  .map(
    (c, i) =>
      `• ${c.item.name} | السعر: ${c.item.priceEgp.toLocaleString()} ج.م | متاح بالمخزن: ${c.item.mainWarehouseStock} ق | التوصيل: خلال ${c.deliveryTimeHours} ساعة`
  )
  .join('\n')}

ثانياً: مصفوفة البدائل الفورية بالفاترينة (في حال انعدام الصنف 0/0):
${report.smartAlternatives
  .map(
    (a) =>
      `• إذا طلب العميل: [${a.outOfStockItem.name}] المنعدم بالمخازن -> يتم ترشيح المتاح فوراً [${a.recommendedAlternative.name}] (رصيد: ${a.recommendedAlternative.concordeStock} ق بفارق ${a.priceDifferenceEgp > 0 ? '+' : ''}${a.priceDifferenceEgp.toLocaleString()} ج.م).`
  )
  .join('\n')}

بالتوفيق في تحقيق وتجاوز التارجت،،
إدارة مبيعات فرع كونكورد بلازا`,
      },
    ];
  }, [report]);

  return (
    <section
      id="raya-inventory-dashboard"
      className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden text-slate-800 transition-all"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* ========================================================================= */}
      {/* 1. RAYA CORPORATE HEADER (Deep Navy Blue & Crisp White Identity) */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-[#001E3D] via-[#0B2545] to-[#134074] text-white p-5 sm:p-7 border-b border-[#0B2545] relative overflow-hidden">
        {/* Subtle background ambient accents */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          {/* Brand Wordmark & Title */}
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white text-[#0B2545] flex items-center justify-center font-black text-2xl shadow-md shrink-0 border border-white/20">
              <span className="font-mono tracking-tighter text-[#0B2545]">R</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-xs font-black tracking-wider uppercase text-cyan-300">
                  RAYA RETAIL & DISTRIBUTION
                </span>
                <span className="text-white/40">·</span>
                <span className="text-xs font-bold text-slate-200">فرع راية كونكورد بلازا</span>
                <span className="text-white/40">·</span>
                <span className="text-[11px] font-mono text-emerald-300 bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded">
                  Live Stock Engine
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                لوحة مدير الإمداد والمبيعات الذكي (Smart Inventory & Sales Optimizer)
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-2xl leading-relaxed">
                منظومة راية المتكاملة لمطابقة المخزون بحركة المبيعات، توليد طلبات التحويل الفورية، رادار إنقاذ البيعة، ومحاكاة التارجت.
              </p>
            </div>
          </div>

          {/* Action Hub in Header */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {/* 1. Upload Excel / CSV Button */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".xlsx,.xls,.csv"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-[#0B2545] hover:bg-slate-100 font-black text-xs shadow-md transition-all cursor-pointer hover:scale-[1.02] disabled:opacity-50"
              title="رفع شيت إكسيل المخزون والمبيعات (CSV / XLSX)"
            >
              <UploadCloud className="w-4 h-4 text-[#0B2545]" />
              <span>{isProcessing ? 'جاري المعالجة...' : 'رفع شيت المخزون (Excel/CSV)'}</span>
            </button>

            {/* 2. Download Official Template */}
            <button
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold transition-colors cursor-pointer"
              title="تحميل شيت إكسيل فارغ معتمد"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-300" />
              <span className="hidden sm:inline">تحميل قالب الشيت</span>
            </button>

            {/* 3. Reset Demo Data */}
            <button
              onClick={handleResetToRayaDefault}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs transition-colors cursor-pointer"
              title="استعادة بيانات كونكورد المعتمدة"
            >
              <RefreshCw className="w-4 h-4 text-slate-300" />
            </button>
          </div>
        </div>
      </div>

      {/* Global Notification Banner */}
      {notificationMsg && (
        <div
          className={`px-6 py-2.5 text-xs font-bold flex items-center justify-between border-b ${
            notificationType === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-rose-50 text-rose-900 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {notificationType === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            )}
            <span>{notificationMsg}</span>
          </div>
          <button
            onClick={() => setNotificationMsg(null)}
            className="text-slate-400 hover:text-slate-700 cursor-pointer text-xs"
          >
            إغلاق
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. FOUR TOP FAST-INDICATOR KPI CARDS (الأربعة كروت العلوية الإلزامية) */}
      {/* ========================================================================= */}
      <div className="p-5 sm:p-6 bg-slate-50/80 border-b border-slate-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: إجمالي المبيعات (Total Sales) */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-[#0B2545]">
                إجمالي المبيعات المحققة
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0B2545] flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-[#00203F] font-mono tracking-tight">
              {totalConcordeSales.toLocaleString()}{' '}
              <span className="text-xs font-bold text-slate-500">ج.م</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-2 font-medium">
              <span className="text-emerald-700 font-bold">محقق الفرع الفعلي</span>
              <span>·</span>
              <span>الفترة: {targetStructure.period || 'أكتوبر 2026'}</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-[#004B87] h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, achievementRate)}%` }}
              />
            </div>
          </div>

          {/* Card 2: نسبة تحقيق التارجت (Target Achievement %) */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-[#0B2545]">
                نسبة تحقيق التارجت
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl sm:text-3xl font-black text-emerald-800 font-mono tracking-tight">
                {achievementRate}%
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                {achievementRate >= 100 ? 'تم تجاوز التارجت' : 'قيد الإنجاز'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-2 font-medium">
              <span>تارجت الريفينيو: <strong>{targetRevenue.toLocaleString()} ج.م</strong></span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, achievementRate)}%` }}
              />
            </div>
          </div>

          {/* Card 3: عدد نواقص الفرع المتوفرة بالمخزن الرئيسي (Branch Shortages in Warehouse) */}
          <div className="bg-white rounded-2xl p-5 border border-rose-200 shadow-2xs hover:shadow-md transition-shadow relative overflow-hidden bg-rose-50/10">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-rose-900">
                نواقص الفرع بالمخزن الرئيسي
              </span>
              <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                <Truck className="w-4 h-4 animate-pulse" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl sm:text-3xl font-black text-rose-700 font-mono tracking-tight">
                {urgentItemsCount}{' '}
                <span className="text-xs font-bold text-rose-600">أصناف</span>
              </div>
              <span className="text-xs font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-md border border-rose-300">
                +{report.totalSuggestedTransferUnits} قطعة مطلوبة
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-2 font-medium">
              <span className="text-rose-700 font-bold">رصيد 0 أو 1 قطعة بكونكورد</span>
              <span>·</span>
              <span>متاح {report.totalMainWarehouseUnits} بالمخزن</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-rose-600 h-full rounded-full w-full" />
            </div>
          </div>

          {/* Card 4: عدد الأصناف الراكدة وتكدس الفرع (Overstock & Aging) */}
          <div className="bg-white rounded-2xl p-5 border border-purple-200 shadow-2xs hover:shadow-md transition-shadow relative overflow-hidden bg-purple-50/10">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-purple-900">
                عدد الأصناف الراكدة
              </span>
              <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                <Boxes className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl sm:text-3xl font-black text-purple-900 font-mono tracking-tight">
                {overstockItemsCount}{' '}
                <span className="text-xs font-bold text-purple-700">أصناف</span>
              </div>
              <span className="text-xs font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded-md border border-purple-300">
                {report.totalTrappedOverstockCapitalEgp.toLocaleString()} ج.م
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-2 font-medium">
              <span className="text-purple-700 font-bold">رأس مال مجمد بالفرع</span>
              <span>·</span>
              <span>تغطية فائضة &gt; 9 أشهر</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-purple-600 h-full rounded-full w-3/4" />
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. STRUCTURED TABS NAVIGATION (تبويبات منظمة واحترافية) */}
      {/* ========================================================================= */}
      <div className="px-5 sm:px-6 bg-white border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 py-3 overflow-x-auto">
          <button
            onClick={() => setActiveTab('transfers')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'transfers'
                ? 'bg-[#002B49] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Truck className="w-4 h-4 text-cyan-300" />
            <span>طلبات التحويل من المخزن الرئيسي</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                activeTab === 'transfers' ? 'bg-cyan-900 text-cyan-200' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {urgentItemsCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('radar_alternatives')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'radar_alternatives'
                ? 'bg-[#002B49] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-300" />
            <span>رادار البيع والبدائل للسيلز</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                activeTab === 'radar_alternatives'
                  ? 'bg-amber-900 text-amber-200'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {report.crossBranchSellingItems.length + report.smartAlternatives.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'simulator'
                ? 'bg-[#002B49] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Sliders className="w-4 h-4 text-emerald-300" />
            <span>محاكي التارجت والمبيعات</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-700 font-bold">
              تفاعلي
            </span>
          </button>

          <button
            onClick={() => setActiveTab('outlook_emails')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'outlook_emails'
                ? 'bg-[#002B49] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Mail className="w-4 h-4 text-purple-300" />
            <span>إيميلات Outlook الجاهزة</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                activeTab === 'outlook_emails'
                  ? 'bg-purple-900 text-purple-200'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {outlookEmailTemplates.length}
            </span>
          </button>
        </div>

        {/* Search bar inside tab strip */}
        <div className="relative py-2 shrink-0">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث بالكود أو اسم الموديل..."
            className="pr-8 pl-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg w-full sm:w-56 focus:outline-none focus:ring-1 focus:ring-[#004B87] font-medium"
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. TAB CONTENTS */}
      {/* ========================================================================= */}
      <div className="p-5 sm:p-7 space-y-6">
        {/* ===================================================================== */}
        {/* TAB 1: طلبات التحويل من المخزن الرئيسي */}
        {/* ===================================================================== */}
        {activeTab === 'transfers' && (
          <div className="space-y-4">
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-[#002B49] text-white shadow-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Truck className="w-5 h-5 text-cyan-300" />
                  <h3 className="text-sm font-black text-white">
                    جدول طلبات التحويل الفورية من المخزن الرئيسي لفرع راية كونكورد بلازا
                  </h3>
                </div>
                <p className="text-xs text-slate-300">
                  تم تحديد الكميات بناءً على معادلة تأمين 15 يوماً عمل طبقاً لمعدل السحب الفعلي لكل صنف.
                </p>
              </div>

              <button
                onClick={() => exportTransferOrderToExcel(report)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs shadow-md transition-all cursor-pointer hover:scale-105 shrink-0"
              >
                <Download className="w-4 h-4 text-slate-950" />
                <span>تحميل إذن التحويل (Excel)</span>
              </button>
            </div>

            {/* Transfers Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-black">
                      <th className="py-3 px-3.5">#</th>
                      <th className="py-3 px-3.5">كود الصنف</th>
                      <th className="py-3 px-3.5">اسم الموديل والصنف</th>
                      <th className="py-3 px-3.5">الفئة</th>
                      <th className="py-3 px-3.5 text-center">سعر الوحدة</th>
                      <th className="py-3 px-3.5 text-center">رصيد كونكورد</th>
                      <th className="py-3 px-3.5 text-center">رصيد المخزن</th>
                      <th className="py-3 px-3.5 text-center">السحب/شهر</th>
                      <th className="py-3 px-3.5 text-center bg-cyan-50 text-cyan-950 font-black">
                        الكمية المقترحة للتحويل
                      </th>
                      <th className="py-3 px-3.5 text-center">أيام التغطية</th>
                      <th className="py-3 px-3.5">الحالة والمبرر التشغيلي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {report.urgentTransfers
                      .filter(
                        (t) =>
                          !searchQuery ||
                          t.item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.item.sku.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((t, idx) => (
                        <tr key={t.item.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-3.5 font-mono text-slate-400 font-bold">{idx + 1}</td>
                          <td className="py-3 px-3.5 font-mono font-bold text-[#002B49]">{t.item.sku}</td>
                          <td className="py-3 px-3.5 font-bold text-slate-900">
                            <div className="flex items-center gap-1.5">
                              <span>{t.item.name}</span>
                              {t.item.isHighTicket && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 font-black">
                                  Flagship
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-3.5 text-slate-600">{t.item.categoryLabelAr}</td>
                          <td className="py-3 px-3.5 text-center font-mono font-bold text-slate-700">
                            {t.item.priceEgp.toLocaleString()} ج.م
                          </td>
                          <td className="py-3 px-3.5 text-center font-bold">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-xs font-black ${
                                t.item.concordeStock === 0
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {t.item.concordeStock} ق
                            </span>
                          </td>
                          <td className="py-3 px-3.5 text-center font-bold text-emerald-800">
                            <span className="bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                              {t.item.mainWarehouseStock} ق
                            </span>
                          </td>
                          <td className="py-3 px-3.5 text-center font-bold text-slate-700">
                            {t.item.monthlySalesVelocity} ق/ش
                          </td>
                          <td className="py-3 px-3.5 text-center bg-cyan-50/50">
                            <span className="inline-block px-3 py-1 rounded-lg bg-[#004B87] text-white font-black text-xs shadow-xs">
                              +{t.suggestedTransferQty} قطعة
                            </span>
                          </td>
                          <td className="py-3 px-3.5 text-center text-slate-600 font-semibold">
                            {t.expectedCoverDaysPostTransfer} يوماً
                          </td>
                          <td className="py-3 px-3.5 text-xs text-slate-600 max-w-xs">
                            <span className="line-clamp-2">{t.reasonAr}</span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* TAB 2: رادار البيع والبدائل للسيلز */}
        {/* ===================================================================== */}
        {activeTab === 'radar_alternatives' && (
          <div className="space-y-6">
            {/* Sales Directives Warning Banner */}
            <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white p-5 rounded-2xl shadow-md border border-amber-500 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-200 animate-bounce" />
                  <span className="text-xs font-black uppercase tracking-wider bg-black/20 px-2.5 py-0.5 rounded text-amber-100">
                    توجيه مبيعات إلزامي ومباشر
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-white">
                  "اعرضوا هذه الموديلات على العملاء بنظام الحجز أو التوصيل من المخزن الرئيسي ولا تعتذروا عن عدم توفرها!"
                </h3>
                <p className="text-xs text-amber-100 leading-relaxed max-w-3xl">
                  تضم القائمة أصناف فاخرة (High-Ticket) غير موجودة بصالة العرض حالياً ولكنها متاحة فورياً بمخازن راية. في حالة انعدام الصنف تماماً (0/0)، استخدموا البدائل المعتمدة بالفاترينة فوراً.
                </p>
              </div>

              <button
                onClick={() => {
                  const text =
                    `*🚨 رادار إنقاذ البيعة والبدائل - راية كونكورد بلازا 🚨*\n` +
                    `"اعرضوا هذه الموديلات على العملاء بنظام الحجز أو التوصيل من المخزن الرئيسي ولا تعتذروا عن عدم توفرها!"\n\n` +
                    report.crossBranchSellingItems
                      .slice(0, 4)
                      .map(
                        (c, i) =>
                          `${i + 1}. *${c.item.name}* (السعر: ${c.item.priceEgp.toLocaleString()} ج.م)\n   - متاح بالمخزن: ${c.item.mainWarehouseStock} ق | التسليم: خلال ${c.deliveryTimeHours} ساعة`
                      )
                      .join('\n\n');
                  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-black transition-all cursor-pointer shrink-0 shadow-lg"
              >
                <Send className="w-4 h-4 text-emerald-400" />
                <span>إرسال الرادار لفريق السيلز (WhatsApp)</span>
              </button>
            </div>

            {/* Part A: High Ticket Cross-Branch Selling Cards */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black text-[#0B2545] flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-600" />
                  <span>الأصناف الفاخرة المتاحة للطلب من المخزن الرئيسي (High-Ticket Cross-Selling)</span>
                </h4>
                <span className="text-xs font-bold text-slate-500">
                  قيمة المبيعات المتاحة: {report.potentialCrossSalesValueEgp.toLocaleString()} ج.م
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {report.crossBranchSellingItems
                  .filter(
                    (c) =>
                      !searchQuery ||
                      c.item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      c.item.sku.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((c) => (
                    <div
                      key={c.item.id}
                      className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-mono text-slate-500 font-bold">{c.item.sku}</span>
                          <span className="font-black px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                            متاح {c.item.mainWarehouseStock} ق بالمخزن
                          </span>
                        </div>
                        <h5 className="text-sm font-black text-slate-900 leading-snug">{c.item.name}</h5>
                        <div className="flex items-center justify-between text-xs text-slate-600 font-bold bg-slate-50 p-2 rounded-lg">
                          <span>سعر البيع:</span>
                          <span className="text-[#002B49] font-black font-mono">
                            {c.item.priceEgp.toLocaleString()} ج.م
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed bg-amber-50/50 p-2.5 rounded-lg border border-amber-200/50">
                          {c.salesPitchAr}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <span>
                          زمن التوصيل: <strong>خلال {c.deliveryTimeHours} ساعة</strong>
                        </span>
                        <span className="text-emerald-700 font-bold">تقسيط أمان متاح</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Part B: Smart Alternatives Matrix */}
            <div className="space-y-3 pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black text-[#0B2545] flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4 text-blue-600" />
                  <span>مصفوفة البدائل الذكية المتاحة بالفاترينة (عند انعدام الصنف 0 فرع / 0 مخزن)</span>
                </h4>
                <span className="text-xs font-bold text-slate-500">
                  {report.smartAlternatives.length} بدائل فورية متوفرة
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {report.smartAlternatives
                  .filter(
                    (a) =>
                      !searchQuery ||
                      a.outOfStockItem.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      a.recommendedAlternative.name.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((a) => (
                    <div
                      key={a.outOfStockItem.id}
                      className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-md transition-shadow space-y-3"
                    >
                      {/* OOS Item */}
                      <div className="p-2.5 rounded-xl bg-slate-100/80 border border-slate-200 text-xs">
                        <div className="flex items-center justify-between text-slate-500 font-bold mb-1">
                          <span className="text-rose-700 font-black">الصنف المطلوب المنعدم (رصيد 0/0)</span>
                          <span className="font-mono">{a.outOfStockItem.sku}</span>
                        </div>
                        <div className="font-black text-slate-900">{a.outOfStockItem.name}</div>
                        <div className="text-slate-600 font-semibold mt-0.5">
                          السعر: {a.outOfStockItem.priceEgp.toLocaleString()} ج.م
                        </div>
                      </div>

                      {/* Immediate Alternative */}
                      <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-300 text-xs">
                        <div className="flex items-center justify-between text-emerald-800 font-bold mb-1">
                          <span className="flex items-center gap-1 font-black text-emerald-900">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            البديل الفوري بالفاترينة ({a.recommendedAlternative.concordeStock} قطع جاهزة)
                          </span>
                          <span className="font-mono text-emerald-700">{a.recommendedAlternative.sku}</span>
                        </div>
                        <div className="font-black text-slate-900 text-sm">
                          {a.recommendedAlternative.name}
                        </div>
                        <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-emerald-200 text-xs">
                          <span>سعر البديل: {a.recommendedAlternative.priceEgp.toLocaleString()} ج.م</span>
                          <span className="font-black text-blue-900 bg-blue-100 px-2 py-0.5 rounded">
                            فارق السعر: {a.priceDifferenceEgp > 0 ? '+' : ''}
                            {a.priceDifferenceEgp.toLocaleString()} ج.م ({a.priceDifferencePct}%)
                          </span>
                        </div>
                      </div>

                      {/* Selling argument */}
                      <div className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                        <span className="font-black text-[#0B2545] block">حجة الإقناع الفورية للعميل:</span>
                        <p className="text-slate-600 leading-relaxed font-medium">"{a.recommendationReasonAr}"</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* TAB 3: محاكي التارجت والمبيعات (Target Simulator) */}
        {/* ===================================================================== */}
        {activeTab === 'simulator' && (
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-gradient-to-r from-[#002B49] to-[#0B2545] text-white shadow-sm space-y-1">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-black">
                  محاكي التارجت ومبيعات فرع كونكورد التفاعلي (Interactive Target Simulator)
                </h3>
              </div>
              <p className="text-xs text-slate-300">
                حرك المؤشرات أدناه لاختبار سيناريوهات تحويل النواقص، وبيع المخزن الرئيسي، وتصفية الرواكد لحساب نسبة التحقيق والإيرادات المتوقعة فوراً.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Sliders Column */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 space-y-5 shadow-2xs">
                <h4 className="text-sm font-black text-[#0B2545] border-b border-slate-100 pb-3 flex items-center justify-between">
                  <span>معايير محاكاة المبيعات والتحويل</span>
                  <button
                    onClick={() => {
                      setSimTransfersConversionPct(75);
                      setSimCrossSellingConversionPct(30);
                      setSimOverstockLiquidationPct(50);
                      setSimAmanInstallmentBoostEgp(60000);
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>إعادة ضبط القيم الافتراضية</span>
                  </button>
                </h4>

                {/* Slider 1 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">
                      1. نسبة بيع بضاعة التحويل العاجلة بعد استلامها بالفرع:
                    </span>
                    <span className="font-mono font-black text-[#002B49] bg-slate-100 px-2 py-0.5 rounded">
                      {simTransfersConversionPct}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={simTransfersConversionPct}
                    onChange={(e) => setSimTransfersConversionPct(Number(e.target.value))}
                    className="w-full accent-[#004B87] cursor-pointer"
                  />
                  <div className="text-[11px] text-slate-500 flex items-center justify-between">
                    <span>مبيعات إضافية متوقعة:</span>
                    <strong className="text-emerald-700 font-mono">
                      +{simulatorMetrics.simulatedUrgentGain.toLocaleString()} ج.م
                    </strong>
                  </div>
                </div>

                {/* Slider 2 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">
                      2. نسبة نجاح رادار بيع الأصناف الفاخرة من المخزن الرئيسي:
                    </span>
                    <span className="font-mono font-black text-[#002B49] bg-slate-100 px-2 py-0.5 rounded">
                      {simCrossSellingConversionPct}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="80"
                    step="5"
                    value={simCrossSellingConversionPct}
                    onChange={(e) => setSimCrossSellingConversionPct(Number(e.target.value))}
                    className="w-full accent-amber-600 cursor-pointer"
                  />
                  <div className="text-[11px] text-slate-500 flex items-center justify-between">
                    <span>مبيعات إضافية من المخزن:</span>
                    <strong className="text-amber-700 font-mono">
                      +{simulatorMetrics.simulatedCrossSellingGain.toLocaleString()} ج.م
                    </strong>
                  </div>
                </div>

                {/* Slider 3 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">
                      3. نسبة تصفية الأصناف الراكدة عبر باقات Bundle والعرض المباشر:
                    </span>
                    <span className="font-mono font-black text-[#002B49] bg-slate-100 px-2 py-0.5 rounded">
                      {simOverstockLiquidationPct}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="10"
                    value={simOverstockLiquidationPct}
                    onChange={(e) => setSimOverstockLiquidationPct(Number(e.target.value))}
                    className="w-full accent-purple-600 cursor-pointer"
                  />
                  <div className="text-[11px] text-slate-500 flex items-center justify-between">
                    <span>سيولة نقدية محررة:</span>
                    <strong className="text-purple-700 font-mono">
                      +{simulatorMetrics.simulatedOverstockFreedCapital.toLocaleString()} ج.م
                    </strong>
                  </div>
                </div>

                {/* Slider 4 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">
                      4. تعزيز مبيعات تقسيط أمان (عقود استهلاكية إضافية):
                    </span>
                    <span className="font-mono font-black text-[#002B49] bg-slate-100 px-2 py-0.5 rounded">
                      {simAmanInstallmentBoostEgp.toLocaleString()} ج.م
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="200000"
                    step="10000"
                    value={simAmanInstallmentBoostEgp}
                    onChange={(e) => setSimAmanInstallmentBoostEgp(Number(e.target.value))}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                </div>
              </div>

              {/* Simulation Results Card */}
              <div className="bg-gradient-to-br from-[#00203F] via-[#0B2545] to-[#134074] text-white rounded-2xl p-6 shadow-md flex flex-col justify-between space-y-6">
                <div>
                  <span className="text-xs font-black text-cyan-300 uppercase tracking-wider block mb-1">
                    نتائج المحاكاة التقديرية
                  </span>
                  <h4 className="text-base font-black text-white">
                    توقعات أداء فرع كونكورد بعد تنفيذ القرارات
                  </h4>
                </div>

                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-white/10 border border-white/10 space-y-1">
                    <span className="text-xs text-slate-300">المبيعات الإجمالية المحاكية:</span>
                    <div className="text-2xl font-black font-mono text-white">
                      {simulatorMetrics.simulatedGrandActual.toLocaleString()}{' '}
                      <span className="text-xs font-normal text-slate-300">ج.م</span>
                    </div>
                    <span className="text-[11px] text-emerald-300 font-bold block">
                      +{simulatorMetrics.totalAdditionalRevenue.toLocaleString()} ج.م نمو إضافي
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white/10 border border-white/10 space-y-1">
                    <span className="text-xs text-slate-300">نسبة التحقيق المتوقعة:</span>
                    <div className="text-3xl font-black font-mono text-emerald-400">
                      {simulatorMetrics.simulatedAchievementRate}%
                    </div>
                    <span className="text-[11px] text-slate-300 block">
                      المستهدف: {targetRevenue.toLocaleString()} ج.م
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white/10 border border-white/10 space-y-1">
                    <span className="text-xs text-slate-300">حوافز إضافية مستحقة للفريق:</span>
                    <div className="text-lg font-black font-mono text-amber-300">
                      ~{simulatorMetrics.estimatedAdditionalIncentives.toLocaleString()} ج.م
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-300 border-t border-white/10 pt-3">
                  * الحسابات مبنية على أسعار البيع الرسمية لشركة راية ونسب عمولات أمان.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* TAB 4: إيميلات Outlook الجاهزة للنسخ بضغطة زر */}
        {/* ===================================================================== */}
        {activeTab === 'outlook_emails' && (
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-slate-900 text-white shadow-sm space-y-1">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-black">
                  إيميلات Outlook الرسمية الجاهزة للإرسال والنسخ المباشر بضغطة زر
                </h3>
              </div>
              <p className="text-xs text-slate-300">
                قوالب مراسلات مهنية ومكتوبة بأسلوب رسمي معتمد لإدارة راية وسلاسل الإمداد، تشمل العناوين والمستلمين ومحتوى التقرير بدقة 100%.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {outlookEmailTemplates.map((tmpl) => (
                <div
                  key={tmpl.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
                >
                  {/* Email Card Header */}
                  <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <h4 className="text-sm font-black text-[#0B2545] flex items-center gap-2">
                        <Mail className="w-4 h-4 text-purple-600" />
                        <span>{tmpl.titleAr}</span>
                      </h4>
                      <span className="text-xs text-slate-500 font-mono">{tmpl.titleEn}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          handleCopyText(
                            `الموضوع: ${tmpl.subject}\nإلى: ${tmpl.to}\nنسخة إلى: ${tmpl.cc}\n\n${tmpl.body}`,
                            tmpl.id,
                            `تم نسخ الإيميل بالكامل ("${tmpl.titleAr}") إلى الحافظة!`
                          )
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#004B87] hover:bg-[#002B49] text-white font-black text-xs shadow-xs transition-colors cursor-pointer"
                      >
                        {copiedKey === tmpl.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-300" />
                            <span>تم النسخ!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-cyan-200" />
                            <span>نسخ الإيميل كاملاً</span>
                          </>
                        )}
                      </button>

                      <a
                        href={`mailto:${tmpl.to}?cc=${encodeURIComponent(tmpl.cc)}&subject=${encodeURIComponent(tmpl.subject)}&body=${encodeURIComponent(tmpl.body)}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-300 transition-colors cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>فتح في Outlook</span>
                      </a>
                    </div>
                  </div>

                  {/* Email Metadata */}
                  <div className="p-4 bg-slate-50/50 border-b border-slate-200 space-y-1.5 text-xs text-slate-600 font-mono">
                    <div className="flex items-center gap-2">
                      <strong className="text-slate-800 font-bold">إلى (To):</strong>
                      <span className="text-blue-700 select-all">{tmpl.to}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <strong className="text-slate-800 font-bold">نسخة (CC):</strong>
                      <span className="text-slate-600 select-all">{tmpl.cc}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <strong className="text-slate-800 font-bold">الموضوع (Subject):</strong>
                      <span className="text-slate-900 font-bold select-all">{tmpl.subject}</span>
                    </div>
                  </div>

                  {/* Email Body */}
                  <div className="p-5 bg-white">
                    <pre className="font-mono text-xs text-slate-800 leading-relaxed whitespace-pre-wrap select-all bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                      {tmpl.body}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Strip */}
      <div className="px-6 py-4 bg-slate-100 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-2 font-semibold">
          <Building className="w-4 h-4 text-[#002B49]" />
          <span>منظومة راية لإدارة المبيعات والتوزيع - فرع كونكورد بلازا (التجمع الخامس)</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => exportTransferOrderToExcel(report)}
            className="text-[#004B87] hover:text-[#002B49] font-bold flex items-center gap-1 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>تصدير تقرير الإكسيل الشامل</span>
          </button>
          <span>·</span>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="text-slate-500 hover:text-slate-800 cursor-pointer"
          >
            العودة لأعلى الصفحة ↑
          </button>
        </div>
      </div>
    </section>
  );
};
