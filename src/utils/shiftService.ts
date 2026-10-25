import * as XLSX from 'xlsx';
import {
  SalesRecord,
  ShiftType,
  EmployeeShiftAssignment,
  ShiftScheduleSummary,
} from '../types/sales';
import { formatCurrencyNumber } from './calculations';
import { downloadWorkbookSafely } from './excelParser';

export const STORAGE_KEY_SHIFTS = 'raya_concorde_shift_schedule';

export interface ShiftConfig {
  id: ShiftType;
  nameAr: string;
  nameEn: string;
  hours: string;
  start: string;
  end: string;
  durationHours: number;
  peakHoursCovered: number; // Peak is 18:00 - 22:00 (4 hours)
  peakCoveragePct: number;
  trafficSharePct: number;
  defaultRoleAr: string;
  defaultRoleEn: string;
  badgeColor: string;
}

export const SHIFT_CONFIGS: Record<ShiftType, ShiftConfig> = {
  evening_peak: {
    id: 'evening_peak',
    nameAr: 'وردية الذروة المسائية (Rush Window)',
    nameEn: 'Evening Peak Shift (Rush Window)',
    hours: '16:30 - 23:30',
    start: '16:30',
    end: '23:30',
    durationHours: 7.0,
    peakHoursCovered: 4.0, // 18:00 to 22:00
    peakCoveragePct: 100,
    trafficSharePct: 65,
    defaultRoleAr: 'إغلاق صفقات الهواتف الرائدة والتقسيط المكثف',
    defaultRoleEn: 'Flagship hand-offs & high-volume installment closing',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
  },
  morning: {
    id: 'morning',
    nameAr: 'الوردية الصباحية (الافتتاح والشركات)',
    nameEn: 'Morning Shift (Opening & B2B)',
    hours: '10:00 - 16:30',
    start: '10:00',
    end: '16:30',
    durationHours: 6.5,
    peakHoursCovered: 0,
    peakCoveragePct: 0,
    trafficSharePct: 35,
    defaultRoleAr: 'افتتاح المعرض، استلام البضائع، ومبيعات الشركات',
    defaultRoleEn: 'Store opening, receiving inventory & B2B sales',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
  },
  full_peak: {
    id: 'full_peak',
    nameAr: 'وردية اليوم الكامل / الويك إند (Double Rush)',
    nameEn: 'Full Day / Weekend Rush (Double Rush)',
    hours: '12:00 - 23:30',
    start: '12:00',
    end: '23:30',
    durationHours: 11.5,
    peakHoursCovered: 4.0,
    peakCoveragePct: 100,
    trafficSharePct: 85,
    defaultRoleAr: 'تغطية ممتدة لأيام العطلات والحملات الترويجية الكبرى',
    defaultRoleEn: 'Extended weekend footfall & flagship promo coverage',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
  },
  off: {
    id: 'off',
    nameAr: 'راحة أسبوعية (Day Off)',
    nameEn: 'Weekly Rest (Day Off)',
    hours: 'راحة معتمدة',
    start: '-',
    end: '-',
    durationHours: 0,
    peakHoursCovered: 0,
    peakCoveragePct: 0,
    trafficSharePct: 0,
    defaultRoleAr: 'إجازة مجدولة',
    defaultRoleEn: 'Scheduled rest day',
    badgeColor: 'bg-slate-100 text-slate-600 border-slate-300',
  },
};

/**
 * Returns formatted today date string in YYYY-MM-DD
 */
