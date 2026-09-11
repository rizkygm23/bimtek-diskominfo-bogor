import React, { useState, useEffect } from 'react';
import { usePage, Link } from '@inertiajs/react';
import {
    LayoutDashboard,
    Calendar,
    ShieldCheck,
    Camera,
    CreditCard,
    FileCheck,
    BarChart3,
    Settings,
    Users,
    History,
    User,
    Award,
    Mic,
    Sliders,
    FileSpreadsheet,
    FileText,
    LogOut,
    PanelLeftClose,
    PanelLeftOpen,
    X,
} from 'lucide-react';
import DiskominfoLogo from './DiskominfoLogo';

/**
 * Sidebar — role-aware grouped navigation for authenticated users.
 *
 * Design principles (minimalist-ui + design-taste-frontend-v1):
 *  - Flat white surface, 1px borders, single blue-900 accent.
 *  - Active link: 2px left accent bar + slate-900 text + slate-100 bg.
 *  - No gradients, no heavy shadows, no emoji. Icons via lucide.
 *  - Active detection uses usePage().url (Inertia-safe, no window.location lag).
 *
 * Layout:
 *  - lg+ : fixed aside, w-64 expanded / w-16 collapsed (localStorage persist).
 *  - mobile : hidden by default; opened as overlay drawer via MobileTopBar
 *             hamburger (controlled by the `open` / `onClose` props).
 */
const NAV_CONFIG = {
    admin: [
        {
            label: 'Utama',
            items: [
                { href: '/dashboard', label: 'Beranda', icon: LayoutDashboard },
                { href: '/events', label: 'Katalog BIMTEK', icon: Calendar },
            ],
        },
        {
            label: 'Kegiatan',
            items: [
                { href: '/admin/verifications', label: 'Verifikasi Data', icon: ShieldCheck },
                { href: '/attendance/scan', label: 'Presensi Hari-H', icon: Camera },
            ],
        },
        {
            label: 'Keuangan',
            items: [
                { href: '/admin/payments', label: 'Honor & Pajak', icon: CreditCard },
                { href: '/admin/tax-settings', label: 'Tarif PPh 21', icon: Sliders },
            ],
        },
        {
            label: 'Laporan',
            items: [
                { href: '/admin/report-center', label: 'Pusat Laporan', icon: BarChart3 },
                { href: '/admin/reports/participants', label: 'Rekap Peserta', icon: FileSpreadsheet },
                { href: '/admin/reports/speakers', label: 'Rekap Narasumber', icon: FileText },
                { href: '/admin/reports/honorarium', label: 'Cetak Honorarium', icon: FileText },
            ],
        },
        {
            label: 'Sistem',
            items: [
                { href: '/admin/speakers', label: 'Master Pembicara', icon: Users },
                { href: '/admin/event-history', label: 'Riwayat BIMTEK', icon: History },
                { href: '/profile', label: 'Profil', icon: User },
            ],
        },
    ],
    pembicara: [
        {
            label: 'Utama',
            items: [
                { href: '/dashboard', label: 'Beranda', icon: LayoutDashboard },
                { href: '/events', label: 'Jadwal BIMTEK', icon: Calendar },
            ],
        },
        {
            label: 'Kegiatan',
            items: [
                { href: '/attendance/scan', label: 'Presensi Hari-H', icon: Camera },
                { href: '/event-history', label: 'Riwayat Mengajar', icon: History },
                { href: '/my-certificates', label: 'Sertifikat', icon: Award },
            ],
        },
        {
            label: 'Akun',
            items: [
                { href: '/profile', label: 'Profil & Rekening', icon: User },
            ],
        },
    ],
    user: [
        {
            label: 'Utama',
            items: [
                { href: '/dashboard', label: 'Beranda', icon: LayoutDashboard },
                { href: '/events', label: 'Katalog BIMTEK', icon: Calendar },
            ],
        },
        {
            label: 'Kegiatan',
            items: [
                { href: '/attendance/scan', label: 'Presensi Hari-H', icon: Camera },
                { href: '/event-history', label: 'Riwayat', icon: History },
                { href: '/my-certificates', label: 'Sertifikat Saya', icon: Award },
            ],
        },
        {
            label: 'Akun',
            items: [
                { href: '/profile', label: 'Profil', icon: User },
            ],
        },
    ],
};

const ROLE_META = {
    admin: { label: 'Admin', badge: 'bg-blue-900 text-white' },
    pembicara: { label: 'Narasumber', badge: 'bg-slate-200 text-slate-700' },
    user: { label: 'Peserta', badge: 'bg-slate-200 text-slate-700' },
};

function isActive(current, href) {
    if (current === href) return true;
    // Avoid /dashboard matching everything; only prefix-match deeper routes.
    if (href !== '/dashboard' && current.startsWith(href + '/')) return true;
    if (href !== '/dashboard' && current === href) return true;
    return false;
}

