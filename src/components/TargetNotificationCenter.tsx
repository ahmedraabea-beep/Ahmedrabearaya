import React, { useState, useEffect } from 'react';
import {
  Bell,
  X,
  Trophy,
  Zap,
  Volume2,
  VolumeX,
  Check,
  Copy,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Send,
  Building2,
  RefreshCw,
  Flame,
  Mail,
  MailCheck,
  CheckCheck,
  Eye,
  Trash2,
  Settings,
  AtSign,
  FileText,
  Printer,
  TrendingDown,
  Wrench,
  UserCheck,
  MessageSquare,
  Share2,
  BadgeAlert,
  CheckCircle2,
  ArrowDownRight,
  SlidersHorizontal,
  FileSpreadsheet,
} from 'lucide-react';
import {
  SalesRecord,
  Currency,
  Language,
  TargetMilestoneAlert,
  SalesDeviationAlert,
  NotificationSettings,
  SimulatedEmailReport,
} from '../types/sales';
import { formatCurrencyNumber } from '../utils/calculations';
import {
  extractTargetMilestoneAlerts,
  extractSalesDeviationAlerts,
  playDeviationWarningSound,
  getApprovedCorrectiveActions,
  approveCorrectiveAction,
  generateCorrectiveActionWhatsAppMessage,
  sendSimulatedEmailForDeviation,
  isPushNotificationSupported,
  getNotificationPermission,
  requestPushPermission,
  sendBrowserPushNotification,
  playCelebrationChime,
  playNearTargetChime,
  generateCheerMessage,
  saveNotificationSettings,
  getSimulatedEmailReports,
  saveSimulatedEmailReport,
  deleteSimulatedEmailReport,
  clearSimulatedEmailReports,
  generateSimulatedEmailReport,
  sendSimulatedEmailForAchiever,
  DEFAULT_BRANCH_MANAGER_EMAIL,
} from '../utils/notificationService';
import { triggerCelebrationConfetti } from '../utils/confetti';

interface TargetNotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  records: SalesRecord[];
  currency: Currency;
  language: Language;
  settings: NotificationSettings;
  onUpdateSettings: (s: NotificationSettings) => void;
  onSelectEmployee: (name: string) => void;
  branchOverallRate?: number;
  branchTotalActual?: number;
  branchTotalTarget?: number;
}

