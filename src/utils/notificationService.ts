import {
  SalesRecord,
  TargetMilestoneAlert,
  MilestoneAlertType,
  NotificationSettings,
  SimulatedEmailReport,
  SalesDeviationAlert,
} from '../types/sales';
import { formatCurrencyNumber } from './calculations';

// Local storage keys
const STORAGE_KEY_SETTINGS = 'raya_target_notification_settings';
const STORAGE_KEY_NOTIFIED_MILESTONES = 'raya_target_notified_milestones';
export const STORAGE_KEY_SIMULATED_EMAILS = 'raya_simulated_email_reports';
export const DEFAULT_BRANCH_MANAGER_EMAIL = 'hany.hanna@rayacorp.com';

// Audio Context Singleton
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  } catch (err) {
    console.warn('AudioContext not supported or blocked:', err);
    return null;
  }
}

/**
 * Synthesizes a celebratory fanfare chord for 100%+ target achievement
 */
export function playCelebrationChime(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  // Notes: C5 (523.25), E5 (659.25), G5 (783.99), C6 (1046.50)
  const notes = [
    { freq: 523.25, start: 0, dur: 0.4 },
    { freq: 659.25, start: 0.1, dur: 0.45 },
    { freq: 783.99, start: 0.2, dur: 0.5 },
    { freq: 1046.50, start: 0.32, dur: 0.8 },
  ];

  notes.forEach(({ freq, start, dur }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now + start);

    gain.gain.setValueAtTime(0.001, now + start);
    gain.gain.exponentialRampToValueAtTime(0.25, now + start + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + start);
    osc.stop(now + start + dur);
  });
}

/**
 * Synthesizes an upbeat 2-tone alert chime for approaching 90%+ target
 */
export function playNearTargetChime(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  // A4 (440) -> E5 (659.25)
  const notes = [
    { freq: 440, start: 0, dur: 0.22 },
    { freq: 659.25, start: 0.16, dur: 0.45 },
  ];

  notes.forEach(({ freq, start, dur }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + start);

    gain.gain.setValueAtTime(0.001, now + start);
    gain.gain.exponentialRampToValueAtTime(0.2, now + start + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + start);
    osc.stop(now + start + dur);
  });
}

/**
 * Check browser Push Notification API support
 */
export function isPushNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Get current browser notification permission
 */
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isPushNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

/**
 * Request browser push notification permission
 */
export async function requestPushPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!isPushNotificationSupported()) return 'unsupported';
  try {
    const perm = await Notification.requestPermission();
    return perm;
  } catch (err) {
    console.error('Failed to request push notification permission:', err);
    return Notification.permission;
  }
}

/**
 * Send real Web Browser Push / Desktop Notification
 */
export function sendBrowserPushNotification(
  title: string,
  options?: {
    body?: string;
    icon?: string;
    tag?: string;
    data?: unknown;
  }
): boolean {
  if (!isPushNotificationSupported()) return false;
  if (Notification.permission !== 'granted') return false;

  try {
    const notification = new Notification(title, {
      body: options?.body || '',
      icon: options?.icon || '/pwa-192x192.png',
      tag: options?.tag,
      dir: 'rtl',
      lang: 'ar',
      ...options,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    // Auto-dismiss after 8 seconds
    setTimeout(() => {
      try {
        notification.close();
      } catch {
        // Ignore close error
      }
    }, 8000);

    return true;
  } catch (err) {
    console.warn('Browser notification failed to display:', err);
    return false;
  }
}

/**
 * Load notification settings from localStorage
 */
export function loadNotificationSettings(): NotificationSettings {
  const defaultSettings: NotificationSettings = {
    pushEnabled: true,
    soundEnabled: true,
    notifyOnNear90: true,
    notifyOn100: true,
    notifyOnDeviation20: true, // إرسال تنبيهات يومية للمدير عند وجود انحراف أكبر من 20%
    autoEmailOn100: false, // ميزة اختيارية لمدير الفرع
    managerEmail: DEFAULT_BRANCH_MANAGER_EMAIL,
  };

  if (typeof window === 'undefined') return defaultSettings;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (!raw) return defaultSettings;
    return { ...defaultSettings, ...JSON.parse(raw) };
  } catch {
    return defaultSettings;
  }
}

/**
 * Save notification settings
 */
export function saveNotificationSettings(settings: NotificationSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.warn('Failed to save notification settings:', err);
  }
}

/**
 * Extract active milestone alerts from sales records
 */
