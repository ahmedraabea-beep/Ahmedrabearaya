import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  FileText,
  AlertCircle,
  CheckCircle2,
  Download,
  ArrowRight,
  HelpCircle,
  Target,
  Sparkles,
  Bot,
  Building2,
  FileCode,
  Zap,
  Calendar,
} from 'lucide-react';
import {
  parseExcelOrCsvFile,
  ColumnMapping,
  buildRecordsFromRows,
  downloadSampleExcelTemplate,
  downloadSampleSalesCsvTemplate,
  downloadSampleSalesPdfTemplate,
  downloadSampleSalesTxtTemplate,
  parsePdfSalesReportFile,
  ParsePdfResult,
  loadSavedSalesColumnMapping,
  saveSalesColumnMapping,
  clearSavedSalesColumnMapping,
  detectInventoryColumns,
  buildStockItemsFromRows,
  loadSavedInventoryColumnMapping,
  saveInventoryColumnMapping,
  clearSavedInventoryColumnMapping,
  SheetRowValidationReport,
} from '../utils/excelParser';
import { SalesRecord, Language } from '../types/sales';
import { InventoryColumnMapping, InventoryItem } from '../types/inventory';
import {
  downloadSampleStockOnlySheet,
  downloadSampleCombinedInventorySheet,
  saveConcordeInventoryItems,
} from '../utils/inventoryOptimizerService';
import { translations } from '../utils/i18n';
import { Package, Boxes, Layers, ShieldCheck, Eye } from 'lucide-react';
import { ExcelValidationReportModal } from './ExcelValidationReportModal';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportRecords: (newRecords: SalesRecord[], mode: 'replace' | 'append') => void;
  onImportStockItems?: (newItems: InventoryItem[], fileName: string) => void;
  language: Language;
  onOpenTargetAllocation?: () => void;
  onOpenUnifiedAiPrompt?: () => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onImportRecords,
  onImportStockItems,
  language,
  onOpenTargetAllocation,
  onOpenUnifiedAiPrompt,
}) => {
  const t = translations[language];
  const [activeSheetKind, setActiveSheetKind] = useState<'sales' | 'stock'>('sales');
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string>('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, unknown>[]>([]);
  const [stockItems, setStockItems] = useState<InventoryItem[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({
    branchColumn: '',
    employeeColumn: '',
    employeeIdColumn: '',
    targetColumn: '',
    actualColumn: '',
    actualBeforeVatColumn: '',
    actualAfterVatColumn: '',
    vatAmountColumn: '',
    periodColumn: '',
  });
  const [inventoryMapping, setInventoryMapping] = useState<InventoryColumnMapping>({
    skuColumn: '',
    nameColumn: '',
    categoryColumn: '',
    priceColumn: '',
    concordeStockColumn: '',
    mainWarehouseStockColumn: '',
    salesVelocityColumn: '',
    agingDaysColumn: '',
    notesColumn: '',
  });
  const [importMode, setImportMode] = useState<'replace' | 'append'>('replace');
  const [isMappingStep, setIsMappingStep] = useState(false);
  const [pdfResult, setPdfResult] = useState<ParsePdfResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [rememberMapping, setRememberMapping] = useState<boolean>(true);
  const [isSavedMappingApplied, setIsSavedMappingApplied] = useState<boolean>(false);
  const [mappingSavedFeedback, setMappingSavedFeedback] = useState<string>('');
  const [latestDateFound, setLatestDateFound] = useState<{ isoDate?: string; formattedAr?: string } | null>(null);
  const [validationReport, setValidationReport] = useState<SheetRowValidationReport | null>(null);
  const [showValidationModal, setShowValidationModal] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelected = async (file: File) => {
    setErrorMessage('');
    setIsProcessing(true);
    setFileName(file.name);
    setPdfResult(null);
    setLatestDateFound(null);

    const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';

    if (isPdf) {
      try {
        const result = await parsePdfSalesReportFile(file);
        if (!result.records || result.records.length === 0) {
          setErrorMessage(
            language === 'ar'
              ? 'لم يتم العثور على أي سجلات موظفين أو مبيعات داخل تقرير الـ PDF المرفق.'
              : 'No sales records found in the uploaded PDF file.'
          );
          setIsProcessing(false);
          return;
        }
        setPdfResult(result);
        setActiveSheetKind('sales');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'تعذر تحليل ملف الـ PDF';
        setErrorMessage(msg);
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    try {
      const result = await parseExcelOrCsvFile(file);

      if (result.error && !result.stockItems) {
        setErrorMessage(result.error);
        setIsProcessing(false);
        return;
      }

      setHeaders(result.headers);
      setRawRows(result.rawRows);
      setValidationReport(result.validationReport || null);

      if (result.latestDate || result.latestDateFormattedAr) {
        setLatestDateFound({
          isoDate: result.latestDate,
          formattedAr: result.latestDateFormattedAr,
        });
      }

      if (result.detectedType === 'stock' || (result.stockItems && result.stockItems.length > 0)) {
        setActiveSheetKind('stock');
        const invMap = result.inventoryMapping || detectInventoryColumns(result.headers).mapping;
        setInventoryMapping(invMap);
        const built = result.stockItems || buildStockItemsFromRows(result.rawRows, invMap);
        setStockItems(built);
        setIsSavedMappingApplied(Boolean(loadSavedInventoryColumnMapping()));
        setIsMappingStep(true);
      } else {
        setActiveSheetKind('sales');
        setMapping(result.detectedMapping);
        setIsSavedMappingApplied(Boolean(result.detectedMapping?.isFromSavedStorage));
        setIsMappingStep(true);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error reading file';
      setErrorMessage(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFileSelected(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleSaveMappingNow = () => {
    const hasEmp = Boolean(mapping.employeeColumn || mapping.employeeIdColumn);
    const hasSalesOrTarget = Boolean(
      mapping.targetColumn ||
      mapping.actualColumn ||
      mapping.actualAfterVatColumn ||
      mapping.actualBeforeVatColumn
    );
    if (!hasEmp || !hasSalesOrTarget) {
      setErrorMessage(
        language === 'ar'
          ? 'يرجى اختيار عمود الموظف (أو الكود) وعمود المبيعات أو التارجت لحفظ التعيين.'
          : 'Please select Employee (or ID) and Sales or Target column to save.'
      );
      return;
    }
    saveSalesColumnMapping(mapping);
    setMappingSavedFeedback(
      language === 'ar'
        ? 'تم حفظ إعدادات الأعمدة بنجاح في متصفحك! سيتم استخدامها تلقائياً للشيتات القادمة.'
        : 'Column mapping saved to your browser! It will be used for future sheets.'
    );
    setTimeout(() => setMappingSavedFeedback(''), 4000);
  };

  const handleClearSavedMapping = () => {
    clearSavedSalesColumnMapping();
    setIsSavedMappingApplied(false);
    setMappingSavedFeedback(
      language === 'ar'
        ? 'تم مسح التعيين المحفوظ. سيتم الاعتماد على الكشف الذكي التلقائي.'
        : 'Saved mapping cleared. Using smart automatic detection.'
    );
    setTimeout(() => setMappingSavedFeedback(''), 3500);
  };

  const handleSaveInventoryMappingNow = () => {
    if (!inventoryMapping.nameColumn && !inventoryMapping.skuColumn) {
      setErrorMessage(
        language === 'ar'
          ? 'يرجى اختيار عمود كود الصنف أو اسم الصنف على الأقل.'
          : 'Please select SKU or Item Name column.'
      );
      return;
    }
    saveInventoryColumnMapping(inventoryMapping);
    setMappingSavedFeedback(
      language === 'ar'
        ? 'تم حفظ إعدادات أعمدة المخزون بنجاح في متصفحك! سيتم استخدامها تلقائياً للشيتات القادمة.'
        : 'Stock column mapping saved to your browser! It will be used for future sheets.'
    );
    setTimeout(() => setMappingSavedFeedback(''), 4000);
  };

  const handleClearSavedInventoryMapping = () => {
    clearSavedInventoryColumnMapping();
    setIsSavedMappingApplied(false);
    setMappingSavedFeedback(
      language === 'ar'
        ? 'تم مسح تعيين المخزون المحفوظ. سيتم الاعتماد على الكشف الذكي التلقائي.'
        : 'Saved inventory mapping cleared. Using smart automatic detection.'
    );
    setTimeout(() => setMappingSavedFeedback(''), 3500);
  };

  const handleConfirmStockImport = () => {
    if (!inventoryMapping.nameColumn && !inventoryMapping.skuColumn) {
      setErrorMessage(
        language === 'ar'
          ? 'يرجى تحديد عمود كود الصنف أو اسم الصنف.'
          : 'Please select SKU or Item Name column.'
      );
      return;
    }
    if (!inventoryMapping.concordeStockColumn && !inventoryMapping.mainWarehouseStockColumn) {
      setErrorMessage(
        language === 'ar'
          ? 'يرجى تحديد عمود رصيد المخزون لفرع كونكورد أو المخزن الرئيسي.'
          : 'Please select at least one stock quantity column.'
      );
      return;
    }

    try {
      const builtItems = buildStockItemsFromRows(rawRows, inventoryMapping);
      if (builtItems.length === 0) {
        setErrorMessage(
          language === 'ar'
            ? 'لم يتم العثور على أي أصناف صالحة بالأعمدة المحددة.'
            : 'No valid inventory items found with mapped columns.'
        );
        return;
      }

      if (rememberMapping) {
        saveInventoryColumnMapping(inventoryMapping);
      }

      saveConcordeInventoryItems(builtItems);
      onImportStockItems?.(builtItems, fileName);
      handleReset();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'فشل استيراد المخزون';
      setErrorMessage(msg);
    }
  };

  const handleConfirmImport = () => {
    if (!mapping.employeeColumn && !mapping.employeeIdColumn) {
      setErrorMessage(
        language === 'ar'
          ? 'يرجى تحديد عمود اسم الموظف أو الكود الوظيفي على الأقل.'
          : 'Please select at least Employee Name or Employee ID column.'
      );
      return;
    }

    try {
      const builtRecords = buildRecordsFromRows(rawRows, mapping, latestDateFound?.formattedAr);
      if (builtRecords.length === 0) {
        setErrorMessage(language === 'ar' ? 'لم يتم العثور على سجلات صالحة للاستيراد بالأعمدة المحددة.' : 'No valid records found with the mapped columns.');
        return;
      }

      // Persist user's column choices to LocalStorage for future visits
      if (rememberMapping) {
        saveSalesColumnMapping(mapping);
      }

      onImportRecords(builtRecords, importMode);
      handleReset();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to parse records';
      setErrorMessage(msg);
    }
  };

  const handleConfirmPdfImport = () => {
    if (!pdfResult || !pdfResult.records || pdfResult.records.length === 0) return;
    onImportRecords(pdfResult.records, importMode);
    handleReset();
    onClose();
  };

  const handleReset = () => {
    setFileName('');
    setHeaders([]);
    setRawRows([]);
    setStockItems([]);
    setPdfResult(null);
    setLatestDateFound(null);
    setValidationReport(null);
    setMapping({
      branchColumn: '',
      employeeColumn: '',
      employeeIdColumn: '',
      targetColumn: '',
      actualColumn: '',
      actualBeforeVatColumn: '',
      actualAfterVatColumn: '',
      vatAmountColumn: '',
      periodColumn: '',
    });
    setInventoryMapping({
      skuColumn: '',
      nameColumn: '',
      categoryColumn: '',
      priceColumn: '',
      concordeStockColumn: '',
      mainWarehouseStockColumn: '',
      salesVelocityColumn: '',
      agingDaysColumn: '',
      notesColumn: '',
    });
    setIsMappingStep(false);
    setErrorMessage('');
    setIsProcessing(false);
    setIsSavedMappingApplied(false);
    setMappingSavedFeedback('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {t.uploadModalTitle}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {t.uploadModalDesc}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              handleReset();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">{language === 'ar' ? 'تنبيه:' : 'Notice:'}</p>
                <p className="mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          {pdfResult ? (
            /* PDF Sales Report AI Analysis & Preview Step */
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* AI Extraction Banner */}
              <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 text-white p-4 rounded-2xl border border-emerald-500/30 shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 flex items-center justify-center shrink-0">
                      <Sparkles className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-emerald-300 bg-emerald-900/80 border border-emerald-500/40 px-2 py-0.5 rounded-md">
                          {language === 'ar' ? 'نموذج الذكاء الاصطناعي لاستخراج المستندات' : 'AI Document Intelligence'}
                        </span>
                        <span className="text-[10px] text-slate-300 font-mono">
                          {fileName}
                        </span>
                      </div>
                      <h4 className="text-sm font-black text-white mt-1">
                        {language === 'ar'
                          ? 'تم استخراج وتحليل تقرير المبيعات PDF بنجاح لفرع راية كونكورد بلازا'
                          : 'PDF Sales Report Analyzed for Raya Concorde Plaza Branch'}
                      </h4>
                      <p className="text-xs text-emerald-200/90 mt-0.5">
                        {pdfResult.summaryMessage}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleReset}
                    className="text-xs text-slate-300 hover:text-white underline shrink-0 cursor-pointer"
                  >
                    {language === 'ar' ? 'تغيير الملف' : 'Change File'}
                  </button>
                </div>

                {/* Quick KPI stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-3 border-t border-emerald-800/60 text-xs">
                  <div className="bg-black/30 rounded-xl p-2.5 border border-emerald-500/20">
                    <span className="text-[10px] text-slate-400 block">{language === 'ar' ? 'عدد الموظفين' : 'Employees'}</span>
                    <span className="text-sm font-bold text-white font-mono">{pdfResult.records.length} {language === 'ar' ? 'مستشار' : 'advisors'}</span>
                  </div>
                  <div className="bg-black/30 rounded-xl p-2.5 border border-emerald-500/20">
                    <span className="text-[10px] text-slate-400 block">{language === 'ar' ? 'إجمالي التارجت' : 'Total Target'}</span>
                    <span className="text-sm font-bold text-amber-300 font-mono">
                      {pdfResult.records.reduce((s, r) => s + r.target, 0).toLocaleString()} <span className="text-[10px] font-normal">ج.م</span>
                    </span>
                  </div>
                  <div className="bg-black/30 rounded-xl p-2.5 border border-emerald-500/20">
                    <span className="text-[10px] text-slate-400 block">{language === 'ar' ? 'المبيعات شامل 14% ضريبة' : 'Gross Sales (with VAT)'}</span>
                    <span className="text-sm font-bold text-emerald-300 font-mono">
                      {pdfResult.records.reduce((s, r) => s + (r.actualAfterVat || r.actual), 0).toLocaleString()} <span className="text-[10px] font-normal">ج.م</span>
                    </span>
                  </div>
                  <div className="bg-black/30 rounded-xl p-2.5 border border-emerald-500/20">
                    <span className="text-[10px] text-slate-400 block">{language === 'ar' ? 'ضريبة 14% المحسوبة' : 'Calculated 14% VAT'}</span>
                    <span className="text-sm font-bold text-blue-300 font-mono">
                      {pdfResult.records.reduce((s, r) => s + (r.vatAmount || 0), 0).toLocaleString()} <span className="text-[10px] font-normal">ج.م</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Extracted Rows Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">
                    {language === 'ar' ? 'معاينة المستشارين المستخرجين من تقرير الـ PDF:' : 'Extracted Advisors Preview:'}
                  </span>
                  <span className="text-[11px] text-emerald-700 font-medium">
                    {language === 'ar' ? 'تم ضبط وحساب القيمة الصافية والضريبة تلقائياً' : 'VAT and Pre-VAT automatically audited'}
                  </span>
                </div>
                <div className="max-h-56 overflow-y-auto">
                  <table className="w-full text-xs text-right border-collapse">
                    <thead className="bg-slate-100 text-slate-600 font-semibold sticky top-0">
                      <tr>
                        <th className="p-2 border-b border-slate-200">#</th>
                        <th className="p-2 border-b border-slate-200">{language === 'ar' ? 'الكود' : 'Job ID'}</th>
                        <th className="p-2 border-b border-slate-200">{language === 'ar' ? 'اسم الموظف' : 'Employee'}</th>
                        <th className="p-2 border-b border-slate-200">{language === 'ar' ? 'التارجت' : 'Target'}</th>
                        <th className="p-2 border-b border-slate-200">{language === 'ar' ? 'المبيعات شامل الضريبة' : 'Gross Sales'}</th>
                        <th className="p-2 border-b border-slate-200">{language === 'ar' ? 'صافي قبل الضريبة' : 'Pre-VAT'}</th>
                        <th className="p-2 border-b border-slate-200">{language === 'ar' ? 'ضريبة 14%' : 'VAT 14%'}</th>
                        <th className="p-2 border-b border-slate-200">{language === 'ar' ? 'نسبة التحقيق' : 'Rate'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {pdfResult.records.map((r, i) => (
                        <tr key={r.id || i} className="hover:bg-slate-50 transition-colors">
                          <td className="p-2 text-slate-400 font-mono text-[10px]">{i + 1}</td>
                          <td className="p-2 font-mono text-slate-600">{r.employeeId || '-'}</td>
                          <td className="p-2 font-bold text-slate-900">{r.employee}</td>
                          <td className="p-2 font-mono text-slate-700">{r.target.toLocaleString()} ج.م</td>
                          <td className="p-2 font-mono font-bold text-emerald-700">{(r.actualAfterVat || r.actual).toLocaleString()} ج.م</td>
                          <td className="p-2 font-mono text-slate-600">{(r.actualBeforeVat || Math.round(r.actual / 1.14)).toLocaleString()} ج.م</td>
                          <td className="p-2 font-mono text-blue-600">{(r.vatAmount || 0).toLocaleString()} ج.م</td>
                          <td className="p-2 font-bold font-mono">
                            <span className={r.isAchieved ? 'text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded' : 'text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded'}>
                              {r.achievementRate.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Import Mode: Replace vs Append */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  {t.importModeLabel}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setImportMode('replace')}
                    className={`p-3 rounded-xl border ${language === 'ar' ? 'text-right' : 'text-left'} transition-colors cursor-pointer ${
                      importMode === 'replace'
                        ? 'border-emerald-500 bg-emerald-50/50 text-slate-900 font-bold ring-1 ring-emerald-500'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xs font-bold">{t.importReplace}</div>
                    <div className="text-[11px] text-slate-500 font-normal mt-0.5">
                      {language === 'ar' ? 'استبدال بيانات المبيعات الحالية بالبيانات المستخرجة من الـ PDF' : 'Replace current sales data with PDF records'}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setImportMode('append')}
                    className={`p-3 rounded-xl border ${language === 'ar' ? 'text-right' : 'text-left'} transition-colors cursor-pointer ${
                      importMode === 'append'
                        ? 'border-emerald-500 bg-emerald-50/50 text-slate-900 font-bold ring-1 ring-emerald-500'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xs font-bold">{t.importAppend}</div>
                    <div className="text-[11px] text-slate-500 font-normal mt-0.5">
                      {language === 'ar' ? 'إضافة موظفي تقرير الـ PDF إلى السجلات المسجلة مسبقاً' : 'Append PDF records to existing records'}
                    </div>
                  </button>
                </div>
              </div>
            </div>
          ) : !isMappingStep ? (
            /* Upload Drop Area */
            <div className="space-y-4">
              {onOpenTargetAllocation && (
                <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                      <Target className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-blue-900">
                        {language === 'ar' ? 'هل تريد رفع شيت تارجت الفرع أو طريقة تقسيمه؟' : 'Looking to upload branch target & split rules?'}
                      </h4>
                      <p className="text-blue-700 text-[11px] mt-0.5">
                        {language === 'ar'
                          ? 'يمكنك تحديد تارجت فرع راية كونكورد بلازا الإجمالي واختيار طريقة تقسيمه على الموظفين (بالتساوي، بنسب مئوية، أو مخصص).'
                          : 'Configure Raya Concorde Plaza target and split equally or by custom percentages.'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenTargetAllocation();
                    }}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-xs shrink-0 cursor-pointer"
                  >
                    <span>{language === 'ar' ? 'فتح شيت تقسيم التارجت' : 'Open Target Split Engine'}</span>
                    <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                  </button>
                </div>
              )}

              {onOpenUnifiedAiPrompt && (
                <div className="bg-gradient-to-r from-purple-50 via-indigo-50/60 to-emerald-50/50 border border-purple-200/90 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                      <Sparkles className="w-4 h-4 animate-pulse text-amber-300" />
                    </div>
                    <div>
                      <h4 className="font-bold text-purple-950 flex items-center gap-1.5">
                        <span>{language === 'ar' ? 'بياناتك غير منتظمة أو مختلفة من وقت لآخر؟' : 'Unstructured or Varying Data Format?'}</span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] bg-purple-200 text-purple-900 font-extrabold">{language === 'ar' ? 'نظام موحد' : 'Unified'}</span>
                      </h4>
                      <p className="text-purple-800 text-[11px] mt-0.5 leading-relaxed">
                        {language === 'ar'
                          ? 'استخدم مولّد برومبت الـ AI لإنشاء تعليمات موحدة ترسلها لأي نموذج (ChatGPT / Claude / Gemini) ليحول بياناتك بدقة إلى صيغة راية الموحدة وتستوردها فوراً!'
                          : 'Use the AI Prompt Generator to format any raw data via external AI into the official schema for 1-click direct import.'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenUnifiedAiPrompt();
                    }}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 font-black text-xs bg-purple-700 hover:bg-purple-800 text-white rounded-xl transition-all shadow-xs shrink-0 cursor-pointer active:scale-95 whitespace-nowrap"
                  >
                    <FileCode className="w-3.5 h-3.5 text-amber-300" />
                    <span>{language === 'ar' ? 'مولّد برومبت الـ AI والاستيراد المباشر' : 'AI Prompt & Direct Import'}</span>
                    <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                  </button>
                </div>
              )}

              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-7 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                  isDragging
                    ? 'border-emerald-500 bg-emerald-50/50 scale-[0.99]'
                    : 'border-slate-300 hover:border-emerald-400 hover:bg-slate-50/70'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv, .pdf, .txt, text/plain, application/pdf, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, text/csv"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleFileSelected(e.target.files[0]);
                    }
                  }}
                />

                <div className="flex items-center justify-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-xs border border-emerald-200/60">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shadow-xs border border-rose-200/60">
                    <FileText className="w-6 h-6" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-center gap-2 mb-1 flex-wrap">
                    <p className="text-sm font-bold text-slate-800">
                      {isProcessing ? (language === 'ar' ? 'جاري فحص وقراءة الملف وتحليل البيانات...' : 'Reading and analyzing sales report...') : (
                        language === 'ar' ? 'اسحب شيت Excel أو CSV أو تقرير PDF أو ملف TXT هنا' : 'Drop Excel, CSV, PDF, or TXT sales file here'
                      )}
                    </p>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full">
                      {language === 'ar' ? 'يدعم Excel و CSV و PDF و TXT' : 'Excel, CSV, PDF & TXT'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    {language === 'ar'
                      ? 'يمكنك رفع شيتات إكسل (.xlsx / .csv) أو تقارير مبيعات PDF أو ملفات النصوص (TXT بالفواصل) لفرع راية كونكورد بلازا وسيتم استخراج وتدقيق أداء المستشارين والضريبة 14% تلقائياً.'
                      : 'Upload Excel, CSV, PDF, or Delimited Text (TXT) branch sales reports with automated extraction and 14% VAT reconciliation.'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] mt-1">
                  <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-md font-medium">
                    Excel (.xlsx, .xls)
                  </span>
                  <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-0.5 rounded-md font-medium">
                    CSV (.csv)
                  </span>
                  <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-0.5 rounded-md font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>PDF تقارير مبيعات</span>
                  </span>
                  <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-md font-bold">
                    ملفات نصوص (TXT فواصل)
                  </span>
                </div>
              </div>

              {/* Sample Template Section */}
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <HelpCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <p className="font-semibold text-slate-800">
                      {language === 'ar' ? 'هل تحتاج نموذجاً معتمداً للبيانات؟' : 'Need an official template?'}
                    </p>
                    <p className="text-slate-500 text-[11px]">
                      {language === 'ar' ? 'حمل شيت إكسيل، CSV، ملف TXT، أو نموذج تقرير PDF المعتمد لفرع راية كونكورد بلازا' : 'Download sample Excel, CSV, TXT, or certified PDF sales report'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                  <button
                    type="button"
                    onClick={downloadSampleExcelTemplate}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors whitespace-nowrap shadow-xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{language === 'ar' ? 'Excel (.xlsx)' : 'Excel'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={downloadSampleSalesCsvTemplate}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 font-bold text-xs text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors whitespace-nowrap shadow-2xs cursor-pointer"
                  >
                    <span>CSV</span>
                  </button>

                  <button
                    type="button"
                    onClick={downloadSampleSalesPdfTemplate}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 font-bold text-xs text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors whitespace-nowrap shadow-2xs cursor-pointer"
                    title={language === 'ar' ? 'تحميل نموذج تقرير مبيعات PDF تجريبي' : 'Download Sample Sales PDF Report'}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>{language === 'ar' ? 'نموذج PDF' : 'Sample PDF'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => downloadSampleSalesTxtTemplate()}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 font-bold text-xs text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors whitespace-nowrap shadow-2xs cursor-pointer"
                    title={language === 'ar' ? 'تحميل نموذج مبيعات نصي بنظام الفواصل (TXT)' : 'Download Delimited Text Sales Template (TXT)'}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>TXT</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Mapping Verification Step */
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-emerald-50/70 border border-emerald-200 p-3.5 rounded-xl text-xs text-emerald-900 gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>
                    {language === 'ar' ? (
                      <>تمت قراءة الملف <strong>{fileName}</strong> بنجاح! تم العثور على {rawRows.length} صفاً.</>
                    ) : (
                      <>File <strong>{fileName}</strong> loaded! Found {rawRows.length} rows.</>
                    )}
                  </span>
                </div>
                {latestDateFound?.formattedAr && (
                  <div className="bg-emerald-700 text-white font-bold text-[11px] px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-2xs">
                    <Calendar className="w-3.5 h-3.5 text-amber-300" />
                    <span>{language === 'ar' ? `آخر تاريخ في الشيت: ${latestDateFound.formattedAr}` : `Latest Date: ${latestDateFound.formattedAr}`}</span>
                  </div>
                )}
                <button
                  onClick={handleReset}
                  className="text-xs text-emerald-800 underline font-medium hover:text-emerald-950"
                >
                  {language === 'ar' ? 'اختيار ملف آخر' : 'Choose another file'}
                </button>
              </div>

              {/* Tab Switcher: Sales vs Stock */}
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <button
                  type="button"
                  onClick={() => setActiveSheetKind('sales')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeSheetKind === 'sales'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>{language === 'ar' ? 'شيت مبيعات وتارجت المستشارين' : 'Sales & Targets Sheet'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSheetKind('stock')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeSheetKind === 'stock'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>{language === 'ar' ? 'شيت مخزون وأرصدة فرع كونكورد' : 'Concorde Stock & Inventory Sheet'}</span>
                </button>
              </div>

              {activeSheetKind === 'stock' ? (
                /* STOCK / INVENTORY COLUMN MAPPING VIEW */
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Package className="w-4 h-4 text-blue-600" />
                        <span>{language === 'ar' ? 'مطابقة أعمدة شيت المخزون والأرصدة (فرع كونكورد والمخزن الرئيسي)' : 'Stock & Inventory Column Mapping'}</span>
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {language === 'ar'
                          ? 'قم بمطابقة أعمدة شيت المخزون الخاص بك. إذا كان الشيت يحتوي على رصيد المعرض فقط، يكفي تحديد عمود رصيد كونكورد.'
                          : 'Map your stock columns. If your sheet only has branch stock, Concorde stock column is sufficient.'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={handleSaveInventoryMappingNow}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
                        title={language === 'ar' ? 'حفظ إعدادات أعمدة المخزون في LocalStorage' : 'Save stock column mapping'}
                      >
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        <span>{language === 'ar' ? 'حفظ تعيين المخزون بالذاكرة' : 'Save Stock Mapping'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleClearSavedInventoryMapping}
                        className="text-[10px] text-slate-400 hover:text-rose-600 underline cursor-pointer"
                      >
                        {language === 'ar' ? 'مسح المحفوظ' : 'Clear'}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* SKU Column */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {language === 'ar' ? 'كود الصنف / SKU / باركود' : 'Item Code / SKU'} <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={inventoryMapping.skuColumn || ''}
                        onChange={(e) => setInventoryMapping({ ...inventoryMapping, skuColumn: e.target.value })}
                        className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      >
                        <option value="">-- {language === 'ar' ? 'اختر عمود كود الصنف' : 'Select SKU Column'} --</option>
                        {headers.map((h) => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>

                    {/* Name Column */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {language === 'ar' ? 'اسم الصنف / الموديل / الوصف' : 'Item Name / Model'} <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={inventoryMapping.nameColumn || ''}
                        onChange={(e) => setInventoryMapping({ ...inventoryMapping, nameColumn: e.target.value })}
                        className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      >
                        <option value="">-- {language === 'ar' ? 'اختر عمود اسم الصنف' : 'Select Name Column'} --</option>
                        {headers.map((h) => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>

                    {/* Concorde Stock Column */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                        <span>{language === 'ar' ? 'رصيد فرع كونكورد / الكمية المتوفرة:' : 'Concorde Branch Stock:'}</span>
                        <span className="text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded font-bold">إلزامي للمخزون</span>
                      </label>
                      <select
                        value={inventoryMapping.concordeStockColumn || ''}
                        onChange={(e) => setInventoryMapping({ ...inventoryMapping, concordeStockColumn: e.target.value })}
                        className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      >
                        <option value="">-- {language === 'ar' ? 'اختر عمود رصيد فرع كونكورد' : 'Select Branch Stock Column'} --</option>
                        {headers.map((h) => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>

                    {/* Main Warehouse Stock Column */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                        <span>{language === 'ar' ? 'رصيد المخزن الرئيسي (قطامية / عبور):' : 'Main Warehouse Stock:'}</span>
                        <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">اختياري</span>
                      </label>
                      <select
                        value={inventoryMapping.mainWarehouseStockColumn || ''}
                        onChange={(e) => setInventoryMapping({ ...inventoryMapping, mainWarehouseStockColumn: e.target.value })}
                        className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      >
                        <option value="">-- {language === 'ar' ? 'اختر عمود المخزن الرئيسي' : 'Select Main Warehouse Column'} --</option>
                        {headers.map((h) => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>

                    {/* Price Column */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {language === 'ar' ? 'سعر البيع بالجنيه (RSP):' : 'Retail Price EGP:'}
                      </label>
                      <select
                        value={inventoryMapping.priceColumn || ''}
                        onChange={(e) => setInventoryMapping({ ...inventoryMapping, priceColumn: e.target.value })}
                        className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      >
                        <option value="">-- {language === 'ar' ? 'اختر عمود السعر (أو تقدير تلقائي)' : 'Select Price Column'} --</option>
                        {headers.map((h) => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>

                    {/* Sales Velocity Column */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {language === 'ar' ? 'معدل السحب / المبيعات الشهرية:' : 'Monthly Sales Velocity:'}
                      </label>
                      <select
                        value={inventoryMapping.salesVelocityColumn || ''}
                        onChange={(e) => setInventoryMapping({ ...inventoryMapping, salesVelocityColumn: e.target.value })}
                        className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      >
                        <option value="">-- {language === 'ar' ? 'اختر عمود معدل السحب (أو تقدير تلقائي)' : 'Select Sales Velocity Column'} --</option>
                        {headers.map((h) => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>

                    {/* Category Column */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {language === 'ar' ? 'القسم / الفئة (هواتف، لابتوب، إكسسوار، أجهزة):' : 'Category / Department:'}
                      </label>
                      <select
                        value={inventoryMapping.categoryColumn || ''}
                        onChange={(e) => setInventoryMapping({ ...inventoryMapping, categoryColumn: e.target.value })}
                        className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      >
                        <option value="">-- {language === 'ar' ? 'اختر عمود القسم (أو تصنيف ذكي)' : 'Select Category Column'} --</option>
                        {headers.map((h) => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>

                    {/* Aging Days Column */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {language === 'ar' ? 'أيام الركود / عمر المخزون:' : 'Stock Aging Days:'}
                      </label>
                      <select
                        value={inventoryMapping.agingDaysColumn || ''}
                        onChange={(e) => setInventoryMapping({ ...inventoryMapping, agingDaysColumn: e.target.value })}
                        className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      >
                        <option value="">-- {language === 'ar' ? 'اختر عمود الركود (اختياري)' : 'Select Aging Column'} --</option>
                        {headers.map((h) => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>

                    {/* Date Column (تاريخ الرصيد أو الجرد) */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                        <span>{language === 'ar' ? 'عمود تاريخ الرصيد / الجرد (لفرز أحدث تاريخ):' : 'Stock Balance Date Column (Latest Date):'}</span>
                        <span className="text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded font-bold">فرز أحدث تاريخ</span>
                      </label>
                      <select
                        value={inventoryMapping.dateColumn || ''}
                        onChange={(e) => setInventoryMapping({ ...inventoryMapping, dateColumn: e.target.value })}
                        className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      >
                        <option value="">-- {language === 'ar' ? 'اختر عمود تاريخ الرصيد (تلقائي إن وُجد)' : 'Select Date Column'} --</option>
                        {headers.map((h) => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ) : (
                /* SALES COLUMN MAPPING VIEW */
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
                    <h4 className="text-sm font-bold text-slate-900">
                      {t.mappingTitle}
                    </h4>
                    <div className="flex items-center gap-2">
                      {isSavedMappingApplied && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          <Sparkles className="w-3 h-3 text-amber-600" />
                          <span>{language === 'ar' ? 'تعيين محفوظ من جهازك' : 'Saved Device Mapping'}</span>
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={handleSaveMappingNow}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
                        title={language === 'ar' ? 'حفظ التعيين الحالي في LocalStorage' : 'Save current mapping to LocalStorage'}
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>{language === 'ar' ? 'حفظ التعيين بالذاكرة' : 'Save Mapping'}</span>
                      </button>
                      {isSavedMappingApplied && (
                        <button
                          type="button"
                          onClick={handleClearSavedMapping}
                          className="text-[10px] text-slate-400 hover:text-rose-600 underline cursor-pointer"
                        >
                          {language === 'ar' ? 'مسح المحفوظ' : 'Clear Saved'}
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">
                    {t.mappingDesc}
                  </p>

              {/* Intelligent Validation & Schema Compliance Badge */}
              {activeSheetKind === 'sales' && validationReport && (
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-emerald-600 text-white shrink-0">
                        <CheckCircle2 className="w-4 h-4" />
                      </span>
                      <div>
                        <div className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                          <span>{validationReport.matchedSchemaNameAr || 'نموذج مبيعات راية المعتمد'}</span>
                          {validationReport.schemaMatchPercentage && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 font-black">
                              توافق {validationReport.schemaMatchPercentage}%
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-emerald-800">
                          {language === 'ar'
                            ? `تم فحص ${validationReport.totalRowsScanned} صفاً واعتماد ${validationReport.validDataRows} حركة بيعية معتمدة.`
                            : `Scanned ${validationReport.totalRowsScanned} rows, verified ${validationReport.validDataRows} approved transactions.`}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="text-[11px] font-mono bg-white/90 border border-emerald-200 px-2.5 py-1 rounded-lg text-emerald-950 font-bold">
                        {language === 'ar' ? 'شامل الضريبة: ' : 'Gross: '}
                        {validationReport.totalParsedGrossSales.toLocaleString()} ج.م
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowValidationModal(true)}
                        className="text-[11px] font-bold text-emerald-900 bg-white hover:bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{language === 'ar' ? 'عرض تقرير التدقيق والمطابقة الكامل' : 'Audit Report'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap pt-1 text-[10px] border-t border-emerald-200/60 text-slate-700">
                    <span className="bg-white/80 px-2 py-0.5 rounded border border-emerald-100 font-medium">
                      صافي قبل الضريبة: <strong>{validationReport.totalParsedNetSales.toLocaleString()} ج.م</strong>
                    </span>
                    <span className="bg-white/80 px-2 py-0.5 rounded border border-emerald-100 font-medium">
                      ضريبة 14%: <strong>{validationReport.totalParsedVat.toLocaleString()} ج.م</strong>
                    </span>
                    {validationReport.subtotalRowsSkipped > 0 && (
                      <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-slate-600">
                        استبعاد {validationReport.subtotalRowsSkipped} صفوف إجماليات
                      </span>
                    )}
                    {validationReport.headerRepetitionsSkipped > 0 && (
                      <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-slate-600">
                        تجاوز {validationReport.headerRepetitionsSkipped} عناوين مكررة
                      </span>
                    )}
                    {validationReport.unassignedRowsHandled > 0 && (
                      <span className="bg-amber-100/90 text-amber-900 px-2 py-0.5 rounded border border-amber-200 font-bold">
                        توجيه {validationReport.unassignedRowsHandled} حركات بيع عامة للمعرض
                      </span>
                    )}
                  </div>
                </div>
              )}

              {mappingSavedFeedback && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{mappingSavedFeedback}</span>
                </div>
              )}

              {isSavedMappingApplied && !mappingSavedFeedback && (
                <div className="p-2.5 rounded-xl bg-blue-50/80 border border-blue-200 text-xs text-blue-900 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="text-[11px]">
                      {language === 'ar'
                        ? 'تم تطبيق إعدادات أعمدة شيت المبيعات المحفوظة مسبقاً لهذا الجهاز تلقائياً.'
                        : 'Your saved sales column mapping was automatically applied.'}
                    </span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Branch Column */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.colBranchSelect} <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={mapping.branchColumn}
                    onChange={(e) => setMapping({ ...mapping, branchColumn: e.target.value })}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    <option value="">-- {language === 'ar' ? 'اختر عمود الفرع' : 'Select Branch Column'} --</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Employee Column */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.colEmployeeSelect} <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={mapping.employeeColumn}
                    onChange={(e) => setMapping({ ...mapping, employeeColumn: e.target.value })}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    <option value="">-- {language === 'ar' ? 'اختر عمود الموظف' : 'Select Employee Column'} --</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Job ID Column (Optional) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.colJobIdSelect}
                  </label>
                  <select
                    value={mapping.employeeIdColumn || ''}
                    onChange={(e) => setMapping({ ...mapping, employeeIdColumn: e.target.value })}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    <option value="">-- {language === 'ar' ? 'بدون رقم وظيفي' : 'No Job ID Column'} --</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 4. Target Column */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>{t.colTargetSelect}</span>
                    <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded font-normal">
                      {mapping.isTransactionLevel ? (language === 'ar' ? 'تلقائي من هيكل الفرع' : 'Auto from branch targets') : (language === 'ar' ? 'مطلوب للشيتات الإجمالية' : 'Required for summaries')}
                    </span>
                  </label>
                  <select
                    value={mapping.targetColumn}
                    onChange={(e) => setMapping({ ...mapping, targetColumn: e.target.value })}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    <option value="">-- {language === 'ar' ? 'اختر عمود التارجت (أو تلقائي من النظام)' : 'Select Target Column (or Auto)'} --</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 5. Actual Sales Column (Standard or Fallback) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>{t.colActualSelect}</span>
                    {(mapping.actualAfterVatColumn || mapping.actualBeforeVatColumn) && (
                      <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded font-normal">
                        {language === 'ar' ? 'تم تحديد عمود شامل/صافي الضريبة' : 'VAT column mapped'}
                      </span>
                    )}
                  </label>
                  <select
                    value={mapping.actualColumn}
                    onChange={(e) => setMapping({ ...mapping, actualColumn: e.target.value })}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    <option value="">-- {language === 'ar' ? 'اختر عمود المبيعات الفعلية (الأساسي)' : 'Select Actual Sales Column'} --</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 5b. Actual Before VAT (Net Sales) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>{language === 'ar' ? 'المبيعات قبل ضريبة القيمة المضافة (صافي):' : 'Sales Before VAT (Net):'}</span>
                    <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded font-mono">اختياري / يُحسب تلقائياً</span>
                  </label>
                  <select
                    value={mapping.actualBeforeVatColumn || ''}
                    onChange={(e) => setMapping({ ...mapping, actualBeforeVatColumn: e.target.value })}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    <option value="">-- {language === 'ar' ? 'اختر عمود المبيعات قبل الضريبة' : 'Select Before VAT Column'} --</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 5c. Actual After VAT (Gross Sales With 14% VAT) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>{language === 'ar' ? 'المبيعات بعد ضريبة القيمة المضافة (شامل الضريبة):' : 'Sales After VAT (Gross):'}</span>
                    <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded font-mono">اختياري / يُحسب تلقائياً</span>
                  </label>
                  <select
                    value={mapping.actualAfterVatColumn || ''}
                    onChange={(e) => setMapping({ ...mapping, actualAfterVatColumn: e.target.value })}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    <option value="">-- {language === 'ar' ? 'اختر عمود المبيعات بعد الضريبة' : 'Select After VAT Column'} --</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 5d. VAT Amount (14%) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>{language === 'ar' ? 'عمود ضريبة القيمة المضافة 14%:' : 'VAT Amount (14%):'}</span>
                    <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded font-mono">اختياري</span>
                  </label>
                  <select
                    value={mapping.vatAmountColumn || ''}
                    onChange={(e) => setMapping({ ...mapping, vatAmountColumn: e.target.value })}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    <option value="">-- {language === 'ar' ? 'اختر عمود ضريبة القيمة المضافة' : 'Select VAT Amount Column'} --</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 6. Period (Optional) */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    {t.colPeriodSelect}
                  </label>
                  <select
                    value={mapping.periodColumn || ''}
                    onChange={(e) => setMapping({ ...mapping, periodColumn: e.target.value })}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    <option value="">-- {language === 'ar' ? 'بدون تحديد فترة' : 'No Period Column'} --</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 7. Date Column (تاريخ المعاملة أو أحدث تاريخ) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>{language === 'ar' ? 'عمود تاريخ المبيعات (لاستخراج أحدث تاريخ):' : 'Sales Date Column (Latest Date):'}</span>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-bold">فرز أحدث تاريخ</span>
                  </label>
                  <select
                    value={mapping.dateColumn || ''}
                    onChange={(e) => setMapping({ ...mapping, dateColumn: e.target.value })}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    <option value="">-- {language === 'ar' ? 'اختر عمود التاريخ (تلقائي إن وُجد)' : 'Select Date Column'} --</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* LocalStorage Mapping Preference Box */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMapping}
                    onChange={(e) => setRememberMapping(e.target.checked)}
                    className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      {language === 'ar'
                        ? 'حفظ هذه الإعدادات ومطابقة الأعمدة كإعداد افتراضي دائم (LocalStorage)'
                        : 'Save this column mapping permanently in browser (LocalStorage)'}
                    </span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      {language === 'ar'
                        ? 'سيقوم النظام بقراءة شيتات مبيعات فرع كونكورد بلازا بنفس هذه الأعمدة تلقائياً في المرات القادمة دون الحاجة لإعادة التعيين.'
                        : 'Future Concorde Plaza sales sheets will automatically be mapped without asking you again.'}
                    </span>
                  </div>
                </label>
              </div>

              {/* Import Mode: Replace vs Append */}
              <div className="pt-3 border-t border-slate-200">
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  {t.importModeLabel}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setImportMode('replace')}
                    className={`p-3 rounded-xl border ${language === 'ar' ? 'text-right' : 'text-left'} transition-colors ${
                      importMode === 'replace'
                        ? 'border-emerald-500 bg-emerald-50/50 text-slate-900 font-bold ring-1 ring-emerald-500'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xs font-bold">{t.importReplace}</div>
                    <div className="text-[11px] text-slate-500 font-normal mt-0.5">
                      {t.importReplaceDesc}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setImportMode('append')}
                    className={`p-3 rounded-xl border ${language === 'ar' ? 'text-right' : 'text-left'} transition-colors ${
                      importMode === 'append'
                        ? 'border-emerald-500 bg-emerald-50/50 text-slate-900 font-bold ring-1 ring-emerald-500'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xs font-bold">{t.importAppend}</div>
                    <div className="text-[11px] text-slate-500 font-normal mt-0.5">
                      {t.importAppendDesc}
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              handleReset();
              onClose();
            }}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
          >
            {pdfResult ? (language === 'ar' ? 'إلغاء واختيار ملف آخر' : 'Cancel & Choose Another') : t.cancelBtn}
          </button>

          {pdfResult && (
            <button
              type="button"
              onClick={handleConfirmPdfImport}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 active:scale-[0.98] rounded-xl transition-all shadow-md cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-200" />
              <span>
                {language === 'ar'
                  ? `اعتماد واستيراد بيانات تقرير PDF (${pdfResult.records.length} موظف)`
                  : `Import PDF Sales Report (${pdfResult.records.length} Advisors)`}
              </span>
              <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
            </button>
          )}

          {isMappingStep && !pdfResult && (
            activeSheetKind === 'stock' ? (
              <button
                type="button"
                onClick={handleConfirmStockImport}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 rounded-xl transition-all shadow-md cursor-pointer"
              >
                <Package className="w-4 h-4 text-blue-200" />
                <span>
                  {language === 'ar'
                    ? `اعتماد واستيراد مخزون فرع كونكورد (${stockItems.length > 0 ? stockItems.length : rawRows.length} صنف)`
                    : `Confirm & Import Concorde Stock (${stockItems.length > 0 ? stockItems.length : rawRows.length} Items)`}
                </span>
                <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConfirmImport}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                <span>{t.confirmImportBtn}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )
          )}
        </div>
      </div>

      <ExcelValidationReportModal
        isOpen={showValidationModal}
        onClose={() => setShowValidationModal(false)}
        report={validationReport}
        language={language}
        onConfirmImport={activeSheetKind === 'sales' ? handleConfirmImport : undefined}
      />
    </div>
  );
};
