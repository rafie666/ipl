import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Linking,
  TextInput,
  Alert,
  ScrollView,
  RefreshControl
} from 'react-native'
import {
  PhoneCall,
  ShieldAlert,
  Plus,
  Edit2,
  Trash2,
  Copy
} from 'lucide-react-native'
import { useApp } from '../context/AppContext'
import AppHeader from '../components/AppHeader'
import AppCard from '../components/AppCard'
import AppButton from '../components/AppButton'
import AppModal from '../components/AppModal'
import { colors, typography, spacing, radius, shadows } from '../utils/theme'
import { copyToClipboard } from '../utils/clipboard'

export default function KontakDaruratScreen({ navigation }) {
  const {
    kontakDarurat,
    scopedKontakDarurat,
    isAdminLoggedIn,
    tambahKontakDarurat,
    updateKontakDarurat,
    hapusKontakDarurat,
    refreshData,
    refreshing
  } = useApp()

  const listKontak = scopedKontakDarurat?.length ? scopedKontakDarurat : kontakDarurat

  // Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [nama, setNama] = useState('')
  const [kategori, setKategori] = useState('')
  const [nomor, setNomor] = useState('')
  const [deskripsi, setDeskripsi] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCall = (phone) => {
    if (!phone) {
      Alert.alert('Perhatian', 'Nomor telepon tidak tersedia.')
      return
    }
    const clean = phone.replace(/[^0-9+]/g, '')
    Linking.openURL(`tel:${clean}`)
  }

  const handleCopy = async (phone, title) => {
    if (!phone) return
    await copyToClipboard(phone)
    Alert.alert('Nomor Tersalin', `${title || 'Nomor'}: ${phone} berhasil disalin ke papan klip.`)
  }

  const handleOpenAdd = () => {
    setEditItem(null)
    setNama('')
    setKategori('Keamanan Lingkungan')
    setNomor('')
    setDeskripsi('')
    setModalOpen(true)
  }

  const handleOpenEdit = (item) => {
    setEditItem(item)
    setNama(item.nama || item.instansi || '')
    setKategori(item.kategori || item.jabatan || 'Darurat')
    setNomor(item.nomor || item.noHp || '')
    setDeskripsi(item.deskripsi || '')
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    if (!nama.trim() || !nomor.trim()) {
      Alert.alert('Perhatian', 'Nama instansi dan nomor telepon wajib diisi!')
      return
    }

    setLoading(true)
    try {
      if (editItem) {
        await updateKontakDarurat(editItem.id, {
          nama: nama.trim(),
          instansi: nama.trim(),
          kategori: kategori.trim() || 'Darurat',
          jabatan: kategori.trim() || 'Darurat',
          nomor: nomor.trim(),
          noHp: nomor.trim(),
          deskripsi: deskripsi.trim()
        })
        Alert.alert('Sukses', 'Kontak darurat berhasil diperbarui!')
      } else {
        await tambahKontakDarurat({
          nama: nama.trim(),
          instansi: nama.trim(),
          kategori: kategori.trim() || 'Darurat',
          jabatan: kategori.trim() || 'Darurat',
          nomor: nomor.trim(),
          noHp: nomor.trim(),
          deskripsi: deskripsi.trim()
        })
        Alert.alert('Sukses', 'Kontak darurat baru berhasil ditambahkan!')
      }
      setModalOpen(false)
    } catch (e) {
      Alert.alert('Error', 'Gagal menyimpan kontak darurat.')
    } finally {
      setLoading(false)
    }
  }

  const handleHapus = (item) => {
    Alert.alert(
      'Hapus Kontak',
      `Yakin ingin menghapus ${item.nama || item.instansi}?`,
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Hapus', style: 'destructive', onPress: () => hapusKontakDarurat(item.id) }
      ]
    )
  }

  const renderItem = ({ item }) => {
    const title = item.nama || item.instansi || 'Kontak Darurat'
    const phone = item.nomor || item.noHp || '-'
    const category = item.kategori || item.jabatan || 'Petugas'

    return (
      <AppCard style={styles.card}>
        <View style={styles.cardContent}>
          <View style={styles.iconWrap}>
            <PhoneCall size={20} color={colors.primary} />
          </View>

          <View style={styles.infoCol}>
            <View style={styles.titleRow}>
              <Text style={styles.itemTitle} numberOfLines={1}>{title}</Text>
              <View style={styles.catBadge}>
                <Text style={styles.catBadgeText}>{category}</Text>
              </View>
            </View>

            <Text style={styles.itemPhone}>{phone}</Text>
            {item.deskripsi ? (
              <Text style={styles.itemDesc} numberOfLines={2}>{item.deskripsi}</Text>
            ) : null}
          </View>
        </View>

        <View style={styles.cardActions}>
          <View style={{ flex: 1.5 }}>
            <AppButton
              title="Hubungi"
              variant="primary"
              size="sm"
              icon={<PhoneCall size={14} color={colors.surface} />}
              onPress={() => handleCall(phone)}
            />
          </View>

          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => handleCopy(phone, title)}
            activeOpacity={0.8}
          >
            <Copy size={14} color={colors.textSecondary} />
          </TouchableOpacity>

          {isAdminLoggedIn && (
            <>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => handleOpenEdit(item)}
                activeOpacity={0.8}
              >
                <Edit2 size={14} color={colors.info} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.iconBtn, { borderColor: '#FEE2E2', backgroundColor: '#FEF2F2' }]}
                onPress={() => handleHapus(item)}
                activeOpacity={0.8}
              >
                <Trash2 size={14} color={colors.danger} />
              </TouchableOpacity>
            </>
          )}
        </View>
      </AppCard>
    )
  }

  return (
    <View style={styles.container}>
      <AppHeader
        title="Kontak Cepat Darurat"
        subtitle="Nomor siaga satpam, posko medis, polsek & pemadam"
        onBack={() => navigation.goBack()}
      />

      <FlatList
        data={listKontak}
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
            <ShieldAlert size={44} color={colors.textSecondary} style={{ marginBottom: 12 }} />
            <Text style={styles.emptyTitle}>Belum ada nomor kontak darurat</Text>
          </View>
        }
      />

      {/* FAB Tambah Kontak */}
      {isAdminLoggedIn && (
        <TouchableOpacity
          style={styles.fab}
          onPress={handleOpenAdd}
          activeOpacity={0.88}
        >
          <Plus size={24} color={colors.surface} />
        </TouchableOpacity>
      )}

      {/* Modal Tambah/Edit */}
      <AppModal
        visible={modalOpen}
        title={editItem ? 'Edit Kontak Darurat' : 'Tambah Kontak Darurat'}
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
                title="Simpan"
                variant="primary"
                loading={loading}
                onPress={handleSubmit}
              />
            </View>
          </View>
        }
      >
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nama Instansi / Petugas *</Text>
          <TextInput
            style={styles.input}
            placeholder="Contoh: Pos Satpam Utama / Polsek Terdekat"
            placeholderTextColor={colors.textSecondary}
            value={nama}
            onChangeText={setNama}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nomor Telepon / WhatsApp *</Text>
          <TextInput
            style={styles.input}
            placeholder="08123456789 atau 112"
            keyboardType="phone-pad"
            placeholderTextColor={colors.textSecondary}
            value={nomor}
            onChangeText={setNomor}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Kategori</Text>
          <TextInput
            style={styles.input}
            placeholder="Contoh: Keamanan / Medis / Pemadam"
            placeholderTextColor={colors.textSecondary}
            value={kategori}
            onChangeText={setKategori}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Keterangan (Opsional)</Text>
          <TextInput
            style={[styles.input, { height: 70, textAlignVertical: 'top' }]}
            placeholder="Keterangan jam operasional atau lokasi..."
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={3}
            value={deskripsi}
            onChangeText={setDeskripsi}
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
  cardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm
  },
  infoCol: {
    flex: 1,
    minWidth: 0
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2
  },
  itemTitle: {
    ...typography.cardTitle,
    flex: 1,
    marginRight: spacing.xs
  },
  catBadge: {
    backgroundColor: colors.background,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border
  },
  catBadgeText: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '600'
  },
  itemPhone: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 2
  },
  itemDesc: {
    ...typography.caption,
    marginTop: 2,
    lineHeight: 16
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.background,
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
  }
})
