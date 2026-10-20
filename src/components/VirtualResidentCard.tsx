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
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Rect, Line, Circle, Path, G } from 'react-native-svg';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Hourglass,
  Zap,
  Receipt,
  FileText,
  Wifi,
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
  primary: boolean;
  hint: string;
  /** Warna aksen stripe horizontal di bawah chip */
  accentLine: string;
}

/* -------------------------------------------------------------------------- */
/*  Konstanta                                                                 */
/* -------------------------------------------------------------------------- */

// rotate/perspective tidak didukung native driver di Android → gunakan JS thread untuk 3D.
// scale + opacity (press & fade) tetap pakai native driver.
const USE_NATIVE = Platform.OS !== 'web';
const USE_NATIVE_3D = false; // rotateX/Y/Z tidak bisa native driver
const MIN_TOUCH = 44;
const LIME = '#D4F636';
const LIME_INK = '#022C22';
// Warna gold untuk elemen dekoratif kartu (chip border, teks issuer)
const GOLD = '#C9A84C';
const GOLD_LIGHT = '#E8C97A';

const MONTHS_ID = [
  'JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI',
  'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER',
];

const currentPeriod = () => {
  const d = new Date();
  return `${MONTHS_ID[d.getMonth()]} ${d.getFullYear()}`;
};

const STATUS_CONFIG: Record<ResidentCardStatus, StatusConfig> = {
  paid: {
    pillBg: 'rgba(16, 185, 129, 0.18)',
    pillBorder: 'rgba(52, 211, 153, 0.40)',
    pillFg: '#34D399',
    pillText: 'LUNAS',
    PillIcon: CheckCircle2,
    btnBg: 'rgba(255, 255, 255, 0.10)',
    btnBorder: 'rgba(255, 255, 255, 0.22)',
    btnFg: '#FFFFFF',
    btnText: 'Kuitansi',
    BtnIcon: Receipt,
    primary: false,
    hint: 'Ketuk untuk membuka kuitansi pembayaran',
    accentLine: 'rgba(52, 211, 153, 0.50)',
  },
  unpaid: {
    pillBg: 'rgba(245, 158, 11, 0.18)',
    pillBorder: 'rgba(252, 211, 77, 0.40)',
    pillFg: '#FCD34D',
    pillText: 'BELUM BAYAR',
    PillIcon: Clock,
    btnBg: LIME,
    btnBorder: 'transparent',
    btnFg: LIME_INK,
    btnText: 'Bayar 1-Tap',
    BtnIcon: Zap,
    primary: true,
    hint: 'Ketuk untuk membayar tagihan sekarang',
    accentLine: 'rgba(252, 211, 77, 0.50)',
  },
  overdue: {
    pillBg: 'rgba(239, 68, 68, 0.18)',
    pillBorder: 'rgba(252, 165, 165, 0.40)',
    pillFg: '#FCA5A5',
    pillText: 'LEWAT TEMPO',
    PillIcon: AlertCircle,
    btnBg: LIME,
    btnBorder: 'transparent',
    btnFg: LIME_INK,
    btnText: 'Bayar 1-Tap',
    BtnIcon: Zap,
    primary: true,
    hint: 'Ketuk untuk membayar tagihan jatuh tempo',
    accentLine: 'rgba(252, 165, 165, 0.50)',
  },
  pending: {
    pillBg: 'rgba(59, 130, 246, 0.18)',
    pillBorder: 'rgba(147, 197, 253, 0.40)',
    pillFg: '#93C5FD',
    pillText: 'VERIFIKASI',
    PillIcon: Hourglass,
    btnBg: 'rgba(255, 255, 255, 0.08)',
    btnBorder: 'rgba(255, 255, 255, 0.18)',
    btnFg: 'rgba(255, 255, 255, 0.80)',
    btnText: 'Diproses',
    BtnIcon: Hourglass,
    primary: false,
    hint: 'Pembayaran sedang diverifikasi admin',
    accentLine: 'rgba(147, 197, 253, 0.50)',
  },
  none: {
    pillBg: 'rgba(16, 185, 129, 0.18)',
    pillBorder: 'rgba(52, 211, 153, 0.40)',
    pillFg: '#34D399',
    pillText: 'BEBAS TAGIHAN',
    PillIcon: CheckCircle2,
    btnBg: 'rgba(255, 255, 255, 0.10)',
    btnBorder: 'rgba(255, 255, 255, 0.22)',
    btnFg: '#FFFFFF',
    btnText: 'Riwayat',
    BtnIcon: FileText,
    primary: false,
    hint: 'Ketuk untuk melihat riwayat tagihan',
    accentLine: 'rgba(52, 211, 153, 0.50)',
  },
};

