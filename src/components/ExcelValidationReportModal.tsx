import React, { useState } from 'react';
import {
  X,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  Table,
  Layers,
  ArrowRight,
  Database,
  Hash,
  Eye,
} from 'lucide-react';
import { SheetRowValidationReport } from '../utils/excelParser';
import { Language } from '../types/sales';

interface ExcelValidationReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: SheetRowValidationReport | null;
  language: Language;
  onConfirmImport?: () => void;
}

export const ExcelValidationReportModal: React.FC<ExcelValidationReportModalProps> = ({
  isOpen,
  onClose,
  report,
  language,
  onConfirmImport,
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'columns' | 'sample'>('summary');

  if (!isOpen || !report) return null;

  const isAr = language === 'ar';
  const hasDuplicates = report.duplicateRowCount > 0;
  const hasDiscrepancy = !report.isReconciledExact && report.reconciliationDiscrepancy > 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold flex items-center gap-2">
                <span>{isAr ? 'تقرير التدقيق والتحقق من دقة استخراج البيانات' : 'Data Ingestion & Accuracy Audit Report'}</span>
                {report.isReconciledExact ? (
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {isAr ? 'مطابقة تامة 100%' : '100% Reconciled'}
                  </span>
                ) : (
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {isAr ? 'تنبيه مطابقة' : 'Reconciliation Note'}
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
                <span className="font-mono text-slate-300">{report.fileName || 'ملف الإكسيل'}</span>
                <span>•</span>
                <span>
                  {isAr ? 'ورقة العمل النشطة:' : 'Active Sheet:'}{' '}
                  <strong className="text-emerald-400">{report.activeSheetName || 'ورقة 1'}</strong>
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-5 text-xs font-bold text-slate-600 gap-1 pt-2">
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-4 py-2.5 rounded-t-lg border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'summary'
                ? 'border-emerald-600 text-emerald-800 bg-white shadow-xs'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>{isAr ? 'المطابقة الإجمالية والصفوف' : 'Summary & Reconciliation'}</span>
          </button>
          <button
            onClick={() => setActiveTab('columns')}
            className={`px-4 py-2.5 rounded-t-lg border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'columns'
                ? 'border-emerald-600 text-emerald-800 bg-white shadow-xs'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>{isAr ? 'تدقيق الأعمدة والقيم الصفرية والناقصة' : 'Columns & Zero/Missing Audit'}</span>
            <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded-full font-mono">
              {report.columnStats?.length || 0}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('sample')}
            className={`px-4 py-2.5 rounded-t-lg border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'sample'
                ? 'border-emerald-600 text-emerald-800 bg-white shadow-xs'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{isAr ? 'عينة من الحركات ومقارنتها بالأصل' : 'Source vs Parsed Row Sample'}</span>
            <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded-full font-mono">
              {report.sampleComparisons?.length || 0}
            </span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 text-slate-800">
          {activeTab === 'summary' && (
            <div className="space-y-4">
              {/* Multi-Sheet Detection Status */}
              {report.allSheetNames && report.allSheetNames.length > 1 && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                  <div className="flex items-center gap-2 mb-2">
                    <Layers className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="text-xs font-bold text-slate-800">
                      {isAr ? 'أوراق العمل المكتشفة في الملف:' : 'Detected Worksheets in File:'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {report.allSheetNames.map((sheet) => {
                      const isActive = sheet === report.activeSheetName;
                      const skippedInfo = report.skippedSheetNames?.find((s) => s.sheetName === sheet);
                      return (
                        <div
                          key={sheet}
                          className={`text-xs px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${
                            isActive
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                              : 'bg-white border-slate-200 text-slate-600'
                          }`}
                        >
                          <span>{sheet}</span>
                          {isActive ? (
                            <span className="text-[10px] bg-emerald-200 text-emerald-900 px-1 rounded">
                              {isAr ? 'تمت معالجتها' : 'Active'}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">
                              {skippedInfo ? `(${skippedInfo.reason})` : isAr ? '(تم تجاوزها)' : '(Skipped)'}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Rows Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-[11px] text-slate-500 font-medium">
                    {isAr ? 'إجمالي صفوف المصدر' : 'Source Rows'}
                  </div>
                  <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                    {report.sourceRowCount.toLocaleString()}
                  </div>
                </div>
                <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl">
                  <div className="text-[11px] text-emerald-800 font-medium">
                    {isAr ? 'الحركات المعتمدة بنجاح' : 'Approved Valid Rows'}
                  </div>
                  <div className="text-xl font-bold font-mono text-emerald-700 mt-1">
                    {report.validDataRows.toLocaleString()}
                  </div>
                </div>
                <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl">
                  <div className="text-[11px] text-amber-800 font-medium">
                    {isAr ? 'صفوف مستبعدة (إجماليات/فارغة)' : 'Rejected / Subtotal'}
                  </div>
                  <div className="text-xl font-bold font-mono text-amber-700 mt-1">
                    {report.rejectedRowCount.toLocaleString()}
                  </div>
                </div>
                <div className="p-3 bg-rose-50/80 border border-rose-200 rounded-xl">
                  <div className="text-[11px] text-rose-800 font-medium">
                    {isAr ? 'حركات مكررة مستبعدة' : 'Duplicates Skipped'}
                  </div>
                  <div className="text-xl font-bold font-mono text-rose-700 mt-1">
                    {report.duplicateRowCount.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Numeric Reconciliation Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-slate-600" />
                    <span>{isAr ? 'مطابقة القيم المالية (المصدر مقابل النظام المستخرج):' : 'Financial Totals Reconciliation:'}</span>
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">
                    {isAr ? 'ضريبة القيمة المضافة 14%' : '14% Egyptian VAT'}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-right border-collapse">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">{isAr ? 'الحقل المالي' : 'Financial Field'}</th>
                        <th className="p-2.5">{isAr ? 'إجمالي المصدر الخام' : 'Raw Source Total'}</th>
                        <th className="p-2.5">{isAr ? 'الإجمالي بعد الاعتماد' : 'Approved System Total'}</th>
                        <th className="p-2.5">{isAr ? 'الفارق / التوضيح' : 'Variance & Details'}</th>
                        <th className="p-2.5 text-center">{isAr ? 'حالة المطابقة' : 'Reconciled'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="p-2.5 font-bold text-slate-800">{isAr ? 'المبيعات شامل الضريبة (Gross)' : 'Gross Sales (Taxed)'}</td>
                        <td className="p-2.5 font-mono text-slate-700 font-semibold">{report.sourceGrossSalesTotal.toLocaleString()} ج.م</td>
                        <td className="p-2.5 font-mono text-emerald-700 font-bold">{report.parsedGrossSalesTotal.toLocaleString()} ج.م</td>
                        <td className="p-2.5 text-[11px] text-slate-500">
                          {report.sourceGrossSalesTotal === report.parsedGrossSalesTotal ? (
                            <span className="text-emerald-700">{isAr ? 'مطابقة بنسبة 100%' : 'Exact match'}</span>
                          ) : (
                            <span className="text-amber-700">
                              {isAr
                                ? `فارق ${Math.abs(report.sourceGrossSalesTotal - report.parsedGrossSalesTotal).toLocaleString()} ج.م (بسبب استبعاد الإجماليات والمكرر)`
                                : `Diff ${Math.abs(report.sourceGrossSalesTotal - report.parsedGrossSalesTotal)}`}
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 text-center">
                          {report.sourceGrossSalesTotal === report.parsedGrossSalesTotal ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              {isAr ? 'معتمد' : 'Verified'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                              <AlertCircle className="w-3 h-3" />
                              {isAr ? 'تم الضبط' : 'Adjusted'}
                            </span>
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold text-slate-800">{isAr ? 'صافي المبيعات قبل الضريبة (Net)' : 'Pre-VAT Sales (Net)'}</td>
                        <td className="p-2.5 font-mono text-slate-700">{report.sourceNetSalesTotal.toLocaleString()} ج.م</td>
                        <td className="p-2.5 font-mono text-slate-800 font-bold">{report.parsedNetSalesTotal.toLocaleString()} ج.م</td>
                        <td className="p-2.5 text-[11px] text-slate-500">
                          {isAr ? 'محسوب طبقاً لنسبة الضريبة 14% الصافية' : 'Calculated at 14% Pre-VAT'}
                        </td>
                        <td className="p-2.5 text-center">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            {isAr ? 'معتمد' : 'Verified'}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold text-slate-800">{isAr ? 'قيمة ضريبة القيمة المضافة 14%' : 'VAT 14% Amount'}</td>
                        <td className="p-2.5 font-mono text-slate-700">{report.sourceVatTotal.toLocaleString()} ج.م</td>
                        <td className="p-2.5 font-mono text-blue-700 font-bold">{report.parsedVatTotal.toLocaleString()} ج.م</td>
                        <td className="p-2.5 text-[11px] text-slate-500">
                          {isAr ? 'المطابقة الحسابية: شامل - صافي' : 'Gross minus Net'}
                        </td>
                        <td className="p-2.5 text-center">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            {isAr ? 'معتمد' : 'Verified'}
                          </span>
                        </td>
                      </tr>
                      {report.parsedQtyTotal !== undefined && (
                        <tr>
                          <td className="p-2.5 font-bold text-slate-800">{isAr ? 'إجمالي الكميات المباعة (Q)' : 'Total Quantity (Q)'}</td>
                          <td className="p-2.5 font-mono text-slate-700">{report.sourceQtyTotal !== undefined ? report.sourceQtyTotal.toLocaleString() : report.parsedQtyTotal.toLocaleString()} وحدة</td>
                          <td className="p-2.5 font-mono text-purple-700 font-bold">{report.parsedQtyTotal.toLocaleString()} وحدة</td>
                          <td className="p-2.5 text-[11px] text-slate-500">
                            {report.sourceQtyTotal !== undefined && report.sourceQtyTotal === report.parsedQtyTotal
                              ? (isAr ? 'مطابقة تامة لعدد القطع المباعة' : 'Exact quantity match')
                              : (isAr ? 'الكمية المستخرجة المعتمدة لكافة بنود الفاتورة' : 'Approved parsed quantity total')}
                          </td>
                          <td className="p-2.5 text-center">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              {isAr ? 'معتمد' : 'Verified'}
                            </span>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Actionable Warnings / Audit Notes */}
              {report.actionableWarnings && report.actionableWarnings.length > 0 && (
                <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 space-y-1.5">
                  <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>{isAr ? 'تنبيهات وتوضيحات التدقيق المالي:' : 'Financial Audit Notes:'}</span>
                  </div>
                  <ul className="text-xs text-amber-800 space-y-1 pr-4 list-disc">
                    {report.actionableWarnings.map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {activeTab === 'columns' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">
                {isAr
                  ? 'يوضح الجدول التالي جميع الأعمدة المكتشفة في ورقة العمل ومطابقتها، مع رصد القيم الصفرية الصالحة (0 و"صفر") والتفريق بينها وبين القيم الناقصة أو الفارغة.'
                  : 'Column mapping breakdown showing explicit valid zeros vs missing/blank values.'}
              </p>
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-xs text-right border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">{isAr ? 'اسم العمود في الإكسيل' : 'Header in Excel'}</th>
                      <th className="p-2.5">{isAr ? 'الحقل المعين بالنظام' : 'Mapped Field'}</th>
                      <th className="p-2.5">{isAr ? 'إجمالي الخلايا' : 'Total Cells'}</th>
                      <th className="p-2.5">{isAr ? 'الخلايا المكتملة' : 'Present'}</th>
                      <th className="p-2.5">{isAr ? 'أصفار صالحة (0 / صفر)' : 'Valid Zeros'}</th>
                      <th className="p-2.5">{isAr ? 'خلايا فارغة / ناقصة' : 'Missing'}</th>
                      <th className="p-2.5">{isAr ? 'إجمالي أرقام العمود' : 'Column Sum'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {report.columnStats?.map((col) => (
                      <tr key={col.columnName} className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold font-mono text-slate-800">{col.columnName}</td>
                        <td className="p-2.5">
                          {col.mappedField !== 'غير معين' ? (
                            <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                              {col.mappedField}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">{isAr ? 'إضافي / غير معين' : 'Unmapped'}</span>
                          )}
                        </td>
                        <td className="p-2.5 font-mono text-slate-600">{col.totalCells}</td>
                        <td className="p-2.5 font-mono text-emerald-700 font-semibold">{col.presentCount}</td>
                        <td className="p-2.5 font-mono text-blue-700">
                          {col.zeroCount > 0 ? (
                            <span className="bg-blue-50 text-blue-800 px-1.5 py-0.5 rounded font-bold">
                              {col.zeroCount}
                            </span>
                          ) : (
                            '0'
                          )}
                        </td>
                        <td className="p-2.5 font-mono text-slate-400">
                          {col.missingCount > 0 ? (
                            <span className="text-amber-700 font-semibold">{col.missingCount}</span>
                          ) : (
                            '0'
                          )}
                        </td>
                        <td className="p-2.5 font-mono text-slate-700 font-medium">
                          {col.sourceSum !== undefined ? `${col.sourceSum.toLocaleString()} ج.م` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'sample' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">
                {isAr
                  ? 'مقارنة عينة من الصفوف الأصلية في شيت المصدر وما تم استخراجه واعتماده في النظام:'
                  : 'Sample rows comparing raw workbook rows to extracted application records:'}
              </p>
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-xs text-right border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">#</th>
                      <th className="p-2.5">{isAr ? 'الموظف / المستشار' : 'Advisor'}</th>
                      <th className="p-2.5">{isAr ? 'المبلغ المعتمد' : 'Gross Amount'}</th>
                      <th className="p-2.5">{isAr ? 'صافي قبل الضريبة' : 'Net'}</th>
                      <th className="p-2.5">{isAr ? 'الضريبة 14%' : 'VAT'}</th>
                      <th className="p-2.5">{isAr ? 'الحالة' : 'Status'}</th>
                      <th className="p-2.5">{isAr ? 'ملاحظات المعالجة' : 'Audit Notes'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {report.sampleComparisons?.map((sample) => (
                      <tr key={sample.rowIndex} className="hover:bg-slate-50">
                        <td className="p-2.5 font-mono text-slate-400 text-[10px]">{sample.rowIndex}</td>
                        <td className="p-2.5 font-bold text-slate-900">{sample.parsedEmployee}</td>
                        <td className="p-2.5 font-mono font-bold text-emerald-700">
                          {sample.parsedGrossAmount.toLocaleString()} ج.م
                        </td>
                        <td className="p-2.5 font-mono text-slate-600">
                          {sample.parsedNetAmount !== undefined ? `${sample.parsedNetAmount.toLocaleString()} ج.م` : '-'}
                        </td>
                        <td className="p-2.5 font-mono text-blue-600">
                          {sample.parsedVatAmount !== undefined ? `${sample.parsedVatAmount.toLocaleString()} ج.م` : '-'}
                        </td>
                        <td className="p-2.5">
                          {sample.status === 'valid' && (
                            <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                              {isAr ? 'معتمد' : 'Valid'}
                            </span>
                          )}
                          {sample.status === 'fixed' && (
                            <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-bold">
                              {isAr ? 'مسترد من الكمية*السعر' : 'Recovered'}
                            </span>
                          )}
                          {sample.status === 'duplicate' && (
                            <span className="text-[10px] bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full font-bold">
                              {isAr ? 'مكرر مستبعد' : 'Duplicate'}
                            </span>
                          )}
                          {sample.status === 'rejected' && (
                            <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-bold">
                              {isAr ? 'مستبعد' : 'Excluded'}
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 text-[11px] text-slate-500">
                          {sample.notes || (isAr ? 'تمت المطابقة والتحقق بنجاح' : 'OK')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            {isAr
              ? 'تم التحقق من دقة الاستخراج واستبعاد التكرار وازدواجية الاحتساب.'
              : 'Data verified with zero leakage and duplicate protection.'}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              {isAr ? 'إغلاق المعاينة' : 'Close Preview'}
            </button>
            {onConfirmImport && (
              <button
                onClick={() => {
                  onConfirmImport();
                  onClose();
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>{isAr ? 'اعتماد واستيراد البيانات' : 'Confirm & Apply Data'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
