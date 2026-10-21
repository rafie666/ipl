import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Modal,
  Alert,
  Linking,
  ScrollView,
  Platform,
  ActivityIndicator
} from 'react-native'
import {
  Receipt,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  Plus,
  Calendar,
  X,
  CreditCard,
  MessageCircle,
  Send,
  Trash2,
  RotateCcw,
  Building2,
  Users,
  Check,
  CheckSquare,
  Square,
  CheckCheck,
  Trash,
  Layers,
  ShieldCheck,
  Sparkles,
  Home,
  ArrowRight,
  ChevronRight,
  Edit3,
  Sliders,
  DollarSign,
  CheckCircle,
  Zap
} from 'lucide-react-native'
import { useApp } from '../../context/AppContext'
import TopAppBar from '../../components/layout/TopAppBar'
import AppCard from '../../components/shared/AppCard'
import AppBadge from '../../components/shared/AppBadge'
import AppButton from '../../components/shared/AppButton'
import AppModal from '../../components/modals/AppModal'
import ReceiptModal from '../../components/modals/ReceiptModal'
import AppEmptyState from '../../components/shared/AppEmptyState'
import { fetchMootaMutations } from '../../services/mootaService'
import { colors, typography, spacing, radius, shadows } from '../../utils/theme'
import {
  generateWaReminder,
  generateWaKwitansi,
  formatRupiah,
  NAMA_BULAN,
  calculateTotalWithKodeUnik,
  getKodeUnikWarga,
  getAngkaKodeUnik
} from '../../utils/formatters'

