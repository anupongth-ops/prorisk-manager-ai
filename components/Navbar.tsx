import React, { useState, useRef, useEffect } from 'react';
import {
    AlertOctagon, UploadCloud, Download, FileText, Shield, FolderPlus, Plus,
    Sun, Moon, User, ShieldCheck, Settings, LogOut, Menu, X, BookOpen,
    ChevronDown, HelpCircle, FileSpreadsheet, LayoutGrid, FileSearch
} from 'lucide-react';
import { UserProfile } from '../types';

interface NavbarProps {
    user: any;
    userProfile: UserProfile | null;
    isAdmin: boolean;
    isDarkMode: boolean;
    setIsDarkMode: (isDark: boolean) => void;
    viewMode: 'dashboard' | 'excel' | 'tor-risk';
    setViewMode: (mode: 'dashboard' | 'excel' | 'tor-risk') => void;
    setShowImport: (show: boolean) => void;
    setShowExport: (show: boolean) => void;
    setShowSummary: (show: boolean) => void;
    setShowAdmin: (show: boolean) => void;
    setShowRiskLibrary: (show: boolean) => void;
    setShowProjectForm: (show: boolean) => void;
    setEditingRisk: (risk: any) => void;
    setShowForm: (show: boolean) => void;
    setPrefilledProject: (proj: any) => void;
    setShowUserAccount: (show: boolean) => void;
    handleLogout: () => void;
    setShowGuide: (show: boolean) => void;
}

// ── Shared button sizes ────────────────────────────────────────────────────────
// All icon-only or icon+label buttons use the same h-9 height and consistent padding
// so the bar looks uniform regardless of content.

const BTN_ICON =
    'h-9 w-9 flex items-center justify-center rounded-lg border transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500';

const BTN_LABEL =
    'h-9 flex items-center gap-1.5 px-3 rounded-lg border text-sm font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500';

// Neutral ghost style (Import, Summary, etc.)
const GHOST =
    'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-slate-100 hover:border-gray-300 dark:hover:border-slate-600';

// Green tint (Export)
const GHOST_GREEN =
    'bg-white dark:bg-slate-900 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:border-emerald-400';

// Indigo tint (Risk Library)
const GHOST_INDIGO =
    'bg-white dark:bg-slate-900 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-400';

// Slate filled (Admin)
const FILLED_SLATE =
    'bg-slate-800 dark:bg-slate-700 border-slate-800 dark:border-slate-600 text-white hover:bg-slate-900 dark:hover:bg-slate-600';

// Blue outline (New Project)
const OUTLINE_BLUE =
    'bg-white dark:bg-slate-900 border-blue-500 dark:border-blue-500 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-600';

// Blue filled (New Risk)
const FILLED_BLUE =
    'bg-blue-600 border-blue-600 text-white hover:bg-blue-700 hover:border-blue-700 shadow-sm';

// ─── Divider ──────────────────────────────────────────────────────────────────
const Divider = () => (
    <div className="h-5 w-px bg-gray-200 dark:bg-slate-700 flex-shrink-0 mx-0.5" />
);

// ─── Tooltip wrapper ─────────────────────────────────────────────────────────
// Simple title-based; engineers appreciate the tooltip for icon-only buttons
const NavBtn = ({
    icon: Icon,
    label,
    title,
    iconOnly = false,
    responsive = false,
    variant = GHOST,
    onClick,
    className = '',
}: {
    icon: React.ElementType;
    label: string;
    title?: string;
    iconOnly?: boolean;
    responsive?: boolean;
    variant?: string;
    onClick: () => void;
    className?: string;
}) => {
    const btnClass = iconOnly 
        ? BTN_ICON 
        : responsive
            ? `h-9 flex items-center justify-center 2xl:justify-start gap-1.5 px-2.5 2xl:px-3 rounded-lg border text-sm font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500`
            : BTN_LABEL;

    return (
        <button
            onClick={onClick}
            title={title || label}
            className={`${btnClass} ${variant} ${className}`}
        >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {!iconOnly && (
                <span className={`whitespace-nowrap ${responsive ? 'hidden 2xl:inline' : ''}`}>
                    {label}
                </span>
            )}
        </button>
    );
};

