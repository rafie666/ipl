import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  RefreshControl,
  Image,
  Modal,
  Linking
} from 'react-native'
import {
  Trophy,
  Calendar,
  Users,
  DollarSign,
  Plus,
  MapPin,
  Clock,
  Trash2,
  Receipt,
  CheckCircle2,
  CreditCard,
  QrCode,
  Copy,
  Megaphone,
  User,
  FileText,
  Sparkles,
  ChevronDown,
  Check,
  Upload,
  Camera,
  Image as ImageIcon,
  X,
  RefreshCw,
  Search,
  MessageCircle,
  AlertCircle,
  Coins,
  Wallet,
  Award
} from 'lucide-react-native'
import * as ImagePicker from 'expo-image-picker'
import { useApp } from '../context/AppContext'
import { copyToClipboard } from '../utils/clipboard'
import AppHeader from '../components/AppHeader'
import AppCard from '../components/AppCard'
import AppBadge from '../components/AppBadge'
import AppButton from '../components/AppButton'
import AppModal from '../components/AppModal'
import { colors, typography, spacing, radius, shadows } from '../utils/theme'
import { formatRupiah, formatTanggalIndo, generateWaEvent } from '../utils/formatters'

const KATEGORI_EVENT = ['Iuran 17-an', 'Iuran Lomba', 'Iuran Kerja Bakti', 'PHBI', 'Sosial', 'Fasilitas', 'Pengumuman', 'Surat Edaran', 'Lain-lain']

