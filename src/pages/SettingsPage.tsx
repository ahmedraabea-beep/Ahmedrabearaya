import React, { useState, useRef } from 'react';
import { useDataStore } from '../store/DataStore';
import { selectDataConsistencyReport } from '../store/selectors';
import { TargetNotificationCenter } from '../components/TargetNotificationCenter';
import { GitHubSettings } from '../components/GitHubSettings';
import {
  Settings,
  Globe,
  Coins,
  Percent,
  Smartphone,
  Bell,
  Database,
  FileSpreadsheet,
  ShieldCheck,
  RefreshCw,
  Download,
  Upload,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Laptop,
} from 'lucide-react';
import { Currency, Language } from '../types/sales';
import { clearSavedInventoryColumnMapping } from '../utils/excelParser';

export const SettingsPage: React.FC = () => {
  const { state, dispatch, saveStoreNow, syncWithServer, resetToDemo } = useDataStore();
  const { language, currency, vatMode } = state.settings;
  const isAr = language === 'ar';

  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const jsonFileInputRef = useRef<HTMLInputElement>(null);

  const consistencyReport = selectDataConsistencyReport(state);

  const showStatus = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleLanguageChange = (newLang: Language) => {
    dispatch({ type: 'SET_SETTINGS', payload: { language: newLang } });
    saveStoreNow();
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLang;
    showStatus(newLang === 'ar' ? 'تم تحويل لغة النظام إلى العربية' : 'Language switched to English');
  };

  const handleCurrencyChange = (newCurr: Currency) => {
    dispatch({ type: 'SET_SETTINGS', payload: { currency: newCurr } });
    saveStoreNow();
    showStatus(isAr ? `تم تعيين العملة إلى ${newCurr}` : `Currency set to ${newCurr}`);
  };

  const handleVatToggle = (newVat: 'afterVat' | 'beforeVat') => {
    dispatch({ type: 'SET_SETTINGS', payload: { vatMode: newVat } });
    saveStoreNow();
    showStatus(
      isAr
        ? newVat === 'afterVat'
          ? 'تم تفعيل وضع بعد الضريبة (شامل 14%)'
          : 'تم تفعيل وضع قبل الضريبة (صافي)'
        : `Switched VAT display mode to ${newVat}`
    );
  };

  // Export entire unified store as JSON backup
  const handleExportJsonBackup = () => {
    const fullBackup = {
      version: '3.0',
      exportedAt: new Date().toISOString(),
      store: {
        records: state.records,
        targets: state.targets,
        incentiveRules: state.incentiveRules,
        settings: state.settings,
        shifts: state.shifts,
        inventoryItems: state.inventoryItems,
        retention: state.retention,
        notificationSettings: state.notificationSettings,
        columnMappings: state.columnMappings,
      },
    };

    const blob = new Blob([JSON.stringify(fullBackup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Raya_Unified_Store_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showStatus(isAr ? 'تم تصدير النسخة الاحتياطية بنجاح!' : 'Database JSON backup downloaded!');
  };

  // Import JSON backup
  const handleImportJsonBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const storeData = parsed.store || parsed;
        dispatch({ type: 'SET_FULL_STORE', payload: storeData });
        saveStoreNow();
        showStatus(isAr ? 'تم استيراد قاعدة البيانات بنجاح واستعادتها بالكامل!' : 'Database restored successfully!');
      } catch (err) {
        showStatus(isAr ? 'فشل قراءة ملف النسخة الاحتياطية. تأكد أنه ملف JSON سليم.' : 'Failed to parse JSON backup.');
      }
    };
    reader.readAsText(file);
    if (jsonFileInputRef.current) jsonFileInputRef.current.value = '';
  };

  const handleResetToDemo = () => {
    if (
      window.confirm(
        isAr
          ? 'هل أنت متأكد من إعادة ضبط كل البيانات والعودة للبيانات القياسية لفرع راية كونكورد بلازا؟'
          : 'Are you sure you want to reset all data to default Raya Concorde Plaza values?'
      )
    ) {
      resetToDemo();
      showStatus(isAr ? 'تمت إعادة ضبط البيانات إلى الحالة الافتراضية بنجاح!' : 'Store reset to default demo data!');
    }
  };

  const handleClearColumnMappings = () => {
    clearSavedInventoryColumnMapping();
    dispatch({ type: 'SET_COLUMN_MAPPINGS', payload: {} });
    saveStoreNow();
    showStatus(isAr ? 'تم مسح ارتباطات الأعمدة المحفوظة.' : 'Saved column mappings cleared.');
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-700/60 text-slate-200 text-xs font-semibold mb-2">
              <Settings className="w-4 h-4 text-blue-400" />
              <span>{isAr ? 'مركز الإعدادات وإدارة النظام' : 'System Configuration & Data Hub'}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isAr ? 'إعدادات المنظومة وتوحيد البيانات (Single Source of Truth)' : 'Global System Settings & Unified Store'}
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              {isAr
                ? 'التحكم في اللغة والعملة، ضريبة القيمة المضافة، إعدادات التنبيهات، تثبيت تطبيق الموبايل، والنسخ الاحتياطي لقاعدة البيانات الموحدة.'
                : 'Configure language, currency, 14% VAT mode, mobile PWA setup, radar notification thresholds, and JSON backups.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => syncWithServer()}
              disabled={state.isSyncing}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition shadow-lg shadow-blue-950/40 cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${state.isSyncing ? 'animate-spin' : ''}`} />
              <span>{isAr ? 'مزامنة السيرفر الآن' : 'Sync Server Now'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Status Feedback Toast */}
      {statusMessage && (
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-sm font-medium flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <span>{statusMessage}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-blue-500 hover:text-blue-700 text-xs">
            ✕
          </button>
        </div>
      )}

      {/* Grid of Settings Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Module 1: Regional & Financial Preferences */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {isAr ? 'اللغة والعملة والضريبة' : 'Regional & Financial Settings'}
              </h2>
              <p className="text-xs text-slate-500">
                {isAr ? 'تخصيص الواجهة والعرض المالي' : 'Display preferences across all dashboard pages'}
              </p>
            </div>
          </div>

          {/* Language Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-2">
              <Globe className="w-4 h-4 text-slate-400" />
              <span>{isAr ? 'لغة الواجهة (Interface Language)' : 'Interface Language'}</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleLanguageChange('ar')}
                className={`py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer border ${
                  language === 'ar'
                    ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>العربية (RTL - افتراضي)</span>
                {language === 'ar' && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
              </button>
              <button
                type="button"
                onClick={() => handleLanguageChange('en')}
                className={`py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer border ${
                  language === 'en'
                    ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>English (LTR)</span>
                {language === 'en' && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
              </button>
            </div>
          </div>

          {/* Currency Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-2">
              <Coins className="w-4 h-4 text-slate-400" />
              <span>{isAr ? 'عملة العرض (Currency)' : 'Currency'}</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['EGP', 'USD', 'SAR'] as Currency[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => handleCurrencyChange(c)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border ${
                    currency === c
                      ? 'bg-emerald-50 border-emerald-600 text-emerald-700 shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>{c === 'EGP' ? (isAr ? 'ج.م (EGP)' : 'EGP') : c}</span>
                  {currency === c && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                </button>
              ))}
            </div>
          </div>

          {/* VAT Display Mode */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-2">
              <Percent className="w-4 h-4 text-slate-400" />
              <span>{isAr ? 'طريقة احتساب ضريبة القيمة المضافة 14%' : 'VAT Display Mode (14%)'}</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleVatToggle('afterVat')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-1 cursor-pointer border ${
                  vatMode === 'afterVat'
                    ? 'bg-purple-50 border-purple-600 text-purple-700 shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>{isAr ? 'بعد الضريبة (شامل 14%)' : 'After VAT (Inclusive)'}</span>
                <span className="text-[10px] font-normal text-slate-500">
                  {isAr ? 'المعتمد في تارجت راية الرسمي' : 'Official Raya Target Base'}
                </span>
              </button>
              <button
                type="button"
                onClick={() => handleVatToggle('beforeVat')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-1 cursor-pointer border ${
                  vatMode === 'beforeVat'
                    ? 'bg-purple-50 border-purple-600 text-purple-700 shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>{isAr ? 'قبل الضريبة (الصافي Net)' : 'Before VAT (Net)'}</span>
                <span className="text-[10px] font-normal text-slate-500">
                  {isAr ? 'الصافي قبل احتساب الضريبة' : 'Net sales pre-tax'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Module 2: Mobile Setup & PWA QR */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {isAr ? 'تطبيق الهاتف والأجهزة الذكية' : 'Mobile PWA & Multi-Device'}
              </h2>
              <p className="text-xs text-slate-500">
                {isAr ? 'ربط الهاتف، تثبيت PWA، وإدارة التنبيهات' : 'Install on Android/iOS and configure radars'}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-start gap-3">
              <Smartphone className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-slate-800">
                  {isAr ? 'رمز QR لتثبيت التطبيق على هاتف الأندرويد' : 'Android App QR Code & Link'}
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  {isAr
                    ? 'افتح الكاميرا على هاتفك وامسح الرمز لتشغيل واجهة الأندرويد المخصصة مع شريط التنقل السفلي الفوري.'
                    : 'Scan the QR code from your mobile camera to open the native bottom-navigation mobile view.'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsMobileModalOpen(true)}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-sm"
            >
              <Smartphone className="w-4 h-4" />
              <span>{isAr ? 'عرض رمز الـ QR ورابط الموبايل' : 'View Mobile QR & Deep Links'}</span>
            </button>
          </div>

          {/* Target Notification Center Trigger */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-start gap-3">
              <Bell className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-slate-800">
                  {isAr ? 'رادار تنبيهات التارجت والانحرافات' : 'Target Milestones & Deviations Radar'}
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  {isAr
                    ? 'إشعارات لحظية عند تحقيق 90% و 100% من الهدف، تنبيهات تراجع المبيعات وإجراءات التصحيح الفورية عبر الواتساب.'
                    : 'Push notifications for 90%/100% target hits, deviation flags, and automated WhatsApp alert drafts.'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsNotificationCenterOpen(true)}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-sm"
            >
              <Sliders className="w-4 h-4 text-amber-400" />
              <span>{isAr ? 'إعدادات رادار التنبيهات والإشعارات' : 'Open Radar & Alert Center'}</span>
            </button>
          </div>
        </div>

        {/* Module 3: Single Source of Truth & Database Management */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6 md:col-span-2">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {isAr ? 'إدارة مصدر البيانات الموحد والنسخ الاحتياطي' : 'Unified Store & Backup Management'}
                </h2>
                <p className="text-xs text-slate-500">
                  {isAr
                    ? 'السيرفر المركزي (server.ts + store.json) هو المصدر الوحيد، مع مزامنة تلقائية وكاش offline'
                    : 'Server backend is the authoritative source of truth with 700ms debounce and offline cache'}
                </p>
              </div>
            </div>

            <div className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>{isAr ? 'مصدر البيانات متكامل' : 'Single Source Active'}</span>
            </div>
          </div>

          {/* Consistency Audit Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <span className="text-[11px] text-slate-500 block">{isAr ? 'إجمالي السجلات' : 'Total Records'}</span>
              <span className="text-lg font-black text-slate-900">{consistencyReport.totalRecords}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">{isAr ? 'الفترات المحفوظة' : 'Periods Tracked'}</span>
              <span className="text-lg font-black text-slate-900">{consistencyReport.periodsCount}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">{isAr ? 'الفروع المسجلة' : 'Branches'}</span>
              <span className="text-lg font-black text-slate-900">{consistencyReport.branchesCount}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">{isAr ? 'حالة التزامن' : 'Sync Status'}</span>
              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 mt-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{state.isSyncing ? (isAr ? 'جارِ المزامنة...' : 'Syncing...') : isAr ? 'متزامن تماماً' : 'Synchronized'}</span>
              </span>
            </div>
          </div>

          {/* Backup, Restore & Reset Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={handleExportJsonBackup}
              className="px-4 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs transition cursor-pointer flex items-center gap-2 border border-blue-200"
            >
              <Download className="w-4 h-4" />
              <span>{isAr ? 'تصدير نسخة احتياطية كاملة (JSON)' : 'Export Full Store JSON'}</span>
            </button>

            <label className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer flex items-center gap-2 border border-slate-300">
              <Upload className="w-4 h-4" />
              <span>{isAr ? 'استيراد نسخة احتياطية (JSON)' : 'Import Store JSON'}</span>
              <input
                ref={jsonFileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImportJsonBackup}
              />
            </label>

            <button
              onClick={handleClearColumnMappings}
              className="px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 font-semibold text-xs transition cursor-pointer flex items-center gap-2 border border-slate-200"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>{isAr ? 'إعادة ضبط أعمدة الإكسيل' : 'Reset Excel Mappings'}</span>
            </button>

            <div className="flex-1" />

            <button
              onClick={handleResetToDemo}
              className="px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-xs transition cursor-pointer flex items-center gap-2 border border-red-200"
            >
              <RotateCcw className="w-4 h-4 text-red-600" />
              <span>{isAr ? 'إعادة ضبط لبيانات راية الأصلية' : 'Reset to Default Demo'}</span>
            </button>
          </div>
        </div>

        {/* Module 4: Publish to GitHub & Vercel Auto-Deployment */}
        <GitHubSettings language={language} />
      </div>



      <TargetNotificationCenter
        isOpen={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
        records={state.records}
        currency={currency}
        language={language}
        settings={state.notificationSettings}
        onUpdateSettings={(newSettings) => {
          dispatch({ type: 'SET_NOTIFICATION_SETTINGS', payload: newSettings });
          saveStoreNow();
        }}
        onSelectEmployee={() => {
          setIsNotificationCenterOpen(false);
          window.location.hash = '#/staff';
        }}
      />
    </div>
  );
};

export default SettingsPage;
