import React from 'react';
import { Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

export default function PageHeader({ title, description, backHref, backLabel = 'Kembali' }) {
  return (
    <div className="space-y-1.5 border-b border-slate-200 pb-4">
      {backHref && (
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-900 hover:underline mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{backLabel}</span>
        </Link>
      )}
      <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900">
        {title}
      </h1>
      {description && (
        <p className="text-sm text-slate-500 leading-relaxed max-w-2xl">
          {description}
        </p>
      )}
    </div>
  );
}