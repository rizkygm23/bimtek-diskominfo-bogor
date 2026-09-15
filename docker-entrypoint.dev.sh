#!/bin/sh
# Entrypoint untuk development lokal (Docker Compose).
# Berbeda dari docker-entrypoint.sh (production Railway):
#   - Tidak cache config/route/view (supaya edit langsung efektif)
#   - Install composer & npm deps bila belum ada (fresh container)
#   - migrate (fresh + seed hanya jika flag dipasang via env)
set -e

cd /var/www/html

echo "==> Memastikan folder storage/framework ada..."
mkdir -p storage/app/public storage/framework/cache/data storage/framework/sessions storage/framework/views bootstrap/cache
chmod -R 775 storage bootstrap/cache

# Install PHP deps bila belum ada (container fresh / vendor belum di-mount).
if [ ! -f vendor/autoload.php ]; then
    echo "==> vendor/ belum ada — jalankan composer install..."
    composer install --no-interaction --optimize-autoloader
fi

# Install Node deps bila belum ada (container fresh).
# Cek biner vite, bukan sekadar foldernya — volume anonim Docker selalu
# membuat folder node_modules walau kosong, jadi cek -d bisa lolos palsu.
if [ ! -x node_modules/.bin/vite ]; then
    echo "==> node_modules/ belum terpasang — jalankan npm ci..."
    npm ci
fi

# Build frontend assets bila manifest belum ada (agar first load aman).
if [ ! -f public/build/manifest.json ] && [ ! -f public/build/assets/*.js ]; then
    echo "==> Build frontend assets (npm run build)..."
    npm run build || echo "WARNING: build gagal — lanjut tanpa build (jalankan manual bila perlu)."
fi

echo "==> storage:link..."
php artisan storage:link || true

echo "==> Migrate database..."
php artisan migrate --force

# Seed hanya bila users kosong (sama seperti entrypoint production).
USER_COUNT=$(php artisan tinker --execute="echo \App\Models\User::count();" 2>/dev/null || echo "ERR")
if [ -z "$USER_COUNT" ] || [ "$USER_COUNT" = "0" ]; then
    echo "==> Database kosong — seeding data awal..."
    php artisan db:seed --force || echo "WARNING: seed gagal (mungkin sudah parsial) — lanjut."
else
    echo "==> Database punya $USER_COUNT user — skip seed."
fi

echo "==> Clearing config cache (dev mode)..."
php artisan config:clear || true

echo "==> Starting php artisan serve on port 8080..."
exec php artisan serve --host=0.0.0.0 --port=8080
