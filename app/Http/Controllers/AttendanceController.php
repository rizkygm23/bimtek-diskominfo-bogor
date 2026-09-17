<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\EventRegistration;
use App\Models\Attendance;
use App\Models\AttendanceSession;
use App\Models\BimtekEvent;
use App\Models\User;
use Carbon\Carbon;
use Inertia\Inertia;
use Illuminate\Support\Str;

class AttendanceController extends Controller
{
    /**
     * Halaman scan kamera untuk peserta/pembicara, atau rekap admin.
     */
    public function scanView(Request $request)
    {
        $user = auth()->user();

        // Event yang belum selesai: end_date >= sekarang, ATAU end_date null
        // dan status DB bukan 'completed' (admin paksa selesai).
        $allEvents = BimtekEvent::where(function ($q) {
            $q->where('end_date', '>=', now())
              ->orWhere(function ($q2) {
                  $q2->whereNull('end_date')
                     ->where('status', '!=', 'completed');
              });
        })
            ->orderBy('start_date', 'desc')
            ->get(['id', 'title', 'start_date', 'end_date', 'status', 'location']);

        $selectedEventId = $request->query('event_id', $allEvents->first()?->id);

        $recentAttendances = [];
        $eventRegistrations = [];
        $myAttendances = [];
        $myEvents = [];

        $gatekeeperStatus = [
            'is_allowed' => true,
            'status' => 'ready',
            'missing_items' => [],
            'register_url' => $selectedEventId ? route('events.register', $selectedEventId) : route('events.index'),
        ];

        if ($user->role === 'admin') {
            if ($selectedEventId) {
                $recentAttendances = Attendance::where('event_id', $selectedEventId)
                    ->with(['user', 'event'])
                    ->orderBy('checked_in_at', 'desc')
                    ->get();

                // Daftar peserta terdaftar untuk presensi manual admin
                $checkedInUserIds = $recentAttendances->pluck('user_id')->toArray();
                $eventRegistrations = EventRegistration::where('bimtek_event_id', $selectedEventId)
                    ->with(['user' => function ($q) {
                        $q->select('id', 'name', 'nip_nik', 'instansi', 'jabatan', 'role');
                    }])
                    ->orderBy('registered_at', 'desc')
                    ->get()
                    ->map(function ($reg) use ($checkedInUserIds) {
                        return [
                            'registration_id' => $reg->id,
                            'user_id' => $reg->user_id,
                            'name' => $reg->user?->name ?? '-',
                            'nip_nik' => $reg->user?->nip_nik ?? '-',
                            'instansi' => $reg->user?->instansi ?? '-',
                            'jabatan' => $reg->user?->jabatan ?? '-',
                            'role' => $reg->user?->role ?? 'user',
                            'registration_code' => $reg->registration_code,
                            'status' => $reg->status,
                            'has_attended' => in_array($reg->user_id, $checkedInUserIds),
                        ];
                    })
                    ->values();
            }
        } elseif ($user->role === 'pembicara') {
            // Ambil event penugasan narasumber
            $speaker = \App\Models\Speaker::where('user_id', $user->id)->first();
            $assignedEventIds = $speaker 
                ? \App\Models\EventSpeaker::where('speaker_id', $speaker->id)->pluck('bimtek_event_id')->toArray() 
                : [];

            $myEvents = BimtekEvent::whereIn('id', $assignedEventIds)->get();
            if ($myEvents->isEmpty()) {
                $myEvents = $allEvents;
            }

            if ($myEvents->isNotEmpty() && !$request->has('event_id')) {
                $selectedEventId = $myEvents->first()->id;
            }

            $myAttendances = Attendance::where('user_id', $user->id)
                ->with(['event'])
                ->orderBy('checked_in_at', 'desc')
                ->get();

            // Gatekeeper check untuk narasumber
            if ($selectedEventId) {
                $eventSpeaker = $speaker ? \App\Models\EventSpeaker::where('bimtek_event_id', $selectedEventId)->where('speaker_id', $speaker->id)->first() : null;
                $speakerProfile = \App\Models\SpeakerProfile::where('user_id', $user->id)->first();

                $missing = [];
                if (!$eventSpeaker) $missing[] = 'Konfirmasi Penugasan Sesi Materi';
                if (empty($speakerProfile?->bank_name)) $missing[] = 'Nama Bank Pencairan';
                if (empty($speakerProfile?->account_number)) $missing[] = 'Nomor Rekening Bank';
                if (empty($speakerProfile?->foto_ktp_path)) $missing[] = 'Upload Foto KTP';
                if (empty($speakerProfile?->foto_npwp_path)) $missing[] = 'Upload Foto NPWP';
                if (empty($speakerProfile?->salinan_buku_rekening_path)) $missing[] = 'Upload Salinan Buku Rekening';

                if (count($missing) > 0) {
                    $gatekeeperStatus = [
                        'is_allowed' => false,
                        'status' => 'incomplete_data',
                        'missing_items' => $missing,
                        'message' => 'Anda wajib melengkapi semua data narasumber dan mengunggah berkas persyaratan sebelum dapat melakukan absensi.',
                        'register_url' => route('events.register', $selectedEventId),
                    ];
                }
            }
        } else {
            // Ambil event yang diikuti peserta
            $myEvents = EventRegistration::where('user_id', $user->id)
                ->with('event')
                ->get()
                ->pluck('event')
                ->filter()
                ->values();

            if ($myEvents->isEmpty()) {
                $myEvents = $allEvents;
            }

            if ($myEvents->isNotEmpty() && !$request->has('event_id')) {
                $selectedEventId = $myEvents->first()->id;
            }

            $myAttendances = Attendance::where('user_id', $user->id)
                ->with(['event'])
                ->orderBy('checked_in_at', 'desc')
                ->get();

            // Gatekeeper check untuk peserta
            if ($selectedEventId) {
                $registration = EventRegistration::where('bimtek_event_id', $selectedEventId)
                    ->where('user_id', $user->id)
                    ->first();
                $profile = \App\Models\ParticipantProfile::where('user_id', $user->id)->first();

                $missing = [];
                if (!$registration) {
                    $missing[] = 'Pendaftaran Kegiatan BIMTEK ini';
                }
                if (empty($profile?->nik) && empty($user->nip_nik)) {
                    $missing[] = 'NIK KTP (16 Digit)';
                }
                if (empty($profile?->bank_name)) {
                    $missing[] = 'Nama Bank Pencairan Uang Saku/Transport';
                }
                if (empty($profile?->account_number)) {
                    $missing[] = 'Nomor Rekening Bank';
                }
                if (empty($profile?->account_name)) {
                    $missing[] = 'Nama Pemilik Rekening';
                }

                if (count($missing) > 0) {
                    $gatekeeperStatus = [
                        'is_allowed' => false,
                        'status' => 'incomplete_data',
                        'missing_items' => $missing,
                        'message' => 'Anda wajib mengisi dan melengkapi seluruh data pendaftaran, NIK KTP, serta nomor rekening sebelum dapat mengakses fitur absensi.',
                        'register_url' => route('events.register', $selectedEventId),
                    ];
                }
            }
        }

        return Inertia::render('Attendance/Scan', [
            'events' => $allEvents,
            'myEvents' => $myEvents,
            'selectedEventId' => (int) $selectedEventId,
            'recentAttendances' => $recentAttendances,
            'eventRegistrations' => $eventRegistrations,
            'myAttendances' => $myAttendances,
            'gatekeeperStatus' => $gatekeeperStatus,
        ]);
    }

