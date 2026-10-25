/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  SalesRecord,
  Currency,
  FilterStatus,
  Language,
  ProductIncentiveRule,
  BranchTotalTargetStructure,
  EmployeeTargetAllocation,
  AuditReport,
  TargetMilestoneAlert,
  NotificationSettings,
} from './types/sales';
import {
  INITIAL_SAMPLE_RECORDS,
  enrichSalesRecords,
  DEFAULT_PRODUCT_INCENTIVE_RULES,
  CONCORD_BRANCH_NAME,
  DEFAULT_OCTOBER_TARGET_STRUCTURE,
} from './data/sampleData';
import {
  calculateBranchPerformances,
  calculateOverallStats,
} from './utils/calculations';
import {
  downloadSampleExcelTemplate,
  exportRecordsToExcel,
  ParseIncentiveResult,
} from './utils/excelParser';
import { translations } from './utils/i18n';
import { InventoryItem } from './types/inventory';
import { saveConcordeInventoryItems } from './utils/inventoryOptimizerService';
import {
  loadNotificationSettings,
  checkAndNotifyTargetMilestones,
  extractTargetMilestoneAlerts,
} from './utils/notificationService';
import { Navbar } from './components/Navbar';
import { LiveClockAndSync } from './components/LiveClockAndSync';
import { TargetAlertBanner } from './components/TargetAlertBanner';
import { TargetNotificationCenter } from './components/TargetNotificationCenter';
import { BranchTeamHeader } from './components/BranchTeamHeader';
import { KpiCards } from './components/KpiCards';
import { BranchPerformanceCurve } from './components/BranchPerformanceCurve';
import { GrowthForecastSection } from './components/GrowthForecastSection';
import { BranchComparisonChart } from './components/BranchComparisonChart';
import { Leaderboard } from './components/Leaderboard';
import { FiltersBar } from './components/FiltersBar';
import { PerformanceTable } from './components/PerformanceTable';
import { UploadModal } from './components/UploadModal';
import { RecordModal } from './components/RecordModal';
import { IncentivesModal } from './components/IncentivesModal';
import { IncentiveBreakdownModal } from './components/IncentiveBreakdownModal';
import { TargetAllocationModal } from './components/TargetAllocationModal';
import { MobileDeviceModal } from './components/MobileDeviceModal';
import { MonthlyReportModal } from './components/MonthlyReportModal';
import { OctoberTargetBanner } from './components/OctoberTargetBanner';
import { BranchTargetAndActualsManager } from './components/BranchTargetAndActualsManager';
import { FastExcelProcessingHub } from './components/FastExcelProcessingHub';
import { DeviceModeFloatingBar } from './components/DeviceModeFloatingBar';
import { ExportAndDownloadCenterModal } from './components/ExportAndDownloadCenterModal';
import { DownloadManagerNotification } from './components/DownloadManagerNotification';
import { ExecutivePresentationCard } from './components/ExecutivePresentationCard';
import { SectionAndStaffAnalyticsHub } from './components/SectionAndStaffAnalyticsHub';
import { AllAchievementsDashboard } from './components/AllAchievementsDashboard';
import { UnifiedAiPromptModal } from './components/UnifiedAiPromptModal';
import { ConcordeAnnualProjectionSection } from './components/ConcordeAnnualProjectionSection';
import { SmartInventoryOptimizerModal } from './components/SmartInventoryOptimizerModal';
import { RayaCorporateOptimizerDashboard } from './components/RayaCorporateOptimizerDashboard';
import { EmployeeDeepAnalytics } from './components/EmployeeDeepAnalytics';
import { AndroidMobileShell } from './components/AndroidMobileShell';
import {
  Download,
  UploadCloud,
  CheckCircle,
  FileCheck,
  Coins,
  Target,
  QrCode,
  FileText,
  Sparkles,
  Boxes,
  Truck,
  ArrowRightLeft,
} from 'lucide-react';

