import React, { useRef, useEffect } from 'react'
import { Platform } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import {
  handleNotificationClick,
  setupAndroidNotificationChannels,
  ENABLE_PUSH_NOTIFICATIONS,
  isExpoGo
} from '../services/notificationService'
import {
  LayoutDashboard,
  Home,
  Receipt,
  Users,
  Grid,
  User,
  Settings,
  Layers,
  Wallet,
  ClipboardList,
  LayoutGrid
} from 'lucide-react-native'

import { useApp } from '../context/AppContext'
import CustomTabBar from './CustomTabBar'

// Auth Screens
import SplashScreen from '../screens/auth/SplashScreen'
import LoginScreen from '../screens/auth/LoginScreen'
import RegisterScreen from '../screens/auth/RegisterScreen'

// Tab Screens
import DashboardScreen from '../screens/dashboard/DashboardScreen'
import TagihanScreen from '../screens/keuangan/TagihanScreen'
import WargaListScreen from '../screens/warga/WargaListScreen'
import KasScreen from '../screens/keuangan/KasScreen'
import LayananScreen from '../screens/layanan/LayananScreen'
import ProfileScreen from '../screens/warga/ProfileScreen'
import PengaturanScreen from '../screens/info/PengaturanScreen'

// Detail Screens
import DetailWargaScreen from '../screens/warga/DetailWargaScreen'
import DetailTagihanScreen from '../screens/keuangan/DetailTagihanScreen'
import PembayaranScreen from '../screens/keuangan/PembayaranScreen'
import PengaduanScreen from '../screens/layanan/PengaduanScreen'
import SuratScreen from '../screens/layanan/SuratScreen'
import EventsScreen from '../screens/layanan/EventsScreen'
import KontakDaruratScreen from '../screens/info/KontakDaruratScreen'
import PetaWargaScreen from '../screens/warga/PetaWargaScreen'
import DataAksesScreen from '../screens/info/DataAksesScreen'
import JadwalSatpamScreen from '../screens/info/JadwalSatpamScreen'

// Aksi Cepat Full Screens
import RekeningBankScreen from '../screens/keuangan/RekeningBankScreen'
import PosIuranScreen from '../screens/keuangan/PosIuranScreen'
import IdentitasLingkunganScreen from '../screens/info/IdentitasLingkunganScreen'
import NotifikasiPerangkatScreen from '../screens/info/NotifikasiPerangkatScreen'
import NotifikasiScreen from '../screens/info/NotifikasiScreen'
import MootaGatewayScreen from '../screens/keuangan/MootaGatewayScreen'
import EditProfileWargaScreen from '../screens/warga/EditProfileWargaScreen'
import AdministrasiSistemScreen from '../screens/admin/AdministrasiSistemScreen'

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

// Main Bottom Tab Navigator (5 Tabs per role, Index 2 is Floating Center Profile)
function MainTabNavigator() {
  const { isWarga, isRT, isRW, isBendahara, isPengurus, isAdmin } = useApp()

  // Tab 1 (Dashboard)
  const tab1Label = isWarga
    ? 'Beranda'
    : isBendahara
    ? 'Keuangan'
    : isPengurus
    ? 'Pengurus'
    : isRW
    ? 'RW 15'
    : isRT
    ? 'RT 01'
    : 'Admin'

  // Tab 2 (Tagihan for warga, Kas for bendahara, Data Warga for others)
  const tab2Component = isWarga
    ? TagihanScreen
    : isBendahara
    ? KasScreen
    : WargaListScreen

  const tab2Label = isWarga
    ? 'Tagihan'
    : isBendahara
    ? 'Buku Kas'
    : 'Warga'

  const Tab2Icon = isWarga ? Receipt : isBendahara ? Wallet : Users

  // Tab 4 (Layanan for warga & pengurus, Verifikasi Tagihan for bendahara, Kas for RT/RW/Admin)
  const tab4Component = isWarga || isPengurus
    ? LayananScreen
    : isBendahara
    ? TagihanScreen
    : KasScreen

  const tab4Label = isWarga
    ? 'Layanan'
    : isPengurus
    ? 'Fasum'
    : isBendahara
    ? 'Verifikasi'
    : isRW
    ? 'Kas RW'
    : isRT
    ? 'Kas RT'
    : 'Kas'

  const Tab4Icon = (isWarga || isPengurus) ? Grid : isBendahara ? Receipt : Wallet

  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false
      }}
    >
      {/* 1. Beranda / Dashboard */}
      <Tab.Screen
        name="DashboardTab"
        component={DashboardScreen}
        options={{
          tabBarLabel: tab1Label,
          tabBarIcon: ({ color, size }) =>
            isWarga ? <Home size={size} color={color} /> : <LayoutDashboard size={size} color={color} />
        }}
      />

      {/* 2. Tagihan (Warga) OR Kas (Bendahara) OR Data Warga (Lainnya) */}
      <Tab.Screen
        name="TagihanTab"
        component={tab2Component}
        options={{
          tabBarLabel: tab2Label,
          tabBarIcon: ({ color, size }) => <Tab2Icon size={size} color={color} />
        }}
      />

      {/* 3. Center Floating Tab: Profile */}
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profil',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />
        }}
      />

      {/* 4. Layanan (Warga/Pengurus) OR Verifikasi (Bendahara) OR Kas (RT/RW/Admin) */}
      <Tab.Screen
        name="LayananTab"
        component={tab4Component}
        options={{
          tabBarLabel: tab4Label,
          tabBarIcon: ({ color, size }) => <Tab4Icon size={size} color={color} />
        }}
      />

      {/* 5. Aksi Cepat */}
      <Tab.Screen
        name="PengaturanTab"
        component={PengaturanScreen}
        options={{
          tabBarLabel: 'Aksi Cepat',
          tabBarIcon: ({ color, size }) => <LayoutGrid size={size} color={color} />
        }}
      />
    </Tab.Navigator>
  )
}

