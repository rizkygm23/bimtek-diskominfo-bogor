# 🌐 Panduan Menjalankan & Menghosting SIM-BIMTEK di Localhost

Aplikasi **SIM-BIMTEK Diskominfo Kabupaten Bogor** siap dijalankan di komputer lokal Anda (*localhost*).

---

## 🚀 1. Akses Aplikasi Saat Ini (Server Sedang Aktif)

Server lokal saat ini telah aktif di latar belakang. Anda dapat langsung membuka link di bawah ini pada peramban (Chrome / Edge / Firefox):

👉 **Portal Utama:** [http://127.0.0.1:8000](http://127.0.0.1:8000)  
👉 **Dashboard:** [http://127.0.0.1:8000/dashboard](http://127.0.0.1:8000/dashboard)  
👉 **Login Portal:** [http://127.0.0.1:8000/login](http://127.0.0.1:8000/login)  
👉 **Layar QR Presensi Proyektor:** [http://127.0.0.1:8000/admin/events/1/qr-event](http://127.0.0.1:8000/admin/events/1/qr-event)  

---

## 🔑 2. Akun Pengujian / Demo (Password: `password`)

| Peran (Role) | Email Login | Hak Akses Utama |
| :--- | :--- | :--- |
| **Administrator** | `admin@bogorkab.go.id` | Kelola BIMTEK, QR Proyektor, Verifikasi Berkas, Laporan Presensi, Honor PPh 21, Repository Sertifikat |
| **Peserta ASN / Umum** | `peserta@bogorkab.go.id` | Formulir Pendaftaran, Tiket QR Code, Presensi Hari-H, Unduh Sertifikat |
| **Narasumber / Pakar** | `pembicara@bogorkab.go.id` | Jadwal Mengajar, Rekening Bank BJB, Presensi Sesi, Sertifikat Narasumber |

> 💡 *Tips:* Pada navbar kanan atas, Anda juga dapat mengklik tombol **Quick Switch (Admin | Peserta | Speaker)** untuk berganti akun secara instan tanpa perlu logout/login manual.

---

## 📂 3. Cara Menjalankan Server Sendiri di Masa Mendatang

Tersedia file eksekusi otomatis **1-Klik**:

1. Buka folder proyek (sesuaikan dengan lokasi instalasi Anda):  
   `C:\Users\HP\codingan\bimtek-diskominfo-bogor`
2. Klik ganda file:  
   `scripts\jalankan-aplikasi.bat`
3. Jendela terminal akan terbuka dan browser Anda otomatis membuka `http://127.0.0.1:8000`.

> **Alternatif Laragon:** Buka terminal Laragon (klik kanan tray icon → Terminal), lalu:
> ```bash
> cd C:\Users\HP\codingan\bimtek-diskominfo-bogor
> php artisan serve --host=0.0.0.0 --port=8000
> ```

---

## 📱 4. Cara Akses dari HP (Untuk Uji Scan Kamera QR Code Hari-H)

Jika Anda ingin mencoba scan QR Code menggunakan kamera HP peserta di jaringan Wi-Fi yang sama:

1. Pastikan laptop dan HP terhubung ke jaringan Wi-Fi yang sama.
2. Cari alamat IP Laptop Anda (buka PowerShell dan ketik `ipconfig`, lihat *IPv4 Address*, misalnya `192.168.1.15`).
3. Pada HP Anda, buka browser dan masukkan alamat:  
   `http://192.168.1.15:8000`
4. Login sebagai peserta dan buka menu **"Presensi Hari-H"** untuk mencoba scan kamera ke layar laptop/proyektor!
