/**
 * AUTO-GENERATED SEED DATA FILE FOR PRODUCTION & VERCEL DEPLOYMENTS
 * This file serves as the initial source of truth when running on static hosting or fresh deployments.
 * Generated automatically via "Publish to GitHub" or "Copy as Seed File".
 */

import { SalesRecord, BranchTotalTargetStructure, ProductIncentiveRule } from './types/sales';
import {
  DEFAULT_OCTOBER_TARGET_STRUCTURE,
  DEFAULT_PRODUCT_INCENTIVE_RULES,
  INITIAL_SAMPLE_RECORDS,
} from './data/sampleData';

export const SEED_VERSION = 1;
export const SEED_UPDATED_AT = '2026-10-26T14:48:00.000Z';

export interface SeedStoreData {
  records: SalesRecord[];
  targets: Record<string, BranchTotalTargetStructure>;
  incentiveRules: ProductIncentiveRule[];
  targetAllocation: any;
  shifts: any[];
  inventoryItems: any[];
  retention: any[];
  notificationSettings: any;
  settings: {
    language: 'ar' | 'en';
    currency: 'EGP' | 'USD' | 'SAR';
    vatDisplayMode: 'afterVat' | 'beforeVat';
    vatMode: 'afterVat' | 'beforeVat';
  };
  lastUpdated: string;
}

export const SEED_STORE_DATA: SeedStoreData = {
  records: INITIAL_SAMPLE_RECORDS as SalesRecord[],
  targets: {
    'أكتوبر 2026': DEFAULT_OCTOBER_TARGET_STRUCTURE,
  },
  incentiveRules: DEFAULT_PRODUCT_INCENTIVE_RULES,
  targetAllocation: [
    { employeeId: '140729', employeeName: 'أحمد ربيع سيد', percentage: 40, targetAmount: 560000 },
    { employeeId: '41308', employeeName: 'عمرو عبد الحليم', percentage: 35, targetAmount: 490000 },
    { employeeId: '125177', employeeName: 'طارق محمود', percentage: 25, targetAmount: 350000 },
  ],
  shifts: [],
  inventoryItems: [],
  retention: [],
  notificationSettings: {
    pushEnabled: false,
    soundEnabled: true,
    notifyOnNear90: true,
    notifyOn100: true,
    notifyOnDeviation20: true,
    autoEmailOn100: false,
    managerEmail: 'concorde.branch@rayatrade.com',
  },
  settings: {
    language: 'ar',
    currency: 'EGP',
    vatDisplayMode: 'afterVat',
    vatMode: 'afterVat',
  },
  lastUpdated: '2026-10-26T14:48:00.000Z',
};
