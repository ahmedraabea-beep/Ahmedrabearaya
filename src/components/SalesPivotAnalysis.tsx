import React, { useState, useMemo, useEffect } from 'react';
import {
  Table,
  BarChart3,
  SlidersHorizontal,
  Download,
  Filter,
  Search,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  Eye,
  Layers,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  Tag,
  Calendar,
  User,
  Building,
  Bookmark,
  Trash2,
  Plus,
} from 'lucide-react';
import { SalesRecord, Currency, Language } from '../types/sales';
import { formatCurrencyNumber, formatPercent } from '../utils/calculations';
import { exportRecordsToExcel } from '../utils/excelParser';
import { normalizeBrandName } from '../utils/brandNormalizer';

interface SalesPivotAnalysisProps {
  records: SalesRecord[];
  currency: Currency;
  language: Language;
  initialCategory?: string;
  initialBrand?: string;
}

export type RowColDimension = 'category' | 'brand' | 'model' | 'employee' | 'period' | 'branch' | 'date';
export type ValueMetric = 'qty' | 'amountAfterVat' | 'amountBeforeVat' | 'count' | 'average';

export interface SavedPivotView {
  id: string;
  name: string;
  rowDim: RowColDimension;
  colDim: RowColDimension | 'none';
  valueMetric: ValueMetric;
  filterCategory: string;
  filterBrand: string;
  filterEmployee: string;
}

const SAVED_VIEWS_STORAGE_KEY = 'raya_concorde_saved_pivot_views_v1';

