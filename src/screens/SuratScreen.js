import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  Share,
  RefreshControl
} from 'react-native'
import {
  FileText,
  Plus,
  Share2,
  Eye,
  CheckCircle2,
  Clock,
  Send
} from 'lucide-react-native'
import { useApp } from '../context/AppContext'
import AppHeader from '../components/AppHeader'
import AppCard from '../components/AppCard'
import AppBadge from '../components/AppBadge'
import AppButton from '../components/AppButton'
import AppModal from '../components/AppModal'
import { colors, typography, spacing, radius, shadows } from '../utils/theme'

export default function SuratScreen({ navigation }) {
  const { scopedSurat, ajukanSurat, updateSurat, isAdminLoggedIn, config, warga: allWarga, refreshData, refreshing } = useApp()

  const [modalOpen, setModalOpen] = useState(false)
  const [previewSurat, setPreviewSurat] = useState(null)
  const [jenisSurat, setJenisSurat] = useState('Surat Keterangan Domisili')
  const [keperluan, setKeperluan] = useState('')
  const [loading, setLoading] = useState(false)

  const opsiSurat = [
    'Surat Keterangan Domisili',
    'Surat Pengantar SKCK',
    'Surat Keterangan Usaha (SKU)',
    'Surat Keterangan Belum Menikah',
    'Surat Pengantar Nikah (N1-N4)',
    'Surat Keterangan Kematian'
  ]

  const handleAjukan = async () => {
    if (!keperluan.trim()) {
      Alert.alert('Perhatian', 'Keperluan permohonan surat wajib diisi!')
      return
    }

    setLoading(true)
    try {
      await ajukanSurat({
        jenisSurat,
        keperluan: keperluan.trim()
      })
      setModalOpen(false)
      setKeperluan('')
      Alert.alert('Sukses', 'Permohonan surat berhasil dikirim ke Pengurus RT.')
    } catch (e) {
      Alert.alert('Error', 'Gagal mengajukan surat.')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = (id, newStatus) => {
    Alert.alert('Ubah Status Surat', `Tandai permohonan surat sebagai "${newStatus}"?`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Ya, Ubah',
        onPress: () => updateSurat(id, newStatus)
      }
    ])
  }

  const generateTemplateSurat = (item) => {
    const namaLingkungan = config?.namaLingkungan || 'Perumahan Alam Tirta Lestari'
    const namaRt = config?.namaRt || 'RT 01'
    const namaRw = config?.namaRw || 'RW 15'
    const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    const pemohon = item.namaWarga || 'Yang Bersangkutan'
    const wargaData = allWarga?.find((w) => w.id === item.wargaId) || {}
    const alamat = wargaData.blok ? `Blok ${wargaData.blok} No. ${wargaData.noRumah}` : 'Warga setempat'

    return (
      `SURAT PENGANTAR\n` +
      `Nomor: ${item.id?.toUpperCase() || '---/RT/---'}\n\n` +
      `Yang bertanda tangan di bawah ini, Ketua ${namaRt} ${namaRw} ${namaLingkungan}:\n\n` +
      `Menerangkan dengan sebenarnya bahwa:\n\n` +
      `Nama    : ${pemohon}\n` +
      `Alamat  : ${alamat}, ${namaLingkungan}\n\n` +
      `adalah benar warga ${namaRt} ${namaRw} ${namaLingkungan} yang mengajukan:\n\n` +
      `Jenis Surat : ${item.jenisSurat}\n` +
      `Keperluan   : ${item.keperluan}\n\n` +
      `Surat pengantar ini diberikan untuk dapat dipergunakan sebagaimana mestinya.\n\n` +
      `${namaLingkungan}, ${today}\n\n` +
      `Ketua ${namaRt}\n` +
      `${namaRw} ${namaLingkungan}\n\n\n` +
      `(___________________________)\n` +
      `NIP/NIK: -`
    )
  }

  const handleShareSurat = async (item) => {
    const teks = generateTemplateSurat(item)
    try {
      await Share.share({ message: teks, title: `Surat Pengantar - ${item.jenisSurat}` })
    } catch (e) {
      Alert.alert('Error', 'Gagal berbagi surat.')
    }
  }

  const renderItem = ({ item }) => {
    const isSelesai = item.status === 'Selesai'
    const isDiproses = item.status === 'Diproses'

    return (
      <AppCard style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.suratType} numberOfLines={1}>{item.jenisSurat}</Text>
          <AppBadge status={item.status} label={item.status} />
        </View>

        <Text style={styles.keperluanLabel}>Keperluan:</Text>
        <Text style={styles.keperluanText}>{item.keperluan}</Text>

        <View style={styles.cardFooter}>
          <Text style={styles.footerText} numberOfLines={1}>
            Pemohon: {item.namaWarga || 'Warga'} • {item.tanggal || 'Terbaru'}
          </Text>

          <View style={styles.cardActions}>
            {isSelesai && (
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => setPreviewSurat(item)}
                activeOpacity={0.8}
              >
                <Eye size={15} color={colors.info} />
              </TouchableOpacity>
            )}

            {isSelesai && (
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => handleShareSurat(item)}
                activeOpacity={0.8}
              >
                <Share2 size={15} color={colors.success} />
              </TouchableOpacity>
            )}

            {isAdminLoggedIn && !isSelesai && (
              <AppButton
                title={isDiproses ? 'Selesaikan' : 'Proses'}
                variant="primary"
                size="sm"
                onPress={() => handleUpdateStatus(item.id, isDiproses ? 'Selesai' : 'Diproses')}
              />
            )}
          </View>
        </View>
      </AppCard>
    )
  }

  return (
    <View style={styles.container}>
      <AppHeader
        title="Layanan Surat Pengantar"
        subtitle="Permohonan surat pengantar RT & RW online"
        onBack={() => navigation.goBack()}
      />

      <FlatList
        data={scopedSurat}
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
            <FileText size={44} color={colors.textSecondary} style={{ marginBottom: 12 }} />
            <Text style={styles.emptyTitle}>Belum ada pengajuan surat</Text>
            <Text style={styles.emptySub}>
              Buat permohonan surat pengantar RT dengan mudah dan cepat.
            </Text>
          </View>
        }
      />

      {/* FAB Ajukan Surat */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalOpen(true)}
        activeOpacity={0.88}
      >
        <Plus size={24} color={colors.surface} />
      </TouchableOpacity>

      {/* Modal Ajukan Surat */}
      <AppModal
        visible={modalOpen}
        title="Ajukan Surat Pengantar"
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
                title="Ajukan Surat"
                variant="primary"
                loading={loading}
                onPress={handleAjukan}
              />
            </View>
          </View>
        }
      >
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Pilih Jenis Surat</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
            {opsiSurat.map((surat) => (
              <TouchableOpacity
                key={surat}
                style={[
                  styles.suratChip,
                  jenisSurat === surat && styles.suratChipActive
                ]}
                onPress={() => setJenisSurat(surat)}
              >
                <Text style={[styles.suratChipText, jenisSurat === surat && styles.suratChipTextActive]}>
                  {surat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Keperluan Permohonan *</Text>
          <TextInput
            style={[styles.input, { height: 90, textAlignVertical: 'top' }]}
            placeholder="Contoh: Mengurus pembuatan KTP baru / SKCK kepolisian..."
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={4}
            value={keperluan}
            onChangeText={setKeperluan}
          />
        </View>
      </AppModal>

      {/* Modal Preview Surat */}
      <AppModal
        visible={!!previewSurat}
        title="Pratinjau Surat Resmi"
        onClose={() => setPreviewSurat(null)}
        footer={
          <View style={{ width: '100%', gap: 8 }}>
            <AppButton
              title="Bagikan Teks Surat"
              variant="primary"
              icon={<Share2 size={16} color={colors.surface} />}
              onPress={() => previewSurat && handleShareSurat(previewSurat)}
            />
            <AppButton
              title="Tutup"
              variant="secondary"
              onPress={() => setPreviewSurat(null)}
            />
          </View>
        }
      >
        {previewSurat && (
          <View style={styles.previewBox}>
            <Text style={styles.previewText}>{generateTemplateSurat(previewSurat)}</Text>
          </View>
        )}
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
  suratType: {
    ...typography.cardTitle,
    flex: 1,
    marginRight: spacing.xs
  },
  keperluanLabel: {
    ...typography.caption,
    fontSize: 11,
    marginTop: 2
  },
  keperluanText: {
    ...typography.bodySecondary,
    color: colors.textPrimary,
    lineHeight: 18,
    marginTop: 2
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
  footerText: {
    ...typography.caption,
    flex: 1,
    marginRight: spacing.xs
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  iconBtn: {
    width: 34,
    height: 34,
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
  suratChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.full,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 6
  },
  suratChipActive: {
    backgroundColor: '#FEF2F2',
    borderColor: colors.primary
  },
  suratChipText: {
    fontSize: 12,
    color: colors.textSecondary
  },
  suratChipTextActive: {
    color: colors.primary,
    fontWeight: '700'
  },
  previewBox: {
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border
  },
  previewText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: colors.textPrimary,
    lineHeight: 18
  }
})
