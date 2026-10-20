import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  Animated,
  Platform,
  AccessibilityInfo,
  StyleProp,
  ViewStyle,
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
import type { LucideIcon } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { colors, radius, typography, layout, TABULAR } from '../theme';
import { formatRupiah, formatRupiahCompact } from '../utils/format';
import Skeleton from './ui/Skeleton';

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

export type ResidentCardStatus = 'paid' | 'unpaid' | 'overdue' | 'pending' | 'none';

export interface VirtualResidentCardProps {
  status?: ResidentCardStatus;
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
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

interface StatusConfig {
  pillBg: string;
  pillBorder: string;
  pillFg: string;
  pillText: string;
  PillIcon: LucideIcon;
  btnBg: string;
  btnBorder: string;
  btnFg: string;
  btnText: string;
  BtnIcon: LucideIcon;
  /** CTA utama (lime) mendapat glow & ikon lebih tebal */
  primary: boolean;
  /** Warna cahaya dekoratif di pojok kartu, mengikuti status */
  glow: string;
  hint: string;
}

/* -------------------------------------------------------------------------- */
/*  Konstanta                                                                 */
/* -------------------------------------------------------------------------- */

const USE_NATIVE = Platform.OS !== 'web';
const MIN_TOUCH = 44; // pedoman minimum area sentuh iOS/Android
const LIME = '#D4F636';
const LIME_INK = '#022C22';

const MONTHS_ID = [
  'JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI',
  'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER',
];

const currentPeriod = () => {
  const d = new Date();
  return `${MONTHS_ID[d.getMonth()]} ${d.getFullYear()}`;
};

// Dibuat sekali di luar komponen -> tidak dialokasi ulang setiap render.
const STATUS_CONFIG: Record<ResidentCardStatus, StatusConfig> = {
  paid: {
    pillBg: 'rgba(16,185,129,0.20)',
    pillBorder: 'rgba(16,185,129,0.40)',
    pillFg: '#A7F3D0',
    pillText: 'LUNAS',
    PillIcon: CheckCircle2,
    btnBg: 'rgba(255,255,255,0.14)',
    btnBorder: 'rgba(255,255,255,0.30)',
    btnFg: '#FFFFFF',
    btnText: 'Lihat Kuitansi',
    BtnIcon: Receipt,
    primary: false,
    glow: 'rgba(52,211,153,0.16)',
    hint: 'Ketuk dua kali untuk membuka kuitansi',
  },
  overdue: {
    pillBg: 'rgba(254,242,242,0.25)',
    pillBorder: 'rgba(254,202,202,0.50)',
    pillFg: '#FEE2E2',
    pillText: 'LEWAT',
    PillIcon: AlertCircle,
    btnBg: LIME,
    btnBorder: 'transparent',
    btnFg: LIME_INK,
    btnText: 'Bayar 1-Tap',
    BtnIcon: Zap,
    primary: true,
    glow: 'rgba(248,113,113,0.20)',
    hint: 'Ketuk dua kali untuk membayar sekarang',
  },
  pending: {
    pillBg: 'rgba(239,246,255,0.20)',
    pillBorder: 'rgba(191,219,254,0.40)',
    pillFg: '#DBEAFE',
    pillText: 'VERIFIKASI',
    PillIcon: Hourglass,
    btnBg: 'rgba(255,255,255,0.14)',
    btnBorder: 'transparent',
    btnFg: 'rgba(255,255,255,0.75)',
    btnText: 'Diproses',
    BtnIcon: Hourglass,
    primary: false,
    glow: 'rgba(96,165,250,0.18)',
    hint: 'Pembayaran sedang diverifikasi',
  },
  none: {
    pillBg: 'rgba(240,253,244,0.20)',
    pillBorder: 'rgba(187,247,208,0.40)',
    pillFg: '#DCFCE7',
    pillText: 'LUNAS',
    PillIcon: CheckCircle2,
    btnBg: 'rgba(255,255,255,0.18)',
    btnBorder: 'rgba(255,255,255,0.35)',
    btnFg: '#FFFFFF',
    btnText: 'Lihat Arsip',
    BtnIcon: FileText,
    primary: false,
    glow: 'rgba(52,211,153,0.14)',
    hint: 'Ketuk dua kali untuk membuka arsip tagihan',
  },
  unpaid: {
    pillBg: 'rgba(255,251,235,0.22)',
    pillBorder: 'rgba(253,230,138,0.45)',
    pillFg: '#FEF3C7',
    pillText: 'BELUM BAYAR',
    PillIcon: Clock,
    btnBg: LIME,
    btnBorder: 'transparent',
    btnFg: LIME_INK,
    btnText: 'Bayar 1-Tap',
    BtnIcon: Zap,
    primary: true,
    glow: 'rgba(251,191,36,0.16)',
    hint: 'Ketuk dua kali untuk membayar sekarang',
  },
};

/* -------------------------------------------------------------------------- */
/*  Helper & hooks                                                            */
/* -------------------------------------------------------------------------- */

const haptic = (fn: () => Promise<void>) => {
  if (Platform.OS === 'web') return;
  try {
    fn().catch(() => {});
  } catch {
    /* haptics tidak tersedia -> abaikan */
  }
};

/** Pisahkan awalan "Rp" supaya bisa ditampilkan lebih kecil dari angkanya. */
const splitCurrency = (value: string) => {
  const m = value.match(/^(Rp\.?\s*)(.+)$/i);
  return m ? { prefix: 'Rp', number: m[2] } : { prefix: '', number: value };
};

/** Hormati pengaturan "Reduce Motion" milik sistem. */
function useReduceMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled?.()
      .then((v) => mounted && setReduce(v))
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', setReduce);
    return () => {
      mounted = false;
      sub?.remove?.();
    };
  }, []);
  return reduce;
}

