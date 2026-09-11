<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

class BimtekEvent extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'slug',
        'description',
        'start_date',
        'end_date',
        'location',
        'quota',
        'status',
    ];

    protected $casts = [
        'start_date' => 'datetime',
        'end_date' => 'datetime',
    ];

    // Accessor computed_status ikut ter-serialize ke frontend (Inertia/JSON).
    protected $appends = ['computed_status'];

    /**
     * Status dinamis berdasarkan tanggal — tidak ubah data DB.
     *
     * Logika:
     *  - 'completed' kalau end_date sudah lewat (lebih kecil dari sekarang).
     *  - 'ongoing' kalau sedang berjalan (start_date <= sekarang <= end_date).
     *  - 'open' kalau belum mulai (start_date > sekarang).
     *  - Fallback ke status DB bila tanggal null.
     *
     * Override manual admin ke 'completed' di DB tetap dihormati:
     * bila status DB = 'completed', tetap tampil 'completed' walau tanggal belum lewat.
     */
    public function getComputedStatusAttribute(): string
    {
        // Admin memaksa completed di DB — hormati.
        if ($this->status === 'completed') {
            return 'completed';
        }

        $now = Carbon::now();

        if ($this->end_date && $this->end_date->lt($now)) {
            return 'completed';
        }

        if ($this->start_date && $this->start_date->lt($now) && (!$this->end_date || $this->end_date->gt($now))) {
            return 'ongoing';
        }

        // Belum mulai, atau tanggal null — fallback ke status DB.
        return $this->status ?? 'open';
    }

    public function formFields()
    {
        return $table = $this->hasMany(FormField::class)->orderBy('order_index', 'asc');
    }

    public function registrations()
    {
        return $this->hasMany(EventRegistration::class);
    }

    public function eventSpeakers()
    {
        return $this->hasMany(EventSpeaker::class);
    }

    public function paymentComponents()
    {
        return $this->hasMany(PaymentComponent::class, 'event_id');
    }

    public function payments()
    {
        return $this->hasMany(PaymentComponent::class, 'event_id');
    }
}

