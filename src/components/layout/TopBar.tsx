import React from 'react';
import {
  Search,
  Bell,
  Calendar,
  Building2,
  ChevronRight,
  Languages,
  DollarSign,
  Laptop,
  Smartphone,
  Sparkles,
  Zap,
} from 'lucide-react';
import { AppRoute } from './useHashRouter';
import { useDataStore } from '../../store/DataStore';
import { selectUniquePeriods, selectUniqueBranches } from '../../store/selectors';
import { Currency, Language } from '../../types/sales';

interface TopBarProps {
  currentRoute: AppRoute;
  onOpenCommandPalette: () => void;
  onOpenNotificationCenter: () => void;
  onOpenMobileModal: () => void;
  activeAlertsCount: number;
}

const ROUTE_NAMES: Record<string, { ar: string; en: string }> = {
  '/': { ar: 'الرئيسية (لوحة التحكم)', en: 'Dashboard' },
  '/sales': { ar: 'المبيعات والسجلات', en: 'Sales & Records' },
  '/targets': { ar: 'الأهداف والتارجت', en: 'Targets & Goals' },
  '/staff': { ar: 'الموظفين والأداء', en: 'Staff & Roster' },
  '/incentives': { ar: 'الحوافز والمكافآت', en: 'Incentives Center' },
  '/analytics': { ar: 'التحليلات والتوقعات', en: 'Analytics & Forecasts' },
  '/inventory': { ar: 'المخزون الذكي', en: 'Smart Inventory' },
  '/reports': { ar: 'التقارير والتصدير', en: 'Reports & Exports' },
  '/settings': { ar: 'الإعدادات والبيانات', en: 'Settings & Data' },
};

export const TopBar: React.FC<TopBarProps> = ({
  currentRoute,
  onOpenCommandPalette,
  onOpenNotificationCenter,
  onOpenMobileModal,
  activeAlertsCount,
}) => {
  const { state, dispatch } = useDataStore();
  const isAr = state.settings.language === 'ar';
  const periods = selectUniquePeriods(state);
  const branches = selectUniqueBranches(state);

  const routeName = ROUTE_NAMES[currentRoute] || { ar: 'الرئيسية', en: 'Dashboard' };

  const handleToggleVat = () => {
    dispatch({
      type: 'UPDATE_SETTINGS',
      payload: {
        vatDisplayMode: state.settings.vatDisplayMode === 'afterVat' ? 'beforeVat' : 'afterVat',
      },
    });
  };

  const handleToggleLanguage = () => {
    dispatch({
      type: 'UPDATE_SETTINGS',
      payload: {
        language: state.settings.language === 'ar' ? 'en' : 'ar',
      },
    });
  };

  const currencies: Currency[] = ['EGP', 'SAR', 'AED', 'USD'];
  const handleCurrencyChange = (c: Currency) => {
    dispatch({
      type: 'UPDATE_SETTINGS',
      payload: { currency: c },
    });
  };

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
      <div className="px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2">
        {/* Left: Breadcrumbs & Page Title */}
        <div className="flex items-center gap-2 truncate">
          <span className="text-xs text-slate-400 hidden sm:inline">
            {isAr ? 'راية كونكورد' : 'Raya Concorde'}
          </span>
          <ChevronRight className={`w-3.5 h-3.5 text-slate-400 hidden sm:inline ${isAr ? 'rotate-180' : ''}`} />
          <h2 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
            {isAr ? routeName.ar : routeName.en}
          </h2>
        </div>

        {/* Right: Controls & Selectors */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Global Search Trigger (Ctrl+K) */}
          <button
            type="button"
            onClick={onOpenCommandPalette}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium transition-colors cursor-pointer border border-slate-200"
            title={isAr ? 'بحث شامل (Ctrl+K)' : 'Search (Ctrl+K)'}
          >
            <Search className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden lg:inline">{isAr ? 'بحث سريع...' : 'Quick search...'}</span>
            <kbd className="hidden sm:inline-block px-1 rounded bg-white text-[10px] font-mono border border-slate-200 text-slate-400">
              ⌘K
            </kbd>
          </button>

          {/* Period Selector */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-xl px-2 py-1 border border-slate-200">
            <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <select
              value={state.selectedPeriod}
              onChange={(e) => dispatch({ type: 'SET_PERIOD', payload: e.target.value })}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              {periods.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Branch Selector (if multiple exist) */}
          {branches.length > 1 && (
            <div className="hidden xl:flex items-center gap-1 bg-slate-100 rounded-xl px-2 py-1 border border-slate-200">
              <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <select
                value={state.selectedBranch}
                onChange={(e) => dispatch({ type: 'SET_BRANCH', payload: e.target.value })}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer max-w-[120px] truncate"
              >
                <option value="">{isAr ? 'كافة الفروع' : 'All Branches'}</option>
                {branches.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* VAT Mode Toggle */}
          <button
            type="button"
            onClick={handleToggleVat}
            className="px-2 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700"
            title={isAr ? 'تبديل وضع الضريبة (شامل 14% أو صافي)' : 'Toggle VAT Mode'}
          >
            {state.settings.vatDisplayMode === 'afterVat'
              ? isAr
                ? 'شامل 14%'
                : 'Gross'
              : isAr
              ? 'صافي'
              : 'Net'}
          </button>

          {/* Currency Switcher */}
          <div className="hidden sm:flex items-center bg-slate-100 rounded-xl p-0.5 border border-slate-200 text-xs font-bold">
            {currencies.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => handleCurrencyChange(c)}
                className={`px-1.5 py-0.5 rounded-lg transition-colors cursor-pointer ${
                  state.settings.currency === c
                    ? 'bg-white text-emerald-800 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {c === 'EGP' ? (isAr ? 'ج.م' : 'EGP') : c}
              </button>
            ))}
          </div>

          {/* Language Toggle */}
          <button
            type="button"
            onClick={handleToggleLanguage}
            className="p-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-200 transition-colors cursor-pointer"
            title={isAr ? 'Switch to English' : 'التحويل للعربية'}
          >
            <Languages className="w-3.5 h-3.5" />
          </button>

          {/* Milestone Alerts Bell */}
          <button
            type="button"
            onClick={onOpenNotificationCenter}
            className={`relative p-1.5 rounded-xl border transition-colors cursor-pointer ${
              activeAlertsCount > 0
                ? 'bg-amber-50 border-amber-300 text-amber-700'
                : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
            }`}
            title={isAr ? `مركز التنبيهات (${activeAlertsCount})` : `Alerts Radar (${activeAlertsCount})`}
          >
            <Bell className="w-4 h-4" />
            {activeAlertsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center ring-2 ring-white">
                {activeAlertsCount}
              </span>
            )}
          </button>

          {/* Mobile QR & PWA Modal Trigger */}
          <button
            type="button"
            onClick={onOpenMobileModal}
            className="p-1.5 text-slate-600 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 rounded-xl border border-slate-200 transition-colors cursor-pointer"
            title={isAr ? 'تثبيت وفتح على الهاتف' : 'Install on Mobile'}
          >
            <Smartphone className="w-4 h-4 text-emerald-600" />
          </button>
        </div>
      </div>
    </header>
  );
};
