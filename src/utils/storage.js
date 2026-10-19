import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  INITIAL_CONFIG,
  INITIAL_JENIS_IURAN,
  INITIAL_WARGA,
  INITIAL_TAGIHAN,
  INITIAL_KAS,
  INITIAL_EVENTS,
  INITIAL_TAGIHAN_EVENTS,
  INITIAL_ADMIN_AUTH,
  INITIAL_USERS,
  INITIAL_RTS,
  INITIAL_PENGADUAN,
  INITIAL_SURAT_PENGANTAR,
  INITIAL_KONTAK_DARURAT,
  INITIAL_BANK_ACCOUNTS,
  INITIAL_QRIS_ACCOUNTS,
  INITIAL_NOTIFICATIONS,
  INITIAL_AUDIT_LOGS,
  INITIAL_RWS,
  INITIAL_PETUGAS_SATPAM,
  INITIAL_JADWAL_SATPAM
} from '../data/initialData.js'
import { isSupabaseConfigured, supabase } from '../api/supabase.js'

export const STORAGE_KEYS = {
  CONFIG: 'wargaku_config',
  JENIS_IURAN: 'wargaku_jenis_iuran',
  WARGA: 'wargaku_warga',
  TAGIHAN: 'wargaku_tagihan',
  KAS: 'wargaku_kas',
  EVENTS: 'wargaku_events',
  TAGIHAN_EVENTS: 'wargaku_tagihan_events',
  RTS: 'wargaku_rts',
  RWS: 'wargaku_rws',
  USERS: 'wargaku_users',
  CURRENT_USER: 'wargaku_current_user',
  ADMIN_AUTH: 'wargaku_admin_auth',
  PENGADUAN: 'wargaku_pengaduan',
  SURAT: 'wargaku_surat',
  KONTAK_DARURAT: 'wargaku_kontak_darurat',
  BANK_ACCOUNTS: 'wargaku_bank_accounts',
  QRIS_ACCOUNTS: 'wargaku_qris_accounts',
  NOTIFICATIONS: 'wargaku_notifications',
  AUDIT_LOGS: 'wargaku_audit_logs',
  JADWAL_SATPAM: 'wargaku_jadwal_satpam',
  PETUGAS_SATPAM: 'wargaku_petugas_satpam',
  SEEDED: 'wargaku_seeded_mobile_v5'
}

export async function getStorageItem(key, fallbackValue = null) {
  try {
    const val = await AsyncStorage.getItem(key)
    if (val === null || val === undefined) return fallbackValue
    return JSON.parse(val)
  } catch (err) {
    console.warn(`Gagal membaca ${key}:`, err)
    return fallbackValue
  }
}

export async function deleteFromSupabase(keyName, itemId) {
  if (!isSupabaseConfigured || !supabase || !itemId) return
  // Fire and forget non-blocking
  ;(async () => {
    try {
      const fullKey = STORAGE_KEYS[keyName?.toUpperCase()] || keyName
      await Promise.race([
        supabase.from(fullKey).delete().eq('id', itemId),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
      ])
    } catch (err) {
      // Background ignore
    }
  })()
}

export async function saveStorageItem(keyName, data) {
  try {
    const fullKey = STORAGE_KEYS[keyName?.toUpperCase()] || keyName
    await AsyncStorage.setItem(fullKey, JSON.stringify(data))

    // Non-blocking background sync ke Supabase
    if (isSupabaseConfigured && supabase) {
      const knownArrayTables = new Set([
        STORAGE_KEYS.JENIS_IURAN,
        STORAGE_KEYS.WARGA,
        STORAGE_KEYS.TAGIHAN,
        STORAGE_KEYS.KAS,
        STORAGE_KEYS.EVENTS,
        STORAGE_KEYS.TAGIHAN_EVENTS,
        STORAGE_KEYS.USERS,
        STORAGE_KEYS.RTS,
        STORAGE_KEYS.RWS,
        STORAGE_KEYS.PENGADUAN,
        STORAGE_KEYS.SURAT,
        STORAGE_KEYS.KONTAK_DARURAT,
        STORAGE_KEYS.BANK_ACCOUNTS,
        STORAGE_KEYS.QRIS_ACCOUNTS,
        STORAGE_KEYS.NOTIFICATIONS,
        STORAGE_KEYS.AUDIT_LOGS
      ])
      const singleTables = new Set([STORAGE_KEYS.CONFIG, STORAGE_KEYS.ADMIN_AUTH])

      // Fire and forget in background
      ;(async () => {
        try {
          if (Array.isArray(data) && knownArrayTables.has(fullKey)) {
            const rows = data.map((item) => ({
              id: item.id || `row-${Math.random()}`,
              data: item,
              updated_at: new Date().toISOString()
            }))
            if (rows.length > 0) {
              await supabase.from(fullKey).upsert(rows)
            }
          } else if (data && typeof data === 'object' && !Array.isArray(data) && singleTables.has(fullKey)) {
            await supabase.from(fullKey).upsert({
              id: 'main',
              data: data,
              updated_at: new Date().toISOString()
            })
          }
        } catch (sbErr) {
          console.warn(`Background Supabase sync [${fullKey}] warning:`, sbErr)
        }
      })()
    }
  } catch (err) {
    console.error(`Gagal menyimpan ${keyName}:`, err)
  }
}

