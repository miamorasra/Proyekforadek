# Ruang Tenang untuk Adek

Website hadiah mobile-first: langit bintang Canvas, ruang cerita privat, animasi pelepasan bintang 60 detik, BGM/VO, pesan validasi, pelukan virtual, dan dashboard Kaka.

## Struktur

```text
ruang-tenang-adek/
├── index.html
├── admin.html
├── config.js                 # URL + anon key Supabase (public key)
├── schema.sql                # Jalankan di Supabase SQL Editor
├── netlify.toml
├── .env.example
├── package.json
├── netlify/functions/        # Login 24 jam + penyimpanan cerita
├── assets/                   # Letakkan audio fallback di sini
└── tests/
```

## 1. Siapkan Supabase

1. Buat project di https://supabase.com/dashboard.
2. Buat akun admin melalui **Authentication → Users → Add user**. Matikan public sign-ups setelah akun admin dibuat.
3. Salin UID admin dari halaman Users.
4. Buka `schema.sql`, ganti setiap `YOUR_ADMIN_AUTH_USER_UUID` dengan UID admin tersebut, lalu jalankan seluruh SQL di Supabase SQL Editor.
5. Dari **Project Settings → API**, salin Project URL dan `anon`/publishable key ke `config.js`.
6. Simpan `service_role` key hanya sebagai environment variable Netlify. Jangan pernah menaruhnya di `config.js`, HTML, atau repository publik.

## 2. Konfigurasi Netlify

Import repository atau deploy folder ini ke Netlify. Pada **Site configuration → Environment variables**, tambahkan:

| Variable | Nilai |
|---|---|
| `GUEST_PASSWORD` | Password tamu pilihanmu (jangan tulis di repository) |
| `SESSION_SECRET` | Secret acak minimal 32 byte |
| `SUPABASE_URL` | Project URL Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key Supabase |

Generate secret lokal dengan `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`.
Setelah mengisi environment variables, trigger deploy ulang. Fungsi server menetapkan cookie HttpOnly, Secure, SameSite=Strict selama 24 jam. Password admin berbeda dan dikelola oleh Supabase Auth.

## 3. Audio dan dashboard

- Fallback opsional: taruh `bgm.mp3`, `vo-1.mp3`, `vo-2.mp3`, `vo-3.mp3` di folder `assets/`.
- Buka `/admin.html`, login memakai email dan password admin Supabase.
- Ubah teks pembuka/validasi dan unggah audio dengan nama file persis di atas. File disimpan di Supabase Storage bucket `site-audio`.
- Cerita Adek tersimpan di tabel `vent_entries` dan hanya dapat dibaca/dihapus oleh admin yang UID-nya diizinkan. Cerita tidak disimpan ke LocalStorage/sessionStorage.

## 4. Jalankan lokal

```bash
npm install
cp .env.example .env
# Isi .env dengan kredensial project untuk fungsi Netlify
npx netlify dev
```

Buka URL lokal yang ditampilkan Netlify CLI. Cookie Secure pada produksi membutuhkan HTTPS; gunakan Netlify Dev untuk simulasi fungsi lokal. Jangan commit `.env`.

## 5. Pengujian

```bash
npm test
```

Tes mencakup validasi isi cerita, token sesi bertanda tangan, deteksi manipulasi token, dan expiry 24 jam.

## Catatan keamanan dan privasi

- Password tamu hanya disimpan di environment variable `GUEST_PASSWORD` di Netlify; jangan pernah menuliskannya di repository.
- Session guest ditandatangani server-side, tidak disimpan di LocalStorage, dan cookie HttpOnly berakhir setelah 24 jam.
- `SUPABASE_SERVICE_ROLE_KEY` hanya dipakai fungsi server untuk insert cerita; jangan bocorkan.
- Database tidak menghapus cerita otomatis. Admin dapat menghapus cerita manual dari dashboard.
- Audio di bucket publik dapat diputar tanpa login; jangan unggah rekaman privat selain VO yang memang dimaksudkan untuk diperdengarkan.
- Animasi bintang berjalan 60 detik. Pesan penutup muncul setelah animasi; pengguna tetap dapat jeda atau memutar ulang VO.
- Audio fallback yang belum ada tidak menghentikan alur website.

## Checklist sebelum dibagikan

- [ ] Ganti placeholder UID di `schema.sql` dan jalankan SQL.
- [ ] Isi `config.js` dengan URL dan anon key project.
- [ ] Isi empat environment variables Netlify.
- [ ] Uji login Adek di HTTPS dan pastikan sesi habis setelah 24 jam.
- [ ] Uji login admin, edit teks, upload audio, baca dan hapus cerita.
- [ ] Tambahkan rekaman audio final.
