<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Hapus duplikat yang mungkin ada sebelum menambahkan constraint.
        // MySQL error 1093: tidak boleh SELECT dan DELETE dari tabel yang sama
        // dalam satu query. Solusi: bungkus subquery dalam SELECT tambahan
        // (derived table) supaya MySQL mematerialkan hasilnya dulu.
        DB::statement("
            DELETE FROM attendances
            WHERE id NOT IN (
                SELECT id FROM (
                    SELECT MIN(id) AS id FROM attendances GROUP BY event_id, user_id
                ) AS keep_ids
            )
        ");

        Schema::table('attendances', function (Blueprint $table) {
            $table->unique(['event_id', 'user_id'], 'attendances_event_user_unique');
        });
    }

    public function down(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            $table->dropUnique('attendances_event_user_unique');
        });
    }
};
