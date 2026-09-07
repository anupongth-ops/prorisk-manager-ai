
import React, { useState, useEffect } from 'react';
import { X, Users, Database, Shield, Trash2, Download, RefreshCw, AlertTriangle, CheckCircle, Clock, ShieldAlert, Edit2, Save, FolderLock, UserPlus, Info, Zap, Mail } from 'lucide-react';
import { fetchAllUsers, deleteUserRecord, createSystemBackup, updateUserPermissions } from '../services/adminService';
import { isPermissionError, registerWithDefaultPassword } from '../services/firebaseService';
import { fetchCompleteDatabase, generatePostgreSqlDump, generateMySqlDump } from '../services/sqlBackupService';
import { PermissionsGuide } from './PermissionsGuide';
import { UserProfile, UserRole, RiskItem } from '../types';
import { BaselineRiskEditor } from './BaselineRiskEditor';
import { OverdueEmailSettings } from './OverdueEmailSettings';

interface AdminPanelProps {
  onClose: () => void;
  currentUserEmail: string;
  existingProjects?: string[]; // list of projectNo strings from useRisks
  allRisks?: RiskItem[];
  uniqueProjectData?: { projectNo: string; projectName: string; pmName: string; email: string }[];
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  onClose,
  currentUserEmail = '',
  existingProjects = [],
  allRisks = [],
  uniqueProjectData = [],
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'backup' | 'baseline' | 'overdue'>('users');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  // Edit State
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editRole, setEditRole] = useState<UserRole>('User');
  const [editProjects, setEditProjects] = useState(''); // legacy fallback
  const [editSelectedProjects, setEditSelectedProjects] = useState<string[]>([]);

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
    try {
      const data = await fetchAllUsers();
      // Filter out users with missing email (corrupt/incomplete records) and sort
      const validUsers = data.filter(u => u.email);
      validUsers.sort((a, b) => {
        const roleOrder: Record<string, number> = { 'Admin': 0, 'Project_Manager': 1, 'User': 2 };
        const roleA = roleOrder[a.role] ?? 2;
        const roleB = roleOrder[b.role] ?? 2;
        if (roleA !== roleB) return roleA - roleB;
        return (a.email || '').localeCompare(b.email || '');
      });
      setUsers(validUsers);
      setPermissionDenied(false);
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
    const assigned = user.assignedProjects || [];
    setEditSelectedProjects(assigned);
    setEditProjects(assigned.join(', ')); // legacy
  };

  const handleSavePermissions = async () => {
    if (!editingUser) return;
    setActionLoading(true);
    try {
      // Use multi-select list for Project_Manager and User roles
      const projects = (editRole === 'Admin')
        ? []
        : editSelectedProjects;

      await updateUserPermissions(editingUser.id, editRole, projects);

      setUsers(prev => prev.map(u =>
        u.id === editingUser.id
          ? { ...u, role: editRole, assignedProjects: projects }
          : u
      ));
      setEditingUser(null);
    } catch (err) {
      alert('Failed to update permissions.');
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

  const [backupStatus, setBackupStatus] = useState<string | null>(null);

  const handleExportSql = async (dialect: 'postgresql' | 'mysql') => {
    setActionLoading(true);
    setBackupStatus(`Fetching all collections from Firestore...`);
    try {
      const fullData = await fetchCompleteDatabase();
      setBackupStatus(`Generating ${dialect === 'postgresql' ? 'PostgreSQL' : 'MySQL'} SQL dump...`);
      
      const sqlContent = dialect === 'postgresql' 
        ? generatePostgreSqlDump(fullData)
        : generateMySqlDump(fullData);

      const blob = new Blob([sqlContent], { type: 'text/sql;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const dateStr = new Date().toISOString().split('T')[0];
      link.download = `ProRisk_Database_${dialect.toUpperCase()}_Backup_${dateStr}.sql`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setBackupStatus(`Downloaded successfully! (${fullData.stats.risksCount} risks, ${fullData.stats.usersCount} users)`);
    } catch (err: any) {
      console.error("SQL Export failed:", err);
      if (isPermissionError(err)) setPermissionDenied(true);
      else alert("Failed to export SQL: " + (err.message || 'Unknown error'));
      setBackupStatus(null);
    } finally {
      setActionLoading(false);
    }
  };

  const handleBackup = async () => {
    setActionLoading(true);
    setBackupStatus("Extracting system backup JSON...");
    try {
      const fullData = await fetchCompleteDatabase();
      const jsonString = JSON.stringify(fullData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ProRisk_Full_Backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setBackupStatus(`JSON Backup downloaded! (${fullData.stats.risksCount} risks, ${fullData.stats.usersCount} users)`);
    } catch (err: any) {
      if (isPermissionError(err)) setPermissionDenied(true);
      else setError("Backup failed.");
      setBackupStatus(null);
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
        alert(
          `อีเมล ${newUserEmail} มีบัญชีอยู่ในระบบ Authentication แล้ว\n\n` +
          `สาเหตุที่ไม่แสดงใน User List: เนื่องจากข้อมูล Profile ในคอลเลกชัน 'users' ของผู้ใช้นี้ยังไม่สมบูรณ์หรือยังไม่เคยซิงค์ข้อมูล\n\n` +
          `วิธีแก้ไข:\n` +
          `1. ให้ผู้ใช้อีเมล ${newUserEmail} กดเข้าสู่ระบบ (Login) ด้วยอีเมลนี้และรหัสผ่านเริ่มต้น\n` +
          `2. ระบบจะทำการสร้าง/ซ่อมแซม Profile ในคอลเลกชัน 'users' ให้อัตโนมัติทันทีที่ล็อกอิน และชื่อจะปรากฏใน User List บนหน้า Admin Panel ครับ`
        );
      } else {
        console.error("Registration error:", err);
        alert("Failed to register user. " + (err.message || ''));
      }
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-200 dark:border-slate-800">

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
        <div className="flex border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50 transition-colors flex-shrink-0">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 py-3 text-xs sm:text-sm font-medium flex items-center justify-center gap-1 sm:gap-2 transition-colors ${activeTab === 'users' ? 'bg-white dark:bg-slate-900 border-t-2 border-t-blue-600 dark:border-t-blue-500 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300'}`}
          >
            <Users className="w-4 h-4" /> <span className="hidden xs:inline">User</span> Permissions
          </button>
          <button
            onClick={() => setActiveTab('overdue')}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'overdue' ? 'bg-white dark:bg-slate-900 border-t-2 border-t-blue-600 dark:border-t-blue-500 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300'}`}
          >
            <Mail className="w-4 h-4 text-red-500" /> Overdue Email Alerts
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

          {/* TAB 1: USER PERMISSIONS */}
          {activeTab === 'users' && (
            permissionDenied ? (
              <div className="space-y-6">
                <div className="bg-red-50 dark:bg-red-900/10 p-6 rounded-xl text-center border border-red-100 dark:border-red-900/30 transition-colors">
                  <ShieldAlert className="w-10 h-10 text-red-600 dark:text-red-500 mx-auto mb-2" />
                  <h3 className="font-bold text-gray-900 dark:text-slate-100 text-base">Access Denied to Users Collection</h3>
                  <p className="text-sm text-gray-600 dark:text-slate-400 max-w-lg mx-auto mt-1">
                    Firestore Security Rules are blocking access to query the user list. You can update your Security Rules in Firebase Console, or continue using other tools (Overdue Email Alerts, System Backup, Baseline Risks) from the menu tabs above.
                  </p>
                  <button
                    onClick={loadUsers}
                    disabled={loading}
                    className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition inline-flex items-center gap-2 shadow-sm"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    {loading ? 'Retrying...' : 'Retry Loading Users'}
                  </button>
                </div>
                <PermissionsGuide />
              </div>
            ) : (
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

              <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 shadow-sm overflow-x-auto transition-all">
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
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${
                              u.role === 'Admin'
                                ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border-purple-100 dark:border-purple-800/30'
                                : u.role === 'Project_Manager'
                                ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/30'
                                : 'bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-400 border-gray-100 dark:border-slate-700'
                            }`}>
                              {u.role === 'Project_Manager' ? 'PM' : u.role}
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
          ))}

          {/* TAB 2: OVERDUE EMAIL ALERTS */}
          {activeTab === 'overdue' && (
            <OverdueEmailSettings
              allRisks={allRisks}
              existingProjects={uniqueProjectData}
              currentUserEmail={currentUserEmail}
            />
          )}

          {/* TAB 3: SYSTEM BACKUP & SQL MIGRATION */}
          {activeTab === 'backup' && (
            <div className="space-y-6 max-w-4xl mx-auto py-4">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto transition-colors shadow-inner">
                  <Database className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100">Database Backup & SQL Migration</h3>
                <p className="text-sm text-gray-500 dark:text-slate-400 max-w-xl mx-auto">
                  Export live Firestore database collections directly into production-ready SQL scripts or full JSON snapshots.
                </p>
                {backupStatus && (
                  <div className="inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold px-4 py-2 rounded-full animate-in fade-in">
                    <CheckCircle className="w-4 h-4" />
                    <span>{backupStatus}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
                {/* Card 1: PostgreSQL */}
                <div className="bg-white dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                        PostgreSQL
                      </span>
                      <span className="text-xs font-mono text-gray-400">.sql</span>
                    </div>
                    <h4 className="font-bold text-gray-900 dark:text-slate-100 text-base">PostgreSQL / Supabase / AWS RDS</h4>
                    <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
                      Complete DDL schema, tables (`users`, `risks`, `risk_history`, `baseline_risks`, `tor_projects`), arrays, and JSONB relations.
                    </p>
                  </div>
                  <button
                    onClick={() => handleExportSql('postgresql')}
                    disabled={actionLoading}
                    className="mt-6 w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 shadow-sm uppercase tracking-wider"
                  >
                    <Download className="w-4 h-4" />
                    Export PostgreSQL
                  </button>
                </div>

                {/* Card 2: MySQL */}
                <div className="bg-white dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                        MySQL
                      </span>
                      <span className="text-xs font-mono text-gray-400">.sql</span>
                    </div>
                    <h4 className="font-bold text-gray-900 dark:text-slate-100 text-base">MySQL / MariaDB</h4>
                    <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
                      Optimized for MySQL 8.0+ / MariaDB with `InnoDB`, `utf8mb4`, JSON columns, and `ON DUPLICATE KEY UPDATE` syntax.
                    </p>
                  </div>
                  <button
                    onClick={() => handleExportSql('mysql')}
                    disabled={actionLoading}
                    className="mt-6 w-full flex items-center justify-center gap-2 py-3 px-4 bg-amber-600 hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 shadow-sm uppercase tracking-wider"
                  >
                    <Download className="w-4 h-4" />
                    Export MySQL
                  </button>
                </div>

                {/* Card 3: JSON Full Backup */}
                <div className="bg-white dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                        Snapshot
                      </span>
                      <span className="text-xs font-mono text-gray-400">.json</span>
                    </div>
                    <h4 className="font-bold text-gray-900 dark:text-slate-100 text-base">Full JSON Snapshot</h4>
                    <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
                      Raw JSON export containing all collections with exact document structures and metadata for restoration or archiving.
                    </p>
                  </div>
                  <button
                    onClick={handleBackup}
                    disabled={actionLoading}
                    className="mt-6 w-full flex items-center justify-center gap-2 py-3 px-4 bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 shadow-sm uppercase tracking-wider"
                  >
                    <Download className="w-4 h-4" />
                    Export JSON
                  </button>
                </div>
              </div>

              <div className="bg-blue-50/60 dark:bg-slate-800/50 border border-blue-100 dark:border-slate-700 rounded-xl p-4 text-xs text-gray-600 dark:text-slate-400 flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-gray-800 dark:text-slate-200">How to restore or import SQL:</span>
                  <p className="mt-1">
                    Open your SQL terminal and execute: <code className="bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-gray-200 dark:border-slate-700 font-mono text-blue-600 dark:text-blue-400">psql -U postgres -d prorisk &lt; filename.sql</code> for PostgreSQL, or <code className="bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-gray-200 dark:border-slate-700 font-mono text-amber-600 dark:text-amber-400">mysql -u root -p prorisk &lt; filename.sql</code> for MySQL.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: BASELINE RISKS */}
          {activeTab === 'baseline' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <BaselineRiskEditor />
            </div>
          )}
        </div>

        {/* Edit Permissions Modal */}
        {editingUser && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto my-auto animate-in zoom-in duration-200 border border-white/10 dark:border-slate-800 transition-all">
              {/* Header */}
              <div className="p-5 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50 dark:bg-slate-800/50 transition-colors">
                <h3 className="font-black text-gray-800 dark:text-slate-100 uppercase tracking-widest text-xs">Assign Permissions</h3>
                <button onClick={() => setEditingUser(null)} className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"><X size={18} /></button>
              </div>

              <div className="p-6 space-y-5">
                {/* Editing account */}
                <div>
                  <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1">Editing Account</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-slate-100">{editingUser.email}</p>
                </div>

                {/* Role selector: 3 roles */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest mb-2">System Role</label>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { key: 'User', label: 'User', desc: 'Read-only, no edit' },
                      { key: 'Project_Manager', label: 'Project\nManager', desc: 'Edit assigned projects' },
                      { key: 'Admin', label: 'Admin', desc: 'Full access' },
                    ] as { key: UserRole; label: string; desc: string }[]).map(r => (
                      <button
                        key={r.key}
                        onClick={() => {
                          setEditRole(r.key);
                          if (r.key === 'Admin') setEditSelectedProjects([]);
                        }}
                        className={`flex flex-col items-center py-3 px-2 rounded-xl text-xs font-bold transition-all border ${
                          editRole === r.key
                            ? r.key === 'Admin'
                              ? 'bg-purple-600 text-white border-purple-700 shadow-md'
                              : r.key === 'Project_Manager'
                              ? 'bg-emerald-600 text-white border-emerald-700 shadow-md'
                              : 'bg-blue-600 text-white border-blue-700 shadow-md'
                            : 'bg-white dark:bg-slate-800 text-gray-500 dark:text-slate-400 border-gray-200 dark:border-slate-700 hover:border-blue-300'
                        }`}
                      >
                        <span className="whitespace-pre-line text-center leading-tight">{r.label}</span>
                        <span className={`mt-1 text-[9px] font-normal text-center leading-tight ${
                          editRole === r.key ? 'text-white/80' : 'text-gray-400 dark:text-slate-500'
                        }`}>{r.desc}</span>
                      </button>
                    ))}
                  </div>

                  {/* Role description banner */}
                  <div className={`mt-3 p-3 rounded-lg text-[11px] flex items-start gap-2 ${
                    editRole === 'Admin'
                      ? 'bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800/30 text-purple-700 dark:text-purple-400'
                      : editRole === 'Project_Manager'
                      ? 'bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30 text-emerald-700 dark:text-emerald-400'
                      : 'bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30 text-blue-700 dark:text-blue-400'
                  }`}>
                    <Info size={12} className="flex-shrink-0 mt-0.5" />
                    <span>
                      {editRole === 'Admin' && 'Full system access — can view and edit all projects, manage users, and access admin tools.'}
                      {editRole === 'Project_Manager' && 'Can add, edit, and delete risks only in their assigned projects. Cannot manage users or access admin tools.'}
                      {editRole === 'User' && 'Read-only access to all visible projects. Cannot create or edit any risk items.'}
                    </span>
                  </div>
                </div>

                {/* Project multi-select (shown for User and Project_Manager) */}
                {(editRole === 'User' || editRole === 'Project_Manager') && (
                  <div className="animate-in slide-in-from-top-2">
                    <label className="block text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                      <FolderLock size={12} className="text-blue-500 dark:text-blue-400" />
                      Authorized Project Numbers
                      {editSelectedProjects.length > 0 && (
                        <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
                          {editSelectedProjects.length} selected
                        </span>
                      )}
                    </label>

                    {existingProjects.length === 0 ? (
                      <div className="p-3 rounded-xl border border-dashed border-gray-200 dark:border-slate-700 text-center text-xs text-gray-400 dark:text-slate-500">
                        No projects in database yet. Create a project first.
                      </div>
                    ) : (
                      <div className="border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden">
                        {/* Select all / clear buttons */}
                        <div className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
                          <span className="text-[10px] text-gray-500 dark:text-slate-400">Select projects to authorize</span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setEditSelectedProjects([...existingProjects])}
                              className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                            >All</button>
                            <span className="text-gray-300 dark:text-slate-600">|</span>
                            <button
                              onClick={() => setEditSelectedProjects([])}
                              className="text-[10px] font-bold text-gray-400 dark:text-slate-500 hover:underline"
                            >None</button>
                          </div>
                        </div>
                        {/* Project checkboxes */}
                        <div className="max-h-48 overflow-y-auto divide-y divide-gray-100 dark:divide-slate-800">
                          {existingProjects.map(proj => {
                            const checked = editSelectedProjects.includes(proj);
                            return (
                              <label
                                key={proj}
                                className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${
                                  checked
                                    ? 'bg-blue-50 dark:bg-blue-900/20'
                                    : 'hover:bg-gray-50 dark:hover:bg-slate-800/50'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => {
                                    setEditSelectedProjects(prev =>
                                      prev.includes(proj)
                                        ? prev.filter(p => p !== proj)
                                        : [...prev, proj]
                                    );
                                  }}
                                  className="w-4 h-4 rounded border-gray-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                                />
                                <span className={`text-sm font-medium ${
                                  checked
                                    ? 'text-blue-700 dark:text-blue-300'
                                    : 'text-gray-700 dark:text-slate-300'
                                }`}>{proj}</span>
                                {checked && (
                                  <span className="ml-auto text-[9px] font-bold text-blue-500 dark:text-blue-400 uppercase">✓</span>
                                )}
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    <p className="mt-2 text-[10px] text-gray-400 dark:text-slate-500 italic">
                      {editRole === 'Project_Manager'
                        ? 'Project Managers can add, edit, and delete risks in the selected projects.'
                        : 'Users with no projects selected will have read-only access.'}
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
