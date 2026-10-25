import React, { useState } from 'react';
import {
  X,
  Download,
  FileSpreadsheet,
  FileText,
  Coins,
  ShieldCheck,
  CheckCircle2,
  Printer,
  Sparkles,
  Building2,
  AlertCircle,
  FileDown,
  Layers,
  ArrowRight,
  Copy,
  Table,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  downloadSampleExcelTemplate,
  downloadSampleSalesCsvTemplate,
  downloadSampleSalesPdfTemplate,
  downloadSampleSalesTxtTemplate,
  downloadSampleIncentiveTemplate,
  downloadSampleIncentivesCsvTemplate,
  downloadSampleIncentiveRulesTemplate,
  downloadSampleIncentiveRulesCsvTemplate,
  exportRecordsToExcel,
  exportRecordsToCsv,
  copyRowsToClipboard,
} from '../utils/excelParser';
import { SalesRecord, Language, Currency } from '../types/sales';
import { CONCORD_BRANCH_NAME } from '../data/sampleData';

interface ExportAndDownloadCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: SalesRecord[];
  language: Language;
  currency: Currency;
  onOpenMonthlyReport: () => void;
}

const SAMPLE_SALES_DATA = [
  {
    'الرقم الوظيفي': '140729',
    'اسم الموظف': 'أحمد ربيع سيد',
    'اسم الفرع': CONCORD_BRANCH_NAME,
    'التارجت المطلوب': 560000,
    'المبيعات قبل ضريبة القيمة المضافة': 548246,
    'ضريبة القيمة المضافة 14%': 76754,
    'إجمالي المبيعات بعد الضريبة': 625000,
    'محقق الموبايل': 410000,
    'محقق الإكسسوار': 115000,
    'شاشات وتكييفات': 100000,
    'مبيعات التقسيط': 150000,
    'الفترة': 'أكتوبر 2026',
  },
  {
    'الرقم الوظيفي': '41308',
    'اسم الموظف': 'عمرو عبد الحليم',
    'اسم الفرع': CONCORD_BRANCH_NAME,
    'التارجت المطلوب': 490000,
    'المبيعات قبل ضريبة القيمة المضافة': 451754,
    'ضريبة القيمة المضافة 14%': 63246,
    'إجمالي المبيعات بعد الضريبة': 515000,
    'محقق الموبايل': 335000,
    'محقق الإكسسوار': 95000,
    'شاشات وتكييفات': 85000,
    'مبيعات التقسيط': 120000,
    'الفترة': 'أكتوبر 2026',
  },
  {
    'الرقم الوظيفي': '125177',
    'اسم الموظف': 'طارق محمود',
    'اسم الفرع': CONCORD_BRANCH_NAME,
    'التارجت المطلوب': 350000,
    'المبيعات قبل ضريبة القيمة المضافة': 322807,
    'ضريبة القيمة المضافة 14%': 45193,
    'إجمالي المبيعات بعد الضريبة': 368000,
    'محقق الموبايل': 240000,
    'محقق الإكسسوار': 68000,
    'شاشات وتكييفات': 60000,
    'مبيعات التقسيط': 110000,
    'الفترة': 'أكتوبر 2026',
  },
];

