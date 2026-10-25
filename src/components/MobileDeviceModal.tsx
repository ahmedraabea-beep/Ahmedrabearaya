import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  X,
  Smartphone,
  Laptop,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Zap,
  Globe,
  Share2,
  Download,
  Sparkles,
} from 'lucide-react';
import { Language } from '../types/sales';

interface MobileDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

export const MobileDeviceModal: React.FC<MobileDeviceModalProps> = ({
  isOpen,
  onClose,
  language,
}) => {
  const isAr = language === 'ar';
  const [activeTab, setActiveTab] = useState<'mobile' | 'laptop'>('mobile');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Exact live URLs
  const liveProductionUrl = 'https://ais-pre-7vh6gg3hs2lneioro2fk22-128844658678.europe-west3.run.app';
  const currentAppUrl = typeof window !== 'undefined' ? window.location.href : liveProductionUrl;
  const targetUrl = liveProductionUrl || currentAppUrl;

  useEffect(() => {
    if (isOpen) {
      QRCode.toDataURL(targetUrl, {
        width: 280,
        margin: 2,
        color: {
          dark: '#022c22',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'H',
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error(err));
    }
  }, [isOpen, targetUrl]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(targetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-emerald-950 via-slate-900 to-blue-950 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 flex items-center justify-center shadow-xs">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm sm:text-base font-bold text-white">
                  {isAr ? 'النسخة المعتمدة للكمبيوتر والموبايل' : 'Cross-Device PC & Mobile Suite'}
                </h3>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2 py-0.5 rounded-full font-bold">
                  PWA Ready
                </span>
              </div>
              <p className="text-[11px] text-emerald-200/80 mt-0.5">
                {isAr
                  ? 'تعمل بكامل كفاءتها على شاشات الكمبيوتر واللابتوب والهواتف الذكية'
                  : 'Fully responsive across laptops, desktops, tablets and smartphones'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Device Switcher Tabs */}
        <div className="flex items-center border-b border-slate-200 bg-slate-50/80 p-2 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('mobile')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'mobile'
                ? 'bg-white text-emerald-900 shadow-sm border border-emerald-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Smartphone className="w-4 h-4 text-emerald-600" />
            <span>{isAr ? 'الهاتف المحمول (Android & iPhone)' : 'Mobile Phone (iOS & Android)'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('laptop')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'laptop'
                ? 'bg-white text-blue-900 shadow-sm border border-blue-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Laptop className="w-4 h-4 text-blue-600" />
            <span>{isAr ? 'الكمبيوتر واللابتوب (Windows & Mac)' : 'PC & Laptop (Windows & Mac)'}</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {activeTab === 'mobile' ? (
            /* MOBILE TAB */
            <div className="flex flex-col items-center text-center space-y-4">
              {/* QR Code Container */}
              <div className="p-3.5 bg-white rounded-3xl border-2 border-emerald-500/40 shadow-lg relative group">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="Mobile QR Code"
                    className="w-48 h-48 sm:w-56 sm:h-56 object-contain rounded-2xl"
                  />
                ) : (
                  <div className="w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center bg-slate-100 text-slate-400 text-xs rounded-2xl">
                    جاري توليد الباركود...
                  </div>
                )}
                <div className="absolute -bottom-2 -right-2 bg-emerald-600 text-white p-1.5 rounded-full shadow-md">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                </div>
              </div>

              <div>
                <h4 className="text-base font-bold text-slate-900 flex items-center justify-center gap-1.5">
                  <span>{isAr ? 'امسح الباركود بكاميرا هاتفك' : 'Scan QR code with your phone camera'}</span>
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  {isAr
                    ? 'افتح كاميرا الهاتف ووجهها نحو الباركود لفتح لوحة التحكم فوراً على الموبايل بكامل شاشتها مع المزامنة السحابية اللحظية.'
                    : 'Open your phone camera to launch the dashboard instantly with real-time cloud synchronization.'}
                </p>
              </div>

              {/* Direct Copy URL */}
              <div className="w-full space-y-1.5 text-right">
                <label className="text-[11px] font-bold text-slate-600 block">
                  {isAr ? 'أو افتح الرابط المباشر على متصفح الموبايل:' : 'Or open direct link on mobile browser:'}
                </label>
                <div className="w-full flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-1.5 pl-3">
                  <span className="text-[11px] text-slate-700 font-mono truncate flex-1 text-left select-all">
                    {targetUrl}
                  </span>
                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors shrink-0 cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ الرابط' : 'Copy')}</span>
                  </button>

                  <a
                    href={targetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors shrink-0"
                    title={isAr ? 'فتح في نافذة جديدة' : 'Open in new tab'}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Install on Mobile Instructions */}
              <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 text-right">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-md bg-slate-200 text-slate-800 flex items-center justify-center font-bold text-[10px]">
                      iOS
                    </span>
                    <span>{isAr ? 'هواتف آيفون (Apple Safari)' : 'iPhone (Safari)'}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {isAr
                      ? 'اضغط على زر المشاركة (Share) أسفل الشاشة، ثم اختر "إضافة إلى الشاشة الرئيسية" (Add to Home Screen) ليعمل كتطبيق كامل.'
                      : 'Tap Share button in Safari, then select "Add to Home Screen" to install.'}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1.5 text-xs">
                  <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-md bg-emerald-200 text-emerald-800 flex items-center justify-center font-bold text-[10px]">
                      Android
                    </span>
                    <span>{isAr ? 'هواتف أندرويد (Google Chrome)' : 'Android (Chrome)'}</span>
                  </div>
                  <p className="text-[11px] text-emerald-800 leading-relaxed">
                    {isAr
                      ? 'ستظهر لك رسالة "تثبيت التطبيق" تلقائياً، أو اضغط على النقاط الثلاث أعلى المتصفح واختر "تثبيت التطبيق".'
                      : 'Tap "Install app" prompt or the 3-dots menu to add icon to home screen.'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* LAPTOP / PC TAB */
            <div className="space-y-4 text-right">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Laptop className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-blue-950">
                    {isAr ? 'تشغيل لوحة التحكم على شاشة الكمبيوتر واللابتوب' : 'Desktop & Laptop Optimized Experience'}
                  </h4>
                  <p className="text-xs text-blue-800/90 mt-1 leading-relaxed">
                    {isAr
                      ? 'مصممة خصيصاً للشاشات العريضة (Full HD, 2K, 4K) مع إمكانية سحب وإفلات شيتات الإكسيل مباشرة، ومتابعة رسوم الأداء البيانية والمقارنات بدقة كاملة.'
                      : 'Optimized for high-resolution wide displays with drag & drop Excel uploads, interactive charts, and real-time quota analysis.'}
                  </p>
                </div>
              </div>

              {/* Direct Desktop URL */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 block">
                  {isAr ? 'رابط النسخة المعتمدة المباشر للكمبيوتر:' : 'Direct desktop link:'}
                </label>
                <div className="w-full flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-1.5 pl-3">
                  <span className="text-[11px] text-slate-700 font-mono truncate flex-1 text-left select-all">
                    {targetUrl}
                  </span>
                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-blue-800 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors shrink-0 cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-blue-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ الرابط' : 'Copy')}</span>
                  </button>
                </div>
              </div>

              {/* Desktop PWA Installation Steps */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                <div className="font-bold text-slate-900 flex items-center gap-2">
                  <Download className="w-4 h-4 text-emerald-600" />
                  <span>{isAr ? 'تثبيت البرنامج كتطبيق مستقل على اللابتوب (Windows / Mac):' : 'Install as Standalone Desktop App:'}</span>
                </div>
                <ol className="text-[11px] text-slate-600 space-y-1.5 list-decimal list-inside pr-1 leading-relaxed">
                  <li>
                    {isAr
                      ? 'افتح الرابط في متصفح Google Chrome أو Microsoft Edge على الكمبيوتر.'
                      : 'Open the URL in Google Chrome or Microsoft Edge on your PC.'}
                  </li>
                  <li>
                    {isAr
                      ? 'ستجد أيقونة تثبيت صغيرة (Install icon 🖥️) في أقصى يمين شريط العنوان بجوار النجمة.'
                      : 'Click the small Install icon in the address bar.'}
                  </li>
                  <li>
                    {isAr
                      ? 'اضغط "تثبيت" (Install) وسيفتح البرنامج في نافذة مستقلة أنيقة وبدون شريط المتصفح وتظهر له أيقونة على سطح المكتب.'
                      : 'Click Install to launch in a clean standalone window with a desktop shortcut.'}
                  </li>
                </ol>
              </div>

              {/* Cross-Device Sync Feature */}
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3 text-xs text-emerald-950">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">
                    {isAr ? 'مزامنة فورية ثنائية الاتجاه:' : 'Bidirectional Live Cloud Sync:'}
                  </strong>
                  <span className="text-[11px] text-emerald-800">
                    {isAr
                      ? 'أي شيت مبيعات أو حوافز ترفعه من اللابتوب يظهر فوراً في لحظتها على موبايلك وموبايل المستشارين، وأي تعديل من الموبايل ينعكس تلقائياً على اللابتوب.'
                      : 'Any file uploaded or edited on your laptop updates in real-time across all mobile devices.'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Globe className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-mono text-[11px]">{liveProductionUrl.replace('https://', '')}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-xl transition-colors cursor-pointer"
            >
              {copied ? (isAr ? 'تم نسخ الرابط ✓' : 'Copied ✓') : (isAr ? 'نسخ رابط التشغيل' : 'Copy URL')}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              {isAr ? 'إغلاق' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
