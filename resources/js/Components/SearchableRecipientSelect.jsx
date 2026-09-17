import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Search, ChevronDown, CheckCircle2, X, User } from 'lucide-react';

function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < breakpoint : false
  );

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener?.('change', sync);
    return () => mq.removeEventListener?.('change', sync);
  }, [breakpoint]);

  return isMobile;
}

/**
 * Searchable dropdown for payment recipients.
 * Mobile: bottom sheet. Desktop: anchored dropdown.
 */
export default function SearchableRecipientSelect({
  recipients = [],
  value,
  onChange,
  searchUrl = null,
  type = 'pembicara',
  eventId = '',
  placeholder = 'Pilih / cari penerima...',
  required = false,
  className = '',
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [remoteResults, setRemoteResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);
  const debounceRef = useRef(null);
  const isMobile = useIsMobile();

  const selected = useMemo(() => {
    const pool = remoteResults || recipients;
    return pool.find((r) => String(r.id) === String(value))
      || recipients.find((r) => String(r.id) === String(value))
      || null;
  }, [recipients, remoteResults, value]);

  const close = () => {
    setIsOpen(false);
    setSearchTerm('');
    setRemoteResults(null);
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (isMobile) return;
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        close();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isMobile]);

  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => searchInputRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !isMobile) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen, isMobile]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen]);

  const fetchRemote = useCallback(
    (q) => {
      if (!searchUrl) return;
      setLoading(true);
      const params = new URLSearchParams({
        type,
        q: q || '',
      });
      if (eventId) params.set('event_id', eventId);

      fetch(`${searchUrl}?${params.toString()}`, {
        headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        credentials: 'same-origin',
      })
        .then((res) => res.json())
        .then((data) => {
          setRemoteResults(Array.isArray(data.recipients) ? data.recipients : []);
        })
        .catch(() => setRemoteResults([]))
        .finally(() => setLoading(false));
    },
    [searchUrl, type, eventId]
  );

  useEffect(() => {
    if (!isOpen || !searchUrl) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchRemote(searchTerm.trim());
    }, 280);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchTerm, isOpen, searchUrl, fetchRemote]);

  useEffect(() => {
    if (isOpen && searchUrl) fetchRemote(searchTerm.trim());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const filtered = useMemo(() => {
    if (searchUrl && remoteResults !== null) return remoteResults;
    const q = searchTerm.toLowerCase().trim();
    if (!q) return recipients;
    return recipients.filter((r) => {
      const hay = [r.name, r.instansi, r.nip_nik, r.email, r.golongan]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [recipients, remoteResults, searchTerm, searchUrl]);

  const handleSelect = (recOrId) => {
    if (recOrId === '' || recOrId == null) {
      onChange('', null);
    } else if (typeof recOrId === 'object') {
      onChange(String(recOrId.id), recOrId);
    } else {
      const found = filtered.find((r) => String(r.id) === String(recOrId))
        || recipients.find((r) => String(r.id) === String(recOrId));
      onChange(String(recOrId), found || null);
    }
    close();
  };

  const displayText = selected
    ? `${selected.name}${selected.instansi ? ` · ${selected.instansi}` : ''}`
    : null;

  const panelContent = (
    <>
      <div className="p-3 sm:p-2.5 bg-slate-50/95 border-b border-slate-100 shrink-0">
        {isMobile && (
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-sm font-extrabold text-slate-900">Pilih Penerima</span>
            <button
              type="button"
              onClick={close}
              className="p-2 -mr-1 rounded-xl text-slate-500 hover:bg-slate-200 hover:text-slate-800"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-3.5 sm:h-3.5 text-slate-400" />
          <input
            ref={searchInputRef}
            type="search"
            inputMode="search"
            enterKeyHint="search"
            autoComplete="off"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Ketik nama, NIP/NIK, atau instansi..."
            className="w-full pl-10 sm:pl-8.5 pr-10 py-3 sm:py-2 bg-white border border-slate-200 rounded-xl text-base sm:text-xs font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
            </button>
          )}
        </div>
        <div className="mt-2 px-0.5 flex items-center justify-between text-[11px] sm:text-[10px] text-slate-400 font-medium">
          <span>{loading ? 'Mencari...' : `${filtered.length} penerima`}</span>
          <span className="text-blue-900/60 hidden sm:inline">Ketuk untuk memilih</span>
        </div>
      </div>

      <div className="overflow-y-auto overscroll-contain divide-y divide-slate-50 py-1 flex-1 min-h-0 max-h-[min(55vh,22rem)] sm:max-h-60">
        {!loading && filtered.length === 0 ? (
          <div className="p-8 sm:p-6 text-center">
            <p className="text-sm sm:text-xs text-slate-500 font-medium">
              Penerima tidak ditemukan
              {searchTerm ? (
                <>
                  {' '}
                  untuk &quot;<span className="font-bold text-slate-800">{searchTerm}</span>&quot;
                </>
              ) : null}
              .
            </p>
          </div>
        ) : (
          filtered.map((rec) => {
            const isSelected = String(value) === String(rec.id);
            return (
              <button
                key={rec.id}
                type="button"
                onClick={() => handleSelect(isSelected && !required ? '' : rec)}
                className={`w-full text-left px-4 sm:px-3.5 py-3.5 sm:py-2.5 text-sm sm:text-xs transition-colors cursor-pointer flex items-center justify-between gap-2 min-h-[52px] sm:min-h-0
                  ${isSelected
                    ? 'bg-blue-50/80 text-blue-950 font-bold border-l-4 border-blue-900'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-blue-900 font-medium active:bg-slate-100'
                  }`}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate leading-snug">{rec.name}</span>
                  <span className="mt-1 block text-[11px] sm:text-[10px] font-normal text-slate-400 truncate">
                    {[rec.nip_nik, rec.instansi, rec.golongan].filter(Boolean).join(' · ') || '—'}
                  </span>
                </span>
                {isSelected && (
                  <CheckCircle2 className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-blue-900 shrink-0" />
                )}
              </button>
            );
          })
        )}
      </div>
    </>
  );

  return (
    <div className={`relative w-full min-w-0 max-w-full ${className}`} ref={dropdownRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full min-h-[44px] sm:min-h-0 px-3 py-2.5 bg-slate-50 border rounded-xl text-sm sm:text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none transition-all cursor-pointer flex items-center justify-between gap-2 text-left
          ${isOpen ? 'border-blue-900 ring-2 ring-blue-900/10 bg-white' : 'border-slate-300 hover:border-slate-400'}
          ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        <span className={`truncate min-w-0 flex items-center gap-1.5 ${!displayText ? 'text-slate-400 font-normal' : 'text-slate-900'}`}>
          {!displayText && <User className="w-4 h-4 sm:w-3.5 sm:h-3.5 shrink-0 text-slate-400" />}
          <span className="truncate">{displayText || placeholder}</span>
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {value && !required && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                handleSelect('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.stopPropagation();
                  handleSelect('');
                }
              }}
              className="p-1.5 sm:p-0.5 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600"
              title="Hapus pilihan"
            >
              <X className="w-4 h-4 sm:w-3 sm:h-3" />
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 sm:w-3.5 sm:h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-900' : ''}`}
          />
        </div>
      </button>

      {isOpen && isMobile && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]"
            aria-label="Tutup overlay"
            onClick={close}
          />
          <div className="relative z-10 flex flex-col w-full max-h-[85vh] bg-white rounded-t-3xl border border-slate-200 shadow-2xl overflow-hidden">
            <div className="flex justify-center pt-2 pb-1">
              <span className="w-10 h-1 rounded-full bg-slate-300" />
            </div>
            {panelContent}
          </div>
        </div>
      )}

      {isOpen && !isMobile && (
        <div className="absolute z-50 mt-1 left-0 right-0 w-full max-w-full bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
          {panelContent}
        </div>
      )}
    </div>
  );
}