    /**
     * Admin: Tampilkan QR Code dinamis untuk ditayangkan di proyektor.
     * QR berisi token yang dirotasi setiap interval menit.
     */
    public function adminEventQr(Request $request, $id)
    {
        $event = BimtekEvent::withCount('registrations')->findOrFail($id);
        $interval = (int) $request->query('interval', 10);

        $now = now();
        $session = AttendanceSession::where('event_id', $id)
            ->where('is_active', true)
            ->where('valid_until', '>', $now->copy()->addSeconds(10))
            ->latest()
            ->first();

        if (!$session) {
            AttendanceSession::where('event_id', $id)->update(['is_active' => false]);
            $validFrom = $now;
            $validUntil = $now->copy()->addMinutes($interval);
            $secretKey = Str::random(32);
            $token = hash_hmac('sha256', "event_{$id}_" . $validFrom->timestamp, $secretKey);

            $session = AttendanceSession::create([
                'event_id' => $id,
                'token' => $token,
                'secret_key' => $secretKey,
                'interval_minutes' => $interval,
                'valid_from' => $validFrom,
                'valid_until' => $validUntil,
                'is_active' => true,
            ]);
        }

        $attendancesCount = Attendance::where('event_id', $id)->count();

        return Inertia::render('Attendance/AdminEventQr', [
            'event' => $event,
            'session' => [
                'id' => $session->id,
                'token' => $session->token,
                'interval_minutes' => $session->interval_minutes,
                'valid_from' => $session->valid_from->toIso8601String(),
                'valid_until' => $session->valid_until->toIso8601String(),
                'remaining_seconds' => (int) max(1, $now->diffInSeconds($session->valid_until, false)),
            ],
            'attendancesCount' => $attendancesCount,
        ]);
    }

