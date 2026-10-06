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
  Edit3
} from 'lucide-react-native'
import { useApp } from '../context/AppContext'
import TopAppBar from '../components/TopAppBar'
import AppCard from '../components/AppCard'
import AppButton from '../components/AppButton'
import { colors, typography, spacing, radius, shadows } from '../utils/theme'

export default function ProfileScreen({ navigation }) {
  const { currentUser, currentRT, currentWarga, logout, isWarga, isAdminLoggedIn } = useApp()

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

  const roleName =
    currentUser?.role === 'admin'
      ? 'Super Administrator RW'
      : currentUser?.role === 'rt'
      ? `Ketua / Pengurus ${currentRT?.name || 'RT 01'}`
      : `Warga ${currentWarga?.blok ? `Blok ${currentWarga.blok}/${currentWarga.noRumah}` : 'Tetap'}`

  const phone = currentWarga?.noHp || (currentUser?.role === 'rt' ? '081234567890' : '081122334455')
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
          <Text style={styles.userRole} numberOfLines={1}>{roleName}</Text>
          <View style={styles.usernamePill}>
            <Text style={styles.usernameText}>@{currentUser?.username}</Text>
          </View>
        </AppCard>

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
    paddingBottom: 110
  },
  userCard: {
    alignItems: 'center',
    marginBottom: spacing.md
  },
  avatarWrap: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    backgroundColor: '#FEF2F2',
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
    backgroundColor: '#FEF2F2',
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
    backgroundColor: '#FEF2F2',
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
