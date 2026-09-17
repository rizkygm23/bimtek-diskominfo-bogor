import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import {
  Monitor,
  QrCode,
  ShieldCheck,
  ArrowRight,
  FileEdit,
  Copy,
  Check,
  Menu,
  X,
  Award,
  Calculator,
  MapPin,
  CalendarDays,
  Clock,
  Phone,
  Mail,
  Globe,
  Layers,
  Building2,
} from 'lucide-react';

import DiskominfoLogo from '../Components/DiskominfoLogo';

// Format tanggal Indonesia — data asli, bukan string mentah ISO
const formatDateID = (dateStr) =>
  new Date(dateStr).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

// Badge status dari data event asli (bukan hardcoded)
const statusMeta = {
  open: { label: 'PENDAFTARAN DIBUKA', cls: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  ongoing: { label: 'SEDANG BERLANGSUNG', cls: 'bg-blue-50 text-blue-900 border-blue-200' },
  completed: { label: 'SELESAI', cls: 'bg-slate-100 text-slate-600 border-slate-200' },
};

export default function Landing({ schedules }) {
  const [copiedId, setCopiedId] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
      setMobileMenuOpen(false);
    }
  };

  const handleCopyLink = (eventId) => {
    const link = `${window.location.origin}/events/${eventId}/register`;
    navigator.clipboard.writeText(link);
    setCopiedId(eventId);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const navLinks = [
    { id: 'hero', label: 'Beranda' },
    { id: 'bimtek', label: 'Apa itu BIMTEK' },
    { id: 'jadwal', label: 'Jadwal BIMTEK' },
    { id: 'alur', label: 'Cara Daftar' },
    { id: 'fitur', label: 'Fitur' },
  ];

  const trustItems = [
    { icon: Award, label: 'Sertifikat Resmi Bertanda Tangan' },
    { icon: ShieldCheck, label: 'Presensi QR Anti-Fraud' },
    { icon: Calculator, label: 'Honorarium & PPh 21 Otomatis' },
    { icon: Layers, label: 'Pengelolaan Terpusat' },
  ];

  const steps = [
    { icon: CalendarDays, title: 'Pilih Kegiatan', desc: 'Telusuri katalog BIMTEK resmi dan pilih tema pelatihan yang sesuai kebutuhan Anda.' },
    { icon: FileEdit, title: 'Isi Form Data Diri', desc: 'Lengkapi formulir pendaftaran online dengan data identitas dan rekening pencairan.' },
    { icon: QrCode, title: 'Terima Tiket QR', desc: 'Tiket presensi digital ber-QR Code terbit otomatis setelah pendaftaran diverifikasi.' },
    { icon: Award, title: 'Presensi & Sertifikat', desc: 'Scan QR pada hari-H, lalu unduh sertifikat digital resmi bertanda tangan elektronik.' },
  ];

  const features = [
    { icon: Monitor, title: 'Katalog Modul Digital', desc: 'Materi pelatihan dalam format PDF dan PPT tersedia terpusat bagi seluruh peserta terdaftar.' },
    { icon: FileEdit, title: 'Formulir Data Diri Online', desc: 'Formulir pendaftaran dinamis per kegiatan dengan tautan khusus yang dibuat oleh admin.' },
    { icon: ShieldCheck, title: 'Absensi QR Anti-Fraud', desc: 'QR Code presensi berotasi otomatis dan tervalidasi HMAC — tidak dapat dipalsukan atau dibagikan.' },
    { icon: Award, title: 'Sertifikat Digital Resmi', desc: 'Sertifikat bertanda tangan elektronik diterbitkan dan diarsipkan dalam repository resmi.' },
    { icon: Calculator, title: 'Honorarium & PPh 21 Otomatis', desc: 'Perhitungan honor narasumber dan pajak PPh 21 per golongan dilakukan otomatis dan akurat.' },
    { icon: Building2, title: 'Verifikasi Berkas Terpusat', desc: 'KTP, NPWP, dan buku rekening diverifikasi admin melalui satu antrean yang aman dan privat.' },
  ];

  const hasSchedules = Array.isArray(schedules) && schedules.length > 0;

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased selection:bg-blue-600 selection:text-white">
      <Head title="SIM-BIMTEK — Sistem Informasi Manajemen Bimbingan Teknis | Diskominfo Kabupaten Bogor" />

      {/* SKIP LINK untuk pengguna keyboard */}
      <a href="#jadwal" className="skip-link">Lompat ke Jadwal BIMTEK</a>

      {/* ==================== NAVBAR ==================== */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-xs py-3 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">

          {/* BRANDING LOCKUP: logo + nama instansi */}
          <Link href="/" className="flex items-center gap-3 min-w-0">
            <DiskominfoLogo variant="light-bg" />
            <span className="hidden lg:block min-w-0">
              <span className="block text-[11px] font-black text-blue-950 uppercase tracking-wide leading-tight">Diskominfo</span>
              <span className="block text-[10px] font-bold text-slate-500 leading-tight">Kabupaten Bogor</span>
            </span>
          </Link>

          {/* NAVIGASI DESKTOP */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-extrabold text-slate-700" aria-label="Navigasi utama">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                className={`hover:text-blue-900 transition-colors cursor-pointer px-1 py-1.5 ${link.id === 'hero' ? 'border-b-2 border-blue-900 pb-0.5 text-blue-900' : ''}`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* CTA */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-5 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-950 text-white text-xs font-bold shadow-md transition-all active:scale-95 inline-block"
            >
              Masuk
            </Link>

            {/* HAMBURGER MOBILE */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2.5 rounded-xl bg-slate-100 text-slate-800 border border-slate-200"
              aria-label="Buka Menu Navigasi HP"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* MENU MOBILE */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 mt-3 pt-3 pb-2 space-y-1 text-xs font-extrabold text-slate-700">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                className={`block w-full text-left px-3 py-3 rounded-xl hover:bg-slate-50 ${link.id === 'hero' ? 'text-blue-900' : ''}`}
              >
                {link.label}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* ==================== HERO ==================== */}
      <section id="hero" className="relative bg-[#1a2e7b] text-white overflow-hidden py-24 md:py-28 px-4 sm:px-6 lg:px-8">

        {/* DEKORASI LATAR */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-blue-600/20 blur-2xl pointer-events-none" aria-hidden="true"></div>
        <div className="absolute top-1/2 left-10 w-72 h-72 rounded-full bg-blue-400/10 blur-xl pointer-events-none" aria-hidden="true"></div>
        <div className="absolute -bottom-20 right-1/3 w-80 h-80 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" aria-hidden="true"></div>

        <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10">

          {/* BADGE KEBERCAYAAN RESMI */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-900/60 border border-blue-400/30">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
            <span className="text-[11px] font-black tracking-widest text-blue-100 uppercase">
              Sistem Resmi Pemerintah Kabupaten Bogor
            </span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight text-white">
            Bimbingan Teknis<br />(BIMTEK) Kabupaten Bogor
          </h1>

          <p className="text-sm md:text-base text-blue-100 max-w-2xl mx-auto leading-relaxed font-medium">
            Kegiatan peningkatan kompetensi aparatur sipil negara dan masyarakat yang
            diselenggarakan secara resmi oleh Pemerintah Kabupaten Bogor — pilih jadwal,
            daftar online, dan dapatkan sertifikat resmi.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => scrollToSection('jadwal')}
              className="px-7 py-3 rounded-xl bg-white hover:bg-slate-100 text-[#1a2e7b] font-black text-xs shadow-lg transition-all active:scale-95 cursor-pointer"
            >
              Lihat Jadwal BIMTEK
            </button>
            <Link
              href="/login"
              className="px-7 py-3 rounded-xl border-2 border-white/80 hover:border-white bg-transparent hover:bg-white/10 text-white font-extrabold text-xs transition-all cursor-pointer inline-block"
            >
              Masuk ke Akun
            </Link>
          </div>
        </div>
      </section>

      {/* ==================== TRUST STRIP ==================== */}
      <div className="bg-white border-b border-slate-100" aria-label="Keunggulan sistem">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {trustItems.map((item) => (
            <div key={item.label} className="flex items-center gap-2.5 justify-center lg:justify-start">
              <span className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                <item.icon className="w-4.5 h-4.5 text-blue-900" aria-hidden="true" />
              </span>
              <span className="text-[11px] font-extrabold text-slate-700 leading-tight">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ==================== APA ITU BIMTEK? ==================== */}
      <section id="bimtek" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">

          {/* DEFINISI */}
          <div className="space-y-4">
            <span className="inline-block text-[11px] font-black text-blue-900 uppercase tracking-widest">Apa itu BIMTEK?</span>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 leading-snug">
              Bimbingan Teknis untuk Peningkatan Kompetensi
            </h2>
            <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
              <strong>BIMTEK (Bimbingan Teknis)</strong> adalah kegiatan pendidikan dan pelatihan
              non-jabatan yang diselenggarakan pemerintah untuk memberikan pemahaman teknis,
              peningkatan keterampilan, dan pendalaman materi bidang tertentu bagi Aparatur Sipil
              Negara (ASN) maupun masyarakat umum.
            </p>
            <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
              BIMTEK biasanya berlangsung satu hingga beberapa hari dengan kombinasi paparan
              materi oleh narasumber ahli, diskusi, dan praktik langsung. Peserta yang mengikuti
              sampai tuntas dan melakukan presensi akan menerima <strong>sertifikat resmi</strong> yang
              dapat dipergunakan sebagai bukti pengembangan kompetensi.
            </p>
            <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
              Di Kabupaten Bogor, penyelenggaraan BIMTEK dikoordinasikan oleh Dinas Komunikasi
              dan Informatika — mulai dari perencanaan tema sesuai kebutuhan daerah, pengundangan
              narasumber, hingga publikasi jadwal dan pendaftaran online melalui laman ini.
            </p>
          </div>

          {/* MANFAAT & KARTU DINAS */}
          <div className="space-y-5">
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 space-y-4">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Untuk apa BIMTEK diselenggarakan?</h3>
              <ul className="space-y-3 text-xs text-slate-600">
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
                  <span><strong className="text-slate-800">Peningkatan kompetensi ASN</strong> — pembaruan pengetahuan teknis bidang tugas sesuai perkembangan regulasi dan teknologi.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
                  <span><strong className="text-slate-800">Penguatan pelayanan publik</strong> — aparatur yang terampil berdampak langsung pada kualitas layanan kepada masyarakat.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
                  <span><strong className="text-slate-800">Literasi digital masyarakat</strong> — sebagian BIMTEK terbuka untuk umum, misalnya keamanan digital dan perlindungan data pribadi.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
                  <span><strong className="text-slate-800">Kesetaraan layanan informasi</strong> — seluruh materi, jadwal, dan sertifikat terdokumentasi secara transparan dan dapat diaudit.</span>
                </li>
              </ul>
            </div>

            <div className="bg-white border-2 border-blue-900/15 rounded-3xl p-6 shadow-lg space-y-3">
              <div className="flex items-center gap-4 pb-3 border-b border-slate-100">
                <img
                  src="/images/logo_diskominfo_bogorkab.png"
                  alt="Logo Dinas Komunikasi dan Informatika Kabupaten Bogor"
                  className="h-12 object-contain shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Penyelenggara &amp; Pengelola</p>
                  <h3 className="text-sm font-black text-slate-900 leading-snug">
                    Dinas Komunikasi dan Informatika<br />Kabupaten Bogor
                  </h3>
                </div>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-600">
                <li className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-blue-900 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>Jalan Tegar Beriman, Cibinong, Kabupaten Bogor, Jawa Barat 16914</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-blue-900 shrink-0" aria-hidden="true" />
                  <span>(021) 8758605</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-blue-900 shrink-0" aria-hidden="true" />
                  <span>diskominfo@bogorkab.go.id</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== CARA DAFTAR (ALUR) ==================== */}
      <section id="alur" className="py-20 bg-slate-50 border-y border-slate-200/80 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <span className="text-[11px] font-black text-blue-900 uppercase tracking-widest">Cara Daftar</span>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900">Empat Langkah, Sepenuhnya Digital</h2>
            <p className="text-xs text-slate-500 font-medium">Proses yang sama dan transparan bagi seluruh peserta — dari pendaftaran hingga sertifikat.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {steps.map((step, idx) => (
              <div key={step.title} className="relative bg-white p-6 rounded-3xl border border-slate-200 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 space-y-3">
                <span className="absolute top-4 right-5 text-4xl font-black text-slate-100 select-none" aria-hidden="true">{idx + 1}</span>
                <div className="w-11 h-11 rounded-2xl bg-blue-900 text-white flex items-center justify-center relative">
                  <step.icon className="w-5 h-5 text-amber-400" aria-hidden="true" />
                </div>
                <h3 className="font-black text-sm text-slate-900 relative">{step.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed relative">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== JADWAL BIMTEK ==================== */}
      <section id="jadwal" className="py-20 bg-slate-50 border-y border-slate-200/80 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-10">

          <div className="text-center space-y-2 max-w-xl mx-auto">
            <span className="text-[11px] font-black text-blue-900 uppercase tracking-widest">Jadwal</span>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900">Jadwal BIMTEK Mendatang</h2>
            <p className="text-xs text-slate-500 font-medium">
              Agenda resmi yang akan diselenggarakan — urut dari yang terdekat. Daftar sebelum kuota terisi.
            </p>
          </div>

          {hasSchedules ? (
            <div className="space-y-4">
              {schedules.map((ev) => {
                const status = statusMeta[ev.computed_status || ev.status] || statusMeta.completed;
                const count = ev.registrations_count || 0;
                const quota = ev.quota || 0;
                const pct = quota > 0 ? Math.min(100, Math.round((count / quota) * 100)) : 0;
                const barCls = pct >= 100 ? 'bg-rose-500' : pct >= 80 ? 'bg-amber-500' : 'bg-emerald-500';
                const isOpen = (ev.computed_status || ev.status) === 'open';
                const start = new Date(ev.start_date);
                return (
                  <article
                    key={ev.id}
                    className="bg-white border border-slate-200 rounded-3xl shadow-xs hover:shadow-lg transition-all duration-300 overflow-hidden"
                  >
                    <div className="flex flex-col sm:flex-row">

                      {/* BLOK TANGGAL */}
                      <div className="sm:w-32 shrink-0 bg-[#1a2e7b] text-white flex sm:flex-col items-center justify-center gap-1 py-4 sm:py-6 sm:px-4 text-center">
                        <span className="text-3xl font-black leading-none">{start.getDate()}</span>
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-400">
                          {start.toLocaleDateString('id-ID', { month: 'long' })}
                        </span>
                        <span className="text-[11px] font-bold text-blue-200">
                          {start.getFullYear()}
                        </span>
                        <span className="hidden sm:block text-[10px] font-bold text-blue-300/80 mt-1 border-t border-blue-400/30 pt-1 w-full">
                          {start.toLocaleDateString('id-ID', { weekday: 'long' })}
                        </span>
                      </div>

                      {/* DETAIL */}
                      <div className="flex-1 p-5 sm:p-6 space-y-3 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wide border ${status.cls}`}>
                            {status.label}
                          </span>
                          <span className="text-[11px] font-bold text-slate-500">
                            {formatDateID(ev.start_date)}
                            {ev.end_date && new Date(ev.end_date).toDateString() !== start.toDateString()
                              ? ` — ${formatDateID(ev.end_date)}`
                              : ''}
                          </span>
                        </div>

                        <h3 className="text-sm md:text-base font-black text-slate-900 leading-snug">
                          {ev.title}
                        </h3>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-bold text-slate-600">
                          <span className="flex items-center gap-1.5 min-w-0">
                            <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" aria-hidden="true" />
                            <span>
                              {start.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                            </span>
                          </span>
                          <span className="flex items-center gap-1.5 min-w-0">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" aria-hidden="true" />
                            <span className="truncate">{ev.location}</span>
                          </span>
                        </div>

                        {/* KUOTA */}
                        <div className="flex items-center gap-3 pt-1">
                          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden max-w-[220px]" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`Kuota terisi ${pct}%`}>
                            <div className={`h-full rounded-full transition-all duration-300 ${barCls}`} style={{ width: `${pct}%` }}></div>
                          </div>
                          <span className="text-[10px] font-bold text-slate-400 shrink-0">
                            {count}/{quota} peserta{pct >= 100 ? ' — penuh' : ''}
                          </span>
                        </div>

                        {/* AKSI */}
                        <div className="flex flex-wrap items-center gap-2 pt-2">
                          {isOpen && pct < 100 ? (
                            <Link
                              href={`/events/${ev.id}/register`}
                              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-black shadow-xs transition-all active:scale-[0.98]"
                            >
                              <FileEdit className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>Daftar Sekarang</span>
                            </Link>
                          ) : (
                            <Link
                              href={`/events/${ev.id}`}
                              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-950 text-white text-xs font-black shadow-xs transition-all active:scale-[0.98]"
                            >
                              <span>Lihat Detail</span>
                            </Link>
                          )}
                          <Link
                            href={`/events/${ev.id}`}
                            className="inline-flex items-center gap-1 px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold transition-colors"
                          >
                            <span>Detail Kegiatan</span>
                            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleCopyLink(ev.id)}
                            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold transition-colors cursor-pointer"
                          >
                            {copiedId === ev.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                                <span className="text-emerald-700 font-extrabold">Disalin!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                                <span>Salin Link</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            /* EMPTY STATE — jujur, tanpa data palsu */
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl py-16 px-6 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto">
                <CalendarDays className="w-6 h-6 text-slate-400" aria-hidden="true" />
              </div>
              <h3 className="text-sm font-black text-slate-900">Belum ada jadwal BIMTEK yang dibuka</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Jadwal kegiatan berikutnya akan diumumkan di halaman ini. Silakan cek kembali secara berkala atau hubungi Diskominfo Kabupaten Bogor.
              </p>
            </div>
          )}

          <div className="text-center">
            <Link
              href="/events"
              className="inline-flex items-center gap-1.5 px-6 py-3 rounded-xl bg-blue-900 hover:bg-blue-950 text-white text-xs font-black shadow-md transition-all active:scale-95"
            >
              <span>Lihat Seluruh Katalog Kegiatan</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* ==================== FITUR UNGGULAN ==================== */}
      <section id="fitur" className="py-20 bg-slate-50 border-y border-slate-200/80 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-12">

          <div className="text-center space-y-2 max-w-xl mx-auto">
            <span className="text-[11px] font-black text-blue-900 uppercase tracking-widest">Fitur</span>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900">Dikelola Menyeluruh, Terstandar, Terdokumentasi</h2>
            <p className="text-xs text-slate-500 font-medium">Setiap tahapan kegiatan BIMTEK ditangani sistem — akurat dan dapat diaudit.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div key={feature.title} className="bg-white p-7 rounded-3xl border border-slate-200 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-900 flex items-center justify-center">
                  <feature.icon className="w-5 h-5 text-amber-400" aria-hidden="true" />
                </div>
                <h3 className="font-extrabold text-sm text-slate-900">{feature.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== CTA PENUTUP ==================== */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto bg-[#1a2e7b] rounded-3xl px-8 py-14 text-center text-white relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-blue-500/20 blur-2xl pointer-events-none" aria-hidden="true"></div>
          <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-indigo-400/10 blur-2xl pointer-events-none" aria-hidden="true"></div>
          <div className="relative space-y-5">
            <h2 className="text-2xl md:text-3xl font-black leading-snug">
              Tingkatkan Kapasitas SDM Anda<br />Bersama Diskominfo Kabupaten Bogor
            </h2>
            <p className="text-xs md:text-sm text-blue-100 max-w-xl mx-auto font-medium">
              Bergabunglah dalam kegiatan BIMTEK resmi — daftar online, hadir dengan QR Code, dan
              dapatkan sertifikat digital yang diakui.
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/login"
                className="px-7 py-3 rounded-xl bg-white hover:bg-slate-100 text-[#1a2e7b] font-black text-xs shadow-lg transition-all active:scale-95 inline-block"
              >
                Masuk ke Akun
              </Link>
              <Link
                href="/register"
                className="px-7 py-3 rounded-xl border-2 border-white/80 hover:border-white bg-transparent hover:bg-white/10 text-white font-extrabold text-xs transition-all inline-block"
              >
                Daftar Akun Baru
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== FOOTER ==================== */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 pt-12 pb-8 px-4 sm:px-6 lg:px-8 text-xs">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">

          {/* BRAND */}
          <div className="space-y-3">
            <img
              src="/images/logo_diskominfo_bogorkab.png"
              alt="Diskominfo"
              className="h-10 object-contain brightness-0 invert opacity-80"
            />
            <p className="leading-relaxed text-[11px]">
              Sistem Informasi Manajemen Bimbingan Teknis (SIM-BIMTEK) — aplikasi resmi
              Dinas Komunikasi dan Informatika Kabupaten Bogor.
            </p>
            <a
              href="https://bogorkab.go.id"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-blue-300 hover:text-white font-bold transition-colors"
            >
              <Globe className="w-3.5 h-3.5" aria-hidden="true" />
              <span>bogorkab.go.id</span>
            </a>
          </div>

          {/* LINK CEPAT */}
          <div className="space-y-3">
            <h3 className="font-black text-white uppercase tracking-wider text-[11px]">Link Cepat</h3>
            <ul className="space-y-2">
              <li><button onClick={() => scrollToSection('jadwal')} className="hover:text-white transition-colors cursor-pointer">Jadwal BIMTEK</button></li>
              <li><button onClick={() => scrollToSection('bimtek')} className="hover:text-white transition-colors cursor-pointer">Apa itu BIMTEK</button></li>
              <li><button onClick={() => scrollToSection('alur')} className="hover:text-white transition-colors cursor-pointer">Cara Pendaftaran</button></li>
              <li><Link href="/events" className="hover:text-white transition-colors">Katalog Kegiatan</Link></li>
              <li><Link href="/login" className="hover:text-white transition-colors">Masuk</Link></li>
              <li><Link href="/register" className="hover:text-white transition-colors">Daftar Akun</Link></li>
            </ul>
          </div>

          {/* KONTAK */}
          <div className="space-y-3">
            <h3 className="font-black text-white uppercase tracking-wider text-[11px]">Kontak &amp; Alamat</h3>
            <ul className="space-y-2.5">
              <li className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
                <span>Jalan Tegar Beriman, Cibinong, Kabupaten Bogor, Jawa Barat 16914</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" aria-hidden="true" />
                <span>(021) 8758605</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-amber-400 shrink-0" aria-hidden="true" />
                <span>diskominfo@bogorkab.go.id</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto border-t border-slate-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
          <span>&copy; {new Date().getFullYear()} Dinas Komunikasi dan Informatika Kabupaten Bogor. Hak Cipta Dilindungi.</span>
          <span className="text-slate-500">Mendukung tata kelola pemerintahan digital (SPBE)</span>
        </div>
      </footer>
    </div>
  );
}
