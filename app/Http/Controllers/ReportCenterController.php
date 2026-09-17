<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\BimtekEvent;
use App\Models\DocumentTemplate;
use App\Models\EventRegistration;
use App\Models\EventSpeaker;
use Inertia\Inertia;

class ReportCenterController extends Controller
{
    /**
     * Light event list for searchable dropdowns (avoids nesting all registrations).
     */
    private function eventOptions()
    {
        return BimtekEvent::query()
            ->orderBy('start_date', 'desc')
            ->get(['id', 'title', 'start_date', 'end_date', 'status', 'location']);
    }

    public function index(Request $request)
    {
        $user = auth()->user();
        $isAdmin = $user && $user->role === 'admin';

        $templates = DocumentTemplate::all();
        $events = $this->eventOptions();

        $selectedTemplateCode = $request->query('template', 'REKAP_ABSENSI');
        $selectedEventId = $request->query('event_id', $events->first()?->id);

        $currentTemplate = DocumentTemplate::where('template_code', $selectedTemplateCode)->first() 
            ?? $templates->first();
        $currentEvent = BimtekEvent::with(['registrations.user', 'registrations.attendances', 'eventSpeakers.speaker'])
            ->find($selectedEventId) ?? BimtekEvent::with(['registrations.user', 'registrations.attendances', 'eventSpeakers.speaker'])
                ->orderBy('start_date', 'desc')
                ->first();

        // FOR PESERTA / PEMBICARA: Load ONLY events they registered for or spoke at
        $myRegisteredEvents = [];
        if ($user && !$isAdmin) {
            $myRegistrations = EventRegistration::with(['event', 'attendances'])
                ->where('user_id', $user->id)
                ->get();

            $myRegisteredEvents = $myRegistrations->map(function ($reg) {
                return [
                    'id' => $reg->id,
                    'registration_id' => $reg->id,
                    'registration_code' => $reg->registration_code,
                    'status' => $reg->status,
                    'is_attended' => $reg->attendances->count() > 0,
                    'attendance_count' => $reg->attendances->count(),
                    'certificate_url' => $reg->certificate_path ? asset('storage/' . $reg->certificate_path) : null,
                    'event' => $reg->event,
                ];
            });
        }

        return Inertia::render('Admin/ReportCenter', [
            'templates' => $templates,
            'events' => $events,
            'selectedTemplateCode' => $selectedTemplateCode,
            'selectedEventId' => (int) $selectedEventId,
            'currentTemplate' => $currentTemplate,
            'currentEvent' => $currentEvent,
            'myRegisteredEvents' => $myRegisteredEvents,
        ]);
    }

    public function myCertificates()
    {
        $user = auth()->user();

        // 1. Peserta Registrations & Certificates (Strictly ONLY certificates uploaded/issued by Admin)
        $registrations = EventRegistration::with(['event', 'attendances'])
            ->where('user_id', $user->id)
            ->whereNotNull('certificate_path')
            ->get();

        $pesertaCertificates = $registrations->map(function ($reg) {
            return [
                'type' => 'peserta',
                'id' => $reg->id,
                'event_id' => $reg->event?->id,
                'event_title' => $reg->event?->title ?? 'BIMTEK Diskominfo Kab. Bogor',
                'event_date' => $reg->event?->start_date,
                'location' => $reg->event?->location,
                'registration_code' => $reg->registration_code,
                'is_attended' => true,
                'status' => $reg->status,
                'certificate_url' => asset('storage/' . $reg->certificate_path),
            ];
        });

        // 2. Pembicara / Speaker Assignments & Certificates (Strictly ONLY certificates uploaded/issued by Admin)
        $speakerCertificates = collect([]);
        if ($user->role === 'pembicara' || $user->role === 'admin') {
            $speakerProfile = \App\Models\Speaker::where('name', 'like', '%' . $user->name . '%')
                ->orWhere('nip_nik', $user->nip_nik)
                ->first();

            if ($speakerProfile) {
                $eventSpeakers = EventSpeaker::with('event')
                    ->where('speaker_id', $speakerProfile->id)
                    ->whereNotNull('certificate_path')
                    ->get();

                $speakerCertificates = $eventSpeakers->map(function ($es) {
                    return [
                        'type' => 'pembicara',
                        'id' => $es->id,
                        'event_id' => $es->event?->id,
                        'event_title' => $es->event?->title ?? 'BIMTEK Diskominfo Kab. Bogor',
                        'event_date' => $es->event?->start_date,
                        'location' => $es->event?->location,
                        'topic' => $es->topic ?? 'Pemateri Utama',
                        'is_attended' => true,
                        'status' => 'approved',
                        'certificate_url' => asset('storage/' . $es->certificate_path),
                    ];
                });
            }
        }

        $allCertificates = $pesertaCertificates->concat($speakerCertificates)->values();

        return Inertia::render('Certificates/MyCertificates', [
            'certificates' => $allCertificates,
            'user' => $user,
        ]);
    }

