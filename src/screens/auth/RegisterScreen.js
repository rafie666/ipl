import React, { useState, useMemo } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Switch
} from 'react-native'
import {
  Building,
  Building2,
  User,
  MapPin,
  FileText,
  Phone,
  Mail,
  Briefcase,
  Shield,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  Calendar,
  Hash,
  Heart,
  Home,
  ChevronRight,
  ChevronDown,
  Check,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  CreditCard,
  Layers
} from 'lucide-react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useApp } from '../../context/AppContext'
import AppHeader from '../../components/layout/AppHeader'
import AppCard from '../../components/shared/AppCard'
import AppButton from '../../components/shared/AppButton'
import AppModal from '../../components/modals/AppModal'
import { colors, typography, spacing, radius, shadows } from '../../utils/theme'
import { generateNextKodeUnik, getKodeUnikLengkap, getJabatanTheme } from '../../utils/formatters'

export default function RegisterScreen({ route, navigation }) {
  const insets = useSafeAreaInsets()
  const { wargaToEdit } = route.params || {}
  const isEditing = Boolean(wargaToEdit)

  const { tambahWarga, updateWarga, currentUser, rts = [], rws = [], warga = [], isAdmin } = useApp()
  const isAdminUser = Boolean(isAdmin || currentUser?.role === 'admin' || currentUser?.jabatan === 'admin')

  // Steps: 'identitas' (1) | 'lokasi' (2) | 'biodata' (3) | 'akun' (4)
  const [activeTab, setActiveTab] = useState('identitas')

  // Role Selection (Khusus Admin atau edit warga)
  const [selectedRole, setSelectedRole] = useState(
    wargaToEdit?.jabatan || wargaToEdit?.role || 'warga'
  )

  // Tab 1: Unit & Identitas
  const [kodeUnik, setKodeUnik] = useState(
    wargaToEdit?.kodeUnik
      ? getKodeUnikLengkap(wargaToEdit)
      : generateNextKodeUnik(warga, 'WR')
  )
  const [nama, setNama] = useState(wargaToEdit?.nama || '')
  const [nik, setNik] = useState(wargaToEdit?.nik || '')
  const [noKk, setNoKk] = useState(wargaToEdit?.noKk || '')

  // Dropdown Wilayah RW & RT
  const defaultRwId = wargaToEdit?.rw_id || currentUser?.rw_id || rws[0]?.id || 'rw-01'
  const [selectedRw, setSelectedRw] = useState(defaultRwId)

  const defaultRtId = wargaToEdit?.rt_id || currentUser?.rt_id || rts[0]?.id || 'rt-01-01'
  const [selectedRt, setSelectedRt] = useState(defaultRtId)

  // Modal Dropdown State
  const [rwPickerVisible, setRwPickerVisible] = useState(false)
  const [rtPickerVisible, setRtPickerVisible] = useState(false)

  // Tingkat kepengurusan (khusus bendahara & pengurus: 'rt' | 'rw')
  const [kepengurusanLevel, setKepengurusanLevel] = useState(
    wargaToEdit?.rw_id && !wargaToEdit?.rt_id ? 'rw' : 'rt'
  )

  const [blok, setBlok] = useState(wargaToEdit?.blok || (selectedRole === 'admin' ? 'ADM' : selectedRole === 'rw' ? 'RW' : 'A'))
  const [noRumah, setNoRumah] = useState(wargaToEdit?.noRumah || (selectedRole === 'admin' ? 'IT-01' : selectedRole === 'rw' ? '01' : ''))
  const [statusHuni, setStatusHuni] = useState(wargaToEdit?.statusHuni || 'Tetap')
  const [statusKepemilikan, setStatusKepemilikan] = useState(wargaToEdit?.statusKepemilikan || 'Milik Sendiri')
  const [tglMasuk, setTglMasuk] = useState(wargaToEdit?.tglMasuk || new Date().toISOString().slice(0, 10))

  // Tab 2: Koordinat Rumah (GIS)
  const [lat, setLat] = useState(String(wargaToEdit?.lat || -6.59715))
  const [lng, setLng] = useState(String(wargaToEdit?.lng || 106.76415))

  // Tab 3: Biodata & Kontak
  const [jenisKelamin, setJenisKelamin] = useState(wargaToEdit?.jenisKelamin || 'Laki-laki')
  const [agama, setAgama] = useState(wargaToEdit?.agama || 'Islam')
  const [statusPernikahan, setStatusPernikahan] = useState(wargaToEdit?.statusPernikahan || 'Kawin')
  const [noHp, setNoHp] = useState(wargaToEdit?.noHp || '')
  const [email, setEmail] = useState(wargaToEdit?.email || '')
  const [pekerjaan, setPekerjaan] = useState(wargaToEdit?.pekerjaan || '')
  const [kontakDaruratNama, setKontakDaruratNama] = useState(wargaToEdit?.kontakDaruratNama || '')
  const [kontakDaruratHubungan, setKontakDaruratHubungan] = useState(wargaToEdit?.kontakDaruratHubungan || 'Istri')
  const [kontakDaruratHp, setKontakDaruratHp] = useState(wargaToEdit?.kontakDaruratHp || '')
  const [catatan, setCatatan] = useState(wargaToEdit?.catatan || '')

  // Tab 4: Akun Login Warga
  const [createAccount, setCreateAccount] = useState(!isEditing)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('password')
  const [confirmPassword, setConfirmPassword] = useState('password')
  const [showPassword, setShowPassword] = useState(false)

  const [loading, setLoading] = useState(false)

  // Object RT & RW yang sedang terpilih
  const currentRwObj = useMemo(() => {
    return rws.find((r) => r.id === selectedRw) || rws[0] || null
  }, [rws, selectedRw])

  const availableRts = useMemo(() => {
    if (!selectedRw) return rts
    const filtered = rts.filter((r) => r.rw_id === selectedRw)
    return filtered.length > 0 ? filtered : rts
  }, [rts, selectedRw])

  const currentRtObj = useMemo(() => {
    return rts.find((r) => r.id === selectedRt) || availableRts[0] || null
  }, [rts, selectedRt, availableRts])

  // Handler Pilih RW dari dropdown modal
  const handleSelectRw = (rwId) => {
    setSelectedRw(rwId)
    setRwPickerVisible(false)
    const rtsInRw = rts.filter((r) => r.rw_id === rwId)
    if (rtsInRw.length > 0 && !rtsInRw.some((r) => r.id === selectedRt)) {
      setSelectedRt(rtsInRw[0].id)
    }
  }

  // Auto generate username dari nama KK & Role
  const generateUsernameForRole = (namaVal, roleVal) => {
    if (!namaVal.trim()) return ''
    const cleanNama = namaVal.toLowerCase().trim().replace(/[^a-z0-9]/g, '.').replace(/\.+/g, '.')
    if (roleVal === 'rt') return `rt.${cleanNama}`
    if (roleVal === 'rw') return `rw.${cleanNama}`
    if (roleVal === 'bendahara') return `bendahara.${cleanNama}`
    if (roleVal === 'pengurus') return `pengurus.${cleanNama}`
    if (roleVal === 'admin') return `admin.${cleanNama}`
    return cleanNama
  }

  const handleNamaChange = (val) => {
    setNama(val)
    if (!isEditing && val.trim()) {
      setUsername(generateUsernameForRole(val, selectedRole))
    }
  }

  const handleRoleSelect = (roleKey) => {
    setSelectedRole(roleKey)
    if (!isEditing && nama.trim()) {
      setUsername(generateUsernameForRole(nama, roleKey))
    }
    // Sesuaikan default blok / no rumah jika role institusional
    if (roleKey === 'rw' && (!blok || blok === 'A')) {
      setBlok('RW')
      if (!noRumah) setNoRumah('01')
    } else if (roleKey === 'admin' && (!blok || blok === 'A')) {
      setBlok('ADM')
      if (!noRumah) setNoRumah('IT-01')
    }
    if (roleKey !== 'warga') {
      setCreateAccount(true)
    }
  }

  const handleSelectRt = (rtId) => {
    setSelectedRt(rtId)
    setRtPickerVisible(false)
    const matchedRt = rts.find((r) => r.id === rtId)
    if (matchedRt?.rw_id && matchedRt.rw_id !== selectedRw) {
      setSelectedRw(matchedRt.rw_id)
    }
  }

  const ROLE_OPTIONS = [
    { key: 'warga', label: 'Warga', desc: 'Warga perumahan tanpa jabatan', icon: User, color: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
    { key: 'rt', label: 'Ketua RT', desc: 'Mengelola warga, iuran & kas RT', icon: Shield, color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
    { key: 'rw', label: 'Ketua RW', desc: 'Mengoordinasi seluruh RT di RW', icon: Building2, color: '#0D9488', bg: '#F0FDFA', border: '#99F6E4' },
    { key: 'bendahara', label: 'Bendahara', desc: 'Pengelola kas & audit keuangan', icon: CreditCard, color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
    { key: 'pengurus', label: 'Pengurus', desc: 'Pengelola fasum, aduan & surat', icon: Sparkles, color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' },
    { key: 'admin', label: 'Admin IT', desc: 'Super Administrator sistem', icon: Shield, color: '#E11D48', bg: '#FFF1F2', border: '#FECDD3' }
  ]

  const activeRoleInfo = useMemo(() => {
    return ROLE_OPTIONS.find((r) => r.key === selectedRole) || ROLE_OPTIONS[0]
  }, [selectedRole])

  const stepsList = [
    { key: 'identitas', num: '1', title: 'Unit & Identitas' },
    { key: 'lokasi', num: '2', title: 'Koordinat GIS' },
    { key: 'biodata', num: '3', title: 'Biodata & Kontak' },
    ...(!isEditing ? [{ key: 'akun', num: '4', title: 'Akun Login' }] : [])
  ]

  const currentStepIdx = stepsList.findIndex((s) => s.key === activeTab)

  const handleNextTab = () => {
    if (activeTab === 'identitas') {
      if (!nama.trim()) {
        Alert.alert('Perhatian', 'Nama lengkap wajib diisi!')
        return
      }
      if (selectedRole === 'warga' && !noRumah.trim()) {
        Alert.alert('Perhatian', 'Nomor rumah warga wajib diisi!')
        return
      }
      setActiveTab('lokasi')
    } else if (activeTab === 'lokasi') {
      setActiveTab('biodata')
    } else if (activeTab === 'biodata') {
      if (!isEditing) {
        setActiveTab('akun')
      }
    }
  }

  const handlePrevTab = () => {
    if (activeTab === 'akun') setActiveTab('biodata')
    else if (activeTab === 'biodata') setActiveTab('lokasi')
    else if (activeTab === 'lokasi') setActiveTab('identitas')
  }

  const handleSave = async () => {
    if (!nama.trim()) {
      Alert.alert('Perhatian', 'Nama lengkap wajib diisi!')
      return
    }

    if (selectedRole === 'warga' && !noRumah.trim()) {
      Alert.alert('Perhatian', 'Nomor rumah warga wajib diisi!')
      return
    }

    if (!isEditing && createAccount) {
      if (!username.trim()) {
        Alert.alert('Perhatian', 'Username akun login wajib diisi!')
        return
      }
      if (!password || password.length < 4) {
        Alert.alert('Perhatian', 'Kata sandi minimal 4 karakter!')
        return
      }
      if (password !== confirmPassword) {
        Alert.alert('Perhatian', 'Konfirmasi kata sandi tidak cocok!')
        return
      }
    }

    setLoading(true)
    try {
      const formattedKodeUnik = kodeUnik.trim()
        ? getKodeUnikLengkap({ kodeUnik })
        : generateNextKodeUnik(warga, 'WR')

      const finalRtId =
        selectedRole === 'rw' ||
        selectedRole === 'admin' ||
        (kepengurusanLevel === 'rw' && (selectedRole === 'bendahara' || selectedRole === 'pengurus'))
          ? null
          : selectedRt

      const finalRwId = selectedRole === 'admin' ? null : selectedRw

      const payload = {
        kodeUnik: formattedKodeUnik,
        nama: nama.trim(),
        nik: nik.trim(),
        noKk: noKk.trim(),
        role: selectedRole,
        jabatan: selectedRole,
        rt_id: finalRtId,
        rw_id: finalRwId,
        blok: (blok || (selectedRole === 'admin' ? 'ADM' : 'A')).trim().toUpperCase(),
        noRumah: (noRumah || (selectedRole === 'admin' ? 'IT-01' : selectedRole === 'rw' ? '01' : '-')).trim(),
        statusHuni,
        statusKepemilikan,
        tglMasuk,
        lat: parseFloat(lat) || -6.59715,
        lng: parseFloat(lng) || 106.76415,
        jenisKelamin,
        agama,
        statusPernikahan,
        noHp: noHp.trim(),
        email: email.trim(),
        pekerjaan: pekerjaan.trim(),
        kontakDaruratNama: kontakDaruratNama.trim(),
        kontakDaruratHubungan,
        kontakDaruratHp: kontakDaruratHp.trim(),
        catatan: catatan.trim(),
        jumlahJiwa: 1,
        createAccount,
        username: username.trim(),
        password: password.trim()
      }

      if (isEditing) {
        await updateWarga(wargaToEdit.id, payload)
        Alert.alert('Sukses', `Data ${selectedRole.toUpperCase()} ${nama} berhasil diperbarui!`, [
          { text: 'OK', onPress: () => navigation.goBack() }
        ])
      } else {
        const rtObj = rts.find((r) => r.id === selectedRt)
        const rtName = rtObj?.name || 'RT'
        const res = await tambahWarga(payload)

        if (res.success) {
          if (res.isPendingApproval) {
            Alert.alert(
              'Pendaftaran Berhasil Dikirim! ⏳',
              `Terima kasih, ${nama} (Blok ${blok}/${noRumah}).\n\nData pendaftaran Anda telah diteruskan ke Pengurus ${rtName}. Akun Anda akan aktif dan dapat login setelah diverifikasi/disetujui oleh Ketua ${rtName}.`,
              [{ text: 'Kembali ke Login', onPress: () => navigation.goBack() }]
            )
          } else {
            const roleLabel = ROLE_OPTIONS.find((r) => r.key === selectedRole)?.label || 'Warga'
            Alert.alert(
              'Pendaftaran Berhasil 🎉',
              `Data ${roleLabel} atas nama ${nama} berhasil disimpan ke sistem!`,
              [{ text: 'OK', onPress: () => navigation.goBack() }]
            )
          }
        } else {
          Alert.alert('Gagal', res.message || 'Gagal menyimpan data warga.')
        }
      }
    } catch (err) {
      Alert.alert('Error', 'Terjadi kesalahan sistem.')
    } finally {
      setLoading(false)
    }
  }

  const isLastTab = isEditing ? activeTab === 'biodata' : activeTab === 'akun'

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <AppHeader
        title={isEditing ? 'Edit Data Warga' : 'Form Pendaftaran Warga'}
        subtitle={`Langkah ${currentStepIdx + 1} dari ${stepsList.length}: ${stepsList[currentStepIdx]?.title}`}
        onBack={() => navigation.goBack()}
      />

      {/* Modern Stepper Indicator */}
      <View style={styles.stepperContainer}>
        <View style={styles.stepperRow}>
          {stepsList.map((step, idx) => {
            const isActive = activeTab === step.key
            const isDone = idx < currentStepIdx
            return (
              <TouchableOpacity
                key={step.key}
                style={styles.stepItem}
                onPress={() => setActiveTab(step.key)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.stepBadge,
                    isActive && styles.stepBadgeActive,
                    isDone && styles.stepBadgeDone
                  ]}
                >
                  {isDone ? (
                    <CheckCircle2 size={13} color={colors.white} />
                  ) : (
                    <Text
                      style={[
                        styles.stepBadgeText,
                        isActive && styles.stepBadgeTextActive
                      ]}
                    >
                      {step.num}
                    </Text>
                  )}
                </View>
                <Text
                  style={[
                    styles.stepLabel,
                    isActive && styles.stepLabelActive,
                    isDone && styles.stepLabelDone
                  ]}
                  numberOfLines={1}
                >
                  {step.title}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${((currentStepIdx + 1) / stepsList.length) * 100}%` }
            ]}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ===================== TAB 1: UNIT & IDENTITAS ===================== */}
        {activeTab === 'identitas' && (
          <AppCard style={styles.card}>
            <View style={styles.cardSectionHeader}>
              <View style={[styles.sectionIconWrap, { backgroundColor: activeRoleInfo.bg }]}>
                <activeRoleInfo.icon size={16} color={activeRoleInfo.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>
                  {selectedRole === 'warga'
                    ? 'Identitas Rumah & KK'
                    : `Penugasan & Identitas ${activeRoleInfo.label}`}
                </Text>
                <Text style={styles.sectionDesc}>
                  {selectedRole === 'warga'
                    ? 'Nomor unit rumah dan nama kepala keluarga'
                    : `Pilih peranan dan wilayah kerja ${activeRoleInfo.label}`}
                </Text>
              </View>
            </View>

            {/* Pilihan Role / Peran Akun */}
            <View style={styles.inputGroup}>
              <View style={styles.roleHeaderRow}>
                <Text style={styles.label}>Pilih Peran / Role Akun *</Text>
                <View style={[styles.roleBadge, { backgroundColor: activeRoleInfo.bg, borderColor: activeRoleInfo.border }]}>
                  <activeRoleInfo.icon size={11} color={activeRoleInfo.color} />
                  <Text style={[styles.roleBadgeText, { color: activeRoleInfo.color }]}>
                    {activeRoleInfo.label}
                  </Text>
                </View>
              </View>

              <View style={styles.roleGrid}>
                {ROLE_OPTIONS.map((item) => {
                  const isSelected = selectedRole === item.key
                  const IconComp = item.icon
                  return (
                    <TouchableOpacity
                      key={item.key}
                      style={[
                        styles.roleCard,
                        isSelected && [styles.roleCardActive, { borderColor: item.color, backgroundColor: item.bg }]
                      ]}
                      onPress={() => handleRoleSelect(item.key)}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.roleIconWrap, { backgroundColor: isSelected ? item.color : colors.borderLight }]}>
                        <IconComp size={15} color={isSelected ? colors.white : colors.textSecondary} />
                      </View>
                      <View style={styles.roleTextWrap}>
                        <Text style={[styles.roleCardLabel, isSelected && { color: item.color, fontWeight: '800' }]}>
                          {item.label}
                        </Text>
                        <Text style={styles.roleCardDesc} numberOfLines={1}>
                          {item.desc}
                        </Text>
                      </View>
                      {isSelected && (
                        <View style={[styles.roleCheckmark, { backgroundColor: item.color }]}>
                          <Check size={9} color={colors.white} strokeWidth={3} />
                        </View>
                      )}
                    </TouchableOpacity>
                  )
                })}
              </View>
            </View>

            {/* Banner Dinamis Deskripsi Hak Akses Role */}
            <View style={[styles.dynamicRoleBanner, { backgroundColor: activeRoleInfo.bg, borderColor: activeRoleInfo.border }]}>
              <activeRoleInfo.icon size={15} color={activeRoleInfo.color} style={{ marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.dynamicRoleTitle, { color: activeRoleInfo.color }]}>
                  Hak Akses: {activeRoleInfo.label}
                </Text>
                <Text style={styles.dynamicRoleDesc}>
                  {selectedRole === 'admin' && 'Akses Super Administrator. Mengelola konfigurasi sistem, seluruh RW/RT, data master warga & mutasi kas global.'}
                  {selectedRole === 'rw' && 'Mengoordinasikan seluruh RT dalam wilayah RW. Mengelola rekapitulasi data warga, kas RW & pengesahan surat pengantar.'}
                  {selectedRole === 'rt' && 'Mengelola data warga RT, penerbitan tagihan iuran bulanan, verifikasi transfer, kas RT, dan agenda ronda.'}
                  {selectedRole === 'bendahara' && 'Mengaudit kas masuk & keluar, verifikasi pembayaran warga, dan menyusun laporan pembukuan berkala.'}
                  {selectedRole === 'pengurus' && 'Mengelola fasilitas umum, jadwal ronda siskamling, publikasi pengumuman, dan tindak lanjut aduan warga.'}
                  {selectedRole === 'warga' && 'Warga terdaftar di perumahan. Memiliki akses portal mandiri untuk cek invoice IPL, upload bukti & unduh kuitansi.'}
                </Text>
              </View>
            </View>

            {/* Tingkat Kepengurusan Khusus Bendahara & Pengurus */}
            {(selectedRole === 'bendahara' || selectedRole === 'pengurus') && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Tingkat Kepengurusan *</Text>
                <View style={styles.segmentedRow}>
                  <TouchableOpacity
                    style={[styles.segmentedBtn, kepengurusanLevel === 'rt' && styles.segmentedBtnActive]}
                    onPress={() => setKepengurusanLevel('rt')}
                    activeOpacity={0.8}
                  >
                    <Shield size={14} color={kepengurusanLevel === 'rt' ? colors.primary : colors.textSecondary} />
                    <Text style={[styles.segmentedText, kepengurusanLevel === 'rt' && styles.segmentedTextActive]}>
                      Tingkat RT
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.segmentedBtn, kepengurusanLevel === 'rw' && styles.segmentedBtnActive]}
                    onPress={() => setKepengurusanLevel('rw')}
                    activeOpacity={0.8}
                  >
                    <Building2 size={14} color={kepengurusanLevel === 'rw' ? colors.primary : colors.textSecondary} />
                    <Text style={[styles.segmentedText, kepengurusanLevel === 'rw' && styles.segmentedTextActive]}>
                      Tingkat RW (Seluruh RT)
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Nama Lengkap */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                {selectedRole === 'warga' ? 'Nama Kepala Keluarga *' : `Nama Pejabat / Pengurus (${activeRoleInfo.label}) *`}
              </Text>
              <View style={styles.inputWithIcon}>
                <User size={15} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.inputInner}
                  placeholder="Nama Lengkap Sesuai KTP"
                  placeholderTextColor={colors.textSecondary}
                  value={nama}
                  onChangeText={handleNamaChange}
                />
              </View>
            </View>

            {/* NIK & No KK */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>NIK Kepala Keluarga (KTP)</Text>
              <View style={styles.inputWithIcon}>
                <FileText size={15} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.inputInner}
                  placeholder="3201xxxxxxxxxxxx (16 Digit)"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="number-pad"
                  maxLength={16}
                  value={nik}
                  onChangeText={setNik}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nomor Kartu Keluarga (No. KK)</Text>
              <View style={styles.inputWithIcon}>
                <FileText size={15} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.inputInner}
                  placeholder="3201xxxxxxxxxxxx (16 Digit)"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="number-pad"
                  maxLength={16}
                  value={noKk}
                  onChangeText={setNoKk}
                />
              </View>
            </View>

            {/* ================= WILAYAH RW & RT (DROPDOWN) ================= */}
            {selectedRole === 'admin' ? (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Cakupan Wilayah Kewenangan</Text>
                <View style={styles.globalScopeBox}>
                  <Shield size={18} color="#059669" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.globalScopeTitle}>Akses Seluruh Wilayah (Global)</Text>
                    <Text style={styles.globalScopeDesc}>
                      Super Administrator memiliki kewenangan penuh atas seluruh {rws.length} RW dan {rts.length} RT dalam sistem.
                    </Text>
                  </View>
                </View>
              </View>
            ) : (
              <>
                {/* Dropdown Rukun Warga (RW) */}
                <View style={styles.inputGroup}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={styles.label}>Wilayah Rukun Warga (RW) *</Text>
                    <Text style={styles.helperDropdownText}>Dari Basis Data</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.dropdownTrigger}
                    onPress={() => setRwPickerVisible(true)}
                    activeOpacity={0.75}
                  >
                    <View style={styles.dropdownIconCircle}>
                      <Building2 size={16} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.dropdownValueText}>
                        {currentRwObj ? `${currentRwObj.name}` : 'Pilih Rukun Warga (RW)'}
                      </Text>
                      <Text style={styles.dropdownSubText} numberOfLines={1}>
                        {currentRwObj ? (currentRwObj.keterangan || `Ketua RW: ${currentRwObj.ketua || '-'}`) : 'Sentuh untuk memilih RW'}
                      </Text>
                    </View>
                    <ChevronDown size={18} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                {/* Dropdown Rukun Tetangga (RT) */}
                {selectedRole === 'rw' || (kepengurusanLevel === 'rw' && (selectedRole === 'bendahara' || selectedRole === 'pengurus')) ? (
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Wilayah Rukun Tetangga (RT)</Text>
                    <View style={styles.disabledDropdownTrigger}>
                      <View style={[styles.dropdownIconCircle, { backgroundColor: '#F1F5F9' }]}>
                        <Layers size={16} color={colors.textSecondary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.disabledDropdownValueText}>
                          Menaungi Seluruh RT ({availableRts.length} RT)
                        </Text>
                        <Text style={styles.dropdownSubText} numberOfLines={1}>
                          Otomatis mengoordinasi semua RT di dalam {currentRwObj?.name || 'RW'}
                        </Text>
                      </View>
                      <Check size={16} color={colors.success} strokeWidth={2.5} />
                    </View>
                  </View>
                ) : (
                  <View style={styles.inputGroup}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <Text style={styles.label}>Wilayah Rukun Tetangga (RT) *</Text>
                      <Text style={styles.helperDropdownText}>
                        {availableRts.length} RT di {currentRwObj?.name || 'RW'}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.dropdownTrigger}
                      onPress={() => setRtPickerVisible(true)}
                      activeOpacity={0.75}
                    >
                      <View style={styles.dropdownIconCircle}>
                        <Home size={16} color={colors.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.dropdownValueText}>
                          {currentRtObj ? `${currentRtObj.name}` : 'Pilih Rukun Tetangga (RT)'}
                        </Text>
                        <Text style={styles.dropdownSubText} numberOfLines={1}>
                          {currentRtObj ? (currentRtObj.keterangan || `Ketua RT: ${currentRtObj.ketua || '-'}`) : 'Sentuh untuk memilih RT'}
                        </Text>
                      </View>
                      <ChevronDown size={18} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}

            {/* Blok & No Rumah */}
            <View style={styles.rowTwo}>
              <View style={{ width: 92 }}>
                <Text style={styles.label}>
                  Blok {selectedRole === 'admin' ? '(Opsional)' : '*'}
                </Text>
                <View style={styles.inputWithIcon}>
                  <Home size={14} color={colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.inputInner, { fontWeight: '700', textAlign: 'center' }]}
                    placeholder={selectedRole === 'admin' ? 'ADM' : selectedRole === 'rw' ? 'RW' : 'A'}
                    autoCapitalize="characters"
                    maxLength={4}
                    value={blok}
                    onChangeText={setBlok}
                  />
                </View>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.label}>
                  Nomor Rumah {selectedRole === 'admin' ? '(Opsional)' : '*'}
                </Text>
                <View style={styles.inputWithIcon}>
                  <Building size={14} color={colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.inputInner}
                    placeholder={
                      selectedRole === 'admin'
                        ? 'Contoh: IT-01'
                        : selectedRole === 'rw'
                        ? 'Contoh: 01 / Pos RW'
                        : 'Contoh: 12A / 05'
                    }
                    placeholderTextColor={colors.textSecondary}
                    value={noRumah}
                    onChangeText={setNoRumah}
                  />
                </View>
              </View>
            </View>

            {/* Kode Unik Warga (Auto-Generated) */}
            <View style={styles.inputGroup}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={styles.label}>Kode Unik Warga *</Text>
                <View style={styles.autoBadge}>
                  <Sparkles size={11} color={colors.primary} />
                  <Text style={styles.autoBadgeText}>Dibuat Otomatis</Text>
                </View>
              </View>
              <View style={styles.inputWithIcon}>
                <Hash size={15} color={colors.primary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.inputInner, styles.inputCode]}
                  placeholder="WR101"
                  placeholderTextColor={colors.textSecondary}
                  maxLength={6}
                  autoCapitalize="characters"
                  value={kodeUnik}
                  onChangeText={(val) => setKodeUnik(val.toUpperCase())}
                />
              </View>
              <Text style={styles.fieldHint}>
                Kode pengenal unik (contoh: 101) yang otomatis ditambahkan ke nominal transfer iuran IPL untuk verifikasi instan.
              </Text>
            </View>

            {/* Status Hunian - Segmented */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Status Tempat Tinggal</Text>
              <View style={styles.segmentedRow}>
                {['Warga Tetap', 'Kontrak / Kost'].map((st) => {
                  const isSelected = statusHuni === st
                  return (
                    <TouchableOpacity
                      key={st}
                      style={[styles.segmentedBtn, isSelected && styles.segmentedBtnActive]}
                      onPress={() => setStatusHuni(st)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.segmentedText, isSelected && styles.segmentedTextActive]}>
                        {st}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            </View>

            {/* Status Kepemilikan - Segmented */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Status Kepemilikan Rumah</Text>
              <View style={styles.segmentedRow}>
                {['Milik Sendiri', 'Sewa / Kontrak', 'Dinas'].map((sk) => {
                  const isSelected = statusKepemilikan === sk
                  return (
                    <TouchableOpacity
                      key={sk}
                      style={[styles.segmentedBtn, isSelected && styles.segmentedBtnActive]}
                      onPress={() => setStatusKepemilikan(sk)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.segmentedText, isSelected && styles.segmentedTextActive]}>
                        {sk}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            </View>

            {/* Mulai Menetap */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mulai Menetap (Tanggal)</Text>
              <View style={styles.inputWithIcon}>
                <Calendar size={15} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.inputInner}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textSecondary}
                  value={tglMasuk}
                  onChangeText={setTglMasuk}
                />
              </View>
            </View>
          </AppCard>
        )}

        {/* ===================== TAB 2: KOORDINAT RUMAH ===================== */}
        {activeTab === 'lokasi' && (
          <AppCard style={styles.card}>
            <View style={styles.cardSectionHeader}>
              <View style={styles.sectionIconWrap}>
                <MapPin size={16} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>Titik Koordinat Rumah (GIS)</Text>
                <Text style={styles.sectionDesc}>Digunakan untuk visualisasi denah lokasi blok rumah pada peta warga</Text>
              </View>
            </View>

            <View style={styles.infoBanner}>
              <Sparkles size={16} color={colors.info} />
              <Text style={styles.infoBannerText}>
                Koordinat default perumahan terisi otomatis. Anda dapat menyesuaikan titik lintang dan bujur yang presisi.
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Latitude (Garis Lintang)</Text>
              <View style={styles.inputWithIcon}>
                <MapPin size={15} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.inputInner}
                  placeholder="-6.59715"
                  keyboardType="numeric"
                  value={lat}
                  onChangeText={setLat}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Longitude (Garis Bujur)</Text>
              <View style={styles.inputWithIcon}>
                <MapPin size={15} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.inputInner}
                  placeholder="106.76415"
                  keyboardType="numeric"
                  value={lng}
                  onChangeText={setLng}
                />
              </View>
            </View>
          </AppCard>
        )}

        {/* ===================== TAB 3: BIODATA & KONTAK ===================== */}
        {activeTab === 'biodata' && (
          <AppCard style={styles.card}>
            <View style={styles.cardSectionHeader}>
              <View style={styles.sectionIconWrap}>
                <User size={16} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>Biodata & Kontak Warga</Text>
                <Text style={styles.sectionDesc}>Data kontak, profesi, dan kontak darurat</Text>
              </View>
            </View>

            {/* Jenis Kelamin - Segmented */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Jenis Kelamin</Text>
              <View style={styles.segmentedRow}>
                {['Laki-laki', 'Perempuan'].map((jk) => {
                  const isSelected = jenisKelamin === jk
                  return (
                    <TouchableOpacity
                      key={jk}
                      style={[styles.segmentedBtn, isSelected && styles.segmentedBtnActive]}
                      onPress={() => setJenisKelamin(jk)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.segmentedText, isSelected && styles.segmentedTextActive]}>
                        {jk}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            </View>

            {/* Agama */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Agama</Text>
              <View style={styles.gridPills}>
                {['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu'].map((ag) => {
                  const isSelected = agama === ag
                  return (
                    <TouchableOpacity
                      key={ag}
                      style={[styles.gridPill, isSelected && styles.gridPillActive]}
                      onPress={() => setAgama(ag)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.gridPillText, isSelected && styles.gridPillTextActive]}>
                        {ag}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            </View>

            {/* Status Pernikahan */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Status Pernikahan</Text>
              <View style={styles.segmentedRow}>
                {['sudah menikah', 'belum menikah', 'cerai'].map((sp) => {
                  const isSelected = statusPernikahan === sp
                  return (
                    <TouchableOpacity
                      key={sp}
                      style={[styles.segmentedBtn, isSelected && styles.segmentedBtnActive]}
                      onPress={() => setStatusPernikahan(sp)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.segmentedText, isSelected && styles.segmentedTextActive]}>
                        {sp}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            </View>

            {/* Nomor WhatsApp */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nomor WhatsApp / HP Aktif</Text>
              <View style={styles.inputWithIcon}>
                <Phone size={15} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.inputInner}
                  placeholder="08123456789"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="phone-pad"
                  value={noHp}
                  onChangeText={setNoHp}
                />
              </View>
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Alamat Email</Text>
              <View style={styles.inputWithIcon}>
                <Mail size={15} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.inputInner}
                  placeholder="warga@email.com"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            {/* Pekerjaan */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Pekerjaan / Profesi</Text>
              <View style={styles.inputWithIcon}>
                <Briefcase size={15} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.inputInner}
                  placeholder="Contoh: Karyawan Swasta / Wiraswasta"
                  placeholderTextColor={colors.textSecondary}
                  value={pekerjaan}
                  onChangeText={setPekerjaan}
                />
              </View>
            </View>

            {/* Kontak Darurat Box */}
            <View style={styles.sectionDivider}>
              <Text style={styles.sectionSubtitle}>Kontak Darurat Keluarga</Text>
            </View>

            <View style={styles.rowTwo}>
              <View style={{ flex: 1.3 }}>
                <Text style={styles.label}>Nama Kontak</Text>
                <View style={styles.inputWithIcon}>
                  <User size={14} color={colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.inputInner}
                    placeholder="Nama Kerabat"
                    placeholderTextColor={colors.textSecondary}
                    value={kontakDaruratNama}
                    onChangeText={setKontakDaruratNama}
                  />
                </View>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Hubungan</Text>
                <View style={styles.inputWithIcon}>
                  <Heart size={14} color={colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.inputInner}
                    placeholder="Istri / Saudara"
                    placeholderTextColor={colors.textSecondary}
                    value={kontakDaruratHubungan}
                    onChangeText={setKontakDaruratHubungan}
                  />
                </View>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nomor HP Kontak Darurat</Text>
              <View style={styles.inputWithIcon}>
                <Phone size={15} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.inputInner}
                  placeholder="08xxxxxxxxxx"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="phone-pad"
                  value={kontakDaruratHp}
                  onChangeText={setKontakDaruratHp}
                />
              </View>
            </View>

            {/* Catatan Khusus */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Catatan Khusus Pengurus RT</Text>
              <TextInput
                style={[styles.inputInner, styles.textArea]}
                placeholder="Tambahkan catatan khusus bila ada..."
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={3}
                value={catatan}
                onChangeText={setCatatan}
              />
            </View>
          </AppCard>
        )}

        {/* ===================== TAB 4: AKUN LOGIN ===================== */}
        {!isEditing && activeTab === 'akun' && (
          <AppCard style={styles.card}>
            {selectedRole !== 'warga' ? (
              <View style={[styles.officialAccountNote, { backgroundColor: activeRoleInfo.bg, borderColor: activeRoleInfo.border }]}>
                <Shield size={18} color={activeRoleInfo.color} style={{ marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.officialAccountTitle, { color: activeRoleInfo.color }]}>
                    Akun Login Wajib untuk {activeRoleInfo.label}
                  </Text>
                  <Text style={styles.officialAccountDesc}>
                    Akun sistem otomatis dibuatkan untuk peran {activeRoleInfo.label}. Kredensial ini digunakan untuk masuk ke dashboard kepengurusan.
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.switchBox}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={styles.switchTitle}>Buat Akun Portal Warga Otomatis</Text>
                  <Text style={styles.switchDesc}>
                    Warga dapat langsung login untuk mengecek status tagihan & melihat pengumuman RT.
                  </Text>
                </View>
                <Switch
                  value={createAccount}
                  onValueChange={setCreateAccount}
                  trackColor={{ false: colors.border, true: colors.primary }}
                />
              </View>
            )}

            {(createAccount || selectedRole !== 'warga') && (
              <View style={{ marginTop: spacing.md }}>
                <View style={styles.inputGroup}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={styles.label}>Username Login *</Text>
                    {selectedRole !== 'warga' && (
                      <View style={[styles.autoBadge, { backgroundColor: activeRoleInfo.bg, borderColor: activeRoleInfo.border }]}>
                        <Sparkles size={11} color={activeRoleInfo.color} />
                        <Text style={[styles.autoBadgeText, { color: activeRoleInfo.color }]}>
                          Prefix {activeRoleInfo.label}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.inputWithIcon}>
                    <User size={15} color={colors.textSecondary} style={styles.inputIcon} />
                    <TextInput
                      style={styles.inputInner}
                      placeholder={
                        selectedRole === 'warga'
                          ? 'contoh: agus.sutrisno'
                          : `contoh: ${selectedRole}.agus`
                      }
                      placeholderTextColor={colors.textSecondary}
                      autoCapitalize="none"
                      value={username}
                      onChangeText={setUsername}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Kata Sandi *</Text>
                  <View style={styles.passwordWrap}>
                    <Lock size={15} color={colors.textSecondary} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.inputInner, { flex: 1, borderWidth: 0, height: 46 }]}
                      placeholder="Minimal 4 karakter"
                      placeholderTextColor={colors.textSecondary}
                      secureTextEntry={!showPassword}
                      value={password}
                      onChangeText={setPassword}
                    />
                    <TouchableOpacity
                      style={styles.eyeToggle}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={16} color={colors.textSecondary} /> : <Eye size={16} color={colors.textSecondary} />}
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Konfirmasi Kata Sandi *</Text>
                  <View style={styles.passwordWrap}>
                    <Shield size={15} color={colors.textSecondary} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.inputInner, { flex: 1, borderWidth: 0, height: 46 }]}
                      placeholder="Ulangi kata sandi"
                      placeholderTextColor={colors.textSecondary}
                      secureTextEntry={!showPassword}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                    />
                  </View>
                </View>
              </View>
            )}
          </AppCard>
        )}
      </ScrollView>

      {/* Docked Sticky Bottom Action Bar */}
      <View style={[styles.stickyFooter, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        {activeTab !== 'identitas' ? (
          <TouchableOpacity style={styles.prevButton} onPress={handlePrevTab} activeOpacity={0.75}>
            <ArrowLeft size={16} color={colors.textSecondary} />
            <Text style={styles.prevButtonText}>Kembali</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()} activeOpacity={0.75}>
            <Text style={styles.cancelButtonText}>Batal</Text>
          </TouchableOpacity>
        )}

        <View style={styles.primaryActionWrap}>
          {!isLastTab ? (
            <AppButton
              title="Selanjutnya"
              icon={<ArrowRight size={16} color={colors.surface} />}
              iconPosition="right"
              variant="primary"
              onPress={handleNextTab}
            />
          ) : (
            <AppButton
              title={isEditing ? 'Simpan Perubahan' : 'Simpan Data Warga'}
              icon={<CheckCircle2 size={16} color={colors.surface} />}
              variant="primary"
              loading={loading}
              onPress={handleSave}
            />
          )}
        </View>
      </View>

      {/* ===================== MODAL DROPDOWN RW ===================== */}
      <AppModal
        visible={rwPickerVisible}
        onClose={() => setRwPickerVisible(false)}
        title="Pilih Rukun Warga (RW)"
        subtitle="Data RW terdaftar resmi dalam sistem"
        maxHeightPercent="70%"
      >
        <View style={styles.pickerListContainer}>
          {rws.map((rw) => {
            const isSelected = selectedRw === rw.id
            const rtsInThisRw = rts.filter((r) => r.rw_id === rw.id)
            return (
              <TouchableOpacity
                key={rw.id}
                style={[styles.pickerItemCard, isSelected && styles.pickerItemCardActive]}
                onPress={() => handleSelectRw(rw.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.pickerItemIconWrap, isSelected && styles.pickerItemIconWrapActive]}>
                  <Building2 size={18} color={isSelected ? colors.white : colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={[styles.pickerItemTitle, isSelected && styles.pickerItemTitleActive]}>
                      {rw.name}
                    </Text>
                    <View style={styles.pickerItemBadge}>
                      <Text style={styles.pickerItemBadgeText}>{rtsInThisRw.length} RT</Text>
                    </View>
                  </View>
                  <Text style={styles.pickerItemSub} numberOfLines={1}>
                    {rw.keterangan || `Wilayah ${rw.name}`}
                  </Text>
                  {rw.ketua ? (
                    <Text style={styles.pickerItemLeader}>Ketua RW: {rw.ketua}</Text>
                  ) : null}
                </View>
                {isSelected && (
                  <View style={styles.pickerItemCheck}>
                    <Check size={13} color={colors.white} strokeWidth={3} />
                  </View>
                )}
              </TouchableOpacity>
            )
          })}
        </View>
      </AppModal>

      {/* ===================== MODAL DROPDOWN RT ===================== */}
      <AppModal
        visible={rtPickerVisible}
        onClose={() => setRtPickerVisible(false)}
        title="Pilih Rukun Tetangga (RT)"
        subtitle={`Daftar RT di dalam ${currentRwObj?.name || 'RW terpilih'}`}
        maxHeightPercent="70%"
      >
        <View style={styles.pickerListContainer}>
          {availableRts.map((rt) => {
            const isSelected = selectedRt === rt.id
            return (
              <TouchableOpacity
                key={rt.id}
                style={[styles.pickerItemCard, isSelected && styles.pickerItemCardActive]}
                onPress={() => handleSelectRt(rt.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.pickerItemIconWrap, isSelected && styles.pickerItemIconWrapActive]}>
                  <Home size={18} color={isSelected ? colors.white : colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.pickerItemTitle, isSelected && styles.pickerItemTitleActive]}>
                    {rt.name}
                  </Text>
                  <Text style={styles.pickerItemSub} numberOfLines={1}>
                    {rt.keterangan || `Wilayah ${rt.name}`}
                  </Text>
                  {rt.ketua ? (
                    <Text style={styles.pickerItemLeader}>Ketua RT: {rt.ketua}</Text>
                  ) : null}
                </View>
                {isSelected && (
                  <View style={styles.pickerItemCheck}>
                    <Check size={13} color={colors.white} strokeWidth={3} />
                  </View>
                )}
              </TouchableOpacity>
            )
          })}
        </View>
      </AppModal>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  stepperContainer: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingTop: 8,
    paddingBottom: 4
  },
  stepperRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.sm,
    justifyContent: 'space-between'
  },
  stepItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4
  },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3
  },
  stepBadgeActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  stepBadgeDone: {
    backgroundColor: colors.success,
    borderColor: colors.success
  },
  stepBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary
  },
  stepBadgeTextActive: {
    color: colors.white
  },
  stepLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center'
  },
  stepLabelActive: {
    color: colors.primary,
    fontWeight: '800'
  },
  stepLabelDone: {
    color: colors.textPrimary
  },
  progressBarBg: {
    height: 3,
    backgroundColor: colors.borderLight,
    marginTop: 6,
    width: '100%'
  },
  progressBarFill: {
    height: 3,
    backgroundColor: colors.primary
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 90
  },
  card: {
    padding: spacing.lg,
    marginBottom: spacing.md
  },
  cardSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight
  },
  sectionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center'
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary
  },
  sectionDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1
  },
  inputGroup: {
    marginBottom: spacing.sm
  },
  rowTwo: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: spacing.sm
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm
  },
  inputIcon: {
    marginRight: 8
  },
  inputInner: {
    flex: 1,
    fontSize: 13,
    color: colors.textPrimary,
    paddingVertical: 0
  },
  inputCode: {
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5
  },
  autoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primarySubtle,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: '#A7F3D0'
  },
  autoBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary
  },
  fieldHint: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 5,
    lineHeight: 16
  },
  textArea: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    padding: spacing.sm,
    height: 70,
    textAlignVertical: 'top'
  },
  rtScrollRow: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 2
  },
  rtChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border
  },
  rtChipActive: {
    backgroundColor: colors.primarySubtle,
    borderColor: colors.primary
  },
  rtDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
    marginRight: 6
  },
  rtDotActive: {
    backgroundColor: colors.primary
  },
  rtChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary
  },
  rtChipTextActive: {
    color: colors.primary,
    fontWeight: '800'
  },
  segmentedRow: {
    flexDirection: 'row',
    gap: 6,
    width: '100%'
  },
  segmentedBtn: {
    flex: 1,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 4
  },
  segmentedBtnActive: {
    backgroundColor: '#ECFDF5',
    borderColor: colors.primary
  },
  segmentedText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center'
  },
  segmentedTextActive: {
    color: colors.primary,
    fontWeight: '800'
  },
  gridPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6
  },
  gridPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border
  },
  gridPillActive: {
    backgroundColor: '#ECFDF5',
    borderColor: colors.primary
  },
  gridPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary
  },
  gridPillTextActive: {
    color: colors.primary,
    fontWeight: '800'
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#EFF6FF',
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: spacing.md
  },
  infoBannerText: {
    flex: 1,
    fontSize: 11,
    color: '#1E40AF',
    lineHeight: 16
  },
  sectionDivider: {
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 6
  },
  switchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight
  },
  switchTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary
  },
  switchDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 15
  },
  passwordWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm
  },
  eyeToggle: {
    padding: 6
  },
  stickyFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...shadows.floating
  },
  prevButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 10,
    paddingHorizontal: 12
  },
  prevButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 12
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary
  },
  primaryActionWrap: {
    flex: 1,
    maxWidth: 200,
    marginLeft: spacing.sm
  },
  roleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700'
  },
  roleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10
  },
  roleCard: {
    width: '48.5%',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    position: 'relative'
  },
  roleCardActive: {
    borderWidth: 1.5
  },
  roleIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  roleTextWrap: {
    flex: 1
  },
  roleCardLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary
  },
  roleCardDesc: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 1
  },
  roleCheckmark: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 15,
    height: 15,
    borderRadius: 7.5,
    alignItems: 'center',
    justifyContent: 'center'
  },
  dynamicRoleBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.md
  },
  dynamicRoleTitle: {
    fontSize: 12,
    fontWeight: '800'
  },
  dynamicRoleDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 16
  },
  helperDropdownText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10
  },
  dropdownIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center'
  },
  dropdownValueText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary
  },
  dropdownSubText: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2
  },
  disabledDropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10
  },
  disabledDropdownValueText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary
  },
  globalScopeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: radius.md,
    padding: 12,
    gap: 10
  },
  globalScopeTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#065F46'
  },
  globalScopeDesc: {
    fontSize: 11,
    color: '#047857',
    marginTop: 2,
    lineHeight: 16
  },
  pickerListContainer: {
    paddingVertical: 6,
    gap: 8
  },
  pickerItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: 10
  },
  pickerItemCardActive: {
    borderColor: colors.primary,
    backgroundColor: '#F0FDF4'
  },
  pickerItemIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center'
  },
  pickerItemIconWrapActive: {
    backgroundColor: colors.primary
  },
  pickerItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary
  },
  pickerItemTitleActive: {
    color: colors.primary,
    fontWeight: '800'
  },
  pickerItemBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#BFDBFE'
  },
  pickerItemBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1E40AF'
  },
  pickerItemSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2
  },
  pickerItemLeader: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
    marginTop: 2
  },
  pickerItemCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center'
  },
  officialAccountNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.md
  },
  officialAccountTitle: {
    fontSize: 13,
    fontWeight: '800'
  },
  officialAccountDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 16
  }
})
