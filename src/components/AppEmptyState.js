import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Inbox } from 'lucide-react-native'
import { colors, spacing, radius, typography } from '../utils/theme'
import AppButton from './AppButton'

export default function AppEmptyState({
  icon: Icon = Inbox,
  title = 'Belum Ada Data',
  description,
  actionLabel,
  onAction,
  style
}) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconCircle}>
        <Icon size={28} color={colors.textSecondary} strokeWidth={1.75} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {actionLabel && onAction ? (
        <View style={styles.actionWrap}>
          <AppButton
            title={actionLabel}
            onPress={onAction}
            variant="secondary"
            size="sm"
            fullWidth={false}
          />
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 4
  },
  description: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280
  },
  actionWrap: {
    marginTop: spacing.md
  }
})
