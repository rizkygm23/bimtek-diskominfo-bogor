import React, { useState, useEffect, useCallback, useRef } from 'react';
import { usePage, Link, useForm, router } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  UserCheck, 
  FileText, 
  CheckCircle, 
  QrCode, 
  ArrowLeft,
  Settings,
  Eye,
  Download,
  Building2,
  CheckCircle2,
  FileCheck,
  Upload,
  Trash2,
  Presentation,
  FileSpreadsheet,
  File,
  X,
  RefreshCw,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { useParticipantRealtime } from '@/Hooks/useParticipantRealtime';
import LiveConnectionBadge from '@/Components/LiveConnectionBadge';
import RealtimeToast from '@/Components/RealtimeToast';

// Helper: get file extension icon and label
function getFileInfo(filePath) {
  if (!filePath) return { icon: <File className="w-4 h-4" />, label: 'File', color: 'text-slate-600', bg: 'bg-slate-100 border-slate-200 text-slate-800' };
  const ext = filePath.split('.').pop().toLowerCase();
  switch (ext) {
    case 'ppt': case 'pptx':
      return { icon: <Presentation className="w-4 h-4" />, label: 'PowerPoint', color: 'text-orange-600', bg: 'bg-orange-100 border-orange-200 text-orange-800' };
    case 'pdf':
      return { icon: <FileText className="w-4 h-4" />, label: 'PDF', color: 'text-red-600', bg: 'bg-red-100 border-red-200 text-red-800' };
    case 'doc': case 'docx':
      return { icon: <FileText className="w-4 h-4" />, label: 'Word', color: 'text-blue-600', bg: 'bg-blue-100 border-blue-200 text-blue-800' };
    case 'xls': case 'xlsx':
      return { icon: <FileSpreadsheet className="w-4 h-4" />, label: 'Excel', color: 'text-emerald-600', bg: 'bg-emerald-100 border-emerald-200 text-emerald-800' };
    default:
      return { icon: <File className="w-4 h-4" />, label: ext.toUpperCase(), color: 'text-slate-600', bg: 'bg-slate-100 border-slate-200 text-slate-800' };
  }
}

// Helper: get original filename from storage path
function getOriginalName(storagePath) {
  if (!storagePath) return 'File Materi';
  const basename = storagePath.split('/').pop();
  return basename.length > 9 ? basename.substring(9) : basename;
}

