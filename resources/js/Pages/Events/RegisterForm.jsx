import React from 'react';
import { useForm, Link } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import SearchableBankSelect from '../../Components/SearchableBankSelect';
import { 
  FileText, 
  User, 
  Mail, 
  CreditCard, 
  Building, 
  Upload, 
  ArrowLeft, 
  CheckCircle2, 
  Sparkles, 
  Phone, 
  Send,
  Lock,
  ShieldCheck,
  Building2,
  FileCheck,
  Mic,
  Award
} from 'lucide-react';

export default function RegisterForm({ 
  event, 
  user, 
  participantProfile, 
  speakerProfile, 
  speaker, 
  eventSpeaker, 
  isSpeaker = false 
}) {
  const isUserSpeaker = isSpeaker || user?.role === 'pembicara';

  const { data, setData, post, processing, errors } = useForm({
    name: user?.name || '',
    email: user?.email || '',
    no_hp: isUserSpeaker ? (user?.no_hp || '') : (participantProfile?.no_hp || user?.no_hp || ''),
    instansi: isUserSpeaker 
      ? (speakerProfile?.instansi || speaker?.instansi || user?.instansi || '') 
      : (participantProfile?.instansi || user?.instansi || 'Masyarakat Umum / Instansi'),
    jabatan: user?.jabatan || (isUserSpeaker ? 'Narasumber / Pakar' : 'Peserta BIMTEK'),
    
    // Speaker Specific
    topic: eventSpeaker?.topic || `Pemaparan Materi: ${event.title}`,
    golongan: speakerProfile?.golongan || speaker?.golongan || 'Golongan IV',
    
    // Administrative Data
    nik: isUserSpeaker ? (speakerProfile?.nip_nik || user?.nip_nik || '') : (participantProfile?.nik || user?.nip_nik || ''),
    nip_nik: isUserSpeaker ? (speakerProfile?.nip_nik || user?.nip_nik || '') : (user?.nip_nik || ''),
    npwp: isUserSpeaker ? (speakerProfile?.npwp || '') : (participantProfile?.npwp || ''),
    
    // Bank Account Data for Honorarium / Transport Disbursement
    bank_name: isUserSpeaker 
      ? (speakerProfile?.bank_name || speaker?.bank_name || 'Bank BJB (Jawa Barat & Banten)') 
      : (participantProfile?.bank_name || 'Bank BJB (Jawa Barat & Banten)'),
    account_number: isUserSpeaker 
      ? (speakerProfile?.account_number || speaker?.account_number || '') 
      : (participantProfile?.account_number || ''),
    account_name: isUserSpeaker 
      ? (speakerProfile?.account_name || speaker?.account_name || user?.name || '') 
      : (participantProfile?.account_name || user?.name || ''),

    // Files
    foto_ktp: null,
    foto_npwp: null,
    salinan_buku_rekening: null,
    bahan_materi: null,

    // Dynamic Form Answers
    answers: {},
  });

  const handleInputChange = (fieldId, value) => {
    const newAnswers = { ...data.answers, [fieldId]: value };
    setData('answers', newAnswers);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    post(`/events/${event.id}/register`, {
      forceFormData: true,
    });
  };

  // -------------------------------------------------------------
  // VIEW KHUSUS ROLE PEMBICARA / NARASUMBER (SESUAI REQUEST USER)
  // -------------------------------------------------------------
  if (isUserSpeaker) {
    return (
      <AppLayout title={`Kelengkapan Berkas Narasumber - ${event.title}`}>
        <div className="max-w-3xl mx-auto space-y-6 font-sans">
          
          <Link href={`/events/${event.id}`} className="inline-flex items-center gap-1.5 text-xs text-blue-900 font-bold hover:underline">
            <ArrowLeft className="w-4 h-4" /> Kembali ke Detail BIMTEK
          </Link>

          {/* FORM HEADER BANNER */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 space-y-2 shadow-xs">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-950 text-xs font-bold">
              <Mic className="w-3.5 h-3.5 text-amber-600" />
              <span>Konfirmasi Penugasan & Berkas Persyaratan Narasumber</span>
            </div>
            <h1 className="text-xl font-black text-slate-900 leading-snug">{event.title}</h1>
            <p className="text-xs text-slate-500 leading-relaxed">
              Lengkapi data administrasi, golongan pajak PPh 21, nomor rekening pencairan honorarium, dan 4 berkas persyaratan sebelum Anda mengisi kegiatan BIMTEK. Tiket Presensi QR Code akan otomatis diterbitkan.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* SECTION 1: PROFIL & BIODATA NARASUMBER */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 space-y-5 shadow-xs">
              <div className="border-b border-slate-100 pb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-black text-blue-900 flex items-center gap-2 uppercase tracking-wider">
                  <User className="w-4 h-4 text-amber-500" />
                  <span>1. Profil & Biodata Narasumber</span>
                </h2>
                <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                  Narasumber Terdaftar
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Nama Pembicara & Gelar *</label>
                  <input
                    type="text"
                    required
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-900"
                    placeholder="Prof. Dr. Ir. H. Hendra, M.Kom"
                  />
                  {errors.name && <p className="text-xs text-rose-600 font-bold">{errors.name}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">NIP / NIK KTP *</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    required
                    minLength={16}
                    maxLength={18}
                    value={data.nip_nik}
                    onChange={(e) => setData('nip_nik', e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-900"
                    placeholder="19750812200301002"
                  />
                  {errors.nip_nik && <p className="text-xs text-rose-600 font-bold">{errors.nip_nik}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Email Kedinasan / Utama *</label>
                  <input
                    type="email"
                    required
                    value={data.email}
                    onChange={(e) => setData('email', e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-900"
                    placeholder="narasumber@unpak.ac.id"
                  />
                  {errors.email && <p className="text-xs text-rose-600 font-bold">{errors.email}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">No. WhatsApp / Telepon *</label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    pattern="08[0-9]{7,12}"
                    required
                    value={data.no_hp}
                    onChange={(e) => setData('no_hp', e.target.value.replace(/[^0-9]/g, ''))}
                    maxLength={14}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-900"
                    placeholder="085219752107"
                  />
                  {errors.no_hp && <p className="text-xs text-rose-600 font-bold">{errors.no_hp}</p>}
                </div>
              </div>

              {/* BARIS KAMPUS & GOLONGAN ASN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Instansi / Kampus *</label>
                  <input
                    type="text"
                    required
                    value={data.instansi}
                    onChange={(e) => setData('instansi', e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-900"
                    placeholder="Universitas Pakuan Bogor"
                  />
                  {errors.instansi && <p className="text-xs text-rose-600 font-bold">{errors.instansi}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Golongan ASN (Tarif Pajak PPh 21) *</label>
                  <select
                    value={data.golongan}
                    onChange={(e) => setData('golongan', e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-extrabold text-blue-950 focus:bg-white focus:outline-none focus:border-blue-900 cursor-pointer"
                  >
                    <option value="Golongan IV">Golongan IV (Potongan PPh 21: 15%)</option>
                    <option value="Golongan III">Golongan III (Potongan PPh 21: 5%)</option>
                    <option value="Non-ASN">Non-ASN / Pakar Profesional (Potongan PPh 21: 2.5%)</option>
                  </select>
                  {errors.golongan && <p className="text-xs text-rose-600 font-bold">{errors.golongan}</p>}
                </div>
              </div>

              {/* BARIS REKENING BANK (SEARCHABLE) & NO REKENING */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Nama Bank Pencairan *</label>
                  <SearchableBankSelect
                    value={data.bank_name}
                    onChange={(val) => setData('bank_name', val)}
                    error={errors.bank_name}
                    placeholder="Pilih atau cari bank pencairan..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Nomor Rekening Bank *</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    required
                    value={data.account_number}
                    onChange={(e) => setData('account_number', e.target.value.replace(/[^0-9]/g, ''))}
                    maxLength={24}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-900"
                    placeholder="0012345678901"
                  />
                  {errors.account_number && <p className="text-xs text-rose-600 font-bold">{errors.account_number}</p>}
                </div>
              </div>

              {/* NAMA PEMILIK REKENING & TOPIK MATERI */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Nama Pemilik Rekening *</label>
                  <input
                    type="text"
                    required
                    value={data.account_name}
                    onChange={(e) => setData('account_name', e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-900"
                    placeholder="Sesuai buku tabungan rekening"
                  />
                  {errors.account_name && <p className="text-xs text-rose-600 font-bold">{errors.account_name}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Topik Sesi Materi yang Dibawakan *</label>
                  <input
                    type="text"
                    required
                    value={data.topic}
                    onChange={(e) => setData('topic', e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-900"
                    placeholder="Contoh: Arsitektur SPBE & Audit Keamanan Informasi"
                  />
                  {errors.topic && <p className="text-xs text-rose-600 font-bold">{errors.topic}</p>}
                </div>
              </div>

            </div>

            {/* SECTION 2: UNGGAH KELENGKAPAN BERKAS PERSYARATAN */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 space-y-4 shadow-xs">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <h2 className="text-sm font-black text-blue-900 flex items-center gap-2 uppercase tracking-wider">
                  <FileCheck className="w-4 h-4 text-amber-500" />
                  <span>2. UNGGAH KELENGKAPAN BERKAS PERSYARATAN</span>
                </h2>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                  Dokumen Persyaratan
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                
                {/* 1. KTP */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 hover:bg-amber-50/30 transition-all">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800 block">1. KTP (Kartu Tanda Penduduk) *</label>
                    {speakerProfile?.foto_ktp_path && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">✓ Tersimpan</span>
                    )}
                  </div>
                  <input 
                    type="file" 
                    required={!speakerProfile?.foto_ktp_path}
                    onChange={(e) => setData('foto_ktp', e.target.files[0])}
                    className="w-full text-[11px] text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-900 file:text-white hover:file:bg-blue-800 cursor-pointer" 
                    accept=".pdf,.jpg,.jpeg,.png" 
                  />
                  <p className="text-[10px] text-slate-400">Format: JPG, PNG, atau PDF (Maks. 5 MB)</p>
                  {errors.foto_ktp && <p className="text-xs text-rose-600 font-bold">{errors.foto_ktp}</p>}
                </div>

                {/* 2. NPWP */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 hover:bg-amber-50/30 transition-all">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800 block">2. NPWP (Kartu Pajak) *</label>
                    {speakerProfile?.foto_npwp_path && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">✓ Tersimpan</span>
                    )}
                  </div>
                  <input 
                    type="file" 
                    required={!speakerProfile?.foto_npwp_path}
                    onChange={(e) => setData('foto_npwp', e.target.files[0])}
                    className="w-full text-[11px] text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-900 file:text-white hover:file:bg-blue-800 cursor-pointer" 
                    accept=".pdf,.jpg,.jpeg,.png" 
                  />
                  <p className="text-[10px] text-slate-400">Format: JPG, PNG, atau PDF (Maks. 5 MB)</p>
                  {errors.foto_npwp && <p className="text-xs text-rose-600 font-bold">{errors.foto_npwp}</p>}
                </div>

                {/* 3. SALINAN BUKU NOMOR REKENING */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 hover:bg-amber-50/30 transition-all">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800 block">3. Salinan Buku Nomor Rekening *</label>
                    {speakerProfile?.salinan_buku_rekening_path && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">✓ Tersimpan</span>
                    )}
                  </div>
                  <input 
                    type="file" 
                    required={!speakerProfile?.salinan_buku_rekening_path}
                    onChange={(e) => setData('salinan_buku_rekening', e.target.files[0])}
                    className="w-full text-[11px] text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-900 file:text-white hover:file:bg-blue-800 cursor-pointer" 
                    accept=".pdf,.jpg,.jpeg,.png" 
                  />
                  <p className="text-[10px] text-slate-400">Format: JPG, PNG, atau PDF (Maks. 5 MB)</p>
                  {errors.salinan_buku_rekening && <p className="text-xs text-rose-600 font-bold">{errors.salinan_buku_rekening}</p>}
                </div>

                {/* 4. BAHAN PAPARAN MATERI */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 hover:bg-amber-50/30 transition-all">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800 block">4. Materials / Bahan Paparan Materi</label>
                    {speakerProfile?.bahan_materi_path && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">✓ Tersimpan</span>
                    )}
                  </div>
                  <input 
                    type="file" 
                    onChange={(e) => setData('bahan_materi', e.target.files[0])}
                    className="w-full text-[11px] text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-900 file:text-white hover:file:bg-blue-800 cursor-pointer" 
                    accept=".pdf,.pptx,.ppt,.docx" 
                  />
                  <p className="text-[10px] text-slate-400">Format: PDF, PPTX, PPT, atau DOCX (Maks. 20 MB)</p>
                  {errors.bahan_materi && <p className="text-xs text-rose-600 font-bold">{errors.bahan_materi}</p>}
                </div>

              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={processing}
                className="w-full py-4 px-6 bg-blue-900 hover:bg-blue-800 text-white font-extrabold text-xs rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
              >
                <Send className="w-4 h-4 text-amber-400" />
                <span>Konfirmasi Penugasan & Simpan Berkas Persyaratan</span>
              </button>
            </div>

          </form>

        </div>
      </AppLayout>
    );
  }

  // -------------------------------------------------------------
  // VIEW REGULER UNTUK ROLE PESERTA (user.role === 'user')
  // -------------------------------------------------------------
  return (
    <AppLayout title={`Form Pendaftaran & Administrasi - ${event.title}`}>
      <div className="max-w-3xl mx-auto space-y-6 font-sans">
        
        <Link href={`/events/${event.id}`} className="inline-flex items-center gap-1.5 text-xs text-blue-900 font-bold hover:underline">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Detail BIMTEK
        </Link>

        {/* FORM HEADER BANNER */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 space-y-2 shadow-xs">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-900 text-xs font-bold">
            <FileCheck className="w-3.5 h-3.5 text-amber-500" />
            <span>Formulir Pendaftaran & Berkas Administrasi Peserta</span>
          </div>
          <h1 className="text-xl font-black text-slate-900 leading-snug">{event.title}</h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            Lengkapi data identitas, NIK KTP, dan rekening pencairan uang saku / transport Anda sebelum mengikuti kegiatan BIMTEK. Tiket Presensi QR Code akan otomatis diterbitkan setelah pengisian formulir.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* SECTION 1: DATA IDENTITAS DIRI PESERTA */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 space-y-5 shadow-xs">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <h2 className="text-sm font-black text-blue-900 flex items-center gap-2 uppercase tracking-wider">
                <User className="w-4 h-4 text-emerald-600" />
                <span>1. Data Identitas Utama Peserta</span>
              </h2>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">Langkah 1 dari 3</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  value={data.name}
                  onChange={(e) => setData('name', e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-900"
                  placeholder="Nama lengkap sesuai KTP"
                />
                {errors.name && <p className="text-xs text-rose-600 font-bold">{errors.name}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Email Aktif *</label>
                <input
                  type="email"
                  required
                  value={data.email}
                  onChange={(e) => setData('email', e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-900"
                  placeholder="alamat@email.com"
                />
                {errors.email && <p className="text-xs text-rose-600 font-bold">{errors.email}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">No. WhatsApp / HP Aktif *</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="08[0-9]{7,12}"
                  required
                  value={data.no_hp}
                  onChange={(e) => setData('no_hp', e.target.value.replace(/[^0-9]/g, ''))}
                  maxLength={14}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-900"
                  placeholder="081234567890"
                />
                {errors.no_hp && <p className="text-xs text-rose-600 font-bold">{errors.no_hp}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Instansi / Unit Kerja / Asal Lembaga *</label>
                <input
                  type="text"
                  required
                  value={data.instansi}
                  onChange={(e) => setData('instansi', e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-900"
                  placeholder="Diskominfo Kab. Bogor / Umum"
                />
                {errors.instansi && <p className="text-xs text-rose-600 font-bold">{errors.instansi}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Jabatan / Pekerjaan</label>
              <input
                type="text"
                value={data.jabatan}
                onChange={(e) => setData('jabatan', e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-900"
                placeholder="Staff IT / Analis / Pranata Komputer / Umum"
              />
            </div>
          </div>

          {/* SECTION 2: DATA ADMINISTRASI & KEPENDUDUKAN (KTP & NPWP) */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 space-y-5 shadow-xs">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <h2 className="text-sm font-black text-blue-900 flex items-center gap-2 uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>2. Data Administrasi & Kependudukan</span>
              </h2>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">Langkah 2 dari 3</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">NIK (Nomor Induk Kependudukan - 16 Digit) *</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  required
                  minLength={16}
                  maxLength={16}
                  value={data.nik}
                  onChange={(e) => setData('nik', e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-900"
                  placeholder="3201012345678901"
                />
                {errors.nik && <p className="text-xs text-rose-600 font-bold">{errors.nik}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Unggah Foto / Scan KTP (Opsional/Bila Diminta)</label>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={(e) => setData('foto_ktp', e.target.files[0])}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-900 file:text-white hover:file:bg-blue-800 cursor-pointer"
                />
                {errors.foto_ktp && <p className="text-xs text-rose-600 font-bold">{errors.foto_ktp}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">NPWP (Nomor Pokok Wajib Pajak)</label>
                <input
                  type="text"
                  value={data.npwp}
                  onChange={(e) => setData('npwp', e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-blue-900"
                  placeholder="12.345.678.9-404.000 (Jika ada)"
                />
                {errors.npwp && <p className="text-xs text-rose-600 font-bold">{errors.npwp}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Unggah Foto / Scan NPWP (Opsional)</label>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={(e) => setData('foto_npwp', e.target.files[0])}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-100 file:text-slate-800 hover:file:bg-slate-200 cursor-pointer"
                />
                {errors.foto_npwp && <p className="text-xs text-rose-600 font-bold">{errors.foto_npwp}</p>}
              </div>
            </div>
          </div>

          {/* SECTION 3: REKENING BANK PENCAIRAN HONORARIUM / TRANSPORT */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 space-y-5 shadow-xs">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <h2 className="text-sm font-black text-blue-900 flex items-center gap-2 uppercase tracking-wider">
                <CreditCard className="w-4 h-4 text-purple-600" />
                <span>3. Rekening Bank Pencairan Uang Saku / Transport</span>
              </h2>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">Langkah 3 dari 3</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Nama Bank *</label>
                <SearchableBankSelect
                  value={data.bank_name}
                  onChange={(val) => setData('bank_name', val)}
                  error={errors.bank_name}
                  placeholder="Pilih atau cari bank..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Nomor Rekening *</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  required
                  value={data.account_number}
                  onChange={(e) => setData('account_number', e.target.value.replace(/[^0-9]/g, ''))}
                  maxLength={24}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-900"
                  placeholder="0019283746101"
                />
                {errors.account_number && <p className="text-xs text-rose-600 font-bold">{errors.account_number}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Nama Pemilik Rekening *</label>
                <input
                  type="text"
                  required
                  value={data.account_name}
                  onChange={(e) => setData('account_name', e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-900"
                  placeholder="Sesuai buku tabungan"
                />
                {errors.account_name && <p className="text-xs text-rose-600 font-bold">{errors.account_name}</p>}
              </div>
            </div>
          </div>

          {/* DYNAMIC FORM BUILDER FIELDS (IF CONFIGURED BY ADMIN) */}
          {event.form_fields && event.form_fields.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 space-y-4 shadow-xs">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-sm font-black text-blue-900 flex items-center gap-2 uppercase tracking-wider">
                  <FileText className="w-4 h-4 text-amber-500" />
                  <span>4. Pertanyaan Tambahan Penyelenggara</span>
                </h2>
              </div>

              <div className="space-y-4">
                {event.form_fields.map((field) => (
                  <div key={field.id} className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      {field.field_label} {field.is_required && <span className="text-rose-500">*</span>}
                    </label>

                    {field.field_type === 'text' && (
                      <input
                        type="text"
                        required={field.is_required}
                        value={data.answers[field.id] || ''}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        placeholder={field.placeholder || ''}
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-900"
                      />
                    )}

                    {field.field_type === 'textarea' && (
                      <textarea
                        required={field.is_required}
                        value={data.answers[field.id] || ''}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        placeholder={field.placeholder || ''}
                        rows={3}
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-900"
                      />
                    )}

                    {field.field_type === 'select' && (
                      <select
                        required={field.is_required}
                        value={data.answers[field.id] || ''}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-900"
                      >
                        <option value="">-- Pilih Salah Satu --</option>
                        {Array.isArray(field.options) && field.options.map((opt, idx) => (
                          <option key={idx} value={opt}>{opt}</option>
                        ))}
                      </select>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SUBMIT BUTTON */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={processing}
              className="w-full py-4 px-6 bg-blue-900 hover:bg-blue-800 text-white font-extrabold text-xs rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
            >
              <Send className="w-4 h-4 text-amber-400" />
              <span>Simpan Formulir & Terbitkan Tiket Presensi QR</span>
            </button>
          </div>

        </form>

      </div>
    </AppLayout>
  );
}
