/**
 * billingScheduler.js
 * Utilitas dan logika inti penjadwalan & penerbitan otomatis tagihan IPL.
 * Zona Waktu: Asia/Jakarta (UTC+7).
 */

const NAMA_BULAN_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

/**
 * Mendapatkan representasi waktu saat ini di zona waktu Asia/Jakarta
 */
export function getJakartaDate(dateObj = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false
  })
  const parts = formatter.formatToParts(dateObj)
  const map = {}
  parts.forEach((p) => { map[p.type] = p.value })

  const year = parseInt(map.year, 10)
  const month = parseInt(map.month, 10) // 1-12
  const day = parseInt(map.day, 10)
  const hour = parseInt(map.hour, 10)
  const minute = parseInt(map.minute, 10)
  const second = parseInt(map.second, 10)

  return {
    year,
    month,
    day,
    hour,
    minute,
    second,
    dateString: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    isoString: new Date(Date.UTC(year, month - 1, day, hour - 7, minute, second)).toISOString()
  }
}

/**
 * Menghitung jumlah hari dalam suatu bulan dan tahun
 */
export function getDaysInMonth(year, month) {
  // month: 1 - 12
  return new Date(year, month, 0).getDate()
}

/**
 * Menghitung tanggal terbit efektif dengan aturan akhir bulan:
 * Jika tanggal diatur 31, tetapi bulan hanya 30 hari (atau Februari 28/29),
 * gunakan hari terakhir bulan tersebut.
 */
export function getEffectivePublishDay(year, month, configuredDay = 5) {
  const maxDays = getDaysInMonth(year, month)
  const safeDay = Math.max(1, Math.min(31, parseInt(configuredDay, 10) || 5))
  return Math.min(safeDay, maxDays)
}

/**
 * Menghitung tanggal jatuh tempo efektif
 */
export function getEffectiveDueDay(year, month, configuredDueDay = 20) {
  const maxDays = getDaysInMonth(year, month)
  const safeDue = Math.max(1, Math.min(31, parseInt(configuredDueDay, 10) || 20))
  return Math.min(safeDue, maxDays)
}

/**
 * Mendapatkan nama bulan Indonesia dari index (1 - 12)
 */
export function getNamaBulan(month) {
  const idx = Math.max(1, Math.min(12, parseInt(month, 10))) - 1
  return NAMA_BULAN_ID[idx] || 'Bulan'
}

/**
 * Menghitung tanggal jadwal penerbitan berikutnya (Next Run Date)
 */
export function calculateNextRunDate(configuredPublishDay = 5, fromDateObj = new Date()) {
  const now = getJakartaDate(fromDateObj)
  const currentMonthEffectiveDay = getEffectivePublishDay(now.year, now.month, configuredPublishDay)

  // Jika hari ini belum mencapai tanggal terbit bulan ini, maka jadwal berikutnya adalah bulan ini
  if (now.day < currentMonthEffectiveDay) {
    return {
      year: now.year,
      month: now.month,
      day: currentMonthEffectiveDay,
      dateString: `${now.year}-${String(now.month).padStart(2, '0')}-${String(currentMonthEffectiveDay).padStart(2, '0')}`,
      formatted: `${currentMonthEffectiveDay} ${getNamaBulan(now.month)} ${now.year}`
    }
  }

  // Jika sudah lewat tanggal terbit bulan ini, maka jadwal berikutnya adalah bulan depan
  let nextMonth = now.month + 1
  let nextYear = now.year
  if (nextMonth > 12) {
    nextMonth = 1
    nextYear += 1
  }

  const nextMonthEffectiveDay = getEffectivePublishDay(nextYear, nextMonth, configuredPublishDay)
  return {
    year: nextYear,
    month: nextMonth,
    day: nextMonthEffectiveDay,
    dateString: `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(nextMonthEffectiveDay).padStart(2, '0')}`,
    formatted: `${nextMonthEffectiveDay} ${getNamaBulan(nextMonth)} ${nextYear}`
  }
}

/**
 * Menghasilkan ID Tagihan yang deterministik (Idempoten)
 */
