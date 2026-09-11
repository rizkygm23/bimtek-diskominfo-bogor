import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Percent, Plus, Settings, Edit, CheckCircle, ShieldCheck } from 'lucide-react';

export default function TaxParameters({ taxParameters }) {
  const [editingItem, setEditingItem] = useState(null);

  const { data, setData, post, put, processing, errors, reset } = useForm({
    category_name: '',
    has_npwp: true,
    tax_rate_percent: 5,
    description: '',
  });

  const handleEdit = (item) => {
    setEditingItem(item);
    setData({
      category_name: item.category_name,
      has_npwp: item.has_npwp,
      tax_rate_percent: item.tax_rate_percent,
      description: item.description || '',
    });
  };

  const handleCancel = () => {
    setEditingItem(null);
    reset();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingItem) {
      put(`/admin/tax-settings/${editingItem.id}`, {
        onSuccess: () => handleCancel(),
      });
    } else {
      post('/admin/tax-settings/store', {
        onSuccess: () => reset(),
      });
    }
  };

  return (
    <AppLayout title="Pengaturan Parameter Pajak PPh 21">
      <Head title="Pengaturan Tarif PPh 21 - SIM-BIMTEK" />

      <div className="space-y-6">
        {/* HEADER */}
        {/* TODO: flatten hero — see PageHeader.jsx */}
        <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-900 text-white rounded-3xl p-6 md:p-8 shadow-xl">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-400/20 text-amber-300 rounded-full text-xs font-bold border border-amber-400/30">
              <Percent className="w-4 h-4" />
              <span>Pengaturan Fleksibilitas Pajak Kedinasan</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Konfigurasi Parameter Tarif PPh 21</h1>
            <p className="text-blue-100 text-xs md:text-sm max-w-3xl">
              Atur persentase pemotongan PPh 21 secara fleksibel tanpa hardcode. Sesuaikan tarif berdasarkan status kepemilikan NPWP, Golongan ASN, atau regulasi perundang-undangan terbaru.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* FORM INPUT / EDIT */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 h-fit">
            <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Settings className="w-4 h-4 text-blue-900" />
              <span>{editingItem ? 'Edit Parameter Tarif' : 'Tambah Parameter Pajak Baru'}</span>
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-900 block mb-1">Nama Kategori / Golongan:</label>
                <input
                  type="text"
                  value={data.category_name}
                  onChange={(e) => setData('category_name', e.target.value)}
                  placeholder="Contoh: Non-ASN (Memiliki NPWP)"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-900"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-900 block mb-1">Status Kepemilikan NPWP:</label>
                <select
                  value={data.has_npwp ? '1' : '0'}
                  onChange={(e) => setData('has_npwp', e.target.value === '1')}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-900"
                >
                  <option value="1">Memiliki NPWP Aktif</option>
                  <option value="0">Tidak Memiliki NPWP</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-900 block mb-1">Tarif Pajak (%):</label>
                <input
                  type="number"
                  step="0.01"
                  value={data.tax_rate_percent}
                  onChange={(e) => setData('tax_rate_percent', e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold outline-none focus:border-blue-900"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-900 block mb-1">Deskripsi / Keterangan Regulasi:</label>
                <textarea
                  value={data.description}
                  onChange={(e) => setData('description', e.target.value)}
                  placeholder="Landasan hukum / catatan tarif..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-900 h-20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                {editingItem && (
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                  >
                    Batal
                  </button>
                )}
                <button
                  type="submit"
                  disabled={processing}
                  className="px-5 py-2 bg-blue-900 hover:bg-blue-950 text-white font-extrabold rounded-xl shadow-xs"
                >
                  {editingItem ? 'Simpan Perubahan' : 'Tambah Parameter'}
                </button>
              </div>
            </form>
          </div>

          {/* PARAMETERS LIST TABLE */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Tabel Parameter Tarif Pajak Aktif</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-100 text-slate-900 font-extrabold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-4">Kategori Pajak</th>
                    <th className="p-4">NPWP</th>
                    <th className="p-4">Tarif PPh 21</th>
                    <th className="p-4">Deskripsi</th>
                    <th className="p-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {taxParameters.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 font-bold text-slate-900">{item.category_name}</td>
                      <td className="p-4">
                        {item.has_npwp ? (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md">Ada NPWP</span>
                        ) : (
                          <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-bold rounded-md">Tanpa NPWP</span>
                        )}
                      </td>
                      <td className="p-4 font-mono font-black text-blue-900 text-sm">{item.tax_rate_percent}%</td>
                      <td className="p-4 text-slate-500">{item.description || '-'}</td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleEdit(item)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg transition-colors inline-flex items-center gap-1"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>
    </AppLayout>
  );
}
