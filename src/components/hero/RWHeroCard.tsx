import React, {
  memo,
  useCallback,
  useEffect,
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
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Rect, Line, Circle, Path } from 'react-native-svg';
import {
  Wallet,
  Users,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { colors, radius, typography, layout, TABULAR } from '../../theme';
import { formatRupiah } from '../../utils/format';

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

export interface RWHeroCardProps {
  rwName?: string;
  totalWarga?: number;
  totalRT?: number;
  saldoKas?: number;
  totalPemasukan?: number;
  totalPengeluaran?: number;
  periodLabel?: string;
  onPressKas?: () => void;
  onPressWarga?: () => void;
}

/* ------------------------------------------------------------------ */
/*  Konstanta                                                           */
/* ------------------------------------------------------------------ */

const USE_NATIVE    = Platform.OS !== 'web';
const USE_NATIVE_3D = false;
const GOLD          = '#C9A84C';
const GOLD_LIGHT    = '#E8C97A';
const LIME          = '#D4F636';
const LIME_INK      = '#022C22';

/* ------------------------------------------------------------------ */
/*  Sub-komponen: EMV Chip                                              */
/* ------------------------------------------------------------------ */

const EmvChip: React.FC = memo(() => (
  <View style={chipSt.wrapper}>
    <LinearGradient
      colors={[GOLD_LIGHT, GOLD, '#A07830', GOLD, GOLD_LIGHT]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={chipSt.body}
    >
      <Svg width="44" height="34" viewBox="0 0 44 34">
        <Rect x="0.5" y="0.5" width="43" height="33" rx="5.5"
          stroke="rgba(160,120,48,0.70)" strokeWidth="1" fill="none" />
        <Line x1="15" y1="0" x2="15" y2="34" stroke="rgba(120,80,20,0.40)" strokeWidth="0.8" />
        <Line x1="29" y1="0" x2="29" y2="34" stroke="rgba(120,80,20,0.40)" strokeWidth="0.8" />
        <Line x1="0" y1="11" x2="44" y2="11" stroke="rgba(120,80,20,0.40)" strokeWidth="0.8" />
        <Line x1="0" y1="23" x2="44" y2="23" stroke="rgba(120,80,20,0.40)" strokeWidth="0.8" />
        <Rect x="15" y="11" width="14" height="12" rx="2"
          fill="rgba(160,120,48,0.25)" stroke="rgba(120,80,20,0.30)" strokeWidth="0.6" />
        <Rect x="0.5" y="0.5" width="14" height="10" rx="2" fill="rgba(255,255,255,0.10)" />
        <Rect x="29.5" y="0.5" width="14" height="10" rx="2" fill="rgba(255,255,255,0.08)" />
      </Svg>
    </LinearGradient>
  </View>
));

const chipSt = StyleSheet.create({
  wrapper: {
    borderRadius: 6,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.30, shadowRadius: 4 },
      default: { elevation: 3 },
    }),
  },
  body: { width: 44, height: 34, borderRadius: 6 },
});

/* ------------------------------------------------------------------ */
/*  Sub-komponen: Contactless icon                                      */
/* ------------------------------------------------------------------ */

const ContactlessIcon: React.FC<{ color?: string }> = memo(({ color = 'rgba(255,255,255,0.45)' }) => (
  <Svg width="22" height="22" viewBox="0 0 24 24">
    <Path d="M12 2 Q18 8 18 12 Q18 16 12 22" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" />
    <Path d="M12 6 Q16 9 16 12 Q16 15 12 18" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" />
    <Path d="M12 10 Q14 10.8 14 12 Q14 13.2 12 14" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" />
    <Circle cx="12" cy="12" r="1.5" fill={color} />
  </Svg>
));

