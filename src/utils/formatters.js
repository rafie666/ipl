const NBSP = '\u00A0';

/**
 * Format angka ke format mata uang Rupiah sesuai desain.md §1.3 (NBSP & tanda minus di depan)
 */
export function formatRupiah(value) {
  if (value === null || value === undefined || isNaN(value)) return `Rp${NBSP}0`
  const n = Math.trunc(Number(value) || 0)
  const sign = n < 0 ? '-' : ''
  const body = Math.abs(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${sign}Rp${NBSP}${body}`
}

/**
 * Ambil kode unik lengkap warga (Format: 2 Huruf + 3 Angka, contoh: WR101)
 */
export function getKodeUnikLengkap(targetWarga, defaultIndex = 1) {
  const rawCode = targetWarga?.kodeUnik ? String(targetWarga.kodeUnik).trim().toUpperCase() : ''
  if (rawCode) {
    // Jika sudah format 2 huruf + 3 angka (misal: WR101, BS102)
    const match = rawCode.match(/^([A-Z]{2})([0-9]{1,3})$/)
    if (match) {
      return match[1] + match[2].padStart(3, '0')
    }
    // Jika hanya angka (misal: 101)
    const digitsOnly = rawCode.replace(/\D/g, '')
    if (digitsOnly) {
      return 'WR' + digitsOnly.slice(-3).padStart(3, '0')
    }
  }

  // Fallback dari ID / Index
  const rawId = targetWarga?.id || ''
  const numId = parseInt(rawId.replace(/\D/g, '') || String(defaultIndex), 10)
  const codeNum = String(100 + ((numId * 7) % 900)).padStart(3, '0')
  return 'WR' + codeNum
}

/**
 * Ambil 3 digit angka saja dari kode unik warga (contoh: WR101 -> 101)
 */
export function getAngkaKodeUnik(targetWarga, defaultIndex = 1) {
  const fullCode = getKodeUnikLengkap(targetWarga, defaultIndex)
  const digits = fullCode.replace(/\D/g, '')
  return digits.slice(-3).padStart(3, '0')
}

/**
 * Ambil kode unik 3 digit warga (alias untuk kompatibilitas)
 */
export function getKodeUnikWarga(targetWarga, defaultIndex = 1) {
  return getKodeUnikLengkap(targetWarga, defaultIndex)
}

/**
 * Hitung total tagihan dengan 3 digit angka kode unik warga di akhir
 * Contoh: Dasar 120.000 + Kode WR101 (101) -> Total Tagihan = 120.101
 */
export function calculateTotalWithKodeUnik(baseTotal, targetWarga, defaultIndex = 1) {
  const baseNum = Number(baseTotal) || 0
  const angkaKode = getAngkaKodeUnik(targetWarga, defaultIndex)
  const kodeNum = parseInt(angkaKode, 10) || 0
  
  // Bulatkan ke ribuan terdekat lalu tambahkan 3 digit angka unik
  const roundBase = Math.floor(baseNum / 1000) * 1000
  return roundBase + kodeNum
}

/**
 * Generate kode unik baru 2 huruf + 3 angka yang belum digunakan
 */
export function generateNextKodeUnik(existingWargaList = [], prefix = 'WR') {
  const cleanPrefix = (prefix || 'WR').toUpperCase().slice(0, 2).padEnd(2, 'R')
  const usedNumbers = new Set()

  existingWargaList.forEach((w) => {
    if (w.kodeUnik) {
      const digits = String(w.kodeUnik).replace(/\D/g, '')
      if (digits) {
        usedNumbers.add(parseInt(digits.slice(-3), 10))
      }
    }
  })

  // Cari nomor mulai dari 101 s.d 999 yang belum terpakai
  for (let i = 101; i <= 999; i++) {
    if (!usedNumbers.has(i)) {
      return `${cleanPrefix}${String(i).padStart(3, '0')}`
    }
  }

  return `${cleanPrefix}${Math.floor(100 + Math.random() * 900)}`
}

export const NAMA_BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

/**
 * Format string tanggal YYYY-MM-DD ke Bahasa Indonesia
 */
export function formatTanggalIndo(dateStr) {
  if (!dateStr) return '-'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return dateStr
  }
}

/**
 * Buat link WhatsApp pengingat tagihan (untuk admin/RT)
 */
export function generateWaReminder(warga, tagihan, infoLingkungan = 'Perumahan Alam Tirta Lestari RT 01 / RW 15') {
  if (!warga?.noHp) return ''
  let cleanPhone = warga.noHp.replace(/\D/g, '')
  if (cleanPhone.startsWith('0')) cleanPhone = '62' + cleanPhone.slice(1)

  const bulanNama = NAMA_BULAN[(tagihan.bulan || 1) - 1] || `Bulan ${tagihan.bulan}`
  const formattedNominal = formatRupiah(tagihan.total)

  const text = `Halo Yth. Bpk/Ibu *${warga.nama}*%0ARumah: ${warga.blok} No. ${warga.noRumah}%0A%0A` +
    `Kami dari Pengurus ${infoLingkungan} menginformasikan tagihan *Iuran Pengelolaan Lingkungan (IPL)* untuk periode *${bulanNama} ${tagihan.tahun}*.%0A%0A` +
    `💰 *Total Tagihan: ${formattedNominal}*%0A` +
    `📌 *Status: BELUM LUNAS*%0A%0A` +
    `Mohon kesediaannya untuk melakukan pembayaran melalui:%0A• Tunai kepada Pengurus RT%0A• Transfer%0A• QRIS%0A%0A` +
    `Apabila Bpk/Ibu sudah melakukan pembayaran, mohon abaikan pesan ini.%0A%0ATerima kasih atas kerja samanya! 🙏`

  return `https://wa.me/${cleanPhone}?text=${text}`
}

/**
 * Buat link WhatsApp bukti kwitansi pembayaran (untuk warga yang sudah lunas)
 */
export function generateWaKwitansi(warga, tagihan, infoLingkungan = 'Perumahan Alam Tirta Lestari RT 01 / RW 15') {
  if (!warga?.noHp) return ''
  let cleanPhone = warga.noHp.replace(/\D/g, '')
  if (cleanPhone.startsWith('0')) cleanPhone = '62' + cleanPhone.slice(1)

  const bulanNama = NAMA_BULAN[(tagihan.bulan || 1) - 1] || `Bulan ${tagihan.bulan}`
  const text = `*BUKTI PEMBAYARAN IURAN RT/RW (IPL)*%0A` +
    `${infoLingkungan}%0A%0A` +
    `Yth. Bpk/Ibu: *${warga.nama}*%0A` +
    `Alamat: *${warga.blok}/${warga.noRumah}*%0A` +
    `No. Kwitansi: *${tagihan.noKwitansi || '-'}*%0A` +
    `Periode: *${bulanNama} ${tagihan.tahun}*%0A` +
    `Tgl Bayar: *${formatTanggalIndo(tagihan.tanggalBayar)}*%0A` +
    `Metode: *${tagihan.metodeBayar || 'Tunai'}*%0A` +
    `Jumlah: *${formatRupiah(tagihan.total)}*%0A` +
    `Status: *LUNAS (Verified)* ✅%0A%0A` +
    `Terima kasih atas partisipasinya dalam iuran lingkungan! 🙏`

  return `https://wa.me/${cleanPhone}?text=${text}`
}

/**
 * Buat link WhatsApp untuk event/kegiatan
 */
export function generateWaEvent(warga, event, tagihanEvent, infoLingkungan = 'Perumahan Alam Tirta Lestari', rekeningBank = '') {
  if (!warga?.noHp) return ''
  let cleanPhone = warga.noHp.replace(/\D/g, '')
  if (cleanPhone.startsWith('0')) cleanPhone = '62' + cleanPhone.slice(1)

  const isLunas = tagihanEvent?.status === 'Lunas'
  const nominalVal = tagihanEvent?.nominal || event?.nominalPerKK || 0
  const formattedNominal = formatRupiah(nominalVal)
  const batasTgl = event?.batasTanggal ? formatTanggalIndo(event.batasTanggal) : '-'
  const isRwLevel = event?.scope === 'rw' || !event?.rt_id
  const labelTingkat = isRwLevel ? 'Tingkat RW' : 'Tingkat RT'
  const pengurusLabel = isRwLevel ? 'Pengurus / Panitia RW' : `Pengurus / Panitia ${labelTingkat}`

  if (isLunas) {
    const text = `*BUKTI PEMBAYARAN IURAN KEGIATAN [${labelTingkat.toUpperCase()}]*%0A` +
      `${infoLingkungan}%0A%0AYth. Bpk/Ibu: *${warga.nama}*%0A` +
      `Alamat: *Blok ${warga.blok} No. ${warga.noRumah}*%0A` +
      `Kegiatan: *${event?.judul || 'Acara Warga'}* (${labelTingkat})%0A` +
      `Jumlah: *${formattedNominal}*%0AStatus: *LUNAS (Verified)* ✅%0A%0ATerima kasih! 🙏🎉`
    return `https://wa.me/${cleanPhone}?text=${text}`
  }

  const bankInfo = rekeningBank ? ` (${rekeningBank})` : ''
  const text = `*SURAT EDARAN KEGIATAN [${labelTingkat.toUpperCase()}]*%0A` +
    `Halo Yth. Bpk/Ibu *${warga.nama}*, Rumah: Blok ${warga.blok} No. ${warga.noRumah}%0A%0A` +
    `Kami dari *${pengurusLabel}* menginformasikan partisipasi iuran:%0A` +
    `🏆 *${event?.judul || 'Acara Warga'}*%0A` +
    `💰 *Nominal: ${formattedNominal}*%0A` +
    `📅 *Batas: ${batasTgl}*%0A📌 *Status: BELUM LUNAS*%0A%0A` +
    `Mohon bayar via: Tunai / Transfer${bankInfo} / QRIS%0ATerima kasih! 🙏`

  return `https://wa.me/${cleanPhone}?text=${text}`
}

/**
 * Format label jabatan lengkap
 */
export function getJabatanLabel(jabatan) {
  switch (String(jabatan || '').toLowerCase()) {
    case 'admin':
      return 'Super Administrator'
    case 'rw':
      return 'Ketua / Pengurus RW'
    case 'rt':
      return 'Ketua / Pengurus RT'
    case 'bendahara':
      return 'Bendahara Lingkungan'
    case 'pengurus':
      return 'Pengurus / Seksi Fasum'
    case 'warga':
    default:
      return 'Warga'
  }
}

/**
 * Format label jabatan ringkas
 */
export function getJabatanShortLabel(jabatan) {
  switch (String(jabatan || '').toLowerCase()) {
    case 'admin':
      return 'Admin'
    case 'rw':
      return 'Ketua RW'
    case 'rt':
      return 'Ketua RT'
    case 'bendahara':
      return 'Bendahara'
    case 'pengurus':
      return 'Pengurus'
    case 'warga':
    default:
      return 'Warga'
  }
}

/**
 * Theme & badge styling untuk tiap jabatan
 */
export function getJabatanTheme(jabatan) {
  switch (String(jabatan || '').toLowerCase()) {
    case 'admin':
      return {
        bg: '#F8FAFC',
        border: '#CBD5E1',
        text: '#334155',
        badgeBg: '#334155',
        badgeText: '#FFFFFF',
        iconColor: '#0F172A',
        iconName: 'Shield'
      }
    case 'rw':
      return {
        bg: '#F0FDFA',
        border: '#99F6E4',
        text: '#0F766E',
        badgeBg: '#0F766E',
        badgeText: '#FFFFFF',
        iconColor: '#0F766E',
        iconName: 'Building2'
      }
    case 'rt':
      return {
        bg: '#ECFDF5',
        border: '#A7F3D0',
        text: '#059669',
        badgeBg: '#059669',
        badgeText: '#FFFFFF',
        iconColor: '#059669',
        iconName: 'Home'
      }
    case 'bendahara':
      return {
        bg: '#FFFBEB',
        border: '#FDE68A',
        text: '#D97706',
        badgeBg: '#D97706',
        badgeText: '#FFFFFF',
        iconColor: '#D97706',
        iconName: 'Wallet'
      }
    case 'pengurus':
      return {
        bg: '#EFF6FF',
        border: '#BFDBFE',
        text: '#2563EB',
        badgeBg: '#2563EB',
        badgeText: '#FFFFFF',
        iconColor: '#2563EB',
        iconName: 'ShieldCheck'
      }
    case 'warga':
    default:
      return {
        bg: '#F8FAFC',
        border: '#E2E8F0',
        text: '#64748B',
        badgeBg: '#64748B',
        badgeText: '#FFFFFF',
        iconColor: '#64748B',
        iconName: 'User'
      }
  }
}

/**
 * Format tanggal ISO ke waktu relatif (misal: "Baru saja", "10 mnt lalu", "Kemarin")
 */
export function formatTimeAgo(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return ''
  const now = new Date()
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffSec < 60) return 'Baru saja'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin} mnt lalu`
  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) return `${diffHours} jam lalu`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays === 1) return 'Kemarin'
  if (diffDays < 7) return `${diffDays} hari lalu`
  return `${date.getDate()} ${NAMA_BULAN[date.getMonth()]} ${date.getFullYear()}`
}
