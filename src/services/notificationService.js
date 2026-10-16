import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import Constants from 'expo-constants'
import { Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { supabase, isSupabaseConfigured } from '../api/supabase'

export const STORAGE_KEY_PUSH_TOKEN = '@ipl_expo_push_token'
export const STORAGE_KEY_LARAVEL_API_URL = '@ipl_laravel_api_url'

// Default fallback Laravel API URL
// 10.0.2.2 is Android Emulator alias for Host localhost
export const DEFAULT_LARAVEL_API_URL =
  typeof Platform !== 'undefined' && Platform?.select
    ? Platform.select({
        android: 'http://10.0.2.2:8000',
        ios: 'http://localhost:8000',
        default: 'http://127.0.0.1:8000'
      })
    : 'http://10.0.2.2:8000'

// Configure how notifications appear when the app is in the foreground
if (Platform?.OS !== 'web' && Notifications?.setNotificationHandler) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true
    })
  })
}

/**
 * Configure Android notification channels
 */
export async function setupAndroidNotificationChannels() {
  if (Platform?.OS !== 'android') return

  await Notifications.setNotificationChannelAsync('ipl-tagihan', {
    name: 'Tagihan & Pembayaran IPL',
    description: 'Pemberitahuan tagihan baru, jatuh tempo, dan konfirmasi pembayaran',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#059669',
    sound: 'default',
    enableVibrate: true,
    showBadge: true
  })

  await Notifications.setNotificationChannelAsync('ipl-pengumuman', {
    name: 'Pengumuman & Surat Warga',
    description: 'Informasi pengumuman RT/RW dan status permohonan surat',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 200, 200, 200],
    lightColor: '#0284c7',
    sound: 'default',
    enableVibrate: true,
    showBadge: true
  })

  await Notifications.setNotificationChannelAsync('ipl-default', {
    name: 'Notifikasi Umum',
    description: 'Pemberitahuan umum aplikasi IPL Warga',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: 'default',
    showBadge: true
  })
}

/**
 * Get current configured Laravel API URL
 */
export async function getLaravelApiUrl() {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY_LARAVEL_API_URL)
    return saved ? saved.trim() : DEFAULT_LARAVEL_API_URL
  } catch (_) {
    return DEFAULT_LARAVEL_API_URL
  }
}

/**
 * Set custom Laravel API URL (for testing or LAN IP)
 */
export async function setLaravelApiUrl(url) {
  try {
    if (url) {
      await AsyncStorage.setItem(STORAGE_KEY_LARAVEL_API_URL, url.trim())
    } else {
      await AsyncStorage.removeItem(STORAGE_KEY_LARAVEL_API_URL)
    }
  } catch (_) {}
}

/**
 * Register device and obtain Expo Push Token
 */
export async function registerForPushNotificationsAsync() {
  if (Platform?.OS === 'web') {
    return { success: false, reason: 'Push notification tidak didukung di web browser' }
  }

  // Setup Android channels first
  await setupAndroidNotificationChannels()

  if (!Device.isDevice) {
    // Physical device recommended for real APNs / FCM push, but allow token retrieval if available
    console.warn('[PushNotification] Perangkat simulator/emulator terdeteksi. Push notifikasi remote membutuhkan perangkat fisik.')
  }

  try {
    // 1. Check existing permission
    const { status: existingStatus } = await Notifications.getPermissionsAsync()
    let finalStatus = existingStatus

    // 2. Request permission if not already granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true
        }
      })
      finalStatus = status
    }

    if (finalStatus !== 'granted') {
      return {
        success: false,
        reason: 'Izin notifikasi ditolak oleh pengguna',
        permissionStatus: finalStatus
      }
    }

    // 3. Resolve Project ID
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId ??
      '8b5f3a02-6e21-4f9a-bb91-c67d329188bf'

    // 4. Get token
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId
    })

    const token = tokenData?.data
    if (!token) {
      return { success: false, reason: 'Gagal memperoleh Expo Push Token' }
    }

    // 5. Store locally
    await AsyncStorage.setItem(STORAGE_KEY_PUSH_TOKEN, token)

    return {
      success: true,
      token,
      permissionStatus: finalStatus
    }
  } catch (error) {
    console.error('[PushNotification] Error saat registrasi push token:', error)
    return {
      success: false,
      reason: error.message || 'Terjadi kesalahan saat meminta push token'
    }
  }
}

/**
 * Sync device push token with Laravel API and Supabase
 */
