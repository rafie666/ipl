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
  ShieldCheck,
  Receipt,
  Users,
  Wallet,
  AlertCircle,
  ArrowRight,
  TrendingUp,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { colors, radius, typography, layout, TABULAR } from '../theme';
import { formatRupiah } from '../utils/format';

export interface RTHeroCardProps {
  rtName?: string;
  rwName?: string;
  totalLunas?: number;
  totalBelum?: number;
  countLunas?: number;
  countBelum?: number;
  totalWarga?: number;
  saldoKas?: number;
  periodLabel?: string;
  onPressManageBills?: () => void;
  onPressKas?: () => void;
}

export const RTHeroCard: React.FC<RTHeroCardProps> = ({
  rtName = 'RT 01',
  rwName = 'RW 01',
  totalLunas = 0,
  totalBelum = 0,
  countLunas = 0,
  countBelum = 0,
  totalWarga = 0,
  saldoKas = 0,
  periodLabel,
  onPressManageBills,
  onPressKas,
}) => {
  const { width: screenWidth } = useWindowDimensions();
  const cardScale = useRef(new Animated.Value(1)).current;
  const btnScale = useRef(new Animated.Value(1)).current;

  const cardWidth = Math.min(screenWidth, layout.maxContentWidth) - 32;

  const totalBills = countLunas + countBelum;
  const lunasRatio = totalBills > 0 ? countLunas / totalBills : 0;
  const lunasPercent = Math.round(lunasRatio * 100);

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
          onPressManageBills?.();
        }}
        accessibilityRole="button"
        accessibilityLabel={`Ringkasan Administrasi ${rtName}, ${formatRupiah(totalLunas)} terkumpul.`}
        style={[styles.cardShadow, { width: cardWidth }]}
      >
        <LinearGradient
          colors={['#064E3B', '#047857', '#022C22']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardGradient}
        >
          {/* Top Row: Context & Badge */}
          <View style={styles.topRow}>
            <View style={styles.contextWrap}>
              <ShieldCheck size={16} color="#A7F3D0" strokeWidth={2.4} />
              <Text style={styles.contextText}>ADMINISTRASI KEUANGAN</Text>
            </View>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>Ketua {rtName}</Text>
            </View>
          </View>

          {/* Primary Metric: Iuran Terkumpul */}
          <View style={styles.nominalSection}>
            <Text style={styles.nominalLabel}>
              TOTAL IURAN TERKUMPUL • {displayPeriod.toUpperCase()}
            </Text>
            <Text style={styles.nominalValue}>{formatRupiah(totalLunas)}</Text>
          </View>

          {/* Progress Bar: Kepatuhan Warga */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <TrendingUp size={13} color="#6EE7B7" />
                <Text style={styles.progressTitle}>Kepatuhan Iuran Warga</Text>
              </View>
              <Text style={styles.progressPercent}>{lunasPercent}% Lunas</Text>
            </View>
            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${Math.min(Math.max(lunasPercent, 3), 100)}%` },
                ]}
              />
            </View>
            <Text style={styles.progressSub}>
              {countLunas} dari {totalBills || totalWarga} KK telah menyelesaikan iuran
            </Text>
          </View>

          {/* Stat Pills Grid (Tunggakan & Kas RT & Total Warga) */}
          <View style={styles.metricsGrid}>
            <View style={styles.metricCol}>
              <View style={styles.metricIconLabelRow}>
                <AlertCircle size={12} color="#FCA5A5" />
                <Text style={styles.metricLabel}>Tunggakan</Text>
              </View>
              <Text style={[styles.metricVal, { color: '#FECACA' }]}>
                {formatRupiah(totalBelum)}
              </Text>
              <Text style={styles.metricNote}>{countBelum} KK Belum</Text>
            </View>

            <View style={styles.metricDivider} />

            <Pressable
              onPress={() => {
                triggerHaptic();
                onPressKas?.();
              }}
              style={styles.metricCol}
            >
              <View style={styles.metricIconLabelRow}>
                <Wallet size={12} color="#A7F3D0" />
                <Text style={styles.metricLabel}>Kas RT</Text>
              </View>
              <Text style={styles.metricVal}>{formatRupiah(saldoKas)}</Text>
              <Text style={styles.metricNote}>Saldo Tersedia</Text>
            </Pressable>

            <View style={styles.metricDivider} />

            <View style={styles.metricCol}>
              <View style={styles.metricIconLabelRow}>
                <Users size={12} color="#BAE6FD" />
                <Text style={styles.metricLabel}>Total Warga</Text>
              </View>
              <Text style={styles.metricVal}>{totalWarga} KK</Text>
              <Text style={styles.metricNote}>Di {rtName}</Text>
            </View>
          </View>

          {/* Bottom Action Button */}
          <Animated.View style={{ transform: [{ scale: btnScale }] }}>
            <Pressable
              onPressIn={handleBtnPressIn}
              onPressOut={handleBtnPressOut}
              onPress={() => {
                triggerHaptic();
                onPressManageBills?.();
              }}
              style={styles.actionBtn}
            >
              <Receipt size={16} color="#047857" strokeWidth={2.4} />
              <Text style={styles.actionBtnText}>Kelola & Terbitkan Tagihan RT</Text>
              <ArrowRight size={15} color="#047857" strokeWidth={2.4} />
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
    shadowColor: '#047857',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
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
    color: '#A7F3D0',
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
  progressSection: {
    backgroundColor: 'rgba(0, 0, 0, 0.14)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E6FFFA',
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: '700',
    color: '#34D399',
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34D399',
  },
  progressSub: {
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
    color: '#047857',
    letterSpacing: 0.2,
  },
});

export default RTHeroCard;