    /**
     * Admin: Generate sesi QR baru (rotasi token).
     */
    public function generateNewQrSession(Request $request, $id)
    {
        $interval = (int) $request->input('interval', 10);
        $now = now();
        $validFrom = $now;
        $validUntil = $now->copy()->addMinutes($interval);
        $secretKey = Str::random(32);
        $token = hash_hmac('sha256', "event_{$id}_" . $validFrom->timestamp, $secretKey);

        AttendanceSession::where('event_id', $id)->update(['is_active' => false]);

        $session = AttendanceSession::create([
            'event_id' => $id,
            'token' => $token,
            'secret_key' => $secretKey,
            'interval_minutes' => $interval,
            'valid_from' => $validFrom,
            'valid_until' => $validUntil,
            'is_active' => true,
        ]);

        return response()->json([
            'success' => true,
            'session' => [
                'id' => $session->id,
                'token' => $session->token,
                'interval_minutes' => $session->interval_minutes,
                'valid_from' => $session->valid_from->toIso8601String(),
                'valid_until' => $session->valid_until->toIso8601String(),
                'remaining_seconds' => (int) max(0, $now->diffInSeconds($session->valid_until, false)),
            ],
        ]);
    }

    /**
     * Peserta/Pembicara: Check-in presensi Hari-H via scan QR Code resmi.
     */
    public function checkIn(Request $request)
    {
        $user  = auth()->user();
        $event = null;

        // 1. Parse QR payload (JSON atau raw token)
        [$eventId, $parsedToken] = $this->parseQrPayload(
            $request->input('token'),
            $request->input('event_id')
        );

        if (!$eventId) {
            return back()->with('error', '⚠️ Silakan pilih kegiatan BIMTEK terlebih dahulu atau scan QR Code resmi.');
        }

        $event = BimtekEvent::findOrFail($eventId);

        // 2. Validasi token QR resmi (anti-fraud, wajib)
        if (!$this->validateQrToken($eventId, $parsedToken)) {
            return back()->with('error', '⚠️ QR CODE TIDAK VALID / KADALUARSA: Silakan scan QR Code terbaru di layar Admin. Jika kamera bermasalah, hubungi Admin untuk presensi manual.');
        }

        // 3. Validasi eligibilitas peserta/narasumber
        $eligibility = $this->validateParticipantEligibility($user, $eventId);
        if (!$eligibility['ok']) {
            return redirect($eligibility['redirect'])->with('error', $eligibility['message']);
        }

        // 4. Catat presensi — DB constraint menangkap duplikat
        $roleType = $user->role === 'pembicara' ? 'pembicara' : 'peserta';

        // Pre-check eksplisit: hindari bergantung pada exception untuk alur normal.
        $existing = Attendance::where('user_id', $user->id)
            ->where('event_id', $eventId)
            ->exists();
        if ($existing) {
            return back()->with('success', '✓ ANDA SUDAH PRESENSI: Kehadiran Anda dalam kegiatan ini sudah tercatat sebelumnya.');
        }

        try {
            Attendance::create([
                'registration_id' => $eligibility['registration_id'],
                'user_id'         => $user->id,
                'event_id'        => $eventId,
                'role_type'       => $roleType,
                'attendance_type' => 'absensi_hari_h',
                'checkin_method'  => 'qr_scan',
                'checked_in_at'   => now(),
                'notes'           => $roleType === 'pembicara'
                    ? 'Presensi Narasumber / Pemateri Kegiatan BIMTEK'
                    : 'Presensi Peserta via Scan QR Code Admin',
            ]);
        } catch (\Illuminate\Database\QueryException $e) {
            $errorCode = $e->errorInfo[1] ?? 0;

            // 1062 = unique constraint violation (MySQL) — race double-check-in yang
            // lolos pre-check di atas. Ini satu-satunya kondisi yang absah dianggap
            // "sudah presensi". Pre-check + unique constraint = pertahanan ganda.
            if ($errorCode === 1062) {
                return back()->with('success', '✓ ANDA SUDAH PRESENSI: Kehadiran Anda dalam kegiatan ini sudah tercatat sebelumnya.');
            }

            // SEMUA QueryException lain (FK gagal, NOT NULL, koneksi DB mati, dll.)
            // wajib dilaporkan sebagai ERROR — bukan sukses palsu. Sebelumnya catch
            // ini menangkap semua dan mengembalikan 'success', sehingga user melihat
            // "Presensi Sukses" padahal tidak ada record tersimpan di DB. Itu
            // kebohongan sistem yang berbahaya untuk aplikasi presensi pemerintah.
            \Illuminate\Support\Facades\Log::error('Attendance check-in gagal (QueryException non-1062): ' . $e->getMessage(), [
                'user_id'  => $user->id,
                'event_id' => $eventId,
                'code'     => $errorCode,
            ]);
            return back()->with('error', '⚠️ PRESENSI GAGAL: Terjadi kesalahan teknis saat mencatat kehadiran Anda. Data Anda belum tersimpan. Mohon hubungi petugas Admin untuk dicatatkan presensi secara manual.');
        }

        // 5. Broadcast real-time ke dashboard admin
        $this->broadcastAttendance($user, $event, $roleType, $eligibility['registration_id']);

        $roleLabel = $roleType === 'pembicara' ? 'Narasumber' : 'Peserta';
        return back()->with('success', "🎉 PRESENSI BERHASIL! Kehadiran Anda sebagai {$roleLabel} pada kegiatan \"{$event->title}\" telah tercatat.");
    }

