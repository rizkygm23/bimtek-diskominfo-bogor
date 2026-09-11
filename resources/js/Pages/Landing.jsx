import React, { useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { 
  Monitor, 
  UserPlus, 
  QrCode, 
  BarChart3, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  Target, 
  FileText,
  Building2,
  FileEdit,
  Copy,
  Check,
  Menu,
  X
} from 'lucide-react';

import DiskominfoLogo from '../Components/DiskominfoLogo';

export default function Landing({ events }) {
  const [copiedId, setCopiedId] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { auth } = usePage().props;
  const isLoggedIn = !!auth?.user;

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      setMobileMenuOpen(false);
    }
  };

  const handleCopyLink = (eventId) => {
    const link = `${window.location.origin}/events/${eventId}/register`;
    navigator.clipboard.writeText(link);
    setCopiedId(eventId);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased selection:bg-blue-600 selection:text-white">
      <Head title="Platform Pelatihan Digital - Diskominfo Kabupaten Bogor" />

      {/* ==================== NAVBAR PUBLIC ==================== */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-xs py-3.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* BRANDING LOGO */}
          <Link href="/" className="flex items-center gap-3">
            <DiskominfoLogo variant="light-bg" />
          </Link>

          {/* CENTER NAVIGATION MENU (DESKTOP & TABLET) */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-extrabold text-slate-700">
            <button 
              onClick={() => scrollToSection('hero')} 
              className="hover:text-blue-900 transition-colors border-b-2 border-blue-900 pb-0.5 text-blue-900 cursor-pointer"
            >
              Beranda
            </button>
            <button 
              onClick={() => scrollToSection('about')} 
              className="hover:text-blue-900 transition-colors cursor-pointer"
            >
              Tentang Kami
            </button>
            <button 
              onClick={() => scrollToSection('katalog')} 
              className="hover:text-blue-900 transition-colors cursor-pointer"
            >
              Katalog
            </button>
            <button 
              onClick={() => scrollToSection('fitur')} 
              className="hover:text-blue-900 transition-colors cursor-pointer"
            >
              Tema Pelatihan
            </button>
          </nav>

          {/* RIGHT ACTION BUTTON & MOBILE BURGER */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-5 py-2 rounded-xl bg-[#3b49df] hover:bg-[#2f3ab7] text-white text-xs font-bold shadow-md transition-all active:scale-95 inline-block"
            >
              Masuk
            </Link>

            {/* MOBILE HAMBURGER MENU BUTTON */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl bg-slate-100 text-slate-800 border border-slate-200"
              aria-label="Buka Menu Navigasi HP"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>

        {/* MOBILE MENU DRAWER FOR PHONES (HP) */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 mt-3 pt-3 pb-2 space-y-2 text-xs font-extrabold text-slate-700 animate-in fade-in-50">
            <button 
              onClick={() => scrollToSection('hero')} 
              className="block w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 text-blue-900"
            >
              Beranda
            </button>
            <button 
              onClick={() => scrollToSection('about')} 
              className="block w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50"
            >
              Tentang Kami
            </button>
            <button 
              onClick={() => scrollToSection('katalog')} 
              className="block w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50"
            >
              Katalog Modul
            </button>
            <button 
              onClick={() => scrollToSection('fitur')} 
              className="block w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50"
            >
              Tema Pelatihan
            </button>
          </div>
        )}
      </header>

      {/* ==================== HERO SECTION ==================== */}
      <section id="hero" className="relative bg-[#1a2e7b] text-white overflow-hidden py-24 md:py-32 px-4 sm:px-6 lg:px-8">
        
        {/* CIRCULAR BACKGROUND GRAPHICS */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-blue-600/20 blur-2xl pointer-events-none"></div>
        <div className="absolute top-1/2 left-10 w-72 h-72 rounded-full bg-blue-400/10 blur-xl pointer-events-none"></div>
        <div className="absolute -bottom-20 right-1/3 w-80 h-80 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none"></div>

        <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10">
          
          <div className="inline-block px-4 py-1.5 rounded-full bg-blue-900/60 border border-blue-400/30 text-[11px] font-black tracking-widest text-blue-200 uppercase">
            PLATFORM PELATIHAN DIGITAL
          </div>

          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight text-white">
            Platform Pelatihan Digital<br />Diskominfo Bogor
          </h1>

          <p className="text-sm md:text-base text-blue-100 max-w-2xl mx-auto leading-relaxed font-medium">
            Akses katalog modul pelatihan, isi form data diri kegiatan BIMTEK, dan unduh sertifikat secara resmi.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => scrollToSection('katalog')}
              className="px-7 py-3 rounded-xl border-2 border-white/80 hover:border-white bg-transparent hover:bg-white/10 text-white font-extrabold text-xs transition-all"
            >
              Lihat Katalog
            </button>

            <Link
              href="/login"
              className="px-7 py-3 rounded-xl bg-white hover:bg-slate-100 text-[#1a2e7b] font-black text-xs shadow-lg transition-all active:scale-95"
            >
              Isi Form Data Diri
            </Link>
          </div>

        </div>
      </section>

      {/* ==================== KATALOG MODUL PELATIHAN TERBARU ==================== */}
      <section id="katalog" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-black text-blue-900 uppercase tracking-widest">KATALOG</span>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900">Modul Pelatihan Terbaru</h2>
            <p className="text-xs text-slate-500 font-medium">Pilih modul pelatihan dan klik tombol untuk mengisikan data diri peserta.</p>
          </div>

          <Link href="/events" className="text-xs font-extrabold text-slate-600 hover:text-blue-900 flex items-center gap-1">
            <span>Lihat Semua</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* CARDS GRID MATCHING USER SCREENSHOT */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {(events && events.length > 0 ? events : [
            { id: 1, title: 'Pelatihan Pengelolaan Portal Satu Data Kabupaten Bogor', start_date: '2026-08-15', location: 'Laboratorium Komputer Lt 2 Diskominfo Kab. Bogor', description: 'Pelatihan Integrasi Data Sektoral Perangkat Daerah ke Portal Resmi Satu Data Indonesia (SDI) Kabupaten Bogor.', quota: 40, registrations_count: 2 },
            { id: 2, title: 'BIMTEK Digital Government & Keamanan Siber SPBE 2026', start_date: '2026-08-07', location: 'Auditorium Gedung D Diskominfo Kab. Bogor', description: 'Bimbingan Teknis Peningkatan Kapasitas SDM Aparatur Pemerintah Kabupaten Bogor dalam Penerapan Arsitektur SPBE.', quota: 60, registrations_count: 2 },
            { id: 3, title: 'Keamanan Informasi & Proteksi Data Pribadi', start_date: '2026-09-10', location: 'Aula Diskominfo Kab. Bogor', description: 'Penguatan sistem keamanan siber dan perlindungan data pribadi sektor publik.', quota: 50, registrations_count: 5 },
          ]).map((ev) => (
            <div 
              key={ev.id}
              className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 group flex flex-col justify-between"
            >
              {/* TOP ROYAL BLUE BANNER WITH ICON */}
              <div className="bg-[#1a2e7b] h-44 flex items-center justify-center p-6 relative overflow-hidden group-hover:bg-[#223bb3] transition-colors">
                <Monitor className="w-12 h-12 text-blue-300 opacity-80 group-hover:scale-110 transition-transform" />
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md text-[10px] font-black uppercase bg-white/90 text-[#1a2e7b] shadow-xs">
                  STATUS: OPEN
                </div>
                <div className="absolute top-3 right-3 text-[11px] font-extrabold text-white bg-blue-900/80 px-2.5 py-1 rounded-md">
                  {ev.registrations_count || 2} / {ev.quota || 50} Kuota
                </div>
              </div>

              {/* CARD BODY */}
              <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <h3 className="font-extrabold text-sm text-slate-900 line-clamp-2 leading-snug group-hover:text-blue-900 transition-colors">
                    {ev.title}
                  </h3>
                  <div className="text-[11px] font-bold text-slate-400">
                    {ev.start_date} &bull; {ev.location}
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                    {ev.description}
                  </p>
                </div>

                {/* ACTION BUTTON: ISI FORM DATA DIRI */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <Link
                    href={`/events/${ev.id}/register`}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-xs transition-all"
                  >
                    <FileEdit className="w-3.5 h-3.5" />
                    <span>Isi Form Data Diri →</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleCopyLink(ev.id)}
                    className="w-full py-1.5 text-[10px] font-bold text-slate-500 hover:text-blue-900 flex items-center justify-center gap-1 bg-slate-50 border border-slate-200 rounded-lg transition-colors"
                  >
                    {copiedId === ev.id ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-700 font-extrabold">Link Form Disalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-slate-400" />
                        <span>Salin Link Form Admin</span>
                      </>
                    )}
                  </button>
                </div>

              </div>
            </div>
          ))}

        </div>

      </section>

      {/* ==================== FITUR UNGGULAN PLATFORM ==================== */}
      <section id="fitur" className="py-20 bg-slate-50 border-y border-slate-200/80 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <span className="text-[11px] font-black text-blue-900 uppercase tracking-widest">KEUNGGULAN</span>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900">Fitur Unggulan Platform</h2>
            <p className="text-xs text-slate-500 font-medium">Dirancang untuk memudahkan proses pelatihan dari awal hingga akhir.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-7 rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center">
                <Monitor className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-sm text-slate-900">Katalog Modul Digital</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Kumpulan materi pelatihan dalam format PDF dan PPT yang dapat diakses oleh seluruh peserta terdaftar.
              </p>
            </div>

            <div className="bg-white p-7 rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <UserPlus className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-sm text-slate-900">Pendaftaran & Form Data Diri</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Sistem pengisian data diri peserta yang efisien dengan tautan khusus yang dirancang oleh admin.
              </p>
            </div>

            <div className="bg-white p-7 rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-sm text-slate-900">Absensi QR Code</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Absensi kehadiran peserta dilakukan dengan scan QR Code unik per peserta pada Hari-H.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ==================== FOOTER (hidden saat user sudah login) ==================== */}
      {!isLoggedIn && (
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 py-10 px-4 sm:px-6 lg:px-8 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src="/images/logo_diskominfo_bogorkab.png"
              alt="Diskominfo"
              className="h-8 object-contain brightness-0 invert opacity-75"
            />
            <span>&copy; 2026 Dinas Komunikasi dan Informatika Kabupaten Bogor. All Rights Reserved.</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/login" className="hover:text-white transition-colors">Masuk</Link>
            <Link href="/register" className="hover:text-white transition-colors">Daftar</Link>
          </div>
        </div>
      </footer>
      )}

    </div>
  );
}
