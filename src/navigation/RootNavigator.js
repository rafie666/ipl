import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
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
  ClipboardList
} from 'lucide-react-native'

import { useApp } from '../context/AppContext'
import CustomTabBar from './CustomTabBar'

// Auth Screens
import SplashScreen from '../screens/SplashScreen'
import LoginScreen from '../screens/LoginScreen'
import RegisterScreen from '../screens/RegisterScreen'

// Tab Screens
import DashboardScreen from '../screens/DashboardScreen'
import TagihanScreen from '../screens/TagihanScreen'
import WargaListScreen from '../screens/WargaListScreen'
import KasScreen from '../screens/KasScreen'
import LayananScreen from '../screens/LayananScreen'
import ProfileScreen from '../screens/ProfileScreen'
import PengaturanScreen from '../screens/PengaturanScreen'

// Detail Screens
import DetailWargaScreen from '../screens/DetailWargaScreen'
import DetailTagihanScreen from '../screens/DetailTagihanScreen'
import PembayaranScreen from '../screens/PembayaranScreen'
import PengaduanScreen from '../screens/PengaduanScreen'
import SuratScreen from '../screens/SuratScreen'
import EventsScreen from '../screens/EventsScreen'
import KontakDaruratScreen from '../screens/KontakDaruratScreen'
import PetaWargaScreen from '../screens/PetaWargaScreen'
import DataAksesScreen from '../screens/DataAksesScreen'

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

// Main Bottom Tab Navigator (5 Tabs per role, Index 2 is Floating Center Profile)
function MainTabNavigator() {
  const { isWarga, isRT, isAdmin } = useApp()

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
          tabBarLabel: isWarga ? 'Beranda' : 'Dashboard',
          tabBarIcon: ({ color, size }) =>
            isWarga ? <Home size={size} color={color} /> : <LayoutDashboard size={size} color={color} />
        }}
      />

      {/* 2. Tagihan (Warga) OR Warga/Data (RT/Admin) */}
      <Tab.Screen
        name="TagihanTab"
        component={isWarga ? TagihanScreen : WargaListScreen}
        options={{
          tabBarLabel: isWarga ? 'Pembayaran' : 'Data Warga',
          tabBarIcon: ({ color, size }) =>
            isWarga ? <Receipt size={size} color={color} /> : <Users size={size} color={color} />
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

      {/* 4. Layanan (Warga) OR Kas (RT/Admin) */}
      <Tab.Screen
        name="LayananTab"
        component={isWarga ? LayananScreen : KasScreen}
        options={{
          tabBarLabel: isWarga ? 'Layanan' : 'Kas RT/RW',
          tabBarIcon: ({ color, size }) =>
            isWarga ? <Grid size={size} color={color} /> : <Wallet size={size} color={color} />
        }}
      />

      {/* 5. Pengaturan */}
      <Tab.Screen
        name="PengaturanTab"
        component={PengaturanScreen}
        options={{
          tabBarLabel: 'Pengaturan',
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />
        }}
      />
    </Tab.Navigator>
  )
}

export default function RootNavigator() {
  const { currentUser, loading } = useApp()

  return (
    <NavigationContainer>
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
        <Stack.Screen name="PetaWarga" component={PetaWargaScreen} />
        <Stack.Screen name="DataAkses" component={DataAksesScreen} />
        <Stack.Screen name="Kas" component={KasScreen} />
        <Stack.Screen name="WargaList" component={WargaListScreen} />
        <Stack.Screen name="Tagihan" component={TagihanScreen} />
        <Stack.Screen name="Layanan" component={LayananScreen} />
        <Stack.Screen name="Pengaturan" component={PengaturanScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}