export default function RootNavigator() {
  const { currentUser, loading } = useApp()
  const navigationRef = useRef(null)

  useEffect(() => {
    // Matikan notifikasi di web, di Expo Go, atau jika toggle notifikasi dinonaktifkan
    if (Platform.OS === 'web' || !ENABLE_PUSH_NOTIFICATIONS || isExpoGo) return

    let receivedSub = null
    let responseSub = null

    try {
      const Notifications = require('expo-notifications')
      if (!Notifications) return

      // 1. Setup Android channels
      setupAndroidNotificationChannels().catch(() => {})

      // 2. Listener saat notifikasi diterima ketika aplikasi aktif (Foreground)
      receivedSub = Notifications.addNotificationReceivedListener?.((notification) => {
        console.log('[Notification Received Foreground]:', notification?.request?.content?.title)
      })

      // 3. Listener saat pengguna mengetuk notifikasi (Background / Killed / Foreground)
      responseSub = Notifications.addNotificationResponseReceivedListener?.((response) => {
        handleNotificationClick(response, navigationRef.current)
      })

      // 4. Periksa apakah app dibuka dari notifikasi awal (cold start)
      Notifications.getLastNotificationResponseAsync?.()
        ?.then((initialResponse) => {
          if (initialResponse) {
            handleNotificationClick(initialResponse, navigationRef.current)
          }
        })
        ?.catch(() => {})
    } catch (_) {}

    return () => {
      receivedSub?.remove?.()
      responseSub?.remove?.()
    }
  }, [])

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right'
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Main" component={MainTabNavigator} />

        {/* Modal / Detail Screens */}
        <Stack.Screen name="DetailWarga" component={DetailWargaScreen} />
        <Stack.Screen name="DetailTagihan" component={DetailTagihanScreen} />
        <Stack.Screen name="Pembayaran" component={PembayaranScreen} />
        <Stack.Screen name="Pengaduan" component={PengaduanScreen} />
        <Stack.Screen name="Surat" component={SuratScreen} />
        <Stack.Screen name="Events" component={EventsScreen} />
        <Stack.Screen name="KontakDarurat" component={KontakDaruratScreen} />
        <Stack.Screen name="JadwalSatpam" component={JadwalSatpamScreen} />
        <Stack.Screen name="PetaWarga" component={PetaWargaScreen} />
        <Stack.Screen name="DataAkses" component={DataAksesScreen} />
        <Stack.Screen name="Kas" component={KasScreen} />
        <Stack.Screen name="WargaList" component={WargaListScreen} />
        <Stack.Screen name="Tagihan" component={TagihanScreen} />
        <Stack.Screen name="Layanan" component={LayananScreen} />
        <Stack.Screen name="Pengaturan" component={PengaturanScreen} />
        <Stack.Screen name="AksiCepat" component={PengaturanScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Notifikasi" component={NotifikasiScreen} />
        <Stack.Screen name="Pemberitahuan" component={NotifikasiScreen} />

        {/* Aksi Cepat Full Screens */}
        <Stack.Screen name="RekeningBank" component={RekeningBankScreen} />
        <Stack.Screen name="PosIuran" component={PosIuranScreen} />
        <Stack.Screen name="IdentitasLingkungan" component={IdentitasLingkunganScreen} />
        <Stack.Screen name="NotifikasiPerangkat" component={NotifikasiPerangkatScreen} />
        <Stack.Screen name="MootaGateway" component={MootaGatewayScreen} />
        <Stack.Screen name="EditProfileWarga" component={EditProfileWargaScreen} />
        <Stack.Screen name="AdministrasiSistem" component={AdministrasiSistemScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}
