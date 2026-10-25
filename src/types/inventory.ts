export interface InventoryItem {
  id: string;
  sku: string; // كود الصنف
  name: string; // اسم الصنف / الموديل
  category: 'smartphones' | 'laptops' | 'accessories' | 'home_appliances_tv' | 'other';
  categoryLabelAr: string;
  priceEgp: number; // السعر بالجنيه المصري
  concordeStock: number; // رصيد فرع كونكورد بلازا
  mainWarehouseStock: number; // رصيد المخزن الرئيسي
  monthlySalesVelocity: number; // معدل المبيعات الشهرية / السحب بالفرع (قطع/شهر)
  isHighTicket: boolean; // صنف مميز عالي القيمة
  agingDays?: number; // عمر المخزون بالفرع بالأيام
  notes?: string;
  date?: string; // YYYY-MM-DD تاريخ الرصيد أو الجرد
  dateFormattedAr?: string; // تاريخ الرصيد منسق بالعربية
}

export interface UrgentTransferRecommendation {
  item: InventoryItem;
  suggestedTransferQty: number; // الكمية المقترحة للتحويل
  currentCoverDays: number; // أيام التغطية الحالية بالفرع
  expectedCoverDaysPostTransfer: number; // التغطية بعد التحويل
  urgency: 'critical' | 'high' | 'medium';
  reasonAr: string;
}

export interface CrossBranchSellingItem {
  item: InventoryItem;
  salesPitchAr: string;
  deliveryTimeHours: number; // مدة التوصيل من المخزن الرئيسي (ساعات)
  marginLevel: 'high' | 'ultra_high' | 'medium';
}

export interface OverstockAgingItem {
  item: InventoryItem;
  monthsOfSupply: number; // أشهر التغطية الحالية
  totalTrappedCapitalEgp: number; // رأس المال المجمد بالجنيه
  recommendedAction: 'bundle' | 'showroom_eye_level' | 'inter_branch_return';
  actionDetailsAr: string;
  bundlePartnerSku?: string;
  bundlePartnerName?: string;
  targetBranchForReturn?: string;
}

export interface SmartAlternativeMapping {
  outOfStockItem: InventoryItem;
  recommendedAlternative: InventoryItem;
  priceDifferenceEgp: number;
  priceDifferencePct: number;
  recommendationReasonAr: string;
  keySellingPointsAr: string[];
}

export interface InventoryAnalysisReport {
  analyzedAt: string;
  latestDate?: string; // أحدث تاريخ رصيد مسجل
  latestDateFormattedAr?: string; // أحدث تاريخ رصيد بالعربية
  totalItemsCount: number;
  totalConcordeUnits: number;
  totalMainWarehouseUnits: number;
  totalConcordeStockValueEgp: number;
  // Section 1: Urgent Stock Transfers
  urgentTransfers: UrgentTransferRecommendation[];
  totalSuggestedTransferUnits: number;
  // Section 2: High-Ticket Cross-Branch Selling Radar
  crossBranchSellingItems: CrossBranchSellingItem[];
  potentialCrossSalesValueEgp: number;
  // Section 3: Branch Overstock & Aging
  overstockItems: OverstockAgingItem[];
  totalTrappedOverstockCapitalEgp: number;
  // Section 4: Smart Alternatives Matrix (0/0 items)
  smartAlternatives: SmartAlternativeMapping[];
}

export interface CriticalStockPushAlert {
  id: string;
  item: InventoryItem;
  concordeStock: number; // 0
  mainWarehouseStock: number;
  monthlySalesVelocity: number;
  triggeredAt: string;
  severity: 'critical_zero' | 'warning_low';
  titleAr: string;
  messageAr: string;
  managerDispatched: boolean;
  suggestedTransferQty: number;
}

export interface StockPushNotificationSettings {
  browserPushEnabled: boolean;
  soundEnabled: boolean;
  minVelocityThreshold: number; // e.g. >= 8 units/month
  includeFlagshipAlways: boolean; // Flagship / High-ticket items always alert
  managerName: string;
  managerRole: string;
  managerPhone: string;
  managerEmail: string;
}

export interface InventoryColumnMapping {
  skuColumn: string;
  nameColumn: string;
  categoryColumn?: string;
  priceColumn: string;
  concordeStockColumn: string;
  mainWarehouseStockColumn: string;
  salesVelocityColumn: string;
  agingDaysColumn?: string;
  notesColumn?: string;
  dateColumn?: string; // عمود تاريخ الجرد أو الرصيد
}

export interface InventorySheetParseResult {
  items: InventoryItem[];
  detectedMapping: InventoryColumnMapping;
  headers: string[];
  rawRows: Record<string, unknown>[];
  needsManualMapping: boolean;
  headerRowIndex: number;
  availableSheets: string[];
  activeSheetName: string;
  totalRowsFound: number;
  error?: string;
  warningMessages?: string[];
  isDualSheet?: boolean;
  salesSheetName?: string;
  stockSheetName?: string;
  latestDate?: string; // YYYY-MM-DD
  latestDateFormattedAr?: string; // e.g. "20 أكتوبر 2026"
}

export interface DualSheetParseInput {
  stockSheetData?: ArrayBuffer;
  salesSheetData?: ArrayBuffer;
  stockFileName?: string;
  salesFileName?: string;
}

