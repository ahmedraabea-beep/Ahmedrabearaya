import React, { useState, useMemo } from 'react';
import {
  SalesRecord,
  Currency,
  Language,
} from '../types/sales';
import { formatCurrencyNumber, formatPercent } from '../utils/calculations';
import {
  Users,
  Award,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  ArrowRightLeft,
  Smartphone,
  Headphones,
  CreditCard,
  Tv,
  Coins,
  ShieldCheck,
  Zap,
  Target,
  Copy,
  ChevronDown,
  UserCheck,
  Compass,
  GraduationCap,
  Percent,
} from 'lucide-react';

interface StaffPerformanceSwotComparisonProps {
  records: SalesRecord[];
  currency: Currency;
  language: Language;
  vatDisplayMode?: 'afterVat' | 'beforeVat';
  onSelectEmployee?: (employeeName: string) => void;
}

export interface EmployeeSwotProfile {
  employee: string;
  employeeId: string;
  target: number;
  actualGross: number;
  actualNet: number;
  vatAmount: number;
  surplus: number;
  achievementRate: number;
  isAchieved: boolean;
  mobilesActual: number;
  accessoriesActual: number;
  otherActual: number;
  installmentActual: number;
  earnedIncentive: number;
  attachRate: number; // accessories / mobiles %
  incentiveYield: number; // incentive / actual %
  mobilesShare: number;
  accessoriesShare: number;
  otherShare: number;
  strengths: { title: string; desc: string; icon: string }[];
  weaknesses: { title: string; desc: string; icon: string; severity: 'high' | 'medium' | 'low' }[];
  opportunities: { title: string; desc: string }[];
  coachingPlan: { weekGoal: string; action: string; focusCategory: string }[];
  performanceBadge: { labelAr: string; color: string; descAr: string };
}