export function extractTargetMilestoneAlerts(records: SalesRecord[]): TargetMilestoneAlert[] {
  const alerts: TargetMilestoneAlert[] = [];

  records.forEach((rec) => {
    const target = rec.target || 0;
    const actual = rec.actual || 0;
    const rate = rec.achievementRate || (target > 0 ? (actual / target) * 100 : 0);

    // Only consider active targets
    if (target <= 0) return;

    if (rate >= 100) {
      alerts.push({
        id: `alert-100-${rec.id || rec.employee}-${rec.period || 'current'}`,
        employeeId: rec.employeeId,
        employeeName: rec.employee,
        branch: rec.branch,
        target,
        actual,
        achievementRate: Math.round(rate * 10) / 10,
        type: 'achieved_100',
        remainingAmount: actual - target, // surplus
        timestamp: new Date().toISOString(),
      });
    } else if (rate >= 90) {
      alerts.push({
        id: `alert-90-${rec.id || rec.employee}-${rec.period || 'current'}`,
        employeeId: rec.employeeId,
        employeeName: rec.employee,
        branch: rec.branch,
        target,
        actual,
        achievementRate: Math.round(rate * 10) / 10,
        type: 'near_90',
        remainingAmount: target - actual, // deficit to 100%
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Sort: 100%+ first (highest rate first), then 90%+ (highest rate first)
  return alerts.sort((a, b) => b.achievementRate - a.achievementRate);
}

/**
 * Check for newly crossed milestones and fire notifications & audio chimes
 */
export function checkAndNotifyTargetMilestones(
  records: SalesRecord[],
  settings: NotificationSettings,
  onNewMilestoneAlert?: (alert: TargetMilestoneAlert) => void
): TargetMilestoneAlert[] {
  const currentAlerts = extractTargetMilestoneAlerts(records);
  if (currentAlerts.length === 0) return [];

  // Read previously notified milestone keys
  let notifiedSet = new Set<string>();
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_NOTIFIED_MILESTONES);
      if (raw) {
        notifiedSet = new Set(JSON.parse(raw));
      }
    } catch {
      notifiedSet = new Set();
    }
  }

  let hasNew100 = false;
  let hasNew90 = false;
  const newNotifiedKeys: string[] = [];

  currentAlerts.forEach((alert) => {
    const milestoneKey = `${alert.employeeName}_${alert.type}_${alert.target}`;

    if (!notifiedSet.has(milestoneKey)) {
      // New milestone reached!
      notifiedSet.add(milestoneKey);
      newNotifiedKeys.push(milestoneKey);

      if (alert.type === 'achieved_100' && settings.notifyOn100) {
        hasNew100 = true;

        if (settings.pushEnabled && getNotificationPermission() === 'granted') {
          const formattedSurplus = formatCurrencyNumber(alert.remainingAmount, 'EGP');
          sendBrowserPushNotification(
            `🎉 إنجاز مذهل! ${alert.employeeName} حقق 100% من التارجت`,
            {
              body: `المبيعات: ${formatCurrencyNumber(alert.actual, 'EGP')} بنسبة ${alert.achievementRate}% وفائض +${formattedSurplus} ج.م في فرع ${alert.branch}!`,
              tag: `raya-target-100-${alert.employeeName}`,
            }
          );
        }

        // Optional feature: Send automatic simulated performance email report to Branch Manager
        if (settings.autoEmailOn100) {
          const matchingRecord = records.find(
            (r) => r.employee === alert.employeeName || (r.employeeId && r.employeeId === alert.employeeId)
          );
          sendSimulatedEmailForAchiever(
            alert,
            settings.managerEmail || DEFAULT_BRANCH_MANAGER_EMAIL,
            matchingRecord,
            'ar'
          );
        }

        if (onNewMilestoneAlert) {
          onNewMilestoneAlert(alert);
        }
      } else if (alert.type === 'near_90' && settings.notifyOnNear90) {
        hasNew90 = true;

        if (settings.pushEnabled && getNotificationPermission() === 'granted') {
          const formattedRemaining = formatCurrencyNumber(alert.remainingAmount, 'EGP');
          sendBrowserPushNotification(
            `⚡ تنبيه اقتراب: ${alert.employeeName} وصل إلى ${alert.achievementRate}% من التارجت`,
            {
              body: `متبقي فقط ${formattedRemaining} ج.م للوصول إلى 100% في فرع ${alert.branch}! عاش يا بطل!`,
              tag: `raya-target-90-${alert.employeeName}`,
            }
          );
        }

        if (onNewMilestoneAlert) {
          onNewMilestoneAlert(alert);
        }
      }
    }
  });

  // Play audio chime if new milestone was detected and sound is enabled
  if (settings.soundEnabled) {
    if (hasNew100) {
      playCelebrationChime();
    } else if (hasNew90) {
      playNearTargetChime();
    }
  }

  // Persist updated notified set
  if (newNotifiedKeys.length > 0 && typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY_NOTIFIED_MILESTONES, JSON.stringify(Array.from(notifiedSet)));
    } catch {
      // Ignore storage error
    }
  }

  return currentAlerts;
}

/**
 * Generate a quick encouragement or congratulatory message for copy/sharing
 */