// ─── Role badge ───────────────────────────────────────────────────────────────
const RoleBadge = ({ role }: { role: string }) => {
    const colors: Record<string, string> = {
        Admin: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400',
        Project_Manager: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400',
        User: 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400',
    };
    const labels: Record<string, string> = {
        Admin: 'Admin',
        Project_Manager: 'PM',
        User: 'User',
    };
    return (
        <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${colors[role] ?? colors.User}`}>
            {labels[role] ?? role}
        </span>
    );
};

// Teal ghost style (Guide)
const GHOST_TEAL =
    'bg-white dark:bg-slate-900 border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 hover:border-teal-400';

export function Navbar({
    user,
    userProfile,
    isAdmin,
    isDarkMode,
    setIsDarkMode,
    viewMode,
    setViewMode,
    setShowImport,
    setShowExport,
    setShowSummary,
    setShowAdmin,
    setShowRiskLibrary,
    setShowProjectForm,
    setEditingRisk,
    setShowForm,
    setPrefilledProject,
    setShowUserAccount,
    handleLogout,
    setShowGuide,
}: NavbarProps) {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const canSeeLibrary = isAdmin || userProfile?.role === 'Project_Manager';

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const closeMobileMenu = () => setMobileMenuOpen(false);

    return (
        <header className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 sticky top-0 z-30 transition-colors">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-3">

                {/* ── Logo ──────────────────────────────────────────────── */}
                <div className="flex items-center gap-2.5 flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white flex-shrink-0 shadow-sm">
                        <AlertOctagon size={18} strokeWidth={2.5} />
                    </div>
                    <div className="leading-none">
                        <h1 className="text-sm font-bold text-gray-900 dark:text-slate-100 tracking-tight">
                            <span className="sm:hidden">Risk Mgr</span>
                            <span className="hidden sm:inline">Risk Manager E-PO-PM</span>
                        </h1>
                        <span className="hidden lg:inline text-[10px] text-blue-500 dark:text-blue-400 font-semibold tracking-wide">
                            AI Powered
                        </span>
                    </div>
                </div>

                {/* ── Desktop toolbar ────────────────────────────────────── */}
                <div className="hidden lg:flex items-center gap-1.5">

                    {/* View Switcher: Dashboard vs Excel Grid vs TOR Proposal Risk */}
                    <div className="flex items-center bg-gray-100 dark:bg-slate-800 p-0.5 rounded-lg border border-gray-200 dark:border-slate-700 mr-1 flex-shrink-0">
                        <button
                            onClick={() => setViewMode('dashboard')}
                            className={`flex items-center gap-1 px-2 py-1 text-xs font-bold rounded-md transition-all ${
                                viewMode === 'dashboard'
                                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                                    : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200'
                            }`}
                            title="Dashboard View"
                        >
                            <LayoutGrid className="w-4 h-4" />
                            <span className="hidden 2xl:inline">Dashboard</span>
                        </button>
                        <button
                            onClick={() => setViewMode('excel')}
                            className={`flex items-center gap-1 px-2 py-1 text-xs font-bold rounded-md transition-all ${
                                viewMode === 'excel'
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                            }`}
                            title="Excel Grid Input (EPM-03-014AT1)"
                        >
                            <FileSpreadsheet className="w-4 h-4" />
                            <span className="hidden 2xl:inline">Excel Grid</span>
                        </button>
                        <button
                            onClick={() => setViewMode('tor-risk')}
                            className={`flex items-center gap-1 px-2 py-1 text-xs font-bold rounded-md transition-all ${
                                viewMode === 'tor-risk'
                                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm'
                                    : 'text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30'
                            }`}
                            title="TOR & Proposal Risk Assessment (ISO 31000 / COSO ERM)"
                        >
                            <FileSearch className="w-4 h-4" />
                            <span className="hidden 2xl:inline">TOR Risk</span>
                        </button>
                    </div>

                    <Divider />

                    {/* Group 1: Data I/O */}
                    <NavBtn icon={UploadCloud} label="Import" title="Import from CSV" variant={GHOST} onClick={() => setShowImport(true)} responsive />
                    <NavBtn icon={Download} label="Export" title="Export to Excel" variant={GHOST_GREEN} onClick={() => setShowExport(true)} responsive />
                    <NavBtn icon={FileText} label="Summary" title="Risk Summary" variant={GHOST} onClick={() => setShowSummary(true)} responsive />

                    {canSeeLibrary && (
                        <NavBtn icon={BookOpen} label="Risk Library" title="Risk Library" variant={GHOST_INDIGO} onClick={() => setShowRiskLibrary(true)} responsive />
                    )}

                    <NavBtn icon={HelpCircle} label="คู่มือ" title="คู่มือการประเมินความเสี่ยง" variant={GHOST_TEAL} onClick={() => setShowGuide(true)} responsive />

                    <Divider />

                    {/* Group 2: Admin */}
                    {isAdmin && (
                        <NavBtn icon={Shield} label="Admin" title="Admin Maintenance" variant={FILLED_SLATE} onClick={() => setShowAdmin(true)} responsive />
                    )}

                    {/* Group 3: Create */}
                    <NavBtn icon={FolderPlus} label="New Project" variant={OUTLINE_BLUE} onClick={() => setShowProjectForm(true)} />
                    <NavBtn
                        icon={Plus}
                        label="New Risk"
                        variant={FILLED_BLUE}
                        onClick={() => { setEditingRisk(undefined); setShowForm(true); setPrefilledProject(null); }}
                    />

                    <Divider />

                    {/* Group 4: Utilities */}
                    {/* Dark mode */}
                    <button
                        onClick={() => setIsDarkMode(!isDarkMode)}
                        title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                        className={`${BTN_ICON} ${GHOST}`}
                    >
                        {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </button>

                    {/* User dropdown */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setDropdownOpen(p => !p)}
                            className={`${BTN_LABEL} ${GHOST} gap-2 pl-2 pr-2.5`}
                            title="Account"
                        >
                            <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                                {(user?.email?.[0] ?? 'U').toUpperCase()}
                            </div>
                            <span className="hidden xl:block max-w-[120px] truncate text-gray-700 dark:text-slate-300 text-xs">
                                {user?.email?.split('@')[0]}
                            </span>
                            <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-150 ${dropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {dropdownOpen && (
                            <div className="absolute right-0 top-full mt-1.5 w-60 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-gray-100 dark:border-slate-700 py-1.5 z-50">
                                {/* User info */}
                                <div className="px-4 py-2.5 border-b border-gray-100 dark:border-slate-800 mb-1">
                                    <div className="flex items-center justify-between mb-0.5">
                                        <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">Logged in as</p>
                                        {isAdmin && <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />}
                                    </div>
                                    <p className="text-sm font-semibold text-gray-900 dark:text-slate-100 truncate">{user?.email}</p>
                                    <div className="mt-1">
                                        <RoleBadge role={userProfile?.role ?? 'User'} />
                                    </div>
                                </div>

                                <DropdownItem icon={User} label="My Account" onClick={() => { setShowUserAccount(true); setDropdownOpen(false); }} />
                                {isAdmin && (
                                    <DropdownItem icon={Settings} label="Admin Maintenance" onClick={() => { setShowAdmin(true); setDropdownOpen(false); }} />
                                )}

                                <div className="h-px bg-gray-100 dark:bg-slate-800 my-1" />
                                <DropdownItem icon={LogOut} label="Sign Out" onClick={() => { handleLogout(); setDropdownOpen(false); }} danger />
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Mobile: create shortcuts + hamburger ──────────────── */}
                <div className="flex lg:hidden items-center gap-1.5">
                    {/* Always-visible on mobile: New Project + New Risk */}
                    <NavBtn
                        icon={FolderPlus}
                        label="New Project"
                        title="New Project"
                        iconOnly
                        variant={OUTLINE_BLUE}
                        onClick={() => setShowProjectForm(true)}
                    />
                    <NavBtn
                        icon={Plus}
                        label="New Risk"
                        title="New Risk"
                        iconOnly
                        variant={FILLED_BLUE}
                        onClick={() => { setEditingRisk(undefined); setShowForm(true); setPrefilledProject(null); }}
                    />
                    <Divider />
                    <button
                        onClick={() => setIsDarkMode(!isDarkMode)}
                        title={isDarkMode ? 'Light Mode' : 'Dark Mode'}
                        className={`${BTN_ICON} ${GHOST}`}
                    >
                        {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </button>
                    <button
                        onClick={() => setMobileMenuOpen(true)}
                        title="Menu"
                        className={`${BTN_ICON} ${GHOST}`}
                    >
                        <Menu className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* ── Mobile Drawer ──────────────────────────────────────────── */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeMobileMenu} />
                    <div className="absolute right-0 top-0 h-full w-72 max-w-[88vw] bg-white dark:bg-slate-900 shadow-2xl flex flex-col">

                        {/* Drawer header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-slate-800">
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">Logged in as</p>
                                <p className="text-sm font-semibold text-gray-900 dark:text-slate-100 truncate">{user?.email}</p>
                                <div className="mt-0.5">
                                    <RoleBadge role={userProfile?.role ?? 'User'} />
                                </div>
                            </div>
                            <button onClick={closeMobileMenu} className={`${BTN_ICON} ${GHOST}`}>
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Menu sections */}
                        <div className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">

                            {/* View Switcher group */}
                            <p className="px-3 pt-1 pb-1 text-[10px] font-bold text-gray-400 dark:text-slate-600 uppercase tracking-widest">Views</p>
                            <MobileItem icon={LayoutGrid} label="Dashboard View" onClick={() => { setViewMode('dashboard'); closeMobileMenu(); }} color="gray" />
                            <MobileItem icon={FileSpreadsheet} label="Excel Grid View" onClick={() => { setViewMode('excel'); closeMobileMenu(); }} color="emerald" />
                            <MobileItem icon={FileSearch} label="TOR Proposal Risk" onClick={() => { setViewMode('tor-risk'); closeMobileMenu(); }} color="indigo" />

                            {/* Data I/O group */}
                            <p className="px-3 pt-3 pb-1 text-[10px] font-bold text-gray-400 dark:text-slate-600 uppercase tracking-widest">Data</p>
                            <MobileItem icon={UploadCloud} label="Import from CSV"   onClick={() => { setShowImport(true); closeMobileMenu(); }} color="gray" />
                            <MobileItem icon={Download}    label="Export to Excel"   onClick={() => { setShowExport(true); closeMobileMenu(); }} color="emerald" />
                            <MobileItem icon={FileText}    label="Risk Summary"      onClick={() => { setShowSummary(true); closeMobileMenu(); }} color="gray" />
                            {canSeeLibrary && (
                                <MobileItem icon={BookOpen} label="Risk Library" onClick={() => { setShowRiskLibrary(true); closeMobileMenu(); }} color="indigo" />
                            )}
                            <MobileItem icon={HelpCircle} label="คู่มือการประเมินความเสี่ยง" onClick={() => { setShowGuide(true); closeMobileMenu(); }} color="teal" />

                            {/* Admin group */}
                            {isAdmin && (
                                <>
                                    <p className="px-3 pt-3 pb-1 text-[10px] font-bold text-gray-400 dark:text-slate-600 uppercase tracking-widest">System</p>
                                    <MobileItem icon={Shield} label="Admin Maintenance" onClick={() => { setShowAdmin(true); closeMobileMenu(); }} color="slate" />
                                </>
                            )}

                            {/* Account group */}
                            <p className="px-3 pt-3 pb-1 text-[10px] font-bold text-gray-400 dark:text-slate-600 uppercase tracking-widest">Account</p>
                            <MobileItem icon={User}    label="My Account" onClick={() => { setShowUserAccount(true); closeMobileMenu(); }} color="gray" />
                            <MobileItem icon={LogOut}  label="Sign Out"   onClick={() => { handleLogout(); closeMobileMenu(); }} color="red" />
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function DropdownItem({
    icon: Icon,
    label,
    onClick,
    danger = false,
}: {
    icon: React.ElementType;
    label: string;
    onClick: () => void;
    danger?: boolean;
}) {
    return (
        <button
            onClick={onClick}
            className={`w-full text-left flex items-center gap-2.5 px-4 py-2 text-sm transition-colors
                ${danger
                    ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                    : 'text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-slate-100'
                }`}
        >
            <Icon className="w-4 h-4 flex-shrink-0 opacity-60" />
            {label}
        </button>
    );
}

const MOBILE_COLORS: Record<string, { icon: string; bg: string }> = {
    gray:    { icon: 'text-gray-500 dark:text-slate-500',     bg: 'hover:bg-gray-100 dark:hover:bg-slate-800' },
    emerald: { icon: 'text-emerald-600 dark:text-emerald-400', bg: 'hover:bg-emerald-50 dark:hover:bg-emerald-900/20' },
    indigo:  { icon: 'text-indigo-600 dark:text-indigo-400',   bg: 'hover:bg-indigo-50 dark:hover:bg-indigo-900/20' },
    teal:    { icon: 'text-teal-600 dark:text-teal-400',       bg: 'hover:bg-teal-50 dark:hover:bg-teal-900/20' },
    slate:   { icon: 'text-slate-700 dark:text-slate-300',     bg: 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700' },
    red:     { icon: 'text-red-500 dark:text-red-400',         bg: 'hover:bg-red-50 dark:hover:bg-red-900/20' },
};

function MobileItem({
    icon: Icon,
    label,
    onClick,
    color = 'gray',
}: {
    icon: React.ElementType;
    label: string;
    onClick: () => void;
    color?: string;
}) {
    const c = MOBILE_COLORS[color] ?? MOBILE_COLORS.gray;
    return (
        <button
            onClick={onClick}
            className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-gray-700 dark:text-slate-300 ${c.bg}`}
        >
            <Icon className={`w-4 h-4 flex-shrink-0 ${c.icon}`} />
            {label}
        </button>
    );
}
