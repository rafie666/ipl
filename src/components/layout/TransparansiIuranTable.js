import React, { useState, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  useWindowDimensions,
  Alert
} from 'react-native'
import {
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  X,
  Table as TableIcon,
  LayoutList,
  ChevronRight,
  Receipt,
  MapPin,
  Copy,
  Wallet
} from 'lucide-react-native'
import { useApp } from '../../context/AppContext'
import AppCard from '../shared/AppCard'
import AppButton from '../shared/AppButton'
import AppModal from '../modals/AppModal'
import { colors, radius, shadows } from '../../utils/theme'
import { formatRupiah, formatTanggalIndo } from '../../utils/formatters'
import { copyToClipboard } from '../../utils/clipboard'

export default function TransparansiIuranTable({
  initialScope = 'Semua',
  maxItems = null,
  showFullControls = true,
  showSummary = showFullControls,
  onSeeMore = null
}) {
  const { tagihan = [], warga = [], rts = [], currentRT, currentRW } = useApp()
  const { width } = useWindowDimensions()
  const isMobile = width < 768

  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('Semua') // 'Semua' | 'Lunas' | 'Belum Bayar' | 'Menunggu'
  const [viewMode, setViewMode] = useState(isMobile ? 'cards' : 'table') // 'cards' (mobile-first) | 'table' (tabular)
  const [selectedItem, setSelectedItem] = useState(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)

  // Normalisasi & Enrich Data Tagihan
  const enrichedList = useMemo(() => {
    return tagihan.map((t) => {
      const targetW = warga.find((w) => w.id === t.wargaId) || {}
      const targetRt = rts.find((r) => r.id === targetW.rt_id || r.id === t.rt_id)

      const namaWarga = targetW.nama || t.namaWarga || 'Warga Lingkungan'
      const blok = targetW.blok || t.blok || '-'
      const noRumah = targetW.noRumah || t.noRumah || '-'
      const blokRumah = `Blok ${blok} No. ${noRumah}`
      const alamatSingkat = `${blok}/${noRumah}`

      const isRw = t.payment_scope === 'RW'
      let rawNama = t.namaPos || (isRw ? 'Fasum RW' : 'IPL')
      let jenisIuran = rawNama
      if (rawNama.includes('Pengelolaan') || rawNama.toLowerCase().includes('ipl')) {
        jenisIuran = 'IPL'
      } else if (rawNama.includes('Pembangunan') || rawNama.toLowerCase().includes('fasum')) {
        jenisIuran = 'Fasum RW'
      }
      const scopeLabel = isRw ? (currentRW?.name || 'RW 01') : (targetRt?.name || currentRT?.name || 'RT 01')
      const periodeLabel = `${String(t.bulan).padStart(2, '0')}/${String(t.tahun).slice(-2)}`

      const isLunas = t.status === 'Lunas'
      const isPending = t.status === 'Menunggu Verifikasi'
      const statusText = isLunas ? 'Lunas' : isPending ? 'Menunggu' : 'Belum'

      // Metode Pembayaran
      let metodePembayaran = '-'
      if (isLunas || isPending) {
        metodePembayaran = t.metodeBayar ? t.metodeBayar.replace('Transfer Bank', 'Transfer') : 'Transfer'
      }

      // Tanggal Pembayaran
      let tanggalFull = '-'
      let tanggalSingkat = '-'
      if (isLunas) {
        const rawDate = t.tanggalBayar || t.tglBayar
        if (rawDate) {
          try {
            tanggalFull = formatTanggalIndo(rawDate)
            const d = new Date(rawDate)
            if (!isNaN(d.getTime())) {
              const bln = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][d.getMonth()]
              tanggalSingkat = `${d.getDate()} ${bln} ${String(d.getFullYear()).slice(-2)}`
            } else {
              tanggalSingkat = String(rawDate).slice(0, 10)
            }
          } catch {
            tanggalFull = String(rawDate)
            tanggalSingkat = String(rawDate).slice(0, 10)
          }
        } else {
          tanggalFull = 'Terverifikasi'
          tanggalSingkat = 'Terverifikasi'
        }
      }

      return {
        ...t,
        namaWarga,
        blokRumah,
        alamatSingkat,
        jenisIuran,
        isRw,
        scopeLabel,
        periodeLabel,
        isLunas,
        isPending,
        statusText,
        metodePembayaran,
        tanggalFull,
        tanggalSingkat,
        nominal: t.total || 0,
        resident: targetW
      }
    })
  }, [tagihan, warga, rts, currentRT, currentRW])

  // Filter Data
  const filteredList = useMemo(() => {
    return enrichedList.filter((item) => {
      // Filter Status
      if (filterStatus === 'Lunas' && !item.isLunas) return false
      if (filterStatus === 'Belum Bayar' && (item.isLunas || item.isPending)) return false
      if (filterStatus === 'Menunggu' && !item.isPending) return false

      // Filter Scope (RT / RW)
      if (initialScope === 'RT' && item.isRw) return false
      if (initialScope === 'RW' && !item.isRw) return false

      // Filter Search
      if (search.trim()) {
        const q = search.toLowerCase().trim()
        const matchName = item.namaWarga.toLowerCase().includes(q)
        const matchBlok = item.blokRumah.toLowerCase().includes(q)
        const matchIuran = item.jenisIuran.toLowerCase().includes(q)
        const matchMetode = item.metodePembayaran.toLowerCase().includes(q)
        return matchName || matchBlok || matchIuran || matchMetode
      }

      return true
    })
  }, [enrichedList, filterStatus, initialScope, search])

  // Simple Summary Data
  const summary = useMemo(() => {
    const totalCount = filteredList.length
    const lunasCount = filteredList.filter((t) => t.isLunas).length
    const pendingCount = filteredList.filter((t) => t.isPending).length
    const belumCount = filteredList.filter((t) => !t.isLunas && !t.isPending).length
    const nominalTerkumpul = filteredList
      .filter((t) => t.isLunas)
      .reduce((acc, t) => acc + (t.nominal || 0), 0)

    return { totalCount, lunasCount, pendingCount, belumCount, nominalTerkumpul }
  }, [filteredList])

  const displayedList = maxItems ? filteredList.slice(0, maxItems) : filteredList

  const handleOpenDetail = (item) => {
    setSelectedItem(item)
    setDetailModalOpen(true)
  }

  const handleCopyKwitansi = async (kwitansi) => {
    if (!kwitansi) return
    await copyToClipboard(kwitansi)
    Alert.alert('Tersalin', `No. Kwitansi #${kwitansi} disalin ke clipboard!`)
  }

  return (
    <View style={styles.container}>
      {/* 1. Sleek Minimalist Summary Card (Hanya muncul jika showSummary aktif) */}
      {showSummary && (
        <View style={styles.summaryCard}>
          <View style={styles.summaryCol}>
            <Text style={styles.summaryLabel}>TERKUMPUL</Text>
            <Text style={styles.summaryValSuccess} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
              {formatRupiah(summary.nominalTerkumpul)}
            </Text>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryCol}>
            <Text style={styles.summaryLabel}>LUNAS</Text>
            <View style={styles.summaryBadgeRow}>
              <View style={styles.dotSuccess} />
              <Text style={styles.summaryVal} numberOfLines={1}>
                {summary.lunasCount} <Text style={styles.summaryUnit}>Warga</Text>
              </Text>
            </View>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryCol}>
            <Text style={styles.summaryLabel}>BELUM LUNAS</Text>
            <View style={styles.summaryBadgeRow}>
              <View style={styles.dotDanger} />
              <Text style={[styles.summaryVal, { color: '#E11D48' }]} numberOfLines={1}>
                {summary.belumCount} <Text style={styles.summaryUnit}>Warga</Text>
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* 2. Search & Filter Bar */}
      {showFullControls && (
        <View style={styles.controlSection}>
          {/* Search Input */}
          <View style={styles.searchBar}>
            <Search size={15} color="#94A3B8" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Cari nama warga, blok, atau iuran..."
              placeholderTextColor="#94A3B8"
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={15} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>

          {/* Quick Filter Pills & Mode Switcher */}
          <View style={styles.filterBarRow}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterScroll}
              style={{ flex: 1 }}
            >
              {[
                { id: 'Semua', label: `Semua (${summary.totalCount})` },
                { id: 'Lunas', label: `Lunas (${summary.lunasCount})` },
                { id: 'Belum Bayar', label: `Belum (${summary.belumCount})` },
                ...(summary.pendingCount > 0
                  ? [{ id: 'Menunggu', label: `Menunggu (${summary.pendingCount})` }]
                  : [])
              ].map((f) => {
                const isActive = filterStatus === f.id
                return (
                  <TouchableOpacity
                    key={f.id}
                    style={[styles.filterPill, isActive && styles.filterPillActive]}
                    onPress={() => setFilterStatus(f.id)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </ScrollView>

            {/* View Mode Switcher: Mobile Cards vs Table */}
            <View style={styles.modeSwitchWrap}>
              <TouchableOpacity
                style={[styles.modeBtn, viewMode === 'cards' && styles.modeBtnActive]}
                onPress={() => setViewMode('cards')}
                activeOpacity={0.8}
              >
                <LayoutList size={13} color={viewMode === 'cards' ? colors.primary : '#64748B'} />
                <Text style={[styles.modeBtnText, viewMode === 'cards' && styles.modeBtnTextActive]}>
                  Kartu
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modeBtn, viewMode === 'table' && styles.modeBtnActive]}
                onPress={() => setViewMode('table')}
                activeOpacity={0.8}
              >
                <TableIcon size={13} color={viewMode === 'table' ? colors.primary : '#64748B'} />
                <Text style={[styles.modeBtnText, viewMode === 'table' && styles.modeBtnTextActive]}>
                  Tabel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* 3. TAMPILAN DATA: KARTU RAPI ATAU TABEL KOMPAK */}
      {displayedList.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Tidak ada data iuran</Text>
          <Text style={styles.emptySub}>Coba sesuaikan kata kunci pencarian atau filter status.</Text>
        </View>
      ) : viewMode === 'cards' ? (
        /* ================= TAMPILAN MOBILE CARDS RAPI & RESPONSIF ================= */
        <View style={styles.cardsContainer}>
          {displayedList.map((item, idx) => {
            const initials = item.namaWarga
              ? item.namaWarga
                  .trim()
                  .split(' ')
                  .map((n) => n[0])
                  .filter(Boolean)
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()
              : 'WG'

            return (
              <TouchableOpacity
                key={item.id || idx}
                style={styles.itemCard}
                onPress={() => handleOpenDetail(item)}
                activeOpacity={0.7}
              >
                {/* Baris 1: Avatar Inisial + Nama & Lokasi + Nominal & Status */}
                <View style={styles.cardMainRow}>
                  {/* Avatar Lingkaran */}
                  <View
                    style={[
                      styles.avatarBox,
                      item.isLunas ? styles.avatarLunas : item.isPending ? styles.avatarPending : styles.avatarBelum
                    ]}
                  >
                    <Text
                      style={[
                        styles.avatarText,
                        item.isLunas
                          ? styles.avatarTextLunas
                          : item.isPending
                          ? styles.avatarTextPending
                          : styles.avatarTextBelum
                      ]}
                    >
                      {initials}
                    </Text>
                  </View>

                  {/* Info Tengah: Nama & Blok */}
                  <View style={styles.cardCenterCol}>
                    <Text style={styles.cardName} numberOfLines={1}>
                      {item.namaWarga}
                    </Text>
                    <View style={styles.cardAddressRow}>
                      <MapPin size={10} color="#64748B" style={{ marginRight: 2 }} />
                      <Text style={styles.cardAddress} numberOfLines={1}>
                        {item.blokRumah}
                      </Text>
                      <Text style={styles.cardDot}>•</Text>
                      <Text style={styles.cardScopeText}>{item.scopeLabel}</Text>
                    </View>
                  </View>

                  {/* Kanan: Nominal Besar & Status Badge */}
                  <View style={styles.cardRightCol}>
                    <Text
                      style={[
                        styles.cardNominalText,
                        item.isLunas ? styles.textSuccess : styles.textDark
                      ]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.85}
                    >
                      {formatRupiah(item.nominal)}
                    </Text>

                    {item.isLunas ? (
                      <View style={styles.statusPillLunas}>
                        <CheckCircle2 size={10} color="#059669" style={{ marginRight: 2 }} />
                        <Text style={styles.statusPillTextLunas}>Lunas</Text>
                      </View>
                    ) : item.isPending ? (
                      <View style={styles.statusPillPending}>
                        <Clock size={10} color="#D97706" style={{ marginRight: 2 }} />
                        <Text style={styles.statusPillTextPending}>Menunggu</Text>
                      </View>
                    ) : (
                      <View style={styles.statusPillBelum}>
                        <XCircle size={10} color="#E11D48" style={{ marginRight: 2 }} />
                        <Text style={styles.statusPillTextBelum}>Belum</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Baris 2: Divider Tipis Elegan */}
                <View style={styles.cardDivider} />

                {/* Baris 3: Pos Iuran & Keterangan Bayar + Chevron */}
                <View style={styles.cardFooterRow}>
                  <View style={styles.cardFooterLeft}>
                    <View style={styles.iuranBadge}>
                      <Receipt size={10} color="#0284C7" style={{ marginRight: 3 }} />
                      <Text style={styles.iuranBadgeText}>{item.jenisIuran}</Text>
                      <Text style={styles.iuranPeriodeText}>Bln {item.periodeLabel}</Text>
                    </View>

                    <Text style={styles.cardPaymentMetaText} numberOfLines={1}>
                      {item.isLunas
                        ? `💳 ${item.metodePembayaran} • ${item.tanggalSingkat}`
                        : item.isPending
                        ? `⏳ Bukti dikirim, verifikasi bendahara`
                        : `⚠️ Menunggu pembayaran`}
                    </Text>
                  </View>

                  <ChevronRight size={14} color="#94A3B8" />
                </View>
              </TouchableOpacity>
            )
          })}
        </View>
      ) : (
        /* ================= TAMPILAN TABEL KOMPAK ================= */
        <AppCard style={styles.tableCard}>
          <View style={styles.tableScrollHint}>
            <Text style={styles.tableScrollHintText}>💡 Geser tabel ke kanan untuk melihat data lengkap</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={true}>
            <View style={styles.tableWrap}>
              {/* Header Tabel */}
              <View style={styles.thRow}>
                <Text style={[styles.thText, styles.colWarga]}>WARGA & BLOK</Text>
                <Text style={[styles.thText, styles.colIuran]}>IURAN</Text>
                <Text style={[styles.thText, styles.colStatus]}>STATUS</Text>
                <Text style={[styles.thText, styles.colMetode]}>METODE</Text>
                <Text style={[styles.thText, styles.colTanggal]}>TANGGAL</Text>
                <Text style={[styles.thText, styles.colNominal]}>NOMINAL</Text>
                <Text style={[styles.thText, styles.colArrow]}>{''}</Text>
              </View>

              {/* Data Rows */}
              {displayedList.map((item, idx) => {
                const isEven = idx % 2 === 0
                return (
                  <TouchableOpacity
                    key={item.id || idx}
                    style={[styles.trRow, isEven ? styles.trEven : styles.trOdd]}
                    onPress={() => handleOpenDetail(item)}
                    activeOpacity={0.7}
                  >
                    {/* 1. Nama Warga & Blok */}
                    <View style={[styles.tdCell, styles.colWarga]}>
                      <Text style={styles.tdNamaWarga} numberOfLines={1}>
                        {item.namaWarga}
                      </Text>
                      <Text style={styles.tdBlok} numberOfLines={1}>
                        {item.blokRumah}
                      </Text>
                    </View>

                    {/* 2. Jenis Iuran */}
                    <View style={[styles.tdCell, styles.colIuran]}>
                      <Text style={styles.tdIuran} numberOfLines={1}>
                        {item.jenisIuran}
                      </Text>
                      <Text style={styles.tdPeriode} numberOfLines={1}>
                        {item.periodeLabel}
                      </Text>
                    </View>

                    {/* 3. Status Bayar */}
                    <View style={[styles.tdCell, styles.colStatus]}>
                      {item.isLunas ? (
                        <View style={styles.statusPillLunas}>
                          <CheckCircle2 size={10} color="#059669" style={{ marginRight: 2 }} />
                          <Text style={styles.statusPillTextLunas}>Lunas</Text>
                        </View>
                      ) : item.isPending ? (
                        <View style={styles.statusPillPending}>
                          <Clock size={10} color="#D97706" style={{ marginRight: 2 }} />
                          <Text style={styles.statusPillTextPending}>Menunggu</Text>
                        </View>
                      ) : (
                        <View style={styles.statusPillBelum}>
                          <XCircle size={10} color="#E11D48" style={{ marginRight: 2 }} />
                          <Text style={styles.statusPillTextBelum}>Belum</Text>
                        </View>
                      )}
                    </View>

                    {/* 4. Metode Bayar */}
                    <View style={[styles.tdCell, styles.colMetode]}>
                      <Text style={styles.tdMetode} numberOfLines={1}>
                        {item.metodePembayaran}
                      </Text>
                    </View>

                    {/* 5. Tanggal Bayar */}
                    <View style={[styles.tdCell, styles.colTanggal]}>
                      <Text style={styles.tdTanggal} numberOfLines={1}>
                        {item.tanggalSingkat}
                      </Text>
                    </View>

                    {/* 6. Nominal */}
                    <View style={[styles.tdCell, styles.colNominal]}>
                      <Text style={[styles.tdNominal, item.isLunas ? styles.textSuccess : styles.textDark]}>
                        {formatRupiah(item.nominal)}
                      </Text>
                    </View>

                    {/* Arrow Detail */}
                    <View style={[styles.tdCell, styles.colArrow]}>
                      <ChevronRight size={13} color="#94A3B8" />
                    </View>
                  </TouchableOpacity>
                )
              })}
            </View>
          </ScrollView>
        </AppCard>
      )}

      {/* 4. Footer Info / See More */}
      <View style={styles.footerRow}>
        <Text style={styles.footerCount}>
          Menampilkan {displayedList.length} dari {filteredList.length} data
        </Text>
        {maxItems && filteredList.length > maxItems && onSeeMore && (
          <TouchableOpacity onPress={onSeeMore} style={styles.seeMoreBtn} activeOpacity={0.8}>
            <Text style={styles.seeMoreText}>Lihat Semua</Text>
            <ChevronRight size={13} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {/* 5. MODAL DETAIL TRANSPARANSI RINCI */}
      <AppModal
        visible={detailModalOpen}
        title="Rincian Transparansi Iuran"
        onClose={() => setDetailModalOpen(false)}
        footer={
          <View style={{ width: '100%' }}>
            <AppButton title="Tutup Rincian" variant="secondary" onPress={() => setDetailModalOpen(false)} />
          </View>
        }
      >
        {selectedItem && (
          <View style={styles.modalContent}>
            {/* Status Hero Card */}
            <View
              style={[
                styles.modalStatusBox,
                selectedItem.isLunas
                  ? styles.modalStatusBoxLunas
                  : selectedItem.isPending
                  ? styles.modalStatusBoxPending
                  : styles.modalStatusBoxBelum
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                {selectedItem.isLunas ? (
                  <CheckCircle2 size={16} color="#059669" />
                ) : selectedItem.isPending ? (
                  <Clock size={16} color="#D97706" />
                ) : (
                  <XCircle size={16} color="#E11D48" />
                )}
                <Text
                  style={[
                    styles.modalStatusTitle,
                    {
                      color: selectedItem.isLunas
                        ? '#059669'
                        : selectedItem.isPending
                        ? '#D97706'
                        : '#E11D48'
                    }
                  ]}
                >
                  {selectedItem.isLunas
                    ? 'Pembayaran Lunas'
                    : selectedItem.isPending
                    ? 'Menunggu Verifikasi Bendahara'
                    : 'Belum Melakukan Pembayaran'}
                </Text>
              </View>

              <Text style={styles.modalNominalVal}>{formatRupiah(selectedItem.nominal)}</Text>
            </View>

            {/* Field Table Rinci */}
            <View style={styles.modalDetailsList}>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Nama Warga</Text>
                <Text style={styles.modalValue}>{selectedItem.namaWarga}</Text>
              </View>

              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Alamat / Blok</Text>
                <Text style={styles.modalValue}>{selectedItem.blokRumah}</Text>
              </View>

              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Jenis Iuran</Text>
                <Text style={styles.modalValue}>{selectedItem.jenisIuran}</Text>
              </View>

              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Periode</Text>
                <Text style={styles.modalValue}>Bulan {selectedItem.periodeLabel}</Text>
              </View>

              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Tingkat</Text>
                <Text style={styles.modalValue}>{selectedItem.scopeLabel}</Text>
              </View>

              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Metode Bayar</Text>
                <Text style={styles.modalValue}>{selectedItem.metodePembayaran}</Text>
              </View>

              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Tanggal Bayar</Text>
                <Text style={styles.modalValue}>{selectedItem.tanggalFull}</Text>
              </View>

              {selectedItem.noKwitansi ? (
                <View style={[styles.modalRow, { borderBottomWidth: 0 }]}>
                  <Text style={styles.modalLabel}>No. Bukti / Kwitansi</Text>
                  <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center' }}
                    onPress={() => handleCopyKwitansi(selectedItem.noKwitansi)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.modalValue, { color: colors.primary, fontWeight: '700', marginRight: 4 }]}>
                      #{selectedItem.noKwitansi}
                    </Text>
                    <Copy size={13} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
          </View>
        )}
      </AppModal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%'
  },
  /* 1. Sleek Minimalist Summary Card */
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginBottom: 10,
    ...shadows.sm
  },
  summaryCol: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 2
  },
  summaryDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#E2E8F0'
  },
  summaryLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.4,
    marginBottom: 3
  },
  summaryVal: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1E293B'
  },
  summaryValSuccess: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#059669'
  },
  summaryUnit: {
    fontSize: 10,
    fontWeight: '500',
    color: '#64748B'
  },
  summaryBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  dotSuccess: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#059669'
  },
  dotDanger: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E11D48'
  },

  /* 2. Search & Filter Bar */
  controlSection: {
    marginBottom: 10
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    ...shadows.sm
  },
  searchInput: {
    flex: 1,
    fontSize: 12.5,
    color: '#1E293B',
    paddingVertical: 0
  },
  filterBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8
  },
  filterScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  filterPill: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: radius.full,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  filterPillActive: {
    backgroundColor: '#EFF6FF',
    borderColor: colors.primary
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B'
  },
  filterPillTextActive: {
    color: colors.primary,
    fontWeight: '700'
  },
  modeSwitchWrap: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: radius.full,
    padding: 2.5,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  modeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full
  },
  modeBtnActive: {
    backgroundColor: '#FFFFFF',
    ...shadows.sm
  },
  modeBtnText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#64748B'
  },
  modeBtnTextActive: {
    color: colors.primary,
    fontWeight: '700'
  },

  /* 3. Mobile Card View: Rapi & Modern */
  cardsContainer: {
    gap: 8
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    ...shadows.sm
  },
  cardMainRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  avatarBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10
  },
  avatarLunas: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0'
  },
  avatarPending: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A'
  },
  avatarBelum: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA'
  },
  avatarText: {
    fontSize: 12.5,
    fontWeight: '800'
  },
  avatarTextLunas: {
    color: '#059669'
  },
  avatarTextPending: {
    color: '#D97706'
  },
  avatarTextBelum: {
    color: '#E11D48'
  },
  cardCenterCol: {
    flex: 1,
    minWidth: 0,
    marginRight: 8
  },
  cardName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2
  },
  cardAddressRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  cardAddress: {
    fontSize: 11,
    color: '#64748B'
  },
  cardDot: {
    fontSize: 10,
    color: '#CBD5E1',
    marginHorizontal: 4
  },
  cardScopeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#0284C7'
  },
  cardRightCol: {
    alignItems: 'flex-end',
    justifyContent: 'center'
  },
  cardNominalText: {
    fontSize: 13.5,
    fontWeight: '800',
    marginBottom: 3
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginTop: 10,
    marginBottom: 8
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  cardFooterLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
    marginRight: 6
  },
  iuranBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6
  },
  iuranBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0369A1',
    marginRight: 3
  },
  iuranPeriodeText: {
    fontSize: 9.5,
    color: '#0284C7',
    fontWeight: '500'
  },
  cardPaymentMetaText: {
    flex: 1,
    fontSize: 10.5,
    color: '#64748B',
    fontWeight: '500'
  },

  /* Status Badges */
  statusPillLunas: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: radius.full
  },
  statusPillTextLunas: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669'
  },
  statusPillPending: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: radius.full
  },
  statusPillTextPending: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706'
  },
  statusPillBelum: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: radius.full
  },
  statusPillTextBelum: {
    fontSize: 10,
    fontWeight: '700',
    color: '#E11D48'
  },
  textSuccess: {
    color: '#059669'
  },
  textDark: {
    color: '#1E293B'
  },

  /* 4. Table View Kompak */
  tableCard: {
    padding: 0,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden'
  },
  tableScrollHint: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#DBEAFE',
    alignItems: 'center'
  },
  tableScrollHintText: {
    fontSize: 10,
    color: '#1D4ED8',
    fontWeight: '600'
  },
  tableWrap: {
    minWidth: 540
  },
  thRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 8,
    paddingHorizontal: 8
  },
  thText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.3
  },
  trRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  trEven: {
    backgroundColor: '#FFFFFF'
  },
  trOdd: {
    backgroundColor: '#FAFAFA'
  },
  tdCell: {
    justifyContent: 'center'
  },

  colWarga: {
    width: 135
  },
  colIuran: {
    width: 80
  },
  colStatus: {
    width: 80
  },
  colMetode: {
    width: 75
  },
  colTanggal: {
    width: 80
  },
  colNominal: {
    width: 90,
    textAlign: 'right'
  },
  colArrow: {
    width: 18,
    alignItems: 'center'
  },

  tdNamaWarga: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B'
  },
  tdBlok: {
    fontSize: 10,
    color: '#64748B'
  },
  tdIuran: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155'
  },
  tdPeriode: {
    fontSize: 9.5,
    color: '#94A3B8'
  },
  tdMetode: {
    fontSize: 11,
    color: '#475569'
  },
  tdTanggal: {
    fontSize: 10.5,
    color: '#64748B'
  },
  tdNominal: {
    fontSize: 11.5,
    fontWeight: '700',
    textAlign: 'right'
  },

  /* Empty State */
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569'
  },
  emptySub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2
  },

  /* Footer */
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 4
  },
  footerCount: {
    fontSize: 10.5,
    color: '#94A3B8',
    fontWeight: '500'
  },
  seeMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2
  },
  seeMoreText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary
  },

  /* Detail Modal */
  modalContent: {
    gap: 12
  },
  modalStatusBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12
  },
  modalStatusBoxLunas: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0'
  },
  modalStatusBoxPending: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A'
  },
  modalStatusBoxBelum: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA'
  },
  modalStatusTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6
  },
  modalNominalVal: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 4
  },
  modalDetailsList: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 4
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  modalLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500'
  },
  modalValue: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1E293B'
  }
})
