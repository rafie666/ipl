import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Alert,
  StatusBar
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  Receipt,
  Settings,
  Wallet,
  Users,
  MessageSquareText,
  PhoneCall,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  FileText,
  ChevronRight,
  CreditCard,
  Grid,
  Calendar,
  Clock,
  Megaphone,
  Trophy,
  Bell,
  MapPin,
  Compass,
  Landmark,
  Shield,
  ArrowDownLeft,
  ArrowUpRight,
  Coins,
  Repeat,
  ShieldCheck,
  Home,
  User,
  Building2,
  Activity,
  UserCheck,
  UserPlus,
  Edit3,
  Search,
  Check
} from 'lucide-react-native'
import { useApp } from '../context/AppContext'
import TopAppBar from '../components/TopAppBar'
import AppCard from '../components/AppCard'
import AppBadge from '../components/AppBadge'
import AppButton from '../components/AppButton'
import AppModal from '../components/AppModal'
import TransparansiIuranTable from '../components/TransparansiIuranTable'
import VirtualResidentCard from '../components/VirtualResidentCard'
import RTHeroCard from '../components/RTHeroCard'
import RWHeroCard from '../components/RWHeroCard'
import BendaharaHeroCard from '../components/BendaharaHeroCard'
import PengurusHeroCard from '../components/PengurusHeroCard'
import QuickActionGrid from '../components/QuickActionGrid'
import KasWidget from '../components/KasWidget'
import TransactionListItem from '../components/TransactionListItem'
import ReceiptModal from '../components/ReceiptModal'
import AppEmptyState from '../components/AppEmptyState'
import { colors, typography, spacing, radius, shadows, layout } from '../theme'
import { getJabatanLabel, getJabatanShortLabel, getJabatanTheme, NAMA_BULAN } from '../utils/formatters'
import { formatRupiah, formatRupiahCompact, formatDateIndo } from '../utils/format'

function getGreeting() {
  const hour = new Date().getHours()
  if (hour >= 4 && hour < 11) return 'Selamat Pagi'
  if (hour >= 11 && hour < 15) return 'Selamat Siang'
  if (hour >= 15 && hour < 18) return 'Selamat Sore'
  return 'Selamat Malam'
}

