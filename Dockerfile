# Laravel 11 + Inertia.js + React production image
# Used by Railway's Docker (Railpack) builder.
FROM php:8.2-cli

WORKDIR /var/www/html

# Install PHP extensions required by Laravel + this app (pdo_mysql, gd, zip, etc.)
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    libsqlite3-dev \
    libzip-dev \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    libonig-dev \
    libxml2-dev \
    curl \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install pdo pdo_mysql pdo_sqlite zip gd mbstring xml bcmath \
    && rm -rf /var/lib/apt/lists/*

# Install Node 20 for the Vite build step
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Copy application source
COPY . .

# F2 (SECURITY_CHECK.md): limit upload PHP harus >= batas validasi aplikasi
# (KTP 5MB, materi 20MB, ZIP sertifikat 100MB) — default php:8.2 hanya 2M.
RUN printf "upload_max_filesize=110M\npost_max_size=120M\nmax_execution_time=120\n" \
    > /usr/local/etc/php/conf.d/zz-uploads.ini

# Install PHP deps (no-dev, optimized for production)
RUN composer install --no-dev --optimize-autoloader --no-interaction

# Build frontend assets with Vite
RUN npm ci && npm run build

# Ensure storage & bootstrap/cache are writable by the runtime user.
# Railway runs containers as non-root by default where possible; 775 is permissive enough.
RUN mkdir -p storage/app/public storage/framework/cache storage/framework/sessions storage/framework/views bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

# Entrypoint script that runs migrations + conditional seeding at boot.
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 8080

# Railway injects $PORT. The entrypoint migrates, seeds, caches, then serves.
CMD ["/usr/local/bin/docker-entrypoint.sh"]
