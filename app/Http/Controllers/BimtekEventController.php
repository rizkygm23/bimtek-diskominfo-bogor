<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Response;
use App\Models\BimtekEvent;
use App\Models\EventRegistration;
use App\Models\User;
use App\Models\Attendance;
use Inertia\Inertia;

class BimtekEventController extends Controller
{
    public function publicLanding()
    {
        $events = BimtekEvent::withCount('registrations')
            ->orderBy('start_date', 'desc')
            ->take(6)
            ->get();

        return Inertia::render('Landing', [
            'events' => $events,
        ]);
    }

    public function index()
    {
        $events = BimtekEvent::withCount('registrations')
            ->orderBy('start_date', 'desc')
            ->get();

        $userRegistrationEventIds = [];
        if (auth()->check()) {
            $userRegistrationEventIds = EventRegistration::where('user_id', auth()->id())
                ->pluck('bimtek_event_id')
                ->toArray();
        }

        return Inertia::render('Events/Index', [
            'events' => $events,
            'registeredEventIds' => $userRegistrationEventIds,
        ]);
    }

    public function show($id)
    {
        $event = BimtekEvent::with([
            'formFields', 
            'eventSpeakers.speaker', 
            'registrations.user',
            'registrations.answers.formField',
            'registrations.attendances'
        ])->find($id);

        if (!$event) {
            return redirect()->route('events.index')
                ->with('warning', 'Kegiatan BIMTEK yang Anda cari telah dihapus oleh Administrator. Seluruh data akun Anda tetap tersimpan dan aktif.');
        }

        $userRegistration = null;
        $userSpeakerAssignment = null;

        if (auth()->check()) {
            $user = auth()->user();
            if ($user->role === 'pembicara') {
                $speaker = \App\Models\Speaker::where('user_id', $user->id)->first();
                $userSpeakerAssignment = $speaker ? \App\Models\EventSpeaker::where('bimtek_event_id', $id)->where('speaker_id', $speaker->id)->whereNotNull('topic')->first() : null;
            } else {
                $userRegistration = EventRegistration::where('bimtek_event_id', $id)
                    ->where('user_id', $user->id)
                    ->with('attendances')
                    ->first();
            }
        }

        return Inertia::render('Events/Show', [
            'event' => $event,
            'userRegistration' => $userRegistration,
            'userSpeakerAssignment' => $userSpeakerAssignment,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'location' => 'required|string',
            'quota' => 'required|integer|min:1',
            'status' => 'required|in:draft,open,ongoing,completed',
        ]);

        $validated['slug'] = Str::slug($validated['title']) . '-' . Str::random(5);

        $event = BimtekEvent::create($validated);

        return redirect()->route('events.show', $event->id)
            ->with('success', 'Kegiatan BIMTEK berhasil ditambahkan!');
    }

