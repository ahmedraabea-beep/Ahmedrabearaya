import React, { useState } from 'react';
import {
  Receipt,
  FileSpreadsheet,
  ShieldCheck,
  Upload,
  Download,
  Plus,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useDataStore } from '../store/DataStore';
import {
  selectFilteredRecords,
  selectRecordsInActivePeriod,
  selectUniqueBranches,
  selectUniquePeriods,
  selectFinancialTotals,
  selectActiveTargetStructure,
} from '../store/selectors';
import { FiltersBar } from '../components/FiltersBar';
import { PerformanceTable } from '../components/PerformanceTable';
import { FastExcelProcessingHub } from '../components/FastExcelProcessingHub';
import { RayaThreeSheetsReconciliationCard } from '../components/RayaThreeSheetsReconciliationCard';
import { ExcelValidationReportModal } from '../components/ExcelValidationReportModal';
import { RecordModal } from '../components/RecordModal';
import { UploadModal } from '../components/UploadModal';
import { exportRecordsToExcel, ParseIncentiveResult } from '../utils/excelParser';
import { SalesRecord, AuditReport } from '../types/sales';
import { InventoryItem } from '../types/inventory';

interface SalesPageProps {
  onViewIncentive?: (record: SalesRecord) => void;
  onOpenTargetAllocation?: () => void;
  onOpenUnifiedPrompt?: () => void;
  onOpenInventoryOptimizer?: () => void;
  onOpenMonthlyReport?: () => void;
  onOpenAddRecord?: () => void;
  onEditRecord?: (record: SalesRecord) => void;
}

