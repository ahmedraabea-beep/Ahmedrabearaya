# إعادة هيكلة منظومة راية كونكورد بلازا: تطبيق متعدد الصفحات وتوحيد مصدر البيانات (Single Source of Truth)

خطة تنفيذية متكاملة لتحويل تطبيق فرع راية تريد (كونكورد بلازا) من صفحة واحدة طولية إلى نظام تحكم إداري احترافي متعدد الصفحات (Multi-Page SaaS Dashboard)، مع توحيد مصدر البيانات في طبقة مركزية واحدة تربط بين السيرفر والواجهة، وتوزيع كافة المكونات والوظائف الحالية بدون استبعاد أي ميزة.

---

## مراجعة القرارات الحاسمة واختيارات المستخدم (Confirmed User Decisions)

> [!IMPORTANT]
> بناءً على الإجابات الاستيضاحية المؤكدة، تم اعتماد القرارات التالية:

- **نظام التوجيه والروابط (Router)**: اعتماد **Hash Router** خفيف وسريع (`#/`, `#/sales`, `#/targets`, `#/staff`, `#/incentives`, `#/analytics`, `#/inventory`, `#/reports`, `#/settings`) لضمان ثبات الروابط، ودعم الـ Deep Linking، والتوافق التام مع بيئات الـ iFrame وإعادة التحميل دون أخطاء 404.
- **عرض القائمة الجانبية (Sidebar) على أجهزة الكمبيوتر**: شريط جانبي مفتوح بالكامل افتراضياً (بعرض 260px) مع زر مرن للطي والتوسيع (إلى 72px مدمج أيقونات فقط) لتعظيم مساحة الرؤية عند الحاجة.
- **شريط التنقل في الموبايل (Bottom Tab Bar)**: شريط سفلي ثابت يضم أهم 4 وجهات رئيسية (`الرئيسية`, `المبيعات`, `الموظفين`, `الحوافز`) بالإضافة إلى زر **"المزيد"** الذي يفتح قائمة سفلية لمسية سريعة لباقي الصفحات (`الأهداف`, `التحليلات`, `المخزون`, `التقارير`, `الإعدادات`).
- **اللغة والاتجاه والعملة**: واجهة عربية RTL افتراضية كاملة مع دعم الإنجليزية، والعملة الافتراضية الجنيه المصري (EGP)، والاحتفاظ بوضعي ضريبة القيمة المضافة 14% (شامل الضريبة / صافي).

---

## 1. الهيكل المعماري للنظام ومصدر البيانات الموحد (Single Source of Truth Architecture)

```
┌────────────────────────────────────────────────────────────────────────┐
│                      Server-Side (server.ts)                           │
│  - Storage File: data/store.json (المصدر المرجعي المعتمد)              │
│  - Full Store API: GET /api/store  &  POST /api/store (Atomic Sync)     │
│  - Granular API: /api/records, /api/incentives, /api/targets, etc.     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP Sync (Debounced Auto-Save)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   src/store/DataStore.tsx (Context)                    │
│  - State: records, targets[period], incentiveRules, shifts,            │
│           inventory, settings (vatMode, currency, lang),               │
│           selectedPeriod, selectedBranch, lastUpdated, syncStatus      │
│  - Reducer Actions: SET_STORE, ADD_RECORD, UPDATE_RECORD,              │
│                     SET_PERIOD, SET_BRANCH, UPDATE_TARGETS, etc.       │
│  - Offline Cache: localStorage (يستخدم فقط كـ Cache عند انقطاع السيرفر)│
│  - Seed Data: sampleData.ts (يستخدم فقط كـ Fallback عند أول تشغيل)    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     src/store/selectors.ts                             │
│  - الحسابات المشتقة الموحدة: useMemo + calculations.ts + forecasting.ts│
│  - selectEffectiveActual, selectAchievementRate, selectRemainingTarget │
│  - selectDailyRunRate, selectProjectedMonthEnd, selectStaffRankings    │
│  (يمنع تضارب الأرقام نهائياً بين أي صفحتين داخل التطبيق)               │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                  ┌─────────────────┴─────────────────┐
                  ▼                                   ▼
┌───────────────────────────────────┐ ┌──────────────────────────────────┐
│      MainAppLayout.tsx (Desktop)  │ │      MainAppLayout.tsx (Mobile)  │
│ - Collapsible Sidebar (9 Pages)   │ │ - Top Mobile Bar                 │
│ - Top Navigation Bar              │ │ - Bottom Tab Bar (4 + المزيد)    │
│ - Command Palette (Ctrl+K)        │ │ - Touch Gestures & Drawers       │
│ - Contextual Breadcrumbs          │ │ - Quick Action Floating Sheet    │
└─────────────────┬─────────────────┘ └──────────────────┬───────────────┘
                  │                                      │
                  └──────────────────┬───────────────────┘
                                     ▼
        ┌─────────────────────────────────────────────────────────┐
        │       Lazy-Loaded Pages (React.lazy + Suspense)         │
        │ ① Dashboard        ② Sales & Records   ③ Targets & Plan │
        │ ④ Staff & Roster   ⑤ Incentives        ⑥ Analytics      │
        │ ⑦ Smart Inventory  ⑧ Reports & Export  ⑨ Settings       │
        └─────────────────────────────────────────────────────────┘
```

