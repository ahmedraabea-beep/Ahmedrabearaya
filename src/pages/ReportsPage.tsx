import React, { useState } from 'react';
import { useDataStore } from '../store/DataStore';
import { selectFilteredRecords, selectFinancialTotals, selectActiveTargetStructure } from '../store/selectors';
import { ExecutivePresentationCard } from '../components/ExecutivePresentationCard';
import { MonthlyReportModal } from '../components/MonthlyReportModal';
import { ExportAndDownloadCenterModal } from '../components/ExportAndDownloadCenterModal';
import { exportRecordsToExcel, exportRecordsToCsv, downloadSampleExcelTemplate } from '../utils/excelParser';
import {
  FileText,
  Download,
  Printer,
  Copy,
  CheckCircle2,
  Share2,
  Building2,
  FileSpreadsheet,
  Clock,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { CONCORD_BRANCH_NAME } from '../data/sampleData';

export const ReportsPage: React.FC = () => {
  const { state } = useDataStore();
  const { language, currency } = state.settings;
  const isAr = language === 'ar';

  const [activeTab, setActiveTab] = useState<'executive' | 'export' | 'history'>('executive');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [downloadHistory, setDownloadHistory] = useState<Array<{ id: string; name: string; time: string; type: string }>>([
    { id: '1', name: `Raya_Sales_Report_${state.selectedPeriod}.xlsx`, time: 'اليوم، 10:15 ص', type: 'Excel' },
    { id: '2', name: `Raya_Executive_Report_${state.selectedPeriod}.pdf`, time: 'أمس، 04:30 م', type: 'PDF' },
  ]);

  const activeRecords = selectFilteredRecords(state);
  const currentPeriodTarget = selectActiveTargetStructure(state);

  const handleExportExcel = () => {
    const fileName = `Raya_Sales_Report_${state.selectedPeriod.replace(/\s+/g, '_')}`;
    exportRecordsToExcel(activeRecords.length > 0 ? activeRecords : state.records, fileName);
    setDownloadHistory((prev) => [
      { id: Date.now().toString(), name: `${fileName}.xlsx`, time: isAr ? 'الآن' : 'Just now', type: 'Excel' },
      ...prev,
    ]);
  };

  const handleExportCsv = () => {
    const fileName = `Raya_Sales_Report_${state.selectedPeriod.replace(/\s+/g, '_')}`;
    exportRecordsToCsv(activeRecords.length > 0 ? activeRecords : state.records, fileName);
    setDownloadHistory((prev) => [
      { id: Date.now().toString(), name: `${fileName}.csv`, time: isAr ? 'الآن' : 'Just now', type: 'CSV' },
      ...prev,
    ]);
  };

  const handleCopyReportLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="space-y-6 select-none" dir={isAr ? 'rtl' : 'ltr'}>
      {/* ── Segmented Navigation Bar ── */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl border border-slate-200">
          <button
            onClick={() => setActiveTab('executive')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'executive'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>{isAr ? 'توليد العرض والتقرير الشهري' : 'Executive Presentation & Monthly Report'}</span>
          </button>

          <button
            onClick={() => setActiveTab('export')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'export'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>{isAr ? 'تصدير الملفات والنماذج' : 'Export & Templates'}</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'history'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4 text-amber-500" />
            <span>{isAr ? 'سجل التحميل والمزامنة' : 'Download History'}</span>
            <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded-full font-mono">
              {downloadHistory.length}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyReportLink}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
          >
            {copiedLink ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? (isAr ? 'تم النسخ!' : 'Copied!') : isAr ? 'مشاركة الرابط' : 'Share'}</span>
          </button>
        </div>
      </div>

      {/* ── TAB 1: توليد العرض والتقرير الشهري ── */}
      {activeTab === 'executive' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <span>{isAr ? 'تقرير الإدارة العليا لفرع كونكورد بلازا' : 'Boardroom Executive Deck'}</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {isAr
                  ? `ملخص مؤشرات الإنجاز، الفئات، التوزيعات لشهر ${state.selectedPeriod} مع جاهزية كاملة للطباعة والتصدير كـ PDF.`
                  : `Executive summary, targets, and sales distribution for ${state.selectedPeriod}.`}
              </p>
            </div>

            <button
              onClick={() => setIsReportModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>{isAr ? 'معاينة وطباعة التقرير (PDF)' : 'Preview & Print PDF'}</span>
            </button>
          </div>

          <ExecutivePresentationCard
            language={language}
            currency={currency}
            records={activeRecords}
            targetStructure={currentPeriodTarget}
            onOpenMonthlyReport={() => setIsReportModalOpen(true)}
            onOpenDownloadCenter={() => setActiveTab('export')}
          />
        </div>
      )}

      {/* ── TAB 2: تصدير الملفات والنماذج ── */}
      {activeTab === 'export' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Excel Export */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {isAr ? 'تصدير شيت المبيعات الحالي (Excel)' : 'Export Sales Sheet (Excel)'}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {isAr
                    ? 'تصدير كافة المعاملات الحالية الصافية بعد المرتجعات مع أعمدة راية الرسمية.'
                    : 'Download complete sales records table in standard Excel format.'}
                </p>
              </div>
              <button
                onClick={handleExportExcel}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{isAr ? 'تحميل ملف Excel' : 'Download Excel'}</span>
              </button>
            </div>

            {/* CSV Export */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {isAr ? 'تصدير ملف بيانات خام (CSV)' : 'Export Raw CSV Data'}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {isAr
                    ? 'ملف CSV متوافق مع كافة أنظمة قواعد البيانات وبرامج التحليل الخارجية.'
                    : 'Download raw CSV data compatible with database systems.'}
                </p>
              </div>
              <button
                onClick={handleExportCsv}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{isAr ? 'تحميل ملف CSV' : 'Download CSV'}</span>
              </button>
            </div>

            {/* Download Templates */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {isAr ? 'نماذج الإكسيل الرسمية لشركة راية' : 'Official Raya Templates'}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {isAr
                    ? 'تنزيل النموذج القياسي المعتمد لتعبئة المبيعات اليومية لفرع كونكورد.'
                    : 'Download empty official templates for daily branch logging.'}
                </p>
              </div>
              <button
                onClick={downloadSampleExcelTemplate}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition cursor-pointer border border-slate-200"
              >
                <Download className="w-4 h-4 text-slate-600" />
                <span>{isAr ? 'تنزيل النموذج القياسي' : 'Download Template'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: سجل التحميل والمزامنة ── */}
      {activeTab === 'history' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              {isAr ? 'سجل الملفات المصدرة والتقارير' : 'Download & Export History Log'}
            </h3>

            <div className="divide-y divide-slate-100">
              {downloadHistory.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                      <Download className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 block">{item.name}</span>
                      <span className="text-[11px] text-slate-400 font-mono">{item.time}</span>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold text-[10px]">
                    {item.type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Integrated Modal Fallback for Print PDF */}
      <MonthlyReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        records={state.records}
        currency={currency}
        language={language}
        targetStructure={currentPeriodTarget}
      />
    </div>
  );
};

export default ReportsPage;
