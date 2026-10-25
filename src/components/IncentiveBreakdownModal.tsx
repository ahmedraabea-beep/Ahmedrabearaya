import React from 'react';
import { X, Award, CheckCircle2, Coins, ArrowRight, ShieldCheck } from 'lucide-react';
import { SalesRecord, Currency, Language } from '../types/sales';
import { formatCurrencyNumber } from '../utils/calculations';
import { translations } from '../utils/i18n';

interface IncentiveBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: SalesRecord | null;
  currency: Currency;
  language: Language;
}

export const IncentiveBreakdownModal: React.FC<IncentiveBreakdownModalProps> = ({
  isOpen,
  onClose,
  record,
  currency,
  language,
}) => {
  const t = translations[language];

  if (!isOpen || !record) return null;

  const items = record.incentiveItems || [
    {
      productCategory: language === 'ar' ? 'عمولة المبيعات الأساسية' : 'Base Sales Commission',
      quantitySold: 1,
      unitIncentive: Math.round(record.actual * 0.02),
      totalEarned: Math.round(record.actual * 0.02),
    },
  ];

  const totalItemsEarned = items.reduce((sum, item) => sum + item.totalEarned, 0);
  const excess = record.isAchieved ? Math.round(record.difference * 0.02) : 0;
  const grandTotal = record.earnedIncentive || (totalItemsEarned + excess);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                {t.incentiveBreakdownTitle}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {record.employee} {record.employeeId ? `(${t.jobId}: ${record.employeeId})` : ''} · {record.period || 'مارس 2026'}
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
        <div className="p-5 space-y-4 overflow-y-auto max-h-[70vh]">
          {/* Summary Banner */}
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-emerald-900 block">
                {t.totalIncentivePayable}
              </span>
              <span className="text-2xl font-bold font-mono tabular-nums text-emerald-800">
                {formatCurrencyNumber(grandTotal, currency, true, language)}
              </span>
            </div>

            <div className="text-left text-xs">
              <span className="text-slate-500 block">{t.colActual}:</span>
              <span className="font-mono tabular-nums font-bold text-slate-800">
                {formatCurrencyNumber(record.actual, currency, true, language)}
              </span>
            </div>
          </div>

          {/* Product Items Breakdown */}
          <div>
            <span className="text-xs font-bold text-slate-800 mb-2 block">
              {t.productIncentivesSum}:
            </span>

            <div className="space-y-2">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg border border-slate-200/90 bg-white hover:bg-slate-50 transition-colors flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-900 block">{item.productCategory}</span>
                    <span className="text-[11px] text-slate-500 font-mono tabular-nums">
                      {item.quantitySold} {language === 'ar' ? 'وحدة مباعة' : 'units'} × {formatCurrencyNumber(item.unitIncentive, currency, true, language)}
                    </span>
                  </div>

                  <span className="font-mono tabular-nums font-bold text-slate-900 text-sm">
                    {formatCurrencyNumber(item.totalEarned, currency, true, language)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Target Bonus Component */}
          {excess > 0 && (
            <div className="p-3 rounded-lg border border-purple-200 bg-purple-50/50 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-purple-900 block">{t.baseTargetCommission}</span>
                <span className="text-[11px] text-purple-700 font-mono tabular-nums">
                  2% {language === 'ar' ? 'على فائض المبيعات' : 'on surplus sales'} (+{formatCurrencyNumber(record.difference, currency, true, language)})
                </span>
              </div>

              <span className="font-mono tabular-nums font-bold text-purple-900 text-sm">
                +{formatCurrencyNumber(excess, currency, true, language)}
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/80 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
          >
            {language === 'ar' ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
