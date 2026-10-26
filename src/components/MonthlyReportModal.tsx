import React, { useState, useMemo, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  X,
  Printer,
  Download,
  Calendar,
  Building2,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Award,
  Users,
  Coins,
  FileText,
  ShieldCheck,
  ChevronDown,
  Sparkles,
  Loader2,
  Smartphone,
  Headphones,
  Tv,
  CreditCard,
  Layers,
} from 'lucide-react';
import { SalesRecord, Currency, Language, BranchTotalTargetStructure } from '../types/sales';
import { formatCurrencyNumber, formatPercent } from '../utils/calculations';
import { translations } from '../utils/i18n';
import { CONCORD_BRANCH_NAME } from '../data/sampleData';
import { getExecutiveDateTime } from '../utils/dateFormatter';
import { AbcAnalysisSection } from './AbcAnalysisSection';

interface MonthlyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: SalesRecord[];
  currency: Currency;
  language: Language;
  targetStructure?: BranchTotalTargetStructure | null;
}

export const MonthlyReportModal: React.FC<MonthlyReportModalProps> = ({
  isOpen,
  onClose,
  records,
  currency,
  language,
  targetStructure,
}) => {
  const t = translations[language];
  const reportRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  // Extract unique periods from records
  const availablePeriods = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.period) set.add(r.period);
    });
    return Array.from(set);
  }, [records]);

  // Default to the first available period or 'all'
  const [selectedPeriod, setSelectedPeriod] = useState<string>(() => {
    return availablePeriods[0] || 'all';
  });

  const activePeriod = selectedPeriod === 'all' ? (availablePeriods[0] || (language === 'ar' ? 'الفترة المعتمدة' : 'Official Period')) : selectedPeriod;
  const reportDaysInMonth = targetStructure?.daysInMonth || 30;

  const safeTarget: BranchTotalTargetStructure = targetStructure || {
    grandTotal: 0,
    installmentTarget: 0,
    revenueTarget: 0,
    revenueBreakdown: { mobiles: 0, accessories: 0, other: 0 },
    period: activePeriod,
    daysInMonth: reportDaysInMonth,
    dailyRevenueTarget: 0,
    dailyGrandTotalTarget: 0,
  };

  // Filter records by period if specific period is selected
  const periodRecords = useMemo(() => {
    if (selectedPeriod === 'all') {
      return records;
    }
    return records.filter((r) => r.period === selectedPeriod);
  }, [records, selectedPeriod]);

  // Aggregate metrics for report
  const metrics = useMemo(() => {
    const totalTarget = periodRecords.reduce((sum, r) => sum + (r.target || 0), 0);
    const totalActual = periodRecords.reduce((sum, r) => sum + (r.actual || 0), 0);
    const totalDifference = totalActual - totalTarget;
    const achievementRate = totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0;
    const isAchieved = totalActual >= totalTarget;

    const totalIncentives = periodRecords.reduce((sum, r) => sum + (r.earnedIncentive || 0), 0);

    const achievedCount = periodRecords.filter((r) => r.isAchieved).length;
    const unachievedCount = periodRecords.length - achievedCount;

    // Find star performer
    let starPerformer: SalesRecord | null = null;
    if (periodRecords.length > 0) {
      starPerformer = [...periodRecords].sort((a, b) => b.achievementRate - a.achievementRate)[0];
    }

    return {
      totalTarget,
      totalActual,
      totalDifference,
      achievementRate,
      isAchieved,
      totalIncentives,
      achievedCount,
      unachievedCount,
      starPerformer,
      staffCount: periodRecords.length,
    };
  }, [periodRecords]);

  // Generate Reference ID & Live Date with Executive Standard
  const reportTimestamp = useMemo(() => {
    const exec = getExecutiveDateTime();
    const isAr = language === 'ar';
    const dateStr = isAr
      ? `${exec.formattedDateAr} | ${exec.hijriDateAr}`
      : `${exec.formattedDateEn} (${exec.hijriDateEn})`;
    const timeStr = isAr
      ? `${exec.hours12Str}:${exec.minutesStr} ${exec.periodLabelAr} (توقيت القاهرة المعتمد)`
      : `${exec.hours12Str}:${exec.minutesStr} ${exec.periodLabelEn} (Official Cairo Time)`;

    const refCode = `RAYA-CP-${exec.year}${String(exec.monthNumber).padStart(2, '0')}-${Math.floor(
      1000 + Math.random() * 9000
    )}`;
    return { dateStr, timeStr, refCode };
  }, [language, isOpen]);

  if (!isOpen) return null;

  // Direct High-Resolution PDF Download using html2canvas & jsPDF
  const handleDownloadPdf = async () => {
    if (!reportRef.current) return;
    setIsGeneratingPdf(true);

    try {
      const element = reportRef.current;
      const canvas = await html2canvas(element, {
        scale: 2, // High resolution for crisp vector lines
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1200,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const ratio = canvasWidth / canvasHeight;

      const imgWidth = pdfWidth - 16; // 8mm margins
      const imgHeight = imgWidth / ratio;

      let position = 8;
      let heightLeft = imgHeight;

      pdf.addImage(imgData, 'JPEG', 8, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight + 8;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 8, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      const cleanPeriodName = activePeriod.replace(/\s+/g, '_');
      const filename =
        language === 'ar'
          ? `تقرير_أداء_فرع_راية_كونكورد_${cleanPeriodName}.pdf`
          : `Raya_Concorde_Plaza_Performance_Report_${cleanPeriodName}.pdf`;

      try {
        pdf.save(filename);
      } catch (saveErr) {
        console.warn('pdf.save failed in iframe, using direct blob link', saveErr);
      }

      // Fallback direct link
      try {
        const blobUrl = pdf.output('bloburl');
        const link = document.createElement('a');
        link.href = String(blobUrl);
        link.target = '_blank';
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        setTimeout(() => document.body.removeChild(link), 1500);
      } catch (blobErr) {
        console.warn('Blob URL download failed', blobErr);
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('raya-notification', {
            detail: {
              title: 'تم تصدير التقرير التنفيذي',
              message: `تم تنزيل تقرير أداء الفرع PDF: ${filename}`,
              type: 'success',
            },
          })
        );
      }
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Native Print / Browser Save as PDF
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[94vh] flex flex-col overflow-hidden my-auto">
        {/* Modal Top Control Bar (Non-printable) */}
        <div className="no-print p-4 border-b border-slate-200 bg-slate-50/90 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  {language === 'ar' ? 'تقرير الأداء الشهري للفرع (PDF Report)' : 'Monthly Performance Report (PDF)'}
                </h3>
                <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                  A4 Executive Format
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {language === 'ar'
                  ? 'ملخص تنفيذي معتمد للمبيعات، مقارنة التارجت، حوافز المنتجات ومؤشرات المستشارين'
                  : 'Official executive summary with sales charts, employee KPIs and approvals'}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Period selector */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="bg-transparent font-semibold text-slate-700 outline-none cursor-pointer"
              >
                <option value="all">
                  {language === 'ar' ? 'التقرير المجمع (كل الفترات)' : 'Combined (All Periods)'}
                </option>
                {availablePeriods.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            {/* Direct PDF Download button */}
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
              title="تنزيل مباشر كملف PDF"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{language === 'ar' ? 'جاري تجهيز PDF...' : 'Generating...'}</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>{t.downloadPdfBtn}</span>
                </>
              )}
            </button>

            {/* Print button */}
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors shadow-2xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>{t.printReportBtn}</span>
            </button>

            {/* Close button */}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Area */}
        <div className="overflow-y-auto p-4 sm:p-8 bg-slate-100/60 flex justify-center">
          {/* Printable Report Document (A4 Canvas Representation) */}
          <div
            id="printable-pdf-report"
            ref={reportRef}
            className="w-full max-w-[800px] bg-white text-slate-900 p-6 sm:p-8 rounded-xl shadow-md border border-slate-200/80 space-y-6 print:border-none print:shadow-none print:p-0 print:max-w-none"
            dir={language === 'ar' ? 'rtl' : 'ltr'}
          >
            {/* Header: Corporate Branding & Branch Manager */}
            <div className="border-b-2 border-slate-800 pb-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs tracking-wider">
                      RAYA
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                        Raya Distribution & Trade · راية للتوزيع
                      </span>
                      <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                        {language === 'ar' ? 'تقرير الأداء الشهري للفرع' : 'Monthly Branch Performance Report'}
                      </h1>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 font-medium">
                    {language === 'ar'
                      ? 'فرع راية كونكورد بلازا (Raya Concorde Plaza) - التجمع الخامس'
                      : 'Raya Concorde Plaza Branch - 5th Settlement, New Cairo'}
                  </p>
                </div>

                {/* Right metadata badge */}
                <div className="text-left rtl:text-right sm:rtl:text-left bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1">
                  <div className="flex items-center gap-2 justify-between">
                    <span className="text-slate-500 font-medium">{t.branchManagerTitle}:</span>
                    <span className="font-bold text-slate-900">{t.branchManagerName}</span>
                  </div>
                  <div className="flex items-center gap-2 justify-between">
                    <span className="text-slate-500 font-medium">{language === 'ar' ? 'فترة التقرير:' : 'Period:'}</span>
                    <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {selectedPeriod === 'all'
                        ? language === 'ar'
                          ? `التقرير المالي المعتمد (${activePeriod})`
                          : `Official Closing Report (${activePeriod})`
                        : selectedPeriod}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 justify-between text-[11px] text-blue-800 font-bold bg-blue-50/80 px-2 py-0.5 rounded border border-blue-200">
                    <span>{language === 'ar' ? 'عدد أيام الفترة:' : 'Days in Period:'}</span>
                    <span>{reportDaysInMonth} {language === 'ar' ? 'يوماً' : 'days'}</span>
                  </div>
                  <div className="flex items-center gap-2 justify-between text-[11px] text-slate-400 font-mono">
                    <span>{reportTimestamp.refCode}</span>
                    <span>{reportTimestamp.dateStr}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 1: Executive KPI Summary Cards */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-4 rounded-full bg-emerald-600 inline-block" />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  {t.executiveSummary}
                </h2>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* 1. Total Target */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                  <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                    {t.kpiTargetSales}
                  </span>
                  <div className="font-mono tabular-nums text-base sm:text-lg font-bold text-slate-900">
                    {formatCurrencyNumber(metrics.totalTarget, currency, true, language)}
                  </div>
                  <span className="text-[10px] text-blue-700 font-bold mt-1 block">
                    {language === 'ar' ? `المعدل اليومي (${reportDaysInMonth} يوم): ${formatCurrencyNumber(Math.round(metrics.totalTarget / reportDaysInMonth), currency, true, language)}/يوم` : `Daily (${reportDaysInMonth}d): ${formatCurrencyNumber(Math.round(metrics.totalTarget / reportDaysInMonth), currency, true, language)}/d`}
                  </span>
                </div>

                {/* 2. Total Actual */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                  <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                    {t.kpiActualSales}
                  </span>
                  <div className="font-mono tabular-nums text-base sm:text-lg font-bold text-emerald-700">
                    {formatCurrencyNumber(metrics.totalActual, currency, true, language)}
                  </div>
                  <span className="text-[10px] text-emerald-600 font-medium mt-1 block flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    <span>{metrics.totalDifference >= 0 ? '+' : ''}{formatCurrencyNumber(metrics.totalDifference, currency, true, language)}</span>
                  </span>
                </div>

                {/* 3. Overall Achievement Rate */}
                <div className={`rounded-xl p-3.5 border ${
                  metrics.isAchieved
                    ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                    : 'bg-rose-50/80 border-rose-300 text-rose-950'
                }`}>
                  <span className="text-[11px] font-semibold block mb-1 opacity-80">
                    {t.kpiOverallRate}
                  </span>
                  <div className="font-mono tabular-nums text-xl font-black">
                    {formatPercent(metrics.achievementRate)}
                  </div>
                  <span className="text-[10px] font-bold mt-1 inline-flex items-center gap-1">
                    {metrics.isAchieved ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                        <span>{language === 'ar' ? 'تم تحقيق الهدف بنجاح' : 'Target Achieved'}</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3 h-3 text-rose-700" />
                        <span>{language === 'ar' ? 'دون المستهدف' : 'Below Target'}</span>
                      </>
                    )}
                  </span>
                </div>

                {/* 4. Total Earned Incentives */}
                <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3.5">
                  <span className="text-[11px] font-semibold text-amber-800 block mb-1 flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5 text-amber-600" />
                    <span>{language === 'ar' ? 'إجمالي الحوافز المستحقة' : 'Total Incentives'}</span>
                  </span>
                  <div className="font-mono tabular-nums text-base sm:text-lg font-bold text-amber-900">
                    {formatCurrencyNumber(metrics.totalIncentives, currency, true, language)}
                  </div>
                  <span className="text-[10px] text-amber-700 font-medium mt-1 block">
                    {language === 'ar' ? 'مستحقة الصرف لفريق العمل' : 'Payable to sales team'}
                  </span>
                </div>
              </div>
            </div>

            {/* Section 1.5: Official Branch Target Breakdown (Revenue + Collective Installment) */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-4 rounded-full bg-indigo-600 inline-block" />
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                    {language === 'ar' ? 'هيكل تارجت الفرع المعتمد (الريفينيو والتقسيط الكلي والأجهزة)' : 'Certified Branch Target Breakdown'}
                  </h2>
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  {language === 'ar' ? `${activePeriod} (${safeTarget.daysInMonth} يوماً)` : `${activePeriod} (${safeTarget.daysInMonth}d)`}
                </div>
              </div>

              {/* 3 Overview Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Grand Total */}
                <div className="bg-white p-3 rounded-xl border border-blue-200 shadow-2xs">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold mb-1">
                    <span>{language === 'ar' ? 'إجمالي مستهدف الفرع الكلي:' : 'Grand Total Target:'}</span>
                    <span className="bg-blue-100 text-blue-800 text-[10px] px-1.5 py-0.2 rounded font-mono">100%</span>
                  </div>
                  <div className="text-base font-extrabold text-blue-950 font-mono tabular-nums">
                    {formatCurrencyNumber(safeTarget.grandTotal, currency, true, language)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {language === 'ar' ? 'ريفينيو + تقسيط كلي' : 'Revenue + Installment'}
                  </div>
                </div>

                {/* Collective Installment */}
                <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-300 shadow-2xs">
                  <div className="flex items-center justify-between text-[11px] text-amber-900 font-bold mb-1">
                    <span className="flex items-center gap-1">
                      <CreditCard className="w-3.5 h-3.5 text-amber-600" />
                      {language === 'ar' ? 'تارجت التقسيط والتمويل:' : 'Installment Target:'}
                    </span>
                    <span className="bg-amber-200/80 text-amber-900 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                      {language === 'ar' ? 'تارجت كلي للفرع' : 'Collective'}
                    </span>
                  </div>
                  <div className="text-base font-black text-amber-950 font-mono tabular-nums">
                    {formatCurrencyNumber(safeTarget.installmentTarget, currency, true, language)}
                  </div>
                  <div className="text-[10px] text-amber-800 mt-0.5">
                    {language === 'ar' ? '🔒 تارجت جماعي للفرع، لا يوزع فردياً' : 'Branch goal, not split individually'}
                  </div>
                </div>

                {/* Revenue Target */}
                <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-300 shadow-2xs">
                  <div className="flex items-center justify-between text-[11px] text-emerald-950 font-bold mb-1">
                    <span>{language === 'ar' ? 'إجمالي تارجت الريفينيو:' : 'Revenue Target:'}</span>
                    <span className="bg-emerald-200/80 text-emerald-900 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                      {language === 'ar' ? 'موزع على المستشارين' : 'Sales Staff'}
                    </span>
                  </div>
                  <div className="text-base font-black text-emerald-950 font-mono tabular-nums">
                    {formatCurrencyNumber(safeTarget.revenueTarget, currency, true, language)}
                  </div>
                  <div className="text-[10px] text-emerald-800 mt-0.5">
                    {language === 'ar' ? `المعدل: ${formatCurrencyNumber(Math.round(safeTarget.revenueTarget / (safeTarget.daysInMonth || 30)), currency, true, language)}/يوم` : 'Daily rate'}
                  </div>
                </div>
              </div>

              {/* Sub-breakdown of Revenue: Mobiles, Accessories, Other (Screens & ACs) */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                <span className="text-[11px] font-bold text-slate-800 block">
                  {language === 'ar' ? 'تقسيم تارجت الريفينيو حسب فئات المنتجات:' : 'Revenue Target by Product Category:'}
                </span>
                <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-500 block mb-0.5 flex items-center justify-center gap-1">
                      <Smartphone className="w-3 h-3 text-blue-600" />
                      {language === 'ar' ? 'موبايلات' : 'Mobiles'}
                    </span>
                    <span className="font-bold text-slate-900 text-xs sm:text-sm">
                      {formatCurrencyNumber(safeTarget.revenueBreakdown.mobiles, currency, true, language)}
                    </span>
                  </div>

                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-500 block mb-0.5 flex items-center justify-center gap-1">
                      <Headphones className="w-3 h-3 text-purple-600" />
                      {language === 'ar' ? 'إكسسوارات' : 'Accessories'}
                    </span>
                    <span className="font-bold text-slate-900 text-xs sm:text-sm">
                      {formatCurrencyNumber(safeTarget.revenueBreakdown.accessories, currency, true, language)}
                    </span>
                  </div>

                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-100" title={language === 'ar' ? 'شاشات وتكييفات وأجهزة أخرى' : 'Screens & ACs'}>
                    <span className="text-[10px] text-slate-500 block mb-0.5 flex items-center justify-center gap-1">
                      <Tv className="w-3 h-3 text-amber-600" />
                      {language === 'ar' ? 'أخرى (شاشات/تكييفات)' : 'Other (TV/AC)'}
                    </span>
                    <span className="font-bold text-slate-900 text-xs sm:text-sm">
                      {formatCurrencyNumber(safeTarget.revenueBreakdown.other, currency, true, language)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Visual Charts (Vector SVG for clean print) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-4 rounded-full bg-blue-600 inline-block" />
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                    {t.performanceVisuals}
                  </h2>
                </div>
                <span className="text-xs text-slate-500 font-mono">
                  {language === 'ar' ? 'مقارنة المستهدف بالمحقق الفعلي' : 'Target vs Actual Comparison'}
                </span>
              </div>

              {/* Chart Grid: Bar Chart + Trajectory Phasing */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Visual Bar Comparison (2 Cols) */}
                <div className="md:col-span-2 bg-slate-50/80 border border-slate-200 rounded-xl p-4 space-y-3">
                  <span className="text-xs font-bold text-slate-700 block">
                    {language === 'ar' ? 'مقارنة أداء المستشارين (Target vs Actual)' : 'Sales Rep Performance Comparison'}
                  </span>

                  <div className="space-y-3 pt-1">
                    {periodRecords.map((rec) => {
                      const maxVal = Math.max(rec.target, rec.actual) * 1.15 || 1;
                      const targetPct = Math.min(100, Math.round((rec.target / maxVal) * 100));
                      const actualPct = Math.min(100, Math.round((rec.actual / maxVal) * 100));

                      return (
                        <div key={rec.id} className="space-y-1 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800">
                              {rec.employee} {rec.employeeId ? `(${rec.employeeId})` : ''}
                            </span>
                            <div className="flex items-center gap-2 font-mono tabular-nums">
                              <span className="text-slate-500">
                                {language === 'ar' ? 'تارجت:' : 'Target:'} {formatCurrencyNumber(rec.target, currency, true, language)}
                              </span>
                              <span className="font-bold text-emerald-700">
                                {language === 'ar' ? 'محقق:' : 'Actual:'} {formatCurrencyNumber(rec.actual, currency, true, language)}
                              </span>
                              <span className={`px-1.5 py-0.2 rounded font-bold text-[10px] ${
                                rec.isAchieved ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                              }`}>
                                {formatPercent(rec.achievementRate)}
                              </span>
                            </div>
                          </div>

                          {/* Bars container */}
                          <div className="space-y-1">
                            {/* Actual Bar */}
                            <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden flex">
                              <div
                                style={{ width: `${actualPct}%` }}
                                className={`h-full transition-all duration-300 ${
                                  rec.isAchieved ? 'bg-emerald-600' : 'bg-amber-500'
                                }`}
                              />
                            </div>
                            {/* Target Marker Bar */}
                            <div className="h-1.5 w-full bg-slate-200/60 rounded-full overflow-hidden flex">
                              <div
                                style={{ width: `${targetPct}%` }}
                                className="h-full bg-slate-500"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-end gap-4 text-[11px] text-slate-500 pt-2 border-t border-slate-200">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-2 rounded bg-emerald-600 inline-block" />
                      <span>{language === 'ar' ? 'المبيعات المحققة' : 'Actual Achieved'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-1.5 rounded bg-slate-500 inline-block" />
                      <span>{language === 'ar' ? 'المستهدف المطلوب' : 'Target Quota'}</span>
                    </div>
                  </div>
                </div>

                {/* Branch Target Progress Meter & Phasing (1 Col) */}
                <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 flex flex-col justify-between space-y-3 text-xs">
                  <div>
                    <span className="font-bold text-slate-700 block mb-2">
                      {language === 'ar' ? 'مؤشر تحقيق تارجت الفرع' : 'Branch Quota Meter'}
                    </span>

                    <div className="flex flex-col items-center justify-center p-3 bg-white rounded-xl border border-slate-200">
                      <div className="font-mono tabular-nums text-2xl font-black text-slate-900">
                        {formatPercent(metrics.achievementRate)}
                      </div>
                      <span className="text-[11px] font-semibold text-slate-500 mt-0.5">
                        {metrics.totalActual >= metrics.totalTarget
                          ? language === 'ar' ? 'تجاوز التارجت بنجاح' : 'Quota Exceeded'
                          : language === 'ar' ? 'قيد استكمال التارجت' : 'In Progress'}
                      </span>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 mt-2.5 overflow-hidden">
                        <div
                          style={{ width: `${Math.min(100, metrics.achievementRate)}%` }}
                          className={`h-full ${
                            metrics.isAchieved ? 'bg-emerald-600' : 'bg-blue-600'
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Weekly Phasing */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-200">
                    <span className="text-[11px] font-bold text-slate-600 block">
                      {language === 'ar' ? 'توزيع مراحل الشهر (Weekly Phasing):' : 'Weekly Phasing:'}
                    </span>
                    <div className="grid grid-cols-4 gap-1 text-center font-mono text-[10px]">
                      <div className="bg-white p-1 rounded border border-slate-200">
                        <span className="block text-slate-400">W1</span>
                        <span className="font-bold text-slate-700">25%</span>
                      </div>
                      <div className="bg-white p-1 rounded border border-slate-200">
                        <span className="block text-slate-400">W2</span>
                        <span className="font-bold text-slate-700">25%</span>
                      </div>
                      <div className="bg-white p-1 rounded border border-slate-200">
                        <span className="block text-slate-400">W3</span>
                        <span className="font-bold text-slate-700">25%</span>
                      </div>
                      <div className="bg-white p-1 rounded border border-slate-200">
                        <span className="block text-slate-400">W4</span>
                        <span className="font-bold text-slate-700">25%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Detailed Employee Metrics Table */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-4 rounded-full bg-purple-600 inline-block" />
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                    {t.employeeMetrics}
                  </h2>
                </div>
                <span className="text-xs text-slate-500">
                  {language === 'ar' ? 'فريق عمل راية كونكورد بلازا (3 مستشارين)' : 'Raya Concorde Plaza Sales Team (3 Reps)'}
                </span>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-xs text-right rtl:text-right ltr:text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-bold">
                      <th className="p-2.5">{language === 'ar' ? 'كود الموظف' : 'Job ID'}</th>
                      <th className="p-2.5">{language === 'ar' ? 'اسم المستشار' : 'Advisor Name'}</th>
                      <th className="p-2.5">{language === 'ar' ? 'المسمى الوظيفي' : 'Role'}</th>
                      <th className="p-2.5 font-mono">{t.targetAmountLabel}</th>
                      <th className="p-2.5 font-mono">{t.actualAmountLabel}</th>
                      <th className="p-2.5 font-mono">{language === 'ar' ? 'الفارق (+/-)' : 'Variance'}</th>
                      <th className="p-2.5 font-mono">{t.colRate}</th>
                      <th className="p-2.5 font-mono">{language === 'ar' ? 'الحافز (ج.م)' : 'Incentive'}</th>
                      <th className="p-2.5">{language === 'ar' ? 'حالة التحقيق' : 'Status'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {periodRecords.map((rec) => {
                      const isStar = metrics.starPerformer?.id === rec.id;
                      return (
                        <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="p-2.5 font-mono tabular-nums text-slate-600">
                            {rec.employeeId || '140729'}
                          </td>
                          <td className="p-2.5 font-bold text-slate-900 flex items-center gap-1.5">
                            {rec.employee}
                            {isStar && (
                              <span title={language === 'ar' ? 'أعلى محقق للتارجت' : 'Star Performer'}>
                                <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                              </span>
                            )}
                          </td>
                          <td className="p-2.5 text-slate-500">
                            {rec.employeeId === '140729'
                              ? language === 'ar' ? 'مستشار مبيعات أول' : 'Senior Advisor'
                              : language === 'ar' ? 'مستشار مبيعات' : 'Sales Advisor'}
                          </td>
                          <td className="p-2.5 font-mono tabular-nums text-slate-700">
                            {formatCurrencyNumber(rec.target, currency, true, language)}
                          </td>
                          <td className="p-2.5 font-mono tabular-nums font-bold text-emerald-800">
                            {formatCurrencyNumber(rec.actual, currency, true, language)}
                          </td>
                          <td className={`p-2.5 font-mono tabular-nums font-bold ${
                            rec.difference >= 0 ? 'text-emerald-700' : 'text-rose-600'
                          }`}>
                            {rec.difference >= 0 ? '+' : ''}{formatCurrencyNumber(rec.difference, currency, true, language)}
                          </td>
                          <td className="p-2.5 font-mono tabular-nums font-bold">
                            <span className={`px-2 py-0.5 rounded text-[11px] ${
                              rec.isAchieved ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              {formatPercent(rec.achievementRate)}
                            </span>
                          </td>
                          <td className="p-2.5 font-mono tabular-nums font-bold text-amber-700">
                            {formatCurrencyNumber(rec.earnedIncentive || 0, currency, true, language)}
                          </td>
                          <td className="p-2.5">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              rec.isAchieved ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}>
                              {rec.isAchieved ? 'محقق ✓' : 'غير محقق ✗'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}

                    {/* Summary Row */}
                    <tr className="bg-slate-100/80 font-bold border-t-2 border-slate-300 text-slate-900">
                      <td colSpan={3} className="p-2.5">
                        {language === 'ar' ? 'إجمالي فرع كونكورد بلازا المعتمد' : 'Total Concorde Plaza Certified'}
                      </td>
                      <td className="p-2.5 font-mono tabular-nums">
                        {formatCurrencyNumber(metrics.totalTarget, currency, true, language)}
                      </td>
                      <td className="p-2.5 font-mono tabular-nums text-emerald-800">
                        {formatCurrencyNumber(metrics.totalActual, currency, true, language)}
                      </td>
                      <td className={`p-2.5 font-mono tabular-nums ${
                        metrics.totalDifference >= 0 ? 'text-emerald-700' : 'text-rose-600'
                      }`}>
                        {metrics.totalDifference >= 0 ? '+' : ''}{formatCurrencyNumber(metrics.totalDifference, currency, true, language)}
                      </td>
                      <td className="p-2.5 font-mono tabular-nums">
                        <span className="px-2 py-0.5 rounded bg-slate-900 text-white text-[11px]">
                          {formatPercent(metrics.achievementRate)}
                        </span>
                      </td>
                      <td className="p-2.5 font-mono tabular-nums text-amber-800">
                        {formatCurrencyNumber(metrics.totalIncentives, currency, true, language)}
                      </td>
                      <td className="p-2.5 text-emerald-700">
                        {metrics.isAchieved ? 'مكتمل بنجاح' : 'جاري المتابعة'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 4: Pareto ABC Analysis for Staff & Categories */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-4 rounded-full bg-purple-600 inline-block" />
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                    {language === 'ar' ? 'تحليل ABC للأصناف والموظفين (Pareto 80/20)' : 'Pareto ABC Classification'}
                  </h2>
                </div>
                <span className="text-xs text-purple-800 font-bold bg-purple-100 px-2 py-0.5 rounded-md">
                  {language === 'ar' ? 'تصنيف المساهمين في المبيعات' : 'Sales Contributors'}
                </span>
              </div>

              <AbcAnalysisSection
                records={periodRecords}
                currency={currency}
                language={language}
                targetStructure={safeTarget}
                inReportModal={true}
              />
            </div>

            {/* Section 5: Key Insights & Performance Notes */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2">
              <span className="font-bold text-slate-800 block">
                {language === 'ar' ? 'ملاحظات وتوصيات إدارة الفرع:' : 'Branch Manager Observations & Notes:'}
              </span>
              <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px] leading-relaxed">
                <li>
                  {language === 'ar'
                    ? `حقق فرع راية كونكورد بلازا نسبة إنجاز إجمالية بلغت (${formatPercent(metrics.achievementRate)}) بفضل التزام الفريق بالخطة البيعية.`
                    : `Raya Concorde Plaza achieved an overall performance of (${formatPercent(metrics.achievementRate)}).`}
                </li>
                <li>
                  {language === 'ar'
                    ? `المستشار الأعلى تحقيقاً للتارجت هو (${metrics.starPerformer?.employee || 'أحمد ربيع سيد'}) بنسبة إنجاز متميزة.`
                    : `Top sales contributor: (${metrics.starPerformer?.employee || 'Ahmed Rabie Sayed'}).`}
                </li>
                <li>
                  {language === 'ar'
                    ? `إجمالي مبالغ الحوافز المعتمدة للصرف لصالح فريق العمل تبلغ (${formatCurrencyNumber(metrics.totalIncentives, currency, true, language)}) بناءً على شيت حوافز الشركة.`
                    : `Total payable product incentives approved: (${formatCurrencyNumber(metrics.totalIncentives, currency, true, language)}).`}
                </li>
              </ul>
            </div>

            {/* Section 5: Corporate Approvals & Signatures */}
            <div className="pt-4 border-t-2 border-slate-300">
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="w-4 h-4 text-slate-700" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  {t.signaturesTitle}
                </h3>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center text-xs">
                {/* 1. Branch Manager */}
                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-4">
                  <div>
                    <span className="font-bold text-slate-900 block">{t.branchManagerSignature}</span>
                    <span className="text-[10px] text-slate-500 font-medium">مدير فرع راية كونكورد بلازا</span>
                  </div>
                  <div className="h-10 border-b border-dashed border-slate-400 flex items-end justify-center pb-1">
                    <span className="font-serif italic font-bold text-slate-700 text-sm">Hany Hanna</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block font-mono">{reportTimestamp.dateStr}</span>
                </div>

                {/* 2. Regional Sales Manager */}
                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-4">
                  <div>
                    <span className="font-bold text-slate-900 block">{t.areaManagerSignature}</span>
                    <span className="text-[10px] text-slate-500 font-medium">قطاع مبيعات التجزئة</span>
                  </div>
                  <div className="h-10 border-b border-dashed border-slate-400 flex items-end justify-center pb-1">
                    <span className="text-slate-400 text-[10px]">{language === 'ar' ? 'التوقيع والاعتماد' : 'Signature'}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block font-mono">{reportTimestamp.dateStr}</span>
                </div>

                {/* 3. Finance Control */}
                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-4">
                  <div>
                    <span className="font-bold text-slate-900 block">{t.financeSignature}</span>
                    <span className="text-[10px] text-slate-500 font-medium">مطابقة المبيعات والحوافز</span>
                  </div>
                  <div className="h-10 border-b border-dashed border-slate-400 flex items-end justify-center pb-1">
                    <span className="text-slate-400 text-[10px]">{language === 'ar' ? 'ختم الاعتماد' : 'Official Stamp'}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block font-mono">{reportTimestamp.dateStr}</span>
                </div>
              </div>

              {/* Footer legal text */}
              <div className="mt-5 text-[10px] text-slate-400 text-center flex items-center justify-between border-t border-slate-200 pt-3">
                <span>شركة راية للتوزيع والتجارة - تقرير رسمي داخلي غير قابل للتداول الخارجي</span>
                <span className="font-mono">Document Hash: {reportTimestamp.refCode}</span>
                <span>صفحة 1 من 1</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
