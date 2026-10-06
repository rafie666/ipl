import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

export const DEFAULT_SUPABASE_URL = 'https://dcefifwlfwycgmphpgtu.supabase.co'
export const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjZWZpZndsZnd5Y2dtcGhwZ3R1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2MTIwMTcsImV4cCI6MjEwNTE4ODAxN30.iRLRARxtRfNKmbRiX439gOIxHwh231LvmQekpJ0Pnzs'

let currentUrl = DEFAULT_SUPABASE_URL
let currentKey = DEFAULT_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(
  currentUrl &&
  currentKey &&
  currentUrl.startsWith('https://') &&
  !currentUrl.includes('your-project')
)

export const supabase = isSupabaseConfigured
  ? createClient(currentUrl, currentKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false
      }
    })
  : null

export async function initCustomSupabaseCredentials() {
  try {
    const savedUrl = await AsyncStorage.getItem('wargaku_supabase_url')
    const savedKey = await AsyncStorage.getItem('wargaku_supabase_key')
    if (savedUrl && savedKey) {
      currentUrl = savedUrl
      currentKey = savedKey
    }
  } catch (err) {
    console.warn('Gagal membaca kredensial Supabase dari storage:', err)
  }
}
