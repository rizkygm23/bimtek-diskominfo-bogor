import React from 'react';
import { usePage } from '@inertiajs/react';
import { Menu } from 'lucide-react';
import DiskominfoLogo from './DiskominfoLogo';

export default function MobileTopBar({ onMenuClick }) {
  const { auth } = usePage().props;
  const user = auth?.user;
  const role = user?.role;
  const roleLabel = role === 'admin' ? 'Admin' : role === 'pembicara' ? 'Pembicara' : 'Peserta';

  return (
    <div className="lg:hidden flex items-center justify-between px-4 py-2 bg-white border-b border-slate-200 print:hidden">
      <button
        onClick={onMenuClick}
        className="p-2 rounded-xl bg-slate-100 text-slate-800 hover:bg-slate-200 transition-colors"
        aria-label="Buka Menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="flex items-center gap-1.5">
        <DiskominfoLogo variant="light-bg" className="h-7" />
        {user && (
          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-900 text-white">
            {roleLabel}
          </span>
        )}
      </div>
    </div>
  );
}