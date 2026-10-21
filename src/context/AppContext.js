import React, { createContext, useContext, useState, useEffect } from 'react'
import { AppState } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  loadInitialStorage,
  saveStorageItem,
  getStorageItem,
  deleteFromSupabase,
  syncAllFromSupabase,
  resetAllStorageToDefault,
  STORAGE_KEYS
} from '../utils/storage'
import { INITIAL_KAS } from '../data/initialData'
import {
  apiLogin,
  filterResidentsByRole,
  filterBillsByRole,
  filterKasByRole,
  filterEventsByRole,
  filterKontakDaruratByRole,
  isUsernameAvailable
} from '../services/authService'
import { hashPassword } from '../utils/crypto'
import { supabase, isSupabaseConfigured, initCustomSupabaseCredentials } from '../api/supabase'
import {
  calculateTotalWithKodeUnik,
  getKodeUnikWarga,
  getAngkaKodeUnik,
  getKodeUnikLengkap,
  generateNextKodeUnik,
  getJabatanLabel,
  getJabatanShortLabel,
  getJabatanTheme
} from '../utils/formatters'
import {
  calculateNextRunDate,
  getEffectivePublishDay,
  getEffectiveDueDay,
  shouldExecuteAutoBilling,
  buildAutoBillingInvoices,
  getJakartaDate,
  getNamaBulan
} from '../utils/billingScheduler'
import {
  registerForPushNotificationsAsync,
  syncPushTokenWithBackend,
  removePushTokenFromBackend,
  sendLocalNotification,
  isNotificationRelevantForUser,
  getLaravelApiUrl,
  setLaravelApiUrl as saveLaravelApiUrl,
  STORAGE_KEY_PUSH_TOKEN
} from '../services/notificationService'

const AppContext = createContext()