/* -------------------------------------------------------------------------- */
/*  Sub-komponen: EMV Chip (tiruan chip kartu bank fisik)                     */
/* -------------------------------------------------------------------------- */

const EmvChip: React.FC = memo(() => (
  <View style={chipStyles.wrapper}>
    <LinearGradient
      colors={[GOLD_LIGHT, GOLD, '#A07830', GOLD, GOLD_LIGHT]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={chipStyles.body}
    >
      <Svg width="44" height="34" viewBox="0 0 44 34">
        {/* Bingkai luar chip */}
        <Rect
          x="0.5" y="0.5" width="43" height="33" rx="5.5"
          stroke="rgba(160,120,48,0.70)" strokeWidth="1" fill="none"
        />
        {/* Garis vertikal kiri */}
        <Line x1="15" y1="0" x2="15" y2="34" stroke="rgba(120,80,20,0.40)" strokeWidth="0.8" />
        {/* Garis vertikal kanan */}
        <Line x1="29" y1="0" x2="29" y2="34" stroke="rgba(120,80,20,0.40)" strokeWidth="0.8" />
        {/* Garis horizontal atas */}
        <Line x1="0" y1="11" x2="44" y2="11" stroke="rgba(120,80,20,0.40)" strokeWidth="0.8" />
        {/* Garis horizontal bawah */}
        <Line x1="0" y1="23" x2="44" y2="23" stroke="rgba(120,80,20,0.40)" strokeWidth="0.8" />
        {/* Panel tengah (contact pad) */}
        <Rect
          x="15" y="11" width="14" height="12" rx="2"
          fill="rgba(160,120,48,0.25)" stroke="rgba(120,80,20,0.30)" strokeWidth="0.6"
        />
        {/* Highlight kilap pojok kiri atas */}
        <Rect x="0.5" y="0.5" width="14" height="10" rx="2" fill="rgba(255,255,255,0.10)" />
        {/* Highlight kilap pojok kanan atas */}
        <Rect x="29.5" y="0.5" width="14" height="10" rx="2" fill="rgba(255,255,255,0.08)" />
      </Svg>
    </LinearGradient>
  </View>
));

const chipStyles = StyleSheet.create({
  wrapper: {
    borderRadius: 6,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.30,
        shadowRadius: 4,
      },
      default: { elevation: 3 },
    }),
  },
  body: {
    width: 44,
    height: 34,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

/* -------------------------------------------------------------------------- */
/*  Sub-komponen: Contactless icon (NFC ring)                                 */
/* -------------------------------------------------------------------------- */

const ContactlessIcon: React.FC<{ color?: string }> = memo(({ color = 'rgba(255,255,255,0.55)' }) => (
  <Svg width="22" height="22" viewBox="0 0 24 24">
    {/* Ikon sinyal contactless bergaya kartu bank */}
    <Path d="M12 2 Q18 8 18 12 Q18 16 12 22" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" />
    <Path d="M12 6 Q16 9 16 12 Q16 15 12 18" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" />
    <Path d="M12 10 Q14 10.8 14 12 Q14 13.2 12 14" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" />
    <Circle cx="12" cy="12" r="1.5" fill={color} />
  </Svg>
));

/* -------------------------------------------------------------------------- */
/*  Helper & hooks                                                            */
/* -------------------------------------------------------------------------- */

const haptic = (fn: () => Promise<void>) => {
  if (Platform.OS === 'web') return;
  try { fn().catch(() => {}); } catch { /* abaikan */ }
};

const splitCurrency = (value: string) => {
  const m = value.match(/^(Rp\.?\s*)(.+)$/i);
  return m ? { prefix: 'Rp', number: m[2] } : { prefix: '', number: value };
};

function useReduceMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled?.()
      .then((v) => mounted && setReduce(v))
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', setReduce);
    return () => { mounted = false; sub?.remove?.(); };
  }, []);
  return reduce;
}

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
/*  Komponen Utama                                                            */
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

  const card = usePressScale(0.974, reduceMotion);
  const btn  = usePressScale(0.94,  reduceMotion);

  /* ---- Ukuran responsif ---- */
  const safeWidth   = screenWidth || 360;
  const cardWidth   = Math.max(300, Math.min(safeWidth, layout.maxContentWidth) - 32);
  const cardHeight  = Math.floor(cardWidth / 1.586); // rasio ISO ID-1
  const compact     = cardWidth < 330;
  const p           = compact ? 18 : 22; // padding

  /* ---- Animasi 3D pelan — JS thread (rotateX/Y tidak native-driver-safe) ---- */
  const floatAnim = useRef(new Animated.Value(0)).current;
  const tiltAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduceMotion) {
      floatAnim.setValue(0.5);
      tiltAnim.setValue(0.5);
      return;
    }

    // Float: naik-turun 10px, siklus 5.4s
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: 1, duration: 2700, easing: Easing.inOut(Easing.sin), useNativeDriver: USE_NATIVE_3D }),
        Animated.timing(floatAnim, { toValue: 0, duration: 2700, easing: Easing.inOut(Easing.sin), useNativeDriver: USE_NATIVE_3D }),
      ]),
    );

    // Tilt: miring kiri-kanan, siklus 7.2s (tidak sinkron dengan float)
    const tiltLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(tiltAnim, { toValue: 1, duration: 3600, easing: Easing.inOut(Easing.sin), useNativeDriver: USE_NATIVE_3D }),
        Animated.timing(tiltAnim, { toValue: 0, duration: 3600, easing: Easing.inOut(Easing.sin), useNativeDriver: USE_NATIVE_3D }),
      ]),
    );

    floatLoop.start();
    tiltLoop.start();
    return () => { floatLoop.stop(); tiltLoop.stop(); };
  }, [reduceMotion, floatAnim, tiltAnim]);

  const translateY = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [-5, 5] });
  const rotateX    = floatAnim.interpolate({ inputRange: [0, 1], outputRange: ['-2deg', '2deg'] });
  const rotateY    = tiltAnim.interpolate({  inputRange: [0, 1], outputRange: ['-3deg', '3deg'] });
  const rotateZ    = tiltAnim.interpolate({  inputRange: [0, 1], outputRange: ['-0.4deg', '0.4deg'] });

  // Specular sheen: beam tipis bergerak horizontal mengikuti tilt
  const shineX = tiltAnim.interpolate({ inputRange: [0, 1], outputRange: [-cardWidth, cardWidth] });
  const shineO = tiltAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.0, 0.28, 0.0] });

  /* ---- Fade-in setelah loading ---- */
  const fade = useRef(new Animated.Value(loading ? 0 : 1)).current;
  useEffect(() => {
    if (loading || reduceMotion) { fade.setValue(loading ? 0 : 1); return; }
    Animated.timing(fade, { toValue: 1, duration: 260, useNativeDriver: USE_NATIVE }).start();
  }, [loading, reduceMotion, fade]);

  /* ---- Status view config ---- */
  const view = useMemo(() => {
    const base = STATUS_CONFIG[status] ?? STATUS_CONFIG.unpaid;
    let pillText = base.pillText;
    let period: string;
    switch (status) {
      case 'paid':   period = periodLabel || `TERBAYAR ${currentPeriod()}`; break;
      case 'overdue':
        pillText = overdueDays > 0 ? (overdueDays > 99 ? 'LEWAT 99+ HARI' : `LEWAT ${overdueDays} HARI`) : 'LEWAT TEMPO';
        period   = periodLabel || 'TAGIHAN JATUH TEMPO';
        break;
      case 'pending': period = periodLabel || 'MENUNGGU VERIFIKASI'; break;
      case 'none':    period = periodLabel || 'BEBAS TAGIHAN'; break;
      case 'unpaid':
      default:
        period = billCount > 1 ? `TOTAL ${billCount} TAGIHAN` : periodLabel || 'TAGIHAN BULAN INI';
    }
    return { ...base, pillText, period };
  }, [status, periodLabel, overdueDays, billCount]);

  const formattedNominal = amount >= 1_000_000_000 ? formatRupiahCompact(amount) : formatRupiah(amount);
  const a11yNominal = formatRupiah(amount);
  const { prefix, number } = splitCurrency(String(formattedNominal));

  const isPending  = status === 'pending';
  const btnDisabled = loading || isPending;

  const cardLabel = loading
    ? 'Memuat kartu tagihan'
    : `${view.period}, ${a11yNominal}, ${view.pillText}, ${unitCode}, ${residentName}.`
      + (isOffline ? ` Mode offline${offlineTimestamp ? `, terakhir diperbarui ${offlineTimestamp}` : ''}.` : '');

  const handleCardPress = () => { if (loading) return; haptic(() => Haptics.selectionAsync()); onPressCard?.(); };
  const handleBtnPress  = () => { if (btnDisabled) return; haptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)); onPressAction?.(); };

  /* ---- Render ---- */
  return (
    // Outer: native-driver scale (press feedback)
    <Animated.View
      testID={testID}
      style={[
        styles.outerWrap,
        { width: cardWidth, transform: [{ scale: card.scale }] },
        style,
      ]}
    >
      {/* Inner: JS-thread 3D tilt + float (tidak bisa native driver) */}
      <Animated.View
        style={{
          transform: [
            { perspective: 1100 },
            { translateY },
            { rotateX },
            { rotateY },
            { rotateZ },
          ],
        }}
      >
        <View style={[styles.card, { height: cardHeight }]}>

          {/* ── Latar: deep green gradient mewah ── */}
          <LinearGradient
            colors={['#0A5C44', '#064E3B', '#033428', '#021E18']}
            start={{ x: 0.0, y: 0.0 }}
            end={{ x: 1.0, y: 1.0 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />

          {/* ── Kilap cahaya atas (bevel glass effect) ── */}
          <LinearGradient
            colors={['rgba(255,255,255,0.14)', 'rgba(255,255,255,0.03)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 0.5 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />

          {/* ── Emboss lingkaran dekoratif besar (watermark) ── */}
          <View style={styles.circleDecorBR} pointerEvents="none" />
          <View style={styles.circleDecorTL} pointerEvents="none" />

          {/* ── Garis stripe tipis horizontal gold di tengah ── */}
          <View
            style={[styles.goldStripe, { backgroundColor: view.accentLine }]}
            pointerEvents="none"
          />

          {/* ── Specular sheen (cahaya kilap 3D bergerak) ── */}
          {!reduceMotion && (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.shineWrap,
                {
                  opacity: shineO,
                  transform: [{ translateX: shineX }, { rotate: '20deg' }],
                },
              ]}
            >
              <LinearGradient
                colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.22)', 'rgba(255,255,255,0)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.shineGrad}
              />
            </Animated.View>
          )}

          {/* ── Pressable area kartu ── */}
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

          {/* ── Konten kartu ── */}
          <View style={[styles.content, { padding: p }]} pointerEvents="box-none">
            {loading ? (
              <LoadingSkeleton compact={compact} />
            ) : (
              <Animated.View style={[styles.fill, { opacity: fade }]} pointerEvents="box-none">

                {/* ROW 1: Issuer logo + contactless + status pill */}
                <View
                  style={styles.row1}
                  pointerEvents="none"
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                >
                  <View style={styles.issuerBlock}>
                    {/* Nama lembaga / brand */}
                    <Text style={styles.issuerLabel} numberOfLines={1}>RESIDENCE PASS</Text>
                    <Text style={styles.issuerSub} numberOfLines={1}>IPL Mobile · Warga</Text>
                  </View>

                  <View style={styles.row1Right}>
                    {/* Offline indicator */}
                    {isOffline && (
                      <View style={styles.offlinePill}>
                        <View style={styles.offlineDot} />
                        {!compact && <Text style={styles.offlineLabel}>Offline</Text>}
                      </View>
                    )}
                    {/* NFC / Contactless icon */}
                    <ContactlessIcon color="rgba(255,255,255,0.50)" />
                  </View>
                </View>

                {/* ROW 2: EMV Chip + Status pill sejajar */}
                <View
                  style={styles.row2}
                  pointerEvents="none"
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                >
                  <EmvChip />

                  {/* Status pill */}
                  <View
                    style={[
                      styles.statusPill,
                      { backgroundColor: view.pillBg, borderColor: view.pillBorder },
                    ]}
                  >
                    <view.PillIcon size={11} color={view.pillFg} strokeWidth={2.5} />
                    <Text style={[styles.pillText, { color: view.pillFg }]} numberOfLines={1}>
                      {view.pillText}
                    </Text>
                  </View>
                </View>

                {/* ROW 3: Nominal tagihan (utama, paling besar) */}
                <View
                  style={styles.row3}
                  pointerEvents="none"
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                >
                  <Text style={styles.periodLabel} numberOfLines={1}>{view.period}</Text>
                  <Text
                    style={[styles.nominal, compact && styles.nominalSm, TABULAR]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.65}
                  >
                    {prefix ? <Text style={styles.nominalPrefix}>{prefix}&nbsp;</Text> : null}
                    {number}
                  </Text>
                </View>

                {/* ROW 4 (footer): Nama + unit + tombol aksi */}
                <View style={styles.row4} pointerEvents="box-none">
                  <View
                    style={styles.holderBlock}
                    pointerEvents="none"
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                  >
                    <Text style={styles.holderName} numberOfLines={1} ellipsizeMode="tail">
                      {residentName.toUpperCase()}
                    </Text>
                    <Text
                      style={[styles.holderUnit, unitCode.length > 22 && { fontSize: 11 }]}
                      numberOfLines={1}
                      ellipsizeMode="middle"
                    >
                      {unitCode}
                    </Text>
                  </View>

                  {/* CTA button */}
                  <Animated.View style={{ transform: [{ scale: btn.scale }] }}>
                    <Pressable
                      onPress={handleBtnPress}
                      onPressIn={btnDisabled ? undefined : btn.onPressIn}
                      onPressOut={btn.onPressOut}
                      disabled={btnDisabled}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      android_ripple={
                        btnDisabled
                          ? undefined
                          : { color: view.primary ? 'rgba(2,44,34,0.22)' : 'rgba(255,255,255,0.18)', borderless: false }
                      }
                      accessibilityRole="button"
                      accessibilityLabel={view.btnText}
                      accessibilityHint={view.hint}
                      accessibilityState={{ disabled: btnDisabled }}
                      style={[
                        styles.ctaBtn,
                        view.primary && styles.ctaBtnPrimary,
                        {
                          backgroundColor: view.btnBg,
                          borderColor: view.btnBorder,
                          borderWidth: view.btnBorder !== 'transparent' ? 1 : 0,
                        },
                        Platform.OS === 'web' && ({ cursor: btnDisabled ? 'default' : 'pointer' } as any),
                      ]}
                    >
                      <view.BtnIcon size={14} color={view.btnFg} strokeWidth={view.primary ? 2.5 : 2} />
                      <Text style={[styles.ctaBtnText, { color: view.btnFg }]}>
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
    </Animated.View>
  );
};

/* -------------------------------------------------------------------------- */
/*  Loading skeleton                                                          */
/* -------------------------------------------------------------------------- */

const LoadingSkeleton: React.FC<{ compact: boolean }> = memo(({ compact }) => (
  <View style={styles.fill} pointerEvents="none">
    {/* Row 1 */}
    <View style={styles.row1}>
      <Skeleton onCard width={120} height={13} borderRadius={6} />
      <Skeleton onCard width={24} height={24} borderRadius={12} />
    </View>
    {/* Row 2 */}
    <View style={[styles.row2, { marginTop: compact ? 12 : 16 }]}>
      <Skeleton onCard width={44} height={34} borderRadius={6} />
      <Skeleton onCard width={80} height={26} borderRadius={13} />
    </View>
    {/* Row 3 */}
    <View style={{ marginTop: compact ? 12 : 16 }}>
      <Skeleton onCard width={100} height={11} borderRadius={5} style={{ marginBottom: 8 }} />
      <Skeleton onCard width={compact ? 160 : 190} height={34} borderRadius={8} />
    </View>
    {/* Row 4 */}
    <View style={[styles.row4, { marginTop: 'auto' as any }]}>
      <View>
        <Skeleton onCard width={140} height={14} borderRadius={7} style={{ marginBottom: 6 }} />
        <Skeleton onCard width={100} height={12} borderRadius={6} />
      </View>
      <Skeleton onCard width={108} height={38} borderRadius={19} />
    </View>
  </View>
));

/* -------------------------------------------------------------------------- */
/*  Export                                                                    */
/* -------------------------------------------------------------------------- */

export const VirtualResidentCard = memo(VirtualResidentCardBase);
VirtualResidentCard.displayName = 'VirtualResidentCard';

/* -------------------------------------------------------------------------- */
/*  Styles                                                                    */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  outerWrap: {
    alignSelf: 'center',
    // shadow di wrapper luar agar tidak terpotong oleh overflow:hidden di dalam
    ...Platform.select({
      web: {
        filter: 'drop-shadow(0px 16px 40px rgba(2,44,34,0.45)) drop-shadow(0px 4px 12px rgba(2,44,34,0.30))',
      } as any,
      ios: {
        shadowColor: '#011E16',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.50,
        shadowRadius: 28,
      },
      android: {
        elevation: 14,
      },
      default: {},
    }),
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: '#033428',
  },

  /* Dekorasi latar */
  circleDecorBR: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    right: -90,
    bottom: -90,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  circleDecorTL: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    left: -50,
    top: -50,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  goldStripe: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    top: '55%',
    opacity: 0.6,
  },

  /* Specular sheen */
  shineWrap: {
    position: 'absolute',
    top: -100,
    bottom: -100,
    width: 120,
    alignItems: 'center',
    left: -60,
  },
  shineGrad: {
    width: '100%',
    height: '100%',
  },

  content: {
    flex: 1,
  },
  fill: {
    flex: 1,
  },

  /* Row 1: Issuer + contactless */
  row1: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  issuerBlock: {
    flexShrink: 1,
  },
  issuerLabel: {
    fontFamily: typography.monoSm.fontFamily,
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 1.6,
    color: GOLD_LIGHT,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  issuerSub: {
    fontFamily: typography.monoSm.fontFamily,
    fontSize: 9,
    lineHeight: 13,
    letterSpacing: 0.6,
    color: 'rgba(255,255,255,0.45)',
    marginTop: 1,
    textTransform: 'uppercase',
  },
  row1Right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  offlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
    backgroundColor: 'rgba(253,230,138,0.14)',
  },
  offlineDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#FDE68A',
  },
  offlineLabel: {
    fontFamily: typography.micro.fontFamily,
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '600',
    color: '#FDE68A',
  },

  /* Row 2: EMV chip + status pill */
  row2: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusPill: {
    height: 26,
    paddingHorizontal: 10,
    borderRadius: radius.full,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  pillText: {
    fontFamily: typography.micro.fontFamily,
    fontSize: 10,
    lineHeight: 13,
    letterSpacing: 0.6,
    fontWeight: '700',
    textTransform: 'uppercase',
  },

  /* Row 3: Nominal */
  row3: {
    marginTop: 18,
  },
  periodLabel: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.8,
    color: 'rgba(255,255,255,0.52)',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  nominal: {
    marginTop: 3,
    fontFamily: typography.display.fontFamily,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.8,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  nominalSm: {
    fontSize: 27,
    lineHeight: 33,
  },
  nominalPrefix: {
    fontSize: 17,
    letterSpacing: 0,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.60)',
  },

  /* Row 4: Footer holder + CTA */
  row4: {
    marginTop: 'auto' as any,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 10,
    minHeight: MIN_TOUCH,
  },
  holderBlock: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'flex-end',
  },
  holderName: {
    fontFamily: typography.mono.fontFamily,
    fontSize: 14,
    lineHeight: 19,
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  holderUnit: {
    marginTop: 2,
    fontFamily: typography.monoSm.fontFamily,
    fontSize: 12,
    lineHeight: 16,
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 0.4,
  },
  ctaBtn: {
    height: 38,
    minWidth: 106,
    paddingHorizontal: 14,
    flexShrink: 0,
    borderRadius: radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  ctaBtnPrimary: {
    ...Platform.select({
      ios: {
        shadowColor: LIME,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.40,
        shadowRadius: 8,
      },
      default: {},
    }),
  },
  ctaBtnText: {
    fontFamily: typography.label.fontFamily,
    fontSize: 13,
    lineHeight: 17,
    letterSpacing: 0.2,
    fontWeight: '700',
  },
});

export default VirtualResidentCard;
