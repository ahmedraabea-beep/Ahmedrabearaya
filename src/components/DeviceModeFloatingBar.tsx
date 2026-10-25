import React from 'react';
import { Smartphone, Laptop, QrCode, Cloud, Copy, Check, ExternalLink } from 'lucide-react';
import { Language } from '../types/sales';

interface DeviceModeFloatingBarProps {
  language: Language;
  onOpenMobileModal: () => void;
  onSwitchToMobile?: () => void;
  isSyncing: boolean;
}

export const DeviceModeFloatingBar: React.FC<DeviceModeFloatingBarProps> = ({
  language,
  onOpenMobileModal,
  onSwitchToMobile,
  isSyncing,
}) => {
  const isAr = language === 'ar';
  const [copied, setCopied] = React.useState(false);

  const liveUrl = 'https://ais-pre-7vh6gg3hs2lneioro2fk22-128844658678.europe-west3.run.app';

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(liveUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <aside aria-label={isAr ? 'شريط تشغيل الموبايل واللابتوب' : 'Cross-device mobile and laptop bar'} className="fixed bottom-4 left-4 z-40 print:hidden animate-in fade-in slide-in-from-bottom-3 duration-300">
      <div className="bg-slate-900/90 hover:bg-slate-900 text-white backdrop-blur-md border border-slate-700/80 shadow-2xl rounded-2xl p-2 sm:p-2.5 flex items-center gap-2 sm:gap-3 transition-all hover:scale-[1.01]">
        {/* Switch to Android Mobile View */}
        {onSwitchToMobile && (
          <button
            type="button"
            onClick={onSwitchToMobile}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
            title={isAr ? 'التبديل إلى واجهة الأندرويد المخصصة' : 'Switch to Android Mobile View'}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>{isAr ? 'واجهة الأندرويد' : 'Android App'}</span>
          </button>
        )}

        {/* Device Mode & QR Button */}
        <button
          type="button"
          onClick={onOpenMobileModal}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
          title={isAr ? 'عرض باركود الموبايل وتثبيت التطبيق على الهاتف واللابتوب' : 'Open mobile QR & PWA install'}
        >
          <QrCode className="w-3.5 h-3.5 text-emerald-300" />
          <span className="hidden sm:inline">{isAr ? 'باركود الهاتف' : 'QR Scan'}</span>
        </button>

        {/* Quick Copy Link Button */}
        <button
          type="button"
          onClick={handleCopy}
          className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
          title={isAr ? 'نسخ رابط التشغيل المباشر للهاتف' : 'Copy live app link'}
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-300 font-bold">{isAr ? 'تم النسخ!' : 'Copied!'}</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-slate-300" />
              <span>{isAr ? 'نسخ الرابط' : 'Copy Link'}</span>
            </>
          )}
        </button>

        {/* Cloud Sync Status Indicator */}
        <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-mono pl-1 sm:pl-2 border-l border-slate-700">
          <span className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`} />
          <span className="hidden md:inline">{isSyncing ? (isAr ? 'جاري المزامنة...' : 'Syncing...') : (isAr ? 'سحابي متصل' : 'Cloud Synced')}</span>
        </div>
      </div>
    </aside>
  );
};