export function AppProvider({ children }) {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [activeMode, setActiveMode] = useState('jabatan') // 'jabatan' | 'warga'
  const [activeRoleOverride, setActiveRoleOverride] = useState(null)
  const [users, setUsers] = useState([])
  const [rts, setRts] = useState([])
  const [rws, setRws] = useState([])
  const [adminAuth, setAdminAuth] = useState(null)

  // Data states
  const [config, setConfig] = useState(null)
  const [jenisIuran, setJenisIuran] = useState([])
  const [warga, setWarga] = useState([])
  const [tagihan, setTagihan] = useState([])
  const [kas, setKas] = useState([])
  const [events, setEvents] = useState([])
  const [tagihanEvents, setTagihanEvents] = useState([])
  const [pengaduan, setPengaduan] = useState([])
  const [surat, setSurat] = useState([])
  const [kontakDarurat, setKontakDarurat] = useState([])
  const [jadwalSatpam, setJadwalSatpam] = useState([])
  const [petugasSatpam, setPetugasSatpam] = useState([])
  const [bankAccounts, setBankAccounts] = useState([])
  const [qrisAccounts, setQrisAccounts] = useState([])
  const [notifications, setNotifications] = useState([])
  const [auditLogs, setAuditLogs] = useState([])
  const [expoPushToken, setExpoPushToken] = useState(null)
  const [laravelApiUrl, setLaravelApiUrlState] = useState('http://10.0.2.2:8000')
  const [notificationPermissionStatus, setNotificationPermissionStatus] = useState(null)

  // Load cache on start
  useEffect(() => {
    async function init() {
      try {
        await initCustomSupabaseCredentials()
        const initial = await loadInitialStorage()

        // Normalisasi config jika masih tersimpan demo RW 01 - RW 05
        let initialConfig = initial.config
        if (initialConfig?.rw && initialConfig.rw.includes('-')) {
          initialConfig = {
            ...initialConfig,
            rw: 'RW 01',
            rtRw: 'RT 01 / RW 01'
          }
        }
        if (JSON.stringify(initialConfig) !== JSON.stringify(initial.config)) {
          await saveStorageItem(STORAGE_KEYS.CONFIG, initialConfig)
        }
        setConfig(initialConfig)

        // Normalisasi tagihan jika masih ada yang bertuliskan RW 01 - RW 05
        const sanitizedTagihan = (initial.tagihan || []).map((t) => {
          if (t.pembayaran_kepada && t.pembayaran_kepada.includes('-')) {
            return { ...t, pembayaran_kepada: 'RW 01' }
          }
          return t
        })

        const mootaOfficialAccount = {
          id: 'ba-moota-main',
          owner_type: 'ALL',
          owner_id: 'moota',
          bank_name: 'Bank Transfer (Sandbox)',
          account_number: '090908080777',
          account_holder: 'Rafi Nurrahman',
          is_primary: true,
          is_active: true
        }
        const initialBanks = (initial.bankAccounts || []).filter(b => b.account_number !== '78090908080777' && b.account_number !== '090908080777' && b.id !== 'ba-moota-main')
        const sanitizedBanks = [mootaOfficialAccount, ...initialBanks]

        let initialKas = initial.kas || []
        const hasKeluar = initialKas.some((k) => k.tipe === 'Keluar' || k.tipe === 'Pengeluaran')
        if (!hasKeluar) {
          const samplePengeluaran = (INITIAL_KAS || []).filter((k) => k.tipe === 'Keluar' || k.tipe === 'Pengeluaran')
          initialKas = [...samplePengeluaran, ...initialKas]
          await saveStorageItem(STORAGE_KEYS.KAS, initialKas)
        }

        // Normalisasi warga: pastikan Bambang Sutrisno (w-1) dan warga murni berstatus jabatan 'warga'
        const sanitizedWarga = (initial.warga || []).map((w) => {
          if (w.id === 'w-1' || (w.nama && w.nama.toLowerCase().includes('bambang sutrisno'))) {
            return { ...w, jabatan: 'warga', role: 'warga', noRumah: '01', blok: 'A', rt_id: 'rt-01-01' }
          }
          return w
        })

        // Normalisasi users: u-w-1 sebagai warga biasa, u-rt-01-01 sebagai Bpk. Syahdan
        const sanitizedUsers = (initial.users || []).map((u) => {
          if (u.id === 'u-w-1' || u.username === 'bambang.sutrisno' || (u.name && u.name.toLowerCase().includes('bambang sutrisno'))) {
            return {
              ...u,
              id: 'u-w-1',
              username: 'bambang.sutrisno',
              name: 'Bambang Sutrisno (Warga Blok A-01)',
              role: 'warga',
              jabatan: 'warga',
              resident_id: 'w-1',
              rt_id: 'rt-01-01',
              rw_id: 'rw-01'
            }
          }
          if (u.id === 'u-rt-01-01' || u.username === 'rt01.rw01' || u.username === 'rt') {
            return {
              ...u,
              id: 'u-rt-01-01',
              username: 'rt01.rw01',
              name: 'Bpk. Syahdan (Ketua RT 01 / RW 01)',
              role: 'rt',
              jabatan: 'rt',
              resident_id: null,
              rt_id: 'rt-01-01',
              rw_id: 'rw-01'
            }
          }
          return u
        })

        if (JSON.stringify(sanitizedWarga) !== JSON.stringify(initial.warga || [])) {
          await saveStorageItem(STORAGE_KEYS.WARGA, sanitizedWarga)
        }
        if (JSON.stringify(sanitizedUsers) !== JSON.stringify(initial.users || [])) {
          await saveStorageItem(STORAGE_KEYS.USERS, sanitizedUsers)
        }

        // Otomatisasi & Catch-up Tagihan Bulanan (Sesuai tanggal hari ini di Jakarta)
        let finalTagihan = [...sanitizedTagihan]
        let finalNotifications = [...(initial.notifications || [])]
        const autoCfg = initialConfig?.autoBilling || {
          enabled: true,
          publishDay: 5,
          publishTime: '08:00',
          dueDay: 20,
          scope: 'ALL'
        }

        const autoBillingEval = shouldExecuteAutoBilling({
          autoBillingConfig: autoCfg,
          existingInvoices: finalTagihan,
          residents: sanitizedWarga,
          currentTime: new Date()
        })

        if (autoBillingEval.shouldRun) {
          const autoGenResult = buildAutoBillingInvoices({
            targetYear: autoBillingEval.targetYear,
            targetMonth: autoBillingEval.targetMonth,
            publishDay: autoBillingEval.effectivePublishDay || autoCfg.publishDay || 5,
            dueDay: autoBillingEval.effectiveDueDay || autoCfg.dueDay || 20,
            scope: autoCfg.scope || 'ALL',
            residents: sanitizedWarga,
            iuranRates: initial.jenisIuran,
            existingInvoices: finalTagihan,
            rts: initial.rts
          })

          if (autoGenResult.createdInvoices.length > 0) {
            finalTagihan = [...autoGenResult.createdInvoices, ...finalTagihan]
            await saveStorageItem(STORAGE_KEYS.TAGIHAN, finalTagihan)

            if (autoGenResult.createdNotifications.length > 0) {
              finalNotifications = [...autoGenResult.createdNotifications, ...finalNotifications]
              await saveStorageItem(STORAGE_KEYS.NOTIFICATIONS, finalNotifications)
            }

            const updatedAutoCfg = {
              ...autoCfg,
              last_run_at: new Date().toISOString(),
              last_run_period: autoGenResult.period,
              last_run_status: 'success',
              last_run_created_count: autoGenResult.totalCreated,
              last_run_skipped_count: Math.max(0, sanitizedWarga.length * (autoCfg.scope === 'ALL' ? 2 : 1) - autoGenResult.totalCreated),
              last_run_message: `Otomatis menerbitkan ${autoGenResult.totalCreated} tagihan IPL periode ${autoGenResult.periodLabel} (Jadwal tanggal ${autoBillingEval.effectivePublishDay}).`,
              scheduler_heartbeat: new Date().toISOString(),
              scheduler_status: 'RUNNING'
            }
            initialConfig = { ...initialConfig, autoBilling: updatedAutoCfg }
            await saveStorageItem(STORAGE_KEYS.CONFIG, initialConfig)
            setConfig(initialConfig)

            // Sync ke Supabase bila terhubung
            if (isSupabaseConfigured && supabase) {
              try {
                const dbInvoices = autoGenResult.createdInvoices.map((inv) => ({
                  id: inv.id,
                  data: inv,
                  updated_at: new Date().toISOString()
                }))
                await supabase.from('wargaku_tagihan').upsert(dbInvoices, { onConflict: 'id' })

                if (autoGenResult.createdNotifications.length > 0) {
                  const dbNotifs = autoGenResult.createdNotifications.map((n) => ({
                    id: n.id,
                    data: n,
                    updated_at: new Date().toISOString()
                  }))
                  await supabase.from('wargaku_notifications').upsert(dbNotifs, { onConflict: 'id' })
                }
              } catch (sbErr) {
                console.warn('Gagal sync auto-billing ke Supabase:', sbErr)
              }
            }
          }
        }

        setJenisIuran(initial.jenisIuran)
        setWarga(sanitizedWarga)
        setTagihan(finalTagihan)
        setKas(initialKas)
        setEvents(initial.events)
        setTagihanEvents(initial.tagihanEvents)
        setUsers(sanitizedUsers)
        setRts(initial.rts)
        setRws(initial.rws || [])
        setPengaduan(initial.pengaduan)
        setSurat(initial.surat)
        setKontakDarurat(initial.kontakDarurat)
        setAdminAuth(initial.adminAuth)
        setBankAccounts(sanitizedBanks)
        setQrisAccounts(initial.qrisAccounts || [])
        setNotifications(finalNotifications)
        setAuditLogs(initial.auditLogs || [])
        setJadwalSatpam(initial.jadwalSatpam || [])
        setPetugasSatpam(initial.petugasSatpam || [])

        // Cek saved user session & migrasi otomatis sesi aktif
        const savedUserStr = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_USER)
        if (savedUserStr) {
          try {
            let parsedUser = JSON.parse(savedUserStr)
            // Jika user yang tersimpan adalah Bambang Sutrisno atau warga biasa, pulihkan ke role warga murni
            if (
              parsedUser?.role === 'warga' ||
              parsedUser?.username === 'bambang.sutrisno' ||
              parsedUser?.id === 'u-w-1' ||
              parsedUser?.resident_id === 'w-1' ||
              (parsedUser?.name && parsedUser.name.toLowerCase().includes('bambang sutrisno') && parsedUser.role !== 'admin')
            ) {
              parsedUser = {
                ...parsedUser,
                id: parsedUser?.id || 'u-w-1',
                username: parsedUser?.username || 'bambang.sutrisno',
                name: parsedUser?.name || 'Bambang Sutrisno (Warga Blok A-01)',
                role: 'warga',
                jabatan: 'warga',
                resident_id: parsedUser?.resident_id || 'w-1',
                rt_id: parsedUser?.rt_id || 'rt-01-01',
                rw_id: parsedUser?.rw_id || 'rw-01'
              }
              await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(parsedUser))
            } else if (parsedUser?.id === 'u-rt-01-01' || parsedUser?.username === 'rt01.rw01' || parsedUser?.username === 'rt') {
              parsedUser = {
                ...parsedUser,
                name: 'Bpk. Syahdan (Ketua RT 01 / RW 01)',
                role: 'rt',
                jabatan: 'rt',
                resident_id: null,
                rt_id: 'rt-01-01',
                rw_id: 'rw-01'
              }
              await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(parsedUser))
            }
            setCurrentUser(parsedUser)

            // Registrasi & sinkronisasi token push notification untuk pengguna aktif
            registerForPushNotificationsAsync().then((pushRes) => {
              if (pushRes.success && pushRes.token) {
                setExpoPushToken(pushRes.token)
                setNotificationPermissionStatus(pushRes.permissionStatus)
                syncPushTokenWithBackend(pushRes.token, parsedUser)
              } else {
                setNotificationPermissionStatus(pushRes.permissionStatus || 'denied')
              }
            }).catch(() => {})
          } catch (e) {
            console.warn('Gagal membaca savedUser:', e)
          }
        }

        // Baca cache token dan custom URL yang tersimpan
        const savedPushToken = await AsyncStorage.getItem(STORAGE_KEY_PUSH_TOKEN)
        if (savedPushToken) setExpoPushToken(savedPushToken)
        const savedApiUrl = await getLaravelApiUrl()
        if (savedApiUrl) setLaravelApiUrlState(savedApiUrl)

        // Background sync dari Supabase
        syncAllFromSupabase().then((res) => {
          if (res) {
            if (res.config) setConfig(res.config)
            if (res.jenisIuran?.length) setJenisIuran(res.jenisIuran)
            if (res.warga?.length) {
              const sanitizedW = res.warga.map((w) => {
                if (w.id === 'w-1' || (w.nama && w.nama.toLowerCase().includes('bambang sutrisno'))) {
                  return { ...w, jabatan: 'warga' }
                }
                return w
              })
              setWarga(sanitizedW)
            }
            if (res.tagihan?.length) {
              setTagihan((prev) => {
                const map = new Map()
                res.tagihan.forEach((t) => map.set(t.id, t))
                prev.forEach((t) => {
                  if (!map.has(t.id)) map.set(t.id, t)
                })
                return Array.from(map.values())
              })
            }
            if (res.kas?.length) setKas(res.kas)
            if (res.events?.length) setEvents(res.events)
            if (res.tagihanEvents?.length) setTagihanEvents(res.tagihanEvents)
            if (res.users?.length) setUsers(res.users)
            if (res.rts?.length) setRts(res.rts)
            if (res.rws?.length) setRws(res.rws)
            if (res.pengaduan?.length) setPengaduan(res.pengaduan)
            if (res.surat?.length) setSurat(res.surat)
            if (res.kontakDarurat?.length) setKontakDarurat(res.kontakDarurat)
            if (res.bankAccounts?.length) setBankAccounts(res.bankAccounts)
            if (res.qrisAccounts?.length) setQrisAccounts(res.qrisAccounts)
            if (res.notifications?.length) setNotifications(res.notifications)
            if (res.auditLogs?.length) setAuditLogs(res.auditLogs)
          }
        })
      } catch (err) {
        console.warn('Init error:', err)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  // Realtime Supabase listener (Debounced & Loop-Protected)
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return

    let debounceTimer = null

    const handleRealtimeChange = (payload) => {
      // Abaikan update config/heartbeat internal agar tidak terjadi cascade re-fetch
      if (payload?.table === STORAGE_KEYS.CONFIG) {
        return
      }

      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        refreshData()
      }, 1500)
    }

    const channel = supabase
      .channel('mobile_realtime_all')
      .on('postgres_changes', { event: '*', schema: 'public' }, handleRealtimeChange)
      .subscribe()

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer)
      supabase.removeChannel(channel)
    }
  }, [])

  const refreshData = async () => {
    if (refreshing) return
    setRefreshing(true)
    try {
      const res = await syncAllFromSupabase()
      if (res) {
        if (res.config) setConfig(res.config)
        if (res.jenisIuran?.length) setJenisIuran(res.jenisIuran)
        if (res.warga?.length) setWarga(res.warga)
        if (res.tagihan?.length) {
          setTagihan((prev) => {
            const map = new Map()
            res.tagihan.forEach((t) => map.set(t.id, t))
            prev.forEach((t) => {
              if (!map.has(t.id)) map.set(t.id, t)
            })
            return Array.from(map.values())
          })
        }
        if (res.kas?.length) setKas(res.kas)
        if (res.events?.length) setEvents(res.events)
        if (res.tagihanEvents?.length) setTagihanEvents(res.tagihanEvents)
        if (res.users?.length) setUsers(res.users)
        if (res.rts?.length) setRts(res.rts)
        if (res.pengaduan?.length) setPengaduan(res.pengaduan)
        if (res.surat?.length) setSurat(res.surat)
        if (res.kontakDarurat?.length) setKontakDarurat(res.kontakDarurat)
        if (res.bankAccounts?.length) setBankAccounts(res.bankAccounts)
        if (res.qrisAccounts?.length) setQrisAccounts(res.qrisAccounts)
        if (res.notifications?.length) setNotifications(res.notifications)
        if (res.auditLogs?.length) setAuditLogs(res.auditLogs)
      }
    } catch (e) {
      console.warn('Refresh error:', e)
    } finally {
      setRefreshing(false)
    }
  }

  // Auto-billing periodic evaluation registered after triggerManualBillingCatchUp

  // Auth Functions
  const login = async (usernameOrObj, maybePassword) => {
    let u = usernameOrObj
    let p = maybePassword
    if (typeof usernameOrObj === 'object' && usernameOrObj !== null) {
      u = usernameOrObj.username
      p = usernameOrObj.password
    }
    const res = await apiLogin({ username: u, password: p, users, adminAuth, residents: warga })
    if (res.success) {
      setCurrentUser(res.user)
      await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(res.user))

      // Daftarkan Expo Push Token dan sinkronkan ke Laravel API
      registerForPushNotificationsAsync().then((pushRes) => {
        if (pushRes.success && pushRes.token) {
          setExpoPushToken(pushRes.token)
          setNotificationPermissionStatus(pushRes.permissionStatus)
          syncPushTokenWithBackend(pushRes.token, res.user)
        } else {
          setNotificationPermissionStatus(pushRes.permissionStatus || 'denied')
        }
      }).catch(() => {})
    }
    return res
  }

  const logout = async () => {
    if (currentUser) {
      await removePushTokenFromBackend(currentUser)
    }
    setCurrentUser(null)
    setActiveRoleOverride(null)
    setActiveMode('jabatan')
    await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_USER)
  }

  // Current entity lookups: Warga maupun RT mendapatkan RT dan RW wilayahnya
  const currentWarga = currentUser?.resident_id
    ? (warga.find((w) => w.id === currentUser.resident_id) || null)
    : (warga.find((w) => (w.nama || '').toLowerCase() === (currentUser?.name || '').toLowerCase()) || null)

  // Role & Jabatan info helpers
  const rawRole = currentUser?.role || 'warga'
  const rawJabatan = currentUser?.jabatan || ''
  const residentJabatan = currentWarga?.jabatan || ''

  const VALID_JABATAN = ['bendahara', 'pengurus', 'rt', 'rw', 'admin']

  // Cek apakah user memiliki jabatan struktural resmi
  const detectedJabatan = (
    (VALID_JABATAN.includes(rawJabatan) && rawJabatan) ||
    (VALID_JABATAN.includes(rawRole) && rawRole) ||
    (VALID_JABATAN.includes(residentJabatan) && residentJabatan) ||
    null
  )

  const hasJabatan = Boolean(currentUser && detectedJabatan)
  const officialJabatan = detectedJabatan || 'warga'
  const userJabatan = officialJabatan

  // isLeadershipUser: Akun resmi pimpinan wilayah (Ketua RT / Ketua RW) atau Admin IT
  const isRTUser = officialJabatan === 'rt'
  const isRWUser = officialJabatan === 'rw'
  const isLeadershipUser = isRTUser || isRWUser || officialJabatan === 'admin'
  const isOfficial = hasJabatan && ['rt', 'rw', 'bendahara', 'pengurus'].includes(officialJabatan)

  // hasDualRole aktif HANYA jika user memiliki jabatan/peran kepengurusan
  const hasDualRole = hasJabatan

  // Mode View Switcher:
  // Jika punya jabatan, user bisa beralih antara tampilan Jabatan (officialJabatan) dan tampilan Warga ('warga')
  // Jika tidak punya jabatan (warga biasa), tampilan selalu 'warga'
  const effectiveRole = hasJabatan
    ? (activeRoleOverride || (activeMode === 'warga' ? 'warga' : officialJabatan))
    : 'warga'

  const isWarga = effectiveRole === 'warga'
  const isRT = effectiveRole === 'rt'
  const isRW = effectiveRole === 'rw'
  const isBendahara = effectiveRole === 'bendahara'
  const isPengurus = effectiveRole === 'pengurus'
  const isAdmin = effectiveRole === 'admin'
  const isSuperAdmin = isAdmin && !currentUser?.rw_id
  const isAdminLoggedIn = !isWarga && (isAdmin || isRW || isRT || isBendahara || isPengurus)

  const toggleActiveMode = () => {
    if (!hasJabatan) return
    setActiveRoleOverride(null)
    setActiveMode((prev) => (prev === 'jabatan' ? 'warga' : 'jabatan'))
  }

  const switchActiveRole = (targetRole) => {
    if (!hasJabatan) return
    if (targetRole === 'warga') {
      setActiveMode('warga')
      setActiveRoleOverride('warga')
    } else {
      setActiveMode('jabatan')
      setActiveRoleOverride(officialJabatan)
    }
  }

  const switchDemoAccount = async (targetUser) => {
    if (!targetUser) return
    setCurrentUser(targetUser)
    setActiveMode('jabatan')
    setActiveRoleOverride(null)
    await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(targetUser))
  }

  const jabatanLabel = getJabatanLabel(userJabatan)
  const jabatanShortLabel = getJabatanShortLabel(userJabatan)
  const jabatanTheme = getJabatanTheme(userJabatan)

  // Current entity lookups: Warga maupun RT mendapatkan RT dan RW wilayahnya
  const effectiveUser = currentUser ? { ...currentUser, role: effectiveRole } : null

  const userRtId = currentUser?.rt_id || currentWarga?.rt_id || 'rt-01-01'
  const currentRT = rts.find((r) => r.id === userRtId) || rts[0] || null
  const userRwId = currentUser?.rw_id || currentWarga?.rw_id || currentRT?.rw_id || 'rw-01'
  const currentRW = rws.find((r) => r.id === userRwId) || rws[0] || null
  const scopedRts = isAdmin
    ? rts
    : isRT
    ? (currentRT ? [currentRT] : rts.filter((r) => r.id === userRtId))
    : isRW
    ? rts.filter((r) => r.rw_id === userRwId)
    : currentUser?.rw_id
    ? rts.filter((r) => r.rw_id === currentUser.rw_id)
    : rts

  // Role-scoped data
  const scopedWarga = filterResidentsByRole(warga, effectiveUser, rts)
  const scopedTagihan = filterBillsByRole(tagihan, warga, effectiveUser, rts)
  const scopedKas = filterKasByRole(kas, effectiveUser)
  const scopedEvents = filterEventsByRole(events, effectiveUser)
  const scopedKontakDarurat = filterKontakDaruratByRole(kontakDarurat, effectiveUser, currentWarga)

  // Scope Surat: Warga hanya surat miliknya, RT hanya tujuan RT/both di wilayahnya, RW hanya tujuan RW/both
  const scopedSurat = isWarga
    ? surat.filter((s) => s.wargaId === (currentWarga?.id || currentUser?.resident_id || currentUser?.id))
    : isRT
    ? surat.filter((s) => (s.rt_id === (currentRT?.id || currentUser?.rt_id)) && (s.tujuan === 'rt' || s.tujuan === 'both' || !s.tujuan))
    : isRW
    ? surat.filter((s) => (s.tujuan === 'rw' || s.tujuan === 'both'))
    : surat

  // Scope Pengaduan: Warga melihat aduannya, RT tujuan RT/both di wilayahnya, RW tujuan RW/both
  const scopedPengaduan = isWarga
    ? pengaduan.filter((p) => p.wargaId === (currentWarga?.id || currentUser?.resident_id || currentUser?.id))
    : isRT
    ? pengaduan.filter((p) => (p.rt_id === (currentRT?.id || currentUser?.rt_id)) && (p.tujuan === 'rt' || p.tujuan === 'both' || !p.tujuan))
    : isRW
    ? pengaduan.filter((p) => (p.tujuan === 'rw' || p.tujuan === 'both'))
    : pengaduan

  // Dynamic Unread Badges Calculation (§1 & §5)
  const isSuratUnread = (s) => {
    if (!s) return false
    if (isWarga) {
      if (s.readStatus && typeof s.readStatus.warga === 'boolean') {
        return s.readStatus.warga === false
      }
      return (s.balasan?.length > 0 || s.status === 'Selesai' || s.status === 'Diproses') && !s.readBy?.includes('warga')
    }
    if (isRT) {
      if (s.tujuan === 'rw') return false
      if (s.readStatus && typeof s.readStatus.rt === 'boolean') {
        return s.readStatus.rt === false
      }
      return !s.readBy?.includes('rt')
    }
    if (isRW) {
      if (s.tujuan === 'rt') return false
      if (s.readStatus && typeof s.readStatus.rw === 'boolean') {
        return s.readStatus.rw === false
      }
      return !s.readBy?.includes('rw')
    }
    if (isAdmin || isPengurus) {
      if (s.readStatus && typeof s.readStatus.admin === 'boolean') {
        return s.readStatus.admin === false
      }
      return !s.readBy?.includes('admin')
    }
    return false
  }

  const isPengaduanUnread = (p) => {
    if (!p) return false
    if (isWarga) {
      if (p.readStatus && typeof p.readStatus.warga === 'boolean') {
        return p.readStatus.warga === false
      }
      return Boolean(p.tanggapan || p.tanggapanList?.length > 0) && !p.readBy?.includes('warga')
    }
    if (isRT) {
      if (p.tujuan === 'rw') return false
      if (p.readStatus && typeof p.readStatus.rt === 'boolean') {
        return p.readStatus.rt === false
      }
      return !p.readBy?.includes('rt')
    }
    if (isRW) {
      if (p.tujuan === 'rt') return false
      if (p.readStatus && typeof p.readStatus.rw === 'boolean') {
        return p.readStatus.rw === false
      }
      return !p.readBy?.includes('rw')
    }
    if (isAdmin || isPengurus) {
      if (p.readStatus && typeof p.readStatus.admin === 'boolean') {
        return p.readStatus.admin === false
      }
      return !p.readBy?.includes('admin')
    }
    return false
  }

  const suratUnreadCount = (scopedSurat || []).filter(isSuratUnread).length
  const aduanUnreadCount = (scopedPengaduan || []).filter(isPengaduanUnread).length
  const totalLayananUnreadCount = suratUnreadCount + aduanUnreadCount

  // Tagihan Operations
  const generateTagihanMassal = async (bulan, tahun, targetRtId = null, scope = 'ALL', selectedPosIds = null) => {
    const b = Number(bulan)
    const t = Number(tahun)

    const isRtUser = currentUser?.role === 'rt'
    const finalRtId = isRtUser ? (currentUser?.rt_id || 'rt-01-01') : targetRtId
    const finalScope = isRtUser ? 'RT' : scope

    const targetWargaList = warga.filter((w) => {
      if (w.aktif === false) return false
      // RT user strictly only bills their own RT
      if (isRtUser) return w.rt_id === finalRtId
      // RW user with rw_id: strictly only bills warga in their RW
      if (currentUser?.rw_id && w.rw_id && w.rw_id !== currentUser.rw_id) return false
      // RW user: if targetRtId specified (not null / not 'ALL'), only bill that RT
      if (finalRtId && finalRtId !== 'ALL') return w.rt_id === finalRtId
      return true
    })

    let countCreated = 0
    const newInvoices = []

    targetWargaList.forEach((w) => {
      const rtObj = rts.find((r) => r.id === w.rt_id) || {}
      
      // Determine scopes to create: if RT user, strictly ['RT']!
      const scopesToGenerate = isRtUser
        ? ['RT']
        : finalScope === 'ALL'
        ? ['RT', 'RW']
        : [finalScope]

      scopesToGenerate.forEach((sc) => {
        let activeIuran = jenisIuran.filter(
          (j) => j.aktif !== false && (j.payment_scope === sc || (!j.payment_scope && sc === 'RT'))
        )

        // Filter specific pos if selected
        if (Array.isArray(selectedPosIds) && selectedPosIds.length > 0) {
          activeIuran = activeIuran.filter((j) => selectedPosIds.includes(j.id))
        }

        // Fallback default iuran if none configured for this scope
        if (activeIuran.length === 0 && (!selectedPosIds || selectedPosIds.length === 0)) {
          if (sc === 'RT') {
            activeIuran = [{ nama: 'Iuran Pengelolaan Lingkungan (RT)', nominal: 120000 }]
          } else if (sc === 'RW') {
            activeIuran = [{ nama: 'Iuran Pembangunan & Fasum RW', nominal: 40000 }]
          }
        }

        if (activeIuran.length === 0) return

        const totalTarif = activeIuran.reduce((acc, curr) => acc + (Number(curr.nominal) || 0), 0)
        const kodeUnikWarga = getKodeUnikWarga(w)
        const angkaKode = parseInt(getAngkaKodeUnik(w), 10) || 0
        const totalTarifWithKode = calculateTotalWithKodeUnik(totalTarif, w)
        const rincian = [
          ...activeIuran.map((j) => ({ nama: j.nama, nominal: Number(j.nominal) || 0 })),
          { nama: `Kode Unik Warga (${kodeUnikWarga})`, nominal: angkaKode }
        ]

        const exists = tagihan.some(
          (tag) =>
            tag.wargaId === w.id &&
            Number(tag.bulan) === b &&
            Number(tag.tahun) === t &&
            (tag.payment_scope === sc || (!tag.payment_scope && sc === 'RT'))
        )
        const alreadyInBatch = newInvoices.some(
          (tag) =>
            tag.wargaId === w.id &&
            Number(tag.bulan) === b &&
            Number(tag.tahun) === t &&
            (tag.payment_scope === sc || (!tag.payment_scope && sc === 'RT'))
        )

        if (!exists && !alreadyInBatch) {
          const invId = `tag-${t}-${String(b).padStart(2, '0')}-${sc.toLowerCase()}-${w.id}`
          const rwClean = (rtObj?.rw && !rtObj.rw.includes('-')) ? rtObj.rw : (config?.rw && !config.rw.includes('-') ? config.rw : 'RW 01')
          const ownerId = sc === 'RW' ? (w.rw_id || rtObj?.rw_id || 'rw-01') : w.rt_id
          const ownerLabel = sc === 'RW' ? rwClean : (rtObj?.name || 'RT 01')

          newInvoices.push({
            id: invId,
            wargaId: w.id,
            rt_id: w.rt_id,
            namaWarga: w.nama,
            blok: w.blok,
            noRumah: w.noRumah,
            kodeUnik: kodeUnikWarga,
            bulan: b,
            tahun: t,
            total: totalTarifWithKode,
            rincian: rincian,
            payment_scope: sc,
            target_payment_owner: ownerId,
            pembayaran_kepada: ownerLabel,
            status: 'Belum Bayar',
            tanggalBayar: null,
            metodeBayar: null,
            noKwitansi: null,
            catatan: '',
            submissions: [],
            alasanPenolakan: null,
            catatanPenolakan: null
          })
          countCreated++
        }
      })
    })

    if (countCreated === 0) {
      return 0
    }

    const updated = [...newInvoices, ...tagihan]
    setTagihan(updated)
    await saveStorageItem(STORAGE_KEYS.TAGIHAN, updated)

    // Buat notifikasi ke seluruh warga yang diterbitkan tagihan
    const massNotifs = newInvoices.map((inv) => ({
      id: `notif-${inv.id}`,
      userId: `u-${inv.wargaId}`,
      residentId: inv.wargaId,
      title: `Tagihan IPL ${inv.payment_scope} Periode ${b}/${t} 📬`,
      message: `Tagihan ${inv.pembayaran_kepada} sebesar Rp ${inv.total.toLocaleString('id-ID')} telah diterbitkan. Harap bayar sebelum tanggal 20.`,
      type: 'tagihan',
      tagihanId: inv.id,
      screen: 'Tagihan',
      read: false,
      created_at: new Date().toISOString()
    }))
    const updatedNotifs = [...massNotifs, ...notifications]
    setNotifications(updatedNotifs)
    await saveStorageItem(STORAGE_KEYS.NOTIFICATIONS, updatedNotifs)

    // Jika user aktif saat ini termasuk yang ditagih, kirim notifikasi lokal
    const myBill = newInvoices.find((inv) => inv.wargaId === currentUser?.resident_id || inv.wargaId === currentWarga?.id)
    if (myBill) {
      sendLocalNotification({
        title: `Tagihan IPL ${myBill.payment_scope} Periode ${b}/${t} 📬`,
        body: `Tagihan Anda sebesar Rp ${myBill.total.toLocaleString('id-ID')} telah diterbitkan.`,
        data: { type: 'tagihan', targetId: myBill.id, screen: 'Tagihan' },
        channelId: 'ipl-tagihan'
      }).catch(() => {})
    }

    // Log Audit
    await addAuditLog({
      action: 'GENERATE_TAGIHAN_MASSAL',
      entity: 'tagihan',
      entityId: `massal-${t}-${b}`,
      details: `Menerbitkan ${countCreated} tagihan iuran massal periode ${b}/${t} (Scope: ${scope})`
    })

    return countCreated
  }

  const bayarTagihan = async (tagihanId, pembayaranData) => {
    const today = new Date().toISOString().slice(0, 10)
    const targetTagihan = tagihan.find((t) => t.id === tagihanId)
    if (!targetTagihan) return { success: false, message: 'Tagihan tidak ditemukan' }

    const targetWarga = warga.find((w) => w.id === targetTagihan.wargaId) || currentWarga || {}

    const newSubIndex = (targetTagihan.submissions?.length || 0) + 1
    const proofUrl = pembayaranData.buktiBayar || pembayaranData.buktiTransferUrl || pembayaranData.buktiFoto || ''
    const proofName = pembayaranData.fileName || `proof_${Date.now()}.jpg`
    const proofSize = pembayaranData.fileSize || '1.24 MB'

    const newSubmission = {
      id: `sub-${Date.now()}-${newSubIndex}`,
      submission_index: newSubIndex,
      tanggal: pembayaranData.tanggalBayar || today,
      nominal: Number(pembayaranData.nominal) || targetTagihan.total,
      metode: pembayaranData.metode || 'Transfer Bank',
      bank_account_id: pembayaranData.bankAccountId || null,
      qris_account_id: pembayaranData.qrisAccountId || null,
      bukti_url: proofUrl,
      proof_image: proofUrl,
      proof_original_name: proofName,
      proof_size: proofSize,
      uploaded_at: new Date().toISOString(),
      catatan: pembayaranData.keterangan || pembayaranData.catatanWarga || '',
      status: 'Menunggu Verifikasi',
      created_at: new Date().toISOString()
    }

    const updated = tagihan.map((t) => {
      if (t.id === tagihanId) {
        const prevSubs = Array.isArray(t.submissions) ? t.submissions : []
        return {
          ...t,
          status: 'Menunggu Verifikasi',
          metode: pembayaranData.metode || 'Transfer Bank',
          metodeBayar: pembayaranData.metode || 'Transfer Bank',
          tglBayar: new Date().toISOString(),
          tanggalBayar: new Date().toISOString(),
          tanggalUploadBukti: new Date().toISOString(),
          uploaded_at: new Date().toISOString(),
          buktiBayar: proofUrl,
          buktiTransferUrl: proofUrl,
          buktiFoto: proofUrl,
          proof_image: proofUrl,
          proof_original_name: proofName,
          proof_size: proofSize,
          keteranganBayar: newSubmission.catatan,
          catatanWarga: newSubmission.catatan,
          alasanPenolakan: null,
          catatanPenolakan: null,
          rejection_reason: null,
          submissions: [...prevSubs, newSubmission]
        }
      }
      return t
    })

    setTagihan(updated)
    await saveStorageItem(STORAGE_KEYS.TAGIHAN, updated)

    // Tambahkan Notifikasi ke Warga
    await addNotification({
      userId: currentUser?.id || `u-${targetTagihan.wargaId}`,
      residentId: targetTagihan.wargaId,
      title: 'Bukti Pembayaran Terkirim 📤',
      message: `Bukti pembayaran untuk ${targetTagihan.pembayaran_kepada || 'IPL'} periode ${targetTagihan.bulan}/${targetTagihan.tahun} berhasil dikirim dan sedang diverifikasi.`,
      type: 'payment_submitted',
      tagihanId: tagihanId,
      screen: 'Tagihan'
    })

    // Tambahkan Notifikasi ke Pengurus (Bendahara, RT setempat, Admin)
    await addNotification({
      targetRole: 'bendahara',
      targetRtId: targetWarga.rt_id || currentUser?.rt_id,
      title: 'Bukti Pembayaran Baru Masuk 💳',
      message: `${targetWarga.nama || currentUser?.name || 'Warga'} (Blok ${targetWarga.blok || '-'}/${targetWarga.noRumah || '-'}) mengirim bukti bayar ${targetTagihan.pembayaran_kepada} sebesar Rp ${(newSubmission.nominal || targetTagihan.total).toLocaleString('id-ID')}. Butuh verifikasi.`,
      type: 'payment_submitted',
      tagihanId: tagihanId,
      screen: 'Tagihan'
    })

    // Log Audit
    await addAuditLog({
      action: 'SUBMIT_PAYMENT_PROOF',
      entity: 'tagihan',
      entityId: tagihanId,
      details: `Warga ${targetWarga.nama || currentUser?.name} mengunggah bukti pembayaran Submission #${newSubIndex} (${newSubmission.metode})`
    })

    return { success: true, message: 'Bukti pembayaran berhasil dikirim dan sedang menunggu verifikasi.' }
  }

  const verifikasiTagihan = async (tagihanId, statusAction, alasanTolak = '', catatanTolak = '') => {
    const targetTagihan = tagihan.find((t) => t.id === tagihanId)
    if (!targetTagihan) return { success: false }

    const targetWarga = warga.find((w) => w.id === targetTagihan.wargaId) || {}
    const isPaid = statusAction === 'Lunas'
    const today = new Date().toISOString().slice(0, 10)
    const randomSeq = Math.floor(100000 + Math.random() * 900000)
    const verifierName = currentUser?.name || 'Pengurus'
    const verifiedTimestamp = new Date().toISOString()
    
    // Scoped Unique Receipt Number: RT01-20260925-000123 / RW15-20260925-000123
    const scopeCode = targetTagihan.payment_scope === 'RW'
      ? 'RW15'
      : (targetWarga.rt_id || currentUser?.rt_id || 'rt-1').replace('rt-', 'RT0').toUpperCase()
    const noKwitansi = isPaid
      ? `${scopeCode}-${today.replace(/-/g, '')}-${randomSeq}`
      : null

    const updated = tagihan.map((t) => {
      if (t.id === tagihanId) {
        const subs = Array.isArray(t.submissions) ? [...t.submissions] : []
        if (subs.length > 0) {
          const lastSub = { ...subs[subs.length - 1] }
          lastSub.status = isPaid ? 'Lunas' : 'Ditolak'
          lastSub.verifier = verifierName
          lastSub.verified_by = verifierName
          lastSub.verified_at = verifiedTimestamp
          if (!isPaid) {
            lastSub.alasan_penolakan = alasanTolak
            lastSub.catatan_penolakan = catatanTolak
            lastSub.rejection_reason = alasanTolak
          }
          subs[subs.length - 1] = lastSub
        }

        return {
          ...t,
          status: isPaid ? 'Lunas' : 'Perlu Diperbaiki',
          verifikator: verifierName,
          verified_by: verifierName,
          tglVerifikasi: verifiedTimestamp,
          verified_at: verifiedTimestamp,
          tanggalBayar: isPaid ? (t.tanggalBayar || today) : null,
          tglBayar: isPaid ? (t.tglBayar || today) : null,
          metodeBayar: isPaid ? (t.metode || t.metodeBayar || 'Transfer Bank') : null,
          noKwitansi: isPaid ? noKwitansi : null,
          alasanPenolakan: isPaid ? null : (alasanTolak || 'Bukti transfer tidak sesuai.'),
          catatanPenolakan: isPaid ? null : catatanTolak,
          rejection_reason: isPaid ? null : (alasanTolak || 'Bukti transfer tidak sesuai.'),
          submissions: subs
        }
      }
      return t
    })

    // Sinkronisasi Kas Otomatis (Idempotent: cegah pencatatan ganda ke buku kas)
    let updatedKas = kas
    if (isPaid) {
      const isRw = targetTagihan.payment_scope === 'RW'
      const newKasEntry = {
        id: `kas-auto-${Date.now()}`,
        tanggal: today,
        tipe: 'Masuk',
        kategori: isRw ? 'Iuran RW' : 'Iuran RT',
        deskripsi: `${targetTagihan.pembayaran_kepada || 'IPL'} - ${targetWarga.nama || 'Warga'} (${targetWarga.blok || '-'}/${targetWarga.noRumah || '-'}) bln ${targetTagihan.bulan}/${targetTagihan.tahun}`,
        keterangan: `Kwitansi: ${noKwitansi}`,
        nominal: targetTagihan.total,
        tagihanId: tagihanId,
        scope: isRw ? 'rw' : 'rt',
        rt_id: isRw ? null : (targetWarga.rt_id || currentUser?.rt_id || 'rt-1'),
        pj: currentUser?.name || (isRw ? 'Bendahara RW' : 'Bendahara RT')
      }
      updatedKas = [newKasEntry, ...kas.filter((k) => k.tagihanId !== tagihanId)]
      setKas(updatedKas)
      await saveStorageItem(STORAGE_KEYS.KAS, updatedKas)
    } else {
      updatedKas = kas.filter((k) => k.tagihanId !== tagihanId)
      setKas(updatedKas)
      await saveStorageItem(STORAGE_KEYS.KAS, updatedKas)
    }

    setTagihan(updated)
    await saveStorageItem(STORAGE_KEYS.TAGIHAN, updated)

    // Kirim Notifikasi Feedback ke Warga
    if (isPaid) {
      await addNotification({
        userId: `u-${targetTagihan.wargaId}`,
        residentId: targetTagihan.wargaId,
        title: 'Pembayaran IPL Terverifikasi ✅',
        message: `Pembayaran ${targetTagihan.pembayaran_kepada || 'IPL'} periode ${targetTagihan.bulan}/${targetTagihan.tahun} sebesar Rp ${targetTagihan.total.toLocaleString('id-ID')} telah disetujui (No: ${noKwitansi}).`,
        type: 'payment_verified',
        tagihanId: tagihanId
      })

      await addAuditLog({
        action: 'VERIFY_PAYMENT_SUCCESS',
        entity: 'tagihan',
        entityId: tagihanId,
        details: `Menyetujui pembayaran ${targetTagihan.pembayaran_kepada} warga ${targetWarga.nama} (Lunas: ${noKwitansi})`
      })
    } else {
      await addNotification({
        userId: `u-${targetTagihan.wargaId}`,
        residentId: targetTagihan.wargaId,
        title: '🔴 Pembayaran Perlu Diperbaiki',
        message: `Pembayaran ${targetTagihan.pembayaran_kepada || 'IPL'} periode ${targetTagihan.bulan}/${targetTagihan.tahun} belum dapat diverifikasi.\n\nAlasan: ${alasanTolak}${catatanTolak ? ` (${catatanTolak})` : ''}.\n\nSilakan periksa kembali dan upload bukti pembayaran yang benar.`,
        type: 'payment_rejected',
        tagihanId: tagihanId
      })

      await addAuditLog({
        action: 'VERIFY_PAYMENT_REJECTED',
        entity: 'tagihan',
        entityId: tagihanId,
        details: `Menolak pembayaran ${targetTagihan.pembayaran_kepada} warga ${targetWarga.nama}. Alasan: ${alasanTolak}`
      })
    }

    return { success: true }
  }

  const bayarTagihanOtomatisMoota = async (tagihanId, mutationData = null) => {
    const targetTagihan = tagihan.find((t) => t.id === tagihanId)
    if (!targetTagihan) return { success: false, message: 'Tagihan tidak ditemukan' }

    const targetWarga = warga.find((w) => w.id === targetTagihan.wargaId) || {}
    const exactNominal = calculateTotalWithKodeUnik(targetTagihan.total, targetWarga)
    const today = new Date().toISOString().slice(0, 10)
    const randomSeq = Math.floor(100000 + Math.random() * 900000)
    const noKwitansi = `MOOTA-${today.replace(/-/g, '')}-${randomSeq}`
    const verifiedTimestamp = new Date().toISOString()
    const isRw = targetTagihan.payment_scope === 'RW'

    const updated = tagihan.map((t) => {
      if (t.id === tagihanId) {
        return {
          ...t,
          status: 'Lunas',
          verifikator: 'Moota Auto-Verify (Sandbox)',
          verified_by: 'Moota Auto-Verify (Sandbox)',
          tglVerifikasi: verifiedTimestamp,
          verified_at: verifiedTimestamp,
          tanggalBayar: verifiedTimestamp,
          tglBayar: verifiedTimestamp,
          metodeBayar: 'Transfer Bank (Moota Auto)',
          metode: 'Transfer Bank (Moota Auto)',
          noKwitansi: noKwitansi,
          total_dibayar: exactNominal,
          moota_mutation_id: mutationData?.mutation_id || mutationData?.id || null,
          moota_bank_id: mutationData?.bank_id || 'Lagzqp0Pk42',
          keteranganBayar: mutationData?.description || 'Transfer terverifikasi otomatis oleh Moota Sandbox'
        }
      }
      return t
    })

    // Tambah kas otomatis
    const newKasEntry = {
      id: `kas-moota-${Date.now()}`,
      tanggal: today,
      tipe: 'Masuk',
      kategori: isRw ? 'Iuran RW' : 'Iuran RT',
      deskripsi: `${targetTagihan.pembayaran_kepada || 'IPL'} - ${targetWarga.nama || 'Warga'} (${targetWarga.blok || '-'}/${targetWarga.noRumah || '-'}) bln ${targetTagihan.bulan}/${targetTagihan.tahun}`,
      keterangan: `Kwitansi: ${noKwitansi} (Moota Auto Sandbox)`,
      nominal: targetTagihan.total,
      tagihanId: tagihanId,
      scope: isRw ? 'rw' : 'rt',
      rt_id: isRw ? null : (targetWarga.rt_id || currentUser?.rt_id || 'rt-1'),
      pj: 'Sistem Moota Sandbox'
    }
    const updatedKas = [newKasEntry, ...kas.filter((k) => k.tagihanId !== tagihanId)]
    setKas(updatedKas)
    await saveStorageItem(STORAGE_KEYS.KAS, updatedKas)

    setTagihan(updated)
    await saveStorageItem(STORAGE_KEYS.TAGIHAN, updated)

    // Simpan ke log mutasi Moota (Audit Trail Staging)
    try {
      const mutId = `mut-${mutationData?.mutation_id || mutationData?.id || Date.now()}`
      const mutationRecord = {
        id: mutId,
        mutation_id: mutationData?.mutation_id || mutationData?.id || `mut-${Date.now()}`,
        bank_id: mutationData?.bank_id || 'Lagzqp0Pk42',
        account_number: '090908080777',
        amount: exactNominal,
        type: 'CR',
        description: mutationData?.description || `Transfer Bank IPL Warga ${targetWarga.nama || ''}`,
        status: 'matched',
        matched_tagihan_id: tagihanId,
        resident_id: targetTagihan.wargaId,
        resident_nama: targetWarga.nama || 'Warga',
        no_kwitansi: noKwitansi,
        created_at: verifiedTimestamp
      }
      const existingMutations = (await getStorageItem(STORAGE_KEYS.MOOTA_MUTATIONS, [])) || []
      const updatedMutations = [mutationRecord, ...existingMutations.filter((m) => m.id !== mutId)]
      await saveStorageItem(STORAGE_KEYS.MOOTA_MUTATIONS, updatedMutations)
    } catch (mutSaveErr) {
      console.warn('Gagal mencatat mutasi ke moota log:', mutSaveErr)
    }

    await addNotification({
      userId: currentUser?.id || `u-${targetTagihan.wargaId}`,
      residentId: targetTagihan.wargaId,
      title: 'Pembayaran IPL Terverifikasi Otomatis ⚡',
      message: `Pembayaran ${targetTagihan.pembayaran_kepada || 'IPL'} sebesar Rp ${exactNominal.toLocaleString('id-ID')} telah BERHASIL diverifikasi secara otomatis oleh sistem Moota! No Kwitansi: ${noKwitansi}.`,
      type: 'payment_verified',
      tagihanId: tagihanId
    })

    await addAuditLog({
      action: 'MOOTA_AUTO_VERIFY_SUCCESS',
      entity: 'tagihan',
      entityId: tagihanId,
      details: `Pembayaran ${targetTagihan.pembayaran_kepada} warga ${targetWarga.nama} terverifikasi otomatis via Moota Sandbox (Rp ${exactNominal.toLocaleString('id-ID')})`
    })

    return { success: true, message: 'Pembayaran berhasil diverifikasi secara otomatis oleh Moota!', noKwitansi }
  }

  // Warga Operations
  const tambahWarga = async (newWargaData) => {
    const isPublicRegistration = !currentUser || currentUser?.role === 'warga'
    const newId = `w-${Date.now()}`
    const targetRtId = newWargaData.rt_id !== undefined ? newWargaData.rt_id : (currentUser?.rt_id || 'rt-1')
    const targetRole = newWargaData.role || 'warga'
    const targetJabatan = newWargaData.jabatan || targetRole
    const targetRwId = newWargaData.rw_id !== undefined ? newWargaData.rw_id : (rts.find((r) => r.id === targetRtId)?.rw_id || 'rw-01')

    const item = {
      id: newId,
      rt_id: targetRtId,
      rw_id: targetRwId,
      role: targetRole,
      jabatan: targetJabatan,
      kodeUnik: newWargaData.kodeUnik ? getKodeUnikLengkap({ kodeUnik: newWargaData.kodeUnik }) : generateNextKodeUnik(warga, 'WR'),
      nama: newWargaData.nama,
      nik: newWargaData.nik || '',
      noKk: newWargaData.noKk || '',
      blok: (newWargaData.blok || 'A').toUpperCase(),
      noRumah: newWargaData.noRumah || '',
      noHp: newWargaData.noHp || '',
      statusHuni: newWargaData.statusHuni || 'Tetap',
      statusKepemilikan: newWargaData.statusKepemilikan || 'Milik Sendiri',
      jumlahJiwa: Number(newWargaData.jumlahJiwa) || 1,
      pekerjaan: newWargaData.pekerjaan || '',
      statusApproval: isPublicRegistration ? 'Menunggu Verifikasi' : 'Disetujui',
      aktif: !isPublicRegistration,
      created_at: new Date().toISOString()
    }

    const updated = [item, ...warga]
    setWarga(updated)
    await saveStorageItem(STORAGE_KEYS.WARGA, updated)

    // Jika membuat akun login portal warga
    if (newWargaData.createAccount && newWargaData.username && newWargaData.password) {
      const cleanUser = newWargaData.username.trim().toLowerCase()
      const passwordHash = await hashPassword(newWargaData.password.trim())

      const newUser = {
        id: `u-${Date.now()}`,
        username: cleanUser,
        aliases: [cleanUser, cleanUser.replace(/\s+/g, '.')],
        password_hash: passwordHash,
        name: newWargaData.nama,
        phone: newWargaData.noHp || '',
        role: targetRole,
        jabatan: targetJabatan,
        resident_id: newId,
        rt_id: targetRtId,
        rw_id: targetRwId,
        status: isPublicRegistration ? 'pending_approval' : 'active',
        created_at: new Date().toISOString()
      }

      const updatedUsers = [newUser, ...users]
      setUsers(updatedUsers)
      await saveStorageItem(STORAGE_KEYS.USERS, updatedUsers)
    }

    if (isPublicRegistration) {
      await addNotification({
        title: 'Pendaftaran Warga Baru',
        message: `${newWargaData.nama} (Blok ${item.blok}/${item.noRumah}) mendaftar dan menunggu verifikasi RT.`,
        type: 'REGISTRATION_PENDING',
        targetRole: 'rt',
        targetRtId: targetRtId,
        data: { wargaId: newId }
      })
    }

    return {
      success: true,
      warga: item,
      isPendingApproval: isPublicRegistration
    }
  }

  const verifikasiWargaBaru = async (wargaId, status, alasanPenolakan = '') => {
    const isApprove = status === 'Disetujui' || status === 'ACC' || status === 'active'
    const targetWarga = warga.find((w) => w.id === wargaId)
    if (!targetWarga) return { success: false, message: 'Data warga tidak ditemukan' }

    // 1. Update status approval warga
    const updatedWargaList = warga.map((w) => {
      if (w.id === wargaId) {
        return {
          ...w,
          statusApproval: isApprove ? 'Disetujui' : 'Ditolak',
          aktif: isApprove,
          alasanPenolakan: isApprove ? null : (alasanPenolakan || 'Ditolak oleh pengurus RT.')
        }
      }
      return w
    })
    setWarga(updatedWargaList)
    await saveStorageItem(STORAGE_KEYS.WARGA, updatedWargaList)

    // 2. Update linked user account status
    const updatedUsers = users.map((u) => {
      if (u.resident_id === wargaId || (u.username && u.username.toLowerCase() === targetWarga.nama.toLowerCase().replace(/\s+/g, '.'))) {
        return {
          ...u,
          status: isApprove ? 'active' : 'ditolak'
        }
      }
      return u
    })
    setUsers(updatedUsers)
    await saveStorageItem(STORAGE_KEYS.USERS, updatedUsers)

    // 3. Log Audit
    await addAuditLog({
      action: isApprove ? 'APPROVE_WARGA' : 'REJECT_WARGA',
      entity: 'warga',
      entityId: wargaId,
      details: `${isApprove ? 'Menyetujui' : 'Menolak'} pendaftaran warga ${targetWarga.nama} (Blok ${targetWarga.blok}/${targetWarga.noRumah})`
    })

    // 4. Kirim notifikasi konfirmasi ke akun warga
    await addNotification({
      userId: `u-${targetWarga.id}`,
      residentId: targetWarga.id,
      title: isApprove ? 'Akun Warga Telah Disetujui ✅' : 'Pendaftaran Warga Ditolak ❌',
      message: isApprove
        ? `Selamat datang ${targetWarga.nama}! Pendaftaran akun warga Anda di Blok ${targetWarga.blok}/${targetWarga.noRumah} telah disetujui pengurus.`
        : `Mohon maaf, pendaftaran akun warga atas nama ${targetWarga.nama} ditolak. Alasan: ${alasanPenolakan || 'Data belum sesuai'}.`,
      type: isApprove ? 'registration_approved' : 'registration_rejected',
      screen: 'Profile'
    })

    return { success: true }
  }

  const hapusWarga = async (wargaId) => {
    const updated = warga.filter((w) => w.id !== wargaId)
    setWarga(updated)
    await saveStorageItem(STORAGE_KEYS.WARGA, updated)
    await deleteFromSupabase(STORAGE_KEYS.WARGA, wargaId)
    return { success: true }
  }

  const updateCurrentUser = async (updatedFields) => {
    if (!currentUser) return { success: false }
    const updated = { ...currentUser, ...updatedFields }
    setCurrentUser(updated)
    await saveStorageItem(STORAGE_KEYS.CURRENT_USER, updated)
    return { success: true, user: updated }
  }

  const updateWarga = async (wargaId, updatedFields) => {
    const updated = warga.map((w) =>
      w.id === wargaId ? { ...w, ...updatedFields } : w
    )
    setWarga(updated)
    await saveStorageItem(STORAGE_KEYS.WARGA, updated)

    // Jika jabatan atau role diubah, sinkronkan ke akun user
    if (updatedFields.jabatan !== undefined || updatedFields.role !== undefined) {
      const targetW = warga.find((w) => w.id === wargaId)
      const targetJabatan = updatedFields.jabatan !== undefined ? updatedFields.jabatan : updatedFields.role
      const isOfficial = ['rt', 'rw', 'bendahara', 'pengurus', 'admin'].includes(targetJabatan)
      const targetRole = updatedFields.role !== undefined ? updatedFields.role : (isOfficial ? targetJabatan : 'warga')

      let accountFound = false
      const updatedUsers = users.map((u) => {
        if (u.resident_id === wargaId || (targetW && u.username && u.username.toLowerCase() === `warga.${(targetW.nama || '').toLowerCase().replace(/[^a-z0-9]/g, '')}`)) {
          accountFound = true
          return {
            ...u,
            resident_id: wargaId,
            jabatan: targetJabatan,
            role: targetRole
          }
        }
        return u
      })

      // Jika belum memiliki akun login, buatkan otomatis
      if (!accountFound && targetW && isOfficial) {
        const cleanName = (targetW.nama || 'warga').toLowerCase().replace(/[^a-z0-9]/g, '')
        const newAcc = {
          id: `u-${wargaId}`,
          username: `${targetJabatan}.${cleanName}`.slice(0, 24),
          password: '123456',
          name: targetW.nama,
          role: targetRole,
          jabatan: targetJabatan,
          resident_id: wargaId,
          rt_id: targetW.rt_id || 'rt-1',
          rw_id: targetW.rw_id || 'rw-01'
        }
        updatedUsers.push(newAcc)
      }

      setUsers(updatedUsers)
      await saveStorageItem(STORAGE_KEYS.USERS, updatedUsers)

      // Sinkronkan currentUser jika pengguna yang sedang login yang diubah
      if (currentUser?.resident_id === wargaId || currentUser?.id === `u-${wargaId}`) {
        const updatedCurrent = {
          ...currentUser,
          jabatan: targetJabatan,
          role: targetRole
        }
        setCurrentUser(updatedCurrent)
        await saveStorageItem(STORAGE_KEYS.CURRENT_USER, updatedCurrent)
      }
    }

    return { success: true }
  }

  // Kas Operations
  const tambahKas = async (kasData) => {
    const newId = `kas-${Date.now()}`
    const isMasuk = kasData.tipe === 'Masuk' || kasData.tipe === 'Pemasukan'
    const desc = kasData.deskripsi || kasData.keterangan || ''
    const item = {
      id: newId,
      tanggal: kasData.tanggal || new Date().toISOString().slice(0, 10),
      tipe: isMasuk ? 'Masuk' : 'Keluar',
      kategori: kasData.kategori || (isMasuk ? 'Iuran Warga' : 'Operasional'),
      nominal: Number(kasData.nominal) || 0,
      deskripsi: desc,
      keterangan: desc,
      scope: kasData.scope || (currentUser?.role === 'admin' ? 'rw' : 'rt'),
      rt_id: kasData.rt_id !== undefined ? kasData.rt_id : (currentUser?.role === 'admin' ? null : currentUser?.rt_id || 'rt-01-01'),
      rw_id: kasData.rw_id || currentUser?.rw_id || 'rw-01',
      pj: kasData.pj || currentUser?.name || (currentUser?.role === 'rt' ? 'Ketua RT' : 'Pengurus RW')
    }
    const updated = [item, ...kas]
    setKas(updated)
    await saveStorageItem(STORAGE_KEYS.KAS, updated)
    return { success: true, kas: item }
  }

  const deleteKas = async (kasId) => {
    const updated = kas.filter((k) => k.id !== kasId)
    setKas(updated)
    await saveStorageItem(STORAGE_KEYS.KAS, updated)
    await deleteFromSupabase(STORAGE_KEYS.KAS, kasId)
    return { success: true }
  }

  const addTagihanManual = async (data) => {
    const today = new Date().toISOString().slice(0, 10)
    const randomSeq = Math.floor(100 + Math.random() * 900)
    const isLunas = data.status === 'Lunas'
    const targetW = warga.find((w) => w.id === data.wargaId) || {}

    const isRtUser = currentUser?.role === 'rt'
    if (isRtUser && targetW.rt_id && targetW.rt_id !== (currentUser?.rt_id || 'rt-1')) {
      throw new Error(`Pengurus RT tidak dapat menerbitkan tagihan untuk warga RT lain!`)
    }

    const kodeUnikWarga = getKodeUnikWarga(targetW)
    const angkaKode = parseInt(getAngkaKodeUnik(targetW), 10) || 0
    const rawTotal = Number(data.total) || 0
    const finalTotal = calculateTotalWithKodeUnik(rawTotal, targetW)

    const targetScope = isRtUser ? 'RT' : (data.payment_scope || 'RW')
    const isRwScope = targetScope === 'RW'
    const ownerId = isRwScope ? (config?.rw || 'rw-15') : (targetW.rt_id || currentUser?.rt_id || 'rt-1')
    const rtObj = rts.find((r) => r.id === ownerId) || {}
    const ownerLabel = isRwScope ? (config?.rw || 'RW 15') : (rtObj.name || 'RT 01')
    const namaPos = data.namaPos || (isRwScope ? 'Iuran Pembangunan & Fasum RW' : 'Iuran Pengelolaan Lingkungan (IPL)')

    const item = {
      id: `tag-manual-${Date.now()}`,
      wargaId: data.wargaId,
      rt_id: targetW.rt_id || ownerId,
      namaWarga: targetW.nama || 'Warga',
      blok: targetW.blok || 'A',
      noRumah: targetW.noRumah || '-',
      kodeUnik: kodeUnikWarga,
      bulan: Number(data.bulan),
      tahun: Number(data.tahun),
      total: finalTotal,
      rincian: data.rincian?.length
        ? data.rincian
        : [
            { nama: namaPos, nominal: Math.floor(rawTotal / 1000) * 1000 },
            { nama: `Kode Unik Warga (${kodeUnikWarga})`, nominal: angkaKode }
          ],
      payment_scope: targetScope,
      target_payment_owner: ownerId,
      pembayaran_kepada: data.pembayaran_kepada || ownerLabel,
      status: data.status || 'Belum Lunas',
      tanggalBayar: isLunas ? (data.tanggalBayar || today) : null,
      metodeBayar: isLunas ? (data.metodeBayar || 'Tunai') : null,
      noKwitansi: isLunas ? `KW-${data.tahun}${String(data.bulan).padStart(2,'0')}-${randomSeq}` : null,
      catatan: data.catatan || ''
    }
    const updated = [item, ...tagihan]
    setTagihan(updated)
    await saveStorageItem(STORAGE_KEYS.TAGIHAN, updated)

    if (!isLunas && item.wargaId) {
      await addNotification({
        userId: `u-${item.wargaId}`,
        residentId: item.wargaId,
        title: `Tagihan IPL ${item.payment_scope} Periode ${item.bulan}/${item.tahun} 📬`,
        message: `Tagihan ${item.pembayaran_kepada} sebesar Rp ${item.total.toLocaleString('id-ID')} telah diterbitkan. Harap lakukan pembayaran.`,
        type: 'tagihan',
        tagihanId: item.id,
        screen: 'Tagihan'
      })
    }

    if (isLunas) {
      const kasItem = {
        id: `kas-manual-${Date.now()}`,
        tanggal: item.tanggalBayar,
        tipe: 'Masuk',
        kategori: isRwScope ? 'Iuran RW' : 'Iuran RT',
        deskripsi: `${ownerLabel} - ${targetW.nama || 'Warga'} (${targetW.blok || '-'}/${targetW.noRumah || '-'}) bln ${item.bulan}/${item.tahun} (Manual)`,
        keterangan: item.noKwitansi ? `No Kwitansi: ${item.noKwitansi}` : 'Tagihan Manual',
        nominal: item.total,
        tagihanId: item.id,
        scope: isRwScope ? 'rw' : 'rt',
        rt_id: isRwScope ? null : (targetW.rt_id || currentUser?.rt_id || 'rt-1'),
        pj: currentUser?.name || (isRwScope ? 'Pengurus RW' : 'Pengurus RT')
      }
      const updKas = [kasItem, ...kas]
      setKas(updKas)
      await saveStorageItem(STORAGE_KEYS.KAS, updKas)
    }
    return { success: true, tagihan: item }
  }

  const batalBayarTagihan = async (tagihanId) => {
    const updated = tagihan.map((t) =>
      t.id === tagihanId
        ? { ...t, status: 'Belum Lunas', tanggalBayar: null, tglBayar: null, metodeBayar: null, noKwitansi: null, buktiBayar: null, buktiTransferUrl: null, alasanTolak: null }
        : t
    )
    setTagihan(updated)
    await saveStorageItem(STORAGE_KEYS.TAGIHAN, updated)
    const updKas = kas.filter((k) => k.tagihanId !== tagihanId)
    setKas(updKas)
    await saveStorageItem(STORAGE_KEYS.KAS, updKas)
    return { success: true }
  }

  const deleteTagihan = async (tagihanId) => {
    const updated = tagihan.filter((t) => t.id !== tagihanId)
    setTagihan(updated)
    await saveStorageItem(STORAGE_KEYS.TAGIHAN, updated)
    await deleteFromSupabase(STORAGE_KEYS.TAGIHAN, tagihanId)
    const updKas = kas.filter((k) => k.tagihanId !== tagihanId)
    setKas(updKas)
    await saveStorageItem(STORAGE_KEYS.KAS, updKas)
    return { success: true }
  }

  const deleteTagihanBulk = async (tagihanIds = []) => {
    if (!tagihanIds.length) return { success: false, count: 0 }
    const idSet = new Set(tagihanIds)
    const updated = tagihan.filter((t) => !idSet.has(t.id))
    setTagihan(updated)
    await saveStorageItem(STORAGE_KEYS.TAGIHAN, updated)
    for (const id of tagihanIds) {
      await deleteFromSupabase(STORAGE_KEYS.TAGIHAN, id)
    }
    const updKas = kas.filter((k) => !idSet.has(k.tagihanId))
    setKas(updKas)
    await saveStorageItem(STORAGE_KEYS.KAS, updKas)
    await addAuditLog({
      action: 'DELETE_TAGIHAN_BULK',
      entity: 'tagihan',
      entityId: `bulk-${Date.now()}`,
      details: `Menghapus ${tagihanIds.length} tagihan sekaligus oleh ${currentUser?.name || 'Pengurus'}`
    })
    return { success: true, count: tagihanIds.length }
  }

  const updateTagihan = async (tagihanId, updatedData) => {
    const current = tagihan.find((t) => t.id === tagihanId)
    if (!current) return { success: false, message: 'Tagihan tidak ditemukan' }

    const targetW = warga.find((w) => w.id === (updatedData.wargaId || current.wargaId)) || {}
    const kodeUnikWarga = getKodeUnikWarga(targetW)
    const angkaKode = parseInt(getAngkaKodeUnik(targetW), 10) || 0

    let newTotal = current.total
    let newRincian = updatedData.rincian || current.rincian

    if (updatedData.total !== undefined && Number(updatedData.total) !== current.total) {
      const rawTotal = Number(updatedData.total) || 0
      newTotal = calculateTotalWithKodeUnik(rawTotal, targetW)
      const namaPos = updatedData.namaPos || (current.rincian?.[0]?.nama) || 'Iuran Warga'
      newRincian = [
        { nama: namaPos, nominal: Math.floor(rawTotal / 1000) * 1000 },
        { nama: `Kode Unik Warga (${kodeUnikWarga})`, nominal: angkaKode }
      ]
    }

    const wasLunas = current.status === 'Lunas'
    const newStatus = updatedData.status || current.status
    const isNowLunas = newStatus === 'Lunas'
    const today = new Date().toISOString().slice(0, 10)
    const randomSeq = Math.floor(100 + Math.random() * 900)

    const merged = {
      ...current,
      ...updatedData,
      total: newTotal,
      rincian: newRincian,
      status: newStatus,
      tanggalBayar: isNowLunas ? (updatedData.tanggalBayar || current.tanggalBayar || today) : null,
      metodeBayar: isNowLunas ? (updatedData.metodeBayar || current.metodeBayar || 'Tunai') : null,
      noKwitansi: isNowLunas
        ? (current.noKwitansi || `KW-${updatedData.tahun || current.tahun}${String(updatedData.bulan || current.bulan).padStart(2, '0')}-${randomSeq}`)
        : null
    }

    const updatedList = tagihan.map((t) => (t.id === tagihanId ? merged : t))
    setTagihan(updatedList)
    await saveStorageItem(STORAGE_KEYS.TAGIHAN, updatedList)

    // Kas synchronization
    if (!wasLunas && isNowLunas) {
      const isRw = merged.payment_scope === 'RW'
      const ownerLabel = merged.pembayaran_kepada || (isRw ? 'RW 15' : 'RT 01')
      const kasItem = {
        id: `kas-auto-${Date.now()}`,
        tanggal: merged.tanggalBayar || today,
        tipe: 'Masuk',
        kategori: isRw ? 'Iuran RW' : 'Iuran RT',
        deskripsi: `${ownerLabel} - ${targetW.nama || merged.namaWarga} (${targetW.blok || '-'}/${targetW.noRumah || '-'}) bln ${merged.bulan}/${merged.tahun}`,
        keterangan: merged.noKwitansi ? `No Kwitansi: ${merged.noKwitansi}` : 'Pelunasan Tagihan',
        nominal: merged.total,
        tagihanId: merged.id,
        scope: isRw ? 'rw' : 'rt',
        rt_id: isRw ? null : (targetW.rt_id || currentUser?.rt_id || 'rt-1'),
        pj: currentUser?.name || (isRw ? 'Pengurus RW' : 'Pengurus RT')
      }
      const updKas = [kasItem, ...kas]
      setKas(updKas)
      await saveStorageItem(STORAGE_KEYS.KAS, updKas)
    } else if (wasLunas && !isNowLunas) {
      const updKas = kas.filter((k) => k.tagihanId !== tagihanId)
      setKas(updKas)
      await saveStorageItem(STORAGE_KEYS.KAS, updKas)
    }

    await addAuditLog({
      action: 'UPDATE_TAGIHAN',
      entity: 'tagihan',
      entityId: tagihanId,
      details: `Mengubah tagihan ${merged.namaWarga} bln ${merged.bulan}/${merged.tahun} (Status: ${newStatus}, Total: ${newTotal})`
    })

    return { success: true, tagihan: merged }
  }

  const tambahTagihanBiasaMassal = async ({
    namaTagihan,
    nominal,
    bulan,
    tahun,
    scope = 'RT',
    targetRtId = null,
    catatan = '',
    jatuhTempo = null
  }) => {
    const b = Number(bulan)
    const t = Number(tahun)
    const rawNominal = Number(nominal) || 0
    const isRtUser = currentUser?.role === 'rt'
    const finalScope = isRtUser ? 'RT' : scope
    const isRw = finalScope === 'RW'
    const finalRtId = isRtUser ? (currentUser?.rt_id || 'rt-1') : targetRtId

    const targetWargaList = warga.filter((w) => {
      if (w.aktif === false) return false
      // RT user strictly only bills their own RT
      if (isRtUser) return w.rt_id === finalRtId
      // RW user: if targetRtId specified (not null / not 'ALL'), only bill that RT
      if (!isRw && finalRtId) return w.rt_id === finalRtId
      if (isRw && targetRtId && targetRtId !== 'ALL') return w.rt_id === targetRtId
      return true
    })

    let countCreated = 0
    const newItems = []

    targetWargaList.forEach((w) => {
      const rtObj = rts.find((r) => r.id === w.rt_id) || {}
      const kodeUnikWarga = getKodeUnikWarga(w)
      const angkaKode = parseInt(getAngkaKodeUnik(w), 10) || 0
      const totalTarifWithKode = calculateTotalWithKodeUnik(rawNominal, w)
      const ownerId = isRw ? (config?.rw || 'rw-15') : w.rt_id
      const ownerLabel = isRw ? (config?.rw || 'RW 15') : (rtObj.name || 'RT 01')

      const invId = `tag-biasa-${t}-${String(b).padStart(2, '0')}-${Date.now().toString(36)}-${w.id}`

      newItems.push({
        id: invId,
        wargaId: w.id,
        rt_id: w.rt_id,
        namaWarga: w.nama,
        blok: w.blok,
        noRumah: w.noRumah,
        kodeUnik: kodeUnikWarga,
        bulan: b,
        tahun: t,
        total: totalTarifWithKode,
        rincian: [
          { nama: namaTagihan || 'Tagihan Biasa', nominal: Math.floor(rawNominal / 1000) * 1000 },
          { nama: `Kode Unik Warga (${kodeUnikWarga})`, nominal: angkaKode }
        ],
        payment_scope: finalScope,
        target_payment_owner: ownerId,
        pembayaran_kepada: ownerLabel,
        status: 'Belum Bayar',
        tanggalBayar: null,
        metodeBayar: null,
        noKwitansi: null,
        jatuhTempo: jatuhTempo || null,
        catatan: catatan || '',
        submissions: []
      })
      countCreated++
    })

    if (countCreated === 0) return { success: false, count: 0 }

    const updated = [...newItems, ...tagihan]
    setTagihan(updated)
    await saveStorageItem(STORAGE_KEYS.TAGIHAN, updated)

    // Buat notifikasi ke seluruh warga yang ditagih
    const biasaNotifs = newItems.map((inv) => ({
      id: `notif-${inv.id}`,
      userId: `u-${inv.wargaId}`,
      residentId: inv.wargaId,
      title: `Tagihan Baru: ${namaTagihan || 'Iuran Lingkungan'} 📬`,
      message: `Tagihan ${inv.pembayaran_kepada} sebesar Rp ${inv.total.toLocaleString('id-ID')} telah diterbitkan (Periode: ${b}/${t}).`,
      type: 'tagihan',
      tagihanId: inv.id,
      screen: 'Tagihan',
      read: false,
      created_at: new Date().toISOString()
    }))
    const updatedNotifs = [...biasaNotifs, ...notifications]
    setNotifications(updatedNotifs)
    await saveStorageItem(STORAGE_KEYS.NOTIFICATIONS, updatedNotifs)

    await addAuditLog({
      action: 'TAMBAH_TAGIHAN_BIASA_MASSAL',
      entity: 'tagihan',
      entityId: `massal-biasa-${t}-${b}`,
      details: `Menerbitkan "${namaTagihan}" ke ${countCreated} warga (Scope: ${scope})`
    })

    return { success: true, count: countCreated }
  }

  const buatPengaduan = async (data) => {
    const newId = `aduan-${Date.now()}`
    const wId = currentWarga?.id || currentUser?.resident_id || currentUser?.id || 'w-anon'
    const rtId = currentWarga?.rt_id || currentUser?.rt_id || 'rt-01-01'
    const rwId = currentWarga?.rw_id || currentUser?.rw_id || 'rw-01'
    const targetTujuan = data.tujuan || 'rt' // 'rt' | 'rw' | 'both'

    const item = {
      id: newId,
      wargaId: wId,
      namaWarga: data.hideName ? 'Warga Lingkungan' : (currentWarga?.nama || currentUser?.name || 'Warga'),
      rt_id: rtId,
      rw_id: rwId,
      tujuan: targetTujuan,
      kategori: data.kategori || 'Fasilitas Umum',
      lokasi: data.lokasi || '',
      judul: data.judul,
      deskripsi: data.deskripsi,
      photos: data.photos || [],
      ticketNum: data.ticketNum || `AD-${new Date().getFullYear()}-${String(Math.floor(1000 + Math.random() * 9000))}`,
      status: 'Menunggu Tindak Lanjut',
      stage: 1,
      tanggal: new Date().toISOString().slice(0, 10),
      created_at: new Date().toISOString(),
      readStatus: {
        warga: true,
        rt: targetTujuan === 'rw' ? true : false,
        rw: targetTujuan === 'rt' ? true : false
      },
      readBy: ['warga'],
      tanggapan: '',
      tanggapanList: []
    }

    const updated = [item, ...pengaduan]
    setPengaduan(updated)
    await saveStorageItem(STORAGE_KEYS.PENGADUAN, updated)

    // Notifikasi sistem
    if (targetTujuan === 'rt' || targetTujuan === 'both') {
      await addNotification({
        title: 'Aduan Warga Baru ⚠️',
        message: `Laporan [${item.kategori}]: ${item.judul}`,
        type: 'warning',
        aduanId: newId,
        targetRole: 'rt',
        targetRtId: rtId
      })
    }
    if (targetTujuan === 'rw' || targetTujuan === 'both') {
      await addNotification({
        title: 'Aduan Lingkungan (RW) ⚠️',
        message: `Laporan [${item.kategori}] ditujukan ke RW: ${item.judul}`,
        type: 'warning',
        aduanId: newId,
        targetRole: 'rw'
      })
    }

    return { success: true, pengaduan: item }
  }

  const bacaPengaduan = async (id) => {
    let changed = false
    const updated = pengaduan.map((p) => {
      if (p.id === id) {
        const curReadStatus = p.readStatus || { warga: false, rt: false, rw: false }
        const curReadBy = Array.isArray(p.readBy) ? [...p.readBy] : []
        let nextReadStatus = { ...curReadStatus }

        if (isWarga) {
          if (!nextReadStatus.warga) {
            nextReadStatus.warga = true
            if (!curReadBy.includes('warga')) curReadBy.push('warga')
            changed = true
          }
        } else if (isRT) {
          if (!nextReadStatus.rt) {
            nextReadStatus.rt = true
            if (!curReadBy.includes('rt')) curReadBy.push('rt')
            changed = true
          }
        } else if (isRW) {
          if (!nextReadStatus.rw) {
            nextReadStatus.rw = true
            if (!curReadBy.includes('rw')) curReadBy.push('rw')
            changed = true
          }
        } else if (isAdmin || isPengurus) {
          if (!nextReadStatus.admin) {
            nextReadStatus.admin = true
            if (!curReadBy.includes('admin')) curReadBy.push('admin')
            changed = true
          }
        }

        if (changed) {
          return {
            ...p,
            readStatus: nextReadStatus,
            readBy: curReadBy
          }
        }
      }
      return p
    })

    if (changed) {
      setPengaduan(updated)
      await saveStorageItem(STORAGE_KEYS.PENGADUAN, updated)
    }
    return { success: true }
  }

  const tanggapiPengaduan = async (id, { tanggapan, newStatus }) => {
    const targetAduan = pengaduan.find((p) => p.id === id)
    if (!targetAduan) return { success: false, message: 'Aduan tidak ditemukan' }

    const responderRole = isRT ? 'rt' : isRW ? 'rw' : (isAdmin || isPengurus) ? 'pengurus' : 'petugas'
    const responderName = currentUser?.name || (isRT ? 'Ketua RT' : isRW ? 'Ketua RW' : 'Petugas Lingkungan')
    const nextStatus = newStatus || targetAduan.status
    const nextStage = nextStatus === 'Selesai' ? 4 : (nextStatus === 'Sedang Diproses' ? 3 : 2)

    const newTgpItem = {
      id: `tgp-${Date.now()}`,
      responderRole,
      responderName,
      pesan: (tanggapan || '').trim(),
      statusAfter: nextStatus,
      created_at: new Date().toISOString()
    }

    const updated = pengaduan.map((p) => {
      if (p.id === id) {
        const curReadBy = [responderRole]
        let nextReadStatus = {
          ...(p.readStatus || {}),
          warga: false, // Warga menerima notifikasi & badge belum dibaca
          [responderRole]: true
        }

        return {
          ...p,
          status: nextStatus,
          stage: nextStage,
          tanggapan: tanggapan?.trim() || p.tanggapan,
          tanggapanList: [...(p.tanggapanList || []), newTgpItem],
          tglSelesai: nextStatus === 'Selesai' ? new Date().toISOString().slice(0, 10) : p.tglSelesai,
          readStatus: nextReadStatus,
          readBy: curReadBy,
          updated_at: new Date().toISOString()
        }
      }
      return p
    })

    setPengaduan(updated)
    await saveStorageItem(STORAGE_KEYS.PENGADUAN, updated)

    // Kirim notifikasi ke warga pembuat aduan
    if (targetAduan.wargaId) {
      await addNotification({
        userId: targetAduan.wargaId,
        residentId: targetAduan.wargaId,
        title: `Tanggapan Aduan: ${targetAduan.kategori} 🔔`,
        message: `${responderName}: "${tanggapan.trim()}" (Status: ${nextStatus})`,
        type: 'info',
        aduanId: id
      })
    }

    return { success: true }
  }

  const updatePengaduan = async (id, status, tanggapan) => {
    return tanggapiPengaduan(id, { tanggapan: tanggapan || 'Status diperbarui', newStatus: status })
  }

  // Event Operations
  const tambahEvent = async (data) => {
    const isRtUser = currentUser?.role === 'rt'
    const targetScope = isRtUser ? 'rt' : (data.scope || 'rw')
    const targetRtId = isRtUser ? (currentUser?.rt_id || 'rt-1') : (targetScope === 'rt' ? (data.rt_id || 'rt-1') : null)

    const item = {
      ...data,
      id: `evt-${Date.now()}`,
      judul: data.judul,
      kategori: data.kategori || 'Pengumuman',
      scope: targetScope,
      rt_id: targetRtId,
      targetType: data.targetType || 'all',
      targetWargaId: data.targetType === 'personal' ? data.targetWargaId : null,
      tipePengumuman: data.tipePengumuman || (Number(data.nominalPerKK) > 0 ? 'iuran' : 'info'),
      nominalPerKK: Number(data.nominalPerKK) || 0,
      batasTanggal: data.batasTanggal || new Date().toISOString().slice(0, 10),
      tanggal: data.tanggal || data.batasTanggal || new Date().toISOString().slice(0, 10),
      tanggalDibuat: new Date().toISOString().slice(0, 10),
      autoHapus: !!data.autoHapus,
      expiredAt: data.expiredAt || null,
      aktif: true,
      deskripsi: data.deskripsi || '',
      lokasi: data.lokasi || '',
      posterUrl: data.posterUrl || null,
      created_at: new Date().toISOString()
    }
    const updated = [item, ...events]
    setEvents(updated)
    await saveStorageItem(STORAGE_KEYS.EVENTS, updated)

    // Kirim notifikasi pengumuman baru ke seluruh warga
    await addNotification({
      title: `Pengumuman Baru: ${item.judul} 📢`,
      message: `${item.kategori} • ${item.deskripsi || item.lokasi || 'Silakan cek detail kegiatan di menu Layanan.'}`,
      type: 'event',
      eventId: item.id,
      targetRole: 'all',
      targetScope: targetScope,
      targetRtId: targetRtId,
      screen: 'Events'
    })

    return { success: true, event: item }
  }

  const hapusEvent = async (eventId) => {
    const updated = events.filter((e) => e.id !== eventId)
    setEvents(updated)
    await saveStorageItem(STORAGE_KEYS.EVENTS, updated)
    await deleteFromSupabase(STORAGE_KEYS.EVENTS, eventId)
    return { success: true }
  }

  const generateTagihanEventMassal = async (eventId) => {
    const event = events.find((e) => e.id === eventId)
    if (!event) return 0
    const nominalPerKK = event.nominalPerKK || 0
    const isRtUser = currentUser?.role === 'rt'
    const finalRtId = isRtUser ? currentUser?.rt_id || 'rt-1' : (event.rt_id || null)
    const targetWargaList = warga.filter((w) => {
      if (w.aktif === false) return false
      if (finalRtId) return w.rt_id === finalRtId
      return true
    })
    let count = 0
    const newItems = []
    targetWargaList.forEach((w) => {
      const exists = tagihanEvents.some((te) => te.eventId === eventId && te.wargaId === w.id)
      if (!exists) {
        newItems.push({
          id: `te-${eventId}-${w.id}`,
          eventId,
          wargaId: w.id,
          nominal: nominalPerKK,
          status: 'Belum Lunas',
          metodeBayar: null,
          tanggalBayar: null
        })
        count++
      }
    })
    if (count === 0) return 0
    const updated = [...newItems, ...tagihanEvents]
    setTagihanEvents(updated)
    await saveStorageItem(STORAGE_KEYS.TAGIHAN_EVENTS, updated)
    return count
  }

  const bayarTagihanEvent = async (tagihanEventId, data) => {
    const today = new Date().toISOString().slice(0, 10)
    const targetTE = tagihanEvents.find((t) => t.id === tagihanEventId)
    const targetEvent = events.find((e) => e.id === targetTE?.eventId)
    const targetW = warga.find((w) => w.id === targetTE?.wargaId) || {}

    const newStatus = data.status || (data.isAdminVerify ? 'Lunas' : 'Menunggu Verifikasi')
    const isNowPaid = newStatus === 'Lunas'

    const updated = tagihanEvents.map((te) => {
      if (te.id === tagihanEventId) {
        return {
          ...te,
          status: newStatus,
          metodeBayar: data.metodeBayar || te.metodeBayar || 'Transfer Bank',
          buktiBayar: data.buktiBayar || te.buktiBayar || '',
          buktiFoto: data.buktiFoto || data.buktiTransferUrl || te.buktiFoto || null,
          buktiTransferUrl: data.buktiTransferUrl || data.buktiFoto || te.buktiTransferUrl || null,
          tanggalBayar: isNowPaid ? (te.tanggalBayar || today) : null,
          verified_by: isNowPaid ? (currentUser?.name || 'Pengurus') : null,
          verified_at: isNowPaid ? new Date().toISOString() : null
        }
      }
      return te
    })

    setTagihanEvents(updated)
    await saveStorageItem(STORAGE_KEYS.TAGIHAN_EVENTS, updated)

    if (!isNowPaid) {
      // Citizen mengunggah bukti -> Notifikasi ke Bendahara & Pengurus
      await addNotification({
        title: 'Bukti Iuran Kegiatan Masuk 💳',
        message: `${targetW.nama || 'Warga'} (Blok ${targetW.blok || '-'}/${targetW.noRumah || '-'}) telah mengunggah bukti iuran untuk kegiatan "${targetEvent?.judul || 'Kegiatan'}".`,
        type: 'payment_submitted',
        eventId: targetTE?.eventId,
        tagihanEventId,
        targetRole: 'pengurus',
        targetRtId: targetW.rt_id,
        screen: 'Events'
      })
    } else {
      // Diverifikasi Lunas -> Notifikasi ke Warga
      if (targetW?.id) {
        await addNotification({
          userId: `u-${targetW.id}`,
          residentId: targetW.id,
          title: 'Iuran Kegiatan Terverifikasi ✅',
          message: `Pembayaran iuran kegiatan "${targetEvent?.judul || 'Kegiatan'}" sebesar Rp ${(targetTE?.nominal || targetEvent?.nominalPerKK || 0).toLocaleString('id-ID')} telah disetujui Lunas.`,
          type: 'payment_verified',
          eventId: targetTE?.eventId,
          tagihanEventId,
          screen: 'Events'
        })
      }
    }

    // Catatan: Dana iuran kegiatan & lomba dikelola terpisah per acara (tidak masuk ke Kas Rutin RT/RW)
    return { success: true }
  }

  const tolakTagihanEvent = async (tagihanEventId, alasanTolak = '', catatanTolak = '') => {
    const targetTE = tagihanEvents.find((t) => t.id === tagihanEventId)
    const targetEvent = events.find((e) => e.id === targetTE?.eventId)
    const targetW = warga.find((w) => w.id === targetTE?.wargaId) || {}
    const verifierName = currentUser?.name || 'Pengurus'

    const updated = tagihanEvents.map((te) => {
      if (te.id === tagihanEventId) {
        return {
          ...te,
          status: 'Perlu Diperbaiki',
          alasanPenolakan: alasanTolak || 'Bukti transfer tidak sesuai.',
          catatanPenolakan: catatanTolak || '',
          rejection_reason: alasanTolak || 'Bukti transfer tidak sesuai.',
          diverifikasi_oleh: verifierName,
          verified_by: verifierName,
          verified_at: new Date().toISOString()
        }
      }
      return te
    })

    setTagihanEvents(updated)
    await saveStorageItem(STORAGE_KEYS.TAGIHAN_EVENTS, updated)

    if (targetW?.id) {
      await addNotification({
        userId: targetW.id,
        residentId: targetW.id,
        title: 'Bukti Iuran Perlu Diperbaiki ⚠️',
        message: `Bukti iuran kegiatan "${targetEvent?.judul || 'Kegiatan'}" ditolak: ${alasanTolak || 'Bukti tidak sesuai'}. Silakan unggah ulang.`,
        type: 'warning',
        tagihanEventId
      })
    }

    return { success: true }
  }

  const deleteTagihanEvent = async (tagihanEventId) => {
    const updated = tagihanEvents.filter((te) => te.id !== tagihanEventId)
    setTagihanEvents(updated)
    await saveStorageItem(STORAGE_KEYS.TAGIHAN_EVENTS, updated)
    await deleteFromSupabase(STORAGE_KEYS.TAGIHAN_EVENTS, tagihanEventId)
    return { success: true }
  }

  const ajukanSurat = async (data) => {
    const newId = `surat-${Date.now()}`
    const wId = currentWarga?.id || currentUser?.resident_id || currentUser?.id || 'w-anon'
    const rtId = currentWarga?.rt_id || currentUser?.rt_id || 'rt-01-01'
    const rwId = currentWarga?.rw_id || currentUser?.rw_id || 'rw-01'
    const targetTujuan = data.tujuan || 'rt' // 'rt' | 'rw' | 'both'

    const item = {
      id: newId,
      wargaId: wId,
      namaWarga: currentWarga?.nama || currentUser?.name || 'Warga',
      blok: currentWarga?.blok || '',
      noRumah: currentWarga?.noRumah || '',
      rt_id: rtId,
      rw_id: rwId,
      tujuan: targetTujuan,
      jenisSurat: data.jenisSurat || 'Surat Keterangan Domisili',
      keperluan: data.keperluan || '',
      isiSurat: data.isiSurat || '',
      lampiran: data.lampiran || null,
      status: 'Diajukan',
      tanggal: new Date().toISOString().slice(0, 10),
      created_at: new Date().toISOString(),
      readStatus: {
        warga: true,
        rt: targetTujuan === 'rw' ? true : false,
        rw: targetTujuan === 'rt' ? true : false
      },
      readBy: ['warga'],
      balasan: []
    }

    const updated = [item, ...surat]
    setSurat(updated)
    await saveStorageItem(STORAGE_KEYS.SURAT, updated)

    // Notifikasi untuk tujuan (RT dan/atau RW)
    if (targetTujuan === 'rt' || targetTujuan === 'both') {
      await addNotification({
        title: 'Permohonan Surat Baru 📄',
        message: `${item.namaWarga} (Blok ${item.blok}/${item.noRumah}) mengajukan ${item.jenisSurat}.`,
        type: 'info',
        suratId: newId,
        targetRole: 'rt',
        targetRtId: rtId
      })
    }
    if (targetTujuan === 'rw' || targetTujuan === 'both') {
      await addNotification({
        title: 'Permohonan Surat Tingkat RW 📄',
        message: `${item.namaWarga} (RT ${rtId}) mengajukan ${item.jenisSurat} untuk Ketua RW.`,
        type: 'info',
        suratId: newId,
        targetRole: 'rw'
      })
    }

    return { success: true, surat: item }
  }

  const bacaSurat = async (id) => {
    let changed = false
    const updated = surat.map((s) => {
      if (s.id === id) {
        const curReadStatus = s.readStatus || { warga: false, rt: false, rw: false }
        const curReadBy = Array.isArray(s.readBy) ? [...s.readBy] : []
        let nextReadStatus = { ...curReadStatus }

        if (isWarga) {
          if (!nextReadStatus.warga) {
            nextReadStatus.warga = true
            if (!curReadBy.includes('warga')) curReadBy.push('warga')
            changed = true
          }
        } else if (isRT) {
          if (!nextReadStatus.rt) {
            nextReadStatus.rt = true
            if (!curReadBy.includes('rt')) curReadBy.push('rt')
            changed = true
          }
        } else if (isRW) {
          if (!nextReadStatus.rw) {
            nextReadStatus.rw = true
            if (!curReadBy.includes('rw')) curReadBy.push('rw')
            changed = true
          }
        } else if (isAdmin || isPengurus) {
          if (!nextReadStatus.admin) {
            nextReadStatus.admin = true
            if (!curReadBy.includes('admin')) curReadBy.push('admin')
            changed = true
          }
        }

        if (changed) {
          return {
            ...s,
            readStatus: nextReadStatus,
            readBy: curReadBy
          }
        }
      }
      return s
    })

    if (changed) {
      setSurat(updated)
      await saveStorageItem(STORAGE_KEYS.SURAT, updated)
    }
    return { success: true }
  }

  const balasSurat = async (id, { pesan, newStatus }) => {
    const targetSurat = surat.find((s) => s.id === id)
    if (!targetSurat) return { success: false, message: 'Surat tidak ditemukan' }

    const senderRole = isRT ? 'rt' : isRW ? 'rw' : (isAdmin || isPengurus) ? 'pengurus' : 'warga'
    const senderName = currentUser?.name || (isRT ? 'Ketua RT' : isRW ? 'Ketua RW' : 'Warga')
    const nextStatus = newStatus || targetSurat.status

    const newReply = {
      id: `reply-${Date.now()}`,
      senderRole,
      senderName,
      pesan: (pesan || '').trim(),
      statusAfter: nextStatus,
      created_at: new Date().toISOString()
    }

    const updated = surat.map((s) => {
      if (s.id === id) {
        const curReadBy = []
        let nextReadStatus = { ...(s.readStatus || {}) }

        if (senderRole === 'warga') {
          nextReadStatus.warga = true
          curReadBy.push('warga')
          if (s.tujuan === 'rt' || s.tujuan === 'both') nextReadStatus.rt = false
          if (s.tujuan === 'rw' || s.tujuan === 'both') nextReadStatus.rw = false
        } else {
          // Official membalas -> Warga menerima notifikasi & badge belum dibaca
          nextReadStatus.warga = false
          if (senderRole === 'rt') {
            nextReadStatus.rt = true
            curReadBy.push('rt')
          } else if (senderRole === 'rw') {
            nextReadStatus.rw = true
            curReadBy.push('rw')
          }
        }

        return {
          ...s,
          status: nextStatus,
          balasan: [...(s.balasan || []), newReply],
          readStatus: nextReadStatus,
          readBy: curReadBy,
          updated_at: new Date().toISOString()
        }
      }
      return s
    })

    setSurat(updated)
    await saveStorageItem(STORAGE_KEYS.SURAT, updated)

    // Kirim notifikasi balasan ke warga
    if (senderRole !== 'warga' && targetSurat.wargaId) {
      await addNotification({
        userId: targetSurat.wargaId,
        residentId: targetSurat.wargaId,
        title: `Balasan Surat: ${targetSurat.jenisSurat} 📬`,
        message: `${senderName}: "${pesan.trim()}" (Status: ${nextStatus})`,
        type: 'info',
        suratId: id
      })
    }

    return { success: true }
  }

  const updateSurat = async (id, status, catatan) => {
    return balasSurat(id, { pesan: catatan || `Status surat diubah menjadi ${status}`, newStatus: status })
  }

  const updateConfig = async (newConfig) => {
    setConfig(newConfig)
    await saveStorageItem(STORAGE_KEYS.CONFIG, newConfig)
    return { success: true }
  }

  const updateAutoBillingConfig = async (newAutoBillingSettings) => {
    const defaultAuto = {
      enabled: true,
      publishDay: 5,
      publishTime: '08:00',
      dueDay: 20,
      scope: 'ALL',
      last_run_at: null,
      last_run_period: null,
      last_run_status: 'standby',
      last_run_created_count: 0,
      last_run_skipped_count: 0,
      last_run_message: 'Sistem otomatisasi aktif menunggu jadwal tanggal terbit.',
      scheduler_heartbeat: new Date().toISOString(),
      scheduler_status: 'RUNNING'
    }

    const updatedAutoBilling = {
      ...defaultAuto,
      ...(config?.autoBilling || {}),
      ...newAutoBillingSettings
    }

    const updatedConfig = {
      ...config,
      autoBilling: updatedAutoBilling
    }

    setConfig(updatedConfig)
    await saveStorageItem(STORAGE_KEYS.CONFIG, updatedConfig)

    // Sync to Supabase wargaku_config with canonical id 'main'
    if (isSupabaseConfigured) {
      try {
        await supabase.from('wargaku_config').upsert({
          id: 'main',
          data: updatedConfig,
          updated_at: new Date().toISOString()
        })
      } catch (err) {
        console.warn('Gagal sync autoBilling ke Supabase:', err)
      }
    }

    await addAuditLog({
      action: 'UPDATE_AUTO_BILLING_CONFIG',
      entity: 'config',
      entityId: 'autoBilling',
      details: `Mengubah jadwal otomatis: Terbit tgl ${updatedAutoBilling.publishDay}, Jatuh Tempo tgl ${updatedAutoBilling.dueDay}, Status: ${updatedAutoBilling.enabled ? 'Aktif' : 'Nonaktif'}`
    })

    return { success: true, autoBilling: updatedAutoBilling }
  }

  const triggerManualBillingCatchUp = async (forceMonth = null, forceYear = null) => {
    const nowJkt = getJakartaDate()
    const targetY = forceYear || nowJkt.year
    const targetM = forceMonth || nowJkt.month

    const autoCfg = config?.autoBilling || {
      enabled: true,
      publishDay: 5,
      publishTime: '08:00',
      dueDay: 20,
      scope: 'ALL'
    }

    try {
      const result = buildAutoBillingInvoices({
        targetYear: targetY,
        targetMonth: targetM,
        publishDay: autoCfg.publishDay || 5,
        dueDay: autoCfg.dueDay || 20,
        scope: autoCfg.scope || 'ALL',
        residents: warga,
        iuranRates: jenisIuran,
        existingInvoices: tagihan,
        rts
      })

      if (result.createdInvoices.length > 0) {
        const updatedTagihan = [...result.createdInvoices, ...tagihan]
        setTagihan(updatedTagihan)
        await saveStorageItem(STORAGE_KEYS.TAGIHAN, updatedTagihan)

        if (result.createdNotifications.length > 0) {
          const updatedNotifs = [...result.createdNotifications, ...notifications]
          setNotifications(updatedNotifs)
          await saveStorageItem(STORAGE_KEYS.NOTIFICATIONS, updatedNotifs)
        }

        // Sync ke Supabase wargaku_tagihan & wargaku_notifications
        if (isSupabaseConfigured) {
          try {
            const dbInvoices = result.createdInvoices.map((inv) => ({
              id: inv.id,
              data: inv,
              updated_at: new Date().toISOString()
            }))
            await supabase.from('wargaku_tagihan').upsert(dbInvoices, { onConflict: 'id' })

            if (result.createdNotifications.length > 0) {
              const dbNotifs = result.createdNotifications.map((n) => ({
                id: n.id,
                data: n,
                updated_at: new Date().toISOString()
              }))
              await supabase.from('wargaku_notifications').upsert(dbNotifs, { onConflict: 'id' })
            }
          } catch (e) {
            console.warn('Gagal sync tagihan otomatis ke Supabase:', e)
          }
        }
      }

      // Update monitoring status
      const updatedAutoBilling = {
        ...autoCfg,
        last_run_at: new Date().toISOString(),
        last_run_period: result.period,
        last_run_status: 'success',
        last_run_error: null,
        last_run_created_count: result.totalCreated,
        last_run_skipped_count: Math.max(0, warga.length * (autoCfg.scope === 'ALL' ? 2 : 1) - result.totalCreated),
        last_run_message: result.totalCreated > 0
          ? `Berhasil menerbitkan ${result.totalCreated} tagihan IPL periode ${result.periodLabel}.`
          : `Semua tagihan untuk periode ${result.periodLabel} sudah ada (0 duplikasi dibuat).`,
        scheduler_heartbeat: new Date().toISOString(),
        scheduler_status: 'RUNNING'
      }

      const updatedConfig = { ...config, autoBilling: updatedAutoBilling }
      setConfig(updatedConfig)
      await saveStorageItem(STORAGE_KEYS.CONFIG, updatedConfig)

      if (isSupabaseConfigured) {
        try {
          await supabase.from('wargaku_config').upsert({
            id: 'main',
            data: updatedConfig,
            updated_at: new Date().toISOString()
          })
        } catch (_) {}
      }

      await addAuditLog({
        action: 'TRIGGER_AUTO_BILLING_MANUAL',
        entity: 'tagihan',
        entityId: `auto-${result.period}`,
        details: updatedAutoBilling.last_run_message
      })

      return {
        success: true,
        createdCount: result.totalCreated,
        period: result.periodLabel,
        message: updatedAutoBilling.last_run_message
      }
    } catch (err) {
      console.error('Error saat eksekusi otomatisasi tagihan:', err)
      const errorMsg = err?.message || 'Terjadi kesalahan sistem saat memproses tagihan'

      const failedAutoBilling = {
        ...autoCfg,
        last_run_at: new Date().toISOString(),
        last_run_status: 'failed',
        last_run_error: errorMsg,
        last_run_message: `Gagal memproses tagihan otomatis: ${errorMsg}`,
        scheduler_heartbeat: new Date().toISOString(),
        scheduler_status: 'ERROR'
      }

      const updatedConfig = { ...config, autoBilling: failedAutoBilling }
      setConfig(updatedConfig)
      await saveStorageItem(STORAGE_KEYS.CONFIG, updatedConfig)

      if (isSupabaseConfigured) {
        try {
          await supabase.from('wargaku_config').upsert({
            id: 'main',
            data: updatedConfig,
            updated_at: new Date().toISOString()
          })
        } catch (_) {}
      }

      await addAuditLog({
        action: 'TRIGGER_AUTO_BILLING_FAILED',
        entity: 'tagihan',
        entityId: `auto-failed-${Date.now()}`,
        details: failedAutoBilling.last_run_message
      })

      return {
        success: false,
        createdCount: 0,
        message: errorMsg
      }
    }
  }

  // Evaluasi jadwal otomatis tanpa memaksa bypass aturan tanggal/jam
  const evaluateAndRunAutoBilling = async () => {
    try {
      const autoCfg = config?.autoBilling || {
        enabled: true,
        publishDay: 5,
        publishTime: '08:00',
        dueDay: 20,
        scope: 'ALL'
      }

      if (!autoCfg.enabled) return

      const evalRes = shouldExecuteAutoBilling({
        autoBillingConfig: autoCfg,
        existingInvoices: tagihan,
        residents: warga,
        currentTime: new Date()
      })

      if (evalRes.shouldRun) {
        console.log('[AutoBilling Scheduled Run]:', evalRes.reason)
        await triggerManualBillingCatchUp(evalRes.targetMonth, evalRes.targetYear)
      }
    } catch (e) {
      console.warn('Auto-billing evaluation error:', e)
    }
  }

  // Recurring auto-billing heartbeat (foreground resume & interval check)
  useEffect(() => {
    const handleAppStateChange = (nextState) => {
      if (nextState === 'active') {
        evaluateAndRunAutoBilling().catch(() => {})
      }
    }

    const subscription = AppState.addEventListener('change', handleAppStateChange)

    // Interval berkala setiap 15 menit jika aplikasi terus aktif di layar
    const intervalTimer = setInterval(() => {
      evaluateAndRunAutoBilling().catch(() => {})
    }, 15 * 60 * 1000)

    return () => {
      subscription?.remove?.()
      clearInterval(intervalTimer)
    }
  }, [config?.autoBilling, tagihan, warga])

  const updateRtData = async (rtId, data) => {
    const updated = rts.map((r) => (r.id === rtId ? { ...r, ...data } : r))
    setRts(updated)
    await saveStorageItem(STORAGE_KEYS.RTS, updated)
    return { success: true }
  }

  const addRtData = async (data) => {
    const nextSeq = rts.length + 1
    const rawNumber = String(data.number || nextSeq).replace(/[^0-9]/g, '') || String(nextSeq)
    const formattedNum = rawNumber.padStart(2, '0')
    const newId = `rt-${Date.now()}`
    const newItem = {
      id: newId,
      name: data.name?.trim() || `RT ${formattedNum}`,
      number: formattedNum,
      rw: data.rw || config?.rw?.replace(/[^0-9]/g, '') || '15',
      user_id: null,
      status: 'active',
      keterangan: data.keterangan?.trim() || `Mencakup wilayah warga RT ${formattedNum}`,
      ketua: data.ketua?.trim() || '',
      bendahara: data.bendahara?.trim() || '',
      kontak: data.kontak?.trim() || '',
      rekening: data.rekening?.trim() || '',
      lat: Number(data.lat) || Number((-6.59715 - (rts.length * 0.0004)).toFixed(6)),
      lng: Number(data.lng) || Number((106.76415 + (rts.length * 0.0005)).toFixed(6)),
      lokasi: data.lokasi?.trim() || `Pos Balai Warga ${data.name?.trim() || `RT ${formattedNum}`}`
    }
    const updated = [...rts, newItem]
    setRts(updated)
    await saveStorageItem(STORAGE_KEYS.RTS, updated)
    return { success: true, rt: newItem, id: newId }
  }

  const deleteRtData = async (rtId) => {
    if (rts.length <= 1) {
      return { success: false, message: 'Minimal harus ada 1 RT dalam sistem!' }
    }
    const updated = rts.filter((r) => r.id !== rtId)
    setRts(updated)
    await saveStorageItem(STORAGE_KEYS.RTS, updated)
    await deleteFromSupabase(STORAGE_KEYS.RTS, rtId)
    return { success: true }
  }

  const addJenisIuran = async (data) => {
    const newItem = {
      ...data,
      id: `ji-${Date.now()}`,
      nominal: Number(data.nominal) || 0,
      aktif: true
    }
    const updated = [...jenisIuran, newItem]
    setJenisIuran(updated)
    await saveStorageItem(STORAGE_KEYS.JENIS_IURAN, updated)
    return { success: true, item: newItem }
  }

  const updateJenisIuran = async (id, data) => {
    const updated = jenisIuran.map((item) =>
      item.id === id ? { ...item, ...data, nominal: Number(data.nominal !== undefined ? data.nominal : item.nominal) || 0 } : item
    )
    setJenisIuran(updated)
    await saveStorageItem(STORAGE_KEYS.JENIS_IURAN, updated)
    return { success: true }
  }

  const toggleJenisIuran = async (id) => {
    const updated = jenisIuran.map((item) => (item.id === id ? { ...item, aktif: !item.aktif } : item))
    setJenisIuran(updated)
    await saveStorageItem(STORAGE_KEYS.JENIS_IURAN, updated)
    return { success: true }
  }

  const deleteJenisIuran = async (id) => {
    const updated = jenisIuran.filter((item) => item.id !== id)
    setJenisIuran(updated)
    await saveStorageItem(STORAGE_KEYS.JENIS_IURAN, updated)
    await deleteFromSupabase(STORAGE_KEYS.JENIS_IURAN, id)
    return { success: true }
  }

  // User Accounts CRUD (Data Akses Admin)
  const addUserAccount = async ({ username, password, role = 'admin', rt_id = null, name = '', phone = '' }) => {
    const cleanUser = (username || '').trim().toLowerCase()
    const cleanPass = (password || '').trim()
    const cleanPhone = (phone || '').trim()

    if (!cleanUser) return { success: false, message: 'Username wajib diisi!' }
    if (!isUsernameAvailable(cleanUser, users)) return { success: false, message: `Username "${cleanUser}" sudah digunakan!` }
    if (!cleanPass || cleanPass.length < 4) return { success: false, message: 'Kata sandi minimal 4 karakter!' }

    const passwordHash = await hashPassword(cleanPass)
    const targetRtId = role === 'rt' ? (rt_id || rts[0]?.id || 'rt-1') : null
    const rtInfo = rts.find((r) => r.id === targetRtId)
    const displayName = name.trim() || (role === 'admin' ? `Admin (${cleanUser})` : `Pengurus ${rtInfo?.name || 'RT'}`)

    const newUser = {
      id: `u-${Date.now()}`,
      username: cleanUser,
      aliases: [cleanUser],
      password_hash: passwordHash,
      name: displayName,
      phone: cleanPhone,
      role: role,
      resident_id: null,
      rt_id: targetRtId,
      status: 'active',
      created_at: new Date().toISOString()
    }

    const updated = [newUser, ...users]
    setUsers(updated)
    await saveStorageItem(STORAGE_KEYS.USERS, updated)

    if (role === 'rt' && targetRtId && cleanPhone) {
      const updatedRts = rts.map((r) => (r.id === targetRtId ? { ...r, kontak: cleanPhone, ketua: displayName } : r))
      setRts(updatedRts)
      await saveStorageItem(STORAGE_KEYS.RTS, updatedRts)
    }

    return { success: true, user: newUser }
  }

  const updateUserAccount = async (id, { username, password, role, rt_id, name, phone }) => {
    const target = users.find((u) => u.id === id)
    if (!target) return { success: false, message: 'Akun tidak ditemukan' }

    const cleanUser = (username || target.username).trim().toLowerCase()
    if (!isUsernameAvailable(cleanUser, users, id)) {
      return { success: false, message: `Username "${cleanUser}" sudah digunakan akun lain!` }
    }

    let passwordHash = target.password_hash
    if (password && password.trim()) {
      passwordHash = await hashPassword(password.trim())
    }

    const targetRtId = role === 'rt' ? (rt_id || target.rt_id || 'rt-1') : null
    const rtInfo = rts.find((r) => r.id === targetRtId)
    const displayName = name ? name.trim() : (role === 'admin' ? `Admin (${cleanUser})` : `Pengurus ${rtInfo?.name || 'RT'}`)
    const cleanPhone = phone !== undefined ? phone.trim() : (target.phone || '')

    const updated = users.map((u) => {
      if (u.id === id) {
        return {
          ...u,
          username: cleanUser,
          aliases: [cleanUser, u.id],
          password_hash: passwordHash,
          name: displayName,
          phone: cleanPhone,
          role: role || u.role,
          rt_id: targetRtId,
          updated_at: new Date().toISOString()
        }
      }
      return u
    })

    setUsers(updated)
    await saveStorageItem(STORAGE_KEYS.USERS, updated)
    return { success: true }
  }

  const deleteUserAccount = async (id) => {
    const target = users.find((u) => u.id === id)
    if (!target) return { success: false }
    if (target.username === 'admin' && users.filter((u) => u.role === 'admin').length <= 1) {
      return { success: false, message: 'Tidak dapat menghapus satu-satunya akun Super Admin!' }
    }
    const updated = users.filter((u) => u.id !== id)
    setUsers(updated)
    await saveStorageItem(STORAGE_KEYS.USERS, updated)
    await deleteFromSupabase(STORAGE_KEYS.USERS, id)
    return { success: true }
  }

  // Kontak Darurat CRUD
  const tambahKontakDarurat = async (data) => {
    const newId = `emg-${Date.now()}`
    const item = {
      id: newId,
      nama: data.nama,
      kategori: data.kategori || 'Darurat Lingkungan',
      nomor: data.nomor,
      wa: data.wa || data.nomor,
      deskripsi: data.deskripsi || '',
      rt_id: data.rt_id || null
    }
    const updated = [item, ...kontakDarurat]
    setKontakDarurat(updated)
    await saveStorageItem(STORAGE_KEYS.KONTAK_DARURAT, updated)
    return { success: true, kontak: item }
  }

  const updateKontakDarurat = async (id, data) => {
    const updated = kontakDarurat.map((k) => (k.id === id ? { ...k, ...data } : k))
    setKontakDarurat(updated)
    await saveStorageItem(STORAGE_KEYS.KONTAK_DARURAT, updated)
    return { success: true }
  }

  const hapusKontakDarurat = async (id) => {
    const updated = kontakDarurat.filter((k) => k.id !== id)
    setKontakDarurat(updated)
    await saveStorageItem(STORAGE_KEYS.KONTAK_DARURAT, updated)
    await deleteFromSupabase(STORAGE_KEYS.KONTAK_DARURAT, id)
    return { success: true }
  }

  // Jadwal & Petugas Satpam CRUD
  const tambahJadwalShift = async (data) => {
    const newId = `jdw-${Date.now()}`
    const newItem = {
      id: newId,
      hari: data.hari || 'Senin',
      shift: data.shift || 'Pagi',
      jam: data.jam || '07:00 - 15:00',
      petugasIds: data.petugasIds || [],
      lokasi: data.lokasi || 'Pos Utama Gerbang Depan',
      catatan: data.catatan || ''
    }
    const updated = [newItem, ...jadwalSatpam]
    setJadwalSatpam(updated)
    await saveStorageItem(STORAGE_KEYS.JADWAL_SATPAM, updated)
    return { success: true, jadwal: newItem }
  }

  const updateJadwalShift = async (id, data) => {
    const updated = jadwalSatpam.map((j) => (j.id === id ? { ...j, ...data } : j))
    setJadwalSatpam(updated)
    await saveStorageItem(STORAGE_KEYS.JADWAL_SATPAM, updated)
    return { success: true }
  }

  const hapusJadwalShift = async (id) => {
    const updated = jadwalSatpam.filter((j) => j.id !== id)
    setJadwalSatpam(updated)
    await saveStorageItem(STORAGE_KEYS.JADWAL_SATPAM, updated)
    return { success: true }
  }

  const tambahPetugasSatpam = async (data) => {
    const newId = `sec-${Date.now()}`
    const newItem = {
      id: newId,
      nama: data.nama || 'Petugas Satpam',
      jabatan: data.jabatan || 'Anggota Pengamanan',
      telepon: data.telepon || '',
      wa: data.wa || data.telepon || '',
      foto: data.foto || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      status: data.status || 'Aktif',
      posUtama: data.posUtama || 'Pos Utama Gerbang Depan'
    }
    const updated = [newItem, ...petugasSatpam]
    setPetugasSatpam(updated)
    await saveStorageItem(STORAGE_KEYS.PETUGAS_SATPAM, updated)
    return { success: true, petugas: newItem }
  }

  const updatePetugasSatpam = async (id, data) => {
    const updated = petugasSatpam.map((p) => (p.id === id ? { ...p, ...data } : p))
    setPetugasSatpam(updated)
    await saveStorageItem(STORAGE_KEYS.PETUGAS_SATPAM, updated)
    return { success: true }
  }

  const hapusPetugasSatpam = async (id) => {
    const updated = petugasSatpam.filter((p) => p.id !== id)
    setPetugasSatpam(updated)
    await saveStorageItem(STORAGE_KEYS.PETUGAS_SATPAM, updated)
    return { success: true }
  }

  // Helper for Bank & QRIS CRUD permissions
  const canUserManageBankOrQris = (item = null) => {
    if (isWarga) return false
    // Bendahara dan Admin bisa kelola SEMUA
    if (isAdmin || isBendahara || officialJabatan === 'admin' || officialJabatan === 'bendahara') return true
    
    // Ketua RW: hanya rekening di wilayah RW-nya atau RT di bawah RW-nya
    if (isRW || officialJabatan === 'rw') {
      if (!item) return true
      if (item.owner_type === 'RW') {
        return !item.owner_id || item.owner_id === 'RW' || item.owner_id === userRwId
      }
      if (item.owner_type === 'RT') {
        const rtObj = rts.find((r) => r.id === item.owner_id)
        if (rtObj) return rtObj.rw_id === userRwId
        const rwNum = (userRwId || 'rw-01').replace('rw-', '')
        return item.owner_id?.startsWith(`rt-${rwNum}-`) || item.owner_id?.includes(userRwId)
      }
      return false
    }

    // Ketua RT: hanya rekening di wilayah RT-nya sendiri
    if (isRT || officialJabatan === 'rt') {
      if (!item) return true
      return item.owner_type === 'RT' && item.owner_id === userRtId
    }

    return false
  }

  // Bank Accounts CRUD
  const addBankAccount = async (data) => {
    if (isWarga) {
      return { success: false, message: 'Warga tidak memiliki akses menambah rekening.' }
    }
    if (!canUserManageBankOrQris(null)) {
      return { success: false, message: 'Anda tidak memiliki hak akses menambah rekening.' }
    }

    let finalOwnerType = data.owner_type || 'RT'
    let finalOwnerId = data.owner_id || userRtId

    if (isRT || officialJabatan === 'rt') {
      finalOwnerType = 'RT'
      finalOwnerId = userRtId
    } else if (isRW || officialJabatan === 'rw') {
      if (finalOwnerType === 'RW') {
        finalOwnerId = userRwId
      }
    }

    const newId = `ba-${Date.now()}`
    const newItem = {
      id: newId,
      owner_type: finalOwnerType,
      owner_id: finalOwnerId,
      bank_name: data.bank_name || 'BCA',
      account_number: data.account_number || '',
      account_holder: data.account_holder || '',
      is_primary: data.is_primary || false,
      is_active: true
    }
    let updated = [...bankAccounts]
    if (newItem.is_primary) {
      updated = updated.map((b) => (b.owner_type === newItem.owner_type && b.owner_id === newItem.owner_id ? { ...b, is_primary: false } : b))
    }
    updated = [newItem, ...updated]
    setBankAccounts(updated)
    await saveStorageItem(STORAGE_KEYS.BANK_ACCOUNTS, updated)
    return { success: true, account: newItem }
  }

  const updateBankAccount = async (id, data) => {
    const existing = bankAccounts.find((b) => b.id === id)
    if (!existing) return { success: false, message: 'Rekening tidak ditemukan.' }
    if (!canUserManageBankOrQris(existing)) {
      return { success: false, message: 'Anda tidak memiliki wewenang untuk mengubah rekening ini.' }
    }

    let updated = bankAccounts.map((b) => (b.id === id ? { ...b, ...data } : b))
    if (data.is_primary) {
      const target = updated.find((b) => b.id === id)
      if (target) {
        updated = updated.map((b) => (b.id !== id && b.owner_type === target.owner_type && b.owner_id === target.owner_id ? { ...b, is_primary: false } : b))
      }
    }
    setBankAccounts(updated)
    await saveStorageItem(STORAGE_KEYS.BANK_ACCOUNTS, updated)
    return { success: true }
  }

  const deleteBankAccount = async (id) => {
    const existing = bankAccounts.find((b) => b.id === id)
    if (!existing) return { success: false, message: 'Rekening tidak ditemukan.' }
    if (!canUserManageBankOrQris(existing)) {
      return { success: false, message: 'Anda tidak memiliki wewenang untuk menghapus rekening ini.' }
    }

    const updated = bankAccounts.filter((b) => b.id !== id)
    setBankAccounts(updated)
    await saveStorageItem(STORAGE_KEYS.BANK_ACCOUNTS, updated)
    await deleteFromSupabase(STORAGE_KEYS.BANK_ACCOUNTS, id)
    return { success: true }
  }

  // QRIS Accounts CRUD
  const addQrisAccount = async (data) => {
    if (isWarga) {
      return { success: false, message: 'Warga tidak memiliki akses menambah QRIS.' }
    }
    if (!canUserManageBankOrQris(null)) {
      return { success: false, message: 'Anda tidak memiliki hak akses menambah QRIS.' }
    }

    let finalOwnerType = data.owner_type || 'RT'
    let finalOwnerId = data.owner_id || userRtId

    if (isRT || officialJabatan === 'rt') {
      finalOwnerType = 'RT'
      finalOwnerId = userRtId
    } else if (isRW || officialJabatan === 'rw') {
      if (finalOwnerType === 'RW') {
        finalOwnerId = userRwId
      }
    }

    const newId = `qris-${Date.now()}`
    const newItem = {
      id: newId,
      owner_type: finalOwnerType,
      owner_id: finalOwnerId,
      qris_name: data.qris_name || 'QRIS Utama',
      nmid: data.nmid || '',
      image_url: data.image_url || '',
      is_primary: data.is_primary || false,
      is_active: true
    }
    let updated = [...qrisAccounts]
    if (newItem.is_primary) {
      updated = updated.map((q) => (q.owner_type === newItem.owner_type && q.owner_id === newItem.owner_id ? { ...q, is_primary: false } : q))
    }
    updated = [newItem, ...updated]
    setQrisAccounts(updated)
    await saveStorageItem(STORAGE_KEYS.QRIS_ACCOUNTS, updated)
    return { success: true, qris: newItem }
  }

  const updateQrisAccount = async (id, data) => {
    const existing = qrisAccounts.find((q) => q.id === id)
    if (!existing) return { success: false, message: 'QRIS tidak ditemukan.' }
    if (!canUserManageBankOrQris(existing)) {
      return { success: false, message: 'Anda tidak memiliki wewenang untuk mengubah QRIS ini.' }
    }

    let updated = qrisAccounts.map((q) => (q.id === id ? { ...q, ...data } : q))
    if (data.is_primary) {
      const target = updated.find((q) => q.id === id)
      if (target) {
        updated = updated.map((q) => (q.id !== id && q.owner_type === target.owner_type && q.owner_id === target.owner_id ? { ...q, is_primary: false } : q))
      }
    }
    setQrisAccounts(updated)
    await saveStorageItem(STORAGE_KEYS.QRIS_ACCOUNTS, updated)
    return { success: true }
  }

  const deleteQrisAccount = async (id) => {
    const existing = qrisAccounts.find((q) => q.id === id)
    if (!existing) return { success: false, message: 'QRIS tidak ditemukan.' }
    if (!canUserManageBankOrQris(existing)) {
      return { success: false, message: 'Anda tidak memiliki wewenang untuk menghapus QRIS ini.' }
    }

    const updated = qrisAccounts.filter((q) => q.id !== id)
    setQrisAccounts(updated)
    await saveStorageItem(STORAGE_KEYS.QRIS_ACCOUNTS, updated)
    await deleteFromSupabase(STORAGE_KEYS.QRIS_ACCOUNTS, id)
    return { success: true }
  }

  // Notifications Management
  const addNotification = async (data) => {
    const newItem = {
      id: data.id || `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: data.userId || null,
      residentId: data.residentId || null,
      targetRole: data.targetRole || null,
      targetRtId: data.targetRtId || null,
      targetRwId: data.targetRwId || null,
      title: data.title || 'Notifikasi Baru',
      message: data.message || '',
      type: data.type || 'info',
      tagihanId: data.tagihanId || null,
      suratId: data.suratId || null,
      aduanId: data.aduanId || null,
      eventId: data.eventId || null,
      screen: data.screen || null,
      read: false,
      created_at: new Date().toISOString()
    }

    const updated = [newItem, ...notifications]
    setNotifications(updated)
    await saveStorageItem(STORAGE_KEYS.NOTIFICATIONS, updated)

    // Sync to Supabase wargaku_notifications bila terhubung
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('wargaku_notifications').upsert({
          id: newItem.id,
          data: newItem,
          updated_at: new Date().toISOString()
        })
      } catch (sbErr) {
        // Non-blocking background sync
      }
    }

    // Tentukan apakah user saat ini berhak menerima notifikasi lokal di perangkat
    const shouldAlert = typeof isNotificationRelevantForUser === 'function'
      ? isNotificationRelevantForUser(newItem, currentUser, currentWarga)
      : true
    if (shouldAlert) {
      const channelId = (newItem.type === 'tagihan' || newItem.type?.startsWith('payment'))
        ? 'ipl-tagihan'
        : (newItem.type === 'surat' || newItem.type === 'event' || newItem.type === 'pengaduan')
        ? 'ipl-pengumuman'
        : 'ipl-default'

      sendLocalNotification({
        title: newItem.title,
        body: newItem.message,
        data: {
          id: newItem.id,
          type: newItem.type,
          targetId: newItem.tagihanId || newItem.suratId || newItem.aduanId || newItem.eventId,
          screen: newItem.screen || (newItem.tagihanId ? 'Tagihan' : newItem.suratId ? 'Surat' : newItem.aduanId ? 'Pengaduan' : newItem.eventId ? 'Events' : 'Dashboard')
        },
        channelId
      }).catch(() => {})
    }

    return { success: true, notification: newItem }
  }

  const markNotificationRead = async (id) => {
    let hasChanges = false
    setNotifications((prev) => {
      const updated = prev.map((n) => {
        if (n.id === id && !n.read) {
          hasChanges = true
          return { ...n, read: true }
        }
        return n
      })
      if (hasChanges) {
        saveStorageItem(STORAGE_KEYS.NOTIFICATIONS, updated).catch(() => {})
        return updated
      }
      return prev
    })
    return { success: true }
  }

  const markAllNotificationsRead = async () => {
    let hasChanges = false
    setNotifications((prev) => {
      const updated = prev.map((n) => {
        const isRel = typeof isNotificationRelevantForUser === 'function'
          ? isNotificationRelevantForUser(n, currentUser, currentWarga)
          : true
        if (isRel && !n.read) {
          hasChanges = true
          return { ...n, read: true }
        }
        return n
      })
      if (hasChanges) {
        saveStorageItem(STORAGE_KEYS.NOTIFICATIONS, updated).catch(() => {})
        return updated
      }
      return prev
    })
    return { success: true }
  }

  // Audit Logs Management
  const addAuditLog = async (data) => {
    const newLog = {
      id: `audit-${Date.now()}`,
      userId: currentUser?.id || 'sys',
      userName: currentUser?.name || 'Sistem',
      userRole: currentUser?.role || 'system',
      action: data.action || 'ACTIVITY',
      entity: data.entity || 'general',
      entityId: data.entityId || null,
      details: data.details || '',
      created_at: new Date().toISOString()
    }
    const updated = [newLog, ...auditLogs]
    setAuditLogs(updated)
    saveStorageItem(STORAGE_KEYS.AUDIT_LOGS, updated)
    return { success: true, log: newLog }
  }

  const handleResetData = async () => {
    await resetAllStorageToDefault()
    const initial = await loadInitialStorage()
    setConfig(initial.config)
    setJenisIuran(initial.jenisIuran)
    setWarga(initial.warga)
    setTagihan(initial.tagihan)
    setKas(initial.kas)
    setEvents(initial.events)
    setTagihanEvents(initial.tagihanEvents)
    setUsers(initial.users)
    setRts(initial.rts)
    setPengaduan(initial.pengaduan)
    setSurat(initial.surat)
    setKontakDarurat(initial.kontakDarurat)
    setAdminAuth(initial.adminAuth)
    setBankAccounts(initial.bankAccounts)
    setQrisAccounts(initial.qrisAccounts)
    setNotifications(initial.notifications)
    setAuditLogs(initial.auditLogs)
    return { success: true }
  }

  return (
    <AppContext.Provider
      value={{
        loading,
        refreshing,
        refreshData,
        currentUser,
        login,
        logout,
        activeMode,
        setActiveMode,
        toggleActiveMode,
        switchActiveRole,
        switchDemoAccount,
        activeRoleOverride,
        hasDualRole,
        hasJabatan,
        officialJabatan,
        effectiveRole,
        currentRole: effectiveRole,
        userJabatan,
        jabatanLabel,
        jabatanShortLabel,
        jabatanTheme,
        isAdmin,
        isRT,
        isRW,
        isBendahara,
        isPengurus,
        isSuperAdmin,
        isWarga,
        isAdminLoggedIn,
        currentRT,
        currentRW,
        userRtId,
        userRwId,
        scopedRts,
        currentWarga,
        config,
        updateConfig,
        rts,
        rws,
        addRtData,
        updateRtData,
        deleteRtData,
        users,
        addUserAccount,
        updateUserAccount,
        deleteUserAccount,
        jenisIuran,
        addJenisIuran,
        updateJenisIuran,
        toggleJenisIuran,
        deleteJenisIuran,
        handleResetData,
        warga,
        scopedWarga,
        tagihan,
        scopedTagihan,
        kas,
        scopedKas,
        events,
        scopedEvents,
        tagihanEvents,
        pengaduan,
        scopedPengaduan,
        surat,
        scopedSurat,
        kontakDarurat,
        scopedKontakDarurat,
        tambahKontakDarurat,
        updateKontakDarurat,
        hapusKontakDarurat,
        jadwalSatpam,
        petugasSatpam,
        tambahJadwalShift,
        updateJadwalShift,
        hapusJadwalShift,
        tambahPetugasSatpam,
        updatePetugasSatpam,
        hapusPetugasSatpam,
        bankAccounts,
        addBankAccount,
        updateBankAccount,
        deleteBankAccount,
        qrisAccounts,
        addQrisAccount,
        updateQrisAccount,
        deleteQrisAccount,
        notifications,
        addNotification,
        markNotificationRead,
        markAllNotificationsRead,
        auditLogs,
        addAuditLog,
        generateTagihanMassal,
        addTagihanManual,
        updateTagihan,
        tambahTagihanBiasaMassal,
        batalBayarTagihan,
        deleteTagihan,
        deleteTagihanBulk,
        bayarTagihan,
        bayarTagihanOtomatisMoota,
        verifikasiTagihan,
        tambahWarga,
        verifikasiWargaBaru,
        updateWarga,
        updateCurrentUser,
        hapusWarga,
        tambahKas,
        deleteKas,
        buatPengaduan,
        bacaPengaduan,
        tanggapiPengaduan,
        updatePengaduan,
        ajukanSurat,
        bacaSurat,
        balasSurat,
        updateSurat,
        isSuratUnread,
        isPengaduanUnread,
        suratUnreadCount,
        aduanUnreadCount,
        totalLayananUnreadCount,
        tambahEvent,
        hapusEvent,
        generateTagihanEventMassal,
        bayarTagihanEvent,
        tolakTagihanEvent,
        deleteTagihanEvent,
        updateAutoBillingConfig,
        triggerManualBillingCatchUp,
        calculateNextRunDate,
        // Push Notification & Laravel API Integration
        expoPushToken,
        laravelApiUrl,
        setLaravelApiUrl: async (newUrl) => {
          await saveLaravelApiUrl(newUrl)
          setLaravelApiUrlState(newUrl || 'http://10.0.2.2:8000')
          if (expoPushToken && currentUser) {
            await syncPushTokenWithBackend(expoPushToken, currentUser)
          }
          return { success: true }
        },
        notificationPermissionStatus,
        refreshPushToken: async () => {
          const reg = await registerForPushNotificationsAsync()
          if (reg.success && reg.token) {
            setExpoPushToken(reg.token)
            setNotificationPermissionStatus(reg.permissionStatus)
            if (currentUser) {
              await syncPushTokenWithBackend(reg.token, currentUser)
            }
            return { success: true, token: reg.token }
          }
          return { success: false, reason: reg.reason }
        },
        testSendPushNotification: async (customTitle = null, customBody = null) => {
          let currentToken = expoPushToken
          if (!currentToken) {
            const reg = await registerForPushNotificationsAsync()
            if (reg.success && reg.token) {
              currentToken = reg.token
              setExpoPushToken(reg.token)
              setNotificationPermissionStatus(reg.permissionStatus)
              if (currentUser) syncPushTokenWithBackend(reg.token, currentUser)
            } else {
              return { success: false, message: reg.reason || 'Izin notifikasi belum diaktifkan.' }
            }
          }

          const title = customTitle || '🔔 Uji Push Notifikasi IPL Warga'
          const body = customBody || 'Notifikasi push berhasil terhubung dari sistem backend IPL Warga!'

          // 1. Coba kirim via Laravel API
          const apiUrl = await getLaravelApiUrl()
          try {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 5000)
            const res = await fetch(`${apiUrl}/api/notifications/test`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
              body: JSON.stringify({
                token: currentToken,
                title,
                body,
                user_id: currentUser?.id
              }),
              signal: controller.signal
            })
            clearTimeout(timeoutId)

            if (res.ok) {
              return {
                success: true,
                via: 'laravel',
                message: 'Push notification berhasil dikirim melalui Laravel API!'
              }
            }
          } catch (_) {}

          // 2. Fallback notifikasi lokal pada perangkat
          await sendLocalNotification({
            title,
            body,
            data: { screen: 'Tagihan' }
          })
          return {
            success: true,
            via: 'local',
            message: 'Notifikasi berhasil dipicu langsung pada perangkat ini!'
          }
        }
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
