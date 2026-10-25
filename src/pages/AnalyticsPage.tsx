import React, { useState } from 'react';
import {
  TrendingUp,
  BarChart3,
  Clock,
  Layers,
  Sparkles,
  Building2,
  LineChart,
  Boxes,
} from 'lucide-react';
import { useDataStore } from '../store/DataStore';
import {
  selectRecordsInActivePeriod,
  selectBranchPerformancesData,
  selectUniqueBranches,
  selectActiveTargetStructure,
  selectRevenuePaceMetrics,
} from '../store/selectors';
import { BranchPerformanceCurve } from '../components/BranchPerformanceCurve';
import { GrowthForecastSection } from '../components/GrowthForecastSection';
import { ConcordeAnnualProjectionSection } from '../components/ConcordeAnnualProjectionSection';
import { BranchComparisonChart } from '../components/BranchComparisonChart';
import { SalesPeakHeatmap } from '../components/SalesPeakHeatmap';
import { AbcAnalysisSection } from '../components/AbcAnalysisSection';
import { FutureHiringAndExpansionTab } from '../components/FutureHiringAndExpansionTab';
import { RayaCorporateOptimizerDashboard } from '../components/RayaCorporateOptimizerDashboard';
import { SalesForecastingSection } from '../components/SalesForecastingSection';

export const AnalyticsPage: React.FC = () => {
  const { state, dispatch } = useDataStore();
  const [activeTab, setActiveTab] = useState<'growth' | 'forecasting' | 'comparison' | 'heatmap' | 'abc' | 'optimizer'>('forecasting');

  const isAr = state.settings.language === 'ar';
  const currency = state.settings.currency;

  const activeRecords = selectRecordsInActivePeriod(state);
  const branchPerformances = selectBranchPerformancesData(state);
  const branches = selectUniqueBranches(state);
  const targetStructure = selectActiveTargetStructure(state);
  const pace = selectRevenuePaceMetrics(state);

  return (
    <div className="space-y-4" dir={isAr ? 'rtl' : 'ltr'}>
      {/* ── Page Header & Sub-Tabs ── */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Segmented Sub-Tabs */}
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-2xl border border-slate-200/80">
          <button
            onClick={() => setActiveTab('forecasting')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'forecasting'
                ? 'bg-white text-indigo-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LineChart className="w-4 h-4 text-indigo-600" />
            <span>{isAr ? 'التنبؤ بالمبيعات (Forecasting)' : 'Sales Forecasting'}</span>
          </button>

          <button
            onClick={() => setActiveTab('growth')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'growth'
                ? 'bg-white text-indigo-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span>{isAr ? 'النمو والتوقعات السنوية' : 'Growth & Annual Projections'}</span>
          </button>

          <button
            onClick={() => setActiveTab('comparison')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'comparison'
                ? 'bg-white text-indigo-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-blue-600" />
            <span>{isAr ? 'مقارنة الفروع' : 'Branch Comparison'}</span>
          </button>

          <button
            onClick={() => setActiveTab('heatmap')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'heatmap'
                ? 'bg-white text-indigo-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4 text-amber-600" />
            <span>{isAr ? 'أوقات الذروة والمبيعات' : 'Peak Hours Heatmap'}</span>
          </button>

          <button
            onClick={() => setActiveTab('abc')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'abc'
                ? 'bg-white text-indigo-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4 text-purple-600" />
            <span>{isAr ? 'تحليل ABC والتوظيف' : 'ABC Analysis & Hiring'}</span>
          </button>

          <button
            onClick={() => setActiveTab('optimizer')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'optimizer'
                ? 'bg-white text-indigo-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Boxes className="w-4 h-4 text-emerald-600" />
            <span>{isAr ? 'لوحة راية المؤسسية للتحسين' : 'Corporate Optimizer'}</span>
          </button>
        </div>
      </div>

      {/* ── TAB 1: Sales Forecasting (New Dedicated Feature) ── */}
      {activeTab === 'forecasting' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          <SalesForecastingSection
            records={activeRecords}
            currency={currency}
            branches={branches}
            language={state.settings.language}
          />
        </div>
      )}

      {/* ── TAB 2: النمو والتوقعات السنوية ── */}
      {activeTab === 'growth' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          <BranchPerformanceCurve
            records={activeRecords}
            currency={currency}
            language={state.settings.language}
          />

          <GrowthForecastSection
            records={activeRecords}
            currency={currency}
            branches={branches}
            language={state.settings.language}
          />

          <ConcordeAnnualProjectionSection
            records={activeRecords}
            currency={currency}
            language={state.settings.language}
            targetStructure={targetStructure}
          />
        </div>
      )}

      {/* ── TAB 3: مقارنة الفروع ── */}
      {activeTab === 'comparison' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <BranchComparisonChart
            branches={branchPerformances}
            currency={currency}
            selectedBranch={state.selectedBranch}
            onSelectBranch={(b) => dispatch({ type: 'SET_BRANCH', payload: b })}
            language={state.settings.language}
          />
        </div>
      )}

      {/* ── TAB 4: أوقات الذروة والمبيعات الحرارية ── */}
      {activeTab === 'heatmap' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <SalesPeakHeatmap
            records={activeRecords}
            currency={currency}
            language={state.settings.language}
            branchName={state.selectedBranch || 'فرع راية كونكورد بلازا'}
          />
        </div>
      )}

      {/* ── TAB 5: تحليل ABC والتوظيف ── */}
      {activeTab === 'abc' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          <AbcAnalysisSection
            records={activeRecords}
            currency={currency}
            language={state.settings.language}
            targetStructure={targetStructure}
          />

          <FutureHiringAndExpansionTab
            records={activeRecords}
            currency={currency}
            language={state.settings.language}
            targetStructure={targetStructure}
            annualProjectedRevenue={pace.forecastMonthEnd * 12}
          />
        </div>
      )}

      {/* ── TAB 6: لوحة راية المؤسسية للتحسين ── */}
      {activeTab === 'optimizer' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <RayaCorporateOptimizerDashboard
            language={state.settings.language}
            currency={currency}
            targetStructure={targetStructure}
            totalActualSales={pace.effectiveTotalActual}
            items={state.inventoryItems}
            onUpdateItems={(items) => dispatch({ type: 'SET_INVENTORY_ITEMS', payload: items })}
          />
        </div>
      )}
    </div>
  );
};

export default AnalyticsPage;
