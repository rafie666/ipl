import { verifyPassword, hashPassword, normalizeUsername } from '../utils/crypto'

export function generateSessionToken(user) {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 10)
  return `wargaku_jwt_${user.role}_${user.id}_${timestamp}_${random}`
}

export async function apiLogin({ username, password, users = [], adminAuth = null }) {
  const inputUser = (username || '').trim().toLowerCase()
  const inputPass = (password || '').trim()

  if (!inputUser || !inputPass) {
    return { success: false, message: 'Username dan kata sandi wajib diisi!' }
  }

  // 1. Cari di daftar users (warga, rt, admin)
  const matchedUser = users.find((u) => {
    const uName = (u.username || '').toLowerCase()
    const matchAlias = u.aliases && u.aliases.map((a) => a.toLowerCase()).includes(inputUser)
    return uName === inputUser || matchAlias
  })

  if (matchedUser) {
    let isMatch = false
    const targetHash =
      matchedUser.password_hash || (matchedUser.password ? await hashPassword(matchedUser.password) : '')

    if (targetHash) {
      isMatch = await verifyPassword(inputPass, targetHash)
    }

    if (isMatch) {
      if (matchedUser.status === 'pending_approval' || matchedUser.status === 'pending') {
        return {
          success: false,
          isPendingApproval: true,
          message: 'Pendaftaran akun Anda masih menunggu persetujuan (verifikasi) oleh Pengurus RT setempat. Mohon tunggu atau hubungi Ketua RT Anda.'
        }
      }

      if (matchedUser.status === 'ditolak' || matchedUser.status === 'rejected') {
        return {
          success: false,
          message: 'Pendaftaran akun Anda ditolak oleh Pengurus RT. Silakan hubungi Ketua RT untuk konfirmasi.'
        }
      }

      if (matchedUser.status === 'inactive' || matchedUser.status === 'nonaktif') {
        return {
          success: false,
          message: 'Akun Anda sedang dinonaktifkan oleh pengurus lingkungan.'
        }
      }

      const sanitizedUser = {
        id: matchedUser.id,
        username: matchedUser.username,
        name: matchedUser.name || matchedUser.username,
        role: matchedUser.role, // 'admin' | 'rt' | 'warga'
        resident_id: matchedUser.resident_id || null,
        rt_id: matchedUser.rt_id || null,
        status: matchedUser.status || 'active'
      }

      const token = generateSessionToken(sanitizedUser)
      return {
        success: true,
        token,
        user: sanitizedUser
      }
    }
  }

  // 2. Fallback cek adminAuth jika custom admin diatur
  if (
    adminAuth &&
    (inputUser === (adminAuth.username || 'admin').toLowerCase() || inputUser === 'admin@ipl.test')
  ) {
    const targetAdminHash =
      adminAuth.password_hash || (adminAuth.password ? await hashPassword(adminAuth.password) : '')
    const isPassOk = targetAdminHash ? await verifyPassword(inputPass, targetAdminHash) : false

    if (isPassOk) {
      const adminUser = {
        id: 'u-admin',
        username: adminAuth.username || 'admin',
        name: 'Super Administrator',
        role: 'admin',
        resident_id: null,
        rt_id: null,
        status: 'active'
      }
      const token = generateSessionToken(adminUser)
      return {
        success: true,
        token,
        user: adminUser
      }
    }
  }

  // 3. Fallback login RT 02 / RT 03
  if (inputPass === 'password') {
    if (inputUser === 'rt02' || inputUser === 'rt2' || inputUser === 'rt-2') {
      const rt2User = {
        id: 'u-rt-2',
        username: 'rt02',
        name: 'Bpk. Hendra Wijaya (Ketua RT 02)',
        role: 'rt',
        resident_id: null,
        rt_id: 'rt-2',
        status: 'active'
      }
      return { success: true, token: generateSessionToken(rt2User), user: rt2User }
    }
    if (inputUser === 'rt03' || inputUser === 'rt3' || inputUser === 'rt-3') {
      const rt3User = {
        id: 'u-rt-3',
        username: 'rt03',
        name: 'Bpk. Agus Salim (Ketua RT 03)',
        role: 'rt',
        resident_id: null,
        rt_id: 'rt-3',
        status: 'active'
      }
      return { success: true, token: generateSessionToken(rt3User), user: rt3User }
    }
  }

  // 4. Fallback login warga dari database seed (NIK, nama slug, kode unik, ID, no HP)
  if (Array.isArray(residents) && residents.length > 0 && inputPass === 'password') {
    const matchedResident = residents.find((r) => {
      const rId = (r.id || '').toLowerCase()
      const rNik = (r.nik || '').toLowerCase()
      const rHp = (r.noHp || '').replace(/[^0-9]/g, '')
      const rName = (r.nama || '').toLowerCase()
      const rUserSlug = rName.replace(/[^a-z0-9]/g, '.')
      const rKode = (r.kodeUnik || '').toLowerCase()
      const rFirstName = rName.split(' ')[0]
      return (
        inputUser === rId ||
        inputUser === rNik ||
        (rHp && inputUser === rHp) ||
        inputUser === rName ||
        inputUser === rUserSlug ||
        inputUser === rKode ||
        inputUser === rFirstName
      )
    })

    if (matchedResident) {
      const wargaUser = {
        id: `u-${matchedResident.id}`,
        username: matchedResident.nama.toLowerCase().replace(/[^a-z0-9]/g, '.'),
        name: `${matchedResident.nama} (Warga Blok ${matchedResident.blok}-${matchedResident.noRumah})`,
        role: 'warga',
        resident_id: matchedResident.id,
        rt_id: matchedResident.rt_id,
        status: matchedResident.aktif === false ? 'inactive' : 'active'
      }
      const token = generateSessionToken(wargaUser)
      return {
        success: true,
        token,
        user: wargaUser
      }
    }
  }

  return {
    success: false,
    message: 'Username atau kata sandi salah. Silakan periksa kembali!'
  }
}

