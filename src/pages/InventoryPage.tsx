import React, { useState } from 'react';
import { useDataStore } from '../store/DataStore';
import { SmartInventoryOptimizerModal } from '../components/SmartInventoryOptimizerModal';
import { AbcAnalysisSection } from '../components/AbcAnalysisSection';
import { selectRecordsInActivePeriod, selectActiveTargetStructure } from '../store/selectors';
import { Boxes, PackageCheck, Layers, Database, ArrowRightLeft, Sparkles } from 'lucide-react';
import { CONCORD_BRANCH_NAME } from '../data/sampleData';

export const InventoryPage: React.FC = () => {
  const { state } = useDataStore();
  const { language, currency } = state.settings;
  const isAr = language === 'ar';

  const [activeTab, setActiveTab] = useState<'optimizer' | 'abc' | 'ledger'>('optimizer');

  const activeRecords = selectRecordsInActivePeriod(state);
  const targetStructure = selectActiveTargetStructure(state);

  return (
    <div className="space-y-5 select-none" dir={isAr ? 'rtl' : 'ltr'}>
      {/* ── Page Header & Sub-Tabs ── */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Segmented Sub-Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl border border-slate-200">
          <button
            onClick={() => setActiveTab('optimizer')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'optimizer'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Boxes className="w-4 h-4 text-blue-600" />
            <span>{isAr ? 'رادار المخزون والمناقلات السريعة' : 'Stock Optimizer & Transfers'}</span>
          </button>

          <button
            onClick={() => setActiveTab('abc')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'abc'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4 text-amber-500" />
            <span>{isAr ? 'تحليل ABC للأصناف والمخزون' : 'ABC Stock & Pareto Analysis'}</span>
          </button>

          <button
            onClick={() => setActiveTab('ledger')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'ledger'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Database className="w-4 h-4 text-emerald-600" />
            <span>{isAr ? 'أرصدة الفرع والمستودع الرئيسي' : 'Stock Ledger (0032 vs 4016)'}</span>
            <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded-full font-mono">
              {state.inventoryItems.length}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs bg-slate-100 px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold">
          <PackageCheck className="w-4 h-4 text-blue-600" />
          <span>{isAr ? 'فرع كونكورد بلازا (0032)' : 'Concorde Plaza (0032)'}</span>
        </div>
      </div>

      {/* ── TAB 1: رادار الإمداد والمناقلات ── */}
      {activeTab === 'optimizer' && (
        <div className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden animate-in fade-in duration-150">
          <SmartInventoryOptimizerModal
            isOpen={true}
            onClose={() => {}}
            language={language}
            currency={currency}
            isFullPage={true}
          />
        </div>
      )}

      {/* ── TAB 2: تحليل ABC للمخزون والمبيعات ── */}
      {activeTab === 'abc' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4 animate-in fade-in duration-150">
          <AbcAnalysisSection
            records={activeRecords}
            currency={currency}
            language={language}
            targetStructure={targetStructure}
          />
        </div>
      )}

      {/* ── TAB 3: أرصدة الفرع والمستودع الرئيسي ── */}
      {activeTab === 'ledger' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {isAr ? 'بيان أرصدة المخزون الفعلية (Oracle Stock Ledger)' : 'Oracle Multi-Store Stock Ledger'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {isAr
                  ? 'مقارنة دقيقة لأرصدة فرع كونكورد بلازا (مخزن 0032) مقابل المستودع المركزي (مخزن 4016)'
                  : 'Direct comparison between Concorde Store 0032 and Central WH 4016'}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right border-collapse">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">{isAr ? 'كود الصنف (Item Code)' : 'Item Code'}</th>
                  <th className="p-3">{isAr ? 'وصف الصنف / الموديل' : 'Description'}</th>
                  <th className="p-3">{isAr ? 'القسم' : 'Category'}</th>
                  <th className="p-3 text-center">{isAr ? 'رصيد كونكورد (0032)' : 'Concorde (0032)'}</th>
                  <th className="p-3 text-center">{isAr ? 'رصيد المستودع (4016)' : 'Main WH (4016)'}</th>
                  <th className="p-3 text-center">{isAr ? 'حالة التوفر' : 'Status'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {state.inventoryItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      {isAr ? 'لا توجد بيانات مخزون مرفوعة حالياً. يرجى رفع ملف Stock (21).xls' : 'No stock data uploaded yet.'}
                    </td>
                  </tr>
                ) : (
                  state.inventoryItems.map((item) => {
                    const concordeQty = item.concordeStock ?? 0;
                    const whQty = item.mainWarehouseStock ?? 0;
                    const isLow = concordeQty <= 2;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-mono font-bold text-blue-600">{item.sku}</td>
                        <td className="p-3 font-bold text-slate-800">{item.name}</td>
                        <td className="p-3 text-slate-600">{item.categoryLabelAr || item.category}</td>
                        <td className="p-3 text-center font-mono font-bold text-sm">
                          <span className={`px-2.5 py-1 rounded-xl ${isLow ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-slate-100 text-slate-800'}`}>
                            {concordeQty}
                          </span>
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-sm text-slate-600">
                          {whQty}
                        </td>
                        <td className="p-3 text-center">
                          {concordeQty > 2 ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                              {isAr ? 'متوفر' : 'In Stock'}
                            </span>
                          ) : whQty > 0 ? (
                            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200">
                              {isAr ? 'متاح بالمستودع' : 'Available in WH'}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-200">
                              {isAr ? 'منخفض جداً' : 'Critically Low'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryPage;
