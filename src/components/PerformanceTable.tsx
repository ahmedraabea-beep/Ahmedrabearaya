import React, { useState, useMemo } from 'react';
import { SalesRecord, Currency, Language } from '../types/sales';
import { formatCurrencyNumber, formatPercent } from '../utils/calculations';
import { translations } from '../utils/i18n';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Trash2,
  UserPlus,
  Coins,
  ChevronRight,
  ChevronLeft,
  Zap,
  Trophy,
  Download,
  MessageCircle,
  Check,
  Copy,
  Share2,
  Clock,
  Flame,
  Sun,
  Moon,
  Calendar,
  Sparkles,
  SlidersHorizontal,
  Briefcase,
  Layers,
  TrendingUp,
} from 'lucide-react';
import { exportRecordsToExcel } from '../utils/excelParser';
import {
  ShiftType,
  EmployeeShiftAssignment,
} from '../types/sales';
import {
  SHIFT_CONFIGS,
  getTodayDateString,
  getPersistedShiftAssignments,
  savePersistedShiftAssignments,
  autoOptimizeShiftSchedule,
  exportShiftScheduleToExcel,
  calculateShiftSummary,
} from '../utils/shiftService';
import { calculateEmployeeEfficiency } from './EmployeeDeepAnalytics';

interface PerformanceTableProps {
  records: SalesRecord[];
  currency: Currency;
  onEditRecord: (record: SalesRecord) => void;
  onDeleteRecord: (id: string) => void;
  onOpenAddRecord: () => void;
  onResetFilters?: () => void;
  onViewIncentive?: (record: SalesRecord) => void;
  language: Language;
}

type SortField = 'employee' | 'employeeId' | 'branch' | 'target' | 'actual' | 'difference' | 'achievementRate' | 'earnedIncentive' | 'efficiency';
type SortDirection = 'asc' | 'desc';

