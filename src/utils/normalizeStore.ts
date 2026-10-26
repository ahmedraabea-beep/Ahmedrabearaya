/**
 * Data Store Normalization & Migration Service
 * Guarantees schema consistency, handles legacy migrations (e.g. targetAllocation object -> array),
 * ensures all periods and targets are validly typed, and prevents runtime TypeError crashes across all layers.
 */

import {
  SalesRecord,
  BranchTotalTargetStructure,
  ProductIncentiveRule,
  EmployeeTargetAllocation,
  NotificationSettings,
  Language,
  Currency,
} from '../types/sales';
import { enrichSalesRecords, DEFAULT_PRODUCT_INCENTIVE_RULES, DEFAULT_OCTOBER_TARGET_STRUCTURE, INITIAL_SAMPLE_RECORDS } from '../data/sampleData';

export const CURRENT_SCHEMA_VERSION = 2;

export interface NormalizedStoreData {
  schemaVersion: number;
  records: SalesRecord[];
  targets: Record<string, BranchTotalTargetStructure>;
  incentiveRules: ProductIncentiveRule[];
  targetAllocation: EmployeeTargetAllocation[];
  shifts: any[];
  inventoryItems: any[];
  retention: any[];
  contests: any[];
  notificationSettings: NotificationSettings;
  notifiedMilestones: string[];
  columnMappings: any;
  settings: {
    language: Language;
    currency: Currency;
    vatDisplayMode: 'afterVat' | 'beforeVat';
    vatMode?: 'afterVat' | 'beforeVat';
  };
  selectedPeriod?: string;
  selectedBranch?: string;
  lastUpdated: string;
}

export const DEFAULT_CONCORDE_ALLOCATIONS: EmployeeTargetAllocation[] = [
  {
    employeeId: '140729',
    employeeName: 'أحمد ربيع سيد',
    percentage: 40,
    targetAmount: 560000,
    dailyTarget: 18065,
    mobilesShare: 360000,
    accessoriesShare: 100000,
    otherShare: 100000,
    role: 'مستشار مبيعات أول',
  },
  {
    employeeId: '41308',
    employeeName: 'عمرو عبد الحليم',
    percentage: 35,
    targetAmount: 490000,
    dailyTarget: 15806,
    mobilesShare: 315000,
    accessoriesShare: 87500,
    otherShare: 87500,
    role: 'مستشار مبيعات',
  },
  {
    employeeId: '125177',
    employeeName: 'طارق محمود',
    percentage: 25,
    targetAmount: 350000,
    dailyTarget: 11290,
    mobilesShare: 225000,
    accessoriesShare: 62500,
    otherShare: 62500,
    role: 'مستشار مبيعات',
  },
];

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  pushEnabled: false,
  soundEnabled: true,
  notifyOnNear90: true,
  notifyOn100: true,
  notifyOnDeviation20: true,
  autoEmailOn100: false,
  managerEmail: 'concorde.branch@rayatrade.com',
};

/**
 * Normalizes any raw store input (from Server, LocalStorage, Seed, or GitHub Import)
 * Performs schema migration and guarantees absolute type safety.
 */
