import React, { useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';

import { colors, radius, typography, layout, TABULAR } from '../theme';
import { formatRupiah, formatRupiahCompact } from '../utils/format';
import Skeleton from './ui/Skeleton';

export interface KasWidgetProps {
  balance?: number;
  incomeMonth?: number;
  expenseMonth?: number;
  periodLabel?: string;
  loading?: boolean;
  onPress?: () => void;
}

export const KasWidget: React.FC<KasWidgetProps> = ({
  balance = 48520000,
  incomeMonth = 6120000,
  expenseMonth = 1080000,
  periodLabel,
  loading = false,
  onPress,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (loading) return;
    try {
      Haptics.selectionAsync().catch(() => {});
    } catch {}
    Animated.timing(scaleAnim, {
      toValue: 0.98,
      duration: 90,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      damping: 15,
      stiffness: 150,
      mass: 1,
      useNativeDriver: true,
    }).start();
  };

  if (loading) {
    return (
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Skeleton width={140} height={12} borderRadius={4} />
          <Skeleton width={60} height={12} borderRadius={4} />
        </View>
        <Skeleton width={180} height={24} borderRadius={8} style={{ marginVertical: 12 }} />
        <Skeleton width="100%" height={10} borderRadius={5} style={{ marginBottom: 12 }} />
        <View style={styles.legendRow}>
          <Skeleton width={96} height={10} borderRadius={4} />
          <Skeleton width={96} height={10} borderRadius={4} />
        </View>
      </View>
    );
  }

  // Calculate percentages
  const totalFlow = incomeMonth + expenseMonth;
  const incomePercent = totalFlow > 0 ? Math.round((incomeMonth / totalFlow) * 100) : 50;
  const expensePercent = 100 - incomePercent;

  const currentMonthName = new Date().toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
  const displayPeriod = periodLabel || currentMonthName;

  const formattedBalance = balance >= 1000000000 ? formatRupiahCompact(balance) : formatRupiah(balance);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityLabel={`Saldo Kas Lingkungan ${displayPeriod}, ${formatRupiah(balance)}. Ketuk untuk membuka Buku Kas.`}
        style={styles.card}
      >
        {/* Header: Title and Period */}
        <View style={styles.headerRow}>
          <Text style={styles.titleText}>Saldo Kas Lingkungan</Text>
          <Text style={styles.periodText}>{displayPeriod}</Text>
        </View>

        {/* Display Balance */}
        <Text
          style={[
            styles.balanceText,
            TABULAR,
            balance < 0 && styles.balanceNegative,
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.6}
        >
          {formattedBalance}
        </Text>

        {balance < 0 && (
          <Text style={styles.negativeNotice}>Saldo di bawah nol — hubungi pengurus</Text>
        )}

        {/* Progress Bar (height 10, radius 5) */}
        <View style={styles.progressBarTrack}>
          {incomeMonth === 0 && expenseMonth === 0 ? (
            <View style={styles.emptyTrack} />
          ) : (
            <>
              <View
                style={[
                  styles.incomeSegment,
                  { width: `${Math.max(incomePercent, 4)}%` },
                ]}
              />
              <View
                style={[
                  styles.expenseSegment,
                  { width: `${Math.max(expensePercent, 4)}%` },
                ]}
              />
            </>
          )}
        </View>

        {/* Legend */}
        {incomeMonth === 0 && expenseMonth === 0 ? (
          <Text style={styles.emptyNotice}>Belum ada transaksi bulan ini</Text>
        ) : (
          <View style={styles.legendRow}>
            {/* Pemasukan */}
            <View style={styles.legendItem}>
              <View style={styles.legendTitleRow}>
                <View style={[styles.dot, { backgroundColor: colors.primary }]} />
                <Text style={styles.legendLabel}>Pemasukan</Text>
                <Text style={styles.legendPercent}>{incomePercent}%</Text>
              </View>
              <Text style={[styles.legendAmount, TABULAR]}>{formatRupiah(incomeMonth)}</Text>
            </View>

            {/* Operasional / Pengeluaran */}
            <View style={styles.legendItem}>
              <View style={styles.legendTitleRow}>
                <View style={[styles.dot, { backgroundColor: '#F59E0B', borderColor: '#D97706', borderWidth: 1 }]} />
                <Text style={styles.legendLabel}>Operasional</Text>
                <Text style={styles.legendPercent}>{expensePercent}%</Text>
              </View>
              <Text style={[styles.legendAmount, TABULAR]}>{formatRupiah(expenseMonth)}</Text>
            </View>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl, // 24
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      web: {
        boxShadow:
          '0px 1px 2px rgba(15, 23, 42, 0.04), 0px 4px 16px rgba(15, 23, 42, 0.05)',
      } as any,
      default: {
        shadowColor: colors.textPrimary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 16,
        elevation: 2,
      },
    }),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  titleText: {
    fontFamily: typography.labelSm.fontFamily,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary, // #475569
    fontWeight: '700',
  },
  periodText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12.5,
    lineHeight: 16,
    color: colors.textMuted, // #64748B
  },
  balanceText: {
    fontFamily: typography.displaySm.fontFamily,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.5,
    color: colors.textPrimary, // #0F172A
    fontWeight: '800',
    marginVertical: 6,
  },
  balanceNegative: {
    color: '#B91C1C',
  },
  negativeNotice: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    lineHeight: 16,
    color: '#B45309',
    marginBottom: 6,
  },
  progressBarTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.surfaceMuted, // #F1F5F9
    flexDirection: 'row',
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 12,
  },
  emptyTrack: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
  },
  incomeSegment: {
    height: 10,
    backgroundColor: colors.primary, // #064E3B
    borderTopLeftRadius: 5,
    borderBottomLeftRadius: 5,
  },
  expenseSegment: {
    height: 10,
    backgroundColor: '#F59E0B',
    borderLeftWidth: 2,
    borderLeftColor: '#FFFFFF',
    borderTopRightRadius: 5,
    borderBottomRightRadius: 5,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  legendItem: {
    flex: 1,
  },
  legendTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendLabel: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
    marginRight: 6,
  },
  legendPercent: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textMuted,
    fontWeight: '600',
  },
  legendAmount: {
    fontFamily: typography.bodyLg.fontFamily,
    fontSize: 15,
    lineHeight: 21,
    color: colors.textPrimary,
    fontWeight: '700',
    marginLeft: 14,
  },
  emptyNotice: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginVertical: 4,
  },
});

export default KasWidget;
