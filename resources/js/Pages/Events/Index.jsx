import React, { useState } from 'react';
import { usePage, useForm, router, Link } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Plus, 
  Clock, 
  Search,
  FileEdit,
  Copy,
  Check,
  QrCode,
  Mic,
  Camera,
  Trash2,
  Edit,
  Sparkles,
  BookOpen,
  ArrowRight
} from 'lucide-react';

export default function Index({ events, registeredEventIds = [] }) {
  const { auth } = usePage().props;
  const user = auth?.user || {};
  const isAdmin = user?.role === 'admin';
  const isSpeaker = user?.role === 'pembicara';

  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [showAdminEntryModal, setShowAdminEntryModal] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [entryRole, setEntryRole] = useState('peserta');
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  // Form state for new / edit BIMTEK
  const eventForm = useForm({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    location: '',
    quota: 50,
    status: 'open',
  });

  // Form state for Admin Direct Entry
  const adminEntryForm = useForm({
    name: '',
    email: '',
    nip_nik: '',
    instansi: '',
    no_hp: '',
    jabatan: 'Masyarakat Umum',
    entry_role: 'peserta',
    bimtek_event_id: '',
  });

  const handleOpenCreateModal = () => {
    setEditingEvent(null);
    eventForm.setData({
      title: '',
      description: '',
      start_date: '',
      end_date: '',
      location: '',
      quota: 50,
      status: 'open',
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingEvent(item);
    const formatForInput = (dStr) => {
      if (!dStr) return '';
      const d = new Date(dStr);
      return d.toISOString().slice(0, 16);
    };

    eventForm.setData({
      title: item.title,
      description: item.description,
      start_date: formatForInput(item.start_date),
      end_date: formatForInput(item.end_date),
      location: item.location,
      quota: item.quota,
      status: item.status,
    });
    setShowModal(true);
  };

  const handleSubmitEvent = (e) => {
    e.preventDefault();
    if (editingEvent) {
      eventForm.put(`/admin/events/${editingEvent.id}`, {
        onSuccess: () => {
          setShowModal(false);
          eventForm.reset();
        }
      });
    } else {
      eventForm.post('/admin/events/store', {
        onSuccess: () => {
          setShowModal(false);
          eventForm.reset();
        }
      });
    }
  };

  const handleDeleteEvent = (id, title) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus kegiatan "${title}"?`)) {
      router.delete(`/admin/events/${id}`);
    }
  };

  const handleAdminDirectEntrySubmit = (e) => {
    e.preventDefault();
    adminEntryForm.post('/register/peserta', {
      onSuccess: () => {
        setShowAdminEntryModal(false);
        adminEntryForm.reset();
        alert('Data Pendaftaran Awal Berhasil Ditambahkan!');
      }
    });
  };

  const openAdminEntryModal = (eventId, role = 'peserta') => {
    setSelectedEventId(eventId);
    setEntryRole(role);
    adminEntryForm.setData({
      name: '',
      email: '',
      nip_nik: '',
      instansi: role === 'peserta' ? 'Masyarakat Umum' : 'Narasumber Diskominfo',
      no_hp: '',
      jabatan: role === 'peserta' ? 'Masyarakat Umum' : 'Pakar / Pembicara',
      entry_role: role,
      bimtek_event_id: eventId,
    });
    setShowAdminEntryModal(true);
  };

  const handleCopyLink = (eventId) => {
    const link = `${window.location.origin}/events/${eventId}/register`;
    navigator.clipboard.writeText(link);
    setCopiedId(eventId);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const filteredEvents = events.filter(e => 
    e.title?.toLowerCase().includes(search.toLowerCase()) || 
    e.location?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout title="Katalog BIMTEK">
      <div className="space-y-6 max-w-7xl mx-auto font-sans">
        
        {/* HEADER & ACTION BUTTONS */}
        <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-900 text-xs font-bold mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Katalog Resmi Bimbingan Teknis</span>
            </div>
            <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-900" />
              <span>Katalog Kegiatan BIMTEK Diskominfo</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              {isAdmin 
                ? 'Kelola daftar kegiatan BIMTEK, atur form pendaftaran kustom, dan pantau kuota peserta.'
                : isSpeaker
                ? 'Daftar jadwal seluruh kegiatan BIMTEK Kabupaten Bogor dan materi penugasan narasumber.'
                : 'Pilih tema kegiatan BIMTEK yang ingin Anda ikuti dan lakukan pendaftaran secara online.'}
            </p>
          </div>

          {isAdmin && (
            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-950 text-white text-xs font-black flex items-center gap-1.5 shadow-xs shrink-0 cursor-pointer transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>+ Buat Kegiatan Baru</span>
            </button>
          )}
        </div>

        {/* SEARCH BAR */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari tema atau lokasi BIMTEK..."
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-900 focus:border-blue-900 shadow-xs outline-none transition-all"
          />
        </div>

        {/* EVENT CARDS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredEvents.map((item) => (
            <div key={item.id} className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col justify-between space-y-4 shadow-xs hover:border-blue-900/40 hover:shadow-md transition-all">
              <div>
                {/* CARD HEADER */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide border ${
                    (item.computed_status || item.status) === 'open'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : (item.computed_status || item.status) === 'ongoing'
                      ? 'bg-blue-50 text-blue-900 border-blue-200'
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}>
                    Status: {(item.computed_status || item.status)}
                  </span>

                  {/* ADMIN EDIT / DELETE */}
                  {isAdmin && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(item)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center gap-1 transition-colors"
                        title="Edit Kegiatan"
                      >
                        <Edit className="w-3 h-3 text-blue-900" />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteEvent(item.id, item.title)}
                        className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-bold flex items-center gap-1 transition-colors"
                        title="Hapus Kegiatan"
                      >
                        <Trash2 className="w-3 h-3 text-rose-600" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  )}

                  <span className="text-[11px] font-extrabold text-slate-600">
                    {item.registrations_count || 0} / {item.quota} Kuota
                  </span>
                </div>

                <h3 className="text-base font-black text-slate-900 line-clamp-2 leading-snug">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>

                {/* EVENT META */}
                <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-slate-700">
                    <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>{new Date(item.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">{item.location}</span>
                  </div>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="pt-3 border-t border-slate-100">
                {isAdmin ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        href={`/admin/events/${item.id}/qr-event`}
                        className="py-2 px-3 rounded-xl bg-blue-900 hover:bg-blue-950 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-xs transition-all text-center"
                      >
                        <QrCode className="w-3.5 h-3.5 text-amber-400" />
                        <span>Layar QR Proyektor</span>
                      </Link>

                      <Link
                        href={`/events/${item.id}`}
                        className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all text-center"
                      >
                        <span>Data Pendaftar &rarr;</span>
                      </Link>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openAdminEntryModal(item.id, 'pembicara')}
                        className="flex-1 py-1.5 px-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 text-[11px] font-bold flex items-center justify-center gap-1.5 border border-purple-200"
                      >
                        <Mic className="w-3.5 h-3.5 text-purple-700" />
                        <span>+ Tambah Narsum</span>
                      </button>

                      <Link
                        href={`/admin/events/${item.id}/form-builder`}
                        className="py-1.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-[11px] font-bold border border-slate-200"
                      >
                        Form Builder &rarr;
                      </Link>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyLink(item.id)}
                      className="w-full py-1.5 text-[11px] font-bold text-slate-500 hover:text-blue-900 flex items-center justify-center gap-1 bg-slate-50 border border-slate-200 rounded-xl transition-colors"
                    >
                      {copiedId === item.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-700 font-extrabold">Link Berhasil Disalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-slate-400" />
                          <span>Salin Link Form Pendaftaran</span>
                        </>
                      )}
                    </button>
                  </div>
                ) : isSpeaker ? (
                  /* PEMBICARA / SPEAKER BUTTONS */
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/events/${item.id}`}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-xs transition-all"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-amber-300" />
                      <span>Lihat Sesi & Silabus</span>
                    </Link>

                    <Link
                      href="/attendance/scan"
                      className="py-2.5 px-4 rounded-xl bg-blue-900 hover:bg-blue-950 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-xs transition-all"
                    >
                      <Camera className="w-3.5 h-3.5 text-amber-400" />
                      <span>Presensi Hari-H</span>
                    </Link>
                  </div>
                ) : (
                  /* PESERTA / PARTICIPANT BUTTONS */
                  <div className="space-y-2">
                    {registeredEventIds.includes(item.id) ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-black">
                          <span>✓ Anda Sudah Terdaftar</span>
                          <Link href={`/events/${item.id}`} className="text-blue-900 font-bold hover:underline">
                            Lihat Tiket &rarr;
                          </Link>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Link
                            href={`/attendance/scan?event_id=${item.id}`}
                            className="py-2.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-xs transition-all text-center"
                          >
                            <Camera className="w-3.5 h-3.5 text-amber-300" />
                            <span>Presensi Hari-H</span>
                          </Link>
                          <Link
                            href={`/events/${item.id}`}
                            className="py-2.5 px-3 rounded-xl bg-blue-900 hover:bg-blue-950 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-xs transition-all text-center"
                          >
                            <QrCode className="w-3.5 h-3.5 text-amber-400" />
                            <span>Tiket & Detail</span>
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/events/${item.id}/register`}
                          className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-xs transition-all"
                        >
                          <FileEdit className="w-3.5 h-3.5 text-amber-300" />
                          <span>Daftar Kegiatan</span>
                        </Link>
                        <Link
                          href={`/events/${item.id}`}
                          className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all"
                        >
                          <span>Detail &rarr;</span>
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>
          ))}
        </div>

        {/* MODAL CREATE / EDIT EVENT */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-extrabold text-slate-900">
                  {editingEvent ? 'Edit Kegiatan BIMTEK' : 'Buat Kegiatan BIMTEK Baru'}
                </h3>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-sm">✕</button>
              </div>

              <form onSubmit={handleSubmitEvent} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-900 block mb-1">Judul Kegiatan BIMTEK:</label>
                  <input
                    type="text"
                    value={eventForm.data.title}
                    onChange={(e) => eventForm.setData('title', e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-900"
                    placeholder="Contoh: BIMTEK Keamanan Siber SPBE 2026"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-900 block mb-1">Deskripsi Kegiatan:</label>
                  <textarea
                    rows={3}
                    value={eventForm.data.description}
                    onChange={(e) => eventForm.setData('description', e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-900"
                    placeholder="Tuliskan tujuan dan materi bimbingan teknis..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-900 block mb-1">Tanggal Mulai:</label>
                    <input
                      type="datetime-local"
                      value={eventForm.data.start_date}
                      onChange={(e) => eventForm.setData('start_date', e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-900"
                      required
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-900 block mb-1">Tanggal Selesai:</label>
                    <input
                      type="datetime-local"
                      value={eventForm.data.end_date}
                      onChange={(e) => eventForm.setData('end_date', e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-900"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-900 block mb-1">Lokasi Kegiatan:</label>
                    <input
                      type="text"
                      value={eventForm.data.location}
                      onChange={(e) => eventForm.setData('location', e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-900"
                      placeholder="Contoh: Auditorium Diskominfo"
                      required
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-900 block mb-1">Kuota Peserta:</label>
                    <input
                      type="number"
                      value={eventForm.data.quota}
                      onChange={(e) => eventForm.setData('quota', e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-900"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={eventForm.processing}
                    className="px-5 py-2 bg-blue-900 hover:bg-blue-950 text-white font-extrabold rounded-xl shadow-xs"
                  >
                    {editingEvent ? 'Simpan Perubahan' : 'Buat Kegiatan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL ADMIN DIRECT ENTRY */}
        {showAdminEntryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Direct Entry Data {entryRole === 'pembicara' ? 'Narasumber' : 'Peserta'}</h3>
                  <p className="text-[11px] text-slate-500">Pendaftaran manual oleh Administrator Diskominfo</p>
                </div>
                <button onClick={() => setShowAdminEntryModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-sm">✕</button>
              </div>

              <form onSubmit={handleAdminDirectEntrySubmit} className="space-y-3.5 text-xs">
                <div>
                  <label className="font-bold text-slate-900 block mb-1">Nama Lengkap:</label>
                  <input
                    type="text"
                    value={adminEntryForm.data.name}
                    onChange={(e) => adminEntryForm.setData('name', e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-900"
                    placeholder="Nama Lengkap dengan Gelar"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-900 block mb-1">Email:</label>
                    <input
                      type="email"
                      value={adminEntryForm.data.email}
                      onChange={(e) => adminEntryForm.setData('email', e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-900"
                      required
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-900 block mb-1">NIP / NIK:</label>
                    <input
                      type="text"
                      value={adminEntryForm.data.nip_nik}
                      onChange={(e) => adminEntryForm.setData('nip_nik', e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-900 block mb-1">Instansi:</label>
                    <input
                      type="text"
                      value={adminEntryForm.data.instansi}
                      onChange={(e) => adminEntryForm.setData('instansi', e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-900"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-900 block mb-1">No. HP / WhatsApp:</label>
                    <input
                      type="text"
                      value={adminEntryForm.data.no_hp}
                      onChange={(e) => adminEntryForm.setData('no_hp', e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-900"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAdminEntryModal(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={adminEntryForm.processing}
                    className="px-5 py-2 bg-blue-900 hover:bg-blue-950 text-white font-extrabold rounded-xl shadow-xs"
                  >
                    Simpan Pendaftaran
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
