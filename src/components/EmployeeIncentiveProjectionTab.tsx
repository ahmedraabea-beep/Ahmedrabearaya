import React, { useState, useMemo } from 'react';
import {
  Coins,
  TrendingUp,
  Award,
  Zap,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Sliders,
  Users,
  Target,
  ArrowRight,
  MessageCircle,
  Check,
  Building2,
  Info,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { SalesRecord, Currency, Language } from '../types/sales';
import { formatCurrencyNumber, formatPercent } from '../utils/calculations';

interface EmployeeIncentiveProjectionTabProps {
  records: SalesRecord[];
  currency: Currency;
  language: Language;
  daysInMonth?: number;
  initialElapsedDays?: number;
}

interface TierDefinition {
  id: string;
  nameAr: string;
  nameEn: string;
  minRate: number;
  maxRate: number;
  bonusMultiplier: number; // 1.0 = base, 1.2 = +20%, etc.
  color: string;
  badgeBg: string;
  badgeText: string;
}

const INCENTIVE_TIERS: TierDefinition[] = [
  {
    id: 'tier_entry',
    nameAr: 'شريحة الدخول (90% - 99.9%)',
    nameEn: 'Entry Tier (90% - 99.9%)',
    minRate: 90,
    maxRate: 99.99,
    bonusMultiplier: 1.0, // Base incentive
    color: 'amber',
    badgeBg: 'bg-amber-100 border-amber-300',
    badgeText: 'text-amber-900',
  },
  {
    id: 'tier_target',
    nameAr: 'شريحة كسر التارجت (100% - 109.9%)',
    nameEn: 'Target Tier (100% - 109.9%)',
    minRate: 100,
    maxRate: 109.99,
    bonusMultiplier: 1.2, // +20% bonus
    color: 'emerald',
    badgeBg: 'bg-emerald-100 border-emerald-300',
    badgeText: 'text-emerald-900',
  },
  {
    id: 'tier_silver',
    nameAr: 'شريحة التميز الفضي (110% - 119.9%)',
    nameEn: 'Silver Excellence (110% - 119.9%)',
    minRate: 110,
    maxRate: 119.99,
    bonusMultiplier: 1.4, // +40% bonus
    color: 'blue',
    badgeBg: 'bg-blue-100 border-blue-300',
    badgeText: 'text-blue-900',
  },
  {
    id: 'tier_gold',
    nameAr: 'شريحة الفرسان الذهبية (120%+)',
    nameEn: 'Gold Champions (120%+)',
    minRate: 120,
    maxRate: 999,
    bonusMultiplier: 1.65, // +65% champion bonus
    color: 'purple',
    badgeBg: 'bg-purple-100 border-purple-300',
    badgeText: 'text-purple-900',
  },
];

export const EmployeeIncentiveProjectionTab: React.FC<EmployeeIncentiveProjectionTabProps> = ({
  records,
  currency,
  language,
  daysInMonth = 31,
  initialElapsedDays = 24,
}) => {
  const isAr = language === 'ar';

  const [elapsedDays, setElapsedDays] = useState<number>(initialElapsedDays);
  const [momentumModifier, setMomentumModifier] = useState<number>(1.0); // 0.8 to 1.3
  const [copiedWhatsappId, setCopiedWhatsappId] = useState<string | null>(null);
  const [filterTier, setFilterTier] = useState<string>('all');

  const remainingDays = Math.max(1, daysInMonth - elapsedDays);

  // Helper to determine tier from rate
  const getTierForRate = (rate: number): TierDefinition | null => {
    if (rate < 90) return null;
    return (
      INCENTIVE_TIERS.find((t) => rate >= t.minRate && rate <= t.maxRate) ||
      INCENTIVE_TIERS[INCENTIVE_TIERS.length - 1]
    );
  };

  const getNextTier = (rate: number): TierDefinition | null => {
    if (rate < 90) return INCENTIVE_TIERS[0];
    if (rate < 100) return INCENTIVE_TIERS[1];
    if (rate < 110) return INCENTIVE_TIERS[2];
    if (rate < 120) return INCENTIVE_TIERS[3];
    return null; // Already at top tier
  };

  // Compute projections for each employee
  const employeeProjections = useMemo(() => {
    return records.map((record) => {
      const actualSales = record.actualAfterVat || record.actual || 0;
      const targetSales = record.target || 1;
      const currentRate = (actualSales / targetSales) * 100;
      const currentIncentive = record.earnedIncentive || Math.round(actualSales * 0.015);

      // Daily run rate
      const dailyRunRate = actualSales / elapsedDays;

      // Projected additional sales in remaining days
      const projectedAdditionalSales = dailyRunRate * remainingDays * momentumModifier;
      const projectedFinalSales = actualSales + projectedAdditionalSales;
      const projectedFinalRate = (projectedFinalSales / targetSales) * 100;

      // Current tier vs projected tier
      const currentTier = getTierForRate(currentRate);
      const projectedTier = getTierForRate(projectedFinalRate);
      const nextPotentialTier = getNextTier(projectedFinalRate);

      // Estimate base commission rate
      const baseCommissionRatio = actualSales > 0 ? currentIncentive / actualSales : 0.015;

      // Projected base incentive + bonus multiplier
      const projectedBaseIncentive = projectedFinalSales * baseCommissionRatio;
      const tierMultiplier = projectedTier ? projectedTier.bonusMultiplier : (projectedFinalRate >= 90 ? 1.0 : 0.4);
      const projectedFinalIncentive = Math.round(projectedBaseIncentive * tierMultiplier);
      const incentiveDelta = Math.max(0, projectedFinalIncentive - currentIncentive);

      // Smart Tier Alert computation
      let smartAlert: {
        type: 'critical_entry' | 'near_target' | 'near_silver' | 'near_gold' | 'champion';
        title: string;
        message: string;
        amountNeeded: number;
        dailyNeeded: number;
        additionalBonusEstimated: number;
      } | null = null;

      if (nextPotentialTier) {
        const requiredSalesForNextTier = targetSales * (nextPotentialTier.minRate / 100);
        const amountNeeded = Math.max(0, requiredSalesForNextTier - projectedFinalSales);
        const dailyNeeded = Math.round(amountNeeded / remainingDays);
        const nextTierMultiplier = nextPotentialTier.bonusMultiplier;
        const additionalBonusEstimated = Math.round(
          projectedFinalSales * baseCommissionRatio * (nextTierMultiplier - tierMultiplier)
        );

        // Distance in percentage
        const distanceToTierPct = nextPotentialTier.minRate - projectedFinalRate;

        // If within 5.5% or less to jump to next tier
        if (distanceToTierPct > 0 && distanceToTierPct <= 6.5) {
          if (nextPotentialTier.minRate === 90) {
            smartAlert = {
              type: 'critical_entry',
              title: isAr ? '⚠️ تنبيه استحقاق: اقترب من شريحة 90%' : '⚠️ Entry Tier Alert',
              message: isAr
                ? `متبقي فقط ${formatCurrencyNumber(amountNeeded, currency)} (بمعدل ${formatCurrencyNumber(dailyNeeded, currency)}/يوم) لضمان دخول شريحة الحوافز (90%) وتجنب حجب البونص.`
                : `Needs ${formatCurrencyNumber(amountNeeded, currency)} to unlock 90% incentive qualification.`,
              amountNeeded,
              dailyNeeded,
              additionalBonusEstimated: Math.round(currentIncentive * 0.5),
            };
          } else if (nextPotentialTier.minRate === 100) {
            smartAlert = {
              type: 'near_target',
              title: isAr ? '⚡ فرصة كسر التارجت (100%): بونص +20%' : '⚡ 100% Target Milestone Ahead',
              message: isAr
                ? `على بعد ${distanceToTierPct.toFixed(1)}% فقط من كسر التارجت بالكامل! تحقيق ${formatCurrencyNumber(amountNeeded, currency)} إضافية يقفز بالحافز بمقدار (+${formatCurrencyNumber(additionalBonusEstimated, currency)})!`
                : `Only ${distanceToTierPct.toFixed(1)}% away from 100% target! Extra (+${formatCurrencyNumber(additionalBonusEstimated, currency)}) bonus!`,
              amountNeeded,
              dailyNeeded,
              additionalBonusEstimated,
            };
          } else if (nextPotentialTier.minRate === 110) {
            smartAlert = {
              type: 'near_silver',
              title: isAr ? '🌟 شريحة التميز الفضي (110%): بونص +40%' : '🌟 Silver Excellence (110%) Ahead',
              message: isAr
                ? `أداء خارق! على بعد ${distanceToTierPct.toFixed(1)}% من شريحة 110%. دفعة بيعية يومية قدرها ${formatCurrencyNumber(dailyNeeded, currency)} تضيف للحافز (+${formatCurrencyNumber(additionalBonusEstimated, currency)})!`
                : `Within ${distanceToTierPct.toFixed(1)}% of 110% tier. Worth an extra (+${formatCurrencyNumber(additionalBonusEstimated, currency)})!`,
              amountNeeded,
              dailyNeeded,
              additionalBonusEstimated,
            };
          } else if (nextPotentialTier.minRate === 120) {
            smartAlert = {
              type: 'near_gold',
              title: isAr ? '👑 شريحة الفرسان الذهبية (120%): بونص +65%' : '👑 Gold Champions (120%) Ahead',
              message: isAr
                ? `فرصة التتويج بفارس الفرع! متبقي ${distanceToTierPct.toFixed(1)}% للوصول لأعلى شريحة حوافز بالشركة بمضاعفة +65%.`
                : `Top Champion tier within reach! +65% maximum incentive multiplier.`,
              amountNeeded,
              dailyNeeded,
              additionalBonusEstimated,
            };
          }
        }
      }

      return {
        record,
        actualSales,
        targetSales,
        currentRate,
        currentIncentive,
        dailyRunRate,
        projectedAdditionalSales,
        projectedFinalSales,
        projectedFinalRate,
        currentTier,
        projectedTier,
        nextPotentialTier,
        projectedFinalIncentive,
        incentiveDelta,
        smartAlert,
      };
    });
  }, [records, elapsedDays, remainingDays, momentumModifier, currency, isAr]);

  // Total Branch Aggregates
  const totals = useMemo(() => {
    const currentTotalIncentives = employeeProjections.reduce((sum, p) => sum + p.currentIncentive, 0);
    const projectedTotalIncentives = employeeProjections.reduce((sum, p) => sum + p.projectedFinalIncentive, 0);
    const totalGrowthPercent =
      currentTotalIncentives > 0
        ? ((projectedTotalIncentives - currentTotalIncentives) / currentTotalIncentives) * 100
        : 0;

    const nearTierCount = employeeProjections.filter((p) => p.smartAlert !== null).length;
    const projected100Count = employeeProjections.filter((p) => p.projectedFinalRate >= 100).length;

    return {
      currentTotalIncentives,
      projectedTotalIncentives,
      totalGrowthPercent,
      nearTierCount,
      projected100Count,
    };
  }, [employeeProjections]);

  // Share projection via WhatsApp
  const handleShareProjectionWhatsApp = (p: typeof employeeProjections[0]) => {
    const text = isAr
      ? `*توقع الحافز المستقبلي للأيام المتبقية - راية ريتيل* 🪙\n\n` +
        `👤 *المستشار:* ${p.record.employee} ${p.record.employeeId ? `(#${p.record.employeeId})` : ''}\n` +
        `🏢 *الفرع:* ${p.record.branch || 'فرع كونكورد بلازا'}\n` +
        `📅 *الموقف الزمني:* اليوم ${elapsedDays} من ${daysInMonth} (متبقي ${remainingDays} يوماً)\n` +
        `━━━━━━━━━━━━━━━━━━━\n` +
        `💰 *المبيعات الحالية:* ${formatCurrencyNumber(p.actualSales, currency)}\n` +
        `⚡ *المعدل اليومي الحالي:* ${formatCurrencyNumber(Math.round(p.dailyRunRate), currency)}/يوم\n` +
        `🎯 *المبيعات المتوقعة بنهاية الشهر:* ${formatCurrencyNumber(Math.round(p.projectedFinalSales), currency)} (${p.projectedFinalRate.toFixed(1)}%)\n` +
        `━━━━━━━━━━━━━━━━━━━\n` +
        `🪙 *الحافز المكتسب حالياً:* ${formatCurrencyNumber(p.currentIncentive, currency)}\n` +
        `🚀 *الحافز المتوقع بنهاية الشهر:* ${formatCurrencyNumber(p.projectedFinalIncentive, currency)} (+${formatCurrencyNumber(p.incentiveDelta, currency)})\n` +
        `🏆 *الشريحة المتوقعة:* ${p.projectedTier ? p.projectedTier.nameAr : 'شريحة تمهيدية'}\n` +
        (p.smartAlert ? `\n${p.smartAlert.title}\n${p.smartAlert.message}\n` : '') +
        `\n_مع تحيات مدير الفرع: هاني حنا - إدارة المبيعات_`
      : `*Incentive Projection - Raya Retail* 🪙\n` +
        `Consultant: ${p.record.employee}\n` +
        `Projected Sales: ${formatCurrencyNumber(p.projectedFinalSales, currency)} (${p.projectedFinalRate.toFixed(1)}%)\n` +
        `Current Commission: ${formatCurrencyNumber(p.currentIncentive, currency)}\n` +
        `Projected Month-End Commission: ${formatCurrencyNumber(p.projectedFinalIncentive, currency)} (+${formatCurrencyNumber(p.incentiveDelta, currency)})\n`;

    navigator.clipboard.writeText(text);
    setCopiedWhatsappId(p.record.id);

    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    document.body.appendChild(anchor);
    anchor.click();
    setTimeout(() => {
      document.body.removeChild(anchor);
      setCopiedWhatsappId(null);
    }, 3000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-950 via-slate-900 to-emerald-950 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm border border-amber-500/20">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/30 text-amber-300 flex items-center justify-center font-bold shadow-inner">
            <Coins className="w-6 h-6 text-amber-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black tracking-tight">
                {isAr ? 'نموذج توقع الحوافز والعمولات المستقبلية للموظفين' : 'Employee Future Incentive Forecasting Engine'}
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-400/40">
                {isAr ? 'تنبيهات الشرائح الذكية' : 'Smart Tier Radar'}
              </span>
            </div>
            <p className="text-xs text-slate-300">
              {isAr
                ? 'حساب وتيرة البيع اليومية ومحاكاة الحافز المتوقع بنهاية الشهر لكل مستشار مع رصد القريبين من الشرائح الأعلى'
                : 'Projects month-end commission payouts per consultant based on daily run rate and smart incentive tier alerts'}
            </p>
          </div>
        </div>

        {/* Dynamic Controls Strip: Day of month & Momentum */}
        <div className="flex flex-wrap items-center gap-3 bg-white/10 backdrop-blur-xs p-2.5 rounded-xl border border-white/15 text-xs">
          {/* Day slider */}
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-amber-300" />
            <span className="font-bold text-slate-200">
              {isAr ? `اليوم: ${elapsedDays} من ${daysInMonth}` : `Day: ${elapsedDays}/${daysInMonth}`}
            </span>
            <input
              type="range"
              min={5}
              max={daysInMonth - 1}
              value={elapsedDays}
              onChange={(e) => setElapsedDays(Number(e.target.value))}
              className="w-20 accent-amber-400 cursor-pointer"
              title={isAr ? 'تعديل اليوم الحالي لحساب وتيرة الأيام المتبقية' : 'Adjust current day'}
            />
            <span className="text-[10px] text-amber-300 font-bold">
              ({remainingDays} {isAr ? 'يوم باقي' : 'days left'})
            </span>
          </div>

          <div className="h-4 w-px bg-white/20" />

          {/* Momentum Boost */}
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-bold text-slate-200">{isAr ? 'زخم الأيام المتبقية:' : 'Push:'}</span>
            <select
              value={momentumModifier}
              onChange={(e) => setMomentumModifier(Number(e.target.value))}
              className="bg-slate-900 border border-white/20 text-white rounded-lg px-2 py-0.5 text-xs font-bold outline-none cursor-pointer"
            >
              <option value={0.85}>{isAr ? 'هادئ (0.85x)' : 'Calm (-15%)'}</option>
              <option value={1.0}>{isAr ? 'المعدل الحالي (1.0x)' : 'Current Pace (1.0x)'}</option>
              <option value={1.15}>{isAr ? 'زخم قوي (+15%)' : 'Strong Push (+15%)'}</option>
              <option value={1.3}>{isAr ? 'ذروة عروض (+30%)' : 'Peak Push (+30%)'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>{isAr ? 'إجمالي الحوافز المكتسبة حالياً' : 'Current Earned Pool'}</span>
            <Coins className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
            {formatCurrencyNumber(totals.currentTotalIncentives, currency)}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {isAr ? 'مستحقة الصرف حتى تاريخ اليوم' : 'Accrued to date'}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-300 bg-gradient-to-br from-emerald-50/50 to-white shadow-xs">
          <div className="flex items-center justify-between text-xs text-emerald-800 font-bold mb-1">
            <span>{isAr ? 'توقع محفظة الحوافز بنهاية الشهر' : 'Projected Month-End Pool'}</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-700 font-mono">
            {formatCurrencyNumber(totals.projectedTotalIncentives, currency)}
          </div>
          <div className="text-[11px] text-emerald-800 font-bold mt-0.5 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>+{totals.totalGrowthPercent.toFixed(1)}% {isAr ? 'نمو متوقع للحوافز' : 'projected gain'}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-300 bg-gradient-to-br from-amber-50/40 to-white shadow-xs">
          <div className="flex items-center justify-between text-xs text-amber-800 font-bold mb-1">
            <span>{isAr ? 'تنبيهات الشرائح الذكية' : 'Tier Upgrade Alerts'}</span>
            <Zap className="w-4 h-4 text-amber-600 animate-bounce" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-900 font-mono">
            {totals.nearTierCount} {isAr ? 'موظفين على وشك الترقية' : 'Nearing next tier'}
          </div>
          <p className="text-[11px] text-amber-800 mt-0.5 font-medium">
            {isAr ? 'على بعد خطوة من بونص أعلى' : 'Within reach of higher tier'}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-purple-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>{isAr ? 'متوقع كسرهم 100%+' : 'Projected 100%+ Achievers'}</span>
            <Award className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-purple-950 font-mono">
            {totals.projected100Count} / {employeeProjections.length}
          </div>
          <p className="text-[11px] text-purple-700 font-bold mt-0.5">
            {isAr ? 'كامل فريق كونكورد بلازا مرشح للتكريم' : 'All staff trending to achieve target'}
          </p>
        </div>
      </div>

      {/* Raya Incentive Tiers Legend Strip */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>{isAr ? 'جدول شرائح وبونصات حوافز شركة راية ريتيل الرسمية:' : 'Official Raya Incentive Tiers:'}</span>
          </div>
          <span className="text-[11px] text-slate-500 font-normal">
            {isAr ? 'تتضاعف الحوافز تلقائياً عند تجاوز التارجت' : 'Multipliers apply on total commission'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 pt-1 text-xs">
          {INCENTIVE_TIERS.map((tier) => (
            <div key={tier.id} className={`p-2.5 rounded-xl border bg-white ${tier.badgeBg}`}>
              <div className="flex items-center justify-between font-bold mb-1">
                <span className={tier.badgeText}>{isAr ? tier.nameAr : tier.nameEn}</span>
                <span className="font-mono text-[11px] px-1.5 py-0.2 rounded bg-white shadow-2xs font-extrabold text-slate-800">
                  {tier.bonusMultiplier}x
                </span>
              </div>
              <p className="text-[11px] text-slate-600">
                {tier.bonusMultiplier === 1.0
                  ? (isAr ? 'الاستحقاق الأساسي لكامل عمولات المنتجات' : '100% of standard commission')
                  : (isAr ? `مضاعفة إضافية +${Math.round((tier.bonusMultiplier - 1) * 100)}% على الحافز` : `+${Math.round((tier.bonusMultiplier - 1) * 100)}% bonus booster`)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Individual Employee Projection Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-700" />
            <span>{isAr ? 'توقعات الحوافز والتنبيهات الذكية لكل مستشار:' : 'Consultant Incentive Forecasts & Alerts:'}</span>
          </h4>
          <span className="text-xs text-slate-500">
            {isAr ? 'محسوبة بناءً على وتيرة التحقيق اليومية' : 'Calculated via daily run-rate velocity'}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {employeeProjections.map((p) => {
            const isNearingAlert = p.smartAlert !== null;
            const is100 = p.projectedFinalRate >= 100;

            return (
              <div
                key={p.record.id}
                className={`p-5 rounded-2xl border transition-all bg-white shadow-2xs hover:shadow-md ${
                  isNearingAlert
                    ? 'border-amber-400 ring-2 ring-amber-400/20'
                    : is100
                    ? 'border-emerald-300'
                    : 'border-slate-200'
                }`}
              >
                {/* Top Row: Info + WhatsApp button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-900 to-emerald-950 text-white flex items-center justify-center font-black text-base shadow-xs">
                      {p.record.employee.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h5 className="font-extrabold text-slate-900 text-base">{p.record.employee}</h5>
                        {p.record.employeeId && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-100 text-slate-700">
                            #{p.record.employeeId}
                          </span>
                        )}
                        {p.projectedTier && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${p.projectedTier.badgeBg} ${p.projectedTier.badgeText}`}>
                            {isAr ? p.projectedTier.nameAr : p.projectedTier.nameEn}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {p.record.branch || (isAr ? 'فرع راية كونكورد بلازا' : 'Raya Concorde Plaza')} · {isAr ? 'مستشار مبيعات' : 'Sales Advisor'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => handleShareProjectionWhatsApp(p)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95 ${
                        copiedWhatsappId === p.record.id
                          ? 'bg-emerald-600 text-white ring-2 ring-emerald-300'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300'
                      }`}
                      title={isAr ? 'مشاركة بطاقة توقع الحافز عبر واتساب' : 'Share projection card via WhatsApp'}
                    >
                      {copiedWhatsappId === p.record.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-white" />
                          <span>{isAr ? 'تم نسخ التوقع والفتح!' : 'Copied!'}</span>
                        </>
                      ) : (
                        <>
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-600 fill-emerald-100" />
                          <span>{isAr ? 'مشاركة التوقع بالواتساب' : 'WhatsApp'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Smart Alert Banner (If employee is close to higher tier) */}
                {p.smartAlert && (
                  <div className="mb-4 p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
                    <div className="flex items-start gap-2.5">
                      <Zap className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
                      <div>
                        <strong className="font-extrabold text-amber-900 block text-xs mb-0.5">
                          {p.smartAlert.title}
                        </strong>
                        <p className="text-amber-800 leading-relaxed text-[11px]">{p.smartAlert.message}</p>
                      </div>
                    </div>
                    <div className="bg-white/80 p-2 rounded-lg border border-amber-200 text-center shrink-0 self-end sm:self-auto">
                      <span className="text-[10px] text-slate-500 block">{isAr ? 'المطلوب يومياً:' : 'Daily Push:'}</span>
                      <strong className="font-mono text-emerald-800 text-xs">
                        +{formatCurrencyNumber(p.smartAlert.dailyNeeded, currency)}/يوم
                      </strong>
                    </div>
                  </div>
                )}

                {/* Metrics 4-Column Strip */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-slate-50/80 p-3.5 rounded-xl border border-slate-200">
                  {/* Actual vs Target */}
                  <div>
                    <span className="text-[10px] text-slate-500 block mb-0.5">{isAr ? 'المبيعات الحالية / التارجت' : 'Actual / Target'}</span>
                    <div className="font-mono font-bold text-slate-900">
                      {formatCurrencyNumber(p.actualSales, currency)}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      / {formatCurrencyNumber(p.targetSales, currency)} ({formatPercent(p.currentRate)})
                    </div>
                  </div>

                  {/* Daily Run Rate */}
                  <div>
                    <span className="text-[10px] text-slate-500 block mb-0.5">{isAr ? 'المعدل اليومي الحالي' : 'Daily Run Rate'}</span>
                    <div className="font-mono font-bold text-emerald-800">
                      {formatCurrencyNumber(Math.round(p.dailyRunRate), currency)}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {isAr ? `خلال ${elapsedDays} يوماً سابقة` : `${elapsedDays} days`}
                    </div>
                  </div>

                  {/* Projected Sales */}
                  <div>
                    <span className="text-[10px] text-slate-500 block mb-0.5">{isAr ? 'المبيعات المتوقعة بنهاية الشهر' : 'Projected Sales'}</span>
                    <div className="font-mono font-bold text-purple-900">
                      {formatCurrencyNumber(Math.round(p.projectedFinalSales), currency)}
                    </div>
                    <div className="text-[10px] font-bold text-purple-700">
                      {p.projectedFinalRate.toFixed(1)}% {isAr ? 'نسبة الإغلاق' : 'Close Rate'}
                    </div>
                  </div>

                  {/* Incentive Comparison: Current vs Projected */}
                  <div className="bg-amber-100/60 p-2 rounded-lg border border-amber-200">
                    <span className="text-[10px] text-amber-900 font-bold block mb-0.5">{isAr ? 'توقع الحافز النهائي' : 'Projected Payout'}</span>
                    <div className="font-mono font-black text-amber-950 text-sm">
                      {formatCurrencyNumber(p.projectedFinalIncentive, currency)}
                    </div>
                    <div className="text-[10px] text-emerald-800 font-extrabold flex items-center gap-1">
                      <span>+{formatCurrencyNumber(p.incentiveDelta, currency)}</span>
                      <span>({isAr ? 'زيادة متوقعة' : 'gain'})</span>
                    </div>
                  </div>
                </div>

                {/* Progress toward next tier */}
                {p.nextPotentialTier && (
                  <div className="mt-3 pt-2">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-slate-600 font-medium">
                        {isAr ? 'التقدم نحو:' : 'Progress to:'}{' '}
                        <strong className="text-slate-800">{isAr ? p.nextPotentialTier.nameAr : p.nextPotentialTier.nameEn}</strong>
                      </span>
                      <span className="font-mono font-bold text-slate-700">
                        {Math.min(100, (p.projectedFinalRate / p.nextPotentialTier.minRate) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden shadow-inner">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-500"
                        style={{
                          width: `${Math.min(100, (p.projectedFinalRate / p.nextPotentialTier.minRate) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
