import React, { useState } from 'react';
import {
  Award,
  Coins,
  TrendingUp,
  Plus,
  Trash2,
  Download,
  Upload,
  CheckCircle2,
  X,
  FileSpreadsheet,
  Users,
} from 'lucide-react';
import { useDataStore } from '../store/DataStore';
import { selectRecordsInActivePeriod } from '../store/selectors';
import { EmployeeIncentiveProjectionTab } from '../components/EmployeeIncentiveProjectionTab';
import { SalesRecord, ProductIncentiveRule } from '../types/sales';
import { formatCurrencyNumber } from '../utils/calculations';
import { parseArabicOrWesternNumber, downloadWorkbookSafely } from '../utils/excelParser';
import * as XLSX from 'xlsx';

export const IncentivesPage: React.FC = () => {
  const { state, dispatch } = useDataStore();
  const [activeTab, setActiveTab] = useState<'rules' | 'calculator' | 'projection'>('rules');

  // Inline rule adding state
  const [newCategory, setNewCategory] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newMinQty, setNewMinQty] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedRecordForBreakdown, setSelectedRecordForBreakdown] = useState<SalesRecord | null>(null);

  const isAr = state.settings.language === 'ar';
  const currency = state.settings.currency;
  const activeRecords = selectRecordsInActivePeriod(state);

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim() || !newAmount) return;

    const amount = parseArabicOrWesternNumber(newAmount);
    if (amount <= 0) return;

    const newRule: ProductIncentiveRule = {
      id: `rule-${Date.now().toString(36)}`,
      productCategory: newCategory.trim(),
      incentiveAmount: amount,
      incentiveType: 'fixed',
      minTargetQty: newMinQty ? parseArabicOrWesternNumber(newMinQty) : undefined,
    };

    const updated = [...state.incentiveRules, newRule];
    dispatch({ type: 'SET_INCENTIVE_RULES', payload: updated });
    setNewCategory('');
    setNewAmount('');
    setNewMinQty('');
    setShowAddForm(false);
  };

  const handleDeleteRule = (id: string) => {
    const updated = state.incentiveRules.filter((r) => r.id !== id);
    dispatch({ type: 'SET_INCENTIVE_RULES', payload: updated });
  };

  const handleDownloadTemplate = () => {
    const sampleRows = [
      {
        'اسم المنتج / فئة الخدمة': 'هواتف ذكية Flagship (Samsung S / iPhone)',
        'قيمة الحافز (ج.م)': 200,
        'نوع الحافز': 'مبلغ ثابت لكل جهاز',
        'الحد الأدنى للوحدات': 10,
        'ملاحظات': 'حافز نقدي مباشر على كل هاتف رائد مباع',
      },
      {
        'اسم المنتج / فئة الخدمة': 'إكسسوارات وهواتف اقتصادية',
        'قيمة الحافز (ج.م)': 50,
        'نوع الحافز': 'مبلغ ثابت لكل قطعة',
        'الحد الأدنى للوحدات': 20,
        'ملاحظات': 'حافز الإكسسوارات',
      },
    ];
    const ws = XLSX.utils.json_to_sheet(sampleRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Incentives_Template');
    downloadWorkbookSafely(wb, 'Raya_Incentives_Rules_Template.xlsx');
  };

  return (
    <div className="space-y-5 select-none" dir={isAr ? 'rtl' : 'ltr'}>
      {/* ── Page Header & Sub-Tabs ── */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Segmented Sub-Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl border border-slate-200">
          <button
            onClick={() => setActiveTab('rules')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'rules'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Coins className="w-4 h-4 text-blue-600" />
            <span>{isAr ? 'قواعد وبنود الحوافز المعتمدة' : 'Corporate Incentive Rules'}</span>
            <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded-full font-mono">
              {state.incentiveRules.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('calculator')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'calculator'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Award className="w-4 h-4 text-amber-500" />
            <span>{isAr ? 'حاسبة استحقاق الموظفين والبيان التفصيلي' : 'Payout & Breakdown Calculator'}</span>
          </button>

          <button
            onClick={() => setActiveTab('projection')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'projection'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span>{isAr ? 'التوقعات الشهرية للحوافز والشرائح' : 'Monthly Tier Projections'}</span>
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {activeTab === 'rules' && (
            <>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{isAr ? 'إضافة بند حافز' : 'Add Rule'}</span>
              </button>

              <button
                onClick={handleDownloadTemplate}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200"
                title={isAr ? 'تنزيل شيت نموذج الحوافز' : 'Download Template'}
              >
                <Download className="w-3.5 h-3.5 text-slate-600" />
                <span>{isAr ? 'نموذج إكسيل' : 'Template'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── TAB 1: قواعد الحوافز ── */}
      {activeTab === 'rules' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Add Rule Form Accordion */}
          {showAddForm && (
            <form
              onSubmit={handleAddRule}
              className="bg-white rounded-3xl p-5 border border-blue-200 shadow-sm space-y-3 animate-in fade-in duration-150"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">
                  {isAr ? 'إضافة قاعدة حافز جديدة' : 'Add New Incentive Rule'}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isAr ? 'اسم المنتج أو فئة الخدمة' : 'Product / Category'}
                  </label>
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder={isAr ? 'مثال: iPhone 16 Pro Max' : 'e.g. iPhone 16 Pro'}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isAr ? `قيمة الحافز (${currency})` : `Incentive Amount (${currency})`}
                  </label>
                  <input
                    type="number"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    placeholder="250"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isAr ? 'الحد الأدنى للقطع (اختياري)' : 'Min Qty Threshold'}
                  </label>
                  <input
                    type="number"
                    value={newMinQty}
                    onChange={(e) => setNewMinQty(e.target.value)}
                    placeholder="5"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  {isAr ? 'حفظ القاعدة' : 'Save Rule'}
                </button>
              </div>
            </form>
          )}

          {/* Rules Table */}
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
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right border-collapse">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3">{isAr ? 'اسم المنتج / فئة الخدمة' : 'Product / Category'}</th>
                    <th className="p-3">{isAr ? 'نوع الحافز' : 'Type'}</th>
                    <th className="p-3">{isAr ? 'قيمة الحافز المستحق' : 'Incentive Value'}</th>
                    <th className="p-3">{isAr ? 'الحد الأدنى' : 'Min Qty'}</th>
                    <th className="p-3">{isAr ? 'ملاحظات الصرف' : 'Notes'}</th>
                    <th className="p-3 text-center">{isAr ? 'إجراءات' : 'Actions'}</th>
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
                      <td className="p-3 font-mono font-bold text-blue-600 text-sm">
                        {rule.incentiveType === 'fixed'
                          ? formatCurrencyNumber(rule.incentiveAmount, currency, true, isAr ? 'ar' : 'en')
                          : `${rule.incentiveAmount}%`}
                      </td>
                      <td className="p-3 font-mono text-slate-600">
                        {rule.minTargetQty ? `${rule.minTargetQty} ${isAr ? 'قطعة' : 'units'}` : '—'}
                      </td>
                      <td className="p-3 text-slate-500 text-[11px]">{rule.description || '—'}</td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleDeleteRule(rule.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                          title={isAr ? 'حذف' : 'Delete'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: حاسبة استحقاق الموظف وتفاصيل الصرف (مدمجة) ── */}
      {activeTab === 'calculator' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* List of employees */}
            <div className={`space-y-3 ${selectedRecordForBreakdown ? 'lg:col-span-1' : 'lg:col-span-3'}`}>
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3">
                <h3 className="text-sm font-bold text-slate-900">
                  {isAr ? 'قائمة المستشارين وبيان استحقاق الحوافز' : 'Staff Incentive Payout Breakdown'}
                </h3>

                <div className={`grid gap-3 ${selectedRecordForBreakdown ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'}`}>
                  {activeRecords.map((rec) => {
                    const totalIncentive =
                      rec.earnedIncentive ||
                      (rec.incentiveItems?.reduce((sum, it) => sum + it.totalEarned, 0) ||
                        Math.round(rec.actual * 0.02));
                    const isSelected = selectedRecordForBreakdown?.id === rec.id;

                    return (
                      <div
                        key={rec.id}
                        className={`p-4 rounded-2xl border transition-all space-y-3 cursor-pointer ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50/20 shadow-xs ring-1 ring-blue-500'
                            : 'border-slate-200 hover:border-blue-300 bg-white'
                        }`}
                        onClick={() => setSelectedRecordForBreakdown(rec)}
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
                          <span className="text-xs text-slate-500">{isAr ? 'الحافز المستحق:' : 'Total Earned:'}</span>
                          <span className="text-base font-black font-mono text-blue-600">
                            {formatCurrencyNumber(totalIncentive, currency, true, isAr ? 'ar' : 'en')}
                          </span>
                        </div>

                        <button
                          type="button"
                          className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                            isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          <Award className="w-3.5 h-3.5" />
                          <span>{isSelected ? (isAr ? 'معروض الآن' : 'Viewing') : (isAr ? 'عرض البيان التفصيلي' : 'View Breakdown')}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* In-Page Breakdown View */}
            {selectedRecordForBreakdown && (
              <div className="lg:col-span-2 space-y-4 animate-in fade-in duration-150">
                <div className="bg-white rounded-3xl p-6 border border-blue-200 shadow-sm space-y-5">
                  {/* Breakdown Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                        <Award className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900">
                          {isAr ? 'بيان صرف الحوافز التفصيلي' : 'Detailed Incentive Breakdown'}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {selectedRecordForBreakdown.employee} · #{selectedRecordForBreakdown.employeeId || '—'} · {selectedRecordForBreakdown.period}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedRecordForBreakdown(null)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Summary Metric Strip */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200">
                      <span className="text-xs font-semibold text-blue-900 block">
                        {isAr ? 'إجمالي الحافز المكتسب' : 'Total Incentive'}
                      </span>
                      <span className="text-2xl font-black font-mono text-blue-700 mt-1 block">
                        {formatCurrencyNumber(
                          selectedRecordForBreakdown.earnedIncentive ||
                            (selectedRecordForBreakdown.incentiveItems?.reduce((sum, it) => sum + it.totalEarned, 0) ||
                              Math.round(selectedRecordForBreakdown.actual * 0.02)),
                          currency,
                          true,
                          isAr ? 'ar' : 'en'
                        )}
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <span className="text-xs text-slate-500 block">{isAr ? 'المبيعات الفعلية' : 'Actual Sales'}</span>
                      <span className="text-lg font-bold font-mono text-slate-900 mt-1 block">
                        {formatCurrencyNumber(selectedRecordForBreakdown.actual, currency, true, isAr ? 'ar' : 'en')}
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <span className="text-xs text-slate-500 block">{isAr ? 'نسبة التحقيق' : 'Achievement Rate'}</span>
                      <span className="text-lg font-bold font-mono text-emerald-700 mt-1 block">
                        {selectedRecordForBreakdown.achievementRate.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Itemized Items */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-800">
                      {isAr ? 'بنود المنتجات والخدمات المستحقة' : 'Earned Product & Services Items'}
                    </h4>

                    <div className="space-y-2">
                      {(
                        selectedRecordForBreakdown.incentiveItems || [
                          {
                            productCategory: isAr ? 'عمولة المبيعات الأساسية (2%)' : 'Base Sales Commission (2%)',
                            quantitySold: 1,
                            unitIncentive: Math.round(selectedRecordForBreakdown.actual * 0.02),
                            totalEarned: Math.round(selectedRecordForBreakdown.actual * 0.02),
                          },
                        ]
                      ).map((item, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 transition-colors flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold text-slate-900 block">{item.productCategory}</span>
                            <span className="text-[11px] text-slate-500">
                              {item.quantitySold} {isAr ? 'قطعة مباعة' : 'units'} × {formatCurrencyNumber(item.unitIncentive, currency, true, isAr ? 'ar' : 'en')}
                            </span>
                          </div>

                          <div className="text-left font-mono">
                            <span className="font-black text-blue-600 text-sm">
                              {formatCurrencyNumber(item.totalEarned, currency, true, isAr ? 'ar' : 'en')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
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
    </div>
  );
};
