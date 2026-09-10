<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // SQLite tidak enforce enum — tidak perlu tindakan.
        // MySQL: update nilai lama self_verify ke manual_admin, lalu ubah tipe kolom.
        if (DB::getDriverName() === 'mysql') {
            DB::statement("UPDATE attendances SET checkin_method = 'manual_admin' WHERE checkin_method = 'self_verify'");
            DB::statement("ALTER TABLE attendances MODIFY COLUMN checkin_method ENUM('qr_scan','manual_admin') NOT NULL DEFAULT 'qr_scan'");
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE attendances MODIFY COLUMN checkin_method ENUM('qr_scan','manual_admin','self_verify') NOT NULL DEFAULT 'qr_scan'");
        }
    }
};
