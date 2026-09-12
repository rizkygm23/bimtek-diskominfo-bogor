import React from 'react';
import { UserCheck, X, Calendar, Clock } from 'lucide-react';

export default function RealtimeToast({ notification, onClose }) {
  if (!notification) return null;

  return (
    <div className="fixed top-20 right-4 z-50 max-w-sm w-full bg-white dark:bg-slate-900 border-2 border-emerald-500 rounded-2xl shadow-2xl p-4 animate-in slide-in-from-top-5 duration-300 font-sans">
      <div className="flex items-start justify-between gap-3">
        
        {/* ICON */}
        <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0 shadow-xs">
          <UserCheck className="w-5 h-5" />
        </div>

        {/* CONTENT */}
        <div className="flex-1 space-y-1 text-xs">
          <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-black uppercase text-[10px] tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span>Peserta Baru Mendaftar</span>
          </div>

          <h4 className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight">
            {notification.participant_name || 'Peserta Baru'}
          </h4>

          <div className="text-[11px] text-slate-600 dark:text-slate-400 space-y-0.5 pt-1 border-t border-slate-100 dark:border-slate-800">
            <p className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-blue-600 shrink-0" />
              <strong className="truncate max-w-[200px]" title={notification.bimtek_name}>
                {notification.bimtek_name}
              </strong>
            </p>
            <p className="flex items-center justify-between text-[10px] text-slate-500">
              <span className="font-mono">{notification.registration_code}</span>
              <span className="flex items-center gap-0.5">
                <Clock className="w-3 h-3 text-amber-500" />
                {notification.registered_at || 'Baru saja'}
              </span>
            </p>
          </div>
        </div>

        {/* CLOSE BUTTON */}
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 font-bold text-xs"
        >
          <X className="w-4 h-4" />
        </button>

      </div>
    </div>
  );
}
