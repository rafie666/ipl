import React from 'react'
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View
} from 'react-native'
import { colors, spacing, radius, typography, shadows } from '../utils/theme'

export default function AppButton({
  title,
  onPress,
  variant = 'primary', // 'primary' | 'secondary' | 'ghost' | 'danger'
  size = 'md', // 'sm' (38px) | 'md' (46px) | 'lg' (52px)
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = true,
  style,
  textStyle
}) {
  const isPrimary = variant === 'primary'
  const isSecondary = variant === 'secondary'
  const isGhost = variant === 'ghost'
  const isDanger = variant === 'danger'

  const buttonStyles = [
    styles.base,
    styles[size],
    isPrimary && styles.primary,
    isSecondary && styles.secondary,
    isGhost && styles.ghost,
    isDanger && styles.danger,
    fullWidth && styles.fullWidth,
    (disabled || loading) && styles.disabled,
    style
  ]

  const getTextColor = () => {
    if (disabled) return colors.textSecondary
    if (isPrimary || isDanger) return colors.surface
    if (isSecondary) return colors.primary
    if (isGhost) return colors.textSecondary
    return colors.surface
  }

  const textColor = getTextColor()

  const renderIcon = (pos) => {
    if (!icon || iconPosition !== pos) return null

    if (React.isValidElement(icon)) {
      return (
        <View style={pos === 'left' ? styles.iconLeft : styles.iconRight}>
          {icon}
        </View>
      )
    }

    if (typeof icon === 'function') {
      const IconComponent = icon
      return (
        <IconComponent
          size={size === 'sm' ? 14 : 18}
          color={textColor}
          style={pos === 'left' ? styles.iconLeft : styles.iconRight}
        />
      )
    }

    return null
  }

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.78}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        <View style={styles.contentRow}>
          {renderIcon('left')}
          {title ? (
            <Text style={[styles.text, { color: textColor }, size === 'sm' && styles.textSm, textStyle]}>
              {title}
            </Text>
          ) : null}
          {renderIcon('right')}
        </View>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg
  },
  sm: {
    minHeight: 38,
    paddingVertical: spacing.xs
  },
  md: {
    minHeight: 46,
    paddingVertical: spacing.sm
  },
  lg: {
    minHeight: 52,
    paddingVertical: spacing.md
  },
  fullWidth: {
    width: '100%'
  },
  primary: {
    backgroundColor: colors.primary,
    ...shadows.soft
  },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary
  },
  ghost: {
    backgroundColor: 'transparent'
  },
  danger: {
    backgroundColor: colors.danger,
    ...shadows.soft
  },
  disabled: {
    opacity: 0.6
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center'
  },
  textSm: {
    fontSize: 12,
    fontWeight: '600'
  },
  iconLeft: {
    marginRight: spacing.sm
  },
  iconRight: {
    marginLeft: spacing.sm
  }
})
