import React, { useState, useEffect } from 'react';
import { DataStoreProvider, useDataStore } from './store/DataStore';
import { useHashRouter } from './components/layout/useHashRouter';
import { MainAppLayout } from './components/layout/MainAppLayout';
import { translations } from './utils/i18n';
import { SalesRecord } from './types/sales';
import { CONCORD_BRANCH_NAME } from './data/sampleData';
import { mergeIncentiveDataIntoSalesRecords } from './utils/excelParser';

// Modals
import { RecordModal } from './components/RecordModal';
import { UploadModal } from './components/UploadModal';
import { MonthlyReportModal } from './components/MonthlyReportModal';
import { ExportAndDownloadCenterModal } from './components/ExportAndDownloadCenterModal';
import { UnifiedAiPromptModal } from './components/UnifiedAiPromptModal';
import { TargetNotificationCenter } from './components/TargetNotificationCenter';
import { IncentivesModal } from './components/IncentivesModal';
import { IncentiveBreakdownModal } from './components/IncentiveBreakdownModal';
import { TargetAllocationModal } from './components/TargetAllocationModal';
import { DownloadManagerNotification } from './components/DownloadManagerNotification';
import { ErrorBoundary, PageErrorBoundary } from './components/ErrorBoundary';

// Pages
import { DashboardPage } from './pages/DashboardPage';
import { SalesPage } from './pages/SalesPage';
import { TargetsPage } from './pages/TargetsPage';
import { StaffPage } from './pages/StaffPage';
import { IncentivesPage } from './pages/IncentivesPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { InventoryPage } from './pages/InventoryPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';

