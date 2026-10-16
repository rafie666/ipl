import React, { useState } from 'react'
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
  ArrowLeft,
  ArrowRight,
  Sparkles
} from 'lucide-react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useApp } from '../context/AppContext'
import AppHeader from '../components/AppHeader'
import AppCard from '../components/AppCard'
import AppButton from '../components/AppButton'
import { colors, typography, spacing, radius, shadows } from '../utils/theme'
import { generateNextKodeUnik, getKodeUnikLengkap } from '../utils/formatters'

export default function RegisterScreen({ route, navigation }) {
  const insets = useSafeAreaInsets()
  const { wargaToEdit } = route.params || {}
  const isEditing = Boolean(wargaToEdit)

  const { tambahWarga, updateWarga, currentUser, rts, warga } = useApp()

  // Steps: 'identitas' (1) | 'lokasi' (2) | 'biodata' (3) | 'akun' (4)
  const [activeTab, setActiveTab] = useState('identitas')

  // Tab 1: Unit & Identitas
  const [kodeUnik, setKodeUnik] = useState(
    wargaToEdit?.kodeUnik
      ? getKodeUnikLengkap(wargaToEdit)
      : generateNextKodeUnik(warga, 'WR')
  )
  const [nama, setNama] = useState(wargaToEdit?.nama || '')
  const [nik, setNik] = useState(wargaToEdit?.nik || '')
  const [noKk, setNoKk] = useState(wargaToEdit?.noKk || '')
  const [selectedRt, setSelectedRt] = useState(wargaToEdit?.rt_id || currentUser?.rt_id || 'rt-1')
  const [blok, setBlok] = useState(wargaToEdit?.blok || 'A')
  const [noRumah, setNoRumah] = useState(wargaToEdit?.noRumah || '')
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

  // Auto generate username dari nama KK
  const handleNamaChange = (val) => {
    setNama(val)
    if (!isEditing && val.trim()) {
      const generated = val.toLowerCase().trim().replace(/[^a-z0-9]/g, '.').replace(/\.+/g, '.')
      setUsername(generated)
    }
  }

  const stepsList = [
    { key: 'identitas', num: '1', title: 'Unit & Identitas' },
    { key: 'lokasi', num: '2', title: 'Koordinat GIS' },
    { key: 'biodata', num: '3', title: 'Biodata & Kontak' },
    ...(!isEditing ? [{ key: 'akun', num: '4', title: 'Akun Login' }] : [])
  ]

  const currentStepIdx = stepsList.findIndex((s) => s.key === activeTab)

  const handleNextTab = () => {
    if (activeTab === 'identitas') {
      if (!nama.trim() || !noRumah.trim()) {
        Alert.alert('Perhatian', 'Nama Kepala Keluarga dan Nomor Rumah wajib diisi!')
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
    if (!nama.trim() || !noRumah.trim()) {
      Alert.alert('Perhatian', 'Nama Kepala Keluarga dan Nomor Rumah wajib diisi!')
      return
    }

    if (!isEditing && createAccount) {
      if (!username.trim()) {
        Alert.alert('Perhatian', 'Username akun portal warga wajib diisi!')
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

      const payload = {
        kodeUnik: formattedKodeUnik,
        nama: nama.trim(),
        nik: nik.trim(),
        noKk: noKk.trim(),
        rt_id: selectedRt,
        blok: blok.trim().toUpperCase(),
        noRumah: noRumah.trim(),
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
        Alert.alert('Sukses', `Data warga ${nama} berhasil diperbarui!`, [
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
            Alert.alert(
              'Pendaftaran Berhasil 🎉',
              `Data warga ${nama} (Blok ${blok}/${noRumah}) berhasil disimpan ke sistem!`,
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
              <View style={styles.sectionIconWrap}>
                <Building size={16} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>Identitas Rumah & KK</Text>
                <Text style={styles.sectionDesc}>Nomor unit rumah dan nama kepala keluarga</Text>
              </View>
            </View>

            {/* Nama Kepala Keluarga (Full Width) */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nama Kepala Keluarga *</Text>
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

            {/* Rukun Tetangga (RT) */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Wilayah Rukun Tetangga (RT) *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rtScrollRow}>
                {rts.map((rt) => {
                  const isSelected = selectedRt === rt.id
                  return (
                    <TouchableOpacity
                      key={rt.id}
                      style={[styles.rtChip, isSelected && styles.rtChipActive]}
                      onPress={() => setSelectedRt(rt.id)}
                      activeOpacity={0.75}
                    >
                      <View style={[styles.rtDot, isSelected && styles.rtDotActive]} />
                      <Text style={[styles.rtChipText, isSelected && styles.rtChipTextActive]}>
                        {rt.name}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </ScrollView>
            </View>

            {/* Blok & No Rumah */}
            <View style={styles.rowTwo}>
              <View style={{ width: 84 }}>
                <Text style={styles.label}>Blok *</Text>
                <View style={styles.inputWithIcon}>
                  <Home size={14} color={colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.inputInner, { fontWeight: '700', textAlign: 'center' }]}
                    placeholder="A"
                    autoCapitalize="characters"
                    maxLength={3}
                    value={blok}
                    onChangeText={setBlok}
                  />
                </View>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Nomor Rumah *</Text>
                <View style={styles.inputWithIcon}>
                  <Building size={14} color={colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.inputInner}
                    placeholder="Contoh: 12A / 05"
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

            {createAccount && (
              <View style={{ marginTop: spacing.md }}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Username Login *</Text>
                  <View style={styles.inputWithIcon}>
                    <User size={15} color={colors.textSecondary} style={styles.inputIcon} />
                    <TextInput
                      style={styles.inputInner}
                      placeholder="contoh: agus.sutrisno"
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
  }
})
