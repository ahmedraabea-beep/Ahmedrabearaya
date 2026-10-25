import React, { useState, useMemo } from 'react';
import {
  SalesRecord,
  Currency,
  Language,
} from '../types/sales';
import { formatCurrencyNumber, formatPercent } from '../utils/calculations';
import {
  Award,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Target,
  Sparkles,
  Users,
  Search,
  Filter,
  BarChart3,
  Layers,
  ChevronRight,
  ChevronDown,
  ShieldCheck,
  CreditCard,
  Headphones,
  Smartphone,
  Tv,
  GraduationCap,
  Percent,
  Compass,
  ArrowUpRight,
  ArrowDownRight,
  Check,
  HelpCircle,
} from 'lucide-react';

export interface EmployeeEfficiencyScore {
  score: number; // 0 - 100
  tier: 'exceptional' | 'high' | 'moderate' | 'needs_improvement';
  tierLabelAr: string;
  tierColor: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  targetScore: number; // out of 45
  attachScore: number; // out of 25
  balanceScore: number; // out of 15
  installmentScore: number; // out of 15
  strengths: { title: string; desc: string; icon: string }[];
  weaknesses: { title: string; desc: string; icon: string; severity: 'high' | 'medium' | 'low' }[];
  coachingRecommendation: string;
}

/**
 * Calculates a rigorous, multidimensional 100-point Efficiency Index:
 * - 45% Quota Achievement & Variance
 * - 25% Accessories Attach Rate (benchmark 20%)
 * - 15% Category Balance & Diversification
 * - 15% Aman Installment & Consumer Finance Activation
 */