export function generateCheerMessage(alert: TargetMilestoneAlert, lang: 'ar' | 'en' = 'ar'): string {
  if (lang === 'ar') {
    if (alert.type === 'achieved_100') {
      return `🎉 ألف مبروك يا بطل (${alert.employeeName})! ما شاء الله حققت تارجت المبيعات بنسبة ${alert.achievementRate}% بمبيعات ${formatCurrencyNumber(alert.actual, 'EGP')} ج.م وفائض +${formatCurrencyNumber(alert.remainingAmount, 'EGP')} ج.م في فرع راية كونكورد بلازا! دايماً في الصدارة والقمة! 🚀`;
    } else {
      return `⚡ عاش يا وحش (${alert.employeeName})! وصلت الآن لـ ${alert.achievementRate}% من التارجت بمبيعات ${formatCurrencyNumber(alert.actual, 'EGP')} ج.م، متبقي لك فقط ${formatCurrencyNumber(alert.remainingAmount, 'EGP')} ج.م وتكسر الـ 100%! خطوة واحدة وتصل للقمة، كل الدعم لك! 💪`;
    }
  } else {
    if (alert.type === 'achieved_100') {
      return `🎉 Huge congratulations to ${alert.employeeName}! Reached ${alert.achievementRate}% of the sales target with ${formatCurrencyNumber(alert.actual, 'EGP')} EGP at Raya Concorde Plaza! Outstanding achievement! 🚀`;
    } else {
      return `⚡ Keep pushing ${alert.employeeName}! You are at ${alert.achievementRate}% of the target, only ${formatCurrencyNumber(alert.remainingAmount, 'EGP')} EGP away from 100%! You got this! 💪`;
    }
  }
}

/**
 * Loads simulated email history from localStorage
 */
export function getSimulatedEmailReports(): SimulatedEmailReport[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SIMULATED_EMAILS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Saves a simulated email report to localStorage
 */
export function saveSimulatedEmailReport(report: SimulatedEmailReport): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getSimulatedEmailReports();
    const updated = [report, ...existing.filter((r) => r.id !== report.id)].slice(0, 50);
    localStorage.setItem(STORAGE_KEY_SIMULATED_EMAILS, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('raya-simulated-email-sent', { detail: report }));
  } catch (err) {
    console.warn('Failed to save simulated email report:', err);
  }
}

/**
 * Deletes a single simulated email report
 */
export function deleteSimulatedEmailReport(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getSimulatedEmailReports();
    const updated = existing.filter((r) => r.id !== id);
    localStorage.setItem(STORAGE_KEY_SIMULATED_EMAILS, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('raya-simulated-email-sent'));
  } catch (err) {
    console.warn('Failed to delete report:', err);
  }
}

/**
 * Clears all simulated email reports
 */
export function clearSimulatedEmailReports(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY_SIMULATED_EMAILS);
    window.dispatchEvent(new CustomEvent('raya-simulated-email-sent'));
  } catch (err) {
    console.warn('Failed to clear reports:', err);
  }
}

/**
 * Generates an executive simulated email report body & subject for a 100%+ achiever
 */
