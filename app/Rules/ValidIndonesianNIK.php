<?php

namespace App\Rules;

use Illuminate\Contracts\Validation\Rule;

/**
 * ValidIndonesianNIK — validasi format NIK KTP Indonesia.
 *
 * AWALNYA rule ini cek struktur detail (kode provinsi, tanggal lahir,
 * nomor urut ≠ 000) — tapi itu TERLALU KETAT dan menolak NIK asli warga
 * karena data Disdukcapil tidak selalu konsisten (nomor urut bisa 000,
 * kode provinsi kadang di luar whitelist, format lama berbeda).
 *
 * Untuk sistem pemerintah, prioritas: JANGAN PERNAH menolak NIK asli
 * warga. Jadi rule ini sekarang hanya memvalidasi format hard constraint
 * NIK yang universal: 16 digit angka. Itu cukup memfilter NIK palsu
 * obvious (12 digit, mengandung huruf, terlalu pendek/panjang) tanpa
 * pernah menolak NIK asli 16-digit dari Disdukcapil manapun.
 *
 * Validasi tambahan (provinsi/tanggal/urut) sengaja TIDAK dilakukan di
 * sini karena fragile dan bisa menolak data warga yang valid. Jika
 * ke depan perlu verifikasi NIK yang lebih dalam, sebaiknya via
 * integrasi resmi Dukcapil (API verifikasi NIK), bukan heuristic
 * pattern-matching di layer aplikasi.
 */
class ValidIndonesianNIK implements Rule
{
    private string $message = 'NIK tidak valid.';

    public function passes($attribute, $value): bool
    {
        if ($value === null || $value === '') {
            $this->message = 'NIK wajib diisi.';
            return false;
        }

        $nik = (string) $value;

        // Satu-satunya hard constraint universal NIK: 16 digit angka.
        if (!preg_match('/^\d{16}$/', $nik)) {
            $this->message = 'NIK harus terdiri dari 16 digit angka.';
            return false;
        }

        return true;
    }

    public function message(): string
    {
        return $this->message;
    }
}
