import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl
} from 'react-native'
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  Shield,
  Trash2
} from 'lucide-react-native'
import { useApp } from '../context/AppContext'
import TopAppBar from '../components/TopAppBar'
import AppCard from '../components/AppCard'
import AppButton from '../components/AppButton'
import AppModal from '../components/AppModal'
import { colors, typography, spacing, radius, shadows } from '../utils/theme'

export default function KasScreen({ navigation }) {
  const { scopedKas, tambahKas, deleteKas, isAdminLoggedIn, isWarga, refreshData, refreshing } = useApp()

  const [activeTab, setActiveTab] = useState('Semua') // 'Semua' | 'Pemasukan' | 'Pengeluaran'
  const [modalOpen, setModalOpen] = useState(false)
  const [tipe, setTipe] = useState('Pemasukan')
  const [kategori, setKategori] = useState('Iuran Warga')
  const [nominal, setNominal] = useState('')
  const [keterangan, setKeterangan] = useState('')

  const isReadonlyForWarga = isWarga && !isAdminLoggedIn

  const formatRupiah = (num) => 'Rp ' + (num || 0).toLocaleString('id-ID')

  // Hitung akumulasi
  const totalPemasukan = scopedKas
    .filter((k) => k.tipe === 'Masuk' || k.tipe === 'Pemasukan')
    .reduce((acc, k) => acc + (k.nominal || 0), 0)

  const totalPengeluaran = scopedKas
    .filter((k) => k.tipe === 'Keluar' || k.tipe === 'Pengeluaran')
    .reduce((acc, k) => acc + (k.nominal || 0), 0)

  const saldo = totalPemasukan - totalPengeluaran

  const filteredKas = scopedKas.filter((item) => {
    if (activeTab === 'Semua') return true
    if (activeTab === 'Pemasukan') {
      return item.tipe === 'Masuk' || item.tipe === 'Pemasukan'
    }
    if (activeTab === 'Pengeluaran') {
      return item.tipe === 'Keluar' || item.tipe === 'Pengeluaran'
    }
    return item.tipe === activeTab
  })

  const handleSimpanKas = async () => {
    if (!nominal || isNaN(Number(nominal))) {
      Alert.alert('Perhatian', 'Nominal transaksi harus berupa angka!')
      return
    }
    if (!keterangan.trim()) {
      Alert.alert('Perhatian', 'Keterangan transaksi wajib diisi!')
      return
    }

    try {
      await tambahKas({
        tipe: tipe === 'Pemasukan' ? 'Masuk' : 'Keluar',
        kategori,
        nominal: Number(nominal),
        deskripsi: keterangan.trim(),
        keterangan: keterangan.trim()
      })
      setModalOpen(false)
      setNominal('')
      setKeterangan('')
      Alert.alert('Sukses', 'Transaksi kas berhasil dicatat!')
    } catch (e) {
      Alert.alert('Error', 'Gagal menyimpan transaksi kas.')
    }
  }

  const handleHapusKas = (item) => {
    const deskripsi = item.deskripsi || item.keterangan || 'transaksi ini'
    Alert.alert(
      'Hapus Catatan Kas',
      `Hapus "${deskripsi}" (Rp ${(item.nominal || 0).toLocaleString('id-ID')})? Saldo kas akan disesuaikan.`,
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Hapus', style: 'destructive', onPress: () => deleteKas(item.id) }
      ]
    )
  }

  const renderKasItem = ({ item }) => {
    const isMasuk = item.tipe === 'Masuk' || item.tipe === 'Pemasukan'
    const deskripsi = item.deskripsi || item.keterangan || '-'

    return (
      <AppCard style={styles.itemCard}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View
            style={[
              styles.iconWrap,
              isMasuk ? styles.iconWrapMasuk : styles.iconWrapKeluar
            ]}
          >
            {isMasuk ? (
              <ArrowDownLeft size={18} color={colors.success} />
            ) : (
              <ArrowUpRight size={18} color={colors.danger} />
            )}
          </View>

          <View style={styles.infoCol}>
            <Text style={styles.keteranganText} numberOfLines={2}>
              {deskripsi}
            </Text>
            <View style={styles.metaRow}>
              <View style={styles.kategoriBadge}>
                <Text style={styles.kategoriBadgeText}>{item.kategori || 'Kas RT'}</Text>
              </View>
              <Text style={styles.dateText}>{item.tanggal || item.created_at || 'Terbaru'}</Text>
            </View>
          </View>

          <View style={{ alignItems: 'flex-end', marginLeft: spacing.xs }}>
            <Text style={[styles.nominalText, isMasuk ? styles.textMasuk : styles.textKeluar]}>
              {isMasuk ? '+' : '-'} {formatRupiah(item.nominal)}
            </Text>

            {isAdminLoggedIn && (
              <TouchableOpacity
                style={styles.hapusKasBtn}
                onPress={() => handleHapusKas(item)}
                activeOpacity={0.8}
              >
                <Trash2 size={13} color={colors.danger} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </AppCard>
    )
  }

  return (
    <View style={styles.container}>
      <TopAppBar title="Buku Kas Lingkungan" navigation={navigation} />

      <View style={styles.topSection}>
        {isReadonlyForWarga && (
          <View style={styles.transparansiNotice}>
            <Shield size={14} color={colors.primary} />
            <Text style={styles.transparansiNoticeText}>
              Transparansi Kas Lingkungan RT / RW • Akses Terbuka untuk Seluruh Warga
            </Text>
          </View>
        )}

        {/* Saldo Kas Card */}
        <AppCard style={styles.saldoCard}>
          <Text style={styles.saldoLabel}>TOTAL SALDO KAS SAAT INI</Text>
          <Text style={styles.saldoVal}>{formatRupiah(saldo)}</Text>

          <View style={styles.statsRow}>
            <View style={styles.statCol}>
              <View style={styles.statIndicator}>
                <ArrowDownLeft size={13} color={colors.success} />
                <Text style={styles.statLabel}>Pemasukan</Text>
              </View>
              <Text style={[styles.statVal, { color: colors.success }]}>
                {formatRupiah(totalPemasukan)}
              </Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statCol}>
              <View style={styles.statIndicator}>
                <ArrowUpRight size={13} color={colors.danger} />
                <Text style={styles.statLabel}>Pengeluaran</Text>
              </View>
              <Text style={[styles.statVal, { color: colors.danger }]}>
                {formatRupiah(totalPengeluaran)}
              </Text>
            </View>
          </View>
        </AppCard>

        {/* Tab Filter */}
        <View style={styles.tabsRow}>
          {['Semua', 'Pemasukan', 'Pengeluaran'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* List Transaksi */}
      <FlatList
        data={filteredKas}
        keyExtractor={(item) => item.id || String(Math.random())}
        renderItem={renderKasItem}
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
            <Wallet size={40} color={colors.textSecondary} style={{ marginBottom: 10 }} />
            <Text style={styles.emptyTitle}>Belum ada transaksi kas</Text>
          </View>
        }
      />

      {/* FAB Tambah Kas */}
      {isAdminLoggedIn && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setModalOpen(true)}
          activeOpacity={0.88}
        >
          <Plus size={24} color={colors.surface} />
        </TouchableOpacity>
      )}

      {/* Modal Tambah Transaksi */}
      <AppModal
        visible={modalOpen}
        title="Catat Transaksi Kas"
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
                onPress={handleSimpanKas}
              />
            </View>
          </View>
        }
      >
        {/* Tipe Selector */}
        <View style={styles.tipeSelector}>
          <TouchableOpacity
            style={[styles.tipeBtn, tipe === 'Pemasukan' && styles.tipeBtnMasuk]}
            onPress={() => setTipe('Pemasukan')}
          >
            <Text
              style={[
                styles.tipeText,
                tipe === 'Pemasukan' ? styles.textWhite : styles.textSecondary
              ]}
            >
              Pemasukan
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tipeBtn, tipe === 'Pengeluaran' && styles.tipeBtnKeluar]}
            onPress={() => setTipe('Pengeluaran')}
          >
            <Text
              style={[
                styles.tipeText,
                tipe === 'Pengeluaran' ? styles.textWhite : styles.textSecondary
              ]}
            >
              Pengeluaran
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nominal Transaksi (Rp) *</Text>
          <TextInput
            style={styles.input}
            placeholder="Contoh: 150000"
            placeholderTextColor={colors.textSecondary}
            keyboardType="number-pad"
            value={nominal}
            onChangeText={setNominal}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Kategori Transaksi</Text>
          <TextInput
            style={styles.input}
            placeholder="Contoh: Iuran Warga / Beli Lampu / Sampah"
            placeholderTextColor={colors.textSecondary}
            value={kategori}
            onChangeText={setKategori}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Keterangan Transaksi *</Text>
          <TextInput
            style={[styles.input, { height: 70, textAlignVertical: 'top' }]}
            placeholder="Rincian keterangan transaksi kas..."
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={3}
            value={keterangan}
            onChangeText={setKeterangan}
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
  topSection: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: 4
  },
  transparansiNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: spacing.xs
  },
  transparansiNoticeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#1D4ED8',
    flex: 1
  },
  saldoCard: {
    marginBottom: spacing.sm
  },
  saldoLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.5
  },
  saldoVal: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
    marginVertical: 4
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border
  },
  statCol: {
    flex: 1,
    alignItems: 'center'
  },
  statIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary
  },
  statVal: {
    fontSize: 14,
    fontWeight: '700'
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.border
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#EAECF0',
    borderRadius: radius.md,
    padding: 3,
    marginBottom: spacing.xs
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: radius.sm
  },
  tabBtnActive: {
    backgroundColor: colors.surface,
    ...shadows.soft
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '700'
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: 110
  },
  itemCard: {
    marginBottom: spacing.sm,
    padding: spacing.sm
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm
  },
  iconWrapMasuk: {
    backgroundColor: '#ECFDF5'
  },
  iconWrapKeluar: {
    backgroundColor: '#FEF2F2'
  },
  infoCol: {
    flex: 1,
    minWidth: 0
  },
  keteranganText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    lineHeight: 18
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4
  },
  kategoriBadge: {
    backgroundColor: colors.background,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border
  },
  kategoriBadgeText: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '600'
  },
  dateText: {
    fontSize: 10,
    color: colors.textSecondary
  },
  nominalText: {
    fontSize: 13,
    fontWeight: '700'
  },
  textMasuk: {
    color: colors.success
  },
  textKeluar: {
    color: colors.danger
  },
  hapusKasBtn: {
    marginTop: 6,
    padding: 4
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl
  },
  emptyTitle: {
    ...typography.bodySecondary,
    fontSize: 13
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
  tipeSelector: {
    flexDirection: 'row',
    backgroundColor: '#EAECF0',
    borderRadius: radius.md,
    padding: 3,
    marginBottom: spacing.md
  },
  tipeBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: radius.sm
  },
  tipeBtnMasuk: {
    backgroundColor: colors.success
  },
  tipeBtnKeluar: {
    backgroundColor: colors.danger
  },
  tipeText: {
    fontSize: 13,
    fontWeight: '700'
  },
  textWhite: {
    color: colors.surface
  },
  textSecondary: {
    color: colors.textSecondary
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
  restrictedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl
  },
  restrictedIconWrap: {
    width: 72,
    height: 72,
    borderRadius: radius.xl,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md
  },
  restrictedTitle: {
    ...typography.h2,
    textAlign: 'center',
    marginBottom: spacing.xs
  },
  restrictedSubtitle: {
    ...typography.bodySecondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
    marginBottom: spacing.lg
  }
})
