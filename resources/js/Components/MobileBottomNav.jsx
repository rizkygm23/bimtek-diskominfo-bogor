import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
  Home,
  BookOpen,
  QrCode,
  Award,
  History,
  User
} from 'lucide-react';

/**
 * MobileBottomNav — quick-access bottom nav for authenticated users (lg- only).
 *
 * Changes from the old version:
 *  - Active detection uses usePage().url (Inertia-safe) instead of window.location.
 *  - QR FAB gradient removed → flat bg-blue-900.
 *  - Heavy shadow removed → flat border-t border-slate-200.
 *  - Conditional render lives in AppLayout (only mounts for currentUser),
 *    so this component can assume an authenticated user.
 */
export default function MobileBottomNav() {
  const page = usePage();
  const { auth } = page.props;
  const user = auth?.user;
  const isAdmin = user?.role === 'admin';
  const current = (page.url || '').split('?')[0];

  const isActive = (href, prefix = false) =>
    prefix ? current.startsWith(href) : current === href;

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 px-3 py-1.5 flex items-center justify-around font-sans pb-safe print:hidden">

      {/* BERANDA */}
      <Link
        href="/dashboard"
        className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg transition-colors ${
          isActive('/dashboard', true) || isActive('/')
            ? 'text-blue-900 font-bold'
            : 'text-slate-500 hover:text-slate-900 font-medium'
        }`}
      >
        <Home className={`w-5 h-5 ${isActive('/dashboard', true) || isActive('/') ? 'text-blue-900' : 'text-slate-400'}`} />
        <span className="text-[10px] mt-0.5 tracking-tight">Beranda</span>
      </Link>

      {/* KATALOG */}
      <Link
        href="/events"
        className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg transition-colors ${
          isActive('/events', true)
            ? 'text-blue-900 font-bold'
            : 'text-slate-500 hover:text-slate-900 font-medium'
        }`}
      >
        <BookOpen className={`w-5 h-5 ${isActive('/events', true) ? 'text-blue-900' : 'text-slate-400'}`} />
        <span className="text-[10px] mt-0.5 tracking-tight">Katalog</span>
      </Link>

      {/* FLOATING SCAN QR ACTION BUTTON — flat, no gradient */}
      <Link
        href="/attendance/scan"
        className="flex flex-col items-center justify-center -mt-5 transition-transform active:scale-95"
      >
        <div className="w-12 h-12 rounded-2xl bg-blue-900 text-white flex items-center justify-center border-2 border-white">
          <QrCode className="w-6 h-6" />
        </div>
        <span className={`text-[10px] mt-0.5 ${isActive('/attendance', true) ? 'text-blue-900 font-bold' : 'text-slate-600 font-bold'}`}>
          Presensi
        </span>
      </Link>

      {/* SERTIFIKAT */}
      <Link
        href={isAdmin ? '/admin/report-center' : '/my-certificates'}
        className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg transition-colors ${
          isActive('/my-certificates', true) || isActive('/admin/report-center', true)
            ? 'text-blue-900 font-bold'
            : 'text-slate-500 hover:text-slate-900 font-medium'
        }`}
      >
        <Award className={`w-5 h-5 ${isActive('/my-certificates', true) || isActive('/admin/report-center', true) ? 'text-blue-900' : 'text-slate-400'}`} />
        <span className="text-[10px] mt-0.5 tracking-tight">Sertifikat</span>
      </Link>

      {/* RIWAYAT / PROFIL */}
      {isAdmin ? (
        <Link
          href="/admin/event-history"
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg transition-colors ${
            isActive('/admin/event-history', true)
              ? 'text-blue-900 font-bold'
              : 'text-slate-500 hover:text-slate-900 font-medium'
          }`}
        >
          <History className={`w-5 h-5 ${isActive('/admin/event-history', true) ? 'text-blue-900' : 'text-slate-400'}`} />
          <span className="text-[10px] mt-0.5 tracking-tight">Riwayat</span>
        </Link>
      ) : (
        <Link
          href="/profile"
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg transition-colors ${
            isActive('/profile')
              ? 'text-blue-900 font-bold'
              : 'text-slate-500 hover:text-slate-900 font-medium'
          }`}
        >
          <User className={`w-5 h-5 ${isActive('/profile') ? 'text-blue-900' : 'text-slate-400'}`} />
          <span className="text-[10px] mt-0.5 tracking-tight">Profil</span>
        </Link>
      )}

    </div>
  );
}
