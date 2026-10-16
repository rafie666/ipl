import { Easing } from 'react-native';

export const colors = {
  // Brand
  primaryDark: '#022C22',
  primary: '#064E3B',
  primaryLight: '#0F766E',
  primarySubtle: '#ECFDF5',
  primaryGhost: 'rgba(6, 78, 59, 0.08)',

  // Accent
  accentLime: '#D4F636',
  accentLimePressed: '#C0E228',
  accentLimeGlow: 'rgba(212, 246, 54, 0.40)',

  // Neutral
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceMuted: '#F1F5F9',
  border: '#E2E8F0',
  borderStrong: '#CBD5E1',
  borderFocus: '#064E3B',

  // Text
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#64748B',
  textPlaceholder: '#5F6E82',
  textDisabled: '#94A3B8',
  textInverse: '#FFFFFF',
  textOnLime: '#022C22',

  // On-card (di atas gradien emerald)
  onCardPrimary: '#FFFFFF',
  onCardSecondary: 'rgba(255, 255, 255, 0.75)',
  onCardTertiary: 'rgba(255, 255, 255, 0.60)',
  onCardSkeleton: 'rgba(255, 255, 255, 0.10)',
  onCardSkeletonHighlight: 'rgba(255, 255, 255, 0.18)',

  // Skeleton (di atas permukaan terang)
  skeletonBase: '#E2E8F0',
  skeletonHighlight: 'rgba(255, 255, 255, 0.60)',

  // Overlay
  scrim: 'rgba(15, 23, 42, 0.48)',

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
  info:     { label: 'INFO',         solid: '#8B5CF6', fg: '#6D28D9', bg: '#F5F3FF', border: '#DDD6FE' },
};

// Tint + ikon quick action (ikon 700-level di atas tint 50-level; kontras ikon >= 3:1)
export const actionTints = {
  bayar:   { bg: '#ECFDF5', icon: '#047857' },
  lapor:   { bg: '#FFFBEB', icon: '#B45309' },
  surat:   { bg: '#EFF6FF', icon: '#1D4ED8' },
  satpam:  { bg: '#F5F3FF', icon: '#6D28D9' },
  kas:     { bg: '#F0FDFA', icon: '#0F766E' },
  acara:   { bg: '#FDF2F8', icon: '#BE185D' },
  denah:   { bg: '#F0F9FF', icon: '#0369A1' },
  darurat: { bg: '#FEF2F2', icon: '#B91C1C' },
} as const;

export const spacing = {
  s0: 0, s1: 4, s2: 8, s3: 12, s4: 16, s5: 20,
  s6: 24, s8: 32, s10: 40, s12: 48, s14: 56, s16: 64,
  gutter: 16,
} as const;

export const radius = {
  xs: 6, sm: 10, md: 16, lg: 18, xl: 24, full: 9999,
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
  display:   { fontFamily: SANS.extrabold, fontSize: 28, lineHeight: 34, letterSpacing: -0.6 },
  displaySm: { fontFamily: SANS.extrabold, fontSize: 24, lineHeight: 30, letterSpacing: -0.5 },
  h1:        { fontFamily: SANS.bold,      fontSize: 22, lineHeight: 28, letterSpacing: -0.4 },
  h2:        { fontFamily: SANS.bold,      fontSize: 18, lineHeight: 24, letterSpacing: -0.2 },
  h3:        { fontFamily: SANS.semibold,  fontSize: 16, lineHeight: 22, letterSpacing: 0 },
  bodyLg:    { fontFamily: SANS.medium,    fontSize: 15, lineHeight: 21, letterSpacing: 0 },
  body:      { fontFamily: SANS.regular,   fontSize: 14, lineHeight: 20, letterSpacing: 0 },
  label:     { fontFamily: SANS.bold,      fontSize: 14, lineHeight: 18, letterSpacing: 0.2 },
  labelSm:   { fontFamily: SANS.semibold,  fontSize: 12, lineHeight: 16, letterSpacing: 0.1 },
  caption:   { fontFamily: SANS.medium,    fontSize: 12, lineHeight: 16, letterSpacing: 0.1 },
  micro:     { fontFamily: SANS.bold,      fontSize: 10, lineHeight: 14, letterSpacing: 0.5 },
  tabLabel:  { fontFamily: SANS.bold,      fontSize: 11, lineHeight: 14, letterSpacing: 0.1 },
  mono:      { fontFamily: MONO.medium,    fontSize: 13, lineHeight: 18, letterSpacing: 0 },
  monoSm:    { fontFamily: MONO.medium,    fontSize: 11, lineHeight: 16, letterSpacing: 0.8 },
  // Compatibility keys
  bodySecondary: { fontFamily: SANS.regular, fontSize: 13, lineHeight: 18, letterSpacing: 0 },
  cardTitle:     { fontFamily: SANS.semibold, fontSize: 16, lineHeight: 22, letterSpacing: 0 },
  screenTitle:   { fontFamily: SANS.bold,     fontSize: 22, lineHeight: 28, letterSpacing: -0.4 },
  sectionTitle:  { fontFamily: SANS.bold,     fontSize: 18, lineHeight: 24, letterSpacing: -0.2 },
  subtitle:      { fontFamily: SANS.regular,  fontSize: 14, lineHeight: 20, letterSpacing: 0 },
} as const;

export const TABULAR = { fontVariant: ['tabular-nums'] as ('tabular-nums')[] };
export const MAX_FONT_SCALE = 1.3;

// Default: RN >= 0.76 `boxShadow` (multi-layer)
export const shadows = {
  card:
    '0px 1px 2px rgba(15, 23, 42, 0.04), 0px 4px 16px rgba(15, 23, 42, 0.05)',
  cardPressed:
    '0px 1px 2px rgba(15, 23, 42, 0.04), 0px 2px 8px rgba(15, 23, 42, 0.04)',
  elevatedCard:
    '0px 2px 4px rgba(6, 78, 59, 0.10), 0px 10px 24px rgba(6, 78, 59, 0.14), 0px 24px 48px rgba(6, 78, 59, 0.08)',
  floatingNav:
    '0px 2px 6px rgba(15, 23, 42, 0.06), 0px 12px 28px rgba(15, 23, 42, 0.10)',
  neonGlow:
    '0px 2px 4px rgba(212, 246, 54, 0.30), 0px 6px 18px rgba(212, 246, 54, 0.45)',
  neonGlowPressed: '0px 2px 8px rgba(212, 246, 54, 0.25)',
  sheet: '0px -8px 32px rgba(15, 23, 42, 0.12)',
} as const;

// Fallback untuk RN < 0.76 (satu layer saja)
export const shadowsLegacy = {
  card:         { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 4 },  shadowOpacity: 0.05, shadowRadius: 16, elevation: 2 },
  elevatedCard: { shadowColor: '#064E3B', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.14, shadowRadius: 24, elevation: 6 },
  floatingNav:  { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.10, shadowRadius: 28, elevation: 8 },
  neonGlow:     { shadowColor: '#D4F636', shadowOffset: { width: 0, height: 6 },  shadowOpacity: 0.45, shadowRadius: 18, elevation: 7 },
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
  cardAspect: 1.586,          // ISO/IEC 7810 ID-1 (85.60 x 53.98 mm)
  navHeight: 68,
  navMarginH: 20,
  navCenterSize: 54,
  navCenterRaise: 14,
  maxContentWidth: 480,
} as const;

export const gradients = {
  residentCard: ['#064E3B', '#022C22'] as const, // start {0,0} end {1,1}
};
