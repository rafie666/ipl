import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { colors, typography } from '../../theme';

export interface NotificationBadgeProps {
  count?: number;
  maxCount?: number;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  dotOnly?: boolean;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count = 0,
  maxCount = 99,
  style,
  textStyle,
  dotOnly = false,
}) => {
  // Aturan §1: Hilangkan badge jika jumlah notifikasi menjadi nol / undefined. Jangan tampilkan badge 0.
  if (!count || count <= 0) {
    return null;
  }

  if (dotOnly) {
    return <View style={[styles.dot, style]} />;
  }

  // Aturan §1: Jika jumlah notifikasi melebihi 99, tampilkan 99+
  const label = count > maxCount ? `${maxCount}+` : String(count);

  return (
    <View style={[styles.badge, style]} pointerEvents="none">
      <Text style={[styles.badgeText, textStyle]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444', // Red indicator token
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  badgeText: {
    fontFamily: typography?.micro?.fontFamily || undefined,
    fontSize: 9.5,
    lineHeight: 12,
    color: '#FFFFFF',
    fontWeight: '800',
    textAlign: 'center',
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    zIndex: 10,
  },
});

export default NotificationBadge;