---

## 2. تفصيل الصفحات وتوزيع المكونات (Pages & Component Mapping)

| # | الصفحة (المسار) | التبويبات الداخلية / الأقسام | المكونات الحالية المسندة إليها (مع الحفاظ الكامل عليها) |
|---|---|---|---|
| **①** | **الرئيسية (Dashboard)**<br>`#/` | متابعة سريعة وتنفيذية:<br>• كارت المحقق من الريفينيو<br>• شريط تقدم الفئات<br>• كروت KPI الملخصة<br>• كروت مؤشرات النظام<br>• أفضل 3 موظفين<br>• منحنى الأداء المصغر<br>• شريط الإجراءات السريعة | • `HeroRevenueTargetCard` (كارت رئيسي متطور)<br>• `KpiCards`<br>• `MiniLeaderboardTop3`<br>• `BranchPerformanceCurve` (نسخة مصغرة)<br>• `TargetAlertBanner` (شريط الرادار اللحظي)<br>• `QuickActionsBar` |
| **②** | **المبيعات والسجلات**<br>`#/sales` | • تاب 1: السجلات والمعاملات<br>• تاب 2: رفع ومعالجة الإكسيل<br>• تاب 3: مراجعة الجودة والتسوية | • `FiltersBar`<br>• `PerformanceTable`<br>• `RecordModal`<br>• `UploadModal`<br>• `FastExcelProcessingHub`<br>• `ExcelValidationReportModal`<br>• `RayaThreeSheetsReconciliationCard` |
| **③** | **الأهداف والتارجت**<br>`#/targets` | • تاب 1: متابعة وإدارة المستهدفات<br>• تاب 2: توزيع التارجت (Allocation)<br>• تاب 3: تفصيل فئات التارجت وتنبيهات الإنجاز | • `BranchTargetAndActualsManager`<br>• `TargetAllocationModal` (يُعرض كواجهة مدمجة مباشرة بالصفحة مع إمكانية الفتح السريع)<br>• `BranchTargetBreakdownCard`<br>• `OctoberTargetBanner` (ديناميكي حسب الفترة المختارة)<br>• `TargetAlertBanner` |
| **④** | **الموظفين والأداء**<br>`#/staff` | • تاب 1: لوحة الشرف والترتيب<br>• تاب 2: التحليل المعمق للموظف<br>• تاب 3: مقارنة SWOT<br>• تاب 4: جدول الشيفتات والرعاية<br>• تاب 5: الاحتفاظ ودوران العمالة والتوسع | • `Leaderboard`<br>• `EmployeeDeepAnalytics`<br>• `SectionAndStaffAnalyticsHub`<br>• `AllAchievementsDashboard`<br>• `StaffPerformanceSwotComparison`<br>• `ShiftManagementRosterModal` (شاشة كاملة للشيفتات)<br>• `StaffAttritionAndRetentionTab`<br>• `BranchTeamHeader` |
| **⑤** | **الحوافز**<br>`#/incentives` | • تاب 1: قواعد الحوافز وقوائم الصرف<br>• تاب 2: حاسبة وتفاصيل حافز الموظف<br>• تاب 3: التوقعات الشهرية للحوافز | • `IncentivesModal` (واجهة كاملة)<br>• `IncentiveBreakdownModal`<br>• `EmployeeIncentiveProjectionTab` |
| **⑥** | **التحليلات والتوقعات**<br>`#/analytics` | • تاب 1: منحنيات النمو والمسار<br>• تاب 2: مقارنة الفروع والقطاعات<br>• تاب 3: أوقات الذروة والمبيعات الحرارية<br>• تاب 4: تصنيف ABC وتوقعات التعيين | • `BranchPerformanceCurve`<br>• `GrowthForecastSection`<br>• `ConcordeAnnualProjectionSection`<br>• `BranchComparisonChart`<br>• `SalesPeakHeatmap`<br>• `AbcAnalysisSection`<br>• `FutureHiringAndExpansionTab`<br>• `RayaCorporateOptimizerDashboard` |
| **⑦** | **المخزون الذكي**<br>`#/inventory` | • تاب 1: رصيد كونكورد والمخزن الرئيسي<br>• تاب 2: سرعة الدوران وتحليل الركود<br>• تاب 3: مقترحات التحويلات والإمداد الذكي | • `SmartInventoryOptimizerModal` (يتحول بالكامل إلى صفحة قائمة بذاتها مجهزة بتاباتها الفرعية) |
| **⑧** | **التقارير والتصدير**<br>`#/reports` | • تاب 1: العرض التقديمي التنفيذي<br>• تاب 2: مركز التنزيل والتصدير<br>• تاب 3: التقرير الشهري والـ PDF<br>• تاب 4: مساعد الـ AI لتوحيد البيانات | • `ExecutivePresentationCard`<br>• `ExportAndDownloadCenterModal`<br>• `DownloadManagerNotification`<br>• `MonthlyReportModal`<br>• `UnifiedAiPromptModal` |
| **⑨** | **الإعدادات وإدارة البيانات**<br>`#/settings` | • إعدادات العرض (اللغة، العملة، وضع VAT)<br>• ربط الموبايل وباركود الـ PWA<br>• رادار التنبيهات والـ Milestones<br>• ربط أعمدة الإكسيل (Sales/Inventory)<br>• إدارة البيانات: تصدير/استيراد نسخة احتياطية وفحص الاتساق (Data Consistency Check) | • `LiveClockAndSync` settings<br>• `MobileDeviceModal` / `DeviceModeFloatingBar`<br>• `TargetNotificationCenter` settings<br>• Column Mapping Manager<br>• `DataBackupAndConsistencyPanel` |

