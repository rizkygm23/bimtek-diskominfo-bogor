import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import { QRCodeSVG } from 'qrcode.react';
import axios from 'axios';
import { 
  ArrowLeft, 
  Printer, 
  Sparkles, 
  MapPin, 
  Calendar, 
  CheckCircle2, 
  Maximize2, 
  Minimize2, 
  RefreshCw, 
  Clock, 
  Users,
  ShieldCheck,
  Flame,
  Zap,
  Radio
} from 'lucide-react';
import LiveConnectionBadge from '@/Components/LiveConnectionBadge';

export default function AdminEventQr({ event, session: initialSession, attendancesCount: initialAttendancesCount }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [session, setSession] = useState(initialSession);
  const [countdown, setCountdown] = useState(initialSession?.remaining_seconds > 0 ? initialSession.remaining_seconds : 600);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [attendancesCount, setAttendancesCount] = useState(initialAttendancesCount || 0);
  const [intervalMinutes, setIntervalMinutes] = useState(initialSession?.interval_minutes || 10);
  const [latestCheckIn, setLatestCheckIn] = useState(null);
  const [isConnected, setIsConnected] = useState(true);

  const qrContainerRef = useRef(null);
  const isRefreshingRef = useRef(false);

  // QR payload: JSON with token + event_id for participants/speakers scanner
  const qrPayload = JSON.stringify({
    token: session?.token,
    event_id: event.id,
  });

  // Fetch / Rotate QR session seamlessly via Axios
  const handleRefreshQr = useCallback(async (customInterval = null) => {
    if (isRefreshingRef.current) return;
    isRefreshingRef.current = true;
    setIsRefreshing(true);

    try {
      const response = await axios.post(`/admin/events/${event.id}/qr-session`, {
        interval: customInterval || intervalMinutes || 10,
      });

      if (response.data?.success && response.data?.session) {
        setSession(response.data.session);
        setCountdown(response.data.session.remaining_seconds || (intervalMinutes * 60));
      }
    } catch (err) {
      console.error('Error refreshing QR session:', err);
    } finally {
      setIsRefreshing(false);
      isRefreshingRef.current = false;
    }
  }, [event.id, intervalMinutes]);

  // Pre-emptive & continuous countdown timer (seamless hot-swap without lag)
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        // When 3 seconds remaining, trigger background refresh so screen never goes blank/expired
        if (prev <= 3 && !isRefreshingRef.current) {
          handleRefreshQr();
        }
        if (prev <= 1) {
          return 1; // Hold on active token until new one replaces it
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [handleRefreshQr]);

  // If initialSession is missing or expired on page load, trigger instant refresh immediately
  useEffect(() => {
    if (!initialSession?.token || initialSession?.remaining_seconds <= 5) {
      handleRefreshQr();
    }
  }, []);

  // REAL-TIME EVENT STREAM LISTENER (Live projector updates when participant checks in)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let isSubscribed = true;
    const lastTimeRef = Date.now() / 1000;
    const processedEvents = new Set();
    let intervalId = null;

    const pollRealtime = async () => {
      try {
        const response = await axios.get('/admin/realtime-poll', {
          params: { since: lastTimeRef },
          timeout: 4000,
        });

        if (!isSubscribed) return;
        setIsConnected(true);

        const data = response.data;
        if (Array.isArray(data?.events) && data.events.length > 0) {
          data.events.forEach((ev) => {
            if (processedEvents.has(ev.id)) return;
            processedEvents.add(ev.id);

            if (ev.event === 'AttendanceRecorded') {
              const attData = ev.data;
              if (Number(attData.event_id) === Number(event.id)) {
                setAttendancesCount((prev) => prev + 1);
                setLatestCheckIn(attData);

                // Auto clear highlight after 6 seconds
                setTimeout(() => {
                  setLatestCheckIn((current) => (current?.user_id === attData.user_id ? null : current));
                }, 6000);
              }
            }
          });
        }
      } catch (err) {
        if (isSubscribed && err.response?.status !== 403) {
          setIsConnected(false);
        }
      }
    };

    intervalId = setInterval(pollRealtime, 2500);

    return () => {
      isSubscribed = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [event.id]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handlePrint = () => {
    window.print();
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (qrContainerRef.current?.requestFullscreen) {
        qrContainerRef.current.requestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const formattedDate = event?.start_date
    ? new Date(event.start_date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : '-';

  const maxTotalSeconds = intervalMinutes * 60;
  const progressPercent = Math.min(100, Math.max(0, (countdown / maxTotalSeconds) * 100));

  return (
    <AppLayout title={`Layar Proyektor QR Presensi - ${event.title}`}>
      <div className="space-y-6 font-sans w-full max-w-5xl mx-auto px-2 sm:px-4">

        {/* ACTION TOOLBAR */}
        <div className="flex items-center justify-between gap-3 flex-wrap print:hidden bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <Link href="/attendance/scan" className="inline-flex items-center gap-1.5 text-xs text-blue-900 font-black hover:underline">
            <ArrowLeft className="w-4 h-4" /> Kembali ke Panel Presensi
          </Link>

          {/* DURATION SELECTOR */}
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-slate-600 hidden sm:inline">Interval Rotasi:</span>
            <select
              value={intervalMinutes}
              onChange={(e) => {
                const newInterval = Number(e.target.value);
                setIntervalMinutes(newInterval);
                handleRefreshQr(newInterval);
              }}
              className="bg-slate-50 border border-slate-300 font-black text-blue-950 px-3 py-1.5 rounded-xl text-xs outline-none cursor-pointer"
            >
              <option value={5}>⏱ 5 Menit</option>
              <option value={10}>⏱ 10 Menit (Standar)</option>
              <option value={15}>⏱ 15 Menit</option>
              <option value={30}>⏱ 30 Menit</option>
              <option value={60}>⏱ 1 Jam</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleRefreshQr()}
              disabled={isRefreshing}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-transform active:scale-95 disabled:opacity-50"
              title="Perbarui QR Code sekarang tanpa jeda"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Memperbarui...' : 'Refresh QR Instan'}</span>
            </button>

            <button
              onClick={toggleFullscreen}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-blue-950 font-black text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-transform active:scale-95"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              <span>{isFullscreen ? 'Keluar Fullscreen' : '⛶ Layar Penuh'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-900 text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-blue-800 shadow-md cursor-pointer"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>Cetak</span>
            </button>
          </div>
        </div>

        {/* TODO: flatten hero — see PageHeader.jsx (QR projector card: needs solid bg-slate-900 for print contrast, not gradient) */}
        <div
          ref={qrContainerRef}
          className={`bg-gradient-to-b from-blue-950 via-slate-900 to-blue-900 text-white border-4 border-amber-400 rounded-3xl p-6 md:p-10 shadow-2xl text-center space-y-6 print:border-slate-900 print:text-slate-900 print:bg-white transition-all relative overflow-hidden ${
            isFullscreen ? 'fixed inset-0 z-50 rounded-none border-none p-6 md:p-12 overflow-y-auto flex flex-col justify-center items-center h-screen w-screen' : ''
          }`}
        >

          {/* Fullscreen exit button */}
          {isFullscreen && (
            <button
              onClick={toggleFullscreen}
              className="fixed top-5 right-5 z-50 px-4 py-2 bg-amber-400 text-blue-950 text-xs font-black rounded-2xl shadow-2xl flex items-center gap-2 border-2 border-white cursor-pointer hover:bg-amber-300 transition-all"
            >
              <Minimize2 className="w-4 h-4" />
              <span>Keluar Fullscreen (Esc)</span>
            </button>
          )}

          {/* CELEBRATORY REAL-TIME CHECK-IN BANNER */}
          {latestCheckIn && (
            <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-slate-950 px-6 py-3 rounded-full shadow-2xl border-2 border-white flex items-center gap-2.5 font-black text-sm animate-bounce">
              <Sparkles className="w-5 h-5 text-amber-950" />
              <span>🎉 {latestCheckIn.participant_name} ({latestCheckIn.role_label}) Berhasil Presensi!</span>
            </div>
          )}

          {/* HEADER BRANDING */}
          <div className="space-y-3 w-full max-w-3xl mx-auto">
            <div className="bg-white px-6 py-2 rounded-2xl shadow-xl border border-slate-200 inline-block mx-auto">
              <img
                src="/images/logo_diskominfo_bogorkab.png"
                alt="Logo Diskominfo Kabupaten Bogor"
                className="h-10 md:h-14 object-contain mx-auto"
              />
            </div>

            <div className="flex items-center justify-center gap-2 pt-1">
              <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-amber-400 text-blue-950 text-xs font-black uppercase tracking-wider shadow-md">
                <Sparkles className="w-4 h-4" />
                <span>QR CODE PRESENSI RESMI HARI-H</span>
              </div>
              <LiveConnectionBadge isConnected={isConnected} />
            </div>

            <h1 className="text-xl md:text-3xl font-black text-white leading-snug max-w-2xl mx-auto pt-1">
              {event.title}
            </h1>

            <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-blue-200 pt-0.5 font-medium">
              <span className="flex items-center gap-1 font-bold"><Calendar className="w-3.5 h-3.5 text-amber-400" /> {formattedDate}</span>
              <span>&bull;</span>
              <span className="flex items-center gap-1 font-bold"><MapPin className="w-3.5 h-3.5 text-emerald-400" /> {event.location}</span>
            </div>
          </div>

          {/* CRISP QR CODE DISPLAY */}
          <div className="w-full max-w-md mx-auto">
            <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-2xl border-4 border-amber-300 text-center relative group">
              
              <QRCodeSVG
                value={qrPayload}
                size={isFullscreen ? 320 : 260}
                level="H"
                includeMargin={true}
                className="mx-auto max-w-full h-auto drop-shadow-xs"
              />

              {/* ROTATING SECURITY BADGE */}
              <div className="mt-4 flex flex-col items-center gap-2">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black bg-blue-50 text-blue-950 border border-blue-200 shadow-xs">
                  <Clock className="w-4 h-4 text-blue-800 animate-pulse" />
                  <span>Masa Berlaku QR: <strong className="font-mono text-sm text-blue-900">{formatTime(countdown)}</strong></span>
                </div>

                {/* PROGRESS BAR */}
                {/* TODO: flatten hero — see PageHeader.jsx (progress bar: bg-blue-900, not rainbow gradient) */}
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-blue-600 transition-all duration-1000 ease-linear rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
              </div>

              <p className="text-xs text-slate-500 font-bold mt-3">
                Peserta & Narasumber: Buka kamera HP & scan QR ini untuk presensi.
              </p>
            </div>
          </div>

          {/* LIVE ATTENDANCE SUMMARY PILL */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-black text-white shadow-md">
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Total Tercatat: <strong className="text-amber-400 font-mono text-sm">{attendancesCount}</strong> Orang Hadir</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-blue-200">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Rotasi Auto-Refresh: {intervalMinutes} Menit</span>
            </div>
          </div>

          {/* PETUNJUK RESMI */}
          <div className="max-w-xl mx-auto bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 text-xs text-blue-100 leading-relaxed font-medium">
            <p className="font-bold text-white flex items-center justify-center gap-1.5 mb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Petunjuk Presensi Hari-H:</span>
            </p>
            Buka menu <strong className="text-amber-300">"Presensi Hari-H"</strong> pada HP Anda. Nyalakan kamera lalu scan QR Code di atas. Sistem akan otomatis memvalidasi token dinamis dan mencatat kehadiran Anda secara instan.
          </div>

        </div>

      </div>
    </AppLayout>
  );
}
