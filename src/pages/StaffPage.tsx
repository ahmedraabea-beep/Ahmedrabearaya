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
  CheckCircle2,
} from 'lucide-react';
import { useDataStore } from '../store/DataStore';
import { selectRecordsInActivePeriod, selectActiveTargetStructure } from '../store/selectors';
import { Leaderboard } from '../components/Leaderboard';
import { BranchTeamHeader } from '../components/BranchTeamHeader';
import { EmployeeDeepAnalytics } from '../components/EmployeeDeepAnalytics';
import { SectionAndStaffAnalyticsHub } from '../components/SectionAndStaffAnalyticsHub';
import { StaffAttritionAndRetentionTab } from '../components/StaffAttritionAndRetentionTab';
import { SalesRecord } from '../types/sales';
import { formatCurrencyNumber } from '../utils/calculations';

interface StaffPageProps {
  onOpenMonthlyReport?: () => void;
  onSelectEmployeeIncentive?: (rec: SalesRecord) => void;
}

export const StaffPage: React.FC<StaffPageProps> = ({ onOpenMonthlyReport, onSelectEmployeeIncentive }) => {
  const { state } = useDataStore();
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'deepAnalytics' | 'swot' | 'shifts' | 'retention'>('leaderboard');

  const isAr = state.settings.language === 'ar';
  const currency = state.settings.currency;
  const activeRecords = selectRecordsInActivePeriod(state);
  const targetStructure = selectActiveTargetStructure(state);

  return (
    <div className="space-y-4 select-none" dir={isAr ? 'rtl' : 'ltr'}>
      {/* ── Page Header & Sub-Tabs ── */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Segmented Sub-Tabs */}
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-2xl border border-slate-200">
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'leaderboard'
                ? 'bg-white text-blue-700 shadow-xs'
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
                ? 'bg-white text-blue-700 shadow-xs'
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
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Compass className="w-4 h-4 text-purple-600" />
            <span>{isAr ? 'نقاط القوة والأداء (SWOT)' : 'SWOT Analysis'}</span>
          </button>

          <button
            onClick={() => setActiveTab('shifts')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'shifts'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-4 h-4 text-orange-600" />
            <span>{isAr ? 'جدول الشيفتات والدوام' : 'Roster & Shifts'}</span>
          </button>

          <button
            onClick={() => setActiveTab('retention')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'retention'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4 text-teal-600" />
            <span>{isAr ? 'الاحتفاظ بفريق العمل' : 'Staff Retention'}</span>
          </button>
        </div>
      </div>

      {/* ── TAB 1: لوحة الشرف ── */}
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

      {/* ── TAB 2: التحليل العميق ── */}
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
        </div>
      )}

      {/* ── TAB 3: نقاط القوة SWOT ── */}
      {activeTab === 'swot' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Compass className="w-5 h-5 text-purple-600" />
            <h3 className="text-base font-bold text-slate-900">
              {isAr ? 'تحليل نقاط القوة والتميز لفريق كونكورد بلازا' : 'Staff Strengths & Performance SWOT'}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2">
              <span className="font-bold text-emerald-900 block flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{isAr ? 'نقاط القوة (Strengths)' : 'Strengths'}</span>
              </span>
              <p className="text-slate-700 leading-relaxed">
                {isAr
                  ? 'تجاوز مستشاري المبيعات لخطوط التارجت بنسب إنجاز مرتفعة، وجودة مطابقة السجلات المعتمدة بنسبة 100% بدون أي أخطاء حسابية.'
                  : 'High target achievement rates across advisors with 100% reconciliation accuracy.'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-2">
              <span className="font-bold text-blue-900 block flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>{isAr ? 'الفرص المتاحة (Opportunities)' : 'Opportunities'}</span>
              </span>
              <p className="text-slate-700 leading-relaxed">
                {isAr
                  ? 'تركيز أعلى على إكسسوارات الهواتف وأجهزة المنزل الذكي لرفع متوسط قيمة الفاتورة وزيادة الحوافز الإضافية.'
                  : 'Focus on accessory attachment rates to increase average basket size.'}
              </p>
            </div>
          </div>
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
                : 'Manage morning, evening, and peak shift allocations.'}
            </p>
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
    </div>
  );
};

export default StaffPage;
