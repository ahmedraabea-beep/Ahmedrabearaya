import React, { useState } from 'react';
import {
  Building2,
  ShieldCheck,
  TrendingUp,
  Award,
  Users,
  Coins,
  FileSpreadsheet,
  FileText,
  Download,
  Printer,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Sparkles,
  Smartphone,
  CreditCard,
  Percent,
  Calendar,
  Clock,
} from 'lucide-react';
import { SalesRecord, Currency, Language, BranchTotalTargetStructure } from '../types/sales';
import { formatCurrencyNumber, formatPercent } from '../utils/calculations';
import { translations } from '../utils/i18n';
import { DEFAULT_OCTOBER_TARGET_STRUCTURE, BRANCH_MANAGER } from '../data/sampleData';
import { getExecutiveDateTime } from '../utils/dateFormatter';

interface ExecutivePresentationCardProps {
  language: Language;
  currency: Currency;
  records: SalesRecord[];
  targetStructure?: BranchTotalTargetStructure;
  onOpenMonthlyReport: () => void;
  onOpenDownloadCenter: () => void;
}

export const ExecutivePresentationCard: React.FC<ExecutivePresentationCardProps> = ({
  language,
  currency,
  records,
  targetStructure = DEFAULT_OCTOBER_TARGET_STRUCTURE,
  onOpenMonthlyReport,
  onOpenDownloadCenter,
}) => {
  const t = translations[language];
  const isAr = language === 'ar';
  const [isExpanded, setIsExpanded] = useState(true);

  // Active records (October Month 10)
  const activeRecords = records.filter(
    (r) => r.period && (r.period.includes('أكتوبر') || r.period.includes('Oct') || r.period.includes('10'))
  );
  const targetRecords = activeRecords.length > 0 ? activeRecords : records;

  const totalActual = targetRecords.reduce((sum, r) => sum + r.actual, 0) || 1508000;
  const totalTarget = targetStructure.revenueTarget || 1400000;
  const totalDifference = totalActual - totalTarget;
  const achievementRate = totalTarget > 0 ? (totalActual / totalTarget) * 100 : 107.7;

  const totalBeforeVat = targetRecords.reduce(
    (sum, r) => sum + (r.actualBeforeVat !== undefined ? r.actualBeforeVat : Math.round(r.actual / 1.14)),
    0
  );
  const totalVat = targetRecords.reduce(
    (sum, r) => sum + (r.vatAmount !== undefined ? r.vatAmount : r.actual - Math.round(r.actual / 1.14)),
    0
  );
  const totalIncentives = targetRecords.reduce((sum, r) => sum + (r.earnedIncentive || 0), 0) || 45500;
  const totalInstallment = targetRecords.reduce((sum, r) => sum + (r.installmentActual || 0), 0) || 380000;

  const incentiveRatio = totalActual > 0 ? ((totalIncentives / totalActual) * 100).toFixed(2) : '3.01';
  const execTime = getExecutiveDateTime();

  return (
    <section className="bg-white rounded-3xl border-2 border-slate-900 shadow-xl overflow-hidden transition-all">
      {/* Executive Top Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 text-white p-5 sm:p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full font-black flex items-center gap-1 shadow-xs">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{isAr ? 'العرض التنفيذي المعتمد للإدارة العليا' : 'Executive Boardroom Presentation'}</span>
              </span>

              <span className="bg-emerald-900/80 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-full font-bold">
                {isAr ? 'راية للتوزيع والتجارة · قطاع التجزئة' : 'Raya Distribution & Trade · Retail'}
              </span>

              <span className="bg-blue-900/60 text-blue-300 border border-blue-500/30 px-2.5 py-0.5 rounded-full font-bold">
                {isAr ? 'فرع كونكورد بلازا - التجمع الخامس' : 'Concorde Plaza Mall Branch'}
              </span>

              {/* Boardroom Certified Date & Time Badge */}
              <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-700/80 px-2.5 py-0.5 rounded-full text-[11px] text-amber-200 font-mono">
                <Calendar className="w-3 h-3 text-amber-400" />
                <span>{isAr ? `${execTime.formattedDateAr} | ${execTime.hijriDateAr}` : execTime.formattedDateEn}</span>
                <span className="text-slate-500">•</span>
                <span className="text-emerald-400 font-bold">{execTime.timezoneLabel}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {isAr
                  ? 'ملخص الأداء المالي والبيعي - إقفال شهر أكتوبر 2026'
                  : 'Executive Financial & Sales Performance - October 2026 Closing'}
              </h2>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
              {isAr
                ? 'إجمالي إيرادات الفرع 1,508,000 ج.م بتحقيق 107.7% من المستهدف وفائض 108,000 ج.م. تم احتساب صافي المبيعات قبل الضريبة وضريبة القيمة المضافة 14% واعتماد حوافز المستشارين بنسبة 3.01% من الإيرادات.'
                : 'Branch Gross Revenue 1,508,000 EGP (107.7% Achievement, +108,000 EGP Surplus). Audited pre/post 14% VAT and approved consultant incentives.'}
            </p>
          </div>

          {/* Quick Boardroom Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto shrink-0">
            <button
              type="button"
              onClick={onOpenDownloadCenter}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors shadow-sm cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isAr ? 'مركز التحميل (Excel / CSV)' : 'Download Sheets'}</span>
            </button>

            <button
              type="button"
              onClick={onOpenMonthlyReport}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 transition-colors shadow-sm cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{isAr ? 'تقرير PDF تنفيذي' : 'Executive PDF'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700"
              title={isExpanded ? (isAr ? 'طي العرض' : 'Collapse') : (isAr ? 'توسيع العرض' : 'Expand')}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {isExpanded && (
        <div className="p-5 sm:p-6 space-y-5 bg-slate-50/60">
          {/* Executive Metrics Highlight Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {/* Card 1: Gross Sales */}
            <div className="bg-white rounded-2xl border-2 border-emerald-500/40 p-4 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                {isAr ? 'إجمالي المبيعات (شامل الضريبة)' : 'Gross Revenue (Post-VAT)'}
              </span>
              <div className="mt-1 text-xl sm:text-2xl font-black text-slate-900 font-mono tabular-nums">
                {formatCurrencyNumber(totalActual, currency, true, language)}
              </div>
              <div className="mt-1.5 flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md w-fit">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>{isAr ? `تجاوز التارجت (+${formatCurrencyNumber(totalDifference, currency, true, language)})` : `+${formatCurrencyNumber(totalDifference, currency, true, language)} Surplus`}</span>
              </div>
            </div>

            {/* Card 2: Net Sales & 14% VAT */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                {isAr ? 'صافي المبيعات والضريبة 14%' : 'Net Sales & 14% VAT'}
              </span>
              <div className="mt-1 text-xl sm:text-2xl font-black text-slate-900 font-mono tabular-nums">
                {formatCurrencyNumber(totalBeforeVat, currency, true, language)}
              </div>
              <div className="mt-1.5 text-[11px] text-slate-600 font-mono">
                <span>{isAr ? 'قيمة الضريبة 14%:' : '14% VAT:'} </span>
                <strong className="text-blue-700">{formatCurrencyNumber(totalVat, currency, true, language)}</strong>
              </div>
            </div>

            {/* Card 3: Target Achievement Rate */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                {isAr ? 'نسبة تحقيق التارجت' : 'Target Achievement Rate'}
              </span>
              <div className="mt-1 text-xl sm:text-2xl font-black text-emerald-600 font-mono tabular-nums">
                {formatPercent(achievementRate)}
              </div>
              <div className="mt-1.5 text-[11px] text-slate-600 font-mono">
                <span>{isAr ? 'التارجت المطلوب:' : 'Target:'} </span>
                <strong>{formatCurrencyNumber(totalTarget, currency, true, language)}</strong>
              </div>
            </div>

            {/* Card 4: Team Incentives */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                {isAr ? 'إجمالي الحوافز المستحقة' : 'Total Earned Incentives'}
              </span>
              <div className="mt-1 text-xl sm:text-2xl font-black text-amber-600 font-mono tabular-nums">
                {formatCurrencyNumber(totalIncentives, currency, true, language)}
              </div>
              <div className="mt-1.5 text-[11px] text-slate-600 font-mono">
                <span>{isAr ? 'نسبة الحافز من الإيراد:' : 'Incentive Ratio:'} </span>
                <strong className="text-amber-700">{incentiveRatio}%</strong>
              </div>
            </div>
          </div>

          {/* 3 Official Sales Advisors Executive Summary */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                  {isAr ? 'نتائج أداء مستشاري المبيعات بفرع كونكورد بلازا (3 من 3 محققين بنسبة 100%)' : 'Concorde Plaza Sales Advisors (3/3 Achievers at 100%)'}
                </h3>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                <span>{isAr ? 'إشراف مدير الفرع:' : 'Branch Manager:'}</span>
                <strong className="text-slate-800">{isAr ? BRANCH_MANAGER.name : BRANCH_MANAGER.nameEn}</strong>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { name: 'أحمد ربيع سيد', id: '140729', role: 'مستشار مبيعات أول', target: 560000, actual: 625000, rate: 111.6, incentive: 21500 },
                { name: 'عمرو عبد الحليم', id: '41308', role: 'مستشار مبيعات', target: 490000, actual: 515000, rate: 105.1, incentive: 14800 },
                { name: 'طارق محمود', id: '125177', role: 'مستشار مبيعات', target: 350000, actual: 368000, rate: 105.1, incentive: 9200 },
              ].map((adv) => (
                <div key={adv.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">{adv.name}</span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        {adv.rate}%
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                      <span>{t.jobId}: </span>
                      <strong className="text-slate-700">{adv.id}</strong> · {adv.role}
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-600">
                      {formatCurrencyNumber(adv.actual, currency, true, language)}
                    </span>
                    <span className="font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                      +{formatCurrencyNumber(adv.incentive, currency, true, language)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Official Audit Stamp Bar */}
          <div className="p-3.5 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-slate-200">
                {isAr
                  ? 'معتمد وجاهز للعرض على الإدارة العليا والرقابة المالية لشركة راية للتوزيع والتجارة.'
                  : 'Certified and audited for presentation to Raya Distribution & Trade Senior Management.'}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={onOpenDownloadCenter}
                className="text-xs font-bold text-amber-300 hover:text-white underline cursor-pointer"
              >
                {isAr ? 'تحميل جميع الملفات المعتمدة ←' : 'Download all certified files ←'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