export default function App() {
  // Language control (Arabic 'ar' or English 'en')
  const [language, setLanguage] = useState<Language>('ar');

  // Currency control - defaulted to Egyptian Pounds 'EGP' as requested
  const [currency, setCurrency] = useState<Currency>('EGP');

  // State for all records - initialized with Raya Concorde Plaza branch & team members
  const [records, setRecords] = useState<SalesRecord[]>(() =>
    enrichSalesRecords(INITIAL_SAMPLE_RECORDS)
  );

  // Corporate Product Incentive Rules
  const [incentiveRules, setIncentiveRules] = useState<ProductIncentiveRule[]>(
    DEFAULT_PRODUCT_INCENTIVE_RULES
  );

  // Target Structure state: Grand Total = Revenue (Mobiles, Accessories, Other TVs/ACs) + Collective Installment
  const [targetStructure, setTargetStructure] = useState<BranchTotalTargetStructure>(
    DEFAULT_OCTOBER_TARGET_STRUCTURE
  );

  // VAT Display Mode (After VAT with 14% vs Before VAT Net)
  const [vatDisplayMode, setVatDisplayMode] = useState<'afterVat' | 'beforeVat'>('afterVat');

  // Data Quality & Error Audit Report
  const [auditReport, setAuditReport] = useState<AuditReport | null>(null);

  // Cloud Sync state (Mobile <-> Desktop)
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toISOString());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const isInitialMount = useRef(true);

  // Filter states
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('أكتوبر 2026');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

  // Modal states
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isIncentivesModalOpen, setIsIncentivesModalOpen] = useState(false);
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);
  const [isMonthlyReportModalOpen, setIsMonthlyReportModalOpen] = useState(false);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [recordToEdit, setRecordToEdit] = useState<SalesRecord | null>(null);
  const [selectedIncentiveRecord, setSelectedIncentiveRecord] = useState<SalesRecord | null>(null);

  // Real-time Push & Visual Target Milestone Alerts State
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(() => loadNotificationSettings());

  // Download & Export Center Modal State
  const [isDownloadCenterOpen, setIsDownloadCenterOpen] = useState(false);

  // Unified Data Import & AI Formatting Prompt Modal State
  const [isUnifiedPromptModalOpen, setIsUnifiedPromptModalOpen] = useState(false);

  // Smart Inventory & Sales Optimizer Modal State (مدير الإمداد والمبيعات الذكي)
  const [isInventoryOptimizerOpen, setIsInventoryOptimizerOpen] = useState(false);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Dedicated Android Mobile View vs Desktop Dashboard View Mode
  const [viewMode, setViewMode] = useState<'mobile' | 'desktop'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('raya_view_mode');
      if (saved === 'mobile' || saved === 'desktop') return saved;
      if (
        window.innerWidth < 768 ||
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      ) {
        return 'mobile';
      }
    }
    return 'desktop';
  });

  const handleToggleViewMode = (mode?: 'mobile' | 'desktop') => {
    setViewMode((prev) => {
      const next = mode ?? (prev === 'mobile' ? 'desktop' : 'mobile');
      try {
        localStorage.setItem('raya_view_mode', next);
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  const t = translations[language];

  // Sync document direction and language tag
  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    document.title = t.appName + ' - ' + t.appSubtitle;
  }, [language, t]);

  // Listen to global download & export completion events
  useEffect(() => {
    const handleRayaEvent = (e: Event) => {
      const custom = e as CustomEvent<{ title?: string; message: string; type?: string }>;
      if (custom.detail?.message) {
        setToastMessage(custom.detail.message);
        setTimeout(() => setToastMessage(null), 4000);
      }
    };
    window.addEventListener('raya-notification', handleRayaEvent);
    return () => window.removeEventListener('raya-notification', handleRayaEvent);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Initial fetch and seeding to backend
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const res = await fetch('/api/records');
        if (res.ok) {
          const data = await res.json();
          if (data.records && data.records.length > 0) {
            setRecords(enrichSalesRecords(data.records));
            if (data.lastUpdated) setLastUpdated(data.lastUpdated);
          } else {
            // Seed initial records to backend
            const initial = enrichSalesRecords(INITIAL_SAMPLE_RECORDS);
            await fetch('/api/records', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ records: initial }),
            });
          }
        }

        // Fetch persisted target allocation if available
        const targetRes = await fetch('/api/target-allocation');
        if (targetRes.ok) {
          const tData = await targetRes.json();
          if (tData.targetAllocation && tData.targetAllocation.revenueBreakdown) {
            setTargetStructure(tData.targetAllocation);
          }
        }
      } catch (err) {
        console.log('Running in local offline mode or dev server');
      }
    };

    fetchInitialData();
  }, []);

  // Computed allocations for the 3 advisors from the revenue target (Excluding installment target)
  const currentAllocations: EmployeeTargetAllocation[] = useMemo(() => {
    const staff = [
      { id: '140729', name: 'أحمد ربيع سيد', role: 'مستشار مبيعات أول (Senior Advisor)', percentage: 40 },
      { id: '41308', name: 'عمرو عبد الحليم', role: 'مستشار مبيعات (Sales Advisor)', percentage: 35 },
      { id: '125177', name: 'طارق محمود', role: 'مستشار مبيعات (Sales Advisor)', percentage: 25 },
    ];
    return staff.map((s) => {
      const targetAmount = Math.round(targetStructure.revenueTarget * (s.percentage / 100));
      const dailyTarget = Math.round(targetAmount / (targetStructure.daysInMonth || 31));
      const mobilesShare = Math.round(targetStructure.revenueBreakdown.mobiles * (s.percentage / 100));
      const accessoriesShare = Math.round(targetStructure.revenueBreakdown.accessories * (s.percentage / 100));
      const otherShare = Math.round(targetStructure.revenueBreakdown.other * (s.percentage / 100));
      return {
        employeeId: s.id,
        employeeName: s.name,
        role: s.role,
        percentage: s.percentage,
        targetAmount,
        dailyTarget,
        mobilesShare,
        accessoriesShare,
        otherShare,
      };
    });
  }, [targetStructure]);

  // Periodic poll for cross-device sync (Desktop <-> Mobile)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/sync-status');
        if (res.ok) {
          const status = await res.json();
          if (status.lastUpdated && status.lastUpdated > lastUpdated) {
            // New updates detected from another device (mobile or desktop)!
            const recRes = await fetch('/api/records');
            if (recRes.ok) {
              const data = await recRes.json();
              if (data.records) {
                setRecords(enrichSalesRecords(data.records));
                setLastUpdated(data.lastUpdated);
              }
            }
          }
        }
      } catch {
        // Ignore background polling errors
      }
    }, 4500);

    return () => clearInterval(interval);
  }, [lastUpdated]);

  // Persist records to backend
  const persistRecords = async (newRecords: SalesRecord[]) => {
    setIsSyncing(true);
    setRecords(newRecords);
    const nowIso = new Date().toISOString();
    setLastUpdated(nowIso);

    try {
      await fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records: newRecords }),
      });
    } catch (err) {
      console.log('Saved locally:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/records');
      if (res.ok) {
        const data = await res.json();
        if (data.records) {
          setRecords(enrichSalesRecords(data.records));
          if (data.lastUpdated) setLastUpdated(data.lastUpdated);
          showToast(language === 'ar' ? 'تمت مزامنة البيانات السحابية بنجاح.' : 'Synced data with cloud.');
        }
      }
    } catch {
      showToast(language === 'ar' ? 'البيانات محدثة محلياً.' : 'Local records up to date.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleToggleLanguage = () => {
    setLanguage((prev) => (prev === 'ar' ? 'en' : 'ar'));
  };

  // List of all unique periods (October Month 10 prioritized)
  const uniquePeriods = useMemo(() => {
    const list = Array.from(new Set(records.map((r) => r.period).filter(Boolean))) as string[];
    return list.sort((a, b) => {
      if (a.includes('أكتوبر') || a.includes('Oct')) return -1;
      if (b.includes('أكتوبر') || b.includes('Oct')) return 1;
      return b.localeCompare(a);
    });
  }, [records]);

  // Records filtered by selectedPeriod for accurate KPI calculations
  const recordsInActivePeriod = useMemo(() => {
    if (!selectedPeriod) return records;
    const matched = records.filter((r) => r.period === selectedPeriod);
    return matched.length > 0 ? matched : records;
  }, [records, selectedPeriod]);

  // Branch summaries and overall statistics
  const branchPerformances = useMemo(() => {
    return calculateBranchPerformances(recordsInActivePeriod);
  }, [recordsInActivePeriod]);

  const overallStats = useMemo(() => {
    return calculateOverallStats(recordsInActivePeriod, branchPerformances);
  }, [recordsInActivePeriod, branchPerformances]);

  // Active real-time milestone alerts (>= 90% and >= 100%)
  const activeMilestoneAlerts = useMemo(() => {
    return extractTargetMilestoneAlerts(recordsInActivePeriod);
  }, [recordsInActivePeriod]);

  // Monitor target milestones and trigger notifications & sound
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    checkAndNotifyTargetMilestones(
      recordsInActivePeriod,
      notificationSettings,
      (newAlert) => {
        showToast(
          language === 'ar'
            ? (newAlert.type === 'achieved_100'
                ? `🎉 إنجاز مذهل! ${newAlert.employeeName} حقق 100% من التارجت!`
                : `⚡ تنبيه اقتراب! ${newAlert.employeeName} وصل إلى ${newAlert.achievementRate}% من التارجت!`)
            : (newAlert.type === 'achieved_100'
                ? `🎉 Great achievement! ${newAlert.employeeName} reached 100% target!`
                : `⚡ Target Alert: ${newAlert.employeeName} reached ${newAlert.achievementRate}% of target!`)
        );
      }
    );
  }, [recordsInActivePeriod, notificationSettings, language]);

  // List of all unique branch names
  const uniqueBranches = useMemo(() => {
    return Array.from(new Set(records.map((r) => r.branch))).filter(Boolean);
  }, [records]);

  // Filtered records for the table view
  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      // 0. Period filter
      if (selectedPeriod && rec.period && rec.period !== selectedPeriod) {
        return false;
      }

      // 1. Branch filter
      if (selectedBranch && rec.branch !== selectedBranch) {
        return false;
      }

      // 2. Search query (employee name, Job ID, or branch)
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchEmp = rec.employee.toLowerCase().includes(q);
        const matchBranch = rec.branch.toLowerCase().includes(q);
        const matchJobId = rec.employeeId ? rec.employeeId.toLowerCase().includes(q) : false;
        if (!matchEmp && !matchBranch && !matchJobId) return false;
      }

      // 3. Status filter
      if (filterStatus === 'achieved' && !rec.isAchieved) {
        return false;
      }
      if (filterStatus === 'unachieved' && rec.isAchieved) {
        return false;
      }
      if (filterStatus === 'near' && (rec.isAchieved || rec.achievementRate < 90)) {
        return false;
      }

      return true;
    });
  }, [records, selectedPeriod, selectedBranch, searchQuery, filterStatus]);

  // Handlers
  const handleImportRecords = (newRecords: SalesRecord[], mode: 'replace' | 'append') => {
    if (mode === 'replace') {
      persistRecords(newRecords);
      showToast(
        language === 'ar'
          ? `تم استبدال البيانات واستيراد ${newRecords.length} سجلاً بنجاح.`
          : `Successfully imported ${newRecords.length} records.`
      );
    } else {
      const merged = [...records, ...newRecords];
      persistRecords(merged);
      showToast(
        language === 'ar'
          ? `تمت إضافة ${newRecords.length} سجلاً جديداً إلى لوحة التحكم.`
          : `Added ${newRecords.length} new records to dashboard.`
      );
    }
  };

  const handleUpdateIncentiveRules = (newRules: ProductIncentiveRule[]) => {
    setIncentiveRules(newRules);
    showToast(t.incentivesUpdatedToast);
  };

  const handleImportIncentiveSheet = (result: ParseIncentiveResult) => {
    if (!result.isEmployeeBased && result.productRules.length > 0) {
      setIncentiveRules(result.productRules);
    }
    showToast(
      language === 'ar'
        ? `تم ربط شيت الحافز بنجاح واعتماد إجمالي ${result.totalIncentiveAmount.toLocaleString()} ج.م حوافز.`
        : `Linked incentive sheet successfully (${result.totalIncentiveAmount.toLocaleString()} EGP).`
    );
  };

  const handleImportStockItems = (items: InventoryItem[], fileName: string) => {
    saveConcordeInventoryItems(items);
    showToast(
      language === 'ar'
        ? `تم استيراد ومعالجة شيت المخزون "${fileName}" بنجاح (${items.length} صنف)!`
        : `Successfully imported stock sheet "${fileName}" (${items.length} items)!`
    );
  };

  const handleUpdateRecordsWithAudit = (auditedRecords: SalesRecord[], report: AuditReport) => {
    setAuditReport(report);
    persistRecords(auditedRecords);
    showToast(
      language === 'ar'
        ? `تم تدقيق البيانات وتصحيح ${report.autoFixedCount} ملاحظة تلقائياً بنجاح.`
        : `Audited data and auto-resolved ${report.autoFixedCount} issues.`
    );
  };

  // Apply new target allocations across records
  const handleApplyNewTargets = async (
    allocations: { employeeId?: string; employeeName: string; target: number }[],
    updatedStructure?: BranchTotalTargetStructure
  ) => {
    if (updatedStructure) {
      setTargetStructure(updatedStructure);
      try {
        await fetch('/api/target-allocation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetAllocation: updatedStructure }),
        });
      } catch (err) {
        console.log('Saved target allocation locally:', err);
      }
    }

    const updated = records.map((rec) => {
      const match = allocations.find(
        (a) => (a.employeeId && a.employeeId === rec.employeeId) || a.employeeName === rec.employee
      );
      if (match) {
        return enrichSalesRecords([
          {
            ...rec,
            target: match.target,
          },
        ])[0];
      }
      return rec;
    });

    persistRecords(updated);
    showToast(
      language === 'ar'
        ? 'تم تطبيق هيكل التارجت وتوزيعه بنجاح ومزامنته عبر الأجهزة.'
        : 'Applied new target allocations across all devices.'
    );
  };

  const handleSaveRecord = (recordData: {
    id?: string;
    employeeId?: string;
    branch: string;
    employee: string;
    target: number;
    actual: number;
    period?: string;
  }) => {
    if (recordData.id) {
      // Update existing
      const updated = records.map((r) =>
        r.id === recordData.id
          ? enrichSalesRecords([
              {
                id: recordData.id!,
                employeeId: recordData.employeeId,
                branch: recordData.branch,
                employee: recordData.employee,
                target: recordData.target,
                actual: recordData.actual,
                period: recordData.period,
                earnedIncentive: r.earnedIncentive,
                incentiveItems: r.incentiveItems,
              },
            ])[0]
          : r
      );
      persistRecords(updated);
      showToast(
        language === 'ar'
          ? `تم تحديث بيانات الموظف "${recordData.employee}" بنجاح.`
          : `Updated employee "${recordData.employee}".`
      );
    } else {
      // Create new
      const newRec = enrichSalesRecords([
        {
          id: `manual-${Date.now().toString(36)}`,
          employeeId: recordData.employeeId,
          branch: recordData.branch,
          employee: recordData.employee,
          target: recordData.target,
          actual: recordData.actual,
          period: recordData.period,
        },
      ])[0];
      persistRecords([newRec, ...records]);
      showToast(
        language === 'ar'
          ? `تمت إضافة الموظف "${recordData.employee}" بنجاح.`
          : `Added employee "${recordData.employee}".`
      );
    }
  };

  const handleDeleteRecord = (id: string) => {
    const rec = records.find((r) => r.id === id);
    if (!rec) return;

    const confirmMsg =
      language === 'ar'
        ? `هل أنت متأكد من حذف سجل الموظف "${rec.employee}"؟`
        : `Are you sure you want to delete "${rec.employee}"?`;

    if (window.confirm(confirmMsg)) {
      const remaining = records.filter((r) => r.id !== id);
      persistRecords(remaining);
      showToast(
        language === 'ar'
          ? `تم حذف سجل "${rec.employee}".`
          : `Deleted record for "${rec.employee}".`
      );
    }
  };

  const handleResetDemoData = () => {
    const confirmMsg =
      language === 'ar'
        ? 'هل تريد استعادة بيانات فرع راية كونكورد بلازا النموذجية؟'
        : 'Reset to Raya Concorde Plaza branch demo records?';

    if (window.confirm(confirmMsg)) {
      const reset = enrichSalesRecords(INITIAL_SAMPLE_RECORDS);
      persistRecords(reset);
      setSelectedBranch('');
      setSearchQuery('');
      setFilterStatus('all');
      showToast(
        language === 'ar'
          ? 'تمت استعادة بيانات فرع راية كونكورد بلازا.'
          : 'Restored Raya Concorde Plaza branch records.'
      );
    }
  };

  const handleExportFilteredExcel = () => {
    const fileName =
      language === 'ar'
        ? 'تقرير_مبيعات_راية_كونكورد_بلازا.xlsx'
        : 'Raya_Concorde_Plaza_Sales_Report.xlsx';
    exportRecordsToExcel(filteredRecords, fileName, language);
    showToast(
      language === 'ar'
        ? 'تم بدء تحميل ملف التقرير بتنسيق Excel.'
        : 'Exporting Excel report...'
    );
  };

  return (
    <div
      className={`min-h-screen bg-slate-50 text-slate-800 flex flex-col ${
        language === 'ar' ? "font-['Cairo',sans-serif]" : "font-['Plus_Jakarta_Sans',sans-serif]"
      }`}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 ${
            language === 'ar' ? 'left-6' : 'right-6'
          } z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg border border-slate-700 flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-bottom-3 duration-200`}
        >
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {viewMode === 'mobile' ? (
        <AndroidMobileShell
          records={recordsInActivePeriod}
          targetStructure={targetStructure}
          incentiveRules={incentiveRules}
          auditReport={auditReport}
          language={language}
          currency={currency}
          vatDisplayMode={vatDisplayMode}
          onToggleVatMode={() => setVatDisplayMode((prev) => (prev === 'afterVat' ? 'beforeVat' : 'afterVat'))}
          onSwitchToDesktop={() => handleToggleViewMode('desktop')}
          onOpenUploadModal={() => setIsUploadModalOpen(true)}
          onOpenIncentivesModal={() => setIsIncentivesModalOpen(true)}
          onOpenTargetModal={() => setIsTargetModalOpen(true)}
          onOpenMonthlyReportModal={() => setIsMonthlyReportModalOpen(true)}
          onOpenDownloadCenter={() => setIsDownloadCenterOpen(true)}
          onOpenUnifiedPrompt={() => setIsUnifiedPromptModalOpen(true)}
          onOpenInventoryOptimizer={() => setIsInventoryOptimizerOpen(true)}
          onSelectIncentiveRecord={(rec) => setSelectedIncentiveRecord(rec)}
        />
      ) : (
        <>
          {/* Top Navigation */}
          <Navbar
            onOpenUpload={() => setIsUploadModalOpen(true)}
            onOpenIncentives={() => setIsIncentivesModalOpen(true)}
            onOpenTargetAllocation={() => setIsTargetModalOpen(true)}
            onOpenMobileModal={() => setIsMobileModalOpen(true)}
            onOpenMonthlyReport={() => setIsMonthlyReportModalOpen(true)}
            onOpenNotificationCenter={() => setIsNotificationCenterOpen(true)}
            onOpenDownloadCenter={() => setIsDownloadCenterOpen(true)}
            onOpenUnifiedAiPrompt={() => setIsUnifiedPromptModalOpen(true)}
            onOpenInventoryOptimizer={() => setIsInventoryOptimizerOpen(true)}
            activeAlertsCount={activeMilestoneAlerts.length}
            onOpenAddRecord={() => {
              setRecordToEdit(null);
              setIsRecordModalOpen(true);
            }}
            onResetDemoData={handleResetDemoData}
            onDownloadTemplate={() => setIsDownloadCenterOpen(true)}
            currency={currency}
            onCurrencyChange={setCurrency}
            language={language}
            onToggleLanguage={handleToggleLanguage}
            onSwitchToMobile={() => handleToggleViewMode('mobile')}
          />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* 1. Live Real-time Clock, Date & Cross-Device Cloud Sync Bar */}
        <LiveClockAndSync
          language={language}
          lastUpdated={lastUpdated}
          isSyncing={isSyncing}
          onManualSync={handleManualSync}
          onOpenMobileModal={() => setIsMobileModalOpen(true)}
        />

        {/* 1.2. Real-Time Target Push Alerts & Visual Radar Banner */}
        <TargetAlertBanner
          records={recordsInActivePeriod}
          currency={currency}
          language={language}
          settings={notificationSettings}
          onOpenNotificationCenter={() => setIsNotificationCenterOpen(true)}
          onSelectEmployee={(empName) => {
            setSearchQuery(empName);
            const tableEl = document.getElementById('employees-table');
            if (tableEl) tableEl.scrollIntoView({ behavior: 'smooth' });
          }}
          branchOverallRate={overallStats.achievementRate}
        />

        {/* 1.3. Executive Boardroom Presentation Summary Card */}
        <ExecutivePresentationCard
          language={language}
          currency={currency}
          records={recordsInActivePeriod}
          targetStructure={targetStructure}
          onOpenMonthlyReport={() => setIsMonthlyReportModalOpen(true)}
          onOpenDownloadCenter={() => setIsDownloadCenterOpen(true)}
        />

        {/* 1.4. RAYA CORPORATE INVENTORY & SALES OPTIMIZER DASHBOARD (واجهة راية الذكية الرسمية) */}
        <RayaCorporateOptimizerDashboard
          language={language}
          currency={currency}
          targetStructure={targetStructure}
          totalActualSales={overallStats.totalActual}
        />

        {/* 1.5. FAST EXCEL SALES & INCENTIVE SHEETS INSTANT PROCESSING HUB */}
        <FastExcelProcessingHub
          language={language}
          currency={currency}
          records={records}
          incentiveRules={incentiveRules}
          targetStructure={targetStructure}
          onImportSalesRecords={handleImportRecords}
          onImportIncentiveSheet={handleImportIncentiveSheet}
          onImportStockItems={handleImportStockItems}
          onUpdateRecordsWithAudit={handleUpdateRecordsWithAudit}
          auditReport={auditReport}
          onOpenUploadModal={() => setIsUploadModalOpen(true)}
          onOpenIncentivesModal={() => setIsIncentivesModalOpen(true)}
          onOpenMonthlyReport={() => setIsMonthlyReportModalOpen(true)}
          onResetDemoData={handleResetDemoData}
          onOpenUnifiedAiPrompt={() => setIsUnifiedPromptModalOpen(true)}
          vatDisplayMode={vatDisplayMode}
          onToggleVatMode={setVatDisplayMode}
        />

        {/* 2. Branch Manager & Team Spotlight Header with Incentives */}
        <BranchTeamHeader
          language={language}
          currency={currency}
          records={records}
          onOpenIncentives={() => setIsIncentivesModalOpen(true)}
          onSelectEmployeeIncentive={(rec) => setSelectedIncentiveRecord(rec)}
          onOpenMonthlyReport={() => setIsMonthlyReportModalOpen(true)}
        />

        {/* 2.5. Dedicated Month 10 (October - 31 Days) Target & Phasing Banner */}
        <OctoberTargetBanner
          language={language}
          currency={currency}
          records={records}
          targetStructure={targetStructure}
          onOpenTargetAllocation={() => setIsTargetModalOpen(true)}
          onOpenMonthlyReport={() => setIsMonthlyReportModalOpen(true)}
        />

        {/* 2.6. Central Management for Branch Target & Actuals Calculation */}
        <BranchTargetAndActualsManager
          language={language}
          currency={currency}
          records={records}
          targetStructure={targetStructure}
          allocations={currentAllocations}
          onUpdateTargetStructure={(updatedStructure, updatedAllocations) => {
            handleApplyNewTargets(updatedAllocations, updatedStructure);
          }}
          onOpenTargetModal={() => setIsTargetModalOpen(true)}
          onOpenMonthlyReport={() => setIsMonthlyReportModalOpen(true)}
          vatDisplayMode={vatDisplayMode}
          onToggleVatMode={setVatDisplayMode}
        />

        {/* 3. KPI Cards Strip (in EGP / ج.م) */}
        <KpiCards stats={overallStats} currency={currency} language={language} />

        {/* 3.5. Comprehensive All-Time & Period Achievements Command Center Dashboard */}
        <AllAchievementsDashboard
          records={records}
          targetStructure={targetStructure}
          currency={currency}
          language={language}
          vatDisplayMode={vatDisplayMode}
          onToggleVatMode={setVatDisplayMode}
          onSelectEmployee={(empName) => {
            setSearchQuery(empName);
            const tableElem = document.getElementById('employees-table');
            if (tableElem) {
              tableElem.scrollIntoView({ behavior: 'smooth' });
            }
          }}
          onOpenMonthlyReport={() => setIsMonthlyReportModalOpen(true)}
          onOpenIncentives={() => setIsIncentivesModalOpen(true)}
        />

        {/* 4. Branch Performance Curve & Cumulative Trajectory */}
        <BranchPerformanceCurve
          records={records}
          currency={currency}
          language={language}
          activePeriod={selectedPeriod}
          onSelectPeriod={setSelectedPeriod}
        />

        {/* 4.5. Section & Staff Performance Analytics Hub (رسومات بيانية تفاعلية لأداء الأقسام والموظفين) */}
        <SectionAndStaffAnalyticsHub
          records={records}
          targetStructure={targetStructure}
          currency={currency}
          language={language}
          vatDisplayMode={vatDisplayMode}
          onSelectEmployee={(empName) => {
            setSearchQuery(empName);
            const tableElem = document.getElementById('employees-table');
            if (tableElem) {
              tableElem.scrollIntoView({ behavior: 'smooth' });
            }
          }}
          onOpenMonthlyReport={() => setIsMonthlyReportModalOpen(true)}
        />

        {/* 4.8. Concorde Plaza Annual Sales Projection & Cumulative Growth Trajectory (2026) */}
        <ConcordeAnnualProjectionSection
          records={records}
          currency={currency}
          language={language}
          targetStructure={targetStructure}
        />

        {/* 5. Monthly Sales Growth Trend & Forecast Section (in EGP) */}
        <GrowthForecastSection
          records={records}
          currency={currency}
          branches={uniqueBranches}
          language={language}
        />

        {/* 6. Target vs Actual Comparison Chart */}
        <BranchComparisonChart
          branches={branchPerformances}
          currency={currency}
          selectedBranch={selectedBranch}
          onSelectBranch={setSelectedBranch}
          language={language}
        />

        {/* 7. Top Performers Leaderboard */}
        <Leaderboard
          records={records}
          currency={currency}
          language={language}
          onSelectEmployee={(name) => {
            setSearchQuery(name);
            const tableElem = document.getElementById('employees-table');
            if (tableElem) {
              tableElem.scrollIntoView({ behavior: 'smooth' });
            }
          }}
        />

        {/* 8. Filtering and Search Bar */}
        <FiltersBar
          branches={uniqueBranches}
          selectedBranch={selectedBranch}
          onSelectBranch={setSelectedBranch}
          periods={uniquePeriods}
          selectedPeriod={selectedPeriod}
          onSelectPeriod={setSelectedPeriod}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filterStatus={filterStatus}
          onFilterStatusChange={setFilterStatus}
          onResetFilters={() => {
            setSelectedBranch('');
            setSelectedPeriod('');
            setSearchQuery('');
            setFilterStatus('all');
          }}
          onExportExcel={handleExportFilteredExcel}
          filteredCount={filteredRecords.length}
          totalCount={records.length}
          language={language}
        />

        {/* 8.5. Employee Deep Analytics & Efficiency Scoring Center (تحليل الأداء الفردي ونقاط القوة والضعف ومؤشر الكفاءة) */}
        <EmployeeDeepAnalytics
          records={records}
          currency={currency}
          language={language}
          vatDisplayMode={vatDisplayMode}
          onSelectEmployee={(empName) => {
            setSearchQuery(empName);
            const tableElem = document.getElementById('employees-table');
            if (tableElem) {
              tableElem.scrollIntoView({ behavior: 'smooth' });
            }
          }}
          onOpenMonthlyReport={() => setIsMonthlyReportModalOpen(true)}
        />

        {/* 9. Detailed Employees Performance Table with Job ID & Incentives */}
        <PerformanceTable
          records={filteredRecords}
          currency={currency}
          language={language}
          onEditRecord={(record) => {
            setRecordToEdit(record);
            setIsRecordModalOpen(true);
          }}
          onDeleteRecord={handleDeleteRecord}
          onOpenAddRecord={() => {
            setRecordToEdit(null);
            setIsRecordModalOpen(true);
          }}
          onResetFilters={() => {
            setSelectedBranch('');
            setSearchQuery('');
            setFilterStatus('all');
          }}
          onViewIncentive={(record) => setSelectedIncentiveRecord(record)}
        />
      </main>

      {/* Footer */}
      <footer className="mt-16 bg-white border-t border-slate-200 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">{t.footerTitle}</span>
            <span aria-hidden="true">·</span>
            <span>{t.footerSubtext}</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsTargetModalOpen(true)}
              className="hover:text-blue-700 transition-colors flex items-center gap-1 font-medium"
            >
              <Target className="w-3.5 h-3.5 text-blue-600" />
              <span>{language === 'ar' ? 'تقسيم التارجت' : 'Target Split'}</span>
            </button>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => setIsDownloadCenterOpen(true)}
              className="hover:text-emerald-700 transition-colors flex items-center gap-1 font-semibold text-emerald-700 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t.downloadCenterBtn}</span>
            </button>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => setIsIncentivesModalOpen(true)}
              className="hover:text-amber-700 transition-colors flex items-center gap-1 font-medium cursor-pointer"
            >
              <Coins className="w-3.5 h-3.5 text-amber-500" />
              <span>{t.uploadIncentivesBtn}</span>
            </button>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => setIsMonthlyReportModalOpen(true)}
              className="hover:text-purple-700 transition-colors flex items-center gap-1 font-medium text-purple-700 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{t.monthlyReportBtn}</span>
            </button>
            <span aria-hidden="true">·</span>
            <button
              onClick={handleExportFilteredExcel}
              className="hover:text-emerald-700 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>{t.exportData}</span>
            </button>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => setIsUnifiedPromptModalOpen(true)}
              className="hover:text-purple-700 transition-colors flex items-center gap-1 font-bold text-purple-700 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>{language === 'ar' ? 'برومبت توحيد البيانات (AI)' : 'Unified AI Prompt'}</span>
            </button>
          </div>
        </div>
      </footer>
        </>
      )}

      {/* Modals */}
      <MonthlyReportModal
        isOpen={isMonthlyReportModalOpen}
        onClose={() => setIsMonthlyReportModalOpen(false)}
        records={records}
        currency={currency}
        language={language}
        targetStructure={targetStructure}
      />

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onImportRecords={handleImportRecords}
        onImportStockItems={handleImportStockItems}
        language={language}
        onOpenTargetAllocation={() => setIsTargetModalOpen(true)}
        onOpenUnifiedAiPrompt={() => setIsUnifiedPromptModalOpen(true)}
      />

      <TargetAllocationModal
        isOpen={isTargetModalOpen}
        onClose={() => setIsTargetModalOpen(false)}
        language={language}
        currency={currency}
        records={records}
        currentTargetStructure={targetStructure}
        onApplyNewTargets={handleApplyNewTargets}
      />

      <IncentivesModal
        isOpen={isIncentivesModalOpen}
        onClose={() => setIsIncentivesModalOpen(false)}
        rules={incentiveRules}
        onUpdateRules={handleUpdateIncentiveRules}
        currency={currency}
        language={language}
      />

      <IncentiveBreakdownModal
        isOpen={selectedIncentiveRecord !== null}
        onClose={() => setSelectedIncentiveRecord(null)}
        record={selectedIncentiveRecord}
        currency={currency}
        language={language}
      />

      <MobileDeviceModal
        isOpen={isMobileModalOpen}
        onClose={() => setIsMobileModalOpen(false)}
        language={language}
      />

      <RecordModal
        isOpen={isRecordModalOpen}
        onClose={() => {
          setIsRecordModalOpen(false);
          setRecordToEdit(null);
        }}
        onSaveRecord={handleSaveRecord}
        recordToEdit={recordToEdit}
        existingBranches={uniqueBranches}
        currency={currency}
        language={language}
      />

      {/* Target Real-Time Push Alerts & Milestone Radar Modal */}
      <TargetNotificationCenter
        isOpen={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
        records={recordsInActivePeriod}
        currency={currency}
        language={language}
        settings={notificationSettings}
        onUpdateSettings={setNotificationSettings}
        onSelectEmployee={(empName) => {
          setSearchQuery(empName);
          const tableEl = document.getElementById('employees-table');
          if (tableEl) tableEl.scrollIntoView({ behavior: 'smooth' });
        }}
        branchOverallRate={overallStats.achievementRate}
        branchTotalActual={overallStats.totalActual}
        branchTotalTarget={overallStats.totalTarget}
      />

      {/* Official Downloads & Export Center Modal */}
      <ExportAndDownloadCenterModal
        isOpen={isDownloadCenterOpen}
        onClose={() => setIsDownloadCenterOpen(false)}
        records={records}
        language={language}
        currency={currency}
        onOpenMonthlyReport={() => setIsMonthlyReportModalOpen(true)}
      />

      {/* Unified Data Import & AI Formatting Prompt Modal */}
      <UnifiedAiPromptModal
        isOpen={isUnifiedPromptModalOpen}
        onClose={() => setIsUnifiedPromptModalOpen(false)}
        onImportRecords={handleImportRecords}
        currency={currency}
        language={language}
        currentBranchName="فرع راية كونكورد بلازا"
        currentPeriod={selectedPeriod || 'أكتوبر 2026'}
      />

      {/* Instant In-App Download Manager & 1-Click Clipboard Copy Drawer */}
      <DownloadManagerNotification language={language} />

      {/* Smart Inventory & Sales Optimizer Modal (مدير الإمداد والمبيعات الذكي - فرع كونكورد) */}
      <SmartInventoryOptimizerModal
        isOpen={isInventoryOptimizerOpen}
        onClose={() => setIsInventoryOptimizerOpen(false)}
        language={language}
        currency={currency}
      />

      {/* Floating Cross-Device Mobile & Laptop Bar (Desktop mode) */}
      {viewMode === 'desktop' && (
        <DeviceModeFloatingBar
          language={language}
          onOpenMobileModal={() => setIsMobileModalOpen(true)}
          onSwitchToMobile={() => handleToggleViewMode('mobile')}
          isSyncing={isSyncing}
        />
      )}
    </div>
  );
}
