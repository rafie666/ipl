import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert
} from 'react-native'
import {
  User,
  Settings,
  Shield,
  LogOut,
  Building2,
  ChevronRight,
  Phone,
  Home,
  MapPin,
  CheckCircle2,
  Users,
  Edit3,
  Repeat
} from 'lucide-react-native'
import { useApp } from '../context/AppContext'
import TopAppBar from '../components/TopAppBar'
import AppCard from '../components/AppCard'
import AppButton from '../components/AppButton'
import { colors, typography, spacing, radius, shadows } from '../utils/theme'

export default function ProfileScreen({ navigation }) {
  const {
    currentUser,
    currentRT,
    currentWarga,
    logout,
    isWarga,
    isRT,
    isAdminLoggedIn,
    hasDualRole,
    activeMode,
    toggleActiveMode,
    jabatanLabel,
    jabatanShortLabel,
    jabatanTheme,
    userJabatan
  } = useApp()

  const handleLogout = () => {
    Alert.alert('Konfirmasi Keluar', 'Apakah Anda yakin ingin keluar dari akun ini?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Keluar',
        style: 'destructive',
        onPress: async () => {
          await logout()
          navigation.replace('Login')
        }
      }
    ])
  }

  const roleName = jabatanLabel || (currentUser?.role === 'admin' ? 'Super Administrator (IT)' : 'Warga')
  const phone = currentWarga?.noHp || (userJabatan === 'rt' ? '081234567890' : '081122334455')
  const blokText = currentWarga?.blok ? `Blok ${currentWarga.blok} No. ${currentWarga.noRumah}` : 'Sekretariat Pengurus'
  const rtRwText = currentRT?.name ? `${currentRT.name} / RW 15` : 'RT 01 / RW 15'

  return (
    <View style={styles.container}>
      <TopAppBar title="Profil Pengguna" navigation={navigation} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* User Profile Card */}
        <AppCard style={styles.userCard}>
          <View style={styles.avatarWrap}>
            <Text style={styles.avatarText}>
              {(currentUser?.name || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>

          <Text style={styles.userName} numberOfLines={1}>{currentUser?.name || 'Pengguna'}</Text>
          
          <View style={[styles.jabatanPill, { backgroundColor: jabatanTheme.bg, borderColor: jabatanTheme.border }]}>
            <Shield size={12} color={jabatanTheme.text} />
            <Text style={[styles.jabatanPillText, { color: jabatanTheme.text }]}>{roleName}</Text>
          </View>

          <View style={styles.usernamePill}>
            <Text style={styles.usernameText}>@{currentUser?.username}</Text>
          </View>
        </AppCard>

        {/* Switch Mode Card for Users with Jabatan (RT & RW adalah akun struktural murni, tidak bisa ganti role) */}
        {hasDualRole && !isRT && !isRW && (
          <AppCard style={styles.switchModeCard}>
            <TouchableOpacity
              style={styles.switchModeRow}
              onPress={toggleActiveMode}
              activeOpacity={0.82}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`Ganti tampilan mode, saat ini mode ${activeMode === 'jabatan' ? jabatanShortLabel : 'Warga'}`}
            >
              <View style={[styles.switchModeIconWrap, { backgroundColor: '#ECFDF5' }]}>
                <Repeat size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.switchModeTitle}>Ganti Tampilan Mode</Text>
                  <View style={[styles.activeModePill, { backgroundColor: activeMode === 'jabatan' ? jabatanTheme.badgeBg : '#2563EB' }]}>
                    <Text style={styles.activeModePillText}>
                      {activeMode === 'jabatan' ? jabatanShortLabel : 'Warga'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.switchModeSub}>
                  {activeMode === 'jabatan'
                    ? 'Beralih ke tampilan tagihan warga pribadi'
                    : `Beralih ke tampilan operasional ${jabatanShortLabel}`}
                </Text>
              </View>
              <ChevronRight size={18} color={colors.primary} />
            </TouchableOpacity>
          </AppCard>
        )}

        {/* Informasi Akun Card */}
        <AppCard style={styles.infoCard}>
          <Text style={styles.cardHeaderTitle}>Informasi Akun & Alamat</Text>

          <View style={styles.infoRow}>
            <View style={styles.infoIconWrap}>
              <Phone size={15} color={colors.primary} />
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Nomor WhatsApp</Text>
              <Text style={styles.infoVal} numberOfLines={1}>{phone}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIconWrap}>
              <Home size={15} color={colors.primary} />
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Unit / Blok Rumah</Text>
              <Text style={styles.infoVal} numberOfLines={1}>{blokText}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIconWrap}>
              <Building2 size={15} color={colors.primary} />
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Rukun Tetangga & Warga</Text>
              <Text style={styles.infoVal} numberOfLines={1}>{rtRwText}</Text>
            </View>
          </View>
        </AppCard>

        {/* Menu Navigasi */}
        <AppCard style={styles.menuCard}>
          {isWarga && currentWarga && (
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => navigation.navigate('DetailWarga', { warga: currentWarga })}
              activeOpacity={0.8}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Data Kartu Keluarga & Anggota"
            >
              <View style={styles.menuIconWrap}>
                <Users size={16} color={colors.primary} />
              </View>
              <Text style={styles.menuLabel}>Data Kartu Keluarga & Anggota</Text>
              <ChevronRight size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          )}

          {isAdminLoggedIn && (
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => navigation.navigate('Pengaturan')}
              activeOpacity={0.8}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Pengaturan Sistem & Pos Iuran"
            >
              <View style={styles.menuIconWrap}>
                <Settings size={16} color={colors.primary} />
              </View>
              <Text style={styles.menuLabel}>Pengaturan Sistem & Pos Iuran</Text>
              <ChevronRight size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.menuRow, { borderBottomWidth: 0 }]}
            onPress={() => navigation.navigate('DataAkses')}
            activeOpacity={0.8}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Akun Login Demo & Keamanan"
          >
            <View style={styles.menuIconWrap}>
              <Shield size={16} color={colors.primary} />
            </View>
            <Text style={styles.menuLabel}>Akun Login Demo & Keamanan</Text>
            <ChevronRight size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </AppCard>

        {/* Tombol Logout */}
        <View style={{ marginTop: spacing.xs, marginBottom: spacing.md }}>
          <AppButton
            title="Keluar dari Akun"
            variant="danger"
            icon={<LogOut size={16} color={colors.surface} />}
            onPress={handleLogout}
          />
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 190
  },
  userCard: {
    alignItems: 'center',
    marginBottom: spacing.md
  },
  avatarWrap: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    backgroundColor: '#ECFDF5',
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs
  },
  avatarText: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.primary
  },
  userName: {
    ...typography.h2,
    textAlign: 'center'
  },
  userRole: {
    ...typography.caption,
    textAlign: 'center',
    marginTop: 2
  },
  usernamePill: {
    backgroundColor: colors.background,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.full,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border
  },
  usernameText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600'
  },
  jabatanPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: 4
  },
  jabatanPillText: {
    fontSize: 11.5,
    fontWeight: '700'
  },
  switchModeCard: {
    marginBottom: spacing.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: spacing.sm + 4
  },
  switchModeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  switchModeIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center'
  },
  switchModeTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary
  },
  activeModePill: {
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    borderRadius: 8
  },
  activeModePillText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#FFFFFF'
  },
  switchModeSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2
  },
  infoCard: {
    marginBottom: spacing.md
  },
  cardHeaderTitle: {
    ...typography.cardTitle,
    marginBottom: spacing.sm
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight
  },
  infoIconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm
  },
  infoCol: {
    flex: 1,
    minWidth: 0
  },
  infoLabel: {
    ...typography.caption
  },
  infoVal: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 1
  },
  menuCard: {
    marginBottom: spacing.md,
    padding: 0
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight
  },
  menuIconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm
  },
  menuLabel: {
    ...typography.body,
    fontWeight: '600',
    flex: 1
  }
})
