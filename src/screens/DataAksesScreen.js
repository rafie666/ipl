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
  RefreshControl
} from 'react-native'
import {
  Key,
  Shield,
  User,
  Search,
  Edit2,
  Trash2,
  X,
  Phone,
  Eye,
  EyeOff,
  Plus
} from 'lucide-react-native'
import { useApp } from '../context/AppContext'
import AppHeader from '../components/AppHeader'
import AppCard from '../components/AppCard'
import AppBadge from '../components/AppBadge'
import AppButton from '../components/AppButton'
import AppModal from '../components/AppModal'
import { colors, typography, spacing, radius, shadows } from '../utils/theme'
import { getJabatanLabel, getJabatanShortLabel, getJabatanTheme } from '../utils/formatters'

export default function DataAksesScreen({ navigation }) {
  const {
    users,
    rts,
    currentUser,
    addUserAccount,
    updateUserAccount,
    deleteUserAccount,
    refreshData,
    refreshing
  } = useApp()

  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('ALL')

  // Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState('bendahara')
  const [selectedRtId, setSelectedRtId] = useState('rt-1')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleOpenAdd = () => {
    setEditItem(null)
    setUsername('')
    setPassword('')
    setPhone('')
    setRole('admin')
    setSelectedRtId(rts[0]?.id || 'rt-1')
    setShowPassword(false)
    setModalOpen(true)
  }

  const handleOpenEdit = (u) => {
    const rtObj = rts.find((r) => r.id === u.rt_id)
    setEditItem(u)
    setUsername(u.username || '')
    setPassword('')
    setPhone(u.phone || rtObj?.kontak || '')
    setRole(u.role || 'admin')
    setSelectedRtId(u.rt_id || rts[0]?.id || 'rt-1')
    setShowPassword(false)
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    if (!username.trim()) {
      Alert.alert('Perhatian', 'Username wajib diisi!')
      return
    }

    if (!editItem && (!password || password.trim().length < 4)) {
      Alert.alert('Perhatian', 'Kata sandi minimal 4 karakter!')
      return
    }

    setLoading(true)
    try {
      if (editItem) {
        const res = await updateUserAccount(editItem.id, {
          username: username.trim().toLowerCase(),
          password: password.trim() ? password.trim() : undefined,
          phone: phone.trim(),
          role,
          jabatan: role,
          rt_id: role === 'rt' ? selectedRtId : null
        })
        if (res.success) {
          Alert.alert('Sukses', 'Akun berhasil diperbarui!')
          setModalOpen(false)
        } else {
          Alert.alert('Gagal', res.message || 'Gagal mengubah akun.')
        }
      } else {
        const res = await addUserAccount({
          username: username.trim().toLowerCase(),
          password: password.trim(),
          phone: phone.trim(),
          role,
          jabatan: role,
          rt_id: role === 'rt' ? selectedRtId : null
        })
        if (res.success) {
          Alert.alert('Sukses', 'Akun baru berhasil dibuat!')
          setModalOpen(false)
        } else {
          Alert.alert('Gagal', res.message || 'Username sudah terdaftar.')
        }
      }
    } catch (e) {
      Alert.alert('Error', 'Terjadi kesalahan sistem.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = (u) => {
    if (u.id === currentUser?.id) {
      Alert.alert('Perhatian', 'Anda tidak dapat menghapus akun yang sedang aktif.')
      return
    }

    Alert.alert(
      'Hapus Akun',
      `Yakin ingin menghapus akun "@${u.username}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            await deleteUserAccount(u.id)
            Alert.alert('Sukses', 'Akun berhasil dihapus.')
          }
        }
      ]
    )
  }

  const filteredUsers = users.filter((u) => {
    if (filterRole !== 'ALL' && u.role !== filterRole && u.jabatan !== filterRole) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      const matchU = (u.username || '').toLowerCase().includes(q)
      const matchN = (u.name || '').toLowerCase().includes(q)
      const matchR = (u.role || '').toLowerCase().includes(q)
      const matchJ = (u.jabatan || '').toLowerCase().includes(q)
      return matchU || matchN || matchR || matchJ
    }
    return true
  })

  const renderItem = ({ item }) => {
    const roleKey = item.role || item.jabatan || 'warga'
    const theme = getJabatanTheme(roleKey)
    const label = getJabatanLabel(roleKey)
    const targetRt = rts.find((r) => r.id === item.rt_id)

    return (
      <AppCard style={styles.card}>
        <View style={styles.cardContent}>
          <View
            style={[
              styles.avatarWrap,
              { backgroundColor: theme.bg, borderColor: theme.border, borderWidth: 1 }
            ]}
          >
            {roleKey === 'admin' ? (
              <Shield size={20} color={theme.color} />
            ) : (
              <User size={20} color={theme.color} />
            )}
          </View>

          <View style={styles.infoCol}>
            <View style={styles.rowTop}>
              <Text style={styles.usernameText} numberOfLines={1}>@{item.username}</Text>
              <View style={[styles.jabatanPill, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                <Text style={[styles.jabatanPillText, { color: theme.color }]}>
                  {roleKey === 'rt' ? (targetRt?.name || 'RT 01') : label}
                </Text>
              </View>
            </View>

            <Text style={styles.nameText} numberOfLines={1}>
              {item.name || label}
            </Text>

            {item.phone ? (
              <View style={styles.phoneRow}>
                <Phone size={12} color={colors.textSecondary} />
                <Text style={styles.phoneText}>{item.phone}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => handleOpenEdit(item)}
            activeOpacity={0.8}
          >
            <Edit2 size={14} color={colors.info} />
          </TouchableOpacity>

          {item.id !== currentUser?.id && (
            <TouchableOpacity
              style={[styles.iconBtn, { borderColor: '#FEE2E2', backgroundColor: '#FEF2F2' }]}
              onPress={() => handleDelete(item)}
              activeOpacity={0.8}
            >
              <Trash2 size={14} color={colors.danger} />
            </TouchableOpacity>
          )}
        </View>
      </AppCard>
    )
  }

  return (
    <View style={styles.container}>
      <AppHeader
        title="Data Akses & Keamanan"
        subtitle="Manajemen akun Super Admin, Ketua RT/RW, Bendahara & Pengurus"
        onBack={() => navigation.goBack()}
      />

      {/* Filter & Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <Search size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari username atau nama..."
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

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {[
            { key: 'ALL', label: 'Semua' },
            { key: 'admin', label: 'Admin IT' },
            { key: 'rw', label: 'Ketua RW' },
            { key: 'rt', label: 'Ketua RT' },
            { key: 'bendahara', label: 'Bendahara' },
            { key: 'pengurus', label: 'Pengurus' },
            { key: 'warga', label: 'Warga' }
          ].map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterChip, filterRole === f.key && styles.filterChipActive]}
              onPress={() => setFilterRole(f.key)}
            >
              <Text style={[styles.filterChipText, filterRole === f.key && styles.filterChipTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredUsers}
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
      />

      {/* FAB Tambah Akun */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleOpenAdd}
        activeOpacity={0.88}
      >
        <Plus size={24} color={colors.surface} />
      </TouchableOpacity>

      {/* Modal Tambah/Edit */}
      <AppModal
        visible={modalOpen}
        title={editItem ? 'Edit Akun Pengguna' : 'Tambah Akun Baru'}
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
          <Text style={styles.label}>Tipe Peran (Role / Jabatan)</Text>
          <View style={styles.roleGrid}>
            {[
              { id: 'admin', label: 'Admin IT' },
              { id: 'rw', label: 'Ketua RW' },
              { id: 'rt', label: 'Ketua RT' },
              { id: 'bendahara', label: 'Bendahara' },
              { id: 'pengurus', label: 'Pengurus' },
              { id: 'warga', label: 'Warga' }
            ].map((r) => (
              <TouchableOpacity
                key={r.id}
                style={[styles.roleGridBtn, role === r.id && styles.roleGridBtnActive]}
                onPress={() => setRole(r.id)}
              >
                <Text style={[styles.roleGridBtnText, role === r.id && styles.roleGridBtnTextActive]}>
                  {r.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {role === 'rt' && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Pilih Wilayah RT</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
              {rts.map((rt) => (
                <TouchableOpacity
                  key={rt.id}
                  style={[styles.filterChip, selectedRtId === rt.id && styles.filterChipActive]}
                  onPress={() => setSelectedRtId(rt.id)}
                >
                  <Text style={[styles.filterChipText, selectedRtId === rt.id && styles.filterChipTextActive]}>
                    {rt.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Username *</Text>
          <TextInput
            style={styles.input}
            placeholder="Contoh: admin.rt01"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="none"
            value={username}
            onChangeText={setUsername}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{editItem ? 'Kata Sandi Baru (Kosongkan jika tidak diubah)' : 'Kata Sandi *'}</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={[styles.input, { flex: 1, borderTopRightRadius: 0, borderBottomRightRadius: 0 }]}
              placeholder="Minimal 4 karakter"
              placeholderTextColor={colors.textSecondary}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} color={colors.textSecondary} /> : <Eye size={18} color={colors.textSecondary} />}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nomor WhatsApp (Opsional)</Text>
          <TextInput
            style={styles.input}
            placeholder="081234567890"
            keyboardType="phone-pad"
            placeholderTextColor={colors.textSecondary}
            value={phone}
            onChangeText={setPhone}
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
    fontSize: 13,
    color: colors.textPrimary
  },
  filterRow: {
    flexDirection: 'row',
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
    backgroundColor: '#FEF2F2',
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
  listContent: {
    padding: spacing.md,
    paddingBottom: 150
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    padding: spacing.md
  },
  cardContent: {
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
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm
  },
  infoCol: {
    flex: 1,
    minWidth: 0
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2
  },
  usernameText: {
    ...typography.cardTitle,
    flex: 1
  },
  nameText: {
    ...typography.caption
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2
  },
  phoneText: {
    fontSize: 11,
    color: colors.textSecondary
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
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
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  eyeBtn: {
    width: 46,
    height: 46,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderLeftWidth: 0,
    borderColor: colors.border,
    borderTopRightRadius: radius.md,
    borderBottomRightRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center'
  },
  roleBtn: {
    flex: 1,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center'
  },
  roleBtnActive: {
    backgroundColor: '#FEF2F2',
    borderColor: colors.primary
  },
  roleBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary
  },
  roleBtnTextActive: {
    color: colors.primary,
    fontWeight: '700'
  },
  roleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4
  },
  roleGridBtn: {
    flexGrow: 1,
    flexBasis: '30%',
    minWidth: 80,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4
  },
  roleGridBtnActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary
  },
  roleGridBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary
  },
  roleGridBtnTextActive: {
    color: colors.primary,
    fontWeight: '700'
  },
  jabatanPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
    flexShrink: 0
  },
  jabatanPillText: {
    fontSize: 11,
    fontWeight: '700'
  }
})
