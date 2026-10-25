import React, { useState } from 'react';
import {
  LayoutDashboard,
  Receipt,
  Users,
  Award,
  MoreHorizontal,
  Target,
  TrendingUp,
  Package,
  FileText,
  Settings,
  X,
  Upload,
  Download,
  Share2,
} from 'lucide-react';
import { AppRoute } from './useHashRouter';
import { useDataStore } from '../../store/DataStore';

interface MobileBottomNavProps {
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  onOpenUpload: () => void;
  onOpenExport: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentRoute,
  onNavigate,
  onOpenUpload,
  onOpenExport,
}) => {
  const { state } = useDataStore();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const isAr = state.settings.language === 'ar';

  const primaryTabs: Array<{
    route: AppRoute;
    titleAr: string;
    titleEn: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { route: '/', titleAr: 'الرئيسية', titleEn: 'Home', icon: LayoutDashboard },
    { route: '/sales', titleAr: 'المبيعات', titleEn: 'Sales', icon: Receipt },
    { route: '/staff', titleAr: 'الموظفين', titleEn: 'Staff', icon: Users },
    { route: '/incentives', titleAr: 'الحوافز', titleEn: 'Incentives', icon: Award },
  ];

  const secondaryTabs: Array<{
    route: AppRoute;
    titleAr: string;
    titleEn: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { route: '/targets', titleAr: 'الأهداف والتارجت', titleEn: 'Targets', icon: Target },
    { route: '/analytics', titleAr: 'التحليلات والتوقعات', titleEn: 'Analytics', icon: TrendingUp },
    { route: '/inventory', titleAr: 'المخزون الذكي', titleEn: 'Inventory', icon: Package },
    { route: '/reports', titleAr: 'التقارير والتصدير', titleEn: 'Reports', icon: FileText },
    { route: '/settings', titleAr: 'الإعدادات والبيانات', titleEn: 'Settings', icon: Settings },
  ];

  const isCurrentInSecondary = secondaryTabs.some((t) => t.route === currentRoute);

  const handleSelectRoute = (route: AppRoute) => {
    onNavigate(route);
    setIsMoreOpen(false);
  };

  return (
    <>
      {/* 1. Mobile Bottom Tab Bar */}
      <nav
        aria-label={isAr ? 'شريط التنقل السفلي' : 'Mobile Bottom Navigation'}
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-xl"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        <div className="grid grid-cols-5 items-center h-16 px-1">
          {primaryTabs.map((tab) => {
            const isActive = currentRoute === tab.route;
            const Icon = tab.icon;

            return (
              <button
                key={tab.route}
                type="button"
                onClick={() => handleSelectRoute(tab.route)}
                className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors cursor-pointer ${
                  isActive
                    ? 'text-emerald-700 font-bold'
                    : 'text-slate-500 hover:text-slate-900 font-medium'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                <span className="text-[10px] mt-1">{isAr ? tab.titleAr : tab.titleEn}</span>
              </button>
            );
          })}

          {/* More Button */}
          <button
            type="button"
            onClick={() => setIsMoreOpen(true)}
            className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors cursor-pointer ${
              isCurrentInSecondary
                ? 'text-emerald-700 font-bold'
                : 'text-slate-500 hover:text-slate-900 font-medium'
            }`}
          >
            <MoreHorizontal className={`w-5 h-5 ${isCurrentInSecondary ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className="text-[10px] mt-1">{isAr ? 'المزيد' : 'More'}</span>
          </button>
        </div>
      </nav>

      {/* 2. More Drawer / Bottom Sheet */}
      {isMoreOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end justify-center animate-in fade-in duration-200"
          onClick={() => setIsMoreOpen(false)}
        >
          <div
            className="bg-white rounded-t-3xl border-t border-slate-200 shadow-2xl w-full max-w-lg p-5 space-y-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200"
            dir={isAr ? 'rtl' : 'ltr'}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Grab Handle */}
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto" />

            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900">
                {isAr ? 'أقسام المنظومة الإضافية' : 'All Sections'}
              </h3>
              <button
                type="button"
                onClick={() => setIsMoreOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Grid of Secondary Modules */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              {secondaryTabs.map((tab) => {
                const isActive = currentRoute === tab.route;
                const Icon = tab.icon;

                return (
                  <button
                    key={tab.route}
                    type="button"
                    onClick={() => handleSelectRoute(tab.route)}
                    className={`p-3 rounded-2xl border text-right flex items-center gap-2.5 transition-colors cursor-pointer min-h-[48px] ${
                      isActive
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                        : 'bg-slate-50 border-slate-200/80 text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-500'}`} />
                    <span className="truncate">{isAr ? tab.titleAr : tab.titleEn}</span>
                  </button>
                );
              })}
            </div>

            {/* Quick Actions in Drawer */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <div className="text-[11px] font-bold text-slate-400">
                {isAr ? 'إجراءات سريعة' : 'Quick Actions'}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsMoreOpen(false);
                    onOpenUpload();
                  }}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer min-h-[44px]"
                >
                  <Upload className="w-4 h-4" />
                  <span>{isAr ? 'رفع إكسيل' : 'Upload'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsMoreOpen(false);
                    onOpenExport();
                  }}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer min-h-[44px]"
                >
                  <Download className="w-4 h-4" />
                  <span>{isAr ? 'تصدير' : 'Export'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
