import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import SearchableEventSelect from '@/Components/SearchableEventSelect';
import {
  CreditCard,
  Plus,
  Calculator,
  CheckCircle,
  Building,
  FileSpreadsheet,
  DollarSign,
  Trash2,
  Calendar,
  User,
  ShieldCheck
} from 'lucide-react';

export default function PaymentIndex({ payments, events, recipients, taxParameters, filters }) {
  const [type, setType] = useState(filters.type || 'pembicara');
  const [eventId, setEventId] = useState(filters.event_id || '');
  const [modalOpen, setModalOpen] = useState(false);

  const { data, setData, post, processing, errors, reset } = useForm({
    event_id: events[0]?.id || '',
    user_id: '',
    recipient_type: type,
    component_type: type === 'pembicara' ? 'honorarium' : 'transport',
    volume: 1,
    unit: type === 'pembicara' ? 'Jam Pelatihan' : 'Kegiatan',
    unit_price: 300000,
    tax_rate_percent: 5,
    notes: '',
  });

  const handleFilter = (newType, newEventId) => {
    setType(newType);
    setEventId(newEventId);
    router.get('/admin/payments', {
      type: newType,
      event_id: newEventId,
    }, { preserveState: true });
  };

  const handleRecipientChange = (userId) => {
    setData('user_id', userId);
    const selectedUser = recipients.find(r => r.id === parseInt(userId));
    
    // Auto calculate tax rate based on recipient NPWP or Golongan if speaker
    if (selectedUser) {
      if (type === 'pembicara') {
        const gol = selectedUser.speakerProfileDetail?.golongan || '';
        if (gol.includes('IV')) {
          setData('tax_rate_percent', 15);
        } else if (gol.includes('III')) {
          setData('tax_rate_percent', 5);
        } else {
          setData('tax_rate_percent', 2.5);
        }
      } else {
        setData('tax_rate_percent', 0); // Participants transport generally no tax
      }
    }
  };

  const calculateAmounts = () => {
    const gross = (parseFloat(data.volume) || 0) * (parseFloat(data.unit_price) || 0);
    const taxRate = parseFloat(data.tax_rate_percent) || 0;
    const taxAmount = (gross * taxRate) / 100;
    const net = gross - taxAmount;
    return { gross, taxAmount, net };
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    post('/admin/payments/store', {
      onSuccess: () => {
        setModalOpen(false);
        reset();
      },
    });
  };

  const handleStatusUpdate = (paymentId, newStatus) => {
    router.post(`/admin/payments/${paymentId}/status`, {
      payment_status: newStatus,
    });
  };

  const handleDelete = (paymentId) => {
    if (confirm('Apakah Anda yakin ingin menghapus rincian pembayaran ini?')) {
      router.delete(`/admin/payments/${paymentId}`);
    }
  };

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(number || 0);
  };

  const { gross, taxAmount, net } = calculateAmounts();

  return (
    <AppLayout title="Administrasi Pembayaran & Honorarium">
      <Head title="Administrasi Pembayaran & Honorarium - SIM-BIMTEK" />

      <div className="space-y-6">
        {/* HEADER — flat, no gradient */}
        <PageHeader
          eyebrow="Modul Keuangan Kedinasan Diskominfo"
          eyebrowIcon={Calculator}
          title="Administrasi Honorarium & Uang Jalan"
          description="Pengelolaan rincian honorarium narasumber (perhitungan otomatis Bruto & PPh 21) dan biaya transport / uang jalan peserta secara terintegrasi langsung dengan data rekening bank terverifikasi."
        />

        {/* TOOLBAR CONTROLS */}
        <div className="bg-white p-4 md:p-6 rounded-lg border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">

          {/* RECIPIENT TYPE TABS */}
          <div className="flex flex-wrap items-center gap-2 p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => handleFilter('pembicara', eventId)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                type === 'pembicara' ? 'bg-blue-900 text-white' : 'text-slate-600 hover:text-blue-900'
              }`}
            >
              Honorarium Narasumber
            </button>
            <button
              onClick={() => handleFilter('peserta', eventId)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                type === 'peserta' ? 'bg-blue-900 text-white' : 'text-slate-600 hover:text-blue-900'
              }`}
            >
              Uang Jalan / Transport Peserta
            </button>
            <a
              href={`/admin/reports/honorarium?event_id=${eventId}`}
              className="ml-2 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-900 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Cetak Tanda Terima Honor</span>
            </a>
          </div>

          {/* EVENT FILTER & ADD BUTTON */}
          <div className="flex flex-wrap items-center gap-3 min-w-0">
            <SearchableEventSelect
              events={events}
              value={eventId}
              onChange={(id) => handleFilter(type, id)}
              allowEmpty
              emptyLabel="Semua Kegiatan BIMTEK"
              className="w-full sm:w-80 max-w-full min-w-0"
            />

            <button
              onClick={() => {
                setData('recipient_type', type);
                setData('component_type', type === 'pembicara' ? 'honorarium' : 'transport');
                setModalOpen(true);
              }}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Rincian Pembayaran</span>
            </button>
          </div>

        </div>

        {/* PAYMENTS TABLE */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-900 font-extrabold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-4">Penerima & Instansi</th>
                  <th className="p-4">Komponen & Volume</th>
                  <th className="p-4">Bruto</th>
                  <th className="p-4">PPh 21</th>
                  <th className="p-4">Jumlah Diterima (Netto)</th>
                  <th className="p-4">Rekening BJB / Bank</th>
                  <th className="p-4">Status Pencairan</th>
                  <th className="p-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.data && payments.data.length > 0 ? (
                  payments.data.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      
                      <td className="p-4 space-y-0.5">
                        <strong className="block text-slate-900 font-bold">{item.user?.name || 'User'}</strong>
                        <span className="text-[11px] text-slate-500 block">{item.event?.title}</span>
                      </td>

                      <td className="p-4 space-y-0.5">
                        <span className="font-extrabold text-blue-900 uppercase text-[11px] block">{item.component_type}</span>
                        <span className="text-slate-600 block">{item.volume} {item.unit} @ {formatRupiah(item.unit_price)}</span>
                      </td>

                      <td className="p-4 font-mono font-semibold text-slate-800">
                        {formatRupiah(item.gross_amount)}
                      </td>

                      <td className="p-4 font-mono text-rose-600 font-semibold">
                        {formatRupiah(item.tax_amount)} ({item.tax_rate_percent}%)
                      </td>

                      <td className="p-4 font-mono font-black text-emerald-700 text-sm">
                        {formatRupiah(item.net_amount)}
                      </td>

                      <td className="p-4 space-y-0.5">
                        <span className="font-bold text-slate-900 block">{item.bank_name || '-'}</span>
                        <span className="font-mono text-slate-600 block">{item.account_number || '-'}</span>
                        <span className="text-[10px] text-slate-400">a.n. {item.account_name || '-'}</span>
                      </td>

                      <td className="p-4">
                        <select
                          value={item.payment_status}
                          onChange={(e) => handleStatusUpdate(item.id, e.target.value)}
                          className={`text-xs font-extrabold px-2.5 py-1 rounded-lg border outline-none cursor-pointer ${
                            item.payment_status === 'paid' 
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                              : item.payment_status === 'verified'
                              ? 'bg-blue-100 text-blue-800 border-blue-300'
                              : 'bg-amber-100 text-amber-800 border-amber-300'
                          }`}
                        >
                          <option value="pending">Pending</option>
                          <option value="verified">Terverifikasi</option>
                          <option value="processed">Dalam Proses</option>
                          <option value="paid">Sudah Dicairkan (PAID)</option>
                        </select>
                      </td>

                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Hapus Rincian Pembayaran"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>

                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="p-8 text-center text-slate-400 text-xs">
                      Belum ada catatan rincian pembayaran untuk kategori ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL INPUT RINCIAN PEMBAYARAN */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-6 shadow-2xl border border-slate-200 my-auto">
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">Input Rincian Pembayaran Baru</h3>
                  <p className="text-xs text-slate-500">Kategori: {type.toUpperCase()}</p>
                </div>
                <button onClick={() => setModalOpen(false)} aria-label="Tutup dialog" className="p-2 -m-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 font-bold text-base transition-colors">✕</button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                
                {/* SELECT EVENT */}
                <div>
                  <label className="font-bold text-slate-900 block mb-1">Kegiatan BIMTEK:</label>
                  <SearchableEventSelect
                    events={events}
                    value={data.event_id}
                    onChange={(id) => setData('event_id', id)}
                    required
                    placeholder="Cari / pilih kegiatan BIMTEK..."
                  />
                </div>

                {/* SELECT RECIPIENT */}
                <div>
                  <label className="font-bold text-slate-900 block mb-1">Penerima ({type === 'pembicara' ? 'Narasumber' : 'Peserta'}):</label>
                  <select
                    value={data.user_id}
                    onChange={(e) => handleRecipientChange(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-900"
                    required
                  >
                    <option value="">-- Pilih Penerima --</option>
                    {recipients.map((rec) => (
                      <option key={rec.id} value={rec.id}>{rec.name} ({rec.instansi || rec.nip_nik})</option>
                    ))}
                  </select>
                </div>

                {/* COMPONENT TYPE & VOLUME */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-900 block mb-1">Jenis Komponen:</label>
                    <select
                      value={data.component_type}
                      onChange={(e) => setData('component_type', e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-900"
                    >
                      <option value="honorarium">Honorarium</option>
                      <option value="uang_jalan">Uang Jalan</option>
                      <option value="transport">Transport Lokal</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-900 block mb-1">Volume & Satuan:</label>
                    <div className="flex gap-2 min-w-0">
                      <input
                        type="number"
                        step="0.5"
                        value={data.volume}
                        onChange={(e) => setData('volume', e.target.value)}
                        className="w-20 shrink-0 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-900"
                        required
                      />
                      <input
                        type="text"
                        value={data.unit}
                        onChange={(e) => setData('unit', e.target.value)}
                        placeholder="Jam / Sesi / Hari"
                        className="flex-1 min-w-0 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-900"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* UNIT PRICE & TAX RATE */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-900 block mb-1">Harga Satuan (Rp):</label>
                    <input
                      type="number"
                      value={data.unit_price}
                      onChange={(e) => setData('unit_price', e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-900 font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-900 block mb-1">Tarif PPh 21 (%):</label>
                    <input
                      type="number"
                      step="0.1"
                      value={data.tax_rate_percent}
                      onChange={(e) => setData('tax_rate_percent', e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-900 font-mono"
                    />
                  </div>
                </div>

                {/* CALCULATED PREVIEW BOX */}
                <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-2">
                  <div className="flex justify-between items-center text-slate-300">
                    <span>Total Bruto:</span>
                    <span className="font-mono font-bold">{formatRupiah(gross)}</span>
                  </div>
                  <div className="flex justify-between items-center text-rose-300">
                    <span>Potongan PPh 21 ({data.tax_rate_percent}%):</span>
                    <span className="font-mono font-bold">- {formatRupiah(taxAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center text-emerald-400 font-black text-sm pt-2 border-t border-slate-800">
                    <span>Jumlah Diterima (Netto):</span>
                    <span className="font-mono text-base">{formatRupiah(net)}</span>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-900 block mb-1">Catatan Tambahan:</label>
                  <input
                    type="text"
                    value={data.notes}
                    onChange={(e) => setData('notes', e.target.value)}
                    placeholder="Keterangan pencairan..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-900"
                  />
                </div>

                {/* SUBMIT BUTTON */}
                <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={processing}
                    className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold rounded-xl shadow-xs"
                  >
                    Simpan Rincian Pembayaran
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
