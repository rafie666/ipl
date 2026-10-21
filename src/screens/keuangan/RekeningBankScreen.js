import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  Image,
  Platform
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import {
  CreditCard,
  QrCode,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Upload,
  Search,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react-native'
import { useApp } from '../../context/AppContext'
import AppHeader from '../../components/layout/AppHeader'
import AppButton from '../../components/shared/AppButton'
import AppModal from '../../components/modals/AppModal'
import { colors, spacing, radius, typography } from '../../utils/theme'

export default function RekeningBankScreen({ navigation }) {
  const {
    currentUser,
    currentRT,
    currentRW,
    isWarga,
    isAdmin,
    isRT,
    isRW,
    isBendahara,
    isPengurus,
    officialJabatan,
    userRtId,
    userRwId,
    scopedRts,
    rts = [],
    rws = [],
    bankAccounts = [],
    addBankAccount,
    updateBankAccount,
    deleteBankAccount,
    qrisAccounts = [],
    addQrisAccount,
    updateQrisAccount,
    deleteQrisAccount
  } = useApp()

  const [activeTab, setActiveTab] = useState('bank') // 'bank' | 'qris'
  const [searchQuery, setSearchQuery] = useState('')

  // State: Tambah Bank
  const [modalAddBank, setModalAddBank] = useState(false)
  const [newBankOwnerType, setNewBankOwnerType] = useState('RT')
  const [newBankRtId, setNewBankRtId] = useState('rt-01-01')
  const [newBankRwId, setNewBankRwId] = useState('rw-01')
  const [newBankName, setNewBankName] = useState('BCA')
  const [newAccNumber, setNewAccNumber] = useState('')
  const [newAccHolder, setNewAccHolder] = useState('')
  const [newIsPrimaryBank, setNewIsPrimaryBank] = useState(false)

  // State: Edit Bank
  const [modalEditBank, setModalEditBank] = useState(false)
  const [editingBank, setEditingBank] = useState(null)
  const [editBankOwnerType, setEditBankOwnerType] = useState('RT')
  const [editBankRtId, setEditBankRtId] = useState('rt-01-01')
  const [editBankRwId, setEditBankRwId] = useState('rw-01')
  const [editBankName, setEditBankName] = useState('BCA')
  const [editAccNumber, setEditAccNumber] = useState('')
  const [editAccHolder, setEditAccHolder] = useState('')
  const [editIsPrimaryBank, setEditIsPrimaryBank] = useState(false)

  // State: Tambah QRIS
  const [modalAddQris, setModalAddQris] = useState(false)
  const [newQrisOwnerType, setNewQrisOwnerType] = useState('RT')
  const [newQrisRtId, setNewQrisRtId] = useState('rt-01-01')
  const [newQrisRwId, setNewQrisRwId] = useState('rw-01')
  const [newQrisName, setNewQrisName] = useState('')
  const [newQrisNmid, setNewQrisNmid] = useState('')
  const [newQrisImageUrl, setNewQrisImageUrl] = useState('')
  const [newIsPrimaryQris, setNewIsPrimaryQris] = useState(false)

  // State: Edit QRIS
  const [modalEditQris, setModalEditQris] = useState(false)
  const [editingQris, setEditingQris] = useState(null)
  const [editQrisOwnerType, setEditQrisOwnerType] = useState('RT')
  const [editQrisRtId, setEditQrisRtId] = useState('rt-01-01')
  const [editQrisRwId, setEditQrisRwId] = useState('rw-01')
  const [editQrisName, setEditQrisName] = useState('')
  const [editQrisNmid, setEditQrisNmid] = useState('')
  const [editQrisImageUrl, setEditQrisImageUrl] = useState('')
  const [editIsPrimaryQris, setEditIsPrimaryQris] = useState(false)

  // QRIS Image Picking & Preview
  const [qrisImageTarget, setQrisImageTarget] = useState('add')
  const [modalPreviewQris, setModalPreviewQris] = useState(false)
  const [previewQrisData, setPreviewQrisData] = useState(null)

  // Identifikasi Wilayah Aktif Pengguna
  const activeUserRwId = userRwId || currentUser?.rw_id || currentRW?.id || 'rw-01'
  const activeUserRtId = userRtId || currentUser?.rt_id || currentRT?.id || 'rt-01-01'

  // Daftar RT yang dapat diakses oleh user ini
  const availableRtsForUser = (isRW && !isAdmin && !isBendahara)
    ? (scopedRts?.length ? scopedRts : rts.filter((r) => r.rw_id === activeUserRwId))
    : rts

  // Wewenang Tambah Akun
  const canCreateAccount = !isWarga && (isAdmin || isBendahara || isRW || isRT || officialJabatan === 'bendahara' || officialJabatan === 'admin' || officialJabatan === 'rw' || officialJabatan === 'rt')

  // Wewenang Kelola (Update / Delete) Akun
  const canManageAccount = (item) => {
    if (!item || isWarga) return false
    if (isAdmin || isBendahara || officialJabatan === 'bendahara' || officialJabatan === 'admin') return true

    if (isRW || officialJabatan === 'rw') {
      if (item.owner_type === 'RW') {
        return !item.owner_id || item.owner_id === 'RW' || item.owner_id === activeUserRwId
      }
      if (item.owner_type === 'RT') {
        const rtObj = rts.find((r) => r.id === item.owner_id)
        if (rtObj) return rtObj.rw_id === activeUserRwId
        const rwNum = (activeUserRwId || 'rw-01').replace('rw-', '')
        return item.owner_id?.startsWith(`rt-${rwNum}-`) || item.owner_id?.includes(activeUserRwId)
      }
      return false
    }

    if (isRT || officialJabatan === 'rt') {
      return item.owner_type === 'RT' && item.owner_id === activeUserRtId
    }

    return false
  }

  // Filter wilayah
  const isAccountInRwTerritory = (acc, rwId) => {
    if (!acc) return false
    if (acc.owner_type === 'RW') {
      return !acc.owner_id || acc.owner_id === 'RW' || acc.owner_id === rwId
    }
    if (acc.owner_type === 'RT') {
      const rtObj = rts.find((r) => r.id === acc.owner_id)
      if (rtObj) return rtObj.rw_id === rwId
      const rwNum = (rwId || 'rw-01').replace('rw-', '')
      return acc.owner_id?.startsWith(`rt-${rwNum}-`) || acc.owner_id?.includes(rwId)
    }
    return false
  }

  const isAccountInRtTerritory = (acc, rtId) => {
    if (!acc) return false
    return acc.owner_type === 'RT' && acc.owner_id === rtId
  }

  // Filter list akun bank & QRIS sesuai wilayah
  const displayedBankAccounts = (isAdmin || isBendahara)
    ? bankAccounts
    : (isRW)
    ? bankAccounts.filter((b) => isAccountInRwTerritory(b, activeUserRwId))
    : (isRT || isWarga)
    ? bankAccounts.filter((b) => isAccountInRtTerritory(b, activeUserRtId) || isAccountInRwTerritory(b, activeUserRwId))
    : bankAccounts

  const displayedQrisAccounts = (isAdmin || isBendahara)
    ? qrisAccounts
    : (isRW)
    ? qrisAccounts.filter((q) => isAccountInRwTerritory(q, activeUserRwId))
    : (isRT || isWarga)
    ? qrisAccounts.filter((q) => isAccountInRtTerritory(q, activeUserRtId) || isAccountInRwTerritory(q, activeUserRwId))
    : qrisAccounts

  // Filter pencarian
  const filteredBanks = displayedBankAccounts.filter((b) => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return true
    return (
      b.bank_name?.toLowerCase().includes(q) ||
      b.account_number?.toLowerCase().includes(q) ||
      b.account_holder?.toLowerCase().includes(q)
    )
  })

  const filteredQris = displayedQrisAccounts.filter((qItem) => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return true
    return (
      qItem.qris_name?.toLowerCase().includes(q) ||
      qItem.nmid?.toLowerCase().includes(q)
    )
  })

  const getAccountOwnerLabel = (item) => {
    if (!item) return ''
    if (item.owner_type === 'RW') {
      const rwObj = rws.find((r) => r.id === item.owner_id)
      return rwObj?.name || 'Kas RW'
    }
    if (item.owner_type === 'RT') {
      const rtObj = rts.find((r) => r.id === item.owner_id)
      return rtObj?.name || 'Kas RT'
    }
    if (item.owner_type === 'ALL') {
      return 'Kas Gabungan (Pusat)'
    }
    return `Kas ${item.owner_type}`
  }

  const openModalAddBank = () => {
    if (isRT) {
      setNewBankOwnerType('RT')
      setNewBankRtId(activeUserRtId)
    } else if (isRW) {
      setNewBankOwnerType('RW')
      setNewBankRtId(availableRtsForUser[0]?.id || activeUserRtId)
    } else {
      setNewBankOwnerType('RW')
      setNewBankRtId(rts[0]?.id || 'rt-01-01')
    }
    setNewBankRwId(activeUserRwId)
    setNewBankName('BCA')
    setNewAccNumber('')
    setNewAccHolder('')
    setNewIsPrimaryBank(false)
    setModalAddBank(true)
  }

  const openModalAddQris = () => {
    if (isRT) {
      setNewQrisOwnerType('RT')
      setNewQrisRtId(activeUserRtId)
    } else if (isRW) {
      setNewQrisOwnerType('RW')
      setNewQrisRtId(availableRtsForUser[0]?.id || activeUserRtId)
    } else {
      setNewQrisOwnerType('RW')
      setNewQrisRtId(rts[0]?.id || 'rt-01-01')
    }
    setNewQrisRwId(activeUserRwId)
    setNewQrisName('')
    setNewQrisNmid('')
    setNewQrisImageUrl('')
    setNewIsPrimaryQris(false)
    setModalAddQris(true)
  }

  const openModalEditBank = (b) => {
    if (!canManageAccount(b)) {
      Alert.alert('Akses Terbatas', 'Anda tidak memiliki wewenang untuk mengubah rekening di luar wilayah tugas Anda.')
      return
    }
    setEditingBank(b)
    setEditBankOwnerType(b.owner_type || 'RT')
    setEditBankRtId(b.owner_id || activeUserRtId)
    setEditBankRwId(b.owner_id || activeUserRwId)
    setEditBankName(b.bank_name || 'BCA')
    setEditAccNumber(b.account_number || '')
    setEditAccHolder(b.account_holder || '')
    setEditIsPrimaryBank(Boolean(b.is_primary))
    setModalEditBank(true)
  }

  const openModalEditQris = (q) => {
    if (!canManageAccount(q)) {
      Alert.alert('Akses Terbatas', 'Anda tidak memiliki wewenang untuk mengubah barcode QRIS di luar wilayah tugas Anda.')
      return
    }
    setEditingQris(q)
    setEditQrisOwnerType(q.owner_type || 'RT')
    setEditQrisRtId(q.owner_id || activeUserRtId)
    setEditQrisRwId(q.owner_id || activeUserRwId)
    setEditQrisName(q.qris_name || '')
    setEditQrisNmid(q.nmid || '')
    setEditQrisImageUrl(q.image_url || '')
    setEditIsPrimaryQris(Boolean(q.is_primary))
    setModalEditQris(true)
  }

  const handleTambahBank = async () => {
    if (!newBankName.trim() || !newAccNumber.trim() || !newAccHolder.trim()) {
      Alert.alert('Perhatian', 'Nama bank, nomor rekening, dan pemilik rekening wajib diisi!')
      return
    }
    let finalOwnerType = newBankOwnerType
    let finalOwnerId = newBankRtId

    if (isRT) {
      finalOwnerType = 'RT'
      finalOwnerId = activeUserRtId
    } else if (isRW) {
      if (finalOwnerType === 'RW') {
        finalOwnerId = activeUserRwId
      } else {
        finalOwnerType = 'RT'
        finalOwnerId = newBankRtId || availableRtsForUser[0]?.id || activeUserRtId
      }
    } else {
      if (finalOwnerType === 'RW') {
        finalOwnerId = newBankRwId || activeUserRwId
      } else {
        finalOwnerType = 'RT'
        finalOwnerId = newBankRtId || rts[0]?.id || 'rt-01-01'
      }
    }

    const res = await addBankAccount({
      owner_type: finalOwnerType,
      owner_id: finalOwnerId,
      bank_name: newBankName.trim().toUpperCase(),
      account_number: newAccNumber.trim(),
      account_holder: newAccHolder.trim(),
      is_primary: newIsPrimaryBank,
      is_active: true
    })
    if (res?.success === false) {
      Alert.alert('Gagal', res.message || 'Tidak dapat menambahkan rekening bank.')
      return
    }
    setNewAccNumber('')
    setNewAccHolder('')
    setNewIsPrimaryBank(false)
    setModalAddBank(false)
    Alert.alert('Sukses', 'Rekening bank berhasil ditambahkan!')
  }

  const handleSimpanEditBank = async () => {
    if (!editingBank) return
    if (!editBankName.trim() || !editAccNumber.trim() || !editAccHolder.trim()) {
      Alert.alert('Perhatian', 'Nama bank, nomor rekening, dan pemilik wajib diisi!')
      return
    }
    let finalOwnerType = editBankOwnerType
    let finalOwnerId = editBankRtId

    if (isRT) {
      finalOwnerType = 'RT'
      finalOwnerId = activeUserRtId
    } else if (isRW) {
      if (finalOwnerType === 'RW') {
        finalOwnerId = activeUserRwId
      } else {
        finalOwnerType = 'RT'
        finalOwnerId = editBankRtId || availableRtsForUser[0]?.id || activeUserRtId
      }
    } else {
      if (finalOwnerType === 'RW') {
        finalOwnerId = editBankRwId || activeUserRwId
      } else {
        finalOwnerType = 'RT'
        finalOwnerId = editBankRtId || rts[0]?.id || 'rt-01-01'
      }
    }

    const res = await updateBankAccount(editingBank.id, {
      owner_type: finalOwnerType,
      owner_id: finalOwnerId,
      bank_name: editBankName.trim().toUpperCase(),
      account_number: editAccNumber.trim(),
      account_holder: editAccHolder.trim(),
      is_primary: editIsPrimaryBank
    })
    if (res?.success === false) {
      Alert.alert('Gagal', res.message || 'Tidak dapat mengubah rekening bank.')
      return
    }
    setModalEditBank(false)
    setEditingBank(null)
    Alert.alert('Sukses', 'Data rekening berhasil diperbarui!')
  }

  const handleHapusBank = (b) => {
    if (!canManageAccount(b)) {
      Alert.alert('Akses Terbatas', 'Anda tidak memiliki wewenang untuk menghapus rekening ini.')
      return
    }
    Alert.alert('Hapus Rekening', 'Hapus rekening ' + b.bank_name + ' (' + b.account_number + ')?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          const res = await deleteBankAccount(b.id)
          if (res?.success === false) {
            Alert.alert('Gagal', res.message || 'Gagal menghapus rekening.')
          }
        }
      }
    ])
  }

  const handleTambahQris = async () => {
    if (!newQrisName.trim()) {
      Alert.alert('Perhatian', 'Nama QRIS wajib diisi!')
      return
    }
    let finalOwnerType = newQrisOwnerType
    let finalOwnerId = newQrisRtId

    if (isRT) {
      finalOwnerType = 'RT'
      finalOwnerId = activeUserRtId
    } else if (isRW) {
      if (finalOwnerType === 'RW') {
        finalOwnerId = activeUserRwId
      } else {
        finalOwnerType = 'RT'
        finalOwnerId = newQrisRtId || availableRtsForUser[0]?.id || activeUserRtId
      }
    } else {
      if (finalOwnerType === 'RW') {
        finalOwnerId = newQrisRwId || activeUserRwId
      } else {
        finalOwnerType = 'RT'
        finalOwnerId = newQrisRtId || rts[0]?.id || 'rt-01-01'
      }
    }

    const res = await addQrisAccount({
      owner_type: finalOwnerType,
      owner_id: finalOwnerId,
      qris_name: newQrisName.trim(),
      nmid: newQrisNmid.trim(),
      image_url: newQrisImageUrl,
      is_primary: newIsPrimaryQris,
      is_active: true
    })
    if (res?.success === false) {
      Alert.alert('Gagal', res.message || 'Tidak dapat menambahkan QRIS.')
      return
    }
    setNewQrisName('')
    setNewQrisNmid('')
    setNewQrisImageUrl('')
    setNewIsPrimaryQris(false)
    setModalAddQris(false)
    Alert.alert('Sukses', 'QRIS berhasil ditambahkan!')
  }

  const handleSimpanEditQris = async () => {
    if (!editingQris) return
    if (!editQrisName.trim()) {
      Alert.alert('Perhatian', 'Nama QRIS wajib diisi!')
      return
    }
    let finalOwnerType = editQrisOwnerType
    let finalOwnerId = editQrisRtId

    if (isRT) {
      finalOwnerType = 'RT'
      finalOwnerId = activeUserRtId
    } else if (isRW) {
      if (finalOwnerType === 'RW') {
        finalOwnerId = activeUserRwId
      } else {
        finalOwnerType = 'RT'
        finalOwnerId = editQrisRtId || availableRtsForUser[0]?.id || activeUserRtId
      }
    } else {
      if (finalOwnerType === 'RW') {
        finalOwnerId = editQrisRwId || activeUserRwId
      } else {
        finalOwnerType = 'RT'
        finalOwnerId = editQrisRtId || rts[0]?.id || 'rt-01-01'
      }
    }

    const res = await updateQrisAccount(editingQris.id, {
      owner_type: finalOwnerType,
      owner_id: finalOwnerId,
      qris_name: editQrisName.trim(),
      nmid: editQrisNmid.trim(),
      image_url: editQrisImageUrl,
      is_primary: editIsPrimaryQris
    })
    if (res?.success === false) {
      Alert.alert('Gagal', res.message || 'Tidak dapat memperbarui QRIS.')
      return
    }
    setModalEditQris(false)
    setEditingQris(null)
    Alert.alert('Sukses', 'Data QRIS berhasil diperbarui!')
  }

  const handleHapusQris = (q) => {
    if (!canManageAccount(q)) {
      Alert.alert('Akses Terbatas', 'Anda tidak memiliki wewenang untuk menghapus QRIS ini.')
      return
    }
    Alert.alert('Hapus QRIS', 'Hapus barcode ' + q.qris_name + '?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          const res = await deleteQrisAccount(q.id)
          if (res?.success === false) {
            Alert.alert('Gagal', res.message || 'Gagal menghapus QRIS.')
          }
        }
      }
    ])
  }

  const handlePickFromGallery = () => {
    setTimeout(async () => {
      try {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
        if (status !== 'granted') {
          Alert.alert('Izin Dibutuhkan', 'Aplikasi membutuhkan izin akses galeri foto.')
          return
        }
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: false,
          quality: 0.85,
          base64: true
        })
        if (!result.canceled && result.assets && result.assets.length > 0) {
          const asset = result.assets[0]
          const imagePayload = asset.base64
            ? (asset.base64.startsWith('data:') ? asset.base64 : 'data:image/jpeg;base64,' + asset.base64)
            : asset.uri
          if (qrisImageTarget === 'edit') setEditQrisImageUrl(imagePayload)
          else setNewQrisImageUrl(imagePayload)
        }
      } catch (err) {
        Alert.alert('Error', err.message || 'Gagal memilih foto.')
      }
    }, 250)
  }

  const pageSubtitle = isWarga
    ? 'Informasi saluran rekening & QRIS resmi kas RT & RW'
    : isAdmin || isBendahara
    ? 'Kelola semua rekening bank & QRIS (Akses Penuh)'
    : isRW
    ? `Kelola rekening & QRIS ${currentRW?.name || 'RW'} serta RT wilayahnya`
    : `Kelola rekening & QRIS ${currentRT?.name || 'RT Anda'}`

  return (
    <View style={styles.container}>
      <AppHeader
        title="Rekening & QRIS"
        subtitle={pageSubtitle}
        navigation={navigation}
        variant="surface"
      />

      <View style={styles.content}>
        {/* Search Bar */}
        <View style={styles.searchBox}>
          <Search size={16} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder={activeTab === 'bank' ? 'Cari nama bank, rekening, pemilik...' : 'Cari label QRIS, NMID...'}
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'bank' && styles.tabBtnActive]}
            onPress={() => setActiveTab('bank')}
            activeOpacity={0.7}
          >
            <CreditCard size={16} color={activeTab === 'bank' ? '#2563EB' : '#64748B'} />
            <Text style={[styles.tabBtnText, activeTab === 'bank' && styles.tabBtnTextActive]}>
              Rekening Bank ({displayedBankAccounts.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'qris' && styles.tabBtnActive]}
            onPress={() => setActiveTab('qris')}
            activeOpacity={0.7}
          >
            <QrCode size={16} color={activeTab === 'qris' ? '#7C3AED' : '#64748B'} />
            <Text style={[styles.tabBtnText, activeTab === 'qris' && styles.tabBtnTextActive]}>
              Barcode QRIS ({displayedQrisAccounts.length})
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120, paddingTop: 6 }}
        >
          {activeTab === 'bank' ? (
            <View style={{ gap: 10 }}>
              {filteredBanks.length === 0 ? (
                <View style={styles.emptyCard}>
                  <CreditCard size={38} color="#94A3B8" />
                  <Text style={styles.emptyTitle}>Belum Ada Rekening Bank</Text>
                  <Text style={styles.emptySubtitle}>
                    {searchQuery
                      ? 'Tidak ada rekening yang sesuai dengan kata kunci pencarian.'
                      : 'Rekening bank resmi di wilayah ini belum ditambahkan.'}
                  </Text>
                </View>
              ) : (
                filteredBanks.map((b) => {
                  const isManageable = canManageAccount(b)
                  const ownerLabel = getAccountOwnerLabel(b)
                  return (
                    <View key={b.id} style={styles.cardItem}>
                      <View style={styles.cardIconWrap}>
                        <CreditCard size={20} color={colors.primary} />
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <Text style={styles.cardTitle}>{b.bank_name}</Text>
                          {b.is_primary && (
                            <View style={styles.primaryBadge}>
                              <Text style={styles.primaryBadgeText}>Utama</Text>
                            </View>
                          )}
                          <View
                            style={[
                              styles.ownerBadge,
                              { backgroundColor: b.owner_type === 'RW' ? '#EFF6FF' : '#F0FDF4' }
                            ]}
                          >
                            <Text
                              style={[
                                styles.ownerBadgeText,
                                { color: b.owner_type === 'RW' ? '#2563EB' : '#16A34A' }
                              ]}
                            >
                              {ownerLabel}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.cardAccNo}>{b.account_number}</Text>
                        <Text style={styles.cardHolder}>{'a.n ' + b.account_holder}</Text>
                      </View>
                      {isManageable ? (
                        <View style={{ flexDirection: 'row', gap: 4 }}>
                          <TouchableOpacity
                            style={styles.iconMiniBtn}
                            onPress={() => openModalEditBank(b)}
                          >
                            <Edit2 size={13} color={colors.primary} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.iconMiniBtn, { backgroundColor: '#FEF2F2' }]}
                            onPress={() => handleHapusBank(b)}
                          >
                            <Trash2 size={13} color="#DC2626" />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <View style={styles.readOnlyBadge}>
                          <Text style={styles.readOnlyText}>Lihat Saja</Text>
                        </View>
                      )}
                    </View>
                  )
                })
              )}

              {canCreateAccount && (
                <AppButton
                  title="Tambah Rekening Bank"
                  variant="primary"
                  icon={<Plus size={16} color="#FFFFFF" />}
                  onPress={openModalAddBank}
                  style={{ marginTop: 8 }}
                />
              )}
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {filteredQris.length === 0 ? (
                <View style={styles.emptyCard}>
                  <QrCode size={38} color="#94A3B8" />
                  <Text style={styles.emptyTitle}>Belum Ada Barcode QRIS</Text>
                  <Text style={styles.emptySubtitle}>
                    {searchQuery
                      ? 'Tidak ada barcode QRIS yang cocok dengan pencarian.'
                      : 'Barcode QRIS resmi belum terdaftar di wilayah ini.'}
                  </Text>
                </View>
              ) : (
                filteredQris.map((qItem) => {
                  const isManageable = canManageAccount(qItem)
                  const ownerLabel = getAccountOwnerLabel(qItem)
                  return (
                    <View key={qItem.id} style={styles.cardItem}>
                      <View style={[styles.cardIconWrap, { backgroundColor: '#FAF5FF' }]}>
                        <QrCode size={20} color="#7C3AED" />
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <Text style={styles.cardTitle}>{qItem.qris_name}</Text>
                          {qItem.is_primary && (
                            <View style={styles.primaryBadge}>
                              <Text style={styles.primaryBadgeText}>Utama</Text>
                            </View>
                          )}
                          <View
                            style={[
                              styles.ownerBadge,
                              { backgroundColor: qItem.owner_type === 'RW' ? '#EFF6FF' : '#F0FDF4' }
                            ]}
                          >
                            <Text
                              style={[
                                styles.ownerBadgeText,
                                { color: qItem.owner_type === 'RW' ? '#2563EB' : '#16A34A' }
                              ]}
                            >
                              {ownerLabel}
                            </Text>
                          </View>
                        </View>
                        {qItem.nmid ? <Text style={styles.cardAccNo}>{'NMID: ' + qItem.nmid}</Text> : null}
                      </View>
                      <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
                        {qItem.image_url ? (
                          <TouchableOpacity
                            style={styles.iconMiniBtn}
                            onPress={() => {
                              setPreviewQrisData(qItem)
                              setModalPreviewQris(true)
                            }}
                          >
                            <Eye size={13} color={colors.primary} />
                          </TouchableOpacity>
                        ) : null}
                        {isManageable ? (
                          <>
                            <TouchableOpacity
                              style={styles.iconMiniBtn}
                              onPress={() => openModalEditQris(qItem)}
                            >
                              <Edit2 size={13} color={colors.primary} />
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.iconMiniBtn, { backgroundColor: '#FEF2F2' }]}
                              onPress={() => handleHapusQris(qItem)}
                            >
                              <Trash2 size={13} color="#DC2626" />
                            </TouchableOpacity>
                          </>
                        ) : (
                          <View style={styles.readOnlyBadge}>
                            <Text style={styles.readOnlyText}>Lihat Saja</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  )
                })
              )}

              {canCreateAccount && (
                <AppButton
                  title="Tambah Barcode QRIS"
                  variant="primary"
                  icon={<Plus size={16} color="#FFFFFF" />}
                  onPress={openModalAddQris}
                  style={{ marginTop: 8 }}
                />
              )}
            </View>
          )}
        </ScrollView>
      </View>

      {/* MODAL TAMBAH BANK */}
      <AppModal
        visible={modalAddBank}
        title="Tambah Rekening Bank"
        onClose={() => setModalAddBank(false)}
        footer={
          <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
            <View style={{ flex: 1 }}>
              <AppButton title="Batal" variant="secondary" onPress={() => setModalAddBank(false)} />
            </View>
            <View style={{ flex: 1 }}>
              <AppButton title="Simpan" variant="primary" onPress={handleTambahBank} />
            </View>
          </View>
        }
      >
        <View style={{ gap: 10 }}>
          {isRT ? (
            <View style={styles.ownerNoticeBox}>
              <Text style={styles.ownerNoticeLabel}>Wilayah Wewenang Anda:</Text>
              <Text style={styles.ownerNoticeValue}>Kas {currentRT?.name || 'RT Anda'} (Terkunci)</Text>
            </View>
          ) : isRW ? (
            <View style={{ gap: 6 }}>
              <Text style={styles.inputLabelBold}>Tingkat Pemilik Rekening</Text>
              <View style={styles.pillSelectorRow}>
                <TouchableOpacity
                  style={[styles.pillBtn, newBankOwnerType === 'RW' && styles.pillBtnActive]}
                  onPress={() => setNewBankOwnerType('RW')}
                >
                  <Text style={[styles.pillBtnText, newBankOwnerType === 'RW' && styles.pillBtnTextActive]}>
                    Kas {currentRW?.name || 'RW'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.pillBtn, newBankOwnerType === 'RT' && styles.pillBtnActive]}
                  onPress={() => {
                    setNewBankOwnerType('RT')
                    if (!newBankRtId && availableRtsForUser.length > 0) {
                      setNewBankRtId(availableRtsForUser[0].id)
                    }
                  }}
                >
                  <Text style={[styles.pillBtnText, newBankOwnerType === 'RT' && styles.pillBtnTextActive]}>
                    Kas RT di Wilayah RW
                  </Text>
                </TouchableOpacity>
              </View>
              {newBankOwnerType === 'RT' && (
                <View style={{ gap: 6, marginTop: 4 }}>
                  <Text style={[styles.inputLabelBold, { fontSize: 11 }]}>Pilih RT di Bawah Wilayah RW Anda *</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
                    {availableRtsForUser.map((r) => (
                      <TouchableOpacity
                        key={r.id}
                        style={[styles.pillBtn, newBankRtId === r.id && styles.pillBtnActive, { marginRight: 6 }]}
                        onPress={() => setNewBankRtId(r.id)}
                      >
                        <Text style={[styles.pillBtnText, newBankRtId === r.id && styles.pillBtnTextActive]}>
                          {r.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          ) : (
            <View style={{ gap: 6 }}>
              <Text style={styles.inputLabelBold}>Tingkat Pemilik Rekening (Akses Penuh)</Text>
              <View style={styles.pillSelectorRow}>
                {['RT', 'RW'].map((ow) => (
                  <TouchableOpacity
                    key={ow}
                    style={[styles.pillBtn, newBankOwnerType === ow && styles.pillBtnActive]}
                    onPress={() => setNewBankOwnerType(ow)}
                  >
                    <Text style={[styles.pillBtnText, newBankOwnerType === ow && styles.pillBtnTextActive]}>
                      {'Kas ' + ow}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {newBankOwnerType === 'RW' && rws.length > 1 && (
                <View style={{ gap: 6, marginTop: 4 }}>
                  <Text style={[styles.inputLabelBold, { fontSize: 11 }]}>Pilih RW *</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
                    {rws.map((rw) => (
                      <TouchableOpacity
                        key={rw.id}
                        style={[styles.pillBtn, newBankRwId === rw.id && styles.pillBtnActive, { marginRight: 6 }]}
                        onPress={() => setNewBankRwId(rw.id)}
                      >
                        <Text style={[styles.pillBtnText, newBankRwId === rw.id && styles.pillBtnTextActive]}>
                          {rw.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
              {newBankOwnerType === 'RT' && (
                <View style={{ gap: 6, marginTop: 4 }}>
                  <Text style={[styles.inputLabelBold, { fontSize: 11 }]}>Pilih RT *</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
                    {rts.map((r) => (
                      <TouchableOpacity
                        key={r.id}
                        style={[styles.pillBtn, newBankRtId === r.id && styles.pillBtnActive, { marginRight: 6 }]}
                        onPress={() => setNewBankRtId(r.id)}
                      >
                        <Text style={[styles.pillBtnText, newBankRtId === r.id && styles.pillBtnTextActive]}>
                          {r.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          )}

          <Text style={styles.inputLabelBold}>Nama Bank *</Text>
          <TextInput
            style={styles.modalInput}
            value={newBankName}
            onChangeText={setNewBankName}
            placeholder="Contoh: BCA, Mandiri, BRI"
            placeholderTextColor={colors.textSecondary}
          />
          <Text style={styles.inputLabelBold}>Nomor Rekening *</Text>
          <TextInput
            style={styles.modalInput}
            keyboardType="numeric"
            value={newAccNumber}
            onChangeText={setNewAccNumber}
            placeholder="Contoh: 1234567890"
            placeholderTextColor={colors.textSecondary}
          />
          <Text style={styles.inputLabelBold}>Atas Nama Pemilik *</Text>
          <TextInput
            style={styles.modalInput}
            value={newAccHolder}
            onChangeText={setNewAccHolder}
            placeholder="Nama Pemilik Rekening"
            placeholderTextColor={colors.textSecondary}
          />
          <View style={styles.switchRow}>
            <Text style={styles.inputLabelBold}>Jadikan Rekening Utama</Text>
            <Switch
              value={newIsPrimaryBank}
              onValueChange={setNewIsPrimaryBank}
              trackColor={{ false: '#CBD5E1', true: colors.primary }}
            />
          </View>
        </View>
      </AppModal>

      {/* MODAL EDIT BANK */}
      <AppModal
        visible={modalEditBank}
        title="Edit Rekening Bank"
        onClose={() => setModalEditBank(false)}
        footer={
          <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
            <View style={{ flex: 1 }}>
              <AppButton title="Batal" variant="secondary" onPress={() => setModalEditBank(false)} />
            </View>
            <View style={{ flex: 1 }}>
              <AppButton title="Simpan" variant="primary" onPress={handleSimpanEditBank} />
            </View>
          </View>
        }
      >
        <View style={{ gap: 10 }}>
          {isRT ? (
            <View style={styles.ownerNoticeBox}>
              <Text style={styles.ownerNoticeLabel}>Wilayah Wewenang Anda:</Text>
              <Text style={styles.ownerNoticeValue}>Kas {currentRT?.name || 'RT Anda'} (Terkunci)</Text>
            </View>
          ) : isRW ? (
            <View style={{ gap: 6 }}>
              <Text style={styles.inputLabelBold}>Tingkat Pemilik Rekening</Text>
              <View style={styles.pillSelectorRow}>
                <TouchableOpacity
                  style={[styles.pillBtn, editBankOwnerType === 'RW' && styles.pillBtnActive]}
                  onPress={() => setEditBankOwnerType('RW')}
                >
                  <Text style={[styles.pillBtnText, editBankOwnerType === 'RW' && styles.pillBtnTextActive]}>
                    Kas {currentRW?.name || 'RW'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.pillBtn, editBankOwnerType === 'RT' && styles.pillBtnActive]}
                  onPress={() => {
                    setEditBankOwnerType('RT')
                    if (!editBankRtId && availableRtsForUser.length > 0) {
                      setEditBankRtId(availableRtsForUser[0].id)
                    }
                  }}
                >
                  <Text style={[styles.pillBtnText, editBankOwnerType === 'RT' && styles.pillBtnTextActive]}>
                    Kas RT di Wilayah RW
                  </Text>
                </TouchableOpacity>
              </View>
              {editBankOwnerType === 'RT' && (
                <View style={{ gap: 6, marginTop: 4 }}>
                  <Text style={[styles.inputLabelBold, { fontSize: 11 }]}>Pilih RT di Bawah Wilayah RW Anda *</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
                    {availableRtsForUser.map((r) => (
                      <TouchableOpacity
                        key={r.id}
                        style={[styles.pillBtn, editBankRtId === r.id && styles.pillBtnActive, { marginRight: 6 }]}
                        onPress={() => setEditBankRtId(r.id)}
                      >
                        <Text style={[styles.pillBtnText, editBankRtId === r.id && styles.pillBtnTextActive]}>
                          {r.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          ) : (
            <View style={{ gap: 6 }}>
              <Text style={styles.inputLabelBold}>Tingkat Pemilik Rekening (Akses Penuh)</Text>
              <View style={styles.pillSelectorRow}>
                {['RT', 'RW'].map((ow) => (
                  <TouchableOpacity
                    key={ow}
                    style={[styles.pillBtn, editBankOwnerType === ow && styles.pillBtnActive]}
                    onPress={() => setEditBankOwnerType(ow)}
                  >
                    <Text style={[styles.pillBtnText, editBankOwnerType === ow && styles.pillBtnTextActive]}>
                      {'Kas ' + ow}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {editBankOwnerType === 'RW' && rws.length > 1 && (
                <View style={{ gap: 6, marginTop: 4 }}>
                  <Text style={[styles.inputLabelBold, { fontSize: 11 }]}>Pilih RW *</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
                    {rws.map((rw) => (
                      <TouchableOpacity
                        key={rw.id}
                        style={[styles.pillBtn, editBankRwId === rw.id && styles.pillBtnActive, { marginRight: 6 }]}
                        onPress={() => setEditBankRwId(rw.id)}
                      >
                        <Text style={[styles.pillBtnText, editBankRwId === rw.id && styles.pillBtnTextActive]}>
                          {rw.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
              {editBankOwnerType === 'RT' && (
                <View style={{ gap: 6, marginTop: 4 }}>
                  <Text style={[styles.inputLabelBold, { fontSize: 11 }]}>Pilih RT *</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
                    {rts.map((r) => (
                      <TouchableOpacity
                        key={r.id}
                        style={[styles.pillBtn, editBankRtId === r.id && styles.pillBtnActive, { marginRight: 6 }]}
                        onPress={() => setEditBankRtId(r.id)}
                      >
                        <Text style={[styles.pillBtnText, editBankRtId === r.id && styles.pillBtnTextActive]}>
                          {r.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          )}

          <Text style={styles.inputLabelBold}>Nama Bank *</Text>
          <TextInput
            style={styles.modalInput}
            value={editBankName}
            onChangeText={setEditBankName}
          />
          <Text style={styles.inputLabelBold}>Nomor Rekening *</Text>
          <TextInput
            style={styles.modalInput}
            keyboardType="numeric"
            value={editAccNumber}
            onChangeText={setEditAccNumber}
          />
          <Text style={styles.inputLabelBold}>Atas Nama Pemilik *</Text>
          <TextInput
            style={styles.modalInput}
            value={editAccHolder}
            onChangeText={setEditAccHolder}
          />
          <View style={styles.switchRow}>
            <Text style={styles.inputLabelBold}>Rekening Utama</Text>
            <Switch
              value={editIsPrimaryBank}
              onValueChange={setEditIsPrimaryBank}
              trackColor={{ false: '#CBD5E1', true: colors.primary }}
            />
          </View>
        </View>
      </AppModal>

      {/* MODAL TAMBAH QRIS */}
      <AppModal
        visible={modalAddQris}
        title="Tambah Barcode QRIS"
        onClose={() => setModalAddQris(false)}
        footer={
          <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
            <View style={{ flex: 1 }}>
              <AppButton title="Batal" variant="secondary" onPress={() => setModalAddQris(false)} />
            </View>
            <View style={{ flex: 1 }}>
              <AppButton title="Simpan" variant="primary" onPress={handleTambahQris} />
            </View>
          </View>
        }
      >
        <View style={{ gap: 10 }}>
          {isRT ? (
            <View style={styles.ownerNoticeBox}>
              <Text style={styles.ownerNoticeLabel}>Wilayah Wewenang Anda:</Text>
              <Text style={styles.ownerNoticeValue}>Kas {currentRT?.name || 'RT Anda'} (Terkunci)</Text>
            </View>
          ) : isRW ? (
            <View style={{ gap: 6 }}>
              <Text style={styles.inputLabelBold}>Tingkat Pemilik QRIS</Text>
              <View style={styles.pillSelectorRow}>
                <TouchableOpacity
                  style={[styles.pillBtn, newQrisOwnerType === 'RW' && styles.pillBtnActive]}
                  onPress={() => setNewQrisOwnerType('RW')}
                >
                  <Text style={[styles.pillBtnText, newQrisOwnerType === 'RW' && styles.pillBtnTextActive]}>
                    Kas {currentRW?.name || 'RW'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.pillBtn, newQrisOwnerType === 'RT' && styles.pillBtnActive]}
                  onPress={() => {
                    setNewQrisOwnerType('RT')
                    if (!newQrisRtId && availableRtsForUser.length > 0) {
                      setNewQrisRtId(availableRtsForUser[0].id)
                    }
                  }}
                >
                  <Text style={[styles.pillBtnText, newQrisOwnerType === 'RT' && styles.pillBtnTextActive]}>
                    Kas RT di Wilayah RW
                  </Text>
                </TouchableOpacity>
              </View>
              {newQrisOwnerType === 'RT' && (
                <View style={{ gap: 6, marginTop: 4 }}>
                  <Text style={[styles.inputLabelBold, { fontSize: 11 }]}>Pilih RT di Bawah Wilayah RW Anda *</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
                    {availableRtsForUser.map((r) => (
                      <TouchableOpacity
                        key={r.id}
                        style={[styles.pillBtn, newQrisRtId === r.id && styles.pillBtnActive, { marginRight: 6 }]}
                        onPress={() => setNewQrisRtId(r.id)}
                      >
                        <Text style={[styles.pillBtnText, newQrisRtId === r.id && styles.pillBtnTextActive]}>
                          {r.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          ) : (
            <View style={{ gap: 6 }}>
              <Text style={styles.inputLabelBold}>Tingkat Pemilik QRIS (Akses Penuh)</Text>
              <View style={styles.pillSelectorRow}>
                {['RT', 'RW'].map((ow) => (
                  <TouchableOpacity
                    key={ow}
                    style={[styles.pillBtn, newQrisOwnerType === ow && styles.pillBtnActive]}
                    onPress={() => setNewQrisOwnerType(ow)}
                  >
                    <Text style={[styles.pillBtnText, newQrisOwnerType === ow && styles.pillBtnTextActive]}>
                      {'Kas ' + ow}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {newQrisOwnerType === 'RW' && rws.length > 1 && (
                <View style={{ gap: 6, marginTop: 4 }}>
                  <Text style={[styles.inputLabelBold, { fontSize: 11 }]}>Pilih RW *</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
                    {rws.map((rw) => (
                      <TouchableOpacity
                        key={rw.id}
                        style={[styles.pillBtn, newQrisRwId === rw.id && styles.pillBtnActive, { marginRight: 6 }]}
                        onPress={() => setNewQrisRwId(rw.id)}
                      >
                        <Text style={[styles.pillBtnText, newQrisRwId === rw.id && styles.pillBtnTextActive]}>
                          {rw.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
              {newQrisOwnerType === 'RT' && (
                <View style={{ gap: 6, marginTop: 4 }}>
                  <Text style={[styles.inputLabelBold, { fontSize: 11 }]}>Pilih RT *</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
                    {rts.map((r) => (
                      <TouchableOpacity
                        key={r.id}
                        style={[styles.pillBtn, newQrisRtId === r.id && styles.pillBtnActive, { marginRight: 6 }]}
                        onPress={() => setNewQrisRtId(r.id)}
                      >
                        <Text style={[styles.pillBtnText, newQrisRtId === r.id && styles.pillBtnTextActive]}>
                          {r.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          )}

          <Text style={styles.inputLabelBold}>Nama Label QRIS *</Text>
          <TextInput
            style={styles.modalInput}
            value={newQrisName}
            onChangeText={setNewQrisName}
            placeholder="Contoh: QRIS Kas RT 01"
            placeholderTextColor={colors.textSecondary}
          />
          <Text style={styles.inputLabelBold}>NMID (Opsional)</Text>
          <TextInput
            style={styles.modalInput}
            value={newQrisNmid}
            onChangeText={setNewQrisNmid}
            placeholder="ID Merchant QRIS"
            placeholderTextColor={colors.textSecondary}
          />
          <Text style={styles.inputLabelBold}>Foto Barcode QRIS</Text>
          <TouchableOpacity
            style={styles.uploadBox}
            onPress={() => {
              setQrisImageTarget('add')
              handlePickFromGallery()
            }}
          >
            {newQrisImageUrl ? (
              <Image source={{ uri: newQrisImageUrl }} style={{ width: 120, height: 120, borderRadius: 8 }} />
            ) : (
              <View style={{ alignItems: 'center' }}>
                <Upload size={24} color={colors.primary} />
                <Text style={styles.uploadText}>Pilih Foto Barcode QRIS</Text>
              </View>
            )}
          </TouchableOpacity>
          <View style={styles.switchRow}>
            <Text style={styles.inputLabelBold}>Jadikan QRIS Utama</Text>
            <Switch
              value={newIsPrimaryQris}
              onValueChange={setNewIsPrimaryQris}
              trackColor={{ false: '#CBD5E1', true: colors.primary }}
            />
          </View>
        </View>
      </AppModal>

      {/* MODAL EDIT QRIS */}
      <AppModal
        visible={modalEditQris}
        title="Edit Barcode QRIS"
        onClose={() => {
          setModalEditQris(false)
          setEditingQris(null)
        }}
        footer={
          <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
            <View style={{ flex: 1 }}>
              <AppButton
                title="Batal"
                variant="secondary"
                onPress={() => {
                  setModalEditQris(false)
                  setEditingQris(null)
                }}
              />
            </View>
            <View style={{ flex: 1 }}>
              <AppButton title="Simpan" variant="primary" onPress={handleSimpanEditQris} />
            </View>
          </View>
        }
      >
        <View style={{ gap: 10 }}>
          {isRT ? (
            <View style={styles.ownerNoticeBox}>
              <Text style={styles.ownerNoticeLabel}>Wilayah Wewenang Anda:</Text>
              <Text style={styles.ownerNoticeValue}>Kas {currentRT?.name || 'RT Anda'} (Terkunci)</Text>
            </View>
          ) : isRW ? (
            <View style={{ gap: 6 }}>
              <Text style={styles.inputLabelBold}>Tingkat Pemilik QRIS</Text>
              <View style={styles.pillSelectorRow}>
                <TouchableOpacity
                  style={[styles.pillBtn, editQrisOwnerType === 'RW' && styles.pillBtnActive]}
                  onPress={() => setEditQrisOwnerType('RW')}
                >
                  <Text style={[styles.pillBtnText, editQrisOwnerType === 'RW' && styles.pillBtnTextActive]}>
                    Kas {currentRW?.name || 'RW'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.pillBtn, editQrisOwnerType === 'RT' && styles.pillBtnActive]}
                  onPress={() => {
                    setEditQrisOwnerType('RT')
                    if (!editQrisRtId && availableRtsForUser.length > 0) {
                      setEditQrisRtId(availableRtsForUser[0].id)
                    }
                  }}
                >
                  <Text style={[styles.pillBtnText, editQrisOwnerType === 'RT' && styles.pillBtnTextActive]}>
                    Kas RT di Wilayah RW
                  </Text>
                </TouchableOpacity>
              </View>
              {editQrisOwnerType === 'RT' && (
                <View style={{ gap: 6, marginTop: 4 }}>
                  <Text style={[styles.inputLabelBold, { fontSize: 11 }]}>Pilih RT di Bawah Wilayah RW Anda *</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
                    {availableRtsForUser.map((r) => (
                      <TouchableOpacity
                        key={r.id}
                        style={[styles.pillBtn, editQrisRtId === r.id && styles.pillBtnActive, { marginRight: 6 }]}
                        onPress={() => setEditQrisRtId(r.id)}
                      >
                        <Text style={[styles.pillBtnText, editQrisRtId === r.id && styles.pillBtnTextActive]}>
                          {r.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          ) : (
            <View style={{ gap: 6 }}>
              <Text style={styles.inputLabelBold}>Tingkat Pemilik QRIS (Akses Penuh)</Text>
              <View style={styles.pillSelectorRow}>
                {['RT', 'RW'].map((ow) => (
                  <TouchableOpacity
                    key={ow}
                    style={[styles.pillBtn, editQrisOwnerType === ow && styles.pillBtnActive]}
                    onPress={() => setEditQrisOwnerType(ow)}
                  >
                    <Text style={[styles.pillBtnText, editQrisOwnerType === ow && styles.pillBtnTextActive]}>
                      {'Kas ' + ow}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {editQrisOwnerType === 'RW' && rws.length > 1 && (
                <View style={{ gap: 6, marginTop: 4 }}>
                  <Text style={[styles.inputLabelBold, { fontSize: 11 }]}>Pilih RW *</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
                    {rws.map((rw) => (
                      <TouchableOpacity
                        key={rw.id}
                        style={[styles.pillBtn, editQrisRwId === rw.id && styles.pillBtnActive, { marginRight: 6 }]}
                        onPress={() => setEditQrisRwId(rw.id)}
                      >
                        <Text style={[styles.pillBtnText, editQrisRwId === rw.id && styles.pillBtnTextActive]}>
                          {rw.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
              {editQrisOwnerType === 'RT' && (
                <View style={{ gap: 6, marginTop: 4 }}>
                  <Text style={[styles.inputLabelBold, { fontSize: 11 }]}>Pilih RT *</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
                    {rts.map((r) => (
                      <TouchableOpacity
                        key={r.id}
                        style={[styles.pillBtn, editQrisRtId === r.id && styles.pillBtnActive, { marginRight: 6 }]}
                        onPress={() => setEditQrisRtId(r.id)}
                      >
                        <Text style={[styles.pillBtnText, editQrisRtId === r.id && styles.pillBtnTextActive]}>
                          {r.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          )}

          <Text style={styles.inputLabelBold}>Nama Label QRIS *</Text>
          <TextInput
            style={styles.modalInput}
            value={editQrisName}
            onChangeText={setEditQrisName}
            placeholder="Contoh: QRIS Kas RT 01"
            placeholderTextColor={colors.textSecondary}
          />
          <Text style={styles.inputLabelBold}>NMID (Opsional)</Text>
          <TextInput
            style={styles.modalInput}
            value={editQrisNmid}
            onChangeText={setEditQrisNmid}
            placeholder="ID Merchant QRIS"
            placeholderTextColor={colors.textSecondary}
          />
          <Text style={styles.inputLabelBold}>Foto Barcode QRIS</Text>
          <TouchableOpacity
            style={styles.uploadBox}
            onPress={() => {
              setQrisImageTarget('edit')
              handlePickFromGallery()
            }}
          >
            {editQrisImageUrl ? (
              <Image source={{ uri: editQrisImageUrl }} style={{ width: 120, height: 120, borderRadius: 8 }} />
            ) : (
              <View style={{ alignItems: 'center' }}>
                <Upload size={24} color={colors.primary} />
                <Text style={styles.uploadText}>Pilih Foto Barcode QRIS Baru</Text>
              </View>
            )}
          </TouchableOpacity>
          <View style={styles.switchRow}>
            <Text style={styles.inputLabelBold}>Jadikan QRIS Utama</Text>
            <Switch
              value={editIsPrimaryQris}
              onValueChange={setEditIsPrimaryQris}
              trackColor={{ false: '#CBD5E1', true: colors.primary }}
            />
          </View>
        </View>
      </AppModal>

      {/* PREVIEW QRIS MODAL */}
      <AppModal
        visible={modalPreviewQris}
        title={previewQrisData?.qris_name || 'Barcode QRIS'}
        onClose={() => setModalPreviewQris(false)}
      >
        <View style={{ alignItems: 'center', paddingVertical: 10 }}>
          {previewQrisData?.image_url ? (
            <Image
              source={{ uri: previewQrisData.image_url }}
              style={{ width: 240, height: 240, borderRadius: 12 }}
              resizeMode="contain"
            />
          ) : (
            <Text style={{ color: colors.textSecondary }}>Tidak ada foto barcode QRIS.</Text>
          )}
          {previewQrisData?.nmid ? (
            <Text style={{ marginTop: 12, fontWeight: '700', color: colors.textPrimary }}>
              {'NMID: ' + previewQrisData.nmid}
            </Text>
          ) : null}
        </View>
      </AppModal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
    marginBottom: 12
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A'
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    padding: 3,
    gap: 4,
    marginBottom: 12
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 10,
    gap: 6
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      web: { boxShadow: '0px 1px 3px rgba(0,0,0,0.06)' },
      default: { elevation: 2 }
    })
  },
  tabBtnText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#64748B'
  },
  tabBtnTextActive: {
    color: '#0F172A',
    fontWeight: '700'
  },
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      web: { boxShadow: '0px 1px 2px rgba(15, 23, 42, 0.04)' },
      default: { elevation: 1 }
    })
  },
  cardIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A'
  },
  cardAccNo: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 2
  },
  cardHolder: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 1
  },
  primaryBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6
  },
  primaryBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#166534'
  },
  ownerBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6
  },
  ownerBadgeText: {
    fontSize: 9.5,
    fontWeight: '700'
  },
  readOnlyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#F1F5F9',
    borderRadius: 8
  },
  readOnlyText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600'
  },
  iconMiniBtn: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptyCard: {
    paddingVertical: 40,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 20
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 12
  },
  emptySubtitle: {
    fontSize: 12.5,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18
  },
  inputLabelBold: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4
  },
  modalInput: {
    height: 44,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#0F172A',
    backgroundColor: '#FFFFFF'
  },
  pillSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4
  },
  pillBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  pillBtnActive: {
    backgroundColor: '#ECFDF5',
    borderColor: colors.primary
  },
  pillBtnText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748B'
  },
  pillBtnTextActive: {
    color: colors.primary,
    fontWeight: '800'
  },
  ownerNoticeBox: {
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 4
  },
  ownerNoticeLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500'
  },
  ownerNoticeValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 2
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4
  },
  uploadBox: {
    height: 140,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    marginTop: 4
  },
  uploadText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 6
  }
})