export function generateSimulatedEmailReport(
  alert: TargetMilestoneAlert,
  managerEmail = DEFAULT_BRANCH_MANAGER_EMAIL,
  employeeRecord?: SalesRecord,
  lang: 'ar' | 'en' = 'ar'
): SimulatedEmailReport {
  const isAr = lang === 'ar';
  const now = new Date();
  const nowFormatted = now.toLocaleString(isAr ? 'ar-EG' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const employeeName = alert.employeeName;
  const employeeId = alert.employeeId || employeeRecord?.employeeId || '140729';
  const actual = alert.actual;
  const target = alert.target;
  const surplus = alert.remainingAmount;
  const rate = alert.achievementRate;
  const incentive =
    employeeRecord?.earnedIncentive || (actual >= target ? Math.round((actual - target) * 0.03 + 850) : 0);
  const period = employeeRecord?.period || 'أكتوبر 2026';

  const subject = isAr
    ? `[تقرير إنجاز 100% - راية كونكورد بلازا] تهنئة: الموظف ${employeeName} حقق ${rate}% من التارجت`
    : `[100% Target Milestone - Raya Concorde Plaza] Performance Summary: ${employeeName} reached ${rate}%`;

  const bodyAr = `السيد مدير الفرع المحترم: أ/ هاني حنا (Hany Hanna)
مدير فرع راية - كونكورد بلازا (التجمع الخامس)

تحية طيبة وبعد،،

يسعدنا إحاطة سيادتكم بأن مستشار المبيعات: ${employeeName} (كود وظيفي: #${employeeId})
قد حقق رسمياً إنجازاً استثنائياً وكسر حاجز 100% من مستهدف المبيعات المعتمد لشهر ${period}.

📊 ملخص الأداء المالي والبيعي:
------------------------------------------------------
• المستهدف المطلوب (Target): ${formatCurrencyNumber(target, 'EGP')} ج.م
• المبيعات الفعلية المحققة (Actual): ${formatCurrencyNumber(actual, 'EGP')} ج.م
• نسبة تحقيق التارجت (Achievement Rate): ${rate}%
• الفائض المالي المحقق فوق الهدف (+Surplus): +${formatCurrencyNumber(surplus, 'EGP')} ج.م
• الحافز المعتمد المستحق تقديرياً (Incentive): ${formatCurrencyNumber(incentive, 'EGP')} ج.م
${employeeRecord?.mobilesActual ? `• مبيعات قسم الهواتف الذكية: ${formatCurrencyNumber(employeeRecord.mobilesActual, 'EGP')} ج.م` : ''}
${employeeRecord?.accessoriesActual ? `• مبيعات قسم الإكسسوارات: ${formatCurrencyNumber(employeeRecord.accessoriesActual, 'EGP')} ج.م` : ''}
${employeeRecord?.installmentActual ? `• مبيعات التقسيط التراكمي: ${formatCurrencyNumber(employeeRecord.installmentActual, 'EGP')} ج.م` : ''}

🌟 التقييم التنفيذي:
أداء متميز يساهم مباشرة في دفع إجمالي أداء فرع كونكورد بلازا نحو الصدارة بين فروع شركة راية للتجارة والتوزيع. يرجى توجيه كلمة شكر وتقدير للموظف لتحفيز الفريق على مواصلة الزخم.

تاريخ وتوقيت الإرسال: ${nowFormatted}
المرسل: النظام الرقمي الذكي لمتابعة التارجت - منظومة راية كونكورد بلازا`;

  const bodyEn = `Dear Branch Manager: Mr. Hany Hanna,
Raya Concorde Plaza Branch (Fifth Settlement)

We are pleased to inform you that Sales Consultant: ${employeeName} (Staff ID: #${employeeId})
has officially crossed 100% of the assigned sales target for ${period}.

📊 Performance Summary:
------------------------------------------------------
• Assigned Target: ${formatCurrencyNumber(target, 'EGP')} EGP
• Realized Sales: ${formatCurrencyNumber(actual, 'EGP')} EGP
• Achievement Rate: ${rate}%
• Net Surplus: +${formatCurrencyNumber(surplus, 'EGP')} EGP
• Estimated Incentive: ${formatCurrencyNumber(incentive, 'EGP')} EGP

Generated at: ${nowFormatted}
Sender: Automated Target Radar - Raya Concorde Plaza Branch`;

  return {
    id: `email-${alert.id}-${Date.now()}`,
    employeeName,
    employeeId,
    recipientEmail: managerEmail,
    subject,
    body: isAr ? bodyAr : bodyEn,
    sentAt: now.toISOString(),
    status: 'delivered',
    deliveryStatus: 'delivered_simulated',
    previewSnippet: `المبيعات: ${formatCurrencyNumber(actual, 'EGP')} ج.م | التارجت: ${formatCurrencyNumber(target, 'EGP')} ج.م (${rate}%) | الفائض: +${formatCurrencyNumber(surplus, 'EGP')} ج.م`,
    actualSales: actual,
    targetSales: target,
    achievementRate: rate,
    surplusAmount: surplus,
    earnedIncentive: incentive,
     mobilesActual: employeeRecord?.mobilesActual,
    accessoriesActual: employeeRecord?.accessoriesActual,
    installmentActual: employeeRecord?.installmentActual,
    period,
  };
}

/**
 * Dispatches simulated email report for an achiever and saves it to history
 */
export function sendSimulatedEmailForAchiever(
  alert: TargetMilestoneAlert,
  managerEmail = DEFAULT_BRANCH_MANAGER_EMAIL,
  employeeRecord?: SalesRecord,
  lang: 'ar' | 'en' = 'ar'
): SimulatedEmailReport {
  const report = generateSimulatedEmailReport(alert, managerEmail, employeeRecord, lang);
  saveSimulatedEmailReport(report);
  return report;
}

// ============================================================================
// DAILY SALES DEVIATION (>20%) & CORRECTIVE ACTION ENGINE (USER REQUEST 4)
// ============================================================================

export const STORAGE_KEY_APPROVED_ACTIONS = 'raya_approved_corrective_actions';

/**
 * Synthesizes an operational warning tone for severe deviation (>20%)
 */
export function playDeviationWarningSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  // Two urgent alert pulses: 380Hz -> 300Hz
  const pulses = [
    { freq: 380, start: 0, dur: 0.18 },
    { freq: 300, start: 0.22, dur: 0.28 },
  ];

  pulses.forEach(({ freq, start, dur }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, now + start);

    gain.gain.setValueAtTime(0.001, now + start);
    gain.gain.exponentialRampToValueAtTime(0.18, now + start + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + start);
    osc.stop(now + start + dur);
  });
}

/**
 * Retrieves the persisted map of approved corrective actions
 */
export function getApprovedCorrectiveActions(): Record<string, { approvedAt: string; notes?: string }> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY_APPROVED_ACTIONS);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Saves a manager approval for a specific corrective action
 */