export const SalesPage: React.FC<SalesPageProps> = ({
  onViewIncentive,
  onOpenTargetAllocation,
  onOpenUnifiedPrompt,
  onOpenInventoryOptimizer,
  onOpenMonthlyReport,
  onOpenAddRecord,
  onEditRecord,
}) => {
  const { state, dispatch } = useDataStore();
  const [activeTab, setActiveTab] = useState<'records' | 'uploadHub' | 'audit'>('records');

  // Modal states
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [recordToEdit, setRecordToEdit] = useState<SalesRecord | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isValidationModalOpen, setIsValidationModalOpen] = useState(false);

  const isAr = state.settings.language === 'ar';
  const currency = state.settings.currency;

  const filteredRecords = selectFilteredRecords(state);
  const activePeriodRecords = selectRecordsInActivePeriod(state);
  const branches = selectUniqueBranches(state);
  const periods = selectUniquePeriods(state);
  const totals = selectFinancialTotals(state);
  const targetStructure = selectActiveTargetStructure(state);

  // Handlers
  const handleEditRecord = (record: SalesRecord) => {
    if (onEditRecord) {
      onEditRecord(record);
    } else {
      setRecordToEdit(record);
      setIsRecordModalOpen(true);
    }
  };

  const handleOpenAdd = () => {
    if (onOpenAddRecord) {
      onOpenAddRecord();
    } else {
      setRecordToEdit(null);
      setIsRecordModalOpen(true);
    }
  };

  const handleDeleteRecord = (id: string) => {
    const confirmMsg = isAr ? 'هل أنت متأكد من حذف هذا السجل؟' : 'Are you sure you want to delete this record?';
    if (window.confirm(confirmMsg)) {
      dispatch({ type: 'DELETE_RECORD', payload: id });
    }
  };

  const handleSaveRecord = (recordData: {
    id?: string;
    employeeId?: string;
    branch: string;
    employee: string;
    target: number;
    actual: number;
    period?: string;
  }) => {
    if (recordData.id) {
      const existing = state.records.find((r) => r.id === recordData.id);
      const updated: SalesRecord = {
        ...(existing || ({} as SalesRecord)),
        id: recordData.id,
        employeeId: recordData.employeeId,
        branch: recordData.branch,
        employee: recordData.employee,
        target: recordData.target,
        actual: recordData.actual,
        period: recordData.period || state.selectedPeriod,
        achievementRate: recordData.target > 0 ? (recordData.actual / recordData.target) * 100 : 0,
        difference: recordData.actual - recordData.target,
        isAchieved: recordData.actual >= recordData.target,
      };
      dispatch({ type: 'UPDATE_RECORD', payload: updated });
    } else {
      const newRec: SalesRecord = {
        id: `manual-${Date.now().toString(36)}`,
        employeeId: recordData.employeeId,
        branch: recordData.branch,
        employee: recordData.employee,
        target: recordData.target,
        actual: recordData.actual,
        period: recordData.period || state.selectedPeriod,
        achievementRate: recordData.target > 0 ? (recordData.actual / recordData.target) * 100 : 0,
        difference: recordData.actual - recordData.target,
        isAchieved: recordData.actual >= recordData.target,
      };
      dispatch({ type: 'ADD_RECORD', payload: newRec });
    }
    setIsRecordModalOpen(false);
  };

  const handleImportSalesRecords = (records: SalesRecord[], mode: 'replace' | 'append') => {
    dispatch({ type: 'IMPORT_RECORDS', payload: { records, mode } });
  };

  const handleImportIncentiveSheet = (result: ParseIncentiveResult) => {
    if (result.productRules && result.productRules.length > 0) {
      dispatch({ type: 'SET_INCENTIVE_RULES', payload: result.productRules });
    }
  };

  const handleImportStockItems = (items: InventoryItem[]) => {
    dispatch({ type: 'SET_INVENTORY_ITEMS', payload: items });
  };

  const handleUpdateRecordsWithAudit = (auditedRecords: SalesRecord[], report: AuditReport) => {
    dispatch({ type: 'SET_RECORDS', payload: auditedRecords });
    dispatch({ type: 'SET_AUDIT_REPORT', payload: report });
  };

  const handleExportExcel = () => {
    const fileName = isAr
      ? `مبيعات_راية_${state.selectedPeriod}.xlsx`
      : `Raya_Sales_${state.selectedPeriod}.xlsx`;
    exportRecordsToExcel(filteredRecords, fileName, state.settings.language);
  };

  const handleResetFilters = () => {
    dispatch({ type: 'SET_BRANCH', payload: '' });
    dispatch({ type: 'SET_SEARCH_QUERY', payload: '' });
    dispatch({ type: 'SET_FILTER_STATUS', payload: 'all' });
  };

  return (
    <div className="space-y-4" dir={isAr ? 'rtl' : 'ltr'}>
      {/* ── Page Header & Sub-Tabs ── */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Segmented Sub-Tab Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl border border-slate-200/80">
          <button
            onClick={() => setActiveTab('records')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'records'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Receipt className="w-4 h-4 text-emerald-600" />
            <span>{isAr ? 'سجلات المبيعات والمعاملات' : 'Sales Records'}</span>
            <span className="text-[10px] bg-slate-200 px-1.5 py-0.2 rounded-full font-mono">
              {filteredRecords.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('uploadHub')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'uploadHub'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-blue-600" />
            <span>{isAr ? 'مركز معالجة ورفع الإكسيل' : 'Excel Processing Hub'}</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'audit'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            <span>{isAr ? 'مطابقة الجودة والـ 21 عمود' : 'Quality & 21-Col Audit'}</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full font-bold">
              100%
            </span>
          </button>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenAdd}
            className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>{isAr ? 'إضافة سجل' : 'Add Record'}</span>
          </button>

          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200"
          >
            <Upload className="w-4 h-4 text-emerald-600" />
            <span>{isAr ? 'رفع ملف' : 'Upload'}</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200"
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>{isAr ? 'تصدير' : 'Export'}</span>
          </button>
        </div>
      </div>

      {/* ── TAB 1: السجلات والمعاملات ── */}
      {activeTab === 'records' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Filters Bar */}
          <FiltersBar
            branches={branches}
            selectedBranch={state.selectedBranch}
            onSelectBranch={(b) => dispatch({ type: 'SET_BRANCH', payload: b })}
            periods={periods}
            selectedPeriod={state.selectedPeriod}
            onSelectPeriod={(p) => dispatch({ type: 'SET_PERIOD', payload: p })}
            searchQuery={state.searchQuery}
            onSearchChange={(q) => dispatch({ type: 'SET_SEARCH_QUERY', payload: q })}
            filterStatus={state.filterStatus}
            onFilterStatusChange={(s) => dispatch({ type: 'SET_FILTER_STATUS', payload: s })}
            onResetFilters={handleResetFilters}
            onExportExcel={handleExportExcel}
            filteredCount={filteredRecords.length}
            totalCount={activePeriodRecords.length}
            language={state.settings.language}
          />

          {/* Performance Table */}
          <PerformanceTable
            records={filteredRecords}
            currency={currency}
            onEditRecord={handleEditRecord}
            onDeleteRecord={handleDeleteRecord}
            onOpenAddRecord={handleOpenAdd}
            onResetFilters={handleResetFilters}
            onViewIncentive={onViewIncentive}
            language={state.settings.language}
          />
        </div>
      )}

      {/* ── TAB 2: مركز معالجة ورفع الإكسيل السريع ── */}
      {activeTab === 'uploadHub' && (
        <div className="animate-in fade-in duration-150">
          <FastExcelProcessingHub
            language={state.settings.language}
            currency={currency}
            records={state.records}
            incentiveRules={state.incentiveRules}
            targetStructure={targetStructure}
            vatDisplayMode={state.settings.vatDisplayMode}
            onToggleVatMode={(mode) =>
              dispatch({ type: 'UPDATE_SETTINGS', payload: { vatDisplayMode: mode } })
            }
            onImportSalesRecords={handleImportSalesRecords}
            onImportIncentiveSheet={handleImportIncentiveSheet}
            onImportStockItems={handleImportStockItems}
            onOpenInventoryOptimizer={onOpenInventoryOptimizer}
            onUpdateRecordsWithAudit={handleUpdateRecordsWithAudit}
            auditReport={state.auditReport}
            onOpenUploadModal={() => setIsUploadModalOpen(true)}
            onOpenIncentivesModal={() => {}}
            onOpenMonthlyReport={onOpenMonthlyReport || (() => {})}
            onResetDemoData={() => {}}
          />
        </div>
      )}

      {/* ── TAB 3: مراجعة الجودة والتسوية والـ 21 عمود ── */}
      {activeTab === 'audit' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Detailed Reconciliation Card */}
          <RayaThreeSheetsReconciliationCard
            language={state.settings.language}
            currency={currency}
            onApplyRecordsToDashboard={(recs) => {
              dispatch({ type: 'SET_RECORDS', payload: recs });
            }}
          />

          {/* Button to view full SheetRowValidationReport if available */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                {isAr ? 'تقرير فحص وتدقيق بنود الفواتير التفصيلي' : 'Granular POS Line-Item Audit'}
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                {isAr
                  ? 'عرض مقارنة خلايا الإكسيل الأصلية مع القيم المعتمدة وتدقيق الأصفار والـ 21 عمود'
                  : 'Compare original Excel cells with validated database records'}
              </p>
            </div>

            <button
              onClick={() => setIsValidationModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
            >
              {isAr ? 'عرض تقرير المطابقة الشامل' : 'Open Audit Report'}
            </button>
          </div>
        </div>
      )}

      {/* ── Page Modals ── */}
      <RecordModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        onSaveRecord={handleSaveRecord}
        recordToEdit={recordToEdit}
        existingBranches={branches}
        currency={currency}
        language={state.settings.language}
      />

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onImportRecords={(recs, mode) => handleImportSalesRecords(recs, mode)}
        onImportStockItems={handleImportStockItems}
        language={state.settings.language}
        onOpenTargetAllocation={onOpenTargetAllocation}
        onOpenUnifiedAiPrompt={onOpenUnifiedPrompt}
      />

      {state.validationReport && (
        <ExcelValidationReportModal
          isOpen={isValidationModalOpen}
          onClose={() => setIsValidationModalOpen(false)}
          report={state.validationReport}
          language={state.settings.language}
        />
      )}
    </div>
  );
};
