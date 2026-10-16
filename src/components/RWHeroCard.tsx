import React, { useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Building2,
  Wallet,
  Users,
  MapPin,
  ArrowRight,
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { colors, radius, typography, layout, TABULAR } from '../theme';
import { formatRupiah } from '../utils/format';

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

export const RWHeroCard: React.FC<RWHeroCardProps> = ({
  rwName = 'RW 01',
  totalWarga = 0,
  totalRT = 3,
  saldoKas = 0,
  totalPemasukan = 0,
  totalPengeluaran = 0,
  periodLabel,
  onPressKas,
  onPressWarga,
}) => {
  const { width: screenWidth } = useWindowDimensions();
  const cardScale = useRef(new Animated.Value(1)).current;
  const btnScale = useRef(new Animated.Value(1)).current;

  const cardWidth = Math.min(screenWidth, layout.maxContentWidth) - 32;

  const currentMonthName = new Date().toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric',
  });
  const displayPeriod = periodLabel || currentMonthName;

  const handleCardPressIn = () => {
    Animated.spring(cardScale, {
      toValue: 0.98,
      useNativeDriver: true,
      damping: 15,
      stiffness: 150,
      mass: 1,
    }).start();
  };

  const handleCardPressOut = () => {
    Animated.spring(cardScale, {
      toValue: 1,
      useNativeDriver: true,
      damping: 15,
      stiffness: 150,
      mass: 1,
    }).start();
  };

  const handleBtnPressIn = () => {
    Animated.spring(btnScale, {
      toValue: 0.95,
      useNativeDriver: true,
      damping: 15,
      stiffness: 150,
      mass: 1,
    }).start();
  };

  const handleBtnPressOut = () => {
    Animated.spring(btnScale, {
      toValue: 1,
      useNativeDriver: true,
      damping: 15,
      stiffness: 150,
      mass: 1,
    }).start();
  };

  const triggerHaptic = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    } catch {}
  };

  return (
    <Animated.View style={{ transform: [{ scale: cardScale }] }}>
      <Pressable
        onPressIn={handleCardPressIn}
        onPressOut={handleCardPressOut}
        onPress={() => {
          triggerHaptic();
          onPressKas?.();
        }}
        accessibilityRole="button"
        accessibilityLabel={`Ringkasan Koordinasi ${rwName}, ${formatRupiah(saldoKas)} total kas.`}
        style={[styles.cardShadow, { width: cardWidth }]}
      >
        <LinearGradient
          colors={['#3B0764', '#581C87', '#6D28D9']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardGradient}
        >
          {/* Top Row: Context & Role Badge */}
          <View style={styles.topRow}>
            <View style={styles.contextWrap}>
              <Building2 size={16} color="#DDD6FE" strokeWidth={2.4} />
              <Text style={styles.contextText}>KOORDINASI RUKUN WARGA</Text>
            </View>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>Ketua {rwName}</Text>
            </View>
          </View>

          {/* Primary Metric: Total Saldo Kas Wilayah */}
          <View style={styles.nominalSection}>
            <Text style={styles.nominalLabel}>
              TOTAL KAS SELURUH WILAYAH • {displayPeriod.toUpperCase()}
            </Text>
            <Text style={styles.nominalValue}>{formatRupiah(saldoKas)}</Text>
          </View>

          {/* Cakupan Wilayah & Integrasi RT Banner */}
          <View style={styles.coverageSection}>
            <View style={styles.coverageHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <TrendingUp size={13} color="#C4B5FD" />
                <Text style={styles.coverageTitle}>Cakupan Terpadu Lingkungan</Text>
              </View>
              <Text style={styles.coverageBadgeText}>{totalRT} Rukun Tetangga (RT)</Text>
            </View>
            <View style={styles.coverageTrack}>
              <View style={[styles.coverageFill, { width: '100%' }]} />
            </View>
            <Text style={styles.coverageSub}>
              Mengoordinasikan {totalWarga} KK di seluruh unit RT perumahan
            </Text>
          </View>

          {/* Stat Pills Grid (Pemasukan, Pengeluaran & Total Warga) */}
          <View style={styles.metricsGrid}>
            <View style={styles.metricCol}>
              <View style={styles.metricIconLabelRow}>
                <ArrowDownLeft size={12} color="#86EFAC" strokeWidth={2.5} />
                <Text style={styles.metricLabel}>Pemasukan</Text>
              </View>
              <Text style={[styles.metricVal, { color: '#BBF7D0' }]}>
                {formatRupiah(totalPemasukan)}
              </Text>
              <Text style={styles.metricNote}>Bulan Ini</Text>
            </View>

            <View style={styles.metricDivider} />

            <View style={styles.metricCol}>
              <View style={styles.metricIconLabelRow}>
                <ArrowUpRight size={12} color="#FCA5A5" strokeWidth={2.5} />
                <Text style={styles.metricLabel}>Belanja / Keluar</Text>
              </View>
              <Text style={[styles.metricVal, { color: '#FECACA' }]}>
                {formatRupiah(totalPengeluaran)}
              </Text>
              <Text style={styles.metricNote}>Fasum & Operasional</Text>
            </View>

            <View style={styles.metricDivider} />

            <Pressable
              onPress={() => {
                triggerHaptic();
                onPressWarga?.();
              }}
              style={styles.metricCol}
            >
              <View style={styles.metricIconLabelRow}>
                <Users size={12} color="#E9D5FF" />
                <Text style={styles.metricLabel}>Total Warga</Text>
              </View>
              <Text style={styles.metricVal}>{totalWarga} KK</Text>
              <Text style={styles.metricNote}>Semua RT</Text>
            </Pressable>
          </View>

          {/* Bottom Action Button */}
          <Animated.View style={{ transform: [{ scale: btnScale }] }}>
            <Pressable
              onPressIn={handleBtnPressIn}
              onPressOut={handleBtnPressOut}
              onPress={() => {
                triggerHaptic();
                onPressKas?.();
              }}
              style={styles.actionBtn}
            >
              <Wallet size={16} color="#581C87" strokeWidth={2.4} />
              <Text style={styles.actionBtnText}>Audit Kas & Transparansi RW</Text>
              <ArrowRight size={15} color="#581C87" strokeWidth={2.4} />
            </Pressable>
          </Animated.View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardShadow: {
    borderRadius: 22,
    shadowColor: '#581C87',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 8,
    overflow: 'hidden',
  },
  cardGradient: {
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  contextWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  contextText: {
    fontFamily: typography.monoSm?.fontFamily || undefined,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#DDD6FE',
  },
  roleBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  roleBadgeText: {
    fontFamily: typography.micro?.fontFamily || undefined,
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  nominalSection: {
    marginBottom: 14,
  },
  nominalLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.75)',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  nominalValue: {
    fontFamily: typography.display?.fontFamily || undefined,
    fontSize: 27,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    fontVariant: TABULAR?.fontVariant || ['tabular-nums'],
  },
  coverageSection: {
    backgroundColor: 'rgba(0, 0, 0, 0.16)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
  },
  coverageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  coverageTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F5F3FF',
  },
  coverageBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DDD6FE',
  },
  coverageTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
    marginBottom: 6,
  },
  coverageFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#A78BFA',
  },
  coverageSub: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.75)',
  },
  metricsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginBottom: 14,
  },
  metricCol: {
    flex: 1,
    alignItems: 'center',
  },
  metricIconLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    textTransform: 'uppercase',
  },
  metricVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 1,
  },
  metricNote: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.65)',
  },
  metricDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  actionBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#581C87',
    letterSpacing: 0.2,
  },
});

export default RWHeroCard;
