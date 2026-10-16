/**
 * Moota Payment & Mutation Verification Service for Wargaku IPL
 * Mendukung Sandbox & Live Account Moota dengan perlindungan keamanan data mutasi.
 */
import AsyncStorage from '@react-native-async-storage/async-storage'
import { supabase, isSupabaseConfigured } from '../api/supabase.js'

const FALLBACK_MOOTA_TOKEN =
  'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiJucWllNHN3OGxsdyIsImp0aSI6ImZlMTIyMzRlYzNjZmVkNjVhOTIyNDRkZmEwZDY3OGQ4YzQ2ZTU2OGU4NmZlZGNjMjJlZmQ2YTZhNmRhZGE3MmNiOTMyYjYyZjljYTVhYWZkIiwiaWF0IjoxNzkxNTM0MjY0Ljg0Nzc1NiwibmJmIjoxNzkxNTM0MjY0Ljg0Nzc2NywiZXhwIjoxODIzMDcwMjY0Ljg0MjczOSwic3ViIjoiNDYwMjIiLCJzY29wZXMiOlsiYXBpIiwidXNlciIsInVzZXJfcmVhZCIsImJhbmsiLCJiYW5rX3JlYWQiLCJtdXRhdGlvbiIsIm11dGF0aW9uX3JlYWQiXX0.cMZn2ocAg8po3P8bFbEklNyOnfTemUEXfWmJop0rwF8iXht6efMnxFaYYGkF62MqQg6nV5NjI_gd2PoFJ7LxnV_CLtkNlyiAsiUgp3Ofquh5V89fIfjp_u8yoFeqQdop3M5jW-ejL_7vLvq7DDh0zKacdvpXiamJeHIv-eAYNHFdevILEs_y3AdmzLz-QPBIwW33Jw8q2A8FCPdyEIQZzdfRjmy3MkR_31397WbjyCMZu8LlXwHcJ-wMW2lP0-EG5pGPHE3-YstpyjFALilYMTA7Faa-wU1UK0cOneclZC6ONoN8PA5Go1kTAAI0FgeVqNahZ0vxaY9vDVgrUxg_YhaD924J0DAP9kwXNIxmPNG4NoP9nDhIbAWlrmEK2Or4bWp--dI72lZBJfIuAKZTAt1jz3xDymcsKwfzwefMc9LwU0QKhgdequXub-ep9Q6mm-VfqtNi6IE9t68w0W1KFNBnUKBeSa1WovdlYHJ7-9hEu-gMtV4wTAurS9KHtphWLwzMcM4gCYdh2lC70rwSQLLQcVk7cktUSi4V8KIBNqywa4FvwRS26sRZjqkwkdqjeoM-PCDuCCC4EU9B-a8VCrwlVLOZJ_f-l_ueyOiugwbfL5L6XwtNIy9KsW3FXnCUuIA0kmGeclbAHXK19RVxuZ3m-dXSn3M5OHPfnxzOTXw'

export const DEFAULT_MOOTA_CONFIG = {
  API_URL: process.env.EXPO_PUBLIC_MOOTA_URL || 'https://app.moota.co/api/v2',
  API_TOKEN: process.env.EXPO_PUBLIC_MOOTA_TOKEN || FALLBACK_MOOTA_TOKEN,
  BANK_ID: process.env.EXPO_PUBLIC_MOOTA_BANK_ID || 'Lagzqp0Pk42',
  BANK_ACCOUNT_NUMBER: '090908080777',
  BANK_HOLDER_NAME: 'Rafi Nurrahman',
  BANK_LABEL: 'Bank Transfer (Sandbox)',
  IS_ACTIVE: true
}

const STORAGE_MOOTA_CONFIG = 'wargaku_moota_config'

/**
 * Ambil konfigurasi Moota dari storage atau default environment
 */
export async function getMootaConfig() {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_MOOTA_CONFIG)
    if (saved) {
      const parsed = JSON.parse(saved)
      const validToken = (parsed.API_TOKEN && parsed.API_TOKEN.trim().length > 20)
        ? parsed.API_TOKEN.trim()
        : DEFAULT_MOOTA_CONFIG.API_TOKEN

      return {
        ...DEFAULT_MOOTA_CONFIG,
        ...parsed,
        BANK_ACCOUNT_NUMBER: parsed.BANK_ACCOUNT_NUMBER || '090908080777',
        BANK_HOLDER_NAME: parsed.BANK_HOLDER_NAME || 'Rafi Nurrahman',
        API_TOKEN: validToken
      }
    }
  } catch (err) {
    console.warn('Gagal membaca config moota:', err)
  }
  return DEFAULT_MOOTA_CONFIG
}

