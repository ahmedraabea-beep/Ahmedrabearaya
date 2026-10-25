import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  Target,
  Users,
  Award,
  TrendingUp,
  Package,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Building2,
  Sparkles,
} from 'lucide-react';
import { AppRoute } from './useHashRouter';
import { useDataStore } from '../../store/DataStore';
import { selectFinancialTotals } from '../../store/selectors';

interface SidebarProps {
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRoute,
  onNavigate,
  isCollapsed,
  onToggleCollapse,
}) => {
  const { state } = useDataStore();
  const isAr = state.settings.language === 'ar';
  const totals = selectFinancialTotals(state);

  const navItems: Array<{
    route: AppRoute;
    titleAr: string;
    titleEn: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string | number;
    badgeColor?: string;
  }> = [
    {
      route: '/',
      titleAr: 'الرئيسية',
      titleEn: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      route: '/sales',
      titleAr: 'المبيعات والسجلات',
      titleEn: 'Sales & Ingestion',
      icon: Receipt,
      badge: totals.transactionsCount,
      badgeColor: 'bg-emerald-100 text-emerald-800',
    },
    {
      route: '/targets',
      titleAr: 'الأهداف والتارجت',
      titleEn: 'Targets & Goals',
      icon: Target,
    },
    {
      route: '/staff',
      titleAr: 'الموظفين والأداء',
      titleEn: 'Staff & Roster',
      icon: Users,
      badge: state.records.length,
      badgeColor: 'bg-blue-100 text-blue-800',
    },
    {
      route: '/incentives',
      titleAr: 'الحوافز والمكافآت',
      titleEn: 'Incentives',
      icon: Award,
    },
    {
      route: '/analytics',
      titleAr: 'التحليلات والتوقعات',
      titleEn: 'Analytics & Growth',
      icon: TrendingUp,
    },
    {
      route: '/inventory',
      titleAr: 'المخزون الذكي',
      titleEn: 'Smart Inventory',
      icon: Package,
    },
    {
      route: '/reports',
      titleAr: 'التقارير والتصدير',
      titleEn: 'Reports & Export',
      icon: FileText,
    },
    {
      route: '/settings',
      titleAr: 'الإعدادات والبيانات',
      titleEn: 'Settings & Backup',
      icon: Settings,
    },
  ];

  return (
    <aside
      className={`hidden md:flex flex-col bg-slate-900 text-white transition-all duration-300 border-l border-slate-800 z-30 select-none ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* Brand Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800 shrink-0">
        {!isCollapsed && (
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center font-black text-white text-base shadow-sm shrink-0 border border-emerald-500/30">
              R
            </div>
            <div className="truncate">
              <h1 className="text-sm font-bold tracking-tight text-white truncate">
                {isAr ? 'راية كونكورد بلازا' : 'Raya Concorde Plaza'}
              </h1>
              <p className="text-[10px] text-emerald-400 font-semibold truncate">
                {isAr ? 'منظومة إدارة المبيعات' : 'Sales Management Suite'}
              </p>
            </div>
          </div>
        )}

        {isCollapsed && (
          <div className="w-full flex justify-center">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center font-black text-white text-base shadow-sm border border-emerald-500/30">
              R
            </div>
          </div>
        )}

        {/* Collapse / Expand Toggle Button */}
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          title={isCollapsed ? (isAr ? 'توسيع القائمة' : 'Expand Sidebar') : (isAr ? 'طي القائمة' : 'Collapse Sidebar')}
        >
          {isCollapsed ? (
            isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
          ) : (
            isAr ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-2.5 py-4 space-y-1.5 overflow-y-auto overflow-x-hidden">
        {navItems.map((item) => {
          const isActive = currentRoute === item.route;
          const Icon = item.icon;

          return (
            <button
              key={item.route}
              onClick={() => onNavigate(item.route)}
              className={`w-full flex items-center rounded-xl py-2.5 px-3 text-xs font-bold transition-all cursor-pointer ${
                isCollapsed ? 'justify-center' : 'justify-between'
              } ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
              title={isAr ? item.titleAr : item.titleEn}
            >
              <div className="flex items-center gap-3 truncate">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {!isCollapsed && <span className="truncate">{isAr ? item.titleAr : item.titleEn}</span>}
              </div>

              {!isCollapsed && item.badge !== undefined && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full shrink-0 ${
                    isActive ? 'bg-white/20 text-white' : item.badgeColor || 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Sync Footer */}
      <div className="p-3 border-t border-slate-800 text-slate-400 text-[11px] shrink-0">
        {!isCollapsed ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  state.isSyncing ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'
                }`}
              />
              <span className="text-[10px] font-mono text-slate-400 truncate">
                {state.isSyncing ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? 'سحابي متصل' : 'Cloud Synced')}
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">v3.8 Multi</span>
          </div>
        ) : (
          <div className="flex justify-center">
            <span
              className={`w-2 h-2 rounded-full ${
                state.isSyncing ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'
              }`}
            />
          </div>
        )}
      </div>
    </aside>
  );
};
