import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  ActivityIndicator
} from 'react-native'
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  Shield,
  Trash2,
  Zap,
  RefreshCw,
  Layers,
  CheckCircle2,
  CreditCard,
  ChevronRight,
  Info,
  FileText
} from 'lucide-react-native'
import { useApp } from '../context/AppContext'
import TopAppBar from '../components/TopAppBar'
import AppCard from '../components/AppCard'
import AppButton from '../components/AppButton'
import AppModal from '../components/AppModal'
import AppEmptyState from '../components/AppEmptyState'
import TransparansiIuranTable from '../components/TransparansiIuranTable'
import { fetchMootaMutations } from '../services/mootaService'
import { calculateTotalWithKodeUnik } from '../utils/formatters'
import { formatRupiah } from '../utils/format'
import { colors, typography, spacing, radius, shadows } from '../utils/theme'

export default function KasScreen({ navigation, route }) {
  const {
    scopedKas,
    tambahKas,
    deleteKas,
    isAdminLoggedIn,
    isWarga,
    isRT,
    isRW,
    isBendahara,
    isPengurus,
    isAdmin,
    currentUser,
    rts = [],
    currentRT,
    currentRW,
    refreshData,
    refreshing,
    tagihan = [],
    warga = [],
    bayarTagihanOtomatisMoota
  } = useApp()

  const [scopeFilter, setScopeFilter] = useState('Semua') // 'Semua' | 'RT' | 'RW'
  const [activeTab, setActiveTab] = useState(route?.params?.initialTab || 'Semua') // 'Semua' | 'Pengeluaran' | 'Pemasukan' | 'Transparansi Iuran'
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedKasItem, setSelectedKasItem] = useState(null)

  useEffect(() => {
    if (route?.params?.initialTab) {
      setActiveTab(route.params.initialTab)
    }
  }, [route?.params?.initialTab])

  // Form states
  const [modalOpen, setModalOpen] = useState(false)
  const [tipe, setTipe] = useState('Pengeluaran')
  const [formScope, setFormScope] = useState(isRT ? 'rt' : 'rw')
  const [formRtId, setFormRtId] = useState(isRT ? (currentRT?.id || 'rt-01-01') : (rts[0]?.id || 'rt-01-01'))
  const [kategori, setKategori] = useState('Operasional')
  const [nominal, setNominal] = useState('')
  const [keterangan, setKeterangan] = useState('')
  const [penanggungJawab, setPenanggungJawab] = useState('')

  // Moota Live Mutations state
  const [mootaModalOpen, setMootaModalOpen] = useState(false)
  const [mootaMutations, setMootaMutations] = useState([])
  const [loadingMoota, setLoadingMoota] = useState(false)

  const isReadonlyForWarga = isWarga && !isAdminLoggedIn

  // Hitung akumulasi berdasarkan scope yang dipilih
  const scopeFilteredKas = (scopedKas || []).filter((item) => {
    if (scopeFilter === 'Semua') return true
    if (scopeFilter === 'RT') return item.scope === 'rt' || Boolean(item.rt_id)
    if (scopeFilter === 'RW') return item.scope === 'rw' || (!item.rt_id)
    return true
  })

  const totalPemasukan = scopeFilteredKas
    .filter((k) => k.tipe === 'Masuk' || k.tipe === 'Pemasukan')
    .reduce((acc, k) => acc + (k.nominal || 0), 0)

  const totalPengeluaran = scopeFilteredKas
    .filter((k) => k.tipe === 'Keluar' || k.tipe === 'Pengeluaran')
    .reduce((acc, k) => acc + (k.nominal || 0), 0)

  const saldo = totalPemasukan - totalPengeluaran

  const filteredKas = scopeFilteredKas.filter((item) => {
    if (activeTab === 'Semua') return true
    if (activeTab === 'Pemasukan') {
      return item.tipe === 'Masuk' || item.tipe === 'Pemasukan'
    }
    if (activeTab === 'Pengeluaran') {
      return item.tipe === 'Keluar' || item.tipe === 'Pengeluaran'
    }
    return item.tipe === activeTab
  })

  const pengeluaranCount = scopeFilteredKas.filter(
    (k) => k.tipe === 'Keluar' || k.tipe === 'Pengeluaran'
  ).length

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
        kategori: kategori || 'Operasional',
        nominal: Number(nominal),
        deskripsi: keterangan.trim(),
        keterangan: keterangan.trim(),
        scope: isRT ? 'rt' : formScope,
        rt_id: isRT ? (currentRT?.id || 'rt-01-01') : (formScope === 'rt' ? formRtId : null),
        rw_id: currentUser?.rw_id || 'rw-01',
        pj: penanggungJawab.trim() || currentUser?.name || (isRT ? 'Ketua RT' : isBendahara ? 'Bendahara' : isRW ? 'Ketua RW' : 'Pengurus')
      })
      setModalOpen(false)
      setNominal('')
      setKeterangan('')
      setPenanggungJawab('')
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

  const handleTarikMutasiMoota = async () => {
    setLoadingMoota(true)
    try {
      const res = await fetchMootaMutations('all', 50)
      if (res.success) {
        const mutations = res.data || []
        setMootaMutations(mutations)
        setMootaModalOpen(true)

        // Otomatis sinkronkan mutasi CR ke tagihan yang belum lunas
        let autoSettled = 0
        const pendingTagihan = (tagihan || []).filter((t) => t.status !== 'Lunas')

        for (const m of mutations) {
          const isCredit = String(m.type || '').toUpperCase() === 'CR' || Number(m.amount) > 0
          const mutAmount = Math.round(Number(m.amount || m.nominal || 0))
          if (!isCredit || mutAmount <= 0) continue

          for (const t of pendingTagihan) {
            const tWarga = warga.find((w) => w.id === t.wargaId) || {}
            const exactNom = calculateTotalWithKodeUnik(t.total, tWarga)
            if (exactNom === mutAmount && t.status !== 'Lunas') {
              await bayarTagihanOtomatisMoota(t.id, m)
              t.status = 'Lunas'
              autoSettled++
            }
          }
        }

        if (autoSettled > 0) {
          Alert.alert(
            '🎉 Sinkronisasi Berhasil!',
            `${autoSettled} tagihan warga berhasil diverifikasi & dilunasi secara otomatis dari mutasi transfer Moota!`
          )
        }
      } else {
        Alert.alert('Info Moota', res.message || 'Gagal membaca mutasi dari Moota.')
      }
    } catch (e) {
      Alert.alert('Error', e.message || 'Gagal mengambil data mutasi.')
    } finally {
      setLoadingMoota(false)
    }
  }

  const renderKasItem = ({ item }) => {
    const isMasuk = item.tipe === 'Masuk' || item.tipe === 'Pemasukan'
    const deskripsi = item.deskripsi || item.keterangan || '-'
    const isRw = item.scope === 'rw' || !item.rt_id
    const scopeLabel = isRw ? 'RW 01' : (rts.find((r) => r.id === item.rt_id)?.name || 'RT 01')

    return (
      <AppCard
        style={styles.itemCard}
        onPress={() => {
          setSelectedKasItem(item)
          setDetailModalOpen(true)
        }}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`Transaksi ${deskripsi}, nominal ${formatRupiah(item.nominal)}`}
      >
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
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 }}>
              <View style={[styles.scopeTagBadge, isRw ? styles.scopeTagRw : styles.scopeTagRt]}>
                <Text style={[styles.scopeTagText, isRw ? styles.textPurple : styles.textGreen]}>
                  {scopeLabel}
                </Text>
              </View>
              <View style={styles.kategoriBadge}>
                <Text style={styles.kategoriBadgeText}>{item.kategori || 'Operasional'}</Text>
              </View>
            </View>

            <Text style={styles.keteranganText} numberOfLines={2}>
              {deskripsi}
            </Text>

            <View style={styles.metaRow}>
              <Text style={styles.dateText}>{item.tanggal || item.created_at || 'Terbaru'}</Text>
              {Boolean(item.pj) && (
                <Text style={styles.pjText} numberOfLines={1}>
                  • PJ: {item.pj}
                </Text>
              )}
            </View>
          </View>

          <View style={{ alignItems: 'flex-end', marginLeft: spacing.xs }}>
            <Text style={[styles.nominalText, isMasuk ? styles.textMasuk : styles.textKeluar]}>
              {isMasuk ? '+' : '-'} {formatRupiah(item.nominal)}
            </Text>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <View style={styles.detailLinkBadge}>
                <Text style={styles.detailLinkText}>Detail</Text>
                <ChevronRight size={11} color={colors.primary} />
              </View>

              {isAdminLoggedIn && (
                <TouchableOpacity
                  style={styles.hapusKasBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityRole="button"
                  accessibilityLabel="Hapus transaksi kas"
                  onPress={(e) => {
                    e?.stopPropagation?.()
                    handleHapusKas(item)
                  }}
                  activeOpacity={0.8}
                >
                  <Trash2 size={13} color={colors.danger} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </AppCard>
    )
  }

  return (
    <View style={styles.container}>
      <TopAppBar title="Buku Kas Lingkungan" navigation={navigation} />

      <View style={styles.topSection}>
        {/* Scope Selector: Semua / RT / RW */}
        <View style={styles.scopeSelectorRow}>
          <TouchableOpacity
            style={[styles.scopeSelectorBtn, scopeFilter === 'Semua' && styles.scopeSelectorBtnActive]}
            onPress={() => setScopeFilter('Semua')}
            activeOpacity={0.8}
          >
            <Text style={[styles.scopeSelectorText, scopeFilter === 'Semua' && styles.scopeSelectorTextActive]}>
              Semua
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.scopeSelectorBtn, scopeFilter === 'RT' && styles.scopeSelectorBtnActiveGreen]}
            onPress={() => setScopeFilter('RT')}
            activeOpacity={0.8}
          >
            <Text style={[styles.scopeSelectorText, scopeFilter === 'RT' && styles.scopeSelectorTextActive]}>
              Kas {currentRT?.name || 'RT'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.scopeSelectorBtn, scopeFilter === 'RW' && styles.scopeSelectorBtnActivePurple]}
            onPress={() => setScopeFilter('RW')}
            activeOpacity={0.8}
          >
            <Text style={[styles.scopeSelectorText, scopeFilter === 'RW' && styles.scopeSelectorTextActive]}>
              Kas {currentRW?.name || 'RW'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Saldo Kas Card (Hanya saat di luar tab Transparansi) */}
        {activeTab !== 'Transparansi Iuran' && (
          <AppCard style={styles.saldoCard}>
            <Text style={styles.saldoLabel}>TOTAL SALDO KAS</Text>
            <Text style={styles.saldoVal}>{formatRupiah(saldo)}</Text>

            <View style={styles.statsRow}>
              <View style={styles.statCol}>
                <View style={styles.statIndicator}>
                  <ArrowDownLeft size={13} color={colors.success} />
                  <Text style={styles.statLabel}>Masuk</Text>
                </View>
                <Text style={[styles.statVal, { color: colors.success }]}>
                  {formatRupiah(totalPemasukan)}
                </Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statCol}>
                <View style={styles.statIndicator}>
                  <ArrowUpRight size={13} color={colors.danger} />
                  <Text style={styles.statLabel}>Keluar</Text>
                </View>
                <Text style={[styles.statVal, { color: colors.danger }]}>
                  {formatRupiah(totalPengeluaran)}
                </Text>
              </View>
            </View>
          </AppCard>
        )}

        {/* Moota Mutasi Quick Sync Banner (Hanya Admin & di Buku Kas) */}
        {isAdminLoggedIn && activeTab !== 'Transparansi Iuran' && (
          <TouchableOpacity
            style={styles.mootaSyncBanner}
            onPress={handleTarikMutasiMoota}
            disabled={loadingMoota}
            activeOpacity={0.85}
          >
            <View style={styles.mootaSyncIconWrap}>
              {loadingMoota ? (
                <ActivityIndicator size="small" color="#D97706" />
              ) : (
                <Zap size={16} color="#D97706" />
              )}
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.mootaSyncTitle}>Tarik Mutasi Bank (Moota)</Text>
                <View style={styles.mootaLiveBadge}>
                  <Text style={styles.mootaLiveBadgeText}>LIVE</Text>
                </View>
              </View>
              <Text style={styles.mootaSyncDesc} numberOfLines={1}>
                Sinkronisasi otomatis mutasi rekening kas
              </Text>
            </View>
            <RefreshCw size={15} color={colors.textSecondary} />
          </TouchableOpacity>
        )}

        {/* Tab Filter */}
        <View style={styles.tabsRow}>
          {[
            { id: 'Semua', label: 'Buku Kas' },
            { id: 'Pengeluaran', label: 'Pengeluaran' },
            { id: 'Pemasukan', label: 'Pemasukan' },
            { id: 'Transparansi Iuran', label: 'Transparansi' }
          ].map((tab) => {
            const isTabActive = activeTab === tab.id || (tab.id === 'Semua' && activeTab === 'Semua Kas')
            return (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.tabBtn,
                  isTabActive && styles.tabBtnActive,
                  activeTab === 'Pengeluaran' && tab.id === 'Pengeluaran' && styles.tabBtnActiveDanger,
                  activeTab === 'Transparansi Iuran' && tab.id === 'Transparansi Iuran' && styles.tabBtnActiveGreen
                ]}
                onPress={() => setActiveTab(tab.id)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.tabText,
                    isTabActive && styles.tabTextActive,
                    activeTab === 'Transparansi Iuran' && tab.id === 'Transparansi Iuran' && styles.tabTextActiveGreen
                  ]}
                  numberOfLines={1}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>

        {activeTab === 'Pengeluaran' && (
          <View style={styles.pengeluaranAlertBanner}>
            <ArrowUpRight size={15} color={colors.danger} />
            <View style={{ flex: 1 }}>
              <Text style={styles.pengeluaranAlertTitle}>
                Transparansi Rincian Belanja Kas ({pengeluaranCount} Transaksi)
              </Text>
              <Text style={styles.pengeluaranAlertDesc}>
                Total Pengeluaran: {formatRupiah(totalPengeluaran)} • Ketuk pada salah satu baris pengeluaran untuk melihat rincian nota & penanggung jawab.
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* VIEW TABEL TRANSPARANSI IURAN WARGA ATAU BUKU KAS */}
      {activeTab === 'Transparansi Iuran' ? (
        <ScrollView
          contentContainerStyle={styles.tableScrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refreshData}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
          <TransparansiIuranTable initialScope={scopeFilter} />
        </ScrollView>
      ) : (
        /* List Transaksi Kas */
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
            <AppEmptyState
              variant="no_history"
              title="Belum Ada Transaksi Kas"
              subtitle="Belum ada catatan mutasi kas pada kategori atau wilayah ini."
            />
          }
        />
      )}

      {/* FAB Tambah Kas */}
      {isAdminLoggedIn && activeTab !== 'Transparansi Iuran' && (
        <TouchableOpacity
          style={styles.fab}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          accessibilityRole="button"
          accessibilityLabel="Catat Transaksi Kas"
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
        </View>

        {/* Scope Selector in Form (if Admin) */}
        {!isRT && (
          <View style={{ marginBottom: spacing.sm }}>
            <Text style={styles.label}>Tingkat Penyelenggara Kas *</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                style={[
                  styles.formScopeBtn,
                  formScope === 'rw' && styles.formScopeBtnActivePurple
                ]}
                onPress={() => setFormScope('rw')}
              >
                <Text
                  style={[
                    styles.formScopeBtnText,
                    formScope === 'rw' && styles.textWhite
                  ]}
                >
                  🏢 Kas RW 01
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.formScopeBtn,
                  formScope === 'rt' && styles.formScopeBtnActiveGreen
                ]}
                onPress={() => setFormScope('rt')}
              >
                <Text
                  style={[
                    styles.formScopeBtnText,
                    formScope === 'rt' && styles.textWhite
                  ]}
                >
                  🏡 Kas RT
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nominal Transaksi (Rp) *</Text>
          <TextInput
            style={styles.input}
            placeholder="Contoh: 850000"
            placeholderTextColor={colors.textSecondary}
            keyboardType="number-pad"
            value={nominal}
            onChangeText={setNominal}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Kategori Transaksi *</Text>
          <View style={styles.categoryChipRow}>
            {['Operasional', 'Keamanan', 'Kebersihan', 'Perbaikan Fasum', 'Penerangan PJU', 'Sosial & Warga'].map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.categoryChip, kategori === c && styles.categoryChipActive]}
                onPress={() => setKategori(c)}
              >
                <Text style={[styles.categoryChipText, kategori === c && styles.categoryChipTextActive]}>
                  {c}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={[styles.input, { marginTop: 6 }]}
            placeholder="Kategori transaksi..."
            placeholderTextColor={colors.textSecondary}
            value={kategori}
            onChangeText={setKategori}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Penanggung Jawab (PJ) / Pencatat</Text>
          <TextInput
            style={styles.input}
            placeholder="Contoh: Seksi Sarana RT 01 / Bendahara RW"
            placeholderTextColor={colors.textSecondary}
            value={penanggungJawab}
            onChangeText={setPenanggungJawab}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Keterangan & Rincian Transaksi *</Text>
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

      {/* Modal Detail Transaksi & Pengeluaran Kas Lengkap */}
      <AppModal
        visible={detailModalOpen}
        title="Detail Transaksi Kas"
        subtitle="Rincian catatan keuangan & pengeluaran kas lingkungan"
        onClose={() => setDetailModalOpen(false)}
        footer={
          <View style={{ width: '100%' }}>
            <AppButton
              title="Tutup Rincian"
              variant="secondary"
              onPress={() => setDetailModalOpen(false)}
            />
          </View>
        }
      >
        {selectedKasItem && (
          <View style={{ width: '100%' }}>
            <View
              style={[
                styles.detailKasAmountCard,
                selectedKasItem.tipe === 'Keluar' || selectedKasItem.tipe === 'Pengeluaran'
                  ? styles.detailKasAmountCardKeluar
                  : styles.detailKasAmountCardMasuk
              ]}
            >
              <Text style={styles.detailKasAmountLabel}>
                {selectedKasItem.tipe === 'Keluar' || selectedKasItem.tipe === 'Pengeluaran'
                  ? 'PENGELUARAN KAS LINGKUNGAN'
                  : 'PEMASUKAN KAS LINGKUNGAN'}
              </Text>
              <Text
                style={[
                  styles.detailKasAmountVal,
                  {
                    color:
                      selectedKasItem.tipe === 'Keluar' || selectedKasItem.tipe === 'Pengeluaran'
                        ? colors.danger
                        : colors.success
                  }
                ]}
              >
                {formatRupiah(selectedKasItem.nominal)}
              </Text>
            </View>

            <View style={styles.detailKasInfoBox}>
              <View style={styles.detailKasRow}>
                <Text style={styles.detailKasLabel}>Penyelenggara / Tingkat</Text>
                <View
                  style={[
                    styles.scopeTagBadge,
                    (selectedKasItem.scope === 'rw' || !selectedKasItem.rt_id)
                      ? styles.scopeTagRw
                      : styles.scopeTagRt
                  ]}
                >
                  <Text
                    style={[
                      styles.scopeTagText,
                      (selectedKasItem.scope === 'rw' || !selectedKasItem.rt_id)
                        ? styles.textPurple
                        : styles.textGreen
                    ]}
                  >
                    {(selectedKasItem.scope === 'rw' || !selectedKasItem.rt_id)
                      ? '🏢 Kas RW 01'
                      : '🏡 Kas RT 01'}
                  </Text>
                </View>
              </View>

              <View style={styles.detailKasRowDivider} />

              <View style={styles.detailKasRow}>
                <Text style={styles.detailKasLabel}>Kategori Transaksi</Text>
                <Text style={styles.detailKasVal}>{selectedKasItem.kategori || 'Operasional'}</Text>
              </View>

              <View style={styles.detailKasRowDivider} />

              <View style={styles.detailKasRow}>
                <Text style={styles.detailKasLabel}>Tanggal Realisasi</Text>
                <Text style={styles.detailKasVal}>{selectedKasItem.tanggal || '-'}</Text>
              </View>

              <View style={styles.detailKasRowDivider} />

              <View style={styles.detailKasRow}>
                <Text style={styles.detailKasLabel}>Penanggung Jawab (PJ)</Text>
                <Text style={styles.detailKasVal}>{selectedKasItem.pj || 'Pengurus Lingkungan'}</Text>
              </View>

              <View style={styles.detailKasRowDivider} />

              <View style={styles.detailKasRow}>
                <Text style={styles.detailKasLabel}>ID Transaksi</Text>
                <Text style={[styles.detailKasVal, { fontFamily: 'monospace', fontSize: 11 }]}>
                  {selectedKasItem.id || '-'}
                </Text>
              </View>

              <View style={styles.detailKasRowDivider} />

              <View style={{ paddingTop: 8 }}>
                <Text style={styles.detailKasLabel}>Keterangan & Uraian Lengkap:</Text>
                <Text style={styles.detailKasDesc}>
                  {selectedKasItem.deskripsi || selectedKasItem.keterangan || '-'}
                </Text>
              </View>
            </View>

            <View style={styles.transparencyBadgeBox}>
              <Shield size={16} color="#059669" style={{ marginTop: 2 }} />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.transparencyBadgeTitle}>Akses Transparansi Terbuka</Text>
                <Text style={styles.transparencyBadgeDesc}>
                  Catatan ini diverifikasi dan dipublikasikan agar seluruh warga dapat memantau penggunaan dana lingkungan secara terbuka.
                </Text>
              </View>
            </View>
          </View>
        )}
      </AppModal>

      {/* Modal Mutasi Moota Live */}
      <AppModal
        visible={mootaModalOpen}
        onClose={() => setMootaModalOpen(false)}
        title="Mutasi Realtime Moota Sandbox"
        subtitle="Data mutasi rekening 090908080777 (a.n Rafi Nurrahman)"
        footer={
          <View style={{ width: '100%' }}>
            <AppButton
              title="Tutup Riwayat Mutasi"
              variant="secondary"
              onPress={() => setMootaModalOpen(false)}
            />
          </View>
        }
      >
        <View style={{ maxHeight: 380 }}>
          {mootaMutations.length === 0 ? (
            <View style={{ padding: 24, alignItems: 'center' }}>
              <CreditCard size={36} color={colors.textSecondary} style={{ marginBottom: 10 }} />
              <Text style={{ fontSize: 13, fontWeight: '800', color: colors.textPrimary }}>
                Belum Ada Mutasi di Akun Moota
              </Text>
              <Text style={{ fontSize: 11, color: colors.textSecondary, textAlign: 'center', marginTop: 4, lineHeight: 16 }}>
                Belum ada transaksi transfer yang masuk ke rekening Moota Sandbox ini. Begitu ada transfer masuk, mutasi akan langsung muncul di sini.
              </Text>
            </View>
          ) : (
            <FlatList
              data={mootaMutations}
              keyExtractor={(item, idx) => item.mutation_id || item.id || String(idx)}
              renderItem={({ item }) => {
                const isCredit = String(item.type || '').toUpperCase() === 'CR' || Number(item.amount) > 0
                return (
                  <View style={styles.mutasiItemRow}>
                    <View style={[styles.mutasiTypeBadge, isCredit ? styles.bgCredit : styles.bgDebit]}>
                      <Text style={[styles.mutasiTypeText, isCredit ? styles.textCredit : styles.textDebit]}>
                        {isCredit ? 'CR (MASUK)' : 'DB (KELUAR)'}
                      </Text>
                    </View>
                    <View style={{ flex: 1, marginHorizontal: 8 }}>
                      <Text style={styles.mutasiDescText} numberOfLines={2}>
                        {item.description || item.keterangan || 'Transfer Bank'}
                      </Text>
                      <Text style={styles.mutasiDateText}>{item.date || item.created_at || '-'}</Text>
                    </View>
                    <Text style={[styles.mutasiAmountText, isCredit ? styles.textMasuk : styles.textKeluar]}>
                      {isCredit ? '+' : '-'} {formatRupiah(Number(item.amount || item.nominal || 0))}
                    </Text>
                  </View>
                )
              }}
            />
          )}
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
  tabBtnActiveGreen: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    ...shadows.soft
  },
  tabText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '700'
  },
  tabTextActiveGreen: {
    color: '#059669',
    fontWeight: '800'
  },
  tableScrollContent: {
    padding: spacing.md,
    paddingBottom: 190
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: 190
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
    bottom: 104,
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
  },
  // Moota Mutasi Banner & Modal Styles
  mootaSyncBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    borderRadius: radius.lg,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    ...shadows.sm
  },
  mootaSyncIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center'
  },
  mootaSyncTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#92400E'
  },
  mootaLiveBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    marginLeft: 6
  },
  mootaLiveBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#FFFFFF'
  },
  mootaSyncDesc: {
    fontSize: 10,
    color: '#B45309',
    marginTop: 2
  },
  mutasiItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  mutasiTypeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6
  },
  mutasiTypeText: {
    fontSize: 9,
    fontWeight: '800'
  },
  bgCredit: {
    backgroundColor: '#ECFDF5'
  },
  bgDebit: {
    backgroundColor: '#FEF2F2'
  },
  textCredit: {
    color: '#059669'
  },
  textDebit: {
    color: '#DC2626'
  },
  mutasiDescText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary
  },
  mutasiDateText: {
    fontSize: 9,
    color: colors.textSecondary,
    marginTop: 2
  },
  mutasiAmountText: {
    fontSize: 12,
    fontWeight: '800'
  },

  /* SCOPE SELECTOR STYLES */
  scopeSelectorRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: spacing.xs + 2
  },
  scopeSelectorBtn: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: radius.sm,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  scopeSelectorBtnActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A'
  },
  scopeSelectorBtnActiveGreen: {
    backgroundColor: '#059669',
    borderColor: '#059669'
  },
  scopeSelectorBtnActivePurple: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED'
  },
  scopeSelectorText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary
  },
  scopeSelectorTextActive: {
    color: colors.white
  },

  /* PENGELUARAN ALERT */
  tabBtnActiveDanger: {
    backgroundColor: '#DC2626'
  },
  pengeluaranAlertBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: radius.md,
    padding: spacing.sm,
    marginTop: spacing.xs
  },
  pengeluaranAlertTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#DC2626',
    marginBottom: 2
  },
  pengeluaranAlertDesc: {
    fontSize: 10,
    color: '#991B1B',
    lineHeight: 14
  },

  /* ITEM CARD SCOPE & DETAILS */
  scopeTagBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full
  },
  scopeTagRw: {
    backgroundColor: '#F3E8FF',
    borderWidth: 0.8,
    borderColor: '#DDD6FE'
  },
  scopeTagRt: {
    backgroundColor: '#ECFDF5',
    borderWidth: 0.8,
    borderColor: '#A7F3D0'
  },
  scopeTagText: {
    fontSize: 9.5,
    fontWeight: '800'
  },
  detailLinkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
    borderWidth: 0.8,
    borderColor: '#BFDBFE'
  },
  detailLinkText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: colors.primary
  },
  pjText: {
    fontSize: 10,
    color: colors.textSecondary,
    maxWidth: 150
  },

  /* FORM SCOPE & CHIPS */
  formScopeBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: radius.md,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  formScopeBtnActivePurple: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED'
  },
  formScopeBtnActiveGreen: {
    backgroundColor: '#059669',
    borderColor: '#059669'
  },
  formScopeBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.textPrimary
  },
  categoryChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4
  },
  categoryChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  categoryChipText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary
  },
  categoryChipTextActive: {
    color: colors.white
  },

  /* MODAL DETAIL KAS STYLES */
  detailKasAmountCard: {
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 1
  },
  detailKasAmountCardKeluar: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA'
  },
  detailKasAmountCardMasuk: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0'
  },
  detailKasAmountLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: colors.textSecondary,
    marginBottom: 4
  },
  detailKasAmountVal: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5
  },
  detailKasInfoBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: radius.md,
    padding: spacing.sm + 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: spacing.md
  },
  detailKasRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4
  },
  detailKasLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600'
  },
  detailKasVal: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.textPrimary
  },
  detailKasRowDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4
  },
  detailKasDesc: {
    fontSize: 12,
    color: colors.textPrimary,
    lineHeight: 18,
    marginTop: 4,
    fontWeight: '500'
  },
  transparencyBadgeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0FDF4',
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: '#BBF7D0'
  },
  transparencyBadgeTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
    marginBottom: 2
  },
  transparencyBadgeDesc: {
    fontSize: 10,
    color: '#065F46',
    lineHeight: 14
  },
  textPurple: {
    color: '#7C3AED'
  },
  textGreen: {
    color: '#059669'
  }
})