export async function syncPushTokenWithBackend(token, currentUser) {
  if (!token || !currentUser) return { success: false, reason: 'Token atau user tidak tersedia' }

  const apiUrl = await getLaravelApiUrl()
  const osName = Platform?.OS ? Platform.OS.toUpperCase() : 'DEVICE'
  const deviceName = Device.deviceName || `${osName} Device`
  const deviceType = Platform?.OS || 'android'

  const payload = {
    token,
    user_id: currentUser.id,
    username: currentUser.username || currentUser.name,
    role: currentUser.role || 'warga',
    resident_id: currentUser.resident_id || null,
    device_name: deviceName,
    device_type: deviceType,
    app_version: Constants?.expoConfig?.version || '2.0.0'
  }

  let laravelSuccess = false
  let laravelError = null

  // 1. Kirim ke Laravel API
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 6000)

    const response = await fetch(`${apiUrl}/api/device-tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    })
    clearTimeout(timeoutId)

    if (response.ok) {
      laravelSuccess = true
      console.log('[PushNotification] Token berhasil didaftarkan ke Laravel API:', apiUrl)
    } else {
      const errText = await response.text()
      laravelError = `HTTP ${response.status}: ${errText}`
      console.warn('[PushNotification] Gagal mendaftarkan token ke Laravel API:', laravelError)
    }
  } catch (err) {
    laravelError = err.message
    console.warn('[PushNotification] Tidak dapat terhubung ke Laravel API:', err.message)
  }

  // 2. Simpan juga ke Supabase wargaku_device_tokens untuk redundansi data
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('wargaku_device_tokens').upsert(
        {
          id: `token-${token.slice(-24)}`,
          user_id: currentUser.id,
          token,
          data: payload,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'token' }
      )
    } catch (_) {}
  }

  return {
    success: laravelSuccess,
    laravelSuccess,
    laravelError,
    token
  }
}

/**
 * Deregister push token from Laravel API on logout
 */
export async function removePushTokenFromBackend(currentUser) {
  try {
    const token = await AsyncStorage.getItem(STORAGE_KEY_PUSH_TOKEN)
    if (!token) return

    const apiUrl = await getLaravelApiUrl()
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    await fetch(`${apiUrl}/api/device-tokens`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({
        token,
        user_id: currentUser?.id
      }),
      signal: controller.signal
    }).catch(() => {})
    clearTimeout(timeoutId)

    // Remove from local storage
    await AsyncStorage.removeItem(STORAGE_KEY_PUSH_TOKEN)
  } catch (e) {
    console.warn('[PushNotification] Gagal menghapus device token:', e)
  }
}

/**
 * Handle notification tap navigation
 */
export function handleNotificationClick(response, navigationRef) {
  try {
    const data = response?.notification?.request?.content?.data || {}
    console.log('[PushNotification] Notifikasi ditekan dengan data:', data)

    if (!navigationRef || !navigationRef.isReady || !navigationRef.isReady()) {
      return
    }

    const screen = data.screen || data.type
    if (screen === 'Tagihan' || screen === 'tagihan' || data.iuran_warga_id) {
      navigationRef.navigate('TagihanTab', {
        screen: 'Tagihan',
        params: { highlightId: data.iuran_warga_id || data.targetId }
      })
    } else if (screen === 'Surat' || screen === 'surat') {
      navigationRef.navigate('LayananTab', { screen: 'Surat' })
    } else if (screen === 'Pengaduan' || screen === 'pengaduan') {
      navigationRef.navigate('LayananTab', { screen: 'Pengaduan' })
    } else if (screen === 'Events' || screen === 'events') {
      navigationRef.navigate('LayananTab', { screen: 'Events' })
    } else if (screen === 'Kas' || screen === 'kas') {
      navigationRef.navigate('LayananTab', { screen: 'Kas' })
    }
  } catch (err) {
    console.warn('[PushNotification] Gagal mengarahkan layar setelah notifikasi:', err)
  }
}

/**
 * Send local instant notification (useful for testing & offline alert)
 */
export async function sendLocalNotification({
  title,
  body,
  data = {},
  channelId = 'ipl-tagihan'
}) {
  if (Platform?.OS === 'web') {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body })
    } else {
      console.log('[Notification Web Simulasi]:', title, '-', body)
    }
    return { status: 'web-simulated' }
  }

  await setupAndroidNotificationChannels()
  return await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: 'default'
    },
    trigger: {
      channelId: Platform?.OS === 'android' ? channelId : undefined,
      seconds: 1
    }
  })
}
