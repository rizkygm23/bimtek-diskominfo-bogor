import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * ErrorBoundary — tangkap error render React supaya tidak blank putih.
 *
 * Sebelumnya app TIDAK punya ErrorBoundary. Saat komponen page throw saat
 * render (akses properti undefined, relasi null, format tanggal invalid, dll),
 * React unmount SELURUH tree root → layar blank putih tanpa pesan. User tidak
 * tahu apa yang error, developer juga tidak dapat stack trace di UI.
 *
 * ErrorBoundary ini menangkap error render dan menampilkan fallback flat:
 *  - Pesan error singkat + stack trace (collapsible) untuk debugging.
 *  - Tombol "Muat Ulang" untuk refresh halaman.
 *  - Tetap render dalam shell kosong (tidak crash seluruh app).
 *
 * Catatan: ErrorBoundary HANYA tangkap error dari child render tree. Error
 * pada event handler (onClick, onSubmit) tetap tidak tertangkap (by design
 * React) — itu tidak menyebabkan unmount, jadi tidak blank putih.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Simpan errorInfo untuk ditampilkan (debug). Log ke console juga.
    this.setState({ errorInfo });
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary] Render crash:', error, errorInfo);
  }

  handleReload = () => {
    // Hard reload halaman saat ini (bukan Inertia navigate) untuk reset state.
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const { error, errorInfo } = this.state;
    const stack = errorInfo?.componentStack || error?.stack || '';

    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="w-full max-w-lg bg-white border border-rose-200 rounded-lg p-6 space-y-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-slate-900">
                Halaman tidak dapat ditampilkan
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Terjadi kesalahan teknis saat merender halaman ini. Data Anda
                tidak terhapus. Coba muat ulang halaman, atau jika masalah
                berlanjut hubungi Admin.
              </p>
            </div>
          </div>

          <details className="text-xs">
            <summary className="cursor-pointer font-semibold text-slate-700 hover:text-slate-900">
              Detail error teknis (untuk debugging)
            </summary>
            <pre className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded text-[10px] text-rose-700 overflow-x-auto whitespace-pre-wrap break-all">
              {String(error?.message || error || '')}
              {'\n\n'}
              {stack}
            </pre>
          </details>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={this.handleReload}
              className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Muat Ulang Halaman</span>
            </button>
          </div>
        </div>
      </div>
    );
  }
}
