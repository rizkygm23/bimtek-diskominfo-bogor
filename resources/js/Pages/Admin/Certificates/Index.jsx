import React, { useState, useRef, useEffect } from 'react';
import { Head, useForm, router, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import {
  FolderArchive,
  Upload,
  Trash2,
  Download,
  Search,
  CheckCircle2,
  ShieldCheck,
  FolderDown,
  RefreshCw,
  AlertCircle,
  X
} from 'lucide-react';
import { useParticipantRealtime } from '@/Hooks/useParticipantRealtime';
import LiveConnectionBadge from '@/Components/LiveConnectionBadge';
import RealtimeToast from '@/Components/RealtimeToast';
import SearchableEventSelect from '@/Components/SearchableEventSelect';

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
        
        {/* HEADER — flat, no gradient */}
        <PageHeader
          eyebrow="Repository Sertifikat Kegiatan"
          eyebrowIcon={FolderArchive}
          title="Repository Sertifikat Digital BIMTEK"
          description="Unggah & kelola sertifikat peserta/narasumber per kegiatan."
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <LiveConnectionBadge isConnected={isConnected} />
              <button
                type="button"
                onClick={() => {
                  bulkForm.setData('event_id', currentEvent?.id);
                  setBulkModalOpen(true);
                }}
                className="px-3.5 py-2 bg-blue-900 hover:bg-blue-950 text-white font-semibold text-xs rounded-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Bulk Upload / ZIP</span>
              </button>
              <a
                href={`/admin/certificates/event/${currentEvent?.id}/download-all`}
                className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-lg border border-slate-200 flex items-center justify-center gap-2"
              >
                <FolderDown className="w-4 h-4" />
                <span>Unduh Semua ZIP</span>
              </a>
            </div>
          }
        />

        {/* EVENT SELECTOR + STORAGE METRICS — flat toolbar */}
        <div className="bg-white p-4 sm:p-5 rounded-lg border border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 shrink-0">
              Kegiatan
            </label>
            <SearchableEventSelect
              events={events}
              value={currentEvent?.id || ''}
              onChange={(id) => handleFilter(role, certStatus, id)}
              className="flex-1 sm:max-w-md"
              required
              placeholder="Cari / pilih kegiatan BIMTEK..."
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-slate-100 pt-4">
            <div className="space-y-0.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Total Personil</p>
              <p className="text-lg font-bold text-slate-900 font-mono">{stats.total_rows || 0}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Hadir Presensi</p>
              <p className="text-lg font-bold text-emerald-700 font-mono">{stats.total_attended || 0}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Sertifikat Terunggah</p>
              <p className="text-lg font-bold text-blue-900 font-mono">{stats.total_certified || 0}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Belum Bersertifikat</p>
              <p className="text-lg font-bold text-rose-600 font-mono">{stats.total_pending || 0}</p>
            </div>
          </div>
        </div>

        {/* CONTROLS & FILTER TABS */}
        <div className="bg-white p-4 sm:p-5 rounded-lg border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* ROLE & STATUS TABS */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => handleFilter('all', certStatus)}
              className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all ${
                role === 'all' ? 'bg-blue-900 text-white' : 'text-slate-700 hover:text-blue-900'
              }`}
            >
              Semua Data ({adminRows.length})
            </button>
            <button
              onClick={() => handleFilter('peserta', certStatus)}
              className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all ${
                role === 'peserta' ? 'bg-blue-900 text-white' : 'text-slate-700 hover:text-blue-900'
              }`}
            >
              Peserta Saja
            </button>
            <button
              onClick={() => handleFilter('pembicara', certStatus)}
              className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all ${
                role === 'pembicara' ? 'bg-blue-900 text-white' : 'text-slate-700 hover:text-blue-900'
              }`}
            >
              Narasumber Saja
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleFilter(role, certStatus === 'has_cert' ? 'all' : 'has_cert')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 ${
                certStatus === 'has_cert'
                  ? 'bg-emerald-700 text-white border-emerald-800'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Sudah Ada Sertifikat</span>
            </button>
            <button
              onClick={() => handleFilter(role, certStatus === 'no_cert' ? 'all' : 'no_cert')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 ${
                certStatus === 'no_cert'
                  ? 'bg-rose-700 text-white border-rose-800'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Belum Diunggah</span>
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
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-900 focus:bg-white"
            />
          </form>

        </div>

        {/* COMPREHENSIVE ADMINISTRATIVE DATA TABLE */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
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
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <CheckCircle2 className="w-3 h-3" />
                              HADIR
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
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-700 text-white">
                              <CheckCircle2 className="w-3 h-3" />
                              TERUNGGAH
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
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-lg max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-sm border border-slate-200 my-auto">
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-lg bg-blue-900 text-white flex items-center justify-center font-bold">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">Bulk Upload Repository Sertifikat</h3>
                    <p className="text-xs text-slate-500">Kegiatan: <strong>{currentEvent?.title}</strong></p>
                  </div>
                </div>
                <button onClick={() => setBulkModalOpen(false)} aria-label="Tutup dialog" className="text-slate-500 hover:text-slate-900 p-2 -m-1 rounded-lg hover:bg-slate-100">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* MATCHING GUIDANCE ALERT */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-xs space-y-3">
                <strong className="font-extrabold flex items-center gap-1.5 text-blue-900">
                  <ShieldCheck className="w-4 h-4" />
                  <span>PANDUAN NAMA FILE &amp; PENCOCOKAN OTOMATIS</span>
                </strong>

                <p className="text-blue-900/80 leading-snug text-[11px] line-clamp-2">
                  Nama file dicocokkan otomatis (NIK / kode registrasi / nama). Huruf besar-kecil diabaikan.
                </p>

                {/* TABEL ATURAN NAMING */}
                <div className="bg-white border border-blue-200 rounded-md overflow-x-auto">
                  <table className="w-full min-w-[430px] text-left text-[10px]">
                    <thead className="bg-blue-100/60 text-blue-900 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="p-2">Identifier</th>
                        <th className="p-2">Prioritas</th>
                        <th className="p-2">Aturan Penulisan di Nama File</th>
                        <th className="p-2">Contoh</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-blue-100 text-slate-700">
                      <tr>
                        <td className="p-2 font-bold">NIK</td>
                        <td className="p-2">1 (tertinggi)</td>
                        <td className="p-2">Angka NIK sebagai bagian nama file. Separator (<code className="font-mono">_</code>, <code className="font-mono">-</code>, spasi) bebas — NIK angka murni.</td>
                        <td className="p-2 font-mono"><span className="font-bold">3201011656525520</span>_Sertifikat.pdf</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-bold">Kode Registrasi</td>
                        <td className="p-2">2</td>
                        <td className="p-2">
                          <strong className="text-rose-700">Wajib pakai tanda hubung <code className="font-mono">-</code></strong> persis seperti format DB (<code className="font-mono">REG-XXXXXX</code> / <code className="font-mono">MAN-XXXXXX</code>). <strong>Jangan</strong> pakai <code className="font-mono">_</code> atau spasi sebagai pengganti <code className="font-mono">-</code>.
                        </td>
                        <td className="p-2 font-mono"><span className="font-bold">REG-GD75SS</span>.pdf</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-bold">Nama Lengkap</td>
                        <td className="p-2">3 (fallback)</td>
                        <td className="p-2">Separator bebas (<code className="font-mono">_</code>, <code className="font-mono">-</code>, spasi, atau tanpa separator) — semua distrip. Kapital bebas.</td>
                        <td className="p-2 font-mono"><span className="font-bold">Reza_Fahdi</span>.pdf</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* CATATAN NAMA GANDA */}
                <div className="flex gap-2 text-amber-800 leading-relaxed text-[11px] bg-amber-50 border border-amber-200 rounded-md p-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                  <p>
                    <strong>Catatan nama ganda:</strong> bila ada 2+ peserta dengan nama sama persis di satu acara, pencocokan berbasis nama <strong>dilewati</strong> agar tidak salah sasaran. Untuk kasus ini, gunakan NIK atau kode registrasi di nama file — atau sambungkan manual via tombol <strong>Unggah</strong> pada baris peserta.
                  </p>
                </div>

                {/* RINGKASAN PRAKTIS */}
                <div className="text-[10px] text-slate-600 bg-slate-50 border border-slate-200 rounded-md p-2 space-y-0.5">
                  <p className="font-bold text-slate-700">Ringkasnya:</p>
                  <p>• <strong>NIK</strong> → paling aman, angka murni, separator &amp; kapital bebas.</p>
                  <p>• <strong>Kode registrasi</strong> → tulis persis <code className="font-mono">REG-XXXXXX</code> (pakai <code className="font-mono">-</code>).</p>
                  <p>• <strong>Nama</strong> → cadangan terakhir; bebas kapital &amp; separator.</p>
                </div>
              </div>

              <form onSubmit={handleBulkSubmit} className="space-y-5 text-xs">
                
                {/* OPTION A: MULTI-FILE UPLOAD */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                  <label className="font-extrabold text-slate-900 block">
                    1. Upload Banyak File Sekaligus (Multi-Select PDF/Gambar):
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={(e) => bulkForm.setData('files', Array.from(e.target.files))}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-blue-900 file:text-white"
                  />
                  {bulkForm.data.files?.length > 0 && (
                    <p className="text-emerald-700 font-bold text-[11px] flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {bulkForm.data.files.length} file dipilih siap diunggah.
                    </p>
                  )}
                </div>

                {/* OPTION B: ZIP FILE UPLOAD */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                  <label className="font-extrabold text-slate-900 block">
                    2. Atau Upload File Arsip (.ZIP Sertifikat):
                  </label>
                  <input
                    ref={zipInputRef}
                    type="file"
                    accept=".zip"
                    onChange={(e) => bulkForm.setData('zip_file', e.target.files[0])}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-blue-900 file:text-white"
                  />
                  <p className="text-[10px] text-slate-500">
                    Sistem akan mengekstrak seluruh file PDF di dalam ZIP dan mencocokkannya langsung.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setBulkModalOpen(false)}
                    className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={bulkForm.processing}
                    className="px-6 py-2.5 bg-blue-900 hover:bg-blue-950 text-white font-black rounded-lg flex items-center gap-2 disabled:opacity-50 cursor-pointer max-w-full"
                  >
                    {bulkForm.processing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Mengekstrak & Mencocokkan...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
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
            <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-5 shadow-sm border border-slate-200">
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {selectedTarget.has_certificate ? 'Ganti File Sertifikat' : 'Unggah File Sertifikat'}
                  </h3>
                  <p className="text-xs text-slate-500">Penerima: <strong>{selectedTarget.name}</strong></p>
                </div>
                <button onClick={() => setSingleModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg space-y-1 text-xs">
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
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setSingleModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={singleForm.processing}
                    className="px-5 py-2 bg-blue-900 hover:bg-blue-950 text-white font-extrabold rounded-lg"
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
