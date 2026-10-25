import React, { useState, ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { MobileBottomNav } from './MobileBottomNav';
import { CommandPalette } from './CommandPalette';
import { AppRoute, useHashRouter } from './useHashRouter';
import { useDataStore } from '../../store/DataStore';
import {
  Upload,
  Download,
  FileText,
  Target,
  Plus,
  CheckCircle,
  PlusCircle,
  Sparkles,
} from 'lucide-react';

export interface MainAppLayoutProps {
  currentRoute?: AppRoute;
  onNavigate?: (route: AppRoute) => void;
  onOpenUpload: () => void;
  onOpenExport: () => void;
  onOpenMonthlyReport: () => void;
  onOpenNotificationCenter: () => void;
  onOpenMobileModal: () => void;
  onOpenAddRecord?: () => void;
  onOpenUnifiedPrompt?: () => void;
  activeAlertsCount?: number;
  children: ReactNode;
  toastMessage?: string | null;
}

export const MainAppLayout: React.FC<MainAppLayoutProps> = ({
  currentRoute: propCurrentRoute,
  onNavigate: propOnNavigate,
  onOpenUpload,
  onOpenExport,
  onOpenMonthlyReport,
  onOpenNotificationCenter,
  onOpenMobileModal,
  onOpenAddRecord,
  onOpenUnifiedPrompt,
  activeAlertsCount = 0,
  children,
  toastMessage,
}) => {
  const router = useHashRouter();
  const currentRoute = propCurrentRoute || router.currentRoute;
  const onNavigate = propOnNavigate || router.navigate;

  const { state } = useDataStore();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isFabOpen, setIsFabOpen] = useState(false);

  const isAr = state.settings.language === 'ar';

  return (
    <div
      className={`min-h-screen bg-slate-100 text-slate-800 flex ${
        isAr ? "font-['Cairo',sans-serif]" : "font-['Plus_Jakarta_Sans',sans-serif]"
      }`}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* 1. Desktop Sidebar */}
      <Sidebar
        currentRoute={currentRoute}
        onNavigate={onNavigate}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
      />

      {/* 2. Main Content Frame */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top App Bar */}
        <TopBar
          currentRoute={currentRoute}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onOpenNotificationCenter={onOpenNotificationCenter}
          onOpenMobileModal={onOpenMobileModal}
          activeAlertsCount={activeAlertsCount}
        />

        {/* Dynamic Route Content */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* 3. Mobile Fixed Bottom Navigation Bar */}
      <MobileBottomNav
        currentRoute={currentRoute}
        onNavigate={onNavigate}
        onOpenUpload={onOpenUpload}
        onOpenExport={onOpenExport}
      />

      {/* 4. Global Command Palette (Ctrl+K / ⌘K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={onNavigate}
        onOpenUpload={onOpenUpload}
        onOpenMonthlyReport={onOpenMonthlyReport}
        onOpenExport={onOpenExport}
        onOpenNotificationCenter={onOpenNotificationCenter}
      />

      {/* 5. Floating Quick Actions Speed-Dial (Desktop / Tablet) */}
      <div className="hidden md:flex fixed bottom-6 left-6 z-40 flex-col items-center gap-2">
        {isFabOpen && (
          <div className="flex flex-col items-center gap-2 mb-1 animate-in fade-in slide-in-from-bottom-2 duration-150">
            {onOpenAddRecord && (
              <button
                onClick={() => {
                  setIsFabOpen(false);
                  onOpenAddRecord();
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-lg hover:bg-slate-800 transition-all cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5 text-blue-400" />
                <span>{isAr ? 'إضافة سجل' : 'Add Record'}</span>
              </button>
            )}

            <button
              onClick={() => {
                setIsFabOpen(false);
                onOpenUpload();
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-lg hover:bg-slate-800 transition-all cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isAr ? 'رفع إكسيل' : 'Upload Excel'}</span>
            </button>

            <button
              onClick={() => {
                setIsFabOpen(false);
                onOpenMonthlyReport();
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-lg hover:bg-slate-800 transition-all cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-purple-400" />
              <span>{isAr ? 'تقرير PDF' : 'PDF Report'}</span>
            </button>

            <button
              onClick={() => {
                setIsFabOpen(false);
                onNavigate('/targets');
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-lg hover:bg-slate-800 transition-all cursor-pointer"
            >
              <Target className="w-3.5 h-3.5 text-amber-400" />
              <span>{isAr ? 'تعديل التارجت' : 'Targets'}</span>
            </button>

            {onOpenUnifiedPrompt && (
              <button
                onClick={() => {
                  setIsFabOpen(false);
                  onOpenUnifiedPrompt();
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-lg hover:bg-slate-800 transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>{isAr ? 'مساعد الـ AI' : 'AI Assistant'}</span>
              </button>
            )}
          </div>
        )}

        <button
          onClick={() => setIsFabOpen((prev) => !prev)}
          className={`w-12 h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl flex items-center justify-center transition-transform cursor-pointer ${
            isFabOpen ? 'rotate-45 bg-slate-800' : ''
          }`}
          title={isAr ? 'إجراءات سريعة' : 'Quick Actions'}
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>
      </div>

      {/* 6. Global Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 ${
            isAr ? 'left-6' : 'right-6'
          } z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg border border-slate-700 flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-bottom-3 duration-200`}
        >
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
