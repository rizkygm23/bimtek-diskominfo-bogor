import React from 'react';
import { Link } from '@inertiajs/react';
import { Users, Mic, ArrowRight, ArrowLeft } from 'lucide-react';

export default function RegisterChoice() {
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        
        {/* OFFICIAL LOGO DISKOMINFO BOGORKAB */}
        <div className="flex justify-center mb-4">
          <img 
            src="/images/logo_diskominfo_bogorkab.png" 
            alt="Logo Diskominfo Kabupaten Bogor" 
            className="h-16 md:h-20 object-contain drop-shadow-sm" 
          />
        </div>

        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
          MANAJEMEN BIMBINGAN TEKNIS
        </h2>
        <p className="mt-1 text-xs font-extrabold text-blue-900 dark:text-amber-400 uppercase tracking-widest">
          DISKOMINFO KABUPATEN BOGOR
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 py-8 px-6 shadow-xl rounded-3xl sm:px-10 space-y-6">
          
          <div className="text-center">
            <h3 className="text-base font-black text-blue-950 dark:text-white">PILIH KATEGORI PENDAFTARAN AKUN</h3>
            <p className="text-xs text-slate-500 mt-1">Silakan pilih peran akun yang sesuai dengan status Anda.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* OPTION 1: PESERTA BIMTEK */}
            <Link
              href="/register/peserta"
              className="p-5 rounded-2xl border-2 border-slate-200 dark:border-slate-800 hover:border-emerald-600 bg-slate-50 dark:bg-slate-950 hover:bg-emerald-50/50 transition-all group flex flex-col justify-between space-y-4 shadow-xs"
            >
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
                  <Users className="w-5 h-5" />
                </div>
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white group-hover:text-emerald-700">
                  Registrasi Peserta
                </h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Pendaftaran untuk peserta pelatihan, ASN, staf instansi, maupun masyarakat umum.
                </p>
              </div>
              <div className="flex items-center text-xs font-black text-emerald-700 gap-1 pt-2 border-t border-slate-200">
                <span>Daftar Peserta</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>

            {/* OPTION 2: PEMBICARA / NARASUMBER */}
            <Link
              href="/register/pembicara"
              className="p-5 rounded-2xl border-2 border-slate-200 dark:border-slate-800 hover:border-amber-500 bg-slate-50 dark:bg-slate-950 hover:bg-amber-50/50 transition-all group flex flex-col justify-between space-y-4 shadow-xs"
            >
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
                  <Mic className="w-5 h-5" />
                </div>
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white group-hover:text-amber-800">
                  Registrasi Pembicara
                </h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Pendaftaran untuk Narasumber, Widyaiswara, Pakar Ahli, atau Pemateri Sesi.
                </p>
              </div>
              <div className="flex items-center text-xs font-black text-amber-800 gap-1 pt-2 border-t border-slate-200">
                <span>Daftar Pembicara</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>

          </div>

          <div className="pt-4 border-t border-slate-200 text-center">
            <Link href="/login" className="inline-flex items-center gap-1.5 text-xs font-extrabold text-blue-900 hover:underline">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Sudah memiliki akun? Masuk ke sistem</span>
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