export default function EventsScreen({ route, navigation }) {
  const {
    events,
    scopedEvents,
    isAdminLoggedIn,
    isWarga,
    isRT,
    isAdmin,
    currentRT,
    currentRW,
    currentWarga,
    currentUser,
    warga,
    scopedWarga,
    config,
    rts,
    bankAccounts,
    qrisAccounts,
    refreshData,
    refreshing,
    tambahEvent,
    hapusEvent,
    tagihanEvents,
    generateTagihanEventMassal,
    bayarTagihanEvent,
    tolakTagihanEvent
  } = useApp()

  const activeRT = currentRT || (rts || []).find((r) => r.id === (currentUser?.rt_id || 'rt-01-01')) || rts?.[0]
  const listEvents = scopedEvents || []
  const availableWarga = (isRT ? scopedWarga : warga) || []

  // Modal States
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [billingModalOpen, setBillingModalOpen] = useState(false)
  const [billingFilterStatus, setBillingFilterStatus] = useState('Semua') // 'Semua' | 'Belum Bayar' | 'Menunggu Verifikasi' | 'Lunas'
  const [billingSearchQuery, setBillingSearchQuery] = useState('')
  const [selectedBillingDetail, setSelectedBillingDetail] = useState(null)
  const [billingDetailModalOpen, setBillingDetailModalOpen] = useState(false)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedDetailEvent, setSelectedDetailEvent] = useState(null)

  // Modal Bayar Event (Warga)
  const [payEventModalOpen, setPayEventModalOpen] = useState(false)
  const [payEventTarget, setPayEventTarget] = useState(null)
  const [payMetode, setPayMetode] = useState('Transfer') // 'Transfer' | 'QRIS' | 'Cash'
  const [payBuktiRef, setPayBuktiRef] = useState('')
  const [payBuktiFotoUrl, setPayBuktiFotoUrl] = useState('')
  const [qrisZoomModalOpen, setQrisZoomModalOpen] = useState(false)
  const [eventSelectedImage, setEventSelectedImage] = useState(null)
  const [eventPickerModalOpen, setEventPickerModalOpen] = useState(false)

  const handlePickEventGallery = () => {
    setEventPickerModalOpen(false)
    setTimeout(async () => {
      try {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
        if (status !== 'granted') {
          Alert.alert('IZIN AKSES FOTO DIBUTUHKAN', 'Aplikasi membutuhkan izin galeri foto untuk memilih bukti transfer.')
          return
        }
        const res = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 0.7,
          base64: true
        })
        if (!res.canceled && res.assets && res.assets.length > 0) {
          processEventImage(res.assets[0])
        }
      } catch (err) {
        Alert.alert('Error', 'Gagal membuka galeri: ' + (err.message || 'Error'))
      }
    }, 250)
  }

  const handleTakeEventPhoto = () => {
    setEventPickerModalOpen(false)
    setTimeout(async () => {
      try {
        const { status } = await ImagePicker.requestCameraPermissionsAsync()
        if (status !== 'granted') {
          Alert.alert('IZIN AKSES KAMERA DIBUTUHKAN', 'Aplikasi membutuhkan izin kamera untuk mengambil foto bukti transfer.')
          return
        }
        const res = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          quality: 0.7,
          base64: true
        })
        if (!res.canceled && res.assets && res.assets.length > 0) {
          processEventImage(res.assets[0])
        }
      } catch (err) {
        Alert.alert('Error', 'Gagal membuka kamera: ' + (err.message || 'Error'))
      }
    }, 250)
  }

  const processEventImage = (asset) => {
    if (!asset || !asset.uri) {
      Alert.alert('Error', 'Foto tidak terbaca, silakan coba lagi.')
      return
    }

    if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
      Alert.alert('Validasi Gagal', 'Bukti pembayaran maksimal 5 MB.')
      return
    }

    const uri = asset.uri || ''
    const generatedName = `bukti_event_${Date.now()}.jpg`
    const fileName = asset.fileName || uri.split('/').pop() || generatedName
    const calculatedSize = asset.fileSize ? `${(asset.fileSize / (1024 * 1024)).toFixed(2)} MB` : '1.18 MB'

    const imagePayload = asset.base64
      ? (asset.base64.startsWith('data:') ? asset.base64 : `data:image/jpeg;base64,${asset.base64}`)
      : asset.uri

    const imgData = {
      uri: asset.uri,
      fileName: fileName,
      fileSize: calculatedSize,
      base64: imagePayload
    }
    setEventSelectedImage(imgData)
    setPayBuktiFotoUrl(imagePayload)
  }

  // Form state
  const [tipePengumuman, setTipePengumuman] = useState('info') // 'info' | 'iuran'
  const [targetType, setTargetType] = useState('all') // 'all' | 'personal'
  const [targetWargaId, setTargetWargaId] = useState('')
  const [judul, setJudul] = useState('')
  const [kategori, setKategori] = useState('Pengumuman')
  const [scope, setScope] = useState(isRT ? 'rt' : 'rw')
  const [targetRtId, setTargetRtId] = useState(isRT ? (activeRT?.id || 'rt-01-01') : (rts?.[0]?.id || 'rt-01-01'))
  const [nominalPerKK, setNominalPerKK] = useState('')
  const [batasTanggal, setBatasTanggal] = useState(new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10))
  const [deskripsi, setDeskripsi] = useState('')
  const [autoHapus, setAutoHapus] = useState(false)
  const [expiredDate, setExpiredDate] = useState(new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10))
  const [expiredTime, setExpiredTime] = useState('23:59')

  useEffect(() => {
    if (route?.params?.eventId && listEvents?.length) {
      const ev = listEvents.find((e) => e.id === route.params.eventId)
      if (ev) {
        setSelectedDetailEvent(ev)
        setDetailModalOpen(true)
      }
    }
  }, [route?.params?.eventId, listEvents])

  const resetForm = () => {
    setTipePengumuman('info')
    setTargetType('all')
    setTargetWargaId(availableWarga[0]?.id || '')
    setJudul('')
    setKategori('Pengumuman')
    setScope(isRT ? 'rt' : 'rw')
    setTargetRtId(isRT ? (activeRT?.id || 'rt-01-01') : (rts?.[0]?.id || 'rt-01-01'))
    setNominalPerKK('')
    const defaultDate = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10)
    setBatasTanggal(defaultDate)
    setDeskripsi('')
    setAutoHapus(false)
    setExpiredDate(defaultDate)
    setExpiredTime('23:59')
  }

  const handleTambah = async () => {
    if (!judul.trim()) {
      Alert.alert('Perhatian', 'Judul iuran kegiatan wajib diisi!')
      return
    }
    if (targetType === 'personal' && !targetWargaId) {
      Alert.alert('Perhatian', 'Silakan pilih nama warga penerima pesan perorangan!')
      return
    }

    const finalScope = isRT ? 'rt' : scope
    const finalRtId = isRT ? (activeRT?.id || 'rt-01-01') : (finalScope === 'rt' ? targetRtId : null)
    const finalNominal = tipePengumuman === 'iuran' ? (Number(nominalPerKK) || 0) : 0

    let finalExpiredAt = null
    if (autoHapus) {
      const eDate = expiredDate || batasTanggal || new Date().toISOString().slice(0, 10)
      const eTime = expiredTime || '23:59'
      finalExpiredAt = `${eDate}T${eTime}:00`
    }

    setLoading(true)
    try {
      await tambahEvent({
        judul: judul.trim(),
        kategori,
        scope: finalScope,
        rt_id: finalRtId,
        targetType,
        targetWargaId: targetType === 'personal' ? targetWargaId : null,
        nominalPerKK: finalNominal,
        tipePengumuman,
        batasTanggal: batasTanggal || new Date().toISOString().slice(0, 10),
        tanggal: batasTanggal || new Date().toISOString().slice(0, 10),
        deskripsi: deskripsi.trim(),
        autoHapus,
        expiredAt: finalExpiredAt
      })
      setModalOpen(false)
      resetForm()
      Alert.alert('Sukses', targetType === 'personal' ? 'Iuran khusus perorangan berhasil dikirim!' : 'Iuran Kegiatan berhasil diterbitkan!')
    } catch (e) {
      Alert.alert('Error', 'Gagal menambahkan pengumuman.')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateMassal = async (event) => {
    if (!event.nominalPerKK && event.nominalPerKK !== 0) {
      Alert.alert('Tidak Ada Nominal', 'Event ini tidak memiliki nominal iuran per KK.')
      return
    }
    const count = await generateTagihanEventMassal(event.id)
    if (count === 0) {
      Alert.alert('Info', 'Semua tagihan event sudah dibuat sebelumnya.')
    } else {
      Alert.alert('Sukses', `${count} tagihan event berhasil dibuat!`)
    }
  }

  const handleBayarEvent = (te) => {
    Alert.alert(
      'Konfirmasi Pelunasan Iuran',
      `Setujui dan tandai iuran warga ${warga.find((w) => w.id === te.wargaId)?.nama || 'warga'} sebagai LUNAS?`,
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Setujui (Tunai)', onPress: () => bayarTagihanEvent(te.id, { status: 'Lunas', isAdminVerify: true, metodeBayar: 'Tunai' }) },
        { text: 'Setujui (Transfer)', onPress: () => bayarTagihanEvent(te.id, { status: 'Lunas', isAdminVerify: true, metodeBayar: 'Transfer Bank' }) }
      ]
    )
  }

  const handleWargaKirimBuktiEvent = async () => {
    if (!payEventTarget) return
    const targetWId = currentWarga?.id || currentUser?.resident_id || warga[0]?.id
    const existingTE = tagihanEvents?.find(te => te.eventId === payEventTarget.id && te.wargaId === targetWId)
    
    if (payMetode !== 'Cash' && !payBuktiFotoUrl) {
      Alert.alert(
        'Bukti Pembayaran Wajib Dilampirkan',
        'Mohon lampirkan foto struk / tangkapan layar bukti transfer atau scan QRIS Anda terlebih dahulu sebelum mengirim konfirmasi!'
      )
      return
    }

    setLoading(true)
    try {
      if (existingTE) {
        await bayarTagihanEvent(existingTE.id, {
          status: 'Menunggu Verifikasi',
          metodeBayar: payMetode,
          buktiBayar: payBuktiRef || 'TRX-EVT-' + Math.floor(100000 + Math.random() * 900000),
          buktiFoto: payBuktiFotoUrl || null,
          buktiTransferUrl: payBuktiFotoUrl || null
        })
      }
      setPayEventModalOpen(false)
      setPayBuktiRef('')
      setPayBuktiFotoUrl('')
      setEventSelectedImage(null)
      Alert.alert(
        'BUKTI PEMBAYARAN TERKIRIM 📤',
        'Bukti pembayaran berhasil dikirim. Status saat ini "MENUNGGU VERIFIKASI" dan akan dicatat Lunas setelah disetujui oleh pengurus RT/RW.'
      )
    } catch (e) {
      Alert.alert('Error', 'Gagal mengirim bukti pembayaran.')
    } finally {
      setLoading(false)
    }
  }

  const handleHapus = (item) => {
    Alert.alert(
      'Hapus Iuran Kegiatan',
      `Yakin ingin menghapus iuran kegiatan "${item.judul || item.nama}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Hapus', style: 'destructive', onPress: () => hapusEvent(item.id) }
      ]
    )
  }

  const handleCopyText = async (text, label) => {
    await copyToClipboard(text)
    Alert.alert('Tersalin', `${label} "${text}" berhasil disalin ke clipboard!`)
  }

  const renderItem = ({ item }) => {
    const isRw = item.scope === 'rw' || item.level === 'rw'
    const eventBills = tagihanEvents?.filter((te) => te.eventId === item.id) || []
    const paidBills = eventBills.filter((te) => te.status === 'Lunas')
    const paidCount = paidBills.length
    const pendingCount = eventBills.filter((te) => te.status === 'Menunggu Verifikasi').length
    const totalBills = eventBills.length
    const totalCollected = paidBills.reduce((sum, te) => sum + (Number(te.nominal) || Number(item.nominalPerKK) || 0), 0)
    const targetTotal = totalBills > 0 ? (totalBills * (Number(item.nominalPerKK) || 0)) : 0
    const percentCollected = targetTotal > 0 ? Math.min(100, Math.round((totalCollected / targetTotal) * 100)) : (paidCount > 0 ? 100 : 0)

    // Cek status bayar warga aktif
    const targetWId = currentWarga?.id || currentUser?.resident_id
    const myEventBill = eventBills.find((te) => te.wargaId === targetWId)
    const isMyBillPaid = myEventBill?.status === 'Lunas'

    return (
      <AppCard style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.scopeRow}>
            <AppBadge scope={isRw ? 'RW' : 'RT'} label={isRw ? 'Tingkat RW' : 'Tingkat RT'} />
            <Text style={styles.cardTitle} numberOfLines={1}>{item.judul || item.nama}</Text>
          </View>

          {isAdminLoggedIn && (
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => handleHapus(item)}
              activeOpacity={0.8}
            >
              <Trash2 size={14} color={colors.danger} />
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.cardDesc} numberOfLines={2}>{item.deskripsi}</Text>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Clock size={13} color={colors.textSecondary} />
            <Text style={styles.metaText} numberOfLines={1}>{item.tanggal || 'Bulan Ini'}</Text>
          </View>
          {item.lokasi ? (
            <View style={styles.metaItem}>
              <MapPin size={13} color={colors.textSecondary} />
              <Text style={styles.metaText} numberOfLines={1}>{item.lokasi}</Text>
            </View>
          ) : null}
        </View>

        {item.nominalPerKK > 0 && (
          <View style={styles.iuranBanner}>
            <View style={styles.iuranTopRow}>
              <View style={styles.iuranNominalCol}>
                <Text style={styles.iuranLabel}>Iuran Khusus Acara</Text>
                <Text style={styles.iuranVal}>
                  {formatRupiah(item.nominalPerKK)}{' '}
                  <Text style={styles.iuranValSub}>/ KK</Text>
                </Text>
              </View>

              <View style={styles.danaTerkumpulBadge}>
                <View style={styles.danaBadgeHeader}>
                  <Coins size={11} color="#059669" style={{ marginRight: 3 }} />
                  <Text style={styles.danaTerkumpulBadgeLabel}>Terkumpul</Text>
                </View>
                <Text style={styles.danaTerkumpulBadgeVal}>{formatRupiah(totalCollected)}</Text>
              </View>
            </View>

            {totalBills > 0 && (
              <View style={styles.progressBarWrap}>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${percentCollected}%` }]} />
                </View>
                <View style={styles.progressLabelRow}>
                  <Text style={styles.progressSubText} numberOfLines={1}>
                    {paidCount}/{totalBills} KK Lunas ({percentCollected}%)
                    {pendingCount > 0 ? ` • ${pendingCount} Butuh ACC` : ''}
                  </Text>
                  {targetTotal > 0 && (
                    <Text style={styles.progressTargetText} numberOfLines={1}>
                      Target: {formatRupiah(targetTotal)}
                    </Text>
                  )}
                </View>
              </View>
            )}

            {isWarga && (
              <View style={styles.myStatusRow}>
                <Text style={styles.myStatusLabel}>Status Iuran Saya:</Text>
                <AppBadge status={myEventBill?.status || 'Belum Bayar'} size="sm" />
              </View>
            )}
          </View>
        )}

        <View style={styles.cardActions}>
          <View style={{ flex: 1 }}>
            <AppButton
              title="Detail Kegiatan"
              variant="secondary"
              size="sm"
              onPress={() => {
                setSelectedDetailEvent(item)
                setDetailModalOpen(true)
              }}
            />
          </View>

          {isWarga && item.nominalPerKK > 0 && !isMyBillPaid && (
            <View style={{ flex: 1.4 }}>
              <AppButton
                title={myEventBill?.status === 'Menunggu Verifikasi' ? 'Bukti Terkirim (Menunggu ACC)' : 'Bayar Iuran'}
                variant={myEventBill?.status === 'Menunggu Verifikasi' ? 'secondary' : 'primary'}
                size="sm"
                icon={<CreditCard size={14} color={myEventBill?.status === 'Menunggu Verifikasi' ? colors.primary : colors.surface} />}
                onPress={() => {
                  setPayEventTarget(item)
                  setPayEventModalOpen(true)
                }}
              />
            </View>
          )}

          {isAdminLoggedIn && item.nominalPerKK > 0 && (
            <View style={{ flex: 1.2 }}>
              <AppButton
                title={totalBills > 0 ? 'Iuran Warga' : 'Terbitkan Iuran'}
                variant="primary"
                size="sm"
                icon={<Receipt size={14} color={colors.surface} />}
                onPress={() => {
                  if (totalBills > 0) {
                    setSelectedEvent(item)
                    setBillingModalOpen(true)
                  } else {
                    handleGenerateMassal(item)
                  }
                }}
              />
            </View>
          )}
        </View>
      </AppCard>
    )
  }

  // Rekening & QRIS info for payment modal
  const isPayRw = payEventTarget?.scope === 'rw' || payEventTarget?.level === 'rw'
  const payTargetRT = (rts || []).find(r => r.id === (currentWarga?.rt_id || 'rt-1')) || rts?.[0]
  const payOwnerId = isPayRw ? 'rw-15' : payTargetRT?.id

  const payBank = (bankAccounts || []).find(b => isPayRw ? b.owner_type === 'RW' : (b.owner_type === 'RT' && b.owner_id === payOwnerId)) || {
    bank_name: 'BCA',
    account_number: isPayRw ? '7788990011' : (payTargetRT?.rekening || '8730192831'),
    account_holder: isPayRw ? 'Kas RW 15' : `Kas ${payTargetRT?.name || 'RT 01'}`
  }

  const payQris = (qrisAccounts || []).find(q => isPayRw ? q.owner_type === 'RW' : (q.owner_type === 'RT' && q.owner_id === payOwnerId))
  const qrisUri = payQris?.image_url ||
    (isPayRw ? config?.qrisImageUrlRw : payTargetRT?.qrisImageUrl) ||
    config?.qrisImageUrl ||
    `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=QRIS_WARGAKU_EVENT_${payEventTarget?.id}_${payEventTarget?.nominalPerKK}`

  return (
    <View style={styles.container}>
      <AppHeader
        title="Iuran Kegiatan & Acara"
        subtitle="Informasi dan pembayaran iuran insidental, 17 Agustus & kerja bakti"
        onBack={() => navigation.goBack()}
      />

      <FlatList
        data={listEvents}
        keyExtractor={(item, index) => item.id || `evt-${index}`}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        initialNumToRender={6}
        maxToRenderPerBatch={8}
        windowSize={5}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshData}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Calendar size={44} color={colors.textSecondary} style={{ marginBottom: 12 }} />
            <Text style={styles.emptyTitle}>Belum ada iuran kegiatan</Text>
            <Text style={styles.emptySub}>
              Pengurus belum mempublikasikan iuran kegiatan baru.
            </Text>
          </View>
        }
      />

      {/* FAB Tambah Kegiatan */}
      {isAdminLoggedIn && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setModalOpen(true)}
          activeOpacity={0.88}
        >
          <Plus size={24} color={colors.surface} />
        </TouchableOpacity>
      )}

      {/* Modal Tambah Pengumuman / Kegiatan */}
      <AppModal
        visible={modalOpen}
        title="Buat Iuran Kegiatan Baru"
        onClose={() => setModalOpen(false)}
        footer={
          <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
            <View style={{ flex: 1 }}>
              <AppButton
                title="Batal"
                variant="secondary"
                onPress={() => setModalOpen(false)}
              />
            </View>
            <View style={{ flex: 1 }}>
              <AppButton
                title="Terbitkan"
                variant="primary"
                loading={loading}
                onPress={handleTambah}
              />
            </View>
          </View>
        }
      >
        <View style={{ width: '100%' }}>
          {/* 1. Tingkat Penyelenggara */}
          <View style={styles.formSectionBox}>
            <Text style={styles.formSectionLabel}>Tingkat Penyelenggara *</Text>
            {isRT ? (
              <View style={styles.rtScopeFixedBadge}>
                <MapPin size={14} color={colors.success} />
                <Text style={styles.rtScopeFixedText}>Pengumuman Resmi {activeRT?.name || 'RT'}</Text>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  style={[styles.selectorBtn, scope === 'rw' && styles.selectorBtnPurpleActive]}
                  onPress={() => setScope('rw')}
                >
                  <Text style={[styles.selectorBtnText, scope === 'rw' && styles.selectorBtnTextWhite]}>
                    🏢 Tingkat RW
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.selectorBtn, scope === 'rt' && styles.selectorBtnGreenActive]}
                  onPress={() => setScope('rt')}
                >
                  <Text style={[styles.selectorBtnText, scope === 'rt' && styles.selectorBtnTextWhite]}>
                    🏘️ Tingkat RT
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {!isRT && scope === 'rt' && (
              <View style={{ marginTop: 8 }}>
                <Text style={styles.subLabel}>Pilih RT Penyelenggara:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', marginTop: 4 }}>
                  {rts.map((r) => (
                    <TouchableOpacity
                      key={r.id}
                      style={[styles.rtSelectChip, targetRtId === r.id && styles.rtSelectChipActive]}
                      onPress={() => setTargetRtId(r.id)}
                    >
                      <Text style={[styles.rtSelectChipText, targetRtId === r.id && styles.rtSelectChipTextActive]}>
                        {r.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* 2. Sasaran Penerima */}
          <View style={[styles.formSectionBox, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
            <Text style={[styles.formSectionLabel, { color: '#92400E' }]}>Sasaran Penerima Pengumuman *</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                style={[styles.selectorBtn, targetType === 'all' && styles.selectorBtnAmberActive]}
                onPress={() => setTargetType('all')}
              >
                <Users size={14} color={targetType === 'all' ? '#FFF' : colors.textPrimary} />
                <Text style={[styles.selectorBtnText, targetType === 'all' && styles.selectorBtnTextWhite]}>
                  Seluruh Warga
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.selectorBtn, targetType === 'personal' && styles.selectorBtnAmberActive]}
                onPress={() => {
                  setTargetType('personal')
                  if (!targetWargaId && availableWarga[0]) setTargetWargaId(availableWarga[0].id)
                }}
              >
                <User size={14} color={targetType === 'personal' ? '#FFF' : colors.textPrimary} />
                <Text style={[styles.selectorBtnText, targetType === 'personal' && styles.selectorBtnTextWhite]}>
                  Perorangan (Pribadi)
                </Text>
              </TouchableOpacity>
            </View>

            {targetType === 'personal' && (
              <View style={{ marginTop: 8 }}>
                <Text style={[styles.subLabel, { color: '#B45309' }]}>Pilih Warga Penerima:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', marginTop: 4 }}>
                  {availableWarga.map((w) => (
                    <TouchableOpacity
                      key={w.id}
                      style={[styles.wargaSelectChip, targetWargaId === w.id && styles.wargaSelectChipActive]}
                      onPress={() => setTargetWargaId(w.id)}
                    >
                      <Text style={[styles.wargaSelectChipName, targetWargaId === w.id && styles.wargaSelectChipNameActive]}>
                        {w.nama}
                      </Text>
                      <Text style={[styles.wargaSelectChipSub, targetWargaId === w.id && styles.wargaSelectChipSubActive]}>
                        Blok {w.blok}/{w.noRumah}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* 3. Jenis Format */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Jenis Format</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                style={[styles.selectorBtn, tipePengumuman === 'info' && styles.selectorBtnDarkActive]}
                onPress={() => setTipePengumuman('info')}
              >
                <FileText size={14} color={tipePengumuman === 'info' ? '#FFF' : colors.textPrimary} />
                <Text style={[styles.selectorBtnText, tipePengumuman === 'info' && styles.selectorBtnTextWhite]}>
                  Surat / Info (Gratis)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.selectorBtn, tipePengumuman === 'iuran' && styles.selectorBtnAmberActive]}
                onPress={() => {
                  setTipePengumuman('iuran')
                  if (!nominalPerKK) setNominalPerKK('50000')
                }}
              >
                <Trophy size={14} color={tipePengumuman === 'iuran' ? '#FFF' : colors.textPrimary} />
                <Text style={[styles.selectorBtnText, tipePengumuman === 'iuran' && styles.selectorBtnTextWhite]}>
                  Lomba / Iuran
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 4. Judul Pengumuman */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Judul Iuran Kegiatan *</Text>
            <TextInput
              style={styles.input}
              placeholder={tipePengumuman === 'info' ? "Contoh: Surat Edaran Kerja Bakti & Fogging" : "Contoh: Semarak Lomba 17 Agustus 2026"}
              placeholderTextColor={colors.textSecondary}
              value={judul}
              onChangeText={setJudul}
            />
          </View>

          {/* 5. Kategori Chips */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Kategori Iuran Kegiatan</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
              {KATEGORI_EVENT.map((kat) => (
                <TouchableOpacity
                  key={kat}
                  style={[styles.categoryChip, kategori === kat && styles.categoryChipActive]}
                  onPress={() => setKategori(kat)}
                >
                  <Text style={[styles.categoryChipText, kategori === kat && styles.categoryChipTextActive]}>
                    {kat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* 6. Tanggal Pelaksanaan / Batas */}
          <View style={styles.inputGroup}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <Text style={styles.label}>Tanggal Pelaksanaan / Batas (YYYY-MM-DD) *</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="2026-10-15"
              placeholderTextColor={colors.textSecondary}
              value={batasTanggal}
              onChangeText={setBatasTanggal}
            />
            {/* Quick Date Presets */}
            <View style={styles.presetRow}>
              <Text style={styles.presetLabel}>Cepat:</Text>
              <TouchableOpacity
                style={styles.presetChip}
                onPress={() => setBatasTanggal(new Date().toISOString().slice(0, 10))}
              >
                <Text style={styles.presetChipText}>Hari Ini</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.presetChip}
                onPress={() => setBatasTanggal(new Date(Date.now() + 86400000).toISOString().slice(0, 10))}
              >
                <Text style={styles.presetChipText}>Besok</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.presetChip}
                onPress={() => setBatasTanggal(new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10))}
              >
                <Text style={styles.presetChipText}>+7 Hari</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.presetChip}
                onPress={() => setBatasTanggal(new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10))}
              >
                <Text style={styles.presetChipText}>+14 Hari</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 7. Nominal Iuran jika format iuran */}
          {tipePengumuman === 'iuran' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nominal Iuran per KK (Rp) *</Text>
              <TextInput
                style={[styles.input, { fontWeight: '700', fontSize: 16, color: colors.primary }]}
                placeholder="50000"
                keyboardType="number-pad"
                placeholderTextColor={colors.textSecondary}
                value={nominalPerKK}
                onChangeText={setNominalPerKK}
              />
            </View>
          )}

          {/* 8. Hapus Otomatis (Auto-Delete) */}
          <View style={[styles.formSectionBox, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                <Clock size={18} color="#D97706" />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.formSectionLabel, { color: '#92400E', marginBottom: 0 }]}>
                    Hapus Otomatis (Auto-Delete)
                  </Text>
                  <Text style={{ fontSize: 11, color: '#B45309' }}>
                    Sembunyikan otomatis saat tanggal & jam berakhir
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.toggleBtn, autoHapus ? styles.toggleBtnActive : styles.toggleBtnInactive]}
                onPress={() => setAutoHapus(!autoHapus)}
              >
                <View style={[styles.toggleKnob, autoHapus ? styles.toggleKnobActive : styles.toggleKnobInactive]} />
              </TouchableOpacity>
            </View>

            {autoHapus && (
              <View style={{ marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#FDE68A' }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.subLabel, { color: '#92400E' }]}>Tanggal Hapus:</Text>
                    <TextInput
                      style={[styles.input, { height: 40, fontSize: 12, backgroundColor: '#FFF' }]}
                      placeholder="2026-10-20"
                      value={expiredDate}
                      onChangeText={setExpiredDate}
                    />
                  </View>
                  <View style={{ width: 90 }}>
                    <Text style={[styles.subLabel, { color: '#92400E' }]}>Jam (WIB):</Text>
                    <TextInput
                      style={[styles.input, { height: 40, fontSize: 12, backgroundColor: '#FFF' }]}
                      placeholder="23:59"
                      value={expiredTime}
                      onChangeText={setExpiredTime}
                    />
                  </View>
                </View>

                {/* Preset Kedaluwarsa */}
                <View style={[styles.presetRow, { marginTop: 6 }]}>
                  <Text style={styles.presetLabel}>Preset:</Text>
                  <TouchableOpacity
                    style={styles.presetChip}
                    onPress={() => setExpiredDate(new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10))}
                  >
                    <Text style={styles.presetChipText}>3 Hari</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.presetChip}
                    onPress={() => setExpiredDate(new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10))}
                  >
                    <Text style={styles.presetChipText}>7 Hari</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.presetChip}
                    onPress={() => setExpiredDate(new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10))}
                  >
                    <Text style={styles.presetChipText}>14 Hari</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* 9. Deskripsi / Keterangan */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Isi Deskripsi / Surat Edaran</Text>
            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
              placeholder="Tuliskan isi pengumuman atau informasi lengkap..."
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={3}
              value={deskripsi}
              onChangeText={setDeskripsi}
            />
          </View>
        </View>
      </AppModal>

      {/* Modal Detail Kegiatan */}
      <AppModal
        visible={detailModalOpen}
        title="Detail Iuran Kegiatan"
        onClose={() => setDetailModalOpen(false)}
        footer={
          <AppButton
            title="Tutup"
            variant="secondary"
            onPress={() => setDetailModalOpen(false)}
          />
        }
      >
        {selectedDetailEvent && (() => {
          const detailBills = tagihanEvents?.filter((te) => te.eventId === selectedDetailEvent.id) || []
          const detailPaidBills = detailBills.filter((te) => te.status === 'Lunas')
          const detailPaidCount = detailPaidBills.length
          const detailPendingCount = detailBills.filter((te) => te.status === 'Menunggu Verifikasi').length
          const detailTotalBills = detailBills.length
          const detailTotalCollected = detailPaidBills.reduce((sum, te) => sum + (Number(te.nominal) || Number(selectedDetailEvent.nominalPerKK) || 0), 0)
          const detailTargetTotal = detailTotalBills > 0 ? (detailTotalBills * (Number(selectedDetailEvent.nominalPerKK) || 0)) : 0
          const detailPercent = detailTargetTotal > 0 ? Math.min(100, Math.round((detailTotalCollected / detailTargetTotal) * 100)) : (detailPaidCount > 0 ? 100 : 0)

          return (
            <View>
              <Text style={styles.detailTitle}>{selectedDetailEvent.judul || selectedDetailEvent.nama}</Text>
              <Text style={styles.detailDesc}>{selectedDetailEvent.deskripsi}</Text>

              <View style={styles.detailInfoBox}>
                <View style={styles.detailInfoRow}>
                  <Text style={styles.detailInfoLabel}>Waktu:</Text>
                  <Text style={styles.detailInfoVal}>{selectedDetailEvent.tanggal || '-'}</Text>
                </View>
                <View style={styles.detailInfoRow}>
                  <Text style={styles.detailInfoLabel}>Lokasi:</Text>
                  <Text style={styles.detailInfoVal}>{selectedDetailEvent.lokasi || 'Lingkungan Perumahan'}</Text>
                </View>
                {selectedDetailEvent.nominalPerKK > 0 && (
                  <View style={styles.detailInfoRow}>
                    <Text style={styles.detailInfoLabel}>Biaya per KK:</Text>
                    <Text style={[styles.detailInfoVal, { color: colors.primary, fontWeight: '700' }]}>
                      {formatRupiah(selectedDetailEvent.nominalPerKK)} / KK
                    </Text>
                  </View>
                )}
              </View>

              {/* CARD DANA TERKUMPUL KHUSUS ACARA / LOMBA */}
              {selectedDetailEvent.nominalPerKK > 0 && (
                <View style={styles.detailDanaCard}>
                  <View style={styles.detailDanaHeaderRow}>
                    <View style={styles.detailDanaIconBox}>
                      <Coins size={20} color="#059669" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.detailDanaSubLabel}>Total Dana Terkumpul Acara</Text>
                      <Text style={styles.detailDanaAmountText}>{formatRupiah(detailTotalCollected)}</Text>
                    </View>
                    {detailTargetTotal > 0 && (
                      <View style={styles.detailDanaPercentPill}>
                        <Text style={styles.detailDanaPercentText}>{detailPercent}%</Text>
                      </View>
                    )}
                  </View>

                  {detailTotalBills > 0 && (
                    <View style={{ marginTop: 10 }}>
                      <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: `${detailPercent}%` }]} />
                      </View>
                      <View style={styles.detailDanaStatsRow}>
                        <Text style={styles.detailDanaStatText}>
                          {detailPaidCount} dari {detailTotalBills} KK telah lunas
                        </Text>
                        {detailTargetTotal > 0 && (
                          <Text style={styles.detailDanaStatText}>
                            Target: {formatRupiah(detailTargetTotal)}
                          </Text>
                        )}
                      </View>
                    </View>
                  )}

                  <View style={styles.detailDanaSeparateNotice}>
                    <Text style={styles.detailDanaNoticeText}>
                      🔒 <Text style={{ fontWeight: '700' }}>Dana Khusus Panitia:</Text> Dana iuran/lomba ini dikelola terpisah dan tidak masuk ke buku kas RT/RW.
                    </Text>
                  </View>
                </View>
              )}
            </View>
          )
        })()}
      </AppModal>

      {/* Modal Bayar Iuran Event (Warga) */}
      <AppModal
        visible={payEventModalOpen}
        title={qrisZoomModalOpen ? "Barcode QRIS Layar Penuh" : "Bayar Iuran Kegiatan"}
        onClose={() => {
          if (qrisZoomModalOpen) {
            setQrisZoomModalOpen(false)
          } else {
            setPayEventModalOpen(false)
          }
        }}
        footer={
          qrisZoomModalOpen ? (
            <View style={{ width: '100%' }}>
              <AppButton
                title="Kembali ke Formulir Bayar"
                variant="primary"
                onPress={() => setQrisZoomModalOpen(false)}
              />
            </View>
          ) : (
            <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
              <View style={{ flex: 1 }}>
                <AppButton
                  title="Batal"
                  variant="secondary"
                  onPress={() => setPayEventModalOpen(false)}
                />
              </View>
              <View style={{ flex: 1 }}>
                <AppButton
                  title="Kirim Bukti"
                  variant="primary"
                  loading={loading}
                  onPress={handleWargaKirimBuktiEvent}
                />
              </View>
            </View>
          )
        }
      >
        {payEventTarget && (
          qrisZoomModalOpen ? (
            <View style={{ alignItems: 'center', paddingVertical: 10 }}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalHeaderTitle}>QRIS Resmi {isPayRw ? 'RW 15' : payTargetRT?.name || 'RT 01'}</Text>
                <TouchableOpacity onPress={() => setQrisZoomModalOpen(false)} style={styles.modalCloseBtn}>
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.modalQrisLargeBox}>
                <Image
                  source={{ uri: qrisUri }}
                  style={styles.modalQrisLargeImage}
                  resizeMode="contain"
                />
              </View>

              <Text style={styles.modalMerchantName}>{isPayRw ? 'KAS RW 15' : `KAS ${payTargetRT?.name || 'RT 01'}`}</Text>
              <Text style={styles.modalGuideText}>
                Buka aplikasi M-Banking (BCA, Mandiri, BRI, BNI) atau E-Wallet (GoPay, OVO, Dana, ShopeePay) untuk scan barcode di atas.
              </Text>

              <TouchableOpacity style={styles.modalDoneBtn} onPress={() => setQrisZoomModalOpen(false)}>
                <Text style={styles.modalDoneBtnText}>Kembali ke Formulir Pembayaran</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ width: '100%' }}>
              <View style={styles.paySummaryBox}>
                <Text style={styles.payEventName} numberOfLines={1}>{payEventTarget.judul}</Text>
                <Text style={styles.payEventNominal}>{formatRupiah(payEventTarget.nominalPerKK)}</Text>
                <Text style={styles.payEventScope}>Tujuan: {isPayRw ? 'Kas RW 15' : `Kas ${payTargetRT?.name || 'RT 01'}`}</Text>
              </View>

              {/* Metode Bayar Selector */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Pilih Metode Pembayaran</Text>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {['Transfer', 'QRIS', 'Cash'].map((m) => (
                    <TouchableOpacity
                      key={m}
                      style={[styles.payMethodBtn, payMetode === m && styles.payMethodBtnActive]}
                      onPress={() => setPayMetode(m)}
                    >
                      <Text style={[styles.payMethodText, payMetode === m && styles.payMethodTextActive]}>
                        {m === 'Transfer' ? 'Transfer Bank' : m === 'QRIS' ? 'Scan QRIS' : 'Tunai'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Tampilan Rekening Bank */}
              {payMetode === 'Transfer' && (
                <View style={styles.bankDetailCard}>
                  <Text style={styles.bankName}>{payBank.bank_name}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 2 }}>
                    <Text style={styles.accountNumber}>{payBank.account_number}</Text>
                    <TouchableOpacity onPress={() => handleCopyText(payBank.account_number, 'Nomor Rekening')}>
                      <Copy size={16} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.accountHolder}>a.n {payBank.account_holder}</Text>
                </View>
              )}

              {/* Tampilan Barcode QRIS */}
              {payMetode === 'QRIS' && (
                <View style={styles.qrisDetailCard}>
                  <Text style={styles.qrisTitle}>Barcode QRIS Resmi {isPayRw ? 'RW 15' : payTargetRT?.name || 'RT 01'}</Text>
                  <TouchableOpacity
                    style={styles.qrisImageWrap}
                    onPress={() => setQrisZoomModalOpen(true)}
                    activeOpacity={0.9}
                  >
                    <Image
                      source={{ uri: qrisUri }}
                      style={{ width: 180, height: 180 }}
                      resizeMode="contain"
                    />
                    <View style={styles.qrisZoomBadge}>
                      <Text style={styles.qrisZoomBadgeText}>🔍 Ketuk untuk Perbesar Full</Text>
                    </View>
                  </TouchableOpacity>
                  <Text style={styles.qrisGuide}>Scan barcode via BCA Mobile, Mandiri Livin, GoPay, OVO, atau DANA</Text>
                  
                  <TouchableOpacity
                    style={styles.zoomQrisBtn}
                    onPress={() => setQrisZoomModalOpen(true)}
                    activeOpacity={0.8}
                  >
                    <QrCode size={16} color={colors.primary} />
                    <Text style={styles.zoomQrisBtnText}>Lihat QRIS Layar Penuh</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Catatan / Nomor Bukti Transfer */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nomor Referensi / Catatan Transfer</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Contoh: Transfer a.n Bambang via m-BCA"
                  placeholderTextColor={colors.textSecondary}
                  value={payBuktiRef}
                  onChangeText={setPayBuktiRef}
                />
              </View>

              {/* Upload Foto Bukti Struk Transfer */}
              {payMetode !== 'Cash' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Foto Bukti Transfer / Resi QRIS <Text style={{ color: colors.danger }}>* (Wajib)</Text></Text>
                  {eventSelectedImage ? (
                    <View style={styles.proofPreviewCard}>
                      <Image source={{ uri: eventSelectedImage.uri }} style={styles.proofImage} resizeMode="cover" />
                      <View style={styles.proofInfoRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.proofTitle}>Foto Bukti Terpilih ✓</Text>
                          <Text style={styles.proofSub} numberOfLines={1}>{eventSelectedImage.fileName}</Text>
                          <Text style={{ fontSize: 10, color: colors.textSecondary }}>Ukuran: {eventSelectedImage.fileSize}</Text>
                        </View>
                        <TouchableOpacity
                          style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 5, backgroundColor: '#EEF2FF', borderRadius: 6, marginRight: 6 }}
                          onPress={() => setEventPickerModalOpen(true)}
                        >
                          <RefreshCw size={13} color={colors.primary} />
                          <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary }}>Ganti</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.proofRemoveBtn}
                          onPress={() => {
                            setEventSelectedImage(null)
                            setPayBuktiFotoUrl('')
                          }}
                        >
                          <Text style={styles.proofRemoveText}>Hapus</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.uploadArea}>
                      <TouchableOpacity
                        style={styles.uploadBtnChoice}
                        onPress={() => setEventPickerModalOpen(true)}
                        activeOpacity={0.85}
                      >
                        <Upload size={18} color={colors.primary} />
                        <Text style={styles.uploadBtnText}>Upload Bukti Pembayaran</Text>
                      </TouchableOpacity>
                      <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 6, textAlign: 'center' }}>
                        Pilih dari Galeri atau Ambil Foto Kamera (Maks 5 MB)
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          )
        )}
      </AppModal>

      {/* Modal Iuran Warga Per Event (RT/Admin) */}
      <AppModal
        visible={billingModalOpen}
        title={`Iuran: ${selectedEvent?.judul || 'Kegiatan'}`}
        subtitle={`Nominal: ${formatRupiah(selectedEvent?.nominalPerKK || 0)} / KK`}
        onClose={() => setBillingModalOpen(false)}
        scrollable={false}
        footer={
          <AppButton
            title="Tutup Daftar"
            variant="secondary"
            onPress={() => setBillingModalOpen(false)}
          />
        }
      >
        {selectedEvent && (() => {
          const allBills = tagihanEvents?.filter((te) => te.eventId === selectedEvent.id) || []
          const paidCount = allBills.filter((te) => te.status === 'Lunas').length
          const pendingCount = allBills.filter((te) => te.status === 'Menunggu Verifikasi').length
          const unpaidCount = allBills.filter((te) => te.status !== 'Lunas' && te.status !== 'Menunggu Verifikasi').length
          const totalDanaTerkumpul = allBills.filter((te) => te.status === 'Lunas').reduce((sum, te) => sum + (Number(te.nominal) || Number(selectedEvent.nominalPerKK) || 0), 0)
          const totalTargetDana = allBills.length * (Number(selectedEvent.nominalPerKK) || 0)
          const totalSisaDana = Math.max(0, totalTargetDana - totalDanaTerkumpul)
          const percentTerkumpul = totalTargetDana > 0 ? Math.min(100, Math.round((totalDanaTerkumpul / totalTargetDana) * 100)) : (paidCount > 0 ? 100 : 0)

          const filteredEventBills = allBills.filter((te) => {
            const targetW = warga.find((w) => w.id === te.wargaId) || {}
            const matchSearch = !billingSearchQuery ||
              (targetW.nama && targetW.nama.toLowerCase().includes(billingSearchQuery.toLowerCase())) ||
              (targetW.blok && targetW.blok.toLowerCase().includes(billingSearchQuery.toLowerCase())) ||
              (targetW.noRumah && targetW.noRumah.toLowerCase().includes(billingSearchQuery.toLowerCase()))

            let matchStatus = true
            if (billingFilterStatus === 'Belum Bayar') {
              matchStatus = te.status !== 'Lunas' && te.status !== 'Menunggu Verifikasi'
            } else if (billingFilterStatus === 'Menunggu Verifikasi') {
              matchStatus = te.status === 'Menunggu Verifikasi'
            } else if (billingFilterStatus === 'Lunas') {
              matchStatus = te.status === 'Lunas'
            }

            return matchSearch && matchStatus
          })

          return (
            <View style={{ width: '100%', flexShrink: 1 }}>
              {/* Banner Dana Terkumpul Khusus Acara / Lomba */}
              <View style={styles.billingDanaBox}>
                <View style={styles.billingDanaHeaderRow}>
                  <View style={styles.billingDanaIcon}>
                    <Coins size={18} color="#059669" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.billingDanaSubTitle}>Dana Terkumpul (Khusus Acara)</Text>
                    <Text style={styles.billingDanaAmount}>{formatRupiah(totalDanaTerkumpul)}</Text>
                  </View>
                  <View style={styles.billingDanaPercentBadge}>
                    <Text style={styles.billingDanaPercentText}>{percentTerkumpul}%</Text>
                  </View>
                </View>
                <View style={styles.billingDanaDetailRow}>
                  <Text style={styles.billingDanaDetailItem}>
                    Target: <Text style={{ fontWeight: '700', color: colors.textPrimary }}>{formatRupiah(totalTargetDana)}</Text>
                  </Text>
                  <Text style={styles.billingDanaDetailItem}>
                    Sisa: <Text style={{ fontWeight: '700', color: colors.danger }}>{formatRupiah(totalSisaDana)}</Text>
                  </Text>
                </View>
                <Text style={styles.billingDanaNotice}>
                  🔒 Terpisah dari Kas Reguler RT/RW • Khusus operasional kepanitiaan
                </Text>
              </View>

              {/* Ringkasan Status */}
              <View style={styles.billingSummaryGrid}>
                <View style={[styles.billingSummaryCard, { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }]}>
                  <Text style={styles.billingSummaryNum}>{allBills.length}</Text>
                  <Text style={styles.billingSummaryLabel}>Total Warga</Text>
                </View>
                <View style={[styles.billingSummaryCard, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
                  <Text style={[styles.billingSummaryNum, { color: colors.success }]}>{paidCount}</Text>
                  <Text style={[styles.billingSummaryLabel, { color: '#166534' }]}>Lunas</Text>
                </View>
                <View style={[styles.billingSummaryCard, { backgroundColor: '#FEF2F2', borderColor: '#FECDD3' }]}>
                  <Text style={[styles.billingSummaryNum, { color: colors.danger }]}>{unpaidCount}</Text>
                  <Text style={[styles.billingSummaryLabel, { color: '#991B1B' }]}>Belum Bayar</Text>
                </View>
                <View style={[styles.billingSummaryCard, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
                  <Text style={[styles.billingSummaryNum, { color: '#D97706' }]}>{pendingCount}</Text>
                  <Text style={[styles.billingSummaryLabel, { color: '#92400E' }]}>Butuh ACC</Text>
                </View>
              </View>

              {/* Input Pencarian Warga */}
              <View style={styles.billingSearchWrap}>
                <Search size={15} color={colors.textSecondary} style={{ marginRight: 6 }} />
                <TextInput
                  style={styles.billingSearchInput}
                  placeholder="Cari nama warga / blok / no rumah..."
                  placeholderTextColor={colors.textSecondary}
                  value={billingSearchQuery}
                  onChangeText={setBillingSearchQuery}
                />
                {billingSearchQuery ? (
                  <TouchableOpacity onPress={() => setBillingSearchQuery('')}>
                    <X size={15} color={colors.textSecondary} />
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* Filter Tabs */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.billingFilterScroll}>
                {[
                  { key: 'Semua', label: `Semua (${allBills.length})` },
                  { key: 'Belum Bayar', label: `Belum Bayar (${unpaidCount})`, isDanger: true },
                  { key: 'Menunggu Verifikasi', label: `Menunggu ACC (${pendingCount})`, isWarn: true },
                  { key: 'Lunas', label: `Lunas (${paidCount})`, isSuccess: true }
                ].map((tab) => {
                  const isAct = billingFilterStatus === tab.key
                  return (
                    <TouchableOpacity
                      key={tab.key}
                      style={[
                        styles.billingFilterChip,
                        isAct && styles.billingFilterChipActive,
                        tab.isDanger && isAct && { backgroundColor: '#FEF2F2', borderColor: '#F87171' },
                        tab.isWarn && isAct && { backgroundColor: '#FFFBEB', borderColor: '#FBBF24' },
                        tab.isSuccess && isAct && { backgroundColor: '#F0FDF4', borderColor: '#4ADE80' }
                      ]}
                      onPress={() => setBillingFilterStatus(tab.key)}
                    >
                      <Text
                        style={[
                          styles.billingFilterChipText,
                          isAct && styles.billingFilterChipTextActive,
                          tab.isDanger && isAct && { color: colors.danger },
                          tab.isWarn && isAct && { color: '#D97706' },
                          tab.isSuccess && isAct && { color: colors.success }
                        ]}
                      >
                        {tab.label}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </ScrollView>

              {/* List Warga */}
              <ScrollView
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
                style={{ flexShrink: 1, maxHeight: 280 }}
                contentContainerStyle={{ paddingBottom: 16 }}
              >
                {filteredEventBills.length === 0 ? (
                  <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                    <Text style={{ fontSize: 12, color: colors.textSecondary }}>Tidak ada data warga yang sesuai filter.</Text>
                  </View>
                ) : (
                  filteredEventBills.map((te) => {
                    const targetW = warga.find((w) => w.id === te.wargaId) || {}
                    const isPaid = te.status === 'Lunas'
                    const isPending = te.status === 'Menunggu Verifikasi'
                    const hasProof = Boolean(te.buktiFoto || te.buktiTransferUrl || (te.buktiBayar && te.buktiBayar.startsWith('data:')))

                    return (
                      <View key={te.id} style={styles.teRowCard}>
                        <TouchableOpacity
                          style={{ flex: 1 }}
                          activeOpacity={0.7}
                          onPress={() => {
                            setSelectedBillingDetail({ ...te, warga: targetW, event: selectedEvent })
                            setBillingDetailModalOpen(true)
                          }}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                            <Text style={styles.teWargaName}>{targetW.nama || 'Warga'}</Text>
                            <AppBadge status={te.status} />
                          </View>
                          <Text style={styles.teWargaBlok}>Blok {targetW.blok || 'A'}/{targetW.noRumah || '-'}</Text>
                          {hasProof && (
                            <Text style={{ fontSize: 10, color: colors.primary, fontWeight: '700', marginTop: 3 }}>
                              📷 Ada Foto Bukti Transfer {isPending ? '(Butuh ACC)' : ''}
                            </Text>
                          )}
                        </TouchableOpacity>

                        {!isPaid && !isPending && targetW.noHp && (
                          <TouchableOpacity
                            style={styles.teWaBtn}
                            onPress={() => {
                              const url = generateWaEvent(targetW, selectedEvent, te, config?.namaLingkungan, payBank.account_number)
                              if (url) Linking.openURL(url)
                            }}
                          >
                            <MessageCircle size={13} color="#16A34A" />
                            <Text style={styles.teWaBtnText}>Ingatkan WA</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )
                  })
                )}
              </ScrollView>
            </View>
          )
        })()}
      </AppModal>

      {/* MODAL DETAIL BUKTI PEMBAYARAN IURAN WARGA */}
      <Modal
        visible={billingDetailModalOpen}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setBillingDetailModalOpen(false)}
      >
        <View style={styles.fullscreenModal}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setBillingDetailModalOpen(false)}
          />
          <View style={[styles.modalContentCard, { maxHeight: '90%', display: 'flex', flexDirection: 'column', padding: 18 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle}>Detail Pembayaran Iuran</Text>
              <TouchableOpacity onPress={() => setBillingDetailModalOpen(false)} style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedBillingDetail && (
              <ScrollView
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
                style={{ width: '100%', flexShrink: 1 }}
                contentContainerStyle={{ paddingBottom: 20 }}
              >
                <View style={{ backgroundColor: '#F8FAFC', borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' }}>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: colors.textMain }}>
                    {selectedBillingDetail.warga?.nama || 'Warga'}
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>
                    Alamat: Blok {selectedBillingDetail.warga?.blok || 'A'}/{selectedBillingDetail.warga?.noRumah || '-'}
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                    Kegiatan: <Text style={{ fontWeight: '700', color: colors.textMain }}>{selectedBillingDetail.event?.judul}</Text>
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingHorizontal: 4 }}>
                  <Text style={{ fontSize: 12, color: colors.textSecondary }}>Nominal Iuran:</Text>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: colors.primary }}>
                    {formatRupiah(selectedBillingDetail.event?.nominalPerKK || 0)}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingHorizontal: 4 }}>
                  <Text style={{ fontSize: 12, color: colors.textSecondary }}>Status Pembayaran:</Text>
                  <AppBadge status={selectedBillingDetail.status} />
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingHorizontal: 4 }}>
                  <Text style={{ fontSize: 12, color: colors.textSecondary }}>Metode Bayar:</Text>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textMain }}>
                    {selectedBillingDetail.metodeBayar || selectedBillingDetail.metode || 'Transfer Bank'}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingHorizontal: 4 }}>
                  <Text style={{ fontSize: 12, color: colors.textSecondary }}>No. Referensi / Catatan:</Text>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: colors.textMain }} numberOfLines={1}>
                    {selectedBillingDetail.buktiBayar || '-'}
                  </Text>
                </View>

                {/* Foto Bukti Transfer Struk */}
                <Text style={{ fontSize: 12, fontWeight: '800', color: colors.textMain, marginBottom: 6 }}>
                  Foto Bukti Transfer Struk:
                </Text>

                {selectedBillingDetail.buktiFoto || selectedBillingDetail.buktiTransferUrl ? (
                  <View style={{ borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#CBD5E1', marginBottom: 14 }}>
                    <Image
                      source={{ uri: selectedBillingDetail.buktiFoto || selectedBillingDetail.buktiTransferUrl }}
                      style={{ width: '100%', height: 180, backgroundColor: '#F1F5F9' }}
                      resizeMode="contain"
                    />
                  </View>
                ) : (
                  <View style={{ backgroundColor: '#FEF2F2', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#FECDD3', marginBottom: 14, alignItems: 'center' }}>
                    <Text style={{ fontSize: 11, color: colors.danger, fontWeight: '700' }}>
                      Belum ada foto bukti transfer dilampirkan oleh warga.
                    </Text>
                  </View>
                )}

                {/* Tombol Aksi Admin */}
                {isAdminLoggedIn && selectedBillingDetail.status !== 'Lunas' && (
                  <View style={{ gap: 8, marginBottom: 8 }}>
                    <TouchableOpacity
                      style={[styles.modalDoneBtn, { backgroundColor: colors.success }]}
                      onPress={async () => {
                        await bayarTagihanEvent(selectedBillingDetail.id, {
                          metodeBayar: selectedBillingDetail.metodeBayar || 'Transfer'
                        })
                        setBillingDetailModalOpen(false)
                        Alert.alert('Sukses', `Iuran warga ${selectedBillingDetail.warga?.nama} berhasil dicatat sebagai LUNAS!`)
                      }}
                    >
                      <Text style={styles.modalDoneBtnText}>✓ Setujui Pembayaran (Lunas)</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.modalDoneBtn, { backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#FECDD3' }]}
                      onPress={() => {
                        Alert.alert(
                          'Tolak Bukti Pembayaran',
                          `Apakah Anda yakin ingin menolak bukti transfer warga ${selectedBillingDetail.warga?.nama}? Status akan diubah menjadi "Perlu Diperbaiki".`,
                          [
                            { text: 'Batal', style: 'cancel' },
                            {
                              text: 'Ya, Tolak Bukti',
                              style: 'destructive',
                              onPress: async () => {
                                await tolakTagihanEvent(selectedBillingDetail.id, 'Bukti transfer tidak sesuai atau buram.')
                                setBillingDetailModalOpen(false)
                                Alert.alert('Perhatian', `Bukti iuran warga ${selectedBillingDetail.warga?.nama} ditolak. Warga dapat mengunggah bukti baru.`)
                              }
                            }
                          ]
                        )
                      }}
                    >
                      <Text style={[styles.modalDoneBtnText, { color: colors.danger }]}>✕ Tolak / Minta Perbaikan Bukti</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {selectedBillingDetail.warga?.noHp && (
                  <TouchableOpacity
                    style={[
                      styles.modalDoneBtn,
                      {
                        backgroundColor: selectedBillingDetail.status === 'Lunas' ? '#0284C7' : '#16A34A',
                        marginBottom: 8,
                        flexDirection: 'row',
                        justifyContent: 'center',
                        gap: 6
                      }
                    ]}
                    onPress={() => {
                      const url = generateWaEvent(
                        selectedBillingDetail.warga,
                        selectedBillingDetail.event,
                        selectedBillingDetail,
                        config?.namaLingkungan,
                        payBank.account_number
                      )
                      if (url) Linking.openURL(url)
                    }}
                  >
                    <MessageCircle size={16} color="#FFFFFF" />
                    <Text style={styles.modalDoneBtnText}>
                      {selectedBillingDetail.status === 'Lunas' ? 'Kirim Kwitansi via WhatsApp' : 'Kirim Pengingat WhatsApp'}
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.modalDoneBtn, { backgroundColor: '#F1F5F9' }]}
                  onPress={() => setBillingDetailModalOpen(false)}
                >
                  <Text style={[styles.modalDoneBtnText, { color: colors.textSecondary }]}>Kembali</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* FULLSCREEN QRIS MODAL */}
      <Modal
        visible={qrisZoomModalOpen}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setQrisZoomModalOpen(false)}
      >
        <View style={styles.fullscreenModal}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setQrisZoomModalOpen(false)}
          />
          <View style={styles.modalContentCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle}>QRIS Resmi {isPayRw ? 'RW 15' : payTargetRT?.name || 'RT 01'}</Text>
              <TouchableOpacity onPress={() => setQrisZoomModalOpen(false)} style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalQrisLargeBox}>
              <Image
                source={{ uri: qrisUri }}
                style={styles.modalQrisLargeImage}
                resizeMode="contain"
              />
            </View>

            <Text style={styles.modalMerchantName}>{isPayRw ? 'KAS RW 15' : `KAS ${payTargetRT?.name || 'RT 01'}`}</Text>
            <Text style={styles.modalGuideText}>
              Buka aplikasi M-Banking (BCA, Mandiri, BRI, BNI) atau E-Wallet (GoPay, OVO, Dana, ShopeePay) untuk scan barcode di atas.
            </Text>

            <TouchableOpacity style={styles.modalDoneBtn} onPress={() => setQrisZoomModalOpen(false)}>
              <Text style={styles.modalDoneBtnText}>Tutup Layar Penuh</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL PILIH SUMBER FOTO BUKTI EVENT */}
      <Modal
        visible={eventPickerModalOpen}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setEventPickerModalOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setEventPickerModalOpen(false)}
        >
          <View style={styles.pickerModalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.pickerModalHeader}>
              <Text style={styles.pickerModalTitle}>Pilih Bukti Pembayaran Kegiatan</Text>
              <TouchableOpacity onPress={() => setEventPickerModalOpen(false)}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.pickerModalSubtitle}>
              Ambil foto struk transfer / screenshot m-banking Anda
            </Text>

            <View style={styles.pickerOptionsRow}>
              <TouchableOpacity
                style={styles.pickerOptionCard}
                onPress={handleTakeEventPhoto}
                activeOpacity={0.8}
              >
                <View style={[styles.pickerOptionIconBox, { backgroundColor: '#EEF2FF' }]}>
                  <Camera size={28} color={colors.primary} />
                </View>
                <Text style={styles.pickerOptionLabel}>Ambil Foto</Text>
                <Text style={styles.pickerOptionDesc}>Kamera HP</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.pickerOptionCard}
                onPress={handlePickEventGallery}
                activeOpacity={0.8}
              >
                <View style={[styles.pickerOptionIconBox, { backgroundColor: '#F0FDF4' }]}>
                  <ImageIcon size={28} color={colors.success} />
                </View>
                <Text style={styles.pickerOptionLabel}>Pilih dari Galeri</Text>
                <Text style={styles.pickerOptionDesc}>Album Foto</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.pickerCancelBtn}
              onPress={() => setEventPickerModalOpen(false)}
            >
              <Text style={styles.pickerCancelText}>Batal</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: 190
  },
  card: {
    marginBottom: spacing.md
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs
  },
  scopeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    minWidth: 0,
    marginRight: spacing.xs
  },
  cardTitle: {
    ...typography.cardTitle,
    flex: 1
  },
  deleteBtn: {
    padding: 6
  },
  cardDesc: {
    ...typography.bodySecondary,
    lineHeight: 18,
    marginBottom: spacing.sm
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1
  },
  metaText: {
    ...typography.caption,
    fontSize: 11
  },
  iuranBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm
  },
  iuranLabel: {
    fontSize: 10,
    color: colors.textSecondary
  },
  iuranVal: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary
  },
  iuranProgress: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm
  },
  progressText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.success
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.textSecondary
  },
  emptySub: {
    ...typography.bodySecondary,
    textAlign: 'center',
    marginTop: 4
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 104,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card
  },
  inputGroup: {
    marginBottom: spacing.sm
  },
  label: {
    ...typography.label,
    marginBottom: 4
  },
  subLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 2
  },
  input: {
    height: 46,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    fontSize: 14,
    color: colors.textPrimary,
    backgroundColor: colors.surface
  },
  formSectionBox: {
    padding: spacing.sm,
    backgroundColor: '#F8FAFC',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: spacing.sm
  },
  formSectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6
  },
  rtScopeFixedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    padding: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#A7F3D0'
  },
  rtScopeFixedText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065F46'
  },
  selectorBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border
  },
  selectorBtnPurpleActive: {
    backgroundColor: '#9333EA',
    borderColor: '#7E22CE'
  },
  selectorBtnGreenActive: {
    backgroundColor: '#059669',
    borderColor: '#047857'
  },
  selectorBtnAmberActive: {
    backgroundColor: '#D97706',
    borderColor: '#B45309'
  },
  selectorBtnDarkActive: {
    backgroundColor: '#0F172A',
    borderColor: '#020617'
  },
  selectorBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary
  },
  selectorBtnTextWhite: {
    color: '#FFFFFF',
    fontWeight: '700'
  },
  rtSelectChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 6
  },
  rtSelectChipActive: {
    backgroundColor: '#059669',
    borderColor: '#047857'
  },
  rtSelectChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary
  },
  rtSelectChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700'
  },
  wargaSelectChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.sm,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginRight: 6
  },
  wargaSelectChipActive: {
    backgroundColor: '#D97706',
    borderColor: '#B45309'
  },
  wargaSelectChipName: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary
  },
  wargaSelectChipNameActive: {
    color: '#FFFFFF'
  },
  wargaSelectChipSub: {
    fontSize: 9,
    color: colors.textSecondary
  },
  wargaSelectChipSubActive: {
    color: '#FEF3C7'
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 6
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  categoryChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700'
  },
  presetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    flexWrap: 'wrap'
  },
  presetLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary
  },
  presetChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.xs,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1'
  },
  presetChipText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textPrimary
  },
  toggleBtn: {
    width: 44,
    height: 24,
    borderRadius: 12,
    padding: 2,
    justifyContent: 'center'
  },
  toggleBtnActive: {
    backgroundColor: '#D97706',
    alignItems: 'flex-end'
  },
  toggleBtnInactive: {
    backgroundColor: '#CBD5E1',
    alignItems: 'flex-start'
  },
  toggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    ...shadows.card
  },
  toggleKnobActive: {
    backgroundColor: '#FFFFFF'
  },
  toggleKnobInactive: {
    backgroundColor: '#FFFFFF'
  },
  scopeBtn: {
    flex: 1,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center'
  },
  scopeBtnActive: {
    backgroundColor: '#ECFDF5',
    borderColor: colors.primary
  },
  scopeBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary
  },
  scopeBtnTextActive: {
    color: colors.primary,
    fontWeight: '700'
  },
  detailTitle: {
    ...typography.h3,
    marginBottom: spacing.xs
  },
  detailDesc: {
    ...typography.bodySecondary,
    lineHeight: 20,
    marginBottom: spacing.md
  },
  detailInfoBox: {
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border
  },
  detailInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4
  },
  detailInfoLabel: {
    ...typography.caption
  },
  detailInfoVal: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary
  },
  teRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight
  },
  teWargaName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary
  },
  teWargaBlok: {
    ...typography.caption
  },
  tePayBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm
  },
  tePayText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.surface
  },
  paySummaryBox: {
    backgroundColor: '#ECFDF5',
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: '#A7F3D0'
  },
  payEventName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary
  },
  payEventNominal: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primary,
    marginVertical: 2
  },
  payEventScope: {
    fontSize: 11,
    color: colors.textSecondary
  },
  payMethodBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: radius.sm,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border
  },
  payMethodBtnActive: {
    backgroundColor: '#FEF2F2',
    borderColor: colors.primary
  },
  payMethodText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary
  },
  payMethodTextActive: {
    color: colors.primary,
    fontWeight: '700'
  },
  bankDetailCard: {
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm
  },
  bankName: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary
  },
  accountNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 0.5
  },
  accountHolder: {
    fontSize: 11,
    color: colors.textSecondary
  },
  qrisDetailCard: {
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    marginBottom: spacing.sm
  },
  qrisTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6
  },
  qrisImageWrap: {
    backgroundColor: colors.surface,
    padding: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 6
  },
  qrisGuide: {
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 14
  },
  qrisZoomBadge: {
    marginTop: 6,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  qrisZoomBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary
  },
  zoomQrisBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
    paddingVertical: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA'
  },
  zoomQrisBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary
  },
  uploadArea: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    padding: 10
  },
  uploadBtnChoice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1'
  },
  uploadBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary
  },
  proofPreviewCard: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF'
  },
  proofImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#F1F5F9'
  },
  proofInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#F8FAFC'
  },
  proofTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669'
  },
  proofSub: {
    fontSize: 9,
    color: colors.textSecondary,
    marginTop: 2
  },
  proofRemoveBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#FEE2E2',
    borderRadius: 6
  },
  proofRemoveText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.danger
  },
  fullscreenModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.75)'
  },
  modalContentCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    ...shadows.card
  },
  modalHeader: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  modalHeaderTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary
  },
  modalCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalCloseText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary
  },
  modalQrisLargeBox: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 12
  },
  modalQrisLargeImage: {
    width: 250,
    height: 250
  },
  modalMerchantName: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 4
  },
  modalGuideText: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 16,
    paddingHorizontal: 8
  },
  modalDoneBtn: {
    width: '100%',
    paddingVertical: 12,
    backgroundColor: colors.primary,
    borderRadius: 12,
    alignItems: 'center'
  },
  modalDoneBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end'
  },
  pickerModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36
  },
  pickerModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  pickerModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textMain
  },
  pickerModalSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 18
  },
  pickerOptionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16
  },
  pickerOptionCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: 16,
    alignItems: 'center'
  },
  pickerOptionIconBox: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10
  },
  pickerOptionLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textMain,
    marginBottom: 2
  },
  pickerOptionDesc: {
    fontSize: 11,
    color: colors.textSecondary
  },
  pickerCancelBtn: {
    width: '100%',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12
  },
  pickerCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary
  },
  billingSummaryGrid: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10
  },
  billingSummaryCard: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center'
  },
  billingSummaryNum: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary
  },
  billingSummaryLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textSecondary,
    marginTop: 2
  },
  billingSearchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    height: 38,
    marginBottom: 8
  },
  billingSearchInput: {
    flex: 1,
    fontSize: 12,
    color: colors.textPrimary,
    paddingVertical: 0
  },
  billingFilterScroll: {
    flexDirection: 'row',
    marginBottom: 10
  },
  billingFilterChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    marginRight: 6,
    borderWidth: 1,
    borderColor: 'transparent'
  },
  billingFilterChipActive: {
    backgroundColor: '#EEF2FF',
    borderColor: colors.primary
  },
  billingFilterChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary
  },
  billingFilterChipTextActive: {
    color: colors.primary
  },
  teRowCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8
  },
  teWaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#86EFAC'
  },
  teWaBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#166534'
  },
  /* DANA TERKUMPUL & PROGRESS BAR STYLES */
  iuranBanner: {
    backgroundColor: '#F8FAFC',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.xs
  },
  iuranTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8
  },
  iuranNominalCol: {
    flex: 1,
    minWidth: 0
  },
  iuranLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 2
  },
  iuranVal: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primary
  },
  iuranValSub: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary
  },
  danaTerkumpulBadge: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.md,
    alignItems: 'flex-end',
    minWidth: 100
  },
  danaBadgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 1
  },
  danaTerkumpulBadgeLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#047857',
    textTransform: 'uppercase',
    letterSpacing: 0.3
  },
  danaTerkumpulBadgeVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#059669'
  },
  progressBarWrap: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3
  },
  progressLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 5,
    gap: 4
  },
  progressSubText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
    flexShrink: 1
  },
  progressTargetText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textPrimary,
    flexShrink: 0
  },
  myStatusRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight
  },
  myStatusLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600'
  },
  /* DETAIL MODAL DANA CARD */
  detailDanaCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    padding: spacing.md,
    marginTop: spacing.md
  },
  detailDanaHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm
  },
  detailDanaIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center'
  },
  detailDanaSubLabel: {
    fontSize: 11,
    color: '#166534',
    fontWeight: '600'
  },
  detailDanaAmountText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#047857'
  },
  detailDanaPercentPill: {
    backgroundColor: '#059669',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full
  },
  detailDanaPercentText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.white
  },
  detailDanaStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4
  },
  detailDanaStatText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#15803D'
  },
  detailDanaSeparateNotice: {
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: '#DCFCE7'
  },
  detailDanaNoticeText: {
    fontSize: 11,
    color: '#166534',
    lineHeight: 16
  },
  /* BILLING MODAL DANA BOX */
  billingDanaBox: {
    backgroundColor: '#ECFDF5',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    padding: spacing.sm,
    marginBottom: spacing.sm
  },
  billingDanaHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs
  },
  billingDanaIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center'
  },
  billingDanaSubTitle: {
    fontSize: 10,
    color: '#065F46',
    fontWeight: '600'
  },
  billingDanaAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#047857'
  },
  billingDanaPercentBadge: {
    backgroundColor: '#059669',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full
  },
  billingDanaPercentText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.white
  },
  billingDanaDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#D1FAE5'
  },
  billingDanaDetailItem: {
    fontSize: 11,
    color: '#065F46'
  },
  billingDanaNotice: {
    fontSize: 10,
    color: '#047857',
    marginTop: 4,
    fontStyle: 'italic'
  }
})
