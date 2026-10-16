import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Image,
  ScrollView,
  RefreshControl,
  Switch,
  Alert,
  Platform,
  KeyboardAvoidingView,
  Modal,
} from 'react-native';
import {
  Camera,
  Image as ImageIcon,
  MapPin,
  Clock,
  CheckCircle2,
  Check,
  Plus,
  X,
  ChevronLeft,
  Copy,
  MessageSquare,
  Send,
  AlertCircle,
  ShieldCheck,
  User,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';

import { useApp } from '../context/AppContext';
import { colors, radius, spacing, typography, layout, shadows } from '../theme';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import NotificationBadge from '../components/ui/NotificationBadge';
import AppEmptyState from '../components/AppEmptyState';

const KATEGORI_ADUAN = [
  'Lampu Jalan',
  'Sampah',
  'Keamanan',
  'Jalan Rusak',
  'Saluran Air',
  'Lainnya',
];

export default function PengaduanScreen({ navigation }) {
  const {
    scopedPengaduan,
    buatPengaduan,
    bacaPengaduan,
    tanggapiPengaduan,
    isPengaduanUnread,
    aduanUnreadCount,
    isAdminLoggedIn,
    refreshData,
    refreshing,
    isWarga,
    isRT,
    isRW,
    currentRole,
  } = useApp();

  const [viewMode, setViewMode] = useState('list'); // 'list' | 'form'
  const [activeTab, setActiveTab] = useState('Semua'); // 'Semua' | 'Menunggu' | 'Selesai'

  // Form State (§2 & §5.4)
  const [tujuan, setTujuan] = useState('rt'); // 'rt' | 'rw' | 'both'
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [kategori, setKategori] = useState('');
  const [lokasi, setLokasi] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [hideName, setHideName] = useState(false);
  const [loadingLoc, setLoadingLoc] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState(null);

  // Detail & Tanggapan Modal State (§4)
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedAduan, setSelectedAduan] = useState(null);
  const [tanggapanText, setTanggapanText] = useState('');
  const [newStatusChoice, setNewStatusChoice] = useState('Sedang Diproses');
  const [submittingTanggapan, setSubmittingTanggapan] = useState(false);

  // 1. Photo Picker Handlers
  const handlePickFromGallery = async () => {
    if (selectedPhotos.length >= 3) {
      Alert.alert('Perhatian', 'Maksimal 3 foto kendala.');
      return;
    }
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Izin Ditolak', 'Aplikasi butuh izin galeri untuk memilih foto.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.7,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedPhotos((prev) => [...prev, result.assets[0].uri].slice(0, 3));
      }
    } catch {
      Alert.alert('Error', 'Gagal membuka galeri.');
    }
  };

  const handleTakePhoto = async () => {
    if (selectedPhotos.length >= 3) {
      Alert.alert('Perhatian', 'Maksimal 3 foto kendala.');
      return;
    }
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Izin Ditolak', 'Aplikasi butuh izin kamera untuk memotret kendala.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedPhotos((prev) => [...prev, result.assets[0].uri].slice(0, 3));
      }
    } catch {
      Alert.alert('Error', 'Gagal membuka kamera.');
    }
  };

  const handleRemovePhoto = (index) => {
    setSelectedPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  // 2. Location Geocoding Handler
  const handleGetLocation = async () => {
    setLoadingLoc(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Izin Lokasi', 'Izin lokasi dimatikan. Silakan aktifkan di pengaturan.');
        setLoadingLoc(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      const geocode = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      if (geocode && geocode.length > 0) {
        const place = geocode[0];
        const addr = `${place.street || place.name || ''}, Blok ${place.subregion || place.city || ''}`.trim();
        setLokasi(addr || `Lat: ${loc.coords.latitude.toFixed(4)}, Lon: ${loc.coords.longitude.toFixed(4)}`);
      } else {
        setLokasi(`Titik: ${loc.coords.latitude.toFixed(4)}, ${loc.coords.longitude.toFixed(4)}`);
      }
      Haptics.selectionAsync().catch(() => {});
    } catch {
      Alert.alert('Info', 'Tidak dapat mengambil koordinat lokasi saat ini.');
    } finally {
      setLoadingLoc(false);
    }
  };

  // 3. Submit Report Handler (§2 & §4)
  const isFormValid = Boolean(kategori && deskripsi.trim().length >= 10);

  const handleSubmitReport = async () => {
    if (!isFormValid) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      Alert.alert('Perhatian', 'Kategori wajib dipilih dan rincian minimal 10 karakter.');
      return;
    }

    setSubmitting(true);
    try {
      const ticketNum = `AD-${new Date().getFullYear()}-${String(Math.floor(1000 + Math.random() * 9000))}`;
      const payload = {
        judul: `[${kategori}] ${deskripsi.slice(0, 32)}...`,
        kategori,
        lokasi: lokasi.trim(),
        deskripsi: deskripsi.trim(),
        hideName,
        photos: selectedPhotos,
        ticketNum,
        tujuan, // 'rt' | 'rw' | 'both'
        status: 'Menunggu Tindak Lanjut',
        stage: 1, // 1: Terkirim, 2: Ditinjau, 3: Petugas, 4: Selesai
      };

      const res = await buatPengaduan(payload);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

      setSubmittedTicket(res?.pengaduan || payload);
      setSelectedPhotos([]);
      setKategori('');
      setLokasi('');
      setDeskripsi('');
      setTujuan('rt');
    } catch {
      Alert.alert('Error', 'Gagal mengirim laporan.');
    } finally {
      setSubmitting(false);
    }
  };

  // 4. Open Detail & Mark as Read Handler (§3, §4, §5)
  const handleOpenDetail = async (item) => {
    setSelectedAduan(item);
    setNewStatusChoice(item.status === 'Selesai' ? 'Selesai' : 'Sedang Diproses');
    setTanggapanText('');
    setDetailModalOpen(true);
    // Mark as read per current role (reduces badge count accurately)
    await bacaPengaduan(item.id);
  };

  // 5. Send Tanggapan Handler (§4 & §5)
  const handleKirimTanggapan = async () => {
    if (!tanggapanText.trim() && !newStatusChoice) {
      Alert.alert('Perhatian', 'Isi tanggapan tindak lanjut terlebih dahulu.');
      return;
    }

    setSubmittingTanggapan(true);
    try {
      const res = await tanggapiPengaduan(selectedAduan.id, {
        tanggapan: tanggapanText.trim(),
        newStatus: newStatusChoice,
      });

      if (res?.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        Alert.alert('Sukses', 'Tanggapan dan status aduan berhasil diperbarui.');

        // Update local selected aduan view
        const curList = selectedAduan.tanggapanList || [];
        const newEntry = {
          id: `tgp-${Date.now()}`,
          responderRole: isRT ? 'rt' : isRW ? 'rw' : 'pengurus',
          responderName: isRT ? 'Ketua RT' : isRW ? 'Ketua RW' : 'Petugas Lingkungan',
          pesan: tanggapanText.trim(),
          statusAfter: newStatusChoice,
          created_at: new Date().toISOString(),
        };

        setSelectedAduan((prev) => ({
          ...prev,
          status: newStatusChoice,
          stage: newStatusChoice === 'Selesai' ? 4 : (newStatusChoice === 'Sedang Diproses' ? 3 : 2),
          tanggapan: tanggapanText.trim() || prev.tanggapan,
          tanggapanList: [...curList, newEntry],
        }));
        setTanggapanText('');
      } else {
        Alert.alert('Gagal', res?.message || 'Gagal mengirim tanggapan.');
      }
    } catch {
      Alert.alert('Error', 'Terjadi kesalahan sistem saat mengirim tanggapan.');
    } finally {
      setSubmittingTanggapan(false);
    }
  };

  // Filtered Pengaduan by Tab
  const filteredPengaduan = (scopedPengaduan || []).filter((item) => {
    if (activeTab === 'Menunggu') {
      return item.status !== 'Selesai' && item.status !== 'Ditolak';
    }
    if (activeTab === 'Selesai') {
      return item.status === 'Selesai';
    }
    return true;
  });

  // Stepper Component for Tracking Card (§5.4.4)
  const renderStepper = (currentStage = 1) => {
    const steps = [
      { id: 1, label: 'Terkirim' },
      { id: 2, label: 'Ditinjau' },
      { id: 3, label: 'Petugas' },
      { id: 4, label: 'Selesai' },
    ];

    return (
      <View style={styles.stepperContainer}>
        <View style={styles.stepperPointsRow}>
          {steps.map((s, idx) => {
            const isCompleted = currentStage > s.id;
            const isActive = currentStage === s.id;
            const isPending = currentStage < s.id;

            return (
              <React.Fragment key={s.id}>
                {idx > 0 && (
                  <View
                    style={[
                      styles.stepperLine,
                      { backgroundColor: isCompleted || isActive ? colors.primary : colors.border },
                    ]}
                  />
                )}
                <View
                  style={[
                    styles.stepperDot,
                    isCompleted && styles.stepperDotCompleted,
                    isActive && styles.stepperDotActive,
                    isPending && styles.stepperDotPending,
                  ]}
                >
                  {isCompleted && <Check size={10} color="#FFFFFF" strokeWidth={3} />}
                </View>
              </React.Fragment>
            );
          })}
        </View>

        <View style={styles.stepperLabelsRow}>
          {steps.map((s) => (
            <Text key={s.id} style={styles.stepperLabel} numberOfLines={1}>
              {s.label}
            </Text>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            if (viewMode === 'form') {
              setViewMode('list');
              setSubmittedTicket(null);
            } else {
              navigation.goBack();
            }
          }}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Kembali"
        >
          <ChevronLeft size={24} color={colors.textPrimary} />
          <Text style={styles.backBtnText}>Kembali</Text>
        </Pressable>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>
            {viewMode === 'form' ? 'Lapor Masalah' : 'Laporan & Aduan'}
          </Text>
          {viewMode === 'list' && aduanUnreadCount > 0 && (
            <NotificationBadge count={aduanUnreadCount} style={{ marginLeft: 6 }} />
          )}
        </View>

        <View style={{ width: 48 }} />
      </View>

      {viewMode === 'form' ? (
        /* ===================== FORM ADUAN (§2 & §5.4) ===================== */
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.formScroll}
            showsVerticalScrollIndicator={false}
          >
            {/* After Submission Ticket Result (§5.4.4) */}
            {submittedTicket ? (
              <View style={styles.ticketCard}>
                <View style={styles.ticketHeader}>
                  <CheckCircle2 size={24} color="#047857" strokeWidth={2.4} />
                  <Text style={styles.ticketTitle}>Laporan Terkirim</Text>
                </View>

                <Pressable
                  onLongPress={async () => {
                    await Clipboard.setStringAsync(submittedTicket.ticketNum);
                    Haptics.selectionAsync().catch(() => {});
                    Alert.alert('Disalin', `Nomor tiket ${submittedTicket.ticketNum} disalin.`);
                  }}
                  style={styles.ticketNumRow}
                >
                  <Text style={styles.ticketNumLabel}>Nomor Tiket:</Text>
                  <Text style={styles.ticketNumValue}>{submittedTicket.ticketNum}</Text>
                  <Copy size={14} color={colors.primary} style={{ marginLeft: 6 }} />
                </Pressable>

                {renderStepper(1)}

                <View style={styles.ticketTargetBox}>
                  <Text style={styles.ticketTargetLabel}>Diteruskan Kepada:</Text>
                  <Text style={styles.ticketTargetVal}>
                    {submittedTicket.tujuan === 'rw'
                      ? 'Ketua RW Lingkungan'
                      : submittedTicket.tujuan === 'both'
                      ? 'Ketua RT dan Ketua RW (Bersama)'
                      : 'Ketua RT Setempat'}
                  </Text>
                </View>

                <Button
                  title="Kembali ke Daftar Laporan"
                  variant="primary"
                  onPress={() => {
                    setSubmittedTicket(null);
                    setViewMode('list');
                  }}
                  style={{ marginTop: 20 }}
                />
              </View>
            ) : (
              <>
                {/* Section 0: Pilihan Tujuan Aduan (§2) */}
                <View style={styles.formSection}>
                  <Text style={styles.sectionLabel}>Tujuan Penerima Aduan *</Text>
                  <View style={styles.tujuanRow}>
                    {[
                      { id: 'rt', label: 'Ketua RT', desc: 'Wilayah RT' },
                      { id: 'rw', label: 'Ketua RW', desc: 'Tingkat RW' },
                      { id: 'both', label: 'RT & RW', desc: 'Bersama' },
                    ].map((opt) => {
                      const isSelected = tujuan === opt.id;
                      return (
                        <Pressable
                          key={opt.id}
                          onPress={() => setTujuan(opt.id)}
                          style={[
                            styles.tujuanChip,
                            isSelected && styles.tujuanChipSelected,
                          ]}
                          accessibilityRole="button"
                          accessibilityLabel={`Kirim ke ${opt.label}`}
                        >
                          <Text
                            style={[
                              styles.tujuanChipLabel,
                              isSelected && styles.tujuanChipLabelSelected,
                            ]}
                          >
                            {opt.label}
                          </Text>
                          <Text
                            style={[
                              styles.tujuanChipDesc,
                              isSelected && styles.tujuanChipDescSelected,
                            ]}
                          >
                            {opt.desc}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {/* Section 1: Foto Kendala (opsional, maks 3) */}
                <View style={styles.formSection}>
                  <Text style={styles.sectionLabel}>Foto Kendala (opsional, maks 3)</Text>
                  <View style={styles.photoSlotsRow}>
                    {[0, 1, 2].map((idx) => {
                      const photoUri = selectedPhotos[idx];
                      if (photoUri) {
                        return (
                          <View key={idx} style={styles.photoSlotFilled}>
                            <Image source={{ uri: photoUri }} style={styles.photoThumb} />
                            <Pressable
                              onPress={() => handleRemovePhoto(idx)}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                              style={styles.removePhotoBtn}
                            >
                              <X size={14} color="#FFFFFF" strokeWidth={2.5} />
                            </Pressable>
                          </View>
                        );
                      }
                      return (
                        <Pressable
                          key={idx}
                          onPress={handlePickFromGallery}
                          style={styles.photoSlotEmpty}
                        >
                          <Plus size={24} color="#475569" />
                        </Pressable>
                      );
                    })}
                  </View>

                  <View style={styles.photoActionRow}>
                    <View style={{ flex: 1 }}>
                      <Button
                        title="Kamera"
                        variant="ghost"
                        icon={<Camera size={18} color={colors.primary} />}
                        onPress={handleTakePhoto}
                        disabled={selectedPhotos.length >= 3}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Button
                        title="Galeri"
                        variant="ghost"
                        icon={<ImageIcon size={18} color={colors.primary} />}
                        onPress={handlePickFromGallery}
                        disabled={selectedPhotos.length >= 3}
                      />
                    </View>
                  </View>
                </View>

                {/* Section 2: Kategori */}
                <View style={styles.formSection}>
                  <Text style={styles.sectionLabel}>Kategori *</Text>
                  <View style={styles.chipsWrap}>
                    {KATEGORI_ADUAN.map((item) => {
                      const isSelected = kategori === item;
                      return (
                        <Pressable
                          key={item}
                          onPress={() => setKategori(item)}
                          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                          style={[
                            styles.kategoriChip,
                            isSelected && styles.kategoriChipSelected,
                          ]}
                        >
                          {isSelected && (
                            <Check size={14} color="#FFFFFF" strokeWidth={2.5} style={{ marginRight: 4 }} />
                          )}
                          <Text
                            style={[
                              styles.kategoriChipText,
                              isSelected && styles.kategoriChipTextSelected,
                            ]}
                          >
                            {item}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {/* Section 3: Lokasi */}
                <View style={styles.formSection}>
                  <Text style={styles.sectionLabel}>Lokasi</Text>
                  <Input
                    placeholder="Contoh: Depan Pos Ronda Blok B"
                    value={lokasi}
                    onChangeText={setLokasi}
                    maxLength={120}
                    rightIcon={
                      <Pressable
                        onPress={handleGetLocation}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        disabled={loadingLoc}
                        style={{ padding: 4 }}
                      >
                        <MapPin size={20} color={colors.primary} />
                      </Pressable>
                    }
                  />
                </View>

                {/* Section 4: Deskripsi */}
                <View style={styles.formSection}>
                  <Text style={styles.sectionLabel}>Deskripsi *</Text>
                  <Input
                    multiline
                    placeholder="Jelaskan detail permasalahan kendala fasilitas umum..."
                    value={deskripsi}
                    onChangeText={setDeskripsi}
                    maxLength={500}
                  />
                  <Text
                    style={[
                      styles.counterText,
                      deskripsi.length >= 450 && { color: '#B45309' },
                      deskripsi.length >= 500 && { color: '#B91C1C' },
                    ]}
                  >
                    {deskripsi.length}/500
                  </Text>
                </View>

                {/* Switch: Sembunyikan Nama */}
                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Sembunyikan nama dari warga lain</Text>
                  <Switch
                    value={hideName}
                    onValueChange={setHideName}
                    trackColor={{ false: '#CBD5E1', true: colors.primary }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                {/* Response estimate notice */}
                <View style={styles.estimateBox}>
                  <Clock size={14} color={colors.textSecondary} style={{ marginRight: 6 }} />
                  <Text style={styles.estimateText}>
                    Estimasi respon petugas: &lt; 24 jam kerja
                  </Text>
                </View>

                {/* Sticky CTA Submit Button */}
                <View style={styles.submitCtaWrapper}>
                  <Button
                    title="Kirim Laporan"
                    variant="primary"
                    disabled={!isFormValid || submitting}
                    loading={submitting}
                    onPress={handleSubmitReport}
                  />
                </View>
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      ) : (
        /* ===================== LIST LAPORAN ===================== */
        <View style={{ flex: 1 }}>
          {/* Tab Filter (§7) */}
          <View style={styles.tabBar}>
            {['Semua', 'Menunggu', 'Selesai'].map((tab) => {
              const isActive = activeTab === tab;
              const tabLabel = tab === 'Menunggu' ? 'Perlu Tindakan' : tab;
              return (
                <Pressable
                  key={tab}
                  onPress={() => {
                    setActiveTab(tab);
                    Haptics.selectionAsync().catch(() => {});
                  }}
                  style={[styles.tabButton, isActive && styles.tabButtonActive]}
                >
                  <Text style={[styles.tabButtonText, isActive && styles.tabButtonTextActive]}>
                    {tabLabel}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <FlatList
            data={filteredPengaduan}
            keyExtractor={(item) => item.id || String(Math.random())}
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
                type="no_reports"
                title="Belum Ada Laporan"
                description={
                  activeTab !== 'Semua'
                    ? `Tidak ada laporan dengan status "${activeTab}".`
                    : 'Jika menemukan fasilitas rusak, laporkan agar segera ditangani.'
                }
                ctaText={isWarga ? 'Buat Laporan Baru' : undefined}
                onPressCta={isWarga ? () => setViewMode('form') : undefined}
              />
            }
            renderItem={({ item }) => {
              const stage = item.stage || (item.status === 'Selesai' ? 4 : item.status === 'Sedang Diproses' ? 3 : 1);
              const unread = isPengaduanUnread ? isPengaduanUnread(item) : false;
              const responses = item.tanggapanList || [];
              const latestTgp = responses.length > 0 ? responses[responses.length - 1] : (item.tanggapan ? { pesan: item.tanggapan, responderName: 'Petugas' } : null);

              // Target recipient badge style
              const targetLabel = item.tujuan === 'rw'
                ? 'Tujuan: Ketua RW'
                : item.tujuan === 'both'
                ? 'Tujuan: RT & RW (Bersama)'
                : 'Tujuan: Ketua RT';

              const targetChipStyle = item.tujuan === 'rw'
                ? styles.targetChipRw
                : item.tujuan === 'both'
                ? styles.targetChipBoth
                : styles.targetChipRt;

              const targetTextStyle = item.tujuan === 'rw'
                ? styles.targetTextRw
                : item.tujuan === 'both'
                ? styles.targetTextBoth
                : styles.targetTextRt;

              return (
                <Pressable
                  onPress={() => handleOpenDetail(item)}
                  style={[styles.reportCard, unread && styles.reportCardUnread]}
                  accessibilityRole="button"
                  accessibilityLabel={`Aduan ${item.judul}, status ${item.status}${unread ? ', ada update belum dibaca' : ''}`}
                >
                  {/* Top Bar with Target, Unread Badge, and Status */}
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.targetAndUnreadWrap}>
                      <View style={[styles.targetChip, targetChipStyle]}>
                        <Text style={[styles.targetText, targetTextStyle]}>{targetLabel}</Text>
                      </View>

                      {unread && (
                        <View style={styles.unreadTag}>
                          <View style={styles.unreadDot} />
                          <Text style={styles.unreadTagText}>
                            {isWarga ? 'TANGGAPAN BARU' : 'ADUAN BARU'}
                          </Text>
                        </View>
                      )}
                    </View>

                    <Badge
                      statusKey={
                        item.status === 'Selesai'
                          ? 'paid'
                          : item.status === 'Sedang Diproses'
                          ? 'pending'
                          : item.status === 'Ditolak'
                          ? 'rejected'
                          : 'info'
                      }
                      label={item.status}
                    />
                  </View>

                  <Text style={styles.reportTitle} numberOfLines={2}>{item.judul}</Text>
                  <Text style={styles.reportCategory}>Kategori: {item.kategori} • {item.tanggal || 'Terbaru'}</Text>

                  <Text style={styles.reportDesc} numberOfLines={2}>{item.deskripsi}</Text>

                  {item.lokasi ? (
                    <View style={styles.reportLocRow}>
                      <MapPin size={13} color={colors.textMuted} />
                      <Text style={styles.reportLocText} numberOfLines={1}>{item.lokasi}</Text>
                    </View>
                  ) : null}

                  {/* Stepper Tracking (§5.4.4) */}
                  {renderStepper(stage)}

                  {/* Latest Tanggapan Snippet */}
                  {latestTgp && (
                    <View style={styles.tanggapanBox}>
                      <View style={styles.tanggapanHeaderRow}>
                        <MessageSquare size={13} color={colors.primary} />
                        <Text style={styles.tanggapanTitle}>
                          {latestTgp.responderName || 'Petugas'}:
                        </Text>
                      </View>
                      <Text style={styles.tanggapanText} numberOfLines={2}>
                        "{latestTgp.pesan}"
                      </Text>
                    </View>
                  )}

                  <View style={styles.cardFooterRow}>
                    <Text style={styles.footerInfoText}>
                      Pelapor: {item.namaWarga || 'Warga'} • Tiket: {item.ticketNum || '-'}
                    </Text>
                    <Text style={styles.detailLinkText}>Lihat Detail &gt;</Text>
                  </View>
                </Pressable>
              );
            }}
          />

          {/* Floating Action Button (Only for Warga) */}
          {isWarga && (
            <Pressable
              onPress={() => setViewMode('form')}
              accessibilityRole="button"
              accessibilityLabel="Buat Laporan Baru"
              style={styles.fab}
            >
              <Plus size={24} color={colors.white} strokeWidth={2.5} />
            </Pressable>
          )}
        </View>
      )}

      {/* ===================== DETAIL & TANGGAPAN MODAL (§3 & §4) ===================== */}
      <Modal
        visible={detailModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDetailModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTicketNum}>#{selectedAduan?.ticketNum || 'ADUAN'}</Text>
                <Text style={styles.modalHeaderTitle} numberOfLines={1}>
                  Detail & Riwayat Aduan
                </Text>
              </View>
              <Pressable
                onPress={() => setDetailModalOpen(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.modalCloseBtn}
                accessibilityRole="button"
                accessibilityLabel="Tutup detail aduan"
              >
                <X size={20} color={colors.textPrimary} />
              </Pressable>
            </View>

            {/* Scrollable Content */}
            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={{ paddingBottom: 40 }}
              showsVerticalScrollIndicator={false}
            >
              {selectedAduan && (
                <>
                  {/* Status & Target Row */}
                  <View style={styles.detailMetaRow}>
                    <View style={styles.targetChip}>
                      <Text style={styles.targetText}>
                        {selectedAduan.tujuan === 'rw'
                          ? 'Tujuan: Ketua RW'
                          : selectedAduan.tujuan === 'both'
                          ? 'Tujuan: RT & RW (Bersama)'
                          : 'Tujuan: Ketua RT'}
                      </Text>
                    </View>
                    <Badge
                      statusKey={
                        selectedAduan.status === 'Selesai'
                          ? 'paid'
                          : selectedAduan.status === 'Sedang Diproses'
                          ? 'pending'
                          : selectedAduan.status === 'Ditolak'
                          ? 'rejected'
                          : 'info'
                      }
                      label={selectedAduan.status}
                    />
                  </View>

                  <Text style={styles.detailJudul}>{selectedAduan.judul}</Text>

                  {/* Info Grid */}
                  <View style={styles.detailInfoBox}>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Kategori:</Text>
                      <Text style={styles.infoVal}>{selectedAduan.kategori}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Pelapor:</Text>
                      <Text style={styles.infoVal}>
                        {selectedAduan.namaWarga || 'Warga'}
                        {selectedAduan.hideName ? ' (Identitas Disamarkan)' : ''}
                      </Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Tanggal Masuk:</Text>
                      <Text style={styles.infoVal}>{selectedAduan.tanggal || 'Hari ini'}</Text>
                    </View>
                    {selectedAduan.lokasi ? (
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Lokasi:</Text>
                        <Text style={styles.infoVal}>{selectedAduan.lokasi}</Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Deskripsi Lengkap */}
                  <Text style={styles.sectionHeaderTitle}>Rincian Laporan</Text>
                  <Text style={styles.detailDeskripsiText}>{selectedAduan.deskripsi}</Text>

                  {/* Lampiran Foto */}
                  {selectedAduan.photos && selectedAduan.photos.length > 0 && (
                    <View style={{ marginTop: 14 }}>
                      <Text style={styles.sectionHeaderTitle}>Foto Bukti Kendala</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                        {selectedAduan.photos.map((uri, idx) => (
                          <View key={idx} style={styles.photoThumbWrap}>
                            <Image source={{ uri }} style={styles.photoThumbLarge} />
                          </View>
                        ))}
                      </ScrollView>
                    </View>
                  )}

                  {/* Stepper Status */}
                  <View style={{ marginTop: 16 }}>
                    <Text style={styles.sectionHeaderTitle}>Status Penanganan</Text>
                    {renderStepper(
                      selectedAduan.stage ||
                        (selectedAduan.status === 'Selesai'
                          ? 4
                          : selectedAduan.status === 'Sedang Diproses'
                          ? 3
                          : 1)
                    )}
                  </View>

                  {/* Thread Riwayat Tanggapan (§3 & §4) */}
                  <View style={styles.threadSection}>
                    <View style={styles.threadHeaderRow}>
                      <MessageSquare size={16} color={colors.primary} />
                      <Text style={styles.threadHeaderTitle}>
                        Riwayat Tanggapan & Tindak Lanjut
                      </Text>
                    </View>

                    {selectedAduan.tanggapanList && selectedAduan.tanggapanList.length > 0 ? (
                      selectedAduan.tanggapanList.map((tgp, idx) => {
                        const isOfficial = tgp.responderRole === 'rt' || tgp.responderRole === 'rw' || tgp.responderRole === 'pengurus';
                        return (
                          <View
                            key={tgp.id || idx}
                            style={[
                              styles.threadBubble,
                              isOfficial ? styles.threadBubbleOfficial : styles.threadBubbleWarga,
                            ]}
                          >
                            <View style={styles.threadAuthorRow}>
                              <Text style={styles.threadAuthorName}>
                                {tgp.responderName || (isOfficial ? 'Pengurus' : 'Warga')}
                              </Text>
                              <View style={styles.roleTag}>
                                <Text style={styles.roleTagText}>
                                  {tgp.responderRole?.toUpperCase() || 'OFFICIAL'}
                                </Text>
                              </View>
                            </View>

                            <Text style={styles.threadMessageText}>{tgp.pesan}</Text>

                            <View style={styles.threadFooterRow}>
                              {tgp.statusAfter && (
                                <Text style={styles.threadStatusAfter}>
                                  Status: {tgp.statusAfter}
                                </Text>
                              )}
                              <Text style={styles.threadTimestamp}>
                                {tgp.created_at
                                  ? new Date(tgp.created_at).toLocaleTimeString('id-ID', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })
                                  : ''}
                              </Text>
                            </View>
                          </View>
                        );
                      })
                    ) : selectedAduan.tanggapan ? (
                      /* Fallback legacy single response */
                      <View style={[styles.threadBubble, styles.threadBubbleOfficial]}>
                        <View style={styles.threadAuthorRow}>
                          <Text style={styles.threadAuthorName}>Pengurus Lingkungan</Text>
                        </View>
                        <Text style={styles.threadMessageText}>{selectedAduan.tanggapan}</Text>
                      </View>
                    ) : (
                      <View style={styles.threadEmptyBox}>
                        <Clock size={20} color={colors.textMuted} />
                        <Text style={styles.threadEmptyText}>
                          Belum ada tanggapan resmi dari RT/RW.
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Form Tanggapan untuk Pengurus / RT / RW (§4 & §5) */}
                  {(!isWarga || isAdminLoggedIn) && (
                    <View style={styles.replyFormCard}>
                      <Text style={styles.replyFormTitle}>Beri Tanggapan & Perbarui Status</Text>

                      {/* Status Selector Chips */}
                      <Text style={styles.replyFormSubtitle}>Ubah Status Penanganan:</Text>
                      <View style={styles.statusChoiceRow}>
                        {[
                          { id: 'Sedang Diproses', label: 'Diproses' },
                          { id: 'Selesai', label: 'Selesai' },
                          { id: 'Ditolak', label: 'Tolak' },
                        ].map((sc) => {
                          const isSel = newStatusChoice === sc.id;
                          return (
                            <Pressable
                              key={sc.id}
                              onPress={() => setNewStatusChoice(sc.id)}
                              style={[
                                styles.statusChip,
                                isSel && styles.statusChipActive,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.statusChipText,
                                  isSel && styles.statusChipTextActive,
                                ]}
                              >
                                {sc.label}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>

                      {/* Input Tanggapan */}
                      <Input
                        multiline
                        placeholder="Tuliskan keterangan tindak lanjut penanganan untuk warga..."
                        value={tanggapanText}
                        onChangeText={setTanggapanText}
                        maxLength={300}
                        style={{ marginTop: 10, minHeight: 70 }}
                      />

                      <Button
                        title="Kirim Tanggapan & Notifikasi"
                        variant="primary"
                        loading={submittingTanggapan}
                        onPress={handleKirimTanggapan}
                        icon={<Send size={16} color="#FFFFFF" />}
                        style={{ marginTop: 12 }}
                      />
                    </View>
                  )}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background, // #F8FAFC
  },
  header: {
    height: layout.headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    minWidth: 48,
  },
  backBtnText: {
    fontFamily: typography.label.fontFamily,
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: typography.h3.fontFamily,
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: colors.primary,
  },
  tabButtonText: {
    fontFamily: typography.label.fontFamily,
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  tabButtonTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  formScroll: {
    padding: 16,
    paddingBottom: 160,
  },
  formSection: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontFamily: typography.labelSm.fontFamily,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary, // #475569
    fontWeight: '600',
    marginBottom: 8,
  },
  tujuanRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tujuanChip: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: radius.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
  },
  tujuanChipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySubtle,
  },
  tujuanChipLabel: {
    fontFamily: typography.label.fontFamily,
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  tujuanChipLabelSelected: {
    color: colors.primary,
  },
  tujuanChipDesc: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  tujuanChipDescSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  photoSlotsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  photoSlotEmpty: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoSlotFilled: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: radius.md,
    overflow: 'hidden',
    position: 'relative',
  },
  photoThumb: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removePhotoBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(15,23,42,0.64)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  kategoriChip: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceMuted,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kategoriChipSelected: {
    backgroundColor: colors.primary,
  },
  kategoriChipText: {
    fontFamily: typography.label.fontFamily,
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  kategoriChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  counterText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'right',
    marginTop: -8,
    marginBottom: 4,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
    marginBottom: 16,
  },
  switchLabel: {
    fontFamily: typography.body.fontFamily,
    fontSize: 14,
    color: colors.textPrimary,
  },
  estimateBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  estimateText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    color: colors.textSecondary,
  },
  submitCtaWrapper: {
    marginTop: 8,
  },
  // Ticket Result Card (§5.4.4)
  ticketCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    ...Platform.select({
      web: { boxShadow: shadows.card },
      default: {
        shadowColor: colors.textPrimary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 16,
        elevation: 3,
      },
    }),
  },
  ticketHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  ticketTitle: {
    fontFamily: typography.h2.fontFamily,
    fontSize: 18,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  ticketNumRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  ticketNumLabel: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 13,
    color: colors.textMuted,
    marginRight: 6,
  },
  ticketNumValue: {
    fontFamily: typography.mono.fontFamily,
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  ticketTargetBox: {
    backgroundColor: colors.surfaceMuted,
    padding: 12,
    borderRadius: radius.md,
    marginTop: 10,
  },
  ticketTargetLabel: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    color: colors.textMuted,
  },
  ticketTargetVal: {
    fontFamily: typography.label.fontFamily,
    fontSize: 13,
    color: colors.primary,
    fontWeight: '700',
    marginTop: 2,
  },
  // Stepper styles
  stepperContainer: {
    marginVertical: 14,
  },
  stepperPointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  stepperLine: {
    flex: 1,
    height: 3,
  },
  stepperDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperDotCompleted: {
    backgroundColor: colors.primary,
  },
  stepperDotActive: {
    backgroundColor: colors.primarySubtle,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  stepperDotPending: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: colors.borderStrong,
  },
  stepperLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  stepperLabel: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    width: 60,
  },
  // List Mode
  listContent: {
    padding: 16,
    paddingBottom: 190,
  },
  reportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
    ...Platform.select({
      web: { boxShadow: shadows.card },
      default: {
        shadowColor: colors.textPrimary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 2,
      },
    }),
  },
  reportCardUnread: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FFFDFD',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  targetAndUnreadWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
    marginRight: 8,
  },
  targetChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  targetChipRt: {
    backgroundColor: '#E0F2FE',
  },
  targetChipRw: {
    backgroundColor: '#EDE9FE',
  },
  targetChipBoth: {
    backgroundColor: '#FCE7F3',
  },
  targetText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    fontWeight: '700',
    color: '#0369A1',
  },
  targetTextRt: {
    color: '#0284C7',
  },
  targetTextRw: {
    color: '#6D28D9',
  },
  targetTextBoth: {
    color: '#BE185D',
  },
  unreadTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  unreadTagText: {
    fontFamily: typography.labelSm.fontFamily,
    fontSize: 10,
    fontWeight: '800',
    color: '#DC2626',
    letterSpacing: 0.3,
  },
  reportTitle: {
    fontFamily: typography.h3.fontFamily,
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: '700',
    marginBottom: 2,
  },
  reportCategory: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 6,
  },
  reportDesc: {
    fontFamily: typography.body.fontFamily,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  reportLocRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  reportLocText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    color: colors.textMuted,
  },
  tanggapanBox: {
    backgroundColor: colors.primarySubtle,
    borderRadius: radius.md,
    padding: 10,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  tanggapanHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  tanggapanTitle: {
    fontFamily: typography.labelSm.fontFamily,
    fontSize: 12,
    color: colors.primary,
    fontWeight: '700',
  },
  tanggapanText: {
    fontFamily: typography.body.fontFamily,
    fontSize: 13,
    color: colors.textPrimary,
    lineHeight: 18,
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  footerInfoText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    color: colors.textMuted,
  },
  detailLinkText: {
    fontFamily: typography.labelSm.fontFamily,
    fontSize: 12,
    color: colors.primary,
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    bottom: 104,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { boxShadow: '0 4px 14px rgba(6, 78, 59, 0.35)' },
      default: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.40,
        shadowRadius: 14,
        elevation: 7,
      },
    }),
  },
  // Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.65)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '88%',
    paddingTop: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTicketNum: {
    fontFamily: typography.mono.fontFamily,
    fontSize: 11,
    color: colors.primary,
    fontWeight: '700',
  },
  modalHeaderTitle: {
    fontFamily: typography.h2.fontFamily,
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '700',
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  detailMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  detailJudul: {
    fontFamily: typography.h2.fontFamily,
    fontSize: 18,
    color: colors.textPrimary,
    fontWeight: '700',
    lineHeight: 24,
    marginBottom: 12,
  },
  detailInfoBox: {
    backgroundColor: colors.surfaceMuted,
    padding: 12,
    borderRadius: radius.md,
    gap: 6,
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  infoLabel: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    color: colors.textMuted,
    width: 100,
  },
  infoVal: {
    flex: 1,
    fontFamily: typography.label.fontFamily,
    fontSize: 12,
    color: colors.textPrimary,
    fontWeight: '600',
    textAlign: 'right',
  },
  sectionHeaderTitle: {
    fontFamily: typography.h3.fontFamily,
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 6,
  },
  detailDeskripsiText: {
    fontFamily: typography.body.fontFamily,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  photoThumbWrap: {
    width: 120,
    height: 120,
    borderRadius: radius.md,
    overflow: 'hidden',
    marginRight: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  photoThumbLarge: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  threadSection: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  threadHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  threadHeaderTitle: {
    fontFamily: typography.h3.fontFamily,
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  threadBubble: {
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 10,
  },
  threadBubbleOfficial: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  threadBubbleWarga: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border,
  },
  threadAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  threadAuthorName: {
    fontFamily: typography.label.fontFamily,
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  roleTag: {
    backgroundColor: colors.primarySubtle,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roleTagText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 9,
    fontWeight: '800',
    color: colors.primary,
  },
  threadMessageText: {
    fontFamily: typography.body.fontFamily,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  threadFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingTop: 4,
  },
  threadStatusAfter: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    color: colors.primary,
    fontWeight: '600',
  },
  threadTimestamp: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 10,
    color: colors.textMuted,
  },
  threadEmptyBox: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 6,
  },
  threadEmptyText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    color: colors.textMuted,
  },
  replyFormCard: {
    marginTop: 18,
    padding: 14,
    borderRadius: radius.lg,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border,
  },
  replyFormTitle: {
    fontFamily: typography.h3.fontFamily,
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '700',
    marginBottom: 8,
  },
  replyFormSubtitle: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  statusChoiceRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statusChip: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: radius.sm,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  statusChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySubtle,
  },
  statusChipText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  statusChipTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
});
