<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bimtek_events', function (Blueprint $table) {
            $table->index('start_date');
            $table->index('end_date');
            $table->index('status');
        });

        Schema::table('participant_profiles', function (Blueprint $table) {
            $table->index('verification_status');
        });

        Schema::table('speaker_profiles', function (Blueprint $table) {
            $table->index('verification_status');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->index('role');
            $table->index('nip_nik');
        });

        // event_registrations.user_id & payment_components.event_id already indexed via foreignId

        if (Schema::hasTable('payment_components')) {
            Schema::table('payment_components', function (Blueprint $table) {
                $table->index('recipient_type');
                $table->index('payment_status');
            });
        }
    }

    public function down(): void
    {
        Schema::table('bimtek_events', function (Blueprint $table) {
            $table->dropIndex(['start_date']);
            $table->dropIndex(['end_date']);
            $table->dropIndex(['status']);
        });

        Schema::table('participant_profiles', function (Blueprint $table) {
            $table->dropIndex(['verification_status']);
        });

        Schema::table('speaker_profiles', function (Blueprint $table) {
            $table->dropIndex(['verification_status']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['role']);
            $table->dropIndex(['nip_nik']);
        });

        if (Schema::hasTable('payment_components')) {
            Schema::table('payment_components', function (Blueprint $table) {
                $table->dropIndex(['recipient_type']);
                $table->dropIndex(['payment_status']);
            });
        }
    }
};
