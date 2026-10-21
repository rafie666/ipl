import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  useWindowDimensions,
} from 'react-native'
import * as Haptics from 'expo-haptics'
import {
  ArrowLeft,
  User,
  Users,
  ShieldCheck,
  Receipt,
  Wallet,
  Layers,
  CreditCard,
  Calendar,
  Bell,
  Sliders,
  Phone,
  Building2,
  RefreshCw,
  MapPin,
  Database,
  FileText,
  FileCheck,
  ChevronRight,
  Zap,
  CheckCheck,
  LogOut,
  MessageSquareWarning,
  PartyPopper,
  PhoneCall,
  Compass,
  Settings,
  LayoutGrid,
} from 'lucide-react-native'
import { useApp } from '../../context/AppContext'
import { colors, spacing, radius, shadows, typography } from '../../utils/theme'

export default function PengaturanScreen({ navigation }) {
  const {
    currentUser,
    currentWarga,
    currentRT,
    currentRW,
    isWarga,
    isAdmin,
    isRT,
    isRW,
    isBendahara,
    isPengurus,
    effectiveRole,
    switchActiveRole,
    hasJabatan,
    officialJabatan,
    rts = [],
    config,
    jenisIuran = [],
    handleResetData,
    bankAccounts = [],
    qrisAccounts = [],
    expoPushToken,
    aduanUnreadCount = 0,
    suratUnreadCount = 0,
    scopedTagihan = [],
    pengaduan = [],
    surat = [],
    logout
  } = useApp()

  const { width: screenWidth } = useWindowDimensions()

  const autoBilling = config?.autoBilling || {
    enabled: true,
    publishDay: 5,
    dueDay: 20
  }

  const pendingCekCount = (scopedTagihan || []).filter((t) => t.status === 'Menunggu Verifikasi').length

  // Logout Confirmation
  const handleLogout = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {})
    } catch {}
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

  // Role & View Switcher
  const userRolesList = []
  if (hasJabatan) {
    const jabatanTitle = officialJabatan === 'rt'
      ? (currentRT?.name || 'Ketua RT')
      : officialJabatan === 'rw'
      ? (currentRW?.name || 'Ketua RW')
      : officialJabatan === 'bendahara'
      ? 'Bendahara'
      : officialJabatan === 'pengurus'
      ? 'Pengurus'
      : 'Admin IT'

    const jabatanSubtitle = officialJabatan === 'rt'
      ? 'Wilayah RT'
      : officialJabatan === 'rw'
      ? 'Wilayah RW'
      : officialJabatan === 'bendahara'
      ? 'Keuangan'
      : officialJabatan === 'pengurus'
      ? 'Fasum'
      : 'Sistem IT'

    userRolesList.push({
      roleId: officialJabatan,
      name: jabatanTitle,
      sub: jabatanSubtitle,
      isActive: effectiveRole !== 'warga',
      avatarBg: '#EFF6FF',
      avatarColor: '#2563EB',
      icon: ShieldCheck
    })

    userRolesList.push({
      roleId: 'warga',
      name: 'Warga',
      sub: currentWarga?.blok ? ('Blok ' + currentWarga.blok + '-' + currentWarga.noRumah) : 'Tampilan Warga',
      isActive: effectiveRole === 'warga',
      avatarBg: '#ECFDF5',
      avatarColor: '#059669',
      icon: User
    })
  }

  const handleSelectRole = (rItem) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
    } catch {}
    if (rItem.roleId === 'warga') {
      switchActiveRole('warga')
    } else {
      switchActiveRole(rItem.roleId)
    }
  }

  // Compute cell width for 4-column grid
  const contentWidth = Math.min(screenWidth, 480) - 32
  const cellGap = 10
  const cellWidth = Math.floor((contentWidth - cellGap * 3) / 4)

  // Per-role action tiles
  const getActionTiles = () => {
    if (isWarga) {
      return [
        { id: 'tagihan', label: 'Tagihan IPL', icon: Receipt, bg: '#ECFDF5', iconColor: '#059669' },
        { id: 'surat', label: 'Surat RT', icon: FileText, bg: '#EFF6FF', iconColor: '#2563EB', badge: suratUnreadCount > 0 ? suratUnreadCount : undefined },
        { id: 'lapor', label: 'Lapor', icon: MessageSquareWarning, bg: '#FFF7ED', iconColor: '#D97706', badge: aduanUnreadCount > 0 ? aduanUnreadCount : undefined },
        { id: 'satpam', label: 'Jadwal Satpam', icon: ShieldCheck, bg: '#F0F9FF', iconColor: '#0284C7' },
        { id: 'acara', label: 'Iuran Acara', icon: PartyPopper, bg: '#FFF7ED', iconColor: '#EA580C' },
        { id: 'kas', label: 'Info Kas', icon: Wallet, bg: '#F0FDFA', iconColor: '#0D9488' },
        { id: 'rekening', label: 'Rekening RT', icon: CreditCard, bg: '#FAF5FF', iconColor: '#9333EA' },
        { id: 'darurat', label: 'Darurat', icon: PhoneCall, bg: '#FFF1F2', iconColor: '#E11D48' },
        { id: 'profil', label: 'Data Diri', icon: Sliders, bg: '#FEF3C7', iconColor: '#D97706' },
        { id: 'notifikasi', label: 'Notifikasi', icon: Bell, bg: '#F0FDF4', iconColor: '#16A34A' },
      ]
    }
    if (isBendahara) {
      return [
        { id: 'verifikasi', label: 'Verifikasi IPL', icon: CheckCheck, bg: '#ECFDF5', iconColor: '#059669', badge: pendingCekCount > 0 ? pendingCekCount : undefined },
        { id: 'kas', label: 'Buku Kas', icon: Wallet, bg: '#EFF6FF', iconColor: '#2563EB' },
        { id: 'tagihan', label: 'Tagihan Warga', icon: Receipt, bg: '#F0FDFA', iconColor: '#0D9488' },
        { id: 'warga', label: 'Data Warga', icon: Users, bg: '#FEF3C7', iconColor: '#D97706' },
        { id: 'iuran', label: 'Pos Iuran', icon: Layers, bg: '#FAF5FF', iconColor: '#7C3AED' },
        { id: 'denah', label: 'Denah & Peta', icon: MapPin, bg: '#FFFBEB', iconColor: '#D97706' },
        { id: 'rekening', label: 'Rekening Bank', icon: CreditCard, bg: '#ECFDF5', iconColor: '#059669' },
        { id: 'lapor', label: 'Aduan', icon: MessageSquareWarning, bg: '#FFF7ED', iconColor: '#EA580C', badge: aduanUnreadCount > 0 ? aduanUnreadCount : undefined },
        { id: 'surat', label: 'Surat RT', icon: FileText, bg: '#EEF2FF', iconColor: '#4F46E5', badge: suratUnreadCount > 0 ? suratUnreadCount : undefined },
        { id: 'notifikasi', label: 'Notifikasi', icon: Bell, bg: '#F0FDF4', iconColor: '#16A34A' },
        { id: 'darurat', label: 'Darurat', icon: PhoneCall, bg: '#FFF1F2', iconColor: '#E11D48' },
      ]
    }
    if (isRT) {
      return [
        { id: 'warga', label: 'Data Warga', icon: Users, bg: '#ECFDF5', iconColor: '#059669' },
        { id: 'tagihan', label: 'Tagihan RT', icon: Receipt, bg: '#EFF6FF', iconColor: '#2563EB', badge: pendingCekCount > 0 ? pendingCekCount : undefined },
        { id: 'kas', label: 'Buku Kas', icon: Wallet, bg: '#F0FDFA', iconColor: '#0D9488' },
        { id: 'satpam', label: 'Jadwal Satpam', icon: ShieldCheck, bg: '#F0F9FF', iconColor: '#0284C7' },
        { id: 'surat', label: 'Surat RT', icon: FileCheck, bg: '#EEF2FF', iconColor: '#4F46E5', badge: suratUnreadCount > 0 ? suratUnreadCount : undefined },
        { id: 'lapor', label: 'Aduan Warga', icon: MessageSquareWarning, bg: '#FFFBEB', iconColor: '#D97706', badge: aduanUnreadCount > 0 ? aduanUnreadCount : undefined },
        { id: 'acara', label: 'Kegiatan', icon: PartyPopper, bg: '#FFF7ED', iconColor: '#EA580C' },
        { id: 'iuran', label: 'Pos Iuran', icon: Layers, bg: '#FAF5FF', iconColor: '#7C3AED' },
        { id: 'rekening', label: 'Rekening Bank', icon: CreditCard, bg: '#ECFDF5', iconColor: '#059669' },
        { id: 'notifikasi', label: 'Notifikasi', icon: Bell, bg: '#F0FDF4', iconColor: '#16A34A' },
        { id: 'darurat', label: 'Darurat', icon: PhoneCall, bg: '#FFF1F2', iconColor: '#E11D48' },
      ]
    }
    if (isRW) {
      return [
        { id: 'warga', label: 'Warga RW', icon: Users, bg: '#FEF2F2', iconColor: '#DC2626' },
        { id: 'tagihan', label: 'Tagihan RW', icon: Receipt, bg: '#EFF6FF', iconColor: '#2563EB', badge: pendingCekCount > 0 ? pendingCekCount : undefined },
        { id: 'kas', label: 'Kas Wilayah', icon: Wallet, bg: '#ECFDF5', iconColor: '#059669' },
        { id: 'satpam', label: 'Jadwal Satpam', icon: ShieldCheck, bg: '#F0F9FF', iconColor: '#0284C7' },
        { id: 'surat', label: 'Layanan Surat', icon: FileCheck, bg: '#EEF2FF', iconColor: '#4F46E5', badge: suratUnreadCount > 0 ? suratUnreadCount : undefined },
        { id: 'lapor', label: 'Aduan Warga', icon: MessageSquareWarning, bg: '#FFFBEB', iconColor: '#D97706', badge: aduanUnreadCount > 0 ? aduanUnreadCount : undefined },
        { id: 'acara', label: 'Agenda RW', icon: PartyPopper, bg: '#FFF7ED', iconColor: '#EA580C' },
        { id: 'iuran', label: 'Pos Iuran', icon: Layers, bg: '#FAF5FF', iconColor: '#7C3AED' },
        { id: 'lingkungan', label: 'Identitas RW', icon: Building2, bg: '#F0F9FF', iconColor: '#0284C7' },
        { id: 'notifikasi', label: 'Notifikasi', icon: Bell, bg: '#F0FDF4', iconColor: '#16A34A' },
        { id: 'darurat', label: 'Darurat', icon: PhoneCall, bg: '#FFF1F2', iconColor: '#E11D48' },
      ]
    }
    if (isPengurus) {
      return [
        { id: 'lapor', label: 'Aduan Fasum', icon: MessageSquareWarning, bg: '#FEE2E2', iconColor: '#DC2626', badge: (pengaduan?.filter((p) => p.status !== 'Selesai')?.length || 0) > 0 ? pengaduan.filter((p) => p.status !== 'Selesai').length : undefined },
        { id: 'surat', label: 'Surat Warga', icon: FileCheck, bg: '#EFF6FF', iconColor: '#2563EB', badge: (surat?.filter((s) => s.status === 'Menunggu' || s.status === 'Diajukan')?.length || 0) > 0 ? surat.filter((s) => s.status === 'Menunggu' || s.status === 'Diajukan').length : undefined },
        { id: 'satpam', label: 'Jadwal Satpam', icon: ShieldCheck, bg: '#ECFDF5', iconColor: '#059669' },
        { id: 'iuran', label: 'Pos Iuran', icon: Layers, bg: '#F0F9FF', iconColor: '#0284C7' },
        { id: 'acara', label: 'Acara Warga', icon: PartyPopper, bg: '#FFF7ED', iconColor: '#EA580C' },
        { id: 'kas', label: 'Buku Kas', icon: Wallet, bg: '#F0FDFA', iconColor: '#0D9488' },
        { id: 'warga', label: 'Data Warga', icon: Users, bg: '#EEF2FF', iconColor: '#4F46E5' },
        { id: 'notifikasi', label: 'Notifikasi', icon: Bell, bg: '#F0FDF4', iconColor: '#16A34A' },
        { id: 'darurat', label: 'Darurat', icon: PhoneCall, bg: '#FFF1F2', iconColor: '#E11D48' },
      ]
    }
    // Admin IT
    return [
      { id: 'warga', label: 'Master Warga', icon: Users, bg: '#ECFDF5', iconColor: '#059669' },
      { id: 'tagihan', label: 'Tagihan IPL', icon: Receipt, bg: '#EFF6FF', iconColor: '#2563EB', badge: pendingCekCount > 0 ? pendingCekCount : undefined },
      { id: 'kas', label: 'Buku Kas', icon: Wallet, bg: '#F0FDFA', iconColor: '#0D9488' },
      { id: 'denah', label: 'Denah & Peta', icon: MapPin, bg: '#FEF3C7', iconColor: '#D97706' },
      { id: 'surat', label: 'Surat RT/RW', icon: FileCheck, bg: '#EEF2FF', iconColor: '#4F46E5', badge: suratUnreadCount > 0 ? suratUnreadCount : undefined },
      { id: 'lapor', label: 'Aduan Warga', icon: MessageSquareWarning, bg: '#FFFBEB', iconColor: '#D97706', badge: aduanUnreadCount > 0 ? aduanUnreadCount : undefined },
      { id: 'satpam', label: 'Jadwal Satpam', icon: ShieldCheck, bg: '#F1F5F9', iconColor: '#475569' },
      { id: 'acara', label: 'Iuran Acara', icon: PartyPopper, bg: '#FFF7ED', iconColor: '#EA580C' },
      { id: 'iuran', label: 'Pos Tarif IPL', icon: Layers, bg: '#FAF5FF', iconColor: '#9333EA' },
      { id: 'rekening', label: 'Rekening Bank', icon: CreditCard, bg: '#ECFDF5', iconColor: '#059669' },
      { id: 'gateway', label: 'Gateway Moota', icon: Database, bg: '#ECFEFF', iconColor: '#0891B2' },
      { id: 'akses', label: 'Data Akses', icon: ShieldCheck, bg: '#F1F5F9', iconColor: '#334155' },
      { id: 'lingkungan', label: 'Identitas RW', icon: Building2, bg: '#F0F9FF', iconColor: '#0284C7' },
      { id: 'notifikasi', label: 'Notifikasi', icon: Bell, bg: '#F0FDF4', iconColor: '#16A34A' },
      { id: 'darurat', label: 'Darurat', icon: PhoneCall, bg: '#FFF1F2', iconColor: '#E11D48' },
      { id: 'pengaturan', label: 'Pengaturan IT', icon: Settings, bg: '#F1F5F9', iconColor: '#047857' },
      { id: 'reset', label: 'Reset Data', icon: RefreshCw, bg: '#FEF2F2', iconColor: '#DC2626' },
    ]
  }

  const handleTilePress = (id) => {
    try { Haptics.selectionAsync().catch(() => {}) } catch {}
    switch (id) {
      case 'tagihan': return navigation.navigate('Main', { screen: 'TagihanTab' })
      case 'verifikasi': return navigation.navigate('Main', { screen: 'LayananTab' })
      case 'kas': return navigation.navigate('Kas')
      case 'warga': return navigation.navigate('WargaList')
      case 'surat': return navigation.navigate('Surat')
      case 'lapor': return navigation.navigate('Pengaduan')
      case 'satpam': return navigation.navigate('JadwalSatpam')
      case 'acara': return navigation.navigate('Events')
      case 'iuran': return navigation.navigate('PosIuran')
      case 'rekening': return navigation.navigate('RekeningBank')
      case 'denah': return navigation.navigate('PetaWarga')
      case 'gateway': return navigation.navigate('MootaGateway')
      case 'akses': return navigation.navigate('DataAkses')
      case 'lingkungan': return navigation.navigate('IdentitasLingkungan')
      case 'notifikasi': return navigation.navigate('NotifikasiPerangkat')
      case 'darurat': return navigation.navigate('KontakDarurat')
      case 'profil': return navigation.navigate('EditProfileWarga')
      case 'pengaturan': return navigation.navigate('Pengaturan')
      case 'reset': return handleResetData()
      default: break
    }
  }

  const actionTiles = getActionTiles()

  const roleName = isAdmin ? 'Admin IT'
    : isBendahara ? 'Bendahara'
    : isRT ? (currentRT?.name || 'Ketua RT')
    : isRW ? (currentRW?.name || 'Ketua RW')
    : isPengurus ? 'Pengurus'
    : 'Warga'

  const displayName = (currentUser?.name || 'Pengguna').replace(/\s*\(Warga.*?\)/i, '')

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.topNavRow}>
        <View style={styles.headerIconBox}>
          <LayoutGrid size={22} color="#059669" strokeWidth={2.4} />
        </View>
        <View style={styles.topNavLeft}>
          <Text style={styles.topNavTitle}>Aksi Cepat</Text>
          <Text style={styles.topNavSub}>{roleName} • {displayName}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ROLE SWITCHER (hanya jika ada jabatan) */}
        {hasJabatan && userRolesList.length > 0 && (
          <View style={styles.switcherCard}>
            <Text style={styles.switcherLabel}>Mode Tampilan</Text>
            <View style={styles.switcherRow}>
              {userRolesList.map((rItem) => {
                const isActive = rItem.isActive
                const IconComp = rItem.icon
                return (
                  <TouchableOpacity
                    key={rItem.roleId}
                    style={[styles.switcherItem, isActive && styles.switcherItemActive]}
                    onPress={() => handleSelectRole(rItem)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.switcherAvatar, { backgroundColor: isActive ? rItem.avatarBg : '#F1F5F9' }]}>
                      <IconComp size={20} color={isActive ? rItem.avatarColor : '#94A3B8'} strokeWidth={2.4} />
                    </View>
                    <Text style={[styles.switcherName, isActive && styles.switcherNameActive]} numberOfLines={1}>
                      {rItem.name}
                    </Text>
                    <Text style={styles.switcherSub} numberOfLines={1}>{rItem.sub}</Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>
        )}

        {/* ACTION TILE GRID */}
        <View style={styles.tilesSection}>
          <Text style={styles.tilesLabel}>Semua Fitur</Text>
          <View style={styles.tilesGrid}>
            {actionTiles.map((tile) => {
              const IconComp = tile.icon
              const badgeNum = tile.badge
              return (
                <TouchableOpacity
                  key={tile.id}
                  style={[styles.tile, { width: cellWidth }]}
                  onPress={() => handleTilePress(tile.id)}
                  activeOpacity={0.75}
                >
                  <View style={[styles.tileIconWrap, { backgroundColor: tile.bg }]}>
                    <IconComp size={26} color={tile.iconColor} strokeWidth={2} />
                    {badgeNum != null && badgeNum > 0 && (
                      <View style={styles.tileBadge}>
                        <Text style={styles.tileBadgeText}>{badgeNum > 9 ? '9+' : String(badgeNum)}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.tileLabel} numberOfLines={2}>{tile.label}</Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

        {/* LOGOUT */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Keluar dari Akun"
        >
          <View style={styles.logoutIconBox}>
            <LogOut size={20} color="#DC2626" strokeWidth={2.2} />
          </View>
          <View style={styles.logoutTextCol}>
            <Text style={styles.logoutTitle}>Keluar dari Akun</Text>
            <Text style={styles.logoutSubtitle}>Akhiri sesi login di perangkat ini</Text>
          </View>
          <ChevronRight size={18} color="#DC2626" />
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 38,
    paddingBottom: 14,
    backgroundColor: '#F8FAFC',
  },
  headerIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  topNavLeft: {
    flex: 1,
  },
  topNavTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    fontFamily: typography.h1.fontFamily,
    letterSpacing: -0.5,
  },
  topNavSub: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 160,
    paddingTop: 4,
  },

  // Role Switcher
  switcherCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 20,
    ...Platform.select({
      web: { boxShadow: '0px 2px 8px rgba(15, 23, 42, 0.04)' },
      default: { elevation: 2, shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 }
    })
  },
  switcherLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  switcherRow: {
    flexDirection: 'row',
    gap: 12,
  },
  switcherItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'transparent',
    backgroundColor: '#F8FAFC',
  },
  switcherItemActive: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
  },
  switcherAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  switcherName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    textAlign: 'center',
  },
  switcherNameActive: {
    fontWeight: '800',
    color: '#0F172A',
  },
  switcherSub: {
    fontSize: 10,
    color: '#CBD5E1',
    textAlign: 'center',
    marginTop: 2,
  },

  // Tiles
  tilesSection: {
    marginBottom: 20,
  },
  tilesLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  tilesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tile: {
    alignItems: 'center',
    marginBottom: 4,
  },
  tileIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    ...Platform.select({
      web: { boxShadow: '0px 1px 4px rgba(15,23,42,0.05)' },
      default: { elevation: 1, shadowColor: '#0F172A', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 }
    })
  },
  tileBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  tileBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  tileLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0F172A',
    textAlign: 'center',
    marginTop: 7,
    lineHeight: 14,
    minHeight: 28,
  },

  // Logout
  logoutBtn: {
    marginHorizontal: spacing.md,
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#FEE2E2',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    ...Platform.select({
      web: { boxShadow: '0 2px 10px rgba(220, 38, 38, 0.08)' },
      default: {
        shadowColor: '#DC2626',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 2
      }
    })
  },
  logoutIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  logoutTextCol: {
    flex: 1
  },
  logoutTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#DC2626',
    letterSpacing: -0.2
  },
  logoutSubtitle: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500'
  }
})

