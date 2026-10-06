import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  TextInput
} from 'react-native'
import {
  ArrowLeft,
  User,
  Home,
  Phone,
  Mail,
  Users,
  Calendar,
  Briefcase,
  MapPin,
  Receipt,
  MessageCircle,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Building2,
  Edit3,
  Plus,
  X,
  UserPlus
} from 'lucide-react-native'
import { useApp } from '../context/AppContext'
import AppHeader from '../components/AppHeader'
import AppCard from '../components/AppCard'
import AppButton from '../components/AppButton'
import AppBadge from '../components/AppBadge'
import AppModal from '../components/AppModal'
import { colors, typography, spacing, radius, shadows } from '../utils/theme'

export default function DetailWargaScreen({ route, navigation }) {
  const { warga: routeWarga } = route.params || {}
  const { warga: allWarga, tagihan, rts, config, isAdminLoggedIn, isWarga, currentUser, hapusWarga, updateWarga, verifikasiWargaBaru } = useApp()

  const warga = allWarga?.find((w) => w.id === routeWarga?.id) || routeWarga

  const handleApproveWarga = async (wId, residentName) => {
    Alert.alert(
      'Setujui Pendaftaran Warga',
      `Setujui pendaftaran ${residentName || 'Warga'} dan aktifkan akun portal warganya?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ya, Setujui',
          onPress: async () => {
            await verifikasiWargaBaru(wId, 'Disetujui')
            Alert.alert('Sukses', `Warga ${residentName} telah disetujui dan akun login sudah aktif!`)
          }
        }
      ]
    )
  }

  const handleRejectWarga = (wId, residentName) => {
    Alert.alert(
      'Tolak Pendaftaran Warga',
      `Tolak pendaftaran warga ${residentName || 'Warga'}?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ya, Tolak',
          style: 'destructive',
          onPress: async () => {
            await verifikasiWargaBaru(wId, 'Tolak', 'Data tidak sesuai atau bukan warga lingkungan.')
            Alert.alert('Perhatian', `Pendaftaran ${residentName} ditolak.`, [
              { text: 'OK', onPress: () => navigation.goBack() }
            ])
          }
        }
      ]
    )
  }

  // State: modal anggota keluarga
  const [akModalOpen, setAkModalOpen] = useState(false)
  const [akNama, setAkNama] = useState('')
  const [akHubungan, setAkHubungan] = useState('Istri/Suami')
  const [akJK, setAkJK] = useState('Perempuan')
  const [akPekerjaan, setAkPekerjaan] = useState('')
  const [akLoading, setAkLoading] = useState(false)

  if (!warga) {
    return (
      <View style={styles.container}>
        <AppHeader title="Detail Warga" onBack={() => navigation.goBack()} />
        <View style={styles.emptyContainer}>
          <Text style={styles.notFoundText}>Data warga tidak ditemukan.</Text>
        </View>
      </View>
    )
  }

  const isOwnProfile = isWarga && warga.id === currentUser?.resident_id
  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()

  // RT info
  const targetRt = rts?.find((r) => r.id === warga.rt_id)
  const rtName = targetRt?.name || 'RT 01'

  // Tagihan milik warga ini
  const wargaBills = tagihan.filter((t) => t.wargaId === warga.id || t.namaWarga === warga.nama)
  const currentMonthBill = wargaBills.find(
    (t) => Number(t.bulan) === currentMonth && Number(t.tahun) === currentYear
  )
  const isLunasBulanIni = currentMonthBill?.status === 'Lunas'

  const handleWhatsApp = (phone, text = '') => {
    if (!phone) return
    const cleanPhone = phone.replace(/[^0-9]/g, '')
    const formatted = cleanPhone.startsWith('0')
      ? '62' + cleanPhone.slice(1)
      : cleanPhone.startsWith('62')
      ? cleanPhone
      : '62' + cleanPhone
    Linking.openURL(`https://wa.me/${formatted}${text ? `?text=${encodeURIComponent(text)}` : ''}`)
  }

  const handleSendReminder = () => {
    const text = `Halo Yth. Bpk/Ibu *${warga.nama}* (Blok ${warga.blok}/${warga.noRumah}),\n` +
      `Mengingatkan iuran IPL perumahan ${config?.namaLingkungan || 'Alam Tirta'} untuk periode Bulan ${currentMonth}/${currentYear} sebesar Rp ${(currentMonthBill?.total || 120000).toLocaleString('id-ID')}.\n` +
      `Pembayaran dapat ditransfer via rekening kas RT atau melalui aplikasi. Terima kasih! 🙏`
    handleWhatsApp(warga.noHp, text)
  }

  const handleDeleteWarga = () => {
    Alert.alert(
      'Hapus Data Warga',
      `Yakin ingin menghapus ${warga.nama} (Blok ${warga.blok}/${warga.noRumah}) dari sistem? Data yang dihapus tidak dapat dipulihkan.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ya, Hapus',
          style: 'destructive',
          onPress: async () => {
            await hapusWarga(warga.id)
            Alert.alert('Sukses', 'Data warga berhasil dihapus.', [
              { text: 'OK', onPress: () => navigation.goBack() }
            ])
          }
        }
      ]
    )
  }

  const familyList = Array.isArray(warga.anggotaKeluarga) && warga.anggotaKeluarga.length > 0
    ? warga.anggotaKeluarga
    : [{
        id: `ak-${warga.id}-kk`,
        nama: warga.nama,
        hubungan: 'Kepala Keluarga',
        jenisKelamin: warga.jenisKelamin || 'Laki-laki',
        pekerjaan: warga.pekerjaan || '-'
      }]

  const handleTambahAnggota = async () => {
    if (!akNama.trim()) {
      Alert.alert('Perhatian', 'Nama anggota keluarga wajib diisi!')
      return
    }
    setAkLoading(true)
    const newAnggota = {
      id: `ak-${Date.now()}`,
      nama: akNama.trim(),
      hubungan: akHubungan,
      jenisKelamin: akJK,
      pekerjaan: akPekerjaan.trim()
    }
    const baseAk = Array.isArray(warga.anggotaKeluarga) && warga.anggotaKeluarga.length > 0
      ? warga.anggotaKeluarga
      : [{
          id: `ak-${warga.id}-kk`,
          nama: warga.nama,
          hubungan: 'Kepala Keluarga',
          jenisKelamin: warga.jenisKelamin || 'Laki-laki',
          pekerjaan: warga.pekerjaan || '-'
        }]
    const updatedAk = [...baseAk, newAnggota]
    await updateWarga(warga.id, { anggotaKeluarga: updatedAk, jumlahJiwa: updatedAk.length })
    setAkNama('')
    setAkHubungan('Istri/Suami')
    setAkJK('Perempuan')
    setAkPekerjaan('')
    setAkLoading(false)
    setAkModalOpen(false)
    Alert.alert('Sukses', `${newAnggota.nama} berhasil ditambahkan ke Kartu Keluarga.`)
  }

  const handleHapusAnggota = (akId, akNamaDel) => {
    Alert.alert(
      'Hapus Anggota',
      `Hapus ${akNamaDel} dari daftar anggota keluarga?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            const baseAk = Array.isArray(warga.anggotaKeluarga) && warga.anggotaKeluarga.length > 0
              ? warga.anggotaKeluarga
              : []
            const updatedAk = baseAk.filter((a) => a.id !== akId)
            await updateWarga(warga.id, { anggotaKeluarga: updatedAk, jumlahJiwa: Math.max(1, updatedAk.length) })
          }
        }
      ]
    )
  }

  return (
    <View style={styles.container}>
      <AppHeader
        title={isOwnProfile ? 'Profil Kependudukan' : 'Detail Informasi Warga'}
        subtitle={`Blok ${warga.blok || 'A'}/${warga.noRumah || '-'}`}
        onBack={() => navigation.goBack()}
        rightAction={
          isAdminLoggedIn ? (
            <TouchableOpacity
              style={styles.editHeaderBtn}
              onPress={() => navigation.navigate('Register', { wargaToEdit: warga })}
              activeOpacity={0.8}
            >
              <Edit3 size={18} color={colors.primary} />
            </TouchableOpacity>
          ) : null
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Banner Persetujuan Warga Baru (Khusus RT/Admin) */}
        {isAdminLoggedIn && warga.statusApproval === 'Menunggu Verifikasi' && (
          <View style={styles.approvalAlertBox}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <View style={styles.approvalAlertIcon}>
                <UserPlus size={18} color="#1D4ED8" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.approvalAlertTitle}>Pendaftaran Menunggu Persetujuan</Text>
                <Text style={styles.approvalAlertDesc}>
                  Warga baru ini mendaftar mandiri dan membutuhkan verifikasi RT untuk aktivasi akun.
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
              <View style={{ flex: 1 }}>
                <AppButton
                  title="Tolak"
                  variant="danger"
                  size="sm"
                  onPress={() => handleRejectWarga(warga.id, warga.nama)}
                />
              </View>
              <View style={{ flex: 2 }}>
                <AppButton
                  title="Setujui & Aktifkan"
                  variant="primary"
                  size="sm"
                  icon={<CheckCircle2 size={16} color={colors.white} />}
                  onPress={() => handleApproveWarga(warga.id, warga.nama)}
                />
              </View>
            </View>
          </View>
        )}

        {/* Profile Header Card */}
        <AppCard style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            <Text style={styles.avatarText}>
              {(warga.nama || 'W').charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.wargaName}>{warga.nama}</Text>
          <Text style={styles.wargaSub}>
            Blok {warga.blok || 'A'} No. {warga.noRumah || '-'} • Kode #{warga.kodeUnik || '101'} • {rtName}
          </Text>

          <View style={styles.statusPills}>
            <View style={styles.pill}>
              <Text style={styles.pillText}>{warga.statusHuni || 'Tetap'}</Text>
            </View>
            <View style={styles.pill}>
              <Text style={styles.pillText}>{warga.statusKepemilikan || 'Milik Sendiri'}</Text>
            </View>
          </View>

          {warga.noHp ? (
            <AppButton
              title={`WhatsApp (${warga.noHp})`}
              variant="secondary"
              icon={<MessageCircle size={16} color={colors.success} />}
              onPress={() => handleWhatsApp(warga.noHp)}
            />
          ) : null}
        </AppCard>

        {/* Status IPL Bulan Ini Card */}
        <AppCard
          style={[
            styles.infoCard,
            isLunasBulanIni && { borderColor: '#A7F3D0' },
            !isLunasBulanIni && currentMonthBill && { borderColor: '#FECACA' }
          ]}
        >
          <View style={styles.statusIplHeader}>
            {isLunasBulanIni ? (
              <CheckCircle2 size={20} color={colors.success} />
            ) : currentMonthBill?.status === 'Menunggu Verifikasi' ? (
              <AlertCircle size={20} color={colors.warning} />
            ) : currentMonthBill ? (
              <AlertCircle size={20} color={colors.danger} />
            ) : (
              <CheckCircle2 size={20} color={colors.textSecondary} />
            )}
            <View style={{ flex: 1, marginLeft: 10, minWidth: 0 }}>
              <Text style={styles.statusIplTitle} numberOfLines={1}>
                IPL Bulan {currentMonth}/{currentYear}: {isLunasBulanIni ? 'LUNAS' : currentMonthBill?.status === 'Menunggu Verifikasi' ? 'MENUNGGU VERIFIKASI' : currentMonthBill ? 'BELUM BAYAR' : 'BELUM TERBIT'}
              </Text>
              <Text style={styles.statusIplSub}>
                {isLunasBulanIni
                  ? `Lunas via ${currentMonthBill?.metodeBayar || currentMonthBill?.metode || 'Transfer'} (No: ${currentMonthBill?.noKwitansi || '-'})`
                  : currentMonthBill
                  ? `Tagihan Rp ${(currentMonthBill?.total || 120000).toLocaleString('id-ID')}`
                  : 'Tagihan iuran bulan berjalan belum diterbitkan.'}
              </Text>
            </View>
          </View>

          {!isLunasBulanIni && currentMonthBill && warga.noHp && !isWarga ? (
            <View style={{ marginTop: spacing.sm }}>
              <AppButton
                title="Kirim Pengingat WhatsApp"
                variant="secondary"
                icon={<MessageCircle size={15} color={colors.warning} />}
                onPress={handleSendReminder}
              />
            </View>
          ) : null}
        </AppCard>

        {/* Data Kependudukan */}
        <AppCard style={styles.infoCard}>
          <Text style={styles.cardTitle}>Data Kependudukan</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Wilayah RT</Text>
            <Text style={styles.val}>{rtName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>NIK Kepala Keluarga</Text>
            <Text style={styles.val}>
              {isWarga && !isOwnProfile && warga.nik
                ? warga.nik.substring(0, 6) + '******'
                : warga.nik || '-'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>No. Kartu Keluarga</Text>
            <Text style={styles.val}>
              {isWarga && !isOwnProfile && warga.noKk
                ? warga.noKk.substring(0, 6) + '******'
                : warga.noKk || '-'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Pekerjaan</Text>
            <Text style={styles.val}>{warga.pekerjaan || '-'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.val}>{warga.email || '-'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Agama</Text>
            <Text style={styles.val}>{warga.agama || 'Islam'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Status Pernikahan</Text>
            <Text style={styles.val}>{warga.statusPernikahan || 'Kawin'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Jumlah Jiwa</Text>
            <Text style={styles.val}>{familyList.length || warga.jumlahJiwa || 1} Orang</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Tanggal Masuk</Text>
            <Text style={styles.val}>{warga.tglMasuk || '-'}</Text>
          </View>
          {warga.kontakDaruratNama ? (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Kontak Darurat</Text>
              <Text style={styles.val}>
                {warga.kontakDaruratNama} ({warga.kontakDaruratHp || '-'})
              </Text>
            </View>
          ) : null}
          {warga.catatan ? (
            <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.label}>Catatan</Text>
              <Text style={styles.val}>{warga.catatan}</Text>
            </View>
          ) : null}
        </AppCard>

        {/* Anggota Keluarga */}
        <AppCard style={styles.infoCard}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>
              Anggota Keluarga ({familyList.length} Jiwa)
            </Text>
            {isAdminLoggedIn && (
              <TouchableOpacity
                style={styles.addAkBtn}
                onPress={() => setAkModalOpen(true)}
                activeOpacity={0.8}
              >
                <UserPlus size={14} color={colors.primary} />
                <Text style={styles.addAkText}>Tambah</Text>
              </TouchableOpacity>
            )}
          </View>

          {familyList.map((ak, idx) => (
            <View key={ak.id || idx} style={styles.akRow}>
              <View style={styles.akAvatarWrap}>
                <User size={16} color={colors.textSecondary} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.akName} numberOfLines={1}>{ak.nama}</Text>
                <Text style={styles.akSub} numberOfLines={1}>
                  {ak.hubungan} • {ak.jenisKelamin || '-'} • {ak.pekerjaan || '-'}
                </Text>
              </View>

              {isAdminLoggedIn && ak.hubungan !== 'Kepala Keluarga' && (
                <TouchableOpacity
                  onPress={() => handleHapusAnggota(ak.id, ak.nama)}
                  style={styles.delAkBtn}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Trash2 size={14} color={colors.danger} />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </AppCard>

        {/* Delete Warga (Admin Only) */}
        {isAdminLoggedIn && (
          <View style={{ marginTop: spacing.xs, marginBottom: spacing.md }}>
            <AppButton
              title="Hapus Data Warga Ini"
              variant="danger"
              icon={<Trash2 size={16} color={colors.surface} />}
              onPress={handleDeleteWarga}
            />
          </View>
        )}
      </ScrollView>

      {/* Modal Tambah Anggota Keluarga */}
      <AppModal
        visible={akModalOpen}
        title="Tambah Anggota Keluarga"
        onClose={() => setAkModalOpen(false)}
        footer={
          <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
            <View style={{ flex: 1 }}>
              <AppButton
                title="Batal"
                variant="secondary"
                onPress={() => setAkModalOpen(false)}
              />
            </View>
            <View style={{ flex: 1 }}>
              <AppButton
                title="Simpan"
                variant="primary"
                loading={akLoading}
                onPress={handleTambahAnggota}
              />
            </View>
          </View>
        }
      >
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nama Lengkap *</Text>
          <TextInput
            style={styles.input}
            placeholder="Nama anggota keluarga"
            placeholderTextColor={colors.textSecondary}
            value={akNama}
            onChangeText={setAkNama}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Hubungan Keluarga</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {['Istri/Suami', 'Anak', 'Orang Tua', 'Famili Lain'].map((hub) => (
              <TouchableOpacity
                key={hub}
                style={[
                  styles.hubChip,
                  akHubungan === hub && styles.hubChipActive
                ]}
                onPress={() => setAkHubungan(hub)}
              >
                <Text style={[styles.hubChipText, akHubungan === hub && styles.hubChipTextActive]}>
                  {hub}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Jenis Kelamin</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {['Laki-laki', 'Perempuan'].map((jk) => (
              <TouchableOpacity
                key={jk}
                style={[styles.jkBtn, akJK === jk && styles.jkBtnActive]}
                onPress={() => setAkJK(jk)}
              >
                <Text style={[styles.jkText, akJK === jk && styles.jkTextActive]}>{jk}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Pekerjaan / Status</Text>
          <TextInput
            style={styles.input}
            placeholder="Contoh: Pelajar / Mahasiswa / Karyawan"
            placeholderTextColor={colors.textSecondary}
            value={akPekerjaan}
            onChangeText={setAkPekerjaan}
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
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 110
  },
  editHeaderBtn: {
    padding: 6
  },
  profileCard: {
    alignItems: 'center',
    marginBottom: spacing.md
  },
  avatarWrap: {
    width: 60,
    height: 60,
    borderRadius: radius.full,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary
  },
  wargaName: {
    ...typography.h2,
    textAlign: 'center'
  },
  wargaSub: {
    ...typography.caption,
    textAlign: 'center',
    marginTop: 2,
    marginBottom: spacing.sm
  },
  statusPills: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.md
  },
  pill: {
    backgroundColor: colors.background,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border
  },
  pillText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary
  },
  infoCard: {
    marginBottom: spacing.md
  },
  statusIplHeader: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  statusIplTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary
  },
  statusIplSub: {
    ...typography.caption,
    marginTop: 2
  },
  cardTitle: {
    ...typography.cardTitle,
    marginBottom: spacing.sm
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm
  },
  addAkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm
  },
  addAkText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight
  },
  label: {
    ...typography.caption,
    fontSize: 12
  },
  val: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
    maxWidth: '55%',
    textAlign: 'right'
  },
  akRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight
  },
  akAvatarWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm
  },
  akName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary
  },
  akSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1
  },
  delAkBtn: {
    padding: 6
  },
  inputGroup: {
    marginBottom: spacing.sm
  },
  input: {
    height: 46,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    fontSize: 14,
    color: colors.textPrimary,
    backgroundColor: colors.surface
  },
  hubChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border
  },
  hubChipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: colors.info
  },
  hubChipText: {
    fontSize: 12,
    color: colors.textSecondary
  },
  hubChipTextActive: {
    color: colors.info,
    fontWeight: '700'
  },
  jkBtn: {
    flex: 1,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border
  },
  jkBtnActive: {
    backgroundColor: '#FEF2F2',
    borderColor: colors.primary
  },
  jkText: {
    fontSize: 12,
    color: colors.textSecondary
  },
  jkTextActive: {
    color: colors.primary,
    fontWeight: '700'
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl
  },
  notFoundText: {
    ...typography.bodySecondary
  },
  approvalAlertBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.card
  },
  approvalAlertIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center'
  },
  approvalAlertTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1D4ED8'
  },
  approvalAlertDesc: {
    fontSize: 11,
    color: '#1E40AF',
    marginTop: 2,
    lineHeight: 15
  }
})
