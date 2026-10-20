import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform
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
  ChevronRight,
  Zap,
  CheckCheck,
  LogOut
} from 'lucide-react-native'
import { useApp } from '../context/AppContext'
import { colors, spacing, radius, shadows, typography } from '../utils/theme'

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
    logout
  } = useApp()

  const autoBilling = config?.autoBilling || {
    enabled: true,
    publishDay: 5,
    dueDay: 20
  }

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

  // Role & View Switcher: Hanya aktif jika user memiliki jabatan (RT, RW, Bendahara, Pengurus, Admin)
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

    // 1. Tampilan Jabatan
    userRolesList.push({
      roleId: officialJabatan,
      name: jabatanTitle,
      sub: jabatanSubtitle,
      isActive: effectiveRole !== 'warga',
      avatarBg: '#EFF6FF',
      avatarColor: '#2563EB',
      icon: ShieldCheck
    })

    // 2. Tampilan Warga
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

  // 3 Quick Action Cards (seperti 3 kotak di foto)
  const quickActionCards = (() => {
    if (isWarga) {
      return [
        {
          id: 'bayar',
          label: 'Bayar IPL',
          icon: Receipt,
          iconColor: '#059669',
          onPress: () => navigation.navigate('Main', { screen: 'TagihanTab' })
        },
        {
          id: 'surat',
          label: 'Surat RT',
          icon: FileText,
          iconColor: '#2563EB',
          onPress: () => navigation.navigate('Surat')
        },
        {
          id: 'profil',
          label: 'Data Diri',
          icon: Sliders,
          iconColor: '#D97706',
          onPress: () => navigation.navigate('EditProfileWarga')
        }
      ]
    }
    if (isBendahara) {
      return [
        {
          id: 'verifikasi',
          label: 'Verifikasi',
          icon: CheckCheck,
          iconColor: '#059669',
          onPress: () => navigation.navigate('Main', { screen: 'LayananTab' })
        },
        {
          id: 'kas',
          label: 'Buku Kas',
          icon: Wallet,
          iconColor: '#2563EB',
          onPress: () => navigation.navigate('Main', { screen: 'TagihanTab' })
        },
        {
          id: 'iuran',
          label: 'Pos Iuran',
          icon: Layers,
          iconColor: '#7C3AED',
          onPress: () => navigation.navigate('PosIuran')
        }
      ]
    }
    if (isRT || isRW) {
      return [
        {
          id: 'warga',
          label: 'Data Warga',
          icon: Users,
          iconColor: '#0284C7',
          onPress: () => navigation.navigate('Main', { screen: 'TagihanTab' })
        },
        {
          id: 'kas',
          label: 'Kas Wilayah',
          icon: Wallet,
          iconColor: '#059669',
          onPress: () => navigation.navigate('Main', { screen: 'LayananTab' })
        },
        {
          id: 'iuran',
          label: 'Pos Iuran',
          icon: Layers,
          iconColor: '#D97706',
          onPress: () => navigation.navigate('PosIuran')
        }
      ]
    }
    // Admin IT / Pengurus
    return [
      {
        id: 'iuran',
        label: 'Pos Iuran',
        icon: Layers,
        iconColor: '#059669',
        onPress: () => navigation.navigate('PosIuran')
      },
      {
        id: 'rekening',
        label: 'Rekening',
        icon: CreditCard,
        iconColor: '#2563EB',
        onPress: () => navigation.navigate('RekeningBank')
      },
      {
        id: 'akses',
        label: 'Data Akses',
        icon: ShieldCheck,
        iconColor: '#7C3AED',
        onPress: () => navigation.navigate('DataAkses')
      }
    ]
  })()

  return (
    <View style={styles.container}>
      {/* Header Top (< Profile / Aksi Cepat) */}
      <View style={styles.topNavRow}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            if (navigation.canGoBack()) navigation.goBack()
            else navigation.navigate('Main', { screen: 'DashboardTab' })
          }}
          activeOpacity={0.7}
          accessibilityLabel="Kembali"
        >
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.topNavTitle}>Aksi Cepat</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* 1. ROLE / VIEW SWITCHER (HANYA JIKA USER MEMILIKI JABATAN) */}
        {hasJabatan && userRolesList.length > 0 && (
          <View style={styles.profileSection}>
            <View style={styles.profileRow}>
              {userRolesList.map((rItem) => {
                const isActive = rItem.isActive
                const IconComp = rItem.icon
                return (
                  <TouchableOpacity
                    key={rItem.roleId}
                    style={styles.profileItem}
                    onPress={() => handleSelectRole(rItem)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.avatarRing, isActive && styles.avatarRingActive]}>
                      <View style={[styles.avatarCircle, { backgroundColor: rItem.avatarBg }]}>
                        <IconComp size={24} color={rItem.avatarColor} strokeWidth={2.4} />
                      </View>
                    </View>
                    <Text style={[styles.profileName, isActive && styles.profileNameActive]} numberOfLines={1}>
                      {rItem.name}
                    </Text>
                    <Text style={styles.profileSub} numberOfLines={1}>
                      {rItem.sub}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>
        )}

        {/* 2. THREE QUICK ACTION CARDS */}
        <View style={styles.threeCardsRow}>
          {quickActionCards.map((card) => {
            const IconComp = card.icon
            return (
              <TouchableOpacity
                key={card.id}
                style={styles.quickCard}
                onPress={card.onPress}
                activeOpacity={0.75}
              >
                <View style={styles.quickCardIconWrap}>
                  <IconComp size={26} color={card.iconColor} strokeWidth={2.2} />
                </View>
                <Text style={styles.quickCardLabel} numberOfLines={1}>
                  {card.label}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>

        {/* 3. GROUPED LIST CARD - SEMUA NAVIGASI KE FULL PAGE TANPA POP-UP */}
        <View style={styles.groupedCard}>
          {isWarga ? (
            <>
              <TouchableOpacity
                style={styles.menuRow}
                onPress={() => navigation.navigate('EditProfileWarga')}
                activeOpacity={0.7}
              >
                <View style={[styles.menuIconBox, { backgroundColor: '#EFF6FF' }]}>
                  <User size={18} color="#2563EB" />
                </View>
                <View style={styles.menuTextCol}>
                  <Text style={styles.menuTitle}>Profil & Data Warga</Text>
                  <Text style={styles.menuDesc} numberOfLines={1}>
                    {currentWarga?.nama || currentUser?.name || 'Identitas pribadi & alamat rumah'}
                  </Text>
                </View>
                <ChevronRight size={18} color={colors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuRow}
                onPress={() => navigation.navigate('NotifikasiPerangkat')}
                activeOpacity={0.7}
              >
                <View style={[styles.menuIconBox, { backgroundColor: '#F0FDF4' }]}>
                  <Bell size={18} color="#16A34A" />
                </View>
                <View style={styles.menuTextCol}>
                  <Text style={styles.menuTitle}>Notifikasi & Pengingat</Text>
                  <Text style={styles.menuDesc}>
                    {expoPushToken ? 'Notifikasi perangkat aktif 🟢' : 'Atur izin notifikasi HP 🟡'}
                  </Text>
                </View>
                <ChevronRight size={18} color={colors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuRow}
                onPress={() => navigation.navigate('RekeningBank')}
                activeOpacity={0.7}
              >
                <View style={[styles.menuIconBox, { backgroundColor: '#FAF5FF' }]}>
                  <CreditCard size={18} color="#9333EA" />
                </View>
                <View style={styles.menuTextCol}>
                  <Text style={styles.menuTitle}>Rekening & QRIS Pengelola</Text>
                  <Text style={styles.menuDesc}>Info rekening resmi kas RT & RW</Text>
                </View>
                <ChevronRight size={18} color={colors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuRow}
                onPress={() => navigation.navigate('KontakDarurat')}
                activeOpacity={0.7}
              >
                <View style={[styles.menuIconBox, { backgroundColor: '#FEF2F2' }]}>
                  <Phone size={18} color="#DC2626" />
                </View>
                <View style={styles.menuTextCol}>
                  <Text style={styles.menuTitle}>Kontak Darurat Lingkungan</Text>
                  <Text style={styles.menuDesc}>Nomor satpam, damkar, ambulans, & pengurus</Text>
                </View>
                <ChevronRight size={18} color={colors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.menuRow, { borderBottomWidth: 0 }]}
                onPress={() => navigation.navigate('PetaWarga')}
                activeOpacity={0.7}
              >
                <View style={[styles.menuIconBox, { backgroundColor: '#FFFBEB' }]}>
                  <MapPin size={18} color="#D97706" />
                </View>
                <View style={styles.menuTextCol}>
                  <Text style={styles.menuTitle}>Denah & Peta Warga</Text>
                  <Text style={styles.menuDesc}>Sebaran rumah & fasilitas umum komplek</Text>
                </View>
                <ChevronRight size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={styles.menuRow}
                onPress={() => navigation.navigate('RekeningBank')}
                activeOpacity={0.7}
              >
                <View style={[styles.menuIconBox, { backgroundColor: '#ECFDF5' }]}>
                  <CreditCard size={18} color="#059669" />
                </View>
                <View style={styles.menuTextCol}>
                  <Text style={styles.menuTitle}>Rekening Bank & QRIS</Text>
                  <Text style={styles.menuDesc}>
                    {bankAccounts.length} Rekening Aktif • {qrisAccounts.length} Barcode QRIS
                  </Text>
                </View>
                <ChevronRight size={18} color={colors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuRow}
                onPress={() => navigation.navigate('PosIuran')}
                activeOpacity={0.7}
              >
                <View style={[styles.menuIconBox, { backgroundColor: '#FFFBEB' }]}>
                  <Layers size={18} color="#D97706" />
                </View>
                <View style={styles.menuTextCol}>
                  <Text style={styles.menuTitle}>Pos Tarif & Auto-Post Iuran</Text>
                  <Text style={styles.menuDesc}>
                    {jenisIuran.length} Pos Iuran • Auto-Post: {autoBilling.enabled ? (`Tgl ${autoBilling.publishDay || 5} (${autoBilling.publishTime || '08:00'} WIB) 🟢`) : 'Nonaktif 🔴'}
                  </Text>
                </View>
                <ChevronRight size={18} color={colors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuRow}
                onPress={() => navigation.navigate('IdentitasLingkungan')}
                activeOpacity={0.7}
              >
                <View style={[styles.menuIconBox, { backgroundColor: '#FAF5FF' }]}>
                  <Building2 size={18} color="#7C3AED" />
                </View>
                <View style={styles.menuTextCol}>
                  <Text style={styles.menuTitle}>Identitas Wilayah RT & RW</Text>
                  <Text style={styles.menuDesc}>{(config?.rw || 'RW 01') + ' • ' + rts.length + ' Rukun Tetangga'}</Text>
                </View>
                <ChevronRight size={18} color={colors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuRow}
                onPress={() => navigation.navigate('NotifikasiPerangkat')}
                activeOpacity={0.7}
              >
                <View style={[styles.menuIconBox, { backgroundColor: '#F0FDF4' }]}>
                  <Bell size={18} color="#16A34A" />
                </View>
                <View style={styles.menuTextCol}>
                  <Text style={styles.menuTitle}>Notifikasi & Perangkat</Text>
                  <Text style={styles.menuDesc}>Uji push notifikasi & Expo push token</Text>
                </View>
                <ChevronRight size={18} color={colors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuRow}
                onPress={() => navigation.navigate('MootaGateway')}
                activeOpacity={0.7}
              >
                <View style={[styles.menuIconBox, { backgroundColor: '#ECFEFF' }]}>
                  <Database size={18} color="#0891B2" />
                </View>
                <View style={styles.menuTextCol}>
                  <Text style={styles.menuTitle}>Moota & Supabase Gateway</Text>
                  <Text style={styles.menuDesc}>Koneksi server cloud & sandbox mutasi bank</Text>
                </View>
                <ChevronRight size={18} color={colors.textSecondary} />
              </TouchableOpacity>

              {isAdmin && (
                <TouchableOpacity
                  style={styles.menuRow}
                  onPress={() => navigation.navigate('DataAkses')}
                  activeOpacity={0.7}
                >
                  <View style={[styles.menuIconBox, { backgroundColor: '#F1F5F9' }]}>
                    <ShieldCheck size={18} color="#475569" />
                  </View>
                  <View style={styles.menuTextCol}>
                    <Text style={styles.menuTitle}>Data Akses & Keamanan Akun</Text>
                    <Text style={styles.menuDesc}>Kelola login Ketua RT, Bendahara, & Admin</Text>
                  </View>
                  <ChevronRight size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.menuRow, { borderBottomWidth: 0 }]}
                onPress={handleResetData}
                activeOpacity={0.7}
              >
                <View style={[styles.menuIconBox, { backgroundColor: '#FEF2F2' }]}>
                  <RefreshCw size={18} color="#DC2626" />
                </View>
                <View style={styles.menuTextCol}>
                  <Text style={[styles.menuTitle, { color: '#DC2626' }]}>Reset Data Sistem</Text>
                  <Text style={styles.menuDesc}>Kembalikan ke data default awal</Text>
                </View>
                <ChevronRight size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* 4. LOGOUT BUTTON */}
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 54 : 36,
    paddingBottom: 12,
    backgroundColor: '#F8FAFC'
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      web: { boxShadow: '0px 1px 3px rgba(15, 23, 42, 0.05)' },
      default: { elevation: 1 }
    })
  },
  topNavTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    fontFamily: typography.h2.fontFamily,
    letterSpacing: -0.3
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 160
  },

  // 1. Role / Profile Avatars Row
  profileSection: {
    marginTop: 8,
    marginBottom: 20
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    gap: 32
  },
  profileItem: {
    alignItems: 'center',
    width: 88
  },
  avatarRing: {
    width: 66,
    height: 66,
    borderRadius: 33,
    padding: 3,
    borderWidth: 2.2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarRingActive: {
    borderColor: '#0284C7',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)'
  },
  profileName: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 6,
    textAlign: 'center'
  },
  profileNameActive: {
    fontWeight: '800',
    color: '#0F172A'
  },
  profileSub: {
    fontSize: 10.5,
    color: '#94A3B8',
    marginTop: 1,
    textAlign: 'center'
  },

  // 2. Three Quick Action Cards
  threeCardsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 22
  },
  quickCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.85)',
    ...Platform.select({
      web: { boxShadow: '0px 2px 8px rgba(15, 23, 42, 0.04)' },
      default: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2
      }
    })
  },
  quickCardIconWrap: {
    marginBottom: 8
  },
  quickCardLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    fontFamily: typography.labelSm.fontFamily
  },

  // 3. Grouped List Card
  groupedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.9)',
    overflow: 'hidden',
    marginBottom: 26,
    ...Platform.select({
      web: { boxShadow: '0px 2px 12px rgba(15, 23, 42, 0.04)' },
      default: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
        elevation: 2
      }
    })
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  menuIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  menuTextCol: {
    flex: 1,
    minWidth: 0,
    marginRight: 8
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    fontFamily: typography.label.fontFamily
  },
  menuDesc: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2
  },

  // 4. Logout Button
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
