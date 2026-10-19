import React, { useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  Animated,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Rect, Line } from 'react-native-svg';
import {
  Home,
  CheckCircle2,
  Clock,
  AlertCircle,
  Hourglass,
  Zap,
  Receipt,
  FileText,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { colors, radius, typography, layout, TABULAR } from '../theme';
import { formatRupiah, formatRupiahCompact } from '../utils/format';
import Skeleton from './ui/Skeleton';

export interface VirtualResidentCardProps {
  status?: 'paid' | 'unpaid' | 'overdue' | 'pending' | 'none';
  residentName?: string;
  unitCode?: string;
  periodLabel?: string;
  amount?: number;
  overdueDays?: number;
  billCount?: number;
  isOffline?: boolean;
  offlineTimestamp?: string;
  loading?: boolean;
  onPressCard?: () => void;
  onPressAction?: () => void;
}

export const VirtualResidentCard: React.FC<VirtualResidentCardProps> = ({
  status = 'unpaid',
  residentName = 'Warga',
  unitCode = 'Blok - / No. -',
  periodLabel,
  amount = 0,
  overdueDays = 0,
  billCount = 1,
  isOffline = false,
  offlineTimestamp,
  loading = false,
  onPressCard,
  onPressAction,
}) => {
  const { width: screenWidth } = useWindowDimensions();
  const cardScale = useRef(new Animated.Value(1)).current;
  const btnScale = useRef(new Animated.Value(1)).current;

  const safeWidth = screenWidth || 360;
  const cardWidth = Math.max(280, Math.min(safeWidth, layout.maxContentWidth) - 32);
  const cardHeight = Math.floor(cardWidth / layout.cardAspect);
  const innerWidth = cardWidth - 40;

  const handleCardPressIn = () => {
    if (loading) return;
    Animated.spring(cardScale, {
      toValue: 0.97,
      useNativeDriver: Platform.OS !== 'web',
      damping: 15,
      stiffness: 150,
      mass: 1,
    }).start();
  };

  const handleCardPressOut = () => {
    Animated.spring(cardScale, {
      toValue: 1,
      useNativeDriver: Platform.OS !== 'web',
      damping: 15,
      stiffness: 150,
      mass: 1,
    }).start();
  };

  const handleCardPress = () => {
    if (loading) return;
    try {
      Haptics.selectionAsync().catch(() => {});
    } catch {}
    onPressCard?.();
  };

  const handleBtnPressIn = () => {
    if (loading || status === 'pending') return;
    Animated.spring(btnScale, {
      toValue: 0.96,
      useNativeDriver: Platform.OS !== 'web',
      damping: 15,
      stiffness: 150,
      mass: 1,
    }).start();
  };

  const handleBtnPressOut = () => {
    Animated.spring(btnScale, {
      toValue: 1,
      useNativeDriver: Platform.OS !== 'web',
      damping: 15,
      stiffness: 150,
      mass: 1,
    }).start();
  };

  const handleBtnPress = (e?: any) => {
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    if (loading || status === 'pending') return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    } catch {}
    onPressAction?.();
  };

  // Status configuration (§4.1.4)
  const getStatusConfig = () => {
    switch (status) {
      case 'paid':
        return {
          pillBg: 'rgba(16,185,129,0.20)',
          pillBorder: 'rgba(16,185,129,0.40)',
          pillFg: '#A7F3D0',
          pillText: 'LUNAS',
          pillIcon: <CheckCircle2 size={14} color="#A7F3D0" strokeWidth={2.2} />,
          period: periodLabel || 'TERBAYAR OKTOBER 2026',
          btnBg: 'rgba(255,255,255,0.14)',
          btnBorder: 'rgba(255,255,255,0.30)',
          btnFg: '#FFFFFF',
          btnText: 'Lihat Kuitansi',
          btnIcon: <Receipt size={14} color="#FFFFFF" strokeWidth={2} />,
        };
      case 'overdue': {
        const days = Math.min(Math.max(overdueDays, 1), 99);
        const dayText = overdueDays > 99 ? 'LEWAT 99+ HARI' : `LEWAT ${days} HARI`;
        return {
          pillBg: 'rgba(254, 242, 242, 0.25)',
          pillBorder: 'rgba(254, 202, 202, 0.50)',
          pillFg: '#FEE2E2',
          pillText: dayText,
          pillIcon: <AlertCircle size={14} color="#FEE2E2" strokeWidth={2.2} />,
          period: periodLabel || 'TAGIHAN JATUH TEMPO',
          btnBg: '#D4F636',
          btnBorder: 'transparent',
          btnFg: '#022C22',
          btnText: 'Bayar 1-Tap',
          btnIcon: <Zap size={14} color="#022C22" strokeWidth={2.4} />,
        };
      }
      case 'pending':
        return {
          pillBg: 'rgba(239, 246, 255, 0.20)',
          pillBorder: 'rgba(191, 219, 254, 0.40)',
          pillFg: '#DBEAFE',
          pillText: 'VERIFIKASI',
          pillIcon: <Hourglass size={14} color="#DBEAFE" strokeWidth={2.2} />,
          period: periodLabel || 'MENUNGGU VERIFIKASI',
          btnBg: 'rgba(255,255,255,0.14)',
          btnBorder: 'transparent',
          btnFg: 'rgba(255,255,255,0.75)',
          btnText: 'Diproses',
          btnIcon: <Hourglass size={14} color="rgba(255,255,255,0.75)" strokeWidth={2} />,
        };
      case 'none':
        return {
          pillBg: 'rgba(240, 253, 244, 0.20)',
          pillBorder: 'rgba(187, 247, 208, 0.40)',
          pillFg: '#DCFCE7',
          pillText: 'LUNAS',
          pillIcon: <CheckCircle2 size={14} color="#DCFCE7" strokeWidth={2.2} />,
          period: 'BEBAS TAGIHAN',
          btnBg: 'rgba(255,255,255,0.18)',
          btnBorder: 'rgba(255,255,255,0.35)',
          btnFg: '#FFFFFF',
          btnText: 'Lihat Arsip',
          btnIcon: <FileText size={14} color="#FFFFFF" strokeWidth={2} />,
        };
      case 'unpaid':
      default: {
        const period = billCount > 1 ? `TOTAL ${billCount} TAGIHAN` : (periodLabel || 'TAGIHAN BULAN INI');
        return {
          pillBg: 'rgba(255, 251, 235, 0.22)',
          pillBorder: 'rgba(253, 230, 138, 0.45)',
          pillFg: '#FEF3C7',
          pillText: 'BELUM BAYAR',
          pillIcon: <Clock size={14} color="#FEF3C7" strokeWidth={2.2} />,
          period,
          btnBg: '#D4F636',
          btnBorder: 'transparent',
          btnFg: '#022C22',
          btnText: 'Bayar 1-Tap',
          btnIcon: <Zap size={14} color="#022C22" strokeWidth={2.4} />,
        };
      }
    }
  };

  const statusConfig = getStatusConfig();
  const formattedNominal = amount >= 1000000000 ? formatRupiahCompact(amount) : formatRupiah(amount);
  const a11yNominal = formatRupiah(amount);

  return (
    <Animated.View
      style={[
        styles.cardContainer,
        {
          width: cardWidth,
          height: cardHeight,
          transform: [{ scale: cardScale }],
        },
      ]}
    >
      <Pressable
        onPress={handleCardPress}
        onPressIn={handleCardPressIn}
        onPressOut={handleCardPressOut}
        disabled={loading}
        accessibilityRole={Platform.OS === 'web' ? undefined : 'button'}
        accessibilityLabel={`${statusConfig.period}, ${a11yNominal}, ${statusConfig.pillText}, ${unitCode}, ${residentName}. Ketuk untuk melihat rincian`}
        style={styles.pressableFill}
      >
        <LinearGradient
          colors={['#064E3B', '#022C22']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Decorative Circles */}
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
            <Circle cx={cardWidth - 50} cy={-60} r={120} fill="rgba(255,255,255,0.08)" />
            <Circle cx={-30} cy={cardHeight + 40} r={90} fill="rgba(255,255,255,0.05)" />
          </Svg>
        </View>

        <View style={styles.cardPadding}>
          {loading ? (
            /* Skeleton Loading on Emerald Gradient */
            <View style={styles.skeletonContainer}>
              <View style={styles.rowA}>
                <Skeleton onCard width={96} height={12} borderRadius={6} />
                <Skeleton onCard width={88} height={26} borderRadius={13} />
              </View>
              <View style={styles.rowBSkeleton}>
                <Skeleton onCard width={120} height={10} borderRadius={5} style={{ marginBottom: 6 }} />
                <Skeleton onCard width={180} height={28} borderRadius={8} />
              </View>
              <View style={styles.flexSpace} />
              <View style={styles.rowC}>
                <View style={{ flex: 1 }}>
                  <Skeleton onCard width={130} height={14} borderRadius={7} style={{ marginBottom: 4 }} />
                  <Skeleton onCard width={100} height={12} borderRadius={6} />
                </View>
                <Skeleton onCard width={112} height={36} borderRadius={18} />
              </View>
            </View>
          ) : (
            <View style={styles.contentWrap}>
              {/* Row A: Residence Pass + Status Pill */}
              <View style={styles.rowA}>
                <View style={styles.residencePassRow}>
                  <Home size={14} color="rgba(255,255,255,0.75)" strokeWidth={2.2} />
                  <Text style={styles.residencePassText}>RESIDENCE PASS</Text>
                  {isOffline && (
                    <View
                      style={styles.offlineDot}
                      accessibilityHint={offlineTimestamp ? `Data terakhir diperbarui ${offlineTimestamp}` : undefined}
                    />
                  )}
                </View>

                <View
                  style={[
                    styles.statusPill,
                    {
                      backgroundColor: statusConfig.pillBg,
                      borderColor: statusConfig.pillBorder,
                      borderWidth: statusConfig.pillBorder !== 'transparent' ? 1 : 0,
                    },
                  ]}
                >
                  {statusConfig.pillIcon}
                  <Text
                    style={[styles.statusPillText, { color: statusConfig.pillFg }]}
                    numberOfLines={1}
                  >
                    {statusConfig.pillText}
                  </Text>
                </View>
              </View>

              {/* Row B: Period label + Nominal + Smartcard chip */}
              <View style={styles.rowB}>
                <View style={[styles.nominalCol, { maxWidth: innerWidth - 48 }]}>
                  <Text
                    style={styles.periodText}
                    numberOfLines={1}
                    maxFontSizeMultiplier={1.3}
                  >
                    {statusConfig.period}
                  </Text>
                  <Text
                    style={[styles.nominalText, TABULAR]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.6}
                  >
                    {formattedNominal}
                  </Text>
                </View>

                {/* Smartcard Chip Graphic (40x30, radius 6) */}
                <View style={styles.smartcardChip}>
                  <LinearGradient
                    colors={['#F1F5F9', '#CBD5E1']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.chipGradient}
                  >
                    <Svg width="40" height="30" viewBox="0 0 40 30">
                      <Rect x="0.5" y="0.5" width="39" height="29" rx="5.5" stroke="rgba(255,255,255,0.40)" strokeWidth="1" fill="none" />
                      <Line x1="14" y1="0" x2="14" y2="30" stroke="#94A3B8" strokeWidth="1" strokeOpacity="0.6" />
                      <Line x1="26" y1="0" x2="26" y2="30" stroke="#94A3B8" strokeWidth="1" strokeOpacity="0.6" />
                      <Line x1="0" y1="15" x2="40" y2="15" stroke="#94A3B8" strokeWidth="1" strokeOpacity="0.6" />
                      <Rect x="14" y="9" width="12" height="12" rx="3" stroke="#94A3B8" strokeWidth="1" strokeOpacity="0.6" fill="none" />
                    </Svg>
                  </LinearGradient>
                </View>
              </View>

              <View style={styles.flexSpace} />

              {/* Row C: Resident Name / Unit + Mini CTA Button */}
              <View style={styles.rowC}>
                <View style={[styles.residentCol, { maxWidth: innerWidth * 0.55 }]}>
                  <Text
                    style={styles.residentNameText}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    maxFontSizeMultiplier={1.3}
                  >
                    {residentName}
                  </Text>
                  <Text
                    style={[
                      styles.unitCodeText,
                      unitCode.length > 20 && { fontSize: 11 },
                    ]}
                    numberOfLines={1}
                    ellipsizeMode="middle"
                    maxFontSizeMultiplier={1.3}
                  >
                    {unitCode}
                  </Text>
                </View>

                {/* Mini CTA button (height 36, minWidth 112) */}
                <Animated.View style={{ transform: [{ scale: btnScale }] }}>
                  <Pressable
                    onPress={handleBtnPress}
                    onPressIn={handleBtnPressIn}
                    onPressOut={handleBtnPressOut}
                    disabled={status === 'pending'}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    accessibilityRole="button"
                    accessibilityLabel={statusConfig.btnText}
                    accessibilityState={{ disabled: status === 'pending' }}
                    style={[
                      styles.miniBtn,
                      {
                        backgroundColor: statusConfig.btnBg,
                        borderColor: statusConfig.btnBorder,
                        borderWidth: statusConfig.btnBorder !== 'transparent' ? 1 : 0,
                      },
                    ]}
                  >
                    {statusConfig.btnIcon}
                    <Text
                      style={[
                        styles.miniBtnText,
                        { color: statusConfig.btnFg },
                      ]}
                      numberOfLines={1}
                    >
                      {statusConfig.btnText}
                    </Text>
                  </Pressable>
                </Animated.View>
              </View>
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: radius.xl, // 24
    overflow: 'hidden',
    alignSelf: 'center',
    ...Platform.select({
      web: {
        boxShadow:
          '0px 2px 4px rgba(6, 78, 59, 0.10), 0px 10px 24px rgba(6, 78, 59, 0.14), 0px 24px 48px rgba(6, 78, 59, 0.08)',
      } as any,
      default: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.22,
        shadowRadius: 24,
        elevation: 8,
      },
    }),
  },
  pressableFill: {
    flex: 1,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      } as any,
    }),
  },
  cardPadding: {
    flex: 1,
    padding: 20,
  },
  skeletonContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  contentWrap: {
    flex: 1,
  },
  rowA: {
    height: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  residencePassRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  residencePassText: {
    fontFamily: typography.monoSm.fontFamily,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0.8,
    color: colors.onCardSecondary, // rgba(255, 255, 255, 0.75)
    fontWeight: '600',
  },
  offlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FDE68A',
    marginLeft: 2,
  },
  statusPill: {
    height: 26,
    paddingHorizontal: 10,
    borderRadius: radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusPillText: {
    fontFamily: typography.micro.fontFamily,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.5,
    fontWeight: '700',
  },
  rowB: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  rowBSkeleton: {
    marginTop: 14,
  },
  nominalCol: {
    flex: 1,
  },
  periodText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.1,
    color: colors.onCardSecondary,
    textTransform: 'uppercase',
  },
  nominalText: {
    fontFamily: typography.display.fontFamily,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.6,
    color: colors.onCardPrimary, // #FFFFFF
    fontWeight: '800',
  },
  smartcardChip: {
    width: 40,
    height: 30,
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.40)',
  },
  chipGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flexSpace: {
    flex: 1,
    minHeight: 8,
  },
  rowC: {
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  residentCol: {
    flex: 1,
    minWidth: 0,
    marginRight: 8,
    justifyContent: 'center',
  },
  residentNameText: {
    fontFamily: typography.label.fontFamily,
    fontSize: 14,
    lineHeight: 18,
    color: colors.onCardPrimary,
    fontWeight: '700',
  },
  unitCodeText: {
    fontFamily: typography.mono.fontFamily,
    fontSize: 13,
    lineHeight: 18,
    color: colors.onCardSecondary,
  },
  miniBtn: {
    height: 36,
    minWidth: 90,
    paddingHorizontal: 12,
    flexShrink: 0,
    borderRadius: radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  miniBtnText: {
    fontFamily: typography.label.fontFamily,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.1,
    fontWeight: '700',
  },
});

export default VirtualResidentCard;
