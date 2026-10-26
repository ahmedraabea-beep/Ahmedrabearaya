import React, { useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  TrendingUp,
  Target,
  Award,
  Building2,
  Calendar,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  DollarSign,
  ChevronRight,
  Copy,
  Check,
  ShieldCheck,
  Zap,
  ArrowUpRight,
  Clock,
  Briefcase,
  HelpCircle,
  Flame,
  Layers,
} from 'lucide-react';
import { SalesRecord, Currency, Language, BranchTotalTargetStructure } from '../types/sales';
import { formatCurrencyNumber, formatPercent } from '../utils/calculations';

interface FutureHiringAndExpansionTabProps {
  records: SalesRecord[];
  currency: Currency;
  language: Language;
  targetStructure?: BranchTotalTargetStructure | null;
  annualProjectedRevenue?: number;
  avgMonthlyGrowthRate?: number;
}

interface RecommendedRole {
  id: string;
  roleNameAr: string;
  roleNameEn: string;
  departmentAr: string;
  departmentEn: string;
  currentCount: number;
  recommendedCount: number;
  netNewHires: number;
  urgency: 'critical' | 'high' | 'planned';
  targetQuarter: string;
  justificationAr: string;
  justificationEn: string;
  estimatedMonthlySalary: number;
  expectedMonthlyRevenueGain: number;
  roiMultiplier: number;
  workloadReliefPct: number;
}