export function calculateEmployeeEfficiency(record: SalesRecord): EmployeeEfficiencyScore {
  const gross = record.actualAfterVat || record.actual;
  const target = record.target || 400000;
  const rate = target > 0 ? (gross / target) * 100 : 0;
  const mob = record.mobilesActual || Math.round(gross * 0.65);
  const acc = record.accessoriesActual || Math.round(gross * 0.18);
  const oth = record.otherActual || Math.round(gross * 0.17);
  const inst = record.installmentActual || 0;
  const totalRev = mob + acc + oth;
  const attachRate = mob > 0 ? (acc / mob) * 100 : 0;
  const surplus = gross - target;

  // Pillar 1: Target Achievement (Max 45 points, bonus up to 50 for top overachievers)
  const targetScore = Math.min(48, Math.round((rate / 100) * 45));

  // Pillar 2: Accessories Attach Rate (Target: 20% attach rate, Max 25 points)
  const attachScore = Math.min(27, Math.round((attachRate / 20) * 25));

  // Pillar 3: Category Balance (Screens & other appliances contribution, Max 15 points)
  const othShare = totalRev > 0 ? (oth / totalRev) * 100 : 0;
  let balanceScore = 0;
  if (othShare >= 15) balanceScore = 15;
  else if (othShare >= 10) balanceScore = 12;
  else if (othShare >= 5) balanceScore = 8;
  else balanceScore = 4;

  // Pillar 4: Installment & Aman Conversion (Max 15 points)
  let installmentScore = 0;
  if (inst >= 120000) installmentScore = 15;
  else if (inst >= 80000) installmentScore = 12;
  else if (inst >= 40000) installmentScore = 8;
  else if (inst > 0) installmentScore = 5;
  else installmentScore = 2;

  const rawScore = targetScore + attachScore + balanceScore + installmentScore;
  const score = Math.min(100, Math.max(10, rawScore));

  // Tiers definition
  let tier: 'exceptional' | 'high' | 'moderate' | 'needs_improvement' = 'moderate';
  let tierLabelAr = 'كفاءة متوازنة';
  let tierColor = 'text-blue-700';
  let badgeBg = 'bg-blue-50';
  let badgeText = 'text-blue-900';
  let badgeBorder = 'border-blue-200';

  if (score >= 90) {
    tier = 'exceptional';
    tierLabelAr = 'كفاءة استثنائية (Exceptional)';
    tierColor = 'text-emerald-700';
    badgeBg = 'bg-emerald-50';
    badgeText = 'text-emerald-950';
    badgeBorder = 'border-emerald-300';
  } else if (score >= 80) {
    tier = 'high';
    tierLabelAr = 'كفاءة بيعية عالية (High Efficiency)';
    tierColor = 'text-emerald-600';
    badgeBg = 'bg-emerald-50/70';
    badgeText = 'text-emerald-800';
    badgeBorder = 'border-emerald-200';
  } else if (score >= 65) {
    tier = 'moderate';
    tierLabelAr = 'كفاءة مقبولة متوازنة (Moderate)';
    tierColor = 'text-amber-700';
    badgeBg = 'bg-amber-50';
    badgeText = 'text-amber-900';
    badgeBorder = 'border-amber-200';
  } else {
    tier = 'needs_improvement';
    tierLabelAr = 'يحتاج تطوير وتكثيف (Needs Coaching)';
    tierColor = 'text-rose-700';
    badgeBg = 'bg-rose-50';
    badgeText = 'text-rose-900';
    badgeBorder = 'border-rose-200';
  }

  // Strengths extraction
  const strengths: { title: string; desc: string; icon: string }[] = [];
  if (rate >= 100) {
    strengths.push({
      title: `تجاوز مستهدف المبيعات بنسبة ${rate.toFixed(1)}%`,
      desc: `حقق فائضاً معتمداً قدره +${surplus.toLocaleString()} ج.م فوق تارجت الفرع، مما يعزز الحصة السوقية لمعرض كونكورد.`,
      icon: 'target',
    });
  } else {
    strengths.push({
      title: `إنجاز بيعي منتظم (${rate.toFixed(1)}%)`,
      desc: `سجل مبيعات إجمالية بقيمة ${gross.toLocaleString()} ج.م تمثل دعامة تشغيلية للفرع.`,
      icon: 'trending',
    });
  }

  if (attachRate >= 20) {
    strengths.push({
      title: `معدل إرفاق إكسسوارات استثنائي (${attachRate.toFixed(1)}%)`,
      desc: `يتجاوز المعيار القياسي لراية (20%)، محققاً ${acc.toLocaleString()} ج.م في الملحقات الأصلية.`,
      icon: 'headphones',
    });
  } else if (attachRate >= 15) {
    strengths.push({
      title: `معدل إرفاق إكسسوارات واعد (${attachRate.toFixed(1)}%)`,
      desc: `أداء مستقر في بيع الشواحن والسماعات الأصلية مع الهواتف الذكية.`,
      icon: 'headphones',
    });
  }

  if (inst >= 80000) {
    strengths.push({
      title: `تفعيل حلول تمويل أمان بقيمة ${inst.toLocaleString()} ج.م`,
      desc: `استثمار ناجح لبرامج التقسيط لتوسيع سلة الشراء وجذب عملاء الفئات المتوسطة والعليا.`,
      icon: 'credit',
    });
  }

  if (mob >= 250000) {
    strengths.push({
      title: `قوة إغلاق صفقات الفلاجشيب (${mob.toLocaleString()} ج.م)`,
      desc: `تميز ملحوظ في تسويق هواتف الفئة العليا (Flagship) ذات القيمة الشرائية المرتفعة.`,
      icon: 'smartphone',
    });
  }

  // Weaknesses extraction
  const weaknesses: { title: string; desc: string; icon: string; severity: 'high' | 'medium' | 'low' }[] = [];
  if (attachRate < 15) {
    weaknesses.push({
      title: `انخفاض نسبة إرفاق الإكسسوارات (${attachRate.toFixed(1)}% مقابل معيار 20%)`,
      desc: `فجوة في إرفاق ملحقات الهواتف كالسماعات والشواحن وحماية الشاشة، مما يقلل هامش الربح الإجمالي.`,
      icon: 'alert',
      severity: 'high',
    });
  }

  if (othShare < 12) {
    weaknesses.push({
      title: `ضعف التنوع في الشاشات والأجهزة الأخرى (${othShare.toFixed(1)}% فقط)`,
      desc: `الاعتماد شبه الكامل على الهواتف يجعله عرضة لتذبذب المخزون ويضعف مبيعات الأجهزة المنزلية.`,
      icon: 'tv',
      severity: 'medium',
    });
  }

  if (inst < 50000) {
    weaknesses.push({
      title: `ضعف تحويل العملاء لتقسيط أمان (${inst.toLocaleString()} ج.م)`,
      desc: `الاعتماد الأكبر على الشراء الفوري دون طرح حلول التقسيط التي ترفع متوسط الفاتورة.`,
      icon: 'credit',
      severity: 'medium',
    });
  }

  if (rate < 100) {
    weaknesses.push({
      title: `فجوة عن التارجت المالي بقيمة ${Math.abs(surplus).toLocaleString()} ج.م`,
      desc: `يحتاج المستشار لرفع وتيرة البيع اليومي لتدارك الفجوة وتحقيق نسبة 100%.`,
      icon: 'target',
      severity: 'high',
    });
  }

  // Coaching recommendation
  let coachingRecommendation = 'المحافظة على وتيرة الإغلاق القوية مع التركيز على بيع الإكسسوارات الفاخرة.';
  if (attachRate < 15 && rate < 100) {
    coachingRecommendation = 'التركيز الفوري على أسلوب "الحزمة المجمعة" (هاتف + شاحن سريع + سماعة) لتعويض الفجوة ورفع نسبة الإرفاق.';
  } else if (attachRate < 15) {
    coachingRecommendation = 'تدريب ميداني على تقنيات البيع المتقاطع (Cross-selling) لكل مشتري هاتف قبل مغادرة صالة العرض.';
  } else if (inst < 50000) {
    coachingRecommendation = 'توجيه المستشار لفتح نقاش التقسيط كخيار رئيسي مع كل عميل يفاضل بين فئات الأجهزة.';
  }

  return {
    score,
    tier,
    tierLabelAr,
    tierColor,
    badgeBg,
    badgeText,
    badgeBorder,
    targetScore,
    attachScore,
    balanceScore,
    installmentScore,
    strengths,
    weaknesses,
    coachingRecommendation,
  };
}

