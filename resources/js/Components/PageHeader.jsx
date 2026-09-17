import React from 'react';
import { Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

/**
 * Flat page header. Keep `description` to ~1 short sentence
 * (2–3 lines max on mobile).
 */
export default function PageHeader({
  title,
  description,
  backHref,
  backLabel = 'Kembali',
  eyebrow,
  eyebrowIcon: EyebrowIcon,
  actions,
}) {
  return (
    <div className="space-y-2 border-b border-slate-200 pb-4">
      {backHref && (
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-900 hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{backLabel}</span>
        </Link>
      )}

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="min-w-0 space-y-1">
          {eyebrow && (
            <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-blue-900">
              {EyebrowIcon && <EyebrowIcon className="w-3.5 h-3.5 shrink-0" />}
              <span>{eyebrow}</span>
            </div>
          )}
          <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900">
            {title}
          </h1>
          {description && (
            <p className="text-xs sm:text-sm text-slate-500 leading-snug max-w-2xl line-clamp-2 sm:line-clamp-3">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="shrink-0 flex flex-wrap items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
