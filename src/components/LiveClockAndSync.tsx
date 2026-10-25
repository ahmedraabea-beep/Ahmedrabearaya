import React, { useState, useEffect } from 'react';
import {
  Clock,
  RefreshCw,
  Smartphone,
  Laptop,
  CheckCircle2,
  Calendar,
  Building2,
  Activity,
  Globe,
  Radio,
  SlidersHorizontal,
} from 'lucide-react';
import { Language } from '../types/sales';
import { getExecutiveDateTime, formatExecutiveTimestamp } from '../utils/dateFormatter';

interface LiveClockAndSyncProps {
  language: Language;
  lastUpdated: string;
  isSyncing: boolean;
  onManualSync: () => void;
  onOpenMobileModal: () => void;
}

export const LiveClockAndSync: React.FC<LiveClockAndSyncProps> = ({
  language,
  lastUpdated,
  isSyncing,
  onManualSync,
  onOpenMobileModal,
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [use24Hour, setUse24Hour] = useState<boolean>(false);
  const isAr = language === 'ar';

  // Live ticking clock with precise 1-second interval
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute rich executive date and time information
  const execTime = getExecutiveDateTime(currentDate);

  // Split digits for high-end digital clock display
  const displayHours = use24Hour ? execTime.hours24Str : execTime.hours12Str;
  const displayPeriod = isAr ? execTime.periodLabelAr : execTime.periodLabelEn;

  // Formatted last sync timestamp
  const lastSyncFormatted = lastUpdated
    ? formatExecutiveTimestamp(lastUpdated, language)
    : isAr
    ? 'محدث الآن بنجاح'
    : 'Synced just now';

  return (
    <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 text-white rounded-2xl border-2 border-slate-800 p-3.5 sm:p-4 shadow-xl overflow-hidden relative">
      {/* Subtle ambient lighting */}
      <div className="absolute -top-16 -right-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* ======================================================== */}
        {/* Left Section: Executive Master Clock & Certified Dates   */}
        {/* ======================================================== */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          {/* Executive Digital Clock Panel */}
          <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-700/80 px-3.5 py-2 rounded-xl shadow-inner backdrop-blur-md">
            {/* Pulsing Live Clock Icon */}
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 flex items-center justify-center shrink-0 shadow-xs relative">
              <Clock className="w-5 h-5 text-emerald-400" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-900 animate-pulse" />
            </div>

            {/* High-Precision Digital Digits */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                {/* Digits Display (Strictly LTR to prevent Arabic colon inversion) */}
                <div
                  dir="ltr"
                  className="font-mono tabular-nums font-black text-lg sm:text-xl text-white tracking-wider flex items-center gap-1 select-none"
                >
                  <span className="bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 text-emerald-300">
                    {displayHours}
                  </span>
                  <span className="text-emerald-400 font-bold animate-pulse">:</span>
                  <span className="bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 text-white">
                    {execTime.minutesStr}
                  </span>
                  <span className="text-emerald-400 font-bold animate-pulse">:</span>
                  <span className="bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 text-slate-300 text-base">
                    {execTime.secondsStr}
                  </span>
                </div>

                {/* AM/PM or 24H Badge */}
                {!use24Hour && (
                  <span className="text-[11px] font-bold text-amber-300 bg-amber-950/80 border border-amber-500/40 px-2 py-0.5 rounded-md">
                    {displayPeriod}
                  </span>
                )}

                {/* 12h/24h toggle */}
                <button
                  type="button"
                  onClick={() => setUse24Hour(!use24Hour)}
                  className="text-[10px] text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-1.5 py-0.5 rounded border border-slate-700 transition-colors cursor-pointer"
                  title={isAr ? 'التبديل بين نظام 12 ساعة و 24 ساعة' : 'Toggle 12h / 24h format'}
                >
                  {use24Hour ? '24H' : '12H'}
                </button>
              </div>

              {/* Timezone & Location Badge */}
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                  <Globe className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span>{isAr ? 'توقيت القاهرة المعتمد (GMT+3)' : 'Official Cairo Time (GMT+3)'}</span>
                </span>
                <span className="text-slate-600 text-[10px]">•</span>
                <span className="text-[10px] text-slate-400 font-medium">
                  {isAr ? 'مصر' : 'Egypt Standard'}
                </span>
              </div>
            </div>
          </div>

          {/* Gregorian & Hijri Official Corporate Date Badge */}
          <div className="flex flex-col justify-center bg-slate-900/70 border border-slate-800 px-3.5 py-1.5 rounded-xl text-xs">
            {/* Gregorian Date */}
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span className="font-black text-white text-xs sm:text-sm">
                {isAr ? execTime.formattedDateAr : execTime.formattedDateEn}
              </span>
            </div>

            {/* Hijri Calendar Alignment */}
            <div className="text-[11px] text-amber-300/90 font-medium mt-0.5 ps-5.5">
              {isAr ? execTime.hijriDateAr : execTime.hijriDateEn}
            </div>
          </div>

          {/* Fiscal Cycle & October Progress */}
          <div className="hidden xl:flex items-center gap-2.5 bg-slate-900/60 border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
            <Activity className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-[11px]">
                  {isAr ? 'دورة إقفال أكتوبر 2026' : 'October 2026 Fiscal Cycle'}
                </span>
                <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950 px-1.5 py-0.2 rounded border border-emerald-500/30 font-mono">
                  {execTime.monthProgressPercent}%
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block font-mono">
                {isAr
                  ? `اليوم ${execTime.dayNumber} من ${execTime.daysInCurrentMonth} يوماً (متبقي ${execTime.daysRemainingInMonth} يوم)`
                  : `Day ${execTime.dayNumber} of ${execTime.daysInCurrentMonth} (${execTime.daysRemainingInMonth}d left)`}
              </span>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* Right Section: Real-time Cloud Sync & Mobile Remote View */}
        {/* ======================================================== */}
        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto shrink-0">
          {/* Real-time Central Server Connection State */}
          <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-3 py-2 rounded-xl text-xs shadow-inner">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="w-2 h-2 rounded-full bg-emerald-400 -ms-3.5" />
              <span className="text-slate-400 text-[11px] font-medium hidden sm:inline">
                {isAr ? 'السيرفر المركزي:' : 'Central Hub:'}
              </span>
            </div>

            {/* Sync Timestamp */}
            <span className="text-slate-300 font-mono text-[11px] max-w-[190px] truncate" title={lastSyncFormatted}>
              {lastSyncFormatted}
            </span>

            {/* Manual Sync Trigger */}
            <button
              type="button"
              onClick={onManualSync}
              disabled={isSyncing}
              className={`p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer ${
                isSyncing ? 'animate-spin text-emerald-400' : ''
              }`}
              title={isAr ? 'مزامنة وتحديث البيانات فوراً مع الخادم' : 'Sync data instantly with server'}
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Mobile Modal Trigger */}
          <button
            type="button"
            onClick={onOpenMobileModal}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-emerald-300 hover:text-white bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 rounded-xl transition-all cursor-pointer shadow-sm active:scale-95"
            title={isAr ? 'فتح رمز QR لعرض التطبيق على الهاتف المحمول' : 'Open Mobile QR View'}
          >
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span>{isAr ? 'عرض الموبايل' : 'Mobile View'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
