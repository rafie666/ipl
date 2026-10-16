import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Switch,
  ActivityIndicator,
  Image,
  Linking
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import {
  Layers,
  CreditCard,
  Building,
  Landmark,
  Database,
  Plus,
  Trash2,
  CheckCircle2,
  RotateCcw,
  Save,
  Star,
  Copy,
  QrCode,
  AlertTriangle,
  User,
  ShieldCheck,
  Building2,
  Lock,
  Edit3,
  Camera,
  Image as ImageIcon,
  Maximize2,
  Eye,
  RefreshCw,
  X,
  Upload,
  MapPin,
  Navigation,
  Compass,
  ExternalLink,
  Calendar,
  Clock,
  Sparkles,
  Play,
  Check,
  Zap,
  CalendarDays,
  Bell,
  Send
} from 'lucide-react-native'
import * as Clipboard from 'expo-clipboard'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  DEFAULT_SUPABASE_URL,
  DEFAULT_SUPABASE_ANON_KEY,
  isSupabaseConfigured,
  setCustomSupabaseCredentials,
  uploadImageToSupabaseStorage
} from '../api/supabase'
import {
  getMootaConfig,
  saveMootaConfig,
  testMootaConnection,
  DEFAULT_MOOTA_CONFIG
} from '../services/mootaService'
import { copyToClipboard } from '../utils/clipboard'
import { useApp } from '../context/AppContext'
import { colors, spacing, radius, shadows } from '../utils/theme'
import AppHeader from '../components/AppHeader'
import AppCard from '../components/AppCard'
import AppButton from '../components/AppButton'
import AppBadge from '../components/AppBadge'
import AppTabs from '../components/AppTabs'
import AppEmptyState from '../components/AppEmptyState'
import AppModal from '../components/AppModal'

