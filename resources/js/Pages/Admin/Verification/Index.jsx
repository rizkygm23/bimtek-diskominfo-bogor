import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import SearchableEventSelect from '@/Components/SearchableEventSelect';
import { 
  ShieldCheck, 
  Search, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Eye, 
  Building,
  FileCheck
} from 'lucide-react';

export default function VerificationIndex({ profiles, events = [], filters }) {
  const [role, setRole] = useState(filters.role || 'peserta');
  const [status, setStatus] = useState(filters.status || 'all');
  const [search, setSearch] = useState(filters.search || '');
  const [eventId, setEventId] = useState(filters.event_id || '');
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [notes, setNotes] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const applyFilters = (overrides = {}) => {
    const next = {
      role,
      status,
      search,
      event_id: eventId,
      ...overrides,
    };
    setRole(next.role);
    setStatus(next.status);
    setSearch(next.search ?? '');
    setEventId(next.event_id ?? '');
    router.get('/admin/verifications', {
      role: next.role,
      status: next.status,
      search: next.search || undefined,
      event_id: next.event_id || undefined,
    }, { preserveState: true });
  };

  const handleFilter = (newRole, newStatus) => {
    applyFilters({ role: newRole, status: newStatus });
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    applyFilters({ search });
  };

  const openUpdateModal = (profile) => {
    setSelectedProfile(profile);
    setNotes(profile.verification_notes || '');
    setModalOpen(true);
  };

  const handleStatusUpdate = (newStatus) => {
    if (!selectedProfile) return;
    router.post(`/admin/verifications/${selectedProfile.id}/status`, {
      role: role,
      verification_status: newStatus,
      verification_notes: notes,
    }, {
      onSuccess: () => setModalOpen(false),
    });
  };

  // Mask sensitive identity string (e.g. 320102******0005)
  const maskString = (str) => {
    if (!str || str.length < 8) return str || '-';
    return str.substring(0, 4) + '******' + str.substring(str.length - 4);
  };

  return (
    <AppLayout title="Verifikasi Data Administrasi">
      <Head title="Verifikasi Data Administrasi - SIM-BIMTEK Diskominfo" />

      <div className="space-y-6">
        {/* HEADER TITLE */}
        {/* TODO: flatten hero — see PageHeader.jsx */}
        <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-400/20 text-amber-300 rounded-full text-xs font-bold border border-amber-400/30">
              <ShieldCheck className="w-4 h-4" />
              <span>Modul Keamanan & Verifikasi Administrasi</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Verifikasi Berkas KTP, NPWP & Rekening</h1>
            <p className="text-blue-100 text-xs md:text-sm max-w-3xl">
              Verifikasi keabsahan identitas NIK, foto KTP, NPWP, dan rekening bank peserta & narasumber sebelum pencairan honorarium atau uang jalan kedinasan. Dokumen sensitif terlindungi secara private server-side.
            </p>
          </div>
        </div>

        {/* CONTROLE TABS & FILTERS */}
        <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            
            {/* ROLE SWITCHER TABS */}
            <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl w-full sm:w-auto">
              <button
                onClick={() => handleFilter('peserta', status)}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  role === 'peserta' ? 'bg-blue-900 text-white shadow-xs' : 'text-slate-600 hover:text-blue-900'
                }`}
              >
                Data Peserta
              </button>
              <button
                onClick={() => handleFilter('pembicara', status)}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  role === 'pembicara' ? 'bg-blue-900 text-white shadow-xs' : 'text-slate-600 hover:text-blue-900'
                }`}
              >
                Data Narasumber
              </button>
            </div>

            {/* STATUS FILTER PILLS */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {['all', 'belum_diverifikasi', 'terverifikasi', 'perlu_perbaikan'].map((st) => (
                <button
                  key={st}
                  onClick={() => handleFilter(role, st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    status === st
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st === 'all' && 'Semua Status'}
                  {st === 'belum_diverifikasi' && 'Belum Diverifikasi'}
                  {st === 'terverifikasi' && 'Terverifikasi'}
                  {st === 'perlu_perbaikan' && 'Perlu Perbaikan'}
                </button>
              ))}
            </div>

          </div>

          {/* EVENT FILTER + SEARCH */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Filter Kegiatan BIMTEK
              </label>
              <SearchableEventSelect
                events={events}
                value={eventId}
                onChange={(id) => applyFilters({ event_id: id })}
                allowEmpty
                emptyLabel="Semua Kegiatan BIMTEK"
                placeholder="Cari / pilih kegiatan..."
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Cari Identitas
              </label>
              <form onSubmit={handleSearchSubmit} className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={`Cari nama, NIK, NPWP atau ${role === 'peserta' ? 'instansi peserta' : 'instansi narasumber'}...`}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none focus:border-blue-900 focus:bg-white transition-all"
                />
              </form>
            </div>
          </div>
        </div>

        {/* TABLE OF PROFILES */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-900 font-extrabold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-4">Identitas User</th>
                  <th className="p-4">NIK / NIP</th>
                  <th className="p-4">NPWP</th>
                  <th className="p-4">Rekening Bank</th>
                  <th className="p-4">Status Verifikasi</th>
                  <th className="p-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {profiles.data && profiles.data.length > 0 ? (
                  profiles.data.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      
                      <td className="p-4 space-y-0.5">
                        <strong className="block text-slate-900 font-bold">{item.user?.name || 'User'}</strong>
                        <span className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Building className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{item.instansi || item.user?.instansi || '-'}</span>
                        </span>
                      </td>

                      <td className="p-4">
                        <span className="font-mono text-slate-800 font-semibold">{maskString(item.nik || item.nip_nik)}</span>
                      </td>

                      <td className="p-4">
                        <span className="font-mono text-slate-800">{maskString(item.npwp)}</span>
                      </td>

                      <td className="p-4 space-y-0.5">
                        <span className="font-bold text-blue-950 block">{item.bank_name || '-'}</span>
                        <span className="font-mono text-slate-600 block">{maskString(item.account_number)}</span>
                        <span className="text-[10px] text-slate-400">a.n. {item.account_name || '-'}</span>
                      </td>

                      <td className="p-4">
                        {item.verification_status === 'terverifikasi' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-800 font-extrabold rounded-full text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Terverifikasi</span>
                          </span>
                        )}
                        {item.verification_status === 'perlu_perbaikan' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-800 font-extrabold rounded-full text-[11px]">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            <span>Perlu Perbaikan</span>
                          </span>
                        )}
                        {(!item.verification_status || item.verification_status === 'belum_diverifikasi') && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 font-bold rounded-full text-[11px]">
                            <XCircle className="w-3.5 h-3.5 text-slate-400" />
                            <span>Belum Diverifikasi</span>
                          </span>
                        )}
                      </td>

                      <td className="p-4 text-center">
                        <button
                          onClick={() => openUpdateModal(item)}
                          className="px-3 py-1.5 bg-blue-900 hover:bg-blue-950 text-white rounded-xl font-bold text-xs transition-all shadow-xs inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Periksa & Verifikasi</span>
                        </button>
                      </td>

                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-slate-400 text-xs">
                      Tidak ada data verifikasi yang cocok dengan filter saat ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL VERIFIKASI & STREAMING DOKUMEN PRIVATE */}
        {modalOpen && selectedProfile && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">Periksa & Verifikasi Berkas Administrasi</h3>
                  <p className="text-xs text-slate-500">{selectedProfile.user?.name} &bull; {role.toUpperCase()}</p>
                </div>
                <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold text-sm">✕</button>
              </div>

              {/* DETAILS SUMMARY */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block font-semibold">NIK / NIP:</span>
                  <span className="font-mono font-bold text-slate-900">{selectedProfile.nik || selectedProfile.nip_nik || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">NPWP:</span>
                  <span className="font-mono font-bold text-slate-900">{selectedProfile.npwp || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Bank & No. Rekening:</span>
                  <span className="font-bold text-blue-900">{selectedProfile.bank_name || '-'} &bull; {selectedProfile.account_number || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Nama Pemilik Rekening:</span>
                  <span className="font-bold text-slate-900">{selectedProfile.account_name || '-'}</span>
                </div>
              </div>

              {/* SECURE PRIVATE DOCUMENT PREVIEWS */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Dokumen Lampiran (Private Storage Stream):</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  
                  {/* KTP STREAM */}
                  <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 text-center space-y-2">
                    <span className="text-[11px] font-bold text-slate-700 block">Foto Dokumen KTP</span>
                    {selectedProfile.foto_ktp_path ? (
                      <a
                        href={`/documents/stream?type=ktp&role=${role}&id=${selectedProfile.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-900 text-white rounded-lg text-xs font-bold hover:bg-blue-950"
                      >
                        <FileCheck className="w-3.5 h-3.5" />
                        <span>Lihat Dokumen KTP</span>
                      </a>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">Belum diunggah oleh user</span>
                    )}
                  </div>

                  {/* NPWP STREAM */}
                  <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 text-center space-y-2">
                    <span className="text-[11px] font-bold text-slate-700 block">Foto Dokumen NPWP</span>
                    {selectedProfile.foto_npwp_path ? (
                      <a
                        href={`/documents/stream?type=npwp&role=${role}&id=${selectedProfile.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-900 text-white rounded-lg text-xs font-bold hover:bg-blue-950"
                      >
                        <FileCheck className="w-3.5 h-3.5" />
                        <span>Lihat Dokumen NPWP</span>
                      </a>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">Belum diunggah oleh user</span>
                    )}
                  </div>

                </div>
              </div>

              {/* ADMIN NOTES */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-900 block">Catatan Verifikasi (Optional):</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: Nomor rekening BJB cocok dengan nama KTP. Atau: Foto NPWP buram mohon diperbarui."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-900 focus:bg-white h-20"
                />
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex flex-wrap items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleStatusUpdate('perlu_perbaikan')}
                  className="px-4 py-2 bg-amber-100 text-amber-900 hover:bg-amber-200 rounded-xl text-xs font-bold transition-all"
                >
                  Minta Perbaikan
                </button>

                <button
                  type="button"
                  onClick={() => handleStatusUpdate('terverifikasi')}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Setujui (Terverifikasi)</span>
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </AppLayout>
  );
}
