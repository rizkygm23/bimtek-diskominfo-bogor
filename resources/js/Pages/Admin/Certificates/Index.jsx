import React, { useState, useRef, useEffect } from 'react';
import { Head, useForm, router, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { 
  FolderArchive, 
  Upload, 
  Award, 
  Trash2, 
  Download, 
  Search, 
  CheckCircle2, 
  Clock, 
  FileText,
  FileCheck,
  Building,
  CreditCard,
  User,
  Mic,
  ShieldCheck,
  FolderDown,
  RefreshCw,
  Sparkles,
  AlertCircle,
  FileSpreadsheet,
  X
} from 'lucide-react';
import { useParticipantRealtime } from '@/Hooks/useParticipantRealtime';
import LiveConnectionBadge from '@/Components/LiveConnectionBadge';
import RealtimeToast from '@/Components/RealtimeToast';

export default function CertificateIndex({ events, currentEvent, adminRows = [], stats = {}, filters = {} }) {
  const [role, setRole] = useState(filters.role || 'all');
  const [certStatus, setCertStatus] = useState(filters.cert_status || 'all');
  const [search, setSearch] = useState(filters.search || '');
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [singleModalOpen, setSingleModalOpen] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [rows, setRows] = useState(adminRows);

  useEffect(() => {
    setRows(adminRows);
  }, [adminRows]);

  // REAL-TIME LISTENER FOR CERTIFICATE REPOSITORY
  const handleNewParticipant = (eventData) => {
    if (Number(eventData.bimtek_id) === Number(currentEvent?.id)) {
      setRows((prev) => {
        const exists = prev.some((r) => r.id === eventData.id || r.name === eventData.participant_name);
        if (exists) return prev;

        const newCertRow = {
          id: eventData.id,
          user_id: eventData.user_id,
          name: eventData.participant_name,
          nip_nik: eventData.nip_nik || '-',
          instansi: eventData.instansi || 'Umum',
          role_type: 'peserta',
          registration_code: eventData.registration_code,
          cert_status: 'NOT_UPLOADED',
          certificate_number: null,
          download_url: null,
          issued_at: null,
          isNew: true,
        };

        return [newCertRow, ...prev];
      });
    }
  };

  const { isConnected, latestNotification, clearNotification } = useParticipantRealtime({
    bimtekId: currentEvent?.id,
    onParticipantRegistered: handleNewParticipant,
  });

  const fileInputRef = useRef(null);
  const zipInputRef = useRef(null);

  // Form for Bulk Upload
  const bulkForm = useForm({
    event_id: currentEvent?.id || events[0]?.id || '',
    files: [],
    zip_file: null,
  });

  // Form for Single Upload / Replace
  const singleForm = useForm({
    event_id: currentEvent?.id || events[0]?.id || '',
    user_id: '',
    role_type: 'peserta',
    certificate_file: null,
  });

  const handleFilter = (newRole, newCertStatus, newEventId = null) => {
    setRole(newRole);
    setCertStatus(newCertStatus);
    const targetEventId = newEventId !== null ? newEventId : currentEvent?.id;

    router.get('/admin/certificates', {
      event_id: targetEventId,
      role: newRole,
      cert_status: newCertStatus,
      search: search,
    }, { preserveState: true });
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    router.get('/admin/certificates', {
      event_id: currentEvent?.id,
      role: role,
      cert_status: certStatus,
      search: search,
    }, { preserveState: true });
  };

  const handleOpenSingleModal = (row) => {
    setSelectedTarget(row);
    singleForm.setData({
      event_id: currentEvent.id,
      user_id: row.user_id,
      role_type: row.role_type,
      certificate_file: null,
    });
    setSingleModalOpen(true);
  };

  const handleSingleSubmit = (e) => {
    e.preventDefault();
    singleForm.post('/admin/certificates/single-upload', {
      onSuccess: () => {
        setSingleModalOpen(false);
        singleForm.reset();
      }
    });
  };

  const handleBulkSubmit = (e) => {
    e.preventDefault();
    bulkForm.post('/admin/certificates/bulk-upload', {
      onSuccess: () => {
        setBulkModalOpen(false);
        bulkForm.reset();
      }
    });
  };

  const handleDelete = (id) => {
    if (confirm('Apakah Anda yakin ingin menghapus sertifikat ini dari repository?')) {
      router.delete(`/admin/certificates/${id}`);
    }
  };

  return (
    <AppLayout title="Repository Sertifikat BIMTEK">
      <Head title="Repository Sertifikat Digital - SIM-BIMTEK" />

      {/* REAL-TIME NOTIFICATION TOAST */}
      <RealtimeToast notification={latestNotification} onClose={clearNotification} />

      <div className="space-y-6 max-w-7xl mx-auto font-sans">
        
        {/* GOOGLE DRIVE-LIKE REPOSITORY HEADER */}
        {/* TODO: flatten hero — see PageHeader.jsx */}
        <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-blue-800/60 relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-400/20 text-amber-300 rounded-full text-xs font-black uppercase border border-amber-400/30">
                  <FolderArchive className="w-3.5 h-3.5 text-amber-400" />
                  <span>Google Drive Repository Sertifikat Kegiatan</span>
                </div>
                <LiveConnectionBadge isConnected={isConnected} />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Repository Sertifikat Digital BIMTEK
              </h1>
              <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed font-medium">
                Kelola berkas sertifikat resmi seluruh peserta dan narasumber per kegiatan. Mendukung unggah banyak file sekaligus atau file ZIP dengan pencocokan otomatis berbasis NIK & identifier.
              </p>
            </div>

            {/* EVENT SELECTOR & QUICK ACTIONS */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
              <div className="bg-white/10 backdrop-blur-md p-1 rounded-2xl border border-white/20">
                <select
                  value={currentEvent?.id || ''}
                  onChange={(e) => handleFilter(role, certStatus, e.target.value)}
                  className="bg-transparent text-white text-xs font-black px-3 py-2 outline-none w-full cursor-pointer"
                >
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id} className="text-slate-900 font-bold">
                      📁 {ev.title}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => {
                  bulkForm.setData('event_id', currentEvent?.id);
                  setBulkModalOpen(true);
                }}
                className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-blue-950 font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Bulk Upload / ZIP</span>
              </button>

              <a
                href={`/admin/certificates/event/${currentEvent?.id}/download-all`}
                className="px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white font-bold text-xs rounded-xl border border-white/20 flex items-center justify-center gap-2 backdrop-blur-md transition-all active:scale-95"
              >
                <FolderDown className="w-4 h-4 text-amber-300" />
                <span>Unduh Semua ZIP</span>
              </a>
            </div>
          </div>

          {/* STORAGE METRICS BAR */}
          <div className="mt-6 pt-4 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
              <span className="text-blue-200">Total Personil: <strong className="text-white font-mono">{stats.total_rows || 0}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              <span className="text-blue-200">Hadir Presensi: <strong className="text-emerald-300 font-mono">{stats.total_attended || 0}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
              <span className="text-blue-200">Sertifikat Terunggah: <strong className="text-amber-300 font-mono">{stats.total_certified || 0}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
              <span className="text-blue-200">Belum Bersertifikat: <strong className="text-rose-300 font-mono">{stats.total_pending || 0}</strong></span>
            </div>
          </div>
        </div>

        {/* CONTROLS & FILTER TABS */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* ROLE & STATUS TABS */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-2xl">
            <button
              onClick={() => handleFilter('all', certStatus)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                role === 'all' ? 'bg-blue-900 text-white shadow-xs' : 'text-slate-700 hover:text-blue-900'
              }`}
            >
              Semua Data ({adminRows.length})
            </button>
            <button
              onClick={() => handleFilter('peserta', certStatus)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                role === 'peserta' ? 'bg-blue-900 text-white shadow-xs' : 'text-slate-700 hover:text-blue-900'
              }`}
            >
              Peserta Saja
            </button>
            <button
              onClick={() => handleFilter('pembicara', certStatus)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                role === 'pembicara' ? 'bg-blue-900 text-white shadow-xs' : 'text-slate-700 hover:text-blue-900'
              }`}
            >
              Narasumber Saja
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleFilter(role, certStatus === 'has_cert' ? 'all' : 'has_cert')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                certStatus === 'has_cert' 
                  ? 'bg-emerald-700 text-white border-emerald-800' 
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              ✓ Sudah Ada Sertifikat
            </button>
            <button
              onClick={() => handleFilter(role, certStatus === 'no_cert' ? 'all' : 'no_cert')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                certStatus === 'no_cert' 
                  ? 'bg-rose-700 text-white border-rose-800' 
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              ⚠ Belum Diunggah
            </button>
          </div>

          {/* SEARCH BAR */}
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari Nama, NIK, Instansi..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-900 focus:bg-white shadow-xs"
            />
          </form>

        </div>

        {/* COMPREHENSIVE ADMINISTRATIVE DATA TABLE */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-900 font-extrabold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3.5 text-center">No</th>
                  <th className="p-3.5">Nama & Role</th>
                  <th className="p-3.5">NIK / NIP</th>
                  <th className="p-3.5">Instansi & Jabatan</th>
                  <th className="p-3.5">NPWP & Bank BJB</th>
                  <th className="p-3.5 text-center">Kehadiran</th>
                  <th className="p-3.5 text-center">Honor / Uang Jalan</th>
                  <th className="p-3.5 text-center">Status Sertifikat</th>
                  <th className="p-3.5 text-center">Aksi File</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {rows && rows.length > 0 ? (
                  rows.map((row, idx) => (
                    <tr 
                      key={row.id || idx} 
                      className={`transition-colors ${
                        row.isNew 
                          ? 'bg-emerald-50 font-bold' 
                          : 'hover:bg-slate-50/80'
                      }`}
                    >
                      
                      {/* 1. NO */}
                      <td className="p-3.5 text-center font-bold text-slate-500">{idx + 1}</td>

                      {/* 2. NAMA & ROLE */}
                      <td className="p-3.5">
                        <strong className="block text-slate-900 font-extrabold">{row.name}</strong>
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase mt-0.5 ${
                          row.role_type === 'pembicara' 
                            ? 'bg-purple-100 text-purple-800 border border-purple-200' 
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}>
                          {row.role_type === 'pembicara' ? 'Narasumber' : 'Peserta'}
                        </span>
                      </td>

                      {/* 3. NIK / NIP */}
                      <td className="p-3.5 font-mono text-[11px] text-slate-700 font-bold">
                        {row.nip_nik || '-'}
                      </td>

                      {/* 4. INSTANSI & JABATAN */}
                      <td className="p-3.5 text-slate-700 max-w-[180px]">
                        <div className="font-bold truncate" title={row.instansi}>{row.instansi}</div>
                        <span className="text-[10px] text-slate-500 truncate block">{row.jabatan}</span>
                      </td>

                      {/* 5. NPWP & REKENING BANK */}
                      <td className="p-3.5 text-slate-700">
                        <div className="text-[11px] font-mono text-slate-600">NPWP: {row.npwp}</div>
                        <div className="text-[11px] font-bold text-emerald-800 mt-0.5">
                          {row.bank_name}: <span className="font-mono">{row.account_number}</span>
                        </div>
                      </td>

                      {/* 6. KEHADIRAN HARI-H */}
                      <td className="p-3.5 text-center">
                        {row.is_attended ? (
                          <div className="space-y-0.5">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                              ✓ HADIR
                            </span>
                            <span className="block text-[9px] font-mono text-slate-500">{row.attended_at}</span>
                          </div>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">
                            Belum Presensi
                          </span>
                        )}
                      </td>

                      {/* 7. HONOR / UANG JALAN */}
                      <td className="p-3.5 text-center font-mono font-bold text-slate-800">
                        {row.role_type === 'pembicara' ? (
                          <span className="text-purple-900">Rp {Number(row.honorarium || 1200000).toLocaleString('id-ID')}</span>
                        ) : (
                          <span className="text-slate-600">Rp {Number(row.transport || 150000).toLocaleString('id-ID')}</span>
                        )}
                      </td>

                      {/* 8. STATUS SERTIFIKAT */}
                      <td className="p-3.5 text-center">
                        {row.has_certificate ? (
                          <div className="space-y-0.5">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-700 text-white shadow-xs">
                              TERUNGGAH ✓
                            </span>
                            <span className="block text-[9px] font-mono font-bold text-slate-500 truncate max-w-[130px] mx-auto">
                              {row.certificate_number}
                            </span>
                          </div>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                            Belum Ada File
                          </span>
                        )}
                      </td>

                      {/* 9. AKSI FILE */}
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {row.certificate_url && (
                            <a
                              href={row.certificate_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg border border-emerald-300 transition-colors"
                              title="Unduh File Sertifikat"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          )}

                          <button
                            type="button"
                            onClick={() => handleOpenSingleModal(row)}
                            className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-900 rounded-lg text-[10px] font-bold border border-blue-200 transition-colors"
                            title={row.has_certificate ? 'Ganti File Sertifikat' : 'Upload File Sertifikat'}
                          >
                            {row.has_certificate ? 'Ganti' : 'Unggah'}
                          </button>

                          {row.has_certificate && (
                            <button
                              type="button"
                              onClick={() => handleDelete(row.certificate_id || row.id)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Hapus Sertifikat"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>

                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="p-12 text-center text-slate-400 space-y-2">
                      <FolderArchive className="w-10 h-10 mx-auto text-slate-300" />
                      <p className="text-xs font-bold text-slate-600">Belum ada data pendaftar atau sertifikat untuk kriteria ini.</p>
                      <p className="text-[11px] text-slate-400">Gunakan tombol Bulk Upload di atas untuk mengunggah sertifikat secara massal.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL 1: BULK UPLOAD / ZIP EXTRACTION */}
        {bulkModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 animate-in fade-in-50">
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-amber-400 text-blue-950 flex items-center justify-center font-bold">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">Bulk Upload Repository Sertifikat</h3>
                    <p className="text-xs text-slate-500">Kegiatan: <strong>{currentEvent?.title}</strong></p>
                  </div>
                </div>
                <button onClick={() => setBulkModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold text-base p-1">
                  ✕
                </button>
              </div>

              {/* MATCHING GUIDANCE ALERT */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-950 space-y-1.5">
                <strong className="font-extrabold flex items-center gap-1.5 text-blue-900">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>SISTEM PENCOCOKAN OTOMATIS BERBASIS NIK & NAMA:</span>
                </strong>
                <p className="text-blue-900/80 leading-relaxed text-[11px]">
                  Sistem akan otomatis mencocokkan setiap file ke peserta dengan membaca <strong>NIK</strong>, <strong>Kode Registrasi</strong>, atau <strong>Nama Peserta</strong> yang tertera pada nama file PDF.
                </p>
                <p className="font-mono text-[10px] text-blue-800 bg-white/80 p-2 rounded-xl border border-blue-200">
                  Contoh nama file: <span className="font-bold">3201011656525520_Sertifikat.pdf</span> atau <span className="font-bold">REG-GD75SS.pdf</span> atau <span className="font-bold">Reza_Fahdi_Faisal.pdf</span>
                </p>
              </div>

              <form onSubmit={handleBulkSubmit} className="space-y-5 text-xs">
                
                {/* OPTION A: MULTI-FILE UPLOAD */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <label className="font-extrabold text-slate-900 block">
                    1. Upload Banyak File Sekaligus (Multi-Select PDF/Gambar):
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={(e) => bulkForm.setData('files', Array.from(e.target.files))}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-900 file:text-white"
                  />
                  {bulkForm.data.files?.length > 0 && (
                    <p className="text-emerald-700 font-bold text-[11px]">
                      ✓ {bulkForm.data.files.length} file dipilih siap diunggah.
                    </p>
                  )}
                </div>

                {/* OPTION B: ZIP FILE UPLOAD */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <label className="font-extrabold text-slate-900 block">
                    2. Atau Upload File Arsip (.ZIP Sertifikat):
                  </label>
                  <input
                    ref={zipInputRef}
                    type="file"
                    accept=".zip"
                    onChange={(e) => bulkForm.setData('zip_file', e.target.files[0])}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-amber-400 file:text-blue-950"
                  />
                  <p className="text-[10px] text-slate-500">
                    Sistem akan mengekstrak seluruh file PDF di dalam ZIP dan mencocokkannya langsung.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setBulkModalOpen(false)}
                    className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={bulkForm.processing}
                    className="px-6 py-2.5 bg-blue-900 hover:bg-blue-950 text-white font-black rounded-xl shadow-md flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {bulkForm.processing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Mengekstrak & Mencocokkan...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 text-amber-400" />
                        <span>Mulai Proses Unggah & Pencocokan</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

            </div>
          </div>
        )}

        {/* MODAL 2: SINGLE UPLOAD / REPLACE MANUAL */}
        {singleModalOpen && selectedTarget && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-200">
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {selectedTarget.has_certificate ? 'Ganti File Sertifikat' : 'Unggah File Sertifikat'}
                  </h3>
                  <p className="text-xs text-slate-500">Penerima: <strong>{selectedTarget.name}</strong></p>
                </div>
                <button onClick={() => setSingleModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold text-sm">✕</button>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-xs">
                <p>NIK: <strong className="font-mono">{selectedTarget.nip_nik}</strong></p>
                <p>Instansi: <strong>{selectedTarget.instansi}</strong></p>
                <p>Role: <strong className="capitalize">{selectedTarget.role_type}</strong></p>
              </div>

              <form onSubmit={handleSingleSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-900 block mb-1">Pilih File Sertifikat Resmi (PDF/Gambar):</label>
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    required
                    onChange={(e) => singleForm.setData('certificate_file', e.target.files[0])}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setSingleModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={singleForm.processing}
                    className="px-5 py-2 bg-blue-900 hover:bg-blue-950 text-white font-extrabold rounded-xl shadow-xs"
                  >
                    {singleForm.processing ? 'Menyimpan...' : 'Simpan & Hubungkan'}
                  </button>
                </div>
              </form>

            </div>
          </div>
        )}

      </div>
    </AppLayout>
  );
}