export function filterResidentsByRole(residents = [], currentUser = null) {
  if (!currentUser) return []
  if (currentUser.role === 'admin') return residents
  if (currentUser.role === 'rt') {
    return residents.filter((r) => r.rt_id === currentUser.rt_id)
  }
  if (currentUser.role === 'warga') {
    return residents.filter((r) => r.id === currentUser.resident_id)
  }
  return []
}

export function filterBillsByRole(bills = [], residents = [], currentUser = null) {
  if (!currentUser) return []
  if (currentUser.role === 'admin') return bills

  if (currentUser.role === 'rt') {
    const rtResidents = residents.filter((r) => r.rt_id === currentUser.rt_id)
    const rtResidentIds = new Set(rtResidents.map((r) => r.id))
    // RT hanya mengelola tagihan tingkat RT untuk warganya sendiri (bukan tagihan RW atau RT lain)
    return bills.filter((b) => {
      if (!rtResidentIds.has(b.wargaId)) return false
      return b.payment_scope === 'RT' || (!b.payment_scope && (!b.target_payment_owner || b.target_payment_owner === currentUser.rt_id))
    })
  }

  if (currentUser.role === 'warga') {
    const myResident = residents.find((r) => r.id === currentUser.resident_id)
    const myRtId = myResident?.rt_id || currentUser.rt_id
    return bills.filter((b) => {
      // Hanya tagihan untuk warga ini
      if (b.wargaId !== currentUser.resident_id) return false
      // Tagihan RW: wajib bayar tingkat RW
      if (b.payment_scope === 'RW') return true
      // Tagihan RT: hanya jika dari RT warga sendiri
      const billRt = b.rt_id || b.target_payment_owner
      if (billRt && myRtId && billRt !== myRtId) return false
      return true
    })
  }

  return []
}

export function filterKasByRole(kasList = [], currentUser = null) {
  if (!currentUser) return []
  if (currentUser.role === 'admin') {
    return kasList.filter((k) => k.scope === 'rw' || (!k.scope && !k.rt_id))
  }
  if (currentUser.role === 'rt') {
    return kasList.filter(
      (k) => k.rt_id === currentUser.rt_id || (k.scope === 'rt' && k.rt_id === currentUser.rt_id)
    )
  }
  if (currentUser.role === 'warga') {
    return kasList.filter((k) => k.rt_id === currentUser.rt_id)
  }
  return []
}

export function filterEventsByRole(events = [], currentUser = null) {
  if (!currentUser) return events.filter((e) => e.scope === 'rw' || !e.rt_id)
  if (currentUser.role === 'admin') return events
  if (currentUser.role === 'rt') {
    return events.filter((e) => e.scope === 'rw' || !e.rt_id || e.rt_id === currentUser.rt_id)
  }
  if (currentUser.role === 'warga') {
    return events.filter((e) => {
      if (e.targetType === 'personal') {
        return e.targetWargaId === currentUser.resident_id
      }
      return e.scope === 'rw' || !e.rt_id || e.rt_id === currentUser.rt_id
    })
  }
  return events
}

export function filterKontakDaruratByRole(kontakList = [], currentUser = null, currentWarga = null) {
  if (!kontakList || kontakList.length === 0) return []
  if (!currentUser) return kontakList.filter((k) => !k.rt_id)
  if (currentUser.role === 'admin') return kontakList

  const userRtId =
    currentUser.role === 'warga'
      ? currentWarga?.rt_id || currentUser.rt_id
      : currentUser.rt_id

  return kontakList.filter((k) => !k.rt_id || k.rt_id === userRtId)
}

export function isUsernameAvailable(username, users = [], excludeUserId = null) {
  const normalized = (username || '').trim().toLowerCase()
  if (!normalized) return false

  return !users.some((u) => {
    if (excludeUserId && u.id === excludeUserId) return false
    const uName = (u.username || '').toLowerCase()
    const matchAlias = u.aliases && u.aliases.map((a) => a.toLowerCase()).includes(normalized)
    return uName === normalized || matchAlias
  })
}

export function generateUniqueUsername(name, users = []) {
  const base = normalizeUsername(name) || 'warga'
  let candidate = base
  let counter = 1

  while (!isUsernameAvailable(candidate, users)) {
    counter++
    candidate = `${base}${counter}`
  }

  return candidate
}

export function generateUniqueKodeUnik(existingWarga = [], prefix = 'WR') {
  const existingCodes = existingWarga.map((w) => String(w.kodeUnik || '')).filter(Boolean)
  const cleanPrefix = (prefix || 'WR').toUpperCase().slice(0, 2).padEnd(2, 'R')
  for (let i = 101; i <= 999; i++) {
    const code = `${cleanPrefix}${String(i).padStart(3, '0')}`
    if (!existingCodes.includes(code)) return code
  }
  return `${cleanPrefix}${Math.floor(100 + Math.random() * 900)}`
}

