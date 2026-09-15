import React, { useState, useEffect, useCallback } from 'react';
import { usePage, Link } from '@inertiajs/react';
import AppLayout from '../Layouts/AppLayout';
import { 
  Calendar, 
  Users, 
  UserCheck, 
  QrCode, 
  FileText, 
  MapPin,
  Award,
  Globe,
  ArrowRight,
  Clock,
  CheckCircle2,
  PlayCircle,
  CreditCard,
  Mic,
  ShieldCheck,
  FileCheck,
  BookOpen,
  Send,
  FolderDown,
  User,
  Camera,
  Plus
} from 'lucide-react';
import { useParticipantRealtime } from '@/Hooks/useParticipantRealtime';
import LiveConnectionBadge from '@/Components/LiveConnectionBadge';
import RealtimeToast from '@/Components/RealtimeToast';

const YoutubeIcon = (props) => (
  <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24" {...props}>
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const FacebookIcon = (props) => (
  <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24" {...props}>
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const InstagramIcon = (props) => (
  <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24" {...props}>
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const TwitterIcon = (props) => (
  <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24" {...props}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

export default function Dashboard({ stats, myRegistrations = [], myTeachingSchedule = [], adminEvents = [] }) {
  const { auth } = usePage().props;
  const user = auth?.user || {};
  // Normalize role (sync dengan Sidebar & AdminMiddleware.php — literal lowercase).
  const role = (user?.role || '').toString().trim().toLowerCase();
  const isAdmin = role === 'admin';
  const isSpeaker = role === 'pembicara';

  const [liveStats, setLiveStats] = useState(stats || {});
  const [eventsList, setEventsList] = useState(adminEvents || []);

  useEffect(() => {
    setLiveStats(stats || {});
  }, [stats]);

  useEffect(() => {
    setEventsList(adminEvents || []);
  }, [adminEvents]);

  // REAL-TIME LISTENER FOR ADMIN DASHBOARD
  const handleNewParticipant = useCallback((eventData) => {
    if (isAdmin) {
      setLiveStats((prev) => ({
        ...prev,
        total_participants: (prev?.total_participants ?? 0) + 1,
        total_registrations: (prev?.total_registrations ?? 0) + 1,
      }));

      // Update event pendaftar count in real-time
      if (eventData.bimtek_id) {
        setEventsList((prev) => prev.map((ev) => {
          if (Number(ev.id) === Number(eventData.bimtek_id)) {
            return {
              ...ev,
              registrations_count: (ev.registrations_count ?? 0) + 1,
            };
          }
          return ev;
        }));
      }
    }
  }, [isAdmin]);

  const handleAttendance = useCallback((eventData) => {
    if (isAdmin) {
      setLiveStats((prev) => ({
        ...prev,
        today_attendances: (prev?.today_attendances ?? 0) + 1,
      }));
    }
  }, [isAdmin]);

  const { isConnected, latestNotification, clearNotification } = useParticipantRealtime({
    onParticipantRegistered: handleNewParticipant,
    onAttendanceRecorded: handleAttendance,
    enabled: isAdmin,
  });

  const socialLinks = [
    {
      name: 'YouTube Diskominfo Kab. Bogor',
      url: 'https://www.youtube.com/@diskominfokabupatenbogor',
      color: 'bg-rose-600 text-white hover:bg-rose-700',
      icon: YoutubeIcon,
    },
    {
      name: 'Instagram Diskominfo Kab. Bogor',
      url: 'https://www.instagram.com/diskominfo.bogorkab',
      color: 'bg-rose-600 text-white hover:bg-rose-700',
      icon: InstagramIcon,
    },
    {
      name: 'Facebook Diskominfo Kab. Bogor',
      url: 'https://www.facebook.com/diskominfo.bogorkab',
      color: 'bg-blue-600 text-white hover:bg-blue-700',
      icon: FacebookIcon,
    },
    {
      name: 'Portal Resmi Kabupaten Bogor',
      url: 'https://bogorkab.go.id',
      color: 'bg-emerald-700 text-white hover:bg-emerald-800',
      icon: Globe,
    },
  ];

  return (
    <AppLayout title="Dashboard SIM-BIMTEK">
      <div className="space-y-8 font-sans pb-12">
        
        {/* ========================================================================= */}
        {/* TOP HERO BANNER - BOGOR KABUPATEN OFFICIAL BRANDING                      */}
        {/* ========================================================================= */}
        <div className="relative bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="p-6 sm:p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-3 text-center md:text-left">
              <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-blue-900">
                <Globe className="w-3.5 h-3.5" />
                <span>Sistem Informasi Manajemen BIMTEK Diskominfo</span>
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
                  Selamat Datang, <span className="text-blue-900">{user.name}</span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1 max-w-2xl leading-relaxed">
                  {isAdmin
                    ? 'Panel Administrator Pengelolaan Kegiatan, Verifikasi Administrasi, & Pelaporan Resmi.'
                    : isSpeaker
                    ? 'Portal Narasumber / Pembicara Bimbingan Teknis Kabupaten Bogor.'
                    : 'Portal Peserta Bimbingan Teknis SDM Aparatur & Masyarakat Kabupaten Bogor.'
                  }
                </p>
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                <Link
                  href="/events"
                  className="px-4 py-2.5 rounded-lg bg-amber-400 text-slate-900 text-xs font-bold flex items-center gap-1.5 hover:bg-amber-300 transition-colors active:scale-95 cursor-pointer"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Katalog BIMTEK</span>
                </Link>

                <Link
                  href="/attendance/scan"
                  className="px-4 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-bold flex items-center gap-1.5 border border-slate-200 transition-colors active:scale-95 cursor-pointer"
                >
                  <QrCode className="w-4 h-4 text-slate-500" />
                  <span>Presensi Hari-H</span>
                </Link>

                {isAdmin ? (
                  <Link
                    href="/admin/reports/participants"
                    className="px-4 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-bold flex items-center gap-1.5 border border-slate-200 transition-colors active:scale-95 cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-slate-500" />
                    <span>Pusat Laporan</span>
                  </Link>
                ) : (
                  <Link
                    href="/my-certificates"
                    className="px-4 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-bold flex items-center gap-1.5 border border-slate-200 transition-colors active:scale-95 cursor-pointer"
                  >
                    <Award className="w-4 h-4 text-slate-500" />
                    <span>Sertifikat Saya</span>
                  </Link>
                )}
              </div>
            </div>

            {/* STATS OVERVIEW WIDGET — flat */}
            <div className="w-full md:w-80 bg-slate-50 border border-slate-200 p-5 rounded-lg space-y-3 text-xs shrink-0">
              <div className="font-bold text-slate-900 border-b border-slate-200 pb-2 uppercase text-[10px] tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5" />
                  <span>Ringkasan Akun</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-900 text-white uppercase">
                  {user.role}
                </span>
              </div>

              {isAdmin ? (
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-500">Total BIMTEK:</span>
                    <strong className="text-slate-900 font-mono font-bold">{liveStats?.total_events ?? 0} Kegiatan</strong>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-500">Peserta Terdaftar:</span>
                    <strong className="text-slate-900 font-mono font-bold">{liveStats?.total_participants ?? 0} Orang</strong>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-500">Presensi Hari Ini:</span>
                    <strong className="text-slate-900 font-mono font-bold">{liveStats?.today_attendances ?? 0} Hadir</strong>
                  </div>
                </div>
              ) : isSpeaker ? (
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-500">Penugasan Sesi:</span>
                    <strong className="text-slate-900 font-mono font-bold">{myTeachingSchedule?.length ?? 0} BIMTEK</strong>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-500">Sertifikat Narsum:</span>
                    <strong className="text-slate-900 font-mono font-bold">Tersedia</strong>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-500">BIMTEK Diikuti:</span>
                    <strong className="text-slate-900 font-mono font-bold">{myRegistrations?.length ?? 0} Kegiatan</strong>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-500">Status Akun:</span>
                    <strong className="text-emerald-700 font-bold">Aktif</strong>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* REAL-TIME NOTIFICATION TOAST FOR ADMIN */}
        {isAdmin && (
          <RealtimeToast notification={latestNotification} onClose={clearNotification} />
        )}

        {/* ======================= 1. ADMIN DASHBOARD FLOW ======================= */}
        {isAdmin && (
          <div className="space-y-6">
            
            {/* REAL-TIME STATUS HEADER */}
            <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Status Pemantauan Sistem:</span>
                <LiveConnectionBadge isConnected={isConnected} />
              </div>
              <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
                Data pendaftaran dan presensi terupdate secara otomatis & real-time
              </span>
            </div>

            {/* STATS METRIC CARDS */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href="/events" className="bg-white border border-slate-200 hover:border-blue-900 p-5 rounded-2xl shadow-xs hover:shadow-md transition-all group flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 font-extrabold uppercase block group-hover:text-blue-900">Total Kegiatan</span>
                  <strong className="text-2xl font-black text-slate-900 mt-1 block">{liveStats?.total_events ?? 0}</strong>
                  <span className="text-[10px] text-blue-900 font-bold mt-1 inline-flex items-center gap-0.5">Kelola Event &rarr;</span>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-900 group-hover:bg-blue-900 group-hover:text-white flex items-center justify-center font-bold transition-colors">
                  <Calendar className="w-5 h-5" />
                </div>
              </Link>

              <Link href="/admin/reports/participants" className="bg-white border border-slate-200 hover:border-emerald-600 p-5 rounded-2xl shadow-xs hover:shadow-md transition-all group flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 font-extrabold uppercase block group-hover:text-emerald-700">Total Peserta</span>
                  <strong className="text-2xl font-black text-emerald-700 mt-1 block">{liveStats?.total_participants ?? 0}</strong>
                  <span className="text-[10px] text-emerald-800 font-bold mt-1 inline-flex items-center gap-0.5">Lihat Data &rarr;</span>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 group-hover:bg-emerald-700 group-hover:text-white flex items-center justify-center font-bold transition-colors">
                  <Users className="w-5 h-5" />
                </div>
              </Link>

              <Link href="/admin/speakers" className="bg-white border border-slate-200 hover:border-amber-500 p-5 rounded-2xl shadow-xs hover:shadow-md transition-all group flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 font-extrabold uppercase block group-hover:text-amber-700">Master Narsum</span>
                  <strong className="text-2xl font-black text-amber-700 mt-1 block">{liveStats?.total_speakers ?? 0}</strong>
                  <span className="text-[10px] text-amber-800 font-bold mt-1 inline-flex items-center gap-0.5">Data Pembicara &rarr;</span>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-700 group-hover:bg-amber-500 group-hover:text-white flex items-center justify-center font-bold transition-colors">
                  <UserCheck className="w-5 h-5" />
                </div>
              </Link>

              <Link href="/attendance/scan" className="bg-white border border-slate-200 hover:border-purple-600 p-5 rounded-2xl shadow-xs hover:shadow-md transition-all group flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 font-extrabold uppercase block group-hover:text-purple-700">Presensi Hari Ini</span>
                  <strong className="text-2xl font-black text-purple-700 mt-1 block">{liveStats?.today_attendances ?? 0}</strong>
                  <span className="text-[10px] text-purple-800 font-bold mt-1 inline-flex items-center gap-0.5">Scan Presensi &rarr;</span>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-700 group-hover:bg-purple-700 group-hover:text-white flex items-center justify-center font-bold transition-colors">
                  <QrCode className="w-5 h-5" />
                </div>
              </Link>
            </div>

            {/* QUICK SHORTCUTS ROW */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Link href="/admin/verifications" className="p-4 bg-white border border-slate-200 hover:border-blue-900 rounded-2xl flex items-center gap-3 transition-all group">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <strong className="text-xs font-black text-slate-900 block group-hover:text-blue-900">Verifikasi Berkas</strong>
                  <span className="text-[10px] text-slate-500">KTP, NPWP & Bank</span>
                </div>
              </Link>

              <Link href="/admin/payments" className="p-4 bg-white border border-slate-200 hover:border-blue-900 rounded-2xl flex items-center gap-3 transition-all group">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center shrink-0 group-hover:bg-blue-900 group-hover:text-white transition-colors">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <strong className="text-xs font-black text-slate-900 block group-hover:text-blue-900">Honor & PPh 21</strong>
                  <span className="text-[10px] text-slate-500">Kalkulator Pajak</span>
                </div>
              </Link>

              <Link href="/admin/certificates" className="p-4 bg-white border border-slate-200 hover:border-blue-900 rounded-2xl flex items-center gap-3 transition-all group">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <strong className="text-xs font-black text-slate-900 block group-hover:text-blue-900">Sertifikat Digital</strong>
                  <span className="text-[10px] text-slate-500">Kelola & Hubungkan</span>
                </div>
              </Link>

              <Link href="/admin/reports/participants" className="p-4 bg-white border border-slate-200 hover:border-blue-900 rounded-2xl flex items-center gap-3 transition-all group">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center shrink-0 group-hover:bg-amber-400 group-hover:text-blue-950 transition-colors">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <strong className="text-xs font-black text-slate-900 block group-hover:text-blue-900">Pusat Laporan</strong>
                  <span className="text-[10px] text-slate-500">Cetak Berita Acara</span>
                </div>
              </Link>
            </div>

            {/* DYNAMIC BIMTEK EVENTS LIST FOR ADMIN */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-xs font-black text-slate-900 flex items-center gap-2 uppercase tracking-wider">
                  <Calendar className="w-4 h-4 text-blue-900" />
                  <span>Daftar Kegiatan BIMTEK Aktif</span>
                </h2>
                <Link 
                  href="/events"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-extrabold shadow-xs transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Kelola Kegiatan BIMTEK</span>
                </Link>
              </div>

              {eventsList.length === 0 ? (
                <div className="text-center py-10 px-4 bg-slate-50 border border-dashed border-slate-200 rounded-2xl space-y-3">
                  <Calendar className="w-10 h-10 text-slate-400 mx-auto" />
                  <div>
                    <h3 className="text-xs font-bold text-slate-700">Belum Ada Kegiatan BIMTEK</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Database telah dikosongkan. Silakan buat kegiatan BIMTEK baru untuk memulai pengujian alur pendaftaran, narasumber, presensi, dan sertifikat.</p>
                  </div>
                  <Link
                    href="/events"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-blue-950 text-xs font-black shadow-xs transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Buat Kegiatan BIMTEK Baru</span>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {eventsList.map((ev) => (
                    <div key={ev.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          (ev.computed_status || ev.status) === 'open' ? 'bg-emerald-100 text-emerald-800'
                          : (ev.computed_status || ev.status) === 'completed' ? 'bg-slate-100 text-slate-600'
                          : 'bg-blue-100 text-blue-800'
                        }`}>
                          {(ev.computed_status || ev.status)}
                        </span>
                        <span className="text-[11px] font-bold text-slate-500">{ev.registrations_count || 0} Pendaftar</span>
                      </div>
                      <div>
                        <h3 className="text-xs font-extrabold text-slate-900 leading-snug">{ev.title}</h3>
                        <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{ev.location}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60">
                        <Link
                          href={`/admin/events/${ev.id}/qr-event`}
                          className="flex-1 py-2 px-3 rounded-xl bg-blue-900 hover:bg-blue-950 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-xs transition-all"
                        >
                          <QrCode className="w-3.5 h-3.5 text-amber-400" />
                          <span>Layar QR Proyektor</span>
                        </Link>
                        <Link
                          href={`/attendance/scan?event_id=${ev.id}`}
                          className="py-2 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-xs transition-all"
                        >
                          <span>Rekap &rarr;</span>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* ======================= 2. PEMBICARA DASHBOARD FLOW ======================= */}
        {isSpeaker && (
          <div className="space-y-6">
            
            {/* SPEAKER PENUGASAN CARD */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Mic className="w-5 h-5 text-purple-700" />
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                    Jadwal & Penugasan Sesi Mengajar BIMTEK
                  </h2>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-purple-100 text-purple-800 border border-purple-200">
                  Narasumber Resmi
                </span>
              </div>

              {myTeachingSchedule.length === 0 ? (
                <div className="text-center py-10 px-4 bg-slate-50 border border-dashed border-slate-200 rounded-2xl space-y-3">
                  <Mic className="w-10 h-10 text-slate-400 mx-auto" />
                  <div>
                    <h3 className="text-xs font-bold text-slate-700">Belum Ada Penugasan Mengajar Aktif</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Silakan buka Katalog BIMTEK untuk memilih kegiatan yang akan Anda bimbing dan lengkapi berkas persyaratannya.</p>
                  </div>
                  <Link
                    href="/events"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-blue-950 text-xs font-black shadow-xs transition-all"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Jelajahi Katalog BIMTEK</span>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {myTeachingSchedule.map((ts, idx) => (
                    <div key={idx} className="p-5 bg-purple-50/50 border border-purple-200/80 rounded-2xl space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-200 text-purple-900">
                          Sesi Aktif
                        </span>
                        <span className="text-xs font-bold text-slate-500">{ts.jp_hours || 2} JP</span>
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-900">{ts.event?.title}</h3>
                        <p className="text-xs text-purple-900 font-bold mt-1">Topik: {ts.topic || 'Pemaparan Materi Narasumber'}</p>
                        <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{ts.event?.location || 'Diskominfo Kab. Bogor'}</span>
                        </p>
                      </div>
                      <div className="pt-2 border-t border-purple-200/60 flex items-center gap-2">
                        <Link
                          href="/attendance/scan"
                          className="flex-1 py-2 px-3 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-xs"
                        >
                          <Camera className="w-3.5 h-3.5 text-amber-300" />
                          <span>Presensi Mengajar Hari-H</span>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SPEAKER QUICK SHORTCUTS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Link href="/my-certificates" className="p-5 bg-white border border-slate-200 hover:border-blue-900 rounded-3xl shadow-xs hover:shadow-md transition-all flex items-center gap-3.5 group">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center text-xl shrink-0 group-hover:bg-amber-400 group-hover:text-blue-950 transition-colors">
                  🏆
                </div>
                <div>
                  <strong className="text-xs font-black text-slate-900 block group-hover:text-blue-900">Sertifikat Narasumber</strong>
                  <span className="text-[11px] text-slate-500">Unduh Piagam Resmi PDF</span>
                </div>
              </Link>

              <Link href="/events" className="p-5 bg-white border border-slate-200 hover:border-blue-900 rounded-3xl shadow-xs hover:shadow-md transition-all flex items-center gap-3.5 group">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-xl shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  📚
                </div>
                <div>
                  <strong className="text-xs font-black text-slate-900 block group-hover:text-blue-900">Katalog BIMTEK</strong>
                  <span className="text-[11px] text-slate-500">Konfirmasi Penugasan Event</span>
                </div>
              </Link>

              <Link href="/attendance/scan" className="p-5 bg-white border border-slate-200 hover:border-blue-900 rounded-3xl shadow-xs hover:shadow-md transition-all flex items-center gap-3.5 group">
                <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center text-xl shrink-0 group-hover:bg-purple-700 group-hover:text-white transition-colors">
                  📸
                </div>
                <div>
                  <strong className="text-xs font-black text-slate-900 block group-hover:text-blue-900">Presensi Hari-H</strong>
                  <span className="text-[11px] text-slate-500">Scan QR Lokasi Kegiatan</span>
                </div>
              </Link>
            </div>

          </div>
        )}

        {/* ======================= 3. PESERTA DASHBOARD FLOW ======================= */}
        {!isAdmin && !isSpeaker && (
          <div className="space-y-6">
            
            {/* GUIDED WORKFLOW ACTION HUB FOR PARTICIPANT */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Link 
                href="/events" 
                className="p-5 bg-white border border-slate-200 hover:border-blue-900 rounded-3xl shadow-xs hover:shadow-md transition-all group flex items-start gap-4"
              >
                <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-900 flex items-center justify-center font-bold text-lg shrink-0 group-hover:bg-blue-900 group-hover:text-white transition-colors">
                  1
                </div>
                <div>
                  <strong className="text-xs font-black text-slate-900 block group-hover:text-blue-900">1. Registrasi Kegiatan</strong>
                  <p className="text-[11px] text-slate-500 mt-1">Pilih kegiatan BIMTEK yang sesuai dan daftarkan diri Anda.</p>
                </div>
              </Link>

              <Link 
                href="/attendance/scan" 
                className="p-5 bg-white border border-slate-200 hover:border-blue-900 rounded-3xl shadow-xs hover:shadow-md transition-all group flex items-start gap-4"
              >
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-lg shrink-0 group-hover:bg-emerald-700 group-hover:text-white transition-colors">
                  2
                </div>
                <div>
                  <strong className="text-xs font-black text-slate-900 block group-hover:text-blue-900">2. Presensi Hari-H</strong>
                  <p className="text-[11px] text-slate-500 mt-1">Scan QR Code dinamis yang ditampilkan proyektor di lokasi kegiatan.</p>
                </div>
              </Link>

              <Link 
                href="/my-certificates" 
                className="p-5 bg-white border border-slate-200 hover:border-blue-900 rounded-3xl shadow-xs hover:shadow-md transition-all group flex items-start gap-4"
              >
                <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-lg shrink-0 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                  3
                </div>
                <div>
                  <strong className="text-xs font-black text-slate-900 block group-hover:text-blue-900">3. Unduh Sertifikat</strong>
                  <p className="text-[11px] text-slate-500 mt-1">Dapatkan sertifikat digital resmi bertanda tangan elektronik.</p>
                </div>
              </Link>
            </div>

            {/* MY REGISTRATIONS TABLE */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-900" />
                  <span>Kegiatan BIMTEK yang Anda Ikuti</span>
                </h2>
                <Link href="/events" className="text-[11px] font-extrabold text-blue-900 hover:underline">
                  + Daftar Kegiatan Baru
                </Link>
              </div>

              {myRegistrations.length === 0 ? (
                <div className="text-center py-10 px-4 bg-slate-50 border border-dashed border-slate-200 rounded-2xl space-y-3">
                  <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
                  <div>
                    <h3 className="text-xs font-bold text-slate-700">Belum Ada Kegiatan yang Diikuti</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Jelajahi katalog kegiatan BIMTEK yang tersedia untuk mendaftarkan diri Anda.</p>
                  </div>
                  <Link
                    href="/events"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-extrabold shadow-xs transition-all cursor-pointer"
                  >
                    <span>Buka Katalog BIMTEK &rarr;</span>
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {myRegistrations.map((reg) => (
                    <div key={reg.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-100 text-emerald-800">
                            Terdaftar
                          </span>
                          <span className="text-[11px] font-mono text-slate-400">#{reg.registration_code}</span>
                        </div>
                        <h4 className="text-xs font-extrabold text-slate-900 mt-1">{reg.event?.title}</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{reg.event?.location}</span>
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {reg.event?.event_speakers && reg.event.event_speakers.some(es => es.material_path) ? (
                          <button
                            type="button"
                            onClick={() => {
                              const targetEs = reg.event.event_speakers.find(es => es.material_path);
                              if (targetEs) {
                                window.location.href = `/materials/download/${targetEs.id}`;
                              }
                            }}
                            className="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                            title="Unduh Berkas Materi Presentasi Pemateri"
                          >
                            <FolderDown className="w-3.5 h-3.5 text-amber-300" />
                            <span>Unduh Materi (PPT/PDF)</span>
                          </button>
                        ) : (
                          <Link
                            href={`/events/${reg.event?.id}`}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1 border border-slate-300"
                          >
                            <BookOpen className="w-3.5 h-3.5 text-blue-900" />
                            <span>Lihat Materi</span>
                          </Link>
                        )}

                        <Link
                          href={`/registrations/${reg.id}/ticket`}
                          className="px-3 py-1.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold flex items-center gap-1 shadow-xs"
                        >
                          <QrCode className="w-3.5 h-3.5 text-amber-400" />
                          <span>Tiket Presensi QR</span>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </AppLayout>
  );
}