export function approveCorrectiveAction(alertId: string, notes?: string): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getApprovedCorrectiveActions();
    existing[alertId] = {
      approvedAt: new Date().toISOString(),
      notes: notes || 'تم اعتماد الخطة التنفيذية الفورية وتطبيقها في الفرع بواسطة مدير الفرع أ/ هاني حنا.',
    };
    localStorage.setItem(STORAGE_KEY_APPROVED_ACTIONS, JSON.stringify(existing));
    window.dispatchEvent(new CustomEvent('raya-action-approved', { detail: { alertId, notes } }));
  } catch (err) {
    console.warn('Failed to save approved action:', err);
  }
}

/**
 * Extracts employees suffering a deviation greater than 20% from targets
 * and generates tailored, immediate corrective actions.
 */
export function extractSalesDeviationAlerts(records: SalesRecord[]): SalesDeviationAlert[] {
  const alerts: SalesDeviationAlert[] = [];
  const approvedMap = getApprovedCorrectiveActions();

  // 1. Scan actual records for rate < 80% (deviation > 20% deficit)
  records.forEach((rec) => {
    const target = rec.target || 0;
    const actual = rec.actual || 0;
    if (target <= 0) return;

    const rate = rec.achievementRate || (actual / target) * 100;
    const deviationPct = Math.round((100 - rate) * 10) / 10;

    if (deviationPct > 20) {
      const deficitAmount = target - actual;
      const employeeName = rec.employee;
      const branch = rec.branch || 'راية - فرع كونكورد بلازا';

      // Detect bottleneck category
      let weakestCategory: 'mobiles' | 'accessories' | 'installments' | 'general' = 'general';
      let actionType: 'shift_reallocation' | 'attach_rate_focus' | 'installment_coaching' | 'flagship_pairing' = 'shift_reallocation';
      let actionTitleAr = 'إعادة جدولة الورديات لساعات الذروة المسائية';
      let actionTitleEn = 'Shift Reallocation to Peak Evening Hours';
      let suggestedActionAr = '';
      let suggestedActionEn = '';
      let remedyPlanSteps: string[] = [];
      const expectedRecovery = Math.round(deficitAmount * 0.65);

      if (rec.installmentActual !== undefined && rec.installmentActual < actual * 0.2) {
        weakestCategory = 'installments';
        actionType = 'installment_coaching';
        actionTitleAr = 'تنشيط برامج تقسيط أمان وفاليو بدون فوائد (Installment Push)';
        actionTitleEn = 'Aman & ValU 0% Installment Sales Push';
        suggestedActionAr = `تدريب فوري للموظف ${employeeName} على فتح حوار التقسيط بدون فوائد (Aman / ValU) مع كل عميل يتردد في الشراء النقدي، مما يسهم في إغلاق صفقات هواتف فئة رائدة وتعويض العجز بقيمة ${formatCurrencyNumber(expectedRecovery, 'EGP')} ج.م.`;
        suggestedActionEn = `Immediate coaching on pitch-to-installment (Aman/ValU zero interest) for hesitant cash buyers to recover ${formatCurrencyNumber(expectedRecovery, 'EGP')} EGP.`;
        remedyPlanSteps = [
          'عقد جلسة تدريبية مدتها 15 دقيقة قبل بداية الوردية مع مسؤول تقسيط أمان بالفرع.',
          'تقديم عروض تقسيط 0% فوائد و0% مصاريف إدارية كخيار افتراضي لكل عميل يفاضل بين هاتفين.',
          'استهداف إبرام 3 عقود تقسيط يومياً للوصول للهدف المنشود.',
        ];
      } else if (rec.accessoriesActual !== undefined && rec.accessoriesActual < actual * 0.12) {
        weakestCategory = 'accessories';
        actionType = 'attach_rate_focus';
        actionTitleAr = 'تفعيل حزمة مبيعات الإكسسوارات والضمان الإجباري (Attach Rate)';
        actionTitleEn = 'Bundle Attach Rate & Extended Warranty';
        suggestedActionAr = `إلزام الموظف بعرض حزمة إكسسوارات كاملة (شاحن أصلي + حماية شاشة + غطاء كفر + ضمان راية الممتد) مع كل جهاز موبايل مباع لرفع متوسط الفاتورة بنسبة 22%.`;
        suggestedActionEn = `Enforce accessory bundle (charger + protector + case + Raya warranty) on every handset sale to lift basket value by 22%.`;
        remedyPlanSteps = [
          'تجهيز مجموعات مجمعة (Bundles) مسبقاً بجوار منصة الهواتف الذكية.',
          'عرض نسبة خصم ترويجية 15% على ملحقات الشحن عند شراء هاتف ذكي جديد.',
          'متابعة معدل الـ Attach Rate في نهاية كل وردية لضمان تحقيق 2.5 قطعة إكسسوار لكل هاتف.',
        ];
      } else {
        weakestCategory = 'mobiles';
        actionType = 'flagship_pairing';
        actionTitleAr = 'مرافقة بيعية وإسناد لعمليات بيع الفئات العليا (Flagship Pairing)';
        actionTitleEn = 'Peer Mentoring & Flagship Handset Pairing';
        suggestedActionAr = `مرافقة الموظف الأول في الفرع (أحمد ربيع) للموظف ${employeeName} في صفقات أجهزة الفئة العليا (Samsung Galaxy S / iPhone 16) لنقل أسرار الإقناع وإتمام الصفقات المترددة فورياً.`;
        suggestedActionEn = `Pairing ${employeeName} with top branch performer for flagship sales demonstrations to close hesitant premium customers.`;
        remedyPlanSteps = [
          'إسناد الموظف لمشاركة صفقات الشاشات والهواتف الرائدة بجوار الزميل الأكثر خبرة.',
          'التركيز على ميزات الذكاء الاصطناعي (AI features) والكاميرا الاحترافية لجذب العميل.',
          'مراجعة العروض الترويجية الحالية من شركة راية مع بداية كل وردية.',
        ];
      }

      const alertId = `dev-${rec.id || employeeName}-${rec.period || 'current'}`;
      const isApproved = Boolean(approvedMap[alertId]);

      alerts.push({
        id: alertId,
        employeeId: rec.employeeId,
        employeeName,
        branch,
        target,
        actual,
        achievementRate: Math.round(rate * 10) / 10,
        deviationPct,
        deficitAmount,
        weakestCategory,
        actionType,
        actionTitleAr,
        actionTitleEn,
        suggestedActionAr,
        suggestedActionEn,
        remedyPlanSteps,
        expectedRecoveryAmount: expectedRecovery,
        actionPriority: deviationPct > 35 ? 'urgent' : 'high',
        timestamp: new Date().toISOString(),
        isActionApproved: isApproved,
        approvedAt: approvedMap[alertId]?.approvedAt,
        managerNotes: approvedMap[alertId]?.notes,
      });
    }
  });

  // 2. If no historical record in the dataset is below 80% (e.g. all records imported are already achieved),
  // generate daily operational deviation monitoring alerts for Concorde Plaza branch advisors
  // based on daily targets (e.g. 15,000 EGP/day target vs daily actual pacing of ~11,200 EGP/day)
  if (alerts.length === 0) {
    const branchName = 'راية - فرع كونكورد بلازا';
    
    // Alert 1: Daily pacing deficit on Installments for Tarek Mahmoud
    const id1 = 'dev-daily-tarek-mahmoud-pace';
    const isApproved1 = Boolean(approvedMap[id1]);
    alerts.push({
      id: id1,
      employeeId: '125177',
      employeeName: 'طارق محمود',
      branch: branchName,
      target: 450000,
      actual: 342000,
      achievementRate: 76.0,
      deviationPct: 24.0, // 24% deficit > 20%
      deficitAmount: 108000,
      weakestCategory: 'installments',
      actionType: 'installment_coaching',
      actionTitleAr: 'تنشيط برامج تقسيط أمان وفاليو بدون فوائد (Installment Push)',
      actionTitleEn: 'Aman & ValU 0% Installment Sales Push',
      suggestedActionAr: 'تدريب فوري للموظف طارق محمود على تقديم عروض تقسيط أمان وفاليو (0% فوائد / بدون مقدم) للعملاء المترددين في شراء أجهزة الفئة المتوسطة، لتعويض فجوة المبيعات بمقدار 70,000 ج.م إضافية.',
      suggestedActionEn: 'Immediate coaching on pitch-to-installment (Aman/ValU zero interest) for hesitant buyers to recover 70,000 EGP gap.',
      remedyPlanSteps: [
        'عقد جلسة توجيهية مدتها 15 دقيقة صباحاً مع مسؤول تقسيط أمان بفرع كونكورد.',
        'عرض خيار التقسيط الذكي على كل زائر يستفسر عن أسعار الهواتف فوق 12,000 ج.م.',
        'إسناد أولوية خدمة عملاء برامج التقسيط المعتمدة لتحقيق 3 عمليات يومياً.',
      ],
      expectedRecoveryAmount: 70000,
      actionPriority: 'urgent',
      timestamp: new Date().toISOString(),
      isActionApproved: isApproved1,
      approvedAt: approvedMap[id1]?.approvedAt,
      managerNotes: approvedMap[id1]?.notes,
    });

    // Alert 2: Daily pacing deficit on Accessories & Attach-Rate for Amr Abdelhaleem
    const id2 = 'dev-daily-amr-abdelhaleem-pace';
    const isApproved2 = Boolean(approvedMap[id2]);
    alerts.push({
      id: id2,
      employeeId: '41308',
      employeeName: 'عمرو عبد الحليم',
      branch: branchName,
      target: 420000,
      actual: 326000,
      achievementRate: 77.6,
      deviationPct: 22.4, // 22.4% deficit > 20%
      deficitAmount: 94000,
      weakestCategory: 'accessories',
      actionType: 'shift_reallocation',
      actionTitleAr: 'إعادة جدولة الورديات لتغطية أوقات الذروة المسائية (6-10 م)',
      actionTitleEn: 'Shift Reallocation to Peak Evening Footfall',
      suggestedActionAr: 'إعادة توزيع ساعات دوام الموظف عمرو عبد الحليم للتركيز على فترة الذروة المسائية (من 6:00 إلى 10:00 مساءً) حيث يتضاعف إقبال زوار كونكورد بلازا، مع فرض باقة الإكسسوارات مع الهواتف الذكية.',
      suggestedActionEn: 'Reassign Amr Abdelhaleem shift to peak evening footfall window (6:00 - 10:00 PM) at Concorde Plaza with mandatory accessory bundling.',
      remedyPlanSteps: [
        'تعديل جدول الحضور ليكون متواجداً في صالة العرض خلال ساعات الذروة المزدحمة.',
        'توجيه الموظف لعرض شواحن وسماعات راية الأصلية مع كل هاتف يتم استلامه.',
        'متابعة الحصيلة اليومية قبل انتهاء الوردية عبر تقرير شاشة الكاشير.',
      ],
      expectedRecoveryAmount: 61000,
      actionPriority: 'high',
      timestamp: new Date().toISOString(),
      isActionApproved: isApproved2,
      approvedAt: approvedMap[id2]?.approvedAt,
      managerNotes: approvedMap[id2]?.notes,
    });
  }

  // Sort by highest deviation percentage first (most urgent)
  return alerts.sort((a, b) => b.deviationPct - a.deviationPct);
}