export default function PengaturanScreen({ navigation }) {
  const {
    currentUser,
    currentWarga,
    currentRT,
    isWarga,
    isAdmin,
    isRT,
    isRW,
    isBendahara,
    isPengurus,
    config,
    updateConfig,
    rts,
    updateRtData,
    addRtData,
    deleteRtData,
    jenisIuran,
    addJenisIuran,
    updateJenisIuran,
    toggleJenisIuran,
    handleResetData,
    updateWarga,
    updateCurrentUser,
    bankAccounts = [],
    addBankAccount,
    updateBankAccount,
    deleteBankAccount,
    qrisAccounts = [],
    addQrisAccount,
    updateQrisAccount,
    deleteQrisAccount,
    updateAutoBillingConfig,
    triggerManualBillingCatchUp,
    calculateNextRunDate,
    expoPushToken,
    laravelApiUrl,
    setLaravelApiUrl,
    notificationPermissionStatus,
    testSendPushNotification,
    refreshPushToken
  } = useApp()

  // Tab state for Admin / RT
  const [adminTab, setAdminTab] = useState('jadwal')
  const [testingPush, setTestingPush] = useState(false)
  const [refreshingToken, setRefreshingToken] = useState(false)
  const [savingApiUrl, setSavingApiUrl] = useState(false)
  const [customApiUrlInput, setCustomApiUrlInput] = useState(laravelApiUrl || 'http://10.0.2.2:8000')

  useEffect(() => {
    if (laravelApiUrl) setCustomApiUrlInput(laravelApiUrl)
  }, [laravelApiUrl])

  const handleTestPush = async () => {
    setTestingPush(true)
    try {
      const res = await testSendPushNotification()
      if (res.success) {
        Alert.alert(
          'Push Notifikasi Berhasil! 📬',
          `${res.message}\n\nJalur pengiriman: ${res.via === 'laravel' ? 'Laravel Backend API (Expo Server)' : 'Lokal Perangkat'}\n\nSilakan periksa panel notifikasi pada HP Anda.`
        )
      } else {
        Alert.alert('Gagal Mengirim Notifikasi', res.message || 'Terjadi kesalahan saat mengirim notifikasi.')
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Gagal mengirim push notifikasi.')
    } finally {
      setTestingPush(false)
    }
  }

  const handleRefreshPushToken = async () => {
    setRefreshingToken(true)
    try {
      const res = await refreshPushToken()
      if (res.success) {
        Alert.alert('Sukses', 'Token perangkat berhasil diperbarui dan disinkronkan ke backend!')
      } else {
        Alert.alert('Perhatian', res.reason || 'Izin notifikasi tidak diberikan.')
      }
    } catch (e) {
      Alert.alert('Error', 'Gagal mendaftarkan ulang perangkat.')
    } finally {
      setRefreshingToken(false)
    }
  }

  const handleSaveApiUrl = async () => {
    setSavingApiUrl(true)
    try {
      await setLaravelApiUrl(customApiUrlInput.trim())
      Alert.alert('Tersimpan', `URL Backend Laravel diperbarui ke:\n${customApiUrlInput.trim()}`)
    } catch (e) {
      Alert.alert('Error', 'Gagal menyimpan URL API.')
    } finally {
      setSavingApiUrl(false)
    }
  }

  const handleCopyPushToken = async () => {
    if (!expoPushToken) {
      Alert.alert('Perhatian', 'Belum ada push token. Silakan ketuk tombol "Daftarkan Ulang Perangkat".')
      return
    }
    await Clipboard.setStringAsync(expoPushToken)
    Alert.alert('Tersalin 📋', 'Expo Push Token berhasil disalin ke clipboard.')
  }

  // Auto Billing Settings & Monitoring State
  const autoBilling = config?.autoBilling || {
    enabled: true,
    publishDay: 5,
    dueDay: 20,
    scope: 'ALL',
    last_run_at: null,
    last_run_period: null,
    last_run_status: 'standby',
    last_run_created_count: 0,
    last_run_skipped_count: 0,
    last_run_message: 'Sistem otomatisasi aktif menunggu jadwal tanggal terbit.',
    scheduler_heartbeat: new Date().toISOString(),
    scheduler_status: 'RUNNING'
  }

  const [autoEnabled, setAutoEnabled] = useState(autoBilling.enabled !== false)
  const [publishDay, setPublishDay] = useState(String(autoBilling.publishDay || 5))
  const [dueDay, setDueDay] = useState(String(autoBilling.dueDay || 20))
  const [billingScope, setBillingScope] = useState(autoBilling.scope || 'ALL')
  const [savingJadwal, setSavingJadwal] = useState(false)
  const [testingJadwal, setTestingJadwal] = useState(false)

  useEffect(() => {
    if (config?.autoBilling) {
      setAutoEnabled(config.autoBilling.enabled !== false)
      setPublishDay(String(config.autoBilling.publishDay || 5))
      setDueDay(String(config.autoBilling.dueDay || 20))
      setBillingScope(config.autoBilling.scope || 'ALL')
    }
  }, [config?.autoBilling])

  // ==============================================================
  // 0. STATE FOR REKENING & QRIS (RT VS RW SCOPE)
  // ==============================================================
  const [rekeningScope, setRekeningScope] = useState('Semua')

  // Modal Add Bank Account
  const [modalAddBank, setModalAddBank] = useState(false)
  const [newBankOwnerType, setNewBankOwnerType] = useState('RT')
  const [newBankRtId, setNewBankRtId] = useState('rt-1')
  const [newBankName, setNewBankName] = useState('BCA')
  const [newAccNumber, setNewAccNumber] = useState('')
  const [newAccHolder, setNewAccHolder] = useState('')
  const [newIsPrimaryBank, setNewIsPrimaryBank] = useState(false)

  // Modal Edit Bank Account
  const [modalEditBank, setModalEditBank] = useState(false)
  const [editingBank, setEditingBank] = useState(null)
  const [editBankOwnerType, setEditBankOwnerType] = useState('RT')
  const [editBankRtId, setEditBankRtId] = useState('rt-1')
  const [editBankName, setEditBankName] = useState('BCA')
  const [editAccNumber, setEditAccNumber] = useState('')
  const [editAccHolder, setEditAccHolder] = useState('')
  const [editIsPrimaryBank, setEditIsPrimaryBank] = useState(false)

  // Modal Add QRIS Account
  const [modalAddQris, setModalAddQris] = useState(false)
  const [newQrisOwnerType, setNewQrisOwnerType] = useState('RT')
  const [newQrisRtId, setNewQrisRtId] = useState('rt-1')
  const [newQrisName, setNewQrisName] = useState('')
  const [newQrisNmid, setNewQrisNmid] = useState('')
  const [newQrisImageUrl, setNewQrisImageUrl] = useState('')
  const [newIsPrimaryQris, setNewIsPrimaryQris] = useState(false)

  // Modal Edit QRIS Account
  const [modalEditQris, setModalEditQris] = useState(false)
  const [editingQris, setEditingQris] = useState(null)
  const [editQrisOwnerType, setEditQrisOwnerType] = useState('RT')
  const [editQrisRtId, setEditQrisRtId] = useState('rt-1')
  const [editQrisName, setEditQrisName] = useState('')
  const [editQrisNmid, setEditQrisNmid] = useState('')
  const [editQrisImageUrl, setEditQrisImageUrl] = useState('')
  const [editIsPrimaryQris, setEditIsPrimaryQris] = useState(false)

  // Image Picker Modal (Kamera / Galeri)
  const [qrisImageTarget, setQrisImageTarget] = useState('add') // 'add' | 'edit'
  const [modalPickQrisImage, setModalPickQrisImage] = useState(false)

  // Modal Preview Barcode QRIS Zoom
  const [modalPreviewQris, setModalPreviewQris] = useState(false)
  const [previewQrisData, setPreviewQrisData] = useState(null)

  // ==============================================================
  // 1. STATE FOR WARGA
  // ==============================================================
  const [wargaNama, setWargaNama] = useState('')
  const [wargaNik, setWargaNik] = useState('')
  const [wargaNoKk, setWargaNoKk] = useState('')
  const [wargaNoHp, setWargaNoHp] = useState('')
  const [wargaEmail, setWargaEmail] = useState('')
  const [wargaBlok, setWargaBlok] = useState('')
  const [wargaNoRumah, setWargaNoRumah] = useState('')
  const [wargaPekerjaan, setWargaPekerjaan] = useState('')
  const [wargaStatusHuni, setWargaStatusHuni] = useState('Tetap')
  const [wargaAgama, setWargaAgama] = useState('Islam')
  const [wargaStatusKawin, setWargaStatusKawin] = useState('Kawin')
  const [wargaJumlahJiwa, setWargaJumlahJiwa] = useState('1')
  const [savingWarga, setSavingWarga] = useState(false)

  // ==============================================================
  // 2. STATE FOR RW CONFIG
  // ==============================================================
  const [rwNamaLingkungan, setRwNamaLingkungan] = useState('')
  const [rwNomor, setRwNomor] = useState('')
  const [rwKelurahan, setRwKelurahan] = useState('')
  const [rwKecamatan, setRwKecamatan] = useState('')
  const [rwKota, setRwKota] = useState('')
  const [rwKetua, setRwKetua] = useState('')
  const [rwKontak, setRwKontak] = useState('')
  const [rwRekening, setRwRekening] = useState('')

  // ==============================================================
  // 3. STATE FOR RT CONFIG & CRUD
  // ==============================================================
  const [selectedRtId, setSelectedRtId] = useState(isRT ? (currentRT?.id || 'rt-1') : (rts?.[0]?.id || 'rt-1'))
  const activeRt = (rts || []).find((r) => r.id === selectedRtId) || rts?.[0]
  const [rtKetua, setRtKetua] = useState('')
  const [rtBendahara, setRtBendahara] = useState('')
  const [rtKontak, setRtKontak] = useState('')
  const [rtRekening, setRtRekening] = useState('')
  const [rtLokasi, setRtLokasi] = useState('')
  const [rtLat, setRtLat] = useState('')
  const [rtLng, setRtLng] = useState('')

  // Modal Tambah RT Baru
  const [modalAddRt, setModalAddRt] = useState(false)
  const [newRtNumber, setNewRtNumber] = useState('')
  const [newRtName, setNewRtName] = useState('')
  const [newRtKetua, setNewRtKetua] = useState('')
  const [newRtBendahara, setNewRtBendahara] = useState('')
  const [newRtKontak, setNewRtKontak] = useState('')
  const [newRtRekening, setNewRtRekening] = useState('')
  const [newRtLokasi, setNewRtLokasi] = useState('')
  const [newRtLat, setNewRtLat] = useState('')
  const [newRtLng, setNewRtLng] = useState('')
  const [newRtKeterangan, setNewRtKeterangan] = useState('')

  // ==============================================================
  // 4. STATE FOR POS IURAN
  // ==============================================================
  const [modalAddIuran, setModalAddIuran] = useState(false)
  const [newNamaIuran, setNewNamaIuran] = useState('')
  const [newNominalIuran, setNewNominalIuran] = useState('')
  const [newKetIuran, setNewKetIuran] = useState('')

  // ==============================================================
  // 5. STATE FOR DATABASE & ADMIN AUTH
  // ==============================================================
  const [supabaseUrl, setSupabaseUrl] = useState(DEFAULT_SUPABASE_URL)
  const [supabaseKey, setSupabaseKey] = useState(DEFAULT_SUPABASE_ANON_KEY)
  const [savingAdmin, setSavingAdmin] = useState(false)

  // ==============================================================
  // 6. STATE FOR MOOTA PAYMENT GATEWAY SANDBOX
  // ==============================================================
  const [mootaToken, setMootaToken] = useState(DEFAULT_MOOTA_CONFIG.API_TOKEN)
  const [mootaBankId, setMootaBankId] = useState(DEFAULT_MOOTA_CONFIG.BANK_ID)
  const [mootaTesting, setMootaTesting] = useState(false)
  const [mootaStatusMsg, setMootaStatusMsg] = useState(null)
  const [savingMoota, setSavingMoota] = useState(false)
  const webhookUrl = `${(supabaseUrl || DEFAULT_SUPABASE_URL).replace(/\/$/, '')}/functions/v1/moota-webhook`

  useEffect(() => {
    async function loadMoota() {
      const cfg = await getMootaConfig()
      if (cfg) {
        if (cfg.API_TOKEN) setMootaToken(cfg.API_TOKEN)
        if (cfg.BANK_ID) setMootaBankId(cfg.BANK_ID)
      }
    }
    loadMoota()
  }, [])

  const handleTestMoota = async () => {
    setMootaTesting(true)
    setMootaStatusMsg(null)
    try {
      const res = await testMootaConnection()
      if (res.success) {
        const bankName = res.activeBank?.label || res.activeBank?.bank_type || 'Bank Transfer Sandbox'
        const accNo = res.activeBank?.account_number || '090908080777'
        const holder = res.activeBank?.atas_nama || res.activeBank?.username || 'Rafi Nurrahman'
        const bal = Number(res.activeBank?.balance || 0).toLocaleString('id-ID')
        const points = res.user?.point ?? 0

        let pointNotice = ''
        if (points === 0) {
          pointNotice = '\n\n⚠️ Poin Moota Anda saat ini 0. Bot Moota memerlukan poin aktif untuk scraping mutasi otomatis dari KlikBCA/Bank riil.'
        }

        setMootaStatusMsg({
          success: true,
          text: `✅ Terhubung ke Moota Sandbox!\nAkun: ${bankName} (${accNo} a.n ${holder})\nSaldo Moota: Rp ${bal} | Sisa Poin: ${points}`
        })
        Alert.alert(
          'Koneksi Moota Berhasil!',
          `Akun Moota Sandbox terhubung dengan sukses!\n\n• Bank: ${bankName}\n• No. Rekening: ${accNo}\n• Pemilik: ${holder}\n• Saldo di Moota: Rp ${bal}\n• Sisa Poin Moota: ${points}${pointNotice}`
        )
      } else {
        setMootaStatusMsg({ success: false, text: `❌ ${res.message}` })
        Alert.alert('Koneksi Moota Gagal', res.message)
      }
    } catch (e) {
      setMootaStatusMsg({ success: false, text: `❌ ${e.message}` })
    } finally {
      setMootaTesting(false)
    }
  }

  const handleSimpanMoota = async () => {
    setSavingMoota(true)
    try {
      await saveMootaConfig({
        API_TOKEN: mootaToken.trim(),
        BANK_ID: mootaBankId.trim(),
        API_URL: DEFAULT_MOOTA_CONFIG.API_URL,
        IS_ACTIVE: true
      })
      Alert.alert('Tersimpan', 'Pengaturan Moota Sandbox berhasil disimpan!')
    } catch (e) {
      Alert.alert('Gagal', 'Gagal menyimpan pengaturan Moota.')
    } finally {
      setSavingMoota(false)
    }
  }

  // Init data
  useEffect(() => {
    if (isWarga) {
      setWargaNama(currentWarga?.nama || currentUser?.name || '')
      setWargaNik(currentWarga?.nik || '')
      setWargaNoKk(currentWarga?.noKk || '')
      setWargaNoHp(currentWarga?.noHp || '')
      setWargaEmail(currentWarga?.email || '')
      setWargaBlok(currentWarga?.blok || 'A')
      setWargaNoRumah(currentWarga?.noRumah || '01')
      setWargaPekerjaan(currentWarga?.pekerjaan || '')
      setWargaStatusHuni(currentWarga?.statusHuni || 'Tetap')
      setWargaAgama(currentWarga?.agama || 'Islam')
      setWargaStatusKawin(currentWarga?.statusPernikahan || 'Kawin')
      setWargaJumlahJiwa(String(currentWarga?.jumlahJiwa || 1))
    }

    if (config) {
      setRwNamaLingkungan(config.namaLingkungan || 'Perumahan Alam Tirta Lestari')
      setRwNomor((config.rw && !config.rw.includes('-')) ? config.rw : 'RW 01')
      setRwKelurahan(config.kelurahan || 'Ciomas Rahayu')
      setRwKecamatan(config.kecamatan || 'Ciomas')
      setRwKota(config.kota || 'Kabupaten Bogor')
      setRwKetua(config.ketuaRw || 'Bpk. H. Rahmat Hidayat')
      setRwKontak(config.kontakRw || '081122334455')
      setRwRekening(config.rekeningRw || 'BCA 7788990011 a.n Kas RW 15')
    }
  }, [currentUser, currentWarga, isWarga, config])

  // Sync RT state
  useEffect(() => {
    if (activeRt) {
      setRtKetua(activeRt.ketua || '')
      setRtBendahara(activeRt.bendahara || '')
      setRtKontak(activeRt.kontak || '')
      setRtRekening(activeRt.rekening || '')
      setRtLokasi(activeRt.lokasi || `Pos Balai Warga ${activeRt.name}`)
      setRtLat(String(activeRt.lat || -6.59715))
      setRtLng(String(activeRt.lng || 106.76415))
    }
  }, [selectedRtId, activeRt])

  // Handlers
  const handleSimpanWarga = async () => {
    if (!wargaNama.trim()) {
      Alert.alert('Perhatian', 'Nama lengkap warga wajib diisi!')
      return
    }

    try {
      setSavingWarga(true)
      const payload = {
        nama: wargaNama.trim(),
        nik: wargaNik.trim(),
        noKk: wargaNoKk.trim(),
        noHp: wargaNoHp.trim(),
        email: wargaEmail.trim(),
        blok: wargaBlok.trim().toUpperCase(),
        noRumah: wargaNoRumah.trim(),
        pekerjaan: wargaPekerjaan.trim(),
        statusHuni: wargaStatusHuni,
        agama: wargaAgama,
        statusPernikahan: wargaStatusKawin,
        jumlahJiwa: parseInt(wargaJumlahJiwa, 10) || 1
      }

      if (currentWarga?.id) {
        await updateWarga(currentWarga.id, payload)
      }
      await updateCurrentUser({ name: wargaNama.trim() })
      Alert.alert('Sukses', 'Data profil Anda berhasil diperbarui.')
    } catch (e) {
      Alert.alert('Error', 'Gagal memperbarui profil.')
    } finally {
      setSavingWarga(false)
    }
  }

  const handleSimpanRw = async () => {
    try {
      await updateConfig({
        ...config,
        namaLingkungan: rwNamaLingkungan.trim(),
        rw: rwNomor.trim(),
        kelurahan: rwKelurahan.trim(),
        kecamatan: rwKecamatan.trim(),
        kota: rwKota.trim(),
        ketuaRw: rwKetua.trim(),
        kontakRw: rwKontak.trim(),
        rekeningRw: rwRekening.trim()
      })
      Alert.alert('Sukses', 'Profil identitas RW berhasil disimpan.')
    } catch (e) {
      Alert.alert('Error', 'Gagal menyimpan profil RW.')
    }
  }

  const handleSimpanRt = async () => {
    if (!activeRt) return
    try {
      await updateRtData(activeRt.id, {
        ketua: rtKetua.trim(),
        bendahara: rtBendahara.trim(),
        kontak: rtKontak.trim(),
        rekening: rtRekening.trim(),
        lokasi: rtLokasi.trim() || `Pos Balai Warga ${activeRt.name}`,
        lat: parseFloat(rtLat) || -6.59715,
        lng: parseFloat(rtLng) || 106.76415
      })
      Alert.alert('Sukses', `Data pengurus & koordinat peta ${activeRt.name} berhasil disimpan.`)
    } catch (e) {
      Alert.alert('Error', 'Gagal menyimpan data pengurus RT.')
    }
  }

  const handleOpenAddRt = () => {
    const nextNumber = String((rts?.length || 0) + 1).padStart(2, '0')
    const calculatedLat = (-6.59715 - ((rts?.length || 0) * 0.0004)).toFixed(6)
    const calculatedLng = (106.76415 + ((rts?.length || 0) * 0.0005)).toFixed(6)
    setNewRtNumber(nextNumber)
    setNewRtName(`RT ${nextNumber}`)
    setNewRtKetua('')
    setNewRtBendahara('')
    setNewRtKontak('')
    setNewRtRekening('')
    setNewRtLokasi(`Pos Balai Warga RT ${nextNumber}`)
    setNewRtLat(calculatedLat)
    setNewRtLng(calculatedLng)
    setNewRtKeterangan(`Mencakup wilayah warga RT ${nextNumber}`)
    setModalAddRt(true)
  }

  const handleTambahRt = async () => {
    if (!newRtNumber.trim() && !newRtName.trim()) {
      Alert.alert('Perhatian', 'Nomor atau nama RT wajib diisi!')
      return
    }
    const numFormatted = (newRtNumber.trim() || '01').padStart(2, '0')
    const nameFormatted = newRtName.trim() || `RT ${numFormatted}`

    try {
      const created = await addRtData({
        number: numFormatted,
        name: nameFormatted,
        rw: config?.rw || '15',
        ketua: newRtKetua.trim(),
        bendahara: newRtBendahara.trim(),
        kontak: newRtKontak.trim(),
        rekening: newRtRekening.trim(),
        lokasi: newRtLokasi.trim() || `Pos Balai Warga ${nameFormatted}`,
        lat: parseFloat(newRtLat) || -6.59715,
        lng: parseFloat(newRtLng) || 106.76415,
        keterangan: newRtKeterangan.trim() || `Mencakup wilayah warga ${nameFormatted}`
      })

      setModalAddRt(false)
      if (created?.id) {
        setSelectedRtId(created.id)
      }
      Alert.alert('Sukses', `Wilayah ${nameFormatted} berhasil ditambahkan!`)
    } catch (e) {
      Alert.alert('Error', 'Gagal menambahkan RT baru.')
    }
  }

  const handleHapusRt = (rtItem) => {
    if (!rtItem) return
    if ((rts || []).length <= 1) {
      Alert.alert('Tidak Dapat Dihapus', 'Sistem harus memiliki minimal 1 RT.')
      return
    }
    Alert.alert(
      `Hapus ${rtItem.name}?`,
      `Yakin ingin menghapus ${rtItem.name}? Data kas dan referensi terkait RT ini akan disesuaikan.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus RT',
          style: 'destructive',
          onPress: async () => {
            await deleteRtData(rtItem.id)
            const remaining = (rts || []).filter((r) => r.id !== rtItem.id)
            if (remaining.length > 0) {
              setSelectedRtId(remaining[0].id)
            }
            Alert.alert('Sukses', `${rtItem.name} berhasil dihapus.`)
          }
        }
      ]
    )
  }

  const handleTambahPosIuran = async () => {
    if (!newNamaIuran.trim() || !newNominalIuran) {
      Alert.alert('Perhatian', 'Nama pos dan nominal iuran wajib diisi!')
      return
    }
    await addJenisIuran({
      nama: newNamaIuran.trim(),
      nominal: Number(newNominalIuran) || 0,
      keterangan: newKetIuran.trim(),
      wajib: true
    })
    setNewNamaIuran('')
    setNewNominalIuran('')
    setNewKetIuran('')
    setModalAddIuran(false)
    Alert.alert('Sukses', 'Pos iuran baru berhasil ditambahkan!')
  }

  // ==========================================
  // BANK CRUD HANDLERS
  // ==========================================
  const handleTambahBank = async () => {
    if (!newBankName.trim() || !newAccNumber.trim() || !newAccHolder.trim()) {
      Alert.alert('Perhatian', 'Nama bank, nomor rekening, dan nama pemilik rekening wajib diisi!')
      return
    }
    const currentOwnerId = newBankOwnerType === 'RW' ? 'RW' : newBankRtId
    await addBankAccount({
      owner_type: newBankOwnerType,
      owner_id: currentOwnerId,
      bank_name: newBankName.trim().toUpperCase(),
      account_number: newAccNumber.trim(),
      account_holder: newAccHolder.trim(),
      is_primary: newIsPrimaryBank,
      is_active: true
    })
    setNewAccNumber('')
    setNewAccHolder('')
    setNewIsPrimaryBank(false)
    setModalAddBank(false)
    Alert.alert('Sukses', `Rekening bank untuk ${newBankOwnerType === 'RW' ? 'RW 15' : 'RT'} berhasil ditambahkan!`)
  }

  const handleOpenEditBank = (item) => {
    setEditingBank(item)
    setEditBankOwnerType(item.owner_type || 'RT')
    setEditBankRtId(item.owner_id && item.owner_id !== 'RW' ? item.owner_id : 'rt-1')
    setEditBankName(item.bank_name || 'BCA')
    setEditAccNumber(item.account_number || '')
    setEditAccHolder(item.account_holder || '')
    setEditIsPrimaryBank(!!item.is_primary)
    setModalEditBank(true)
  }

  const handleSimpanEditBank = async () => {
    if (!editingBank) return
    if (!editBankName.trim() || !editAccNumber.trim() || !editAccHolder.trim()) {
      Alert.alert('Perhatian', 'Nama bank, nomor rekening, dan nama pemilik wajib diisi!')
      return
    }
    const currentOwnerId = editBankOwnerType === 'RW' ? 'RW' : editBankRtId
    await updateBankAccount(editingBank.id, {
      owner_type: editBankOwnerType,
      owner_id: currentOwnerId,
      bank_name: editBankName.trim().toUpperCase(),
      account_number: editAccNumber.trim(),
      account_holder: editAccHolder.trim(),
      is_primary: editIsPrimaryBank
    })
    setModalEditBank(false)
    setEditingBank(null)
    Alert.alert('Sukses', 'Data rekening bank berhasil diperbarui!')
  }

  const handleHapusBank = (item) => {
    Alert.alert('Hapus Rekening', `Hapus rekening ${item.bank_name} - ${item.account_number}?`, [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: () => deleteBankAccount(item.id) }
    ])
  }

  const handleSetPrimaryBank = async (item) => {
    await updateBankAccount(item.id, { is_primary: true })
    Alert.alert('Sukses', `${item.bank_name} dijadikan rekening utama.`)
  }

  // ==========================================
  // QRIS IMAGE PICKER (CAMERA & GALLERY)
  // ==========================================
  const handleOpenImagePicker = (target = 'add') => {
    setQrisImageTarget(target)
    setModalPickQrisImage(true)
  }

  const handlePickFromGallery = () => {
    setModalPickQrisImage(false)
    setTimeout(async () => {
      try {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
        if (status !== 'granted') {
          Alert.alert(
            'IZIN AKSES GALERI DIBUTUHKAN',
            'Aplikasi membutuhkan izin akses galeri foto untuk memilih barcode QRIS.'
          )
          return
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: false,
          quality: 0.85,
          base64: true
        })

        if (!result.canceled && result.assets && result.assets.length > 0) {
          const asset = result.assets[0]
          if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
            Alert.alert('Ukuran Terlalu Besar', 'Maksimal ukuran foto barcode adalah 5 MB.')
            return
          }
          const imagePayload = asset.base64
            ? (asset.base64.startsWith('data:') ? asset.base64 : `data:image/jpeg;base64,${asset.base64}`)
            : asset.uri

          if (qrisImageTarget === 'edit') {
            setEditQrisImageUrl(imagePayload)
          } else {
            setNewQrisImageUrl(imagePayload)
          }
        }
      } catch (err) {
        Alert.alert('Error', 'Gagal memilih foto: ' + (err.message || 'Error'))
      }
    }, 250)
  }

  const handleTakePhoto = () => {
    setModalPickQrisImage(false)
    setTimeout(async () => {
      try {
        const { status } = await ImagePicker.requestCameraPermissionsAsync()
        if (status !== 'granted') {
          Alert.alert(
            'IZIN KAMERA DIBUTUHKAN',
            'Aplikasi membutuhkan izin kamera untuk memotret barcode QRIS secara langsung.'
          )
          return
        }

        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          quality: 0.85,
          base64: true
        })

        if (!result.canceled && result.assets && result.assets.length > 0) {
          const asset = result.assets[0]
          if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
            Alert.alert('Ukuran Terlalu Besar', 'Maksimal ukuran foto barcode adalah 5 MB.')
            return
          }
          const imagePayload = asset.base64
            ? (asset.base64.startsWith('data:') ? asset.base64 : `data:image/jpeg;base64,${asset.base64}`)
            : asset.uri

          if (qrisImageTarget === 'edit') {
            setEditQrisImageUrl(imagePayload)
          } else {
            setNewQrisImageUrl(imagePayload)
          }
        }
      } catch (err) {
        Alert.alert('Error', 'Gagal mengambil foto kamera: ' + (err.message || 'Error'))
      }
    }, 250)
  }

  // ==========================================
  // QRIS CRUD HANDLERS
  // ==========================================
  const handleTambahQris = async () => {
    if (!newQrisName.trim()) {
      Alert.alert('Perhatian', 'Nama / label QRIS wajib diisi!')
      return
    }
    const currentOwnerId = newQrisOwnerType === 'RW' ? 'RW' : newQrisRtId
    const fallbackImage = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=QRIS_WARGAKU_${encodeURIComponent(newQrisName.trim())}`
    
    let finalImageUrl = newQrisImageUrl.trim()
    if (finalImageUrl && finalImageUrl.startsWith('data:')) {
      const upRes = await uploadImageToSupabaseStorage({
        bucket: 'bukti-transfer',
        path: `qris/qris_${Date.now()}.jpg`,
        base64: finalImageUrl,
        contentType: 'image/jpeg'
      })
      if (upRes.success && upRes.publicUrl) {
        finalImageUrl = upRes.publicUrl
      }
    }

    await addQrisAccount({
      owner_type: newQrisOwnerType,
      owner_id: currentOwnerId,
      qris_name: newQrisName.trim(),
      nmid: newQrisNmid.trim(),
      image_url: finalImageUrl || fallbackImage,
      is_primary: newIsPrimaryQris,
      is_active: true
    })
    setNewQrisName('')
    setNewQrisNmid('')
    setNewQrisImageUrl('')
    setNewIsPrimaryQris(false)
    setModalAddQris(false)
    Alert.alert('Sukses', `QRIS untuk ${newQrisOwnerType === 'RW' ? 'RW 15' : 'RT'} berhasil ditambahkan!`)
  }

  const handleOpenEditQris = (item) => {
    setEditingQris(item)
    setEditQrisOwnerType(item.owner_type || 'RT')
    setEditQrisRtId(item.owner_id && item.owner_id !== 'RW' ? item.owner_id : 'rt-1')
    setEditQrisName(item.qris_name || '')
    setEditQrisNmid(item.nmid || '')
    setEditQrisImageUrl(item.image_url || '')
    setEditIsPrimaryQris(!!item.is_primary)
    setModalEditQris(true)
  }

  const handleSimpanEditQris = async () => {
    if (!editingQris) return
    if (!editQrisName.trim()) {
      Alert.alert('Perhatian', 'Nama / label QRIS wajib diisi!')
      return
    }
    const currentOwnerId = editQrisOwnerType === 'RW' ? 'RW' : editQrisRtId
    const fallbackImage = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=QRIS_WARGAKU_${encodeURIComponent(editQrisName.trim())}`

    let finalImageUrl = editQrisImageUrl.trim()
    if (finalImageUrl && finalImageUrl.startsWith('data:')) {
      const upRes = await uploadImageToSupabaseStorage({
        bucket: 'bukti-transfer',
        path: `qris/qris_${Date.now()}.jpg`,
        base64: finalImageUrl,
        contentType: 'image/jpeg'
      })
      if (upRes.success && upRes.publicUrl) {
        finalImageUrl = upRes.publicUrl
      }
    }

    await updateQrisAccount(editingQris.id, {
      owner_type: editQrisOwnerType,
      owner_id: currentOwnerId,
      qris_name: editQrisName.trim(),
      nmid: editQrisNmid.trim(),
      image_url: finalImageUrl || fallbackImage,
      is_primary: editIsPrimaryQris
    })
    setModalEditQris(false)
    setEditingQris(null)
    Alert.alert('Sukses', 'Data akun QRIS berhasil diperbarui!')
  }

  const handleHapusQris = (item) => {
    Alert.alert('Hapus QRIS', `Hapus QRIS "${item.qris_name}"?`, [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: () => deleteQrisAccount(item.id) }
    ])
  }

  const handleSetPrimaryQris = async (item) => {
    await updateQrisAccount(item.id, { is_primary: true })
    Alert.alert('Sukses', `${item.qris_name} dijadikan QRIS utama.`)
  }

  const handlePreviewQris = (item) => {
    setPreviewQrisData(item)
    setModalPreviewQris(true)
  }

  const handleSimpanDatabase = async () => {
    try {
      setSavingAdmin(true)
      await setCustomSupabaseCredentials(supabaseUrl.trim(), supabaseKey.trim())
      Alert.alert('Sukses', 'Kredensial Supabase berhasil disimpan dan koneksi langsung aktif!')
    } catch (e) {
      Alert.alert('Error', 'Gagal menyimpan database: ' + (e?.message || 'Error'))
    } finally {
      setSavingAdmin(false)
    }
  }

  const handleResetSeluruhData = () => {
    Alert.alert(
      'Reset Data Demo',
      'Kembalikan seluruh data warga, tagihan, kas, dan pengaturan ke data contoh awal?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Reset Sekarang',
          style: 'destructive',
          onPress: async () => {
            await handleResetData()
            Alert.alert('Selesai', 'Data berhasil dikembalikan ke setelan awal demo.')
          }
        }
      ]
    )
  }

  const handleSaveJadwal = async () => {
    const pDay = parseInt(publishDay, 10)
    const dDay = parseInt(dueDay, 10)

    if (isNaN(pDay) || pDay < 1 || pDay > 31) {
      Alert.alert('Peringatan', 'Tanggal terbit harus di antara tanggal 1 sampai 31.')
      return
    }
    if (isNaN(dDay) || dDay < 1 || dDay > 31) {
      Alert.alert('Peringatan', 'Tanggal jatuh tempo harus di antara tanggal 1 sampai 31.')
      return
    }

    setSavingJadwal(true)
    try {
      const res = await updateAutoBillingConfig({
        enabled: autoEnabled,
        publishDay: pDay,
        dueDay: dDay,
        scope: billingScope
      })
      if (res.success) {
        Alert.alert(
          'Jadwal Disimpan! 📅',
          `Pengaturan otomatisasi tagihan bulanan berhasil diperbarui:\n\n• Status: ${autoEnabled ? 'AKTIF 🟢' : 'NONAKTIF 🔴'}\n• Tanggal Terbit: Tanggal ${pDay} setiap bulan\n• Jatuh Tempo: Tanggal ${dDay} setiap bulan\n• Lingkup: ${billingScope}\n\nPengaturan telah disimpan ke database & berlaku untuk periode berikutnya.`
        )
      } else {
        Alert.alert('Gagal', res.message || 'Gagal menyimpan pengaturan jadwal.')
      }
    } catch (e) {
      Alert.alert('Error', 'Terjadi kesalahan saat menyimpan jadwal.')
    } finally {
      setSavingJadwal(false)
    }
  }

  const handleTestAutoBilling = async () => {
    Alert.alert(
      'Uji Otomatisasi Tagihan',
      'Sistem akan mengecek jadwal & menerbitkan tagihan IPL periode bulan berjalan bagi warga yang belum memiliki tagihan.\n\nJika tagihan sudah pernah dibuat, sistem akan melewatinya secara idempoten (0 tagihan ganda).\n\nLanjutkan?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Jalankan Sekarang',
          onPress: async () => {
            setTestingJadwal(true)
            try {
              const res = await triggerManualBillingCatchUp()
              if (res.success) {
                Alert.alert(
                  'Hasil Eksekusi Otomatisasi',
                  `${res.message}\n\n• Tagihan Baru Dibuat: ${res.createdCount}\n• Periode: ${res.period}\n\nData tagihan langsung tersinkronisasi ke dashboard pengelola dan akun warga.`
                )
              } else {
                Alert.alert('Gagal', res.message || 'Proses pembuatan tagihan gagal.')
              }
            } catch (err) {
              Alert.alert('Error', 'Terjadi kesalahan saat memproses tagihan.')
            } finally {
              setTestingJadwal(false)
            }
          }
        }
      ]
    )
  }

  const formatRupiah = (num) => 'Rp ' + (num || 0).toLocaleString('id-ID')
  const canGoBack = navigation.canGoBack()

  // Tabs tailored per Role/Jabatan
  const adminTabsList = (() => {
    if (isBendahara) {
      return [
        { id: 'jadwal', label: 'Jadwal Otomatis', icon: Calendar },
        { id: 'rekening', label: 'Rekening & QRIS', icon: CreditCard },
        { id: 'moota', label: 'Moota Sandbox', icon: ShieldCheck },
        { id: 'iuran', label: 'Pos Iuran', icon: Layers },
        { id: 'push', label: 'Push Notif', icon: Bell }
      ]
    }
    if (isPengurus) {
      return [
        { id: 'rw', label: 'Profil RW', icon: Building },
        { id: 'rt', label: 'Profil RT', icon: Landmark },
        { id: 'iuran', label: 'Pos Iuran', icon: Layers },
        { id: 'push', label: 'Push Notif', icon: Bell }
      ]
    }
    if (isRT) {
      return [
        { id: 'jadwal', label: 'Jadwal Otomatis', icon: Calendar },
        { id: 'rt', label: 'Profil RT', icon: Landmark },
        { id: 'rekening', label: 'Rekening & QRIS', icon: CreditCard },
        { id: 'iuran', label: 'Pos Iuran', icon: Layers },
        { id: 'push', label: 'Push Notif', icon: Bell }
      ]
    }
    if (isRW) {
      return [
        { id: 'jadwal', label: 'Jadwal Otomatis', icon: Calendar },
        { id: 'rw', label: 'Profil RW', icon: Building },
        { id: 'rt', label: 'Profil RT', icon: Landmark },
        { id: 'rekening', label: 'Rekening & QRIS', icon: CreditCard },
        { id: 'iuran', label: 'Pos Iuran', icon: Layers },
        { id: 'push', label: 'Push Notif', icon: Bell }
      ]
    }
    return [
      { id: 'jadwal', label: 'Jadwal Otomatis', icon: Calendar },
      { id: 'iuran', label: 'Pos Iuran', icon: Layers },
      { id: 'rekening', label: 'Rekening & QRIS', icon: CreditCard },
      { id: 'moota', label: 'Moota Sandbox', icon: ShieldCheck },
      { id: 'rw', label: 'Profil RW', icon: Building },
      { id: 'rt', label: 'Profil RT', icon: Landmark },
      { id: 'push', label: 'Push Notif', icon: Bell },
      ...(isAdmin ? [{ id: 'system', label: 'Database', icon: Database }] : [])
    ]
  })()

  // Pastikan tab aktif valid sesuai hak akses jabatan
  useEffect(() => {
    if (adminTabsList.length > 0 && !adminTabsList.some((t) => t.id === adminTab)) {
      setAdminTab(adminTabsList[0].id)
    }
  }, [isBendahara, isPengurus, isRT, isRW, isAdmin])

  // Filtered Accounts
  const filteredBanks = bankAccounts.filter((b) => {
    if (rekeningScope === 'Semua') return true
    if (rekeningScope === 'RW') return b.owner_type === 'RW'
    const targetRt = rekeningScope === 'RT 01' ? 'rt-1' : rekeningScope === 'RT 02' ? 'rt-2' : 'rt-3'
    return b.owner_type === 'RT' && b.owner_id === targetRt
  })

  const filteredQris = qrisAccounts.filter((q) => {
    if (rekeningScope === 'Semua') return true
    if (rekeningScope === 'RW') return q.owner_type === 'RW'
    const targetRt = rekeningScope === 'RT 01' ? 'rt-1' : rekeningScope === 'RT 02' ? 'rt-2' : 'rt-3'
    return q.owner_type === 'RT' && q.owner_id === targetRt
  })

  return (
    <View style={styles.container}>
      {/* Header Mobile-First */}
      <AppHeader
        title={
          isWarga
            ? 'Profil & Pengaturan Akun'
            : isBendahara
            ? 'Pengaturan Keuangan & Rekening'
            : isPengurus
            ? 'Pengaturan Fasum & Wilayah'
            : isRT
            ? 'Pengaturan Wilayah RT'
            : isRW
            ? 'Pengaturan Wilayah RW'
            : 'Pengaturan Sistem & Database'
        }
        subtitle={
          isWarga
            ? 'Data identitas warga & alamat rumah'
            : isBendahara
            ? 'Konfigurasi tarif iuran, rekening penerima kas, dan Moota'
            : isPengurus
            ? 'Identitas lingkungan RT/RW dan master tarif pos iuran'
            : 'Konfigurasi tarif iuran, identitas RT/RW, dan rekening'
        }
        navigation={navigation}
        onBack={() => {
          if (navigation?.canGoBack && navigation.canGoBack()) {
            navigation.goBack()
          } else {
            navigation?.navigate('Main', { screen: 'DashboardTab' })
          }
        }}
      />

      {/* Admin/RT Horizontal Scrollable Tabs */}
      {!isWarga && (
        <View style={styles.tabBarWrap}>
          <AppTabs
            tabs={adminTabsList}
            activeTab={adminTab}
            onTabChange={setAdminTab}
            scrollable={true}
          />
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ============================================================== */}
        {/* VIEW 1: WARGA - EDIT PROFIL WARGA                             */}
        {/* ============================================================== */}
        {isWarga && (
          <View>
            <AppCard>
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardIconBox}>
                  <User size={18} color={colors.primary} />
                </View>
                <View style={styles.cardHeaderTextCol}>
                  <Text style={styles.cardTitle}>Data Pribadi & Tempat Tinggal</Text>
                  <Text style={styles.cardSubtitle}>Perbarui data diri untuk keperluan pendataan warga</Text>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Nama Lengkap *</Text>
                <TextInput
                  style={styles.input}
                  value={wargaNama}
                  onChangeText={setWargaNama}
                  placeholder="Nama Lengkap"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.rowTwoCols}>
                <View style={[styles.formGroup, { flex: 1, marginRight: spacing.sm }]}>
                  <Text style={styles.label}>NIK</Text>
                  <TextInput
                    style={styles.input}
                    value={wargaNik}
                    onChangeText={setWargaNik}
                    placeholder="3201xxxxxxxxxxxx"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1, marginLeft: spacing.sm }]}>
                  <Text style={styles.label}>No. KK</Text>
                  <TextInput
                    style={styles.input}
                    value={wargaNoKk}
                    onChangeText={setWargaNoKk}
                    placeholder="3201xxxxxxxxxxxx"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.rowTwoCols}>
                <View style={[styles.formGroup, { flex: 1, marginRight: spacing.sm }]}>
                  <Text style={styles.label}>Blok Rumah</Text>
                  <TextInput
                    style={styles.input}
                    value={wargaBlok}
                    onChangeText={setWargaBlok}
                    placeholder="Contoh: A"
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="characters"
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1, marginLeft: spacing.sm }]}>
                  <Text style={styles.label}>Nomor Rumah</Text>
                  <TextInput
                    style={styles.input}
                    value={wargaNoRumah}
                    onChangeText={setWargaNoRumah}
                    placeholder="Contoh: 12"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Nomor WhatsApp / HP</Text>
                <TextInput
                  style={styles.input}
                  value={wargaNoHp}
                  onChangeText={setWargaNoHp}
                  placeholder="08123456789"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="phone-pad"
                />
              </View>

              <AppButton
                title={savingWarga ? 'Menyimpan...' : 'Simpan Perubahan Profil'}
                onPress={handleSimpanWarga}
                loading={savingWarga}
                style={{ marginTop: spacing.md }}
              />
            </AppCard>

            {/* KARTU PUSH NOTIFIKASI UNTUK WARGA */}
            <AppCard style={{ marginTop: spacing.md }}>
              <View style={styles.cardHeaderRow}>
                <View style={[styles.cardIconBox, { backgroundColor: '#ECFDF5' }]}>
                  <Bell size={18} color={colors.primary} />
                </View>
                <View style={styles.cardHeaderTextCol}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={styles.cardTitle}>Pemberitahuan & Notifikasi HP</Text>
                    <View style={[styles.serverStatusPill, { backgroundColor: expoPushToken ? '#DCFCE7' : '#FEF3C7' }]}>
                      <Text style={[styles.serverStatusPillText, { color: expoPushToken ? '#166534' : '#B45309' }]}>
                        {expoPushToken ? 'AKTIF 🟢' : 'BELUM AKTIF 🟡'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.cardSubtitle}>
                    Terima kabar tagihan iuran baru, pengumuman, dan konfirmasi pembayaran di HP Anda
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 10, marginTop: spacing.md }}>
                <View style={{ flex: 1 }}>
                  <AppButton
                    title={testingPush ? 'Mengirim...' : 'Uji Notifikasi'}
                    onPress={handleTestPush}
                    loading={testingPush}
                    icon={<Send size={15} color={colors.white} />}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <AppButton
                    title={refreshingToken ? 'Memperbarui...' : 'Aktifkan / Refresh'}
                    variant="secondary"
                    onPress={handleRefreshPushToken}
                    loading={refreshingToken}
                    icon={<RotateCcw size={15} color={colors.primary} />}
                  />
                </View>
              </View>
            </AppCard>
          </View>
        )}

        {/* ============================================================== */}
        {/* VIEW 2: ADMIN - TAB: JADWAL OTOMATISASI TAGIHAN IPL            */}
        {/* ============================================================== */}
        {!isWarga && adminTab === 'jadwal' && (
          <View style={{ gap: spacing.md }}>
            {/* KARTU 1: MONITORING STATUS SERVER SCHEDULER */}
            <AppCard style={styles.schedulerMonitorCard}>
              <View style={styles.cardHeaderRow}>
                <View style={[styles.cardIconBox, { backgroundColor: '#ECFDF5' }]}>
                  <Zap size={20} color="#059669" />
                </View>
                <View style={styles.cardHeaderTextCol}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={styles.cardTitle}>Status Scheduler Server</Text>
                    <View style={[styles.serverStatusPill, { backgroundColor: autoBilling.enabled ? '#DCFCE7' : '#FEE2E2' }]}>
                      <View style={[styles.livePulseDot, { backgroundColor: autoBilling.enabled ? '#16A34A' : '#DC2626' }]} />
                      <Text style={[styles.serverStatusPillText, { color: autoBilling.enabled ? '#15803D' : '#B91C1C' }]}>
                        {autoBilling.enabled ? 'SCHEDULER AKTIF' : 'NONAKTIF'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.cardSubtitle}>Zona Waktu: Asia/Jakarta (WIB) • Berjalan di Server Backend</Text>
                </View>
              </View>

              {/* Status Grid */}
              <View style={styles.schedulerGrid}>
                {/* Jadwal Terbit Berikutnya */}
                <View style={styles.schedulerGridItem}>
                  <View style={styles.schedulerItemHead}>
                    <CalendarDays size={14} color="#4F46E5" />
                    <Text style={styles.schedulerItemLabel}>Jadwal Terbit Berikutnya</Text>
                  </View>
                  <Text style={styles.schedulerItemValue}>
                    {calculateNextRunDate(autoBilling.publishDay).formatted}
                  </Text>
                  <Text style={styles.schedulerItemSub}>
                    Pukul 00:05 WIB (Otomatis)
                  </Text>
                </View>

                {/* Eksekusi Terakhir */}
                <View style={styles.schedulerGridItem}>
                  <View style={styles.schedulerItemHead}>
                    <Clock size={14} color="#059669" />
                    <Text style={styles.schedulerItemLabel}>Periode Terakhir Terbit</Text>
                  </View>
                  <Text style={styles.schedulerItemValue}>
                    {autoBilling.last_run_period || 'Oktober 2026'}
                  </Text>
                  <Text style={styles.schedulerItemSub}>
                    {autoBilling.last_run_created_count || 0} tagihan dibuat
                  </Text>
                </View>
              </View>

              {/* Server Heartbeat Banner */}
              <View style={styles.heartbeatBanner}>
                <View style={styles.heartbeatLeft}>
                  <CheckCircle2 size={16} color="#059669" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.heartbeatTitle}>Backend Daemon & Database Terhubung</Text>
                    <Text style={styles.heartbeatDesc}>
                      {autoBilling.last_run_message || 'Sistem siap menerbitkan tagihan bulanan secara otomatis tanpa harus membuka aplikasi.'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Action Button: Manual Trigger / Catch-Up Test */}
              <TouchableOpacity
                style={styles.testSyncBtn}
                onPress={handleTestAutoBilling}
                disabled={testingJadwal}
                activeOpacity={0.85}
              >
                {testingJadwal ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Play size={15} color="#FFFFFF" />
                    <Text style={styles.testSyncBtnText}>Uji / Jalankan Penerbitan Sekarang</Text>
                  </>
                )}
              </TouchableOpacity>
            </AppCard>

            {/* KARTU 2: FORM PENGATURAN JADWAL TERBIT & JATUH TEMPO */}
            <AppCard style={styles.schedulerFormCard}>
              <View style={styles.cardHeaderRow}>
                <View style={[styles.cardIconBox, { backgroundColor: '#EEF2FF' }]}>
                  <Calendar size={20} color="#4F46E5" />
                </View>
                <View style={styles.cardHeaderTextCol}>
                  <Text style={styles.cardTitle}>Pengaturan Jadwal Bulanan</Text>
                  <Text style={styles.cardSubtitle}>Atur tanggal terbit dan batas waktu pembayaran warga</Text>
                </View>
              </View>

              {/* Toggle Aktif / Nonaktif */}
              <View style={styles.toggleRow}>
                <View style={{ flex: 1, marginRight: spacing.md }}>
                  <Text style={styles.toggleTitle}>Status Otomatisasi Penerbitan</Text>
                  <Text style={styles.toggleDesc}>
                    {autoEnabled
                      ? 'Aktif — Tagihan akan terbit otomatis setiap bulan sesuai tanggal yang ditentukan.'
                      : 'Nonaktif — Penerbitan otomatis dihentikan sementara tanpa menghapus tagihan yang ada.'}
                  </Text>
                </View>
                <Switch
                  value={autoEnabled}
                  onValueChange={setAutoEnabled}
                  trackColor={{ false: '#CBD5E1', true: '#86EFAC' }}
                  thumbColor={autoEnabled ? '#16A34A' : '#94A3B8'}
                />
              </View>

              {/* Input Tanggal Terbit Bulanan */}
              <View style={styles.inputSection}>
                <Text style={styles.inputSectionLabel}>
                  1. Tanggal Terbit Setiap Bulan (1 - 31)
                </Text>
                <Text style={styles.inputSectionSub}>
                  Pilih tanggal eksekusi otomatis penerbitan tagihan warga
                </Text>

                <View style={styles.presetChipsRow}>
                  {[1, 5, 10, 15, 25, 31].map((dayNum) => {
                    const isSelected = parseInt(publishDay, 10) === dayNum
                    return (
                      <TouchableOpacity
                        key={dayNum}
                        style={[styles.presetChip, isSelected && styles.presetChipActive]}
                        onPress={() => setPublishDay(String(dayNum))}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.presetChipText, isSelected && styles.presetChipTextActive]}>
                          {dayNum === 31 ? 'Tgl 31 (Akhir Bulan)' : `Tgl ${dayNum}`}
                        </Text>
                      </TouchableOpacity>
                    )
                  })}
                </View>

                <TextInput
                  style={styles.numberInput}
                  value={publishDay}
                  onChangeText={setPublishDay}
                  keyboardType="numeric"
                  placeholder="Misal: 5"
                  placeholderTextColor="#94A3B8"
                  maxLength={2}
                />

                {/* Info Note: End of Month Rule */}
                <View style={styles.infoNoteBox}>
                  <Sparkles size={14} color="#6D28D9" />
                  <Text style={styles.infoNoteText}>
                    Aturan Akhir Bulan: Jika diatur tanggal 31, untuk bulan dengan 30 hari (April, Juni, September, November) sistem otomatis menerbitkan di tanggal 30. Untuk Februari terbit di tanggal 28 (atau 29 pada tahun kabisat).
                  </Text>
                </View>
              </View>

              {/* Input Tanggal Jatuh Tempo */}
              <View style={styles.inputSection}>
                <Text style={styles.inputSectionLabel}>
                  2. Tanggal Jatuh Tempo Pembayaran (1 - 31)
                </Text>
                <Text style={styles.inputSectionSub}>
                  Batas akhir pembayaran sebelum status tagihan dinyatakan terlambat
                </Text>

                <View style={styles.presetChipsRow}>
                  {[10, 15, 20, 25, 30].map((dayNum) => {
                    const isSelected = parseInt(dueDay, 10) === dayNum
                    return (
                      <TouchableOpacity
                        key={dayNum}
                        style={[styles.presetChip, isSelected && styles.presetChipActive]}
                        onPress={() => setDueDay(String(dayNum))}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.presetChipText, isSelected && styles.presetChipTextActive]}>
                          Tgl {dayNum}
                        </Text>
                      </TouchableOpacity>
                    )
                  })}
                </View>

                <TextInput
                  style={styles.numberInput}
                  value={dueDay}
                  onChangeText={setDueDay}
                  keyboardType="numeric"
                  placeholder="Misal: 20"
                  placeholderTextColor="#94A3B8"
                  maxLength={2}
                />
              </View>

              {/* Pilihan Scope Tagihan */}
              <View style={styles.inputSection}>
                <Text style={styles.inputSectionLabel}>
                  3. Lingkup Tagihan yang Diterbitkan
                </Text>
                <View style={styles.scopeButtonsRow}>
                  {[
                    { key: 'ALL', label: 'Semua (RT & RW)', desc: 'Iuran RT dan Fasum RW' },
                    { key: 'RT', label: 'Hanya RT', desc: 'Kas Lingkungan RT saja' },
                    { key: 'RW', label: 'Hanya RW', desc: 'Kas Fasum RW saja' }
                  ].map((sc) => {
                    const isSelected = billingScope === sc.key
                    return (
                      <TouchableOpacity
                        key={sc.key}
                        style={[styles.scopeBtn, isSelected && styles.scopeBtnActive]}
                        onPress={() => setBillingScope(sc.key)}
                        activeOpacity={0.85}
                      >
                        <Text style={[styles.scopeBtnTitle, isSelected && styles.scopeBtnTitleActive]}>
                          {sc.label}
                        </Text>
                        <Text style={[styles.scopeBtnDesc, isSelected && styles.scopeBtnDescActive]}>
                          {sc.desc}
                        </Text>
                      </TouchableOpacity>
                    )
                  })}
                </View>
              </View>

              {/* Dynamic Live Summary Box */}
              <View style={styles.summaryRuleBox}>
                <Text style={styles.summaryRuleTitle}>📌 Ringkasan Alur Penerbitan:</Text>
                <Text style={styles.summaryRuleDesc}>
                  Setiap tanggal {publishDay || '5'} pukul 00:05 WIB, sistem backend akan otomatis menerbitkan tagihan IPL ({billingScope}) untuk seluruh warga aktif sebesar total tarif pos iuran berlaku ditambah kode unik warga. Batas jatuh tempo pembayaran ditetapkan tanggal {dueDay || '20'}. Warga akan langsung menerima notifikasi tagihan baru di aplikasi mereka.
                </Text>
              </View>

              <AppButton
                title={savingJadwal ? 'Menyimpan Pengaturan...' : 'Simpan Pengaturan Jadwal'}
                onPress={handleSaveJadwal}
                loading={savingJadwal}
                style={{ marginTop: spacing.md }}
              />
            </AppCard>

            {/* KARTU 3: PROTOKOL KEAMANAN & IDEMPOTENSI (ANTI-TAGIHAN GANDA) */}
            <AppCard style={styles.securityProtocolCard}>
              <View style={styles.cardHeaderRow}>
                <View style={[styles.cardIconBox, { backgroundColor: '#F0FDF4' }]}>
                  <ShieldCheck size={20} color="#16A34A" />
                </View>
                <View style={styles.cardHeaderTextCol}>
                  <Text style={styles.cardTitle}>Protokol Keamanan & Anti-Tagihan Ganda</Text>
                  <Text style={styles.cardSubtitle}>Standar kepatuhan database dan integritas data keuangan</Text>
                </View>
              </View>

              <View style={styles.securityItemsList}>
                <View style={styles.securityItem}>
                  <Check size={16} color="#16A34A" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.securityItemTitle}>Idempotensi Database Mutlak (Unique Index)</Text>
                    <Text style={styles.securityItemDesc}>
                      Format ID tagihan bersifat deterministik (tag-TAHUN-BULAN-SCOPE-WARGA). Database PostgreSQL Supabase menolak duplikasi secara fisik.
                    </Text>
                  </View>
                </View>

                <View style={styles.securityItem}>
                  <Check size={16} color="#16A34A" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.securityItemTitle}>Perlindungan Tagihan yang Sudah Dibayar</Text>
                    <Text style={styles.securityItemDesc}>
                      Tagihan yang sudah berstatus 'Lunas' dikunci secara permanen dan tidak akan pernah diubah atau dibuat ulang saat scheduler berjalan.
                    </Text>
                  </View>
                </View>

                <View style={styles.securityItem}>
                  <Check size={16} color="#16A34A" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.securityItemTitle}>Pemisahan Iuran Kegiatan & Acara</Text>
                    <Text style={styles.securityItemDesc}>
                      Tagihan kegiatan 17 Agustus, kerja bakti, atau lomba warga memiliki alur terpisah dan tidak tercampur dengan tagihan IPL reguler.
                    </Text>
                  </View>
                </View>

                <View style={styles.securityItem}>
                  <Check size={16} color="#16A34A" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.securityItemTitle}>Pencegahan Notifikasi Berulang</Text>
                    <Text style={styles.securityItemDesc}>
                      Notifikasi penerbitan hanya dikirimkan satu kali bersamaan dengan pembuatan tagihan baru, tidak berulang saat jadwal dicek ulang.
                    </Text>
                  </View>
                </View>
              </View>
            </AppCard>
          </View>
        )}

        {/* ============================================================== */}
        {/* VIEW 2: ADMIN - TAB 1: POS IURAN (IPL)                          */}
        {/* ============================================================== */}
        {!isWarga && adminTab === 'iuran' && (
          <View>
            <AppCard>
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardIconBox}>
                  <Layers size={18} color={colors.primary} />
                </View>
                <View style={styles.cardHeaderTextCol}>
                  <Text style={styles.cardTitle}>Master Pos Tarif Iuran (IPL)</Text>
                  <Text style={styles.cardSubtitle}>Atur pos iuran wajib bulanan yang dibebankan kepada warga</Text>
                </View>
              </View>

              {/* List Pos Iuran */}
              <View style={styles.itemsList}>
                {jenisIuran.map((item) => (
                  <View key={item.id} style={styles.itemRow}>
                    <View style={{ flex: 1, marginRight: spacing.sm }}>
                      <Text style={styles.itemName}>{item.nama}</Text>
                      <Text style={styles.itemNominal}>{formatRupiah(item.nominal)}</Text>
                      {item.keterangan ? (
                        <Text style={styles.itemDesc} numberOfLines={1}>{item.keterangan}</Text>
                      ) : null}
                    </View>

                    <View style={styles.itemActionCol}>
                      <Switch
                        value={item.aktif}
                        onValueChange={() => toggleJenisIuran(item.id)}
                        trackColor={{ false: colors.border, true: colors.primary }}
                        thumbColor={colors.white}
                      />
                    </View>
                  </View>
                ))}
              </View>

              <AppButton
                title="+ Tambah Pos Iuran Baru"
                onPress={() => setModalAddIuran(true)}
                variant="secondary"
                size="md"
                style={{ marginTop: spacing.md }}
              />
            </AppCard>
          </View>
        )}

        {/* ============================================================== */}
        {/* VIEW 2: ADMIN - TAB 2: REKENING BANK & QRIS (RT & RW TERPISAH) */}
        {/* ============================================================== */}
        {!isWarga && adminTab === 'rekening' && (
          <View>
            {/* Scope Filter Chips */}
            <View style={styles.scopeFilterWrap}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scopeChipsContainer}>
                {['Semua', 'RW', 'RT 01', 'RT 02', 'RT 03'].map((scope) => {
                  const isSel = rekeningScope === scope
                  return (
                    <TouchableOpacity
                      key={scope}
                      onPress={() => setRekeningScope(scope)}
                      style={[styles.scopeChip, isSel && styles.scopeChipActive]}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.scopeChipText, isSel && styles.scopeChipTextActive]}>
                        {scope === 'RW' ? 'Kas RW 15' : scope === 'Semua' ? 'Semua Wilayah' : `Kas ${scope}`}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </ScrollView>
            </View>

            {/* CARD 1: REKENING BANK */}
            <AppCard>
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardIconBox}>
                  <Landmark size={18} color={colors.primary} />
                </View>
                <View style={styles.cardHeaderTextCol}>
                  <Text style={styles.cardTitle}>Rekening Bank Penerima</Text>
                  <Text style={styles.cardSubtitle}>Rekening tujuan transfer warga untuk RT & RW terpisah</Text>
                </View>
              </View>

              {filteredBanks.length === 0 ? (
                <AppEmptyState
                  icon={<Landmark size={48} color={colors.textSecondary} strokeWidth={1.5} />}
                  title="Belum Ada Rekening Bank"
                  description="Tambahkan rekening bank untuk menerima setoran iuran warga."
                />
              ) : (
                <View style={styles.accountList}>
                  {filteredBanks.map((b) => {
                    const isRW = b.owner_type === 'RW'
                    const rtObj = (rts || []).find((r) => r.id === b.owner_id)
                    const ownerLabel = isRW ? 'Kas RW 15' : rtObj?.name || b.owner_id

                    return (
                      <View key={b.id} style={styles.accountCardItem}>
                        <View style={styles.accountCardTop}>
                          <AppBadge
                            status={isRW ? 'rw' : 'rt'}
                            label={ownerLabel}
                            size="sm"
                          />
                          {b.is_primary ? (
                            <View style={styles.primaryBadge}>
                              <Star size={10} color="#B54708" style={{ marginRight: 3 }} />
                              <Text style={styles.primaryBadgeText}>UTAMA</Text>
                            </View>
                          ) : (
                            <TouchableOpacity
                              onPress={() => handleSetPrimaryBank(b)}
                              style={styles.setPrimaryLink}
                            >
                              <Text style={styles.setPrimaryLinkText}>Set Utama</Text>
                            </TouchableOpacity>
                          )}
                        </View>

                        <View style={styles.accountBody}>
                          <Text style={styles.bankNameText}>{b.bank_name}</Text>
                          <Text style={styles.accountNumberText}>{b.account_number}</Text>
                          <Text style={styles.accountHolderText}>a.n {b.account_holder}</Text>
                        </View>

                        <View style={styles.accountActionsRow}>
                          <TouchableOpacity
                            onPress={() => handleOpenEditBank(b)}
                            style={styles.editActionBtn}
                            activeOpacity={0.7}
                          >
                            <Edit3 size={13} color={colors.primary} style={{ marginRight: 4 }} />
                            <Text style={styles.editActionText}>Edit</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleHapusBank(b)}
                            style={styles.deleteActionBtn}
                            activeOpacity={0.7}
                          >
                            <Trash2 size={13} color={colors.danger} style={{ marginRight: 4 }} />
                            <Text style={styles.deleteActionText}>Hapus</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )
                  })}
                </View>
              )}

              <AppButton
                title="+ Tambah Rekening Bank"
                onPress={() => {
                  setNewBankOwnerType('RT')
                  setNewBankRtId('rt-1')
                  setNewBankName('BCA')
                  setNewAccNumber('')
                  setNewAccHolder('')
                  setNewIsPrimaryBank(false)
                  setModalAddBank(true)
                }}
                variant="secondary"
                size="md"
                style={{ marginTop: spacing.md }}
              />
            </AppCard>

            {/* CARD 2: QRIS PEMBAYARAN */}
            <AppCard>
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardIconBox}>
                  <QrCode size={18} color={colors.primary} />
                </View>
                <View style={styles.cardHeaderTextCol}>
                  <Text style={styles.cardTitle}>Barcode QRIS Kas</Text>
                  <Text style={styles.cardSubtitle}>Scan barcode QRIS untuk pembayaran langsung via m-Banking/E-Wallet</Text>
                </View>
              </View>

              {filteredQris.length === 0 ? (
                <AppEmptyState
                  icon={<QrCode size={48} color={colors.textSecondary} strokeWidth={1.5} />}
                  title="Belum Ada Akun QRIS"
                  description="Tambahkan akun QRIS resmi untuk pembayaran iuran warga."
                />
              ) : (
                <View style={styles.accountList}>
                  {filteredQris.map((q) => {
                    const isRW = q.owner_type === 'RW'
                    const rtObj = (rts || []).find((r) => r.id === q.owner_id)
                    const ownerLabel = isRW ? 'Kas RW 15' : rtObj?.name || q.owner_id
                    const qrUri = q.image_url || `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=QRIS_${encodeURIComponent(q.qris_name)}`

                    return (
                      <View key={q.id} style={styles.accountCardItem}>
                        <View style={styles.accountCardTop}>
                          <AppBadge
                            status={isRW ? 'rw' : 'rt'}
                            label={ownerLabel}
                            size="sm"
                          />
                          {q.is_primary ? (
                            <View style={styles.primaryBadge}>
                              <Star size={10} color="#B54708" style={{ marginRight: 3 }} />
                              <Text style={styles.primaryBadgeText}>UTAMA</Text>
                            </View>
                          ) : (
                            <TouchableOpacity
                              onPress={() => handleSetPrimaryQris(q)}
                              style={styles.setPrimaryLink}
                            >
                              <Text style={styles.setPrimaryLinkText}>Set Utama</Text>
                            </TouchableOpacity>
                          )}
                        </View>

                        <TouchableOpacity 
                          style={styles.qrisPreviewRow}
                          activeOpacity={0.8}
                          onPress={() => handlePreviewQris(q)}
                        >
                          <View style={styles.qrisThumbWrapper}>
                            <Image
                              source={{ uri: qrUri }}
                              style={styles.qrisThumbnail}
                              resizeMode="contain"
                            />
                            <View style={styles.zoomBadgeIcon}>
                              <Maximize2 size={9} color={colors.white} />
                            </View>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.bankNameText}>{q.qris_name}</Text>
                            {q.nmid ? <Text style={styles.qrisNmidText}>NMID: {q.nmid}</Text> : null}
                            <Text style={styles.qrisReadyText}>✓ Siap scan m-Banking</Text>
                            <Text style={styles.tapToZoomText}>Ketuk foto untuk perbesar 🔍</Text>
                          </View>
                        </TouchableOpacity>

                        <View style={styles.accountActionsRow}>
                          <TouchableOpacity
                            onPress={() => handlePreviewQris(q)}
                            style={styles.viewActionBtn}
                            activeOpacity={0.7}
                          >
                            <Eye size={13} color={colors.primary} style={{ marginRight: 4 }} />
                            <Text style={styles.viewActionText}>Lihat QR</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleOpenEditQris(q)}
                            style={styles.editActionBtn}
                            activeOpacity={0.7}
                          >
                            <Edit3 size={13} color={colors.primary} style={{ marginRight: 4 }} />
                            <Text style={styles.editActionText}>Edit</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleHapusQris(q)}
                            style={styles.deleteActionBtn}
                            activeOpacity={0.7}
                          >
                            <Trash2 size={13} color={colors.danger} style={{ marginRight: 4 }} />
                            <Text style={styles.deleteActionText}>Hapus</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )
                  })}
                </View>
              )}

              <AppButton
                title="+ Tambah Akun QRIS"
                onPress={() => {
                  setNewQrisOwnerType('RT')
                  setNewQrisRtId('rt-1')
                  setNewQrisName('')
                  setNewQrisNmid('')
                  setNewQrisImageUrl('')
                  setNewIsPrimaryQris(false)
                  setModalAddQris(true)
                }}
                variant="secondary"
                size="md"
                style={{ marginTop: spacing.md }}
              />
            </AppCard>
          </View>
        )}

        {/* ============================================================== */}
        {/* VIEW 2: ADMIN - TAB 3: PROFIL RW                                */}
        {/* ============================================================== */}
        {!isWarga && adminTab === 'rw' && (
          <View>
            <AppCard>
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardIconBox}>
                  <Building size={18} color={colors.primary} />
                </View>
                <View style={styles.cardHeaderTextCol}>
                  <Text style={styles.cardTitle}>Identitas Lingkungan & Pengurus RW</Text>
                  <Text style={styles.cardSubtitle}>Profil kepengurusan tingkat Rukun Warga (RW)</Text>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Nama Perumahan / Lingkungan</Text>
                <TextInput
                  style={styles.input}
                  value={rwNamaLingkungan}
                  onChangeText={setRwNamaLingkungan}
                  placeholder="Perumahan Griya Indah"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.rowTwoCols}>
                <View style={[styles.formGroup, { flex: 1, marginRight: spacing.sm }]}>
                  <Text style={styles.label}>Nomor RW</Text>
                  <TextInput
                    style={styles.input}
                    value={rwNomor}
                    onChangeText={setRwNomor}
                    placeholder="RW 15"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1, marginLeft: spacing.sm }]}>
                  <Text style={styles.label}>Nama Ketua RW</Text>
                  <TextInput
                    style={styles.input}
                    value={rwKetua}
                    onChangeText={setRwKetua}
                    placeholder="Bpk. H. Rahmat"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>No. WhatsApp Pengurus RW</Text>
                <TextInput
                  style={styles.input}
                  value={rwKontak}
                  onChangeText={setRwKontak}
                  placeholder="081122334455"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Info Rekening Kas Bersama RW</Text>
                <TextInput
                  style={styles.input}
                  value={rwRekening}
                  onChangeText={setRwRekening}
                  placeholder="BCA 7788990011 a.n Kas RW 15"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <AppButton
                title="Simpan Profil RW"
                onPress={handleSimpanRw}
                icon={<Save size={16} color={colors.white} />}
                style={{ marginTop: spacing.md }}
              />
            </AppCard>
          </View>
        )}

        {/* ============================================================== */}
        {/* VIEW 2: ADMIN - TAB 4: PROFIL RT                                */}
        {/* ============================================================== */}
        {!isWarga && adminTab === 'rt' && (
          <View>
            <AppCard>
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardIconBox}>
                  <Landmark size={18} color={colors.primary} />
                </View>
                <View style={styles.cardHeaderTextCol}>
                  <Text style={styles.cardTitle}>Pengurus & Rekening Kas per RT</Text>
                  <Text style={styles.cardSubtitle}>Ketua, Bendahara (tanda tangan kwitansi), No WA, dan Kas RT</Text>
                </View>
              </View>

              {/* RT Selector + Tambah RT */}
              <View style={styles.rtSelectorContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rtSelectorScroll}>
                  {(rts || []).map((r) => {
                    const isSel = selectedRtId === r.id
                    return (
                      <TouchableOpacity
                        key={r.id}
                        onPress={() => setSelectedRtId(r.id)}
                        style={[styles.rtSelectChip, isSel && styles.rtSelectChipActive]}
                        activeOpacity={0.75}
                      >
                        <Text style={[styles.rtSelectChipText, isSel && styles.rtSelectChipTextActive]}>
                          {r.name}
                        </Text>
                      </TouchableOpacity>
                    )
                  })}
                  {(isAdmin || isRW) && (
                    <TouchableOpacity
                      onPress={handleOpenAddRt}
                      style={styles.addRtChip}
                      activeOpacity={0.75}
                    >
                      <Plus size={13} color={colors.primary} style={{ marginRight: 4 }} />
                      <Text style={styles.addRtChipText}>+ Tambah RT</Text>
                    </TouchableOpacity>
                  )}
                </ScrollView>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Nama Ketua {activeRt?.name}</Text>
                <TextInput
                  style={styles.input}
                  value={rtKetua}
                  onChangeText={setRtKetua}
                  placeholder="Contoh: Bpk. Syahdan"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Nama Bendahara (Tanda Tangan Struk)</Text>
                <TextInput
                  style={styles.input}
                  value={rtBendahara}
                  onChangeText={setRtBendahara}
                  placeholder="Contoh: Ibu Siti Aminah"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Nomor WhatsApp {activeRt?.name}</Text>
                <TextInput
                  style={styles.input}
                  value={rtKontak}
                  onChangeText={setRtKontak}
                  placeholder="081234567890"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Info Rekening Kas {activeRt?.name}</Text>
                <TextInput
                  style={styles.input}
                  value={rtRekening}
                  onChangeText={setRtRekening}
                  placeholder="BCA 8730192831 a.n Kas RT 01"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              {/* GIS & Lokasi Denah Balai RT */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Nama Pos / Balai RT (Landmark Denah)</Text>
                <TextInput
                  style={styles.input}
                  value={rtLokasi}
                  onChangeText={setRtLokasi}
                  placeholder="Contoh: Pos Ronda & Balai Warga RT 01"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.rowTwoCols}>
                <View style={[styles.formGroup, { flex: 1, marginRight: spacing.sm }]}>
                  <Text style={styles.label}>Latitude GIS</Text>
                  <TextInput
                    style={styles.input}
                    value={rtLat}
                    onChangeText={setRtLat}
                    placeholder="-6.59715"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1, marginLeft: spacing.sm }]}>
                  <Text style={styles.label}>Longitude GIS</Text>
                  <TextInput
                    style={styles.input}
                    value={rtLng}
                    onChangeText={setRtLng}
                    placeholder="106.76415"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <TouchableOpacity
                style={styles.viewOnMapBtn}
                onPress={() => {
                  const latVal = parseFloat(rtLat) || -6.59715
                  const lngVal = parseFloat(rtLng) || 106.76415
                  Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${latVal},${lngVal}`)
                }}
                activeOpacity={0.8}
              >
                <Navigation size={14} color={colors.primary} />
                <Text style={styles.viewOnMapBtnText}>Buka Posko {activeRt?.name} di Google Maps</Text>
                <ExternalLink size={12} color={colors.primary} />
              </TouchableOpacity>

              <View style={styles.rtActionButtonsRow}>
                <View style={{ flex: 1 }}>
                  <AppButton
                    title={`Simpan Data & Peta ${activeRt?.name || 'RT'}`}
                    onPress={handleSimpanRt}
                    icon={<Save size={16} color={colors.white} />}
                  />
                </View>
                {(isAdmin || isRW) && (rts || []).length > 1 && (
                  <TouchableOpacity
                    onPress={() => handleHapusRt(activeRt)}
                    style={styles.deleteRtBtn}
                    activeOpacity={0.7}
                  >
                    <Trash2 size={16} color={colors.danger} />
                    <Text style={styles.deleteRtBtnText}>Hapus RT</Text>
                  </TouchableOpacity>
                )}
              </View>
            </AppCard>
          </View>
        )}

        {/* ============================================================== */}
        {/* VIEW 2: ADMIN - TAB MOOTA: INTEGRASI MOOTA SANDBOX             */}
        {/* ============================================================== */}
        {!isWarga && adminTab === 'moota' && (
          <View>
            <AppCard>
              <View style={styles.cardHeaderRow}>
                <View style={[styles.cardIconBox, { backgroundColor: '#FEF3C7' }]}>
                  <ShieldCheck size={18} color="#D97706" />
                </View>
                <View style={styles.cardHeaderTextCol}>
                  <Text style={styles.cardTitle}>Integrasi Moota Payment Gateway</Text>
                  <Text style={styles.cardSubtitle}>
                    Verifikasi mutasi bank & pelunasan tagihan otomatis menggunakan 3 digit kode unik warga
                  </Text>
                </View>
              </View>

              {/* Status Message */}
              {mootaStatusMsg && (
                <View
                  style={{
                    backgroundColor: mootaStatusMsg.success ? '#ECFDF5' : '#FEF2F2',
                    borderColor: mootaStatusMsg.success ? '#A7F3D0' : '#FECACA',
                    borderWidth: 1,
                    borderRadius: 10,
                    padding: 12,
                    marginBottom: 16
                  }}
                >
                  <Text
                    style={{
                      color: mootaStatusMsg.success ? '#065F46' : '#991B1B',
                      fontSize: 12,
                      fontWeight: '700'
                    }}
                  >
                    {mootaStatusMsg.text}
                  </Text>
                </View>
              )}

              {/* Moota API Token */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Moota API Token (Bearer)</Text>
                <TextInput
                  style={[styles.input, { height: 70, textAlignVertical: 'top' }]}
                  value={mootaToken}
                  onChangeText={setMootaToken}
                  placeholder="eyJ0eXAiOi..."
                  placeholderTextColor={colors.textMuted}
                  multiline
                  autoCapitalize="none"
                />
              </View>

              {/* Moota Bank Account ID */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Moota Bank Account ID (Sandbox)</Text>
                <TextInput
                  style={styles.input}
                  value={mootaBankId}
                  onChangeText={setMootaBankId}
                  placeholder="Lagzqp0Pk42"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                />
              </View>

              {/* Webhook Endpoint */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Webhook Endpoint URL (Supabase)</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TextInput
                    style={[styles.input, { flex: 1, backgroundColor: '#F8FAFC', color: colors.textSecondary }]}
                    value={webhookUrl}
                    editable={false}
                  />
                  <TouchableOpacity
                    style={[styles.copyBtn, { marginLeft: 8, paddingVertical: 12, paddingHorizontal: 12 }]}
                    onPress={async () => {
                      await copyToClipboard(webhookUrl)
                      Alert.alert('Tersalin', 'Webhook URL berhasil disalin! Masukkan URL ini di menu Webhook dashboard Moota.')
                    }}
                    activeOpacity={0.8}
                  >
                    <Copy size={16} color={colors.primary} />
                  </TouchableOpacity>
                </View>
                <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 4 }}>
                  Salin URL di atas ke menu <Text style={{ fontWeight: '700' }}>Pengaturan &gt; Webhook</Text> di Dashboard Moota.
                </Text>
              </View>

              {/* Buttons */}
              <View style={{ flexDirection: 'row', marginTop: spacing.sm, gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <AppButton
                    title={mootaTesting ? 'Menguji...' : '⚡ Test Koneksi Sandbox'}
                    onPress={handleTestMoota}
                    loading={mootaTesting}
                    variant="secondary"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <AppButton
                    title="Simpan Pengaturan"
                    onPress={handleSimpanMoota}
                    loading={savingMoota}
                    icon={<Save size={16} color={colors.white} />}
                  />
                </View>
              </View>
            </AppCard>

            {/* Info Mekanisme 3 Digit Kode Unik */}
            <AppCard style={{ backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }}>
              <View style={styles.cardHeaderRow}>
                <View style={[styles.cardIconBox, { backgroundColor: '#DCFCE7' }]}>
                  <CheckCircle2 size={18} color="#16A34A" />
                </View>
                <View style={styles.cardHeaderTextCol}>
                  <Text style={[styles.cardTitle, { color: '#166534' }]}>Mekanisme 3 Digit Kode Unik Warga</Text>
                  <Text style={[styles.cardSubtitle, { color: '#15803D' }]}>
                    Setiap warga memiliki kode unik tersendiri (contoh: 101, 102, 103). Saat transfer iuran Rp 120.000 dengan kode 101, total menjadi Rp 120.101.
                  </Text>
                </View>
              </View>
              <Text style={{ fontSize: 12, color: '#166534', lineHeight: 18, marginTop: 8 }}>
                Sistem Moota akan mendeteksi mutasi transfer masuk sebesar <Text style={{ fontWeight: '800' }}>Rp 120.101</Text> dan langsung melunasi tagihan warga tersebut secara otomatis tanpa perlu verifikasi manual pengurus!
              </Text>
            </AppCard>
          </View>
        )}

        {/* ============================================================== */}
        {/* VIEW 2: ADMIN - TAB 5: DATABASE & RESET                         */}
        {/* ============================================================== */}
        {!isWarga && adminTab === 'system' && isAdmin && (
          <View>
            <AppCard>
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardIconBox}>
                  <Database size={18} color={isSupabaseConfigured ? colors.success : colors.warning} />
                </View>
                <View style={styles.cardHeaderTextCol}>
                  <Text style={styles.cardTitle}>
                    {isSupabaseConfigured ? 'Database Cloud Terhubung' : 'Mode Lokal (Offline Storage)'}
                  </Text>
                  <Text style={styles.cardSubtitle}>
                    {isSupabaseConfigured
                      ? 'Tersinkronisasi otomatis dengan backend Supabase.'
                      : 'Data tersimpan di penyimpanan lokal HP.'}
                  </Text>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Project URL Supabase</Text>
                <TextInput
                  style={styles.input}
                  value={supabaseUrl}
                  onChangeText={setSupabaseUrl}
                  placeholder="https://xyz.supabase.co"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Anon Public Key</Text>
                <TextInput
                  style={[styles.input, { height: 60, textAlignVertical: 'top' }]}
                  value={supabaseKey}
                  onChangeText={setSupabaseKey}
                  placeholder="eyJhbGciOi..."
                  placeholderTextColor={colors.textMuted}
                  multiline
                  autoCapitalize="none"
                />
              </View>

              <AppButton
                title="Simpan Kredensial Database"
                onPress={handleSimpanDatabase}
                loading={savingAdmin}
                icon={<Save size={16} color={colors.white} />}
                style={{ marginTop: spacing.md }}
              />
            </AppCard>

            {/* Danger Zone */}
            <AppCard style={{ borderColor: '#FECDCA' }}>
              <View style={styles.cardHeaderRow}>
                <View style={[styles.cardIconBox, { backgroundColor: colors.dangerBg }]}>
                  <RotateCcw size={18} color={colors.danger} />
                </View>
                <View style={styles.cardHeaderTextCol}>
                  <Text style={[styles.cardTitle, { color: colors.danger }]}>Zona Reset Demo Data</Text>
                  <Text style={styles.cardSubtitle}>Kembalikan semua data warga, tagihan, dan kas ke setelan awal</Text>
                </View>
              </View>

              <AppButton
                title="Reset Data ke Setelan Demo Awal"
                onPress={handleResetSeluruhData}
                variant="danger"
                icon={<RotateCcw size={16} color={colors.white} />}
                style={{ marginTop: spacing.md }}
              />
            </AppCard>
          </View>
        )}

        {/* ============================================================== */}
        {/* VIEW: ADMIN - TAB PUSH NOTIFIKASI & LARAVEL API INTEGRATION     */}
        {/* ============================================================== */}
        {!isWarga && adminTab === 'push' && (
          <View style={{ gap: spacing.md }}>
            <AppCard>
              <View style={styles.cardHeaderRow}>
                <View style={[styles.cardIconBox, { backgroundColor: '#ECFDF5' }]}>
                  <Bell size={20} color="#059669" />
                </View>
                <View style={styles.cardHeaderTextCol}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={styles.cardTitle}>Push Notifikasi Expo & Backend</Text>
                    <View style={[styles.serverStatusPill, { backgroundColor: expoPushToken ? '#DCFCE7' : '#FEF3C7' }]}>
                      <Text style={[styles.serverStatusPillText, { color: expoPushToken ? '#166534' : '#B45309' }]}>
                        {expoPushToken ? 'TERDAFTAR 🟢' : 'BELUM AKTIF 🟡'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.cardSubtitle}>
                    Kirim notifikasi tagihan baru, bukti bayar, dan surat ke HP warga via Expo Push Service
                  </Text>
                </View>
              </View>

              {/* Status Izin Notifikasi */}
              <View style={[styles.infoRow, { borderBottomWidth: 1, borderColor: colors.border, paddingBottom: 12, marginBottom: 12 }]}>
                <Text style={styles.infoLabel}>Izin Notifikasi HP:</Text>
                <Text style={{ fontWeight: '700', color: notificationPermissionStatus === 'granted' ? colors.success : colors.warning }}>
                  {notificationPermissionStatus === 'granted' ? 'Diizinkan (Granted) ✅' : 'Menunggu Izin / Cek Pengaturan HP'}
                </Text>
              </View>

              {/* Expo Push Token */}
              <View style={styles.formGroup}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <Text style={styles.label}>Expo Push Token Perangkat Ini</Text>
                  {expoPushToken ? (
                    <TouchableOpacity onPress={handleCopyPushToken} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Copy size={13} color={colors.primary} />
                      <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary }}>Salin Token</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
                <TextInput
                  style={[styles.input, { height: 60, textAlignVertical: 'top', backgroundColor: '#F8FAFC' }]}
                  value={expoPushToken || 'Belum ada token. Ketuk "Daftar Ulang Perangkat" di bawah untuk meminta izin.'}
                  editable={false}
                  multiline
                />
              </View>

              {/* URL Backend Laravel API */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>URL Backend Laravel API</Text>
                <Text style={{ fontSize: 11, color: colors.textMuted, marginBottom: 6 }}>
                  Gunakan IP laptop/PC lokal (contoh: http://192.168.1.5:8000) atau 10.0.2.2 untuk Android Emulator
                </Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    value={customApiUrlInput}
                    onChangeText={setCustomApiUrlInput}
                    placeholder="http://10.0.2.2:8000"
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="none"
                  />
                  <AppButton
                    title={savingApiUrl ? '...' : 'Simpan'}
                    onPress={handleSaveApiUrl}
                    loading={savingApiUrl}
                    style={{ paddingHorizontal: 16 }}
                  />
                </View>
              </View>

              {/* Action Buttons */}
              <View style={{ flexDirection: 'row', gap: 10, marginTop: spacing.md }}>
                <View style={{ flex: 1 }}>
                  <AppButton
                    title={testingPush ? 'Mengirim...' : 'Uji Push Notifikasi'}
                    onPress={handleTestPush}
                    loading={testingPush}
                    icon={<Send size={16} color={colors.white} />}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <AppButton
                    title={refreshingToken ? 'Mendaftarkan...' : 'Daftar Ulang'}
                    variant="secondary"
                    onPress={handleRefreshPushToken}
                    loading={refreshingToken}
                    icon={<RotateCcw size={16} color={colors.primary} />}
                  />
                </View>
              </View>
            </AppCard>

            {/* KARTU PANDUAN PENGIRIMAN DARI BACKEND */}
            <AppCard style={{ backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <CheckCircle2 size={18} color="#166534" />
                <Text style={{ fontWeight: '800', color: '#166534', fontSize: 14 }}>Integrasi Backend Laravel Siap</Text>
              </View>
              <Text style={{ fontSize: 12, color: '#166534', lineHeight: 18 }}>
                Backend Laravel API telah dilengkapi service pengiriman Expo Push (`ExpoPushService`) dan endpoint token (`/api/device-tokens`). Saat tagihan diterbitkan atau pembayaran disetujui di Laravel, notifikasi langsung dikirimkan ke perangkat HP warga terkait secara otomatis!
              </Text>
            </AppCard>
          </View>
        )}
      </ScrollView>

      {/* MODAL TAMBAH POS IURAN */}
      <AppModal
        visible={modalAddIuran}
        onClose={() => setModalAddIuran(false)}
        title="Tambah Pos Iuran Baru"
        subtitle="Buat pos tagihan baru untuk iuran warga"
        primaryActionLabel="Simpan Pos"
        onPrimaryAction={handleTambahPosIuran}
      >
        <View style={styles.formGroup}>
          <Text style={styles.label}>Nama Pos Iuran *</Text>
          <TextInput
            style={styles.input}
            value={newNamaIuran}
            onChangeText={setNamaIuran => setNewNamaIuran(setNamaIuran)}
            placeholder="Contoh: Iuran Kebersihan"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Nominal per Bulan (Rp) *</Text>
          <TextInput
            style={styles.input}
            value={newNominalIuran}
            onChangeText={setNominal => setNewNominalIuran(setNominal)}
            placeholder="35000"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Keterangan Pos (Opsional)</Text>
          <TextInput
            style={styles.input}
            value={newKetIuran}
            onChangeText={setKet => setNewKetIuran(setKet)}
            placeholder="Pengangkutan sampah 3x seminggu"
            placeholderTextColor={colors.textMuted}
          />
        </View>
      </AppModal>

      {/* MODAL 1: TAMBAH REKENING BANK */}
      <AppModal
        visible={modalAddBank}
        onClose={() => setModalAddBank(false)}
        title="Tambah Rekening Bank Baru"
        subtitle="Daftarkan rekening penerima transfer warga"
        primaryActionLabel="Simpan Rekening"
        onPrimaryAction={handleTambahBank}
      >
        <View style={styles.formGroup}>
          <Text style={styles.label}>Kepemilikan Kas</Text>
          <View style={styles.scopeSwitchRow}>
            {['RT', 'RW'].map((t) => (
              <TouchableOpacity
                key={t}
                onPress={() => setNewBankOwnerType(t)}
                style={[styles.scopeSwitchBtn, newBankOwnerType === t && styles.scopeSwitchBtnActive]}
              >
                <Text style={[styles.scopeSwitchText, newBankOwnerType === t && styles.scopeSwitchTextActive]}>
                  {t === 'RW' ? 'Kas RW 15' : 'Kas RT'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {newBankOwnerType === 'RT' && (
          <View style={styles.formGroup}>
            <Text style={styles.label}>Pilih RT</Text>
            <View style={styles.rtPickerRow}>
              {(rts || []).map((r) => (
                <TouchableOpacity
                  key={r.id}
                  onPress={() => setNewBankRtId(r.id)}
                  style={[styles.rtPickerChip, newBankRtId === r.id && styles.rtPickerChipActive]}
                >
                  <Text style={[styles.rtPickerText, newBankRtId === r.id && styles.rtPickerTextActive]}>
                    {r.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={styles.formGroup}>
          <Text style={styles.label}>Nama Bank *</Text>
          <TextInput
            style={styles.input}
            value={newBankName}
            onChangeText={setNewBankName}
            placeholder="Contoh: BCA / Mandiri / BRI / BSI"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Nomor Rekening *</Text>
          <TextInput
            style={styles.input}
            value={newAccNumber}
            onChangeText={setNewAccNumber}
            placeholder="8730192831"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Nama Pemilik Rekening (a.n) *</Text>
          <TextInput
            style={styles.input}
            value={newAccHolder}
            onChangeText={setNewAccHolder}
            placeholder="Kas RT 01 / Siti Aminah"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        <TouchableOpacity
          onPress={() => setNewIsPrimaryBank(!newIsPrimaryBank)}
          style={styles.checkboxRow}
          activeOpacity={0.8}
        >
          <View style={[styles.checkboxBox, newIsPrimaryBank && styles.checkboxBoxActive]}>
            {newIsPrimaryBank ? <CheckCircle2 size={14} color={colors.white} /> : null}
          </View>
          <Text style={styles.checkboxLabel}>Jadikan rekening utama wilayah ini</Text>
        </TouchableOpacity>
      </AppModal>

      {/* MODAL 2: EDIT REKENING BANK */}
      <AppModal
        visible={modalEditBank}
        onClose={() => {
          setModalEditBank(false)
          setEditingBank(null)
        }}
        title="Edit Rekening Bank"
        subtitle="Ubah informasi rekening penerima transfer"
        primaryActionLabel="Simpan Perubahan"
        onPrimaryAction={handleSimpanEditBank}
      >
        <View style={styles.formGroup}>
          <Text style={styles.label}>Kepemilikan Kas</Text>
          <View style={styles.scopeSwitchRow}>
            {['RT', 'RW'].map((t) => (
              <TouchableOpacity
                key={t}
                onPress={() => setEditBankOwnerType(t)}
                style={[styles.scopeSwitchBtn, editBankOwnerType === t && styles.scopeSwitchBtnActive]}
              >
                <Text style={[styles.scopeSwitchText, editBankOwnerType === t && styles.scopeSwitchTextActive]}>
                  {t === 'RW' ? 'Kas RW 15' : 'Kas RT'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {editBankOwnerType === 'RT' && (
          <View style={styles.formGroup}>
            <Text style={styles.label}>Pilih RT</Text>
            <View style={styles.rtPickerRow}>
              {(rts || []).map((r) => (
                <TouchableOpacity
                  key={r.id}
                  onPress={() => setEditBankRtId(r.id)}
                  style={[styles.rtPickerChip, editBankRtId === r.id && styles.rtPickerChipActive]}
                >
                  <Text style={[styles.rtPickerText, editBankRtId === r.id && styles.rtPickerTextActive]}>
                    {r.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={styles.formGroup}>
          <Text style={styles.label}>Nama Bank *</Text>
          <TextInput
            style={styles.input}
            value={editBankName}
            onChangeText={setEditBankName}
            placeholder="Contoh: BCA / Mandiri / BRI"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Nomor Rekening *</Text>
          <TextInput
            style={styles.input}
            value={editAccNumber}
            onChangeText={setEditAccNumber}
            placeholder="8730192831"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Nama Pemilik Rekening (a.n) *</Text>
          <TextInput
            style={styles.input}
            value={editAccHolder}
            onChangeText={setEditAccHolder}
            placeholder="Kas RT 01 / Siti Aminah"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        <TouchableOpacity
          onPress={() => setEditIsPrimaryBank(!editIsPrimaryBank)}
          style={styles.checkboxRow}
          activeOpacity={0.8}
        >
          <View style={[styles.checkboxBox, editIsPrimaryBank && styles.checkboxBoxActive]}>
            {editIsPrimaryBank ? <CheckCircle2 size={14} color={colors.white} /> : null}
          </View>
          <Text style={styles.checkboxLabel}>Jadikan rekening utama wilayah ini</Text>
        </TouchableOpacity>
      </AppModal>

      {/* MODAL 3: TAMBAH QRIS */}
      <AppModal
        visible={modalAddQris}
        onClose={() => setModalAddQris(false)}
        title="Tambah Akun QRIS Baru"
        subtitle="Daftarkan barcode QRIS kas RT atau RW"
        primaryActionLabel="Simpan QRIS"
        onPrimaryAction={handleTambahQris}
      >
        <View style={styles.formGroup}>
          <Text style={styles.label}>Kepemilikan Kas</Text>
          <View style={styles.scopeSwitchRow}>
            {['RT', 'RW'].map((t) => (
              <TouchableOpacity
                key={t}
                onPress={() => setNewQrisOwnerType(t)}
                style={[styles.scopeSwitchBtn, newQrisOwnerType === t && styles.scopeSwitchBtnActive]}
              >
                <Text style={[styles.scopeSwitchText, newQrisOwnerType === t && styles.scopeSwitchTextActive]}>
                  {t === 'RW' ? 'Kas RW 15' : 'Kas RT'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {newQrisOwnerType === 'RT' && (
          <View style={styles.formGroup}>
            <Text style={styles.label}>Pilih RT</Text>
            <View style={styles.rtPickerRow}>
              {(rts || []).map((r) => (
                <TouchableOpacity
                  key={r.id}
                  onPress={() => setNewQrisRtId(r.id)}
                  style={[styles.rtPickerChip, newQrisRtId === r.id && styles.rtPickerChipActive]}
                >
                  <Text style={[styles.rtPickerText, newQrisRtId === r.id && styles.rtPickerTextActive]}>
                    {r.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={styles.formGroup}>
          <Text style={styles.label}>Nama / Label QRIS *</Text>
          <TextInput
            style={styles.input}
            value={newQrisName}
            onChangeText={setNewQrisName}
            placeholder="Contoh: QRIS Kas RT 01 / QRIS RW 15"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>NMID (Opsional)</Text>
          <TextInput
            style={styles.input}
            value={newQrisNmid}
            onChangeText={setNewQrisNmid}
            placeholder="ID1020001234567"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        {/* Upload Foto Barcode QRIS */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Foto Barcode QRIS</Text>
          {newQrisImageUrl ? (
            <View style={styles.qrisUploadPreviewBox}>
              <Image source={{ uri: newQrisImageUrl }} style={styles.qrisUploadPreviewImg} resizeMode="contain" />
              <View style={styles.qrisUploadPreviewActions}>
                <Text style={styles.qrisUploadPreviewTitle}>Foto Barcode Terpasang ✓</Text>
                <View style={styles.qrisUploadBtnGroup}>
                  <TouchableOpacity
                    onPress={() => handleOpenImagePicker('add')}
                    style={styles.qrisChangePhotoBtn}
                    activeOpacity={0.8}
                  >
                    <RefreshCw size={12} color={colors.primary} />
                    <Text style={styles.qrisChangePhotoText}>Ganti Foto</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setNewQrisImageUrl('')}
                    style={styles.qrisDeletePhotoBtn}
                    activeOpacity={0.8}
                  >
                    <X size={12} color={colors.danger} />
                    <Text style={styles.qrisDeletePhotoText}>Hapus</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => handleOpenImagePicker('add')}
              style={styles.qrisUploadDashedBox}
              activeOpacity={0.8}
            >
              <View style={styles.qrisUploadIconCircle}>
                <Camera size={20} color={colors.primary} />
              </View>
              <Text style={styles.qrisUploadDashedTitle}>Upload Foto Barcode QRIS</Text>
              <Text style={styles.qrisUploadDashedSubtitle}>Ambil foto kamera atau pilih dari galeri HP</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          onPress={() => setNewIsPrimaryQris(!newIsPrimaryQris)}
          style={styles.checkboxRow}
          activeOpacity={0.8}
        >
          <View style={[styles.checkboxBox, newIsPrimaryQris && styles.checkboxBoxActive]}>
            {newIsPrimaryQris ? <CheckCircle2 size={14} color={colors.white} /> : null}
          </View>
          <Text style={styles.checkboxLabel}>Jadikan QRIS utama wilayah ini</Text>
        </TouchableOpacity>
      </AppModal>

      {/* MODAL 4: EDIT QRIS */}
      <AppModal
        visible={modalEditQris}
        onClose={() => {
          setModalEditQris(false)
          setEditingQris(null)
        }}
        title="Edit Akun QRIS"
        subtitle="Ubah barcode dan informasi akun QRIS"
        primaryActionLabel="Simpan Perubahan"
        onPrimaryAction={handleSimpanEditQris}
      >
        <View style={styles.formGroup}>
          <Text style={styles.label}>Kepemilikan Kas</Text>
          <View style={styles.scopeSwitchRow}>
            {['RT', 'RW'].map((t) => (
              <TouchableOpacity
                key={t}
                onPress={() => setEditQrisOwnerType(t)}
                style={[styles.scopeSwitchBtn, editQrisOwnerType === t && styles.scopeSwitchBtnActive]}
              >
                <Text style={[styles.scopeSwitchText, editQrisOwnerType === t && styles.scopeSwitchTextActive]}>
                  {t === 'RW' ? 'Kas RW 15' : 'Kas RT'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {editQrisOwnerType === 'RT' && (
          <View style={styles.formGroup}>
            <Text style={styles.label}>Pilih RT</Text>
            <View style={styles.rtPickerRow}>
              {(rts || []).map((r) => (
                <TouchableOpacity
                  key={r.id}
                  onPress={() => setEditQrisRtId(r.id)}
                  style={[styles.rtPickerChip, editQrisRtId === r.id && styles.rtPickerChipActive]}
                >
                  <Text style={[styles.rtPickerText, editQrisRtId === r.id && styles.rtPickerTextActive]}>
                    {r.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={styles.formGroup}>
          <Text style={styles.label}>Nama / Label QRIS *</Text>
          <TextInput
            style={styles.input}
            value={editQrisName}
            onChangeText={setEditQrisName}
            placeholder="Contoh: QRIS Kas RT 01"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>NMID (Opsional)</Text>
          <TextInput
            style={styles.input}
            value={editQrisNmid}
            onChangeText={setEditQrisNmid}
            placeholder="ID1020001234567"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        {/* Upload/Ganti Foto Barcode QRIS di Edit Modal */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Foto Barcode QRIS</Text>
          {editQrisImageUrl ? (
            <View style={styles.qrisUploadPreviewBox}>
              <Image source={{ uri: editQrisImageUrl }} style={styles.qrisUploadPreviewImg} resizeMode="contain" />
              <View style={styles.qrisUploadPreviewActions}>
                <Text style={styles.qrisUploadPreviewTitle}>Foto Barcode Terpasang ✓</Text>
                <View style={styles.qrisUploadBtnGroup}>
                  <TouchableOpacity
                    onPress={() => handleOpenImagePicker('edit')}
                    style={styles.qrisChangePhotoBtn}
                    activeOpacity={0.8}
                  >
                    <RefreshCw size={12} color={colors.primary} />
                    <Text style={styles.qrisChangePhotoText}>Ganti Foto</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setEditQrisImageUrl('')}
                    style={styles.qrisDeletePhotoBtn}
                    activeOpacity={0.8}
                  >
                    <X size={12} color={colors.danger} />
                    <Text style={styles.qrisDeletePhotoText}>Hapus</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => handleOpenImagePicker('edit')}
              style={styles.qrisUploadDashedBox}
              activeOpacity={0.8}
            >
              <View style={styles.qrisUploadIconCircle}>
                <Camera size={20} color={colors.primary} />
              </View>
              <Text style={styles.qrisUploadDashedTitle}>Upload Foto Barcode QRIS</Text>
              <Text style={styles.qrisUploadDashedSubtitle}>Ambil foto kamera atau pilih dari galeri HP</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          onPress={() => setEditIsPrimaryQris(!editIsPrimaryQris)}
          style={styles.checkboxRow}
          activeOpacity={0.8}
        >
          <View style={[styles.checkboxBox, editIsPrimaryQris && styles.checkboxBoxActive]}>
            {editIsPrimaryQris ? <CheckCircle2 size={14} color={colors.white} /> : null}
          </View>
          <Text style={styles.checkboxLabel}>Jadikan QRIS utama wilayah ini</Text>
        </TouchableOpacity>
      </AppModal>

      {/* MODAL 5: PILIHAN SUMBER FOTO (KAMERA / GALERI) */}
      <AppModal
        visible={modalPickQrisImage}
        onClose={() => setModalPickQrisImage(false)}
        title="Pilih Sumber Foto Barcode"
        subtitle="Ambil foto barcode langsung atau pilih dari galeri"
      >
        <View style={styles.pickerModalContent}>
          <TouchableOpacity
            style={styles.pickerChoiceCard}
            onPress={handleTakePhoto}
            activeOpacity={0.8}
          >
            <View style={[styles.pickerChoiceIcon, { backgroundColor: '#E0F2FE' }]}>
              <Camera size={22} color="#0284C7" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.pickerChoiceTitle}>Ambil Foto Kamera</Text>
              <Text style={styles.pickerChoiceDesc}>Foto langsung barcode QRIS fisik</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.pickerChoiceCard}
            onPress={handlePickFromGallery}
            activeOpacity={0.8}
          >
            <View style={[styles.pickerChoiceIcon, { backgroundColor: '#ECFDF5' }]}>
              <ImageIcon size={22} color="#059669" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.pickerChoiceTitle}>Pilih dari Galeri Foto</Text>
              <Text style={styles.pickerChoiceDesc}>Pilih gambar QRIS yang tersimpan di HP</Text>
            </View>
          </TouchableOpacity>
        </View>
      </AppModal>

      {/* MODAL 6: ZOOM PREVIEW BARCODE QRIS */}
      <AppModal
        visible={modalPreviewQris}
        onClose={() => {
          setModalPreviewQris(false)
          setPreviewQrisData(null)
        }}
        title={previewQrisData?.qris_name || 'Barcode QRIS'}
        subtitle={previewQrisData?.owner_type === 'RW' ? 'Kas RW 15' : 'Kas RT'}
        primaryActionLabel="Tutup"
        onPrimaryAction={() => {
          setModalPreviewQris(false)
          setPreviewQrisData(null)
        }}
      >
        {previewQrisData ? (
          <View style={styles.zoomModalWrap}>
            <View style={styles.zoomCard}>
              <Image
                source={{
                  uri:
                    previewQrisData.image_url ||
                    `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=QRIS_${encodeURIComponent(previewQrisData.qris_name)}`
                }}
                style={styles.zoomLargeImage}
                resizeMode="contain"
              />
              <Text style={styles.zoomQrisName}>{previewQrisData.qris_name}</Text>
              {previewQrisData.nmid ? (
                <Text style={styles.zoomNmidText}>NMID: {previewQrisData.nmid}</Text>
              ) : null}
              <View style={styles.zoomBadgeRow}>
                <Text style={styles.zoomBadgeText}>✓ Siap Scan via m-Banking / E-Wallet</Text>
              </View>
            </View>
          </View>
        ) : null}
      </AppModal>

      {/* MODAL 7: TAMBAH WILAYAH RT BARU */}
      <AppModal
        visible={modalAddRt}
        onClose={() => setModalAddRt(false)}
        title="Tambah Wilayah RT Baru"
        subtitle="Daftarkan RT baru ke dalam sistem lingkungan"
        primaryActionLabel="Tambahkan RT"
        onPrimaryAction={handleTambahRt}
      >
        <View style={styles.rowTwoCols}>
          <View style={[styles.formGroup, { flex: 1, marginRight: spacing.sm }]}>
            <Text style={styles.label}>Nomor RT *</Text>
            <TextInput
              style={styles.input}
              value={newRtNumber}
              onChangeText={(val) => {
                setNewRtNumber(val)
                if (!newRtName || newRtName.startsWith('RT ')) {
                  setNewRtName(val ? `RT ${val.padStart(2, '0')}` : '')
                }
              }}
              placeholder="04"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
            />
          </View>
          <View style={[styles.formGroup, { flex: 1, marginLeft: spacing.sm }]}>
            <Text style={styles.label}>Nama RT *</Text>
            <TextInput
              style={styles.input}
              value={newRtName}
              onChangeText={setNewRtName}
              placeholder="RT 04"
              placeholderTextColor={colors.textMuted}
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Nama Ketua RT</Text>
          <TextInput
            style={styles.input}
            value={newRtKetua}
            onChangeText={setNewRtKetua}
            placeholder="Contoh: Bpk. Bambang"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Nama Bendahara RT</Text>
          <TextInput
            style={styles.input}
            value={newRtBendahara}
            onChangeText={setNewRtBendahara}
            placeholder="Contoh: Ibu Endang (Tanda tangan kwitansi)"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Nomor WhatsApp Pengurus</Text>
          <TextInput
            style={styles.input}
            value={newRtKontak}
            onChangeText={setNewRtKontak}
            placeholder="081234567890"
            placeholderTextColor={colors.textMuted}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Info Rekening Kas RT</Text>
          <TextInput
            style={styles.input}
            value={newRtRekening}
            onChangeText={setNewRtRekening}
            placeholder="BCA 12345678 a.n Kas RT 04"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Nama Pos Balai / Pos Ronda RT</Text>
          <TextInput
            style={styles.input}
            value={newRtLokasi}
            onChangeText={setNewRtLokasi}
            placeholder="Contoh: Pos Balai Warga RT 04"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        <View style={styles.rowTwoCols}>
          <View style={[styles.formGroup, { flex: 1, marginRight: spacing.sm }]}>
            <Text style={styles.label}>Latitude GIS</Text>
            <TextInput
              style={styles.input}
              value={newRtLat}
              onChangeText={setNewRtLat}
              placeholder="-6.59835"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
            />
          </View>
          <View style={[styles.formGroup, { flex: 1, marginLeft: spacing.sm }]}>
            <Text style={styles.label}>Longitude GIS</Text>
            <TextInput
              style={styles.input}
              value={newRtLng}
              onChangeText={setNewRtLng}
              placeholder="106.76565"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Keterangan Wilayah / Blok</Text>
          <TextInput
            style={styles.input}
            value={newRtKeterangan}
            onChangeText={setNewRtKeterangan}
            placeholder="Contoh: Mencakup Blok D dan Blok E"
            placeholderTextColor={colors.textMuted}
          />
        </View>
      </AppModal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  tabBarWrap: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.xs
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 160 // Generous safe area so floating bottom bar never covers content
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm
  },
  cardIconBox: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center'
  },
  cardHeaderTextCol: {
    flex: 1
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary
  },
  cardSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2
  },
  formGroup: {
    marginBottom: spacing.md
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 6
  },
  input: {
    height: 46,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    fontSize: 14,
    color: colors.textPrimary
  },
  rowTwoCols: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  itemsList: {
    gap: spacing.sm
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderLight
  },
  itemName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary
  },
  itemNominal: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
    marginTop: 2
  },
  itemDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2
  },
  itemActionCol: {
    alignItems: 'flex-end'
  },
  scopeFilterWrap: {
    marginBottom: spacing.md
  },
  scopeChipsContainer: {
    flexDirection: 'row',
    gap: spacing.sm
  },
  scopeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border
  },
  scopeChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  scopeChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary
  },
  scopeChipTextActive: {
    color: colors.white,
    fontWeight: '700'
  },
  accountList: {
    gap: spacing.sm
  },
  accountCardItem: {
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border
  },
  accountCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs
  },
  primaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
    backgroundColor: colors.warningBg
  },
  primaryBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B54708'
  },
  setPrimaryLink: {
    paddingHorizontal: 4,
    paddingVertical: 2
  },
  setPrimaryLinkText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary
  },
  accountBody: {
    marginVertical: 4
  },
  bankNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary
  },
  accountNumberText: {
    fontSize: 15,
    fontWeight: '800',
    fontFamily: 'monospace',
    color: colors.textPrimary,
    marginTop: 2
  },
  accountHolderText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2
  },
  accountActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: spacing.xs,
    marginTop: spacing.xs
  },
  editActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: radius.xs,
    backgroundColor: colors.primaryLight
  },
  editActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary
  },
  viewActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: radius.xs,
    backgroundColor: '#E0F2FE'
  },
  viewActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7'
  },
  deleteActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: radius.xs,
    backgroundColor: colors.dangerBg
  },
  deleteActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.danger
  },
  qrisPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginVertical: spacing.xs,
    backgroundColor: colors.surface,
    padding: spacing.xs,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderLight
  },
  qrisThumbWrapper: {
    position: 'relative'
  },
  qrisThumbnail: {
    width: 60,
    height: 60,
    borderRadius: radius.sm,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border
  },
  zoomBadgeIcon: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 10,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center'
  },
  tapToZoomText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 2
  },
  qrisNmidText: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: colors.textSecondary
  },
  qrisReadyText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.success,
    marginTop: 2
  },
  // QRIS Image Upload Box Styles
  qrisUploadDashedBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center'
  },
  qrisUploadIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  qrisUploadDashedTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryDark
  },
  qrisUploadDashedSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2
  },
  qrisUploadPreviewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border
  },
  qrisUploadPreviewImg: {
    width: 64,
    height: 64,
    borderRadius: radius.sm,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border
  },
  qrisUploadPreviewActions: {
    flex: 1
  },
  qrisUploadPreviewTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.success,
    marginBottom: 6
  },
  qrisUploadBtnGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs
  },
  qrisChangePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radius.xs,
    backgroundColor: colors.primaryLight
  },
  qrisChangePhotoText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary
  },
  qrisDeletePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radius.xs,
    backgroundColor: colors.dangerBg
  },
  qrisDeletePhotoText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.danger
  },
  // Picker choice modal
  pickerModalContent: {
    gap: spacing.sm,
    paddingVertical: spacing.xs
  },
  pickerChoiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border
  },
  pickerChoiceIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center'
  },
  pickerChoiceTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary
  },
  pickerChoiceDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2
  },
  // Zoom Modal
  zoomModalWrap: {
    alignItems: 'center',
    paddingVertical: spacing.sm
  },
  zoomCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    width: '100%'
  },
  zoomLargeImage: {
    width: 240,
    height: 240,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    marginBottom: spacing.md
  },
  zoomQrisName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center'
  },
  zoomNmidText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: colors.textSecondary,
    marginTop: 4
  },
  zoomBadgeRow: {
    marginTop: spacing.md,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: radius.full,
    backgroundColor: colors.successLight
  },
  zoomBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.successDark
  },
  rtSelectorContainer: {
    marginBottom: spacing.md
  },
  rtSelectorScroll: {
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'center'
  },
  rtSelectChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center'
  },
  rtSelectChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  rtSelectChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary
  },
  rtSelectChipTextActive: {
    color: colors.white,
    fontWeight: '700'
  },
  addRtChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0'
  },
  addRtChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary
  },
  rtActionButtonsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    marginTop: spacing.md
  },
  deleteRtBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderRadius: radius.md,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA'
  },
  deleteRtBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.danger,
    marginLeft: 4
  },
  scopeSwitchRow: {
    flexDirection: 'row',
    gap: spacing.sm
  },
  scopeSwitchBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center'
  },
  scopeSwitchBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  scopeSwitchText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary
  },
  scopeSwitchTextActive: {
    color: colors.white,
    fontWeight: '700'
  },
  rtPickerRow: {
    flexDirection: 'row',
    gap: spacing.xs
  },
  rtPickerChip: {
    flex: 1,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center'
  },
  rtPickerChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  rtPickerText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary
  },
  rtPickerTextActive: {
    color: colors.white,
    fontWeight: '700'
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: spacing.sm
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface
  },
  checkboxBoxActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  checkboxLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary
  },
  viewOnMapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: '#99F6E4',
    marginBottom: spacing.md
  },
  viewOnMapBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryDark
  },
  schedulerMonitorCard: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg
  },
  serverStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3
  },
  serverStatusPillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  schedulerGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginVertical: spacing.md
  },
  schedulerGridItem: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: spacing.md
  },
  schedulerItemHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6
  },
  schedulerItemLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B'
  },
  schedulerItemValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 2
  },
  schedulerItemSub: {
    fontSize: 11,
    color: '#94A3B8'
  },
  heartbeatBanner: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md
  },
  heartbeatLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm
  },
  heartbeatTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
    marginBottom: 2
  },
  heartbeatDesc: {
    fontSize: 11,
    color: '#166534',
    lineHeight: 16
  },
  testSyncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: spacing.md
  },
  testSyncBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF'
  },
  schedulerFormCard: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: radius.lg
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: spacing.md
  },
  toggleTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B'
  },
  toggleDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 16
  },
  inputSection: {
    marginBottom: spacing.md
  },
  inputSectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B'
  },
  inputSectionSub: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: spacing.sm
  },
  presetChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm
  },
  presetChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  presetChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  presetChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569'
  },
  presetChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700'
  },
  numberInput: {
    height: 44,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    backgroundColor: '#F8FAFC'
  },
  infoNoteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
    borderRadius: radius.md,
    padding: spacing.sm,
    marginTop: spacing.xs
  },
  infoNoteText: {
    flex: 1,
    fontSize: 11,
    color: '#6B21A8',
    lineHeight: 16
  },
  scopeButtonsRow: {
    flexDirection: 'row',
    gap: spacing.xs
  },
  scopeBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    borderRadius: radius.md,
    padding: spacing.sm
  },
  scopeBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight
  },
  scopeBtnTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155'
  },
  scopeBtnTitleActive: {
    color: colors.primaryDark
  },
  scopeBtnDesc: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2
  },
  scopeBtnDescActive: {
    color: colors.primaryDark
  },
  summaryRuleBox: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.xs
  },
  summaryRuleTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E40AF',
    marginBottom: 4
  },
  summaryRuleDesc: {
    fontSize: 11,
    color: '#1E3A8A',
    lineHeight: 16
  },
  securityProtocolCard: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: radius.lg
  },
  securityItemsList: {
    gap: spacing.sm,
    marginTop: spacing.sm
  },
  securityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.xs
  },
  securityItemTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2
  },
  securityItemDesc: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16
  }
})
