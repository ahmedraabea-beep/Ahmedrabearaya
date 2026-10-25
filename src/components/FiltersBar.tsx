import React from 'react';
import { Search, X, Download, Building2, RotateCcw, Calendar, Zap } from 'lucide-react';
import { FilterStatus, Language } from '../types/sales';
import { translations } from '../utils/i18n';

interface FiltersBarProps {
  branches: string[];
  selectedBranch: string;
  onSelectBranch: (branch: string) => void;
  periods?: string[];
  selectedPeriod?: string;
  onSelectPeriod?: (period: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  filterStatus: FilterStatus;
  onFilterStatusChange: (s: FilterStatus) => void;
  onResetFilters: () => void;
  onExportExcel: () => void;
  filteredCount: number;
  totalCount: number;
  language: Language;
}

export const FiltersBar: React.FC<FiltersBarProps> = ({
  branches,
  selectedBranch,
  onSelectBranch,
  periods = [],
  selectedPeriod = '',
  onSelectPeriod,
  searchQuery,
  onSearchChange,
  filterStatus,
  onFilterStatusChange,
  onResetFilters,
  onExportExcel,
  filteredCount,
  totalCount,
  language,
}) => {
  const t = translations[language];
  const hasActiveFilters = Boolean(selectedBranch || searchQuery || filterStatus !== 'all');

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left Side: Filter inputs */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
          {/* Search by Employee Name or Job ID */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t.searchPlaceholder}
              className={`w-full ${language === 'ar' ? 'pr-9 pl-8' : 'pl-9 pr-8'} py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors`}
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className={`absolute ${language === 'ar' ? 'left-2.5' : 'right-2.5'} top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1`}
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Period Dropdown */}
          {periods.length > 0 && onSelectPeriod && (
            <div className="relative sm:w-56">
              <Calendar className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500 pointer-events-none`} />
              <select
                value={selectedPeriod}
                onChange={(e) => onSelectPeriod(e.target.value)}
                className={`w-full ${language === 'ar' ? 'pr-9 pl-3' : 'pl-9 pr-3'} py-2 text-sm bg-blue-50/50 border border-blue-200 text-blue-950 font-medium rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none transition-colors`}
              >
                <option value="">{language === 'ar' ? 'جميع الفترات والشهور' : 'All Months & Periods'}</option>
                {periods.map((p) => {
                  const isOct = p.includes('أكتوبر') || p.includes('Oct') || p.includes('10');
                  return (
                    <option key={p} value={p}>
                      {p} {isOct ? (language === 'ar' ? '(شهر 10 - 31 يوم)' : '(Month 10 - 31d)') : ''}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {/* Branch Dropdown */}
          <div className="relative sm:w-60">
            <Building2 className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none`} />
            <select
              value={selectedBranch}
              onChange={(e) => onSelectBranch(e.target.value)}
              className={`w-full ${language === 'ar' ? 'pr-9 pl-3' : 'pl-9 pr-3'} py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 appearance-none transition-colors`}
            >
              <option value="">{t.allBranches} ({branches.length})</option>
              {branches.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right Side: Status Tabs + Actions */}
        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3">
          {/* Segmented Status Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-medium">
            <button
              onClick={() => onFilterStatusChange('all')}
              className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                filterStatus === 'all'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.statusAll}
            </button>
            <button
              onClick={() => onFilterStatusChange('achieved')}
              className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                filterStatus === 'achieved'
                  ? 'bg-white text-emerald-800 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              {t.statusAchieved}
            </button>
            <button
              onClick={() => onFilterStatusChange('unachieved')}
              className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                filterStatus === 'unachieved'
                  ? 'bg-white text-rose-800 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-rose-700'
              }`}
            >
              {t.statusUnachieved}
            </button>
            <button
              onClick={() => onFilterStatusChange('near')}
              className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                filterStatus === 'near'
                  ? 'bg-white text-amber-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-amber-800'
              }`}
              title={language === 'ar' ? 'عرض الموظفين الذين وصلوا إلى 90% فأكثر ولم يكسروا التارجت بعد' : 'Show consultants nearing target (90%+)'}
            >
              <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
              <span>{language === 'ar' ? 'اقتربوا (90%+)' : 'Near (90%+)'}</span>
            </button>
          </div>

          {/* Reset Filters if active */}
          {hasActiveFilters && (
            <button
              onClick={onResetFilters}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap"
              title={t.resetFilters}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t.resetFilters}</span>
            </button>
          )}

          {/* Export to Excel */}
          <button
            onClick={onExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap"
            title={t.exportExcel}
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t.exportExcel}</span>
          </button>
        </div>
      </div>

      {/* Result counter indicator */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div>
          <span>{t.showing} </span>
          <strong className="text-slate-800 font-mono tabular-nums">{filteredCount}</strong>
          <span> {t.outOf} </span>
          <strong className="text-slate-800 font-mono tabular-nums">{totalCount}</strong>
          <span> {t.recordsCount}</span>
          {selectedBranch && (
            <span className="text-emerald-700 font-medium mx-2">
              ({selectedBranch})
            </span>
          )}
        </div>
        {hasActiveFilters && (
          <span className="text-slate-400">{t.filtersActive}</span>
        )}
      </div>
    </div>
  );
};
