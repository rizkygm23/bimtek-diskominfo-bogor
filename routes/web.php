<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BimtekEventController;
use App\Http\Controllers\FormBuilderController;
use App\Http\Controllers\RegistrationController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\SpeakerController;
use App\Http\Controllers\ReportCenterController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\VerificationController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\CertificateController;
use App\Http\Controllers\RealtimeController;
use App\Http\Controllers\DocumentStreamController;
use App\Http\Middleware\AdminMiddleware;
use Inertia\Inertia;

// GUEST & LANDING PAGE
Route::get('/', [BimtekEventController::class, 'publicLanding'])->name('home');

Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
    Route::post('/login', [AuthController::class, 'login']);

    // SEPARATE REGISTRATION ROUTES
    Route::get('/register', [AuthController::class, 'showRegister'])->name('register');
    Route::get('/register/choice', [AuthController::class, 'showRegister'])->name('register.choice');
    Route::get('/register/peserta', [AuthController::class, 'showRegisterPeserta'])->name('register.peserta');
    Route::post('/register/peserta', [AuthController::class, 'registerPeserta'])->name('register.peserta.store');
    Route::get('/register/pembicara', [AuthController::class, 'showRegisterPembicara'])->name('register.pembicara');
    Route::post('/register/pembicara', [AuthController::class, 'registerPembicara'])->name('register.pembicara.store');
});

// QUICK SWITCH FOR DEMO TESTING - Only available for admin role
Route::middleware('auth')->get('/quick-switch/{role}', [AuthController::class, 'quickSwitch'])->name('quick.switch');
Route::match(['get', 'post'], '/logout', [AuthController::class, 'logout'])->name('logout');

