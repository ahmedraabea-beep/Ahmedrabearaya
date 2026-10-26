/**
 * GitHub REST API Service for Publishing Seed Data to Repository
 * Safely manages GitHub configuration in browser's localStorage only.
 * Generates seedData.ts and commits directly to trigger Vercel redeployment.
 */

import { AppStoreState } from '../store/DataStore';

export interface GitHubPublishSettings {
  token: string;
  owner: string;
  repo: string;
  branch: string;
  filePath: string;
}

export const DEFAULT_GITHUB_SETTINGS: GitHubPublishSettings = {
  token: '',
  owner: '',
  repo: '',
  branch: 'main',
  filePath: 'src/seedData.ts',
};

const GITHUB_SETTINGS_STORAGE_KEY = 'raya_github_publish_settings_v1';

/**
 * Loads settings from localStorage safely (token is never hardcoded)
 */
export function getGitHubSettings(): GitHubPublishSettings {
  if (typeof window === 'undefined') return DEFAULT_GITHUB_SETTINGS;
  try {
    const raw = localStorage.getItem(GITHUB_SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_GITHUB_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      token: typeof parsed.token === 'string' ? parsed.token : '',
      owner: typeof parsed.owner === 'string' ? parsed.owner : '',
      repo: typeof parsed.repo === 'string' ? parsed.repo : '',
      branch: typeof parsed.branch === 'string' && parsed.branch.trim() ? parsed.branch.trim() : 'main',
      filePath: typeof parsed.filePath === 'string' && parsed.filePath.trim() ? parsed.filePath.trim() : 'src/seedData.ts',
    };
  } catch {
    return DEFAULT_GITHUB_SETTINGS;
  }
}

/**
 * Saves settings to localStorage only
 */
export function saveGitHubSettings(settings: GitHubPublishSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(GITHUB_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save GitHub settings to localStorage:', err);
  }
}

/**
 * Clears the stored token from localStorage
 */
export function clearGitHubToken(): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getGitHubSettings();
    saveGitHubSettings({ ...current, token: '' });
  } catch (err) {
    console.error('Failed to clear GitHub token:', err);
  }
}

/**
 * Masks a GitHub token for safe display (never reveals full token in UI)
 */
export function maskToken(token: string): string {
  if (!token) return '';
  const trimmed = token.trim();
  if (trimmed.length <= 8) return '••••••••';
  return `${trimmed.slice(0, 4)}••••••••••••${trimmed.slice(-4)}`;
}

/**
 * Converts a UTF-8 string to base64 safely, supporting full Arabic text
 */
export function utf8ToBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Decodes base64 back to UTF-8 safely
 */
