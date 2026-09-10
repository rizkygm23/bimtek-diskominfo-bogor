# Entryppoint script for Railway Docker deployment.
# Runs at container boot, before php artisan serve.
# - Always migrates (idempotent — only applies pending migrations)
# - Seeds ONLY when DB is empty (first deploy) to avoid duplicate-key errors on redeploy
# - Caches config/routes/views with live runtime env (DB credentials present here)
# - Starts php artisan serve
#!/bin/sh
set -e

echo "==> Clearing stale caches..."
php artisan config:clear
php artisan cache:clear

echo "==> Running database migrations..."
php artisan migrate --force

# Seed only if users table is empty (first deploy).
# On subsequent deploys this is a no-op — prevents duplicate-seed errors.
if ! php artisan tinker --execute="echo \App\Models\User::count() > 0 ? 'HAS_USERS' : 'EMPTY';" 2>/dev/null | grep -q "HAS_USERS"; then
    echo "==> Database empty — seeding initial data..."
    php artisan db:seed --force
else
    echo "==> Database already has users — skipping seed."
fi

echo "==> Caching config, routes, and views..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "==> Symlinking storage..."
php artisan storage:link 2>/dev/null || true

echo "==> Starting application server on port ${PORT:-8080}..."
exec php artisan serve --host=0.0.0.0 --port="${PORT:-8080}"
