import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, ScrollView, Alert } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  Building2,
  Bell,
  Menu,
  ArrowLeft,
  Check,
  X,
  Clock,
  Eye,
  CheckCircle2,
  Trophy,
  Receipt,
  ShieldCheck,
  UserPlus,
  Repeat,
  CheckCheck,
  CreditCard,
  FileText,
  AlertCircle,
  Megaphone,
  ChevronRight,
  Inbox
} from 'lucide-react-native'
import { useApp } from '../context/AppContext'
import { colors, shadows, radius, spacing } from '../utils/theme'
import { formatRupiah, NAMA_BULAN, formatTimeAgo } from '../utils/formatters'
import { isNotificationRelevantForUser } from '../services/notificationService'
import AppModal from './AppModal'
import AppButton from './AppButton'

export default function TopAppBar({ title, navigation, showBack }) {
  const insets = useSafeAreaInsets()
  const canGoBack = Boolean(navigation?.canGoBack && navigation.canGoBack())
  // Tampilkan tombol back di semua page kecuali jika eksplisit dimatikan (seperti Dashboard)
  const shouldShowBack = showBack !== undefined ? Boolean(showBack) : true
  const {
    currentUser,
    currentWarga,
    currentRT,
    events,
    scopedEvents,
    tagihan,
    scopedTagihan,
    tagihanEvents,
    warga,
    scopedWarga,
    rts,
    verifikasiTagihan,
    bayarTagihanEvent,
    tolakTagihanEvent,
    verifikasiWargaBaru,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    isWarga,
    isRT,
    isRW,
    isBendahara,
    isPengurus,
    isAdmin,
    hasDualRole,
    activeMode,
    toggleActiveMode,
    jabatanShortLabel
  } = useApp()

  const [notifModalOpen, setNotifModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('notif') // 'notif' | 'pending'

  const roleLabel = isWarga
    ? (hasDualRole ? 'WARGA' : 'WARGA')
    : isBendahara
    ? 'BENDAHARA'
    : isPengurus
    ? 'PENGURUS'
    : isRW
    ? 'KETUA RW'
    : isRT
    ? (currentRT?.name || 'KETUA RT')
    : 'ADMIN IT'

  // 1. Pendaftaran Warga Baru butuh ACC
  const pendingWarga = (scopedWarga || warga || []).filter((w) => {
    if (w.statusApproval !== 'Menunggu Verifikasi') return false
    if (isRT) return w.rt_id === currentRT?.id || !w.rt_id
    return true
  })

  // 2. Tagihan IPL butuh ACC
  const pendingIpl = (scopedTagihan || []).filter((t) => t.status === 'Menunggu Verifikasi')

  // 3. Tagihan Event butuh ACC
  const pendingEvents = (tagihanEvents || []).filter((te) => {
    if (te.status !== 'Menunggu Verifikasi') return false
    const ev = (events || []).find((e) => e.id === te.eventId)
    if (isRT && ev?.scope === 'rt') {
      return ev.targetRtId === currentRT?.id || ev.rt_id === currentRT?.id
    }
    return true
  })

  const totalPending = pendingIpl.length + pendingEvents.length + pendingWarga.length

  // Notifikasi sesuai hak akses pengguna
  const relevantNotifs = (notifications || []).filter((n) =>
    isNotificationRelevantForUser(n, currentUser, currentWarga)
  )
  const unreadNotifs = relevantNotifs.filter((n) => !n.read)
  const totalBadgeCount = isWarga ? unreadNotifs.length : (unreadNotifs.length + totalPending)
  const hasNotif = totalBadgeCount > 0

  // Handler 1-Click Setujui Pendaftaran Warga
  const handleApproveWarga = async (wId, residentName) => {
    Alert.alert(
      'Setujui Pendaftaran Warga',
      `Setujui pendaftaran ${residentName || 'Warga'} dan aktifkan akun login portalnya?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ya, Setujui',
          onPress: async () => {
            await verifikasiWargaBaru(wId, 'Disetujui')
            Alert.alert('Sukses', `Pendaftaran ${residentName} telah disetujui dan akun sudah aktif!`)
          }
        }
      ]
    )
  }

  // Handler Tolak Warga
  const handleRejectWarga = (wId, residentName) => {
    Alert.alert(
      'Tolak Pendaftaran Warga',
      `Tolak pendaftaran warga ${residentName || 'Warga'}?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ya, Tolak',
          style: 'destructive',
          onPress: async () => {
            await verifikasiWargaBaru(wId, 'Tolak', 'Data tidak sesuai atau bukan warga lingkungan.')
            Alert.alert('Perhatian', `Pendaftaran ${residentName} telah ditolak.`)
          }
        }
      ]
    )
  }

  // Handler 1-Click Lunas IPL
  const handleApproveIpl = async (tId, residentName) => {
    Alert.alert(
      'Konfirmasi Persetujuan Lunas',
      `Setujui pembayaran IPL warga ${residentName || 'Warga'} sebagai LUNAS?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ya, Setujui Lunas',
          onPress: async () => {
            await verifikasiTagihan(tId, 'Lunas')
            Alert.alert('Sukses', `Pembayaran IPL ${residentName} berhasil dicatat sebagai LUNAS!`)
          }
        }
      ]
    )
  }

  // Handler Tolak IPL
  const handleRejectIpl = (tId, residentName) => {
    Alert.alert(
      'Tolak Bukti Pembayaran IPL',
      `Tolak bukti pembayaran warga ${residentName || 'Warga'} dan ubah status ke "Perlu Diperbaiki"?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ya, Tolak Bukti',
          style: 'destructive',
          onPress: async () => {
            await verifikasiTagihan(tId, 'Tolak', 'Bukti transfer tidak sesuai atau buram.')
            Alert.alert('Perhatian', `Status tagihan ${residentName} diubah menjadi "Perlu Diperbaiki". Warga dapat mengunggah bukti baru.`)
          }
        }
      ]
    )
  }

  // Handler 1-Click Lunas Event
  const handleApproveEvent = async (teId, residentName, eventTitle) => {
    Alert.alert(
      'Konfirmasi Persetujuan Lunas',
      `Setujui iuran kegiatan "${eventTitle}" warga ${residentName || 'Warga'} sebagai LUNAS?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ya, Setujui Lunas',
          onPress: async () => {
            await bayarTagihanEvent(teId, { metodeBayar: 'Transfer Bank' })
            Alert.alert('Sukses', `Iuran kegiatan ${residentName} berhasil dicatat sebagai LUNAS!`)
          }
        }
      ]
    )
  }

  // Handler Tolak Event
  const handleRejectEvent = (teId, residentName, eventTitle) => {
    Alert.alert(
      'Tolak Bukti Iuran Kegiatan',
      `Tolak bukti iuran "${eventTitle}" warga ${residentName || 'Warga'}?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ya, Tolak Bukti',
          style: 'destructive',
          onPress: async () => {
            await tolakTagihanEvent(teId, 'Bukti transfer tidak sesuai atau buram.')
            Alert.alert('Perhatian', `Bukti iuran warga ${residentName} ditolak. Warga dapat mengunggah bukti baru.`)
          }
        }
      ]
    )
  }

  // Handler Klik Item Notifikasi -> Navigasi ke Halaman yang Sesuai
  const handleNotifPress = async (item) => {
    if (!item.read) {
      await markNotificationRead(item.id)
    }
    setNotifModalOpen(false)

    if (item.tagihanId) {
      const targetT = (tagihan || []).find((t) => t.id === item.tagihanId)
      if (targetT) {
        navigation?.navigate('DetailTagihan', { tagihan: targetT })
      } else {
        navigation?.navigate('Main', { screen: 'TagihanTab' })
      }
    } else if (item.suratId) {
      navigation?.navigate('Surat', { suratId: item.suratId })
    } else if (item.aduanId) {
      navigation?.navigate('Pengaduan', { aduanId: item.aduanId })
    } else if (item.eventId) {
      navigation?.navigate('Events', { eventId: item.eventId })
    } else if (item.screen) {
      navigation?.navigate(item.screen)
    } else {
      navigation?.navigate('Main', { screen: 'DashboardTab' })
    }
  }

  // Metadata visual untuk tiap tipe notifikasi
  const getNotifMeta = (item) => {
    const type = item.type || ''
    if (type === 'tagihan' || type?.startsWith('payment')) {
      const isVerified = type === 'payment_verified'
      const isRejected = type === 'payment_rejected'
      return {
        label: isVerified ? 'IPL Lunas' : isRejected ? 'IPL Perlu Revisi' : 'Tagihan IPL',
        badgeBg: isVerified ? '#ECFDF5' : isRejected ? '#FEF2F2' : '#EFF6FF',
        badgeBorder: isVerified ? '#A7F3D0' : isRejected ? '#FECACA' : '#BFDBFE',
        textColor: isVerified ? '#047857' : isRejected ? '#B91C1C' : '#1D4ED8',
        icon: isVerified ? <CheckCircle2 size={16} color="#059669" /> : isRejected ? <AlertCircle size={16} color="#DC2626" /> : <CreditCard size={16} color="#2563EB" />
      }
    }
    if (type === 'surat') {
      return {
        label: 'Surat Pengantar',
        badgeBg: '#EFF6FF',
        badgeBorder: '#BFDBFE',
        textColor: '#1D4ED8',
        icon: <FileText size={16} color="#2563EB" />
      }
    }
    if (type === 'pengaduan' || type === 'warning') {
      return {
        label: 'Pengaduan Warga',
        badgeBg: '#FFFBEB',
        badgeBorder: '#FDE68A',
        textColor: '#B45309',
        icon: <AlertCircle size={16} color="#D97706" />
      }
    }
    if (type === 'event') {
      return {
        label: 'Kegiatan / Info',
        badgeBg: '#F5F3FF',
        badgeBorder: '#DDD6FE',
        textColor: '#6D28D9',
        icon: <Megaphone size={16} color="#7C3AED" />
      }
    }
    if (type === 'REGISTRATION_PENDING') {
      return {
        label: 'Warga Baru',
        badgeBg: '#F0F9FF',
        badgeBorder: '#BAE6FD',
        textColor: '#0369A1',
        icon: <UserPlus size={16} color="#0284C7" />
      }
    }
    return {
      label: 'Pemberitahuan',
      badgeBg: '#F1F5F9',
      badgeBorder: '#E2E8F0',
      textColor: '#475569',
      icon: <Bell size={16} color="#475569" />
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      <View style={styles.contentRow}>
        {shouldShowBack ? (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (navigation?.canGoBack && navigation.canGoBack()) {
                navigation.goBack()
              } else {
                navigation?.navigate('Main', { screen: 'DashboardTab' })
              }
            }}
            activeOpacity={0.8}
            accessibilityLabel="Kembali"
          >
            <ArrowLeft size={22} color={colors.white} />
          </TouchableOpacity>
        ) : null}

        <View style={styles.brandContainer}>
          <View style={styles.logoBadge}>
            <Building2 size={18} color={colors.primary} strokeWidth={2.4} />
          </View>
          <View style={styles.titleCol}>
            <View style={styles.titleRow}>
              <Text style={styles.appName}>IPL Warga</Text>
              <View style={styles.rolePill}>
                <Text style={styles.rolePillText}>{roleLabel}</Text>
              </View>
            </View>
            <Text style={styles.subtitle} numberOfLines={1}>
              {title || 'Perumahan Alam Tirta Lestari'}
            </Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          {/* Mode Switcher Toggle Button (Khusus Bendahara & Pengurus; RT & RW adalah akun tata kelola murni) */}
          {hasDualRole && !isRT && !isRW && (
            <TouchableOpacity
              style={styles.modeToggleChip}
              onPress={toggleActiveMode}
              activeOpacity={0.8}
            >
              <Repeat size={12} color={colors.white} strokeWidth={2.4} />
              <Text style={styles.modeToggleChipText}>
                {activeMode === 'jabatan' ? jabatanShortLabel : 'Warga'}
              </Text>
            </TouchableOpacity>
          )}

          {/* Lonceng Notifikasi & Persetujuan (Berfungsi untuk SEMUA Role) */}
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setNotifModalOpen(true)}
            activeOpacity={0.8}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Pemberitahuan dan Persetujuan"
          >
            <Bell size={21} color={colors.white} />
            {hasNotif && (
              <View style={styles.bellBadgeDot}>
                <Text style={styles.bellBadgeText}>
                  {totalBadgeCount > 9 ? '9+' : totalBadgeCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => {
              if (isWarga) {
                navigation?.navigate('Layanan')
              } else {
                navigation?.navigate('Pengaturan')
              }
            }}
            activeOpacity={0.8}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Menu Pengaturan"
          >
            <Menu size={21} color={colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Decorative subtle curve bottom edge */}
      <View style={styles.curveEdge} />

      {/* MODAL NOTIFIKASI & PERSETUJUAN (SEMUA ROLE) */}
      <AppModal
        visible={notifModalOpen}
        title={isWarga ? 'Pemberitahuan Warga' : 'Pemberitahuan & Persetujuan'}
        subtitle={
          isWarga
            ? unreadNotifs.length > 0
              ? `${unreadNotifs.length} pesan baru belum dibaca`
              : 'Semua pemberitahuan sudah dibaca'
            : `${unreadNotifs.length} belum dibaca • ${totalPending} butuh persetujuan`
        }
        onClose={() => setNotifModalOpen(false)}
        footer={
          <View style={styles.modalFooterRow}>
            {unreadNotifs.length > 0 ? (
              <TouchableOpacity
                style={styles.footerMarkAllBtn}
                onPress={async () => {
                  await markAllNotificationsRead()
                }}
                activeOpacity={0.7}
              >
                <CheckCheck size={15} color={colors.primary} />
                <Text style={styles.footerMarkAllBtnText}>Tandai Semua Dibaca</Text>
              </TouchableOpacity>
            ) : <View />}

            <AppButton
              title="Tutup"
              variant="secondary"
              onPress={() => setNotifModalOpen(false)}
            />
          </View>
        }
      >
        {/* Toggle Tab untuk Pengurus / RT / RW / Bendahara / Admin */}
        {!isWarga && (
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'notif' && styles.tabButtonActive]}
              onPress={() => setActiveTab('notif')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, activeTab === 'notif' && styles.tabTextActive]}>
                Pemberitahuan
              </Text>
              {unreadNotifs.length > 0 && (
                <View style={[styles.tabBadge, activeTab === 'notif' && styles.tabBadgeActive]}>
                  <Text style={[styles.tabBadgeText, activeTab === 'notif' && styles.tabBadgeTextActive]}>
                    {unreadNotifs.length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'pending' && styles.tabButtonActive]}
              onPress={() => setActiveTab('pending')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, activeTab === 'pending' && styles.tabTextActive]}>
                Persetujuan Cepat
              </Text>
              {totalPending > 0 && (
                <View style={[styles.tabBadge, { backgroundColor: '#EF4444' }]}>
                  <Text style={[styles.tabBadgeText, { color: colors.white }]}>
                    {totalPending}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* TAB 1: PEMBERITAHUAN SESUAI ROLE (WARGA & PENGURUS) */}
        {(isWarga || activeTab === 'notif') && (
          <View style={{ gap: 10 }}>
            {relevantNotifs.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 28 }}>
                <View style={styles.emptyIconCircle}>
                  <CheckCircle2 size={32} color={colors.primary} />
                </View>
                <Text style={styles.emptyTitle}>Belum Ada Pemberitahuan</Text>
                <Text style={styles.emptyDesc}>
                  Pemberitahuan terkait tagihan IPL, bukti pembayaran, surat, pengaduan, dan pengumuman akan tampil di sini.
                </Text>
              </View>
            ) : (
              relevantNotifs.map((item) => {
                const meta = getNotifMeta(item)
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.notifItemCard,
                      !item.read && styles.notifItemUnread
                    ]}
                    onPress={() => handleNotifPress(item)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.notifHeaderRow}>
                      <View style={[styles.notifIconWrap, { backgroundColor: meta.badgeBg, borderColor: meta.badgeBorder }]}>
                        {meta.icon}
                      </View>
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                          <View style={[styles.notifCategoryBadge, { backgroundColor: meta.badgeBg, borderColor: meta.badgeBorder }]}>
                            <Text style={[styles.notifCategoryText, { color: meta.textColor }]}>
                              {meta.label}
                            </Text>
                          </View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={styles.notifTime}>
                              {formatTimeAgo(item.created_at)}
                            </Text>
                            {!item.read && <View style={styles.unreadDot} />}
                          </View>
                        </View>
                        <Text style={[styles.notifTitle, !item.read && styles.notifTitleUnread]} numberOfLines={1}>
                          {item.title}
                        </Text>
                        <Text style={styles.notifMsg} numberOfLines={2}>
                          {item.message}
                        </Text>
                      </View>
                      <ChevronRight size={16} color={colors.textTertiary} style={{ marginLeft: 4 }} />
                    </View>
                  </TouchableOpacity>
                )
              })
            )}
          </View>
        )}

        {/* TAB 2: PERSETUJUAN CEPAT (KHUSUS PENGURUS/RT/RW/ADMIN) */}
        {!isWarga && activeTab === 'pending' && (
          <View>
            {totalPending === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                <View style={styles.emptyIconCircle}>
                  <CheckCircle2 size={32} color={colors.success} />
                </View>
                <Text style={styles.emptyTitle}>Semua Pembayaran Lunas!</Text>
                <Text style={styles.emptyDesc}>
                  Tidak ada bukti pembayaran warga yang sedang menunggu persetujuan.
                </Text>
              </View>
            ) : (
              <View style={{ gap: 10 }}>
                <Text style={styles.modalSectionHeading}>
                  Daftar Permintaan Menunggu Verifikasi ({totalPending}):
                </Text>

                {/* Pendaftaran Warga Baru */}
                {pendingWarga.map((pw) => {
                  const rtObj = (rts || []).find((r) => r.id === pw.rt_id) || {}
                  return (
                    <View key={pw.id} style={[styles.notifCard, { borderColor: '#BFDBFE', backgroundColor: '#EFF6FF' }]}>
                      <View style={styles.notifCardHeader}>
                        <View style={[styles.notifBadgeIpl, { backgroundColor: '#DBEAFE' }]}>
                          <UserPlus size={14} color="#1D4ED8" />
                          <Text style={[styles.notifBadgeTextIpl, { color: '#1D4ED8' }]}>Warga Baru</Text>
                        </View>
                        <View style={{ flex: 1, marginLeft: 6 }}>
                          <Text style={styles.notifWargaName}>{pw.nama}</Text>
                          <Text style={styles.notifWargaBlok}>
                            Blok {pw.blok || 'A'}/{pw.noRumah || '-'} • {rtObj.name || 'RT 01'} • HP: {pw.noHp || '-'}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.notifActionRow}>
                        <TouchableOpacity
                          style={[styles.notifDetailBtn, { backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#FECDD3' }]}
                          onPress={() => handleRejectWarga(pw.id, pw.nama)}
                        >
                          <X size={13} color={colors.danger} />
                          <Text style={[styles.notifDetailBtnText, { color: colors.danger }]}>Tolak</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.notifApproveBtn, { backgroundColor: '#2563EB' }]}
                          onPress={() => handleApproveWarga(pw.id, pw.nama)}
                        >
                          <Check size={13} color={colors.white} />
                          <Text style={styles.notifApproveBtnText}>Setujui & Aktifkan</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )
                })}

                {/* Tagihan IPL */}
                {pendingIpl.map((t) => {
                  const targetW = (warga || []).find((w) => w.id === t.wargaId) || {}
                  const bulanNama = NAMA_BULAN[(t.bulan || 1) - 1] || `Bulan ${t.bulan}`

                  return (
                    <View key={t.id} style={styles.notifCard}>
                      <View style={styles.notifCardHeader}>
                        <View style={styles.notifBadgeIpl}>
                          <Receipt size={14} color="#B45309" />
                          <Text style={styles.notifBadgeTextIpl}>IPL</Text>
                        </View>
                        <View style={{ flex: 1, marginLeft: 6 }}>
                          <Text style={styles.notifWargaName}>{targetW.nama || t.namaWarga || 'Warga'}</Text>
                          <Text style={styles.notifWargaBlok}>
                            Blok {targetW.blok || 'A'}/{targetW.noRumah || '-'} • Periode {bulanNama} {t.tahun}
                          </Text>
                        </View>
                        <Text style={styles.notifNominal}>{formatRupiah(t.total)}</Text>
                      </View>

                      <View style={styles.notifActionRow}>
                        <TouchableOpacity
                          style={styles.notifDetailBtn}
                          onPress={() => {
                            setNotifModalOpen(false)
                            navigation?.navigate('DetailTagihan', { tagihan: t })
                          }}
                        >
                          <Eye size={13} color={colors.textSecondary} />
                          <Text style={styles.notifDetailBtnText}>Periksa</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.notifDetailBtn, { backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#FECDD3' }]}
                          onPress={() => handleRejectIpl(t.id, targetW.nama)}
                        >
                          <X size={13} color={colors.danger} />
                          <Text style={[styles.notifDetailBtnText, { color: colors.danger }]}>Tolak</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.notifApproveBtn}
                          onPress={() => handleApproveIpl(t.id, targetW.nama)}
                        >
                          <Check size={13} color={colors.white} />
                          <Text style={styles.notifApproveBtnText}>Setujui Lunas</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )
                })}

                {/* Tagihan Event / Lomba */}
                {pendingEvents.map((te) => {
                  const targetW = (warga || []).find((w) => w.id === te.wargaId) || {}
                  const ev = (events || []).find((e) => e.id === te.eventId) || {}

                  return (
                    <View key={te.id} style={[styles.notifCard, { borderColor: '#FECACA', backgroundColor: '#FEF2F2' }]}>
                      <View style={styles.notifCardHeader}>
                        <View style={[styles.notifBadgeIpl, { backgroundColor: '#FEE2E2' }]}>
                          <Trophy size={14} color="#DC2626" />
                          <Text style={[styles.notifBadgeTextIpl, { color: '#DC2626' }]}>Iuran</Text>
                        </View>
                        <View style={{ flex: 1, marginLeft: 6 }}>
                          <Text style={styles.notifWargaName}>{targetW.nama || 'Warga'}</Text>
                          <Text style={styles.notifWargaBlok}>
                            Blok {targetW.blok || 'A'}/{targetW.noRumah || '-'} • {ev.judul || 'Iuran Kegiatan'}
                          </Text>
                        </View>
                        <Text style={[styles.notifNominal, { color: '#DC2626' }]}>
                          {formatRupiah(ev.nominalPerKK || 0)}
                        </Text>
                      </View>

                      <View style={styles.notifActionRow}>
                        <TouchableOpacity
                          style={styles.notifDetailBtn}
                          onPress={() => {
                            setNotifModalOpen(false)
                            navigation?.navigate('Events', { eventId: ev.id })
                          }}
                        >
                          <Eye size={13} color={colors.textSecondary} />
                          <Text style={styles.notifDetailBtnText}>Buka</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.notifDetailBtn, { backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#FECDD3' }]}
                          onPress={() => handleRejectEvent(te.id, targetW.nama, ev.judul)}
                        >
                          <X size={13} color={colors.danger} />
                          <Text style={[styles.notifDetailBtnText, { color: colors.danger }]}>Tolak</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.notifApproveBtn, { backgroundColor: colors.success }]}
                          onPress={() => handleApproveEvent(te.id, targetW.nama, ev.judul)}
                        >
                          <Check size={13} color={colors.white} />
                          <Text style={styles.notifApproveBtnText}>Setujui Lunas</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )
                })}
              </View>
            )}
          </View>
        )}
      </AppModal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    ...shadows.soft
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  backButton: {
    padding: 6,
    marginRight: 6
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft
  },
  titleCol: {
    flex: 1,
    minWidth: 0
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  appName: {
    fontSize: 16.5,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: -0.3
  },
  rolePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.24)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6
  },
  rolePillText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: 0.5
  },
  subtitle: {
    fontSize: 11.5,
    color: 'rgba(255, 255, 255, 0.90)',
    fontWeight: '500',
    marginTop: 1
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative'
  },
  bellBadgeDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: colors.primary
  },
  bellBadgeText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: '800'
  },
  modeToggleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)'
  },
  modeToggleChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.white
  },
  curveEdge: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'transparent'
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 3,
    marginBottom: 12
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8
  },
  tabButtonActive: {
    backgroundColor: colors.white,
    ...shadows.soft
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '800'
  },
  tabBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 10
  },
  tabBadgeActive: {
    backgroundColor: colors.primary
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textSecondary
  },
  tabBadgeTextActive: {
    color: colors.white
  },
  notifItemCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12
  },
  notifItemUnread: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0'
  },
  notifHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  notifIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginTop: 1
  },
  notifCategoryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1
  },
  notifCategoryText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.2
  },
  notifTime: {
    fontSize: 10.5,
    color: colors.textTertiary,
    fontWeight: '500'
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.primary
  },
  notifTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 4
  },
  notifTitleUnread: {
    fontWeight: '800',
    color: '#064E3B'
  },
  notifMsg: {
    fontSize: 11.5,
    color: colors.textSecondary,
    lineHeight: 16,
    marginTop: 2
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10
  },
  emptyTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: colors.textPrimary
  },
  emptyDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 16,
    lineHeight: 17
  },
  modalFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%'
  },
  footerMarkAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 8
  },
  footerMarkAllBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.primary
  },
  modalSectionHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 4
  },
  notifCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 12
  },
  notifCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  notifBadgeIpl: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3
  },
  notifBadgeTextIpl: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309'
  },
  notifWargaName: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary
  },
  notifWargaBlok: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1
  },
  notifNominal: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary
  },
  notifActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)'
  },
  notifDetailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9'
  },
  notifDetailBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary
  },
  notifApproveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.success
  },
  notifApproveBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.white
  }
})
