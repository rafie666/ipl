import { Easing } from 'react-native';

export const colors = {
  // Brand Emerald & Forest Green (IPL Mobile Theme)
  primaryDark: '#022C22',       // Deep Forest 950
  primaryDeep: '#064E3B',       // Dark Emerald 900
  primary: '#059669',           // Vibrant Emerald 600
  primaryLight: '#10B981',      // Fresh Mint 500
  primarySubtle: '#ECFDF5',     // Mint 50 tint
  primaryGhost: 'rgba(5, 150, 105, 0.08)',
  brandGreen: '#059669',

  // Accent & Contrast
  accent: '#10B981',
  accentLime: '#D4F636',        // Neo-banking lime accent
  accentLimePressed: '#C0E228',
  accentSubtle: '#ECFDF5',
  accentPressed: '#047857',

  // Neutral & Surface (Clean, professional, soft)
  background: '#F8FAFC',        // Slate 50 canvas
  surface: '#FFFFFF',           // Pure White
  surfaceMuted: '#F1F5F9',      // Slate 100
  surfaceSubtle: '#F8FAFC',
  border: '#E2E8F0',            // Slate 200 divider
  borderStrong: '#CBD5E1',      // Slate 300
  borderFocus: '#059669',

  // Text Hierarchy
  textPrimary: '#0F172A',       // Slate 900
  textSecondary: '#475569',     // Slate 600
  textMuted: '#64748B',         // Slate 500 (WCAG AA pass 4.75:1)
  textPlaceholder: '#94A3B8',   // Slate 400
  textDisabled: '#CBD5E1',      // Slate 300
  textInverse: '#FFFFFF',
  textOnGreen: '#FFFFFF',
  textOnLime: '#022C22',

  // On-card (di atas kartu aksen hijau)
  onCardPrimary: '#FFFFFF',
  onCardSecondary: 'rgba(255, 255, 255, 0.88)',
  onCardTertiary: 'rgba(255, 255, 255, 0.68)',
  onCardSkeleton: 'rgba(255, 255, 255, 0.14)',
  onCardSkeletonHighlight: 'rgba(255, 255, 255, 0.25)',

  // Skeleton (di atas permukaan terang)
  skeletonBase: '#E2E8F0',
  skeletonHighlight: 'rgba(255, 255, 255, 0.65)',

  // Overlay
  scrim: 'rgba(15, 23, 42, 0.50)',

  white: '#FFFFFF',
} as const;

export type StatusKey = 'paid' | 'unpaid' | 'overdue' | 'pending' | 'rejected' | 'info';

export const status: Record<
  StatusKey,
  { label: string; solid: string; fg: string; bg: string; border: string }
> = {
  paid:     { label: 'LUNAS',        solid: '#10B981', fg: '#047857', bg: '#ECFDF5', border: '#A7F3D0' },
  unpaid:   { label: 'BELUM BAYAR',  solid: '#F59E0B', fg: '#B45309', bg: '#FFFBEB', border: '#FDE68A' },
  overdue:  { label: 'LEWAT TEMPO',  solid: '#F59E0B', fg: '#B45309', bg: '#FFFBEB', border: '#FDE68A' },
  pending:  { label: 'VERIFIKASI',   solid: '#3B82F6', fg: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE' },
  rejected: { label: 'DITOLAK',      solid: '#EF4444', fg: '#B91C1C', bg: '#FEF2F2', border: '#FECACA' },
  info:     { label: 'INFO',         solid: '#0284C7', fg: '#0369A1', bg: '#F0F9FF', border: '#BAE6FD' },
};

// Tint + ikon quick action (ikon 700-level di atas tint 50-level)
export const actionTints = {
  bayar:   { bg: '#ECFDF5', icon: '#059669' },
  lapor:   { bg: '#FFFBEB', icon: '#B45309' },
  surat:   { bg: '#EFF6FF', icon: '#1D4ED8' },
  satpam:  { bg: '#F0FDF4', icon: '#047857' },
  kas:     { bg: '#ECFDF5', icon: '#059669' },
  acara:   { bg: '#FEF3C7', icon: '#D97706' },
  denah:   { bg: '#F0F9FF', icon: '#0369A1' },
  darurat: { bg: '#FEF2F2', icon: '#DC2626' },
} as const;

export const spacing = {
  s0: 0, s1: 4, s2: 8, s3: 12, s4: 16, s5: 20,
  s6: 24, s8: 32, s10: 40, s12: 48, s14: 56, s16: 64,
  gutter: 16,
} as const;

export const radius = {
  xs: 6, sm: 8, md: 12, lg: 16, xl: 20, full: 9999,
} as const;

const SANS = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extrabold: 'PlusJakartaSans_800ExtraBold',
} as const;
const MONO = { medium: 'JetBrainsMono_500Medium', bold: 'JetBrainsMono_700Bold' } as const;

