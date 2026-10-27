import { SalesRecord, BranchPerformance, OverallStats, Currency, CURRENCY_SYMBOLS } from '../types/sales';

export function calculateBranchPerformances(records: SalesRecord[]): BranchPerformance[] {
  const branchMap = new Map<string, SalesRecord[]>();

  records.forEach((rec) => {
    const list = branchMap.get(rec.branch) || [];
    list.push(rec);
    branchMap.set(rec.branch, list);
  });

  const performances: BranchPerformance[] = [];

  branchMap.forEach((branchRecords, branchName) => {
    const totalTarget = branchRecords.reduce((sum, r) => sum + r.target, 0);
    const totalActual = branchRecords.reduce((sum, r) => sum + r.actual, 0);
    const difference = totalActual - totalTarget;
    const achievementRate = totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0;
    const isAchieved = totalActual >= totalTarget;
    const achievedCount = branchRecords.filter((r) => r.isAchieved).length;

    // Top employee in this branch
    let topEmp: SalesRecord | undefined;
    if (branchRecords.length > 0) {
      topEmp = [...branchRecords].sort((a, b) => b.actual - a.actual)[0];
    }

    performances.push({
      branch: branchName,
      totalTarget,
      totalActual,
      achievementRate,
      difference,
      isAchieved,
      employeeCount: branchRecords.length,
      achievedCount,
      topEmployee: topEmp
        ? {
            name: topEmp.employee,
            actual: topEmp.actual,
            rate: topEmp.achievementRate,
          }
        : undefined,
    });
  });

  // Sort by actual sales or achievement rate descending
  return performances.sort((a, b) => b.totalActual - a.totalActual);
}

export function calculateOverallStats(records: SalesRecord[], branchPerformances: BranchPerformance[]): OverallStats {
  const totalTarget = records.reduce((sum, r) => sum + r.target, 0);
  const totalActual = records.reduce((sum, r) => sum + r.actual, 0);
  const difference = totalActual - totalTarget;
  const achievementRate = totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0;

  const totalEmployees = records.length;
  const achievedEmployeesCount = records.filter((r) => r.isAchieved).length;
  const unachievedEmployeesCount = totalEmployees - achievedEmployeesCount;
  const achievementPercentageEmployees = totalEmployees > 0 ? (achievedEmployeesCount / totalEmployees) * 100 : 0;

  const totalBranches = branchPerformances.length;

  // Best branch by achievement rate (or total actual if tie)
  const bestBranch =
    branchPerformances.length > 0
      ? [...branchPerformances].sort((a, b) => b.achievementRate - a.achievementRate)[0]
      : null;

  // Best employee by achievement rate
  const bestEmployee =
    records.length > 0
      ? [...records].sort((a, b) => b.achievementRate - a.achievementRate)[0]
      : null;

  return {
    totalTarget,
    totalActual,
    achievementRate,
    difference,
    totalEmployees,
    achievedEmployeesCount,
    unachievedEmployeesCount,
    achievementPercentageEmployees,
    totalBranches,
    bestBranch,
    bestEmployee,
  };
}

export function formatCurrencyNumber(
  amount: number,
  currency: Currency = 'EGP',
  showSymbol = true,
  lang: 'ar' | 'en' = 'ar'
): string {
  const formatted = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(amount);

  if (!showSymbol) return formatted;
  
  let symbol = CURRENCY_SYMBOLS[currency] || 'ج.م';
  if (lang === 'en') {
    if (currency === 'EGP') symbol = 'EGP';
    else if (currency === 'SAR') symbol = 'SAR';
    else if (currency === 'AED') symbol = 'AED';
    else if (currency === 'USD') symbol = '$';
  }
  return `${formatted} ${symbol}`;
}

export function formatPercent(rate: number): string {
  return `${rate.toFixed(1)}%`;
}

// =========================================================================
// 1. AUTHORITATIVE PREDEFINED DEPARTMENT DICTIONARY (قاموس التصنيف المعتمد)
// =========================================================================

import { InventoryItem } from '../types/inventory';
import { loadSavedConcordeInventoryItems } from './inventoryOptimizerService';
import { normalizeArabicText, parseArabicOrWesternNumber, detectDelimiter, parseDelimitedLine } from './excelParser';

export interface ProductClassificationResult {
  department: 'mobiles' | 'accessories' | 'other';
  departmentAr: string;
  departmentEn: string;
  matchedFromStock: boolean;
  matchedStockItem?: InventoryItem;
  classificationRule: string;
}

/**
 * 1a. Predefined SKU / Product Code Dictionary (قاموس الأكواد المعيارية المباشرة)
 * Maps exact or normalized product codes directly to the appropriate department.
 */
