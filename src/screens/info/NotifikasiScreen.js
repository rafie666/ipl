import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  StatusBar
} from 'react-native'
import {
  Bell,
  CheckCircle2,
  Clock,
  Eye,
  Check,
  X,
  CreditCard,
  FileText,
  AlertCircle,
  Megaphone,
  UserPlus,
  Trophy,
  Receipt,
  ChevronRight,
  Inbox,
  Sparkles,
  Filter
} from 'lucide-react-native'
import { useApp } from '../../context/AppContext'
import AppHeader from '../../components/layout/AppHeader'
import AppCard from '../../components/shared/AppCard'
import { colors, typography, spacing, radius, shadows } from '../../utils/theme'
import { formatRupiah, NAMA_BULAN, formatTimeAgo } from '../../utils/formatters'
import { isNotificationRelevantForUser } from '../../services/notificationService'

export default function NotifikasiScreen({ navigation, route }) {
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
    surat,
    scopedSurat,
    pengaduan,
    scopedPengaduan,
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
    isAdmin
  } = useApp()

  const initialTab = route?.params?.tab || 'notif'
  const [activeTab, setActiveTab] = useState(initialTab) // 'notif' | 'pending'
  const [categoryFilter, setCategoryFilter] = useState('all') // 'all' | 'tagihan' | 'surat' | 'pengaduan' | 'event'
  const [refreshing, setRefreshing] = useState(false)

  // Otomatis tandai semua notifikasi terbaca saat screen ini dibuka/difokuskan
  const markAllRef = useRef(markAllNotificationsRead)
  markAllRef.current = markAllNotificationsRead

  useEffect(() => {
    if (typeof markAllRef.current === 'function') {
      markAllRef.current().catch(() => {})
    }
    const unsub = navigation?.addListener?.('focus', () => {
      if (typeof markAllRef.current === 'function') {
        markAllRef.current().catch(() => {})
      }
    })
    return unsub
  }, [navigation])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      if (typeof markAllRef.current === 'function') {
        await markAllRef.current()
      }
    } catch (_) {}
    setRefreshing(false)
  }, [])

  // 1. Pendaftaran Warga Baru butuh ACC
  const pendingWarga = useMemo(() => {
    return (scopedWarga || warga || []).filter((w) => {
      if (w.statusApproval !== 'Menunggu Verifikasi') return false
      if (isRT) return w.rt_id === currentRT?.id || !w.rt_id
      return true
    })
  }, [scopedWarga, warga, isRT, currentRT])

  // 2. Tagihan IPL butuh ACC
  const pendingIpl = useMemo(() => {
    return (scopedTagihan || []).filter((t) => t.status === 'Menunggu Verifikasi')
  }, [scopedTagihan])

  // 3. Tagihan Event butuh ACC
  const pendingEvents = useMemo(() => {
    return (tagihanEvents || []).filter((te) => {
      if (te.status !== 'Menunggu Verifikasi') return false
      const ev = (events || []).find((e) => e.id === te.eventId)
      if (isRT && ev?.scope === 'rt') {
        return ev.targetRtId === currentRT?.id || ev.rt_id === currentRT?.id
      }
      return true
    })
  }, [tagihanEvents, events, isRT, currentRT])

  const totalPending = pendingIpl.length + pendingEvents.length + pendingWarga.length

  // Notifikasi khusus warga (fokus pada yang penting, ringkas, padat)
  const relevantNotifs = useMemo(() => {
    try {
      if (isWarga) {
        const result = []
        const seenKeys = new Set()

        // A. Tagihan IPL Warga yang perlu perhatian
        ;(scopedTagihan || []).forEach((t) => {
          if (!t || typeof t !== 'object') return
          const isUnpaid = t.status === 'Belum Bayar' || t.status === 'Jatuh Tempo'
          const isRevisi = t.status === 'Perlu Diperbaiki'
          const isPending = t.status === 'Menunggu Verifikasi'
          const isLunas = t.status === 'Lunas'

          const periodeStr =
            t.periode ||
            (t.bulan && t.tahun
              ? `${NAMA_BULAN[Number(t.bulan) - 1] || t.bulan} ${t.tahun}`
              : 'Bulan Ini')
          const nominalStr = formatRupiah(t.total || t.nominal || t.jumlah || 120000)

          if (isUnpaid) {
            const key = `bill-unpaid-${t.id}`
            if (!seenKeys.has(key)) {
              seenKeys.add(key)
              result.push({
                id: key,
                tagihanId: t.id,
                type: 'tagihan',
                statusTagihan: t.status,
                title: `IPL ${periodeStr}: Belum Bayar`,
                message: `${nominalStr} • ${
                  t.status === 'Jatuh Tempo'
                    ? 'Jatuh tempo terlewati'
                    : `Jatuh tempo tgl ${t.jatuhTempo || 20}`
                }. Ketuk untuk bayar.`,
                created_at: t.created_at || new Date().toISOString(),
                priority: 1,
                read: false
              })
            }
          } else if (isRevisi) {
            const key = `bill-revisi-${t.id}`
            if (!seenKeys.has(key)) {
              seenKeys.add(key)
              result.push({
                id: key,
                tagihanId: t.id,
                type: 'payment_rejected',
                statusTagihan: 'Perlu Diperbaiki',
                title: `Bukti Bayar IPL: Perlu Revisi`,
                message: `Bukti transfer ditolak. Ketuk untuk upload ulang.`,
                created_at: t.updated_at || t.created_at || new Date().toISOString(),
                priority: 1,
                read: false
              })
            }
          } else if (isPending) {
            const key = `bill-pending-${t.id}`
            if (!seenKeys.has(key)) {
              seenKeys.add(key)
              result.push({
                id: key,
                tagihanId: t.id,
                type: 'payment_submitted',
                statusTagihan: 'Menunggu Verifikasi',
                title: `IPL ${periodeStr}: Sedang Diverifikasi`,
                message: `Bukti pembayaran sedang dicek bendahara RT.`,
                created_at: t.tanggalBayar || t.updated_at || new Date().toISOString(),
                priority: 2,
                read: false
              })
            }
          } else if (isLunas) {
            // Tagihan lunas terbaru
            const key = `bill-lunas-${t.id}`
            if (!seenKeys.has(key)) {
              seenKeys.add(key)
              result.push({
                id: key,
                tagihanId: t.id,
                type: 'payment_verified',
                statusTagihan: 'Lunas',
                title: `IPL ${periodeStr}: Lunas`,
                message: `${nominalStr} terverifikasi. Kuitansi resmi tersedia.`,
                created_at: t.tanggalVerifikasi || t.tanggalBayar || t.created_at || new Date().toISOString(),
                priority: 3,
                read: true
              })
            }
          }
        })

        // B. Surat Pengantar Warga (Selesai, Ditolak, atau Diproses)
        ;(scopedSurat || []).forEach((s) => {
          if (!s || typeof s !== 'object') return
          const key = `surat-${s.id}`
          if (!seenKeys.has(key)) {
            seenKeys.add(key)
            const isDone = s.status === 'Selesai' || s.status === 'Disetujui'
            const isRej = s.status === 'Ditolak'
            result.push({
              id: key,
              suratId: s.id,
              type: 'surat',
              title: `Surat ${s.jenisSurat || s.keperluan || 'Pengantar'}: ${s.status || 'Diproses'}`,
              message: isDone
                ? 'Telah disetujui RT. Dokumen siap diambil/diunduh.'
                : isRej
                ? `Permohonan ditolak: ${s.catatan || 'Data tidak lengkap'}.`
                : 'Sedang ditinjau oleh pengurus RT.',
              created_at: s.updated_at || s.tanggal || s.created_at || new Date().toISOString(),
              priority: isDone || isRej ? 2 : 4,
              read: isDone
            })
          }
        })

        // C. Pengaduan Warga (Selesai atau Diproses)
        ;(scopedPengaduan || []).forEach((p) => {
          if (!p || typeof p !== 'object') return
          const key = `aduan-${p.id}`
          if (!seenKeys.has(key)) {
            seenKeys.add(key)
            const isDone = p.status === 'Selesai'
            let tanggapanStr = ''
            if (typeof p.tanggapan === 'string') {
              tanggapanStr = p.tanggapan
            } else if (p.tanggapan && typeof p.tanggapan === 'object' && p.tanggapan.pesan) {
              tanggapanStr = String(p.tanggapan.pesan)
            }
            result.push({
              id: key,
              aduanId: p.id,
              type: 'pengaduan',
              title: `Aduan ${p.kategori || 'Warga'}: ${p.status || 'Terkirim'}`,
              message: tanggapanStr
                ? `Tanggapan: "${tanggapanStr.slice(0, 50)}${tanggapanStr.length > 50 ? '...' : ''}"`
                : isDone
                ? 'Laporan aduan selesai ditindaklanjuti pengurus.'
                : 'Laporan aduan sedang ditangani pengurus RT.',
              created_at: p.updated_at || p.created_at || new Date().toISOString(),
              priority: 3,
              read: isDone
            })
          }
        })

        // D. Pengumuman / Kegiatan Lingkungan
        ;(scopedEvents || events || []).slice(0, 2).forEach((e) => {
          if (!e || typeof e !== 'object') return
          const key = `event-${e.id}`
          if (!seenKeys.has(key)) {
            seenKeys.add(key)
            result.push({
              id: key,
              eventId: e.id,
              type: 'event',
              title: `${e.judul || e.title || 'Agenda Lingkungan'}`,
              message: `${e.tanggal || e.date || 'Waktu mendatang'} • ${e.lokasi || 'Lingkungan RT'}.`,
              created_at: e.created_at || new Date().toISOString(),
              priority: 4,
              read: true
            })
          }
        })

        // E. Notifikasi tersimpan khusus warga ini
        ;(notifications || []).forEach((n) => {
          if (!n || typeof n !== 'object') return
          if (
            n.type === 'REGISTRATION_PENDING' ||
            n.targetRole === 'rt' ||
            n.targetRole === 'rw' ||
            n.targetRole === 'bendahara' ||
            n.targetRole === 'admin'
          ) {
            return
          }

          const isMine =
            (n.residentId && (n.residentId === currentWarga?.id || n.residentId === currentUser?.resident_id)) ||
            (n.userId && (n.userId === currentUser?.id || n.userId === `u-${currentUser?.resident_id}`)) ||
            (n.targetRole === 'warga' || n.targetRole === 'all')

          if (!isMine) return

          if (n.tagihanId && seenKeys.has(`bill-lunas-${n.tagihanId}`)) return
          if (n.tagihanId && seenKeys.has(`bill-unpaid-${n.tagihanId}`)) return
          if (n.suratId && seenKeys.has(`surat-${n.suratId}`)) return
          if (n.aduanId && seenKeys.has(`aduan-${n.aduanId}`)) return

          const key = n.id || `notif-${Math.random()}`
          if (!seenKeys.has(key)) {
            seenKeys.add(key)

            let condensedTitle = String(n.title || 'Pemberitahuan')
              .replace(/[✅⚡❌⚠️🔔📢📬📄💳📤🔴]/g, '')
              .replace(/Pemberitahuan Tagihan IPL/i, 'Tagihan IPL')
              .replace(/Tagihan Iuran Pengelolaan Lingkungan \(IPL\)/i, 'Tagihan IPL')
              .replace(/Pembayaran IPL Terverifikasi/i, 'IPL Lunas')
              .trim()

            let condensedMsg = String(n.message || '')
              .replace(/telah disetujui oleh Bendahara.*$/i, 'terverifikasi bendahara.')
              .replace(/telah BERHASIL diverifikasi secara otomatis oleh sistem Moota!/i, 'terverifikasi otomatis.')
              .replace(/Silakan periksa kembali dan upload bukti pembayaran yang benar\./i, 'Silakan upload ulang bukti.')
              .replace(/\s+/g, ' ')
              .trim()

            if (condensedMsg.length > 75) {
              condensedMsg = condensedMsg.slice(0, 72) + '...'
            }

            result.push({
              ...n,
              id: key,
              title: condensedTitle,
              message: condensedMsg,
              priority: 3
            })
          }
        })

        // Urutkan prioritas (1 paling penting di atas)
        result.sort((a, b) => {
          if (!a || !b) return 0
          if ((a.priority || 5) !== (b.priority || 5)) {
            return (a.priority || 5) - (b.priority || 5)
          }
          return new Date(b.created_at || 0) - new Date(a.created_at || 0)
        })

        return result
      }

      // Role Struktural / Pengurus
      return (notifications || []).filter((n) => {
        if (!n || typeof n !== 'object') return false
        return typeof isNotificationRelevantForUser === 'function'
          ? isNotificationRelevantForUser(n, currentUser, currentWarga)
          : true
      })
    } catch (err) {
      console.error('[NotifikasiScreen] relevantNotifs error:', err)
      return []
    }
  }, [
    isWarga,
    scopedTagihan,
    scopedSurat,
    scopedPengaduan,
    scopedEvents,
    events,
    notifications,
    currentUser,
    currentWarga
  ])

  const filteredNotifs = useMemo(() => {
    try {
      if (categoryFilter === 'all') return relevantNotifs || []
      return (relevantNotifs || []).filter((n) => {
        if (!n || typeof n !== 'object') return false
        const type = String(n.type || '')
        if (categoryFilter === 'tagihan') return type === 'tagihan' || type.startsWith('payment')
        if (categoryFilter === 'surat') return type === 'surat'
        if (categoryFilter === 'pengaduan') return type === 'pengaduan' || type === 'warning'
        if (categoryFilter === 'event') return type === 'event'
        return true
      })
    } catch (err) {
      console.error('[NotifikasiScreen] filteredNotifs error:', err)
      return []
    }
  }, [relevantNotifs, categoryFilter])

  // Handler Klik Item Notifikasi -> Navigasi ke Halaman yang Sesuai
  const handleNotifPress = async (item) => {
    if (!item.read) {
      await markNotificationRead(item.id)
    }

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

  // Handler Persetujuan Warga Baru
  const handleApproveWarga = (wId, residentName) => {
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

  // Handler Persetujuan IPL
  const handleApproveIpl = (tId, residentName) => {
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

  // Handler Persetujuan Event
  const handleApproveEvent = (teId, residentName, eventTitle) => {
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

  // Metadata visual untuk tiap tipe notifikasi
  const getNotifMeta = (item) => {
    try {
      const type = String(item?.type || '')
      if (type === 'tagihan' || type.startsWith('payment')) {
        const isVerified = type === 'payment_verified' || item?.statusTagihan === 'Lunas'
        const isRejected = type === 'payment_rejected' || item?.statusTagihan === 'Perlu Diperbaiki'
        const isPending = type === 'payment_submitted' || item?.statusTagihan === 'Menunggu Verifikasi'
        const isOverdue = item?.statusTagihan === 'Jatuh Tempo'

        if (isVerified) {
          return {
            label: 'IPL Lunas',
            badgeBg: '#ECFDF5',
            badgeBorder: '#A7F3D0',
            textColor: '#047857',
            IconComponent: CheckCircle2,
            iconColor: '#059669'
          }
        }
        if (isRejected) {
          return {
            label: 'Perlu Revisi',
            badgeBg: '#FEF2F2',
            badgeBorder: '#FECACA',
            textColor: '#DC2626',
            IconComponent: AlertCircle,
            iconColor: '#DC2626'
          }
        }
        if (isOverdue) {
          return {
            label: 'Jatuh Tempo',
            badgeBg: '#FEF3C7',
            badgeBorder: '#FCD34D',
            textColor: '#92400E',
            IconComponent: AlertCircle,
            iconColor: '#B45309'
          }
        }
        if (isPending) {
          return {
            label: 'Verifikasi',
            badgeBg: '#EFF6FF',
            badgeBorder: '#BFDBFE',
            textColor: '#2563EB',
            IconComponent: Clock,
            iconColor: '#2563EB'
          }
        }
        return {
          label: 'Tagihan IPL',
          badgeBg: '#FFFBEB',
          badgeBorder: '#FDE68A',
          textColor: '#B45309',
          IconComponent: CreditCard,
          iconColor: '#D97706'
        }
      }
      if (type === 'surat') {
        return {
          label: 'Surat',
          badgeBg: '#EFF6FF',
          badgeBorder: '#BFDBFE',
          textColor: '#1D4ED8',
          IconComponent: FileText,
          iconColor: '#2563EB'
        }
      }
      if (type === 'pengaduan' || type === 'warning') {
        return {
          label: 'Pengaduan',
          badgeBg: '#FFFBEB',
          badgeBorder: '#FDE68A',
          textColor: '#B45309',
          IconComponent: AlertCircle,
          iconColor: '#D97706'
        }
      }
      if (type === 'event') {
        return {
          label: 'Kegiatan RT',
          badgeBg: '#F5F3FF',
          badgeBorder: '#DDD6FE',
          textColor: '#6D28D9',
          IconComponent: Megaphone,
          iconColor: '#7C3AED'
        }
      }
      if (type === 'REGISTRATION_PENDING') {
        return {
          label: 'Warga Baru',
          badgeBg: '#F0F9FF',
          badgeBorder: '#BAE6FD',
          textColor: '#0369A1',
          IconComponent: UserPlus,
          iconColor: '#0284C7'
        }
      }
    } catch (metaErr) {
      console.warn('[getNotifMeta] error:', metaErr)
    }
    return {
      label: 'Info',
      badgeBg: '#F1F5F9',
      badgeBorder: '#E2E8F0',
      textColor: '#475569',
      IconComponent: Bell,
      iconColor: '#475569'
    }
  }

  const notifsCount = relevantNotifs?.length || 0
  const screenTitle = isWarga ? 'Pemberitahuan Warga' : 'Pemberitahuan & Persetujuan'
  const screenSubtitle = isWarga
    ? `${notifsCount} catatan penting warga`
    : `${notifsCount} info • ${totalPending} butuh persetujuan`

  try {
    return (
      <View style={styles.container}>
        <AppHeader
          title={screenTitle}
          subtitle={screenSubtitle}
          navigation={navigation}
          variant="primary"
        />

        {/* Segmented Tab: Khusus Pengurus / RT / RW / Bendahara / Admin */}
        {!isWarga && (
          <View style={styles.tabBarWrap}>
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tabButton, activeTab === 'notif' && styles.tabButtonActive]}
                onPress={() => setActiveTab('notif')}
                activeOpacity={0.8}
              >
                <Bell size={15} color={activeTab === 'notif' ? colors.primary : colors.textMuted} />
                <Text style={[styles.tabText, activeTab === 'notif' && styles.tabTextActive]}>
                  Pemberitahuan
                </Text>
                <View style={[styles.tabCountPill, activeTab === 'notif' && styles.tabCountPillActive]}>
                  <Text style={[styles.tabCountText, activeTab === 'notif' && styles.tabCountTextActive]}>
                    {notifsCount}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabButton, activeTab === 'pending' && styles.tabButtonActive]}
                onPress={() => setActiveTab('pending')}
                activeOpacity={0.8}
              >
                <CheckCircle2 size={15} color={activeTab === 'pending' ? colors.primary : colors.textMuted} />
                <Text style={[styles.tabText, activeTab === 'pending' && styles.tabTextActive]}>
                  Persetujuan Cepat
                </Text>
                {totalPending > 0 && (
                  <View style={styles.tabBadgeRed}>
                    <Text style={styles.tabBadgeRedText}>{totalPending}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        >
          {/* VIEW 1: TAB PEMBERITAHUAN */}
          {(isWarga || activeTab === 'notif') && (
            <View>
              {/* Filter Pills */}
              {notifsCount > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.filterRow}
                >
                  {[
                    { id: 'all', label: 'Semua' },
                    { id: 'tagihan', label: 'Tagihan & Bayar' },
                    { id: 'surat', label: 'Surat' },
                    { id: 'pengaduan', label: 'Pengaduan' },
                    { id: 'event', label: 'Kegiatan' }
                  ].map((f) => {
                    const isSelected = categoryFilter === f.id
                    return (
                      <TouchableOpacity
                        key={f.id}
                        style={[styles.filterChip, isSelected && styles.filterChipActive]}
                        onPress={() => setCategoryFilter(f.id)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                          {f.label}
                        </Text>
                      </TouchableOpacity>
                    )
                  })}
                </ScrollView>
              )}

              {filteredNotifs.length === 0 ? (
                <AppCard style={styles.emptyCard}>
                  <View style={styles.emptyIconCircle}>
                    <Inbox size={36} color={colors.primary} />
                  </View>
                  <Text style={styles.emptyTitle}>
                    {notifsCount === 0 ? 'Belum Ada Pemberitahuan' : 'Tidak Ada Data Sesuai Filter'}
                  </Text>
                  <Text style={styles.emptyDesc}>
                    {notifsCount === 0
                      ? (isWarga
                          ? 'Semua urusan iuran dan informasi lingkungan Anda saat ini sudah tertib dan up-to-date.'
                          : 'Pemberitahuan mengenai tagihan IPL, surat pengantar, aduan, dan agenda warga akan otomatis tampil di sini.')
                      : 'Coba pilih kategori filter lain untuk melihat riwayat pemberitahuan lainnya.'}
                  </Text>
                </AppCard>
              ) : (
                <View style={styles.notifList}>
                  {filteredNotifs.map((item, index) => {
                    if (!item) return null
                    const meta = getNotifMeta(item)
                    const IconComp = meta?.IconComponent || Bell
                    return (
                      <TouchableOpacity
                        key={item.id ? `${item.id}-${index}` : `notif-${index}`}
                        style={styles.notifCard}
                        onPress={() => handleNotifPress(item)}
                        activeOpacity={0.75}
                      >
                        <View style={styles.notifTopRow}>
                          <View style={[styles.notifIconWrap, { backgroundColor: meta.badgeBg, borderColor: meta.badgeBorder }]}>
                            <IconComp size={16} color={meta.iconColor} />
                          </View>
                          <View style={styles.notifBody}>
                            <View style={styles.notifMetaRow}>
                              <View style={[styles.notifCategoryBadge, { backgroundColor: meta.badgeBg, borderColor: meta.badgeBorder }]}>
                                <Text style={[styles.notifCategoryText, { color: meta.textColor }]}>
                                  {meta.label}
                                </Text>
                              </View>
                              <View style={styles.notifTimeWrap}>
                                <Clock size={11} color={colors.textMuted} />
                                <Text style={styles.notifTimeText}>
                                  {formatTimeAgo(item.created_at) || 'Baru saja'}
                                </Text>
                              </View>
                            </View>
                            <Text style={styles.notifTitle} numberOfLines={1}>
                              {String(item.title || '')}
                            </Text>
                            <Text style={styles.notifDesc} numberOfLines={2}>
                              {String(item.message || '')}
                            </Text>
                          </View>
                          <ChevronRight size={18} color={colors.textPlaceholder} style={styles.chevron} />
                        </View>
                      </TouchableOpacity>
                    )
                  })}
                </View>
              )}
            </View>
          )}

          {/* VIEW 2: TAB PERSETUJUAN CEPAT */}
          {!isWarga && activeTab === 'pending' && (
            <View>
              {totalPending === 0 ? (
                <AppCard style={styles.emptyCard}>
                  <View style={[styles.emptyIconCircle, { backgroundColor: '#ECFDF5' }]}>
                    <CheckCircle2 size={36} color={colors.primary} />
                  </View>
                  <Text style={styles.emptyTitle}>Semua Selesai Diverifikasi!</Text>
                  <Text style={styles.emptyDesc}>
                    Tidak ada permohonan pendaftaran warga baru maupun bukti pembayaran tagihan yang menunggu persetujuan.
                  </Text>
                </AppCard>
              ) : (
                <View style={{ gap: 14 }}>
                  <View style={styles.pendingHeaderBanner}>
                    <Sparkles size={16} color={colors.primary} />
                    <Text style={styles.pendingHeaderText}>
                      {totalPending} permohonan butuh persetujuan Anda:
                    </Text>
                  </View>

                  {/* 1. Pendaftaran Warga Baru */}
                  {pendingWarga.map((pw) => {
                    const rtObj = (rts || []).find((r) => r.id === pw.rt_id) || {}
                    return (
                      <AppCard key={pw.id} style={styles.approvalCard}>
                        <View style={styles.approvalHeader}>
                          <View style={[styles.approvalBadge, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
                            <UserPlus size={14} color="#1D4ED8" />
                            <Text style={[styles.approvalBadgeText, { color: "#1D4ED8" }]}>Warga Baru</Text>
                          </View>
                          <Text style={styles.approvalDateText}>
                            {formatTimeAgo(pw.created_at)}
                          </Text>
                        </View>

                        <View style={styles.approvalContentRow}>
                          <View style={styles.avatarMini}>
                            <Text style={styles.avatarMiniText}>{(pw.nama || 'W').charAt(0).toUpperCase()}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.approvalName} numberOfLines={1}>{pw.nama}</Text>
                            <Text style={styles.approvalSubtitle}>
                              Blok {pw.blok || 'A'}/{pw.noRumah || '-'} • {rtObj.name || 'RT 01'}
                            </Text>
                            <Text style={styles.approvalSubtitleSmall}>
                              HP: {pw.noHp || '-'} • NIK: {pw.nik || '-'}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.approvalBtnRow}>
                          <TouchableOpacity
                            style={styles.btnReject}
                            onPress={() => handleRejectWarga(pw.id, pw.nama)}
                            activeOpacity={0.7}
                          >
                            <X size={15} color="#DC2626" />
                            <Text style={styles.btnRejectText}>Tolak</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.btnApprove}
                            onPress={() => handleApproveWarga(pw.id, pw.nama)}
                            activeOpacity={0.7}
                          >
                            <Check size={15} color={colors.white} />
                            <Text style={styles.btnApproveText}>Setujui Pendaftaran</Text>
                          </TouchableOpacity>
                        </View>
                      </AppCard>
                    )
                  })}

                  {/* 2. Tagihan IPL */}
                  {pendingIpl.map((t) => {
                    const targetW = (warga || []).find((w) => w.id === t.wargaId) || {}
                    const bulanNama = NAMA_BULAN[(t.bulan || 1) - 1] || `Bulan ${t.bulan}`

                    return (
                      <AppCard key={t.id} style={styles.approvalCard}>
                        <View style={styles.approvalHeader}>
                          <View style={[styles.approvalBadge, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
                            <Receipt size={14} color="#B45309" />
                            <Text style={[styles.approvalBadgeText, { color: '#B45309' }]}>Tagihan IPL</Text>
                          </View>
                          <Text style={styles.approvalNominal}>{formatRupiah(t.total)}</Text>
                        </View>

                        <View style={styles.approvalContentRow}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.approvalName} numberOfLines={1}>
                              {targetW.nama || t.namaWarga || 'Warga'}
                            </Text>
                            <Text style={styles.approvalSubtitle}>
                              Blok {targetW.blok || 'A'}/{targetW.noRumah || '-'} • {bulanNama} {t.tahun}
                            </Text>
                            {t.buktiTransfer ? (
                              <Text style={styles.proofNoteText}>✓ Bukti transfer terlampir</Text>
                            ) : null}
                          </View>
                        </View>

                        <View style={styles.approvalBtnRow}>
                          <TouchableOpacity
                            style={styles.btnInspect}
                            onPress={() => navigation?.navigate('DetailTagihan', { tagihan: t })}
                            activeOpacity={0.7}
                          >
                            <Eye size={14} color={colors.textSecondary} />
                            <Text style={styles.btnInspectText}>Bukti</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.btnReject}
                            onPress={() => handleRejectIpl(t.id, targetW.nama)}
                            activeOpacity={0.7}
                          >
                            <X size={14} color="#DC2626" />
                            <Text style={styles.btnRejectText}>Tolak</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.btnApprove}
                            onPress={() => handleApproveIpl(t.id, targetW.nama)}
                            activeOpacity={0.7}
                          >
                            <Check size={14} color={colors.white} />
                            <Text style={styles.btnApproveText}>Setujui Lunas</Text>
                          </TouchableOpacity>
                        </View>
                      </AppCard>
                    )
                  })}

                  {/* 3. Tagihan Event */}
                  {pendingEvents.map((te) => {
                    const targetW = (warga || []).find((w) => w.id === te.wargaId) || {}
                    const ev = (events || []).find((e) => e.id === te.eventId) || {}

                    return (
                      <AppCard key={te.id} style={styles.approvalCard}>
                        <View style={styles.approvalHeader}>
                          <View style={[styles.approvalBadge, { backgroundColor: '#FEE2E2', borderColor: '#FECACA' }]}>
                            <Trophy size={14} color="#DC2626" />
                            <Text style={[styles.approvalBadgeText, { color: '#DC2626' }]}>Iuran Kegiatan</Text>
                          </View>
                          <Text style={[styles.approvalNominal, { color: '#DC2626' }]}>
                            {formatRupiah(ev.nominalPerKK || 0)}
                          </Text>
                        </View>

                        <View style={styles.approvalContentRow}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.approvalName} numberOfLines={1}>{targetW.nama || 'Warga'}</Text>
                            <Text style={styles.approvalSubtitle}>
                              Blok {targetW.blok || 'A'}/{targetW.noRumah || '-'} • {ev.judul || 'Iuran Kegiatan'}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.approvalBtnRow}>
                          <TouchableOpacity
                            style={styles.btnInspect}
                            onPress={() => navigation?.navigate('Events', { eventId: ev.id })}
                            activeOpacity={0.7}
                          >
                            <Eye size={14} color={colors.textSecondary} />
                            <Text style={styles.btnInspectText}>Detail</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.btnReject}
                            onPress={() => handleRejectEvent(te.id, targetW.nama, ev.judul)}
                            activeOpacity={0.7}
                          >
                            <X size={14} color="#DC2626" />
                            <Text style={styles.btnRejectText}>Tolak</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.btnApprove}
                            onPress={() => handleApproveEvent(te.id, targetW.nama, ev.judul)}
                            activeOpacity={0.7}
                          >
                            <Check size={14} color={colors.white} />
                            <Text style={styles.btnApproveText}>Setujui</Text>
                          </TouchableOpacity>
                        </View>
                      </AppCard>
                    )
                  })}
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </View>
    )
  } catch (renderError) {
    console.error('[NotifikasiScreen] Render error:', renderError)
    return (
      <View style={{ flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: colors.danger, marginBottom: 8 }}>
          Gagal Memuat Halaman Pemberitahuan
        </Text>
        <Text style={{ fontSize: 13, color: colors.textSecondary, textAlign: 'center' }}>
          {String(renderError?.message || renderError)}
        </Text>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  tabBarWrap: {
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0'
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 3,
    gap: 4
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 9,
    gap: 6
  },
  tabButtonActive: {
    backgroundColor: colors.surface,
    ...shadows.soft
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '700'
  },
  tabCountPill: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10
  },
  tabCountPillActive: {
    backgroundColor: '#ECFDF5'
  },
  tabCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted
  },
  tabCountTextActive: {
    color: colors.primary
  },
  tabBadgeRed: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10
  },
  tabBadgeRedText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.white
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 32
  },
  filterRow: {
    gap: 8,
    paddingBottom: 14
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary
  },
  filterChipTextActive: {
    color: colors.white,
    fontWeight: '700'
  },
  notifList: {
    gap: 10
  },
  notifCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.soft
  },
  notifTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  notifIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1
  },
  notifBody: {
    flex: 1,
    marginLeft: 12,
    marginRight: 6
  },
  notifMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  notifCategoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1
  },
  notifCategoryText: {
    fontSize: 11,
    fontWeight: '700'
  },
  notifTimeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  notifTimeText: {
    fontSize: 11,
    color: colors.textMuted
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 3
  },
  notifDesc: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.textSecondary
  },
  chevron: {
    marginTop: 10
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 36,
    paddingHorizontal: 20,
    marginTop: 10
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
    textAlign: 'center'
  },
  emptyDesc: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textMuted,
    textAlign: 'center'
  },
  pendingHeaderBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0'
  },
  pendingHeaderText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#064E3B'
  },
  approvalCard: {
    padding: 14,
    gap: 12
  },
  approvalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  approvalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1
  },
  approvalBadgeText: {
    fontSize: 11,
    fontWeight: '700'
  },
  approvalDateText: {
    fontSize: 11,
    color: colors.textMuted
  },
  approvalNominal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#B45309',
    fontVariant: ['tabular-nums']
  },
  approvalContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  avatarMini: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE'
  },
  avatarMiniText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1D4ED8'
  },
  approvalName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary
  },
  approvalSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2
  },
  approvalSubtitleSmall: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1
  },
  proofNoteText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 3
  },
  approvalBtnRow: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9'
  },
  btnInspect: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  btnInspectText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary
  },
  btnReject: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA'
  },
  btnRejectText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626'
  },
  btnApprove: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.primary
  },
  btnApproveText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white
  }
})