export function getTodayDateString(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

/**
 * Loads stored shift assignments from localStorage or builds intelligent defaults
 */
export function getPersistedShiftAssignments(
  records: SalesRecord[],
  selectedDate: string = getTodayDateString()
): EmployeeShiftAssignment[] {
  let savedMap: Record<string, EmployeeShiftAssignment> = {};

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(`${STORAGE_KEY_SHIFTS}_${selectedDate}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.forEach((s: EmployeeShiftAssignment) => {
            savedMap[s.employeeName] = s;
          });
        }
      }
    } catch {
      savedMap = {};
    }
  }

  // Generate assignments for current unique employees in records
  const uniqueEmployees = Array.from(
    new Map(records.map((r) => [r.employee, r])).values()
  );

  return uniqueEmployees.map((rec, index) => {
    // If previously saved by manager, use it
    if (savedMap[rec.employee]) {
      const saved = savedMap[rec.employee];
      // Keep up to date with latest sales actuals
      const cfg = SHIFT_CONFIGS[saved.shiftType] || SHIFT_CONFIGS.evening_peak;
      const hourlyActual = cfg.durationHours > 0 ? Math.round(rec.actual / cfg.durationHours) : 0;
      const hourlyTarget = cfg.durationHours > 0 ? Math.round(rec.target / cfg.durationHours) : 0;

      return {
        ...saved,
        actualSales: rec.actual,
        targetSales: rec.target,
        achievementRate: rec.achievementRate,
        hourlyActual,
        hourlyTarget,
      };
    }

    // Default smart assignment strategy based on Concorde Plaza historical metrics:
    // Ahmed Rabea: Top closer (111%) -> Evening Peak (4:30 - 23:30) on Flagships
    // Amr Abdelhaleem: High accessories attach -> Evening Peak (4:30 - 23:30) on Accessories
    // Tarek Mahmoud: Installments specialist -> Morning / Opening (10:00 - 16:30)
    let shiftType: ShiftType = 'evening_peak';
    let sectionFocus: 'mobiles_flagship' | 'accessories_warranty' | 'installments_aman' | 'general' = 'mobiles_flagship';
    let sectionFocusAr = 'الهواتف الذكية والفئات العليا (Flagships)';
    let sectionFocusEn = 'Flagship Smartphones';
    let assignedRole = 'إغلاق صفقات الفئات العليا والتارجت المسائي';

    if (rec.employee.includes('أحمد ربيع')) {
      shiftType = 'evening_peak';
      sectionFocus = 'mobiles_flagship';
      sectionFocusAr = 'الهواتف الذكية والفئات العليا (iPhone 16 / S24)';
      sectionFocusEn = 'Premium Smartphones (iPhone 16 / S24)';
      assignedRole = 'المستشار الأول لإغلاق صفقات الذروة الكبرى';
    } else if (rec.employee.includes('عمرو عبد الحليم')) {
      shiftType = 'evening_peak';
      sectionFocus = 'accessories_warranty';
      sectionFocusAr = 'حزم الإكسسوارات وضمان راية الممتد (Attach Rate)';
      sectionFocusEn = 'Accessories Bundling & Raya Extended Warranty';
      assignedRole = 'مسؤول رفع متوسط قيمة الفاتورة ومعدل البيع المتقاطع';
    } else if (rec.employee.includes('طارق محمود')) {
      // In default shift allocation, morning shift to manage opening & financing
      shiftType = index === 2 ? 'morning' : 'evening_peak';
      sectionFocus = 'installments_aman';
      sectionFocusAr = 'خدمات تقسيط أمان وفاليو (0% فوائد)';
      sectionFocusEn = 'Aman & ValU Consumer Installments (0% Interest)';
      assignedRole = 'مسؤول عقود التقسيط والتمويل الاستهلاكي الصباحي';
    } else {
      shiftType = index % 2 === 0 ? 'evening_peak' : 'morning';
      sectionFocus = 'general';
      sectionFocusAr = 'مبيعات عامة بصالة العرض';
      sectionFocusEn = 'Showroom General Sales';
      assignedRole = 'مستشار مبيعات عام';
    }

    const cfg = SHIFT_CONFIGS[shiftType];
    const durationHours = cfg.durationHours;
    const hourlyActual = durationHours > 0 ? Math.round(rec.actual / durationHours) : 0;
    const hourlyTarget = durationHours > 0 ? Math.round(rec.target / durationHours) : 0;

    return {
      employeeId: rec.employeeId || `14072${index}`,
      employeeName: rec.employee,
      branch: rec.branch || 'راية - فرع كونكورد بلازا',
      shiftType,
      shiftNameAr: cfg.nameAr,
      shiftNameEn: cfg.nameEn,
      shiftHours: cfg.hours,
      durationHours,
      peakHoursCovered: cfg.peakHoursCovered,
      peakCoveragePercentage: cfg.peakCoveragePct,
      sectionFocus,
      sectionFocusAr,
      sectionFocusEn,
      assignedRole,
      hourlyTarget,
      hourlyActual,
      achievementRate: rec.achievementRate,
      actualSales: rec.actual,
      targetSales: rec.target,
      date: selectedDate,
      notes: `نوبة عمل تشغيلية معتمدة لفرع كونكورد بلازا (${cfg.hours})`,
    };
  });
}

/**
 * Persists shift assignments for a specific date
 */
export function savePersistedShiftAssignments(
  shifts: EmployeeShiftAssignment[],
  selectedDate: string = getTodayDateString()
): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${STORAGE_KEY_SHIFTS}_${selectedDate}`, JSON.stringify(shifts));
    window.dispatchEvent(new CustomEvent('raya-shifts-updated', { detail: { date: selectedDate, shifts } }));
  } catch (err) {
    console.warn('Failed to save shifts:', err);
  }
}

