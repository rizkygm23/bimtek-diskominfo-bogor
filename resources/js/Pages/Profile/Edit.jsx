import React, { useState, useRef } from 'react';
import { usePage, useForm, router, Link } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import SearchableBankSelect from '../../Components/SearchableBankSelect';
import { 
  User, 
  Mail, 
  Building, 
  ShieldCheck, 
  Camera, 
  Save, 
  CheckCircle2, 
  FileText,
  Lock,
  AlertTriangle,
  XCircle,
  FileCheck
} from 'lucide-react';

function VerificationBanner({ status, notes, role }) {
  if (!status) return null;

  if (status === 'perlu_perbaikan') {
    return (
      <div className="p-4 sm:p-5 bg-amber-50 border-2 border-amber-300 rounded-2xl space-y-2">
        <div className="flex items-start gap-2.5">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="min-w-0 space-y-1.5">
            <h3 className="text-sm font-extrabold text-amber-950">
              Data administrasi perlu diperbaiki
            </h3>
            <p className="text-xs text-amber-900/90 leading-relaxed">
              Admin Diskominfo meminta Anda memperbaiki berkas / data di bawah ini.
              Setelah disimpan, status akan kembali ke antrian verifikasi.
            </p>
            {notes ? (
              <div className="mt-2 p-3 bg-white/80 border border-amber-200 rounded-xl">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-amber-700 mb-1">
                  Catatan dari Admin
                </span>
                <p className="text-xs font-semibold text-slate-800 whitespace-pre-wrap">{notes}</p>
              </div>
            ) : (
              <p className="text-xs text-amber-800 italic">
                Admin belum menulis detail catatan — periksa ulang foto KTP, NPWP, dan data rekening Anda.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (status === 'belum_diverifikasi') {
    return (
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-2.5">
        <XCircle className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-extrabold text-slate-800">Menunggu verifikasi admin</h3>
          <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
            Data {role === 'pembicara' ? 'narasumber' : 'peserta'} Anda sedang dalam antrean pemeriksaan.
            {notes ? (
              <span className="block mt-1.5 text-slate-700 font-medium">{notes}</span>
            ) : null}
          </p>
        </div>
      </div>
    );
  }

  if (status === 'terverifikasi') {
    return (
      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-2.5">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-extrabold text-emerald-900">Data terverifikasi</h3>
          <p className="text-xs text-emerald-800/90 mt-0.5">
            Identitas dan rekening Anda sudah disetujui admin. Ubah data hanya bila benar-benar perlu
            (perubahan berkas akan memicu review ulang).
          </p>
        </div>
      </div>
    );
  }

  return null;
}

export default function Edit({ user, participantProfile, speakerProfileDetail }) {
  const [avatarPreview, setAvatarPreview] = useState(user.avatar || null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const isSpeaker = user.role === 'pembicara';
  const isPeserta = user.role === 'user';
  const canEditAdminDocs = isSpeaker || isPeserta;

  const activeAdminProfile = isSpeaker ? speakerProfileDetail : participantProfile;
  const verificationStatus = activeAdminProfile?.verification_status || 'belum_diverifikasi';
  const verificationNotes = activeAdminProfile?.verification_notes || '';

  const profileForm = useForm({
    name: user.name || '',
    email: user.email || '',
    instansi: user.instansi || '',
    jabatan: user.jabatan || '',
    no_hp: user.no_hp || '',
    current_password: '',
    new_password: '',
    nik: activeAdminProfile?.nik || activeAdminProfile?.nip_nik || user.nip_nik || '',
    npwp: activeAdminProfile?.npwp || '',
    bank_name: activeAdminProfile?.bank_name || 'Bank BJB (Jawa Barat & Banten)',
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
    // POST (bukan PUT murni) karena FormData + file upload; route menerima POST & PUT
    profileForm.post('/profile', {
      forceFormData: true,
      onSuccess: () => {
        profileForm.reset('current_password', 'new_password', 'foto_ktp', 'foto_npwp');
      }
    });
  };

  const roleLabel = user.role === 'admin' 
    ? 'ADMINISTRATOR DISKOMINFO' 
    : isSpeaker
      ? 'PEMBICARA / NARASUMBER' 
      : 'PESERTA BIMTEK';

  const roleBadgeColor = user.role === 'admin'
    ? 'bg-amber-400 text-blue-950 border-amber-300'
    : isSpeaker
      ? 'bg-purple-600 text-white border-purple-400'
      : 'bg-emerald-600 text-white border-emerald-400';

  const statusBadge = () => {
    if (!canEditAdminDocs) return null;
    if (verificationStatus === 'terverifikasi') {
      return (
        <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-black rounded-full flex items-center gap-1">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Terverifikasi Admin</span>
        </span>
      );
    }
    if (verificationStatus === 'perlu_perbaikan') {
      return (
        <span className="px-3 py-1 bg-amber-100 text-amber-900 text-xs font-black rounded-full flex items-center gap-1">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <span>Perlu Perbaikan</span>
        </span>
      );
    }
    return (
      <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-black rounded-full flex items-center gap-1">
        <XCircle className="w-4 h-4 text-slate-400" />
        <span>Belum Diverifikasi</span>
      </span>
    );
  };

  return (
    <AppLayout title="Profil Saya & Data Administrasi">
      <div className="max-w-4xl mx-auto space-y-6 font-sans">
        
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

              <div className="flex flex-wrap items-center justify-center md:items-start md:justify-start gap-3 text-xs text-blue-200 font-medium">
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

        {canEditAdminDocs && (
          <VerificationBanner
            status={verificationStatus}
            notes={verificationNotes}
            role={user.role}
          />
        )}

        <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
          
          <div className="border-b border-slate-100 pb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-900" />
                <span>Profil & Data Administrasi Kedinasan</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Kelola data NIK, NPWP, dan rekening bank untuk pencairan honorarium & uang jalan.
              </p>
            </div>
            {statusBadge()}
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-6" encType="multipart/form-data">
            
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
                  {profileForm.errors.name && (
                    <p className="text-xs text-rose-600 font-bold">{profileForm.errors.name}</p>
                  )}
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
                  {profileForm.errors.email && (
                    <p className="text-xs text-rose-600 font-bold">{profileForm.errors.email}</p>
                  )}
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

            {canEditAdminDocs && (
              <>
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-xs font-black text-slate-900 uppercase tracking-wider">
                    <Lock className="w-4 h-4 text-emerald-600" />
                    <span>
                      2. Data Administrasi & Rekening
                      {isPeserta ? ' Peserta' : ' Narasumber'}
                    </span>
                  </div>

                  {isPeserta && (
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Data ini dipakai untuk verifikasi identitas dan pencairan uang jalan.
                      Anda juga bisa melengkapi saat daftar di{' '}
                      <Link href="/events" className="text-blue-900 font-bold underline">Katalog BIMTEK</Link>.
                    </p>
                  )}

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700">
                        {isSpeaker ? 'NIP / NIK Pakar' : 'NIK (KTP)'}
                      </label>
                      <input
                        type="text"
                        value={profileForm.data.nik}
                        onChange={(e) => profileForm.setData('nik', e.target.value)}
                        placeholder={isSpeaker ? 'NIP / NIK...' : '16 digit NIK...'}
                        className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-900 outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700">NPWP</label>
                      <input
                        type="text"
                        value={profileForm.data.npwp}
                        onChange={(e) => profileForm.setData('npwp', e.target.value)}
                        placeholder="Nomor NPWP..."
                        className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-900 outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700">Nama Bank</label>
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

                    <div className="space-y-1 md:col-span-2 sm:md:col-span-1">
                      <label className="block text-xs font-bold text-slate-700">Nama Pemilik Rekening</label>
                      <input
                        type="text"
                        value={profileForm.data.account_name}
                        onChange={(e) => profileForm.setData('account_name', e.target.value)}
                        placeholder="Sesuai Buku Tabungan..."
                        className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-900 outline-none"
                      />
                    </div>

                    {isSpeaker && (
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
                    )}

                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-900" />
                    <span>3. Unggah Dokumen Identitas</span>
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                      <label className="block text-xs font-bold text-slate-900">Foto/Scan KTP (PDF/JPG/PNG)</label>
                      {activeAdminProfile?.foto_ktp_path && (
                        <a
                          href={`/documents/stream?type=ktp&role=${isSpeaker ? 'pembicara' : 'peserta'}&id=${activeAdminProfile.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-900 underline"
                        >
                          <FileCheck className="w-3.5 h-3.5" />
                          Lihat berkas saat ini
                        </a>
                      )}
                      <input
                        type="file"
                        onChange={(e) => profileForm.setData('foto_ktp', e.target.files[0])}
                        className="w-full p-2 bg-white border border-slate-300 rounded-xl text-xs"
                        accept=".pdf,.jpg,.jpeg,.png"
                      />
                      {profileForm.errors.foto_ktp && (
                        <p className="text-xs text-rose-600 font-bold">{profileForm.errors.foto_ktp}</p>
                      )}
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                      <label className="block text-xs font-bold text-slate-900">Foto/Scan NPWP (PDF/JPG/PNG)</label>
                      {activeAdminProfile?.foto_npwp_path && (
                        <a
                          href={`/documents/stream?type=npwp&role=${isSpeaker ? 'pembicara' : 'peserta'}&id=${activeAdminProfile.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-900 underline"
                        >
                          <FileCheck className="w-3.5 h-3.5" />
                          Lihat berkas saat ini
                        </a>
                      )}
                      <input
                        type="file"
                        onChange={(e) => profileForm.setData('foto_npwp', e.target.files[0])}
                        className="w-full p-2 bg-white border border-slate-300 rounded-xl text-xs"
                        accept=".pdf,.jpg,.jpeg,.png"
                      />
                      {profileForm.errors.foto_npwp && (
                        <p className="text-xs text-rose-600 font-bold">{profileForm.errors.foto_npwp}</p>
                      )}
                    </div>

                  </div>
                </div>
              </>
            )}

            {Object.keys(profileForm.errors).length > 0 && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-semibold">
                Ada field yang belum valid. Periksa kembali isian formulir.
              </div>
            )}

            <div className="flex items-center justify-end pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={profileForm.processing}
                className="px-6 py-3 bg-blue-900 hover:bg-blue-800 text-white font-black text-xs rounded-xl shadow-lg flex items-center gap-2 cursor-pointer transition-transform active:scale-95 disabled:opacity-50"
              >
                <Save className="w-4 h-4 text-amber-400" />
                <span>
                  {profileForm.processing
                    ? 'Menyimpan...'
                    : verificationStatus === 'perlu_perbaikan'
                      ? 'Simpan Perbaikan & Ajukan Ulang'
                      : 'Simpan Seluruh Data Profil & Administrasi'}
                </span>
              </button>
            </div>

          </form>

        </div>

      </div>
    </AppLayout>
  );
}
