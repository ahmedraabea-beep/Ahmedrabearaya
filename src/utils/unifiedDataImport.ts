import { SalesRecord } from '../types/sales';
import { CONCORD_BRANCH_NAME, enrichSalesRecords } from '../data/sampleData';
import {
  detectColumns,
  buildRecordsFromRows,
  detectDelimiter,
  parseDelimitedLine,
  parseArabicOrWesternNumber,
} from './excelParser';

export interface UnifiedColumnDef {
  key: string;
  nameAr: string;
  nameEn: string;
  aliases: string[];
  required: boolean;
  type: 'string' | 'number';
  descriptionAr: string;
  descriptionEn: string;
  example: string;
}

export const UNIFIED_IMPORT_SCHEMA: UnifiedColumnDef[] = [
  {
    key: 'employee',
    nameAr: 'اسم الموظف',
    nameEn: 'Employee Name',
    aliases: ['الموظف', 'مستشار المبيعات', 'مندوب المبيعات', 'البائع', 'employee', 'employee_name', 'name', 'rep'],
    required: true,
    type: 'string',
    descriptionAr: 'الاسم الثلاثي أو الثنائي لمستشار المبيعات بالفرع',
    descriptionEn: 'Full or display name of the sales consultant',
    example: 'أحمد ربيع سيد',
  },
  {
    key: 'employeeId',
    nameAr: 'الرقم الوظيفي',
    nameEn: 'Job ID',
    aliases: ['كود الموظف', 'الكود الوظيفي', 'رقم الموظف', 'كود', 'jobid', 'employee_id', 'emp_id', 'code'],
    required: false,
    type: 'string',
    descriptionAr: 'الكود الوظيفي المعتمد للموظف في شركة راية',
    descriptionEn: 'Official employee staff ID code',
    example: '140729',
  },
  {
    key: 'branch',
    nameAr: 'الفرع',
    nameEn: 'Branch',
    aliases: ['اسم الفرع', 'المعرض', 'branch', 'store', 'location'],
    required: false,
    type: 'string',
    descriptionAr: 'اسم فرع راية (إن ترك فارغاً سيتم تعيينه تلقائياً لفرع كونكورد بلازا)',
    descriptionEn: 'Branch name (defaults to Raya Concorde Plaza if omitted)',
    example: 'فرع راية كونكورد بلازا',
  },
  {
    key: 'target',
    nameAr: 'الهدف المطلوب',
    nameEn: 'Target',
    aliases: ['التارجت', 'الهدف', 'المستهدف', 'المطلوب', 'target', 'sales_target', 'quota', 'goal'],
    required: true,
    type: 'number',
    descriptionAr: 'المستهدف البيعي المطلوب تحقيقه خلال الفترة بالجنيه المصري (رقم خالص)',
    descriptionEn: 'Monthly target amount in EGP (pure numeric)',
    example: '560000',
  },
  {
    key: 'actual',
    nameAr: 'المبيعات الفعلية',
    nameEn: 'Actual Sales',
    aliases: [
      'المبيعات',
      'المحقق',
      'المبيعات المحققة',
      'المبيعات بعد الضريبة',
      'شامل الضريبة',
      'actual',
      'actual_sales',
      'revenue',
      'sales',
      'achieved',
      'after_vat',
    ],
    required: true,
    type: 'number',
    descriptionAr: 'إجمالي المبيعات المحققة بالجنيه المصري (شاملة ضريبة القيمة المضافة 14%)',
    descriptionEn: 'Gross realized sales in EGP (after 14% VAT)',
    example: '612500',
  },
  {
    key: 'actualBeforeVat',
    nameAr: 'المبيعات قبل الضريبة',
    nameEn: 'Net Sales Before VAT',
    aliases: ['قبل الضريبة', 'صافي المبيعات', 'قبل vat', 'before_vat', 'net_sales', 'subtotal', 'pre_vat'],
    required: false,
    type: 'number',
    descriptionAr: 'صافي المبيعات قبل احتساب 14% ضريبة (اختياري، إن لم يذكر يتم خصم 14% تلقائياً)',
    descriptionEn: 'Net sales before 14% VAT (optional, auto-calculated if missing)',
    example: '537281',
  },
  {
    key: 'vatAmount',
    nameAr: 'ضريبة القيمة المضافة',
    nameEn: 'VAT 14%',
    aliases: ['قيمة الضريبة', 'الضريبة 14%', 'الضريبة', 'vat', 'vat_amount', 'tax'],
    required: false,
    type: 'number',
    descriptionAr: 'قيمة ضريبة القيمة المضافة 14% (اختياري، تحسب تلقائياً)',
    descriptionEn: '14% VAT amount (optional, auto-calculated)',
    example: '75219',
  },
  {
    key: 'mobilesActual',
    nameAr: 'محقق الموبايل',
    nameEn: 'Mobiles Sales',
    aliases: ['مبيعات الموبايل', 'الموبايلات', 'الهواتف', 'mobiles', 'phones', 'mobile'],
    required: false,
    type: 'number',
    descriptionAr: 'مبيعات قسم الهواتف الذكية (اختياري)',
    descriptionEn: 'Smartphones category sales',
    example: '398000',
  },
  {
    key: 'accessoriesActual',
    nameAr: 'محقق الإكسسوار',
    nameEn: 'Accessories Sales',
    aliases: ['مبيعات الإكسسوار', 'الإكسسوارات', 'اكسسوارات', 'accessories', 'acc'],
    required: false,
    type: 'number',
    descriptionAr: 'مبيعات قسم الإكسسوارات (اختياري)',
    descriptionEn: 'Accessories category sales',
    example: '110250',
  },
  {
    key: 'otherActual',
    nameAr: 'أجهزة أخرى',
    nameEn: 'Other Electronics',
    aliases: ['اجهزة اخرى', 'شاشات وتكييفات', 'أخرى', 'other', 'screens', 'appliances'],
    required: false,
    type: 'number',
    descriptionAr: 'مبيعات الأجهزة المنزلية والشاشات والتكييفات (اختياري)',
    descriptionEn: 'Other screens/appliances category sales',
    example: '104250',
  },
  {
    key: 'installmentActual',
    nameAr: 'مبيعات التقسيط',
    nameEn: 'Consumer Finance Installments',
    aliases: ['محقق التقسيط', 'التقسيط', 'تقسيط', 'تمويل', 'installment', 'installments', 'financing'],
    required: false,
    type: 'number',
    descriptionAr: 'إجمالي تمويلات التقسيط والمبيعات بالتقسيط (اختياري)',
    descriptionEn: 'Consumer installment financing value',
    example: '120000',
  },
  {
    key: 'period',
    nameAr: 'الفترة',
    nameEn: 'Period / Month',
    aliases: ['الشهر', 'التاريخ', 'الفترة البيعية', 'period', 'month', 'date'],
    required: false,
    type: 'string',
    descriptionAr: 'الفترة البيعية أو الشهر المستهدف (الافتراضي: أكتوبر 2026)',
    descriptionEn: 'Target month or sales period (defaults to current period)',
    example: 'أكتوبر 2026',
  },
];

