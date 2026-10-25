import React, { useState, useRef } from 'react';
import {
  X,
  FileSpreadsheet,
  Upload,
  Download,
  Plus,
  Trash2,
  CheckCircle2,
  Coins,
  ShieldAlert,
  ArrowRight,
  Info,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { ProductIncentiveRule, Currency, Language } from '../types/sales';
import { formatCurrencyNumber } from '../utils/calculations';
import { translations } from '../utils/i18n';
import { parseArabicOrWesternNumber, downloadWorkbookSafely } from '../utils/excelParser';

interface IncentivesModalProps {
  isOpen: boolean;
  onClose: () => void;
  rules: ProductIncentiveRule[];
  onUpdateRules: (rules: ProductIncentiveRule[]) => void;
  currency: Currency;
  language: Language;
}

export const IncentivesModal: React.FC<IncentivesModalProps> = ({
  isOpen,
  onClose,
  rules,
  onUpdateRules,
  currency,
  language,
}) => {
  const t = translations[language];
  const [localRules, setLocalRules] = useState<ProductIncentiveRule[]>(rules);
  const [newCategory, setNewCategory] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newMinQty, setNewMinQty] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim() || !newAmount) return;

    const amount = parseArabicOrWesternNumber(newAmount);
    if (amount <= 0) return;

    const newRule: ProductIncentiveRule = {
      id: `rule-${Date.now().toString(36)}`,
      productCategory: newCategory.trim(),
      incentiveAmount: amount,
      incentiveType: 'fixed',
      minTargetQty: newMinQty ? parseArabicOrWesternNumber(newMinQty) : undefined,
    };

    const updated = [...localRules, newRule];
    setLocalRules(updated);
    onUpdateRules(updated);
    setNewCategory('');
    setNewAmount('');
    setNewMinQty('');
    setSuccessMessage(language === 'ar' ? 'تمت إضافة بند الحافز بنجاح.' : 'Incentive item added.');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleDeleteRule = (id: string) => {
    const updated = localRules.filter((r) => r.id !== id);
    setLocalRules(updated);
    onUpdateRules(updated);
  };

  // Download Sample Incentives Template
  const handleDownloadIncentivesTemplate = () => {
    const sampleRows = [
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

    const worksheet = XLSX.utils.json_to_sheet(sampleRows);
    worksheet['!cols'] = [{ wch: 35 }, { wch: 18 }, { wch: 22 }, { wch: 18 }, { wch: 30 }];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'شيت_حوافز_راية');
    downloadWorkbookSafely(workbook, 'شيت_حوافز_منتجات_راية_المعتمد.xlsx', sampleRows);
  };

  // Upload custom incentives Excel file
  const handleUploadIncentivesFile = async (file: File) => {
    setIsUploading(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: '' });

      if (jsonData.length > 0) {
        const parsedRules: ProductIncentiveRule[] = [];
        jsonData.forEach((row, idx) => {
          // Detect columns
          const keys = Object.keys(row);
          const catKey = keys.find((k) => k.includes('منتج') || k.includes('فئة') || k.toLowerCase().includes('product')) || keys[0];
          const amtKey = keys.find((k) => k.includes('حافز') || k.includes('قيمة') || k.toLowerCase().includes('incentive') || k.toLowerCase().includes('amount')) || keys[1];
          const minKey = keys.find((k) => k.includes('أدنى') || k.toLowerCase().includes('min'));

          const category = String(row[catKey] || '').trim();
          const amount = parseArabicOrWesternNumber(row[amtKey]);
          const minQty = minKey ? parseArabicOrWesternNumber(row[minKey]) : undefined;

          if (category && amount > 0) {
            parsedRules.push({
              id: `imported-rule-${idx}-${Date.now().toString(36)}`,
              productCategory: category,
              incentiveAmount: amount,
              incentiveType: 'fixed',
              minTargetQty: minQty,
            });
          }
        });

        if (parsedRules.length > 0) {
          setLocalRules(parsedRules);
          onUpdateRules(parsedRules);
          setSuccessMessage(
            language === 'ar'
              ? `تم تحميل ${parsedRules.length} بنود حوافز جديدة بنجاح وتطبيقها على المبيعات.`
              : `Imported ${parsedRules.length} incentive rules.`
          );
        }
      }
    } catch {
      alert(language === 'ar' ? 'فشل قراءة شيت الحوافز، يرجى التأكد من التنسيق.' : 'Failed to parse file.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {t.incentivesTitle}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {t.incentivesSubtitle}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs text-emerald-800 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Quick Actions: Download Sample & Upload Sheet */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/40 flex items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-slate-900">
                  {language === 'ar' ? 'رفع شيت حوافز رسمي جديد' : 'Upload Corporate Incentives'}
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {language === 'ar' ? 'استيراد أسعار الحوافز من ملف Excel' : 'Import incentive sheet from Excel'}
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleUploadIncentivesFile(e.target.files[0]);
                  }
                }}
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shrink-0 shadow-2xs"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'رفع الشيت' : 'Upload'}</span>
              </button>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-slate-900">
                  {t.downloadIncentivesSample}
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {language === 'ar' ? 'نموذج جاهز يحتوي على بنود حوافز راية' : 'Sample template with Raya items'}
                </p>
              </div>

              <button
                type="button"
                onClick={handleDownloadIncentivesTemplate}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors shrink-0"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>{language === 'ar' ? 'تحميل' : 'Download'}</span>
              </button>
            </div>
          </div>

          {/* Add custom rule form */}
          <form onSubmit={handleAddRule} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <span className="text-xs font-bold text-slate-800 block">
              {language === 'ar' ? 'إضافة بند حافز جديد يدوياً:' : 'Add New Incentive Item:'}
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              <div className="sm:col-span-2">
                <input
                  type="text"
                  required
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder={language === 'ar' ? 'اسم المنتج أو الخدمة (مثال: أجهزة تابلت)' : 'Product / Category Name'}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <input
                  type="text"
                  required
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  placeholder={language === 'ar' ? 'قيمة الحافز (ج.م)' : 'Incentive (EGP)'}
                  className="w-full px-3 py-1.5 text-xs font-mono tabular-nums bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-left"
                />
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{language === 'ar' ? 'إضافة البند' : 'Add Item'}</span>
                </button>
              </div>
            </div>
          </form>

          {/* Current Incentive Rules Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-900">
                {language === 'ar' ? 'بنود الحوافز المعتمدة حالياً بالفرع:' : 'Active Branch Incentive Items:'}
              </span>
              <span className="text-[11px] text-slate-500 font-mono tabular-nums">
                {localRules.length} {language === 'ar' ? 'منتجات وخدمات' : 'items'}
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className={`w-full text-xs ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                  <tr>
                    <th className="py-2.5 px-3.5">{t.productCategory}</th>
                    <th className="py-2.5 px-3.5">{t.unitIncentive}</th>
                    <th className="py-2.5 px-3.5">{language === 'ar' ? 'الوصف' : 'Description'}</th>
                    <th className="py-2.5 px-3.5 text-center w-14">{language === 'ar' ? 'حذف' : 'Delete'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {localRules.map((rule) => (
                    <tr key={rule.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-3.5 font-bold text-slate-900">
                        {rule.productCategory}
                      </td>
                      <td className="py-2.5 px-3.5 font-mono tabular-nums font-bold text-emerald-700">
                        {formatCurrencyNumber(rule.incentiveAmount, currency, true, language)}
                      </td>
                      <td className="py-2.5 px-3.5 text-slate-500 text-[11px]">
                        {rule.description || (language === 'ar' ? 'حافز نقدي مباشر لكل وحدة مباعة' : 'Direct cash incentive per unit')}
                      </td>
                      <td className="py-2.5 px-3.5 text-center">
                        <button
                          onClick={() => handleDeleteRule(rule.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                          title="حذف هذا البند"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              {language === 'ar'
                ? 'يتم تطبيق الحوافز تلقائياً على سجلات المبيعات لكل مستشار مبيعات بالفرع.'
                : 'Incentives are automatically applied to rep sales.'}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-2xs"
          >
            {language === 'ar' ? 'تم، إغلاق الشيت' : 'Done & Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