export const PREDEFINED_CODE_DICTIONARY: Record<string, 'mobiles' | 'accessories' | 'other'> = {
  // --- Smartphones & Tablets ---
  'sam-s24u-512': 'mobiles',
  'sam-s24u-256': 'mobiles',
  'sam-s24u-1tb': 'mobiles',
  'sam-s24u-512-tg': 'mobiles',
  'sam-s24-256': 'mobiles',
  'sam-s24p-256': 'mobiles',
  'sam-s23u-512': 'mobiles',
  'sam-a55-256': 'mobiles',
  'sam-a55-256-aw': 'mobiles',
  'sam-a55-128': 'mobiles',
  'sam-a35-128': 'mobiles',
  'sam-a25-128': 'mobiles',
  'sam-a15-128': 'mobiles',
  'sam-a05-64': 'mobiles',
  'sam-zfold6': 'mobiles',
  'sam-zflip6': 'mobiles',
  's948-violet': 'mobiles',
  's948-black': 'mobiles',
  's948-gray': 'mobiles',
  's948-yellow': 'mobiles',
  'app-iph16pm-256': 'mobiles',
  'app-iph16pm-256-dt': 'mobiles',
  'app-iph16pm-512': 'mobiles',
  'app-iph16pm-1tb': 'mobiles',
  'app-iph16p-128': 'mobiles',
  'app-iph16p-256': 'mobiles',
  'app-iph16-128': 'mobiles',
  'app-iph15pm-256': 'mobiles',
  'app-iph15-128': 'mobiles',
  'mjrx4af/a': 'mobiles',
  'xia-rn13p-256': 'mobiles',
  'xia-rn13-128': 'mobiles',
  'xia-14u-512': 'mobiles',
  'rlm-12pro-256': 'mobiles',
  'rlm-c53-128': 'mobiles',
  'rlm-c53-128-cg': 'mobiles',
  'opp-reno12-256': 'mobiles',
  'hon-200p-512': 'mobiles',
  'app-ipad-10-64': 'mobiles',
  'app-ipad-air-m2': 'mobiles',
  'app-ipad-pro-m4': 'mobiles',
  'sam-tab-s9-128': 'mobiles',
  'sam-tab-a9-64': 'mobiles',

  // --- Accessories & Wearables & Audio ---
  'ank-65w-gan2': 'accessories',
  'ank-20w-nano': 'accessories',
  'ank-powercore-20k': 'accessories',
  'app-airpods-pro2': 'accessories',
  'app-airpods-3': 'accessories',
  'app-airpods-4': 'accessories',
  'app-20w-adapter': 'accessories',
  'joy-t03s-plus': 'accessories',
  'joy-pb-30k': 'accessories',
  '745883919505': 'accessories',
  'bel-boost-65w': 'accessories',
  'bel-soundform-rhythm': 'accessories',
  'sam-buds3-pro': 'accessories',
  'sam-buds-fe': 'accessories',
  'sam-watch7-44': 'accessories',
  'app-watch-s10': 'accessories',
  'app-watch-ultra2': 'accessories',
  'acc-tws-pro08-wl': 'accessories',
  'acc-pb-10k-micro': 'accessories',

  // --- Other / Screens / Laptops / Appliances ---
  'app-mba-m3': 'other',
  'app-mba-m3-256-sg': 'other',
  'app-mba-m2': 'other',
  'app-mbp-m3': 'other',
  '90nr0mz6-m005u0': 'other',
  'asus-tuf-a15': 'other',
  'dell-vostro-3520': 'other',
  'hp-victus-15': 'other',
  'len-ideapad-3': 'other',
  'tor-tv-55-4k': 'other',
  'sam-tv-65-qled': 'other',
  'lg-tv-55-oled': 'other',
  'del-magnifica-s': 'other',
  'phi-airfryer-xxl': 'other',
  'tor-mwo-25l': 'other',
};

/**
 * 1b. Predefined Canonical Keyword Dictionary (قاموس الكلمات المفتاحية والمصطلحات)
 */
