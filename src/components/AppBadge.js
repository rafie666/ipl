import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { CheckCircle2, Clock, AlertTriangle, XCircle, ShieldCheck, Tag } from 'lucide-react-native'
import { colors, spacing, radius } from '../utils/theme'

export default function AppBadge({
  status = 'default',
  label,
  size = 'md', // 'sm' | 'md'
  icon: CustomIcon,
  style
}) {
  const getBadgeConfig = () => {
    const s = String(status || '').toLowerCase().trim()

    // 1. Belum Bayar / Belum Lunas / Ditolak / Nonaktif (Harus dicek SEBELUM 'lunas')
    if (s.includes('belum') || s.includes('tolak') || s.includes('tunggakan') || s === 'nonaktif' || s === 'unpaid') {
      return {
        bg: colors.dangerBg,
        text: colors.danger,
        border: '#FECDCA',
        Icon: XCircle,
        defaultLabel: 'BELUM BAYAR'
      }
    }

    // 2. Menunggu Verifikasi / Pending
    if (s.includes('verifikasi') || s.includes('pending') || s.includes('menunggu') || s.includes('proses')) {
      return {
        bg: colors.warningBg,
        text: colors.warning,
        border: '#FEDF89',
        Icon: Clock,
        defaultLabel: 'MENUNGGU VERIFIKASI'
      }
    }

    // 3. Perlu Diperbaiki
    if (s.includes('perbaiki') || s === 'perlu diperbaiki') {
      return {
        bg: colors.dangerBg,
        text: colors.danger,
        border: '#FECDCA',
        Icon: AlertTriangle,
        defaultLabel: 'PERLU DIPERBAIKI'
      }
    }

    // 4. Lunas / Aktif / Sukses / Diterima
    if ((s.includes('lunas') && !s.includes('belum')) || s === 'aktif' || s === 'sukses' || s === 'diterima' || s === 'paid') {
      return {
        bg: colors.successBg,
        text: colors.success,
        border: '#A6F4C5',
        Icon: CheckCircle2,
        defaultLabel: 'LUNAS'
      }
    }
    if (s === 'rw') {
      return {
        bg: '#F4EBFF',
        text: '#7F56D9',
        border: '#D6BBFB',
        Icon: ShieldCheck,
        defaultLabel: 'RW 15'
      }
    }
    if (s === 'rt') {
      return {
        bg: '#EFF8FF',
        text: '#175CD3',
        border: '#B2DDFF',
        Icon: ShieldCheck,
        defaultLabel: 'RT 01'
      }
    }
    return {
      bg: colors.background,
      text: colors.textSecondary,
      border: colors.border,
      Icon: Tag,
      defaultLabel: label || 'STATUS'
    }
  }

  const config = getBadgeConfig()
  const displayLabel = label || config.defaultLabel
  const IconComponent = CustomIcon || config.Icon
  const isSm = size === 'sm'

  return (
    <View
      style={[
        styles.container,
        isSm ? styles.containerSm : styles.containerMd,
        { backgroundColor: config.bg, borderColor: config.border },
        style
      ]}
    >
      {IconComponent ? (
        <IconComponent
          size={isSm ? 10 : 13}
          color={config.text}
          style={{ marginRight: isSm ? 3 : 5 }}
        />
      ) : null}
      <Text
        style={[
          styles.text,
          isSm ? styles.textSm : styles.textMd,
          { color: config.text }
        ]}
        numberOfLines={1}
      >
        {displayLabel}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: radius.full,
    borderWidth: 1
  },
  containerSm: {
    paddingHorizontal: 6,
    paddingVertical: 2
  },
  containerMd: {
    paddingHorizontal: 8,
    paddingVertical: 3.5
  },
  text: {
    fontWeight: '700',
    letterSpacing: 0.2
  },
  textSm: {
    fontSize: 10
  },
  textMd: {
    fontSize: 11
  }
})
