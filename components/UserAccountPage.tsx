import React, { useState, useEffect } from 'react';
import { 
  X, User, Mail, ShieldCheck, Key, LogOut, ChevronRight, 
  ShieldAlert, FolderLock, Settings, Building2, Briefcase, BadgeCheck, 
  Edit2, Check, XCircle, Save, AlertCircle
} from 'lucide-react';
import { logoutUser, updateUserProfileData } from '../services/firebaseService';
import { clearGCMESession, storeGCMESession, getStoredGCMEUser, getStoredGCMEToken } from '../services/gcmeAuthService';
import { UserProfile } from '../types';

interface UserAccountPageProps {
  user: any;
  userProfile: UserProfile | null;
  onClose: () => void;
  onOpenAdmin: () => void;
  onChangePassword: () => void;
  onLogout?: () => void;
  onUpdateProfile?: (updatedData: Partial<UserProfile>) => void;
}

export const UserAccountPage: React.FC<UserAccountPageProps> = ({ 
  user, 
  userProfile, 
  onClose, 
  onOpenAdmin, 
  onChangePassword,
  onLogout,
  onUpdateProfile
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: '',
    email: '',
    department: '',
    jobTitle: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setEditForm({
      displayName: userProfile?.displayName || user?.displayName || user?.name || '',
      email: user?.email || userProfile?.email || '',
      department: userProfile?.department || user?.department || '',
      jobTitle: userProfile?.jobTitle || user?.jobTitle || ''
    });
  }, [userProfile, user, isEditing]);

  const handleLogout = async () => {
    try {
      if (window.confirm("Are you sure you want to sign out?")) {
        clearGCMESession();
        onClose();
        if (onLogout) {
          await onLogout();
        } else {
          await logoutUser();
        }
      }
    } catch (error) {
      console.error("Sign out error:", error);
      alert("Sign out failed. Please try again.");
    }
  };

  const isAdmin = userProfile?.role === 'Admin';
  const isGCME = userProfile?.authProvider === 'gcme' || user?.authProvider === 'gcme';
  const displayName = userProfile?.displayName || user?.displayName || user?.name || '';
  const department = userProfile?.department || user?.department || 'GCME';
  const jobTitle = userProfile?.jobTitle || user?.jobTitle || '';
  const email = user?.email || userProfile?.email || '';

  const handleSaveProfile = async () => {
    const uid = userProfile?.id || user?.uid;
    if (!uid) {
      alert("ไม่พบรหัสผู้ใช้งานในระบบ ไม่สามารถบันทึกได้");
      return;
    }
    try {
      setIsSaving(true);
      const updatedFields = {
        displayName: editForm.displayName.trim(),
        email: editForm.email.trim(),
        department: editForm.department.trim(),
        jobTitle: editForm.jobTitle.trim()
      };

      await updateUserProfileData(uid, updatedFields);

      // Update GCME session if active so refreshed tabs retain updated claims
      const token = getStoredGCMEToken();
      const storedUser = getStoredGCMEUser();
      if (token && storedUser) {
        if (updatedFields.displayName) storedUser.name = updatedFields.displayName;
        if (updatedFields.email) storedUser.email = updatedFields.email;
        if (updatedFields.department) storedUser.department = updatedFields.department;
        if (updatedFields.jobTitle) storedUser.jobTitle = updatedFields.jobTitle;
        storeGCMESession(token, storedUser);
      }

      if (onUpdateProfile) {
        onUpdateProfile(updatedFields);
      }

      setIsEditing(false);
      setSuccessMessage("บันทึกข้อมูลเรียบร้อยแล้ว (Profile updated successfully!)");
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      console.error("Failed to update profile:", err);
      alert(`ไม่สามารถบันทึกข้อมูลได้: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md my-auto max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200 pointer-events-auto border border-white/10 dark:border-slate-800 transition-all">

        {/* Header/Cover */}
        <div className={`h-28 sm:h-32 relative flex-shrink-0 ${isAdmin ? 'bg-gradient-to-r from-slate-800 to-slate-900' : 'bg-gradient-to-r from-blue-600 to-indigo-700'}`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white transition-colors z-10 cursor-pointer"
            title="Close"
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
        <div className="pt-12 pb-6 px-6 sm:px-8 overflow-y-auto flex-1 space-y-4">

          {/* Success Banner */}
          {successMessage && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 animate-in fade-in">
              <Check className="w-4 h-4 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* User Name & Top Action */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-slate-100 truncate" title={displayName}>
                    {displayName || 'User Account'}
                  </h2>
                  {isAdmin && (
                    <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30 px-2 py-0.5 rounded-full uppercase tracking-widest flex-shrink-0">
                      ADMIN
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 truncate mt-0.5">
                  {jobTitle ? `${jobTitle} • ${department}` : 'Staff • GCME'}
                </p>
              </div>

              {/* Edit Toggle Button at Top */}
              <div className="flex-shrink-0">
                {!isEditing ? (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    title="แก้ไขข้อมูลส่วนตัว"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>แก้ไข (Edit)</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      disabled={isSaving}
                      className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>ยกเลิก</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{isSaving ? '...' : 'บันทึก'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Editing helper notice */}
            {isEditing && (
              <div className="p-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-xl flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>โหมดแก้ไข: กรุณาระบุชื่อภาษาอังกฤษ, อีเมลจริง, แผนก และตำแหน่ง แล้วกดปุ่ม <strong>บันทึก</strong> ด้านบนหรือด้านล่าง</span>
              </div>
            )}
          </div>

          <div className="space-y-3">
            {/* English Name Card */}
            <div className="flex items-start gap-3.5 p-3.5 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-800 transition-colors">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg shadow-sm flex-shrink-0 mt-0.5">
                <User className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <label className="block text-[10px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                  English Name (ชื่อภาษาอังกฤษ)
                </label>
                {isEditing ? (
                  <input 
                    type="text" 
                    value={editForm.displayName} 
                    onChange={e => setEditForm({...editForm, displayName: e.target.value})} 
                    placeholder="เช่น Anupong Theerapanich"
                    className="w-full bg-white dark:bg-slate-900 border border-blue-400 dark:border-blue-500 rounded-lg px-2.5 py-1.5 text-sm text-gray-900 dark:text-white mt-1 focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
                ) : (
                  <p className="text-sm font-semibold text-gray-900 dark:text-slate-100 truncate mt-0.5">
                    {displayName || '-'}
                  </p>
                )}
              </div>
            </div>

            {/* Email Address Card */}
            <div className="flex items-start gap-3.5 p-3.5 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-800 transition-colors">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg shadow-sm flex-shrink-0 mt-0.5">
                <Mail className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <label className="block text-[10px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                  Email Address (อีเมล)
                </label>
                {isEditing ? (
                  <input 
                    type="email" 
                    value={editForm.email} 
                    onChange={e => setEditForm({...editForm, email: e.target.value})} 
                    placeholder="เช่น firstname.lastname@pttgcgroup.com"
                    className="w-full bg-white dark:bg-slate-900 border border-blue-400 dark:border-blue-500 rounded-lg px-2.5 py-1.5 text-sm text-gray-900 dark:text-white mt-1 focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
                ) : (
                  <p className="text-sm font-medium text-gray-800 dark:text-slate-200 truncate mt-0.5">
                    {email || '-'}
                  </p>
                )}
              </div>
            </div>

            {/* Department & Job Title in 2-Column Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Department */}
              <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-800 transition-colors">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg shadow-sm flex-shrink-0 mt-0.5">
                  <Building2 className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <label className="block text-[10px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                    Department (แผนก)
                  </label>
                  {isEditing ? (
                    <input 
                      type="text" 
                      value={editForm.department} 
                      onChange={e => setEditForm({...editForm, department: e.target.value})} 
                      placeholder="เช่น EPOPM หรือ GCME"
                      className="w-full bg-white dark:bg-slate-900 border border-blue-400 dark:border-blue-500 rounded-lg px-2 py-1 text-xs text-gray-900 dark:text-white mt-1 focus:ring-2 focus:ring-blue-500 outline-none" 
                    />
                  ) : (
                    <p className="text-xs font-semibold text-gray-800 dark:text-slate-200 truncate mt-0.5" title={department}>
                      {department || '-'}
                    </p>
                  )}
                </div>
              </div>

              {/* Job Title */}
              <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-800 transition-colors">
                <div className="p-2 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg shadow-sm flex-shrink-0 mt-0.5">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <label className="block text-[10px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                    Job Title (ตำแหน่ง)
                  </label>
                  {isEditing ? (
                    <input 
                      type="text" 
                      value={editForm.jobTitle} 
                      onChange={e => setEditForm({...editForm, jobTitle: e.target.value})} 
                      placeholder="เช่น Senior Engineer"
                      className="w-full bg-white dark:bg-slate-900 border border-blue-400 dark:border-blue-500 rounded-lg px-2 py-1 text-xs text-gray-900 dark:text-white mt-1 focus:ring-2 focus:ring-blue-500 outline-none" 
                    />
                  ) : (
                    <p className="text-xs font-semibold text-gray-800 dark:text-slate-200 truncate mt-0.5" title={jobTitle || 'Staff'}>
                      {jobTitle || 'Staff'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Authorized Projects */}
            {!isAdmin && (
              <div className="flex items-start gap-4 p-3.5 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-800 transition-colors">
                <div className="p-2 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg shadow-sm flex-shrink-0">
                  <FolderLock className="w-5 h-5" />
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
                      <span className="text-xs text-gray-400 dark:text-slate-500 italic">No project assignments. (Read Only)</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Authentication / Security Status */}
            <div className="flex items-center gap-4 p-3.5 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-800 transition-colors">
              <div className="p-2 bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-lg shadow-sm flex-shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Authentication / Security</p>
                <div className="flex items-center mt-0.5">
                  {isGCME ? (
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/20 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800/40">
                      <BadgeCheck className="w-3.5 h-3.5 text-blue-500" /> GCME Single Sign-On (Azure AD)
                    </span>
                  ) : userProfile?.isDefaultPassword === false ? (
                    <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1 transition-colors">
                      <ShieldCheck className="w-3 h-3" /> Secure Password
                    </span>
                  ) : userProfile?.isDefaultPassword === true ? (
                    <span className="text-sm font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1 transition-colors">
                      <Key className="w-3 h-3" /> Default Password
                    </span>
                  ) : (
                    <span className="text-sm text-gray-400 dark:text-slate-500">Standard Account</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action List Section */}
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-800 space-y-2 transition-colors">
            
            {/* Prominent Edit Profile Button in Menu */}
            {!isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="w-full flex items-center justify-between p-3 bg-blue-50/70 hover:bg-blue-100/80 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 rounded-xl transition-all group text-left cursor-pointer border border-blue-200/80 dark:border-blue-800/40"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-600 text-white rounded-lg group-hover:scale-105 transition-transform shadow-xs">
                    <Edit2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-blue-900 dark:text-blue-200">แก้ไขข้อมูลส่วนตัว (Edit Profile)</span>
                    <p className="text-[11px] text-blue-700/80 dark:text-blue-300/80">แก้ไขชื่อภาษาอังกฤษ, อีเมล, แผนก, ตำแหน่ง</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-blue-500 group-hover:translate-x-0.5 transition-transform" />
              </button>
            ) : (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-gray-200 dark:border-slate-700 flex items-center justify-between gap-3">
                <span className="text-xs text-gray-600 dark:text-slate-300 font-medium">บันทึกข้อมูลที่แก้ไข</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    disabled={isSaving}
                    className="px-3 py-1.5 bg-white dark:bg-slate-700 hover:bg-gray-100 text-gray-700 dark:text-slate-200 border border-gray-200 dark:border-slate-600 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-1"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Admin Maintenance Option */}
            {isAdmin && (
              <button
                type="button"
                onClick={onOpenAdmin}
                className="w-full flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors group text-left cursor-pointer"
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

            {/* Change Password Option (Standard Login Only) */}
            {!isGCME && (
              <button
                type="button"
                onClick={onChangePassword}
                className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors group text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition-colors">
                    <Key className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700 dark:text-slate-300">Change Password</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-transform group-hover:translate-x-0.5" />
              </button>
            )}

            {/* Sign Out Option */}
            <button
              type="button"
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
