import React from 'react';
import {
  Upload,
  FileSpreadsheet,
  Languages,
  Coins,
  Activity,
  Target,
  QrCode,
  FileText,
  Bell,
  Download,
  ShieldCheck,
  Building2,
  TrendingUp,
  BarChart3,
  Sparkles,
  Boxes,
  Zap,
  Smartphone,
} from 'lucide-react';
import { Currency, Language } from '../types/sales';
import { translations } from '../utils/i18n';

interface NavbarProps {
  onOpenUpload: () => void;
  onOpenIncentives: () => void;
  onOpenTargetAllocation: () => void;
  onOpenMobileModal: () => void;
  onOpenMonthlyReport: () => void;
  onOpenNotificationCenter: () => void;
  onOpenDownloadCenter: () => void;
  onOpenExecutivePresentation?: () => void;
  onOpenUnifiedAiPrompt?: () => void;
  onOpenInventoryOptimizer?: () => void;
  activeAlertsCount?: number;
  onOpenAddRecord: () => void;
  onResetDemoData: () => void;
  onDownloadTemplate: () => void;
  currency: Currency;
  onCurrencyChange: (c: Currency) => void;
  language: Language;
  onToggleLanguage: () => void;
  onSwitchToMobile?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenUpload,
  onOpenIncentives,
  onOpenTargetAllocation,
  onOpenMobileModal,
  onOpenMonthlyReport,
  onOpenNotificationCenter,
  onOpenDownloadCenter,
  onOpenExecutivePresentation,
  onOpenUnifiedAiPrompt,
  onOpenInventoryOptimizer,
  activeAlertsCount = 0,
  currency,
  onCurrencyChange,
  language,
  onToggleLanguage,
  onSwitchToMobile,
}) => {
  const t = translations[language];
  const isAr = language === 'ar';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-2 md:gap-4 h-16">
          {/* Zone 1: Official Corporate Wordmark & Branch Badge */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-700 via-emerald-800 to-slate-900 text-white flex items-center justify-center font-black text-lg shadow-sm border border-emerald-600/30">
              <span className="font-mono tracking-tighter">R</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <a
                  href="#overview"
                  className="text-base sm:text-lg font-black tracking-tight text-slate-900 hover:text-emerald-700 transition-colors whitespace-nowrap flex items-center gap-1.5"
                >
                  <span className="text-emerald-800">{isAr ? 'راية' : 'Raya'}</span>
                  <span className="text-slate-900 font-extrabold">{isAr ? 'فرع كونكورد بلازا' : 'Concorde Plaza Branch'}</span>
                </a>
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-300/80 px-2 py-0.5 rounded-md whitespace-nowrap hidden sm:inline-block">
                  {isAr ? 'التجمع الخامس' : 'New Cairo'}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-semibold hidden sm:block whitespace-nowrap">
                {isAr ? 'منظومة إدارة المبيعات والحوافز وضريبة 14% التنفيذية' : 'Executive Sales, Targets & 14% VAT Management'}
              </p>
            </div>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden 2xl:flex items-center gap-4 text-xs font-bold text-slate-600">
            <a href="#overview" className="hover:text-emerald-700 transition-colors whitespace-nowrap">
              {t.navOverview}
            </a>
            <a href="#raya-inventory-dashboard" className="text-[#002B49] hover:text-[#004B87] transition-colors whitespace-nowrap flex items-center gap-1 font-black bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200 shadow-2xs">
              <Boxes className="w-3.5 h-3.5 text-[#004B87]" />
              <span>{isAr ? 'مدير الإمداد والمخزون' : 'Inventory Optimizer'}</span>
            </a>
            <a href="#achievements-dashboard" className="text-emerald-800 hover:text-emerald-950 transition-colors whitespace-nowrap flex items-center gap-1 font-black bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              <span>{isAr ? 'داش بورد الإنجازات' : 'Achievements'}</span>
            </a>
            <a href="#branch-curve" className="hover:text-emerald-700 transition-colors whitespace-nowrap flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t.navCurve}</span>
            </a>
            <a href="#sections-analytics" className="hover:text-emerald-700 transition-colors whitespace-nowrap flex items-center gap-1">
              <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isAr ? 'أداء الأقسام والموظفين' : 'Sections & Staff'}</span>
            </a>
            <a href="#employee-deep-analytics" className="hover:text-emerald-700 transition-colors whitespace-nowrap flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isAr ? 'تحليل الموظفين ومؤشر الكفاءة' : 'Deep Analytics'}</span>
            </a>
            <a href="#growth-forecast" className="hover:text-emerald-700 transition-colors whitespace-nowrap">
              {t.navForecast}
            </a>
            <a href="#branches-chart" className="hover:text-emerald-700 transition-colors whitespace-nowrap">
              {t.navBranches}
            </a>
            <a href="#employees-table" className="hover:text-emerald-700 transition-colors whitespace-nowrap">
              {t.navEmployees}
            </a>
            <a href="#leaderboard" className="hover:text-emerald-700 transition-colors whitespace-nowrap">
              {t.navLeaderboard}
            </a>
          </nav>

          {/* Zone 3: Primary Actions & Unified Control Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Download Center Button (Solves download links) */}
            <button
              onClick={onOpenDownloadCenter}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300/80 rounded-lg transition-colors whitespace-nowrap shadow-2xs cursor-pointer"
              title={isAr ? 'مركز تحميل شيتات الإكسيل والتقارير المعتمدة' : 'Official Downloads & Templates Center'}
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden md:inline">{t.downloadCenterBtn}</span>
            </button>

            {/* Unified AI Prompt & Import Button */}
            {onOpenUnifiedAiPrompt && (
              <button
                onClick={onOpenUnifiedAiPrompt}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-black text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-300 rounded-lg transition-colors whitespace-nowrap shadow-2xs cursor-pointer"
                title={isAr ? 'مولّد برومبت الذكاء الاصطناعي لتوحيد وتنسيق البيانات' : 'Unified AI Formatting Prompt'}
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-600 animate-pulse" />
                <span className="hidden lg:inline">{isAr ? 'برومبت توحيد البيانات (AI)' : 'Unified AI Prompt'}</span>
              </button>
            )}

            {/* Smart Inventory & Sales Optimizer Button */}
            {onOpenInventoryOptimizer && (
              <button
                onClick={onOpenInventoryOptimizer}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-black text-white bg-gradient-to-r from-emerald-700 to-teal-800 hover:from-emerald-600 hover:to-teal-700 border border-emerald-500 rounded-lg transition-all whitespace-nowrap shadow-xs cursor-pointer hover:shadow-md"
                title={isAr ? 'مدير الإمداد والمبيعات الذكي لفرع كونكورد (أرصدة الفرع والمخزن والمبيعات)' : 'Smart Inventory & Sales Optimizer'}
              >
                <Boxes className="w-3.5 h-3.5 text-emerald-300 animate-pulse" />
                <span className="inline">{isAr ? 'مدير الإمداد والمبيعات الذكي' : 'Inventory Optimizer'}</span>
              </button>
            )}

            {/* Currency selector (EGP default) */}
            <div className="flex items-center text-xs font-medium bg-slate-100 rounded-lg p-0.5 border border-slate-200">
              {(['EGP', 'SAR', 'AED', 'USD'] as Currency[]).map((c) => (
                <button
                  key={c}
                  onClick={() => onCurrencyChange(c)}
                  className={`px-2 py-1 rounded-md transition-colors whitespace-nowrap ${
                    currency === c
                      ? 'bg-white text-slate-900 shadow-xs font-bold'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                  title={`${t.currencyLabel}: ${c}`}
                >
                  {isAr ? (c === 'EGP' ? 'ج.م' : c === 'SAR' ? 'ر.س' : c === 'AED' ? 'د.إ' : '$') : c}
                </button>
              ))}
            </div>

            {/* Language Switcher */}
            <button
              onClick={onToggleLanguage}
              className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors whitespace-nowrap shadow-2xs cursor-pointer"
              title={isAr ? 'Switch to English' : 'التحويل إلى اللغة العربية'}
            >
              <Languages className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">{t.languageToggle}</span>
            </button>

            {/* Target Allocation Engine Button */}
            <button
              onClick={onOpenTargetAllocation}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-300 rounded-lg transition-colors whitespace-nowrap shadow-2xs cursor-pointer"
              title={isAr ? 'شيت تارجت الفرع وطريقة التقسيم' : 'Branch Target & Allocation'}
            >
              <Target className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden lg:inline">{isAr ? 'تقسيم التارجت' : 'Target Split'}</span>
            </button>

            {/* Manage Incentives Button */}
            <button
              onClick={onOpenIncentives}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg transition-colors whitespace-nowrap shadow-2xs cursor-pointer"
              title={isAr ? 'عرض وإدارة شيت حوافز الشركة' : 'Manage corporate product incentives'}
            >
              <Coins className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden xl:inline">{t.uploadIncentivesBtn}</span>
            </button>

            {/* Monthly PDF Report Button */}
            <button
              onClick={onOpenMonthlyReport}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-300 rounded-lg transition-colors whitespace-nowrap shadow-2xs cursor-pointer"
              title={isAr ? 'استخراج تقرير أداء الفرع كـ PDF' : 'Generate Monthly PDF Report'}
            >
              <FileText className="w-3.5 h-3.5 text-purple-600" />
              <span className="hidden sm:inline">{t.monthlyReportBtn}</span>
            </button>

            {/* Real-time Target Alerts & Notifications Bell */}
            <button
              onClick={onOpenNotificationCenter}
              className={`relative inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer shadow-2xs ${
                activeAlertsCount > 0
                  ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 border border-amber-400'
                  : 'text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300'
              }`}
              title={isAr ? `مركز التنبيهات اللحظية (${activeAlertsCount} تنبيه نشط)` : `Live Alerts Radar (${activeAlertsCount} alerts)`}
            >
              <Bell className={`w-3.5 h-3.5 ${activeAlertsCount > 0 ? 'text-amber-600 animate-bounce' : 'text-slate-600'}`} />
              <span className="hidden xl:inline">{isAr ? 'التنبيهات' : 'Alerts'}</span>
              {activeAlertsCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center ring-2 ring-white">
                  {activeAlertsCount}
                </span>
              )}
            </button>

            {/* Switch to Android Mobile View */}
            {onSwitchToMobile && (
              <button
                onClick={onSwitchToMobile}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors cursor-pointer shadow-2xs"
                title={isAr ? 'التبديل إلى واجهة الأندرويد المخصصة للهاتف' : 'Switch to Android Mobile View'}
              >
                <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">{isAr ? 'واجهة الأندرويد' : 'Mobile App'}</span>
              </button>
            )}

            {/* Mobile QR trigger button */}
            <button
              onClick={onOpenMobileModal}
              className="p-1.5 text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors cursor-pointer"
              title={isAr ? 'فتح على الموبايل' : 'Open on Mobile'}
            >
              <QrCode className="w-4 h-4 text-emerald-600" />
            </button>

            {/* Primary Action Button: Upload */}
            <button
              onClick={onOpenUpload}
              className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg transition-colors shadow-xs whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>{t.uploadSheetBtn}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
