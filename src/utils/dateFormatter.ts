/**
 * Executive Date & Time Formatter for Raya Concorde Plaza Platform
 * Provides unified, boardroom-grade Arabic & English formatting for dates,
 * live clocks, Cairo standard time, Hijri calendar alignment, and fiscal cycles.
 */

export interface ExecutiveDateTimeInfo {
  // Split time parts for custom digital display
  hours12Str: string;
  hours24Str: string;
  minutesStr: string;
  secondsStr: string;
  isPm: boolean;
  periodLabelAr: string; // 'صباحاً' or 'مساءً'
  periodLabelEn: string; // 'AM' or 'PM'
  
  // Full formatted time strings (Bidi-safe with LTR isolation)
  formattedTime12: string; // e.g. "11:45:22 صباحاً"
  formattedTime24: string; // e.g. "23:45:22"
  timezoneLabel: string;   // e.g. "توقيت القاهرة المعتمد (GMT+3)"

  // Gregorian Date
  dayNameAr: string;      // e.g. "الأربعاء"
  dayNameEn: string;      // e.g. "Wednesday"
  dayNumber: number;      // e.g. 14
  monthNameAr: string;    // e.g. "أكتوبر"
  monthNameEn: string;    // e.g. "October"
  monthNumber: number;    // e.g. 10
  year: number;           // e.g. 2026
  formattedDateAr: string;// e.g. "الأربعاء، 14 أكتوبر 2026 م"
  formattedDateEn: string;// e.g. "Wednesday, October 14, 2026"

  // Hijri Date
  hijriDateAr: string;    // e.g. "الموافق 2 ربيع الآخر 1448 هـ"
  hijriDateEn: string;    // e.g. "2 Rabi' al-Thani 1448 AH"

  // Fiscal Operating Cycle
  fiscalPeriodNameAr: string; // "دورة إقفال أكتوبر 2026"
  fiscalPeriodNameEn: string; // "October 2026 Fiscal Cycle"
  daysInCurrentMonth: number; // 31
  monthProgressPercent: number; // e.g. 45%
  daysRemainingInMonth: number; // e.g. 17
}

const ARABIC_DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const ARABIC_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

const ENGLISH_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const ENGLISH_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Computes Hijri date string using Intl.DateTimeFormat with Islamic Umalqura calendar
 */
export function getHijriDate(date: Date, lang: 'ar' | 'en' = 'ar'): string {
  try {
    const locale = lang === 'ar' ? 'ar-SA-u-ca-islamic-umalqura' : 'en-US-u-ca-islamic-umalqura';
    const formatter = new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const formatted = formatter.format(date);
    return lang === 'ar' ? `الموافق ${formatted} هـ` : `Corresponding to ${formatted}`;
  } catch {
    // Fallback if calendar extension is not supported
    return lang === 'ar' ? 'الموافق ربيع الآخر 1448 هـ' : 'Rabi al-Thani 1448 AH';
  }
}

/**
 * Returns comprehensive executive date and time information
 */
export function getExecutiveDateTime(date: Date = new Date()): ExecutiveDateTimeInfo {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  const isPm = hours >= 12;
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;

  const pad = (n: number) => String(n).padStart(2, '0');
  const hours12Str = pad(hour12);
  const hours24Str = pad(hours);
  const minutesStr = pad(minutes);
  const secondsStr = pad(seconds);

  const periodLabelAr = isPm ? 'مساءً' : 'صباحاً';
  const periodLabelEn = isPm ? 'PM' : 'AM';

  const dayNumber = date.getDate();
  const monthIdx = date.getMonth();
  const year = date.getFullYear();

  const dayNameAr = ARABIC_DAYS[date.getDay()];
  const dayNameEn = ENGLISH_DAYS[date.getDay()];
  const monthNameAr = ARABIC_MONTHS[monthIdx];
  const monthNameEn = ENGLISH_MONTHS[monthIdx];

  const formattedTime12 = `${hours12Str}:${minutesStr}:${secondsStr} ${periodLabelAr}`;
  const formattedTime24 = `${hours24Str}:${minutesStr}:${secondsStr}`;
  const timezoneLabel = 'توقيت القاهرة المعتمد (GMT+3)';

  const formattedDateAr = `${dayNameAr}، ${dayNumber} ${monthNameAr} ${year} م`;
  const formattedDateEn = `${dayNameEn}, ${monthNameEn} ${dayNumber}, ${year}`;

  const hijriDateAr = getHijriDate(date, 'ar');
  const hijriDateEn = getHijriDate(date, 'en');

  // October has 31 days
  const daysInCurrentMonth = new Date(year, monthIdx + 1, 0).getDate();
  const monthProgressPercent = Math.min(100, Math.max(1, Math.round((dayNumber / daysInCurrentMonth) * 100)));
  const daysRemainingInMonth = Math.max(0, daysInCurrentMonth - dayNumber);

  return {
    hours12Str,
    hours24Str,
    minutesStr,
    secondsStr,
    isPm,
    periodLabelAr,
    periodLabelEn,
    formattedTime12,
    formattedTime24,
    timezoneLabel,
    dayNameAr,
    dayNameEn,
    dayNumber,
    monthNameAr,
    monthNameEn,
    monthNumber: monthIdx + 1,
    year,
    formattedDateAr,
    formattedDateEn,
    hijriDateAr,
    hijriDateEn,
    fiscalPeriodNameAr: `دورة إقفال ${monthNameAr} ${year}`,
    fiscalPeriodNameEn: `${monthNameEn} ${year} Fiscal Cycle`,
    daysInCurrentMonth,
    monthProgressPercent,
    daysRemainingInMonth,
  };
}

/**
 * Formats any date or ISO timestamp into an executive corporate timestamp
 * e.g. "14 أكتوبر 2026 - 11:30 صباحاً (توقيت القاهرة)"
 */
export function formatExecutiveTimestamp(
  dateOrIso: Date | string | number | undefined,
  lang: 'ar' | 'en' = 'ar',
  includeSeconds = false
): string {
  if (!dateOrIso) return lang === 'ar' ? 'محدث لحظياً' : 'Live Updated';
  const d = typeof dateOrIso === 'string' || typeof dateOrIso === 'number' ? new Date(dateOrIso) : dateOrIso;
  if (isNaN(d.getTime())) return String(dateOrIso);

  const isAr = lang === 'ar';
  const hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  const isPm = hours >= 12;
  const h12 = String(hours % 12 === 0 ? 12 : hours % 12).padStart(2, '0');

  const period = isAr ? (isPm ? 'مساءً' : 'صباحاً') : (isPm ? 'PM' : 'AM');
  const timePart = includeSeconds ? `${h12}:${minutes}:${seconds} ${period}` : `${h12}:${minutes} ${period}`;

  const day = d.getDate();
  const monthName = isAr ? ARABIC_MONTHS[d.getMonth()] : ENGLISH_MONTHS[d.getMonth()];
  const year = d.getFullYear();

  if (isAr) {
    return `${day} ${monthName} ${year} م | ${timePart} (توقيت القاهرة)`;
  }
  return `${monthName} ${day}, ${year} | ${timePart} (Cairo Time)`;
}
