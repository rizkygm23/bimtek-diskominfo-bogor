<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Models\BimtekEvent;
use App\Models\EventRegistration;
use App\Models\RegistrationAnswer;
use App\Models\Attendance;
use App\Rules\ValidIndonesianNIK;
use Inertia\Inertia;

class RegistrationController extends Controller
{
    public function showRegistrationForm($eventId)
    {
        $event = BimtekEvent::with('formFields')->findOrFail($eventId);
        $user = auth()->user();

        // 1. Khusus Peserta: Cek apakah sudah terdaftar
        if ($user->role === 'user') {
            $existingReg = EventRegistration::where('bimtek_event_id', $eventId)
                ->where('user_id', $user->id)
                ->first();

            if ($existingReg) {
                return redirect()->route('registrations.ticket', $existingReg->id)
                    ->with('info', 'Anda telah terdaftar pada kegiatan BIMTEK ini.');
            }
        }

        $participantProfile = \App\Models\ParticipantProfile::where('user_id', $user->id)->first();
        $speakerProfile = \App\Models\SpeakerProfile::where('user_id', $user->id)->first();
        $speaker = \App\Models\Speaker::where('user_id', $user->id)->first();
        $eventSpeaker = $speaker ? \App\Models\EventSpeaker::where('bimtek_event_id', $eventId)->where('speaker_id', $speaker->id)->first() : null;

        return Inertia::render('Events/RegisterForm', [
            'event' => $event,
            'user' => $user,
            'participantProfile' => $participantProfile,
            'speakerProfile' => $speakerProfile,
            'speaker' => $speaker,
            'eventSpeaker' => $eventSpeaker,
            'isSpeaker' => $user->role === 'pembicara',
        ]);
    }

    public function store(Request $request, $eventId)
    {
        $event = BimtekEvent::with('formFields')->findOrFail($eventId);
        $user = auth()->user();

        // 1. KHUSUS ROLE PEMBICARA / NARASUMBER (Hanya Masuk ke EventSpeaker, TIDAK Masuk ke Data Terdaftar Peserta)
        if ($user->role === 'pembicara') {
            $existingSpeakerProfile = \App\Models\SpeakerProfile::where('user_id', $user->id)->first();
            $needsKtp = empty($existingSpeakerProfile?->foto_ktp_path);
            $needsNpwp = empty($existingSpeakerProfile?->foto_npwp_path);
            $needsRekening = empty($existingSpeakerProfile?->salinan_buku_rekening_path);

            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|email|max:255',
                'no_hp' => ['required', 'string', 'max:20', 'regex:/^08[0-9]{7,12}$/'],
                'instansi' => 'required|string|max:255',
                'nip_nik' => ['required', 'string', 'max:20', 'regex:/^[0-9]{16,18}$/'],
                'topic' => 'required|string|max:255',
                'golongan' => 'required|string|in:Golongan III,Golongan IV,Non-ASN',
                'bank_name' => 'required|string|max:100',
                'account_number' => ['required', 'string', 'max:24', 'regex:/^[0-9]{8,24}$/'],
                'account_name' => 'required|string|max:255',
                'foto_ktp' => ($needsKtp ? 'required|file|mimes:jpeg,png,jpg,pdf|max:5120' : 'nullable|file|mimes:jpeg,png,jpg,pdf|max:5120'),
                'foto_npwp' => ($needsNpwp ? 'required|file|mimes:jpeg,png,jpg,pdf|max:5120' : 'nullable|file|mimes:jpeg,png,jpg,pdf|max:5120'),
                'salinan_buku_rekening' => ($needsRekening ? 'required|file|mimes:jpeg,png,jpg,pdf|max:5120' : 'nullable|file|mimes:jpeg,png,jpg,pdf|max:5120'),
                'bahan_materi' => 'nullable|file|mimes:pdf,pptx,ppt,docx|max:20480',
            ], [
                'foto_ktp.required' => 'Wajib mengunggah foto / scan KTP sebelum mendaftar.',
                'foto_npwp.required' => 'Wajib mengunggah foto / scan NPWP sebelum mendaftar.',
                'salinan_buku_rekening.required' => 'Wajib mengunggah salinan buku nomor rekening bank sebelum mendaftar.',
                'no_hp.regex' => 'Nomor HP harus format Indonesia (08xxxxxxxxxx).',
                'nip_nik.regex' => 'NIP/NIK harus 16-18 digit angka.',
                'account_number.regex' => 'Nomor rekening harus 8-24 digit angka.',
            ]);

            // Handle file uploads
            $ktpPath = null;
            $npwpPath = null;
            $bukuRekeningPath = null;
            $materiPath = null;

            if ($request->hasFile('foto_ktp')) {
                $ktpPath = $request->file('foto_ktp')->store("documents/{$user->id}", 'local');
            }
            if ($request->hasFile('foto_npwp')) {
                $npwpPath = $request->file('foto_npwp')->store("documents/{$user->id}", 'local');
            }
            if ($request->hasFile('salinan_buku_rekening')) {
                $bukuRekeningPath = $request->file('salinan_buku_rekening')->store("documents/{$user->id}", 'local');
            }
            if ($request->hasFile('bahan_materi')) {
                $materiPath = $request->file('bahan_materi')->store("materials/{$user->id}", 'local');
            }

