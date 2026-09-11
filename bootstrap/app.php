<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        // Health check untuk Railway liveness probe. Laravel default /up hanya
        // mengembalikan {"status":"ok"} tanpa info sensitif (tidak bocor DB
        // state). Dipertahankan publik karena Railway butuh probe anonymous.
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \App\Http\Middleware\SecurityHeaders::class,
        ]);

        // Railway terminates TLS at its proxy and forwards to our container on http:8080.
        // Trust the proxy so Laravel reads X-Forwarded-Proto and generates https:// asset
        // URLs (Vite @vite() directive, asset(), secure redirects/cookies). Without this,
        // assets emit as http:// on an https page -> mixed-content block -> blank screen.
        $middleware->trustProxies(
            at: '*',
            headers: Request::HEADER_X_FORWARDED_FOR |
                Request::HEADER_X_FORWARDED_HOST |
                Request::HEADER_X_FORWARDED_PORT |
                Request::HEADER_X_FORWARDED_PROTO |
                Request::HEADER_X_FORWARDED_AWS_ELB,
        );
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