export default function TagihanScreen({ navigation }) {
  const {
    currentUser,
    isWarga,
    isRT,
    isRW,
    isAdminLoggedIn,
    scopedTagihan,
    refreshData,
    refreshing,
    warga,
    scopedWarga,
    rts,
    config,
    generateTagihanMassal,
    addTagihanManual,
    updateTagihan,
    tambahTagihanBiasaMassal,
    batalBayarTagihan,
    deleteTagihan,
    deleteTagihanBulk,
    jenisIuran,
    addJenisIuran,
    updateJenisIuran,
    deleteJenisIuran,
    toggleJenisIuran,
    bayarTagihanOtomatisMoota
  } = useApp()

  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()
  const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1
  const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear

  const myRtObj = rts?.find((r) => r.id === (currentUser?.rt_id || 'rt-1')) || { name: 'RT 01' }
  const rtLabel = myRtObj.name || 'RT 01'

  const [scopeFilter, setScopeFilter] = useState('ALL') // 'ALL' | 'RT' | 'RW'
  const [activeFilter, setActiveFilter] = useState('Semua') // 'Semua' | 'Belum Bayar' | 'Menunggu' | 'Perlu Diperbaiki' | 'Lunas'
  const [searchQuery, setSearchQuery] = useState('')
  const [filterBulan, setFilterBulan] = useState(0) // 0 = semua bulan
  const [filterTahun, setFilterTahun] = useState(currentYear)
  const [showPeriodFilter, setShowPeriodFilter] = useState(false)
  const [mootaSyncing, setMootaSyncing] = useState(false)

  const handleSyncMutasiMoota = async () => {
    setMootaSyncing(true)
    try {
      const res = await fetchMootaMutations('CR', 50)
      if (res.success) {
        const mutations = res.data || []
        let autoSettled = 0
        const pendingTagihan = (scopedTagihan || []).filter((t) => t.status !== 'Lunas')

        for (const m of mutations) {
          const mutAmount = Math.round(Number(m.amount || m.nominal || 0))
          if (mutAmount <= 0) continue

          for (const t of pendingTagihan) {
            const tWarga = warga.find((w) => w.id === t.wargaId) || {}
            const exactNom = calculateTotalWithKodeUnik(t.total, tWarga)
            if (exactNom === mutAmount && t.status !== 'Lunas') {
              await bayarTagihanOtomatisMoota(t.id, m)
              t.status = 'Lunas'
              autoSettled++
            }
          }
        }

        if (autoSettled > 0) {
          Alert.alert(
            '🎉 Pelunasan Otomatis!',
            `${autoSettled} tagihan warga berhasil diverifikasi dan dilunasi otomatis dari mutasi transfer Moota Sandbox!`
          )
        } else {
          Alert.alert(
            'Mutasi Moota Terbaca',
            `Berhasil memeriksa ${mutations.length} mutasi di Moota Sandbox. Belum ada tagihan baru yang cocok atau semua tagihan sudah lunas.`
          )
        }
      } else {
        Alert.alert('Info Moota', res.message || 'Gagal membaca mutasi dari Moota.')
      }
    } catch (e) {
      Alert.alert('Error', e.message || 'Gagal sinkronisasi mutasi.')
    } finally {
      setMootaSyncing(false)
    }
  }

  // Selection Mode State (RT / RW Admin)
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])

  // State Modal Generate Tagihan Massal dari Master Pos
  const [modalGenOpen, setModalGenOpen] = useState(false)
  const [genBulan, setGenBulan] = useState(String(currentMonth))
  const [genTahun, setGenTahun] = useState(String(currentYear))
  const [genScope, setGenScope] = useState(isRT ? 'RT' : 'RW') // 'ALL' | 'RT' | 'RW'
  const [genRtId, setGenRtId] = useState(isRT ? (currentUser?.rt_id || 'rt-1') : 'ALL')
  const [genLoading, setGenLoading] = useState(false)
  const [selectedPosIds, setSelectedPosIds] = useState([]) // Array of selected pos IDs

  // State Modal Tagihan Biasa / Insidental (Bisa ke SEMUA warga atau 1 warga)
  const [modalBiasaOpen, setModalBiasaOpen] = useState(false)
  const [biasaNama, setBiasaNama] = useState('')
  const [biasaNominal, setBiasaNominal] = useState('')
  const [biasaBulan, setBiasaBulan] = useState(String(currentMonth))
  const [biasaTahun, setBiasaTahun] = useState(String(currentYear))
  const [biasaTarget, setBiasaTarget] = useState('SEMUA') // 'SEMUA' | 'PERSONAL'
  const [biasaScope, setBiasaScope] = useState(isRT ? 'RT' : 'RW')
  const [biasaCatatan, setBiasaCatatan] = useState('')
  const [biasaStatus, setBiasaStatus] = useState('Belum Bayar')
  const [biasaLoading, setBiasaLoading] = useState(false)

  // State Modal Edit Tagihan
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingTagihan, setEditingTagihan] = useState(null)
  const [editNamaPos, setEditNamaPos] = useState('')
  const [editNominal, setEditNominal] = useState('')
  const [editBulan, setEditBulan] = useState(String(currentMonth))
  const [editTahun, setEditTahun] = useState(String(currentYear))
  const [editStatus, setEditStatus] = useState('Belum Bayar')
  const [editCatatan, setEditCatatan] = useState('')
  const [editLoading, setEditLoading] = useState(false)

  // State Modal Kelola Master Pos Iuran
  const [modalMasterOpen, setModalMasterOpen] = useState(false)
  const [masterFormOpen, setMasterFormOpen] = useState(false)
  const [editingMasterPos, setEditingMasterPos] = useState(null)
  const [masterNama, setMasterNama] = useState('')
  const [masterNominal, setMasterNominal] = useState('')
  const [masterScope, setMasterScope] = useState(isRT ? 'RT' : 'RW')
  const [masterKeterangan, setMasterKeterangan] = useState('')

  // State Modal Tambah Tagihan Manual
  const [modalManualOpen, setModalManualOpen] = useState(false)
  const [manWargaSearch, setManWargaSearch] = useState('')
  const [selectedWargaId, setSelectedWargaId] = useState(scopedWarga?.[0]?.id || warga?.[0]?.id || '')
  const [manScope, setManScope] = useState(isRT ? 'RT' : 'RW')
  const [manPosNama, setManPosNama] = useState(isRT ? 'Iuran Pengelolaan Lingkungan (IPL)' : 'Iuran Pembangunan & Fasum RW')
  const [manBulan, setManBulan] = useState(String(currentMonth))
  const [manTahun, setManTahun] = useState(String(currentYear))
  const [manTotal, setManTotal] = useState(isRT ? '120000' : '40000')
  const [manStatus, setManStatus] = useState('Belum Bayar')
  const [manCatatan, setManCatatan] = useState('')

  // State Modal Options FAB
  const [actionMenuOpen, setActionMenuOpen] = useState(false)

  // State Modal Kwitansi Digital
  const [kwitansiModal, setKwitansiModal] = useState(null)

  const infoLingkungan = config?.namaLingkungan || 'Perumahan Alam Tirta Lestari RT 01 / RW 15'

  // Filter bills
  const filteredBills = scopedTagihan.filter((t) => {
    // Scope Filter (dari segmen tabs)
    if (scopeFilter === 'RT' && t.payment_scope === 'RW') return false
    if (scopeFilter === 'RW' && t.payment_scope !== 'RW') return false

    // Filter dari filter chip yang ada (Semua, Tagihan RT, Tagihan RW, dll)
    if (activeFilter === 'Tagihan RT' && t.payment_scope === 'RW') return false
    if (activeFilter === 'Tagihan RW' && t.payment_scope !== 'RW') return false

    // Status Filter
    const isUnpaid = t.status === 'Belum Lunas' || t.status === 'Belum Bayar'
    if (activeFilter === 'Belum Bayar' && !isUnpaid) return false
    if (activeFilter === 'Menunggu' && t.status !== 'Menunggu Verifikasi') return false
    if (activeFilter === 'Perlu Diperbaiki' && t.status !== 'Perlu Diperbaiki' && t.status !== 'Ditolak') return false
    if (activeFilter === 'Lunas' && t.status !== 'Lunas') return false

    // Period Filter
    if (filterBulan > 0 && Number(t.bulan) !== filterBulan) return false
    if (filterTahun > 0 && Number(t.tahun) !== filterTahun) return false

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const targetWarga = warga.find((w) => w.id === t.wargaId) || {}
      const matchName = (targetWarga.nama || t.namaWarga || '').toLowerCase().includes(q)
      const matchBlok = `${targetWarga.blok || t.blok || ''}/${targetWarga.noRumah || t.noRumah || ''}`.toLowerCase().includes(q)
      const matchScope = (t.pembayaran_kepada || '').toLowerCase().includes(q)
      return matchName || matchBlok || matchScope
    }
    return true
  })

  // Selection handlers
  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        const next = prev.filter((item) => item !== id)
        if (next.length === 0) setIsSelectionMode(false)
        return next
      } else {
        return [...prev, id]
      }
    })
  }

  const handleSelectAll = () => {
    const allIds = filteredBills.map((t) => t.id)
    if (selectedIds.length === allIds.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(allIds)
    }
  }

  const handleExitSelection = () => {
    setIsSelectionMode(false)
    setSelectedIds([])
  }

  const handleHapusTerpilih = () => {
    if (selectedIds.length === 0) {
      Alert.alert('Pilih Tagihan', 'Silakan pilih tagihan yang ingin dihapus terlebih dahulu.')
      return
    }

    Alert.alert(
      'Hapus Tagihan Terpilih',
      `Apakah Anda yakin ingin menghapus ${selectedIds.length} tagihan yang dipilih? Catatan kas yang terhubung juga akan dihapus.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: `Hapus (${selectedIds.length})`,
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await deleteTagihanBulk(selectedIds)
              handleExitSelection()
              Alert.alert('Sukses', `Berhasil menghapus ${res.count || selectedIds.length} tagihan.`)
            } catch (err) {
              Alert.alert('Error', 'Gagal menghapus tagihan terpilih.')
            }
          }
        }
      ]
    )
  }

  const handleHapusSemua = () => {
    if (filteredBills.length === 0) {
      Alert.alert('Tidak Ada Tagihan', 'Tidak ada tagihan untuk dihapus pada filter ini.')
      return
    }

    const allFilteredIds = filteredBills.map((t) => t.id)

    Alert.alert(
      '⚠️ Hapus Semua Tagihan',
      `PERHATIAN: Apakah Anda yakin ingin menghapus SEMUA (${allFilteredIds.length}) tagihan pada tampilan filter saat ini?\n\nSemua riwayat dan catatan kas terkait akan dibersihkan. Tindakan ini tidak dapat dibatalkan.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: `Hapus Semua (${allFilteredIds.length})`,
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await deleteTagihanBulk(allFilteredIds)
              handleExitSelection()
              Alert.alert('Sukses', `Berhasil menghapus semua (${res.count || allFilteredIds.length}) tagihan.`)
            } catch (err) {
              Alert.alert('Error', 'Gagal menghapus semua tagihan.')
            }
          }
        }
      ]
    )
  }

  const handleGenerate = async () => {
    const b = Number(genBulan)
    const t = Number(genTahun)
    if (!b || b < 1 || b > 12) {
      Alert.alert('Perhatian', 'Bulan harus antara 1 sampai 12!')
      return
    }
    if (!t || t < 2020 || t > 2040) {
      Alert.alert('Perhatian', 'Tahun tidak valid!')
      return
    }

    const targetRtParam = isRT ? (currentUser?.rt_id || 'rt-1') : (genRtId === 'ALL' ? null : genRtId)
    const finalGenScope = isRT ? 'RT' : genScope

    setGenLoading(true)
    try {
      const createdCount = await generateTagihanMassal(
        b,
        t,
        targetRtParam,
        finalGenScope,
        selectedPosIds.length > 0 ? selectedPosIds : null
      )
      setModalGenOpen(false)
      const scopeName = finalGenScope === 'ALL' ? 'RT & RW' : finalGenScope === 'RW' ? 'Tingkat RW' : 'Tingkat RT'
      if (createdCount === 0) {
        Alert.alert('Informasi', `Semua warga sudah memiliki tagihan untuk periode ${NAMA_BULAN[b - 1]} ${t} (${scopeName}).`)
      } else {
        Alert.alert('Sukses', `Berhasil menerbitkan ${createdCount} tagihan massal periode ${NAMA_BULAN[b - 1]} ${t} (${scopeName}) lengkap dengan 3 digit kode unik per warga!`)
      }
    } catch (err) {
      Alert.alert('Error', 'Gagal membuat tagihan massal.')
    } finally {
      setGenLoading(false)
    }
  }

  // Handler Edit Tagihan (RT / RW Admin)
  const handleBukaEdit = (item) => {
    setEditingTagihan(item)
    const targetW = warga.find((w) => w.id === item.wargaId) || {}
    const angkaKode = parseInt(getAngkaKodeUnik(targetW), 10) || 0
    const rawNominal = Math.max(0, (Number(item.total) || 0) - angkaKode)
    const posName = item.rincian?.[0]?.nama || item.pembayaran_kepada || 'IPL Warga'

    setEditNamaPos(posName)
    setEditNominal(String(rawNominal > 0 ? rawNominal : item.total))
    setEditBulan(String(item.bulan || currentMonth))
    setEditTahun(String(item.tahun || currentYear))
    setEditStatus(item.status || 'Belum Bayar')
    setEditCatatan(item.catatan || '')
    setEditModalOpen(true)
  }

  const handleSimpanEdit = async () => {
    if (!editingTagihan) return
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
      await updateTagihan(editingTagihan.id, {
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
      Alert.alert('Error', 'Gagal memperbarui tagihan.')
    } finally {
      setEditLoading(false)
    }
  }

  // Handler Tagihan Biasa / Insidental (Ke SEMUA warga atau 1 warga)
  const handleTerbitkanTagihanBiasa = async () => {
    if (!biasaNama.trim()) {
      Alert.alert('Perhatian', 'Nama tagihan biasa wajib diisi!')
      return
    }
    const b = Number(biasaBulan)
    const t = Number(biasaTahun)
    const tot = Number(biasaNominal)
    if (!b || b < 1 || b > 12) {
      Alert.alert('Perhatian', 'Bulan harus antara 1 sampai 12!')
      return
    }
    if (!t || t < 2020 || t > 2040) {
      Alert.alert('Perhatian', 'Tahun tidak valid!')
      return
    }
    if (isNaN(tot) || tot <= 0) {
      Alert.alert('Perhatian', 'Nominal tagihan harus lebih dari 0!')
      return
    }

    const targetScope = isRT ? 'RT' : biasaScope
    const targetRtParam = isRT ? (currentUser?.rt_id || 'rt-1') : null

    setBiasaLoading(true)
    try {
      if (biasaTarget === 'SEMUA') {
        const res = await tambahTagihanBiasaMassal({
          namaTagihan: biasaNama.trim(),
          nominal: tot,
          bulan: b,
          tahun: t,
          scope: targetScope,
          targetRtId: targetRtParam,
          catatan: biasaCatatan.trim()
        })
        setBiasaLoading(false)
        if (res.success && res.count > 0) {
          setModalBiasaOpen(false)
          setBiasaNama('')
          setBiasaNominal('')
          setBiasaCatatan('')
          const targetKet = isRT ? `seluruh warga ${rtLabel}` : `semua warga RW`
          Alert.alert('Sukses', `Berhasil menerbitkan "${biasaNama}" ke ${targetKet} (${res.count} KK) lengkap dengan 3 digit kode unik per warga!`)
        } else {
          Alert.alert('Informasi', 'Tidak ada warga aktif yang dapat diterbitkan tagihan.')
        }
      } else {
        if (!selectedWargaId) {
          setBiasaLoading(false)
          Alert.alert('Pilih Warga', 'Silakan pilih warga tujuan terlebih dahulu!')
          return
        }
        const targetWarga = warga.find((w) => w.id === selectedWargaId) || {}
        await addTagihanManual({
          wargaId: selectedWargaId,
          bulan: b,
          tahun: t,
          total: tot,
          namaPos: biasaNama.trim(),
          payment_scope: targetScope,
          status: biasaStatus,
          metodeBayar: biasaStatus === 'Lunas' ? 'Tunai' : null,
          tanggalBayar: biasaStatus === 'Lunas' ? new Date().toISOString().slice(0, 10) : null,
          catatan: biasaCatatan.trim()
        })
        setBiasaLoading(false)
        setModalBiasaOpen(false)
        setBiasaNama('')
        setBiasaNominal('')
        setBiasaCatatan('')
        Alert.alert('Sukses', `Tagihan "${biasaNama}" untuk ${targetWarga.nama || 'warga'} berhasil diterbitkan!`)
      }
    } catch (e) {
      setBiasaLoading(false)
      Alert.alert('Error', 'Gagal menerbitkan tagihan biasa.')
    }
  }

  // Handler Master Pos Iuran CRUD
  const handleSimpanMasterPos = async () => {
    if (!masterNama.trim()) {
      Alert.alert('Perhatian', 'Nama pos iuran wajib diisi!')
      return
    }
    const tot = Number(masterNominal)
    if (isNaN(tot) || tot <= 0) {
      Alert.alert('Perhatian', 'Tarif pos iuran harus lebih dari 0!')
      return
    }

    try {
      if (editingMasterPos) {
        await updateJenisIuran(editingMasterPos.id, {
          nama: masterNama.trim(),
          nominal: tot,
          payment_scope: masterScope,
          keterangan: masterKeterangan.trim()
        })
        Alert.alert('Sukses', 'Tarif master pos iuran berhasil diperbarui!')
      } else {
        await addJenisIuran({
          nama: masterNama.trim(),
          nominal: tot,
          payment_scope: masterScope,
          periode: 'Bulanan',
          wajib: true,
          keterangan: masterKeterangan.trim()
        })
        Alert.alert('Sukses', 'Master pos iuran baru berhasil ditambahkan!')
      }
      setMasterFormOpen(false)
      setEditingMasterPos(null)
      setMasterNama('')
      setMasterNominal('')
      setMasterKeterangan('')
    } catch (e) {
      Alert.alert('Error', 'Gagal menyimpan master pos iuran.')
    }
  }

  const handleHapusMasterPos = (pos) => {
    Alert.alert(
      'Hapus Pos Iuran',
      `Apakah Anda yakin ingin menghapus pos "${pos.nama}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteJenisIuran(pos.id)
              Alert.alert('Sukses', 'Pos iuran berhasil dihapus.')
            } catch (e) {
              Alert.alert('Error', 'Gagal menghapus pos iuran.')
            }
          }
        }
      ]
    )
  }

  const handleTambahManual = async () => {
    if (!selectedWargaId) {
      Alert.alert('Pilih Warga', 'Silakan klik nama warga terlebih dahulu!')
      return
    }
    const b = Number(manBulan)
    const t = Number(manTahun)
    const tot = Number(manTotal)
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

    const targetScope = isRT ? 'RT' : manScope
    const isRw = targetScope === 'RW'
    const targetWarga = warga.find((w) => w.id === selectedWargaId) || {}
    const residentRtId = targetWarga.rt_id || currentUser?.rt_id || 'rt-01-01'
    const rtObj = rts?.find((r) => r.id === residentRtId || r.number === targetWarga.rt) || {}
    const rwClean = (rtObj.rw && !rtObj.rw.includes('-')) ? rtObj.rw : (config?.rw && !config.rw.includes('-') ? config.rw : 'RW 01')
    const ownerId = isRw ? (targetWarga.rw_id || rtObj.rw_id || 'rw-01') : residentRtId
    const ownerLabel = isRw ? rwClean : (rtObj.name || 'RT 01')

    try {
      await addTagihanManual({
        wargaId: selectedWargaId,
        bulan: b,
        tahun: t,
        total: tot,
        namaPos: manPosNama || (isRw ? 'Iuran Fasum & Pembangunan RW' : 'Iuran Pengelolaan Lingkungan (IPL)'),
        payment_scope: targetScope,
        pembayaran_kepada: ownerLabel,
        status: manStatus,
        metodeBayar: manStatus === 'Lunas' ? 'Tunai' : null,
        tanggalBayar: manStatus === 'Lunas' ? new Date().toISOString().slice(0, 10) : null,
        catatan: manCatatan.trim()
      })
      setModalManualOpen(false)
      setManCatatan('')
      setManWargaSearch('')
      Alert.alert('Sukses', `Tagihan manual untuk ${targetWarga.nama || 'warga'} berhasil diterbitkan!`)
    } catch (e) {
      Alert.alert('Error', 'Gagal membuat tagihan manual.')
    }
  }

  const handleKirimReminder = (item) => {
    const targetWarga = warga.find((w) => w.id === item.wargaId) || {}
    if (!targetWarga.noHp) {
      Alert.alert('Tidak Ada Nomor', `${targetWarga.nama || 'Warga'} tidak memiliki nomor HP terdaftar.`)
      return
    }
    const url = generateWaReminder(targetWarga, item, infoLingkungan)
    Linking.openURL(url)
  }

  const handleKirimKwitansi = (item) => {
    const targetWarga = warga.find((w) => w.id === item.wargaId) || {}
    if (!targetWarga.noHp) {
      Alert.alert('Tidak Ada Nomor', `${targetWarga.nama || 'Warga'} tidak memiliki nomor HP terdaftar.`)
      return
    }
    const url = generateWaKwitansi(targetWarga, item, infoLingkungan)
    Linking.openURL(url)
  }

  const handleHapusTagihan = (item) => {
    const targetWarga = warga.find((w) => w.id === item.wargaId) || {}
    Alert.alert(
      'Hapus Tagihan',
      `Hapus tagihan ${targetWarga.nama || 'warga'} bln ${item.bulan}/${item.tahun}? Entri kas terkait juga akan dihapus.`,
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Hapus', style: 'destructive', onPress: () => deleteTagihan(item.id) }
      ]
    )
  }

  const handleBatalLunas = (item) => {
    const targetWarga = warga.find((w) => w.id === item.wargaId) || {}
    Alert.alert(
      'Batalkan Status Lunas',
      `Batalkan pelunasan tagihan ${targetWarga.nama || 'warga'} bln ${item.bulan}/${item.tahun}? Catatan kas akan disesuaikan.`,
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Batalkan', style: 'destructive', onPress: () => batalBayarTagihan(item.id) }
      ]
    )
  }

  const renderTagihanItem = ({ item }) => {
    const isLunas = item.status === 'Lunas'
    const isPending = item.status === 'Menunggu Verifikasi'
    const isPerluDiperbaiki = item.status === 'Perlu Diperbaiki' || item.status === 'Ditolak'
    const isBelum = !isLunas && !isPending && !isPerluDiperbaiki

    const isSelected = selectedIds.includes(item.id)

    const targetWarga = warga.find((w) => w.id === item.wargaId) || {}
    const namaWarga = targetWarga.nama || item.namaWarga || 'Warga'
    const blok = targetWarga.blok || item.blok || 'A'
    const noRumah = targetWarga.noRumah || item.noRumah || '-'
    const bulanNama = NAMA_BULAN[(item.bulan || 1) - 1] || `Bln ${item.bulan}`
    const isRw = item.payment_scope === 'RW'
    const recipientLabel = item.pembayaran_kepada && !item.pembayaran_kepada.includes('-')
      ? item.pembayaran_kepada
      : (isRw ? 'RW 01' : 'RT 01')

    return (
      <TouchableOpacity
        activeOpacity={isSelectionMode ? 0.7 : 1}
        onPress={() => {
          if (isSelectionMode) {
            toggleSelect(item.id)
          }
        }}
        onLongPress={() => {
          if (isAdminLoggedIn && !isSelectionMode) {
            setIsSelectionMode(true)
            setSelectedIds([item.id])
          }
        }}
      >
        <AppCard style={[styles.card, isSelected && styles.cardSelected]}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            {/* Checkbox in selection mode */}
            {Boolean(isSelectionMode && isAdminLoggedIn) ? (
              <TouchableOpacity
                style={styles.cardCheckboxBtn}
                onPress={() => toggleSelect(item.id)}
                activeOpacity={0.7}
              >
                {isSelected ? (
                  <CheckSquare size={22} color={colors.primary} />
                ) : (
                  <Square size={22} color={colors.textSecondary} />
                )}
              </TouchableOpacity>
            ) : null}

            <View style={{ flex: 1, minWidth: 0 }}>
              {/* Header Tagihan */}
              <View style={styles.cardTop}>
                <View style={{ flex: 1, minWidth: 0, marginRight: spacing.xs }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <AppBadge scope={isRw ? 'RW' : 'RT'} label={recipientLabel} />
                    <Text style={styles.wargaName} numberOfLines={1}>
                      {isWarga ? `Tagihan ${bulanNama} ${item.tahun}` : namaWarga}
                    </Text>
                  </View>

                  <Text style={styles.wargaBlok} numberOfLines={1}>
                    {isWarga
                      ? `Iuran ${recipientLabel} • ${bulanNama} ${item.tahun}`
                      : `Blok ${blok} No. ${noRumah} • ${bulanNama} ${item.tahun}`}
                  </Text>
                </View>

                {!isWarga && isPending && (item.metode?.includes('Transfer') || item.metodeBayar?.includes('Transfer') || !item.metode || item.metode === 'Transfer Bank') ? (
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#ECFDF5',
                    borderColor: '#A7F3D0',
                    borderWidth: 1,
                    borderRadius: 6,
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    gap: 4
                  }}>
                    <Zap size={11} color="#059669" />
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#065F46' }}>
                      Sedang Dicek Bot Moota
                    </Text>
                  </View>
                ) : (
                  <AppBadge status={item.status} label={isWarga && isPending ? 'Menunggu Verifikasi' : undefined} />
                )}
              </View>

              {/* Rejection Alert Box */}
              {Boolean(isPerluDiperbaiki) ? (
                <View style={styles.itemRejectBox}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <AlertCircle size={14} color={colors.danger} />
                    <Text style={styles.itemRejectTitle}>Pembayaran Ditolak:</Text>
                  </View>
                  <Text style={styles.itemRejectDesc}>
                    {item.alasanPenolakan || 'Bukti pembayaran tidak sesuai dengan tagihan'}
                  </Text>
                </View>
              ) : null}

              {/* Nominal Tagihan */}
              <View style={styles.amountContainer}>
                <Text style={styles.amountVal}>{formatRupiah(item.total)}</Text>
                {item.noKwitansi ? (
                  <Text style={styles.kwitansiNo} numberOfLines={1}>No. Kwitansi: {item.noKwitansi}</Text>
                ) : (
                  <View style={styles.dueDateRow}>
                    <Calendar size={13} color={colors.textSecondary} />
                    <Text style={styles.dueDateText}>
                      Jatuh tempo: 30 {NAMA_BULAN[(item.bulan || 1) - 1]} {item.tahun || currentYear}
                    </Text>
                  </View>
                )}
              </View>

              {/* Action Buttons Row */}
              {!isSelectionMode ? (
                <View style={styles.cardActionsRow}>
                  <View style={{ flex: 1, minWidth: 64 }}>
                    <AppButton
                      title="Detail"
                      variant="secondary"
                      size="sm"
                      onPress={() => navigation.navigate('DetailTagihan', { tagihan: item })}
                    />
                  </View>

                  {/* Warga: Bayar atau Kwitansi WA */}
                  {Boolean(isWarga && !isLunas) ? (
                    <View style={{ flex: 1.6, minWidth: 90 }}>
                      <AppButton
                        title={isPerluDiperbaiki ? 'Upload Ulang' : isPending ? 'Cek Bukti' : 'Bayar'}
                        variant={isPerluDiperbaiki ? 'danger' : 'primary'}
                        size="sm"
                        icon={<CreditCard size={14} color={colors.surface} />}
                        onPress={() => navigation.navigate('Pembayaran', { tagihan: item })}
                      />
                    </View>
                  ) : null}

                  {Boolean(isWarga && isLunas) ? (
                    <View style={{ flex: 1.3, minWidth: 80 }}>
                      <AppButton
                        title="Kwitansi"
                        variant="secondary"
                        size="sm"
                        icon={<Receipt size={14} color={colors.success} />}
                        onPress={() => setKwitansiModal(item)}
                      />
                    </View>
                  ) : null}

                  {/* Admin/RT Actions */}
                  {Boolean(isAdminLoggedIn && isBelum && targetWarga.noHp) ? (
                    <View style={{ flex: 1.3, minWidth: 80 }}>
                      <AppButton
                        title="Ingatkan"
                        variant="secondary"
                        size="sm"
                        icon={<MessageCircle size={14} color={colors.warning} />}
                        onPress={() => handleKirimReminder(item)}
                      />
                    </View>
                  ) : null}

                  {Boolean(isAdminLoggedIn && isLunas) ? (
                    <>
                      <View style={{ flex: 1.3, minWidth: 80 }}>
                        <AppButton
                          title="Kirim WA"
                          variant="secondary"
                          size="sm"
                          icon={<Send size={14} color={colors.primary} />}
                          onPress={() => handleKirimKwitansi(item)}
                        />
                      </View>
                      <TouchableOpacity
                        style={styles.iconActionBtn}
                        onPress={() => handleBatalLunas(item)}
                        activeOpacity={0.8}
                      >
                        <RotateCcw size={14} color={colors.textSecondary} />
                      </TouchableOpacity>
                    </>
                  ) : null}

                  {Boolean(isAdminLoggedIn && isPending) ? (
                    (item.metode?.includes('Transfer') || item.metodeBayar?.includes('Transfer') || !item.metode || item.metode === 'Transfer Bank') ? (
                      <View style={{ flex: 1.5, minWidth: 95 }}>
                        <AppButton
                          title="Detail (Bot)"
                          variant="secondary"
                          size="sm"
                          icon={<Zap size={13} color={colors.primary} />}
                          onPress={() => navigation.navigate('DetailTagihan', { tagihan: item })}
                        />
                      </View>
                    ) : (
                      <View style={{ flex: 1.5, minWidth: 95 }}>
                        <AppButton
                          title="Periksa Bukti"
                          variant="primary"
                          size="sm"
                          onPress={() => navigation.navigate('DetailTagihan', { tagihan: item })}
                        />
                      </View>
                    )
                  ) : null}

                  {Boolean(isAdminLoggedIn) ? (
                    <TouchableOpacity
                      style={[styles.iconActionBtn, { borderColor: '#E0E7FF', backgroundColor: '#EEF2FF' }]}
                      onPress={() => handleBukaEdit(item)}
                      activeOpacity={0.8}
                    >
                      <Edit3 size={14} color="#4F46E5" />
                    </TouchableOpacity>
                  ) : null}

                  {Boolean(isAdminLoggedIn) ? (
                    <TouchableOpacity
                      style={[styles.iconActionBtn, { borderColor: '#FEE2E2', backgroundColor: '#FEF2F2' }]}
                      onPress={() => handleHapusTagihan(item)}
                      activeOpacity={0.8}
                    >
                      <Trash2 size={14} color={colors.danger} />
                    </TouchableOpacity>
                  ) : null}
                </View>
              ) : null}
            </View>
          </View>
        </AppCard>
      </TouchableOpacity>
    )
  }

  const kwitansiWarga = kwitansiModal
    ? warga.find((w) => w.id === kwitansiModal.wargaId) || {}
    : {}

  return (
    <View style={styles.container}>
      <TopAppBar
        title="Tagihan & Iuran"
        navigation={navigation}
        showBack={Boolean(isAdminLoggedIn)}
      />

      <View style={styles.filterSection}>
        {/* Scope Segment Tabs: Semua | Tagihan RT | Tagihan RW (Tersedia untuk RW dan RT) */}
        <View style={styles.scopeSegmentRow}>
          <TouchableOpacity
            style={[styles.scopeSegBtn, scopeFilter === 'ALL' && styles.scopeSegBtnActive]}
            onPress={() => setScopeFilter('ALL')}
          >
            <Text style={[styles.scopeSegText, scopeFilter === 'ALL' && styles.scopeSegTextActive]}>
              Semua Tagihan
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.scopeSegBtn, scopeFilter === 'RT' && styles.scopeSegBtnActive]}
            onPress={() => setScopeFilter('RT')}
          >
            <Text style={[styles.scopeSegText, scopeFilter === 'RT' && styles.scopeSegTextActive]}>
              Tagihan RT
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.scopeSegBtn, scopeFilter === 'RW' && styles.scopeSegBtnActive]}
            onPress={() => setScopeFilter('RW')}
          >
            <Text style={[styles.scopeSegText, scopeFilter === 'RW' && styles.scopeSegTextActive]}>
              Tagihan RW
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick Sync Mutasi Moota Sandbox */}
        {Boolean(isAdminLoggedIn) && (
          <TouchableOpacity
            style={styles.mootaQuickSyncBtn}
            onPress={handleSyncMutasiMoota}
            disabled={mootaSyncing}
            activeOpacity={0.85}
          >
            {mootaSyncing ? (
              <ActivityIndicator size="small" color="#D97706" style={{ marginRight: 6 }} />
            ) : (
              <Zap size={14} color="#D97706" style={{ marginRight: 6 }} />
            )}
            <Text style={styles.mootaQuickSyncText}>
              {mootaSyncing ? 'Memeriksa Mutasi Moota...' : '⚡ Tarik Mutasi Moota (Cek Pelunasan Otomatis)'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Selection Bar / Toolbar Toggle for RT/RW */}
        {Boolean(isAdminLoggedIn) ? (
          isSelectionMode ? (
            <View style={styles.selectionHeaderBar}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <CheckSquare size={16} color={colors.primary} />
                <Text style={styles.selectionHeaderText}>
                  {selectedIds.length} dari {filteredBills.length} Terpilih
                </Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 6 }}>
                <TouchableOpacity
                  style={styles.selectionHeaderBtn}
                  onPress={handleSelectAll}
                >
                  <Text style={styles.selectionHeaderBtnText}>
                    {selectedIds.length === filteredBills.length && filteredBills.length > 0
                      ? 'Batal Semua'
                      : 'Pilih Semua'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.selectionHeaderBtn, { backgroundColor: '#F3F4F6' }]}
                  onPress={handleExitSelection}
                >
                  <Text style={[styles.selectionHeaderBtnText, { color: colors.textSecondary }]}>
                    Selesai
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.selectionTriggerRow}>
              <Text style={styles.selectionTriggerHint}>
                Total: <Text style={{ fontWeight: '700', color: colors.textPrimary }}>{filteredBills.length} Tagihan</Text>
              </Text>
              {filteredBills.length > 0 ? (
                <TouchableOpacity
                  style={styles.selectionTriggerBtn}
                  onPress={() => setIsSelectionMode(true)}
                  activeOpacity={0.8}
                >
                  <CheckSquare size={13} color={colors.primary} />
                  <Text style={styles.selectionTriggerBtnText}>Pilih / Hapus Massal</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          )
        ) : null}

        {/* Period filter toggle */}
        {Boolean(isAdminLoggedIn) ? (
          <TouchableOpacity
            style={styles.periodToggle}
            onPress={() => setShowPeriodFilter(!showPeriodFilter)}
            activeOpacity={0.8}
          >
            <Calendar size={14} color={colors.textSecondary} />
            <Text style={styles.periodToggleText}>
              {filterBulan > 0 ? `${NAMA_BULAN[filterBulan - 1]} ${filterTahun}` : `Semua Periode (${filterTahun})`}
            </Text>
            <Filter size={13} color={colors.textSecondary} />
          </TouchableOpacity>
        ) : null}

        {Boolean(showPeriodFilter) ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.periodRow}>
            <TouchableOpacity
              style={[styles.bulanChip, filterBulan === 0 && styles.bulanChipActive]}
              onPress={() => setFilterBulan(0)}
            >
              <Text style={[styles.bulanChipText, filterBulan === 0 && styles.bulanChipTextActive]}>Semua</Text>
            </TouchableOpacity>
            {NAMA_BULAN.map((nama, idx) => (
              <TouchableOpacity
                key={idx}
                style={[styles.bulanChip, filterBulan === idx + 1 && styles.bulanChipActive]}
                onPress={() => setFilterBulan(idx + 1)}
              >
                <Text style={[styles.bulanChipText, filterBulan === idx + 1 && styles.bulanChipTextActive]}>
                  {nama.slice(0, 3)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : null}

        {/* Search Input */}
        <View style={styles.searchBox}>
          <Search size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari nama warga, blok, atau penerima..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Filter Chips: Termasuk pilihan jenis tagihan RT & RW */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', marginBottom: 4 }}>
          {['Semua', 'Tagihan RT', 'Tagihan RW', 'Belum Bayar', 'Menunggu', 'Perlu Diperbaiki', 'Lunas'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.filterChip, activeFilter === tab && styles.filterChipActive]}
              onPress={() => setActiveFilter(tab)}
              activeOpacity={0.8}
            >
              <Text
                style={[styles.filterChipText, activeFilter === tab && styles.filterChipTextActive]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Bill List */}
      <FlatList
        data={filteredBills}
        keyExtractor={(item) => item.id || `tag-${item.wargaId}-${item.bulan}-${item.tahun}-${item.payment_scope || 'RT'}`}
        renderItem={renderTagihanItem}
        contentContainerStyle={[styles.listContent, isSelectionMode && { paddingBottom: 220 }]}
        showsVerticalScrollIndicator={false}
        initialNumToRender={8}
        maxToRenderPerBatch={10}
        windowSize={7}
        removeClippedSubviews={Platform.OS === 'android'}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshData}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          <AppEmptyState
            variant={searchQuery ? 'no_search' : (activeFilter === 'Lunas' ? 'all_paid' : 'no_history')}
            title={searchQuery ? 'Tagihan Tidak Ditemukan' : 'Tidak Ada Tagihan'}
            subtitle={searchQuery ? 'Coba ubah kata kunci pencarian.' : 'Belum ada data tagihan pada filter ini.'}
          />
        }
      />

      {/* Selection Mode Floating Bottom Action Bar (RT / RW Admin) */}
      {Boolean(isSelectionMode && isAdminLoggedIn) ? (
        <View style={styles.bottomSelectionBar}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.bottomSelectionTitle}>
              {selectedIds.length} Tagihan Terpilih
            </Text>
            <Text style={styles.bottomSelectionSub} numberOfLines={1}>
              {selectedIds.length > 0
                ? `Total: ${formatRupiah(
                    filteredBills
                      .filter((b) => selectedIds.includes(b.id))
                      .reduce((sum, b) => sum + (Number(b.total) || 0), 0)
                  )}`
                : 'Centang tagihan untuk hapus'}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
            <TouchableOpacity
              style={[
                styles.bulkDeleteBtn,
                selectedIds.length === 0 && { opacity: 0.45, backgroundColor: '#9CA3AF' }
              ]}
              onPress={handleHapusTerpilih}
              disabled={selectedIds.length === 0}
            >
              <Trash2 size={14} color={colors.surface} />
              <Text style={styles.bulkDeleteBtnText}>
                Hapus ({selectedIds.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.bulkDeleteAllBtn}
              onPress={handleHapusSemua}
            >
              <Trash2 size={14} color={colors.danger} />
              <Text style={styles.bulkDeleteAllBtnText}>Hapus Semua</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {/* FAB Generate / Tambah Tagihan (RT / Admin Only) - Hidden in selection mode */}
      {Boolean(isAdminLoggedIn && !isSelectionMode) ? (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setActionMenuOpen(true)}
          activeOpacity={0.88}
        >
          <Plus size={24} color={colors.surface} />
        </TouchableOpacity>
      ) : null}

      {/* ========================================================================= */}
      {/* MODAL 1: ACTION MENU PICKER */}
      {/* ========================================================================= */}
      <AppModal
        visible={actionMenuOpen}
        title="Buat Tagihan Iuran"
        onClose={() => setActionMenuOpen(false)}
      >
        <View style={styles.roleContextBanner}>
          <View style={styles.roleContextBadge}>
            <ShieldCheck size={14} color={isRW ? colors.primary : '#2563EB'} />
            <Text style={[styles.roleContextBadgeText, { color: isRW ? colors.primary : '#2563EB' }]}>
              {isRW ? 'Pengurus RW 15' : `Pengurus ${rtLabel}`}
            </Text>
          </View>
          <Text style={styles.roleContextDesc}>
            {isRW
              ? 'Anda memiliki akses mengelola tagihan tingkat RW maupun seluruh RT.'
              : `Anda mengelola penerbitan tagihan khusus warga di wilayah ${rtLabel}.`}
          </Text>
        </View>

        {/* Option 1: Tagihan dari Master Pos Iuran */}
        <TouchableOpacity
          style={[styles.actionOptionBtn, { backgroundColor: colors.primarySubtle, borderColor: '#A7F3D0' }]}
          onPress={() => {
            setActionMenuOpen(false)
            setModalGenOpen(true)
          }}
          activeOpacity={0.88}
        >
          <View style={[styles.actionOptionIconWrap, { backgroundColor: '#DCFCE7' }]}>
            <Receipt size={22} color={colors.primary} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={[styles.actionOptionTitle, { color: colors.primary }]}>Tagihan Master Pos Iuran</Text>
              <View style={styles.recomendedPill}><Text style={styles.recomendedPillText}>Semua Warga</Text></View>
            </View>
            <Text style={styles.actionOptionSub}>
              Pilih pos iuran master (Sampah, Satpam, RW) & terbitkan ke semua warga + kode unik.
            </Text>
          </View>
          <ChevronRight size={18} color={colors.primary} />
        </TouchableOpacity>

        {/* Option 2: Tagihan Biasa / Insidental */}
        <TouchableOpacity
          style={[styles.actionOptionBtn, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE', marginTop: 10 }]}
          onPress={() => {
            setActionMenuOpen(false)
            setModalBiasaOpen(true)
          }}
          activeOpacity={0.88}
        >
          <View style={[styles.actionOptionIconWrap, { backgroundColor: '#DBEAFE' }]}>
            <DollarSign size={22} color={colors.info} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={[styles.actionOptionTitle, { color: colors.info }]}>Tagihan Biasa / Insidental</Text>
              <View style={[styles.recomendedPill, { backgroundColor: '#DBEAFE' }]}><Text style={[styles.recomendedPillText, { color: colors.info }]}>Massal/Personal</Text></View>
            </View>
            <Text style={styles.actionOptionSub}>
              Buat tagihan kegiatan, renovasi, atau denda ke SEMUA warga atau 1 warga tertentu.
            </Text>
          </View>
          <ChevronRight size={18} color={colors.info} />
        </TouchableOpacity>

        {/* Option 3: Kelola Master Pos Iuran */}
        <TouchableOpacity
          style={[styles.actionOptionBtn, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0', marginTop: 10 }]}
          onPress={() => {
            setActionMenuOpen(false)
            setModalMasterOpen(true)
          }}
          activeOpacity={0.88}
        >
          <View style={[styles.actionOptionIconWrap, { backgroundColor: '#DCFCE7' }]}>
            <Sliders size={22} color={colors.success} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[styles.actionOptionTitle, { color: colors.success }]}>Kelola Master Pos Iuran</Text>
            <Text style={styles.actionOptionSub}>
              Atur daftar pos iuran rutin (sampah, keamanan, pembangunan) & tarif per KK.
            </Text>
          </View>
          <ChevronRight size={18} color={colors.success} />
        </TouchableOpacity>

        {/* Option 4: Tambah Tagihan Manual 1 Warga */}
        <TouchableOpacity
          style={[styles.actionOptionBtn, { backgroundColor: '#F9FAFB', borderColor: '#E5E7EB', marginTop: 10 }]}
          onPress={() => {
            setActionMenuOpen(false)
            setModalManualOpen(true)
          }}
          activeOpacity={0.88}
        >
          <View style={[styles.actionOptionIconWrap, { backgroundColor: '#F3F4F6' }]}>
            <CreditCard size={22} color={colors.textSecondary} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[styles.actionOptionTitle, { color: colors.textPrimary }]}>Tambah Tagihan Manual (1 Warga)</Text>
            <Text style={styles.actionOptionSub}>
              Buat tagihan khusus 1 warga tertentu atau catat pelunasan langsung.
            </Text>
          </View>
          <ChevronRight size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </AppModal>

      {/* ========================================================================= */}
      {/* MODAL 2: GENERATE TAGIHAN DARI MASTER POS IURAN */}
      {/* ========================================================================= */}
      <AppModal
        visible={modalGenOpen}
        title="Tagihan Master Pos Iuran"
        onClose={() => setModalGenOpen(false)}
        footer={
          <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
            <View style={{ flex: 1 }}>
              <AppButton
                title="Batal"
                variant="secondary"
                onPress={() => setModalGenOpen(false)}
              />
            </View>
            <View style={{ flex: 1.4 }}>
              <AppButton
                title="Terbitkan ke Semua"
                variant="primary"
                loading={genLoading}
                icon={<Sparkles size={15} color={colors.surface} />}
                onPress={handleGenerate}
              />
            </View>
          </View>
        }
      >
        {/* Banner Penjelasan Alur */}
        <View style={styles.modalStepBanner}>
          <View style={styles.modalStepHeader}>
            <Building2 size={16} color={isRW ? colors.primary : '#2563EB'} />
            <Text style={styles.modalStepTitle}>
              {isRW ? 'Penerbitan Tagihan Tingkat RW / RT' : `Penerbitan Tagihan Wilayah ${rtLabel}`}
            </Text>
          </View>
          <Text style={styles.modalStepSubtitle}>
            {isRW
              ? 'Pilih pos iuran master yang ingin diterbitkan serentak ke semua kepala keluarga.'
              : `Sistem menerbitkan tagihan pos iuran ke seluruh KK aktif di ${rtLabel} dengan 3 digit kode unik.`}
          </Text>
        </View>

        {/* Khusus RW: Pemilihan Tingkat / Scope Tagihan */}
        {Boolean(isRW) ? (
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>1. Pilih Tingkat Tagihan *</Text>
            <View style={styles.scopeCardRow}>
              <TouchableOpacity
                style={[styles.scopeSelectCard, genScope === 'RW' && styles.scopeSelectCardActive]}
                onPress={() => {
                  setGenScope('RW')
                  setSelectedPosIds([])
                }}
                activeOpacity={0.85}
              >
                <ShieldCheck size={18} color={genScope === 'RW' ? colors.primary : colors.textSecondary} />
                <Text style={[styles.scopeSelectTitle, genScope === 'RW' && { color: colors.primary }]}>Tagihan RW</Text>
                <Text style={styles.scopeSelectSub}>Iuran Fasum/Pembangunan (Kas RW 15)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.scopeSelectCard, genScope === 'RT' && styles.scopeSelectCardActive]}
                onPress={() => {
                  setGenScope('RT')
                  setSelectedPosIds([])
                }}
                activeOpacity={0.85}
              >
                <Home size={18} color={genScope === 'RT' ? '#2563EB' : colors.textSecondary} />
                <Text style={[styles.scopeSelectTitle, genScope === 'RT' && { color: '#2563EB' }]}>Tagihan RT</Text>
                <Text style={styles.scopeSelectSub}>Iuran IPL RT (Kas Masing-Masing RT)</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.scopeAllOption, genScope === 'ALL' && styles.scopeAllOptionActive]}
              onPress={() => {
                setGenScope('ALL')
                setSelectedPosIds([])
              }}
              activeOpacity={0.85}
            >
              <Layers size={16} color={genScope === 'ALL' ? colors.primary : colors.textSecondary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.scopeAllTitle, genScope === 'ALL' && { color: colors.primary }]}>
                  Terbitkan Keduanya (Tagihan RT + Tagihan RW)
                </Text>
                <Text style={styles.scopeAllSub}>
                  Otomatis terbitkan 2 tagihan terpisah per KK: 1 untuk Kas RT & 1 untuk Kas RW.
                </Text>
              </View>
              {genScope === 'ALL' && <Check size={16} color={colors.primary} />}
            </TouchableOpacity>

            {/* Filter RT Tertentu jika RW memilih Tagihan RT */}
            {Boolean(genScope === 'RT') ? (
              <View style={{ marginTop: 8 }}>
                <Text style={[styles.inputLabel, { fontSize: 11 }]}>Target Wilayah RT:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
                  <TouchableOpacity
                    style={[styles.rtFilterChip, genRtId === 'ALL' && styles.rtFilterChipActive]}
                    onPress={() => setGenRtId('ALL')}
                  >
                    <Text style={[styles.rtFilterChipText, genRtId === 'ALL' && styles.rtFilterChipTextActive]}>
                      Semua RT (RT 01 s/d RT 06)
                    </Text>
                  </TouchableOpacity>
                  {rts?.map((r) => (
                    <TouchableOpacity
                      key={r.id}
                      style={[styles.rtFilterChip, genRtId === r.id && styles.rtFilterChipActive]}
                      onPress={() => setGenRtId(r.id)}
                    >
                      <Text style={[styles.rtFilterChipText, genRtId === r.id && styles.rtFilterChipTextActive]}>
                        {r.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Pemilihan Periode Bulan & Tahun */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>
            {isRW ? '2. Pilih Periode Tagihan *' : '1. Pilih Periode Tagihan *'}
          </Text>

          {/* Quick Month Chips */}
          <View style={styles.quickPeriodRow}>
            <TouchableOpacity
              style={[
                styles.quickPeriodChip,
                Number(genBulan) === currentMonth && Number(genTahun) === currentYear && styles.quickPeriodChipActive
              ]}
              onPress={() => {
                setGenBulan(String(currentMonth))
                setGenTahun(String(currentYear))
              }}
            >
              <Text
                style={[
                  styles.quickPeriodChipText,
                  Number(genBulan) === currentMonth && Number(genTahun) === currentYear && styles.quickPeriodChipTextActive
                ]}
              >
                Bulan Ini ({NAMA_BULAN[currentMonth - 1]} {currentYear})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.quickPeriodChip,
                Number(genBulan) === nextMonth && Number(genTahun) === nextYear && styles.quickPeriodChipActive
              ]}
              onPress={() => {
                setGenBulan(String(nextMonth))
                setGenTahun(String(nextYear))
              }}
            >
              <Text
                style={[
                  styles.quickPeriodChipText,
                  Number(genBulan) === nextMonth && Number(genTahun) === nextYear && styles.quickPeriodChipTextActive
                ]}
              >
                Bulan Depan ({NAMA_BULAN[nextMonth - 1]} {nextYear})
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.miniLabel}>Bulan (1 - 12)</Text>
              <TextInput
                style={styles.modalInput}
                keyboardType="number-pad"
                value={genBulan}
                onChangeText={setGenBulan}
                placeholder="10"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.miniLabel}>Tahun</Text>
              <TextInput
                style={styles.modalInput}
                keyboardType="number-pad"
                value={genTahun}
                onChangeText={setGenTahun}
                placeholder="2026"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          </View>
        </View>

        {/* Pemilihan Pos Iuran dari Master */}
        <View style={styles.inputGroup}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <Text style={styles.inputLabel}>
              {isRW ? '3. Pilih Pos Iuran Master *' : '2. Pilih Pos Iuran Master *'}
            </Text>
            <TouchableOpacity
              onPress={() => {
                const availablePos = jenisIuran.filter(
                  (j) => j.aktif !== false && (genScope === 'ALL' || j.payment_scope === genScope || (!j.payment_scope && genScope === 'RT'))
                )
                if (selectedPosIds.length === availablePos.length) {
                  setSelectedPosIds([])
                } else {
                  setSelectedPosIds(availablePos.map((j) => j.id))
                }
              }}
            >
              <Text style={{ fontSize: 12, color: colors.primary, fontWeight: '700' }}>
                {selectedPosIds.length > 0 ? 'Batal Semua' : 'Pilih Semua'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* List pos iuran with checkboxes */}
          {jenisIuran
            .filter((j) => j.aktif !== false && (genScope === 'ALL' || j.payment_scope === genScope || (!j.payment_scope && genScope === 'RT')))
            .map((pos) => {
              const isChecked = selectedPosIds.length === 0 || selectedPosIds.includes(pos.id)
              return (
                <TouchableOpacity
                  key={pos.id}
                  style={[
                    styles.posCheckboxCard,
                    isChecked && styles.posCheckboxCardActive
                  ]}
                  onPress={() => {
                    const availablePos = jenisIuran.filter(
                      (j) => j.aktif !== false && (genScope === 'ALL' || j.payment_scope === genScope || (!j.payment_scope && genScope === 'RT'))
                    )
                    let cur = selectedPosIds.length === 0 ? availablePos.map((j) => j.id) : [...selectedPosIds]
                    if (cur.includes(pos.id)) {
                      cur = cur.filter((id) => id !== pos.id)
                    } else {
                      cur.push(pos.id)
                    }
                    setSelectedPosIds(cur)
                  }}
                  activeOpacity={0.8}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 }}>
                    {isChecked ? (
                      <CheckSquare size={20} color={colors.primary} />
                    ) : (
                      <Square size={20} color={colors.textSecondary} />
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.posCheckboxName, isChecked && { fontWeight: '700', color: colors.textPrimary }]}>
                        {pos.nama}
                      </Text>
                      {pos.keterangan ? (
                        <Text style={styles.posCheckboxDesc} numberOfLines={1}>
                          {pos.keterangan}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                  <Text style={[styles.posCheckboxNominal, isChecked && { color: colors.primary, fontWeight: '800' }]}>
                    {formatRupiah(pos.nominal)}
                  </Text>
                </TouchableOpacity>
              )
            })}
        </View>

        {/* Live Simulation Info Box */}
        {(() => {
          const targetCount = isRT
            ? warga.filter((w) => w.aktif !== false && w.rt_id === (currentUser?.rt_id || 'rt-1')).length
            : genScope === 'RT' && genRtId !== 'ALL'
            ? warga.filter((w) => w.aktif !== false && w.rt_id === genRtId).length
            : warga.filter((w) => w.aktif !== false).length

          const availablePos = jenisIuran.filter(
            (j) => j.aktif !== false && (genScope === 'ALL' || j.payment_scope === genScope || (!j.payment_scope && genScope === 'RT'))
          )
          const activeChosenPos = availablePos.filter((j) => selectedPosIds.length === 0 || selectedPosIds.includes(j.id))
          const baseTarif = activeChosenPos.length > 0
            ? activeChosenPos.reduce((sum, p) => sum + (Number(p.nominal) || 0), 0)
            : (genScope === 'RW' ? 40000 : genScope === 'ALL' ? 160000 : 120000)

          const estimasiTotal = targetCount * baseTarif

          return (
            <View style={styles.genSummaryBox}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Sparkles size={15} color="#15803D" />
                <Text style={styles.genSummaryTitle}>Simulasi Penerbitan Otomatis</Text>
              </View>

              <View style={styles.genSummaryRow}>
                <Text style={styles.genSummaryLabel}>Target Kepala Keluarga:</Text>
                <Text style={styles.genSummaryVal}>{targetCount} KK Aktif</Text>
              </View>
              <View style={styles.genSummaryRow}>
                <Text style={styles.genSummaryLabel}>Tarif Pokok Iuran:</Text>
                <Text style={styles.genSummaryVal}>{formatRupiah(baseTarif)} / KK</Text>
              </View>
              <View style={styles.genSummaryRow}>
                <Text style={styles.genSummaryLabel}>Estimasi Penerimaan:</Text>
                <Text style={[styles.genSummaryVal, { color: '#15803D', fontWeight: '800' }]}>
                  ± {formatRupiah(estimasiTotal)}
                </Text>
              </View>

              <View style={styles.mootaNoticeBox}>
                <Text style={styles.mootaNoticeText}>
                  ✨ <Text style={{ fontWeight: '700' }}>Kode Unik 3 Digit Otomatis:</Text> Setiap warga akan otomatis mendapatkan 3 digit kode unik di akhir nominal tagihan (contoh: Rp 120.101, Rp 120.102) untuk pencocokan mutasi bank / Moota tanpa tertukar.
                </Text>
              </View>
            </View>
          )
        })()}
      </AppModal>

      {/* ========================================================================= */}
      {/* MODAL 3: TAMBAH TAGIHAN MANUAL */}
      {/* ========================================================================= */}
      <AppModal
        visible={modalManualOpen}
        title="Tambah Tagihan Manual"
        onClose={() => setModalManualOpen(false)}
        footer={
          <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
            <View style={{ flex: 1 }}>
              <AppButton
                title="Batal"
                variant="secondary"
                onPress={() => setModalManualOpen(false)}
              />
            </View>
            <View style={{ flex: 1.4 }}>
              <AppButton
                title="Simpan Tagihan"
                variant="primary"
                onPress={handleTambahManual}
              />
            </View>
          </View>
        }
      >
        {/* Langkah 1: Pilih Warga dengan Search Filter */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>1. Pilih Warga Tujuan *</Text>
          <View style={styles.wargaSearchInputWrap}>
            <Search size={14} color={colors.textSecondary} style={{ marginRight: 6 }} />
            <TextInput
              style={styles.wargaSearchInput}
              placeholder="Cari nama, blok, nomor, atau kode warga..."
              placeholderTextColor={colors.textSecondary}
              value={manWargaSearch}
              onChangeText={setManWargaSearch}
            />
            {manWargaSearch.length > 0 && (
              <TouchableOpacity onPress={() => setManWargaSearch('')}>
                <X size={14} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {/* List Warga Chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', marginTop: 8 }}>
            {(isRT ? scopedWarga : warga)
              .filter((w) => {
                if (!manWargaSearch.trim()) return true
                const q = manWargaSearch.toLowerCase()
                return (
                  (w.nama || '').toLowerCase().includes(q) ||
                  `${w.blok || ''}/${w.noRumah || ''}`.toLowerCase().includes(q) ||
                  (w.kodeUnik && String(w.kodeUnik).toLowerCase().includes(q))
                )
              })
              .map((w) => {
                const isSelected = selectedWargaId === w.id
                const fullCode = getKodeUnikWarga(w)
                return (
                  <TouchableOpacity
                    key={w.id}
                    style={[
                      styles.wargaCardSelect,
                      isSelected && styles.wargaCardSelectActive
                    ]}
                    onPress={() => setSelectedWargaId(w.id)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.wargaCardAvatar, isSelected && { backgroundColor: '#DBEAFE' }]}>
                      <Text style={[styles.wargaCardAvatarText, isSelected && { color: '#1D4ED8' }]}>
                        {(w.nama || 'W').charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={[styles.wargaCardName, isSelected && { color: '#1D4ED8', fontWeight: '800' }]} numberOfLines={1}>
                        {w.nama}
                      </Text>
                      <Text style={styles.wargaCardSub} numberOfLines={1}>
                        Blok {w.blok}/{w.noRumah} • #{fullCode}
                      </Text>
                    </View>
                    {isSelected && <Check size={14} color="#1D4ED8" style={{ marginLeft: 4 }} />}
                  </TouchableOpacity>
                )
              })}
          </ScrollView>
        </View>

        {/* Langkah 2: Tingkat & Preset Pos Iuran */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>2. Tingkat & Pos Iuran *</Text>
          
          {Boolean(isRW) ? (
            <View style={styles.scopeToggleRow}>
              <TouchableOpacity
                style={[styles.scopeToggleBtn, manScope === 'RT' && styles.scopeToggleBtnActive]}
                onPress={() => {
                  setManScope('RT')
                  setManPosNama('Iuran Pengelolaan Lingkungan (IPL)')
                  setManTotal('120000')
                }}
              >
                <Text style={[styles.scopeToggleText, manScope === 'RT' && styles.scopeToggleTextActive]}>
                  🏘️ Iuran RT
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.scopeToggleBtn, manScope === 'RW' && styles.scopeToggleBtnActive]}
                onPress={() => {
                  setManScope('RW')
                  setManPosNama('Iuran Pembangunan & Fasum RW')
                  setManTotal('40000')
                }}
              >
                <Text style={[styles.scopeToggleText, manScope === 'RW' && styles.scopeToggleTextActive]}>
                  🏢 Iuran RW
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Preset Chips */}
          <Text style={[styles.miniLabel, { marginTop: 6 }]}>Pilih Cepat Pos Iuran:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', marginTop: 4 }}>
            {[
              { nama: 'IPL RT (Pokok)', nominal: '120000', scope: 'RT' },
              { nama: 'Iuran Fasum RW', nominal: '40000', scope: 'RW' },
              { nama: 'Iuran Sampah & Kebersihan', nominal: '30000', scope: 'RT' },
              { nama: 'Iuran Keamanan & Satpam', nominal: '50000', scope: 'RT' },
              { nama: 'Iuran Kegiatan Khusus', nominal: '25000', scope: 'RT' }
            ]
              .filter((p) => isRW || p.scope === 'RT')
              .map((p, idx) => {
                const isActive = manPosNama === p.nama && manTotal === p.nominal
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.presetChip, isActive && styles.presetChipActive]}
                    onPress={() => {
                      setManPosNama(p.nama)
                      setManTotal(p.nominal)
                      if (isRW) setManScope(p.scope)
                    }}
                  >
                    <Text style={[styles.presetChipText, isActive && styles.presetChipTextActive]}>
                      {p.nama} ({formatRupiah(p.nominal)})
                    </Text>
                  </TouchableOpacity>
                )
              })}
          </ScrollView>
        </View>

        {/* Langkah 3: Periode & Nominal Pokok */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.inputLabel}>Bulan (1-12) *</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="number-pad"
              value={manBulan}
              onChangeText={setManBulan}
              placeholder="10"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.inputLabel}>Tahun *</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="number-pad"
              value={manTahun}
              onChangeText={setManTahun}
              placeholder="2026"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Nominal Pokok Tagihan (Rp) *</Text>
          <TextInput
            style={styles.modalInput}
            keyboardType="number-pad"
            value={manTotal}
            onChangeText={setManTotal}
            placeholder="120000"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        {/* Live Calculation Preview Card */}
        {(() => {
          const selW = warga.find((w) => w.id === selectedWargaId) || scopedWarga?.[0] || {}
          const fullCode = getKodeUnikWarga(selW)
          const digitCode = getAngkaKodeUnik(selW)
          const previewTot = calculateTotalWithKodeUnik(manTotal || 0, selW)
          const targetScope = isRT ? 'RT' : manScope

          return (
            <View style={styles.manualPreviewBox}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <Sparkles size={14} color="#166534" />
                  <Text style={styles.manualPreviewTitle}>Rincian Tagihan Akhir Warga:</Text>
                </View>
                <View style={[styles.scopeSmallBadge, targetScope === 'RW' ? styles.badgeRw : styles.badgeRt]}>
                  <Text style={[styles.scopeSmallBadgeText, targetScope === 'RW' ? styles.textRw : styles.textRt]}>
                    {targetScope === 'RW' ? 'KAS RW 15' : 'KAS RT'}
                  </Text>
                </View>
              </View>

              <View style={styles.manualPreviewRow}>
                <Text style={styles.manualPreviewLabel}>Warga Penerima:</Text>
                <Text style={styles.manualPreviewVal}>{selW.nama || 'Pilih Warga'} (Blok {selW.blok || '-'}/{selW.noRumah || '-'})</Text>
              </View>
              <View style={styles.manualPreviewRow}>
                <Text style={styles.manualPreviewLabel}>Tarif Pokok ({manPosNama}):</Text>
                <Text style={styles.manualPreviewVal}>{formatRupiah(Math.floor((Number(manTotal) || 0) / 1000) * 1000)}</Text>
              </View>
              <View style={styles.manualPreviewRow}>
                <Text style={styles.manualPreviewLabel}>3 Digit Kode Unik ({fullCode}):</Text>
                <Text style={[styles.manualPreviewVal, { color: '#D97706', fontWeight: '800' }]}>+Rp {digitCode}</Text>
              </View>

              <View style={styles.manualPreviewDivider} />

              <View style={styles.manualPreviewRow}>
                <Text style={[styles.manualPreviewLabel, { fontWeight: '800', color: colors.textPrimary }]}>Total Tagihan:</Text>
                <Text style={styles.manualPreviewTotalVal}>{formatRupiah(previewTot)}</Text>
              </View>
            </View>
          )
        })()}

        {/* Langkah 4: Status Pembayaran Awal */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Status Tagihan Saat Dibuat:</Text>
          <View style={styles.statusToggleRow}>
            <TouchableOpacity
              style={[styles.statusToggleBtn, manStatus === 'Belum Bayar' && styles.statusToggleBtnUnpaid]}
              onPress={() => setManStatus('Belum Bayar')}
            >
              <Text style={[styles.statusToggleText, manStatus === 'Belum Bayar' && styles.statusToggleTextUnpaid]}>
                🔴 Belum Bayar (Kirim ke Warga)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.statusToggleBtn, manStatus === 'Lunas' && styles.statusToggleBtnPaid]}
              onPress={() => setManStatus('Lunas')}
            >
              <Text style={[styles.statusToggleText, manStatus === 'Lunas' && styles.statusToggleTextPaid]}>
                🟢 Sudah Lunas (Bayar Tunai)
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Catatan Tambahan (Opsional)</Text>
          <TextInput
            style={[styles.modalInput, { height: 50, textAlignVertical: 'top' }]}
            value={manCatatan}
            onChangeText={setManCatatan}
            placeholder="Keterangan tagihan khusus / catatan iuran..."
            placeholderTextColor={colors.textSecondary}
            multiline
          />
        </View>
      </AppModal>


      {/* ========================================================================= */}
      {/* MODAL 5: TAGIHAN BIASA / INSIDENTAL */}
      {/* ========================================================================= */}
      <AppModal
        visible={modalBiasaOpen}
        title="Tagihan Biasa / Insidental"
        onClose={() => setModalBiasaOpen(false)}
        footer={
          <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
            <View style={{ flex: 1 }}>
              <AppButton
                title="Batal"
                variant="secondary"
                onPress={() => setModalBiasaOpen(false)}
              />
            </View>
            <View style={{ flex: 1.4 }}>
              <AppButton
                title={biasaTarget === 'SEMUA' ? 'Terbitkan ke Semua' : 'Terbitkan'}
                variant="primary"
                loading={biasaLoading}
                icon={<Sparkles size={15} color={colors.surface} />}
                onPress={handleTerbitkanTagihanBiasa}
              />
            </View>
          </View>
        }
      >
        <View style={styles.modalStepBanner}>
          <Text style={styles.modalStepTitle}>
            Tagihan Non-Rutin / Kegiatan Khusus
          </Text>
          <Text style={styles.modalStepSubtitle}>
            Gunakan untuk iuran 17 Agustus, renovasi fasilitas, denda keterlambatan, atau sumbangan.
          </Text>
        </View>

        {/* Target Distribusi */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>1. Target Distribusi Tagihan *</Text>
          <View style={styles.scopeToggleRow}>
            <TouchableOpacity
              style={[styles.scopeToggleBtn, biasaTarget === 'SEMUA' && styles.scopeToggleBtnActive]}
              onPress={() => setBiasaTarget('SEMUA')}
            >
              <Text style={[styles.scopeToggleText, biasaTarget === 'SEMUA' && styles.scopeToggleTextActive]}>
                {isRT ? `👥 Ke Seluruh Warga ${rtLabel} (Massal)` : '👥 Ke SEMUA Warga RW (Massal)'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.scopeToggleBtn, biasaTarget === 'PERSONAL' && styles.scopeToggleBtnActive]}
              onPress={() => setBiasaTarget('PERSONAL')}
            >
              <Text style={[styles.scopeToggleText, biasaTarget === 'PERSONAL' && styles.scopeToggleTextActive]}>
                👤 Ke 1 Warga Tertentu
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Khusus RW: Tingkat Tagihan */}
        {Boolean(isRW) ? (
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Tingkat Tagihan *</Text>
            <View style={styles.scopeToggleRow}>
              <TouchableOpacity
                style={[styles.scopeToggleBtn, biasaScope === 'RT' && styles.scopeToggleBtnActive]}
                onPress={() => setBiasaScope('RT')}
              >
                <Text style={[styles.scopeToggleText, biasaScope === 'RT' && styles.scopeToggleTextActive]}>
                  🏘️ Tingkat RT
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.scopeToggleBtn, biasaScope === 'RW' && styles.scopeToggleBtnActive]}
                onPress={() => setBiasaScope('RW')}
              >
                <Text style={[styles.scopeToggleText, biasaScope === 'RW' && styles.scopeToggleTextActive]}>
                  🏢 Tingkat RW
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {/* Jika Personal: Pilih Warga */}
        {Boolean(biasaTarget === 'PERSONAL') ? (
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Pilih Warga Tujuan *</Text>
            <View style={styles.wargaSearchInputWrap}>
              <Search size={14} color={colors.textSecondary} style={{ marginRight: 6 }} />
              <TextInput
                style={styles.wargaSearchInput}
                placeholder="Cari nama atau blok warga..."
                placeholderTextColor={colors.textSecondary}
                value={manWargaSearch}
                onChangeText={setManWargaSearch}
              />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', marginTop: 8 }}>
              {(isRT ? scopedWarga : warga)
                .filter((w) => {
                  if (!manWargaSearch.trim()) return true
                  const q = manWargaSearch.toLowerCase()
                  return (w.nama || '').toLowerCase().includes(q) || `${w.blok || ''}/${w.noRumah || ''}`.toLowerCase().includes(q)
                })
                .map((w) => {
                  const isSel = selectedWargaId === w.id
                  return (
                    <TouchableOpacity
                      key={w.id}
                      style={[styles.wargaCardSelect, isSel && styles.wargaCardSelectActive]}
                      onPress={() => setSelectedWargaId(w.id)}
                    >
                      <Text style={[styles.wargaCardName, isSel && { color: '#1D4ED8', fontWeight: '800' }]}>{w.nama}</Text>
                      <Text style={styles.wargaCardSub}>Blok {w.blok}/{w.noRumah}</Text>
                    </TouchableOpacity>
                  )
                })}
            </ScrollView>
          </View>
        ) : null}

        {/* Nama Tagihan Biasa */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Nama Tagihan *</Text>
          <TextInput
            style={styles.modalInput}
            value={biasaNama}
            onChangeText={setBiasaNama}
            placeholder="Contoh: Iuran HUT RI ke-81 / Perbaikan Saluran"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        {/* Nominal Pokok */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Nominal Pokok per Warga (Rp) *</Text>
          <TextInput
            style={styles.modalInput}
            keyboardType="number-pad"
            value={biasaNominal}
            onChangeText={setBiasaNominal}
            placeholder="50000"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        {/* Periode Bulan & Tahun */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.inputLabel}>Bulan (1-12) *</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="number-pad"
              value={biasaBulan}
              onChangeText={setBiasaBulan}
              placeholder="10"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.inputLabel}>Tahun *</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="number-pad"
              value={biasaTahun}
              onChangeText={setBiasaTahun}
              placeholder="2026"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
        </View>

        {/* Info Kode Unik */}
        <View style={styles.mootaNoticeBox}>
          <Text style={styles.mootaNoticeText}>
            ✨ <Text style={{ fontWeight: '700' }}>3 Digit Kode Unik:</Text> Setiap warga otomatis mendapatkan 3 digit kode unik di belakang nominal untuk pencocokan mutasi bank / Moota.
          </Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Catatan Tambahan (Opsional)</Text>
          <TextInput
            style={[styles.modalInput, { height: 50, textAlignVertical: 'top' }]}
            value={biasaCatatan}
            onChangeText={setBiasaCatatan}
            placeholder="Keterangan tagihan..."
            placeholderTextColor={colors.textSecondary}
            multiline
          />
        </View>
      </AppModal>

      {/* ========================================================================= */}
      {/* MODAL 6: EDIT TAGIHAN */}
      {/* ========================================================================= */}
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
        {editingTagihan ? (
          <>
            <View style={styles.modalStepBanner}>
              <Text style={styles.modalStepTitle}>
                {editingTagihan.namaWarga || 'Warga'} (Blok {editingTagihan.blok}/{editingTagihan.noRumah})
              </Text>
              <Text style={styles.modalStepSubtitle}>
                ID Tagihan: {editingTagihan.id} • Kode Unik: {editingTagihan.kodeUnik || '-'}
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nama Tagihan / Pos *</Text>
              <TextInput
                style={styles.modalInput}
                value={editNamaPos}
                onChangeText={setEditNamaPos}
                placeholder="IPL Warga"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nominal Pokok (Rp) *</Text>
              <TextInput
                style={styles.modalInput}
                keyboardType="number-pad"
                value={editNominal}
                onChangeText={setEditNominal}
                placeholder="120000"
                placeholderTextColor={colors.textSecondary}
              />
              <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 4 }}>
                Total tagihan akhir akan otomatis ditambahkan 3 digit kode unik warga ({editingTagihan.kodeUnik || '-'}).
              </Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Bulan (1-12) *</Text>
                <TextInput
                  style={styles.modalInput}
                  keyboardType="number-pad"
                  value={editBulan}
                  onChangeText={setEditBulan}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Tahun *</Text>
                <TextInput
                  style={styles.modalInput}
                  keyboardType="number-pad"
                  value={editTahun}
                  onChangeText={setEditTahun}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Status Tagihan *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', marginTop: 4 }}>
                {['Belum Bayar', 'Menunggu Verifikasi', 'Perlu Diperbaiki', 'Lunas'].map((st) => (
                  <TouchableOpacity
                    key={st}
                    style={[styles.statusOptionChip, editStatus === st && styles.statusOptionChipActive]}
                    onPress={() => setEditStatus(st)}
                  >
                    <Text style={[styles.statusOptionChipText, editStatus === st && styles.statusOptionChipTextActive]}>
                      {st}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Catatan</Text>
              <TextInput
                style={[styles.modalInput, { height: 50, textAlignVertical: 'top' }]}
                value={editCatatan}
                onChangeText={setEditCatatan}
                placeholder="Catatan tagihan..."
                placeholderTextColor={colors.textSecondary}
                multiline
              />
            </View>
          </>
        ) : null}
      </AppModal>

      {/* ========================================================================= */}
      {/* MODAL 7: KELOLA MASTER POS IURAN */}
      {/* ========================================================================= */}
      <AppModal
        visible={modalMasterOpen}
        title="Kelola Master Pos Iuran"
        onClose={() => {
          setModalMasterOpen(false)
          setMasterFormOpen(false)
        }}
        footer={
          <AppButton
            title="Tutup"
            variant="secondary"
            onPress={() => {
              setModalMasterOpen(false)
              setMasterFormOpen(false)
            }}
          />
        }
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textPrimary }}>
            Daftar Pos Tarif Iuran Rutin
          </Text>
          <TouchableOpacity
            style={styles.addPosBtn}
            onPress={() => {
              setEditingMasterPos(null)
              setMasterNama('')
              setMasterNominal('')
              setMasterKeterangan('')
              setMasterFormOpen(true)
            }}
          >
            <Plus size={14} color="#FFFFFF" />
            <Text style={styles.addPosBtnText}>Tambah Pos</Text>
          </TouchableOpacity>
        </View>

        {masterFormOpen ? (
          <View style={styles.masterFormBox}>
            <Text style={styles.masterFormTitle}>
              {editingMasterPos ? 'Edit Pos Iuran' : 'Tambah Pos Iuran Baru'}
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.miniLabel}>Nama Pos Iuran *</Text>
              <TextInput
                style={styles.modalInput}
                value={masterNama}
                onChangeText={setMasterNama}
                placeholder="Contoh: Iuran Keamanan / Fasum"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.miniLabel}>Tarif per KK (Rp) *</Text>
              <TextInput
                style={styles.modalInput}
                keyboardType="number-pad"
                value={masterNominal}
                onChangeText={setMasterNominal}
                placeholder="35000"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            {Boolean(isRW) ? (
              <View style={styles.inputGroup}>
                <Text style={styles.miniLabel}>Lingkup Pos Iuran</Text>
                <View style={styles.scopeToggleRow}>
                  <TouchableOpacity
                    style={[styles.scopeToggleBtn, masterScope === 'RT' && styles.scopeToggleBtnActive]}
                    onPress={() => setMasterScope('RT')}
                  >
                    <Text style={[styles.scopeToggleText, masterScope === 'RT' && styles.scopeToggleTextActive]}>
                      RT
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.scopeToggleBtn, masterScope === 'RW' && styles.scopeToggleBtnActive]}
                    onPress={() => setMasterScope('RW')}
                  >
                    <Text style={[styles.scopeToggleText, masterScope === 'RW' && styles.scopeToggleTextActive]}>
                      RW
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={styles.miniLabel}>Keterangan (Opsional)</Text>
              <TextInput
                style={styles.modalInput}
                value={masterKeterangan}
                onChangeText={setMasterKeterangan}
                placeholder="Keterangan alokasi dana..."
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
              <TouchableOpacity
                style={[styles.button, { flex: 1, backgroundColor: '#F2F4F7' }]}
                onPress={() => setMasterFormOpen(false)}
              >
                <Text style={{ fontWeight: '600', color: colors.textSecondary }}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, { flex: 1.5, backgroundColor: colors.primary }]}
                onPress={handleSimpanMasterPos}
              >
                <Text style={{ fontWeight: '700', color: '#FFFFFF' }}>Simpan Pos</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {/* List of master pos */}
        <View style={{ gap: 8 }}>
          {jenisIuran.map((pos) => {
            const isPosRw = pos.payment_scope === 'RW'
            return (
              <View key={pos.id} style={styles.masterPosItem}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <View style={[styles.scopeSmallBadge, isPosRw ? styles.badgeRw : styles.badgeRt]}>
                      <Text style={[styles.scopeSmallBadgeText, isPosRw ? styles.textRw : styles.textRt]}>
                        {isPosRw ? 'RW' : 'RT'}
                      </Text>
                    </View>
                    <Text style={styles.masterPosName} numberOfLines={1}>
                      {pos.nama}
                    </Text>
                  </View>
                  <Text style={styles.masterPosNominal}>
                    {formatRupiah(pos.nominal)} / bulan
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <TouchableOpacity
                    style={styles.masterPosActionBtn}
                    onPress={() => {
                      setEditingMasterPos(pos)
                      setMasterNama(pos.nama)
                      setMasterNominal(String(pos.nominal))
                      setMasterScope(pos.payment_scope || 'RT')
                      setMasterKeterangan(pos.keterangan || '')
                      setMasterFormOpen(true)
                    }}
                  >
                    <Edit3 size={14} color="#4F46E5" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.masterPosActionBtn, { borderColor: '#FEE2E2', backgroundColor: '#FEF2F2' }]}
                    onPress={() => handleHapusMasterPos(pos)}
                  >
                    <Trash2 size={14} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              </View>
            )
          })}
        </View>
      </AppModal>

      {/* Kwitansi Resmi / Digital */}
      <ReceiptModal
        visible={!!kwitansiModal}
        onClose={() => setKwitansiModal(null)}
        tagihan={kwitansiModal}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  filterSection: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: 4
  },
  scopeSegmentRow: {
    flexDirection: 'row',
    backgroundColor: '#EAECF0',
    borderRadius: radius.md,
    padding: 3,
    marginBottom: spacing.sm
  },
  scopeSegBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: radius.sm
  },
  scopeSegBtnActive: {
    backgroundColor: colors.surface,
    ...shadows.soft
  },
  scopeSegText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary
  },
  scopeSegTextActive: {
    color: colors.primary,
    fontWeight: '700'
  },
  periodToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm
  },
  periodToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary
  },
  periodRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm
  },
  bulanChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    marginRight: 6,
    borderWidth: 1,
    borderColor: colors.border
  },
  bulanChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  bulanChipText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600'
  },
  bulanChipTextActive: {
    color: colors.surface,
    fontWeight: '700'
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    height: 44,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xs
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.textPrimary
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    marginRight: 6,
    borderWidth: 1,
    borderColor: colors.border
  },
  filterChipActive: {
    backgroundColor: colors.primarySubtle,
    borderColor: colors.primary
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary
  },
  filterChipTextActive: {
    color: colors.primary,
    fontWeight: '700'
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.xs
  },
  wargaName: {
    ...typography.cardTitle,
    flex: 1
  },
  wargaBlok: {
    ...typography.caption,
    marginTop: 2
  },
  itemRejectBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: radius.sm,
    padding: spacing.xs,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginVertical: spacing.xs
  },
  itemRejectTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.danger
  },
  itemRejectDesc: {
    fontSize: 11,
    color: '#991B1B',
    marginTop: 2
  },
  amountContainer: {
    marginVertical: spacing.xs,
    paddingVertical: spacing.xs,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.borderLight
  },
  amountVal: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.3
  },
  kwitansiNo: {
    fontSize: 11,
    color: colors.success,
    fontWeight: '600',
    marginTop: 2
  },
  dueDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2
  },
  dueDateText: {
    ...typography.caption
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    rowGap: 8,
    marginTop: spacing.xs
  },
  iconActionBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border
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
  actionOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.sm
  },
  actionOptionTitle: {
    fontSize: 14,
    fontWeight: '700'
  },
  actionOptionSub: {
    ...typography.caption,
    marginTop: 2
  },
  modalSubtitle: {
    ...typography.bodySecondary,
    marginBottom: spacing.md
  },
  guideBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    backgroundColor: '#EFF6FF',
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: spacing.md
  },
  guideBannerTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E40AF'
  },
  guideBannerDesc: {
    fontSize: 11,
    color: '#1E3A8A',
    marginTop: 2,
    lineHeight: 15
  },
  inputGroup: {
    marginBottom: spacing.md
  },
  inputLabel: {
    ...typography.label,
    marginBottom: 6
  },
  miniLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 4
  },
  modalInput: {
    height: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    fontSize: 13,
    color: colors.textPrimary,
    backgroundColor: colors.surface
  },
  scopeToggleRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2
  },
  scopeToggleBtn: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center'
  },
  scopeToggleBtnActive: {
    backgroundColor: '#EEF2FF',
    borderColor: colors.primary
  },
  scopeToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary
  },
  scopeToggleTextActive: {
    color: colors.primary,
    fontWeight: '700'
  },
  scopeToggleSub: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2
  },
  quickPeriodRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6
  },
  quickPeriodChip: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: radius.sm,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center'
  },
  quickPeriodChipActive: {
    backgroundColor: '#FEF2F2',
    borderColor: colors.primary
  },
  quickPeriodChipText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600'
  },
  quickPeriodChipTextActive: {
    color: colors.primary,
    fontWeight: '700'
  },
  genSummaryBox: {
    backgroundColor: '#F0FDF4',
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginTop: spacing.xs
  },
  genSummaryTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D'
  },
  genSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2
  },
  genSummaryLabel: {
    fontSize: 11,
    color: '#166534'
  },
  genSummaryVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#14532D'
  },
  mootaNoticeBox: {
    backgroundColor: '#FEFCE8',
    borderRadius: radius.sm,
    padding: spacing.xs,
    borderWidth: 1,
    borderColor: '#FEF08A',
    marginTop: 8
  },
  mootaNoticeText: {
    fontSize: 10.5,
    color: '#854D0E',
    lineHeight: 14
  },
  wargaSearchInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    height: 40
  },
  wargaSearchInput: {
    flex: 1,
    fontSize: 12,
    color: colors.textPrimary
  },
  wargaCardSelect: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 8,
    marginRight: 8,
    width: 170
  },
  wargaCardSelectActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6'
  },
  wargaCardAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6
  },
  wargaCardAvatarText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary
  },
  wargaCardName: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.textPrimary
  },
  wargaCardSub: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 1
  },
  presetChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 6
  },
  presetChipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: colors.primary
  },
  presetChipText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600'
  },
  presetChipTextActive: {
    color: colors.primary,
    fontWeight: '700'
  },
  manualPreviewBox: {
    backgroundColor: '#F0FDF4',
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: spacing.md
  },
  manualPreviewTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534'
  },
  manualPreviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2
  },
  manualPreviewLabel: {
    fontSize: 11,
    color: '#166534'
  },
  manualPreviewVal: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#14532D'
  },
  manualPreviewDivider: {
    height: 1,
    backgroundColor: '#BBF7D0',
    marginVertical: 4
  },
  manualPreviewTotalVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#15803D'
  },
  scopeSmallBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs
  },
  badgeRw: {
    backgroundColor: '#FEF3C7'
  },
  badgeRt: {
    backgroundColor: '#DCFCE7'
  },
  textRw: {
    color: '#B45309',
    fontSize: 9.5,
    fontWeight: '800'
  },
  textRt: {
    color: '#15803D',
    fontSize: 9.5,
    fontWeight: '800'
  },
  statusToggleRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2
  },
  statusToggleBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center'
  },
  statusToggleBtnUnpaid: {
    backgroundColor: '#FEF2F2',
    borderColor: colors.danger
  },
  statusToggleBtnPaid: {
    backgroundColor: '#F0FDF4',
    borderColor: colors.success
  },
  statusToggleText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary
  },
  statusToggleTextUnpaid: {
    color: colors.danger,
    fontWeight: '700'
  },
  statusToggleTextPaid: {
    color: colors.success,
    fontWeight: '700'
  },
  kwitansiCard: {
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md
  },
  kwitansiTitle: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center'
  },
  kwitansiLingkungan: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 2
  },
  kwitansiDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm
  },
  kwitansiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 3
  },
  kwitansiLabel: {
    ...typography.caption
  },
  kwitansiValue: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary
  },
  kwitansiStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6
  },
  kwitansiStatusText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.success
  },
  cardSelected: {
    borderColor: colors.primary,
    borderWidth: 1.5,
    backgroundColor: '#F8FAFC'
  },
  cardCheckboxBtn: {
    paddingRight: 10,
    paddingTop: 2,
    justifyContent: 'center'
  },
  selectionHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EEF2FF',
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    marginBottom: spacing.xs
  },
  selectionHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary
  },
  selectionHeaderBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border
  },
  selectionHeaderBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary
  },
  selectionTriggerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    marginBottom: 4
  },
  selectionTriggerHint: {
    fontSize: 11.5,
    color: colors.textSecondary
  },
  selectionTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#C7D2FE'
  },
  selectionTriggerBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary
  },
  bottomSelectionBar: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
    elevation: 8
  },
  bottomSelectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary
  },
  bottomSelectionSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1
  },
  bulkDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.danger,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: radius.md
  },
  bulkDeleteBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.surface
  },
  bulkDeleteAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: radius.md
  },
  bulkDeleteAllBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.danger
  },
  posCheckboxCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FAFAFA',
    marginBottom: 6
  },
  posCheckboxCardActive: {
    borderColor: '#FECDD3',
    backgroundColor: '#FFF1F2'
  },
  posCheckboxName: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '600'
  },
  posCheckboxDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1
  },
  posCheckboxNominal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4B5563',
    marginLeft: 8
  },
  statusOptionChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    marginRight: 6
  },
  statusOptionChipActive: {
    borderColor: colors.primary,
    backgroundColor: '#FFF1F2'
  },
  statusOptionChipText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600'
  },
  statusOptionChipTextActive: {
    color: colors.primary,
    fontWeight: '700'
  },
  addPosBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.sm
  },
  addPosBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#FFFFFF'
  },
  masterFormBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12
  },
  masterFormTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 8
  },
  masterPosItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: radius.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  masterPosName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary
  },
  masterPosNominal: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2
  },
  masterPosActionBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E7FF',
    backgroundColor: '#EEF2FF'
  },
  mootaQuickSyncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFBEB',
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    borderRadius: radius.md,
    paddingVertical: 9,
    paddingHorizontal: 12,
    marginBottom: 8,
    ...shadows.sm
  },
  mootaQuickSyncText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#92400E'
  }
})

