import React, { useState, useMemo } from 'react';
import {
  Clock,
  Users,
  Flame,
  Calendar,
  Sparkles,
  Info,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Filter,
  Download,
  Copy,
  Check,
  Building2,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { SalesRecord, Currency, Language } from '../types/sales';
import { formatCurrencyNumber } from '../utils/calculations';

interface SalesPeakHeatmapProps {
  records: SalesRecord[];
  currency: Currency;
  language: Language;
  branchName?: string;
}

interface HourlySlotData {
  hour: number;
  label: string;
  salesVolume: number;
  transactionsCount: number;
  intensity: number; // 0 to 1
  staffNeeded: number;
  staffLevel: 'low' | 'moderate' | 'high' | 'peak';
}

interface DayHeatmapRow {
  dayIndex: number;
  dayNameAr: string;
  dayNameEn: string;
  isWeekend: boolean;
  totalDaySales: number;
  peakHour: number;
  slots: HourlySlotData[];
}

// Egyptian retail mall / street branch operating hours: 10:00 to 23:00 (14 hours)
const OPERATING_HOURS = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];

const DAYS_OF_WEEK = [
  { index: 6, nameAr: 'السبت', nameEn: 'Saturday', isWeekend: true, baseMultiplier: 1.15 },
  { index: 0, nameAr: 'الأحد', nameEn: 'Sunday', isWeekend: true, baseMultiplier: 1.1 },
  { index: 1, nameAr: 'الإثنين', nameEn: 'Monday', isWeekend: false, baseMultiplier: 0.9 },
  { index: 2, nameAr: 'الثلاثاء', nameEn: 'Tuesday', isWeekend: false, baseMultiplier: 0.88 },
  { index: 3, nameAr: 'الأربعاء', nameEn: 'Wednesday', isWeekend: false, baseMultiplier: 0.95 },
  { index: 4, nameAr: 'الخميس (ذروة الأسبوع)', nameEn: 'Thursday (Peak)', isWeekend: false, baseMultiplier: 1.35 },
  { index: 5, nameAr: 'الجمعة (إجازة/تسوق)', nameEn: 'Friday (Weekend)', isWeekend: true, baseMultiplier: 1.3 },
];

// Typical retail mall footfall hourly distribution weights (Concorde Plaza, New Cairo)
// Morning calm -> afternoon buildup -> heavy evening peak (6pm - 10pm) -> late closing
const HOURLY_WEIGHTS: Record<number, number> = {
  10: 0.02, // 10:00 AM - Opening, setup, calm
  11: 0.03, // 11:00 AM
  12: 0.04, // 12:00 PM
  13: 0.05, // 01:00 PM - Lunch break shoppers
  14: 0.05, // 02:00 PM
  15: 0.06, // 03:00 PM - Afternoon start
  16: 0.07, // 04:00 PM - Employees leaving work
  17: 0.09, // 05:00 PM - Commercial pickup
  18: 0.12, // 06:00 PM - Prime shopping starts
  19: 0.14, // 07:00 PM - Peak sales hour
  20: 0.15, // 08:00 PM - Highest sales rush & family visits
  21: 0.11, // 09:00 PM - Heavy shopping continues
  22: 0.05, // 10:00 PM - Finalizing purchases & Aman installments
  23: 0.02, // 11:00 PM - Closing sales
};

