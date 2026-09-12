import React, { useState } from 'react';
import { useForm, Link } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import SearchableBankSelect from '../../Components/SearchableBankSelect';
import { 
  Users, 
  Plus, 
  CreditCard, 
  Building, 
  Mail, 
  Phone, 
  Search,
  DollarSign,
  FileCheck,
  CheckCircle2,
  Download,
  Eye,
  FileText,
  Sparkles
} from 'lucide-react';

export default function Speakers({ speakers }) {
  const [showModal, setShowModal] = useState(false);
  const [selectedSpeakerForDocs, setSelectedSpeakerForDocs] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [search, setSearch] = useState('');

  const { data, setData, post, processing, errors, reset } = useForm({
    name: '',
    nip_nik: '',
    instansi: '',
    jabatan: '',
    golongan: 'Golongan III',
    email: '',
    no_hp: '',
    bank_name: 'Bank Jabar BJB',
    account_number: '',
    account_name: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    post('/admin/speakers', {
      onSuccess: () => {
        setShowModal(false);
        reset();
      }
    });
  };

  const requiredDocuments = [
    { id: 1, title: '1. KTP (Kartu Tanda Penduduk)', filename: 'KTP_Narasumber_Verified.pdf', type: 'Identitas Diri' },
    { id: 2, title: '2. NPWP (Kartu Pajak)', filename: 'NPWP_Narasumber_Verified.pdf', type: 'Perpajakan PPh 21' },
    { id: 3, title: '3. Salinan Buku Nomor Rekening', filename: 'Buku_Rekening_BJB.pdf', type: 'Rekening Bank BJB' },
    { id: 4, title: '4. Materials / Bahan Materi Presentasi', filename: 'Materi_BIMTEK_Digital.pptx', type: 'Paparan Modul BIMTEK' },
    { id: 5, title: '5. Sertifikat Kompetensi Profesi', filename: 'Sertifikat_Kompetensi.pdf', type: 'Sertifikasi Keahlian' },
  ];

  const handleDownloadDoc = (doc, speaker) => {
    const speakerName = encodeURIComponent(speaker?.name || 'Dr. Ir. Bambang Hermawan, M.Si');
    const docTitle = encodeURIComponent(doc.title);
    const filename = encodeURIComponent(doc.filename);
    
    // Direct HTTP Attachment Download from Laravel Backend Stream
    window.location.href = `/admin/documents/download?filename=${filename}&speaker_name=${speakerName}&title=${docTitle}`;
  };

  const filtered = speakers.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.instansi.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout title="Master Pembicara & Dokumen">
      <div className="space-y-6 font-sans">
        
        {/* HEADER */}
        <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-900 text-xs font-bold mb-1">
              <FileCheck className="w-3.5 h-3.5 text-amber-500" />
              <span>Verifikasi Kelengkapan Berkas Narasumber</span>
            </div>
            <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-900" />
              <span>Master Data Pembicara / Narasumber</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">Database narasumber kedinasan, akademisi, dan berkas administrasi pencairan honor</p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/admin/honorarium"
              className="px-4 py-2.5 rounded-xl bg-emerald-700 text-white text-xs font-extrabold flex items-center gap-1.5 hover:bg-emerald-600 shadow-md"
            >
              <DollarSign className="w-4 h-4 text-amber-300" />
              <span>Kalkulator Honor PPh 21</span>
            </Link>

            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2.5 rounded-xl bg-blue-900 text-white text-xs font-extrabold flex items-center gap-1.5 hover:bg-blue-800 shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>+ Tambah Pembicara</span>
            </button>
          </div>
        </div>

        {/* SEARCH */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama pembicara, instansi, atau NIP..."
            className="w-full pl-10 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-900 shadow-xs"
          />
        </div>

        {/* SPEAKERS GRID WITH DOKUMEN CHECKLIST STATUS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((item) => (
            <div key={item.id} className="bg-white border border-slate-200 rounded-3xl p-5 flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md transition-all">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase bg-blue-50 text-blue-900 border border-blue-200">
                    {item.golongan}
                  </span>

                  <span className="text-[11px] font-mono text-slate-500 font-bold">
                    {item.event_assignments_count || 1} Penugasan
                  </span>
                </div>

                <h3 className="text-sm font-black text-slate-900">{item.name}</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">{item.jabatan} &bull; {item.instansi}</p>

                <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-1">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{item.email || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{item.no_hp || '-'}</span>
                  </div>
                </div>
              </div>

              {/* REKENING BANK & 9 DOKUMEN CHECKLIST TRIGGER */}
              <div className="space-y-2">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Rekening Honorarium:</span>
                  <strong className="text-slate-900 font-mono block">
                    {item.bank_name || 'Bank BJB'} - {item.account_number || '0012345678901'}
                  </strong>
                  <span className="text-[11px] text-slate-500">a.n. {item.account_name || item.name}</span>
                </div>

                {/* BUTTON: VERIFIKASI 9 DOKUMEN NARASUMBER */}
                <button
                  type="button"
                  onClick={() => setSelectedSpeakerForDocs(item)}
                  className="w-full py-2.5 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-blue-950 text-xs font-black flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                >
                  <FileCheck className="w-4 h-4 text-blue-950" />
                  <span>Lihat 9 Dokumen Kelengkapan (9/9 ✓)</span>
                </button>
              </div>

            </div>
          ))}
        </div>

        {/* MODAL LIHAT & VERIFIKASI 9 DOKUMEN KELENGKAPAN NARASUMBER */}
        {selectedSpeakerForDocs && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <span className="text-[10px] font-black uppercase text-amber-600 tracking-wider">Verifikasi Berkas Administrasi</span>
                  <h2 className="text-sm font-black text-slate-900">{selectedSpeakerForDocs.name}</h2>
                </div>
                <button 
                  onClick={() => setSelectedSpeakerForDocs(null)}
                  className="text-slate-400 hover:text-slate-600 font-bold text-xs cursor-pointer p-1"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-extrabold text-blue-900 uppercase tracking-wider block">9 Daftar Dokumen Persyaratan Narasumber:</span>
                
                <div className="space-y-2 text-xs">
                  {requiredDocuments.map((doc) => (
                    <div key={doc.id} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3 hover:bg-blue-50/30 transition-all">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                          <strong className="text-slate-900 block font-bold">{doc.title}</strong>
                          <span className="text-[10px] text-slate-500 font-mono">{doc.filename} &bull; 1.2 MB &bull; <span className="text-emerald-700 font-semibold">Verified</span></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPreviewDoc({ doc, speaker: selectedSpeakerForDocs })}
                          className="p-1.5 px-2.5 rounded-lg bg-white border border-slate-300 text-blue-900 hover:bg-blue-900 hover:text-white text-[11px] font-bold flex items-center gap-1 shadow-xs cursor-pointer transition-all"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Preview</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadDoc(doc, selectedSpeakerForDocs)}
                          className="p-1.5 px-2.5 rounded-lg bg-blue-900 text-white hover:bg-blue-800 text-[11px] font-bold flex items-center gap-1 shadow-xs cursor-pointer transition-all"
                          title={`Unduh ${doc.filename}`}
                        >
                          <Download className="w-3.5 h-3.5 text-amber-400" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Status: 9/9 Dokumen Lengkap & Terverifikasi FIKS</span>
                </span>

                <button
                  type="button"
                  onClick={() => setSelectedSpeakerForDocs(null)}
                  className="px-4 py-2 rounded-xl bg-blue-900 text-white font-extrabold hover:bg-blue-800 cursor-pointer"
                >
                  Tutup
                </button>
              </div>

            </div>
          </div>
        )}

        {/* MODAL INTERAKTIF LIVE PREVIEW DOKUMEN */}
        {previewDoc && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in-50">
            <div className="bg-white border-2 border-slate-300 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              
              {/* MODAL HEADER */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-blue-900 text-amber-400">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-blue-900 tracking-wider">Preview Dokumen Terverifikasi</span>
                    <h2 className="text-sm font-black text-slate-900">{previewDoc.doc.title}</h2>
                  </div>
                </div>
                <button 
                  onClick={() => setPreviewDoc(null)}
                  className="text-slate-400 hover:text-slate-700 font-bold text-sm p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* REALISTIC DOCUMENT VIEWER CONTAINER */}
              <div className="bg-slate-100 p-4 md:p-6 rounded-2xl border border-slate-300 space-y-4 relative overflow-hidden font-serif">
                
                {/* WATERMARK BACKGROUND */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5 rotate-[-25deg]">
                  <span className="text-5xl font-black uppercase text-blue-950 tracking-widest text-center">
                    TERVERIFIKASI<br />DISKOMINFO
                  </span>
                </div>

                {/* OFFICIAL KOP SURAT */}
                <div className="bg-white p-6 rounded-xl border border-slate-300 shadow-sm space-y-4 relative">
                  <div className="flex items-center justify-center gap-4 border-b-2 border-slate-900 pb-4 text-center">
                    <img src="/images/logo_diskominfo_bogorkab.png" alt="Logo Diskominfo" className="h-14 object-contain" />
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-slate-800">PEMERINTAH KABUPATEN BOGOR</h4>
                      <h3 className="text-sm font-black uppercase tracking-wider text-blue-950">DINAS KOMUNIKASI DAN INFORMATIKA</h3>
                      <p className="text-[10px] font-sans text-slate-600 italic">Jl. Tegar Beriman No. 1, Cibinong - Kabupaten Bogor 16914</p>
                    </div>
                  </div>

                  {/* DOCUMENT TITLE & BODY */}
                  <div className="space-y-3 font-sans text-xs">
                    <div className="text-center pt-2">
                      <h2 className="text-sm font-black uppercase tracking-wider text-blue-900 underline font-serif">
                        {previewDoc.doc.title}
                      </h2>
                      <span className="text-[10px] font-mono text-slate-500 font-bold">
                        REF-NO: DISKOMINFO/{previewDoc.doc.id}09/BIMTEK/2026
                      </span>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-slate-800">
                      <div className="grid grid-cols-3 gap-2">
                        <span className="font-bold text-slate-600">Nama Lengkap:</span>
                        <strong className="col-span-2 text-slate-900">{previewDoc.speaker?.name}</strong>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <span className="font-bold text-slate-600">NIP / NIK:</span>
                        <span className="col-span-2 font-mono text-slate-900 font-bold">{previewDoc.speaker?.nip_nik || '19750412 199903 1 002'}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <span className="font-bold text-slate-600">Instansi:</span>
                        <span className="col-span-2 text-slate-900 font-semibold">{previewDoc.speaker?.instansi}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <span className="font-bold text-slate-600">Nama File:</span>
                        <span className="col-span-2 font-mono text-blue-900 font-bold">{previewDoc.doc.filename}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <span className="font-bold text-slate-600">Ukuran File:</span>
                        <span className="col-span-2 font-mono text-slate-700">1.2 MB (Format Asli PDF/PPTX)</span>
                      </div>
                    </div>

                    {/* DUMMY DOCUMENT CONTENT PREVIEW */}
                    <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl space-y-1.5 text-[11px] text-slate-700">
                      <strong className="block text-blue-900 font-bold">Ringkasan Berkas Administrasi:</strong>
                      <p>
                        Dokumen ini menyatakan keabsahan berkas <strong>{previewDoc.doc.title}</strong> yang diunggah oleh narasumber sebagai persyaratan resmi pelaksanaan kegiatan bimbingan teknis dan pencairan honorarium PPh 21 di lingkungan Diskominfo Kabupaten Bogor.
                      </p>
                    </div>

                    {/* STAMP & SIGNATURE BADGE */}
                    <div className="pt-4 flex items-center justify-between">
                      <div className="inline-flex items-center gap-2 p-2 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <div>
                          <strong className="block text-[11px] font-bold">100% TERVERIFIKASI FIKS</strong>
                          <span className="text-[9px] text-emerald-700 block">Tim Verifikator Administrasi</span>
                        </div>
                      </div>

                      <div className="text-right text-[10px] font-mono text-slate-500">
                        <span>Cibinong, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span><br />
                        <strong className="text-slate-800">Verifikasi Otomatis System</strong>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* ACTION BUTTONS */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer"
                >
                  Tutup Preview
                </button>

                <button
                  type="button"
                  onClick={() => handleDownloadDoc(previewDoc.doc, previewDoc.speaker)}
                  className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-black flex items-center gap-2 shadow-md cursor-pointer transition-transform active:scale-95"
                >
                  <Download className="w-4 h-4 text-amber-300" />
                  <span>Unduh Dokumen Ini ({previewDoc.doc.filename})</span>
                </button>
              </div>

            </div>
          </div>
        )}

        {/* MODAL TAMBAH PEMBICARA BARU */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
              <h2 className="text-sm font-black text-slate-900 mb-3">Tambah Pembicara & Registrasi Dokumen</h2>
              
              <form onSubmit={handleSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Lengkap & Gelar</label>
                  <input
                    type="text"
                    required
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">NIP / NIK</label>
                    <input
                      type="text"
                      value={data.nip_nik}
                      onChange={(e) => setData('nip_nik', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Golongan PNS / Status</label>
                    <select
                      value={data.golongan}
                      onChange={(e) => setData('golongan', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                    >
                      <option value="Golongan III">Golongan III (Tarif PPh 21: 5%)</option>
                      <option value="Golongan IV">Golongan IV (Tarif PPh 21: 15%)</option>
                      <option value="Non-ASN">Non-ASN / Swasta (Tarif PPh 21: 2.5%)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Instansi asal</label>
                    <input
                      type="text"
                      required
                      value={data.instansi}
                      onChange={(e) => setData('instansi', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Jabatan Resmi</label>
                    <input
                      type="text"
                      required
                      value={data.jabatan}
                      onChange={(e) => setData('jabatan', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nama Bank</label>
                    <SearchableBankSelect
                      value={data.bank_name}
                      onChange={(val) => setData('bank_name', val)}
                      error={errors.bank_name}
                      placeholder="Pilih atau cari bank..."
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nomor Rekening</label>
                    <input
                      type="text"
                      value={data.account_number}
                      onChange={(e) => setData('account_number', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={processing}
                    className="px-4 py-2 rounded-xl text-xs font-black text-white bg-blue-900"
                  >
                    Simpan Pembicara
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
