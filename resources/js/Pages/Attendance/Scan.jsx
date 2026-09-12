import React, { useState, useRef, useEffect } from 'react';
import { usePage, router, Link, useForm } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import {
  QrCode,
  CheckCircle2,
  Clock,
  Camera,
  RefreshCw,
  AlertCircle,
  FileSpreadsheet,
  StopCircle,
  Calendar,
  MapPin,
  BookOpen,
  Award,
  Lock,
  ArrowRight,
  FileText,
  UserCheck,
  UserPlus,
  Search
} from 'lucide-react';

export default function Scan({ events, myEvents, selectedEventId, recentAttendances, eventRegistrations, myAttendances, gatekeeperStatus }) {
  const { auth, flash } = usePage().props;
  const user = auth?.user || {};
  const isAdmin = user.role === 'admin';

  // Untuk peserta/pembicara, gunakan myEvents atau fallback ke events
  const availableEvents = (events && events.length > 0) ? events : (myEvents || []);
  const [activeEventId, setActiveEventId] = useState(selectedEventId || myEvents?.[0]?.id || availableEvents[0]?.id || '');
  const activeEvent = availableEvents.find(e => Number(e.id) === Number(activeEventId)) || availableEvents[0];

  const [cameraActive, setCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState('environment');
  const [cameraError, setCameraError] = useState(null);
  const [scannedSuccess, setScannedSuccess] = useState(false);
  const html5QrCodeRef = useRef(null);
  const processingRef = useRef(false);

  // State untuk presensi manual admin
  const [manualSearch, setManualSearch] = useState('');
  const [manualPage, setManualPage] = useState(1);
  const MANUAL_PAGE_SIZE = 20;
  const [manualNotes, setManualNotes] = useState({});
  const [manualProcessing, setManualProcessing] = useState({});

  // State untuk peserta on-the-spot hari-H (admin)
  // Akun dibuat otomatis (password = email), terdaftar ke event, & dicatat hadir.
  const [showOnSpotModal, setShowOnSpotModal] = useState(false);
  const onSpotForm = useForm({
    name: '',
    email: '',
    nip_nik: '',
    instansi: 'Masyarakat Umum',
    no_hp: '',
    notes: '',
    event_id: '',
  });

  const openOnSpotModal = () => {
    onSpotForm.setData({
      name: '',
      email: '',
      nip_nik: '',
      instansi: 'Masyarakat Umum',
      no_hp: '',
      notes: '',
      event_id: activeEventId || activeEvent?.id || '',
    });
    setShowOnSpotModal(true);
  };

  const handleOnSpotSubmit = (e) => {
    e.preventDefault();
    // Pastikan event_id terisi dari activeEventId terbaru
    onSpotForm.setData('event_id', activeEventId || activeEvent?.id || '');
    onSpotForm.post('/admin/attendance/on-the-spot', {
      preserveScroll: true,
      preserveState: false,
      onSuccess: () => {
        setShowOnSpotModal(false);
        onSpotForm.reset();
      },
    });
  };

  const handleManualCheckIn = (userId, name) => {
    const note = (manualNotes[userId] || '').trim();
    if (!note) {
      alert('Mohon isi catatan/keterangan presensi manual untuk ' + name + ' terlebih dahulu (wajib).');
      return;
    }
    setManualProcessing(prev => ({ ...prev, [userId]: true }));
    router.post('/admin/attendance/manual', {
      event_id: activeEventId || activeEvent?.id,
      user_id: userId,
      notes: note,
    }, {
      preserveScroll: true,
      preserveState: false,
      onFinish: () => {
        setManualProcessing(prev => ({ ...prev, [userId]: false }));
        setManualNotes(prev => ({ ...prev, [userId]: '' }));
      },
    });
  };

  // Switch event: re-fetch server data dengan event_id baru.
  // Controller scanView baca dari $request->query('event_id'), jadi kirim GET.
  // Untuk admin: re-fetch recentAttendances + eventRegistrations.
  // Untuk peserta/pembicara: re-fetch myAttendances + gatekeeperStatus.
  const handleEventSwitch = (newEventId) => {
    setActiveEventId(newEventId);
    router.get('/attendance/scan', { event_id: newEventId }, {
      preserveState: true,
      preserveScroll: true,
      replace: true,
    });
  };

  const filteredRegistrations = (eventRegistrations || []).filter(reg => {
    if (!manualSearch.trim()) return true;
    const q = manualSearch.toLowerCase();
    return (
      (reg.name || '').toLowerCase().includes(q) ||
      (reg.nip_nik || '').toLowerCase().includes(q) ||
      (reg.instansi || '').toLowerCase().includes(q) ||
      (reg.registration_code || '').toLowerCase().includes(q)
    );
  });
  const pagedRegistrations = filteredRegistrations.slice(0, manualPage * MANUAL_PAGE_SIZE);
  const hasMorePages = pagedRegistrations.length < filteredRegistrations.length;

  // Play auditory feedback beep
  const playBeep = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);
    } catch (e) {
      // Audio context not allowed or failed
    }
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (html5QrCodeRef.current) {
        await html5QrCodeRef.current.stop().catch(() => {});
      }

      const { Html5Qrcode } = await import('html5-qrcode');
      const html5QrCode = new Html5Qrcode("qr-reader-container");
      html5QrCodeRef.current = html5QrCode;
      setCameraActive(true);

      await html5QrCode.start(
        { facingMode },
        { fps: 15, qrbox: { width: 260, height: 260 } },
        (decodedText) => {
          if (processingRef.current) return;
          processingRef.current = true;
          setScannedSuccess(true);
          playBeep();
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([100, 50, 100]);
          }
          handleQrCheckin(decodedText);
          if (html5QrCodeRef.current) {
            html5QrCodeRef.current.stop().then(() => setCameraActive(false)).catch(() => setCameraActive(false));
          }
        },
        () => {}
      );
    } catch (err) {
      setCameraError('Izin kamera ditolak atau peramban membatasi kamera pada jaringan HTTP lokal. Jika kamera bermasalah, mohon hubungi Admin untuk dicatatkan presensi secara manual.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (html5QrCodeRef.current) {
      html5QrCodeRef.current.stop().then(() => setCameraActive(false)).catch(() => setCameraActive(false));
    } else {
      setCameraActive(false);
    }
  };

  const toggleCameraFacing = () => {
    stopCamera();
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const handleQrCheckin = (qrData) => {
    router.post('/attendance/check-in', {
      event_id: activeEventId || activeEvent?.id,
      token: qrData,
      method: 'qr_scan',
    }, {
      preserveScroll: true,
      preserveState: false,
      onFinish: () => {
        processingRef.current = false;
        setScannedSuccess(false);
      },
    });
  };

  const fileInputRef = useRef(null);

  const handleImageFileScan = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCameraError(null);
    let html5QrCode = null;
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      // PENTING: gunakan container khusus file-scan yang SELALU ada di DOM
      // dengan dimensi nyata (offscreen, bukan display:none). Sebelumnya pakai
      // "qr-reader-container" yang ber-class hidden (display:none) saat kamera
      // mati — html5-qrcode bikin <img>+<canvas> internal di container itu,
      // tapi browser report dimensi 0 untuk elemen di display:none → decode
      // gagal → "QR Code tidak terdeteksi". Itu sebabnya foto tidak pernah
      // berhasil padahal live kamera (elemen sama tapi visible) aman.
      html5QrCode = new Html5Qrcode("qr-file-scan-container");
      const decodedText = await html5QrCode.scanFile(file, false);
      playBeep();
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
      handleQrCheckin(decodedText);
    } catch (err) {
      setCameraError('QR Code tidak terdeteksi pada foto tersebut. Pastikan foto QR Code tegak, fokus, dan kontras tinggi. Anda bisa ambil foto ulang, atau gunakan tombol "Live Kamera HP" di samping. Jika tetap bermasalah, mohon hubungi Admin untuk dicatatkan presensi secara manual.');
    } finally {
      // Cleanup: bersihkan <img>/<canvas> internal yang scanFile tinggalkan di
      // container, supaya tidak menumpuk kalau user scan foto berkali-kali.
      if (html5QrCode) {
        try { await html5QrCode.clear(); } catch {}
        const c = document.getElementById("qr-file-scan-container");
        if (c) c.innerHTML = '';
      }
      // Reset input value supaya event change tetap fire untuk file yang sama.
      if (e.target) e.target.value = '';
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
  };

  // Format timestamp aman dari format MySQL "YYYY-MM-DD HH:MM:SS" (spasi, bukan
  // T). Sebagian browser (WebKit/iOS) menganggap itu Invalid Date. Normalisasi
  // ke ISO 8601 dulu sebelum new Date(). Plus guard null/undefined.
  const formatTimestamp = (ts) => {
    if (!ts) return '-';
    try {
      const iso = String(ts).includes('T') ? ts : String(ts).replace(' ', 'T');
      const d = new Date(iso);
      return isNaN(d.getTime()) ? '-' : d.toLocaleString('id-ID');
    } catch {
      return '-';
    }
  };

  // Cek apakah sudah presensi untuk event aktif
  const alreadyPresent = myAttendances?.some(att => att.event_id === Number(activeEventId));

  return (
    <AppLayout title="Presensi Hari-H">
      <div className="space-y-6 max-w-5xl mx-auto font-sans">

        {/* HEADER */}
        <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold mb-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Modul Presensi Hari-H (Scan QR Code Kamera HP)</span>
            </div>
            <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Camera className="w-5 h-5 text-blue-900" />
              <span>{isAdmin ? 'Panel Admin Presensi Hari-H' : 'Presensi Hari-H'}</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {isAdmin
                ? 'Kelola dan pantau presensi peserta & narasumber secara real-time.'
                : 'Arahkan kamera HP Anda ke QR Code proyektor Admin untuk mencatat kehadiran secara langsung.'
              }
            </p>
          </div>

          {isAdmin && (
            <div className="flex flex-col sm:flex-row items-end gap-2 shrink-0">
              <div className="w-full sm:w-auto">
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Kegiatan BIMTEK:</label>
                <select
                  value={activeEventId}
                  onChange={(e) => handleEventSwitch(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-extrabold text-slate-900"
                >
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>{ev.title}</option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={() => window.location.href = `/admin/reports/attendance/excel?event_id=${activeEventId}`}
                className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-black flex items-center gap-1.5 shadow-md cursor-pointer transition-transform active:scale-95 whitespace-nowrap"
              >
                <FileSpreadsheet className="w-4 h-4 text-amber-300" />
                <span>Unduh Excel</span>
              </button>
              <button
                type="button"
                onClick={openOnSpotModal}
                disabled={!activeEvent}
                className="px-3.5 py-2 rounded-xl bg-blue-900 hover:bg-blue-950 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                title="Daftar akun + presensi peserta walk-in langsung"
              >
                <UserPlus className="w-4 h-4" />
                <span>Peserta On-the-Spot</span>
              </button>
            </div>
          )}
        </div>

        {/* FLASH MESSAGES */}
        {flash?.error && (
          <div className="bg-rose-50 border-2 border-rose-300 p-4 rounded-3xl text-rose-950 text-xs font-bold flex items-start gap-3 shadow-md animate-fadeIn">
            <AlertCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="block text-sm font-black text-rose-900">Pemberitahuan Presensi:</strong>
              <p className="leading-relaxed text-rose-950">{flash.error}</p>
            </div>
          </div>
        )}
        {flash?.success && (
          <div className="bg-emerald-50 border-2 border-emerald-300 p-4 rounded-3xl text-emerald-950 text-xs font-bold flex items-start gap-3 shadow-md animate-fadeIn">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="block text-sm font-black text-emerald-900">Presensi Berhasil!</strong>
              <p className="leading-relaxed text-emerald-950">{flash.success}</p>
            </div>
          </div>
        )}

        {/* ===================== ADMIN MODE ===================== */}
        {isAdmin ? (
          <div className="space-y-6">
            <div className="bg-blue-900 text-white border-2 border-amber-400 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">PANEL KENDALI ADMIN</span>
                <h2 className="text-base font-black">Layar QR Code Presensi Hari-H</h2>
                <p className="text-xs text-blue-100">Tampilkan QR Code resmi di proyektor untuk di-scan peserta & narasumber.</p>
              </div>
              <Link
                href={`/admin/events/${activeEventId}/qr-event`}
                className="px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-blue-950 text-xs font-black shadow-lg flex items-center gap-2 shrink-0 transition-transform active:scale-95"
              >
                <QrCode className="w-4 h-4" />
                <span>Tampilkan QR Code Proyektor →</span>
              </Link>
            </div>

            {/* KARTU PRESENSI MANUAL */}
            <div className="bg-white border-2 border-amber-300 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-amber-600" />
                  <span>Presensi Manual Peserta</span>
                </h2>
                <span className="text-xs font-black text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                  {(eventRegistrations || []).filter(r => !r.has_attended).length} Belum Hadir
                </span>
              </div>

              <p className="text-[11px] text-slate-600 leading-relaxed">
                Gunakan form ini jika peserta/pembicara mengalami kendala saat scan QR (kamera rusak, QR tidak terbaca, dsb). Pilih peserta, isi keterangan, lalu catat presensi. Presensi manual tercatat dengan metode <strong className="text-slate-800">"manual_admin"</strong> beserta nama Admin yang mencatat.
              </p>

              {/* Search bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={manualSearch}
                  onChange={(e) => { setManualSearch(e.target.value); setManualPage(1); }}
                  placeholder="Cari nama / NIP / instansi / kode pendaftaran..."
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              {/* Daftar peserta terdaftar */}
              {filteredRegistrations.length > 0 ? (
                <div className="space-y-2.5">
                  {pagedRegistrations.map((reg) => (
                    <div
                      key={reg.registration_id}
                      className={`p-3.5 rounded-2xl border space-y-2.5 transition-all ${
                        reg.has_attended
                          ? 'bg-emerald-50 border-emerald-200'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-black text-slate-900 truncate">{reg.name}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold shrink-0 ${
                              reg.role === 'pembicara' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {reg.role === 'pembicara' ? 'Narasumber' : 'Peserta'}
                            </span>
                            {reg.has_attended && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-600 text-white shrink-0 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                Sudah Hadir
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 font-mono">
                            {reg.nip_nik} • {reg.instansi} • {reg.jabatan}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            Kode: {reg.registration_code} • Status: {reg.status}
                          </p>
                        </div>
                      </div>

                      {!reg.has_attended && (
                        <div className="flex flex-col sm:flex-row gap-2 pt-1">
                          <input
                            type="text"
                            value={manualNotes[reg.user_id] || ''}
                            onChange={(e) => setManualNotes(prev => ({ ...prev, [reg.user_id]: e.target.value }))}
                            placeholder="Keterangan (wajib), cth: kamera HP rusak, QR tidak terbaca..."
                            className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-[11px] font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                          />
                          <button
                            type="button"
                            disabled={!!manualProcessing[reg.user_id]}
                            onClick={() => handleManualCheckIn(reg.user_id, reg.name)}
                            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-60 disabled:cursor-not-allowed text-white text-[11px] font-black shadow-md flex items-center justify-center gap-1.5 cursor-pointer transition-transform active:scale-95 whitespace-nowrap"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>{manualProcessing[reg.user_id] ? 'Memproses...' : 'Catat Presensi'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Tombol muat lebih — hanya render jika ada sisa */}
                  {hasMorePages && (
                    <button
                      type="button"
                      onClick={() => setManualPage(p => p + 1)}
                      className="w-full py-2.5 rounded-xl border-2 border-dashed border-slate-300 hover:border-amber-400 text-xs font-bold text-slate-500 hover:text-amber-700 transition-colors cursor-pointer"
                    >
                      Muat {Math.min(MANUAL_PAGE_SIZE, filteredRegistrations.length - pagedRegistrations.length)} peserta lagi
                      ({filteredRegistrations.length - pagedRegistrations.length} tersisa)
                    </button>
                  )}

                  {/* Info jumlah ditampilkan */}
                  {filteredRegistrations.length > MANUAL_PAGE_SIZE && (
                    <p className="text-center text-[10px] text-slate-400">
                      Menampilkan {pagedRegistrations.length} dari {filteredRegistrations.length} peserta
                    </p>
                  )}
                </div>
              ) : (
                <div className="py-10 text-center text-slate-400 space-y-2">
                  <UserCheck className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-xs italic">
                    {manualSearch.trim()
                      ? 'Tidak ada peserta yang cocok dengan pencarian.'
                      : (eventRegistrations || []).length === 0
                        ? 'Belum ada peserta terdaftar pada kegiatan ini.'
                        : 'Semua peserta terdaftar sudah hadir 🎉'}
                  </p>
                </div>
              )}
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Rekap Kehadiran Hari-H</span>
                </h2>
                <span className="text-xs font-black text-blue-900 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                  {recentAttendances?.length || 0} Hadir
                </span>
              </div>

              {recentAttendances && recentAttendances.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-wider font-extrabold text-slate-700">
                      <tr>
                        <th className="p-3">No</th>
                        <th className="p-3">Nama</th>
                        <th className="p-3">Role</th>
                        <th className="p-3">Metode</th>
                        <th className="p-3">Waktu Presensi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {recentAttendances.map((att, idx) => (
                        <tr key={att.id} className="hover:bg-slate-50/80">
                          <td className="p-3 text-slate-500">{idx + 1}</td>
                          <td className="p-3 font-bold text-slate-900">{att.user?.name || 'User'}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                              att.role_type === 'pembicara' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {att.role_type === 'pembicara' ? 'Narasumber' : 'Peserta'}
                            </span>
                          </td>
                          <td className="p-3 text-slate-600 capitalize">{att.checkin_method?.replace('_', ' ') || 'QR Scan'}</td>
                          <td className="p-3 font-mono text-slate-500">{formatTimestamp(att.checked_in_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <Clock className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-xs italic">Belum ada data presensi Hari-H yang terekam.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ===================== PESERTA & PEMBICARA ===================== */
          <div className="space-y-6">

            {/* INFO KEGIATAN YANG DIIKUTI — flat, no gradient */}
            {activeEvent ? (
              <div className="bg-white border border-slate-200 rounded-lg p-5 md:p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-blue-900 text-white flex items-center justify-center shrink-0">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <span className="text-[10px] font-semibold uppercase text-blue-900 tracking-wider">
                      {user.role === 'pembicara' ? 'ANDA BERTUGAS SEBAGAI NARASUMBER PADA:' : 'KEGIATAN BIMTEK YANG DIIKUTI:'}
                    </span>
                    <h2 className="text-lg md:text-xl font-bold text-slate-900 leading-snug">{activeEvent.title}</h2>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-0.5">
                      <span className="flex items-center gap-1 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatDate(activeEvent.start_date)}</span>
                      </span>
                      {activeEvent.location && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span className="flex items-center gap-1 font-medium">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span>{activeEvent.location}</span>
                          </span>
                        </>
                      )}
                    </div>

                    {/* Pilihan switcher event kegiatan */}
                    {availableEvents.length > 1 && (
                      <div className="pt-2 flex flex-wrap gap-1.5 items-center">
                        <span className="text-[10px] text-slate-500 font-medium">Pilih Kegiatan Lain:</span>
                        {availableEvents.map(ev => (
                          <button
                            key={ev.id}
                            type="button"
                            onClick={() => handleEventSwitch(ev.id)}
                            className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                              Number(activeEventId) === Number(ev.id)
                                ? 'bg-blue-900 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {ev.title}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-300 rounded-3xl p-6 text-center space-y-2">
                <AlertCircle className="w-8 h-8 mx-auto text-amber-500" />
                <h3 className="text-sm font-black text-amber-900">Belum Ada Kegiatan BIMTEK Aktif</h3>
                <p className="text-xs text-amber-700">Silakan buka menu <Link href="/events" className="underline font-bold text-blue-900">Katalog BIMTEK</Link>.</p>
              </div>
            )}

            {/* SCANNER + LOG */}
            {activeEvent && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

                {/* CAMERA SCANNER (7 cols) */}
                <div className="md:col-span-7 bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5">

                  {/* Gatekeeper Check: Belum mengisi data lengkap */}
                  {gatekeeperStatus && !gatekeeperStatus.is_allowed ? (
                    <div className="p-6 md:p-8 bg-amber-50/70 border-2 border-dashed border-amber-300 rounded-2xl text-center space-y-5">
                      <div className="w-16 h-16 rounded-3xl bg-amber-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20">
                        <Lock className="w-8 h-8" />
                      </div>
                      <div className="space-y-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 border border-amber-200 text-amber-900 text-[10px] font-black uppercase tracking-wider">
                          🔒 Akses Absensi Terkunci
                        </span>
                        <h3 className="text-base font-black text-slate-900 leading-snug">
                          Anda Wajib Mengisi & Melengkapi Semua Data Terlebih Dahulu
                        </h3>
                        <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
                          Sebelum dapat melakukan presensi atau scan QR kehadiran pada kegiatan <strong>"{activeEvent.title}"</strong>, Anda harus mengisi seluruh formulir pendaftaran, data kependudukan (NIK/KTP), dan nomor rekening pencairan.
                        </p>
                      </div>

                      {gatekeeperStatus.missing_items && gatekeeperStatus.missing_items.length > 0 && (
                        <div className="bg-white/80 border border-amber-200 rounded-xl p-4 text-left max-w-md mx-auto space-y-2">
                          <span className="text-[11px] font-black text-slate-800 uppercase tracking-wider block">
                            Data yang Belum Dilengkapi:
                          </span>
                          <ul className="space-y-1 text-xs font-semibold text-rose-700">
                            {gatekeeperStatus.missing_items.map((item, idx) => (
                              <li key={idx} className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="pt-2">
                        <Link
                          href={gatekeeperStatus.register_url || `/events/${activeEvent.id}/register`}
                          className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-6 bg-blue-900 hover:bg-blue-800 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all cursor-pointer active:scale-98"
                        >
                          <FileText className="w-4 h-4 text-amber-400" />
                          <span>Isi & Lengkapi Semua Data Sekarang →</span>
                        </Link>
                      </div>
                    </div>
                  ) : alreadyPresent ? (
                    <div className="p-6 bg-emerald-50 border-2 border-emerald-300 rounded-2xl text-center space-y-4">
                      <div className="w-16 h-16 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-lg animate-bounce">
                        <CheckCircle2 className="w-8 h-8" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-base font-black text-emerald-950 uppercase">Presensi Anda Telah Tercatat Sukses ✓</h3>
                        <p className="text-xs text-emerald-800">
                          Kehadiran Anda pada kegiatan <strong>"{activeEvent.title}"</strong> telah diverifikasi dalam server Admin.
                        </p>
                      </div>

                      <div className="pt-3 border-t border-emerald-200 flex items-center justify-center gap-2 flex-wrap">
                        <Link
                          href={`/events/${activeEvent.id}`}
                          className="px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white text-xs font-black rounded-xl shadow-xs flex items-center gap-1.5"
                        >
                          <QrCode className="w-3.5 h-3.5 text-amber-400" />
                          <span>Lihat Tiket Presensi QR</span>
                        </Link>
                        <Link
                          href="/my-certificates"
                          className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-blue-950 text-xs font-black rounded-xl shadow-xs flex items-center gap-1.5"
                        >
                          <Award className="w-3.5 h-3.5" />
                          <span>Unduh Sertifikat</span>
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                        <h2 className="text-xs font-black text-slate-900 flex items-center gap-2 uppercase tracking-wider">
                          <Camera className="w-4 h-4 text-emerald-600" />
                          <span>Scan QR Code Kamera HP</span>
                        </h2>
                        {cameraActive && (
                          <button
                            type="button"
                            onClick={toggleCameraFacing}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-700 hover:bg-slate-200 flex items-center gap-1 cursor-pointer"
                          >
                            <RefreshCw className="w-3 h-3 text-blue-900" />
                            <span>Switch ({facingMode === 'environment' ? 'Belakang' : 'Depan'})</span>
                          </button>
                        )}
                      </div>

                      <div className="relative min-h-[280px] bg-slate-950 rounded-2xl overflow-hidden border-2 border-slate-800 flex items-center justify-center shadow-inner p-2">
                        <div id="qr-reader-container" className={`w-full max-w-sm mx-auto ${cameraActive ? 'block' : 'hidden'}`}></div>

                        {!cameraActive && (
                          <div className="text-center space-y-4 p-6 text-slate-400">
                            <Camera className="w-12 h-12 mx-auto text-emerald-400 animate-pulse" />
                            <div className="space-y-1">
                              <p className="text-xs font-bold text-slate-200">
                                Pilihan Metode Presensi Scan QR Code:
                              </p>
                              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                                Arahkan kamera HP ke QR Code proyektor Admin atau ambil foto QR Code langsung.
                              </p>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 max-w-sm mx-auto">
                              <button
                                type="button"
                                onClick={startCamera}
                                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md cursor-pointer transition-transform active:scale-95 flex items-center justify-center gap-2"
                              >
                                <Camera className="w-4 h-4 text-amber-300" />
                                <span>Live Kamera HP</span>
                              </button>

                              {/* Hidden file input for QR scan from photo (works on HTTP!).
                                  Tanpa atribut `capture` supaya user BISA PILIH
                                  dari galeri (tidak dipaksa ambil foto baru). Sebelumnya
                                  capture="environment" memaksa buka kamera, blokir
                                  pilih foto existing — itu membatasi user. */}
                              <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleImageFileScan}
                                className="hidden"
                              />

                              <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-black text-xs shadow-md cursor-pointer transition-transform active:scale-95 flex items-center justify-center gap-2"
                              >
                                <QrCode className="w-4 h-4 text-amber-300" />
                                <span>Foto QR Code (Kamera HP)</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {cameraActive && (
                          <button
                            type="button"
                            onClick={stopCamera}
                            className="absolute top-3 right-3 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black rounded-xl shadow-md flex items-center gap-1 z-20 cursor-pointer"
                          >
                            <StopCircle className="w-3.5 h-3.5" />
                            <span>Matikan Kamera</span>
                          </button>
                        )}
                      </div>

                      {cameraError && (
                        <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-2xl text-amber-900 text-xs font-bold flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <span className="block">{cameraError}</span>
                            <p className="text-[11px] font-normal text-amber-800">
                              Tips: Anda juga bisa menekan tombol <strong>"Foto QR Code (Kamera HP)"</strong> di atas. Jika kamera/foto tetap bermasalah, mohon hubungi petugas Admin untuk presensi manual.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Info: hubungi admin jika kendala kamera */}
                      <div className="p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-black uppercase text-slate-800 flex items-center gap-1.5">
                            <AlertCircle className="w-4 h-4 text-slate-600" />
                            <span>Kendala Kamera / Absensi?</span>
                          </span>
                          <span className="text-[10px] font-bold text-slate-600 bg-slate-200/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <UserCheck className="w-3 h-3" />
                            <span>Admin</span>
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-700 leading-relaxed font-medium">
                          Jika kamera tidak berfungsi atau Anda mengalami kendala saat absensi pada kegiatan <strong>"{activeEvent.title}"</strong>, mohon hubungi petugas Admin (Panitia) untuk dicatatkan presensi secara manual. Presensi mandiri <strong>wajib</strong> via scan QR Code resmi yang ditayangkan di layar proyektor.
                        </p>
                      </div>

                      {/*
                        Container offscreen KHUSUS file-scan (Foto QR Code).
                        Dipakai handleImageFileScan untuk bikin Html5Qrcode + scanFile().
                        HARUS punya dimensi nyata — JANGAN display:none (kalau
                        display:none, html5-qrcode report 0x0 → decode gagal).
                        Offscreen pakai absolute -left-[9999px] dengan width/height
                        eksplisit. Tidak terlihat user tapi dimensi valid.
                      */}
                      <div
                        id="qr-file-scan-container"
                        aria-hidden="true"
                        className="absolute -left-[9999px] top-0 w-[300px] h-[300px] overflow-hidden pointer-events-none"
                      ></div>
                    </div>
                  )}
                </div>

                {/* LOG PRESENSI (5 cols) */}
                <div className="md:col-span-5 bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h2 className="text-xs font-black text-slate-900 flex items-center gap-2 uppercase tracking-wider">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Log Absensi Saya</span>
                    </h2>
                    <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                      {myAttendances?.length || 0} Tercatat
                    </span>
                  </div>

                  {myAttendances && myAttendances.length > 0 ? (
                    <div className="space-y-3">
                      {myAttendances.map((att) => (
                        <div key={att.id} className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-700 text-white shadow-xs">
                              ✓ HADIR
                            </span>
                            <span className="text-[10px] font-mono font-bold text-slate-500">
                              {formatTimestamp(att.checked_in_at)}
                            </span>
                          </div>
                          <p className="text-xs font-extrabold text-slate-900">
                            {att.event?.title || 'Kegiatan BIMTEK'}
                          </p>
                          <span className="text-[10px] text-slate-600 block capitalize">
                            Metode: {att.checkin_method?.replace('_', ' ') || 'QR Scan Kamera'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-slate-400 space-y-2">
                      <Clock className="w-8 h-8 mx-auto text-slate-300" />
                      <p className="text-xs font-bold text-slate-700">Belum ada catatan presensi.</p>
                      <p className="text-[11px] text-slate-500">Nyalakan kamera HP lalu scan QR Code proyektor Admin untuk presensi.</p>
                    </div>
                  )}
                </div>

              </div>
            )}

          </div>
        )}

      </div>

      {/* MODAL PESERTA ON-THE-SPOT HARI-H (admin) */}
      {showOnSpotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs print:hidden">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 space-y-5 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Peserta On-the-Spot (Hari-H)</h3>
                <p className="text-[11px] text-slate-500">
                  Pendaftaran langsung + pencatatan kehadiran untuk peserta walk-in.
                  Akun dibuat otomatis (password = email).
                </p>
              </div>
              <button onClick={() => setShowOnSpotModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-sm">✕</button>
            </div>

            {activeEvent && (
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-700 leading-relaxed">
                <strong>Kegiatan aktif:</strong> {activeEvent.title}
                {activeEvent.start_date && (
                  <span className="block text-slate-500 mt-0.5">
                    {formatDate(activeEvent.start_date)}
                  </span>
                )}
              </div>
            )}

            <form onSubmit={handleOnSpotSubmit} className="space-y-3.5 text-xs">
              {onSpotForm.errors.event_id && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-[11px] font-medium">
                  {onSpotForm.errors.event_id}
                </div>
              )}

              <div>
                <label className="font-bold text-slate-900 block mb-1">Nama Lengkap:</label>
                <input
                  type="text"
                  value={onSpotForm.data.name}
                  onChange={(e) => onSpotForm.setData('name', e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-900"
                  placeholder="Nama Lengkap dengan Gelar"
                  required
                />
                {onSpotForm.errors.name && <p className="text-rose-600 text-[10px] mt-1">{onSpotForm.errors.name}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-900 block mb-1">Email:</label>
                  <input
                    type="email"
                    value={onSpotForm.data.email}
                    onChange={(e) => onSpotForm.setData('email', e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-900"
                    placeholder="email@contoh.com"
                    required
                  />
                  {onSpotForm.errors.email && <p className="text-rose-600 text-[10px] mt-1">{onSpotForm.errors.email}</p>}
                </div>
                <div>
                  <label className="font-bold text-slate-900 block mb-1">NIP / NIK:</label>
                  <input
                    type="text"
                    value={onSpotForm.data.nip_nik}
                    onChange={(e) => onSpotForm.setData('nip_nik', e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-900"
                    placeholder="Nomor NIK KTP"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-900 block mb-1">Instansi:</label>
                  <input
                    type="text"
                    value={onSpotForm.data.instansi}
                    onChange={(e) => onSpotForm.setData('instansi', e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-900"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-900 block mb-1">No. HP / WhatsApp:</label>
                  <input
                    type="text"
                    value={onSpotForm.data.no_hp}
                    onChange={(e) => onSpotForm.setData('no_hp', e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-900"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-900 block mb-1">Catatan (opsional):</label>
                <input
                  type="text"
                  value={onSpotForm.data.notes}
                  onChange={(e) => onSpotForm.setData('notes', e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-900"
                  placeholder="Mis: walk-in, tidak daftar online"
                />
              </div>

              <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-[11px] text-blue-900 leading-relaxed">
                <strong>Catatan:</strong> Akun peserta dibuat otomatis dengan password = email.
                Peserta bisa login di <code className="bg-white px-1 rounded">/login</code> pakai email + password (email),
                lalu ubah password di <code className="bg-white px-1 rounded">/profile</code>.
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowOnSpotModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={onSpotForm.processing}
                  className="px-5 py-2 bg-blue-900 hover:bg-blue-950 text-white font-bold rounded-lg flex items-center gap-1.5 disabled:opacity-50"
                >
                  <UserPlus className="w-4 h-4" />
                  {onSpotForm.processing ? 'Memproses...' : 'Daftarkan & Absen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </AppLayout>
  );
}
