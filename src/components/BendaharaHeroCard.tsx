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
  Wallet,
  Receipt,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  ArrowDownLeft,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { colors, radius, typography, layout, TABULAR } from '../theme';
import { formatRupiah } from '../utils/format';

export interface BendaharaHeroCardProps {
  saldoKas?: number;
  totalLunas?: number;
  totalBelum?: number;
  countLunas?: number;
  countBelum?: number;
  totalWarga?: number;
  totalPemasukan?: number;
  totalPengeluaran?: number;
  periodLabel?: string;
  onPressManageBills?: () => void;
  onPressKas?: () => void;
}

export const BendaharaHeroCard: React.FC<BendaharaHeroCardProps> = ({
  saldoKas = 0,
  totalLunas = 0,
  totalBelum = 0,
  countLunas = 0,
  countBelum = 0,
  totalWarga = 0,
  totalPemasukan = 0,
  totalPengeluaran = 0,
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
          onPressKas?.();
        }}
        accessibilityRole="button"
        accessibilityLabel={`Pusat Keuangan Bendahara, saldo kas ${formatRupiah(saldoKas)}.`}
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
              <Wallet size={16} color="#A7F3D0" strokeWidth={2.4} />
              <Text style={styles.contextText}>PUSAT KEUANGAN LINGKUNGAN</Text>
            </View>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>Bendahara</Text>
            </View>
          </View>

          {/* Primary Metric: Saldo Kas */}
          <View style={styles.nominalSection}>
            <Text style={styles.nominalLabel}>
              SALDO KAS TERSEDIA • {displayPeriod.toUpperCase()}
            </Text>
            <Text style={styles.nominalValue}>{formatRupiah(saldoKas)}</Text>
          </View>

          {/* Progress Bar: Kepatuhan IPL Warga */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <TrendingUp size={13} color="#6EE7B7" />
                <Text style={styles.progressTitle}>Kepatuhan Iuran IPL Warga</Text>
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

          {/* Stat Pills Grid (Terkumpul & Tunggakan & Mutasi) */}
          <View style={styles.metricsGrid}>
            <View style={styles.metricCol}>
              <View style={styles.metricIconLabelRow}>
                <ArrowDownLeft size={12} color="#A7F3D0" />
                <Text style={styles.metricLabel}>Terkumpul</Text>
              </View>
              <Text style={[styles.metricVal, { color: '#D1FAE5' }]}>
                {formatRupiah(totalLunas)}
              </Text>
              <Text style={styles.metricNote}>{countLunas} KK Lunas</Text>
            </View>

            <View style={styles.metricDivider} />

            <Pressable
              onPress={() => {
                triggerHaptic();
                onPressManageBills?.();
              }}
              style={styles.metricCol}
            >
              <View style={styles.metricIconLabelRow}>
                <AlertCircle size={12} color="#FCA5A5" />
                <Text style={styles.metricLabel}>Tunggakan</Text>
              </View>
              <Text style={[styles.metricVal, { color: '#FECACA' }]}>
                {formatRupiah(totalBelum)}
              </Text>
              <Text style={styles.metricNote}>{countBelum} KK Belum</Text>
            </Pressable>

            <View style={styles.metricDivider} />

            <View style={styles.metricCol}>
              <View style={styles.metricIconLabelRow}>
                <TrendingUp size={12} color="#BAE6FD" />
                <Text style={styles.metricLabel}>Pemasukan Kas</Text>
              </View>
              <Text style={styles.metricVal}>{formatRupiah(totalPemasukan)}</Text>
              <Text style={styles.metricNote}>Bulan Ini</Text>
            </View>
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
              <Wallet size={16} color="#047857" strokeWidth={2.4} />
              <Text style={styles.actionBtnText}>Buka Buku Kas & Rekapitulasi</Text>
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
    color: '#A7F3D0',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  roleBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  roleBadgeText: {
    color: colors.surface,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  nominalSection: {
    marginBottom: 14,
  },
  nominalLabel: {
    color: '#A7F3D0',
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  nominalValue: {
    color: colors.surface,
    fontSize: 27,
    fontWeight: '900',
    letterSpacing: -0.5,
    fontVariant: TABULAR?.fontVariant || ['tabular-nums'],
  },
  progressSection: {
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressTitle: {
    color: '#D1FAE5',
    fontSize: 11.5,
    fontWeight: '600',
  },
  progressPercent: {
    color: '#6EE7B7',
    fontSize: 12,
    fontWeight: '800',
    fontVariant: TABULAR?.fontVariant || ['tabular-nums'],
  },
  progressBarTrack: {
    height: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderRadius: radius.full,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#34D399',
    borderRadius: radius.full,
  },
  progressSub: {
    color: '#A7F3D0',
    fontSize: 10.5,
    fontWeight: '500',
    opacity: 0.85,
  },
  metricsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
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
    color: '#E2E8F0',
    fontSize: 10,
    fontWeight: '600',
  },
  metricVal: {
    color: colors.surface,
    fontSize: 12.5,
    fontWeight: '800',
    fontVariant: TABULAR?.fontVariant || ['tabular-nums'],
    marginBottom: 1,
  },
  metricNote: {
    color: '#94A3B8',
    fontSize: 9.5,
    fontWeight: '500',
  },
  metricDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 16,
    gap: 8,
  },
  actionBtnText: {
    color: '#047857',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});

export default BendaharaHeroCard;
