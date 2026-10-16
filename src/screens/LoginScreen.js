import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Building2, User, Lock, Eye, EyeOff, Shield, Wallet, ShieldCheck, Home, ArrowLeft } from 'lucide-react-native'
import { useApp } from '../context/AppContext'
import AppCard from '../components/AppCard'
import AppButton from '../components/AppButton'
import { colors, typography, spacing, radius, shadows } from '../utils/theme'

export default function LoginScreen({ navigation }) {
  const insets = useSafeAreaInsets()
  const { login } = useApp()
  const [username, setUsername] = useState('bambang.sutrisno')
  const [password, setPassword] = useState('password')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [selectedRole, setSelectedRole] = useState('warga') // 'warga' | 'rt' | 'rw' | 'bendahara' | 'pengurus' | 'admin'

  const handleRoleSelect = (role) => {
    setSelectedRole(role)
    setErrorMsg('')
    if (role === 'warga') {
      setUsername('bambang.sutrisno')
      setPassword('password')
    } else if (role === 'rt') {
      setUsername('rt')
      setPassword('password')
    } else if (role === 'rw') {
      setUsername('rw')
      setPassword('password')
    } else if (role === 'bendahara') {
      setUsername('bendahara')
      setPassword('password')
    } else if (role === 'pengurus') {
      setUsername('pengurus')
      setPassword('password')
    } else if (role === 'admin') {
      setUsername('admin')
      setPassword('password')
    }
  }

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setErrorMsg('Username dan kata sandi wajib diisi!')
      return
    }

    setLoading(true)
    setErrorMsg('')

    try {
      const res = await login(username, password)
      if (res.success) {
        navigation.replace('Main')
      } else {
        setErrorMsg(res.message || 'Login gagal. Periksa kembali akun Anda.')
      }
    } catch (e) {
      setErrorMsg('Terjadi kesalahan jaringan atau server.')
    } finally {
      setLoading(false)
    }
  }

  const roleButtons = [
    { key: 'warga', label: 'Warga', icon: User },
    { key: 'rt', label: 'Ketua RT', icon: Home },
    { key: 'rw', label: 'Ketua RW', icon: Building2 },
    { key: 'bendahara', label: 'Bendahara', icon: Wallet },
    { key: 'pengurus', label: 'Pengurus', icon: ShieldCheck },
    { key: 'admin', label: 'Admin IT', icon: Shield }
  ]

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top + spacing.md, spacing.xl),
            paddingBottom: Math.max(insets.bottom + spacing.md, spacing.xl)
          }
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back Button if navigated from another page */}
        {navigation?.canGoBack && navigation.canGoBack() ? (
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
            accessibilityLabel="Kembali"
          >
            <ArrowLeft size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        ) : null}

        {/* Brand Header */}
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Building2 size={32} color={colors.surface} strokeWidth={2.4} />
          </View>
          <Text style={styles.appName}>IPL Warga Digital</Text>
          <Text style={styles.tagline}>Aplikasi Pengelolaan Iuran & Administrasi RT/RW</Text>
        </View>

        {/* Card Form */}
        <AppCard style={styles.card}>
          <Text style={styles.cardTitle}>Masuk ke Akun Anda</Text>

          {/* Quick Preset Selector */}
          <Text style={styles.quickPresetTitle}>Pilih Cepat Role & Akun Demo:</Text>
          <View style={styles.roleGrid}>
            {roleButtons.map((r) => {
              const IconComp = r.icon
              const isActive = selectedRole === r.key
              return (
                <TouchableOpacity
                  key={r.key}
                  style={[
                    styles.roleChip,
                    isActive && { backgroundColor: colors.primarySubtle, borderColor: colors.primary }
                  ]}
                  onPress={() => handleRoleSelect(r.key)}
                  activeOpacity={0.8}
                >
                  <IconComp size={13} color={isActive ? colors.primary : colors.textSecondary} />
                  <Text
                    style={[
                      styles.roleChipText,
                      isActive && { color: colors.primary, fontWeight: '700' }
                    ]}
                  >
                    {r.label}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>

          {errorMsg ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          {/* Form Fields */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Username / NIK Warga</Text>
            <View style={styles.inputWrap}>
              <User size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.textInput}
                placeholder="Masukkan username Anda"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="none"
                value={username}
                onChangeText={setUsername}
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Kata Sandi</Text>
            <View style={styles.inputWrap}>
              <Lock size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.textInput}
                placeholder="Masukkan kata sandi"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry={!showPass}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPass(!showPass)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                {showPass ? <EyeOff size={16} color={colors.textSecondary} /> : <Eye size={16} color={colors.textSecondary} />}
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ marginTop: spacing.md }}>
            <AppButton
              title="Masuk Sekarang"
              variant="primary"
              loading={loading}
              onPress={handleLogin}
            />
          </View>

          <View style={styles.registerPrompt}>
            <Text style={styles.registerPromptText}>Warga baru di lingkungan ini? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}>Daftar di sini</Text>
            </TouchableOpacity>
          </View>
        </AppCard>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.md,
    justifyContent: 'center'
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: radius.xl,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    ...shadows.card
  },
  appName: {
    ...typography.h1,
    color: colors.textPrimary,
    letterSpacing: -0.5
  },
  tagline: {
    ...typography.caption,
    textAlign: 'center',
    marginTop: 4
  },
  card: {
    padding: spacing.lg
  },
  cardTitle: {
    ...typography.h3,
    marginBottom: spacing.md
  },
  quickPresetTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8
  },
  roleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: spacing.md
  },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#F8FAFC'
  },
  roleChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: spacing.sm
  },
  errorText: {
    fontSize: 12,
    color: colors.danger,
    fontWeight: '600'
  },
  fieldGroup: {
    marginBottom: spacing.sm
  },
  fieldLabel: {
    ...typography.label,
    marginBottom: 4
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    height: 46
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary
  },
  registerPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg
  },
  registerPromptText: {
    ...typography.caption
  },
  registerLink: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primary
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  }
})
