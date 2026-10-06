import React from 'react'
import { ScrollView, TouchableOpacity, Text, StyleSheet, View } from 'react-native'
import { colors, spacing, radius, shadows } from '../utils/theme'

export default function AppTabs({
  tabs = [], // [{ id, label, icon: Icon, badgeCount }]
  activeTab,
  onTabChange,
  variant = 'chips', // 'chips' | 'underline'
  scrollable = true,
  style
}) {
  const renderTab = (tab) => {
    const isActive = activeTab === tab.id
    const Icon = tab.icon

    if (variant === 'underline') {
      return (
        <TouchableOpacity
          key={tab.id}
          style={[styles.tabUnderline, isActive && styles.tabUnderlineActive]}
          onPress={() => onTabChange(tab.id)}
          activeOpacity={0.75}
        >
          {Icon ? (
            <Icon
              size={16}
              color={isActive ? colors.primary : colors.textSecondary}
              style={{ marginRight: 6 }}
            />
          ) : null}
          <Text
            style={[
              styles.tabUnderlineText,
              isActive && styles.tabUnderlineTextActive
            ]}
          >
            {tab.label}
          </Text>
          {tab.badgeCount ? (
            <View
              style={[
                styles.badge,
                isActive ? styles.badgeActive : styles.badgeInactive
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  isActive ? styles.badgeTextActive : styles.badgeTextInactive
                ]}
              >
                {tab.badgeCount}
              </Text>
            </View>
          ) : null}
          {isActive ? <View style={styles.activeLine} /> : null}
        </TouchableOpacity>
      )
    }

    // Default Chips
    return (
      <TouchableOpacity
        key={tab.id}
        style={[
          styles.chip,
          isActive ? styles.chipActive : styles.chipInactive
        ]}
        onPress={() => onTabChange(tab.id)}
        activeOpacity={0.75}
      >
        {Icon ? (
          <Icon
            size={14}
            color={isActive ? colors.white : colors.textSecondary}
            style={{ marginRight: 6 }}
          />
        ) : null}
        <Text
          style={[
            styles.chipText,
            isActive ? styles.chipTextActive : styles.chipTextInactive
          ]}
        >
          {tab.label}
        </Text>
        {tab.badgeCount ? (
          <View
            style={[
              styles.chipBadge,
              isActive ? styles.chipBadgeActive : styles.chipBadgeInactive
            ]}
          >
            <Text
              style={[
                styles.chipBadgeText,
                isActive ? styles.chipBadgeTextActive : styles.chipBadgeTextInactive
              ]}
            >
              {tab.badgeCount}
            </Text>
          </View>
        ) : null}
      </TouchableOpacity>
    )
  }

  if (!scrollable) {
    return (
      <View style={[styles.fixedContainer, style]}>
        {tabs.map(renderTab)}
      </View>
    )
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.scrollContainer, style]}
    >
      {tabs.map(renderTab)}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    gap: spacing.sm
  },
  fixedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.md,
    gap: spacing.xs
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    ...shadows.soft
  },
  chipInactive: {
    backgroundColor: colors.surface,
    borderColor: colors.border
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600'
  },
  chipTextActive: {
    color: colors.white,
    fontWeight: '700'
  },
  chipTextInactive: {
    color: colors.textSecondary
  },
  chipBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.full,
    marginLeft: 6
  },
  chipBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)'
  },
  chipBadgeInactive: {
    backgroundColor: colors.border
  },
  chipBadgeText: {
    fontSize: 10,
    fontWeight: '800'
  },
  chipBadgeTextActive: {
    color: colors.white
  },
  chipBadgeTextInactive: {
    color: colors.textSecondary
  },
  tabUnderline: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    position: 'relative'
  },
  tabUnderlineActive: {},
  tabUnderlineText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary
  },
  tabUnderlineTextActive: {
    color: colors.primary,
    fontWeight: '700'
  },
  activeLine: {
    position: 'absolute',
    bottom: 0,
    left: 8,
    right: 8,
    height: 2.5,
    backgroundColor: colors.primary,
    borderRadius: 2
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.full,
    marginLeft: 4
  },
  badgeActive: {
    backgroundColor: colors.primaryLight
  },
  badgeInactive: {
    backgroundColor: colors.borderLight
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700'
  },
  badgeTextActive: {
    color: colors.primary
  },
  badgeTextInactive: {
    color: colors.textSecondary
  }
})
