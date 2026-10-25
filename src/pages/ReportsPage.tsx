import React, { useState } from 'react';
import { useDataStore } from '../store/DataStore';
import { selectFilteredRecords, selectFinancialTotals } from '../store/selectors';
import { ExecutivePresentationCard } from '../components/ExecutivePresentationCard';
import { MonthlyReportModal } from '../components/MonthlyReportModal';
import { ExportAndDownloadCenterModal } from '../components/ExportAndDownloadCenterModal';
import { UnifiedAiPromptModal } from '../components/UnifiedAiPromptModal';
import { DownloadManagerNotification } from '../components/DownloadManagerNotification';
import { exportRecordsToExcel, exportRecordsToCsv, downloadSampleExcelTemplate } from '../utils/excelParser';
import {
  FileText,
  Download,
  Sparkles,
  FileSpreadsheet,
  Printer,
  Copy,
  CheckCircle2,
  Share2,
  FileCheck,
  Building2,
  Database,
  ArrowUpRight,
} from 'lucide-react';
import { CONCORD_BRANCH_NAME } from '../data/sampleData';

export const ReportsPage: React.FC = () => {
  const { state, dispatch, saveStoreNow } = useDataStore();
  const { language, currency } = state.settings;
  const isAr = language === 'ar';

  const [isMonthlyReportModalOpen, setIsMonthlyReportModalOpen] = useState(false);
  const [isDownloadCenterOpen, setIsDownloadCenterOpen] = useState(false);
  const [isUnifiedPromptModalOpen, setIsUnifiedPromptModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const activeRecords = selectFilteredRecords(state);
  const currentPeriodTarget = state.targets[state.selectedPeriod] || state.targets['2026-10'] || Object.values(state.targets)[0];

  const handleExportExcel = () => {
    exportRecordsToExcel(
      activeRecords.length > 0 ? activeRecords : state.records,
      `Raya_Sales_Report_${state.selectedPeriod.replace(/\s+/g, '_')}`
    );
  };

  const handleExportCsv = () => {
    exportRecordsToCsv(
      activeRecords.length > 0 ? activeRecords : state.records,
      `Raya_Sales_Report_${state.selectedPeriod.replace(/\s+/g, '_')}`
    );
  };

  const handleCopyReportLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-semibold mb-2">
              <FileText className="w-4 h-4" />
              <span>{isAr ? 'مركز التقارير التنفيذية والتصدير' : 'Executive Reports & Export Center'}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isAr ? 'التقارير الإدارية، التحميلات ومساعد الذكاء الاصطناعي' : 'Management Reports, Downloads & AI Assistant'}
            </h1>
            <p className="text-sm text-purple-100/80 mt-1 max-w-2xl">
              {isAr
                ? 'استخراج التقارير الرسمية للإدارة العليا لفرع كونكورد بلازا، تصدير ملفات Excel و PDF، واستخدام مساعد الذكاء الاصطناعي لتوحيد وتنسيق الجداول.'
                : 'Generate official C-level boardroom presentations, export Excel & PDF sheets, and run external AI formatters.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsMonthlyReportModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition shadow-lg shadow-purple-950/40 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>{isAr ? 'فتح التقرير الشهري (PDF)' : 'Open Monthly Report (PDF)'}</span>
            </button>
            <button
              onClick={() => setIsDownloadCenterOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{isAr ? 'مركز التنزيلات الكامل' : 'All Downloads'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 1. Executive Boardroom Presentation Summary Card */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-purple-600" />
            <span>{isAr ? 'ملخص العرض التنفيذي للإدارة العليا (Boardroom Deck)' : 'Executive Presentation Deck'}</span>
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            {state.selectedPeriod} - {CONCORD_BRANCH_NAME}
          </span>
        </div>
        <ExecutivePresentationCard
          language={language}
          currency={currency}
          records={activeRecords}
          targetStructure={currentPeriodTarget}
          onOpenMonthlyReport={() => setIsMonthlyReportModalOpen(true)}
          onOpenDownloadCenter={() => setIsDownloadCenterOpen(true)}
        />
      </div>

      {/* 2. Rapid Export and Report Suite */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Official Monthly Report */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between">
          <div>
            <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">
              {isAr ? 'التقرير الشهري التفاعلي الشامل' : 'Interactive Monthly Report'}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              {isAr
                ? 'تقرير رسمي شامل لنتائج فرع كونكورد بلازا مع مؤشرات الأداء، الأقسام، الحوافز، وتحليل ABC مع إمكانية التصدير كملف PDF عالي الجودة أو طباعته فوراً.'
                : 'Official executive performance report with ABC analytics, category achievement, and print/PDF ready styling.'}
            </p>
          </div>
          <button
            onClick={() => setIsMonthlyReportModalOpen(true)}
            className="w-full py-2.5 px-4 bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <span>{isAr ? 'معاينة وطباعة التقرير' : 'Preview & Print Report'}</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        {/* Card 2: Export Center */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between">
          <div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">
              {isAr ? 'مركز التنزيل وملفات الإكسيل' : 'Download Center & Excel Sheets'}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              {isAr
                ? 'تنزيل نماذج الإكسيل الرسمية لشركة راية (شيت المبيعات، شيت الحوافز، شيت المخزون)، بالإضافة إلى تصدير السجلات الحالية كـ Excel أو CSV أو نسخها للحافظة.'
                : 'Download standardized Raya Excel templates or export current database records in Excel, CSV, or formatted text.'}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExportExcel}
              className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isAr ? 'تصدير إكسيل' : 'Export Excel'}</span>
            </button>
            <button
              onClick={() => setIsDownloadCenterOpen(true)}
              className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition cursor-pointer"
            >
              <span>{isAr ? 'المزيد' : 'More'}</span>
            </button>
          </div>
        </div>

        {/* Card 3: Unified AI Data Assistant */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between">
          <div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">
              {isAr ? 'مساعد الذكاء الاصطناعي لتوحيد الشيتات' : 'Unified AI Formatting Assistant'}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              {isAr
                ? 'توليد برومبت ذكي مخصص لنماذج الذكاء الاصطناعي (Gemini / Claude / ChatGPT) لتحويل وتنسيق أي شيت إكسيل غير متوافق إلى تركيبة راية القياسية بدقة 100%.'
                : 'Generate tailored AI prompts to transform messy legacy branch sheets into clean, schema-compliant JSON/Excel in seconds.'}
            </p>
          </div>
          <button
            onClick={() => setIsUnifiedPromptModalOpen(true)}
            className="w-full py-2.5 px-4 bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>{isAr ? 'فتح مساعد الـ AI' : 'Open AI Prompt Assistant'}</span>
          </button>
        </div>
      </div>

      {/* 3. Deep Link & Share Box */}
      <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600">
            <Share2 className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800">
              {isAr ? 'رابط الصفحة المباشر (Deep Link)' : 'Direct Page Deep Link'}
            </h4>
            <p className="text-[11px] text-slate-500">
              {isAr
                ? 'يمكنك مشاركة رابط صفحة التقارير مباشرة مع الزملاء والإدارة'
                : 'Share this exact reports view with branch managers and stakeholders'}
            </p>
          </div>
        </div>

        <button
          onClick={handleCopyReportLink}
          className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold rounded-xl flex items-center gap-2 transition cursor-pointer"
        >
          {copiedLink ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          <span>{copiedLink ? (isAr ? 'تم النسخ!' : 'Copied!') : isAr ? 'نسخ الرابط' : 'Copy Link'}</span>
        </button>
      </div>

      {/* Modals Hosted in ReportsPage */}
      <MonthlyReportModal
        isOpen={isMonthlyReportModalOpen}
        onClose={() => setIsMonthlyReportModalOpen(false)}
        records={state.records}
        currency={currency}
        language={language}
        targetStructure={currentPeriodTarget}
      />

      <ExportAndDownloadCenterModal
        isOpen={isDownloadCenterOpen}
        onClose={() => setIsDownloadCenterOpen(false)}
        records={state.records}
        language={language}
        currency={currency}
        onOpenMonthlyReport={() => {
          setIsDownloadCenterOpen(false);
          setIsMonthlyReportModalOpen(true);
        }}
      />

      <UnifiedAiPromptModal
        isOpen={isUnifiedPromptModalOpen}
        onClose={() => setIsUnifiedPromptModalOpen(false)}
        onImportRecords={(recs, mode) => {
          if (mode === 'replace') {
            dispatch({ type: 'SET_RECORDS', payload: recs });
          } else {
            recs.forEach((r) => dispatch({ type: 'ADD_RECORD', payload: r }));
          }
          saveStoreNow();
          setIsUnifiedPromptModalOpen(false);
        }}
        currency={currency}
        language={language}
        currentBranchName={CONCORD_BRANCH_NAME}
        currentPeriod={state.selectedPeriod}
      />

      <DownloadManagerNotification language={language} />
    </div>
  );
};

export default ReportsPage;