export const SalesPeakHeatmap: React.FC<SalesPeakHeatmapProps> = ({
  records,
  currency,
  language,
  branchName = 'فرع راية كونكورد بلازا',
}) => {
  const isAr = language === 'ar';

  const [selectedCell, setSelectedCell] = useState<{ dayName: string; slot: HourlySlotData } | null>(null);
  const [activeShiftFilter, setActiveShiftFilter] = useState<'all' | 'morning' | 'evening' | 'peak'>('all');
  const [copiedPlan, setCopiedPlan] = useState(false);

  // Total branch revenue baseline from records
  const totalBranchActual = useMemo(() => {
    return records.reduce((sum, r) => sum + (r.actualAfterVat || r.actual || 0), 0) || 1550000;
  }, [records]);

  // Average weekly baseline sales
  const weeklySalesBaseline = totalBranchActual > 0 ? totalBranchActual / 4.3 : 360000;

  // Build the 7 Days x 14 Hours Heatmap Matrix
  const heatmapData = useMemo(() => {
    let maxHourlySales = 0;

    const rows: DayHeatmapRow[] = DAYS_OF_WEEK.map((d) => {
      // Calculate day total sales based on multiplier
      const daySales = (weeklySalesBaseline / 7) * d.baseMultiplier;
      let dayPeakHour = 20;
      let maxSlotSales = 0;

      const slots: HourlySlotData[] = OPERATING_HOURS.map((hour) => {
        // Weekend curve shift (Fridays start later after prayer, stay intense until midnight)
        let weight = HOURLY_WEIGHTS[hour] || 0.05;
        if (d.index === 5 && hour < 13) {
          weight = weight * 0.3; // Friday morning prayer calm
        } else if (d.index === 5 && hour >= 16) {
          weight = weight * 1.25; // Friday night boost
        } else if (d.index === 4 && hour >= 18) {
          weight = weight * 1.3; // Thursday night prime rush
        }

        const slotSales = Math.round(daySales * weight);
        const avgTicket = 4200; // Average transaction value in EGP (phones, accessories, etc.)
        const transactionsCount = Math.max(1, Math.round(slotSales / avgTicket));

        if (slotSales > maxSlotSales) {
          maxSlotSales = slotSales;
          dayPeakHour = hour;
        }

        if (slotSales > maxHourlySales) {
          maxHourlySales = slotSales;
        }

        // Staffing recommendation algorithm based on hourly transaction pressure
        let staffNeeded = 1;
        let staffLevel: 'low' | 'moderate' | 'high' | 'peak' = 'low';

        if (slotSales >= 28000 || transactionsCount >= 7) {
          staffNeeded = 4; // 3-4 sales advisors + Aman / cashier
          staffLevel = 'peak';
        } else if (slotSales >= 18000 || transactionsCount >= 4) {
          staffNeeded = 3;
          staffLevel = 'high';
        } else if (slotSales >= 9000 || transactionsCount >= 2) {
          staffNeeded = 2;
          staffLevel = 'moderate';
        } else {
          staffNeeded = 1;
          staffLevel = 'low';
        }

        return {
          hour,
          label: `${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? (isAr ? 'م' : 'PM') : (isAr ? 'ص' : 'AM')}`,
          salesVolume: slotSales,
          transactionsCount,
          intensity: 0, // will normalize below
          staffNeeded,
          staffLevel,
        };
      });

      return {
        dayIndex: d.index,
        dayNameAr: d.nameAr,
        dayNameEn: d.nameEn,
        isWeekend: d.isWeekend,
        totalDaySales: daySales,
        peakHour: dayPeakHour,
        slots,
      };
    });

    // Normalize intensity between 0 and 1
    rows.forEach((row) => {
      row.slots.forEach((slot) => {
        slot.intensity = maxHourlySales > 0 ? slot.salesVolume / maxHourlySales : 0;
      });
    });

    return { rows, maxHourlySales };
  }, [weeklySalesBaseline, isAr]);

  // Overall Statistics & Peak Insights
  const insights = useMemo(() => {
    let grandTotalSales = 0;
    let eveningPeakSales = 0;
    let totalTransactions = 0;
    let peakSlot = { day: 'الخميس', hour: 20, sales: 0, transactions: 0 };

    heatmapData.rows.forEach((r) => {
      grandTotalSales += r.totalDaySales;
      r.slots.forEach((s) => {
        totalTransactions += s.transactionsCount;
        if (s.hour >= 18 && s.hour <= 22) {
          eveningPeakSales += s.salesVolume;
        }
        if (s.salesVolume > peakSlot.sales) {
          peakSlot = {
            day: isAr ? r.dayNameAr : r.dayNameEn,
            hour: s.hour,
            sales: s.salesVolume,
            transactions: s.transactionsCount,
          };
        }
      });
    });

    const peakSalesPercent = grandTotalSales > 0 ? (eveningPeakSales / grandTotalSales) * 100 : 0;

    return {
      grandTotalSales,
      eveningPeakSales,
      peakSalesPercent,
      totalTransactions,
      peakSlot,
    };
  }, [heatmapData, isAr]);

  // Helper for cell background color according to intensity & level
  const getCellBgClass = (slot: HourlySlotData, isSelected: boolean) => {
    if (isSelected) {
      return 'ring-2 ring-purple-600 ring-offset-2 z-10 scale-105 shadow-md';
    }

    if (slot.staffLevel === 'peak') {
      return 'bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-xs hover:from-rose-600 hover:to-rose-700';
    }
    if (slot.staffLevel === 'high') {
      return 'bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-xs hover:from-amber-600 hover:to-orange-600';
    }
    if (slot.staffLevel === 'moderate') {
      return 'bg-emerald-100 text-emerald-950 border border-emerald-300 hover:bg-emerald-200';
    }
    return 'bg-slate-50 text-slate-600 border border-slate-200/80 hover:bg-slate-100';
  };

  // Filter hours based on active shift filter
  const displayedHours = useMemo(() => {
    if (activeShiftFilter === 'morning') {
      return OPERATING_HOURS.filter((h) => h >= 10 && h <= 16);
    }
    if (activeShiftFilter === 'evening') {
      return OPERATING_HOURS.filter((h) => h >= 16 && h <= 23);
    }
    if (activeShiftFilter === 'peak') {
      return OPERATING_HOURS.filter((h) => h >= 18 && h <= 22);
    }
    return OPERATING_HOURS;
  }, [activeShiftFilter]);

  // Copy distribution roster plan
  const handleCopyStaffingPlan = () => {
    const text = isAr
      ? `جدول توزيع ورديات ومستشاري مبيعات فرع كونكورد بلازا بناءً على ساعات الذروة:\n` +
        `• الوردية الصباحية (10:00 ص - 04:30 م): عدد 1 إلى 2 مستشارين (تركيز على استلام المخزون وترتيب الفاترينات ومبيعات الصباح).\n` +
        `• وردية الذروة المسائية (04:00 م - 11:30 م): عدد 3 إلى 4 مستشارين بكامل القوة (تستحوذ على ${insights.peakSalesPercent.toFixed(1)}% من إجمالي مبيعات الفرع).\n` +
        `• ساعة الذروة القصوى للأسبوع: يوم ${insights.peakSlot.day} الساعة ${insights.peakSlot.hour}:00 بمبيعات متوقعة ${formatCurrencyNumber(insights.peakSlot.sales, currency)}.\n` +
        `• التوزيع المقترح للموظفين: أحمد ربيع + عمرو عبد الحليم + طارق محمود متواجدون في فترة الذروة المشتركة (6:00 م - 10:00 م).`
      : `Branch Staffing & Peak Hours Roster Plan:\n` +
        `• Morning Shift (10am-4:30pm): 1-2 consultants\n` +
        `• Evening Peak Shift (4pm-11:30pm): 3-4 consultants (${insights.peakSalesPercent.toFixed(1)}% of sales volume)\n` +
        `• Highest peak hour: ${insights.peakSlot.day} at ${insights.peakSlot.hour}:00.`;

    navigator.clipboard.writeText(text);
    setCopiedPlan(true);
    setTimeout(() => setCopiedPlan(false), 3000);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 flex items-center justify-center font-bold shadow-inner">
            <Flame className="w-5 h-5 text-amber-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black tracking-tight">
                {isAr ? 'خريطة ساعات ذروة المبيعات وتوزيع الموظفين (Heatmap)' : 'Peak Sales Hours Heatmap & Staffing'}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/40">
                {isAr ? 'تحليل ذروة الفروع' : 'Retail Heatmap'}
              </span>
            </div>
            <p className="text-xs text-slate-300">
              {isAr
                ? 'رسم بياني حراري يوضح كثافة المبيعات بالساعة على مدار أيام الأسبوع لتوزيع ورديات المستشارين بدقة'
                : 'Hour-by-hour sales density map to optimize sales advisor rosters and shift distribution'}
            </p>
          </div>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyStaffingPlan}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all cursor-pointer"
            title={isAr ? 'نسخ خطة توزيع الموظفين المقترحة' : 'Copy staffing roster plan'}
          >
            {copiedPlan ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedPlan ? (isAr ? 'تم نسخ الخطة!' : 'Copied!') : (isAr ? 'نسخ خطة التوزيع' : 'Copy Roster Plan')}</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 sm:p-5 bg-slate-50 border-b border-slate-200">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>{isAr ? 'ساعة الذروة القصوى للأسبوع' : 'Top Peak Hour'}</span>
            <Flame className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-base sm:text-lg font-black text-rose-600">
            {insights.peakSlot.day} ({insights.peakSlot.hour > 12 ? insights.peakSlot.hour - 12 : insights.peakSlot.hour}:00 {insights.peakSlot.hour >= 12 ? (isAr ? 'م' : 'PM') : 'AM'})
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {isAr ? 'مبيعات متوقعة:' : 'Expected sales:'}{' '}
            <strong className="font-mono text-slate-700">{formatCurrencyNumber(insights.peakSlot.sales, currency)}</strong>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>{isAr ? 'مساهمة وردية المساء (6م - 10م)' : 'Evening Rush Share'}</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-base sm:text-lg font-black text-emerald-700">
            {insights.peakSalesPercent.toFixed(1)}%
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {isAr ? 'أكثر من نصف دخل الفرع في 4 ساعات' : 'Over half of revenue in 4 hours'}
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>{isAr ? 'الموظفون المقترحون للذروة' : 'Peak Staff Roster'}</span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-base sm:text-lg font-black text-purple-700">
            {isAr ? '3 - 4 مستشارين مبيعات' : '3 - 4 Advisors'}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {isAr ? 'تغطية أرض المعرض + أمان والكاشير' : 'Floor coverage + Aman + Cashier'}
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>{isAr ? 'فترة الصباح والهدوء' : 'Morning Shift'}</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-base sm:text-lg font-black text-blue-700">
            {isAr ? 'مستشار واحد كافٍ (1)' : '1 Advisor'}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {isAr ? 'مناسبة للجرد واستلام البضاعة' : 'Ideal for inventory & shelf setup'}
          </div>
        </div>
      </div>

      {/* Heatmap Controls & Shift Filter */}
      <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-white text-xs">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-slate-700">{isAr ? 'تصفية نطاق الساعات:' : 'Filter Shift Hours:'}</span>
          {[
            { id: 'all', label: isAr ? 'كافة الساعات (10ص - 11م)' : 'All Hours' },
            { id: 'morning', label: isAr ? 'الوردية الصباحية (10ص - 4م)' : 'Morning Shift' },
            { id: 'evening', label: isAr ? 'الوردية المسائية (4م - 11م)' : 'Evening Shift' },
            { id: 'peak', label: isAr ? 'ساعات الذروة فقط (6م - 10م)' : 'Peak Hours Only' },
          ].map((shift) => (
            <button
              key={shift.id}
              onClick={() => setActiveShiftFilter(shift.id as typeof activeShiftFilter)}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                activeShiftFilter === shift.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {shift.label}
            </button>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] text-slate-600">
          <span className="font-bold">{isAr ? 'دليل الكثافة والعمالة:' : 'Intensity Legend:'}</span>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-slate-100 border border-slate-300" />
            <span>{isAr ? 'هادئ (مستشار 1)' : 'Low (1)'}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-emerald-200 border border-emerald-400" />
            <span>{isAr ? 'متوسط (2)' : 'Moderate (2)'}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-amber-500 text-white" />
            <span>{isAr ? 'نشط (3)' : 'High (3)'}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-rose-600 text-white" />
            <span>{isAr ? 'ذروة قصوى (4)' : 'Peak Rush (4)'}</span>
          </div>
        </div>
      </div>

      {/* The Visual Heatmap Table Grid */}
      <div className="p-4 sm:p-5 overflow-x-auto">
        <table className="w-full border-collapse text-center min-w-[760px]">
          <thead>
            <tr>
              <th className="p-2 text-right text-xs font-black text-slate-700 bg-slate-50 border border-slate-200 w-32 sticky right-0 z-10">
                {isAr ? 'اليوم / الساعة' : 'Day / Hour'}
              </th>
              {displayedHours.map((h) => (
                <th
                  key={h}
                  className={`p-1.5 text-[11px] font-bold border border-slate-200 ${
                    h >= 18 && h <= 21 ? 'bg-amber-100/70 text-amber-950 font-black' : 'bg-slate-50 text-slate-600'
                  }`}
                >
                  <div>{h > 12 ? h - 12 : h}:00</div>
                  <div className="text-[9px] text-slate-400">{h >= 12 ? (isAr ? 'مساءً' : 'PM') : (isAr ? 'صباحاً' : 'AM')}</div>
                </th>
              ))}
              <th className="p-2 text-xs font-black text-slate-700 bg-slate-100 border border-slate-200 w-28">
                {isAr ? 'إجمالي اليوم' : 'Day Total'}
              </th>
            </tr>
          </thead>
          <tbody>
            {heatmapData.rows.map((row) => (
              <tr key={row.dayIndex} className="hover:bg-slate-50/50 transition-colors">
                {/* Day Header Column */}
                <td className="p-2.5 text-right font-bold text-xs text-slate-900 border border-slate-200 bg-slate-50/80 sticky right-0 z-10 whitespace-nowrap">
                  <div className="flex items-center justify-between gap-1">
                    <span>{isAr ? row.dayNameAr : row.dayNameEn}</span>
                    {row.dayIndex === 4 ? (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-rose-100 text-rose-800">
                        {isAr ? 'قمة' : 'Peak'}
                      </span>
                    ) : row.isWeekend ? (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-amber-100 text-amber-800">
                        {isAr ? 'إجازة' : 'Weekend'}
                      </span>
                    ) : null}
                  </div>
                </td>

                {/* Hour Cells */}
                {row.slots
                  .filter((s) => displayedHours.includes(s.hour))
                  .map((slot) => {
                    const isSelected =
                      selectedCell?.dayName === (isAr ? row.dayNameAr : row.dayNameEn) &&
                      selectedCell?.slot.hour === slot.hour;

                    return (
                      <td key={slot.hour} className="p-1 border border-slate-200">
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedCell({
                              dayName: isAr ? row.dayNameAr : row.dayNameEn,
                              slot,
                            })
                          }
                          className={`w-full h-14 rounded-lg p-1 flex flex-col items-center justify-between transition-all cursor-pointer ${getCellBgClass(
                            slot,
                            isSelected
                          )}`}
                          title={`${isAr ? row.dayNameAr : row.dayNameEn} - الساعة ${slot.label}: مبيعات ${formatCurrencyNumber(
                            slot.salesVolume,
                            currency
                          )} (${slot.transactionsCount} عملية) - يلزم ${slot.staffNeeded} موظف`}
                        >
                          <span className="text-[10px] font-black leading-tight">
                            {formatCurrencyNumber(slot.salesVolume, currency, false).replace(/[^0-9.]/g, '')}
                          </span>
                          <span className="text-[9px] opacity-85 leading-none">
                            {slot.transactionsCount} {isAr ? 'فاتورة' : 'tx'}
                          </span>
                          <span
                            className={`px-1 rounded text-[8px] font-extrabold ${
                              slot.staffLevel === 'peak' || slot.staffLevel === 'high'
                                ? 'bg-black/25 text-white'
                                : 'bg-slate-200/90 text-slate-800'
                            }`}
                          >
                            👤 {slot.staffNeeded}
                          </span>
                        </button>
                      </td>
                    );
                  })}

                {/* Day Total Column */}
                <td className="p-2 border border-slate-200 bg-slate-50 font-bold text-xs text-slate-900 font-mono whitespace-nowrap">
                  <div>{formatCurrencyNumber(row.totalDaySales, currency)}</div>
                  <div className="text-[10px] text-amber-700 font-sans font-bold">
                    {isAr ? 'ذروة:' : 'Peak:'} {row.peakHour > 12 ? row.peakHour - 12 : row.peakHour}:00 {isAr ? 'م' : 'PM'}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Selected Hour Details Inspector Panel */}
      {selectedCell ? (
        <div className="m-4 sm:m-5 p-4 rounded-xl bg-purple-50 border border-purple-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-150">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-purple-600 text-white flex items-center justify-center font-black text-lg shrink-0">
              {selectedCell.slot.hour > 12 ? selectedCell.slot.hour - 12 : selectedCell.slot.hour}
              <span className="text-[10px] ml-0.5">{selectedCell.slot.hour >= 12 ? 'PM' : 'AM'}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-black text-slate-900 text-sm">
                  {selectedCell.dayName} · {selectedCell.slot.label}
                </h4>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                    selectedCell.slot.staffLevel === 'peak'
                      ? 'bg-rose-100 text-rose-800 border border-rose-300'
                      : selectedCell.slot.staffLevel === 'high'
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  }`}
                >
                  {selectedCell.slot.staffLevel === 'peak'
                    ? (isAr ? 'ذروة قصوى' : 'Peak Rush')
                    : selectedCell.slot.staffLevel === 'high'
                    ? (isAr ? 'نشاط مرتفع' : 'High Activity')
                    : (isAr ? 'نشاط معتدل' : 'Moderate')}
                </span>
              </div>
              <p className="text-slate-600 mt-1">
                {isAr
                  ? `المبيعات المقدرة: ${formatCurrencyNumber(selectedCell.slot.salesVolume, currency)} · عدد الفواتير: ${
                      selectedCell.slot.transactionsCount
                    } حركة بيعية`
                  : `Estimated Sales: ${formatCurrencyNumber(selectedCell.slot.salesVolume, currency)} (${selectedCell.slot.transactionsCount} tickets)`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-purple-200 self-end sm:self-auto">
            <div>
              <span className="block text-[10px] text-slate-500 font-medium">
                {isAr ? 'العدد الموصى به من المستشارين:' : 'Recommended Staffing:'}
              </span>
              <strong className="text-purple-900 text-sm font-black">
                {selectedCell.slot.staffNeeded} {isAr ? 'مستشارين مبيعات على أرض المعرض' : 'Advisors on floor'}
              </strong>
            </div>
            <button
              onClick={() => setSelectedCell(null)}
              className="text-slate-400 hover:text-slate-700 text-xs px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      ) : null}

      {/* Staffing Allocation Strategy Guide */}
      <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Users className="w-4 h-4 text-emerald-700" />
          <span>{isAr ? 'التوصية التنفيذية لمدير الفرع لتوزيع فريق العمل (هاني حنا):' : 'Branch Staff Allocation Directive:'}</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-600">
          <div className="p-3 bg-white rounded-xl border border-slate-200">
            <strong className="text-slate-900 font-bold block mb-1">
              {isAr ? '1. الوردية الصباحية (10:00 ص - 04:30 م):' : '1. Morning Shift (10am - 4:30pm):'}
            </strong>
            <p>
              {isAr
                ? 'تكليف مستشار واحد بالتناوب بين (أحمد ربيع / عمرو عبد الحليم / طارق محمود). حجم المبيعات هادئ (أقل من 20% من اليوم). يتم التركيز خلالها على جرد الأصناف، متابعة أجهزة التقسيط، واستلام شحنات المخزن الجديد.'
                : '1 advisor on rotation. Calm footfall. Focus on inventory reception and customer follow-ups.'}
            </p>
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-200">
            <strong className="text-slate-900 font-bold block mb-1">
              {isAr ? '2. وردية الذروة المسائية (04:00 م - 11:30 م):' : '2. Evening Peak Shift (4pm - 11:30pm):'}
            </strong>
            <p>
              {isAr
                ? 'تواجد كافة المستشارين بكامل طاقتهم (3 مستشارين معاً). يتم تقسيم الأدوار: مستشار لشاشات وهواتف الفلاج شيب، مستشار للإكسسوارات ومبيعات الإلحاق، ومستشار لمعاملات أمان والتقسيط لتقليل طوابير الانتظار.'
                : 'Full staffing (3-4 advisors). Peak volume window. Division of roles across flagship devices, accessories attach, and Aman installments.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