export const TargetNotificationCenter: React.FC<TargetNotificationCenterProps> = ({
  isOpen,
  onClose,
  records,
  currency,
  language,
  settings: propSettings,
  onUpdateSettings,
  onSelectEmployee,
  branchOverallRate = 0,
  branchTotalActual = 0,
  branchTotalTarget = 0,
}) => {
  const isAr = language === 'ar';
  const settings: NotificationSettings = propSettings || {
    pushEnabled: false,
    soundEnabled: true,
    notifyOnNear90: true,
    notifyOn100: true,
    notifyOnDeviation20: true,
    autoEmailOn100: false,
    managerEmail: DEFAULT_BRANCH_MANAGER_EMAIL,
  };

  const [filterTab, setFilterTab] = useState<'all' | 'deviations' | '100' | '90' | 'branch' | 'emails'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<NotificationPermission | 'unsupported'>('default');
  const [testNotificationSent, setTestNotificationSent] = useState(false);
  const [testDeviationSent, setTestDeviationSent] = useState(false);

  // Simulated Email Reports State for Branch Manager
  const [simulatedReports, setSimulatedReports] = useState<SimulatedEmailReport[]>(() => getSimulatedEmailReports());
  const [selectedEmailPreview, setSelectedEmailPreview] = useState<SimulatedEmailReport | null>(null);
  const [managerEmailInput, setManagerEmailInput] = useState<string>(
    settings?.managerEmail || DEFAULT_BRANCH_MANAGER_EMAIL
  );
  const [isEditingManagerEmail, setIsEditingManagerEmail] = useState(false);
  const [sendingEmailForAlertId, setSendingEmailForAlertId] = useState<string | null>(null);
  const [emailSentSuccessId, setEmailSentSuccessId] = useState<string | null>(null);
  const [toastBanner, setToastBanner] = useState<string | null>(null);
  const [copiedEmailText, setCopiedEmailText] = useState(false);

  // Sales Deviation (>20%) State & Handlers (User Request 4)
  const [approvedActionsVersion, setApprovedActionsVersion] = useState(0);
  const [actionApprovalNotes, setActionApprovalNotes] = useState<Record<string, string>>({});
  const [sendingDeviationEmailId, setSendingDeviationEmailId] = useState<string | null>(null);
  const [copiedDeviationWaId, setCopiedDeviationWaId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPermissionState(getNotificationPermission());
      setSimulatedReports(getSimulatedEmailReports());
      if (settings?.managerEmail) {
        setManagerEmailInput(settings.managerEmail);
      }
    }
  }, [isOpen, settings?.managerEmail]);

  // Listen to cross-system simulated email and approved action events
  useEffect(() => {
    const handleEmailEvent = () => {
      setSimulatedReports(getSimulatedEmailReports());
    };
    const handleActionApproved = () => {
      setApprovedActionsVersion((v) => v + 1);
    };
    window.addEventListener('raya-simulated-email-sent', handleEmailEvent);
    window.addEventListener('raya-action-approved', handleActionApproved);
    return () => {
      window.removeEventListener('raya-simulated-email-sent', handleEmailEvent);
      window.removeEventListener('raya-action-approved', handleActionApproved);
    };
  }, []);

  const deviationAlerts = React.useMemo(
    () => extractSalesDeviationAlerts(records),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [records, approvedActionsVersion]
  );

  // Daily alert to Manager if deviation > 20% exists and setting is active
  useEffect(() => {
    if (isOpen && settings.notifyOnDeviation20 !== false && deviationAlerts.length > 0) {
      if (permissionState === 'granted' && settings.pushEnabled) {
        const topDev = deviationAlerts[0];
        sendBrowserPushNotification(
          isAr
            ? `⚠️ تنبيه انحراف بيعي حاد (>20%): ${topDev.employeeName}`
            : `⚠️ Sales Deviation Alert (>20%): ${topDev.employeeName}`,
          {
            body: isAr
              ? `عجز بنسبة ${topDev.deviationPct}% بمبلغ ${formatCurrencyNumber(topDev.deficitAmount, currency)}. الإجراء: ${topDev.actionTitleAr || 'خطة التعويض'}.`
              : `Deficit ${topDev.deviationPct}% (${formatCurrencyNumber(topDev.deficitAmount, currency)}). Click to review remedy plan.`,
            tag: `raya-deviation-daily-${topDev.employeeName}`,
          }
        );
      }
    }
  }, [isOpen, settings.notifyOnDeviation20, settings.pushEnabled, permissionState, deviationAlerts, currency, isAr]);

  if (!isOpen) return null;

  const alerts = extractTargetMilestoneAlerts(records);
  const achievers100 = alerts.filter((a) => a.type === 'achieved_100');
  const near90 = alerts.filter((a) => a.type === 'near_90');

  const filteredAlerts = alerts.filter((alert) => {
    if (filterTab === '100') return alert.type === 'achieved_100';
    if (filterTab === '90') return alert.type === 'near_90';
    return true;
  });

  const handleRequestPush = async () => {
    const res = await requestPushPermission();
    setPermissionState(res);
    if (res === 'granted') {
      onUpdateSettings({ ...settings, pushEnabled: true });
      saveNotificationSettings({ ...settings, pushEnabled: true });
      sendBrowserPushNotification(
        isAr ? '🔔 تم تفعيل إشعارات راية اللحظية بنجاح!' : '🔔 Raya Push Notifications Activated!',
        {
          body: isAr
            ? 'ستتلقى تنبيهات فورية على شاشتك عند وصول أي موظف إلى 90% أو 100% من التارجت.'
            : 'You will receive desktop push alerts when any consultant hits 90% or 100% target.',
          tag: 'raya-welcome-push',
        }
      );
      playCelebrationChime();
    }
  };

  const handleSendTestNotification = () => {
    setTestNotificationSent(true);
    setTimeout(() => setTestNotificationSent(false), 3000);

    if (settings.soundEnabled) {
      playCelebrationChime();
    }
    triggerCelebrationConfetti();

    if (permissionState === 'granted' && settings.pushEnabled) {
      sendBrowserPushNotification(
        isAr ? '⚡ اختبار إشعار راية اللحظي (تجربة ناجحة)' : '⚡ Raya Real-time Test Push Notification',
        {
          body: isAr
            ? 'نظام التنبيهات يعمل بنجاح! سيتم إخطارك فوراً عند اقتراب أو تحقيق التارجت.'
            : 'Push alerts are working perfectly! You will receive live milestone updates.',
          tag: 'raya-test-alert',
        }
      );
    }
  };

  const handleCopyCheer = (alert: TargetMilestoneAlert) => {
    const text = generateCheerMessage(alert, language);
    navigator.clipboard.writeText(text);
    setCopiedId(alert.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleCelebrate = (alert: TargetMilestoneAlert) => {
    triggerCelebrationConfetti();
    if (settings.soundEnabled) {
      if (alert.type === 'achieved_100') {
        playCelebrationChime();
      } else {
        playNearTargetChime();
      }
    }
  };

  // Toggle Auto-Email simulation for branch manager on 100% target
  const handleToggleAutoEmail = () => {
    const nextVal = !settings.autoEmailOn100;
    const targetEmail = managerEmailInput.trim() || DEFAULT_BRANCH_MANAGER_EMAIL;
    const newSettings: NotificationSettings = {
      ...settings,
      autoEmailOn100: nextVal,
      managerEmail: targetEmail,
    };
    onUpdateSettings(newSettings);
    saveNotificationSettings(newSettings);
    setToastBanner(
      nextVal
        ? (isAr ? 'تم تفعيل إرسال تقرير موجز تلقائياً عبر البريد (محاكاة) بمجرد تحقيق 100% من التارجت ⚡' : 'Auto email simulation on 100% target activated ⚡')
        : (isAr ? 'تم تعطيل الإرسال التلقائي (يمكنك إرسال التقارير يدوياً بنقرة زر في أي وقت).' : 'Auto email simulation turned off.')
    );
    setTimeout(() => setToastBanner(null), 4500);
  };

  const handleSaveManagerEmail = () => {
    const targetEmail = managerEmailInput.trim() || DEFAULT_BRANCH_MANAGER_EMAIL;
    const newSettings: NotificationSettings = {
      ...settings,
      managerEmail: targetEmail,
    };
    onUpdateSettings(newSettings);
    saveNotificationSettings(newSettings);
    setIsEditingManagerEmail(false);
    setToastBanner(
      isAr ? `تم تحديث بريد مدير الفرع: ${targetEmail}` : `Branch manager email updated: ${targetEmail}`
    );
    setTimeout(() => setToastBanner(null), 3500);
  };

  // Manually send simulated email for a specific 100% achiever
  const handleSendSimulatedEmail = (alert: TargetMilestoneAlert) => {
    setSendingEmailForAlertId(alert.id);
    const matchingRecord = records.find(
      (r) => r.employee === alert.employeeName || (r.employeeId && r.employeeId === alert.employeeId)
    );
    const targetEmail = settings.managerEmail || managerEmailInput || DEFAULT_BRANCH_MANAGER_EMAIL;

    setTimeout(() => {
      const report = sendSimulatedEmailForAchiever(
        alert,
        targetEmail,
        matchingRecord,
        language
      );
      setSendingEmailForAlertId(null);
      setEmailSentSuccessId(alert.id);
      setSimulatedReports(getSimulatedEmailReports());

      if (settings.soundEnabled) {
        playCelebrationChime();
      }

      setToastBanner(
        isAr
          ? `📧 تم إرسال تقرير أداء ${alert.employeeName} إلى بريد مدير الفرع (${targetEmail}) بمحاكاة مكتملة!`
          : `📧 Simulated report for ${alert.employeeName} dispatched to ${targetEmail}!`
      );
      setTimeout(() => {
        setEmailSentSuccessId(null);
        setToastBanner(null);
      }, 5000);
    }, 600);
  };

  const handleDeleteReport = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    deleteSimulatedEmailReport(id);
    setSimulatedReports(getSimulatedEmailReports());
    if (selectedEmailPreview?.id === id) {
      setSelectedEmailPreview(null);
    }
  };

  const handleClearAllReports = () => {
    if (
      window.confirm(
        isAr
          ? 'هل ترغب بالتأكيد في مسح سجل كافة تقارير البريد المرسلة للمدير؟'
          : 'Are you sure you want to clear all simulated email reports?'
      )
    ) {
      clearSimulatedEmailReports();
      setSimulatedReports([]);
      setSelectedEmailPreview(null);
    }
  };

  const handleCopyEmailText = (report: SimulatedEmailReport) => {
    const fullText = `الموضوع: ${report.subject}\nإلى: ${report.recipientEmail}\nالتاريخ: ${new Date(report.sentAt).toLocaleString('ar-EG')}\n\n${report.body}`;
    navigator.clipboard.writeText(fullText);
    setCopiedEmailText(true);
    setTimeout(() => setCopiedEmailText(false), 2500);
  };

  // Approve and execute corrective action
  const handleApproveAction = (alert: SalesDeviationAlert) => {
    const customNote =
      actionApprovalNotes[alert.id] ||
      (isAr
        ? 'تم اعتماد الخطة التنفيذية الفورية وتطبيقها في صالة عرض فرع كونكورد بلازا بواسطة مدير الفرع أ/ هاني حنا.'
        : 'Approved & executed in showroom by Hany Hanna (Branch Manager)');
    approveCorrectiveAction(alert.id, customNote);
    setApprovedActionsVersion((v) => v + 1);
    if (settings.soundEnabled) {
      playCelebrationChime();
    }
    setToastBanner(
      isAr
        ? `✓ تم اعتماد الإجراء التصحيحي للموظف ${alert.employeeName} بنجاح وتوثيقه بالفرع!`
        : `✓ Corrective plan for ${alert.employeeName} approved & logged!`
    );
    setTimeout(() => setToastBanner(null), 4000);
  };

  // Share corrective plan via WhatsApp
  const handleShareDeviationWhatsApp = (alert: SalesDeviationAlert) => {
    const text = generateCorrectiveActionWhatsAppMessage(alert, language);
    navigator.clipboard.writeText(text);
    setCopiedDeviationWaId(alert.id);
    setTimeout(() => setCopiedDeviationWaId(null), 3000);

    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    try {
      window.open(url, '_blank');
    } catch {
      // fallback
    }

    setToastBanner(
      isAr
        ? `📲 تم نسخ رسالة خطة المعالجة للموظف ${alert.employeeName} وتجهيز واتساب للمشاركة!`
        : `📲 WhatsApp corrective plan for ${alert.employeeName} copied & prepared!`
    );
    setTimeout(() => setToastBanner(null), 4000);
  };

  // Dispatch simulated deviation email to manager
  const handleSendDeviationSimulatedEmail = (alert: SalesDeviationAlert) => {
    setSendingDeviationEmailId(alert.id);
    const targetEmail = settings.managerEmail || managerEmailInput || DEFAULT_BRANCH_MANAGER_EMAIL;

    setTimeout(() => {
      sendSimulatedEmailForDeviation(alert, targetEmail, language);
      setSendingDeviationEmailId(null);
      setSimulatedReports(getSimulatedEmailReports());

      if (settings.soundEnabled) {
        playDeviationWarningSound();
      }

      setToastBanner(
        isAr
          ? `📧 تم إرسال تنبيه الانحراف البيعي (> 20%) لبريد مدير الفرع (${targetEmail}) بمحاكاة مكتملة!`
          : `📧 Deviation alert report (>20%) dispatched to ${targetEmail}!`
      );
      setTimeout(() => setToastBanner(null), 5000);
    }, 600);
  };

  // Test deviation audio and push notification
  const handleTestDeviationAlert = () => {
    setTestDeviationSent(true);
    setTimeout(() => setTestDeviationSent(false), 3000);

    if (settings.soundEnabled) {
      playDeviationWarningSound();
    }

    if (permissionState === 'granted' && settings.pushEnabled) {
      sendBrowserPushNotification(
        isAr
          ? '⚠️ اختبار: تنبيه انحراف بيعي حاد (> 20%) - راية كونكورد بلازا'
          : '⚠️ Test: Sales Deviation Alert (>20%) - Raya Concorde',
        {
          body: isAr
            ? 'تنبيه عاجل لمدير الفرع: تم رصد انحراف بنسبة -24.0% في مبيعات التقسيط - انقر لمراجعة الإجراء التصحيحي المقترح.'
            : 'Urgent manager alert: -24.0% deficit detected in installment sales. Click to review remedy plan.',
          tag: 'raya-test-deviation',
        }
      );
    }
    setToastBanner(
      isAr ? '⚡ تم تشغيل صوت واختبار إشعار الانحراف البيعي بنجاح!' : '⚡ Deviation alert sound & push tested!'
    );
    setTimeout(() => setToastBanner(null), 3500);
  };

  const handleToggleDeviationSetting = () => {
    const nextVal = settings.notifyOnDeviation20 === false;
    const newSettings = { ...settings, notifyOnDeviation20: nextVal };
    onUpdateSettings(newSettings);
    saveNotificationSettings(newSettings);
    setToastBanner(
      nextVal
        ? (isAr ? 'تم تفعيل التنبيهات اليومية للمدير عند وجود انحراف > 20% ✓' : 'Daily >20% deviation alerts activated ✓')
        : (isAr ? 'تم تعطيل تنبيهات الانحراف اليومي.' : 'Daily deviation alerts turned off.')
    );
    setTimeout(() => setToastBanner(null), 3500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center relative shadow-inner">
              <Bell className="w-5 h-5 animate-bounce" />
              {alerts.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center ring-2 ring-slate-900">
                  {alerts.length}
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight">
                  {isAr ? 'مركز التنبيهات اللحظية ومتابعة التارجت' : 'Real-Time Target Alerts Radar'}
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  {isAr ? 'رادار لحظي نشط' : 'Live Radar'}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {isAr
                  ? 'رصد فوري للموظفين الذين اقتربوا من 90% أو حققوا 100% من التارجت بفرع كونكورد بلازا'
                  : 'Live push & visual alerts for consultants nearing 90% or exceeding 100% of target'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            title={isAr ? 'إغلاق' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Controls Bar: Push Status, Sound, Test */}
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          {/* Push Status / Request */}
          <div className="flex items-center gap-2">
            {permissionState === 'granted' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                {isAr ? 'إشعارات المتصفح (Push) مفعلة' : 'Push Alerts Active'}
              </span>
            ) : permissionState === 'denied' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 font-bold border border-rose-200">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                {isAr ? 'الإشعارات محجوبة في المتصفح' : 'Push Blocked in Browser'}
              </span>
            ) : (
              <button
                onClick={handleRequestPush}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-xs cursor-pointer active:scale-95"
              >
                <Bell className="w-3.5 h-3.5" />
                {isAr ? 'تفعيل إشعارات المتصفح الفورية' : 'Enable Push Notifications'}
              </button>
            )}
          </div>

          {/* Sound, Deviation Alert Toggle, & Test Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Deviation >20% Alert Toggle (User Request 4) */}
            <button
              onClick={handleToggleDeviationSetting}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-bold transition-colors cursor-pointer ${
                settings.notifyOnDeviation20 !== false
                  ? 'bg-rose-50 text-rose-900 border-rose-300 hover:bg-rose-100'
                  : 'bg-slate-200 text-slate-600 border-slate-300 hover:bg-slate-300'
              }`}
              title={isAr ? 'تفعيل تنبيهات الانحراف اليومي للمدير عند تجاوز 20%' : 'Toggle daily deviation alerts (>20%) for manager'}
            >
              <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
              <span>
                {settings.notifyOnDeviation20 !== false
                  ? (isAr ? 'إنذار الانحراف >20%: مفعّل' : 'Deviation >20%: ON')
                  : (isAr ? 'إنذار الانحراف: معطل' : 'Deviation: OFF')}
              </span>
            </button>

            {/* Sound Toggle */}
            <button
              onClick={() => {
                const nextSound = !settings.soundEnabled;
                onUpdateSettings({ ...settings, soundEnabled: nextSound });
                saveNotificationSettings({ ...settings, soundEnabled: nextSound });
                if (nextSound) playNearTargetChime();
              }}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border font-bold transition-colors cursor-pointer ${
                settings.soundEnabled
                  ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                  : 'bg-slate-200 text-slate-600 border-slate-300 hover:bg-slate-300'
              }`}
              title={isAr ? 'تبديل التنبيه الصوتي' : 'Toggle alert sound'}
            >
              {settings.soundEnabled ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-amber-600" />
                  <span>{isAr ? 'الصوت: مفعّل' : 'Sound: ON'}</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-slate-500" />
                  <span>{isAr ? 'الصوت: مكتوم' : 'Sound: Muted'}</span>
                </>
              )}
            </button>

            {/* Test Deviation Alert Sound */}
            <button
              onClick={handleTestDeviationAlert}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-900 font-bold transition-colors cursor-pointer shadow-2xs"
              title={isAr ? 'تجربة صوت الإنذار وإشعار الانحراف للمدير' : 'Test deviation alert sound & push'}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>
                {testDeviationSent ? (isAr ? 'تم الاختبار ⚠️' : 'Tested ⚠️') : (isAr ? 'تجربة إنذار انحراف' : 'Test Deviation')}
              </span>
            </button>

            {/* Test Milestone Alert Button */}
            <button
              onClick={handleSendTestNotification}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold transition-colors cursor-pointer shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>{testNotificationSent ? (isAr ? 'تم الاختبار ✓' : 'Tested ✓') : (isAr ? 'تجربة إشعار تارجت' : 'Test Alert')}</span>
            </button>
          </div>
        </div>

        {/* Manager Email Simulation Controls Strip (User Request 5 Feature) */}
        <div className="px-5 py-2.5 bg-gradient-to-r from-emerald-50 via-teal-50/50 to-blue-50/40 border-b border-emerald-200/80 text-xs shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-slate-900">
                  {isAr ? 'تقرير البريد لمدير الفرع (محاكاة):' : 'Manager Email Report (Simulation):'}
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    settings.autoEmailOn100
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {settings.autoEmailOn100 ? (
                    <>
                      <Sparkles className="w-3 h-3 text-amber-300" />
                      <span>{isAr ? 'إرسال تلقائي مفعّل عند 100%' : 'Auto-Send ON at 100%'}</span>
                    </>
                  ) : (
                    <span>{isAr ? 'إرسال يدوي عند الطلب' : 'Manual Dispatch Only'}</span>
                  )}
                </span>
              </div>
              <div className="text-[11px] text-slate-600 mt-0.5 flex items-center gap-1.5 flex-wrap">
                <span>{isAr ? 'المستلم:' : 'Recipient:'}</span>
                {isEditingManagerEmail ? (
                  <div className="inline-flex items-center gap-1 bg-white p-0.5 rounded border border-emerald-300 shadow-2xs">
                    <input
                      type="email"
                      value={managerEmailInput}
                      onChange={(e) => setManagerEmailInput(e.target.value)}
                      placeholder="manager@rayacorp.com"
                      className="px-1.5 py-0.5 text-xs text-slate-900 font-mono focus:outline-none w-44"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveManagerEmail}
                      className="px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-bold rounded hover:bg-emerald-700 cursor-pointer"
                    >
                      {isAr ? 'حفظ' : 'Save'}
                    </button>
                    <button
                      onClick={() => setIsEditingManagerEmail(false)}
                      className="px-1 py-0.5 text-slate-500 hover:text-slate-700 text-[10px] cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <span className="font-mono font-bold text-slate-800 bg-white/80 px-1.5 py-0.2 rounded border border-slate-200 flex items-center gap-1">
                    <AtSign className="w-3 h-3 text-slate-400" />
                    <span>{settings.managerEmail || managerEmailInput || DEFAULT_BRANCH_MANAGER_EMAIL}</span>
                    <button
                      onClick={() => setIsEditingManagerEmail(true)}
                      className="text-emerald-700 hover:underline text-[10px] ml-1 cursor-pointer"
                      title={isAr ? 'تعديل بريد المدير' : 'Edit email'}
                    >
                      ({isAr ? 'تعديل' : 'edit'})
                    </button>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Toggle Auto-Email Switch */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={handleToggleAutoEmail}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-extrabold transition-all cursor-pointer shadow-xs active:scale-95 ${
                settings.autoEmailOn100
                  ? 'bg-emerald-700 text-white hover:bg-emerald-800 ring-2 ring-emerald-400/50'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
              }`}
              title={
                isAr
                  ? 'ميزة اختيارية: إرسال تقرير موجز للأداء تلقائياً لبريد مدير الفرع بمجرد تحقيق الموظف 100%'
                  : 'Toggle auto-email simulation to manager on 100% target'
              }
            >
              <MailCheck className={`w-3.5 h-3.5 ${settings.autoEmailOn100 ? 'text-amber-300' : 'text-slate-400'}`} />
              <span>
                {settings.autoEmailOn100
                  ? (isAr ? 'الإرسال التلقائي: شغال ✓' : 'Auto-Email: ACTIVE ✓')
                  : (isAr ? 'تفعيل الإرسال التلقائي عند 100%' : 'Enable Auto-Email on 100%')}
              </span>
            </button>
          </div>
        </div>

        {/* Transient Action Toast Banner inside Modal */}
        {toastBanner && (
          <div className="px-5 py-2 bg-slate-900 text-emerald-300 text-xs font-bold flex items-center justify-between animate-in slide-in-from-top duration-200 shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>{toastBanner}</span>
            </div>
            <button onClick={() => setToastBanner(null)} className="text-slate-400 hover:text-white text-xs">
              ✕
            </button>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="px-5 pt-3 pb-2 bg-white border-b border-slate-100 flex items-center gap-2 overflow-x-auto shrink-0">
          <button
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              filterTab === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {isAr ? 'كافة التنبيهات' : 'All Alerts'} ({alerts.length})
          </button>

          {/* New Tab: Deviations > 20% & Immediate Corrective Actions (User Request 4) */}
          <button
            onClick={() => setFilterTab('deviations')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              filterTab === 'deviations'
                ? 'bg-rose-700 text-white shadow-xs ring-2 ring-rose-400/40'
                : 'text-rose-700 hover:bg-rose-50 border border-rose-200/80 bg-rose-50/40'
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5" />
            <span>{isAr ? 'تنبيهات الانحراف (>20%) والإجراءات' : 'Deviations (>20%) & Actions'}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                filterTab === 'deviations' ? 'bg-rose-950 text-white' : 'bg-rose-200 text-rose-900'
              }`}
            >
              {deviationAlerts.length}
            </span>
          </button>
          <button
            onClick={() => setFilterTab('100')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              filterTab === '100'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>{isAr ? 'حققوا 100% فأكثر' : 'Achieved 100%+'}</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-800/20 text-current font-extrabold">
              {achievers100.length}
            </span>
          </button>
          <button
            onClick={() => setFilterTab('90')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              filterTab === '90'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-amber-700 hover:bg-amber-50'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{isAr ? 'اقتربوا من الهدف (90% - 99%)' : 'Nearing Target (90%-99%)'}</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-800/20 text-current font-extrabold">
              {near90.length}
            </span>
          </button>
          <button
            onClick={() => setFilterTab('branch')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              filterTab === 'branch'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-blue-700 hover:bg-blue-50'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>{isAr ? 'إنجاز الفرع الكلي' : 'Branch Total'}</span>
            <span className="text-[11px] font-extrabold text-blue-800">
              {branchOverallRate.toFixed(1)}%
            </span>
          </button>

          {/* New Tab: Simulated Email Reports to Manager */}
          <button
            onClick={() => setFilterTab('emails')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              filterTab === 'emails'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'text-purple-700 hover:bg-purple-50'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>{isAr ? 'تقارير البريد للمدير (محاكاة)' : 'Simulated Email Reports'}</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
              filterTab === 'emails' ? 'bg-purple-900 text-white' : 'bg-purple-100 text-purple-800'
            }`}>
              {simulatedReports.length}
            </span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Branch Target Snapshot Card (if filter is branch or all) */}
          {(filterTab === 'all' || filterTab === 'branch') && (
            <div className={`p-4 rounded-xl border transition-all ${
              branchOverallRate >= 100
                ? 'bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-white border-emerald-300'
                : branchOverallRate >= 90
                ? 'bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-white border-amber-300'
                : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold ${
                    branchOverallRate >= 100
                      ? 'bg-emerald-600 text-white'
                      : branchOverallRate >= 90
                      ? 'bg-amber-600 text-white'
                      : 'bg-blue-600 text-white'
                  }`}>
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-sm">
                        {isAr ? 'مستهدف فرع راية كونكورد بلازا الإجمالي' : 'Raya Concorde Plaza Total Target'}
                      </h4>
                      {branchOverallRate >= 100 ? (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          {isAr ? '🎉 الفرع كسر التارجت' : 'Target Achieved!'}
                        </span>
                      ) : branchOverallRate >= 90 ? (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                          {isAr ? '⚡ اقترب الفرع من 100%' : 'Nearing 100%!'}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-xs text-slate-500">
                      {isAr ? 'مدير الفرع: هاني حنا · المستشارون: أحمد ربيع، عمرو عبد الحليم، طارق محمود' : 'Branch Manager: Hany Hanna'}
                    </p>
                  </div>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900">
                    {branchOverallRate.toFixed(1)}%
                  </span>
                  <span className="text-xs text-slate-500">
                    ({formatCurrencyNumber(branchTotalActual, currency)} / {formatCurrencyNumber(branchTotalTarget, currency)})
                  </span>
                </div>
              </div>

              {/* Branch Progress Bar */}
              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    branchOverallRate >= 100
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                      : branchOverallRate >= 90
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                      : 'bg-gradient-to-r from-blue-500 to-cyan-400'
                  }`}
                  style={{ width: `${Math.min(branchOverallRate, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Executive Deviation Warning Banner in "All" view (User Request 4) */}
          {filterTab === 'all' && deviationAlerts.length > 0 && (
            <div className="p-3.5 sm:p-4 rounded-xl border border-rose-300 bg-gradient-to-r from-rose-500/10 via-rose-50 to-amber-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs animate-in fade-in duration-200">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
                  <TrendingDown className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h5 className="font-black text-rose-950 text-xs sm:text-sm">
                      {isAr
                        ? `⚠️ رصد انحراف بيعي حاد (> 20%) لدى (${deviationAlerts.length}) موظفين!`
                        : `⚠️ Significant Sales Deviation (>20%) Detected for (${deviationAlerts.length}) staff!`}
                    </h5>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-700 text-white">
                      {isAr ? 'يتطلب إجراء تصحيحي فوري' : 'Action Required'}
                    </span>
                  </div>
                  <p className="text-xs text-rose-800/90 mt-0.5">
                    {isAr
                      ? `أكبر فجوة مسجلة: ${deviationAlerts[0].employeeName} (انحراف -${deviationAlerts[0].deviationPct}% | عجز ${formatCurrencyNumber(deviationAlerts[0].deficitAmount, currency)}). تم إعداد خطة التعويض للمدير.`
                      : `Top gap: ${deviationAlerts[0].employeeName} (-${deviationAlerts[0].deviationPct}% deficit). Immediate corrective plan generated.`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setFilterTab('deviations')}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs shadow-xs transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto active:scale-95"
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>{isAr ? 'مراجعة واعتماد خطط المعالجة' : 'Review & Approve Plans'}</span>
              </button>
            </div>
          )}

          {/* TAB: DEVIATION ALERTS (>20%) & IMMEDIATE CORRECTIVE ACTION SUITE (USER REQUEST 4) */}
          {filterTab === 'deviations' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Header Banner */}
              <div className="p-4 rounded-2xl border border-rose-200 bg-gradient-to-r from-rose-50 via-white to-amber-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold shadow-xs">
                    <TrendingDown className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-black text-slate-900">
                        {isAr
                          ? 'تنبيهات الانحراف اليومي للمدير (> 20%) ومقترحات المعالجة الفورية'
                          : 'Manager Daily Deviation Radar (>20%) & Immediate Corrective Actions'}
                      </h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                        {deviationAlerts.length} {isAr ? 'حالات عجز مرصودة' : 'Active Deficits'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {isAr
                        ? 'نظام الإنذار المبكر يرصد تلقائياً أي موظف يتجاوز انحرافه 20% عن المستهدف ويقترح خطة تدخل فوري لمدير الفرع.'
                        : 'Early warning radar identifies consultants trailing by >20% and proposes manager corrective plans.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    onClick={handleTestDeviationAlert}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-300 bg-white text-rose-800 hover:bg-rose-50 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>{isAr ? 'اختبار صوت التنبيه' : 'Test Sound'}</span>
                  </button>
                  {deviationAlerts.length > 0 && (
                    <button
                      onClick={() => handleSendDeviationSimulatedEmail(deviationAlerts[0])}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-2xs cursor-pointer"
                    >
                      <Mail className="w-3.5 h-3.5 text-amber-300" />
                      <span>{isAr ? 'إرسال تقرير للمدير (بريد)' : 'Email to Manager'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Deviation Alerts List */}
              {deviationAlerts.length === 0 ? (
                <div className="text-center py-12 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 mb-1">
                    {isAr ? 'ممتاز! لا يوجد أي موظف يعاني من انحراف يتجاوز 20%' : 'No severe deviations exceeding 20%!'}
                  </h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    {isAr
                      ? 'كافة مستشاري المبيعات بفرع راية كونكورد بلازا يعملون ضمن النطاق الآمن أو تجاوزوا المستهدفات المعتمدة.'
                      : 'All sales consultants are performing within the acceptable target range.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {deviationAlerts.map((dev) => {
                    const isWaCopied = copiedDeviationWaId === dev.id;
                    const isSendingEmail = sendingDeviationEmailId === dev.id;
                    const expectedRec = dev.expectedRecoveryAmount || Math.round(dev.deficitAmount * 0.65);

                    return (
                      <div
                        key={dev.id}
                        className={`p-4 sm:p-5 rounded-2xl border transition-all hover:shadow-md relative overflow-hidden ${
                          dev.isActionApproved
                            ? 'bg-gradient-to-r from-emerald-50/40 via-white to-slate-50 border-emerald-300 ring-1 ring-emerald-200'
                            : 'bg-gradient-to-r from-rose-50/60 via-white to-amber-50/40 border-rose-300'
                        }`}
                      >
                        {/* Top Badge Strip */}
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-rose-600 text-white shadow-2xs">
                              <TrendingDown className="w-3.5 h-3.5" />
                              <span>{isAr ? `انحراف بيعي حاد: -${dev.deviationPct}%` : `Critical Deficit: -${dev.deviationPct}%`}</span>
                            </span>

                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${
                                dev.actionPriority === 'urgent'
                                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                  : 'bg-amber-100 text-amber-800 border border-amber-200'
                              }`}
                            >
                              <AlertTriangle className="w-3 h-3" />
                              <span>
                                {dev.actionPriority === 'urgent'
                                  ? isAr
                                    ? 'أولوية قصوى / طارئ'
                                    : 'Urgent Priority'
                                  : isAr
                                  ? 'أولوية عالية'
                                  : 'High Priority'}
                              </span>
                            </span>

                            <span className="text-[11px] font-bold text-slate-500">
                              {dev.branch} · كود #{dev.employeeId || '125177'}
                            </span>
                          </div>

                          {/* Approval Status Badge */}
                          <div>
                            {dev.isActionApproved ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>{isAr ? 'الإجراء التصحيحي معتمد ومطبق بالفرع ✓' : 'Corrective Action Approved ✓'}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                <Wrench className="w-3 h-3 text-amber-700" />
                                <span>{isAr ? 'بانتظار اعتماد ومتابعة المدير' : 'Pending Manager Approval'}</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Employee Name & Metric Cards Grid */}
                        <div className="mb-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-11 h-11 rounded-xl bg-rose-100 text-rose-800 ring-2 ring-rose-300 flex items-center justify-center font-black text-lg shrink-0">
                                {dev.employeeName.charAt(0)}
                              </div>
                              <div>
                                <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
                                  <span>{dev.employeeName}</span>
                                  <span className="text-xs font-normal text-slate-500">
                                    ({isAr ? 'مستشار مبيعات - فرع كونكورد' : 'Sales Consultant'})
                                  </span>
                                </h4>
                                <p className="text-xs text-rose-700 font-bold flex items-center gap-1 mt-0.5">
                                  <BadgeAlert className="w-3.5 h-3.5" />
                                  <span>
                                    {isAr ? 'نقطة الاختناق الحرجة:' : 'Bottleneck Category:'}{' '}
                                    {dev.weakestCategory === 'installments'
                                      ? isAr
                                        ? 'ضعف مبيعات التقسيط والتمويل الاستهلاكي'
                                        : 'Installment Sales Lag'
                                      : dev.weakestCategory === 'accessories'
                                      ? isAr
                                        ? 'انخفاض معدل بيع الإكسسوارات والملحقات'
                                        : 'Accessories Attach Lag'
                                      : isAr
                                      ? 'تباطؤ مبيعات هواتف الفئة العليا'
                                      : 'Flagship Handset Lag'}
                                  </span>
                                </p>
                              </div>
                            </div>

                            <div className="text-right">
                              <span className="text-xs text-slate-500 block">{isAr ? 'نسبة التحقيق الحالية' : 'Current Rate'}</span>
                              <span className="text-2xl font-black text-rose-700">{dev.achievementRate}%</span>
                            </div>
                          </div>

                          {/* 4 Financial Metrics Grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-50/80 p-3 rounded-xl border border-slate-200">
                            <div>
                              <span className="text-[10px] text-slate-500 block font-bold">{isAr ? 'المستهدف المطلوب' : 'Target'}</span>
                              <span className="text-xs sm:text-sm font-black text-slate-800">
                                {formatCurrencyNumber(dev.target, currency)}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-500 block font-bold">{isAr ? 'المبيعات المحققة' : 'Actual'}</span>
                              <span className="text-xs sm:text-sm font-black text-slate-800">
                                {formatCurrencyNumber(dev.actual, currency)}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-rose-600 block font-bold">{isAr ? 'العجز المالي المطلوب تعويضه' : 'Deficit Gap'}</span>
                              <span className="text-xs sm:text-sm font-black text-rose-700">
                                -{formatCurrencyNumber(dev.deficitAmount, currency)}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-emerald-700 block font-bold">{isAr ? 'الأثر المتوقع للمعالجة' : 'Expected Recovery'}</span>
                              <span className="text-xs sm:text-sm font-black text-emerald-700">
                                +{formatCurrencyNumber(expectedRec, currency)}
                              </span>
                            </div>
                          </div>

                          {/* Dual Visual Progress Bar */}
                          <div className="mt-2.5">
                            <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 mb-1">
                              <span>{isAr ? 'مؤشر الفجوة البيعية مقارنة بالهدف (100%)' : 'Target Deficit Gap'}</span>
                              <span className="text-rose-700">
                                {isAr ? `عجز -${dev.deviationPct}%` : `-${dev.deviationPct}% gap`}
                              </span>
                            </div>
                            <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden flex">
                              <div
                                className="bg-rose-600 h-full rounded-l-full"
                                style={{ width: `${Math.min(dev.achievementRate, 100)}%` }}
                              />
                              <div
                                className="bg-rose-200/80 h-full"
                                style={{ width: `${Math.min(dev.deviationPct, 100 - dev.achievementRate)}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* IMMEDIATE CORRECTIVE ACTION PROPOSAL CARD (USER REQUEST 4) */}
                        <div className="p-3.5 sm:p-4 rounded-xl border border-amber-300 bg-gradient-to-r from-amber-500/10 via-amber-50/60 to-orange-50/40 mb-3.5">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                              <Wrench className="w-3.5 h-3.5" />
                            </div>
                            <h5 className="text-xs sm:text-sm font-black text-amber-950">
                              {isAr ? 'الإجراء التصحيحي الفوري المقترح للمدير:' : 'Immediate Proposed Corrective Action:'}{' '}
                              <span className="text-amber-800 underline decoration-amber-400">
                                {dev.actionTitleAr || (isAr ? 'خطة التدخل السريع' : 'Rapid Action')}
                              </span>
                            </h5>
                          </div>

                          <p className="text-xs text-slate-800 leading-relaxed mb-2.5">
                            {isAr ? dev.suggestedActionAr : dev.suggestedActionEn}
                          </p>

                          {/* Action Steps Checklist */}
                          {dev.remedyPlanSteps && dev.remedyPlanSteps.length > 0 && (
                            <div className="bg-white/80 p-2.5 rounded-lg border border-amber-200/80 space-y-1.5 mb-2.5">
                              <span className="text-[11px] font-black text-amber-900 block">
                                {isAr ? '📋 خطوات المعالجة التشغيلية بالفرع:' : 'Operational Action Steps:'}
                              </span>
                              {dev.remedyPlanSteps.map((step, idx) => (
                                <div key={idx} className="flex items-start gap-1.5 text-xs text-slate-700">
                                  <span className="w-4 h-4 rounded-full bg-amber-200 text-amber-900 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                                    {idx + 1}
                                  </span>
                                  <span>{step}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Approval Confirmation Footer */}
                          {dev.isActionApproved && (
                            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-100/80 px-2.5 py-1 rounded-lg border border-emerald-300">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              <span>
                                {isAr
                                  ? `تم اعتماد وتنفيذ هذا الإجراء رسمياً بواسطة مدير الفرع أ/ هاني حنا ${
                                      dev.approvedAt ? `(بتاريخ: ${new Date(dev.approvedAt).toLocaleDateString('ar-EG')})` : ''
                                    }`
                                  : `Approved and executed by Branch Manager Hany Hanna`}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Interactive Manager Action Buttons */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/70 text-xs">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {/* 1. Approve & Execute Button */}
                            <button
                              onClick={() => handleApproveAction(dev)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-black transition-all cursor-pointer shadow-2xs active:scale-95 ${
                                dev.isActionApproved
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                  : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                              }`}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>
                                {dev.isActionApproved
                                  ? isAr
                                    ? 'إعادة تأكيد الاعتماد ✓'
                                    : 'Re-confirm Approval ✓'
                                  : isAr
                                  ? 'اعتماد وتنفيذ الإجراء التصحيحي'
                                  : 'Approve & Execute Action'}
                              </span>
                            </button>

                            {/* 2. WhatsApp Share Button with Pre-filled Message */}
                            <button
                              onClick={() => handleShareDeviationWhatsApp(dev)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
                              title={isAr ? 'إرسال خطة المعالجة للموظف عبر تطبيق واتساب' : 'Send action plan via WhatsApp'}
                            >
                              {isWaCopied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                              <span>
                                {isWaCopied
                                  ? isAr
                                    ? 'تم النسخ والفتح ✓'
                                    : 'Copied & Opened ✓'
                                  : isAr
                                  ? 'مشاركة الخطة عبر واتساب'
                                  : 'Share Plan on WhatsApp'}
                              </span>
                            </button>

                            {/* 3. Send Deviation Email Report to Manager */}
                            <button
                              onClick={() => handleSendDeviationSimulatedEmail(dev)}
                              disabled={isSendingEmail}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold transition-all shadow-2xs cursor-pointer disabled:opacity-50"
                              title={isAr ? 'إرسال تنبيه الانحراف البيعي لصندوق بريد المدير (محاكاة)' : 'Send deviation alert to manager email'}
                            >
                              {isSendingEmail ? (
                                <>
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  <span>{isAr ? 'جاري الإرسال...' : 'Sending...'}</span>
                                </>
                              ) : (
                                <>
                                  <Mail className="w-3.5 h-3.5 text-rose-300" />
                                  <span>{isAr ? 'إرسال تنبيه لبريد المدير (بريد)' : 'Email to Manager'}</span>
                                </>
                              )}
                            </button>
                          </div>

                          {/* View in Table */}
                          <button
                            onClick={() => {
                              onSelectEmployee(dev.employeeName);
                              onClose();
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold transition-colors cursor-pointer"
                          >
                            <span>{isAr ? 'عرض في جدول الموظفين' : 'View in Table'}</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* List of Employee Milestone Alerts (Only for all, 100, 90) */}
          {(filterTab === 'all' || filterTab === '100' || filterTab === '90') && (
            <div className="space-y-3">
              {filteredAlerts.length === 0 ? (
                <div className="text-center py-12 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <div className="w-12 h-12 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center mx-auto mb-3">
                    <Bell className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-700 mb-1">
                    {isAr ? 'لا توجد تنبيهات نشطة في هذا القسم حالياً' : 'No active alerts in this section right now'}
                  </h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    {isAr
                      ? 'سيظهر هنا أي موظف فور وصوله إلى نسبة 90% أو تجاوزه لـ 100% من التارجت بمجرد تحديث المبيعات أو إرفاق الشيت.'
                      : 'Consultants will appear here as soon as they hit 90% or cross 100% target.'}
                  </p>
                </div>
              ) : (
                filteredAlerts.map((alert) => {
                  const is100 = alert.type === 'achieved_100';
                  const isCopied = copiedId === alert.id;

                  return (
                    <div
                      key={alert.id}
                      className={`p-4 sm:p-5 rounded-2xl border transition-all hover:shadow-md relative overflow-hidden ${
                        is100
                          ? 'bg-gradient-to-r from-emerald-50/70 via-white to-emerald-50/30 border-emerald-300'
                          : 'bg-gradient-to-r from-amber-50/70 via-white to-amber-50/30 border-amber-300'
                      }`}
                    >
                      {/* Top Badge Strip */}
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black shadow-2xs ${
                              is100
                                ? 'bg-emerald-600 text-white'
                                : 'bg-amber-500 text-white'
                            }`}
                          >
                            {is100 ? (
                              <>
                                <Trophy className="w-3.5 h-3.5" />
                                <span>{isAr ? '🌟 حقق التارجت بالكامل' : '100%+ Target Achieved'}</span>
                              </>
                            ) : (
                              <>
                                <Zap className="w-3.5 h-3.5 animate-pulse" />
                                <span>{isAr ? '⚡ اقترب جداً من التارجت' : 'Nearing Target (90%+)'}</span>
                              </>
                            )}
                          </span>

                          <span className="text-[11px] font-bold text-slate-500">
                            {alert.branch}
                          </span>
                        </div>

                        {/* Achievement percentage badge */}
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-lg sm:text-xl font-black ${
                              is100 ? 'text-emerald-700' : 'text-amber-700'
                            }`}
                          >
                            {alert.achievementRate}%
                          </span>
                          <span className="text-xs text-slate-400 font-medium">
                            {isAr ? 'نسبة التحقيق' : 'Achievement'}
                          </span>
                        </div>
                      </div>

                      {/* Main Employee & Financial Details */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-base shadow-xs shrink-0 ${
                              is100
                                ? 'bg-emerald-100 text-emerald-800 ring-2 ring-emerald-400'
                                : 'bg-amber-100 text-amber-800 ring-2 ring-amber-400'
                            }`}
                          >
                            {alert.employeeName.charAt(0)}
                          </div>
                          <div>
                            <h4 className="text-base font-extrabold text-slate-900 leading-snug">
                              {alert.employeeName}
                            </h4>
                            <p className="text-xs text-slate-500 flex items-center gap-2">
                              {alert.employeeId && (
                                <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px] font-mono text-slate-700 font-bold">
                                  #{alert.employeeId}
                                </span>
                              )}
                              <span>
                                {isAr ? 'مستشار مبيعات بالفرع' : 'Sales Advisor'}
                              </span>
                            </p>
                          </div>
                        </div>

                        {/* Financial figures */}
                        <div className="bg-white/80 backdrop-blur-xs p-2.5 rounded-xl border border-slate-200/80 text-xs flex items-center gap-4">
                          <div>
                            <span className="block text-[10px] text-slate-500 font-medium">
                              {isAr ? 'المبيعات الفعلية' : 'Actual Sales'}
                            </span>
                            <span className="font-extrabold text-slate-900 text-sm">
                              {formatCurrencyNumber(alert.actual, currency)}
                            </span>
                          </div>
                          <div className="h-7 w-px bg-slate-200" />
                          <div>
                            <span className="block text-[10px] text-slate-500 font-medium">
                              {isAr ? 'التارجت المطلوب' : 'Target'}
                            </span>
                            <span className="font-bold text-slate-700 text-sm">
                              {formatCurrencyNumber(alert.target, currency)}
                            </span>
                          </div>
                          <div className="h-7 w-px bg-slate-200" />
                          <div>
                            <span className="block text-[10px] text-slate-500 font-medium">
                              {is100 ? (isAr ? 'الفائض المحقق' : 'Surplus') : (isAr ? 'متبقي للهدف' : 'Remaining')}
                            </span>
                            <span
                              className={`font-black text-sm ${
                                is100 ? 'text-emerald-700' : 'text-amber-700'
                              }`}
                            >
                              {is100 ? '+' : '-'}
                              {formatCurrencyNumber(alert.remainingAmount, currency)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="mb-3">
                        <div className="w-full bg-slate-200/80 h-2 rounded-full overflow-hidden shadow-inner">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${
                              is100
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                                : 'bg-gradient-to-r from-amber-500 to-yellow-400'
                            }`}
                            style={{ width: `${Math.min(alert.achievementRate, 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Action Buttons: Copy cheer, Celebrate, Send Simulated Email, View in Table */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/60 text-xs">
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Copy motivational message */}
                          <button
                            onClick={() => handleCopyCheer(alert)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                              isCopied
                                ? 'bg-emerald-600 text-white'
                                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300'
                            }`}
                            title={isAr ? 'نسخ رسالة تشجيعية فورية لإرسالها بالواتساب للموظف' : 'Copy cheer message'}
                          >
                            {isCopied ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>{isAr ? 'تم نسخ التهنئة!' : 'Cheer Copied!'}</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-slate-500" />
                                <span>{isAr ? 'نسخ رسالة تشجيع / تهنئة' : 'Copy Cheer Message'}</span>
                              </>
                            )}
                          </button>

                          {/* Trigger confetti celebration */}
                          <button
                            onClick={() => handleCelebrate(alert)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold transition-colors cursor-pointer"
                            title={isAr ? 'احتفال وإطلاق زينة وتأثيرات صوتية' : 'Celebrate with sound & confetti'}
                          >
                            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                            <span>{isAr ? 'احتفال 🎉' : 'Celebrate 🎉'}</span>
                          </button>

                          {/* 100% Target: Send simulated email report to Branch Manager */}
                          {is100 && (
                            <button
                              onClick={() => handleSendSimulatedEmail(alert)}
                              disabled={sendingEmailForAlertId === alert.id}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer shadow-2xs ${
                                emailSentSuccessId === alert.id
                                  ? 'bg-emerald-700 text-white'
                                  : sendingEmailForAlertId === alert.id
                                  ? 'bg-purple-100 text-purple-700 border border-purple-300 animate-pulse'
                                  : 'bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-300'
                              }`}
                              title={isAr ? 'إرسال تقرير أداء فوري وموجز لبريد مدير الفرع (محاكاة)' : 'Send simulated performance report email to branch manager'}
                            >
                              {emailSentSuccessId === alert.id ? (
                                <>
                                  <MailCheck className="w-3.5 h-3.5 text-emerald-300" />
                                  <span>{isAr ? 'تم إرسال التقرير للمدير ✓' : 'Report Sent to Manager!'}</span>
                                </>
                              ) : sendingEmailForAlertId === alert.id ? (
                                <>
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  <span>{isAr ? 'جاري الإرسال...' : 'Sending...'}</span>
                                </>
                              ) : (
                                <>
                                  <Mail className="w-3.5 h-3.5 text-purple-600" />
                                  <span>{isAr ? 'إرسال تقرير للمدير (بريد)' : 'Send Email to Manager'}</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>

                        {/* View in table */}
                        <button
                          onClick={() => {
                            onSelectEmployee(alert.employeeName);
                            onClose();
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold transition-colors cursor-pointer"
                        >
                          <span>{isAr ? 'عرض في جدول الموظفين' : 'View in Table'}</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* SIMULATED EMAIL REPORTS VIEW */}
          {filterTab === 'emails' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between bg-purple-50 border border-purple-200 p-3.5 rounded-xl">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-purple-950">
                      {isAr ? 'سجل تقارير البريد الإلكتروني المرسلة للمدير (محاكاة)' : 'Simulated Manager Email Reports'}
                    </h4>
                    <p className="text-xs text-purple-700">
                      {isAr
                        ? `المستلم الافتراضي: ${settings.managerEmail || DEFAULT_BRANCH_MANAGER_EMAIL} · الإرسال التلقائي: ${
                            settings.autoEmailOn100 ? 'مفعل عند 100%' : 'معطل'
                          }`
                        : `Recipient: ${settings.managerEmail || DEFAULT_BRANCH_MANAGER_EMAIL}`}
                    </p>
                  </div>
                </div>

                {simulatedReports.length > 0 && (
                  <button
                    onClick={handleClearAllReports}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-rose-700 hover:bg-rose-100 border border-rose-300 rounded-lg font-bold transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isAr ? 'مسح السجل' : 'Clear History'}</span>
                  </button>
                )}
              </div>

              {simulatedReports.length === 0 ? (
                <div className="text-center py-12 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                  <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mx-auto mb-3">
                    <Mail className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 mb-1">
                    {isAr ? 'لا توجد تقارير بريد مرسلة حتى الآن' : 'No simulated email reports dispatched yet'}
                  </h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
                    {isAr
                      ? 'عند تفعيل خيار الإرسال التلقائي أعلاه أو الضغط على زر "إرسال تقرير للمدير" بجوار أي موظف حقق 100%، سيتم توليد تقرير بريدي مفصل وحفظه هنا للمعاينة والنسخ والطباعة.'
                      : 'When auto-email is enabled or you click Send Email for any 100% achiever, simulated reports will be archived here.'}
                  </p>
                  {achievers100.length > 0 && (
                    <button
                      onClick={() => handleSendSimulatedEmail(achievers100[0])}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-all active:scale-95"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>
                        {isAr
                          ? `إرسال تقرير تجريبي لأول محقق 100% (${achievers100[0].employeeName})`
                          : `Send test report for ${achievers100[0].employeeName}`}
                      </span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {simulatedReports.map((report) => (
                    <div
                      key={report.id}
                      className="p-4 rounded-xl border border-purple-200 bg-white hover:border-purple-400 hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold shrink-0 mt-0.5">
                          <MailCheck className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h5 className="font-bold text-slate-900 text-sm">{report.subject}</h5>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              {report.deliveryStatus === 'delivered_simulated' ? (isAr ? 'تم التسليم لمحاكاة البريد ✓' : 'Delivered') : report.deliveryStatus}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-2">
                            <span>{isAr ? 'المستلم:' : 'To:'} <strong className="font-mono text-slate-700">{report.recipientEmail}</strong></span>
                            <span>•</span>
                            <span>{new Date(report.sentAt).toLocaleString(isAr ? 'ar-EG' : 'en-US')}</span>
                            <span>•</span>
                            <span className="font-semibold text-purple-700">{report.employeeName}</span>
                          </p>
                          <p className="text-xs text-slate-600 line-clamp-1 mt-1 font-mono bg-slate-50 p-1 rounded border border-slate-200">
                            {report.previewSnippet}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                        <button
                          onClick={() => setSelectedEmailPreview(report)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{isAr ? 'معاينة البريد' : 'Preview'}</span>
                        </button>
                        <button
                          onClick={() => handleCopyEmailText(report)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                          title={isAr ? 'نسخ نص البريد' : 'Copy email text'}
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteReport(report.id, e)}
                          className="p-1.5 rounded-lg hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                          title={isAr ? 'حذف هذا التقرير' : 'Delete'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>
              {isAr
                ? 'النظام يراقب التارجت لحظياً ويرسل تقارير البريد للمدير تلقائياً بمجرد كسر 100%.'
                : 'Real-time monitoring active with automated branch manager email simulations on 100% target.'}
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold transition-colors cursor-pointer"
          >
            {isAr ? 'إغلاق النافذة' : 'Close'}
          </button>
        </div>
      </div>

      {/* MODAL: Full Simulated Email Preview */}
      {selectedEmailPreview && (
        <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Window title bar styled like mail client */}
            <div className="px-5 py-3 bg-gradient-to-r from-purple-900 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <MailCheck className="w-5 h-5 text-purple-300" />
                <span className="font-bold text-sm">
                  {isAr ? 'معاينة رسالة البريد الإلكتروني المرسلة للمدير' : 'Manager Email Client Simulation'}
                </span>
              </div>
              <button
                onClick={() => setSelectedEmailPreview(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Simulated Email Envelope Header */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-slate-400 font-semibold">{isAr ? 'من: ' : 'From: '}</span>
                  <strong className="text-slate-800">Raya Performance Radar &lt;alerts@rayacorp.com&gt;</strong>
                </div>
                <span className="text-slate-400 font-mono text-[11px]">
                  {new Date(selectedEmailPreview.sentAt).toLocaleString(isAr ? 'ar-EG' : 'en-US')}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold">{isAr ? 'إلى: ' : 'To: '}</span>
                <span className="font-mono bg-purple-100 text-purple-900 px-2 py-0.5 rounded font-bold">
                  {selectedEmailPreview.recipientEmail}
                </span>
                <span className="text-slate-500 mr-2 ml-2">
                  ({isAr ? 'مدير فرع كونكورد بلازا - هاني حنا' : 'Branch Manager - Hany Hanna'})
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold">{isAr ? 'الموضوع: ' : 'Subject: '}</span>
                <strong className="text-slate-900 text-sm">{selectedEmailPreview.subject}</strong>
              </div>
            </div>

            {/* Email Body Content */}
            <div className="flex-1 overflow-y-auto p-5 text-sm bg-white">
              <div className="max-w-xl mx-auto border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
                {/* Branding banner */}
                <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white font-black flex items-center justify-center text-sm">
                      R
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 text-sm">RAYA RETAIL - EGYPT</h4>
                      <p className="text-[10px] text-slate-500">فرع كونكورد بلازا · القاهرة الجديدة</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                    🌟 100%+ TARGET HIT
                  </span>
                </div>

                <div className="whitespace-pre-line text-slate-800 text-xs sm:text-sm font-sans leading-relaxed">
                  {selectedEmailPreview.body}
                </div>

                <div className="pt-4 border-t border-slate-200 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>تم التوليد آلياً بواسطة نظام راية لإدارة المبيعات</span>
                  <span>CONFIDENTIAL - INTERNAL USE</span>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
              <button
                onClick={() => handleCopyEmailText(selectedEmailPreview)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 font-bold border border-slate-300 rounded-lg cursor-pointer transition-colors"
              >
                {copiedEmailText ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
                <span>{copiedEmailText ? (isAr ? 'تم نسخ النص!' : 'Copied!') : (isAr ? 'نسخ نص البريد' : 'Copy Text')}</span>
              </button>

              <button
                onClick={() => setSelectedEmailPreview(null)}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg cursor-pointer"
              >
                {isAr ? 'إغلاق المعاينة' : 'Close Preview'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
