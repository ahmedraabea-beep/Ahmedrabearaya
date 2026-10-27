/**
 * Brand Normalization Utility for Raya Concorde Plaza
 * Unifies brand variations, Arabic diacritics, and casing into canonical brand names.
 */

export interface BrandMapping {
  canonical: string;
  aliases: string[];
}

export const DEFAULT_BRAND_MAPPINGS: BrandMapping[] = [
  {
    canonical: 'Samsung',
    aliases: ['samsung', 'سامسونج', 'سامسونغ', 'galaxy', 'جالكسي', 'جلاكسي', 'سامسونك'],
  },
  {
    canonical: 'Apple',
    aliases: ['apple', 'ابل', 'آبل', 'ايفون', 'آيفون', 'iphone', 'ipad', 'ايباد', 'airpods', 'ايربودز'],
  },
  {
    canonical: 'Xiaomi',
    aliases: ['xiaomi', 'شاومي', 'redmi', 'ريدمي', 'poco', 'بوكو', 'mi', 'شياومي'],
  },
  {
    canonical: 'Oppo',
    aliases: ['oppo', 'اوبو', 'أوبو', 'اوبّو'],
  },
  {
    canonical: 'Realme',
    aliases: ['realme', 'ريلمي', 'ريل مي', 'ريلمى'],
  },
  {
    canonical: 'Honor',
    aliases: ['honor', 'هونر', 'اونر', 'أونر'],
  },
  {
    canonical: 'Huawei',
    aliases: ['huawei', 'هواوي', 'هواوى'],
  },
  {
    canonical: 'Infinix',
    aliases: ['infinix', 'انفينكس', 'انفنيكس', 'انفينيكس'],
  },
  {
    canonical: 'Dell',
    aliases: ['dell', 'ديل', 'دل'],
  },
  {
    canonical: 'HP',
    aliases: ['hp', 'اتش بي', 'اتش_بي', 'h.p'],
  },
  {
    canonical: 'Lenovo',
    aliases: ['lenovo', 'لينوفو', 'لينوفوا'],
  },
  {
    canonical: 'LG',
    aliases: ['lg', 'ال جي', 'ال_جي', 'إل جي', 'إل_جي'],
  },
  {
    canonical: 'Toshiba',
    aliases: ['toshiba', 'توشيبا', 'توشيبى'],
  },
  {
    canonical: 'Midea',
    aliases: ['midea', 'ميديا', 'ميديا_توشيبا'],
  },
  {
    canonical: 'Beko',
    aliases: ['beko', 'بيكو'],
  },
  {
    canonical: 'Shield',
    aliases: ['shield', 'شيلد', 'ضمان شيلد', 'shield warranty'],
  },
  {
    canonical: 'Sony',
    aliases: ['sony', 'سوني', 'بلايستيشن', 'playstation'],
  },
  {
    canonical: 'JBL',
    aliases: ['jbl', 'جي بي ال', 'جي_بي_ال'],
  },
  {
    canonical: 'Anker',
    aliases: ['anker', 'انكر', 'أنكر'],
  },
  {
    canonical: 'Oraimo',
    aliases: ['oraimo', 'اورايمو', 'أورايمو'],
  },
];

const STORAGE_KEY = 'raya_brand_normalization_rules_v1';

/**
 * Clean text for robust matching by removing diacritics and normalizing Arabic letters.
 */
export function cleanBrandToken(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .trim()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/[ىي]/g, 'ي')
    .replace(/[ـ\-_.]/g, ' ')
    .replace(/\s+/g, ' ');
}

/**
 * Load active brand mappings from localStorage with default fallbacks
 */
export function getActiveBrandMappings(): BrandMapping[] {
  if (typeof window === 'undefined') return DEFAULT_BRAND_MAPPINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_BRAND_MAPPINGS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_BRAND_MAPPINGS;
  } catch {
    return DEFAULT_BRAND_MAPPINGS;
  }
}

/**
 * Save brand mappings
 */
export function saveBrandMappings(mappings: BrandMapping[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mappings));
  } catch {
    // ignore
  }
}

/**
 * Normalize an arbitrary brand string to its canonical official name
 */
export function normalizeBrandName(rawBrand?: string | null): string {
  if (!rawBrand || typeof rawBrand !== 'string') return 'Other';
  const clean = cleanBrandToken(rawBrand);
  if (!clean) return 'Other';

  const mappings = getActiveBrandMappings();

  for (const m of mappings) {
    const canonicalClean = cleanBrandToken(m.canonical);
    if (clean === canonicalClean) {
      return m.canonical;
    }
    for (const alias of m.aliases) {
      const aliasClean = cleanBrandToken(alias);
      if (clean === aliasClean || clean.includes(aliasClean)) {
        return m.canonical;
      }
    }
  }

  // Capitalize first letter if unknown
  return rawBrand.trim().charAt(0).toUpperCase() + rawBrand.trim().slice(1);
}