// AUTHENTICATED ROUTES
Route::middleware('auth')->group(function () {
    // DASHBOARD (ROLE ISOLATED VIEWS)
    Route::get('/dashboard', function () {
        $user = auth()->user();
        
        $stats = [];
        if ($user->role === 'admin') {
            $stats = [
                'total_events' => \App\Models\BimtekEvent::count(),
                'active_events' => \App\Models\BimtekEvent::where(function ($q) {
                    // Event aktif = belum selesai (end_date >= sekarang) ATAU
                    // status DB ongoing (sedang berjalan tanpa end_date jelas).
                    $q->where('end_date', '>=', now())
                      ->orWhere(function ($q2) {
                          $q2->whereNull('end_date')
                             ->whereIn('status', ['open', 'ongoing']);
                      });
                })->count(),
                'total_participants' => \App\Models\User::where('role', 'user')->count(),
                'total_speakers' => \App\Models\Speaker::count() ?: \App\Models\User::where('role', 'pembicara')->count(),
                'total_registrations' => \App\Models\EventRegistration::whereHas('user', function($q) {
                    $q->where('role', 'user');
                })->count(),
                'today_attendances' => \App\Models\Attendance::whereIn('attendance_type', ['absensi_hari_h', 'hadir'])->whereDate('checked_in_at', now())->count(),
                'verified_profiles' => \App\Models\ParticipantProfile::where('verification_status', 'terverifikasi')->count(),
                'total_payments' => \App\Models\PaymentComponent::sum('net_amount'),
            ];
        }

        $myRegistrations = \App\Models\EventRegistration::where('user_id', $user->id)
            ->with(['event.eventSpeakers.speaker', 'attendances'])
            ->get();

        $myTeachingSchedule = [];
        if ($user->role === 'pembicara') {
            $speaker = \App\Models\Speaker::where('user_id', $user->id)->first();
            $speakerId = $speaker ? $speaker->id : null;

            $myTeachingSchedule = \App\Models\EventSpeaker::where(function($q) use ($user, $speakerId) {
                if ($speakerId) {
                    $q->where('speaker_id', $speakerId);
                }
                $q->orWhereHas('speaker', function($sq) use ($user) {
                    $sq->where('user_id', $user->id)->orWhere('name', 'like', '%' . $user->name . '%');
                });
            })->with('event')->get();
        }

        $adminEvents = [];
        if ($user->role === 'admin') {
            $adminEvents = \App\Models\BimtekEvent::withCount(['registrations' => function($q) {
                $q->whereHas('user', function($uq) {
                    $uq->where('role', 'user');
                });
            }])
            ->orderBy('start_date', 'desc')
            ->take(6)
            ->get();
        }

        return Inertia::render('Dashboard', [
            'stats' => $stats,
            'myRegistrations' => $myRegistrations,
            'myTeachingSchedule' => $myTeachingSchedule,
            'adminEvents' => $adminEvents,
        ]);
    })->name('dashboard');

    // USER PROFILE & AVATAR LOGO UPLOAD
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::put('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::post('/profile/avatar', [ProfileController::class, 'updateAvatar'])->name('profile.avatar');

    // PRIVATE SENSITIVE DOCUMENT STREAM
    Route::get('/documents/stream', [DocumentStreamController::class, 'stream'])->name('documents.stream');

    // BIMTEK EVENTS
    Route::get('/events', [BimtekEventController::class, 'index'])->name('events.index');
    Route::get('/events/{id}', [BimtekEventController::class, 'show'])->name('events.show');

    // PARTICIPANT REGISTRATION & TICKET
    Route::get('/events/{eventId}/register', [RegistrationController::class, 'showRegistrationForm'])->name('events.register');
    Route::post('/events/{eventId}/register', [RegistrationController::class, 'store'])->name('events.register.store');
    Route::get('/registrations/{id}/ticket', [RegistrationController::class, 'ticket'])->name('registrations.ticket');

    // ATTENDANCE & DYNAMIC QR SCANNER
    Route::get('/attendance/scan', [AttendanceController::class, 'scanView'])->name('attendance.scan');
    // Throttle: maks 10 req/menit/user — cegah spam scan QR
    Route::post('/attendance/check-in', [AttendanceController::class, 'checkIn'])->middleware('throttle:10,1')->name('attendance.check-in');

    // PERSONAL CERTIFICATES
    Route::get('/my-certificates', [CertificateController::class, 'myCertificates'])->name('my-certificates');
    Route::get('/event-history', [BimtekEventController::class, 'history'])->name('event-history');

    // SPEAKER MATERIAL UPLOAD, DOWNLOAD & STREAM
    Route::post('/speaker/upload-material', [SpeakerController::class, 'uploadMaterial'])->name('speaker.upload-material');
    Route::delete('/speaker/delete-material/{eventSpeakerId}', [SpeakerController::class, 'deleteMaterial'])->name('speaker.delete-material');
    Route::get('/materials/download/{eventSpeakerId}', [SpeakerController::class, 'downloadMaterial'])->name('materials.download');
    Route::get('/materials/stream/{eventSpeakerId}', [SpeakerController::class, 'streamMaterial'])->name('materials.stream');

    // ADMIN ONLY ROUTES
    Route::middleware([AdminMiddleware::class])->group(function () {
        // DATA VERIFICATION MODULE
        Route::get('/admin/verifications', [VerificationController::class, 'index'])->name('admin.verifications');
        Route::post('/admin/verifications/{id}/status', [VerificationController::class, 'updateStatus'])->name('admin.verifications.update-status');

        // EVENT DYNAMIC QR CODE GENERATOR FOR HARI-H
        Route::get('/admin/events/{id}/qr-event', [AttendanceController::class, 'adminEventQr'])->name('admin.events.qr-event');
        Route::post('/admin/events/{id}/qr-session', [AttendanceController::class, 'generateNewQrSession'])->name('admin.events.qr-session');
        // Throttle: maks 30 req/menit/admin — presensi manual berurutan
        Route::post('/admin/attendance/manual', [AttendanceController::class, 'adminManualCheckIn'])->middleware('throttle:30,1')->name('admin.attendance.manual');
        // Pendaftaran akun + event + presensi on-the-spot untuk peserta walk-in hari-H
        Route::post('/admin/attendance/on-the-spot', [AttendanceController::class, 'adminOnTheSpotRegister'])->middleware('throttle:20,1')->name('admin.attendance.on-the-spot');

        // EVENT CRUD
        Route::post('/admin/events/store', [BimtekEventController::class, 'store'])->name('admin.events.store');
        Route::put('/admin/events/{id}', [BimtekEventController::class, 'update'])->name('admin.events.update');
        Route::delete('/admin/events/{id}', [BimtekEventController::class, 'destroy'])->name('admin.events.destroy');

        // DYNAMIC FORM BUILDER
        Route::get('/admin/events/{eventId}/form-builder', [FormBuilderController::class, 'edit'])->name('admin.form-builder');
        Route::post('/admin/events/{eventId}/form-fields', [FormBuilderController::class, 'store'])->name('admin.form-fields.store');
        Route::put('/admin/form-fields/{id}', [FormBuilderController::class, 'update'])->name('admin.form-fields.update');
        Route::post('/admin/events/{eventId}/reorder-fields', [FormBuilderController::class, 'reorder'])->name('admin.form-fields.reorder');
        Route::delete('/admin/form-fields/{id}', [FormBuilderController::class, 'destroy'])->name('admin.form-fields.destroy');

        // SPEAKERS MASTER
        Route::get('/admin/speakers', [SpeakerController::class, 'index'])->name('admin.speakers');
        Route::post('/admin/speakers', [SpeakerController::class, 'storeSpeaker'])->name('admin.speakers.store');

        // PAYMENTS (HONORARIUM & TRANSPORT ALLOWANCE)
        Route::get('/admin/payments', [PaymentController::class, 'index'])->name('admin.payments');
        Route::post('/admin/payments/store', [PaymentController::class, 'store'])->name('admin.payments.store');
        Route::post('/admin/payments/{id}/status', [PaymentController::class, 'updateStatus'])->name('admin.payments.update-status');
        Route::delete('/admin/payments/{id}', [PaymentController::class, 'destroy'])->name('admin.payments.destroy');

        // TAX PARAMETERS SETTINGS
        Route::get('/admin/tax-settings', [PaymentController::class, 'taxSettings'])->name('admin.tax-settings');
        Route::post('/admin/tax-settings/store', [PaymentController::class, 'storeTaxParameter'])->name('admin.tax-settings.store');
        Route::put('/admin/tax-settings/{id}', [PaymentController::class, 'updateTaxParameter'])->name('admin.tax-settings.update');

        // CERTIFICATES MANAGEMENT (GOOGLE DRIVE-LIKE REPOSITORY & BULK UPLOAD)
        Route::get('/admin/certificates', [CertificateController::class, 'index'])->name('admin.certificates');
        Route::post('/admin/certificates/store', [CertificateController::class, 'store'])->name('admin.certificates.store');
        Route::post('/admin/certificates/bulk-upload', [CertificateController::class, 'bulkUpload'])->name('admin.certificates.bulk-upload');
        Route::post('/admin/certificates/single-upload', [CertificateController::class, 'singleUpload'])->name('admin.certificates.single-upload');
        Route::get('/admin/certificates/event/{eventId}/download-all', [CertificateController::class, 'downloadAllZip'])->name('admin.certificates.download-all');
        Route::delete('/admin/certificates/{id}', [CertificateController::class, 'destroy'])->name('admin.certificates.destroy');

        // EVENT HISTORY & EXCEL ATTENDANCE IMPORT
        Route::get('/admin/event-history', [BimtekEventController::class, 'history'])->name('admin.event-history');
        Route::post('/admin/events/store-history', [BimtekEventController::class, 'storeHistoryEvent'])->name('admin.events.store-history');
        Route::post('/admin/events/{eventId}/import-attendance', [BimtekEventController::class, 'importAttendance'])->name('admin.events.import-attendance');
        Route::get('/admin/template/attendance-excel', [BimtekEventController::class, 'downloadAttendanceTemplate'])->name('admin.template.attendance-excel');

        // REAL-TIME DATA STREAMING FOR ADMIN DASHBOARD
        // Throttle: maks 60 req/menit/admin — polling 5s = 12/mnt, margin 5x
        Route::get('/admin/realtime-stream', [RealtimeController::class, 'stream'])->name('admin.realtime.stream');
        Route::get('/admin/realtime-poll', [RealtimeController::class, 'poll'])->middleware('throttle:60,1')->name('admin.realtime.poll');

        // REPORT CENTER & EDITABLE SEPARATE REPORTS
        Route::get('/admin/report-center', [ReportCenterController::class, 'index'])->name('admin.report-center');
        Route::get('/admin/reports/participants', [ReportCenterController::class, 'participantsReport'])->name('admin.reports.participants');
        Route::get('/admin/reports/speakers', [ReportCenterController::class, 'speakersReport'])->name('admin.reports.speakers');
        Route::get('/admin/reports/honorarium', [ReportCenterController::class, 'honorariumReport'])->name('admin.reports.honorarium');
        Route::get('/admin/reports/honorarium/excel', [ReportCenterController::class, 'exportHonorariumExcel'])->name('admin.reports.honorarium.excel');
        Route::post('/admin/reports/header-config', [ReportCenterController::class, 'updateReportHeader'])->name('admin.reports.header-config');
        Route::get('/admin/reports/attendance/excel', [ReportCenterController::class, 'exportAttendanceExcel'])->name('admin.reports.attendance.excel');
        Route::post('/admin/certificates/upload', [ReportCenterController::class, 'uploadCertificate'])->name('admin.certificates.upload');
        Route::put('/admin/templates/{id}', [ReportCenterController::class, 'updateTemplate'])->name('admin.templates.update');
    });
});