export interface PromptGenerationOptions {
  format: 'tsv' | 'csv' | 'json' | 'markdown';
  targetBranchName?: string;
  targetPeriod?: string;
  includeCategories?: boolean;
  includeVatBreakdown?: boolean;
  includeCustomContext?: string;
}

/**
 * Builds a prompt for any external AI (ChatGPT, Claude, Gemini, Copilot, DeepSeek).
 * Instructs the AI to format unstructured or changing raw data into the app's exact schema.
 */
export function buildExternalAiFormattingPrompt(options?: Partial<PromptGenerationOptions>): string {
  const format = options?.format || 'tsv';
  const branchName = options?.targetBranchName || CONCORD_BRANCH_NAME;
  const period = options?.targetPeriod || 'أكتوبر 2026';
  const includeCategories = options?.includeCategories ?? true;
  const includeVat = options?.includeVatBreakdown ?? true;
  const customContext = options?.includeCustomContext || '';

  const formatNames: Record<string, string> = {
    tsv: 'جدول نصي مفصول بـ Tab (TSV - Tab-Separated Values) داخل كود برمجي',
    csv: 'ملف CSV قياسي مفصول بفواصل (Comma-Separated Values) داخل كود برمجي',
    json: 'مصفوفة كائنات JSON قياسية (Array of Objects) داخل كود برمجي',
    markdown: 'جدول Markdown نظيف بالأعمدة والفواصل الرأسية (|)',
  };

  const headersList = [
    'الرقم الوظيفي',
    'اسم الموظف',
    'الفرع',
    'الهدف المطلوب',
    'المبيعات الفعلية',
    ...(includeVat ? ['المبيعات قبل الضريبة', 'ضريبة القيمة المضافة'] : []),
    ...(includeCategories ? ['محقق الموبايل', 'محقق الإكسسوار', 'أجهزة أخرى', 'مبيعات التقسيط'] : []),
    'الفترة',
  ];

  const tsvHeader = headersList.join('\t');
  const csvHeader = headersList.map((h) => (h.includes(',') ? `"${h}"` : h)).join(',');

  const sampleRowTsv = [
    '140729',
    'أحمد ربيع سيد',
    branchName,
    '560000',
    '612500',
    ...(includeVat ? ['537281', '75219'] : []),
    ...(includeCategories ? ['398000', '110250', '104250', '140000'] : []),
    period,
  ].join('\t');

  const sampleRowCsv = [
    '140729',
    'أحمد ربيع سيد',
    `"${branchName}"`,
    '560000',
    '612500',
    ...(includeVat ? ['537281', '75219'] : []),
    ...(includeCategories ? ['398000', '110250', '104250', '140000'] : []),
    `"${period}"`,
  ].join(',');

  const sampleJson = JSON.stringify(
    [
      {
        employeeId: '140729',
        employee: 'أحمد ربيع سيد',
        branch: branchName,
        target: 560000,
        actual: 612500,
        ...(includeVat ? { actualBeforeVat: 537281, vatAmount: 75219 } : {}),
        ...(includeCategories
          ? { mobilesActual: 398000, accessoriesActual: 110250, otherActual: 104250, installmentActual: 140000 }
          : {}),
        period: period,
      },
    ],
    null,
    2
  );

  return `# نظام تحويل وتوحيد بيانات المبيعات لمنظومة راية كونكورد بلازا
# Unified Data ETL & Reformatting Directive for Raya Concorde Plaza Branch

أنت خبير محترف في هندسة البيانات (Senior Data Engineer & Financial ETL Specialist).
مهمتك: استقبال أي بيانات مبيعات وموظفين غير منتظمة أو مبعثرة أو مختلفة التنسيق سأقدمها لك لاحقاً (مثل نصوص عشوائية، تقارير ERP، رسائل واتساب، فواتير، جداول Excel ملخبطة، أو تقارير PDF)، وتحويلها وإعادة هيكلتها بدقة 100% إلى التنسيق الموحد القياسي المعتمد أدناه، بحيث تصبح جاهزة للاستيراد المباشر داخل منظومة راية كونكورد بلازا دون أي تعديل يدوي.

----------------------------------------------------------------------
## 1. التنسيق المطلوب لمخرجاتك:
الصيغة المعتمدة للمخرجات: ${formatNames[format]}

${
  format === 'tsv'
    ? `رؤوس الأعمدة المطلوبة بالترتيب الدقيق:
${tsvHeader}`
    : format === 'csv'
    ? `رؤوس الأعمدة المطلوبة بالترتيب الدقيق:
${csvHeader}`
    : format === 'json'
    ? `مصفوفة JSON نقية تحتوي على كائنات بالمفاتيح الإنجليزية القياسية:
[
  {
    "employeeId": "140729",
    "employee": "اسم الموظف",
    "branch": "${branchName}",
    "target": 560000,
    "actual": 612500,
    "actualBeforeVat": 537281,
    "vatAmount": 75219,
    "mobilesActual": 398000,
    "accessoriesActual": 110250,
    "otherActual": 104250,
    "installmentActual": 140000,
    "period": "${period}"
  }
]`
    : `جدول ماركداون برؤوس الأعمدة:
| ${headersList.join(' | ')} |
| ${headersList.map(() => '---').join(' | ')} |`
}

----------------------------------------------------------------------
## 2. القواعد الصارمة والواجب الالتزام بها:
1. **الأرقام والمبالغ المالية**:
   - يجب أن تكون الأرقام نقية (Pure Numbers) خالية تماماً من أسماء العملات (ممنوع كتابة "ج.م" أو "جنيه" أو "EGP" أو "$").
   - ممنوع وضع فواصل الآلاف داخل الأرقام (اكتب 560000 وليس 560,000).
   - حوّل أي أرقام مشرقية (١، ٢، ٣، ٤، ٥، ٦، ٧، ٨، ٩، ٠) إلى أرقام قياسية (1, 2, 3, 4, 5, 6, 7, 8, 9, 0).
   - إذا كان هناك أرقام سالبة أو كسور، استخدم العلامة العشرية القياسية النقطة (.) مثل: 12500.50.

2. **اسم الفرع (Branch)**:
   - إن لم يكن اسم الفرع موجوداً في بياناتي الخام أو كان غامضاً، اجعل قيمته افتراضياً: "${branchName}".

3. **الفترة الزمنية (Period)**:
   - إن لم تتضمن البيانات شهراً محدداً، اجعل الفترة: "${period}".

4. **الرقم الوظيفي (Job ID)**:
   - استخرج الكود الوظيفي إن وجد بجانب اسم الموظف. إن لم يوجد، دعه فارغاً أو استنبطه بشكل نظيف.

5. **ضريبة القيمة المضافة 14% (VAT)**:
   - في حال كان لديك صافي المبيعات فقط دون الضريبة، احسب: المبيعات الفعلية = الصافي × 1.14، ومبلغ الضريبة = الصافي × 0.14.
   - في حال كان لديك الإجمالي بالضريبة فقط، احسب: الصافي = الإجمالي / 1.14، والضريبة = الإجمالي - الصافي.

6. **تصنيفات الأقسام (الهواتف، الإكسسوارات، الأجهزة، التقسيط)**:
   - إن كانت موجودة في بياناتي الخام ضع قيمتها كما هي.
   - إن لم تكن متوفرة، ضع 0 أو قم بتقديرها بنسب الفرع التقريبية (65% هواتف، 18% إكسسوار، 17% أجهزة أخرى).

7. **صيغة الرد المطلوبة (CRITICAL)**:
   - أخرج فقط البيانات المحولة داخل كود برمجي واحد (Code Block).
   - ممنوع كتابة أي مقدمات أو تحيات أو تفسيرات أو اعتذارات قبل الكود أو بعده.
   - أريد فقط البيانات الجاهزة للنسخ والاستيراد الفوري داخل منظومة راية.

----------------------------------------------------------------------
## 3. مثال توضيحي لما سأعطيه لك وكيف يجب أن تحوله:

### مثال على البيانات الخام غير المنتظمة التي سأقدمها لك:
\`\`\`text
تقرير مبيعات شهر 10 معرض كونكورد بلازا
أحمد ربيع كود 140729 عمل مبيعات 612,500 من أصل تارجت مطلوب 560 ألف (منها موبايل 398 ألف واكسسوار 110,250 وتقسيط 140000)
عمرو عبد الحليم كود 41308 تارجته 490000 محقق فعلي شامل الضريبة 475,300
طارق محمود كود 125177 محقق 380,000 وتارجته 350000
\`\`\`

### مثال على الرد المطلوب منك بالضبط:
${
  format === 'tsv'
    ? `\`\`\`tsv
${tsvHeader}
${sampleRowTsv}
41308\tعمرو عبد الحليم\t${branchName}\t490000\t475300\t${includeVat ? '416930\t58370\t' : ''}${includeCategories ? '308945\t85554\t80801\t95000\t' : ''}${period}
125177\tطارق محمود\t${branchName}\t350000\t380000\t${includeVat ? '333333\t46667\t' : ''}${includeCategories ? '247000\t68400\t64600\t80000\t' : ''}${period}
\`\`\``
    : format === 'csv'
    ? `\`\`\`csv
${csvHeader}
${sampleRowCsv}
41308,عمرو عبد الحليم,"${branchName}",490000,475300${includeVat ? ',416930,58370' : ''}${includeCategories ? ',308945,85554,80801,95000' : ''},"${period}"
125177,طارق محمود,"${branchName}",350000,380000${includeVat ? ',333333,46667' : ''}${includeCategories ? ',247000,68400,64600,80000' : ''},"${period}"
\`\`\``
    : format === 'json'
    ? `\`\`\`json
${sampleJson}
\`\`\``
    : `\`\`\`markdown
| ${headersList.join(' | ')} |
| ${headersList.map(() => '---').join(' | ')} |
| 140729 | أحمد ربيع سيد | ${branchName} | 560000 | 612500 | ${includeVat ? '537281 | 75219 | ' : ''}${includeCategories ? '398000 | 110250 | 104250 | 140000 | ' : ''}${period} |
\`\`\``
}

