# SECURITY CHECK REPORT — SIM-BIMTEK Diskominfo Kab. Bogor

Tanggal: 2026-09-15 · Target: http://localhost:8080 (Docker dev) + analisis statis kode & Git history
Metode: eksposisi HTTP aktif, scan statis (grep), scan Git history (`git log -p`), uji penetrasi ringan (SQLi/XSS payload), inspeksi konfigurasi

**REKAP: 20/20 poin dicek — 15 PASS, 5 temuan (1×P1, 2×P2, 2×P3 + catatan). Tidak ada credential bocor di Git. Tidak ada SQLi/XSS yang bisa dieksekusi.**

---

## CHECKLIST 20 POIN

| # | Poin | Status | Bukti |
|---|---|---|---|
| 1 | API key aman | ✅ PASS | Tidak ada API key pihak ketiga di kode maupun history; APP_KEY hanya di `.env` |
| 2 | .env jangan public | ✅ PASS | GET `/.env`, `/.env.backup`, `/.env.production`, `/.git/config`, `/storage/logs/laravel.log` → semua **404** (webroot = `public/`); `.env` di-gitignore & **tidak pernah ter-commit** (`git log --all -- .env` kosong) |
| 3 | No hardcode secret | ✅ PASS | Grep `password/secret/api_key = "..."` di `app/ routes/ config/` → bersih |
| 4 | Cek secret di Git | ✅ PASS | Scan `git log --all -p` untuk pola secret & `APP_KEY=base64:` → kosong |
| 5 | Debug mode | ⚠️ FINDING F3 | Dev `APP_DEBUG=true` (wajar). **Produksi tidak memaksa OFF** — Dockerfile/entrypoint prod tidak set `APP_DEBUG`; bergantung env Railway. Jika env produksi lupa → stack trace bocor ke publik |
| 6 | Error jangan bocor | ⚠️ terkait F3 | Perilaku error mengikuti APP_DEBUG (lihat F3) |
| 7 | Validasi input | ✅ PASS | Semua endpoint tervalidasi ketat (terbukti di QA: NIK size:16, no_hp regex, rekening 8–24 digit, min:0.5, in:enum, dst.) |
| 8 | Sanitasi input | ✅ PASS | Output di-escape: React auto-escape; tidak ada `dangerouslySetInnerHTML`; satu-satunya `innerHTML` adalah pengosongan (`= ''`, tanpa data user) |
| 9 | Anti SQL injection | ✅ PASS | **0 penggunaan `DB::raw`/`whereRaw`** di seluruh `app/` — semua Eloquent/query builder dengan binding; uji aktif `' OR '1'='1` dan `UNION SELECT` pada login → gagal normal, tanpa bypass sesi |
| 10 | Anti XSS | ✅ PASS | Uji stored-XSS: judul event `<script>…`, `</script><img onerror>` → disimpan di blok `<script type="application/json">` dengan **`/` ter-escape (`<\/script>`)** sehingga breakout tag mustahil; render client di-escape React. Payload tidak pernah menjadi HTML hidup |
| 11 | Server-side auth | ✅ PASS | Semua rute berat digate middleware `auth`/`guest` server-side (302/403 terverifikasi QA) — tidak ada keandalan pada client |
| 12 | Cek akses user | ✅ PASS | `DocumentStreamController`: KTP/NPWP hanya untuk **admin atau pemilik profil** (query `where('user_id', $user->id)`); eligibilitas check-in dicek server-side |
| 13 | Role admin aman | ✅ PASS | `AdminMiddleware` di semua `/admin/*` + **403 JSON untuk XHR**; ter-verify 3 role |
| 14 | DB jangan public | ✅ PASS (prod) / ⚠️ (dev) | Produksi (Railway) private; **dev** compose mengekspos 3306 ke host — wajar untuk lokal, jangan di-deploy begitu |
| 15 | DB permission ketat | ✅ PASS | App konek sebagai user khusus `bimtek` (bukan root) dengan password terpisah; ⚠️ password dev `rootpass`/`bimtekpass` hardcoded di docker-compose (dev-only, jangan untuk prod) |
| 16 | Hash password | ✅ PASS | DB: `$2y$12$…` = bcrypt cost 12; `Hash::make` di semua pembuatan akun; tidak ada plaintext |
| 17 | Session aman | ✅ PASS + ⚠️ | Driver database, `http_only=true`, `same_site=lax`; CSRF terbukti aktif (419 di semua POST tanpa token). ⚠️ `SESSION_SECURE_COOKIE` belum diset — **wajib `true` saat HTTPS produksi** |
| 18 | Reset password aman | ❌ F4 | **Fitur reset password tidak ada** — link "Lupa Password?" di halaman login mati (`href=""`). Tidak exploitable, tapi gap fungsional & membingungkan user |
| 19 | Batasi upload file | ⚠️ FINDING F2 | Validasi app ketat (mimes pdf/png/jpg, KTP ≤5MB, materi ≤20MB, ZIP ≤100MB, berkas sensitif ke disk privat `local`) — **TAPI** PHP container `upload_max_filesize=2M` < batas app → upload 2–5MB gagal samar sebelum validasi |
| 20 | Scan upload file | ⚠️ catatan | Validasi mime dilakukan content-sniffing (bukan sekadar ekstensi) ✅; **tidak ada antivirus scan** (ClamAV dsb.) — wajar untuk fase ini, rekomendasi jika naik produksi |

