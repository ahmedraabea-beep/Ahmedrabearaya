import React, { useState, useRef } from 'react';
import { RayaThreeSheetsReconciliationCard } from './RayaThreeSheetsReconciliationCard';
import {
  FileSpreadsheet,
  UploadCloud,
  Download,
  Zap,
  CheckCircle2,
  AlertCircle,
  FileText,
  Sparkles,
  TrendingUp,
  Receipt,
  RotateCcw,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Coins,
  Percent,
  Layers,
  UserCheck,
  AlertTriangle,
  SlidersHorizontal,
  X,
  Clock,
  Activity,
  FileWarning,
  FileCode,
  Boxes,
  PackageCheck,
  Truck,
  ArrowRightLeft,
} from 'lucide-react';
import {
  parseExcelOrCsvFile,
  parseDelimitedTextSalesFile,
  parsePdfSalesReportFile,
  downloadSampleSalesPdfTemplate,
  downloadSampleSalesTxtTemplate,
  parseIncentiveExcelOrCsvFile,
  mergeIncentiveDataIntoSalesRecords,
  auditRecordsAndFix,
  downloadSampleExcelTemplate,
  downloadSampleSalesCsvTemplate,
  downloadSampleIncentiveTemplate,
  downloadSampleIncentivesCsvTemplate,
  downloadSampleIncentiveRulesTemplate,
  exportRecordsToExcel,
  ParseIncentiveResult,
  StructuralErrorDetails,
  SheetRowValidationReport,
} from '../utils/excelParser';
import { ExcelValidationReportModal } from './ExcelValidationReportModal';
import {
  parseUploadedInventorySheet,
  downloadSampleCombinedInventorySheet,
  downloadSampleStockOnlySheet,
  downloadSampleSalesOnlySheet,
  saveConcordeInventoryItems,
} from '../utils/inventoryOptimizerService';
import { InventoryItem } from '../types/inventory';
import {
  SalesRecord,
  Currency,
  Language,
  BranchTotalTargetStructure,
  ProductIncentiveRule,
  AuditReport,
  DataAuditIssue,
} from '../types/sales';
import { formatCurrencyNumber } from '../utils/calculations';

interface FastExcelProcessingHubProps {
  language: Language;
  currency: Currency;
  records: SalesRecord[];
  incentiveRules: ProductIncentiveRule[];
  targetStructure?: BranchTotalTargetStructure | null;
  vatDisplayMode: 'afterVat' | 'beforeVat';
  onToggleVatMode: (mode: 'afterVat' | 'beforeVat') => void;
  onImportSalesRecords: (newRecords: SalesRecord[], mode: 'replace' | 'append') => void;
  onImportIncentiveSheet: (result: ParseIncentiveResult) => void;
  onImportStockItems?: (items: InventoryItem[], fileName: string) => void;
  onOpenInventoryOptimizer?: () => void;
  onUpdateRecordsWithAudit: (auditedRecords: SalesRecord[], report: AuditReport) => void;
  auditReport: AuditReport | null;
  onOpenUploadModal: () => void;
  onOpenIncentivesModal: () => void;
  onOpenMonthlyReport: () => void;
  onResetDemoData: () => void;
  onOpenUnifiedAiPrompt?: () => void;
}

