import React, { useState, useMemo } from 'react';
import {
  X,
  Copy,
  Check,
  Download,
  Sparkles,
  FileText,
  FileSpreadsheet,
  Layers,
  ArrowRight,
  HelpCircle,
  AlertCircle,
  CheckCircle2,
  FileCode,
  Send,
  Zap,
  RotateCcw,
  BookOpen,
  Terminal,
  ExternalLink,
} from 'lucide-react';
import {
  UNIFIED_IMPORT_SCHEMA,
  buildExternalAiFormattingPrompt,
  parseUnifiedRawData,
  downloadAiFormattingPromptFile,
  UnifiedParseResult,
  PromptGenerationOptions,
} from '../utils/unifiedDataImport';
import {
  downloadSampleExcelTemplate,
  downloadSampleSalesCsvTemplate,
  downloadSampleSalesTxtTemplate,
} from '../utils/excelParser';
import { SalesRecord, Currency, Language } from '../types/sales';
import { formatCurrencyNumber } from '../utils/calculations';
import { triggerCelebrationConfetti } from '../utils/confetti';

interface UnifiedAiPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportRecords: (records: SalesRecord[], mode: 'replace' | 'append') => void;
  currency: Currency;
  language: Language;
  currentBranchName?: string;
  currentPeriod?: string;
}

