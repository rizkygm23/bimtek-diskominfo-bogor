<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Bersihkan record attendances "hantu" dari bug import riwayat kegiatan.
 *
 * Sebelumnya BimtekEventController::storeHistoryEvent & importAttendance
 * memanggil Attendance::firstOrCreate dengan:
 *   - key ['event_registration_id' => $registration->id]  ← kolom TIDAK ADA
 *     di tabel attendances (kolom sebenarnya 'registration_id'). firstOrCreate
 *     selalu CREATE baru, menghasilkan record duplikat dengan field null.
 *   - ['checkin_method' => 'manual_entry' | 'excel_import']  ← BUKAN nilai
 *     enum valid. Enum DB hanya ['qr_scan','manual_admin'] (lihat migration
 *     2026_09_10_000002). MySQL strict → QueryException; non-strict →
 *     checkin_method jadi '' (empty) atau default 'qr_scan'.
 *   - tidak mengisi user_id & event_id → record tidak punya relasi, tidak
 *     muncul di laporan/scan peserta, tapi memenui tabel dengan sampah.
 *
 * Migration ini menghapus record yang jelas-jelas hasil bug itu: punya
 * user_id NULL ATAU event_id NULL ATAU registration_id NULL ATAU
 * checkin_method kosong/tidak ada di enum valid. Record absensi yang sah
 * (dari checkIn/manual/on-the-spot) selalu mengisi user_id + event_id +
 * registration_id (kecuali pembicara registration_id boleh null, tapi
 * user_id + event_id tetap terisi).
 *
 * Catatan: untuk pembicara, registration_id memang nullable (lihat
 * 2026_08_19_000002). Jadi kita TIDAK hapus record hanya karena
 * registration_id null — kita hapus hanya kalau user_id ATAU event_id null
 * (kombinasi yang tidak mungkin dari alur absensi yang sah).
 */
return new class extends Migration
{
    public function up(): void
    {
        // Hapus record sampah: user_id NULL ATAU event_id NULL.
        // Alur absensi sah (checkIn/manual/on-the-spot) selalu mengisi keduanya.
        DB::table('attendances')
            ->whereNull('user_id')
            ->orWhereNull('event_id')
            ->delete();

        // Normalisasi checkin_method yang invalid (empty atau di luar enum)
        // ke 'manual_admin' sebagai fallback aman. Seharusnya tidak ada lagi
        // setelah fix controller, tapi ini jaga-jaga untuk record existing.
        DB::table('attendances')
            ->whereNotIn('checkin_method', ['qr_scan', 'manual_admin'])
            ->update(['checkin_method' => 'manual_admin']);
    }

    public function down(): void
    {
        // Tidak dapat di-rollback: data sampah yang sudah dihapus tidak
        // bisa direkonstruksi (dan memang tidak pernah berguna).
    }
};
