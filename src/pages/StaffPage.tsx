import React, { useState } from 'react';
import {
  Users,
  Trophy,
  BarChart3,
  Compass,
  Calendar,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Layers,
} from 'lucide-react';
import { useDataStore } from '../store/DataStore';
import { selectRecordsInActivePeriod, selectActiveTargetStructure } from '../store/selectors';
import { Leaderboard } from '../components/Leaderboard';
import { BranchTeamHeader } from '../components/BranchTeamHeader';
import { EmployeeDeepAnalytics } from '../components/EmployeeDeepAnalytics';
import { SectionAndStaffAnalyticsHub } from '../components/SectionAndStaffAnalyticsHub';
import { AllAchievementsDashboard } from '../components/AllAchievementsDashboard';
import { StaffPerformanceSwotComparison } from '../components/StaffPerformanceSwotComparison';
import { ShiftManagementRosterModal } from '../components/ShiftManagementRosterModal';
import { StaffAttritionAndRetentionTab } from '../components/StaffAttritionAndRetentionTab';

import { SalesRecord } from '../types/sales';

interface StaffPageProps {
  onOpenMonthlyReport?: () => void;
  onSelectEmployeeIncentive?: (rec: SalesRecord) => void;
}

export const StaffPage: React.FC<StaffPageProps> = ({ onOpenMonthlyReport, onSelectEmployeeIncentive }) => {
  const { state } = useDataStore();
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'deepAnalytics' | 'swot' | 'shifts' | 'retention'>('leaderboard');
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);

  const isAr = state.settings.language === 'ar';
  const currency = state.settings.currency;
  const activeRecords = selectRecordsInActivePeriod(state);
  const targetStructure = selectActiveTargetStructure(state);

  return (
    <div className="space-y-4" dir={isAr ? 'rtl' : 'ltr'}>
      {/* ── Page Header & Sub-Tabs ── */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Segmented Sub-Tabs */}
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-2xl border border-slate-200/80">
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'leaderboard'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>{isAr ? 'لوحة الشرف والترتيب' : 'Leaderboard'}</span>
          </button>

          <button
            onClick={() => setActiveTab('deepAnalytics')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'deepAnalytics'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-blue-600" />
            <span>{isAr ? 'التحليل المعمق للموظف' : 'Deep Analytics'}</span>
          </button>

          <button
            onClick={() => setActiveTab('swot')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'swot'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Compass className="w-4 h-4 text-purple-600" />
            <span>{isAr ? 'مقارنة SWOT' : 'SWOT Comparison'}</span>
          </button>

          <button
            onClick={() => setActiveTab('shifts')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'shifts'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-4 h-4 text-orange-600" />
            <span>{isAr ? 'جدول الشيفتات' : 'Roster & Shifts'}</span>
          </button>

          <button
            onClick={() => setActiveTab('retention')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'retention'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            <span>{isAr ? 'الاحتفاظ والدوران' : 'Retention & Attrition'}</span>
          </button>
        </div>

        {/* Shift Modal Button */}
        <button
          onClick={() => setIsShiftModalOpen(true)}
          className="px-3 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
        >
          <Calendar className="w-4 h-4" />
          <span>{isAr ? 'فتح نافذة الشيفتات المنبثقة' : 'Shift Popup'}</span>
        </button>
      </div>

      {/* ── TAB 1: لوحة الشرف وترتيب المستشارين ── */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <BranchTeamHeader
            records={activeRecords}
            currency={currency}
            language={state.settings.language}
            onOpenIncentives={() => {
              window.location.hash = '#/incentives';
            }}
            onSelectEmployeeIncentive={(rec) => {
              if (onSelectEmployeeIncentive) onSelectEmployeeIncentive(rec);
            }}
            onOpenMonthlyReport={onOpenMonthlyReport}
          />
          <Leaderboard
            records={activeRecords}
            currency={currency}
            onSelectEmployee={() => setActiveTab('deepAnalytics')}
            language={state.settings.language}
          />
        </div>
      )}

      {/* ── TAB 2: التحليل العميق والإنتاجية ── */}
      {activeTab === 'deepAnalytics' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          <EmployeeDeepAnalytics
            records={activeRecords}
            currency={currency}
            language={state.settings.language}
            vatDisplayMode={state.settings.vatDisplayMode}
            onOpenMonthlyReport={onOpenMonthlyReport}
          />

          <SectionAndStaffAnalyticsHub
            records={activeRecords}
            targetStructure={targetStructure}
            currency={currency}
            language={state.settings.language}
            vatDisplayMode={state.settings.vatDisplayMode}
          />

          <AllAchievementsDashboard
            records={activeRecords}
            targetStructure={targetStructure}
            currency={currency}
            language={state.settings.language}
            vatDisplayMode={state.settings.vatDisplayMode}
          />
        </div>
      )}

      {/* ── TAB 3: مقارنة SWOT ── */}
      {activeTab === 'swot' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <StaffPerformanceSwotComparison
            records={activeRecords}
            currency={currency}
            language={state.settings.language}
            vatDisplayMode={state.settings.vatDisplayMode}
          />
        </div>
      )}

      {/* ── TAB 4: جدول الشيفتات ── */}
      {activeTab === 'shifts' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs text-center space-y-3">
            <Calendar className="w-10 h-10 text-orange-500 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">
              {isAr ? 'نظام إدارة الشيفتات وجدول الدوام اليومي' : 'Roster & Shift Management System'}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {isAr
                ? 'توزيع أوقات العمل الصباحية والمسائية لمستشاري المبيعات، ومطابقة ساعات الذروة وتصدير الإكسيل والواتساب.'
                : 'Manage morning, evening, and peak shift allocations with WhatsApp sharing.'}
            </p>
            <button
              onClick={() => setIsShiftModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
            >
              {isAr ? 'فتح جدول الشيفتات والتحكم الكامل' : 'Open Shift Roster Interface'}
            </button>
          </div>
        </div>
      )}

      {/* ── TAB 5: الاحتفاظ والدوران ── */}
      {activeTab === 'retention' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <StaffAttritionAndRetentionTab
            records={activeRecords}
            currency={currency}
            language={state.settings.language}
          />
        </div>
      )}

      {/* ── Shift Management Modal ── */}
      <ShiftManagementRosterModal
        isOpen={isShiftModalOpen}
        onClose={() => setIsShiftModalOpen(false)}
        records={activeRecords}
        currency={currency}
        language={state.settings.language}
      />
    </div>
  );
};
