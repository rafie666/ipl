# IPL Mobile — Design System Specification

**Versi:** 2.0.0
**Platform:** iOS & Android (React Native, Expo SDK 53+, New Architecture aktif)
**Gaya:** Soft Dashboard / Neo-Banking
**Satuan:** semua dimensi dalam dp (= px logis React Native) kecuali disebut lain
**Bahasa UI:** Indonesia (`id-ID`)

---

## 0. Ruang Lingkup & Perubahan dari v1.0.0

Dokumen ini adalah satu-satunya sumber kebenaran untuk visual dan interaksi. Jika kode dan dokumen berbeda, dokumen diperbaiki lebih dulu, lalu kode.

### 0.1 Koreksi dari v1.0.0 (wajib diterapkan)

| # | Temuan di v1.0.0 | Masalah terukur | Perbaikan di v2.0.0 |
|---|---|---|---|
| 1 | `text.muted` `#94A3B8` untuk timestamp & placeholder | Kontras 2.56:1 di atas `#FFFFFF` (gagal WCAG AA 4.5:1) | `textMuted` = `#64748B` (4.75:1 di atas putih) |
| 2 | Teks status memakai warna solid `#10B981`, `#F59E0B`, `#EF4444`, `#3B82F6`, `#8B5CF6` di atas tint | Semuanya di bawah 4.5:1 (mis. `#F59E0B` di atas `#FFFBEB` ≈ 2.0:1) | Token terpisah `fg` (gelap) untuk teks, `solid` untuk ikon/bar. Lihat §2.1.3 |
| 3 | Dot indikator tab aktif berwarna neon lime di atas putih | Kontras 1.3:1, tidak terlihat | Dot memakai `#064E3B`. Lime hanya dipakai di atas `#064E3B`/`#022C22` atau sebagai fill tombol dengan teks `#022C22` |
| 4 | Ikon quick action memakai warna 500-level (mis. `#F59E0B`) di atas putih | Kontras ikon < 3:1 (batas non-text WCAG 1.4.11) | Ikon memakai warna 700-level di atas tint 50-level. Lihat §4.2 |
| 5 | Shadow "multi-layered" hanya satu layer | Tidak sesuai klaim | Shadow didefinisikan sebagai array `boxShadow` 2–3 layer + fallback legacy |
| 6 | Kartu menampilkan tunggakan sebagai merah | Bertentangan dengan prinsip penagihan tidak intimidatif | Merah hanya untuk error sistem dan bukti bayar ditolak. Tagihan lewat tempo memakai amber |
| 7 | Tidak ada spesifikasi state Disabled/Loading, edge-case, offline | — | Ditambahkan per komponen dan per layar |

### 0.2 Baseline Perangkat

| Parameter | Nilai |
|---|---|
| Lebar layar minimum yang didukung | 360 dp |
| Lebar layar maksimum yang dioptimasi | 430 dp (di atas itu konten di-center, `maxWidth: 480`) |
| Tinggi layar minimum | 640 dp |
| Dark mode | Di luar cakupan v2.0.0. Paksa `userInterfaceStyle: "light"` di `app.json` |
| Orientasi | Portrait saja (`"orientation": "portrait"`) |
| Font scaling | Diizinkan, dibatasi `maxFontSizeMultiplier = 1.3` pada semua `Text` (kecuali ditentukan lain) |
| Reduce Motion OS | Jika aktif: shimmer → statis, spring → `withTiming(…, 150ms)`, count-up dinonaktifkan |
| Safe area | Selalu pakai `react-native-safe-area-context` (`useSafeAreaInsets`) |

### 0.3 Dependensi yang Diasumsikan

`react-native-reanimated` ≥ 3.16, `react-native-gesture-handler`, `expo-haptics`, `expo-linear-gradient`, `expo-blur`, `react-native-svg`, `lucide-react-native`, `expo-image-picker`, `expo-image-manipulator`, `expo-location`, `expo-sharing`, `react-native-view-shot`, `react-native-qrcode-svg`, `@react-native-community/netinfo`, `@expo-google-fonts/plus-jakarta-sans`, `@expo-google-fonts/jetbrains-mono`.

---

## 1. Aturan Global

### 1.1 Touch Target & Spacing Interaktif
- Setiap elemen yang bisa ditekan memiliki area sentuh efektif ≥ **48×48 dp**. Jika visual lebih kecil, tambahkan `hitSlop` sehingga total ≥ 48 (contoh: chip tinggi 40 → `hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}`).
- Jarak antar dua target sentuh bersebelahan ≥ **8 dp**.
- Setiap ikon-saja wajib punya `accessibilityLabel`. Ikon dekoratif: `accessibilityElementsHidden` + `importantForAccessibility="no-hide-descendants"`.

### 1.2 Aturan Warna
- Teks body di atas permukaan: rasio kontras ≥ 4.5:1. Teks ≥ 18 dp bold atau ≥ 24 dp regular: ≥ 3:1. Ikon & batas komponen: ≥ 3:1.
- Status tidak boleh hanya dibedakan oleh warna. Setiap status wajib punya **label teks** dan **ikon** berbeda.
- Neon Lime `#D4F636` hanya boleh dipakai sebagai: (a) fill tombol/pill dengan teks `#022C22` (kontras ≈ 12.3:1), atau (b) aksen di atas `#064E3B`/`#022C22`. Dilarang sebagai teks, border, atau ikon di atas putih/off-white.

### 1.3 Format Data (Indonesia)

| Data | Aturan | Contoh |
|---|---|---|
| Rupiah | `Rp` + NBSP (`\u00A0`) + angka dengan pemisah ribuan titik. Tanpa desimal. Negatif: `-Rp 150.000` | `Rp 150.000` |
| Rupiah ringkas | Dipakai hanya bila lebar tidak cukup (lihat §1.4). 2 desimal maks, koma desimal, dipotong (floor) bukan dibulatkan. Sufiks: `jt` (≥ 1e6), `M` (≥ 1e9), `T` (≥ 1e12) | `Rp 1,25 M` |
| Tanggal | `d MMM yyyy` bulan 3 huruf Indonesia: Jan, Feb, Mar, Apr, Mei, Jun, Jul, Agu, Sep, Okt, Nov, Des | `14 Okt 2026` |
| Waktu | `HH:mm` 24 jam + zona kompleks (`WIB`/`WITA`/`WIT`). Simpan UTC, tampilkan di zona yang dikonfigurasi per kompleks (default `Asia/Jakarta`) | `09:12 WIB` |
| Periode | Nama bulan penuh + tahun | `Oktober 2026` |
| Blok/Unit | Format `Blok {BLOK}-{NO} / No. {NN}`, selalu font mono | `Blok B-12 / No. 04` |
| Angka di UI finansial | `fontVariant: ['tabular-nums']` wajib agar kolom rata | — |

### 1.4 Aturan Overflow Angka & Teks (berlaku global)

| Elemen | Aturan |
|---|---|
| Nominal (Display/H-level) | `numberOfLines={1}`, `adjustsFontSizeToFit`, `minimumFontScale={0.6}`. Jika setelah shrink masih terpotong (lebar < ~ 8 karakter per 28 dp font), pakai `formatRupiahCompact` dan sediakan nominal penuh di `accessibilityLabel` |
| Nominal pada list item | Kolom kanan `flexShrink: 0`, tidak pernah dipotong. `adjustsFontSizeToFit` min scale 0.75, lalu kompak |
| Judul 1 baris | `numberOfLines={1}`, `ellipsizeMode="tail"` |
| Nama orang | 1 baris di komponen padat (`tail`), 2 baris di layar detail/kuitansi |
| Kode/ID mono | `ellipsizeMode="middle"` (1 baris), tampilan penuh via long-press → salin |
| Teks ber-skala OS 130% | Layout tidak boleh memotong. Tinggi komponen memakai `minHeight`, bukan `height`, kecuali Virtual Card (aspect ratio terkunci; lihat §4.1) dan Bottom Bar |

### 1.5 Helper Format (siap pakai: `src/utils/format.ts`)

```ts
const NBSP = '\u00A0';

export function formatRupiah(value: number): string {
  const n = Math.trunc(value);
  const sign = n < 0 ? '-' : '';
  const body = Math.abs(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${sign}Rp${NBSP}${body}`;
}

