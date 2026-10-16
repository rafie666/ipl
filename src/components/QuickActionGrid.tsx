import React, { useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  Animated,
  Linking,
  ToastAndroid,
  Platform,
  Alert,
} from 'react-native';
import {
  Receipt,
  MessageSquareWarning,
  FileCheck,
  ShieldCheck,
  Wallet,
  PartyPopper,
  MapPin,
  PhoneCall,
  Users,
  Compass,
  Calendar,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { colors, radius, typography, layout, actionTints } from '../theme';
import Skeleton from './ui/Skeleton';
import { NotificationBadge } from './ui/NotificationBadge';

export interface QuickActionItem {
  id: string;
  label: string;
  iconName: 'Receipt' | 'MessageSquareWarning' | 'FileCheck' | 'ShieldCheck' | 'Wallet' | 'PartyPopper' | 'MapPin' | 'PhoneCall' | 'Users' | 'Compass' | 'Calendar' | string;
  bg: string;
  iconColor: string;
  badgeCount?: number;
  disabled?: boolean;
  disabledMessage?: string;
  onPress?: () => void;
}

export interface QuickActionGridProps {
  actions?: QuickActionItem[];
  onActionPress?: (actionId: string) => void;
  isOffline?: boolean;
  loading?: boolean;
  badges?: { [actionId: string]: number };
}

export const QuickActionGrid: React.FC<QuickActionGridProps> = ({
  actions,
  onActionPress,
  isOffline = false,
  loading = false,
  badges = {},
}) => {
  const { width: screenWidth } = useWindowDimensions();
  const contentWidth = Math.min(screenWidth, layout.maxContentWidth) - 32;
  const cellWidth = Math.floor((contentWidth - 24) / 4);

  const defaultActions: QuickActionItem[] = [
    {
      id: 'bayar',
      label: 'Bayar IPL',
      iconName: 'Receipt',
      bg: actionTints.bayar.bg,
      iconColor: actionTints.bayar.icon,
    },
    {
      id: 'lapor',
      label: 'Lapor',
      iconName: 'MessageSquareWarning',
      bg: actionTints.lapor.bg,
      iconColor: actionTints.lapor.icon,
      badgeCount: badges['lapor'],
    },
    {
      id: 'surat',
      label: 'Surat RT',
      iconName: 'FileCheck',
      bg: actionTints.surat.bg,
      iconColor: actionTints.surat.icon,
      badgeCount: badges['surat'],
      disabled: isOffline,
      disabledMessage: 'Fitur ini butuh koneksi internet',
    },
    {
      id: 'satpam',
      label: 'Jadwal Satpam',
      iconName: 'ShieldCheck',
      bg: actionTints.satpam.bg,
      iconColor: actionTints.satpam.icon,
    },
    {
      id: 'kas',
      label: 'Buku Kas',
      iconName: 'Wallet',
      bg: actionTints.kas.bg,
      iconColor: actionTints.kas.icon,
    },
    {
      id: 'acara',
      label: 'Iuran Acara',
      iconName: 'PartyPopper',
      bg: actionTints.acara.bg,
      iconColor: actionTints.acara.icon,
      disabled: isOffline,
      disabledMessage: 'Fitur ini butuh koneksi internet',
    },
    {
      id: 'denah',
      label: 'Denah',
      iconName: 'MapPin',
      bg: actionTints.denah.bg,
      iconColor: actionTints.denah.icon,
    },
    {
      id: 'darurat',
      label: 'Darurat',
      iconName: 'PhoneCall',
      bg: actionTints.darurat.bg,
      iconColor: actionTints.darurat.icon,
      // Emergency is always active
      disabled: false,
    },
  ];

  const renderIcon = (name: string, color: string) => {
    const size = 24;
    const strokeWidth = 2;
    switch (name) {
      case 'Receipt':
        return <Receipt size={size} color={color} strokeWidth={strokeWidth} />;
      case 'MessageSquareWarning':
        return <MessageSquareWarning size={size} color={color} strokeWidth={strokeWidth} />;
      case 'FileCheck':
        return <FileCheck size={size} color={color} strokeWidth={strokeWidth} />;
      case 'ShieldCheck':
        return <ShieldCheck size={size} color={color} strokeWidth={strokeWidth} />;
      case 'Wallet':
        return <Wallet size={size} color={color} strokeWidth={strokeWidth} />;
      case 'PartyPopper':
        return <PartyPopper size={size} color={color} strokeWidth={strokeWidth} />;
      case 'MapPin':
        return <MapPin size={size} color={color} strokeWidth={strokeWidth} />;
      case 'PhoneCall':
        return <PhoneCall size={size} color={color} strokeWidth={strokeWidth} />;
      case 'Users':
        return <Users size={size} color={color} strokeWidth={strokeWidth} />;
      case 'Compass':
        return <Compass size={size} color={color} strokeWidth={strokeWidth} />;
      case 'Calendar':
        return <Calendar size={size} color={color} strokeWidth={strokeWidth} />;
      default:
        return <Receipt size={size} color={color} strokeWidth={strokeWidth} />;
    }
  };

  const showToast = (message: string) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      Alert.alert('Info', message);
    }
  };

  const actionList = actions && actions.length > 0 ? actions : defaultActions;

  if (loading) {
    return (
      <View style={styles.grid}>
        {Array.from({ length: 8 }).map((_, i) => (
          <View key={i} style={[styles.cell, { width: cellWidth }]}>
            <Skeleton width={58} height={58} borderRadius={18} />
            <Skeleton width={48} height={10} borderRadius={5} style={{ marginTop: 8 }} />
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.grid}>
      {actionList.map((item) => {
        return (
          <QuickActionCell
            key={item.id}
            item={item}
            width={cellWidth}
            renderIcon={renderIcon}
            onPressAction={(id) => {
              if (item.disabled) {
                showToast(item.disabledMessage || 'Fitur belum tersedia');
                return;
              }
              onActionPress?.(id);
            }}
          />
        );
      })}
    </View>
  );
};

interface CellProps {
  item: QuickActionItem;
  width: number;
  renderIcon: (name: string, color: string) => React.ReactNode;
  onPressAction: (id: string) => void;
}

const QuickActionCell: React.FC<CellProps> = ({
  item,
  width,
  renderIcon,
  onPressAction,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (item.disabled) return;
    try {
      Haptics.selectionAsync().catch(() => {});
    } catch {}
    Animated.timing(scaleAnim, {
      toValue: 0.94,
      duration: 90,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      damping: 15,
      stiffness: 150,
      mass: 1,
    }).start();
  };

  const badgeText = item.badgeCount && item.badgeCount > 9 ? '9+' : String(item.badgeCount || '');

  return (
    <Pressable
      onPress={() => onPressAction(item.id)}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityLabel={item.label}
      accessibilityState={{ disabled: Boolean(item.disabled) }}
      style={[styles.cell, { width }]}
    >
      <Animated.View
        style={[
          styles.tileContainer,
          {
            backgroundColor: item.disabled ? colors.surfaceMuted : item.bg,
            opacity: item.disabled ? 0.4 : 1,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {renderIcon(item.iconName, item.disabled ? colors.textDisabled : item.iconColor)}

        {/* Dynamic Notification Badge (§1) */}
        <NotificationBadge count={item.badgeCount} style={styles.badge} />
      </Animated.View>

      <Text
        style={[
          styles.cellLabel,
          item.disabled && styles.cellLabelDisabled,
        ]}
        numberOfLines={2}
        ellipsizeMode="tail"
        maxFontSizeMultiplier={1.3}
      >
        {item.label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 16,
    columnGap: 8,
    justifyContent: 'flex-start',
  },
  cell: {
    minHeight: 98,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  tileContainer: {
    width: 58,
    height: 58,
    borderRadius: radius.lg, // 18
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    height: 16,
    minWidth: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontFamily: typography.micro.fontFamily,
    fontSize: 10,
    lineHeight: 12,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  cellLabel: {
    fontFamily: typography.labelSm.fontFamily,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.1,
    color: colors.textPrimary, // #0F172A
    textAlign: 'center',
    marginTop: 8,
    minHeight: 32, // 2 lines
    fontWeight: '600',
  },
  cellLabelDisabled: {
    color: colors.textDisabled, // #94A3B8
  },
});

export default QuickActionGrid;
