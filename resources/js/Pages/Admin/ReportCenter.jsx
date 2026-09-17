import React, { useState, useEffect } from 'react';
import { usePage, Link, router } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import ResizableLogoCrud from '@/Components/ResizableLogoCrud';
import SearchableEventSelect from '@/Components/SearchableEventSelect';
import { 
  FileSpreadsheet, 
  FileText, 
  Download, 
  Printer, 
  Plus, 
  Trash2, 
  Bold, 
  Italic, 
  Underline, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  RotateCcw, 
  Edit3, 
  ExternalLink 
} from 'lucide-react';

export default function ReportCenter({ 
  templates = [], 
  events = [], 
  selectedTemplateCode, 
  selectedEventId, 
  currentTemplate, 
  currentEvent 
}) {
  const { auth } = usePage().props;
  const user = auth?.user || {};

  const [templateCode, setTemplateCode] = useState(selectedTemplateCode || 'REKAP_ABSENSI');
  const [eventId, setEventId] = useState(selectedEventId || events[0]?.id || 1);
  const [paperSize, setPaperSize] = useState('A4'); // 'A4' | 'A4_LANDSCAPE' | 'F4'
  const [fontFamily, setFontFamily] = useState('font-serif'); // 'font-serif' | 'font-sans' | 'font-mono'
  const [fontSize, setFontSize] = useState('11pt');
  const [isEditable, setIsEditable] = useState(true);

  const activeEvent = currentEvent || events.find(e => e.id === Number(eventId)) || events[0];

  // Initialize editable table rows for attendance
  const [attendanceRows, setAttendanceRows] = useState([]);
  // Initialize editable table rows for speakers / honor
  const [speakerRows, setSpeakerRows] = useState([]);

  // Sync rows whenever event or template changes
  useEffect(() => {
    if (activeEvent?.registrations) {
      const initialAttRows = activeEvent.registrations.map((reg, idx) => ({
        id: reg.id || idx + 1,
        no: idx + 1,
        name: reg.user?.name || 'Peserta BIMTEK',
        nik: reg.user?.nip_nik || reg.user?.participant_profile?.nik || '3201000000000000',
        instansi: reg.user?.instansi || reg.user?.participant_profile?.instansi || 'Masyarakat Umum / Instansi',
        ticket_code: reg.registration_code || `BMK-${2026}-${String(idx + 1).padStart(4, '0')}`,
        checkin_time: reg.attendances?.[0] ? new Date(reg.attendances[0].checked_in_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '08:30 WIB',
        status: 'FIKS HADIR (VERIFIED)'
      }));
      setAttendanceRows(initialAttRows.length > 0 ? initialAttRows : [
        { id: 1, no: 1, name: 'IRZI', nik: '32010202025520', instansi: 'UMUM', ticket_code: 'BMK-2026-JOTYEA', checkin_time: '14.16.14', status: 'FIKS HADIR (VERIFIED)' },
        { id: 2, no: 2, name: 'RANGGA BAGAS SETIAWAN', nik: '3201011234567890', instansi: 'UMUM', ticket_code: 'BMK-2026-AEM6E9', checkin_time: '20.25.26', status: 'FIKS HADIR (VERIFIED)' },
        { id: 3, no: 3, name: 'udin', nik: '3202026511620032', instansi: 'umum', ticket_code: 'BMK-2026-PHDASA', checkin_time: '14.35.11', status: 'FIKS HADIR (VERIFIED)' }
      ]);
    }

    if (activeEvent?.event_speakers) {
      const initialSpkRows = activeEvent.event_speakers.map((es, idx) => {
        const bruto = (es.jp_hours || 4) * 300000;
        const tax = bruto * 0.05;
        const netto = bruto - tax;
        return {
          id: es.id || idx + 1,
          no: idx + 1,
          name: es.speaker?.name || 'Narasumber Ahli',
          topic: es.topic || 'Pakar Keamanan Siber / SPBE',
          npwp: es.speaker?.npwp || '32.010.000.0-000.000',
          bank: `BJB: ${es.speaker?.account_number || '0123456789'}`,
          jp: `${es.jp_hours || 4} JP`,
          bruto: `Rp ${bruto.toLocaleString('id-ID')}`,
          tax: `Rp ${tax.toLocaleString('id-ID')}`,
          netto: `Rp ${netto.toLocaleString('id-ID')}`
        };
      });
      setSpeakerRows(initialSpkRows.length > 0 ? initialSpkRows : [
        { id: 1, no: 1, name: 'Prof. Dr. Bambang Hermawan, M.Kom', topic: 'Pakar AI & Keamanan SPBE', npwp: '32.019.882.1-404.000', bank: 'Bank BJB: 00987654321', jp: '4 JP', bruto: 'Rp 1.200.000', tax: 'Rp 60.000', netto: 'Rp 1.140.000' }
      ]);
    }
  }, [eventId, activeEvent]);

  // Table row CRUD functions
  const handleAddAttendanceRow = () => {
    const newNo = attendanceRows.length + 1;
    const newRow = {
      id: Date.now(),
      no: newNo,
      name: 'Nama Peserta Baru',
      nik: '3201000000000000',
      instansi: 'Instansi / Unit Kerja',
      ticket_code: `BMK-2026-${String(newNo).padStart(4, '0')}`,
      checkin_time: '08:30 WIB',
      status: 'FIKS HADIR (VERIFIED)'
    };
    setAttendanceRows([...attendanceRows, newRow]);
  };

  const handleDeleteAttendanceRow = () => {
    if (attendanceRows.length > 1) {
      setAttendanceRows(attendanceRows.slice(0, -1));
    }
  };

  const handleAddSpeakerRow = () => {
    const newNo = speakerRows.length + 1;
    const newRow = {
      id: Date.now(),
      no: newNo,
      name: 'Nama Narasumber Baru',
      topic: 'Materi Bimbingan Teknis',
      npwp: '32.000.000.0-000.000',
      bank: 'Bank BJB: 0000000000',
      jp: '2 JP',
      bruto: 'Rp 600.000',
      tax: 'Rp 30.000',
      netto: 'Rp 570.000'
    };
    setSpeakerRows([...speakerRows, newRow]);
  };

  const handleDeleteSpeakerRow = () => {
    if (speakerRows.length > 1) {
      setSpeakerRows(speakerRows.slice(0, -1));
    }
  };

  // Rich Text Exec Command (Word Style Formatting)
  const applyFormat = (command, value = null) => {
    document.execCommand(command, false, value);
  };

  const handlePrint = () => {
    window.print();
  };

  const [isPdfLoading, setIsPdfLoading] = React.useState(false);

  const handleExportPdf = async () => {
    if (isPdfLoading) return;
    setIsPdfLoading(true);
    try {
    const { default: html2pdf } = await import('html2pdf.js');
    const element = document.getElementById('word-document-sheet');
    if (!element) return;

    const targetTitle = activeEvent?.title || 'Laporan_BIMTEK_Diskominfo';
    const isLandscape = paperSize === 'A4_LANDSCAPE';

    const opt = {
      margin:       [10, 12, 10, 12],
      filename:     `Laporan_${templateCode}_${targetTitle.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, letterRendering: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: isLandscape ? 'landscape' : 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
    } finally { setIsPdfLoading(false); }
  };

  // Reset to initial event data
  const handleResetData = () => {
    if (confirm('Kembalikan seluruh teks dan susunan tabel ke format data bawaan kegiatan?')) {
      window.location.reload();
    }
  };

  return (
    <AppLayout title="Editor Laporan Resmi (Microsoft Word Style)">
      {/* INLINE PRINT & GOOGLE DOCS EDITING CSS */}
      <style>{`
        [contenteditable="true"] {
          outline: none !important;
          transition: background-color 0.15s ease, box-shadow 0.15s ease;
        }
        [contenteditable="true"]:hover {
          background-color: rgba(59, 130, 246, 0.08) !important;
          border-radius: 2px !important;
          cursor: text;
        }
        [contenteditable="true"]:focus {
          outline: none !important;
          background-color: #ffffff !important;
          box-shadow: inset 0 0 0 2px #2563eb, 0 0 0 3px rgba(37, 99, 235, 0.25) !important;
          border-radius: 3px !important;
        }
        @media print {
          [contenteditable="true"]:focus, [contenteditable="true"]:hover {
            background-color: transparent !important;
            box-shadow: none !important;
            outline: none !important;
          }
          @page {
            size: ${paperSize === 'A4_LANDSCAPE' ? 'A4 landscape' : 'A4 portrait'};
            margin: 12mm 15mm 12mm 15mm;
          }
          html, body {
            background: #ffffff !important;
            color: #000000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print\\:hidden, nav, header, footer, aside, #mobile-bottom-nav {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: none !important;
          }
          #word-document-sheet {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 auto !important;
            width: 100% !important;
            max-width: 100% !important;
            min-height: auto !important;
            background: #ffffff !important;
          }
          #word-document-sheet table {
            border-collapse: collapse !important;
            width: 100% !important;
          }
        }
      `}</style>

      <div className="space-y-5 pb-16">
        
        {/* WORD RIBBON & HEADER CONTROLS (PRINT:HIDDEN) */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4 print:hidden">
          
          {/* TOP BAR: APP INFO & MAIN EXPORTS */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-900 text-white text-[11px] font-black uppercase tracking-wider">
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  <span>Microsoft Word & Docs Live Editor</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200">
                  ● 100% Live Editable (Ketik Langsung)
                </span>
              </div>
              <h1 className="text-xl font-black text-slate-950">
                Pusat Dokumen Laporan & Berita Acara Resmi
              </h1>
              <p className="text-xs text-slate-500">
                Tampilan dan ukuran kertas otomatis disesuaikan dengan lembar kerja Microsoft Word (A4 Standar). Klik pada teks mana saja untuk mengedit.
              </p>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex flex-wrap items-center gap-2">
              <a
                href={`/admin/reports/attendance/excel?event_id=${eventId}&type=all`}
                className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black rounded-xl shadow-xs flex items-center gap-1.5 transition-transform active:scale-95"
                title="Ekspor Data ke Microsoft Excel"
              >
                <FileSpreadsheet className="w-4 h-4 text-amber-300" />
                <span>Unduh Excel</span>
              </a>

              <button
                onClick={handlePrint}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-300 flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                title="Cetak Dokumen Langsung"
              >
                <Printer className="w-4 h-4 text-slate-600" />
                <span>Cetak Lembar</span>
              </button>

              <button
                onClick={handleExportPdf}
                disabled={isPdfLoading}
                className="px-4 py-2 bg-blue-900 hover:bg-blue-950 disabled:opacity-60 disabled:cursor-wait text-white text-xs font-black rounded-xl shadow-xs flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
                title="Unduh sebagai file PDF A4"
              >
                <Download className="w-4 h-4 text-amber-400" />
                <span>{isPdfLoading ? 'Menyiapkan PDF...' : 'Unduh PDF'}</span>
              </button>
            </div>
          </div>

          {/* TEMPLATE TABS & EVENT SELECTOR */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            {/* TEMPLATE SWITCHER */}
            <div>
              <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1">
                Pilih Format Dokumen:
              </label>
              <select
                value={templateCode}
                onChange={(e) => setTemplateCode(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-blue-900 focus:bg-white"
              >
                <option value="REKAP_ABSENSI">📋 Rekapitulasi Presensi & Daftar Hadir Peserta</option>
                <option value="BERITA_ACARA">📜 Berita Acara Pelaksanaan Kegiatan BIMTEK</option>
                <option value="HONOR_PEMBICARA">💰 Daftar Pembayaran Honorarium & Transport Narasumber</option>
              </select>
            </div>

            {/* EVENT SELECTOR */}
            <div>
              <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1">
                Pilih Kegiatan BIMTEK:
              </label>
              <SearchableEventSelect
                events={events}
                value={eventId}
                onChange={(id) => {
                  setEventId(id);
                  router.get('/admin/report-center', {
                    template: templateCode,
                    event_id: id,
                  }, { preserveState: true, preserveScroll: true });
                }}
                required
                placeholder="Cari / pilih kegiatan BIMTEK..."
              />
            </div>

            {/* PAPER SIZE & ORIENTATION */}
            <div>
              <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1">
                Ukuran & Tata Letak Kertas:
              </label>
              <div className="flex items-center gap-1.5 bg-slate-50 p-1 border border-slate-300 rounded-xl">
                <button
                  type="button"
                  onClick={() => setPaperSize('A4')}
                  className={`flex-1 py-1 text-center text-xs font-bold rounded-lg transition-colors ${
                    paperSize === 'A4' ? 'bg-blue-900 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  A4 Potret
                </button>
                <button
                  type="button"
                  onClick={() => setPaperSize('A4_LANDSCAPE')}
                  className={`flex-1 py-1 text-center text-xs font-bold rounded-lg transition-colors ${
                    paperSize === 'A4_LANDSCAPE' ? 'bg-blue-900 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  A4 Lanskap
                </button>
                <button
                  type="button"
                  onClick={() => setPaperSize('F4')}
                  className={`flex-1 py-1 text-center text-xs font-bold rounded-lg transition-colors ${
                    paperSize === 'F4' ? 'bg-blue-900 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  F4/Folio
                </button>
              </div>
            </div>
          </div>

          {/* WORD FORMATTING TOOLBAR (RIBBON STYLE) */}
          <div className="bg-slate-100/90 border border-slate-300/80 p-2 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs">
            {/* FONT & TEXT CONTROLS */}
            <div className="flex flex-wrap items-center gap-1">
              <select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className="p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 outline-none"
              >
                <option value="font-serif">Times New Roman / Serif</option>
                <option value="font-sans">Calibri / Arial / Sans</option>
                <option value="font-mono">Consolas / Monospace</option>
              </select>

              <select
                value={fontSize}
                onChange={(e) => setFontSize(e.target.value)}
                className="p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 outline-none"
              >
                <option value="10pt">10 pt</option>
                <option value="11pt">11 pt (Standar)</option>
                <option value="12pt">12 pt</option>
                <option value="14pt">14 pt</option>
              </select>

              <div className="h-5 w-px bg-slate-300 mx-1"></div>

              <button
                type="button"
                onClick={() => applyFormat('bold')}
                className="p-1.5 bg-white hover:bg-slate-200 border border-slate-300 rounded-lg font-black text-slate-800"
                title="Tebal (Bold)"
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => applyFormat('italic')}
                className="p-1.5 bg-white hover:bg-slate-200 border border-slate-300 rounded-lg italic text-slate-800"
                title="Miring (Italic)"
              >
                <Italic className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => applyFormat('underline')}
                className="p-1.5 bg-white hover:bg-slate-200 border border-slate-300 rounded-lg underline text-slate-800"
                title="Garis Bawah (Underline)"
              >
                <Underline className="w-3.5 h-3.5" />
              </button>

              <div className="h-5 w-px bg-slate-300 mx-1"></div>

              <button
                type="button"
                onClick={() => applyFormat('justifyLeft')}
                className="p-1.5 bg-white hover:bg-slate-200 border border-slate-300 rounded-lg text-slate-800"
                title="Rata Kiri"
              >
                <AlignLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => applyFormat('justifyCenter')}
                className="p-1.5 bg-white hover:bg-slate-200 border border-slate-300 rounded-lg text-slate-800"
                title="Rata Tengah"
              >
                <AlignCenter className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => applyFormat('justifyRight')}
                className="p-1.5 bg-white hover:bg-slate-200 border border-slate-300 rounded-lg text-slate-800"
                title="Rata Kanan"
              >
                <AlignRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* TABLE CONTROLS & RESET */}
            <div className="flex items-center gap-1.5">
              {templateCode === 'REKAP_ABSENSI' && (
                <>
                  <button
                    type="button"
                    onClick={handleAddAttendanceRow}
                    className="px-2.5 py-1.5 bg-blue-900 hover:bg-blue-950 text-white font-bold rounded-lg flex items-center gap-1 shadow-xs"
                    title="Tambah Baris Peserta ke Tabel"
                  >
                    <Plus className="w-3.5 h-3.5 text-amber-400" />
                    <span>+ Baris Peserta</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteAttendanceRow}
                    className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold border border-rose-300 rounded-lg flex items-center gap-1"
                    title="Hapus Baris Terakhir"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>- Baris</span>
                  </button>
                </>
              )}

              {templateCode === 'HONOR_PEMBICARA' && (
                <>
                  <button
                    type="button"
                    onClick={handleAddSpeakerRow}
                    className="px-2.5 py-1.5 bg-purple-900 hover:bg-purple-950 text-white font-bold rounded-lg flex items-center gap-1 shadow-xs"
                    title="Tambah Baris Pembicara"
                  >
                    <Plus className="w-3.5 h-3.5 text-amber-400" />
                    <span>+ Baris Narasumber</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteSpeakerRow}
                    className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold border border-rose-300 rounded-lg flex items-center gap-1"
                    title="Hapus Baris Terakhir"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>- Baris</span>
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={handleResetData}
                className="p-1.5 bg-white hover:bg-slate-200 border border-slate-300 rounded-lg text-slate-700"
                title="Reset Data ke Bawaan Kegiatan"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* QUICK LINK BANNER TO SPECIALIZED FORMATS */}
        <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl text-xs text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 print:hidden">
          <div className="flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              <strong>Petunjuk Microsoft Word Mode:</strong> Anda dapat mengklik dan mengedit teks langsung di lembar kerja A4 di bawah (termasuk judul, nomor surat, nama peserta, instansi, hingga pejabat penandatangan).
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin/reports/participants"
              className="text-blue-900 hover:underline font-bold text-[11px] flex items-center gap-1"
            >
              <span>Format 2-Kolom TTD Zig-zag</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
            <span className="text-slate-300">&bull;</span>
            <Link 
              href="/admin/reports/speakers" 
              className="text-blue-900 hover:underline font-bold text-[11px] flex items-center gap-1"
            >
              <span>Undangan & Rundown</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MICROSOFT WORD WORKSPACE CANVAS (AUTHENTIC A4 / F4 SHEET CONTAINER)       */}
        {/* ========================================================================= */}
        <div className="bg-slate-200/90 p-4 sm:p-8 md:p-12 rounded-3xl border border-slate-300 shadow-inner flex justify-center overflow-x-auto print:bg-transparent print:p-0 print:border-none print:shadow-none">
          
          {/* THE PHYSICAL WORD DOCUMENT SHEET */}
          <div 
            id="word-document-sheet"
            className={`bg-white text-black transition-all mx-auto print:m-0 print:p-0 print:border-none print:shadow-none ${
              paperSize === 'A4_LANDSCAPE'
                ? 'w-full max-w-5xl min-h-[210mm] p-4 sm:p-12 md:p-14'
                : paperSize === 'F4'
                ? 'w-full max-w-3xl min-h-[330mm] p-4 sm:p-12 md:p-16'
                : 'w-full max-w-3xl min-h-[297mm] p-4 sm:p-12 md:p-14'
            } shadow-[0_8px_30px_rgb(0,0,0,0.15)] border border-slate-300`}
            style={{ fontFamily: '"Times New Roman", Times, serif', fontSize: fontSize }}
          >
            
            {/* 1. DOCUMENT TITLE */}
            <div className="text-center space-y-1 mb-6">
              <h1 
                className="text-base sm:text-lg font-bold uppercase tracking-wide text-black"
                contentEditable={isEditable}
                suppressContentEditableWarning
              >
                {activeEvent?.title ? activeEvent.title.toUpperCase() : 'BIMTEK CYBER SECURITY'}
              </h1>
              <h2 
                className="text-sm font-bold uppercase text-black"
                contentEditable={isEditable}
                suppressContentEditableWarning
              >
                TAHUN ANGGARAN 2026
              </h2>
            </div>

            {/* 2. METADATA KEY-VALUE (CLEAN UNBORDERED ALIGNMENT WITHOUT TABLE TAGS) */}
            <div className="mb-6 text-[10.5pt] text-black space-y-1">
              <div className="flex items-start">
                <span className="w-36 font-bold shrink-0">Program</span>
                <span className="w-4 text-center font-bold shrink-0">:</span>
                <span 
                  className="font-normal text-black"
                  contentEditable={isEditable}
                  suppressContentEditableWarning
                >
                  2.16.03 Program Pengelolaan Aplikasi Informatika
                </span>
              </div>
              <div className="flex items-start">
                <span className="w-36 font-bold shrink-0">Kegiatan</span>
                <span className="w-4 text-center font-bold shrink-0">:</span>
                <span 
                  className="font-normal text-black"
                  contentEditable={isEditable}
                  suppressContentEditableWarning
                >
                  2.16.03.2.02 Pengelolaan E-Government Di Lingkup Pemerintah Daerah Kabupaten/Kota
                </span>
              </div>
              <div className="flex items-start">
                <span className="w-36 font-bold shrink-0">Sub Kegiatan</span>
                <span className="w-4 text-center font-bold shrink-0">:</span>
                <span 
                  className="font-normal text-black"
                  contentEditable={isEditable}
                  suppressContentEditableWarning
                >
                  2.16.03.2.02.0035 Koordinasi dan Fasilitasi Promosi Literasi SPBE dan/atau Kolaborasi Penyelenggaraan SPBE
                </span>
              </div>
              <div className="flex items-start">
                <span className="w-36 font-bold shrink-0">Acara</span>
                <span className="w-4 text-center font-bold shrink-0">:</span>
                <span 
                  className="font-bold text-black"
                  contentEditable={isEditable}
                  suppressContentEditableWarning
                >
                  {activeEvent?.title || 'Bimbingan Teknis Artificial Intelligence (AI)'}
                </span>
              </div>
              <div className="flex items-start">
                <span className="w-36 font-bold shrink-0">Hari / Tanggal</span>
                <span className="w-4 text-center font-bold shrink-0">:</span>
                <span 
                  className="font-normal text-black"
                  contentEditable={isEditable}
                  suppressContentEditableWarning
                >
                  {activeEvent?.start_date ? new Date(activeEvent.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '11 Agustus 2026'}
                </span>
              </div>
              <div className="flex items-start">
                <span className="w-36 font-bold shrink-0">Tempat</span>
                <span className="w-4 text-center font-bold shrink-0">:</span>
                <span 
                  className="font-normal text-black"
                  contentEditable={isEditable}
                  suppressContentEditableWarning
                >
                  {activeEvent?.location || 'Hotel New Pesona Anggraini Kec. Cisarua Kab. Bogor'}
                </span>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* TEMPLATE 1: REKAPITULASI PRESENSI PESERTA (EXACT TABLE WORD STYLE)        */}
            {/* ========================================================================= */}
            {templateCode === 'REKAP_ABSENSI' && (
              <div className="pt-2">
                <table className="w-full text-left text-[10pt] border-collapse border border-black">
                  <thead className="bg-slate-100 text-black font-extrabold uppercase text-[9.5pt]">
                    <tr>
                      <th className="p-2 border border-black text-center w-12">NO</th>
                      <th className="p-2 border border-black">NAMA LENGKAP & NIK</th>
                      <th className="p-2 border border-black">INSTANSI / UNIT KERJA</th>
                      <th className="p-2 border border-black text-center w-36">WAKTU PRESENSI</th>
                      <th className="p-2 border border-black text-center w-40">STATUS KEHADIRAN</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black">
                    {attendanceRows.map((row, idx) => (
                      <tr key={row.id || idx} className="hover:bg-slate-50/60 transition-colors">
                        {/* 1. NO */}
                        <td 
                          className="p-2 border border-black text-center font-normal"
                          contentEditable={isEditable} 
                          suppressContentEditableWarning
                        >
                          {row.no || idx + 1}
                        </td>

                        {/* 2. NAMA & NIK */}
                        <td className="p-2 border border-black">
                          <strong 
                            className="block text-black font-bold uppercase"
                            contentEditable={isEditable} 
                            suppressContentEditableWarning
                          >
                            {row.name}
                          </strong>
                          <span 
                            className="text-[9pt] text-slate-700 font-normal"
                            contentEditable={isEditable} 
                            suppressContentEditableWarning
                          >
                            NIK: {row.nik}
                          </span>
                        </td>

                        {/* 3. INSTANSI */}
                        <td 
                          className="p-2 border border-black uppercase text-black font-normal"
                          contentEditable={isEditable} 
                          suppressContentEditableWarning
                        >
                          {row.instansi}
                        </td>

                        {/* 4. WAKTU PRESENSI */}
                        <td 
                          className="p-2 border border-black text-center text-black font-normal text-[9.5pt]"
                          contentEditable={isEditable} 
                          suppressContentEditableWarning
                        >
                          {row.checkin_time}
                        </td>

                        {/* 5. STATUS KEHADIRAN */}
                        <td 
                          className="p-2 border border-black text-center font-bold text-[9.5pt] text-emerald-950"
                          contentEditable={isEditable} 
                          suppressContentEditableWarning
                        >
                          {row.status}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ========================================================================= */}
            {/* TEMPLATE 2: BERITA ACARA PELAKSANAAN BIMTEK                              */}
            {/* ========================================================================= */}
            {templateCode === 'BERITA_ACARA' && (
              <div className="space-y-4 text-[11pt] leading-relaxed text-black pt-2">
                <p contentEditable={isEditable} suppressContentEditableWarning>
                  Pada hari ini <strong className="font-bold">{activeEvent?.start_date ? new Date(activeEvent.start_date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'Jumat, 2 Januari 2026'}</strong>, bertempat di <strong className="font-bold">{activeEvent?.location || 'Auditorium Dinas Komunikasi dan Informatika Kabupaten Bogor'}</strong>, telah dilaksanakan kegiatan <strong className="font-bold">{activeEvent?.title || 'Bimbingan Teknis Cyber Security & Digital Government'}</strong> yang diselenggarakan secara resmi oleh Dinas Komunikasi dan Informatika Kabupaten Bogor.
                </p>

                <p contentEditable={isEditable} suppressContentEditableWarning>
                  Kegiatan ini diikuti dan dihadiri oleh sebanyak <strong className="font-bold">{attendanceRows.length} (tiga) orang peserta</strong> dari berbagai perangkat daerah/instansi, serta dipandu langsung oleh narasumber ahli berkompeten di bidangnya. Seluruh materi dan sesi praktek telah terlaksana dengan baik, tertib, dan lancar sesuai dengan jadwal agenda yang telah ditetapkan.
                </p>

                <p contentEditable={isEditable} suppressContentEditableWarning>
                  Adapun rincian capaian dan hasil pelaksanaan kegiatan adalah sebagai berikut:
                </p>

                <ol className="list-decimal pl-6 space-y-1.5" contentEditable={isEditable} suppressContentEditableWarning>
                  <li>Penyampaian materi teoritis dan best practice pengelolaan keamanan informasi SPBE.</li>
                  <li>Simulasi dan pendampingan praktek langsung implementasi sistem kedinasan.</li>
                  <li>Verifikasi kehadiran peserta dan penerbitan sertifikat digital resmi Diskominfo.</li>
                </ol>

                <p contentEditable={isEditable} suppressContentEditableWarning>
                  Demikian Berita Acara Pelaksanaan Kegiatan ini dibuat dengan sebenarnya dengan penuh rasa tanggung jawab agar dapat dipergunakan sebagai bahan laporan pertanggungjawaban kedinasan dan arsip resmi Pemerintah Kabupaten Bogor.
                </p>
              </div>
            )}

            {/* ========================================================================= */}
            {/* TEMPLATE 3: REKAPITULASI HONORARIUM & TRANSPORTASI NARASUMBER             */}
            {/* ========================================================================= */}
            {templateCode === 'HONOR_PEMBICARA' && (
              <div className="pt-2">
                <table className="w-full text-left text-[10pt] border-collapse border-2 border-black">
                  <thead className="bg-slate-100 text-black font-extrabold uppercase text-[9pt]">
                    <tr>
                      <th className="p-2 border border-black text-center w-10">NO</th>
                      <th className="p-2 border border-black">NAMA PEMBICARA / NARASUMBER</th>
                      <th className="p-2 border border-black">NPWP & REKENING BANK BJB</th>
                      <th className="p-2 border border-black text-center w-20">JP</th>
                      <th className="p-2 border border-black text-right w-28">HONOR BRUTO</th>
                      <th className="p-2 border border-black text-right w-24">PPH 21 (5%)</th>
                      <th className="p-2 border border-black text-right w-28">TERIMA BERSIH</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black font-medium">
                    {speakerRows.map((row, idx) => (
                      <tr key={row.id || idx} className="hover:bg-slate-50/60 transition-colors">
                        {/* 1. NO */}
                        <td 
                          className="p-2 border border-black text-center font-bold"
                          contentEditable={isEditable} 
                          suppressContentEditableWarning
                        >
                          {row.no || idx + 1}
                        </td>

                        {/* 2. NAMA & TOPIK */}
                        <td className="p-2 border border-black">
                          <strong 
                            className="block text-black font-bold"
                            contentEditable={isEditable} 
                            suppressContentEditableWarning
                          >
                            {row.name}
                          </strong>
                          <span 
                            className="text-[9pt] text-slate-700"
                            contentEditable={isEditable} 
                            suppressContentEditableWarning
                          >
                            {row.topic}
                          </span>
                        </td>

                        {/* 3. NPWP & BANK */}
                        <td className="p-2 border border-black text-[9pt]">
                          <div contentEditable={isEditable} suppressContentEditableWarning>NPWP: {row.npwp}</div>
                          <div className="font-bold text-slate-900" contentEditable={isEditable} suppressContentEditableWarning>{row.bank}</div>
                        </td>

                        {/* 4. JP */}
                        <td 
                          className="p-2 border border-black text-center font-bold"
                          contentEditable={isEditable} 
                          suppressContentEditableWarning
                        >
                          {row.jp}
                        </td>

                        {/* 5. BRUTO */}
                        <td 
                          className="p-2 border border-black text-right font-normal text-black"
                          contentEditable={isEditable} 
                          suppressContentEditableWarning
                        >
                          {row.bruto}
                        </td>

                        {/* 6. TAX */}
                        <td 
                          className="p-2 border border-black text-right font-normal text-black"
                          contentEditable={isEditable} 
                          suppressContentEditableWarning
                        >
                          {row.tax}
                        </td>

                        {/* 7. NETTO */}
                        <td 
                          className="p-2 border border-black text-right font-bold text-black"
                          contentEditable={isEditable} 
                          suppressContentEditableWarning
                        >
                          {row.netto}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ========================================================================= */}
            {/* OFFICIAL SIGNATURE BLOCK (CONTENTEDITABLE WORD STYLE)                     */}
            {/* ========================================================================= */}
            <div className="pt-10 grid grid-cols-2 gap-8 text-[10.5pt] leading-normal break-inside-avoid">
              <div></div>
              <div className="text-center space-y-16">
                <div className="space-y-0.5">
                  <p 
                    className="font-bold text-black uppercase"
                    contentEditable={isEditable} 
                    suppressContentEditableWarning
                  >
                    PEJABAT PELAKSANA TEKNIS KEGIATAN
                  </p>
                  <p 
                    className="font-bold text-black uppercase text-[9.5pt] leading-snug"
                    contentEditable={isEditable} 
                    suppressContentEditableWarning
                  >
                    SUBSTANSI PENGEMBANGAN SUMBER DAYA DAN TEKNOLOGI INFORMATIKA
                  </p>
                </div>

                <div className="space-y-0.5">
                  <p 
                    className="font-bold underline text-[11pt] text-black uppercase"
                    contentEditable={isEditable} 
                    suppressContentEditableWarning
                  >
                    DINI SAUMI IMANIAH, SS, MM
                  </p>
                  <p 
                    className="text-[10pt] text-black"
                    contentEditable={isEditable} 
                    suppressContentEditableWarning
                  >
                    NIP. 19750927 199803 2 009
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </AppLayout>
  );
}