export function formatRupiahCompact(value: number): string {
  const n = Math.trunc(value);
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
```

---

## 2. Design Tokens

### 2.1 Warna

#### 2.1.1 Brand & Aksen (Emerald Green & Lime Accent)

| Token | HEX | Penggunaan |
|---|---|---|
| `primaryDark` | `#022C22` | Deep Forest 950, teks di atas lime, ujung gradien kartu |
| `primaryDeep` | `#064E3B` | Dark Emerald 900, awal gradien kartu |
| `primary` | `#059669` | Warna Brand Utama IPL Mobile (Emerald 600), ikon aktif, tombol primer, border fokus |
| `primaryLight` | `#10B981` | Fresh Mint 500, aksen cerah |
| `primarySubtle` | `#ECFDF5` | Mint 50, latar item terpilih (chip aktif, radio, badge latar) |
| `primaryGhost` | `rgba(5, 150, 105, 0.08)` | Overlay pressed pada elemen outline/kartu |
| `accentLime` | `#D4F636` | Fill CTA utama "Bayar 1-Tap" kartu residen |
| `accentLimePressed` | `#C0E228` | CTA saat ditekan |
| `accentSubtle` | `#ECFDF5` | Latar badge penegasan |

#### 2.1.2 Netral & Teks

| Token | HEX | Kontras vs `#FFFFFF` | Penggunaan |
|---|---|---|---|
| `background` | `#F8FAFC` | — | Canvas layar (Slate 50 netral lembut) |
| `surface` | `#FFFFFF` | — | Kartu, sheet, modal |
| `surfaceMuted` | `#F1F5F9` | — | Input non-fokus, track progress, tile netral |
| `border` | `#E2E8F0` | — | Divider/border 1 dp |
| `borderStrong` | `#CBD5E1` | — | Border input, garis perforasi kuitansi |
| `borderFocus` | `#059669` | — | Border input saat aktif/fokus |
| `textPrimary` | `#0F172A` | 17.8:1 | Judul, nominal |
| `textSecondary` | `#475569` | 7.6:1 | Deskripsi, label |
| `textMuted` | `#64748B` | 4.75:1 | Timestamp, caption, tab non-aktif (WCAG AA) |
| `textPlaceholder` | `#94A3B8` | — | Placeholder input |
| `textDisabled` | `#CBD5E1` | — | Teks/ikon disabled |
| `textInverse` | `#FFFFFF` | 9.7:1 | Teks di atas warna primer emerald |
| `textOnGreen` | `#FFFFFF` | 9.7:1 | Teks di atas tombol hijau |
| `textOnLime` | `#022C22` | 12.3:1 | Teks di atas tombol lime |

#### 2.1.3 Warna Status (pasangan `fg` / `solid` / `bg` / `border`)

`fg` untuk **teks** (≥ 4.5:1 di atas `bg`). `solid` hanya untuk ikon, bar, dot, stroke.

| Status | Label UI | Ikon (lucide) | `solid` | `fg` | `bg` | `border` |
|---|---|---|---|---|---|---|
| `paid` | `LUNAS` | `CheckCircle2` | `#10B981` | `#047857` | `#ECFDF5` | `#A7F3D0` |
| `unpaid` | `BELUM BAYAR` | `Clock` | `#F59E0B` | `#B45309` | `#FFFBEB` | `#FDE68A` |
| `overdue` | `LEWAT TEMPO` | `AlertCircle` | `#F59E0B` | `#B45309` | `#FFFBEB` | `#FDE68A` |
| `pending` | `VERIFIKASI` | `Hourglass` | `#3B82F6` | `#1D4ED8` | `#EFF6FF` | `#BFDBFE` |
| `rejected` | `DITOLAK` | `XCircle` | `#EF4444` | `#B91C1C` | `#FEF2F2` | `#FECACA` |
| `info` | `INFO` | `Info` | `#0284C7` | `#0369A1` | `#F0F9FF` | `#BAE6FD` |

Catatan: `unpaid` dan `overdue` memakai warna sama; dibedakan oleh label dan ikon. Merah (`rejected`) tidak dipakai untuk tagihan.

### 2.2 Tipografi

**Font:**
- Utama: Plus Jakarta Sans via `@expo-google-fonts/plus-jakarta-sans`
- Mono: JetBrains Mono via `@expo-google-fonts/jetbrains-mono`
- Di React Native, bobot dipetakan lewat nama family (jangan pakai `fontWeight` bersama custom font di Android).

| Token | `fontFamily` | Size | Line height | Letter spacing | Penggunaan |
|---|---|---|---|---|---|
| `display` | `PlusJakartaSans_800ExtraBold` | 28 | 34 | -0.6 | Nominal Virtual Card |
| `displaySm` | `PlusJakartaSans_800ExtraBold` | 24 | 30 | -0.5 | Saldo kas, total pembayaran |
| `h1` | `PlusJakartaSans_700Bold` | 22 | 28 | -0.4 | Judul halaman, sapaan |
| `h2` | `PlusJakartaSans_700Bold` | 18 | 24 | -0.2 | Judul section |
| `h3` | `PlusJakartaSans_600SemiBold` | 16 | 22 | 0 | Judul sub-kartu |
| `bodyLg` | `PlusJakartaSans_500Medium` | 15 | 21 | 0 | Isi penting, nominal list |
| `body` | `PlusJakartaSans_400Regular` | 14 | 20 | 0 | Deskripsi |
| `label` | `PlusJakartaSans_700Bold` | 14 | 18 | 0.2 | Teks tombol, nama list |
| `labelSm` | `PlusJakartaSans_600SemiBold` | 12 | 16 | 0.1 | Label grid menu |
| `caption` | `PlusJakartaSans_500Medium` | 12 | 16 | 0.1 | Timestamp, sub-info |
| `micro` | `PlusJakartaSans_700Bold` | 10 | 14 | 0.5 | Badge status (uppercase) |
| `tabLabel` | `PlusJakartaSans_700Bold` | 11 | 14 | 0.1 | Label tab bar |
| `mono` | `JetBrainsMono_500Medium` | 13 | 18 | 0 | Blok, ID, kode unik |
| `monoSm` | `JetBrainsMono_500Medium` | 11 | 16 | 0.8 | `RESIDENCE PASS`, no. kuitansi |

### 2.3 Spacing (grid 4 pt)

| Token | dp | Penggunaan baku |
|---|---|---|
| `s0` | 0 | — |
| `s1` | 4 | Gap ikon–label mikro |
| `s2` | 8 | Padding badge, gap antar item list |
| `s3` | 12 | Gap header → kartu, padding vertikal kecil |
| `s4` | 16 | **Screen gutter** kiri/kanan, padding kartu standar |
| `s5` | 20 | Padding Virtual Card, margin floating bar |
| `s6` | 24 | Jarak antar section |
| `s8` | 32 | Jarak sebelum CTA bawah |
| `s10` | 40 | — |
| `s12` | 48 | Tinggi minimum target sentuh |
| `s14` | 56 | Tinggi header |
| `s16` | 64 | — |

### 2.4 Radius

| Token | dp | Penggunaan |
|---|---|---|
| `xs` | 6 | Chip smartcard, dot |
| `sm` | 10 | Badge, chip filter |
| `md` | 16 | Input, radio row, tombol sekunder |
| `lg` | 18 | Tile quick action, list item |
| `xl` | 24 | Virtual Card, kartu utama, bottom sheet (sudut atas) |
| `full` | 9999 | Pill, avatar, tombol utama, floating bar |

### 2.5 Shadow (multi-layer)

React Native ≥ 0.76 mendukung `boxShadow` (banyak layer) di iOS dan Android. Gunakan `shadows` sebagai default; `shadowsLegacy` hanya fallback bila `boxShadow` tidak tersedia.

### 2.6 Motion

| Token | Nilai |
|---|---|
| `duration.instant` | 90 ms (pressed in) |
| `duration.fast` | 150 ms (fade, reduce-motion) |
| `duration.base` | 240 ms (transisi state) |
| `duration.slow` | 320 ms (sheet/modal) |
| `duration.count` | 800 ms (count-up saldo) |
| `duration.shimmer` | 1200 ms (satu siklus) |
| `spring.press` | `{ damping: 15, stiffness: 150, mass: 1 }` |
| `spring.sheet` | `{ damping: 22, stiffness: 220, mass: 1 }` |
| `easing.standard` | `Easing.bezier(0.2, 0, 0, 1)` |
| `easing.out` | `Easing.out(Easing.cubic)` |

### 2.7 Haptics

| Aksi | Panggilan | Catatan |
|---|---|---|
| Tap tab / tile grid / chip | `Haptics.selectionAsync()` | Dipicu saat `onPressIn` |
| Tap CTA utama | `Haptics.impactAsync(ImpactFeedbackStyle.Light)` | Saat `onPress` |
| Pembayaran sukses, laporan terkirim | `Haptics.notificationAsync(NotificationFeedbackType.Success)` | Sekali per event |
| Validasi gagal | `Haptics.notificationAsync(NotificationFeedbackType.Warning)` | Sekali per submit |
| Komponen disabled ditekan | Tidak ada haptic | — |
| Pull-to-refresh melewati threshold (72 dp) | `selectionAsync()` | Sekali per tarikan |

### 2.8 File Token Siap Salin: `src/theme/index.ts`

```ts
import { Easing } from 'react-native-reanimated';

export const colors = {
  // Brand Emerald & Forest Green (IPL Mobile Theme)
  primaryDark: '#022C22',       // Deep Forest 950
  primaryDeep: '#064E3B',       // Dark Emerald 900
  primary: '#059669',           // Vibrant Emerald 600
  primaryLight: '#10B981',      // Fresh Mint 500
  primarySubtle: '#ECFDF5',     // Mint 50 tint
  primaryGhost: 'rgba(5, 150, 105, 0.08)',
  brandGreen: '#059669',

  // Accent & Contrast
  accent: '#10B981',
  accentLime: '#D4F636',        // Neo-banking lime accent
  accentLimePressed: '#C0E228',
  accentSubtle: '#ECFDF5',
  accentPressed: '#047857',

  // Neutral & Surface (Clean, professional, soft)
  background: '#F8FAFC',        // Slate 50 canvas
  surface: '#FFFFFF',           // Pure White
  surfaceMuted: '#F1F5F9',      // Slate 100
  surfaceSubtle: '#F8FAFC',
  border: '#E2E8F0',            // Slate 200 divider
  borderStrong: '#CBD5E1',      // Slate 300
  borderFocus: '#059669',

  // Text Hierarchy
  textPrimary: '#0F172A',       // Slate 900
  textSecondary: '#475569',     // Slate 600
  textMuted: '#64748B',         // Slate 500 (WCAG AA pass 4.75:1)
  textPlaceholder: '#94A3B8',   // Slate 400
  textDisabled: '#CBD5E1',      // Slate 300
  textInverse: '#FFFFFF',
  textOnGreen: '#FFFFFF',
  textOnLime: '#022C22',

  // On-card (di atas kartu aksen hijau)
  onCardPrimary: '#FFFFFF',
  onCardSecondary: 'rgba(255, 255, 255, 0.88)',
  onCardTertiary: 'rgba(255, 255, 255, 0.68)',
  onCardSkeleton: 'rgba(255, 255, 255, 0.14)',
  onCardSkeletonHighlight: 'rgba(255, 255, 255, 0.25)',

  // Skeleton (di atas permukaan terang)
  skeletonBase: '#E2E8F0',
  skeletonHighlight: 'rgba(255, 255, 255, 0.65)',

  // Overlay
  scrim: 'rgba(15, 23, 42, 0.50)',

  white: '#FFFFFF',
} as const;

export type StatusKey = 'paid' | 'unpaid' | 'overdue' | 'pending' | 'rejected' | 'info';

export const status: Record<
  StatusKey,
  { label: string; solid: string; fg: string; bg: string; border: string }
> = {
  paid:     { label: 'LUNAS',        solid: '#10B981', fg: '#047857', bg: '#ECFDF5', border: '#A7F3D0' },
  unpaid:   { label: 'BELUM BAYAR',  solid: '#F59E0B', fg: '#B45309', bg: '#FFFBEB', border: '#FDE68A' },
  overdue:  { label: 'LEWAT TEMPO',  solid: '#F59E0B', fg: '#B45309', bg: '#FFFBEB', border: '#FDE68A' },
  pending:  { label: 'VERIFIKASI',   solid: '#3B82F6', fg: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE' },
  rejected: { label: 'DITOLAK',      solid: '#EF4444', fg: '#B91C1C', bg: '#FEF2F2', border: '#FECACA' },
  info:     { label: 'INFO',         solid: '#0284C7', fg: '#0369A1', bg: '#F0F9FF', border: '#BAE6FD' },
};

// Tint + ikon quick action (ikon 700-level di atas tint 50-level)
export const actionTints = {
  bayar:   { bg: '#ECFDF5', icon: '#059669' },
  lapor:   { bg: '#FFFBEB', icon: '#B45309' },
  surat:   { bg: '#EFF6FF', icon: '#1D4ED8' },
  satpam:  { bg: '#F0FDF4', icon: '#047857' },
  kas:     { bg: '#ECFDF5', icon: '#059669' },
  acara:   { bg: '#FEF3C7', icon: '#D97706' },
  denah:   { bg: '#F0F9FF', icon: '#0369A1' },
  darurat: { bg: '#FEF2F2', icon: '#DC2626' },
} as const;

export const spacing = {
  s0: 0, s1: 4, s2: 8, s3: 12, s4: 16, s5: 20,
  s6: 24, s8: 32, s10: 40, s12: 48, s14: 56, s16: 64,
  gutter: 16,
} as const;

export const radius = {
  xs: 6, sm: 10, md: 16, lg: 18, xl: 24, full: 9999,
} as const;

const SANS = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extrabold: 'PlusJakartaSans_800ExtraBold',
} as const;
const MONO = { medium: 'JetBrainsMono_500Medium', bold: 'JetBrainsMono_700Bold' } as const;

export const typography = {
  display:   { fontFamily: SANS.extrabold, fontSize: 28, lineHeight: 34, letterSpacing: -0.6 },
  displaySm: { fontFamily: SANS.extrabold, fontSize: 24, lineHeight: 30, letterSpacing: -0.5 },
  h1:        { fontFamily: SANS.bold,      fontSize: 22, lineHeight: 28, letterSpacing: -0.4 },
  h2:        { fontFamily: SANS.bold,      fontSize: 18, lineHeight: 24, letterSpacing: -0.2 },
  h3:        { fontFamily: SANS.semibold,  fontSize: 16, lineHeight: 22, letterSpacing: 0 },
  bodyLg:    { fontFamily: SANS.medium,    fontSize: 15, lineHeight: 21, letterSpacing: 0 },
  body:      { fontFamily: SANS.regular,   fontSize: 14, lineHeight: 20, letterSpacing: 0 },
  label:     { fontFamily: SANS.bold,      fontSize: 14, lineHeight: 18, letterSpacing: 0.2 },
  labelSm:   { fontFamily: SANS.semibold,  fontSize: 12, lineHeight: 16, letterSpacing: 0.1 },
  caption:   { fontFamily: SANS.medium,    fontSize: 12, lineHeight: 16, letterSpacing: 0.1 },
  micro:     { fontFamily: SANS.bold,      fontSize: 10, lineHeight: 14, letterSpacing: 0.5 },
  tabLabel:  { fontFamily: SANS.bold,      fontSize: 11, lineHeight: 14, letterSpacing: 0.1 },
  mono:      { fontFamily: MONO.medium,    fontSize: 13, lineHeight: 18, letterSpacing: 0 },
  monoSm:    { fontFamily: MONO.medium,    fontSize: 11, lineHeight: 16, letterSpacing: 0.8 },
} as const;

export const TABULAR = { fontVariant: ['tabular-nums'] as const };
export const MAX_FONT_SCALE = 1.3;

// Default: RN >= 0.76 `boxShadow` (multi-layer)
export const shadows = {
  card:
    '0px 1px 2px rgba(15, 23, 42, 0.04), 0px 4px 16px rgba(15, 23, 42, 0.05)',
  cardPressed:
    '0px 1px 2px rgba(15, 23, 42, 0.04), 0px 2px 8px rgba(15, 23, 42, 0.04)',
  elevatedCard:
    '0px 2px 4px rgba(6, 78, 59, 0.10), 0px 10px 24px rgba(6, 78, 59, 0.14), 0px 24px 48px rgba(6, 78, 59, 0.08)',
  floatingNav:
    '0px 2px 6px rgba(15, 23, 42, 0.06), 0px 12px 28px rgba(15, 23, 42, 0.10)',
  neonGlow:
    '0px 2px 4px rgba(212, 246, 54, 0.30), 0px 6px 18px rgba(212, 246, 54, 0.45)',
  neonGlowPressed: '0px 2px 8px rgba(212, 246, 54, 0.25)',
  sheet: '0px -8px 32px rgba(15, 23, 42, 0.12)',
} as const;

// Fallback untuk RN < 0.76 (satu layer saja)
export const shadowsLegacy = {
  card:         { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 4 },  shadowOpacity: 0.05, shadowRadius: 16, elevation: 2 },
  elevatedCard: { shadowColor: '#064E3B', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.14, shadowRadius: 24, elevation: 6 },
  floatingNav:  { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.10, shadowRadius: 28, elevation: 8 },
  neonGlow:     { shadowColor: '#D4F636', shadowOffset: { width: 0, height: 6 },  shadowOpacity: 0.45, shadowRadius: 18, elevation: 7 },
} as const;

export const motion = {
  duration: { instant: 90, fast: 150, base: 240, slow: 320, count: 800, shimmer: 1200 },
  spring: {
    press: { damping: 15, stiffness: 150, mass: 1 },
    sheet: { damping: 22, stiffness: 220, mass: 1 },
  },
  easing: {
    standard: Easing.bezier(0.2, 0, 0, 1),
    out: Easing.out(Easing.cubic),
  },
} as const;

export const layout = {
  minTouch: 48,
  headerHeight: 56,
  cardAspect: 1.586,          // ISO/IEC 7810 ID-1 (85.60 x 53.98 mm)
  navHeight: 68,
  navMarginH: 20,
  navCenterSize: 54,
  navCenterRaise: 14,
  maxContentWidth: 480,
} as const;

export const gradients = {
  residentCard: ['#064E3B', '#022C22'] as const, // start {0,0} end {1,1}
};
```

---

## 3. Primitif (dipakai oleh semua komponen)

### 3.1 Tombol

| Varian | Tinggi | Radius | Fill | Teks |
|---|---|---|---|---|
| `primary` (Neon) | 52 | `full` | `#D4F636` | `label` 15 dp / `PlusJakartaSans_800ExtraBold`, `letterSpacing 0.3`, `#022C22` |
| `secondary` (Outline) | 52 | `full` | transparan, border 1.5 `#064E3B` | `label` `#064E3B` |
| `ghost` | 48 | `full` | transparan | `label` `#064E3B` |
| `mini` (di dalam Virtual Card) | 36 (hitSlop +6 atas/bawah → 48) | `full` | lihat §4.1 | `label` 13 dp |

| State | `primary` | `secondary` | `ghost` |
|---|---|---|---|
| **Default** | bg `#D4F636`, shadow `neonGlow` | border `#064E3B` | — |
| **Pressed** | bg `#C0E228`, scale 0.98 (`withTiming` 90 ms), shadow `neonGlowPressed` | bg `rgba(6,78,59,0.08)`, scale 0.98 | bg `rgba(6,78,59,0.08)` |
| **Disabled** | bg `#E2E8F0`, teks & ikon `#94A3B8`, tanpa shadow, tanpa haptic, `accessibilityState={{ disabled: true }}` | border `#CBD5E1`, teks `#94A3B8` | teks `#94A3B8` |
| **Loading** | Lebar tetap (ukur `onLayout` sebelum loading), label diganti `ActivityIndicator size=20 color=#022C22`, bg `#D4F636`, `pointerEvents="none"`, `accessibilityState={{ busy: true }}` | Spinner `#064E3B` | Spinner `#064E3B` |

Aturan: ikon di tombol 20 dp, gap ikon–label 8 dp, padding horizontal minimum 24 dp. Label maksimum 1 baris, `adjustsFontSizeToFit`, `minimumFontScale 0.8`.

### 3.2 Input

| Properti | Nilai |
|---|---|
| Tinggi | `minHeight 52` (multiline: `minHeight 120`, `textAlignVertical: 'top'`) |
| Radius | 16 |
| Padding | horizontal 16, vertikal 14 |
| Teks | 15 dp / `PlusJakartaSans_500Medium`, `#0F172A` |
| Label di atas | `labelSm` `#475569`, margin bawah 8 |
| Helper/Error | `caption`, margin atas 6 |

| State | Fill | Border | Lain |
|---|---|---|---|
| Default | `#F1F5F9` | 1.5 `transparent` | placeholder `#5F6E82` |
| Focus | `#FFFFFF` | 1.5 `#064E3B` | transisi border 150 ms |
| Error | `#FEF2F2` | 1.5 `#EF4444` | helper `#B91C1C` + ikon `AlertCircle` 14 dp |
| Disabled | `#F1F5F9` | `transparent` | teks `#94A3B8`, `editable={false}` |
| Loading (data awal) | Skeleton bar tinggi 52, radius 16 | — | — |

### 3.3 Status Badge

- Tinggi 20, padding horizontal 8, radius 10, border 1 dp
- Teks `micro` uppercase, warna `status[x].fg`; bg `status[x].bg`; border `status[x].border`
- Ikon 12 dp, warna `fg`, gap 4 dp (ikon dari tabel §2.1.3). Ikon selalu tampil; teks boleh disembunyikan hanya jika lebar < 56 dp (tidak berlaku saat ini)
- `numberOfLines={1}`; tidak pernah dipotong

### 3.4 Skeleton & Shimmer (spesifikasi seragam)

| Parameter | Permukaan terang | Di atas Virtual Card |
|---|---|---|
| Warna dasar | `#E2E8F0` | `rgba(255,255,255,0.10)` |
| Highlight | `rgba(255,255,255,0.60)` | `rgba(255,255,255,0.18)` |
| Gradien sapuan | `LinearGradient` 3 stop `[transparent, highlight, transparent]`, locations `[0, 0.5, 1]`, arah horizontal (start `{0,0.5}`, end `{1,0.5}`) | sama |
| Lebar sapuan | 40% lebar kontainer | sama |
| Animasi | `translateX` dari `-containerWidth` ke `+containerWidth`, `withRepeat(withTiming(…, { duration: 1200, easing: Easing.linear }), -1)` | sama |
| Sinkronisasi | Semua skeleton dalam satu layar memakai **satu** shared value (fase sama) | sama |
| Reduce Motion | Tanpa sapuan; opacity blok berdenyut 0.6 ↔ 1.0, 1200 ms | sama |
| Durasi minimum tampil | 300 ms (hindari kedip) | sama |
| Radius blok | Mengikuti radius elemen yang digantikan | sama |
| A11y | Kontainer: `accessibilityLabel="Memuat"`, `accessibilityState={{ busy: true }}` | sama |

Spinner di tengah layar kosong dilarang. Spinner hanya boleh di dalam tombol (§3.1) dan refresh control.

---

## 4. Komponen

### 4.1 Virtual Resident Card

#### 4.1.1 Dimensi
- Lebar = `min(screenWidth, 480) − 32` (gutter 16 kiri/kanan)
- Tinggi = lebar / 1.586 (pembulatan ke bawah), `aspectRatio: 1.586`
  - 360 dp → 328 × 206 dp
  - 412 dp → 380 × 239 dp
- Radius 24, `overflow: 'hidden'`, shadow `elevatedCard`
- Padding internal 20
- Latar: `LinearGradient` `['#064E3B', '#022C22']`, `start {x:0,y:0}`, `end {x:1,y:1}`
- Dekorasi (SVG, `pointerEvents="none"`, di-hidden dari aksesibilitas):
  - Lingkaran A: diameter 220, fill `rgba(255,255,255,0.05)`, posisi `top: -70, right: -60`
  - Lingkaran B: diameter 160, fill `rgba(212,246,54,0.06)`, posisi `bottom: -50, left: -40`

#### 4.1.2 Anatomi (referensi 328 × 206 dp, padding 20 → area dalam 288 × 166 dp)

```
 328dp
┌────────────────────────────────────────────────────────┐ r=24
│ ◜ padding 20                                           │
│  RESIDENCE PASS                    ┌──────────────┐    │ ← Row A  h=26
│  monoSm 11, onCardSecondary        │ ● LUNAS      │    │   pill h=26 r=full
│                                    └──────────────┘    │
│  14dp gap                                              │
│  TAGIHAN OKTOBER 2026                    ┌────────┐    │ ← Row B
│  caption 12, onCardSecondary             │ chip   │    │   label h=16
│  Rp 150.000                              │ 40×30  │    │   nominal h=34
│  display 28 / white, 1 baris             └────────┘    │   chip r=6, align bawah nominal
│                                                        │
│  (flex space — sisa tinggi)                            │
│                                                        │
│  AHMAD FAIZAL                  ┌──────────────────┐    │ ← Row C  h=36
│  label 14 white, 1 baris       │  ⚡ Bayar 1-Tap  │    │   mini button 36
│  Blok B-12 / No. 04            └──────────────────┘    │
│  mono 13, onCardSecondary      min width 112          │
└────────────────────────────────────────────────────────┘
```

Pada 206 dp tinggi: 20 (pad) + 26 (Row A) + 14 + 16 + 2 + 34 (Row B = 52) + flex ≥ 8 + 36 (Row C; blok teks kiri 2 baris = 18 + 18 = 36) + 20 (pad) = 176 → sisa flex 30 dp. Tidak ada elemen yang boleh menambah tinggi inti Row C di atas 36 dp.

#### 4.1.3 Spesifikasi Elemen

| Elemen | Spesifikasi |
|---|---|
| Logo + `RESIDENCE PASS` | Ikon `Home` 14 dp putih 75% + teks `monoSm` `onCardSecondary`, gap 6 |
| Status pill | Tinggi 26, padding horizontal 10, ikon 14 dp, teks `micro` 10 dp, gap 4 |
| Label periode | `caption` uppercase, `onCardSecondary`, `numberOfLines={1}` |
| Nominal | `display`, `#FFFFFF`, `TABULAR`, `numberOfLines={1}`, `adjustsFontSizeToFit`, `minimumFontScale 0.6`, `maxWidth = areaDalam − 48` (chip 40 + gap 8) |
| Chip smartcard | 40×30, radius 6, `LinearGradient ['#F1F5F9','#CBD5E1']`, border 1 `rgba(255,255,255,0.40)`, garis sirkuit SVG stroke 1 `#94A3B8` opacity 0.6. Dekoratif |
| Nama | `label` 14, `#FFFFFF`, `numberOfLines={1}`, `ellipsizeMode="tail"`, `maxWidth = 55%` area dalam (≈ 158 dp) |
| Blok/unit | `mono` 13, `onCardSecondary`, `numberOfLines={1}`, `ellipsizeMode="middle"`. Bila > 20 karakter, `fontSize 11` |
| Tombol mini | Tinggi 36, `minWidth 112`, padding horizontal 14, ikon 14 dp, teks `label` 13, gap 6, `hitSlop {top 6, bottom 6, left 6, right 6}` |

#### 4.1.4 Varian Status Kartu (konten, bukan state interaksi)

| Varian | Pill (bg / border / teks+ikon) | Label periode | Nominal | Tombol mini |
|---|---|---|---|---|
| `paid` | `rgba(16,185,129,0.20)` / `rgba(16,185,129,0.40)` / `#A7F3D0`, ikon `CheckCircle2`, teks `LUNAS` | `TERBAYAR OKTOBER 2026` | Nominal terbayar | Glass: bg `rgba(255,255,255,0.14)`, border 1 `rgba(255,255,255,0.30)`, teks putih `Lihat Kuitansi`, ikon `Receipt` |
| `unpaid` | `#D4F636` / none / `#022C22`, ikon `Clock`, teks `BELUM BAYAR` | `TAGIHAN OKTOBER 2026` | Nominal tagihan | Lime: bg `#D4F636`, teks `#022C22`, ikon `Zap`, teks `Bayar 1-Tap` |
| `overdue` | `#FDE68A` / none / `#78350F`, ikon `AlertCircle`, teks `LEWAT 5 HARI` (hari dihitung terhadap jatuh tempo; maks `LEWAT 99+ HARI`) | `TAGIHAN OKTOBER 2026` | Nominal tagihan + denda jika ada | Sama dengan `unpaid` |
| `pending` | `rgba(147,197,253,0.18)` / `rgba(147,197,253,0.40)` / `#BFDBFE`, ikon `Hourglass`, teks `VERIFIKASI` | `MENUNGGU VERIFIKASI` | Nominal dibayar | Disabled-style (lihat 4.1.5), teks `Diproses` |
| `none` (tidak ada tagihan aktif) | Sama dengan `paid` | `BEBAS TAGIHAN` | `Rp 0` | Glass `Lihat Arsip` |

Jika ada > 1 tagihan aktif (menunggak beberapa bulan): label periode menjadi `TOTAL 3 TAGIHAN`, nominal = jumlah semua, tombol mini mengarah ke layar daftar tagihan (bukan checkout tunggal).

#### 4.1.5 State Interaksi

| State | Spesifikasi |
|---|---|
| **Default** | Sesuai §4.1.1–4.1.4. Seluruh kartu menekan → membuka Detail Tagihan (`accessibilityRole="button"`, label: `"Tagihan Oktober 2026, Rp 150.000, belum dibayar, jatuh tempo 20 Oktober 2026, Blok B-12 nomor 04. Ketuk untuk melihat rincian"`). Tombol mini adalah target sentuh terpisah |
| **Pressed** | Kartu: `scale 0.97` via `withSpring(spring.press)`, shadow turun ke `card` (opacity transisi 90 ms), haptic `selectionAsync`. Tombol mini: bg `#C0E228` (lime) atau `rgba(255,255,255,0.22)` (glass), `scale 0.96`. Release: kembali ke 1.0 dengan spring yang sama |
| **Disabled** | Berlaku pada (a) `pending`, (b) offline tanpa data tagihan ter-cache. Kartu tetap tampil dengan konten; tombol mini: bg `rgba(255,255,255,0.12)`, teks & ikon `rgba(255,255,255,0.55)`, tanpa glow, `accessibilityState={{ disabled: true }}`. Kartu keseluruhan (tap ke detail) tetap aktif di keadaan (a), nonaktif di (b) |
| **Loading** | Cangkang kartu tetap gradien emerald penuh (bukan abu-abu), dimensi identik. Blok skeleton (warna `onCardSkeleton`, highlight `onCardSkeletonHighlight`): Row A kiri 96×12 r6 + pill kanan 88×26 r13; label 120×10 r5; nominal 180×28 r8; chip 40×30 r6 (tetap tampil statis); nama 130×14 r7; blok 100×12 r6; tombol mini 112×36 r18. Tanpa haptic, tanpa press |

#### 4.1.6 Aturan Mikro & Edge Case

| Kasus | Perilaku |
|---|---|
| Nama panjang (mis. `Muhammad Abdurrahman Al-Fatih Wijayakusuma`) | 1 baris, ellipsis tail pada ≈ 158 dp. Nama lengkap tersedia di `accessibilityLabel` dan layar Profil |
| Blok panjang (> 20 karakter) | Font 11, lalu ellipsis tengah |
| Nominal ≥ `Rp 1.000.000.000` | `adjustsFontSizeToFit` hingga 17 dp (0.6×). Jika tetap terpotong → `formatRupiahCompact` (`Rp 1,25 M`) dan label a11y memakai nominal penuh |
| Font OS 130% | Aspect ratio tetap; teks tereduksi via `adjustsFontSizeToFit`. Row C: nama 1 baris + blok 1 baris tidak boleh bertambah |
| Jatuh tempo | Ditampilkan di Detail Tagihan, bukan di kartu (kartu sudah padat) |
| Data stale (offline) | Titik 6 dp `#FDE68A` di sebelah `RESIDENCE PASS` + `accessibilityHint="Data terakhir diperbarui 14 Okt 08:30"` |

---

### 4.2 Quick Action Grid

#### 4.2.1 Anatomi (area konten 328 dp pada layar 360 dp)

```
 328dp (lebar konten = screen − 32)
┌──────┬──────┬──────┬──────┐
│ cell │ cell │ cell │ cell │   cell width = (328 − 3×8) / 4 = 76 dp
│ 76×98│      │      │      │   gap horizontal 8, gap vertikal 16
│┌────┐│      │      │      │
││58× ││      │      │      │   tile 58×58, r=18, center
││ 58 ││      │      │      │   ikon Lucide 24dp, strokeWidth 2
│└────┘│      │      │      │
│ 8 gap│      │      │      │
│ Bayar│      │      │      │   label labelSm 12/16, center, max 2 baris
│  IPL │      │      │      │   zona label = 32 dp (2×16)
└──────┴──────┴──────┴──────┘
 Baris 2 identik. Total tinggi = 98 + 16 + 98 = 212 dp
```

- Cell: `minHeight 98` (58 + 8 + 32), seluruh cell adalah target sentuh (76×98 ≥ 48×48)
- Lebar cell dihitung `(contentWidth − 24) / 4`; pada layar lebar tile tetap 58 dan di-center

#### 4.2.2 Daftar Aksi

| # | Label (maks 2 baris) | Ikon | `bg` / `icon` | Tujuan |
|---|---|---|---|---|
| 1 | `Bayar IPL` | `Receipt` | `#ECFDF5` / `#047857` | Detail Tagihan |
| 2 | `Lapor` | `MessageSquareWarning` | `#FFFBEB` / `#B45309` | Form Aduan |
| 3 | `Surat RT` | `FileCheck` | `#EFF6FF` / `#1D4ED8` | Pengajuan Surat |
| 4 | `Jadwal Satpam` | `ShieldCheck` | `#F5F3FF` / `#6D28D9` | Jadwal |
| 5 | `Buku Kas` | `Wallet` | `#F0FDFA` / `#0F766E` | Laporan Kas |
| 6 | `Iuran Acara` | `PartyPopper` | `#FDF2F8` / `#BE185D` | Iuran Acara |
| 7 | `Denah` | `MapPin` | `#F0F9FF` / `#0369A1` | Peta Komplek |
| 8 | `Darurat` | `PhoneCall` | `#FEF2F2` / `#B91C1C` | Kontak Darurat |

Badge angka pada tile (mis. jumlah tagihan): 16 dp tinggi, `minWidth 16`, radius 8, bg `#EF4444`, teks `micro` putih, posisi `top: -4, right: -4` relatif tile. Nilai > 9 tampil `9+`. Tidak dipakai untuk `Bayar IPL` (status tagihan sudah di Virtual Card).

#### 4.2.3 State Interaksi

| State | Tile | Label | Lain |
|---|---|---|---|
| **Default** | bg tint, tanpa shadow, border 1 `#FFFFFF` opacity 0 (tidak ada) | `#0F172A` | — |
| **Pressed** | `scale 0.94` (`withTiming` 90 ms in; `withSpring(press)` out), bg tint dengan overlay `rgba(15,23,42,0.06)` | tetap | `selectionAsync` pada `onPressIn` |
| **Disabled** | opacity 0.4, ikon `#94A3B8`, bg `#F1F5F9` | `#94A3B8` | Tanpa haptic, tanpa scale; `accessibilityState={{ disabled: true }}`; tap menampilkan toast 2500 ms (`"Fitur ini butuh koneksi internet"` atau `"Fitur belum tersedia di komplek Anda"`) |
| **Loading** | Blok 58×58 r18 `#E2E8F0` + shimmer | Bar 48×10 r5 `#E2E8F0`, margin atas 8, di-center | 8 cell tampil; tanpa press |

#### 4.2.4 Aturan Mikro & Edge Case

| Kasus | Perilaku |
|---|---|
| Label > 2 baris | Dipotong pada baris ke-2 (`numberOfLines={2}`, `ellipsizeMode="tail"`). Label ≤ 14 karakter per baris di 12 dp pada cell 76 dp; label di tabel di atas sudah memenuhi |
| Font OS 130% | Label `maxFontSizeMultiplier 1.3`; zona label tumbuh sampai 2 baris × 21 = 42 dp, cell `minHeight` otomatis menyesuaikan |
| Fitur tidak diaktifkan pengurus (feature flag) | Cell **disembunyikan** (bukan disabled). Grid reflow; bila sisa < 8 aksi, baris terakhir rata kiri dengan cell kosong sebagai `View` 76 dp. Tidak boleh ada lubang di tengah |
| Offline | `Bayar IPL`: aktif jika ada tagihan ter-cache (buka detail read-only). `Lapor`: aktif (masuk antrean outbox, lihat §5.4). `Surat RT`, `Iuran Acara`: disabled. `Jadwal Satpam`, `Buku Kas`, `Denah`: aktif bila ada cache, selain itu disabled. `Darurat`: **selalu aktif** (nomor disimpan lokal; memicu `Linking.openURL('tel:…')`) |

---

### 4.3 Floating Bottom Bar

#### 4.3.1 Dimensi & Posisi

| Properti | Nilai |
|---|---|
| Lebar | `screenWidth − 40` (margin horizontal 20) |
| Tinggi | 68 |
| Radius | 9999 |
| Posisi bawah | `bottom = Math.max(insets.bottom, 12) + 8` |
| Fill | `#FFFFFF` (fallback). Jika `BlurView` tersedia: `intensity 40`, `tint "light"`, overlay `rgba(255,255,255,0.92)` |
| Border | 1 `rgba(226,232,240,0.80)` |
| Shadow | `shadows.floatingNav` |
| Padding horizontal internal | 8 |
| Slot | 5 slot lebar sama = `(barWidth − 16) / 5` (pada 360 dp: 304 / 5 = 60.8 dp, tinggi 68 → target ≥ 48×48 terpenuhi) |
| `zIndex` / `elevation` | `zIndex 100`, `elevation 8` |
| Padding bawah konten scroll | `68 + bottomOffset + 16` (+ 14 jika tombol tengah menonjol melewati batas atas konten, sudah termasuk bila `bottomOffset ≥ 8`) |

#### 4.3.2 Anatomi

```
          Tombol tengah menonjol 14 dp di atas tepi bar
                       ┌──────┐
                       │  ⚡  │ 54×54, r=27, lime, glow
 ┌─────────────────────┴──────┴────────────────────────┐
 │                    (kosong 12)                      │ ← bar 68dp, r=34
 │  [Home]   [Tagihan]   (slot 3)  [Layanan]  [Profil] │
 │  ikon24    ikon24                ikon24     ikon24  │
 │  Beranda   Tagihan               Layanan    Profil  │ ← tabLabel 11/14
 │    •                                                │ ← dot 4×4 #064E3B (aktif)
 └─────────────────────────────────────────────────────┘
   margin kiri/kanan 20           bottom = max(inset,12)+8
```

Layout vertikal tiap slot biasa (tinggi 68): padding atas 12, ikon 24, gap 2, label 14, gap 4, dot 4, sisa ≈ 8.
Slot tengah: tombol 54×54 di-`translateY: -14` (puncak tombol 14 dp di atas bar), tanpa label teks; `accessibilityLabel="Bayar cepat"`.

| Tab | Ikon | Label |
|---|---|---|
| 1 | `Home` | `Beranda` |
| 2 | `ReceiptText` | `Tagihan` |
| 3 (tengah) | `Zap` 26 dp | — (a11y: `Bayar cepat`) |
| 4 | `Layers` | `Layanan` |
| 5 | `User` | `Profil` |

#### 4.3.3 State Interaksi

**Tab biasa (1, 2, 4, 5):**

| State | Ikon | Label | Indikator |
|---|---|---|---|
| **Default (tidak aktif)** | `#64748B`, stroke 2 | `tabLabel` `#64748B` | tidak ada |
| **Aktif** | `#064E3B`, stroke 2.5 | `#064E3B` | Dot 4×4 `#064E3B` di bawah label; muncul `withTiming` scale 0→1, 150 ms |
| **Pressed** | `scale 0.92` (90 ms) + haptic `selectionAsync` | tetap | Latar lingkaran 44×44 `rgba(6,78,59,0.08)` di belakang ikon |
| **Disabled** | ikon & label `#94A3B8` | `#94A3B8` | Tanpa haptic. Dipakai saat sesi belum terverifikasi (mis. akun menunggu persetujuan pengurus) |
| **Loading** | Bar tidak pernah di-skeleton; selalu render. Badge ditunda: tidak tampil sampai data siap | — | — |

**Tombol tengah (Center Button):**

| State | Spesifikasi |
|---|---|
| **Default** | 54×54, bg `#D4F636`, ikon `Zap` 26 dp `#022C22`, shadow `neonGlow` |
| **Pressed** | bg `#C0E228`, `scale 0.92` (90 ms), shadow `neonGlowPressed`, haptic `impactAsync(Light)` |
| **Disabled** | bg `#E2E8F0`, ikon `#94A3B8`, tanpa shadow. Kondisi: tidak ada tagihan aktif (aksi diganti `Lihat Arsip` jika ditekan? **Tidak** — tombol disabled dan toast `"Tidak ada tagihan yang perlu dibayar"`) atau offline tanpa cache |
| **Loading** | Ikon diganti `ActivityIndicator size=22 color=#022C22`, bg `#D4F636`, tanpa glow, `pointerEvents="none"`. Dipakai saat membuat invoice QRIS (maks 10 000 ms, lalu error toast) |

**Badge pada tab `Tagihan`:** 16 dp tinggi, `minWidth 16`, radius 8, bg `#EF4444`, teks `micro` putih, posisi `top: 8, right: slotWidth/2 − 20`. Tampil jika ada ≥ 1 tagihan aktif. > 9 → `9+`.

#### 4.3.4 Aturan Mikro

- Bar **disembunyikan** (`translateY` keluar 240 ms) pada: keyboard terbuka (Android dan iOS), layar Checkout, Kuitansi, Form Aduan.
- Label tab: `numberOfLines={1}`; maks 8 karakter. Skala font tab `maxFontSizeMultiplier 1.15` agar tidak melewati slot.
- Pindah tab: tanpa animasi slide; cross-fade 150 ms.
- Re-tap tab aktif: scroll ke atas (`scrollTo y:0`, 240 ms).
- Saat keyboard hide: bar kembali dengan `withSpring(spring.sheet)`.

---

### 4.4 Item Tagihan / Aktivitas (Transaction List Item)

#### 4.4.1 Anatomi

```
 328dp lebar (screen − 32)
┌──────────────────────────────────────────────────────────┐
│ 14                                                       │ r=18, bg #FFF, shadow card
│ 16  ┌────┐  IPL Bulanan - Oktober 2026   Rp 150.000   16 │ ← baris 1
│     │ 42 │  h 20 (label 14)               bodyLg 15 bold │
│     │ ●  │  BCA Virtual Account • 14 Okt  ┌────────┐  ›  │ ← baris 2
│     └────┘  caption 12 #64748B            │ LUNAS  │     │
│ 14   gap 12                               └────────┘     │
└──────────────────────────────────────────────────────────┘
 minHeight = 14 + 42 + 14 = 70dp; margin bawah antar item 8dp
```

| Elemen | Spesifikasi |
|---|---|
| Kontainer | bg `#FFFFFF`, radius 18, padding vertikal 14, horizontal 16, `minHeight 70`, shadow `card`, `marginBottom 8` |
| Ikon kiri | Lingkaran 42×42, ikon 20 dp. Tint pastel per kategori: IPL (`#ECFDF5` / `#047857`, `Receipt`), Kas Masuk (`#EFF6FF` / `#1D4ED8`, `ArrowDownLeft`), Iuran Acara (`#FDF2F8` / `#BE185D`, `PartyPopper`), Aduan (`#FFFBEB` / `#B45309`, `MessageSquareWarning`), Kerja Bakti (`#F5F3FF` / `#6D28D9`, `Users`) |
| Kolom tengah | `flex: 1`, `minWidth: 0` (agar ellipsis bekerja). Judul `label` 14 `#0F172A` (SemiBold, bukan Bold; gunakan `PlusJakartaSans_600SemiBold`), `numberOfLines={1}`. Sub-info `caption` `#64748B`, `numberOfLines={1}`, margin atas 2 |
| Kolom kanan | `flexShrink: 0`, `alignItems: 'flex-end'`, `minWidth 72`. Nominal `bodyLg` bold `#0F172A` `TABULAR`. Badge status (§3.3) margin atas 4 |
| Chevron | `ChevronRight` 16 dp `#94A3B8`, margin kiri 8, `accessibilityElementsHidden` |
| Pemisah | Tidak ada garis; pemisahan oleh margin 8 dp |

#### 4.4.2 State Interaksi

| State | Spesifikasi |
|---|---|
| **Default** | Sesuai §4.4.1. `accessibilityRole="button"`, label: `"{judul}, {nominal penuh}, {status}, {tanggal}"` |
| **Pressed** | bg `#F8FAFC`, `scale 0.98` (90 ms), shadow `cardPressed`, haptic `selectionAsync` |
| **Disabled** | opacity 0.5, chevron disembunyikan, tanpa haptic. Dipakai untuk tagihan yang belum terbit (jadwal mendatang): badge `info` dengan teks `AKAN TERBIT` |
| **Loading** | Kontainer tetap putih `radius 18`, `minHeight 70`. Blok: lingkaran 42 `#E2E8F0`; judul 148×12 r6; sub-info 104×10 r5 (margin atas 8); nominal 72×14 r7 (kanan); badge 48×18 r9 (kanan, margin atas 6). Tampilkan 3 item skeleton (dashboard) atau 6 (layar daftar) |

#### 4.4.3 Aturan Mikro & Edge Case

| Kasus | Perilaku |
|---|---|
| Judul panjang | 1 baris, ellipsis tail. Penuh di layar detail |
| Sub-info panjang (nama bank + referensi) | 1 baris, ellipsis tail. Prioritas urutan: metode → tanggal. Jika harus memotong, **tanggal dipertahankan** (format: `{metode} • {tanggal}`, metode dipotong terlebih dulu dengan `flexShrink` pada Text metode) |
| Nominal besar (≥ 9 digit) | `adjustsFontSizeToFit` min 0.75; jika tetap > 112 dp → kompak |
| Nominal negatif (pengeluaran kas) | Tampil `-Rp 2.500.000`, warna `#0F172A` (tidak merah). Pemasukan kas tampil `+Rp 150.000` warna `#047857` |
| Status `rejected` | Sub-info diganti alasan singkat (maks 1 baris), mis. `Bukti buram — unggah ulang` |
| Daftar kosong | Lihat §6.4 Empty States |
| Daftar panjang | `FlatList`, `initialNumToRender 8`, `windowSize 7`, `getItemLayout` bila tinggi seragam (`itemHeight 78`) |

---

### 4.5 Modal Kuitansi (Bottom Sheet)

#### 4.5.1 Dimensi & Perilaku

| Properti | Nilai |
|---|---|
| Tipe | Bottom sheet modal penuh tinggi: top = `insets.top + 8` |
| Scrim | `rgba(15,23,42,0.48)` |
| Radius atas | 24 |
| Fill | `#F8FAFC` (sheet), kertas kuitansi `#FFFFFF` |
| Animasi masuk | `translateY` dari tinggi layar → 0, `withSpring(spring.sheet)` |
| Animasi keluar | `withTiming(…, 240 ms, easing.standard)`; scrim fade 150 ms |
| Tutup | Tombol `Tutup` kiri atas, swipe-down > 120 dp atau velocity > 800 dp/s, tombol back Android, tap scrim |
| Lebar kertas | `screenWidth − 32`, `maxWidth 400`, center |
| Padding kertas | 20 horizontal, 24 vertikal |
| Ekspor | Hanya area kertas (`captureRef`, `format: 'png'`, `quality: 1`, `width: 1080`) |

#### 4.5.2 Anatomi

```
┌──────────────────────────────────────────────┐
│ ‹ Tutup (48×48)               [📤 Bagikan]   │  header h=56 (di luar kertas)
├──────────────────────────────────────────────┤
│ ╭──────────────────────────────────────────╮ │
│ │ PENGELOLA RW 01 / RT 02                  │ │  caption 12, center, #475569
│ │ BUKTI PEMBAYARAN RESMI IPL               │ │  h2 18, center
│ │                                          │ │
│ │            ┌───────────────┐             │ │
│ │            │ ✓  LUNAS      │             │ │  stempel 112×40, border 2 #047857,
│ │            └───────────────┘             │ │  rotate -4°, teks displaySm #047857
│ │              Rp 150.142                  │ │  display 28 center
│ │       Terverifikasi sistem · 09:12 WIB   │ │  caption center
│ │                                          │ │
│ ◖┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈◗ │  perforasi: notch r=8, garis
│ │ No. Kuitansi        KW/2026/10/B12-004   │ │  putus-putus 6/4 #CBD5E1
│ │ Waktu Bayar         14 Okt 2026, 09:12   │ │  baris detail:
│ │ Nama Warga          Ahmad Faizal         │ │  label 120dp fixed (caption #64748B)
│ │ Unit                Blok B-12 / No. 04   │ │  nilai flex, rata kanan, body 14
│ │ Metode              QRIS Dinamis         │ │  min tinggi baris 28, gap 8
│ │ Penerima            Kas Lingkungan RT 02 │ │
│ ◖┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈◗ │
│ │            ┌───────────┐                 │ │
│ │            │  QR 168×  │                 │ │  QR 168×168 di tile putih 184×184
│ │            │    168    │                 │ │  padding 8, border 1 #E2E8F0, r=16
│ │            └───────────┘                 │ │
│ │   Pindai untuk memeriksa keaslian        │ │  caption center
│ ╰──────────────────────────────────────────╯ │
│  [ 💾 Simpan ke Galeri ]  [ 💬 Kirim WA ]    │  2 tombol 52dp, gap 12, lebar sama
└──────────────────────────────────────────────┘
```

#### 4.5.3 Spesifikasi Elemen

| Elemen | Spesifikasi |
|---|---|
| Perforasi | `react-native-svg`: dua notch lingkaran r=8 di tepi kiri/kanan kertas (fill `#F8FAFC`), garis `strokeDasharray="6 4"`, stroke 1 `#CBD5E1`, margin vertikal 16 |
| Stempel `LUNAS` | Kotak 112×40, radius 8, border 2 `#047857`, teks `displaySm` 20 dp `#047857`, rotasi −4°, opacity 0.92. Dekoratif; status juga ada di teks `Terverifikasi sistem` |
| QR | `react-native-qrcode-svg`, `size 168`, error correction `M`, quiet zone ≥ 4 modul via tile putih; warna `#0F172A` di atas `#FFFFFF`. Payload: `https://{domain}/v/{receipt_id}?s={sig}` dengan `sig` = 16 heks pertama HMAC-SHA256 (`receipt_id\|amount\|paid_at`). Tidak memuat nama atau data pribadi. Validasi di server |
| No. Kuitansi | Format `KW/{yyyy}/{MM}/{BLOK-RUMAH-tanpa-spasi}-{seq3}`, font `monoSm`, `ellipsizeMode="middle"`, long-press menyalin (haptic `selectionAsync` + toast `Disalin`) |
| Baris nilai | Nama warga: `numberOfLines={2}`, rata kanan. Lainnya: `numberOfLines={1}` kecuali `Unit` dan `Penerima` (2 baris) |
| Tombol bawah | Simpan: `secondary` 52 dp ikon `Download`. Kirim WhatsApp: `primary` 52 dp ikon `Share2` (membuka share sheet via `expo-sharing`; label `Bagikan` bila WhatsApp tidak terpasang) |

#### 4.5.4 State Interaksi

| State | Spesifikasi |
|---|---|
| **Default** | Sesuai anatomi. Semua tombol aktif |
| **Pressed** | Tombol: spesifikasi §3.1. Baris No. Kuitansi: bg `#F1F5F9` r8 saat long-press |
| **Disabled** | `Bagikan` (header) dan dua tombol bawah disabled (§3.1) selama render PNG berlangsung dan saat kuitansi berstatus `pending` (belum ada QR valid). Kertas tampil dengan stempel `VERIFIKASI` (biru `#1D4ED8`, border 2 `#1D4ED8`), tanpa QR, diganti teks `QR tersedia setelah pembayaran terverifikasi` |
| **Loading** | Kertas tampil: blok skeleton `#E2E8F0`. Judul 220×18 r9 center; nominal 160×28 r8 center; stempel 112×40 r8; 5 baris detail: label 88×10 + nilai 140×12 (r5/r6); QR 168×168 r16; 2 tombol tetap tampil disabled. Shimmer §3.4 |
| **Error** | Kertas diganti `AlertCircle` 32 dp `#B91C1C`, teks `Kuitansi gagal dimuat`, tombol `secondary` `Coba Lagi` |
| **Saving** | Tombol `Simpan` loading (§3.1). Sukses: haptic Success + toast `Tersimpan di galeri`. Izin ditolak: toast + tombol `Buka Pengaturan` |

#### 4.5.5 Edge Case

| Kasus | Perilaku |
|---|---|
| Nama warga > 2 baris | Dipotong ellipsis di baris ke-2; PNG ekspor mengikuti tampilan yang sama |
| Nominal ≥ miliar | Nominal `adjustsFontSizeToFit` min 0.6; **kuitansi tidak boleh memakai format kompak** (dokumen resmi): jika tetap tidak muat, turunkan ke `h2` 18 dp penuh |
| Offline | Kuitansi yang pernah dibuka tersimpan di cache (`expo-file-system`, JPEG metadata + JSON). Tampil dengan banner `Mode offline` (bagian atas sheet, tinggi 32, bg `#FFFBEB`, teks `#B45309`). Simpan & Bagikan tetap aktif (render lokal); verifikasi QR dilakukan oleh pemindai (butuh jaringan di sisi pemindai) |
| Kuitansi dibatalkan/dikoreksi pengurus | Stempel diganti `DIBATALKAN` (border/teks `#B91C1C`), QR dihapus, tombol bagikan disabled |

---

## 5. Alur Layar (Screen Flows)

Semua layar: latar `#F8FAFC`, gutter horizontal 16, pull-to-refresh pada layar daftar (`tintColor #064E3B`, threshold 72 dp).

### 5.1 Dashboard (Beranda)

#### 5.1.1 Hierarki Vertikal (tinggi referensi 360 × 800 dp, inset atas 24 dp)

```
y=0     Status bar inset (24)
y=24    HEADER (h=56): avatar 44 + greeting + bell 48×48
y=80    gap 12
y=92    VIRTUAL RESIDENT CARD (328×206) ............................ §4.1
y=298   gap 24
y=322   Judul "Aksi Cepat" (h2, 24)  → gap 12
y=358   QUICK ACTION GRID (212) ..................................... §4.2
y=570   gap 24
y=594   KAS WIDGET (kartu putih r24, padding 16, tinggi ≈ 156)
y=750   gap 24
y=774   Header section "Aktivitas Terbaru" (24) + "Lihat Semua" (48×48 hit)
y=798   gap 12 → 3 × item 70 + 2 × 8 gap = 226
y=1036  paddingBottom = 68 + bottomOffset + 16  (≈ 126 dp pada inset 34)
        ↳ konten scroll vertikal; bottom bar melayang di atas
```

#### 5.1.2 Header

| Elemen | Spesifikasi |
|---|---|
| Avatar | 44×44 lingkaran, ring 2 `#064E3B` (gap putih 2), fallback inisial 2 huruf `h3` putih di atas `#064E3B` |
| Greeting | Baris 1: `caption` `#64748B` — `Selamat Pagi` (04:00–10:59), `Selamat Siang` (11:00–14:59), `Selamat Sore` (15:00–17:59), `Selamat Malam` (18:00–03:59), jam lokal perangkat. Baris 2: `h1` 22 dp `#0F172A`, `numberOfLines={1}`, nama panggilan (kolom `display_name`) |
| Sub-baris | `caption` `#64748B`: `Blok B-12 / No. 04 • RT 02`, `numberOfLines={1}`, `ellipsizeMode="middle"` |
| Lonceng | Target 48×48, ikon `Bell` 24 dp `#0F172A`. Dot merah 10 dp `#EF4444` border 2 `#F8FAFC` di `top: 10, right: 10` bila ada notifikasi belum dibaca; angka tidak ditampilkan |

#### 5.1.3 Kas Widget

```
┌──────────────────────────────────────────────┐ putih, r=24, padding 16, shadow card
│ Saldo Kas Lingkungan              Okt 2026   │ labelSm #475569 | caption #64748B
│ Rp 48.520.000                                │ displaySm 24 TABULAR, 1 baris
│                                              │
│ ████████████████████████████░░░░░░░░         │ bar h=10 r=5, track #F1F5F9
│ ■ Pemasukan   85%     ■ Operasional  15%     │ legend caption 12, dot 8 r4
│ Rp 6.120.000          Rp 1.080.000           │ bodyLg 15 TABULAR
└──────────────────────────────────────────────┘
```

| Elemen | Spesifikasi |
|---|---|
| Segmen Pemasukan | fill `#064E3B`; segmen Operasional fill `#D4F636` dengan border kiri 2 `#FFFFFF` pemisah; persentase = bagian terhadap (pemasukan + operasional) bulan berjalan, pembulatan ke bilangan bulat, total 100 (sisa pembulatan dibebankan ke segmen terbesar) |
| Segmen minimum | Jika persentase > 0 tetapi lebar < 4 dp, paksa 4 dp |
| Legend | Dot 8 dp (`#064E3B` / `#D4F636` dengan border 1 `#A3B518`), teks label + nilai di bawahnya. Warna bukan satu-satunya pembeda; angka persen selalu tampil |
| Count-up | Saldo naik dari 0 ke nilai akhir, 800 ms, `easing.out`, hanya saat tampil pertama kali dalam sesi aplikasi. Reduce Motion: langsung tampil |
| Tap | Seluruh widget → layar Buku Kas. State pressed: `scale 0.98`, shadow `cardPressed` |
| Loading | Kartu putih, blok `#E2E8F0`: label 140×12; saldo 180×24 r8; bar 296×10 r5; 2 legend 96×10 + 80×14 |
| Disabled (fitur Buku Kas dimatikan pengurus) | Widget **tidak dirender** |

#### 5.1.4 Edge Case Dashboard

| Kasus | Perilaku |
|---|---|
| Nama warga panjang (`Muhammad Abdurrahman Al-Fatih Wijayakusuma`) | Header: 1 baris, ellipsis tail. Kartu: lihat §4.1.6 |
| Saldo kas ≥ 1 miliar | `displaySm` auto-shrink hingga 14 dp; bila tetap terpotong → `Rp 1,25 M` + a11y label penuh |
| Saldo kas negatif | Teks `#B91C1C`, prefiks `-`, label tambahan `caption` `#B45309`: `Saldo di bawah nol — hubungi pengurus` |
| Pemasukan = 0 dan pengeluaran = 0 | Bar kosong (track saja), legend diganti satu baris `Belum ada transaksi bulan ini` |
| Satu unit dimiliki > 1 rumah (multi-unit) | Kartu menampilkan unit aktif; chip switcher `Blok B-12 ▾` di kanan sub-baris header (target 48 dp) membuka bottom sheet pilih unit |
| Jaringan offline | Banner di bawah header: tinggi 36, r12, bg `#FFFBEB`, border 1 `#FDE68A`, ikon `WifiOff` 16 `#B45309`, teks `caption` `#B45309` `Offline • data terakhir 14 Okt 08:30`, `numberOfLines={1}`. Kartu tetap tampil dari cache (§4.1.6); grid sesuai matriks §4.2.4 |
| Gagal memuat (online, error server) | Kartu putih r24 menggantikan modul yang gagal: ikon `CloudOff` 24 `#64748B`, teks `Gagal memuat. Tarik untuk coba lagi`, tombol `ghost` `Coba Lagi`. Modul lain tetap tampil |
| Belum ada aktivitas | Empty state §6.4 |

---

### 5.2 Detail Tagihan & Checkout

#### 5.2.1 Hierarki Vertikal

```
HEADER  h=56:  ‹ Kembali (48×48)   "Rincian Pembayaran" (h3, center)
y=56    gap 12
CHIP    "Oktober 2026" chip h=32 r=10 bg #ECFDF5 teks #047857 label 12
        + "Blok B-12 / No. 04" mono 13 #475569  (1 baris, ellipsis tengah)
        + badge status kanan (§3.3)
gap 16
KARTU RINCIAN (putih, r=24, padding 16):
   "Rincian Iuran" h3
   baris komponen × N: label body 14 (flex, maks 2 baris) | nominal bodyLg TABULAR (shrink 0)
        tinggi baris minHeight 40, divider 1 #F1F5F9 antar baris
   [baris "Kode unik verifikasi" ikon Info 16 → tap membuka tooltip]
   divider 1.5 #E2E8F0 (dashed 4/4)
   baris TOTAL: label h3, nominal displaySm 24 TABULAR 1 baris
   baris jatuh tempo: caption #64748B "Jatuh tempo 20 Okt 2026"
gap 16
"Pilih Metode Bayar" h3 → gap 12
RADIO ROW × 3 (minHeight 64, r=16, padding 12/16, gap 8)
gap 16
INFO KEAMANAN: ikon ShieldCheck 16 #047857 + caption #475569, maks 2 baris
gap 24 ........ ruang scroll
STICKY CTA BAR (di luar scroll): fade 16 dp (transparan → #F8FAFC) di atas,
   bg #F8FAFC, padding 16, paddingBottom = max(inset.bottom, 16)
   [ Bayar Rp 150.142 ]  primary 52 dp full width
```

#### 5.2.2 Radio Row Metode Pembayaran

| State | Spesifikasi |
|---|---|
| Default | bg `#FFFFFF`, border 1.5 `#E2E8F0`, radio 20 dp border 2 `#CBD5E1` |
| Selected | bg `#ECFDF5`, border 1.5 `#064E3B`, radio terisi dot 10 dp `#064E3B`; haptic `selectionAsync` |
| Pressed | `scale 0.98`, bg `#F8FAFC` |
| Disabled | opacity 0.5, subteks alasan (`Tidak tersedia untuk nominal ini`) |
| Loading | Row skeleton minHeight 64, ikon 40×40 r12 + 2 bar 120×12 / 80×10 |

| Metode | Judul | Subteks | Tag kanan |
|---|---|---|---|
| QRIS | `QRIS Instan` | `GoPay, OVO, DANA, m-banking` | badge `info` `OTOMATIS` |
| VA | `Virtual Account` | `BCA / Mandiri` | — |
| Manual | `Transfer Bank Manual` | `Verifikasi otomatis via cek mutasi` | — |

#### 5.2.3 Kode Unik

- 3 digit (1–999), dibuat server, unik di antara semua invoice terbuka pada rekening yang sama.
- Ditampilkan sebagai baris terpisah `Kode unik verifikasi  Rp 142`. Total = pokok + kode unik.
- Tooltip (tap ikon `Info`): `Kode unik membantu sistem mengenali pembayaran Anda secara otomatis. Dana tetap masuk ke kas lingkungan.` (maks 2 baris, 12 dp).

#### 5.2.4 Setelah Tekan CTA (state menunggu pembayaran)

| Metode | Tampilan |
|---|---|
| QRIS | Layar ganti: QR 240×240 di tile putih 256×256 r24 padding 8; timer `mm:ss` (`displaySm`, `TABULAR`) hitung mundur dari 15:00; tombol `ghost` `Simpan QR`. Setelah 00:00: QR di-blur 12 dp + tombol `primary` `Buat QR Baru` (invoice baru dengan kode unik baru) |
| VA / Manual | Kartu rekening: nama bank, nomor `mono` 20 dp ukuran, tombol `Salin Nomor` dan `Salin Jumlah` (masing-masing 48 dp, toast `Disalin`, haptic `selectionAsync`) |
| Pemantauan status | Realtime subscription (Supabase) + polling cadangan tiap 5000 ms selama layar aktif, berhenti saat app background. Lunas → haptic Success → langsung buka Modal Kuitansi (§4.5) |

#### 5.2.5 Edge Case

| Kasus | Perilaku |
|---|---|
| Jumlah komponen iuran tidak tetap (3–12 baris) | Daftar dirender dinamis; > 8 baris tidak di-collapse. Label > 2 baris dipotong ellipsis |
| Label komponen panjang | Maks 2 baris, nominal tidak menyusut kecuali ≥ 10 digit |
| Total ≥ 1 miliar | `displaySm` auto-shrink min 0.6; CTA label memakai kompak: `Bayar Rp 1,25 M`; a11y label nominal penuh |
| Lewat tempo | Badge `overdue`. Baris `Denda keterlambatan` ditampilkan hanya jika dikonfigurasi pengurus, dengan nominal eksplisit. Tidak ada teks berwarna merah atau kata `hukuman/denda utang`. Teks banner info (bg `#FFFBEB`, 2 baris maks): `Tagihan ini sudah melewati jatuh tempo 5 hari. Terima kasih atas pembayarannya.` |
| Sudah lunas | Seluruh layar read-only, radio & CTA disembunyikan, diganti CTA `secondary` `Lihat Kuitansi` |
| Sedang verifikasi (`pending`) | Radio disabled, CTA diganti disabled `Menunggu Verifikasi`; kartu info biru (`#EFF6FF`, teks `#1D4ED8`): `Pembayaran Anda sedang kami cek. Biasanya selesai dalam 5 menit.` |
| Offline | Rincian dari cache tampil (read-only). CTA disabled dengan label `Butuh koneksi internet`. Banner offline §5.1.4 |
| Gagal membuat invoice (HTTP ≥ 500 / timeout 10 000 ms) | CTA kembali ke state default, toast 4000 ms `Gagal membuat pembayaran. Coba lagi.`, haptic Warning. Tidak membuat invoice ganda: kirim `Idempotency-Key` (UUID per sesi checkout) |
| Pengguna menekan back saat QR aktif | Dialog konfirmasi `Pembayaran masih menunggu. Tinggalkan halaman?` dengan `Tetap di Sini` (`primary`) / `Keluar` (`ghost`). Invoice tetap aktif sampai kedaluwarsa |
| Loading awal | Skeleton: chip 120×32, kartu rincian (baris 5 × [140×12 + 72×14]), 3 radio skeleton, CTA skeleton 328×52 r26 |

---

### 5.3 Kuitansi QR (layar penuh dari riwayat)

Layar ini membuka **Modal Kuitansi (§4.5)** langsung. Aturan tambahan:

| Aspek | Spesifikasi |
|---|---|
| Entry point | Tap item riwayat berstatus `paid`; tombol mini Virtual Card (`Lihat Kuitansi`); otomatis setelah pembayaran sukses |
| Setelah pembayaran sukses | Animasi masuk: sheet naik (spring.sheet) dan stempel `LUNAS` muncul `scale 1.4 → 1.0` + `opacity 0 → 0.92` dalam 320 ms (`easing.out`), mulai 200 ms setelah sheet berhenti. Haptic Success tepat saat stempel mulai. Reduce Motion: tanpa animasi |
| Tutup | Kembali ke layar sebelumnya; Dashboard otomatis refetch (invalidate query `bills`, `ledger`) |
| Banyak kuitansi | Tidak ada paging dalam sheet; navigasi antar kuitansi lewat layar Riwayat |
| Data tidak ditemukan (dihapus) | Error state §4.5.4 dengan teks `Kuitansi tidak ditemukan` dan tanpa tombol `Coba Lagi` (diganti `Tutup`) |

---

### 5.4 Form Aduan (Lapor dengan Foto)

#### 5.4.1 Hierarki Vertikal

```
HEADER h=56:  ‹ Kembali      "Lapor Masalah" (h3 center)
gap 12
SECTION 1  "Foto Kendala (opsional, maks 3)"   labelSm #475569
   Row 3 slot foto: tiap slot (screenW−32−2×8)/3 ≈ 104 × 104 dp, r=16
      Slot kosong: bg #F1F5F9, border 1.5 dashed #CBD5E1, ikon Plus 24 #475569
      Slot terisi: gambar cover, tombol hapus 28×28 (hitSlop → 48) kanan atas, bg rgba(15,23,42,0.64), ikon X 14 putih
   Dua tombol ghost di bawah: [ Kamera ]  [ Galeri ]  (tinggi 48, lebar sama, gap 8)
gap 20
SECTION 2  "Kategori"
   Chip wrap, gap 8: tinggi 40 (+hitSlop 4 → 48), padding horizontal 14, r=10
      Daftar: Lampu Jalan · Sampah · Keamanan · Jalan Rusak · Saluran Air · Lainnya
      Single-select, wajib. Default: bg #F1F5F9 teks #475569 | Selected: bg #064E3B teks #FFFFFF + ikon Check 14
gap 20
SECTION 3  "Lokasi"  → Input 52 dp + tombol ikon "Gunakan lokasi saya" (MapPin 20, target 48×48)
   maks 120 karakter; counter tidak ditampilkan
gap 20
SECTION 4  "Deskripsi"  → Input multiline minHeight 120, maks 500 karakter
   counter kanan bawah caption: "128/500" (≥ 450: #B45309; = 500: #B91C1C)
gap 16
INFO   "Estimasi respon petugas: < 24 jam kerja" caption + ikon Clock 14
gap 24 ........ ruang scroll
STICKY CTA  [ Kirim Laporan ] primary 52 dp
```

#### 5.4.2 Aturan Validasi & Data

| Bidang | Aturan |
|---|---|
| Foto | 0–3 foto. Format output JPEG. Pemrosesan `expo-image-manipulator`: resize sisi terpanjang ≤ 1600 px, `compress 0.7`. Target ≤ 800 KB per foto; jika > 1.5 MB setelah kompres, turunkan `compress` ke 0.5 sekali |
| Kategori | Wajib. Tidak ada default terpilih |
| Lokasi | Opsional, 0–120 karakter. `expo-location` `requestForegroundPermissionsAsync`; hasil geocode ke teks dapat diedit. Izin ditolak: tombol ikon disabled + helper `Izin lokasi dimatikan` |
| Deskripsi | Wajib, 10–500 karakter setelah `trim()` |
| CTA | **Disabled** sampai kategori dipilih dan deskripsi valid. Tap area CTA saat disabled: scroll ke bidang pertama yang belum valid + haptic Warning + input error §3.2 |
| Keyboard | `KeyboardAvoidingView` (`behavior: 'padding'` iOS, `'height'` Android), CTA ada di atas keyboard; bottom bar disembunyikan |

#### 5.4.3 State CTA `Kirim Laporan`

| State | Spesifikasi |
|---|---|
| Default | §3.1 `primary` |
| Pressed | §3.1 |
| Disabled | §3.1 `primary` disabled |
| Loading | Spinner di tombol; unggah foto paralel maks 2; progress teks `caption` di bawah tombol `Mengunggah 2 dari 3 foto…` |

#### 5.4.4 Setelah Terkirim: Pelacakan Tiket

```
┌──────────────────────────────────────────────┐
│ ✓ Laporan Terkirim                           │ h2, ikon CheckCircle2 24 #047857
│ Tiket  AD-2026-10-0042                       │ mono 13, long-press = salin
│                                              │
│ ●━━━━━○━━━━━○━━━━━○                          │ stepper horizontal, 4 titik 16dp
│ Terkirim Ditinjau Petugas Selesai            │ caption 11–12, center, maks 2 baris
└──────────────────────────────────────────────┘
```

| Tahap | Label | Titik |
|---|---|---|
| 1 | `Terkirim` | selesai: fill `#064E3B` + ikon `Check` 10 putih; aktif: fill `#D4F636` border 2 `#064E3B`; belum: fill `#FFFFFF` border 2 `#CBD5E1` |
| 2 | `Ditinjau` | idem |
| 3 | `Petugas` | idem |
| 4 | `Selesai` | idem; foto hasil perbaikan ditampilkan sebagai kartu 328×184 r16 di bawah stepper bila ada |

Garis penghubung tebal 3 dp: selesai `#064E3B`, belum `#E2E8F0`. Haptic Success saat laporan terkirim.

#### 5.4.5 Edge Case

| Kasus | Perilaku |
|---|---|
| Foto > 3 | Slot kosong hilang setelah 3; tombol Kamera/Galeri disabled dengan helper `Maksimal 3 foto` |
| Izin kamera ditolak | Toast + tombol `Buka Pengaturan`; Galeri tetap aktif |
| Offline saat kirim | Laporan disimpan ke **outbox lokal** (foto disalin ke `documentDirectory/outbox/{uuid}/`, metadata JSON di MMKV/AsyncStorage). Tampil kartu tiket dengan badge `info` `ANTRE KIRIM` dan ikon `CloudUpload`. Auto-retry: saat NetInfo berubah ke terhubung, lalu backoff 5 s, 15 s, 45 s, 135 s, maks 300 s. Setelah sukses, tiket resmi menggantikan kartu antrean |
| Upload gagal sebagian | Foto berhasil tidak diunggah ulang (cek berdasarkan `uploaded_path`). Kartu menampilkan `Gagal mengunggah 1 foto` + tombol `ghost` `Coba Lagi` |
| Aplikasi ditutup saat mengunggah | Outbox dilanjutkan saat app dibuka kembali |
| Deskripsi berisi hanya spasi | Dianggap kosong → validasi gagal |
| Nama pelapor | Tidak diisi pada form; diambil dari sesi. Pelapor dapat memilih `Sembunyikan nama dari warga lain` (switch 48 dp; default off) |
| Draft | Isi form disimpan lokal saat keluar layar; dihapus setelah kirim sukses; kedaluwarsa 24 jam |

---

## 6. Aturan Lintas-Layar

### 6.1 Jaringan & Offline

| Aspek | Spesifikasi |
|---|---|
| Deteksi | `NetInfo`; offline = `isConnected === false` atau `isInternetReachable === false` selama ≥ 2000 ms (hindari kedip) |
| Cache baca | Query data (tagihan aktif, riwayat 20 terbaru, saldo kas, detail kuitansi yang pernah dibuka, kontak darurat) dipersist; umur maksimal tampil 7 hari, lebih lama → tandai `Data kedaluwarsa` |
| Banner offline | §5.1.4. Muncul 240 ms (`translateY`), hilang 240 ms setelah online; saat kembali online tampil `Terhubung kembali` 2000 ms bg `#ECFDF5` teks `#047857` |
| Aksi tulis | Hanya `Laporan` (outbox, §5.4.5) yang boleh antre. Pembayaran **tidak** boleh diantre |
| Timeout request | Baca 15 000 ms; tulis 10 000 ms; 1× retry otomatis hanya untuk baca |

### 6.2 Bahasa Penagihan (microcopy)

| Situasi | Teks |
|---|---|
| Belum bayar | `Tagihan Oktober 2026 menunggu pembayaran` |
| Lewat tempo | `Tagihan ini melewati jatuh tempo {n} hari` (tanpa tanda seru, tanpa kata `denda` kecuali ada nominal) |
| Lunas | `Terima kasih, pembayaran Anda sudah kami terima` |
| Bukti ditolak | `Bukti pembayaran belum bisa dibaca. Silakan unggah ulang.` |
| Semua lunas | `Tidak ada tagihan yang perlu dibayar` |

### 6.3 Aksesibilitas Minimum

| Item | Aturan |
|---|---|
| Role | Semua `Pressable` punya `accessibilityRole` (`button`/`tab`/`radio`) dan `accessibilityLabel` berisi data lengkap (nominal penuh, bukan kompak) |
| Fokus / urutan | Urutan baca = urutan visual (kiri→kanan, atas→bawah) |
| State | `accessibilityState` untuk `disabled`, `selected`, `busy`, `checked` |
| Live region | Toast: `accessibilityLiveRegion="polite"` (Android) / `AccessibilityInfo.announceForAccessibility` (iOS). Timer QRIS **tidak** di-announce tiap detik (hanya di 05:00, 01:00, 00:30, 00:00) |
| Gerak | Menghormati `useReducedMotion()` (§0.2) |

### 6.4 Empty States

| Kondisi | Visual | Headline (h2) | Subteks (body, maks 2 baris) | CTA |
|---|---|---|---|---|
| Semua tagihan lunas | Ilustrasi SVG 160×120: rumah + perisai, warna `#064E3B`/`#D4F636` | `Semua Tagihan Sudah Lunas` | `Terima kasih sudah ikut menjaga keamanan dan kebersihan komplek.` | `ghost` `Lihat Arsip Kuitansi` |
| Belum ada laporan | Ilustrasi SVG 160×120: bangku taman | `Belum Ada Laporan` | `Jika menemukan fasilitas rusak, laporkan agar segera ditangani.` | `primary` `Buat Laporan Baru` |
| Riwayat kosong | Ikon `ReceiptText` 48 dp `#CBD5E1` | `Belum Ada Riwayat` | `Transaksi Anda akan muncul di sini.` | — |
| Hasil pencarian kosong | Ikon `SearchX` 48 dp `#CBD5E1` | `Tidak Ditemukan` | `Coba kata kunci lain.` | `ghost` `Hapus Filter` |

Layout empty state: center vertikal di area konten, padding horizontal 32, jarak ilustrasi→headline 16, headline→subteks 8, subteks→CTA 24. Teks center.

---

## 7. Checklist Penerimaan (QA) per Komponen

Setiap komponen dianggap selesai bila seluruh butir terpenuhi:

- [x] Memakai token dari `src/theme/index.ts`; tidak ada nilai HEX/angka magis di komponen
- [x] 4 state (Default, Pressed, Disabled, Loading) diimplementasi dan punya story/preview
- [x] Target sentuh ≥ 48×48 dp (diukur dengan hitSlop)
- [x] Kontras teks ≥ 4.5:1 dan ikon/batas ≥ 3:1 (diverifikasi dengan alat kontras)
- [x] Teks panjang diuji: nama 40 karakter, nominal `Rp 1.250.000.000`, blok 24 karakter
- [x] Font OS 130% tidak memotong atau menimpa elemen
- [x] Lebar layar 360 dp dan 430 dp tidak menghasilkan overflow horizontal
- [x] Mode offline dan error terdefinisi
- [x] Reduce Motion diuji
- [x] Label aksesibilitas membaca nominal penuh
- [x] Haptic sesuai §2.7, tidak ada haptic pada elemen disabled

---

*Dokumen ini adalah standar acuan UI/UX untuk tim Front-End dan Produk IPL Mobile. Perubahan token wajib melalui revisi dokumen ini lebih dulu.*