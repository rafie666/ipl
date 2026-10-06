import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  ScrollView
} from 'react-native'
import {
  MessageSquareText,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react-native'
import { useApp } from '../context/AppContext'
import AppHeader from '../components/AppHeader'
import AppCard from '../components/AppCard'
import AppBadge from '../components/AppBadge'
import AppButton from '../components/AppButton'
import AppModal from '../components/AppModal'
import { colors, typography, spacing, radius, shadows } from '../utils/theme'

export default function PengaduanScreen({ navigation }) {
  const { scopedPengaduan, buatPengaduan, updatePengaduan, isAdminLoggedIn, refreshData, refreshing, isWarga } = useApp()

  const [modalOpen, setModalOpen] = useState(false)
  const [judul, setJudul] = useState('')
  const [kategori, setKategori] = useState('Fasilitas Umum')
  const [deskripsi, setDeskripsi] = useState('')
  const [loading, setLoading] = useState(false)

  // Tanggapan Modal State
  const [tanggapanModalOpen, setTanggapanModalOpen] = useState(false)
  const [selectedAduan, setSelectedAduan] = useState(null)
  const [newStatus, setNewStatus] = useState('Sedang Diproses')
  const [tanggapanText, setTanggapanText] = useState('')

  const kategoriList = ['Fasilitas Umum', 'Keamanan', 'Kebersihan', 'Lampu Jalan', 'Ketertiban']

  const handleBuatPengaduan = async () => {
    if (!judul.trim() || !deskripsi.trim()) {
      Alert.alert('Perhatian', 'Judul dan rincian laporan wajib diisi!')
      return
    }

    setLoading(true)
    try {
      await buatPengaduan({
        judul: judul.trim(),
        kategori,
        deskripsi: deskripsi.trim()
      })
      setModalOpen(false)
      setJudul('')
      setDeskripsi('')
      Alert.alert('Sukses', 'Laporan pengaduan berhasil dikirim ke pengurus RT.')
    } catch (e) {
      Alert.alert('Error', 'Gagal mengirim pengaduan.')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenTanggapan = (item, targetStatus) => {
    setSelectedAduan(item)
    setNewStatus(targetStatus)
    setTanggapanText(
      item.tanggapan ||
      (targetStatus === 'Sedang Diproses'
        ? 'Laporan telah diterima dan sedang ditindaklanjuti oleh petugas keamanan/kebersihan RT.'
        : 'Perbaikan / penanganan telah selesai dilaksanakan.')
    )
    setTanggapanModalOpen(true)
  }

  const handleSaveTanggapan = async () => {
    if (!selectedAduan) return
    setLoading(true)
    try {
      await updatePengaduan(selectedAduan.id, newStatus, tanggapanText.trim())
      setTanggapanModalOpen(false)
      Alert.alert('Sukses', `Status laporan diubah menjadi "${newStatus}".`)
    } catch (e) {
      Alert.alert('Error', 'Gagal memperbarui status laporan.')
    } finally {
      setLoading(false)
    }
  }

  const renderItem = ({ item }) => {
    return (
      <AppCard style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.kategoriBadge}>
            <Text style={styles.kategoriBadgeText}>{item.kategori || 'Fasilitas'}</Text>
          </View>
          <AppBadge status={item.status} label={item.status} />
        </View>

        <Text style={styles.judulText}>{item.judul}</Text>
        <Text style={styles.descText}>{item.deskripsi}</Text>

        {item.tanggapan ? (
          <View style={styles.tanggapanBox}>
            <Text style={styles.tanggapanLabel}>Tanggapan Pengurus RT:</Text>
            <Text style={styles.tanggapanText}>{item.tanggapan}</Text>
          </View>
        ) : null}

        <View style={styles.cardFooter}>
          <Text style={styles.footerInfo} numberOfLines={1}>
            Pelapor: {item.namaWarga || 'Warga'} • {item.tanggal || 'Terbaru'}
          </Text>

          {isAdminLoggedIn && item.status !== 'Selesai' && (
            <View style={styles.adminActionRow}>
              {item.status === 'Menunggu Tindak Lanjut' && (
                <AppButton
                  title="Proses"
                  variant="secondary"
                  size="sm"
                  onPress={() => handleOpenTanggapan(item, 'Sedang Diproses')}
                />
              )}

              <AppButton
                title="Selesai"
                variant="primary"
                size="sm"
                onPress={() => handleOpenTanggapan(item, 'Selesai')}
              />
            </View>
          )}
        </View>
      </AppCard>
    )
  }

  return (
    <View style={styles.container}>
      <AppHeader
        title="Laporan & Aduan Warga"
        subtitle="Pusat aspirasi dan kendala fasilitas rukun tetangga"
        onBack={() => navigation.goBack()}
      />

      <FlatList
        data={scopedPengaduan}
        keyExtractor={(item) => item.id || String(Math.random())}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshData}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MessageSquareText size={44} color={colors.textSecondary} style={{ marginBottom: 12 }} />
            <Text style={styles.emptyTitle}>Belum ada laporan pengaduan</Text>
            <Text style={styles.emptySub}>
              Sampaikan kendala fasilitas atau ketertiban lingkungan Anda di sini.
            </Text>
          </View>
        }
      />

      {/* FAB Buat Aduan */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalOpen(true)}
        activeOpacity={0.88}
      >
        <Plus size={24} color={colors.surface} />
      </TouchableOpacity>

      {/* Modal Buat Aduan */}
      <AppModal
        visible={modalOpen}
        title="Buat Laporan Baru"
        onClose={() => setModalOpen(false)}
        footer={
          <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
            <View style={{ flex: 1 }}>
              <AppButton
                title="Batal"
                variant="secondary"
                onPress={() => setModalOpen(false)}
              />
            </View>
            <View style={{ flex: 1 }}>
              <AppButton
                title="Kirim Laporan"
                variant="primary"
                loading={loading}
                onPress={handleBuatPengaduan}
              />
            </View>
          </View>
        }
      >
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Kategori Pengaduan</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
            {kategoriList.map((kat) => (
              <TouchableOpacity
                key={kat}
                style={[
                  styles.katChip,
                  kategori === kat && styles.katChipActive
                ]}
                onPress={() => setKategori(kat)}
              >
                <Text style={[styles.katChipText, kategori === kat && styles.katChipTextActive]}>
                  {kat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Judul Pengaduan *</Text>
          <TextInput
            style={styles.input}
            placeholder="Contoh: Lampu Jalan Blok A Mati"
            placeholderTextColor={colors.textSecondary}
            value={judul}
            onChangeText={setJudul}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Rincian Laporan *</Text>
          <TextInput
            style={[styles.input, { height: 90, textAlignVertical: 'top' }]}
            placeholder="Jelaskan detail lokasi dan kronologi permasalahan..."
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={4}
            value={deskripsi}
            onChangeText={setDeskripsi}
          />
        </View>
      </AppModal>

      {/* Modal Tindak Lanjut Admin */}
      <AppModal
        visible={tanggapanModalOpen}
        title={`Tindak Lanjut: ${newStatus}`}
        onClose={() => setTanggapanModalOpen(false)}
        footer={
          <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
            <View style={{ flex: 1 }}>
              <AppButton
                title="Batal"
                variant="secondary"
                onPress={() => setTanggapanModalOpen(false)}
              />
            </View>
            <View style={{ flex: 1 }}>
              <AppButton
                title="Simpan Tanggapan"
                variant="primary"
                loading={loading}
                onPress={handleSaveTanggapan}
              />
            </View>
          </View>
        }
      >
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Berikan Catatan / Tanggapan untuk Warga</Text>
          <TextInput
            style={[styles.input, { height: 90, textAlignVertical: 'top' }]}
            placeholder="Tuliskan keterangan perbaikan atau penanganan..."
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={4}
            value={tanggapanText}
            onChangeText={setTanggapanText}
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
  listContent: {
    padding: spacing.md,
    paddingBottom: 110
  },
  card: {
    marginBottom: spacing.md
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs
  },
  kategoriBadge: {
    backgroundColor: colors.background,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border
  },
  kategoriBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary
  },
  judulText: {
    ...typography.cardTitle,
    marginBottom: 4
  },
  descText: {
    ...typography.bodySecondary,
    lineHeight: 19
  },
  tanggapanBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: radius.md,
    padding: spacing.sm,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: '#BFDBFE'
  },
  tanggapanLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.info,
    marginBottom: 2
  },
  tanggapanText: {
    fontSize: 12,
    color: colors.textPrimary,
    lineHeight: 17
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight
  },
  footerInfo: {
    ...typography.caption,
    flex: 1
  },
  adminActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
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
    bottom: 90,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card
  },
  inputGroup: {
    marginBottom: spacing.sm
  },
  label: {
    ...typography.label,
    marginBottom: 4
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
  katChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.full,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 6
  },
  katChipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: colors.info
  },
  katChipText: {
    fontSize: 12,
    color: colors.textSecondary
  },
  katChipTextActive: {
    color: colors.info,
    fontWeight: '700'
  }
})