export async function loadInitialStorage() {
  const isSeeded = await AsyncStorage.getItem(STORAGE_KEYS.SEEDED)
  if (!isSeeded) {
    const seedPairs = [
      [STORAGE_KEYS.CONFIG, JSON.stringify(INITIAL_CONFIG)],
      [STORAGE_KEYS.JENIS_IURAN, JSON.stringify(INITIAL_JENIS_IURAN)],
      [STORAGE_KEYS.WARGA, JSON.stringify(INITIAL_WARGA)],
      [STORAGE_KEYS.TAGIHAN, JSON.stringify(INITIAL_TAGIHAN)],
      [STORAGE_KEYS.KAS, JSON.stringify(INITIAL_KAS)],
      [STORAGE_KEYS.EVENTS, JSON.stringify(INITIAL_EVENTS)],
      [STORAGE_KEYS.TAGIHAN_EVENTS, JSON.stringify(INITIAL_TAGIHAN_EVENTS)],
      [STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS)],
      [STORAGE_KEYS.RTS, JSON.stringify(INITIAL_RTS)],
      [STORAGE_KEYS.RWS, JSON.stringify(INITIAL_RWS)],
      [STORAGE_KEYS.PENGADUAN, JSON.stringify(INITIAL_PENGADUAN)],
      [STORAGE_KEYS.SURAT, JSON.stringify(INITIAL_SURAT_PENGANTAR)],
      [STORAGE_KEYS.KONTAK_DARURAT, JSON.stringify(INITIAL_KONTAK_DARURAT)],
      [STORAGE_KEYS.ADMIN_AUTH, JSON.stringify(INITIAL_ADMIN_AUTH)],
      [STORAGE_KEYS.BANK_ACCOUNTS, JSON.stringify(INITIAL_BANK_ACCOUNTS)],
      [STORAGE_KEYS.QRIS_ACCOUNTS, JSON.stringify(INITIAL_QRIS_ACCOUNTS)],
      [STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS)],
      [STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(INITIAL_AUDIT_LOGS)],
      [STORAGE_KEYS.SEEDED, 'true']
    ]
    await AsyncStorage.multiSet(seedPairs)

    // Auto sync seed to Supabase
    saveStorageItem(STORAGE_KEYS.CONFIG, INITIAL_CONFIG)
    saveStorageItem(STORAGE_KEYS.RWS, INITIAL_RWS)
    saveStorageItem(STORAGE_KEYS.RTS, INITIAL_RTS)
    saveStorageItem(STORAGE_KEYS.USERS, INITIAL_USERS)
    saveStorageItem(STORAGE_KEYS.WARGA, INITIAL_WARGA)
    saveStorageItem(STORAGE_KEYS.TAGIHAN, INITIAL_TAGIHAN)
  }

  const keysToFetch = [
    STORAGE_KEYS.CONFIG,
    STORAGE_KEYS.JENIS_IURAN,
    STORAGE_KEYS.WARGA,
    STORAGE_KEYS.TAGIHAN,
    STORAGE_KEYS.KAS,
    STORAGE_KEYS.EVENTS,
    STORAGE_KEYS.TAGIHAN_EVENTS,
    STORAGE_KEYS.USERS,
    STORAGE_KEYS.RTS,
    STORAGE_KEYS.RWS,
    STORAGE_KEYS.PENGADUAN,
    STORAGE_KEYS.SURAT,
    STORAGE_KEYS.KONTAK_DARURAT,
    STORAGE_KEYS.ADMIN_AUTH,
    STORAGE_KEYS.BANK_ACCOUNTS,
    STORAGE_KEYS.QRIS_ACCOUNTS,
    STORAGE_KEYS.NOTIFICATIONS,
    STORAGE_KEYS.AUDIT_LOGS,
    STORAGE_KEYS.JADWAL_SATPAM,
    STORAGE_KEYS.PETUGAS_SATPAM
  ]

  const rawEntries = await AsyncStorage.multiGet(keysToFetch)
  const map = {}
  rawEntries.forEach(([key, val]) => {
    try {
      map[key] = val !== null && val !== undefined ? JSON.parse(val) : null
    } catch (_) {
      map[key] = null
    }
  })

  return {
    config: map[STORAGE_KEYS.CONFIG] || INITIAL_CONFIG,
    jenisIuran: map[STORAGE_KEYS.JENIS_IURAN] || INITIAL_JENIS_IURAN,
    warga: map[STORAGE_KEYS.WARGA] || INITIAL_WARGA,
    tagihan: map[STORAGE_KEYS.TAGIHAN] || INITIAL_TAGIHAN,
    kas: map[STORAGE_KEYS.KAS] || INITIAL_KAS,
    events: map[STORAGE_KEYS.EVENTS] || INITIAL_EVENTS,
    tagihanEvents: map[STORAGE_KEYS.TAGIHAN_EVENTS] || INITIAL_TAGIHAN_EVENTS,
    users: map[STORAGE_KEYS.USERS] || INITIAL_USERS,
    rts: map[STORAGE_KEYS.RTS] || INITIAL_RTS,
    rws: map[STORAGE_KEYS.RWS] || INITIAL_RWS,
    pengaduan: map[STORAGE_KEYS.PENGADUAN] || INITIAL_PENGADUAN,
    surat: map[STORAGE_KEYS.SURAT] || INITIAL_SURAT_PENGANTAR,
    kontakDarurat: map[STORAGE_KEYS.KONTAK_DARURAT] || INITIAL_KONTAK_DARURAT,
    adminAuth: map[STORAGE_KEYS.ADMIN_AUTH] || INITIAL_ADMIN_AUTH,
    bankAccounts: map[STORAGE_KEYS.BANK_ACCOUNTS] || INITIAL_BANK_ACCOUNTS,
    qrisAccounts: map[STORAGE_KEYS.QRIS_ACCOUNTS] || INITIAL_QRIS_ACCOUNTS,
    notifications: map[STORAGE_KEYS.NOTIFICATIONS] || INITIAL_NOTIFICATIONS,
    auditLogs: map[STORAGE_KEYS.AUDIT_LOGS] || INITIAL_AUDIT_LOGS,
    jadwalSatpam: map[STORAGE_KEYS.JADWAL_SATPAM] || INITIAL_JADWAL_SATPAM,
    petugasSatpam: map[STORAGE_KEYS.PETUGAS_SATPAM] || INITIAL_PETUGAS_SATPAM
  }
}

