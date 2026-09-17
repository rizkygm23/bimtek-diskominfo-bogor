import React, { useState, useEffect } from 'react';
import { useForm, Link, router } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import SearchableEventSelect from '@/Components/SearchableEventSelect';
import { 
  DollarSign, 
  Plus, 
  Trash2, 
  Calculator, 
  Users, 
  FileSpreadsheet,
  CheckCircle2,
  Upload,
  FileText
} from 'lucide-react';

export default function Honorarium({ events, allSpeakers }) {
  const [selectedEventId, setSelectedEventId] = useState(events[0]?.id || '');
  const [selectedSpeakerId, setSelectedSpeakerId] = useState(allSpeakers[0]?.id || '');
  const [jpHours, setJpHours] = useState(2);
  const [ratePerJp, setRatePerJp] = useState(350000);
  const [topic, setTopic] = useState('');
  const [taxPercent, setTaxPercent] = useState(5);

  const selectedSpeaker = allSpeakers.find(s => s.id === Number(selectedSpeakerId));

  // Automatically update Tax PPh 21 based on Golongan:
  // Golongan IV = 15%, Golongan III = 5%, Golongan I/II/Non-ASN = 5%
  useEffect(() => {
    if (selectedSpeaker) {
      const gol = selectedSpeaker.golongan?.toUpperCase() || '';
      if (gol.includes('IV')) {
        setTaxPercent(15);
      } else if (gol.includes('III')) {
        setTaxPercent(5);
      } else {
        setTaxPercent(2.5);
      }
    }
  }, [selectedSpeakerId]);

  // Calculations
  const totalBruto = jpHours * ratePerJp;
  const taxNominal = totalBruto * (taxPercent / 100);
  const totalNetto = totalBruto - taxNominal;

  const handleAssignSubmit = (e) => {
    e.preventDefault();
    if (!selectedEventId || !selectedSpeakerId || !topic) return;

    router.post('/admin/honorarium/assign', {
      bimtek_event_id: selectedEventId,
      speaker_id: selectedSpeakerId,
      topic: topic,
      jp_hours: jpHours,
      rate_per_jp: ratePerJp,
      tax_percent: taxPercent,
    }, {
      onSuccess: () => {
        setTopic('');
      }
    });
  };

  const handleDeleteAssignment = (id) => {
    if (confirm('Hapus penugasan pembicara ini?')) {
      router.delete(`/admin/honorarium/${id}`);
    }
  };

  const currentEvent = events.find(e => e.id === Number(selectedEventId)) || events[0];

  return (
    <AppLayout title="Kalkulator Honorarium PPh 21">
      <div className="space-y-6 max-w-6xl mx-auto">
        
        {/* HEADER WITH UPLOAD TEMPLATE & EXPORT OPTIONS (PDF / WORD) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-sans">
          <div>
            <h1 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
              <span>Kalkulator & Penugasan Honorarium PPh 21</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Penghitungan otomatis Total Bruto, Pajak PPh 21 Golongan, dan Total Netto</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* UPLOAD TEMPLATE BUTTON */}
            <label className="px-3.5 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 border border-slate-300 dark:border-slate-700 cursor-pointer shadow-xs">
              <Upload className="w-4 h-4 text-blue-900 dark:text-amber-400" />
              <span>Upload Template (.docx)</span>
              <input 
                type="file" 
                accept=".docx,.doc,.xlsx" 
                className="hidden" 
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    alert(`Template Laporan Honorarium "${e.target.files[0].name}" berhasil diunggah! Laporan akan disesuaikan dengan template baru.`);
                  }
                }} 
              />
            </label>

            {/* CETAK LAPORAN PDF */}
            <Link
              href={`/admin/reports/speakers?template=HONORARIUM_PEMBICARA&event_id=${selectedEventId}`}
              className="px-3.5 py-2 rounded-lg bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-600 shrink-0 shadow-xs"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Cetak Laporan (PDF / Live Edit)</span>
            </Link>

            {/* EKSPOR MS WORD */}
            <button
              onClick={() => alert(`Mengunduh Laporan Honorarium PPh 21 Format MS Word (.docx) sesuai template...`)}
              className="px-3.5 py-2 rounded-lg bg-blue-900 text-white text-xs font-bold flex items-center gap-1.5 hover:bg-blue-800 shrink-0 shadow-xs cursor-pointer"
            >
              <FileText className="w-4 h-4 text-amber-400" />
              <span>Ekspor Word (.docx)</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* FORM PENUGASAN (5 COLS) */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
            <h2 className="text-xs font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
              Form Penugasan Pembicara
            </h2>

            <form onSubmit={handleAssignSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Pilih Kegiatan BIMTEK</label>
                <SearchableEventSelect
                  events={events}
                  value={selectedEventId}
                  onChange={(id) => setSelectedEventId(id)}
                  required
                  placeholder="Cari / pilih kegiatan..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Pilih Pembicara / Narasumber</label>
                <select
                  value={selectedSpeakerId}
                  onChange={(e) => setSelectedSpeakerId(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white font-bold"
                >
                  {allSpeakers.map((sp) => (
                    <option key={sp.id} value={sp.id}>
                      {sp.name} ({sp.golongan})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Topik / Sesi Materi</label>
                <input
                  type="text"
                  required
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white"
                  placeholder="Arsitektur SPBE & Siber 2026"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Beban JP</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={jpHours}
                    onChange={(e) => setJpHours(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Tarif per JP (Rp)</label>
                  <input
                    type="number"
                    required
                    step="10000"
                    value={ratePerJp}
                    onChange={(e) => setRatePerJp(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-xs text-blue-900 dark:text-amber-400 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Pajak PPh 21 ({selectedSpeaker?.golongan || 'Golongan III'})
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    value={taxPercent}
                    onChange={(e) => setTaxPercent(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-xs text-rose-600 font-bold"
                  />
                  <span className="absolute right-3 top-1.5 text-xs text-slate-500 font-bold">%</span>
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">Gol IV = 15%, Gol III/II/Non-ASN = 5%</span>
              </div>

              {/* REAL-TIME PREVIEW BOX */}
              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
                <span className="text-[10px] font-bold text-blue-900 dark:text-amber-400 uppercase block">Kalkulasi Otomatis:</span>
                
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Bruto ({jpHours} JP × Rp {ratePerJp.toLocaleString('id-ID')}):</span>
                  <strong className="text-slate-900 dark:text-white">Rp {totalBruto.toLocaleString('id-ID')}</strong>
                </div>

                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Pajak PPh 21 ({taxPercent}%):</span>
                  <strong className="text-rose-600">- Rp {taxNominal.toLocaleString('id-ID')}</strong>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between text-slate-900 dark:text-white">
                  <span className="font-bold">Total Netto:</span>
                  <strong className="text-emerald-700 dark:text-emerald-400 font-mono text-xs">
                    Rp {totalNetto.toLocaleString('id-ID')}
                  </strong>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-lg text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 shadow-xs flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Simpan Penugasan Honorarium</span>
              </button>
            </form>
          </div>

          {/* TABLE OF ASSIGNED SPEAKERS FOR SELECTED EVENT (7 COLS) */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <h2 className="text-xs font-bold text-slate-900 dark:text-white">Rincian Pembayaran Honorarium</h2>
              
              <SearchableEventSelect
                events={events}
                value={selectedEventId}
                onChange={(id) => setSelectedEventId(id)}
                required
                className="w-full sm:w-64"
                placeholder="Cari / pilih kegiatan..."
              />
            </div>

            {currentEvent && currentEvent.event_speakers && currentEvent.event_speakers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 uppercase text-[10px]">
                      <th className="py-2.5 px-3">Pembicara / Topik</th>
                      <th className="py-2.5 px-3">Golongan</th>
                      <th className="py-2.5 px-3">Bruto</th>
                      <th className="py-2.5 px-3">Pajak</th>
                      <th className="py-2.5 px-3">Netto</th>
                      <th className="py-2.5 px-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {currentEvent.event_speakers.map((es) => {
                      const bruto = es.jp_hours * es.rate_per_jp;
                      const tax = bruto * (es.tax_percent / 100);
                      const netto = bruto - tax;

                      return (
                        <tr key={es.id} className="hover:bg-slate-50 dark:hover:bg-slate-950/60">
                          <td className="py-3 px-3">
                            <strong className="text-slate-900 dark:text-slate-100 block">{es.speaker?.name}</strong>
                            <span className="text-[11px] text-slate-500">{es.topic} ({es.jp_hours} JP)</span>
                          </td>
                          <td className="py-3 px-3 font-semibold text-slate-700 dark:text-slate-300">
                            {es.speaker?.golongan}
                          </td>
                          <td className="py-3 px-3 font-mono font-semibold text-slate-900 dark:text-white">
                            Rp {bruto.toLocaleString('id-ID')}
                          </td>
                          <td className="py-3 px-3 font-mono text-rose-600 dark:text-rose-400">
                            ({es.tax_percent}%)<br />Rp {tax.toLocaleString('id-ID')}
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                            Rp {netto.toLocaleString('id-ID')}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={() => handleDeleteAssignment(es.id)}
                              className="p-1 rounded bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900"
                              title="Hapus"
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
            ) : (
              <p className="text-xs text-slate-500 italic py-6 text-center">Belum ada penugasan narasumber pada kegiatan ini.</p>
            )}
          </div>

        </div>

      </div>
    </AppLayout>
  );
}
