import React from 'react';

/**
 * PageHeader — flat, non-slop replacement for the old gradient hero banners.
 *
 * A flat white block with a 1px bottom border. No gradients, no blobs, no
 * heavy shadows. Informed by the minimalist-ui skill: color is scarce,
 * structure comes from borders and typographic contrast, not elevation.
 *
 * Props:
 *  - eyebrow:      short uppercase label above the title (e.g. "Modul Keuangan")
 *  - eyebrowIcon:  lucide icon component rendered next to the eyebrow
 *  - title:        page H1
 *  - description:  optional secondary line
 *  - actions:      optional right-aligned node (buttons, filters)
 *  - icon:         optional lucide icon for the title row
 */
export default function PageHeader({
    eyebrow,
    eyebrowIcon: EyebrowIcon,
    title,
    description,
    actions,
    icon: TitleIcon,
}) {
    return (
        <div className="border-b border-slate-200 pb-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-1.5 min-w-0">
                    {eyebrow && (
                        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-blue-900">
                            {EyebrowIcon && <EyebrowIcon className="w-3.5 h-3.5 shrink-0" />}
                            <span>{eyebrow}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-2.5">
                        {TitleIcon && <TitleIcon className="w-5 h-5 text-slate-900 shrink-0" />}
                        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
                            {title}
                        </h1>
                    </div>
                    {description && (
                        <p className="text-sm text-slate-500 max-w-3xl leading-relaxed">
                            {description}
                        </p>
                    )}
                </div>
                {actions && (
                    <div className="flex items-center gap-2 shrink-0">{actions}</div>
                )}
            </div>
        </div>
    );
}
