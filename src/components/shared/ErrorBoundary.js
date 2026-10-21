import React from 'react'
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native'
import { AlertTriangle, RefreshCw } from 'lucide-react-native'
import { colors, typography, spacing, radius } from '../../theme'
import AppButton from '../shared/AppButton'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('IPL Mobile Uncaught Error:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error?.message || 'Terjadi kesalahan tidak terduga pada tampilan.'
      return (
        <SafeAreaView style={styles.safeArea}>
          <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.iconCircle}>
              <AlertTriangle size={36} color={colors.danger} />
            </View>

            <Text style={styles.title}>Terjadi Kendala Tampilan</Text>
            <Text style={styles.subtitle}>
              Aplikasi mengalami kendala teknis saat memuat komponen ini. Silakan coba muat ulang.
            </Text>

            <View style={styles.errorBox}>
              <Text style={styles.errorText} numberOfLines={4}>
                {errorMessage}
              </Text>
            </View>

            <View style={styles.buttonWrapper}>
              <AppButton
                title="Muat Ulang Halaman"
                variant="primary"
                icon={<RefreshCw size={16} color={colors.primary} />}
                onPress={this.handleReset}
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      )
    }

    return this.props.children
  }
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.s6,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.s4,
  },
  title: {
    fontFamily: typography.h2.fontFamily,
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.s2,
  },
  subtitle: {
    fontFamily: typography.body.fontFamily,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 320,
    marginBottom: spacing.s4,
  },
  errorBox: {
    width: '100%',
    maxWidth: 360,
    padding: spacing.s3,
    backgroundColor: '#F8FAFC',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.s6,
  },
  errorText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 16,
  },
  buttonWrapper: {
    width: '100%',
    maxWidth: 240,
  },
})
