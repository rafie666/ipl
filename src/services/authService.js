import { verifyPassword, hashPassword, normalizeUsername } from '../utils/crypto.js'

export function generateSessionToken(user) {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 10)
  return `wargaku_jwt_${user.role}_${user.id}_${timestamp}_${random}`
}

export async function apiLogin({ username, password, users = [], adminAuth = null, residents = [] }) {
  const inputUser = (username || '').trim().toLowerCase()
  const inputPass = (password || '').trim()

  if (!inputUser || !inputPass) {
    return { success: false, message: 'Username dan kata sandi wajib diisi!' }
  }

  // 1. Cari di daftar users (warga, rt, rw, bendahara, pengurus, admin)
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

      // Cari resident terkait jika ada
      const matchedResident = matchedUser.resident_id
        ? residents.find((r) => r.id === matchedUser.resident_id)
        : null

      let effectiveRole = matchedUser.role || 'warga'
      let effectiveJabatan = matchedUser.jabatan || matchedResident?.jabatan || effectiveRole

      // Proteksi mutlak: Jika akun login adalah warga, pastikan role tetap 'warga' murni
      if (matchedUser.role === 'warga' || matchedUser.id === 'u-w-1' || matchedUser.username === 'bambang.sutrisno') {
        effectiveRole = 'warga'
        if (effectiveJabatan === 'rt' || effectiveJabatan === 'rw') {
          effectiveJabatan = 'warga'
        }
      }

      const sanitizedUser = {
        id: matchedUser.id,
        username: matchedUser.username,
        name: matchedUser.name || matchedUser.username,
        role: effectiveRole, // 'admin' | 'rw' | 'rt' | 'bendahara' | 'pengurus' | 'warga'
        jabatan: effectiveJabatan,
        resident_id: matchedUser.resident_id || null,
        rt_id: matchedUser.rt_id || null,
        rw_id: matchedUser.rw_id || null,
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

  // 2. Fallback cek adminAuth jika custom admin diatur (Super Admin IT)
  if (
    adminAuth &&
    (inputUser === (adminAuth.username || 'admin').toLowerCase() || inputUser === 'admin@ipl.test' || inputUser === 'superadmin')
  ) {
    const targetAdminHash =
      adminAuth.password_hash || (adminAuth.password ? await hashPassword(adminAuth.password) : '')
    const isPassOk = targetAdminHash ? await verifyPassword(inputPass, targetAdminHash) : false

    if (isPassOk) {
      const adminUser = {
        id: 'u-admin',
        username: adminAuth.username || 'admin',
        name: 'Super Administrator (IT)',
        role: 'admin',
        jabatan: 'admin',
        resident_id: null,
        rt_id: null,
        rw_id: null,
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

  // Fallback demo logins dengan default password 'password'
  if (inputPass === 'password') {
    // 3. Fallback Admin IT / Super Admin
    if (inputUser === 'admin' || inputUser === 'superadmin') {
      const adminUser = {
        id: 'u-admin',
        username: 'admin',
        name: 'Super Administrator (IT)',
        role: 'admin',
        jabatan: 'admin',
        resident_id: null,
        rt_id: null,
        rw_id: null,
        status: 'active'
      }
      return { success: true, token: generateSessionToken(adminUser), user: adminUser }
    }

    // 4. Shortcut Bendahara Lingkungan
    if (
      inputUser === 'bendahara' ||
      inputUser === 'bendahara01' ||
      inputUser === 'bendahara.rw01' ||
      inputUser === 'bendahara-kas'
    ) {
      const bendaharaUser = {
        id: 'u-bendahara-01',
        username: 'bendahara',
        name: 'Ibu Hj. Ratna Dewi (Bendahara Keuangan)',
        role: 'bendahara',
        jabatan: 'bendahara',
        resident_id: 'w-2',
        rt_id: 'rt-01-01',
        rw_id: 'rw-01',
        status: 'active'
      }
      return { success: true, token: generateSessionToken(bendaharaUser), user: bendaharaUser }
    }

    // 5. Shortcut Pengurus Lingkungan & Fasum
    if (
      inputUser === 'pengurus' ||
      inputUser === 'pengurus01' ||
      inputUser === 'pengurus.rw01' ||
      inputUser === 'pengurus-fasum'
    ) {
      const pengurusUser = {
        id: 'u-pengurus-01',
        username: 'pengurus',
        name: 'Bpk. Mulyadi Pratama (Pengurus Fasum & Layanan)',
        role: 'pengurus',
        jabatan: 'pengurus',
        resident_id: 'w-3',
        rt_id: 'rt-01-01',
        rw_id: 'rw-01',
        status: 'active'
      }
      return { success: true, token: generateSessionToken(pengurusUser), user: pengurusUser }
    }

    // 6. Shortcut Ketua RW 01
    if (
      inputUser === 'rw' ||
      inputUser === 'rw01' ||
      inputUser === 'rw1' ||
      inputUser === 'ketua.rw01' ||
      inputUser === 'rw-01'
    ) {
      const rwUser = {
        id: 'u-rw-01',
        username: 'rw01',
        name: 'Bpk. H. Rahmat Hidayat (Ketua RW 01)',
        role: 'rw',
        jabatan: 'rw',
        resident_id: 'w-4',
        rt_id: null,
        rw_id: 'rw-01',
        status: 'active'
      }
      return { success: true, token: generateSessionToken(rwUser), user: rwUser }
    }

    // Fallback login RW 02 - RW 05
    const rwMatch = inputUser.match(/^rw0?([2-5])$/)
    if (rwMatch) {
      const rwNum = String(rwMatch[1]).padStart(2, '0')
      const rwUser = {
        id: `u-rw-${rwNum}`,
        username: `rw${rwNum}`,
        name: `Ketua RW ${rwNum}`,
        role: 'rw',
        jabatan: 'rw',
        resident_id: null,
        rt_id: null,
        rw_id: `rw-${rwNum}`,
        status: 'active'
      }
      return { success: true, token: generateSessionToken(rwUser), user: rwUser }
    }

    // 7. Fallback login RT (rt01.rw01 - rt02.rw05)
    const rtrwMatch = inputUser.match(/^rt0?([1-2])\.?rw0?([1-5])$/)
    if (rtrwMatch) {
      const rtNum = String(rtrwMatch[1]).padStart(2, '0')
      const rwNum = String(rtrwMatch[2]).padStart(2, '0')
      const rtId = `rt-${rwNum}-${rtNum}`
      const isRT01RW01 = rtNum === '01' && rwNum === '01'
      const rtUser = {
        id: `u-${rtId}`,
        username: `rt${rtNum}.rw${rwNum}`,
        name: isRT01RW01 ? 'Bpk. Syahdan (Ketua RT 01 / RW 01)' : `Ketua RT ${rtNum} / RW ${rwNum}`,
        role: 'rt',
        jabatan: 'rt',
        resident_id: null,
        rt_id: rtId,
        rw_id: `rw-${rwNum}`,
        status: 'active'
      }
      return { success: true, token: generateSessionToken(rtUser), user: rtUser }
    }

    // Shortcut rt01 / rt1 / rt -> RT 01 / RW 01 (Ketua RT 01: Bpk. Syahdan)
    if (inputUser === 'rt01' || inputUser === 'rt1' || inputUser === 'rt' || inputUser === 'rt-1') {
      const rtUser = {
        id: 'u-rt-01-01',
        username: 'rt01.rw01',
        name: 'Bpk. Syahdan (Ketua RT 01 / RW 01)',
        role: 'rt',
        jabatan: 'rt',
        resident_id: null,
        rt_id: 'rt-01-01',
        rw_id: 'rw-01',
        status: 'active'
      }
      return { success: true, token: generateSessionToken(rtUser), user: rtUser }
    }

    // Shortcut rt02 / rt2 -> RT 02 / RW 01
    if (inputUser === 'rt02' || inputUser === 'rt2' || inputUser === 'rt-2') {
      const rtUser = {
        id: 'u-rt-01-02',
        username: 'rt02.rw01',
        name: 'Bpk. Suryanto Wijaya (Ketua RT 02 / RW 01)',
        role: 'rt',
        jabatan: 'rt',
        resident_id: null,
        rt_id: 'rt-01-02',
        rw_id: 'rw-01',
        status: 'active'
      }
      return { success: true, token: generateSessionToken(rtUser), user: rtUser }
    }
  }

  // 8. Fallback login warga dari database seed (NIK, nama slug, kode unik, ID, no HP)
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
      const resJabatan = matchedResident.jabatan || 'warga'
      const isOfficial = ['rt', 'rw', 'bendahara', 'pengurus'].includes(resJabatan)

      const wargaUser = {
        id: `u-${matchedResident.id}`,
        username: matchedResident.nama.toLowerCase().replace(/[^a-z0-9]/g, '.'),
        name: `${matchedResident.nama} (Blok ${matchedResident.blok}-${matchedResident.noRumah})`,
        role: isOfficial ? resJabatan : 'warga',
        jabatan: resJabatan,
        resident_id: matchedResident.id,
        rt_id: matchedResident.rt_id,
        rw_id: matchedResident.rw_id,
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

export function filterResidentsByRole(residents = [], currentUser = null, rts = []) {
  if (!currentUser) return []
  if (currentUser.role === 'admin') {
    return residents
  }
  if (currentUser.role === 'rw') {
    if (currentUser.rw_id) {
      return residents.filter((r) => {
        if (r.rw_id && r.rw_id === currentUser.rw_id) return true
        const rt = (rts || []).find((x) => x.id === r.rt_id)
        return rt?.rw_id === currentUser.rw_id
      })
    }
    return residents
  }
  if (currentUser.role === 'bendahara' || currentUser.role === 'pengurus') {
    if (currentUser.rw_id) {
      return residents.filter((r) => {
        if (r.rw_id && r.rw_id === currentUser.rw_id) return true
        const rt = (rts || []).find((x) => x.id === r.rt_id)
        return rt?.rw_id === currentUser.rw_id
      })
    }
    return residents
  }
  if (currentUser.role === 'rt') {
    return residents.filter((r) => r.rt_id === currentUser.rt_id)
  }
  if (currentUser.role === 'warga') {
    return residents.filter((r) => r.id === currentUser.resident_id)
  }
  return []
}

export function filterBillsByRole(bills = [], residents = [], currentUser = null, rts = []) {
  if (!currentUser) return []
  if (currentUser.role === 'admin') {
    return bills
  }

  if (currentUser.role === 'rw') {
    if (currentUser.rw_id) {
      const rwWargaIds = new Set(
        residents
          .filter((r) => {
            if (r.rw_id && r.rw_id === currentUser.rw_id) return true
            const rt = (rts || []).find((x) => x.id === r.rt_id)
            return rt?.rw_id === currentUser.rw_id
          })
          .map((r) => r.id)
      )
      return bills.filter((b) => {
        if (rwWargaIds.has(b.wargaId)) return true
        if (b.target_payment_owner === currentUser.rw_id) return true
        return false
      })
    }
    return bills
  }

  if (currentUser.role === 'bendahara') {
    // Bendahara dapat melihat semua tagihan lingkungan untuk keperluan audit & verifikasi pembayaran
    if (currentUser.rw_id) {
      const rwWargaIds = new Set(
        residents
          .filter((r) => {
            if (r.rw_id && r.rw_id === currentUser.rw_id) return true
            const rt = (rts || []).find((x) => x.id === r.rt_id)
            return rt?.rw_id === currentUser.rw_id
          })
          .map((r) => r.id)
      )
      return bills.filter((b) => {
        if (rwWargaIds.has(b.wargaId)) return true
        if (b.target_payment_owner === currentUser.rw_id) return true
        return true
      })
    }
    return bills
  }

  if (currentUser.role === 'pengurus') {
    if (currentUser.rw_id) {
      const rwWargaIds = new Set(
        residents
          .filter((r) => {
            if (r.rw_id && r.rw_id === currentUser.rw_id) return true
            const rt = (rts || []).find((x) => x.id === r.rt_id)
            return rt?.rw_id === currentUser.rw_id
          })
          .map((r) => r.id)
      )
      return bills.filter((b) => rwWargaIds.has(b.wargaId))
    }
    return bills
  }

  if (currentUser.role === 'rt') {
    const rtResidents = residents.filter((r) => r.rt_id === currentUser.rt_id)
    const rtResidentIds = new Set(rtResidents.map((r) => r.id))
    return bills.filter((b) => {
      if (rtResidentIds.has(b.wargaId)) return true
      if (b.target_payment_owner === currentUser.rt_id || b.rt_id === currentUser.rt_id) return true
      return false
    })
  }

  if (currentUser.role === 'warga') {
    const myResident = residents.find((r) => r.id === currentUser.resident_id)
    const myRtId = myResident?.rt_id || currentUser.rt_id
    return bills.filter((b) => {
      if (b.wargaId !== currentUser.resident_id) return false
      if (b.payment_scope === 'RW') return true
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
    return kasList
  }
  if (currentUser.role === 'rw' || currentUser.role === 'bendahara') {
    if (currentUser.rw_id) {
      return kasList.filter(
        (k) => k.rw_id === currentUser.rw_id || (k.scope === 'rw' && (!k.rw_id || k.rw_id === currentUser.rw_id)) || !k.rw_id
      )
    }
    return kasList
  }
  if (currentUser.role === 'pengurus') {
    if (currentUser.rw_id) {
      return kasList.filter(
        (k) => k.rw_id === currentUser.rw_id || (k.scope === 'rw' && (!k.rw_id || k.rw_id === currentUser.rw_id))
      )
    }
    return kasList
  }
  if (currentUser.role === 'rt') {
    return kasList.filter(
      (k) => k.rt_id === currentUser.rt_id || (k.scope === 'rt' && k.rt_id === currentUser.rt_id)
    )
  }
  if (currentUser.role === 'warga') {
    const userRtId = currentUser.rt_id || 'rt-01-01'
    const userRwId = currentUser.rw_id || 'rw-01'
    return kasList.filter((k) => {
      const matchRt = k.rt_id === userRtId || (k.scope === 'rt' && k.rt_id === userRtId)
      const matchRw = k.scope === 'rw' || k.rw_id === userRwId || (!k.rt_id && (!k.rw_id || k.rw_id === userRwId))
      return matchRt || matchRw
    })
  }
  return []
}

export function filterEventsByRole(events = [], currentUser = null) {
  if (!currentUser) return events.filter((e) => e.scope === 'rw' || !e.rt_id)
  if (currentUser.role === 'admin' || currentUser.role === 'rw' || currentUser.role === 'bendahara' || currentUser.role === 'pengurus') {
    return events
  }
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
  if (currentUser.role === 'admin' || currentUser.role === 'rw' || currentUser.role === 'bendahara' || currentUser.role === 'pengurus') {
    return kontakList
  }

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