/* ------------------------------------------------------------------ */
/*  Hooks                                                               */
/* ------------------------------------------------------------------ */

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
        toValue, useNativeDriver: USE_NATIVE,
        damping: 18, stiffness: 260, mass: 0.8,
      }).start();
    },
    [scale, reduceMotion],
  );
  const onPressIn  = useCallback(() => animateTo(pressedTo), [animateTo, pressedTo]);
  const onPressOut = useCallback(() => animateTo(1), [animateTo]);
  return { scale, onPressIn, onPressOut };
}

const haptic = () => {
  if (Platform.OS === 'web') return;
  try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); } catch {}
};

/* ------------------------------------------------------------------ */
/*  Komponen Utama                                                      */
/* ------------------------------------------------------------------ */

export const RWHeroCard: React.FC<RWHeroCardProps> = ({
  rwName           = 'RW 01',
  totalWarga       = 0,
  totalRT          = 3,
  saldoKas         = 0,
  totalPemasukan   = 0,
  totalPengeluaran = 0,
  periodLabel,
  onPressKas,
  onPressWarga,
}) => {
  const { width: screenWidth } = useWindowDimensions();
  const reduceMotion = useReduceMotion();
  const card = usePressScale(0.974, reduceMotion);
  const btn  = usePressScale(0.94,  reduceMotion);

  const safeWidth  = screenWidth || 360;
  const cardWidth  = Math.max(300, Math.min(safeWidth, layout.maxContentWidth) - 32);
  const cardHeight = Math.floor(cardWidth / 1.586);
  const compact    = cardWidth < 330;
  const p          = compact ? 18 : 22;

  /* ---- Float + Tilt 3D ---- */
  const floatAnim = useRef(new Animated.Value(0)).current;
  const tiltAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduceMotion) { floatAnim.setValue(0.5); tiltAnim.setValue(0.5); return; }
    const floatLoop = Animated.loop(Animated.sequence([
      Animated.timing(floatAnim, { toValue: 1, duration: 2900, easing: Easing.inOut(Easing.sin), useNativeDriver: USE_NATIVE_3D }),
      Animated.timing(floatAnim, { toValue: 0, duration: 2900, easing: Easing.inOut(Easing.sin), useNativeDriver: USE_NATIVE_3D }),
    ]));
    const tiltLoop = Animated.loop(Animated.sequence([
      Animated.timing(tiltAnim, { toValue: 1, duration: 3800, easing: Easing.inOut(Easing.sin), useNativeDriver: USE_NATIVE_3D }),
      Animated.timing(tiltAnim, { toValue: 0, duration: 3800, easing: Easing.inOut(Easing.sin), useNativeDriver: USE_NATIVE_3D }),
    ]));
    floatLoop.start();
    tiltLoop.start();
    return () => { floatLoop.stop(); tiltLoop.stop(); };
  }, [reduceMotion, floatAnim, tiltAnim]);

  const translateY = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [-5, 5] });
  const rotateX    = floatAnim.interpolate({ inputRange: [0, 1], outputRange: ['-2deg', '2deg'] });
  const rotateY    = tiltAnim.interpolate({  inputRange: [0, 1], outputRange: ['-3deg', '3deg'] });
  const rotateZ    = tiltAnim.interpolate({  inputRange: [0, 1], outputRange: ['-0.4deg', '0.4deg'] });
  const shineX     = tiltAnim.interpolate({ inputRange: [0, 1], outputRange: [-cardWidth, cardWidth] });
  const shineO     = tiltAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.0, 0.24, 0.0] });

  const displayPeriod = periodLabel || new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  return (
    <Animated.View
      style={[
        st.outerWrap,
        { width: cardWidth, transform: [{ scale: card.scale }] },
      ]}
    >
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
        <View style={[st.card, { height: cardHeight }]}>

          {/* Latar gradient — teal-emerald gelap */}
          <LinearGradient
            colors={['#084040', '#064E3B', '#033428', '#021E18']}
            start={{ x: 0.0, y: 0.0 }}
            end={{ x: 1.0, y: 1.0 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <LinearGradient
            colors={['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.02)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 0.5 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />

          <View style={st.circleDecorBR} pointerEvents="none" />
          <View style={st.circleDecorTL} pointerEvents="none" />

          {/* Stripe teal */}
          <View
            style={[st.accentStripe, { backgroundColor: 'rgba(94,234,212,0.40)' }]}
            pointerEvents="none"
          />

          {!reduceMotion && (
            <Animated.View
              pointerEvents="none"
              style={[st.shineWrap, { opacity: shineO, transform: [{ translateX: shineX }, { rotate: '20deg' }] }]}
            >
              <LinearGradient
                colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.20)', 'rgba(255,255,255,0)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={st.shineGrad}
              />
            </Animated.View>
          )}

          <Pressable
            onPress={() => { haptic(); onPressKas?.(); }}
            onPressIn={card.onPressIn}
            onPressOut={card.onPressOut}
            accessibilityRole="button"
            accessibilityLabel={`Koordinasi ${rwName}, saldo kas ${formatRupiah(saldoKas)}`}
            style={StyleSheet.absoluteFill}
          />

          <View style={[st.content, { padding: p }]} pointerEvents="box-none">

            {/* ROW 1 */}
            <View style={st.row1} pointerEvents="none">
              <View>
                <Text style={st.issuerLabel} numberOfLines={1}>EXECUTIVE CARD</Text>
                <Text style={st.issuerSub} numberOfLines={1}>Ketua {rwName} · {totalRT} RT</Text>
              </View>
              <ContactlessIcon />
            </View>

            {/* ROW 2: Chip + warga pill */}
            <View style={st.row2} pointerEvents="none">
              <EmvChip />
              <View style={st.statusPill}>
                <Users size={10} color="#5EEAD4" strokeWidth={2.5} />
                <Text style={st.pillText}>{totalWarga} KK</Text>
              </View>
            </View>

            {/* ROW 3: Saldo kas */}
            <View style={st.row3} pointerEvents="none">
              <Text style={st.periodLabel} numberOfLines={1}>
                KAS WILAYAH · {displayPeriod.toUpperCase()}
              </Text>
              <Text
                style={[st.nominal, compact && st.nominalSm, TABULAR]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.65}
              >
                <Text style={st.nominalPrefix}>Rp </Text>
                {saldoKas.toLocaleString('id-ID')}
              </Text>
            </View>

            {/* ROW 4: Footer */}
            <View style={st.row4} pointerEvents="box-none">
              <View style={st.holderBlock} pointerEvents="none">
                <View style={st.cashFlowRow}>
                  <ArrowDownLeft size={11} color="#34D399" strokeWidth={2.5} />
                  <Text style={st.cashIn} numberOfLines={1}>{formatRupiah(totalPemasukan)}</Text>
                  <Text style={st.cashSep}>·</Text>
                  <ArrowUpRight size={11} color="#FCA5A5" strokeWidth={2.5} />
                  <Text style={st.cashOut} numberOfLines={1}>{formatRupiah(totalPengeluaran)}</Text>
                </View>
                <Text style={st.holderUnit} numberOfLines={1}>Bulan ini</Text>
              </View>

              <Animated.View style={{ transform: [{ scale: btn.scale }] }}>
                <Pressable
                  onPress={() => { haptic(); onPressKas?.(); }}
                  onPressIn={btn.onPressIn}
                  onPressOut={btn.onPressOut}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  accessibilityRole="button"
                  accessibilityLabel="Buka Kas"
                  style={[st.ctaBtn, { backgroundColor: LIME }]}
                >
                  <Wallet size={14} color={LIME_INK} strokeWidth={2.5} />
                  <Text style={[st.ctaBtnText, { color: LIME_INK }]}>Buku Kas</Text>
                </Pressable>
              </Animated.View>
            </View>

          </View>
        </View>
      </Animated.View>
    </Animated.View>
  );
};

/* ------------------------------------------------------------------ */
/*  Styles                                                              */
/* ------------------------------------------------------------------ */

const st = StyleSheet.create({
  outerWrap: {
    alignSelf: 'center',
    ...Platform.select({
      web: { filter: 'drop-shadow(0px 16px 40px rgba(2,44,34,0.45)) drop-shadow(0px 4px 12px rgba(2,44,34,0.30))' } as any,
      ios: { shadowColor: '#011E16', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.50, shadowRadius: 28 },
      android: { elevation: 14 },
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
  circleDecorBR: {
    position: 'absolute', width: 260, height: 260, borderRadius: 130,
    right: -90, bottom: -90,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  circleDecorTL: {
    position: 'absolute', width: 160, height: 160, borderRadius: 80,
    left: -50, top: -50,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  accentStripe: {
    position: 'absolute', left: 0, right: 0, height: 1, top: '55%', opacity: 0.6,
  },
  shineWrap: {
    position: 'absolute', top: -100, bottom: -100, width: 120, alignItems: 'center', left: -60,
  },
  shineGrad: { width: '100%', height: '100%' },
  content: { flex: 1 },
  row1: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
  },
  issuerLabel: {
    ...typography.monoSm, fontSize: 11, letterSpacing: 1.6,
    color: GOLD_LIGHT, fontWeight: '700', textTransform: 'uppercase',
  },
  issuerSub: {
    ...typography.monoSm, fontSize: 9, letterSpacing: 0.6,
    color: 'rgba(255,255,255,0.45)', marginTop: 1, textTransform: 'uppercase',
  },
  row2: {
    marginTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  statusPill: {
    height: 26, paddingHorizontal: 10, borderRadius: radius.full,
    borderWidth: 1, borderColor: 'rgba(94,234,212,0.35)',
    backgroundColor: 'rgba(94,234,212,0.12)',
    flexDirection: 'row', alignItems: 'center', gap: 5,
  },
  pillText: {
    ...typography.micro, fontSize: 10, letterSpacing: 0.7,
    color: '#5EEAD4', fontWeight: '700',
  },
  row3: { marginTop: 18 },
  periodLabel: {
    ...typography.caption, fontSize: 10, letterSpacing: 0.8,
    color: 'rgba(255,255,255,0.50)', textTransform: 'uppercase', fontWeight: '600',
  },
  nominal: {
    marginTop: 3, ...typography.display,
    fontSize: 32, lineHeight: 38, letterSpacing: -0.8, color: '#FFFFFF', fontWeight: '800',
  },
  nominalSm: { fontSize: 27, lineHeight: 33 },
  nominalPrefix: {
    fontSize: 17, letterSpacing: 0, fontWeight: '700', color: 'rgba(255,255,255,0.60)',
  },
  row4: {
    marginTop: 'auto' as any,
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10,
    minHeight: 44,
  },
  holderBlock: { flex: 1, minWidth: 0, justifyContent: 'flex-end' },
  cashFlowRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'nowrap',
  },
  cashIn: {
    ...typography.monoSm, fontSize: 11, color: '#86EFAC', fontWeight: '700',
  },
  cashSep: {
    ...typography.monoSm, fontSize: 11, color: 'rgba(255,255,255,0.30)',
  },
  cashOut: {
    ...typography.monoSm, fontSize: 11, color: '#FCA5A5', fontWeight: '700',
  },
  holderUnit: {
    marginTop: 2, ...typography.monoSm, fontSize: 11, lineHeight: 16,
    color: 'rgba(255,255,255,0.40)', letterSpacing: 0.4,
  },
  ctaBtn: {
    height: 38, minWidth: 100, paddingHorizontal: 14, flexShrink: 0,
    borderRadius: radius.full, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  ctaBtnText: {
    ...typography.label, fontSize: 13, lineHeight: 17, letterSpacing: 0.2, fontWeight: '700',
  },
});

export default RWHeroCard;