    /**
     * Admin: Presensi manual untuk peserta/pembicara yang bermasalah saat scan QR.
     */
    public function adminManualCheckIn(Request $request)
    {
        $validated = $request->validate([
            'event_id' => 'required|exists:bimtek_events,id',
            'user_id'  => 'required|exists:users,id',
            'notes'    => 'required|string|max:500',
        ]);

        $targetUser = User::findOrFail($validated['user_id']);
        $eventId    = $validated['event_id'];

        $registration = EventRegistration::firstOrCreate(
            ['bimtek_event_id' => $eventId, 'user_id' => $targetUser->id],
            ['registration_code' => 'MAN-' . strtoupper(Str::random(6)), 'status' => 'approved', 'registered_at' => now()]
        );

        $roleType = $targetUser->role === 'pembicara' ? 'pembicara' : 'peserta';

        try {
            Attendance::create([
                'registration_id'     => $registration->id,
                'user_id'             => $targetUser->id,
                'event_id'            => $eventId,
                'role_type'           => $roleType,
                'attendance_type'     => 'absensi_manual_admin',
                'checkin_method'      => 'manual_admin',
                'verified_by_admin_id' => auth()->id(),
                'checked_in_at'       => now(),
                'notes'               => '[Presensi Manual Admin] ' . $validated['notes'],
            ]);
        } catch (\Illuminate\Database\QueryException $e) {
            $errorCode = $e->errorInfo[1] ?? 0;
            if ($errorCode === 1062) {
                return back()->with('error', "{$targetUser->name} sudah memiliki catatan presensi pada kegiatan ini.");
            }
            // Error non-1062 jangan ditampilkan sebagai "sudah presensi" — itu
            // menyesatkan admin. Log + kasih pesan error teknis yang akurat.
            \Illuminate\Support\Facades\Log::error('Admin manual check-in gagal (QueryException non-1062): ' . $e->getMessage(), [
                'target_user_id' => $targetUser->id,
                'event_id'       => $eventId,
                'admin_id'       => auth()->id(),
                'code'           => $errorCode,
            ]);
            return back()->with('error', "⚠️ Gagal mencatat presensi untuk {$targetUser->name}: terjadi kesalahan teknis (bukan duplikat). Silakan coba lagi atau periksa log sistem.");
        }

        return back()->with('success', "✓ Presensi manual untuk {$targetUser->name} berhasil dicatat oleh Admin.");
    }

