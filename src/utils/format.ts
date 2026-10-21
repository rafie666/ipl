const NBSP = '\u00A0';

export function formatRupiah(value: number): string {
  const n = Math.trunc(value || 0);
  const sign = n < 0 ? '-' : '';
  const body = Math.abs(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${sign}Rp${NBSP}${body}`;
}

export function formatRupiahCompact(value: number): string {
  const n = Math.trunc(value || 0);
  const a = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  const units: Array<[number, string]> = [
    [1e12, 'T'],
    [1e9, 'M'],
    [1e6, 'jt'],
  ];
  for (const [div, suffix] of units) {
    if (a >= div) {
      const v = (Math.floor((a / div) * 100) / 100)
        .toFixed(2)
        .replace('.', ',')
        .replace(/,?0+$/, '');
      return `${sign}Rp${NBSP}${v}${NBSP}${suffix}`;
    }
  }
  return formatRupiah(n);
}

const BULAN_INDONESIA_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
];

const BULAN_INDONESIA_FULL = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export function parseDateSafe(dateInput: string | Date | number): Date | null {
  if (!dateInput) return null;
  if (dateInput instanceof Date) {
    return isNaN(dateInput.getTime()) ? null : dateInput;
  }
  if (typeof dateInput === 'number') {
    const d = new Date(dateInput);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();
    if (!trimmed) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return new Date(`${trimmed}T12:00:00+07:00`);
    }
    if (/^\d{4}-\d{2}-\d{2}[\sT]\d{2}:\d{2}(:\d{2})?$/.test(trimmed) && !trimmed.endsWith('Z') && !trimmed.includes('+')) {
      const isoLike = trimmed.replace(' ', 'T');
      return new Date(`${isoLike}+07:00`);
    }
    const d = new Date(trimmed);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

export function getWIBParts(dateInput: string | Date | number) {
  const d = parseDateSafe(dateInput);
  if (!d) return null;

  // Asia/Jakarta is strictly UTC+7
  const wibMs = d.getTime() + 7 * 60 * 60 * 1000;
  const wibDate = new Date(wibMs);
  const day = wibDate.getUTCDate();
  const monthIdx = wibDate.getUTCMonth();
  const year = wibDate.getUTCFullYear();
  const hours = String(wibDate.getUTCHours()).padStart(2, '0');
  const minutes = String(wibDate.getUTCMinutes()).padStart(2, '0');
  const seconds = String(wibDate.getUTCSeconds()).padStart(2, '0');
  return { day, monthIdx, year, hours, minutes, seconds };
}

export function formatDateIndo(dateInput: string | Date | number): string {
  if (!dateInput) return '-';
  const parts = getWIBParts(dateInput);
  if (!parts) return String(dateInput);
  const month = BULAN_INDONESIA_SHORT[parts.monthIdx];
  return `${parts.day} ${month} ${parts.year}`;
}

export function formatDateTimeIndo(
  dateInput: string | Date | number,
  zone: string = 'WIB',
  includeSeconds: boolean = true
): string {
  if (!dateInput) return '-';
  const parts = getWIBParts(dateInput);
  if (!parts) return String(dateInput);
  const month = BULAN_INDONESIA_SHORT[parts.monthIdx];
  const timeStr = includeSeconds
    ? `${parts.hours}:${parts.minutes}:${parts.seconds}`
    : `${parts.hours}:${parts.minutes}`;
  return `${parts.day} ${month} ${parts.year}, ${timeStr} ${zone}`;
}

export function formatTimeIndo(
  dateInput: string | Date | number,
  zone: string = 'WIB',
  includeSeconds: boolean = true
): string {
  if (!dateInput) return '-';
  const parts = getWIBParts(dateInput);
  if (!parts) return String(dateInput);
  const timeStr = includeSeconds
    ? `${parts.hours}:${parts.minutes}:${parts.seconds}`
    : `${parts.hours}:${parts.minutes}`;
  return `${timeStr} ${zone}`;
}

export function formatPeriodIndo(monthIndex: number, year: number): string {
  const mName = BULAN_INDONESIA_FULL[monthIndex] || 'Bulan';
  return `${mName} ${year}`;
}