/**
 * Smart Auto-Optimization Algorithm:
 * Balances peak coverage (18:00 - 22:00) where 65% of revenue happens,
 * placing top closers and advisors trailing targets into peak footfall.
 */
export function autoOptimizeShiftSchedule(
  records: SalesRecord[],
  selectedDate: string = getTodayDateString()
): EmployeeShiftAssignment[] {
  // Sort employees: trailing advisors (< 80%) first to recover, then top performers (> 100%)
  const sorted = [...records].sort((a, b) => {
    const aTrailing = a.achievementRate < 80;
    const bTrailing = b.achievementRate < 80;
    if (aTrailing && !bTrailing) return -1;
    if (!aTrailing && bTrailing) return 1;
    return b.actual - a.actual;
  });

  const optimized: EmployeeShiftAssignment[] = sorted.map((rec, index) => {
    // Top 2 employees get Evening Peak (16:30 - 23:30)
    // 3rd employee gets Morning (10:00 - 16:30) to guarantee opening coverage
    let shiftType: ShiftType = 'evening_peak';
    let sectionFocus: 'mobiles_flagship' | 'accessories_warranty' | 'installments_aman' | 'general' = 'mobiles_flagship';
    let sectionFocusAr = 'الهواتف الذكية والفئات العليا (Flagships)';
    let sectionFocusEn = 'Flagship Smartphones';
    let assignedRole = 'إغلاق صفقات هواتف الذروة';
    let notes = 'توزيع ذكي تلقائي معتمد من نظام راية الذكي';

    if (index === 0) {
      shiftType = 'evening_peak';
      sectionFocus = 'mobiles_flagship';
      sectionFocusAr = 'الهواتف الذكية والفئات العليا (iPhone 16 / S24)';
      sectionFocusEn = 'Flagship Smartphones';
      assignedRole = 'إغلاق صفقات الذروة الكبرى (أعلى معدل إنجاز)';
      notes = 'المستشار الأول في صالة العرض خلال ساعات الذروة (6م - 10م)';
    } else if (index === 1) {
      shiftType = 'evening_peak';
      sectionFocus = 'accessories_warranty';
      sectionFocusAr = 'حزم الإكسسوارات وضمان راية الممتد (Attach Rate)';
      sectionFocusEn = 'Accessories Bundles & Extended Warranty';
      assignedRole = 'تعظيم ملحقات الهواتف والضمان في الذروة المسائية';
      notes = 'تغطية مكثفة لحزم الإكسسوارات خلال ساعات الذروة';
    } else {
      shiftType = 'morning';
      sectionFocus = 'installments_aman';
      sectionFocusAr = 'برامج تقسيط أمان وفاليو (0% فوائد)';
      sectionFocusEn = 'Aman & ValU Consumer Installments';
      assignedRole = 'إدارة صالة العرض الصباحية واستقبال عملاء التقسيط';
      notes = 'تغطية الفترة الصباحية وإتمام طلبات التقسيط والجرد';
    }

    const cfg = SHIFT_CONFIGS[shiftType];
    const durationHours = cfg.durationHours;
    const hourlyActual = durationHours > 0 ? Math.round(rec.actual / durationHours) : 0;
    const hourlyTarget = durationHours > 0 ? Math.round(rec.target / durationHours) : 0;

    return {
      employeeId: rec.employeeId || `14072${index}`,
      employeeName: rec.employee,
      branch: rec.branch || 'راية - فرع كونكورد بلازا',
      shiftType,
      shiftNameAr: cfg.nameAr,
      shiftNameEn: cfg.nameEn,
      shiftHours: cfg.hours,
      durationHours,
      peakHoursCovered: cfg.peakHoursCovered,
      peakCoveragePercentage: cfg.peakCoveragePct,
      sectionFocus,
      sectionFocusAr,
      sectionFocusEn,
      assignedRole,
      hourlyTarget,
      hourlyActual,
      achievementRate: rec.achievementRate,
      actualSales: rec.actual,
      targetSales: rec.target,
      date: selectedDate,
      notes,
    };
  });

  savePersistedShiftAssignments(optimized, selectedDate);
  return optimized;
}

