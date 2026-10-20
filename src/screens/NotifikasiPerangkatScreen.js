import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform
} from 'react-native'
import * as Clipboard from 'expo-clipboard'
import {
  Bell,
  CheckCircle,
  AlertCircle,
  Copy,
  RefreshCw,
  Send,
  Smartphone,
  ShieldCheck,
  Info
} from 'lucide-react-native'
import { useApp } from '../context/AppContext'
import AppHeader from '../components/AppHeader'
import AppButton from '../components/AppButton'
import { colors, spacing, radius, typography } from '../utils/theme'

export default function NotifikasiPerangkatScreen({ navigation }) {
  const {
    expoPushToken,
    notificationPermissionStatus,
    testSendPushNotification,
    refreshPushToken
  } = useApp()

  const [sendingTest, setSendingTest] = useState(false)
  const [refreshingToken, setRefreshingToken] = useState(false)

  const isGranted = notificationPermissionStatus === 'granted' || Boolean(expoPushToken)

  const handleCopyToken = async () => {
    if (!expoPushToken) {
      Alert.alert('Perhatian', 'Push token belum tersedia di perangkat ini.')
      return
    }
    await Clipboard.setStringAsync(expoPushToken)
    Alert.alert('Tersalin! 📋', 'Expo Push Token berhasil disalin ke clipboard.')
  }

  const handleRefresh = async () => {
    setRefreshingToken(true)
    try {
      if (typeof refreshPushToken === 'function') {
        const token = await refreshPushToken()
        if (token) {
          Alert.alert('Sukses', 'Push token perangkat berhasil diperbarui.')
        } else {
          Alert.alert('Info', 'Izin notifikasi belum aktif atau aplikasi berjalan di simulator/web.')
        }
      } else {
        Alert.alert('Info', 'Token sudah dalam status terbaru.')
      }
    } catch (e) {
      Alert.alert('Error', e.message || 'Gagal menyegarkan token notifikasi.')
    } finally {
      setRefreshingToken(false)
    }
  }

  const handleTestNotification = async () => {
    setSendingTest(true)
    try {
      if (typeof testSendPushNotification === 'function') {
        const res = await testSendPushNotification()
        if (res?.success) {
          Alert.alert('Berhasil Terkirim! 🔔', 'Notifikasi uji coba berhasil dikirim ke perangkat Anda.')
        } else {
          Alert.alert('Peringatan', res?.message || 'Gagal mengirim notifikasi uji coba.')
        }
      } else {
        Alert.alert('Berhasil 🔔', 'Notifikasi uji coba berhasil disimulasikan!')
      }
    } catch (e) {
      Alert.alert('Error', e.message || 'Terjadi kesalahan saat menguji notifikasi.')
    } finally {
      setSendingTest(false)
    }
  }

  return (
    <View style={styles.container}>
      <AppHeader
        title="Notifikasi & Perangkat"
        subtitle="Status izin push notifikasi & perangkat HP"
        navigation={navigation}
        variant="surface"
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Status Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconWrap, { backgroundColor: isGranted ? '#ECFDF5' : '#FFFBEB' }]}>
              {isGranted ? (
                <CheckCircle size={22} color="#059669" />
              ) : (
                <AlertCircle size={22} color="#D97706" />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>
                {isGranted ? 'Notifikasi Perangkat Aktif' : 'Izin Notifikasi Belum Aktif'}
              </Text>
              <Text style={styles.cardSubtitle}>
                {isGranted
                  ? 'Perangkat Anda siap menerima pengingat tagihan & pengumuman warga.'
                  : 'Aktifkan izin notifikasi pada pengaturan HP Anda agar tidak tertinggal info.'}
              </Text>
            </View>
          </View>
        </View>

        {/* Token Box */}
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <Text style={styles.sectionTitle}>Expo Push Token Perangkat</Text>
            {expoPushToken ? (
              <TouchableOpacity
                style={styles.copyBtn}
                onPress={handleCopyToken}
                activeOpacity={0.7}
              >
                <Copy size={13} color={colors.primary} />
                <Text style={styles.copyBtnText}>Salin</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <Text style={styles.sectionSubtitle}>
            Pengenal unik perangkat ini untuk menerima pengingat penagihan otomatis dari server:
          </Text>

          <View style={styles.tokenBox}>
            <Text style={styles.tokenText} numberOfLines={3} selectable>
              {expoPushToken || 'Push token belum terdaftar (buka aplikasi di perangkat fisik asli).'}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={{ gap: 10 }}>
          <AppButton
            title={sendingTest ? 'Mengirim Uji Coba...' : 'Kirim Uji Coba Push Notifikasi'}
            variant="primary"
            icon={<Send size={16} color="#FFFFFF" />}
            onPress={handleTestNotification}
            loading={sendingTest}
          />

          <AppButton
            title={refreshingToken ? 'Menyegarkan...' : 'Perbarui Status & Token Notifikasi'}
            variant="outline"
            icon={<RefreshCw size={16} color={colors.primary} />}
            onPress={handleRefresh}
            loading={refreshingToken}
          />
        </View>

        {/* Informasi Notifikasi */}
        <View style={styles.infoCard}>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 6 }}>
            <Info size={16} color="#0284C7" />
            <Text style={styles.infoTitle}>Jenis Notifikasi yang Anda Terima</Text>
          </View>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• Pengingat otomatis terbit tagihan bulanan dan jatuh tempo IPL.</Text>
            <Text style={styles.bulletItem}>• Pembaruan status pengajuan surat pengantar RT & RW.</Text>
            <Text style={styles.bulletItem}>• Tanggapan dan tindak lanjut laporan pengaduan lingkungan.</Text>
            <Text style={styles.bulletItem}>• Pengumuman darurat, keamanan komplek, dan jadwal ronda.</Text>
          </View>
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
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 120,
    gap: 12
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      web: { boxShadow: '0px 1px 3px rgba(15, 23, 42, 0.05)' },
      default: { elevation: 1 }
    })
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  cardTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0F172A'
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 17
  },
  sectionTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A'
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 8,
    lineHeight: 16
  },
  tokenBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  tokenText: {
    fontSize: 11.5,
    color: '#475569',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 18
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#EFF6FF'
  },
  copyBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary
  },
  infoCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BAE6FD'
  },
  infoTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0369A1'
  },
  bulletList: {
    gap: 4
  },
  bulletItem: {
    fontSize: 11.5,
    color: '#0C4A6E',
    lineHeight: 17
  }
})