export const FutureHiringAndExpansionTab: React.FC<FutureHiringAndExpansionTabProps> = ({
  records,
  currency,
  language,
  targetStructure,
  annualProjectedRevenue = 18900000,
  avgMonthlyGrowthRate = 12.5,
}) => {
  const isAr = language === 'ar';

  // Interactive Simulation Controls
  const [targetGrowthPct, setTargetGrowthPct] = useState<number>(25); // +10% to +50% expansion
  const [includeAmanDedicatedStaff, setIncludeAmanDedicatedStaff] = useState<boolean>(true);
  const [includeCashierStockDedicated, setIncludeCashierStockDedicated] = useState<boolean>(true);
  const [copiedProposal, setCopiedProposal] = useState<boolean>(false);
  const [selectedRoleDetail, setSelectedRoleDetail] = useState<RecommendedRole | null>(null);

  // Baseline team stats (Concorde Plaza)
  const currentSalesAdvisorsCount = 3; // Ahmed Rabie, Amr Abdel Halim, Tarek Mahmoud
  const currentBranchManagerCount = 1; // Hany Hanna
  const currentTotalHeadcount = currentSalesAdvisorsCount + currentBranchManagerCount;

  // Monthly revenue baseline
  const currentMonthlyActual = useMemo(() => {
    return records.reduce((sum, r) => sum + (r.actualAfterVat || r.actual || 0), 0) || 1550000;
  }, [records]);

  // Current Productivity: Revenue per sales advisor
  const currentRevenuePerAdvisor = currentMonthlyActual / currentSalesAdvisorsCount;
  // Raya retail optimal advisor monthly capacity threshold (~480,000 EGP/month)
  const OPTIMAL_ADVISOR_CAPACITY = 480000;
  const currentCapacityStrainIndex = (currentRevenuePerAdvisor / OPTIMAL_ADVISOR_CAPACITY) * 100; // e.g. ~115%

  // Simulated expansion numbers based on growth slider
  const simulatedMonthlyRevenue = currentMonthlyActual * (1 + targetGrowthPct / 100);
  const simulatedAnnualRevenue = annualProjectedRevenue * (1 + targetGrowthPct / 100);

  // Recommended number of sales advisors to maintain optimal capacity without burnout
  const recommendedSalesAdvisorsCount = Math.max(
    currentSalesAdvisorsCount,
    Math.ceil(simulatedMonthlyRevenue / OPTIMAL_ADVISOR_CAPACITY)
  );
  const newAdvisorsNeeded = recommendedSalesAdvisorsCount - currentSalesAdvisorsCount;

  // Total recommended team size
  const totalRecommendedTeamSize =
    currentTotalHeadcount +
    newAdvisorsNeeded +
    (includeAmanDedicatedStaff ? 1 : 0) +
    (includeCashierStockDedicated ? 1 : 0);

  const netTotalNewHires = totalRecommendedTeamSize - currentTotalHeadcount;

  // Recommended Specific Roles Roster
  const recommendedRoles: RecommendedRole[] = useMemo(() => {
    return [
      {
        id: 'flagship_advisor',
        roleNameAr: 'مستشار مبيعات هواتف رائدة وفلاج شيب (Flagship Specialist)',
        roleNameEn: 'Senior Flagship Sales Advisor',
        departmentAr: 'قسم الهواتف الذكية والأجهزة الرائدة',
        departmentEn: 'Smartphones & Flagship Devices',
        currentCount: 1,
        recommendedCount: 2,
        netNewHires: Math.max(1, newAdvisorsNeeded),
        urgency: 'critical',
        targetQuarter: isAr ? 'فوري (قبل الجمعة البيضاء - نوفمبر 2026)' : 'Immediate (Q4 Nov 2026)',
        justificationAr:
          'مبيعات الهواتف الذكية تمثل أكثر من 65% من إجمالي دخل الفرع (تتجاوز 980 ألف ج.م). تواجد مستشارين متفرغين للفلاج شيب في ساعات الذروة المسائية يمنع ضياع المبيعات ذات القيمة المرتفعة.',
        justificationEn:
          'Smartphones account for 65%+ of branch sales (980k+ EGP). High footfall in evening peak hours requires dedicated flagship advisors.',
        estimatedMonthlySalary: 11000,
        expectedMonthlyRevenueGain: 380000,
        roiMultiplier: 34.5,
        workloadReliefPct: 35,
      },
      {
        id: 'aman_specialist',
        roleNameAr: 'أخصائي تمويل وتقسيط استهلاكي - أمان (Aman Officer)',
        roleNameEn: 'Aman Consumer Finance Officer',
        departmentAr: 'خدمات التقسيط والحلول التمويلية',
        departmentEn: 'Consumer Finance & Installments',
        currentCount: 0,
        recommendedCount: 1,
        netNewHires: includeAmanDedicatedStaff ? 1 : 0,
        urgency: 'high',
        targetQuarter: isAr ? 'الربع الرابع (ديسمبر 2026)' : 'Q4 Dec 2026',
        justificationAr:
          'تجاوز الفرع مستهدف أمان بنسبة 108.6% بمبيعات تقسيط بلغت 380 ألف ج.م. استهلاك مستشاري المبيعات في إدخال بيانات الاستعلام الائتماني والبطاقات يعطلهم عن البيع المباشر لأكثر من ساعتين يومياً.',
        justificationEn:
          'Branch surpassed Aman quota at 108.6% (380k EGP). Dedicated credit processor frees sales advisors to focus purely on floor selling.',
        estimatedMonthlySalary: 9500,
        expectedMonthlyRevenueGain: 240000,
        roiMultiplier: 25.2,
        workloadReliefPct: 28,
      },
      {
        id: 'stock_cashier',
        roleNameAr: 'مسؤول كاشير وجرد مخزني (Cashier & Stock Controller)',
        roleNameEn: 'Branch Cashier & Inventory Controller',
        departmentAr: 'العمليات والخزينة واللوجستيات',
        departmentEn: 'Operations & Inventory',
        currentCount: 0,
        recommendedCount: 1,
        netNewHires: includeCashierStockDedicated ? 1 : 0,
        urgency: 'high',
        targetQuarter: isAr ? 'بداية العام الجديد (يناير 2027)' : 'Q1 Jan 2027',
        justificationAr:
          'تسريع دورة الدفع والفواتير وتقليل زمن انتظار العميل عند الخزينة في ساعات الذروة (6:00 م - 10:00 م)، بالإضافة لمتابعة المخزون اليومي لمنع نفاد الهواتف المطلوبة.',
        justificationEn:
          'Reduces customer checkout wait times by 40% and guarantees zero stock-outs on high-demand accessories and devices.',
        estimatedMonthlySalary: 8500,
        expectedMonthlyRevenueGain: 150000,
        roiMultiplier: 17.6,
        workloadReliefPct: 22,
      },
      {
        id: 'shift_supervisor',
        roleNameAr: 'مشرف وردية مسائية / نائب مدير الفرع (Assistant Manager)',
        roleNameEn: 'Assistant Branch Manager / Shift Lead',
        departmentAr: 'إدارة العمليات والتشغيل',
        departmentEn: 'Branch Management & Supervision',
        currentCount: 0,
        recommendedCount: 1,
        netNewHires: targetGrowthPct >= 30 ? 1 : 0,
        urgency: 'planned',
        targetQuarter: isAr ? 'النصف الأول (2027)' : 'H1 2027',
        justificationAr:
          'ترقية داخلية لأحد فرسان المبيعات المتفوقين لقيادة وردية المساء وتمكين مدير الفرع (هاني حنا) من التفرغ للمبيعات المؤسسية (B2B) والتنسيق مع الإدارة الإقليمية.',
        justificationEn:
          'Internal promotion to lead evening peak shift and enable branch manager to focus on corporate accounts and regional reporting.',
        estimatedMonthlySalary: 14000,
        expectedMonthlyRevenueGain: 320000,
        roiMultiplier: 22.8,
        workloadReliefPct: 30,
      },
    ];
  }, [newAdvisorsNeeded, includeAmanDedicatedStaff, includeCashierStockDedicated, targetGrowthPct, isAr]);

  // Total estimated investment vs projected return
  const hiringFinancialImpact = useMemo(() => {
    const totalMonthlyCost = recommendedRoles.reduce(
      (sum, r) => sum + r.estimatedMonthlySalary * r.netNewHires,
      0
    );
    const totalMonthlyGain = recommendedRoles.reduce(
      (sum, r) => sum + r.expectedMonthlyRevenueGain * r.netNewHires,
      0
    );
    const netMonthlyProfitYield = totalMonthlyGain - totalMonthlyCost;
    const overallRoi = totalMonthlyCost > 0 ? totalMonthlyGain / totalMonthlyCost : 0;

    return {
      totalMonthlyCost,
      totalMonthlyGain,
      netMonthlyProfitYield,
      overallRoi,
    };
  }, [recommendedRoles]);

  // Copy Executive HR Proposal Text
  const handleCopyProposal = () => {
    const text = isAr
      ? `مذكرة داخلية رسمية: دراسة احتياجات التوظيف والتوسع لفرع راية كونكورد بلازا (2026 / 2027)\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `الموجه إليه: السيد مدير عام الموارد البشرية والعمليات الإقليمية - راية للتوزيع والتجارة\n` +
        `مقدم الطلب: هاني حنا - مدير فرع كونكورد بلازا (القاهرة الجديدة)\n` +
        `الموضوع: مقترح خطة التوسع الوظيفي وزيادة الكادر بناءً على النمو التراكمي وتوقعات الأداء السنوي\n\n` +
        `1. الموقف البيعي ومبررات التوسع:\n` +
        `• المبيعات السنوية المتوقعة للفرع: ${formatCurrencyNumber(annualProjectedRevenue, currency)} بمعدل نمو شهري (+${avgMonthlyGrowthRate.toFixed(1)}%).\n` +
        `• متوسط المبيعات الشهرية الحالية: ${formatCurrencyNumber(currentMonthlyActual, currency)} موزعة على 3 مستشارين مبيعات فقط.\n` +
        `• مؤشر ضغط العمل الحالي لكل موظف: ${currentCapacityStrainIndex.toFixed(0)}% من الطاقة الاستيعابية المثلى (ضغط مرتفع يهدد جودة خدمة العملاء).\n` +
        `• المبيعات المستهدفة مع التوسع (+${targetGrowthPct}%): ${formatCurrencyNumber(simulatedMonthlyRevenue, currency)}/شهرياً.\n\n` +
        `2. الوظائف الإضافية المطلوبة عاجلاً:\n` +
        recommendedRoles
          .filter((r) => r.netNewHires > 0)
          .map(
            (r, i) =>
              `  ${i + 1}. ${r.roleNameAr}: عدد (${r.netNewHires}) - الأولوية: ${
                r.urgency === 'critical' ? 'عاجلة وفورية (Q4)' : 'عالية (Q1 2027)'
              }\n     • التبرير: ${r.justificationAr}\n     • العائد البيعي المتوقع: +${formatCurrencyNumber(
                r.expectedMonthlyRevenueGain,
                currency
              )} شهرياً.\n`
          )
          .join('\n') +
        `\n3. الجدوى المالية وخطة العائد على الاستثمار:\n` +
        `• إجمالي تكلفة الرواتب الشهرية الجديدة: ${formatCurrencyNumber(hiringFinancialImpact.totalMonthlyCost, currency)}\n` +
        `• إجمالي الإيراد الإضافي المتوقع شهرياً: +${formatCurrencyNumber(hiringFinancialImpact.totalMonthlyGain, currency)}\n` +
        `• صافي العائد الشهري للفرع: +${formatCurrencyNumber(hiringFinancialImpact.netMonthlyProfitYield, currency)}\n` +
        `• مضاعف العائد على الاستثمار (ROI): ${hiringFinancialImpact.overallRoi.toFixed(1)}x\n\n` +
        `نوصي بالموافقة العاجلة على فتح طلبات التوظيف لتأمين مبيعات الربع الرابع وموسم الجمعة البيضاء.\n` +
        `تاريخ التقديم: ${new Date().toLocaleDateString('ar-EG')}`
      : `Internal Executive Memorandum: Concorde Plaza Staffing & Expansion Proposal\n` +
        `To: Regional Operations & HR Director - Raya Retail\n` +
        `From: Hany Hanna - Branch Manager\n` +
        `Current Headcount: ${currentTotalHeadcount} | Recommended Headcount: ${totalRecommendedTeamSize}\n` +
        `Projected Net Monthly Revenue Gain: +${formatCurrencyNumber(hiringFinancialImpact.totalMonthlyGain, currency)}`;

    navigator.clipboard.writeText(text);
    setCopiedProposal(true);
    setTimeout(() => setCopiedProposal(false), 3000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-950 via-slate-900 to-emerald-950 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm border border-blue-500/20">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-400/30 text-blue-300 flex items-center justify-center font-bold shadow-inner">
            <UserPlus className="w-6 h-6 text-blue-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black tracking-tight">
                {isAr ? 'تخطيط احتياجات التوظيف وقرارات التوسع لفرع كونكورد بلازا' : 'Concorde Plaza Staffing & Expansion Advisory'}
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-500/20 text-blue-300 border border-blue-400/40">
                {isAr ? 'نموذج التوسع 2026 / 2027' : 'Expansion Model 2026/27'}
              </span>
            </div>
            <p className="text-xs text-slate-300">
              {isAr
                ? 'تحليل الطاقة الاستيعابية لفريق العمل وتحديد الوظائف المطلوبة بناءً على متوسط النمو التراكمي وتوقعات الأداء السنوي'
                : 'Workforce capacity analysis and data-driven hiring roadmap to support cumulative sales momentum and retail expansion'}
            </p>
          </div>
        </div>

        {/* Action button: Copy proposal */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyProposal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-xs cursor-pointer active:scale-95"
            title={isAr ? 'نسخ مذكرة مقترح التوظيف الرسمية للإدارة الإقليمية' : 'Copy official HR proposal memorandum'}
          >
            {copiedProposal ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedProposal ? (isAr ? 'تم نسخ المذكرة!' : 'Copied!') : (isAr ? 'نسخ مذكرة التوظيف للإدارة' : 'Copy HR Proposal')}</span>
          </button>
        </div>
      </div>

      {/* 4 Analytical Capacity & Expansion KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1: Current Headcount & Capacity */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>{isAr ? 'الفريق الحالي / الطاقة الاستيعابية' : 'Current Team / Workload'}</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
            {currentSalesAdvisorsCount} {isAr ? 'مستشارين' : 'Advisors'}
            <span className="text-xs text-slate-500 font-normal mr-1 ml-1">
              (+1 {isAr ? 'مدير فرع' : 'Manager'})
            </span>
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[11px]">
            <span
              className={`font-black font-mono ${
                currentCapacityStrainIndex > 115 ? 'text-rose-600' : 'text-amber-700'
              }`}
            >
              {currentCapacityStrainIndex.toFixed(0)}% {isAr ? 'ضغط عمل' : 'Strain'}
            </span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-500">
              {formatCurrencyNumber(Math.round(currentRevenuePerAdvisor), currency)} / {isAr ? 'موظف' : 'rep'}
            </span>
          </div>
        </div>

        {/* Card 2: Recommended Team Size */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-300 bg-gradient-to-br from-emerald-50/50 to-white shadow-2xs">
          <div className="flex items-center justify-between text-xs text-emerald-800 font-bold mb-1">
            <span>{isAr ? 'الحجم الأمثل للفريق المطلوب' : 'Target Team Headcount'}</span>
            <Sparkles className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-950 font-mono">
            {totalRecommendedTeamSize} {isAr ? 'أفراد' : 'Staff'}
          </div>
          <div className="text-[11px] text-emerald-800 font-bold mt-1 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>
              +{netTotalNewHires} {isAr ? 'وظائف جديدة مستهدفة' : 'New hires needed'}
            </span>
          </div>
        </div>

        {/* Card 3: Additional Monthly Revenue Yield */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>{isAr ? 'الإيراد الإضافي المتوقع شهرياً' : 'Added Monthly Revenue'}</span>
            <TrendingUp className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-purple-950 font-mono">
            +{formatCurrencyNumber(hiringFinancialImpact.totalMonthlyGain, currency)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {isAr ? 'منع تسرب العملاء في ساعات الذروة' : 'Recovers walkouts during peak hours'}
          </p>
        </div>

        {/* Card 4: Hiring ROI Multiplier */}
        <div className="bg-white p-4 rounded-2xl border border-amber-300 bg-gradient-to-br from-amber-50/40 to-white shadow-2xs">
          <div className="flex items-center justify-between text-xs text-amber-800 font-bold mb-1">
            <span>{isAr ? 'مضاعف العائد على الاستثمار' : 'Hiring ROI Multiplier'}</span>
            <Flame className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-900 font-mono">
            {hiringFinancialImpact.overallRoi.toFixed(1)}x {isAr ? 'عائد' : 'ROI'}
          </div>
          <p className="text-[11px] text-amber-800 mt-1 font-medium">
            {isAr ? 'تكلفة الرواتب مغطاة بالكامل بهامش ربح عالي' : 'Salaries self-funded with surplus margin'}
          </p>
        </div>
      </div>

      {/* Interactive Growth Simulator Strip */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-700" />
              <span>{isAr ? 'محاكي خطط التوسع ونمو المبيعات المستهدف:' : 'Interactive Retail Expansion Simulator:'}</span>
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {isAr
                ? 'حرك مؤشر النمو لتجربة تأثير التوسع على حجم الفريق المطلوب ومعدلات الإنتاجية'
                : 'Adjust the targeted growth rate to dynamically simulate required headcount and team workload'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">{isAr ? 'نسبة النمو المستهدفة:' : 'Target Growth:'}</span>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-700 text-white font-mono font-black text-xs shadow-xs">
              +{targetGrowthPct}%
            </span>
          </div>
        </div>

        {/* Controls row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Slider */}
          <div className="space-y-1.5 bg-white p-3 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between text-slate-700 font-bold">
              <span>{isAr ? 'نسبة التوسع بالمبيعات:' : 'Sales Expansion Scale:'}</span>
              <span className="font-mono text-emerald-800 font-extrabold">+{targetGrowthPct}%</span>
            </div>
            <input
              type="range"
              min={10}
              max={50}
              step={5}
              value={targetGrowthPct}
              onChange={(e) => setTargetGrowthPct(Number(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>+10% (تدريجي)</span>
              <span>+25% (متوازن)</span>
              <span>+50% (طموح)</span>
            </div>
          </div>

          {/* Toggle Aman Specialist */}
          <label className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 cursor-pointer hover:border-slate-300 transition-colors">
            <div>
              <span className="font-bold text-slate-900 block">{isAr ? 'تخصيص أخصائي تقسيط أمان' : 'Dedicated Aman Officer'}</span>
              <span className="text-[11px] text-slate-500">{isAr ? 'تفريغ مستشاري المبيعات' : 'Frees floor advisors'}</span>
            </div>
            <input
              type="checkbox"
              checked={includeAmanDedicatedStaff}
              onChange={(e) => setIncludeAmanDedicatedStaff(e.target.checked)}
              className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
            />
          </label>

          {/* Toggle Cashier / Stock */}
          <label className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 cursor-pointer hover:border-slate-300 transition-colors">
            <div>
              <span className="font-bold text-slate-900 block">{isAr ? 'تخصيص كاشير ومسؤول مخزون' : 'Cashier & Stock Controller'}</span>
              <span className="text-[11px] text-slate-500">{isAr ? 'تسريع الدفع ومنع نفاد الصنف' : 'Prevents checkout bottlenecks'}</span>
            </div>
            <input
              type="checkbox"
              checked={includeCashierStockDedicated}
              onChange={(e) => setIncludeCashierStockDedicated(e.target.checked)}
              className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
            />
          </label>
        </div>

        {/* Dynamic Simulation Result Pill Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center text-xs">
          <div className="bg-white p-2 rounded-lg border border-slate-200">
            <span className="text-[10px] text-slate-400 block">{isAr ? 'المبيعات الشهرية المستهدفة:' : 'Simulated Monthly:'}</span>
            <strong className="font-mono text-slate-900">{formatCurrencyNumber(Math.round(simulatedMonthlyRevenue), currency)}</strong>
          </div>
          <div className="bg-white p-2 rounded-lg border border-slate-200">
            <span className="text-[10px] text-slate-400 block">{isAr ? 'المبيعات السنوية المستهدفة:' : 'Simulated Annual:'}</span>
            <strong className="font-mono text-purple-900">{formatCurrencyNumber(Math.round(simulatedAnnualRevenue), currency)}</strong>
          </div>
          <div className="bg-white p-2 rounded-lg border border-slate-200">
            <span className="text-[10px] text-slate-400 block">{isAr ? 'مستشارو المبيعات الموصى بهم:' : 'Target Sales Advisors:'}</span>
            <strong className="font-mono text-emerald-800">{recommendedSalesAdvisorsCount} {isAr ? 'مستشارين' : 'reps'}</strong>
          </div>
          <div className="bg-white p-2 rounded-lg border border-slate-200">
            <span className="text-[10px] text-slate-400 block">{isAr ? 'مؤشر توازن العمل بعد التوظيف:' : 'Workload Balance Post-Hire:'}</span>
            <strong className="font-mono text-emerald-700">92% ({isAr ? 'طبيعي ومثالي' : 'Optimal'})</strong>
          </div>
        </div>
      </div>

      {/* Recommended Roles & Hiring Roadmap Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-emerald-700" />
            <span>{isAr ? 'خارطة طريق الوظائف المقترحة وأولويات التعيين (Hiring Roadmap):' : 'Proposed Headcount Roadmap & Priority Roles:'}</span>
          </h4>
          <span className="text-xs text-slate-500 font-mono">
            {netTotalNewHires} {isAr ? 'شواغر مستهدفة' : 'Open Positions'}
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-xs text-right border-collapse">
            <thead>
              <tr className="bg-slate-800 text-white font-bold border-b border-slate-700">
                <th className="py-3 px-3.5">{isAr ? 'المسمى الوظيفي المقترح' : 'Role Title'}</th>
                <th className="py-3 px-3 text-center">{isAr ? 'الحالي' : 'Current'}</th>
                <th className="py-3 px-3 text-center text-emerald-400">{isAr ? 'المطلوب' : 'Target'}</th>
                <th className="py-3 px-3 text-center text-amber-300">{isAr ? 'العدد الجديد' : 'New Hires'}</th>
                <th className="py-3 px-3 text-center">{isAr ? 'الأولوية والجدول الزمني' : 'Timeline'}</th>
                <th className="py-3 px-3 text-left font-mono">{isAr ? 'الراتب التقديري' : 'Salary (EGP)'}</th>
                <th className="py-3 px-3 text-left font-mono text-emerald-400">{isAr ? 'المبيعات الإضافية المتوقعة' : 'Expected Gain'}</th>
                <th className="py-3 px-3 text-center">{isAr ? 'مضاعف ROI' : 'ROI'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {recommendedRoles.map((role) => {
                const isSelected = selectedRoleDetail?.id === role.id;

                return (
                  <tr
                    key={role.id}
                    onClick={() => setSelectedRoleDetail(isSelected ? null : role)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-50/80 font-bold'
                        : role.netNewHires > 0
                        ? 'hover:bg-slate-50'
                        : 'opacity-50 bg-slate-50/40'
                    }`}
                  >
                    {/* Role Title */}
                    <td className="py-3 px-3.5">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 text-xs sm:text-sm">{role.roleNameAr}</span>
                        <span className="text-[10px] text-slate-500">{role.departmentAr}</span>
                      </div>
                    </td>

                    {/* Current Count */}
                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-600">
                      {role.currentCount}
                    </td>

                    {/* Target Count */}
                    <td className="py-3 px-3 text-center font-mono font-black text-emerald-700 text-sm">
                      {role.recommendedCount}
                    </td>

                    {/* Net New */}
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full font-black font-mono text-xs ${
                          role.netNewHires > 0
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        +{role.netNewHires}
                      </span>
                    </td>

                    {/* Urgency & Timeline */}
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          role.urgency === 'critical'
                            ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
                            : role.urgency === 'high'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-blue-100 text-blue-800 border border-blue-300'
                        }`}
                      >
                        {role.targetQuarter}
                      </span>
                    </td>

                    {/* Salary */}
                    <td className="py-3 px-3 text-left font-mono font-bold text-slate-700">
                      {formatCurrencyNumber(role.estimatedMonthlySalary, currency)}
                    </td>

                    {/* Expected Gain */}
                    <td className="py-3 px-3 text-left font-mono font-black text-emerald-800">
                      +{formatCurrencyNumber(role.expectedMonthlyRevenueGain, currency)}
                    </td>

                    {/* ROI */}
                    <td className="py-3 px-3 text-center font-mono font-black text-purple-900">
                      {role.roiMultiplier.toFixed(1)}x
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Role Deep-Dive Card */}
      {selectedRoleDetail && (
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in duration-150">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black shrink-0 mt-0.5">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h5 className="font-black text-slate-900 text-sm">{selectedRoleDetail.roleNameAr}</h5>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-200 text-blue-900">
                  {selectedRoleDetail.targetQuarter}
                </span>
              </div>
              <p className="text-slate-700 mt-1 leading-relaxed">{selectedRoleDetail.justificationAr}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-blue-200 self-end md:self-auto shrink-0">
            <div>
              <span className="block text-[10px] text-slate-500 font-medium">
                {isAr ? 'تخفيف عبء العمل عن الفريق:' : 'Workload Relief:'}
              </span>
              <strong className="text-emerald-800 text-sm font-black">
                -{selectedRoleDetail.workloadReliefPct}% {isAr ? 'من ضغط العمل' : 'relief'}
              </strong>
            </div>
            <button
              onClick={() => setSelectedRoleDetail(null)}
              className="text-slate-400 hover:text-slate-700 text-xs px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Strategic Decision Support Notes for Management */}
      <div className="p-4 sm:p-5 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-3">
        <div className="flex items-center gap-2 text-slate-900 font-bold">
          <ShieldCheck className="w-4 h-4 text-emerald-700" />
          <span>{isAr ? 'خلاصة التوصية التنفيذية لمدير الفرع (هاني حنا) والإدارة الإقليمية:' : 'Executive Hiring Decision Framework:'}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-slate-600 leading-relaxed">
          <div className="p-3 bg-white rounded-xl border border-slate-200">
            <strong className="text-emerald-800 font-bold block mb-1">
              {isAr ? '1. حتمية التعيين قبل Q4:' : '1. Q4 Immediate Need:'}
            </strong>
            <p>
              {isAr
                ? 'تشير تحليلات ساعات الذروة (Heatmap) إلى أن 3 مستشارين غير كافين لاستيعاب تدفق العملاء بين الساعة 6:00 م و 10:00 م. تعيين مستشار إضافي فوراً يمنع تسرب مبيعات تقدر بـ 380 ألف ج.م شهرياً.'
                : 'Heatmap shows peak rush (6-10 PM) requires 4 consultants. Hiring 1 sales rep immediately captures ~380k EGP in otherwise lost sales.'}
            </p>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-200">
            <strong className="text-blue-800 font-bold block mb-1">
              {isAr ? '2. التخصص في تقسيط أمان:' : '2. Aman Specialization:'}
            </strong>
            <p>
              {isAr
                ? 'تمثل عقود أمان المحرك الأساسي للفائض النقدي بالفرع (380 ألف ج.م). تفريغ موظف للتقسيط يزيد حجم العقود بنسبة 30% ويضاعف حوافز الفريق بالكامل.'
                : 'Aman installment contracts are the primary margin driver. A dedicated officer will lift financing volume by 30%.'}
            </p>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-200">
            <strong className="text-purple-800 font-bold block mb-1">
              {isAr ? '3. خطة الترقية والاستقرار الوظيفي:' : '3. Career Progression:'}
            </strong>
            <p>
              {isAr
                ? 'ترقية أحد المستشارين المتميزين (أحمد ربيع / عمرو عبد الحليم / طارق محمود) لمشرف وردية يمنح حافزاً استقرارياً ويضمن استدامة الأداء العالي دون الحاجة لمدير خارجي.'
                : 'Internal promotion to shift supervisor retains top sales talent and maintains high operational morale.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