/**
 * Simpan konfigurasi Moota
 */
export async function saveMootaConfig(config) {
  try {
    await AsyncStorage.setItem(STORAGE_MOOTA_CONFIG, JSON.stringify(config))
    return true
  } catch (err) {
    console.warn('Gagal menyimpan config moota:', err)
    return false
  }
}

/**
 * Ambil data akun Bank resmi langsung dari API Moota
 */
export async function getMootaBankDetail() {
  try {
    const config = await getMootaConfig()
    if (!config.API_TOKEN) {
      return {
        id: config.BANK_ID,
        bank_id: config.BANK_ID,
        bank_name: config.BANK_LABEL,
        account_number: config.BANK_ACCOUNT_NUMBER,
        account_holder: config.BANK_HOLDER_NAME,
        username: 'nurrahmanrafi78'
      }
    }

    const res = await fetch(`${config.API_URL}/bank`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${config.API_TOKEN}`
      }
    })

    if (res.ok) {
      const data = await res.json()
      const banks = data?.data || (Array.isArray(data) ? data : [])
      const matched = banks.find((b) => b.bank_id === config.BANK_ID || b.token === config.BANK_ID || b.id === config.BANK_ID) || banks[0]
      if (matched) {
        return {
          id: matched.bank_id || matched.token || config.BANK_ID,
          bank_id: matched.bank_id || matched.token || config.BANK_ID,
          bank_name: matched.label || matched.bank_type || config.BANK_LABEL,
          account_number: matched.account_number || '090908080777',
          account_holder: matched.atas_nama || matched.username || 'Rafi Nurrahman',
          username: matched.username || 'nurrahmanrafi78',
          balance: matched.balance || '0.00',
          icon: matched.icon
        }
      }
    }
  } catch (e) {
    console.warn('Gagal fetch live bank detail dari Moota, menggunakan default:', e)
  }

  return {
    id: DEFAULT_MOOTA_CONFIG.BANK_ID,
    bank_id: DEFAULT_MOOTA_CONFIG.BANK_ID,
    bank_name: DEFAULT_MOOTA_CONFIG.BANK_LABEL,
    account_number: DEFAULT_MOOTA_CONFIG.BANK_ACCOUNT_NUMBER,
    account_holder: DEFAULT_MOOTA_CONFIG.BANK_HOLDER_NAME,
    username: 'nurrahmanrafi78',
    balance: '0.00'
  }
}

/**
 * Cek Koneksi & Profil Bank Sandbox di Moota (Khusus Admin)
 */
export async function testMootaConnection() {
  try {
    const config = await getMootaConfig()
    if (!config.API_TOKEN) {
      return {
        success: false,
        message: 'Token API Moota belum diatur. Silakan masukkan token API terlebih dahulu.'
      }
    }

    const response = await fetch(`${config.API_URL}/bank`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${config.API_TOKEN}`
      }
    })

    if (!response.ok) {
      const errText = await response.text()
      return {
        success: false,
        message: `HTTP Error ${response.status}: ${errText || response.statusText}`
      }
    }

    const data = await response.json()
    const banks = data?.data || (Array.isArray(data) ? data : [])
    const activeBank = banks.find((b) => b.bank_id === config.BANK_ID || b.id === config.BANK_ID) || banks[0]

    // Cek juga info user dan poin
    let userProfile = null
    try {
      const uRes = await fetch(`${config.API_URL}/user`, {
        headers: { Accept: 'application/json', Authorization: `Bearer ${config.API_TOKEN}` }
      })
      if (uRes.ok) {
        userProfile = await uRes.json()
      }
    } catch (_) {}

    return {
      success: true,
      message: 'Koneksi ke Moota Sandbox Berhasil!',
      banks: banks,
      activeBank: activeBank,
      user: userProfile
    }
  } catch (error) {
    return {
      success: false,
      message: error?.message || 'Gagal menghubungi server Moota'
    }
  }
}

/**
 * Tarik seluruh daftar mutasi dari Moota API (Khusus Admin/Pengurus)
 * @param {string} [type] 'CR' (uang masuk) | 'DB' (uang keluar) | 'all'
 * @param {number} [perPage] jumlah mutasi per request (default: 50)
 */