export function buildDeterministicInvoiceId(year, month, scope, wargaId) {
  const y = String(year)
  const m = String(month).padStart(2, '0')
  const sc = String(scope).toLowerCase()
  return `tag-${y}-${m}-${sc}-${wargaId}`
}

/**
 * Evaluasi apakah saat ini sistem perlu melakukan penerbitan otomatis (Catch-up / Scheduled)
 */
export function shouldExecuteAutoBilling({
  autoBillingConfig = {},
  existingInvoices = [],
  currentTime = new Date()
}) {
  const config = {
    enabled: true,
    publishDay: 5,
    dueDay: 20,
    scope: 'ALL',
    ...autoBillingConfig
  }

  if (!config.enabled) {
    return {
      shouldRun: false,
      reason: 'Otomatisasi dinonaktifkan dalam pengaturan'
    }
  }

  const now = getJakartaDate(currentTime)
  const effectiveDay = getEffectivePublishDay(now.year, now.month, config.publishDay)

  // Jika hari ini sebelum tanggal terbit bulan ini, belum waktunya
  if (now.day < effectiveDay) {
    return {
      shouldRun: false,
      reason: `Belum mencapai tanggal terbit bulan ini (Jadwal: ${effectiveDay} ${getNamaBulan(now.month)} ${now.year})`,
      nextRun: `${effectiveDay} ${getNamaBulan(now.month)} ${now.year}`
    }
  }

  // Cek apakah untuk periode bulan ini sudah pernah ada tagihan reguler yang dibuat
  const hasInvoicesForCurrentPeriod = existingInvoices.some((tag) => {
    return Number(tag.tahun) === now.year && Number(tag.bulan) === now.month && !tag.eventId
  })

  if (hasInvoicesForCurrentPeriod) {
    return {
      shouldRun: false,
      reason: `Tagihan periode ${getNamaBulan(now.month)} ${now.year} sudah pernah diterbitkan. Menunggu periode berikutnya.`,
      period: `${now.year}-${String(now.month).padStart(2, '0')}`
    }
  }

  // Waktunya menerbitkan tagihan periode bulan ini
  return {
    shouldRun: true,
    targetYear: now.year,
    targetMonth: now.month,
    effectivePublishDay: effectiveDay,
    effectiveDueDay: getEffectiveDueDay(now.year, now.month, config.dueDay),
    reason: `Jadwal tanggal ${effectiveDay} terpenuhi untuk periode ${getNamaBulan(now.month)} ${now.year}`
  }
}

/**
 * Eksekusi pembentukan tagihan IPL otomatis (Murni fungsi tanpa side-effects)
 * Menghasilkan array tagihan baru dan daftar notifikasi warga yang harus dikirim
 */
