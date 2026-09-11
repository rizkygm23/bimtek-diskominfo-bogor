<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * SecurityHeaders — tambahkan HTTP security headers + strip fingerprint.
 *
 * Menangani finding F6 (fingerprinting x-powered-by/server bocor) dan
 * F7 (security headers kosong) dari bug bounty report.
 *
 * Header yang dipasang:
 *  - X-Frame-Options: DENY          → anti clickjacking (login form)
 *  - X-Content-Type-Options: nosniff → anti MIME sniffing
 *  - Referrer-Policy: strict-origin-when-cross-origin
 *  - Permissions-Policy: minimal    → batasi kamera/mikrofon/geolokasi
 *  - Strict-Transport-Security       → HSTS (Railway TLS, hanya di https)
 *  - Content-Security-Policy         → whitelist sumber script/style/img
 *
 * Plus hapus header fingerprint:
 *  - X-Powered-By
 *
 * Catatan: CSP sengaja longgar untuk Inertia (script-src 'self' 'unsafe-inline'
 * karena Vite inject inline), tapi tetap blokir eksternal domain tak tepercaya.
 * Pembaruan di bootstrap/app.php mendaftarkan middleware ini ke stack web.
 */
class SecurityHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Strip fingerprint headers (F6).
        $response->headers->remove('X-Powered-By');

        // Anti clickjacking (F7).
        $response->headers->set('X-Frame-Options', 'DENY');

        // Anti MIME sniffing.
        $response->headers->set('X-Content-Type-Options', 'nosniff');

        // Referrer policy.
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');

        // Permissions policy — matikan API sensitif browser by default.
        // CATATAN: camera TIDAK dimatikan. Modul Presensi Hari-H (/attendance/scan)
        // wajib pakai kamera untuk scan QR Code resmi. Mematikan camera=() di sini
        // akan ditolak browser → html5-qrcode gagal start → "Izin kamera ditolak".
        // Kamera tetap aman: tetap butuh secure context (HTTPS Railway) + prompt
        // izin user per-origin. Yang dimatikan hanya API yang tidak dipakai app.
        $response->headers->set(
            'Permissions-Policy',
            'microphone=(), geolocation=(), payment=()'
        );

        // HSTS — hanya kirim lewat https (Railway terminates TLS di proxy).
        if ($request->isSecure()) {
            $response->headers->set(
                'Strict-Transport-Security',
                'max-age=31536000; includeSubDomains'
            );
        }

        // Content-Security-Policy.
        // Vite dev/inertia inject inline script + style — 'unsafe-inline' diperlukan
        // untuk Inertia hydration script. Script eksternal hanya dari 'self'.
        // img-src 'self' data: untuk avatar/data-uri QR. connect-src 'self'
        // untuk Inertia router + wss bila realtime dipakai.
        $csp = implode('; ', [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com data:",
            "img-src 'self' data: https:",
            "connect-src 'self' wss: ws:",
            "frame-ancestors 'none'",
            "form-action 'self'",
            "base-uri 'self'",
            "object-src 'none'",
        ]);
        $response->headers->set('Content-Security-Policy', $csp);

        return $response;
    }
}
