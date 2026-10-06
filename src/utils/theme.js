// IPL Mobile Design System Tokens
export const colors = {
  primary: '#D71920',
  primaryDark: '#B51218',
  primaryLight: '#FFF1F2',
  primaryGhost: 'rgba(215, 25, 32, 0.06)',

  background: '#F6F7F9',
  surface: '#FFFFFF',
  card: '#FFFFFF',

  textPrimary: '#172033',
  textSecondary: '#667085',
  textMuted: '#98A2B3',
  textMain: '#172033', // Backward compat

  border: '#E4E7EC',
  borderLight: '#F2F4F7',

  success: '#12B76A',
  successBg: '#ECFDF3',
  warning: '#F79009',
  warningBg: '#FFFAEB',
  error: '#F04438',
  danger: '#F04438',
  dangerBg: '#FEF3F2',
  info: '#2E90FA',
  infoBg: '#EFF8FF',

  white: '#FFFFFF',
  black: '#000000'
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32
}

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999
}

export const typography = {
  h1: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
    lineHeight: 30,
    letterSpacing: -0.5
  },
  h2: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 26,
    letterSpacing: -0.3
  },
  h3: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 22,
    letterSpacing: -0.2
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 28,
    letterSpacing: -0.3
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 22
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 20
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    lineHeight: 18,
    marginBottom: 4
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: 18
  },
  body: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textPrimary,
    lineHeight: 20
  },
  bodySecondary: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: 20
  },
  caption: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: 16
  },
  button: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20
  }
}

export const shadows = {
  none: {},
  soft: {
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1
  },
  card: {
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2
  },
  floating: {
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4
  },
  redGlow: {
    shadowColor: '#D71920',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3
  }
}
