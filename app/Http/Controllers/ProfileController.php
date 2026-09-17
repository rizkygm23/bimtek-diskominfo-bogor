<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use App\Models\EventRegistration;
use App\Models\EventSpeaker;
use App\Models\BimtekEvent;
use App\Models\ParticipantProfile;
use App\Models\SpeakerProfile;

class ProfileController extends Controller
{
    public function edit(Request $request)
    {
        $user = $request->user();

        $participantProfile = ParticipantProfile::where('user_id', $user->id)->first();
        $speakerProfileDetail = SpeakerProfile::where('user_id', $user->id)->first();

        $stats = [
            'total_registrations' => EventRegistration::where('user_id', $user->id)->count(),
            'total_attended' => EventRegistration::where('user_id', $user->id)->whereHas('attendances')->count(),
            'total_speaking_sessions' => 0,
            'total_events_managed' => 0,
        ];

        if ($user->role === 'admin') {
            $stats['total_events_managed'] = BimtekEvent::count();
        }

        return Inertia::render('Profile/Edit', [
            'user' => $user->load(['participantProfile', 'speakerProfileDetail']),
            'participantProfile' => $participantProfile,
            'speakerProfileDetail' => $speakerProfileDetail,
            'stats' => $stats,
        ]);
    }

    public function update(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email,' . $user->id,
            'instansi' => 'nullable|string|max:255',
            'jabatan' => 'nullable|string|max:255',
            'no_hp' => 'nullable|string|max:255',
            'current_password' => 'nullable|required_with:new_password|string',
            'new_password' => 'nullable|string|min:6',

            // Sensitive Admin Profile Fields
            'nik' => 'nullable|string|max:50',
            'npwp' => 'nullable|string|max:50',
            'bank_name' => 'nullable|string|max:100',
            'account_number' => 'nullable|string|max:100',
            'account_name' => 'nullable|string|max:255',
            'golongan' => 'nullable|string|max:50',

            // Files
            'foto_ktp' => 'nullable|file|mimes:jpeg,png,jpg,pdf|max:5120',
            'foto_npwp' => 'nullable|file|mimes:jpeg,png,jpg,pdf|max:5120',
        ]);

        if (!empty($validated['new_password'])) {
            if (!Hash::check($validated['current_password'], $user->password)) {
                return back()->withErrors(['current_password' => 'Password lama Anda tidak cocok!']);
            }
            $user->password = Hash::make($validated['new_password']);
        }

        $user->name = $validated['name'];
        $user->email = $validated['email'];
        $user->instansi = $validated['instansi'] ?? $user->instansi;
        $user->jabatan = $validated['jabatan'] ?? $user->jabatan;
        $user->no_hp = $validated['no_hp'] ?? $user->no_hp;
        $user->save();

        // Handle private document uploads (stored in storage/app/private/documents/)
        $ktpPath = null;
        $npwpPath = null;

        if ($request->hasFile('foto_ktp')) {
            $ktpPath = $request->file('foto_ktp')->store("documents/{$user->id}", 'local');
        }
        if ($request->hasFile('foto_npwp')) {
            $npwpPath = $request->file('foto_npwp')->store("documents/{$user->id}", 'local');
        }

        if ($user->role === 'pembicara') {
            $profile = SpeakerProfile::firstOrCreate(['user_id' => $user->id]);
            $wasNeedsFix = $profile->verification_status === 'perlu_perbaikan';
            $profile->update([
                'nip_nik' => $validated['nik'] ?? $profile->nip_nik,
                'npwp' => $validated['npwp'] ?? $profile->npwp,
                'bank_name' => $validated['bank_name'] ?? $profile->bank_name,
                'account_number' => $validated['account_number'] ?? $profile->account_number,
                'account_name' => $validated['account_name'] ?? $profile->account_name,
                'instansi' => $user->instansi,
                'jabatan' => $user->jabatan,
                'golongan' => $validated['golongan'] ?? $profile->golongan,
                'foto_ktp_path' => $ktpPath ?? $profile->foto_ktp_path,
                'foto_npwp_path' => $npwpPath ?? $profile->foto_npwp_path,
            ]);
            // Setelah user perbaiki berkas, antre ulang ke admin
            if ($wasNeedsFix || $ktpPath || $npwpPath) {
                $profile->update([
                    'verification_status' => 'belum_diverifikasi',
                    'verification_notes' => $wasNeedsFix
                        ? 'Berkas diperbarui pengguna — menunggu review ulang admin.'
                        : $profile->verification_notes,
                ]);
            }
        } else {
            $profile = ParticipantProfile::firstOrCreate(['user_id' => $user->id]);
            $wasNeedsFix = $profile->verification_status === 'perlu_perbaikan';
            $profile->update([
                'nik' => $validated['nik'] ?? $profile->nik,
                'npwp' => $validated['npwp'] ?? $profile->npwp,
                'bank_name' => $validated['bank_name'] ?? $profile->bank_name,
                'account_number' => $validated['account_number'] ?? $profile->account_number,
                'account_name' => $validated['account_name'] ?? $profile->account_name,
                'instansi' => $user->instansi,
                'no_hp' => $user->no_hp,
                'foto_ktp_path' => $ktpPath ?? $profile->foto_ktp_path,
                'foto_npwp_path' => $npwpPath ?? $profile->foto_npwp_path,
            ]);
            if ($wasNeedsFix || $ktpPath || $npwpPath) {
                $profile->update([
                    'verification_status' => 'belum_diverifikasi',
                    'verification_notes' => $wasNeedsFix
                        ? 'Berkas diperbarui pengguna — menunggu review ulang admin.'
                        : $profile->verification_notes,
                ]);
            }
        }

        return back()->with('success', 'Profil dan data administrasi Anda berhasil diperbarui!');
    }

    public function updateAvatar(Request $request)
    {
        $request->validate([
            'avatar' => 'required|image|mimes:jpeg,png,jpg,gif,svg,webp|max:5120',
        ]);

        $user = $request->user();

        if ($request->hasFile('avatar')) {
            $file = $request->file('avatar');
            $filename = 'avatar_' . $user->id . '_' . time() . '.' . $file->getClientOriginalExtension();

            $path = $file->storeAs('avatars', $filename, 'public');
            $avatarUrl = '/storage/' . $path;

            if ($user->avatar && str_contains($user->avatar, '/storage/avatars/')) {
                $oldPath = str_replace('/storage/', '', $user->avatar);
                Storage::disk('public')->delete($oldPath);
            }

            $user->avatar = $avatarUrl;
            $user->save();
        }

        return back()->with('success', 'Foto profil Anda berhasil diperbarui!');
    }
}