/**
 * Calculates executive summary statistics for a day's shift roster
 */
export function calculateShiftSummary(
  shifts: EmployeeShiftAssignment[],
  dateStr: string = getTodayDateString(),
  branchName: string = 'راية - فرع كونكورد بلازا'
): ShiftScheduleSummary {
  const totalScheduledStaff = shifts.filter((s) => s.shiftType !== 'off').length;
  const morningStaffCount = shifts.filter((s) => s.shiftType === 'morning').length;
  const eveningPeakStaffCount = shifts.filter((s) => s.shiftType === 'evening_peak').length;
  const fullDayStaffCount = shifts.filter((s) => s.shiftType === 'full_peak').length;
  const offStaffCount = shifts.filter((s) => s.shiftType === 'off').length;

  const totalStaffPeakHoursDelivered = shifts.reduce((sum, s) => sum + s.peakHoursCovered, 0);

  // Peak window is 4 hours (18:00 - 22:00). Ideal staffing in peak is >= 2 consultants
  let peakStaffingStatus: 'optimal' | 'moderate' | 'understaffed' = 'optimal';
  if (eveningPeakStaffCount + fullDayStaffCount >= 2) {
    peakStaffingStatus = 'optimal';
  } else if (eveningPeakStaffCount + fullDayStaffCount === 1) {
    peakStaffingStatus = 'moderate';
  } else {
    peakStaffingStatus = 'understaffed';
  }

  return {
    date: dateStr,
    branchName,
    totalScheduledStaff,
    morningStaffCount,
    eveningPeakStaffCount,
    fullDayStaffCount,
    offStaffCount,
    totalPeakHoursAvailable: 4.0,
    totalStaffPeakHoursDelivered,
    peakStaffingStatus,
    eveningRevenueSharePct: 65,
    shifts,
  };
}

/**
 * Generates an executive WhatsApp message with the daily shift roster for the team
 */
export function generateShiftScheduleWhatsAppMessage(
  shifts: EmployeeShiftAssignment[],
  dateStr: string = getTodayDateString(),
  lang: 'ar' | 'en' = 'ar'
): string {
  const isAr = lang === 'ar';
  const summary = calculateShiftSummary(shifts, dateStr);

  if (isAr) {
    const shiftList = shifts
      .map((s, idx) => {
        const icon =
          s.shiftType === 'evening_peak'
            ? '🔥🌙'
            : s.shiftType === 'morning'
            ? '☀️'
            : s.shiftType === 'full_peak'
            ? '⚡'
            : '🏖️';
        return `${idx + 1}. ${icon} *${s.employeeName}* (كود: #${s.employeeId || 'Staff'})
   ⏰ *الوردية:* ${s.shiftNameAr} [${s.shiftHours}]
   🎯 *القسم المسؤول:* ${s.sectionFocusAr}
   🌟 *تغطية الذروة (6-10م):* ${s.peakHoursCovered > 0 ? `مغطاة (${s.peakHoursCovered} ساعات - 100%)` : 'فترة صباحية'}
   💼 *الدور:* ${s.assignedRole}`;
      })
      .join('\n\n');

    return `📋 *جدول نوبات العمل وتوزيع ساعات الذروة اليومي* 🏢
*فرع راية كونكورد بلازا (التجمع الخامس)*
📅 *التاريخ:* ${dateStr}
━━━━━━━━━━━━━━━━━━━━
📊 *ملخص التغطية التشغيلية:*
• إجمالي المستشارين المجدولين: ${summary.totalScheduledStaff} مستشارين
• قوة الذروة المسائية (16:30 - 23:30): ${summary.eveningPeakStaffCount + summary.fullDayStaffCount} مستشارين (حصة الذروة 65% من المبيعات)
• تغطية الوردية الصباحية (10:00 - 16:30): ${summary.morningStaffCount} مستشار
• حالة التغطية في ساعات الذروة (6م - 10م): ${
      summary.peakStaffingStatus === 'optimal'
        ? 'مثالية ومكتملة ✓ (2+ مستشارين في الصالة)'
        : 'تحت المتابعة'
    }

━━━━━━━━━━━━━━━━━━━━
👥 *توزيع النوبات والمهام:*

${shiftList}

━━━━━━━━━━━━━━━━━━━━
⚡ *توجيهات تشغيلية لمدير الفرع:*
• التركيز على تفعيل عروض تقسيط أمان وباقات الإكسسوارات مع كل جهاز مباع.
• التواجد المكثف بصالة العرض بين 6:00 مساءً و 10:00 مساءً لتغطية كثافة الزوار.
• تمنياتنا للجميع بيوم بيعي مميز وتحقيق أعلى الحوافز! 🚀

*مدير فرع كونكورد بلازا: أ/ هاني حنا (Hany Hanna)*
*منظومة راية للتجارة والتوزيع*`;
  } else {
    const shiftList = shifts
      .map((s, idx) => {
        return `${idx + 1}. *${s.employeeName}* (#${s.employeeId || 'Staff'})
   ⏰ Shift: ${s.shiftNameEn} [${s.shiftHours}]
   🎯 Section: ${s.sectionFocusEn}
   🔥 Peak Coverage: ${s.peakHoursCovered} hrs
   💼 Role: ${s.assignedRole}`;
      })
      .join('\n\n');

    return `📋 *Daily Shift Roster & Peak Hours Allocation* 🏢
*Raya Concorde Plaza Branch (Fifth Settlement)*
📅 Date: ${dateStr}
━━━━━━━━━━━━━━━━━━━━
Total Scheduled: ${summary.totalScheduledStaff}
Evening Peak Staff: ${summary.eveningPeakStaffCount + summary.fullDayStaffCount} (Covers 65% revenue rush)
Morning Staff: ${summary.morningStaffCount}

${shiftList}

Branch Manager: Hany Hanna · Raya Retail`;
  }
}

