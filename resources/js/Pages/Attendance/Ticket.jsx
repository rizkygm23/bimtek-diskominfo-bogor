import React from 'react';
import { Link } from '@inertiajs/react';
import { QRCodeSVG } from 'qrcode.react';
import AppLayout from '../../Layouts/AppLayout';
import { 
  QrCode, 
  User, 
  Building, 
  MapPin, 
  Clock, 
  Printer, 
  ArrowLeft,
  CheckCircle,
  Camera,
  AlertCircle,
  Lock
} from 'lucide-react';

export default function Ticket({ registration }) {
  const { event, user, answers, attendances } = registration;

  // Check if participant has completed Hari-H Attendance Scan
  const isPresentHariH = attendances?.some(att =>
    att.attendance_type === 'absensi_hari_h' || att.attendance_type === 'absensi_manual_admin'
  ) || registration.status === 'verified_present';

  const handlePrint = () => {
    window.print();
  };

  return (
    <AppLayout title={`Tiket Presensi QR - ${registration.registration_code}`}>
      <div className="max-w-2xl mx-auto space-y-6">
        
        <div className="flex items-center justify-between print:hidden">
          <Link href="/events" className="inline-flex items-center gap-1.5 text-xs text-blue-900 font-bold hover:underline">
            <ArrowLeft className="w-4 h-4" /> Kembali ke Katalog BIMTEK
          </Link>

          {isPresentHariH && (
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-blue-900 text-white text-xs font-bold flex items-center gap-2 hover:bg-blue-800 shadow-md"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>Cetak Tiket PDF</span>
            </button>
          )}
        </div>

        {/* TIKET DIGITAL DISKOMINFO CARD */}
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 md:p-8 shadow-xl space-y-6 relative overflow-hidden print:bg-white print:text-black print:border-black">
          
          {/* HEADER BRANDING — stack di layar kecil agar teks tidak saling menimpa */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4 print:border-gray-300">
            <div className="flex items-center gap-3 min-w-0">
              <img src="/images/logo_diskominfo_bogorkab.png" alt="Diskominfo" className="h-10 object-contain shrink-0" />
              <div className="min-w-0">
                <h1 className="font-black text-sm text-slate-900">TIKET PRESENSI DIGITAL</h1>
                <p className="text-[10px] text-blue-900 font-extrabold tracking-widest uppercase">DISKOMINFO KABUPATEN BOGOR</p>
              </div>
            </div>

            <div className="sm:text-right shrink-0">
              <span className="font-mono font-extrabold text-blue-900 text-sm print:text-black block">
                {registration.registration_code}
              </span>
              <div className={`text-[10px] font-extrabold uppercase block ${isPresentHariH ? 'text-emerald-600' : 'text-amber-600'}`}>
                {isPresentHariH ? '✓ TERVERIFIKASI FIKS HADIR' : '⚠ TERDAFTAR (MENUNGGU PRESENSI HARI-H)'}
              </div>
            </div>
          </div>

          {/* CONDITIONAL QR CODE RENDERER (ONLY ACTIVE AFTER HARI-H CAMERA SCAN) */}
          {isPresentHariH ? (
            <div className="flex flex-col items-center justify-center p-6 bg-emerald-50 rounded-2xl border border-emerald-200 print:bg-white print:border-gray-300">
              <div className="p-4 bg-white rounded-2xl shadow-md border border-slate-200">
                <QRCodeSVG 
                  value={registration.registration_code} 
                  size={180} 
                  level="H" 
                  includeMargin={true}
                />
              </div>
              <div className="mt-3 text-center space-y-1">
                <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-800 uppercase bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>TIKET QR RESMI FIKS AKTIF</span>
                </span>
                <p className="text-[11px] text-slate-600 block">
                  Presensi Hari-H telah terverifikasi sukses dalam database Admin.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-6 bg-slate-50 rounded-2xl border-2 border-dashed border-amber-300 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-inner">
                <Lock className="w-7 h-7" />
              </div>

              <div className="space-y-1 max-w-md mx-auto">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  QR Code Tiket Belum Aktif
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Sesuai dengan ketentuan kegiatan, <strong>QR Code Tiket Presensi Resmi baru akan AKTIF & MUNCUL pada Hari-H Kegiatan</strong> setelah Anda melakukan Absensi Scan Kamera pada QR Code Kegiatan Admin.
                </p>
              </div>

              <Link
                href="/attendance/scan"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-extrabold shadow-md transition-all active:scale-95"
              >
                <Camera className="w-4 h-4 text-amber-400" />
                <span>Buka Kamera Absensi Scan Hari-H Sekarang &rarr;</span>
              </Link>
            </div>
          )}

          {/* EVENT & PARTICIPANT INFO */}
          <div className="space-y-4 text-xs">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 print:bg-gray-50 print:border-gray-200">
              <span className="text-[10px] font-extrabold text-blue-900 uppercase tracking-wider block">Detail Kegiatan BIMTEK:</span>
              <h2 className="font-extrabold text-sm text-slate-900 print:text-black">{event.title}</h2>
              <div className="flex items-center gap-2 text-slate-600 print:text-gray-700 font-medium">
                <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>{new Date(event.start_date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 print:text-gray-700 font-medium">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{event.location}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-slate-700 print:text-black">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold block">Nama Peserta:</span>
                <strong className="text-slate-900 print:text-black">{user.name}</strong>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold block">NIK KTP Peserta:</span>
                <strong className="text-slate-900 font-mono print:text-black">{user.participant_profile?.nik || user.nip_nik || '-'}</strong>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold block">Email:</span>
                <strong className="text-slate-900 truncate block print:text-black">{user.email}</strong>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold block">No. WhatsApp / HP:</span>
                <strong className="text-slate-900 print:text-black">{user.no_hp || user.participant_profile?.no_hp || '-'}</strong>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold block">Instansi / Unit Kerja:</span>
                <strong className="text-slate-900 print:text-black">{user.instansi || 'Masyarakat Umum'}</strong>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold block">Rekening Pencairan:</span>
                <strong className="text-emerald-800 font-mono text-[11px] block print:text-black">
                  {user.participant_profile?.bank_name ? `${user.participant_profile.bank_name} (${user.participant_profile.account_number})` : 'Tercatat'}
                </strong>
              </div>
            </div>
          </div>

          {/* RECORDED ATTENDANCE TIMESTAMPS */}
          <div className="pt-3 border-t border-slate-100 text-xs space-y-2">
            <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Status & Log Kehadiran System Admin:</span>
            <div className="space-y-1.5">
              {attendances && attendances.length > 0 ? (
                attendances.map((att) => (
                  <div key={att.id} className="flex items-center justify-between text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span className="uppercase">{att.attendance_type.replace('_', ' ')}</span>
                    </div>
                    <span className="text-slate-500 font-mono">
                      {new Date(att.checked_in_at).toLocaleString('id-ID')}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] font-bold">
                  Belum ada catatan presensi Hari-H. Silakan lakukan Scan Kamera Absensi di lokasi kegiatan.
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </AppLayout>
  );
}
