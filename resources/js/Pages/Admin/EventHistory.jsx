import React, { useState } from 'react';
import { useForm, Link, usePage } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import { 
  History, 
  FileSpreadsheet, 
  Download, 
  Upload, 
  Calendar, 
  MapPin, 
  Users, 
  CheckCircle2, 
  Search,
  Eye,
  FileText,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export default function EventHistory({ eventsHistory = [] }) {
  const { auth } = usePage().props;
  const isAdmin = auth?.user?.role === 'admin';

  const [selectedEventId, setSelectedEventId] = useState(eventsHistory[0]?.id || '');
  const [activeModalEvent, setActiveModalEvent] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInputForm, setShowInputForm] = useState(true);

  const activeEvent = eventsHistory.find(e => e.id === Number(selectedEventId)) || eventsHistory[0];

  // Form for New Past Event Entry
  const createForm = useForm({
    title: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    location: 'Auditorium Utama Diskominfo Kab. Bogor',
    speaker_name: '',
    speaker_topic: '',
    description: '',
    attendees_raw: '',
    attendance_file: null,
  });

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!createForm.data.title) {
      alert('Judul Kegiatan BIMTEK wajib diisi!');
      return;
    }
    createForm.post('/admin/events/store-history', {
      onSuccess: () => {
        alert('Data Riwayat Kegiatan BIMTEK berhasil disimpan dan dimasukkan ke dalam riwayat!');
        createForm.reset();
      }
    });
  };

  // Form for Excel / CSV Attendance Upload
  const importForm = useForm({
    file: null,
  });

  const handleImportSubmit = (e) => {
    e.preventDefault();
    if (!importForm.data.file) {
      alert('Pilih file Excel / CSV terlebih dahulu!');
      return;
    }
    if (!selectedEventId) {
      alert('Pilih kegiatan BIMTEK terlebih dahulu!');
      return;
    }

    importForm.post(`/admin/events/${selectedEventId}/import-attendance`, {
      onSuccess: () => {
        alert('Data Kehadiran Peserta dari Excel berhasil diimpor ke dalam riwayat kegiatan!');
        importForm.reset('file');
      }
    });
  };

  // Filtered Events History
  const filteredEvents = eventsHistory.filter(ev => 
    ev.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ev.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Overall Statistics
  const totalEvents = eventsHistory.length;
  const totalAllAttended = eventsHistory.reduce((acc, ev) => acc + ev.total_attended, 0);
  const totalAllRegistrations = eventsHistory.reduce((acc, ev) => acc + ev.total_registrations, 0);

  return (
    <AppLayout title="Riwayat Kegiatan BIMTEK & Import Kehadiran Excel">
      <div className="space-y-6 max-w-7xl mx-auto font-sans">
        
        {/* HEADER TOOLBAR */}
        <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-900 text-xs font-black uppercase mb-1">
              <History className="w-3.5 h-3.5 text-blue-800" />
              <span>Modul Riwayat & Rekapitulasi Presensi Admin</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 flex items-center gap-2">
              <span>Riwayat Kegiatan BIMTEK Sebelumnya</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Daftar kegiatan BIMTEK yang telah maupun sedang berlangsung, beserta fitur import data kehadiran peserta via file Excel / CSV.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href="/admin/template/attendance-excel"
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-extrabold rounded-xl border border-slate-300 flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="Unduh Contoh Format Excel / CSV"
            >
              <Download className="w-4 h-4 text-emerald-700" />
              <span>Template Excel CSV</span>
            </a>
          </div>
        </div>

        {/* STATS OVERVIEW CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-900 text-white flex items-center justify-center text-xl shrink-0 shadow-sm">
              <History className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">Total Kegiatan BIMTEK</span>
              <h2 className="text-2xl font-black text-slate-900">{totalEvents} <span className="text-xs font-semibold text-slate-500">Kegiatan</span></h2>
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-700 text-white flex items-center justify-center text-xl shrink-0 shadow-sm">
              <CheckCircle2 className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">Total Peserta Fix Hadir</span>
              <h2 className="text-2xl font-black text-emerald-700">{totalAllAttended} <span className="text-xs font-semibold text-slate-500">Orang</span></h2>
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-blue-950 flex items-center justify-center text-xl shrink-0 shadow-sm">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">Total Pendaftar Terverifikasi</span>
              <h2 className="text-2xl font-black text-blue-950">{totalAllRegistrations} <span className="text-xs font-semibold text-slate-500">Pendaftar</span></h2>
            </div>
          </div>
        </div>

        {/* FORM INPUT UTAMA: INPUT DATA RIWAYAT KEGIATAN BIMTEK BARU (KHUSUS ROLE ADMIN) */}
        {isAdmin && (
          <div className="bg-white border-2 border-blue-900 rounded-3xl p-6 md:p-8 shadow-md space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-900 text-[11px] font-black uppercase mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-blue-800" />
                  <span>Form Penginputan Riwayat Kegiatan</span>
                </div>
                <h2 className="text-lg md:text-xl font-black text-slate-900">
                  Input Data Riwayat Kegiatan BIMTEK Sebelumnya
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Isi judul kegiatan, tanggal, lokasi, pemateri/narasumber, serta data audiens peserta yang hadir untuk direkap ke dalam sistem.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowInputForm(!showInputForm)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <span>{showInputForm ? 'Sembunyikan Form [-]' : 'Tampilkan Form [+]'}</span>
              </button>
            </div>

            {showInputForm && (
              <form onSubmit={handleCreateSubmit} className="space-y-5">
                
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  
                  {/* 1. JUDUL KEGIATAN */}
                  <div className="md:col-span-8 space-y-1">
                    <label className="block text-xs font-black text-slate-700">1. Judul Kegiatan BIMTEK <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      required
                      value={createForm.data.title}
                      onChange={(e) => createForm.setData('title', e.target.value)}
                      placeholder="Contoh: BIMTEK Keamanan Informasi & Satu Data SDM Aparatur 2026"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-900 focus:border-blue-900 outline-none"
                    />
                  </div>

                  {/* 2. LOKASI */}
                  <div className="md:col-span-4 space-y-1">
                    <label className="block text-xs font-black text-slate-700">2. Lokasi Pelaksanaan <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      required
                      value={createForm.data.location}
                      onChange={(e) => createForm.setData('location', e.target.value)}
                      placeholder="Contoh: Auditorium Utama Diskominfo Kab. Bogor"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-900 focus:border-blue-900 outline-none"
                    />
                  </div>

                  {/* 3. TANGGAL MULAI */}
                  <div className="md:col-span-3 space-y-1">
                    <label className="block text-xs font-black text-slate-700">3. Tanggal Mulai <span className="text-rose-500">*</span></label>
                    <input
                      type="date"
                      required
                      value={createForm.data.start_date}
                      onChange={(e) => createForm.setData('start_date', e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-900 focus:border-blue-900 outline-none"
                    />
                  </div>

                  {/* 4. TANGGAL SELESAI */}
                  <div className="md:col-span-3 space-y-1">
                    <label className="block text-xs font-black text-slate-700">4. Tanggal Selesai <span className="text-rose-500">*</span></label>
                    <input
                      type="date"
                      required
                      value={createForm.data.end_date}
                      onChange={(e) => createForm.setData('end_date', e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-900 focus:border-blue-900 outline-none"
                    />
                  </div>

                  {/* 5. PEMATERI / NARASUMBER */}
                  <div className="md:col-span-3 space-y-1">
                    <label className="block text-xs font-black text-slate-700">5. Nama Pemateri / Narasumber</label>
                    <input
                      type="text"
                      value={createForm.data.speaker_name}
                      onChange={(e) => createForm.setData('speaker_name', e.target.value)}
                      placeholder="Contoh: Dr. Ir. H. Ahmad Sudrajat, M.Kom"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-900 focus:border-blue-900 outline-none"
                    />
                  </div>

                  {/* 6. TOPIK MATERI */}
                  <div className="md:col-span-3 space-y-1">
                    <label className="block text-xs font-black text-slate-700">6. Topik Materi Pemateri</label>
                    <input
                      type="text"
                      value={createForm.data.speaker_topic}
                      onChange={(e) => createForm.setData('speaker_topic', e.target.value)}
                      placeholder="Contoh: Manajerial Keamanan Siber & Informasi"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-900 focus:border-blue-900 outline-none"
                    />
                  </div>

                </div>

                {/* DATA AUDIENS PESERTA */}
                <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                    <div>
                      <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-blue-900" />
                        <span>7. Data Audiens Peserta Yang Hadir</span>
                      </h3>
                      <p className="text-[11px] text-slate-500">Anda dapat mengetik/meng-copypaste daftar peserta ATAU mengunggah berkas Excel/CSV.</p>
                    </div>
                    <a
                      href="/admin/template/attendance-excel"
                      className="text-[11px] font-bold text-emerald-700 hover:underline flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Contoh Format (.csv)</span>
                    </a>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    {/* OPTION A: TEXT AREA */}
                    <div className="md:col-span-7 space-y-1">
                      <label className="block text-[11px] font-bold text-slate-700">Option A: Ketik / Copy Paste Daftar Peserta (Format: NIP_NIK; Nama; Instansi; Email):</label>
                      <textarea
                        rows="4"
                        value={createForm.data.attendees_raw}
                        onChange={(e) => createForm.setData('attendees_raw', e.target.value)}
                        placeholder="198503122010011002; Budi Santoso, S.STP; Diskominfo Kab. Bogor; budi@bogorkab.go.id&#10;3201011656525520; Siti Rahmawati, M.Si; Bappedalitbang; siti@bogorkab.go.id"
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:ring-2 focus:ring-blue-900 outline-none"
                      ></textarea>
                    </div>

                    {/* OPTION B: EXCEL UPLOAD */}
                    <div className="md:col-span-5 space-y-1">
                      <label className="block text-[11px] font-bold text-slate-700">Option B: Berkas Excel / CSV Kehadiran:</label>
                      <div className="p-4 bg-white border border-dashed border-slate-300 rounded-xl text-center space-y-2">
                        <FileSpreadsheet className="w-8 h-8 mx-auto text-emerald-600" />
                        <input
                          type="file"
                          accept=".csv,.xlsx,.xls,.txt"
                          onChange={(e) => createForm.setData('attendance_file', e.target.files[0])}
                          className="block w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-100 file:text-emerald-800 hover:file:bg-emerald-200 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* SUBMIT BUTTON */}
                <div className="flex items-center justify-end pt-2">
                  <button
                    type="submit"
                    disabled={createForm.processing}
                    className="px-6 py-3 bg-blue-900 hover:bg-blue-800 text-white font-black text-xs rounded-xl shadow-lg flex items-center gap-2 cursor-pointer transition-transform active:scale-95 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4 text-amber-300" />
                    <span>Simpan Riwayat Kegiatan & Audiens &rarr;</span>
                  </button>
                </div>

              </form>
            )}
          </div>
        )}

        {/* SECTION 2: LIST OF PAST BIMTEK EVENTS WITH DETAILS */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <History className="w-4.5 h-4.5 text-blue-900" />
                <span>Daftar Riwayat Kegiatan BIMTEK</span>
              </h2>
              <p className="text-xs text-slate-500">
                Klik tombol "Lihat Kehadiran" untuk menampilkan seluruh data orang yang Fix Hadir pada kegiatan tersebut.
              </p>
            </div>

            {/* SEARCH FILTER */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari Judul Kegiatan..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-900"
              />
            </div>
          </div>

          {/* GRID OF PAST EVENTS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredEvents.length > 0 ? (
              filteredEvents.map((ev) => (
                <div key={ev.id} className="bg-slate-50/70 border border-slate-200/90 rounded-2xl p-5 space-y-4 hover:border-blue-300 transition-all shadow-xs">
                  
                  {/* BADGES & TITLE */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                        (ev.computed_status || ev.status) === 'completed'
                          ? 'bg-slate-200 text-slate-800 border-slate-300'
                          : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      }`}>
                        {(ev.computed_status || ev.status) === 'completed' ? '✓ SELESAI' : '• BERLANGSUNG'}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500 font-bold">
                        Kuota: {ev.quota} Orang
                      </span>
                    </div>

                    <h3 className="text-base font-extrabold text-blue-950 leading-snug">
                      {ev.title}
                    </h3>
                  </div>

                  {/* EVENT DETAILS */}
                  <div className="space-y-1.5 text-xs text-slate-600 font-medium">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-blue-800 shrink-0" />
                      <span>{ev.start_date} s/d {ev.end_date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span className="truncate">{ev.location}</span>
                    </div>
                  </div>

                  {/* ATTENDANCE PROGRESS BAR */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-700">Persentase Kehadiran:</span>
                      <span className="text-blue-950 font-black">{ev.total_attended} / {ev.total_registrations} Hadir ({ev.attendance_percentage}%)</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                      {/* TODO: flatten hero — see PageHeader.jsx (progress bar) */}
                      <div
                        className="h-full bg-gradient-to-r from-blue-900 to-emerald-600 transition-all duration-500"
                        style={{ width: `${Math.min(ev.attendance_percentage, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* ACTION BUTTONS */}
                  <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setActiveModalEvent(ev)}
                      className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-transform active:scale-95"
                    >
                      <Eye className="w-4 h-4 text-amber-300" />
                      <span>Lihat Data Kehadiran ({ev.total_attended})</span>
                    </button>

                    <a
                      href="/admin/reports/participants"
                      className="px-3 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold text-xs rounded-xl border border-emerald-300 flex items-center gap-1"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Rekap PDF</span>
                    </a>
                  </div>

                </div>
              ))
            ) : (
              <div className="col-span-2 p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-slate-500 italic">
                Tidak ada riwayat kegiatan BIMTEK yang ditemukan.
              </div>
            )}
          </div>

        </div>

        {/* MODAL / DRAWER FOR DETAILED ATTENDEES OF SELECTED PAST EVENT */}
        {activeModalEvent && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in-50">
              
              {/* MODAL HEADER */}
              <div className="p-6 bg-blue-950 text-white flex items-center justify-between border-b border-blue-900">
                <div>
                  <span className="text-[10px] font-black uppercase text-amber-300 tracking-wider block">
                    Detail Rekap Kehadiran BIMTEK:
                  </span>
                  <h2 className="text-lg font-black text-white">{activeModalEvent.title}</h2>
                  <p className="text-xs text-blue-200">
                    Total Peserta Fix Hadir: <strong className="text-amber-300 font-black">{activeModalEvent.total_attended} Orang</strong>
                  </p>
                </div>

                <button
                  onClick={() => setActiveModalEvent(null)}
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-lg flex items-center justify-center transition-colors cursor-pointer"
                >
                  &times;
                </button>
              </div>

              {/* MODAL BODY TABLE */}
              <div className="p-6 overflow-y-auto space-y-4 flex-1">
                
                <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 border-b border-slate-200 font-black text-slate-900">
                      <tr>
                        <th className="p-3 text-center w-10">No</th>
                        <th className="p-3">Kode Registrasi</th>
                        <th className="p-3">NIP / NIK</th>
                        <th className="p-3">Nama Peserta</th>
                        <th className="p-3">Instansi</th>
                        <th className="p-3 text-center">Metode Presensi</th>
                        <th className="p-3 text-center">Waktu Presensi</th>
                        <th className="p-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {activeModalEvent.attendees_list.length > 0 ? (
                        activeModalEvent.attendees_list.map((att, idx) => (
                          <tr key={att.registration_id} className="hover:bg-slate-50">
                            <td className="p-3 text-center font-bold">{idx + 1}</td>
                            <td className="p-3 font-mono font-bold text-blue-900">{att.registration_code}</td>
                            <td className="p-3 font-mono text-slate-700">{att.nip_nik || '-'}</td>
                            <td className="p-3 font-black text-slate-900">{att.name}</td>
                            <td className="p-3 font-medium text-slate-700">{att.instansi}</td>
                            <td className="p-3 text-center">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                                att.method === 'Import Excel' 
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                                  : 'bg-blue-100 text-blue-900 border-blue-300'
                              }`}>
                                {att.method}
                              </span>
                            </td>
                            <td className="p-3 text-center font-mono font-bold text-slate-800">{att.checked_in_at}</td>
                            <td className="p-3 text-center">
                              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                                ✓ FIX HADIR
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="8" className="p-6 text-center italic text-slate-400">
                            Belum ada peserta yang Fix Hadir untuk kegiatan ini. Silakan gunakan fitur Import Excel Kehadiran.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

              </div>

              {/* MODAL FOOTER */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
                <button
                  onClick={() => setActiveModalEvent(null)}
                  className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-extrabold text-xs rounded-xl cursor-pointer"
                >
                  Tutup
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </AppLayout>
  );
}
