import React, { memo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  useWindowDimensions,
  Animated,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Rect, Line, Circle, Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';

import { colors, radius, typography, layout, TABULAR } from '../../theme';

/* -------------------------------------------------------------------------- */
/*  Types & Interfaces                                                        */
/* -------------------------------------------------------------------------- */

export interface AdminHeroCardProps {
  adminName?: string;
  totalWarga?: number;
  totalRT?: number;
  totalKas?: number;
  serverStatus?: string;
  isCloudConnected?: boolean;
  onPressSettings?: () => void;
  onPressManageUsers?: () => void;
  onPressCard?: () => void;
}

/* -------------------------------------------------------------------------- */
/*  Constants                                                                 */
/* -------------------------------------------------------------------------- */

const USE_NATIVE = Platform.OS !== 'web';
const GOLD = '#C9A84C';
const GOLD_LIGHT = '#E8C97A';

/* -------------------------------------------------------------------------- */
/*  Sub-component: EMV Chip                                                   */
/* -------------------------------------------------------------------------- */

const EmvChip: React.FC = memo(() => (
  <View style={chipStyles.wrapper}>
    <LinearGradient
      colors={[GOLD_LIGHT, GOLD, '#A07830', GOLD, GOLD_LIGHT]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={chipStyles.body}
    >
      <Svg width="38" height="28" viewBox="0 0 44 34">
        <Rect
          x="0.5"
          y="0.5"
          width="43"
          height="33"
          rx="5.5"
          stroke="rgba(160,120,48,0.70)"
          strokeWidth="1"
          fill="none"
        />
        <Line x1="15" y1="0" x2="15" y2="34" stroke="rgba(120,80,20,0.40)" strokeWidth="0.8" />
        <Line x1="29" y1="0" x2="29" y2="34" stroke="rgba(120,80,20,0.40)" strokeWidth="0.8" />
        <Line x1="0" y1="11" x2="44" y2="11" stroke="rgba(120,80,20,0.40)" strokeWidth="0.8" />
        <Line x1="0" y1="23" x2="44" y2="23" stroke="rgba(120,80,20,0.40)" strokeWidth="0.8" />
        <Rect
          x="15"
          y="11"
          width="14"
          height="12"
          rx="2"
          fill="rgba(160,120,48,0.25)"
          stroke="rgba(120,80,20,0.30)"
          strokeWidth="0.6"
        />
      </Svg>
    </LinearGradient>
  </View>
));

const chipStyles = StyleSheet.create({
  wrapper: {
    borderRadius: 5,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.30,
        shadowRadius: 3,
      },
      default: { elevation: 2 },
    }),
  },
  body: {
    width: 38,
    height: 28,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

/* -------------------------------------------------------------------------- */
/*  Sub-component: Contactless NFC icon                                       */
/* -------------------------------------------------------------------------- */

const ContactlessIcon: React.FC<{ color?: string }> = memo(({ color = 'rgba(255,255,255,0.45)' }) => (
  <Svg width="18" height="18" viewBox="0 0 24 24">
    <Path d="M12 2 Q18 8 18 12 Q18 16 12 22" stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none" />
    <Path d="M12 6 Q16 9 16 12 Q16 15 12 18" stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none" />
    <Path d="M12 10 Q14 10.8 14 12 Q14 13.2 12 14" stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none" />
    <Circle cx="12" cy="12" r="1.2" fill={color} />
  </Svg>
));

/* -------------------------------------------------------------------------- */
/*  Main Component: AdminHeroCard (Clean & Minimalist)                        */
/* -------------------------------------------------------------------------- */

export const AdminHeroCard: React.FC<AdminHeroCardProps> = ({
  adminName = 'Super Administrator',
  totalWarga = 0,
  totalRT = 0,
  serverStatus = 'Online',
  onPressCard,
  onPressSettings,
}) => {
  const { width: screenWidth } = useWindowDimensions();
  const cardScale = useRef(new Animated.Value(1)).current;

  const safeWidth = screenWidth || 360;
  const cardWidth = Math.max(300, Math.min(safeWidth, layout.maxContentWidth) - 32);
  const cardHeight = Math.floor(cardWidth / 1.62); // Sleek card ratio

  const handleCardPressIn = () => {
    Animated.spring(cardScale, {
      toValue: 0.985,
      useNativeDriver: USE_NATIVE,
      damping: 18,
      stiffness: 220,
    }).start();
  };

  const handleCardPressOut = () => {
    Animated.spring(cardScale, {
      toValue: 1,
      useNativeDriver: USE_NATIVE,
      damping: 18,
      stiffness: 220,
    }).start();
  };

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      } catch {}
    }
    if (onPressCard) onPressCard();
    else if (onPressSettings) onPressSettings();
  };

  return (
    <Animated.View style={[{ transform: [{ scale: cardScale }] }]}>
      <Pressable
        onPress={handlePress}
        onPressIn={handleCardPressIn}
        onPressOut={handleCardPressOut}
        accessible
        accessibilityRole="summary"
        accessibilityLabel={`Kartu Kontrol Admin IT. ${totalWarga} warga terdaftar. Server ${serverStatus}.`}
        style={[
          styles.cardContainer,
          {
            width: cardWidth,
            height: cardHeight,
          },
        ]}
      >
        <LinearGradient
          colors={['#06231A', '#0B3326', '#041711']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Soft radial ambient glow in corner */}
        <View style={styles.ambientLight} pointerEvents="none" />

        {/* ===================== 1. TOP: BRAND & LIVE STATUS ===================== */}
        <View style={styles.topRow}>
          <Text style={styles.brandText}>WARGAKU • ADMIN</Text>
          <View style={styles.statusRow}>
            <View style={styles.liveDot} />
            <Text style={styles.statusText}>{serverStatus}</Text>
          </View>
        </View>

        {/* ===================== 2. MIDDLE: EMV CHIP & CONTACTLESS ===================== */}
        <View style={styles.chipRow}>
          <EmvChip />
          <ContactlessIcon />
        </View>

        {/* ===================== 3. ESSENTIAL METRIC ===================== */}
        <View style={styles.metricBlock}>
          <View style={styles.metricNumRow}>
            <Text style={[styles.metricNumber, TABULAR]}>{totalWarga}</Text>
            <Text style={styles.metricSuffix}>Warga Terdaftar</Text>
          </View>
          <Text style={styles.metricSub}>{totalRT} Wilayah RT Terintegrasi</Text>
        </View>

        {/* ===================== 4. BOTTOM: HOLDER NAME & ROLE ===================== */}
        <View style={styles.bottomRow}>
          <Text style={styles.holderName} numberOfLines={1}>
            {adminName.toUpperCase()}
          </Text>
          <Text style={styles.roleTag}>SUPERADMIN</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
};

