
import React, { useState, useEffect } from 'react';
import { X, Users, Database, Shield, Trash2, Download, RefreshCw, AlertTriangle, CheckCircle, Clock, ShieldAlert, Edit2, Save, FolderLock, UserPlus, Info, Zap } from 'lucide-react';
import { fetchAllUsers, deleteUserRecord, createSystemBackup, updateUserPermissions } from '../services/adminService';
import { isPermissionError, registerWithDefaultPassword } from '../services/firebaseService';
import { PermissionsGuide } from './PermissionsGuide';
import { UserProfile, UserRole } from '../types';
import { BaselineRiskEditor } from './BaselineRiskEditor';

interface AdminPanelProps {
  onClose: () => void;
  currentUserEmail: string;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose, currentUserEmail }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'backup' | 'baseline'>('users');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  // Edit State
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editRole, setEditRole] = useState<UserRole>('User');
  const [editProjects, setEditProjects] = useState('');

  // Registration State
  const [newUserEmail, setNewUserEmail] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers();
    }
  }, [activeTab]);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    setPermissionDenied(false);
    try {
      const data = await fetchAllUsers();
      // Filter out users with missing email (corrupt/incomplete records) and sort
      const validUsers = data.filter(u => u.email);
      validUsers.sort((a, b) => {
        if (a.role === b.role) {
          return (a.email || '').localeCompare(b.email || '');
        }
        return a.role === 'Admin' ? -1 : 1;
      });
      setUsers(validUsers);
    } catch (err: any) {
      if (isPermissionError(err)) {
        setPermissionDenied(true);
      } else {
        setError("Failed to load users.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditPermissions = (user: UserProfile) => {
    setEditingUser(user);
    setEditRole(user.role);
    setEditProjects(user.assignedProjects?.join(', ') || '');
  };

  const handleSavePermissions = async () => {
    if (!editingUser) return;
    setActionLoading(true);
    try {
      const projects = editProjects
        .split(',')
        .map(p => p.trim())
        .filter(p => p !== '');

      await updateUserPermissions(editingUser.id, editRole, projects);

      setUsers(prev => prev.map(u =>
        u.id === editingUser.id
          ? { ...u, role: editRole, assignedProjects: projects }
          : u
      ));
      setEditingUser(null);
    } catch (err) {
      alert("Failed to update permissions.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (uid: string, email: string) => {
    if (email === currentUserEmail) return;
    if (!confirm(`Are you sure you want to delete the profile for ${email}?\n\nNote: This only deletes the database record, not the login account.`)) return;

    setActionLoading(true);
    try {
      await deleteUserRecord(uid);
      setUsers(prev => prev.filter(u => u.id !== uid));
    } catch (err) {
      if (isPermissionError(err)) setPermissionDenied(true);
      else alert("Failed to delete user.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleBackup = async () => {
    setActionLoading(true);
    try {
      const jsonString = await createSystemBackup();
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ProRisk_Backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      if (isPermissionError(err)) setPermissionDenied(true);
      else setError("Backup failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail || !newUserEmail.includes('@')) {
      alert("Please enter a valid email address.");
      return;
    }

    setIsRegistering(true);
    try {
      await registerWithDefaultPassword(newUserEmail.trim().toLowerCase());
      setNewUserEmail('');
      await loadUsers(); // Refresh the list
      alert(`User ${newUserEmail} registered successfully with default password.`);
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        alert("This email is already registered in Authentication.");
      } else {
        console.error("Registration error:", err);
        alert("Failed to register user. " + (err.message || ''));
      }
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden border border-white/10 dark:border-slate-800 transition-all">

        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-slate-800 bg-slate-900 dark:bg-slate-950 text-white flex justify-between items-center transition-colors">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-emerald-400" />
            <div>
              <h2 className="text-xl font-bold">Admin Maintenance</h2>
              <p className="text-xs text-slate-400">System Management & Role-Based Permissions</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50 transition-colors">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'users' ? 'bg-white dark:bg-slate-900 border-t-2 border-t-blue-600 dark:border-t-blue-500 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300'}`}
          >
            <Users className="w-4 h-4" /> User Permissions
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'backup' ? 'bg-white dark:bg-slate-900 border-t-2 border-t-blue-600 dark:border-t-blue-500 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300'}`}
          >
            <Database className="w-4 h-4" /> System Backup
          </button>
          <button
            onClick={() => setActiveTab('baseline')}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'baseline' ? 'bg-white dark:bg-slate-900 border-t-2 border-t-blue-600 dark:border-t-blue-500 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300'}`}
          >
            <Zap className="w-4 h-4" /> Baseline Risks
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 bg-gray-50/50 dark:bg-slate-900/20 transition-colors">

          {permissionDenied ? (
            <div className="space-y-6">
              <div className="bg-red-50 dark:bg-red-900/10 p-6 rounded-lg text-center border border-red-100 dark:border-red-900/30 transition-colors">
                <ShieldAlert className="w-10 h-10 text-red-600 dark:text-red-500 mx-auto mb-2" />
                <h3 className="font-bold text-gray-900 dark:text-slate-100">Access Denied</h3>
                <p className="text-sm text-gray-600 dark:text-slate-400">You must have Admin privileges to access this area.</p>
              </div>
              <PermissionsGuide />
            </div>
          ) : activeTab === 'users' && (
            <div className="space-y-6">
              {/* Quick Add User Form */}
              <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/20 rounded-xl p-5 mb-2 transition-colors">
                <div className="flex items-center gap-2 mb-4 text-blue-700 dark:text-blue-400">
                  <UserPlus className="w-5 h-5" />
                  <h3 className="text-sm font-bold uppercase tracking-wider">Register New User</h3>
                </div>
                <form onSubmit={handleAddUser} className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 relative">
                    <input
                      type="email"
                      placeholder="Enter corporate email (e.g. user@pttgcgroup.com)"
                      className="w-full bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800/40 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:text-slate-100"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isRegistering || !newUserEmail}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                  >
                    {isRegistering ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                    Add Account
                  </button>
                </form>
                <div className="mt-3 flex items-start gap-2 text-[10px] text-blue-600 dark:text-blue-400 italic">
                  <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  <p>New users will be registered with a default password and assigned the 'User' role. They will appear in the list below for further permission adjustments.</p>
                </div>
              </div>

              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-gray-700 dark:text-slate-300">Managed Users ({users.length})</h3>
                  {users.length === 0 && !loading && (
                    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30 text-[10px] font-bold text-amber-600 dark:text-amber-400 animate-pulse">
                      <AlertTriangle className="w-3 h-3" /> Profile Sync Required
                    </span>
                  )}
                </div>
                <button
                  onClick={loadUsers}
                  disabled={loading}
                  className="text-gray-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition"
                  title="Reload User List"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-800">
                  <thead className="bg-gray-50 dark:bg-slate-800/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">User Account</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Assigned Projects</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-800">
                    {loading ? (
                      <tr><td colSpan={4} className="px-6 py-10 text-center text-gray-500 dark:text-slate-400">Loading user database...</td></tr>
                    ) : users.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center transition-colors">
                          <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                            <Info className="w-8 h-8 text-gray-300 dark:text-slate-700" />
                            <p className="text-gray-500 dark:text-slate-400 text-sm font-medium">No system profiles registered yet.</p>
                            <p className="text-[11px] text-gray-400 dark:text-slate-500">
                              Users added directly in Firebase Console must log in once to initialize their profile, or you can register them using the form above.
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      users.map((u) => (
                        <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-bold text-gray-900 dark:text-slate-100">{u.email}</div>
                            <div className="text-[10px] text-gray-400 dark:text-slate-500 font-medium">Joined {new Date(u.createdAt).toLocaleDateString()}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${u.role === 'Admin' ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border-purple-100 dark:border-purple-800/30' : 'bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-400 border-gray-100 dark:border-slate-700'
                              }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {u.role === 'Admin' ? (
                              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded border border-emerald-100 dark:border-emerald-800/30 uppercase tracking-widest">
                                Master Access
                              </span>
                            ) : u.assignedProjects?.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {u.assignedProjects.map(proj => (
                                  <span key={proj} className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded border border-blue-100 dark:border-blue-800/30">
                                    {proj}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400 dark:text-slate-500 italic">None assigned (Read-only)</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleEditPermissions(u)}
                                className="text-gray-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 p-1.5 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 transition"
                                title="Edit Permissions"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              {u.email !== currentUserEmail && (
                                <button
                                  onClick={() => handleDeleteUser(u.id, u.email)}
                                  className="text-gray-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                                  title="Delete User"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!permissionDenied && activeTab === 'backup' && (
            <div className="flex flex-col items-center justify-center h-full py-10 text-center space-y-6">
              <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center transition-colors">
                <Database className="w-10 h-10" />
              </div>
              <div className="max-w-md">
                <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">Full System Backup</h3>
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-2">
                  Generates a JSON file containing all Risk Assessments and User Permission data.
                </p>
              </div>
              <button
                onClick={handleBackup}
                disabled={actionLoading}
                className="flex items-center px-6 py-3 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 shadow-md transition disabled:opacity-50 font-bold uppercase text-xs tracking-widest"
              >
                {actionLoading ? 'Generating...' : (
                  <>
                    <Download className="w-5 h-5 mr-2" /> Download Backup
                  </>
                )}
              </button>
            </div>
          )}

          {!permissionDenied && activeTab === 'baseline' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <BaselineRiskEditor />
            </div>
          )}
        </div>

        {/* Edit Permissions Modal */}
        {editingUser && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200 border border-white/10 dark:border-slate-800 transition-all">
              <div className="p-5 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50 dark:bg-slate-800/50 transition-colors">
                <h3 className="font-black text-gray-800 dark:text-slate-100 uppercase tracking-widest text-xs">Assign Permissions</h3>
                <button onClick={() => setEditingUser(null)} className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"><X size={18} /></button>
              </div>
              <div className="p-6 space-y-5">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1">Editing Account</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-slate-100">{editingUser.email}</p>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest mb-2">System Role</label>
                  <div className="flex gap-2">
                    {['User', 'Admin'].map(r => (
                      <button
                        key={r}
                        onClick={() => setEditRole(r as UserRole)}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all border ${editRole === r ? 'bg-blue-600 dark:bg-blue-700 text-white border-blue-700 dark:border-blue-800 shadow-md' : 'bg-white dark:bg-slate-800 text-gray-500 dark:text-slate-400 border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500'
                          }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {editRole === 'User' && (
                  <div className="animate-in slide-in-from-top-2">
                    <label className="block text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                      <FolderLock size={12} className="text-blue-500 dark:text-blue-400" /> Authorized Project Numbers
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. PJ-001, PJ-002"
                      className="w-full border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-800 dark:text-slate-100 transition-colors"
                      value={editProjects}
                      onChange={(e) => setEditProjects(e.target.value)}
                    />
                    <p className="mt-2 text-[10px] text-gray-400 dark:text-slate-500 italic">
                      Separate multiple project numbers with a comma. Standard users can only modify risks in these projects.
                    </p>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    onClick={handleSavePermissions}
                    disabled={actionLoading}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600 text-white py-3.5 rounded-xl font-bold uppercase text-xs tracking-widest shadow-lg shadow-blue-100 dark:shadow-none disabled:opacity-50 transition-all active:scale-95"
                  >
                    {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Apply Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
