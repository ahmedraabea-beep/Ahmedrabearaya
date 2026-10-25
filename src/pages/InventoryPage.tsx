import React, { useState } from 'react';
import { useDataStore } from '../store/DataStore';
import { SmartInventoryOptimizerModal } from '../components/SmartInventoryOptimizerModal';
import { Boxes, PackageCheck, Truck, RefreshCw, AlertTriangle, ArrowRightLeft } from 'lucide-react';

export const InventoryPage: React.FC = () => {
  const { state } = useDataStore();
  const { language, currency } = state.settings;
  const isAr = language === 'ar';

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-2">
              <Boxes className="w-4 h-4" />
              <span>{isAr ? 'إدارة المخزون والتوريدات الذكية' : 'Smart Inventory & Stock Optimization'}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isAr ? 'منظومة إدارة المخزون والمناقلات بين الفروع' : 'Stock Management & Inter-Branch Transfers'}
            </h1>
            <p className="text-sm text-emerald-100/80 mt-1 max-w-2xl">
              {isAr
                ? 'تحليل الرواكد والأصناف البطيئة، توصيات المناقلات الفورية لفرع كونكورد بلازا، واقتراح البدائل الذكية لدعم المبيعات اليومية.'
                : 'Analyze aging stock, automate urgent transfer orders for Concorde Plaza, and suggest high-conversion alternatives.'}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/15">
            <PackageCheck className="w-4 h-4 text-emerald-400" />
            <span className="font-medium">
              {isAr ? 'فرع راية كونكورد بلازا - القاهرة الجديدة' : 'Raya Concorde Plaza - New Cairo'}
            </span>
          </div>
        </div>
      </div>

      {/* Embedded Full Page Inventory Manager */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <SmartInventoryOptimizerModal
          isOpen={true}
          onClose={() => {
            window.location.hash = '#/';
          }}
          language={language}
          currency={currency}
          isFullPage={true}
        />
      </div>
    </div>
  );
};

export default InventoryPage;
