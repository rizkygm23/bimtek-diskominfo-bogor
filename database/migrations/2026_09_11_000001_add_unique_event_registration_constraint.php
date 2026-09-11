<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

/**
 * Anti double-registration: unique index (bimtek_event_id, user_id).
 *
 * Mencegah TOCTOU race condition di endpoint /events/{id}/register —
 * dua request konkuren dari user yang sama ke event yang sama tidak bisa
 * sama-sekali lolos check lalu create dua baris EventRegistration.
 * Unique index di level DB adalah pertahanan terakhir yang mutlak.
 *
 * Sebelum dipasang, hapus duplikat yang sudah ada (kalau ada) supaya
 * pembuatan index tidak gagal.
 */
return new class extends Migration
{
    public function up(): void
    {
        // 1. Bersihkan duplikat (bimtek_event_id, user_id) yang mungkin sudah ada.
        // Pertahankan baris dengan id terkecil (registrasi paling awal), hapus sisanya.
        DB::statement(<<<SQL
            DELETE er1 FROM event_registrations er1
            INNER JOIN event_registrations er2
            ON er1.bimtek_event_id = er2.bimtek_event_id
               AND er1.user_id = er2.user_id
               AND er1.id > er2.id
        SQL);

        // 2. Tambah unique index.
        Schema::table('event_registrations', function (Blueprint $table) {
            $table->unique(['bimtek_event_id', 'user_id'], 'event_reg_unique_event_user');
        });
    }

    public function down(): void
    {
        Schema::table('event_registrations', function (Blueprint $table) {
            $table->dropIndex('event_reg_unique_event_user');
        });
    }
};
