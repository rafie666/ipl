import Constants from 'expo-constants'
import { Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { supabase, isSupabaseConfigured } from '../api/supabase'

export const STORAGE_KEY_PUSH_TOKEN = '@ipl_expo_push_token'
export const STORAGE_KEY_LARAVEL_API_URL = '@ipl_laravel_api_url'

// Master toggle untuk notifikasi push / native (Matikan jika di Expo Go atau mode offline/dev)
export const ENABLE_PUSH_NOTIFICATIONS = false

export const isExpoGo =
  Constants?.executionEnvironment === 'storeClient' ||
  Constants?.appOwnership === 'expo'

// Helper lazy loader agar expo-notifications tidak diinisialisasi jika dimatikan
let _notificationsModule = null
export function getNotifications() {
  if (!ENABLE_PUSH_NOTIFICATIONS || isExpoGo || Platform?.OS === 'web') {
    return null
  }
  if (!_notificationsModule) {
    try {
      _notificationsModule = require('expo-notifications')
    } catch (_) {
      _notificationsModule = null
    }
  }
  return _notificationsModule
}

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

// Configure how notifications appear when the app is in the foreground (hanya jika aktif)
if (ENABLE_PUSH_NOTIFICATIONS && !isExpoGo && Platform?.OS !== 'web') {
  try {
    const notifMod = getNotifications()
    if (notifMod?.setNotificationHandler) {
      notifMod.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true
        })
      })
    }
  } catch (_) {}
}

/**
 * Configure Android notification channels
 */
export async function setupAndroidNotificationChannels() {
  if (!ENABLE_PUSH_NOTIFICATIONS || isExpoGo || Platform?.OS !== 'android') return

  const Notifications = getNotifications()
  if (!Notifications?.setNotificationChannelAsync) return

  try {
    await Notifications.setNotificationChannelAsync('ipl-tagihan', {
      name: 'Tagihan & Pembayaran IPL',
      description: 'Pemberitahuan tagihan baru, jatuh tempo, dan konfirmasi pembayaran',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#059669',
      sound: 'default',
      enableVibrate: true,
      showBadge: true
    }).catch(() => {})

    await Notifications.setNotificationChannelAsync('ipl-pengumuman', {
      name: 'Pengumuman & Surat Warga',
      description: 'Informasi pengumuman RT/RW dan status permohonan surat',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 200, 200, 200],
      lightColor: '#0284c7',
      sound: 'default',
      enableVibrate: true,
      showBadge: true
    }).catch(() => {})

    await Notifications.setNotificationChannelAsync('ipl-default', {
      name: 'Notifikasi Umum',
      description: 'Pemberitahuan umum aplikasi IPL Warga',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
      showBadge: true
    }).catch(() => {})
  } catch (_) {}
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
  if (!ENABLE_PUSH_NOTIFICATIONS || isExpoGo || Platform?.OS === 'web') {
    return {
      success: false,
      reason: isExpoGo
        ? 'Push notification dinonaktifkan di Expo Go.'
        : 'Push notification dinonaktifkan.',
      permissionStatus: 'denied'
    }
  }

  const Notifications = getNotifications()
  if (!Notifications) {
    return { success: false, reason: 'Modul notifikasi tidak tersedia', permissionStatus: 'denied' }
  }

  // Setup Android channels first
  await setupAndroidNotificationChannels()

  let isDevice = true
  try {
    const Device = require('expo-device')
    isDevice = Boolean(Device?.isDevice)
  } catch (_) {}

  if (!isDevice) {
    console.warn('[PushNotification] Perangkat simulator/emulator terdeteksi.')
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
  if (!ENABLE_PUSH_NOTIFICATIONS || isExpoGo || !token || !currentUser) {
    return { success: false, reason: 'Push notification tidak aktif' }
  }

  const apiUrl = await getLaravelApiUrl()
  const osName = Platform?.OS ? Platform.OS.toUpperCase() : 'DEVICE'
  let deviceName = `${osName} Device`
  try {
    const Device = require('expo-device')
    if (Device?.deviceName) deviceName = Device.deviceName
  } catch (_) {}
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
  if (!ENABLE_PUSH_NOTIFICATIONS || isExpoGo) return

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

    const type = data.type || data.screen || ''
    if (type === 'Tagihan' || type === 'tagihan' || type.startsWith('payment') || data.iuran_warga_id || data.tagihanId) {
      navigationRef.navigate('TagihanTab')
    } else if (type === 'Surat' || type === 'surat') {
      navigationRef.navigate('Surat')
    } else if (type === 'Pengaduan' || type === 'pengaduan') {
      navigationRef.navigate('Pengaduan')
    } else if (type === 'Events' || type === 'events' || type === 'event') {
      navigationRef.navigate('Events')
    } else if (type === 'Kas' || type === 'kas') {
      navigationRef.navigate('Kas')
    } else if (type === 'darurat') {
      navigationRef.navigate('KontakDarurat')
    } else if (type === 'registration') {
      navigationRef.navigate('WargaList')
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
  if (!ENABLE_PUSH_NOTIFICATIONS || isExpoGo) {
    return null
  }

  if (Platform?.OS === 'web') {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body })
    } else {
      console.log('[Notification Web Simulasi]:', title, '-', body)
    }
    return { status: 'web-simulated' }
  }

  const Notifications = getNotifications()
  if (!Notifications?.scheduleNotificationAsync) return null

  try {
    await setupAndroidNotificationChannels().catch(() => {})
    return await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
        channelId: Platform?.OS === 'android' ? channelId : undefined
      },
      trigger: null
    })
  } catch (_) {
    return null
  }
}

