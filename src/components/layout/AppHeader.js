import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft } from 'lucide-react-native'
import { colors, spacing, radius, shadows, typography } from '../../utils/theme'

export default function AppHeader({
  title,
  subtitle,
  onBack,
  navigation,
  showBack = true,
  rightAction,
  variant = 'primary', // 'primary' (red) | 'surface' (white)
  style
}) {
  const insets = useSafeAreaInsets()
  const isPrimary = variant === 'primary'

  const handleBack = () => {
    if (typeof onBack === 'function') {
      onBack()
    } else if (navigation?.canGoBack && navigation.canGoBack()) {
      navigation.goBack()
    } else if (navigation) {
      navigation.navigate('Main', { screen: 'DashboardTab' })
    }
  }

  const hasBackAction = showBack && (typeof onBack === 'function' || navigation)

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
        {hasBackAction ? (
          <TouchableOpacity
            style={[styles.backBtn, isPrimary ? styles.backBtnPrimary : styles.backBtnSurface]}
            onPress={handleBack}
            activeOpacity={0.7}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            accessibilityRole="button"
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
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    ...shadows.soft
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
    fontFamily: typography.h2.fontFamily,
    fontSize: 18,
    lineHeight: 24,
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
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
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