---

## 3. تصميم الصفحة الرئيسية (Executive Dashboard Specification)

الترتيب الرأسي الدقيق لصفحة لوحة التحكم الرئيسية:
1. **Hero Card: المحقق من الريفينيو الشهري**:
   - مقارنة رقمية واضحة بين المحقق الفعلي والتارجت الشهري، مع شريط تقدم كبير متدرج الألوان (`bg-emerald-500` عند تحقيق الهدف، `bg-blue-500` عند القرب منه، `bg-amber-500` عند الحاجة للدعم).
   - مؤشرات حسابية مستخرجة مركزياً: المبلغ المتبقي للتارجت، عدد الأيام المتبقية في الشهر، المطلوب يومياً لتحقيق التارجت (`dailyRequiredRate`)، والمتوسط اليومي الفعلي الحالي (`dailyActualRate`).
   - مؤشر التوقع التنبؤي لنهاية الشهر من `forecasting.ts` مع شارة ديناميكية خضراء/حمراء تشير إلى `"فوق التارجت بـ ... ج.م"` أو `"أقل من التارجت"`.
   - اسم الشهر يتم جلبه ديناميكياً من `selectedPeriod` في الـ Store دون أي نص ثابت.
2. **Category Target Progress Matrix**:
   - أشرطة تقدم أفقية دقيقة لكل فئة:
     - ريفينيو المبيعات (Revenue Target)
     - التقسيط الجماعي للفرع (Installment Target)
     - أجهزة أخرى وشاشات وتكييفات (Other Appliances)
     - الهواتف الذكية (Mobiles / Handsets)
     - الملحقات والإكسسوارات (Accessories)
     - الإجمالي الكلي للفرع (Grand Total = Revenue + Installment)
   - كل فئة توضح: [المحقق الفعلي] / [التارجت المطلوب] / [نسبة الإنجاز %].
3. **مؤشرات الأداء الرئيسية (KpiCards)**:
   - الكروت الملخصة لأهم أرقام الفرع (صافي المبيعات، الضريبة، إجمالي شامل الضريبة، متوسط الفاتورة).
4. **ملخص مؤشرات المنظومة (Operational Health Cards)**:
   - 6 كروت صغيرة بأرقام وإحصائيات مركزية، كل كارت يمثل رابطاً سريعاً لصفحته التفصيلية:
     - كارت عدد السجلات والموظفين (يفتح `#/sales`).
     - كارت آخر رفع إكسيل وحالة جودة البيانات وتدقيق الـ 21 عمود (يفتح `#/sales`).
     - كارت إجمالي الحوافز المتوقعة لهذا الشهر (يفتح `#/incentives`).
     - كارت تنبيهات نواقص ورواكد المخزون (يفتح `#/inventory`).
     - كارت ملخص شيفتات اليوم وجاهزية الفريق (يفتح `#/staff`).
     - كارت حالة التزامن السحابي وزمن آخر حفظ (يفتح `#/settings`).
5. **لوحة الشرف المصغرة (Mini Leaderboard Top 3)**:
   - عرض متصدري المبيعات الثلاثة الأوائل بأوسمة الذهب والفضة والبرونز مع نسبة تحقيقهم ونسبة الملحقات، مع رابط صريح `"عرض كافة الموظفين وتحليلات الأداء ←"` يوجه لـ `#/staff`.
6. **منحنى أداء الفرع وموجة الـ Milestones**:
   - عرض مصغر لـ `BranchPerformanceCurve` مع شريط التنبيهات اللحظية `TargetAlertBanner`.
