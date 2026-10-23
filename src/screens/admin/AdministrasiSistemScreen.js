import React, { useState, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  useWindowDimensions
} from 'react-native'
import {
  ShieldAlert,
  Building2,
  Home,
  Plus,
  Trash2,
  Edit3,
  RefreshCw,
  AlertTriangle,
  Wallet,
  CheckCircle2,
  Search,
  ChevronRight,
  Layers,
  MapPin,
  Phone,
  UserCheck,
  XCircle,
  HelpCircle,
  Cpu
} from 'lucide-react-native'
import { useApp } from '../../context/AppContext'
import TopAppBar from '../../components/layout/TopAppBar'
import AppCard from '../../components/shared/AppCard'
import AppButton from '../../components/shared/AppButton'
import AppModal from '../../components/modals/AppModal'
import { formatRupiah } from '../../utils/format'
import { colors, typography, spacing, radius, shadows } from '../../utils/theme'

export default function AdministrasiSistemScreen({ navigation }) {
  const {
    isAdmin,
    currentUser,
    rws = [],
    rts = [],
    warga = [],
    kas = [],
    users = [],
    addRwData,
    updateRwData,
    deleteRwData,
    addRtData,
    updateRtData,
    deleteRtData,
    resetDataWargaDanWilayah,
    resetKasLingkunganNol
  } = useApp()

  const { width } = useWindowDimensions()
  const isSmallScreen = width < 380

  // Tab Utama: 'wilayah' | 'reset'
  const [activeTab, setActiveTab] = useState('wilayah')

  // Sub-Tab Wilayah: 'rw' | 'rt'
  const [wilayahScope, setWilayahScope] = useState('rw')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRwFilter, setSelectedRwFilter] = useState('ALL')

  // Modal State untuk CRUD RW
  const [rwModalOpen, setRwModalOpen] = useState(false)
  const [editingRw, setEditingRw] = useState(null)
  const [formRwNumber, setFormRwNumber] = useState('')
  const [formRwName, setFormRwName] = useState('')
  const [formRwKetua, setFormRwKetua] = useState('')
  const [formRwBendahara, setFormRwBendahara] = useState('')
  const [formRwKontak, setFormRwKontak] = useState('')
  const [formRwKeterangan, setFormRwKeterangan] = useState('')
  const [rwKetuaPickerOpen, setRwKetuaPickerOpen] = useState(false)
  const [wargaSearchRw, setWargaSearchRw] = useState('')

  // Modal State untuk CRUD RT
  const [rtModalOpen, setRtModalOpen] = useState(false)
  const [editingRt, setEditingRt] = useState(null)
  const [formRtRwId, setFormRtRwId] = useState(rws[0]?.id || 'rw-01')
  const [formRtNumber, setFormRtNumber] = useState('')
  const [formRtName, setFormRtName] = useState('')
  const [formRtKetua, setFormRtKetua] = useState('')
  const [formRtBendahara, setFormRtBendahara] = useState('')
  const [formRtKontak, setFormRtKontak] = useState('')
  const [formRtKeterangan, setFormRtKeterangan] = useState('')
  const [rtKetuaPickerOpen, setRtKetuaPickerOpen] = useState(false)
  const [wargaSearchRt, setWargaSearchRt] = useState('')

  // Modal State untuk Konfirmasi Reset
  const [resetWargaModalOpen, setResetWargaModalOpen] = useState(false)
  const [resetKasModalOpen, setResetKasModalOpen] = useState(false)
  const [confirmKasChecked, setConfirmKasChecked] = useState(false)
  const [loadingAction, setLoadingAction] = useState(false)

  // Hitung total saldo kas saat ini
  const saldoKas = useMemo(() => {
    return (kas || []).reduce((acc, k) => {
      const isMasuk = k.tipe === 'Masuk' || k.tipe === 'Pemasukan'
      return isMasuk ? acc + (k.nominal || 0) : acc - (k.nominal || 0)
    }, 0)
  }, [kas])

  // ===================== KEAMANAN: HANYA ADMIN IT =====================
  const isAuthorized = isAdmin || currentUser?.role === 'admin'
  if (!isAuthorized) {
    return (
      <View style={styles.container}>
        <TopAppBar title="Administrasi Sistem" navigation={navigation} />
        <View style={styles.restrictedWrap}>
          <View style={styles.restrictedIconCircle}>
            <ShieldAlert size={48} color="#DC2626" />
          </View>
          <Text style={styles.restrictedTitle}>Akses Khusus Admin IT</Text>
          <Text style={styles.restrictedDesc}>
            Halaman ini memuat kendali master wilayah dan instrumen reset database. Akses ditolak untuk role selain Administrator Sistem.
          </Text>
          <AppButton
            title="Kembali ke Beranda"
            variant="primary"
            onPress={() => navigation.goBack()}
          />
        </View>
      </View>
    )
  }

  // ===================== KANDIDAT DATABASE UNTUK KETUA RW / RT =====================
  const candidateList = useMemo(() => {
    const list = []
    const seen = new Set()

    // 1. Ambil dari database Warga
    ;(warga || []).forEach((w) => {
      const cleanName = (w.nama || '').trim()
      if (cleanName && !seen.has(cleanName.toLowerCase())) {
        seen.add(cleanName.toLowerCase())
        const targetRw = rws.find((r) => r.id === w.rw_id)
        const targetRt = rts.find((r) => r.id === w.rt_id)
        const lok = [
          w.blok ? `Blok ${w.blok}${w.noRumah ? `/${w.noRumah}` : ''}` : '',
          targetRt?.name || targetRw?.name || ''
        ]
          .filter(Boolean)
          .join(' • ')

        list.push({
          id: w.id || `w-${cleanName}`,
          nama: cleanName,
          sub: lok || 'Warga Terdaftar',
          kontak: w.noHp || w.telepon || '',
          rw_id: w.rw_id,
          rt_id: w.rt_id,
          tag: 'Warga'
        })
      }
    })

    // 2. Ambil dari database Users (pengurus/pejabat)
    ;(users || []).forEach((u) => {
      const cleanName = (u.name || '').replace(/\(.*\)/, '').trim()
      if (cleanName && !seen.has(cleanName.toLowerCase()) && u.role !== 'admin') {
        seen.add(cleanName.toLowerCase())
        list.push({
          id: u.id || `u-${cleanName}`,
          nama: cleanName,
          sub: `Akun ${u.role?.toUpperCase() || 'User'}`,
          kontak: u.phone || '',
          rw_id: u.rw_id,
          rt_id: u.rt_id,
          tag: 'Pengurus'
        })
      }
    })

    // 3. Ambil dari data RW yang sudah ada
    ;(rws || []).forEach((r) => {
      const cleanName = (r.ketua || '').trim()
      if (cleanName && !seen.has(cleanName.toLowerCase())) {
        seen.add(cleanName.toLowerCase())
        list.push({
          id: `rw-ketua-${r.id}`,
          nama: cleanName,
          sub: `Ketua ${r.name}`,
          kontak: r.kontak || '',
          rw_id: r.id,
          tag: 'Ketua RW'
        })
      }
    })

    // 4. Ambil dari data RT yang sudah ada
    ;(rts || []).forEach((r) => {
      const cleanName = (r.ketua || '').trim()
      if (cleanName && !seen.has(cleanName.toLowerCase())) {
        seen.add(cleanName.toLowerCase())
        list.push({
          id: `rt-ketua-${r.id}`,
          nama: cleanName,
          sub: `Ketua ${r.name}`,
          kontak: r.kontak || '',
          rw_id: r.rw_id,
          rt_id: r.id,
          tag: 'Ketua RT'
        })
      }
    })

    return list
  }, [warga, users, rws, rts])

  const filteredRwCandidates = useMemo(() => {
    if (!wargaSearchRw.trim()) return candidateList.slice(0, 30)
    const q = wargaSearchRw.toLowerCase().trim()
    return candidateList
      .filter(
        (c) =>
          c.nama.toLowerCase().includes(q) ||
          (c.sub && c.sub.toLowerCase().includes(q)) ||
          (c.kontak && c.kontak.includes(q))
      )
      .slice(0, 30)
  }, [candidateList, wargaSearchRw])

  const filteredRtCandidates = useMemo(() => {
    let base = candidateList
    if (formRtRwId) {
      const sameRw = base.filter((c) => c.rw_id === formRtRwId)
      const otherRw = base.filter((c) => c.rw_id !== formRtRwId)
      base = [...sameRw, ...otherRw]
    }
    if (!wargaSearchRt.trim()) return base.slice(0, 30)
    const q = wargaSearchRt.toLowerCase().trim()
    return base
      .filter(
        (c) =>
          c.nama.toLowerCase().includes(q) ||
          (c.sub && c.sub.toLowerCase().includes(q)) ||
          (c.kontak && c.kontak.includes(q))
      )
      .slice(0, 30)
  }, [candidateList, wargaSearchRt, formRtRwId])

  const handleSelectRwKetua = (cand) => {
    setFormRwKetua(cand.nama)
    if (cand.kontak && !formRwKontak.trim()) {
      setFormRwKontak(cand.kontak)
    }
    setRwKetuaPickerOpen(false)
  }

  const handleSelectRtKetua = (cand) => {
    setFormRtKetua(cand.nama)
    if (cand.kontak && !formRtKontak.trim()) {
      setFormRtKontak(cand.kontak)
    }
    setRtKetuaPickerOpen(false)
  }

  // ===================== HANDLER RW =====================
  const handleOpenAddRw = () => {
    setEditingRw(null)
    const nextSeq = String(rws.length + 1).padStart(2, '0')
    setFormRwNumber(nextSeq)
    setFormRwName(`RW ${nextSeq}`)
    setFormRwKetua('')
    setFormRwBendahara('')
    setFormRwKontak('')
    setFormRwKeterangan(`Wilayah RW ${nextSeq}`)
    setRwKetuaPickerOpen(false)
    setWargaSearchRw('')
    setRwModalOpen(true)
  }

  const handleOpenEditRw = (rw) => {
    setEditingRw(rw)
    setFormRwNumber(rw.number || rw.id?.replace('rw-', '') || '')
    setFormRwName(rw.name || `RW ${rw.number}`)
    setFormRwKetua(rw.ketua || '')
    setFormRwBendahara(rw.bendahara || '')
    setFormRwKontak(rw.kontak || '')
    setFormRwKeterangan(rw.keterangan || '')
    setRwKetuaPickerOpen(false)
    setWargaSearchRw('')
    setRwModalOpen(true)
  }

  const handleSaveRw = async () => {
    if (!formRwNumber.trim()) {
      Alert.alert('Perhatian', 'Nomor RW wajib diisi!')
      return
    }
    if (!formRwName.trim()) {
      Alert.alert('Perhatian', 'Nama RW wajib diisi!')
      return
    }

    try {
      if (editingRw) {
        await updateRwData(editingRw.id, {
          name: formRwName.trim(),
          number: formRwNumber.trim().padStart(2, '0'),
          ketua: formRwKetua.trim(),
          bendahara: formRwBendahara.trim(),
          kontak: formRwKontak.trim(),
          keterangan: formRwKeterangan.trim()
        })
        Alert.alert('Sukses', `Data ${formRwName} berhasil diperbarui!`)
      } else {
        const res = await addRwData({
          number: formRwNumber.trim().padStart(2, '0'),
          name: formRwName.trim(),
          ketua: formRwKetua.trim(),
          bendahara: formRwBendahara.trim(),
          kontak: formRwKontak.trim(),
          keterangan: formRwKeterangan.trim()
        })
        if (!res.success) {
          Alert.alert('Gagal', res.message || 'Gagal menambahkan RW.')
          return
        }
        Alert.alert('Sukses', `Wilayah ${formRwName} berhasil ditambahkan!`)
      }
      setRwModalOpen(false)
    } catch (e) {
      Alert.alert('Error', 'Terjadi kesalahan saat menyimpan data RW.')
    }
  }

  const handleDeleteRw = (rw) => {
    const attachedCount = rts.filter((r) => r.rw_id === rw.id).length
    if (attachedCount > 0) {
      Alert.alert(
        'Tidak Dapat Menghapus',
        `Wilayah ${rw.name} masih membawahi ${attachedCount} RT aktif. Silakan hapus atau pindahkan seluruh RT di bawah RW ini terlebih dahulu.`
      )
      return
    }

    Alert.alert(
      'Hapus Wilayah RW',
      `Yakin ingin menghapus ${rw.name}? Data wilayah ini akan dihapus dari sistem.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus RW',
          style: 'destructive',
          onPress: async () => {
            const res = await deleteRwData(rw.id)
            if (!res.success) {
              Alert.alert('Peringatan', res.message || 'Gagal menghapus RW.')
            } else {
              Alert.alert('Sukses', `Wilayah ${rw.name} berhasil dihapus.`)
            }
          }
        }
      ]
    )
  }

  // ===================== HANDLER RT =====================
  const handleOpenAddRt = () => {
    setEditingRt(null)
    const targetRwId = selectedRwFilter !== 'ALL' ? selectedRwFilter : (rws[0]?.id || 'rw-01')
    setFormRtRwId(targetRwId)
    const targetRw = rws.find((r) => r.id === targetRwId)
    const nextSeq = String(rts.filter((r) => r.rw_id === targetRwId).length + 1).padStart(2, '0')
    setFormRtNumber(nextSeq)
    setFormRtName(`RT ${nextSeq} / ${targetRw?.name || 'RW 01'}`)
    setFormRtKetua('')
    setFormRtBendahara('')
    setFormRtKontak('')
    setFormRtKeterangan(`Mencakup warga RT ${nextSeq}`)
    setRtKetuaPickerOpen(false)
    setWargaSearchRt('')
    setRtModalOpen(true)
  }

  const handleOpenEditRt = (rt) => {
    setEditingRt(rt)
    setFormRtRwId(rt.rw_id || rws[0]?.id || 'rw-01')
    setFormRtNumber(rt.number || '')
    setFormRtName(rt.name || `RT ${rt.number}`)
    setFormRtKetua(rt.ketua || '')
    setFormRtBendahara(rt.bendahara || '')
    setFormRtKontak(rt.kontak || '')
    setFormRtKeterangan(rt.keterangan || '')
    setRtKetuaPickerOpen(false)
    setWargaSearchRt('')
    setRtModalOpen(true)
  }

  const handleSaveRt = async () => {
    if (!formRtNumber.trim()) {
      Alert.alert('Perhatian', 'Nomor RT wajib diisi!')
      return
    }
    if (!formRtName.trim()) {
      Alert.alert('Perhatian', 'Nama RT wajib diisi!')
      return
    }

    try {
      if (editingRt) {
        const targetRw = rws.find((r) => r.id === formRtRwId)
        await updateRtData(editingRt.id, {
          rw_id: formRtRwId,
          rw: targetRw?.name || 'RW 01',
          rw_number: targetRw?.number || '01',
          number: formRtNumber.trim().padStart(2, '0'),
          name: formRtName.trim(),
          ketua: formRtKetua.trim(),
          bendahara: formRtBendahara.trim(),
          kontak: formRtKontak.trim(),
          keterangan: formRtKeterangan.trim()
        })
        Alert.alert('Sukses', `Data ${formRtName} berhasil diperbarui!`)
      } else {
        const res = await addRtData({
          rw_id: formRtRwId,
          number: formRtNumber.trim().padStart(2, '0'),
          name: formRtName.trim(),
          ketua: formRtKetua.trim(),
          bendahara: formRtBendahara.trim(),
          kontak: formRtKontak.trim(),
          keterangan: formRtKeterangan.trim()
        })
        if (!res.success) {
          Alert.alert('Gagal', res.message || 'Gagal menambahkan RT.')
          return
        }
        Alert.alert('Sukses', `Data ${formRtName} berhasil ditambahkan!`)
      }
      setRtModalOpen(false)
    } catch (e) {
      Alert.alert('Error', 'Terjadi kesalahan saat menyimpan data RT.')
    }
  }

  const handleDeleteRt = (rt) => {
    Alert.alert(
      'Hapus Wilayah RT',
      `Yakin ingin menghapus ${rt.name}? Pastikan tidak ada tagihan atau warga yang tertaut.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus RT',
          style: 'destructive',
          onPress: async () => {
            const res = await deleteRtData(rt.id)
            if (!res.success) {
              Alert.alert('Peringatan', res.message || 'Gagal menghapus RT.')
            } else {
              Alert.alert('Sukses', `Data ${rt.name} berhasil dihapus.`)
            }
          }
        }
      ]
    )
  }

  // ===================== HANDLER RESET =====================
  const handleExecuteResetWarga = async () => {
    setLoadingAction(true)
    try {
      await resetDataWargaDanWilayah()
      setResetWargaModalOpen(false)
      Alert.alert(
        '🎉 Reset Data Warga Berhasil',
        'Seluruh data warga, RT, RW, dan tagihan telah dikembalikan ke data default pabrik.'
      )
    } catch (e) {
      Alert.alert('Error', 'Gagal mereset data warga.')
    } finally {
      setLoadingAction(false)
    }
  }

  const handleExecuteResetKas = async () => {
    if (!confirmKasChecked) {
      Alert.alert('Peringatan', 'Harap centang konfirmasi pengosongan kas terlebih dahulu!')
      return
    }

    setLoadingAction(true)
    try {
      await resetKasLingkunganNol()
      setResetKasModalOpen(false)
      setConfirmKasChecked(false)
      Alert.alert(
        '🎉 Reset Kas Berhasil',
        'Saldo kas seluruh lingkungan (semua RW & RT) dan catatan transaksi telah dikosongkan hingga Rp 0.'
      )
    } catch (e) {
      Alert.alert('Error', 'Gagal mereset saldo kas.')
    } finally {
      setLoadingAction(false)
    }
  }

  // Filtered List
  const filteredRws = useMemo(() => {
    if (!searchQuery.trim()) return rws
    const q = searchQuery.toLowerCase().trim()
    return rws.filter(
      (r) =>
        (r.name || '').toLowerCase().includes(q) ||
        (r.ketua || '').toLowerCase().includes(q) ||
        (r.keterangan || '').toLowerCase().includes(q)
    )
  }, [rws, searchQuery])

  const filteredRts = useMemo(() => {
    return rts.filter((rt) => {
      if (selectedRwFilter !== 'ALL' && rt.rw_id !== selectedRwFilter) {
        return false
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchName = (rt.name || '').toLowerCase().includes(q)
        const matchKetua = (rt.ketua || '').toLowerCase().includes(q)
        const matchKet = (rt.keterangan || '').toLowerCase().includes(q)
        return matchName || matchKetua || matchKet
      }
      return true
    })
  }, [rts, selectedRwFilter, searchQuery])

  return (
    <View style={styles.container}>
      <TopAppBar title="Administrasi Sistem" navigation={navigation} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Banner Hero Master Admin */}
        <AppCard style={styles.heroCard}>
          <View style={styles.heroHeaderRow}>
            <View style={styles.heroIconWrap}>
              <Cpu size={20} color="#059669" />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.heroTitle}>KONSOL ADMIN IT</Text>
                <View style={styles.heroPill}>
                  <Text style={styles.heroPillText}>SUPERADMIN</Text>
                </View>
              </View>
              <Text style={styles.heroSubtitle}>
                Manajemen master wilayah & instrumen reset database perumahan
              </Text>
            </View>
          </View>

          {/* Quick Metrics */}
          <View style={styles.metricsRow}>
            <View style={styles.metricCol}>
              <Text style={styles.metricLabel}>Total RW</Text>
              <Text style={styles.metricVal}>{rws.length}</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricCol}>
              <Text style={styles.metricLabel}>Total RT</Text>
              <Text style={styles.metricVal}>{rts.length}</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricCol}>
              <Text style={styles.metricLabel}>Total Warga</Text>
              <Text style={styles.metricVal}>{warga.length}</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricCol}>
              <Text style={styles.metricLabel}>Saldo Kas</Text>
              <Text style={[styles.metricVal, { color: colors.primary, fontSize: 13 }]}>
                {formatRupiah(saldoKas)}
              </Text>
            </View>
          </View>
        </AppCard>

        {/* Tab Switcher: Manajemen Wilayah vs Reset Data */}
        <View style={styles.mainTabRow}>
          <TouchableOpacity
            style={[styles.mainTabBtn, activeTab === 'wilayah' && styles.mainTabBtnActive]}
            onPress={() => setActiveTab('wilayah')}
            activeOpacity={0.8}
          >
            <Layers size={15} color={activeTab === 'wilayah' ? '#059669' : colors.textSecondary} />
            <Text style={[styles.mainTabText, activeTab === 'wilayah' && styles.mainTabTextActive]}>
              Manajemen Wilayah
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.mainTabBtn, activeTab === 'reset' && styles.mainTabBtnActiveDanger]}
            onPress={() => setActiveTab('reset')}
            activeOpacity={0.8}
          >
            <AlertTriangle size={15} color={activeTab === 'reset' ? '#DC2626' : colors.textSecondary} />
            <Text style={[styles.mainTabText, activeTab === 'reset' && styles.mainTabTextActiveDanger]}>
              Reset & Pemulihan
            </Text>
          </TouchableOpacity>
        </View>

        {/* ===================== TAB 1: MANAJEMEN WILAYAH (CRUD RW & RT) ===================== */}
        {activeTab === 'wilayah' && (
          <View>
            {/* Sub-Switch: Tingkat RW vs Tingkat RT */}
            <View style={styles.subSwitchRow}>
              <TouchableOpacity
                style={[styles.subSwitchBtn, wilayahScope === 'rw' && styles.subSwitchBtnActive]}
                onPress={() => setWilayahScope('rw')}
                activeOpacity={0.8}
              >
                <Building2 size={14} color={wilayahScope === 'rw' ? '#FFFFFF' : colors.textSecondary} />
                <Text style={[styles.subSwitchText, wilayahScope === 'rw' && styles.subSwitchTextActive]}>
                  Tingkat RW ({rws.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.subSwitchBtn, wilayahScope === 'rt' && styles.subSwitchBtnActive]}
                onPress={() => setWilayahScope('rt')}
                activeOpacity={0.8}
              >
                <Home size={14} color={wilayahScope === 'rt' ? '#FFFFFF' : colors.textSecondary} />
                <Text style={[styles.subSwitchText, wilayahScope === 'rt' && styles.subSwitchTextActive]}>
                  Tingkat RT ({rts.length})
                </Text>
              </TouchableOpacity>
            </View>

            {/* Filter & Action Header */}
            <View style={styles.actionHeaderRow}>
              <View style={styles.searchBoxWrap}>
                <Search size={15} color={colors.textSecondary} />
                <TextInput
                  style={styles.searchInput}
                  placeholder={wilayahScope === 'rw' ? 'Cari RW...' : 'Cari RT / Ketua...'}
                  placeholderTextColor={colors.textSecondary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>

              <TouchableOpacity
                style={styles.addBtn}
                onPress={wilayahScope === 'rw' ? handleOpenAddRw : handleOpenAddRt}
                activeOpacity={0.85}
              >
                <Plus size={16} color="#FFFFFF" strokeWidth={2.5} />
                <Text style={styles.addBtnText}>
                  {wilayahScope === 'rw' ? 'Tambah RW' : 'Tambah RT'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Filter RW Induk khusus tab RT */}
            {wilayahScope === 'rt' && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterRwScroll}
              >
                <TouchableOpacity
                  style={[
                    styles.rwFilterChip,
                    selectedRwFilter === 'ALL' && styles.rwFilterChipActive
                  ]}
                  onPress={() => setSelectedRwFilter('ALL')}
                >
                  <Text
                    style={[
                      styles.rwFilterChipText,
                      selectedRwFilter === 'ALL' && styles.rwFilterChipTextActive
                    ]}
                  >
                    Semua RW
                  </Text>
                </TouchableOpacity>

                {rws.map((rw) => (
                  <TouchableOpacity
                    key={rw.id}
                    style={[
                      styles.rwFilterChip,
                      selectedRwFilter === rw.id && styles.rwFilterChipActive
                    ]}
                    onPress={() => setSelectedRwFilter(rw.id)}
                  >
                    <Text
                      style={[
                        styles.rwFilterChipText,
                        selectedRwFilter === rw.id && styles.rwFilterChipTextActive
                      ]}
                    >
                      {rw.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* LIST KARTU RW */}
            {wilayahScope === 'rw' && (
              <View>
                {filteredRws.map((rw) => {
                  const attachedCount = rts.filter((r) => r.rw_id === rw.id).length
                  return (
                    <AppCard key={rw.id} style={styles.cardItem}>
                      <View style={styles.cardHeaderRow}>
                        <View style={styles.cardBadgeRw}>
                          <Building2 size={18} color="#4F46E5" />
                        </View>
                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={styles.cardTitle}>{rw.name}</Text>
                            <View style={styles.attachedPill}>
                              <Text style={styles.attachedPillText}>{attachedCount} RT Binaan</Text>
                            </View>
                          </View>
                          <Text style={styles.cardSubtitle}>
                            {rw.keterangan || 'Wilayah binaan rukun warga'}
                          </Text>
                        </View>

                        <View style={{ flexDirection: 'row', gap: 6 }}>
                          <TouchableOpacity
                            style={styles.iconActionBtn}
                            onPress={() => handleOpenEditRw(rw)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Edit3 size={15} color="#059669" />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.iconActionBtn, styles.iconActionBtnDanger]}
                            onPress={() => handleDeleteRw(rw)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Trash2 size={15} color="#DC2626" />
                          </TouchableOpacity>
                        </View>
                      </View>

                      <View style={styles.cardMetaBox}>
                        <View style={styles.metaCol}>
                          <Text style={styles.metaLabel}>Ketua RW</Text>
                          <Text style={styles.metaVal}>{rw.ketua || '-'}</Text>
                        </View>
                        <View style={styles.metaDivider} />
                        <View style={styles.metaCol}>
                          <Text style={styles.metaLabel}>Bendahara</Text>
                          <Text style={styles.metaVal}>{rw.bendahara || '-'}</Text>
                        </View>
                        <View style={styles.metaDivider} />
                        <View style={styles.metaCol}>
                          <Text style={styles.metaLabel}>Kontak RW</Text>
                          <Text style={styles.metaVal}>{rw.kontak || '-'}</Text>
                        </View>
                      </View>
                    </AppCard>
                  )
                })}
              </View>
            )}

            {/* LIST KARTU RT */}
            {wilayahScope === 'rt' && (
              <View>
                {filteredRts.map((rt) => {
                  const rwParent = rws.find((r) => r.id === rt.rw_id)
                  return (
                    <AppCard key={rt.id} style={styles.cardItem}>
                      <View style={styles.cardHeaderRow}>
                        <View style={styles.cardBadgeRt}>
                          <Home size={18} color="#059669" />
                        </View>
                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={styles.cardTitle}>{rt.name}</Text>
                            <View style={styles.rwParentPill}>
                              <Text style={styles.rwParentPillText}>
                                {rwParent?.name || 'RW 01'}
                              </Text>
                            </View>
                          </View>
                          <Text style={styles.cardSubtitle}>
                            {rt.keterangan || 'Wilayah rukun tetangga'}
                          </Text>
                        </View>

                        <View style={{ flexDirection: 'row', gap: 6 }}>
                          <TouchableOpacity
                            style={styles.iconActionBtn}
                            onPress={() => handleOpenEditRt(rt)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Edit3 size={15} color="#059669" />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.iconActionBtn, styles.iconActionBtnDanger]}
                            onPress={() => handleDeleteRt(rt)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Trash2 size={15} color="#DC2626" />
                          </TouchableOpacity>
                        </View>
                      </View>

                      <View style={styles.cardMetaBox}>
                        <View style={styles.metaCol}>
                          <Text style={styles.metaLabel}>Ketua RT</Text>
                          <Text style={styles.metaVal}>{rt.ketua || '-'}</Text>
                        </View>
                        <View style={styles.metaDivider} />
                        <View style={styles.metaCol}>
                          <Text style={styles.metaLabel}>Bendahara</Text>
                          <Text style={styles.metaVal}>{rt.bendahara || '-'}</Text>
                        </View>
                        <View style={styles.metaDivider} />
                        <View style={styles.metaCol}>
                          <Text style={styles.metaLabel}>Kontak RT</Text>
                          <Text style={styles.metaVal}>{rt.kontak || '-'}</Text>
                        </View>
                      </View>
                    </AppCard>
                  )
                })}
              </View>
            )}
          </View>
        )}

        {/* ===================== TAB 2: RESET & PEMULIHAN SISTEM ===================== */}
        {activeTab === 'reset' && (
          <View style={styles.resetContainer}>
            {/* INSTRUMEN 1: RESET DATA WARGA & WILAYAH */}
            <AppCard style={styles.dangerCard}>
              <View style={styles.dangerHeaderRow}>
                <View style={styles.dangerIconBadge}>
                  <AlertTriangle size={20} color="#DC2626" />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.dangerCardTitle}>Reset Data Warga & Wilayah</Text>
                    <View style={styles.dangerTag}>
                      <Text style={styles.dangerTagText}>ZONA MASTER</Text>
                    </View>
                  </View>
                  <Text style={styles.dangerCardDesc}>
                    Mengembalikan seluruh basis data warga perumahan, struktur RT & RW, akun pengguna, serta catatan tagihan ke kondisi awal bawaan (default).
                  </Text>
                </View>
              </View>

              <View style={styles.dangerWarningBox}>
                <Text style={styles.dangerWarningText}>
                  ⚠️ Seluruh data warga baru atau pengubahan yang dibuat manual akan digantikan dengan data seed default. Wajib konfirmasi sebelum eksekusi.
                </Text>
              </View>

              <AppButton
                title="Reset Seluruh Data Warga & Wilayah"
                variant="danger"
                onPress={() => setResetWargaModalOpen(true)}
              />
            </AppCard>

            {/* INSTRUMEN 2: RESET KAS LINGKUNGAN HINGGA RP 0 */}
            <AppCard style={[styles.dangerCard, { marginTop: spacing.md }]}>
              <View style={styles.dangerHeaderRow}>
                <View style={[styles.dangerIconBadge, { backgroundColor: '#FEF3C7' }]}>
                  <Wallet size={20} color="#D97706" />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.dangerCardTitle}>Reset Kas Lingkungan (Rp 0)</Text>
                    <View style={[styles.dangerTag, { backgroundColor: '#FEF3C7' }]}>
                      <Text style={[styles.dangerTagText, { color: '#B45309' }]}>KEUANGAN</Text>
                    </View>
                  </View>
                  <Text style={styles.dangerCardDesc}>
                    Menghapus seluruh pembukuan mutasi masuk dan keluar serta mengosongkan total saldo kas lingkungan (seluruh RW & RT) hingga benar-benar Rp 0.
                  </Text>
                </View>
              </View>

              {/* Status Saldo Kas Saat Ini */}
              <View style={styles.kasCurrentStatusCard}>
                <View style={styles.kasStatusCol}>
                  <Text style={styles.kasStatusLabel}>Saldo Kas Saat Ini</Text>
                  <Text style={styles.kasStatusVal}>{formatRupiah(saldoKas)}</Text>
                </View>
                <View style={styles.kasStatusCol}>
                  <Text style={styles.kasStatusLabel}>Total Catatan Mutasi</Text>
                  <Text style={styles.kasStatusVal}>{kas.length} Transaksi</Text>
                </View>
              </View>

              <View style={styles.dangerWarningBox}>
                <Text style={styles.dangerWarningText}>
                  ⚠️ Pengosongan saldo ini bersifat permanen. Seluruh grafik, laporan buku kas, dan riwayat mutasi akan bersih menjadi nol rupiah.
                </Text>
              </View>

              <AppButton
                title="Kosongkan Saldo Kas Menjadi Rp 0"
                variant="danger"
                onPress={() => {
                  setConfirmKasChecked(false)
                  setResetKasModalOpen(true)
                }}
              />
            </AppCard>
          </View>
        )}
      </ScrollView>

      {/* ===================== MODAL FORM CRUD RW ===================== */}
      <AppModal
        visible={rwModalOpen}
        title={editingRw ? 'Ubah Wilayah RW' : 'Tambah Wilayah RW'}
        subtitle="Konfigurasi data rukun warga di lingkungan"
        onClose={() => setRwModalOpen(false)}
        footer={
          <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
            <View style={{ flex: 1 }}>
              <AppButton title="Batal" variant="secondary" onPress={() => setRwModalOpen(false)} />
            </View>
            <View style={{ flex: 1 }}>
              <AppButton title="Simpan RW" variant="primary" onPress={handleSaveRw} />
            </View>
          </View>
        }
      >
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Nomor RW (2 Digit) *</Text>
          <TextInput
            style={styles.formInput}
            placeholder="Contoh: 01"
            placeholderTextColor={colors.textSecondary}
            keyboardType="number-pad"
            maxLength={3}
            value={formRwNumber}
            onChangeText={(txt) => {
              setFormRwNumber(txt)
              if (!editingRw && txt) {
                setFormRwName(`RW ${txt.padStart(2, '0')}`)
              }
            }}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Nama Wilayah RW *</Text>
          <TextInput
            style={styles.formInput}
            placeholder="Contoh: RW 01"
            placeholderTextColor={colors.textSecondary}
            value={formRwName}
            onChangeText={setFormRwName}
          />
        </View>

        <View style={styles.formGroup}>
          <View style={styles.formLabelRow}>
            <Text style={styles.formLabel}>Nama Ketua RW</Text>
            <TouchableOpacity
              style={styles.pickWargaToggleBtn}
              onPress={() => setRwKetuaPickerOpen((prev) => !prev)}
              activeOpacity={0.7}
            >
              <UserCheck size={12} color="#059669" />
              <Text style={styles.pickWargaToggleText}>
                {rwKetuaPickerOpen ? 'Tutup Pilihan' : 'Pilih dari Database'}
              </Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.formInput}
            placeholder="Ketik manual atau pilih warga di database..."
            placeholderTextColor={colors.textSecondary}
            value={formRwKetua}
            onChangeText={setFormRwKetua}
          />

          {/* Inline Searchable Picker Warga / Database */}
          {rwKetuaPickerOpen && (
            <View style={styles.wargaPickerBox}>
              <View style={styles.wargaPickerSearchWrap}>
                <Search size={13} color={colors.textSecondary} />
                <TextInput
                  style={styles.wargaPickerSearchInput}
                  placeholder="Cari nama warga, blok, atau no HP..."
                  placeholderTextColor={colors.textSecondary}
                  value={wargaSearchRw}
                  onChangeText={setWargaSearchRw}
                />
                {wargaSearchRw.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setWargaSearchRw('')}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <XCircle size={14} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>

              <ScrollView
                style={styles.wargaPickerScroll}
                nestedScrollEnabled={true}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={true}
              >
                {filteredRwCandidates.length === 0 ? (
                  <Text style={styles.wargaPickerEmpty}>
                    Tidak ditemukan data warga &ldquo;{wargaSearchRw}&rdquo;
                  </Text>
                ) : (
                  filteredRwCandidates.map((cand) => {
                    const isSelected = formRwKetua.trim().toLowerCase() === cand.nama.toLowerCase()
                    return (
                      <TouchableOpacity
                        key={cand.id}
                        style={[styles.wargaPickerItem, isSelected && styles.wargaPickerItemActive]}
                        onPress={() => handleSelectRwKetua(cand)}
                        activeOpacity={0.7}
                      >
                        <View
                          style={[
                            styles.wargaPickerAvatar,
                            isSelected && styles.wargaPickerAvatarActive
                          ]}
                        >
                          <Text
                            style={[
                              styles.wargaPickerAvatarText,
                              isSelected && styles.wargaPickerAvatarTextActive
                            ]}
                          >
                            {cand.nama.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View style={{ flex: 1, marginLeft: 8 }}>
                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'space-between'
                            }}
                          >
                            <Text
                              style={[
                                styles.wargaPickerName,
                                isSelected && styles.wargaPickerNameActive
                              ]}
                              numberOfLines={1}
                            >
                              {cand.nama}
                            </Text>
                            <View
                              style={[
                                styles.wargaPickerTag,
                                isSelected && styles.wargaPickerTagActive
                              ]}
                            >
                              <Text
                                style={[
                                  styles.wargaPickerTagText,
                                  isSelected && styles.wargaPickerTagTextActive
                                ]}
                              >
                                {cand.tag}
                              </Text>
                            </View>
                          </View>
                          <Text style={styles.wargaPickerSub} numberOfLines={1}>
                            {cand.sub}
                            {cand.kontak ? ` • ${cand.kontak}` : ''}
                          </Text>
                        </View>
                        {isSelected && (
                          <CheckCircle2 size={16} color="#059669" style={{ marginLeft: 6 }} />
                        )}
                      </TouchableOpacity>
                    )
                  })
                )}
              </ScrollView>
            </View>
          )}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Nama Bendahara RW</Text>
          <TextInput
            style={styles.formInput}
            placeholder="Nama Bendahara RW..."
            placeholderTextColor={colors.textSecondary}
            value={formRwBendahara}
            onChangeText={setFormRwBendahara}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Nomor Kontak / WhatsApp</Text>
          <TextInput
            style={styles.formInput}
            placeholder="Contoh: 08123456789"
            placeholderTextColor={colors.textSecondary}
            keyboardType="phone-pad"
            value={formRwKontak}
            onChangeText={setFormRwKontak}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Keterangan Wilayah</Text>
          <TextInput
            style={[styles.formInput, { height: 65, textAlignVertical: 'top' }]}
            placeholder="Cakupan blok atau catatan wilayah..."
            placeholderTextColor={colors.textSecondary}
            multiline
            value={formRwKeterangan}
            onChangeText={setFormRwKeterangan}
          />
        </View>
      </AppModal>

      {/* ===================== MODAL FORM CRUD RT ===================== */}
      <AppModal
        visible={rtModalOpen}
        title={editingRt ? 'Ubah Wilayah RT' : 'Tambah Wilayah RT'}
        subtitle="Konfigurasi data rukun tetangga dan induk RW"
        onClose={() => setRtModalOpen(false)}
        footer={
          <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
            <View style={{ flex: 1 }}>
              <AppButton title="Batal" variant="secondary" onPress={() => setRtModalOpen(false)} />
            </View>
            <View style={{ flex: 1 }}>
              <AppButton title="Simpan RT" variant="primary" onPress={handleSaveRt} />
            </View>
          </View>
        }
      >
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Induk RW *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', marginTop: 4 }}>
            {rws.map((rw) => (
              <TouchableOpacity
                key={rw.id}
                style={[
                  styles.formRwChip,
                  formRtRwId === rw.id && styles.formRwChipActive
                ]}
                onPress={() => {
                  setFormRtRwId(rw.id)
                  if (!editingRt) {
                    setFormRtName(`RT ${formRtNumber.padStart(2, '0') || '01'} / ${rw.name}`)
                  }
                }}
              >
                <Text style={[styles.formRwChipText, formRtRwId === rw.id && styles.formRwChipTextActive]}>
                  {rw.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Nomor RT (2 Digit) *</Text>
          <TextInput
            style={styles.formInput}
            placeholder="Contoh: 01"
            placeholderTextColor={colors.textSecondary}
            keyboardType="number-pad"
            maxLength={3}
            value={formRtNumber}
            onChangeText={(txt) => {
              setFormRtNumber(txt)
              if (!editingRt && txt) {
                const targetRw = rws.find((r) => r.id === formRtRwId)
                setFormRtName(`RT ${txt.padStart(2, '0')} / ${targetRw?.name || 'RW 01'}`)
              }
            }}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Nama Wilayah RT *</Text>
          <TextInput
            style={styles.formInput}
            placeholder="Contoh: RT 01 / RW 01"
            placeholderTextColor={colors.textSecondary}
            value={formRtName}
            onChangeText={setFormRtName}
          />
        </View>

        <View style={styles.formGroup}>
          <View style={styles.formLabelRow}>
            <Text style={styles.formLabel}>Nama Ketua RT</Text>
            <TouchableOpacity
              style={styles.pickWargaToggleBtn}
              onPress={() => setRtKetuaPickerOpen((prev) => !prev)}
              activeOpacity={0.7}
            >
              <UserCheck size={12} color="#059669" />
              <Text style={styles.pickWargaToggleText}>
                {rtKetuaPickerOpen ? 'Tutup Pilihan' : 'Pilih dari Database'}
              </Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.formInput}
            placeholder="Ketik manual atau pilih warga di database..."
            placeholderTextColor={colors.textSecondary}
            value={formRtKetua}
            onChangeText={setFormRtKetua}
          />

          {/* Inline Searchable Picker Warga / Database */}
          {rtKetuaPickerOpen && (
            <View style={styles.wargaPickerBox}>
              <View style={styles.wargaPickerSearchWrap}>
                <Search size={13} color={colors.textSecondary} />
                <TextInput
                  style={styles.wargaPickerSearchInput}
                  placeholder="Cari nama warga, blok, atau no HP..."
                  placeholderTextColor={colors.textSecondary}
                  value={wargaSearchRt}
                  onChangeText={setWargaSearchRt}
                />
                {wargaSearchRt.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setWargaSearchRt('')}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <XCircle size={14} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>

              <ScrollView
                style={styles.wargaPickerScroll}
                nestedScrollEnabled={true}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={true}
              >
                {filteredRtCandidates.length === 0 ? (
                  <Text style={styles.wargaPickerEmpty}>
                    Tidak ditemukan data warga &ldquo;{wargaSearchRt}&rdquo;
                  </Text>
                ) : (
                  filteredRtCandidates.map((cand) => {
                    const isSelected = formRtKetua.trim().toLowerCase() === cand.nama.toLowerCase()
                    return (
                      <TouchableOpacity
                        key={cand.id}
                        style={[styles.wargaPickerItem, isSelected && styles.wargaPickerItemActive]}
                        onPress={() => handleSelectRtKetua(cand)}
                        activeOpacity={0.7}
                      >
                        <View
                          style={[
                            styles.wargaPickerAvatar,
                            isSelected && styles.wargaPickerAvatarActive
                          ]}
                        >
                          <Text
                            style={[
                              styles.wargaPickerAvatarText,
                              isSelected && styles.wargaPickerAvatarTextActive
                            ]}
                          >
                            {cand.nama.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View style={{ flex: 1, marginLeft: 8 }}>
                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'space-between'
                            }}
                          >
                            <Text
                              style={[
                                styles.wargaPickerName,
                                isSelected && styles.wargaPickerNameActive
                              ]}
                              numberOfLines={1}
                            >
                              {cand.nama}
                            </Text>
                            <View
                              style={[
                                styles.wargaPickerTag,
                                isSelected && styles.wargaPickerTagActive
                              ]}
                            >
                              <Text
                                style={[
                                  styles.wargaPickerTagText,
                                  isSelected && styles.wargaPickerTagTextActive
                                ]}
                              >
                                {cand.tag}
                              </Text>
                            </View>
                          </View>
                          <Text style={styles.wargaPickerSub} numberOfLines={1}>
                            {cand.sub}
                            {cand.kontak ? ` • ${cand.kontak}` : ''}
                          </Text>
                        </View>
                        {isSelected && (
                          <CheckCircle2 size={16} color="#059669" style={{ marginLeft: 6 }} />
                        )}
                      </TouchableOpacity>
                    )
                  })
                )}
              </ScrollView>
            </View>
          )}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Nama Bendahara RT</Text>
          <TextInput
            style={styles.formInput}
            placeholder="Nama Bendahara RT..."
            placeholderTextColor={colors.textSecondary}
            value={formRtBendahara}
            onChangeText={setFormRtBendahara}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Nomor Kontak / WhatsApp</Text>
          <TextInput
            style={styles.formInput}
            placeholder="Contoh: 08123456789"
            placeholderTextColor={colors.textSecondary}
            keyboardType="phone-pad"
            value={formRtKontak}
            onChangeText={setFormRtKontak}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Cakupan Blok / Keterangan</Text>
          <TextInput
            style={[styles.formInput, { height: 65, textAlignVertical: 'top' }]}
            placeholder="Contoh: Mencakup Blok A No. 01 - 20"
            placeholderTextColor={colors.textSecondary}
            multiline
            value={formRtKeterangan}
            onChangeText={setFormRtKeterangan}
          />
        </View>
      </AppModal>

      {/* ===================== POPUP KONFIRMASI: RESET DATA WARGA ===================== */}
      <AppModal
        visible={resetWargaModalOpen}
        title="Konfirmasi Reset Total Warga"
        subtitle="Peringatan instrumen pemulihan data master"
        onClose={() => setResetWargaModalOpen(false)}
        footer={
          <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
            <View style={{ flex: 1 }}>
              <AppButton
                title="Batal"
                variant="secondary"
                onPress={() => setResetWargaModalOpen(false)}
                disabled={loadingAction}
              />
            </View>
            <View style={{ flex: 1 }}>
              <AppButton
                title={loadingAction ? 'Mereset...' : 'Ya, Reset Total'}
                variant="danger"
                onPress={handleExecuteResetWarga}
                loading={loadingAction}
              />
            </View>
          </View>
        }
      >
        <View style={{ paddingVertical: spacing.xs }}>
          <View style={styles.modalAlertHeader}>
            <AlertTriangle size={32} color="#DC2626" />
            <Text style={styles.modalAlertTitle}>Tindakan Berdampak Luas!</Text>
          </View>

          <Text style={styles.modalAlertText}>
            Apakah Anda yakin ingin melakukan <Text style={{ fontWeight: '800' }}>Reset Total</Text> terhadap seluruh data warga, struktur RW, RT, dan tagihan iuran?
          </Text>

          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• Seluruh nama warga dan unit rumah dikembalikan ke seed awal.</Text>
            <Text style={styles.bulletItem}>• Struktur nomor RW dan RT dikembalikan ke master bawaan.</Text>
            <Text style={styles.bulletItem}>• Seluruh tagihan manual yang baru dibuat akan dihapus.</Text>
          </View>

          <Text style={[styles.modalAlertText, { color: '#DC2626', fontWeight: '700', marginTop: 10 }]}>
            Tindakan ini tidak dapat dibatalkan setelah dieksekusi.
          </Text>
        </View>
      </AppModal>

      {/* ===================== POPUP KONFIRMASI: RESET KAS LINGKUNGAN (RP 0) ===================== */}
      <AppModal
        visible={resetKasModalOpen}
        title="Konfirmasi Reset Kas ke Rp 0"
        subtitle="Pengosongan saldo kas lingkungan secara total"
        onClose={() => setResetKasModalOpen(false)}
        footer={
          <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
            <View style={{ flex: 1 }}>
              <AppButton
                title="Batal"
                variant="secondary"
                onPress={() => setResetKasModalOpen(false)}
                disabled={loadingAction}
              />
            </View>
            <View style={{ flex: 1 }}>
              <AppButton
                title={loadingAction ? 'Mengosongkan...' : 'Reset ke Rp 0'}
                variant="danger"
                onPress={handleExecuteResetKas}
                disabled={!confirmKasChecked}
                loading={loadingAction}
              />
            </View>
          </View>
        }
      >
        <View style={{ paddingVertical: spacing.xs }}>
          <View style={styles.modalAlertHeader}>
            <Wallet size={32} color="#DC2626" />
            <Text style={styles.modalAlertTitle}>Kosongkan Saldo Kas Menjadi Rp 0</Text>
          </View>

          <Text style={styles.modalAlertText}>
            Tindakan ini akan menghapus seluruh catatan transaksi kas masuk maupun keluar, sehingga saldo kas di semua RW dan semua RT akan menjadi <Text style={{ fontWeight: '800', color: '#DC2626' }}>Rp 0</Text>.
          </Text>

          {/* Konfirmasi Checkbox */}
          <TouchableOpacity
            style={[
              styles.confirmCheckboxRow,
              confirmKasChecked && styles.confirmCheckboxRowActive
            ]}
            onPress={() => setConfirmKasChecked(!confirmKasChecked)}
            activeOpacity={0.85}
          >
            <View style={[styles.checkboxBox, confirmKasChecked && styles.checkboxBoxActive]}>
              {confirmKasChecked && <CheckCircle2 size={16} color="#FFFFFF" />}
            </View>
            <Text style={styles.checkboxLabel}>
              Saya menyetujui pengosongan seluruh saldo kas dan pembukuan mutasi menjadi Rp 0.
            </Text>
          </TouchableOpacity>
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
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 80
  },
  restrictedWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl
  },
  restrictedIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md
  },
  restrictedTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 6,
    textAlign: 'center'
  },
  restrictedDesc: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
    maxWidth: 320
  },
  heroCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface
  },
  heroHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md
  },
  heroIconWrap: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#A7F3D0'
  },
  heroTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 0.5
  },
  heroPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: radius.sm
  },
  heroPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textSecondary
  },
  heroSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  metricCol: {
    flex: 1,
    alignItems: 'center'
  },
  metricLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 2
  },
  metricVal: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0'
  },
  mainTabRow: {
    flexDirection: 'row',
    backgroundColor: '#EAECF0',
    borderRadius: radius.md,
    padding: 3,
    marginBottom: spacing.md
  },
  mainTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: radius.sm
  },
  mainTabBtnActive: {
    backgroundColor: colors.surface,
    ...shadows.soft
  },
  mainTabBtnActiveDanger: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    ...shadows.soft
  },
  mainTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary
  },
  mainTabTextActive: {
    color: '#059669',
    fontWeight: '800'
  },
  mainTabTextActiveDanger: {
    color: '#DC2626',
    fontWeight: '800'
  },
  subSwitchRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.sm
  },
  subSwitchBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: radius.md,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  subSwitchBtnActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A'
  },
  subSwitchText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.textSecondary
  },
  subSwitchTextActive: {
    color: '#FFFFFF',
    fontWeight: '800'
  },
  actionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.sm
  },
  searchBoxWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 10,
    height: 38
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: colors.textPrimary,
    padding: 0
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    height: 38,
    borderRadius: radius.md,
    justifyContent: 'center'
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF'
  },
  filterRwScroll: {
    gap: 6,
    paddingBottom: spacing.sm
  },
  rwFilterChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  rwFilterChipActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0'
  },
  rwFilterChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary
  },
  rwFilterChipTextActive: {
    color: '#059669',
    fontWeight: '800'
  },
  cardItem: {
    marginBottom: spacing.sm,
    padding: spacing.sm + 2
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  cardBadgeRw: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#C7D2FE'
  },
  cardBadgeRt: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#A7F3D0'
  },
  cardTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: colors.textPrimary
  },
  cardSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1
  },
  attachedPill: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6
  },
  attachedPillText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#4F46E5'
  },
  rwParentPill: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6
  },
  rwParentPillText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#059669'
  },
  iconActionBtn: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  iconActionBtnDanger: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA'
  },
  cardMetaBox: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: radius.sm,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9'
  },
  metaCol: {
    flex: 1
  },
  metaLabel: {
    fontSize: 9.5,
    color: '#64748B',
    marginBottom: 1
  },
  metaVal: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary
  },
  metaDivider: {
    width: 1,
    height: '100%',
    backgroundColor: '#E2E8F0',
    marginHorizontal: 4
  },
  resetContainer: {
    marginTop: 4
  },
  dangerCard: {
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: '#FECACA',
    backgroundColor: '#FFFDFD'
  },
  dangerHeaderRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm
  },
  dangerIconBadge: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FECACA'
  },
  dangerCardTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: colors.textPrimary
  },
  dangerTag: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: radius.sm
  },
  dangerTagText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#DC2626'
  },
  dangerCardDesc: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
    marginTop: 3
  },
  dangerWarningBox: {
    backgroundColor: '#FEF2F2',
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: spacing.sm + 2
  },
  dangerWarningText: {
    fontSize: 11,
    color: '#991B1B',
    lineHeight: 16
  },
  kasCurrentStatusCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFBEB',
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: spacing.sm
  },
  kasStatusCol: {
    flex: 1
  },
  kasStatusLabel: {
    fontSize: 10,
    color: '#92400E',
    fontWeight: '600',
    marginBottom: 2
  },
  kasStatusVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#B45309'
  },
  formGroup: {
    marginBottom: spacing.sm
  },
  formLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  pickWargaToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#ECFDF5',
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: '#A7F3D0'
  },
  pickWargaToggleText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#059669'
  },
  wargaPickerBox: {
    marginTop: 6,
    backgroundColor: '#F8FAFC',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    padding: spacing.xs,
    overflow: 'hidden'
  },
  wargaPickerSearchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 8,
    height: 34,
    gap: 6,
    marginBottom: 6
  },
  wargaPickerSearchInput: {
    flex: 1,
    fontSize: 11.5,
    color: colors.textPrimary,
    paddingVertical: 0
  },
  wargaPickerScroll: {
    maxHeight: 180
  },
  wargaPickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: radius.sm,
    marginBottom: 3,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: '#F1F5F9'
  },
  wargaPickerItemActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0'
  },
  wargaPickerAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center'
  },
  wargaPickerAvatarActive: {
    backgroundColor: '#059669'
  },
  wargaPickerAvatarText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569'
  },
  wargaPickerAvatarTextActive: {
    color: '#FFFFFF'
  },
  wargaPickerName: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.textPrimary
  },
  wargaPickerNameActive: {
    color: '#065F46'
  },
  wargaPickerTag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4
  },
  wargaPickerTagActive: {
    backgroundColor: '#D1FAE5'
  },
  wargaPickerTagText: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#64748B'
  },
  wargaPickerTagTextActive: {
    color: '#047857'
  },
  wargaPickerSub: {
    fontSize: 9.5,
    color: '#64748B',
    marginTop: 1
  },
  wargaPickerEmpty: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    paddingVertical: 12
  },
  formLabel: {
    ...typography.label,
    fontSize: 11,
    marginBottom: 4
  },
  formInput: {
    height: 42,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    fontSize: 13,
    color: colors.textPrimary,
    backgroundColor: colors.surface
  },
  formRwChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.md,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 8
  },
  formRwChipActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A'
  },
  formRwChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary
  },
  formRwChipTextActive: {
    color: '#FFFFFF'
  },
  modalAlertHeader: {
    alignItems: 'center',
    marginBottom: spacing.sm
  },
  modalAlertTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#DC2626',
    marginTop: 6
  },
  modalAlertText: {
    fontSize: 12.5,
    color: colors.textPrimary,
    lineHeight: 18,
    marginBottom: spacing.xs
  },
  bulletList: {
    backgroundColor: '#F8FAFC',
    borderRadius: radius.md,
    padding: spacing.sm,
    marginVertical: spacing.xs,
    gap: 4
  },
  bulletItem: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16
  },
  confirmCheckboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: radius.md,
    padding: spacing.sm,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  confirmCheckboxRowActive: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA'
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center'
  },
  checkboxBoxActive: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626'
  },
  checkboxLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
    lineHeight: 16
  }
})
