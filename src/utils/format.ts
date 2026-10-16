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

export function formatDateIndo(dateInput: string | Date | number): string {
  if (!dateInput) return '-';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);
  const day = d.getDate();
  const month = BULAN_INDONESIA_SHORT[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

export function formatDateTimeIndo(dateInput: string | Date | number, zone: string = 'WIB'): string {
  if (!dateInput) return '-';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);
  const dateStr = formatDateIndo(d);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${dateStr}, ${hours}:${minutes} ${zone}`;
}

export function formatTimeIndo(dateInput: string | Date | number, zone: string = 'WIB'): string {
  if (!dateInput) return '-';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes} ${zone}`;
}

export function formatPeriodIndo(monthIndex: number, year: number): string {
  const mName = BULAN_INDONESIA_FULL[monthIndex] || 'Bulan';
  return `${mName} ${year}`;
}
