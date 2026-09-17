import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, CheckCircle2, X, Calendar } from 'lucide-react';

function formatEventDate(dateStr) {
  if (!dateStr) return null;
  try {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return null;
  }
}

function eventLabel(ev) {
  if (!ev) return '';
  const date = formatEventDate(ev.start_date);
  return date ? `${ev.title} · ${date}` : ev.title;
}

/**
 * Searchable dropdown for BIMTEK events — replaces native <select>
 * when the event list grows large over years of use.
 */
export default function SearchableEventSelect({
  events = [],
  value,
  onChange,
  allowEmpty = false,
  emptyLabel = 'Semua Kegiatan BIMTEK',
  placeholder = 'Pilih / cari kegiatan BIMTEK...',
  required = false,
  className = '',
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  const selected = useMemo(
    () => events.find((ev) => String(ev.id) === String(value)) || null,
    [events, value]
  );

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return events;
    return events.filter((ev) => {
      const hay = [
        ev.title,
        ev.location,
        ev.status,
        formatEventDate(ev.start_date),
        String(ev.id),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [events, searchTerm]);

  const handleSelect = (id) => {
    onChange(id === '' || id === null || id === undefined ? '' : String(id));
    setIsOpen(false);
    setSearchTerm('');
  };

  const displayText = selected
    ? eventLabel(selected)
    : allowEmpty && (value === '' || value === null || value === undefined)
      ? emptyLabel
      : null;

  const canClear = allowEmpty && !required && value !== '' && value !== null && value !== undefined;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none transition-all cursor-pointer flex items-center justify-between gap-2 text-left
          ${isOpen ? 'border-blue-900 ring-2 ring-blue-900/10 bg-white' : 'border-slate-300 hover:border-slate-400'}
          ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        <span className={`truncate ${!displayText ? 'text-slate-400 font-normal' : 'text-slate-900'}`}>
          {displayText || placeholder}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {canClear && (
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
              className="p-0.5 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
              title="Hapus filter"
            >
              <X className="w-3 h-3" />
            </span>
          )}
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-900' : ''}`}
          />
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full min-w-[16rem] bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="p-2.5 bg-slate-50/80 backdrop-blur-xs border-b border-slate-100 sticky top-0 z-10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Ketik judul, lokasi, atau tahun..."
                className="w-full pl-8.5 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900 shadow-xs"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="mt-1.5 px-1 flex items-center justify-between text-[10px] text-slate-400 font-medium">
              <span>
                {filtered.length} kegiatan
                {searchTerm ? ' cocok' : ''}
              </span>
              <span className="text-blue-900/60">Klik untuk memilih</span>
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto divide-y divide-slate-50 py-1">
            {allowEmpty && !searchTerm && (
              <button
                type="button"
                onClick={() => handleSelect('')}
                className={`w-full text-left px-3.5 py-2.5 text-xs transition-colors cursor-pointer flex items-center justify-between gap-2
                  ${!selected && (value === '' || value === null || value === undefined)
                    ? 'bg-blue-50/80 text-blue-950 font-bold border-l-4 border-blue-900'
                    : 'text-slate-600 hover:bg-slate-50 font-medium italic'
                  }`}
              >
                <span>{emptyLabel}</span>
                {!selected && (value === '' || value === null || value === undefined) && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-900 shrink-0" />
                )}
              </button>
            )}

            {filtered.length > 0 ? (
              filtered.map((ev) => {
                const isSelected = String(value) === String(ev.id);
                const date = formatEventDate(ev.start_date);
                return (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={() => handleSelect(ev.id)}
                    className={`w-full text-left px-3.5 py-2.5 text-xs transition-colors cursor-pointer flex items-center justify-between gap-2
                      ${isSelected
                        ? 'bg-blue-50/80 text-blue-950 font-bold border-l-4 border-blue-900'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-blue-900 font-medium'
                      }`}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">{ev.title}</span>
                      {(date || ev.status) && (
                        <span className="mt-0.5 flex items-center gap-1.5 text-[10px] font-normal text-slate-400">
                          {date && (
                            <span className="inline-flex items-center gap-0.5">
                              <Calendar className="w-2.5 h-2.5" />
                              {date}
                            </span>
                          )}
                          {ev.status && (
                            <span className="uppercase tracking-wide">{ev.status}</span>
                          )}
                        </span>
                      )}
                    </span>
                    {isSelected && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-900 shrink-0" />
                    )}
                  </button>
                );
              })
            ) : (
              <div className="p-6 text-center">
                <p className="text-xs text-slate-500 font-medium">
                  Kegiatan &quot;<span className="font-bold text-slate-800">{searchTerm}</span>&quot; tidak ditemukan.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
