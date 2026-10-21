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
  MessageSquareWarning,
  FileCheck,
  Users,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { colors, radius, typography, layout, TABULAR } from '../../theme';

export interface PengurusHeroCardProps {
  totalAduan?: number;
  pendingAduanCount?: number;
  totalSurat?: number;
  pendingSuratCount?: number;
  totalWarga?: number;
  periodLabel?: string;
  onPressPengaduan?: () => void;
  onPressSurat?: () => void;
}

export const PengurusHeroCard: React.FC<PengurusHeroCardProps> = ({
  totalAduan = 0,
  pendingAduanCount = 0,
  totalSurat = 0,
  pendingSuratCount = 0,
  totalWarga = 0,
  periodLabel,
  onPressPengaduan,
  onPressSurat,
}) => {
  const { width: screenWidth } = useWindowDimensions();
  const cardScale = useRef(new Animated.Value(1)).current;
  const btnScale = useRef(new Animated.Value(1)).current;

  const cardWidth = Math.min(screenWidth, layout.maxContentWidth) - 32;

  const resolvedAduan = Math.max(0, totalAduan - pendingAduanCount);
  const resolveRatio = totalAduan > 0 ? resolvedAduan / totalAduan : 1;
  const resolvePercent = Math.round(resolveRatio * 100);

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
          onPressPengaduan?.();
        }}
        accessibilityRole="button"
        accessibilityLabel={`Pusat Layanan Fasum Pengurus, ${pendingAduanCount + pendingSuratCount} layanan aktif.`}
        style={[styles.cardShadow, { width: cardWidth }]}
      >
        <LinearGradient
          colors={['#1E3A8A', '#1E40AF', '#0F172A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardGradient}
        >
          {/* Top Row: Context & Badge */}
          <View style={styles.topRow}>
            <View style={styles.contextWrap}>
              <ShieldCheck size={16} color="#93C5FD" strokeWidth={2.4} />
              <Text style={styles.contextText}>OPERASIONAL FASUM & LAYANAN</Text>
            </View>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>Pengurus</Text>
            </View>
          </View>

          {/* Primary Metric: Layanan Aktif */}
          <View style={styles.nominalSection}>
            <Text style={styles.nominalLabel}>
              PUSAT LAYANAN LINGKUNGAN • {displayPeriod.toUpperCase()}
            </Text>
            <Text style={styles.nominalValue}>
              {pendingAduanCount + pendingSuratCount > 0
                ? `${pendingAduanCount + pendingSuratCount} Layanan Aktif`
                : 'Semua Layanan Berjalan Lancar'}
            </Text>
          </View>

          {/* Progress Bar: Tingkat Penanganan Aduan */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <CheckCircle2 size={13} color="#93C5FD" />
                <Text style={styles.progressTitle}>Penyelesaian Aduan & Fasilitas</Text>
              </View>
              <Text style={styles.progressPercent}>{resolvePercent}% Tertangani</Text>
            </View>
            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${Math.min(Math.max(resolvePercent, 4), 100)}%` },
                ]}
              />
            </View>
            <Text style={styles.progressSub}>
              {resolvedAduan} dari {totalAduan} aduan fasilitas telah tuntas ditindaklanjuti
            </Text>
          </View>

          {/* Stat Pills Grid (Aduan & Surat & Warga) */}
          <View style={styles.metricsGrid}>
            <Pressable
              onPress={() => {
                triggerHaptic();
                onPressPengaduan?.();
              }}
              style={styles.metricCol}
            >
              <View style={styles.metricIconLabelRow}>
                <MessageSquareWarning size={12} color="#FCA5A5" />
                <Text style={styles.metricLabel}>Aduan Fasum</Text>
              </View>
              <Text style={[styles.metricVal, { color: pendingAduanCount > 0 ? '#FECACA' : '#93C5FD' }]}>
                {pendingAduanCount} Perlu Ditindak
              </Text>
              <Text style={styles.metricNote}>{totalAduan} Total Masuk</Text>
            </Pressable>

            <View style={styles.metricDivider} />

            <Pressable
              onPress={() => {
                triggerHaptic();
                onPressSurat?.();
              }}
              style={styles.metricCol}
            >
              <View style={styles.metricIconLabelRow}>
                <FileCheck size={12} color="#93C5FD" />
                <Text style={styles.metricLabel}>Surat Warga</Text>
              </View>
              <Text style={[styles.metricVal, { color: '#BFDBFE' }]}>
                {pendingSuratCount} Menunggu ACC
              </Text>
              <Text style={styles.metricNote}>{totalSurat} Pengajuan</Text>
            </Pressable>

            <View style={styles.metricDivider} />

            <View style={styles.metricCol}>
              <View style={styles.metricIconLabelRow}>
                <Users size={12} color="#A7F3D0" />
                <Text style={styles.metricLabel}>Data Penduduk</Text>
              </View>
              <Text style={styles.metricVal}>{totalWarga} Jiwa</Text>
              <Text style={styles.metricNote}>Terdata Aktif</Text>
            </View>
          </View>

          {/* Bottom Action Button */}
          <Animated.View style={{ transform: [{ scale: btnScale }] }}>
            <Pressable
              onPressIn={handleBtnPressIn}
              onPressOut={handleBtnPressOut}
              onPress={() => {
                triggerHaptic();
                onPressPengaduan?.();
              }}
              style={styles.actionBtn}
            >
              <ShieldCheck size={16} color="#1E40AF" strokeWidth={2.4} />
              <Text style={styles.actionBtnText}>Kelola Aduan & Layanan Fasum</Text>
              <ArrowRight size={15} color="#1E40AF" strokeWidth={2.4} />
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
    shadowColor: '#1E40AF',
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
    color: '#93C5FD',
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
    color: '#93C5FD',
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  nominalValue: {
    color: colors.surface,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.3,
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
    color: '#DBEAFE',
    fontSize: 11.5,
    fontWeight: '600',
  },
  progressPercent: {
    color: '#93C5FD',
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
    backgroundColor: '#60A5FA',
    borderRadius: radius.full,
  },
  progressSub: {
    color: '#BFDBFE',
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
    fontSize: 11.5,
    fontWeight: '800',
    fontVariant: TABULAR?.fontVariant || ['tabular-nums'],
    marginBottom: 1,
    textAlign: 'center',
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
    color: '#1E40AF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});

export default PengurusHeroCard;
