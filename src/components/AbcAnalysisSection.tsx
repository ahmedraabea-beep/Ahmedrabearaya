import React, { useState, useMemo } from 'react';
import {
  Layers,
  Users,
  Smartphone,
  TrendingUp,
  Award,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Download,
  Filter,
  BarChart3,
  ShieldCheck,
  Zap,
  Target,
  Sparkles,
} from 'lucide-react';
import { SalesRecord, Currency, Language, BranchTotalTargetStructure } from '../types/sales';
import { formatCurrencyNumber, formatPercent } from '../utils/calculations';

interface AbcAnalysisSectionProps {
  records: SalesRecord[];
  currency: Currency;
  language: Language;
  targetStructure?: BranchTotalTargetStructure;
  inReportModal?: boolean;
}

export interface AbcItem {
  id: string;
  name: string;
  subTitle?: string;
  salesValue: number;
  percentageOfTotal: number;
  cumulativePercentage: number;
  grade: 'A' | 'B' | 'C';
  targetValue?: number;
  achievementRate?: number;
}

export const AbcAnalysisSection: React.FC<AbcAnalysisSectionProps> = ({
  records,
  currency,
  language,
  targetStructure,
  inReportModal = false,
}) => {
  const isAr = language === 'ar';
  const [analysisMode, setAnalysisMode] = useState<'employees' | 'categories'>('employees');
  const [filterGrade, setFilterGrade] = useState<'all' | 'A' | 'B' | 'C'>('all');

  // Total branch actual
  const totalBranchActual = useMemo(() => {
    return records.reduce((sum, r) => sum + (r.actualAfterVat || r.actual || 0), 0) || 1;
  }, [records]);

  // 1. Employee ABC Classification
  const employeeAbcItems = useMemo(() => {
    // Sort descending by actual sales
    const sorted = [...records].sort(
      (a, b) => (b.actualAfterVat || b.actual || 0) - (a.actualAfterVat || a.actual || 0)
    );

    let cumulative = 0;
    return sorted.map((r, index) => {
      const sales = r.actualAfterVat || r.actual || 0;
      const pct = (sales / totalBranchActual) * 100;
      cumulative += pct;

      // Pareto principle thresholds:
      // Grade A: up to ~70% cumulative
      // Grade B: 70% to 90%
      // Grade C: remainder 90% to 100%
      let grade: 'A' | 'B' | 'C' = 'C';
      if (cumulative <= 72 || index === 0) {
        grade = 'A';
      } else if (cumulative <= 92 || index === 1) {
        grade = 'B';
      } else {
        grade = 'C';
      }

      return {
        id: r.id,
        name: r.employee,
        subTitle: r.employeeId ? `#${r.employeeId}` : (isAr ? 'مستشار مبيعات' : 'Sales Advisor'),
        salesValue: sales,
        percentageOfTotal: pct,
        cumulativePercentage: Math.min(100, cumulative),
        grade,
        targetValue: r.target,
        achievementRate: r.achievementRate,
      } as AbcItem;
    });
  }, [records, totalBranchActual, isAr]);

  // 2. Categories & Items ABC Classification
  const categoryAbcItems = useMemo(() => {
    const mobileActual = records.reduce((sum, r) => sum + (r.mobilesActual || Math.round(r.actual * 0.65)), 0);
    const accActual = records.reduce((sum, r) => sum + (r.accessoriesActual || Math.round(r.actual * 0.18)), 0);
    const otherActual = records.reduce((sum, r) => sum + (r.otherActual || Math.round(r.actual * 0.17)), 0);
    const instActual =
      records.reduce((sum, r) => sum + (r.installmentActual || 0), 0) ||
      targetStructure?.installmentActual ||
      380000;

    const items = [
      {
        id: 'cat_mobiles',
        name: isAr ? 'الهواتف الذكية والفلاج شيب (Smartphones)' : 'Smartphones & Flagships',
        subTitle: isAr ? 'سامسونج، أوبو، ريلمي، شاومي، أبل' : 'Samsung, Oppo, Realme, Xiaomi, Apple',
        salesValue: mobileActual,
        targetValue: targetStructure?.revenueBreakdown?.mobiles || 910000,
      },
      {
        id: 'cat_accessories',
        name: isAr ? 'الإكسسوارات والسماعات (Accessories)' : 'Accessories & Audio',
        subTitle: isAr ? 'سماعات، شواحن، كابلات، ساعات ذكية، كفرات' : 'Headphones, Chargers, Smartwatches',
        salesValue: accActual,
        targetValue: targetStructure?.revenueBreakdown?.accessories || 252000,
      },
      {
        id: 'cat_other',
        name: isAr ? 'الشاشات والأجهزة الإلكترونية (TVs & Screens)' : 'TVs & Consumer Electronics',
        subTitle: isAr ? 'شاشات تلفزيون ذكية وأجهزة منزلية' : 'Smart TVs and Small Appliances',
        salesValue: otherActual,
        targetValue: targetStructure?.revenueBreakdown?.other || 238000,
      },
      {
        id: 'cat_installment',
        name: isAr ? 'تقسيط أمان والخدمات المالية (Aman Installments)' : 'Aman Consumer Finance',
        subTitle: isAr ? 'تسهيلات الشراء بالتقسيط بدون مقدم' : 'Consumer Installment Facilities',
        salesValue: instActual,
        targetValue: targetStructure?.installmentTarget || 350000,
      },
    ];

    const catTotal = items.reduce((sum, item) => sum + item.salesValue, 0) || 1;
    items.sort((a, b) => b.salesValue - a.salesValue);

    let cumulative = 0;
    return items.map((item, index) => {
      const pct = (item.salesValue / catTotal) * 100;
      cumulative += pct;

      let grade: 'A' | 'B' | 'C' = 'C';
      if (cumulative <= 65 || index === 0) {
        grade = 'A';
      } else if (cumulative <= 90 || index <= 2) {
        grade = 'B';
      } else {
        grade = 'C';
      }

      return {
        id: item.id,
        name: item.name,
        subTitle: item.subTitle,
        salesValue: item.salesValue,
        percentageOfTotal: pct,
        cumulativePercentage: Math.min(100, cumulative),
        grade,
        targetValue: item.targetValue,
        achievementRate: item.targetValue > 0 ? (item.salesValue / item.targetValue) * 100 : 0,
      } as AbcItem;
    });
  }, [records, targetStructure, isAr]);

  const currentItems = analysisMode === 'employees' ? employeeAbcItems : categoryAbcItems;

  const filteredItems = useMemo(() => {
    if (filterGrade === 'all') return currentItems;
    return currentItems.filter((i) => i.grade === filterGrade);
  }, [currentItems, filterGrade]);

  // Aggregated totals per grade (A, B, C)
  const gradeSummary = useMemo(() => {
    const summary = {
      A: { count: 0, sales: 0, percent: 0 },
      B: { count: 0, sales: 0, percent: 0 },
      C: { count: 0, sales: 0, percent: 0 },
    };

    const totalSales = currentItems.reduce((sum, i) => sum + i.salesValue, 0) || 1;

    currentItems.forEach((item) => {
      summary[item.grade].count += 1;
      summary[item.grade].sales += item.salesValue;
    });

    summary.A.percent = (summary.A.sales / totalSales) * 100;
    summary.B.percent = (summary.B.sales / totalSales) * 100;
    summary.C.percent = (summary.C.sales / totalSales) * 100;

    return summary;
  }, [currentItems]);

  return (
    <div className={`space-y-4 ${inReportModal ? '' : 'bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs'}`}>
      {/* Header & Mode Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold shadow-xs">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-slate-900">
                {isAr ? 'تحليل ABC للمبيعات (Pareto ABC Analysis)' : 'Sales Pareto ABC Analysis'}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-800 border border-purple-300">
                {isAr ? 'قاعدة 80/20' : '80/20 Rule'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {isAr
                ? 'تصنيف الموظفين والأصناف إلى فئات (A, B, C) بناءً على مساهمتهم في إجمالي المبيعات لتركيز جهود الإدارة'
                : 'Classifies staff and product lines into A, B, C tiers based on sales revenue impact'}
            </p>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              setAnalysisMode('employees');
              setFilterGrade('all');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              analysisMode === 'employees' ? 'bg-white text-purple-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>{isAr ? 'تصنيف الموظفين (Staff)' : 'Staff Classification'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAnalysisMode('categories');
              setFilterGrade('all');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              analysisMode === 'categories' ? 'bg-white text-purple-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>{isAr ? 'تصنيف الأصناف والأقسام' : 'Category / Item Classification'}</span>
          </button>
        </div>
      </div>

      {/* 3 Tier Overview Cards (Category A, B, C) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Tier A */}
        <div
          onClick={() => setFilterGrade(filterGrade === 'A' ? 'all' : 'A')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            filterGrade === 'A'
              ? 'ring-2 ring-emerald-500 bg-emerald-50/70 border-emerald-400'
              : 'bg-emerald-50/40 border-emerald-200 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-extrabold text-emerald-900 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
              {isAr ? 'الفئة (A) - الأكثر تأثيراً' : 'Tier A - Top Impact'}
            </span>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-emerald-200 text-emerald-800">
              {gradeSummary.A.count} {isAr ? (analysisMode === 'employees' ? 'موظفين' : 'أقسام') : 'items'}
            </span>
          </div>
          <div className="text-xl font-black text-emerald-800">
            {formatPercent(gradeSummary.A.percent)}
          </div>
          <div className="text-xs text-emerald-950 font-bold mt-1">
            {formatCurrencyNumber(gradeSummary.A.sales, currency)}
          </div>
          <p className="text-[11px] text-emerald-800 mt-1">
            {isAr ? 'تولد النسبة الأكبر من إيرادات الفرع (أولوية الدعم والتحفيز)' : 'Drives the majority of total branch sales'}
          </p>
        </div>

        {/* Tier B */}
        <div
          onClick={() => setFilterGrade(filterGrade === 'B' ? 'all' : 'B')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            filterGrade === 'B'
              ? 'ring-2 ring-amber-500 bg-amber-50/70 border-amber-400'
              : 'bg-amber-50/40 border-amber-200 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-extrabold text-amber-900 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              {isAr ? 'الفئة (B) - أداء مستقر' : 'Tier B - Steady Performance'}
            </span>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-amber-200 text-amber-800">
              {gradeSummary.B.count} {isAr ? (analysisMode === 'employees' ? 'موظفين' : 'أقسام') : 'items'}
            </span>
          </div>
          <div className="text-xl font-black text-amber-800">
            {formatPercent(gradeSummary.B.percent)}
          </div>
          <div className="text-xs text-amber-950 font-bold mt-1">
            {formatCurrencyNumber(gradeSummary.B.sales, currency)}
          </div>
          <p className="text-[11px] text-amber-800 mt-1">
            {isAr ? 'أداء ثابت وواعد يمكن تطويره وترقيته إلى الفئة A' : 'Steady core volume with high promotion potential'}
          </p>
        </div>

        {/* Tier C */}
        <div
          onClick={() => setFilterGrade(filterGrade === 'C' ? 'all' : 'C')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            filterGrade === 'C'
              ? 'ring-2 ring-purple-500 bg-purple-50/70 border-purple-400'
              : 'bg-purple-50/30 border-purple-200 hover:border-purple-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-extrabold text-purple-900 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              {isAr ? 'الفئة (C) - مساهمة تكميلية' : 'Tier C - Long Tail'}
            </span>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-purple-200 text-purple-800">
              {gradeSummary.C.count} {isAr ? (analysisMode === 'employees' ? 'موظفين' : 'أقسام') : 'items'}
            </span>
          </div>
          <div className="text-xl font-black text-purple-800">
            {formatPercent(gradeSummary.C.percent)}
          </div>
          <div className="text-xs text-purple-950 font-bold mt-1">
            {formatCurrencyNumber(gradeSummary.C.sales, currency)}
          </div>
          <p className="text-[11px] text-purple-800 mt-1">
            {isAr ? 'مساهمة منخفضة تحتاج إلى توجيه تدريبي وإعادة توزيع' : 'Requires training support or product repositioning'}
          </p>
        </div>
      </div>

      {/* Visual Pareto Cumulative Distribution Bar */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
          <span>{isAr ? 'شريط توزيع الإيرادات التراكمي (Pareto Distribution Bar)' : 'Cumulative Pareto Revenue Bar'}</span>
          <span>100% {isAr ? 'إجمالي المبيعات' : 'Total Revenue'}</span>
        </div>
        <div className="w-full h-3 rounded-full overflow-hidden flex bg-slate-200 shadow-inner">
          <div
            className="bg-emerald-500 transition-all duration-500"
            style={{ width: `${gradeSummary.A.percent}%` }}
            title={`الفئة A: ${formatPercent(gradeSummary.A.percent)}`}
          />
          <div
            className="bg-amber-400 transition-all duration-500"
            style={{ width: `${gradeSummary.B.percent}%` }}
            title={`الفئة B: ${formatPercent(gradeSummary.B.percent)}`}
          />
          <div
            className="bg-purple-500 transition-all duration-500"
            style={{ width: `${gradeSummary.C.percent}%` }}
            title={`الفئة C: ${formatPercent(gradeSummary.C.percent)}`}
          />
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
            <span>فئة A: {formatPercent(gradeSummary.A.percent)}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-400" />
            <span>فئة B: {formatPercent(gradeSummary.B.percent)}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-purple-500" />
            <span>فئة C: {formatPercent(gradeSummary.C.percent)}</span>
          </div>
        </div>
      </div>

      {/* ABC Breakdown Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-xs text-right border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
              <th className="py-2.5 px-3 w-14 text-center">{isAr ? 'الفئة' : 'Class'}</th>
              <th className="py-2.5 px-3">{isAr ? (analysisMode === 'employees' ? 'المستشار' : 'القسم / الصنف') : 'Entity'}</th>
              <th className="py-2.5 px-3 text-left font-mono">{isAr ? 'المبيعات الفعلية' : 'Sales'}</th>
              <th className="py-2.5 px-3 text-center">{isAr ? 'النسبة من الإجمالي' : 'Share %'}</th>
              <th className="py-2.5 px-3 text-center">{isAr ? 'النسبة التراكمية' : 'Cumulative %'}</th>
              <th className="py-2.5 px-3 text-center">{isAr ? 'نسبة التحقيق للتارجت' : 'Target Achieved'}</th>
              <th className="py-2.5 px-3">{isAr ? 'التوجيه الإداري المقترح' : 'Directive'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {filteredItems.map((item, idx) => {
              const isGradeA = item.grade === 'A';
              const isGradeB = item.grade === 'B';

              return (
                <tr
                  key={item.id}
                  className={`hover:bg-slate-50 transition-colors ${
                    isGradeA ? 'bg-emerald-50/20' : isGradeB ? 'bg-amber-50/15' : ''
                  }`}
                >
                  {/* Grade Badge */}
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`inline-flex items-center justify-center w-7 h-7 rounded-lg font-black text-xs shadow-2xs ${
                        isGradeA
                          ? 'bg-emerald-600 text-white'
                          : isGradeB
                          ? 'bg-amber-500 text-white'
                          : 'bg-purple-600 text-white'
                      }`}
                    >
                      {item.grade}
                    </span>
                  </td>

                  {/* Name */}
                  <td className="py-2.5 px-3 font-bold text-slate-900">
                    <div className="flex flex-col">
                      <span>{item.name}</span>
                      {item.subTitle && <span className="text-[10px] text-slate-400 font-normal">{item.subTitle}</span>}
                    </div>
                  </td>

                  {/* Sales */}
                  <td className="py-2.5 px-3 text-left font-mono font-bold text-slate-900">
                    {formatCurrencyNumber(item.salesValue, currency)}
                  </td>

                  {/* Share % */}
                  <td className="py-2.5 px-3 text-center font-bold font-mono text-purple-900">
                    {formatPercent(item.percentageOfTotal)}
                  </td>

                  {/* Cumulative % */}
                  <td className="py-2.5 px-3 text-center font-mono">
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="font-extrabold text-slate-800">{item.cumulativePercentage.toFixed(1)}%</span>
                      <div className="w-12 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full ${
                            isGradeA ? 'bg-emerald-500' : isGradeB ? 'bg-amber-500' : 'bg-purple-500'
                          }`}
                          style={{ width: `${item.cumulativePercentage}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Target Achievement */}
                  <td className="py-2.5 px-3 text-center">
                    {item.achievementRate !== undefined ? (
                      <span
                        className={`inline-flex items-center gap-1 font-bold font-mono px-2 py-0.5 rounded-full text-[11px] ${
                          item.achievementRate >= 100
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.achievementRate >= 90
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {formatPercent(item.achievementRate)}
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>

                  {/* Directive */}
                  <td className="py-2.5 px-3 text-[11px] text-slate-600">
                    {isGradeA
                      ? (isAr ? '🌟 ركيزة رئيسية: الحفاظ على الحوافز والتمكين' : 'Key pillar: protect & empower')
                      : isGradeB
                      ? (isAr ? '⚡ أداء واعد: تدريب مكثف على الإكسسوارات والتقسيط للترقية' : 'High potential: upsell training')
                      : (isAr ? '🎯 يحتاج دعم: إعادة توجيه الوردية ومراجعة الأهداف' : 'Needs boost: review shift & coaching')}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Strategic Directive Recommendations for Management */}
      <div className="p-3.5 bg-purple-50/70 border border-purple-200 rounded-xl text-xs space-y-2">
        <div className="flex items-center gap-2 text-purple-950 font-bold">
          <ShieldCheck className="w-4 h-4 text-purple-700" />
          <span>{isAr ? 'التوصيات التنفيذية لمدير الفرع بناءً على تحليل ABC:' : 'Executive Directives for Branch Manager:'}</span>
        </div>
        <ul className="list-disc list-inside space-y-1 text-slate-700 leading-relaxed pr-1">
          <li>
            <strong className="text-emerald-800">{isAr ? 'عناصر الفئة (A):' : 'Class A:'}</strong>{' '}
            {isAr
              ? 'تمثل العمود الفقري لإيرادات فرع كونكورد بلازا. يجب ضمان تواجد مستشاري الفئة A في ساعات الذروة المسائية، وتوفير مخزون كافٍ من هواتف الفلاج شيب الأكثر طلباً.'
              : 'Core drivers of store volume. Ensure top advisors work peak evening shifts with full flagship stock.'}
          </li>
          <li>
            <strong className="text-amber-800">{isAr ? 'عناصر الفئة (B):' : 'Class B:'}</strong>{' '}
            {isAr
              ? 'تعتبر الفرصة الأكبر للنمو السريع. تحفيز مستشاري الفئة B بمكافآت بيع الإكسسوارات وتقسيط أمان يرفع مساهمتهم مباشرة إلى الفئة A.'
              : 'Best growth opportunity. Incentivize attach rates and installment sales to elevate them to Class A.'}
          </li>
          <li>
            <strong className="text-purple-800">{isAr ? 'عناصر الفئة (C):' : 'Class C:'}</strong>{' '}
            {isAr
              ? 'تتطلب جلسات توجيه ودعم فردي مع مدير الفرع لتحليل معوقات البيع ووضع خطة تحسين خلال الـ 14 يوماً القادمة.'
              : 'Requires 1-on-1 coaching sessions with manager to identify sales roadblocks and build recovery plan.'}
          </li>
        </ul>
      </div>
    </div>
  );
};
