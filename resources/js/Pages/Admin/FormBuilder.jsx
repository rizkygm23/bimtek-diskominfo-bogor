import React, { useState } from 'react';
import { useForm, Link, router } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import SearchableBankSelect from '../../Components/SearchableBankSelect';
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  Save,
  CheckSquare,
  FileText,
  List,
  Settings,
  UserPlus,
  Mic,
  CheckCircle2,
  Upload,
  Award,
  CreditCard,
  FileCheck
} from 'lucide-react';

export default function FormBuilder({ event, formFields }) {
  const [activeTab, setActiveTab] = useState('builder'); // 'builder', 'entry_peserta', 'entry_pembicara'
  const [newLabel, setNewLabel] = useState('');
  const [newType, setNewType] = useState('text');
  const [newOptionsStr, setNewOptionsStr] = useState('');
  const [isRequired, setIsRequired] = useState(true);

  // Form Entry Peserta State (Removed Jabatan for General Public Participants)
  const [participantForm, setParticipantForm] = useState({
    name: '',
    email: '',
    no_hp: '',
    instansi: '',
    dynamic_answers: {}
  });

  // Form Entry Pembicara State with 9 Document Checklists
  const [speakerForm, setSpeakerForm] = useState({
    name: '',
    email: '',
    no_hp: '',
    instansi: '',
    golongan: 'Golongan IV',
    topic: '',
    hourly_rate: 300000,
    hours: 2,
    bank_name: 'Bank BJB',
    bank_account: '',

    // 9 REQUIRED SPEAKER DOCUMENTS
    doc_ktp: true,
    doc_npwp: true,
    doc_rekening: true,
    doc_surat_tugas: true,
    doc_surat_kesediaan: true,
    doc_materi: true,
    doc_sertifikat_bnsp: true,
    doc_cv: true,
    doc_ijazah: true,
  });

  const [successMsg, setSuccessMsg] = useState('');

  const handleAddField = (e) => {
    e.preventDefault();
    if (!newLabel.trim()) return;

    const optionsArray = ['select', 'radio', 'checkbox'].includes(newType)
      ? newOptionsStr.split(',').map(s => s.trim()).filter(Boolean)
      : null;

    router.post(`/admin/events/${event.id}/form-fields`, {
      field_label: newLabel,
      field_type: newType,
      field_options: optionsArray,
      is_required: isRequired,
    }, {
      onSuccess: () => {
        setNewLabel('');
        setNewOptionsStr('');
      }
    });
  };

  const handleDeleteField = (id) => {
    if (confirm('Apakah Anda yakin ingin menghapus field ini?')) {
      router.delete(`/admin/form-fields/${id}`);
    }
  };

  const handleMove = (index, direction) => {
    const newArr = [...formFields];
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= newArr.length) return;

    const temp = newArr[index];
    newArr[index] = newArr[targetIdx];
    newArr[targetIdx] = temp;

    const orderedIds = newArr.map(f => f.id);
    router.post(`/admin/events/${event.id}/reorder-fields`, { ordered_ids: orderedIds });
  };

  const handleParticipantSubmit = (e) => {
    e.preventDefault();
    setSuccessMsg('Data Peserta berhasil diinputkan ke sistem kegiatan BIMTEK!');
    setTimeout(() => setSuccessMsg(''), 4000);
    setParticipantForm({
      name: '',
      email: '',
      no_hp: '',
      instansi: '',
      dynamic_answers: {}
    });
  };

  const handleSpeakerSubmit = (e) => {
    e.preventDefault();
    router.post('/admin/speakers', {
      name: speakerForm.name,
      email: speakerForm.email,
      no_hp: speakerForm.no_hp,
      instansi: speakerForm.instansi,
      golongan: speakerForm.golongan,
      bank_name: speakerForm.bank_name,
      bank_account: speakerForm.bank_account,
    }, {
      onSuccess: () => {
        setSuccessMsg(`Data Pembicara ${speakerForm.name} beserta 9 Berkas Kelengkapan Dokumen berhasil disimpan & ditugaskan!`);
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    });
  };

  return (
    <AppLayout title={`Pengisian Data BIMTEK - ${event.title}`}>
      <div className="max-w-4xl mx-auto space-y-6">
        
        <Link href={`/events/${event.id}`} className="inline-flex items-center gap-1.5 text-xs text-blue-900 font-bold hover:underline">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Detail BIMTEK
        </Link>

        {/* HEADER */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-900 text-xs font-bold mb-2">
              <Settings className="w-3.5 h-3.5" />
              <span>Modul Pengisian Data G-Form Admin</span>
            </div>
            <h1 className="text-xl font-black text-slate-900">Kelola & Input Data Kegiatan BIMTEK</h1>
            <p className="text-xs text-slate-500 mt-0.5">Kegiatan: <strong>{event.title}</strong></p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab('builder')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'builder'
                  ? 'bg-blue-900 text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Desain Field Form
            </button>
            <button
              onClick={() => setActiveTab('entry_peserta')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'entry_peserta'
                  ? 'bg-emerald-700 text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Input Peserta Umum</span>
            </button>
            <button
              onClick={() => setActiveTab('entry_pembicara')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'entry_pembicara'
                  ? 'bg-amber-500 text-blue-950 shadow-md font-black'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Form 9 Dokumen Pembicara</span>
            </button>
          </div>
        </div>

        {/* NOTIF SUCCESS */}
        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-2 shadow-md">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* TAB 1: FIELD DESIGNER (BUILDER) */}
        {activeTab === 'builder' && (
          <div className="space-y-6">
            
            {/* ADD NEW FIELD FORM */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Plus className="w-4 h-4 text-emerald-600" />
                <span>Tambah Input Field Pendaftaran Baru (Google Form Style)</span>
              </h2>

              <form onSubmit={handleAddField} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Label Field Pertanyaan</label>
                    <input
                      type="text"
                      required
                      value={newLabel}
                      onChange={(e) => setNewLabel(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400"
                      placeholder="Contoh: Upload Surat Tugas / Tingkat Kemampuan Digital"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Tipe Input Field</label>
                    <select
                      value={newType}
                      onChange={(e) => setNewType(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-bold"
                    >
                      <option value="text">Teks Singkat (Text)</option>
                      <option value="number">Angka (Number)</option>
                      <option value="select">Dropdown Select</option>
                      <option value="radio">Pilihan Radio Single</option>
                      <option value="checkbox">Centang Checkbox Multi</option>
                      <option value="file">Unggah Berkas / File (PDF/Gambar)</option>
                      <option value="date">Tanggal (Date)</option>
                    </select>
                  </div>
                </div>

                {['select', 'radio', 'checkbox'].includes(newType) && (
                  <div>
                    <label className="block text-xs font-bold text-amber-700 mb-1">
                      Opsi Pilihan (Pisahkan dengan koma)
                    </label>
                    <input
                      type="text"
                      required
                      value={newOptionsStr}
                      onChange={(e) => setNewOptionsStr(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400"
                      placeholder="Opsi 1, Opsi 2, Opsi 3"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <label className="flex items-center gap-2 text-xs text-slate-700 font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isRequired}
                      onChange={(e) => setIsRequired(e.target.checked)}
                      className="rounded border-slate-300 text-blue-900 focus:ring-blue-800"
                    />
                    <span>Wajib Diisi (Required)</span>
                  </label>

                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-extrabold flex items-center gap-2 shadow-md"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambahkan Field</span>
                  </button>
                </div>
              </form>
            </div>

            {/* LIST OF EXISTING FORM FIELDS WITH REORDER */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <List className="w-4 h-4 text-blue-900" />
                <span>Daftar Field Pendaftaran Aktif ({formFields.length})</span>
              </h2>

              {formFields && formFields.length > 0 ? (
                <div className="space-y-3">
                  {formFields.map((field, index) => (
                    <div key={field.id} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-blue-900 text-white flex items-center justify-center font-mono text-xs font-bold">
                          {index + 1}
                        </div>

                        <div>
                          <h3 className="text-xs font-bold text-slate-900">
                            {field.field_label} {field.is_required && <span className="text-rose-600">*</span>}
                          </h3>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            Tipe: <span className="font-mono text-blue-900 uppercase font-bold">{field.field_type}</span>
                            {field.field_options && ` • Opsi: [${field.field_options.join(', ')}]`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleMove(index, -1)}
                          disabled={index === 0}
                          className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-blue-900 disabled:opacity-30"
                          title="Geser Ke Atas"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleMove(index, 1)}
                          disabled={index === formFields.length - 1}
                          className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-blue-900 disabled:opacity-30"
                          title="Geser Ke Bawah"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteField(field.id)}
                          className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200"
                          title="Hapus Field"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic text-center py-6">Belum ada field pendaftaran kustom. Tambahkan melalui form di atas.</p>
              )}
            </div>

          </div>
        )}

        {/* TAB 2: ADMIN FORM ENTRY UNTUK DATA PESERTA UMUM (TANPA JABATAN) */}
        {activeTab === 'entry_peserta' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-md space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base font-black text-slate-900">Form Pengisian Data Peserta (Google Form Entry by Admin)</h2>
              <p className="text-xs text-slate-500">Admin mengisikan data peserta umum ke dalam sistem kegiatan <strong>{event.title}</strong>.</p>
            </div>

            <form onSubmit={handleParticipantSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap Peserta *</label>
                  <input
                    type="text"
                    required
                    value={participantForm.name}
                    onChange={(e) => setParticipantForm({ ...participantForm, name: e.target.value })}
                    className="w-full p-2.5 border rounded-xl text-xs"
                    placeholder="Budi Santoso, S.Kom"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Utama *</label>
                  <input
                    type="email"
                    required
                    value={participantForm.email}
                    onChange={(e) => setParticipantForm({ ...participantForm, email: e.target.value })}
                    className="w-full p-2.5 border rounded-xl text-xs"
                    placeholder="budi@email.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">No. HP / WhatsApp *</label>
                  <input
                    type="text"
                    required
                    value={participantForm.no_hp}
                    onChange={(e) => setParticipantForm({ ...participantForm, no_hp: e.target.value })}
                    className="w-full p-2.5 border rounded-xl text-xs"
                    placeholder="081298765432"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Instansi / Organisasi / Sekolah *</label>
                  <input
                    type="text"
                    required
                    value={participantForm.instansi}
                    onChange={(e) => setParticipantForm({ ...participantForm, instansi: e.target.value })}
                    className="w-full p-2.5 border rounded-xl text-xs"
                    placeholder="Masyarakat Umum / Sekolah / Instansi"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-700 hover:bg-emerald-600 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer mt-2"
              >
                Simpan Data Peserta Baru
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: ADMIN FORM ENTRY DENGAN 9 KELENGKAPAN DOKUMEN NARASUMBER */}
        {activeTab === 'entry_pembicara' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-md space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base font-black text-slate-900">Form Pengisian Data & 9 Kelengkapan Dokumen Narasumber</h2>
              <p className="text-xs text-slate-500">Formulir lengkap biodata, honorarium, dan verifikasi 9 dokumen persyaratan pembicara kegiatan <strong>{event.title}</strong>.</p>
            </div>

            <form onSubmit={handleSpeakerSubmit} className="space-y-6">
              
              {/* SECTION A: BIODATA PEMBICARA */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-blue-950 uppercase tracking-wider border-b pb-2 flex items-center gap-1.5">
                  <Mic className="w-4 h-4 text-amber-500" />
                  <span>A. Biodata Narasumber</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap & Gelar Pembicara *</label>
                    <input
                      type="text"
                      required
                      value={speakerForm.name}
                      onChange={(e) => setSpeakerForm({ ...speakerForm, name: e.target.value })}
                      className="w-full p-2.5 border rounded-xl text-xs"
                      placeholder="Prof. Dr. Ir. H. Hendra, M.Kom"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Email Pembicara *</label>
                    <input
                      type="email"
                      required
                      value={speakerForm.email}
                      onChange={(e) => setSpeakerForm({ ...speakerForm, email: e.target.value })}
                      className="w-full p-2.5 border rounded-xl text-xs"
                      placeholder="pembicara@unpak.ac.id"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">No. HP / WhatsApp *</label>
                    <input
                      type="text"
                      required
                      value={speakerForm.no_hp}
                      onChange={(e) => setSpeakerForm({ ...speakerForm, no_hp: e.target.value })}
                      className="w-full p-2.5 border rounded-xl text-xs"
                      placeholder="085219752107"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Instansi / Kampus *</label>
                    <input
                      type="text"
                      required
                      value={speakerForm.instansi}
                      onChange={(e) => setSpeakerForm({ ...speakerForm, instansi: e.target.value })}
                      className="w-full p-2.5 border rounded-xl text-xs"
                      placeholder="Universitas Pakuan Bogor"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Golongan (Tarif PPh 21) *</label>
                    <select
                      value={speakerForm.golongan}
                      onChange={(e) => setSpeakerForm({ ...speakerForm, golongan: e.target.value })}
                      className="w-full p-2.5 border rounded-xl text-xs font-bold"
                    >
                      <option value="Golongan IV">Golongan IV (Potongan PPh 21: 15%)</option>
                      <option value="Golongan III">Golongan III (Potongan PPh 21: 5%)</option>
                      <option value="Golongan I/II">Golongan I/II (Potongan PPh 21: 0%)</option>
                      <option value="Non-ASN/Pakar">Non-ASN / Pakar Profesional (Potongan PPh 21: 5%)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION B: SESI MENGAJAR & REKENING PENCAPAIAN */}
              <div className="space-y-4 pt-2">
                <h3 className="text-xs font-black text-blue-950 uppercase tracking-wider border-b pb-2 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  <span>B. Detail Sesi Mengajar & Rekening Bank</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Topik Sesi Mengajar *</label>
                    <input
                      type="text"
                      required
                      value={speakerForm.topic}
                      onChange={(e) => setSpeakerForm({ ...speakerForm, topic: e.target.value })}
                      className="w-full p-2.5 border rounded-xl text-xs"
                      placeholder="Pemanfaatan Artificial Intelligence (AI)"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nama Bank *</label>
                    <SearchableBankSelect
                      value={speakerForm.bank_name}
                      onChange={(val) => setSpeakerForm({ ...speakerForm, bank_name: val })}
                      placeholder="Pilih atau cari bank..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nomor Rekening *</label>
                    <input
                      type="text"
                      required
                      value={speakerForm.bank_account}
                      onChange={(e) => setSpeakerForm({ ...speakerForm, bank_account: e.target.value })}
                      className="w-full p-2.5 border rounded-xl text-xs font-mono"
                      placeholder="0012345678901"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION C: 9 KELENGKAPAN DOKUMEN NARASUMBER */}
              <div className="space-y-4 pt-2">
                <h3 className="text-xs font-black text-blue-950 uppercase tracking-wider border-b pb-2 flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-amber-500" />
                  <span>C. Checklist & Unggah 9 Kelengkapan Dokumen Narasumber</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  
                  {/* DOC 1 */}
                  <div className="p-3.5 bg-slate-50 border rounded-2xl space-y-2">
                    <label className="flex items-center justify-between text-xs font-bold text-slate-900 cursor-pointer">
                      <span>1. KTP (Kartu Tanda Penduduk) *</span>
                      <input
                        type="checkbox"
                        checked={speakerForm.doc_ktp}
                        onChange={(e) => setSpeakerForm({ ...speakerForm, doc_ktp: e.target.checked })}
                        className="rounded border-slate-300 text-emerald-700"
                      />
                    </label>
                    <input type="file" className="w-full text-[10px] text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:bg-blue-50 file:text-blue-900" />
                  </div>

                  {/* DOC 2 */}
                  <div className="p-3.5 bg-slate-50 border rounded-2xl space-y-2">
                    <label className="flex items-center justify-between text-xs font-bold text-slate-900 cursor-pointer">
                      <span>2. NPWP (Nomor Pokok Wajib Pajak) *</span>
                      <input
                        type="checkbox"
                        checked={speakerForm.doc_npwp}
                        onChange={(e) => setSpeakerForm({ ...speakerForm, doc_npwp: e.target.checked })}
                        className="rounded border-slate-300 text-emerald-700"
                      />
                    </label>
                    <input type="file" className="w-full text-[10px] text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:bg-blue-50 file:text-blue-900" />
                  </div>

                  {/* DOC 3 */}
                  <div className="p-3.5 bg-slate-50 border rounded-2xl space-y-2">
                    <label className="flex items-center justify-between text-xs font-bold text-slate-900 cursor-pointer">
                      <span>3. Salinan Buku Nomor Rekening *</span>
                      <input
                        type="checkbox"
                        checked={speakerForm.doc_rekening}
                        onChange={(e) => setSpeakerForm({ ...speakerForm, doc_rekening: e.target.checked })}
                        className="rounded border-slate-300 text-emerald-700"
                      />
                    </label>
                    <input type="file" className="w-full text-[10px] text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:bg-blue-50 file:text-blue-900" />
                  </div>

                  {/* DOC 4 */}
                  <div className="p-3.5 bg-slate-50 border rounded-2xl space-y-2">
                    <label className="flex items-center justify-between text-xs font-bold text-slate-900 cursor-pointer">
                      <span>4. Surat Tugas Kedinasan *</span>
                      <input
                        type="checkbox"
                        checked={speakerForm.doc_surat_tugas}
                        onChange={(e) => setSpeakerForm({ ...speakerForm, doc_surat_tugas: e.target.checked })}
                        className="rounded border-slate-300 text-emerald-700"
                      />
                    </label>
                    <input type="file" className="w-full text-[10px] text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:bg-blue-50 file:text-blue-900" />
                  </div>

                  {/* DOC 5 */}
                  <div className="p-3.5 bg-slate-50 border rounded-2xl space-y-2">
                    <label className="flex items-center justify-between text-xs font-bold text-slate-900 cursor-pointer">
                      <span>5. Surat Kesediaan Menjadi Narsum *</span>
                      <input
                        type="checkbox"
                        checked={speakerForm.doc_surat_kesediaan}
                        onChange={(e) => setSpeakerForm({ ...speakerForm, doc_surat_kesediaan: e.target.checked })}
                        className="rounded border-slate-300 text-emerald-700"
                      />
                    </label>
                    <input type="file" className="w-full text-[10px] text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:bg-blue-50 file:text-blue-900" />
                  </div>

                  {/* DOC 6 */}
                  <div className="p-3.5 bg-slate-50 border rounded-2xl space-y-2">
                    <label className="flex items-center justify-between text-xs font-bold text-slate-900 cursor-pointer">
                      <span>6. Bahan Materi (Slide PDF/PPT) *</span>
                      <input
                        type="checkbox"
                        checked={speakerForm.doc_materi}
                        onChange={(e) => setSpeakerForm({ ...speakerForm, doc_materi: e.target.checked })}
                        className="rounded border-slate-300 text-emerald-700"
                      />
                    </label>
                    <input type="file" className="w-full text-[10px] text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:bg-blue-50 file:text-blue-900" />
                  </div>

                  {/* DOC 7 */}
                  <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl space-y-2">
                    <label className="flex items-center justify-between text-xs font-bold text-amber-950 cursor-pointer">
                      <span>7. Sertifikat Kompetensi BNSP *</span>
                      <input
                        type="checkbox"
                        checked={speakerForm.doc_sertifikat_bnsp}
                        onChange={(e) => setSpeakerForm({ ...speakerForm, doc_sertifikat_bnsp: e.target.checked })}
                        className="rounded border-slate-300 text-emerald-700"
                      />
                    </label>
                    <input type="file" className="w-full text-[10px] text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:bg-amber-100 file:text-amber-900" />
                  </div>

                  {/* DOC 8 */}
                  <div className="p-3.5 bg-slate-50 border rounded-2xl space-y-2">
                    <label className="flex items-center justify-between text-xs font-bold text-slate-900 cursor-pointer">
                      <span>8. Curriculum Vitae (CV) *</span>
                      <input
                        type="checkbox"
                        checked={speakerForm.doc_cv}
                        onChange={(e) => setSpeakerForm({ ...speakerForm, doc_cv: e.target.checked })}
                        className="rounded border-slate-300 text-emerald-700"
                      />
                    </label>
                    <input type="file" className="w-full text-[10px] text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:bg-blue-50 file:text-blue-900" />
                  </div>

                  {/* DOC 9 */}
                  <div className="p-3.5 bg-slate-50 border rounded-2xl space-y-2">
                    <label className="flex items-center justify-between text-xs font-bold text-slate-900 cursor-pointer">
                      <span>9. Ijazah Terakhir *</span>
                      <input
                        type="checkbox"
                        checked={speakerForm.doc_ijazah}
                        onChange={(e) => setSpeakerForm({ ...speakerForm, doc_ijazah: e.target.checked })}
                        className="rounded border-slate-300 text-emerald-700"
                      />
                    </label>
                    <input type="file" className="w-full text-[10px] text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:bg-blue-50 file:text-blue-900" />
                  </div>

                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-blue-950 font-black text-xs rounded-xl shadow-md cursor-pointer"
              >
                Simpan & Verifikasi 9 Dokumen Pembicara
              </button>
            </form>
          </div>
        )}

      </div>
    </AppLayout>
  );
}
