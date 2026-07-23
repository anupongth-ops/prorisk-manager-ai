
import React from 'react';
import { X, User, Mail, Calendar, ShieldCheck, Key, LogOut, ChevronRight, ShieldAlert, FolderLock, Settings } from 'lucide-react';
import { logoutUser } from '../services/firebaseService';
import { UserProfile } from '../types';

interface UserAccountPageProps {
  user: any;
  userProfile: UserProfile | null;
  onClose: () => void;
  onOpenAdmin: () => void;
  onChangePassword: () => void;
}

export const UserAccountPage: React.FC<UserAccountPageProps> = ({ user, userProfile, onClose, onOpenAdmin, onChangePassword }) => {
  const handleLogout = async () => {
    try {
      if (window.confirm("Are you sure you want to sign out?")) {
        await logoutUser();
        // The App component's auth listener will handle navigation
        onClose();
      }
    } catch (error) {
      console.error("Sign out error:", error);
      alert("Sign out failed. Please try again.");
    }
  };

  const isAdmin = userProfile?.role === 'Admin';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md my-auto max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200 pointer-events-auto border border-white/10 dark:border-slate-800 transition-all">

        {/* Header/Cover */}
        <div className={`h-28 sm:h-32 relative flex-shrink-0 ${isAdmin ? 'bg-gradient-to-r from-slate-800 to-slate-900' : 'bg-gradient-to-r from-blue-600 to-indigo-700'}`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="absolute -bottom-10 left-6 sm:left-8">
            <div className="w-20 h-20 rounded-2xl bg-white dark:bg-slate-900 p-1 shadow-xl transition-colors">
              <div className="w-full h-full rounded-xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                {isAdmin ? <ShieldAlert className="w-10 h-10 text-emerald-600 dark:text-emerald-500" /> : <User className="w-10 h-10" />}
              </div>
            </div>
          </div>
        </div>

        {/* Profile Content - Scrollable for small screens */}
        <div className="pt-12 pb-6 px-6 sm:px-8 overflow-y-auto flex-1">
          <div className="mb-6">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">User Account</h2>
              {isAdmin && (
                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30 px-2 py-0.5 rounded-full uppercase tracking-widest transition-colors">
                  Admin
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-slate-400">Manage your profile and security settings.</p>
          </div>

          <div className="space-y-4">
            {/* Info Cards */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-800 transition-colors">
              <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm transition-colors">
                <Mail className="w-5 h-5 text-gray-400 dark:text-slate-500" />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Email Address</p>
                <p className="text-sm font-medium text-gray-800 dark:text-slate-200 truncate">{user.email}</p>
              </div>
            </div>

            {!isAdmin && (
              <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-800 transition-colors">
                <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm transition-colors">
                  <FolderLock className="w-5 h-5 text-gray-400 dark:text-slate-500" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Authorized Projects</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {userProfile?.assignedProjects && userProfile.assignedProjects.length > 0 ? (
                      userProfile.assignedProjects.map(proj => (
                        <span key={proj} className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded border border-blue-100 dark:border-blue-800/30 transition-all">
                          {proj}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-gray-400 dark:text-slate-500 italic">No project assignments. (Read Only)</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-800 transition-colors">
              <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm transition-colors">
                <ShieldCheck className="w-5 h-5 text-gray-400 dark:text-slate-500" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Security Status</p>
                <div className="flex items-center mt-0.5">
                  {userProfile?.isDefaultPassword === false ? (
                    <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1 transition-colors">
                      <ShieldCheck className="w-3 h-3" /> Secure
                    </span>
                  ) : userProfile?.isDefaultPassword === true ? (
                    <span className="text-sm font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1 transition-colors">
                      <Key className="w-3 h-3" /> Default Password
                    </span>
                  ) : (
                    <span className="text-sm text-gray-400 dark:text-slate-500">Verifying...</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-800 space-y-2 transition-colors">
            {isAdmin && (
              <button
                onClick={onOpenAdmin}
                className="w-full flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg group-hover:bg-slate-200 dark:group-hover:bg-slate-700 transition-colors">
                    <Settings className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700 dark:text-slate-300">Admin Maintenance</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-transform group-hover:translate-x-0.5" />
              </button>
            )}

            <button
              onClick={onChangePassword}
              className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors group text-left"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition-colors">
                  <Key className="w-4 h-4" />
                </div>
                <span className="text-sm font-semibold text-gray-700 dark:text-slate-300">Change Password</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-transform group-hover:translate-x-0.5" />
            </button>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-between p-3 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors group text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg group-hover:bg-red-100 dark:group-hover:bg-red-900/40 transition-colors">
                  <LogOut className="w-4 h-4" />
                </div>
                <span className="text-sm font-semibold text-red-600 dark:text-red-400">Sign Out</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
