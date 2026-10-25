import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef,
  useCallback,
  ReactNode,
} from 'react';
import {
  SalesRecord,
  BranchTotalTargetStructure,
  ProductIncentiveRule,
  EmployeeTargetAllocation,
  Language,
  Currency,
  FilterStatus,
  AuditReport,
  NotificationSettings,
} from '../types/sales';
import { InventoryItem } from '../types/inventory';
import { SheetRowValidationReport } from '../utils/excelParser';
import {
  INITIAL_SAMPLE_RECORDS,
  DEFAULT_PRODUCT_INCENTIVE_RULES,
  DEFAULT_OCTOBER_TARGET_STRUCTURE,
  enrichSalesRecords,
} from '../data/sampleData';

export interface StoreSettings {
  language: Language;
  currency: Currency;
  vatDisplayMode: 'afterVat' | 'beforeVat';
  vatMode?: 'afterVat' | 'beforeVat';
}

export interface AppStoreState {
  records: SalesRecord[];
  targets: Record<string, BranchTotalTargetStructure>;
  incentiveRules: ProductIncentiveRule[];
  targetAllocation: EmployeeTargetAllocation[] | null;
  shifts: any[];
  inventoryItems: InventoryItem[];
  retention: any[];
  notificationSettings: NotificationSettings;
  notifiedMilestones: string[];
  columnMappings: any;
  settings: StoreSettings;
  selectedPeriod: string;
  selectedBranch: string;
  searchQuery: string;
  filterStatus: FilterStatus;
  lastUpdated: string;
  isSyncing: boolean;
  auditReport: AuditReport | null;
  validationReport: SheetRowValidationReport | null;
}

export type StoreAction =
  | { type: 'SET_FULL_STORE'; payload: Partial<AppStoreState> }
  | { type: 'SET_PERIOD'; payload: string }
  | { type: 'SET_BRANCH'; payload: string }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_FILTER_STATUS'; payload: FilterStatus }
  | { type: 'SET_RECORDS'; payload: SalesRecord[] }
  | { type: 'ADD_RECORD'; payload: SalesRecord }
  | { type: 'UPDATE_RECORD'; payload: SalesRecord }
  | { type: 'DELETE_RECORD'; payload: string }
  | { type: 'IMPORT_RECORDS'; payload: { records: SalesRecord[]; mode: 'replace' | 'append' } }
  | { type: 'SET_TARGETS'; payload: Record<string, BranchTotalTargetStructure> }
  | { type: 'SET_TARGET_STRUCTURE'; payload: { period: string; structure: BranchTotalTargetStructure } }
  | { type: 'SET_INCENTIVE_RULES'; payload: ProductIncentiveRule[] }
  | { type: 'SET_TARGET_ALLOCATION'; payload: EmployeeTargetAllocation[] }
  | { type: 'SET_SHIFTS'; payload: any[] }
  | { type: 'SET_INVENTORY_ITEMS'; payload: InventoryItem[] }
  | { type: 'SET_RETENTION'; payload: any[] }
  | { type: 'SET_NOTIFICATION_SETTINGS'; payload: NotificationSettings }
  | { type: 'ADD_NOTIFIED_MILESTONE'; payload: string }
  | { type: 'SET_COLUMN_MAPPINGS'; payload: any }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<StoreSettings> }
  | { type: 'SET_SETTINGS'; payload: Partial<StoreSettings> }
  | { type: 'SET_AUDIT_REPORT'; payload: AuditReport | null }
  | { type: 'SET_VALIDATION_REPORT'; payload: SheetRowValidationReport | null }
  | { type: 'SET_SYNCING'; payload: boolean }
  | { type: 'SET_LAST_UPDATED'; payload: string };

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  pushEnabled: false,
  soundEnabled: true,
  notifyOnNear90: true,
  notifyOn100: true,
  notifyOnDeviation20: true,
  autoEmailOn100: false,
  managerEmail: 'concorde.branch@rayatrade.com',
};

export const INITIAL_STORE_STATE: AppStoreState = {
  records: enrichSalesRecords(INITIAL_SAMPLE_RECORDS),
  targets: {
    'أكتوبر 2026': DEFAULT_OCTOBER_TARGET_STRUCTURE,
  },
  incentiveRules: DEFAULT_PRODUCT_INCENTIVE_RULES,
  targetAllocation: null,
  shifts: [],
  inventoryItems: [],
  retention: [],
  notificationSettings: DEFAULT_NOTIFICATION_SETTINGS,
  notifiedMilestones: [],
  columnMappings: null,
  settings: {
    language: 'ar',
    currency: 'EGP',
    vatDisplayMode: 'afterVat',
    vatMode: 'afterVat',
  },
  selectedPeriod: 'أكتوبر 2026',
  selectedBranch: '',
  searchQuery: '',
  filterStatus: 'all',
  lastUpdated: new Date().toISOString(),
  isSyncing: false,
  auditReport: null,
  validationReport: null,
};

