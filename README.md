# SIM-BIMTEK — Diskominfo Kabupaten Bogor

**Sistem Informasi Manajemen Bimbingan Teknis** untuk Dinas Komunikasi dan Informatika Kabupaten Bogor. Mengelola siklus hidup penuh kegiatan bimtek kedinasan — dari katalog & pendaftaran, presensi hari-H berbasis QR dinamis, verifikasi berkas, perhitungan honorarium + PPh 21 otomatis, hingga penerbitan & pengarsipan sertifikat.

```
KATALOG → DAFTAR → TIKET QR → PRESENSI HARI-H → VERIFIKASI → HONOR + PAJAK → SERTIFIKAT → LAPORAN
```

Dibangun dengan **Laravel 11 + Inertia.js + React 19 + Tailwind CSS**.

---

## ✨ Fitur Utama

- **3 peran terisolasi** — Administrator, Peserta (ASN/Umum), Narasumber/Pakar, dengan dashboard & alur berbeda
- **QR Presensi Dinamis (HMAC-SHA256)** — token berotasi tiap 10 menit, anti-fraud, dipindai kamera HP
- **PPh 21 Otomatis** — per golongan ASN (IV = 15%, III = 5%, Non-ASN = 2,5%), tarif dapat dikonfigurasi
- **Form Builder Dinamis** — field kustom per event dengan urutan seret-dan-lepas
- **Repository Sertifikat** — unggah massal ZIP dengan auto-match ke penerima (NIK/kode/nama)
- **Verifikasi Berkas** — antrean admin untuk KTP, NPWP, rekening bank
- **Real-time SSE** — dashboard live & toast pendaftaran/presensi tanpa reload
- **Report Center** — Berita Acara & laporan resmi, ekspor CSV standar pemerintahan
- **Dokumen Privat Terproteksi** — KTP/NPWP di disk non-publik, akses via stream terverifikasi

---

## 🛠️ Tech Stack

| Lapisan | Teknologi |
|---|---|
| Backend | Laravel 11 (PHP 8.2), Eloquent ORM |
| Database | SQLite (default) / MySQL / MariaDB |
| Frontend | React 19 via Inertia.js |
| Styling | Tailwind CSS 3.4 |
| Build | Vite 5 |
| QR | `html5-qrcode` (scan) + `qrcode.react` (generate) |
| PDF | `html2pdf.js` |
| Real-time | Server-Sent Events (SSE) |

---

## 📋 Persyaratan

- PHP **8.2** atau lebih tinggi
- Composer
- Node.js **20**+ dan npm
- SQLite (default) atau MySQL/MariaDB
- Ekstensi PHP: `pdo`, `pdo_sqlite`/`pdo_mysql`, `zip`, `mbstring`, `openssl`

---

## 🚀 Instalasi

```bash
# 1. Clone repository
git clone <url-repo> bimtek-diskominfo-bogor
cd bimtek-diskominfo-bogor

# 2. Install dependensi PHP
composer install

# 3. Install dependensi frontend
npm install

# 4. Salin environment & generate key
cp .env.example .env
php artisan key:generate

# 5. Buat database SQLite & jalankan migrasi + seeder
touch database/database.sqlite
php artisan migrate --seed

# 6. Buat storage symlink (untuk avatar/materi)
php artisan storage:link

# 7. Build frontend
npm run build        # produksi
# atau
npm run dev          # development (hot reload)
```

---

## ▶️ Menjalankan Aplikasi

### Opsi 1 — Windows 1-klik (termudah)

Klik ganda file **`jalankan-aplikasi.bat`**. Server multi-worker berjalan di `0.0.0.0:8000`, browser terbuka otomatis.

### Opsi 2 — Perintah manual

```bash
php artisan serve --host=0.0.0.0 --port=8000
```

Buka **http://127.0.0.1:8000** di browser.

### Opsi 3 — Docker

```bash
docker build -t sim-bimtek .
docker run -p 8080:8080 sim-bimtek
```

Buka **http://localhost:8080**.

### 📱 Akses dari HP (uji scan QR)

Saat menguji pemindai kamera QR presensi hari-H:

1. Hubungkan laptop & HP ke **jaringan Wi-Fi yang sama**.
2. Cari IP laptop (`ipconfig` di Windows, lihat *IPv4 Address*, mis. `192.168.1.15`).
3. Di HP, buka browser dan akses `http://192.168.1.15:8000`.
4. Login sebagai peserta → buka menu **"Presensi Hari-H"** untuk scan QR.

