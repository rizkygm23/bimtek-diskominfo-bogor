<?php

namespace App\Rules;

use Illuminate\Contracts\Validation\Rule;

/**
 * ValidIndonesianNIK — validasi NIK KTP Indonesia 16 digit.
 *
 * Struktur NIK: PP KK DD MM YY NNN C
 *  - digit 1-2  : kode provinsi (01-94, sesuai Permendagri)
 *  - digit 3-4  : kode kabupaten/kota (01-99)
 *  - digit 5-6  : kode kecamatan (01-99)
 *  - digit 7-12 : tanggal lahir (DDMMYY). Untuk perempuan, DD ditambah 40
 *                 (mis. lahir 15/03/1990 → perempuan: 550390, laki-laki: 150390)
 *  - digit 13-15: nomor urut (001-999)
 *  - digit 16   : check digit / gender marker (tidak divalidasi ketat —
 *                 tidak ada algoritma CCV resmi publik yang seragam)
 *
 * Validasi yang dilakukan:
 *  1. 16 digit numeric
 *  2. Kode provinsi (digit 1-2) di rentang valid (01-94)
 *  3. Tanggal lahir (digit 7-12) valid sebagai tanggal kalender,
 *     termasuk penanganan DD > 40 (perempuan: DD sebenarnya = DD - 40)
 *
 * Catatan: tidak melakukan CCV check-digit karena algoritma resmi tidak
 * dipublikasikan secara seragam. Validasi struktur + plausibility tanggal
 * sudah menyingkirkan NIK palsu yang obvious.
 */
class ValidIndonesianNIK implements Rule
{
    /** Kode provinsi valid di Indonesia (01-94 minus beberapa gap). */
    private const VALID_PROVINCE_CODES = [
        '01', '02', '03', '04', '05', '06', '07', '08', '09', '10',
        '11', '12', '13', '14', '15', '16', '17', '18', '19',
        '21', '31', '32', '33', '34', '35', '36',
        '51', '52', '53', '61', '62', '63', '64', '65',
        '71', '72', '73', '74', '75', '76', '81', '82', '91', '94',
    ];

    private string $message = 'NIK tidak valid.';

    public function passes($attribute, $value): bool
    {
        if ($value === null || $value === '') {
            $this->message = 'NIK wajib diisi.';
            return false;
        }

        $nik = (string) $value;

        // 1. Harus 16 digit numeric
        if (!preg_match('/^\d{16}$/', $nik)) {
            $this->message = 'NIK harus terdiri dari 16 digit angka.';
            return false;
        }

        // 2. Kode provinsi (digit 1-2) harus valid
        $provinceCode = substr($nik, 0, 2);
        if (!in_array($provinceCode, self::VALID_PROVINCE_CODES, true)) {
            $this->message = 'Kode provinsi pada NIK tidak valid.';
            return false;
        }

        // 3. Tanggal lahir (digit 7-12 = DDMMYY)
        $dd = (int) substr($nik, 6, 2);
        $mm = (int) substr($nik, 8, 2);
        $yy = (int) substr($nik, 10, 2);

        // Perempuan: DD > 40 → tanggal sebenarnya = DD - 40
        $day = $dd;
        if ($dd > 40) {
            $day = $dd - 40;
        }

        if ($day < 1 || $day > 31 || $mm < 1 || $mm > 12) {
            $this->message = 'Tanggal lahir pada NIK tidak valid.';
            return false;
        }

        // Validasi sebagai tanggal kalender nyata (cek tanggal 30/31, Februari, kabisat)
        // Gunakan checkdate — tahun ambil 2 digit + asumsi 19xx/20xx
        $year = $yy + ($yy <= 30 ? 2000 : 1900); // 00-30 → 2000-2030, 31-99 → 1931-1999
        if (!checkdate($mm, $day, $year)) {
            $this->message = 'Tanggal lahir pada NIK tidak valid.';
            return false;
        }

        // 4. Nomor urut (digit 13-15) tidak 000
        $seq = substr($nik, 12, 3);
        if ($seq === '000') {
            $this->message = 'Nomor urut pada NIK tidak valid.';
            return false;
        }

        return true;
    }

    public function message(): string
    {
        return $this->message;
    }
}
