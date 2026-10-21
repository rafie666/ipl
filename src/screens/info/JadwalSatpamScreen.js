import React, { useState, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  TextInput,
  Image,
  Alert,
  Platform,
  Share
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  ShieldCheck,
  Shield,
  Clock,
  Calendar,
  Phone,
  PhoneCall,
  MessageCircle,
  MapPin,
  User,
  Plus,
  Edit3,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Search,
  Sparkles,
  X,
  Info,
  Lock,
  Sunrise,
  Sun,
  Moon,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react-native'
import { useApp } from '../../context/AppContext'
import TopAppBar from '../../components/layout/TopAppBar'
import AppCard from '../../components/shared/AppCard'
import AppBadge from '../../components/shared/AppBadge'
import AppButton from '../../components/shared/AppButton'
import AppModal from '../../components/modals/AppModal'
import { colors, typography, spacing, radius, shadows } from '../../utils/theme'

const HARI_LIST = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']

export default function JadwalSatpamScreen({ navigation }) {
  const insets = useSafeAreaInsets()
  const {
    currentUser,
    isWarga,
    isRT,
    isRW,
    isAdmin,
    isPengurus,
    jadwalSatpam = [],
    petugasSatpam = [],
    tambahJadwalShift,
    updateJadwalShift,
    hapusJadwalShift,
    updatePetugasSatpam
  } = useApp()

  const canManage = isAdmin || isRT || isRW || isPengurus

  // Tentukan hari saat ini dalam bahasa Indonesia
  const todayDayName = useMemo(() => {
    const dayIndex = new Date().getDay() // 0 = Sunday, 1 = Monday, ...
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
    return days[dayIndex]
  }, [])

  // Tentukan shift saat ini berdasarkan jam real-time
  const currentShiftName = useMemo(() => {
    const currentHour = new Date().getHours()
    if (currentHour >= 7 && currentHour < 15) return 'Pagi'
    if (currentHour >= 15 && currentHour < 23) return 'Siang'
    return 'Malam'
  }, [])

  const [selectedHari, setSelectedHari] = useState(todayDayName)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSopModal, setShowSopModal] = useState(false)
  const [showPortalDetails, setShowPortalDetails] = useState(false)

  // Edit / Add Modal States
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingShift, setEditingShift] = useState(null)
  const [formHari, setFormHari] = useState(selectedHari)
  const [formShift, setFormShift] = useState('Pagi')
  const [formJam, setFormJam] = useState('07:00 - 15:00')
  const [formLokasi, setFormLokasi] = useState('Pos Utama & Portal Timur')
  const [formCatatan, setFormCatatan] = useState('')
  const [formPetugasIds, setFormPetugasIds] = useState([])

  // Filter jadwal untuk hari yang dipilih
  const filteredJadwal = useMemo(() => {
    return (jadwalSatpam || []).filter((j) => {
      const matchHari = j.hari.toLowerCase() === selectedHari.toLowerCase()
      if (!matchHari) return false
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      const matchShift = j.shift?.toLowerCase().includes(q)
      const matchLokasi = j.lokasi?.toLowerCase().includes(q)
      const matchCatatan = j.catatan?.toLowerCase().includes(q)
      const matchPetugas = (j.petugasIds || []).some((id) => {
        const p = petugasSatpam.find((sec) => sec.id === id)
        return p?.nama?.toLowerCase().includes(q) || p?.jabatan?.toLowerCase().includes(q)
      })
      return matchShift || matchLokasi || matchCatatan || matchPetugas
    })
  }, [jadwalSatpam, selectedHari, searchQuery, petugasSatpam])

  // Petugas aktif saat ini (hari ini & shift ini)
  const currentActiveShift = useMemo(() => {
    return (jadwalSatpam || []).find(
      (j) => j.hari.toLowerCase() === todayDayName.toLowerCase() && j.shift.toLowerCase() === currentShiftName.toLowerCase()
    )
  }, [jadwalSatpam, todayDayName, currentShiftName])

  const activePetugasList = useMemo(() => {
    if (!currentActiveShift) return []
    return (currentActiveShift.petugasIds || [])
      .map((id) => petugasSatpam.find((p) => p.id === id))
      .filter(Boolean)
  }, [currentActiveShift, petugasSatpam])

  const handleCall = (number) => {
    if (!number) {
      Alert.alert('Informasi', 'Nomor telepon tidak tersedia.')
      return
    }
    const cleanNumber = number.replace(/[^0-9+]/g, '')
    Linking.openURL(`tel:${cleanNumber}`).catch(() => {
      Alert.alert('Gagal', 'Tidak dapat membuka aplikasi telepon.')
    })
  }

  const handleWhatsApp = (number, customText = '') => {
    if (!number) {
      Alert.alert('Informasi', 'Nomor WhatsApp tidak tersedia.')
      return
    }
    let clean = number.replace(/[^0-9]/g, '')
    if (clean.startsWith('0')) {
      clean = '62' + clean.slice(1)
    }
    const msg = customText || 'Halo Pak Satpam, saya warga komplek ingin mengonfirmasi terkait keamanan pos jaga.'
    const url = `https://wa.me/${clean}?text=${encodeURIComponent(msg)}`
    Linking.openURL(url).catch(() => {
      Alert.alert('Gagal', 'Tidak dapat membuka aplikasi WhatsApp.')
    })
  }

  const handleOpenEditModal = (shift = null) => {
    if (shift) {
      setEditingShift(shift)
      setFormHari(shift.hari)
      setFormShift(shift.shift)
      setFormJam(shift.jam)
      setFormLokasi(shift.lokasi)
      setFormCatatan(shift.catatan || '')
      setFormPetugasIds(shift.petugasIds || [])
    } else {
      setEditingShift(null)
      setFormHari(selectedHari)
      setFormShift('Pagi')
      setFormJam('07:00 - 15:00')
      setFormLokasi('Pos Utama Gerbang Depan')
      setFormCatatan('')
      setFormPetugasIds([petugasSatpam[0]?.id || 'sec-1'])
    }
    setEditModalOpen(true)
  }

  const handleSaveShift = async () => {
    if (!formShift || !formJam) {
      Alert.alert('Peringatan', 'Harap isi nama shift dan jam tugas.')
      return
    }

    if (editingShift) {
      await updateJadwalShift(editingShift.id, {
        hari: formHari,
        shift: formShift,
        jam: formJam,
        lokasi: formLokasi,
        catatan: formCatatan,
        petugasIds: formPetugasIds
      })
      Alert.alert('Sukses', 'Jadwal shift berhasil diperbarui.')
    } else {
      await tambahJadwalShift({
        hari: formHari,
        shift: formShift,
        jam: formJam,
        lokasi: formLokasi,
        catatan: formCatatan,
        petugasIds: formPetugasIds
      })
      Alert.alert('Sukses', 'Jadwal shift baru berhasil ditambahkan.')
    }
    setEditModalOpen(false)
  }

  const handleDeleteShift = (shift) => {
    Alert.alert(
      'Hapus Jadwal',
      `Yakin ingin menghapus shift ${shift.shift} pada hari ${shift.hari}?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            await hapusJadwalShift(shift.id)
            Alert.alert('Dihapus', 'Jadwal shift berhasil dihapus.')
          }
        }
      ]
    )
  }

  const togglePetugasSelection = (petugasId) => {
    if (formPetugasIds.includes(petugasId)) {
      setFormPetugasIds(formPetugasIds.filter((id) => id !== petugasId))
    } else {
      setFormPetugasIds([...formPetugasIds, petugasId])
    }
  }

  const getShiftIcon = (shiftName) => {
    const s = shiftName?.toLowerCase() || ''
    if (s.includes('pagi')) return <Sunrise size={18} color="#D97706" />
    if (s.includes('siang') || s.includes('sore')) return <Sun size={18} color="#EA580C" />
    return <Moon size={18} color="#4338CA" />
  }

  const getShiftColor = (shiftName) => {
    const s = shiftName?.toLowerCase() || ''
    if (s.includes('pagi')) return { bg: '#FEF3C7', border: '#FDE68A', text: '#B45309' }
    if (s.includes('siang') || s.includes('sore')) return { bg: '#FFEDD5', border: '#FED7AA', text: '#C2410C' }
    return { bg: '#EEF2FF', border: '#E0E7FF', text: '#4338CA' }
  }

  return (
    <View style={styles.container}>
      <TopAppBar
        title="Jadwal Satpam & Keamanan"
        subtitle="Pos Siaga 24 Jam & Jadwal Shift Jaga"
        navigation={navigation}
        rightElement={
          canManage ? (
            <TouchableOpacity
              style={styles.headerBtn}
              onPress={() => handleOpenEditModal(null)}
              activeOpacity={0.8}
            >
              <Plus size={18} color="#FFFFFF" />
            </TouchableOpacity>
          ) : null
        }
      />

      <ScrollView
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ===================== HERO CARD: STATUS SIAGA SAAT INI ===================== */}
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroBadge}>
              <View style={styles.livePulseDot} />
              <Text style={styles.heroBadgeText}>POS SIAGA 24 JAM AKTIF</Text>
            </View>
            <View style={styles.timeTag}>
              <Clock size={12} color="#047857" />
              <Text style={styles.timeTagText}>Shift {currentShiftName} Aktif</Text>
            </View>
          </View>

          <Text style={styles.heroTitle}>Pos Satpam Gerbang Utama</Text>
          <Text style={styles.heroDesc}>
            Perumahan Alam Tirta Lestari — Gerbang Masuk & Pos Pantau Terpadu
          </Text>

          {/* Petugas Sedang Bertugas Sekarang */}
          <View style={styles.onDutyBox}>
            <View style={styles.onDutyHeader}>
              <ShieldCheck size={16} color="#059669" />
              <Text style={styles.onDutyTitle}>Petugas On-Duty Saat Ini:</Text>
            </View>

            {activePetugasList.length > 0 ? (
              <View style={styles.dutyList}>
                {activePetugasList.map((p) => (
                  <View key={p.id} style={styles.dutyMember}>
                    <Image
                      source={{ uri: p.foto || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' }}
                      style={styles.dutyAvatar}
                    />
                    <View style={styles.dutyInfo}>
                      <Text style={styles.dutyName}>{p.nama}</Text>
                      <Text style={styles.dutyRole}>{p.jabatan} • {p.posUtama}</Text>
                    </View>
                    <View style={styles.dutyActions}>
                      <TouchableOpacity
                        style={styles.miniCallBtn}
                        onPress={() => handleCall(p.telepon)}
                        activeOpacity={0.8}
                      >
                        <Phone size={14} color="#059669" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.miniWaBtn}
                        onPress={() => handleWhatsApp(p.wa)}
                        activeOpacity={0.8}
                      >
                        <MessageCircle size={14} color="#25D366" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyDuty}>
                <Text style={styles.emptyDutyText}>
                  Petugas pos induk siaga di pos gerbang utama (Bpk. Joko Susilo & Tim).
                </Text>
              </View>
            )}
          </View>

          {/* Quick Call Buttons */}
          <View style={styles.heroActionRow}>
            <TouchableOpacity
              style={[styles.quickActionBtn, styles.callPrimaryBtn]}
              onPress={() => handleCall('081299887766')}
              activeOpacity={0.85}
            >
              <PhoneCall size={16} color="#FFFFFF" />
              <Text style={styles.callPrimaryText}>Panggil Pos Utama</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionBtn, styles.waSecondaryBtn]}
              onPress={() => handleWhatsApp('081299887766')}
              activeOpacity={0.85}
            >
              <MessageCircle size={16} color="#047857" />
              <Text style={styles.waSecondaryText}>WhatsApp Pos</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ===================== INFO PORTAL & SOP SINGKAT ===================== */}
        <TouchableOpacity
          style={styles.sopAccordionCard}
          onPress={() => setShowPortalDetails(!showPortalDetails)}
          activeOpacity={0.9}
        >
          <View style={styles.sopLeft}>
            <View style={styles.sopIconCircle}>
              <Lock size={18} color="#334155" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sopTitle}>Jadwal Portal & Protokol Keamanan</Text>
              <Text style={styles.sopSubtitle}>
                Jam malam 23:00 - 05:00 WIB • Titip paket kurir • Tamu menginap
              </Text>
            </View>
          </View>
          {showPortalDetails ? (
            <ChevronUp size={18} color="#334155" />
          ) : (
            <ChevronDown size={18} color="#94A3B8" />
          )}
        </TouchableOpacity>

        {showPortalDetails && (
          <View style={styles.sopDetailsBox}>
            <View style={styles.sopItem}>
              <View style={[styles.sopBullet, { backgroundColor: '#10B981' }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.sopItemTitle}>05:00 WIB — Portal Utama & Belakang Dibuka</Text>
                <Text style={styles.sopItemDesc}>
                  Akses jalan warga dibuka penuh untuk aktivitas pagi, sekolah, dan mobilitas kerja.
                </Text>
              </View>
            </View>

            <View style={styles.sopItem}>
              <View style={[styles.sopBullet, { backgroundColor: '#F59E0B' }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.sopItemTitle}>18:00 WIB — Portal Belakang (Timur) Ditutup</Text>
                <Text style={styles.sopItemDesc}>
                  Seluruh kendaraan dialihkan melalui Pos Utama Gerbang Depan untuk pendataan.
                </Text>
              </View>
            </View>

            <View style={styles.sopItem}>
              <View style={[styles.sopBullet, { backgroundColor: '#EF4444' }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.sopItemTitle}>23:00 - 05:00 WIB — Jam Malam Komplek Aktif</Text>
                <Text style={styles.sopItemDesc}>
                  Portal utama ditutup rapat. Tamu wajib lapor dan meninggalkan kartu identitas di pos satpam. Patroli berkala tiap 2 jam (00:00, 02:00, 04:00 WIB).
                </Text>
              </View>
            </View>

            <View style={styles.sopItem}>
              <View style={[styles.sopBullet, { backgroundColor: '#2563EB' }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.sopItemTitle}>Penerimaan Paket / Titipan Ekspedisi</Text>
                <Text style={styles.sopItemDesc}>
                  Warga yang sedang bepergian dapat mengarahkan kurir menitipkan paket di Pos Satpam Utama dengan pencatatan buku ekspedisi warga.
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.laporShortcutBtn}
              onPress={() => navigation.navigate('Pengaduan')}
              activeOpacity={0.8}
            >
              <AlertTriangle size={15} color="#D97706" />
              <Text style={styles.laporShortcutText}>
                Ada kendala keamanan? Laporkan langsung via Aduan Warga
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ===================== SELECTOR HARI (SENIN - MINGGU) ===================== */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Pilih Hari Jadwal Shift</Text>
          <Text style={styles.sectionSub}>Lihat penugasan regu satpam per hari</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dayScrollContainer}
        >
          {HARI_LIST.map((hari) => {
            const isSelected = selectedHari.toLowerCase() === hari.toLowerCase()
            const isToday = todayDayName.toLowerCase() === hari.toLowerCase()
            return (
              <TouchableOpacity
                key={hari}
                style={[
                  styles.dayPill,
                  isSelected && styles.dayPillSelected,
                  isToday && !isSelected && styles.dayPillToday
                ]}
                onPress={() => setSelectedHari(hari)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.dayPillText,
                    isSelected && styles.dayPillTextSelected,
                    isToday && !isSelected && styles.dayPillTextToday
                  ]}
                >
                  {hari}
                </Text>
                {isToday && (
                  <View style={[styles.todayIndicator, isSelected && { backgroundColor: '#FFFFFF' }]} />
                )}
              </TouchableOpacity>
            )
          })}
        </ScrollView>

        {/* Search Filter */}
        <View style={styles.searchBox}>
          <Search size={16} color="#94A3B8" />
          <TextInput
            placeholder={`Cari shift, nama satpam, atau lokasi di hari ${selectedHari}...`}
            placeholderTextColor="#94A3B8"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={16} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {/* ===================== LIST SHIFT HARI TERPILIH ===================== */}
        <View style={styles.shiftList}>
          {filteredJadwal.length > 0 ? (
            filteredJadwal.map((shiftItem) => {
              const isCurrentActive =
                selectedHari.toLowerCase() === todayDayName.toLowerCase() &&
                shiftItem.shift.toLowerCase() === currentShiftName.toLowerCase()
              const colorsTheme = getShiftColor(shiftItem.shift)
              const assignedPetugas = (shiftItem.petugasIds || [])
                .map((id) => petugasSatpam.find((p) => p.id === id))
                .filter(Boolean)

              return (
                <View
                  key={shiftItem.id}
                  style={[
                    styles.shiftCard,
                    isCurrentActive && styles.shiftCardActive
                  ]}
                >
                  {/* Shift Header */}
                  <View style={styles.shiftCardHeader}>
                    <View style={styles.shiftBadgeGroup}>
                      <View style={[styles.shiftBadge, { backgroundColor: colorsTheme.bg, borderColor: colorsTheme.border }]}>
                        {getShiftIcon(shiftItem.shift)}
                        <Text style={[styles.shiftBadgeText, { color: colorsTheme.text }]}>
                          Shift {shiftItem.shift}
                        </Text>
                      </View>
                      <View style={styles.clockTag}>
                        <Clock size={12} color="#64748B" />
                        <Text style={styles.clockTagText}>{shiftItem.jam}</Text>
                      </View>
                    </View>

                    {isCurrentActive && (
                      <View style={styles.activeNowBadge}>
                        <View style={styles.activeNowDot} />
                        <Text style={styles.activeNowText}>BERLANGSUNG</Text>
                      </View>
                    )}
                  </View>

                  {/* Lokasi Pos Jaga */}
                  <View style={styles.locationRow}>
                    <MapPin size={14} color="#DC2626" />
                    <Text style={styles.locationText}>{shiftItem.lokasi}</Text>
                  </View>

                  {/* Catatan Khusus */}
                  {shiftItem.catatan ? (
                    <View style={styles.catatanBox}>
                      <Info size={13} color="#0284C7" />
                      <Text style={styles.catatanText}>{shiftItem.catatan}</Text>
                    </View>
                  ) : null}

                  {/* Petugas Jaga */}
                  <View style={styles.petugasSection}>
                    <Text style={styles.petugasLabel}>
                      Petugas Jaga ({assignedPetugas.length} Petugas):
                    </Text>

                    <View style={styles.petugasCardsGrid}>
                      {assignedPetugas.map((sec) => (
                        <View key={sec.id} style={styles.secItemCard}>
                          <Image
                            source={{ uri: sec.foto || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' }}
                            style={styles.secItemAvatar}
                          />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.secItemName}>{sec.nama}</Text>
                            <Text style={styles.secItemJob}>{sec.jabatan}</Text>
                            <Text style={styles.secItemPhone}>{sec.telepon}</Text>
                          </View>

                          <View style={styles.secItemActions}>
                            <TouchableOpacity
                              style={styles.secMiniCall}
                              onPress={() => handleCall(sec.telepon)}
                              activeOpacity={0.8}
                            >
                              <Phone size={13} color="#059669" />
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.secMiniWa}
                              onPress={() => handleWhatsApp(sec.wa)}
                              activeOpacity={0.8}
                            >
                              <MessageCircle size={13} color="#25D366" />
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Action Manage untuk RT/RW/Admin/Pengurus */}
                  {canManage && (
                    <View style={styles.manageFooterRow}>
                      <TouchableOpacity
                        style={styles.manageBtnEdit}
                        onPress={() => handleOpenEditModal(shiftItem)}
                        activeOpacity={0.8}
                      >
                        <Edit3 size={13} color="#4F46E5" />
                        <Text style={styles.manageBtnEditText}>Ubah Shift / Petugas</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.manageBtnDelete}
                        onPress={() => handleDeleteShift(shiftItem)}
                        activeOpacity={0.8}
                      >
                        <Trash2 size={13} color="#EF4444" />
                        <Text style={styles.manageBtnDeleteText}>Hapus</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )
            })
          ) : (
            <View style={styles.emptyCard}>
              <Shield size={40} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>Belum Ada Jadwal untuk Hari {selectedHari}</Text>
              <Text style={styles.emptyDesc}>
                {canManage
                  ? 'Anda dapat menambahkan jadwal shift baru untuk hari ini menggunakan tombol di bawah.'
                  : 'Jadwal shift untuk hari ini belum ditambahkan oleh pengurus lingkungan.'}
              </Text>
              {canManage && (
                <TouchableOpacity
                  style={styles.emptyAddBtn}
                  onPress={() => handleOpenEditModal(null)}
                  activeOpacity={0.85}
                >
                  <Plus size={16} color="#FFFFFF" />
                  <Text style={styles.emptyAddBtnText}>Tambah Shift {selectedHari}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* ===================== DAFTAR SELURUH REGU SATPAM ===================== */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Semua Petugas Keamanan</Text>
          <Text style={styles.sectionSub}>Tim Satpam Perumahan Alam Tirta Lestari</Text>
        </View>

        <View style={styles.allSecContainer}>
          {petugasSatpam.map((p) => (
            <View key={p.id} style={styles.allSecCard}>
              <Image
                source={{ uri: p.foto || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' }}
                style={styles.allSecAvatar}
              />
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.allSecName}>{p.nama}</Text>
                <Text style={styles.allSecRole}>{p.jabatan}</Text>
                <View style={styles.allSecPosRow}>
                  <MapPin size={11} color="#64748B" />
                  <Text style={styles.allSecPosText}>{p.posUtama}</Text>
                </View>
              </View>
              <View style={styles.allSecActionCol}>
                <TouchableOpacity
                  style={styles.allSecCallBtn}
                  onPress={() => handleCall(p.telepon)}
                  activeOpacity={0.8}
                >
                  <Phone size={14} color="#059669" />
                  <Text style={styles.allSecCallText}>Hubungi</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.allSecWaBtn}
                  onPress={() => handleWhatsApp(p.wa)}
                  activeOpacity={0.8}
                >
                  <MessageCircle size={14} color="#25D366" />
                  <Text style={styles.allSecWaText}>WA</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* ===================== MODAL EDIT / TAMBAH JADWAL ===================== */}
      <AppModal
        visible={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={editingShift ? 'Ubah Jadwal Shift Satpam' : 'Tambah Jadwal Shift Baru'}
      >
        <ScrollView style={{ maxHeight: 480 }} showsVerticalScrollIndicator={false}>
          {/* Pilih Hari */}
          <Text style={styles.modalFieldLabel}>Hari Bertugas *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            {HARI_LIST.map((h) => (
              <TouchableOpacity
                key={h}
                style={[
                  styles.modalPill,
                  formHari.toLowerCase() === h.toLowerCase() && styles.modalPillActive
                ]}
                onPress={() => setFormHari(h)}
              >
                <Text
                  style={[
                    styles.modalPillText,
                    formHari.toLowerCase() === h.toLowerCase() && styles.modalPillTextActive
                  ]}
                >
                  {h}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Pilih Shift */}
          <Text style={styles.modalFieldLabel}>Nama Shift *</Text>
          <View style={styles.shiftSelectorRow}>
            {['Pagi', 'Siang', 'Malam'].map((s) => (
              <TouchableOpacity
                key={s}
                style={[
                  styles.shiftSelectorBtn,
                  formShift.toLowerCase() === s.toLowerCase() && styles.shiftSelectorBtnActive
                ]}
                onPress={() => {
                  setFormShift(s)
                  if (s === 'Pagi') setFormJam('07:00 - 15:00')
                  if (s === 'Siang') setFormJam('15:00 - 23:00')
                  if (s === 'Malam') setFormJam('23:00 - 07:00')
                }}
              >
                <Text
                  style={[
                    styles.shiftSelectorText,
                    formShift.toLowerCase() === s.toLowerCase() && styles.shiftSelectorTextActive
                  ]}
                >
                  Shift {s}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Jam Kerja */}
          <Text style={styles.modalFieldLabel}>Jam Kerja *</Text>
          <TextInput
            style={styles.modalInput}
            value={formJam}
            onChangeText={setFormJam}
            placeholder="Contoh: 07:00 - 15:00"
            placeholderTextColor="#94A3B8"
          />

          {/* Lokasi Pos Jaga */}
          <Text style={styles.modalFieldLabel}>Lokasi Pos / Penugasan *</Text>
          <TextInput
            style={styles.modalInput}
            value={formLokasi}
            onChangeText={setFormLokasi}
            placeholder="Contoh: Pos Utama & Portal Timur"
            placeholderTextColor="#94A3B8"
          />

          {/* Catatan Khusus */}
          <Text style={styles.modalFieldLabel}>Catatan Operasional (Opsional)</Text>
          <TextInput
            style={[styles.modalInput, { height: 72, textAlignVertical: 'top' }]}
            value={formCatatan}
            onChangeText={setFormCatatan}
            placeholder="Misal: Penutupan portal timur jam 18:00, terima paket warga..."
            placeholderTextColor="#94A3B8"
            multiline
          />

          {/* Pilih Petugas Satpam yang Bertugas */}
          <Text style={styles.modalFieldLabel}>Pilih Petugas yang Bertugas *</Text>
          <View style={styles.modalPetugasList}>
            {petugasSatpam.map((p) => {
              const isSelected = formPetugasIds.includes(p.id)
              return (
                <TouchableOpacity
                  key={p.id}
                  style={[
                    styles.modalPetugasItem,
                    isSelected && styles.modalPetugasItemActive
                  ]}
                  onPress={() => togglePetugasSelection(p.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.checkCircle}>
                    {isSelected && <CheckCircle2 size={16} color="#059669" />}
                  </View>
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={[styles.modalPetugasName, isSelected && { color: '#065F46', fontWeight: '700' }]}>
                      {p.nama}
                    </Text>
                    <Text style={styles.modalPetugasDesc}>{p.jabatan} • {p.telepon}</Text>
                  </View>
                </TouchableOpacity>
              )
            })}
          </View>

          {/* Modal Actions */}
          <View style={styles.modalBtnRow}>
            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => setEditModalOpen(false)}
            >
              <Text style={styles.modalCancelText}>Batal</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalSaveBtn}
              onPress={handleSaveShift}
            >
              <Text style={styles.modalSaveText}>Simpan Jadwal</Text>
            </TouchableOpacity>
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
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 12
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2
  },

  /* HERO CARD */
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    ...shadows.card
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#A7F3D0'
  },
  livePulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 6
  },
  heroBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46',
    letterSpacing: 0.3
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  },
  timeTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#047857'
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4
  },
  heroDesc: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 16
  },

  /* ON DUTY BOX */
  onDutyBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16
  },
  onDutyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10
  },
  onDutyTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    textTransform: 'uppercase',
    letterSpacing: 0.4
  },
  dutyList: {
    gap: 8
  },
  dutyMember: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  dutyAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: '#E2E8F0'
  },
  dutyInfo: {
    flex: 1
  },
  dutyName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B'
  },
  dutyRole: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1
  },
  dutyActions: {
    flexDirection: 'row',
    gap: 6
  },
  miniCallBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#A7F3D0'
  },
  miniWaBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#BBF7D0'
  },
  emptyDuty: {
    paddingVertical: 8
  },
  emptyDutyText: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18
  },

  /* HERO ACTIONS */
  heroActionRow: {
    flexDirection: 'row',
    gap: 10
  },
  quickActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12
  },
  callPrimaryBtn: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2
  },
  callPrimaryText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13
  },
  waSecondaryBtn: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0'
  },
  waSecondaryText: {
    color: '#047857',
    fontWeight: '700',
    fontSize: 13
  },

  /* SOP CARD */
  sopAccordionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F3FF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    marginBottom: 16
  },
  sopLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1
  },
  sopIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center'
  },
  sopTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B'
  },
  sopSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2
  },
  sopDetailsBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
    gap: 12
  },
  sopItem: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start'
  },
  sopBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6
  },
  sopItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B'
  },
  sopItemDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
    marginTop: 2
  },
  laporShortcutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFBEB',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginTop: 4
  },
  laporShortcutText: {
    fontSize: 12,
    color: '#B45309',
    fontWeight: '600',
    flex: 1
  },

  /* SECTION HEADER */
  sectionHeader: {
    marginBottom: 10
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A'
  },
  sectionSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2
  },

  /* DAY SELECTOR */
  dayScrollContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 12
  },
  dayPill: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative'
  },
  dayPillSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  dayPillToday: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySubtle
  },
  dayPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B'
  },
  dayPillTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700'
  },
  dayPillTextToday: {
    color: colors.primary,
    fontWeight: '700'
  },
  todayIndicator: {
    position: 'absolute',
    bottom: 3,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary
  },

  /* SEARCH BOX */
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    height: '100%'
  },

  /* SHIFT LIST */
  shiftList: {
    gap: 12,
    marginBottom: 24
  },
  shiftCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.card
  },
  shiftCardActive: {
    borderColor: '#10B981',
    borderWidth: 1.5,
    backgroundColor: '#FAFCFF'
  },
  shiftCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  shiftBadgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  shiftBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1
  },
  shiftBadgeText: {
    fontSize: 12,
    fontWeight: '700'
  },
  clockTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  clockTagText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600'
  },
  activeNowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0'
  },
  activeNowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981'
  },
  activeNowText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#065F46'
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8
  },
  locationText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155'
  },
  catatanBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: '#F0F9FF',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    marginBottom: 12
  },
  catatanText: {
    fontSize: 12,
    color: '#0369A1',
    lineHeight: 17,
    flex: 1
  },
  petugasSection: {
    marginTop: 4
  },
  petugasLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 8
  },
  petugasCardsGrid: {
    gap: 8
  },
  secItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  secItemAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#CBD5E1',
    marginRight: 10
  },
  secItemName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B'
  },
  secItemJob: {
    fontSize: 11,
    color: '#64748B'
  },
  secItemPhone: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600'
  },
  secItemActions: {
    flexDirection: 'row',
    gap: 6
  },
  secMiniCall: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#A7F3D0'
  },
  secMiniWa: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#BBF7D0'
  },
  manageFooterRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9'
  },
  manageBtnEdit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5
  },
  manageBtnEditText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4F46E5'
  },
  manageBtnDelete: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  manageBtnDeleteText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444'
  },

  /* EMPTY CARD */
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed'
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 12,
    marginBottom: 6
  },
  emptyDesc: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#059669',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10
  },
  emptyAddBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13
  },

  /* ALL SEC CONTAINER */
  allSecContainer: {
    gap: 10,
    marginBottom: 20
  },
  allSecCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  allSecAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E2E8F0',
    marginRight: 12
  },
  allSecName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B'
  },
  allSecRole: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1
  },
  allSecPosRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3
  },
  allSecPosText: {
    fontSize: 11,
    color: '#64748B'
  },
  allSecActionCol: {
    flexDirection: 'row',
    gap: 6
  },
  allSecCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0'
  },
  allSecCallText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669'
  },
  allSecWaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0'
  },
  allSecWaText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16A34A'
  },

  /* MODAL STYLES */
  modalFieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8
  },
  modalPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    marginRight: 8
  },
  modalPillActive: {
    backgroundColor: '#059669'
  },
  modalPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569'
  },
  modalPillTextActive: {
    color: '#FFFFFF'
  },
  shiftSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16
  },
  shiftSelectorBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center'
  },
  shiftSelectorBtnActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#059669'
  },
  shiftSelectorText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B'
  },
  shiftSelectorTextActive: {
    color: '#059669',
    fontWeight: '700'
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
    marginBottom: 16
  },
  modalPetugasList: {
    gap: 8,
    marginBottom: 20
  },
  modalPetugasItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  modalPetugasItemActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0'
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF'
  },
  modalPetugasName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B'
  },
  modalPetugasDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9'
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center'
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B'
  },
  modalSaveBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#059669',
    alignItems: 'center'
  },
  modalSaveText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF'
  }
})
