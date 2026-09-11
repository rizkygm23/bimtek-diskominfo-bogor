import React, { useState, useRef, useEffect } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { 
  LogOut, 
  ChevronDown, 
  Menu, 
  X,
  Award,
  User,
  LayoutDashboard,
  Calendar,
  Camera,
  History,
  ShieldCheck,
  CreditCard
} from 'lucide-react';
import DiskominfoLogo from './DiskominfoLogo';

export default function NavbarPublic() {
  const { auth } = usePage().props;
  const user = auth?.user;
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const profileRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
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
            {user && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                <span>Peserta</span>
              </span>
            )}
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
              <span>Katalog BIMTEK</span>
            </Link>

            {user && (
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
            )}

            <Link 
              href="/event-history" 
              className={`px-3 py-2 rounded-xl whitespace-nowrap flex items-center gap-1.5 transition-all ${
                currentPath.startsWith('/event-history') 
                  ? 'bg-blue-900 text-white font-black shadow-xs' 
                  : 'text-slate-700 hover:bg-slate-100 hover:text-blue-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Riwayat</span>
            </Link>

            {user && (
              <Link 
                href="/my-certificates" 
                className={`px-3 py-2 rounded-xl whitespace-nowrap flex items-center gap-1.5 transition-all ${
                  currentPath.startsWith('/my-certificates') 
                    ? 'bg-amber-400 text-blue-950 font-black ring-2 ring-amber-300 shadow-xs' 
                    : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200'
                }`}
              >
                <Award className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Sertifikat Saya</span>
              </Link>
            )}
          </nav>

          {/* 3. RIGHT: DEMO ROLE SWITCHER & USER ACTIONS */}
          <div className="flex items-center gap-3 shrink-0">
            
            {/* User role indicator only - no role switching for peserta */}

            {/* GUEST OR USER PROFILE */}
            {!user ? (
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 rounded-xl text-xs font-black bg-blue-900 text-white hover:bg-blue-950 shadow-xs transition-all"
                >
                  Daftar
                </Link>
              </div>
            ) : (
              <div className="relative" ref={profileRef}>
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 pr-3 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-900 text-xs font-semibold transition-all shadow-xs cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-xl bg-blue-900 text-white font-black flex items-center justify-center text-xs shadow-xs overflow-hidden shrink-0">
                    {user?.avatar ? (
                      <img src={user.avatar} alt={user?.name} className="w-full h-full object-cover" />
                    ) : (
                      <span>{user?.name?.charAt(0) || 'P'}</span>
                    )}
                  </div>
                  <div className="hidden sm:block text-left leading-tight">
                    <strong className="block text-xs font-black text-slate-900 truncate max-w-[120px]">
                      {user?.name?.split(' ')[0] || 'Peserta'}
                    </strong>
                    <span className="text-[9px] text-emerald-700 font-extrabold uppercase">Peserta BIMTEK</span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white text-slate-900 border border-slate-200 rounded-2xl shadow-xl p-3 z-50 space-y-2 animate-in fade-in-50">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                      <strong className="block text-xs font-black text-slate-900 truncate">{user?.name}</strong>
                      <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
                      <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-100 text-emerald-800 mt-1">
                        Peserta Aktif
                      </span>
                    </div>

                    <Link 
                      href="/profile" 
                      onClick={() => setUserDropdownOpen(false)}
                      className="p-2.5 rounded-xl text-xs font-bold text-blue-900 bg-blue-50/70 hover:bg-blue-100 flex items-center gap-2 transition-colors"
                    >
                      <User className="w-4 h-4 text-blue-800" />
                      <span>Profil & Rekening BJB Saya</span>
                    </Link>

                    <Link 
                      href="/my-certificates" 
                      onClick={() => setUserDropdownOpen(false)}
                      className="p-2.5 rounded-xl text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 flex items-center gap-2 transition-colors"
                    >
                      <Award className="w-4 h-4 text-amber-600" />
                      <span>Sertifikat Digital Saya</span>
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
            )}

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
        <div className="lg:hidden bg-white border-b border-slate-200 p-4 space-y-1 text-slate-900 shadow-sm font-medium text-xs">
          {user && (
            <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-200 mb-3 text-center">
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wide">Masuk Sebagai: Peserta BIMTEK</span>
            </div>
          )}

          {/* Flat drawer — lucide icons, no emoji. Section labels for grouping. */}
          <p className="px-3 pt-1 pb-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Utama</p>
          <Link href="/dashboard" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-50 font-bold text-slate-900">
            <LayoutDashboard className="w-4 h-4 text-slate-400" />
            <span>Beranda</span>
          </Link>
          <Link href="/events" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-700">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>Katalog BIMTEK</span>
          </Link>

          <p className="px-3 pt-2 pb-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Kegiatan</p>
          {user && <Link href="/attendance/scan" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-700">
            <Camera className="w-4 h-4 text-slate-400" />
            <span>Presensi Hari-H</span>
          </Link>}
          <Link href="/event-history" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-700">
            <History className="w-4 h-4 text-slate-400" />
            <span>Riwayat BIMTEK</span>
          </Link>
          {user && <Link href="/my-certificates" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-700">
            <Award className="w-4 h-4 text-slate-400" />
            <span>Sertifikat Saya</span>
          </Link>}

          <p className="px-3 pt-2 pb-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Akun</p>
          {user && <Link href="/profile" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-50 font-bold text-blue-900">
            <User className="w-4 h-4 text-slate-400" />
            <span>Profil & Rekening BJB</span>
          </Link>}

          {user && (
            <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-rose-600 bg-rose-50 border border-rose-200 mt-2 font-bold">
              <LogOut className="w-4 h-4" />
              <span>Keluar Akun (Logout)</span>
            </button>
          )}
        </div>
      )}
    </header>
  );
}