            // Update user basic info
            $user->update([
                'name' => $validated['name'],
                'no_hp' => $validated['no_hp'],
                'instansi' => $validated['instansi'],
                'nip_nik' => $validated['nip_nik'],
            ]);

            // Update / create speaker profile
            $speakerProfile = \App\Models\SpeakerProfile::firstOrCreate(['user_id' => $user->id]);
            $speakerProfile->update([
                'nip_nik' => $validated['nip_nik'],
                'instansi' => $validated['instansi'],
                'golongan' => $validated['golongan'],
                'bank_name' => $validated['bank_name'],
                'account_number' => $validated['account_number'],
                'account_name' => $validated['account_name'],
                'foto_ktp_path' => $ktpPath ?? $speakerProfile->foto_ktp_path,
                'foto_npwp_path' => $npwpPath ?? $speakerProfile->foto_npwp_path,
                'salinan_buku_rekening_path' => $bukuRekeningPath ?? $speakerProfile->salinan_buku_rekening_path,
                'bahan_materi_path' => $materiPath ?? $speakerProfile->bahan_materi_path,
                'verification_status' => 'terverifikasi',
            ]);

            // Update / create master speaker
            $speaker = \App\Models\Speaker::firstOrCreate(
                ['user_id' => $user->id],
                [
                    'name' => $user->name,
                    'nip_nik' => $validated['nip_nik'],
                    'instansi' => $validated['instansi'],
                    'golongan' => $validated['golongan'],
                    'email' => $user->email,
                    'no_hp' => $user->no_hp,
                    'bank_name' => $validated['bank_name'],
                    'account_number' => $validated['account_number'],
                    'account_name' => $validated['account_name'],
                ]
            );

            // Update speaker record in case it already existed
            $speaker->update([
                'name' => $user->name,
                'nip_nik' => $validated['nip_nik'],
                'instansi' => $validated['instansi'],
                'golongan' => $validated['golongan'],
                'bank_name' => $validated['bank_name'],
                'account_number' => $validated['account_number'],
                'account_name' => $validated['account_name'],
            ]);

            // Calculate tax percentage
            $taxPercent = 5.00;
            if ($validated['golongan'] === 'Golongan IV') {
                $taxPercent = 15.00;
            } elseif ($validated['golongan'] === 'Non-ASN') {
                $taxPercent = 2.50;
            }

            // Create or update EventSpeaker relation for this BIMTEK event
            \App\Models\EventSpeaker::updateOrCreate(
                [
                    'bimtek_event_id' => $event->id,
                    'speaker_id' => $speaker->id,
                ],
                [
                    'topic' => $validated['topic'],
                    'material_path' => $materiPath ?? ($speakerProfile->bahan_materi_path ?? null),
                    'jp_hours' => 2,
                    'rate_per_jp' => 300000,
                    'tax_percent' => $taxPercent,
                ]
            );