    /**
     * Pendaftaran peserta on-the-spot hari-H:
     *  - Cek email apakah sudah ada akun.
     *    * Jika ada: pakai akun lama (admin tetap bisa absenin walau peserta
     *      sudah punya akun).
     *    * Jika belum: buat akun baru dengan password = email (mudah diingat,
     *      bisa diubah di /profile nanti).
     *  - Daftarkan ke event (EventRegistration, status approved).
     *  - Catat Attendance (absensi_manual_admin).
     *  - Redirect balik ke halaman scan admin dengan flash success.
     *  - Admin TIDAK di-logout (tidak ada Auth::login).
     */
    public function adminOnTheSpotRegister(Request $request)
    {
        $validated = $request->validate([
            'event_id' => 'required|exists:bimtek_events,id',
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|max:255',
            'nip_nik'  => 'nullable|string|max:50',
            'instansi' => 'nullable|string|max:255',
            'no_hp'    => 'nullable|string|max:50',
            'notes'    => 'nullable|string|max:500',
        ]);

        $eventId = $validated['event_id'];
        $email   = strtolower(trim($validated['email']));

        // 1. Cari atau buat akun user
        $user = User::where('email', $email)->first();

        if (!$user) {
            // Akun baru: password = email (mudah diingat, ubah sendiri di profile)
            $user = User::create([
                'name'     => $validated['name'],
                'email'    => $email,
                'password' => \Illuminate\Support\Facades\Hash::make($email),
                'role'     => 'user',
                'nip_nik'  => $validated['nip_nik'] ?? ('3201' . rand(1000000000, 9999999999)),
                'instansi' => $validated['instansi'] ?? 'Umum / Instansi Terkait',
                'jabatan'  => 'Peserta BIMTEK',
                'no_hp'    => $validated['no_hp'] ?? '-',
            ]);

            // Buat participant profile minimal
            \App\Models\ParticipantProfile::create([
                'user_id'            => $user->id,
                'nik'                => $user->nip_nik,
                'instansi'           => $user->instansi,
                'no_hp'              => $user->no_hp,
                'verification_status' => 'terverifikasi',
            ]);
        } else {
            // Akun sudah ada — update info dasar kalau ada perubahan
            $user->update([
                'name'     => $validated['name'],
                'nip_nik'  => $validated['nip_nik'] ?? $user->nip_nik,
                'instansi' => $validated['instansi'] ?? $user->instansi,
                'no_hp'    => $validated['no_hp'] ?? $user->no_hp,
            ]);
        }

        // 2. Daftar ke event
        $registration = EventRegistration::firstOrCreate(
            ['bimtek_event_id' => $eventId, 'user_id' => $user->id],
            [
                'registration_code' => 'OTS-' . strtoupper(Str::random(6)),
                'status'           => 'approved',
                'registered_at'    => now(),
            ]
        );

        // 3. Catat presensi
        $existingAttendance = Attendance::where('user_id', $user->id)
            ->where('event_id', $eventId)
            ->first();

        if ($existingAttendance) {
            return back()->with('error', "{$user->name} sudah memiliki catatan presensi pada kegiatan ini.");
        }

        try {
            Attendance::create([
                'registration_id'      => $registration->id,
                'user_id'              => $user->id,
                'event_id'             => $eventId,
                'role_type'            => 'peserta',
                'attendance_type'      => 'absensi_manual_admin',
                'checkin_method'       => 'manual_admin',
                'verified_by_admin_id' => auth()->id(),
                'checked_in_at'        => now(),
                'notes'                => '[On-the-Spot Hari-H] ' . ($validated['notes'] ?? 'Pendaftaran langsung oleh Admin'),
            ]);
        } catch (\Illuminate\Database\QueryException $e) {
            return back()->with('error', "Gagal mencatat presensi: {$e->getMessage()}");
        }

        return back()->with('success', "✓ {$user->name} berhasil didaftarkan & dicatat kehadirannya. Password akun: {$email} (login di /login).");
    }