export default function Show({ event, userRegistration, userSpeakerAssignment }) {
  const { auth } = usePage().props;
  const user = auth?.user || {};
  const isSpeaker = user?.role === 'pembicara';
  const isPeserta = user?.role === 'peserta' || user?.role === 'user';
  const isAdmin = user?.role === 'admin';
  const [activeTab, setActiveTab] = useState('detail'); // 'detail', 'participants', 'materials'
  const [registrations, setRegistrations] = useState(event.registrations || []);

  // Material upload state for speakers
  const [uploadingSpeakerId, setUploadingSpeakerId] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const currentUploadingSpeakerIdRef = useRef(null);
  const materialForm = useForm({
    event_speaker_id: '',
    material_file: null,
  });
  const fileInputRef = useRef(null);

  // Material preview modal state
  const [previewSpeaker, setPreviewSpeaker] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    setRegistrations(event.registrations || []);
  }, [event.registrations]);

  // REAL-TIME LISTENER FOR THIS BIMTEK EVENT
  const handleNewParticipant = useCallback((eventData) => {
    if (Number(eventData.bimtek_id) === Number(event.id)) {
      setRegistrations((prev) => {
        const exists = prev.some((r) => r.id === eventData.id || r.user?.name === eventData.participant_name);
        if (exists) return prev;

        const newReg = {
          id: eventData.id,
          registration_code: eventData.registration_code,
          status: eventData.registration_status || 'approved',
          user: {
            name: eventData.participant_name,
            nip_nik: eventData.nip_nik || '-',
            instansi: eventData.instansi || 'Umum',
            jabatan: eventData.jabatan || 'Peserta BIMTEK',
          },
          answers: (eventData.answers || []).map((ans) => ({
            id: ans.id,
            form_field: { field_label: ans.label },
            answer_value: ans.value,
          })),
          attendances: [{ id: Date.now() }],
          isNew: true,
        };

        return [newReg, ...prev];
      });
    }
  }, [event.id]);

  const { isConnected, latestNotification, clearNotification } = useParticipantRealtime({
    bimtekId: event.id,
    onParticipantRegistered: handleNewParticipant,
    enabled: user?.role === 'admin',
  });

  const isFull = registrations.length >= event.quota;

  // Collect all speakers with materials
  const speakersWithMaterials = (event.event_speakers || []).filter(es => es.material_path);

  // Handle material file upload
  const handleMaterialUpload = (eventSpeakerId) => {
    currentUploadingSpeakerIdRef.current = eventSpeakerId;
    setUploadingSpeakerId(eventSpeakerId);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileSelected = (e) => {
    const file = e.target.files[0];
    const targetSpeakerId = currentUploadingSpeakerIdRef.current || uploadingSpeakerId || (userSpeakerAssignment ? userSpeakerAssignment.id : null) || (event.event_speakers && event.event_speakers[0] ? event.event_speakers[0].id : null);

    if (!file) return;

    if (!targetSpeakerId) {
      alert('Gagal mengidentifikasi penugasan narasumber. Silakan pilih tombol upload pada kartu narasumber.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    router.post('/speaker/upload-material', {
      event_speaker_id: targetSpeakerId,
      material_file: file,
    }, {
      forceFormData: true,
      preserveScroll: true,
      onProgress: (progress) => {
        if (progress.percentage) {
          setUploadProgress(progress.percentage);
        }
      },
      onSuccess: () => {
        setIsUploading(false);
        setUploadProgress(100);
        setUploadingSpeakerId(null);
        currentUploadingSpeakerIdRef.current = null;
      },
      onError: (errors) => {
        setIsUploading(false);
        setUploadProgress(0);
        console.error('Upload Error:', errors);
        const errorMsg = Object.values(errors).flat().join('\n');
        alert('Gagal mengunggah materi:\n' + (errorMsg || 'Pastikan jenis file sesuai (PPT/PDF/DOC) dan ukuran maksimal 50MB.'));
        setUploadingSpeakerId(null);
        currentUploadingSpeakerIdRef.current = null;
      },
    });
  };

  const handleDeleteMaterial = (eventSpeakerId) => {
    if (confirm('Apakah Anda yakin ingin menghapus file materi ini?')) {
      router.delete(`/speaker/delete-material/${eventSpeakerId}`);
    }
  };

  // Direct download bypasses Inertia link interception
  const handleDirectDownload = (eventSpeakerId) => {
    window.location.href = `/materials/download/${eventSpeakerId}`;
  };

  // Open Preview Modal
  const handleOpenPreview = (es) => {
    setPreviewSpeaker(es);
    setIsPreviewOpen(true);
  };

  const handleClosePreview = () => {
    setIsPreviewOpen(false);
    setPreviewSpeaker(null);
  };

  return (
    <AppLayout title={event.title}>
      {/* REAL-TIME NOTIFICATION TOAST */}
      {user.role === 'admin' && (
        <RealtimeToast notification={latestNotification} onClose={clearNotification} />
      )}

      {/* INSTANT FLOATING UPLOAD PROGRESS BADGE (ZERO LAG FEEDBACK) */}
      {isUploading && (
        <div className="fixed bottom-20 lg:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-auto z-50 bg-blue-950 text-white px-5 py-4 rounded-2xl shadow-2xl border border-blue-700/80 flex items-center gap-4 print:hidden">
          <RefreshCw className="w-5 h-5 text-amber-400 animate-spin shrink-0" />
          <div className="space-y-1 min-w-0 flex-1 sm:flex-none">
            <p className="text-xs font-black text-white">Mengunggah Berkas Presentasi...</p>
            <div className="w-full sm:w-48 bg-blue-900 rounded-full h-2 overflow-hidden border border-blue-800">
              {/* TODO: flatten hero — see PageHeader.jsx (progress bar) */}
              <div
                className="bg-gradient-to-r from-amber-400 to-orange-500 h-full transition-all duration-150 rounded-full"
                style={{ width: `${Math.max(uploadProgress, 15)}%` }}
              ></div>
            </div>
          </div>
          <span className="text-xs font-mono font-black text-amber-400 min-w-[36px] text-right">
            {uploadProgress}%
          </span>
        </div>
      )}

      {/* Hidden file input for material upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".ppt,.pptx,.pdf,.doc,.docx,.xls,.xlsx"
        className="hidden"
        onChange={handleFileSelected}
      />

      <div className="space-y-6 max-w-6xl mx-auto font-sans">
        
        <div className="flex items-center justify-between">
          <Link href="/events" className="inline-flex items-center gap-1.5 text-xs text-blue-900 dark:text-amber-400 font-bold hover:underline">
            <ArrowLeft className="w-4 h-4" /> Kembali ke Katalog BIMTEK
          </Link>
          {user.role === 'admin' && <LiveConnectionBadge isConnected={isConnected} />}
        </div>

        {/* HERO EVENT CARD */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="px-3 py-1 rounded-md text-xs font-extrabold uppercase bg-blue-50 text-blue-900 border border-blue-200 dark:bg-blue-950 dark:text-amber-400 dark:border-blue-800">
              Status: {(event.computed_status || event.status)}
            </span>

            <div className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-800 dark:text-amber-400" />
              <span>Peserta Terdaftar: <strong>{registrations.length} / {event.quota}</strong> Kuota</span>
            </div>
          </div>

          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white leading-snug">
            {event.title}
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-600 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>
                {new Date(event.start_date).toLocaleString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} s/d{' '}
                {new Date(event.end_date).toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{event.location}</span>
            </div>
          </div>

          {/* ACTION BUTTONS & REGISTRATION STATUS */}
          <div className="pt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
            {isSpeaker ? (
              userSpeakerAssignment ? (
                <div className="flex flex-wrap items-center gap-3 bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 p-3.5 rounded-xl w-full sm:w-auto">
                  <CheckCircle2 className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-purple-950 dark:text-purple-300">
                      Anda Terdaftar sebagai Narasumber / Pemateri!
                    </p>
                    <p className="text-[11px] text-purple-700 dark:text-purple-400">Topik: {userSpeakerAssignment.topic}</p>
                  </div>
                  
                  {/* Speaker Quick Upload Material Button */}
                  <button
                    type="button"
                    onClick={() => handleMaterialUpload(userSpeakerAssignment.id)}
                    disabled={materialForm.processing && uploadingSpeakerId === userSpeakerAssignment.id}
                    className="px-3.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Materi PPT/PDF</span>
                  </button>

                  <Link
                    href="/attendance/scan"
                    className="px-3.5 py-1.5 rounded-lg bg-purple-900 text-white text-xs font-bold flex items-center gap-1.5 hover:bg-purple-800 shadow-xs"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Presensi Hari-H</span>
                  </Link>
                </div>
              ) : (
                <Link
                  href={`/events/${event.id}/register`}
                  className="px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 shadow-sm transition-all active:scale-95 bg-amber-400 hover:bg-amber-300 text-blue-950 shadow-amber-200 cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>Konfirmasi & Unggah Berkas Narasumber</span>
                </Link>
              )
            ) : (
              userRegistration ? (
                <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 p-3 rounded-xl">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                      Anda Sudah Terdaftar pada BIMTEK Ini!
                    </p>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-mono">Kode Tiket: {userRegistration.registration_code}</p>
                  </div>
                  <Link
                    href={`/registrations/${userRegistration.id}/ticket`}
                    className="ml-auto px-3.5 py-1.5 rounded-lg bg-blue-900 text-white text-xs font-bold flex items-center gap-1.5 hover:bg-blue-800 shadow-xs"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Lihat Tiket QR</span>
                  </Link>
                </div>
              ) : (
                <Link
                  href={`/events/${event.id}/register`}
                  className={`px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 shadow-sm transition-all active:scale-95 ${
                    isFull 
                      ? 'bg-slate-200 text-slate-500 cursor-not-allowed' 
                      : 'bg-blue-900 text-white hover:bg-blue-800'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>{isFull ? 'Kuota Pendaftaran Penuh' : 'Daftar Kegiatan BIMTEK'}</span>
                </Link>
              )
            )}

            {user.role === 'admin' && (
              <Link
                href={`/admin/events/${event.id}/form-builder`}
                className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 hover:bg-slate-200"
              >
                <Settings className="w-4 h-4" />
                <span>Kelola Form Builder</span>
              </Link>
            )}
          </div>
        </div>

        {/* TABS NAVIGATION — scroll horizontal di layar kecil agar label tidak patah */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto" role="tablist">
          <button
            onClick={() => setActiveTab('detail')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'detail'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
            }`}
          >
            Informasi & Narasumber
          </button>
          <button
            onClick={() => setActiveTab('materials')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'materials'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <Presentation className="w-3.5 h-3.5" />
            <span>Materi Presentasi ({speakersWithMaterials.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('participants')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'participants'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Data Peserta Terdaftar ({registrations.length})</span>
          </button>
        </div>

        {/* TAB 1: INFORMASI DETAIL & NARASUMBER */}
        {activeTab === 'detail' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                Deskripsi & Tujuan Kegiatan
              </h2>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {event.description}
              </p>
            </div>

            {/* DAFTAR PEMBICARA / NARASUMBER */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Narasumber & Pemateri Kegiatan</span>
              </h2>

              {event.event_speakers && event.event_speakers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {event.event_speakers.map((es) => {
                    const fileInfo = es.material_path ? getFileInfo(es.material_path) : null;
                    const fileName = es.material_path ? getOriginalName(es.material_path) : null;
                    const isMySpeakerSlot = isSpeaker && userSpeakerAssignment && userSpeakerAssignment.id === es.id;

                    return (
                      <div key={es.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-900 text-white font-bold flex items-center justify-center text-sm shrink-0">
                            {es.speaker?.name?.charAt(0) || 'P'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <strong className="block text-xs font-bold text-slate-900 dark:text-white">{es.speaker?.name}</strong>
                            <span className="text-[11px] text-slate-500">{es.speaker?.instansi} ({es.speaker?.jabatan})</span>
                          </div>
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800">
                          <strong>Materi: </strong> {es.topic}
                        </div>

                        {/* MATERIAL FILE STATUS & ACTIONS */}
                        {es.material_path ? (
                          <div className="flex items-center gap-2 p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${fileInfo.bg}`}>
                              {fileInfo.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-bold text-slate-900 dark:text-white truncate">{fileName}</p>
                              <p className="text-[10px] text-slate-500">{fileInfo.label} • Berkas Resmi Narasumber</p>
                            </div>
                            
                            {/* Buka / Lihat Modal Preview */}
                            <button
                              onClick={() => handleOpenPreview(es)}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg border border-slate-300 transition-colors shrink-0 cursor-pointer"
                              title="Lihat Materi"
                            >
                              <Eye className="w-3.5 h-3.5 text-blue-900" />
                            </button>

                            {/* Unduh File Langsung dengan Nama Asli */}
                            <button
                              onClick={() => handleDirectDownload(es.id)}
                              className="p-1.5 bg-blue-900 hover:bg-blue-950 text-white rounded-lg transition-colors shrink-0 cursor-pointer"
                              title="Unduh File Materi Presentasi"
                            >
                              <Download className="w-3.5 h-3.5 text-amber-400" />
                            </button>

                            {(isMySpeakerSlot || isAdmin) && (
                              <button
                                onClick={() => handleDeleteMaterial(es.id)}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0 cursor-pointer"
                                title="Hapus File Materi"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ) : (
                          isSpeaker || isAdmin ? (
                            <button
                              type="button"
                              onClick={() => handleMaterialUpload(es.id)}
                              disabled={materialForm.processing && uploadingSpeakerId === es.id}
                              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border-2 border-dashed border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 text-xs font-bold hover:bg-orange-100 dark:hover:bg-orange-950/50 transition-colors cursor-pointer disabled:opacity-50"
                            >
                              {materialForm.processing && uploadingSpeakerId === es.id ? (
                                <>
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                  <span>Mengunggah file...</span>
                                </>
                              ) : (
                                <>
                                  <Upload className="w-4 h-4" />
                                  <span>Upload File Materi (PPT/PDF/DOC)</span>
                                </>
                              )}
                            </button>
                          ) : (
                            <div className="flex items-center gap-2 py-2 px-3 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500">
                              <FileText className="w-3.5 h-3.5" />
                              <span>Materi belum diunggah oleh narasumber</span>
                            </div>
                          )
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">Belum ada narasumber yang ditugaskan.</p>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: MATERI PRESENTASI (DEDICATED TAB FOR MATERIALS) */}
        {activeTab === 'materials' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
            
            {/* HEADER */}
            {/* TODO: flatten hero — see PageHeader.jsx (callout: bg-amber-50, not gradient) */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center shadow-xs">
                  <Presentation className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    Materi Presentasi Narasumber ({speakersWithMaterials.length} File Tersedia)
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {isSpeaker 
                      ? 'Unggah file materi presentasi Anda agar peserta dapat mengunduh dan mempelajarinya.'
                      : 'Unduh atau buka file materi presentasi narasumber untuk dipelajari.'}
                  </p>
                </div>
              </div>
            </div>

            {/* MATERIAL LIST */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {event.event_speakers && event.event_speakers.length > 0 ? (
                event.event_speakers.map((es) => {
                  const fileInfo = es.material_path ? getFileInfo(es.material_path) : null;
                  const fileName = es.material_path ? getOriginalName(es.material_path) : null;
                  const isMySpeakerSlot = isSpeaker && userSpeakerAssignment && userSpeakerAssignment.id === es.id;

                  return (
                    <div key={es.id} className="p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-slate-50/50 transition-colors">
                      
                      {/* Speaker Info */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-blue-900 text-white font-bold flex items-center justify-center text-sm shrink-0">
                          {es.speaker?.name?.charAt(0) || 'P'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <strong className="block text-xs font-bold text-slate-900 dark:text-white truncate">{es.speaker?.name}</strong>
                          <span className="text-[11px] text-slate-500 block truncate">{es.topic}</span>
                        </div>
                      </div>

                      {/* Material File or Upload */}
                      <div className="flex items-center gap-2 flex-wrap min-w-0">
                        {es.material_path ? (
                          <>
                            {/* File Badge */}
                            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase ${fileInfo.bg}`}>
                              {fileInfo.icon}
                              <span>{fileInfo.label}</span>
                            </div>

                            {/* File Name */}
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 max-w-[160px] truncate" title={fileName}>
                              {fileName}
                            </span>

                            {/* Lihat / Preview Button */}
                            <button
                              onClick={() => handleOpenPreview(es)}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold rounded-xl text-xs border border-slate-300 transition-transform active:scale-95 cursor-pointer"
                              title="Buka Pratinjau Dokumen"
                            >
                              <Eye className="w-3.5 h-3.5 text-blue-900" />
                              <span>Lihat</span>
                            </button>

                            {/* Unduh File Direct Link */}
                            <button
                              onClick={() => handleDirectDownload(es.id)}
                              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white font-extrabold rounded-xl text-xs shadow-xs transition-transform active:scale-95 cursor-pointer"
                              title="Unduh Berkas Materi Asli"
                            >
                              <Download className="w-3.5 h-3.5 text-amber-400" />
                              <span>Unduh File</span>
                            </button>

                            {/* Delete (only for owner or admin) */}
                            {(isMySpeakerSlot || isAdmin) && (
                              <button
                                onClick={() => handleDeleteMaterial(es.id)}
                                className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                                title="Hapus File Materi"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </>
                        ) : (
                          isSpeaker || isAdmin ? (
                            <button
                              type="button"
                              onClick={() => handleMaterialUpload(es.id)}
                              disabled={materialForm.processing && uploadingSpeakerId === es.id}
                              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 text-xs font-bold hover:bg-orange-100 transition-colors cursor-pointer disabled:opacity-50"
                            >
                              {materialForm.processing && uploadingSpeakerId === es.id ? (
                                <>
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                  <span>Mengunggah...</span>
                                </>
                              ) : (
                                <>
                                  <Upload className="w-4 h-4" />
                                  <span>Upload Materi (PPT/PDF/DOC)</span>
                                </>
                              )}
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 text-[11px] font-bold border border-slate-200 dark:border-slate-700">
                              <FileText className="w-3.5 h-3.5" />
                              <span>Belum ada materi</span>
                            </span>
                          )
                        )}
                      </div>

                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 px-6 space-y-2">
                  <Presentation className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="text-xs font-bold text-slate-600">Belum ada narasumber yang ditugaskan.</p>
                  <p className="text-[11px] text-slate-400">Materi presentasi akan muncul di sini setelah narasumber mengunggah file.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: DATA PESERTA TERDAFTAR (REAL-TIME LIVE TABLE) */}
        {activeTab === 'participants' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-900 dark:text-amber-400" />
                  <span>Daftar Peserta Terdaftar & Jawaban Form Dinamis</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Integrasi data real-time profil, berkas, dan tiket presensi</p>
              </div>

              {user.role === 'admin' && (
                <Link
                  href={`/admin/report-center?template=REKAP_ABSENSI&event_id=${event.id}`}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-600 shrink-0 shadow-xs"
                >
                  <FileCheck className="w-3.5 h-3.5" />
                  <span>Cetak Rekap Presensi (PDF)</span>
                </Link>
              )}
            </div>

            {registrations.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 uppercase text-[10px]">
                      <th className="py-2.5 px-3">No</th>
                      <th className="py-2.5 px-3">Nama Peserta / NIP</th>
                      <th className="py-2.5 px-3">Instansi & Jabatan</th>
                      <th className="py-2.5 px-3">Kode Tiket</th>
                      <th className="py-2.5 px-3">Jawaban Form Dinamis</th>
                      <th className="py-2.5 px-3">Status Presensi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {registrations.map((reg, idx) => (
                      <tr 
                        key={reg.id || idx} 
                        className={`transition-colors ${
                          reg.isNew 
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 font-semibold' 
                            : 'hover:bg-slate-50 dark:hover:bg-slate-950/60'
                        }`}
                      >
                        <td className="py-3 px-3 font-bold text-slate-500">
                          {reg.isNew ? <span className="text-emerald-600 font-bold">★</span> : idx + 1}
                        </td>
                        <td className="py-3 px-3">
                          <strong className="text-slate-900 dark:text-slate-100 block">
                            {reg.user?.name}
                            {reg.isNew && (
                              <span className="ml-1.5 px-1.5 py-0.2 rounded text-[9px] bg-emerald-600 text-white font-black">
                                BARU
                              </span>
                            )}
                          </strong>
                          <span className="text-[11px] text-slate-500">NIP: {reg.user?.nip_nik || '-'}</span>
                        </td>
                        <td className="py-3 px-3 text-slate-700 dark:text-slate-300">
                          <div>{reg.user?.instansi || '-'}</div>
                          <span className="text-[11px] text-slate-500">{reg.user?.jabatan || '-'}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-mono text-blue-900 dark:text-amber-400 font-bold bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                            {reg.registration_code}
                          </span>
                        </td>
                        <td className="py-3 px-3 space-y-1">
                          {reg.answers && reg.answers.length > 0 ? (
                            reg.answers.map((ans) => (
                              <div key={ans.id} className="text-[11px]">
                                <span className="text-slate-500 font-semibold">{ans.form_field?.field_label}: </span>
                                <strong className="text-slate-800 dark:text-slate-200">{ans.answer_value || '-'}</strong>
                              </div>
                            ))
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Profil bawaan</span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300">
                            {reg.attendances?.length || 1} Stage Recorded
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic py-6 text-center">Belum ada peserta yang mendaftar pada kegiatan ini.</p>
            )}
          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* MODAL FULLSCREEN PREVIEW OF SPEAKER MATERIAL                              */}
      {/* ========================================================================= */}
      {isPreviewOpen && previewSpeaker && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          
          <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
            
            {/* MODAL HEADER */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <Presentation className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-sm font-black text-white leading-tight">
                    Materi: {previewSpeaker.topic}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Pemateri: {previewSpeaker.speaker?.name} ({previewSpeaker.speaker?.instansi})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDirectDownload(previewSpeaker.id)}
                  className="px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white text-xs font-extrabold rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-amber-400" />
                  <span>Unduh File</span>
                </button>

                <button
                  onClick={handleClosePreview}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* MODAL BODY (PREVIEW FOR PDF / DETAILS FOR OTHER FORMATS) */}
            <div className="p-4 sm:p-6 bg-slate-100 dark:bg-slate-950 overflow-y-auto flex items-center justify-center min-h-[60vh]">
              {previewSpeaker.material_path?.toLowerCase().endsWith('.pdf') ? (
                <iframe 
                  src={`/materials/stream/${previewSpeaker.id}`}
                  className="w-full h-[75vh] rounded-2xl border border-slate-300 shadow-md"
                  title="PDF Material Preview"
                />
              ) : (
                <div className="max-w-lg w-full bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-5">
                  <div className="w-16 h-16 rounded-3xl bg-orange-100 text-orange-600 flex items-center justify-center mx-auto shadow-xs border border-orange-200">
                    {getFileInfo(previewSpeaker.material_path).icon}
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-base font-black text-slate-900 dark:text-white">
                      {getOriginalName(previewSpeaker.material_path)}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Dokumen presentasi berformat <strong>{getFileInfo(previewSpeaker.material_path).label}</strong>. Klik tombol di bawah untuk mengunduh dan membuka di aplikasi presentasi Anda.
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => handleDirectDownload(previewSpeaker.id)}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-900 hover:bg-blue-950 text-white text-xs font-black shadow-md transition-transform active:scale-95 cursor-pointer"
                    >
                      <Download className="w-4 h-4 text-amber-400" />
                      <span>Unduh File Presentasi Asli</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>
      )}

    </AppLayout>
  );
}