function AppContent() {
  const { state, dispatch, saveStoreNow } = useDataStore();
  const { currentRoute, navigate } = useHashRouter();
  const { language, currency, vatDisplayMode } = state.settings;
  const t = translations[language];



  // Global Quick Action Modals
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [recordToEdit, setRecordToEdit] = useState<SalesRecord | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isMonthlyReportModalOpen, setIsMonthlyReportModalOpen] = useState(false);
  const [isDownloadCenterOpen, setIsDownloadCenterOpen] = useState(false);
  const [isUnifiedPromptModalOpen, setIsUnifiedPromptModalOpen] = useState(false);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);
  const [isIncentivesModalOpen, setIsIncentivesModalOpen] = useState(false);
  const [selectedIncentiveRecord, setSelectedIncentiveRecord] = useState<SalesRecord | null>(null);
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);

  // Sync document title and direction
  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    document.title = `${t.appName} - ${t.appSubtitle}`;
  }, [language, t]);



  const handleSaveRecord = (data: {
    id?: string;
    employeeId?: string;
    branch: string;
    employee: string;
    target: number;
    actual: number;
    period?: string;
  }) => {
    const rate = data.target > 0 ? (data.actual / data.target) * 100 : 0;
    const enriched: SalesRecord = {
      id: data.id || recordToEdit?.id || `rec_${Date.now()}`,
      employeeId: data.employeeId || recordToEdit?.employeeId || '140729',
      employee: data.employee,
      branch: data.branch,
      target: data.target,
      actual: data.actual,
      period: data.period || state.selectedPeriod,
      achievementRate: Number(rate.toFixed(1)),
      difference: data.actual - data.target,
      isAchieved: data.actual >= data.target,
      actualAfterVat: data.actual,
      actualBeforeVat: Number((data.actual / 1.14).toFixed(0)),
      vatAmount: Number((data.actual - data.actual / 1.14).toFixed(0)),
    };

    if (recordToEdit) {
      dispatch({ type: 'UPDATE_RECORD', payload: enriched });
    } else {
      dispatch({ type: 'ADD_RECORD', payload: enriched });
    }
    saveStoreNow();
    setIsRecordModalOpen(false);
    setRecordToEdit(null);
  };

  const handleImportRecords = (newRecords: SalesRecord[], mode: 'replace' | 'append') => {
    if (mode === 'replace') {
      dispatch({ type: 'SET_RECORDS', payload: newRecords });
    } else {
      newRecords.forEach((r) => dispatch({ type: 'ADD_RECORD', payload: r }));
    }
    saveStoreNow();
  };

  const currentPeriodTarget =
    state.targets[state.selectedPeriod] ||
    state.targets['2026-10'] ||
    Object.values(state.targets)[0];

  // Route renderer mapping with isolated PageErrorBoundary for each of the 9 pages
  const renderCurrentPage = () => {
    switch (currentRoute) {
      case '/':
        return (
          <PageErrorBoundary pageName="Dashboard" pageNameAr="لوحة التحكم التنفيذية">
            <DashboardPage
              onOpenUpload={() => setIsUploadModalOpen(true)}
              onOpenAddRecord={() => {
                setRecordToEdit(null);
                setIsRecordModalOpen(true);
              }}
              onOpenMonthlyReport={() => setIsMonthlyReportModalOpen(true)}
              onOpenExport={() => setIsDownloadCenterOpen(true)}
            />
          </PageErrorBoundary>
        );
      case '/sales':
        return (
          <PageErrorBoundary pageName="Sales" pageNameAr="سجل المبيعات والعمليات">
            <SalesPage
              onOpenAddRecord={() => {
                setRecordToEdit(null);
                setIsRecordModalOpen(true);
              }}
              onEditRecord={(rec: SalesRecord) => {
                setRecordToEdit(rec);
                setIsRecordModalOpen(true);
              }}
            />
          </PageErrorBoundary>
        );
      case '/targets':
        return (
          <PageErrorBoundary pageName="Targets" pageNameAr="مدير الأهداف والمحقق الفعلي">
            <TargetsPage />
          </PageErrorBoundary>
        );
      case '/staff':
        return (
          <PageErrorBoundary pageName="Staff" pageNameAr="فريق العمل ومستشاري المبيعات">
            <StaffPage
              onSelectEmployeeIncentive={(rec: SalesRecord) => setSelectedIncentiveRecord(rec)}
            />
          </PageErrorBoundary>
        );
      case '/incentives':
        return (
          <PageErrorBoundary pageName="Incentives" pageNameAr="حوافز وعمولات راية">
            <IncentivesPage />
          </PageErrorBoundary>
        );
      case '/analytics':
        return (
          <PageErrorBoundary pageName="Analytics" pageNameAr="التحليلات ومؤشرات الأداء">
            <AnalyticsPage />
          </PageErrorBoundary>
        );
      case '/inventory':
        return (
          <PageErrorBoundary pageName="Inventory" pageNameAr="إدارة المخزون والأرصدة">
            <InventoryPage />
          </PageErrorBoundary>
        );
      case '/reports':
        return (
          <PageErrorBoundary pageName="Reports" pageNameAr="التقارير الشهرية والتنفيذية">
            <ReportsPage />
          </PageErrorBoundary>
        );
      case '/settings':
        return (
          <PageErrorBoundary pageName="Settings" pageNameAr="إعدادات المنظومة وتوحيد البيانات">
            <SettingsPage />
          </PageErrorBoundary>
        );
      default:
        return (
          <PageErrorBoundary pageName="Dashboard" pageNameAr="لوحة التحكم التنفيذية">
            <DashboardPage
              onOpenUpload={() => setIsUploadModalOpen(true)}
              onOpenAddRecord={() => {
                setRecordToEdit(null);
                setIsRecordModalOpen(true);
              }}
              onOpenMonthlyReport={() => setIsMonthlyReportModalOpen(true)}
              onOpenExport={() => setIsDownloadCenterOpen(true)}
            />
          </PageErrorBoundary>
        );
    }
  };

  return (
    <MainAppLayout
      onOpenUpload={() => setIsUploadModalOpen(true)}
      onOpenAddRecord={() => {
        setRecordToEdit(null);
        setIsRecordModalOpen(true);
      }}
      onOpenMonthlyReport={() => setIsMonthlyReportModalOpen(true)}
      onOpenExport={() => setIsDownloadCenterOpen(true)}
      onOpenNotificationCenter={() => setIsNotificationCenterOpen(true)}
      onOpenMobileModal={() => setIsMobileModalOpen(true)}
      onOpenUnifiedPrompt={() => setIsUnifiedPromptModalOpen(true)}
    >
      {/* Active Page View */}
      {renderCurrentPage()}

      {/* Shared Global Modals */}
      <RecordModal
        isOpen={isRecordModalOpen}
        onClose={() => {
          setIsRecordModalOpen(false);
          setRecordToEdit(null);
        }}
        onSaveRecord={handleSaveRecord}
        recordToEdit={recordToEdit}
        existingBranches={[CONCORD_BRANCH_NAME]}
        currency={currency}
        language={language}
      />

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onImportRecords={handleImportRecords}
        onImportStockItems={(items) => {
          dispatch({ type: 'SET_INVENTORY_ITEMS', payload: items });
          saveStoreNow();
        }}
        onImportIncentiveSheet={(res) => {
          if (res.productRules && res.productRules.length > 0) {
            dispatch({ type: 'SET_INCENTIVE_RULES', payload: res.productRules });
          }
          const merged = mergeIncentiveDataIntoSalesRecords(state.records, res);
          dispatch({ type: 'SET_RECORDS', payload: merged.updatedRecords });
          saveStoreNow();
        }}
        language={language}
        onOpenTargetAllocation={() => navigate('/targets')}
        onOpenUnifiedAiPrompt={() => setIsUnifiedPromptModalOpen(true)}
      />

      <MonthlyReportModal
        isOpen={isMonthlyReportModalOpen}
        onClose={() => setIsMonthlyReportModalOpen(false)}
        records={state.records}
        currency={currency}
        language={language}
        targetStructure={currentPeriodTarget}
      />

      <ExportAndDownloadCenterModal
        isOpen={isDownloadCenterOpen}
        onClose={() => setIsDownloadCenterOpen(false)}
        records={state.records}
        language={language}
        currency={currency}
        onOpenMonthlyReport={() => {
          setIsDownloadCenterOpen(false);
          setIsMonthlyReportModalOpen(true);
        }}
      />

      <UnifiedAiPromptModal
        isOpen={isUnifiedPromptModalOpen}
        onClose={() => setIsUnifiedPromptModalOpen(false)}
        onImportRecords={handleImportRecords}
        currency={currency}
        language={language}
        currentBranchName={CONCORD_BRANCH_NAME}
        currentPeriod={state.selectedPeriod}
      />

      <TargetNotificationCenter
        isOpen={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
        records={state.records}
        currency={currency}
        language={language}
        settings={state.notificationSettings}
        onUpdateSettings={(s) => {
          dispatch({ type: 'SET_NOTIFICATION_SETTINGS', payload: s });
          saveStoreNow();
        }}
        onSelectEmployee={() => {
          setIsNotificationCenterOpen(false);
          navigate('/staff');
        }}
      />



      <IncentivesModal
        isOpen={isIncentivesModalOpen}
        onClose={() => setIsIncentivesModalOpen(false)}
        rules={state.incentiveRules}
        onUpdateRules={(rules) => {
          dispatch({ type: 'SET_INCENTIVE_RULES', payload: rules });
          saveStoreNow();
        }}
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

      <TargetAllocationModal
        isOpen={isTargetModalOpen}
        onClose={() => setIsTargetModalOpen(false)}
        language={language}
        currency={currency}
        records={state.records}
        currentTargetStructure={currentPeriodTarget}
        onApplyNewTargets={(allocations, newStructure) => {
          if (newStructure) {
            dispatch({
              type: 'SET_TARGETS',
              payload: { ...state.targets, [state.selectedPeriod]: newStructure },
            });
          }
          saveStoreNow();
          setIsTargetModalOpen(false);
        }}
      />

      <DownloadManagerNotification language={language} />
    </MainAppLayout>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <DataStoreProvider>
        <AppContent />
      </DataStoreProvider>
    </ErrorBoundary>
  );
}
