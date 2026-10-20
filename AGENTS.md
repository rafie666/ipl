# Wargaku IPL Mobile — Agent Guidelines & Instructions

Panduan wajib bagi setiap agent sebelum mengeksekusi task di aplikasi mobile (`ipl/`).

Dokumentasi arsitektur lengkap: [docs/PROJECT_CONTEXT.md](file:///home/adly/Projects/ipl-mobile/docs/PROJECT_CONTEXT.md)  
Spesifikasi visual kanonikal: [desain.md](file:///home/adly/Projects/ipl-mobile/ipl/desain.md)

---

## 1. Aturan Arsitektur & Navigasi Mobile

- **React Navigation v7, BUKAN Expo Router:**
  - Aplikasi mobile menggunakan `@react-navigation/native-stack` dan `@react-navigation/bottom-tabs`.
  - **Dilarang** membuat folder `src/app/` atau mengimpor dari `expo-router`.
  - Navigasi utama didefinisikan di [`src/navigation/RootNavigator.js`](file:///home/adly/Projects/ipl-mobile/ipl/src/navigation/RootNavigator.js).
- **Offline-First Storage:**
  - Simpan dan baca data via [`src/utils/storage.js`](file:///home/adly/Projects/ipl-mobile/ipl/src/utils/storage.js) (`getStorageItem`, `saveStorageItem`).
  - Helper ini menangani sinkronisasi non-blocking ke Supabase jika terhubung.
- **Continuous Native Generation (CNG):**
  - Jangan edit folder `android/` atau `ios/` manual. Konfigurasi melalui `app.json`.

---

## 2. Batasan Perubahan Backend & Database

- **Dilarang Mengubah Backend Tanpa Instruksi:**
  - Dilarang memodifikasi skema tabel Supabase, SQL migration, atau API contract.
  - Tabel Supabase menyimpan data dalam format JSONB (`id`, `data`, `updated_at`).
- **Kredensial:**
  - Jangan pernah menampilkan isi file `.env` atau token JWT di chat.

---

## 3. Aturan Role & Hak Akses

Sistem memiliki **6 role login**: `admin`, `rw`, `rt`, `bendahara`, `pengurus`, `warga`.

- **Satpam:** Bukan role login pengguna. Satpam adalah entitas jadwal piket dan nomor kontak darurat.
- **Scoping Data:**
  - Warga (`isWarga`): Tagihan, profil, dan data rumah sendiri (`currentUser.resident_id`).
  - Ketua RT (`isRT`): Data warga, kas, dan surat di RT-nya (`currentUser.rt_id`).
  - Ketua RW (`isRW`): Data RT di bawah RW-nya (`currentUser.rw_id`).
  - Bendahara (`isBendahara`): Audit buku kas, verifikasi bukti bayar, dan Peta Warga.
  - Pengurus (`isPengurus`): Fasum, kegiatan, dan operasional.
  - Admin IT (`isAdmin`): Konfigurasi sistem dan database.
- **Dual Role:**
  - Pengguna dengan jabatan struktural (`isOfficial`) memiliki `hasDualRole = true`.
  - Dukung peralihan antara `activeMode: 'jabatan'` dan `activeMode: 'warga'`.

---

## 4. Design System & UI Consistency (`desain.md` v2.0.0)

- **Tokens Kanonikal:** Gunakan token dari [`src/theme/index.ts`](file:///home/adly/Projects/ipl-mobile/ipl/src/theme/index.ts).
- **Aturan Warna & Aksen:**
  - Primer: Emerald `#059669`, Deep Emerald `#064E3B`, Forest `#022C22`.
  - Teks muted: `#64748B` (WCAG AA 4.75:1). Hindari `#94A3B8`.
  - Neon Lime `#D4F636`: HANYA untuk fill tombol/pill dengan teks `#022C22` atau aksen di atas emerald gelap. Dilarang sebagai teks/border di atas putih.
  - Status Jatuh Tempo: Gunakan warna Amber `#B45309` (bukan Merah).
- **Format Data Indonesia:**
  - Mata uang: `formatRupiah(num)` dari `src/utils/format.ts` (`Rp\u00A0150.000`).
  - Nominal finansial: Wajib `fontVariant: ['tabular-nums']`.
- **Komponen Baru:** Buat komponen UI baru dalam TypeScript (`.tsx`) di bawah `src/components/ui/`.

---

## 5. Perintah Eksekusi & Verifikasi

```bash
# 1. Jalankan development server mobile (offline-ready)
npm run start       # atau: npx expo start --offline

# 2. Jalankan di Android Emulator
npm run android

# 3. Jalankan di Web
npm run web

# 4. Verifikasi TypeScript (WAJIB dijalankan sebelum menyatakan selesai)
npx tsc --noEmit

# 5. Diagnosa kesehatan Expo
npx expo-doctor

# 6. Build Android APK Preview
npx eas-cli build --profile preview --platform android
```

---

## 6. Panduan Penggunaan Skill

- **`/caveman`:** Gunakan saat diminta respons ringkas, fokus fakta teknis, bebas basa-basi.
- **`/graphify`:** Gunakan untuk analisis dependensi dan impact analysis sebelum refactor besar. Cek `graphify-out/` terlebih dahulu sebelum build ulang.