/** Animasi skala saat ditekan (satu implementasi, dipakai kartu & tombol). */
function usePressScale(pressedTo: number, reduceMotion: boolean) {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = useCallback(
    (toValue: number) => {
      if (reduceMotion) return;
      Animated.spring(scale, {
        toValue,
        useNativeDriver: USE_NATIVE,
        damping: 18,
        stiffness: 260,
        mass: 0.8,
      }).start();
    },
    [scale, reduceMotion],
  );

  const onPressIn = useCallback(() => animateTo(pressedTo), [animateTo, pressedTo]);
  const onPressOut = useCallback(() => animateTo(1), [animateTo]);

  return { scale, onPressIn, onPressOut };
}

/* -------------------------------------------------------------------------- */
/*  Komponen                                                                  */
/* -------------------------------------------------------------------------- */

const VirtualResidentCardBase: React.FC<VirtualResidentCardProps> = ({
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
  style,
  testID,
}) => {
  const { width: screenWidth } = useWindowDimensions();
  const reduceMotion = useReduceMotion();

  const card = usePressScale(0.975, reduceMotion);
  const btn = usePressScale(0.95, reduceMotion);

  /* ---- Ukuran responsif ---- */
  const safeWidth = screenWidth || 360;
  const cardWidth = Math.max(280, Math.min(safeWidth, layout.maxContentWidth) - 32);
  const minCardHeight = Math.floor(cardWidth / layout.cardAspect);
  const compact = cardWidth < 320; // layar kecil (mis. iPhone SE, Android 320dp)
  const padding = compact ? 16 : 20;

  /* ---- Fade-in konten setelah loading ---- */
  const fade = useRef(new Animated.Value(loading ? 0 : 1)).current;
  useEffect(() => {
    if (loading || reduceMotion) {
      fade.setValue(loading ? 0 : 1);
      return;
    }
    Animated.timing(fade, {
      toValue: 1,
      duration: 240,
      useNativeDriver: USE_NATIVE,
    }).start();
  }, [loading, reduceMotion, fade]);

  /* ---- Konfigurasi status ---- */
  const view = useMemo(() => {
    const base = STATUS_CONFIG[status] ?? STATUS_CONFIG.unpaid;
    let pillText = base.pillText;
    let period: string;

    switch (status) {
      case 'paid':
        period = periodLabel || `TERBAYAR ${currentPeriod()}`;
        break;
      case 'overdue': {
        pillText = overdueDays > 99 ? 'LEWAT 99+ HARI' : `LEWAT ${Math.max(overdueDays, 1)} HARI`;
        period = periodLabel || 'TAGIHAN JATUH TEMPO';
        break;
      }
      case 'pending':
        period = periodLabel || 'MENUNGGU VERIFIKASI';
        break;
      case 'none':
        period = 'BEBAS TAGIHAN';
        break;
      case 'unpaid':
      default:
        period = billCount > 1 ? `TOTAL ${billCount} TAGIHAN` : periodLabel || 'TAGIHAN BULAN INI';
    }
    return { ...base, pillText, period };
  }, [status, periodLabel, overdueDays, billCount]);

  const formattedNominal = amount >= 1_000_000_000 ? formatRupiahCompact(amount) : formatRupiah(amount);
  const a11yNominal = formatRupiah(amount);
  const { prefix, number } = splitCurrency(String(formattedNominal));

  const isPending = status === 'pending';
  const btnDisabled = loading || isPending;

  const cardLabel = loading
    ? 'Memuat kartu tagihan'
    : `${view.period}, ${a11yNominal}, ${view.pillText}, ${unitCode}, ${residentName}.` +
      (isOffline
        ? ` Mode offline${offlineTimestamp ? `, terakhir diperbarui ${offlineTimestamp}` : ''}.`
        : '');

  /* ---- Handler ---- */
  const handleCardPress = () => {
    if (loading) return;
    haptic(() => Haptics.selectionAsync());
    onPressCard?.();
  };

  const handleBtnPress = () => {
    if (btnDisabled) return;
    haptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
    onPressAction?.();
  };

  /* ---- Render ---- */
  return (
    <Animated.View
      testID={testID}
      style={[
        styles.shadowWrap,
        { width: cardWidth, transform: [{ scale: card.scale }] },
        style,
      ]}
    >
      <View style={[styles.clip, { minHeight: minCardHeight }]}>
        {/* Latar */}
        <LinearGradient
          colors={['#064E3B', '#022C22']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" pointerEvents="none">
          <Circle cx={cardWidth - 40} cy={-50} r={125} fill={view.glow} />
          <Circle cx={-30} cy="112%" r={95} fill="rgba(255,255,255,0.05)" />
        </Svg>
        {/* Kilau halus di sisi atas -> kesan kartu fisik */}
        <LinearGradient
          colors={['rgba(255,255,255,0.10)', 'rgba(255,255,255,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 0.55 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        {/*
          Area sentuh kartu ada di LAPISAN BELAKANG (saudara, bukan induk) dari tombol.
          Hasilnya: tombol tidak lagi nested di dalam Pressable lain, sehingga
          screen reader bisa fokus ke kartu & tombol secara terpisah dan
          tidak perlu stopPropagation.
        */}
        <Pressable
          onPress={handleCardPress}
          onPressIn={card.onPressIn}
          onPressOut={card.onPressOut}
          disabled={loading}
          accessibilityRole={Platform.OS === 'web' ? undefined : 'button'}
          accessibilityLabel={cardLabel}
          accessibilityHint={loading ? undefined : 'Ketuk dua kali untuk melihat rincian'}
          accessibilityState={{ disabled: loading, busy: loading }}
          style={[StyleSheet.absoluteFill, Platform.OS === 'web' && ({ cursor: 'pointer' } as any)]}
        />

        {/* Konten */}
        <View style={[styles.content, { padding }]} pointerEvents="box-none">
          {loading ? (
            <View style={styles.fill} pointerEvents="none">
              <View style={styles.rowA}>
                <Skeleton onCard width={110} height={12} borderRadius={6} />
                <Skeleton onCard width={92} height={28} borderRadius={14} />
              </View>
              <View style={styles.rowB}>
                <View>
                  <Skeleton onCard width={120} height={10} borderRadius={5} style={{ marginBottom: 8 }} />
                  <Skeleton onCard width={190} height={30} borderRadius={8} />
                </View>
              </View>
              <View style={styles.spacer} />
              <View style={styles.rowC}>
                <View style={styles.residentCol}>
                  <Skeleton onCard width={130} height={14} borderRadius={7} style={{ marginBottom: 6 }} />
                  <Skeleton onCard width={100} height={12} borderRadius={6} />
                </View>
                <Skeleton onCard width={118} height={MIN_TOUCH} borderRadius={MIN_TOUCH / 2} />
              </View>
            </View>
          ) : (
            <Animated.View style={[styles.fill, { opacity: fade }]} pointerEvents="box-none">
              {/* Info (hanya tampilan): dibaca lewat label kartu, jadi disembunyikan dari screen reader
                  agar tidak dibacakan dua kali. pointerEvents none -> sentuhan tembus ke kartu. */}
              <View
                pointerEvents="none"
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
              >
                {/* Row A */}
                <View style={styles.rowA}>
                  <View style={styles.residencePassRow}>
                    <Home size={14} color="rgba(255,255,255,0.75)" strokeWidth={2.2} />
                    <Text
                      style={styles.residencePassText}
                      numberOfLines={1}
                      maxFontSizeMultiplier={1.2}
                    >
                      RESIDENCE PASS
                    </Text>
                    {isOffline && (
                      <View style={styles.offlineBadge}>
                        <View style={styles.offlineDot} />
                        {!compact && (
                          <Text style={styles.offlineText} maxFontSizeMultiplier={1.1}>
                            Offline
                          </Text>
                        )}
                      </View>
                    )}
                  </View>

                  <View
                    style={[
                      styles.statusPill,
                      {
                        backgroundColor: view.pillBg,
                        borderColor: view.pillBorder,
                        borderWidth: view.pillBorder !== 'transparent' ? 1 : 0,
                      },
                    ]}
                  >
                    <view.PillIcon size={14} color={view.pillFg} strokeWidth={2.2} />
                    <Text
                      style={[styles.statusPillText, { color: view.pillFg }]}
                      numberOfLines={1}
                      maxFontSizeMultiplier={1.15}
                    >
                      {view.pillText}
                    </Text>
                  </View>
                </View>

                {/* Row B */}
                <View style={styles.rowB}>
                  <View style={styles.nominalCol}>
                    <Text style={styles.periodText} numberOfLines={1} maxFontSizeMultiplier={1.2}>
                      {view.period}
                    </Text>
                    <Text
                      style={[styles.nominalText, compact && styles.nominalTextCompact, TABULAR]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.6}
                      maxFontSizeMultiplier={1.2}
                    >
                      {prefix ? (
                        <Text style={styles.nominalPrefix}>{prefix}&nbsp;</Text>
                      ) : null}
                      {number}
                    </Text>
                  </View>

                  {/* Chip smartcard */}
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
              </View>

              <View style={styles.spacer} pointerEvents="none" />

              {/* Row C */}
              <View style={styles.rowC} pointerEvents="box-none">
                <View
                  style={styles.residentCol}
                  pointerEvents="none"
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                >
                  <Text
                    style={styles.residentNameText}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    maxFontSizeMultiplier={1.2}
                  >
                    {residentName}
                  </Text>
                  <Text
                    style={[styles.unitCodeText, unitCode.length > 20 && { fontSize: 11 }]}
                    numberOfLines={1}
                    ellipsizeMode="middle"
                    maxFontSizeMultiplier={1.2}
                  >
                    {unitCode}
                  </Text>
                </View>

                {/* CTA mini - area sentuh 44pt + hitSlop */}
                <Animated.View style={{ transform: [{ scale: btn.scale }] }}>
                  <Pressable
                    onPress={handleBtnPress}
                    onPressIn={btnDisabled ? undefined : btn.onPressIn}
                    onPressOut={btn.onPressOut}
                    disabled={btnDisabled}
                    hitSlop={{ top: 4, bottom: 4, left: 6, right: 6 }}
                    android_ripple={
                      btnDisabled
                        ? undefined
                        : {
                            color: view.primary ? 'rgba(2,44,34,0.18)' : 'rgba(255,255,255,0.25)',
                            borderless: false,
                          }
                    }
                    accessibilityRole="button"
                    accessibilityLabel={view.btnText}
                    accessibilityHint={view.hint}
                    accessibilityState={{ disabled: btnDisabled }}
                    style={[
                      styles.miniBtn,
                      view.primary && styles.miniBtnPrimary,
                      {
                        backgroundColor: view.btnBg,
                        borderColor: view.btnBorder,
                        borderWidth: view.btnBorder !== 'transparent' ? 1 : 0,
                      },
                      Platform.OS === 'web' &&
                        ({ cursor: btnDisabled ? 'default' : 'pointer' } as any),
                    ]}
                  >
                    <view.BtnIcon size={15} color={view.btnFg} strokeWidth={view.primary ? 2.4 : 2} />
                    <Text
                      style={[styles.miniBtnText, { color: view.btnFg }]}
                      numberOfLines={1}
                      maxFontSizeMultiplier={1.2}
                    >
                      {view.btnText}
                    </Text>
                  </Pressable>
                </Animated.View>
              </View>
            </Animated.View>
          )}
        </View>
      </View>
    </Animated.View>
  );
};

export const VirtualResidentCard = memo(VirtualResidentCardBase);
VirtualResidentCard.displayName = 'VirtualResidentCard';

/* -------------------------------------------------------------------------- */
/*  Styles                                                                    */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  // Bayangan di wrapper luar; clipping di view dalam.
  // (overflow: 'hidden' + shadow di view yang sama membuat bayangan iOS terpotong)
  shadowWrap: {
    alignSelf: 'center',
    borderRadius: radius.xl,
    backgroundColor: '#064E3B',
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
  clip: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  // flexGrow (bukan flex: 1) supaya kartu bisa tumbuh saat font sistem diperbesar
  content: {
    flexGrow: 1,
  },
  fill: {
    flexGrow: 1,
  },
  spacer: {
    flexGrow: 1,
    minHeight: 12,
  },

  /* Row A */
  rowA: {
    minHeight: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  residencePassRow: {
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  residencePassText: {
    flexShrink: 1,
    fontFamily: typography.monoSm.fontFamily,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0.8,
    color: colors.onCardSecondary,
    fontWeight: '600',
  },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
    backgroundColor: 'rgba(253,230,138,0.16)',
  },
  offlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FDE68A',
  },
  offlineText: {
    fontFamily: typography.micro.fontFamily,
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '600',
    color: '#FDE68A',
  },
  statusPill: {
    height: 28,
    flexShrink: 0,
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

  /* Row B */
  rowB: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  nominalCol: {
    flex: 1,
    minWidth: 0,
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
    marginTop: 2,
    fontFamily: typography.display.fontFamily,
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: -0.6,
    color: colors.onCardPrimary,
    fontWeight: '800',
  },
  nominalTextCompact: {
    fontSize: 26,
    lineHeight: 32,
  },
  nominalPrefix: {
    fontSize: 16,
    letterSpacing: 0,
    fontWeight: '700',
    color: colors.onCardSecondary,
  },
  smartcardChip: {
    width: 40,
    height: 30,
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.40)',
    marginBottom: 4,
  },
  chipGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Row C */
  rowC: {
    minHeight: MIN_TOUCH,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  residentCol: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  residentNameText: {
    fontFamily: typography.label.fontFamily,
    fontSize: 15,
    lineHeight: 20,
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
    height: MIN_TOUCH,
    minWidth: 112,
    paddingHorizontal: 14,
    flexShrink: 0,
    borderRadius: radius.full,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  miniBtnPrimary: {
    ...Platform.select({
      ios: {
        shadowColor: LIME,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
      },
      default: {},
    }),
  },
  miniBtnText: {
    fontFamily: typography.label.fontFamily,
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: 0.1,
    fontWeight: '700',
  },
});

export default VirtualResidentCard;