function storeReducer(state: AppStoreState, action: StoreAction): AppStoreState {
  const now = new Date().toISOString();

  switch (action.type) {
    case 'SET_FULL_STORE':
      return {
        ...state,
        ...action.payload,
        // Ensure critical structures exist
        targets: {
          ...state.targets,
          ...(action.payload.targets || {}),
        },
        settings: {
          ...state.settings,
          ...(action.payload.settings || {}),
        },
        notificationSettings:
          action.payload.notificationSettings && typeof action.payload.notificationSettings === 'object'
            ? { ...DEFAULT_NOTIFICATION_SETTINGS, ...action.payload.notificationSettings }
            : state.notificationSettings || DEFAULT_NOTIFICATION_SETTINGS,
        lastUpdated: action.payload.lastUpdated || now,
      };

    case 'SET_PERIOD':
      return {
        ...state,
        selectedPeriod: action.payload,
      };

    case 'SET_BRANCH':
      return {
        ...state,
        selectedBranch: action.payload,
      };

    case 'SET_SEARCH_QUERY':
      return {
        ...state,
        searchQuery: action.payload,
      };

    case 'SET_FILTER_STATUS':
      return {
        ...state,
        filterStatus: action.payload,
      };

    case 'SET_RECORDS':
      return {
        ...state,
        records: action.payload,
        lastUpdated: now,
      };

    case 'ADD_RECORD':
      return {
        ...state,
        records: [action.payload, ...state.records],
        lastUpdated: now,
      };

    case 'UPDATE_RECORD':
      return {
        ...state,
        records: state.records.map((r) => (r.id === action.payload.id ? action.payload : r)),
        lastUpdated: now,
      };

    case 'DELETE_RECORD':
      return {
        ...state,
        records: state.records.filter((r) => r.id !== action.payload),
        lastUpdated: now,
      };

    case 'IMPORT_RECORDS': {
      const { records: imported, mode } = action.payload;
      return {
        ...state,
        records: mode === 'replace' ? imported : [...state.records, ...imported],
        lastUpdated: now,
      };
    }

    case 'SET_TARGET_STRUCTURE': {
      const { period, structure } = action.payload;
      return {
        ...state,
        targets: {
          ...state.targets,
          [period]: structure,
        },
        lastUpdated: now,
      };
    }

    case 'SET_INCENTIVE_RULES':
      return {
        ...state,
        incentiveRules: action.payload,
        lastUpdated: now,
      };

    case 'SET_TARGET_ALLOCATION':
      return {
        ...state,
        targetAllocation: action.payload,
        lastUpdated: now,
      };

    case 'SET_SHIFTS':
      return {
        ...state,
        shifts: action.payload,
        lastUpdated: now,
      };

    case 'SET_INVENTORY_ITEMS':
      return {
        ...state,
        inventoryItems: action.payload,
        lastUpdated: now,
      };

    case 'SET_RETENTION':
      return {
        ...state,
        retention: action.payload,
        lastUpdated: now,
      };

    case 'SET_NOTIFICATION_SETTINGS':
      return {
        ...state,
        notificationSettings: action.payload,
        lastUpdated: now,
      };

    case 'ADD_NOTIFIED_MILESTONE':
      return {
        ...state,
        notifiedMilestones: [...state.notifiedMilestones, action.payload],
      };

    case 'SET_COLUMN_MAPPINGS':
      return {
        ...state,
        columnMappings: action.payload,
        lastUpdated: now,
      };

    case 'SET_TARGETS':
      return {
        ...state,
        targets: {
          ...state.targets,
          ...action.payload,
        },
        lastUpdated: now,
      };

    case 'SET_SETTINGS':
    case 'UPDATE_SETTINGS': {
      const merged = {
        ...state.settings,
        ...action.payload,
      };
      if (action.payload.vatMode) {
        merged.vatDisplayMode = action.payload.vatMode;
      }
      return {
        ...state,
        settings: merged,
        lastUpdated: now,
      };
    }

    case 'SET_AUDIT_REPORT':
      return {
        ...state,
        auditReport: action.payload,
      };

    case 'SET_VALIDATION_REPORT':
      return {
        ...state,
        validationReport: action.payload,
      };

    case 'SET_SYNCING':
      return {
        ...state,
        isSyncing: action.payload,
      };

    case 'SET_LAST_UPDATED':
      return {
        ...state,
        lastUpdated: action.payload,
      };

    default:
      return state;
  }
}

export interface DataStoreContextType {
  state: AppStoreState;
  dispatch: React.Dispatch<StoreAction>;
  saveToServer: () => Promise<void>;
  saveStoreNow: () => Promise<void>;
  syncWithServer: () => Promise<void>;
  resetToDefaultData: () => void;
  resetToDemo: () => void;
}

const DataStoreContext = createContext<DataStoreContextType | null>(null);

const STORE_CACHE_KEY = 'raya_concorde_store_cache_v2';