export const FastExcelProcessingHub: React.FC<FastExcelProcessingHubProps> = ({
  language,
  currency,
  records,
  incentiveRules = [],
  targetStructure,
  vatDisplayMode,
  onToggleVatMode,
  onImportSalesRecords,
  onImportIncentiveSheet,
  onImportStockItems,
  onOpenInventoryOptimizer,
  onUpdateRecordsWithAudit,
  auditReport,
  onOpenUploadModal,
  onOpenMonthlyReport,
  onResetDemoData,
  onOpenUnifiedAiPrompt,
}) => {
  const isAr = language === 'ar';
  const salesFileInputRef = useRef<HTMLInputElement>(null);
  const stockFileInputRef = useRef<HTMLInputElement>(null);
  const incentiveFileInputRef = useRef<HTMLInputElement>(null);
  const dualFileInputRef = useRef<HTMLInputElement>(null);

  const [isSalesDragging, setIsSalesDragging] = useState(false);
  const [isStockDragging, setIsStockDragging] = useState(false);
  const [isIncentiveDragging, setIsIncentiveDragging] = useState(false);
  const [isDualDragging, setIsDualDragging] = useState(false);

  const [isProcessingSales, setIsProcessingSales] = useState(false);
  const [isProcessingStock, setIsProcessingStock] = useState(false);
  const [isProcessingIncentive, setIsProcessingIncentive] = useState(false);
  const [salesProcessTime, setSalesProcessTime] = useState<number | null>(null);
  const [stockProcessTime, setStockProcessTime] = useState<number | null>(null);
  const [incentiveProcessTime, setIncentiveProcessTime] = useState<number | null>(null);

  const [stockSuccessInfo, setStockSuccessInfo] = useState<{
    fileName: string;
    count: number;
    concordeUnits: number;
    warehouseUnits: number;
    totalValue: number;
    latestDateFormattedAr?: string;
  } | null>(null);

  const [salesSuccessInfo, setSalesSuccessInfo] = useState<{
    fileName: string;
    count: number;
    beforeVat: number;
    vat: number;
    afterVat: number;
    isPdf?: boolean;
    isTxt?: boolean;
    latestDateFormattedAr?: string;
    isTransactionLevel?: boolean;
    transactionCount?: number;
    validationReport?: SheetRowValidationReport;
  } | null>(null);

  const [incentiveSuccessInfo, setIncentiveSuccessInfo] = useState<{
    fileName: string;
    matchedCount: number;
    totalAmount: number;
    isEmployeeBased: boolean;
  } | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showAuditDrawer, setShowAuditDrawer] = useState(false);
  const [showValidationReportModal, setShowValidationReportModal] = useState(false);

  // Dynamic Progress Bar & Structural Error Diagnosis
  const [processingProgress, setProcessingProgress] = useState<{
    active: boolean;
    progress: number;
    stageName: string;
    stageDetails: string;
    fileName: string;
    fileSizeStr: string;
    fileType: 'excel' | 'txt' | 'csv' | 'pdf';
    isLargeFile: boolean;
    startTime: number;
    elapsedMs: number;
  } | null>(null);

  const [structuralError, setStructuralError] = useState<{
    fileName: string;
    fileType: string;
    cause: string;
    missingColumns?: string[];
    foundHeaders?: string[];
    suggestion?: string;
    detectedDelimiter?: string;
    totalRowsFound?: number;
    rawError?: string;
  } | null>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const updateProgress = (progress: number, stageName: string, stageDetails: string) => {
    setProcessingProgress((prev) =>
      prev
        ? {
            ...prev,
            progress,
            stageName,
            stageDetails,
            elapsedMs: Math.round(performance.now() - prev.startTime),
          }
        : null
    );
  };

  const activeRecords = records.filter(
    (r) => r.period && (r.period.includes('أكتوبر') || r.period.includes('Oct') || r.period.includes('10'))
  );
  const targetRecords = activeRecords.length > 0 ? activeRecords : records;

  const totalBeforeVat = targetRecords.reduce(
    (sum, r) => sum + (r.actualBeforeVat !== undefined ? r.actualBeforeVat : Math.round(r.actual / 1.14)),
    0
  );
  const totalVat = targetRecords.reduce(
    (sum, r) => sum + (r.vatAmount !== undefined ? r.vatAmount : r.actual - Math.round(r.actual / 1.14)),
    0
  );
  const totalAfterVat = targetRecords.reduce(
    (sum, r) => sum + (r.actualAfterVat !== undefined ? r.actualAfterVat : r.actual),
    0
  );
  const totalIncentives = targetRecords.reduce((sum, r) => sum + (r.earnedIncentive || 0), 0);

  // Process Sales File (Excel, CSV, PDF, or delimited TXT) with Progress & Structural Diagnosis
  const handleProcessSalesFile = async (file: File) => {
    setErrorMessage(null);
    setStructuralError(null);
    setIsProcessingSales(true);
    const start = performance.now();

    const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';
    const isTxt =
      file.name.toLowerCase().endsWith('.txt') ||
      file.name.toLowerCase().endsWith('.tsv') ||
      file.name.toLowerCase().endsWith('.tab') ||
      file.type === 'text/plain' ||
      file.type === 'text/tab-separated-values';
    const isCsv = file.name.toLowerCase().endsWith('.csv');
    const fileType: 'excel' | 'txt' | 'csv' | 'pdf' = isPdf ? 'pdf' : isTxt ? 'txt' : isCsv ? 'csv' : 'excel';
    const isLarge = file.size > 80 * 1024;

    setProcessingProgress({
      active: true,
      progress: 15,
      stageName: isAr ? 'قراءة وتحميل محتويات الملف' : 'Reading & Decoding File',
      stageDetails: isAr ? 'يتم فك تشفير البيانات الثنائية وتفريغ الجداول...' : 'Decoding binary data and loading tables...',
      fileName: file.name,
      fileSizeStr: formatFileSize(file.size),
      fileType,
      isLargeFile: isLarge,
      startTime: start,
      elapsedMs: 0,
    });

    if (isPdf) {
      try {
        updateProgress(35, isAr ? 'إرسال التقرير واستخراج الجداول بالذكاء الاصطناعي' : 'Extracting PDF tables via AI', isAr ? 'تحليل هيكل تقرير مبيعات فرع كونكورد بلازا...' : 'Analyzing PDF branch sales report structure...');
        await new Promise((r) => setTimeout(r, isLarge ? 120 : 60));

        const pdfResult = await parsePdfSalesReportFile(file);
        const elapsed = Math.round(performance.now() - start);
        setSalesProcessTime(elapsed);

        if (!pdfResult.records || pdfResult.records.length === 0) {
          setProcessingProgress(null);
          setStructuralError({
            fileName: file.name,
            fileType: 'تقرير PDF معتمد',
            cause: isAr ? 'لم يتم العثور على جداول مبيعات صالحة أو صفوف مستشارين داخل تقرير الـ PDF' : 'No sales tables or consultant records found in PDF',
            missingColumns: ['أكواد الموظفين', 'المبيعات المحققة', 'التارجت المطلوب'],
            suggestion: isAr ? 'تأكد من أن ملف الـ PDF يحتوي على تقرير مبيعات رسمي قابل للقراءة أو استخدم نموذج الـ PDF المعتمد.' : 'Ensure the PDF contains a structured official sales report.',
          });
          setErrorMessage(
            isAr
              ? 'لم يتم العثور على سجلات صالحة في ملف تقرير الـ PDF.'
              : 'No valid sales records found in PDF report.'
          );
          setIsProcessingSales(false);
          return;
        }

        updateProgress(75, isAr ? 'معايرة الضريبة 14% ومطابقة الموظفين' : 'Reconciling 14% VAT & Consultants', isAr ? 'تدقيق المبالغ الصافية والشاملة للضريبة وتوزيع الأقسام...' : 'Reconciling pre/post VAT amounts...');
        await new Promise((r) => setTimeout(r, isLarge ? 100 : 50));

        const { auditedRecords, report } = auditRecordsAndFix(pdfResult.records);
        onImportSalesRecords(auditedRecords, 'replace');
        onUpdateRecordsWithAudit(auditedRecords, report);

        updateProgress(95, isAr ? 'التدقيق الشامل والاعتماد' : 'Final audit & verification', isAr ? 'تطبيق السجلات المعتمدة في لوحة التحكم...' : 'Applying certified records to dashboard...');
        await new Promise((r) => setTimeout(r, isLarge ? 100 : 50));

        const sumAfterVat = auditedRecords.reduce((s, r) => s + (r.actualAfterVat || r.actual), 0);
        const sumBeforeVat = auditedRecords.reduce(
          (s, r) => s + (r.actualBeforeVat !== undefined ? r.actualBeforeVat : Math.round(r.actual / 1.14)),
          0
        );
        const sumVat = auditedRecords.reduce((s, r) => s + (r.vatAmount || 0), 0);

        updateProgress(100, isAr ? 'اكتملت المعالجة بنجاح!' : 'Completed successfully!', isAr ? `تم استيراد ${auditedRecords.length} مستشار مبيعات` : `Imported ${auditedRecords.length} consultants`);
        await new Promise((r) => setTimeout(r, 350));
        setProcessingProgress(null);

        setSalesSuccessInfo({
          fileName: file.name,
          count: auditedRecords.length,
          beforeVat: sumBeforeVat,
          vat: sumVat,
          afterVat: sumAfterVat,
          isPdf: true,
          isTxt: false,
        });
      } catch (err: unknown) {
        setProcessingProgress(null);
        const msg = err instanceof Error ? err.message : 'خطأ في قراءة وتحليل تقرير PDF';
        setStructuralError({
          fileName: file.name,
          fileType: 'تقرير مبيعات PDF',
          cause: isAr ? 'فشل فك تشفير محتوى الـ PDF أو أن بنية المستند غير متوافقة' : 'PDF structure could not be parsed',
          suggestion: isAr ? 'يمكنك رفع شيت إكسيل أو CSV أو استخدام نموذج الـ PDF المعتمد لفرع كونكورد.' : 'Try uploading Excel/CSV or certified sample PDF.',
          rawError: msg,
        });
        setErrorMessage(msg);
      } finally {
        setIsProcessingSales(false);
      }
      return;
    }

    if (isTxt) {
      try {
        updateProgress(25, isAr ? 'قراءة وتحميل الملف النصي' : 'Reading text file', isAr ? 'يتم فحص أسطر وفواصل الملف النصي...' : 'Scanning text lines and delimiters...');
        await new Promise((r) => setTimeout(r, isLarge ? 120 : 60));

        updateProgress(50, isAr ? 'فحص بنية الفواصل والأعمدة' : 'Analyzing delimiters & structure', isAr ? 'التحقق من الفاصل المجدول وتطابق الأعمدة...' : 'Detecting delimiter and column headers...');
        const txtResult = await parseDelimitedTextSalesFile(file);
        const elapsed = Math.round(performance.now() - start);
        setSalesProcessTime(elapsed);

        if (txtResult.error || txtResult.needsManualMapping || txtResult.records.length === 0) {
          setProcessingProgress(null);
          setIsProcessingSales(false);
          const missing = txtResult.structuralErrorDetails?.missingColumns || (
            txtResult.needsManualMapping ? ['اسم الموظف أو الرقم الوظيفي', 'المبيعات المحققة', 'التارجت المطلوب'] : []
          );
          setStructuralError({
            fileName: file.name,
            fileType: 'ملف نصوص (TXT بنظام الفواصل)',
            cause: txtResult.structuralErrorDetails?.cause || txtResult.error || (isAr ? 'خلل في بنية وتنسيق الملف النصي' : 'Structural issue in text file'),
            missingColumns: missing,
            foundHeaders: txtResult.structuralErrorDetails?.foundHeaders || txtResult.headers || [],
            suggestion: txtResult.structuralErrorDetails?.suggestion || (isAr ? 'تأكد من استخدام فواصل منتظمة في أسطر الملف (Tab أو فاصلة أو خط عمودي)، أو استخدم أداة مطابقة الأعمدة.' : 'Ensure regular delimiters or use column mapping.'),
            detectedDelimiter: txtResult.structuralErrorDetails?.detectedDelimiter,
            totalRowsFound: txtResult.structuralErrorDetails?.totalRowsFound || (txtResult.rawRows ? txtResult.rawRows.length : undefined),
            rawError: txtResult.error,
          });
          setErrorMessage(txtResult.error || (isAr ? 'تم رصد خلل في بنية وتنسيق الملف النصي المرفوع.' : 'Text file structure issue detected.'));
          return;
        }

        updateProgress(75, isAr ? 'احتساب ضريبة 14% والأقسام' : 'Calculating 14% VAT & splits', isAr ? 'معايرة مبيعات الهواتف والإكسسوار والضريبة...' : 'Reconciling VAT and department sales...');
        await new Promise((r) => setTimeout(r, isLarge ? 100 : 50));

        const { auditedRecords, report } = auditRecordsAndFix(txtResult.records);
        onImportSalesRecords(auditedRecords, 'replace');
        onUpdateRecordsWithAudit(auditedRecords, report);

        updateProgress(95, isAr ? 'التدقيق الشامل والاعتماد' : 'Final audit & verification', isAr ? 'فحص جودة السجلات وتطبيق البيانات في لوحة التحكم...' : 'Finalizing audit and applying records...');
        await new Promise((r) => setTimeout(r, isLarge ? 100 : 50));

        const sumAfterVat = auditedRecords.reduce((s, r) => s + (r.actualAfterVat || r.actual), 0);
        const sumBeforeVat = auditedRecords.reduce(
          (s, r) => s + (r.actualBeforeVat !== undefined ? r.actualBeforeVat : Math.round(r.actual / 1.14)),
          0
        );
        const sumVat = auditedRecords.reduce((s, r) => s + (r.vatAmount || 0), 0);

        updateProgress(100, isAr ? 'اكتملت المعالجة بنجاح!' : 'Completed successfully!', isAr ? `تم استيراد ${auditedRecords.length} مستشار مبيعات` : `Imported ${auditedRecords.length} consultants`);
        await new Promise((r) => setTimeout(r, 350));
        setProcessingProgress(null);

        setSalesSuccessInfo({
          fileName: file.name,
          count: auditedRecords.length,
          beforeVat: sumBeforeVat,
          vat: sumVat,
          afterVat: sumAfterVat,
          isPdf: false,
          isTxt: true,
          latestDateFormattedAr: txtResult.latestDateFormattedAr,
          isTransactionLevel: txtResult.isTransactionLevel,
          transactionCount: txtResult.transactionCount,
          validationReport: txtResult.validationReport,
        });
      } catch (err: unknown) {
        setProcessingProgress(null);
        const msg = err instanceof Error ? err.message : 'خطأ في قراءة وتحليل الملف النصي (TXT)';
        setStructuralError({
          fileName: file.name,
          fileType: 'ملف نصوص (TXT)',
          cause: isAr ? 'حدث خطأ غير متوقع أثناء تفكيك وقراءة محتوى الملف النصي' : 'Unexpected error during text file decoding',
          suggestion: isAr ? 'تأكد من سلامة الملف وترميزه (UTF-8) وأنه ليس تالفاً.' : 'Ensure UTF-8 encoding and file integrity.',
          rawError: msg,
        });
        setErrorMessage(msg);
      } finally {
        setIsProcessingSales(false);
      }
      return;
    }

    try {
      updateProgress(25, isAr ? 'قراءة وتحميل شيت الإكسيل' : 'Reading Excel sheet', isAr ? 'يتم فك تشفير وتفريغ أوراق العمل...' : 'Decoding workbook sheets...');
      await new Promise((r) => setTimeout(r, isLarge ? 120 : 60));

      updateProgress(50, isAr ? 'فحص بنية الأعمدة والتطابق' : 'Analyzing columns & headers', isAr ? 'مطابقة عناوين الحقول مع المعايير المعتمدة لراية...' : 'Matching columns with Raya standards...');
      const result = await parseExcelOrCsvFile(file);
      const elapsed = Math.round(performance.now() - start);
      setSalesProcessTime(elapsed);

      if (result.detectedType === 'stock') {
        setProcessingProgress(null);
        setIsProcessingSales(false);
        await handleProcessStockFile(file);
        return;
      }

      if (result.detectedType === 'incentive') {
        setProcessingProgress(null);
        setIsProcessingSales(false);
        await handleProcessIncentiveFile(file);
        return;
      }

      if (result.error || result.needsManualMapping || result.records.length === 0) {
        setProcessingProgress(null);
        setIsProcessingSales(false);
        const missing = result.structuralErrorDetails?.missingColumns || (
          result.needsManualMapping ? ['اسم الموظف أو الرقم الوظيفي', 'المبيعات المحققة', 'التارجت المطلوب'] : []
        );
        setStructuralError({
          fileName: file.name,
          fileType: isCsv ? 'ملف فواصل (CSV)' : 'شيت إكسيل (Excel)',
          cause: result.structuralErrorDetails?.cause || result.error || (isAr ? 'عدم تطابق رؤوس الأعمدة مع هيكل مبيعات راية' : 'Header mismatch with sales structure'),
          missingColumns: missing,
          foundHeaders: result.structuralErrorDetails?.foundHeaders || result.headers || [],
          suggestion: result.structuralErrorDetails?.suggestion || (isAr ? 'تأكد من تسمية الأعمدة بشكل واضح أو استخدم أداة مطابقة الأعمدة اليدوية أدناه.' : 'Check headers or map them manually.'),
          totalRowsFound: result.structuralErrorDetails?.totalRowsFound || (result.rawRows ? result.rawRows.length : undefined),
          rawError: result.error,
        });
        setErrorMessage(result.error || (isAr ? 'تم رصد خلل في هيكل شيت المبيعات المرفوع.' : 'Sales sheet structure issue detected.'));
        return;
      }

      updateProgress(75, isAr ? 'احتساب ضريبة 14% والأقسام' : 'Calculating 14% VAT & splits', isAr ? 'معايرة مبيعات الهواتف والإكسسوار والضريبة...' : 'Reconciling VAT and department sales...');
      await new Promise((r) => setTimeout(r, isLarge ? 100 : 50));

      let initialRecords = result.records;
      if (incentiveRules && incentiveRules.length > 0) {
        const dummyIncentiveResult: ParseIncentiveResult = {
          isEmployeeBased: false,
          employeeIncentives: [],
          productRules: incentiveRules,
          branchTierSchemes: [],
          worksheets: [],
          emptySheets: [],
          unresolvedRules: [],
          headers: [],
          totalIncentiveAmount: 0,
        };
        const merged = mergeIncentiveDataIntoSalesRecords(initialRecords, dummyIncentiveResult);
        initialRecords = merged.updatedRecords;
      }

      const { auditedRecords, report } = auditRecordsAndFix(initialRecords);
      onImportSalesRecords(auditedRecords, 'replace');
      onUpdateRecordsWithAudit(auditedRecords, report);

      updateProgress(95, isAr ? 'التدقيق الشامل والاعتماد' : 'Final audit & verification', isAr ? 'فحص جودة السجلات وتطبيق البيانات في لوحة التحكم...' : 'Finalizing audit and applying records...');
      await new Promise((r) => setTimeout(r, isLarge ? 100 : 50));

      const sumAfterVat = auditedRecords.reduce((s, r) => s + (r.actualAfterVat || r.actual), 0);
      const sumBeforeVat = auditedRecords.reduce(
        (s, r) => s + (r.actualBeforeVat !== undefined ? r.actualBeforeVat : Math.round(r.actual / 1.14)),
        0
      );
      const sumVat = auditedRecords.reduce((s, r) => s + (r.vatAmount || 0), 0);

      updateProgress(100, isAr ? 'اكتملت المعالجة بنجاح!' : 'Completed successfully!', isAr ? `تم استيراد ${auditedRecords.length} مستشار مبيعات` : `Imported ${auditedRecords.length} consultants`);
      await new Promise((r) => setTimeout(r, 350));
      setProcessingProgress(null);

      setSalesSuccessInfo({
        fileName: file.name,
        count: auditedRecords.length,
        beforeVat: sumBeforeVat,
        vat: sumVat,
        afterVat: sumAfterVat,
        isPdf: false,
        isTxt: false,
        latestDateFormattedAr: result.latestDateFormattedAr,
        isTransactionLevel: result.isTransactionLevel,
        transactionCount: result.transactionCount,
        validationReport: result.validationReport,
      });
    } catch (err: unknown) {
      setProcessingProgress(null);
      const msg = err instanceof Error ? err.message : 'خطأ في معالجة شيت المبيعات';
      setStructuralError({
        fileName: file.name,
        fileType: isCsv ? 'ملف فواصل (CSV)' : 'شيت إكسيل (Excel)',
        cause: isAr ? 'حدث خطأ أثناء قراءة ملف الإكسيل، قد يكون الملف تالفاً أو محمي بكلمة مرور' : 'Error reading Excel file, file may be corrupted or password-protected',
        suggestion: isAr ? 'تأكد من فتح الملف في إكسيل وحفظه بصيغة .xlsx نظيفة بدون حماية.' : 'Save cleanly as .xlsx without password protection.',
        rawError: msg,
      });
      setErrorMessage(msg);
    } finally {
      setIsProcessingSales(false);
    }
  };

  // Process Stock & Inventory File
  const handleProcessStockFile = async (file: File) => {
    setErrorMessage(null);
    setIsProcessingStock(true);
    const start = performance.now();

    try {
      const buffer = await file.arrayBuffer();
      const parseRes = parseUploadedInventorySheet(buffer);

      if (!parseRes.items || parseRes.items.length === 0) {
        throw new Error('لم يتم العثور على أي أصناف مخزون صالحة في الملف المرفوع.');
      }

      // Save to localStorage and dispatch event for immediate reactivity across all tabs
      saveConcordeInventoryItems(parseRes.items);
      onImportStockItems?.(parseRes.items, file.name);

      const elapsed = Math.round(performance.now() - start);
      setStockProcessTime(elapsed);

      const concordeUnits = parseRes.items.reduce((s, it) => s + (it.concordeStock || 0), 0);
      const warehouseUnits = parseRes.items.reduce((s, it) => s + (it.mainWarehouseStock || 0), 0);
      const totalValue = parseRes.items.reduce((s, it) => s + ((it.concordeStock || 0) * (it.priceEgp || 0)), 0);

      setStockSuccessInfo({
        fileName: file.name,
        count: parseRes.items.length,
        concordeUnits,
        warehouseUnits,
        totalValue,
        latestDateFormattedAr: parseRes.latestDateFormattedAr,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'خطأ في معالجة شيت المخزون';
      setErrorMessage(msg);
    } finally {
      setIsProcessingStock(false);
    }
  };

  // Process Incentive File
  const handleProcessIncentiveFile = async (file: File) => {
    setErrorMessage(null);
    setIsProcessingIncentive(true);
    const start = performance.now();

    try {
      const result = await parseIncentiveExcelOrCsvFile(file);
      const elapsed = Math.round(performance.now() - start);
      setIncentiveProcessTime(elapsed);

      if (result.error) {
        setErrorMessage(result.error);
        setIsProcessingIncentive(false);
        return;
      }

      const { updatedRecords, matchedCount, totalIncentivePaid } = mergeIncentiveDataIntoSalesRecords(
        records,
        result
      );

      const { auditedRecords, report } = auditRecordsAndFix(updatedRecords);
      onImportIncentiveSheet(result);
      onImportSalesRecords(auditedRecords, 'replace');
      onUpdateRecordsWithAudit(auditedRecords, report);

      setIncentiveSuccessInfo({
        fileName: file.name,
        matchedCount,
        totalAmount: totalIncentivePaid,
        isEmployeeBased: result.isEmployeeBased,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'خطأ في معالجة شيت الحافز';
      setErrorMessage(msg);
    } finally {
      setIsProcessingIncentive(false);
    }
  };

  // Handle Multi-Files Attach (Dropping any combination of Sales + Stock + Incentive files)
  const handleProcessDualFiles = async (files: FileList | File[]) => {
    const fileArr = Array.from(files);
    if (fileArr.length === 1) {
      const file = fileArr[0];
      const lower = file.name.toLowerCase();
      if (lower.includes('حافز') || lower.includes('incentive') || lower.includes('bonus')) {
        await handleProcessIncentiveFile(file);
      } else if (lower.includes('مخزون') || lower.includes('ستوك') || lower.includes('stock') || lower.includes('inventory') || lower.includes('ارصده')) {
        await handleProcessStockFile(file);
      } else {
        await handleProcessSalesFile(file);
      }
      return;
    }

    let salesFile: File | null = null;
    let stockFile: File | null = null;
    let incentiveFile: File | null = null;

    fileArr.forEach((f) => {
      const lower = f.name.toLowerCase();
      if (lower.includes('حافز') || lower.includes('incentive') || lower.includes('bonus') || lower.includes('commission')) {
        incentiveFile = f;
      } else if (lower.includes('مخزون') || lower.includes('ستوك') || lower.includes('stock') || lower.includes('inventory') || lower.includes('ارصده')) {
        stockFile = f;
      } else {
        salesFile = f;
      }
    });

    if (salesFile) await handleProcessSalesFile(salesFile);
    if (stockFile) await handleProcessStockFile(stockFile);
    if (incentiveFile) await handleProcessIncentiveFile(incentiveFile);
  };

  // Run Manual Audit & Auto-Fix
  const handleTriggerAudit = () => {
    const { auditedRecords, report } = auditRecordsAndFix(records);
    onImportSalesRecords(auditedRecords, 'replace');
    onUpdateRecordsWithAudit(auditedRecords, report);
    setShowAuditDrawer(true);
  };

  return (
    <section className="bg-white rounded-3xl border-2 border-emerald-500/40 shadow-xl overflow-hidden transition-all">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-blue-950 text-white p-5 sm:p-7 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-emerald-500/25 text-emerald-300 border border-emerald-400/40 text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1.5 shadow-xs">
                <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400 animate-pulse" />
                <span>{isAr ? 'النموذج النهائي الاحترافي المعتمد' : 'Final Professional Model'}</span>
              </span>

              <span className="bg-blue-500/20 text-blue-300 border border-blue-400/40 text-xs px-2.5 py-0.5 rounded-full font-bold font-mono">
                {isAr ? 'تحديث فوري لشيت المبيعات وشيت الحافز' : 'Instant Sales & Incentive Sync'}
              </span>

              <span className="bg-amber-500/20 text-amber-300 border border-amber-400/40 text-xs px-2.5 py-0.5 rounded-full font-bold">
                {isAr ? 'ضريبة القيمة المضافة 14% ومراجعة الأخطاء' : '14% VAT & Error Audit Engine'}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
              <span>
                {isAr
                  ? 'منصة معالجة شيت المبيعات وشيت الحافز والتقارير الفورية'
                  : 'Sales & Incentive Spreadsheet Processing Platform'}
              </span>
              <Sparkles className="w-6 h-6 text-amber-400 shrink-0" />
            </h1>

            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed max-w-3xl">
              {isAr
                ? 'أرفق شيت المبيعات وشيت الحافز (معاً أو منفصلين). يقوم النظام فوراً بربط المستشارين، احتساب المبيعات قبل وبعد ضريبة القيمة المضافة (14%)، تقسيم مبيعات الموبايلات والإكسسوار والـ Other، اعتماد العمولات ومراجعة وتصحيح كافة الأخطاء الحسابية تلقائياً.'
                : 'Attach sales and incentive sheets. Instantly maps consultants, calculates pre/post 14% VAT, breaks down categories, reconciles incentives, and audits all errors.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto shrink-0">
            <button
              type="button"
              onClick={handleTriggerAudit}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/30 text-xs font-bold transition-all cursor-pointer backdrop-blur-xs shadow-xs"
              title={isAr ? 'مراجعة وتدقيق جميع الأخطاء الحسابية' : 'Audit and check all errors'}
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>{isAr ? 'تدقيق وفحص الأخطاء' : 'Audit Data Errors'}</span>
            </button>

            {onOpenUnifiedAiPrompt && (
              <button
                type="button"
                onClick={onOpenUnifiedAiPrompt}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black transition-all cursor-pointer shadow-md border border-purple-400/40 active:scale-95"
                title={isAr ? 'مولّد برومبت الذكاء الاصطناعي لتوحيد وتنسيق الملفات' : 'Unified AI Formatting Prompt'}
              >
                <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                <span>{isAr ? 'برومبت توحيد البيانات (AI)' : 'Unified AI Prompt'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => exportRecordsToExcel(records, undefined, language)}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer shadow-md"
              title={isAr ? 'تصدير التقرير المدمج الشامل للإكسيل' : 'Export merged report to Excel'}
            >
              <FileSpreadsheet className="w-4 h-4 text-white" />
              <span>{isAr ? 'تصدير الإكسيل المعالج' : 'Export Excel'}</span>
            </button>

            <button
              type="button"
              onClick={onOpenMonthlyReport}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all cursor-pointer shadow-md"
            >
              <FileText className="w-4 h-4 text-purple-200" />
              <span>{isAr ? 'تقرير PDF تنفيذي' : 'Printable PDF'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Dual Dropzone Area */}
      <div className="p-5 sm:p-7 space-y-6">
        {/* Unified AI Prompt Banner */}
        {onOpenUnifiedAiPrompt && (
          <div className="bg-gradient-to-r from-purple-50 via-indigo-50/70 to-emerald-50/60 border border-purple-200/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Sparkles className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    {isAr ? 'نظام الاستيراد الموحد ومولّد برومبت الذكاء الاصطناعي الخارجي' : 'Unified Data Import & External AI Prompt Engine'}
                  </h3>
                  <span className="bg-purple-100 text-purple-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                    {isAr ? 'ChatGPT / Claude / Gemini' : 'AI-Ready'}
                  </span>
                </div>
                <p className="text-slate-600 text-xs mt-0.5">
                  {isAr
                    ? 'هل بياناتك غير متطابقة أو تأتيك بصيغ مختلفة؟ احصل على برومبت احترافي يحولها بدقة إلى الصيغة المعتمدة لفرع راية كونكورد بلازا، ثم الصق النتيجة واستوردها مباشرة بنقرة واحدة.'
                    : 'Generate a precision AI prompt to convert any non-standard file, then paste and import directly.'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenUnifiedAiPrompt}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-black text-xs transition-all shadow-xs shrink-0 cursor-pointer active:scale-95 whitespace-nowrap"
            >
              <FileCode className="w-4 h-4 text-amber-300" />
              <span>{isAr ? 'فتح مولّد البرومبت والاستيراد المباشر' : 'Open Prompt & Import'}</span>
            </button>
          </div>
        )}

        <input
          ref={salesFileInputRef}
          type="file"
          accept=".xlsx, .xls, .csv, .tsv, .tab, .pdf, .txt, text/plain, text/tab-separated-values, application/pdf, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, text/csv"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleProcessSalesFile(e.target.files[0]);
            }
          }}
        />

        <input
          ref={stockFileInputRef}
          type="file"
          accept=".xlsx, .xls, .csv, .tsv, .tab, .txt, text/plain, text/tab-separated-values, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, text/csv"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleProcessStockFile(e.target.files[0]);
            }
          }}
        />

        <input
          ref={incentiveFileInputRef}
          type="file"
          accept=".xlsx, .xls, .csv, .tsv, .tab, .txt, text/plain, text/tab-separated-values, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, text/csv"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleProcessIncentiveFile(e.target.files[0]);
            }
          }}
        />

        <input
          ref={dualFileInputRef}
          type="file"
          multiple
          accept=".xlsx, .xls, .csv, .tsv, .tab, .pdf, .txt, text/plain, text/tab-separated-values, application/pdf, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, text/csv"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleProcessDualFiles(e.target.files);
            }
          }}
        />

        {/* Dynamic Progress Bar for Large Excel, TXT, CSV and PDF Files */}
        {processingProgress && processingProgress.active && (
          <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-2xl p-5 border border-emerald-500/40 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

            {/* Header row */}
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center justify-center shrink-0 shadow-inner">
                  <Activity className="w-5 h-5 text-emerald-400 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-white">
                      {isAr ? 'جاري معالجة وفحص ملف المبيعات' : 'Processing & Validating Sales File'}
                    </span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 px-2 py-0.5 rounded-full font-mono font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      <span>{processingProgress.fileType.toUpperCase()}</span>
                    </span>
                    {processingProgress.isLargeFile && (
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                        <Zap className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <span>{isAr ? 'ملف كبير · معالجة متقدمة' : 'Large File Processing'}</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 font-mono mt-0.5">
                    {processingProgress.fileName} ({processingProgress.fileSizeStr})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-auto">
                <div className="text-right">
                  <div className="text-2xl font-black text-emerald-400 font-mono leading-none">
                    {processingProgress.progress}%
                  </div>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1 justify-end mt-1 font-mono">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{processingProgress.elapsedMs}ms</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Stage description */}
            <div className="flex items-center justify-between text-xs text-emerald-200">
              <span className="font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{processingProgress.stageName}</span>
              </span>
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                {processingProgress.stageDetails}
              </span>
            </div>

            {/* The Dynamic Progress Bar Track */}
            <div className="w-full bg-slate-800/90 rounded-full h-3.5 p-0.5 overflow-hidden border border-emerald-500/30 relative shadow-inner">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 transition-all duration-300 ease-out shadow-lg relative overflow-hidden"
                style={{ width: `${Math.max(8, processingProgress.progress)}%` }}
              >
                <div className="absolute inset-0 bg-white/20 w-full animate-pulse" />
              </div>
            </div>

            {/* Step visual chips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
              {[
                { step: 1, label: isAr ? '1. فك التشفير والقراءة' : '1. Decode & Read', min: 15 },
                { step: 2, label: isAr ? '2. فحص بنية الأعمدة' : '2. Column Structure', min: 40 },
                { step: 3, label: isAr ? '3. حساب الضريبة والأقسام' : '3. VAT & Splits', min: 70 },
                { step: 4, label: isAr ? '4. التدقيق الشامل والاعتماد' : '4. Final Audit', min: 95 },
              ].map((s) => {
                const isDone = processingProgress.progress >= s.min;
                const isCurrent = processingProgress.progress < s.min && (s.step === 1 || processingProgress.progress >= (s.min - 30));
                return (
                  <div
                    key={s.step}
                    className={`p-2 rounded-xl border flex items-center gap-1.5 transition-all ${
                      isDone
                        ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 font-bold'
                        : isCurrent
                        ? 'bg-blue-950/60 border-blue-400/40 text-blue-300 font-bold animate-pulse'
                        : 'bg-slate-900/40 border-slate-800 text-slate-500'
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <span className={`w-3.5 h-3.5 rounded-full border text-[9px] flex items-center justify-center shrink-0 ${isCurrent ? 'border-blue-400 text-blue-300' : 'border-slate-700 text-slate-600'}`}>
                        {s.step}
                      </span>
                    )}
                    <span className="truncate">{s.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Explanatory Structural Error Diagnosis Hub */}
        {structuralError && (
          <div className="bg-gradient-to-b from-rose-50 to-amber-50/60 border-2 border-rose-300 rounded-2xl p-5 sm:p-6 shadow-md animate-in fade-in duration-200 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-700 border border-rose-300/80 flex items-center justify-center shrink-0 shadow-xs">
                  <AlertTriangle className="w-6 h-6 text-rose-600 animate-bounce" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-black text-rose-950">
                      {isAr ? 'تم رصد خلل في بنية وتنسيق الملف المرفوع' : 'Uploaded File Structure Issue Detected'}
                    </h3>
                    <span className="text-[10px] font-bold bg-rose-200/80 text-rose-900 px-2 py-0.5 rounded-full font-mono">
                      {structuralError.fileType}
                    </span>
                  </div>
                  <p className="text-xs text-rose-800 font-mono mt-0.5">
                    {structuralError.fileName}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStructuralError(null)}
                className="w-8 h-8 rounded-xl bg-white/80 hover:bg-white text-slate-500 hover:text-slate-800 border border-slate-200 flex items-center justify-center text-sm font-bold transition-colors cursor-pointer shrink-0"
                title={isAr ? 'إغلاق الإشعار' : 'Dismiss notice'}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-white/90 rounded-xl p-4 border border-rose-200 space-y-3 text-xs text-slate-800 shadow-2xs">
              <div>
                <span className="font-bold text-rose-900 block mb-0.5">
                  {isAr ? '🔍 سبب الخلل المشخص:' : '🔍 Diagnosis:'}
                </span>
                <p className="text-slate-700 leading-relaxed font-medium">
                  {structuralError.cause}
                </p>
              </div>

              {structuralError.missingColumns && structuralError.missingColumns.length > 0 && (
                <div>
                  <span className="font-bold text-rose-900 block mb-1.5">
                    {isAr ? '❌ الحقول والأعمدة الأساسية المفقودة التي لم نتمكن من العثور عليها:' : '❌ Missing required columns:'}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {structuralError.missingColumns.map((col, idx) => (
                      <span
                        key={idx}
                        className="bg-rose-100 text-rose-900 border border-rose-300 font-bold px-2.5 py-1 rounded-lg text-xs flex items-center gap-1 shadow-2xs"
                      >
                        <X className="w-3 h-3 text-rose-600" />
                        <span>{col}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {structuralError.foundHeaders && structuralError.foundHeaders.length > 0 && (
                <div>
                  <span className="font-bold text-slate-700 block mb-1.5">
                    {isAr ? '📋 الأعمدة التي تم العثور عليها في ملفك المرفوع:' : '📋 Detected headers in your file:'}
                  </span>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {structuralError.foundHeaders.map((header, idx) => (
                      <span
                        key={idx}
                        className="bg-slate-100 text-slate-800 border border-slate-300 font-mono text-[11px] px-2 py-0.5 rounded-md"
                      >
                        {header || `(عمود فارغ ${idx + 1})`}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {structuralError.detectedDelimiter && (
                <div className="text-[11px] text-slate-600 bg-amber-50 p-2 rounded-lg border border-amber-200 flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span>
                    {isAr
                      ? `الفاصل المكتشف في أسطر ملف الـ TXT: [${structuralError.detectedDelimiter === '\t' ? 'Tab (علامة جدولة)' : structuralError.detectedDelimiter}]`
                      : `Detected text delimiter: [${structuralError.detectedDelimiter}]`}
                  </span>
                </div>
              )}

              <div>
                <span className="font-bold text-emerald-900 block mb-0.5">
                  {isAr ? '💡 الحلول والتوجيهات الموصى بها:' : '💡 Recommended Solution:'}
                </span>
                <p className="text-slate-600 leading-relaxed">
                  {structuralError.suggestion}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setStructuralError(null);
                  onOpenUploadModal();
                }}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>{isAr ? 'فتح أداة مطابقة الأعمدة يدوياً (Column Mapping Tool)' : 'Open Manual Column Mapping Tool'}</span>
              </button>

              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => downloadSampleExcelTemplate()}
                  className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                  title={isAr ? 'تحميل نموذج إكسيل مبيعات قياسي' : 'Download Sample Excel'}
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{isAr ? 'نموذج Excel' : 'Excel Template'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => downloadSampleSalesTxtTemplate()}
                  className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                  title={isAr ? 'تحميل نموذج TXT قياسي بالفواصل' : 'Download Sample TXT'}
                >
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span>{isAr ? 'نموذج TXT' : 'TXT Template'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => downloadSampleSalesCsvTemplate()}
                  className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                >
                  <span>CSV</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStructuralError(null)}
                  className="px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 text-xs font-semibold"
                >
                  {isAr ? 'إلغاء وإخفاء' : 'Dismiss'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* The Three Distinct Dropzones Side-by-Side: Sales, Stock, and Incentives */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Card 1: شيت أو تقرير المبيعات (Sales Sheet, PDF Report, or TXT) */}
          <div
            onDrop={(e) => {
              e.preventDefault();
              setIsSalesDragging(false);
              if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                handleProcessSalesFile(e.dataTransfer.files[0]);
              }
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setIsSalesDragging(true);
            }}
            onDragLeave={() => setIsSalesDragging(false)}
            onClick={() => salesFileInputRef.current?.click()}
            className={`relative rounded-2xl p-5 text-center cursor-pointer transition-all duration-200 border-2 border-dashed flex flex-col items-center justify-between min-h-[260px] ${
              isSalesDragging
                ? 'border-emerald-500 bg-emerald-50/80 scale-[0.99] shadow-inner'
                : 'border-emerald-300 hover:border-emerald-500 bg-emerald-50/20 hover:bg-emerald-50/40 shadow-xs'
            }`}
          >
            <div className="w-full flex items-center justify-between mb-2 flex-wrap gap-1.5">
              <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>1. {isAr ? 'شيت المبيعات' : 'Sales Sheet'}</span>
                <span className="text-[9px] bg-emerald-200/80 text-emerald-900 px-1 py-0.2 rounded font-mono">Excel+PDF</span>
              </span>

              <div className="flex items-center gap-1 flex-wrap">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadSampleExcelTemplate();
                  }}
                  className="text-[10px] font-bold text-emerald-800 hover:text-emerald-950 bg-white hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors shadow-2xs"
                  title={isAr ? 'تحميل نموذج شيت مبيعات جاهز (Excel)' : 'Download Sales Template (Excel)'}
                >
                  <Download className="w-3 h-3 text-emerald-600" />
                  <span>Excel</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadSampleSalesCsvTemplate();
                  }}
                  className="text-[10px] font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-md transition-colors shadow-2xs"
                  title={isAr ? 'تحميل نموذج المبيعات بصيغة CSV' : 'Download Sales Template (CSV)'}
                >
                  <span>CSV</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadSampleSalesPdfTemplate();
                  }}
                  className="text-[10px] font-bold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-1.5 py-0.5 rounded-md flex items-center gap-0.5 transition-colors shadow-2xs"
                  title={isAr ? 'تحميل نموذج تقرير مبيعات PDF تجريبي' : 'Download Sample Sales PDF Report'}
                >
                  <span>PDF</span>
                </button>
              </div>
            </div>

            <div className="w-13 h-13 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs my-2">
              {isProcessingSales ? (
                <Zap className="w-6 h-6 text-emerald-600 animate-spin" />
              ) : (
                <UploadCloud className="w-6 h-6 text-emerald-600" />
              )}
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900 flex items-center justify-center gap-1.5">
                <span>{isAr ? 'إرفاق شيت المبيعات' : 'Attach Sales Sheet'}</span>
              </h3>
              <p className="text-[11px] text-slate-500 max-w-xs leading-relaxed">
                {isAr
                  ? 'استخراج المبيعات بآخر تاريخ مسجل تلقائياً مع احتساب ضريبة 14% والأقسام.'
                  : 'Extracts sales as of latest date automatically with 14% VAT reconciliation.'}
              </p>
            </div>

            <div className="mt-2.5 pt-2.5 border-t border-emerald-200/60 w-full flex flex-col items-center justify-center gap-1 text-[11px] text-emerald-800 font-mono">
              {salesSuccessInfo ? (
                <>
                  <span className="text-emerald-700 font-bold flex items-center gap-1 flex-wrap justify-center text-center">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{salesSuccessInfo.fileName} ({salesSuccessInfo.count} مستشار)</span>
                  </span>
                  <div className="flex items-center gap-1 flex-wrap justify-center mt-0.5">
                    {salesSuccessInfo.isTransactionLevel && (
                      <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-900 font-bold px-2 py-0.5 rounded-md text-[10px] border border-blue-300">
                        <span>🏷️ فواتير تفصيلية ({salesSuccessInfo.transactionCount} حركة)</span>
                      </span>
                    )}
                    {salesSuccessInfo.latestDateFormattedAr && (
                      <span className="inline-flex items-center gap-1 bg-emerald-100/90 text-emerald-950 font-bold px-2 py-0.5 rounded-md text-[10px] border border-emerald-300">
                        <span>📅 تاريخ الشيت: {salesSuccessInfo.latestDateFormattedAr}</span>
                      </span>
                    )}
                    {salesSuccessInfo.validationReport && (
                      <>
                        <span className="inline-flex items-center gap-1 bg-teal-50 text-teal-800 font-bold px-2 py-0.5 rounded-md text-[10px] border border-teal-200">
                          <span>✅ مطابقة معتمدة ({salesSuccessInfo.validationReport.validDataRows} حركة)</span>
                        </span>
                        {salesSuccessInfo.validationReport.subtotalRowsSkipped > 0 && (
                          <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded-md text-[9px] border border-slate-200" title="تم استبعاد صفوف الإجماليات الفرعية لمنع تكرار الحساب">
                            <span>تجاوز {salesSuccessInfo.validationReport.subtotalRowsSkipped} إجماليات</span>
                          </span>
                        )}
                        {salesSuccessInfo.validationReport.headerRepetitionsSkipped > 0 && (
                          <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded-md text-[9px] border border-slate-200" title="تم تجاوز صفوف العناوين المكررة الناتجة عن ترقيم الصفحات">
                            <span>تجاوز {salesSuccessInfo.validationReport.headerRepetitionsSkipped} عناوين مكررة</span>
                          </span>
                        )}
                        {salesSuccessInfo.validationReport.unassignedRowsHandled > 0 && (
                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded-md text-[9px] border border-amber-200" title="تم توجيه مبيعات المعرض العامة (بدون مستشار) لضمان مطابقة الإيراد">
                            <span>+ {salesSuccessInfo.validationReport.unassignedRowsHandled} مبيعات عامة</span>
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowValidationReportModal(true);
                          }}
                          className="inline-flex items-center gap-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-2 py-0.5 rounded-md text-[10px] shadow-xs cursor-pointer transition-colors mt-0.5"
                        >
                          <ShieldCheck className="w-3 h-3 text-white" />
                          <span>{isAr ? 'عرض تقرير التدقيق والمطابقة الكامل' : 'Audit Report'}</span>
                        </button>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <span className="flex items-center gap-1 text-emerald-800 text-[10px]">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>{isAr ? 'يدعم تقارير الفواتير التفصيلية وشيتات التجميع' : 'Supports transaction logs & summary sheets'}</span>
                </span>
              )}
            </div>
          </div>

          {/* Card 2: شيت المخزون والأرصدة (Stock & Inventory Sheet) */}
          <div
            onDrop={(e) => {
              e.preventDefault();
              setIsStockDragging(false);
              if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                handleProcessStockFile(e.dataTransfer.files[0]);
              }
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setIsStockDragging(true);
            }}
            onDragLeave={() => setIsStockDragging(false)}
            onClick={() => stockFileInputRef.current?.click()}
            className={`relative rounded-2xl p-5 text-center cursor-pointer transition-all duration-200 border-2 border-dashed flex flex-col items-center justify-between min-h-[260px] ${
              isStockDragging
                ? 'border-blue-500 bg-blue-50/80 scale-[0.99] shadow-inner'
                : 'border-blue-300 hover:border-blue-500 bg-blue-50/20 hover:bg-blue-50/40 shadow-xs'
            }`}
          >
            <div className="w-full flex items-center justify-between mb-2 flex-wrap gap-1.5">
              <span className="bg-blue-100 text-blue-900 text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                <Boxes className="w-3.5 h-3.5 text-blue-700" />
                <span>2. {isAr ? 'شيت المخزون والستوك' : 'Stock & Inventory'}</span>
                <span className="text-[9px] bg-blue-200/80 text-blue-900 px-1 py-0.2 rounded font-mono">Excel</span>
              </span>

              <div className="flex items-center gap-1 flex-wrap">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadSampleStockOnlySheet();
                  }}
                  className="text-[10px] font-bold text-blue-800 hover:text-blue-950 bg-white hover:bg-blue-100 border border-blue-200 px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors shadow-2xs"
                  title={isAr ? 'تحميل نموذج شيت مخزون فقط (Excel)' : 'Download Stock Template'}
                >
                  <Download className="w-3 h-3 text-blue-600" />
                  <span>Excel</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadSampleCombinedInventorySheet();
                  }}
                  className="text-[10px] font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-md transition-colors shadow-2xs"
                  title={isAr ? 'تحميل شيت المخزون والمبيعات الموحد' : 'Combined Sheet'}
                >
                  <span>{isAr ? 'الموحد' : 'Unified'}</span>
                </button>
              </div>
            </div>

            <div className="w-13 h-13 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center shadow-xs my-2">
              {isProcessingStock ? (
                <Zap className="w-6 h-6 text-blue-600 animate-spin" />
              ) : (
                <Boxes className="w-6 h-6 text-blue-700" />
              )}
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900 flex items-center justify-center gap-1.5">
                <span>{isAr ? 'إرفاق شيت المخزون (الستوك)' : 'Attach Stock Sheet'}</span>
              </h3>
              <p className="text-[11px] text-slate-500 max-w-xs leading-relaxed">
                {isAr
                  ? 'اسحب أو اضغط لرفع شيت أرصدة كونكورد والمخزن الرئيسي ومطابقة السحب بآخر تاريخ.'
                  : 'Drop Stock Excel sheet for Concorde & Warehouse balances as of latest date.'}
              </p>
            </div>

            <div className="mt-2.5 pt-2.5 border-t border-blue-200/60 w-full flex flex-col items-center justify-center gap-1 text-[11px] text-blue-900 font-mono">
              {stockSuccessInfo ? (
                <>
                  <span className="text-blue-800 font-bold flex items-center gap-1 flex-wrap justify-center text-center">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>{stockSuccessInfo.fileName} ({stockSuccessInfo.count} صنف · {stockSuccessInfo.concordeUnits} وحدة)</span>
                  </span>
                  {stockSuccessInfo.latestDateFormattedAr && (
                    <span className="inline-flex items-center gap-1 bg-blue-100/90 text-blue-950 font-bold px-2 py-0.5 rounded-md text-[10px] border border-blue-300">
                      <span>📅 آخر تاريخ للرصيد: {stockSuccessInfo.latestDateFormattedAr}</span>
                    </span>
                  )}
                </>
              ) : (
                <span className="flex items-center gap-1 text-blue-900 text-[10px]">
                  <CheckCircle2 className="w-3 h-3 text-blue-600" />
                  <span>{isAr ? 'تحديث فوري لرادار النواقص والتحويلات' : 'Instant restock recommendations'}</span>
                </span>
              )}
            </div>
          </div>

          {/* Card 2: شيت الحافز (Incentive Sheet) */}
          <div
            onDrop={(e) => {
              e.preventDefault();
              setIsIncentiveDragging(false);
              if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                handleProcessIncentiveFile(e.dataTransfer.files[0]);
              }
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setIsIncentiveDragging(true);
            }}
            onDragLeave={() => setIsIncentiveDragging(false)}
            onClick={() => incentiveFileInputRef.current?.click()}
            className={`relative rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 border-2 border-dashed flex flex-col items-center justify-between min-h-[250px] ${
              isIncentiveDragging
                ? 'border-amber-500 bg-amber-50/80 scale-[0.99] shadow-inner'
                : 'border-amber-300 hover:border-amber-500 bg-amber-50/20 hover:bg-amber-50/40 shadow-xs'
            }`}
          >
            <div className="w-full flex items-center justify-between mb-2">
              <span className="bg-amber-100 text-amber-900 text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1">
                <Coins className="w-3.5 h-3.5 text-amber-700" />
                <span>3. {isAr ? 'شيت الحافز والعمولات' : 'Incentives Sheet'}</span>
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadSampleIncentiveTemplate();
                  }}
                  className="text-[11px] font-bold text-amber-800 hover:text-amber-950 bg-white hover:bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors shadow-2xs"
                  title={isAr ? 'تحميل نموذج شيت حوافز الموظفين (Excel)' : 'Download Incentive Template (Excel)'}
                >
                  <Download className="w-3 h-3 text-amber-700" />
                  <span>{isAr ? 'Excel' : 'Excel'}</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadSampleIncentivesCsvTemplate();
                  }}
                  className="text-[11px] font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 px-2 py-1 rounded-lg transition-colors shadow-2xs"
                  title={isAr ? 'تحميل شيت الحوافز بصيغة CSV' : 'Download Incentive Template (CSV)'}
                >
                  <span>CSV</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadSampleIncentiveRulesTemplate();
                  }}
                  className="text-[11px] font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 px-2 py-1 rounded-lg transition-colors shadow-2xs"
                  title={isAr ? 'تحميل لائحة قواعد الحوافز' : 'Rules Template'}
                >
                  <span>{isAr ? 'القواعد' : 'Rules'}</span>
                </button>
              </div>
            </div>

            <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shadow-xs my-2">
              {isProcessingIncentive ? (
                <Zap className="w-7 h-7 text-amber-600 animate-spin" />
              ) : (
                <Coins className="w-7 h-7 text-amber-600" />
              )}
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                {isAr ? 'إرفاق شيت الحافز' : 'Attach Incentive Sheet'}
              </h3>
              <p className="text-xs text-slate-500 max-w-xs">
                {isAr
                  ? 'اسحب أو اضغط لرفع شيت حوافز وعمولات الموظفين (بونص الهدف، حافز الموبايل والإكسسوار)'
                  : 'Drop or browse Incentive Excel (target bonus, product commissions)'}
              </p>
            </div>

            <div className="mt-3 pt-3 border-t border-amber-200/60 w-full flex items-center justify-center gap-2 text-[11px] text-amber-900 font-mono">
              {incentiveSuccessInfo ? (
                <span className="text-amber-800 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
                  <span>
                    {incentiveSuccessInfo.fileName} (تمت مطابقة {incentiveSuccessInfo.matchedCount} موظف ·{' '}
                    {formatCurrencyNumber(incentiveSuccessInfo.totalAmount, currency, true, language)})
                  </span>
                  {incentiveProcessTime && (
                    <span className="text-[10px] bg-amber-200/80 text-amber-900 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5">
                      <Zap className="w-2.5 h-2.5 text-amber-700" />
                      <span>{incentiveProcessTime}ms</span>
                    </span>
                  )}
                </span>
              ) : (
                <span className="flex items-center gap-1 text-amber-900">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-700" />
                  <span>{isAr ? 'مطابقة فورية للموظفين واحتساب العمولات' : 'Instant consultant matching'}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Dual Files Rapid Drop Strip */}
        <div
          onDrop={(e) => {
            e.preventDefault();
            setIsDualDragging(false);
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              handleProcessDualFiles(e.dataTransfer.files);
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDualDragging(true);
          }}
          onDragLeave={() => setIsDualDragging(false)}
          onClick={() => dualFileInputRef.current?.click()}
          className={`p-3.5 rounded-xl border border-dashed text-center cursor-pointer transition-all flex items-center justify-center gap-3 text-xs font-semibold ${
            isDualDragging
              ? 'border-blue-500 bg-blue-50 text-blue-900'
              : 'border-slate-300 hover:border-blue-400 bg-slate-50/60 text-slate-600 hover:text-blue-800'
          }`}
        >
          <Layers className="w-4 h-4 text-blue-600" />
          <span>
            {isAr
              ? 'أو اسحب شيت المبيعات وشيت المخزون وشيت الحافز معاً هنا دفعة واحدة للربط والتحليل الفوري التلقائي (3 في 1)'
              : 'Or drop Sales, Stock, and Incentive sheets here together for instant simultaneous processing'}
          </span>
          <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded font-mono font-bold flex items-center gap-1">
            <Zap className="w-3 h-3 text-blue-700" />
            <span>{isAr ? 'ربط ثلاثي ذكي' : 'Smart Multi-Link'}</span>
          </span>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-xs text-rose-800 animate-in fade-in duration-200">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <strong className="block font-bold">{isAr ? 'ملاحظة أثناء المعالجة:' : 'Processing Notice:'}</strong>
              <p className="mt-0.5">{errorMessage}</p>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-rose-600 hover:text-rose-900 font-bold px-2 py-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* 3. Comprehensive Data Health & Audit Log ("مراجعة جميع الأخطاء") */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 overflow-hidden transition-all">
          <div
            onClick={() => setShowAuditDrawer(!showAuditDrawer)}
            className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-100/60 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">
                    {isAr ? 'سجل تدقيق الأخطاء وجودة البيانات ومطابقة الموظفين' : 'Data Health & Error Audit Hub'}
                  </h3>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>{isAr ? 'تم التدقيق والتصحيح التلقائي' : 'Audited & Auto-Fixed'}</span>
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {auditReport
                    ? auditReport.summaryMessage
                    : isAr
                    ? 'فحص شامل لضريبة القيمة المضافة 14%، الكود الوظيفي، وتطابق الحوافز مع المبيعات.'
                    : 'Comprehensive verification of 14% VAT, employee IDs, and incentive matching.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleTriggerAudit();
                }}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:border-emerald-500 text-slate-700 hover:text-emerald-800 text-xs font-semibold shadow-2xs"
              >
                {isAr ? 'إعادة الفحص' : 'Re-Check'}
              </button>
              {showAuditDrawer ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </div>
          </div>

          {/* Expanded Audit Log Details */}
          {showAuditDrawer && (
            <div className="p-4 border-t border-slate-200 bg-white space-y-3 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[11px] text-slate-500 font-semibold">{isAr ? 'السجلات المفحوصة' : 'Audited Records'}</div>
                  <div className="text-lg font-bold text-slate-900 font-mono mt-0.5">
                    {auditReport?.totalRecordsChecked || targetRecords.length}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                  <div className="text-[11px] text-emerald-700 font-semibold">{isAr ? 'الملاحظات المعالجة تلقائياً' : 'Auto-Fixed Issues'}</div>
                  <div className="text-lg font-bold text-emerald-800 font-mono mt-0.5">
                    {auditReport?.autoFixedCount || 0}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
                  <div className="text-[11px] text-blue-700 font-semibold">{isAr ? 'وقت آخر تدقيق فوري' : 'Last Evaluated'}</div>
                  <div className="text-sm font-bold text-blue-900 font-mono mt-1">
                    {auditReport?.evaluatedAt || 'الآن'}
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>{isAr ? 'بنود المراجعة والتدقيق المعتمدة:' : 'Verified Audit Rules:'}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-800 block">{isAr ? 'ضريبة القيمة المضافة (14% VAT)' : '14% VAT Formula'}</strong>
                      <span className="text-slate-500 text-[11px]">
                        {isAr
                          ? 'المبيعات بعد الضريبة = قبل الضريبة × 1.14 (مع ضبط فوارق التقريب تلقائياً).'
                          : 'Gross = Net * 1.14 with automatic rounding reconciliation.'}
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-800 block">{isAr ? 'مطابقة مستشاري المبيعات' : 'Advisor Identification'}</strong>
                      <span className="text-slate-500 text-[11px]">
                        {isAr
                          ? 'معايرة الأسماء والأكواد الوظيفية وتجاوز اختلافات الهمزات والحروف العربية.'
                          : 'ID and normalized Arabic name matching across sales and incentive sheets.'}
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-800 block">{isAr ? 'توزيع الأقسام (موبايل، إكسسوار، Other)' : 'Category Split'}</strong>
                      <span className="text-slate-500 text-[11px]">
                        {isAr
                          ? 'التأكد من اكتمال أرقام كل قسم واستنتاجها تلقائياً إذا كانت مفقودة في الشيت.'
                          : 'Validates individual category amounts or distributes them based on store weights.'}
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-800 block">{isAr ? 'اعتماد الحوافز والعمولات' : 'Incentives Validation'}</strong>
                      <span className="text-slate-500 text-[11px]">
                        {isAr
                          ? 'ربط كل حافز مباع ومستحق بالموظف صاحب العملية بدقة 100%.'
                          : 'Ensures incentive payouts correctly link to active consultants.'}
                      </span>
                    </div>
                  </div>
                </div>

                {auditReport && auditReport.issues.length > 0 && (
                  <div className="mt-3 p-3 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1.5">
                    <div className="text-[11px] font-bold text-amber-900">
                      {isAr ? 'تفاصيل الملاحظات التي تم تصحيحها:' : 'Detailed auto-corrections:'}
                    </div>
                    <ul className="text-[11px] text-amber-800 space-y-1 list-disc list-inside">
                      {auditReport.issues.slice(0, 5).map((iss: DataAuditIssue) => (
                        <li key={iss.id}>{isAr ? iss.message : iss.messageEn}</li>
                      ))}
                      {auditReport.issues.length > 5 && (
                        <li className="font-semibold">
                          +{auditReport.issues.length - 5} {isAr ? 'ملاحظة أخرى تم تصحيحها بالكامل' : 'more items resolved'}
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 4. Live Processed Executive Metrics Strip */}
        <div className="bg-slate-50/90 rounded-2xl p-4 sm:p-5 border border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {isAr ? 'البيانات المعالجة والملخص التنفيذي الموحد' : 'Consolidated Processed Executive Summary'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {isAr
                    ? `فرع راية كونكورد بلازا · ${targetRecords.length} مستشار مبيعات نشط`
                    : `Raya Concorde Plaza · ${targetRecords.length} Active Sales Advisors`}
                </p>
              </div>
            </div>

            {/* VAT Display Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-slate-500">
                {isAr ? 'طريقة عرض الأرقام:' : 'Numbers Mode:'}
              </span>
              <div className="bg-white p-1 rounded-xl border border-slate-200 flex items-center text-xs font-mono shadow-2xs">
                <button
                  type="button"
                  onClick={() => onToggleVatMode('afterVat')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    vatDisplayMode === 'afterVat'
                      ? 'bg-emerald-600 text-white font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {isAr ? 'شامل الضريبة (14%)' : 'Gross (with VAT)'}
                </button>
                <button
                  type="button"
                  onClick={() => onToggleVatMode('beforeVat')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    vatDisplayMode === 'beforeVat'
                      ? 'bg-emerald-600 text-white font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {isAr ? 'قبل الضريبة (صافي)' : 'Net (Pre-VAT)'}
                </button>
              </div>
            </div>
          </div>

          {/* Executive Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                <span>{isAr ? 'صافي المبيعات (قبل الضريبة)' : 'Sales Before VAT'}</span>
                <Receipt className="w-3.5 h-3.5 text-blue-500" />
              </div>
              <div className="text-base sm:text-lg font-bold text-slate-900 font-mono mt-1">
                {formatCurrencyNumber(totalBeforeVat, currency, true, language)}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {isAr ? 'صافي إيرادات الفرع دون الضريبة' : 'Net sales pre-tax'}
              </div>
            </div>

            <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                <span>{isAr ? 'ضريبة القيمة المضافة 14%' : '14% VAT Amount'}</span>
                <Percent className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <div className="text-base sm:text-lg font-bold text-amber-700 font-mono mt-1">
                {formatCurrencyNumber(totalVat, currency, true, language)}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {isAr ? 'مبلغ الضريبة المسدد للدولة' : 'Egyptian 14% VAT'}
              </div>
            </div>

            <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                <span>{isAr ? 'إجمالي المبيعات (بعد الضريبة)' : 'Sales After VAT'}</span>
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <div className="text-base sm:text-lg font-bold text-emerald-800 font-mono mt-1">
                {formatCurrencyNumber(totalAfterVat, currency, true, language)}
              </div>
              <div className="text-[10px] text-emerald-600 font-bold mt-0.5">
                {isAr ? `المحقق الفعلي للفرع شامل الضريبة` : 'Total gross branch sales'}
              </div>
            </div>

            <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                <span>{isAr ? 'إجمالي الحوافز المعتمدة' : 'Earned Incentives'}</span>
                <Coins className="w-3.5 h-3.5 text-purple-600" />
              </div>
              <div className="text-base sm:text-lg font-bold text-purple-800 font-mono mt-1">
                {formatCurrencyNumber(totalIncentives, currency, true, language)}
              </div>
              <div className="text-[10px] text-purple-600 font-bold mt-0.5">
                {isAr ? `مستحقة الصرف لـ ${targetRecords.length} مستشارين` : 'Total payout for team'}
              </div>
            </div>
          </div>

          <div className="pt-1 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span>
                {isAr
                  ? 'جميع البيانات متوافقة ومربوطة سحابياً ومحلياً وتتحدث بمجرد إرفاق الشيت'
                  : 'Data auto-updates seamlessly upon attaching spreadsheet'}
              </span>
            </span>

            <button
              type="button"
              onClick={onResetDemoData}
              className="inline-flex items-center gap-1 text-slate-600 hover:text-emerald-800 underline font-semibold transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isAr ? 'استعادة النموذج الأصلي لفرع كونكورد' : 'Reset to baseline'}</span>
            </button>
          </div>

          {/* Dedicated 3-Way Reconciler Engine (Sales × Stock × Incentives & Category Targets) */}
          <RayaThreeSheetsReconciliationCard
            language={language}
            currency={currency}
            onApplyRecordsToDashboard={(newRecs) => onImportSalesRecords(newRecs, 'replace')}
            onOpenMonthlyReport={onOpenMonthlyReport}
          />
        </div>
      </div>

      <ExcelValidationReportModal
        isOpen={showValidationReportModal}
        onClose={() => setShowValidationReportModal(false)}
        report={salesSuccessInfo?.validationReport || null}
        language={language}
      />
    </section>
  );
};
