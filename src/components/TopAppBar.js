import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, ScrollView, Alert } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Building2, Bell, Menu, ArrowLeft, Check, X, Clock, Eye, CheckCircle2, Trophy, Receipt, ShieldCheck, UserPlus } from 'lucide-react-native'
import { useApp } from '../context/AppContext'
import { colors, shadows, radius, spacing } from '../utils/theme'
import { formatRupiah, NAMA_BULAN } from '../utils/formatters'
import AppModal from './AppModal'
import AppButton from './AppButton'

export default function TopAppBar({ title, navigation, showBack = false }) {
  const insets = useSafeAreaInsets()
  const {
    currentUser,
    currentRT,
    events,
    scopedEvents,
    scopedTagihan,
    tagihanEvents,
    warga,
    scopedWarga,
    verifikasiTagihan,
    bayarTagihanEvent,
    tolakTagihanEvent,
    verifikasiWargaBaru,
    notifications
  } = useApp()

  const [notifModalOpen, setNotifModalOpen] = useState(false)

  const isWarga = currentUser?.role === 'warga'
  const isRT = currentUser?.role === 'rt'
  const isAdmin = currentUser?.role === 'admin'

  const roleLabel =
    isAdmin
      ? 'ADMIN RW'
      : isRT
      ? currentRT?.name || 'RT 01'
      : 'WARGA'

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
  const hasNotif = !isWarga ? totalPending > 0 : (notifications?.length || 0) > 0

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

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      <View style={styles.contentRow}>
        {showBack ? (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation?.goBack()}
            activeOpacity={0.8}
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
          {/* Lonceng Notifikasi & Persetujuan */}
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => {
              if (isWarga) {
                navigation?.navigate('Events')
              } else {
                setNotifModalOpen(true)
              }
            }}
            activeOpacity={0.8}
          >
            <Bell size={20} color={colors.white} />
            {hasNotif && (
              <View style={styles.bellBadgeDot}>
                {!isWarga && totalPending > 0 && (
                  <Text style={styles.bellBadgeText}>
                    {totalPending > 9 ? '9+' : totalPending}
                  </Text>
                )}
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
          >
            <Menu size={20} color={colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Decorative subtle curve bottom edge */}
      <View style={styles.curveEdge} />

      {/* MODAL PERSETUJUAN PEMBAYARAN WARGA DARI LONCENG (ADMIN/RT) */}
      {!isWarga && (
        <AppModal
          visible={notifModalOpen}
          title="Pemberitahuan & Persetujuan"
          subtitle={`${totalPending} pembayaran warga butuh ACC Lunas`}
          onClose={() => setNotifModalOpen(false)}
          footer={
            <AppButton
              title="Tutup"
              variant="secondary"
              onPress={() => setNotifModalOpen(false)}
            />
          }
        >
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
                  <View key={te.id} style={[styles.notifCard, { borderColor: '#E9D5FF', backgroundColor: '#FAF5FF' }]}>
                    <View style={styles.notifCardHeader}>
                      <View style={[styles.notifBadgeIpl, { backgroundColor: '#F3E8FF' }]}>
                        <Trophy size={14} color="#7E22CE" />
                        <Text style={[styles.notifBadgeTextIpl, { color: '#7E22CE' }]}>Acara</Text>
                      </View>
                      <View style={{ flex: 1, marginLeft: 6 }}>
                        <Text style={styles.notifWargaName}>{targetW.nama || 'Warga'}</Text>
                        <Text style={styles.notifWargaBlok}>
                          Blok {targetW.blok || 'A'}/{targetW.noRumah || '-'} • {ev.judul || 'Kegiatan'}
                        </Text>
                      </View>
                      <Text style={[styles.notifNominal, { color: '#7E22CE' }]}>
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
        </AppModal>
      )}
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
    ...shadows.redGlow
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
    gap: 10,
    flex: 1
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft
  },
  titleCol: {
    flex: 1
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  appName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: -0.3
  },
  rolePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6
  },
  rolePillText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: 0.5
  },
  subtitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '500',
    marginTop: 1
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: colors.primary
  },
  bellBadgeText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: '800'
  },
  curveEdge: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'transparent'
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary
  },
  emptyDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 20
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