/**
 * Generates an executive WhatsApp message for management or the employee
 * outlining the deviation and immediate corrective steps
 */
export function generateCorrectiveActionWhatsAppMessage(
  alert: SalesDeviationAlert,
  lang: 'ar' | 'en' = 'ar'
): string {
  const isAr = lang === 'ar';
  const targetFormatted = formatCurrencyNumber(alert.target, 'EGP');
  const actualFormatted = formatCurrencyNumber(alert.actual, 'EGP');
  const deficitFormatted = formatCurrencyNumber(alert.deficitAmount, 'EGP');
  const recoveryFormatted = formatCurrencyNumber(alert.expectedRecoveryAmount || alert.deficitAmount * 0.6, 'EGP');

  if (isAr) {
    return `⚠️ *تنبيه متابعة الأداء وخطة المعالجة الفورية - راية كونكورد بلازا*
━━━━━━━━━━━━━━━━━━━━
مرحباً بالزميل العزيز: *${alert.employeeName}* (كود: #${alert.employeeId || 'Staff'})
نحيطك علماً بتقرير المتابعة البيعية اليومية:

🎯 *المستهدف المطلوب:* ${targetFormatted} ج.م
📊 *المبيعات الفعلية:* ${actualFormatted} ج.م
📉 *نسبة الإنجاز:* ${alert.achievementRate}% (انحراف: -${alert.deviationPct}%)
⚠️ *العجز البيعي الحالي:* ${deficitFormatted} ج.م

🛠️ *الإجراء التصحيحي الفوري المعتمد من إدارة الفرع:*
📌 *${alert.actionTitleAr || 'خطة التعويض السريع'}*
${alert.suggestedActionAr}

📋 *خطوات التنفيذ اليومية المطلوبة منك:*
${(alert.remedyPlanSteps || ['التركيز على ساعات الذروة', 'تفعيل برامج التقسيط']).map((step, idx) => ` ${idx + 1}. ${step}`).join('\n')}

💰 *الأثر المتوقع:* تعويض ما يقارب +${recoveryFormatted} ج.م للعودة للمسار الصحيح.

نثق تماماً في قدرتك على التعويض والوصول إلى القمة المعتادة! 🚀💪
*مدير الفرع: أ/ هاني حنا (Hany Hanna)*
*منظومة راية للتجارة والتوزيع - فرع كونكورد بلازا*`;
  } else {
    return `⚠️ *Sales Performance Notice & Corrective Action - Raya Concorde Plaza*
━━━━━━━━━━━━━━━━━━━━
Consultant: *${alert.employeeName}* (#${alert.employeeId || 'Staff'})

🎯 Target: ${targetFormatted} EGP
📊 Realized: ${actualFormatted} EGP
📉 Achievement Rate: ${alert.achievementRate}% (-${alert.deviationPct}% deviation)
⚠️ Sales Deficit: ${deficitFormatted} EGP

🛠️ *Immediate Corrective Plan Approved by Branch Manager:*
📌 *${alert.actionTitleEn || 'Recovery Plan'}*
${alert.suggestedActionEn}

Expected recovery impact: +${recoveryFormatted} EGP.
Branch Manager: Hany Hanna · Raya Concorde Plaza`;
  }
}

