import React from 'react'
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native'
import { X } from 'lucide-react-native'
import { colors, typography, spacing, radius, shadows } from '../utils/theme'
import AppButton from './AppButton'

export default function AppModal({
  visible,
  onClose,
  title,
  subtitle,
  children,
  footer,
  primaryActionLabel,
  onPrimaryAction,
  primaryActionLoading = false,
  secondaryActionLabel,
  onSecondaryAction,
  maxHeightPercent = '88%',
  scrollable = true,
  contentStyle,
  dialogStyle,
  showsVerticalScrollIndicator = false
}) {
  const handleSecondary = onSecondaryAction || onClose

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Backdrop clickable to close */}
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardWrap}
          pointerEvents="box-none"
        >
          <View style={[styles.dialog, { maxHeight: maxHeightPercent }, dialogStyle]}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerTitleWrap}>
                <Text style={styles.title} numberOfLines={1}>
                  {title}
                </Text>
                {subtitle ? (
                  <Text style={styles.subtitle} numberOfLines={1}>
                    {subtitle}
                  </Text>
                ) : null}
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={onClose}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel="Tutup"
              >
                <X size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Content Body */}
            {scrollable ? (
              <ScrollView
                style={[styles.scrollWrap, contentStyle]}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={showsVerticalScrollIndicator}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled={true}
                bounces={true}
                alwaysBounceVertical={false}
              >
                {children}
              </ScrollView>
            ) : (
              <View style={[styles.contentNonScroll, contentStyle]}>
                {children}
              </View>
            )}

            {/* Actions Footer */}
            {footer ? (
              <View style={styles.footer}>
                {footer}
              </View>
            ) : (secondaryActionLabel !== null || (primaryActionLabel && onPrimaryAction)) ? (
              <View style={styles.footer}>
                {secondaryActionLabel !== false && (
                  <View style={styles.actionBtnCol}>
                    <AppButton
                      title={secondaryActionLabel || 'Batal'}
                      onPress={handleSecondary}
                      variant="secondary"
                      size="md"
                    />
                  </View>
                )}
                {primaryActionLabel && onPrimaryAction ? (
                  <View style={styles.actionBtnCol}>
                    <AppButton
                      title={primaryActionLabel}
                      onPress={onPrimaryAction}
                      variant="primary"
                      size="md"
                      loading={primaryActionLoading}
                    />
                  </View>
                ) : null}
              </View>
            ) : null}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.scrim || 'rgba(15, 23, 42, 0.48)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md
  },
  keyboardWrap: {
    width: '100%',
    maxWidth: 440,
    alignItems: 'center',
    justifyContent: 'center'
  },
  dialog: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.floating,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface
  },
  headerTitleWrap: {
    flex: 1,
    marginRight: spacing.sm
  },
  title: {
    fontFamily: typography.h3.fontFamily,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    color: colors.textPrimary
  },
  subtitle: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
    marginTop: 2
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center'
  },
  scrollWrap: {
    flexShrink: 1,
    width: '100%'
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl
  },
  contentNonScroll: {
    padding: spacing.lg,
    flexShrink: 1
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
    gap: spacing.sm
  },
  actionBtnCol: {
    flex: 1,
    minWidth: 0
  }
})
