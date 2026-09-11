import React, { useState } from 'react';
import { useForm, Link } from '@inertiajs/react';
import { Eye, EyeOff, Mail, Lock, ShieldCheck, ArrowRight } from 'lucide-react';

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [recaptchaChecked, setRecaptchaChecked] = useState(true);

  const { data, setData, post, processing, errors } = useForm({
    email: '',
    password: '',
    remember: true,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    post('/login');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-blue-900 selection:text-white">

      {/* MAIN LOGIN CARD */}
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-lg p-8 sm:p-10 space-y-6">
        
        {/* LOGO KEDINASAN HEADER */}
        <div className="flex items-center justify-center">
          <Link href="/" className="inline-block">
            <img 
              src="/images/logo_diskominfo_bogorkab.png" 
              alt="Logo Diskominfo Kabupaten Bogor" 
              className="h-12 object-contain" 
            />
          </Link>
        </div>

        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Masuk Akun</h1>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            Masuk menggunakan Email / NIP terdaftar Anda untuk melanjutkan.
          </p>
        </div>

        {/* Login form below */}

        {/* LOGIN FORM */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* EMAIL FIELD */}
          <div className="space-y-1.5">
            <label className="block text-xs font-extrabold text-slate-800">Email atau NIP / NIK</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={data.email}
                onChange={(e) => setData('email', e.target.value)}
                placeholder="nama@bogorkab.go.id atau NIP / NIK"
                className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>
            {errors.email && <p className="text-xs text-rose-600 font-bold">{errors.email}</p>}
          </div>

          {/* PASSWORD FIELD WITH EYE TOGGLE */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-extrabold text-slate-800">Password</label>
              <Link href="#" className="text-[11px] font-bold text-blue-900 hover:underline">
                Lupa Password?
              </Link>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={data.password}
                onChange={(e) => setData('password', e.target.value)}
                placeholder="Masukkan password Anda"
                className="w-full pl-10 pr-11 py-3 bg-slate-50/50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-rose-600 font-bold">{errors.password}</p>}
          </div>

          {/* RECAPTCHA SECURITY BOX */}
          <div className="p-3.5 border border-slate-200 rounded-xl bg-slate-50 flex items-center justify-between">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={recaptchaChecked}
                onChange={(e) => setRecaptchaChecked(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-blue-900 focus:ring-blue-800 cursor-pointer"
              />
              <span className="text-xs font-bold text-slate-700">Saya bukan robot</span>
            </label>
            <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400 font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>reCAPTCHA</span>
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={processing}
            className="w-full py-3.5 px-4 bg-blue-900 hover:bg-blue-800 text-white font-black text-xs rounded-xl shadow-lg transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Masuk Ke Portal</span>
            <ArrowRight className="w-4 h-4 text-amber-400" />
          </button>
        </form>

        {/* FOOTER REGISTER LINK */}
        <div className="text-center pt-2 border-t border-slate-100 text-xs font-medium">
          <p className="text-slate-600">
            Belum mendaftar akun?{' '}
            <Link href="/register" className="text-blue-900 font-black hover:underline">
              Daftar Sekarang &rarr;
            </Link>
          </p>
        </div>

      </div>

      {/* FOOTER COPYRIGHT */}
      <p className="text-[11px] text-slate-400 mt-6 font-medium text-center">
        &copy; {new Date().getFullYear()} Dinas Komunikasi dan Informatika Kabupaten Bogor. All rights reserved.
      </p>

    </div>
  );
}
