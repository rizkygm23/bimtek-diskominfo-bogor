<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Certificate;
use App\Models\BimtekEvent;
use App\Models\EventRegistration;
use App\Models\EventSpeaker;
use App\Models\User;
use App\Models\ParticipantProfile;
use App\Models\SpeakerProfile;
use App\Models\Speaker;
use App\Models\Payment;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use ZipArchive;

class CertificateController extends Controller
{
    /**
     * Repository Sertifikat BIMTEK (Konsep Google Drive + Data Administrasi Lengkap)
     */
    public function index(Request $request)
    {
        $events = BimtekEvent::orderBy('start_date', 'desc')->get();
        $selectedEventId = $request->query('event_id', $events->first()?->id);
        $roleFilter = $request->query('role', 'all'); // 'all', 'peserta', 'pembicara'
        $certFilter = $request->query('cert_status', 'all'); // 'all', 'has_cert', 'no_cert'
        $search = $request->query('search', '');

        $currentEvent = BimtekEvent::find($selectedEventId) ?? $events->first();
        $adminRows = collect([]);

        if ($currentEvent) {
            // 1. DATA PESERTA TERDAFTAR
            if ($roleFilter === 'all' || $roleFilter === 'peserta') {
                $registrations = EventRegistration::where('bimtek_event_id', $currentEvent->id)
                    ->with(['user.participantProfile', 'attendances'])
                    ->get();

                foreach ($registrations as $reg) {
                    $u = $reg->user;
                    if (!$u) continue;

                    $profile = $u->participantProfile;
                    $attendance = $reg->attendances->first();
                    $cert = Certificate::where('event_id', $currentEvent->id)
                        ->where('user_id', $u->id)
                        ->first();

                    $hasCert = ($cert && !empty($cert->file_path)) || !empty($reg->certificate_path);

                    $adminRows->push([
                        'id' => 'peserta_' . $reg->id,
                        'registration_id' => $reg->id,
                        'user_id' => $u->id,
                        'name' => $u->name,
                        'nip_nik' => $profile?->nik ?? $u->nip_nik ?? '-',
                        'instansi' => $profile?->instansi ?? $u->instansi ?? 'Masyarakat Umum',
                        'jabatan' => $profile?->jabatan ?? $u->jabatan ?? 'Peserta BIMTEK',
                        'role_type' => 'peserta',
                        'npwp' => $profile?->npwp ?? '-',
                        'bank_name' => $profile?->bank_name ?? 'Bank Jabar Banten (BJB)',
                        'account_number' => $profile?->account_number ?? '-',
                        'account_name' => $profile?->account_name ?? $u->name,
                        'is_attended' => $attendance ? true : false,
                        'attended_at' => $attendance ? $attendance->checked_in_at->format('d/m/Y H:i') : null,
                        'checkin_method' => $attendance?->checkin_method ?? '-',
                        'honorarium' => 0,
                        'transport' => 150000,
                        'has_certificate' => $hasCert,
                        'certificate_id' => $cert?->id,
                        'certificate_number' => $hasCert ? ($cert?->certificate_number ?? ('SERT-BMK/' . date('Y') . '/' . str_pad($reg->id, 4, '0', STR_PAD_LEFT))) : null,
                        'certificate_file' => $cert?->file_path ?? $reg->certificate_path ?? null,
                        'certificate_url' => (!empty($cert?->file_path)) ? asset('storage/' . $cert->file_path) : (!empty($reg->certificate_path) ? asset('storage/' . $reg->certificate_path) : null),
                        'issue_date' => $cert?->issue_date ?? ($currentEvent->start_date ? $currentEvent->start_date->format('Y-m-d') : date('Y-m-d')),
                        'verification_status' => $profile?->verification_status ?? 'terverifikasi',
                    ]);
                }
            }

            // 2. DATA NARASUMBER / PEMBICARA
            if ($roleFilter === 'all' || $roleFilter === 'pembicara') {
                $eventSpeakers = EventSpeaker::where('bimtek_event_id', $currentEvent->id)
                    ->with(['speaker'])
                    ->get();

                foreach ($eventSpeakers as $es) {
                    $sp = $es->speaker;
                    if (!$sp) continue;

                    // Cari user account terkait narasumber
                    $speakerUser = User::where('email', $sp->email)
                        ->orWhere('name', $sp->name)
                        ->orWhere('role', 'pembicara')
                        ->first();

                    $targetUserId = $speakerUser ? $speakerUser->id : $sp->id;
                    $cert = Certificate::where('event_id', $currentEvent->id)
                        ->where(function($q) use ($targetUserId, $sp) {
                            $q->where('user_id', $targetUserId)
                              ->orWhere('role_type', 'pembicara');
                        })
                        ->first();

                    $hasSpeakerCert = ($cert && !empty($cert->file_path)) || !empty($es->certificate_path);

                    $adminRows->push([
                        'id' => 'pembicara_' . $es->id,
                        'event_speaker_id' => $es->id,
                        'user_id' => $targetUserId,
                        'name' => $sp->name,
                        'nip_nik' => $sp->nip_nik ?? '-',
                        'instansi' => $sp->instansi ?? 'Narasumber Ahli Diskominfo',
                        'jabatan' => $sp->jabatan ?? 'Pakar / Pembicara',
                        'role_type' => 'pembicara',
                        'npwp' => $sp->npwp ?? '-',
                        'bank_name' => $sp->bank_name ?? 'Bank BJB',
                        'account_number' => $sp->account_number ?? '-',
                        'account_name' => $sp->account_name ?? $sp->name,
                        'is_attended' => true,
                        'attended_at' => $currentEvent->start_date ? $currentEvent->start_date->format('d/m/Y 08:00') : date('d/m/Y 08:00'),
                        'checkin_method' => 'qr_scan',
                        'honorarium' => ($es->jp_hours ?? 4) * 300000,
                        'transport' => 250000,
                        'has_certificate' => $hasSpeakerCert,
                        'certificate_id' => $cert?->id,
                        'certificate_number' => $hasSpeakerCert ? ($cert?->certificate_number ?? ('SERT-NRS/' . date('Y') . '/' . str_pad($es->id, 4, '0', STR_PAD_LEFT))) : null,
                        'certificate_file' => $cert?->file_path ?? $es->certificate_path ?? null,
                        'certificate_url' => (!empty($cert?->file_path)) ? asset('storage/' . $cert->file_path) : (!empty($es->certificate_path) ? asset('storage/' . $es->certificate_path) : null),
                        'issue_date' => $cert?->issue_date ?? ($currentEvent->start_date ? $currentEvent->start_date->format('Y-m-d') : date('Y-m-d')),
                        'verification_status' => 'terverifikasi',
                    ]);
                }
            }
        }

        // Apply search filter
        if (!empty($search)) {
            $adminRows = $adminRows->filter(function ($item) use ($search) {
                return Str::contains(strtolower($item['name']), strtolower($search)) ||
                       Str::contains(strtolower($item['nip_nik']), strtolower($search)) ||
                       Str::contains(strtolower($item['instansi']), strtolower($search));
            });
        }

        // Apply cert status filter
        if ($certFilter === 'has_cert') {
            $adminRows = $adminRows->filter(fn($i) => $i['has_certificate']);
        } elseif ($certFilter === 'no_cert') {
            $adminRows = $adminRows->filter(fn($i) => !$i['has_certificate']);
        }

        $adminRows = $adminRows->values();

        // Repository statistics
        $stats = [
            'total_rows' => $adminRows->count(),
            'total_certified' => $adminRows->where('has_certificate', true)->count(),
            'total_pending' => $adminRows->where('has_certificate', false)->count(),
            'total_attended' => $adminRows->where('is_attended', true)->count(),
        ];

        return Inertia::render('Admin/Certificates/Index', [
            'events' => $events,
            'currentEvent' => $currentEvent,
            'adminRows' => $adminRows,
            'stats' => $stats,
            'filters' => [
                'event_id' => (int) $selectedEventId,
                'role' => $roleFilter,
                'cert_status' => $certFilter,
                'search' => $search,
            ],
        ]);
    }

