import React from 'react';
import {
    AlertOctagon, UploadCloud, FileText, Shield, FolderPlus, Plus,
    Sun, Moon, User, ShieldCheck, Settings, LogOut
} from 'lucide-react';
import { UserProfile } from '../types';

interface NavbarProps {
    user: any;
    userProfile: UserProfile | null;
    isAdmin: boolean;
    isDarkMode: boolean;
    setIsDarkMode: (isDark: boolean) => void;
    setShowImport: (show: boolean) => void;
    setShowSummary: (show: boolean) => void;
    setShowAdmin: (show: boolean) => void;
    setShowProjectForm: (show: boolean) => void;
    setEditingRisk: (risk: any) => void;
    setShowForm: (show: boolean) => void;
    setPrefilledProject: (proj: any) => void;
    setShowUserAccount: (show: boolean) => void;
    handleLogout: () => void;
}

export function Navbar({
    user,
    userProfile,
    isAdmin,
    isDarkMode,
    setIsDarkMode,
    setShowImport,
    setShowSummary,
    setShowAdmin,
    setShowProjectForm,
    setEditingRisk,
    setShowForm,
    setPrefilledProject,
    setShowUserAccount,
    handleLogout
}: NavbarProps) {
    return (
        <header className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 sticky top-0 z-30 transition-colors">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white flex-shrink-0">
                        <AlertOctagon size={20} />
                    </div>
                    <h1 className="text-sm sm:text-lg lg:text-xl font-bold text-gray-900 dark:text-slate-100 tracking-tight leading-none transition-colors">
                        <span className="sm:hidden">Risk Mgr</span>
                        <span className="hidden sm:inline">Risk Manager E-PO-PM</span>
                        <span className="hidden lg:inline-flex text-blue-600 dark:text-blue-400 text-sm font-normal bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full border border-blue-100 dark:border-blue-800/30 ml-2 transition-colors">AI Powered</span>
                    </h1>
                </div>

                <div className="flex items-center gap-1 sm:gap-2">
                    <button
                        onClick={() => setShowImport(true)}
                        className="hidden lg:flex text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 px-3 py-2 rounded-lg text-sm font-medium items-center transition-all border border-gray-200 dark:border-slate-800"
                        title="Import from CSV"
                    >
                        <UploadCloud className="w-4 h-4 mr-2" />
                        Import
                    </button>
                    <button
                        onClick={() => setShowSummary(true)}
                        className="hidden lg:flex text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 px-3 py-2 rounded-lg text-sm font-medium items-center transition-all border border-gray-200 dark:border-slate-800"
                    >
                        <FileText className="w-4 h-4 mr-2" />
                        Summary
                    </button>

                    {isAdmin && (
                        <button
                            onClick={() => setShowAdmin(true)}
                            className="hidden xl:flex bg-slate-800 hover:bg-slate-900 text-white p-2 px-4 rounded-lg text-sm font-bold items-center transition-all shadow-md mr-1"
                            title="Admin Maintenance"
                        >
                            <Shield className="w-4 h-4 mr-2 text-emerald-400" />
                            Admin
                        </button>
                    )}

                    <button
                        onClick={() => setShowProjectForm(true)}
                        className="flex bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 text-blue-600 dark:text-blue-400 border border-blue-600 dark:border-blue-500 p-2 sm:px-4 sm:py-2 rounded-lg text-sm font-medium items-center transition-all shadow-sm"
                        title="New Project"
                    >
                        <FolderPlus className="w-4 h-4 sm:mr-2" />
                        <span className="hidden sm:inline">New Project</span>
                    </button>

                    <button
                        onClick={() => { setEditingRisk(undefined); setShowForm(true); setPrefilledProject(null); }}
                        className="bg-blue-600 hover:bg-blue-700 text-white p-2 sm:px-4 sm:py-2 rounded-lg text-sm font-medium flex items-center shadow-md transition-all"
                        title="New Risk"
                    >
                        <Plus className="w-4 h-4 sm:mr-2" />
                        <span className="hidden sm:inline">New Risk</span>
                    </button>

                    <div className="h-6 w-px bg-gray-200 dark:bg-slate-700 mx-1"></div>

                    <button
                        onClick={() => setIsDarkMode(!isDarkMode)}
                        className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 flex items-center justify-center text-gray-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-amber-400 transition-all shadow-sm"
                        title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                    >
                        {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                    </button>

                    <div className="flex items-center gap-2 group relative">
                        <div
                            onClick={() => setShowUserAccount(true)}
                            className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-gray-200 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-800 flex items-center justify-center text-gray-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-all duration-200 group-hover:shadow-sm"
                        >
                            <User className="w-5 h-5" />
                        </div>

                        {/* Dropdown menu structure */}
                        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 hidden group-hover:block z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="px-4 py-3 border-b border-gray-50 mb-1">
                                <div className="flex items-center justify-between">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Logged in as</p>
                                    {isAdmin && <ShieldCheck className="w-3 h-3 text-emerald-500" />}
                                </div>
                                <p className="text-sm font-medium text-gray-900 truncate">{user?.email}</p>
                                <p className="text-[9px] text-gray-400 font-bold uppercase">{userProfile?.role || 'User'}</p>
                            </div>

                            <button
                                onClick={() => setShowUserAccount(true)}
                                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center transition-colors"
                            >
                                <User className="w-4 h-4 mr-2 opacity-70" />
                                My Account
                            </button>

                            {isAdmin && (
                                <button
                                    onClick={() => { setShowAdmin(true); setShowUserAccount(false); }}
                                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center transition-colors"
                                >
                                    <Settings className="w-4 h-4 mr-2 opacity-70" />
                                    Admin Maintenance
                                </button>
                            )}

                            <div className="h-px bg-gray-50 my-1"></div>

                            <button
                                onClick={handleLogout}
                                className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center transition-colors"
                            >
                                <LogOut className="w-4 h-4 mr-2 opacity-70" />
                                Sign Out
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </header>
    );
}