export async function syncAllFromSupabase() {
  if (!isSupabaseConfigured || !supabase) return null

  try {
    const [cfgRes, jiRes, wRes, tRes, kRes, evRes, teRes, uRes, rtsRes, pRes, sRes, kdRes, baRes, qaRes, notifRes, auditRes] = await Promise.all([
      supabase.from(STORAGE_KEYS.CONFIG).select('*'),
      supabase.from(STORAGE_KEYS.JENIS_IURAN).select('*'),
      supabase.from(STORAGE_KEYS.WARGA).select('*'),
      supabase.from(STORAGE_KEYS.TAGIHAN).select('*'),
      supabase.from(STORAGE_KEYS.KAS).select('*'),
      supabase.from(STORAGE_KEYS.EVENTS).select('*'),
      supabase.from(STORAGE_KEYS.TAGIHAN_EVENTS).select('*'),
      supabase.from(STORAGE_KEYS.USERS).select('*'),
      supabase.from(STORAGE_KEYS.RTS).select('*'),
      supabase.from(STORAGE_KEYS.PENGADUAN).select('*'),
      supabase.from(STORAGE_KEYS.SURAT).select('*'),
      supabase.from(STORAGE_KEYS.KONTAK_DARURAT).select('*'),
      supabase.from(STORAGE_KEYS.BANK_ACCOUNTS).select('*'),
      supabase.from(STORAGE_KEYS.QRIS_ACCOUNTS).select('*'),
      supabase.from(STORAGE_KEYS.NOTIFICATIONS).select('*'),
      supabase.from(STORAGE_KEYS.AUDIT_LOGS).select('*')
    ])

    const extractRows = (res) => (res.data || []).map((r) => r.data)
    const extractSingle = (res) => res.data?.[0]?.data || null

    const result = {
      config: extractSingle(cfgRes),
      jenisIuran: extractRows(jiRes),
      warga: extractRows(wRes),
      tagihan: extractRows(tRes),
      kas: extractRows(kRes),
      events: extractRows(evRes),
      tagihanEvents: extractRows(teRes),
      users: extractRows(uRes),
      rts: extractRows(rtsRes),
      pengaduan: extractRows(pRes),
      surat: extractRows(sRes),
      kontakDarurat: extractRows(kdRes),
      bankAccounts: extractRows(baRes),
      qrisAccounts: extractRows(qaRes),
      notifications: extractRows(notifRes),
      auditLogs: extractRows(auditRes)
    }

    const multiPairs = []
    if (result.config) multiPairs.push([STORAGE_KEYS.CONFIG, JSON.stringify(result.config)])
    if (result.jenisIuran.length) multiPairs.push([STORAGE_KEYS.JENIS_IURAN, JSON.stringify(result.jenisIuran)])
    if (result.warga.length) multiPairs.push([STORAGE_KEYS.WARGA, JSON.stringify(result.warga)])
    if (result.tagihan.length) multiPairs.push([STORAGE_KEYS.TAGIHAN, JSON.stringify(result.tagihan)])
    if (result.kas.length) multiPairs.push([STORAGE_KEYS.KAS, JSON.stringify(result.kas)])
    if (result.events.length) multiPairs.push([STORAGE_KEYS.EVENTS, JSON.stringify(result.events)])
    if (result.tagihanEvents.length) multiPairs.push([STORAGE_KEYS.TAGIHAN_EVENTS, JSON.stringify(result.tagihanEvents)])
    if (result.users.length) multiPairs.push([STORAGE_KEYS.USERS, JSON.stringify(result.users)])
    if (result.rts.length) multiPairs.push([STORAGE_KEYS.RTS, JSON.stringify(result.rts)])
    if (result.pengaduan.length) multiPairs.push([STORAGE_KEYS.PENGADUAN, JSON.stringify(result.pengaduan)])
    if (result.surat.length) multiPairs.push([STORAGE_KEYS.SURAT, JSON.stringify(result.surat)])
    if (result.kontakDarurat.length) multiPairs.push([STORAGE_KEYS.KONTAK_DARURAT, JSON.stringify(result.kontakDarurat)])
    if (result.bankAccounts.length) multiPairs.push([STORAGE_KEYS.BANK_ACCOUNTS, JSON.stringify(result.bankAccounts)])
    if (result.qrisAccounts.length) multiPairs.push([STORAGE_KEYS.QRIS_ACCOUNTS, JSON.stringify(result.qrisAccounts)])
    if (result.notifications.length) multiPairs.push([STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(result.notifications)])
    if (result.auditLogs.length) multiPairs.push([STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(result.auditLogs)])

    if (multiPairs.length > 0) {
      await AsyncStorage.multiSet(multiPairs)
    }

    return result
  } catch (err) {
    console.warn('Gagal sync Supabase:', err)
    return null
  }
}

