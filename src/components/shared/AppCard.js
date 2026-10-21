import React from 'react'
import { View, StyleSheet, TouchableOpacity } from 'react-native'
import { colors, spacing, radius, shadows } from '../../utils/theme'

export default function AppCard({
  children,
  onPress,
  style,
  noPadding = false,
  variant = 'default' // 'default' | 'elevated' | 'outlined' | 'flat'
}) {
  const cardStyle = [
    styles.card,
    noPadding && styles.noPadding,
    variant === 'elevated' && styles.elevated,
    variant === 'outlined' && styles.outlined,
    variant === 'flat' && styles.flat,
    style
  ]

  if (onPress) {
    return (
      <TouchableOpacity
        style={cardStyle}
        onPress={onPress}
        activeOpacity={0.85}
      >
        {children}
      </TouchableOpacity>
    )
  }

  return <View style={cardStyle}>{children}</View>
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
    marginBottom: spacing.md
  },
  noPadding: {
    padding: 0
  },
  elevated: {
    ...shadows.floating
  },
  outlined: {
    shadowOpacity: 0,
    elevation: 0
  },
  flat: {
    backgroundColor: colors.background,
    borderColor: colors.borderLight,
    shadowOpacity: 0,
    elevation: 0
  }
})
