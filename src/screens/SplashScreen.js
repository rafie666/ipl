import React, { useEffect } from 'react'
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native'
import { Building2 } from 'lucide-react-native'
import { useApp } from '../context/AppContext'
import { colors, shadows } from '../utils/theme'

export default function SplashScreen({ navigation }) {
  const { loading, currentUser } = useApp()

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        if (currentUser) {
          navigation.replace('Main')
        } else {
          navigation.replace('Login')
        }
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [loading, currentUser])

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Building2 size={46} color={colors.white} strokeWidth={2.4} />
      </View>
      <Text style={styles.title}>IPL Warga</Text>
      <Text style={styles.tagline}>Sistem Iuran & Layanan Warga RT/RW</Text>
      <Text style={styles.subtext}>Perumahan Alam Tirta Lestari Ciomas</Text>

      <View style={styles.loadingWrapper}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={styles.loadingText}>Menyiapkan aplikasi...</Text>
      </View>

      <Text style={styles.version}>v2.0 Native Android Red & White Edition</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24
  },
  logoContainer: {
    width: 88,
    height: 88,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    ...shadows.redGlow
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.textMain,
    letterSpacing: -0.5
  },
  tagline: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 4
  },
  subtext: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2
  },
  loadingWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 48
  },
  loadingText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600'
  },
  version: {
    position: 'absolute',
    bottom: 30,
    fontSize: 11,
    color: colors.textMuted
  }
})