interface EmployeeDeepAnalyticsProps {
  records: SalesRecord[];
  currency: Currency;
  language: Language;
  vatDisplayMode?: 'afterVat' | 'beforeVat';
  onSelectEmployee?: (employeeName: string) => void;
  onOpenMonthlyReport?: () => void;
}

export const EmployeeDeepAnalytics: React.FC<EmployeeDeepAnalyticsProps> = ({
  records,
  currency,
  language,
  vatDisplayMode = 'afterVat',
  onSelectEmployee,
  onOpenMonthlyReport,
}) => {
  const isAr = language === 'ar';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [selectedEmpName, setSelectedEmpName] = useState<string>('');

  // Calculate rich profiles and efficiency scores for all records
  const analyzedEmployees = useMemo(() => {
    return records.map((r, index) => {
      const gross = r.actualAfterVat || r.actual;
      const target = r.target || 400000;
      const surplus = gross - target;
      const rate = target > 0 ? (gross / target) * 100 : 0;
      const mob = r.mobilesActual || Math.round(gross * 0.65);
      const acc = r.accessoriesActual || Math.round(gross * 0.18);
      const oth = r.otherActual || Math.round(gross * 0.17);
      const inst = r.installmentActual || 0;
      const attachRate = mob > 0 ? (acc / mob) * 100 : 0;
      const efficiency = calculateEmployeeEfficiency(r);

      return {
        id: r.id || `emp-${index}`,
        employeeId: r.employeeId || `14072${index}`,
        employee: r.employee,
        branch: r.branch,
        target,
        actualGross: gross,
        actualNet: r.actualBeforeVat || Math.round(gross / 1.14),
        vatAmount: r.vatAmount || (gross - Math.round(gross / 1.14)),
        difference: surplus,
        achievementRate: rate,
        isAchieved: rate >= 100,
        mobilesActual: mob,
        accessoriesActual: acc,
        otherActual: oth,
        installmentActual: inst,
        earnedIncentive: r.earnedIncentive || 0,
        attachRate,
        efficiency,
      };
    }).sort((a, b) => b.efficiency.score - a.efficiency.score);
  }, [records]);

  // Set default selected employee
  React.useEffect(() => {
    if (analyzedEmployees.length > 0 && !selectedEmpName) {
      setSelectedEmpName(analyzedEmployees[0].employee);
    }
  }, [analyzedEmployees, selectedEmpName]);

  // Filtering
  const filteredEmployees = useMemo(() => {
    return analyzedEmployees.filter((emp) => {
      const matchesSearch =
        emp.employee.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.employeeId.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTier =
        selectedTier === 'all' || emp.efficiency.tier === selectedTier;
      return matchesSearch && matchesTier;
    });
  }, [analyzedEmployees, searchQuery, selectedTier]);

  const activeEmployee = analyzedEmployees.find((e) => e.employee === selectedEmpName) || analyzedEmployees[0];

  // Squad High-Level Metrics
  const squadStats = useMemo(() => {
    const totalStaff = analyzedEmployees.length;
    const avgEfficiency = totalStaff > 0 ? Math.round(analyzedEmployees.reduce((s, e) => s + e.efficiency.score, 0) / totalStaff) : 0;
    const topPerformer = analyzedEmployees[0] || null;
    const bestAttach = [...analyzedEmployees].sort((a, b) => b.attachRate - a.attachRate)[0] || null;
    const overachievers = analyzedEmployees.filter((e) => e.isAchieved).length;

    return {
      totalStaff,
      avgEfficiency,
      topPerformer,
      bestAttach,
      overachievers,
    };
  }, [analyzedEmployees]);

  return (
    <div id="employee-deep-analytics" className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-6">
      {/* 1. Header Banner */}
      <div className="p-5 sm:p-6 border-b border-slate-200 bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <Zap className="w-5 h-5" />
            </span>
            <h2 className="text-base sm:text-lg font-bold tracking-tight">
              {isAr ? 'التحليل المعمق لأداء الموظفين ومؤشر الكفاءة (Employee Deep Analytics)' : 'Employee Deep Analytics & Efficiency Score'}
            </h2>
          </div>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            {isAr
              ? 'تشخيص فردي دقيق لنقاط القوة والضعف لكل مستشار مبيعات، مع احتساب مؤشر كفاءة رقمي معتمد (0-100) يقيس تحقيق التارجت، إرفاق الإكسسوارات، والتقسيط.'
              : 'Individual strengths & weaknesses diagnostics, quota benchmarking, attach rate compliance, and numerical efficiency scoring (0-100).'}
          </p>
        </div>

        {/* Squad Summary Pills */}
        <div className="flex items-center gap-2 font-mono">
          <div className="px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-right">
            <span className="text-[10px] text-slate-400 block font-sans">{isAr ? 'متوسط كفاءة الفرع' : 'Squad Avg Efficiency'}</span>
            <span className="text-base font-bold text-emerald-400 font-mono">
              {squadStats.avgEfficiency} <span className="text-xs text-slate-400">/ 100</span>
            </span>
          </div>

          <div className="px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-right">
            <span className="text-[10px] text-slate-400 block font-sans">{isAr ? 'مستشار الصدارة' : 'Top Consultant'}</span>
            <span className="text-sm font-bold text-white truncate max-w-[130px] block">
              {squadStats.topPerformer?.employee.split(' ')[0] || 'أحمد'}
            </span>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-6">
        {/* 2. Search & Tier Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isAr ? 'ابحث باسم المستشار أو الكود...' : 'Search advisor name or ID...'}
              className="w-full pl-3 pr-9 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
            />
          </div>

          {/* Tier Segmented Filter */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs font-semibold overflow-x-auto">
            <button
              type="button"
              onClick={() => setSelectedTier('all')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                selectedTier === 'all'
                  ? 'bg-white text-slate-900 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isAr ? 'جميع المستشارين' : 'All'}
            </button>
            <button
              type="button"
              onClick={() => setSelectedTier('exceptional')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                selectedTier === 'exceptional'
                  ? 'bg-emerald-600 text-white font-bold shadow-2xs'
                  : 'text-emerald-800 hover:bg-emerald-50'
              }`}
            >
              {isAr ? 'كفاءة استثنائية (90+)' : 'Exceptional (90+)'}
            </button>
            <button
              type="button"
              onClick={() => setSelectedTier('high')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                selectedTier === 'high'
                  ? 'bg-blue-600 text-white font-bold shadow-2xs'
                  : 'text-blue-800 hover:bg-blue-50'
              }`}
            >
              {isAr ? 'كفاءة عالية (80-89)' : 'High (80-89)'}
            </button>
            <button
              type="button"
              onClick={() => setSelectedTier('moderate')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                selectedTier === 'moderate'
                  ? 'bg-amber-600 text-white font-bold shadow-2xs'
                  : 'text-amber-800 hover:bg-amber-50'
              }`}
            >
              {isAr ? 'متوازنة (65-79)' : 'Moderate (65-79)'}
            </button>
          </div>
        </div>

        {/* 3. Master Efficiency Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className={`w-full ${isAr ? 'text-right' : 'text-left'} border-collapse text-xs`}>
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold select-none">
                <th className="py-3 px-3 w-10 text-center text-slate-400">#</th>
                <th className="py-3 px-3 whitespace-nowrap">{isAr ? 'كود الموظف' : 'Job ID'}</th>
                <th className="py-3 px-4 whitespace-nowrap">{isAr ? 'مستشار المبيعات' : 'Sales Advisor'}</th>
                <th className={`py-3 px-4 whitespace-nowrap ${isAr ? 'text-left' : 'text-right'}`}>
                  {isAr ? 'التارجت المطلوب' : 'Target'}
                </th>
                <th className={`py-3 px-4 whitespace-nowrap ${isAr ? 'text-left' : 'text-right'}`}>
                  {isAr ? 'المبيعات الفعلية (14% VAT)' : 'Actual Sales'}
                </th>
                <th className={`py-3 px-4 whitespace-nowrap ${isAr ? 'text-left' : 'text-right'}`}>
                  {isAr ? 'فائض / فجوة التارجت' : 'Variance'}
                </th>
                <th className="py-3 px-4 whitespace-nowrap min-w-[120px]">{isAr ? 'نسبة التحقيق' : 'Rate'}</th>
                <th className="py-3 px-4 whitespace-nowrap">{isAr ? 'معدل الإرفاق (Attach)' : 'Attach Rate'}</th>
                <th className="py-3 px-4 whitespace-nowrap text-center bg-emerald-50/50 border-x border-emerald-100">
                  <span className="font-bold text-emerald-950 flex items-center justify-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{isAr ? 'مؤشر الكفاءة الرقمي' : 'Efficiency Score'}</span>
                  </span>
                </th>
                <th className="py-3 px-3 text-center whitespace-nowrap">{isAr ? 'التشخيص والتحليل' : 'SWOT Diagnostics'}</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-500">
                    {isAr ? 'لا توجد نتائج مطابقة لمعايير البحث' : 'No matching records found'}
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp, idx) => {
                  const isSelected = activeEmployee?.employee === emp.employee;
                  const score = emp.efficiency.score;

                  return (
                    <tr
                      key={emp.id}
                      onClick={() => {
                        setSelectedEmpName(emp.employee);
                        onSelectEmployee?.(emp.employee);
                      }}
                      className={`transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50/40 ring-1 ring-inset ring-emerald-300'
                          : 'hover:bg-slate-50/70'
                      }`}
                    >
                      {/* Rank Index */}
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-400">
                        {idx + 1}
                      </td>

                      {/* Job ID */}
                      <td className="py-3 px-3 font-mono font-semibold text-slate-700 whitespace-nowrap">
                        <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {emp.employeeId}
                        </span>
                      </td>

                      {/* Employee Name */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 text-sm">{emp.employee}</span>
                          <span className="text-[10px] text-slate-400">{emp.branch}</span>
                        </div>
                      </td>

                      {/* Target */}
                      <td className={`py-3 px-4 font-mono whitespace-nowrap ${isAr ? 'text-left' : 'text-right'}`}>
                        <span className="text-slate-600">{formatCurrencyNumber(emp.target, currency, true, language)}</span>
                      </td>

                      {/* Actual */}
                      <td className={`py-3 px-4 font-mono font-bold whitespace-nowrap ${isAr ? 'text-left' : 'text-right'}`}>
                        <span className="text-slate-900">{formatCurrencyNumber(emp.actualGross, currency, true, language)}</span>
                      </td>

                      {/* Difference */}
                      <td className={`py-3 px-4 font-mono font-bold whitespace-nowrap ${isAr ? 'text-left' : 'text-right'}`}>
                        <span className={emp.difference >= 0 ? 'text-emerald-700' : 'text-rose-600'}>
                          {emp.difference >= 0 ? '+' : ''}{formatCurrencyNumber(emp.difference, currency, true, language)}
                        </span>
                      </td>

                      {/* Achievement Rate Bar */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-100 h-2 rounded-full overflow-hidden shrink-0">
                            <div
                              className={`h-full rounded-full ${emp.isAchieved ? 'bg-emerald-600' : 'bg-rose-500'}`}
                              style={{ width: `${Math.min(100, emp.achievementRate)}%` }}
                            />
                          </div>
                          <span className={`font-mono font-bold ${emp.isAchieved ? 'text-emerald-700' : 'text-rose-600'}`}>
                            {emp.achievementRate.toFixed(1)}%
                          </span>
                        </div>
                      </td>

                      {/* Accessories Attach Rate */}
                      <td className="py-3 px-4 font-mono whitespace-nowrap">
                        <span className={`font-bold px-2 py-0.5 rounded ${
                          emp.attachRate >= 20
                            ? 'bg-emerald-100 text-emerald-800'
                            : emp.attachRate >= 15
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {emp.attachRate.toFixed(1)}% {emp.attachRate >= 20 ? '⭐' : ''}
                        </span>
                      </td>

                      {/* NUMERICAL EFFICIENCY INDEX BADGE */}
                      <td className="py-3 px-4 text-center whitespace-nowrap bg-emerald-50/30 border-x border-emerald-100">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-white border border-emerald-200 shadow-2xs">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                          <div className="text-right">
                            <span className="font-mono font-black text-sm text-slate-900 block leading-none">
                              {score} <span className="text-[10px] text-slate-400 font-normal">/ 100</span>
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Diagnostics Action Button */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEmpName(emp.employee);
                          }}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                            isSelected
                              ? 'bg-emerald-600 text-white shadow-2xs'
                              : 'bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 border border-slate-200'
                          }`}
                        >
                          <span>{isSelected ? (isAr ? 'التقرير معروض' : 'Active') : (isAr ? 'فحص SWOT' : 'Inspect')}</span>
                          <ChevronRight className={`w-3 h-3 ${isAr ? 'rotate-180' : ''}`} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 4. Deep Individual Employee SWOT Card & Strengths/Weaknesses Diagnostics */}
        {activeEmployee && (
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-6 animate-in fade-in-50 duration-300">
            {/* Active Header Strip */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 bg-white p-4 rounded-xl shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg font-mono shadow-xs">
                  {activeEmployee.employee.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">{activeEmployee.employee}</h3>
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-lg border ${activeEmployee.efficiency.badgeBg} ${activeEmployee.efficiency.badgeText} ${activeEmployee.efficiency.badgeBorder}`}>
                      {activeEmployee.efficiency.tierLabelAr}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 font-mono mt-0.5 block">
                    كود: {activeEmployee.employeeId} · فرع: {activeEmployee.branch}
                  </span>
                </div>
              </div>

              {/* Large Score Metric */}
              <div className="flex items-center gap-3">
                <div className="text-center px-4 py-2 rounded-xl bg-slate-900 text-white font-mono shadow-xs">
                  <span className="text-[10px] text-slate-400 block font-sans">{isAr ? 'مؤشر الكفاءة الكلي' : 'Efficiency Index'}</span>
                  <span className="text-xl font-black text-emerald-400">
                    {activeEmployee.efficiency.score} <span className="text-xs text-slate-400 font-normal">/ 100</span>
                  </span>
                </div>
              </div>
            </div>

            {/* 4 Pillars Efficiency Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-white border border-slate-200">
                <span className="text-slate-400 text-[10px] block font-sans">{isAr ? 'ركيزة التارجت المالي (45ن)' : 'Target Pillar (45)'}</span>
                <span className="text-sm font-bold text-slate-900 mt-1 block">
                  {activeEmployee.efficiency.targetScore} / 45
                </span>
                <span className="text-[10px] text-emerald-700 block mt-0.5">
                  نسبة {activeEmployee.achievementRate.toFixed(1)}%
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white border border-slate-200">
                <span className="text-slate-400 text-[10px] block font-sans">{isAr ? 'ركيزة إرفاق الإكسسوار (25ن)' : 'Attach Pillar (25)'}</span>
                <span className="text-sm font-bold text-slate-900 mt-1 block">
                  {activeEmployee.efficiency.attachScore} / 25
                </span>
                <span className="text-[10px] text-amber-700 block mt-0.5">
                  معدل {activeEmployee.attachRate.toFixed(1)}%
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white border border-slate-200">
                <span className="text-slate-400 text-[10px] block font-sans">{isAr ? 'تنوع الأقسام والأجهزة (15ن)' : 'Category Balance (15)'}</span>
                <span className="text-sm font-bold text-slate-900 mt-1 block">
                  {activeEmployee.efficiency.balanceScore} / 15
                </span>
                <span className="text-[10px] text-blue-700 block mt-0.5">
                  أجهزة {formatCurrencyNumber(activeEmployee.otherActual, currency, true, language)}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white border border-slate-200">
                <span className="text-slate-400 text-[10px] block font-sans">{isAr ? 'تقسيط أمان والتمويل (15ن)' : 'Installments (15)'}</span>
                <span className="text-sm font-bold text-slate-900 mt-1 block">
                  {activeEmployee.efficiency.installmentScore} / 15
                </span>
                <span className="text-[10px] text-purple-700 block mt-0.5">
                  تقسيط {formatCurrencyNumber(activeEmployee.installmentActual, currency, true, language)}
                </span>
              </div>
            </div>

            {/* Strengths & Weaknesses Split Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Strengths Column */}
              <div className="p-5 rounded-xl bg-white border border-emerald-200 shadow-2xs space-y-3">
                <h4 className="text-xs font-bold text-emerald-950 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{isAr ? 'نقاط القوة المستخرجة (Strengths)' : 'Extracted Strengths'}</span>
                </h4>
                <div className="space-y-2.5">
                  {activeEmployee.efficiency.strengths.map((s, idx) => (
                    <div key={`str-${idx}`} className="p-3 rounded-lg bg-emerald-50/50 border border-emerald-100 text-xs">
                      <strong className="text-emerald-950 font-bold block mb-0.5">{s.title}</strong>
                      <span className="text-slate-600 leading-relaxed block text-[11px]">{s.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Weaknesses Column */}
              <div className="p-5 rounded-xl bg-white border border-rose-200 shadow-2xs space-y-3">
                <h4 className="text-xs font-bold text-rose-950 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>{isAr ? 'نقاط الضعف والتحديات (Weaknesses)' : 'Identified Weaknesses'}</span>
                </h4>
                <div className="space-y-2.5">
                  {activeEmployee.efficiency.weaknesses.map((w, idx) => (
                    <div key={`wkn-${idx}`} className="p-3 rounded-lg bg-rose-50/50 border border-rose-100 text-xs">
                      <div className="flex items-center justify-between mb-0.5">
                        <strong className="text-rose-950 font-bold block">{w.title}</strong>
                        <span className="text-[9px] font-bold text-rose-800 bg-rose-100 px-1.5 py-0.2 rounded">
                          {w.severity === 'high' ? 'أولوية' : 'تطوير'}
                        </span>
                      </div>
                      <span className="text-slate-600 leading-relaxed block text-[11px]">{w.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Actionable Coaching Recommendation */}
            <div className="p-4 rounded-xl bg-indigo-50/80 border border-indigo-200 flex items-start gap-3">
              <GraduationCap className="w-5 h-5 text-indigo-700 shrink-0 mt-0.5" />
              <div>
                <strong className="text-xs font-bold text-indigo-950 block">
                  {isAr ? 'توصية التدريب والتطوير الميداني المقترحة للمشرف:' : 'Supervisory Coaching Recommendation:'}
                </strong>
                <p className="text-xs text-indigo-900 mt-1 leading-relaxed">
                  {activeEmployee.efficiency.coachingRecommendation}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