/* -------------------------------------------------------------------------- */
/*  Styles                                                                    */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    paddingHorizontal: 22,
    paddingVertical: 18,
    justifyContent: 'space-between',
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    ...Platform.select({
      ios: {
        shadowColor: '#021F17',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
      },
      default: {
        elevation: 6,
      },
    }),
  },
  ambientLight: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },

  /* 1. Top row */
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.70)',
    letterSpacing: 1.5,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34D399',
  },
  statusText: {
    fontFamily: typography.micro.fontFamily,
    fontSize: 11,
    fontWeight: '600',
    color: '#34D399',
    letterSpacing: 0.5,
  },

  /* 2. Chip row */
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  /* 3. Metric block */
  metricBlock: {
    justifyContent: 'center',
  },
  metricNumRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  metricNumber: {
    fontFamily: typography.display.fontFamily,
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.6,
  },
  metricSuffix: {
    fontFamily: typography.body.fontFamily,
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.80)',
  },
  metricSub: {
    fontFamily: typography.micro.fontFamily,
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(52, 211, 153, 0.85)',
    marginTop: 2,
  },

  /* 4. Bottom row */
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  holderName: {
    flex: 1,
    fontFamily: typography.mono.fontFamily,
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
    marginRight: 12,
  },
  roleTag: {
    fontFamily: typography.micro.fontFamily,
    fontSize: 10,
    fontWeight: '700',
    color: '#D4F636',
    letterSpacing: 0.8,
  },
});

export default AdminHeroCard;