export const SalesPivotAnalysis: React.FC<SalesPivotAnalysisProps> = ({
  records,
  currency,
  language,
  initialCategory,
  initialBrand,
}) => {
  const isAr = language === 'ar';

  // Read URL query params if present
  const urlParams = useMemo(() => {
    if (typeof window === 'undefined') return {};
    const hash = window.location.hash;
    const qIndex = hash.indexOf('?');
    if (qIndex === -1) return {};
    const params = new URLSearchParams(hash.slice(qIndex + 1));
    return {
      cat: params.get('cat') || undefined,
      brand: params.get('brand') || undefined,
    };
  }, []);

  // Pivot configuration state
  const [rowDim, setRowDim] = useState<RowColDimension>('category');
  const [colDim, setColDim] = useState<RowColDimension | 'none'>('brand');
  const [valueMetric, setValueMetric] = useState<ValueMetric>('amountAfterVat');
  const [filterCategory, setFilterCategory] = useState<string>(initialCategory || urlParams.cat || 'all');
  const [filterBrand, setFilterBrand] = useState<string>(initialBrand || urlParams.brand || 'all');
  const [filterEmployee, setFilterEmployee] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table');
  const [selectedCellDrilldown, setSelectedCellDrilldown] = useState<{ row: string; col?: string; rows: SalesRecord[] } | null>(null);

  // Saved Views State
  const [savedViews, setSavedViews] = useState<SavedPivotView[]>(() => {
    try {
      const stored = localStorage.getItem(SAVED_VIEWS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [newViewName, setNewViewName] = useState('');

  // Quick preset shortcuts
  const handlePresetSelect = (preset: 'brand_category' | 'employee_category' | 'date_category' | 'employee_brand') => {
    switch (preset) {
      case 'brand_category':
        setRowDim('category');
        setColDim('brand');
        break;
      case 'employee_category':
        setRowDim('employee');
        setColDim('category');
        break;
      case 'date_category':
        setRowDim('date');
        setColDim('category');
        break;
      case 'employee_brand':
        setRowDim('employee');
        setColDim('brand');
        break;
    }
  };

  // Save current view
  const handleSaveView = () => {
    if (!newViewName.trim()) return;
    const newView: SavedPivotView = {
      id: Date.now().toString(),
      name: newViewName.trim(),
      rowDim,
      colDim,
      valueMetric,
      filterCategory,
      filterBrand,
      filterEmployee,
    };
    const updated = [...savedViews, newView];
    setSavedViews(updated);
    try {
      localStorage.setItem(SAVED_VIEWS_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
    setNewViewName('');
    setShowSaveModal(false);
  };

  const handleApplySavedView = (view: SavedPivotView) => {
    setRowDim(view.rowDim);
    setColDim(view.colDim);
    setValueMetric(view.valueMetric);
    setFilterCategory(view.filterCategory);
    setFilterBrand(view.filterBrand);
    setFilterEmployee(view.filterEmployee);
  };

  const handleDeleteSavedView = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedViews.filter((v) => v.id !== id);
    setSavedViews(updated);
    try {
      localStorage.setItem(SAVED_VIEWS_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  // Flattened transaction rows for pivot computation with brand normalization
  const transactionRows = useMemo(() => {
    const list: Array<{
      recordId: string;
      employee: string;
      branch: string;
      period: string;
      date: string;
      category: string;
      brand: string;
      model: string;
      qty: number;
      amountAfterVat: number;
      amountBeforeVat: number;
      originalRecord: SalesRecord;
    }> = [];

    records.forEach((r) => {
      if (filterEmployee !== 'all' && r.employee !== filterEmployee) return;

      const items = (r as any).items || (r as any).transactionItems;
      const recDate = r.dateFormattedAr || r.date || 'أكتوبر 2026';

      if (items && Array.isArray(items) && items.length > 0) {
        items.forEach((it: any) => {
          const cat = it.category || (isAr ? 'موبايلات' : 'Mobiles');
          const brd = normalizeBrandName(it.brand || (isAr ? 'بدون ماركة' : 'No Brand'));

          if (filterCategory !== 'all' && cat !== filterCategory) return;
          if (filterBrand !== 'all' && brd !== filterBrand) return;

          const qty = it.quantity ?? 1;
          const amt = it.totalPrice ?? Math.round(r.actual / items.length);
          list.push({
            recordId: r.id,
            employee: r.employee,
            branch: r.branch,
            period: r.period || 'أكتوبر 2026',
            date: it.date || recDate,
            category: cat,
            brand: brd,
            model: it.model || it.name || (isAr ? 'صنف قياسي' : 'Standard Item'),
            qty,
            amountAfterVat: amt,
            amountBeforeVat: Math.round(amt / 1.14),
            originalRecord: r,
          });
        });
      } else {
        const cat = isAr ? 'موبايلات' : 'Mobiles';
        const brd = normalizeBrandName(isAr ? 'بدون ماركة' : 'No Brand');
        if (filterCategory !== 'all' && cat !== filterCategory) return;
        if (filterBrand !== 'all' && brd !== filterBrand) return;

        list.push({
          recordId: r.id,
          employee: r.employee,
          branch: r.branch,
          period: r.period || 'أكتوبر 2026',
          date: recDate,
          category: cat,
          brand: brd,
          model: isAr ? 'معاملة مبيعات' : 'Sales Transaction',
          qty: 1,
          amountAfterVat: r.actual,
          amountBeforeVat: r.actualBeforeVat || Math.round(r.actual / 1.14),
          originalRecord: r,
        });
      }
    });

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return list.filter(
        (x) =>
          x.employee.toLowerCase().includes(q) ||
          x.category.toLowerCase().includes(q) ||
          x.brand.toLowerCase().includes(q) ||
          x.model.toLowerCase().includes(q) ||
          x.date.toLowerCase().includes(q)
      );
    }

    return list;
  }, [records, filterCategory, filterBrand, filterEmployee, searchQuery, isAr]);

  // Extract unique filter options after normalization
  const categories = useMemo(() => {
    const set = new Set<string>();
    transactionRows.forEach((r) => set.add(r.category));
    return Array.from(set).sort();
  }, [transactionRows]);

  const brands = useMemo(() => {
    const set = new Set<string>();
    transactionRows.forEach((r) => set.add(r.brand));
    return Array.from(set).sort();
  }, [transactionRows]);

  const employees = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.employee) set.add(r.employee);
    });
    return Array.from(set).sort();
  }, [records]);

  // Extract dimension value from row object
  const getDimValue = (item: (typeof transactionRows)[0], dim: RowColDimension): string => {
    switch (dim) {
      case 'category':
        return item.category;
      case 'brand':
        return item.brand;
      case 'model':
        return item.model;
      case 'employee':
        return item.employee;
      case 'period':
        return item.period;
      case 'branch':
        return item.branch;
      case 'date':
        return item.date;
      default:
        return 'Other';
    }
  };

  // Compute Pivot Matrix
  const pivotMatrix = useMemo(() => {
    const rowKeysSet = new Set<string>();
    const colKeysSet = new Set<string>();
    const lookup: Record<string, Record<string, { qty: number; amountAfterVat: number; amountBeforeVat: number; count: number; records: SalesRecord[] }>> = {};

    transactionRows.forEach((tx) => {
      const rKey = getDimValue(tx, rowDim);
      const cKey = colDim === 'none' ? 'Total' : getDimValue(tx, colDim);

      rowKeysSet.add(rKey);
      colKeysSet.add(cKey);

      if (!lookup[rKey]) lookup[rKey] = {};
      if (!lookup[rKey][cKey]) {
        lookup[rKey][cKey] = { qty: 0, amountAfterVat: 0, amountBeforeVat: 0, count: 0, records: [] };
      }

      lookup[rKey][cKey].qty += tx.qty;
      lookup[rKey][cKey].amountAfterVat += tx.amountAfterVat;
      lookup[rKey][cKey].amountBeforeVat += tx.amountBeforeVat;
      lookup[rKey][cKey].count += 1;
      if (!lookup[rKey][cKey].records.includes(tx.originalRecord)) {
        lookup[rKey][cKey].records.push(tx.originalRecord);
      }
    });

    const rows = Array.from(rowKeysSet).sort();
    const cols = Array.from(colKeysSet).sort();

    return { rows, cols, lookup };
  }, [transactionRows, rowDim, colDim]);

  // Metric value formatting
  const formatMetricValue = (cell: { qty: number; amountAfterVat: number; amountBeforeVat: number; count: number }) => {
    if (!cell) return '0';
    switch (valueMetric) {
      case 'qty':
        return cell.qty.toLocaleString();
      case 'amountAfterVat':
        return formatCurrencyNumber(cell.amountAfterVat, currency, true, isAr ? 'ar' : 'en');
      case 'amountBeforeVat':
        return formatCurrencyNumber(cell.amountBeforeVat, currency, true, isAr ? 'ar' : 'en');
      case 'count':
        return `${cell.count} ${isAr ? 'عملية' : 'tx'}`;
      case 'average': {
        const avg = cell.qty > 0 ? Math.round(cell.amountAfterVat / cell.qty) : 0;
        return formatCurrencyNumber(avg, currency, true, isAr ? 'ar' : 'en');
      }
    }
  };

  // Grand totals
  const grandTotalValue = useMemo(() => {
    return transactionRows.reduce((sum, tx) => {
      switch (valueMetric) {
        case 'qty':
          return sum + tx.qty;
        case 'amountAfterVat':
          return sum + tx.amountAfterVat;
        case 'amountBeforeVat':
          return sum + tx.amountBeforeVat;
        case 'count':
          return sum + 1;
        case 'average':
          return sum + tx.amountAfterVat;
      }
    }, 0);
  }, [transactionRows, valueMetric]);

  return (
    <div className="space-y-4 select-none" dir={isAr ? 'rtl' : 'ltr'}>
      {/* ── Top Toolbar & Preset Chips ── */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                {isAr ? 'تحليل المبيعات (جدول محوري Pivot Table)' : 'Sales Pivot Analysis Table'}
              </h3>
              <p className="text-xs text-slate-500">
                {isAr ? 'استعراض وتحليل المعاملات والماركات الموحدة بدقة وسرعة' : 'Multi-dimensional pivot cube with brand normalization'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSaveModal(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 border border-slate-200"
              title={isAr ? 'حفظ طريقة العرض الحالية' : 'Save View'}
            >
              <Bookmark className="w-3.5 h-3.5 text-blue-600" />
              <span>{isAr ? 'حفظ العرض' : 'Save View'}</span>
            </button>

            <button
              onClick={() => setViewMode(viewMode === 'table' ? 'chart' : 'table')}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 border border-slate-200"
            >
              {viewMode === 'table' ? <BarChart3 className="w-3.5 h-3.5 text-blue-600" /> : <Table className="w-3.5 h-3.5 text-blue-600" />}
              <span>{viewMode === 'table' ? (isAr ? 'عرض الرسم' : 'Chart View') : (isAr ? 'عرض الجدول' : 'Table View')}</span>
            </button>

            <button
              onClick={() => exportRecordsToExcel(records, 'Raya_Sales_Pivot_Export', language)}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isAr ? 'تصدير إكسيل' : 'Export Excel'}</span>
            </button>
          </div>
        </div>

        {/* Saved Views Row */}
        {savedViews.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
            <span className="text-slate-500 font-bold text-[11px] flex items-center gap-1">
              <Bookmark className="w-3 h-3 text-blue-600" />
              <span>{isAr ? 'طرق العرض المحفوظة:' : 'Saved Views:'}</span>
            </span>
            {savedViews.map((sv) => (
              <div
                key={sv.id}
                onClick={() => handleApplySavedView(sv)}
                className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 hover:border-blue-400 text-slate-800 font-bold text-[11px] flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <span>{sv.name}</span>
                <button
                  type="button"
                  onClick={(e) => handleDeleteSavedView(sv.id, e)}
                  className="text-slate-400 hover:text-rose-600 p-0.5 rounded cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Quick Chips Presets */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-500 font-bold text-xs">{isAr ? 'فلاتر سريعة جاهزة:' : 'Quick Presets:'}</span>
          <button
            onClick={() => handlePresetSelect('brand_category')}
            className={`px-3 py-1 rounded-xl font-bold transition-colors cursor-pointer text-xs ${
              rowDim === 'category' && colDim === 'brand'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            {isAr ? 'ماركة × قسم' : 'Brand × Category'}
          </button>
          <button
            onClick={() => handlePresetSelect('employee_category')}
            className={`px-3 py-1 rounded-xl font-bold transition-colors cursor-pointer text-xs ${
              rowDim === 'employee' && colDim === 'category'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            {isAr ? 'موظف × قسم' : 'Employee × Category'}
          </button>
          <button
            onClick={() => handlePresetSelect('date_category')}
            className={`px-3 py-1 rounded-xl font-bold transition-colors cursor-pointer text-xs ${
              rowDim === 'date' && colDim === 'category'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            {isAr ? 'يوم × قسم' : 'Date × Category'}
          </button>
          <button
            onClick={() => handlePresetSelect('employee_brand')}
            className={`px-3 py-1 rounded-xl font-bold transition-colors cursor-pointer text-xs ${
              rowDim === 'employee' && colDim === 'brand'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            {isAr ? 'مستشار × ماركة' : 'Advisor × Brand'}
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-3 border-t border-slate-100 text-xs">
          {/* Row Dimension */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">{isAr ? 'محور الصفوف (Rows)' : 'Row Dimension'}</label>
            <select
              value={rowDim}
              onChange={(e) => setRowDim(e.target.value as RowColDimension)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-xs focus:ring-1 focus:ring-blue-500"
            >
              <option value="category">{isAr ? 'القسم / الفئة' : 'Category'}</option>
              <option value="brand">{isAr ? 'الماركة (موحدة)' : 'Brand (Normalized)'}</option>
              <option value="model">{isAr ? 'الموديل / المنتج' : 'Model'}</option>
              <option value="employee">{isAr ? 'المستشار / الموظف' : 'Employee'}</option>
              <option value="date">{isAr ? 'التاريخ اليومي' : 'Date'}</option>
              <option value="period">{isAr ? 'فترة المبيعات' : 'Period'}</option>
              <option value="branch">{isAr ? 'الفرع' : 'Branch'}</option>
            </select>
          </div>

          {/* Col Dimension */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">{isAr ? 'محور الأعمدة (Columns)' : 'Column Dimension'}</label>
            <select
              value={colDim}
              onChange={(e) => setColDim(e.target.value as RowColDimension | 'none')}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-xs focus:ring-1 focus:ring-blue-500"
            >
              <option value="none">{isAr ? 'بدون أعمدة (إجمالي فقط)' : 'None (Totals only)'}</option>
              <option value="brand">{isAr ? 'الماركة (موحدة)' : 'Brand'}</option>
              <option value="category">{isAr ? 'القسم / الفئة' : 'Category'}</option>
              <option value="employee">{isAr ? 'المستشار / الموظف' : 'Employee'}</option>
              <option value="date">{isAr ? 'التاريخ اليومي' : 'Date'}</option>
              <option value="model">{isAr ? 'الموديل' : 'Model'}</option>
            </select>
          </div>

          {/* Value Metric */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">{isAr ? 'مقياس القيمة (Metric)' : 'Value Metric'}</label>
            <select
              value={valueMetric}
              onChange={(e) => setValueMetric(e.target.value as ValueMetric)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-xs focus:ring-1 focus:ring-blue-500"
            >
              <option value="qty">{isAr ? 'صافي الكمية (قطع بعد المرتجع)' : 'Net Qty (Pieces)'}</option>
              <option value="amountAfterVat">{isAr ? 'القيمة شاملة الضريبة (ج.م)' : 'Gross Amount (EGP)'}</option>
              <option value="amountBeforeVat">{isAr ? 'القيمة قبل الضريبة (صافي)' : 'Net Amount (Pre-VAT)'}</option>
              <option value="count">{isAr ? 'عدد العمليات / الفواتير' : 'Transaction Count'}</option>
              <option value="average">{isAr ? 'متوسط سعر القطعة' : 'Avg Unit Price'}</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">{isAr ? 'تصفية الفئة' : 'Filter Category'}</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-xs focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">{isAr ? 'كافة الفئات' : 'All Categories'}</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Search box */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">{isAr ? 'بحث سريع' : 'Quick Search'}</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute right-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isAr ? 'بحث في الموديل أو الماركة...' : 'Search item...'}
                className="w-full pr-8 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-xs focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Table View ── */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="font-bold text-slate-800">
              {isAr ? 'النتائج المطابقة:' : 'Reconciled Matrix:'} {pivotMatrix.rows.length} {isAr ? 'صف' : 'rows'} × {pivotMatrix.cols.length} {isAr ? 'عمود' : 'cols'}
            </span>
            <span className="font-mono font-bold text-blue-700 text-sm">
              {isAr ? 'الإجمالي الكلي:' : 'Grand Total:'}{' '}
              {valueMetric === 'qty'
                ? `${grandTotalValue.toLocaleString()} ${isAr ? 'قطعة' : 'pcs'}`
                : formatCurrencyNumber(grandTotalValue, currency, true, isAr ? 'ar' : 'en')}
            </span>
          </div>

          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-xs text-right border-collapse">
              <thead className="sticky top-0 bg-slate-100 text-slate-700 font-bold border-b border-slate-200 z-10">
                <tr>
                  <th className="p-3 border-l border-slate-200 min-w-[180px] bg-slate-100">
                    {rowDim === 'category'
                      ? isAr ? 'القسم / الفئة' : 'Category'
                      : rowDim === 'brand'
                      ? isAr ? 'الماركة' : 'Brand'
                      : rowDim === 'employee'
                      ? isAr ? 'المستشار' : 'Employee'
                      : rowDim === 'date'
                      ? isAr ? 'التاريخ' : 'Date'
                      : isAr ? 'البند' : 'Item'}
                  </th>
                  {pivotMatrix.cols.map((col) => (
                    <th key={col} className="p-3 text-center border-l border-slate-200 min-w-[120px]">
                      {col}
                    </th>
                  ))}
                  <th className="p-3 text-center bg-slate-200/80 min-w-[120px] font-black text-slate-900">
                    {isAr ? 'إجمالي الصف' : 'Row Total'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {pivotMatrix.rows.map((row) => {
                  let rowQty = 0;
                  let rowAmount = 0;
                  let rowPreVat = 0;
                  let rowCount = 0;

                  return (
                    <tr key={row} className="hover:bg-blue-50/20 transition-colors">
                      <td className="p-3 font-sans font-bold text-slate-800 border-l border-slate-200 bg-slate-50/50">
                        {row}
                      </td>

                      {pivotMatrix.cols.map((col) => {
                        const cell = pivotMatrix.lookup[row]?.[col];
                        if (cell) {
                          rowQty += cell.qty;
                          rowAmount += cell.amountAfterVat;
                          rowPreVat += cell.amountBeforeVat;
                          rowCount += cell.count;
                        }

                        return (
                          <td
                            key={col}
                            onClick={() => cell && setSelectedCellDrilldown({ row, col, rows: cell.records })}
                            className={`p-3 text-center border-l border-slate-100 cursor-pointer ${
                              cell ? 'hover:bg-blue-100 text-slate-900 font-bold' : 'text-slate-300'
                            }`}
                          >
                            {cell ? formatMetricValue(cell) : '—'}
                          </td>
                        );
                      })}

                      <td className="p-3 text-center bg-slate-50 font-bold text-blue-700">
                        {formatMetricValue({
                          qty: rowQty,
                          amountAfterVat: rowAmount,
                          amountBeforeVat: rowPreVat,
                          count: rowCount,
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Chart View ── */}
      {viewMode === 'chart' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h4 className="text-sm font-bold text-slate-900">{isAr ? 'مقارنة القيم الرأسية' : 'Vertical Bar Comparison'}</h4>
          <div className="space-y-3">
            {pivotMatrix.rows.slice(0, 10).map((row) => {
              const rowTotal = pivotMatrix.cols.reduce((sum, col) => {
                const cell = pivotMatrix.lookup[row]?.[col];
                if (!cell) return sum;
                return sum + (valueMetric === 'qty' ? cell.qty : cell.amountAfterVat);
              }, 0);
              const pct = grandTotalValue > 0 ? (rowTotal / grandTotalValue) * 100 : 0;

              return (
                <div key={row} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-800">{row}</span>
                    <span className="text-blue-600 font-mono">
                      {valueMetric === 'qty' ? `${rowTotal.toLocaleString()} pcs` : formatCurrencyNumber(rowTotal, currency, true, isAr ? 'ar' : 'en')} ({pct.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.max(2, pct))}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Drilldown Modal ── */}
      {selectedCellDrilldown && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full border border-slate-200 shadow-2xl space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h4 className="font-bold text-sm text-slate-900">
                  {isAr ? 'تفاصيل السجلات المطابقة' : 'Drilldown Transaction Records'}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedCellDrilldown.row} {selectedCellDrilldown.col ? `× ${selectedCellDrilldown.col}` : ''}
                </p>
              </div>
              <button
                onClick={() => setSelectedCellDrilldown(null)}
                className="text-xs font-bold text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto">
              {selectedCellDrilldown.rows.map((r, i) => (
                <div key={i} className="p-3 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-800 block">{r.employee}</span>
                    <span className="text-[11px] text-slate-500">{r.branch} · {r.period}</span>
                  </div>
                  <span className="font-mono font-bold text-blue-600">
                    {formatCurrencyNumber(r.actual, currency, true, isAr ? 'ar' : 'en')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Save View Modal ── */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4 animate-in fade-in duration-150">
            <h4 className="font-bold text-sm text-slate-900">{isAr ? 'حفظ طريقة العرض الحالية' : 'Save Current View'}</h4>
            <input
              type="text"
              value={newViewName}
              onChange={(e) => setNewViewName(e.target.value)}
              placeholder={isAr ? 'مثال: مبيعات الهواتف حسب الماركة' : 'e.g. Phones by Brand'}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowSaveModal(false)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleSaveView}
                className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs cursor-pointer shadow-xs"
              >
                {isAr ? 'حفظ' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
