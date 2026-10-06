import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { User } from 'lucide-react-native'
import { colors, shadows } from '../utils/theme'

export default function CustomTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets()

  return (
    <View style={styles.wrapper}>
      <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key]
          const isFocused = state.index === index

          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
              ? options.title
              : route.name

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true
            })

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name)
            }
          }

          // Center tab: index 2 (Floating Profile Button)
          const isCenter = index === 2

          if (isCenter) {
            return (
              <View key={route.key} style={styles.centerTabContainer}>
                <TouchableOpacity
                  onPress={onPress}
                  activeOpacity={0.88}
                  style={[
                    styles.floatingProfileBtn,
                    isFocused && styles.floatingProfileBtnActive
                  ]}
                >
                  <View style={styles.floatingInnerCircle}>
                    <User size={24} color={isFocused ? colors.primary : colors.primaryDark} strokeWidth={2.4} />
                  </View>
                </TouchableOpacity>
                <Text
                  style={[
                    styles.tabLabel,
                    styles.centerLabel,
                    isFocused ? styles.tabLabelActive : styles.tabLabelInactive
                  ]}
                  numberOfLines={1}
                >
                  {label}
                </Text>
              </View>
            )
          }

          const iconColor = isFocused ? colors.white : 'rgba(255, 255, 255, 0.72)'

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              activeOpacity={0.7}
              style={[styles.tabItem, isFocused && styles.tabItemActive]}
            >
              <View style={styles.iconWrap}>
                {options.tabBarIcon ? (
                  options.tabBarIcon({
                    focused: isFocused,
                    color: iconColor,
                    size: 20
                  })
                ) : null}
              </View>
              <Text
                style={[
                  styles.tabLabel,
                  isFocused ? styles.tabLabelActive : styles.tabLabelInactive
                ]}
                numberOfLines={1}
              >
                {label}
              </Text>
              {isFocused && <View style={styles.activeDot} />}
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: 'transparent',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
    paddingBottom: 6,
    paddingHorizontal: 8,
    ...shadows.floating
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4
  },
  tabItemActive: {},
  iconWrap: {
    marginBottom: 2
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center'
  },
  tabLabelActive: {
    color: colors.white,
    fontWeight: '800'
  },
  tabLabelInactive: {
    color: 'rgba(255, 255, 255, 0.72)'
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.white,
    marginTop: 2
  },
  centerTabContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  floatingProfileBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.white,
    marginTop: -26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.primaryDark,
    ...shadows.floating
  },
  floatingProfileBtnActive: {
    borderColor: colors.white,
    transform: [{ scale: 1.05 }]
  },
  floatingInnerCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF1F2',
    alignItems: 'center',
    justifyContent: 'center'
  },
  centerLabel: {
    marginTop: 2
  }
})
