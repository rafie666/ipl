import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  Modal
} from 'react-native'
import {
  ArrowLeft,
  CreditCard,
  QrCode,
  Building,
  CheckCircle2,
  Upload,
  Copy,
  Info,
  AlertTriangle,
  History,
  Banknote,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Camera,
  Image as ImageIcon,
  X,
  Check,
  Receipt,
  RefreshCw,
  Sparkles,
  Zap
} from 'lucide-react-native'
import * as ImagePicker from 'expo-image-picker'
import { uploadImageToSupabaseStorage } from '../../api/supabase'
import { useApp } from '../../context/AppContext'
import { colors, shadows, radius, spacing, typography } from '../../utils/theme'
import {
  formatRupiah,
  NAMA_BULAN,
  getKodeUnikWarga,
  getAngkaKodeUnik,
  calculateTotalWithKodeUnik
} from '../../utils/formatters'
import { copyToClipboard } from '../../utils/clipboard'
import { checkMootaMutation, getMootaBankDetail } from '../../services/mootaService'
import AppHeader from '../../components/layout/AppHeader'
import ReceiptModal from '../../components/modals/ReceiptModal'

export default function PembayaranScreen({ route, navigation }) {
  const { tagihan } = route.params || {}
  const [receiptModalVisible, setReceiptModalVisible] = useState(false)
  const [receiptData, setReceiptData] = useState(null)
  const { bayarTagihan, bayarTagihanOtomatisMoota, config, warga, bankAccounts, qrisAccounts, rts } = useApp()

  const targetWarga = warga.find((w) => w.id === tagihan?.wargaId) || {}
  const namaWarga = targetWarga.nama || tagihan?.namaWarga || 'Warga'
  const blok = targetWarga.blok || tagihan?.blok || 'A'
  const noRumah = targetWarga.noRumah || tagihan?.noRumah || '-'

  // RT tempat tinggal warga yang menerbitkan iuran
  const residentRtId = targetWarga.rt_id || tagihan?.target_payment_owner || 'rt-01-01'
  const rtObj = rts.find((r) => r.id === residentRtId || r.number === targetWarga.rt || r.id === 'rt-1') || rts[0]

  // RW spesifik tempat tinggal warga (RW 01, bukan RW 01 - RW 05!)
  const residentRwId = targetWarga.rw_id || rtObj?.rw_id || 'rw-01'
  const rwNameClean = rtObj?.rw || (config?.rw && !config.rw.includes('-') ? config.rw : 'RW 01')
  const rtNameClean = rtObj?.name || 'RT 01 / RW 01'

  // Logika: Apakah iuran RW atau iuran RT
  const isRwScope = tagihan?.payment_scope === 'RW'
  const targetOwnerId = isRwScope ? residentRwId : (rtObj?.id || residentRtId)

  // Label penerima yang jelas: Kas RT jika iuran RT, Kas RW jika iuran RW
  const cleanRecipientFromTagihan = tagihan?.pembayaran_kepada && !tagihan.pembayaran_kepada.includes('-')
    ? tagihan.pembayaran_kepada
    : null

  const recipientLabel = isRwScope
    ? (cleanRecipientFromTagihan || `Kas ${rwNameClean}`)
    : (cleanRecipientFromTagihan || `${rtNameClean}`)

  // Live Moota Bank Account
  const [mootaBank, setMootaBank] = useState({
    id: 'Lagzqp0Pk42',
    bank_id: 'Lagzqp0Pk42',
    bank_name: 'Bank Transfer (Sandbox)',
    account_number: '090908080777',
    account_holder: 'Rafi Nurrahman',
    is_primary: true
  })

  useEffect(() => {
    async function loadLiveBank() {
      const b = await getMootaBankDetail()
      if (b && b.account_number) {
        setMootaBank({
          ...b,
          account_number: b.account_number || '090908080777',
          account_holder: b.account_holder || b.username || 'Rafi Nurrahman',
          bank_name: b.bank_name || 'Bank Transfer (Sandbox)'
        })
      }
    }
    loadLiveBank()
  }, [])

  // Seluruh pembayaran transfer terintegrasi ke rekening resmi Moota Sandbox (090908080777 a.n Rafi Nurrahman)
  const officialMootaAccount = {
    id: 'moota-official-bca',
    bank_id: mootaBank?.bank_id || 'Lagzqp0Pk42',
    bank_name: mootaBank?.bank_name || 'Bank Transfer (Sandbox)',
    account_number: mootaBank?.account_number || '090908080777',
    account_holder: mootaBank?.account_holder || 'Rafi Nurrahman',
    is_primary: true
  }

  const availableBanks = [officialMootaAccount]

  const availableQris = (qrisAccounts || []).filter((q) => {
    if (isRwScope) {
      return q.owner_type === 'RW' && (q.owner_id === residentRwId || q.owner_id === 'rw-01' || q.owner_id === 'RW')
    }
    return q.owner_type === 'RT' && (q.owner_id === targetOwnerId || q.owner_id === residentRtId)
  })

  const kodeUnikWarga = getKodeUnikWarga(targetWarga)
  const exactNominal = calculateTotalWithKodeUnik(tagihan?.total || 120000, targetWarga)

  // Selected payment state
  const [metode, setMetode] = useState('Transfer') // 'Transfer' | 'QRIS' | 'Cash'
  const [selectedBankId, setSelectedBankId] = useState(availableBanks[0]?.id || '')
  const [selectedQrisId, setSelectedQrisId] = useState(availableQris[0]?.id || '')
  const [nominalBayar, setNominalBayar] = useState(String(exactNominal))
  const [tanggalBayar, setTanggalBayar] = useState(new Date().toISOString().slice(0, 10))
  const [keterangan, setKeterangan] = useState('')
  const [buktiPlaceholder, setBuktiPlaceholder] = useState('TRX-' + Math.floor(100000 + Math.random() * 900000))
  
  // Moota Auto Verification & Image Proof States
  const [checkingMoota, setCheckingMoota] = useState(false)
  const [showManualForm, setShowManualForm] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const [pickerModalOpen, setPickerModalOpen] = useState(false)
  const [qrisModalOpen, setQrisModalOpen] = useState(false)
  const [uniqueCodeModalOpen, setUniqueCodeModalOpen] = useState(true)
  const [loading, setLoading] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  // Rekening aktif yang dipilih user
  const selectedBank = availableBanks.find((b) => b.id === selectedBankId) || availableBanks[0]
  const activeBank = selectedBank || mootaBank

  const activeQris = availableQris.find((q) => q.id === selectedQrisId) || availableQris[0]

  const handleSimulasiBayarMootaSandbox = async () => {
    Alert.alert(
      'Simulasi Pembayaran Moota Sandbox',
      `Simulasikan transfer dana sejumlah ${formatRupiah(exactNominal)} ke rekening Moota Sandbox (${activeBank.account_number} a.n ${activeBank.account_holder})?\n\nTagihan akan langsung diverifikasi LUNAS, kwitansi diterbitkan, dan dana masuk dicatat ke Kas.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: '⚡ Simulasikan Lunas',
          onPress: async () => {
            setCheckingMoota(true)
            try {
              const simulatedMutation = {
                id: `sim-moota-${Date.now()}`,
                mutation_id: `MUT-${Date.now()}`,
                bank_id: activeBank.bank_id || 'Lagzqp0Pk42',
                amount: exactNominal,
                type: 'CR',
                description: `Simulasi Transfer Sandbox IPL Warga ${namaWarga} (Blok ${blok}/${noRumah})`,
                date: new Date().toISOString()
              }
              const verifyRes = await bayarTagihanOtomatisMoota(tagihan.id, simulatedMutation)
              if (verifyRes.success) {
                setReceiptData({
                  receiptId: verifyRes.noKwitansi || `KW/2026/10/B12-004`,
                  amount: exactNominal,
                  paidAt: new Date(),
                  residentName: namaWarga,
                  unitCode: `Blok ${blok} / No. ${noRumah}`,
                  paymentMethod: metode === 'QRIS' ? 'QRIS Dinamis' : 'Transfer Bank BCA',
                  recipientName: recipientLabel,
                  status: 'paid'
                })
                setReceiptModalVisible(true)
              } else {
                Alert.alert('Info', verifyRes.message || 'Tagihan sudah lunas.')
              }
            } catch (e) {
              Alert.alert('Error', e.message || 'Gagal simulasi pembayaran')
            } finally {
              setCheckingMoota(false)
            }
          }
        }
      ]
    )
  }

  const handleCekMootaOtomatis = async () => {
    setCheckingMoota(true)
    try {
      const res = await checkMootaMutation(exactNominal, activeBank.bank_id || 'Lagzqp0Pk42')
      if (res.found && res.mutation) {
        const verifyRes = await bayarTagihanOtomatisMoota(tagihan.id, res.mutation)
        if (verifyRes.success) {
          Alert.alert(
            '🎉 PEMBAYARAN BERHASIL & LUNAS!',
            `Transfer sejumlah ${formatRupiah(exactNominal)} berhasil diverifikasi!\n\nStatus Tagihan: LUNAS\nNo Kwitansi: ${verifyRes.noKwitansi}\n\nTerima kasih telah membayar iuran tepat waktu.`,
            [{ text: 'Lihat Kwitansi', onPress: () => navigation.navigate('Main', { screen: 'TagihanTab' }) }]
          )
        } else {
          Alert.alert('Info', verifyRes.message || 'Pembayaran telah terverifikasi.')
        }
      } else {
        Alert.alert(
          'Mutasi Belum Terdeteksi',
          `Belum ada mutasi masuk sebesar ${formatRupiah(exactNominal)} di rekening tujuan (${activeBank.account_number} a.n ${activeBank.account_holder}).\n\nPetunjuk:\n1. Pastikan Anda sudah transfer ke rekening yang tertera.\n2. Pastikan nominal transfer persis ${formatRupiah(exactNominal)} (termasuk 3 digit kode unik ${getAngkaKodeUnik(targetWarga)}).\n3. Untuk simulasi pengujian, klik tombol "Simulasi Masuk (Demo)" di bawah.`,
          [
            { text: 'Tutup', style: 'cancel' },
            { text: '🧪 Simulasi Masuk (Demo)', onPress: handleSimulasiBayarMootaSandbox },
            { text: 'Cek Lagi', onPress: handleCekMootaOtomatis }
          ]
        )
      }
    } catch (err) {
      Alert.alert(
        'Pengecekan Mutasi Belum Berhasil',
        err.message || 'Gagal memeriksa mutasi bank otomatis. Anda dapat menggunakan opsi unggah bukti manual di bawah.'
      )
    } finally {
      setCheckingMoota(false)
    }
  }

  const handleCopy = async (text, label) => {
    await copyToClipboard(text)
    Alert.alert('Tersalin', `${label} "${text}" berhasil disalin ke clipboard!`)
  }

  const handlePickFromGallery = () => {
    setPickerModalOpen(false)
    setTimeout(async () => {
      try {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
        if (status !== 'granted') {
          Alert.alert(
            'IZIN AKSES FOTO DIBUTUHKAN',
            'Aplikasi membutuhkan izin akses galeri foto untuk memilih bukti transfer. Silakan aktifkan izin di pengaturan perangkat Anda.',
            [
              { text: 'Batal', style: 'cancel' },
              { text: 'Coba Lagi', onPress: handlePickFromGallery }
            ]
          )
          return
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 0.35,
          base64: true
        })

        if (!result.canceled && result.assets && result.assets.length > 0) {
          processSelectedImage(result.assets[0])
        }
      } catch (err) {
        Alert.alert('Error', 'Gagal membuka galeri: ' + (err.message || 'Error'))
      }
    }, 250)
  }

  const handleTakePhoto = () => {
    setPickerModalOpen(false)
    setTimeout(async () => {
      try {
        const { status } = await ImagePicker.requestCameraPermissionsAsync()
        if (status !== 'granted') {
          Alert.alert(
            'IZIN AKSES KAMERA DIBUTUHKAN',
            'Aplikasi membutuhkan izin akses kamera untuk mengambil foto bukti transfer secara langsung.',
            [
              { text: 'Batal', style: 'cancel' },
              { text: 'Coba Lagi', onPress: handleTakePhoto }
            ]
          )
          return
        }

        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          quality: 0.35,
          base64: true
        })

        if (!result.canceled && result.assets && result.assets.length > 0) {
          processSelectedImage(result.assets[0])
        }
      } catch (err) {
        Alert.alert('Error', 'Gagal membuka kamera: ' + (err.message || 'Error'))
      }
    }, 250)
  }

  const processSelectedImage = (asset) => {
    if (!asset || !asset.uri) {
      Alert.alert('Error', 'Foto tidak terbaca, silakan coba lagi.')
      return
    }

    // 1. Validation size <= 5 MB
    if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
      Alert.alert('Validasi Gagal', 'Bukti pembayaran maksimal 5 MB.')
      return
    }

    const uri = asset.uri || ''
    const generatedName = `bukti_transfer_${Date.now()}.jpg`
    const fileName = asset.fileName || uri.split('/').pop() || generatedName
    const calculatedSize = asset.fileSize ? `${(asset.fileSize / (1024 * 1024)).toFixed(2)} MB` : '1.18 MB'

    const imagePayload = asset.base64
      ? (asset.base64.startsWith('data:') ? asset.base64 : `data:image/jpeg;base64,${asset.base64}`)
      : asset.uri

    setSelectedImage({
      uri: asset.uri,
      fileName: fileName,
      fileSize: calculatedSize,
      base64: imagePayload
    })
  }

  const handleKirimBayar = async () => {
    const nom = Number(nominalBayar || exactNominal)
    if (isNaN(nom) || nom <= 0) {
      Alert.alert('Perhatian', 'Nominal transfer tidak valid!')
      return
    }

    if (metode !== 'Cash' && !selectedImage) {
      Alert.alert(
        'Bukti Pembayaran Wajib Dilampirkan',
        'Mohon ambil foto kamera atau pilih bukti transfer dari galeri terlebih dahulu sebelum mengirim konfirmasi ke pengurus!'
      )
      return
    }

    setLoading(true)
    try {
      let proofPayloadUrl = null
      if (selectedImage) {
        const uploadRes = await uploadImageToSupabaseStorage({
          bucket: 'bukti-transfer',
          path: `tagihan/${tagihan?.id || 'trx'}/${Date.now()}_${selectedImage.fileName || 'bukti.jpg'}`,
          base64: selectedImage.base64,
          uri: selectedImage.uri,
          contentType: 'image/jpeg'
        })

        if (uploadRes.success && uploadRes.publicUrl) {
          proofPayloadUrl = uploadRes.publicUrl
        } else {
          proofPayloadUrl = selectedImage.base64 || selectedImage.uri
        }
      }

      const res = await bayarTagihan(tagihan.id, {
        metode: metode === 'Transfer' ? `Transfer ${activeBank.bank_name}` : metode === 'QRIS' ? 'QRIS Instan' : 'Tunai / Cash',
        nominal: nom,
        tanggalBayar: tanggalBayar || new Date().toISOString().slice(0, 10),
        bankAccountId: metode === 'Transfer' ? activeBank.id : null,
        qrisAccountId: metode === 'QRIS' ? activeQris?.id : null,
        buktiBayar: (buktiPlaceholder || '').trim() || 'TRX-APP-' + Math.floor(100000 + Math.random() * 900000),
        buktiTransferUrl: proofPayloadUrl,
        buktiFoto: proofPayloadUrl,
        fileName: selectedImage?.fileName,
        fileSize: selectedImage?.fileSize,
        keterangan: keterangan || `Pembayaran ${recipientLabel} Warga ${namaWarga} (Blok ${blok}/${noRumah})`
      })

      if (res.success) {
        Alert.alert(
          'BUKTI PEMBAYARAN BERHASIL DIKIRIM',
          `Bukti pembayaran kepada ${recipientLabel} telah diteruskan. Status pembayaran telah berubah menjadi MENUNGGU VERIFIKASI oleh Pengurus ${recipientLabel}.`,
          [{ text: 'Selesai', onPress: () => navigation.navigate('Main', { screen: 'TagihanTab' }) }]
        )
      } else {
        Alert.alert('Gagal', res.message || 'Gagal mengirim pembayaran.')
      }
    } catch (err) {
      Alert.alert('Gagal', 'Upload gagal. Periksa koneksi internet dan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const isPerluDiperbaiki = tagihan?.status === 'Perlu Diperbaiki' || tagihan?.status === 'Ditolak'
  const submissionsList = Array.isArray(tagihan?.submissions) ? tagihan.submissions : []

  return (
    <View style={styles.container}>
      <AppHeader
        title="Pembayaran Tagihan"
        subtitle={`Tujuan: ${recipientLabel}`}
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Banner Feedback Penolakan jika Perlu Diperbaiki */}
        {isPerluDiperbaiki && (
          <View style={styles.rejectionBanner}>
            <View style={styles.rejectionHeader}>
              <AlertTriangle size={20} color={colors.danger} />
              <Text style={styles.rejectionTitle}>Pembayaran Perlu Diperbaiki</Text>
            </View>
            <Text style={styles.rejectionReason}>
              Alasan: <Text style={{ fontWeight: '800' }}>{tagihan.alasanPenolakan || 'Bukti pembayaran tidak sesuai'}</Text>
            </Text>
            {tagihan.catatanPenolakan ? (
              <Text style={styles.rejectionNotes}>Catatan Pengurus: {tagihan.catatanPenolakan}</Text>
            ) : null}
            <Text style={styles.rejectionPrompt}>
              Silakan periksa kembali rincian di bawah dan upload bukti pembayaran yang benar.
            </Text>
          </View>
        )}

        {/* Ringkasan Nominal & Recipient Badge */}
        <View style={styles.summaryCard}>
          <View style={styles.scopeBadgeWrap}>
            <View style={[styles.scopeBadge, isRwScope ? styles.badgeRw : styles.badgeRt]}>
              <ShieldCheck size={13} color={isRwScope ? colors.primary : '#2563EB'} style={{ marginRight: 4 }} />
              <Text style={[styles.scopeBadgeText, isRwScope ? styles.textRw : styles.textRt]}>
                PEMBAYARAN KEPADA: {recipientLabel.toUpperCase()}
              </Text>
            </View>
          </View>

          <Text style={styles.summaryLabel}>TOTAL YANG HARUS DITRANSFER</Text>
          <Text style={styles.summaryAmount}>{formatRupiah(exactNominal)}</Text>

          <View style={styles.kodeUnikBadgeSummary}>
            <ShieldCheck size={13} color="#D97706" />
            <Text style={styles.kodeUnikBadgeSummaryText}>
              Termasuk 3 Digit Kode Unik: <Text style={{ fontWeight: '800' }}>{getAngkaKodeUnik(targetWarga)} ({kodeUnikWarga})</Text>
            </Text>
          </View>

          <TouchableOpacity
            style={styles.copyNominalBtn}
            onPress={() => handleCopy(String(exactNominal), 'Nominal Tepat')}
            activeOpacity={0.8}
          >
            <Copy size={14} color={colors.primary} />
            <Text style={styles.copyNominalBtnText}>Salin Nominal Tepat ({formatRupiah(exactNominal)})</Text>
          </TouchableOpacity>

          <Text style={styles.summaryPeriod}>
            Periode Bulan {tagihan?.bulan}/{tagihan?.tahun} • {namaWarga} (Blok {blok}/{noRumah})
          </Text>

          {/* Rincian Pos Tagihan Detail */}
          <View style={styles.breakdownBox}>
            <Text style={styles.breakdownTitle}>Rincian Pos Pembayaran:</Text>
            {tagihan?.rincian && tagihan.rincian.length > 0 ? (
              tagihan.rincian.map((item, idx) => (
                <View key={idx} style={[styles.breakdownRow, idx === tagihan.rincian.length - 1 && { borderBottomWidth: 0 }]}>
                  <Text style={styles.breakdownItemLabel} numberOfLines={1}>{item.nama}</Text>
                  <Text style={styles.breakdownItemVal}>{formatRupiah(item.nominal)}</Text>
                </View>
              ))
            ) : (
              <>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownItemLabel}>Iuran Pokok {recipientLabel}</Text>
                  <Text style={styles.breakdownItemVal}>{formatRupiah(Math.floor((Number(tagihan?.total || 120000)) / 1000) * 1000)}</Text>
                </View>
                <View style={[styles.breakdownRow, { borderBottomWidth: 0 }]}>
                  <Text style={styles.breakdownItemLabel}>Kode Unik 3 Digit ({kodeUnikWarga})</Text>
                  <Text style={[styles.breakdownItemVal, { color: '#D97706', fontWeight: '800' }]}>+Rp {getAngkaKodeUnik(targetWarga)}</Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Riwayat Pengajuan Bukti Sebelumnya (Jika ada) */}
        {submissionsList.length > 0 && (
          <View style={styles.historyCard}>
            <TouchableOpacity
              style={styles.historyHeaderToggle}
              onPress={() => setShowHistory(!showHistory)}
              activeOpacity={0.8}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <History size={16} color={colors.primary} />
                <Text style={styles.historyHeaderText}>
                  Riwayat Bukti Pembayaran ({submissionsList.length})
                </Text>
              </View>
              {showHistory ? <ChevronUp size={16} color={colors.textSecondary} /> : <ChevronDown size={16} color={colors.textSecondary} />}
            </TouchableOpacity>

            {showHistory && (
              <View style={styles.historyContent}>
                {submissionsList.map((sub, idx) => (
                  <View key={sub.id || idx} style={styles.historyItem}>
                    <View style={styles.historyItemTop}>
                      <Text style={styles.historyItemNum}>Pengajuan #{sub.submission_index || idx + 1}</Text>
                      <View style={[styles.subStatusBadge, sub.status === 'Lunas' ? styles.subLunas : sub.status === 'Ditolak' ? styles.subTolak : styles.subPending]}>
                        <Text style={[styles.subStatusText, sub.status === 'Lunas' ? styles.textLunas : sub.status === 'Ditolak' ? styles.textTolak : styles.textPending]}>
                          {sub.status}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.historyItemDetails}>
                      {formatRupiah(sub.nominal)} • {sub.metode} • {sub.tanggal}
                    </Text>
                    {sub.alasan_penolakan ? (
                      <Text style={styles.historyRejectReason}>
                        Alasan Ditolak: {sub.alasan_penolakan}
                      </Text>
                    ) : null}
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Pilihan 3 Metode Pembayaran */}
        <Text style={styles.sectionTitle}>Pilih Metode Pembayaran ({recipientLabel})</Text>
        <View style={styles.metodeRow}>
          <TouchableOpacity
            style={[styles.metodeCard, metode === 'Transfer' && styles.metodeCardActive]}
            onPress={() => setMetode('Transfer')}
            activeOpacity={0.8}
          >
            <Building size={18} color={metode === 'Transfer' ? colors.primary : colors.textSecondary} />
            <Text style={[styles.metodeText, metode === 'Transfer' && styles.metodeTextActive]}>
              Transfer Bank
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.metodeCard, metode === 'QRIS' && styles.metodeCardActive]}
            onPress={() => setMetode('QRIS')}
            activeOpacity={0.8}
          >
            <QrCode size={18} color={metode === 'QRIS' ? colors.primary : colors.textSecondary} />
            <Text style={[styles.metodeText, metode === 'QRIS' && styles.metodeTextActive]}>
              QRIS
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.metodeCard, metode === 'Cash' && styles.metodeCardActive]}
            onPress={() => setMetode('Cash')}
            activeOpacity={0.8}
          >
            <Banknote size={18} color={metode === 'Cash' ? colors.primary : colors.textSecondary} />
            <Text style={[styles.metodeText, metode === 'Cash' && styles.metodeTextActive]}>
              Tunai (Cash)
            </Text>
          </TouchableOpacity>
        </View>

        {/* DETAIL METODE: 1. TRANSFER BANK */}
        {metode === 'Transfer' && (
          <View style={styles.bankCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={styles.bankTitle}>Rekening Kas Resmi Lingkungan</Text>
              <View style={styles.mootaLiveBadge}>
                <Text style={styles.mootaLiveBadgeText}>MUTASI ONLINE</Text>
              </View>
            </View>

            <Text style={styles.bankName}>
              {(activeBank.bank_name || 'BCA').toLowerCase().startsWith('bank') ? activeBank.bank_name : `Bank ${activeBank.bank_name}`}
            </Text>
            <View style={styles.rekRow}>
              <Text style={styles.rekNumber}>{activeBank.account_number}</Text>
              <TouchableOpacity
                style={styles.copyBtn}
                onPress={() => handleCopy(activeBank.account_number, 'Nomor Rekening')}
                activeOpacity={0.8}
              >
                <Copy size={13} color={colors.primary} style={{ marginRight: 4 }} />
                <Text style={styles.copyText}>Salin</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.rekOwner}>a.n {activeBank.account_holder}</Text>
          </View>
        )}

        {/* VERIFIKASI OTOMATIS (METODE TRANSFER) */}
        {metode === 'Transfer' && (
          <View style={styles.mootaCard}>
            <View style={styles.mootaBadgeRow}>
              <View style={styles.mootaBadge}>
                <Zap size={14} color="#D97706" />
                <Text style={styles.mootaBadgeText}>VERIFIKASI MUTASI OTOMATIS</Text>
              </View>
              <View style={styles.mootaLiveDotWrap}>
                <View style={styles.mootaLiveDot} />
                <Text style={styles.mootaStatusOnline}>Real-time Online</Text>
              </View>
            </View>

            <Text style={styles.mootaHeading}>⚡ Pembayaran Otomatis Tanpa Upload Struk</Text>
            <Text style={styles.mootaText}>
              1. Transfer persis <Text style={{ fontWeight: '800', color: colors.primary }}>{formatRupiah(exactNominal)}</Text> ke rekening di atas.
            </Text>
            <Text style={styles.mootaText}>
              2. Nominal di atas sudah termasuk 3 digit kode unik khusus Anda (<Text style={{ fontWeight: '800', color: '#B45309' }}>{getAngkaKodeUnik(targetWarga)}</Text>).
            </Text>
            <Text style={styles.mootaText}>
              3. Setelah Anda transfer, klik tombol di bawah untuk verifikasi mutasi rekening secara instan:
            </Text>

            <TouchableOpacity
              style={[styles.mootaCheckBtn, checkingMoota && { opacity: 0.75 }]}
              onPress={handleCekMootaOtomatis}
              disabled={checkingMoota}
              activeOpacity={0.85}
            >
              {checkingMoota ? (
                <ActivityIndicator color={colors.white} size="small" style={{ marginRight: 8 }} />
              ) : (
                <Zap size={18} color="#FEF08A" style={{ marginRight: 8 }} />
              )}
              <Text style={styles.mootaCheckBtnText}>
                {checkingMoota ? 'Memeriksa Mutasi Bank...' : '⚡ Cek Pembayaran Otomatis'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.mootaCheckBtn,
                { backgroundColor: '#0284C7', marginTop: 8 },
                checkingMoota && { opacity: 0.75 }
              ]}
              onPress={handleSimulasiBayarMootaSandbox}
              disabled={checkingMoota}
              activeOpacity={0.85}
            >
              <Sparkles size={18} color="#E0F2FE" style={{ marginRight: 8 }} />
              <Text style={styles.mootaCheckBtnText}>
                🧪 Simulasi Transfer Masuk (Demo)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.manualFallbackToggle}
              onPress={() => setShowManualForm(!showManualForm)}
              activeOpacity={0.8}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <Upload size={14} color={colors.textSecondary} style={{ marginRight: 6 }} />
                <Text style={styles.manualFallbackToggleText}>
                  {showManualForm ? 'Sembunyikan Formulir Bukti Manual' : 'Unggah Bukti Transfer Manual (Opsional / Cadangan)'}
                </Text>
              </View>
              {showManualForm ? (
                <ChevronUp size={16} color={colors.textSecondary} />
              ) : (
                <ChevronDown size={16} color={colors.textSecondary} />
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* DETAIL METODE: 2. QRIS */}
        {metode === 'QRIS' && (
          <View style={styles.qrisCard}>
            {availableQris.length > 1 && (
              <View style={styles.bankPickerRow}>
                {availableQris.map((q) => (
                  <TouchableOpacity
                    key={q.id}
                    style={[styles.bankPickChip, selectedQrisId === q.id && styles.bankPickChipActive]}
                    onPress={() => setSelectedQrisId(q.id)}
                  >
                    <Text style={[styles.bankPickText, selectedQrisId === q.id && styles.bankPickTextActive]}>
                      {q.qris_name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <TouchableOpacity
              style={styles.qrisBox}
              onPress={() => setQrisModalOpen(true)}
              activeOpacity={0.9}
            >
              <Image
                source={{
                  uri:
                    activeQris?.image_url ||
                    'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=00020101021126580014ID.CO.QRIS.WWW01189360099900000000015204581253033605802ID5914KAS%20WARGA6005BOGOR61051661063046D94'
                }}
                style={styles.qrisImage}
                resizeMode="contain"
              />
              <View style={styles.qrisZoomBadge}>
                <Text style={styles.qrisZoomBadgeText}>🔍 Ketuk untuk Perbesar Full</Text>
              </View>
            </TouchableOpacity>
            <Text style={styles.qrisTitle}>{activeQris?.qris_name || `QRIS Kas ${recipientLabel}`}</Text>
            <Text style={styles.qrisDesc}>
              Buka aplikasi BCA Mobile, GoPay, OVO, ShopeePay, atau DANA lalu scan kode QRIS resmi {recipientLabel}.
            </Text>

            <TouchableOpacity
              style={styles.zoomQrisBtn}
              onPress={() => setQrisModalOpen(true)}
              activeOpacity={0.8}
            >
              <QrCode size={16} color={colors.primary} />
              <Text style={styles.zoomQrisBtnText}>Lihat QRIS Layar Penuh</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* DETAIL METODE: 3. TUNAI / CASH */}
        {metode === 'Cash' && (
          <View style={styles.cashCard}>
            <View style={styles.cashHeader}>
              <Banknote size={24} color={colors.success} />
              <Text style={styles.cashTitle}>Setoran Tunai ke Pengurus</Text>
            </View>
            <Text style={styles.cashDesc}>
              Silakan serahkan uang tunai langsung kepada Bendahara/Ketua {recipientLabel} ({rtObj?.bendahara || rtObj?.ketua || config?.bendaharaRw || 'Pengurus'}).
            </Text>
            <Text style={styles.cashNotice}>
              Setelah menyerahkan uang tunai, kirim formulir konfirmasi ini agar pengurus dapat segera mencatat pelunasan di aplikasi.
            </Text>
          </View>
        )}

        {/* Form Upload Bukti Pembayaran */}
        {(metode !== 'Transfer' || showManualForm) && (
          <View style={styles.formCard}>
            <View style={styles.formCardHeaderRow}>
              <Text style={styles.formTitle}>
                {metode === 'Transfer' ? 'Upload Bukti Transfer Manual' : 'Upload Bukti Pembayaran'}
              </Text>
              {metode === 'Transfer' && (
                <TouchableOpacity onPress={() => setShowManualForm(false)}>
                  <X size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>

            {/* Upload Bukti Foto Pembayaran */}
            <View style={[styles.inputGroup, { marginBottom: 14 }]}>
              {selectedImage ? (
                <View style={styles.proofPreviewCard}>
                  <Image source={{ uri: selectedImage.uri }} style={styles.proofImage} resizeMode="cover" />
                  <View style={styles.proofInfoRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.proofTitle}>Foto Bukti Terpilih ✓</Text>
                      <Text style={styles.proofSub} numberOfLines={1}>
                        {selectedImage.fileName}
                      </Text>
                      <Text style={styles.proofSubSize}>Ukuran: {selectedImage.fileSize}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.changePhotoBtn}
                      onPress={() => setPickerModalOpen(true)}
                      activeOpacity={0.8}
                    >
                      <RefreshCw size={14} color={colors.primary} />
                      <Text style={styles.changePhotoBtnText}>Ganti</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.proofRemoveBtn}
                      onPress={() => setSelectedImage(null)}
                      activeOpacity={0.8}
                    >
                      <X size={14} color={colors.danger} />
                      <Text style={styles.proofRemoveText}>Hapus</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.uploadArea}>
                  <TouchableOpacity
                    style={styles.uploadBtnChoice}
                    onPress={() => setPickerModalOpen(true)}
                    activeOpacity={0.85}
                  >
                    <Upload size={20} color={colors.white} />
                    <Text style={styles.uploadBtnText}>Upload Bukti Pembayaran</Text>
                  </TouchableOpacity>
                  <Text style={styles.uploadHintText}>
                    Pilih dari Galeri atau Ambil Foto Kamera (Maks 5 MB, JPG/PNG)
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.infoAlert}>
              <Info size={16} color={colors.info} style={{ marginRight: 8, marginTop: 1 }} />
              <Text style={styles.infoAlertText}>
                Pembayaran ditujukan kepada <Text style={{ fontWeight: '800' }}>{recipientLabel}</Text>. Setelah dikirim, pengurus {recipientLabel} akan memverifikasi bukti Anda.
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.btnDisabled]}
              onPress={handleKirimBayar}
              disabled={loading}
              activeOpacity={0.88}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <Upload size={18} color={colors.white} style={{ marginRight: 8 }} />
                  <Text style={styles.submitBtnText}>
                    {isPerluDiperbaiki ? 'Upload Ulang Bukti Pembayaran' : 'Kirim Bukti Pembayaran'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* POP-UP PENGINGAT 3 DIGIT KODE UNIK WARGA */}
      <Modal
        visible={uniqueCodeModalOpen}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setUniqueCodeModalOpen(false)}
      >
        <View style={styles.centerModalOverlay}>
          <TouchableOpacity
            style={styles.centerModalBackdrop}
            activeOpacity={1}
            onPress={() => setUniqueCodeModalOpen(false)}
          />
          <View style={styles.uniqueModalCard}>
            <TouchableOpacity
              style={styles.uniqueModalCloseBtn}
              onPress={() => setUniqueCodeModalOpen(false)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel="Tutup"
            >
              <X size={18} color={colors.textSecondary} />
            </TouchableOpacity>

            <View style={styles.uniqueModalIconWrap}>
              <Receipt size={24} color={colors.primary} />
            </View>

            <Text style={styles.uniqueModalTitle}>Transfer Sesuai Kode Unik</Text>
            <Text style={styles.uniqueModalDesc}>
              Mohon transfer tepat hingga 3 digit terakhir agar pembayaran terverifikasi otomatis.
            </Text>

            <View style={styles.uniqueModalNominalBox}>
              <Text style={styles.uniqueModalNominalLabel}>TOTAL TRANSFER</Text>
              <Text style={styles.uniqueModalNominalText}>{formatRupiah(exactNominal)}</Text>
              <View style={styles.uniqueModalCodeBadge}>
                <Text style={styles.uniqueModalCodeBadgeText}>
                  Kode Unik: <Text style={{ fontWeight: '800' }}>{getAngkaKodeUnik(targetWarga)}</Text>
                </Text>
              </View>
            </View>

            <Text style={styles.uniqueModalNoteText}>
              ⚠️ Jangan bulatkan ke 000 agar transaksi langsung terbaca.
            </Text>

            <View style={styles.uniqueModalActionRow}>
              <TouchableOpacity
                style={styles.uniqueModalCopyBtn}
                onPress={() => {
                  handleCopy(String(exactNominal), 'Nominal Transfer')
                  setUniqueCodeModalOpen(false)
                }}
                activeOpacity={0.8}
              >
                <Copy size={15} color={colors.textSecondary} />
                <Text style={styles.uniqueModalCopyBtnText}>Salin Nominal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.uniqueModalOkBtn}
                onPress={() => setUniqueCodeModalOpen(false)}
                activeOpacity={0.85}
              >
                <Text style={styles.uniqueModalOkBtnText}>Saya Mengerti</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL PILIH SUMBER FOTO */}
      <Modal
        visible={pickerModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerModalOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setPickerModalOpen(false)}
        >
          <View style={styles.pickerModalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.pickerModalHeader}>
              <Text style={styles.pickerModalTitle}>Pilih Bukti Pembayaran</Text>
              <TouchableOpacity onPress={() => setPickerModalOpen(false)}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.pickerModalSubtitle}>
              Ambil foto struk transfer / screenshot m-banking Anda
            </Text>

            <View style={styles.pickerOptionsRow}>
              <TouchableOpacity
                style={styles.pickerOptionCard}
                onPress={handleTakePhoto}
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
                onPress={handlePickFromGallery}
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
              onPress={() => setPickerModalOpen(false)}
            >
              <Text style={styles.pickerCancelText}>Batal</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* FULLSCREEN QRIS MODAL */}
      <Modal
        visible={qrisModalOpen}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setQrisModalOpen(false)}
      >
        <View style={styles.fullscreenModal}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setQrisModalOpen(false)}
          />
          <View style={[styles.modalContentCard, { maxHeight: '90%', display: 'flex', flexDirection: 'column' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle}>QRIS Resmi {recipientLabel}</Text>
              <TouchableOpacity onPress={() => setQrisModalOpen(false)} style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={{ flexShrink: 1, width: '100%' }}
              contentContainerStyle={{ alignItems: 'center', paddingBottom: 16 }}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
            >
              <View style={styles.modalQrisLargeBox}>
                <Image
                  source={{
                    uri:
                      activeQris?.image_url ||
                      'https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=00020101021126580014ID.CO.QRIS.WWW01189360099900000000015204581253033605802ID5914KAS%20WARGA6005BOGOR61051661063046D94'
                  }}
                  style={styles.modalQrisLargeImage}
                  resizeMode="contain"
                />
              </View>

              <Text style={styles.modalMerchantName}>{activeQris?.qris_name || `KAS WARGA ${recipientLabel}`}</Text>
              <Text style={styles.modalGuideText}>
                Buka aplikasi M-Banking (BCA, Mandiri, BRI, BNI) atau E-Wallet (GoPay, OVO, Dana, ShopeePay) untuk scan barcode di atas.
              </Text>
            </ScrollView>

            <TouchableOpacity style={styles.modalDoneBtn} onPress={() => setQrisModalOpen(false)}>
              <Text style={styles.modalDoneBtnText}>Tutup Layar Penuh</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* §4.5 Modal Kuitansi (Bottom Sheet) */}
      <ReceiptModal
        visible={receiptModalVisible}
        data={receiptData}
        onClose={() => {
          setReceiptModalVisible(false)
          navigation.navigate('Main', { screen: 'TagihanTab' })
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80
  },
  rejectionBanner: {
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#FECDD3'
  },
  rejectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6
  },
  rejectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.danger
  },
  rejectionReason: {
    fontSize: 13,
    color: colors.textMain,
    marginBottom: 4
  },
  rejectionNotes: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 6,
    fontStyle: 'italic'
  },
  rejectionPrompt: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16
  },
  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: 22,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
    ...shadows.card
  },
  scopeBadgeWrap: {
    marginBottom: 10
  },
  scopeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10
  },
  badgeRt: {
    backgroundColor: '#DBEAFE'
  },
  badgeRw: {
    backgroundColor: colors.primarySubtle
  },
  scopeBadgeText: {
    fontSize: 11,
    fontWeight: '800'
  },
  textRt: {
    color: '#2563EB'
  },
  textRw: {
    color: colors.primary
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5,
    marginBottom: 4
  },
  summaryAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textMain,
    letterSpacing: -0.5
  },
  kodeUnikBadgeSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginTop: 6,
    marginBottom: 8
  },
  kodeUnikBadgeSummaryText: {
    fontSize: 11,
    color: '#92400E',
    fontWeight: '700'
  },
  copyNominalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 4
  },
  copyNominalBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.primary
  },
  summaryPeriod: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 6,
    textAlign: 'center'
  },
  breakdownBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginTop: 12
  },
  breakdownTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  breakdownItemLabel: {
    fontSize: 12,
    color: colors.textMain,
    flex: 1,
    paddingRight: 8
  },
  breakdownItemVal: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMain
  },

  /* UNIQUE CODE MODAL STYLES (CENTERED & REFINED) */
  centerModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  centerModalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.65)'
  },
  uniqueModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    width: '100%',
    maxWidth: 350,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
    ...shadows.card
  },
  uniqueModalCloseBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10
  },
  uniqueModalIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10
  },
  uniqueModalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 4
  },
  uniqueModalDesc: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 14,
    paddingHorizontal: 6
  },
  uniqueModalNominalBox: {
    backgroundColor: '#F8FAFC',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    width: '100%',
    marginBottom: 10
  },
  uniqueModalNominalLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 2
  },
  uniqueModalNominalText: {
    fontSize: 26,
    fontWeight: '900',
    color: '#059669',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5
  },
  uniqueModalCodeBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 6
  },
  uniqueModalCodeBadgeText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#065F46'
  },
  uniqueModalNoteText: {
    fontSize: 11.5,
    color: '#B45309',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 16
  },
  uniqueModalActionRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%'
  },
  uniqueModalCopyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  uniqueModalCopyBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary
  },
  uniqueModalOkBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: colors.primary
  },
  uniqueModalOkBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF'
  },
  historyCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
    overflow: 'hidden'
  },
  historyHeaderToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14
  },
  historyHeaderText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMain
  },
  historyContent: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderColor: colors.border
  },
  historyItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9'
  },
  historyItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  historyItemNum: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textMain
  },
  subStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6
  },
  subLunas: {
    backgroundColor: '#DCFCE7'
  },
  subTolak: {
    backgroundColor: '#FEE2E2'
  },
  subPending: {
    backgroundColor: '#FEF3C7'
  },
  subStatusText: {
    fontSize: 10,
    fontWeight: '800'
  },
  textLunas: {
    color: colors.success
  },
  textTolak: {
    color: colors.danger
  },
  textPending: {
    color: colors.warning
  },
  historyItemDetails: {
    fontSize: 11,
    color: colors.textSecondary
  },
  historyRejectReason: {
    fontSize: 11,
    color: colors.danger,
    marginTop: 3,
    fontWeight: '600'
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textMain,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10
  },
  metodeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14
  },
  metodeCard: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 14,
    paddingVertical: 12,
    ...shadows.soft
  },
  metodeCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight
  },
  metodeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary
  },
  metodeTextActive: {
    color: colors.primary,
    fontWeight: '800'
  },
  bankCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft
  },
  bankTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary
  },
  bankPickerRow: {
    flexDirection: 'row',
    gap: 6,
    marginVertical: 8
  },
  bankPickChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border
  },
  bankPickChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  bankPickText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary
  },
  bankPickTextActive: {
    color: colors.white
  },
  bankName: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textMain,
    marginTop: 4
  },
  rekRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 8
  },
  rekNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textMain,
    fontFamily: 'monospace'
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8
  },
  copyText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary
  },
  rekOwner: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 6
  },
  qrisCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft
  },
  qrisBox: {
    backgroundColor: colors.white,
    padding: 12,
    borderRadius: 16,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center'
  },
  qrisImage: {
    width: 180,
    height: 180
  },
  qrisTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textMain
  },
  qrisDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16
  },
  cashCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BBF7D0'
  },
  cashHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6
  },
  cashTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.success
  },
  cashDesc: {
    fontSize: 12,
    color: colors.textMain,
    lineHeight: 17,
    marginBottom: 6
  },
  cashNotice: {
    fontSize: 11,
    color: colors.textSecondary,
    fontStyle: 'italic'
  },
  formCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft
  },
  formTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textMain,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12
  },
  inputGroup: {
    marginBottom: 12
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMain,
    marginBottom: 5
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: colors.textMain,
    fontSize: 13,
    borderWidth: 1,
    borderColor: colors.border
  },
  textArea: {
    height: 60,
    textAlignVertical: 'top'
  },
  infoAlert: {
    flexDirection: 'row',
    backgroundColor: colors.infoBg,
    borderRadius: 10,
    padding: 10,
    marginBottom: 14
  },
  infoAlertText: {
    flex: 1,
    fontSize: 11,
    color: colors.info,
    lineHeight: 15
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 13,
    ...shadows.soft
  },
  btnDisabled: {
    opacity: 0.6
  },
  submitBtnText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '800'
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
    backgroundColor: '#ECFDF5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0'
  },
  zoomQrisBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary
  },
  uploadArea: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    padding: 16,
    alignItems: 'center'
  },
  uploadBtnChoice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    width: '100%',
    ...shadows.soft
  },
  uploadBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.white
  },
  uploadHintText: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center'
  },
  proofPreviewCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    ...shadows.card
  },
  proofImage: {
    width: '100%',
    height: 160,
    backgroundColor: '#F1F5F9'
  },
  proofInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8FAFC',
    gap: 8
  },
  proofTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#059669'
  },
  proofSub: {
    fontSize: 11,
    color: colors.textMain,
    fontWeight: '600',
    marginTop: 2
  },
  proofSubSize: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 1
  },
  changePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#EEF2FF',
    borderRadius: 8
  },
  changePhotoBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary
  },
  proofRemoveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#FEE2E2',
    borderRadius: 8
  },
  proofRemoveText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.danger
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
  // Moota Auto Verification Styles
  mootaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#FEF3C7',
    ...shadows.sm
  },
  mootaBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  mootaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8
  },
  mootaBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
    marginLeft: 4,
    letterSpacing: 0.5
  },
  mootaLiveDotWrap: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  mootaLiveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 5
  },
  mootaStatusOnline: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669'
  },
  mootaHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 8
  },
  mootaText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 6
  },
  mootaCheckBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 10,
    marginBottom: 10,
    ...shadows.md
  },
  mootaCheckBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF'
  },
  manualFallbackToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 4
  },
  manualFallbackToggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary
  },
  formCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  }
})
