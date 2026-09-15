import React, { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { Printer, Edit3, Plus, Trash2, Mic, ArrowLeft } from 'lucide-react';

export default function SpeakersReport({ events = [], selectedEventId, currentEvent }) {
  const [paperSize, setPaperSize] = useState('A4');
  const [isEditable, setIsEditable] = useState(true);

  // Dynamic state for Rundown Agenda table rows
  const [day1Rows, setDay1Rows] = useState([
    { id: 1, no: 1, time: '08:30 - 09:15', duration: '0:45', jp: '-', agenda: 'Registrasi Peserta & Verifikasi Berkas' },
    { id: 2, no: 2, time: '09:15 - 10:00', duration: '0:45', jp: '-', agenda: 'Opening MG + Sambutan Pembukaan Kadiskominfo' },
    { id: 3, no: 3, time: '10:00 - 12:00', duration: '2:00', jp: '2 JP', agenda: 'Narasumber Pakar AI Diskominfo / Pemaparan Materi Sesi 1' },
    { id: 4, no: 4, time: '12:00 - 13:00', duration: '1:00', jp: '-', agenda: 'ISOMA (Istirahat, Shalat, Makan Siang)', isIsoma: true },
    { id: 5, no: 5, time: '13:00 - 15:00', duration: '2:00', jp: '2 JP', agenda: 'Narasumber Pakar AI Diskominfo / Pendampingan Praktek Sesi 2' }
  ]);

  const handleSelectEvent = (id) => {
    window.location.href = route('admin.reports.speakers', { event_id: id });
  };

  const handlePrint = () => {
    // Commit active focus edits before printing
    if (document.activeElement && document.activeElement.blur) {
      document.activeElement.blur();
    }
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handleAddAgendaRow = () => {
    const newRow = {
      id: Date.now(),
      no: day1Rows.length + 1,
      time: '15:00 - 16:00',
      duration: '1:00',
      jp: '1 JP',
      agenda: 'Sesi Diskusi, Tanya Jawab & Penutupan'
    };
    setDay1Rows([...day1Rows, newRow]);
  };

  const handleDeleteAgendaRow = () => {
    if (day1Rows.length > 1) {
      setDay1Rows(day1Rows.slice(0, -1));
    }
  };

  return (
    <AppLayout title="Surat Undangan & Rundown Printable">
      <Head title="Surat Undangan & Rundown Printable (Word Live Edit Mode)" />

      {/* PRINT & GOOGLE DOCS LIVE EDITING CSS FOR EXACT A4 SHEET */}
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
            size: ${paperSize === 'A3' ? 'A3 portrait' : 'A4 portrait'};
            margin: 12mm 15mm 12mm 15mm;
          }
          html, body {
            background: #ffffff !important;
            color: #000000 !important;
            font-family: "Times New Roman", Times, serif !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print, nav, header, footer, aside, #mobile-bottom-nav {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: none !important;
          }
          #speaker-document-sheet {
            display: block !important;
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
          th, td {
            border: 1px solid #000000 !important;
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

      <div className="space-y-6 font-sans">
        
        {/* TOOLBAR KONTROL ATAS (NO PRINT) */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 no-print">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-900 text-xs font-black uppercase">
              <Mic className="w-3.5 h-3.5 text-amber-600" />
              <span>Surat Undangan & Honorarium (Word Live Edit Mode)</span>
            </div>
            <h1 className="text-xl font-black text-blue-950 mt-1">Laporan Honorarium & Undangan Narasumber</h1>
            <p className="text-xs text-slate-500">
              Klik langsung pada teks mana saja di lembar kerja bawah untuk mengedit (Direct ContentEditable Word Style). Hasil cetakan akan **persis sesuai editan Anda**.
            </p>
          </div>

          <div className="w-full md:w-auto flex flex-wrap items-center gap-2 min-w-0">

            {/* PAPER SIZE SELECTOR */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
              <span className="px-2 text-slate-500 text-[11px]">Format:</span>
              <button
                onClick={() => setPaperSize('A4')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  paperSize === 'A4' ? 'bg-blue-900 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-200'
                }`}
              >
                Kertas A4
              </button>
              <button
                onClick={() => setPaperSize('A3')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  paperSize === 'A3' ? 'bg-blue-900 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-200'
                }`}
              >
                Kertas A3
              </button>
            </div>

            {/* EVENT SELECTOR */}
            {events.length > 0 && (
              <select
                value={selectedEventId}
                onChange={(e) => handleSelectEvent(e.target.value)}
                className="max-w-full min-w-0 px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-blue-950 outline-none"
              >
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>{ev.title}</option>
                ))}
              </select>
            )}

            <button
              onClick={handleAddAgendaRow}
              className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-900 text-xs font-bold rounded-xl border border-blue-300 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 text-blue-900" />
              <span>+ Baris Agenda</span>
            </button>

            <button
              onClick={handleDeleteAgendaRow}
              className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-300 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>Hapus Baris</span>
            </button>

            {/* PRINT BUTTON */}
            <button
              onClick={handlePrint}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold rounded-xl shadow-md flex items-center gap-2 transition-transform active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Export PDF</span>
            </button>
          </div>
        </div>

        {/* STATUS MODE INFORMASI (NO PRINT) */}
        <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl text-xs text-amber-900 flex items-center justify-between no-print shadow-xs">
          <div className="flex items-center gap-2.5">
            <Edit3 className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong className="font-extrabold">Mode Live Edit Microsoft Word Aktif:</strong> Anda dapat mengklik dan mengetik langsung pada teks di lembar kertas A4 bawah sebelum mencetak.
            </span>
          </div>
          <Link href="/admin/report-center" className="font-extrabold text-blue-900 hover:underline text-xs shrink-0 flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Report Center</span>
          </Link>
        </div>

        {/* ========================================================================= */}
        {/* MICROSOFT WORD WORKSPACE CANVAS (AUTHENTIC A4 SHEET CONTAINER)            */}
        {/* ========================================================================= */}
        <div className="bg-slate-200/90 p-3 sm:p-6 md:p-8 rounded-3xl border border-slate-300 shadow-inner flex flex-col items-center gap-8 overflow-x-auto print:p-0 print:m-0 print:bg-transparent print:border-none print:shadow-none font-serif text-black leading-normal text-[11pt]">
          
          {/* PAGE 1: SURAT UNDANGAN & HONORARIUM (EXACT A4 DIMENSIONS 210mm x 297mm) */}
          <div 
            id="speaker-document-sheet"
            className={`bg-white p-8 sm:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-300 mx-auto space-y-6 w-full print:shadow-none print:border-none print:p-0 print:m-0 ${
              paperSize === 'A3' ? 'max-w-[297mm] min-h-[420mm]' : 'max-w-[210mm] min-h-[297mm]'
            }`}
            style={{ fontFamily: '"Times New Roman", Times, serif' }}
          >
            
            {/* DOCUMENT TITLE */}
            <div className="text-center space-y-1 pb-2">
              <h2 
                className="text-[13pt] font-black uppercase tracking-wide underline decoration-2 text-black leading-snug"
                contentEditable={isEditable} 
                suppressContentEditableWarning
              >
                SURAT TUGAS & UNDANGAN NARASUMBER BIMTEK
              </h2>
            </div>

            {/* DOUBLE OFFICIAL GOVERNMENT HORIZONTAL LINE */}
            <div className="border-b-[3.5px] border-black w-full mb-2"></div>
            <div className="border-b-[1px] border-black w-full -mt-1 mb-4"></div>

            {/* HEADER METADATA (CLEAN UNBORDERED FLEX ALIGNMENT) */}
            <div className="flex flex-wrap justify-between items-start gap-3 pt-2 text-[11pt] text-black">
              <div className="space-y-1">
                <div className="flex items-start">
                  <span className="w-24 font-bold shrink-0">Nomor</span>
                  <span className="w-4 text-center font-bold shrink-0">:</span>
                  <span className="font-normal" contentEditable={isEditable} suppressContentEditableWarning>800.2/1533-PSTI</span>
                </div>
                <div className="flex items-start">
                  <span className="w-24 font-bold shrink-0">Sifat</span>
                  <span className="w-4 text-center font-bold shrink-0">:</span>
                  <span className="font-normal" contentEditable={isEditable} suppressContentEditableWarning>Biasa</span>
                </div>
                <div className="flex items-start">
                  <span className="w-24 font-bold shrink-0">Lampiran</span>
                  <span className="w-4 text-center font-bold shrink-0">:</span>
                  <span className="font-normal" contentEditable={isEditable} suppressContentEditableWarning>2 (dua) Lembar</span>
                </div>
                <div className="flex items-start">
                  <span className="w-24 font-bold shrink-0">Perihal</span>
                  <span className="w-4 text-center font-bold shrink-0">:</span>
                  <span className="font-bold text-black" contentEditable={isEditable} suppressContentEditableWarning>Permohonan Narasumber & Rekapitulasi Honorarium PPh 21</span>
                </div>
              </div>

              {/* DATE RIGHT ALIGNED (NO BOX OUTLINE) */}
              <div
                className="text-right font-normal text-[11pt] text-black shrink-0 sm:pl-4 w-full sm:w-auto"
                contentEditable={isEditable}
                suppressContentEditableWarning
              >
                Cibinong, {currentEvent?.start_date ? new Date(currentEvent.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '15 Agustus 2026'}
              </div>
            </div>

            {/* RUNDOWN AGENDA TABLE */}
            <div className="pt-4 space-y-2">
              <h3 
                className="text-[11pt] font-bold uppercase text-black" 
                contentEditable={isEditable} 
                suppressContentEditableWarning
              >
                AGENDA & RUNDOWN ACARA BIMTEK DISKOMINFO:
              </h3>
              
              <div className="overflow-x-auto">
                <table className="w-full min-w-[300px] text-left text-[10pt] border-collapse border border-black text-black">
                <thead className="bg-slate-100 text-black font-extrabold uppercase border-b border-black text-center">
                  <tr>
                    <th className="p-2 border border-black w-10">NO</th>
                    <th className="p-2 border border-black w-32">JAM (AWAL - AKHIR)</th>
                    <th className="p-2 border border-black w-16">DURASI</th>
                    <th className="p-2 border border-black w-14">JP</th>
                    <th className="p-2 border border-black">KEGIATAN & MATERI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black font-serif">
                  {day1Rows.map((row) => (
                    <tr key={row.id} className={row.isIsoma ? 'bg-slate-50' : 'bg-white'}>
                      <td className="p-2 border border-black text-center font-normal">{row.no}</td>
                      <td className="p-2 border border-black text-center font-normal" contentEditable={isEditable} suppressContentEditableWarning>{row.time}</td>
                      <td className="p-2 border border-black text-center font-normal" contentEditable={isEditable} suppressContentEditableWarning>{row.duration}</td>
                      <td className="p-2 border border-black text-center font-bold" contentEditable={isEditable} suppressContentEditableWarning>{row.jp}</td>
                      <td className="p-2 border border-black font-normal" contentEditable={isEditable} suppressContentEditableWarning>{row.agenda}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>

            {/* OFFICIAL SIGNATURE BLOCK (RIGHT-ALIGNED, NO BLACK BOX OUTLINE) */}
            <div className="flex justify-end pt-8 break-inside-avoid text-[10.5pt] text-black">
              <div className="text-center space-y-16 w-full sm:w-auto sm:min-w-[300px] max-w-full">
                <div className="space-y-0.5">
                  <p 
                    className="font-bold text-black uppercase"
                    contentEditable={isEditable} 
                    suppressContentEditableWarning
                  >
                    KEPALA DINAS KOMUNIKASI DAN INFORMATIKA
                  </p>
                  <p 
                    className="font-bold text-black uppercase text-[9.5pt]"
                    contentEditable={isEditable} 
                    suppressContentEditableWarning
                  >
                    KABUPATEN BOGOR
                  </p>
                </div>

                <div className="space-y-0.5">
                  <p 
                    className="font-bold underline text-[11pt] text-black uppercase"
                    contentEditable={isEditable} 
                    suppressContentEditableWarning
                  >
                    Drs. BAMBANG WIDODO TAWEKAL, M.Si.
                  </p>
                  <p 
                    className="text-[9.5pt] text-black"
                    contentEditable={isEditable} 
                    suppressContentEditableWarning
                  >
                    Pembina Utama Muda (IV/c) &bull; NIP. 19680512 199303 1 004
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
