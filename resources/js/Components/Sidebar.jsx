import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
  LayoutDashboard,
  Calendar,
  ShieldCheck,
  Camera,
  CreditCard,
  BarChart3,
  Users,
  History,
  FileSpreadsheet,
  FileText,
  Sliders,
  User,
  LogOut,
  Mic,
  CheckCircle2,
  X,
} from 'lucide-react';
import DiskominfoLogo from './DiskominfoLogo';

export default function Sidebar({ open, onClose }) {
  const { auth, url: pageUrl } = usePage();
  const current = (pageUrl || '').split('?')[0];
  const user = auth?.user;
  const role = user?.role;
  const isAdmin = role === 'admin';
  const isPembicara = role === 'pembicara';

  const isActive = (href, prefix = false) => prefix ? current.startsWith(href) : current === href;

  const navGroups = {
    admin: [
      {
        label: 'Utama', items: [
          { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { href: '/events', label: 'Katalog BIMTEK', icon: Calendar, prefix: true },
        ]
      },
      {
        label: 'Kegiatan', items: [
          { href: '/admin/verifications', label: 'Verifikasi Data', icon: ShieldCheck, prefix: true },
          { href: '/attendance/scan', label: 'Presensi Hari-H', icon: Camera, prefix: true },
        ]
      },
      {
        label: 'Keuangan', items: [
          { href: '/admin/payments', label: 'Honor & Pajak', icon: CreditCard, prefix: true },
          { href: '/admin/tax-settings', label: 'Tarif PPh 21', icon: Sliders },
        ]
      },
      {
        label: 'Laporan', items: [
          { href: '/admin/report-center', label: 'Pusat Laporan', icon: BarChart3 },
          { href: '/admin/reports/participants', label: 'Rekap Peserta', icon: FileSpreadsheet },
          { href: '/admin/reports/speakers', label: 'Rekap Narasumber', icon: FileText },
          { href: '/admin/reports/honorarium', label: 'Cetak Honorarium', icon: FileText },
        ]
      },
      {
        label: 'Sistem', items: [
          { href: '/admin/speakers', label: 'Master Pembicara', icon: Users },
          { href: '/admin/event-history', label: 'Riwayat BIMTEK', icon: History },
          { href: '/profile', label: 'Profil Saya', icon: User },
        ]
      },
    ],
    pembicara: [
      {
        label: 'Utama', items: [
          { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { href: '/events', label: 'Jadwal BIMTEK', icon: Calendar, prefix: true },
        ]
      },
      {
        label: 'Kegiatan', items: [
          { href: '/attendance/scan', label: 'Presensi Hari-H', icon: Camera, prefix: true },
          { href: '/my-certificates', label: 'Sertifikat Saya', icon: BarChart3 },
        ]
      },
      {
        label: 'Akun', items: [
          { href: '/profile', label: 'Profil & Rekening', icon: User },
        ]
      },
    ],
    user: [
      {
        label: 'Utama', items: [
          { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { href: '/events', label: 'Katalog BIMTEK', icon: Calendar, prefix: true },
        ]
      },
      {
        label: 'Kegiatan', items: [
          { href: '/attendance/scan', label: 'Presensi Hari-H', icon: Camera, prefix: true },
          { href: '/my-certificates', label: 'Sertifikat Saya', icon: BarChart3 },
        ]
      },
      {
        label: 'Akun', items: [
          { href: '/profile', label: 'Profil', icon: User },
        ]
      },
    ],
  };

  // Explicit role→menu mapping. NO fallback to 'user' if role is admin/pembicara —
  // prevents privilege confusion if role value is unexpected (null/undefined/case).
  const groups = isAdmin ? navGroups.admin : isPembicara ? navGroups.pembicara : navGroups.user;
  const roleLabel = isAdmin ? 'Admin' : isPembicara ? 'Pembicara' : 'Peserta';
  const RoleIcon = isAdmin ? CheckCircle2 : isPembicara ? Mic : User;

  return (
    <>
      {/* Backdrop for mobile drawer — click to close */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-[100dvh] w-72 lg:w-64 bg-white border-r border-slate-200 z-50 transition-transform duration-300 ease-out print:hidden ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
      >
        <div className="flex flex-col h-full">
          {/* Header — logo + close button (mobile only) */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200 shrink-0">
            <Link href="/dashboard" className="flex items-center gap-2 shrink-0" onClick={onClose}>
              <DiskominfoLogo variant="light-bg" className="h-8" />
            </Link>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors lg:hidden"
              aria-label="Tutup sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Role Badge */}
          <div className="px-4 py-3 border-b border-slate-200">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-900 border border-blue-100">
              <RoleIcon className="w-3.5 h-3.5 text-blue-700" />
              <span className="font-black text-xs uppercase tracking-wider">{roleLabel}</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4" role="navigation" aria-label="Main navigation">
            {groups.map((group, gIdx) => (
              <div key={gIdx} className="space-y-1">
                <div className="px-2">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    {group.label}
                  </p>
                </div>
                {group.items.map((item, iIdx) => {
                  const active = isActive(item.href, item.prefix);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={`${gIdx}-${iIdx}`}
                      href={item.href}
                      onClick={onClose}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${active
                          ? 'bg-slate-100 text-slate-900 font-black border-l-2 border-blue-900'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-semibold'
                        }`}
                    >
                      <Icon className={`w-5 h-5 shrink-0 ${active ? 'text-blue-900' : 'text-slate-400'}`} />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* Footer: User Card + Logout */}
          <div className="p-3 border-t border-slate-200 space-y-2">
            <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl border border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-blue-900 text-white font-bold flex items-center justify-center shrink-0 overflow-hidden">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user?.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm">{user?.name?.charAt(0) || 'U'}</span>
                )}
              </div>
              <div className="flex-1 min-w-0 overflow-hidden">
                <strong className="block text-xs font-black text-slate-900 truncate">{user?.name || 'User'}</strong>
                <span className="text-[10px] text-blue-700 font-extrabold uppercase flex items-center gap-1">
                  <RoleIcon className="w-3 h-3" />
                  <span>{roleLabel}</span>
                </span>
              </div>
            </div>
            <button
              onClick={() => window.location.href = '/logout'}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-rose-600 bg-rose-50 border border-rose-200 font-bold text-xs hover:bg-rose-100 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