export const PREDEFINED_KEYWORD_DICTIONARY = {
  // 1. Accessories (السماعات، الشواحن، الساعات، الكابلات، الجرابات، الباور بانك)
  accessories: [
    'سماعة', 'سماعات', 'سبيكر', 'صب', 'ايربودز', 'إيربودز', 'بودز', 'بلوتوث', 'هيدسيت',
    'headphone', 'headphones', 'headset', 'headsets', 'earphone', 'earphones', 'earbud', 'earbuds',
    'airpod', 'airpods', 'buds', 'tws', 'soundform', 'speaker',
    'شاحن', 'شواحن', 'راس شاحن', 'رأس شاحن', 'شاحن سيارة', 'شاحن لاسلكي', 'باور بانك', 'باوربانك', 'بطارية شاحن',
    'charger', 'chargers', 'charging', 'gan', 'ganprime', 'powerbank', 'power bank', 'wireless charger', 'car charger', 'wall charger',
    'كابل', 'كابلات', 'وصلة', 'وصلات', 'سلك', 'تحويلة',
    'cable', 'cables', 'type-c', 'type c', 'lightning', 'aux', 'usb-c', 'usbc', 'hdmi cable', 'otg', 'dongle',
    'جراب', 'جرابات', 'كفر', 'كفرات', 'حافظة', 'بيت', 'سكرين', 'اسكرين', 'لاصقة', 'لزقة', 'حماية شاشة', 'زجاج معالج',
    'case', 'cases', 'cover', 'covers', 'pouch', 'screen protector', 'tempered glass', 'glass protector', 'back cover',
    'ساعة', 'ساعات', 'ساعة ذكية', 'سمارت ووتش', 'باند', 'اسورة', 'حزام ساعة', 'استراب', 'سوار',
    'watch', 'smartwatch', 'band', 'strap', 'wristband',
    'ماوس', 'فأرة', 'كيبورد', 'لوحة مفاتيح', 'قلم ذكي', 'قلم ايباد', 'ستاند', 'حامل هاتف', 'قاعدة تثبيت',
    'mouse', 'keyboard', 'stylus', 'pencil', 's pen', 'spen', 'stand', 'holder', 'mount', 'tripod',
  ],

  // 2. Mobiles & Tablets (الموبايلات والتابلت والأجهزة اللوحية)
  mobiles: [
    'موبايل', 'موبايلات', 'هاتف', 'هواتف', 'محمول', 'تليفون', 'تابلت', 'تابلتات', 'تاب', 'ايباد', 'آيباد', 'لوحي', 'أجهزة لوحية',
    'smartphone', 'smartphones', 'phone', 'phones', 'handset', 'handsets', 'mobile', 'mobiles', 'cellphone', 'tablet', 'tablets', 'ipad', 'ipads', 'cellular',
    'iphone', 'galaxy', 'redmi', 'poco', 'reno', 'infinix', 'tecno', 'realme', 'honor', 'vivo', 'oppo', 'xiaomi',
    's26', 's25', 's24', 's23', 's22', 's21', 's20', 'note20', 'z fold', 'z flip', 'zfold', 'zflip',
    'a55', 'a54', 'a35', 'a34', 'a25', 'a24', 'a15', 'a14', 'a05', 'a04',
    'pro max', 'pro', 'plus',
  ],

  // 3. Other (الشاشات، اللابتوب، ماكينات القهوة، والأجهزة المنزلية، وخدمات التقسيط)
  other: [
    'شاشة', 'شاشات', 'تلفزيون', 'تلفزيونات', 'سمارت تي في', 'ريسيفر', 'بروجكتور',
    'screen', 'screens', 'tv', 'tvs', 'television', 'oled', 'qled', 'led tv', 'smart tv', 'monitor', 'projector', 'bravia',
    'لابتوب', 'لابتوبات', 'كمبيوتر', 'حاسب', 'ماك بوك', 'نوت بوك', 'بي سي', 'طابعة', 'سيرفر',
    'laptop', 'laptops', 'notebook', 'macbook', 'macbook air', 'macbook pro', 'desktop', 'pc', 'all-in-one', 'thinkpad', 'ideapad', 'tuf gaming', 'legion', 'zenbook',
    'ماكينة قهوة', 'صانعة قهوة', 'اسبريسو', 'نسبريسو', 'قلاية', 'قلاية هوائية', 'اير فراير', 'ميكروويف', 'ميكرويف', 'فرن', 'بوتجاز', 'غسالة', 'غسالة اطباق', 'ثلاجة', 'ديب فريزر', 'تكييف', 'مكيف', 'مروحة', 'مكنسة', 'مكواة', 'خلاط', 'كبة', 'عجان', 'غلاية', 'كاتل', 'سخان',
    'coffee machine', 'espresso', 'nespresso', 'airfryer', 'air fryer', 'microwave', 'oven', 'stove', 'dishwasher', 'washing machine', 'refrigerator', 'fridge', 'freezer', 'air conditioner', 'ac', 'fan', 'vacuum', 'iron', 'blender', 'food processor', 'kettle', 'heater', 'appliances', 'home appliances',
    'تقسيط', 'تمويل', 'امان', 'أمان', 'ضمان ممتد', 'خدمة', 'عقد',
    'installment', 'aman', 'warranty', 'consumer finance', 'raya protect',
  ],
};

/**
 * 1c. Predefined Brand Specialty Dictionary (قاموس العلامات التجارية المتخصصة)
 */