export const typography = {
  display:   { fontFamily: SANS.extrabold, fontSize: 26, lineHeight: 32, letterSpacing: -0.6 },
  displaySm: { fontFamily: SANS.extrabold, fontSize: 22, lineHeight: 28, letterSpacing: -0.4 },
  h1:        { fontFamily: SANS.bold,      fontSize: 20, lineHeight: 26, letterSpacing: -0.3 },
  h2:        { fontFamily: SANS.bold,      fontSize: 17, lineHeight: 23, letterSpacing: -0.2 },
  h3:        { fontFamily: SANS.semibold,  fontSize: 15, lineHeight: 21, letterSpacing: 0 },
  bodyLg:    { fontFamily: SANS.medium,    fontSize: 14, lineHeight: 20, letterSpacing: 0 },
  body:      { fontFamily: SANS.regular,   fontSize: 13, lineHeight: 19, letterSpacing: 0 },
  label:     { fontFamily: SANS.bold,      fontSize: 13, lineHeight: 18, letterSpacing: 0.1 },
  labelSm:   { fontFamily: SANS.semibold,  fontSize: 11, lineHeight: 15, letterSpacing: 0.1 },
  caption:   { fontFamily: SANS.medium,    fontSize: 11, lineHeight: 15, letterSpacing: 0.1 },
  micro:     { fontFamily: SANS.bold,      fontSize: 10, lineHeight: 13, letterSpacing: 0.5 },
  tabLabel:  { fontFamily: SANS.bold,      fontSize: 10, lineHeight: 13, letterSpacing: 0.1 },
  mono:      { fontFamily: MONO.medium,    fontSize: 12, lineHeight: 17, letterSpacing: 0 },
  monoSm:    { fontFamily: MONO.medium,    fontSize: 10, lineHeight: 15, letterSpacing: 0.6 },
  // Compatibility keys
  bodySecondary: { fontFamily: SANS.regular, fontSize: 13, lineHeight: 18, letterSpacing: 0 },
  cardTitle:     { fontFamily: SANS.semibold, fontSize: 15, lineHeight: 21, letterSpacing: 0 },
  screenTitle:   { fontFamily: SANS.bold,     fontSize: 20, lineHeight: 26, letterSpacing: -0.3 },
  sectionTitle:  { fontFamily: SANS.bold,     fontSize: 17, lineHeight: 23, letterSpacing: -0.2 },
  subtitle:      { fontFamily: SANS.regular,  fontSize: 13, lineHeight: 19, letterSpacing: 0 },
} as const;

export const TABULAR = { fontVariant: ['tabular-nums'] as ('tabular-nums')[] };
export const MAX_FONT_SCALE = 1.3;

// Default: RN >= 0.76 `boxShadow` (multi-layer)
export const shadows = {
  card:
    '0px 1px 3px rgba(15, 23, 42, 0.05), 0px 4px 12px rgba(15, 23, 42, 0.04)',
  cardPressed:
    '0px 1px 2px rgba(15, 23, 42, 0.04)',
  elevatedCard:
    '0px 2px 6px rgba(185, 28, 28, 0.12), 0px 10px 24px rgba(185, 28, 28, 0.14)',
  floatingNav:
    '0px 2px 6px rgba(15, 23, 42, 0.05), 0px 8px 24px rgba(15, 23, 42, 0.10)',
  sheet: '0px -6px 24px rgba(15, 23, 42, 0.10)',
} as const;

// Fallback untuk RN < 0.76 (satu layer saja)
export const shadowsLegacy = {
  card:         { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 },  shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  elevatedCard: { shadowColor: '#B91C1C', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.18, shadowRadius: 16, elevation: 5 },
  floatingNav:  { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 6 },
} as const;

export const motion = {
  duration: { instant: 90, fast: 150, base: 240, slow: 320, count: 800, shimmer: 1200 },
  spring: {
    press: { damping: 15, stiffness: 150, mass: 1 },
    sheet: { damping: 22, stiffness: 220, mass: 1 },
  },
  easing: {
    standard: Easing.bezier(0.2, 0, 0, 1),
    out: Easing.out(Easing.cubic),
  },
} as const;

export const layout = {
  minTouch: 48,
  headerHeight: 56,
  cardAspect: 1.586,          // ISO/IEC 7810 ID-1
  navHeight: 64,
  navMarginH: 16,
  navCenterSize: 52,
  navCenterRaise: 12,
  maxContentWidth: 480,
  screenPaddingBottom: 104,   // Extra bottom padding to clear floating navigation bar
} as const;

export const gradients = {
  residentCard: ['#DC2626', '#991B1B'] as const, // Red to Deep Crimson
  primaryHero: ['#DC2626', '#B91C1C'] as const,
};

