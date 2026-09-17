import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { 
  Award, 
  Download, 
  Eye, 
  FileText, 
  Calendar, 
  X, 
  Search,
  FileCheck,
  Image as ImageIcon,
  ShieldCheck,
  AlertCircle,
  User,
  Mic,
} from 'lucide-react';

export default function MyCertificates({ certificates = [], currentUser = {}, userRole = 'peserta' }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCert, setActiveCert] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const isPeserta = userRole === 'peserta';
  const isPembicara = userRole === 'pembicara';
  const isAdmin = userRole === 'admin';

  // Open Preview Modal
  const handleOpenPreview = (cert) => {
    setActiveCert(cert);
    setIsPreviewOpen(true);
  };

  // Close Preview Modal
  const handleClosePreview = () => {
    setIsPreviewOpen(false);
    setActiveCert(null);
  };

  // Helper to check if file is PDF
  const isPdfFile = (filePath = '') => {
    return (filePath || '').toLowerCase().endsWith('.pdf');
  };

  // Filter by role: peserta only sees peserta certs, pembicara only sees pembicara certs, admin sees all
  const roleCertificates = isAdmin
    ? certificates
    : certificates.filter(c => {
        if (isPeserta) return c.role_type === 'peserta' || !c.role_type;
        if (isPembicara) return c.role_type === 'pembicara';
        return true;
      });

  // Apply search filter
  const filteredCertificates = roleCertificates.filter((cert) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (cert.certificate_number || '').toLowerCase().includes(q) ||
      (cert.event?.title || '').toLowerCase().includes(q) ||
      (cert.event?.location || '').toLowerCase().includes(q)
    );
  });

  // Theme colors based on role
  const theme = isPembicara
    ? {
        accentBg: 'bg-purple-900',
        accentHover: 'hover:bg-purple-950',
        headerBg: 'bg-purple-50/50',
        headerText: 'text-purple-950',
        headerIcon: 'text-purple-900',
        badgeBase: 'bg-purple-100 text-purple-800 border-purple-200',
        searchBorder: 'border-purple-200 focus:border-purple-900 focus:ring-purple-900/20',
        rowHover: 'hover:bg-purple-50/40',
        divider: 'divide-purple-100',
        downloadBg: 'bg-purple-900 hover:bg-purple-950',
        downloadIcon: 'text-amber-300',
        roleLabel: 'Narasumber / Pembicara',
        roleIcon: <Mic className="w-4 h-4" />,
        emptyIcon: <Mic className="w-8 h-8" />,
        emptyBg: 'bg-purple-50 border-purple-200 text-purple-600',
      }
    : {
        accentBg: 'bg-blue-900',
        accentHover: 'hover:bg-blue-950',
        headerBg: 'bg-slate-50/50',
        headerText: 'text-slate-900',
        headerIcon: 'text-blue-900',
        badgeBase: 'bg-blue-100 text-blue-800 border-blue-200',
        searchBorder: 'border-slate-300 focus:border-blue-900 focus:ring-blue-900/20',
        rowHover: 'hover:bg-slate-50/80',
        divider: 'divide-slate-100',
        downloadBg: 'bg-blue-900 hover:bg-blue-950',
        downloadIcon: 'text-amber-400',
        roleLabel: 'Peserta BIMTEK',
        roleIcon: <User className="w-4 h-4" />,
        emptyIcon: <AlertCircle className="w-8 h-8" />,
        emptyBg: 'bg-amber-50 border-amber-200 text-amber-600',
      };

  return (
    <AppLayout title="Sertifikat Saya">
      <Head title="Sertifikat Saya - SIM-BIMTEK Diskominfo" />

      <div className="space-y-6 font-sans pb-16">
        
        {/* HEADER HERO BANNER */}
        {/* TODO: flatten hero — see PageHeader.jsx */}
        <div className="relative overflow-hidden rounded-3xl bg-blue-950 bg-gradient-to-r from-blue-950 via-blue-900 to-slate-900 text-white p-6 md:p-8 shadow-xl border border-blue-800/50">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-amber-400/20 via-transparent to-transparent pointer-events-none"></div>
          
          <div className="relative space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-900/80 backdrop-blur-md border border-blue-700/50 text-amber-300 text-xs font-black uppercase tracking-wider shadow-xs">
              <Award className="w-4 h-4 text-amber-400" />
              <span>
                {isPembicara 
                  ? 'Repository Piagam Narasumber' 
                  : 'Portofolio Kelulusan & Repository Piagam'}
              </span>
            </div>
            
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white drop-shadow-xs">
              {isPembicara ? 'Sertifikat Narasumber Saya' : 'Sertifikat Peserta Saya'}
            </h1>
            
            <p className="text-blue-100 text-xs max-w-xl font-medium leading-snug line-clamp-2">
              {isPembicara
                ? 'Sertifikat narasumber yang diunggah admin — unduh atau buka file.'
                : 'Sertifikat peserta yang diunggah admin — unduh atau buka file.'}
            </p>
          </div>
        </div>

        {/* CERTIFICATE TABLE */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          
          {/* TOOLBAR SEARCH */}
          <div className={`p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 ${theme.headerBg}`}>
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-xl ${theme.accentBg} text-white flex items-center justify-center`}>
                {theme.roleIcon}
              </div>
              <div>
                <h2 className={`text-xs font-black ${theme.headerText} uppercase tracking-wider`}>
                  Sertifikat {theme.roleLabel} ({filteredCertificates.length})
                </h2>
                <p className="text-[10px] text-slate-400 font-bold">Format: File Resmi Diunggah Admin (PNG / PDF)</p>
              </div>
            </div>

            {/* SEARCH INPUT */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Cari Sertifikat ${theme.roleLabel} (No. Sertifikat / Judul BIMTEK)...`}
                className={`w-full sm:w-80 pl-9 pr-4 py-2 bg-white border rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 shadow-xs ${theme.searchBorder}`}
              />
            </div>
          </div>

          {filteredCertificates.length === 0 ? (
            <div className="text-center py-16 px-6 bg-slate-50/50 space-y-4">
              <div className={`w-16 h-16 rounded-3xl border flex items-center justify-center mx-auto shadow-xs ${theme.emptyBg}`}>
                {theme.emptyIcon}
              </div>
              
              <div className="max-w-md mx-auto space-y-1.5">
                <h3 className="text-sm font-extrabold text-slate-900">
                  Belum Ada Sertifikat {theme.roleLabel}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {searchQuery 
                    ? `Tidak ada sertifikat ${theme.roleLabel.toLowerCase()} yang cocok dengan kata kunci "${searchQuery}".`
                    : `File sertifikat ${theme.roleLabel.toLowerCase()} belum diunggah oleh administrator. Sertifikat akan otomatis muncul di sini setelah administrator melakukan unggah file di repository kegiatan.`}
                </p>
              </div>

              <div className="pt-2">
                <Link
                  href="/events"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  <Calendar className="w-4 h-4 text-amber-400" />
                  <span>Lihat Riwayat & Agenda BIMTEK</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 border-collapse">
                <thead className={`border-b border-slate-200 font-black uppercase text-[10px] tracking-wider ${theme.headerBg} ${theme.headerText}`}>
                  <tr>
                    <th className="p-4 w-12 text-center">No</th>
                    <th className="p-4">No. Sertifikat</th>
                    <th className="p-4">Kegiatan BIMTEK</th>
                    <th className="p-4">Format File</th>
                    <th className="p-4">Tanggal Terbit</th>
                    <th className="p-4 text-center">Aksi Buka & Unduh File</th>
                  </tr>
                </thead>
                <tbody className={theme.divider}>
                  {filteredCertificates.map((cert, idx) => {
                    const isPdf = isPdfFile(cert.file_path);
                    const fileUrl = cert.file_url || `/storage/${cert.file_path}`;

                    return (
                      <tr key={cert.id || idx} className={`${theme.rowHover} transition-colors`}>
                        <td className="p-4 text-center text-slate-500 font-bold">{idx + 1}</td>
                        <td className={`p-4 font-mono font-bold ${isPembicara ? 'text-purple-950' : 'text-blue-950'}`}>
                          {cert.certificate_number}
                        </td>
                        <td className="p-4">
                          <span className="font-bold text-slate-900 block">{cert.event?.title || 'BIMTEK Diskominfo'}</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">{cert.event?.location || 'Diskominfo Kab. Bogor'}</span>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                            isPdf
                              ? 'bg-red-100 text-red-800 border border-red-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}>
                            {isPdf ? <FileCheck className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
                            <span>{isPdf ? 'DOKUMEN PDF' : 'GAMBAR PNG/JPG'}</span>
                          </span>
                        </td>
                        <td className="p-4 font-medium text-slate-600">
                          {cert.issue_date ? new Date(cert.issue_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            
                            <button
                              onClick={() => handleOpenPreview(cert)}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold rounded-xl text-xs border border-slate-300 transition-transform active:scale-95 cursor-pointer"
                              title="Buka Dokumen Sertifikat"
                            >
                              <Eye className={`w-3.5 h-3.5 ${isPembicara ? 'text-purple-900' : 'text-blue-900'}`} />
                              <span>Lihat</span>
                            </button>

                            <a
                              href={fileUrl}
                              download
                              target="_blank"
                              rel="noreferrer"
                              className={`inline-flex items-center gap-1.5 px-4 py-2 ${theme.downloadBg} text-white font-extrabold rounded-xl text-xs shadow-xs transition-transform active:scale-95 cursor-pointer`}
                              title="Unduh File Sertifikat Asli dari Admin"
                            >
                              <Download className={`w-3.5 h-3.5 ${theme.downloadIcon}`} />
                              <span>Unduh File</span>
                            </a>

                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

        </div>

      </div>

      {/* ========================================================================= */}
      {/* MODAL FULLSCREEN PREVIEW OF THE EXACT UPLOADED FILE (PNG/JPG/PDF)          */}
      {/* ========================================================================= */}
      {isPreviewOpen && activeCert && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          
          <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            
            {/* MODAL HEADER */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-sm font-black text-white leading-tight">File Sertifikat Resmi dari Admin</h3>
                  <p className="text-[11px] text-slate-400">Nomor Registrasi: {activeCert.certificate_number}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={activeCert.file_url || `/storage/${activeCert.file_path}`}
                  download
                  target="_blank"
                  rel="noreferrer"
                  className={`px-4 py-2 ${theme.downloadBg} text-white text-xs font-extrabold rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer`}
                >
                  <Download className={`w-3.5 h-3.5 ${theme.downloadIcon}`} />
                  <span>Unduh File</span>
                </a>

                <button
                  onClick={handleClosePreview}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* MODAL BODY */}
            <div className="p-4 sm:p-6 bg-slate-100 overflow-y-auto flex items-center justify-center min-h-[60vh]">
              {isPdfFile(activeCert.file_path) ? (
                <iframe 
                  src={activeCert.file_url || `/storage/${activeCert.file_path}`}
                  className="w-full h-[75vh] rounded-2xl border border-slate-300 shadow-md"
                  title="PDF Certificate Preview"
                />
              ) : (
                <div className="max-w-full max-h-[75vh] overflow-auto flex items-center justify-center p-2">
                  <img 
                    src={activeCert.file_url || `/storage/${activeCert.file_path}`} 
                    alt={`Sertifikat ${activeCert.certificate_number}`}
                    className="max-w-full max-h-[72vh] object-contain rounded-2xl shadow-xl border border-slate-300 bg-white"
                  />
                </div>
              )}
            </div>

          </div>

        </div>
      )}

    </AppLayout>
  );
}
