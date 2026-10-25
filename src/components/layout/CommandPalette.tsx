import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  X,
  LayoutDashboard,
  Receipt,
  Target,
  Users,
  Award,
  TrendingUp,
  Package,
  FileText,
  Settings,
  Upload,
  Download,
  Share2,
  RefreshCw,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { AppRoute } from './useHashRouter';
import { useDataStore } from '../../store/DataStore';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (route: AppRoute) => void;
  onOpenUpload: () => void;
  onOpenExport: () => void;
  onOpenMonthlyReport: () => void;
  onOpenNotificationCenter?: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onOpenUpload,
  onOpenExport,
  onOpenMonthlyReport,
}) => {
  const { state } = useDataStore();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const isAr = state.settings.language === 'ar';

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open handled by parent or caller
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const pages: Array<{ route: AppRoute; titleAr: string; titleEn: string; icon: React.ReactNode }> = [
    { route: '/', titleAr: 'الرئيسية (لوحة التحكم التنفيذية)', titleEn: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4 text-emerald-600" /> },
    { route: '/sales', titleAr: 'المبيعات والسجلات والإكسيل', titleEn: 'Sales & Records', icon: <Receipt className="w-4 h-4 text-blue-600" /> },
    { route: '/targets', titleAr: 'الأهداف وتوزيع التارجت', titleEn: 'Targets & Goals', icon: <Target className="w-4 h-4 text-purple-600" /> },
    { route: '/staff', titleAr: 'الموظفين ولوحة الشرف والشيفتات', titleEn: 'Staff & Leaderboard', icon: <Users className="w-4 h-4 text-amber-600" /> },
    { route: '/incentives', titleAr: 'الحوافز والمكافآت والشرائح', titleEn: 'Incentives Center', icon: <Award className="w-4 h-4 text-emerald-600" /> },
    { route: '/analytics', titleAr: 'التحليلات والتوقعات والنمو', titleEn: 'Analytics & Forecasts', icon: <TrendingUp className="w-4 h-4 text-indigo-600" /> },
    { route: '/inventory', titleAr: 'المخزون الذكي وسرعة الدوران', titleEn: 'Smart Inventory', icon: <Package className="w-4 h-4 text-teal-600" /> },
    { route: '/reports', titleAr: 'التقارير والتصدير والذكاء الاصطناعي', titleEn: 'Reports & Exports', icon: <FileText className="w-4 h-4 text-rose-600" /> },
    { route: '/settings', titleAr: 'الإعدادات وإدارة البيانات والنسخ الاحتياطي', titleEn: 'Settings & Data Backup', icon: <Settings className="w-4 h-4 text-slate-600" /> },
  ];

  const filteredPages = pages.filter(
    (p) =>
      p.titleAr.toLowerCase().includes(query.toLowerCase()) ||
      p.titleEn.toLowerCase().includes(query.toLowerCase())
  );

  const filteredEmployees = state.records
    .filter(
      (r) =>
        r.employee.toLowerCase().includes(query.toLowerCase()) ||
        (r.employeeId && r.employeeId.includes(query))
    )
    .slice(0, 4);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-start justify-center p-4 sm:pt-20 animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Search Input Bar */}
        <div className="p-3.5 border-b border-slate-200 flex items-center gap-3 bg-slate-50/50">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              isAr
                ? 'ابحث عن أي صفحة، موظف، أو إجراء سريع... (Esc للإغلاق)'
                : 'Search any page, employee, or quick action... (Esc to close)'
            }
            className="w-full bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="p-3 overflow-y-auto max-h-[60vh] space-y-3 text-xs">
          {/* Quick Actions Section */}
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1.5">
              {isAr ? 'إجراءات سريعة' : 'Quick Actions'}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              <button
                onClick={() => {
                  onClose();
                  onOpenUpload();
                }}
                className="p-2 rounded-xl border border-slate-100 hover:bg-emerald-50 hover:border-emerald-200 flex items-center gap-2 text-slate-700 hover:text-emerald-800 transition-colors text-right cursor-pointer"
              >
                <Upload className="w-4 h-4 text-emerald-600" />
                <span className="font-bold">{isAr ? 'رفع ملف إكسيل' : 'Upload Excel'}</span>
              </button>

              <button
                onClick={() => {
                  onClose();
                  onOpenExport();
                }}
                className="p-2 rounded-xl border border-slate-100 hover:bg-blue-50 hover:border-blue-200 flex items-center gap-2 text-slate-700 hover:text-blue-800 transition-colors text-right cursor-pointer"
              >
                <Download className="w-4 h-4 text-blue-600" />
                <span className="font-bold">{isAr ? 'تصدير شيت المبيعات' : 'Export Excel'}</span>
              </button>

              <button
                onClick={() => {
                  onClose();
                  onOpenMonthlyReport();
                }}
                className="p-2 rounded-xl border border-slate-100 hover:bg-purple-50 hover:border-purple-200 flex items-center gap-2 text-slate-700 hover:text-purple-800 transition-colors text-right cursor-pointer"
              >
                <FileText className="w-4 h-4 text-purple-600" />
                <span className="font-bold">{isAr ? 'التقرير الشهري والـ PDF' : 'Monthly PDF Report'}</span>
              </button>

              <button
                onClick={() => {
                  onClose();
                  onNavigate('/targets');
                }}
                className="p-2 rounded-xl border border-slate-100 hover:bg-amber-50 hover:border-amber-200 flex items-center gap-2 text-slate-700 hover:text-amber-800 transition-colors text-right cursor-pointer"
              >
                <Target className="w-4 h-4 text-amber-600" />
                <span className="font-bold">{isAr ? 'إدارة وتوزيع التارجت' : 'Manage Targets'}</span>
              </button>
            </div>
          </div>

          {/* Pages Navigation */}
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1.5">
              {isAr ? 'الصفحات والوحدات' : 'Pages & Modules'}
            </div>
            <div className="space-y-1">
              {filteredPages.map((page) => (
                <button
                  key={page.route}
                  onClick={() => {
                    onClose();
                    onNavigate(page.route);
                  }}
                  className="w-full p-2.5 rounded-xl hover:bg-slate-100 flex items-center justify-between text-slate-800 transition-colors cursor-pointer text-right"
                >
                  <div className="flex items-center gap-2.5">
                    {page.icon}
                    <span className="font-bold text-xs">{isAr ? page.titleAr : page.titleEn}</span>
                  </div>
                  <ArrowRight className={`w-3.5 h-3.5 text-slate-400 ${isAr ? 'rotate-180' : ''}`} />
                </button>
              ))}
            </div>
          </div>

          {/* Employees List if query matches */}
          {query.trim().length > 0 && filteredEmployees.length > 0 && (
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1.5">
                {isAr ? 'مستشارو المبيعات' : 'Sales Advisors'}
              </div>
              <div className="space-y-1">
                {filteredEmployees.map((emp) => (
                  <button
                    key={emp.id}
                    onClick={() => {
                      onClose();
                      onNavigate('/staff');
                    }}
                    className="w-full p-2 rounded-xl hover:bg-slate-100 flex items-center justify-between text-slate-800 transition-colors cursor-pointer text-right"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px]">
                        {emp.employee.charAt(0)}
                      </div>
                      <div>
                        <span className="font-bold block">{emp.employee}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {emp.employeeId ? `#${emp.employeeId}` : ''} · {Math.round(emp.actual).toLocaleString()} EGP
                        </span>
                      </div>
                    </div>
                    <span className="text-emerald-700 font-bold font-mono text-[11px]">
                      {emp.achievementRate.toFixed(1)}%
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono text-[10px]">Ctrl+K</kbd>
            <span>{isAr ? 'لفتح البحث في أي وقت' : 'to open anytime'}</span>
          </div>
          <span>{isAr ? 'راية كونكورد بلازا' : 'Raya Concorde Plaza'}</span>
        </div>
      </div>
    </div>
  );
};
