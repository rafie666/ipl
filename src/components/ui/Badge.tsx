import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle, TextStyle } from 'react-native';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Hourglass,
  XCircle,
  Info,
} from 'lucide-react-native';
import { status, StatusKey, radius, typography } from '../../theme';

export interface BadgeProps {
  statusKey?: StatusKey | string;
  label?: string;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const Badge: React.FC<BadgeProps> = ({
  statusKey = 'info',
  label,
  icon,
  style,
  textStyle,
}) => {
  // Normalize status key
  const s = String(statusKey || '').toLowerCase().trim();
  let key: StatusKey = 'info';

  if (s === 'paid' || s === 'lunas' || s === 'terbayar' || s === 'sukses' || s === 'aktif') {
    key = 'paid';
  } else if (s === 'overdue' || s === 'lewat tempo' || s.includes('lewat')) {
    key = 'overdue';
  } else if (s === 'unpaid' || s === 'belum bayar' || s === 'belum lunas' || s.includes('belum')) {
    key = 'unpaid';
  } else if (s === 'pending' || s === 'verifikasi' || s === 'menunggu' || s === 'proses') {
    key = 'pending';
  } else if (s === 'rejected' || s === 'ditolak' || s === 'batal') {
    key = 'rejected';
  } else {
    key = 'info';
  }

  const config = status[key];
  const displayLabel = (label || config.label).toUpperCase();

  const renderIcon = () => {
    if (icon) return icon;
    const iconSize = 12;
    const iconColor = config.fg;

    switch (key) {
      case 'paid':
        return <CheckCircle2 size={iconSize} color={iconColor} strokeWidth={2.2} />;
      case 'unpaid':
        return <Clock size={iconSize} color={iconColor} strokeWidth={2.2} />;
      case 'overdue':
        return <AlertCircle size={iconSize} color={iconColor} strokeWidth={2.2} />;
      case 'pending':
        return <Hourglass size={iconSize} color={iconColor} strokeWidth={2.2} />;
      case 'rejected':
        return <XCircle size={iconSize} color={iconColor} strokeWidth={2.2} />;
      case 'info':
      default:
        return <Info size={iconSize} color={iconColor} strokeWidth={2.2} />;
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: config.bg,
          borderColor: config.border,
        },
        style,
      ]}
      accessibilityRole="text"
      accessibilityLabel={`Status: ${displayLabel}`}
    >
      <View style={styles.iconWrapper}>{renderIcon()}</View>
      <Text
        numberOfLines={1}
        style={[
          styles.text,
          { color: config.fg },
          textStyle,
        ]}
      >
        {displayLabel}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 20,
    paddingHorizontal: 8,
    borderRadius: radius.sm, // 10
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: typography?.micro?.fontFamily || undefined,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.5,
    fontWeight: '700',
    textAlign: 'center',
  },
});

export default Badge;