/**
 * Exports the daily shift schedule to a formatted Excel file
 */
export function exportShiftScheduleToExcel(
  shifts: EmployeeShiftAssignment[],
  dateStr: string = getTodayDateString(),
  lang: 'ar' | 'en' = 'ar'
): void {
  const isAr = lang === 'ar';

  const exportRows = shifts.map((s, index) => {
    if (isAr) {
      return {
        'م': index + 1,
        'كود الموظف': s.employeeId || '',
        'اسم مستشار المبيعات': s.employeeName,
        'الفرع': s.branch,
        'نوبة العمل': s.shiftNameAr,
        'مواعيد الوردية': s.shiftHours,
        'إجمالي ساعات العمل': s.durationHours,
        'ساعات تغطية الذروة (6م - 10م)': s.peakHoursCovered,
        'نسبة تغطية الذروة': `${s.peakCoveragePercentage}%`,
        'القسم والتخصص': s.sectionFocusAr,
        'الدور التشغيلي': s.assignedRole,
        'المستهدف البيعي (ج.م)': s.targetSales,
        'المحقق الفعلي (ج.م)': s.actualSales,
        'نسبة التحقيق': `${s.achievementRate}%`,
        'معدل المبيعات بالساعة (ج.م/ساعة)': s.hourlyActual,
        'تاريخ النوبة': s.date,
        'ملاحظات': s.notes || '',
      };
    } else {
      return {
        '#': index + 1,
        'Staff ID': s.employeeId || '',
        'Consultant Name': s.employeeName,
        'Branch': s.branch,
        'Shift': s.shiftNameEn,
        'Hours': s.shiftHours,
        'Total Duration (Hrs)': s.durationHours,
        'Peak Coverage (Hrs)': s.peakHoursCovered,
        'Peak Coverage %': `${s.peakCoveragePercentage}%`,
        'Section Focus': s.sectionFocusEn,
        'Role': s.assignedRole,
        'Sales Target': s.targetSales,
        'Actual Sales': s.actualSales,
        'Achievement Rate': `${s.achievementRate}%`,
        'Hourly Run-Rate': s.hourlyActual,
        'Date': s.date,
        'Notes': s.notes || '',
      };
    }
  });

  const worksheet = XLSX.utils.json_to_sheet(exportRows);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 5 },
    { wch: 12 },
    { wch: 22 },
    { wch: 24 },
    { wch: 28 },
    { wch: 16 },
    { wch: 18 },
    { wch: 24 },
    { wch: 16 },
    { wch: 32 },
    { wch: 36 },
    { wch: 18 },
    { wch: 18 },
    { wch: 14 },
    { wch: 24 },
    { wch: 14 },
    { wch: 35 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    isAr ? 'توزيع_ورديات_كونكورد' : 'Concorde_Shifts'
  );

  const fileName = `Raya_Concorde_Shifts_${dateStr}.xlsx`;
  downloadWorkbookSafely(workbook, fileName, exportRows as unknown as Record<string, unknown>[]);
}
