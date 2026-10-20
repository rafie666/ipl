import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native'
import {
  ArrowLeft,
  Server,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Database,
  Save,
  RefreshCw,
  ExternalLink
} from 'lucide-react-native'
import { colors, spacing, radius, shadows, typography } from '../utils/theme'
import { isSupabaseConfigured, DEFAULT_SUPABASE_URL } from '../api/supabase'
import {
  getMootaConfig,
  saveMootaConfig,
  testMootaConnection,
  DEFAULT_MOOTA_CONFIG
} from '../services/mootaService'

export default function MootaGatewayScreen({ navigation }) {
  const [mootaToken, setMootaToken] = useState(DEFAULT_MOOTA_CONFIG.API_TOKEN)
  const [mootaBankId, setMootaBankId] = useState(DEFAULT_MOOTA_CONFIG.BANK_ID)
  const [loadingConfig, setLoadingConfig] = useState(true)
  const [savingConfig, setSavingConfig] = useState(false)
  const [mootaTesting, setMootaTesting] = useState(false)
  const [mootaStatusMsg, setMootaStatusMsg] = useState(null)

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      const cfg = await getMootaConfig()
      if (cfg) {
        if (cfg.API_TOKEN) setMootaToken(cfg.API_TOKEN)
        if (cfg.BANK_ID) setMootaBankId(cfg.BANK_ID)
      }
    } catch (e) {
      console.warn('Gagal memuat config Moota:', e)
    } finally {
      setLoadingConfig(false)
    }
  }

  const handleSaveConfig = async () => {
    if (!mootaToken.trim()) {
      Alert.alert('Perhatian', 'API Token Moota tidak boleh kosong!')
      return
    }
    setSavingConfig(true)
    try {
      const current = await getMootaConfig()
      const updated = {
        ...current,
        API_TOKEN: mootaToken.trim(),
        BANK_ID: mootaBankId.trim()
      }
      await saveMootaConfig(updated)
      Alert.alert('Sukses', 'Konfigurasi Moota Gateway berhasil disimpan!')
    } catch (e) {
      Alert.alert('Error', 'Gagal menyimpan konfigurasi Moota: ' + e.message)
    } finally {
      setSavingConfig(false)
    }
  }

  const handleTestMoota = async () => {
    setMootaTesting(true)
    setMootaStatusMsg(null)
    try {
      const res = await testMootaConnection()
      if (res.success) {
        const bankName = res.bank?.bank_type || 'Bank'
        const accNo = res.bank?.account_number || '-'
        const holder = res.bank?.name || 'Pengelola'
        const bal = res.bank?.balance?.toLocaleString('id-ID') || '0'
        setMootaStatusMsg({
          success: true,
          text: `✅ Terhubung ke Moota Sandbox!\nAkun: ${bankName} (${accNo} a.n ${holder})\nSaldo: Rp ${bal}`
        })
        Alert.alert('Koneksi Moota Berhasil!', `Bank: ${bankName}\nRekening: ${accNo}\nPemilik: ${holder}\nSaldo: Rp ${bal}`)
      } else {
        setMootaStatusMsg({ success: false, text: '❌ ' + res.message })
        Alert.alert('Koneksi Moota Gagal', res.message)
      }
    } catch (e) {
      setMootaStatusMsg({ success: false, text: '❌ ' + e.message })
    } finally {
      setMootaTesting(false)
    }
  }

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={22} color={colors.textDark} />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>Moota & Supabase Gateway</Text>
          <Text style={styles.headerSubtitle}>Integrasi mutasi bank otomatis & cloud</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Cloud Database */}
        <View style={styles.sectionCard}>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.cardHeaderIcon, { backgroundColor: isSupabaseConfigured ? '#DCFCE7' : '#FEF3C7' }]}>
              <Database size={18} color={isSupabaseConfigured ? '#166534' : '#92400E'} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardHeaderTitle}>Database Supabase Cloud</Text>
              <Text style={styles.cardHeaderDesc}>Sinkronisasi online realtime & data cloud</Text>
            </View>
          </View>

          <View style={[styles.statusBox, { backgroundColor: isSupabaseConfigured ? '#F0FDF4' : '#FFFBEB', borderColor: isSupabaseConfigured ? '#BBF7D0' : '#FDE68A' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {isSupabaseConfigured ? (
                <CheckCircle2 size={16} color="#166534" />
              ) : (
                <AlertCircle size={16} color="#B45309" />
              )}
              <Text style={[styles.statusBoxTitle, { color: isSupabaseConfigured ? '#166534' : '#92400E' }]}>
                {isSupabaseConfigured ? 'Terhubung ke Database Cloud (Online)' : 'Mode Offline / Penyimpanan Lokal'}
              </Text>
            </View>
            <Text style={styles.statusBoxText}>
              {isSupabaseConfigured
                ? `Endpoint URL: ${DEFAULT_SUPABASE_URL || 'Default Endpoint'}`
                : 'Aplikasi berjalan menggunakan database SQLite/AsyncStorage lokal. Transaksi tetap tersimpan aman di perangkat.'}
            </Text>
          </View>
        </View>

        {/* Konfigurasi Moota Gateway */}
        <View style={styles.sectionCard}>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.cardHeaderIcon, { backgroundColor: '#EFF6FF' }]}>
              <Server size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardHeaderTitle}>Moota Sandbox / Live Gateway</Text>
              <Text style={styles.cardHeaderDesc}>API Token mutasi rekening bank otomatis</Text>
            </View>
          </View>

          {loadingConfig ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 20 }} />
          ) : (
            <View style={styles.formGroup}>
              <Text style={styles.inputLabelBold}>Moota Sandbox API Token:</Text>
              <TextInput
                style={styles.input}
                value={mootaToken}
                onChangeText={setMootaToken}
                secureTextEntry={true}
                placeholder="API Token Moota"
                placeholderTextColor={colors.gray400}
              />

              <Text style={styles.inputLabelBold}>Moota Bank ID:</Text>
              <TextInput
                style={styles.input}
                value={mootaBankId}
                onChangeText={setMootaBankId}
                placeholder="Bank ID (misal: Lagzqp0Pk42)"
                placeholderTextColor={colors.gray400}
              />

              {mootaStatusMsg ? (
                <View
                  style={[
                    styles.statusBox,
                    {
                      backgroundColor: mootaStatusMsg.success ? '#F0FDF4' : '#FEF2F2',
                      borderColor: mootaStatusMsg.success ? '#BBF7D0' : '#FECACA',
                      marginTop: 4
                    }
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      lineHeight: 18,
                      color: mootaStatusMsg.success ? '#166534' : '#991B1B',
                      fontWeight: '500'
                    }}
                  >
                    {mootaStatusMsg.text}
                  </Text>
                </View>
              ) : null}

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.testButton, mootaTesting && { opacity: 0.7 }]}
                  onPress={handleTestMoota}
                  disabled={mootaTesting}
                >
                  {mootaTesting ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <ShieldCheck size={16} color={colors.primary} />
                  )}
                  <Text style={styles.testButtonText}>
                    {mootaTesting ? 'Menguji...' : 'Uji Koneksi Sandbox'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.saveButton, savingConfig && { opacity: 0.7 }]}
                  onPress={handleSaveConfig}
                  disabled={savingConfig}
                >
                  {savingConfig ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Save size={16} color="#fff" />
                  )}
                  <Text style={styles.saveButtonText}>
                    {savingConfig ? 'Menyimpan...' : 'Simpan Config'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Info Webhook & Verifikasi Otomatis */}
        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>ℹ️ Catatan Verifikasi Otomatis</Text>
          <Text style={styles.infoCardDesc}>
            Moota bertugas membaca mutasi rekening masuk setiap ada transfer dari warga. Sistem mencocokkan kode unik transfer dengan tagihan iuran yang aktif, lalu menandai status LUNAS secara otomatis tanpa admin perlu verifikasi manual.
          </Text>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: 48,
    paddingBottom: spacing.md,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
    ...shadows.sm
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray50,
    marginRight: spacing.sm
  },
  headerTextWrap: {
    flex: 1
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: typography.bold,
    color: colors.textDark
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.gray500,
    marginTop: 2
  },
  content: {
    padding: spacing.md,
    paddingBottom: 40,
    gap: 16
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray100,
    ...shadows.sm
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: spacing.md
  },
  cardHeaderIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center'
  },
  cardHeaderTitle: {
    fontSize: 15,
    fontWeight: typography.bold,
    color: colors.textDark
  },
  cardHeaderDesc: {
    fontSize: 12,
    color: colors.gray500,
    marginTop: 1
  },
  statusBox: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.sm,
    gap: 6
  },
  statusBoxTitle: {
    fontSize: 13,
    fontWeight: typography.bold
  },
  statusBoxText: {
    fontSize: 12,
    color: colors.gray600,
    lineHeight: 18
  },
  formGroup: {
    gap: 10
  },
  inputLabelBold: {
    fontSize: 13,
    fontWeight: typography.bold,
    color: colors.textDark,
    marginTop: 4
  },
  input: {
    backgroundColor: colors.gray50,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: colors.textDark
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10
  },
  testButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: '#EFF6FF'
  },
  testButtonText: {
    fontSize: 13,
    fontWeight: typography.semibold,
    color: colors.primary
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: radius.md,
    backgroundColor: colors.primary
  },
  saveButtonText: {
    fontSize: 13,
    fontWeight: typography.semibold,
    color: '#ffffff'
  },
  infoCard: {
    backgroundColor: '#F1F5F9',
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6
  },
  infoCardTitle: {
    fontSize: 13,
    fontWeight: typography.bold,
    color: colors.textDark
  },
  infoCardDesc: {
    fontSize: 12,
    color: colors.gray600,
    lineHeight: 18
  }
})