export function normalizeStore(raw: any): NormalizedStoreData {
  if (!raw || typeof raw !== 'object') {
    raw = {};
  }

  // 1. Schema Version Detection & Migration
  const incomingVersion = typeof raw.schemaVersion === 'number' ? raw.schemaVersion : 1;

  // 2. Normalize targetAllocation (CRITICAL: Fixes { allocations: [...] } legacy object bug)
  let normalizedAllocations: EmployeeTargetAllocation[] = [];
  if (Array.isArray(raw.targetAllocation)) {
    normalizedAllocations = raw.targetAllocation;
  } else if (raw.targetAllocation && typeof raw.targetAllocation === 'object') {
    if (Array.isArray(raw.targetAllocation.allocations)) {
      normalizedAllocations = raw.targetAllocation.allocations;
    } else {
      normalizedAllocations = DEFAULT_CONCORDE_ALLOCATIONS;
    }
  } else if (Array.isArray(raw.allocations)) {
    normalizedAllocations = raw.allocations;
  } else {
    normalizedAllocations = DEFAULT_CONCORDE_ALLOCATIONS;
  }

  // Ensure each allocation element is valid
  normalizedAllocations = normalizedAllocations.map((a, idx) => ({
    employeeId: String(a?.employeeId || (idx === 0 ? '140729' : idx === 1 ? '41308' : '125177')),
    employeeName: String(a?.employeeName || (idx === 0 ? 'أحمد ربيع سيد' : idx === 1 ? 'عمرو عبد الحليم' : 'طارق محمود')),
    percentage: Number(a?.percentage) || (idx === 0 ? 40 : idx === 1 ? 35 : 25),
    targetAmount: Number(a?.targetAmount) || 0,
    dailyTarget: Number(a?.dailyTarget) || 0,
    mobilesShare: a?.mobilesShare !== undefined ? Number(a.mobilesShare) : undefined,
    accessoriesShare: a?.accessoriesShare !== undefined ? Number(a.accessoriesShare) : undefined,
    otherShare: a?.otherShare !== undefined ? Number(a.otherShare) : undefined,
    role: a?.role || 'مستشار مبيعات',
  }));

  // 3. Normalize targets dictionary
  const normalizedTargets: Record<string, BranchTotalTargetStructure> = {};
  const rawTargets = raw.targets && typeof raw.targets === 'object' ? raw.targets : {};

  // If empty targets dictionary, seed with standard active month
  const targetKeys = Object.keys(rawTargets);
  if (targetKeys.length === 0) {
    normalizedTargets['أكتوبر 2026'] = { ...DEFAULT_OCTOBER_TARGET_STRUCTURE };
  } else {
    for (const key of targetKeys) {
      const t = rawTargets[key];
      if (t && typeof t === 'object') {
        normalizedTargets[key] = {
          grandTotal: Number(t.grandTotal) || 1750000,
          installmentTarget: Number(t.installmentTarget) || 350000,
          revenueTarget: Number(t.revenueTarget) || 1400000,
          revenueBreakdown: {
            mobiles: Number(t.revenueBreakdown?.mobiles) || 900000,
            accessories: Number(t.revenueBreakdown?.accessories) || 250000,
            other: Number(t.revenueBreakdown?.other) || 250000,
          },
          period: String(t.period || key),
          daysInMonth: Number(t.daysInMonth) || 31,
          dailyRevenueTarget: Number(t.dailyRevenueTarget) || Math.round((Number(t.revenueTarget) || 1400000) / (Number(t.daysInMonth) || 31)),
          dailyGrandTotalTarget: Number(t.dailyGrandTotalTarget) || Math.round((Number(t.grandTotal) || 1750000) / (Number(t.daysInMonth) || 31)),
        };
      }
    }
  }

  // 4. Normalize records
  let rawRecordsList: any[] = [];
  if (Array.isArray(raw.records)) {
    rawRecordsList = raw.records;
  } else if (raw.records && typeof raw.records === 'object') {
    rawRecordsList = Object.values(raw.records);
  } else {
    rawRecordsList = INITIAL_SAMPLE_RECORDS;
  }
  const normalizedRecords = enrichSalesRecords(rawRecordsList);

  // 5. Normalize incentiveRules
  let normalizedIncentives: ProductIncentiveRule[] = [];
  if (Array.isArray(raw.incentiveRules) && raw.incentiveRules.length > 0) {
    normalizedIncentives = raw.incentiveRules;
  } else {
    normalizedIncentives = DEFAULT_PRODUCT_INCENTIVE_RULES;
  }

  // 6. Normalize settings
  const rawSettings = raw.settings || {};
  const normalizedSettings = {
    language: (rawSettings.language === 'en' ? 'en' : 'ar') as Language,
    currency: (['EGP', 'USD', 'SAR'].includes(rawSettings.currency) ? rawSettings.currency : 'EGP') as Currency,
    vatDisplayMode: (rawSettings.vatDisplayMode === 'beforeVat' ? 'beforeVat' : 'afterVat') as 'afterVat' | 'beforeVat',
    vatMode: (rawSettings.vatMode === 'beforeVat' ? 'beforeVat' : 'afterVat') as 'afterVat' | 'beforeVat',
  };

  // 7. Normalize other collections
  const normalizedShifts = Array.isArray(raw.shifts) ? raw.shifts : [];
  const normalizedInventory = Array.isArray(raw.inventoryItems) ? raw.inventoryItems : [];
  const normalizedRetention = Array.isArray(raw.retention) ? raw.retention : [];
  const normalizedContests = Array.isArray(raw.contests) ? raw.contests : [];
  const normalizedMilestones = Array.isArray(raw.notifiedMilestones) ? raw.notifiedMilestones : [];

  const normalizedNotifications: NotificationSettings = {
    ...DEFAULT_NOTIFICATION_SETTINGS,
    ...(raw.notificationSettings && typeof raw.notificationSettings === 'object' ? raw.notificationSettings : {}),
  };

  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    records: normalizedRecords,
    targets: normalizedTargets,
    incentiveRules: normalizedIncentives,
    targetAllocation: normalizedAllocations,
    shifts: normalizedShifts,
    inventoryItems: normalizedInventory,
    retention: normalizedRetention,
    contests: normalizedContests,
    notificationSettings: normalizedNotifications,
    notifiedMilestones: normalizedMilestones,
    columnMappings: raw.columnMappings || null,
    settings: normalizedSettings,
    selectedPeriod: typeof raw.selectedPeriod === 'string' && raw.selectedPeriod.trim() ? raw.selectedPeriod.trim() : Object.keys(normalizedTargets)[0] || 'أكتوبر 2026',
    selectedBranch: typeof raw.selectedBranch === 'string' ? raw.selectedBranch : '',
    lastUpdated: typeof raw.lastUpdated === 'string' ? raw.lastUpdated : new Date().toISOString(),
  };
}
