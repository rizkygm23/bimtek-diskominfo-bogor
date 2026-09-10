#!/bin/sh
# Entrypoint for Railway Docker deployment.
# Runs at container boot, before php artisan serve.
# Order matters: migrate FIRST (creates tables), then safe-to-fail cache clears.
set -e

echo "==> Clearing config cache (non-fatal)..."
php artisan config:clear || true

echo "==> Running database migrations..."
php artisan migrate --force

# cache:clear touches the DB (CACHE_STORE=database). Only safe AFTER migrate.
echo "==> Clearing app cache (non-fatal)..."
php artisan cache:clear || true

# Seed only on first deploy — when users table is empty.
# Uses a raw count query (no tinker dependency) to avoid autoload/bootstrap edge cases.
USER_COUNT=$(php artisan tinker --execute="echo \App\Models\User::count();" 2>/dev/null || echo "ERR")
if [ -z "$USER_COUNT" ] || [ "$USER_COUNT" = "0" ]; then
    echo "==> Database empty — seeding initial data..."
    php artisan db:seed --force || echo "WARNING: seed failed (may already be partial) — continuing."
else
    echo "==> Database has $USER_COUNT users — skipping seed."
fi

echo "==> Caching config, routes, and views..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "==> Symlinking storage..."
php artisan storage:link || true

echo "==> Starting application server on port ${PORT:-8080}..."
exec php artisan serve --host=0.0.0.0 --port="${PORT:-8080}"
