# Graph Report - ipl  (2026-10-21)

## Corpus Check
- 96 files · ~179,490 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 524 nodes · 1683 edges · 44 communities (20 shown, 24 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- App State & Data Layer
- Layout & Navigation Bar
- Supabase API Client
- Bottom Tab Navigation
- Expo App Config
- Transaction & Pengurus UI
- Dev Dependencies
- Virtual Resident Card
- Kas Widget & Modals
- App Entry & Error Boundary
- Receipt Modal & UI Primitives
- Empty State & Buttons
- Quick Action Grid
- Bendahara Hero Card
- RT Hero Card
- RW Hero Card
- Expo SDK Packages
- Admin Hero Card
- Patch Scripts
- TypeScript Config
- expo
- expo-clipboard
- expo-device
- expo-haptics
- expo-image-picker
- expo-location
- @expo/metro-runtime
- expo-status-bar
- lucide-react-native
- react
- react-dom
- react-native
- AsyncStorage
- react-native-maps
- react-native-qrcode-svg
- react-native-safe-area-context
- react-native-screens
- react-native-svg
- react-native-web
- react-native-webview
- @react-navigation/bottom-tabs
- @react-navigation/native
- @react-navigation/native-stack
- @supabase/supabase-js

## God Nodes (most connected - your core abstractions)
1. `useApp()` - 62 edges
2. `colors` - 53 edges
3. `radius` - 50 edges
4. `typography` - 49 edges
5. `shadows` - 37 edges
6. `spacing` - 36 edges
7. `AppProvider()` - 34 edges
8. `colors` - 33 edges
9. `radius` - 31 edges
10. `spacing` - 30 edges

## Surprising Connections (you probably didn't know these)
- `init()` --calls--> `initCustomSupabaseCredentials()`  [EXTRACTED]
  src/context/AppContext.js → src/api/supabase.js
- `VirtualResidentCardBase()` --calls--> `formatRupiah()`  [EXTRACTED]
  src/components/cards/VirtualResidentCard.tsx → src/utils/format.ts
- `VirtualResidentCardBase()` --calls--> `formatRupiahCompact()`  [EXTRACTED]
  src/components/cards/VirtualResidentCard.tsx → src/utils/format.ts
- `BendaharaHeroCard()` --calls--> `formatRupiah()`  [EXTRACTED]
  src/components/hero/BendaharaHeroCard.tsx → src/utils/format.ts
- `RTHeroCard()` --calls--> `formatRupiah()`  [EXTRACTED]
  src/components/hero/RTHeroCard.tsx → src/utils/format.ts

## Import Cycles
- None detected.

## Communities (44 total, 24 thin omitted)

### Community 0 - "App State & Data Layer"
Cohesion: 0.06
Nodes (71): supabase, AppContext, AppProvider(), init(), ALASAN_PENOLAKAN_PRESET, INITIAL_ADMIN_AUTH, INITIAL_AUDIT_LOGS, INITIAL_BANK_ACCOUNTS (+63 more)

### Community 1 - "Layout & Navigation Bar"
Cohesion: 0.15
Nodes (48): AppHeader(), styles, styles, TopAppBar(), styles, AppModal(), styles, styles (+40 more)

### Community 2 - "Supabase API Client"
Cohesion: 0.11
Nodes (39): BASE64_LOOKUP, buildClient(), decodeBase64ToArrayBuffer(), DEFAULT_SUPABASE_ANON_KEY, DEFAULT_SUPABASE_URL, initCustomSupabaseCredentials(), isSupabaseConfigured, safeStorage (+31 more)

### Community 3 - "Bottom Tab Navigation"
Cohesion: 0.09
Nodes (36): useApp(), CustomTabBar(), FloatingBottomBar(), FloatingBottomBarProps, styles, MainTabNavigator(), RootNavigator(), Stack (+28 more)

### Community 4 - "Expo App Config"
Cohesion: 0.05
Nodes (38): backgroundColor, foregroundImage, adaptiveIcon, googleServicesFile, package, permissions, versionCode, projectId (+30 more)

### Community 5 - "Transaction & Pengurus UI"
Cohesion: 0.13
Nodes (17): styles, TransactionCategory, TransactionListItemProps, PengurusHeroCard(), PengurusHeroCardProps, styles, Badge(), BadgeProps (+9 more)

### Community 6 - "Dev Dependencies"
Cohesion: 0.10
Nodes (19): devDependencies, patch-package, @types/react, @types/react-native, typescript, main, name, private (+11 more)

### Community 7 - "Virtual Resident Card"
Cohesion: 0.14
Nodes (17): chipStyles, ContactlessIcon, currentPeriod(), EmvChip, haptic(), LoadingSkeleton, MONTHS_ID, ResidentCardStatus (+9 more)

### Community 8 - "Kas Widget & Modals"
Cohesion: 0.23
Nodes (12): KasWidget(), KasWidgetProps, styles, TransactionListItem(), ReceiptModal(), styles, BULAN_INDONESIA_FULL, BULAN_INDONESIA_SHORT (+4 more)

### Community 9 - "App Entry & Error Boundary"
Cohesion: 0.16
Nodes (8): App(), CustomAlertModal(), ErrorBoundary, alertQueue, closeCustomAlert(), initializeCustomAlertOverride(), registerAlertSubscriber(), showCustomAlert()

### Community 10 - "Receipt Modal & UI Primitives"
Cohesion: 0.18
Nodes (10): ReceiptData, ReceiptModalProps, styles, Input(), InputProps, styles, Skeleton(), SkeletonProps (+2 more)

### Community 11 - "Empty State & Buttons"
Cohesion: 0.20
Nodes (11): AppEmptyState(), AppEmptyStateProps, EmptyStateType, styles, Button(), ButtonProps, ButtonVariant, styles (+3 more)

### Community 12 - "Quick Action Grid"
Cohesion: 0.18
Nodes (9): CellProps, QuickActionGrid(), QuickActionGridProps, QuickActionItem, styles, NotificationBadge(), NotificationBadgeProps, styles (+1 more)

### Community 13 - "Bendahara Hero Card"
Cohesion: 0.27
Nodes (9): BendaharaHeroCard(), BendaharaHeroCardProps, chipSt, ContactlessIcon, EmvChip, haptic(), st, usePressScale() (+1 more)

### Community 14 - "RT Hero Card"
Cohesion: 0.27
Nodes (9): chipSt, ContactlessIcon, EmvChip, haptic(), RTHeroCard(), RTHeroCardProps, st, usePressScale() (+1 more)

### Community 15 - "RW Hero Card"
Cohesion: 0.27
Nodes (9): chipSt, ContactlessIcon, EmvChip, haptic(), RWHeroCard(), RWHeroCardProps, st, usePressScale() (+1 more)

### Community 16 - "Expo SDK Packages"
Cohesion: 0.29
Nodes (7): expo-constants, expo-linear-gradient, expo-notifications, dependencies, expo-constants, expo-linear-gradient, expo-notifications

### Community 17 - "Admin Hero Card"
Cohesion: 0.29
Nodes (6): AdminHeroCard(), AdminHeroCardProps, chipStyles, ContactlessIcon, EmvChip, styles

### Community 18 - "Patch Scripts"
Cohesion: 0.33
Nodes (5): { execSync }, fs, patchPackageBin, path, targetFile

### Community 19 - "TypeScript Config"
Cohesion: 0.50
Nodes (3): expo/tsconfig.base, compilerOptions, extends

## Knowledge Gaps
- **192 isolated node(s):** `name`, `slug`, `version`, `orientation`, `icon` (+187 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **24 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `colors` connect `Layout & Navigation Bar` to `Supabase API Client`, `Bottom Tab Navigation`, `Transaction & Pengurus UI`, `Virtual Resident Card`, `Kas Widget & Modals`, `Receipt Modal & UI Primitives`, `Empty State & Buttons`, `Quick Action Grid`, `Bendahara Hero Card`, `RT Hero Card`, `RW Hero Card`, `Admin Hero Card`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Why does `radius` connect `Layout & Navigation Bar` to `Supabase API Client`, `Bottom Tab Navigation`, `Transaction & Pengurus UI`, `Virtual Resident Card`, `Kas Widget & Modals`, `Receipt Modal & UI Primitives`, `Empty State & Buttons`, `Quick Action Grid`, `Bendahara Hero Card`, `RT Hero Card`, `RW Hero Card`, `Admin Hero Card`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **Why does `typography` connect `Layout & Navigation Bar` to `Supabase API Client`, `Bottom Tab Navigation`, `Transaction & Pengurus UI`, `Virtual Resident Card`, `Kas Widget & Modals`, `Receipt Modal & UI Primitives`, `Empty State & Buttons`, `Quick Action Grid`, `Bendahara Hero Card`, `RT Hero Card`, `RW Hero Card`, `Admin Hero Card`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **What connects `name`, `slug`, `version` to the rest of the system?**
  _192 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App State & Data Layer` be split into smaller, more focused modules?**
  _Cohesion score 0.05965324713488099 - nodes in this community are weakly interconnected._
- **Should `Layout & Navigation Bar` be split into smaller, more focused modules?**
  _Cohesion score 0.1490506329113924 - nodes in this community are weakly interconnected._
- **Should `Supabase API Client` be split into smaller, more focused modules?**
  _Cohesion score 0.10904255319148937 - nodes in this community are weakly interconnected._