import React, { useState } from 'react'
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
  RefreshCw,
  Sparkles
} from 'lucide-react-native'
import * as ImagePicker from 'expo-image-picker'
import { useApp } from '../context/AppContext'
import { colors, shadows, radius, spacing, typography } from '../utils/theme'
import {
  formatRupiah,
  NAMA_BULAN,
  getKodeUnikWarga,
  getAngkaKodeUnik,
  calculateTotalWithKodeUnik
} from '../utils/formatters'
import { copyToClipboard } from '../utils/clipboard'
import AppHeader from '../components/AppHeader'

export default function PembayaranScreen({ route, navigation }) {
  const { tagihan } = route.params || {}
  const { bayarTagihan, config, warga, bankAccounts, qrisAccounts, rts } = useApp()

  const targetWarga = warga.find((w) => w.id === tagihan?.wargaId) || {}
  const namaWarga = targetWarga.nama || tagihan?.namaWarga || 'Warga'
  const blok = targetWarga.blok || tagihan?.blok || 'A'
  const noRumah = targetWarga.noRumah || tagihan?.noRumah || '-'

  const isRwScope = tagihan?.payment_scope === 'RW'
  const targetOwnerId = isRwScope ? (config?.rw || 'rw-15') : (targetWarga.rt_id || tagihan?.target_payment_owner || 'rt-1')
  const rtObj = rts.find((r) => r.id === targetOwnerId)
  const recipientLabel = tagihan?.pembayaran_kepada || (isRwScope ? (config?.rw || 'RW 15') : (rtObj?.name || 'RT 01'))

  // Filter Bank & QRIS specifically for this payment scope & owner
  const availableBanks = (bankAccounts || []).filter((b) => {
    if (isRwScope) return b.owner_type === 'RW'
    return b.owner_type === 'RT' && b.owner_id === targetOwnerId
  })

  const availableQris = (qrisAccounts || []).filter((q) => {
    if (isRwScope) return q.owner_type === 'RW'
    return q.owner_type === 'RT' && q.owner_id === targetOwnerId
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
  
  // Image Proof States & Unique Code Popup
  const [selectedImage, setSelectedImage] = useState(null)
  const [pickerModalOpen, setPickerModalOpen] = useState(false)
  const [qrisModalOpen, setQrisModalOpen] = useState(false)
  const [uniqueCodeModalOpen, setUniqueCodeModalOpen] = useState(true)
  const [loading, setLoading] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  const activeBank = availableBanks.find((b) => b.id === selectedBankId) || availableBanks[0] || {
    bank_name: 'BCA',
    account_number: isRwScope ? '7788990011' : (rtObj?.rekening || '8730192831'),
    account_holder: `Kas ${recipientLabel}`
  }

  const activeQris = availableQris.find((q) => q.id === selectedQrisId) || availableQris[0]

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
          quality: 0.7,
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
          quality: 0.7,
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
    const nom = Number(nominalBayar)
    if (isNaN(nom) || nom <= 0) {
      Alert.alert('Perhatian', 'Nominal transfer harus berupa angka yang valid!')
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
      const proofPayloadUrl = selectedImage ? (selectedImage.base64 || selectedImage.uri) : null
      const res = await bayarTagihan(tagihan.id, {
        metode: metode === 'Transfer' ? `Transfer ${activeBank.bank_name}` : metode === 'QRIS' ? 'QRIS Instan' : 'Tunai / Cash',
        nominal: nom,
        tanggalBayar: tanggalBayar,
        bankAccountId: metode === 'Transfer' ? activeBank.id : null,
        qrisAccountId: metode === 'QRIS' ? activeQris?.id : null,
        buktiBayar: buktiPlaceholder.trim() || 'TRX-APP-' + Math.floor(100000 + Math.random() * 900000),
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
              <ShieldCheck size={13} color={isRwScope ? '#7C3AED' : '#2563EB'} style={{ marginRight: 4 }} />
              <Text style={[styles.scopeBadgeText, isRwScope ? styles.textRw : styles.textRt]}>
                PEMBAYARAN KEPADA: {recipientLabel.toUpperCase()}
              </Text>
            </View>
          </View>

          <Text style={styles.summaryLabel}>TOTAL YANG HARUS DITRANSFER</Text>
          <Text style={styles.summaryAmount}>{formatRupiah(exactNominal)}</Text>

          <View style={styles.kodeUnikBadgeSummary}>
            <Sparkles size={13} color="#D97706" />
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
            <Text style={styles.bankTitle}>Rekening Kas Resmi {recipientLabel}</Text>

            {/* Pilihan Rekening jika tersedia lebih dari 1 */}
            {availableBanks.length > 1 && (
              <View style={styles.bankPickerRow}>
                {availableBanks.map((b) => (
                  <TouchableOpacity
                    key={b.id}
                    style={[styles.bankPickChip, selectedBankId === b.id && styles.bankPickChipActive]}
                    onPress={() => setSelectedBankId(b.id)}
                  >
                    <Text style={[styles.bankPickText, selectedBankId === b.id && styles.bankPickTextActive]}>
                      {b.bank_name} {b.is_primary ? '★' : ''}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={styles.bankName}>Bank {activeBank.bank_name}</Text>
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
            <Text style={styles.rekOwner}>a.n {activeBank.account_holder || `Kas ${recipientLabel}`}</Text>
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

        {/* Form Upload Bukti & Konfirmasi */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Formulir Konfirmasi Pembayaran</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nominal Ditransfer (Rp) *</Text>
            <TextInput
              style={styles.input}
              value={nominalBayar}
              onChangeText={setNominalBayar}
              keyboardType="numeric"
              placeholder="120000"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tanggal Pembayaran *</Text>
            <TextInput
              style={styles.input}
              value={tanggalBayar}
              onChangeText={setTanggalBayar}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          {metode !== 'Cash' && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nomor Referensi / Kode Transaksi</Text>
                <TextInput
                  style={styles.input}
                  value={buktiPlaceholder}
                  onChangeText={setBuktiPlaceholder}
                  placeholder="Contoh: TRX-992019 / No Referensi M-Banking"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              {/* Upload / Lampiran Bukti Foto Transfer */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Foto Bukti Transfer / Struk QRIS <Text style={{ color: colors.danger }}>* (Wajib)</Text></Text>
                
                {selectedImage ? (
                  <View style={styles.proofPreviewCard}>
                    <Image source={{ uri: selectedImage.uri }} style={styles.proofImage} resizeMode="cover" />
                    <View style={styles.proofInfoRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.proofTitle}>Foto Bukti Terpilih ✓</Text>
                        <Text style={styles.proofSub} numberOfLines={1}>{selectedImage.fileName}</Text>
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
            </>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Catatan Tambahan (Opsional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={keterangan}
              onChangeText={setKeterangan}
              placeholder="Contoh: Ditransfer dari rekening atas nama Ibu Siti..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={2}
            />
          </View>

          <View style={styles.infoAlert}>
            <Info size={16} color={colors.info} style={{ marginRight: 8, marginTop: 1 }} />
            <Text style={styles.infoAlertText}>
              Pembayaran ditujukan kepada <Text style={{ fontWeight: '800' }}>{recipientLabel}</Text>. Setelah dikirim, pengurus {recipientLabel} akan memverifikasi mutasi.
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
      </ScrollView>

      {/* POP-UP PENGINGAT 3 DIGIT KODE UNIK WARGA */}
      <Modal
        visible={uniqueCodeModalOpen}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setUniqueCodeModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.uniqueModalCard}>
            <View style={styles.uniqueModalIconWrap}>
              <Sparkles size={32} color="#D97706" />
            </View>
            <Text style={styles.uniqueModalTitle}>PENTING: Bayar Sesuai 3 Digit Kode Unik!</Text>
            <Text style={styles.uniqueModalDesc}>
              Setiap warga memiliki 3 digit kode unik yang berbeda. Mohon transfer <Text style={{ fontWeight: '800' }}>TEPAT</Text> sejumlah:
            </Text>

            <View style={styles.uniqueModalNominalBox}>
              <Text style={styles.uniqueModalNominalText}>{formatRupiah(exactNominal)}</Text>
              <View style={styles.uniqueModalCodeBadge}>
                <Text style={styles.uniqueModalCodeBadgeText}>3 Digit Kode: {getAngkaKodeUnik(targetWarga)} ({kodeUnikWarga})</Text>
              </View>
            </View>

            <Text style={styles.uniqueModalNote}>
              ⚠️ <Text style={{ fontWeight: '700' }}>Jangan bulatkan ke 000</Text>. Tiga digit terakhir (<Text style={{ fontWeight: '800' }}>{getAngkaKodeUnik(targetWarga)}</Text>) digunakan sistem & pengurus untuk verifikasi otomatis mutasi bank (Moota).
            </Text>

            <View style={styles.uniqueModalActionRow}>
              <TouchableOpacity
                style={styles.uniqueModalCopyBtn}
                onPress={() => {
                  handleCopy(String(exactNominal), 'Nominal Transfer Tepat')
                  setUniqueCodeModalOpen(false)
                }}
                activeOpacity={0.85}
              >
                <Copy size={15} color={colors.primary} />
                <Text style={styles.uniqueModalCopyBtnText}>Salin & Lanjut</Text>
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
    paddingBottom: 60
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
    backgroundColor: '#F3E8FF'
  },
  scopeBadgeText: {
    fontSize: 11,
    fontWeight: '800'
  },
  textRt: {
    color: '#2563EB'
  },
  textRw: {
    color: '#7C3AED'
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

  /* UNIQUE CODE MODAL STYLES */
  uniqueModalCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 22,
    width: '90%',
    maxWidth: 360,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FCD34D',
    ...shadows.card
  },
  uniqueModalIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#FDE68A'
  },
  uniqueModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#92400E',
    textAlign: 'center',
    marginBottom: 8
  },
  uniqueModalDesc: {
    fontSize: 12.5,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 10
  },
  uniqueModalNominalBox: {
    backgroundColor: '#FFFBEB',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    alignItems: 'center',
    width: '100%',
    marginBottom: 12
  },
  uniqueModalNominalText: {
    fontSize: 26,
    fontWeight: '900',
    color: '#B45309',
    letterSpacing: -0.5
  },
  uniqueModalCodeBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.full,
    marginTop: 4
  },
  uniqueModalCodeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF'
  },
  uniqueModalNote: {
    fontSize: 11,
    color: '#78350F',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 16,
    backgroundColor: '#FEF3C7',
    padding: 10,
    borderRadius: 10
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
    gap: 4,
    paddingVertical: 11,
    borderRadius: radius.md,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE'
  },
  uniqueModalCopyBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary
  },
  uniqueModalOkBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: radius.md,
    backgroundColor: colors.primary
  },
  uniqueModalOkBtnText: {
    fontSize: 12,
    fontWeight: '800',
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
    ...shadows.redGlow
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
    ...shadows.redGlow
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
  }
})
