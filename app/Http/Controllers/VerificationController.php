<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\ParticipantProfile;
use App\Models\SpeakerProfile;
use App\Models\BimtekEvent;
use App\Models\ActivityLog;

class VerificationController extends Controller
{
    public function index(Request $request)
    {
        $role = $request->query('role', 'peserta'); // 'peserta' or 'pembicara'
        $status = $request->query('status', 'all');
        $search = $request->query('search', '');
        $eventId = $request->query('event_id');

        // Light list for searchable event filter (id + title + date only)
        $events = BimtekEvent::query()
            ->orderBy('start_date', 'desc')
            ->get(['id', 'title', 'start_date', 'end_date', 'status', 'location']);

        if ($role === 'peserta') {
            $query = ParticipantProfile::with('user');
            if ($status !== 'all') {
                $query->where('verification_status', $status);
            }
            if ($eventId) {
                $query->whereHas('user.registrations', function ($q) use ($eventId) {
                    $q->where('bimtek_event_id', $eventId);
                });
            }
            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->whereHas('user', function ($uq) use ($search) {
                        $uq->where('name', 'like', "%{$search}%")
                           ->orWhere('email', 'like', "%{$search}%")
                           ->orWhere('instansi', 'like', "%{$search}%");
                    })
                    ->orWhere('nik', 'like', "%{$search}%")
                    ->orWhere('npwp', 'like', "%{$search}%")
                    ->orWhere('instansi', 'like', "%{$search}%");
                });
            }
            $profiles = $query->latest()->paginate(15)->withQueryString();
        } else {
            $query = SpeakerProfile::with('user');
            if ($status !== 'all') {
                $query->where('verification_status', $status);
            }
            if ($eventId) {
                // SpeakerProfile → User → Speaker → EventSpeaker
                $query->whereHas('user.speakerProfile.eventAssignments', function ($q) use ($eventId) {
                    $q->where('bimtek_event_id', $eventId);
                });
            }
            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->whereHas('user', function ($uq) use ($search) {
                        $uq->where('name', 'like', "%{$search}%")
                           ->orWhere('email', 'like', "%{$search}%")
                           ->orWhere('instansi', 'like', "%{$search}%");
                    })
                    ->orWhere('nip_nik', 'like', "%{$search}%")
                    ->orWhere('npwp', 'like', "%{$search}%")
                    ->orWhere('instansi', 'like', "%{$search}%");
                });
            }
            $profiles = $query->latest()->paginate(15)->withQueryString();
        }

        return Inertia::render('Admin/Verification/Index', [
            'profiles' => $profiles,
            'events' => $events,
            'filters' => [
                'role' => $role,
                'status' => $status,
                'search' => $search,
                'event_id' => $eventId ? (string) $eventId : '',
            ],
        ]);
    }

    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'role' => 'required|in:peserta,pembicara',
            'verification_status' => 'required|in:belum_diverifikasi,terverifikasi,perlu_perbaikan',
            'verification_notes' => 'nullable|string|max:1000',
        ]);

        if ($request->role === 'peserta') {
            $profile = ParticipantProfile::findOrFail($id);
        } else {
            $profile = SpeakerProfile::findOrFail($id);
        }

        $profile->update([
            'verification_status' => $request->verification_status,
            'verification_notes' => $request->verification_notes,
        ]);

        ActivityLog::create([
            'user_id' => auth()->id(),
            'action' => 'UPDATE_VERIFICATION',
            'module' => 'Verifikasi Profil',
            'description' => "Memperbarui status verifikasi data {$request->role} (ID: {$id}) menjadi {$request->verification_status}.",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return back()->with('success', 'Status verifikasi data administrasi berhasil diperbarui.');
    }
}