/**
 * Evaluasi apakah suatu notifikasi relevan untuk user tertentu (Role, RT, RW, atau User ID)
 */
export function isNotificationRelevantForUser(notif, user, resident) {
  if (!user || !notif) return false
  if (user.role === 'admin') return true

  // Filter khusus untuk role Warga: hanya informasi penting yang relevan
  if (user.role === 'warga') {
    const officerTypes = ['REGISTRATION_PENDING', 'warga_baru', 'audit', 'kas_audit', 'approval_needed']
    if (officerTypes.includes(notif.type)) return false
    if (notif.targetRole && notif.targetRole !== 'warga' && notif.targetRole !== 'all') return false

    // 1. Notifikasi spesifik ke warga ini
    if (notif.userId && (notif.userId === user.id || notif.userId === `u-${user.resident_id}`)) return true
    if (notif.residentId && (notif.residentId === user.resident_id || (resident && notif.residentId === resident.id))) return true

    // 2. Siaran untuk seluruh warga / all di wilayah RT/RW
    if (notif.targetRole === 'warga' || notif.targetRole === 'all') {
      if (notif.targetRtId && user.rt_id && notif.targetRtId !== user.rt_id) return false
      if (notif.targetRwId && user.rw_id && notif.targetRwId !== user.rw_id) return false
      return true
    }

    // 3. Pengumuman / kegiatan umum
    if (!notif.userId && !notif.residentId && !notif.targetRole) {
      if (notif.type === 'event' || notif.type === 'info' || notif.type === 'pengumuman') return true
    }

    return false
  }

  // 1. Cek kecocokan User ID atau Resident ID spesifik
  if (notif.userId && (notif.userId === user.id || notif.userId === `u-${user.resident_id}`)) return true
  if (notif.residentId && (notif.residentId === user.resident_id || (resident && notif.residentId === resident.id))) return true

  // 2. Cek Role penerima
  if (notif.targetRole) {
    if (notif.targetRole === 'all') return true
    if (notif.targetRole === user.role) {
      if (notif.targetRtId && user.rt_id && notif.targetRtId !== user.rt_id) return false
      if (notif.targetRwId && user.rw_id && notif.targetRwId !== user.rw_id) return false
      return true
    }
    // Jika ditujukan untuk pengurus (rt, rw, bendahara, admin)
    if (notif.targetRole === 'pengurus' && (user.role === 'rt' || user.role === 'rw' || user.role === 'bendahara' || user.role === 'admin')) {
      if (notif.targetRtId && user.rt_id && user.role === 'rt' && notif.targetRtId !== user.rt_id) return false
      return true
    }
    // Jika ditujukan untuk bendahara tapi juga relevan untuk RT setempat dan Admin IT
    if (notif.targetRole === 'bendahara') {
      if (user.role === 'bendahara' || user.role === 'admin') return true
      if (user.role === 'rt' && notif.targetRtId && user.rt_id === notif.targetRtId) return true
    }
  }

  // 3. Jika publik tanpa target spesifik
  if (!notif.userId && !notif.residentId && !notif.targetRole) return true

  return false
}