    public function update(Request $request, $id)
    {
        $event = BimtekEvent::findOrFail($id);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'location' => 'required|string',
            'quota' => 'required|integer|min:1',
            'status' => 'required|in:draft,open,ongoing,completed',
        ]);

        $event->update($validated);

        return back()->with('success', 'Data kegiatan BIMTEK berhasil diperbarui!');
    }

    public function destroy($id)
    {
        $event = BimtekEvent::findOrFail($id);
        $eventTitle = $event->title;
        $event->delete();

        return redirect()->route('events.index')
            ->with('success', "Kegiatan BIMTEK '{$eventTitle}' berhasil dihapus dari katalog. Data akun peserta dan narasumber yang telah mendaftar tetap tersimpan aman dan dapat login seperti biasa.");
    }

    public function storeHistoryEvent(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'location' => 'required|string|max:255',
            'speaker_name' => 'nullable|string|max:255',
            'speaker_topic' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'attendees_raw' => 'nullable|string',
            'attendance_file' => 'nullable|file|max:10240',
        ]);

        $validated['slug'] = Str::slug($validated['title']) . '-' . Str::random(5);
        $validated['status'] = 'completed';
        $validated['quota'] = 100;
        $validated['description'] = $validated['description'] ?? 'Kegiatan Bimbingan Teknis telah dilaksanakan.';

        $event = BimtekEvent::create([
            'title' => $validated['title'],
            'slug' => $validated['slug'],
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'],
            'location' => $validated['location'],
            'description' => $validated['description'],
            'status' => 'completed',
            'quota' => 100,
        ]);

        // Assign Speaker if provided
        if (!empty($validated['speaker_name'])) {
            $speakerName = trim($validated['speaker_name']);
            $speakerProfile = \App\Models\Speaker::firstOrCreate(
                ['name' => $speakerName],
                [
                    'nip_nik' => '19800101' . rand(100000, 999999),
                    'instansi' => 'Narasumber Expert Kedinasan',
                    'jabatan' => 'Pemateri Utama',
                    'keahlian' => 'Komunikasi & Informatika',
                    'golongan' => 'IV/a',
                ]
            );

            \App\Models\EventSpeaker::firstOrCreate(
                [
                    'bimtek_event_id' => $event->id,
                    'speaker_id' => $speakerProfile->id,
                ],
                [
                    'topic' => !empty($validated['speaker_topic']) ? trim($validated['speaker_topic']) : 'Materi Bimbingan Teknis',
                ]
            );
        }

        // Process Participants (From text lines OR uploaded Excel file)
        $importedCount = 0;

        // Option A: Raw text lines
        if (!empty($validated['attendees_raw'])) {
            $lines = preg_split('/\r\n|\r|\n/', $validated['attendees_raw']);
            foreach ($lines as $line) {
                if (trim($line) === '') continue;
                $delimiter = str_contains($line, ';') ? ';' : (str_contains($line, "\t") ? "\t" : ',');
                $row = str_getcsv($line, $delimiter);
                if (count($row) === 0 || empty(trim($row[0]))) continue;

                $nipNik = !empty(trim($row[0])) ? trim($row[0]) : 'NIP-' . rand(10000000, 99999999);
                $name = isset($row[1]) && !empty(trim($row[1])) ? trim($row[1]) : 'Peserta BIMTEK';
                $instansi = isset($row[2]) && !empty(trim($row[2])) ? trim($row[2]) : 'Dinas Komunikasi dan Informatika';
                $email = isset($row[3]) && filter_var(trim($row[3]), FILTER_VALIDATE_EMAIL) 
                    ? trim($row[3]) 
                    : 'peserta_' . (Str::slug($nipNik) ?: rand(100000, 999999)) . '_' . Str::random(4) . '@bogorkab.go.id';

                $user = User::where('nip_nik', $nipNik)->orWhere('email', $email)->first();
                if (!$user) {
                    $user = User::create([
                        'nip_nik' => $nipNik,
                        'name' => $name,
                        'email' => $email,
                        'password' => bcrypt('password'),
                        'instansi' => $instansi,
                        'role' => 'peserta',
                    ]);
                }

                $registration = EventRegistration::firstOrCreate(
                    ['bimtek_event_id' => $event->id, 'user_id' => $user->id],
                    ['registration_code' => 'REG-' . strtoupper(Str::random(6)), 'status' => 'approved']
                );

                Attendance::firstOrCreate(
                    ['event_registration_id' => $registration->id],
                    ['checked_in_at' => now(), 'check_in_method' => 'manual_entry']
                );

                $importedCount++;
            }
        }

        // Option B: Uploaded Excel/CSV file
        if ($request->hasFile('attendance_file')) {
            $file = $request->file('attendance_file');
            $content = file_get_contents($file->getRealPath());
            $lines = preg_split('/\r\n|\r|\n/', $content);
            foreach ($lines as $index => $line) {
                if (trim($line) === '') continue;
                if ($index === 0 && (str_contains(strtolower($line), 'nip') || str_contains(strtolower($line), 'nama'))) continue;
                $delimiter = str_contains($line, ';') ? ';' : (str_contains($line, "\t") ? "\t" : ',');
                $row = str_getcsv($line, $delimiter);
                if (count($row) === 0 || empty(trim($row[0]))) continue;

                $nipNik = !empty(trim($row[0])) ? trim($row[0]) : 'NIP-' . rand(10000000, 99999999);
                $name = isset($row[1]) && !empty(trim($row[1])) ? trim($row[1]) : 'Peserta Import';
                $instansi = isset($row[2]) && !empty(trim($row[2])) ? trim($row[2]) : 'Dinas Komunikasi dan Informatika';
                $email = isset($row[3]) && filter_var(trim($row[3]), FILTER_VALIDATE_EMAIL) 
                    ? trim($row[3]) 
                    : 'peserta_' . (Str::slug($nipNik) ?: rand(100000, 999999)) . '_' . Str::random(4) . '@bogorkab.go.id';

                $user = User::where('nip_nik', $nipNik)->orWhere('email', $email)->first();
                if (!$user) {
                    $user = User::create([
                        'nip_nik' => $nipNik,
                        'name' => $name,
                        'email' => $email,
                        'password' => bcrypt('password'),
                        'instansi' => $instansi,
                        'role' => 'peserta',
                    ]);
                }

                $registration = EventRegistration::firstOrCreate(
                    ['bimtek_event_id' => $event->id, 'user_id' => $user->id],
                    ['registration_code' => 'REG-' . strtoupper(Str::random(6)), 'status' => 'approved']
                );

                Attendance::firstOrCreate(
                    ['event_registration_id' => $registration->id],
                    ['checked_in_at' => now(), 'check_in_method' => 'excel_import']
                );

                $importedCount++;
            }
        }

        return back()->with('success', "Data Riwayat Kegiatan BIMTEK '{$event->title}' berhasil ditambahkan beserta Pemateri dan {$importedCount} data audiens peserta!");
    }

    public function history()
    {
        $events = BimtekEvent::with([
            'registrations.user',
            'registrations.attendances',
            'eventSpeakers.speaker'
        ])
        ->orderBy('start_date', 'desc')
        ->get();

        $eventsHistory = $events->map(function ($ev) {
            $totalRegistrations = $ev->registrations->count();
            $attendedRegistrations = $ev->registrations->filter(fn($r) => $r->attendances->count() > 0);
            $totalAttended = $attendedRegistrations->count();

            return [
                'id' => $ev->id,
                'title' => $ev->title,
                'slug' => $ev->slug,
                'description' => $ev->description,
                'start_date' => $ev->start_date,
                'end_date' => $ev->end_date,
                'location' => $ev->location,
                'quota' => $ev->quota,
                'status' => $ev->status,
                'computed_status' => $ev->computed_status,
                'total_registrations' => $totalRegistrations,
                'total_attended' => $totalAttended,
                'attendance_percentage' => $totalRegistrations > 0 ? round(($totalAttended / $totalRegistrations) * 100, 1) : 0,
                'speakers' => $ev->eventSpeakers->map(fn($es) => [
                    'id' => $es->speaker_id,
                    'name' => $es->speaker?->name,
                    'topic' => $es->topic,
                ]),
                'attendees_list' => $attendedRegistrations->map(function ($r) {
                    $att = $r->attendances->first();
                    return [
                        'registration_id' => $r->id,
                        'registration_code' => $r->registration_code,
                        'name' => $r->user?->name,
                        'nip_nik' => $r->user?->nip_nik,
                        'instansi' => $r->user?->instansi,
                        'email' => $r->user?->email,
                        'checked_in_at' => $att?->checked_in_at ? $att->checked_in_at->format('d M Y, H:i') : '-',
                        'method' => $att?->check_in_method === 'excel_import' ? 'Import Excel' : 'Scan QR Code',
                        'certificate_url' => $r->certificate_path ? asset('storage/' . $r->certificate_path) : null,
                    ];
                })->values(),
            ];
        });

        return Inertia::render('Admin/EventHistory', [
            'eventsHistory' => $eventsHistory,
        ]);
    }

    public function importAttendance(Request $request, $eventId)
    {
        $request->validate([
            'file' => 'required|file|max:10240',
        ]);

        $event = BimtekEvent::findOrFail($eventId);
        $file = $request->file('file');
        $path = $file->getRealPath();

        $content = file_get_contents($path);
        $lines = preg_split('/\r\n|\r|\n/', $content);

        $importedCount = 0;

        foreach ($lines as $index => $line) {
            if (trim($line) === '') continue;

            // Skip header if contains NIP or NAMA
            if ($index === 0 && (str_contains(strtolower($line), 'nip') || str_contains(strtolower($line), 'nama'))) {
                continue;
            }

            // Auto-detect delimiter: semicolon, tab, or comma
            $delimiter = str_contains($line, ';') ? ';' : (str_contains($line, "\t") ? "\t" : ',');
            $row = str_getcsv($line, $delimiter);

            if (count($row) === 0 || empty(trim($row[0]))) continue;

            $nipNik = trim($row[0]);
            $name = isset($row[1]) && !empty(trim($row[1])) ? trim($row[1]) : 'Peserta Import';
            $instansi = isset($row[2]) && !empty(trim($row[2])) ? trim($row[2]) : 'Dinas Komunikasi dan Informatika';
            $email = isset($row[3]) && filter_var(trim($row[3]), FILTER_VALIDATE_EMAIL) 
                ? trim($row[3]) 
                : 'peserta_' . Str::slug($nipNik) . '@bogorkab.go.id';

            // Find or Create User
            $user = User::firstOrCreate(
                ['nip_nik' => $nipNik],
                [
                    'name' => $name,
                    'email' => $email,
                    'password' => bcrypt('password'),
                    'instansi' => $instansi,
                    'role' => 'peserta',
                ]
            );

            // Find or Create Registration
            $registration = EventRegistration::firstOrCreate(
                [
                    'bimtek_event_id' => $event->id,
                    'user_id' => $user->id,
                ],
                [
                    'registration_code' => 'REG-' . strtoupper(Str::random(6)),
                    'status' => 'approved',
                ]
            );

            // Record Attendance
            Attendance::firstOrCreate(
                [
                    'event_registration_id' => $registration->id,
                ],
                [
                    'checked_in_at' => now(),
                    'check_in_method' => 'excel_import',
                ]
            );

            $importedCount++;
        }

        return back()->with('success', "Berhasil mengimpor {$importedCount} data kehadiran peserta dari file Excel/CSV ke dalam riwayat '{$event->title}'!");
    }

    public function downloadAttendanceTemplate()
    {
        $csvHeader = "NIP_NIK;Nama;Instansi;Email\n";
        $csvSample1 = "198503122010011002;Budi Santoso, S.STP;Dinas Komunikasi dan Informatika;budi.santoso@bogorkab.go.id\n";
        $csvSample2 = "3201011656525520;Siti Rahmawati, M.Si;Bappedalitbang Kab. Bogor;siti.rahmawati@bogorkab.go.id\n";
        $csvContent = $csvHeader . $csvSample1 . $csvSample2;

        return Response::make($csvContent, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="Template_Import_Kehadiran_BIMTEK.csv"',
        ]);
    }
}
