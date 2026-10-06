import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl
} from 'react-native'
import {
  Receipt,
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
  ArrowUpRight
} from 'lucide-react-native'
import { useApp } from '../context/AppContext'
import TopAppBar from '../components/TopAppBar'
import AppCard from '../components/AppCard'
import AppBadge from '../components/AppBadge'
import AppButton from '../components/AppButton'
import { colors, typography, spacing, radius, shadows } from '../utils/theme'

export default function DashboardScreen({ navigation }) {
  const {
    currentUser,
    isWarga,
    isRT,
    isAdmin,
    currentRT,
    currentWarga,
    scopedTagihan,
    scopedWarga,
    scopedKas,
    events,
    scopedEvents,
    tagihanEvents,
    refreshData,
    refreshing
  } = useApp()

  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()

  // Announcement & Iuran Notification
  const activeEventsList = scopedEvents || []
  const latestAnnouncement = activeEventsList[0] || null
  const isLatestPaid = latestAnnouncement && Number(latestAnnouncement.nominalPerKK) > 0

  // Tagihan bulan ini untuk Warga
  const tagihanBulanIni = isWarga
    ? scopedTagihan.find(
        (t) =>
          Number(t.bulan) === currentMonth &&
          Number(t.tahun) === currentYear &&
          (t.wargaId === currentUser?.resident_id || (t.namaWarga && t.namaWarga === currentUser?.name))
      ) || scopedTagihan[0]
    : null

  // Ringkasan untuk RT / Admin
  const lunasTagihan = scopedTagihan.filter((t) => t.status === 'Lunas')
  const belumLunasTagihan = scopedTagihan.filter(
    (t) => t.status === 'Belum Lunas' || t.status === 'Belum Bayar'
  )
  const pendingCekCount = scopedTagihan.filter((t) => t.status === 'Menunggu Verifikasi').length

  const totalLunasNominal = lunasTagihan.reduce((acc, t) => acc + (t.total || 0), 0)
  const totalBelumNominal = belumLunasTagihan.reduce((acc, t) => acc + (t.total || 0), 0)

  // Saldo Kas
  const totalPemasukan = scopedKas
    .filter((k) => k.tipe === 'Masuk' || k.tipe === 'Pemasukan')
    .reduce((acc, k) => acc + (k.nominal || 0), 0)
  const totalPengeluaran = scopedKas
    .filter((k) => k.tipe === 'Keluar' || k.tipe === 'Pengeluaran')
    .reduce((acc, k) => acc + (k.nominal || 0), 0)
  const saldoKas = totalPemasukan - totalPengeluaran

  const formatRupiah = (num) => 'Rp ' + (num || 0).toLocaleString('id-ID')

  const displayName = (currentUser?.name || 'Warga').replace(/\s*\(Warga.*?\)/i, '')

  return (
    <View style={styles.container}>
      <TopAppBar title="Dashboard Utama" navigation={navigation} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
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
        {/* Welcome Hero Banner */}
        <AppCard style={styles.heroCard}>
          <Text style={styles.welcomeSubTitle}>Selamat Datang</Text>
          <Text style={styles.welcomeTitle}>IPL Warga Digital</Text>
          <Text style={styles.welcomeDesc}>
            Kelola iuran, informasi, dan layanan rukun warga dalam satu genggaman.
          </Text>

          <View style={styles.userBadgeRow}>
            <View style={styles.userAvatarSmall}>
              <Text style={styles.userAvatarText}>{displayName.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.userBadgeName} numberOfLines={1}>
                {displayName}
              </Text>
              <Text style={styles.userBadgeSub} numberOfLines={1}>
                {isWarga
                  ? `Warga ${currentWarga?.blok ? `Blok ${currentWarga.blok}/${currentWarga.noRumah}` : 'Tetap'}`
                  : isRT
                  ? `Pengurus ${currentRT?.name || 'RT 01'}`
                  : 'Super Administrator RW'}
              </Text>
            </View>
          </View>
        </AppCard>

        {/* ===================== NOTIFIKASI PENGUMUMAN / IURAN TERBARU (KHUSUS WARGA) ===================== */}
        {isWarga && latestAnnouncement && (
          <TouchableOpacity
            style={[
              styles.announcementAlertCard,
              isLatestPaid ? styles.announcementAlertCardPaid : styles.announcementAlertCardInfo
            ]}
            onPress={() => navigation.navigate('Events', { eventId: latestAnnouncement.id })}
            activeOpacity={0.88}
          >
            <View style={styles.alertHeaderRow}>
              <View style={[styles.alertIconBadge, isLatestPaid ? { backgroundColor: '#FEF3C7' } : { backgroundColor: '#DBEAFE' }]}>
                {isLatestPaid ? (
                  <Trophy size={16} color="#D97706" />
                ) : (
                  <Megaphone size={16} color="#2563EB" />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.alertTagRow}>
                  <Text style={[styles.alertTagText, isLatestPaid ? { color: '#B45309' } : { color: '#1D4ED8' }]}>
                    {isLatestPaid ? '🏆 IURAN / LOMBA BARU' : '📢 PENGUMUMAN RESMI'}
                  </Text>
                  <View style={[styles.alertPulseDot, isLatestPaid ? { backgroundColor: '#F59E0B' } : { backgroundColor: '#3B82F6' }]} />
                </View>
                <Text style={styles.alertTitleText} numberOfLines={1}>
                  {latestAnnouncement.judul || latestAnnouncement.nama}
                </Text>
              </View>
              <ChevronRight size={18} color={isLatestPaid ? '#D97706' : '#2563EB'} />
            </View>

            {latestAnnouncement.deskripsi ? (
              <Text style={styles.alertDescText} numberOfLines={2}>
                {latestAnnouncement.deskripsi}
              </Text>
            ) : null}

            {isLatestPaid && (
              <View style={styles.alertFeeRow}>
                <View>
                  <Text style={styles.alertFeeLabel}>Nominal Iuran:</Text>
                  <Text style={styles.alertFeeNominal}>
                    {formatRupiah(latestAnnouncement.nominalPerKK)} / KK
                  </Text>
                </View>
                <View style={styles.alertFeeButton}>
                  <Text style={styles.alertFeeButtonText}>Lihat & Bayar</Text>
                  <ChevronRight size={14} color="#FFFFFF" />
                </View>
              </View>
            )}
          </TouchableOpacity>
        )}

        {/* ===================== WARGA: STATUS IPL CARD ===================== */}
        {isWarga && (
          <AppCard style={styles.statusIplCard}>
            <View style={styles.statusIplTop}>
              <View style={styles.statusIplLabelRow}>
                <Receipt size={18} color={colors.primary} />
                <Text style={styles.statusIplLabel}>STATUS IPL BULAN INI</Text>
              </View>

              <AppBadge status={tagihanBulanIni?.status || 'Belum Bayar'} />
            </View>

            <Text style={styles.statusIplNominal}>
              {formatRupiah(tagihanBulanIni?.total || 120000)}
            </Text>

            <View style={styles.statusIplDueDateRow}>
              <Calendar size={14} color={colors.textSecondary} />
              <Text style={styles.statusIplDueDate}>
                Jatuh tempo: 30 September {currentYear} (Periode {currentMonth}/{currentYear})
              </Text>
            </View>

            {/* Rejection notice if status is Perlu Diperbaiki */}
            {(tagihanBulanIni?.status === 'Perlu Diperbaiki' || tagihanBulanIni?.status === 'Ditolak') && (
              <View style={styles.dashRejectBanner}>
                <AlertCircle size={16} color={colors.danger} style={{ marginTop: 2 }} />
                <View style={{ flex: 1, marginLeft: spacing.sm }}>
                  <Text style={styles.dashRejectTitle}>Pembayaran Perlu Diperbaiki</Text>
                  <Text style={styles.dashRejectDesc}>
                    {tagihanBulanIni.alasanPenolakan || 'Bukti pembayaran belum sesuai. Silakan upload ulang bukti transfer/QRIS yang valid.'}
                  </Text>
                </View>
              </View>
            )}

            {tagihanBulanIni?.status === 'Lunas' ? (
              <AppButton
                title="Lihat Kwitansi & Rincian"
                variant="secondary"
                icon={<CheckCircle2 size={18} color={colors.success} />}
                onPress={() =>
                  navigation.navigate('DetailTagihan', {
                    tagihan: tagihanBulanIni
                  })
                }
              />
            ) : (
              <AppButton
                title={
                  tagihanBulanIni?.status === 'Menunggu Verifikasi'
                    ? 'Lihat Status Bukti Bayar'
                    : (tagihanBulanIni?.status === 'Perlu Diperbaiki' || tagihanBulanIni?.status === 'Ditolak')
                    ? 'Upload Ulang Bukti Bayar'
                    : 'Bayar Sekarang'
                }
                variant={
                  (tagihanBulanIni?.status === 'Perlu Diperbaiki' || tagihanBulanIni?.status === 'Ditolak')
                    ? 'danger'
                    : 'primary'
                }
                icon={<CreditCard size={18} color={colors.surface} />}
                onPress={() => {
                  if (tagihanBulanIni?.status === 'Perlu Diperbaiki' || tagihanBulanIni?.status === 'Ditolak') {
                    navigation.navigate('Pembayaran', { tagihan: tagihanBulanIni })
                  } else {
                    navigation.navigate('DetailTagihan', {
                      tagihan: tagihanBulanIni || { id: 'sample', total: 120000 }
                    })
                  }
                }}
              />
            )}
          </AppCard>
        )}

        {/* ===================== RT / ADMIN: RINGKASAN IPL ===================== */}
        {!isWarga && (
          <AppCard style={styles.rtMacroCard}>
            <View style={styles.macroHeader}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.macroTitle}>Ringkasan IPL</Text>
                <Text style={styles.macroPeriod} numberOfLines={1}>
                  Bulan {currentMonth}/{currentYear} • {currentRT?.name || 'RT 01'}
                </Text>
              </View>
              <View style={styles.macroBadge}>
                <Text style={styles.macroBadgeText}>REAL-TIME</Text>
              </View>
            </View>

            <View style={styles.macroGrid}>
              <View style={styles.macroItem}>
                <Text style={styles.macroLabel}>Terkumpul (Lunas)</Text>
                <Text style={[styles.macroVal, { color: colors.success }]}>
                  {formatRupiah(totalLunasNominal)}
                </Text>
                <Text style={styles.macroSub}>{lunasTagihan.length} Warga Lunas</Text>
              </View>

              <View style={styles.macroDividerVertical} />

              <View style={styles.macroItem}>
                <Text style={styles.macroLabel}>Tunggakan (Belum)</Text>
                <Text style={[styles.macroVal, { color: colors.danger }]}>
                  {formatRupiah(totalBelumNominal)}
                </Text>
                <Text style={styles.macroSub}>{belumLunasTagihan.length} Warga Belum</Text>
              </View>
            </View>

            {pendingCekCount > 0 && (
              <TouchableOpacity
                style={styles.alertPendingBanner}
                onPress={() => navigation.navigate('Tagihan')}
                activeOpacity={0.85}
              >
                <AlertCircle size={16} color={colors.warning} />
                <Text style={styles.alertPendingText}>
                  Ada {pendingCekCount} pembayaran baru butuh diverifikasi!
                </Text>
                <ChevronRight size={16} color={colors.warning} />
              </TouchableOpacity>
            )}
          </AppCard>
        )}

        {/* ===================== TRANSPARANSI TOTAL KAS (UNTUK SEMUA WARGA & PENGURUS) ===================== */}
        <AppCard style={styles.transparansiKasCard}>
          <View style={styles.transparansiKasHeader}>
            <View style={styles.transparansiKasTitleRow}>
              <View style={styles.transparansiIconWrap}>
                <Wallet size={18} color={colors.white} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.transparansiKasTag}>TRANSPARANSI KAS LINGKUNGAN</Text>
                <Text style={styles.transparansiKasTitle}>Kas {currentRT?.name || 'RT / RW'}</Text>
              </View>
            </View>
            <View style={styles.transparansiLiveBadge}>
              <Shield size={11} color="#059669" />
              <Text style={styles.transparansiLiveText}>Terbuka</Text>
            </View>
          </View>

          <View style={styles.transparansiSaldoBox}>
            <Text style={styles.transparansiSaldoLabel}>TOTAL SALDO KAS TERKINI</Text>
            <Text style={styles.transparansiSaldoVal}>{formatRupiah(saldoKas)}</Text>
          </View>

          <View style={styles.transparansiFlowGrid}>
            <View style={styles.transparansiFlowItem}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                <ArrowDownLeft size={13} color={colors.success} />
                <Text style={styles.transparansiFlowLabel}>Total Pemasukan</Text>
              </View>
              <Text style={[styles.transparansiFlowVal, { color: colors.success }]}>
                {formatRupiah(totalPemasukan)}
              </Text>
            </View>

            <View style={styles.transparansiDividerVertical} />

            <View style={styles.transparansiFlowItem}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                <ArrowUpRight size={13} color={colors.danger} />
                <Text style={styles.transparansiFlowLabel}>Total Pengeluaran</Text>
              </View>
              <Text style={[styles.transparansiFlowVal, { color: colors.danger }]}>
                {formatRupiah(totalPengeluaran)}
              </Text>
            </View>
          </View>

          {/* Mutasi Terakhir Preview */}
          {(scopedKas || []).length > 0 && (
            <View style={styles.recentKasBox}>
              <Text style={styles.recentKasHeader}>Catatan Mutasi Terbaru:</Text>
              {(scopedKas || []).slice(0, 2).map((item, idx) => {
                const isMasuk = item.tipe === 'Masuk' || item.tipe === 'Pemasukan'
                return (
                  <View key={item.id || idx} style={styles.recentKasRow}>
                    <View style={[styles.recentKasDot, { backgroundColor: isMasuk ? colors.success : colors.danger }]} />
                    <Text style={styles.recentKasDesc} numberOfLines={1}>
                      {item.deskripsi || item.keterangan || 'Transaksi Kas'}
                    </Text>
                    <Text style={[styles.recentKasAmount, { color: isMasuk ? colors.success : colors.danger }]}>
                      {isMasuk ? '+' : '-'} {formatRupiah(item.nominal)}
                    </Text>
                  </View>
                )
              })}
            </View>
          )}

          <TouchableOpacity
            style={styles.transparansiDetailBtn}
            onPress={() => navigation.navigate('Kas')}
            activeOpacity={0.85}
          >
            <Text style={styles.transparansiDetailBtnText}>
              Lihat Rincian Buku Kas Lengkap
            </Text>
            <ChevronRight size={15} color={colors.primary} />
          </TouchableOpacity>
        </AppCard>

        {/* 3 Quick Metric Cards */}
        <View style={styles.metricsGrid}>
          <TouchableOpacity
            style={styles.metricCard}
            onPress={() => navigation.navigate('Tagihan')}
            activeOpacity={0.85}
          >
            <View style={[styles.metricIconWrap, { backgroundColor: '#FEE2E2' }]}>
              <Receipt size={18} color={colors.primary} />
            </View>
            <Text style={styles.metricVal}>{scopedTagihan.length}</Text>
            <Text style={styles.metricLabel}>{isWarga ? 'Tagihan Saya' : 'Tagihan'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.metricCard}
            onPress={() => navigation.navigate('Kas')}
            activeOpacity={0.85}
          >
            <View style={[styles.metricIconWrap, { backgroundColor: '#EFF6FF' }]}>
              <Wallet size={18} color={colors.info} />
            </View>
            <Text style={styles.metricVal}>{formatRupiah(saldoKas).replace('Rp ', '')}</Text>
            <Text style={styles.metricLabel}>Saldo Kas</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.metricCard}
            onPress={() => navigation.navigate(isWarga ? 'Layanan' : 'WargaList')}
            activeOpacity={0.85}
          >
            <View style={[styles.metricIconWrap, { backgroundColor: '#F3E8FF' }]}>
              {isWarga ? <Grid size={18} color="#9333EA" /> : <Users size={18} color="#9333EA" />}
            </View>
            <Text style={styles.metricVal}>{isWarga ? '5' : scopedWarga.length}</Text>
            <Text style={styles.metricLabel}>{isWarga ? 'Layanan' : 'Data Warga'}</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Shortcut Buttons */}
        <Text style={styles.sectionTitle}>Layanan Lingkungan</Text>
        <View style={styles.shortcutsRow}>
          <TouchableOpacity
            style={styles.shortcutBtn}
            onPress={() => navigation.navigate('Pengaduan')}
            activeOpacity={0.85}
          >
            <View style={[styles.shortcutIconWrap, { backgroundColor: '#EFF6FF' }]}>
              <MessageSquareText size={22} color={colors.info} />
            </View>
            <Text style={styles.shortcutText}>Lapor Aduan</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shortcutBtn}
            onPress={() => navigation.navigate('Surat')}
            activeOpacity={0.85}
          >
            <View style={[styles.shortcutIconWrap, { backgroundColor: '#ECFDF5' }]}>
              <FileText size={22} color={colors.success} />
            </View>
            <Text style={styles.shortcutText}>Surat RT/RW</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shortcutBtn}
            onPress={() => navigation.navigate('Events')}
            activeOpacity={0.85}
          >
            <View style={[styles.shortcutIconWrap, { backgroundColor: '#FFFBEB' }]}>
              <Sparkles size={22} color={colors.warning} />
            </View>
            <Text style={styles.shortcutText}>Kegiatan</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shortcutBtn}
            onPress={() => navigation.navigate('KontakDarurat')}
            activeOpacity={0.85}
          >
            <View style={[styles.shortcutIconWrap, { backgroundColor: '#FEF2F2' }]}>
              <PhoneCall size={22} color={colors.primary} />
            </View>
            <Text style={styles.shortcutText}>Darurat</Text>
          </TouchableOpacity>
        </View>

        {/* Banner Denah & Peta Lingkungan GIS (Khusus RT & RW) */}
        {!isWarga && (
          <TouchableOpacity
            style={styles.petaBannerCard}
            onPress={() => navigation.navigate('PetaWarga')}
            activeOpacity={0.88}
          >
            <View style={styles.petaBannerIconWrap}>
              <Compass size={22} color={colors.white} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.petaBannerTitle}>Denah & Titik Peta RT / RW</Text>
                <View style={styles.petaBannerBadge}>
                  <Text style={styles.petaBannerBadgeText}>GIS RT/RW</Text>
                </View>
              </View>
              <Text style={styles.petaBannerDesc}>
                Pemetaan lokasi Balai RT, Pos Ronda & sebaran status IPL unit rumah
              </Text>
            </View>
            <ChevronRight size={18} color={colors.primary} />
          </TouchableOpacity>
        )}

        {/* Pengumuman Terkini */}
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
              <Text style={styles.emptyText}>Belum ada pengumuman kegiatan baru.</Text>
            </AppCard>
          )}
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

  /* NOTIFIKASI PENGUMUMAN / IURAN BANNER */
  announcementAlertCard: {
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1.5,
    ...shadows.card
  },
  announcementAlertCardInfo: {
    backgroundColor: '#EFF6FF',
    borderColor: '#93C5FD'
  },
  announcementAlertCardPaid: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FCD34D'
  },
  alertHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  alertIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center'
  },
  alertTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  alertTagText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  alertPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3
  },
  alertTitleText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2
  },
  alertDescText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
    marginTop: 6
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
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#FEE2E2'
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
    gap: spacing.md,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#99F6E4',
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
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
  }
})