${customContext ? `----------------------------------------------------------------------\n## ملاحظات خاصة من مدير الفرع:\n${customContext}\n` : ''}
----------------------------------------------------------------------
انتظر بياناتي الآن وسأقوم بإرسالها لك مباشرة لتقوم بتحويلها بنفس القواعد أعلاه!`;
}

export interface UnifiedParseResult {
  success: boolean;
  formatDetected: 'json' | 'tsv' | 'csv' | 'markdown' | 'unknown';
  records: SalesRecord[];
  headers: string[];
  totalRows: number;
  validRowsCount: number;
  totalTarget: number;
  totalActual: number;
  totalSurplus: number;
  averageAchievementRate: number;
  detectedBranch: string;
  period: string;
  warnings: string[];
  error?: string;
  rawSample?: Record<string, unknown>[];
}

/**
 * Intelligently cleans and parses pasted text from an external AI.
 * Strips code fences, detects JSON/TSV/CSV/Markdown, maps columns, and enriches records.
 */
export function parseUnifiedRawData(rawInput: string): UnifiedParseResult {
  const warnings: string[] = [];
  if (!rawInput || !rawInput.trim()) {
    return {
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
      detectedBranch: CONCORD_BRANCH_NAME,
      period: 'أكتوبر 2026',
      warnings: ['النص المُلصق فارغ.'],
      error: 'يرجى لصق مخرجات الذكاء الاصطناعي أولاً.',
    };
  }

  // 1. Strip Markdown code fences if present (```tsv ... ``` or ```csv ... ``` or ```json ... ```)
  let cleanText = rawInput.trim();
  const codeBlockMatch = cleanText.match(/```(?:[a-zA-Z0-9_-]+)?\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch && codeBlockMatch[1]) {
    cleanText = codeBlockMatch[1].trim();
  }

  // 2. Try JSON Array parsing
  if ((cleanText.startsWith('[') && cleanText.endsWith(']')) || cleanText.startsWith('{')) {
    try {
      let parsedJson: unknown = JSON.parse(cleanText);
      if (!Array.isArray(parsedJson) && typeof parsedJson === 'object' && parsedJson !== null) {
        // Single object or wrapped { records: [...] } / { data: [...] }
        const obj = parsedJson as Record<string, unknown>;
        const possibleArray = obj.records || obj.data || obj.sales || obj.rows || [obj];
        if (Array.isArray(possibleArray)) {
          parsedJson = possibleArray;
        } else {
          parsedJson = [obj];
        }
      }

      if (Array.isArray(parsedJson) && parsedJson.length > 0) {
        const rows = parsedJson as Record<string, unknown>[];
        const allKeys = Array.from(new Set(rows.flatMap((r) => Object.keys(r))));
        const mapping = detectColumns(allKeys);

        // Fallback key lookups for standard json keys
        if (!mapping.employeeColumn && allKeys.includes('employee')) mapping.employeeColumn = 'employee';
        if (!mapping.employeeColumn && allKeys.includes('employeeName')) mapping.employeeColumn = 'employeeName';
        if (!mapping.employeeIdColumn && allKeys.includes('employeeId')) mapping.employeeIdColumn = 'employeeId';
        if (!mapping.employeeIdColumn && allKeys.includes('jobId')) mapping.employeeIdColumn = 'jobId';
        if (!mapping.branchColumn && allKeys.includes('branch')) mapping.branchColumn = 'branch';
        if (!mapping.targetColumn && allKeys.includes('target')) mapping.targetColumn = 'target';
        if (!mapping.actualColumn && allKeys.includes('actual')) mapping.actualColumn = 'actual';
        if (!mapping.actualAfterVatColumn && allKeys.includes('actualAfterVat')) mapping.actualAfterVatColumn = 'actualAfterVat';
        if (!mapping.actualBeforeVatColumn && allKeys.includes('actualBeforeVat')) mapping.actualBeforeVatColumn = 'actualBeforeVat';
        if (!mapping.vatAmountColumn && allKeys.includes('vatAmount')) mapping.vatAmountColumn = 'vatAmount';
        if (!mapping.mobilesColumn && allKeys.includes('mobilesActual')) mapping.mobilesColumn = 'mobilesActual';
        if (!mapping.accessoriesColumn && allKeys.includes('accessoriesActual')) mapping.accessoriesColumn = 'accessoriesActual';
        if (!mapping.otherColumn && allKeys.includes('otherActual')) mapping.otherColumn = 'otherActual';
        if (!mapping.installmentColumn && allKeys.includes('installmentActual')) mapping.installmentColumn = 'installmentActual';
        if (!mapping.periodColumn && allKeys.includes('period')) mapping.periodColumn = 'period';

        const built = buildRecordsFromRows(rows, mapping);
        const enriched = enrichSalesRecords(built);

        const totalTarget = enriched.reduce((s, r) => s + r.target, 0);
        const totalActual = enriched.reduce((s, r) => s + r.actual, 0);
        const totalSurplus = enriched.reduce((s, r) => s + Math.max(0, r.difference), 0);
        const avgRate = totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0;
        const branch = enriched[0]?.branch || CONCORD_BRANCH_NAME;
        const period = enriched[0]?.period || 'أكتوبر 2026';

        return {
          success: enriched.length > 0,
          formatDetected: 'json',
          records: enriched,
          headers: allKeys,
          totalRows: rows.length,
          validRowsCount: enriched.length,
          totalTarget,
          totalActual,
          totalSurplus,
          averageAchievementRate: Math.round(avgRate * 10) / 10,
          detectedBranch: branch,
          period,
          warnings,
          rawSample: rows.slice(0, 3),
        };
      }
    } catch (err: unknown) {
      warnings.push(`فشل التحليل كـ JSON: ${err instanceof Error ? err.message : 'بنية غير صالحة'}`);
    }
  }

  // 3. Try Markdown Table parsing
  const rawLines = cleanText.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
  const isMarkdown = rawLines.length >= 2 && rawLines[0].includes('|') && rawLines[1].includes('---');

  if (isMarkdown) {
    const headerCells = rawLines[0]
      .split('|')
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    const dataLines = rawLines.slice(2).filter((l) => l.includes('|'));
    const rows: Record<string, unknown>[] = [];

    dataLines.forEach((line) => {
      const cells = line
        .split('|')
        .map((c) => c.trim())
        .filter((_, idx, arr) => idx > 0 && idx < arr.length); // skip outside bounding pipes if present

      // Handle split if length matches
      const targetCells = cells.length >= headerCells.length ? cells : line.split('|').map((c) => c.trim()).filter((c) => c.length > 0);
      const rowObj: Record<string, unknown> = {};
      headerCells.forEach((h, i) => {
        rowObj[h] = targetCells[i] !== undefined ? targetCells[i] : '';
      });
      rows.push(rowObj);
    });

    const mapping = detectColumns(headerCells);
    const built = buildRecordsFromRows(rows, mapping);
    const enriched = enrichSalesRecords(built);

    const totalTarget = enriched.reduce((s, r) => s + r.target, 0);
    const totalActual = enriched.reduce((s, r) => s + r.actual, 0);
    const totalSurplus = enriched.reduce((s, r) => s + Math.max(0, r.difference), 0);
    const avgRate = totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0;
    const branch = enriched[0]?.branch || CONCORD_BRANCH_NAME;
    const period = enriched[0]?.period || 'أكتوبر 2026';

    return {
      success: enriched.length > 0,
      formatDetected: 'markdown',
      records: enriched,
      headers: headerCells,
      totalRows: rows.length,
      validRowsCount: enriched.length,
      totalTarget,
      totalActual,
      totalSurplus,
      averageAchievementRate: Math.round(avgRate * 10) / 10,
      detectedBranch: branch,
      period,
      warnings,
      rawSample: rows.slice(0, 3),
    };
  }

  // 4. Delimited Text Parsing (TSV or CSV or Semicolon or Pipe)
  const delimiter = detectDelimiter(cleanText);
  const formatDetected: 'tsv' | 'csv' = delimiter === '\t' ? 'tsv' : 'csv';

  const lines = cleanText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('#') && !l.startsWith('//'));

  if (lines.length < 2) {
    return {
      success: false,
      formatDetected,
      records: [],
      headers: [],
      totalRows: lines.length,
      validRowsCount: 0,
      totalTarget: 0,
      totalActual: 0,
      totalSurplus: 0,
      averageAchievementRate: 0,
      detectedBranch: CONCORD_BRANCH_NAME,
      period: 'أكتوبر 2026',
      warnings: ['الملف أو النص لا يحتوي على صفوف كافية (مطلوب سطر رؤوس الأعمدة وسطر بيانات واحد على الأقل).'],
      error: 'لا توجد بيانات كافية للاستيراد.',
    };
  }

  const headers = parseDelimitedLine(lines[0], delimiter).map((h) => h.trim());
  const rows: Record<string, unknown>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = parseDelimitedLine(lines[i], delimiter);
    const rowObj: Record<string, unknown> = {};
    headers.forEach((h, idx) => {
      rowObj[h] = cells[idx] !== undefined ? cells[idx] : '';
    });
    rows.push(rowObj);
  }

  const mapping = detectColumns(headers);
  const built = buildRecordsFromRows(rows, mapping);
  const enriched = enrichSalesRecords(built);

  if (enriched.length === 0) {
    return {
      success: false,
      formatDetected,
      records: [],
      headers,
      totalRows: rows.length,
      validRowsCount: 0,
      totalTarget: 0,
      totalActual: 0,
      totalSurplus: 0,
      averageAchievementRate: 0,
      detectedBranch: CONCORD_BRANCH_NAME,
      period: 'أكتوبر 2026',
      warnings: ['تعذر العثور على الأعمدة الإلزامية (اسم الموظف، التارجت، والمبيعات) في النص المُلصق.'],
      error: 'بنية الأعمدة غير متوافقة مع التنسيق الموحد.',
    };
  }

  const totalTarget = enriched.reduce((s, r) => s + r.target, 0);
  const totalActual = enriched.reduce((s, r) => s + r.actual, 0);
  const totalSurplus = enriched.reduce((s, r) => s + Math.max(0, r.difference), 0);
  const avgRate = totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0;
  const branch = enriched[0]?.branch || CONCORD_BRANCH_NAME;
  const period = enriched[0]?.period || 'أكتوبر 2026';

  return {
    success: true,
    formatDetected,
    records: enriched,
    headers,
    totalRows: rows.length,
    validRowsCount: enriched.length,
    totalTarget,
    totalActual,
    totalSurplus,
    averageAchievementRate: Math.round(avgRate * 10) / 10,
    detectedBranch: branch,
    period,
    warnings,
    rawSample: rows.slice(0, 3),
  };
}

/**
 * Downloads the generated external prompt as a plain UTF-8 text file (.txt)
 */
export function downloadAiFormattingPromptFile(promptText: string, fileName = 'raya_ai_import_prompt.txt'): void {
  const blob = new Blob([promptText], { type: 'text/plain;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
