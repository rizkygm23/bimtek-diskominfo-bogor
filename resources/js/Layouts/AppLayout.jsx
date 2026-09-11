import React, { useState, useEffect } from 'react';
import { usePage, Link } from '@inertiajs/react';
import NavbarPublic from '../Components/NavbarPublic';
import Sidebar from '../Components/Sidebar';
import MobileTopBar from '../Components/MobileTopBar';
import MobileBottomNav from '../Components/MobileBottomNav';
import { Phone, Mail, MapPin, Clock, X, CheckCircle2, AlertCircle } from 'lucide-react';

export default function AppLayout({ children, title }) {
  const { auth, flash } = usePage().props;
  const currentUser = auth?.user;
  const [isScrolled, setIsScrolled] = useState(false);
  const [prayerSlide, setPrayerSlide] = useState(0);
  const [showFlash, setShowFlash] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // 5 Waktu Shalat Resmi Kabupaten Bogor
  const prayerSlides = [
    { name: "Subuh", time: "04:45", icon: "🌅" },
    { name: "Dzuhur", time: "12:05", icon: "☀️" },
    { name: "Ashar", time: "15:26", icon: "🌤️" },
    { name: "Maghrib", time: "18:12", icon: "🌆" },
    { name: "Isya", time: "19:23", icon: "🌙" }
  ];

  // Auto-advance prayer time slide
  useEffect(() => {
    const timer = setInterval(() => {
      setPrayerSlide((prev) => (prev + 1) % prayerSlides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [prayerSlides.length]);

  // Handle scroll state
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 25);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Reset flash visibility on flash update
  useEffect(() => {
    if (flash?.success || flash?.error) {
      setShowFlash(true);
      const timer = setTimeout(() => setShowFlash(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [flash]);

  // ───────────────────────────────────────────────────────────
  // FLASH (shared by both shells — flattened: shadow-sm rounded-lg)
  // Repositioned to content column top-4 right-4 (not viewport top-20).
  // ───────────────────────────────────────────────────────────
  const flashNode = showFlash && (flash?.success || flash?.error) ? (
    <div className="fixed top-4 right-4 z-50 max-w-md print:hidden">
      {flash?.success && (
        <div className="bg-emerald-800 text-white text-xs px-4 py-3 rounded-lg shadow-sm border border-emerald-600 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
            <span className="font-bold">{flash.success}</span>
          </div>
          <button onClick={() => setShowFlash(false)} className="text-emerald-200 hover:text-white font-bold p-1">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      {flash?.error && (
        <div className="bg-rose-800 text-white text-xs px-4 py-3 rounded-lg shadow-sm border border-rose-600 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-300 shrink-0" />
            <span className="font-bold">{flash.error}</span>
          </div>
          <button onClick={() => setShowFlash(false)} className="text-rose-200 hover:text-white font-bold p-1">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  ) : null;

  // ───────────────────────────────────────────────────────────
  // AUTH SHELL — sidebar + content column (no utility bar, no footer).
  // Sidebar is fixed lg+ (w-64/w-16) and a drawer on mobile.
  // ───────────────────────────────────────────────────────────
  if (currentUser) {
    return (
      <div className="min-h-[100dvh] flex bg-slate-50 text-slate-900 antialiased overflow-x-hidden w-full max-w-full">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex-1 lg:ml-64 flex flex-col min-h-[100dvh]">
          <MobileTopBar onMenuClick={() => setSidebarOpen(true)} />

          <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6 print:p-0 print:m-0 print:w-full print:max-w-none print:space-y-0">
            {children}
          </main>
        </div>

        {flashNode}

        {/* MobileBottomNav — only for authenticated users (quick-access) */}
        <MobileBottomNav />
      </div>
    );
  }

  // ───────────────────────────────────────────────────────────
  // PUBLIC SHELL — utility bar + NavbarPublic + main + footer (guest)
  // ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-[100dvh] flex flex-col font-sans bg-slate-50 text-slate-900 antialiased pb-16 lg:pb-0 overflow-x-hidden w-full max-w-full">

      {/* 1. TOP UTILITY BAR (E-GOVERNMENT DISKOMINFO BOGOR) */}
      <div className={`transition-all duration-300 overflow-hidden bg-slate-900 text-slate-300 border-b border-slate-800 sticky top-0 z-50 print:hidden ${
        isScrolled ? 'max-h-0 opacity-0 py-0 border-none pointer-events-none' : 'max-h-12 opacity-100 py-1.5'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between text-[11px] font-medium">

          {/* KONTAK DETAIL */}
          <div className="flex items-center gap-3.5 text-slate-400 whitespace-nowrap">
            <span className="flex items-center gap-1.5 hover:text-white transition-colors">
              <Phone className="w-3 h-3 text-amber-400 shrink-0" />
              <span>(021) 8758605</span>
            </span>
            <span className="text-slate-700">|</span>
            <span className="flex items-center gap-1.5 hover:text-white transition-colors">
              <Mail className="w-3 h-3 text-blue-400 shrink-0" />
              <span>diskominfo@bogorkab.go.id</span>
            </span>
          </div>

          {/* JADWAL SHALAT KABUPATEN BOGOR */}
          <div className="hidden lg:flex items-center gap-2 whitespace-nowrap">
            <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-slate-400">Jadwal Shalat Kab. Bogor:</span>

            <div className="relative h-5 w-44 overflow-hidden rounded-full bg-slate-800/90 border border-slate-700 px-2.5 flex items-center justify-center">
              {prayerSlides.map((slide, idx) => (
                <div
                  key={slide.name}
                  className={`absolute inset-0 flex items-center justify-center gap-1.5 transition-all duration-700 ease-in-out font-bold text-slate-200 text-[10px] ${
                    idx === prayerSlide
                      ? 'translate-x-0 opacity-100'
                      : idx < prayerSlide
                        ? '-translate-x-full opacity-0'
                        : 'translate-x-full opacity-0'
                  }`}
                >
                  <span>{slide.icon}</span>
                  <span>{slide.name}</span>
                  <span className="font-mono text-amber-400 font-extrabold">{slide.time} WIB</span>
                </div>
              ))}
            </div>
          </div>

          {/* SOCIAL MEDIA LINKS */}
          <div className="flex items-center gap-1.5 shrink-0">
            <a href="https://facebook.com/diskominfo.bogorkab" target="_blank" rel="noreferrer" className="w-5 h-5 rounded-full bg-slate-800 hover:bg-blue-600 text-white flex items-center justify-center text-[9px] font-black transition-colors" title="Facebook">
              f
            </a>
            <a href="https://x.com/diskominfo_bogor" target="_blank" rel="noreferrer" className="w-5 h-5 rounded-full bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center text-[9px] font-black transition-colors" title="Twitter / X">
              𝕏
            </a>
            <a href="https://youtube.com/@diskominfokabupatenbogor" target="_blank" rel="noreferrer" className="w-5 h-5 rounded-full bg-slate-800 hover:bg-rose-600 text-white flex items-center justify-center text-[9px] font-black transition-colors" title="YouTube">
              ▶
            </a>
            <a href="https://instagram.com/diskominfo.bogorkab" target="_blank" rel="noreferrer" className="w-5 h-5 rounded-full bg-slate-800 hover:bg-purple-600 text-white flex items-center justify-center text-[9px] font-black transition-colors" title="Instagram">
              📷
            </a>
          </div>

        </div>
      </div>

      {/* 2. PUBLIC NAVBAR (guest shell only) */}
      <div className="print:hidden">
        <NavbarPublic isScrolled={isScrolled} />
      </div>

      {flashNode}

      {/* 4. MAIN CONTENT CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8 print:p-0 print:m-0 print:w-full print:max-w-none print:space-y-0">
        {children}
      </main>

      {/* 5. OFFICIAL FOOTER — guest-only (auth users see no footer) */}
      <footer className="bg-[#0f2942] text-white border-t-4 border-blue-600 print:hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10 grid grid-cols-1 md:grid-cols-3 gap-8 text-xs">

          <div className="space-y-3">
            <h3 className="font-extrabold text-sm border-b border-blue-700 pb-2 text-amber-400">Kontak Detail</h3>
            <div className="space-y-2 text-slate-300">
              <p className="font-bold text-white">Alamat Kantor:</p>
              <p className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>Jalan Tegar Beriman, Cibinong, Kabupaten Bogor, Jawa Barat 16914</span>
              </p>

              <p className="font-bold text-white pt-2">Kontak Kami:</p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>(021) 8758605</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                <span>diskominfo@bogorkab.go.id</span>
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-extrabold text-sm border-b border-blue-700 pb-2 text-amber-400">Link Cepat / Navigasi</h3>
            <ul className="space-y-2 text-slate-300">
              <li><Link href="/events" className="hover:text-amber-400">Katalog Kegiatan BIMTEK</Link></li>
              <li><Link href="/attendance/scan" className="hover:text-amber-400">Presensi QR Code Hari-H</Link></li>
              <li><Link href="/admin/report-center" className="hover:text-amber-400">Pusat Laporan & Berita Acara</Link></li>
              <li><a href="https://diskominfo.bogorkab.go.id" target="_blank" rel="noreferrer" className="hover:text-amber-400">Portal Utama Bogorkab.go.id</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="font-extrabold text-sm border-b border-blue-700 pb-2 text-amber-400">Tentang SIM-BIMTEK</h3>
            <p className="text-slate-300 leading-relaxed">
              Sistem Informasi & Rekapitulasi Kegiatan Bimbingan Teknis (BIMTEK) merupakan aplikasi resmi Dinas Komunikasi dan Informatika Kabupaten Bogor untuk mengelola pendaftaran peserta, presensi QR Code, honorarium narasumber PPh 21, dan repository sertifikat digital.
            </p>
          </div>

        </div>

        <div className="bg-slate-950 text-slate-400 border-t border-slate-800 px-6 py-4">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <div>
              &copy; {new Date().getFullYear()} <span className="font-bold text-white">Dinas Komunikasi dan Informatika Pemerintah Kabupaten Bogor</span>. All Rights Reserved.
            </div>

            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">f</span>
              <span className="w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px] font-bold">𝕏</span>
              <span className="w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] font-bold">▶</span>
              <span className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px] font-bold">📷</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
