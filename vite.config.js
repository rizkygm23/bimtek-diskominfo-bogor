import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.jsx'],
            refresh: true,
        }),
        react(),
    ],
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    // Core React runtime — di-cache terpisah, jarang berubah
                    'vendor-react': ['react', 'react-dom', '@inertiajs/react'],
                    // Icon library besar — pisah agar halaman non-icon tidak bawa beban ini
                    'vendor-lucide': ['lucide-react'],
                    // QR generator (proyektor admin) — hanya dipakai di 1 halaman
                    'vendor-qr-gen': ['qrcode.react'],
                    // axios — tipis tapi shared, pisahkan agar tidak masuk chunk app utama
                    'vendor-axios': ['axios'],
                },
            },
        },
    },
});
