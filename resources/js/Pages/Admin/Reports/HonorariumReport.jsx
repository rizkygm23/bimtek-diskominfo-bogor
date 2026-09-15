import React, { useState, useEffect } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Head, router } from '@inertiajs/react';
import { 
  Printer, 
  Plus, 
  Trash2, 
  FileSpreadsheet, 
  Download, 
  Save, 
  RotateCcw, 
  Check, 
  FileText,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight
} from 'lucide-react';

export default function HonorariumReport({ events = [], selectedEventId, currentEvent, template, payments = [] }) {
  // Built-in Presets for Quick Selection
  const PRESETS = [
    {
      id: 'honor_standar',
      name: 'Format Standar Tanda Terima Honorarium',
      report_title: currentEvent ? `TANDA TERIMA HONORARIUM / UANG SAKU ${currentEvent.title.toUpperCase()}` : 'TANDA TERIMA HONORARIUM / UANG SAKU',
      program_code_name: '2.16.03 - Program Pengelolaan Aplikasi Informatika',
      kegiatan_code_name: '2.16.03.2.02 - Pengelolaan E-Government',
      sub_kegiatan_code_name: '2.16.03.2.02.0035 - Koordinasi dan Fasilitasi SPBE',
      acara: currentEvent?.title || 'Bimbingan Teknis Literasi Digital dan SPBE',
      tanggal: currentEvent?.start_date ? new Date(currentEvent.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '11 Agustus 2026',
      tempat: currentEvent?.location || 'Hotel New Pesona Anggraini Cisarua, Bogor',
      col_school_label: 'Uraian / Komponen Honorarium',
      col_district_label: 'Potongan PPh & Nominal Bersih',
    }
  ];

  // Saved Config from Template
  const savedHeader = template?.header_config || {};

  // Header State
  const [headerConfig, setHeaderConfig] = useState({
    report_title: savedHeader.report_title || (currentEvent ? `TANDA TERIMA HONORARIUM / UANG SAKU ${currentEvent.title.toUpperCase()}` : PRESETS[0].report_title),
    program_code_name: savedHeader.program_code_name || PRESETS[0].program_code_name,
    kegiatan_code_name: savedHeader.kegiatan_code_name || PRESETS[0].kegiatan_code_name,
    sub_kegiatan_code_name: savedHeader.sub_kegiatan_code_name || PRESETS[0].sub_kegiatan_code_name,
    acara: savedHeader.acara || currentEvent?.title || PRESETS[0].acara,
    tanggal: savedHeader.tanggal || (currentEvent?.start_date ? new Date(currentEvent.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : PRESETS[0].tanggal),
    tempat: savedHeader.tempat || currentEvent?.location || PRESETS[0].tempat,
    col_school_label: savedHeader.col_school_label || PRESETS[0].col_school_label,
    col_district_label: savedHeader.col_district_label || PRESETS[0].col_district_label,
    signee_nama: savedHeader.signee_nama || template?.signee_nama || 'DINI SAUMI IMANIAH, SS, MM',
    signee_nip: savedHeader.signee_nip || template?.signee_nip || '19750927 199803 2 009',
    signee_jabatan: savedHeader.signee_jabatan || template?.signee_jabatan || 'PEJABAT PELAKSANA TEKNIS KEGIATAN',
    signee_substansi: savedHeader.signee_substansi || 'SUBSTANSI PENGEMBANGAN SUMBER DAYA DAN TEKNOLOGI INFORMATIKA',
    signee_location_date: savedHeader.signee_location_date || `Cibinong, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`,
  });

  const [paperSize, setPaperSize] = useState('A4');
  const [fontSize, setFontSize] = useState('11pt');
  const [isEditable, setIsEditable] = useState(true);

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(number || 0);
  };

  const buildInitialRows = (ev) => {
    if (savedHeader.custom_rows && Array.isArray(savedHeader.custom_rows) && savedHeader.custom_rows.length > 0) {
      return savedHeader.custom_rows;
    }

    if (payments && payments.length > 0) {
      return payments.map((p, idx) => ({
        id: p.id || idx + 1,
        no: idx + 1,
        name: p.user?.name || 'Penerima Honor',
        komponen: `${p.component_type} - ${p.volume} ${p.unit}`,
        pajak: `${formatRupiah(p.tax_amount)} (${p.tax_rate_percent}%) / Bersih: ${formatRupiah(p.net_amount)}`,
        isNew: false
      }));
    }

    return [
      { id: 1, no: 1, name: 'Prof. Dr. Bambang Hermawan', komponen: 'Honorarium Narasumber 4 JP', pajak: 'PPh 21 (5%) Rp 60.000 / Bersih: Rp 1.140.000', isNew: false },
      { id: 2, no: 2, name: 'Dr. Ir. Fikri Nur Hidayah', komponen: 'Honorarium Narasumber 2 JP', pajak: 'PPh 21 (5%) Rp 30.000 / Bersih: Rp 570.000', isNew: false },
      { id: 3, no: 3, name: 'Rangga Bagas Setiawan', komponen: 'Uang Saku / Transport Peserta', pajak: 'Tanpa Potongan / Bersih: Rp 150.000', isNew: false },
    ];
  };

  const [tableRows, setTableRows] = useState(() => buildInitialRows(currentEvent));
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  useEffect(() => {
    setTableRows(buildInitialRows(currentEvent));
    setHasUnsavedChanges(false);
  }, [currentEvent, template, payments]);

  const handleSelectEvent = (id) => {
    window.location.href = `/admin/reports/honorarium?event_id=${id}`;
  };

  const handleSaveAllToDatabase = (e) => {
    if (e) e.preventDefault();
    setIsSaving(true);

    const templateCode = `HONOR_EVENT_${selectedEventId}`;

    router.post('/admin/reports/header-config', {
      template_code: templateCode,
      ...headerConfig,
      custom_rows: tableRows
    }, {
      preserveState: true,
      onSuccess: () => {
        setIsSaving(false);
        setHasUnsavedChanges(false);
        setSaveSuccessNotice(true);
        setTimeout(() => setSaveSuccessNotice(false), 4000);
      },
      onError: () => {
        setIsSaving(false);
      }
    });
  };

  const handleHeaderFieldChange = (field, value) => {
    setHeaderConfig(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  const handleResetHeader = () => {
    if (confirm('Apakah Anda ingin me-reset format header dan rincian honor ke bawaan kegiatan?')) {
      setHeaderConfig({
        ...headerConfig,
        ...PRESETS[0]
      });
      setTableRows(buildInitialRows(currentEvent));
      setHasUnsavedChanges(true);
    }
  };

  const handleCellChange = (id, field, value) => {
    setTableRows(prev => prev.map(row => row.id === id ? { ...row, [field]: value } : row));
    setHasUnsavedChanges(true);
  };

  const handleAddNewRow = () => {
    const newNo = tableRows.length + 1;
    const newRow = {
      id: Date.now(),
      no: newNo,
      name: 'NAMA PENERIMA BARU',
      komponen: 'Honorarium / Uang Saku',
      pajak: 'Bersih: Rp 150.000',
      isNew: true
    };
    setTableRows([...tableRows, newRow]);
    setHasUnsavedChanges(true);
  };

  const handleDeleteRow = (id) => {
    if (confirm('Hapus baris penerima ini dari daftar honorarium?')) {
      const updated = tableRows.filter(r => r.id !== id).map((r, i) => ({ ...r, no: i + 1 }));
      setTableRows(updated);
      setHasUnsavedChanges(true);
    }
  };

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
    const element = document.getElementById('honorarium-official-sheet');
    if (!element) return;

    const opt = {
      margin:       [10, 12, 10, 12],
      filename:     `Tanda_Terima_Honor_${headerConfig.acara.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, letterRendering: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: paperSize === 'A4_LANDSCAPE' ? 'landscape' : 'portrait' },
      pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
    };
    html2pdf().set(opt).from(element).save();
    } finally { setIsPdfLoading(false); }
  };

  return (
    <AppLayout title="Daftar Tanda Terima Honorarium & Uang Saku">
      <Head title="Format Tanda Terima Honorarium - SIM-BIMTEK" />

      {/* PRINT & GOOGLE DOCS LIVE EDITING CSS */}
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
            margin: 10mm 12mm 10mm 12mm;
          }
          html, body {
            background: #ffffff !important;
            color: #000000 !important;
            font-family: "Times New Roman", Times, serif !important;
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
          #honorarium-official-sheet {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 auto !important;
            width: 100% !important;
            max-width: 100% !important;
            min-height: auto !important;
            background: #ffffff !important;
            font-family: "Times New Roman", Times, serif !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
          tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .break-inside-avoid {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>

      <div className="space-y-5 pb-24 font-sans">
        
        {/* WORD RIBBON TOOLBAR & CONTROLS (PRINT:HIDDEN) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4 print:hidden">
          
          {/* TOP BAR */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-purple-900 text-white text-[11px] font-bold uppercase tracking-wider">
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  <span>Format Laporan Resmi (Times New Roman)</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200">
                  ● 100% Live Editable (Ketik Langsung)
                </span>
              </div>
              <h1 className="text-xl font-bold text-slate-900">
                Tanda Terima & Rekapitulasi Honorarium / Uang Saku
              </h1>
              <p className="text-xs text-slate-500">
                Format standar tanda terima kedinasan dengan font Times New Roman. Seluruh judul, informasi kegiatan, rincian penerima, dan tanda tangan PPTK dapat diklik dan diedit langsung.
              </p>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleSaveAllToDatabase}
                disabled={isSaving}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
                title="Simpan Perubahan ke Database"
              >
                <Save className="w-4 h-4 text-amber-300" />
                <span>{isSaving ? 'Menyimpan...' : 'Simpan ke DB'}</span>
              </button>

              <a
                href={`/admin/reports/honorarium/excel?event_id=${selectedEventId}`}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-300 flex items-center gap-1.5 shadow-xs transition-transform active:scale-95"
                title="Ekspor Data ke Microsoft Excel"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Unduh Excel</span>
              </a>

              <button
                onClick={handlePrint}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-300 flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                title="Cetak Lembar Dokumen"
              >
                <Printer className="w-4 h-4 text-slate-600" />
                <span>Cetak Lembar</span>
              </button>

              <button
                onClick={handleExportPdf}
                disabled={isPdfLoading}
                className="px-4 py-2 bg-purple-900 hover:bg-purple-950 disabled:opacity-60 disabled:cursor-wait text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
                title="Unduh sebagai PDF A4"
              >
                <Download className="w-4 h-4 text-amber-400" />
                <span>{isPdfLoading ? 'Menyiapkan PDF...' : 'Unduh PDF'}</span>
              </button>
            </div>
          </div>

          {/* SELECTORS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            {/* EVENT SELECTOR */}
            <div>
              <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Pilih Kegiatan BIMTEK:
              </label>
              <select
                value={selectedEventId}
                onChange={(e) => handleSelectEvent(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-blue-900 focus:bg-white"
              >
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>{ev.title}</option>
                ))}
              </select>
            </div>

            {/* PRESET FORMAT SELECTOR */}
            <div>
              <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Preset Format Dokumen:
              </label>
              <select
                onChange={(e) => {
                  const p = PRESETS.find(pr => pr.id === e.target.value);
                  if (p) {
                    setHeaderConfig(prev => ({ ...prev, ...p }));
                    setHasUnsavedChanges(true);
                  }
                }}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-blue-900 focus:bg-white"
              >
                <option value="">-- Terapkan Preset Standar --</option>
                {PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* PAPER SIZE */}
            <div>
              <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Ukuran & Tata Letak Kertas:
              </label>
              <div className="flex items-center gap-1.5 bg-slate-50 p-1 border border-slate-300 rounded-xl">
                <button
                  type="button"
                  onClick={() => setPaperSize('A4')}
                  className={`flex-1 py-1 text-center text-xs font-bold rounded-lg transition-colors ${
                    paperSize === 'A4' ? 'bg-purple-900 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  A4 Potret
                </button>
                <button
                  type="button"
                  onClick={() => setPaperSize('A4_LANDSCAPE')}
                  className={`flex-1 py-1 text-center text-xs font-bold rounded-lg transition-colors ${
                    paperSize === 'A4_LANDSCAPE' ? 'bg-purple-900 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  A4 Lanskap
                </button>
                <button
                  type="button"
                  onClick={() => setPaperSize('F4')}
                  className={`flex-1 py-1 text-center text-xs font-bold rounded-lg transition-colors ${
                    paperSize === 'F4' ? 'bg-purple-900 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  F4/Folio
                </button>
              </div>
            </div>
          </div>

          {/* WORD FORMATTING RIBBON */}
          <div className="bg-slate-100/90 border border-slate-300/80 p-2 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-1">
              <span className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800">
                Times New Roman (Standar Resmi)
              </span>

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

            {/* TABLE CONTROLS */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleAddNewRow}
                className="px-2.5 py-1.5 bg-purple-900 hover:bg-purple-950 text-white font-bold rounded-lg flex items-center gap-1 shadow-xs cursor-pointer"
                title="Tambah Baris Penerima ke Tabel"
              >
                <Plus className="w-3.5 h-3.5 text-amber-400" />
                <span>+ Baris Penerima</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (tableRows.length > 1) {
                    setTableRows(tableRows.slice(0, -1));
                    setHasUnsavedChanges(true);
                  }
                }}
                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold border border-rose-300 rounded-lg flex items-center gap-1 cursor-pointer"
                title="Hapus Baris Terakhir"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>- Baris</span>
              </button>

              <button
                type="button"
                onClick={handleResetHeader}
                className="p-1.5 bg-white hover:bg-slate-200 border border-slate-300 rounded-lg text-slate-700 cursor-pointer"
                title="Reset Data ke Bawaan Kegiatan"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* SUCCESS NOTIFICATION TOAST */}
        {saveSuccessNotice && (
          <div className="p-4 bg-emerald-500 text-white rounded-xl shadow-lg flex items-center justify-between font-bold text-xs animate-bounce print:hidden">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-amber-300" />
              <span>✓ Perubahan format laporan tanda terima honorarium berhasil disimpan permanen ke database!</span>
            </div>
            <button onClick={() => setSaveSuccessNotice(false)} className="text-white hover:text-slate-200">✕</button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* CLEAN REPORT WORKSPACE (STANDARD A4 GOVERNMENT DOCUMENT SHEET)             */}
        {/* ========================================================================= */}
        <div className="bg-slate-200/90 p-4 sm:p-8 md:p-10 rounded-2xl flex justify-center overflow-x-auto print:bg-transparent print:p-0 print:border-none print:shadow-none">
          
          {/* THE PHYSICAL WHITE A4 PAPER SHEET WITH TIMES NEW ROMAN */}
          <div 
            id="honorarium-official-sheet"
            className={`bg-white text-black transition-all mx-auto ${
              paperSize === 'A4_LANDSCAPE' 
                ? 'w-full max-w-5xl min-h-[210mm] p-8 sm:p-12' 
                : paperSize === 'F4'
                ? 'w-full max-w-3xl min-h-[330mm] p-8 sm:p-12'
                : 'w-full max-w-3xl min-h-[297mm] p-8 sm:p-12'
            } shadow-lg border border-slate-300 print:shadow-none print:border-none print:p-0 print:m-0`}
            style={{ fontFamily: '"Times New Roman", Times, serif', fontSize: fontSize }}
          >
            
            {/* 1. DOCUMENT TITLE */}
            <div className="text-center space-y-1 mb-6">
              <h1 
                className="text-base sm:text-lg font-bold uppercase tracking-wide text-black"
                contentEditable={isEditable}
                suppressContentEditableWarning
                onBlur={(e) => handleHeaderFieldChange('report_title', e.target.innerText)}
              >
                {headerConfig.report_title || 'TANDA TERIMA UANG SAKU / HONORARIUM'}
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
                  onBlur={(e) => handleHeaderFieldChange('program_code_name', e.target.innerText)}
                >
                  {headerConfig.program_code_name}
                </span>
              </div>
              <div className="flex items-start">
                <span className="w-36 font-bold shrink-0">Kegiatan</span>
                <span className="w-4 text-center font-bold shrink-0">:</span>
                <span 
                  className="font-normal text-black"
                  contentEditable={isEditable}
                  suppressContentEditableWarning
                  onBlur={(e) => handleHeaderFieldChange('kegiatan_code_name', e.target.innerText)}
                >
                  {headerConfig.kegiatan_code_name}
                </span>
              </div>
              <div className="flex items-start">
                <span className="w-36 font-bold shrink-0">Sub Kegiatan</span>
                <span className="w-4 text-center font-bold shrink-0">:</span>
                <span 
                  className="font-normal text-black"
                  contentEditable={isEditable}
                  suppressContentEditableWarning
                  onBlur={(e) => handleHeaderFieldChange('sub_kegiatan_code_name', e.target.innerText)}
                >
                  {headerConfig.sub_kegiatan_code_name}
                </span>
              </div>
              <div className="flex items-start">
                <span className="w-36 font-bold shrink-0">Acara</span>
                <span className="w-4 text-center font-bold shrink-0">:</span>
                <span 
                  className="font-bold text-black"
                  contentEditable={isEditable}
                  suppressContentEditableWarning
                  onBlur={(e) => handleHeaderFieldChange('acara', e.target.innerText)}
                >
                  {headerConfig.acara}
                </span>
              </div>
              <div className="flex items-start">
                <span className="w-36 font-bold shrink-0">Hari / Tanggal</span>
                <span className="w-4 text-center font-bold shrink-0">:</span>
                <span 
                  className="font-normal text-black"
                  contentEditable={isEditable}
                  suppressContentEditableWarning
                  onBlur={(e) => handleHeaderFieldChange('tanggal', e.target.innerText)}
                >
                  {headerConfig.tanggal}
                </span>
              </div>
              <div className="flex items-start">
                <span className="w-36 font-bold shrink-0">Tempat</span>
                <span className="w-4 text-center font-bold shrink-0">:</span>
                <span 
                  className="font-normal text-black"
                  contentEditable={isEditable}
                  suppressContentEditableWarning
                  onBlur={(e) => handleHeaderFieldChange('tempat', e.target.innerText)}
                >
                  {headerConfig.tempat}
                </span>
              </div>
            </div>

            {/* 3. STANDARD REPORT TABLE (1PX BLACK BORDERS) */}
            <div className="mb-8 overflow-x-auto">
              <table className="w-full border-collapse border border-black text-[10pt]">
                <thead>
                  <tr className="bg-slate-100/90 text-black">
                    <th className="border border-black px-2.5 py-2 text-center font-bold w-12">NO</th>
                    <th className="border border-black px-3 py-2 text-left font-bold">NAMA PENERIMA</th>
                    <th className="border border-black px-3 py-2 text-left font-bold w-52">{headerConfig.col_school_label || 'URAIAN / KOMPONEN'}</th>
                    <th className="border border-black px-3 py-2 text-left font-bold w-48">{headerConfig.col_district_label || 'PAJAK & BERSIH'}</th>
                    <th className="border border-black px-3 py-2 text-center font-bold w-44">TANDA TERIMA</th>
                    <th className="border border-black px-2 py-2 text-center font-bold w-12 print:hidden">AKSI</th>
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((row, idx) => {
                    const rowNumber = row.no || idx + 1;
                    const isOdd = rowNumber % 2 !== 0;

                    return (
                      <tr key={row.id || idx} className="hover:bg-slate-50/50">
                        <td 
                          className="border border-black px-2.5 py-2.5 text-center font-normal"
                          contentEditable={isEditable}
                          suppressContentEditableWarning
                          onBlur={(e) => handleCellChange(row.id, 'no', e.target.innerText)}
                        >
                          {rowNumber}
                        </td>
                        <td 
                          className="border border-black px-3 py-2.5 font-bold uppercase text-black"
                          contentEditable={isEditable}
                          suppressContentEditableWarning
                          onBlur={(e) => handleCellChange(row.id, 'name', e.target.innerText)}
                        >
                          {row.name}
                        </td>
                        <td 
                          className="border border-black px-3 py-2.5 font-normal text-black"
                          contentEditable={isEditable}
                          suppressContentEditableWarning
                          onBlur={(e) => handleCellChange(row.id, 'komponen', e.target.innerText)}
                        >
                          {row.komponen}
                        </td>
                        <td 
                          className="border border-black px-3 py-2.5 text-[9.5pt] text-black font-semibold"
                          contentEditable={isEditable}
                          suppressContentEditableWarning
                          onBlur={(e) => handleCellChange(row.id, 'pajak', e.target.innerText)}
                        >
                          {row.pajak}
                        </td>
                        <td className="border border-black px-3 py-2.5 align-middle text-[10pt]">
                          {isOdd ? (
                            <div className="flex items-center justify-between w-full pr-4">
                              <span className="font-normal text-black">{rowNumber}.</span>
                              <span className="text-slate-400 select-none">................................</span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between w-full pl-6">
                              <span className="text-slate-400 select-none">................................</span>
                              <span className="font-normal text-black">{rowNumber}.</span>
                            </div>
                          )}
                        </td>
                        <td className="border border-black p-1 text-center align-middle print:hidden">
                          <button
                            type="button"
                            onClick={() => handleDeleteRow(row.id)}
                            className="p-1 text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                            title="Hapus baris ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 4. OFFICIAL PPTK SIGNATURE (RIGHT-ALIGNED, NATURAL FLOW WITH ZERO OVERLAP) */}
            <div className="flex justify-end pt-8 pb-4 break-inside-avoid text-[10.5pt] text-black">
              <div className="text-center w-full sm:w-auto sm:min-w-[320px] max-w-full sm:max-w-[400px]">
                <div className="space-y-0.5 mb-20">
                  <p 
                    className="font-bold text-black uppercase"
                    contentEditable={isEditable}
                    suppressContentEditableWarning
                    onBlur={(e) => handleHeaderFieldChange('signee_jabatan', e.target.innerText)}
                  >
                    {headerConfig.signee_jabatan || 'PEJABAT PELAKSANA TEKNIS KEGIATAN'}
                  </p>
                  <p 
                    className="font-bold text-black uppercase text-[10pt] leading-snug"
                    contentEditable={isEditable}
                    suppressContentEditableWarning
                    onBlur={(e) => handleHeaderFieldChange('signee_substansi', e.target.innerText)}
                  >
                    {headerConfig.signee_substansi || 'SUBSTANSI PENGEMBANGAN SUMBER DAYA DAN TEKNOLOGI INFORMATIKA'}
                  </p>
                </div>

                <div className="space-y-0.5">
                  <p 
                    className="font-bold underline text-[11pt] text-black uppercase"
                    contentEditable={isEditable}
                    suppressContentEditableWarning
                    onBlur={(e) => handleHeaderFieldChange('signee_nama', e.target.innerText)}
                  >
                    {headerConfig.signee_nama || 'DINI SAUMI IMANIAH, SS, MM'}
                  </p>
                  <p 
                    className="text-[10pt] text-black"
                    contentEditable={isEditable}
                    suppressContentEditableWarning
                    onBlur={(e) => handleHeaderFieldChange('signee_nip', e.target.innerText)}
                  >
                    NIP. {headerConfig.signee_nip || '19750927 199803 2 009'}
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
