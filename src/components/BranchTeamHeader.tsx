import React from 'react';
import { ShieldCheck, UserCheck, MapPin, Building, Coins, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { Language, SalesRecord, Currency } from '../types/sales';
import { translations } from '../utils/i18n';
import { BRANCH_MANAGER, CONCORD_BRANCH_NAME_EN } from '../data/sampleData';
import { formatCurrencyNumber, formatPercent } from '../utils/calculations';

interface BranchTeamHeaderProps {
  language: Language;
  currency: Currency;
  records: SalesRecord[];
  onOpenIncentives: () => void;
  onSelectEmployeeIncentive: (rec: SalesRecord) => void;
  onOpenMonthlyReport?: () => void;
}

export const BranchTeamHeader: React.FC<BranchTeamHeaderProps> = ({
  language,
  currency,
  records,
  onOpenIncentives,
  onSelectEmployeeIncentive,
  onOpenMonthlyReport,
}) => {
  const t = translations[language];

  // The 3 official team members
  const teamStaff = [
    { name: 'أحمد ربيع سيد', nameEn: 'Ahmed Rabea Sayed', id: '140729', role: language === 'ar' ? 'مستشار مبيعات أول' : 'Senior Sales Advisor' },
    { name: 'عمرو عبد الحليم', nameEn: 'Amr Abdelhaleem', id: '41308', role: language === 'ar' ? 'مستشار مبيعات' : 'Sales Advisor' },
    { name: 'طارق محمود', nameEn: 'Tarek Mahmoud', id: '125177', role: language === 'ar' ? 'مستشار مبيعات' : 'Sales Advisor' },
  ];

  // Calculate total branch earned incentives for current period
  const activeRecords = records.filter(
    (r) => r.period && (r.period.includes('أكتوبر') || r.period.includes('Oct') || r.period.includes('10'))
  );
  const targetRecords = activeRecords.length > 0 ? activeRecords : records;
  const totalEarnedIncentives = targetRecords.reduce((sum, r) => sum + (r.earnedIncentive || 0), 0);

  return (
    <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white rounded-2xl p-5 md:p-6 shadow-md border border-slate-700/60 relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Branch & Manager Information */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-xs text-emerald-400 font-medium">
            <span className="flex items-center gap-1 bg-emerald-950/80 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
              <Building className="w-3.5 h-3.5" />
              {t.companyName}
            </span>
            <span className="text-slate-400" aria-hidden="true">·</span>
            <span className="flex items-center gap-1 text-slate-300">
              <MapPin className="w-3.5 h-3.5 text-rose-400" />
              {language === 'ar' ? 'مول كونكورد بلازا - التجمع الخامس، القاهرة الجديدة' : 'Concorde Plaza Mall - 5th Settlement, New Cairo'}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-white">
            {language === 'ar' ? t.appName : CONCORD_BRANCH_NAME_EN}
          </h1>

          {/* Branch Manager Card & Total Incentives Button */}
          <div className="pt-1 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2.5 bg-slate-800/80 border border-slate-700 px-3 py-1.5 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center font-bold shadow-xs">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] font-semibold text-amber-300 uppercase tracking-wider">
                  {t.branchManagerTitle}
                </div>
                <div className="text-sm font-bold text-white">
                  {language === 'ar' ? BRANCH_MANAGER.name : BRANCH_MANAGER.nameEn}
                </div>
              </div>
            </div>

            {/* Total Branch Earned Incentives Pill */}
            <button
              onClick={onOpenIncentives}
              className="flex items-center gap-2 bg-emerald-900/60 hover:bg-emerald-900/90 border border-emerald-500/40 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer group"
              title={language === 'ar' ? 'اضغط لعرض وإدارة شيت حوافز الشركة' : 'Click to view and manage company incentives'}
            >
              <Coins className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
              <div>
                <div className="text-[10px] text-emerald-300">
                  {t.kpiTotalIncentives}
                </div>
                <div className="text-sm font-bold font-mono tabular-nums text-white flex items-center gap-1">
                  <span>{formatCurrencyNumber(totalEarnedIncentives, currency, true, language)}</span>
                  {language === 'ar' ? <ChevronLeft className="w-3 h-3 text-emerald-400" /> : <ChevronRight className="w-3 h-3 text-emerald-400" />}
                </div>
              </div>
            </button>

            {/* Monthly PDF Report Quick Action */}
            {onOpenMonthlyReport && (
              <button
                onClick={onOpenMonthlyReport}
                className="flex items-center gap-2 bg-purple-900/50 hover:bg-purple-900/80 border border-purple-500/40 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer group text-xs font-bold text-purple-200 hover:text-white"
                title={language === 'ar' ? 'استخراج وطباعة تقرير أداء الفرع كـ PDF' : 'Generate monthly PDF report'}
              >
                <FileText className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                <span>{t.monthlyReportBtn}</span>
              </button>
            )}
          </div>
        </div>

        {/* 3 Team Members Cards with Job IDs & Earned Incentives */}
        <div className="bg-slate-900/70 border border-slate-700/80 rounded-xl p-3 sm:p-4 backdrop-blur-xs">
          <div className="flex items-center justify-between text-xs text-slate-300 mb-2.5 pb-2 border-b border-slate-700/60">
            <span className="font-bold flex items-center gap-1.5 text-emerald-400">
              <UserCheck className="w-4 h-4" />
              {t.teamMembersTitle}
            </span>
            <button
              onClick={onOpenIncentives}
              className="text-[11px] text-amber-300 hover:text-amber-200 underline flex items-center gap-1"
            >
              <Coins className="w-3 h-3" />
              <span>{t.manageIncentivesBtn}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {teamStaff.map((staff) => {
              // Find matching latest record
              const latestRec = [...records]
                .filter((r) => r.employee.includes(staff.name) || (staff.id && r.employeeId === staff.id))
                .sort((a, b) => b.actual - a.actual)[0];

              const isOver = latestRec?.isAchieved;

              return (
                <div
                  key={staff.id}
                  onClick={() => latestRec && onSelectEmployeeIncentive(latestRec)}
                  className="bg-slate-800/90 border border-slate-700 hover:border-emerald-500/50 p-2.5 rounded-lg transition-all cursor-pointer group hover:shadow-xs text-xs"
                >
                  <div className="font-bold text-white whitespace-nowrap flex items-center justify-between">
                    <span>{language === 'ar' ? staff.name : staff.nameEn}</span>
                    <Coins className="w-3 h-3 text-amber-400 opacity-60 group-hover:opacity-100" />
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 font-mono tabular-nums">
                    <span>{t.jobId}:</span>
                    <strong className="text-emerald-400 font-semibold">{staff.id}</strong>
                  </div>
                  {latestRec && (
                    <div className="mt-1.5 pt-1.5 border-t border-slate-700/60 space-y-1 text-[11px] font-mono tabular-nums">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300">
                          {formatCurrencyNumber(latestRec.actual, currency, true, language)}
                        </span>
                        <span
                          className={`font-bold px-1.5 py-0.2 rounded-xs text-[10px] ${
                            isOver ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'
                          }`}
                        >
                          {formatPercent(latestRec.achievementRate)}
                        </span>
                      </div>
                      {latestRec.earnedIncentive !== undefined && (
                        <div className="flex items-center justify-between text-amber-300 font-semibold text-[10px] bg-slate-900/60 px-1.5 py-0.5 rounded">
                          <span>{language === 'ar' ? 'حافز مستحق:' : 'Incentive:'}</span>
                          <span>{formatCurrencyNumber(latestRec.earnedIncentive, currency, true, language)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