            // TIDAK MEMBUAT EventRegistration (Narasumber bukan peserta terdaftar)
            return redirect()->route('events.show', $event->id)
                ->with('success', 'Data kelengkapan narasumber & berkas materi berhasil disimpan untuk kegiatan BIMTEK ini!');
        }

        // 2. DEFAULT UNTUK ROLE PESERTA (user.role === 'user')
        // Prevent duplicate registration for participant.
        // Note: cek awal cepat di luar transaksi untuk UX (kalau sudah daftar,
        // redirect ke tiket tanpa perlu lock). Pertahanan mutlak tetap di
        // unique index (event_reg_unique_event_user) — lihat migration.
        $existing = EventRegistration::where('bimtek_event_id', $eventId)
            ->where('user_id', $user->id)
            ->first();

        if ($existing) {
            return redirect()->route('registrations.ticket', $existing->id);
        }

        $regCode = 'BMK-' . date('Y') . '-' . strtoupper(Str::random(6));
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'no_hp' => ['required', 'string', 'max:20', 'regex:/^08[0-9]{7,12}$/'],
            'instansi' => 'required|string|max:255',
            'jabatan' => 'nullable|string|max:255',
            'nik' => ['required', 'string', 'size:16', new ValidIndonesianNIK],
            'npwp' => ['nullable', 'string', 'max:20', 'regex:/^([0-9]{2}\.?[0-9]{3}\.?[0-9]{3}\.?[0-9]-?[0-9]{3}\.?[0-9]{3}|[0-9]{15,16})$/'],
            'bank_name' => 'required|string|max:100',
            'account_number' => ['required', 'string', 'max:24', 'regex:/^[0-9]{8,24}$/'],
            'account_name' => 'required|string|max:255',
            'foto_ktp' => 'nullable|file|mimes:jpeg,png,jpg,pdf|max:5120',
            'foto_npwp' => 'nullable|file|mimes:jpeg,png,jpg,pdf|max:5120',
        ], [
            'nik.size' => 'NIK harus terdiri dari 16 digit.',
            'no_hp.regex' => 'Nomor HP harus format Indonesia (08xxxxxxxxxx).',
            'account_number.regex' => 'Nomor rekening harus 8-24 digit angka.',
            'npwp.regex' => 'Format NPWP tidak valid.',
        ]);

        // Update user profile basic fields
        $user->update([
            'name' => $validated['name'],
            'no_hp' => $validated['no_hp'],
            'instansi' => $validated['instansi'],
            'jabatan' => $validated['jabatan'] ?? $user->jabatan ?? 'Peserta BIMTEK',
            'nip_nik' => $validated['nik'],
        ]);

        // Handle private document uploads
        $ktpPath = null;
        $npwpPath = null;
        if ($request->hasFile('foto_ktp')) {
            $ktpPath = $request->file('foto_ktp')->store("documents/{$user->id}", 'local');
        }
        if ($request->hasFile('foto_npwp')) {
            $npwpPath = $request->file('foto_npwp')->store("documents/{$user->id}", 'local');
        }

        // Save / update participant administrative & bank disbursement details
        $profile = \App\Models\ParticipantProfile::firstOrCreate(['user_id' => $user->id]);
        $profile->update([
            'nik' => $validated['nik'],
            'foto_ktp_path' => $ktpPath ?? $profile->foto_ktp_path,
            'npwp' => $validated['npwp'] ?? $profile->npwp,
            'foto_npwp_path' => $npwpPath ?? $profile->foto_npwp_path,
            'bank_name' => $validated['bank_name'],
            'account_number' => $validated['account_number'],
            'account_name' => $validated['account_name'],
            'instansi' => $validated['instansi'],
            'no_hp' => $validated['no_hp'],
            'verification_status' => 'terverifikasi',
        ]);

        // Create registration atomically with quota enforcement.
        // Quota check + insert di dalam transaksi + lockForUpdate event row
        // menutup race condition TOCTOU (N request konkuren pas sisa 1 slot).
        // Unique index (event_id, user_id) jadi pertahanan terakhir anti
        // double-register kalau cek cepat di atas lolos karena konkurensi.
        try {
            $registration = DB::transaction(function () use ($event, $user, $regCode) {
                $locked = BimtekEvent::where('id', $event->id)->lockForUpdate()->first();

                $currentCount = EventRegistration::where('bimtek_event_id', $event->id)
                    ->count();

                if ($locked->quota && $currentCount >= $locked->quota) {
                    throw new \App\Exceptions\OverQuotaException(
                        'Kuota pendaftaran kegiatan ini sudah penuh (' . $locked->quota . ' peserta).'
                    );
                }

                return EventRegistration::create([
                    'bimtek_event_id' => $event->id,
                    'user_id' => $user->id,
                    'registration_code' => $regCode,
                    'status' => 'approved',
                    'registered_at' => now(),
                ]);
            });
        } catch (\App\Exceptions\OverQuotaException $e) {
            return redirect()->route('events.show', $event->id)
                ->with('error', $e->getMessage());
        } catch (\Illuminate\Database\QueryException $e) {
            // Unique constraint violation (SQLSTATE 23000) = double-register
            // race yang dihalangi di level DB. Arahkan ke tiket yang sudah ada.
            if (($e->errorInfo[1] ?? 0) === 1062) {
                $existingReg = EventRegistration::where('bimtek_event_id', $event->id)
                    ->where('user_id', $user->id)
                    ->first();
                if ($existingReg) {
                    return redirect()->route('registrations.ticket', $existingReg->id)
                        ->with('info', 'Anda telah terdaftar pada kegiatan BIMTEK ini.');
                }
            }
            throw $e;
        }

        // Process dynamic form answers
        $answers = $request->input('answers', []);
        foreach ($event->formFields as $field) {
            $val = $answers[$field->id] ?? null;

            if ($request->hasFile("answers.{$field->id}")) {
                $file = $request->file("answers.{$field->id}");
                $fileName = time() . '_' . $file->getClientOriginalName();
                $file->storeAs('public/surat_tugas', $fileName);
                $val = $fileName;
            } elseif (is_array($val)) {
                $val = json_encode($val);
            }

            RegistrationAnswer::create([
                'registration_id' => $registration->id,
                'form_field_id' => $field->id,
                'answer_value' => $val,
            ]);
        }


        // REAL-TIME BROADCAST: Trigger event to notify Admin Dashboard in real-time
        try {
            event(new \App\Events\ParticipantRegistered($registration));
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Real-time ParticipantRegistered broadcast error: ' . $e->getMessage());
        }

        return redirect()->route('registrations.ticket', $registration->id)
            ->with('success', 'Pendaftaran BIMTEK Berhasil! Silakan simpan Tiket QR Code Anda.');
    }

    public function ticket($registrationId)
    {
        $registration = EventRegistration::with([
            'event',
            'user.participantProfile',
            'answers.formField',
            'attendances'
        ])->findOrFail($registrationId);

        // Security check: only own registration or admin can view ticket
        if (auth()->id() !== $registration->user_id && auth()->user()->role !== 'admin') {
            abort(403, 'Akses ditolak.');
        }

        return Inertia::render('Attendance/Ticket', [
            'registration' => $registration,
        ]);
    }
}