    /**
     * Upload Banyak File Sekaligus (Multi-File) atau File ZIP
     * Mencocokkan file secara cerdas menggunakan NIK / Kode Registrasi / Nama
     */
    public function bulkUpload(Request $request)
    {
        $request->validate([
            'event_id' => 'required|exists:bimtek_events,id',
            'files' => 'nullable|array',
            'files.*' => 'file|mimes:pdf,png,jpg,jpeg|max:20480',
            'zip_file' => 'nullable|file|mimes:zip|max:102400',
        ]);

        $eventId = $request->input('event_id');
        $event = BimtekEvent::findOrFail($eventId);

        // Ambil data peserta & narasumber untuk pencocokan NIK
        $registrations = EventRegistration::where('bimtek_event_id', $eventId)->with('user.participantProfile')->get();
        $eventSpeakers = EventSpeaker::where('bimtek_event_id', $eventId)->with('speaker')->get();

        // Precompute nama unik vs ambigu (untuk deteksi nama ganda).
        // NIK & kode registrasi tetap unik (match priority 1 & 2) — tidak terkena guard ini.
        $nameToRegs = $registrations->groupBy(function ($reg) {
            $u = $reg->user;
            return $u ? strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $u->name)) : '';
        })->filter(fn($group, $key) => $key !== '' && $group->count() > 0);
        // Set nama yang ambigu (>1 pendaftar dengan nama sama persis) — name-match dilewati.
        $ambiguousNames = $nameToRegs->filter(fn($group) => $group->count() > 1)->keys()->all();
        $ambiguousNameWords = [];
        // Untuk word-match: kumpulkan kata nama yang muncul di >1 pendaftar berbeda.
        $wordToRegs = [];
        foreach ($registrations as $reg) {
            $u = $reg->user;
            if (!$u) continue;
            $words = array_filter(explode(' ', strtolower(preg_replace('/[^a-zA-Z0-9\s]/', '', $u->name))), fn($w) => strlen($w) >= 3);
            foreach ($words as $word) {
                $wordToRegs[$word][$reg->id] = true;
            }
        }
        foreach ($wordToRegs as $word => $ids) {
            if (count($ids) > 1) {
                $ambiguousNameWords[] = $word;
            }
        }

        $processedFiles = [];
        $matchedCount = 0;
        $unmatchedCount = 0;
        $ambiguousCount = 0;

        // 1. PROSES FILE ZIP JIKA DIUNGGAH
        if ($request->hasFile('zip_file')) {
            $zipFile = $request->file('zip_file');
            $zip = new ZipArchive;

            if ($zip->open($zipFile->getRealPath()) === TRUE) {
                $tempExtractDir = storage_path('app/temp_zip_' . Str::random(10));
                if (!file_exists($tempExtractDir)) {
                    mkdir($tempExtractDir, 0755, true);
                }

                $zip->extractTo($tempExtractDir);
                $zip->close();

                // Scan semua file di dalam folder hasil extract
                $extractedFiles = glob($tempExtractDir . '/*.*');
                foreach ($extractedFiles as $filePath) {
                    $ext = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
                    if (in_array($ext, ['pdf', 'png', 'jpg', 'jpeg'])) {
                        $originalName = basename($filePath);
                        $targetStoragePath = 'certificates/' . $eventId . '/' . Str::random(8) . '_' . $originalName;

                        Storage::disk('public')->put($targetStoragePath, file_get_contents($filePath));
                        $processedFiles[] = [
                            'original_name' => $originalName,
                            'storage_path' => $targetStoragePath,
                        ];
                    }
                }

                // Hapus folder temporary
                array_map('unlink', glob("$tempExtractDir/*.*"));
                @rmdir($tempExtractDir);
            }
        }

        // 2. PROSES MULTI-FILE LANGSUNG (UPLOAD BANYAK FILE SEKALIGUS)
        if ($request->hasFile('files')) {
            foreach ($request->file('files') as $file) {
                $originalName = $file->getClientOriginalName();
                $targetStoragePath = $file->store('certificates/' . $eventId, 'public');

                $processedFiles[] = [
                    'original_name' => $originalName,
                    'storage_path' => $targetStoragePath,
                ];
            }
        }

        // 3. AUTO-MATCHING FILES KE PESERTA & NARASUMBER DENGAN NIK / IDENTIFIER / NAMA
        //    Prioritas: NIK (unik) -> Kode Registrasi (unik) -> Nama lengkap (dengan guard ambigu) -> Kata nama (dengan guard ambigu)
        //    NIK & kode registrasi adalah identifier unik → selalu aman di-match.
        //    Nama/kata nama HANYA di-match jika TIDAK ambigu (tidak ada >1 pendaftar dengan nama/kata sama).
        //    Jika ambigu → dilewati, flag untuk sambungkan manual (jangan salah sasaran).
        foreach ($processedFiles as $item) {
            $filename = strtolower($item['original_name']);
            $cleanFilename = preg_replace('/[^a-zA-Z0-9]/', '', $filename);
            $matchedUser = null;
            $matchedRole = 'peserta';
            $matchedRegId = null;
            $matchedSpeakerId = null;
            $skippedDueToAmbiguity = false;

            // Cari kecocokan di data peserta (Utamakan NIK, lalu Registration Code, lalu Nama)
            foreach ($registrations as $reg) {
                $u = $reg->user;
                if (!$u) continue;

                $nik = $u->participantProfile?->nik ?? $u->nip_nik;
                $regCode = strtolower($reg->registration_code);
                $cleanName = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $u->name));

                // 1. Cocokkan NIK (paling akurat, identifier unik — tidak ambigu)
                if ($nik && strlen($nik) >= 4 && Str::contains($filename, strtolower($nik))) {
                    $matchedUser = $u;
                    $matchedRegId = $reg->id;
                    break;
                }

                // 2. Cocokkan Kode Registrasi (identifier unik — tidak ambigu)
                if ($regCode && Str::contains($filename, $regCode)) {
                    $matchedUser = $u;
                    $matchedRegId = $reg->id;
                    break;
                }

                // 3. Cocokkan Nama Utuh — HANYA jika nama ini TIDAK ambigu
                if (strlen($cleanName) >= 3 && Str::contains($cleanFilename, $cleanName)) {
                    if (in_array($cleanName, $ambiguousNames)) {
                        $skippedDueToAmbiguity = true;
                        continue; // jangan break — mungkin NIK/kode registrasi peserta lain cocok
                    }
                    $matchedUser = $u;
                    $matchedRegId = $reg->id;
                    break;
                }

                // 4. Cocokkan Kata per Kata Nama Peserta — HANYA jika kata ini TIDAK ambigu
                $nameWords = array_filter(explode(' ', strtolower(preg_replace('/[^a-zA-Z0-9\s]/', '', $u->name))), fn($w) => strlen($w) >= 3);
                foreach ($nameWords as $word) {
                    if (Str::contains($cleanFilename, $word)) {
                        if (in_array($word, $ambiguousNameWords)) {
                            $skippedDueToAmbiguity = true;
                            continue 2; // cek peserta berikutnya
                        }
                        $matchedUser = $u;
                        $matchedRegId = $reg->id;
                        break 2;
                    }
                }
            }

            // Jika belum cocok, cari di data narasumber
            if (!$matchedUser) {
                // Precompute nama/kata narasumber yang ambigu (ada di >1 narasumber)
                $speakerNames = $eventSpeakers->map(fn($es) => $es->speaker ? strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $es->speaker->name)) : '')->filter()->all();
                $speakerNameCounts = array_count_values($speakerNames);
                $speakerWordMap = [];
                foreach ($eventSpeakers as $es) {
                    $sp = $es->speaker;
                    if (!$sp) continue;
                    $words = array_filter(explode(' ', strtolower(preg_replace('/[^a-zA-Z0-9\s]/', '', $sp->name))), fn($w) => strlen($w) >= 3);
                    foreach ($words as $word) {
                        $speakerWordMap[$word] = ($speakerWordMap[$word] ?? 0) + 1;
                    }
                }

                foreach ($eventSpeakers as $es) {
                    $sp = $es->speaker;
                    if (!$sp) continue;

                    $nik = $sp->nip_nik;
                    $cleanName = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $sp->name));

                    // 1. NIK narasumber (unik)
                    if ($nik && strlen($nik) >= 4 && Str::contains($filename, strtolower($nik))) {
                        $speakerUser = User::where('email', $sp->email)->orWhere('name', $sp->name)->first();
                        $matchedUser = $speakerUser ?? User::where('role', 'pembicara')->first();
                        $matchedRole = 'pembicara';
                        $matchedSpeakerId = $es->id;
                        break;
                    }

                    // 2. Nama lengkap narasumber — guard ambigu
                    if (strlen($cleanName) >= 3 && Str::contains($cleanFilename, $cleanName)) {
                        if (($speakerNameCounts[$cleanName] ?? 1) > 1) {
                            $skippedDueToAmbiguity = true;
                            continue;
                        }
                        $speakerUser = User::where('email', $sp->email)->orWhere('name', $sp->name)->first();
                        $matchedUser = $speakerUser ?? User::where('role', 'pembicara')->first();
                        $matchedRole = 'pembicara';
                        $matchedSpeakerId = $es->id;
                        break;
                    }

                    // 3. Kata per kata nama narasumber — guard ambigu
                    $speakerWords = array_filter(explode(' ', strtolower(preg_replace('/[^a-zA-Z0-9\s]/', '', $sp->name))), fn($w) => strlen($w) >= 3);
                    foreach ($speakerWords as $word) {
                        if (Str::contains($cleanFilename, $word)) {
                            if (($speakerWordMap[$word] ?? 1) > 1) {
                                $skippedDueToAmbiguity = true;
                                continue 2;
                            }
                            $speakerUser = User::where('email', $sp->email)->orWhere('name', $sp->name)->first();
                            $matchedUser = $speakerUser ?? User::where('role', 'pembicara')->first();
                            $matchedRole = 'pembicara';
                            $matchedSpeakerId = $es->id;
                            break 2;
                        }
                    }
                }
            }

            if ($matchedUser) {
                $matchedCount++;
                $certNumber = 'SERT-' . ($matchedRole === 'pembicara' ? 'NRS' : 'BMK') . '/' . date('Y') . '/' . strtoupper(Str::random(6));

                // Simpan atau update record Certificate
                Certificate::updateOrCreate(
                    [
                        'event_id' => $eventId,
                        'user_id' => $matchedUser->id,
                        'role_type' => $matchedRole,
                    ],
                    [
                        'certificate_number' => $certNumber,
                        'file_path' => $item['storage_path'],
                        'issue_date' => $event->start_date ? $event->start_date->format('Y-m-d') : date('Y-m-d'),
                    ]
                );

                // Sinkronkan ke event_registrations / event_speakers
                if ($matchedRegId) {
                    EventRegistration::where('id', $matchedRegId)->update(['certificate_path' => $item['storage_path']]);
                }
                if ($matchedSpeakerId) {
                    EventSpeaker::where('id', $matchedSpeakerId)->update(['certificate_path' => $item['storage_path']]);
                }
            } else {
                $unmatchedCount++;
                if ($skippedDueToAmbiguity) {
                    $ambiguousCount++;
                }
            }
        }

        $totalUploaded = count($processedFiles);
        $msg = "REPOSITORY DIPERBARUI: {$totalUploaded} file diproses. {$matchedCount} sertifikat berhasil dicocokan otomatis (via NIK/kode registrasi/nama unik).";
        if ($ambiguousCount > 0) {
            $msg .= " {$ambiguousCount} file dilewati karena nama ganda (ambiguous) — sambungkan manual via tombol Unggah per baris.";
        }
        $remainingUnmatched = $unmatchedCount - $ambiguousCount;
        if ($remainingUnmatched > 0) {
            $msg .= " {$remainingUnmatched} file belum cocok dan dapat dihubungkan manual.";
        }
        return back()->with('success', $msg);
    }

    /**
     * Upload Tunggal / Ganti File Sertifikat Spesifik
     */
    public function singleUpload(Request $request)
    {
        $request->validate([
            'event_id' => 'required|exists:bimtek_events,id',
            'user_id' => 'required|exists:users,id',
            'role_type' => 'required|in:peserta,pembicara',
            'certificate_file' => 'required|file|mimes:pdf,png,jpg,jpeg|max:10240',
        ]);

        $filePath = $request->file('certificate_file')->store('certificates/' . $request->event_id, 'public');
        $certNumber = 'SERT-' . ($request->role_type === 'pembicara' ? 'NRS' : 'BMK') . '/' . date('Y') . '/' . strtoupper(Str::random(6));

        Certificate::updateOrCreate(
            [
                'event_id' => $request->event_id,
                'user_id' => $request->user_id,
                'role_type' => $request->role_type,
            ],
            [
                'certificate_number' => $certNumber,
                'file_path' => $filePath,
                'issue_date' => now()->toDateString(),
            ]
        );

        // Sinkronkan
        if ($request->role_type === 'peserta') {
            EventRegistration::where('bimtek_event_id', $request->event_id)
                ->where('user_id', $request->user_id)
                ->update(['certificate_path' => $filePath]);
        }

        return back()->with('success', 'File sertifikat berhasil diunggah dan terhubung ke peserta.');
    }

    /**
     * Unduh Semua Sertifikat Kegiatan sebagai ZIP Archive
     */
    public function downloadAllZip($eventId)
    {
        $event = BimtekEvent::findOrFail($eventId);
        $certificates = Certificate::where('event_id', $eventId)->with('user')->get();

        if ($certificates->isEmpty()) {
            return back()->with('error', 'Belum ada file sertifikat yang diunggah untuk kegiatan ini.');
        }

        $zipFileName = 'Sertifikat_BIMTEK_' . Str::slug($event->title) . '.zip';
        $zipFilePath = storage_path('app/' . $zipFileName);

        $zip = new ZipArchive;
        if ($zip->open($zipFilePath, ZipArchive::CREATE | ZipArchive::OVERWRITE) === TRUE) {
            foreach ($certificates as $cert) {
                if (Storage::disk('public')->exists($cert->file_path)) {
                    $fileContent = Storage::disk('public')->get($cert->file_path);
                    $ext = pathinfo($cert->file_path, PATHINFO_EXTENSION);
                    $entryName = Str::slug($cert->user?->name ?? 'User') . '_' . $cert->certificate_number . '.' . $ext;
                    $zip->addFromString($entryName, $fileContent);
                }
            }
            $zip->close();
        }

        return response()->download($zipFilePath)->deleteFileAfterSend(true);
    }

    /**
     * Hapus Sertifikat
     */
        public function destroy(Request $request, $id)
    {
        if (str_starts_with($id, 'peserta_') || str_starts_with($id, 'pembicara_')) {
            $parts = explode('_', $id);
            $role = $parts[0];
            $foreignId = $parts[1];

            if ($role === 'peserta') {
                $reg = \App\Models\EventRegistration::find($foreignId);
                if ($reg && $reg->certificate_path) {
                    if (\Illuminate\Support\Facades\Storage::disk('public')->exists($reg->certificate_path)) {
                        \Illuminate\Support\Facades\Storage::disk('public')->delete($reg->certificate_path);
                    }
                    $reg->update(['certificate_path' => null]);
                    
                    $cert = \App\Models\Certificate::where('event_id', $reg->bimtek_event_id)->where('user_id', $reg->user_id)->first();
                    if ($cert) {
                        if ($cert->file_path && \Illuminate\Support\Facades\Storage::disk('public')->exists($cert->file_path)) {
                            \Illuminate\Support\Facades\Storage::disk('public')->delete($cert->file_path);
                        }
                        $cert->delete();
                    }
                }
            } else {
                $es = \App\Models\EventSpeaker::find($foreignId);
                if ($es && $es->certificate_path) {
                    if (\Illuminate\Support\Facades\Storage::disk('public')->exists($es->certificate_path)) {
                        \Illuminate\Support\Facades\Storage::disk('public')->delete($es->certificate_path);
                    }
                    $es->update(['certificate_path' => null]);
                    
                    $cert = \App\Models\Certificate::where('event_id', $es->bimtek_event_id)->where('role_type', 'pembicara')->first(); // approximation
                    if ($cert) {
                        if ($cert->file_path && \Illuminate\Support\Facades\Storage::disk('public')->exists($cert->file_path)) {
                            \Illuminate\Support\Facades\Storage::disk('public')->delete($cert->file_path);
                        }
                        $cert->delete();
                    }
                }
            }
        } else {
            $cert = \App\Models\Certificate::findOrFail($id);
            if ($cert->file_path && \Illuminate\Support\Facades\Storage::disk('public')->exists($cert->file_path)) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($cert->file_path);
            }
            
            // clear from registration/speaker as well
            if ($cert->role_type === 'peserta') {
                \App\Models\EventRegistration::where('bimtek_event_id', $cert->event_id)
                    ->where('user_id', $cert->user_id)
                    ->update(['certificate_path' => null]);
            } else {
                \App\Models\EventSpeaker::where('bimtek_event_id', $cert->event_id)
                    ->update(['certificate_path' => null]); // approximation
            }
            
            $cert->delete();
        }

        return back()->with('success', 'Sertifikat berhasil dihapus dari repository.');
    }

    /**
     * Halaman Sertifikat Pengguna (Peserta & Pembicara)
     * PERSYARATAN UTAMA: Hanya menampilkan sertifikat JIKA ADMIN TELAH MENGUNGGAH FILE (PNG/JPG/PDF)
     */
    public function myCertificates()
    {
        $user = auth()->user()->load(['participantProfile', 'speakerProfile']);
        $certificates = collect([]);

        // 1. Ambil sertifikat HANYA yang file_path nya SUDAH DIUNGGAH OLEH ADMIN di tabel Certificate
        $adminCertificates = Certificate::where('user_id', $user->id)
            ->whereNotNull('file_path')
            ->where('file_path', '!=', '')
            ->with('event')
            ->orderBy('issue_date', 'desc')
            ->get();

        foreach ($adminCertificates as $cert) {
            $certificates->push((object)[
                'id' => $cert->id,
                'certificate_number' => $cert->certificate_number,
                'event' => $cert->event,
                'file_path' => $cert->file_path,
                'file_url' => asset('storage/' . $cert->file_path),
                'issue_date' => $cert->issue_date ? $cert->issue_date->format('Y-m-d') : date('Y-m-d'),
                'role_type' => $cert->role_type ?? 'peserta',
                'user' => $user,
            ]);
        }

        // 2. Ambil sertifikat HANYA yang certificate_path nya SUDAH DIUNGGAH OLEH ADMIN di tabel EventRegistration
        $regCertAssignments = EventRegistration::where('user_id', $user->id)
            ->whereNotNull('certificate_path')
            ->where('certificate_path', '!=', '')
            ->with('event')
            ->get();

        foreach ($regCertAssignments as $reg) {
            if (!$certificates->contains('file_path', $reg->certificate_path)) {
                $certificates->push((object)[
                    'id' => 'reg_' . $reg->id,
                    'certificate_number' => 'SERT-BMK/' . date('Y') . '/' . str_pad($reg->id, 4, '0', STR_PAD_LEFT),
                    'event' => $reg->event,
                    'file_path' => $reg->certificate_path,
                    'file_url' => asset('storage/' . $reg->certificate_path),
                    'issue_date' => $reg->event?->start_date ? $reg->event->start_date->format('Y-m-d') : date('Y-m-d'),
                    'role_type' => 'peserta',
                    'user' => $user,
                ]);
            }
        }

        // 3. Khusus narasumber, ambil sertifikat HANYA yang certificate_path nya SUDAH DIUNGGAH OLEH ADMIN di tabel EventSpeaker
        if ($user->role === 'pembicara') {
            $speaker = Speaker::where('user_id', $user->id)->first();
            if ($speaker) {
                $speakerCertAssignments = EventSpeaker::where('speaker_id', $speaker->id)
                    ->whereNotNull('certificate_path')
                    ->where('certificate_path', '!=', '')
                    ->with('event')
                    ->get();

                foreach ($speakerCertAssignments as $es) {
                    if (!$certificates->contains('file_path', $es->certificate_path)) {
                        $certificates->push((object)[
                            'id' => 'es_' . $es->id,
                            'certificate_number' => 'SERT-NRS/' . date('Y') . '/' . str_pad($es->id, 4, '0', STR_PAD_LEFT),
                            'event' => $es->event,
                            'file_path' => $es->certificate_path,
                            'file_url' => asset('storage/' . $es->certificate_path),
                            'issue_date' => $es->event?->start_date ? $es->event->start_date->format('Y-m-d') : date('Y-m-d'),
                            'role_type' => 'pembicara',
                            'user' => $user,
                        ]);
                    }
                }
            }
        }

        return Inertia::render('Certificates/MyCertificates', [
            'certificates' => $certificates->values(),
            'currentUser' => $user,
            'userRole' => $user->role, // 'peserta', 'pembicara', 'admin'
        ]);
    }
}