---

## 🔑 Akun Demo

Semua akun menggunakan kata sandi: **`password`**

| Peran | Email | Hak Akses |
|---|---|---|
| **Administrator** | `admin@bogorkab.go.id` | Kelola BIMTEK, QR Proyektor, Verifikasi Berkas, Laporan Presensi, Honor PPh 21, Repository Sertifikat |
| **Peserta ASN/Umum** | `peserta@bogorkab.go.id` | Formulir Pendaftaran, Tiket QR, Presensi Hari-H, Unduh Sertifikat |
| **Narasumber/Pakar** | `pembicara@bogorkab.go.id` | Jadwal Mengajar, Rekening BJB, Presensi Sesi, Sertifikat |

> 💡 Tombol **Quick Switch** di navbar kanan-atas (khusus admin) untuk berganti peran instan tanpa logout.

### Halaman penting

| Halaman | URL |
|---|---|
| Portal utama | http://127.0.0.1:8000 |
| Login | http://127.0.0.1:8000/login |
| Dashboard | http://127.0.0.1:8000/dashboard |
| Pemindai presensi | http://127.0.0.1:8000/attendance/scan |
| Layar QR proyektor | http://127.0.0.1:8000/admin/events/1/qr-event |

---

## 📂 Struktur Proyek

```
bimtek-diskominfo-bogor/
├── app/
│   ├── Http/Controllers/     # 14 controller logika bisnis
│   ├── Http/Middleware/      # AdminMiddleware
│   ├── Models/               # 16 model Eloquent
│   ├── Services/             # RealtimeStreamService (SSE)
│   └── Events/               # ParticipantRegistered
├── database/
│   ├── migrations/           # 18 file migrasi
│   ├── seeders/              # DatabaseSeeder + sample peserta
│   └── factories/
├── resources/js/
│   ├── Pages/                # Halaman React/Inertia (Auth, Events, Attendance, Admin, dll)
│   ├── Components/           # Komponen reusable (Navbar, Logo, dll)
│   ├── Layouts/              # AppLayout
│   └── Hooks/                # useParticipantRealtime
├── routes/
│   └── web.php               # Peta rute lengkap
├── storage/                  # Disk publik + lokal terproteksi (KTP/NPWP)
├── Dockerfile
├── jalankan-aplikasi.bat     # 1-klik Windows
└── package.json
```

---

## 👥 Peran Pengguna

| Peran | Deskripsi |
|---|---|
| 🔵 **Admin** | Operator Diskominfo. Kelola event, generate QR proyektor, verifikasi berkas, hitung honor & PPh, repository sertifikat, laporan, monitoring real-time. |
| 🟢 **Peserta** | ASN atau umum. Daftar bimtek (NIK + rekening BJB + field dinamis), dapat tiket QR, presensi scan, unduh sertifikat. |
| 🟡 **Narasumber** | Pakar/widyaiswara. Jadwal mengajar, upload materi, rekening + data PPh, presensi sesi, sertifikat narasumber. |

Detail matriks hak akses lihat di [PRD.md](PRD.md).

---

## 📄 Dokumentasi

- **[PRD.md](PRD.md)** — Product Requirements Document lengkap (arsitektur, ERD, modul, alur kerja)
- **[README_LOCALHOST.md](README_LOCALHOST.md)** — Panduan singkat akses localhost

### Rujukan kode

| Bagian | Lokasi |
|---|---|
| Peta rute | `routes/web.php` |
| Logika bisnis | `app/Http/Controllers/` |
| Model & relasi | `app/Models/` |
| Skema database | `database/migrations/` |
| Antarmuka | `resources/js/Pages/` |
| Real-time | `app/Services/RealtimeStreamService.php` |

---

## 🔒 Catatan Keamanan

- Password di-hash dengan bcrypt (default Laravel)
- Berkas sensitif (KTP/NPWP) di disk non-publik, akses via stream terverifikasi
- Token QR presensi menggunakan HMAC-SHA256 berotasi
- CSRF token pada semua form
- `ActivityLog` audit tak terhapus

> ⚠️ **Produksi:** Sebelum deployment produksi, aktifkan HTTPS, rate limiting login, backup terjadwal, dan audit keamanan formal.

---

## 📜 Lisensi

Proyek internal — Dinas Komunikasi dan Informatika Kabupaten Bogor.
