import React, { useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import {
  Receipt,
  ArrowDownLeft,
  ArrowUpRight,
  PartyPopper,
  MessageSquareWarning,
  Users,
  ChevronRight,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { colors, radius, typography, shadows, TABULAR } from '../theme';
import { formatRupiah, formatRupiahCompact } from '../utils/format';
import Badge from './ui/Badge';
import Skeleton from './ui/Skeleton';

export type TransactionCategory =
  | 'ipl'
  | 'kas_masuk'
  | 'kas_keluar'
  | 'acara'
  | 'aduan'
  | 'kerja_bakti';

export interface TransactionListItemProps {
  id?: string;
  title: string;
  subInfo?: string;
  amount?: number;
  status?: string;
  category?: TransactionCategory | string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export const TransactionListItem: React.FC<TransactionListItemProps> = ({
  title,
  subInfo,
  amount,
  status = 'paid',
  category = 'ipl',
  onPress,
  disabled = false,
  loading = false,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled || loading) return;
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

  const getCategoryTheme = () => {
    const c = String(category || '').toLowerCase();
    switch (c) {
      case 'kas_masuk':
      case 'pemasukan':
        return {
          bg: '#EFF6FF',
          iconColor: '#1D4ED8',
          Icon: ArrowDownLeft,
        };
      case 'kas_keluar':
      case 'pengeluaran':
        return {
          bg: '#FEF2F2',
          iconColor: '#B91C1C',
          Icon: ArrowUpRight,
        };
      case 'acara':
      case 'iuran_acara':
        return {
          bg: '#FDF2F8',
          iconColor: '#BE185D',
          Icon: PartyPopper,
        };
      case 'aduan':
      case 'laporan':
        return {
          bg: '#FFFBEB',
          iconColor: '#B45309',
          Icon: MessageSquareWarning,
        };
      case 'kerja_bakti':
      case 'kegiatan':
        return {
          bg: '#F5F3FF',
          iconColor: '#6D28D9',
          Icon: Users,
        };
      case 'ipl':
      default:
        return {
          bg: '#ECFDF5',
          iconColor: '#047857',
          Icon: Receipt,
        };
    }
  };

  const cat = getCategoryTheme();
  const IconComp = cat.Icon;

  if (loading) {
    return (
      <View style={styles.container}>
        <Skeleton width={42} height={42} borderRadius={21} />
        <View style={styles.centerCol}>
          <Skeleton width={148} height={14} borderRadius={6} />
          <Skeleton width={104} height={10} borderRadius={5} style={{ marginTop: 8 }} />
        </View>
        <View style={styles.rightCol}>
          <Skeleton width={72} height={14} borderRadius={7} />
          <Skeleton width={48} height={18} borderRadius={9} style={{ marginTop: 6 }} />
        </View>
      </View>
    );
  }

  // Format amount
  const hasAmount = amount !== undefined && amount !== null;
  const isKasMasuk = category === 'kas_masuk' || category === 'pemasukan';
  const isKasKeluar = (category === 'kas_keluar' || category === 'pengeluaran') || (amount && amount < 0);

  let formattedAmount = '';
  let amountColor: string = colors.textPrimary; // #0F172A

  if (hasAmount) {
    const absVal = Math.abs(amount!);
    const displayVal = absVal >= 1000000000 ? formatRupiahCompact(absVal) : formatRupiah(absVal);
    if (isKasMasuk) {
      formattedAmount = `+${displayVal}`;
      amountColor = '#047857'; // Green
    } else if (isKasKeluar) {
      formattedAmount = `-${displayVal}`;
      amountColor = colors.textPrimary; // Normal dark, not red as per §4.4.3
    } else {
      formattedAmount = displayVal;
    }
  }

  const a11yLabel = `${title}, ${hasAmount ? formatRupiah(amount!) : ''}, ${status}, ${subInfo || ''}`;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={a11yLabel}
        accessibilityState={{ disabled }}
        style={({ pressed }) => [
          styles.container,
          pressed && styles.containerPressed,
          disabled && styles.containerDisabled,
        ]}
      >
        {/* Category Icon */}
        <View style={[styles.iconCircle, { backgroundColor: cat.bg }]}>
          <IconComp size={20} color={cat.iconColor} strokeWidth={2.2} />
        </View>

        {/* Center column: Title + Sub-info */}
        <View style={styles.centerCol}>
          <Text
            style={styles.titleText}
            numberOfLines={1}
            ellipsizeMode="tail"
            maxFontSizeMultiplier={1.3}
          >
            {title}
          </Text>
          {subInfo ? (
            <Text
              style={styles.subInfoText}
              numberOfLines={1}
              ellipsizeMode="tail"
              maxFontSizeMultiplier={1.3}
            >
              {subInfo}
            </Text>
          ) : null}
        </View>

        {/* Right column: Amount + Status badge */}
        <View style={styles.rightCol}>
          {hasAmount && (
            <Text
              style={[
                styles.amountText,
                TABULAR,
                { color: amountColor },
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
            >
              {formattedAmount}
            </Text>
          )}
          {status ? (
            <Badge
              statusKey={status}
              style={{ marginTop: 4 }}
            />
          ) : null}
        </View>

        {/* Chevron Right */}
        {!disabled && (
          <ChevronRight
            size={16}
            color="#94A3B8"
            style={styles.chevron}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          />
        )}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    minHeight: 70,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg, // 18
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      web: {
        boxShadow:
          '0px 1px 2px rgba(15, 23, 42, 0.04), 0px 4px 16px rgba(15, 23, 42, 0.05)',
      } as any,
      default: {
        shadowColor: colors.textPrimary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 2,
      },
    }),
  },
  containerPressed: {
    backgroundColor: '#F8FAFC',
    ...Platform.select({
      web: {
        boxShadow:
          '0px 1px 2px rgba(15, 23, 42, 0.04), 0px 2px 8px rgba(15, 23, 42, 0.04)',
      } as any,
      default: {
        shadowOpacity: 0.03,
        elevation: 1,
      },
    }),
  },
  containerDisabled: {
    opacity: 0.5,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  centerCol: {
    flex: 1,
    minWidth: 0, // Allows ellipsis
    justifyContent: 'center',
  },
  titleText: {
    fontFamily: typography?.h3?.fontFamily || undefined,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textPrimary, // #0F172A
    fontWeight: '600',
  },
  subInfoText: {
    fontFamily: typography?.caption?.fontFamily || undefined,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textMuted, // #64748B
    marginTop: 2,
  },
  rightCol: {
    flexShrink: 0,
    alignItems: 'flex-end',
    justifyContent: 'center',
    minWidth: 72,
    marginLeft: 8,
  },
  amountText: {
    fontFamily: typography?.bodyLg?.fontFamily || undefined,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '700',
  },
  chevron: {
    marginLeft: 8,
  },
});

export default TransactionListItem;
