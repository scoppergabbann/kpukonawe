# Portal Presensi & E-Sertifikat KPU Konawe

Aplikasi React/Vite dengan backend Supabase untuk database presensi, autentikasi administrator, penyimpanan template sertifikat, serta unduhan sertifikat PDF dan JPG.

## Menyiapkan Supabase

1. Buat project Supabase.
2. Jalankan seluruh file SQL di `supabase/migrations` secara berurutan melalui SQL Editor.
3. Buat user administrator melalui Authentication → Users.
4. Tambahkan UUID user tersebut ke `public.admin_users` menggunakan contoh query pada bagian akhir migration.
5. Salin `.env.example` menjadi `.env.local`, lalu isi Project URL dan publishable key.

## Menjalankan lokal

```bash
npm install
npm run dev
```

## Keamanan

Pengunjung dapat melihat nama peserta, nomor sertifikat, dan asal kampus/universitas. Sertifikat dapat dicari ulang menggunakan email yang dipakai saat presensi. Daftar email, pengelolaan peserta, ekspor CSV, dan penghapusan data tetap hanya dapat diakses administrator.