const SAMPLE_INCENTIVES_DATA = [
  {
    'الرقم الوظيفي': '140729',
    'اسم الموظف': 'أحمد ربيع سيد',
    'اسم الفرع': CONCORD_BRANCH_NAME,
    'بونص تحقيق التارجت (ج.م)': 7500,
    'حافز مبيعات الموبايلات': 6400,
    'حافز الإكسسوارات': 2100,
    'حافز عقود تقسيط أمان والضمان': 5500,
    'إجمالي الحافز المستحق (ج.م)': 21500,
    'ملاحظات الصرف': 'مستحق الصرف الكامل لتجاوز الهدف بنسبة 111.6%',
  },
  {
    'الرقم الوظيفي': '41308',
    'اسم الموظف': 'عمرو عبد الحليم',
    'اسم الفرع': CONCORD_BRANCH_NAME,
    'بونص تحقيق التارجت (ج.م)': 5000,
    'حافز مبيعات الموبايلات': 3600,
    'حافز الإكسسوارات': 2250,
    'حافز عقود تقسيط أمان والضمان': 3950,
    'إجمالي الحافز المستحق (ج.م)': 14800,
    'ملاحظات الصرف': 'مستحق الصرف لتجاوز الهدف بنسبة 105.1%',
  },
  {
    'الرقم الوظيفي': '125177',
    'اسم الموظف': 'طارق محمود',
    'اسم الفرع': CONCORD_BRANCH_NAME,
    'بونص تحقيق التارجت (ج.م)': 3000,
    'حافز مبيعات الموبايلات': 2600,
    'حافز الإكسسوارات': 1100,
    'حافز عقود تقسيط أمان والضمان': 2500,
    'إجمالي الحافز المستحق (ج.م)': 9200,
    'ملاحظات الصرف': 'مستحق الصرف لتجاوز الهدف بنسبة 105.1%',
  },
];

const SAMPLE_RULES_DATA = [
  {
    'اسم المنتج / فئة الخدمة': 'هواتف ذكية Flagship (Samsung S / iPhone)',
    'قيمة الحافز (ج.م)': 200,
    'نوع الحافز': 'مبلغ ثابت لكل جهاز',
    'الحد الأدنى للوحدات': 10,
    'ملاحظات': 'حافز نقدي مباشر على كل هاتف رائد مباع',
  },
  {
    'اسم المنتج / فئة الخدمة': 'هواتف ذكية فئة متوسطة (A-Series / Xiaomi / Realme)',
    'قيمة الحافز (ج.م)': 100,
    'نوع الحافز': 'مبلغ ثابت لكل جهاز',
    'الحد الأدنى للوحدات': 15,
    'ملاحظات': 'حافز أجهزة الفئة الاقتصادية والمتوسطة',
  },
  {
    'اسم المنتج / فئة الخدمة': 'أجهزة لابتوب وكمبيوتر (Dell / HP / Lenovo)',
    'قيمة الحافز (ج.م)': 350,
    'نوع الحافز': 'مبلغ ثابت لكل جهاز',
    'الحد الأدنى للوحدات': 4,
    'ملاحظات': 'حافز أجهزة اللابتوب',
  },
  {
    'اسم المنتج / فئة الخدمة': 'خدمات تمويل وتقسيط أمان (Aman Consumer Finance)',
    'قيمة الحافز (ج.م)': 250,
    'نوع الحافز': 'مبلغ ثابت لكل عقد',
    'الحد الأدنى للوحدات': 8,
    'ملاحظات': 'حافز كل عقد تمويلي عبر أمان',
  },
  {
    'اسم المنتج / فئة الخدمة': 'خدمة ضمان راية الممتد (Raya Protect Warranty)',
    'قيمة الحافز (ج.م)': 150,
    'نوع الحافز': 'مبلغ ثابت لكل شهادة',
    'الحد الأدنى للوحدات': 10,
    'ملاحظات': 'حافز شهادات الضمان الممتد',
  },
  {
    'اسم المنتج / فئة الخدمة': 'إكسسوارات وسماعات وملحقات أصلية',
    'قيمة الحافز (ج.م)': 50,
    'نوع الحافز': 'مبلغ ثابت لكل قطعة',
    'الحد الأدنى للوحدات': 20,
    'ملاحظات': 'حافز الملحقات والإكسسوارات',
  },
];

