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
  Key,
  ShieldCheck
} from 'lucide-react-native'
import { useApp } from '../context/AppContext'
import TopAppBar from '../components/TopAppBar'
import AppCard from '../components/AppCard'
import { NotificationBadge } from '../components/ui/NotificationBadge'
import { colors, typography, spacing, radius, shadows } from '../utils/theme'

export default function LayananScreen({ navigation }) {
  const {
    isWarga,
    isRT,
    isRW,
    isBendahara,
    isPengurus,
    isAdmin,
    suratUnreadCount = 0,
    aduanUnreadCount = 0
  } = useApp()

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
      id: 'satpam',
      title: 'Jadwal Satpam & Keamanan',
      desc: 'Jadwal shift jaga posko, petugas siaga & patroli malam.',
      icon: ShieldCheck,
      color: '#334155',
      route: 'JadwalSatpam'
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
      id: 'kas',
      title: 'Transparansi Kas RT & RW',
      desc: 'Laporan pengeluaran, pemasukan, dan rincian belanja kas terbuka lingkungan.',
      icon: Wallet,
      color: colors.success,
      route: 'Kas'
    },
    {
      id: 'events',
      title: 'Iuran Kegiatan & Acara',
      desc: 'Informasi dan pembayaran iuran kegiatan 17 Agustus, kerja bakti & lomba.',
      icon: Trophy,
      color: colors.warning,
      route: 'Events'
    }
  ]

  const allStaffMenus = [
    {
      id: 'satpam',
      title: 'Jadwal Satpam & Keamanan',
      desc: 'Atur shift jaga, penugasan pos keamanan & nomor siaga.',
      icon: ShieldCheck,
      color: '#334155',
      route: 'JadwalSatpam',
      category: 'Keamanan',
      allowedRoles: ['admin', 'rw', 'rt', 'pengurus']
    },
    {
      id: 'kas',
      title: 'Buku Kas & Keuangan',
      desc: 'Pencatatan mutasi kas masuk, keluar, dan saldo kas RT/RW.',
      icon: Wallet,
      color: colors.success,
      route: 'Kas',
      category: 'Keuangan',
      allowedRoles: ['admin', 'rw', 'rt', 'bendahara']
    },
    {
      id: 'tagihan',
      title: 'Tagihan & Verifikasi IPL',
      desc: 'Kelola invoice bulanan warga, verifikasi bukti bayar & konfirmasi lunas.',
      icon: FileText,
      color: '#2563EB',
      route: 'Tagihan',
      category: 'Keuangan',
      allowedRoles: ['admin', 'bendahara', 'rw', 'rt']
    },
    {
      id: 'rekening',
      title: 'Rekening Bank & QRIS',
      desc: 'Kelola akun bank penerima dan barcode QRIS resmi lingkungan.',
      icon: Wallet,
      color: '#059669',
      route: 'RekeningBank',
      category: 'Keuangan',
      allowedRoles: ['admin', 'bendahara']
    },
    {
      id: 'surat',
      title: 'Verifikasi Surat Pengantar',
      desc: 'Daftar permohonan surat pengantar warga yang perlu diproses.',
      icon: FileText,
      color: colors.primary,
      route: 'Surat',
      category: 'Administrasi',
      allowedRoles: ['admin', 'rw', 'rt', 'pengurus']
    },
    {
      id: 'pengaduan',
      title: 'Laporan Aduan Warga',
      desc: 'Tindak lanjut laporan keluhan dan fasilitas dari warga.',
      icon: MessageSquareText,
      color: colors.info,
      route: 'Pengaduan',
      category: 'Administrasi',
      allowedRoles: ['admin', 'rw', 'rt', 'pengurus']
    },
    {
      id: 'events',
      title: 'Kelola Iuran Kegiatan',
      desc: 'Kelola iuran kegiatan warga, 17 Agustus, kerja bakti, dan tagihan per KK.',
      icon: Trophy,
      color: colors.warning,
      route: 'Events',
      category: 'Iuran',
      allowedRoles: ['admin', 'rw', 'rt', 'bendahara', 'pengurus']
    },
    {
      id: 'peta',
      title: 'Denah & Peta Warga (GIS)',
      desc: 'Pemetaan digital dan status pembayaran tiap unit rumah.',
      icon: MapPin,
      color: '#0284C7',
      route: 'PetaWarga',
      category: 'Ringkasan',
      allowedRoles: ['admin', 'bendahara']
    },
    {
      id: 'kontak',
      title: 'Kontak Cepat Darurat',
      desc: 'Daftar nomor darurat lingkungan dan posko keamanan.',
      icon: PhoneCall,
      color: colors.danger,
      route: 'KontakDarurat',
      category: 'Layanan',
      allowedRoles: ['admin', 'rw', 'rt', 'bendahara', 'pengurus']
    },
    {
      id: 'warga',
      title: 'Data Warga & Blok',
      desc: 'Master database kependudukan, KK, dan data warga.',
      icon: Users,
      color: colors.info,
      route: 'WargaList',
      category: 'Master Data & Akses',
      allowedRoles: ['admin', 'rw', 'rt', 'pengurus', 'bendahara']
    },
    {
      id: 'lingkungan',
      title: 'Identitas Wilayah RT & RW',
      desc: 'Struktur kepengurusan, batas teritorial lingkungan & data kontak resmi.',
      icon: Users,
      color: '#0D9488',
      route: 'IdentitasLingkungan',
      category: 'Master Data & Akses',
      allowedRoles: ['admin', 'rw', 'rt']
    },
    {
      id: 'akses',
      title: 'Data Akses & Akun Login',
      desc: 'Kelola akun login Super Admin, Ketua RW/RT, Bendahara & Pengurus.',
      icon: Key,
      color: colors.success,
      route: 'DataAkses',
      category: 'Master Data & Akses',
      allowedRoles: ['admin']
    },
    {
      id: 'pos_iuran',
      title: 'Pos Tarif & Otomasi Iuran',
      desc: 'Master pos iuran, auto-billing tanggal 5, dan nominal tagihan warga.',
      icon: Settings,
      color: '#9333EA',
      route: 'PosIuran',
      category: 'Sistem & Konfigurasi',
      allowedRoles: ['admin', 'bendahara']
    },
    {
      id: 'moota',
      title: 'Moota Gateway & Cloud Database',
      desc: 'Konfigurasi webhook, mutasi rekening otomatis & Supabase sync.',
      icon: Key,
      color: '#0891B2',
      route: 'MootaGateway',
      category: 'Sistem & Konfigurasi',
      allowedRoles: ['admin']
    },
    {
      id: 'notifikasi',
      title: 'Notifikasi & Pengingat Perangkat',
      desc: 'Konfigurasi push token, broadcast pesan & pengingat jatuh tempo.',
      icon: MessageSquareText,
      color: '#16A34A',
      route: 'NotifikasiPerangkat',
      category: 'Sistem & Konfigurasi',
      allowedRoles: ['admin']
    },
    {
      id: 'pengaturan',
      title: 'Pengaturan Sistem & Pos Iuran',
      desc: 'Master tarif iuran, rekening RT/RW, dan Supabase.',
      icon: Settings,
      color: colors.primary,
      route: 'Pengaturan',
      category: 'Sistem & Konfigurasi',
      allowedRoles: ['admin', 'rw', 'rt', 'bendahara', 'pengurus']
    }
  ]

  const currentRoleTag = isBendahara
    ? 'bendahara'
    : isPengurus
    ? 'pengurus'
    : isRT
    ? 'rt'
    : isRW
    ? 'rw'
    : 'admin'

  const activeMenus = isWarga
    ? wargaMenus
    : allStaffMenus.filter((m) => !m.allowedRoles || m.allowedRoles.includes(currentRoleTag))

  return (
    <View style={styles.container}>
      <TopAppBar title="Layanan & Menu" navigation={navigation} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerBox}>
          <Text style={styles.headerTitle}>
            {isWarga ? 'Pusat Layanan Warga' : 'Pusat Administrasi & Layanan'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {isWarga
              ? 'Akses cepat administrasi, surat pengantar, aduan, dan fasilitas lingkungan.'
              : 'Kelola operasional warga, permohonan surat, pengaduan, dan data lingkungan.'}
          </Text>
        </View>

        {activeMenus.map((item, index) => {
          const IconComponent = item.icon
          const showCategory = !isWarga && (index === 0 || activeMenus[index - 1].category !== item.category)
          const badgeCount = item.id === 'surat' ? suratUnreadCount : (item.id === 'pengaduan' ? aduanUnreadCount : 0)

          return (
            <React.Fragment key={item.id}>
              {showCategory && (
                <View style={styles.categoryHeader}>
                  <Text style={styles.categoryHeaderText}>{item.category}</Text>
                </View>
              )}
              <AppCard
                style={styles.menuCard}
                onPress={() => navigation.navigate(item.route)}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`${item.title}, ${item.desc}${badgeCount > 0 ? `, ${badgeCount} belum dibaca` : ''}`}
              >
                <View style={[styles.iconWrap, { backgroundColor: item.color + '18' }]}>
                  <IconComponent size={22} color={item.color} />
                  {badgeCount > 0 && (
                    <NotificationBadge count={badgeCount} style={styles.iconCornerBadge} />
                  )}
                </View>

                <View style={styles.textWrap}>
                  <Text style={styles.menuTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.menuDesc} numberOfLines={2}>{item.desc}</Text>
                </View>

                {badgeCount > 0 && (
                  <View style={styles.unreadPill}>
                    <Text style={styles.unreadPillText}>
                      {badgeCount > 99 ? '99+' : badgeCount} Baru
                    </Text>
                  </View>
                )}

                <ChevronRight size={18} color={colors.textSecondary} />
              </AppCard>
            </React.Fragment>
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
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: 170
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
  categoryHeader: {
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    paddingHorizontal: 2
  },
  categoryHeaderText: {
    ...typography.labelSm,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6
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
    marginRight: spacing.sm,
    position: 'relative'
  },
  iconCornerBadge: {
    position: 'absolute',
    top: -4,
    right: -4
  },
  textWrap: {
    flex: 1,
    minWidth: 0,
    marginRight: spacing.xs
  },
  unreadPill: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.full,
    marginRight: 6
  },
  unreadPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#DC2626'
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
