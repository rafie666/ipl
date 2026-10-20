import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  Animated,
  Keyboard,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Home,
  LayoutDashboard,
  Receipt,
  Wallet,
  Users,
  User,
  ShieldCheck,
  Grid,
  Layers,
  Settings,
  Zap,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { colors, radius, typography, layout, shadows } from '../theme';
import { useApp } from '../context/AppContext';
import { NotificationBadge } from '../components/ui/NotificationBadge';

export interface FloatingBottomBarProps {
  state?: any;
  descriptors?: any;
  navigation?: any;
}

export const FloatingBottomBar: React.FC<FloatingBottomBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // App Context for role-specific styling & badges
  const {
    isWarga,
    isRT,
    isRW,
    isBendahara,
    isPengurus,
    isAdmin,
    scopedTagihan = [],
    warga = [],
    totalLayananUnreadCount = 0,
  } = useApp();

  const translateYAnim = useRef(new Animated.Value(0)).current;
  const centerScaleAnim = useRef(new Animated.Value(1)).current;

  // Keyboard show/hide listener
  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
        Animated.timing(translateYAnim, {
          toValue: 120,
          duration: 220,
          useNativeDriver: true,
        }).start();
      }
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
        Animated.spring(translateYAnim, {
          toValue: 0,
          damping: 22,
          stiffness: 220,
          mass: 1,
          useNativeDriver: true,
        }).start();
      }
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const barWidth = Math.min(screenWidth, layout.maxContentWidth) - layout.navMarginH * 2;
  const slotWidth = (barWidth - 16) / 5;
  const bottomOffset = Math.max(insets.bottom, 12) + 8;

  // Calculate Badges based on role
  const unpaidCount = isWarga
    ? (scopedTagihan || []).filter((t: any) => t.status !== 'Lunas').length
    : 0;

  const pendingVerificationCount = isBendahara
    ? (scopedTagihan || []).filter((t: any) => t.status === 'Menunggu Verifikasi').length
    : 0;

  const pendingWargaCount = isRT || isRW
    ? (warga || []).filter((w: any) => w.statusApproval === 'Menunggu Verifikasi').length
    : 0;

  // Center button animation
  const handleCenterPressIn = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    } catch {}
    Animated.timing(centerScaleAnim, {
      toValue: 0.92,
      duration: 90,
      useNativeDriver: true,
    }).start();
  };

  const handleCenterPressOut = () => {
    Animated.spring(centerScaleAnim, {
      toValue: 1,
      damping: 15,
      stiffness: 150,
      mass: 1,
      useNativeDriver: true,
    }).start();
  };

  // PUSAT TAB: SELALU KE PROFILE TAB (Index 2)
  const handleCenterPress = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    } catch {}

    if (navigation && state) {
      const profileRoute = state.routes[2];
      if (profileRoute) {
        const isFocused = state.index === 2;
        const event = navigation.emit({
          type: 'tabPress',
          target: profileRoute.key,
          canPreventDefault: true,
        });

        if (!isFocused && !event.defaultPrevented) {
          navigation.navigate(profileRoute.name);
        }
      }
    }
  };

  // Standard tab press for other 4 slots
  const handleTabPress = (routeIndex: number) => {
    try {
      Haptics.selectionAsync().catch(() => {});
    } catch {}

    if (navigation && state) {
      const route = state.routes[routeIndex];
      if (route) {
        const isFocused = state.index === routeIndex;
        const event = navigation.emit({
          type: 'tabPress',
          target: route.key,
          canPreventDefault: true,
        });

        if (!isFocused && !event.defaultPrevented) {
          navigation.navigate(route.name);
        }
      }
    }
  };

  if (!state || !state.routes) return null;

  const activeIndex = state.index;

  return (
    <Animated.View
      pointerEvents={keyboardVisible ? 'none' : 'auto'}
      style={[
        styles.wrapper,
        {
          bottom: bottomOffset,
          left: (screenWidth - barWidth) / 2,
          width: barWidth,
          transform: [{ translateY: translateYAnim }],
        },
      ]}
    >
      <View style={[styles.barContainer, { width: barWidth }]}>
        {state.routes.map((route: any, i: number) => {
          const isFocused = activeIndex === i;
          const { options } = descriptors?.[route.key] || {};

          // ========================================================
          // SLOT 2: RAISED CENTER BUTTON (PROFILE TAB)
          // ========================================================
          if (i === 2) {
            const ProfileIconComponent = isWarga ? User : ShieldCheck;
            return (
              <View key={route.key || 'center-profile'} style={[styles.slot, { width: slotWidth }]}>
                <Animated.View
                  style={[
                    styles.centerButtonWrapper,
                    { transform: [{ scale: centerScaleAnim }] },
                  ]}
                >
                  <Pressable
                    onPress={handleCenterPress}
                    onPressIn={handleCenterPressIn}
                    onPressOut={handleCenterPressOut}
                    accessibilityRole="tab"
                    accessibilityLabel="Profil Saya"
                    accessibilityState={{ selected: isFocused }}
                    style={[
                      styles.centerButton,
                      isFocused ? styles.centerButtonActive : styles.centerButtonInactive,
                    ]}
                  >
                    <ProfileIconComponent
                      size={24}
                      color="#FFFFFF"
                      strokeWidth={2.4}
                    />
                  </Pressable>
                </Animated.View>

                {/* Sub-label for center profile */}
                <Text
                  numberOfLines={1}
                  maxFontSizeMultiplier={1.15}
                  style={[
                    styles.tabLabel,
                    styles.centerLabel,
                    isFocused ? styles.tabLabelActive : styles.tabLabelInactive,
                  ]}
                >
                  Profil
                </Text>

                {isFocused && <View style={styles.activeDot} />}
              </View>
            );
          }

          // ========================================================
          // SLOTS 0, 1, 3, 4: ROLE-ADAPTIVE TABS
          // ========================================================
          let label = options?.tabBarLabel || route.name;
          let IconComponent = Home;
          let badgeCount = 0;

          if (i === 0) {
            // Tab 1: Dashboard
            IconComponent = isWarga ? Home : LayoutDashboard;
          } else if (i === 1) {
            // Tab 2: Tagihan (Warga) / Kas (Bendahara) / Data Warga (Lainnya)
            // §1: Jangan menampilkan badge pada Data Warga atau Buku Kas
            IconComponent = isWarga ? Receipt : isBendahara ? Wallet : Users;
            badgeCount = isWarga ? unpaidCount : 0;
          } else if (i === 3) {
            // Tab 4: Layanan (Warga/Pengurus) / Verifikasi (Bendahara) / Kas (RT/RW/Admin)
            // §1: Layanan shows totalLayananUnreadCount; Kas gets 0 badge
            IconComponent = (isWarga || isPengurus) ? (isWarga ? Layers : Grid) : isBendahara ? Receipt : Wallet;
            badgeCount = isWarga || isPengurus
              ? totalLayananUnreadCount
              : isBendahara
              ? pendingVerificationCount
              : 0;
          } else if (i === 4) {
            // Tab 5: Aksi Cepat (Sebelumnya Pengaturan)
            IconComponent = Zap;
            label = 'Aksi Cepat';
          }

          return (
            <Pressable
              key={route.key || `tab-${i}`}
              onPress={() => handleTabPress(i)}
              accessibilityRole="tab"
              accessibilityLabel={String(label)}
              accessibilityState={{ selected: isFocused }}
              style={[styles.slot, { width: slotWidth }]}
            >
              <View style={[styles.iconWrapper, isFocused && styles.iconWrapperActive]}>
                {options?.tabBarIcon ? (
                  options.tabBarIcon({
                    color: isFocused ? colors.primary : colors.textMuted,
                    size: 22,
                    focused: isFocused,
                  })
                ) : (
                  <IconComponent
                    size={22}
                    color={isFocused ? colors.primary : colors.textMuted}
                    strokeWidth={isFocused ? 2.5 : 2}
                  />
                )}

                <NotificationBadge count={badgeCount} style={styles.badge} />
              </View>

              <Text
                numberOfLines={1}
                maxFontSizeMultiplier={1.15}
                style={[
                  styles.tabLabel,
                  isFocused ? styles.tabLabelActive : styles.tabLabelInactive,
                ]}
              >
                {label}
              </Text>

              {isFocused && <View style={styles.activeDot} />}
            </Pressable>
          );
        })}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    zIndex: 100,
    elevation: 8,
    alignItems: 'center',
  },
  barContainer: {
    height: layout.navHeight, // 68
    borderRadius: radius.full, // 9999
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.85)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    ...Platform.select({
      web: {
        boxShadow:
          '0px 2px 6px rgba(15, 23, 42, 0.06), 0px 12px 28px rgba(15, 23, 42, 0.10)',
      } as any,
      default: {
        shadowColor: colors.textPrimary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.10,
        shadowRadius: 24,
        elevation: 8,
      },
    }),
  },
  slot: {
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  iconWrapper: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    position: 'relative',
  },
  iconWrapperActive: {
    backgroundColor: colors.primaryGhost,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -6,
    height: 16,
    minWidth: 16,
    borderRadius: 8,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    fontFamily: typography.micro.fontFamily,
    fontSize: 10,
    lineHeight: 12,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  tabLabel: {
    fontFamily: typography.tabLabel.fontFamily,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.1,
    marginTop: 2,
    textAlign: 'center',
  },
  centerLabel: {
    marginTop: 26, // Extra spacing below raised center button to align baseline with side tabs
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  tabLabelInactive: {
    color: colors.textMuted,
    fontWeight: '600',
  },
  activeDot: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  centerButtonWrapper: {
    position: 'absolute',
    top: -16, // Raised above the bar
    alignSelf: 'center',
  },
  centerButton: {
    width: layout.navCenterSize, // 52
    height: layout.navCenterSize, // 52
    borderRadius: layout.navCenterSize / 2, // 26
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerButtonInactive: {
    backgroundColor: colors.primary,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    ...Platform.select({
      web: {
        boxShadow:
          '0px 2px 4px rgba(5, 150, 105, 0.25), 0px 6px 18px rgba(5, 150, 105, 0.35)',
      } as any,
      default: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 6,
      },
    }),
  },
  centerButtonActive: {
    backgroundColor: colors.primaryDeep,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    ...Platform.select({
      web: {
        boxShadow:
          '0px 2px 4px rgba(6, 78, 59, 0.35), 0px 8px 20px rgba(6, 78, 59, 0.50)',
      } as any,
      default: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.45,
        shadowRadius: 18,
        elevation: 8,
      },
    }),
  },
});

export default FloatingBottomBar;
