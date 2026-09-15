<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

class AdminMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        if (auth()->user()?->role !== 'admin') {
            // AJAX/Inertia (polling realtime dsb.): 403 JSON — redirect 302 diikuti
            // axios membuat flash "Akses Ditolak" muncul telat di halaman berikutnya.
            if ($request->ajax() || $request->wantsJson() || $request->hasHeader('X-Inertia')) {
                return response()->json([
                    'message' => 'Akses Ditolak: Halaman ini hanya dapat diakses oleh Administrator Diskominfo.',
                ], 403);
            }

            return redirect('/dashboard')->with('error', 'Akses Ditolak: Halaman ini hanya dapat diakses oleh Administrator Diskominfo.');
        }

        return $next($request);
    }
}
