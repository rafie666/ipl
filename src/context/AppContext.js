import React, { createContext, useContext, useState, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  loadInitialStorage,
  saveStorageItem,
  deleteFromSupabase,
  syncAllFromSupabase,
  resetAllStorageToDefault,
  STORAGE_KEYS
} from '../utils/storage'
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
import { supabase, isSupabaseConfigured } from '../api/supabase'
import {
  calculateTotalWithKodeUnik,
  getKodeUnikWarga,
  getAngkaKodeUnik,
  getKodeUnikLengkap,
  generateNextKodeUnik
} from '../utils/formatters'

const AppContext = createContext()

export function AppProvider({ children }) {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [users, setUsers] = useState([])
  const [rts, setRts] = useState([])
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
  const [bankAccounts, setBankAccounts] = useState([])
  const [qrisAccounts, setQrisAccounts] = useState([])
  const [notifications, setNotifications] = useState([])
  const [auditLogs, setAuditLogs] = useState([])

  // Load cache on start
  useEffect(() => {
    async function init() {
      try {
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
        setBankAccounts(initial.bankAccounts || [])
        setQrisAccounts(initial.qrisAccounts || [])
        setNotifications(initial.notifications || [])
        setAuditLogs(initial.auditLogs || [])

        // Cek saved user session
        const savedUser = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_USER)
        if (savedUser) {
          setCurrentUser(JSON.parse(savedUser))
        }

        // Background sync dari Supabase
        syncAllFromSupabase().then((res) => {
          if (res) {
            if (res.config) setConfig(res.config)
            if (res.jenisIuran?.length) setJenisIuran(res.jenisIuran)
            if (res.warga?.length) setWarga(res.warga)
            if (res.tagihan?.length) setTagihan(res.tagihan)
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
        })
      } catch (err) {
        console.warn('Init error:', err)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  // Realtime Supabase listener
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return

    const channel = supabase
      .channel('mobile_realtime_all')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        refreshData()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const refreshData = async () => {
    setRefreshing(true)
    try {
      const res = await syncAllFromSupabase()
      if (res) {
        if (res.config) setConfig(res.config)
        if (res.jenisIuran?.length) setJenisIuran(res.jenisIuran)
        if (res.warga?.length) setWarga(res.warga)
        if (res.tagihan?.length) setTagihan(res.tagihan)
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

  // Auth Functions
  const login = async (username, password) => {
    const res = await apiLogin({ username, password, users, adminAuth, residents: warga })
    if (res.success) {
      setCurrentUser(res.user)
      await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(res.user))
    }
    return res
  }

  const logout = async () => {
    setCurrentUser(null)
    await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_USER)
  }

  // Role info helpers
  const isAdmin = currentUser?.role === 'admin'
  const isRT = currentUser?.role === 'rt'
  const isWarga = currentUser?.role === 'warga'
  const isAdminLoggedIn = isAdmin || isRT

  const currentRT = isRT ? rts.find((r) => r.id === currentUser.rt_id) || rts[0] : null
  const currentWarga = isWarga ? warga.find((w) => w.id === currentUser.resident_id) || null : null

  // Role-scoped data
  const scopedWarga = filterResidentsByRole(warga, currentUser)
  const scopedTagihan = filterBillsByRole(tagihan, warga, currentUser)
  const scopedKas = filterKasByRole(kas, currentUser)
  const scopedEvents = filterEventsByRole(events, currentUser)
  const scopedKontakDarurat = filterKontakDaruratByRole(kontakDarurat, currentUser, currentWarga)
  const scopedPengaduan = isRT
    ? pengaduan.filter((p) => p.rt_id === currentUser.rt_id)
    : isWarga
    ? pengaduan.filter((p) => p.rt_id === (currentWarga?.rt_id || 'rt-1'))
    : pengaduan
  const scopedSurat = isRT
    ? surat.filter((s) => s.rt_id === currentUser.rt_id)
    : isWarga
    ? surat.filter((s) => s.wargaId === currentUser.resident_id)
    : surat

  // Tagihan Operations
  const generateTagihanMassal = async (bulan, tahun, targetRtId = null, scope = 'ALL', selectedPosIds = null) => {
    const b = Number(bulan)
    const t = Number(tahun)

    const isRtUser = currentUser?.role === 'rt'
    const finalRtId = isRtUser ? currentUser?.rt_id || 'rt-1' : targetRtId

    const targetWargaList = warga.filter((w) => {
      if (w.aktif === false) return false
      if (finalRtId) return w.rt_id === finalRtId
      return true
    })

    let countCreated = 0
    const newInvoices = []

    targetWargaList.forEach((w) => {
      const rtObj = rts.find((r) => r.id === w.rt_id) || {}
      
      // Determine scopes to create: 'RT', 'RW', or both
      const scopesToGenerate = scope === 'ALL' ? ['RT', 'RW'] : [scope]

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

        if (!exists) {
          const invId = `tag-${t}-${String(b).padStart(2, '0')}-${sc.toLowerCase()}-${w.id}`
          const ownerId = sc === 'RW' ? (config?.rw || 'rw-15') : w.rt_id
          const ownerLabel = sc === 'RW' ? (config?.rw || 'RW 15') : (rtObj.name || 'RT 01')

          newInvoices.push({
            id: invId,
            wargaId: w.id,
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
          tglBayar: today,
          tanggalBayar: today,
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
      tagihanId: tagihanId
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

    // Sinkronisasi Kas Otomatis
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
      updatedKas = [newKasEntry, ...kas]
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

  // Warga Operations
  const tambahWarga = async (newWargaData) => {
    const isPublicRegistration = !currentUser || currentUser?.role === 'warga'
    const newId = `w-${Date.now()}`
    const targetRtId = newWargaData.rt_id || currentUser?.rt_id || 'rt-1'

    const item = {
      id: newId,
      rt_id: targetRtId,
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
        role: 'warga',
        resident_id: newId,
        rt_id: targetRtId,
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
      kategori: kasData.kategori || 'Iuran Warga',
      nominal: Number(kasData.nominal) || 0,
      deskripsi: desc,
      keterangan: desc,
      scope: currentUser?.role === 'admin' ? 'rw' : 'rt',
      rt_id: currentUser?.role === 'admin' ? null : currentUser?.rt_id || 'rt-1',
      pj: currentUser?.name || 'Bendahara'
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
    const kodeUnikWarga = getKodeUnikWarga(targetW)
    const angkaKode = parseInt(getAngkaKodeUnik(targetW), 10) || 0
    const rawTotal = Number(data.total) || 0
    const finalTotal = calculateTotalWithKodeUnik(rawTotal, targetW)

    const targetScope = data.payment_scope || (currentUser?.role === 'admin' ? 'RW' : 'RT')
    const isRwScope = targetScope === 'RW'
    const ownerId = isRwScope ? (config?.rw || 'rw-15') : (targetW.rt_id || currentUser?.rt_id || 'rt-1')
    const rtObj = rts.find((r) => r.id === ownerId) || {}
    const ownerLabel = isRwScope ? (config?.rw || 'RW 15') : (rtObj.name || 'RT 01')
    const namaPos = data.namaPos || (isRwScope ? 'Iuran Pembangunan & Fasum RW' : 'Iuran Pengelolaan Lingkungan (IPL)')

    const item = {
      id: `tag-manual-${Date.now()}`,
      wargaId: data.wargaId,
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
    const isRw = scope === 'RW'
    const isRtUser = currentUser?.role === 'rt'
    const finalRtId = isRtUser ? (currentUser?.rt_id || 'rt-1') : targetRtId

    const targetWargaList = warga.filter((w) => {
      if (w.aktif === false) return false
      if (finalRtId && !isRw) return w.rt_id === finalRtId
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
        payment_scope: scope,
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
    const item = {
      id: newId,
      wargaId: currentUser?.resident_id || 'w-anon',
      namaWarga: currentUser?.name || 'Warga',
      rt_id: currentUser?.rt_id || 'rt-1',
      kategori: data.kategori || 'Fasilitas Umum',
      judul: data.judul,
      deskripsi: data.deskripsi,
      status: 'Menunggu Tindak Lanjut',
      tanggal: new Date().toISOString().slice(0, 10)
    }
    const updated = [item, ...pengaduan]
    setPengaduan(updated)
    await saveStorageItem(STORAGE_KEYS.PENGADUAN, updated)
    return { success: true, pengaduan: item }
  }

  const updatePengaduan = async (id, status, tanggapan) => {
    const updated = pengaduan.map((p) => {
      if (p.id === id) {
        return {
          ...p,
          status,
          tanggapan: tanggapan || p.tanggapan,
          tglSelesai: status === 'Selesai' ? new Date().toISOString().slice(0, 10) : p.tglSelesai
        }
      }
      return p
    })
    setPengaduan(updated)
    await saveStorageItem(STORAGE_KEYS.PENGADUAN, updated)
    return { success: true }
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
    const item = {
      id: newId,
      wargaId: currentUser?.resident_id || 'w-anon',
      namaWarga: currentUser?.name || 'Warga',
      rt_id: currentUser?.rt_id || 'rt-1',
      jenisSurat: data.jenisSurat || 'Surat Keterangan Domisili',
      keperluan: data.keperluan,
      status: 'Diajukan',
      tanggal: new Date().toISOString().slice(0, 10)
    }
    const updated = [item, ...surat]
    setSurat(updated)
    await saveStorageItem(STORAGE_KEYS.SURAT, updated)
    return { success: true, surat: item }
  }

  const updateSurat = async (id, status) => {
    const updated = surat.map((s) => (s.id === id ? { ...s, status } : s))
    setSurat(updated)
    await saveStorageItem(STORAGE_KEYS.SURAT, updated)
    return { success: true }
  }

  const updateConfig = async (newConfig) => {
    setConfig(newConfig)
    await saveStorageItem(STORAGE_KEYS.CONFIG, newConfig)
    return { success: true }
  }

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

  // Bank Accounts CRUD
  const addBankAccount = async (data) => {
    const newId = `ba-${Date.now()}`
    const newItem = {
      id: newId,
      owner_type: data.owner_type || 'RT',
      owner_id: data.owner_id || 'rt-1',
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
    const updated = bankAccounts.filter((b) => b.id !== id)
    setBankAccounts(updated)
    await saveStorageItem(STORAGE_KEYS.BANK_ACCOUNTS, updated)
    await deleteFromSupabase(STORAGE_KEYS.BANK_ACCOUNTS, id)
    return { success: true }
  }

  // QRIS Accounts CRUD
  const addQrisAccount = async (data) => {
    const newId = `qris-${Date.now()}`
    const newItem = {
      id: newId,
      owner_type: data.owner_type || 'RT',
      owner_id: data.owner_id || 'rt-1',
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
    const updated = qrisAccounts.filter((q) => q.id !== id)
    setQrisAccounts(updated)
    await saveStorageItem(STORAGE_KEYS.QRIS_ACCOUNTS, updated)
    await deleteFromSupabase(STORAGE_KEYS.QRIS_ACCOUNTS, id)
    return { success: true }
  }

  // Notifications Management
  const addNotification = async (data) => {
    const newItem = {
      id: `notif-${Date.now()}`,
      userId: data.userId || null,
      residentId: data.residentId || null,
      title: data.title || 'Notifikasi Baru',
      message: data.message || '',
      type: data.type || 'info',
      tagihanId: data.tagihanId || null,
      read: false,
      created_at: new Date().toISOString()
    }
    const updated = [newItem, ...notifications]
    setNotifications(updated)
    await saveStorageItem(STORAGE_KEYS.NOTIFICATIONS, updated)
    return { success: true, notification: newItem }
  }

  const markNotificationRead = async (id) => {
    const updated = notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    setNotifications(updated)
    await saveStorageItem(STORAGE_KEYS.NOTIFICATIONS, updated)
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
    await saveStorageItem(STORAGE_KEYS.AUDIT_LOGS, updated)
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
        isAdmin,
        isRT,
        isWarga,
        isAdminLoggedIn,
        currentRT,
        currentWarga,
        config,
        updateConfig,
        rts,
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
        verifikasiTagihan,
        tambahWarga,
        verifikasiWargaBaru,
        updateWarga,
        updateCurrentUser,
        hapusWarga,
        tambahKas,
        deleteKas,
        buatPengaduan,
        updatePengaduan,
        ajukanSurat,
        updateSurat,
        tambahEvent,
        hapusEvent,
        generateTagihanEventMassal,
        bayarTagihanEvent,
        tolakTagihanEvent,
        deleteTagihanEvent
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
