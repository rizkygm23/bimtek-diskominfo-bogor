import React, { useState, useRef } from 'react';
import { usePage, useForm, router } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import SearchableBankSelect from '../../Components/SearchableBankSelect';
import { 
  User, 
  Mail, 
  Building, 
  Briefcase, 
  Phone, 
  ShieldCheck, 
  Camera, 
  KeyRound, 
  Save, 
  CheckCircle2, 
  CreditCard,
  FileText,
  Upload,
  Lock
} from 'lucide-react';

export default function Edit({ user, participantProfile, speakerProfileDetail, stats }) {
  const [avatarPreview, setAvatarPreview] = useState(user.avatar || null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const activeAdminProfile = user.role === 'pembicara' ? speakerProfileDetail : participantProfile;

  // Form profile info
  const profileForm = useForm({
    name: user.name || '',
    email: user.email || '',
    instansi: user.instansi || '',
    jabatan: user.jabatan || '',
    no_hp: user.no_hp || '',
    current_password: '',
    new_password: '',

    // Sensitive Admin Data
    nik: activeAdminProfile?.nik || activeAdminProfile?.nip_nik || user.nip_nik || '',
    npwp: activeAdminProfile?.npwp || '',
    bank_name: activeAdminProfile?.bank_name || 'Bank Jabar Banten (BJB)',
    account_number: activeAdminProfile?.account_number || '',
    account_name: activeAdminProfile?.account_name || user.name || '',
    golongan: activeAdminProfile?.golongan || 'Golongan III',
    foto_ktp: null,
    foto_npwp: null,
  });

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setAvatarPreview(event.target.result);
    };
    reader.readAsDataURL(file);

    const formData = new FormData();
    formData.append('avatar', file);

    setIsUploading(true);
    router.post('/profile/avatar', formData, {
      forceFormData: true,
      onSuccess: () => setIsUploading(false),
      onError: () => {
        setIsUploading(false);
        alert('Gagal mengunggah foto profil.');
      }
    });
  };

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    profileForm.post('/profile', {
      forceFormData: true,
      onSuccess: () => {
        profileForm.reset('current_password', 'new_password');
      }
    });
  };

  const roleLabel = user.role === 'admin' 
    ? 'ADMINISTRATOR DISKOMINFO' 
    : user.role === 'pembicara' 
      ? 'PEMBICARA / NARASUMBER' 
      : 'PESERTA BIMTEK';

  const roleBadgeColor = user.role === 'admin'
    ? 'bg-amber-400 text-blue-950 border-amber-300'
    : user.role === 'pembicara'
      ? 'bg-purple-600 text-white border-purple-400'
      : 'bg-emerald-600 text-white border-emerald-400';

  return (
    <AppLayout title="Profil Saya & Data Administrasi">
      <div className="max-w-4xl mx-auto space-y-6 font-sans">
        
        {/* PROFILE HEADER HERO CARD WITH AVATAR UPLOAD */}
        {/* TODO: flatten hero — see PageHeader.jsx */}
        <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-slate-900 text-white border-2 border-blue-800 rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 relative z-10">
            
            <div className="relative group shrink-0">
              <div className="w-28 h-28 md:w-32 md:h-32 rounded-3xl overflow-hidden border-4 border-amber-400 bg-slate-800 shadow-2xl flex items-center justify-center text-4xl font-black text-amber-300">
                {avatarPreview ? (
                  <img src={avatarPreview} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <span>{user.name.charAt(0).toUpperCase()}</span>
                )}
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute inset-x-2 bottom-2 bg-slate-950/70 rounded-xl py-1.5 flex flex-col items-center justify-center gap-0.5 text-amber-400 font-extrabold text-[10px] cursor-pointer shadow-lg opacity-100 md:opacity-0 md:inset-0 md:rounded-3xl md:py-0 md:text-xs md:bg-slate-950/60 md:flex-col md:group-hover:opacity-100 transition-opacity"
              >
                <Camera className="w-5 h-5 md:w-6 md:h-6 md:animate-bounce" />
                <span>{isUploading ? 'Mengunggah...' : 'Ubah Foto'}</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>

            <div className="text-center md:text-left space-y-2 flex-1">
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase border shadow-sm ${roleBadgeColor}`}>
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{roleLabel}</span>
              </div>

              <h1 className="text-2xl md:text-3xl font-black text-white leading-tight">
                {user.name}
              </h1>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-xs text-blue-200 font-medium">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-amber-400" /> {user.email}
                </span>
                <span>&bull;</span>
                <span className="flex items-center gap-1">
                  <Building className="w-3.5 h-3.5 text-emerald-400" /> {user.instansi || 'Diskominfo Kabupaten Bogor'}
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* PROFILE FORM CARD */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
          
          <div className="border-b border-slate-100 pb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-900" />
                <span>Profil & Data Administrasi Kedinasan</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Kelola data NIK, NPWP, dan rekening bank untuk pencairan honorarium & uang jalan. Data sensitif terlindungi secara otomatis.
              </p>
            </div>
            {activeAdminProfile?.verification_status === 'terverifikasi' && (
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-black rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Terverifikasi Admin</span>
              </span>
            )}
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-6">
            
            {/* DATA IDENTITAS DASAR */}
            <div className="space-y-3">
              <h3 className="text-xs font-black text-blue-900 uppercase tracking-wider">1. Data Identitas Utama</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Nama Lengkap & Gelar *</label>
                  <input
                    type="text"
                    required
                    value={profileForm.data.name}
                    onChange={(e) => profileForm.setData('name', e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-900 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Email *</label>
                  <input
                    type="email"
                    required
                    value={profileForm.data.email}
                    onChange={(e) => profileForm.setData('email', e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-900 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Instansi / Unit Kerja</label>
                  <input
                    type="text"
                    value={profileForm.data.instansi}
                    onChange={(e) => profileForm.setData('instansi', e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-900 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Nomor WhatsApp / HP</label>
                  <input
                    type="text"
                    value={profileForm.data.no_hp}
                    onChange={(e) => profileForm.setData('no_hp', e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-900 outline-none"
                  />
                </div>

              </div>
            </div>

            {/* UNTUK PESERTA: TAMPILKAN PEMBERITAHUAN ALUR PENDAFTARAN */}
            {user.role === 'user' && (
              <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl space-y-2 text-slate-800">
                <div className="flex items-center gap-2 text-xs font-black text-blue-900 uppercase tracking-wider">
                  <FileText className="w-4 h-4 text-blue-700" />
                  <span>Pengisian Data Administrasi & Rekening Pencairan</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Data administrasi (<strong>NIK KTP, NPWP, Nama Bank, Nomor Rekening, dan Nama Pemilik Rekening</strong>) diisi langsung pada <strong>Formulir Registrasi Kegiatan BIMTEK</strong> saat Anda memilih kegiatan di menu <a href="/events" className="text-blue-900 font-bold underline">Katalog BIMTEK</a> sebelum melakukan presensi Hari-H.
                </p>
              </div>
            )}

            {/* UNTUK PEMBICARA / ADMIN: DATA ADMINISTRASI & REKENING (SENSITIVE) */}
            {user.role !== 'user' && (
              <>
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-xs font-black text-slate-900 uppercase tracking-wider">
                    <Lock className="w-4 h-4 text-emerald-600" />
                    <span>2. Data Administrasi & Rekening Narasumber (Private & Encrypted)</span>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700">NIP / NIK Pakar</label>
                      <input
                        type="text"
                        value={profileForm.data.nik}
                        onChange={(e) => profileForm.setData('nik', e.target.value)}
                        placeholder="NIP / NIK..."
                        className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-900 outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700">NPWP (Nomor Pokok Wajib Pajak)</label>
                      <input
                        type="text"
                        value={profileForm.data.npwp}
                        onChange={(e) => profileForm.setData('npwp', e.target.value)}
                        placeholder="15 Digit NPWP..."
                        className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-900 outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700">Nama Bank Penerima Honor / Transport</label>
                      <SearchableBankSelect
                        value={profileForm.data.bank_name}
                        onChange={(val) => profileForm.setData('bank_name', val)}
                        error={profileForm.errors.bank_name}
                        placeholder="Pilih atau cari bank..."
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700">Nomor Rekening Bank</label>
                      <input
                        type="text"
                        value={profileForm.data.account_number}
                        onChange={(e) => profileForm.setData('account_number', e.target.value)}
                        placeholder="Nomor Rekening Aktif..."
                        className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-900 outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700">Nama Pemilik Rekening</label>
                      <input
                        type="text"
                        value={profileForm.data.account_name}
                        onChange={(e) => profileForm.setData('account_name', e.target.value)}
                        placeholder="Sesuai Buku Tabungan..."
                        className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-900 outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700">Golongan / Pangkat ASN (Tarif PPh 21)</label>
                      <select
                        value={profileForm.data.golongan}
                        onChange={(e) => profileForm.setData('golongan', e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-900 outline-none"
                      >
                        <option value="Golongan III">Golongan III (Tarif Pajak 5%)</option>
                        <option value="Golongan IV">Golongan IV (Tarif Pajak 15%)</option>
                        <option value="Non-ASN">Non-ASN / Swasta (Tarif Pajak 2.5%)</option>
                      </select>
                    </div>

                  </div>
                </div>

                {/* UPLOAD BERKAS SENSITIF */}
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">3. Unggah Dokumen Narasumber</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                      <label className="block text-xs font-bold text-slate-900">Upload Foto/Scan KTP (PDF/JPG/PNG):</label>
                      <input
                        type="file"
                        onChange={(e) => profileForm.setData('foto_ktp', e.target.files[0])}
                        className="w-full p-2 bg-white border border-slate-300 rounded-xl text-xs"
                        accept=".pdf,.jpg,.jpeg,.png"
                      />
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                      <label className="block text-xs font-bold text-slate-900">Upload Foto/Scan NPWP (PDF/JPG/PNG):</label>
                      <input
                        type="file"
                        onChange={(e) => profileForm.setData('foto_npwp', e.target.files[0])}
                        className="w-full p-2 bg-white border border-slate-300 rounded-xl text-xs"
                        accept=".pdf,.jpg,.jpeg,.png"
                      />
                    </div>

                  </div>
                </div>
              </>
            )}

            {/* SUBMIT BUTTON */}
            <div className="flex items-center justify-end pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={profileForm.processing}
                className="px-6 py-3 bg-blue-900 hover:bg-blue-800 text-white font-black text-xs rounded-xl shadow-lg flex items-center gap-2 cursor-pointer transition-transform active:scale-95 disabled:opacity-50"
              >
                <Save className="w-4 h-4 text-amber-400" />
                <span>Simpan Seluruh Data Profil & Administrasi</span>
              </button>
            </div>

          </form>

        </div>

      </div>
    </AppLayout>
  );
}
