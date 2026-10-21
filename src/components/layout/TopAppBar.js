import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  Building2,
  Bell,
  Menu,
  ArrowLeft,
  Repeat
} from 'lucide-react-native'
import { useApp } from '../../context/AppContext'
import { colors, shadows } from '../../utils/theme'
import { isNotificationRelevantForUser } from '../../services/notificationService'

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
    scopedTagihan,
    tagihanEvents,
    warga,
    scopedWarga,
    notifications,
    isWarga,
    isRT,
    isRW,
    isBendahara,
    isPengurus,
    hasDualRole,
    activeMode,
    toggleActiveMode,
    jabatanShortLabel
  } = useApp()

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
    typeof isNotificationRelevantForUser === 'function'
      ? isNotificationRelevantForUser(n, currentUser, currentWarga)
      : true
  )
  const unreadNotifs = relevantNotifs.filter((n) => !n.read)
  const unpaidWargaBills = isWarga
    ? (scopedTagihan || []).filter(
        (t) => t.status === 'Belum Bayar' || t.status === 'Jatuh Tempo' || t.status === 'Perlu Diperbaiki'
      ).length
    : 0
  const totalBadgeCount = isWarga
    ? Math.max(unreadNotifs.length, unpaidWargaBills)
    : (unreadNotifs.length + totalPending)
  const hasNotif = totalBadgeCount > 0

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
            onPress={() => navigation?.navigate('Notifikasi')}
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
    letterSpacing: -0.3,
    flexShrink: 1
  },
  rolePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.24)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    flexShrink: 0
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
  }
})
