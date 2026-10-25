import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Clock,
  Users,
  Flame,
  Sun,
  Moon,
  Sparkles,
  Download,
  Share2,
  Check,
  Printer,
  X,
  Building2,
  CheckCircle2,
  Zap,
  Info,
  SlidersHorizontal,
  RefreshCw,
  Coins,
  ShieldCheck,
} from 'lucide-react';
import {
  SalesRecord,
  Currency,
  Language,
  ShiftType,
  EmployeeShiftAssignment,
} from '../types/sales';
import { formatCurrencyNumber } from '../utils/calculations';
import {
  SHIFT_CONFIGS,
  getTodayDateString,
  getPersistedShiftAssignments,
  savePersistedShiftAssignments,
  autoOptimizeShiftSchedule,
  calculateShiftSummary,
  exportShiftScheduleToExcel,
  generateShiftScheduleWhatsAppMessage,
} from '../utils/shiftService';

interface ShiftManagementRosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: SalesRecord[];
  currency: Currency;
  language: Language;
}

export const ShiftManagementRosterModal: React.FC<ShiftManagementRosterModalProps> = ({
  isOpen,
  onClose,
  records,
  currency,
  language,
}) => {
  const isAr = language === 'ar';
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [shifts, setShifts] = useState<EmployeeShiftAssignment[]>([]);
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load shifts on open or date change
  useEffect(() => {
    if (isOpen) {
      const loaded = getPersistedShiftAssignments(records, selectedDate);
      setShifts(loaded);
    }
  }, [isOpen, selectedDate, records]);

  // Summary statistics
  const summary = useMemo(() => calculateShiftSummary(shifts, selectedDate), [shifts, selectedDate]);

  if (!isOpen) return null;

  // Handle changing shift for an individual consultant
  const handleShiftChange = (employeeName: string, newShift: ShiftType) => {
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
    savePersistedShiftAssignments(updated, selectedDate);
    setToastMessage(
      isAr
        ? `تم تحديث نوبة عمل ${employeeName} إلى ${SHIFT_CONFIGS[newShift].nameAr}`
        : `Updated ${employeeName}'s shift to ${SHIFT_CONFIGS[newShift].nameEn}`
    );
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Handle changing section focus
  const handleSectionChange = (
    employeeName: string,
    section: 'mobiles_flagship' | 'accessories_warranty' | 'installments_aman' | 'general'
  ) => {
    const sectionNamesAr: Record<string, string> = {
      mobiles_flagship: 'الهواتف الذكية والفئات العليا (Flagships)',
      accessories_warranty: 'حزم الإكسسوارات وضمان راية الممتد',
      installments_aman: 'برامج تقسيط أمان وفاليو (0% فوائد)',
      general: 'مبيعات عامة بصالة العرض',
    };
    const sectionNamesEn: Record<string, string> = {
      mobiles_flagship: 'Flagship Smartphones',
      accessories_warranty: 'Accessories & Warranty Bundles',
      installments_aman: 'Aman & ValU Installments',
      general: 'General Showroom Sales',
    };

    const updated = shifts.map((s) => {
      if (s.employeeName !== employeeName) return s;
      return {
        ...s,
        sectionFocus: section,
        sectionFocusAr: sectionNamesAr[section],
        sectionFocusEn: sectionNamesEn[section],
      };
    });

    setShifts(updated);
    savePersistedShiftAssignments(updated, selectedDate);
  };

  // Smart Auto-Optimization action
  const handleAutoOptimize = () => {
    const optimized = autoOptimizeShiftSchedule(records, selectedDate);
    setShifts(optimized);
    setToastMessage(
      isAr
        ? '⚡ تم التوزيع الذكي للنوبات وفقاً لكفاءة المبيعات وتغطية ساعات الذروة (6م - 10م) بنجاح!'
        : '⚡ Shift schedule auto-optimized for peak evening sales velocity!'
    );
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Export to Excel
  const handleExportExcel = () => {
    exportShiftScheduleToExcel(shifts, selectedDate, language);
    setToastMessage(
      isAr ? '📥 تم تصدير جدول الورديات إلى ملف Excel بنجاح!' : '📥 Shifts exported to Excel successfully!'
    );
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Share via WhatsApp
  const handleShareWhatsApp = () => {
    const text = generateShiftScheduleWhatsAppMessage(shifts, selectedDate, language);
    navigator.clipboard.writeText(text);
    setCopiedWhatsApp(true);
    setTimeout(() => setCopiedWhatsApp(false), 3000);

    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    try {
      window.open(url, '_blank');
    } catch {
      // fallback
    }

    setToastMessage(
      isAr
        ? '📲 تم تجهيز رسالة جدول الورديات وفتح تطبيق واتساب للمشاركة!'
        : '📲 Shift roster formatted & WhatsApp opened!'
    );
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Print Roster
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 print:p-0 print:bg-white">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 print:max-w-none print:max-h-none print:shadow-none print:border-none">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-wrap items-center justify-between gap-3 shrink-0 print:bg-none print:text-black print:border-b print:border-slate-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 flex items-center justify-center shadow-inner">
              <Clock className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black tracking-tight">
                  {isAr
                    ? 'جدولة نوبات عمل الموظفين وساعات الذروة التشغيلية'
                    : 'Shift Management & Peak Operational Hours'}
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  <Flame className="w-3 h-3 text-amber-300" />
                  <span>{isAr ? 'فرع كونكورد بلازا' : 'Concorde Plaza'}</span>
                </span>
              </div>
              <p className="text-xs text-slate-300 print:text-slate-600">
                {isAr
                  ? 'ربط أداء مبيعات المستشارين بساعات الذروة المسائية (من 6م إلى 10م) وتوزيع التغطية بصالة العرض'
                  : 'Link consultant sales performance to showroom evening peak rush (6:00 PM - 10:00 PM)'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            {/* Date Picker */}
            <div className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-xl border border-white/20 text-xs">
              <Calendar className="w-3.5 h-3.5 text-indigo-300" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-white font-mono text-xs focus:outline-none cursor-pointer"
              />
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              title={isAr ? 'إغلاق' : 'Close'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Transient Action Toast Banner */}
        {toastMessage && (
          <div className="px-5 py-2 bg-slate-900 text-indigo-300 text-xs font-bold flex items-center justify-between animate-in slide-in-from-top duration-200 shrink-0 print:hidden">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
              <span>{toastMessage}</span>
            </div>
            <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white text-xs">
              ✕
            </button>
          </div>
        )}

        {/* Peak Rush Insights & KPI Banner */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-amber-500/10 via-rose-500/5 to-indigo-500/10 border-b border-amber-200/80 shrink-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {/* KPI 1: Peak Rush Window */}
            <div className="bg-white/90 p-2.5 rounded-xl border border-amber-200 shadow-2xs">
              <div className="flex items-center gap-1.5 text-amber-800 font-bold mb-1">
                <Flame className="w-4 h-4 text-rose-500 animate-pulse" />
                <span>{isAr ? 'ساعات الذروة الذهبية' : 'Golden Peak Hours'}</span>
              </div>
              <div className="text-sm font-black text-slate-900">
                18:00 - 22:00 <span className="text-[10px] text-slate-500 font-normal">({isAr ? '4 ساعات مسائية' : '4h window'})</span>
              </div>
              <div className="text-[10px] text-amber-700 font-medium mt-0.5">
                {isAr ? 'تمثل 65% من إجمالي حركة المبيعات' : 'Generates 65% of daily footfall'}
              </div>
            </div>

            {/* KPI 2: Evening Peak Staffing */}
            <div className="bg-white/90 p-2.5 rounded-xl border border-indigo-200 shadow-2xs">
              <div className="flex items-center gap-1.5 text-indigo-800 font-bold mb-1">
                <Moon className="w-4 h-4 text-indigo-600" />
                <span>{isAr ? 'قوة الذروة المسائية' : 'Evening Peak Force'}</span>
              </div>
              <div className="text-sm font-black text-indigo-950">
                {summary.eveningPeakStaffCount + summary.fullDayStaffCount} {isAr ? 'مستشارين' : 'Consultants'}
              </div>
              <div className="text-[10px] text-indigo-700 font-medium mt-0.5">
                {summary.peakStaffingStatus === 'optimal'
                  ? (isAr ? 'تغطية مثالية ومكتملة ✓' : 'Optimal staffing coverage ✓')
                  : (isAr ? 'تحتاج تعزيز مستشار إضافي' : 'Needs reinforcement')}
              </div>
            </div>

            {/* KPI 3: Morning Opening Staffing */}
            <div className="bg-white/90 p-2.5 rounded-xl border border-amber-200 shadow-2xs">
              <div className="flex items-center gap-1.5 text-amber-800 font-bold mb-1">
                <Sun className="w-4 h-4 text-amber-500" />
                <span>{isAr ? 'الوردية الصباحية (10-4:30)' : 'Morning Shift'}</span>
              </div>
              <div className="text-sm font-black text-slate-900">
                {summary.morningStaffCount} {isAr ? 'مستشار' : 'Consultant'}
              </div>
              <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                {isAr ? 'استقبال الشركات وعقود التقسيط' : 'Corporate sales & stock intake'}
              </div>
            </div>

            {/* KPI 4: Total Man-Hours in Peak */}
            <div className="bg-white/90 p-2.5 rounded-xl border border-emerald-200 shadow-2xs">
              <div className="flex items-center gap-1.5 text-emerald-800 font-bold mb-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>{isAr ? 'ساعات الحضور بالذروة' : 'Peak Man-Hours'}</span>
              </div>
              <div className="text-sm font-black text-emerald-950">
                {summary.totalStaffPeakHoursDelivered} {isAr ? 'ساعات مجمعة' : 'Man-hours'}
              </div>
              <div className="text-[10px] text-emerald-700 font-medium mt-0.5">
                {isAr ? '100% تغطية لصالتي الهواتف والتقسيط' : '100% floor coverage delivered'}
              </div>
            </div>
          </div>
        </div>

        {/* Visual 14-Hour Showroom Timeline (10:00 to 24:00) */}
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/70 shrink-0 overflow-x-auto text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              <span>{isAr ? 'الخط الزمني لتواجد المستشارين بصالة العرض (10:00 ص - 11:30 م):' : 'Hourly Floor Presence:'}</span>
            </span>
            <div className="flex items-center gap-3 text-[11px] text-slate-600">
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-400" />
                <span>{isAr ? 'صباحي' : 'Morning'}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
                <span>{isAr ? 'ذروة مسائية' : 'Evening Peak'}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-purple-600" />
                <span>{isAr ? 'ساعات الذروة (6م - 10م)' : 'Rush (6-10 PM)'}</span>
              </div>
            </div>
          </div>

          {/* Hourly Timeline Grid */}
          <div className="space-y-1.5 min-w-[620px]">
            {/* Hours Header */}
            <div className="grid grid-cols-14 text-[10px] font-mono text-slate-500 text-center border-b border-slate-200 pb-1">
              <span>10ص</span>
              <span>11ص</span>
              <span>12م</span>
              <span>1م</span>
              <span>2م</span>
              <span>3م</span>
              <span>4م</span>
              <span>5م</span>
              <span className="font-bold text-rose-700 bg-rose-100/60 rounded">6م 🔥</span>
              <span className="font-bold text-rose-700 bg-rose-100/60 rounded">7م 🔥</span>
              <span className="font-bold text-rose-700 bg-rose-100/60 rounded">8م 🔥</span>
              <span className="font-bold text-rose-700 bg-rose-100/60 rounded">9م 🔥</span>
              <span>10م</span>
              <span>11م</span>
            </div>

            {/* Staff Rows */}
            {shifts.map((s) => {
              const isMorning = s.shiftType === 'morning';
              const isEvening = s.shiftType === 'evening_peak';
              const isFull = s.shiftType === 'full_peak';

              return (
                <div key={s.employeeName} className="flex items-center gap-2">
                  <span className="w-24 text-[11px] font-bold text-slate-800 truncate" title={s.employeeName}>
                    {s.employeeName.split(' ')[0]} {s.employeeName.split(' ')[1] || ''}
                  </span>
                  <div className="grid grid-cols-14 flex-1 h-5 rounded-md bg-slate-200/60 overflow-hidden relative border border-slate-300/60">
                    {/* Golden Rush Overlay for cols 8..11 (6pm to 10pm) */}
                    <div className="absolute top-0 bottom-0 left-[57.14%] right-[14.28%] bg-amber-400/15 pointer-events-none border-x border-amber-400/40" />

                    {/* Morning Bar: 10am to 4:30pm (cols 0 to 6) */}
                    {isMorning && (
                      <div className="col-start-1 col-end-8 bg-amber-400 text-amber-950 font-bold text-[9px] flex items-center justify-center rounded-sm">
                        {isAr ? 'وردية صباحية' : 'Morning'}
                      </div>
                    )}

                    {/* Evening Bar: 4:30pm to 11:30pm (cols 7 to 14) */}
                    {isEvening && (
                      <div className="col-start-7 col-end-15 bg-gradient-to-r from-rose-500 via-rose-600 to-indigo-600 text-white font-bold text-[9px] flex items-center justify-center rounded-sm shadow-xs">
                        {isAr ? '🔥 وردية الذروة المسائية (100% تغطية)' : 'Evening Rush'}
                      </div>
                    )}

                    {/* Full Day Bar: 12pm to 11:30pm (cols 3 to 14) */}
                    {isFull && (
                      <div className="col-start-3 col-end-15 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold text-[9px] flex items-center justify-center rounded-sm">
                        {isAr ? 'وردية ممتدة' : 'Full Day'}
                      </div>
                    )}

                    {s.shiftType === 'off' && (
                      <div className="col-start-1 col-end-15 bg-slate-300 text-slate-600 text-[10px] flex items-center justify-center">
                        {isAr ? 'إجازة' : 'Off'}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Scrollable Staff Schedule Table */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
            <h4 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>{isAr ? 'قائمة توزيع الورديات والمهام البيعية:' : 'Staff Shift Allocations & Roles:'}</span>
            </h4>
            <span className="text-xs text-slate-500">
              {isAr ? 'يمكن لمدير الفرع تبديل الوردية أو التخصص من القائمة المنسدلة فورياً.' : 'Click dropdown to reassign shift or section on the fly.'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className={`w-full ${isAr ? 'text-right' : 'text-left'} border-collapse text-xs`}>
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold select-none">
                  <th className="py-2.5 px-3">{isAr ? 'المستشار' : 'Consultant'}</th>
                  <th className="py-2.5 px-3">{isAr ? 'النوبة التشغيلية' : 'Shift'}</th>
                  <th className="py-2.5 px-3">{isAr ? 'توقيت العمل' : 'Hours'}</th>
                  <th className="py-2.5 px-3">{isAr ? 'تغطية الذروة (6م - 10م)' : 'Peak Coverage'}</th>
                  <th className="py-2.5 px-3">{isAr ? 'التخصص والقسم' : 'Section Focus'}</th>
                  <th className="py-2.5 px-3 text-center">{isAr ? 'المبيعات الفعلية' : 'Actual Sales'}</th>
                  <th className="py-2.5 px-3 text-center">{isAr ? 'المعدل بالساعة' : 'Hourly Rate'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {shifts.map((s) => {
                  const cfg = SHIFT_CONFIGS[s.shiftType];

                  return (
                    <tr key={s.employeeName} className="hover:bg-slate-50 transition-colors">
                      {/* Name & ID */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="font-bold text-slate-900">{s.employeeName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">#{s.employeeId}</div>
                      </td>

                      {/* Shift Selector */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <select
                          value={s.shiftType}
                          onChange={(e) => handleShiftChange(s.employeeName, e.target.value as ShiftType)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold border focus:outline-none cursor-pointer ${cfg.badgeColor}`}
                        >
                          <option value="evening_peak">
                            {isAr ? '🔥 وردية الذروة المسائية (16:30 - 23:30)' : 'Evening Peak (16:30 - 23:30)'}
                          </option>
                          <option value="morning">
                            {isAr ? '☀️ الوردية الصباحية (10:00 - 16:30)' : 'Morning Shift (10:00 - 16:30)'}
                          </option>
                          <option value="full_peak">
                            {isAr ? '⚡ وردية اليوم الكامل (12:00 - 23:30)' : 'Full Day Rush (12:00 - 23:30)'}
                          </option>
                          <option value="off">{isAr ? '🏖️ راحة أسبوعية (Day Off)' : 'Weekly Off'}</option>
                        </select>
                      </td>

                      {/* Hours */}
                      <td className="py-3 px-3 whitespace-nowrap font-mono text-slate-700 font-bold">
                        {s.shiftHours}
                      </td>

                      {/* Peak Hours Coverage */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {s.peakHoursCovered > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                            <Flame className="w-3 h-3 text-rose-600 animate-pulse" />
                            <span>
                              {s.peakHoursCovered} {isAr ? 'ساعات (100% مغطاة)' : 'hrs (100%)'}
                            </span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                            <span>{isAr ? '0 س (فترة هادئة)' : '0 hrs (morning)'}</span>
                          </span>
                        )}
                      </td>

                      {/* Section Focus Selector */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <select
                          value={s.sectionFocus}
                          onChange={(e) =>
                            handleSectionChange(
                              s.employeeName,
                              e.target.value as 'mobiles_flagship' | 'accessories_warranty' | 'installments_aman' | 'general'
                            )
                          }
                          className="px-2 py-1 rounded-md text-xs bg-white border border-slate-200 text-slate-800 focus:outline-none cursor-pointer"
                        >
                          <option value="mobiles_flagship">
                            {isAr ? '📱 هواتف الفئات العليا (Flagships)' : 'Flagship Handsets'}
                          </option>
                          <option value="accessories_warranty">
                            {isAr ? '🎧 إكسسوارات وضمان ممتد' : 'Accessories & Warranty'}
                          </option>
                          <option value="installments_aman">
                            {isAr ? '💳 تقسيط أمان وفاليو (0%)' : 'Aman & ValU Financing'}
                          </option>
                          <option value="general">{isAr ? '🏬 مبيعات عامة بالصالة' : 'General Showroom'}</option>
                        </select>
                      </td>

                      {/* Actual Sales */}
                      <td className="py-3 px-3 text-center whitespace-nowrap font-mono font-bold text-slate-900">
                        {formatCurrencyNumber(s.actualSales, currency, true, language)}
                        <span className="text-[10px] text-slate-500 block">({s.achievementRate}%)</span>
                      </td>

                      {/* Hourly Run Rate */}
                      <td className="py-3 px-3 text-center whitespace-nowrap font-mono font-bold text-indigo-700 bg-indigo-50/50 rounded-lg">
                        {formatCurrencyNumber(s.hourlyActual, currency, true, language)}
                        <span className="text-[9px] text-slate-400 block font-sans">{isAr ? '/ساعة' : '/hr'}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Controls & Export Toolbar */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0 print:hidden">
          <div className="flex flex-wrap items-center gap-2">
            {/* 1. Smart Auto-Optimization Button */}
            <button
              onClick={handleAutoOptimize}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-extrabold transition-all shadow-xs cursor-pointer active:scale-95"
              title={isAr ? 'توزيع ذكي تلقائي للنوبات لتركيز أعلى الكفاءات في ساعات الذروة (6م - 10م)' : 'Auto-optimize roster for peak hours'}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{isAr ? 'توزيع ذكي حسب ساعات الذروة' : 'Auto-Optimize for Peak'}</span>
            </button>

            {/* 2. Export Daily Roster to Excel */}
            <button
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-bold border border-slate-300 transition-colors shadow-2xs cursor-pointer"
              title={isAr ? 'تصدير جدول الورديات إلى ملف إكسيل' : 'Export Shift Roster to Excel'}
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isAr ? 'تصدير الورديات (Excel)' : 'Export Excel'}</span>
            </button>

            {/* 3. Share Roster via WhatsApp */}
            <button
              onClick={handleShareWhatsApp}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
              title={isAr ? 'مشاركة جدول الورديات وتوجيهات المدير عبر تطبيق واتساب لفريق العمل' : 'Share Shift Schedule on WhatsApp'}
            >
              {copiedWhatsApp ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>
                {copiedWhatsApp
                  ? (isAr ? 'تم النسخ والفتح ✓' : 'Copied & Opened ✓')
                  : (isAr ? 'مشاركة عبر واتساب' : 'Share on WhatsApp')}
              </span>
            </button>

            {/* 4. Print Roster */}
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold border border-slate-300 transition-colors shadow-2xs cursor-pointer"
              title={isAr ? 'طباعة جدول النوبات لصالة العرض' : 'Print Shift Roster'}
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>{isAr ? 'طباعة الجدول' : 'Print'}</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-colors cursor-pointer"
          >
            {isAr ? 'تم وحفظ التوزيع' : 'Done & Save'}
          </button>
        </div>
      </div>
    </div>
  );
};
