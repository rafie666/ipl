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
import { Building2, User, Lock, Eye, EyeOff, Shield } from 'lucide-react-native'
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
  const [selectedRole, setSelectedRole] = useState('warga') // 'warga' | 'rt' | 'admin'

  const handleRoleSelect = (role) => {
    setSelectedRole(role)
    setErrorMsg('')
    if (role === 'warga') {
      setUsername('bambang.sutrisno')
      setPassword('password')
    } else if (role === 'rt') {
      setUsername('rt')
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

          {/* Role Switcher */}
          <View style={styles.roleContainer}>
            <TouchableOpacity
              style={[styles.roleBtn, selectedRole === 'warga' && styles.roleBtnActive]}
              onPress={() => handleRoleSelect('warga')}
              activeOpacity={0.8}
            >
              <User size={13} color={selectedRole === 'warga' ? colors.primary : colors.textSecondary} />
              <Text style={[styles.roleBtnText, selectedRole === 'warga' && styles.roleBtnTextActive]}>
                Warga
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.roleBtn, selectedRole === 'rt' && styles.roleBtnActive]}
              onPress={() => handleRoleSelect('rt')}
              activeOpacity={0.8}
            >
              <Building2 size={13} color={selectedRole === 'rt' ? colors.primary : colors.textSecondary} />
              <Text style={[styles.roleBtnText, selectedRole === 'rt' && styles.roleBtnTextActive]}>
                Ketua RT
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.roleBtn, selectedRole === 'admin' && styles.roleBtnActive]}
              onPress={() => handleRoleSelect('admin')}
              activeOpacity={0.8}
            >
              <Shield size={13} color={selectedRole === 'admin' ? colors.primary : colors.textSecondary} />
              <Text style={[styles.roleBtnText, selectedRole === 'admin' && styles.roleBtnTextActive]}>
                Admin RW
              </Text>
            </TouchableOpacity>
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
  roleContainer: {
    flexDirection: 'row',
    backgroundColor: '#EAECF0',
    borderRadius: radius.md,
    padding: 3,
    marginBottom: spacing.md
  },
  roleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: radius.sm
  },
  roleBtnActive: {
    backgroundColor: colors.surface,
    ...shadows.soft
  },
  roleBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary
  },
  roleBtnTextActive: {
    color: colors.primary,
    fontWeight: '700'
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
  }
})
