import { Platform } from 'react-native';

// Re-export design tokens from canonical source src/theme/index.ts
export * from '../theme/index';

import {
  colors as canonicalColors,
  spacing as canonicalSpacing,
  radius as canonicalRadius,
  typography as canonicalTypography,
  shadows as canonicalShadows,
  shadowsLegacy as canonicalShadowsLegacy,
  status as canonicalStatus
} from '../theme/index';

// Backward compatibility map
export const colors = {
  ...canonicalColors,
  // Backward compatibility keys
  card: canonicalColors.surface,
  borderLight: canonicalColors.surfaceMuted,
  textMain: canonicalColors.textPrimary,
  success: canonicalStatus.paid.solid,
  successBg: canonicalStatus.paid.bg,
  warning: canonicalStatus.unpaid.solid,
  warningBg: canonicalStatus.unpaid.bg,
  error: canonicalStatus.rejected.solid,
  danger: canonicalStatus.rejected.solid,
  dangerBg: canonicalStatus.rejected.bg,
  info: canonicalStatus.pending.solid,
  infoBg: canonicalStatus.pending.bg,
  black: '#000000',
};

export const spacing = {
  ...canonicalSpacing,
  xs: canonicalSpacing.s1,
  sm: canonicalSpacing.s2,
  md: canonicalSpacing.s3,
  lg: canonicalSpacing.s4,
  xl: canonicalSpacing.s5,
  xxl: canonicalSpacing.s6,
  xxxl: canonicalSpacing.s8,
};

export const radius = {
  ...canonicalRadius,
};

export const typography = {
  ...canonicalTypography,
  screenTitle: canonicalTypography.h1,
  sectionTitle: canonicalTypography.h2,
  cardTitle: canonicalTypography.h3,
  subtitle: canonicalTypography.body,
};

const isWeb = typeof Platform !== 'undefined' && Platform?.OS === 'web';

export const shadows = {
  card: {
    ...canonicalShadowsLegacy.card,
    ...(isWeb ? { boxShadow: canonicalShadows.card } : {})
  },
  cardPressed: {
    ...canonicalShadowsLegacy.card,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
    ...(isWeb ? { boxShadow: canonicalShadows.cardPressed } : {})
  },
  elevatedCard: {
    ...canonicalShadowsLegacy.elevatedCard,
    ...(isWeb ? { boxShadow: canonicalShadows.elevatedCard } : {})
  },
  floatingNav: {
    ...canonicalShadowsLegacy.floatingNav,
    ...(isWeb ? { boxShadow: canonicalShadows.floatingNav } : {})
  },
  floating: {
    ...canonicalShadowsLegacy.floatingNav,
    ...(isWeb ? { boxShadow: canonicalShadows.floatingNav } : {})
  },
  soft: {
    ...canonicalShadowsLegacy.card,
    ...(isWeb ? { boxShadow: canonicalShadows.card } : {})
  },
  sm: {
    ...canonicalShadowsLegacy.card,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 1,
  },
  md: {
    ...canonicalShadowsLegacy.card,
  },
  small: {
    ...canonicalShadowsLegacy.card,
  },
  medium: {
    ...canonicalShadowsLegacy.card,
  },
  large: {
    ...canonicalShadowsLegacy.elevatedCard,
    ...(isWeb ? { boxShadow: canonicalShadows.elevatedCard } : {})
  },
  neonGlow: {
    ...canonicalShadowsLegacy.neonGlow,
    ...(isWeb ? { boxShadow: canonicalShadows.neonGlow } : {})
  },
  sheet: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.12,
    shadowRadius: 32,
    elevation: 8,
    ...(isWeb ? { boxShadow: canonicalShadows.sheet } : {})
  }
};