7. **شريط الإجراءات السريعة (Quick Action Bar)**:
   - أزرار مباشرة لـ: رفع ملف إكسيل جديد، إضافة سجل يدوي، استخراج تقرير PDF، تصدير إكسيل.

---

## 4. البنية التقنية لمصدر البيانات الموحد (DataStore Implementation)

### الملفات الجديدة:
1. **`src/store/DataStore.tsx`**:
   - يوفر `DataStoreContext` و `useDataStore()`.
   - يحتوي على `storeReducer` الذي يتعامل مع كافة العمليات بصيغة Immutable:
     - `SET_FULL_STORE`: تحميل البيانات الكاملة من السيرفر.
     - `SET_PERIOD` & `SET_BRANCH`: تغيير الفترة أو الفرع المحدد وتطبيقه على كافة أرجاء التطبيق.
     - `ADD_RECORD`, `UPDATE_RECORD`, `DELETE_RECORD`, `IMPORT_RECORDS`.
     - `UPDATE_INCENTIVE_RULES`, `UPDATE_TARGET_STRUCTURE`.
     - `UPDATE_INVENTORY_ITEMS`, `UPDATE_SHIFTS`, `UPDATE_RETENTION`.
     - `UPDATE_SETTINGS` (vatMode, currency, language).
   - يتولى المزامنة التلقائية مع السيرفر عبر `debounce` مدته 600ms مع تحديث حالة `isSyncing` و `lastUpdated`.
2. **`src/store/selectors.ts`**:
   - دوال نقية ومحسوبة بـ `useMemo`:
     - `selectFilteredRecords(state)`
     - `selectActiveTargetStructure(state)`
     - `selectFinancialTotals(state)`
     - `selectRevenuePaceMetrics(state)`
     - `selectBranchPerformances(state)`
     - `selectStaffLeaderboard(state)`
     - `selectIncentivesCalculation(state)`
3. **تحديث السيرفر (`server.ts`)**:
   - توسيع هيكل `data/store.json` ليشمل:
     ```json
     {
       "records": [...],
       "targets": {
         "أكتوبر 2026": { ... },
         "نوفمبر 2026": { ... }
       },
       "incentiveRules": [...],
       "shifts": [...],
       "inventoryItems": [...],
       "retention": [...],
       "settings": { "language": "ar", "currency": "EGP", "vatDisplayMode": "afterVat" },
       "lastUpdated": "2026-10-25T11:34:00.000Z"
     }
     ```
   - توفير مسارات `GET /api/store` و `POST /api/store` للمزامنة الكاملة، مع الإبقاء على كافة مسارات التوافق القديمة.

---

## 5. نظام البحث الشامل والتنقل (Command Palette & Layout)

1. **مكون `src/components/layout/CommandPalette.tsx`**:
   - يُفتح بالضغط على `Ctrl+K` أو `⌘K` أو زر البحث في الشريط العلوي.
   - يتيح الوصول الفوري إلى:
     - الانتقال لأي صفحة من الصفحات الـ 9.
     - البحث عن أي موظف بالاسم أو الرقم الوظيفي وفتح تقريره.
     - تشغيل الإجراءات السريعة (رفع إكسيل، تصدير، ضبط الهدف).
2. **مكون `src/components/layout/MainAppLayout.tsx`**:
   - إدارة الـ Sidebar القابل للطي على الشاشات الكبيرة.
   - الشريط العلوي الثابت مع Breadcrumbs، واختيار الفترة والفرع، ومركز التنبيهات وساعة التزامن.
   - شريط التنقل السفلي اللمسي على شاشات الهواتف مع نافذة "المزيد".
   - زر الإجراءات السريعة العائم (Quick Actions Floating Speed Dial).

---

## 6. خطة التحقق والتشغيل الخالي من الأخطاء (Verification Plan)

1. **فحص الـ Build والـ TypeScript**:
   - تشغيل `compile_applet` و `lint_applet` لضمان عدم وجود أي أخطاء في الأنواع أو الاستيرادات.
2. **فحص ثبات مصدر البيانات (Zero-Discrepancy Check)**:
   - مطابقة أرقام المبيعات والتارجت في الصفحة الرئيسية مع صفحة المبيعات وصفحة الأهداف للتأكد من استخدام نفس الـ Selector.
3. **فحص التوافقية الشاملة**:
   - اختبار التبديل بين الشاشات الـ 9 في المتصفح وعبر الروابط المباشرة (Deep Links).
   - تجربة الواجهة على مقاسات الشاشات المختلفة (Desktop 1440px و Mobile 390px).
4. **قائمة التدقيق الصارمة للمكونات (Component Checklist)**:
   - التحقق من وجود كافة المكونات الـ 35+ القديمة دون استبعاد أي وظيفة.
