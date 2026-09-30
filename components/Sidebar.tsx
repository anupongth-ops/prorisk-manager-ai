import React, { useState, useRef, useEffect } from 'react';
import {
    AlertOctagon, UploadCloud, Download, FileText, Shield, FolderPlus, Plus,
    Sun, Moon, User, ShieldCheck, Settings, LogOut, Menu, X, BookOpen,
    ChevronDown, ChevronLeft, ChevronRight, HelpCircle, FileSpreadsheet,
    LayoutGrid, FileSearch
} from 'lucide-react';
import { UserProfile } from '../types';

export interface SidebarProps {
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
    isCollapsed: boolean;
    setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}

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

export function Sidebar({
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
    isCollapsed,
    setIsCollapsed,
}: SidebarProps) {
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);
    const canSeeLibrary = isAdmin || userProfile?.role === 'Project_Manager';

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
                setUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const closeMobileMenu = () => setMobileMenuOpen(false);

    return (
        <>
            {/* ── Mobile Top Header (< lg) ── */}
            <header className="lg:hidden bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 sticky top-0 z-30 px-4 h-14 flex items-center justify-between transition-colors">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white flex-shrink-0 shadow-sm">
                        <AlertOctagon size={18} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 className="text-sm font-bold text-gray-900 dark:text-slate-100 tracking-tight leading-none">
                            Smart Risk
                        </h1>
                        <span className="text-[10px] text-blue-500 dark:text-blue-400 font-semibold">
                            Management
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-1.5">
                    <button
                        onClick={() => setShowProjectForm(true)}
                        title="New Project"
                        className="h-8 w-8 flex items-center justify-center rounded-lg border border-blue-500 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    >
                        <FolderPlus className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => { setEditingRisk(undefined); setShowForm(true); setPrefilledProject(null); }}
                        title="New Risk"
                        className="h-8 w-8 flex items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setIsDarkMode(!isDarkMode)}
                        title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                        className="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800"
                    >
                        {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </button>
                    <button
                        onClick={() => setMobileMenuOpen(true)}
                        title="Open Menu"
                        className="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800"
                    >
                        <Menu className="w-4 h-4" />
                    </button>
                </div>
            </header>

            {/* ── Desktop Left Sidebar (>= lg) ── */}
            <aside
                className={`hidden lg:flex flex-col bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 sticky top-0 h-screen z-40 transition-[width] duration-300 ease-in-out select-none ${
                    isCollapsed ? 'w-16' : 'w-64'
                }`}
            >
                {/* ── Sidebar Header: Logo & Collapse Toggle ── */}
                <div className={`h-16 flex items-center border-b border-gray-200 dark:border-slate-800 flex-shrink-0 transition-all ${
                    isCollapsed ? 'justify-center px-2' : 'justify-between px-3.5'
                }`}>
                    {!isCollapsed ? (
                        <>
                            <div className="flex items-center gap-2.5 overflow-hidden">
                                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white flex-shrink-0 shadow-sm">
                                    <AlertOctagon size={18} strokeWidth={2.5} />
                                </div>
                                <div className="leading-tight whitespace-nowrap overflow-hidden">
                                    <h1 className="text-sm font-bold text-gray-900 dark:text-slate-100 tracking-tight">
                                        Smart Risk
                                    </h1>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] text-gray-500 dark:text-slate-400">Management</span>
                                        <span className="text-[9px] bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-semibold px-1 rounded">
                                            E-PO-PM
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Collapse Toggle Button */}
                            <button
                                onClick={() => setIsCollapsed(true)}
                                title="ย่อแถบเมนู (Collapse sidebar)"
                                className="h-7 w-7 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 dark:text-slate-400 flex items-center justify-center transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                        </>
                    ) : (
                        /* Expand Button with Logo Icon when Collapsed */
                        <button
                            onClick={() => setIsCollapsed(false)}
                            title="ขยายแถบเมนู (Expand sidebar)"
                            className="relative group w-9 h-9 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-600 dark:text-slate-300 hover:text-blue-600 flex items-center justify-center transition-all shadow-xs"
                        >
                            <AlertOctagon size={18} strokeWidth={2.5} className="text-blue-600 group-hover:scale-105 transition-transform" />
                            <span className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-700 rounded-full border border-gray-200 dark:border-slate-600 p-0.5 shadow-xs">
                                <ChevronRight className="w-2.5 h-2.5 text-gray-500 group-hover:text-blue-600" />
                            </span>
                        </button>
                    )}
                </div>

                {/* ── Scrollable Navigation Items ── */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-4">
                    
                    {/* 1. Quick Actions (New Project & New Risk) */}
                    <div className="space-y-1">
                        {!isCollapsed && (
                            <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">
                                Quick Actions
                            </span>
                        )}
                        <button
                            onClick={() => { setEditingRisk(undefined); setShowForm(true); setPrefilledProject(null); }}
                            title="สร้างความเสี่ยงใหม่ (New Risk)"
                            className={`w-full flex items-center gap-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-all duration-150 font-medium text-xs ${
                                isCollapsed ? 'h-10 justify-center px-0' : 'h-9 px-3'
                            }`}
                        >
                            <Plus className="w-4 h-4 flex-shrink-0" />
                            {!isCollapsed && <span className="truncate">New Risk</span>}
                        </button>

                        <button
                            onClick={() => setShowProjectForm(true)}
                            title="สร้างโครงการใหม่ (New Project)"
                            className={`w-full flex items-center gap-2.5 rounded-lg border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all duration-150 font-medium text-xs ${
                                isCollapsed ? 'h-10 justify-center px-0' : 'h-8 px-3'
                            }`}
                        >
                            <FolderPlus className="w-4 h-4 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                            {!isCollapsed && <span className="truncate">New Project</span>}
                        </button>
                    </div>

                    <div className="h-px bg-gray-100 dark:bg-slate-800 mx-1" />

                    {/* 2. Main Views Switcher */}
                    <div className="space-y-1">
                        {!isCollapsed && (
                            <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">
                                View Modes
                            </span>
                        )}

                        <NavItem
                            icon={LayoutGrid}
                            label="Dashboard View"
                            active={viewMode === 'dashboard'}
                            onClick={() => setViewMode('dashboard')}
                            isCollapsed={isCollapsed}
                            activeClass="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold border-l-2 border-blue-600"
                        />

                        <NavItem
                            icon={FileSpreadsheet}
                            label="Excel Grid"
                            badge="EPM-03"
                            active={viewMode === 'excel'}
                            onClick={() => setViewMode('excel')}
                            isCollapsed={isCollapsed}
                            activeClass="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 font-semibold border-l-2 border-emerald-600"
                        />

                        <NavItem
                            icon={FileSearch}
                            label="TOR Proposal Risk"
                            badge="AI"
                            active={viewMode === 'tor-risk'}
                            onClick={() => setViewMode('tor-risk')}
                            isCollapsed={isCollapsed}
                            activeClass="bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 font-semibold border-l-2 border-purple-600"
                        />
                    </div>

                    <div className="h-px bg-gray-100 dark:bg-slate-800 mx-1" />

                    {/* 3. Data & Tools */}
                    <div className="space-y-1">
                        {!isCollapsed && (
                            <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">
                                Data & Tools
                            </span>
                        )}

                        <NavItem
                            icon={UploadCloud}
                            label="Import CSV"
                            onClick={() => setShowImport(true)}
                            isCollapsed={isCollapsed}
                        />

                        <NavItem
                            icon={Download}
                            label="Export to Excel"
                            onClick={() => setShowExport(true)}
                            isCollapsed={isCollapsed}
                        />

                        <NavItem
                            icon={FileText}
                            label="Risk Summary"
                            onClick={() => setShowSummary(true)}
                            isCollapsed={isCollapsed}
                        />

                        {canSeeLibrary && (
                            <NavItem
                                icon={BookOpen}
                                label="Risk Library"
                                onClick={() => setShowRiskLibrary(true)}
                                isCollapsed={isCollapsed}
                            />
                        )}

                        <NavItem
                            icon={HelpCircle}
                            label="คู่มือการใช้งาน"
                            onClick={() => setShowGuide(true)}
                            isCollapsed={isCollapsed}
                        />
                    </div>

                    {/* 4. Administration */}
                    {isAdmin && (
                        <>
                            <div className="h-px bg-gray-100 dark:bg-slate-800 mx-1" />
                            <div className="space-y-1">
                                {!isCollapsed && (
                                    <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">
                                        System
                                    </span>
                                )}

                                <NavItem
                                    icon={Shield}
                                    label="Admin Maintenance"
                                    onClick={() => setShowAdmin(true)}
                                    isCollapsed={isCollapsed}
                                    iconColor="text-amber-500"
                                />
                            </div>
                        </>
                    )}
                </div>

                {/* ── Sidebar Footer: Theme & User Info ── */}
                <div className="border-t border-gray-200 dark:border-slate-800 p-2 flex-shrink-0 bg-gray-50/50 dark:bg-slate-900/50">
                    
                    {/* Dark/Light Mode Switcher */}
                    <button
                        onClick={() => setIsDarkMode(!isDarkMode)}
                        title={isDarkMode ? 'เปลี่ยนเป็นธีมสว่าง (Light)' : 'เปลี่ยนเป็นธีมมืด (Dark)'}
                        className={`w-full flex items-center gap-2.5 rounded-lg py-1.5 text-xs text-gray-600 dark:text-slate-400 hover:bg-gray-200/60 dark:hover:bg-slate-800 transition-colors ${
                            isCollapsed ? 'justify-center px-0' : 'px-2.5'
                        }`}
                    >
                        {isDarkMode ? (
                            <Sun className="w-4 h-4 text-amber-500 flex-shrink-0" />
                        ) : (
                            <Moon className="w-4 h-4 text-slate-600 flex-shrink-0" />
                        )}
                        {!isCollapsed && (
                            <span className="font-medium">
                                {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                            </span>
                        )}
                    </button>

                    {/* User Profile / Menu */}
                    <div className="relative mt-1" ref={userMenuRef}>
                        <button
                            onClick={() => setUserMenuOpen(prev => !prev)}
                            title={user?.email || 'Account'}
                            className={`w-full flex items-center gap-2 rounded-lg py-1.5 hover:bg-gray-200/60 dark:hover:bg-slate-800 transition-colors ${
                                isCollapsed ? 'justify-center px-0' : 'px-2'
                            }`}
                        >
                            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm">
                                {(user?.email?.[0] ?? 'U').toUpperCase()}
                            </div>
                            {!isCollapsed && (
                                <div className="flex-1 text-left min-w-0">
                                    <p className="text-xs font-semibold text-gray-800 dark:text-slate-200 truncate leading-tight">
                                        {user?.email?.split('@')[0]}
                                    </p>
                                    <div className="mt-0.5">
                                        <RoleBadge role={userProfile?.role ?? 'User'} />
                                    </div>
                                </div>
                            )}
                            {!isCollapsed && (
                                <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-150 ${userMenuOpen ? 'rotate-180' : ''}`} />
                            )}
                        </button>

                        {/* User Popup Menu */}
                        {userMenuOpen && (
                            <div
                                className={`absolute bottom-full mb-2 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-gray-100 dark:border-slate-700 py-1.5 z-50 ${
                                    isCollapsed ? 'left-14 w-56' : 'left-0 right-0'
                                }`}
                            >
                                <div className="px-3.5 py-2 border-b border-gray-100 dark:border-slate-800 mb-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Signed in as</span>
                                        {isAdmin && <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />}
                                    </div>
                                    <p className="text-xs font-medium text-gray-800 dark:text-slate-200 truncate mt-0.5">{user?.email}</p>
                                </div>

                                <button
                                    onClick={() => { setShowUserAccount(true); setUserMenuOpen(false); }}
                                    className="w-full text-left flex items-center gap-2.5 px-3.5 py-2 text-xs text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800"
                                >
                                    <User className="w-3.5 h-3.5 text-gray-400" />
                                    <span>My Account</span>
                                </button>

                                {isAdmin && (
                                    <button
                                        onClick={() => { setShowAdmin(true); setUserMenuOpen(false); }}
                                        className="w-full text-left flex items-center gap-2.5 px-3.5 py-2 text-xs text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800"
                                    >
                                        <Settings className="w-3.5 h-3.5 text-gray-400" />
                                        <span>Admin Maintenance</span>
                                    </button>
                                )}

                                <div className="h-px bg-gray-100 dark:bg-slate-800 my-1" />

                                <button
                                    onClick={() => { handleLogout(); setUserMenuOpen(false); }}
                                    className="w-full text-left flex items-center gap-2.5 px-3.5 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                                >
                                    <LogOut className="w-3.5 h-3.5" />
                                    <span>Sign Out</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </aside>

            {/* ── Mobile Drawer Overlay (< lg) ── */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeMobileMenu} />
                    <div className="absolute left-0 top-0 h-full w-72 max-w-[85vw] bg-white dark:bg-slate-900 shadow-2xl flex flex-col z-10">
                        {/* Drawer Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-sm">
                                    <AlertOctagon size={16} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h2 className="text-xs font-bold text-gray-900 dark:text-slate-100">Smart Risk</h2>
                                    <span className="text-[9px] text-blue-500 font-medium">Management (E-PO-PM)</span>
                                </div>
                            </div>
                            <button onClick={closeMobileMenu} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Drawer User info */}
                        <div className="px-4 py-2.5 bg-gray-50 dark:bg-slate-800/60 border-b border-gray-100 dark:border-slate-800">
                            <p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase tracking-wider font-semibold">User</p>
                            <p className="text-xs font-semibold text-gray-800 dark:text-slate-200 truncate">{user?.email}</p>
                            <div className="mt-1">
                                <RoleBadge role={userProfile?.role ?? 'User'} />
                            </div>
                        </div>

                        {/* Drawer Nav links */}
                        <div className="flex-1 overflow-y-auto p-3 space-y-1">
                            <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">View Modes</span>
                            <MobileDrawerItem
                                icon={LayoutGrid}
                                label="Dashboard View"
                                active={viewMode === 'dashboard'}
                                onClick={() => { setViewMode('dashboard'); closeMobileMenu(); }}
                            />
                            <MobileDrawerItem
                                icon={FileSpreadsheet}
                                label="Excel Grid"
                                active={viewMode === 'excel'}
                                onClick={() => { setViewMode('excel'); closeMobileMenu(); }}
                            />
                            <MobileDrawerItem
                                icon={FileSearch}
                                label="TOR Proposal Risk"
                                active={viewMode === 'tor-risk'}
                                onClick={() => { setViewMode('tor-risk'); closeMobileMenu(); }}
                            />

                            <div className="h-px bg-gray-100 dark:bg-slate-800 my-2" />
                            <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">Data</span>

                            <MobileDrawerItem
                                icon={UploadCloud}
                                label="Import CSV"
                                onClick={() => { setShowImport(true); closeMobileMenu(); }}
                            />
                            <MobileDrawerItem
                                icon={Download}
                                label="Export to Excel"
                                onClick={() => { setShowExport(true); closeMobileMenu(); }}
                            />
                            <MobileDrawerItem
                                icon={FileText}
                                label="Risk Summary"
                                onClick={() => { setShowSummary(true); closeMobileMenu(); }}
                            />
                            {canSeeLibrary && (
                                <MobileDrawerItem
                                    icon={BookOpen}
                                    label="Risk Library"
                                    onClick={() => { setShowRiskLibrary(true); closeMobileMenu(); }}
                                />
                            )}
                            <MobileDrawerItem
                                icon={HelpCircle}
                                label="คู่มือการใช้งาน"
                                onClick={() => { setShowGuide(true); closeMobileMenu(); }}
                            />

                            {isAdmin && (
                                <>
                                    <div className="h-px bg-gray-100 dark:bg-slate-800 my-2" />
                                    <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">System</span>
                                    <MobileDrawerItem
                                        icon={Shield}
                                        label="Admin Maintenance"
                                        onClick={() => { setShowAdmin(true); closeMobileMenu(); }}
                                    />
                                </>
                            )}

                            <div className="h-px bg-gray-100 dark:bg-slate-800 my-2" />
                            <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">Account</span>
                            <MobileDrawerItem
                                icon={User}
                                label="My Account"
                                onClick={() => { setShowUserAccount(true); closeMobileMenu(); }}
                            />
                            <MobileDrawerItem
                                icon={LogOut}
                                label="Sign Out"
                                color="text-red-600 dark:text-red-400"
                                onClick={() => { handleLogout(); closeMobileMenu(); }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

// ── Item Helpers ──

interface NavItemProps {
    icon: React.ElementType;
    label: string;
    badge?: string;
    active?: boolean;
    onClick: () => void;
    isCollapsed: boolean;
    activeClass?: string;
    iconColor?: string;
}

function NavItem({
    icon: Icon,
    label,
    badge,
    active = false,
    onClick,
    isCollapsed,
    activeClass = 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold',
    iconColor,
}: NavItemProps) {
    const effectiveActiveClass = isCollapsed
        ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-semibold ring-1 ring-blue-500/30'
        : activeClass;

    return (
        <button
            onClick={onClick}
            title={label}
            className={`w-full flex items-center rounded-lg transition-all duration-150 text-xs ${
                isCollapsed ? 'h-10 justify-center px-0' : 'h-8 px-2.5 gap-2.5'
            } ${
                active
                    ? effectiveActiveClass
                    : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-slate-100'
            }`}
        >
            <Icon className={`w-4 h-4 flex-shrink-0 ${iconColor || (active ? '' : 'text-gray-500 dark:text-slate-400')}`} />
            {!isCollapsed && (
                <>
                    <span className="truncate flex-1 text-left">{label}</span>
                    {badge && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400">
                            {badge}
                        </span>
                    )}
                </>
            )}
        </button>
    );
}

function MobileDrawerItem({
    icon: Icon,
    label,
    active = false,
    onClick,
    color,
}: {
    icon: React.ElementType;
    label: string;
    active?: boolean;
    onClick: () => void;
    color?: string;
}) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                active
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : color || 'text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800'
            }`}
        >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{label}</span>
        </button>
    );
}