export const PerformanceTable: React.FC<PerformanceTableProps> = ({
  records,
  currency,
  onEditRecord,
  onDeleteRecord,
  onOpenAddRecord,
  onResetFilters,
  onViewIncentive,
  language,
}) => {
  const t = translations[language];
  const [sortField, setSortField] = useState<SortField>('actual');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [copiedWhatsappId, setCopiedWhatsappId] = useState<string | null>(null);

  // Shift Management State (User Request for PerformanceTable)
  const [tableMode, setTableMode] = useState<'sales' | 'shifts'>('sales');
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [shifts, setShifts] = useState<EmployeeShiftAssignment[]>(() => getPersistedShiftAssignments(records));

  // Sync shifts when records change
  React.useEffect(() => {
    setShifts(getPersistedShiftAssignments(records));
  }, [records]);

  // Listen to cross-component shift updates
  React.useEffect(() => {
    const handleShiftsUpdated = () => {
      setShifts(getPersistedShiftAssignments(records));
    };
    window.addEventListener('raya-shifts-updated', handleShiftsUpdated);
    return () => window.removeEventListener('raya-shifts-updated', handleShiftsUpdated);
  }, [records]);

  const handleQuickShiftChange = (employeeName: string, newShift: ShiftType) => {
    const updated = shifts.map((s) => {
      if (s.employeeName !== employeeName) return s;
      const cfg = SHIFT_CONFIGS[newShift];
      const durationHours = cfg.durationHours;
      const hourlyActual = durationHours > 0 ? Math.round(s.actualSales / durationHours) : 0;
      const hourlyTarget = durationHours > 0 ? Math.round(s.targetSales / durationHours) : 0;

      return {
        ...s,
        shiftType: newShift,
        shiftNameAr: cfg.nameAr,
        shiftNameEn: cfg.nameEn,
        shiftHours: cfg.hours,
        durationHours,
        peakHoursCovered: cfg.peakHoursCovered,
        peakCoveragePercentage: cfg.peakCoveragePct,
        hourlyActual,
        hourlyTarget,
      };
    });

    setShifts(updated);
    savePersistedShiftAssignments(updated);
  };

  const handleExportShifts = () => {
    exportShiftScheduleToExcel(shifts, getTodayDateString(), language);
  };

  const handleAutoOptimizeShifts = () => {
    const optimized = autoOptimizeShiftSchedule(records);
    setShifts(optimized);
  };

  // Summary stats for Concorde Plaza shifts
  const shiftSummary = useMemo(
    () => calculateShiftSummary(shifts, getTodayDateString()),
    [shifts]
  );

  const handleShareShiftWhatsApp = (record: SalesRecord) => {
    const shift = shifts.find((s) => s.employeeName === record.employee);
    if (!shift) return;

    const shiftText =
      language === 'ar'
        ? `*إخطار نوبة العمل الرسمية - راية فرع كونكورد بلازا* 📱\n\n` +
          `👤 *المستشار:* ${shift.employeeName} (#${shift.employeeId})\n` +
          `🏢 *الفرع:* ${shift.branch}\n` +
          `📅 *التاريخ:* ${shift.date}\n` +
          `━━━━━━━━━━━━━━━━━━━\n` +
          `⏰ *الوردية المعتمدة:* ${shift.shiftNameAr}\n` +
          `🕒 *مواعيد العمل:* ${shift.shiftHours} (${shift.durationHours} ساعات عمل)\n` +
          `🔥 *تغطية ساعات الذروة (6م - 10م):* ${
            shift.peakHoursCovered > 0
              ? `مغطاة بالكامل (${shift.peakHoursCovered} ساعات)`
              : 'فترة صباحية'
          }\n` +
          `🎯 *التكليف بالصالة:* ${shift.sectionFocusAr}\n` +
          `💼 *الدور التشغيلي:* ${shift.assignedRole}\n` +
          `━━━━━━━━━━━━━━━━━━━\n` +
          `💰 *التارجت المستهدف:* ${formatCurrencyNumber(shift.targetSales, currency, true, language)}\n` +
          `⚡ *المعدل المستهدف بالساعة:* ${formatCurrencyNumber(shift.hourlyTarget, currency, true, language)} / ساعة\n\n` +
          `_إدارة الفرع: هاني حنا - راية للإلكترونيات_`
        : `*Official Shift Schedule - Raya Concorde Plaza* 📱\n\n` +
          `👤 *Consultant:* ${shift.employeeName} (#${shift.employeeId})\n` +
          `🏢 *Branch:* ${shift.branch}\n` +
          `📅 *Date:* ${shift.date}\n` +
          `━━━━━━━━━━━━━━━━━━━\n` +
          `⏰ *Shift:* ${shift.shiftNameEn}\n` +
          `🕒 *Hours:* ${shift.shiftHours} (${shift.durationHours} hrs)\n` +
          `🔥 *Peak Coverage (6-10 PM):* ${
            shift.peakHoursCovered > 0 ? `${shift.peakHoursCovered} hrs` : 'Morning'
          }\n` +
          `🎯 *Section Focus:* ${shift.sectionFocusEn}\n` +
          `━━━━━━━━━━━━━━━━━━━\n` +
          `_Branch Management: Hany Hanna - Raya Retail_`;

    navigator.clipboard.writeText(shiftText);
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shiftText)}`;
    const anchor = document.createElement('a');
    anchor.href = whatsappUrl;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    document.body.appendChild(anchor);
    anchor.click();
    setTimeout(() => {
      document.body.removeChild(anchor);
    }, 2000);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('raya-notification', {
          detail: {
            title: language === 'ar' ? 'تم نسخ الوردية وتوجيه لواتساب' : 'Shift Sent via WhatsApp',
            message:
              language === 'ar'
                ? `تم نسخ جدول نوبة ${shift.employeeName} وساعات الذروة وجاري الفتح في واتساب.`
                : `Shift schedule for ${shift.employeeName} copied to clipboard!`,
            type: 'success',
          },
        })
      );
    }
  };

  const generateWhatsAppMessage = (record: SalesRecord) => {
    const actualAmount = record.actualAfterVat || record.actual;
    const targetAmount = record.target;
    const isOver = record.isAchieved;
    const isNear = !isOver && record.achievementRate >= 90;
    const formattedRate = formatPercent(record.achievementRate);
    const formattedActual = formatCurrencyNumber(actualAmount, currency, true, language);
    const formattedTarget = formatCurrencyNumber(targetAmount, currency, true, language);
    const diffAmount = Math.abs(record.difference);
    const formattedDiff = formatCurrencyNumber(diffAmount, currency, true, language);

    const shift = shifts.find((s) => s.employeeName === record.employee);
    const shiftInfoAr = shift
      ? `⏰ *نوبة العمل المعتمدة:* ${shift.shiftNameAr} [${shift.shiftHours}]\n` +
        `🔥 *تغطية ساعات الذروة (6م - 10م):* ${shift.peakHoursCovered > 0 ? `مغطاة بالكامل (${shift.peakHoursCovered} ساعات)` : 'فترة صباحية'}\n` +
        `🎯 *القسم المكلف به بالصالة:* ${shift.sectionFocusAr}\n`
      : '';
    const shiftInfoEn = shift
      ? `⏰ *Assigned Shift:* ${shift.shiftNameEn} [${shift.shiftHours}]\n` +
        `🔥 *Peak Coverage (6-10 PM):* ${shift.peakHoursCovered > 0 ? `${shift.peakHoursCovered} hrs` : 'Morning'}\n` +
        `🎯 *Section Focus:* ${shift.sectionFocusEn}\n`
      : '';

    let motivationalNote = '';
    if (isOver) {
      motivationalNote = language === 'ar'
        ? `🌟 مبروك يا بطل! حققت التارجت اليوم بنجاح وكسرت الهدف بفائض (+${formattedDiff})! استمر بنفس القوة والروح العالية! 👏🎉`
        : `🌟 Congratulations! You hit 100%+ target with a surplus of (+${formattedDiff})! Outstanding job! 🎉`;
    } else if (isNear) {
      motivationalNote = language === 'ar'
        ? `⚡ فاضل تكّة بسيطة! متبقي فقط (${formattedDiff}) ونقفل 100% من التارجت اليوم. شد حيلك تقدر تقفلها وتكسب الحافز! 💪🔥`
        : `⚡ Almost there! Only (${formattedDiff}) remaining to smash today's target! Keep pushing! 💪`;
    } else {
      motivationalNote = language === 'ar'
        ? `🎯 شادين حيلنا اليوم ونقرب بقوة من التارجت المطلوب. ثقتنا فيك كبيرة وبالتوفيق في باقي ساعات العمل! 🚀✨`
        : `🎯 Keep up the great effort today, let's close the gap and hit our milestone! 🚀`;
    }

    const branchName = record.branch || (language === 'ar' ? 'فرع راية كونكورد بلازا' : 'Raya Concorde Plaza');

    if (language === 'ar') {
      return (
        `*تقرير متابعة الأداء والتارجت ونوبة العمل - راية ريتيل* 📱\n\n` +
        `👤 *المستشار:* ${record.employee} ${record.employeeId ? `(#${record.employeeId})` : ''}\n` +
        `🏢 *الفرع:* ${branchName}\n` +
        `━━━━━━━━━━━━━━━━━━━\n` +
        shiftInfoAr +
        `━━━━━━━━━━━━━━━━━━━\n` +
        `🎯 *التارجت المطلوب:* ${formattedTarget}\n` +
        `💰 *المبيعات المحققة:* ${formattedActual}\n` +
        `📊 *نسبة الإنجاز:* ${formattedRate}\n` +
        `${isOver ? `✨ *الفائض المحقق:* +${formattedDiff}` : `⏳ *المتبقي للهدف:* -${formattedDiff}`}\n` +
        (record.earnedIncentive !== undefined
          ? `🪙 *الحافز المكتسب حتى الآن:* ${formatCurrencyNumber(record.earnedIncentive, currency, true, language)}\n`
          : '') +
        `━━━━━━━━━━━━━━━━━━━\n` +
        `${motivationalNote}\n\n` +
        `_إدارة الفرع: هاني حنا - راية للإلكترونيات_`
      );
    }

    return (
      `*Daily Performance & Shift Tracker - Raya Retail* 📱\n\n` +
      `👤 *Consultant:* ${record.employee} ${record.employeeId ? `(#${record.employeeId})` : ''}\n` +
      `🏢 *Branch:* ${branchName}\n` +
      `━━━━━━━━━━━━━━━━━━━\n` +
      shiftInfoEn +
      `━━━━━━━━━━━━━━━━━━━\n` +
      `🎯 *Daily Target:* ${formattedTarget}\n` +
      `💰 *Actual Sales:* ${formattedActual}\n` +
      `📊 *Achievement Rate:* ${formattedRate}\n` +
      `${isOver ? `✨ *Surplus:* +${formattedDiff}` : `⏳ *Remaining to Target:* -${formattedDiff}`}\n` +
      (record.earnedIncentive !== undefined
        ? `🪙 *Earned Commission:* ${formatCurrencyNumber(record.earnedIncentive, currency, true, language)}\n`
        : '') +
      `━━━━━━━━━━━━━━━━━━━\n` +
      `${motivationalNote}\n\n` +
      `_Branch Management: Hany Hanna - Raya Retail_`
    );
  };

  const handleShareWhatsApp = (record: SalesRecord) => {
    const message = generateWhatsAppMessage(record);
    navigator.clipboard.writeText(message);
    setCopiedWhatsappId(record.id);

    // Open WhatsApp Web / App
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    const anchor = document.createElement('a');
    anchor.href = whatsappUrl;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    document.body.appendChild(anchor);
    anchor.click();
    setTimeout(() => {
      document.body.removeChild(anchor);
      setCopiedWhatsappId(null);
    }, 3000);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('raya-notification', {
          detail: {
            title: language === 'ar' ? 'تم نسخ التقرير وفتح واتساب' : 'WhatsApp Ready',
            message:
              language === 'ar'
                ? `تم إنشاء نص تقرير أداء ${record.employee} ونقله للذاكرة وجاري توجيهك للواتساب.`
                : `Performance message for ${record.employee} copied to clipboard!`,
            type: 'success',
          },
        })
      );
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection(field === 'employee' || field === 'branch' || field === 'employeeId' ? 'asc' : 'desc');
    }
  };

  const sortedRecords = [...records].sort((a, b) => {
    let comparison = 0;
    if (sortField === 'employee') {
      comparison = a.employee.localeCompare(b.employee, language === 'ar' ? 'ar' : 'en');
    } else if (sortField === 'employeeId') {
      comparison = (a.employeeId || '').localeCompare(b.employeeId || '');
    } else if (sortField === 'branch') {
      comparison = a.branch.localeCompare(b.branch, language === 'ar' ? 'ar' : 'en');
    } else if (sortField === 'earnedIncentive') {
      comparison = (a.earnedIncentive || 0) - (b.earnedIncentive || 0);
    } else if (sortField === 'efficiency') {
      comparison = calculateEmployeeEfficiency(a).score - calculateEmployeeEfficiency(b).score;
    } else {
      comparison = (a[sortField] as number) - (b[sortField] as number);
    }
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-emerald-600 font-bold" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-emerald-600 font-bold" />
    );
  };

  return (
    <div id="employees-table" className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
      {/* Table Header Controls & Shift Management Toolbar (User Request) */}
      <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col gap-3 bg-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-slate-900">
                {t.tableTitle}
              </h2>
              {/* Peak staffing indicator badge */}
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-rose-50 text-rose-700 border border-rose-200">
                <Flame className="w-3 h-3 text-rose-500 animate-pulse" />
                <span>{language === 'ar' ? 'ساعات الذروة: 6م - 10م (65% من المبيعات)' : 'Peak Rush: 6-10 PM (65% Footfall)'}</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {language === 'ar'
                ? 'متابعة أداء مستشاري المبيعات وربطه بنوبات العمل وتغطية ساعات الذروة في فرع كونكورد بلازا'
                : t.tableDesc}
            </p>
          </div>

          {/* Mode Switcher Pill: Sales vs Shifts */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-auto shrink-0 shadow-2xs">
            <button
              type="button"
              onClick={() => setTableMode('sales')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                tableMode === 'sales'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📊 {language === 'ar' ? 'الأداء المالي' : 'Sales View'}
            </button>
            <button
              type="button"
              onClick={() => setTableMode('shifts')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                tableMode === 'shifts'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-indigo-800 hover:text-indigo-950 hover:bg-indigo-50/60'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-300" />
              <span>{language === 'ar' ? 'نوبات وساعات الذروة' : 'Shifts & Peak Hours'}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
            </button>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            {/* Shift Roster & Peak Hours Modal Launcher */}
            <button
              type="button"
              onClick={() => setIsShiftModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 font-bold text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors whitespace-nowrap shadow-2xs cursor-pointer active:scale-95"
              title={language === 'ar' ? 'فتح لوحة الإدارة المتكاملة للنوبات وساعات الذروة والتصدير' : 'Open Full Shift Roster & Peak Management Hub'}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
              <span>{language === 'ar' ? 'لوحة جدولة النوبات والذروة' : 'Shift Management Hub'}</span>
            </button>

            {/* Auto Optimize Button */}
            <button
              type="button"
              onClick={handleAutoOptimizeShifts}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors whitespace-nowrap shadow-2xs cursor-pointer active:scale-95"
              title={language === 'ar' ? 'توزيع ذكي تلقائي لمستشاري المبيعات لتركيز الكفاءات في ساعات الذروة (6م - 10م)' : 'Auto-optimize staff shifts for peak footfall hours'}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>{language === 'ar' ? 'توزيع ذكي حسب الذروة' : 'Auto-Roster Peak'}</span>
            </button>

            {/* Export Daily Shift Schedule */}
            <button
              type="button"
              onClick={handleExportShifts}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors whitespace-nowrap shadow-2xs cursor-pointer"
              title={language === 'ar' ? 'تصدير جدول نوبات العمل اليومي إلى ملف Excel' : 'Export Daily Shift Schedule to Excel'}
            >
              <Download className="w-3.5 h-3.5 text-indigo-600" />
              <span>{language === 'ar' ? 'تصدير الورديات (Excel)' : 'Export Shifts'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => exportRecordsToExcel(records, undefined, language)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors whitespace-nowrap shadow-2xs cursor-pointer"
              title={language === 'ar' ? 'تصدير جدول المبيعات لإكسيل' : 'Export Table to Excel'}
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>{language === 'ar' ? 'تصدير المبيعات' : 'Export Sales'}</span>
            </button>

            <button
              onClick={onOpenAddRecord}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors whitespace-nowrap cursor-pointer shadow-2xs"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{t.addEmployeeBtn}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Operational Peak Hours Overview Banner (Active in Shifts Mode) */}
      {tableMode === 'shifts' && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 sm:p-5 border-b border-indigo-800/60">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  <Flame className="w-4 h-4 text-rose-400 animate-pulse" />
                </span>
                <h3 className="font-extrabold text-sm sm:text-base text-white">
                  {language === 'ar'
                    ? 'تحليل تغطية ساعات الذروة التشغيلية (فرع كونكورد بلازا)'
                    : 'Concorde Plaza Operational Peak Staffing & Sales Roster'}
                </h3>
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                    shiftSummary.peakStaffingStatus === 'optimal'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : shiftSummary.peakStaffingStatus === 'moderate'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  }`}
                >
                  {language === 'ar'
                    ? shiftSummary.peakStaffingStatus === 'optimal'
                      ? '✓ تغطية الذروة مثالية'
                      : '⚠️ بحاجة لزيادة كوادر الذروة'
                    : shiftSummary.peakStaffingStatus === 'optimal'
                    ? '✓ Optimal Rush Coverage'
                    : '⚠️ Rush Attention Needed'}
                </span>
              </div>
              <p className="text-xs text-indigo-200/90 mt-1 max-w-2xl">
                {language === 'ar'
                  ? '65% من إجمالي حركة الزوار ومبيعات الهواتف الرائدة والتقسيط تتركز بين 06:00 م و 10:00 م. الجدول التالي يربط الورديات بساعات الذروة مع إمكانية تعديل النوبات وتصدير الجدول فورا.'
                  : '65% of footfall and flagship smartphone closings occur between 18:00 and 22:00. Below roster correlates consultant shifts directly with high-revenue peak hours.'}
              </p>
            </div>

            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs shrink-0">
              <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2.5 border border-white/10">
                <span className="text-indigo-200 text-[11px] block">
                  {language === 'ar' ? 'إجمالي الموظفين' : 'Total Staff'}
                </span>
                <strong className="text-base font-black text-white">
                  {shiftSummary.totalScheduledStaff}
                </strong>
              </div>
              <div className="bg-rose-500/20 rounded-xl p-2.5 border border-rose-400/30">
                <span className="text-rose-200 text-[11px] block">
                  {language === 'ar' ? 'ذروة المساء (6م-10م)' : 'Evening Peak (6-10 PM)'}
                </span>
                <strong className="text-base font-black text-rose-300">
                  {shiftSummary.eveningPeakStaffCount + shiftSummary.fullDayStaffCount}
                </strong>
              </div>
              <div className="bg-amber-500/20 rounded-xl p-2.5 border border-amber-400/30">
                <span className="text-amber-200 text-[11px] block">
                  {language === 'ar' ? 'الوردية الصباحية' : 'Morning Shift'}
                </span>
                <strong className="text-base font-black text-amber-300">
                  {shiftSummary.morningStaffCount}
                </strong>
              </div>
              <div className="bg-emerald-500/20 rounded-xl p-2.5 border border-emerald-400/30">
                <span className="text-emerald-200 text-[11px] block">
                  {language === 'ar' ? 'ساعات الذروة المغطاة' : 'Peak Hours Covered'}
                </span>
                <strong className="text-base font-black text-emerald-300">
                  {shiftSummary.totalStaffPeakHoursDelivered}h
                </strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Table: Switches between Sales View and Shifts & Peak Hours View */}
      <div className="overflow-x-auto">
        {tableMode === 'shifts' ? (
          /* ============================================================ */
          /* SHIFT MANAGEMENT & PEAK HOURS TABLE VIEW                     */
          /* ============================================================ */
          <table className={`w-full ${language === 'ar' ? 'text-right' : 'text-left'} border-collapse`}>
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-xs font-semibold text-slate-700 select-none">
                <th className="py-3 px-3 w-10 text-center text-slate-400">#</th>
                <th className="py-3 px-3 whitespace-nowrap">{language === 'ar' ? 'كود الموظف' : 'Job ID'}</th>
                <th className="py-3 px-4 whitespace-nowrap">{language === 'ar' ? 'مستشار المبيعات والفرع' : 'Consultant & Branch'}</th>
                <th className="py-3 px-4 whitespace-nowrap">{language === 'ar' ? 'نوبة العمل المقررة (تعديل فوري)' : 'Assigned Shift (Quick Select)'}</th>
                <th className="py-3 px-4 whitespace-nowrap">{language === 'ar' ? 'تغطية ساعات الذروة (6م - 10م)' : 'Peak Hours Coverage (6-10 PM)'}</th>
                <th className={`py-3 px-4 whitespace-nowrap ${language === 'ar' ? 'text-left' : 'text-right'}`}>
                  {language === 'ar' ? 'المبيعات / التارجت' : 'Actual / Target'}
                </th>
                <th className={`py-3 px-4 whitespace-nowrap ${language === 'ar' ? 'text-left' : 'text-right'}`}>
                  {language === 'ar' ? 'سرعة المبيعات بالساعة' : 'Hourly Sales Velocity'}
                </th>
                <th className="py-3 px-4 whitespace-nowrap">{language === 'ar' ? 'التكليف الميداني بالصالة' : 'Showroom Focus'}</th>
                <th className="py-3 px-3 text-center min-w-[130px] whitespace-nowrap">
                  {language === 'ar' ? 'إخطار الوردية' : 'Shift Dispatch'}
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-sm">
              {sortedRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <p className="text-sm font-medium">{t.noResults}</p>
                  </td>
                </tr>
              ) : (
                sortedRecords.map((record, index) => {
                  const shift = shifts.find((s) => s.employeeName === record.employee);
                  const currentShiftType = shift?.shiftType || 'evening_peak';
                  const shiftCfg = SHIFT_CONFIGS[currentShiftType];
                  const hourlyActual = shift?.hourlyActual || (shiftCfg.durationHours > 0 ? Math.round(record.actual / shiftCfg.durationHours) : 0);
                  const isPeakShift = currentShiftType === 'evening_peak' || currentShiftType === 'full_peak';

                  return (
                    <tr
                      key={record.id}
                      className={`transition-colors group ${
                        isPeakShift
                          ? 'hover:bg-indigo-50/30'
                          : currentShiftType === 'morning'
                          ? 'hover:bg-amber-50/30'
                          : 'bg-slate-50/50 hover:bg-slate-100/50'
                      }`}
                    >
                      {/* Index */}
                      <td className="py-3 px-3 text-center font-mono tabular-nums text-xs text-slate-400">
                        {index + 1}
                      </td>

                      {/* Job ID */}
                      <td className="py-3 px-3 font-mono tabular-nums text-xs font-semibold text-slate-600 whitespace-nowrap">
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 border border-slate-200">
                          {record.employeeId || shift?.employeeId || `14072${index}`}
                        </span>
                      </td>

                      {/* Consultant & Branch */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900">{record.employee}</span>
                          <span className="text-[11px] text-slate-500">
                            {record.branch || 'راية - فرع كونكورد بلازا'}
                          </span>
                        </div>
                      </td>

                      {/* Interactive Shift Dropdown Selector */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <select
                            value={currentShiftType}
                            onChange={(e) => handleQuickShiftChange(record.employee, e.target.value as ShiftType)}
                            className={`text-xs font-bold py-1.5 px-2.5 rounded-lg border transition-all cursor-pointer shadow-2xs focus:ring-2 focus:ring-indigo-500 focus:outline-none ${shiftCfg.badgeColor}`}
                          >
                            <option value="evening_peak">
                              🔥 {language === 'ar' ? 'الذروة المسائية (16:30 - 23:30)' : 'Evening Peak (16:30 - 23:30)'}
                            </option>
                            <option value="morning">
                              ☀️ {language === 'ar' ? 'الوردية الصباحية (10:00 - 16:30)' : 'Morning Shift (10:00 - 16:30)'}
                            </option>
                            <option value="full_peak">
                              ⚡ {language === 'ar' ? 'يوم كامل / ويك إند (12:00 - 23:30)' : 'Full Day / Weekend (12:00 - 23:30)'}
                            </option>
                            <option value="off">
                              💤 {language === 'ar' ? 'راحة أسبوعية (Day Off)' : 'Weekly Day Off'}
                            </option>
                          </select>
                        </div>
                      </td>

                      {/* Peak Hours Coverage Window (6-10 PM) */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {shift && shift.peakHoursCovered > 0 ? (
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-300">
                              <Flame className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                              <span>
                                {shift.peakHoursCovered} {language === 'ar' ? 'ساعات' : 'hrs'} (100% {language === 'ar' ? 'تغطية' : 'Covered'})
                              </span>
                            </span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                            <Sun className="w-3.5 h-3.5 text-amber-600" />
                            <span>{language === 'ar' ? 'فترة صباحية (خارج الذروة)' : 'Morning Off-peak'}</span>
                          </span>
                        )}
                      </td>

                      {/* Sales Actual & Target */}
                      <td className={`py-3 px-4 whitespace-nowrap ${language === 'ar' ? 'text-left' : 'text-right'}`}>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 font-mono text-xs">
                            {formatCurrencyNumber(record.actualAfterVat || record.actual, currency, true, language)}
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono">
                            {formatPercent(record.achievementRate)} {language === 'ar' ? 'من' : 'of'}{' '}
                            {formatCurrencyNumber(record.target, currency, true, language)}
                          </span>
                        </div>
                      </td>

                      {/* Hourly Sales Velocity */}
                      <td className={`py-3 px-4 whitespace-nowrap ${language === 'ar' ? 'text-left' : 'text-right'}`}>
                        <div className="flex flex-col">
                          <span className="font-bold font-mono text-xs text-indigo-700 flex items-center justify-end gap-1">
                            <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
                            {formatCurrencyNumber(hourlyActual, currency, true, language)} / {language === 'ar' ? 'ساعة' : 'hr'}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {shiftCfg.durationHours > 0 ? `${shiftCfg.durationHours} ${language === 'ar' ? 'ساعات دوام' : 'shift hours'}` : '-'}
                          </span>
                        </div>
                      </td>

                      {/* Store Section Focus */}
                      <td className="py-3 px-4 whitespace-nowrap text-xs text-slate-700">
                        <div className="flex items-center gap-1.5">
                          <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-medium text-slate-800">
                            {language === 'ar' ? (shift?.sectionFocusAr || 'مبيعات عامة') : (shift?.sectionFocusEn || 'General Sales')}
                          </span>
                        </div>
                      </td>

                      {/* Shift Dispatch via WhatsApp */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleShareShiftWhatsApp(record)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 transition-colors shadow-2xs cursor-pointer active:scale-95"
                          title={language === 'ar' ? 'إرسال جدول الوردية ومواعيد الدوام للموظف عبر واتساب' : 'Send shift schedule to employee via WhatsApp'}
                        >
                          <Share2 className="w-3 h-3 text-indigo-600" />
                          <span>{language === 'ar' ? 'إخطار الوردية' : 'Send Shift'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        ) : (
          /* ============================================================ */
          /* STANDARD SALES PERFORMANCE TABLE VIEW                        */
          /* ============================================================ */
          <table className={`w-full ${language === 'ar' ? 'text-right' : 'text-left'} border-collapse`}>
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-600 select-none">
                <th className="py-3 px-3 w-10 text-center text-slate-400">{t.colNumber}</th>
                
                {/* Job ID Column */}
                <th
                  onClick={() => handleSort('employeeId')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-100/70 transition-colors group whitespace-nowrap"
                >
                  <div className="flex items-center gap-1">
                    <span>{t.colJobId}</span>
                    {renderSortIcon('employeeId')}
                  </div>
                </th>

                {/* Employee Name */}
                <th
                  onClick={() => handleSort('employee')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100/70 transition-colors group whitespace-nowrap"
                >
                  <div className="flex items-center gap-1.5">
                    <span>{t.colEmployee}</span>
                    {renderSortIcon('employee')}
                  </div>
                </th>

                {/* Branch */}
                <th
                  onClick={() => handleSort('branch')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100/70 transition-colors group whitespace-nowrap"
                >
                  <div className="flex items-center gap-1.5">
                    <span>{t.colBranch}</span>
                    {renderSortIcon('branch')}
                  </div>
                </th>

                {/* Target */}
                <th
                  onClick={() => handleSort('target')}
                  className={`py-3 px-4 cursor-pointer hover:bg-slate-100/70 transition-colors group whitespace-nowrap ${
                    language === 'ar' ? 'text-left' : 'text-right'
                  }`}
                >
                  <div className={`flex items-center ${language === 'ar' ? 'justify-end' : 'justify-start'} gap-1.5`}>
                    <span>{t.colTarget}</span>
                    {renderSortIcon('target')}
                  </div>
                </th>

                {/* Actual */}
                <th
                  onClick={() => handleSort('actual')}
                  className={`py-3 px-4 cursor-pointer hover:bg-slate-100/70 transition-colors group whitespace-nowrap ${
                    language === 'ar' ? 'text-left' : 'text-right'
                  }`}
                >
                  <div className={`flex items-center ${language === 'ar' ? 'justify-end' : 'justify-start'} gap-1.5`}>
                    <span>{t.colActual}</span>
                    {renderSortIcon('actual')}
                  </div>
                </th>

                {/* Difference */}
                <th
                  onClick={() => handleSort('difference')}
                  className={`py-3 px-4 cursor-pointer hover:bg-slate-100/70 transition-colors group whitespace-nowrap ${
                    language === 'ar' ? 'text-left' : 'text-right'
                  }`}
                >
                  <div className={`flex items-center ${language === 'ar' ? 'justify-end' : 'justify-start'} gap-1.5`}>
                    <span>{t.colDiff}</span>
                    {renderSortIcon('difference')}
                  </div>
                </th>

                {/* Rate */}
                <th
                  onClick={() => handleSort('achievementRate')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100/70 transition-colors group min-w-[140px] whitespace-nowrap"
                >
                  <div className="flex items-center gap-1.5">
                    <span>{t.colRate}</span>
                    {renderSortIcon('achievementRate')}
                  </div>
                </th>

                {/* Earned Incentive Column */}
                <th
                  onClick={() => handleSort('earnedIncentive')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100/70 transition-colors group whitespace-nowrap"
                >
                  <div className="flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-amber-500" />
                    <span>{t.colIncentive}</span>
                    {renderSortIcon('earnedIncentive')}
                  </div>
                </th>

                {/* Efficiency Index Column (مؤشر الكفاءة الرقمي) */}
                <th
                  onClick={() => handleSort('efficiency')}
                  className="py-3 px-4 cursor-pointer hover:bg-emerald-100/70 transition-colors group whitespace-nowrap bg-emerald-50/60 border-x border-emerald-100 text-center"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="font-bold text-emerald-950">{language === 'ar' ? 'مؤشر الكفاءة' : 'Efficiency'}</span>
                    {renderSortIcon('efficiency')}
                  </div>
                </th>

                {/* Status */}
                <th className="py-3 px-4 text-center whitespace-nowrap">{t.colStatus}</th>

                {/* Actions & WhatsApp Sharing */}
                <th className="py-3 px-3 text-center min-w-[150px] whitespace-nowrap">
                  {language === 'ar' ? 'المشاركة والإجراءات' : t.colActions}
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-sm">
              {sortedRecords.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <p className="text-sm font-medium">{t.noResults}</p>
                      {onResetFilters && (
                        <button
                          onClick={onResetFilters}
                          className="text-xs text-emerald-700 underline font-medium mt-1"
                        >
                          {t.resetFilters}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                sortedRecords.map((record, index) => {
                  const isOver = record.isAchieved;
                  const isNear90 = !isOver && record.achievementRate >= 90;
                  const shift = shifts.find((s) => s.employeeName === record.employee);

                  return (
                    <tr
                      key={record.id}
                      className={`transition-colors group ${
                        isOver
                          ? 'hover:bg-emerald-50/40'
                          : isNear90
                          ? 'bg-amber-50/25 hover:bg-amber-50/50'
                          : 'hover:bg-rose-50/30'
                      }`}
                    >
                      {/* Index */}
                      <td className="py-3 px-3 text-center font-mono tabular-nums text-xs text-slate-400">
                        {index + 1}
                      </td>

                      {/* Job ID */}
                      <td className="py-3 px-3 font-mono tabular-nums text-xs font-semibold text-slate-600 whitespace-nowrap">
                        {record.employeeId ? (
                          <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 border border-slate-200">
                            {record.employeeId}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {/* Employee Name + Quick Shift Badge */}
                      <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span>{record.employee}</span>
                          {shift && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <span
                                className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                                  shift.shiftType === 'evening_peak'
                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                    : shift.shiftType === 'morning'
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : 'bg-purple-50 text-purple-700 border-purple-200'
                                }`}
                              >
                                {shift.shiftType === 'evening_peak' ? (
                                  <Flame className="w-2.5 h-2.5 text-rose-500 animate-pulse" />
                                ) : (
                                  <Sun className="w-2.5 h-2.5 text-amber-500" />
                                )}
                                <span>{shift.shiftHours}</span>
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Branch */}
                      <td className="py-3 px-4 text-slate-600 text-xs whitespace-nowrap">
                        {record.branch}
                      </td>

                      {/* Target */}
                      <td className={`py-3 px-4 font-mono tabular-nums font-medium text-slate-600 whitespace-nowrap text-xs ${
                        language === 'ar' ? 'text-left' : 'text-right'
                      }`}>
                        {formatCurrencyNumber(record.target, currency, true, language)}
                      </td>

                      {/* Actual */}
                      <td className={`py-3 px-4 font-mono tabular-nums whitespace-nowrap text-xs ${
                        language === 'ar' ? 'text-left' : 'text-right'
                      }`}>
                        <div className="flex flex-col">
                          <span className={`font-bold ${isOver ? 'text-emerald-700' : 'text-slate-900'}`}>
                            {formatCurrencyNumber(record.actualAfterVat || record.actual, currency, true, language)}
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium">
                            {language === 'ar' ? 'قبل الضريبة: ' : 'Pre-VAT: '}
                            {formatCurrencyNumber(
                              record.actualBeforeVat !== undefined
                                ? record.actualBeforeVat
                                : Math.round((record.actualAfterVat || record.actual) / 1.14),
                              currency,
                              true,
                              language
                            )}
                          </span>
                        </div>
                      </td>

                      {/* Difference */}
                      <td className={`py-3 px-4 font-mono tabular-nums font-semibold whitespace-nowrap text-xs ${
                        language === 'ar' ? 'text-left' : 'text-right'
                      }`}>
                        {record.difference >= 0 ? (
                          <span className="text-emerald-700">
                            +{formatCurrencyNumber(record.difference, currency, true, language)}
                          </span>
                        ) : (
                          <span className="text-rose-600">
                            {formatCurrencyNumber(record.difference, currency, true, language)}
                          </span>
                        )}
                      </td>

                      {/* Achievement Rate + Progress Bar */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-mono tabular-nums font-bold text-xs min-w-[50px] ${
                              isOver
                                ? 'text-emerald-700'
                                : isNear90
                                ? 'text-amber-700'
                                : 'text-rose-700'
                            }`}
                          >
                            {formatPercent(record.achievementRate)}
                          </span>
                          
                          <div className="w-20 bg-slate-100 rounded-full h-2 overflow-hidden shrink-0">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                isOver
                                  ? 'bg-emerald-500'
                                  : isNear90
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                              style={{ width: `${Math.min(record.achievementRate, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Earned Incentive (Clickable to view breakdown) */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {record.earnedIncentive !== undefined ? (
                          <button
                            type="button"
                            onClick={() => onViewIncentive && onViewIncentive(record)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-mono tabular-nums font-bold text-xs transition-colors cursor-pointer group/btn"
                            title={language === 'ar' ? 'اضغط لعرض تفاصيل حوافز المنتجات' : 'Click to view product commission breakdown'}
                          >
                            <Coins className="w-3.5 h-3.5 text-amber-600" />
                            <span>{formatCurrencyNumber(record.earnedIncentive, currency, true, language)}</span>
                            {language === 'ar' ? (
                              <ChevronLeft className="w-3 h-3 text-amber-500 group-hover/btn:-translate-x-0.5 transition-transform" />
                            ) : (
                              <ChevronRight className="w-3 h-3 text-amber-500 group-hover/btn:translate-x-0.5 transition-transform" />
                            )}
                          </button>
                        ) : (
                          <span className="text-slate-400 font-mono text-xs">-</span>
                        )}
                      </td>

                      {/* Numerical Efficiency Index Badge */}
                      <td className="py-3 px-4 text-center whitespace-nowrap bg-emerald-50/20 border-x border-emerald-100">
                        {(() => {
                          const eff = calculateEmployeeEfficiency(record);
                          return (
                            <button
                              type="button"
                              onClick={() => {
                                const deepElem = document.getElementById('employee-deep-analytics');
                                if (deepElem) {
                                  deepElem.scrollIntoView({ behavior: 'smooth' });
                                }
                              }}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-mono font-bold transition-transform hover:scale-105 cursor-pointer shadow-2xs ${eff.badgeBg} ${eff.badgeText} ${eff.badgeBorder}`}
                              title={language === 'ar' ? `مؤشر الكفاءة: ${eff.score}/100 (${eff.tierLabelAr}) - اضغط للتحليل المعمق ونقاط القوة والضعف` : `Efficiency: ${eff.score}/100 (${eff.tierLabelAr}) - Click for deep analytics`}
                            >
                              <Sparkles className="w-3 h-3 text-emerald-600" />
                              <span>{eff.score}</span>
                              <span className="text-[10px] text-slate-400 font-normal">/100</span>
                            </button>
                          );
                        })()}
                      </td>

                      {/* Target Achieved Status Badge */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {isOver ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <Trophy className="w-3.5 h-3.5 text-emerald-700" />
                            <span>{language === 'ar' ? 'حقق التارجت 100%+' : t.statusAchievedLabel}</span>
                          </span>
                        ) : isNear90 ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                            <Zap className="w-3.5 h-3.5 text-amber-600" />
                            <span>{language === 'ar' ? 'اقترب من الهدف (90%+)' : 'Nearing 90%+'}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-700" />
                            <span>{t.statusUnachievedLabel}</span>
                          </span>
                        )}
                      </td>

                      {/* Actions & WhatsApp Share Button */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* WhatsApp Share Button */}
                          <button
                            type="button"
                            onClick={() => handleShareWhatsApp(record)}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95 ${
                              copiedWhatsappId === record.id
                                ? 'bg-emerald-600 text-white ring-2 ring-emerald-300'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 hover:border-emerald-400'
                            }`}
                            title={
                              language === 'ar'
                                ? `مشاركة تقرير ${record.employee} عبر واتساب (نسبة الإنجاز والتارجت والمتبقي)`
                                : `Share ${record.employee}'s progress via WhatsApp`
                            }
                          >
                            {copiedWhatsappId === record.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-white" />
                                <span className="text-[11px]">{language === 'ar' ? 'تم النسخ!' : 'Copied!'}</span>
                              </>
                            ) : (
                              <>
                                <MessageCircle className="w-3.5 h-3.5 text-emerald-600 fill-emerald-100" />
                                <span className="text-[11px]">{language === 'ar' ? 'واتساب' : 'WhatsApp'}</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => onEditRecord(record)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title={language === 'ar' ? 'تعديل السجل' : 'Edit'}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteRecord(record.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title={language === 'ar' ? 'حذف' : 'Delete'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Table Footer with Summary Stats */}
      {sortedRecords.length > 0 && (
        <div className="bg-slate-50/80 p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-4 flex-wrap">
            <span>
              {t.totalRows}: <strong className="font-mono tabular-nums text-slate-900">{sortedRecords.length}</strong>
            </span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span>
              {t.achievedCountLabel}:{' '}
              <strong className="text-emerald-700 font-mono tabular-nums">
                {sortedRecords.filter((r) => r.isAchieved).length}
              </strong>
            </span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span>
              {t.unachievedCountLabel}:{' '}
              <strong className="text-rose-600 font-mono tabular-nums">
                {sortedRecords.filter((r) => !r.isAchieved).length}
              </strong>
            </span>
            {tableMode === 'shifts' && (
              <>
                <span aria-hidden="true" className="text-slate-300">·</span>
                <span className="text-indigo-800 font-bold">
                  🔥 {language === 'ar' ? 'ساعات الذروة المغطاة (6م - 10م):' : 'Rush Window Covered:'}{' '}
                  <strong className="font-mono tabular-nums text-slate-900">
                    {shiftSummary.totalStaffPeakHoursDelivered}h
                  </strong>
                </span>
              </>
            )}
          </div>

          <div className="text-slate-500 text-[11px]">
            {tableMode === 'shifts'
              ? (language === 'ar' ? 'توزيع الورديات محفوظ تلقائياً ويمكن تصديره لـ Excel' : 'Shift roster auto-saved & ready for Excel export')
              : t.tableSortNote}
          </div>
        </div>
      )}

    </div>
  );
};