export const DataStoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(storeReducer, INITIAL_STORE_STATE);
  const isInitialLoad = useRef(true);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Initial Load: Server first, fallback to localStorage cache
  useEffect(() => {
    let isMounted = true;

    async function loadInitialStore() {
      try {
        const response = await fetch('/api/store');
        if (response.ok) {
          const serverData = await response.json();
          if (isMounted && serverData && typeof serverData === 'object') {
            const hasServerRecords = Array.isArray(serverData.records) && serverData.records.length > 0;
            if (hasServerRecords) {
              dispatch({
                type: 'SET_FULL_STORE',
                payload: {
                  ...serverData,
                  records: enrichSalesRecords(serverData.records),
                },
              });
              isInitialLoad.current = false;
              return;
            }
          }
        }
      } catch (err) {
        console.warn('Could not load from /api/store, attempting offline cache:', err);
      }

      // Offline Cache Fallback
      if (typeof window !== 'undefined') {
        try {
          const cached = localStorage.getItem(STORE_CACHE_KEY);
          if (cached && isMounted) {
            const parsed = JSON.parse(cached);
            if (parsed.records && parsed.records.length > 0) {
              dispatch({
                type: 'SET_FULL_STORE',
                payload: {
                  ...parsed,
                  records: enrichSalesRecords(parsed.records),
                },
              });
              isInitialLoad.current = false;
              return;
            }
          }
        } catch {
          // ignore cache error
        }
      }

      isInitialLoad.current = false;
    }

    loadInitialStore();

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Debounced Auto-Save to Server & localStorage
  const saveToServer = useCallback(async () => {
    dispatch({ type: 'SET_SYNCING', payload: true });
    try {
      const payloadToSave = {
        records: state.records,
        targets: state.targets,
        incentiveRules: state.incentiveRules,
        targetAllocation: state.targetAllocation,
        shifts: state.shifts,
        inventoryItems: state.inventoryItems,
        retention: state.retention,
        notificationSettings: state.notificationSettings,
        notifiedMilestones: state.notifiedMilestones,
        columnMappings: state.columnMappings,
        settings: state.settings,
        lastUpdated: new Date().toISOString(),
      };

      // Save to localStorage as offline cache
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(STORE_CACHE_KEY, JSON.stringify(payloadToSave));
        } catch {
          // storage full or disabled
        }
      }

      // Save to server
      const res = await fetch('/api/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadToSave),
      });

      if (res.ok) {
        const result = await res.json();
        if (result.lastUpdated) {
          dispatch({ type: 'SET_LAST_UPDATED', payload: result.lastUpdated });
        }
      }
    } catch (err) {
      console.error('Failed to sync to server:', err);
    } finally {
      dispatch({ type: 'SET_SYNCING', payload: false });
    }
  }, [
    state.records,
    state.targets,
    state.incentiveRules,
    state.targetAllocation,
    state.shifts,
    state.inventoryItems,
    state.retention,
    state.notificationSettings,
    state.notifiedMilestones,
    state.columnMappings,
    state.settings,
  ]);

  useEffect(() => {
    if (isInitialLoad.current) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      saveToServer();
    }, 700);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [
    state.records,
    state.targets,
    state.incentiveRules,
    state.shifts,
    state.inventoryItems,
    state.settings,
    saveToServer,
  ]);

  const resetToDefaultData = useCallback(() => {
    dispatch({
      type: 'SET_FULL_STORE',
      payload: {
        records: enrichSalesRecords(INITIAL_SAMPLE_RECORDS),
        targets: {
          'أكتوبر 2026': DEFAULT_OCTOBER_TARGET_STRUCTURE,
        },
        incentiveRules: DEFAULT_PRODUCT_INCENTIVE_RULES,
        lastUpdated: new Date().toISOString(),
      },
    });
  }, []);

  const syncWithServer = useCallback(async () => {
    dispatch({ type: 'SET_SYNCING', payload: true });
    try {
      const response = await fetch('/api/store');
      if (response.ok) {
        const serverData = await response.json();
        if (serverData && typeof serverData === 'object' && Array.isArray(serverData.records)) {
          dispatch({
            type: 'SET_FULL_STORE',
            payload: {
              ...serverData,
              records: enrichSalesRecords(serverData.records),
            },
          });
        }
      }
    } catch (err) {
      console.warn('Sync failed:', err);
    } finally {
      dispatch({ type: 'SET_SYNCING', payload: false });
    }
  }, []);

  return (
    <DataStoreContext.Provider
      value={{
        state,
        dispatch,
        saveToServer,
        saveStoreNow: saveToServer,
        syncWithServer,
        resetToDefaultData,
        resetToDemo: resetToDefaultData,
      }}
    >
      {children}
    </DataStoreContext.Provider>
  );
};

export function useDataStore(): DataStoreContextType {
  const context = useContext(DataStoreContext);
  if (!context) {
    throw new Error('useDataStore must be used within a DataStoreProvider');
  }
  return context;
}
