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
import { colors, typography, spacing, radius, shadows } from '../../utils/theme'
import AppButton from '../shared/AppButton'

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
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.16,
    shadowRadius: 28,
    elevation: 20,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF'
  },
  headerTitleWrap: {
    flex: 1,
    marginRight: 12
  },
  title: {
    fontFamily: typography.h3.fontFamily,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '800',
    color: '#0F172A'
  },
  subtitle: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12.5,
    lineHeight: 17,
    color: '#64748B',
    marginTop: 2
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center'
  },
  scrollWrap: {
    flexShrink: 1,
    width: '100%'
  },
  content: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    paddingBottom: 22
  },
  contentNonScroll: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    flexShrink: 1
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#F8FAFC',
    gap: 10
  },
  actionBtnCol: {
    flex: 1,
    minWidth: 0
  }
})