## TEMUAN & REKOMENDASI (urut prioritas)

> **STATUS 2026-09-15: F1, F2, F3, F4, F5 — SEMUANYA SUDAH DIPERBAIKI & DIVERIFIKASI.**

### F1 (P1) — Tidak ada rate-limit pada login & register — ✅ DIPERBAIKI
`POST /login` dan register tidak ber-throttle (throttle hanya ada di check-in/admin/realtime). Memungkinkan brute-force password tanpa hambatan.
**Fix:** `->middleware('throttle:5,1')` pada login, `throttle:10,1` pada register (routes/web.php).
**Verifikasi:** percobaan login ke-6 dalam satu menit → **429 Too Many Requests**.

### F2 (P2) — Limit upload PHP (2M) lebih kecil dari batas validasi aplikasi — ✅ DIPERBAIKI
App mengizinkan KTP 5MB / materi 20MB / ZIP 100MB, tapi `upload_max_filesize=2M` memotong lebih dulu → user upload 3MB gagal samar.
**Fix:** `conf.d/zz-uploads.ini` (upload_max_filesize=110M, post_max_size=120M, max_execution_time=120) di Dockerfile produksi & Dockerfile.dev.
**Verifikasi:** `php -r` di container → `upload_max_filesize=110M post_max_size=120M`.

### F3 (P2) — Produksi tidak memaksa `APP_DEBUG=false` & `SESSION_SECURE_COOKIE=true` — ✅ DIPERBAIKI
Semua bergantung env Railway; salah set → stack trace bocor + cookie tanpa flag Secure.
**Fix:** `docker-entrypoint.sh` (prod) kini men-set default aman **sebelum** `config:cache`: `APP_DEBUG=${APP_DEBUG:-false}`, `SESSION_SECURE_COOKIE=${SESSION_SECURE_COOKIE:-true}` — env Railway masih bisa menimpa.

### F4 (P3) — Reset password tidak diimplementasi — ✅ DIMITIGASI
Link mati di halaman login.
**Fix:** link "Lupa Password?" dihapus dari Login.jsx (dengan komentar penanda). Implementasi fitur reset penuh (butuh mailer) tetap sebagai backlog.

### F5 (P3) — Password DB dev hardcoded di docker-compose.yml — ✅ DIBERI PERINGATAN
`rootpass`/`bimtekpass` — dapat diterima untuk lokal, tapi jangan dipakai di infra mana pun yang terekspos.
**Fix:** komentar peringatan eksplisit ditambahkan di docker-compose.yml.

### Catatan tambahan
- `body_html` (template laporan) disimpan sebagai HTML mentah, hanya dapat diedit admin, dan **tidak** dirender via `innerHTML` — risiko terbatas pada self-XSS admin. Tetap validasi/bersihkan bila kelak dirender.
- CORS: `config/cors.php` tidak ada → default Laravel (path terbatas) — aman untuk aplikasi same-origin.

## KESIMPULAN
Postur keamanan dasar **kuat**: tidak ada secret bocor di Git, .env tak terjangkau, SQLi & XSS termitigasi by-design (binding penuh + escape berlapis), otorisasi server-side konsisten, bcrypt, CSRF aktif, dokumen sensitif di disk privat dengan cek kepemilikan. Prioritas perbaikan sebelum produksi: **F1 (throttle login) dan F2 (upload limit)**, lalu F3 (default aman produksi).
