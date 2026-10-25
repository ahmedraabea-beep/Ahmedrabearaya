import React, { useState, useEffect } from 'react';
import { X, Check, User, Building, Target, TrendingUp, Calendar, Hash } from 'lucide-react';
import { SalesRecord, Currency, Language } from '../types/sales';
import { parseArabicOrWesternNumber } from '../utils/excelParser';
import { translations } from '../utils/i18n';
import { CONCORD_BRANCH_NAME } from '../data/sampleData';

interface RecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveRecord: (recordData: {
    id?: string;
    employeeId?: string;
    branch: string;
    employee: string;
    target: number;
    actual: number;
    period?: string;
  }) => void;
  recordToEdit: SalesRecord | null;
  existingBranches: string[];
  currency: Currency;
  language: Language;
}

export const RecordModal: React.FC<RecordModalProps> = ({
  isOpen,
  onClose,
  onSaveRecord,
  recordToEdit,
  existingBranches,
  currency,
  language,
}) => {
  const t = translations[language];
  const [branch, setBranch] = useState('');
  const [employee, setEmployee] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [target, setTarget] = useState('');
  const [actual, setActual] = useState('');
  const [period, setPeriod] = useState(language === 'ar' ? 'مارس 2026' : 'March 2026');
  const [error, setError] = useState('');

  useEffect(() => {
    if (recordToEdit) {
      setBranch(recordToEdit.branch);
      setEmployee(recordToEdit.employee);
      setEmployeeId(recordToEdit.employeeId || '');
      setTarget(String(recordToEdit.target));
      setActual(String(recordToEdit.actual));
      setPeriod(recordToEdit.period || (language === 'ar' ? 'مارس 2026' : 'March 2026'));
    } else {
      setBranch(CONCORD_BRANCH_NAME);
      setEmployee('');
      setEmployeeId('');
      setTarget('');
      setActual('');
      setPeriod(language === 'ar' ? 'مارس 2026' : 'March 2026');
    }
    setError('');
  }, [recordToEdit, isOpen, existingBranches, language]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!branch.trim()) {
      setError(language === 'ar' ? 'يرجى كتابة أو اختيار اسم الفرع' : 'Please provide branch name');
      return;
    }
    if (!employee.trim()) {
      setError(language === 'ar' ? 'يرجى كتابة اسم الموظف' : 'Please provide employee name');
      return;
    }

    const numTarget = parseArabicOrWesternNumber(target);
    const numActual = parseArabicOrWesternNumber(actual);

    if (numTarget <= 0) {
      setError(language === 'ar' ? 'يرجى إدخال تارجت مطلوب أكبر من صفر' : 'Target must be greater than zero');
      return;
    }

    onSaveRecord({
      id: recordToEdit?.id,
      employeeId: employeeId.trim() || undefined,
      branch: branch.trim(),
      employee: employee.trim(),
      target: numTarget,
      actual: numActual,
      period: period.trim() || (language === 'ar' ? 'مارس 2026' : 'March 2026'),
    });

    onClose();
  };

  const currencyLabel = language === 'ar' ? (currency === 'EGP' ? 'ج.م' : currency) : currency;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              {recordToEdit ? t.recordModalEditTitle : t.recordModalAddTitle}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
              {error}
            </div>
          )}

          {/* Employee Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t.empNameLabel} <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400`} />
              <input
                type="text"
                required
                value={employee}
                onChange={(e) => setEmployee(e.target.value)}
                placeholder={language === 'ar' ? 'مثال: أحمد ربيع سيد' : 'e.g. Ahmed Rabea Sayed'}
                className={`w-full ${language === 'ar' ? 'pr-9 pl-3' : 'pl-9 pr-3'} py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500`}
              />
            </div>
          </div>

          {/* Job ID (الرقم الوظيفي) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t.jobIdLabel}
            </label>
            <div className="relative">
              <Hash className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400`} />
              <input
                type="text"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder={language === 'ar' ? 'مثال: 140729' : 'e.g. 140729'}
                className={`w-full ${language === 'ar' ? 'pr-9 pl-3' : 'pl-9 pr-3'} py-2 text-xs font-mono tabular-nums bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500`}
              />
            </div>
          </div>

          {/* Branch */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t.branchNameLabel} <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Building className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400`} />
              <input
                type="text"
                required
                list="branch-suggestions"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder={CONCORD_BRANCH_NAME}
                className={`w-full ${language === 'ar' ? 'pr-9 pl-3' : 'pl-9 pr-3'} py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500`}
              />
              <datalist id="branch-suggestions">
                {existingBranches.map((b) => (
                  <option key={b} value={b} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Target & Actual Numbers */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.targetAmountLabel} ({currencyLabel}) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Target className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400`} />
                <input
                  type="text"
                  required
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  placeholder="400000"
                  className={`w-full ${language === 'ar' ? 'pr-9 pl-3 text-left' : 'pl-9 pr-3 text-left'} py-2 text-xs font-mono tabular-nums bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.actualAmountLabel} ({currencyLabel}) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <TrendingUp className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400`} />
                <input
                  type="text"
                  required
                  value={actual}
                  onChange={(e) => setActual(e.target.value)}
                  placeholder="450000"
                  className={`w-full ${language === 'ar' ? 'pr-9 pl-3 text-left' : 'pl-9 pr-3 text-left'} py-2 text-xs font-mono tabular-nums bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500`}
                />
              </div>
            </div>
          </div>

          {/* Period */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              {t.periodLabel}
            </label>
            <div className="relative">
              <Calendar className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400`} />
              <input
                type="text"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                placeholder={language === 'ar' ? 'مارس 2026' : 'March 2026'}
                className={`w-full ${language === 'ar' ? 'pr-9 pl-3' : 'pl-9 pr-3'} py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500`}
              />
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              {t.cancelBtn}
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{recordToEdit ? t.saveChangesBtn : t.addRecordBtn}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
