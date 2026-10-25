import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  Copy,
  CheckCircle2,
  X,
  FileText,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { copyRowsToClipboard, downloadJsonAsCsvSafely } from '../utils/excelParser';
import { Language } from '../types/sales';

interface DownloadEventDetail {
  fileName: string;
  safeAsciiName: string;
  fallbackRows?: Record<string, unknown>[];
  dataUri?: string;
}

interface DownloadManagerNotificationProps {
  language: Language;
}

export const DownloadManagerNotification: React.FC<DownloadManagerNotificationProps> = ({
  language,
}) => {
  const [activeDownload, setActiveDownload] = useState<DownloadEventDetail | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const isAr = language === 'ar';

  useEffect(() => {
    const handleDownloadEvent = (e: Event) => {
      const customEvent = e as CustomEvent<DownloadEventDetail>;
      if (customEvent.detail) {
        setActiveDownload(customEvent.detail);
        setIsCopied(false);
      }
    };

    window.addEventListener('raya-download-event', handleDownloadEvent);
    return () => window.removeEventListener('raya-download-event', handleDownloadEvent);
  }, []);

  if (!activeDownload) return null;

  const handleCopy = async () => {
    if (activeDownload.fallbackRows && activeDownload.fallbackRows.length > 0) {
      const ok = await copyRowsToClipboard(activeDownload.fallbackRows);
      if (ok) {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 3000);
      }
    }
  };

  const handleDownloadCsv = () => {
    if (activeDownload.fallbackRows && activeDownload.fallbackRows.length > 0) {
      const csvName = activeDownload.safeAsciiName.replace(/\.xlsx$/i, '.csv');
      downloadJsonAsCsvSafely(activeDownload.fallbackRows, csvName);
    }
  };

  const handleDownloadDataUri = () => {
    if (activeDownload.dataUri) {
      try {
        const link = document.createElement('a');
        link.href = activeDownload.dataUri;
        link.download = activeDownload.safeAsciiName;
        document.body.appendChild(link);
        link.click();
        setTimeout(() => document.body.removeChild(link), 800);
      } catch (err) {
        console.error('Data URI download error', err);
      }
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4 animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-slate-950 text-white rounded-2xl border-2 border-emerald-500/60 shadow-2xl p-4 backdrop-blur-xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isAr ? 'تم تجهيز ملف التحميل بنجاح' : 'File Ready for Download'}</span>
              </div>
              <h4 className="text-sm font-bold text-white mt-0.5 truncate max-w-xs sm:max-w-sm">
                {activeDownload.fileName}
              </h4>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActiveDownload(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title={isAr ? 'إغلاق' : 'Close'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Buttons Row */}
        <div className="mt-3 pt-3 border-t border-slate-800 flex flex-wrap items-center gap-2">
          {/* 1. Direct Data URI / Excel Download */}
          {activeDownload.dataUri && (
            <button
              type="button"
              onClick={handleDownloadDataUri}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors shadow-sm cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isAr ? 'تحميل Excel (.xlsx)' : 'Download Excel'}</span>
            </button>
          )}

          {/* 2. Direct CSV Download */}
          {activeDownload.fallbackRows && (
            <button
              type="button"
              onClick={handleDownloadCsv}
              className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors cursor-pointer"
              title={isAr ? 'تنزيل بصيغة CSV' : 'Download CSV'}
            >
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              <span>CSV</span>
            </button>
          )}

          {/* 3. Fail-Proof 1-Click Clipboard Copy to Excel */}
          {activeDownload.fallbackRows && (
            <button
              type="button"
              onClick={handleCopy}
              className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer ${
                isCopied
                  ? 'bg-emerald-500 text-slate-950 font-black'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black'
              }`}
              title={isAr ? 'نسخ كافة الأعمدة والصفوف للصقها مباشرة في Excel (Ctrl+V)' : 'Copy all rows to paste directly in Excel'}
            >
              <Copy className="w-3.5 h-3.5" />
              <span>
                {isCopied
                  ? (isAr ? 'تم النسخ! الصق في إكسل' : 'Copied! Paste in Excel')
                  : (isAr ? 'نسخ فوري لإكسل (Ctrl+V)' : 'Copy to Excel')}
              </span>
            </button>
          )}
        </div>

        <p className="text-[10px] text-slate-400 mt-2 text-center">
          {isAr
            ? '💡 في حال منع متصفحك أو الإطار التنزيل المباشر، يمكنك الضغط على "نسخ فوري لإكسل" ولصقه فوراً في Excel.'
            : '💡 If browser security restricts direct file downloads in iframe, click "Copy to Excel" to paste directly.'}
        </p>
      </div>
    </div>
  );
};
