import React, { useState, useRef, useEffect } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { 
  Calendar, 
  Award, 
  ChevronDown, 
  LogOut, 
  Menu,
  X,
  CreditCard,
  Mic,
  Camera,
  User,
  LayoutDashboard
} from 'lucide-react';
import DiskominfoLogo from './DiskominfoLogo';

export default function NavbarSpeaker() {
  const { auth } = usePage().props;
  const user = auth?.user;
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const profileRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = (e) => {
    if (e) e.preventDefault();
    window.location.href = '/logout';
  };

  const handleQuickSwitch = (role) => {
    window.location.href = `/quick-switch/${role}`;
  };

  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';

  return (
    <header className="bg-white text-slate-900 border-b border-slate-200/90 shadow-xs transition-all font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* 1. LEFT: OFFICIAL LOGO + ROLE BADGE */}
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/dashboard" className="flex items-center gap-2 group">
              <DiskominfoLogo variant="light-bg" />
            </Link>
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-900 border border-purple-200">
              <Mic className="w-3 h-3 text-purple-700" />
              <span>Narasumber</span>
            </span>
          </div>

          {/* 2. CENTER: CLEAN SINGLE-LINE NAVIGATION MENU */}
          <nav className="hidden lg:flex items-center gap-1.5 font-bold text-xs">
            <Link
              href="/dashboard"
              className={`px-3 py-2 rounded-xl whitespace-nowrap flex items-center gap-1.5 transition-all ${
                currentPath === '/dashboard'
                  ? 'bg-blue-900 text-white font-black shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-blue-900'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Beranda</span>
            </Link>

            <Link
              href="/events"
              className={`px-3 py-2 rounded-xl whitespace-nowrap flex items-center gap-1.5 transition-all ${
                currentPath.startsWith('/events')
                  ? 'bg-blue-900 text-white font-black shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-blue-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Jadwal BIMTEK</span>
            </Link>

            <Link
              href="/attendance/scan"
              className={`px-3 py-2 rounded-xl whitespace-nowrap flex items-center gap-1.5 transition-all ${
                currentPath.startsWith('/attendance')
                  ? 'bg-blue-900 text-white font-black shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-blue-900'
              }`}
            >
              <Camera className="w-3.5 h-3.5 text-purple-600" />
              <span>Presensi Hari-H</span>
            </Link>

            <Link
              href="/my-certificates"
              className={`px-3 py-2 rounded-xl whitespace-nowrap flex items-center gap-1.5 transition-all ${
                currentPath.startsWith('/my-certificates')
                  ? 'bg-amber-400 text-blue-950 font-black ring-2 ring-amber-300 shadow-xs'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Sertifikat Narasumber</span>
            </Link>
          </nav>

          {/* 3. RIGHT: DEMO ROLE SWITCHER & USER PROFILE */}
          <div className="flex items-center gap-3 shrink-0">
            
            {/* Narasumber role indicator - no role switching */}

            {/* PROFILE BUTTON */}
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 p-1.5 pr-3 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-900 text-xs font-semibold transition-all shadow-xs cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-purple-700 text-white font-black flex items-center justify-center text-xs shadow-xs overflow-hidden shrink-0">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user?.name} className="w-full h-full object-cover" />
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                </div>
                <div className="hidden sm:block text-left leading-tight">
                  <strong className="block text-xs font-black text-slate-900 truncate max-w-[120px]">
                    {user?.name?.split(' ')[0] || 'Narasumber'}
                  </strong>
                  <span className="text-[9px] text-purple-700 font-extrabold uppercase">Pakar / Pemateri</span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white text-slate-900 border border-slate-200 rounded-2xl shadow-xl p-3 z-50 space-y-2 animate-in fade-in-50">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                    <strong className="block text-xs font-black text-slate-900 truncate">{user?.name}</strong>
                    <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
                    <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-purple-100 text-purple-800 mt-1">
                      Narasumber Terverifikasi
                    </span>
                  </div>

                  <Link 
                    href="/profile" 
                    onClick={() => setDropdownOpen(false)}
                    className="p-2.5 rounded-xl text-xs font-bold text-blue-900 bg-blue-50/70 hover:bg-blue-100 flex items-center gap-2 transition-colors"
                  >
                    <CreditCard className="w-4 h-4 text-emerald-600" />
                    <span>Rekening BJB & Honor Saya</span>
                  </Link>

                  <Link 
                    href="/my-certificates" 
                    onClick={() => setDropdownOpen(false)}
                    className="p-2.5 rounded-xl text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 flex items-center gap-2 transition-colors"
                  >
                    <Award className="w-4 h-4 text-amber-600" />
                    <span>Sertifikat Narasumber</span>
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="w-full text-left p-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-1.5 pt-2 border-t border-slate-100 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Keluar Akun (Logout)</span>
                  </button>
                </div>
              )}
            </div>

            {/* MOBILE HAMBURGER BUTTON */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-xl bg-slate-100 text-slate-800 border border-slate-200 hover:bg-slate-200 transition-colors"
              aria-label="Buka Menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

          </div>

        </div>
      </div>

      {/* MOBILE DRAWER */}
      {mobileOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 p-4 space-y-2 text-slate-900 shadow-xl font-medium text-xs">
          <div className="p-2 bg-purple-50 rounded-xl border border-purple-200 mb-3 text-center">
            <span className="text-[10px] font-black text-purple-800 uppercase">🎤 Masuk Sebagai: Narasumber / Pembicara</span>
          </div>

          <Link href="/dashboard" className="block px-3 py-2 rounded-xl hover:bg-slate-50 font-bold">🏠 Beranda</Link>
          <Link href="/events" className="block px-3 py-2 rounded-xl hover:bg-slate-50">📅 Jadwal BIMTEK</Link>
          <Link href="/attendance/scan" className="block px-3 py-2 rounded-xl hover:bg-slate-50">📷 Presensi Hari-H</Link>
          <Link href="/my-certificates" className="block px-3 py-2 rounded-xl hover:bg-slate-50">🏆 Sertifikat Narasumber</Link>
          <Link href="/profile" className="block px-3 py-2 rounded-xl hover:bg-slate-50 font-bold text-blue-900">👤 Profil & Rekening BJB</Link>

          <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-rose-600 bg-rose-50 border border-rose-200 mt-2 font-bold">
            <LogOut className="w-4 h-4" />
            <span>Keluar Akun (Logout)</span>
          </button>
        </div>
      )}
    </header>
  );
}