export const ExportAndDownloadCenterModal: React.FC<ExportAndDownloadCenterModalProps> = ({
  isOpen,
  onClose,
  records,
  language,
  onOpenMonthlyReport,
}) => {
  const isAr = language === 'ar';
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopyRows = async (id: string, rows: Record<string, unknown>[]) => {
    const success = await copyRowsToClipboard(rows);
    if (success) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 3000);
    }
  };

  const downloadCards = [
    {
      id: 'sales-template',
      title: isAr ? '1. شيت المبيعات المعتمد (Sales Sheet)' : '1. Official Sales Sheet Template',
      category: isAr ? 'نموذج إكسيل جاهز' : 'Ready Excel Template',
      description: isAr
        ? 'يتضمن أعمدة: كود الموظف، الاسم، الفرع، التارجت، المبيعات قبل الضريبة، ضريبة 14%، إجمالي المبيعات، ومحققات الموبايل والإكسسوار والـ Other.'
        : 'Includes Job ID, Name, Target, Pre-VAT Sales, 14% VAT, Gross Total, Mobiles, Accessories, and Other categories.',
      icon: FileSpreadsheet,
      iconColor: 'text-emerald-700 bg-emerald-100',
      borderColor: 'border-emerald-200 hover:border-emerald-400',
      serverExcelUrl: '/api/download/sales-template',
      serverCsvUrl: '/api/download/sales-template-csv',
      fallbackExcel: downloadSampleExcelTemplate,
      fallbackCsv: downloadSampleSalesCsvTemplate,
      rows: SAMPLE_SALES_DATA,
    },
    {
      id: 'incentives-template',
      title: isAr ? '2. شيت حوافز الموظفين (Incentives Sheet)' : '2. Employee Incentives Sheet Template',
      category: isAr ? 'شيت حوافز فردية' : 'Advisor Incentives',
      description: isAr
        ? 'شيت الحوافز الفردية: كود الموظف، الاسم، بونص تحقيق الهدف، حوافز الموبايلات، حوافز الإكسسوار، حوافز أمان والضمان، وإجمالي الحافز المستحق.'
        : 'Individual incentives per advisor: Job ID, Name, Target Bonus, Mobile Incentive, Accessories, Aman & Warranty, and Total Payout.',
      icon: Coins,
      iconColor: 'text-amber-700 bg-amber-100',
      borderColor: 'border-amber-200 hover:border-amber-400',
      serverExcelUrl: '/api/download/incentives-template',
      serverCsvUrl: '/api/download/incentives-template-csv',
      fallbackExcel: downloadSampleIncentiveTemplate,
      fallbackCsv: downloadSampleIncentivesCsvTemplate,
      rows: SAMPLE_INCENTIVES_DATA,
    },
    {
      id: 'rules-template',
      title: isAr ? '3. لائحة قواعد وعمولات المنتجات (Product Rules)' : '3. Product Incentive Rules Matrix',
      category: isAr ? 'لائحة عمولات الشركة' : 'Corporate Commission Matrix',
      description: isAr
        ? 'لائحة عمولات المنتجات المعتمدة: هواتف Flagship (200 ج.م)، هواتف فئة متوسطة (100 ج.م)، لابتوب (350 ج.م)، تقسيط أمان (250 ج.م)، ضمان راية (150 ج.م).'
        : 'Corporate rules per product: Flagship Phones (200 EGP), Mid-range (100 EGP), Laptops (350 EGP), Aman (250 EGP), Raya Warranty (150 EGP).',
      icon: Layers,
      iconColor: 'text-blue-700 bg-blue-100',
      borderColor: 'border-blue-200 hover:border-blue-400',
      serverExcelUrl: '/api/download/rules-template',
      serverCsvUrl: '/api/download/rules-template-csv',
      fallbackExcel: downloadSampleIncentiveRulesTemplate,
      fallbackCsv: downloadSampleIncentiveRulesCsvTemplate,
      rows: SAMPLE_RULES_DATA,
    },
    {
      id: 'export-current',
      title: isAr ? '4. تصدير بيانات الفرع الحالية بالكامل (Full Export)' : '4. Full Audited Branch Data Export',
      category: isAr ? `سجلات شهر أكتوبر (${records.length} سجل)` : `October Records (${records.length} records)`,
      description: isAr
        ? 'تصدير شامل لجميع بيانات ومحققات فرع راية كونكورد بلازا المحسوبة والمدققة حسابياً مع نسب الإنجاز والفارق والحوافز المستحقة.'
        : 'Complete export of all audited sales records with before/after 14% VAT, achievement percentages, variance, and earned incentives.',
      icon: FileDown,
      iconColor: 'text-teal-700 bg-teal-100',
      borderColor: 'border-teal-200 hover:border-teal-400',
      serverExcelUrl: '/api/download/export-excel',
      serverCsvUrl: '/api/download/export-csv',
      fallbackExcel: () => exportRecordsToExcel(records, undefined, language),
      fallbackCsv: () => exportRecordsToCsv(records, undefined, language),
      rows: records.map((r) => ({
        'الرقم الوظيفي': r.employeeId || '',
        'اسم الموظف': r.employee,
        'اسم الفرع': r.branch,
        'التارجت المطلوب': r.target,
        'المبيعات قبل الضريبة': r.actualBeforeVat !== undefined ? r.actualBeforeVat : Math.round(r.actual / 1.14),
        'ضريبة القيمة المضافة 14%': r.vatAmount !== undefined ? r.vatAmount : (r.actual - Math.round(r.actual / 1.14)),
        'المبيعات بعد الضريبة': r.actual,
        'محقق الموبايل': r.mobilesActual !== undefined ? r.mobilesActual : Math.round(r.actual * 0.65),
        'محقق الإكسسوار': r.accessoriesActual !== undefined ? r.accessoriesActual : Math.round(r.actual * 0.18),
        'محقق أجهزة أخرى': r.otherActual !== undefined ? r.otherActual : Math.round(r.actual * 0.17),
        'الحافز المستحق': r.earnedIncentive !== undefined ? r.earnedIncentive : 0,
        'نسبة الإنجاز': `${r.achievementRate.toFixed(1)}%`,
      })),
    },
    {
      id: 'pdf-sample-report',
      title: isAr ? '5. نموذج تقرير المبيعات المعتمد بصيغة PDF (PDF Sales Report)' : '5. Certified PDF Sales Performance Report',
      category: isAr ? 'نموذج تقرير رسمي PDF' : 'Certified PDF Document',
      description: isAr
        ? 'نموذج تقرير مبيعات رسمي بصيغة PDF معتمد لفرع راية كونكورد بلازا يتضمن كود الموظف، التارجت، المبيعات قبل الضريبة، ضريبة 14%، ونسب الإنجاز، وهو متوافق 100% مع ميزة الرفع والتحليل المباشر بالذكاء الاصطناعي.'
        : 'Official certified PDF sales report sample for Raya Concorde Plaza Branch with Job IDs, Targets, VAT 14%, and achievement rates.',
      icon: FileText,
      iconColor: 'text-rose-700 bg-rose-100',
      borderColor: 'border-rose-200 hover:border-rose-400',
      serverExcelUrl: '/api/download/sales-template',
      serverCsvUrl: '/api/download/sales-template-csv',
      fallbackExcel: downloadSampleSalesPdfTemplate,
      fallbackCsv: downloadSampleSalesCsvTemplate,
      customDownloadText: isAr ? 'تحميل نموذج تقرير PDF' : 'Download Sample PDF',
      rows: SAMPLE_SALES_DATA,
    },
    {
      id: 'txt-sales-template',
      title: isAr ? '6. نموذج المبيعات النصي بنظام الفواصل (Delimited TXT)' : '6. Delimited Text Sales Template (TXT)',
      category: isAr ? 'ملف نصوص وفواصل' : 'Delimited Plain Text',
      description: isAr
        ? 'نموذج بيانات مبيعات نصي خفيف (.txt) بنظام الفواصل المجدولة (Tab / Pipe / Comma) لفرع راية كونكورد بلازا، مناسب للأنظمة القديمة أو التصدير السريع.'
        : 'Lightweight delimited text sales file (.txt) with Tab/Pipe/Comma separation for quick imports.',
      icon: FileText,
      iconColor: 'text-blue-700 bg-blue-100',
      borderColor: 'border-blue-200 hover:border-blue-400',
      serverExcelUrl: '/api/download/sales-template-txt',
      serverCsvUrl: '/api/download/sales-template-csv',
      fallbackExcel: () => downloadSampleSalesTxtTemplate(),
      fallbackCsv: downloadSampleSalesCsvTemplate,
      customDownloadText: isAr ? 'تحميل ملف TXT بالفواصل' : 'Download Sample TXT',
      rows: SAMPLE_SALES_DATA,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden my-auto">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-950 via-slate-900 to-blue-950 text-white flex items-center justify-between border-b border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 flex items-center justify-center shadow-xs shrink-0">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                  {isAr ? 'فرع راية كونكورد بلازا - التجمع الخامس' : 'Raya Concorde Plaza Branch'}
                </span>
                <span className="text-[11px] font-semibold text-amber-300">
                  {isAr ? 'روابط التحميل المباشرة والنسخ الفوري' : 'Direct Downloads & Clipboard Copy'}
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white mt-0.5">
                {isAr ? 'مركز التحميل وتصدير التقارير المعتمدة' : 'Official Downloads & Reports Center'}
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                {isAr
                  ? 'تم تجهيز الروابط بـ 4 طرق مختلفة: تحميل مباشر من الخادم، تحميل ملف Excel، تحميل CSV، أو نسخ البيانات فوراً للصقها في Excel.'
                  : '4-Way access guaranteed: Server HTTP download, direct XLSX, CSV, and instant Copy to Clipboard for Excel.'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer relative z-10"
            title={isAr ? 'إغلاق' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 bg-slate-50/50">
          {/* Executive Notice with 100% Guaranteed Success Guide */}
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1">
              <p className="font-bold text-xs">
                {isAr ? 'حلول التحميل الفورية المعتمدة للإدارة العليا:' : 'Executive Direct Access Options:'}
              </p>
              <div className="text-[11px] text-emerald-800 space-y-0.5">
                <p>
                  • <strong>التحميل المباشر:</strong> يفتح رابطاً مباشراً من الخادم لتنزيل الملف (.xlsx أو .csv).
                </p>
                <p>
                  • <strong>نسخ لـ Excel:</strong> يقوم بنسخ كافة الأعمدة والصفوف إلى الحافظة؛ يمكنك فتح Excel والضغط على <code>Ctrl+V</code> للصق الجدول كاملاً فوراً.
                </p>
                <p>
                  • <strong>معاينة الجدول:</strong> اضغط على زر المعاينة لعرض الجدول داخل المنظومة فوراً.
                </p>
              </div>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {downloadCards.map((card) => {
              const IconComp = card.icon;
              const isCopied = copiedId === card.id;
              const isPreviewOpen = previewId === card.id;

              return (
                <div
                  key={card.id}
                  className={`bg-white rounded-2xl border p-4 sm:p-5 transition-all shadow-xs flex flex-col justify-between ${card.borderColor}`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${card.iconColor}`}>
                          <IconComp className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            {card.category}
                          </span>
                          <h4 className="text-sm font-bold text-slate-900 leading-tight">
                            {card.title}
                          </h4>
                        </div>
                      </div>

                      {isCopied && (
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0 animate-in fade-in">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{isAr ? 'تم النسخ!' : 'Copied!'}</span>
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {card.description}
                    </p>
                  </div>

                  {/* Multi-tier Action Buttons */}
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                    <div className="flex items-center gap-2">
                      {/* Direct Robust Excel Download Button */}
                      <button
                        type="button"
                        onClick={() => card.fallbackExcel()}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 transition-colors shadow-sm cursor-pointer text-center"
                      >
                        <Download className="w-4 h-4" />
                        <span>{card.customDownloadText || (isAr ? 'تحميل Excel (.xlsx)' : 'Download Excel')}</span>
                      </button>

                      {/* Direct CSV Download Button */}
                      <button
                        type="button"
                        onClick={() => card.fallbackCsv()}
                        className="inline-flex items-center justify-center gap-1 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-colors shadow-2xs cursor-pointer"
                        title={isAr ? 'تحميل بصيغة CSV' : 'Download CSV'}
                      >
                        <FileText className="w-3.5 h-3.5 text-blue-600" />
                        <span>CSV</span>
                      </button>

                      {/* Copy to Clipboard Button (100% Fail-Proof) */}
                      <button
                        type="button"
                        onClick={() => handleCopyRows(card.id, card.rows as Record<string, unknown>[])}
                        className={`inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold border transition-colors shadow-2xs cursor-pointer ${
                          isCopied
                            ? 'bg-emerald-100 text-emerald-950 border-emerald-400 font-black'
                            : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border-amber-300 font-bold'
                        }`}
                        title={isAr ? 'نسخ كافة الأعمدة والصفوف للصقها مباشرة في Excel (Ctrl+V)' : 'Copy to Clipboard for Excel'}
                      >
                        <Copy className="w-3.5 h-3.5 text-amber-700" />
                        <span>{isCopied ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ لـ Excel' : 'Copy')}</span>
                      </button>
                    </div>

                    {/* Preview Table Toggle */}
                    <button
                      type="button"
                      onClick={() => setPreviewId(isPreviewOpen ? null : card.id)}
                      className="w-full text-[11px] font-semibold text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1 pt-1"
                    >
                      <Table className="w-3 h-3 text-slate-400" />
                      <span>{isPreviewOpen ? (isAr ? 'إخفاء المعاينة' : 'Hide Preview') : (isAr ? 'معاينة أعمدة وبيانات الشيت' : 'Preview Sheet Data')}</span>
                      {isPreviewOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>

                    {/* In-App Table Preview */}
                    {isPreviewOpen && (
                      <div className="mt-2 p-2 bg-slate-50 rounded-xl border border-slate-200 overflow-x-auto text-[11px]">
                        <table className="w-full border-collapse text-right">
                          <thead>
                            <tr className="border-b border-slate-200 text-slate-600 font-bold">
                              {Object.keys(card.rows[0] || {}).map((col) => (
                                <th key={col} className="p-1.5 whitespace-nowrap bg-slate-100/70">
                                  {col}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {card.rows.slice(0, 3).map((r, i) => (
                              <tr key={i} className="border-b border-slate-100">
                                {Object.values(r).map((val, vi) => (
                                  <td key={vi} className="p-1.5 whitespace-nowrap text-slate-700 font-mono">
                                    {String(val)}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 5. Special Executive PDF Card */}
          <div className="bg-gradient-to-r from-purple-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 border border-purple-500/30 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-400/30 flex items-center justify-center shrink-0 mt-0.5">
                <FileText className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white">
                    {isAr ? 'التقرير التنفيذي المطبوع للإدارة (Executive Boardroom PDF)' : 'Official Executive Boardroom PDF Report'}
                  </h4>
                  <span className="text-[10px] font-bold text-purple-300 bg-purple-950/80 px-2 py-0.5 rounded-full border border-purple-500/30">
                    A4 Official Format
                  </span>
                </div>
                <p className="text-xs text-purple-200/90 leading-relaxed max-w-xl">
                  {isAr
                    ? 'تقرير رسمي منسق يتضمن توقيع مدير الفرع هاني حنا، الإشراف الإقليمي، والاعتماد المالي وجاهز للعرض والطباعة المباشرة.'
                    : 'Formal sealed report with branch manager signature, regional retail oversight, and advisor sales breakdown.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenMonthlyReport();
              }}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white text-xs font-bold transition-all shadow-md shrink-0 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>{isAr ? 'فتح وتحميل تقرير PDF' : 'Open & Download PDF'}</span>
              <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-600" />
            <span>
              {isAr
                ? 'راية للتوزيع والتجارة · قطاع التجزئة · فرع كونكورد بلازا (التجمع الخامس)'
                : 'Raya Distribution & Trade · Retail Sector · Concorde Plaza Branch'}
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            {isAr ? 'إغلاق النافذة' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
