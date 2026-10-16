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
  RefreshControl,
  KeyboardAvoidingView,
  Platform
} from 'react-native'
import {
  FileText,
  Plus,
  Share2,
  Eye,
  CheckCircle2,
  Clock,
  Send,
  Building2,
  Shield,
  MessageSquare,
  AlertTriangle,
  ChevronRight,
  User,
  Check
} from 'lucide-react-native'
import { useApp } from '../context/AppContext'
import AppHeader from '../components/AppHeader'
import AppCard from '../components/AppCard'
import AppBadge from '../components/AppBadge'
import AppButton from '../components/AppButton'
import AppModal from '../components/AppModal'
import { NotificationBadge } from '../components/ui/NotificationBadge'
import { colors, typography, spacing, radius, shadows } from '../utils/theme'

export default function SuratScreen({ navigation }) {
  const {
    scopedSurat = [],
    ajukanSurat,
    bacaSurat,
    balasSurat,
    updateSurat,
    isSuratUnread,
    isWarga,
    isRT,
    isRW,
    isAdminLoggedIn,
    config,
    currentUser,
    currentWarga,
    warga: allWarga,
    refreshData,
    refreshing
  } = useApp()

  const [activeTab, setActiveTab] = useState('Semua') // 'Semua' | 'Menunggu' | 'Selesai'
  const [modalOpen, setModalOpen] = useState(false)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedSurat, setSelectedSurat] = useState(null)
  const [previewSurat, setPreviewSurat] = useState(null)

  // Form State (Pengajuan Surat)
  const [tujuan, setTujuan] = useState('rt') // 'rt' | 'rw' | 'both'
  const [jenisSurat, setJenisSurat] = useState('Surat Keterangan Domisili')
  const [keperluan, setKeperluan] = useState('')
  const [isiSurat, setIsiSurat] = useState('')
  const [loading, setLoading] = useState(false)

  // Reply Form State
  const [balasanText, setBalasanText] = useState('')
  const [replyStatus, setReplyStatus] = useState('Diproses')
  const [submittingReply, setSubmittingReply] = useState(false)

  const opsiSurat = [
    'Surat Keterangan Domisili',
    'Surat Pengantar SKCK',
    'Surat Keterangan Usaha (SKU)',
    'Surat Keterangan Belum Menikah',
    'Surat Pengantar Nikah (N1-N4)',
    'Surat Keterangan Kematian',
    'Surat Pengantar Izin Keramaian'
  ]

  // Filtered surat based on active tab
  const filteredSurat = scopedSurat.filter((item) => {
    if (activeTab === 'Menunggu') {
      return item.status === 'Diajukan' || item.status === 'Diproses' || item.status === 'Menunggu'
    }
    if (activeTab === 'Selesai') {
      return item.status === 'Selesai' || item.status === 'Disetujui'
    }
    return true
  })

  const handleAjukan = async () => {
    if (!keperluan.trim()) {
      Alert.alert('Perhatian', 'Keperluan permohonan surat wajib diisi!')
      return
    }

    setLoading(true)
    try {
      const res = await ajukanSurat({
        tujuan,
        jenisSurat,
        keperluan: keperluan.trim(),
        isiSurat: isiSurat.trim()
      })
      if (res?.success) {
        setModalOpen(false)
        setKeperluan('')
        setIsiSurat('')
        setTujuan('rt')
        const targetLabel = tujuan === 'both' ? 'Ketua RT dan Ketua RW' : (tujuan === 'rw' ? 'Ketua RW' : 'Ketua RT')
        Alert.alert('Sukses', `Permohonan surat berhasil dikirim ke ${targetLabel}.`)
      }
    } catch (e) {
      Alert.alert('Error', 'Gagal mengajukan surat.')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDetail = async (item) => {
    setSelectedSurat(item)
    setReplyStatus(item.status === 'Selesai' ? 'Selesai' : 'Diproses')
    setBalasanText('')
    setDetailModalOpen(true)
    // Mark as read for current role (§3 & §5)
    await bacaSurat(item.id)
  }

  const handleKirimBalasan = async () => {
    if (!balasanText.trim() && !isAdminLoggedIn) {
      Alert.alert('Perhatian', 'Pesan balasan tidak boleh kosong!')
      return
    }

    setSubmittingReply(true)
    try {
      await balasSurat(selectedSurat.id, {
        pesan: balasanText.trim() || `Status surat diubah menjadi ${replyStatus}`,
        newStatus: isAdminLoggedIn ? replyStatus : selectedSurat.status
      })

      // Update local state for immediate feedback
      const targetUserRole = isRT ? 'rt' : isRW ? 'rw' : 'warga'
      const newReply = {
        id: `reply-${Date.now()}`,
        senderRole: targetUserRole,
        senderName: currentUser?.name || (isRT ? 'Ketua RT' : isRW ? 'Ketua RW' : 'Warga'),
        pesan: balasanText.trim() || `Status surat diubah menjadi ${replyStatus}`,
        statusAfter: isAdminLoggedIn ? replyStatus : selectedSurat.status,
        created_at: new Date().toISOString()
      }

      setSelectedSurat((prev) => ({
        ...prev,
        status: isAdminLoggedIn ? replyStatus : prev.status,
        balasan: [...(prev.balasan || []), newReply]
      }))

      setBalasanText('')
      Alert.alert('Terkirim', 'Tanggapan/balasan surat berhasil dikirim.')
    } catch (e) {
      Alert.alert('Error', 'Gagal mengirim balasan surat.')
    } finally {
      setSubmittingReply(false)
    }
  }

  const generateTemplateSurat = (item) => {
    const namaLingkungan = config?.namaLingkungan || 'Perumahan Alam Tirta Lestari'
    const namaRt = config?.namaRt || 'RT 01'
    const namaRw = config?.namaRw || 'RW 15'
    const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    const pemohon = item.namaWarga || 'Yang Bersangkutan'
    const wargaData = allWarga?.find((w) => w.id === item.wargaId) || {}
    const alamat = wargaData.blok ? `Blok ${wargaData.blok} No. ${wargaData.noRumah}` : (item.blok ? `Blok ${item.blok} No. ${item.noRumah}` : 'Warga setempat')

    const targetPejabat = item.tujuan === 'rw'
      ? `Ketua ${namaRw} ${namaLingkungan}`
      : item.tujuan === 'both'
      ? `Ketua ${namaRt} & ${namaRw} ${namaLingkungan}`
      : `Ketua ${namaRt} ${namaLingkungan}`

    return (
      `SURAT PENGANTAR\n` +
      `Nomor: ${item.id?.toUpperCase() || '---/RT/---'}\n\n` +
      `Yang bertanda tangan di bawah ini, ${targetPejabat}:\n\n` +
      `Menerangkan dengan sebenarnya bahwa:\n\n` +
      `Nama    : ${pemohon}\n` +
      `Alamat  : ${alamat}, ${namaLingkungan}\n\n` +
      `adalah benar warga ${namaRt} ${namaRw} ${namaLingkungan} yang mengajukan:\n\n` +
      `Jenis Surat : ${item.jenisSurat}\n` +
      `Keperluan   : ${item.keperluan}\n` +
      (item.isiSurat ? `Keterangan  : ${item.isiSurat}\n\n` : `\n`) +
      `Surat pengantar ini diberikan untuk dapat dipergunakan sebagaimana mestinya.\n\n` +
      `${namaLingkungan}, ${today}\n\n` +
      `${targetPejabat}\n\n\n\n` +
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

  const renderSuratItem = ({ item }) => {
    const isSelesai = item.status === 'Selesai' || item.status === 'Disetujui'
    const unread = isSuratUnread ? isSuratUnread(item) : false
    const replyCount = item.balasan?.length || 0
    const latestReply = replyCount > 0 ? item.balasan[replyCount - 1] : null

    // Target label styling
    const targetBadgeStyle = item.tujuan === 'rw'
      ? styles.targetBadgeRw
      : item.tujuan === 'both'
      ? styles.targetBadgeBoth
      : styles.targetBadgeRt

    const targetBadgeTextStyle = item.tujuan === 'rw'
      ? styles.targetBadgeTextRw
      : item.tujuan === 'both'
      ? styles.targetBadgeTextBoth
      : styles.targetBadgeTextRt

    const targetText = item.tujuan === 'rw'
      ? 'Tujuan: Ketua RW'
      : item.tujuan === 'both'
      ? 'Tujuan: RT & RW (Bersama)'
      : 'Tujuan: Ketua RT'

    return (
      <AppCard
        style={[styles.card, unread && styles.cardUnread]}
        onPress={() => handleOpenDetail(item)}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`Surat ${item.jenisSurat}, status ${item.status}${unread ? ', belum dibaca' : ''}`}
      >
        <View style={styles.cardHeader}>
          <View style={{ flex: 1, marginRight: spacing.xs }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <View style={[styles.targetBadge, targetBadgeStyle]}>
                <Text style={[styles.targetBadgeText, targetBadgeTextStyle]}>{targetText}</Text>
              </View>

              {unread && (
                <View style={styles.unreadTag}>
                  <View style={styles.unreadDot} />
                  <Text style={styles.unreadTagText}>
                    {isWarga ? 'ADA BALASAN' : 'SURAT BARU'}
                  </Text>
                </View>
              )}
            </View>

            <Text style={styles.suratType} numberOfLines={1}>{item.jenisSurat}</Text>
          </View>

          <AppBadge status={item.status} label={item.status} />
        </View>

        <Text style={styles.keperluanLabel}>Keperluan:</Text>
        <Text style={styles.keperluanText} numberOfLines={2}>{item.keperluan}</Text>

        {Boolean(item.isiSurat) && (
          <Text style={styles.isiSuratSnippet} numberOfLines={1}>
            Rincian: {item.isiSurat}
          </Text>
        )}

        {/* Conversation snippet preview */}
        {latestReply && (
          <View style={styles.replyPreviewBox}>
            <MessageSquare size={13} color={colors.primary} />
            <Text style={styles.replyPreviewText} numberOfLines={1}>
              <Text style={{ fontWeight: '700' }}>{latestReply.senderName}: </Text>
              "{latestReply.pesan}"
            </Text>
          </View>
        )}

        <View style={styles.cardFooter}>
          <Text style={styles.footerText} numberOfLines={1}>
            Pemohon: {item.namaWarga || 'Warga'} • {item.tanggal || 'Terbaru'}
          </Text>

          <View style={styles.cardActions}>
            {replyCount > 0 && (
              <View style={styles.replyCountBadge}>
                <Text style={styles.replyCountBadgeText}>{replyCount} balasan</Text>
              </View>
            )}

            {isSelesai && (
              <TouchableOpacity
                style={styles.iconBtn}
                hitSlop={{ top: 7, bottom: 7, left: 7, right: 7 }}
                accessibilityRole="button"
                accessibilityLabel="Lihat Pratinjau Surat"
                onPress={(e) => {
                  e?.stopPropagation?.()
                  setPreviewSurat(item)
                }}
                activeOpacity={0.8}
              >
                <Eye size={15} color={colors.info} />
              </TouchableOpacity>
            )}

            {isSelesai && (
              <TouchableOpacity
                style={styles.iconBtn}
                hitSlop={{ top: 7, bottom: 7, left: 7, right: 7 }}
                accessibilityRole="button"
                accessibilityLabel="Bagikan Surat Pengantar"
                onPress={(e) => {
                  e?.stopPropagation?.()
                  handleShareSurat(item)
                }}
                activeOpacity={0.8}
              >
                <Share2 size={15} color={colors.success} />
              </TouchableOpacity>
            )}

            <View style={styles.detailChevronWrap}>
              <ChevronRight size={16} color={colors.textSecondary} />
            </View>
          </View>
        </View>
      </AppCard>
    )
  }

  return (
    <View style={styles.container}>
      <AppHeader
        title="Layanan Surat Pengantar"
        subtitle={
          isWarga
            ? 'Pengajuan & riwayat surat pengantar RT & RW'
            : isRT
            ? 'Kelola permohonan surat pengantar tingkat RT'
            : 'Verifikasi & persetujuan surat tingkat RW'
        }
        onBack={() => navigation.goBack()}
      />

      {/* Filter Tabs */}
      <View style={styles.tabBarRow}>
        {['Semua', 'Menunggu', 'Selesai'].map((tab) => {
          const isActive = activeTab === tab
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.filterTab, isActive && styles.filterTabActive]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterTabText, isActive && styles.filterTabTextActive]}>
                {tab === 'Menunggu' ? 'Perlu Diproses' : tab}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>

      <FlatList
        data={filteredSurat}
        keyExtractor={(item) => item.id || String(Math.random())}
        renderItem={renderSuratItem}
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
            <Text style={styles.emptyTitle}>Belum ada permohonan surat</Text>
            <Text style={styles.emptySub}>
              {isWarga
                ? 'Buat permohonan surat pengantar RT & RW online dengan mudah.'
                : 'Belum ada surat pengantar warga yang menunggu pada kategori ini.'}
            </Text>
          </View>
        }
      />

      {/* FAB Ajukan Surat (Khusus Warga) */}
      {isWarga && (
        <TouchableOpacity
          style={styles.fab}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          accessibilityRole="button"
          accessibilityLabel="Ajukan Surat Pengantar"
          onPress={() => setModalOpen(true)}
          activeOpacity={0.88}
        >
          <Plus size={24} color={colors.surface} />
        </TouchableOpacity>
      )}

      {/* ===================== MODAL AJUKAN SURAT (§2) ===================== */}
      <AppModal
        visible={modalOpen}
        title="Ajukan Surat Pengantar"
        subtitle="Pilih tujuan penerima dan lengkapi keperluan surat"
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
                title="Kirim Surat"
                variant="primary"
                loading={loading}
                onPress={handleAjukan}
              />
            </View>
          </View>
        }
      >
        <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
          {/* Pilihan Tujuan Penerima (§2) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tujuan Penerima Surat *</Text>
            <View style={styles.tujuanSelectorWrap}>
              <TouchableOpacity
                style={[styles.tujuanOptionBtn, tujuan === 'rt' && styles.tujuanOptionActiveRt]}
                onPress={() => setTujuan('rt')}
                activeOpacity={0.8}
              >
                <Building2 size={16} color={tujuan === 'rt' ? '#047857' : colors.textSecondary} />
                <Text style={[styles.tujuanOptionText, tujuan === 'rt' && styles.tujuanOptionTextActiveRt]}>
                  Ketua RT
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tujuanOptionBtn, tujuan === 'rw' && styles.tujuanOptionActiveRw]}
                onPress={() => setTujuan('rw')}
                activeOpacity={0.8}
              >
                <Shield size={16} color={tujuan === 'rw' ? '#7C3AED' : colors.textSecondary} />
                <Text style={[styles.tujuanOptionText, tujuan === 'rw' && styles.tujuanOptionTextActiveRw]}>
                  Ketua RW
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tujuanOptionBtn, tujuan === 'both' && styles.tujuanOptionActiveBoth]}
                onPress={() => setTujuan('both')}
                activeOpacity={0.8}
              >
                <CheckCircle2 size={16} color={tujuan === 'both' ? '#2563EB' : colors.textSecondary} />
                <Text style={[styles.tujuanOptionText, tujuan === 'both' && styles.tujuanOptionTextActiveBoth]}>
                  RT & RW
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.helperText}>
              {tujuan === 'both'
                ? 'Surat akan dikirimkan dan ternotifikasi ke Ketua RT dan Ketua RW sekaligus.'
                : tujuan === 'rw'
                ? 'Surat ditujukan langsung ke Pengurus RW 15.'
                : 'Surat ditujukan ke Pengurus RT domisili Anda.'}
            </Text>
          </View>

          {/* Jenis Surat */}
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

          {/* Keperluan */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Judul / Keperluan Permohonan *</Text>
            <TextInput
              style={styles.input}
              placeholder="Contoh: Pembuatan KTP baru / SKCK Kepolisian"
              placeholderTextColor={colors.textSecondary}
              value={keperluan}
              onChangeText={setKeperluan}
            />
          </View>

          {/* Isi / Keterangan Surat */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Rincian Keterangan / Pesan Tambahan</Text>
            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
              placeholder="Jelaskan kebutuhan pengantar surat, instansi tujuan, atau catatan penting..."
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={3}
              value={isiSurat}
              onChangeText={setIsiSurat}
            />
          </View>
        </ScrollView>
      </AppModal>

      {/* ===================== MODAL DETAIL & PERCAKAPAN SURAT (§3) ===================== */}
      <AppModal
        visible={detailModalOpen}
        title="Detail & Percakapan Surat"
        subtitle={selectedSurat ? `${selectedSurat.jenisSurat} • ${selectedSurat.namaWarga || 'Warga'}` : ''}
        onClose={() => setDetailModalOpen(false)}
        footer={
          <View style={{ width: '100%', gap: 8 }}>
            {(selectedSurat?.status === 'Selesai' || selectedSurat?.status === 'Disetujui') && (
              <AppButton
                title="Lihat Format Surat Resmi"
                variant="primary"
                icon={<Eye size={16} color={colors.surface} />}
                onPress={() => {
                  setDetailModalOpen(false)
                  setPreviewSurat(selectedSurat)
                }}
              />
            )}
            <AppButton
              title="Tutup"
              variant="secondary"
              onPress={() => setDetailModalOpen(false)}
            />
          </View>
        }
      >
        {selectedSurat && (
          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 460 }}>
            {/* Kartu Ringkasan Surat */}
            <View style={styles.detailSummaryCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <View style={[
                  styles.targetBadge,
                  selectedSurat.tujuan === 'rw' ? styles.targetBadgeRw : (selectedSurat.tujuan === 'both' ? styles.targetBadgeBoth : styles.targetBadgeRt)
                ]}>
                  <Text style={[
                    styles.targetBadgeText,
                    selectedSurat.tujuan === 'rw' ? styles.targetBadgeTextRw : (selectedSurat.tujuan === 'both' ? styles.targetBadgeTextBoth : styles.targetBadgeTextRt)
                  ]}>
                    {selectedSurat.tujuan === 'rw' ? 'Tujuan: Ketua RW' : (selectedSurat.tujuan === 'both' ? 'Tujuan: RT & RW' : 'Tujuan: Ketua RT')}
                  </Text>
                </View>

                <AppBadge status={selectedSurat.status} label={selectedSurat.status} />
              </View>

              <Text style={styles.detailTitleText}>{selectedSurat.jenisSurat}</Text>
              <Text style={styles.detailKeperluanText}>
                <Text style={{ fontWeight: '700' }}>Keperluan: </Text>{selectedSurat.keperluan}
              </Text>

              {Boolean(selectedSurat.isiSurat) && (
                <Text style={styles.detailIsiText}>
                  <Text style={{ fontWeight: '700' }}>Rincian: </Text>{selectedSurat.isiSurat}
                </Text>
              )}

              <View style={styles.detailMetaRow}>
                <Text style={styles.detailMetaText}>
                  Pemohon: {selectedSurat.namaWarga || 'Warga'} (Blok {selectedSurat.blok || '-'}/{selectedSurat.noRumah || '-'})
                </Text>
                <Text style={styles.detailMetaText}>
                  Tanggal: {selectedSurat.tanggal || 'Hari ini'}
                </Text>
              </View>
            </View>

            {/* Riwayat Percakapan & Balasan (§3) */}
            <View style={styles.threadSection}>
              <View style={styles.threadHeaderRow}>
                <MessageSquare size={16} color={colors.primary} />
                <Text style={styles.threadHeaderTitle}>Riwayat Balasan & Catatan</Text>
              </View>

              {(!selectedSurat.balasan || selectedSurat.balasan.length === 0) ? (
                <View style={styles.emptyThreadBox}>
                  <Text style={styles.emptyThreadText}>
                    Belum ada catatan atau balasan. Silakan sampaikan pesan di bawah.
                  </Text>
                </View>
              ) : (
                <View style={{ gap: 8, marginTop: 6 }}>
                  {selectedSurat.balasan.map((reply, idx) => {
                    const isSenderWarga = reply.senderRole === 'warga'
                    const isSenderRw = reply.senderRole === 'rw'
                    return (
                      <View
                        key={reply.id || idx}
                        style={[
                          styles.chatBubble,
                          isSenderWarga ? styles.chatBubbleWarga : (isSenderRw ? styles.chatBubbleRw : styles.chatBubbleRt)
                        ]}
                      >
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                          <View style={[
                            styles.senderRoleTag,
                            isSenderWarga ? styles.senderRoleTagWarga : (isSenderRw ? styles.senderRoleTagRw : styles.senderRoleTagRt)
                          ]}>
                            <Text style={[
                              styles.senderRoleTagText,
                              isSenderWarga ? styles.senderRoleTagTextWarga : (isSenderRw ? styles.senderRoleTagTextRw : styles.senderRoleTagTextRt)
                            ]}>
                              {reply.senderName || (isSenderWarga ? 'Warga' : isSenderRw ? 'Ketua RW' : 'Ketua RT')}
                            </Text>
                          </View>

                          <Text style={styles.chatTimeText}>
                            {reply.created_at ? new Date(reply.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : 'Baru saja'}
                          </Text>
                        </View>

                        <Text style={styles.chatMessageText}>{reply.pesan}</Text>
                      </View>
                    )
                  })}
                </View>
              )}
            </View>

            {/* Form Balasan & Update Status (§3) */}
            <View style={styles.replyInputSection}>
              {isAdminLoggedIn && (
                <View style={{ marginBottom: 8 }}>
                  <Text style={styles.label}>Ubah Status Surat</Text>
                  <View style={styles.statusChipsRow}>
                    {['Diproses', 'Selesai', 'Ditolak'].map((st) => (
                      <TouchableOpacity
                        key={st}
                        style={[styles.statusOptionChip, replyStatus === st && styles.statusOptionChipActive]}
                        onPress={() => setReplyStatus(st)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.statusOptionChipText, replyStatus === st && styles.statusOptionChipTextActive]}>
                          {st}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              <Text style={styles.label}>
                {isAdminLoggedIn ? 'Tulis Balasan / Catatan Pengurus' : 'Kirim Balasan / Pertanyaan ke Pengurus'}
              </Text>

              <View style={styles.replyBoxWrapper}>
                <TextInput
                  style={styles.replyTextInput}
                  placeholder={isAdminLoggedIn ? 'Tulis arahan, nomor surat, atau info pengambilan...' : 'Tulis balasan atau klarifikasi dokumen...'}
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  value={balasanText}
                  onChangeText={setBalasanText}
                />
                <TouchableOpacity
                  style={[styles.sendReplyBtn, (!balasanText.trim() && !isAdminLoggedIn) && styles.sendReplyBtnDisabled]}
                  onPress={handleKirimBalasan}
                  disabled={submittingReply}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel="Kirim Balasan"
                >
                  <Send size={16} color={colors.surface} />
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        )}
      </AppModal>

      {/* ===================== MODAL PREVIEW SURAT ===================== */}
      <AppModal
        visible={!!previewSurat}
        title="Pratinjau Surat Resmi"
        subtitle="Format pengantar resmi RT & RW siap cetak / bagikan"
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
  tabBarRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    gap: 8
  },
  filterTab: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border
  },
  filterTabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary
  },
  filterTabTextActive: {
    color: colors.surface,
    fontWeight: '700'
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: 180
  },
  card: {
    marginBottom: spacing.md
  },
  cardUnread: {
    borderColor: '#FECACA',
    backgroundColor: '#FFFBFB',
    borderWidth: 1.5
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.xs
  },
  targetBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.full
  },
  targetBadgeRt: {
    backgroundColor: '#ECFDF5',
    borderWidth: 0.8,
    borderColor: '#A7F3D0'
  },
  targetBadgeRw: {
    backgroundColor: '#F5F3FF',
    borderWidth: 0.8,
    borderColor: '#DDD6FE'
  },
  targetBadgeBoth: {
    backgroundColor: '#EFF6FF',
    borderWidth: 0.8,
    borderColor: '#BFDBFE'
  },
  targetBadgeText: {
    fontSize: 10,
    fontWeight: '800'
  },
  targetBadgeTextRt: {
    color: '#047857'
  },
  targetBadgeTextRw: {
    color: '#7C3AED'
  },
  targetBadgeTextBoth: {
    color: '#2563EB'
  },
  unreadTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderWidth: 0.8,
    borderColor: '#FCA5A5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
    gap: 4
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#DC2626'
  },
  unreadTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#DC2626'
  },
  suratType: {
    ...typography.cardTitle,
    marginTop: 2
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
  isiSuratSnippet: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
    fontStyle: 'italic'
  },
  replyPreviewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginTop: 6
  },
  replyPreviewText: {
    fontSize: 11,
    color: colors.textPrimary,
    flex: 1
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
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
  replyCountBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
    borderWidth: 0.8,
    borderColor: '#BFDBFE'
  },
  replyCountBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563EB'
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
  detailChevronWrap: {
    paddingLeft: 2
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
    marginTop: 4,
    maxWidth: 280
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
    fontSize: 13,
    color: colors.textPrimary,
    backgroundColor: colors.surface
  },
  helperText: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 4
  },
  tujuanSelectorWrap: {
    flexDirection: 'row',
    gap: 6
  },
  tujuanOptionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: radius.md,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border
  },
  tujuanOptionActiveRt: {
    backgroundColor: '#ECFDF5',
    borderColor: '#047857'
  },
  tujuanOptionActiveRw: {
    backgroundColor: '#F5F3FF',
    borderColor: '#7C3AED'
  },
  tujuanOptionActiveBoth: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB'
  },
  tujuanOptionText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.textSecondary
  },
  tujuanOptionTextActiveRt: {
    color: '#047857'
  },
  tujuanOptionTextActiveRw: {
    color: '#7C3AED'
  },
  tujuanOptionTextActiveBoth: {
    color: '#2563EB'
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
    backgroundColor: '#ECFDF5',
    borderColor: colors.primary
  },
  suratChipText: {
    fontSize: 11.5,
    color: colors.textSecondary
  },
  suratChipTextActive: {
    color: colors.primary,
    fontWeight: '700'
  },
  detailSummaryCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm
  },
  detailTitleText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 4
  },
  detailKeperluanText: {
    fontSize: 12,
    color: colors.textPrimary,
    lineHeight: 18
  },
  detailIsiText: {
    fontSize: 11.5,
    color: colors.textSecondary,
    lineHeight: 17,
    marginTop: 2
  },
  detailMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0'
  },
  detailMetaText: {
    fontSize: 10.5,
    color: colors.textSecondary
  },
  threadSection: {
    marginBottom: spacing.sm
  },
  threadHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4
  },
  threadHeaderTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary
  },
  emptyThreadBox: {
    backgroundColor: '#F1F5F9',
    borderRadius: radius.sm,
    padding: spacing.sm,
    alignItems: 'center'
  },
  emptyThreadText: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center'
  },
  chatBubble: {
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1
  },
  chatBubbleWarga: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE'
  },
  chatBubbleRt: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0'
  },
  chatBubbleRw: {
    backgroundColor: '#F5F3FF',
    borderColor: '#DDD6FE'
  },
  senderRoleTag: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: radius.full
  },
  senderRoleTagWarga: {
    backgroundColor: '#DBEAFE'
  },
  senderRoleTagRt: {
    backgroundColor: '#D1FAE5'
  },
  senderRoleTagRw: {
    backgroundColor: '#EDE9FE'
  },
  senderRoleTagText: {
    fontSize: 9.5,
    fontWeight: '800'
  },
  senderRoleTagTextWarga: {
    color: '#1D4ED8'
  },
  senderRoleTagTextRt: {
    color: '#047857'
  },
  senderRoleTagTextRw: {
    color: '#6D28D9'
  },
  chatTimeText: {
    fontSize: 9.5,
    color: colors.textSecondary
  },
  chatMessageText: {
    fontSize: 12,
    color: colors.textPrimary,
    lineHeight: 18,
    marginTop: 2
  },
  replyInputSection: {
    marginTop: spacing.xs
  },
  statusChipsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 2
  },
  statusOptionChip: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: radius.sm,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: colors.border
  },
  statusOptionChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  statusOptionChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary
  },
  statusOptionChipTextActive: {
    color: colors.surface
  },
  replyBoxWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    marginTop: 4
  },
  replyTextInput: {
    flex: 1,
    minHeight: 46,
    maxHeight: 90,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    fontSize: 13,
    color: colors.textPrimary,
    backgroundColor: colors.surface
  },
  sendReplyBtn: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center'
  },
  sendReplyBtnDisabled: {
    opacity: 0.5
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