    public function uploadCertificate(Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|in:peserta,pembicara',
            'target_id' => 'required|integer',
            'certificate_file' => 'required|file|mimes:pdf,docx,png,jpg,jpeg|max:10240',
        ]);

        if ($request->hasFile('certificate_file')) {
            $path = $request->file('certificate_file')->store('certificates', 'public');
            
            if ($validated['type'] === 'peserta') {
                $reg = EventRegistration::findOrFail($validated['target_id']);
                $reg->certificate_path = $path;
                $reg->save();
            } else {
                $es = EventSpeaker::findOrFail($validated['target_id']);
                $es->certificate_path = $path;
                $es->save();
            }
        }

        return back()->with('success', 'File Soft Sertifikat Resmi berhasil diunggah dan terintegrasi dengan peserta/pembicara!');
    }

    public function participantsReport(Request $request)
    {
        $events = $this->eventOptions();

        $selectedEventId = $request->query('event_id', $events->first()?->id);
        $currentEvent = BimtekEvent::with([
            'registrations.user.participantProfile', 
            'registrations.attendances', 
            'eventSpeakers.speaker'
        ])
        ->find($selectedEventId);

        if (!$currentEvent && $events->isNotEmpty()) {
            $currentEvent = BimtekEvent::with([
                'registrations.user.participantProfile',
                'registrations.attendances',
                'eventSpeakers.speaker'
            ])->find($events->first()->id);
            $selectedEventId = $events->first()->id;
        }

        // Check event-specific template first, fallback to general template
        $template = DocumentTemplate::where('template_code', 'DAFTAR_HADIR_EVENT_' . $selectedEventId)->first() 
                 ?? DocumentTemplate::where('template_code', 'DAFTAR_HADIR_OFFICIAL')->first();

        if (!$template) {
            $template = DocumentTemplate::create([
                'template_code' => 'DAFTAR_HADIR_EVENT_' . $selectedEventId,
                'template_name' => 'Daftar Hadir ' . ($currentEvent ? $currentEvent->title : 'BIMTEK'),
                'header_config' => [
                    'report_title' => 'DAFTAR HADIR ' . ($currentEvent ? strtoupper($currentEvent->title) : 'BIMBINGAN TEKNIS PEMANFAATAN ARTIFICIAL INTELLIGENCE (AI)'),
                    'program_code_name' => '2.16.03 Program Pengelolaan Aplikasi Informatika',
                    'kegiatan_code_name' => '2.16.03.2.02 Pengelolaan E-Government Di Lingkup Pemerintah Daerah Kabupaten/Kota',
                    'sub_kegiatan_code_name' => '2.16.03.2.02.0035 Koordinasi dan Fasilitasi Promosi Literasi SPBE dan/atau Kolaborasi Penyelenggaraan SPBE',
                    'acara' => $currentEvent ? $currentEvent->title : 'Bimbingan Teknis Artificial Intelligence (AI)',
                    'tanggal' => $currentEvent && $currentEvent->start_date ? $currentEvent->start_date->translatedFormat('d F Y') : '11 Agustus 2026',
                    'tempat' => $currentEvent && $currentEvent->location ? $currentEvent->location : 'Hotel New Pesona Anggraini Kec. Cisarua Kab. Bogor',
                    'col_school_label' => 'Nama Sekolah',
                    'col_district_label' => 'Kecamatan',
                    'signee_nama' => 'DINI SAUMI IMANIAH, SS, MM',
                    'signee_nip' => '19750927 199803 2 009',
                    'signee_jabatan' => 'PEJABAT PELAKSANA TEKNIS KEGIATAN',
                    'signee_substansi' => 'SUBSTANSI PENGEMBANGAN SUMBER DAYA DAN TEKNOLOGI INFORMATIKA',
                    'signee_location_date' => 'Cibinong, ' . now()->translatedFormat('d F Y'),
                    'custom_rows' => null,
                ],
                'body_html' => '',
                'signee_nama' => 'DINI SAUMI IMANIAH, SS, MM',
                'signee_nip' => '19750927 199803 2 009',
                'signee_jabatan' => 'PEJABAT PELAKSANA TEKNIS KEGIATAN',
            ]);
        }

        return Inertia::render('Admin/Reports/ParticipantsReport', [
            'events' => $events,
            'selectedEventId' => (int) $selectedEventId,
            'currentEvent' => $currentEvent,
            'template' => $template,
        ]);
    }

    public function updateReportHeader(Request $request)
    {
        $validated = $request->validate([
            'template_code' => 'required|string',
            'report_title' => 'required|string',
            'program_code_name' => 'nullable|string',
            'kegiatan_code_name' => 'nullable|string',
            'sub_kegiatan_code_name' => 'nullable|string',
            'acara' => 'nullable|string',
            'tanggal' => 'nullable|string',
            'tempat' => 'nullable|string',
            'col_school_label' => 'nullable|string',
            'col_district_label' => 'nullable|string',
            'signee_nama' => 'nullable|string',
            'signee_nip' => 'nullable|string',
            'signee_jabatan' => 'nullable|string',
            'signee_substansi' => 'nullable|string',
            'signee_location_date' => 'nullable|string',
            'custom_rows' => 'nullable|array',
        ]);

        $template = DocumentTemplate::firstOrCreate(
            ['template_code' => $validated['template_code']],
            [
                'template_name' => 'Daftar Hadir Resmi Kegiatan BIMTEK',
                'body_html' => '',
            ]
        );

        $headerConfig = [
            'report_title' => $validated['report_title'],
            'program_code_name' => $validated['program_code_name'] ?? '',
            'kegiatan_code_name' => $validated['kegiatan_code_name'] ?? '',
            'sub_kegiatan_code_name' => $validated['sub_kegiatan_code_name'] ?? '',
            'acara' => $validated['acara'] ?? '',
            'tanggal' => $validated['tanggal'] ?? '',
            'tempat' => $validated['tempat'] ?? '',
            'col_school_label' => $validated['col_school_label'] ?? 'Nama Sekolah',
            'col_district_label' => $validated['col_district_label'] ?? 'Kecamatan',
            'signee_nama' => $validated['signee_nama'] ?? '',
            'signee_nip' => $validated['signee_nip'] ?? '',
            'signee_jabatan' => $validated['signee_jabatan'] ?? '',
            'signee_substansi' => $validated['signee_substansi'] ?? '',
            'signee_location_date' => $validated['signee_location_date'] ?? '',
            'custom_rows' => $validated['custom_rows'] ?? null,
        ];

        $template->header_config = $headerConfig;
        $template->signee_nama = $validated['signee_nama'] ?? $template->signee_nama;
        $template->signee_nip = $validated['signee_nip'] ?? $template->signee_nip;
        $template->signee_jabatan = $validated['signee_jabatan'] ?? $template->signee_jabatan;
        $template->save();

        return back()->with('success', 'Data & Format Daftar Hadir Berhasil Diperbarui & Disimpan!');
    }

    public function honorariumReport(Request $request)
    {
        $events = $this->eventOptions();

        $selectedEventId = $request->query('event_id', $events->first()?->id);
        $currentEvent = BimtekEvent::with([
            'registrations.user.participantProfile', 
            'registrations.attendances', 
            'eventSpeakers.speaker'
        ])
        ->find($selectedEventId);

        if (!$currentEvent && $events->isNotEmpty()) {
            $currentEvent = BimtekEvent::with([
                'registrations.user.participantProfile',
                'registrations.attendances',
                'eventSpeakers.speaker'
            ])->find($events->first()->id);
            $selectedEventId = $events->first()->id;
        }

        // Check event-specific template first, fallback to general template
        $template = DocumentTemplate::where('template_code', 'HONORARIUM_EVENT_' . $selectedEventId)->first() 
                 ?? DocumentTemplate::where('template_code', 'HONORARIUM_OFFICIAL')->first();

        if (!$template) {
            $template = DocumentTemplate::create([
                'template_code' => 'HONORARIUM_EVENT_' . $selectedEventId,
                'template_name' => 'Tanda Terima Honorarium ' . ($currentEvent ? $currentEvent->title : 'BIMTEK'),
                'header_config' => [
                    'report_title' => 'TANDA TERIMA UANG SAKU PESERTA / HONORARIUM NARASUMBER',
                    'program_code_name' => '2.16.03 Program Pengelolaan Aplikasi Informatika',
                    'kegiatan_code_name' => '2.16.03.2.02 Pengelolaan E-Government Di Lingkup Pemerintah Daerah Kabupaten/Kota',
                    'sub_kegiatan_code_name' => '2.16.03.2.02.0035 Koordinasi dan Fasilitasi Promosi Literasi SPBE dan/atau Kolaborasi Penyelenggaraan SPBE',
                    'acara' => $currentEvent ? $currentEvent->title : 'Bimbingan Teknis Artificial Intelligence (AI)',
                    'tanggal' => $currentEvent && $currentEvent->start_date ? $currentEvent->start_date->translatedFormat('d F Y') : '11 Agustus 2026',
                    'tempat' => $currentEvent && $currentEvent->location ? $currentEvent->location : 'Hotel New Pesona Anggraini Kec. Cisarua Kab. Bogor',
                    'col_school_label' => 'Uraian / Komponen',
                    'col_district_label' => 'Jumlah (Rp)',
                    'signee_nama' => 'DINI SAUMI IMANIAH, SS, MM',
                    'signee_nip' => '19750927 199803 2 009',
                    'signee_jabatan' => 'PEJABAT PELAKSANA TEKNIS KEGIATAN',
                    'signee_substansi' => 'SUBSTANSI PENGEMBANGAN SUMBER DAYA DAN TEKNOLOGI INFORMATIKA',
                    'signee_location_date' => 'Cibinong, ' . now()->translatedFormat('d F Y'),
                    'custom_rows' => null,
                ],
                'body_html' => '',
                'signee_nama' => 'DINI SAUMI IMANIAH, SS, MM',
                'signee_nip' => '19750927 199803 2 009',
                'signee_jabatan' => 'PEJABAT PELAKSANA TEKNIS KEGIATAN',
            ]);
        }

        $payments = \App\Models\PaymentComponent::with('user')->where('event_id', $selectedEventId)->get();

        return Inertia::render('Admin/Reports/HonorariumReport', [
            'events' => $events,
            'selectedEventId' => (int) $selectedEventId,
            'currentEvent' => $currentEvent,
            'template' => $template,
            'payments' => $payments
        ]);
    }

    public function speakersReport(Request $request)
    {
        $events = $this->eventOptions();

        $selectedEventId = $request->query('event_id', $events->first()?->id);
        $currentEvent = BimtekEvent::with(['eventSpeakers.speaker', 'registrations.user'])
            ->find($selectedEventId);

        if (!$currentEvent && $events->isNotEmpty()) {
            $currentEvent = BimtekEvent::with(['eventSpeakers.speaker', 'registrations.user'])
                ->find($events->first()->id);
            $selectedEventId = $events->first()->id;
        }

        $template = DocumentTemplate::where('template_code', 'HONOR_PEMBICARA')->first();

        return Inertia::render('Admin/Reports/SpeakersReport', [
            'events' => $events,
            'selectedEventId' => (int) $selectedEventId,
            'currentEvent' => $currentEvent,
            'template' => $template,
        ]);
    }

    public function updateTemplate(Request $request, $id)
    {
        $template = DocumentTemplate::findOrFail($id);

        $validated = $request->validate([
            'body_html' => 'required|string',
            'signee_nama' => 'required|string',
            'signee_nip' => 'required|string',
            'signee_jabatan' => 'required|string',
        ]);

        $template->update($validated);

        return back()->with('success', 'Template dokumen PDF berhasil diperbarui!');
    }

    public function exportAttendanceExcel(Request $request)
    {
        $eventId = $request->query('event_id');
        $exportType = $request->query('type', 'official'); // 'official', 'all', 'pembicara', 'peserta'

        $event = BimtekEvent::with(['registrations.user.participantProfile', 'registrations.attendances', 'eventSpeakers.speaker'])
            ->find($eventId) ?? BimtekEvent::with(['registrations.user.participantProfile', 'registrations.attendances', 'eventSpeakers.speaker'])->first();

        $template = DocumentTemplate::where('template_code', 'DAFTAR_HADIR_OFFICIAL')->first();
        $header = $template?->header_config ?? [];

        $reportTitle = $header['report_title'] ?? ('DAFTAR HADIR ' . ($event ? strtoupper($event->title) : 'BIMBINGAN TEKNIS'));
        $prog = $header['program_code_name'] ?? '2.16.03 Program Pengelolaan Aplikasi Informatika';
        $keg = $header['kegiatan_code_name'] ?? '2.16.03.2.02 Pengelolaan E-Government Di Lingkup Pemerintah Daerah Kabupaten/Kota';
        $subKeg = $header['sub_kegiatan_code_name'] ?? '2.16.03.2.02.0035 Koordinasi dan Fasilitasi Promosi Literasi SPBE dan/atau Kolaborasi Penyelenggaraan SPBE';
        $acara = $header['acara'] ?? ($event ? $event->title : 'Bimbingan Teknis Artificial Intelligence (AI)');
        $tanggal = $header['tanggal'] ?? ($event && $event->start_date ? $event->start_date->translatedFormat('d F Y') : '11 Agustus 2026');
        $tempat = $header['tempat'] ?? ($event && $event->location ? $event->location : 'Hotel New Pesona Anggraini Kec. Cisarua Kab. Bogor');
        $colSchool = $header['col_school_label'] ?? 'Nama Sekolah';
        $colDistrict = $header['col_district_label'] ?? 'Kecamatan';

        $filename = "Daftar_Hadir_" . str_replace(' ', '_', preg_replace('/[^a-zA-Z0-9 ]/', '', $acara)) . ".csv";

        $output = "========================================================================================\n";
        $output .= "{$reportTitle}\n";
        $output .= "========================================================================================\n";
        $output .= "Kode/Program       : {$prog}\n";
        $output .= "Kode/Kegiatan      : {$keg}\n";
        $output .= "Kode/Sub. Kegiatan : {$subKeg}\n";
        $output .= "Acara              : {$acara}\n";
        $output .= "Tanggal            : {$tanggal}\n";
        $output .= "Tempat             : {$tempat}\n";
        $output .= "========================================================================================\n\n";

        $output .= "No,Nama,{$colSchool},{$colDistrict},Tandatangan\n";

        $no = 1;

        if ($event && $event->registrations) {
            foreach ($event->registrations as $reg) {
                $u = $reg->user;
                if ($u && $u->role !== 'admin') {
                    $schoolOrInstansi = $u->participantProfile?->instansi ?? $u->instansi ?? '-';
                    $districtOrJabatan = $u->participantProfile?->no_hp ? ('Kec. ' . ($u->participantProfile?->jabatan ?? 'Bogor')) : ($u->jabatan ?? 'Kab. Bogor');
                    $sigNumber = $no;

                    $output .= implode(',', [
                        $no,
                        '"' . str_replace('"', '""', $u->name) . '"',
                        '"' . str_replace('"', '""', $schoolOrInstansi) . '"',
                        '"' . str_replace('"', '""', $districtOrJabatan) . '"',
                        '"' . ($no % 2 === 1 ? ($sigNumber . ' ..........') : ('.......... ' . $sigNumber)) . '"'
                    ]) . "\n";

                    $no++;
                }
            }
        }

        return response($output, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
            'Cache-Control' => 'no-cache, no-store, must-revalidate',
            'Pragma' => 'no-cache',
            'Expires' => '0',
        ]);
    }

    public function exportHonorariumExcel(Request $request)
    {
        $eventId = $request->query('event_id');

        $event = BimtekEvent::with(['payments.user'])
            ->find($eventId) ?? BimtekEvent::with(['payments.user'])->first();

        $template = DocumentTemplate::where('template_code', 'HONORARIUM_EVENT_' . $eventId)->first() 
                 ?? DocumentTemplate::where('template_code', 'HONORARIUM_OFFICIAL')->first();
        $header = $template?->header_config ?? [];

        $reportTitle = $header['report_title'] ?? ('TANDA TERIMA HONORARIUM ' . ($event ? strtoupper($event->title) : 'BIMBINGAN TEKNIS'));
        $prog = $header['program_code_name'] ?? '2.16.03 Program Pengelolaan Aplikasi Informatika';
        $keg = $header['kegiatan_code_name'] ?? '2.16.03.2.02 Pengelolaan E-Government Di Lingkup Pemerintah Daerah Kabupaten/Kota';
        $subKeg = $header['sub_kegiatan_code_name'] ?? '2.16.03.2.02.0035 Koordinasi dan Fasilitasi Promosi Literasi SPBE dan/atau Kolaborasi Penyelenggaraan SPBE';
        $acara = $header['acara'] ?? ($event ? $event->title : 'Bimbingan Teknis Artificial Intelligence (AI)');
        $tanggal = $header['tanggal'] ?? ($event && $event->start_date ? $event->start_date->translatedFormat('d F Y') : '11 Agustus 2026');
        $tempat = $header['tempat'] ?? ($event && $event->location ? $event->location : 'Hotel New Pesona Anggraini Kec. Cisarua Kab. Bogor');
        $colSchool = $header['col_school_label'] ?? 'Uraian / Komponen';
        $colDistrict = $header['col_district_label'] ?? 'Pajak & Honor Bersih';

        $filename = "Honorarium_" . str_replace(' ', '_', preg_replace('/[^a-zA-Z0-9 ]/', '', $acara)) . ".csv";

        $output = "========================================================================================\n";
        $output .= "{$reportTitle}\n";
        $output .= "========================================================================================\n";
        $output .= "Kode/Program       : {$prog}\n";
        $output .= "Kode/Kegiatan      : {$keg}\n";
        $output .= "Kode/Sub. Kegiatan : {$subKeg}\n";
        $output .= "Acara              : {$acara}\n";
        $output .= "Tanggal            : {$tanggal}\n";
        $output .= "Tempat             : {$tempat}\n";
        $output .= "========================================================================================\n\n";

        $output .= "No,Nama,{$colSchool},{$colDistrict},Tandatangan\n";

        $no = 1;
        
        $payments = \App\Models\PaymentComponent::with('user')->where('event_id', $event->id ?? $eventId)->get();

        if ($payments && $payments->count() > 0) {
            foreach ($payments as $p) {
                $u = $p->user;
                $komponen = "{$p->component_type} - {$p->volume} {$p->unit}";
                $pajak = "PPh Rp" . number_format($p->tax_amount, 0, ',', '.') . " / Bersih: Rp" . number_format($p->net_amount, 0, ',', '.');
                $sigNumber = $no;

                $output .= implode(',', [
                    $no,
                    '"' . str_replace('"', '""', $u->name ?? 'Penerima Honor') . '"',
                    '"' . str_replace('"', '""', $komponen) . '"',
                    '"' . str_replace('"', '""', $pajak) . '"',
                    '"' . ($no % 2 === 1 ? ($sigNumber . ' ..........') : ('.......... ' . $sigNumber)) . '"'
                ]) . "\n";

                $no++;
            }
        }

        return response($output, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
            'Cache-Control' => 'no-cache, no-store, must-revalidate',
            'Pragma' => 'no-cache',
            'Expires' => '0',
        ]);
    }
}