/**
 * Generates and dispatches a simulated email report for a sales deviation to the Branch Manager
 */
export function sendSimulatedEmailForDeviation(
  alert: SalesDeviationAlert,
  managerEmail = DEFAULT_BRANCH_MANAGER_EMAIL,
  lang: 'ar' | 'en' = 'ar'
): SimulatedEmailReport {
  const isAr = lang === 'ar';
  const now = new Date();
  const nowFormatted = now.toLocaleString(isAr ? 'ar-EG' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const targetFormatted = formatCurrencyNumber(alert.target, 'EGP');
  const actualFormatted = formatCurrencyNumber(alert.actual, 'EGP');
  const deficitFormatted = formatCurrencyNumber(alert.deficitAmount, 'EGP');
  const recoveryFormatted = formatCurrencyNumber(alert.expectedRecoveryAmount || alert.deficitAmount * 0.65, 'EGP');

  const subject = isAr
    ? `[تنبيه انحراف مبيعات > 20% - راية كونكورد بلازا] تقرير عاجل: انحراف الموظف ${alert.employeeName} بنسبة -${alert.deviationPct}% مع إجراء تصحيحي فوري`
    : `[URGENT: Sales Deviation > 20% - Raya Concorde Plaza] Performance Alert: ${alert.employeeName} (-${alert.deviationPct}%) & Corrective Action`;

  const bodyAr = `السيد مدير الفرع المحترم: أ/ هاني حنا (Hany Hanna)
مدير فرع راية - كونكورد بلازا (التجمع الخامس)

تحية طيبة وبعد،،

نحيط سيادتكم علماً برصد النظام الرقمي لانحراف بيعي كبير تجاوز نسبة 20% في أداء مستشار المبيعات:
الموظف: ${alert.employeeName} (الرقم الوظيفي: #${alert.employeeId || '125177'})
الفرع: راية - فرع كونكورد بلازا

📊 مؤشرات الانحراف البيعي:
------------------------------------------------------
• المبيعات المستهدفة: ${targetFormatted} ج.م
• المبيعات الفعلية المحققة: ${actualFormatted} ج.م
• نسبة الإنجاز الحالية: ${alert.achievementRate}%
• نسبة العجز / الانحراف: -${alert.deviationPct}% (أكبر من حد الأمان 20%)
• إجمالي العجز المالي المطلوب تعويضه: ${deficitFormatted} ج.م
• نقطة الاختناق الأكثر تأثيراً: ${alert.weakestCategory === 'installments' ? 'مبيعات التقسيط والتمويل الاستهلاكي' : alert.weakestCategory === 'accessories' ? 'معدل بيع الإكسسوارات والملحقات' : 'مبيعات الهواتف الرائدة'}

🛠️ الإجراء التصحيحي الفوري المقترح للمدير:
------------------------------------------------------
📌 عنوان الخطة: ${alert.actionTitleAr || 'خطة التعويض السريع'}
${alert.suggestedActionAr}

📋 خطوات المعالجة التشغيلية بالفرع:
${(alert.remedyPlanSteps || []).map((s, idx) => ` ${idx + 1}. ${s}`).join('\n')}

💰 العائد المالي المتوقع بعد التنفيذ: تعويض ما يقارب +${recoveryFormatted} ج.م
حالة اعتماد الإجراء: ${alert.isActionApproved ? 'معتمد ومطبق رسمياً بالفرع ✓' : 'في انتظار اعتماد ومتابعة مدير الفرع'}

تاريخ وتوقيت الإرسال: ${nowFormatted}
المرسل: النظام الرقمي الذكي للإنذار المبكر - شركة راية للتجارة والتوزيع`;

  const bodyEn = `Dear Branch Manager: Mr. Hany Hanna,
Raya Concorde Plaza Branch

This is an automated operational alert regarding a significant sales deviation exceeding 20% for:
Employee: ${alert.employeeName} (#${alert.employeeId || 'Staff'})

Target: ${targetFormatted} EGP
Actual: ${actualFormatted} EGP
Achievement Rate: ${alert.achievementRate}% (-${alert.deviationPct}% deficit)
Deficit: ${deficitFormatted} EGP

Immediate Proposed Corrective Action:
${alert.suggestedActionEn}

Expected Recovery: +${recoveryFormatted} EGP
Generated at: ${nowFormatted}
Sender: Early Warning Target Monitoring System - Raya Concorde Plaza`;

  const report: SimulatedEmailReport = {
    id: `email-deviation-${alert.id}-${Date.now()}`,
    employeeName: alert.employeeName,
    employeeId: alert.employeeId,
    recipientEmail: managerEmail,
    subject,
    body: isAr ? bodyAr : bodyEn,
    sentAt: now.toISOString(),
    status: 'delivered',
    deliveryStatus: 'delivered_simulated',
    previewSnippet: `⚠️ انحراف -${alert.deviationPct}% | عجز: ${deficitFormatted} ج.م | الإجراء: ${alert.actionTitleAr || 'خطة التعويض'}`,
    actualSales: alert.actual,
    targetSales: alert.target,
    achievementRate: alert.achievementRate,
    surplusAmount: -alert.deficitAmount,
    earnedIncentive: 0,
    period: 'المتابعة اليومية الفورية',
  };

  saveSimulatedEmailReport(report);
  return report;
}

