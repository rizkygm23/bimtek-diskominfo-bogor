import React, { useState, useEffect } from 'react';
import { usePage, Link } from '@inertiajs/react';
import NavbarPublic from '../Components/NavbarPublic';
import Sidebar from '../Components/Sidebar';
import MobileTopBar from '../Components/MobileTopBar';
import MobileBottomNav from '../Components/MobileBottomNav';
import { Phone, Mail, MapPin, Clock, X, CheckCircle2, AlertCircle } from 'lucide-react';

// Flat SVG social icons (lucide 1.28 doesn't have Facebook/Twitter/Youtube/Instagram)
const FacebookIcon = (props) => (
  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" {...props}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const TwitterIcon = (props) => (
  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" {...props}>
    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
  </svg>
);

const YoutubeIcon = (props) => (
  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" {...props}>
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

const InstagramIcon = (props) => (
  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <circle cx="17.5" cy="6.5" r="1" />
  </svg>
);

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

        <div className="flex-1 lg:ml-64 flex flex-col min-h-[100dvh] pb-[4rem] lg:pb-0">
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
            <a href="https://facebook.com/diskominfo.bogorkab" target="_blank" rel="noreferrer" className="w-5 h-5 rounded-full bg-slate-800 hover:bg-blue-900 text-white flex items-center justify-center transition-colors" title="Facebook">
              <FacebookIcon />
            </a>
            <a href="https://x.com/diskominfo_bogor" target="_blank" rel="noreferrer" className="w-5 h-5 rounded-full bg-slate-800 hover:bg-blue-900 text-white flex items-center justify-center transition-colors" title="Twitter / X">
              <TwitterIcon />
            </a>
            <a href="https://youtube.com/@diskominfokabupatenbogor" target="_blank" rel="noreferrer" className="w-5 h-5 rounded-full bg-slate-800 hover:bg-blue-900 text-white flex items-center justify-center transition-colors" title="YouTube">
              <YoutubeIcon />
            </a>
            <a href="https://instagram.com/diskominfo.bogorkab" target="_blank" rel="noreferrer" className="w-5 h-5 rounded-full bg-slate-800 hover:bg-blue-900 text-white flex items-center justify-center transition-colors" title="Instagram">
              <InstagramIcon />
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
              <a href="https://facebook.com/diskominfo.bogorkab" target="_blank" rel="noreferrer" className="w-6 h-6 rounded-full bg-slate-700 hover:bg-blue-900 text-white flex items-center justify-center transition-colors" title="Facebook">
                <FacebookIcon />
              </a>
              <a href="https://x.com/diskominfo_bogor" target="_blank" rel="noreferrer" className="w-6 h-6 rounded-full bg-slate-700 hover:bg-blue-900 text-white flex items-center justify-center transition-colors" title="Twitter / X">
                <TwitterIcon />
              </a>
              <a href="https://youtube.com/@diskominfokabupatenbogor" target="_blank" rel="noreferrer" className="w-6 h-6 rounded-full bg-slate-700 hover:bg-blue-900 text-white flex items-center justify-center transition-colors" title="YouTube">
                <YoutubeIcon />
              </a>
              <a href="https://instagram.com/diskominfo.bogorkab" target="_blank" rel="noreferrer" className="w-6 h-6 rounded-full bg-slate-700 hover:bg-blue-900 text-white flex items-center justify-center transition-colors" title="Instagram">
                <InstagramIcon />
              </a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
