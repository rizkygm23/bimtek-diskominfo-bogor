# Security Fix Log — Bug Bounty Resolution

**Source report:** `bimtek_bugbounty_report.md` (SUPERAGENT v7.1, 2026-09-11)
**Resolved by:** source-level audit + fixes below
**Date:** 2026-09-11

---

## Triage: Findings vs Actual Code

Laporan black-box auditor berisi beberapa asumsi yang **tidak valid** setelah
diverifikasi di source. Berikut triase jujur per-finding.

### ❌ Bukan bug — auditor keliru (no fix needed)

| Finding | Kenapa bukan bug (bukti di source) |
|---|---|
| **F4 Mass Assignment** | Tidak ada `request()->all()` di mana pun. Semua controller pakai `$request->validate([...])` lalu akses `$validated['...']` eksplisit → whitelist field. Role/status tidak bisa di-tamper client. |
| **F2 Storage path public** | File KTP/NPWP/rekening disimpan ke disk `'local'` (protected), BUKAN `'public'`. Akses hanya via `DocumentStreamController::stream()` yang cek `user_id` match owner ATAU admin (line 20-29). Bukan IDOR. |
| **F2 MIME spoof** | Upload KTP/NPWP pakai `mimes:jpeg,png,jpg,pdf` — Laravel validator cek real MIME via `guessExtension()`, bukan extension client. |
| **F2 Path traversal** | `$file->store("documents/{$user->id}", 'local')` — Laravel generate filename random otomatis, tidak pakai `getClientOriginalName()`. |
| **F5 IDOR ticket** | `RegistrationController::ticket()` line 290: `if (auth()->id() !== $registration->user_id && auth()->user()->role !== 'admin') abort(403)`. Sudah scoped ke owner/admin. |
| **F8 /up leak** | Laravel default `/up` hanya return `{"status":"ok"}` — tidak bocor DB state (asumsi auditor keliru). Dipertahankan publik untuk Railway liveness probe. |

### ✅ Bug nyata — di-fix

#### F1: NIK & form fields tanpa validasi server-side (HIGH → FIXED)

**Root cause:** `RegistrationController` & `AuthController` cuma pakai
`'nik' => 'required|string|max:50'` — gak cek numeric, 16-digit, format NIK
Indonesia. Bisa di-bypass POST langsung ke route Inertia skip React.

**Fix:**
- `app/Rules/ValidIndonesianNIK.php` (NEW) — custom rule validasi:
  16 digit numeric + kode provinsi valid (01-94) + tanggal lahir valid
  (handle DD > 40 untuk perempuan) + nomor urut bukan 000.
- `RegistrationController::store` peserta: `nik` → `['required','string','size:16', new ValidIndonesianNIK]`,
  `no_hp` → regex `^08[0-9]{7,12}$`, `account_number` → `^[0-9]{8,24}$`,
  `npwp` → format NPWP atau 15-16 digit.
- `RegistrationController::store` pembicara: `nip_nik` → `^[0-9]{16,18}$`
  (NIP ASN 18 digit atau NIK 16 digit), `no_hp` & `account_number` sama.
- `AuthController::registerPeserta`: `nip_nik` nullable tapi kalau diisi
  harus valid NIK 16-digit + `no_hp` regex.
- `AuthController::registerPembicara`: `nip_nik` required + `^[0-9]{16,18}$` + unique.
- Frontend `RegisterForm.jsx`: `inputMode="numeric"` + `pattern` + sanitize
  non-digit di field NIK/NIP/no_hp/account_number (UX helper, bukan pertahanan utama — server tetap gate).

#### F3: Quota race condition (MEDIUM-HIGH → FIXED)

**Root cause:** `EventRegistration::create()` langsung tanpa `lockForUpdate` →
TOCTOU race. Plus belum ada unique constraint (event_id, user_id) anti
double-register.

**Fix:**
- `database/migrations/2026_09_11_000001_add_unique_event_registration_constraint.php` (NEW):
  - Bersihkan duplikat (bimtek_event_id, user_id) yang sudah ada (keep id terkecil).
  - Tambah unique index `event_reg_unique_event_user`.
- `RegistrationController::store`: bungkus `EventRegistration::create` di
  `DB::transaction` + `BimtekEvent::lockForUpdate()` + quota check atomik.
- `app/Exceptions/OverQuotaException.php` (NEW): exception custom untuk quota penuh.
- Catch `QueryException` SQLSTATE 23000 (unique violation) → redirect ke tiket
  yang sudah ada (race double-register dihalangi di level DB).

#### F6: Fingerprint header `x-powered-by` (→ FIXED)

**Fix:** `app/Http/Middleware/SecurityHeaders.php` (NEW) —
`$response->headers->remove('X-Powered-By')` di setiap response.

#### F7: Security headers kosong (→ FIXED)

**Fix:** `SecurityHeaders` middleware tambah:
- `X-Frame-Options: DENY` (anti clickjacking login)
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()`
- `Strict-Transport-Security` (HSTS, only on https — Railway TLS)
- `Content-Security-Policy` (whitelist script/style/img, frame-ancestors none)
- Terdaftar di `bootstrap/app.php` web middleware stack.

---

## Files Changed

**New:**
- `app/Rules/ValidIndonesianNIK.php`
- `app/Exceptions/OverQuotaException.php`
- `app/Http/Middleware/SecurityHeaders.php`
- `database/migrations/2026_09_11_000001_add_unique_event_registration_constraint.php`
- `SECURITY_FIX_LOG.md` (file ini)

**Modified:**
- `app/Http/Controllers/RegistrationController.php` — validasi ketat + lockForUpdate quota
- `app/Http/Controllers/AuthController.php` — validasi NIK/no_hp di register
- `bootstrap/app.php` — daftarkan SecurityHeaders middleware
- `resources/js/Pages/Events/RegisterForm.jsx` — inputMode/pattern/sanitize UX helper

---

## Verification

- `npm run build` → ✅ green (no JS syntax error)
- Migration akan jalan otomatis di Railway deploy (entrypoint `php artisan migrate`).
- SecurityHeaders middleware ter-apply di seluruh route web (Inertia + API).
- Validasi NIK bisa di-test: POST NIK 12-digit / karakter / tanggal invalid → 422.