export default function Sidebar({ open = false, onClose }) {
    const page = usePage();
    const { auth } = page.props;
    const user = auth?.user || {};
    const role = user.role || 'user';
    const current = (page.url || '').split('?')[0];
    const groups = NAV_CONFIG[role] || NAV_CONFIG.user;
    const roleMeta = ROLE_META[role] || ROLE_META.user;

    const [collapsed, setCollapsed] = useState(false);

    // Persist collapse state (lg+ only; irrelevant on mobile drawer).
    useEffect(() => {
        try {
            const saved = localStorage.getItem('sidebar-collapsed');
            if (saved === '1') setCollapsed(true);
        } catch { /* localStorage may throw in private mode */ }
    }, []);

    const toggleCollapse = () => {
        setCollapsed((prev) => {
            const next = !prev;
            try { localStorage.setItem('sidebar-collapsed', next ? '1' : '0'); } catch {}
            return next;
        });
    };

    const handleLogout = (e) => {
        e.preventDefault();
        window.location.href = '/logout';
    };

    // Close mobile drawer on route change.
    useEffect(() => {
        if (open && typeof onClose === 'function') {
            const handler = () => onClose();
            window.addEventListener('resize', handler);
            return () => window.removeEventListener('resize', handler);
        }
    }, [open, onClose]);

    return (
        <>
            {/* Mobile backdrop */}
            {open && (
                <div
                    className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden print:hidden"
                    onClick={onClose}
                    aria-hidden="true"
                />
            )}

            <aside
                className={[
                    'fixed top-0 left-0 z-50 h-[100dvh] flex flex-col bg-white border-r border-slate-200 transition-all duration-200 print:hidden',
                    // Width: collapsed shows icon-only on lg+; mobile drawer always full width
                    collapsed ? 'lg:w-16' : 'lg:w-64',
                    'w-72', // mobile drawer width
                    // Slide: hidden on mobile unless open
                    open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
                ].join(' ')}
            >
                {/* HEADER: logo + role badge + collapse toggle (lg+ only) */}
                <div className="flex items-center justify-between gap-2 h-16 px-4 border-b border-slate-200 shrink-0">
                    <Link href="/dashboard" className="flex items-center gap-2 min-w-0" onClick={onClose}>
                        <DiskominfoLogo variant="light-bg" className={collapsed ? 'lg:hidden' : ''} />
                        {collapsed && (
                            <span className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg bg-blue-900 text-white text-xs font-bold shrink-0">
                                B
                            </span>
                        )}
                    </Link>
                    <div className="flex items-center gap-1.5">
                        {!collapsed && (
                            <span className={`hidden lg:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${roleMeta.badge}`}>
                                {roleMeta.label}
                            </span>
                        )}
                        {/* Close button — mobile only */}
                        <button
                            type="button"
                            onClick={onClose}
                            className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                            aria-label="Tutup menu"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* NAV: grouped, scrollable */}
                <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-5">
                    {groups.map((group) => (
                        <div key={group.label} className="space-y-0.5">
                            {!collapsed && (
                                <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                    {group.label}
                                </p>
                            )}
                            {group.items.map((item) => {
                                const active = isActive(current, item.href);
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={onClose}
                                        title={collapsed ? item.label : undefined}
                                        className={[
                                            'group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                            collapsed ? 'lg:justify-center lg:px-0' : '',
                                            active
                                                ? 'bg-slate-100 text-slate-900'
                                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                                        ].join(' ')}
                                    >
                                        {/* Active accent bar */}
                                        {active && (
                                            <span
                                                className={[
                                                    'absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-blue-900',
                                                    collapsed ? 'lg:left-1' : '',
                                                ].join(' ')}
                                                aria-hidden="true"
                                            />
                                        )}
                                        <Icon className={[
                                            'w-4 h-4 shrink-0',
                                            active ? 'text-blue-900' : 'text-slate-400 group-hover:text-slate-600',
                                        ].join(' ')} />
                                        {!collapsed && <span className="truncate">{item.label}</span>}
                                    </Link>
                                );
                            })}
                        </div>
                    ))}
                </nav>

                {/* FOOTER: collapse toggle (lg+) + user mini-card + logout */}
                <div className="border-t border-slate-200 p-2 space-y-1 shrink-0">
                    {/* Collapse toggle — lg+ only */}
                    <button
                        type="button"
                        onClick={toggleCollapse}
                        className="hidden lg:flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                        title={collapsed ? 'Lebarkan sidebar' : 'Perkecil sidebar'}
                    >
                        {collapsed
                            ? <PanelLeftOpen className="w-4 h-4 shrink-0 mx-auto" />
                            : <PanelLeftClose className="w-4 h-4 shrink-0" />}
                        {!collapsed && <span className="truncate">Perkecil</span>}
                    </button>

                    {/* User mini-card */}
                    <Link
                        href="/profile"
                        onClick={onClose}
                        className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-slate-50 transition-colors ${collapsed ? 'lg:justify-center lg:px-0' : ''}`}
                    >
                        <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-bold shrink-0">
                            {user.name?.charAt(0) || 'U'}
                        </div>
                        {!collapsed && (
                            <div className="min-w-0 text-left">
                                <p className="text-xs font-semibold text-slate-900 truncate">{user.name}</p>
                                <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                            </div>
                        )}
                    </Link>

                    {/* Logout */}
                    <button
                        type="button"
                        onClick={handleLogout}
                        className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors ${collapsed ? 'lg:justify-center lg:px-0' : ''}`}
                        title={collapsed ? 'Keluar' : undefined}
                    >
                        <LogOut className="w-4 h-4 shrink-0" />
                        {!collapsed && <span>Keluar</span>}
                    </button>
                </div>
            </aside>
        </>
    );
}
