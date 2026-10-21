import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ScrollView,
  Alert
} from 'react-native'
import {
  Users,
  Search,
  Plus,
  Phone,
  Home,
  X,
  UserCheck,
  Shield,
  Check
} from 'lucide-react-native'
import { useApp } from '../../context/AppContext'
import TopAppBar from '../../components/layout/TopAppBar'
import AppCard from '../../components/shared/AppCard'
import AppBadge from '../../components/shared/AppBadge'
import AppModal from '../../components/modals/AppModal'
import AppButton from '../../components/shared/AppButton'
import { colors, typography, spacing, radius, shadows } from '../../utils/theme'
import { getJabatanLabel, getJabatanShortLabel, getJabatanTheme } from '../../utils/formatters'

export default function WargaListScreen({ navigation }) {
  const { scopedWarga, isAdminLoggedIn, isAdmin, updateWarga, refreshData, refreshing, tagihan } = useApp()
  const [search, setSearch] = useState('')
  const [selectedBlok, setSelectedBlok] = useState('Semua')

  // Modal Ubah Role Warga (Khusus Admin IT)
  const [roleModalVisible, setRoleModalVisible] = useState(false)
  const [targetWarga, setTargetWarga] = useState(null)
  const [selectedRole, setSelectedRole] = useState('warga')
  const [savingRole, setSavingRole] = useState(false)

  const handleOpenRoleModal = (w) => {
    setTargetWarga(w)
    setSelectedRole(w.jabatan || 'warga')
    setRoleModalVisible(true)
  }

  const handleSaveRole = async () => {
    if (!targetWarga) return
    setSavingRole(true)
    try {
      await updateWarga(targetWarga.id, { jabatan: selectedRole, role: selectedRole })
      setRoleModalVisible(false)
      Alert.alert('Sukses', `Role ${targetWarga.nama} berhasil diubah menjadi ${getJabatanShortLabel(selectedRole)}.`)
    } catch (e) {
      Alert.alert('Error', 'Gagal memperbarui role warga.')
    } finally {
      setSavingRole(false)
    }
  }

  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()

  // Dynamic bloks
  const existingBloks = Array.from(
    new Set(scopedWarga.map((w) => (w.blok || '').toUpperCase()).filter(Boolean))
  ).sort()
  const bloks = ['Semua', ...existingBloks.map((b) => `Blok ${b}`)]

  const filteredWarga = scopedWarga.filter((w) => {
    if (selectedBlok !== 'Semua') {
      const blokChar = selectedBlok.replace('Blok ', '').toUpperCase()
      if ((w.blok || '').toUpperCase() !== blokChar) return false
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim()
      const matchName = (w.nama || '').toLowerCase().includes(q)
      const matchBlok = `${w.blok || ''}/${w.noRumah || ''}`.toLowerCase().includes(q)
      const matchHp = (w.noHp || '').includes(q)
      const matchKode = (w.kodeUnik && String(w.kodeUnik).includes(q.replace('#', '')))
      const matchNik = w.nik && w.nik.includes(q)
      const matchKk = w.noKk && w.noKk.includes(q)
      const matchPekerjaan = (w.pekerjaan || '').toLowerCase().includes(q)
      return matchName || matchBlok || matchHp || matchKode || matchNik || matchKk || matchPekerjaan
    }
    return true
  })

  const renderWargaItem = ({ item }) => {
    const bill = tagihan.find(
      (t) =>
        (t.wargaId === item.id || (t.namaWarga && t.namaWarga === item.nama)) &&
        Number(t.bulan) === currentMonth &&
        Number(t.tahun) === currentYear
    )

    const isPaid = bill?.status === 'Lunas'
    const isPending = bill?.status === 'Menunggu Verifikasi'
    const statusText = !bill
      ? 'Belum Terbit'
      : isPaid
      ? 'IPL Lunas'
      : isPending
      ? 'Menunggu'
      : 'Belum Bayar'

    const isPendingApproval = item.statusApproval === 'Menunggu Verifikasi'

    return (
      <AppCard
        style={[styles.card, isPendingApproval && { borderColor: '#93C5FD', backgroundColor: '#F8FAFC' }]}
        onPress={() => navigation.navigate('DetailWarga', { warga: item })}
      >
        <View style={styles.cardLeft}>
          <View style={[styles.avatarWrap, isPendingApproval && { backgroundColor: '#DBEAFE' }]}>
            <Text style={[styles.avatarText, isPendingApproval && { color: '#1D4ED8' }]}>
              {(item.nama || 'W').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.infoCol}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.wargaNama} numberOfLines={1}>{item.nama}</Text>
              {item.jabatan && item.jabatan !== 'warga' ? (
                <View
                  style={[
                    styles.jabatanChip,
                    {
                      backgroundColor: getJabatanTheme(item.jabatan).bg,
                      borderColor: getJabatanTheme(item.jabatan).border
                    }
                  ]}
                >
                  <Text
                    style={[
                      styles.jabatanChipText,
                      { color: getJabatanTheme(item.jabatan).text }
                    ]}
                  >
                    {getJabatanShortLabel(item.jabatan)}
                  </Text>
                </View>
              ) : null}
            </View>
            <View style={styles.addressRow}>
              <Home size={12} color={colors.textSecondary} />
              <Text style={styles.wargaAlamat} numberOfLines={1}>
                Blok {item.blok || 'A'} No. {item.noRumah || '-'} • #{item.kodeUnik || '101'}
              </Text>
            </View>
            {item.noHp ? (
              <View style={styles.phoneRow}>
                <Phone size={12} color={colors.success} />
                <Text style={styles.wargaPhone} numberOfLines={1}>{item.noHp}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.cardRight}>
          {isPendingApproval ? (
            <AppBadge status="pending" label="Butuh ACC" />
          ) : (
            <AppBadge status={statusText} label={statusText} />
          )}

          <View
            style={[
              styles.statusHuniBadge,
              item.statusHuni === 'Kontrak' ? styles.badgeKontrak : styles.badgeTetap
            ]}
          >
            <Text
              style={[
                styles.statusHuniText,
                item.statusHuni === 'Kontrak' ? styles.textKontrak : styles.textTetap
              ]}
            >
              {item.statusHuni || 'Tetap'}
            </Text>
          </View>

          {isAdmin && (
            <TouchableOpacity
              style={styles.ubahRoleBtn}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              accessibilityRole="button"
              accessibilityLabel={`Ubah role ${item.nama}`}
              onPress={() => handleOpenRoleModal(item)}
              activeOpacity={0.75}
            >
              <UserCheck size={11} color="#4F46E5" style={{ marginRight: 3 }} />
              <Text style={styles.ubahRoleBtnText}>Ubah Role</Text>
            </TouchableOpacity>
          )}
        </View>
      </AppCard>
    )
  }

  return (
    <View style={styles.container}>
      <TopAppBar title="Data Warga & Blok" navigation={navigation} />

      {/* Search & Filter Header */}
      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <Search size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari nama, blok, nomor rumah..."
            placeholderTextColor={colors.textSecondary}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <X size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
        >
          {bloks.map((item) => (
            <TouchableOpacity
              key={item}
              style={[styles.filterChip, selectedBlok === item && styles.filterChipActive]}
              onPress={() => setSelectedBlok(item)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedBlok === item && styles.filterChipTextActive
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Summary Counter */}
      <View style={styles.summaryBar}>
        <Text style={styles.summaryCount}>
          Menampilkan {filteredWarga.length} dari {scopedWarga.length} Warga
        </Text>
      </View>

      {/* Citizen List */}
      <FlatList
        data={filteredWarga}
        keyExtractor={(item, index) => item.id || `w-${item.blok}-${item.noRumah}-${index}`}
        renderItem={renderWargaItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        initialNumToRender={8}
        maxToRenderPerBatch={10}
        windowSize={7}
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
            <Users size={44} color={colors.textSecondary} style={{ marginBottom: 12 }} />
            <Text style={styles.emptyTitle}>Data warga tidak ditemukan</Text>
            <Text style={styles.emptySub}>Coba kata kunci atau filter blok lain.</Text>
          </View>
        }
      />

      {/* FAB Tambah Warga */}
      {isAdminLoggedIn && (
        <TouchableOpacity
          style={styles.fab}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          accessibilityRole="button"
          accessibilityLabel="Tambah Data Warga Baru"
          onPress={() => navigation.navigate('Register')}
          activeOpacity={0.88}
        >
          <Plus size={24} color={colors.surface} />
        </TouchableOpacity>
      )}

      {/* Modal Ubah Role Warga (Khusus Admin IT) */}
      <AppModal
        visible={roleModalVisible}
        title="Ubah Role & Jabatan Warga"
        subtitle={targetWarga ? `Pilih peran baru untuk ${targetWarga.nama}` : ''}
        onClose={() => setRoleModalVisible(false)}
        footer={
          <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
            <View style={{ flex: 1 }}>
              <AppButton
                title="Batal"
                variant="secondary"
                onPress={() => setRoleModalVisible(false)}
              />
            </View>
            <View style={{ flex: 1 }}>
              <AppButton
                title="Simpan Role"
                variant="primary"
                loading={savingRole}
                onPress={handleSaveRole}
              />
            </View>
          </View>
        }
      >
        <View style={{ gap: 8 }}>
          {[
            { key: 'warga', label: 'Warga Biasa', desc: 'Warga perumahan tanpa jabatan struktural' },
            { key: 'rt', label: 'Ketua RT', desc: 'Mengelola warga, iuran dan kas RT' },
            { key: 'rw', label: 'Ketua RW', desc: 'Mengoordinasi wilayah lingkungan RW' },
            { key: 'bendahara', label: 'Bendahara', desc: 'Mengelola pembukuan keuangan & kas' },
            { key: 'pengurus', label: 'Pengurus Fasum', desc: 'Mengelola fasilitas umum, aduan & surat' },
            { key: 'admin', label: 'Admin IT', desc: 'Super Administrator sistem & database' }
          ].map((item) => {
            const isSel = selectedRole === item.key
            const theme = getJabatanTheme(item.key)
            return (
              <TouchableOpacity
                key={item.key}
                style={[
                  styles.roleModalOption,
                  isSel && { borderColor: theme.border, backgroundColor: theme.bg }
                ]}
                onPress={() => setSelectedRole(item.key)}
                activeOpacity={0.8}
              >
                <View style={[styles.roleModalIcon, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                  <Shield size={16} color={theme.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.roleModalTitle, isSel && { color: theme.color }]}>{item.label}</Text>
                  <Text style={styles.roleModalDesc}>{item.desc}</Text>
                </View>
                {isSel && <Check size={18} color={theme.color} />}
              </TouchableOpacity>
            )
          })}
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
  searchSection: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: 4
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    height: 44,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xs
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 13
  },
  filterList: {
    gap: 6,
    paddingBottom: 4
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border
  },
  filterChipActive: {
    backgroundColor: colors.primarySubtle,
    borderColor: colors.primary
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary
  },
  filterChipTextActive: {
    color: colors.primary,
    fontWeight: '700'
  },
  summaryBar: {
    paddingHorizontal: spacing.md,
    paddingTop: 4,
    paddingBottom: 2
  },
  summaryCount: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary
  },
  listContent: {
    padding: spacing.md,
    paddingTop: 6,
    paddingBottom: 170
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    padding: spacing.md
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    marginRight: spacing.xs
  },
  avatarWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary
  },
  infoCol: {
    flex: 1,
    minWidth: 0
  },
  wargaNama: {
    ...typography.cardTitle,
    marginBottom: 2,
    flexShrink: 1
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  wargaAlamat: {
    ...typography.caption
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2
  },
  wargaPhone: {
    fontSize: 11,
    color: colors.success,
    fontWeight: '600'
  },
  cardRight: {
    alignItems: 'flex-end',
    gap: 4
  },
  jabatanChip: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: radius.sm,
    borderWidth: 1,
    flexShrink: 0
  },
  jabatanChipText: {
    fontSize: 9.5,
    fontWeight: '800'
  },
  statusHuniBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm
  },
  badgeTetap: {
    backgroundColor: '#EFF6FF'
  },
  badgeKontrak: {
    backgroundColor: '#FFFBEB'
  },
  statusHuniText: {
    fontSize: 10,
    fontWeight: '600'
  },
  textTetap: {
    color: colors.info
  },
  textKontrak: {
    color: colors.warning
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
    bottom: 104,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card
  },
  ubahRoleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3.5,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySubtle,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginTop: 3
  },
  ubahRoleBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary
  },
  roleModalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: spacing.sm + 2,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    backgroundColor: '#FFFFFF'
  },
  roleModalIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1
  },
  roleModalTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2
  },
  roleModalDesc: {
    fontSize: 11,
    color: colors.textSecondary
  }
})
