import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
  ActivityIndicator,
  Platform
} from 'react-native'
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  Search,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Clock,
  Zap,
  Sliders,
  DollarSign,
  ArrowLeft,
  Check,
  ShieldCheck,
  Info
} from 'lucide-react-native'
import { useApp } from '../context/AppContext'
import AppButton from '../components/AppButton'
import AppModal from '../components/AppModal'
import { colors, spacing, radius, shadows, typography } from '../utils/theme'

export default function PosIuranScreen({ navigation }) {
  const {
    jenisIuran = [],
    addJenisIuran,
    updateJenisIuran,
    deleteJenisIuran,
    config,
    updateAutoBillingConfig,
    triggerManualBillingCatchUp,
    isWarga,
    isAdmin,
    isBendahara,
    isRW,
    isRT
  } = useApp()

  // Hak akses pengelola: Admin, Bendahara, RW, RT
  const canManage = !isWarga

  // Search filter
  const [searchQuery, setSearchQuery] = useState('')

  // State: Auto-Post Settings
  const autoBilling = config?.autoBilling || {
    enabled: true,
    publishDay: 5,
    publishTime: '08:00',
    dueDay: 20,
    scope: 'ALL'
  }

  const [modalAutoPost, setModalAutoPost] = useState(false)
  const [autoEnabled, setAutoEnabled] = useState(autoBilling.enabled !== false)
  const [publishDay, setPublishDay] = useState(String(autoBilling.publishDay || 5))
  const [publishTime, setPublishTime] = useState(String(autoBilling.publishTime || '08:00'))
  const [dueDay, setDueDay] = useState(String(autoBilling.dueDay || 20))
  const [billingScope, setBillingScope] = useState(autoBilling.scope || 'ALL')
  const [savingSchedule, setSavingSchedule] = useState(false)
  const [triggeringPost, setTriggeringPost] = useState(false)

  useEffect(() => {
    if (config?.autoBilling) {
      setAutoEnabled(config.autoBilling.enabled !== false)
      setPublishDay(String(config.autoBilling.publishDay || 5))
      setPublishTime(String(config.autoBilling.publishTime || '08:00'))
      setDueDay(String(config.autoBilling.dueDay || 20))
      setBillingScope(config.autoBilling.scope || 'ALL')
    }
  }, [config?.autoBilling])

  // State: Tambah Pos Iuran
  const [modalAddIuran, setModalAddIuran] = useState(false)
  const [newNamaIuran, setNewNamaIuran] = useState('')
  const [newNominalIuran, setNewNominalIuran] = useState('')
  const [newKetIuran, setNewKetIuran] = useState('')
  const [newAutoPost, setNewAutoPost] = useState(true)

  // State: Edit Pos Iuran
  const [modalEditIuran, setModalEditIuran] = useState(false)
  const [editIuranId, setEditIuranId] = useState(null)
  const [editNamaIuran, setEditNamaIuran] = useState('')
  const [editNominalIuran, setEditNominalIuran] = useState('')
  const [editKetIuran, setEditKetIuran] = useState('')
  const [editAutoPost, setEditAutoPost] = useState(true)

  const formatRupiah = (num) => 'Rp ' + Number(num || 0).toLocaleString('id-ID')

  const filteredIuran = jenisIuran.filter((item) => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return true
    return item.nama?.toLowerCase().includes(q) || item.keterangan?.toLowerCase().includes(q)
  })

  const totalNominal = jenisIuran.reduce((acc, curr) => acc + (Number(curr.nominal) || 0), 0)
  const autoPostCount = jenisIuran.filter((item) => item.autoPost !== false).length

  // Quick presets for posting time
  const timePresets = ['06:00', '08:00', '09:00', '12:00', '17:00', '20:00']

  // Simpan Jadwal Auto-Post
  const handleSaveAutoPostSchedule = async () => {
    const pDay = parseInt(publishDay, 10)
    const dDay = parseInt(dueDay, 10)
    if (isNaN(pDay) || pDay < 1 || pDay > 31) {
      Alert.alert('Peringatan', 'Tanggal posting harus di antara 1 sampai 31.')
      return
    }
    if (isNaN(dDay) || dDay < 1 || dDay > 31) {
      Alert.alert('Peringatan', 'Tanggal jatuh tempo harus di antara 1 sampai 31.')
      return
    }

    // Validate format HH:mm
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    const cleanTime = publishTime.trim()
    if (!timeRegex.test(cleanTime)) {
      Alert.alert('Peringatan', 'Format waktu posting harus HH:mm (contoh: 08:00 atau 14:30).')
      return
    }

    setSavingSchedule(true)
    try {
      const res = await updateAutoBillingConfig({
        enabled: autoEnabled,
        publishDay: pDay,
        publishTime: cleanTime,
        dueDay: dDay,
        scope: billingScope
      })

      if (res.success) {
        Alert.alert(
          'Jadwal Auto-Post Disimpan! 📅',
          `Jadwal otomatisasi terbit tagihan pos iuran berhasil disimpan:\n` +
          `• Status: ${autoEnabled ? 'Aktif 🟢' : 'Nonaktif 🔴'}\n` +
          `• Tanggal Terbit: Setiap tanggal ${pDay}\n` +
          `• Waktu/Jam: Pukul ${cleanTime} WIB\n` +
          `• Jatuh Tempo: Tanggal ${dDay}`
        )
        setModalAutoPost(false)
      } else {
        Alert.alert('Gagal', res.message || 'Gagal menyimpan pengaturan auto-post.')
      }
    } catch (e) {
      Alert.alert('Error', 'Terjadi kesalahan saat menyimpan jadwal auto-post.')
    } finally {
      setSavingSchedule(false)
    }
  }

  // Eksekusi Langsung Auto-Post Sekarang
  const handleTriggerAutoPostNow = () => {
    Alert.alert(
      'Konfirmasi Auto-Post Iuran Sekarang',
      `Sistem akan langsung menerbitkan tagihan IPL bulan ini ke seluruh warga aktif berdasarkan ${autoPostCount} pos iuran yang aktif.\n\nLanjutkan proses sekarang?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: '⚡ Terbitkan Sekarang',
          onPress: async () => {
            setTriggeringPost(true)
            try {
              const res = await triggerManualBillingCatchUp()
              if (res.success) {
                Alert.alert(
                  'Auto-Post Berhasil Diterbitkan! 🎉',
                  `${res.message || 'Proses pembuatan tagihan selesai.'}\n\n` +
                  `• Tagihan Baru Terbit: ${res.createdCount || 0} invoice\n` +
                  `• Notifikasi Warga: Terkirim`
                )
              } else {
                Alert.alert('Info Auto-Post', res.message || 'Tagihan periode ini sudah pernah diterbitkan.')
              }
            } catch (err) {
              Alert.alert('Error', 'Terjadi kesalahan saat memproses auto-post.')
            } finally {
              setTriggeringPost(false)
            }
          }
        }
      ]
    )
  }

  // Tambah Pos Iuran
  const handleTambahPosIuran = async () => {
    if (!newNamaIuran.trim() || !newNominalIuran) {
      Alert.alert('Perhatian', 'Nama pos dan nominal iuran wajib diisi!')
      return
    }
    const cleanNominal = Number(newNominalIuran.replace(/[^0-9]/g, '')) || 0
    if (cleanNominal <= 0) {
      Alert.alert('Perhatian', 'Nominal iuran harus lebih besar dari 0!')
      return
    }

    await addJenisIuran({
      nama: newNamaIuran.trim(),
      nominal: cleanNominal,
      keterangan: newKetIuran.trim(),
      autoPost: newAutoPost,
      wajib: true,
      aktif: true
    })
    setNewNamaIuran('')
    setNewNominalIuran('')
    setNewKetIuran('')
    setNewAutoPost(true)
    setModalAddIuran(false)
    Alert.alert('Sukses', 'Pos iuran baru berhasil ditambahkan!')
  }

  // Simpan Edit Pos Iuran
  const handleSimpanEditIuran = async () => {
    if (!editNamaIuran.trim() || !editNominalIuran) {
      Alert.alert('Perhatian', 'Nama pos dan nominal iuran wajib diisi!')
      return
    }
    const cleanNominal = Number(editNominalIuran.replace(/[^0-9]/g, '')) || 0
    if (cleanNominal <= 0) {
      Alert.alert('Perhatian', 'Nominal iuran harus lebih besar dari 0!')
      return
    }

    await updateJenisIuran(editIuranId, {
      nama: editNamaIuran.trim(),
      nominal: cleanNominal,
      keterangan: editKetIuran.trim(),
      autoPost: editAutoPost
    })
    setModalEditIuran(false)
    setEditIuranId(null)
    Alert.alert('Sukses', 'Pos iuran berhasil diperbarui!')
  }

  // Hapus Pos Iuran
  const handleHapusIuran = (item) => {
    Alert.alert('Hapus Pos Iuran', `Apakah Anda yakin ingin menghapus pos "${item.nama}"?`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          await deleteJenisIuran(item.id)
          Alert.alert('Sukses', 'Pos iuran berhasil dihapus.')
        }
      }
    ])
  }

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={22} color={colors.textDark} />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>Pos Tarif Iuran Lingkungan</Text>
          <Text style={styles.headerSubtitle}>Kelola pos tarif & jadwal auto-post tagihan warga</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* CARD UTAMA: JADWAL AUTO-POST IURAN */}
        <View style={styles.autoPostCard}>
          <View style={styles.autoPostHeader}>
            <View style={styles.autoPostIconWrap}>
              <Zap size={20} color="#D97706" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.autoPostTitle}>Jadwal Auto-Post Iuran</Text>
              <Text style={styles.autoPostSubtitle}>Otomatisasi penerbitan tagihan warga</Text>
            </View>
            <View style={[styles.statusBadge, autoBilling.enabled ? styles.statusBadgeActive : styles.statusBadgeInactive]}>
              <View style={[styles.statusDot, { backgroundColor: autoBilling.enabled ? '#16A34A' : '#DC2626' }]} />
              <Text style={[styles.statusBadgeText, { color: autoBilling.enabled ? '#15803D' : '#DC2626' }]}>
                {autoBilling.enabled ? 'Auto-Post Aktif' : 'Nonaktif'}
              </Text>
            </View>
          </View>

          {/* Schedule Summary Grid */}
          <View style={styles.scheduleGrid}>
            <View style={styles.scheduleGridItem}>
              <View style={styles.scheduleIconMini}>
                <Calendar size={14} color="#D97706" />
              </View>
              <View>
                <Text style={styles.scheduleItemLabel}>Tanggal Terbit</Text>
                <Text style={styles.scheduleItemValue}>
                  {autoBilling.enabled ? `Tgl ${autoBilling.publishDay || 5} tiap bulan` : '-'}
                </Text>
              </View>
            </View>

            <View style={styles.scheduleGridItem}>
              <View style={styles.scheduleIconMini}>
                <Clock size={14} color="#2563EB" />
              </View>
              <View>
                <Text style={styles.scheduleItemLabel}>Waktu / Jam</Text>
                <Text style={styles.scheduleItemValue}>
                  {autoBilling.enabled ? `Pukul ${autoBilling.publishTime || '08:00'} WIB` : '-'}
                </Text>
              </View>
            </View>
          </View>

          {/* Action Buttons for Auto-Post */}
          {canManage && (
            <View style={styles.autoPostActions}>
              <TouchableOpacity
                style={styles.btnSettingSchedule}
                onPress={() => setModalAutoPost(true)}
                activeOpacity={0.7}
              >
                <Sliders size={15} color={colors.primary} />
                <Text style={styles.btnSettingScheduleText}>Atur Tanggal & Waktu</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.btnPostNow, triggeringPost && { opacity: 0.7 }]}
                onPress={handleTriggerAutoPostNow}
                disabled={triggeringPost}
                activeOpacity={0.7}
              >
                {triggeringPost ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Zap size={15} color="#FFFFFF" />
                )}
                <Text style={styles.btnPostNowText}>
                  {triggeringPost ? 'Memproses...' : 'Auto-Post Sekarang'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Ringkasan Akumulasi Iuran */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Pos</Text>
            <Text style={styles.summaryValue}>{jenisIuran.length} Kategori</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Auto-Post</Text>
            <Text style={[styles.summaryValue, { color: '#059669' }]}>{autoPostCount} Pos Aktif</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total / Bulan</Text>
            <Text style={[styles.summaryValue, { color: colors.primary }]}>{formatRupiah(totalNominal)}</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBox}>
          <Search size={16} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari pos iuran, kebersihan, keamanan..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Section Title & Add Button */}
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionTitle}>Daftar Pos Tarif ({filteredIuran.length})</Text>
            <Text style={styles.sectionSubtitle}>Pos yang akan dimasukkan ke dalam tagihan warga</Text>
          </View>
          {canManage && (
            <TouchableOpacity
              style={styles.addMiniBtn}
              onPress={() => setModalAddIuran(true)}
              activeOpacity={0.7}
            >
              <Plus size={16} color="#FFFFFF" />
              <Text style={styles.addMiniBtnText}>Tambah Pos</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* List Pos Iuran */}
        <View style={{ gap: 10 }}>
          {filteredIuran.length === 0 ? (
            <View style={styles.emptyCard}>
              <Layers size={36} color="#94A3B8" />
              <Text style={styles.emptyTitle}>Belum Ada Pos Iuran</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery
                  ? 'Tidak ada pos iuran yang sesuai dengan kata kunci pencarian.'
                  : 'Belum ada rincian pos iuran yang terdaftar di lingkungan ini.'}
              </Text>
            </View>
          ) : (
            filteredIuran.map((item) => {
              const isItemAutoPost = item.autoPost !== false
              return (
                <View key={item.id} style={styles.cardItem}>
                  <View style={styles.iconWrap}>
                    <Layers size={20} color="#D97706" />
                  </View>

                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <Text style={styles.cardTitle}>{item.nama}</Text>
                      <View
                        style={[
                          styles.autoPostPill,
                          { backgroundColor: isItemAutoPost ? '#DCFCE7' : '#F1F5F9' }
                        ]}
                      >
                        <View
                          style={[
                            styles.statusDot,
                            { backgroundColor: isItemAutoPost ? '#16A34A' : '#94A3B8' }
                          ]}
                        />
                        <Text
                          style={[
                            styles.autoPostPillText,
                            { color: isItemAutoPost ? '#15803D' : '#64748B' }
                          ]}
                        >
                          {isItemAutoPost ? 'Auto-Post' : 'Manual'}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.cardNominal}>{formatRupiah(item.nominal) + ' / bulan'}</Text>

                    {item.keterangan ? (
                      <Text style={styles.cardDesc} numberOfLines={2}>
                        {item.keterangan}
                      </Text>
                    ) : null}
                  </View>

                  {canManage && (
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      <TouchableOpacity
                        style={styles.iconBtn}
                        onPress={() => {
                          setEditIuranId(item.id)
                          setEditNamaIuran(item.nama)
                          setEditNominalIuran(String(item.nominal))
                          setEditKetIuran(item.keterangan || '')
                          setEditAutoPost(item.autoPost !== false)
                          setModalEditIuran(true)
                        }}
                      >
                        <Edit2 size={14} color={colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.iconBtn, { backgroundColor: '#FEF2F2' }]}
                        onPress={() => handleHapusIuran(item)}
                      >
                        <Trash2 size={14} color="#DC2626" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )
            })
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* MODAL 1: ATUR JADWAL AUTO-POST */}
      <AppModal
        visible={modalAutoPost}
        title="Jadwal Auto-Post Iuran"
        subtitle="Atur tanggal dan waktu terbit tagihan otomatis"
        onClose={() => setModalAutoPost(false)}
        footer={
          <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
            <View style={{ flex: 1 }}>
              <AppButton
                title="Batal"
                variant="secondary"
                onPress={() => setModalAutoPost(false)}
              />
            </View>
            <View style={{ flex: 1 }}>
              <AppButton
                title={savingSchedule ? 'Menyimpan...' : 'Simpan Jadwal'}
                variant="primary"
                loading={savingSchedule}
                onPress={handleSaveAutoPostSchedule}
              />
            </View>
          </View>
        }
      >
        <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
          <View style={{ gap: 12 }}>
            {/* Toggle Status */}
            <View style={styles.switchBox}>
              <View style={{ flex: 1 }}>
                <Text style={styles.switchTitle}>Aktifkan Auto-Post Otomatis</Text>
                <Text style={styles.switchDesc}>
                  Sistem otomatis menerbitkan tagihan setiap bulan sesuai tanggal & waktu yang ditentukan.
                </Text>
              </View>
              <Switch
                value={autoEnabled}
                onValueChange={setAutoEnabled}
                trackColor={{ false: '#E2E8F0', true: colors.primary }}
              />
            </View>

            {/* Input Tanggal Terbit */}
            <View>
              <Text style={styles.inputLabelBold}>Tanggal Terbit Tagihan (Tgl 1 - 31):</Text>
              <TextInput
                style={styles.modalInput}
                keyboardType="numeric"
                value={publishDay}
                onChangeText={setPublishDay}
                placeholder="Contoh: 5"
                placeholderTextColor={colors.gray400}
              />
              <Text style={styles.helperText}>Tanggal saat tagihan IPL mulai muncul bagi warga.</Text>
            </View>

            {/* Input Waktu / Jam Terbit */}
            <View>
              <Text style={styles.inputLabelBold}>Waktu / Jam Terbit Otomatis (Format HH:mm):</Text>
              <TextInput
                style={styles.modalInput}
                value={publishTime}
                onChangeText={setPublishTime}
                placeholder="08:00"
                placeholderTextColor={colors.gray400}
              />

              {/* Quick Preset Pills */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                {timePresets.map((preset) => {
                  const isSelected = publishTime === preset
                  return (
                    <TouchableOpacity
                      key={preset}
                      style={[styles.presetPill, isSelected && styles.presetPillActive]}
                      onPress={() => setPublishTime(preset)}
                    >
                      <Text style={[styles.presetPillText, isSelected && styles.presetPillTextActive]}>
                        {preset} WIB
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
              <Text style={styles.helperText}>Tagihan akan otomatis terbit pada jam ini di tanggal yang dipilih.</Text>
            </View>

            {/* Input Tanggal Jatuh Tempo */}
            <View>
              <Text style={styles.inputLabelBold}>Tanggal Jatuh Tempo (Tgl 1 - 31):</Text>
              <TextInput
                style={styles.modalInput}
                keyboardType="numeric"
                value={dueDay}
                onChangeText={setDueDay}
                placeholder="Contoh: 20"
                placeholderTextColor={colors.gray400}
              />
            </View>

            {/* Cakupan Penagihan */}
            <View>
              <Text style={styles.inputLabelBold}>Cakupan Penagihan:</Text>
              <View style={styles.scopeRow}>
                {[
                  { id: 'ALL', label: 'Semua (RT & RW)' },
                  { id: 'RT', label: 'Hanya RT' },
                  { id: 'RW', label: 'Hanya RW' }
                ].map((sc) => {
                  const isSel = billingScope === sc.id
                  return (
                    <TouchableOpacity
                      key={sc.id}
                      style={[styles.scopeBtn, isSel && styles.scopeBtnActive]}
                      onPress={() => setBillingScope(sc.id)}
                    >
                      <Text style={[styles.scopeBtnText, isSel && styles.scopeBtnTextActive]}>
                        {sc.label}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            </View>
          </View>
        </ScrollView>
      </AppModal>

      {/* MODAL 2: TAMBAH POS IURAN */}
      <AppModal
        visible={modalAddIuran}
        title="Tambah Pos Iuran Baru"
        onClose={() => setModalAddIuran(false)}
        footer={
          <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
            <View style={{ flex: 1 }}>
              <AppButton title="Batal" variant="secondary" onPress={() => setModalAddIuran(false)} />
            </View>
            <View style={{ flex: 1 }}>
              <AppButton title="Simpan" variant="primary" onPress={handleTambahPosIuran} />
            </View>
          </View>
        }
      >
        <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
          <View style={{ gap: 10 }}>
            <Text style={styles.inputLabelBold}>Nama Pos Iuran *</Text>
            <TextInput
              style={styles.modalInput}
              value={newNamaIuran}
              onChangeText={setNewNamaIuran}
              placeholder="Contoh: Iuran Kebersihan & Sampah"
              placeholderTextColor={colors.textSecondary}
            />

            <Text style={styles.inputLabelBold}>Tarif Nominal (Rp) *</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="numeric"
              value={newNominalIuran}
              onChangeText={setNewNominalIuran}
              placeholder="Contoh: 50000"
              placeholderTextColor={colors.textSecondary}
            />

            <Text style={styles.inputLabelBold}>Keterangan / Alokasi</Text>
            <TextInput
              style={[styles.modalInput, { height: 60, textAlignVertical: 'top', paddingTop: 8 }]}
              multiline
              value={newKetIuran}
              onChangeText={setNewKetIuran}
              placeholder="Contoh: Pengangkutan sampah rutin 3x seminggu"
              placeholderTextColor={colors.textSecondary}
            />

            <View style={styles.switchBox}>
              <View style={{ flex: 1 }}>
                <Text style={styles.switchTitle}>Auto-Post Bulanan</Text>
                <Text style={styles.switchDesc}>Sertakan pos ini ke dalam tagihan bulanan otomatis.</Text>
              </View>
              <Switch
                value={newAutoPost}
                onValueChange={setNewAutoPost}
                trackColor={{ false: '#E2E8F0', true: colors.primary }}
              />
            </View>
          </View>
        </ScrollView>
      </AppModal>

      {/* MODAL 3: EDIT POS IURAN */}
      <AppModal
        visible={modalEditIuran}
        title="Edit Pos Iuran"
        onClose={() => setModalEditIuran(false)}
        footer={
          <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
            <View style={{ flex: 1 }}>
              <AppButton title="Batal" variant="secondary" onPress={() => setModalEditIuran(false)} />
            </View>
            <View style={{ flex: 1 }}>
              <AppButton title="Simpan" variant="primary" onPress={handleSimpanEditIuran} />
            </View>
          </View>
        }
      >
        <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
          <View style={{ gap: 10 }}>
            <Text style={styles.inputLabelBold}>Nama Pos Iuran *</Text>
            <TextInput
              style={styles.modalInput}
              value={editNamaIuran}
              onChangeText={setEditNamaIuran}
            />

            <Text style={styles.inputLabelBold}>Tarif Nominal (Rp) *</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="numeric"
              value={editNominalIuran}
              onChangeText={setEditNominalIuran}
            />

            <Text style={styles.inputLabelBold}>Keterangan / Alokasi</Text>
            <TextInput
              style={[styles.modalInput, { height: 60, textAlignVertical: 'top', paddingTop: 8 }]}
              multiline
              value={editKetIuran}
              onChangeText={setEditKetIuran}
            />

            <View style={styles.switchBox}>
              <View style={{ flex: 1 }}>
                <Text style={styles.switchTitle}>Auto-Post Bulanan</Text>
                <Text style={styles.switchDesc}>Sertakan pos ini ke dalam tagihan bulanan otomatis.</Text>
              </View>
              <Switch
                value={editAutoPost}
                onValueChange={setEditAutoPost}
                trackColor={{ false: '#E2E8F0', true: colors.primary }}
              />
            </View>
          </View>
        </ScrollView>
      </AppModal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: 48,
    paddingBottom: spacing.md,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
    ...shadows.sm
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray50,
    marginRight: spacing.sm
  },
  headerTextWrap: {
    flex: 1
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: typography.bold,
    color: colors.textDark
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.gray500,
    marginTop: 2
  },
  scrollContent: {
    padding: spacing.md,
    gap: 14
  },

  // Auto-Post Master Card
  autoPostCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.sm,
    gap: 12
  },
  autoPostHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  autoPostIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center'
  },
  autoPostTitle: {
    fontSize: 15,
    fontWeight: typography.bold,
    color: colors.textDark
  },
  autoPostSubtitle: {
    fontSize: 11.5,
    color: colors.gray500,
    marginTop: 1
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full
  },
  statusBadgeActive: {
    backgroundColor: '#DCFCE7'
  },
  statusBadgeInactive: {
    backgroundColor: '#FEE2E2'
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: typography.bold
  },
  scheduleGrid: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: radius.md,
    padding: 10,
    gap: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9'
  },
  scheduleGridItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  scheduleIconMini: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  scheduleItemLabel: {
    fontSize: 11,
    color: colors.gray500
  },
  scheduleItemValue: {
    fontSize: 12.5,
    fontWeight: typography.bold,
    color: colors.textDark,
    marginTop: 1
  },
  autoPostActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 2
  },
  btnSettingSchedule: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 10
  },
  btnSettingScheduleText: {
    fontSize: 12.5,
    fontWeight: typography.semibold,
    color: colors.primary
  },
  btnPostNow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#D97706',
    borderRadius: radius.md,
    paddingVertical: 10,
    ...shadows.sm
  },
  btnPostNowText: {
    fontSize: 12.5,
    fontWeight: typography.bold,
    color: '#FFFFFF'
  },

  // Summary Card
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center'
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center'
  },
  summaryLabel: {
    fontSize: 11,
    color: colors.textSecondary
  },
  summaryValue: {
    fontSize: 13.5,
    fontWeight: typography.bold,
    color: colors.textDark,
    marginTop: 2
  },
  summaryDivider: {
    width: 1,
    height: 26,
    backgroundColor: '#E2E8F0'
  },

  // Search
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 42,
    gap: 8
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A'
  },

  // Section Header
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: typography.bold,
    color: colors.textDark
  },
  sectionSubtitle: {
    fontSize: 11,
    color: colors.gray500
  },
  addMiniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.md
  },
  addMiniBtnText: {
    fontSize: 12,
    fontWeight: typography.bold,
    color: '#FFFFFF'
  },

  // Cards
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
    ...shadows.sm
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center'
  },
  cardTitle: {
    fontSize: 13.5,
    fontWeight: typography.bold,
    color: colors.textDark
  },
  cardNominal: {
    fontSize: 13,
    fontWeight: typography.bold,
    color: colors.primary,
    marginTop: 2
  },
  cardDesc: {
    fontSize: 11.5,
    color: colors.textSecondary,
    marginTop: 2
  },
  autoPostPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full
  },
  autoPostPillText: {
    fontSize: 10,
    fontWeight: typography.bold
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center'
  },

  // Empty state
  emptyCard: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: typography.bold,
    color: colors.textDark
  },
  emptySubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center'
  },

  // Modal elements
  inputLabelBold: {
    fontSize: 12.5,
    fontWeight: typography.bold,
    color: colors.textDark,
    marginBottom: 4
  },
  modalInput: {
    backgroundColor: colors.gray50,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: colors.textDark
  },
  helperText: {
    fontSize: 11,
    color: colors.gray500,
    marginTop: 4
  },
  switchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10
  },
  switchTitle: {
    fontSize: 13,
    fontWeight: typography.bold,
    color: colors.textDark
  },
  switchDesc: {
    fontSize: 11,
    color: colors.gray500,
    marginTop: 1
  },
  presetPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  presetPillActive: {
    backgroundColor: '#EFF6FF',
    borderColor: colors.primary
  },
  presetPillText: {
    fontSize: 11,
    color: colors.gray600,
    fontWeight: typography.semibold
  },
  presetPillTextActive: {
    color: colors.primary,
    fontWeight: typography.bold
  },
  scopeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4
  },
  scopeBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  scopeBtnActive: {
    backgroundColor: '#EFF6FF',
    borderColor: colors.primary
  },
  scopeBtnText: {
    fontSize: 11.5,
    color: colors.gray600,
    fontWeight: typography.semibold
  },
  scopeBtnTextActive: {
    color: colors.primary,
    fontWeight: typography.bold
  }
})
