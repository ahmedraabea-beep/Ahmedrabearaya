import React, { useState } from 'react';
import {
  Target,
  Sliders,
  TrendingUp,
  Layers,
  Sparkles,
  Users,
  AlertCircle,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { useDataStore } from '../store/DataStore';
import {
  selectActiveTargetStructure,
  selectRecordsInActivePeriod,
  selectRevenuePaceMetrics,
} from '../store/selectors';
import { BranchTargetAndActualsManager } from '../components/BranchTargetAndActualsManager';
import { BranchTargetBreakdownCard } from '../components/BranchTargetBreakdownCard';
import { TargetAllocationModal } from '../components/TargetAllocationModal';
import { OctoberTargetBanner } from '../components/OctoberTargetBanner';
import { TargetAlertBanner } from '../components/TargetAlertBanner';
import { BranchTotalTargetStructure } from '../types/sales';

interface TargetsPageProps {
  onOpenMonthlyReport?: () => void;
  onOpenNotificationCenter?: () => void;
}

export const TargetsPage: React.FC<TargetsPageProps> = ({
  onOpenMonthlyReport,
  onOpenNotificationCenter,
}) => {
  const { state, dispatch } = useDataStore();
  const [activeTab, setActiveTab] = useState<'manager' | 'breakdown' | 'radar'>('manager');
  const [isAllocationModalOpen, setIsAllocationModalOpen] = useState(false);

  const isAr = state.settings.language === 'ar';
  const currency = state.settings.currency;

  const targetStructure = selectActiveTargetStructure(state);
  const activeRecords = selectRecordsInActivePeriod(state);
  const pace = selectRevenuePaceMetrics(state);

  const allocations = Array.isArray(state.targetAllocation) && state.targetAllocation.length > 0 ? state.targetAllocation : [
    { employeeId: '140729', employeeName: 'أحمد ربيع سيد', percentage: 40, targetAmount: 560000 },
    { employeeId: '41308', employeeName: 'عمرو عبد الحليم', percentage: 35, targetAmount: 490000 },
    { employeeId: '125177', employeeName: 'طارق محمود', percentage: 25, targetAmount: 350000 },
  ];

  const handleUpdateTargets = (
    updatedStructure: BranchTotalTargetStructure,
    updatedAllocations: { employeeId?: string; employeeName: string; target: number }[]
  ) => {
    // 1. Update structure in store
    dispatch({
      type: 'SET_TARGET_STRUCTURE',
      payload: { period: state.selectedPeriod, structure: updatedStructure },
    });

    // 2. Update individual record targets
    const updatedRecords = state.records.map((rec) => {
      const match = updatedAllocations.find(
        (a) => a.employeeName === rec.employee || (a.employeeId && a.employeeId === rec.employeeId)
      );
      if (match && (!rec.period || rec.period === state.selectedPeriod)) {
        const newTarget = match.target;
        return {
          ...rec,
          target: newTarget,
          achievementRate: newTarget > 0 ? (rec.actual / newTarget) * 100 : 0,
          difference: rec.actual - newTarget,
          isAchieved: rec.actual >= newTarget,
        };
      }
      return rec;
    });

    dispatch({ type: 'SET_RECORDS', payload: updatedRecords });
  };

  const handleApplyNewTargets = (
    newAllocations: { employeeId?: string; employeeName: string; target: number }[],
    updatedStructure?: BranchTotalTargetStructure
  ) => {
    if (updatedStructure) {
      handleUpdateTargets(updatedStructure, newAllocations);
    } else {
      handleUpdateTargets(targetStructure, newAllocations);
    }
    setIsAllocationModalOpen(false);
  };

  return (
    <div className="space-y-4" dir={isAr ? 'rtl' : 'ltr'}>
      {/* ── Page Header & Tabs ── */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Sub-Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl border border-slate-200/80">
          <button
            onClick={() => setActiveTab('manager')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'manager'
                ? 'bg-white text-purple-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Target className="w-4 h-4 text-purple-600" />
            <span>{isAr ? 'مدير الأهداف والمحقق الفعلي' : 'Target & Actuals Manager'}</span>
          </button>

          <button
            onClick={() => setActiveTab('breakdown')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'breakdown'
                ? 'bg-white text-purple-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-4 h-4 text-blue-600" />
            <span>{isAr ? 'توزيع الأهداف على المستشارين' : 'Staff Target Allocation'}</span>
          </button>

          <button
            onClick={() => setActiveTab('radar')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'radar'
                ? 'bg-white text-purple-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span>{isAr ? 'رادار الإنجاز والـ Milestones' : 'Milestones Radar'}</span>
          </button>
        </div>

        {/* Action Button */}
        <button
          onClick={() => setIsAllocationModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
        >
          <Sliders className="w-4 h-4" />
          <span>{isAr ? 'تعديل التارجت بالنسبة/الأقدمية' : 'Adjust Target Engine'}</span>
        </button>
      </div>

      {/* ── TAB 1: مدير الأهداف والمحقق الفعلي ── */}
      {activeTab === 'manager' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <BranchTargetAndActualsManager
            language={state.settings.language}
            currency={currency}
            records={activeRecords}
            targetStructure={targetStructure}
            allocations={allocations}
            onUpdateTargetStructure={handleUpdateTargets}
            onOpenTargetModal={() => setIsAllocationModalOpen(true)}
            onOpenMonthlyReport={onOpenMonthlyReport || (() => {})}
            vatDisplayMode={state.settings.vatDisplayMode}
            onToggleVatMode={(mode) =>
              dispatch({ type: 'UPDATE_SETTINGS', payload: { vatDisplayMode: mode } })
            }
          />
        </div>
      )}

      {/* ── TAB 2: توزيع الأهداف ── */}
      {activeTab === 'breakdown' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <BranchTargetBreakdownCard
            language={state.settings.language}
            currency={currency}
            targetStructure={targetStructure}
            allocations={allocations}
            onOpenTargetModal={() => setIsAllocationModalOpen(true)}
          />

          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                {isAr ? 'محرك التوزيع الذكي (بالتساوي / بالأنصبة / بالأقدمية)' : 'Smart Allocation Engine'}
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                {isAr
                  ? 'إعادة تقسيم الـ 1,400,000 ج.م ريفينيو على فريق العمل بنسب مئوية أو مبالغ محددة'
                  : 'Distribute target across staff with proportional rules'}
              </p>
            </div>

            <button
              onClick={() => setIsAllocationModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
            >
              {isAr ? 'فتح محرك التقسيم' : 'Open Engine'}
            </button>
          </div>
        </div>
      )}

      {/* ── TAB 3: رادار الإنجاز والـ Milestones ── */}
      {activeTab === 'radar' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <OctoberTargetBanner
            language={state.settings.language}
            currency={currency}
            records={activeRecords}
            targetStructure={targetStructure}
            onOpenTargetAllocation={() => setIsAllocationModalOpen(true)}
            onOpenMonthlyReport={() => {
              window.location.hash = '#/reports';
            }}
          />

          <TargetAlertBanner
            records={activeRecords}
            currency={currency}
            language={state.settings.language}
            settings={state.notificationSettings}
            onOpenNotificationCenter={onOpenNotificationCenter || (() => {})}
            onSelectEmployee={() => {}}
            branchOverallRate={pace.grandAchievementRate}
          />
        </div>
      )}

      {/* ── Allocation Engine Modal ── */}
      <TargetAllocationModal
        isOpen={isAllocationModalOpen}
        onClose={() => setIsAllocationModalOpen(false)}
        language={state.settings.language}
        currency={currency}
        records={activeRecords}
        currentTargetStructure={targetStructure}
        onApplyNewTargets={handleApplyNewTargets}
      />
    </div>
  );
};
