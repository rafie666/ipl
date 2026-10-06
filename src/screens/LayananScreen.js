import React from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import {
  MessageSquareText,
  FileText,
  PhoneCall,
  Trophy,
  MapPin,
  ChevronRight,
  Wallet,
  Settings,
  Users,
  Key
} from 'lucide-react-native'
import { useApp } from '../context/AppContext'
import TopAppBar from '../components/TopAppBar'
import AppCard from '../components/AppCard'
import { colors, typography, spacing, radius, shadows } from '../utils/theme'

export default function LayananScreen({ navigation }) {
  const { isWarga, isRT, isAdmin } = useApp()

  const wargaMenus = [
    {
      id: 'pengaduan',
      title: 'Lapor Aduan Warga',
      desc: 'Sampaikan kendala fasilitas, lampu mati, atau ketertiban.',
      icon: MessageSquareText,
      color: colors.info,
      route: 'Pengaduan'
    },
    {
      id: 'surat',
      title: 'Surat Pengantar RT/RW',
      desc: 'Ajukan surat pengantar domisili, SKCK, izin usaha.',
      icon: FileText,
      color: colors.success,
      route: 'Surat'
    },
    {
      id: 'darurat',
      title: 'Kontak Cepat Darurat',
      desc: 'Nomor telepon satpam posko, medis, polsek & pemadam.',
      icon: PhoneCall,
      color: colors.primary,
      route: 'KontakDarurat'
    },
    {
      id: 'events',
      title: 'Agenda & Acara Warga',
      desc: 'Informasi kegiatan 17 Agustus, kerja bakti, dan lomba.',
      icon: Trophy,
      color: colors.warning,
      route: 'Events'
    }
  ]

  const pengurusMenus = [
    {
      id: 'kas',
      title: 'Buku Kas & Keuangan',
      desc: 'Pencatatan mutasi kas masuk, keluar, dan saldo kas RT/RW.',
      icon: Wallet,
      color: colors.success,
      route: 'Kas',
      category: 'Keuangan'
    },
    {
      id: 'surat',
      title: 'Verifikasi Surat Pengantar',
      desc: 'Daftar permohonan surat pengantar warga yang perlu diproses.',
      icon: FileText,
      color: colors.primary,
      route: 'Surat',
      category: 'Administrasi'
    },
    {
      id: 'pengaduan',
      title: 'Laporan Aduan Warga',
      desc: 'Tindak lanjut laporan keluhan dan fasilitas dari warga.',
      icon: MessageSquareText,
      color: colors.info,
      route: 'Pengaduan',
      category: 'Administrasi'
    },
    {
      id: 'events',
      title: 'Agenda & Acara Lingkungan',
      desc: 'Kelola kegiatan warga, kerja bakti, dan iuran insidental.',
      icon: Trophy,
      color: colors.warning,
      route: 'Events',
      category: 'Kegiatan'
    },
    {
      id: 'peta',
      title: 'Peta Pemetaan GIS & Rumah',
      desc: 'Pemetaan digital dan status pembayaran tiap unit rumah.',
      icon: MapPin,
      color: '#8B5CF6',
      route: 'PetaWarga',
      category: 'Ringkasan'
    },
    {
      id: 'kontak',
      title: 'Kontak Cepat Darurat',
      desc: 'Daftar nomor darurat lingkungan dan posko keamanan.',
      icon: PhoneCall,
      color: colors.danger,
      route: 'KontakDarurat',
      category: 'Layanan'
    },
    {
      id: 'warga',
      title: 'Data Warga & Blok',
      desc: 'Master database kependudukan, KK, dan data warga.',
      icon: Users,
      color: colors.info,
      route: 'WargaList',
      category: 'Master Data & Akses'
    },
    {
      id: 'akses',
      title: 'Data Akses Admin & RT',
      desc: 'Kelola akun login Super Admin, Ketua RT, dan warga.',
      icon: Key,
      color: colors.success,
      route: 'DataAkses',
      category: 'Master Data & Akses'
    },
    {
      id: 'pengaturan',
      title: 'Pengaturan Sistem & Pos Iuran',
      desc: 'Master tarif iuran, rekening RT/RW, dan Supabase.',
      icon: Settings,
      color: colors.primary,
      route: 'Pengaturan',
      category: 'Sistem & Konfigurasi'
    }
  ]

  const activeMenus = isWarga ? wargaMenus : pengurusMenus

  return (
    <View style={styles.container}>
      <TopAppBar title="Layanan & Menu" navigation={navigation} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerBox}>
          <Text style={styles.headerTitle}>Pusat Layanan Warga</Text>
          <Text style={styles.headerSubtitle}>
            Akses cepat administrasi, surat pengantar, aduan, dan fasilitas lingkungan.
          </Text>
        </View>

        {activeMenus.map((item) => {
          const IconComponent = item.icon
          return (
            <AppCard
              key={item.id}
              style={styles.menuCard}
              onPress={() => navigation.navigate(item.route)}
            >
              <View style={[styles.iconWrap, { backgroundColor: item.color + '15' }]}>
                <IconComponent size={22} color={item.color} />
              </View>

              <View style={styles.textWrap}>
                <Text style={styles.menuTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.menuDesc} numberOfLines={2}>{item.desc}</Text>
              </View>

              <ChevronRight size={18} color={colors.textSecondary} />
            </AppCard>
          )
        })}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 110
  },
  headerBox: {
    marginBottom: spacing.md
  },
  headerTitle: {
    ...typography.h2
  },
  headerSubtitle: {
    ...typography.bodySecondary,
    marginTop: 2
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    padding: spacing.md
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm
  },
  textWrap: {
    flex: 1,
    minWidth: 0,
    marginRight: spacing.xs
  },
  menuTitle: {
    ...typography.cardTitle,
    marginBottom: 2
  },
  menuDesc: {
    ...typography.caption,
    lineHeight: 16
  }
})
