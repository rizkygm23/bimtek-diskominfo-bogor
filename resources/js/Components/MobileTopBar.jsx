import React from 'react';
import { usePage, Link } from '@inertiajs/react';
import { Menu } from 'lucide-react';
import DiskominfoLogo from './DiskominfoLogo';

/**
 * MobileTopBar — slim lg:hidden bar for the auth shell.
 *
 * Visible only below lg, it provides:
 *  - hamburger button (opens the Sidebar drawer)
 *  - Diskominfo logo
 *  - user avatar initial (links to /profile)
 *
 * Flat: bg-white, border-b border-slate-200, no shadow, no gradient.
 * The Sidebar itself is the drawer; this bar just hosts the trigger.
 */
export default function MobileTopBar({ onMenuClick }) {
    const { auth } = usePage().props;
    const user = auth?.user || {};

    return (
        <header className="lg:hidden sticky top-0 z-30 h-14 flex items-center justify-between gap-3 px-4 bg-white border-b border-slate-200 print:hidden">
            {/* Left: hamburger + logo */}
            <div className="flex items-center gap-2 min-w-0">
                <button
                    type="button"
                    onClick={onMenuClick}
                    className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                    aria-label="Buka menu"
                >
                    <Menu className="w-5 h-5" />
                </button>
                <Link href="/dashboard" className="flex items-center min-w-0">
                    <DiskominfoLogo variant="light-bg" />
                </Link>
            </div>

            {/* Right: avatar initial */}
            <Link
                href="/profile"
                className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-bold shrink-0"
            >
                {user.name?.charAt(0) || 'U'}
            </Link>
        </header>
    );
}
