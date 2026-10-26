import React, { useState, useEffect } from 'react';
import { useDataStore } from '../store/DataStore';
import {
  GitHubPublishSettings,
  getGitHubSettings,
  saveGitHubSettings,
  clearGitHubToken,
  maskToken,
  publishSeedDataToGitHub,
  generateSeedFileContent,
  PublishResult,
} from '../utils/githubPublishService';
import {
  Github,
  KeyRound,
  Eye,
  EyeOff,
  GitBranch,
  FolderGit2,
  FileCode,
  Save,
  Trash2,
  Send,
  Copy,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  ShieldCheck,
  HelpCircle,
  Sparkles,
} from 'lucide-react';

export { GitHubSettings } from './GitHubSettings';

interface GitHubPublishSectionProps {
  language: 'ar' | 'en';
}

export const GitHubPublishSection: React.FC<GitHubPublishSectionProps> = ({ language }) => {
  const isAr = language === 'ar';
  const { state } = useDataStore();

  const [settings, setSettings] = useState<GitHubPublishSettings>(() => getGitHubSettings());
  const [showToken, setShowToken] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Publishing State
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<PublishResult | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // Sync settings from localStorage on mount
  useEffect(() => {
    setSettings(getGitHubSettings());
  }, []);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    saveGitHubSettings(settings);
    setSaveStatus(isAr ? 'تم حفظ إعدادات GitHub بنجاح في متصفحك!' : 'GitHub settings saved successfully!');
    setTimeout(() => setSaveStatus(null), 3500);
  };

  const handleClearToken = () => {
    if (
      window.confirm(
        isAr
          ? 'هل أنت متأكد من مسح رمز الوصول الشخصي (Token) من هذا المتصفح؟'
          : 'Are you sure you want to clear the GitHub token from this browser?'
      )
    ) {
      clearGitHubToken();
      setSettings((prev) => ({ ...prev, token: '' }));
      setSaveStatus(isAr ? 'تم مسح رمز الوصول من المتصفح.' : 'Token removed from browser.');
      setTimeout(() => setSaveStatus(null), 3500);
    }
  };

  const handleStartPublish = () => {
    if (!settings.token.trim()) {
      alert(isAr ? 'يرجى إدخال رمز الوصول الشخصي (GitHub PAT) أولاً.' : 'Please enter your GitHub Personal Access Token.');
      return;
    }
    if (!settings.owner.trim() || !settings.repo.trim()) {
      alert(isAr ? 'يرجى ملء اسم المالك واسم المستودع.' : 'Please enter the repository owner and repository name.');
      return;
    }
    setPublishResult(null);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmPublish = async () => {
    setIsConfirmModalOpen(false);
    setIsPublishing(true);
    setPublishResult(null);

    // Auto-save settings first
    saveGitHubSettings(settings);

    try {
      const res = await publishSeedDataToGitHub(settings, state);
      setPublishResult(res);
    } catch (err: any) {
      setPublishResult({
        success: false,
        error: err.message || (isAr ? 'حدث خطأ غير متوقع أثناء النشر' : 'Unexpected error during publish'),
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleCopySeedFile = () => {
    try {
      const code = generateSeedFileContent(state, 1);
      navigator.clipboard.writeText(code);
      setCopyFeedback(
        isAr
          ? 'تم نسخ محتوى ملف seedData.ts إلى الحافظة بنجاح! يمكنك لصقه يدوياً في المستودع.'
          : 'Seed file code copied to clipboard successfully!'
      );
      setTimeout(() => setCopyFeedback(null), 4000);
    } catch {
      setCopyFeedback(isAr ? 'تعذر النسخ التلقائي إلى الحافظة.' : 'Could not copy to clipboard.');
      setTimeout(() => setCopyFeedback(null), 4000);
    }
  };

  const isConfigured = Boolean(settings.token.trim() && settings.owner.trim() && settings.repo.trim());

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6 md:col-span-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-md shadow-slate-900/20">
            <Github className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">
                {isAr ? 'النشر التلقائي إلى GitHub و Vercel' : 'Publish to GitHub & Auto-Deploy on Vercel'}
              </h2>
              {isConfigured ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{isAr ? 'جاهز للنشر' : 'Ready'}</span>
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                  {isAr ? 'بحاجة للتهيئة' : 'Needs Setup'}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {isAr
                ? 'حفظ بيانات الفرع الحالية مباشرة في ملف الـ Seed بمستودع GitHub ليعيد Vercel البناء والنشر تلقائياً بأحدث البيانات.'
                : 'Commits current app state into the repo seed file via GitHub API so Vercel redeploys automatically with fresh data.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Fallback Copy Button */}
          <button
            type="button"
            onClick={handleCopySeedFile}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border border-slate-200"
            title={isAr ? 'نسخ محتوى ملف seedData.ts يدوياً' : 'Copy seedData.ts to clipboard'}
          >
            <Copy className="w-3.5 h-3.5 text-slate-500" />
            <span>{isAr ? 'نسخ كملف Seed (يدوي)' : 'Copy as Seed File'}</span>
          </button>
        </div>
      </div>

      {/* Copy Feedback Banner */}
      {copyFeedback && (
        <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-medium flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
          <span>{copyFeedback}</span>
        </div>
      )}

      {/* Save Status Banner */}
      {saveStatus && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveStatus}</span>
        </div>
      )}

      {/* Publishing Status Banner */}
      {publishResult && (
        <div
          className={`p-4 rounded-xl text-xs font-medium border animate-fade-in ${
            publishResult.success
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          {publishResult.success ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 font-bold text-emerald-800 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  {isAr
                    ? `تم النشر بنجاح إلى GitHub! (الإصدار SEED_VERSION: ${publishResult.version})`
                    : `Published successfully to GitHub! (Version: v${publishResult.version})`}
                </span>
              </div>
              <p className="text-emerald-700 leading-relaxed">
                {isAr
                  ? 'تم تحديث ملف البيانات في المستودع بنجاح. سيقوم Vercel تلقائياً خلال دقيقة واحدة بإعادة بناء ونشر التطبيق بالبيانات الجديدة لجميع المستخدمين.'
                  : 'The seed file was committed. Vercel will automatically redeploy the latest app data in ~1 minute.'}
              </p>
              {publishResult.commitUrl && (
                <div className="pt-1">
                  <a
                    href={publishResult.commitUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs transition"
                  >
                    <span>{isAr ? 'عرض الـ Commit على GitHub' : 'View Commit on GitHub'}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold text-red-800 block text-xs">
                  {isAr ? 'فشل النشر إلى GitHub:' : 'Failed to publish to GitHub:'}
                </span>
                <span className="text-red-700 block leading-relaxed">{publishResult.error}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Configuration Form */}
      <form onSubmit={handleSaveSettings} className="space-y-4">
        {/* Token Input with Show/Hide & Masking */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-slate-400" />
              <span>GitHub Personal Access Token (PAT)</span>
            </label>
            {settings.token.trim() && (
              <span className="text-[10px] text-slate-400 font-mono">
                {maskToken(settings.token)}
              </span>
            )}
          </div>
          <div className="relative">
            <input
              type={showToken ? 'text' : 'password'}
              value={settings.token}
              onChange={(e) => setSettings({ ...settings, token: e.target.value })}
              placeholder={isAr ? 'مثال: ghp_xxxxxxxxxxxxxxxxxxxx' : 'e.g. ghp_xxxxxxxxxxxxxxxxxxxx'}
              className="w-full text-xs px-3.5 py-2.5 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              autoComplete="off"
            />
            <button
              type="button"
              onClick={() => setShowToken(!showToken)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              title={showToken ? (isAr ? 'إخفاء الرمز' : 'Hide') : isAr ? 'إظهار الرمز' : 'Show'}
            >
              {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>
              {isAr
                ? 'يُحفظ الرمز في متصفحك فقط (localStorage) ولا يُرسل أبداً في الكود أو ملف البيانات. يحتاج صلاحية "repo" أو "Contents: Read and write".'
                : 'Stored locally in your browser only (never in code or seed file). Requires "repo" or "Contents: Read and write" scope.'}
            </span>
          </p>
        </div>

        {/* Repository Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Owner */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
              <FolderGit2 className="w-3.5 h-3.5 text-slate-400" />
              <span>{isAr ? 'مالك المستودع (Owner)' : 'Repo Owner'}</span>
            </label>
            <input
              type="text"
              value={settings.owner}
              onChange={(e) => setSettings({ ...settings, owner: e.target.value })}
              placeholder={isAr ? 'مثال: AhmedRaabea' : 'e.g. AhmedRaabea'}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Repo Name */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
              <Github className="w-3.5 h-3.5 text-slate-400" />
              <span>{isAr ? 'اسم المستودع (Repo)' : 'Repo Name'}</span>
            </label>
            <input
              type="text"
              value={settings.repo}
              onChange={(e) => setSettings({ ...settings, repo: e.target.value })}
              placeholder={isAr ? 'مثال: raya-concorde-plaza' : 'e.g. raya-concorde-plaza'}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Branch */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
              <GitBranch className="w-3.5 h-3.5 text-slate-400" />
              <span>{isAr ? 'الفرع (Branch)' : 'Branch'}</span>
            </label>
            <input
              type="text"
              value={settings.branch}
              onChange={(e) => setSettings({ ...settings, branch: e.target.value })}
              placeholder="main"
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Seed File Path */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
              <FileCode className="w-3.5 h-3.5 text-slate-400" />
              <span>{isAr ? 'مسار الملف (Seed Path)' : 'Seed File Path'}</span>
            </label>
            <input
              type="text"
              value={settings.filePath}
              onChange={(e) => setSettings({ ...settings, filePath: e.target.value })}
              placeholder="src/seedData.ts"
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Buttons Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isAr ? 'حفظ إعدادات GitHub' : 'Save Settings'}</span>
            </button>

            {settings.token && (
              <button
                type="button"
                onClick={handleClearToken}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-600 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border border-slate-200 hover:border-red-200"
                title={isAr ? 'مسح رمز الوصول من المتصفح' : 'Clear token from browser'}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isAr ? 'مسح الرمز (Clear Token)' : 'Clear Token'}</span>
              </button>
            )}
          </div>

          {/* Main Action Button: Publish to GitHub */}
          <button
            type="button"
            onClick={handleStartPublish}
            disabled={isPublishing || !isConfigured}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-md ${
              isConfigured && !isPublishing
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/20 hover:scale-[1.01]'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
            }`}
          >
            {isPublishing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{isAr ? 'جارِ النشر إلى GitHub...' : 'Publishing to GitHub...'}</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>{isAr ? 'نشر إلى GitHub الآن (Publish to GitHub)' : 'Publish to GitHub'}</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Confirmation Modal */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in" dir={isAr ? 'rtl' : 'ltr'}>
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Github className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {isAr ? 'تأكيد نشر البيانات إلى GitHub' : 'Confirm Publishing to GitHub'}
                </h3>
                <p className="text-xs text-slate-500">
                  {isAr ? 'سيتم إجراء Commit مباشر في المستودع لإطلاق نشر Vercel' : 'This will commit the seed file to trigger a Vercel redeploy'}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs space-y-2 font-medium text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500">{isAr ? 'المستودع المستهدف:' : 'Repository:'}</span>
                <span className="font-mono font-bold text-slate-900">{settings.owner}/{settings.repo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{isAr ? 'الفرع:' : 'Branch:'}</span>
                <span className="font-mono font-bold text-slate-900">{settings.branch}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{isAr ? 'مسار الملف:' : 'File Path:'}</span>
                <span className="font-mono text-slate-800">{settings.filePath}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between">
                <span className="text-slate-500">{isAr ? 'عدد سجلات المبيعات الحالية:' : 'Current Sales Records:'}</span>
                <span className="font-bold text-emerald-700">{state.records.length} {isAr ? 'سجل' : 'records'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{isAr ? 'الفترات المستهدفة (Targets):' : 'Targets:'}</span>
                <span className="font-bold text-purple-700">{Object.keys(state.targets).length} {isAr ? 'شهر' : 'months'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{isAr ? 'قواعد الحوافز المسجلة:' : 'Incentive Rules:'}</span>
                <span className="font-bold text-blue-700">{state.incentiveRules.length} {isAr ? 'قاعدة' : 'rules'}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              {isAr
                ? 'ملاحظة: سيتم زيادة رقم SEED_VERSION تلقائياً بمقدار 1، وعند انتهاء البناء على Vercel، ستصل البيانات الجديدة لجميع متصفحي الموقع تلقائياً.'
                : 'Note: SEED_VERSION will increment automatically so all clients will hydrate with this new seed on Vercel.'}
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmPublish}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-md"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isAr ? 'تأكيد النشر والبدء' : 'Confirm & Publish'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
