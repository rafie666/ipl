import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft } from 'lucide-react-native'
import { colors, spacing, radius, shadows, typography } from '../utils/theme'

export default function AppHeader({
  title,
  subtitle,
  onBack,
  rightAction,
  variant = 'primary', // 'primary' (red) | 'surface' (white)
  style
}) {
  const insets = useSafeAreaInsets()
  const isPrimary = variant === 'primary'

  return (
    <View
      style={[
        styles.container,
        isPrimary ? styles.containerPrimary : styles.containerSurface,
        { paddingTop: insets.top + spacing.sm },
        style
      ]}
    >
      <StatusBar
        barStyle={isPrimary ? 'light-content' : 'dark-content'}
        backgroundColor={isPrimary ? colors.primary : colors.surface}
      />
      <View style={styles.contentRow}>
        {onBack ? (
          <TouchableOpacity
            style={[styles.backBtn, isPrimary ? styles.backBtnPrimary : styles.backBtnSurface]}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel="Kembali"
          >
            <ArrowLeft size={20} color={isPrimary ? colors.white : colors.textPrimary} />
          </TouchableOpacity>
        ) : null}

        <View style={styles.titleContainer}>
          <Text
            style={[styles.title, isPrimary ? styles.titlePrimary : styles.titleSurface]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              style={[styles.subtitle, isPrimary ? styles.subtitlePrimary : styles.subtitleSurface]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>

        {rightAction ? <View style={styles.rightActionContainer}>{rightAction}</View> : <View style={styles.placeholderRight} />}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md
  },
  containerPrimary: {
    backgroundColor: colors.primary,
    ...shadows.redGlow
  },
  containerSurface: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    ...shadows.soft
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm
  },
  backBtnPrimary: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)'
  },
  backBtnSurface: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'center'
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2
  },
  titlePrimary: {
    color: colors.white
  },
  titleSurface: {
    color: colors.textPrimary
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '400',
    marginTop: 2
  },
  subtitlePrimary: {
    color: 'rgba(255, 255, 255, 0.85)'
  },
  subtitleSurface: {
    color: colors.textSecondary
  },
  rightActionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.sm
  },
  placeholderRight: {
    width: 4
  }
})
