import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
  Platform,
} from 'react-native';
import { AlertCircle } from 'lucide-react-native';
import { colors, radius, spacing, typography } from '../../theme';
import Skeleton from './Skeleton';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  helperText?: string;
  error?: string | boolean;
  errorMessage?: string;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  multiline?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  helperText,
  error,
  errorMessage,
  loading = false,
  leftIcon,
  rightIcon,
  containerStyle,
  inputStyle,
  multiline = false,
  editable = true,
  placeholderTextColor = colors.textPlaceholder,
  onFocus,
  onBlur,
  ...restProps
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const hasError = Boolean(error || errorMessage);
  const activeErrorMessage = errorMessage || (typeof error === 'string' ? error : undefined);

  if (loading) {
    return (
      <View style={[styles.wrapper, containerStyle]}>
        {label && <View style={styles.skeletonLabel}><Skeleton width={80} height={14} borderRadius={4} /></View>}
        <Skeleton width="100%" height={multiline ? 120 : 52} borderRadius={radius.md} />
      </View>
    );
  }

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const isDisabled = editable === false;

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label ? (
        <Text
          style={styles.label}
          maxFontSizeMultiplier={1.3}
          accessibilityRole="none"
        >
          {label}
        </Text>
      ) : null}

      <View
        style={[
          styles.inputContainer,
          multiline && styles.inputContainerMultiline,
          // State backgrounds & borders
          !hasError && !isFocused && !isDisabled && styles.containerDefault,
          !hasError && isFocused && styles.containerFocused,
          hasError && styles.containerError,
          isDisabled && styles.containerDisabled,
        ]}
      >
        {leftIcon && <View style={styles.leftIconWrapper}>{leftIcon}</View>}

        <TextInput
          {...restProps}
          editable={editable}
          multiline={multiline}
          placeholderTextColor={placeholderTextColor}
          onFocus={handleFocus}
          onBlur={handleBlur}
          maxFontSizeMultiplier={1.3}
          style={[
            styles.textInput,
            multiline && styles.textInputMultiline,
            isDisabled && styles.textDisabled,
            inputStyle,
          ]}
        />

        {rightIcon && <View style={styles.rightIconWrapper}>{rightIcon}</View>}
      </View>

      {hasError && activeErrorMessage ? (
        <View style={styles.errorRow}>
          <AlertCircle size={14} color="#B91C1C" strokeWidth={2} style={styles.errorIcon} />
          <Text style={styles.errorText} maxFontSizeMultiplier={1.3}>
            {activeErrorMessage}
          </Text>
        </View>
      ) : helperText ? (
        <Text style={styles.helperText} maxFontSizeMultiplier={1.3}>
          {helperText}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    marginBottom: spacing.s3,
  },
  skeletonLabel: {
    marginBottom: 8,
  },
  label: {
    fontFamily: typography.labelSm.fontFamily,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.1,
    color: colors.textSecondary, // #475569
    fontWeight: '600',
    marginBottom: 8,
  },
  inputContainer: {
    minHeight: 52,
    borderRadius: radius.md, // 16
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  inputContainerMultiline: {
    minHeight: 120,
    alignItems: 'flex-start',
  },
  containerDefault: {
    backgroundColor: colors.surfaceMuted, // #F1F5F9
    borderColor: 'transparent',
  },
  containerFocused: {
    backgroundColor: colors.surface, // #FFFFFF
    borderColor: colors.borderFocus, // #DC2626
  },
  containerError: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
  },
  containerDisabled: {
    backgroundColor: colors.surfaceMuted, // #F1F5F9
    borderColor: 'transparent',
  },
  textInput: {
    flex: 1,
    fontFamily: typography.bodyLg.fontFamily,
    fontSize: 15,
    lineHeight: 21,
    color: colors.textPrimary, // #0F172A
    padding: 0,
    margin: 0,
    ...Platform.select({
      web: { outlineStyle: 'none' } as any,
    }),
  },
  textInputMultiline: {
    textAlignVertical: 'top',
    minHeight: 90,
  },
  textDisabled: {
    color: colors.textDisabled, // #94A3B8
  },
  leftIconWrapper: {
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightIconWrapper: {
    marginLeft: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helperText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.1,
    color: colors.textMuted, // #64748B
    marginTop: 6,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  errorIcon: {
    marginRight: 4,
  },
  errorText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    lineHeight: 16,
    color: '#B91C1C',
    fontWeight: '500',
  },
});

export default Input;
