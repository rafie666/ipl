import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

export const DEFAULT_SUPABASE_URL = 'https://dcefifwlfwycgmphpgtu.supabase.co'
export const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjZWZpZndsZnd5Y2dtcGhwZ3R1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2MTIwMTcsImV4cCI6MjEwNTE4ODAxN30.iRLRARxtRfNKmbRiX439gOIxHwh231LvmQekpJ0Pnzs'

let currentUrl = DEFAULT_SUPABASE_URL
let currentKey = DEFAULT_SUPABASE_ANON_KEY
let activeClient = null

export let isSupabaseConfigured = false

const safeStorage = {
  getItem: async (key) => {
    try {
      const storage = AsyncStorage?.default || AsyncStorage
      if (storage && typeof storage.getItem === 'function') {
        return await storage.getItem(key)
      }
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(key)
      }
    } catch (_) {}
    return null
  },
  setItem: async (key, val) => {
    try {
      const storage = AsyncStorage?.default || AsyncStorage
      if (storage && typeof storage.setItem === 'function') {
        return await storage.setItem(key, val)
      }
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, val)
      }
    } catch (_) {}
  },
  removeItem: async (key) => {
    try {
      const storage = AsyncStorage?.default || AsyncStorage
      if (storage && typeof storage.removeItem === 'function') {
        return await storage.removeItem(key)
      }
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key)
      }
    } catch (_) {}
  }
}

function buildClient(url, key) {
  const valid = Boolean(
    url &&
    key &&
    url.startsWith('https://') &&
    !url.includes('your-project')
  )
  isSupabaseConfigured = valid
  if (!valid) return null

  try {
    return createClient(url, key, {
      auth: {
        storage: safeStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false
      }
    })
  } catch (err) {
    console.warn('Gagal membuat client Supabase:', err)
    isSupabaseConfigured = false
    return null
  }
}

// Initial client
activeClient = buildClient(currentUrl, currentKey)

// Proxy so any import { supabase } always accesses activeClient dynamically
export const supabase = new Proxy({}, {
  get(target, prop) {
    if (!activeClient) return null
    const val = activeClient[prop]
    return typeof val === 'function' ? val.bind(activeClient) : val
  }
})

export function getSupabaseClient() {
  return activeClient
}

export async function initCustomSupabaseCredentials() {
  try {
    const savedUrl = await AsyncStorage.getItem('wargaku_supabase_url')
    const savedKey = await AsyncStorage.getItem('wargaku_supabase_key')
    if (savedUrl && savedKey) {
      currentUrl = savedUrl.trim()
      currentKey = savedKey.trim()
      activeClient = buildClient(currentUrl, currentKey)
    }
  } catch (err) {
    console.warn('Gagal membaca kredensial Supabase dari storage:', err)
  }
  return activeClient
}

export async function setCustomSupabaseCredentials(newUrl, newKey) {
  const url = (newUrl || '').trim()
  const key = (newKey || '').trim()
  currentUrl = url || DEFAULT_SUPABASE_URL
  currentKey = key || DEFAULT_SUPABASE_ANON_KEY

  await AsyncStorage.setItem('wargaku_supabase_url', currentUrl)
  await AsyncStorage.setItem('wargaku_supabase_key', currentKey)

  activeClient = buildClient(currentUrl, currentKey)
  return activeClient
}

// Helper decode Base64 to ArrayBuffer (pure JS, 100% React Native & Expo compatible)
const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
const BASE64_LOOKUP = new Uint8Array(256)
for (let i = 0; i < BASE64_CHARS.length; i++) {
  BASE64_LOOKUP[BASE64_CHARS.charCodeAt(i)] = i
}

export function decodeBase64ToArrayBuffer(base64) {
  if (!base64 || typeof base64 !== 'string') return new ArrayBuffer(0)
  const clean = base64.replace(/^data:image\/[a-zA-Z0-9.+_-]+;base64,/, '').replace(/[\r\n\t ]/g, '')
  const len = clean.length
  if (len === 0) return new ArrayBuffer(0)

  let bufferLength = Math.floor(len * 0.75)
  if (clean[len - 1] === '=') bufferLength--
  if (clean[len - 2] === '=') bufferLength--

  const arrayBuffer = new ArrayBuffer(bufferLength)
  const bytes = new Uint8Array(arrayBuffer)

  let p = 0
  for (let i = 0; i < len; i += 4) {
    const enc1 = BASE64_LOOKUP[clean.charCodeAt(i)]
    const enc2 = BASE64_LOOKUP[clean.charCodeAt(i + 1)]
    const enc3 = BASE64_LOOKUP[clean.charCodeAt(i + 2)]
    const enc4 = BASE64_LOOKUP[clean.charCodeAt(i + 3)]

    bytes[p++] = (enc1 << 2) | (enc2 >> 4)
    if (clean[i + 2] !== '=' && p < bufferLength) {
      bytes[p++] = ((enc2 & 15) << 4) | (enc3 >> 2)
    }
    if (clean[i + 3] !== '=' && p < bufferLength) {
      bytes[p++] = ((enc3 & 3) << 6) | (enc4 & 63)
    }
  }

  return arrayBuffer
}

/**
 * Upload gambar (Base64 atau File URI) ke Supabase Storage Bucket
 * Menyimpan URL publik, bukan string base64 besar di database.
 */
export async function uploadImageToSupabaseStorage({
  bucket = 'bukti-transfer',
  path,
  base64,
  uri,
  contentType = 'image/jpeg'
}) {
  try {
    if (!isSupabaseConfigured || !activeClient) {
      return { success: false, error: 'Supabase belum terkonfigurasi' }
    }

    if (!base64 && !uri) {
      return { success: false, error: 'Tidak ada data foto yang valid' }
    }

    let fileBody
    if (base64) {
      fileBody = decodeBase64ToArrayBuffer(base64)
    } else {
      const response = await fetch(uri)
      fileBody = await response.arrayBuffer()
    }

    const cleanPath = (path || `upload_${Date.now()}.jpg`).replace(/^\/+/, '')
    let { data, error } = await activeClient.storage
      .from(bucket)
      .upload(cleanPath, fileBody, {
        contentType,
        upsert: true
      })

    // Jika bucket belum dibuat, coba auto-create bucket via client
    if (error && (error.message?.toLowerCase().includes('not found') || error.statusCode === '404')) {
      try {
        const createRes = await activeClient.storage.createBucket(bucket, { public: true })
        if (!createRes.error) {
          const retryRes = await activeClient.storage
            .from(bucket)
            .upload(cleanPath, fileBody, { contentType, upsert: true })
          if (!retryRes.error) {
            error = null
            data = retryRes.data
          }
        }
      } catch (_) {}
    }

    if (error) {
      // Fallback mulus ke Base64 lokal tanpa membuat proses pembayaran gagal
      return {
        success: false,
        error: error.message,
        isBucketMissing: error.message?.toLowerCase().includes('not found'),
        fallbackUrl: base64 || uri
      }
    }

    const { data: publicUrlData } = activeClient.storage
      .from(bucket)
      .getPublicUrl(cleanPath)

    return {
      success: true,
      publicUrl: publicUrlData?.publicUrl || null,
      path: cleanPath
    }
  } catch (err) {
    return {
      success: false,
      error: err?.message || 'Gagal mengunggah foto ke storage',
      fallbackUrl: base64 || uri
    }
  }
}
