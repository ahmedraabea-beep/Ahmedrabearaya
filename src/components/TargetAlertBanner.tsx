import React, { useState } from 'react';
import {
  Bell,
  Trophy,
  Zap,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ExternalLink,
  Building2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  SalesRecord,
  Currency,
  Language,
  TargetMilestoneAlert,
  NotificationSettings,
} from '../types/sales';
import { formatCurrencyNumber } from '../utils/calculations';
import { extractTargetMilestoneAlerts, playCelebrationChime } from '../utils/notificationService';
import { triggerCelebrationConfetti } from '../utils/confetti';

interface TargetAlertBannerProps {
  records: SalesRecord[];
  currency: Currency;
  language: Language;
  settings: NotificationSettings;
  onOpenNotificationCenter: () => void;
  onSelectEmployee: (name: string) => void;
  branchOverallRate?: number;
}

export const TargetAlertBanner: React.FC<TargetAlertBannerProps> = ({
  records,
  currency,
  language,
  settings,
  onOpenNotificationCenter,
  onSelectEmployee,
  branchOverallRate = 0,
}) => {
  const isAr = language === 'ar';
  const [isExpanded, setIsExpanded] = useState(true);

  const alerts = extractTargetMilestoneAlerts(records);
  const achievers100 = alerts.filter((a) => a.type === 'achieved_100');
  const near90 = alerts.filter((a) => a.type === 'near_90');

  // If no one is at 90% or 100%, show a gentle standby state or nothing
  if (alerts.length === 0 && branchOverallRate < 90) {
    return null;
  }

  const handleCelebrateBranch = () => {
    triggerCelebrationConfetti();
    if (settings.soundEnabled) {
      playCelebrationChime();
    }
  };

  return (
    <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white rounded-2xl p-4 sm:p-5 border border-emerald-500/30 shadow-lg relative overflow-hidden transition-all">
      {/* Decorative background glow */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Main Header Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center shrink-0 shadow-md relative">
            <Bell className="w-5 h-5 animate-bounce" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full animate-ping" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-extrabold text-white text-sm sm:text-base tracking-tight flex items-center gap-1.5">
                <span>{isAr ? 'رادار التارجت اللحظي' : 'Live Target Milestone Radar'}</span>
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {isAr ? 'تنبيهات فورية نشطة' : 'Active Push Radar'}
              </span>
            </div>

            <p className="text-xs text-slate-300 mt-0.5">
              {achievers100.length > 0 && near90.length > 0 ? (
                <>
                  <span className="text-emerald-400 font-bold">
                    🎉 {achievers100.length} {isAr ? 'مستشار كسروا 100% التارجت' : 'achieved 100%+'}
                  </span>
                  {' · '}
                  <span className="text-amber-300 font-bold">
                    ⚡ {near90.length} {isAr ? 'مستشار اقتربوا من الهدف (90%+)' : 'nearing target (90%+)'}
                  </span>
                </>
              ) : achievers100.length > 0 ? (
                <span className="text-emerald-400 font-bold">
                  🎉 {achievers100.length} {isAr ? 'مستشار كسروا 100% التارجت بنجاح!' : 'consultants reached 100%+!'}
                </span>
              ) : (
                <span className="text-amber-300 font-bold">
                  ⚡ {near90.length} {isAr ? 'مستشار اقتربوا من الهدف (90%+)' : 'consultants nearing target!'}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          {/* Celebrate Button */}
          <button
            onClick={handleCelebrateBranch}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/30 text-xs font-bold transition-all cursor-pointer active:scale-95"
            title={isAr ? 'احتفال بإنجاز الموظفين' : 'Celebrate team performance'}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{isAr ? 'احتفال 🎉' : 'Celebrate'}</span>
          </button>

          {/* Open Notification Center Button */}
          <button
            onClick={onOpenNotificationCenter}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-md transition-all cursor-pointer active:scale-95"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>{isAr ? 'مركز التنبيهات' : 'Alert Center'}</span>
            <span className="w-5 h-5 rounded-full bg-slate-900/40 text-emerald-200 text-[10px] flex items-center justify-center font-bold">
              {alerts.length}
            </span>
          </button>

          {/* Expand/Collapse Toggle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            title={isExpanded ? (isAr ? 'طي البطاقات' : 'Collapse') : (isAr ? 'توسيع' : 'Expand')}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Quick Cards */}
      {isExpanded && (
        <div className="mt-4 pt-3 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 relative z-10">
          {alerts.map((alert) => {
            const is100 = alert.type === 'achieved_100';

            return (
              <div
                key={alert.id}
                onClick={() => onSelectEmployee(alert.employeeName)}
                className={`p-3 rounded-xl border backdrop-blur-md transition-all cursor-pointer hover:scale-[1.01] hover:shadow-md ${
                  is100
                    ? 'bg-emerald-950/40 border-emerald-500/40 hover:border-emerald-400 text-emerald-50'
                    : 'bg-amber-950/40 border-amber-500/40 hover:border-amber-400 text-amber-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${
                        is100 ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
                      }`}
                    >
                      {is100 ? <Trophy className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />}
                    </span>
                    <span className="font-extrabold text-xs text-white">
                      {alert.employeeName}
                    </span>
                  </div>

                  <span
                    className={`text-xs font-black px-2 py-0.5 rounded-full ${
                      is100
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                    }`}
                  >
                    {alert.achievementRate}%
                  </span>
                </div>

                {/* Mini progress bar */}
                <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mb-2">
                  <div
                    className={`h-full rounded-full ${
                      is100
                        ? 'bg-gradient-to-r from-emerald-400 to-teal-300'
                        : 'bg-gradient-to-r from-amber-400 to-yellow-300'
                    }`}
                    style={{ width: `${Math.min(alert.achievementRate, 100)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-300">
                  <span>
                    {formatCurrencyNumber(alert.actual, currency)} / {formatCurrencyNumber(alert.target, currency)}
                  </span>
                  <span
                    className={`font-bold ${
                      is100 ? 'text-emerald-300' : 'text-amber-300'
                    }`}
                  >
                    {is100
                      ? `+${formatCurrencyNumber(alert.remainingAmount, currency)} ${isAr ? 'فائض' : 'surplus'}`
                      : `${isAr ? 'متبقي' : 'left'}: ${formatCurrencyNumber(alert.remainingAmount, currency)}`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
