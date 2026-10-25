import React, { useState } from 'react';
import {
  Award,
  Coins,
  TrendingUp,
  FileSpreadsheet,
  Plus,
  Users,
  CheckCircle2,
  Sparkles,
  Download,
  Upload,
} from 'lucide-react';
import { useDataStore } from '../store/DataStore';
import { selectRecordsInActivePeriod } from '../store/selectors';
import { IncentivesModal } from '../components/IncentivesModal';
import { IncentiveBreakdownModal } from '../components/IncentiveBreakdownModal';
import { EmployeeIncentiveProjectionTab } from '../components/EmployeeIncentiveProjectionTab';
import { SalesRecord, ProductIncentiveRule } from '../types/sales';
import { formatCurrencyNumber } from '../utils/calculations';

export const IncentivesPage: React.FC = () => {
  const { state, dispatch } = useDataStore();
  const [activeTab, setActiveTab] = useState<'rules' | 'calculator' | 'projection'>('rules');

  // Modal state
  const [isIncentivesModalOpen, setIsIncentivesModalOpen] = useState(false);
  const [selectedRecordForBreakdown, setSelectedRecordForBreakdown] = useState<SalesRecord | null>(null);

  const isAr = state.settings.language === 'ar';
  const currency = state.settings.currency;
  const activeRecords = selectRecordsInActivePeriod(state);

  const handleUpdateRules = (newRules: ProductIncentiveRule[]) => {
    dispatch({ type: 'SET_INCENTIVE_RULES', payload: newRules });
  };

  return (
    <div className="space-y-4" dir={isAr ? 'rtl' : 'ltr'}>
      {/* ── Page Header & Sub-Tabs ── */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Segmented Sub-Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl border border-slate-200/80">
          <button
            onClick={() => setActiveTab('rules')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'rules'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Coins className="w-4 h-4 text-emerald-600" />
            <span>{isAr ? 'قواعد وبنود الحوافز المؤسسية' : 'Corporate Incentive Rules'}</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full font-mono">
              {state.incentiveRules.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('calculator')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'calculator'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Award className="w-4 h-4 text-amber-500" />
            <span>{isAr ? 'حاسبة استحقاق الموظف وتفاصيل الصرف' : 'Employee Payout Calculator'}</span>
          </button>

          <button
            onClick={() => setActiveTab('projection')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'projection'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <span>{isAr ? 'التوقعات الشهرية للحوافز والشرائح' : 'Monthly Tier Projections'}</span>
          </button>
        </div>

        {/* Action Button */}
        <button
          onClick={() => setIsIncentivesModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
        >
          <Coins className="w-4 h-4" />
          <span>{isAr ? 'إدارة القواعد في نافذة مستقلة' : 'Manage Rules Modal'}</span>
        </button>
      </div>

      {/* ── TAB 1: قواعد الحوافز ── */}
      {activeTab === 'rules' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {isAr ? 'جدول حوافز المنتجات والخدمات المعتمد (OCT Incentive)' : 'Approved Product Incentive Rules'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isAr
                    ? 'الحوافز المكتسبة لكل صنف مباع طبقاً لسياسة شركة راية للتجارة والتوزيع'
                    : 'Earned bonuses per SKU or service sold'}
                </p>
              </div>

              <button
                onClick={() => setIsIncentivesModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isAr ? 'إضافة قاعدة جديدة' : 'Add Rule'}</span>
              </button>
            </div>

            {/* Rules Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right border-collapse">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3">{isAr ? 'اسم المنتج / فئة الخدمة' : 'Product / Category'}</th>
                    <th className="p-3">{isAr ? 'نوع الحافز' : 'Type'}</th>
                    <th className="p-3">{isAr ? 'قيمة الحافز المستحق' : 'Incentive Value'}</th>
                    <th className="p-3">{isAr ? 'الحد الأدنى' : 'Min Qty'}</th>
                    <th className="p-3">{isAr ? 'ملاحظات الصرف' : 'Notes'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {state.incentiveRules.map((rule) => (
                    <tr key={rule.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-bold text-slate-800">{rule.productCategory}</td>
                      <td className="p-3 text-slate-600">
                        {rule.incentiveType === 'fixed'
                          ? isAr
                            ? 'مبلغ ثابت'
                            : 'Fixed'
                          : isAr
                          ? 'نسبة مئوية'
                          : 'Percentage'}
                      </td>
                      <td className="p-3 font-mono font-bold text-emerald-700 text-sm">
                        {rule.incentiveType === 'fixed'
                          ? formatCurrencyNumber(rule.incentiveAmount, currency, true, isAr ? 'ar' : 'en')
                          : `${rule.incentiveAmount}%`}
                      </td>
                      <td className="p-3 font-mono text-slate-600">
                        {rule.minTargetQty ? `${rule.minTargetQty} ${isAr ? 'قطعة' : 'units'}` : '—'}
                      </td>
                      <td className="p-3 text-slate-500 text-[11px]">{rule.description || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: حاسبة استحقاق الموظف وتفاصيل الصرف ── */}
      {activeTab === 'calculator' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              {isAr ? 'قائمة المستشارين وبيان استحقاق الحوافز' : 'Staff Incentive Payout Breakdown'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {activeRecords.map((rec) => {
                const totalIncentive =
                  rec.earnedIncentive ||
                  (rec.incentiveItems?.reduce((sum, it) => sum + it.totalEarned, 0) ||
                    Math.round(rec.actual * 0.02));

                return (
                  <div
                    key={rec.id}
                    className="p-4 rounded-2xl border border-slate-200 hover:border-emerald-300 bg-white transition-all hover:scale-[1.01] space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-sm text-slate-900 block">{rec.employee}</span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {rec.employeeId ? `#${rec.employeeId}` : ''} · {rec.branch || 'كونكورد'}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        {rec.achievementRate.toFixed(1)}%
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                      <span className="text-xs text-slate-500">{isAr ? 'إجمالي الحافز:' : 'Total Earned:'}</span>
                      <span className="text-base font-black font-mono text-emerald-700">
                        {formatCurrencyNumber(totalIncentive, currency, true, isAr ? 'ar' : 'en')}
                      </span>
                    </div>

                    <button
                      onClick={() => setSelectedRecordForBreakdown(rec)}
                      className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer min-h-[40px]"
                    >
                      <Award className="w-3.5 h-3.5" />
                      <span>{isAr ? 'عرض بيان الحافز التفصيلي' : 'View Full Details'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: التوقعات الشهرية للحوافز والشرائح ── */}
      {activeTab === 'projection' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <EmployeeIncentiveProjectionTab
            records={activeRecords}
            currency={currency}
            language={state.settings.language}
          />
        </div>
      )}

      {/* ── Modals ── */}
      <IncentivesModal
        isOpen={isIncentivesModalOpen}
        onClose={() => setIsIncentivesModalOpen(false)}
        rules={state.incentiveRules}
        onUpdateRules={handleUpdateRules}
        currency={currency}
        language={state.settings.language}
      />

      <IncentiveBreakdownModal
        isOpen={selectedRecordForBreakdown !== null}
        onClose={() => setSelectedRecordForBreakdown(null)}
        record={selectedRecordForBreakdown}
        currency={currency}
        language={state.settings.language}
      />
    </div>
  );
};