    // ──────────────────────────────────────────────────────────────────────────
    // PRIVATE HELPERS
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Parse raw QR token atau JSON payload QR code.
     * Returns [eventId, parsedToken].
     */
    private function parseQrPayload(?string $tokenData, mixed $rawEventId): array
    {
        $eventId     = $rawEventId;
        $parsedToken = null;

        if (!empty($tokenData)) {
            $decoded = json_decode($tokenData, true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                $eventId     = $decoded['event_id'] ?? $eventId;
                $parsedToken = $decoded['token'] ?? null;
            } else {
                $parsedToken = $tokenData;
            }
        }

        return [(int) $eventId ?: null, $parsedToken];
    }

    /**
     * Validasi token QR aktif untuk event tertentu.
     */
    private function validateQrToken(?int $eventId, ?string $token): bool
    {
        if (!$token || !$eventId) {
            return false;
        }
        $session = AttendanceSession::where('event_id', $eventId)
            ->where('token', $token)
            ->first();

        return $session && $session->is_active && now()->lte($session->valid_until);
    }

    /**
     * Validasi eligibilitas user (peserta/pembicara) untuk check-in pada event.
     * Returns ['ok'=>bool, 'registration_id'=>?int, 'message'=>string, 'redirect'=>string]
     */
    private function validateParticipantEligibility(User $user, int $eventId): array
    {
        if ($user->role === 'pembicara') {
            $speaker      = \App\Models\Speaker::where('user_id', $user->id)->first();
            $eventSpeaker = $speaker
                ? \App\Models\EventSpeaker::where('bimtek_event_id', $eventId)->where('speaker_id', $speaker->id)->first()
                : null;
            $profile = \App\Models\SpeakerProfile::where('user_id', $user->id)->first();

            $ok = $eventSpeaker
                && !empty($eventSpeaker->topic)
                && !empty($profile?->bank_name) && !empty($profile?->account_number)
                && !empty($profile?->foto_ktp_path) && !empty($profile?->foto_npwp_path) && !empty($profile?->salinan_buku_rekening_path);

            return [
                'ok'              => $ok,
                'registration_id' => null,
                'message'         => '⚠️ PERHATIAN NARASUMBER: Anda wajib mengonfirmasi penugasan dan mengunggah semua berkas persyaratan (KTP, NPWP, Salinan Buku Rekening) sebelum dapat melakukan absensi.',
                'redirect'        => route('events.register', $eventId),
            ];
        }

        // Peserta biasa
        $registration = EventRegistration::where('bimtek_event_id', $eventId)->where('user_id', $user->id)->first();
        $profile      = \App\Models\ParticipantProfile::where('user_id', $user->id)->first();
        $hasNik       = !empty($profile?->nik) || !empty($user->nip_nik);
        $hasBank      = !empty($profile?->bank_name) && !empty($profile?->account_number);
        $ok           = $registration && $hasNik && $hasBank;

        return [
            'ok'              => $ok,
            'registration_id' => $registration?->id,
            'message'         => '⚠️ ABSENSI DITOLAK: Anda wajib mengisi semua data administrasi, NIK KTP, dan rekening pencairan di formulir pendaftaran terlebih dahulu.',
            'redirect'        => route('events.register', $eventId),
        ];
    }

    /**
     * Broadcast event presensi ke dashboard real-time admin (non-blocking).
     */
    private function broadcastAttendance(User $user, BimtekEvent $event, string $roleType, ?int $registrationId): void
    {
        try {
            \App\Services\RealtimeStreamService::pushEvent('AttendanceRecorded', [
                'event_id'         => $event->id,
                'user_id'          => $user->id,
                'participant_name' => $user->name,
                'role_type'        => $roleType,
                'role_label'       => $roleType === 'pembicara' ? 'Narasumber' : 'Peserta',
                'checked_in_at'    => now()->format('H:i') . ' WIB',
            ]);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Real-time broadcast error: ' . $e->getMessage());
        }
    }
}
