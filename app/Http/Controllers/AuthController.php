<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Speaker;
use App\Models\ParticipantProfile;
use App\Models\SpeakerProfile;
use App\Rules\ValidIndonesianNIK;
use Inertia\Inertia;

class AuthController extends Controller
{
    public function showLogin()
    {
        return Inertia::render('Auth/Login');
    }

    public function login(Request $request)
    {
        $loginInput = trim($request->input('email', ''));
        $password = $request->input('password', '');

        $request->validate([
            'email' => 'required|string',
            'password' => 'required|string',
        ]);

        $cleanInput = str_replace([' ', '-', '.', '/'], '', $loginInput);

        // Find user by exact email, exact nip_nik, or normalized nip_nik
        $user = User::where('email', $loginInput)
            ->orWhere('nip_nik', $loginInput)
            ->orWhere('nip_nik', $cleanInput)
            ->orWhereRaw("REPLACE(REPLACE(REPLACE(nip_nik, ' ', ''), '-', ''), '.', '') = ?", [$cleanInput])
            ->first();

        if ($user && Hash::check($password, $user->password)) {
            Auth::login($user, $request->boolean('remember', true));
            if ($request->hasSession()) {
                $request->session()->regenerate();
            }

            if ($user->role === 'admin') {
                return redirect()->intended('/dashboard')->with('success', 'Selamat Datang, Administrator Diskominfo!');
            } elseif ($user->role === 'pembicara') {
                return redirect()->intended('/dashboard')->with('success', 'Selamat Datang, Narasumber / Pembicara!');
            } else {
                return redirect()->intended('/dashboard')->with('success', 'Selamat Datang, Peserta BIMTEK!');
            }
        }

        return back()->withErrors([
            'email' => 'Email / NIP atau Password yang Anda masukkan tidak sesuai.',
        ])->onlyInput('email');
    }

    public function showRegister()
    {
        return Inertia::render('Auth/RegisterChoice');
    }

    public function showRegisterPeserta()
    {
        return Inertia::render('Auth/RegisterPeserta');
    }

    public function registerPeserta(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6|confirmed',
            'nip_nik' => ['nullable', 'string', 'size:16', new ValidIndonesianNIK],
            'instansi' => 'nullable|string|max:255',
            'jabatan' => 'nullable|string|max:255',
            'no_hp' => ['nullable', 'string', 'max:20', 'regex:/^08[0-9]{7,12}$/'],
            'alamat' => 'nullable|string|max:500',
        ], [
            'nip_nik.size' => 'NIK harus terdiri dari 16 digit.',
            'no_hp.regex' => 'Nomor HP harus format Indonesia (08xxxxxxxxxx).',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => 'user',
            'nip_nik' => $validated['nip_nik'] ?? '3201' . rand(1000000000, 9999999999),
            'instansi' => $validated['instansi'] ?? 'Umum / Instansi Terkait',
            'jabatan' => $validated['jabatan'] ?? 'Peserta BIMTEK',
            'no_hp' => $validated['no_hp'] ?? '-',
        ]);

        ParticipantProfile::create([
            'user_id' => $user->id,
            'nik' => $user->nip_nik,
            'instansi' => $user->instansi,
            'no_hp' => $user->no_hp,
            'verification_status' => 'terverifikasi',
        ]);

        Auth::login($user);

        return redirect('/dashboard')->with('success', 'Akun Peserta berhasil didaftarkan!');
    }

    public function showRegisterPembicara()
    {
        return Inertia::render('Auth/RegisterPembicara');
    }

    public function registerPembicara(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'nip_nik' => ['required', 'string', 'max:20', 'regex:/^[0-9]{16,18}$/', 'unique:users,nip_nik'],
            'password' => 'required|string|min:6|confirmed',
        ], [
            'name.required' => 'Nama Pembicara wajib diisi.',
            'nip_nik.required' => 'NIP / NIK KTP wajib diisi.',
            'nip_nik.regex' => 'NIP/NIK harus 16-18 digit angka.',
            'nip_nik.unique' => 'NIP / NIK KTP ini sudah terdaftar sebagai akun.',
            'password.required' => 'Password wajib diisi.',
            'password.min' => 'Password minimal 6 karakter.',
            'password.confirmed' => 'Konfirmasi password tidak sesuai.',
        ]);

        $cleanNik = preg_replace('/[^a-zA-Z0-9]/', '', $validated['nip_nik']);
        $autoEmail = $cleanNik . '@narasumber.bogorkab.go.id';

        // Check if email already exists, if so add random suffix
        if (User::where('email', $autoEmail)->exists()) {
            $autoEmail = $cleanNik . '_' . rand(100, 999) . '@narasumber.bogorkab.go.id';
        }

        $user = User::create([
            'name' => $validated['name'],
            'email' => $autoEmail,
            'password' => Hash::make($validated['password']),
            'role' => 'pembicara',
            'nip_nik' => $validated['nip_nik'],
            'instansi' => 'Narasumber / Pakar',
            'jabatan' => 'Pakar / Narasumber',
            'no_hp' => '-',
        ]);

        SpeakerProfile::create([
            'user_id' => $user->id,
            'nip_nik' => $user->nip_nik,
            'instansi' => $user->instansi,
            'jabatan' => $user->jabatan,
            'golongan' => 'Golongan IV',
            'verification_status' => 'belum_diverifikasi',
        ]);

        Speaker::create([
            'user_id' => $user->id,
            'name' => $user->name,
            'nip_nik' => $user->nip_nik,
            'instansi' => $user->instansi,
            'golongan' => 'Golongan IV',
            'email' => $user->email,
            'no_hp' => $user->no_hp,
        ]);

        Auth::login($user);

        return redirect('/dashboard')->with('success', 'Akun Narasumber berhasil didaftarkan! Silakan pilih kegiatan BIMTEK untuk melengkapi berkas administrasi.');
    }

    public function quickSwitch($role)
    {
        // Only admin users can switch roles (for testing purposes)
        if (auth()->user() && auth()->user()->role !== 'admin') {
            return redirect('/dashboard')->with('error', 'Akses ditolak. Hanya Administrator yang dapat berpindah peran.');
        }

        $user = User::where('role', $role)->first();

        if (! $user) {
            $user = User::create([
                'name' => ucfirst($role) . ' Diskominfo',
                'email' => $role . '@bogorkab.go.id',
                'password' => Hash::make('password'),
                'role' => $role,
                'nip_nik' => '198501012010011001',
                'instansi' => 'Diskominfo Kab. Bogor',
                'jabatan' => 'Aparatur Kedinasan',
                'no_hp' => '081234567890',
            ]);
        }

        Auth::login($user);

        return redirect('/dashboard')->with('success', "Switched to {$role} account demo.");
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/login')->with('success', 'Anda telah berhasil keluar dari akun.');
    }
}