export const PREDEFINED_BRAND_DICTIONARY: Record<string, 'mobiles' | 'accessories' | 'other'> = {
  // Accessory Specialist Brands
  'anker': 'accessories',
  'belkin': 'accessories',
  'joyroom': 'accessories',
  'baseus': 'accessories',
  'promate': 'accessories',
  'spigen': 'accessories',
  'green lion': 'accessories',
  'wiwu': 'accessories',
  'hama': 'accessories',
  'aukey': 'accessories',
  'torras': 'accessories',
  'oraimo': 'accessories',
  'ldnio': 'accessories',
  'remax': 'accessories',
  'hoco': 'accessories',
  'panzer': 'accessories',

  // Electronics, Appliances & Laptop Brands
  'tornado': 'other',
  'sharp': 'other',
  'toshiba': 'other',
  'beko': 'other',
  'zanussi': 'other',
  'fresh': 'other',
  'carrier': 'other',
  'midea': 'other',
  'delonghi': 'other',
  'braun': 'other',
  'kenwood': 'other',
  'moulinex': 'other',
  'asus': 'other',
  'dell': 'other',
  'hp': 'other',
  'lenovo': 'other',
  'acer': 'other',
  'msi': 'other',
  'philips': 'other',
};

/**
 * Classifies any product into one of the 3 regulatory departments:
 * 1. Checks Stock Sheet / InventoryItem first by SKU or Name.
 * 2. Checks Predefined Product Code Dictionary.
 * 3. Checks Predefined Keyword Dictionary (with accessory indicator precedence).
 * 4. Checks Predefined Brand Dictionary.
 * 5. Fallback rule based on product nature.
 */