export async function fetchMootaMutations(type = 'all', perPage = 50) {
  try {
    const config = await getMootaConfig()
    if (!config.API_TOKEN) {
      return {
        success: false,
        message: 'Token Moota belum dikonfigurasi.',
        data: []
      }
    }

    // Menggunakan query param ?bank= sesuai OpenAPI Moota v2
    let url = `${config.API_URL}/mutation?bank=${config.BANK_ID}&per_page=${perPage}`
    if (type && type !== 'all') {
      url += `&type=${type.toUpperCase()}`
    }

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${config.API_TOKEN}`
      }
    })

    if (!res.ok) {
      return {
        success: false,
        message: `Gagal membaca mutasi (${res.status})`,
        data: []
      }
    }

    const json = await res.json()
    const mutations = json?.data || (Array.isArray(json) ? json : [])

    return {
      success: true,
      total: json?.total ?? mutations.length,
      data: mutations
    }
  } catch (error) {
    return {
      success: false,
      message: error?.message || 'Gagal mengambil mutasi dari Moota',
      data: []
    }
  }
}

/**
 * Cek Mutasi Transfer Masuk di Moota berdasarkan nominal persis (termasuk 3 digit kode unik warga)
 * Aman: Hanya mengembalikan status pencocokan tanpa mengekspos mutasi rekening warga lain.
 * @param {number} targetAmount Nominal persis yang dicari (contoh: 120101)
 * @param {string} [customBankId] Bank ID opsional
 */
export async function checkMootaMutation(targetAmount, customBankId = null) {
  try {
    const targetNominal = Number(targetAmount)
    if (isNaN(targetNominal) || targetNominal <= 0) {
      return { found: false, message: 'Nominal tidak valid.' }
    }

    // 1. Opsi Aman: Coba panggil Backend Edge Function jika terpasang di Supabase
    if (isSupabaseConfigured && supabase?.functions) {
      try {
        const { data: edgeRes, error: edgeErr } = await supabase.functions.invoke('verify-moota', {
          body: { amount: targetNominal, bank_id: customBankId }
        })
        if (!edgeErr && edgeRes && typeof edgeRes.found === 'boolean') {
          return edgeRes
        }
      } catch (fnErr) {
        // Fallback ke direct sandbox call jika edge function belum dideploy
      }
    }

    // 2. Direct Call (Sandbox / Client mode)
    const config = await getMootaConfig()
    const bankId = customBankId || config.BANK_ID

    if (!config.API_TOKEN) {
      return {
        found: false,
        message: 'Layanan pengecekan otomatis belum diaktifkan oleh pengurus. Silakan upload bukti bayar manual.'
      }
    }

    const url = `${config.API_URL}/mutation?bank=${bankId}`
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${config.API_TOKEN}`
      }
    })

    if (!res.ok) {
      return {
        found: false,
        message: `Gagal membaca mutasi dari Moota (${res.status})`
      }
    }

    const json = await res.json()
    const mutations = json?.data || (Array.isArray(json) ? json : [])

    // Cari mutasi CR (Credit / Uang Masuk) dengan nominal yang persis sama
    const match = mutations.find((m) => {
      const rawAmt = String(m.amount || m.nominal || 0).replace(/[^0-9.]/g, '')
      const amt = Math.round(parseFloat(rawAmt) || 0)
      const typeStr = String(m.type || '').toUpperCase()
      const isCredit = typeStr === 'CR' || typeStr === 'CREDIT' || typeStr === 'MASUK' || (!typeStr && amt > 0)
      return isCredit && amt === targetNominal
    })

    if (match) {
      // Sanitasi data: Hanya kembalikan metadata transaksi yang cocok, jangan expose mutasi lainnya
      return {
        found: true,
        mutation: {
          id: match.id || match.mutation_id,
          amount: targetNominal,
          date: match.date || match.created_at || new Date().toISOString(),
          type: 'CR'
        },
        message: `Mutasi transfer sebesar Rp ${targetNominal.toLocaleString('id-ID')} ditemukan!`
      }
    }

    return {
      found: false,
      message: `Belum ada mutasi masuk sebesar Rp ${targetNominal.toLocaleString('id-ID')}. Pastikan Anda sudah transfer dengan nominal yang persis.`
    }
  } catch (error) {
    console.warn('Error checking Moota mutation:', error)
    return {
      found: false,
      error: true,
      message: error?.message || 'Gagal memeriksa mutasi transfer di Moota.'
    }
  }
}