export async function resetAllStorageToDefault() {
  await AsyncStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(INITIAL_CONFIG))
  await AsyncStorage.setItem(STORAGE_KEYS.JENIS_IURAN, JSON.stringify(INITIAL_JENIS_IURAN))
  await AsyncStorage.setItem(STORAGE_KEYS.WARGA, JSON.stringify(INITIAL_WARGA))
  await AsyncStorage.setItem(STORAGE_KEYS.TAGIHAN, JSON.stringify(INITIAL_TAGIHAN))
  await AsyncStorage.setItem(STORAGE_KEYS.KAS, JSON.stringify(INITIAL_KAS))
  await AsyncStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(INITIAL_EVENTS))
  await AsyncStorage.setItem(STORAGE_KEYS.TAGIHAN_EVENTS, JSON.stringify(INITIAL_TAGIHAN_EVENTS))
  await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS))
  await AsyncStorage.setItem(STORAGE_KEYS.RTS, JSON.stringify(INITIAL_RTS))
  await AsyncStorage.setItem(STORAGE_KEYS.PENGADUAN, JSON.stringify(INITIAL_PENGADUAN))
  await AsyncStorage.setItem(STORAGE_KEYS.SURAT, JSON.stringify(INITIAL_SURAT_PENGANTAR))
  await AsyncStorage.setItem(STORAGE_KEYS.KONTAK_DARURAT, JSON.stringify(INITIAL_KONTAK_DARURAT))
  await AsyncStorage.setItem(STORAGE_KEYS.JADWAL_SATPAM, JSON.stringify(INITIAL_JADWAL_SATPAM))
  await AsyncStorage.setItem(STORAGE_KEYS.PETUGAS_SATPAM, JSON.stringify(INITIAL_PETUGAS_SATPAM))
  await AsyncStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, JSON.stringify(INITIAL_ADMIN_AUTH))
  return true
}