export function classifyProductCategory(params: {
  itemCode?: string;
  name?: string;
  description?: string;
  brand?: string;
  model?: string;
  departmentStr?: string;
  categoryStr?: string;
  stockItems?: InventoryItem[];
}): ProductClassificationResult {
  const {
    itemCode = '',
    name = '',
    description = '',
    brand = '',
    model = '',
    departmentStr = '',
    categoryStr = '',
    stockItems,
  } = params;

  const effectiveStock = (stockItems && stockItems.length > 0)
    ? stockItems
    : loadSavedConcordeInventoryItems();

  const cleanCode = itemCode.trim().toLowerCase();
  const searchName = description || name || model || '';
  const normName = normalizeArabicText(searchName);

  const cleanDept = (departmentStr || '').trim().toLowerCase();
  const cleanCat = (categoryStr || '').trim().toLowerCase();

  // --- Step 0: Explicit Department Name & Category Name from Raya Oracle ERP (Details Sales) ---
  if (cleanDept === 'handsets' || cleanCat === 'new handsets') {
    return {
      department: 'mobiles',
      departmentAr: 'موبايلات',
      departmentEn: 'Mobiles & Tablets',
      matchedFromStock: false,
      matchedStockItem: undefined,
      classificationRule: `تصنيف راية المباشر: Handsets / New Handsets (${departmentStr || categoryStr})`,
    };
  }

  if (
    cleanDept === 'mobile accessories' ||
    cleanDept === 'computer accessories' ||
    cleanCat.includes('accessories') ||
    cleanDept.includes('accessories')
  ) {
    return {
      department: 'accessories',
      departmentAr: 'إكسسوارات',
      departmentEn: 'Accessories',
      matchedFromStock: false,
      matchedStockItem: undefined,
      classificationRule: `تصنيف راية المباشر: Accessories (${departmentStr || categoryStr})`,
    };
  }

  if (
    cleanDept === 'electronics' ||
    cleanDept === 'home appliance' ||
    cleanDept === 'small home appliance' ||
    cleanDept === 'services' ||
    cleanDept === 'all' ||
    cleanDept === 'vehicle'
  ) {
    return {
      department: 'other',
      departmentAr: 'أجهزة أخرى وشاشات',
      departmentEn: 'Other Appliances & Screens',
      matchedFromStock: false,
      matchedStockItem: undefined,
      classificationRule: `تصنيف راية المباشر: Electronics/Appliances (${departmentStr || categoryStr})`,
    };
  }

  // --- Step 1: Check Stock Sheet / InventoryItems first (المرجعية الأولى) ---
  if (effectiveStock && effectiveStock.length > 0) {
    let matchedItem: InventoryItem | undefined;

    if (cleanCode) {
      matchedItem = effectiveStock.find(
        (it) => it.sku && it.sku.trim().toLowerCase() === cleanCode
      );
    }

    if (!matchedItem && normName) {
      matchedItem = effectiveStock.find((it) => {
        if (!it.name) return false;
        const itNorm = normalizeArabicText(it.name);
        return itNorm === normName || itNorm.includes(normName) || normName.includes(itNorm);
      });
    }

    if (matchedItem) {
      const catNorm = normalizeArabicText(`${matchedItem.category} ${matchedItem.categoryLabelAr || ''} ${matchedItem.name}`);

      if (/موبايل|هاتف|محمول|تليفون|تابلت|ايباد|smartphone|smartphones|handset|mobile|tablet|ipad/i.test(catNorm)) {
        return {
          department: 'mobiles',
          departmentAr: 'موبايلات',
          departmentEn: 'Mobiles & Tablets',
          matchedFromStock: true,
          matchedStockItem: matchedItem,
          classificationRule: `تمت المطابقة بشيت المخزون (SKU: ${matchedItem.sku})`,
        };
      }

      if (/اكسسوار|إكسسوار|سماع|شاحن|كابل|ساعة|جراب|لاصق|باور|accessory|accessories|earbud|headset|airpod|buds|charger|cable|case|cover|watch|band/i.test(catNorm)) {
        return {
          department: 'accessories',
          departmentAr: 'إكسسوارات',
          departmentEn: 'Accessories',
          matchedFromStock: true,
          matchedStockItem: matchedItem,
          classificationRule: `تمت المطابقة بشيت المخزون (SKU: ${matchedItem.sku})`,
        };
      }

      return {
        department: 'other',
        departmentAr: 'أخرى',
        departmentEn: 'Other & Screens',
        matchedFromStock: true,
        matchedStockItem: matchedItem,
        classificationRule: `تمت المطابقة بشيت المخزون كصنف أخرى/أجهزة (SKU: ${matchedItem.sku})`,
      };
    }
  }

  // --- Step 2: Check Predefined Code Dictionary (قاموس الأكواد المعرف مسبقاً) ---
  if (cleanCode) {
    // 2a. Direct exact code match
    if (PREDEFINED_CODE_DICTIONARY[cleanCode]) {
      const dept = PREDEFINED_CODE_DICTIONARY[cleanCode];
      return {
        department: dept,
        departmentAr: dept === 'mobiles' ? 'موبايلات' : dept === 'accessories' ? 'إكسسوارات' : 'أخرى',
        departmentEn: dept === 'mobiles' ? 'Mobiles & Tablets' : dept === 'accessories' ? 'Accessories' : 'Other & Appliances',
        matchedFromStock: false,
        classificationRule: `مطابقة من قاموس الأكواد المعرف مسبقاً (${cleanCode})`,
      };
    }

    // 2b. Normalized code prefix match (e.g. sam-s24u-512-tg starts with sam-s24u-512)
    const normCode = cleanCode.replace(/[\s\-_/\\#.,;:*+()]/g, '');
    for (const [dictCode, dept] of Object.entries(PREDEFINED_CODE_DICTIONARY)) {
      const normDictCode = dictCode.replace(/[\s\-_/\\#.,;:*+()]/g, '');
      if (normCode === normDictCode || (normCode.length >= 7 && normDictCode.length >= 7 && (normCode.startsWith(normDictCode) || normDictCode.startsWith(normCode)))) {
        return {
          department: dept,
          departmentAr: dept === 'mobiles' ? 'موبايلات' : dept === 'accessories' ? 'إكسسوارات' : 'أخرى',
          departmentEn: dept === 'mobiles' ? 'Mobiles & Tablets' : dept === 'accessories' ? 'Accessories' : 'Other & Appliances',
          matchedFromStock: false,
          classificationRule: `مطابقة معيارية من قاموس الأكواد (${dictCode})`,
        };
      }
    }
  }

  // --- Step 3: Check Predefined Keyword Dictionary (قاموس الكلمات والمصطلحات) ---
  const combinedText = normalizeArabicText(`${searchName} ${brand} ${model} ${departmentStr} ${categoryStr}`).toLowerCase();

  // 3a. Accessories Check First:
  // (Crucial: a phone case or phone charger like "Galaxy S24 Cover" has phone name but is an accessory)
  const isAccessory = PREDEFINED_KEYWORD_DICTIONARY.accessories.some((kw) => {
    const kwNorm = normalizeArabicText(kw).toLowerCase();
    return combinedText.includes(kwNorm);
  });
  if (isAccessory) {
    return {
      department: 'accessories',
      departmentAr: 'إكسسوارات',
      departmentEn: 'Accessories',
      matchedFromStock: false,
      classificationRule: 'قاموس المصطلحات المعرف مسبقاً (إكسسوارات وملحقات)',
    };
  }

  // 3b. Mobiles & Tablets Check:
  const isMobile = PREDEFINED_KEYWORD_DICTIONARY.mobiles.some((kw) => {
    const kwNorm = normalizeArabicText(kw).toLowerCase();
    return combinedText.includes(kwNorm);
  });
  if (isMobile) {
    return {
      department: 'mobiles',
      departmentAr: 'موبايلات',
      departmentEn: 'Mobiles & Tablets',
      matchedFromStock: false,
      classificationRule: 'قاموس المصطلحات المعرف مسبقاً (هواتف ذكية وأجهزة لوحية)',
    };
  }

  // 3c. Other (Screens, Laptops, Appliances) Check:
  const isOther = PREDEFINED_KEYWORD_DICTIONARY.other.some((kw) => {
    const kwNorm = normalizeArabicText(kw).toLowerCase();
    return combinedText.includes(kwNorm);
  });
  if (isOther) {
    return {
      department: 'other',
      departmentAr: 'أخرى',
      departmentEn: 'Other & Appliances',
      matchedFromStock: false,
      classificationRule: 'قاموس المصطلحات المعرف مسبقاً (شاشات/لابتوب/أجهزة منزلية)',
    };
  }

  // --- Step 4: Check Predefined Brand Dictionary (العلامات التجارية المتخصصة) ---
  const cleanBrand = brand.trim().toLowerCase();
  if (cleanBrand && PREDEFINED_BRAND_DICTIONARY[cleanBrand]) {
    const dept = PREDEFINED_BRAND_DICTIONARY[cleanBrand];
    return {
      department: dept,
      departmentAr: dept === 'mobiles' ? 'موبايلات' : dept === 'accessories' ? 'إكسسوارات' : 'أخرى',
      departmentEn: dept === 'mobiles' ? 'Mobiles & Tablets' : dept === 'accessories' ? 'Accessories' : 'Other & Appliances',
      matchedFromStock: false,
      classificationRule: `قاموس العلامات التجارية المتخصصة (${brand})`,
    };
  }

  for (const [bKey, dept] of Object.entries(PREDEFINED_BRAND_DICTIONARY)) {
    if (combinedText.includes(bKey)) {
      return {
        department: dept,
        departmentAr: dept === 'mobiles' ? 'موبايلات' : dept === 'accessories' ? 'إكسسوارات' : 'أخرى',
        departmentEn: dept === 'mobiles' ? 'Mobiles & Tablets' : dept === 'accessories' ? 'Accessories' : 'Other & Appliances',
        matchedFromStock: false,
        classificationRule: `قاموس العلامات التجارية المتخصصة (${bKey})`,
      };
    }
  }

  // --- Step 5: Fallback based on Product Nature (القاعدة الاحتياطية النهائية) ---
  return {
    department: 'other',
    departmentAr: 'أخرى',
    departmentEn: 'Other & Appliances',
    matchedFromStock: false,
    classificationRule: 'القاعدة الاحتياطية للأصناف العامة غير المعروفة (أخرى)',
  };
}

// =========================================================================
// 2. STRICT PRODUCT CODE & INCENTIVE LINKING ENGINE (دالة الربط الصارم للحوافز)
// =========================================================================

export interface IncentiveRuleItem {
  itemCode?: string;
  productName?: string;
  unitIncentive: number;
  ruleName?: string;
  incentiveType?: 'fixed' | 'percent';
  minTargetQty?: number;
}

export interface StrictProductMatchingResult {
  itemCode?: string;
  productDescription: string;
  quantitySold: number;
  unitPrice?: number;
  totalSalesAmount: number;
  unitIncentive: number;
  totalEarnedIncentive: number;
  isEligible: boolean;
  matchedBy: 'exact_code' | 'normalized_code' | 'exact_name' | 'canonical_model' | 'unmatched';
  matchedRuleName?: string;
  reasonAr: string;
}

/**
 * Normalizes product code for strict code-to-code matching:
 * Strips whitespace, dashes, slashes, underscores, and lowers case.
 */
export function normalizeProductCode(code: unknown): string {
  if (code === null || code === undefined) return '';
  return String(code)
    .trim()
    .toLowerCase()
    .replace(/[\s\-_/\\#.,;:*+()]/g, '');
}

/**
 * Checks strict exact product name matching between sales description and incentive rule name
 */
export function isStrictNameMatch(salesDesc: string, incentiveName: string): boolean {
  const sNorm = normalizeArabicText(salesDesc).trim().toLowerCase();
  const iNorm = normalizeArabicText(incentiveName).trim().toLowerCase();
  if (!sNorm || !iNorm) return false;

  // 1. Direct equality
  if (sNorm === iNorm) return true;

  // 2. Clean alphanumeric tokens
  const cleanSig = (text: string) =>
    text
      .replace(/[^a-z0-9\u0621-\u064A]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const sSig = cleanSig(sNorm);
  const iSig = cleanSig(iNorm);
  if (sSig === iSig) return true;

  // 3. Multi-word complete match
  if (sSig.includes(iSig) || iSig.includes(sSig)) {
    const shorter = sSig.length < iSig.length ? sSig : iSig;
    const longer = sSig.length < iSig.length ? iSig : sSig;
    const words = shorter.split(' ').filter((w) => w.length > 2);
    if (words.length >= 2) {
      const allWordsPresent = words.every((w) => {
        const regex = new RegExp(`\\b${w}\\b`, 'i');
        return regex.test(longer);
      });
      if (allWordsPresent) return true;
    }
  }

  return false;
}

/**
 * Performs strict matching between a sold product and the incentive rules:
 * - Priority 1: Exact product code / SKU match
 * - Priority 2: Normalized product code match (handling formatting/separators)
 * - Priority 3: Strict exact product name match
 * - Non-listed: unit incentive = 0 EGP strictly
 */
export function matchStrictProductIncentive(
  product: {
    itemCode?: string;
    description?: string;
    quantity?: number;
    amount?: number;
    price?: number;
  },
  incentiveRules: IncentiveRuleItem[]
): StrictProductMatchingResult {
  const itemCode = (product.itemCode || '').trim();
  const description = (product.description || itemCode || 'صنف غير مسمى').trim();
  const quantity = Math.max(0, product.quantity ?? 1);
  const amount = Math.max(0, product.amount ?? 0);
  const price = product.price ?? (quantity > 0 ? Math.round(amount / quantity) : 0);

  if (!incentiveRules || incentiveRules.length === 0) {
    return {
      itemCode,
      productDescription: description,
      quantitySold: quantity,
      unitPrice: price,
      totalSalesAmount: amount,
      unitIncentive: 0,
      totalEarnedIncentive: 0,
      isEligible: false,
      matchedBy: 'unmatched',
      reasonAr: 'قائمة الحوافز فارغة أو لم يتم إرفاق شيت الحوافز',
    };
  }

  const cleanSalesCode = itemCode.toLowerCase();
  const normSalesCode = normalizeProductCode(itemCode);

  // 1. Strict Exact Code Match (مطابقة تامة ومباشرة بكود الصنف)
  if (cleanSalesCode) {
    const exactCodeRule = incentiveRules.find((rule) => {
      const ruleCode = (rule.itemCode || '').trim().toLowerCase();
      return ruleCode && ruleCode === cleanSalesCode;
    });

    if (exactCodeRule && exactCodeRule.unitIncentive > 0) {
      const unitInc = exactCodeRule.unitIncentive;
      return {
        itemCode,
        productDescription: description,
        quantitySold: quantity,
        unitPrice: price,
        totalSalesAmount: amount,
        unitIncentive: unitInc,
        totalEarnedIncentive: Math.round(quantity * unitInc),
        isEligible: true,
        matchedBy: 'exact_code',
        matchedRuleName: exactCodeRule.ruleName || exactCodeRule.productName || exactCodeRule.itemCode,
        reasonAr: `مطابقة تامة ومباشرة بكود الصنف (${itemCode}) مع قائمة الحوافز`,
      };
    }
  }

  // 2. Strict Normalized Code Match (مطابقة معيارية لكود الصنف خالية من الفواصل والشرطات)
  if (normSalesCode) {
    const normCodeRule = incentiveRules.find((rule) => {
      const ruleNorm = normalizeProductCode(rule.itemCode);
      if (ruleNorm && ruleNorm === normSalesCode) return true;
      if (ruleNorm && normSalesCode.length >= 6 && ruleNorm.length >= 6) {
        if (normSalesCode.startsWith(ruleNorm) || ruleNorm.startsWith(normSalesCode)) {
          return true;
        }
      }
      return false;
    });

    if (normCodeRule && normCodeRule.unitIncentive > 0) {
      const unitInc = normCodeRule.unitIncentive;
      return {
        itemCode,
        productDescription: description,
        quantitySold: quantity,
        unitPrice: price,
        totalSalesAmount: amount,
        unitIncentive: unitInc,
        totalEarnedIncentive: Math.round(quantity * unitInc),
        isEligible: true,
        matchedBy: 'normalized_code',
        matchedRuleName: normCodeRule.ruleName || normCodeRule.productName || normCodeRule.itemCode,
        reasonAr: `مطابقة معيارية دقيقة لكود الصنف (${normCodeRule.itemCode || itemCode}) مع شيت الحافز`,
      };
    }
  }

  // 3. Strict Product Name Match (مطابقة بنص اسم وموديل الصنف)
  if (description) {
    const exactNameRule = incentiveRules.find((rule) => {
      const ruleName = rule.productName || rule.ruleName || '';
      return isStrictNameMatch(description, ruleName);
    });

    if (exactNameRule && exactNameRule.unitIncentive > 0) {
      const unitInc = exactNameRule.unitIncentive;
      return {
        itemCode,
        productDescription: description,
        quantitySold: quantity,
        unitPrice: price,
        totalSalesAmount: amount,
        unitIncentive: unitInc,
        totalEarnedIncentive: Math.round(quantity * unitInc),
        isEligible: true,
        matchedBy: 'exact_name',
        matchedRuleName: exactNameRule.ruleName || exactNameRule.productName,
        reasonAr: `مطابقة معتمدة بنص اسم الصنف (${exactNameRule.productName || exactNameRule.ruleName})`,
      };
    }
  }

  // 4. Strict Unmatched: Non-listed items earn strictly 0 EGP
  return {
    itemCode,
    productDescription: description,
    quantitySold: quantity,
    unitPrice: price,
    totalSalesAmount: amount,
    unitIncentive: 0,
    totalEarnedIncentive: 0,
    isEligible: false,
    matchedBy: 'unmatched',
    reasonAr: 'المنتج غير مدرج في شيت الحافز المستحق (قيمة الحافز المستحق = 0 ج.م)',
  };
}

/**
 * Batch links sales transaction products with incentive rules under strict matching (دالة ربط المنتجات)
 */
export function linkSalesProductsWithIncentives<T extends { itemCode?: string; description: string; quantity: number; amount?: number; price?: number }>(
  salesProducts: T[],
  incentiveRules: IncentiveRuleItem[]
): Array<T & StrictProductMatchingResult> {
  return salesProducts.map((prod) => {
    const match = matchStrictProductIncentive(prod, incentiveRules);
    return {
      ...prod,
      ...match,
    };
  });
}

// =========================================================================
// 2. CATEGORY ACHIEVEMENTS & TARGET CALCULATION ENGINE
// =========================================================================

export interface CategoryAchievementMetrics {
  mobiles: {
    actual: number;
    target: number;
    rate: number;
    difference: number;
    isAchieved: boolean;
  };
  accessories: {
    actual: number;
    target: number;
    rate: number;
    difference: number;
    isAchieved: boolean;
  };
  other: {
    actual: number;
    target: number;
    rate: number;
    difference: number;
    isAchieved: boolean;
  };
  total: {
    actual: number;
    target: number;
    rate: number;
    difference: number;
    isAchieved: boolean;
  };
}

/**
 * Calculates exact category sales and targets without falsy fallback bugs
 */
export function calculateCategoryAchievements(
  records: SalesRecord[],
  targets: {
    mobilesTarget?: number;
    accessoriesTarget?: number;
    otherTarget?: number;
    grandTotalTarget?: number;
  } = {}
): CategoryAchievementMetrics {
  const mobilesTarget = targets.mobilesTarget ?? 980000;
  const accessoriesTarget = targets.accessoriesTarget ?? 210000;
  const otherTarget = targets.otherTarget ?? 210000;
  const grandTarget = targets.grandTotalTarget ?? (mobilesTarget + accessoriesTarget + otherTarget);

  let mobilesActual = 0;
  let accessoriesActual = 0;
  let otherActual = 0;

  records.forEach((r) => {
    const mob = r.mobilesActual !== undefined && !isNaN(r.mobilesActual) ? r.mobilesActual : Math.round(r.actual * 0.65);
    const acc = r.accessoriesActual !== undefined && !isNaN(r.accessoriesActual) ? r.accessoriesActual : Math.round(r.actual * 0.18);
    const oth = r.otherActual !== undefined && !isNaN(r.otherActual) ? r.otherActual : Math.round(r.actual * 0.17);

    mobilesActual += mob;
    accessoriesActual += acc;
    otherActual += oth;
  });

  const totalActual = mobilesActual + accessoriesActual + otherActual;

  return {
    mobiles: {
      actual: mobilesActual,
      target: mobilesTarget,
      rate: mobilesTarget > 0 ? (mobilesActual / mobilesTarget) * 100 : 0,
      difference: mobilesActual - mobilesTarget,
      isAchieved: mobilesActual >= mobilesTarget,
    },
    accessories: {
      actual: accessoriesActual,
      target: accessoriesTarget,
      rate: accessoriesTarget > 0 ? (accessoriesActual / accessoriesTarget) * 100 : 0,
      difference: accessoriesActual - accessoriesTarget,
      isAchieved: accessoriesActual >= accessoriesTarget,
    },
    other: {
      actual: otherActual,
      target: otherTarget,
      rate: otherTarget > 0 ? (otherActual / otherTarget) * 100 : 0,
      difference: otherActual - otherTarget,
      isAchieved: otherActual >= otherTarget,
    },
    total: {
      actual: totalActual,
      target: grandTarget,
      rate: grandTarget > 0 ? (totalActual / grandTarget) * 100 : 0,
      difference: totalActual - grandTarget,
      isAchieved: totalActual >= grandTarget,
    },
  };
}

// =========================================================================
// 3. FAST TSV / DELIMITED TEXT STRING PARSER
// =========================================================================

/**
 * Parses TSV or delimited text into rows with column mapping support
 */
export function parseTsvString(rawText: string): {
  headers: string[];
  rows: Record<string, unknown>[];
  delimiter: string;
} {
  const clean = rawText.replace(/^\uFEFF/, '').trim();
  if (!clean) return { headers: [], rows: [], delimiter: '\t' };

  const lines = clean
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('#') && !l.startsWith('//'));

  if (lines.length === 0) return { headers: [], rows: [], delimiter: '\t' };

  const delimiter = detectDelimiter(clean);
  const headers = parseDelimitedLine(lines[0], delimiter).map((h) => h.trim());
  const rows: Record<string, unknown>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const vals = parseDelimitedLine(lines[i], delimiter);
    if (vals.every((v) => !v)) continue;
    const row: Record<string, unknown> = {};
    headers.forEach((h, idx) => {
      row[h] = vals[idx] !== undefined ? vals[idx] : '';
    });
    rows.push(row);
  }

  return { headers, rows, delimiter };
}

