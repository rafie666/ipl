import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Modal,
  TextInput,
  Alert,
  Image,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView
} from 'react-native'
import {
  ArrowLeft,
  Receipt,
  CheckCircle2,
  Clock,
  CreditCard,
  Building2,
  Check,
  X,
  Calendar,
  AlertTriangle,
  History,
  ShieldCheck,
  Upload,
  Camera,
  Image as ImageIcon,
  Eye,
  RefreshCw,
  FileText,
  Sparkles,
  Edit3,
  Trash2
} from 'lucide-react-native'
import * as ImagePicker from 'expo-image-picker'
import { uploadImageToSupabaseStorage } from '../api/supabase'
import { useApp } from '../context/AppContext'
import { colors, shadows, radius, spacing, typography } from '../utils/theme'
import {
  formatRupiah,
  NAMA_BULAN,
  getKodeUnikWarga,
  getAngkaKodeUnik,
  calculateTotalWithKodeUnik
} from '../utils/formatters'
import { ALASAN_PENOLAKAN_PRESET } from '../data/initialData'
import AppHeader from '../components/AppHeader'
import AppModal from '../components/AppModal'
import AppButton from '../components/AppButton'
import ReceiptModal from '../components/ReceiptModal'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'

export default function DetailTagihanScreen({ route, navigation }) {
  const { tagihan: initialTagihan } = route.params || {}
  const [kwitansiModalVisible, setKwitansiModalVisible] = useState(false)
  const {
    isWarga,
    isAdminLoggedIn,
    verifikasiTagihan,
    bayarTagihan,
    updateTagihan,
    deleteTagihan,
    warga,
    tagihan: allTagihan
  } = useApp()

  // Always use latest tagihan state from context if available
  const tagihan = allTagihan.find((t) => t.id === initialTagihan?.id) || initialTagihan

  // State for image upload & preview
  const [selectedImage, setSelectedImage] = useState(null)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [proofViewerModalOpen, setProofViewerModalOpen] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Rejection Modal State for Admin/RT
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [selectedReason, setSelectedReason] = useState(ALASAN_PENOLAKAN_PRESET[0])
  const [customReasonNote, setCustomReasonNote] = useState('')
  const [loading, setLoading] = useState(false)

  // Edit Tagihan State for Admin/RT
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editNamaPos, setEditNamaPos] = useState('')
  const [editNominal, setEditNominal] = useState('')
  const [editBulan, setEditBulan] = useState('1')
  const [editTahun, setEditTahun] = useState('2026')
  const [editStatus, setEditStatus] = useState('Belum Bayar')
  const [editCatatan, setEditCatatan] = useState('')
  const [editLoading, setEditLoading] = useState(false)

  if (!tagihan) {
    return (
      <View style={styles.container}>
        <Text style={styles.notFoundText}>Data tagihan tidak ditemukan.</Text>
      </View>
    )
  }

  const targetWarga = warga.find((w) => w.id === tagihan.wargaId) || {}
  const namaWarga = targetWarga.nama || tagihan.namaWarga || 'Warga'
  const blok = targetWarga.blok || tagihan.blok || 'A'
  const noRumah = targetWarga.noRumah || tagihan.noRumah || '-'
  const kodeUnik = getKodeUnikWarga(targetWarga)
  const finalTotal = calculateTotalWithKodeUnik(tagihan.total, targetWarga)
  const tagihanWithKode = { ...tagihan, total: finalTotal, kodeUnik }

  const isLunas = tagihan.status === 'Lunas'
  const isPending = tagihan.status === 'Menunggu Verifikasi'
  const isPerluDiperbaiki = tagihan.status === 'Perlu Diperbaiki' || tagihan.status === 'Ditolak'
  const isRwScope = tagihan.payment_scope === 'RW'
  const recipientLabel = tagihan.pembayaran_kepada || (isRwScope ? 'RW 15' : 'RT 01')

  const submissionsList = Array.isArray(tagihan.submissions) ? tagihan.submissions : []

  // Active Proof Image URL
  const activeProofUrl = tagihan.buktiTransferUrl || tagihan.buktiFoto || tagihan.buktiBayar || (submissionsList[submissionsList.length - 1]?.bukti_url)

  // Handlers for Image Picker
  const handlePickFromGallery = () => {
    setUploadModalOpen(false)
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
        Alert.alert('Error Galeri', 'Gagal membuka galeri foto: ' + (err.message || 'Periksa izin aplikasi'))
      }
    }, 250)
  }

  const handleTakePhoto = () => {
    setUploadModalOpen(false)
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
        Alert.alert('Error Kamera', 'Gagal membuka kamera: ' + (err.message || 'Periksa izin kamera'))
      }
    }, 250)
  }

  const processSelectedImage = (asset) => {
    if (!asset || !asset.uri) {
      Alert.alert('Error', 'Foto tidak terbaca, silakan pilih ulang.')
      return
    }

    // 1. Validation size <= 5 MB (5 * 1024 * 1024 bytes)
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

  const handleKirimBukti = async () => {
    if (!selectedImage) {
      Alert.alert('Perhatian', 'Silakan pilih atau ambil foto bukti transfer terlebih dahulu.')
      return
    }

    setUploading(true)
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
        metode: tagihan.metode || tagihan.metodeBayar || 'Transfer Bank',
        nominal: tagihan.total,
        tanggalBayar: new Date().toISOString().slice(0, 10),
        buktiBayar: `TRX-${Math.floor(100000 + Math.random() * 900000)}`,
        buktiTransferUrl: proofPayloadUrl,
        buktiFoto: proofPayloadUrl,
        fileName: selectedImage.fileName,
        fileSize: selectedImage.fileSize,
        keterangan: `Upload Bukti Pembayaran IPL (${selectedImage.fileName})`
      })

      if (res.success) {
        setSelectedImage(null)
        Alert.alert(
          'BUKTI PEMBAYARAN BERHASIL DIKIRIM',
          'Status pembayaran telah diperbarui menjadi MENUNGGU VERIFIKASI oleh Pengurus RT/RW.'
        )
      } else {
        Alert.alert('Gagal', res.message || 'Gagal mengirim bukti pembayaran.')
      }
    } catch (err) {
      Alert.alert('Gagal', 'Upload gagal. Periksa koneksi internet dan coba lagi.')
    } finally {
      setUploading(false)
    }
  }

  const handleApproveLunas = () => {
    if (loading) return
    Alert.alert(
      'Konfirmasi Verifikasi Lunas',
      `Apakah Anda yakin ingin menyetujui pembayaran tagihan ${recipientLabel} warga ${namaWarga} sebesar ${formatRupiah(tagihan.total)} sebagai LUNAS?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ya, Setujui Lunas',
          onPress: async () => {
            if (loading) return
            setLoading(true)
            try {
              const res = await verifikasiTagihan(tagihan.id, 'Lunas')
              if (res && res.success) {
                Alert.alert('Sukses', 'Pembayaran berhasil diverifikasi sebagai LUNAS!', [
                  { text: 'OK', onPress: () => navigation.goBack() }
                ])
              } else {
                Alert.alert('Gagal', res?.message || 'Gagal memverifikasi pembayaran.')
              }
            } catch (err) {
              Alert.alert('Error', 'Terjadi kesalahan sistem saat memverifikasi pembayaran.')
            } finally {
              setLoading(false)
            }
          }
        }
      ]
    )
  }

  const handleConfirmReject = async () => {
    if (!selectedReason) {
      Alert.alert('Perhatian', 'Pilih salah satu alasan penolakan!')
      return
    }

    setLoading(true)
    try {
      await verifikasiTagihan(tagihan.id, 'Tolak', selectedReason, customReasonNote.trim())
      setRejectModalOpen(false)
      Alert.alert(
        'Feedback Terkirim ke Warga',
        `Status tagihan diubah menjadi "Perlu Diperbaiki / Ditolak". Warga menerima notifikasi alasan penolakan dan dapat upload bukti baru.`,
        [{ text: 'Selesai', onPress: () => navigation.goBack() }]
      )
    } catch (err) {
      Alert.alert('Gagal', 'Terjadi kesalahan saat menolak pembayaran.')
    } finally {
      setLoading(false)
    }
  }

  const handleBukaEdit = () => {
    const angkaKode = parseInt(getAngkaKodeUnik(targetWarga), 10) || 0
    const rawNominal = Math.max(0, (Number(tagihan.total) || 0) - angkaKode)
    const posName = tagihan.rincian?.[0]?.nama || tagihan.pembayaran_kepada || 'IPL Warga'

    setEditNamaPos(posName)
    setEditNominal(String(rawNominal > 0 ? rawNominal : tagihan.total))
    setEditBulan(String(tagihan.bulan || 1))
    setEditTahun(String(tagihan.tahun || 2026))
    setEditStatus(tagihan.status || 'Belum Bayar')
    setEditCatatan(tagihan.catatan || '')
    setEditModalOpen(true)
  }

  const handleSimpanEdit = async () => {
    const b = Number(editBulan)
    const t = Number(editTahun)
    const tot = Number(editNominal)
    if (!b || b < 1 || b > 12) {
      Alert.alert('Perhatian', 'Bulan harus antara 1 sampai 12!')
      return
    }
    if (!t || t < 2020 || t > 2040) {
      Alert.alert('Perhatian', 'Tahun tidak valid!')
      return
    }
    if (isNaN(tot) || tot <= 0) {
      Alert.alert('Perhatian', 'Nominal pokok tagihan harus lebih dari 0!')
      return
    }

    setEditLoading(true)
    try {
      await updateTagihan(tagihan.id, {
        bulan: b,
        tahun: t,
        total: tot,
        namaPos: editNamaPos,
        status: editStatus,
        catatan: editCatatan.trim()
      })
      setEditModalOpen(false)
      Alert.alert('Sukses', 'Perubahan data tagihan berhasil disimpan!')
    } catch (e) {
      Alert.alert('Error', 'Gagal memperbarui data tagihan.')
    } finally {
      setEditLoading(false)
    }
  }

  const handleHapusTagihan = () => {
    Alert.alert(
      'Hapus Tagihan',
      `Apakah Anda yakin ingin menghapus tagihan ${recipientLabel} warga ${namaWarga} periode ${tagihan.bulan}/${tagihan.tahun}? Catatan kas terkait juga akan dibersihkan.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus Tagihan',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTagihan(tagihan.id)
              Alert.alert('Sukses', 'Tagihan berhasil dihapus.', [
                { text: 'OK', onPress: () => navigation.goBack() }
              ])
            } catch (e) {
              Alert.alert('Error', 'Gagal menghapus tagihan.')
            }
          }
        }
      ]
    )
  }

  return (
    <View style={styles.container}>
      <AppHeader
        title={`Detail Tagihan ${recipientLabel}`}
        subtitle={`Periode ${NAMA_BULAN[(tagihan.bulan || 1) - 1]} ${tagihan.tahun}`}
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.scopeBadgeWrap}>
            <View style={[styles.scopeBadge, isRwScope ? styles.badgeRw : styles.badgeRt]}>
              <ShieldCheck size={13} color={isRwScope ? colors.primary : '#2563EB'} style={{ marginRight: 4 }} />
              <Text style={[styles.scopeBadgeText, isRwScope ? styles.textRw : styles.textRt]}>
                TAGIHAN {recipientLabel.toUpperCase()}
              </Text>
            </View>
          </View>

          <Text style={styles.statusTitle}>
            Tagihan Periode Bulan {tagihan.bulan}/{tagihan.tahun}
          </Text>

          <View
            style={[
              styles.badge,
              isLunas
                ? styles.badgeLunas
                : isPending
                ? styles.badgePending
                : isPerluDiperbaiki
                ? styles.badgeTolak
                : styles.badgeBelum
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                isLunas
                  ? styles.textLunas
                  : isPending
                  ? styles.textPending
                  : isPerluDiperbaiki
                  ? styles.textTolak
                  : styles.textBelum
              ]}
            >
              {isLunas
                ? 'LUNAS'
                : isPending
                ? 'MENUNGGU VERIFIKASI'
                : isPerluDiperbaiki
                ? 'DITOLAK / PERLU DIPERBAIKI'
                : 'BELUM BAYAR'}
            </Text>
          </View>

          <Text style={styles.totalPrice}>{formatRupiah(finalTotal)}</Text>
          <View style={styles.kodeUnikPill}>
            <ShieldCheck size={13} color="#D97706" />
            <Text style={styles.kodeUnikPillText}>
              Termasuk 3 Digit Kode Unik Warga: <Text style={{ fontWeight: '800' }}>{kodeUnik}</Text>
            </Text>
          </View>

          {tagihan.noKwitansi ? (
            <View style={styles.kwitansiBadge}>
              <CheckCircle2 size={14} color={colors.success} style={{ marginRight: 4 }} />
              <Text style={styles.kwitansiText}>No. Transaksi / Kwitansi: {tagihan.noKwitansi}</Text>
            </View>
          ) : null}
        </View>

        {/* Kotak Pengingat Kode Unik */}
        {!isLunas && (
          <View style={styles.kodeUnikAlertCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <AlertTriangle size={16} color="#D97706" />
              <Text style={styles.kodeUnikAlertTitle}>PENTING: Bayar Tepat Nominal Kode Unik</Text>
            </View>
            <Text style={styles.kodeUnikAlertDesc}>
              Pastikan Anda mentransfer tepat sejumlah <Text style={{ fontWeight: '800', color: colors.textPrimary }}>{formatRupiah(finalTotal)}</Text> (3 digit terakhir <Text style={{ fontWeight: '800', color: '#D97706' }}>{kodeUnik}</Text>) agar verifikasi pembayaran berjalan otomatis tanpa tertukar antar warga.
            </Text>
          </View>
        )}

        {/* Feedback Penolakan jika Ditolak / Perlu Diperbaiki */}
        {isPerluDiperbaiki && (
          <View style={styles.rejectionCard}>
            <View style={styles.rejectionHeader}>
              <AlertTriangle size={18} color={colors.danger} />
              <Text style={styles.rejectionTitle}>Feedback Penolakan Pengurus:</Text>
            </View>
            <Text style={styles.rejectionReason}>
              Alasan: <Text style={{ fontWeight: '800' }}>{tagihan.alasanPenolakan || 'Bukti pembayaran tidak sesuai dengan nominal tagihan.'}</Text>
            </Text>
            {tagihan.catatanPenolakan ? (
              <Text style={styles.rejectionNotes}>Keterangan: {tagihan.catatanPenolakan}</Text>
            ) : null}
          </View>
        )}

        {/* ===================== SECTION BUKTI PEMBAYARAN ===================== */}
        <View style={styles.infoCard}>
          <View style={styles.proofHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Receipt size={18} color={colors.primary} />
              <Text style={styles.cardSectionTitle}>BUKTI PEMBAYARAN</Text>
            </View>
            <View style={[styles.subBadge, isLunas ? styles.badgeLunas : isPending ? styles.badgePending : isPerluDiperbaiki ? styles.badgeTolak : styles.badgeBelum]}>
              <Text style={[styles.subBadgeText, isLunas ? styles.textLunas : isPending ? styles.textPending : isPerluDiperbaiki ? styles.textTolak : styles.textBelum]}>
                {isLunas ? 'DIBAYAR' : isPending ? 'MENUNGGU VERIFIKASI' : isPerluDiperbaiki ? 'DITOLAK' : 'BELUM ADA BUKTI'}
              </Text>
            </View>
          </View>

          {/* Jika bukti sudah pernah diupload */}
          {activeProofUrl ? (
            <View style={styles.uploadedProofCard}>
              <TouchableOpacity
                style={styles.proofImageWrapper}
                onPress={() => setProofViewerModalOpen(true)}
                activeOpacity={0.88}
              >
                <Image
                  source={{ uri: activeProofUrl }}
                  style={styles.proofThumbnail}
                  resizeMode="cover"
                />
                <View style={styles.zoomProofBadge}>
                  <Eye size={12} color="#FFFFFF" />
                  <Text style={styles.zoomProofText}>Lihat Bukti Layar Penuh</Text>
                </View>
              </TouchableOpacity>

              <View style={styles.proofMetaInfo}>
                <Text style={styles.proofMetaItem}>
                  Metode: <Text style={{ fontWeight: '800', color: colors.textPrimary }}>{tagihan.metode || tagihan.metodeBayar || 'Transfer Bank'}</Text>
                </Text>
                <Text style={styles.proofMetaItem}>
                  Tanggal Bayar: {tagihan.tanggalBayar || tagihan.tglBayar || '-'}
                </Text>
                <Text style={styles.proofMetaItem}>
                  Nominal: <Text style={{ fontWeight: '800', color: colors.primary }}>{formatRupiah(tagihan.total)}</Text>
                </Text>
                {tagihan.catatanWarga ? (
                  <Text style={styles.proofMetaItem}>
                    Catatan: {tagihan.catatanWarga}
                  </Text>
                ) : null}
              </View>

              <TouchableOpacity
                style={styles.btnViewProofFull}
                onPress={() => setProofViewerModalOpen(true)}
                activeOpacity={0.85}
              >
                <Eye size={15} color={colors.primary} />
                <Text style={styles.btnViewProofFullText}>Buka Gambar Bukti Pembayaran</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.noProofBox}>
              <AlertTriangle size={24} color={colors.textSecondary} style={{ marginBottom: 6 }} />
              <Text style={styles.noProofTitle}>BELUM ADA BUKTI</Text>
              <Text style={styles.noProofSubtitle}>
                Warga belum mengunggah struk transfer atau bukti scan QRIS untuk tagihan periode ini.
              </Text>
            </View>
          )}

          {/* Preview Gambar Sebelum Kirim */}
          {selectedImage && (
            <View style={styles.previewImageCard}>
              <Text style={styles.previewCardTitle}>Pratinjau Bukti Pembayaran</Text>
              <Image source={{ uri: selectedImage.uri }} style={styles.previewSelectedImage} resizeMode="cover" />
              <View style={styles.previewFileInfo}>
                <Text style={styles.previewFileName} numberOfLines={1}>📄 {selectedImage.fileName}</Text>
                <Text style={styles.previewFileSize}>Ukuran: {selectedImage.fileSize}</Text>
              </View>
              <View style={styles.previewButtonRow}>
                <TouchableOpacity
                  style={styles.btnChangeImage}
                  onPress={() => setUploadModalOpen(true)}
                  disabled={uploading}
                >
                  <RefreshCw size={14} color={colors.textSecondary} />
                  <Text style={styles.btnChangeImageText}>Ganti Foto</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.btnSubmitProof, uploading && styles.btnDisabled]}
                  onPress={handleKirimBukti}
                  disabled={uploading}
                >
                  {uploading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Upload size={14} color="#FFFFFF" />
                      <Text style={styles.btnSubmitProofText}>Kirim Bukti Pembayaran</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Tombol Upload Bukti Warga */}
          {Boolean(isWarga && !isLunas && !selectedImage) ? (
            <TouchableOpacity
              style={styles.btnOpenUploadPicker}
              onPress={() => setUploadModalOpen(true)}
              activeOpacity={0.88}
            >
              <Camera size={18} color="#FFFFFF" />
              <Text style={styles.btnOpenUploadPickerText}>
                {isPerluDiperbaiki ? 'Upload Bukti Baru' : isPending ? 'Ganti / Upload Ulang Bukti' : 'Upload Bukti Pembayaran'}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Data Warga Card */}
        <View style={styles.infoCard}>
          <Text style={styles.cardSectionTitle}>Data Wajib Iuran</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nama Warga</Text>
            <Text style={styles.infoVal}>{namaWarga}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Alamat Rumah</Text>
            <Text style={styles.infoVal}>
              Blok {blok} No. {noRumah}
            </Text>
          </View>
          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.infoLabel}>Penerima Pembayaran</Text>
            <Text style={[styles.infoVal, { color: isRwScope ? colors.primary : '#2563EB', fontWeight: '800' }]}>
              {recipientLabel}
            </Text>
          </View>
        </View>

        {/* Rincian Pos Iuran */}
        <View style={styles.infoCard}>
          <Text style={styles.cardSectionTitle}>Rincian Pos Iuran</Text>
          {tagihan.rincian && tagihan.rincian.length > 0 ? (
            tagihan.rincian.map((item, idx) => (
              <View
                key={idx}
                style={[
                  styles.infoRow,
                  idx === tagihan.rincian.length - 1 && { borderBottomWidth: 0 }
                ]}
              >
                <Text style={styles.infoLabel}>{item.nama}</Text>
                <Text style={styles.infoVal}>{formatRupiah(item.nominal)}</Text>
              </View>
            ))
          ) : (
            <>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Iuran Pokok {recipientLabel}</Text>
                <Text style={styles.infoVal}>{formatRupiah(Math.floor((Number(tagihan.total) || 120000) / 1000) * 1000)}</Text>
              </View>
              <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.infoLabel}>Kode Unik 3 Digit ({kodeUnik})</Text>
                <Text style={[styles.infoVal, { color: '#D97706', fontWeight: '800' }]}>+Rp {getAngkaKodeUnik(targetWarga)}</Text>
              </View>
            </>
          )}
        </View>

        {/* Riwayat Pengajuan Bukti Pembayaran */}
        {Boolean(submissionsList.length > 0) ? (
          <View style={styles.infoCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <History size={16} color={colors.primary} />
              <Text style={styles.cardSectionTitle}>Riwayat Pengajuan Bukti ({submissionsList.length})</Text>
            </View>

            {submissionsList.map((sub, idx) => (
              <View key={sub.id || idx} style={styles.submissionRow}>
                <View style={styles.submissionTop}>
                  <Text style={styles.subNum}>Pengajuan #{sub.submission_index || idx + 1}</Text>
                  <View style={[styles.subBadge, sub.status === 'Lunas' ? styles.badgeLunas : sub.status === 'Ditolak' ? styles.badgeTolak : styles.badgePending]}>
                    <Text style={[styles.subBadgeText, sub.status === 'Lunas' ? styles.textLunas : sub.status === 'Ditolak' ? styles.textTolak : styles.textPending]}>
                      {sub.status}
                    </Text>
                  </View>
                </View>

                <Text style={styles.subDetail}>
                  Nominal: <Text style={{ fontWeight: '800' }}>{formatRupiah(sub.nominal)}</Text> • Metode: {sub.metode}
                </Text>
                <Text style={styles.subDetail}>
                  Tgl Bayar: {sub.tanggal} • Kode: {sub.bukti_url ? sub.bukti_url.substring(0, 30) : '-'}
                </Text>

                {Boolean(sub.alasan_penolakan) ? (
                  <View style={styles.subRejectBox}>
                    <Text style={styles.subRejectText}>
                      Alasan Ditolak: {sub.alasan_penolakan}
                      {sub.catatan_penolakan ? ` (${sub.catatan_penolakan})` : ''}
                    </Text>
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        ) : null}

        {/* Action Buttons: Warga */}
        {Boolean(isWarga && !isLunas) ? (
          <TouchableOpacity
            style={styles.payBtn}
            onPress={() => navigation.navigate('Pembayaran', { tagihan: tagihanWithKode })}
            activeOpacity={0.88}
          >
            <CreditCard size={18} color={colors.white} style={{ marginRight: 8 }} />
            <Text style={styles.payBtnText}>
              Buka Form Pembayaran Lengkap (QRIS & Bank)
            </Text>
          </TouchableOpacity>
        ) : null}

        {Boolean(isLunas) ? (
          <Button
            title="Lihat Kuitansi Resmi"
            variant="primary"
            icon={<Receipt size={18} color={colors.primaryDark} />}
            onPress={() => setKwitansiModalVisible(true)}
            style={{ marginTop: 12, marginBottom: 8 }}
          />
        ) : null}

        {/* Action Buttons: Admin / RT (Verifikasi & Tolak) */}
        {Boolean(isAdminLoggedIn && isPending) ? (
          <View style={styles.verifyActionRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.btnReject]}
              onPress={() => setRejectModalOpen(true)}
              activeOpacity={0.85}
              disabled={loading}
            >
              <X size={16} color={colors.danger} style={{ marginRight: 4 }} />
              <Text style={styles.btnRejectText}>Tolak</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.btnApprove]}
              onPress={handleApproveLunas}
              activeOpacity={0.85}
              disabled={loading}
            >
              <Check size={16} color={colors.white} style={{ marginRight: 4 }} />
              <Text style={styles.btnApproveText}>Terima</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {Boolean(isAdminLoggedIn && !isLunas && !isPending) ? (
          <TouchableOpacity
            style={[styles.payBtn, { backgroundColor: '#0284C7', marginTop: 12 }, loading && styles.btnDisabled]}
            onPress={handleApproveLunas}
            activeOpacity={0.88}
            disabled={loading}
          >
            <Check size={18} color={colors.white} style={{ marginRight: 8 }} />
            <Text style={styles.payBtnText}>Catat Pelunasan Tunai (Kas Masuk)</Text>
          </TouchableOpacity>
        ) : null}

        {/* Tombol Kelola: Edit & Hapus untuk Admin/RT */}
        {Boolean(isAdminLoggedIn) ? (
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
            <TouchableOpacity
              style={[styles.payBtn, { flex: 1, backgroundColor: '#4F46E5', marginTop: 0 }]}
              onPress={handleBukaEdit}
              activeOpacity={0.88}
            >
              <Edit3 size={16} color={colors.white} style={{ marginRight: 6 }} />
              <Text style={styles.payBtnText}>Edit Tagihan</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.payBtn, { flex: 1, backgroundColor: colors.danger, marginTop: 0 }]}
              onPress={handleHapusTagihan}
              activeOpacity={0.88}
            >
              <Trash2 size={16} color={colors.white} style={{ marginRight: 6 }} />
              <Text style={styles.payBtnText}>Hapus Tagihan</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </ScrollView>

      {/* Modal Pilihan Upload Bukti (Kamera vs Galeri) */}
      <Modal
        visible={uploadModalOpen}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setUploadModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setUploadModalOpen(false)}
          />
          <View style={styles.pickerModalCard}>
            <View style={styles.pickerModalHeader}>
              <Text style={styles.pickerModalTitle}>Upload Bukti Pembayaran</Text>
              <TouchableOpacity onPress={() => setUploadModalOpen(false)}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.pickerModalDesc}>
              Pilih sumber foto bukti transfer atau tangkapan layar pembayaran:
            </Text>

            <View style={styles.pickerOptionsRow}>
              <TouchableOpacity
                style={styles.pickerOptionBtn}
                onPress={handleTakePhoto}
                activeOpacity={0.85}
              >
                <View style={[styles.pickerIconWrap, { backgroundColor: '#EFF6FF' }]}>
                  <Camera size={26} color="#2563EB" />
                </View>
                <Text style={styles.pickerOptionText}>Ambil Foto</Text>
                <Text style={styles.pickerOptionSub}>Gunakan Kamera</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.pickerOptionBtn}
                onPress={handlePickFromGallery}
                activeOpacity={0.85}
              >
                <View style={[styles.pickerIconWrap, { backgroundColor: colors.primarySubtle }]}>
                  <ImageIcon size={26} color={colors.primary} />
                </View>
                <Text style={styles.pickerOptionText}>Pilih dari Galeri</Text>
                <Text style={styles.pickerOptionSub}>Foto / Screenshot</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Fullscreen Proof Viewer Modal */}
      <Modal
        visible={proofViewerModalOpen}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setProofViewerModalOpen(false)}
      >
        <View style={styles.fullscreenModal}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setProofViewerModalOpen(false)}
          />
          <View style={[styles.modalContentCard, { maxHeight: '90%', display: 'flex', flexDirection: 'column' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle}>Bukti Pembayaran Warga</Text>
              <TouchableOpacity onPress={() => setProofViewerModalOpen(false)} style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={{ flexShrink: 1, width: '100%' }}
              contentContainerStyle={{ alignItems: 'center', paddingBottom: 16 }}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
            >
              <View style={styles.modalProofBox}>
                <Image
                  source={{ uri: activeProofUrl || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80' }}
                  style={styles.modalProofImage}
                  resizeMode="contain"
                />
              </View>

              <Text style={styles.modalProofInfoText}>
                Warga: <Text style={{ fontWeight: '800' }}>{namaWarga} (Blok {blok}/{noRumah})</Text> • Total: {formatRupiah(tagihan.total)}
              </Text>
            </ScrollView>

            <TouchableOpacity style={styles.modalDoneBtn} onPress={() => setProofViewerModalOpen(false)}>
              <Text style={styles.modalDoneBtnText}>Tutup Tampilan</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Rejection Reason (Admin Feedback) */}
      <Modal
        visible={rejectModalOpen}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setRejectModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setRejectModalOpen(false)}
          />

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ width: '100%', alignItems: 'center' }}
            pointerEvents="box-none"
          >
            <View style={[styles.modalCard, { maxHeight: '90%', display: 'flex', flexDirection: 'column' }]}>
              <View style={styles.modalHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <AlertTriangle size={18} color={colors.danger} />
                  <Text style={styles.modalTitle}>Tolak Bukti Pembayaran</Text>
                </View>
                <TouchableOpacity onPress={() => setRejectModalOpen(false)}>
                  <X size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={true}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled={true}
                style={{ flexShrink: 1, width: '100%' }}
                contentContainerStyle={{ paddingBottom: 16 }}
              >
                <Text style={styles.modalDesc}>
                  Pilih alasan penolakan agar warga menerima penjelasan dan dapat mengunggah bukti yang benar:
                </Text>

                {ALASAN_PENOLAKAN_PRESET.map((reason, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.reasonRadioItem,
                      selectedReason === reason && styles.reasonRadioItemActive
                    ]}
                    onPress={() => setSelectedReason(reason)}
                  >
                    <View style={[styles.radioCircle, selectedReason === reason && styles.radioCircleActive]}>
                      {selectedReason === reason && <View style={styles.radioDot} />}
                    </View>
                    <Text style={[styles.reasonText, selectedReason === reason && styles.reasonTextActive]}>
                      {reason}
                    </Text>
                  </TouchableOpacity>
                ))}

                <Text style={[styles.inputLabel, { marginTop: 10 }]}>Catatan Tambahan (Opsional):</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Contoh: Bukti buram, nominal kurang Rp 20.000..."
                  placeholderTextColor={colors.textMuted}
                  value={customReasonNote}
                  onChangeText={setCustomReasonNote}
                  multiline
                  numberOfLines={2}
                />
              </ScrollView>

              <View style={styles.modalActionRow}>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.btnCancelModal]}
                  onPress={() => setRejectModalOpen(false)}
                >
                  <Text style={styles.btnCancelText}>Batal</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalBtn, styles.btnConfirmReject]}
                  onPress={handleConfirmReject}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.white} />
                  ) : (
                    <Text style={styles.btnConfirmRejectText}>Kirim Penolakan</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Modal Edit Tagihan */}
      <AppModal
        visible={editModalOpen}
        title="Edit Data Tagihan"
        onClose={() => setEditModalOpen(false)}
        footer={
          <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
            <View style={{ flex: 1 }}>
              <AppButton
                title="Batal"
                variant="secondary"
                onPress={() => setEditModalOpen(false)}
              />
            </View>
            <View style={{ flex: 1.4 }}>
              <AppButton
                title="Simpan Perubahan"
                variant="primary"
                loading={editLoading}
                onPress={handleSimpanEdit}
              />
            </View>
          </View>
        }
      >
        <View style={{ backgroundColor: '#F8FAFC', padding: 12, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' }}>
          <Text style={{ fontSize: 14, fontWeight: '800', color: colors.textPrimary }}>
            {namaWarga} (Blok {blok}/{noRumah})
          </Text>
          <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
            ID Tagihan: {tagihan.id} • Kode Unik: #{kodeUnik}
          </Text>
        </View>

        <View style={{ marginBottom: 12 }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 }}>Nama Tagihan / Pos *</Text>
          <TextInput
            style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, fontSize: 14, color: colors.textPrimary }}
            value={editNamaPos}
            onChangeText={setEditNamaPos}
            placeholder="IPL Warga"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={{ marginBottom: 12 }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 }}>Nominal Pokok (Rp) *</Text>
          <TextInput
            style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, fontSize: 14, color: colors.textPrimary }}
            keyboardType="number-pad"
            value={editNominal}
            onChangeText={setEditNominal}
            placeholder="120000"
            placeholderTextColor={colors.textSecondary}
          />
          <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 4 }}>
            Total akhir otomatis ditambahkan 3 digit kode unik warga (#{kodeUnik}).
          </Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 }}>Bulan (1-12) *</Text>
            <TextInput
              style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, fontSize: 14, color: colors.textPrimary }}
              keyboardType="number-pad"
              value={editBulan}
              onChangeText={setEditBulan}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 }}>Tahun *</Text>
            <TextInput
              style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, fontSize: 14, color: colors.textPrimary }}
              keyboardType="number-pad"
              value={editTahun}
              onChangeText={setEditTahun}
            />
          </View>
        </View>

        <View style={{ marginBottom: 12 }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 }}>Status Tagihan *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
            {['Belum Bayar', 'Menunggu Verifikasi', 'Perlu Diperbaiki', 'Lunas'].map((st) => (
              <TouchableOpacity
                key={st}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 7,
                  borderRadius: 99,
                  borderWidth: 1,
                  borderColor: editStatus === st ? colors.primary : '#E2E8F0',
                  backgroundColor: editStatus === st ? '#FFF1F2' : '#F8FAFC',
                  marginRight: 6
                }}
                onPress={() => setEditStatus(st)}
              >
                <Text style={{ fontSize: 12, fontWeight: editStatus === st ? '700' : '600', color: editStatus === st ? colors.primary : colors.textSecondary }}>
                  {st}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={{ marginBottom: 12 }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 }}>Catatan</Text>
          <TextInput
            style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, fontSize: 14, color: colors.textPrimary, height: 50 }}
            value={editCatatan}
            onChangeText={setEditCatatan}
            placeholder="Catatan tagihan..."
            placeholderTextColor={colors.textSecondary}
            multiline
          />
        </View>
      </AppModal>

      {/* §4.5 Modal Kuitansi */}
      <ReceiptModal
        visible={kwitansiModalVisible}
        data={{
          receiptId: tagihan.noKwitansi || `KW/2026/${String(tagihan.bulan || '10').padStart(2, '0')}/B12-004`,
          amount: tagihan.total || 150000,
          paidAt: tagihan.tanggalBayar || new Date(),
          residentName: namaWarga,
          unitCode: `Blok ${blok} / No. ${noRumah}`,
          paymentMethod: tagihan.metode || 'QRIS Dinamis',
          recipientName: recipientLabel,
          status: 'paid',
        }}
        onClose={() => setKwitansiModalVisible(false)}
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
    paddingBottom: 70
  },
  statusCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft
  },
  scopeBadgeWrap: {
    marginBottom: 8
  },
  scopeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1
  },
  badgeRw: {
    backgroundColor: colors.primarySubtle,
    borderColor: '#FECACA'
  },
  badgeRt: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE'
  },
  scopeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  textRw: {
    color: colors.primary
  },
  textRt: {
    color: '#2563EB'
  },
  statusTitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 6
  },
  totalPrice: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.textPrimary,
    marginVertical: 4
  },
  kodeUnikPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginTop: 4,
    marginBottom: 6
  },
  kodeUnikPillText: {
    fontSize: 11,
    color: '#92400E',
    fontWeight: '600'
  },
  kodeUnikAlertCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#FCD34D',
    marginBottom: 12
  },
  kodeUnikAlertTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#92400E'
  },
  kodeUnikAlertDesc: {
    fontSize: 11.5,
    color: '#78350F',
    lineHeight: 16
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginVertical: 4
  },
  badgeLunas: {
    backgroundColor: '#DEF7EC'
  },
  badgePending: {
    backgroundColor: '#FEF3C7'
  },
  badgeTolak: {
    backgroundColor: '#FEE2E2'
  },
  badgeBelum: {
    backgroundColor: '#F3F4F6'
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800'
  },
  textLunas: {
    color: '#03543F'
  },
  textPending: {
    color: '#92400E'
  },
  textTolak: {
    color: '#991B1B'
  },
  textBelum: {
    color: '#4B5563'
  },
  kwitansiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#F0FDF4',
    borderRadius: 6
  },
  kwitansiText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.success
  },
  rejectionCard: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12
  },
  rejectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4
  },
  rejectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.danger
  },
  rejectionReason: {
    fontSize: 12,
    color: colors.textPrimary,
    marginTop: 2
  },
  rejectionNotes: {
    fontSize: 11,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 2
  },
  infoCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft
  },
  cardSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight
  },
  infoLabel: {
    fontSize: 12,
    color: colors.textSecondary
  },
  infoVal: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary
  },
  proofHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  uploadedProofCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
    marginBottom: 8
  },
  proofImageWrapper: {
    position: 'relative',
    height: 140,
    backgroundColor: '#E2E8F0'
  },
  proofThumbnail: {
    width: '100%',
    height: '100%'
  },
  zoomProofBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  zoomProofText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF'
  },
  proofMetaInfo: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0'
  },
  proofMetaItem: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 2
  },
  btnViewProofFull: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    backgroundColor: '#FFFFFF'
  },
  btnViewProofFullText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary
  },
  noProofBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    marginBottom: 10
  },
  noProofTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textSecondary
  },
  noProofSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 2
  },
  previewImageCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 8
  },
  previewCardTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 8
  },
  previewSelectedImage: {
    width: '100%',
    height: 130,
    borderRadius: 8,
    backgroundColor: '#E2E8F0'
  },
  previewFileInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 10
  },
  previewFileName: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
    marginRight: 8
  },
  previewFileSize: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary
  },
  previewButtonRow: {
    flexDirection: 'row',
    gap: 8
  },
  btnChangeImage: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1'
  },
  btnChangeImageText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary
  },
  btnSubmitProof: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 38,
    borderRadius: 8,
    backgroundColor: colors.primary
  },
  btnSubmitProofText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF'
  },
  btnOpenUploadPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 6,
    ...shadows.soft
  },
  btnOpenUploadPickerText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF'
  },
  submissionRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight
  },
  submissionTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  subNum: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary
  },
  subBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6
  },
  subBadgeText: {
    fontSize: 9,
    fontWeight: '800'
  },
  subDetail: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1
  },
  subRejectBox: {
    backgroundColor: '#FEF2F2',
    padding: 6,
    borderRadius: 6,
    marginTop: 4,
    borderLeftWidth: 3,
    borderLeftColor: colors.danger
  },
  subRejectText: {
    fontSize: 10,
    color: colors.danger,
    fontWeight: '600'
  },
  payBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 13,
    marginTop: 4,
    ...shadows.soft
  },
  payBtnText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '800'
  },
  verifyActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12
  },
  btnReject: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA'
  },
  btnRejectText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.danger
  },
  btnApprove: {
    backgroundColor: colors.success,
    ...shadows.soft
  },
  btnApproveText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.white
  },
  pickerModalCard: {
    width: '90%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    ...shadows.card
  },
  pickerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  pickerModalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary
  },
  pickerModalDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 16
  },
  pickerOptionsRow: {
    flexDirection: 'row',
    gap: 12
  },
  pickerOptionBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  pickerIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8
  },
  pickerOptionText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center'
  },
  pickerOptionSub: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2
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
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    alignItems: 'center',
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
  modalProofBox: {
    width: '100%',
    height: 300,
    backgroundColor: '#0F172A',
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 12
  },
  modalProofImage: {
    width: '100%',
    height: '100%'
  },
  modalProofInfoText: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 14
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
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 18,
    ...shadows.card
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.danger
  },
  modalDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 12,
    lineHeight: 16
  },
  reasonRadioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 4,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border
  },
  reasonRadioItemActive: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA'
  },
  radioCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8
  },
  radioCircleActive: {
    borderColor: colors.danger
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.danger
  },
  reasonText: {
    fontSize: 12,
    color: colors.textPrimary
  },
  reasonTextActive: {
    color: colors.danger,
    fontWeight: '700'
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 4
  },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 8,
    fontSize: 12,
    color: colors.textPrimary,
    backgroundColor: colors.background,
    height: 50,
    textAlignVertical: 'top'
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  btnCancelModal: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border
  },
  btnCancelText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary
  },
  btnConfirmReject: {
    backgroundColor: colors.danger
  },
  btnConfirmRejectText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.white
  },
  notFoundText: {
    textAlign: 'center',
    marginTop: 40,
    color: colors.textSecondary
  },
  btnDisabled: {
    opacity: 0.6
  }
})