export default function DashboardScreen({ navigation }) {
  const insets = useSafeAreaInsets()
  const {
    currentUser,
    isWarga,
    isRT,
    isRW,
    isBendahara,
    isPengurus,
    isAdmin,
    currentRT,
    currentRW,
    scopedRts,
    rts,
    currentWarga,
    scopedTagihan,
    scopedWarga,
    scopedKas,
    events,
    scopedEvents,
    tagihanEvents,
    pengaduan,
    surat,
    warga,
    updateWarga,
    refreshData,
    refreshing,
    hasDualRole,
    activeMode,
    toggleActiveMode,
    jabatanLabel,
    jabatanShortLabel,
    jabatanTheme,
    suratUnreadCount = 0,
    aduanUnreadCount = 0
  } = useApp()

  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()

  // Announcement & Iuran Notification
  const activeEventsList = scopedEvents || []
  const latestAnnouncement = activeEventsList[0] || null
  const isLatestPaid = latestAnnouncement && Number(latestAnnouncement.nominalPerKK) > 0

  // Tagihan untuk Warga
  const myBills = isWarga
    ? (scopedTagihan || []).filter(
        (t) =>
          t.wargaId === currentUser?.resident_id ||
          (t.namaWarga && currentUser?.name && t.namaWarga.toLowerCase().includes(currentUser.name.toLowerCase()))
      )
    : (scopedTagihan || [])

  const myBillsCurrentMonth = myBills.filter(
    (t) => Number(t.bulan) === currentMonth && Number(t.tahun) === currentYear
  )

  // Prioritas tagihan aktif: yang belum lunas di bulan ini, atau yang belum lunas kapanpun, atau tagihan bulan ini
  const tagihanBulanIni = isWarga
    ? (myBillsCurrentMonth.find((t) => t.status !== 'Lunas') ||
       myBills.find((t) => t.status !== 'Lunas') ||
       myBillsCurrentMonth[0] ||
       myBills[0] ||
       null)
    : null

  // Ringkasan untuk RT / Admin
  const lunasTagihan = scopedTagihan.filter((t) => t.status === 'Lunas')
  const belumLunasTagihan = scopedTagihan.filter(
    (t) => t.status === 'Belum Lunas' || t.status === 'Belum Bayar'
  )
  const pendingCekCount = scopedTagihan.filter((t) => t.status === 'Menunggu Verifikasi').length

  const totalLunasNominal = lunasTagihan.reduce((acc, t) => acc + (t.total || 0), 0)
  const totalBelumNominal = belumLunasTagihan.reduce((acc, t) => acc + (t.total || 0), 0)

  const [transparansiScope, setTransparansiScope] = useState('ALL') // 'ALL' | 'RT' | 'RW'
  const [transparansiTab, setTransparansiTab] = useState('iuran') // 'iuran' | 'pengeluaran'
  const [kasDetailModalOpen, setKasDetailModalOpen] = useState(false)
  const [selectedKasDetail, setSelectedKasDetail] = useState(null)
  const [selectedReceipt, setSelectedReceipt] = useState(null)

  // Status calculation for Virtual Resident Card (§4.1.4)
  const isResidentView = isWarga || activeMode !== 'jabatan'
  const unpaidBillsList = isWarga
    ? myBills.filter((t) => t.status !== 'Lunas')
    : (scopedTagihan || []).filter((t) => t.status !== 'Lunas')

  let residentCardStatus = 'none'
  let residentBillAmount = 0
  let overdueDaysCount = 0

  if (unpaidBillsList.length > 0) {
    residentBillAmount = unpaidBillsList.reduce((sum, t) => sum + (t.total || 0), 0)
    const hasPending = unpaidBillsList.some((t) => t.status === 'Menunggu Verifikasi')
    const dueDate = new Date(currentYear, currentMonth - 1, 20)
    const now = new Date()
    if (hasPending) {
      residentCardStatus = 'pending'
    } else if (now > dueDate) {
      residentCardStatus = 'overdue'
      overdueDaysCount = Math.max(1, Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 3600 * 24)))
    } else {
      residentCardStatus = 'unpaid'
    }
  } else if (tagihanBulanIni) {
    residentBillAmount = tagihanBulanIni.total || 0
    residentCardStatus = tagihanBulanIni.status === 'Lunas' ? 'paid' : (tagihanBulanIni.status === 'Menunggu Verifikasi' ? 'pending' : 'none')
  } else {
    residentCardStatus = 'none'
  }

  const periodLabelString = unpaidBillsList.length > 1
    ? `TOTAL ${unpaidBillsList.length} TAGIHAN`
    : tagihanBulanIni
    ? `${residentCardStatus === 'paid' ? 'TERBAYAR' : 'TAGIHAN'} ${(NAMA_BULAN[(tagihanBulanIni.bulan || currentMonth) - 1] || 'BULAN INI').toUpperCase()} ${tagihanBulanIni.tahun || currentYear}`
    : 'BEBAS TAGIHAN'

  const unitCodeString = currentWarga?.blok
    ? `Blok ${currentWarga.blok} / No. ${currentWarga.noRumah || '01'}`
    : 'Blok B-12 / No. 04'

  // Recent activity list items (§4.4)
  const recentActivities = (scopedTagihan || []).slice(0, 3).map((item, idx) => {
    const isLunas = item.status === 'Lunas'
    const isPending = item.status === 'Menunggu Verifikasi'
    const statusKey = isLunas ? 'paid' : isPending ? 'pending' : 'unpaid'
    const title = item.namaPos || item.pembayaran_kepada || `IPL Bulanan - ${NAMA_BULAN[item.bulan - 1] || 'Bulan'} ${item.tahun || currentYear}`
    const subInfo = isLunas
      ? `${item.metode || 'Transfer Bank'} • ${item.tanggalBayar || 'Lunas'}`
      : (isPending
          ? 'Menunggu Verifikasi Bukti Bayar'
          : `Jatuh tempo: ${item.tanggalJatuhTempo || `20 ${NAMA_BULAN[(item.bulan || currentMonth) - 1] || 'Bulan'} ${item.tahun || currentYear}`}`)
    return {
      id: item.id || `act-${idx}`,
      title,
      subInfo,
      amount: item.total || 150000,
      status: statusKey,
      category: 'ipl',
      receiptId: item.noKwitansi || `KW/2026/${String(currentMonth).padStart(2, '0')}/B12-004`,
      date: item.tanggalBayar || new Date(),
      method: item.metode || 'QRIS Dinamis',
      raw: item,
    }
  })

  // Admin IT: Kelola Role & Jabatan Warga State
  const [adminRoleModalOpen, setAdminRoleModalOpen] = useState(false)
  const [adminTargetWarga, setAdminTargetWarga] = useState(null)
  const [adminTargetRole, setAdminTargetRole] = useState('warga')
  const [adminSearchWarga, setAdminSearchWarga] = useState('')
  const [adminSavingRole, setAdminSavingRole] = useState(false)

  const pejabatWargaList = (warga || []).filter((w) => w.jabatan && w.jabatan !== 'warga')

  const filteredWargaForRole = (warga || []).filter((w) => {
    if (!adminSearchWarga.trim()) return true
    const q = adminSearchWarga.toLowerCase().trim()
    return (
      (w.nama || '').toLowerCase().includes(q) ||
      `${w.blok || ''}/${w.noRumah || ''}`.toLowerCase().includes(q) ||
      (w.jabatan || '').toLowerCase().includes(q)
    )
  })

  const handleAdminSaveRole = async () => {
    if (!adminTargetWarga) {
      Alert.alert('Perhatian', 'Silakan pilih warga terlebih dahulu!')
      return
    }
    setAdminSavingRole(true)
    try {
      await updateWarga(adminTargetWarga.id, {
        jabatan: adminTargetRole,
        role: adminTargetRole
      })
      setAdminRoleModalOpen(false)
      Alert.alert(
        'Sukses',
        `Role ${adminTargetWarga.nama} berhasil diubah menjadi ${getJabatanShortLabel(adminTargetRole)}!`
      )
    } catch (e) {
      Alert.alert('Error', 'Gagal memperbarui role warga.')
    } finally {
      setAdminSavingRole(false)
    }
  }

  // Saldo Kas & Transparansi Pengeluaran
  const displayedKas = (scopedKas || []).filter((k) => {
    if (transparansiScope === 'ALL') return true
    if (transparansiScope === 'RT') return k.scope === 'rt' || Boolean(k.rt_id)
    if (transparansiScope === 'RW') return k.scope === 'rw' || (!k.rt_id)
    return true
  })

  const totalPemasukan = displayedKas
    .filter((k) => k.tipe === 'Masuk' || k.tipe === 'Pemasukan')
    .reduce((acc, k) => acc + (k.nominal || 0), 0)
  const totalPengeluaran = displayedKas
    .filter((k) => k.tipe === 'Keluar' || k.tipe === 'Pengeluaran')
    .reduce((acc, k) => acc + (k.nominal || 0), 0)
  const saldoKas = totalPemasukan - totalPengeluaran

  const pengeluaranList = displayedKas.filter((k) => k.tipe === 'Keluar' || k.tipe === 'Pengeluaran')

  const formatRupiah = (num) => 'Rp ' + (num || 0).toLocaleString('id-ID')

  const displayName = (currentUser?.name || 'Warga').replace(/\s*\(Warga.*?\)/i, '')

  return (
    <View style={styles.container}>
      {/* §5.1.2 Top Header */}
      <View style={[styles.v2Header, { paddingTop: insets.top + 6, height: insets.top + 68 }]}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <View style={[
          styles.v2AvatarRing,
          {
            borderColor: isRW
              ? '#C7D2FE'
              : isRT
              ? '#A7F3D0'
              : isBendahara
              ? '#6EE7B7'
              : isPengurus
              ? '#93C5FD'
              : '#FECACA'
          }
        ]}>
          <View style={[
            styles.v2AvatarCircle,
            {
              backgroundColor: isRW
                ? '#4F46E5'
                : isRT
                ? '#059669'
                : isBendahara
                ? '#047857'
                : isPengurus
                ? '#2563EB'
                : colors.primary
            }
          ]}>
            <Text style={styles.v2AvatarText}>
              {isRW ? 'RW' : (isRT ? 'RT' : (isBendahara ? 'BD' : (isPengurus ? 'PG' : displayName.slice(0, 2).toUpperCase())))}
            </Text>
          </View>
        </View>

        <View style={styles.v2GreetingCol}>
          <Text style={styles.v2GreetingCaption}>{getGreeting()}</Text>
          <Text style={styles.v2GreetingName} numberOfLines={1}>{displayName}</Text>
          <Text style={styles.v2GreetingSub} numberOfLines={1} ellipsizeMode="middle">
            {isRW
              ? `Ketua ${currentRW?.name || 'RW 01'} • Seluruh Lingkungan Perumahan`
              : (isRT
                ? `Ketua ${currentRT?.name || 'RT 01'} • ${currentRW?.name || 'RW 01'}`
                : (isBendahara
                  ? `Bendahara Kas Lingkungan • ${currentRT?.name || 'RT 01 / RW 01'}`
                  : (isPengurus
                    ? `Pengurus Lingkungan & Fasum • ${currentRT?.name || 'RT 01 / RW 01'}`
                    : `${unitCodeString} • ${currentRT?.name || 'RT 01 / RW 01'}`)))}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.v2BellBtn}
          onPress={() => navigation.navigate('Events')}
          accessibilityRole="button"
          accessibilityLabel="Notifikasi"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Bell size={22} color={colors.textPrimary} />
          {Boolean(
            latestAnnouncement ||
            ((isRT || isRW || isBendahara) && pendingCekCount > 0) ||
            (isPengurus && ((pengaduan?.filter((p) => p.status !== 'Selesai')?.length || 0) > 0 || (surat?.filter((s) => s.status === 'Menunggu' || s.status === 'Diajukan')?.length || 0) > 0))
          ) && <View style={styles.v2BellDot} />}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 190 }
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshData}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* ===================== DUAL-MODE VIEW SWITCHER BANNER ===================== */}
        {hasDualRole && !isRT && !isRW && (
          <View style={styles.bendaharaStatusCard}>
            <View style={styles.bendaharaStatusTopRow}>
              <View
                style={[
                  styles.bendaharaStatusIconWrap,
                  {
                    backgroundColor: colors.primarySubtle,
                    borderColor: '#FECACA',
                  },
                ]}
              >
                {activeMode === 'jabatan' ? (
                  isBendahara ? (
                    <Wallet size={22} color={colors.primary} strokeWidth={2.4} />
                  ) : isRT ? (
                    <Home size={22} color={colors.primary} strokeWidth={2.4} />
                  ) : isRW ? (
                    <Building2 size={22} color={colors.primary} strokeWidth={2.4} />
                  ) : isPengurus ? (
                    <ShieldCheck size={22} color={colors.primary} strokeWidth={2.4} />
                  ) : (
                    <Shield size={22} color={colors.primary} strokeWidth={2.4} />
                  )
                ) : (
                  <User size={22} color={colors.primary} strokeWidth={2.4} />
                )}
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={styles.bendaharaStatusTitle}>
                    {activeMode === 'jabatan'
                      ? `Dashboard ${jabatanShortLabel || 'Pengurus'}`
                      : 'Tampilan Warga Pribadi'}
                  </Text>
                  <View style={styles.bendaharaActivePill}>
                    <View style={styles.bendaharaActiveDot} />
                    <Text style={styles.bendaharaActivePillText}>Aktif</Text>
                  </View>
                </View>
                <Text style={styles.bendaharaStatusDesc} numberOfLines={2}>
                  {activeMode === 'jabatan'
                    ? isBendahara
                      ? 'Kewenangan pembukuan kas, audit tagihan & verifikasi mutasi bank warga'
                      : isRT
                      ? `Kewenangan administrasi warga, validasi tagihan & kas ${currentRT?.name || 'RT'}`
                      : isRW
                      ? `Koordinasi wilayah rukun warga, pengawasan kas & fasum ${currentRW?.name || 'RW'}`
                      : isPengurus
                      ? 'Layanan fasilitas umum, penanganan aduan & agenda kegiatan warga'
                      : 'Manajemen master data, otoritas hak akses, keamanan & sistem aplikasi'
                    : 'Mode untuk membayar tagihan pribadi & mengakses layanan warga'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.bendaharaSwitchBtn}
              onPress={toggleActiveMode}
              activeOpacity={0.85}
            >
              <Repeat size={15} color={colors.primary} strokeWidth={2.2} />
              <Text style={styles.bendaharaSwitchBtnText}>
                {activeMode === 'jabatan'
                  ? 'Beralih ke Tampilan Warga Pribadi'
                  : `Beralih ke Tampilan ${jabatanShortLabel || 'Jabatan'}`}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ===================== NOTIFIKASI PENGUMUMAN / IURAN BANNER ===================== */}
        {latestAnnouncement && (
          (!isResidentView && !isRT && !isRW) ? (
            <TouchableOpacity
              style={styles.iuranBannerCard}
              onPress={() => navigation.navigate('Events', { eventId: latestAnnouncement.id })}
              activeOpacity={0.85}
            >
              <View style={[
                styles.iuranBannerIconBadge,
                isLatestPaid ? { backgroundColor: '#FEF3C7' } : { backgroundColor: '#EFF6FF' }
              ]}>
                {isLatestPaid ? (
                  <Trophy size={22} color="#D97706" strokeWidth={2} />
                ) : (
                  <Megaphone size={22} color="#2563EB" strokeWidth={2} />
                )}
              </View>

              <View style={styles.iuranBannerTextCol}>
                <View style={styles.iuranBannerTagRow}>
                  <View style={[
                    styles.iuranBannerPulseDot,
                    { backgroundColor: isLatestPaid ? '#D97706' : '#2563EB' }
                  ]} />
                  <Text style={[
                    styles.iuranBannerTagText,
                    { color: isLatestPaid ? '#B45309' : '#1D4ED8' }
                  ]}>
                    {isLatestPaid ? 'IURAN KHUSUS AKTIF' : 'PENGUMUMAN LINGKUNGAN'}
                  </Text>
                </View>
                <Text style={styles.iuranBannerTitleText} numberOfLines={2}>
                  {latestAnnouncement.judul || latestAnnouncement.nama}
                </Text>
                <Text style={styles.iuranBannerSubText} numberOfLines={1}>
                  {isLatestPaid && latestAnnouncement.nominalPerKK
                    ? `Target ${formatRupiah(latestAnnouncement.nominalPerKK)} / KK • Ketuk untuk detail`
                    : 'Ketuk untuk melihat informasi lengkap warga'}
                </Text>
              </View>

              <View style={styles.iuranBannerArrowWrap}>
                <ChevronRight size={18} color="#94A3B8" strokeWidth={2.4} />
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.announcementTicker,
                isLatestPaid ? styles.announcementTickerPaid : styles.announcementTickerInfo
              ]}
              onPress={() => navigation.navigate('Events', { eventId: latestAnnouncement.id })}
              activeOpacity={0.82}
            >
              <View style={[
                styles.tickerBadge,
                isLatestPaid ? { backgroundColor: '#FEF3C7' } : { backgroundColor: '#DBEAFE' }
              ]}>
                {isLatestPaid ? (
                  <Trophy size={13} color="#D97706" />
                ) : (
                  <Megaphone size={13} color="#2563EB" />
                )}
                <Text style={[
                  styles.tickerTagText,
                  isLatestPaid ? { color: '#B45309' } : { color: '#1D4ED8' }
                ]}>
                  {isLatestPaid ? 'IURAN' : 'INFO'}
                </Text>
              </View>
              <Text style={styles.tickerTitleText} numberOfLines={1}>
                {latestAnnouncement.judul || latestAnnouncement.nama}
              </Text>
              <ChevronRight size={14} color="#94A3B8" />
            </TouchableOpacity>
          )
        )}

        {/* ===================== §4.1 VIRTUAL RESIDENT CARD ===================== */}
        {isResidentView && (
          <View style={{ marginBottom: 20 }}>
            <VirtualResidentCard
              status={residentCardStatus}
              residentName={displayName}
              unitCode={unitCodeString}
              periodLabel={periodLabelString}
              amount={residentBillAmount}
              overdueDays={overdueDaysCount}
              billCount={unpaidBillsList.length}
              onPressCard={() => {
                if (unpaidBillsList.length > 1) {
                  navigation.navigate('TagihanTab')
                } else if (tagihanBulanIni) {
                  navigation.navigate('DetailTagihan', { tagihan: tagihanBulanIni })
                } else {
                  navigation.navigate('TagihanTab')
                }
              }}
              onPressAction={() => {
                if (residentCardStatus === 'paid') {
                  setSelectedReceipt({
                    receiptId: tagihanBulanIni?.noKwitansi || `KW/2026/${String(currentMonth).padStart(2, '0')}/B12-004`,
                    amount: tagihanBulanIni?.total || residentBillAmount || 150000,
                    paidAt: tagihanBulanIni?.tanggalBayar || new Date(),
                    residentName: displayName,
                    unitCode: unitCodeString,
                    paymentMethod: tagihanBulanIni?.metode || 'QRIS Dinamis',
                    recipientName: tagihanBulanIni?.pembayaran_kepada || (currentRT?.name ? `Kas Lingkungan ${currentRT.name}` : 'Kas Lingkungan RT 01'),
                    status: 'paid',
                  })
                } else if (unpaidBillsList.length > 1) {
                  navigation.navigate('TagihanTab')
                } else if (tagihanBulanIni) {
                  navigation.navigate('DetailTagihan', { tagihan: tagihanBulanIni })
                } else {
                  navigation.navigate('TagihanTab')
                }
              }}
            />
          </View>
        )}

        {/* ===================== §4.2 QUICK ACTION GRID ===================== */}
        {isResidentView && (
          <View style={{ marginBottom: 24 }}>
            <View style={styles.v2SectionHeader}>
              <Text style={styles.v2SectionTitle}>Aksi Cepat</Text>
            </View>
            <QuickActionGrid
              badges={{
                lapor: aduanUnreadCount > 0 ? aduanUnreadCount : undefined,
                surat: suratUnreadCount > 0 ? suratUnreadCount : undefined,
              }}
              onActionPress={(actionId) => {
                switch (actionId) {
                  case 'bayar':
                    if (tagihanBulanIni) {
                      navigation.navigate('DetailTagihan', { tagihan: tagihanBulanIni });
                    } else {
                      navigation.navigate('TagihanTab');
                    }
                    break;
                  case 'lapor':
                    navigation.navigate('Pengaduan');
                    break;
                  case 'surat':
                    navigation.navigate('Surat');
                    break;
                  case 'satpam':
                    navigation.navigate('JadwalSatpam');
                    break;
                  case 'acara':
                    navigation.navigate('Events');
                    break;
                  case 'kas':
                    navigation.navigate('Kas');
                    break;
                  case 'denah':
                    navigation.navigate('PetaWarga');
                    break;
                  case 'darurat':
                    navigation.navigate('KontakDarurat');
                    break;
                  default:
                    break;
                }
              }}
            />
          </View>
        )}

        {/* ===================== §5.1.3 KAS WIDGET ===================== */}
        {isResidentView && (
          <View style={{ marginBottom: 24 }}>
            <KasWidget
              balance={saldoKas || 48520000}
              incomeMonth={totalPemasukan || 6120000}
              expenseMonth={totalPengeluaran || 1080000}
              onPress={() => navigation.navigate('Kas')}
            />
          </View>
        )}

        {/* ===================== §4.4 AKTIVITAS TERBARU ===================== */}
        {isResidentView && (
          <View style={{ marginBottom: 24 }}>
            <View style={styles.v2SectionHeaderWithAction}>
              <Text style={styles.v2SectionTitle}>Aktivitas Terbaru</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('TagihanTab')}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={styles.v2SeeAllBtn}
              >
                <Text style={styles.v2SeeAllText}>Lihat Semua</Text>
              </TouchableOpacity>
            </View>

            {recentActivities.length === 0 ? (
              <AppEmptyState
                type="no_history"
                title="Belum Ada Riwayat"
                description="Transaksi Anda akan muncul di sini."
              />
            ) : (
              recentActivities.map((item) => (
                <TransactionListItem
                  key={item.id}
                  title={item.title}
                  subInfo={item.subInfo}
                  amount={item.amount}
                  status={item.status}
                  category={item.category}
                  onPress={() => {
                    if (item.status === 'paid') {
                      setSelectedReceipt({
                        receiptId: item.receiptId,
                        amount: item.amount,
                        paidAt: item.date,
                        residentName: displayName,
                        unitCode: unitCodeString,
                        paymentMethod: item.method,
                        status: 'paid',
                      })
                    } else {
                      navigation.navigate('DetailTagihan', { tagihan: item.raw })
                    }
                  }}
                />
              ))
            )}
          </View>
        )}

        {/* ===================== BENDAHARA: KOKPIT KEUANGAN (REDESIGNED) ===================== */}
        {!isResidentView && isBendahara && (
          <View style={{ marginBottom: 12 }}>
            {/* 1. KARTU UTAMA: COCKPIT EKSEKUTIF BENDAHARA */}
            <View style={{ marginBottom: 18 }}>
              <BendaharaHeroCard
                saldoKas={saldoKas}
                totalLunas={totalLunasNominal}
                totalBelum={totalBelumNominal}
                countLunas={lunasTagihan.length}
                countBelum={belumLunasTagihan.length}
                totalWarga={scopedWarga.length}
                totalPemasukan={totalPemasukan}
                totalPengeluaran={totalPengeluaran}
                periodLabel={`${NAMA_BULAN[currentMonth - 1]} ${currentYear}`}
                onPressManageBills={() => navigation.navigate('TagihanTab')}
                onPressKas={() => navigation.navigate('Kas')}
              />
            </View>

            {/* 2. PERINGATAN VERIFIKASI (JIKA ADA PEMBAYARAN BUTUH ACC) */}
            {pendingCekCount > 0 && (
              <TouchableOpacity
                style={styles.rtAlertCard}
                onPress={() => navigation.navigate('TagihanTab')}
                activeOpacity={0.88}
              >
                <View style={styles.rtAlertIconWrap}>
                  <AlertCircle size={20} color="#D97706" strokeWidth={2.4} />
                  <View style={styles.rtAlertDot} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.rtAlertTitle}>
                      {pendingCekCount} Pembayaran Butuh Verifikasi
                    </Text>
                    <View style={styles.rtAlertPill}>
                      <Text style={styles.rtAlertPillText}>BARU</Text>
                    </View>
                  </View>
                  <Text style={styles.rtAlertDesc} numberOfLines={1}>
                    Ketuk untuk periksa bukti transfer & mutasi bank warga
                  </Text>
                </View>
                <View style={styles.rtAlertBtn}>
                  <Text style={styles.rtAlertBtnText}>Periksa</Text>
                  <ChevronRight size={14} color="#B45309" strokeWidth={2.2} />
                </View>
              </TouchableOpacity>
            )}

            {/* 3. AKSI CEPAT BENDAHARA (GRID BERSIH & PRESISI SEPERTI WARGA) */}
            <View style={{ marginBottom: 24 }}>
              <View style={styles.v2SectionHeader}>
                <Text style={styles.v2SectionTitle}>Aksi Cepat Bendahara</Text>
              </View>
              <QuickActionGrid
                actions={[
                  {
                    id: 'kas',
                    label: 'Buku Kas',
                    iconName: 'Wallet',
                    bg: '#ECFDF5',
                    iconColor: '#059669',
                  },
                  {
                    id: 'verifikasi',
                    label: 'Verifikasi IPL',
                    iconName: 'Receipt',
                    bg: '#FEF3C7',
                    iconColor: '#D97706',
                    badgeCount: pendingCekCount > 0 ? pendingCekCount : undefined,
                  },
                  {
                    id: 'tagihan',
                    label: 'Tagihan Warga',
                    iconName: 'FileCheck',
                    bg: '#EFF6FF',
                    iconColor: '#2563EB',
                  },
                  {
                    id: 'iuran',
                    label: 'Iuran Kegiatan',
                    iconName: 'PartyPopper',
                    bg: '#FFF7ED',
                    iconColor: '#EA580C',
                  },
                  {
                    id: 'warga',
                    label: 'Data Warga',
                    iconName: 'Users',
                    bg: '#F0FDFA',
                    iconColor: '#0D9488',
                  },
                  {
                    id: 'lapor',
                    label: 'Aduan Warga',
                    iconName: 'MessageSquareWarning',
                    bg: '#FFFBEB',
                    iconColor: '#D97706',
                    badgeCount: aduanUnreadCount > 0 ? aduanUnreadCount : undefined,
                  },
                  {
                    id: 'surat',
                    label: 'Surat RT',
                    iconName: 'FileText',
                    bg: '#EEF2FF',
                    iconColor: '#4F46E5',
                    badgeCount: suratUnreadCount > 0 ? suratUnreadCount : undefined,
                  },
                  {
                    id: 'darurat',
                    label: 'Kontak Darurat',
                    iconName: 'PhoneCall',
                    bg: '#FFF1F2',
                    iconColor: '#E11D48',
                  },
                ]}
                onActionPress={(actionId) => {
                  switch (actionId) {
                    case 'kas':
                      navigation.navigate('Kas');
                      break;
                    case 'verifikasi':
                    case 'tagihan':
                      navigation.navigate('TagihanTab');
                      break;
                    case 'iuran':
                      navigation.navigate('Events');
                      break;
                    case 'warga':
                      navigation.navigate('WargaList');
                      break;
                    case 'lapor':
                      navigation.navigate('Pengaduan');
                      break;
                    case 'surat':
                      navigation.navigate('Surat');
                      break;
                    case 'darurat':
                      navigation.navigate('KontakDarurat');
                      break;
                  }
                }}
              />
            </View>

            {/* 4. KAS WIDGET */}
            <View style={{ marginBottom: 24 }}>
              <View style={styles.v2SectionHeaderWithAction}>
                <Text style={styles.v2SectionTitle}>Kas Lingkungan</Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('Kas')}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={styles.v2SeeAllBtn}
                >
                  <Text style={styles.v2SeeAllText}>Buka Buku Kas</Text>
                </TouchableOpacity>
              </View>
              <KasWidget
                balance={saldoKas || 48520000}
                incomeMonth={totalPemasukan || 6120000}
                expenseMonth={totalPengeluaran || 1080000}
                onPress={() => navigation.navigate('Kas')}
              />
            </View>

            {/* 5. AKTIVITAS KEUANGAN TERBARU */}
            <View style={{ marginBottom: 24 }}>
              <View style={styles.v2SectionHeaderWithAction}>
                <Text style={styles.v2SectionTitle}>Aktivitas Keuangan Terbaru</Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('Kas')}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  style={styles.v2SeeAllBtn}
                >
                  <Text style={styles.v2SeeAllText}>Lihat Semua</Text>
                </TouchableOpacity>
              </View>

              {displayedKas.length === 0 ? (
                <AppEmptyState
                  type="no_history"
                  title="Belum Ada Transaksi Kas"
                  description="Catatan arus kas lingkungan akan tampil di sini."
                />
              ) : (
                <View style={{ gap: 8 }}>
                  {displayedKas.slice(0, 4).map((k) => {
                    const isMasuk = k.tipe === 'Masuk' || k.tipe === 'Pemasukan'
                    return (
                      <TransactionListItem
                        key={k.id || `kas-${Math.random()}`}
                        title={k.keterangan || (isMasuk ? 'Pemasukan Kas' : 'Pengeluaran Kas')}
                        subInfo={`${k.pj ? `PJ: ${k.pj} • ` : ''}${k.tanggal || 'Bulan Ini'}`}
                        amount={k.nominal || 0}
                        status={isMasuk ? 'paid' : 'unpaid'}
                        category="kas"
                        onPress={() => {
                          setSelectedKasDetail(k)
                          setKasDetailModalOpen(true)
                        }}
                      />
                    )
                  })}
                </View>
              )}
            </View>
          </View>
        )}

        {/* ===================== PENGURUS: KOKPIT FASUM & LAYANAN (REDESIGNED) ===================== */}
        {!isResidentView && isPengurus && (
          <View style={{ marginBottom: 12 }}>
            {/* 1. KARTU UTAMA: COCKPIT EKSEKUTIF PENGURUS */}
            <View style={{ marginBottom: 18 }}>
              <PengurusHeroCard
                totalAduan={pengaduan?.length || 0}
                pendingAduanCount={pengaduan?.filter((p) => p.status !== 'Selesai')?.length || 0}
                totalSurat={surat?.length || 0}
                pendingSuratCount={surat?.filter((s) => s.status === 'Menunggu' || s.status === 'Diajukan')?.length || 0}
                totalWarga={scopedWarga.length}
                periodLabel={`${NAMA_BULAN[currentMonth - 1]} ${currentYear}`}
                onPressPengaduan={() => navigation.navigate('Pengaduan')}
                onPressSurat={() => navigation.navigate('Surat')}
              />
            </View>

            {/* 2. PERINGATAN LAYANAN (JIKA ADA ADUAN / SURAT BARU) */}
            {((pengaduan?.filter((p) => p.status !== 'Selesai')?.length || 0) > 0 || (surat?.filter((s) => s.status === 'Menunggu' || s.status === 'Diajukan')?.length || 0) > 0) && (
              <TouchableOpacity
                style={styles.rtAlertCard}
                onPress={() => {
                  const hasAduan = (pengaduan?.filter((p) => p.status !== 'Selesai')?.length || 0) > 0
                  navigation.navigate(hasAduan ? 'Pengaduan' : 'Surat')
                }}
                activeOpacity={0.88}
              >
                <View style={[styles.rtAlertIconWrap, { backgroundColor: '#EFF6FF' }]}>
                  <AlertCircle size={20} color="#2563EB" strokeWidth={2.4} />
                  <View style={[styles.rtAlertDot, { backgroundColor: '#2563EB' }]} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.rtAlertTitle}>
                      {pengaduan?.filter((p) => p.status !== 'Selesai')?.length || 0} Aduan & {surat?.filter((s) => s.status === 'Menunggu' || s.status === 'Diajukan')?.length || 0} Surat Baru
                    </Text>
                    <View style={[styles.rtAlertPill, { backgroundColor: '#DBEAFE' }]}>
                      <Text style={[styles.rtAlertPillText, { color: '#1D4ED8' }]}>TINDAKAN</Text>
                    </View>
                  </View>
                  <Text style={styles.rtAlertDesc} numberOfLines={1}>
                    Ketuk untuk menindaklanjuti kendala fasum dan surat warga
                  </Text>
                </View>
                <View style={[styles.rtAlertBtn, { backgroundColor: '#EFF6FF' }]}>
                  <Text style={[styles.rtAlertBtnText, { color: '#1D4ED8' }]}>Proses</Text>
                  <ChevronRight size={14} color="#1D4ED8" strokeWidth={2.2} />
                </View>
              </TouchableOpacity>
            )}

            {/* 3. AKSI CEPAT PENGURUS (GRID BERSIH & PRESISI SEPERTI WARGA) */}
            <View style={{ marginBottom: 24 }}>
              <View style={styles.v2SectionHeader}>
                <Text style={styles.v2SectionTitle}>Aksi Cepat Pengurus</Text>
              </View>
              <QuickActionGrid
                actions={[
                  {
                    id: 'lapor',
                    label: 'Aduan Fasum',
                    iconName: 'MessageSquareWarning',
                    bg: '#FEE2E2',
                    iconColor: '#DC2626',
                    badgeCount: (pengaduan?.filter((p) => p.status !== 'Selesai')?.length || 0) > 0 ? pengaduan.filter((p) => p.status !== 'Selesai').length : undefined,
                  },
                  {
                    id: 'surat',
                    label: 'Surat Warga',
                    iconName: 'FileCheck',
                    bg: '#EFF6FF',
                    iconColor: '#2563EB',
                    badgeCount: (surat?.filter((s) => s.status === 'Menunggu' || s.status === 'Diajukan')?.length || 0) > 0 ? surat.filter((s) => s.status === 'Menunggu' || s.status === 'Diajukan').length : undefined,
                  },
                  {
                    id: 'satpam',
                    label: 'Jadwal Satpam',
                    iconName: 'ShieldCheck',
                    bg: '#ECFDF5',
                    iconColor: '#059669',
                  },
                  {
                    id: 'denah',
                    label: 'Peta Fasum',
                    iconName: 'Compass',
                    bg: '#F0F9FF',
                    iconColor: '#0284C7',
                  },
                  {
                    id: 'acara',
                    label: 'Acara Warga',
                    iconName: 'PartyPopper',
                    bg: '#FFF7ED',
                    iconColor: '#EA580C',
                  },
                  {
                    id: 'kas',
                    label: 'Buku Kas',
                    iconName: 'Wallet',
                    bg: '#F0FDFA',
                    iconColor: '#0D9488',
                  },
                  {
                    id: 'warga',
                    label: 'Data Warga',
                    iconName: 'Users',
                    bg: '#EEF2FF',
                    iconColor: '#4F46E5',
                  },
                  {
                    id: 'darurat',
                    label: 'Kontak Darurat',
                    iconName: 'PhoneCall',
                    bg: '#FFF1F2',
                    iconColor: '#E11D48',
                  },
                ]}
                onActionPress={(actionId) => {
                  switch (actionId) {
                    case 'lapor':
                      navigation.navigate('Pengaduan');
                      break;
                    case 'surat':
                      navigation.navigate('Surat');
                      break;
                    case 'satpam':
                      navigation.navigate('JadwalSatpam');
                      break;
                    case 'denah':
                      navigation.navigate('PetaWarga');
                      break;
                    case 'acara':
                      navigation.navigate('Events');
                      break;
                    case 'kas':
                      navigation.navigate('Kas');
                      break;
                    case 'warga':
                      navigation.navigate('WargaList');
                      break;
                    case 'darurat':
                      navigation.navigate('KontakDarurat');
                      break;
                  }
                }}
              />
            </View>

            {/* 4. KAS WIDGET */}
            <View style={{ marginBottom: 24 }}>
              <View style={styles.v2SectionHeaderWithAction}>
                <Text style={styles.v2SectionTitle}>Kas Lingkungan</Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('Kas')}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={styles.v2SeeAllBtn}
                >
                  <Text style={styles.v2SeeAllText}>Buka Buku Kas</Text>
                </TouchableOpacity>
              </View>
              <KasWidget
                balance={saldoKas || 48520000}
                incomeMonth={totalPemasukan || 6120000}
                expenseMonth={totalPengeluaran || 1080000}
                onPress={() => navigation.navigate('Kas')}
              />
            </View>

            {/* 5. ADUAN & KEGIATAN TERKINI */}
            <View style={{ marginBottom: 24 }}>
              <View style={styles.v2SectionHeaderWithAction}>
                <Text style={styles.v2SectionTitle}>Aduan & Kendala Terkini</Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('Pengaduan')}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  style={styles.v2SeeAllBtn}
                >
                  <Text style={styles.v2SeeAllText}>Lihat Semua</Text>
                </TouchableOpacity>
              </View>

              {(pengaduan || []).length === 0 ? (
                <AppEmptyState
                  type="no_history"
                  title="Belum Ada Aduan Warga"
                  description="Laporan fasilitas dan aspirasi warga akan muncul di sini."
                />
              ) : (
                <View style={{ gap: 8 }}>
                  {(pengaduan || []).slice(0, 3).map((p) => (
                    <AppCard
                      key={p.id || `aduan-${Math.random()}`}
                      style={styles.eventCard}
                      onPress={() => navigation.navigate('Pengaduan')}
                    >
                      <View style={styles.eventHeader}>
                        <Text style={styles.eventTitle} numberOfLines={1}>{p.judul || p.kategori || 'Aduan Warga'}</Text>
                        <AppBadge status={p.status} label={p.status} />
                      </View>
                      <Text style={styles.eventDesc} numberOfLines={2}>
                        {p.deskripsi || p.isi || 'Laporan kendala fasilitas umum.'}
                      </Text>
                    </AppCard>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}

        {/* ===================== KETUA RT: ADMINISTRASI RT (REDESIGNED) ===================== */}
        {isRT && (
          <View style={{ marginBottom: 12 }}>
            {/* 1. KARTU UTAMA: COCKPIT EKSEKUTIF RT */}
            <View style={{ marginBottom: 18 }}>
              <RTHeroCard
                rtName={currentRT?.name || 'RT 01'}
                rwName={currentRW?.name || 'RW 01'}
                totalLunas={totalLunasNominal}
                totalBelum={totalBelumNominal}
                countLunas={lunasTagihan.length}
                countBelum={belumLunasTagihan.length}
                totalWarga={scopedWarga.length}
                saldoKas={saldoKas}
                periodLabel={`${NAMA_BULAN[currentMonth - 1]} ${currentYear}`}
                onPressManageBills={() => navigation.navigate('TagihanTab')}
                onPressKas={() => navigation.navigate('Kas')}
              />
            </View>

            {/* 2. PERINGATAN VERIFIKASI (JIKA ADA PEMBAYARAN BUTUH ACC) */}
            {pendingCekCount > 0 && (
              <TouchableOpacity
                style={styles.rtAlertCard}
                onPress={() => navigation.navigate('TagihanTab')}
                activeOpacity={0.88}
              >
                <View style={styles.rtAlertIconWrap}>
                  <AlertCircle size={20} color="#D97706" strokeWidth={2.4} />
                  <View style={styles.rtAlertDot} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.rtAlertTitle}>
                      {pendingCekCount} Pembayaran Butuh Verifikasi
                    </Text>
                    <View style={styles.rtAlertPill}>
                      <Text style={styles.rtAlertPillText}>BARU</Text>
                    </View>
                  </View>
                  <Text style={styles.rtAlertDesc} numberOfLines={1}>
                    Ketuk untuk periksa bukti transfer & mutasi bank warga
                  </Text>
                </View>
                <View style={styles.rtAlertBtn}>
                  <Text style={styles.rtAlertBtnText}>Periksa</Text>
                  <ChevronRight size={14} color="#B45309" strokeWidth={2.2} />
                </View>
              </TouchableOpacity>
            )}

            {/* 3. AKSI CEPAT RT (GRID BERSIH & PRESISI SEPERTI WARGA) */}
            <View style={{ marginBottom: 24 }}>
              <View style={styles.v2SectionHeader}>
                <Text style={styles.v2SectionTitle}>Aksi Cepat RT</Text>
              </View>
              <QuickActionGrid
                actions={[
                  {
                    id: 'warga',
                    label: 'Data Warga',
                    iconName: 'Users',
                    bg: '#ECFDF5',
                    iconColor: '#059669',
                  },
                  {
                    id: 'tagihan',
                    label: 'Tagihan RT',
                    iconName: 'Receipt',
                    bg: '#EFF6FF',
                    iconColor: '#2563EB',
                    badgeCount: pendingCekCount > 0 ? pendingCekCount : undefined,
                  },
                  {
                    id: 'kas',
                    label: 'Buku Kas',
                    iconName: 'Wallet',
                    bg: '#F0FDFA',
                    iconColor: '#0D9488',
                  },
                  {
                    id: 'denah',
                    label: 'Peta Wilayah',
                    iconName: 'Compass',
                    bg: '#F0F9FF',
                    iconColor: '#0284C7',
                  },
                  {
                    id: 'surat',
                    label: 'Surat RT',
                    iconName: 'FileCheck',
                    bg: '#EEF2FF',
                    iconColor: '#4F46E5',
                    badgeCount: suratUnreadCount > 0 ? suratUnreadCount : undefined,
                  },
                  {
                    id: 'lapor',
                    label: 'Aduan Warga',
                    iconName: 'MessageSquareWarning',
                    bg: '#FFFBEB',
                    iconColor: '#D97706',
                    badgeCount: aduanUnreadCount > 0 ? aduanUnreadCount : undefined,
                  },
                  {
                    id: 'acara',
                    label: 'Kegiatan/Iuran',
                    iconName: 'PartyPopper',
                    bg: '#FFF7ED',
                    iconColor: '#EA580C',
                  },
                  {
                    id: 'darurat',
                    label: 'Kontak Darurat',
                    iconName: 'PhoneCall',
                    bg: '#FFF1F2',
                    iconColor: '#E11D48',
                  },
                ]}
                onActionPress={(actionId) => {
                  switch (actionId) {
                    case 'warga':
                      navigation.navigate('WargaList')
                      break
                    case 'tagihan':
                      navigation.navigate('TagihanTab')
                      break
                    case 'kas':
                      navigation.navigate('Kas')
                      break
                    case 'denah':
                      navigation.navigate('PetaWarga')
                      break
                    case 'surat':
                      navigation.navigate('Surat')
                      break
                    case 'lapor':
                      navigation.navigate('Pengaduan')
                      break
                    case 'acara':
                      navigation.navigate('Events')
                      break
                    case 'darurat':
                      navigation.navigate('KontakDarurat')
                      break
                    default:
                      break
                  }
                }}
              />
            </View>

            {/* 4. BUKU KAS RT (KAS WIDGET) */}
            <View style={{ marginBottom: 24 }}>
              <View style={styles.v2SectionHeaderWithAction}>
                <Text style={styles.v2SectionTitle}>Kas {currentRT?.name || 'RT 01'}</Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('Kas')}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  style={styles.v2SeeAllBtn}
                >
                  <Text style={styles.v2SeeAllText}>Buka Buku Kas</Text>
                </TouchableOpacity>
              </View>
              <KasWidget
                balance={saldoKas}
                incomeMonth={totalPemasukan}
                expenseMonth={totalPengeluaran}
                periodLabel={`${NAMA_BULAN[currentMonth - 1]} ${currentYear}`}
                onPress={() => navigation.navigate('Kas')}
              />
            </View>

            {/* 5. AKTIVITAS & TRANSAKSI WARGA TERBARU */}
            <View style={{ marginBottom: 24 }}>
              <View style={styles.v2SectionHeaderWithAction}>
                <Text style={styles.v2SectionTitle}>Transaksi Warga Terbaru</Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('TagihanTab')}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  style={styles.v2SeeAllBtn}
                >
                  <Text style={styles.v2SeeAllText}>Lihat Semua</Text>
                </TouchableOpacity>
              </View>

              {scopedTagihan.length === 0 ? (
                <AppEmptyState
                  variant="no_history"
                  title="Belum Ada Transaksi"
                  subtitle="Tagihan warga akan muncul di sini setelah diterbitkan."
                />
              ) : (
                <View style={{ gap: 10 }}>
                  {scopedTagihan.slice(0, 4).map((t) => {
                    const targetW = (warga || []).find((w) => w.id === t.wargaId)
                    const titleName = targetW?.nama || t.namaWarga || 'Warga RT'
                    const unitInfo = `Blok ${targetW?.blok || t.blok || '-'}/${targetW?.noRumah || t.noRumah || '-'}`
                    const bulanLabel = NAMA_BULAN[(t.bulan || 1) - 1] || `Bulan ${t.bulan}`
                    const tStatus = t.status === 'Lunas' ? 'paid' : (t.status === 'Menunggu Verifikasi' ? 'pending' : 'unpaid')

                    return (
                      <TransactionListItem
                        key={t.id || `rt-tag-${t.wargaId}-${t.bulan}`}
                        title={titleName}
                        subInfo={`${unitInfo} • Iuran ${bulanLabel} ${t.tahun}`}
                        amount={t.total || 0}
                        status={tStatus}
                        category="ipl"
                        onPress={() => navigation.navigate('DetailTagihan', { tagihan: t })}
                      />
                    )
                  })}
                </View>
              )}
            </View>
          </View>
        )}

        {/* ===================== KETUA RW: KOORDINASI WILAYAH (REDESIGNED) ===================== */}
        {isRW && (
          <View style={{ marginBottom: 12 }}>
            {/* 1. KARTU UTAMA: COCKPIT EKSEKUTIF RW */}
            <View style={{ marginBottom: 18 }}>
              <RWHeroCard
                rwName={currentRW?.name || 'RW 01'}
                totalWarga={scopedWarga?.length || 0}
                totalRT={scopedRts?.length || rts?.length || 3}
                saldoKas={saldoKas}
                totalPemasukan={totalPemasukan}
                totalPengeluaran={totalPengeluaran}
                periodLabel={`${NAMA_BULAN[currentMonth - 1]} ${currentYear}`}
                onPressKas={() => navigation.navigate('Kas')}
                onPressWarga={() => navigation.navigate('WargaList')}
              />
            </View>

            {/* 2. PERINGATAN VERIFIKASI (JIKA ADA PEMBAYARAN BUTUH ACC) */}
            {pendingCekCount > 0 && (
              <TouchableOpacity
                style={styles.rtAlertCard}
                onPress={() => navigation.navigate('TagihanTab')}
                activeOpacity={0.88}
              >
                <View style={styles.rtAlertIconWrap}>
                  <AlertCircle size={20} color="#D97706" strokeWidth={2.4} />
                  <View style={styles.rtAlertDot} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.rtAlertTitle}>
                      {pendingCekCount} Pembayaran Butuh Verifikasi
                    </Text>
                    <View style={styles.rtAlertPill}>
                      <Text style={styles.rtAlertPillText}>BARU</Text>
                    </View>
                  </View>
                  <Text style={styles.rtAlertDesc} numberOfLines={1}>
                    Ketuk untuk meninjau mutasi rekening & bukti transfer warga
                  </Text>
                </View>
                <View style={styles.rtAlertBtn}>
                  <Text style={styles.rtAlertBtnText}>Periksa</Text>
                  <ChevronRight size={14} color="#B45309" strokeWidth={2.2} />
                </View>
              </TouchableOpacity>
            )}

            {/* 3. AKSI KOORDINASI RW (GRID BERSIH & PRESISI 4 KOLOM) */}
            <View style={{ marginBottom: 24 }}>
              <View style={styles.v2SectionHeader}>
                <Text style={styles.v2SectionTitle}>Aksi Koordinasi RW</Text>
              </View>
              <QuickActionGrid
                actions={[
                  {
                    id: 'warga',
                    label: 'Warga RW',
                    iconName: 'Users',
                    bg: '#FEF2F2',
                    iconColor: '#DC2626',
                  },
                  {
                    id: 'tagihan',
                    label: 'Tagihan RW',
                    iconName: 'Receipt',
                    bg: '#EFF6FF',
                    iconColor: '#2563EB',
                    badgeCount: pendingCekCount > 0 ? pendingCekCount : undefined,
                  },
                  {
                    id: 'kas',
                    label: 'Kas Wilayah',
                    iconName: 'Wallet',
                    bg: '#ECFDF5',
                    iconColor: '#059669',
                  },
                  {
                    id: 'denah',
                    label: 'Peta Wilayah',
                    iconName: 'Compass',
                    bg: '#F0F9FF',
                    iconColor: '#0284C7',
                  },
                  {
                    id: 'surat',
                    label: 'Layanan Surat',
                    iconName: 'FileCheck',
                    bg: '#EEF2FF',
                    iconColor: '#4F46E5',
                    badgeCount: suratUnreadCount > 0 ? suratUnreadCount : undefined,
                  },
                  {
                    id: 'lapor',
                    label: 'Aduan Warga',
                    iconName: 'MessageSquareWarning',
                    bg: '#FFFBEB',
                    iconColor: '#D97706',
                    badgeCount: aduanUnreadCount > 0 ? aduanUnreadCount : undefined,
                  },
                  {
                    id: 'acara',
                    label: 'Agenda RW',
                    iconName: 'PartyPopper',
                    bg: '#FFF7ED',
                    iconColor: '#EA580C',
                  },
                  {
                    id: 'darurat',
                    label: 'Kontak Darurat',
                    iconName: 'PhoneCall',
                    bg: '#FFF1F2',
                    iconColor: '#E11D48',
                  },
                ]}
                onActionPress={(actionId) => {
                  switch (actionId) {
                    case 'warga':
                      navigation.navigate('WargaList')
                      break
                    case 'tagihan':
                      navigation.navigate('TagihanTab')
                      break
                    case 'kas':
                      navigation.navigate('Kas')
                      break
                    case 'denah':
                      navigation.navigate('PetaWarga')
                      break
                    case 'surat':
                      navigation.navigate('Surat')
                      break
                    case 'lapor':
                      navigation.navigate('Pengaduan')
                      break
                    case 'acara':
                      navigation.navigate('Events')
                      break
                    case 'darurat':
                      navigation.navigate('KontakDarurat')
                      break
                    default:
                      break
                  }
                }}
              />
            </View>

            {/* 4. BUKU KAS WILAYAH RW (KAS WIDGET) */}
            <View style={{ marginBottom: 24 }}>
              <View style={styles.v2SectionHeaderWithAction}>
                <Text style={styles.v2SectionTitle}>Kas Wilayah {currentRW?.name || 'RW 01'}</Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('Kas')}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  style={styles.v2SeeAllBtn}
                >
                  <Text style={styles.v2SeeAllText}>Buka Buku Kas</Text>
                </TouchableOpacity>
              </View>
              <KasWidget
                balance={saldoKas}
                incomeMonth={totalPemasukan}
                expenseMonth={totalPengeluaran}
                periodLabel={`${NAMA_BULAN[currentMonth - 1]} ${currentYear}`}
                onPress={() => navigation.navigate('Kas')}
              />
            </View>

            {/* 5. AKTIVITAS & TRANSAKSI TERBARU DI RW */}
            <View style={{ marginBottom: 24 }}>
              <View style={styles.v2SectionHeaderWithAction}>
                <Text style={styles.v2SectionTitle}>Transaksi Terkini Seluruh Wilayah</Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('TagihanTab')}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  style={styles.v2SeeAllBtn}
                >
                  <Text style={styles.v2SeeAllText}>Lihat Semua</Text>
                </TouchableOpacity>
              </View>

              {scopedTagihan.length === 0 ? (
                <AppEmptyState
                  variant="no_history"
                  title="Belum Ada Transaksi"
                  subtitle="Tagihan lingkungan akan tampil di sini saat diterbitkan."
                />
              ) : (
                <View style={{ gap: 10 }}>
                  {scopedTagihan.slice(0, 4).map((t) => {
                    const targetW = (warga || []).find((w) => w.id === t.wargaId)
                    const titleName = targetW?.nama || t.namaWarga || 'Warga RW'
                    const unitInfo = `Blok ${targetW?.blok || t.blok || '-'}/${targetW?.noRumah || t.noRumah || '-'}`
                    const bulanLabel = NAMA_BULAN[(t.bulan || 1) - 1] || `Bulan ${t.bulan}`
                    const tStatus = t.status === 'Lunas' ? 'paid' : (t.status === 'Menunggu Verifikasi' ? 'pending' : 'unpaid')
                    const rtOwner = targetW?.rt_id ? `RT ${targetW.rt_id.replace(/\D/g, '') || targetW.rt_id}` : (t.pembayaran_kepada || 'RW')

                    return (
                      <TransactionListItem
                        key={t.id || `rw-tag-${t.wargaId}-${t.bulan}`}
                        title={titleName}
                        subInfo={`${unitInfo} • ${rtOwner} • Iuran ${bulanLabel} ${t.tahun}`}
                        amount={t.total || 0}
                        status={tStatus}
                        category="ipl"
                        onPress={() => navigation.navigate('DetailTagihan', { tagihan: t })}
                      />
                    )
                  })}
                </View>
              )}
            </View>
          </View>
        )}

        {/* ===================== ADMIN IT: SUPER ADMINISTRATOR ===================== */}
        {isAdmin && (
          <View style={styles.bendaharaFinancialContainer}>
            {/* 1. KARTU UTAMA: PORTAL SUPER ADMINISTRATOR */}
            <View style={styles.bendaharaMainFinanceCard}>
              <View style={styles.bendaharaFinanceHeaderRow}>
                <View style={[styles.bendaharaFinanceIconCircle, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
                  <Shield size={22} color="#047857" strokeWidth={2.2} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[styles.bendaharaFinancePreTitle, { color: '#047857' }]}>PORTAL SUPER ADMINISTRATOR (IT)</Text>
                  <Text style={styles.bendaharaFinanceMainTitle}>Manajemen Sistem & Keamanan</Text>
                </View>
                <View style={[styles.bendaharaRoleBadge, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
                  <Text style={[styles.bendaharaRoleBadgeText, { color: '#047857' }]}>Admin IT</Text>
                </View>
              </View>

              {/* Stack Stat Cards */}
              <View style={styles.bendaharaStatsStack}>
                {/* Stat 1: Database Pengguna */}
                <View style={[styles.bendaharaStatCardLunas, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
                  <View style={styles.bendaharaStatCardTopRow}>
                    <View style={styles.bendaharaStatIconLabelWrap}>
                      <View style={[styles.bendaharaMiniStatIconCircle, { backgroundColor: '#DCFCE7' }]}>
                        <Users size={16} color="#047857" strokeWidth={2.5} />
                      </View>
                      <Text style={[styles.bendaharaStatLabelGreen, { color: '#047857' }]}>Database Pengguna Terdaftar</Text>
                    </View>
                    <View style={[styles.bendaharaStatWargaPillGreen, { backgroundColor: '#DCFCE7' }]}>
                      <Text style={[styles.bendaharaStatWargaTextGreen, { color: '#047857' }]}>
                        Akun Aktif
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.bendaharaStatAmountGreen, { color: '#047857' }]}>
                    {scopedWarga?.length || 0} Akun Warga
                  </Text>
                </View>

                {/* Stat 2: Status Database Cloud */}
                <View style={styles.bendaharaStatCardLunas}>
                  <View style={styles.bendaharaStatCardTopRow}>
                    <View style={styles.bendaharaStatIconLabelWrap}>
                      <View style={[styles.bendaharaMiniStatIconCircle, { backgroundColor: '#DCFCE7' }]}>
                        <CheckCircle2 size={16} color="#059669" strokeWidth={2.5} />
                      </View>
                      <Text style={styles.bendaharaStatLabelGreen}>Status Koneksi Server</Text>
                    </View>
                    <View style={styles.bendaharaStatWargaPillGreen}>
                      <Text style={styles.bendaharaStatWargaTextGreen}>
                        Live Cloud
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.bendaharaStatAmountGreen}>
                    Online (Normal)
                  </Text>
                </View>
              </View>
            </View>

            {/* 2. MENU OPERASIONAL ADMIN */}
            <View style={styles.bendaharaOperasionalSection}>
              <View style={styles.bendaharaOperasionalHeaderRow}>
                <Text style={styles.bendaharaSectionTitle}>Menu Super Administrator</Text>
                <Text style={styles.bendaharaSectionSub}>Akses kontrol sistem, master data & konfigurasi</Text>
              </View>

              <View style={styles.bendaharaActionList}>
                <TouchableOpacity
                  style={styles.bendaharaActionCard}
                  onPress={() => navigation.navigate('Pengaturan')}
                  activeOpacity={0.85}
                >
                  <View style={[styles.bendaharaActionIconWrap, { backgroundColor: '#ECFDF5' }]}>
                    <Settings size={20} color="#047857" strokeWidth={2.2} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.bendaharaActionCardTitle}>Pengaturan Sistem & Server</Text>
                    <Text style={styles.bendaharaActionCardDesc} numberOfLines={1}>
                      Konfigurasi API, token Moota, Supabase & backup
                    </Text>
                  </View>
                  <ChevronRight size={18} color="#94A3B8" strokeWidth={2} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.bendaharaActionCard}
                  onPress={() => navigation.navigate('WargaList')}
                  activeOpacity={0.85}
                >
                  <View style={[styles.bendaharaActionIconWrap, { backgroundColor: '#ECFDF5' }]}>
                    <Users size={20} color="#059669" strokeWidth={2.2} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.bendaharaActionCardTitle}>Master Data Seluruh Warga</Text>
                    <Text style={styles.bendaharaActionCardDesc} numberOfLines={1}>
                      Kelola registrasi, verifikasi KTP & penetapan unit
                    </Text>
                  </View>
                  <ChevronRight size={18} color="#94A3B8" strokeWidth={2} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.bendaharaActionCard}
                  onPress={() => navigation.navigate('Kas')}
                  activeOpacity={0.85}
                >
                  <View style={[styles.bendaharaActionIconWrap, { backgroundColor: '#ECFDF5' }]}>
                    <Wallet size={20} color="#047857" strokeWidth={2.2} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.bendaharaActionCardTitle}>Transparansi Kas & Pembukuan</Text>
                    <Text style={styles.bendaharaActionCardDesc} numberOfLines={1}>
                      Audit arus kas masuk/keluar di semua scope RT & RW
                    </Text>
                  </View>
                  <ChevronRight size={18} color="#94A3B8" strokeWidth={2} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.bendaharaActionCard}
                  onPress={() => navigation.navigate('DataAkses')}
                  activeOpacity={0.85}
                >
                  <View style={[styles.bendaharaActionIconWrap, { backgroundColor: '#ECFDF5' }]}>
                    <ShieldCheck size={20} color="#047857" strokeWidth={2.2} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.bendaharaActionCardTitle}>Demo & Role Switcher</Text>
                    <Text style={styles.bendaharaActionCardDesc} numberOfLines={1}>
                      Uji coba simulasi tampilan berbagai akun dan wewenang
                    </Text>
                  </View>
                  <ChevronRight size={18} color="#94A3B8" strokeWidth={2} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* ===================== ADMIN IT: MANAJEMEN ROLE & JABATAN WARGA ===================== */}
        {isAdmin && (
          <AppCard style={styles.adminRoleCard}>
            <View style={styles.adminRoleHeader}>
              <View style={[styles.roleSpecialIconBadge, { backgroundColor: '#ECFDF5' }]}>
                <UserCheck size={18} color="#047857" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.roleSpecialTag, { color: '#047857' }]}>OTORISASI & HAK AKSES</Text>
                <Text style={styles.roleSpecialTitle}>Kelola Role & Jabatan Warga</Text>
              </View>
              <TouchableOpacity
                style={styles.adminRoleTriggerBtn}
                onPress={() => {
                  setAdminTargetWarga(null)
                  setAdminTargetRole('warga')
                  setAdminSearchWarga('')
                  setAdminRoleModalOpen(true)
                }}
                activeOpacity={0.8}
              >
                <UserPlus size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
                <Text style={styles.adminRoleTriggerText}>Ubah Role</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.adminRoleDesc}>
              Tetapkan jabatan warga (Ketua RT, Ketua RW, Bendahara, Pengurus, atau Admin IT) langsung dari akun Super Admin.
            </Text>

            {/* List Pejabat Lingkungan Aktif */}
            <View style={styles.pejabatList}>
              {pejabatWargaList.length > 0 ? (
                pejabatWargaList.map((pw) => {
                  const theme = getJabatanTheme(pw.jabatan)
                  return (
                    <View key={pw.id} style={styles.pejabatItem}>
                      <View style={[styles.pejabatBadge, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                        <Text style={[styles.pejabatBadgeText, { color: theme.color }]}>
                          {getJabatanShortLabel(pw.jabatan)}
                        </Text>
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={styles.pejabatName} numberOfLines={1}>{pw.nama}</Text>
                        <Text style={styles.pejabatSub} numberOfLines={1}>
                          Blok {pw.blok || '-'}/{pw.noRumah || '-'} • {pw.noHp || '-'}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.pejabatUbahBtn}
                        onPress={() => {
                          setAdminTargetWarga(pw)
                          setAdminTargetRole(pw.jabatan || 'warga')
                          setAdminRoleModalOpen(true)
                        }}
                        activeOpacity={0.75}
                      >
                        <Edit3 size={11} color="#047857" />
                        <Text style={styles.pejabatUbahBtnText}>Ubah</Text>
                      </TouchableOpacity>
                    </View>
                  )
                })
              ) : (
                <Text style={styles.pejabatEmptyText}>Belum ada warga yang memiliki jabatan struktural.</Text>
              )}
            </View>
          </AppCard>
        )}

        {/* ===================== RINGKASAN KAS LINGKUNGAN (ADMIN IT ONLY) ===================== */}
        {!isResidentView && !isRT && !isRW && !isBendahara && !isPengurus && (
          <View style={{ marginTop: 12, marginBottom: 24 }}>
            <View style={styles.v2SectionHeaderWithAction}>
              <Text style={styles.v2SectionTitle}>Kas Lingkungan</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Kas')}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={styles.v2SeeAllBtn}
              >
                <Text style={styles.v2SeeAllText}>Buka Buku Kas</Text>
              </TouchableOpacity>
            </View>
            <KasWidget
              balance={saldoKas || 48520000}
              incomeMonth={totalPemasukan || 6120000}
              expenseMonth={totalPengeluaran || 1080000}
              onPress={() => navigation.navigate('Kas')}
            />
          </View>
        )}

        {/* Pengumuman Terkini (Khusus Tampilan Admin IT Selain Bendahara, Pengurus, RT & RW) */}
        {!isResidentView && !isBendahara && !isPengurus && !isRT && !isRW && (
          <View style={styles.announcementSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Pengumuman Terkini</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Events')}>
                <Text style={styles.seeAllText}>Lihat Semua</Text>
              </TouchableOpacity>
            </View>

            {(scopedEvents?.length ? scopedEvents : events)?.length > 0 ? (
              (scopedEvents?.length ? scopedEvents : events).slice(0, 2).map((ev) => (
                <AppCard
                  key={ev.id}
                  style={styles.eventCard}
                  onPress={() => navigation.navigate('Events', { eventId: ev.id })}
                >
                  <View style={styles.eventHeader}>
                    <Text style={styles.eventTitle} numberOfLines={1}>{ev.judul || ev.nama}</Text>
                    <View style={styles.eventDateWrap}>
                      <Clock size={12} color={colors.textSecondary} />
                      <Text style={styles.eventDate}>{ev.tanggal || 'Bulan Ini'}</Text>
                    </View>
                  </View>
                  <Text style={styles.eventDesc} numberOfLines={2}>
                    {ev.deskripsi || 'Kegiatan kebersamaan warga perumahan.'}
                  </Text>
                </AppCard>
              ))
            ) : (
              <AppCard style={styles.emptyCard}>
                <Text style={styles.emptyText}>Belum ada iuran kegiatan baru.</Text>
              </AppCard>
            )}
          </View>
        )}
      </ScrollView>
      {/* Modal Detail Transaksi & Pengeluaran Kas */}
      <AppModal
        visible={kasDetailModalOpen}
        title="Detail Transparansi Kas"
        subtitle="Rincian catatan keuangan & belanja lingkungan"
        onClose={() => setKasDetailModalOpen(false)}
        footer={
          <View style={{ width: '100%' }}>
            <AppButton
              title="Tutup Rincian"
              variant="secondary"
              onPress={() => setKasDetailModalOpen(false)}
            />
          </View>
        }
      >
        {selectedKasDetail && (
          <View style={{ width: '100%' }}>
            {/* Amount card */}
            <View style={[
              styles.detailKasAmountCard,
              selectedKasDetail.tipe === 'Keluar' || selectedKasDetail.tipe === 'Pengeluaran'
                ? styles.detailKasAmountCardKeluar
                : styles.detailKasAmountCardMasuk
            ]}>
              <Text style={styles.detailKasAmountLabel}>
                {selectedKasDetail.tipe === 'Keluar' || selectedKasDetail.tipe === 'Pengeluaran'
                  ? 'PENGELUARAN KAS LINGKUNGAN'
                  : 'PEMASUKAN KAS LINGKUNGAN'}
              </Text>
              <Text style={[
                styles.detailKasAmountVal,
                { color: selectedKasDetail.tipe === 'Keluar' || selectedKasDetail.tipe === 'Pengeluaran' ? colors.danger : colors.success }
              ]}>
                {formatRupiah(selectedKasDetail.nominal)}
              </Text>
            </View>

            {/* Detail Rows */}
            <View style={styles.detailKasInfoBox}>
              <View style={styles.detailKasRow}>
                <Text style={styles.detailKasLabel}>Penyelenggara / Tingkat</Text>
                <View style={[
                  styles.dashScopeBadge,
                  (selectedKasDetail.scope === 'rw' || !selectedKasDetail.rt_id) ? styles.dashScopeBadgeRw : styles.dashScopeBadgeRt
                ]}>
                  <Text style={[
                    styles.dashScopeBadgeText,
                    (selectedKasDetail.scope === 'rw' || !selectedKasDetail.rt_id) ? styles.textPurple : styles.textGreen
                  ]}>
                    {(selectedKasDetail.scope === 'rw' || !selectedKasDetail.rt_id) ? '🏢 Kas RW 01' : '🏡 Kas RT 01'}
                  </Text>
                </View>
              </View>

              <View style={styles.detailKasRowDivider} />

              <View style={styles.detailKasRow}>
                <Text style={styles.detailKasLabel}>Kategori Belanja</Text>
                <Text style={styles.detailKasVal}>{selectedKasDetail.kategori || 'Operasional'}</Text>
              </View>

              <View style={styles.detailKasRowDivider} />

              <View style={styles.detailKasRow}>
                <Text style={styles.detailKasLabel}>Tanggal Realisasi</Text>
                <Text style={styles.detailKasVal}>{selectedKasDetail.tanggal || '-'}</Text>
              </View>

              <View style={styles.detailKasRowDivider} />

              <View style={styles.detailKasRow}>
                <Text style={styles.detailKasLabel}>Penanggung Jawab (PJ)</Text>
                <Text style={styles.detailKasVal}>{selectedKasDetail.pj || 'Pengurus Lingkungan'}</Text>
              </View>

              <View style={styles.detailKasRowDivider} />

              <View style={styles.detailKasRow}>
                <Text style={styles.detailKasLabel}>ID Catatan Kas</Text>
                <Text style={[styles.detailKasVal, { fontFamily: 'monospace', fontSize: 11 }]}>
                  {selectedKasDetail.id || '-'}
                </Text>
              </View>

              <View style={styles.detailKasRowDivider} />

              <View style={{ paddingTop: 8 }}>
                <Text style={styles.detailKasLabel}>Uraian & Keperluan:</Text>
                <Text style={styles.detailKasDesc}>
                  {selectedKasDetail.deskripsi || selectedKasDetail.keterangan || '-'}
                </Text>
              </View>
            </View>

            {/* Transparency Note */}
            <View style={styles.transparencyBadgeBox}>
              <Shield size={16} color="#059669" style={{ marginTop: 2 }} />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.transparencyBadgeTitle}>Jaminan Akuntabilitas Warga</Text>
                <Text style={styles.transparencyBadgeDesc}>
                  Seluruh rincian pengeluaran ini dicatat langsung oleh pengurus lingkungan dan terbuka bagi warga untuk menjaga tata kelola kas yang transparan.
                </Text>
              </View>
            </View>
          </View>
        )}
      </AppModal>

      {/* Modal Admin IT: Kelola & Ubah Role Warga */}
      <AppModal
        visible={adminRoleModalOpen}
        title="Ubah Role & Jabatan Warga"
        subtitle={adminTargetWarga ? `Pilih peran baru untuk ${adminTargetWarga.nama}` : 'Pilih warga yang ingin diubah role-nya'}
        onClose={() => setAdminRoleModalOpen(false)}
        footer={
          adminTargetWarga ? (
            <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
              <View style={{ flex: 1 }}>
                <AppButton
                  title="Ganti Warga"
                  variant="secondary"
                  onPress={() => setAdminTargetWarga(null)}
                />
              </View>
              <View style={{ flex: 1 }}>
                <AppButton
                  title="Simpan Role"
                  variant="primary"
                  loading={adminSavingRole}
                  onPress={handleAdminSaveRole}
                />
              </View>
            </View>
          ) : (
            <View style={{ width: '100%' }}>
              <AppButton
                title="Tutup"
                variant="secondary"
                onPress={() => setAdminRoleModalOpen(false)}
              />
            </View>
          )
        }
      >
        {!adminTargetWarga ? (
          <View>
            <View style={styles.adminSearchBox}>
              <Search size={15} color={colors.textSecondary} style={{ marginRight: 6 }} />
              <TextInput
                style={styles.adminSearchInput}
                placeholder="Cari nama atau blok warga..."
                placeholderTextColor={colors.textSecondary}
                value={adminSearchWarga}
                onChangeText={setAdminSearchWarga}
              />
            </View>
            <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
              {filteredWargaForRole.slice(0, 20).map((w) => {
                const theme = getJabatanTheme(w.jabatan || 'warga')
                return (
                  <TouchableOpacity
                    key={w.id}
                    style={styles.adminPickWargaRow}
                    onPress={() => {
                      setAdminTargetWarga(w)
                      setAdminTargetRole(w.jabatan || 'warga')
                    }}
                    activeOpacity={0.75}
                  >
                    <View style={styles.adminPickAvatar}>
                      <Text style={styles.adminPickAvatarText}>
                        {(w.nama || 'W').charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.adminPickName} numberOfLines={1}>{w.nama}</Text>
                      <Text style={styles.adminPickSub}>Blok {w.blok}/{w.noRumah}</Text>
                    </View>
                    <View style={[styles.pejabatBadge, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                      <Text style={[styles.pejabatBadgeText, { color: theme.color }]}>
                        {getJabatanShortLabel(w.jabatan || 'warga')}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )
              })}
            </ScrollView>
          </View>
        ) : (
          <View style={{ gap: 8 }}>
            <View style={styles.adminSelectedWargaBanner}>
              <View style={{ flex: 1 }}>
                <Text style={styles.adminSelectedWargaLabel}>Warga Terpilih:</Text>
                <Text style={styles.adminSelectedWargaName}>{adminTargetWarga.nama}</Text>
                <Text style={styles.adminSelectedWargaSub}>
                  Blok {adminTargetWarga.blok || '-'}/{adminTargetWarga.noRumah || '-'} • No. HP: {adminTargetWarga.noHp || '-'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setAdminTargetWarga(null)}
                style={styles.adminChangePickBtn}
              >
                <Text style={styles.adminChangePickBtnText}>Ganti</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalSectionLabel, { marginTop: 4 }]}>Pilih Jabatan / Role Baru:</Text>
            {[
              { key: 'warga', label: 'Warga Biasa', desc: 'Warga perumahan tanpa jabatan struktural' },
              { key: 'rt', label: 'Ketua RT', desc: 'Mengelola warga, iuran dan kas RT' },
              { key: 'rw', label: 'Ketua RW', desc: 'Mengoordinasi wilayah lingkungan RW' },
              { key: 'bendahara', label: 'Bendahara', desc: 'Mengelola pembukuan keuangan & kas' },
              { key: 'pengurus', label: 'Pengurus Fasum', desc: 'Mengelola fasilitas umum, aduan & surat' },
              { key: 'admin', label: 'Admin IT', desc: 'Super Administrator sistem & database' }
            ].map((item) => {
              const isSel = adminTargetRole === item.key
              const theme = getJabatanTheme(item.key)
              return (
                <TouchableOpacity
                  key={item.key}
                  style={[
                    styles.roleModalOption,
                    isSel && { borderColor: theme.border, backgroundColor: theme.bg }
                  ]}
                  onPress={() => setAdminTargetRole(item.key)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.roleModalIcon, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                    <Shield size={16} color={theme.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.roleModalTitle, isSel && { color: theme.color }]}>{item.label}</Text>
                    <Text style={styles.roleModalDesc}>{item.desc}</Text>
                  </View>
                  {isSel && <Check size={18} color={theme.color} />}
                </TouchableOpacity>
              )
            })}
          </View>
        )}
      </AppModal>

      {/* §4.5 Modal Kuitansi (Bottom Sheet) */}
      <ReceiptModal
        visible={Boolean(selectedReceipt)}
        data={selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background, // #F8FAFC
  },
  rtAlertCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 20,
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  rtAlertIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  rtAlertDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#DC2626',
    borderWidth: 1.5,
    borderColor: '#FFFBEB',
  },
  rtAlertTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
  },
  rtAlertPill: {
    backgroundColor: '#FDE68A',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.full,
  },
  rtAlertPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#B45309',
    letterSpacing: 0.4,
  },
  rtAlertDesc: {
    fontSize: 11,
    color: '#B45309',
    marginTop: 2,
  },
  rtAlertBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#FEF3C7',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  rtAlertBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
  },
  v2Header: {
    height: 68,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: colors.background,
  },
  v2AvatarRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: colors.primary, // #064E3B
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  v2AvatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary, // #064E3B
    alignItems: 'center',
    justifyContent: 'center',
  },
  v2AvatarText: {
    fontFamily: typography.h3.fontFamily,
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  v2GreetingCol: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  v2GreetingCaption: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11.5,
    lineHeight: 15,
    color: colors.textMuted, // #64748B
  },
  v2GreetingName: {
    fontFamily: typography.h1.fontFamily,
    fontSize: 18,
    lineHeight: 22,
    color: colors.textPrimary, // #0F172A
    fontWeight: '700',
  },
  v2GreetingSub: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11.5,
    lineHeight: 15,
    color: colors.textMuted, // #64748B
    marginTop: 1,
  },
  v2BellBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  v2BellDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: colors.background,
  },
  v2SectionHeader: {
    marginBottom: 14,
  },
  v2SectionHeaderWithAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  v2SectionTitle: {
    fontFamily: typography.h2.fontFamily,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.2,
    color: colors.textPrimary, // #0F172A
    fontWeight: '700',
  },
  v2SeeAllBtn: {
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  v2SeeAllText: {
    fontFamily: typography.label.fontFamily,
    fontSize: 13,
    color: colors.primary, // #064E3B
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 160
  },
  heroCard: {
    marginBottom: spacing.md
  },
  welcomeSubTitle: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  welcomeTitle: {
    ...typography.h1,
    marginTop: 2
  },
  welcomeDesc: {
    ...typography.bodySecondary,
    lineHeight: 20,
    marginTop: spacing.xs
  },
  userBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    gap: spacing.sm
  },
  userAvatarSmall: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center'
  },
  userAvatarText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.surface
  },
  userBadgeName: {
    ...typography.body,
    fontWeight: '700'
  },
  userBadgeSub: {
    ...typography.caption
  },

  /* DUAL-MODE VIEW SWITCHER BANNER */
  dualModeBannerCard: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 12,
    ...shadows.card
  },
  dualModeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10
  },
  dualModeIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft
  },
  dualModeTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.2
  },
  dualModeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    borderWidth: 1
  },
  dualModeBadgeText: {
    fontSize: 9.5,
    fontWeight: '800'
  },
  dualModeSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1
  },
  dualModeSwitchActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0'
  },
  dualModeSwitchActionBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.primary
  },

  /* ROLE SPECIAL OVERVIEW CARDS */
  roleSpecialCard: {
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    padding: 16,
    ...shadows.card
  },
  roleSpecialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14
  },
  roleSpecialIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  roleSpecialTag: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.5
  },
  roleSpecialTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 1
  },
  statusBadgeCustom: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8
  },
  statusBadgeCustomText: {
    fontSize: 10.5,
    fontWeight: '800'
  },
  mootaNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginBottom: 12
  },
  mootaNoticeText: {
    fontSize: 11,
    color: '#065F46',
    flex: 1
  },
  roleQuickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14
  },
  roleQuickBtn: {
    flexBasis: '48%',
    flexGrow: 1,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  roleQuickBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center'
  },

  /* NOTIFIKASI PENGUMUMAN / IURAN TICKER PILL */
  announcementTicker: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
    gap: 8,
  },
  announcementTickerInfo: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  announcementTickerPaid: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  tickerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 12,
  },
  tickerTagText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  tickerTitleText: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  alertFeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: '#FDE68A'
  },
  alertFeeLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#92400E'
  },
  alertFeeNominal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#B45309'
  },
  alertFeeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#D97706',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.sm
  },
  alertFeeButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF'
  },

  /* STATUS IPL CARD (WARGA) */
  statusIplCard: {
    marginBottom: spacing.md
  },
  statusIplTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs
  },
  statusIplLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  statusIplLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.5
  },
  dashRejectBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF2F2',
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: spacing.md
  },
  dashRejectTitle: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.danger,
    marginBottom: 2
  },
  dashRejectDesc: {
    fontSize: 11,
    color: '#991B1B',
    lineHeight: 15
  },
  statusIplNominal: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
    marginTop: spacing.xs
  },
  statusIplDueDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    marginBottom: spacing.md
  },
  statusIplDueDate: {
    ...typography.caption
  },

  /* TRANSPARANSI KAS CARD */
  transparansiKasCard: {
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: colors.surface
  },
  transparansiKasHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm
  },
  transparansiKasTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1
  },
  transparansiIconWrap: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center'
  },
  transparansiKasTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.5
  },
  transparansiKasTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary
  },
  transparansiLiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: '#A7F3D0'
  },
  transparansiLiveText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669'
  },
  transparansiSaldoBox: {
    backgroundColor: '#F8FAFC',
    padding: spacing.sm + 2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: spacing.sm
  },
  transparansiSaldoLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.5
  },
  transparansiSaldoVal: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
    marginTop: 2
  },
  transparansiFlowGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm
  },
  transparansiFlowItem: {
    flex: 1,
    alignItems: 'center'
  },
  transparansiFlowLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '600'
  },
  transparansiFlowVal: {
    fontSize: 13,
    fontWeight: '800'
  },
  transparansiDividerVertical: {
    width: 1,
    height: 28,
    backgroundColor: colors.border
  },
  recentKasBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: radius.sm,
    padding: spacing.xs + 2,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: '#F3F4F6'
  },
  recentKasHeader: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 4
  },
  recentKasRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2
  },
  recentKasDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6
  },
  recentKasDesc: {
    flex: 1,
    fontSize: 11,
    color: colors.textPrimary,
    fontWeight: '500',
    marginRight: spacing.xs
  },
  recentKasAmount: {
    fontSize: 11,
    fontWeight: '700'
  },
  transparansiDetailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: radius.md,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE'
  },
  transparansiDetailBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.primary
  },

  /* RT/ADMIN MACRO CARD */
  rtMacroCard: {
    marginBottom: spacing.md
  },
  macroHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.md
  },
  macroTitle: {
    ...typography.h3
  },
  macroPeriod: {
    ...typography.caption,
    marginTop: 2
  },
  macroBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#A7F3D0'
  },
  macroBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary
  },
  macroGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border
  },
  macroItem: {
    flex: 1,
    alignItems: 'center'
  },
  macroDividerVertical: {
    width: 1,
    height: 36,
    backgroundColor: colors.border
  },
  macroLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 2
  },
  macroVal: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3
  },
  macroSub: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2
  },
  alertPendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    padding: spacing.sm,
    borderRadius: radius.md,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: '#FEF3C7',
    gap: spacing.xs
  },
  alertPendingText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#B45309'
  },

  /* METRICS GRID */
  metricsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg
  },
  metricCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card
  },
  metricIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6
  },
  metricVal: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary
  },
  metricLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
    textAlign: 'center'
  },

  /* SHORTCUTS */
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.sm
  },
  shortcutsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg
  },
  shortcutBtn: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card
  },
  shortcutIconWrap: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6
  },
  shortcutText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center'
  },

  /* ANNOUNCEMENTS */
  announcementSection: {
    marginBottom: spacing.md
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary
  },
  eventCard: {
    marginBottom: spacing.sm
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  eventTitle: {
    ...typography.cardTitle,
    flex: 1,
    marginRight: spacing.sm
  },
  eventDateWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  eventDate: {
    fontSize: 11,
    color: colors.textSecondary
  },
  eventDesc: {
    ...typography.bodySecondary,
    fontSize: 12,
    lineHeight: 17
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: spacing.lg
  },
  emptyText: {
    ...typography.bodySecondary,
    fontSize: 12
  },
  petaBannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#99F6E4',
    borderRadius: 18,
    padding: 14,
    marginBottom: 20,
    ...shadows.card
  },
  petaBannerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center'
  },
  petaBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primaryDark
  },
  petaBannerBadge: {
    backgroundColor: '#CCFBF1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full
  },
  petaBannerBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.primaryDark
  },
  petaBannerDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2
  },

  /* DASHBOARD KAS SCOPE TABS & PENGELUARAN STYLES */
  dashKasScopeTabs: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: spacing.sm
  },
  dashKasScopeBtn: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: radius.sm,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  dashKasScopeBtnActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A'
  },
  dashKasScopeBtnActiveGreen: {
    backgroundColor: '#059669',
    borderColor: '#059669'
  },
  dashKasScopeBtnActivePurple: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626'
  },
  dashKasScopeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary
  },
  dashKasScopeTextActive: {
    color: colors.white
  },
  dashPengeluaranSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  dashPengeluaranHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs + 2
  },
  dashPengeluaranTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: colors.textPrimary
  },
  dashPengeluaranSubtitle: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '600'
  },
  dashPengeluaranEmpty: {
    paddingVertical: 12,
    alignItems: 'center'
  },
  dashPengeluaranEmptyText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontStyle: 'italic'
  },
  dashPengeluaranItem: {
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    padding: spacing.xs + 3,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  dashPengeluaranTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  dashScopeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full
  },
  dashScopeBadgeRw: {
    backgroundColor: '#F3E8FF',
    borderWidth: 0.8,
    borderColor: '#DDD6FE'
  },
  dashScopeBadgeRt: {
    backgroundColor: '#ECFDF5',
    borderWidth: 0.8,
    borderColor: '#A7F3D0'
  },
  dashScopeBadgeText: {
    fontSize: 9.5,
    fontWeight: '800'
  },
  dashKategoriBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full
  },
  dashKategoriBadgeText: {
    fontSize: 9.5,
    fontWeight: '600',
    color: colors.textSecondary
  },
  dashPengeluaranDate: {
    fontSize: 10,
    color: colors.textSecondary
  },
  dashPengeluaranDesc: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.textPrimary,
    lineHeight: 16,
    marginBottom: 4
  },
  dashPengeluaranBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  dashPengeluaranPj: {
    fontSize: 10,
    color: colors.textSecondary,
    flex: 1,
    marginRight: 6
  },
  dashPengeluaranAmount: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.danger
  },

  /* MODAL DETAIL KAS STYLES */
  detailKasAmountCard: {
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 1
  },
  detailKasAmountCardKeluar: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA'
  },
  detailKasAmountCardMasuk: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0'
  },
  detailKasAmountLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: colors.textSecondary,
    marginBottom: 4
  },
  detailKasAmountVal: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5
  },
  detailKasInfoBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: radius.md,
    padding: spacing.sm + 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: spacing.md
  },
  detailKasRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4
  },
  detailKasLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600'
  },
  detailKasVal: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.textPrimary
  },
  detailKasRowDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4
  },
  detailKasDesc: {
    fontSize: 12,
    color: colors.textPrimary,
    lineHeight: 18,
    marginTop: 4,
    fontWeight: '500'
  },
  transparencyBadgeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0FDF4',
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: '#BBF7D0'
  },
  transparencyBadgeTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
    marginBottom: 2
  },
  transparencyBadgeDesc: {
    fontSize: 10,
    color: '#065F46',
    lineHeight: 14
  },
  textPurple: {
    color: '#DC2626'
  },
  textGreen: {
    color: '#059669'
  },
  adminRoleCard: {
    marginBottom: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    padding: 16,
    ...shadows.card
  },
  adminRoleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8
  },
  adminRoleTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: colors.primary,
    ...shadows.soft
  },
  adminRoleTriggerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF'
  },
  adminRoleDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 12
  },
  pejabatList: {
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: 10
  },
  pejabatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: radius.md,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  pejabatBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: radius.sm,
    borderWidth: 1
  },
  pejabatBadgeText: {
    fontSize: 10.5,
    fontWeight: '800'
  },
  pejabatName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary
  },
  pejabatSub: {
    fontSize: 11,
    color: colors.textSecondary
  },
  pejabatUbahBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minHeight: 36,
    borderRadius: radius.sm,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0'
  },
  pejabatUbahBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#047857'
  },
  pejabatEmptyText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontStyle: 'italic',
    paddingVertical: 8
  },
  adminSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 10,
    backgroundColor: '#F8FAFC',
    marginBottom: 10
  },
  adminSearchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.textPrimary
  },
  adminPickWargaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: radius.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight
  },
  adminPickAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center'
  },
  adminPickAvatarText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary
  },
  adminPickName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary
  },
  adminPickSub: {
    fontSize: 11,
    color: colors.textSecondary
  },
  adminSelectedWargaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: radius.md,
    padding: 10,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginBottom: 8
  },
  adminSelectedWargaLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase'
  },
  adminSelectedWargaName: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary
  },
  adminSelectedWargaSub: {
    fontSize: 11,
    color: colors.textSecondary
  },
  adminChangePickBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.sm,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#A7F3D0'
  },
  adminChangePickBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857'
  },
  modalSectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 4
  },
  roleModalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: spacing.sm + 2,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    backgroundColor: '#FFFFFF'
  },
  roleModalIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1
  },
  roleModalTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2
  },
  roleModalDesc: {
    fontSize: 11,
    color: colors.textSecondary
  },
  transparansiSubTabsRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: radius.md,
    padding: 3,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    gap: 4
  },
  transparansiSubTabBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm
  },
  transparansiSubTabBtnActiveGreen: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    ...shadows.soft
  },
  transparansiSubTabBtnActiveRed: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FECACA',
    ...shadows.soft
  },
  transparansiSubTabText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.textSecondary
  },
  transparansiSubTabTextActiveGreen: {
    color: '#059669',
    fontWeight: '800'
  },
  transparansiSubTabTextActiveRed: {
    color: '#DC2626',
    fontWeight: '800'
  },
  bukaTabelLengkapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginTop: 6,
    borderRadius: radius.md,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0'
  },
  bukaTabelLengkapText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#059669'
  },

  /* ===================== BENDAHARA SPECIALIZED DESIGN ===================== */
  bendaharaStatusCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    ...shadows.card
  },
  bendaharaStatusTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14
  },
  bendaharaStatusIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center'
  },
  bendaharaStatusTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2
  },
  bendaharaActivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 12,
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC'
  },
  bendaharaActiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A'
  },
  bendaharaActivePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D'
  },
  bendaharaStatusDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
    marginTop: 2
  },
  bendaharaSwitchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 48,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1'
  },
  bendaharaSwitchBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B'
  },

  /* IURAN KHUSUS BANNER CARD */
  iuranBannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 18,
    padding: 14,
    marginBottom: 18,
    gap: 12,
    ...shadows.card
  },
  iuranBannerIconBadge: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  iuranBannerTextCol: {
    flex: 1,
    minWidth: 0
  },
  iuranBannerTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2
  },
  iuranBannerPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3
  },
  iuranBannerTagText: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.4
  },
  iuranBannerTitleText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 20
  },
  iuranBannerSubText: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2
  },
  iuranBannerArrowWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center'
  },

  /* BENDAHARA MAIN FINANCE CONTAINER & CARDS */
  bendaharaFinancialContainer: {
    marginBottom: 8
  },
  bendaharaMainFinanceCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
    ...shadows.card
  },
  bendaharaFinanceHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14
  },
  bendaharaFinanceIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    alignItems: 'center',
    justifyContent: 'center'
  },
  bendaharaFinancePreTitle: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.6
  },
  bendaharaFinanceMainTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
    marginTop: 1
  },
  bendaharaRoleBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A'
  },
  bendaharaRoleBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309'
  },
  bendaharaMootaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: 16
  },
  bendaharaMootaPillText: {
    fontSize: 11.5,
    color: '#065F46',
    flex: 1
  },
  bendaharaStatsStack: {
    gap: 12
  },
  bendaharaStatCardLunas: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 16,
    padding: 16
  },
  bendaharaStatCardBelum: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 16,
    padding: 16
  },
  bendaharaStatCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6
  },
  bendaharaStatIconLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  bendaharaMiniStatIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  bendaharaStatLabelGreen: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#065F46'
  },
  bendaharaStatLabelRed: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#991B1B'
  },
  bendaharaStatWargaPillGreen: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: '#DCFCE7'
  },
  bendaharaStatWargaTextGreen: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803D'
  },
  bendaharaStatWargaPillRed: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: '#FEE2E2'
  },
  bendaharaStatWargaTextRed: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B91C1C'
  },
  bendaharaStatAmountGreen: {
    fontSize: 26,
    fontWeight: '900',
    color: '#047857',
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums']
  },
  bendaharaStatAmountRed: {
    fontSize: 26,
    fontWeight: '900',
    color: '#DC2626',
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums']
  },

  /* BENDAHARA ALERT CARD */
  bendaharaAlertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
    gap: 12,
    ...shadows.soft
  },
  bendaharaAlertIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center'
  },
  bendaharaAlertPreTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
    letterSpacing: 0.5
  },
  bendaharaAlertMainTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#92400E',
    marginTop: 1
  },
  bendaharaAlertSubText: {
    fontSize: 11.5,
    color: '#78350F',
    marginTop: 2
  },
  bendaharaAlertChevronWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center'
  },

  /* BENDAHARA OPERASIONAL SECTION & ACTIONS */
  bendaharaOperasionalSection: {
    marginBottom: 20
  },
  bendaharaOperasionalHeaderRow: {
    marginBottom: 12
  },
  bendaharaSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2
  },
  bendaharaSectionSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2
  },
  bendaharaActionList: {
    gap: 10
  },
  bendaharaActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 64,
    gap: 14,
    ...shadows.card
  },
  bendaharaActionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  bendaharaActionCardTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2
  },
  bendaharaActionCardDesc: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2
  },
  bendaharaActionBadgePending: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    borderRadius: 6
  },
  bendaharaActionBadgePendingText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#DC2626'
  }
})
