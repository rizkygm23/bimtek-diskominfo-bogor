@echo off
TITLE SIM-BIMTEK Diskominfo Kab. Bogor - Server Lokal & HP
color 0A

echo ======================================================================
echo       SISTEM INFORMASI BIMBINGAN TEKNIS (SIM-BIMTEK)
echo          DINAS KOMUNIKASI DAN INFORMATIKA KAB. BOGOR
echo ======================================================================
echo.
echo Sedang menyiapkan server multi-worker (Anti Lag)...
echo.

cd /d "%~dp0"

:: Set multi-worker PHP agar tidak lag saat diakses bersamaan
set PHP_CLI_SERVER_WORKERS=4

:: Pastikan storage link tersedia
if not exist "public\storage" (
    php artisan storage:link >nul 2>&1
)

echo.
echo ======================================================================
echo                    STATUS SERVER & ALAMAT AKSES
echo ======================================================================
echo.
echo [1] AKSES DARI LAPTOP INI:
echo     --^> http://127.0.0.1:8000  atau  http://localhost:8000
echo.
echo [2] AKSES DARI HP / PERANGKAT LAIN (Wi-Fi Yang Sama):
echo     Silakan buka browser di HP Anda dan ketik salah satu alamat berikut:
echo.
powershell -Command "Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notlike '*Loopback*' -and $_.IPAddress -notlike '169.254*' } | ForEach-Object { Write-Host ('     --> http://' + $_.IPAddress + ':8000 (' + $_.InterfaceAlias + ')') -ForegroundColor Yellow }"
echo.
echo ======================================================================
echo AKUN PENGUJIAN:
echo - Admin: admin@bogorkab.go.id (Password: password)
echo - Peserta: peserta@bogorkab.go.id (Password: password)
echo - Pembicara: pembicara@bogorkab.go.id (Password: password)
echo ======================================================================
echo.
echo JANGAN TUTUP JENDELA INI SELAMA APLIKASI DIGUNAKAN.
echo Tekan CTRL + C untuk mematikan server.
echo ======================================================================
echo.

:: Buka browser otomatis di laptop
start http://127.0.0.1:8000

:: Jalankan server PHP pada port 8000 untuk semua interface jaringan
php -S 0.0.0.0:8000 -t public
pause