export function base64ToUtf8(b64: string): string {
  const cleanB64 = b64.replace(/\s/g, '');
  const binary = atob(cleanB64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

/**
 * Generates the complete, pristine TypeScript content for src/seedData.ts
 * Never contains any PAT tokens, credentials, or sensitive secrets.
 */
export function generateSeedFileContent(storeState: AppStoreState, nextVersion: number): string {
  const now = new Date().toISOString();

  const safeData = {
    records: storeState.records || [],
    targets: storeState.targets || {},
    incentiveRules: storeState.incentiveRules || [],
    targetAllocation: storeState.targetAllocation || null,
    shifts: storeState.shifts || [],
    inventoryItems: storeState.inventoryItems || [],
    retention: storeState.retention || [],
    notificationSettings: {
      pushEnabled: storeState.notificationSettings?.pushEnabled ?? false,
      soundEnabled: storeState.notificationSettings?.soundEnabled ?? true,
      notifyOnNear90: storeState.notificationSettings?.notifyOnNear90 ?? true,
      notifyOn100: storeState.notificationSettings?.notifyOn100 ?? true,
      notifyOnDeviation20: storeState.notificationSettings?.notifyOnDeviation20 ?? true,
      autoEmailOn100: storeState.notificationSettings?.autoEmailOn100 ?? false,
      managerEmail: storeState.notificationSettings?.managerEmail || 'concorde.branch@rayatrade.com',
    },
    settings: {
      language: storeState.settings?.language || 'ar',
      currency: storeState.settings?.currency || 'EGP',
      vatDisplayMode: storeState.settings?.vatDisplayMode || 'afterVat',
      vatMode: storeState.settings?.vatMode || 'afterVat',
    },
    lastUpdated: now,
  };

  return `/**
 * AUTO-GENERATED SEED DATA FILE FOR PRODUCTION & VERCEL DEPLOYMENTS
 * Generated on: ${now}
 * Seed Version: ${nextVersion}
 * 
 * This file is automatically deployed to GitHub to trigger Vercel rebuilds with updated data.
 * All sensitive credentials and tokens are strictly excluded.
 */

import { SalesRecord, BranchTotalTargetStructure, ProductIncentiveRule } from './types/sales';

export const SEED_VERSION = ${nextVersion};
export const SEED_UPDATED_AT = ${JSON.stringify(now)};

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

export const SEED_STORE_DATA: SeedStoreData = ${JSON.stringify(safeData, null, 2)};
`;
}

export interface PublishResult {
  success: boolean;
  commitUrl?: string;
  commitSha?: string;
  version?: number;
  error?: string;
}

/**
 * Publishes the latest app data to the GitHub repository seed file
 * using GitHub REST API:
 * 1. GET /repos/{owner}/{repo}/contents/{path}?ref={branch} to get sha & current SEED_VERSION
 * 2. PUT /repos/{owner}/{repo}/contents/{path} with base64 content
 */
export async function publishSeedDataToGitHub(
  settings: GitHubPublishSettings,
  storeState: AppStoreState
): Promise<PublishResult> {
  const token = settings.token.trim();
  const owner = settings.owner.trim();
  const repo = settings.repo.trim();
  const branch = (settings.branch || 'main').trim();
  const filePath = (settings.filePath || 'src/seedData.ts').trim().replace(/^\//, '');

  if (!token) {
    return {
      success: false,
      error: 'يرجى إدخال رمز الوصول الشخصي (GitHub Personal Access Token) أولاً.',
    };
  }

  if (!owner) {
    return {
      success: false,
      error: 'يرجى إدخال اسم مالك المستودع (Repository Owner / Username).',
    };
  }

  if (!repo) {
    return {
      success: false,
      error: 'يرجى إدخال اسم المستودع (Repository Name).',
    };
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  };

  let existingSha: string | undefined = undefined;
  let nextVersion = 1;

  // Step 1: Read existing file to retrieve current sha and calculate next SEED_VERSION
  try {
    const getRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${encodeURIComponent(branch)}`,
      { headers }
    );

    if (getRes.status === 401) {
      return {
        success: false,
        error: 'رمز الوصول الشخصي (Token) غير صالح أو منتهي الصلاحية (401 Unauthorized). تأكد من صحة الرمز.',
      };
    }

    if (getRes.status === 403) {
      const errJson = await getRes.json().catch(() => ({}));
      return {
        success: false,
        error: `لا تملك صلاحية الوصول إلى المستودع: ${errJson.message || '403 Forbidden'}. تأكد من تفعيل صلاحية "repo" أو "Contents: Read and write".`,
      };
    }

    if (getRes.ok) {
      const fileData = await getRes.json();
      existingSha = fileData.sha;
      if (fileData.content) {
        try {
          const existingText = base64ToUtf8(fileData.content);
          const match = existingText.match(/export const SEED_VERSION\s*=\s*(\d+);/);
          if (match && match[1]) {
            const parsedVer = parseInt(match[1], 10);
            if (!isNaN(parsedVer)) {
              nextVersion = parsedVer + 1;
            }
          }
        } catch {
          nextVersion = 2;
        }
      }
    } else if (getRes.status !== 404) {
      const errJson = await getRes.json().catch(() => ({}));
      return {
        success: false,
        error: `فشل التحقق من ملف المستودع (${getRes.status}): ${errJson.message || getRes.statusText}`,
      };
    }
  } catch (err: any) {
    return {
      success: false,
      error: `تعذر الاتصال بـ GitHub API: ${err.message || 'خطأ في الشبكة'}. يرجى التحقق من اتصالك بالإنترنت.`,
    };
  }

  // Step 2: Generate the seed file content
  const seedCode = generateSeedFileContent(storeState, nextVersion);
  const base64Code = utf8ToBase64(seedCode);

  const commitDateStr = new Date().toLocaleString('ar-EG', {
    timeZone: 'Africa/Cairo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
  const commitMessage = `Update seed data - ${commitDateStr} (v${nextVersion})`;

  // Step 3: Send PUT request to GitHub contents API
  try {
    const putPayload: Record<string, any> = {
      message: commitMessage,
      content: base64Code,
      branch,
    };
    if (existingSha) {
      putPayload.sha = existingSha;
    }

    const putRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`,
      {
        method: 'PUT',
        headers,
        body: JSON.stringify(putPayload),
      }
    );

    if (putRes.status === 401) {
      return {
        success: false,
        error: 'فشل التوثيق (401 Unauthorized): رمز الوصول غير مسموح له بإجراء Commit.',
      };
    }

    if (putRes.status === 403) {
      const errJson = await putRes.json().catch(() => ({}));
      return {
        success: false,
        error: `صلاحيات الكتابة غير كافية (403 Forbidden): ${errJson.message || 'تأكد من إعطاء الرمز صلاحيات Write للمستودع'}.`,
      };
    }

    if (putRes.status === 404) {
      const errJson = await putRes.json().catch(() => ({}));
      return {
        success: false,
        error: `المستودع أو الفرع غير موجود (404 Not Found): ${owner}/${repo} على الفرع ${branch}. تأكد من كتابة الاسم بدقة.`,
      };
    }

    if (!putRes.ok) {
      const errJson = await putRes.json().catch(() => ({}));
      return {
        success: false,
        error: `خطأ أثناء حفظ الملف في GitHub (${putRes.status}): ${errJson.message || putRes.statusText}`,
      };
    }

    const putData = await putRes.json();
    const commitUrl =
      putData.commit?.html_url ||
      `https://github.com/${owner}/${repo}/commit/${putData.commit?.sha || ''}`;

    return {
      success: true,
      commitUrl,
      commitSha: putData.commit?.sha,
      version: nextVersion,
    };
  } catch (err: any) {
    return {
      success: false,
      error: `حدث خطأ أثناء إجراء Commit في GitHub: ${err.message || 'خطأ غير معروف'}`,
    };
  }
}

/**
 * Alias export for publishToGitHub
 */
export const publishToGitHub = publishSeedDataToGitHub;

