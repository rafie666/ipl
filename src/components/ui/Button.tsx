import React, { useRef } from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  StyleSheet,
  View,
  StyleProp,
  ViewStyle,
  TextStyle,
  AccessibilityRole,
  Animated,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, typography, shadows, layout } from '../../theme';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'mini' | 'danger';

export interface ButtonProps {
  title?: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode | React.ComponentType<any>;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size,
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = true,
  style,
  textStyle,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const isMini = variant === 'mini' || size === 'sm';
  const isPrimary = variant === 'primary';
  const isSecondary = variant === 'secondary';
  const isGhost = variant === 'ghost';
  const isDanger = variant === 'danger';

  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled || loading) return;
    Animated.timing(scaleAnim, {
      toValue: 0.98,
      duration: 90,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    if (disabled || loading) return;
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    if (disabled || loading) return;
    if (isPrimary || isMini || isDanger) {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      } catch {
        // ignore on unsupported platforms
      }
    }
    onPress?.();
  };

  const spinnerColor = isPrimary || isDanger ? colors.white : colors.primary;

  const hitSlop = isMini ? { top: 6, bottom: 6, left: 6, right: 6 } : undefined;

  const renderIconContent = () => {
    if (!icon) return null;
    if (React.isValidElement(icon)) {
      return icon;
    }
    if (
      typeof icon === 'function' ||
      (typeof icon === 'object' && icon !== null && ('render' in icon || '$$typeof' in icon))
    ) {
      const IconComponent = icon as React.ComponentType<any>;
      const defaultColor = isPrimary || isDanger ? colors.white : isSecondary ? colors.primary : colors.textPrimary;
      return <IconComponent size={isMini ? 14 : 16} color={defaultColor} />;
    }
    return null;
  };

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      hitSlop={hitSlop}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{
        disabled: disabled,
        busy: loading,
      }}
      style={({ pressed }) => [
        styles.base,
        isMini && styles.mini,
        !isMini && styles.standard,
        fullWidth && !isMini && styles.fullWidth,
        // Variant base
        isPrimary && styles.primaryBase,
        isSecondary && styles.secondaryBase,
        isGhost && styles.ghostBase,
        isDanger && styles.dangerBase,
        // Pressed styles
        pressed && !disabled && !loading && isPrimary && styles.primaryPressed,
        pressed && !disabled && !loading && isSecondary && styles.secondaryPressed,
        pressed && !disabled && !loading && isGhost && styles.ghostPressed,
        pressed && !disabled && !loading && isDanger && styles.dangerPressed,
        // Disabled styles
        disabled && isPrimary && styles.primaryDisabled,
        disabled && isSecondary && styles.secondaryDisabled,
        disabled && isGhost && styles.ghostDisabled,
        disabled && isDanger && styles.dangerDisabled,
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.contentWrapper,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        {loading ? (
          <ActivityIndicator size={isMini ? 16 : 20} color={spinnerColor} />
        ) : (
          <View style={styles.innerRow}>
            {Boolean(icon) && iconPosition === 'left' && (
              <View style={[styles.iconWrap, { marginRight: isMini ? 6 : 8 }]}>
                {renderIconContent()}
              </View>
            )}
            {title ? (
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
                style={[
                  isMini ? styles.textMini : styles.textStandard,
                  isPrimary && styles.textPrimary,
                  isSecondary && styles.textSecondary,
                  isGhost && styles.textGhost,
                  isDanger && styles.textDanger,
                  disabled && styles.textDisabled,
                  textStyle,
                ]}
              >
                {title}
              </Text>
            ) : null}
            {Boolean(icon) && iconPosition === 'right' && (
              <View style={[styles.iconWrap, { marginLeft: isMini ? 6 : 8 }]}>
                {renderIconContent()}
              </View>
            )}
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  standard: {
    height: 52,
    minHeight: layout.minTouch,
    paddingHorizontal: 24,
  },
  mini: {
    height: 36,
    minWidth: 112,
    paddingHorizontal: 14,
  },
  fullWidth: {
    width: '100%',
  },
  contentWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  innerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Primary (Top Bar Green: colors.primary #064E3B)
  primaryBase: {
    backgroundColor: colors.primary,
    ...Platform.select({
      web: { boxShadow: '0 4px 14px rgba(6, 78, 59, 0.28)' } as any,
      default: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.28,
        shadowRadius: 10,
        elevation: 4,
      },
    }),
  },
  primaryPressed: {
    backgroundColor: colors.primaryDark,
    ...Platform.select({
      web: { boxShadow: '0 2px 6px rgba(6, 78, 59, 0.20)' } as any,
      default: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.20,
        shadowRadius: 6,
        elevation: 2,
      },
    }),
  },
  primaryDisabled: {
    backgroundColor: colors.skeletonBase, // #E2E8F0
    shadowOpacity: 0,
    elevation: 0,
  },
  // Secondary (Outline)
  secondaryBase: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  secondaryPressed: {
    backgroundColor: colors.primaryGhost,
  },
  secondaryDisabled: {
    borderColor: colors.borderStrong,
    backgroundColor: 'transparent',
  },
  // Ghost
  ghostBase: {
    backgroundColor: 'transparent',
    minHeight: 48,
  },
  ghostPressed: {
    backgroundColor: colors.primaryGhost,
  },
  ghostDisabled: {
    backgroundColor: 'transparent',
  },
  // Danger
  dangerBase: {
    backgroundColor: '#EF4444',
    ...Platform.select({
      web: { boxShadow: '0 4px 14px rgba(239, 68, 68, 0.28)' } as any,
      default: {
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.28,
        shadowRadius: 10,
        elevation: 4,
      },
    }),
  },
  dangerPressed: {
    backgroundColor: '#DC2626',
    ...Platform.select({
      web: { boxShadow: '0 2px 6px rgba(220, 38, 38, 0.20)' } as any,
      default: {
        shadowColor: '#DC2626',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.20,
        shadowRadius: 6,
        elevation: 2,
      },
    }),
  },
  dangerDisabled: {
    backgroundColor: colors.skeletonBase,
    shadowOpacity: 0,
    elevation: 0,
  },
  // Typography
  textStandard: {
    fontFamily: typography.label.fontFamily,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 0.3,
    fontWeight: '800',
    textAlign: 'center',
  },
  textMini: {
    fontFamily: typography.label.fontFamily,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  textPrimary: {
    color: colors.white, // White text on top bar green
  },
  textSecondary: {
    color: colors.primary,
  },
  textGhost: {
    color: colors.primary,
  },
  textDanger: {
    color: colors.white,
  },
  textDisabled: {
    color: colors.textDisabled, // #94A3B8
  },
});

export default Button;
