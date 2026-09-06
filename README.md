# Portal Presensi & E-Sertifikat KPU Konawe

Aplikasi React/Vite dengan backend Supabase untuk database presensi, autentikasi administrator, penyimpanan template sertifikat, serta unduhan sertifikat PDF dan JPG.

## Menyiapkan Supabase

1. Buat project Supabase.
2. Jalankan SQL di `supabase/migrations/202609060001_initial_schema.sql` melalui SQL Editor.
3. Buat user administrator melalui Authentication → Users.
4. Tambahkan UUID user tersebut ke `public.admin_users` menggunakan contoh query pada bagian akhir migration.
5. Salin `.env.example` menjadi `.env.local`, lalu isi Project URL dan publishable key.

## Menjalankan lokal

```bash
npm install
npm run dev
```

## Keamanan

Daftar peserta hanya dapat dibaca/dihapus oleh user yang terdaftar sebagai admin. Pengunjung hanya dapat mengirim presensi dan membaca jumlah total peserta.
