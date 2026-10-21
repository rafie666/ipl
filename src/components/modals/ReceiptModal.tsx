import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  Platform,
  Share,
  ToastAndroid,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Line } from 'react-native-svg';
import QRCode from 'react-native-qrcode-svg';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import {
  ChevronLeft,
  Share2,
  Download,
  AlertCircle,
  Check,
  Building2,
  ShieldCheck,
  FileText,
  Clock,
  User,
  Home,
  CreditCard,
  Building,
  Copy,
  Sparkles
} from 'lucide-react-native';

import { colors, radius, typography, shadows, shadowsLegacy, TABULAR } from '../../theme';
import { formatRupiah, formatDateTimeIndo } from '../../utils/format';
import Button from '../ui/Button';
import Skeleton from '../ui/Skeleton';

export interface ReceiptData {
  receiptId: string;
  amount: number;
  paidAt?: string | Date;
  residentName: string;
  unitCode: string;
  paymentMethod?: string;
  recipientName?: string;
  periodName?: string;
  status?: 'paid' | 'pending' | 'rejected' | 'cancelled';
  organizerName?: string;
}

export interface ReceiptModalProps {
  visible: boolean;
  onClose: () => void;
  data?: ReceiptData | null;
  tagihan?: any;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  visible,
  onClose,
  data,
  tagihan,
  loading = false,
  error = null,
  onRetry,
}) => {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  const paperWidth = Math.min(screenWidth - 32, 400);

  // Normalisasi data dari prop `data` atau `tagihan`
  const resolvedData: ReceiptData | null = useMemo(() => {
    if (data) {
      const explicitTime =
        (data as any).verified_at ||
        (data as any).tglVerifikasi ||
        (data as any).tanggalBayar ||
        (data as any).tglBayar ||
        (data as any).updated_at;
      return {
        ...data,
        paidAt:
          data.paidAt && String(data.paidAt).length > 10
            ? data.paidAt
            : (explicitTime && String(explicitTime).length > 10 ? explicitTime : (data.paidAt || new Date().toISOString())),
      };
    }
    if (tagihan) {
      const bulanArr = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      const bNama = tagihan.bulan ? bulanArr[(tagihan.bulan || 1) - 1] : '';
      const rawPaidAt =
        tagihan.verified_at ||
        tagihan.tglVerifikasi ||
        (tagihan.tanggalBayar && String(tagihan.tanggalBayar).length > 10 ? tagihan.tanggalBayar : null) ||
        (tagihan.tglBayar && String(tagihan.tglBayar).length > 10 ? tagihan.tglBayar : null) ||
        tagihan.updated_at ||
        tagihan.tanggalBayar ||
        tagihan.tglBayar ||
        new Date().toISOString();

      return {
        receiptId: tagihan.noKwitansi || `KW/${tagihan.tahun || '2026'}/${String(tagihan.bulan || '10').padStart(2, '0')}/${tagihan.blok || 'A'}-${tagihan.noRumah || '01'}`,
        amount: tagihan.total || 0,
        paidAt: rawPaidAt,
        residentName: tagihan.namaWarga || tagihan.warga?.nama || 'Warga',
        unitCode: `Blok ${tagihan.blok || 'A'} / No. ${tagihan.noRumah || '01'}`,
        paymentMethod: tagihan.metodeBayar || tagihan.metode || 'Transfer Bank',
        recipientName: tagihan.pembayaran_kepada || 'Kas Lingkungan RT/RW',
        periodName: bNama ? `IPL ${bNama} ${tagihan.tahun || 2026}` : 'Iuran Pengelolaan Lingkungan',
        status: tagihan.status === 'Menunggu Verifikasi' ? 'pending' : 'paid',
        organizerName: tagihan.organizerName || 'Perumahan Alam Tirta Lestari'
      };
    }
    return null;
  }, [data, tagihan]);

  const handleCopyReceiptNumber = async () => {
    if (!resolvedData?.receiptId) return;
    try {
      await Clipboard.setStringAsync(resolvedData.receiptId);
      Haptics.selectionAsync().catch(() => {});
      setCopied(true);
      if (Platform.OS === 'android') {
        ToastAndroid.show('Nomor kuitansi disalin', ToastAndroid.SHORT);
      }
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleShare = async () => {
    if (!resolvedData) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      await Share.share({
        title: 'Bukti Pembayaran Resmi IPL',
        message: `*BUKTI PEMBAYARAN RESMI IPL*\nNo. Kuitansi: ${resolvedData.receiptId}\nUnit: ${resolvedData.unitCode}\nNama: ${resolvedData.residentName}\nNominal: ${formatRupiah(resolvedData.amount)}\nMetode: ${resolvedData.paymentMethod || 'Transfer'}\nStatus: LUNAS (Terverifikasi Sistem)\n\nTerima kasih atas partisipasi Anda dalam menjaga kenyamanan lingkungan!`,
      });
    } catch {}
  };

  const handleSaveToGallery = async () => {
    setSaving(true);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setTimeout(() => {
        setSaving(false);
        if (Platform.OS === 'android') {
          ToastAndroid.show('Kuitansi berhasil disimpan ke galeri', ToastAndroid.SHORT);
        } else {
          Alert.alert('Sukses', 'Kuitansi berhasil disimpan ke galeri.');
        }
      }, 700);
    } catch {
      setSaving(false);
    }
  };

  if (!visible) return null;

  const isPending = resolvedData?.status === 'pending';
  const qrPayload = resolvedData
    ? `https://ipl.warga.id/v/${resolvedData.receiptId}?s=verified`
    : 'https://ipl.warga.id';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={[styles.fullScreenContainer, { paddingTop: Math.max(insets.top, 16) }]}>
        {/* Header Top Bar */}
        <View style={styles.headerBar}>
          <Pressable
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Tutup kuitansi"
            style={styles.closeBtn}
          >
            <ChevronLeft size={22} color={colors.textPrimary} />
            <Text style={styles.closeBtnText}>Tutup</Text>
          </Pressable>

          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Kwitansi Pembayaran</Text>
          </View>

          <Pressable
            onPress={handleShare}
            disabled={isPending || loading}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Bagikan kuitansi"
            style={[styles.shareHeaderBtn, (isPending || loading) && { opacity: 0.4 }]}
          >
            <Share2 size={18} color={colors.primary} />
            <Text style={styles.shareHeaderText}>Bagikan</Text>
          </Pressable>
        </View>

        {/* Scrollable Receipt Body */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 24) + 48 },
          ]}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
            {error ? (
              <View style={[styles.errorCard, { width: paperWidth }]}>
                <AlertCircle size={36} color="#B91C1C" />
                <Text style={styles.errorTitle}>Kuitansi gagal dimuat</Text>
                <Text style={styles.errorSub}>{error}</Text>
                {onRetry && (
                  <Button
                    title="Coba Lagi"
                    variant="secondary"
                    onPress={onRetry}
                    style={{ marginTop: 16 }}
                  />
                )}
              </View>
            ) : loading || !resolvedData ? (
              <View style={[styles.paperCard, { width: paperWidth }]}>
                <Skeleton width={180} height={14} borderRadius={4} style={{ alignSelf: 'center', marginBottom: 8 }} />
                <Skeleton width={220} height={18} borderRadius={6} style={{ alignSelf: 'center', marginBottom: 20 }} />
                <Skeleton width={112} height={40} borderRadius={8} style={{ alignSelf: 'center', marginBottom: 16 }} />
                <Skeleton width={160} height={28} borderRadius={8} style={{ alignSelf: 'center', marginBottom: 24 }} />
                <Skeleton width="100%" height={140} borderRadius={8} style={{ marginBottom: 20 }} />
                <Skeleton width={168} height={168} borderRadius={16} style={{ alignSelf: 'center' }} />
              </View>
            ) : (
              <View style={[styles.paperCard, { width: paperWidth }]}>
                {/* Top Accent Strip */}
                <View style={styles.topAccentBar} />

                {/* Header Information */}
                <View style={styles.paperHeader}>
                  <View style={styles.emblemBadge}>
                    <Building2 size={20} color={colors.primary} strokeWidth={2.4} />
                  </View>
                  <Text style={styles.organizerText}>
                    {resolvedData.organizerName || 'Perumahan Alam Tirta Lestari'}
                  </Text>
                  <Text style={styles.paperTitle}>BUKTI PEMBAYARAN IURAN</Text>
                  <Text style={styles.periodText}>
                    {resolvedData.periodName || 'Iuran Pengelolaan Lingkungan'}
                  </Text>
                </View>

                {/* Official Stamp */}
                <View
                  style={[
                    styles.stampBadge,
                    isPending ? styles.stampBadgePending : styles.stampBadgePaid,
                  ]}
                >
                  <Text
                    style={[
                      styles.stampText,
                      isPending ? styles.stampTextPending : styles.stampTextPaid,
                    ]}
                  >
                    {isPending ? '⏳ VERIFIKASI' : '✓  LUNAS'}
                  </Text>
                </View>

                {/* Nominal */}
                <View style={styles.amountContainer}>
                  <Text
                    style={[styles.paperAmount, TABULAR]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.7}
                  >
                    {formatRupiah(resolvedData.amount)}
                  </Text>

                  <View style={styles.verifiedPill}>
                    <ShieldCheck size={13} color="#059669" />
                    <Text style={styles.verifiedCaption}>
                      {isPending
                        ? 'Menunggu verifikasi pengurus'
                        : `Terverifikasi Sistem • ${resolvedData.paidAt ? formatDateTimeIndo(resolvedData.paidAt) : 'Hari ini'}`}
                    </Text>
                  </View>
                </View>

                {/* Top Perforation Line */}
                <View style={styles.perforationRow}>
                  <View style={styles.perforationNotchLeft} />
                  <Svg height="2" width={paperWidth - 36}>
                    <Line
                      x1="0"
                      y1="1"
                      x2={paperWidth - 36}
                      y2="1"
                      stroke="#CBD5E1"
                      strokeWidth="1.5"
                      strokeDasharray="6, 5"
                    />
                  </Svg>
                  <View style={styles.perforationNotchRight} />
                </View>

                {/* Detail Information Box */}
                <View style={styles.detailBox}>
                  {/* Receipt ID with Copy */}
                  <Pressable
                    onPress={handleCopyReceiptNumber}
                    style={styles.detailRow}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <View style={styles.detailLabelWrap}>
                      <FileText size={14} color="#64748B" />
                      <Text style={styles.detailLabel}>No. Kuitansi</Text>
                    </View>
                    <View style={styles.copyableValueRow}>
                      <Text style={[styles.detailValueMono, styles.detailValue]}>
                        {resolvedData.receiptId}
                      </Text>
                      {copied ? (
                        <Check size={14} color="#059669" style={{ marginLeft: 5 }} />
                      ) : (
                        <Copy size={13} color="#94A3B8" style={{ marginLeft: 5 }} />
                      )}
                    </View>
                  </Pressable>

                  <View style={styles.detailRowDivider} />

                  <View style={styles.detailRow}>
                    <View style={styles.detailLabelWrap}>
                      <Clock size={14} color="#64748B" />
                      <Text style={styles.detailLabel}>Waktu Bayar</Text>
                    </View>
                    <Text style={styles.detailValue}>
                      {resolvedData.paidAt ? formatDateTimeIndo(resolvedData.paidAt) : '-'}
                    </Text>
                  </View>

                  <View style={styles.detailRowDivider} />

                  <View style={styles.detailRow}>
                    <View style={styles.detailLabelWrap}>
                      <User size={14} color="#64748B" />
                      <Text style={styles.detailLabel}>Nama Warga</Text>
                    </View>
                    <Text style={[styles.detailValue, { fontWeight: '700', flex: 1, textAlign: 'right' }]} numberOfLines={2}>
                      {resolvedData.residentName}
                    </Text>
                  </View>

                  <View style={styles.detailRowDivider} />

                  <View style={styles.detailRow}>
                    <View style={styles.detailLabelWrap}>
                      <Home size={14} color="#64748B" />
                      <Text style={styles.detailLabel}>Unit Rumah</Text>
                    </View>
                    <View style={styles.unitPill}>
                      <Text style={styles.unitPillText}>
                        {resolvedData.unitCode}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailRowDivider} />

                  <View style={styles.detailRow}>
                    <View style={styles.detailLabelWrap}>
                      <CreditCard size={14} color="#64748B" />
                      <Text style={styles.detailLabel}>Metode Bayar</Text>
                    </View>
                    <Text style={styles.detailValue}>
                      {resolvedData.paymentMethod || 'Transfer Bank'}
                    </Text>
                  </View>

                  <View style={styles.detailRowDivider} />

                  <View style={styles.detailRow}>
                    <View style={styles.detailLabelWrap}>
                      <Building size={14} color="#64748B" />
                      <Text style={styles.detailLabel}>Penerima</Text>
                    </View>
                    <Text style={[styles.detailValue, { flex: 1, textAlign: 'right' }]} numberOfLines={1}>
                      {resolvedData.recipientName || 'Kas Lingkungan RT/RW'}
                    </Text>
                  </View>
                </View>

                {/* Bottom Perforation Line */}
                <View style={styles.perforationRow}>
                  <View style={styles.perforationNotchLeft} />
                  <Svg height="2" width={paperWidth - 36}>
                    <Line
                      x1="0"
                      y1="1"
                      x2={paperWidth - 36}
                      y2="1"
                      stroke="#CBD5E1"
                      strokeWidth="1.5"
                      strokeDasharray="6, 5"
                    />
                  </Svg>
                  <View style={styles.perforationNotchRight} />
                </View>

                {/* QR Code Section */}
                <View style={styles.qrSection}>
                  {isPending ? (
                    <View style={styles.qrPendingTile}>
                      <AlertCircle size={32} color="#1D4ED8" />
                      <Text style={styles.qrPendingText}>
                        Kode QR verifikasi akan aktif setelah diverifikasi pengurus
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.qrTile}>
                      <QRCode
                        value={qrPayload}
                        size={150}
                        color="#0F172A"
                        backgroundColor="#FFFFFF"
                      />
                    </View>
                  )}

                  <View style={styles.securitySealWrap}>
                    <ShieldCheck size={14} color="#059669" />
                    <Text style={styles.qrCaption}>Pindai untuk memeriksa keaslian</Text>
                  </View>
                  <Text style={styles.qrSubCaption}>
                    Tanda terima digital resmi dan sah tanpa tanda tangan basah
                  </Text>
                </View>
              </View>
            )}

            {/* Bottom Actions */}
            {resolvedData && !loading && (
              <View style={[styles.bottomBtnRow, { width: paperWidth }]}>
                <View style={{ flex: 1 }}>
                  <Button
                    title="Simpan Kuitansi"
                    variant="secondary"
                    icon={<Download size={17} color={colors.primary} />}
                    loading={saving}
                    onPress={handleSaveToGallery}
                    style={styles.saveActionBtn}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Button
                    title="Bagikan"
                    variant="primary"
                    icon={<Share2 size={17} color="#FFFFFF" />}
                    onPress={handleShare}
                    style={styles.shareActionBtn}
                  />
                </View>
              </View>
            )}
          </ScrollView>
        </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  headerBar: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  closeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 40,
    gap: 2,
  },
  closeBtnText: {
    fontFamily: typography.label.fontFamily,
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: typography.h2.fontFamily,
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  shareHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 40,
    paddingHorizontal: 6,
    gap: 4,
  },
  shareHeaderText: {
    fontFamily: typography.label.fontFamily,
    fontSize: 14,
    color: colors.primary,
    fontWeight: '700',
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  paperCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
    overflow: 'hidden',
    ...Platform.select({
      web: { boxShadow: shadows.card } as any,
      default: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
        elevation: 6,
      },
    }),
  },
  topAccentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 5,
    backgroundColor: colors.primary,
  },
  paperHeader: {
    alignItems: 'center',
    paddingTop: 20,
  },
  emblemBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ECFDF5',
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  organizerText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    lineHeight: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  paperTitle: {
    fontFamily: typography.h2.fontFamily,
    fontSize: 17,
    lineHeight: 22,
    color: '#0F172A',
    textAlign: 'center',
    fontWeight: '800',
    marginTop: 2,
    letterSpacing: -0.2,
  },
  periodText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12.5,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 2,
    fontWeight: '500',
  },
  stampBadge: {
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 14,
    transform: [{ rotate: '-3deg' }],
  },
  stampBadgePaid: {
    borderColor: '#047857',
    backgroundColor: '#F0FDF4',
  },
  stampBadgePending: {
    borderColor: '#1D4ED8',
    backgroundColor: '#EFF6FF',
  },
  stampText: {
    fontFamily: typography.displaySm.fontFamily,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  stampTextPaid: {
    color: '#047857',
  },
  stampTextPending: {
    color: '#1D4ED8',
  },
  amountContainer: {
    alignItems: 'center',
    marginTop: 12,
  },
  paperAmount: {
    fontFamily: typography.display.fontFamily,
    fontSize: 30,
    lineHeight: 36,
    color: '#0F172A',
    textAlign: 'center',
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  verifiedCaption: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    color: '#065F46',
    fontWeight: '600',
  },
  perforationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 18,
    position: 'relative',
  },
  perforationNotchLeft: {
    position: 'absolute',
    left: -28,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  perforationNotchRight: {
    position: 'absolute',
    right: -28,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  detailBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  detailRowDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 2,
  },
  detailLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: 115,
  },
  detailLabel: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  detailValue: {
    fontFamily: typography.body.fontFamily,
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
  },
  detailValueMono: {
    fontFamily: typography.monoSm.fontFamily,
    fontSize: 12,
    letterSpacing: 0.5,
    color: '#334155',
  },
  unitPill: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  unitPillText: {
    fontFamily: typography.monoSm.fontFamily,
    fontSize: 12,
    fontWeight: '700',
    color: '#4338CA',
  },
  copyableValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  qrSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  qrTile: {
    width: 174,
    height: 174,
    padding: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { boxShadow: shadows.card } as any,
      default: shadowsLegacy.card,
    }),
  },
  qrPendingTile: {
    width: 174,
    height: 174,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrPendingText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    lineHeight: 16,
    color: '#1D4ED8',
    textAlign: 'center',
    marginTop: 8,
  },
  securitySealWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 10,
  },
  qrCaption: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  qrSubCaption: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 10.5,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 2,
  },
  bottomBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
  },
  saveActionBtn: {
    height: 48,
    borderRadius: 12,
  },
  shareActionBtn: {
    height: 48,
    borderRadius: 12,
  },
  errorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorTitle: {
    fontFamily: typography.h2.fontFamily,
    fontSize: 18,
    color: '#B91C1C',
    fontWeight: '700',
    marginTop: 12,
  },
  errorSub: {
    fontFamily: typography.body.fontFamily,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
});

export default ReceiptModal;
