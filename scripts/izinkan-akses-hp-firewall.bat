@echo off
TITLE Buka Port 8000 Windows Firewall untuk Akses HP
color 0B

echo ======================================================================
echo       MEMBUKA PORT 8000 WINDOWS FIREWALL (AKSES DARI HP)
echo ======================================================================
echo.
echo Pastikan file ini dijalankan dengan cara:
echo KLIK KANAN --^> "RUN AS ADMINISTRATOR"
echo.

netsh advfirewall firewall add rule name="SIM-BIMTEK Port 8000" dir=in action=allow protocol=TCP localport=8000 profile=any

echo.
if %errorlevel% equ 0 (
    color 0A
    echo [BERHASIL] Port 8000 sekarang sudah diizinkan oleh Windows Firewall.
    echo Sekarang HP Anda sudah bisa membuka sistem di Wi-Fi yang sama!
) else (
    color 0C
    echo [PERHATIAN] Gagal menambahkan firewall rule.
    echo Pastikan Anda mengklik kanan file ini lalu pilih "Run as Administrator".
)

echo.
echo ======================================================================
pause