export function buildAutoBillingInvoices({
  targetYear,
  targetMonth,
  dueDay = 20,
  scope = 'ALL',
  residents = [],
  iuranRates = [],
  existingInvoices = [],
  rts = []
}) {
  const b = Number(targetMonth)
  const t = Number(targetYear)
  const effectiveDueDay = getEffectiveDueDay(t, b, dueDay)
  const dueDateStr = `${t}-${String(b).padStart(2, '0')}-${String(effectiveDueDay).padStart(2, '0')}`
  const periodeLabel = `${getNamaBulan(b)} ${t}`

  // Warga yang wajib ditagih: warga aktif
  const eligibleWarga = (residents || []).filter((w) => w.aktif !== false)

  const createdInvoices = []
  const createdNotifications = []
  const skippedCount = 0

  eligibleWarga.forEach((w) => {
    const rtObj = (rts || []).find((r) => r.id === w.rt_id) || {}
    const scopesToGenerate = scope === 'ALL' ? ['RT', 'RW'] : [scope]

    // Ambil kode unik warga
    const rawKode = w.kodeUnik || ''
    const match = rawKode.match(/(\d{3})$/)
    const uniqueNumber = match ? parseInt(match[1], 10) : 0

    scopesToGenerate.forEach((sc) => {
      // Cek apakah tagihan untuk warga, periode, dan scope ini sudah ada (IDEMPOTEN)
      const isDuplicate = existingInvoices.some((tag) => {
        return (
          tag.wargaId === w.id &&
          Number(tag.bulan) === b &&
          Number(tag.tahun) === t &&
          (tag.payment_scope === sc || (!tag.payment_scope && sc === 'RT')) &&
          !tag.eventId // Pastikan bukan tagihan event
        )
      })

      const isAlreadyInBatch = createdInvoices.some((tag) => {
        return (
          tag.wargaId === w.id &&
          Number(tag.bulan) === b &&
          Number(tag.tahun) === t &&
          (tag.payment_scope === sc || (!tag.payment_scope && sc === 'RT'))
        )
      })

      if (isDuplicate || isAlreadyInBatch) {
        return
      }

      // Ambil pos iuran yang aktif untuk scope ini
      let activePos = (iuranRates || []).filter(
        (j) => j.aktif !== false && (j.payment_scope === sc || (!j.payment_scope && sc === 'RT'))
      )

      // Fallback tarif jika master pos iuran belum dikonfigurasi
      if (activePos.length === 0) {
        if (sc === 'RT') {
          activePos = [{ nama: 'Iuran Pengelolaan Lingkungan (RT)', nominal: 120000 }]
        } else if (sc === 'RW') {
          activePos = [{ nama: 'Iuran Pembangunan & Fasum RW', nominal: 40000 }]
        }
      }

      const totalPokok = activePos.reduce((sum, item) => sum + (Number(item.nominal) || 0), 0)
      const nominalWithKode = totalPokok + uniqueNumber

      const rincian = [
        ...activePos.map((pos) => ({ nama: pos.nama, nominal: Number(pos.nominal) || 0 })),
        { nama: `Kode Unik Warga (${rawKode || `WR${String(uniqueNumber).padStart(3, '0')}`})`, nominal: uniqueNumber }
      ]

      const invId = buildDeterministicInvoiceId(t, b, sc, w.id)
      const ownerId = sc === 'RW' ? (w.rw_id || rtObj?.rw_id || 'rw-01') : w.rt_id
      const ownerLabel = sc === 'RW' ? 'Kas RW 01' : (rtObj?.name || 'Kas Lingkungan RT 01')

      const newInv = {
        id: invId,
        wargaId: w.id,
        rt_id: w.rt_id,
        namaWarga: w.nama,
        blok: w.blok,
        noRumah: w.noRumah,
        kodeUnik: rawKode || `WR${String(uniqueNumber).padStart(3, '0')}`,
        bulan: b,
        tahun: t,
        total: nominalWithKode,
        rincian,
        payment_scope: sc,
        target_payment_owner: ownerId,
        pembayaran_kepada: ownerLabel,
        status: 'Belum Bayar',
        tanggalJatuhTempo: dueDateStr,
        tanggalTerbit: `${t}-${String(b).padStart(2, '0')}-${String(getEffectivePublishDay(t, b, 5)).padStart(2, '0')}`,
        tanggalBayar: null,
        metodeBayar: null,
        noKwitansi: null,
        catatan: `Tagihan Otomatis Bulanan Periode ${periodeLabel}`,
        isAutoGenerated: true,
        submissions: []
      }

      createdInvoices.push(newInv)

      // Buat notifikasi personal ke warga
      createdNotifications.push({
        id: `notif-tag-${invId}`,
        userId: w.id,
        residentId: w.id,
        title: `Tagihan IPL ${sc} Periode ${periodeLabel} 📬`,
        message: `Tagihan IPL Anda sebesar Rp ${nominalWithKode.toLocaleString('id-ID')} telah terbit. Harap melakukan pembayaran sebelum ${effectiveDueDay} ${getNamaBulan(b)} ${t}.`,
        type: 'tagihan',
        targetId: invId,
        read: false,
        created_at: new Date().toISOString()
      })
    })
  })

  return {
    createdInvoices,
    createdNotifications,
    period: `${t}-${String(b).padStart(2, '0')}`,
    periodLabel: periodeLabel,
    totalCreated: createdInvoices.length,
    dueDateStr
  }
}
