# Graph Report - ipl  (2026-10-20)

## Corpus Check
- 94 files · ~171,274 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 538 nodes · 1682 edges · 43 communities (20 shown, 23 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 15 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Core UI Components
- App Context & State
- Supabase API Layer
- Project Config & Design Spec
- App JSON & Navigation Config
- Navigation & Tab Bar
- Initial Data & Seed
- Bendahara (Treasurer) Dashboard
- Package Dependencies
- Entry Points & Alerts
- Empty State Components
- Quick Action Grid
- Virtual Resident Card
- UI Badge Components
- Receipt Modal
- Kas Widget & UI Index
- Pengurus (Staff) Dashboard
- Expo SDK Packages
- Build Scripts
- TypeScript Config
- Expo Core
- Expo Device
- Expo Haptics
- Expo Image Picker
- Expo Linear Gradient
- Expo Location
- Expo Metro Runtime
- Expo Notifications
- Expo Status Bar
- Lucide Icons
- React Core
- React DOM
- React Native Core
- AsyncStorage
- React Native Maps
- QR Code SVG
- React Native Screens
- React Native SVG
- React Native Web
- Bottom Tabs Navigation
- React Navigation Core
- Native Stack Navigation
- Supabase JS Client

## God Nodes (most connected - your core abstractions)
1. `useApp()` - 60 edges
2. `colors` - 51 edges
3. `radius` - 49 edges
4. `typography` - 47 edges
5. `spacing` - 36 edges
6. `shadows` - 36 edges
7. `AppProvider()` - 34 edges
8. `colors` - 32 edges
9. `radius` - 31 edges
10. `spacing` - 30 edges

## Surprising Connections (you probably didn't know these)
- `IPL Mobile App Icon` --references--> `IPL Mobile Expo/React Native Project`  [INFERRED]
  assets/icon.png → AGENTS.md
- `Caveman Voice LLM Skill` --conceptually_related_to--> `IPL Mobile Agent Specification`  [INFERRED]
  .agents/skills/caveman/SKILL.md → AGENTS.md
- `IPL Mobile Agent Specification` --conceptually_related_to--> `IPL Mobile Design System Specification v2.0.0`  [INFERRED]
  AGENTS.md → desain.md
- `CLAUDE.md Agent Redirect` --references--> `IPL Mobile Agent Specification`  [EXTRACTED]
  CLAUDE.md → AGENTS.md
- `IPL Mobile Design System Specification v2.0.0` --references--> `IPL Mobile Expo/React Native Project`  [EXTRACTED]
  desain.md → AGENTS.md

## Import Cycles
- None detected.

## Communities (43 total, 23 thin omitted)

### Community 0 - "Core UI Components"
Cohesion: 0.15
Nodes (49): AppBadge(), AppButton(), AppCard(), styles, AppHeader(), styles, AppModal(), styles (+41 more)

### Community 1 - "App Context & State"
Cohesion: 0.09
Nodes (49): supabase, AppContext, AppProvider(), init(), PosIuranScreen(), apiLogin(), filterBillsByRole(), filterEventsByRole() (+41 more)

### Community 2 - "Supabase API Layer"
Cohesion: 0.11
Nodes (38): BASE64_LOOKUP, buildClient(), decodeBase64ToArrayBuffer(), DEFAULT_SUPABASE_ANON_KEY, DEFAULT_SUPABASE_URL, initCustomSupabaseCredentials(), isSupabaseConfigured, safeStorage (+30 more)

### Community 3 - "Project Config & Design Spec"
Cohesion: 0.07
Nodes (43): Continuous Native Generation Rule, EAS Build & Deploy System, IPL Mobile Expo/React Native Project, Expo Router Navigation Pattern, IPL Mobile Agent Specification, Caveman Skill README, Megacave Skill Variant (Classical Chinese), Ultracave Skill Variant (+35 more)

### Community 4 - "App JSON & Navigation Config"
Cohesion: 0.05
Nodes (41): backgroundColor, foregroundImage, adaptiveIcon, config, googleServicesFile, package, permissions, versionCode (+33 more)

### Community 5 - "Navigation & Tab Bar"
Cohesion: 0.12
Nodes (27): useApp(), CustomTabBar(), FloatingBottomBar(), MainTabNavigator(), RootNavigator(), Stack, Tab, DataAksesScreen() (+19 more)

### Community 6 - "Initial Data & Seed"
Cohesion: 0.14
Nodes (22): ALASAN_PENOLAKAN_PRESET, INITIAL_ADMIN_AUTH, INITIAL_AUDIT_LOGS, INITIAL_BANK_ACCOUNTS, INITIAL_CONFIG, INITIAL_EVENTS, INITIAL_JADWAL_SATPAM, INITIAL_JENIS_IURAN (+14 more)

### Community 7 - "Bendahara (Treasurer) Dashboard"
Cohesion: 0.17
Nodes (19): BendaharaHeroCard(), BendaharaHeroCardProps, styles, KasWidget(), RTHeroCard(), RTHeroCardProps, styles, styles (+11 more)

### Community 8 - "Package Dependencies"
Cohesion: 0.10
Nodes (19): devDependencies, patch-package, @types/react, @types/react-native, typescript, main, name, private (+11 more)

### Community 9 - "Entry Points & Alerts"
Cohesion: 0.16
Nodes (8): App(), CustomAlertModal(), ErrorBoundary, alertQueue, closeCustomAlert(), initializeCustomAlertOverride(), registerAlertSubscriber(), showCustomAlert()

### Community 10 - "Empty State Components"
Cohesion: 0.17
Nodes (11): AppEmptyState(), AppEmptyStateProps, EmptyStateType, styles, Button(), ButtonProps, ButtonVariant, styles (+3 more)

### Community 11 - "Quick Action Grid"
Cohesion: 0.15
Nodes (12): CellProps, QuickActionGrid(), QuickActionGridProps, QuickActionItem, styles, NotificationBadge(), NotificationBadgeProps, styles (+4 more)

### Community 12 - "Virtual Resident Card"
Cohesion: 0.20
Nodes (13): currentPeriod(), haptic(), MONTHS_ID, ResidentCardStatus, splitCurrency(), STATUS_CONFIG, StatusConfig, styles (+5 more)

### Community 13 - "UI Badge Components"
Cohesion: 0.19
Nodes (11): Badge(), BadgeProps, styles, gradients, MAX_FONT_SCALE, MONO, motion, SANS (+3 more)

### Community 14 - "Receipt Modal"
Cohesion: 0.21
Nodes (8): ReceiptData, ReceiptModal(), ReceiptModalProps, styles, BULAN_INDONESIA_FULL, BULAN_INDONESIA_SHORT, formatDateIndo(), formatDateTimeIndo()

### Community 15 - "Kas Widget & UI Index"
Cohesion: 0.24
Nodes (7): KasWidgetProps, styles, InputProps, styles, Skeleton(), SkeletonProps, styles

### Community 16 - "Pengurus (Staff) Dashboard"
Cohesion: 0.22
Nodes (7): PengurusHeroCard(), PengurusHeroCardProps, styles, RWHeroCard(), RWHeroCardProps, styles, TABULAR

### Community 17 - "Expo SDK Packages"
Cohesion: 0.29
Nodes (7): expo-clipboard, expo-constants, dependencies, expo-clipboard, expo-constants, react-native-safe-area-context, react-native-safe-area-context

### Community 18 - "Build Scripts"
Cohesion: 0.33
Nodes (5): { execSync }, fs, patchPackageBin, path, targetFile

### Community 19 - "TypeScript Config"
Cohesion: 0.50
Nodes (3): expo/tsconfig.base, compilerOptions, extends

## Knowledge Gaps
- **181 isolated node(s):** `name`, `slug`, `version`, `orientation`, `icon` (+176 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **23 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `colors` connect `Core UI Components` to `Supabase API Layer`, `Navigation & Tab Bar`, `Bendahara (Treasurer) Dashboard`, `Empty State Components`, `Quick Action Grid`, `Virtual Resident Card`, `UI Badge Components`, `Receipt Modal`, `Kas Widget & UI Index`, `Pengurus (Staff) Dashboard`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Why does `radius` connect `Core UI Components` to `Supabase API Layer`, `Bendahara (Treasurer) Dashboard`, `Empty State Components`, `Quick Action Grid`, `Virtual Resident Card`, `UI Badge Components`, `Receipt Modal`, `Kas Widget & UI Index`, `Pengurus (Staff) Dashboard`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Why does `typography` connect `Core UI Components` to `Supabase API Layer`, `Bendahara (Treasurer) Dashboard`, `Empty State Components`, `Quick Action Grid`, `Virtual Resident Card`, `UI Badge Components`, `Receipt Modal`, `Kas Widget & UI Index`, `Pengurus (Staff) Dashboard`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **What connects `name`, `slug`, `version` to the rest of the system?**
  _181 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Core UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.14694369165913881 - nodes in this community are weakly interconnected._
- **Should `App Context & State` be split into smaller, more focused modules?**
  _Cohesion score 0.09415584415584416 - nodes in this community are weakly interconnected._
- **Should `Supabase API Layer` be split into smaller, more focused modules?**
  _Cohesion score 0.1101010101010101 - nodes in this community are weakly interconnected._