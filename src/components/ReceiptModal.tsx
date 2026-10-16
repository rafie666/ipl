import React, { useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  Animated,
  Platform,
  Share,
  ToastAndroid,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Line, Path, Rect } from 'react-native-svg';
import QRCode from 'react-native-qrcode-svg';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import {
  ChevronLeft,
  Share2,
  Download,
  AlertCircle,
  Check,
} from 'lucide-react-native';

import { colors, radius, typography, shadows, TABULAR } from '../theme';
import { formatRupiah, formatDateTimeIndo } from '../utils/format';
import Button from './ui/Button';
import Skeleton from './ui/Skeleton';

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
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  visible,
  onClose,
  data,
  loading = false,
  error = null,
  onRetry,
}) => {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  const paperWidth = Math.min(screenWidth - 32, 400);

  const handleCopyReceiptNumber = async () => {
    if (!data?.receiptId) return;
    try {
      await Clipboard.setStringAsync(data.receiptId);
      Haptics.selectionAsync().catch(() => {});
      setCopied(true);
      if (Platform.OS === 'android') {
        ToastAndroid.show('Nomor kuitansi disalin', ToastAndroid.SHORT);
      }
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleShare = async () => {
    if (!data) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      await Share.share({
        title: 'Bukti Pembayaran IPL',
        message: `Bukti Pembayaran Resmi IPL\nNo: ${data.receiptId}\nUnit: ${data.unitCode}\nNama: ${data.residentName}\nNominal: ${formatRupiah(data.amount)}\nStatus: LUNAS`,
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
          ToastAndroid.show('Tersimpan di galeri', ToastAndroid.SHORT);
        } else {
          Alert.alert('Sukses', 'Kuitansi tersimpan di galeri');
        }
      }, 700);
    } catch {
      setSaving(false);
    }
  };

  if (!visible) return null;

  const isPending = data?.status === 'pending';
  const qrPayload = data
    ? `https://ipl.warga.id/v/${data.receiptId}?s=verified`
    : 'https://ipl.warga.id';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.scrim}>
        <View style={[styles.sheetContainer, { paddingTop: Math.max(insets.top, 16) }]}>
          {/* Header Bar */}
          <View style={styles.headerBar}>
            <Pressable
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityRole="button"
              accessibilityLabel="Tutup kuitansi"
              style={styles.closeBtn}
            >
              <ChevronLeft size={24} color={colors.textPrimary} />
              <Text style={styles.closeBtnText}>Tutup</Text>
            </Pressable>

            <Pressable
              onPress={handleShare}
              disabled={isPending || loading}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityRole="button"
              accessibilityLabel="Bagikan kuitansi"
              style={[styles.shareHeaderBtn, (isPending || loading) && { opacity: 0.4 }]}
            >
              <Share2 size={20} color={colors.primary} />
              <Text style={styles.shareHeaderText}>Bagikan</Text>
            </Pressable>
          </View>

          {/* Scrollable Receipt Body */}
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: Math.max(insets.bottom, 16) + 24 },
            ]}
            showsVerticalScrollIndicator={false}
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
            ) : loading || !data ? (
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
                {/* Header Information */}
                <Text style={styles.organizerText}>
                  {data.organizerName || 'PENGELOLA RW 01 / RT 02'}
                </Text>
                <Text style={styles.paperTitle}>BUKTI PEMBAYARAN RESMI IPL</Text>

                {/* Stamp */}
                <View
                  style={[
                    styles.stampBadge,
                    isPending && styles.stampBadgePending,
                  ]}
                >
                  <Text
                    style={[
                      styles.stampText,
                      isPending && styles.stampTextPending,
                    ]}
                  >
                    {isPending ? 'VERIFIKASI' : '✓  LUNAS'}
                  </Text>
                </View>

                {/* Nominal */}
                <Text
                  style={[styles.paperAmount, TABULAR]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}
                >
                  {formatRupiah(data.amount)}
                </Text>

                <Text style={styles.verifiedCaption}>
                  {isPending
                    ? 'Menunggu verifikasi pengurus'
                    : `Terverifikasi sistem • ${data.paidAt ? formatDateTimeIndo(data.paidAt) : 'Hari ini'}`}
                </Text>

                {/* Top Perforation Line */}
                <View style={styles.perforationRow}>
                  <View style={styles.perforationNotchLeft} />
                  <Svg height="2" width={paperWidth - 32}>
                    <Line
                      x1="0"
                      y1="1"
                      x2={paperWidth - 32}
                      y2="1"
                      stroke="#CBD5E1"
                      strokeWidth="1.5"
                      strokeDasharray="6, 4"
                    />
                  </Svg>
                  <View style={styles.perforationNotchRight} />
                </View>

                {/* Detail Table */}
                <View style={styles.detailTable}>
                  {/* Receipt ID with Copy */}
                  <Pressable
                    onLongPress={handleCopyReceiptNumber}
                    style={styles.detailRow}
                  >
                    <Text style={styles.detailLabel}>No. Kuitansi</Text>
                    <View style={styles.copyableValueRow}>
                      <Text style={[styles.detailValueMono, styles.detailValue]}>
                        {data.receiptId}
                      </Text>
                      {copied && <Check size={14} color="#047857" style={{ marginLeft: 4 }} />}
                    </View>
                  </Pressable>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Waktu Bayar</Text>
                    <Text style={styles.detailValue}>
                      {data.paidAt ? formatDateTimeIndo(data.paidAt) : '-'}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Nama Warga</Text>
                    <Text style={[styles.detailValue, { flex: 1, textAlign: 'right' }]} numberOfLines={2}>
                      {data.residentName}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Unit</Text>
                    <Text style={[styles.detailValue, styles.detailValueMono]}>
                      {data.unitCode}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Metode</Text>
                    <Text style={styles.detailValue}>
                      {data.paymentMethod || 'QRIS Dinamis'}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Penerima</Text>
                    <Text style={styles.detailValue}>
                      {data.recipientName || 'Kas Lingkungan RT 02'}
                    </Text>
                  </View>
                </View>

                {/* Bottom Perforation Line */}
                <View style={styles.perforationRow}>
                  <View style={styles.perforationNotchLeft} />
                  <Svg height="2" width={paperWidth - 32}>
                    <Line
                      x1="0"
                      y1="1"
                      x2={paperWidth - 32}
                      y2="1"
                      stroke="#CBD5E1"
                      strokeWidth="1.5"
                      strokeDasharray="6, 4"
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
                        QR tersedia setelah pembayaran terverifikasi
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.qrTile}>
                      <QRCode
                        value={qrPayload}
                        size={168}
                        color="#0F172A"
                        backgroundColor="#FFFFFF"
                      />
                    </View>
                  )}
                  <Text style={styles.qrCaption}>Pindai untuk memeriksa keaslian</Text>
                </View>
              </View>
            )}

            {/* Bottom Actions */}
            {data && !loading && (
              <View style={[styles.bottomBtnRow, { width: paperWidth }]}>
                <View style={{ flex: 1 }}>
                  <Button
                    title="Simpan Kuitansi"
                    variant="secondary"
                    icon={<Download size={18} color={colors.primary} />}
                    loading={saving}
                    onPress={handleSaveToGallery}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Button
                    title="Kirim WA"
                    variant="primary"
                    icon={<Share2 size={18} color={colors.primaryDark} />}
                    onPress={handleShare}
                  />
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: colors.scrim, // rgba(15, 23, 42, 0.48)
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: colors.background, // #F8FAFC
    borderTopLeftRadius: radius.xl, // 24
    borderTopRightRadius: radius.xl, // 24
    maxHeight: '94%',
    ...Platform.select({
      web: { boxShadow: shadows.sheet } as any,
      default: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.12,
        shadowRadius: 32,
        elevation: 16,
      },
    }),
  },
  headerBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  closeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    minWidth: 48,
  },
  closeBtnText: {
    fontFamily: typography.label.fontFamily,
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '700',
    marginLeft: 2,
  },
  shareHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    paddingHorizontal: 8,
  },
  shareHeaderText: {
    fontFamily: typography.label.fontFamily,
    fontSize: 14,
    color: colors.primary,
    fontWeight: '700',
    marginLeft: 6,
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  paperCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
    ...Platform.select({
      web: { boxShadow: shadows.card } as any,
      default: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 16,
        elevation: 3,
      },
    }),
  },
  organizerText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary, // #475569
    textAlign: 'center',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  paperTitle: {
    fontFamily: typography.h2.fontFamily,
    fontSize: 18,
    lineHeight: 24,
    color: colors.textPrimary,
    textAlign: 'center',
    fontWeight: '700',
    marginTop: 4,
  },
  stampBadge: {
    width: 112,
    height: 40,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#047857',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 16,
    transform: [{ rotate: '-4deg' }],
  },
  stampBadgePending: {
    borderColor: '#1D4ED8',
  },
  stampText: {
    fontFamily: typography.displaySm.fontFamily,
    fontSize: 18,
    lineHeight: 22,
    color: '#047857',
    fontWeight: '800',
  },
  stampTextPending: {
    color: '#1D4ED8',
    fontSize: 15,
  },
  paperAmount: {
    fontFamily: typography.display.fontFamily,
    fontSize: 28,
    lineHeight: 34,
    color: colors.textPrimary,
    textAlign: 'center',
    fontWeight: '800',
    marginTop: 16,
  },
  verifiedCaption: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
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
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.background, // Matches outer background
  },
  perforationNotchRight: {
    position: 'absolute',
    right: -28,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.background,
  },
  detailTable: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 28,
  },
  detailLabel: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textMuted, // #64748B
    width: 110,
  },
  detailValue: {
    fontFamily: typography.body.fontFamily,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  detailValueMono: {
    fontFamily: typography.monoSm.fontFamily,
    fontSize: 12,
    letterSpacing: 0.5,
  },
  copyableValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qrSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  qrTile: {
    width: 184,
    height: 184,
    padding: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrPendingTile: {
    width: 184,
    height: 184,
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
    marginTop: 10,
  },
  qrCaption: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
  },
  bottomBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 20,
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
