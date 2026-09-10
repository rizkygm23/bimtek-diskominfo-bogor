<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Hapus duplikat yang mungkin ada sebelum menambahkan constraint
        // (ambil ID terkecil per pasangan event_id+user_id, hapus sisanya)
        DB::statement("
            DELETE FROM attendances
            WHERE id NOT IN (
                SELECT MIN(id) FROM attendances GROUP BY event_id, user_id
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