export const StaffPerformanceSwotComparison: React.FC<StaffPerformanceSwotComparisonProps> = ({
  records,
  currency,
  language,
  vatDisplayMode = 'afterVat',
  onSelectEmployee,
}) => {
  const isAr = language === 'ar';
  const [comparisonMode, setComparisonMode] = useState<'squad' | 'headToHead'>('squad');
  const [selectedStaffA, setSelectedStaffA] = useState<string>('');
  const [selectedStaffB, setSelectedStaffB] = useState<string>('');
  const [activeProfileTab, setActiveProfileTab] = useState<string>('');
  const [copiedText, setCopiedText] = useState(false);

  // Compute rich profiles for all employees
  const employeeProfiles: EmployeeSwotProfile[] = useMemo(() => {
    return records.map((r) => {
      const gross = r.actualAfterVat || r.actual;
      const net = r.actualBeforeVat || Math.round(r.actual / 1.14);
      const vat = r.vatAmount || (gross - net);
      const mob = r.mobilesActual || Math.round(gross * 0.65);
      const acc = r.accessoriesActual || Math.round(gross * 0.18);
      const oth = r.otherActual || Math.round(gross * 0.17);
      const inst = r.installmentActual || 0;
      const incentive = r.earnedIncentive || 0;
      const surplus = gross - r.target;
      const rate = r.target > 0 ? (gross / r.target) * 100 : 0;
      const attachRate = mob > 0 ? (acc / mob) * 100 : 0;
      const incentiveYield = gross > 0 ? (incentive / gross) * 100 : 0;
      const totalRev = mob + acc + oth;
      const mobShare = totalRev > 0 ? (mob / totalRev) * 100 : 0;
      const accShare = totalRev > 0 ? (acc / totalRev) * 100 : 0;
      const othShare = totalRev > 0 ? (oth / totalRev) * 100 : 0;

      // 1. Automated Strengths
      const strengths: { title: string; desc: string; icon: string }[] = [];
      if (rate >= 100) {
        strengths.push({
          title: `تجاوز مستهدف المبيعات بنسبة ${rate.toFixed(1)}%`,
          desc: `حقق فائضاً مالياً معتمداً قدره +${surplus.toLocaleString()} ج.م فوق تارجت الفرع، مما يعزز الحصة السوقية لمعرض كونكورد.`,
          icon: 'target',
        });
      } else {
        strengths.push({
          title: `إنجاز قوي واقتراب من التارجت بنسبة ${rate.toFixed(1)}%`,
          desc: `سجل مبيعات بقيمة ${gross.toLocaleString()} ج.م ويمثل دعامة أساسية لحجم معاملات الفرع اليومية.`,
          icon: 'trending',
        });
      }

      if (attachRate >= 20) {
        strengths.push({
          title: `معدل إرفاق إكسسوارات استثنائي (${attachRate.toFixed(1)}%)`,
          desc: `يتجاوز المعيار القياسي لراية (20%)، مما يرفع هامش الربحية الإجمالي ويزيد من متوسط ربحية السلة مع كل هاتف.`,
          icon: 'headphones',
        });
      } else if (attachRate >= 15) {
        strengths.push({
          title: `معدل إرفاق إكسسوارات جيد جداً (${attachRate.toFixed(1)}%)`,
          desc: `أداء متوازن في ملحقات الهواتف الذكية مع قدرة واضحة على إقناع العميل باقتناء الشواحن وحماية الشاشة الأصلية.`,
          icon: 'headphones',
        });
      }

      if (mobShare >= 60) {
        strengths.push({
          title: `قوة إغلاق صفقات الهواتف والفلاجشيب (${mobShare.toFixed(1)}% من مبيعاته)`,
          desc: `حقق ${mob.toLocaleString()} ج.م في فئة الهواتف الذكية مع مهارة فائقة في بيع فئات iPhone و Galaxy S-Series.`,
          icon: 'smartphone',
        });
      }

      if (inst > 100000) {
        strengths.push({
          title: `تفعيل برامج تقسيط أمان بقيمة ${inst.toLocaleString()} ج.م`,
          desc: `استغلال ذكي لحلول التمويل الاستهلاكي لتسهيل اقتناء الأجهزة المرتفعة السعر للعملاء وتوسيع شريحة المشترين.`,
          icon: 'credit',
        });
      }

      if (incentive > 10000) {
        strengths.push({
          title: `عائد حوافز مرتفع ومطابق بالقطع (${incentive.toLocaleString()} ج.م)`,
          desc: `تحقيق حافز نقدي ممتاز نتيجة التركيز على مبيعات الأصناف الترويجية ذات العمولات المرتفعة بالقطع.`,
          icon: 'coins',
        });
      }

      // 2. Automated Weaknesses & Growth Areas
      const weaknesses: { title: string; desc: string; icon: string; severity: 'high' | 'medium' | 'low' }[] = [];
      if (attachRate < 15) {
        weaknesses.push({
          title: `انخفاض معدل إرفاق الإكسسوارات (${attachRate.toFixed(1)}% مقارنة بهدف 20%)`,
          desc: `فجوة في إرفاق السماعات والشواحن الأصلية مع الهواتف الذكية المباعة، مما يفوت على الفرع أرباحاً صافية مرتفعة.`,
          icon: 'alert',
          severity: 'high',
        });
      }

      if (othShare < 15) {
        weaknesses.push({
          title: `ضعف التنوع في الشاشات والأجهزة الأخرى (${othShare.toFixed(1)}% فقط)`,
          desc: `التركيز شبه التام على الهواتف فقط يجعله عرضة لتذبذب مخزون الموبايلات ويقلل مساهمته في أجهزة اللابتوب والشاشات.`,
          icon: 'tv',
          severity: 'medium',
        });
      }

      if (inst < 80000) {
        weaknesses.push({
          title: `ضعف تحويل العملاء لتقسيط أمان (${inst.toLocaleString()} ج.م)`,
          desc: `الاعتماد الأكبر على الدفع الفوري (كاش/فيزا) دون عرض برامج تمويل أمان التي تزيد متوسط سلة الشراء بنسبة 35%.`,
          icon: 'credit',
          severity: 'medium',
        });
      }

      if (rate < 100) {
        weaknesses.push({
          title: `فجوة عن التارجت المالي (${Math.abs(surplus).toLocaleString()} ج.م)`,
          desc: `يحتاج لتكثيف معدل البيع اليومي بمقدار ${(Math.abs(surplus) / 10).toLocaleString()} ج.م يومياً للوصول إلى نسبة 100%.`,
          icon: 'target',
          severity: 'high',
        });
      }

      // 3. Automated Opportunities
      const opportunities = [
        {
          title: 'حزم الإكسسوارات الإلزامية المقترحة (Smart Bundles)',
          desc: `عرض شاحن GaN 65W مع جراب حماية أصلي ولاصقة حماية شاشة مع كل هاتف Galaxy أو iPhone لرفع نسبة الإرفاق فوق 22%.`,
        },
        {
          title: 'تنشيط برامج تقسيط أمان بدون فوائد (0% Interest)',
          desc: `فتح حوار التقسيط كخيار أول لأي عميل يقارن بين الفئات لتشجيعه على شراء الفئة الأعلى (Upgrade Selling).`,
        },
        {
          title: 'توجيه عملاء الأجهزة لخدمات الضمان الممتد وراية بروتكت',
          desc: `تسجيل عروض حماية الشاشات والضمان لزيادة العائد غير السلعي ورفع العمولة الفردية.`,
        },
      ];

      // 4. Actionable Supervisor Coaching Plan
      const coachingPlan = [
        {
          weekGoal: 'رفع معدل إرفاق الإكسسوارات إلى 20%',
          action: 'تطبيق أسلوب "العرض الثلاثي المباشر" (الهاتف + الشاحن السريع + السماعة) على طاولة المعاينة قبل الذهاب للكاشير.',
          focusCategory: 'إكسسوارات أصلية (Anker / Belkin)',
        },
        {
          weekGoal: 'تحويل 3 عمليات بيع موبايل إلى تقسيط أمان',
          action: 'حساب القسط الشهري الفعلي للعميل ومقارنته بالمصروف اليومي بدلاً من ذكر السعر الإجمالي الصادم.',
          focusCategory: 'تقسيط أمان الاستهلاكي',
        },
        {
          weekGoal: 'تنشيط مبيعات شاشات وتلفزيونات 4K ولابتوب',
          action: 'استقبال عملاء الشركات والمهتمين بالعمل المكتبي في ركن الشاشات وعرض مميزات التوصيل والتركيب المجاني.',
          focusCategory: 'قسم الأجهزة والشاشات',
        },
      ];

      // 5. Performance Badge
      let badge = { labelAr: 'مستشار مبيعات معتمد', color: 'bg-slate-100 text-slate-800 border-slate-300', descAr: 'أداء قياسي منتظم' };
      if (rate >= 120 && attachRate >= 18) {
        badge = { labelAr: 'نجم المعرض القيادي (Star Performer)', color: 'bg-emerald-100 text-emerald-900 border-emerald-300', descAr: 'تفوق استثنائي في المبيعات والإرفاق' };
      } else if (rate >= 100 && attachRate >= 20) {
        badge = { labelAr: 'بطل الإكسسوارات والربحية', color: 'bg-amber-100 text-amber-900 border-amber-300', descAr: 'أعلى معدل إرفاق بالسلة' };
      } else if (rate >= 100) {
        badge = { labelAr: 'محقق التارجت المالي (Quota Crusher)', color: 'bg-blue-100 text-blue-900 border-blue-300', descAr: 'تجاوز للهدف الإجمالي' };
      } else {
        badge = { labelAr: 'قيد التطوير والمتابعة الميدانية', color: 'bg-rose-100 text-rose-900 border-rose-300', descAr: 'يحتاج تركيزاً على سد الفجوة' };
      }

      return {
        employee: r.employee,
        employeeId: r.employeeId || '140729',
        target: r.target,
        actualGross: gross,
        actualNet: net,
        vatAmount: vat,
        surplus,
        achievementRate: rate,
        isAchieved: rate >= 100,
        mobilesActual: mob,
        accessoriesActual: acc,
        otherActual: oth,
        installmentActual: inst,
        earnedIncentive: incentive,
        attachRate,
        incentiveYield,
        mobilesShare: mobShare,
        accessoriesShare: accShare,
        otherShare: othShare,
        strengths,
        weaknesses,
        opportunities,
        coachingPlan,
        performanceBadge: badge,
      };
    }).sort((a, b) => b.achievementRate - a.achievementRate);
  }, [records]);

  // Set default selected staff for Head to Head comparison
  React.useEffect(() => {
    if (employeeProfiles.length >= 2 && (!selectedStaffA || !selectedStaffB)) {
      setSelectedStaffA(employeeProfiles[0].employee);
      setSelectedStaffB(employeeProfiles[1].employee);
      setActiveProfileTab(employeeProfiles[0].employee);
    } else if (employeeProfiles.length === 1 && !selectedStaffA) {
      setSelectedStaffA(employeeProfiles[0].employee);
      setActiveProfileTab(employeeProfiles[0].employee);
    }
  }, [employeeProfiles, selectedStaffA, selectedStaffB]);

  const profileA = employeeProfiles.find((p) => p.employee === selectedStaffA) || employeeProfiles[0];
  const profileB = employeeProfiles.find((p) => p.employee === selectedStaffB) || employeeProfiles[1] || employeeProfiles[0];
  const activeProfile = employeeProfiles.find((p) => p.employee === activeProfileTab) || employeeProfiles[0];

  const handleCopySwotReport = async () => {
    if (!profileA) return;
    const text = `
تقرير المقارنة وتحليل نقاط القوة والضعف (SWOT) - فرع كونكورد بلازا
================================================================
المستشار: ${profileA.employee} (كود: ${profileA.employeeId})
- إجمالي المبيعات بعد ضريبة 14%: ${profileA.actualGross.toLocaleString()} ج.م
- التارجت المطلوب: ${profileA.target.toLocaleString()} ج.م (نسبة الإنجاز: ${profileA.achievementRate.toFixed(1)}%)
- الفارق المالي: ${profileA.surplus >= 0 ? '+' : ''}${profileA.surplus.toLocaleString()} ج.م
- مبيعات الموبايلات: ${profileA.mobilesActual.toLocaleString()} ج.م (${profileA.mobilesShare.toFixed(1)}%)
- مبيعات الإكسسوارات: ${profileA.accessoriesActual.toLocaleString()} ج.م (معدل الإرفاق Attach Rate: ${profileA.attachRate.toFixed(1)}%)
- مبيعات تقسيط أمان: ${profileA.installmentActual.toLocaleString()} ج.م
- الحافز الصارم المحسوب بالقطع: ${profileA.earnedIncentive.toLocaleString()} ج.م

نقاط القوة:
${profileA.strengths.map((s, i) => `${i + 1}. ${s.title}: ${s.desc}`).join('\n')}

نقاط الضعف والتحديات:
${profileA.weaknesses.map((w, i) => `${i + 1}. ${w.title}: ${w.desc}`).join('\n')}

خطة التطوير المقترحة:
${profileA.coachingPlan.map((c, i) => `الأسبوع ${i + 1} (${c.focusCategory}): ${c.action}`).join('\n')}
    `.trim();

    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 3000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar & Mode Switcher */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <Compass className="w-5 h-5" />
            </span>
            <h3 className="text-base sm:text-lg font-bold tracking-tight">
              {isAr ? 'مقارنة أداء الموظفين وتحليل نقاط القوة والضعف (SWOT)' : 'Staff Benchmarking & SWOT Analysis'}
            </h3>
          </div>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            {isAr
              ? 'مقارنة دقيقة وشاملة لأداء مستشاري مبيعات فرع كونكورد بلازا: رأس برأس، تحليل نقاط القوة وتحديات الإرفاق (Attach Rate)، وتوصيات التدريب الميداني المعتمدة.'
              : 'Deep comparative matrix of sales advisors, attach rate benchmarks, weaknesses diagnostics, and coaching roadmaps.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 p-1 bg-slate-800 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setComparisonMode('squad')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                comparisonMode === 'squad'
                  ? 'bg-emerald-600 text-white font-bold shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {isAr ? 'لوحة الفريق الشاملة' : 'Squad Benchmarking'}
            </button>
            <button
              type="button"
              onClick={() => setComparisonMode('headToHead')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                comparisonMode === 'headToHead'
                  ? 'bg-emerald-600 text-white font-bold shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>{isAr ? 'مقارنة رأس برأس (1 ضد 1)' : 'Head-to-Head'}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopySwotReport}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors cursor-pointer shadow-2xs ${
              copiedText
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border-slate-700'
            }`}
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{copiedText ? (isAr ? 'تم نسخ التقرير!' : 'Copied!') : (isAr ? 'نسخ تقرير المقارنة' : 'Copy Report')}</span>
          </button>
        </div>
      </div>

      {/* 2. MODE A: HEAD TO HEAD COMPARISON */}
      {comparisonMode === 'headToHead' && profileA && profileB && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-6">
          {/* Head to Head Selector Bar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-slate-200">
            {/* Advisor A Selector */}
            <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-emerald-800 block uppercase">{isAr ? 'المستشار الأول (الطرف أ)' : 'Advisor A'}</span>
                <select
                  value={selectedStaffA}
                  onChange={(e) => setSelectedStaffA(e.target.value)}
                  className="mt-1 font-bold text-slate-900 bg-white border border-emerald-300 rounded-lg px-2.5 py-1 text-sm outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  {employeeProfiles.map((p) => (
                    <option key={`a-${p.employee}`} value={p.employee}>
                      {p.employee} ({p.achievementRate.toFixed(1)}%)
                    </option>
                  ))}
                </select>
              </div>
              <div className="text-left font-mono">
                <span className="text-xs text-slate-500 block">{isAr ? 'المبيعات الفعلية' : 'Sales'}</span>
                <span className="text-sm font-bold text-emerald-900">
                  {formatCurrencyNumber(profileA.actualGross, currency, true, language)}
                </span>
              </div>
            </div>

            {/* Advisor B Selector */}
            <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-blue-800 block uppercase">{isAr ? 'المستشار الثاني (الطرف ب)' : 'Advisor B'}</span>
                <select
                  value={selectedStaffB}
                  onChange={(e) => setSelectedStaffB(e.target.value)}
                  className="mt-1 font-bold text-slate-900 bg-white border border-blue-300 rounded-lg px-2.5 py-1 text-sm outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  {employeeProfiles.map((p) => (
                    <option key={`b-${p.employee}`} value={p.employee}>
                      {p.employee} ({p.achievementRate.toFixed(1)}%)
                    </option>
                  ))}
                </select>
              </div>
              <div className="text-left font-mono">
                <span className="text-xs text-slate-500 block">{isAr ? 'المبيعات الفعلية' : 'Sales'}</span>
                <span className="text-sm font-bold text-blue-900">
                  {formatCurrencyNumber(profileB.actualGross, currency, true, language)}
                </span>
              </div>
            </div>
          </div>

          {/* Comparative Metrics Table with Progress Bars */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-600" />
              <span>{isAr ? 'المقارنة المباشرة في المؤشرات التشغيلية والمالية' : 'Direct KPI Comparison'}</span>
            </h4>

            {/* Metric 1: Target Achievement % */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between text-xs font-mono font-bold mb-1.5">
                <span className="text-emerald-700">{profileA.employee}: {profileA.achievementRate.toFixed(1)}%</span>
                <span className="text-slate-800">{isAr ? 'نسبة تحقيق التارجت المالي' : 'Target Achievement'}</span>
                <span className="text-blue-700">{profileB.achievementRate.toFixed(1)}% :{profileB.employee}</span>
              </div>
              <div className="w-full bg-slate-200 h-3 rounded-full flex overflow-hidden">
                <div
                  className="bg-emerald-600 h-full transition-all duration-500"
                  style={{ width: `${(profileA.achievementRate / (profileA.achievementRate + profileB.achievementRate)) * 100}%` }}
                />
                <div
                  className="bg-blue-600 h-full transition-all duration-500"
                  style={{ width: `${(profileB.achievementRate / (profileA.achievementRate + profileB.achievementRate)) * 100}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1 font-mono">
                <span>تارجت: {formatCurrencyNumber(profileA.target, currency, true, language)}</span>
                <span className="font-bold text-slate-700">
                  {profileA.achievementRate >= profileB.achievementRate
                    ? `يتفوق ${profileA.employee} بفارق +${(profileA.achievementRate - profileB.achievementRate).toFixed(1)}%`
                    : `يتفوق ${profileB.employee} بفارق +${(profileB.achievementRate - profileA.achievementRate).toFixed(1)}%`}
                </span>
                <span>تارجت: {formatCurrencyNumber(profileB.target, currency, true, language)}</span>
              </div>
            </div>

            {/* Metric 2: Accessories Attach Rate (Golden standard 20%) */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between text-xs font-mono font-bold mb-1.5">
                <span className="text-emerald-700">
                  {profileA.attachRate.toFixed(1)}% ({formatCurrencyNumber(profileA.accessoriesActual, currency, true, language)})
                </span>
                <span className="text-slate-800">{isAr ? 'معدل إرفاق الإكسسوارات (Attach Rate - المستهدف 20%)' : 'Accessories Attach Rate'}</span>
                <span className="text-blue-700">
                  {profileB.attachRate.toFixed(1)}% ({formatCurrencyNumber(profileB.accessoriesActual, currency, true, language)})
                </span>
              </div>
              <div className="w-full bg-slate-200 h-3 rounded-full flex overflow-hidden">
                <div
                  className="bg-amber-500 h-full transition-all duration-500"
                  style={{ width: `${(profileA.attachRate / (profileA.attachRate + profileB.attachRate || 1)) * 100}%` }}
                />
                <div
                  className="bg-indigo-500 h-full transition-all duration-500"
                  style={{ width: `${(profileB.attachRate / (profileA.attachRate + profileB.attachRate || 1)) * 100}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1 font-mono">
                <span>{profileA.attachRate >= 20 ? '✅ تجاوز المعيار القياسي' : '⚠️ أقل من هدف 20%'}</span>
                <span className="font-bold text-amber-900">
                  {profileA.attachRate >= profileB.attachRate
                    ? `إرفاق أعلى لصالح ${profileA.employee} (+${(profileA.attachRate - profileB.attachRate).toFixed(1)}%)`
                    : `إرفاق أعلى لصالح ${profileB.employee} (+${(profileB.attachRate - profileA.attachRate).toFixed(1)}%)`}
                </span>
                <span>{profileB.attachRate >= 20 ? '✅ تجاوز المعيار القياسي' : '⚠️ أقل من هدف 20%'}</span>
              </div>
            </div>

            {/* Metric 3: Smartphones Dominance */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between text-xs font-mono font-bold mb-1.5">
                <span className="text-emerald-700">{formatCurrencyNumber(profileA.mobilesActual, currency, true, language)}</span>
                <span className="text-slate-800">{isAr ? 'مبيعات الهواتف الذكية والفلاجشيب' : 'Smartphone Sales'}</span>
                <span className="text-blue-700">{formatCurrencyNumber(profileB.mobilesActual, currency, true, language)}</span>
              </div>
              <div className="w-full bg-slate-200 h-3 rounded-full flex overflow-hidden">
                <div
                  className="bg-emerald-600 h-full transition-all duration-500"
                  style={{ width: `${(profileA.mobilesActual / (profileA.mobilesActual + profileB.mobilesActual || 1)) * 100}%` }}
                />
                <div
                  className="bg-blue-600 h-full transition-all duration-500"
                  style={{ width: `${(profileB.mobilesActual / (profileA.mobilesActual + profileB.mobilesActual || 1)) * 100}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1 font-mono">
                <span>الحصة من مبيعاته: {profileA.mobilesShare.toFixed(1)}%</span>
                <span className="font-bold text-slate-700">
                  فارق حجم الهواتف: {Math.abs(profileA.mobilesActual - profileB.mobilesActual).toLocaleString()} ج.م
                </span>
                <span>الحصة من مبيعاته: {profileB.mobilesShare.toFixed(1)}%</span>
              </div>
            </div>

            {/* Metric 4: Installments & Aman Conversion */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between text-xs font-mono font-bold mb-1.5">
                <span className="text-emerald-700">{formatCurrencyNumber(profileA.installmentActual, currency, true, language)}</span>
                <span className="text-slate-800">{isAr ? 'مبيعات تقسيط أمان للعملاء' : 'Aman Installment Sales'}</span>
                <span className="text-blue-700">{formatCurrencyNumber(profileB.installmentActual, currency, true, language)}</span>
              </div>
              <div className="w-full bg-slate-200 h-3 rounded-full flex overflow-hidden">
                <div
                  className="bg-purple-600 h-full transition-all duration-500"
                  style={{ width: `${(profileA.installmentActual / (profileA.installmentActual + profileB.installmentActual || 1)) * 100}%` }}
                />
                <div
                  className="bg-purple-400 h-full transition-all duration-500"
                  style={{ width: `${(profileB.installmentActual / (profileA.installmentActual + profileB.installmentActual || 1)) * 100}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1 font-mono">
                <span>{profileA.installmentActual > 100000 ? 'نشط جداً في التمويل' : 'تفعيل محدود للتقسيط'}</span>
                <span className="font-bold text-purple-900">
                  {profileA.installmentActual >= profileB.installmentActual
                    ? `${profileA.employee} يتصدر في التقسيط`
                    : `${profileB.employee} يتصدر في التقسيط`}
                </span>
                <span>{profileB.installmentActual > 100000 ? 'نشط جداً في التمويل' : 'تفعيل محدود للتقسيط'}</span>
              </div>
            </div>

            {/* Metric 5: Strict Incentive Earned */}
            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200">
              <div className="flex items-center justify-between text-xs font-mono font-bold mb-1">
                <span className="text-amber-900 text-sm">{formatCurrencyNumber(profileA.earnedIncentive, currency, true, language)}</span>
                <span className="text-amber-950 font-bold">{isAr ? 'الحافز الصارم المحسوب بالقطع المباعة' : 'Strict Incentive Earned'}</span>
                <span className="text-amber-900 text-sm">{formatCurrencyNumber(profileB.earnedIncentive, currency, true, language)}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-600 font-mono mt-1">
                <span>عائد الحافز: {profileA.incentiveYield.toFixed(2)}%</span>
                <span className="font-bold text-amber-800">
                  {profileA.earnedIncentive === 0 && profileB.earnedIncentive === 0
                    ? 'بانتظار ربط شيت حوافز الأصناف لاعتماد المستحقات بالقطعة'
                    : `فارق الحافز: ${Math.abs(profileA.earnedIncentive - profileB.earnedIncentive).toLocaleString()} ج.م`}
                </span>
                <span>عائد الحافز: {profileB.incentiveYield.toFixed(2)}%</span>
              </div>
            </div>
          </div>

          {/* Side by Side Detailed SWOT Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200">
            {/* SWOT for Advisor A */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-base">{profileA.employee}</h4>
                  <span className="text-xs text-slate-500 font-mono">كود: {profileA.employeeId}</span>
                </div>
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${profileA.performanceBadge.color}`}>
                  {profileA.performanceBadge.labelAr}
                </span>
              </div>

              {/* Strengths */}
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-2">
                <h5 className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>{isAr ? 'نقاط القوة التنافسية (Strengths)' : 'Key Strengths'}</span>
                </h5>
                <ul className="space-y-2 text-xs text-slate-700">
                  {profileA.strengths.map((s, idx) => (
                    <li key={`a-str-${idx}`} className="flex items-start gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                      <div>
                        <strong className="text-emerald-950 block">{s.title}</strong>
                        <span className="text-slate-600 text-[11px] leading-tight block">{s.desc}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Weaknesses */}
              <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200 space-y-2">
                <h5 className="text-xs font-bold text-rose-950 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-700" />
                  <span>{isAr ? 'نقاط الضعف والتحديات (Weaknesses)' : 'Areas for Improvement'}</span>
                </h5>
                <ul className="space-y-2 text-xs text-slate-700">
                  {profileA.weaknesses.map((w, idx) => (
                    <li key={`a-wkn-${idx}`} className="flex items-start gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-600 mt-1.5 shrink-0" />
                      <div>
                        <strong className="text-rose-950 block">{w.title}</strong>
                        <span className="text-slate-600 text-[11px] leading-tight block">{w.desc}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* SWOT for Advisor B */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-base">{profileB.employee}</h4>
                  <span className="text-xs text-slate-500 font-mono">كود: {profileB.employeeId}</span>
                </div>
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${profileB.performanceBadge.color}`}>
                  {profileB.performanceBadge.labelAr}
                </span>
              </div>

              {/* Strengths */}
              <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 space-y-2">
                <h5 className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-700" />
                  <span>{isAr ? 'نقاط القوة التنافسية (Strengths)' : 'Key Strengths'}</span>
                </h5>
                <ul className="space-y-2 text-xs text-slate-700">
                  {profileB.strengths.map((s, idx) => (
                    <li key={`b-str-${idx}`} className="flex items-start gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                      <div>
                        <strong className="text-blue-950 block">{s.title}</strong>
                        <span className="text-slate-600 text-[11px] leading-tight block">{s.desc}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Weaknesses */}
              <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200 space-y-2">
                <h5 className="text-xs font-bold text-rose-950 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-700" />
                  <span>{isAr ? 'نقاط الضعف والتحديات (Weaknesses)' : 'Areas for Improvement'}</span>
                </h5>
                <ul className="space-y-2 text-xs text-slate-700">
                  {profileB.weaknesses.map((w, idx) => (
                    <li key={`b-wkn-${idx}`} className="flex items-start gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-600 mt-1.5 shrink-0" />
                      <div>
                        <strong className="text-rose-950 block">{w.title}</strong>
                        <span className="text-slate-600 text-[11px] leading-tight block">{w.desc}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. MODE B: FULL SQUAD BENCHMARKING & INDIVIDUAL SWOT PROFILES */}
      {comparisonMode === 'squad' && (
        <div className="space-y-6">
          {/* Squad Leaderboard Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {employeeProfiles.map((p, idx) => {
              const isSelected = activeProfileTab === p.employee;
              return (
                <div
                  key={p.employee}
                  onClick={() => setActiveProfileTab(p.employee)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                    isSelected
                      ? 'bg-white border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-mono font-bold text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${p.performanceBadge.color}`}>
                      {p.performanceBadge.labelAr}
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-900 text-base">{p.employee}</h4>
                  <span className="text-xs text-slate-400 font-mono block mb-3">كود وظيفي: {p.employeeId}</span>

                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">{isAr ? 'المبيعات:' : 'Actual:'}</span>
                      <span className="font-bold text-slate-900">{formatCurrencyNumber(p.actualGross, currency, true, language)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">{isAr ? 'نسبة الإنجاز:' : 'Achievement:'}</span>
                      <span className={`font-bold px-1.5 py-0.5 rounded text-[11px] ${p.isAchieved ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                        {p.achievementRate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">{isAr ? 'معدل الإرفاق:' : 'Attach Rate:'}</span>
                      <span className={`font-bold ${p.attachRate >= 20 ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {p.attachRate.toFixed(1)}% {p.attachRate >= 20 ? '⭐' : ''}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                      <span className="text-slate-500">{isAr ? 'الحافز الصارم:' : 'Incentive:'}</span>
                      <span className="font-bold text-amber-900">{formatCurrencyNumber(p.earnedIncentive, currency, true, language)}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-emerald-700">
                    <span>{isSelected ? (isAr ? 'الملف معروض أدناه' : 'Profile Active') : (isAr ? 'انقر لعرض تحليل SWOT' : 'View SWOT')}</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isSelected ? 'rotate-180' : ''}`} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Active Employee Deep SWOT Hub */}
          {activeProfile && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
              {/* Profile Top Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-lg font-mono">
                    {activeProfile.employee.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-lg font-bold text-slate-900">{activeProfile.employee}</h4>
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-lg border ${activeProfile.performanceBadge.color}`}>
                        {activeProfile.performanceBadge.labelAr}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      الرقم الوظيفي: {activeProfile.employeeId} · فرع كونكورد بلازا التجمع الخامس
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 font-mono text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-right">
                    <span className="text-[10px] text-slate-500 block">الفائض المالي</span>
                    <span className="font-bold text-emerald-700 text-sm">
                      {activeProfile.surplus >= 0 ? '+' : ''}{formatCurrencyNumber(activeProfile.surplus, currency, true, language)}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-right">
                    <span className="text-[10px] text-amber-800 block">الحافز المعتمد</span>
                    <span className="font-bold text-amber-950 text-sm">
                      {formatCurrencyNumber(activeProfile.earnedIncentive, currency, true, language)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Four Quadrants of SWOT */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* 1. Strengths */}
                <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-emerald-950 text-sm flex items-center gap-2">
                      <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600" />
                      <span>{isAr ? 'نقاط القوة التنافسية (Strengths)' : 'Key Strengths'}</span>
                    </h5>
                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                      {activeProfile.strengths.length} نقاط بارزة
                    </span>
                  </div>
                  <div className="space-y-2.5 text-xs text-slate-700">
                    {activeProfile.strengths.map((s, idx) => (
                      <div key={`s-${idx}`} className="p-2.5 rounded-xl bg-white border border-emerald-100 shadow-2xs">
                        <strong className="text-emerald-950 block font-semibold mb-0.5">{s.title}</strong>
                        <span className="text-slate-600 leading-relaxed block">{s.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Weaknesses */}
                <div className="p-5 rounded-2xl bg-rose-50/60 border border-rose-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-rose-950 text-sm flex items-center gap-2">
                      <AlertTriangle className="w-4.5 h-4.5 text-rose-600" />
                      <span>{isAr ? 'نقاط الضعف والتحديات (Weaknesses)' : 'Weaknesses & Gaps'}</span>
                    </h5>
                    <span className="text-[11px] font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded">
                      تتطلب معالجة وتدريب
                    </span>
                  </div>
                  <div className="space-y-2.5 text-xs text-slate-700">
                    {activeProfile.weaknesses.map((w, idx) => (
                      <div key={`w-${idx}`} className="p-2.5 rounded-xl bg-white border border-rose-100 shadow-2xs">
                        <div className="flex items-center justify-between mb-0.5">
                          <strong className="text-rose-950 block font-semibold">{w.title}</strong>
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                            w.severity === 'high' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {w.severity === 'high' ? 'أولوية قصوى' : 'متوسط'}
                          </span>
                        </div>
                        <span className="text-slate-600 leading-relaxed block">{w.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Opportunities */}
                <div className="p-5 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-blue-950 text-sm flex items-center gap-2">
                      <TrendingUp className="w-4.5 h-4.5 text-blue-600" />
                      <span>{isAr ? 'الفرص المتاحة لتعظيم المبيعات (Opportunities)' : 'Growth Opportunities'}</span>
                    </h5>
                    <span className="text-[11px] font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded">
                      فرص ميدانية
                    </span>
                  </div>
                  <div className="space-y-2.5 text-xs text-slate-700">
                    {activeProfile.opportunities.map((o, idx) => (
                      <div key={`o-${idx}`} className="p-2.5 rounded-xl bg-white border border-blue-100 shadow-2xs">
                        <strong className="text-blue-950 block font-semibold mb-0.5">{o.title}</strong>
                        <span className="text-slate-600 leading-relaxed block">{o.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. Actionable Coaching & Development Plan */}
                <div className="p-5 rounded-2xl bg-purple-50/60 border border-purple-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-purple-950 text-sm flex items-center gap-2">
                      <GraduationCap className="w-4.5 h-4.5 text-purple-600" />
                      <span>{isAr ? 'خطة التدريب والتوجيه المقترحة (Action Plan)' : 'Coaching Roadmap'}</span>
                    </h5>
                    <span className="text-[11px] font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded">
                      مهام أسبوعية
                    </span>
                  </div>
                  <div className="space-y-2.5 text-xs text-slate-700">
                    {activeProfile.coachingPlan.map((c, idx) => (
                      <div key={`c-${idx}`} className="p-2.5 rounded-xl bg-white border border-purple-100 shadow-2xs">
                        <div className="flex items-center justify-between mb-0.5">
                          <strong className="text-purple-950 block font-semibold">الأسبوع {idx + 1}: {c.weekGoal}</strong>
                          <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded">
                            {c.focusCategory}
                          </span>
                        </div>
                        <span className="text-slate-600 leading-relaxed block">{c.action}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