export const UnifiedAiPromptModal: React.FC<UnifiedAiPromptModalProps> = ({
  isOpen,
  onClose,
  onImportRecords,
  currency,
  language,
  currentBranchName = 'فرع راية كونكورد بلازا',
  currentPeriod = 'أكتوبر 2026',
}) => {
  const isAr = language === 'ar';

  const [activeTab, setActiveTab] = useState<'prompt' | 'paste' | 'schema'>('prompt');

  // Prompt Builder options
  const [format, setFormat] = useState<'tsv' | 'csv' | 'json' | 'markdown'>('tsv');
  const [includeVat, setIncludeVat] = useState(true);
  const [includeCategories, setIncludeCategories] = useState(true);
  const [periodInput, setPeriodInput] = useState(currentPeriod);
  const [branchInput, setBranchInput] = useState(currentBranchName);
  const [customNotes, setCustomNotes] = useState('');
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  // Direct Paste & Import State
  const [pastedText, setPastedText] = useState('');
  const [parseResult, setParseResult] = useState<UnifiedParseResult | null>(null);
  const [importMode, setImportMode] = useState<'replace' | 'append'>('replace');
  const [isImportSuccess, setIsImportSuccess] = useState(false);

  // Generated Prompt Memo
  const generatedPrompt = useMemo(() => {
    return buildExternalAiFormattingPrompt({
      format,
      targetBranchName: branchInput.trim() || currentBranchName,
      targetPeriod: periodInput.trim() || currentPeriod,
      includeCategories,
      includeVatBreakdown: includeVat,
      includeCustomContext: customNotes.trim(),
    });
  }, [format, branchInput, periodInput, includeCategories, includeVat, customNotes, currentBranchName, currentPeriod]);

  if (!isOpen) return null;

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(generatedPrompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 3000);
  };

  const handleDownloadPromptFile = () => {
    downloadAiFormattingPromptFile(generatedPrompt, `raya_ai_formatting_prompt_${format}.txt`);
  };

  const handleAnalyzePastedText = () => {
    if (!pastedText.trim()) {
      setParseResult({
        success: false,
        formatDetected: 'unknown',
        records: [],
        headers: [],
        totalRows: 0,
        validRowsCount: 0,
        totalTarget: 0,
        totalActual: 0,
        totalSurplus: 0,
        averageAchievementRate: 0,
        detectedBranch: currentBranchName,
        period: currentPeriod,
        warnings: [isAr ? 'يرجى لصق مخرجات الذكاء الاصطناعي أولاً.' : 'Please paste AI output first.'],
        error: isAr ? 'المربع فارغ.' : 'Text area is empty.',
      });
      return;
    }

    const res = parseUnifiedRawData(pastedText);
    setParseResult(res);
  };

  const handleConfirmImport = () => {
    if (!parseResult || !parseResult.success || parseResult.records.length === 0) return;

    onImportRecords(parseResult.records, importMode);
    triggerCelebrationConfetti();
    setIsImportSuccess(true);
    setTimeout(() => {
      setIsImportSuccess(false);
      onClose();
    }, 2000);
  };

  const handleResetPaste = () => {
    setPastedText('');
    setParseResult(null);
    setIsImportSuccess(false);
  };

  const sampleDemoSnippet = `الرقم الوظيفي\tاسم الموظف\tالفرع\tالهدف المطلوب\tالمبيعات الفعلية\tالمبيعات قبل الضريبة\tضريبة القيمة المضافة\tمحقق الموبايل\tمحقق الإكسسوار\tأجهزة أخرى\tمبيعات التقسيط\tالفترة
140729\tأحمد ربيع سيد\t${branchInput}\t560000\t612500\t537281\t75219\t398000\t110250\t104250\t140000\t${periodInput}
41308\tعمرو عبد الحليم\t${branchInput}\t490000\t475300\t416930\t58370\t308945\t85554\t80801\t95000\t${periodInput}
125177\tطارق محمود\t${branchInput}\t350000\t380000\t333333\t46667\t247000\t68400\t64600\t80000\t${periodInput}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/40 flex items-center justify-center shrink-0 shadow-inner">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black tracking-tight">
                  {isAr ? 'مولّد برومبت الذكاء الاصطناعي لتوحيد استيراد البيانات' : 'Unified Data Import & AI Formatting Prompt'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  {isAr ? 'معتمد لفرع راية كونكورد بلازا' : 'Raya Concorde Plaza Standard'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {isAr
                  ? 'حوّل أي بيانات أو تقارير مبعثرة بواسطة أي AI خارجي (ChatGPT, Claude, Gemini) واستوردها مباشرة دون أخطاء'
                  : 'Convert raw or changing data using any external AI into the unified schema for instant import'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            title={isAr ? 'إغلاق' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="px-4 sm:px-6 pt-3 pb-2 bg-slate-50 border-b border-slate-200 flex items-center gap-2 overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveTab('prompt')}
            className={`px-3 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'prompt'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
            }`}
          >
            <FileCode className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isAr ? '1. توليد ونسخ برومبت الـ AI' : '1. Generate AI Prompt'}</span>
          </button>

          <button
            onClick={() => setActiveTab('paste')}
            className={`px-3 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'paste'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-emerald-800 hover:bg-emerald-50'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{isAr ? '2. لصق النتيجة والاستيراد الفوري' : '2. Paste AI Result & Import'}</span>
            {parseResult?.success && (
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('schema')}
            className={`px-3 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'schema'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-blue-800 hover:bg-blue-50'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>{isAr ? '3. دليل الحقول الموحدة القياسي' : '3. Schema Reference'}</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* TAB 1: PROMPT GENERATOR */}
          {activeTab === 'prompt' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* How it works guidance bar */}
              <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200/80 rounded-2xl p-4 text-xs">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-slate-900 text-sm">
                      {isAr ? 'كيف تستخدم هذا البرومبت مع أي ذكاء اصطناعي خارجي؟' : 'How to use this external prompt?'}
                    </h4>
                    <p className="text-slate-600 leading-relaxed">
                      {isAr ? (
                        <>
                          1. <strong>انسخ البرومبت أدناه</strong> عبر زر النسخ المباشر.<br />
                          2. افتح أي AI (مثل <strong>ChatGPT، Claude، Gemini، أو DeepSeek</strong>) وألصق البرومبت، ثم ضع تحته بياناتك الخام (سواء كانت رسالة واتساب، جدول من نظام ERP، نص فواتير، أو تقرير PDF).<br />
                          3. سيقوم الـ AI بإخراج جدول منسق وفق <strong>قواعد راية الموحدة</strong> بدقة 100%. خذ النتيجة وألصقها في تبويب <strong>"لصق النتيجة والاستيراد الفوري"</strong> ليتم إدراجها فوراً في لوحة التحكم!
                        </>
                      ) : (
                        'Copy the generated prompt, paste it into ChatGPT/Claude along with your raw unstructured data. The AI will output the exact compliant table for instant import.'
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Configuration Controls Bar */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    <Terminal className="w-4 h-4 text-emerald-600" />
                    <span>{isAr ? 'خيارات تخصيص البرومبت والصيغة المطلوبة:' : 'Prompt Customization Options:'}</span>
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {isAr ? 'يتطابق آلياً مع متطلبات المنظومة' : '100% System-Compliant'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  {/* Format Selector */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      {isAr ? 'صيغة المخرجات المفضلة:' : 'Target Output Format:'}
                    </label>
                    <select
                      value={format}
                      onChange={(e) => setFormat(e.target.value as 'tsv' | 'csv' | 'json' | 'markdown')}
                      className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    >
                      <option value="tsv">{isAr ? '📋 مفصول بـ Tab (TSV - الأسهل والأسرع)' : 'TSV (Tab-Separated)'}</option>
                      <option value="csv">{isAr ? '📄 ملف فواصل (CSV القياسي)' : 'CSV (Comma-Separated)'}</option>
                      <option value="json">{isAr ? '📦 مصفوفة كائنات (JSON)' : 'JSON Array'}</option>
                      <option value="markdown">{isAr ? '📊 جدول ماركداون (| Table)' : 'Markdown Table'}</option>
                    </select>
                  </div>

                  {/* Branch Name Input */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      {isAr ? 'اسم الفرع المستهدف:' : 'Branch Name:'}
                    </label>
                    <input
                      type="text"
                      value={branchInput}
                      onChange={(e) => setBranchInput(e.target.value)}
                      placeholder="فرع راية كونكورد بلازا"
                      className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                  </div>

                  {/* Period Input */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      {isAr ? 'الفترة البيعية المستهدفة:' : 'Target Period:'}
                    </label>
                    <input
                      type="text"
                      value={periodInput}
                      onChange={(e) => setPeriodInput(e.target.value)}
                      placeholder="أكتوبر 2026"
                      className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                  </div>

                  {/* Optional Checkboxes */}
                  <div className="flex flex-col justify-end gap-1.5 pt-1 sm:pt-0">
                    <label className="inline-flex items-center gap-2 cursor-pointer text-[11px] font-bold text-slate-700">
                      <input
                        type="checkbox"
                        checked={includeVat}
                        onChange={(e) => setIncludeVat(e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>{isAr ? 'تضمين تفاصيل الضريبة (14% VAT)' : 'Include 14% VAT details'}</span>
                    </label>
                    <label className="inline-flex items-center gap-2 cursor-pointer text-[11px] font-bold text-slate-700">
                      <input
                        type="checkbox"
                        checked={includeCategories}
                        onChange={(e) => setIncludeCategories(e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>{isAr ? 'تضمين تصنيف الأقسام (موبايل/إكسسوار)' : 'Include Category split'}</span>
                    </label>
                  </div>
                </div>

                {/* Additional optional note */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    {isAr ? 'ملاحظات إضافية تود إرفاقها للـ AI (اختياري):' : 'Custom notes for the AI (optional):'}
                  </label>
                  <input
                    type="text"
                    value={customNotes}
                    onChange={(e) => setCustomNotes(e.target.value)}
                    placeholder={
                      isAr
                        ? 'مثال: "ركز على مبيعات قسم الهواتف بشكل خاص"، أو "قم بحذف أي سطور ملغاة"'
                        : 'e.g. "Focus on mobile sales" or "Ignore cancelled orders"'
                    }
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>
              </div>

              {/* Action Buttons: Copy, Download, Navigate to Paste */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={handleCopyPrompt}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs transition-all shadow-sm cursor-pointer active:scale-95 ${
                      copiedPrompt
                        ? 'bg-emerald-600 text-white ring-2 ring-emerald-400'
                        : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                    }`}
                  >
                    {copiedPrompt ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>{isAr ? 'تم نسخ البرومبت بنجاح! جاهز للإرسال ✓' : 'Prompt Copied! ✓'}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>{isAr ? 'نسخ البرومبت بنقرة واحدة (Copy Prompt)' : 'Copy Prompt'}</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleDownloadPromptFile}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs transition-colors shadow-2xs cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-slate-500" />
                    <span>{isAr ? 'تحميل ملف البرومبت (.txt)' : 'Download Prompt (.txt)'}</span>
                  </button>
                </div>

                <button
                  onClick={() => setActiveTab('paste')}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  <span>{isAr ? 'حصلت على النتيجة؟ انتقل للصقها والاستيراد' : 'Got AI Result? Go to Paste'}</span>
                  <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                </button>
              </div>

              {/* Prompt Text Preview Box */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-bold flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{isAr ? 'معاينة نص البرومبت المولد (جاهز للنسخ المباشر):' : 'Generated Prompt Preview:'}</span>
                  </span>
                  <span className="text-[11px] font-mono">{generatedPrompt.length} {isAr ? 'حرفاً' : 'chars'}</span>
                </div>

                <div className="relative rounded-2xl bg-slate-950 text-slate-100 p-4 border border-slate-800 shadow-inner font-mono text-xs max-h-80 overflow-y-auto leading-relaxed whitespace-pre-wrap select-all">
                  {generatedPrompt}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DIRECT AI PASTE & INSTANT IMPORT */}
          {activeTab === 'paste' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs">
                <h4 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-emerald-600" />
                  <span>{isAr ? 'ألصق مخرجات الـ AI هنا (TSV أو CSV أو JSON أو جدول Markdown):' : 'Paste AI Output Here:'}</span>
                </h4>
                <p className="text-slate-600">
                  {isAr
                    ? 'سيقوم النظام آلياً باكتشاف الفواصل، وتفكيك الكود البرمجي، وتدقيق العمليات الحسابية والضريبة ومطابقة الأعمدة فوراً.'
                    : 'The engine automatically detects delimiters, strips code blocks, and validates calculations.'}
                </p>
              </div>

              {/* Textarea */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">
                    {isAr ? 'مربع لصق المخرجات:' : 'AI Output Box:'}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPastedText(sampleDemoSnippet)}
                      className="text-emerald-700 hover:underline text-[11px] font-bold cursor-pointer"
                    >
                      {isAr ? 'تجربة بنموذج بيانات توضيحي' : 'Load sample demo data'}
                    </button>
                    {pastedText && (
                      <button
                        onClick={handleResetPaste}
                        className="text-rose-600 hover:underline text-[11px] cursor-pointer"
                      >
                        {isAr ? 'مسح' : 'Clear'}
                      </button>
                    )}
                  </div>
                </div>

                <textarea
                  value={pastedText}
                  onChange={(e) => {
                    setPastedText(e.target.value);
                    setParseResult(null);
                  }}
                  rows={8}
                  placeholder={
                    isAr
                      ? 'ألصق هنا الجدول المنسق من ChatGPT أو Claude مباشرة (بما في ذلك أقواس الكود البرمجي ``` أو نص الجداول)...'
                      : 'Paste the formatted response from external AI here...'
                  }
                  className="w-full text-xs font-mono p-3.5 bg-slate-50 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />

                <div className="flex items-center justify-between gap-3 pt-1">
                  <button
                    onClick={handleAnalyzePastedText}
                    disabled={!pastedText.trim()}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{isAr ? 'معاينة وتحليل البيانات (Analyze & Preview)' : 'Analyze & Preview'}</span>
                  </button>

                  <span className="text-[11px] text-slate-500">
                    {pastedText.trim().split(/\r?\n/).length} {isAr ? 'أسطر ملصقة' : 'lines pasted'}
                  </span>
                </div>
              </div>

              {/* Analysis Result Display */}
              {parseResult && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {parseResult.success ? (
                    <>
                      {/* KPI Summary Cards */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                          <span className="text-[10px] font-bold text-emerald-800 uppercase block">
                            {isAr ? 'السجلات الصالحة' : 'Valid Records'}
                          </span>
                          <span className="text-xl font-black text-emerald-950 font-mono">
                            {parseResult.validRowsCount}
                          </span>
                          <span className="text-[10px] text-emerald-700 block mt-0.5 font-bold">
                            {isAr ? `تنسيق: ${parseResult.formatDetected.toUpperCase()}` : parseResult.formatDetected}
                          </span>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                          <span className="text-[10px] font-bold text-blue-800 uppercase block">
                            {isAr ? 'إجمالي المبيعات' : 'Total Actual'}
                          </span>
                          <span className="text-xl font-black text-blue-950 font-mono">
                            {formatCurrencyNumber(parseResult.totalActual, currency)}
                          </span>
                          <span className="text-[10px] text-blue-700 block mt-0.5">
                            {isAr ? `الفرع: ${parseResult.detectedBranch}` : parseResult.detectedBranch}
                          </span>
                        </div>

                        <div className="bg-purple-50 border border-purple-200 rounded-xl p-3">
                          <span className="text-[10px] font-bold text-purple-800 uppercase block">
                            {isAr ? 'إجمالي التارجت' : 'Total Target'}
                          </span>
                          <span className="text-xl font-black text-purple-950 font-mono">
                            {formatCurrencyNumber(parseResult.totalTarget, currency)}
                          </span>
                          <span className="text-[10px] text-purple-700 block mt-0.5">
                            {isAr ? `الفترة: ${parseResult.period}` : parseResult.period}
                          </span>
                        </div>

                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                          <span className="text-[10px] font-bold text-amber-800 uppercase block">
                            {isAr ? 'متوسط الإنجاز' : 'Avg Achievement'}
                          </span>
                          <span className="text-xl font-black text-amber-950 font-mono">
                            {parseResult.averageAchievementRate}%
                          </span>
                          <span className="text-[10px] text-amber-700 block mt-0.5 font-bold">
                            +{formatCurrencyNumber(parseResult.totalSurplus, currency)} {isAr ? 'فائض' : 'Surplus'}
                          </span>
                        </div>
                      </div>

                      {/* Preview Table */}
                      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                        <div className="px-3.5 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-800">
                          <span>{isAr ? 'معاينة السجلات المكتشفة قبل الاعتماد:' : 'Parsed Records Preview:'}</span>
                          <span className="text-[11px] text-slate-500 font-mono">
                            {parseResult.records.length} {isAr ? 'موظفاً' : 'employees'}
                          </span>
                        </div>

                        <div className="overflow-x-auto max-h-60">
                          <table className="w-full text-xs text-right rtl:text-right ltr:text-left">
                            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-bold sticky top-0">
                              <tr>
                                <th className="px-3 py-2">#</th>
                                <th className="px-3 py-2">{isAr ? 'الموظف' : 'Employee'}</th>
                                <th className="px-3 py-2">{isAr ? 'الكود' : 'Job ID'}</th>
                                <th className="px-3 py-2">{isAr ? 'التارجت' : 'Target'}</th>
                                <th className="px-3 py-2">{isAr ? 'المحقق' : 'Actual'}</th>
                                <th className="px-3 py-2">{isAr ? 'نسبة التحقيق' : 'Rate %'}</th>
                                <th className="px-3 py-2">{isAr ? 'الفارق' : 'Diff'}</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-mono">
                              {parseResult.records.map((r, i) => (
                                <tr key={r.id} className="hover:bg-slate-50/70">
                                  <td className="px-3 py-2 text-slate-400 text-[10px]">{i + 1}</td>
                                  <td className="px-3 py-2 font-sans font-bold text-slate-900">{r.employee}</td>
                                  <td className="px-3 py-2 text-slate-500">{r.employeeId || '-'}</td>
                                  <td className="px-3 py-2 text-slate-700">{formatCurrencyNumber(r.target)}</td>
                                  <td className="px-3 py-2 font-bold text-emerald-800">{formatCurrencyNumber(r.actual)}</td>
                                  <td className="px-3 py-2">
                                    <span
                                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                        r.achievementRate >= 100
                                          ? 'bg-emerald-100 text-emerald-800'
                                          : 'bg-amber-100 text-amber-800'
                                      }`}
                                    >
                                      {r.achievementRate.toFixed(1)}%
                                    </span>
                                  </td>
                                  <td
                                    className={`px-3 py-2 font-bold ${
                                      r.difference >= 0 ? 'text-emerald-700' : 'text-rose-600'
                                    }`}
                                  >
                                    {r.difference >= 0 ? '+' : ''}
                                    {formatCurrencyNumber(r.difference)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Import Mode Options & Confirm Button */}
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-800 mb-1">
                            {isAr ? 'طريقة إدراج البيانات في المنظومة:' : 'Import Destination Mode:'}
                          </label>
                          <div className="flex items-center gap-4 text-xs">
                            <label className="inline-flex items-center gap-1.5 cursor-pointer font-bold text-slate-800">
                              <input
                                type="radio"
                                name="importModeUnified"
                                value="replace"
                                checked={importMode === 'replace'}
                                onChange={() => setImportMode('replace')}
                                className="text-emerald-600 focus:ring-emerald-500"
                              />
                              <span>{isAr ? 'استبدال السجلات الحالية بالكامل' : 'Replace existing records'}</span>
                            </label>
                            <label className="inline-flex items-center gap-1.5 cursor-pointer font-bold text-slate-700">
                              <input
                                type="radio"
                                name="importModeUnified"
                                value="append"
                                checked={importMode === 'append'}
                                onChange={() => setImportMode('append')}
                                className="text-emerald-600 focus:ring-emerald-500"
                              />
                              <span>{isAr ? 'إضافة للسجلات الحالية' : 'Append to existing'}</span>
                            </label>
                          </div>
                        </div>

                        <button
                          onClick={handleConfirmImport}
                          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-xs transition-all shadow-md active:scale-95 cursor-pointer shrink-0"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>
                            {isAr
                              ? `تأكيد واستيراد (${parseResult.records.length}) سجلاً الآن`
                              : `Confirm & Import (${parseResult.records.length}) Records Now`}
                          </span>
                        </button>
                      </div>

                      {isImportSuccess && (
                        <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in duration-150">
                          <Check className="w-4 h-4 text-emerald-700" />
                          <span>{isAr ? 'تم استيراد البيانات وتحديث لوحة التحكم بنجاح! جارِ الإغلاق...' : 'Data imported successfully! Closing...'}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-1.5">
                      <div className="flex items-center gap-2 font-bold">
                        <AlertCircle className="w-4 h-4 text-rose-600" />
                        <span>{isAr ? 'تعذر تحليل البيانات الملصقة:' : 'Failed to parse pasted data:'}</span>
                      </div>
                      <p className="text-rose-700">{parseResult.error}</p>
                      {parseResult.warnings.length > 0 && (
                        <ul className="list-disc list-inside text-[11px] text-rose-600 space-y-0.5">
                          {parseResult.warnings.map((w, idx) => (
                            <li key={idx}>{w}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: UNIFIED SCHEMA REFERENCE */}
          {activeTab === 'schema' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs">
                <h4 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <span>{isAr ? 'الدليل القياسي الموحد لحقول وأعمدة استيراد البيانات' : 'Standard Unified Columns Reference'}</span>
                </h4>
                <p className="text-slate-600">
                  {isAr
                    ? 'هذه هي بنية الأعمدة المعتمدة رسمياً في منظومة راية كونكورد بلازا. يتعرف النظام تلقائياً على أي من المسميات والترجمات الموضحة أدناه.'
                    : 'Official schema accepted by Raya Concorde Plaza system.'}
                </p>
              </div>

              {/* Schema Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-right rtl:text-right ltr:text-left">
                    <thead className="bg-slate-100 text-slate-800 font-extrabold border-b border-slate-200">
                      <tr>
                        <th className="px-3.5 py-2.5">{isAr ? 'الحقل بالعربية' : 'Arabic Name'}</th>
                        <th className="px-3.5 py-2.5">{isAr ? 'الحقل بالإنجليزية' : 'English Key'}</th>
                        <th className="px-3.5 py-2.5">{isAr ? 'الحالة' : 'Status'}</th>
                        <th className="px-3.5 py-2.5">{isAr ? 'النوع' : 'Type'}</th>
                        <th className="px-3.5 py-2.5">{isAr ? 'الوصف والقواعد' : 'Description'}</th>
                        <th className="px-3.5 py-2.5">{isAr ? 'مثال' : 'Example'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {UNIFIED_IMPORT_SCHEMA.map((col) => (
                        <tr key={col.key} className="hover:bg-slate-50/70">
                          <td className="px-3.5 py-2.5 font-bold text-slate-900">{col.nameAr}</td>
                          <td className="px-3.5 py-2.5 font-mono text-slate-600">{col.nameEn}</td>
                          <td className="px-3.5 py-2.5">
                            {col.required ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800">
                                {isAr ? 'إلزامي *' : 'Required *'}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                                {isAr ? 'اختياري' : 'Optional'}
                              </span>
                            )}
                          </td>
                          <td className="px-3.5 py-2.5 font-mono text-[11px] text-blue-700">{col.type}</td>
                          <td className="px-3.5 py-2.5 text-slate-600">{isAr ? col.descriptionAr : col.descriptionEn}</td>
                          <td className="px-3.5 py-2.5 font-mono text-slate-800 font-semibold">{col.example}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Standard Sample Template Downloads Strip */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <h5 className="font-bold text-slate-900">{isAr ? 'تحميل قوالب فارغة وجاهزة بالتنسيق الموحد:' : 'Download Standard Blank Templates:'}</h5>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {isAr ? 'يمكنك تعبئتها مباشرة أو إرفاقها لفرق المبيعات لتسجيل الأرقام' : 'Fill directly or send to sales staff'}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={downloadSampleExcelTemplate}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors cursor-pointer shadow-2xs"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Excel (.xlsx)</span>
                  </button>

                  <button
                    onClick={downloadSampleSalesCsvTemplate}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 transition-colors cursor-pointer shadow-2xs"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    <span>CSV</span>
                  </button>

                  <button
                    onClick={() => downloadSampleSalesTxtTemplate()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 font-bold hover:bg-blue-100 transition-colors cursor-pointer shadow-2xs"
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span>TXT</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>
              {isAr
                ? 'التنسيق الموحد متوافق مع كافة نماذج الـ AI (ChatGPT, Claude, Gemini, DeepSeek).'
                : 'Unified format is compatible with all external AI models.'}
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold transition-colors cursor-pointer"
          >
            {isAr ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
