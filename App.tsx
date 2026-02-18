
import React, { useState, useEffect, useMemo, useCallback, Suspense, lazy } from 'react';
import { RiskItem, RiskSnapshot, RiskChange, getRiskLevel, getRiskLevelColor, UserProfile } from './types';
import { RiskHistory } from './components/RiskHistory';
import { RiskMatrix } from './components/RiskMatrix';
import { ProjectForm } from './components/ProjectForm';
import { RiskBarChart } from './components/RiskBarChart';
import { StatusBarChart } from './components/StatusBarChart';
import { OverdueRiskChart } from './components/OverdueRiskChart';
import { LoginPage } from './components/LoginPage';
import { ChangePasswordScreen } from './components/ChangePasswordScreen';
import { PermissionsGuide } from './components/PermissionsGuide';
import { Plus, Filter, History, Edit2, Trash2, Search, AlertOctagon, FileText, Loader2, UploadCloud, ChevronUp, ChevronDown, ArrowUpDown, LogOut, User, Settings, ShieldAlert, FolderPlus, TrendingDown, ShieldCheck, Lock, Shield, Sun, Moon, X } from 'lucide-react';
import { subscribeToRisks, saveRiskToFirestore, deleteRiskFromFirestore, onAuthStateChange, logoutUser, checkUserNeedsPasswordChange, isPermissionError, batchSaveRisks, fetchUserProfile, assignProjectToUser, updateProjectDetails, syncBaselineRisks, registerListener, unregisterListener, fetchBaselineRisks } from './services/firebaseService';
import { generateBaselineRiskItems } from './services/riskBaselineService';
import { ProjectModifier, BASELINE_RISKS, PROJECT_MODIFIERS } from './constants/riskConstants';
import { getIndustryBaselineScores } from './services/riskBaselineService';

// Lazy-loaded heavy components (code splitting)
const RiskForm = lazy(() => import('./components/RiskForm').then(m => ({ default: m.RiskForm })));
const RiskSummary = lazy(() => import('./components/RiskSummary').then(m => ({ default: m.RiskSummary })));
const RiskImportModal = lazy(() => import('./components/RiskImportModal').then(m => ({ default: m.RiskImportModal })));
const AdminPanel = lazy(() => import('./components/AdminPanel').then(m => ({ default: m.AdminPanel })));
const UserAccountPage = lazy(() => import('./components/UserAccountPage').then(m => ({ default: m.UserAccountPage })));
const BaselineComparisonMatrix = lazy(() => import('./components/BaselineComparisonMatrix').then(m => ({ default: m.BaselineComparisonMatrix })));

// Loading fallback component
const ModalLoader = () => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-xl flex items-center gap-3">
      <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      <span className="text-gray-700 dark:text-gray-200">Loading...</span>
    </div>
  </div>
);

function App() {
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(false);

  const [risks, setRisks] = useState<RiskItem[]>([]);
  const [editingRisk, setEditingRisk] = useState<RiskItem | undefined>(undefined);
  const [editingProject, setEditingProject] = useState<{ projectNo: string, projectName: string, pmName: string, email: string, industryType?: string } | undefined>(undefined);
  const [showForm, setShowForm] = useState(false);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showUserAccount, setShowUserAccount] = useState(false);
  const [viewHistoryRisk, setViewHistoryRisk] = useState<RiskItem | null>(null);
  const [projectFilter, setProjectFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [showBenchmark, setShowBenchmark] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  const [prefilledProject, setPrefilledProject] = useState<{ projectNo: string, projectName: string, pmName: string, email: string, industryType?: string } | null>(null);

  // Sorting State
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'riskId',
    direction: 'asc'
  });

  const [matrixFilter, setMatrixFilter] = useState<{
    impact: number;
    likelihood: number;
    mode: 'initial' | 'residual';
  } | null>(null);

  // Auth Listener
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChange(async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        setCheckingProfile(true);
        try {
          const profile = await fetchUserProfile(currentUser.uid);
          setUserProfile(profile);
          const needsChange = await checkUserNeedsPasswordChange(currentUser.uid);
          setMustChangePassword(needsChange);
        } catch (err) {
          if (isPermissionError(err)) setPermissionDenied(true);
        } finally {
          setCheckingProfile(false);
        }
      } else {
        setUserProfile(null);
        setMustChangePassword(false);
        setPermissionDenied(false);
      }

      setAuthLoading(false);
    });
    return () => unsubscribeAuth();
  }, []);

  // Theme Synchronizer
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Risks Data Subscription
  useEffect(() => {
    if (!user || mustChangePassword) {
      setRisks([]);
      return;
    }

    const unsubscribeRisks = subscribeToRisks(
      (updatedRisks) => {
        setRisks(updatedRisks);
        setIsLoading(false);
        setPermissionDenied(false);
      },
      (error) => {
        if (isPermissionError(error)) {
          setPermissionDenied(true);
          setIsLoading(false);
        }
      }
    );

    // Register listener for cleanup on logout
    registerListener('risks-subscription', unsubscribeRisks);

    return () => {
      unsubscribeRisks();
      unregisterListener('risks-subscription');
    };
  }, [user, mustChangePassword]);

  // --- Permission Helpers ---
  const isAdmin = userProfile?.role === 'Admin';

  const canModifyProject = (projectNo: string) => {
    if (isAdmin) return true;
    return userProfile?.assignedProjects?.includes(projectNo);
  };

  const calculateRiskChanges = (oldRisk: RiskItem, newRisk: RiskItem): RiskChange[] => {
    const changes: RiskChange[] = [];
    const ignoreFields = ['history', 'updatedAt', 'id', 'initialRisk', 'residualRisk', 'createdBy', 'lastUpdatedBy'];

    Object.keys(oldRisk).forEach((key) => {
      if (ignoreFields.includes(key)) return;
      const k = key as keyof RiskItem;
      if (oldRisk[k] !== newRisk[k]) {
        changes.push({ field: key, oldValue: oldRisk[k], newValue: newRisk[k] });
      }
    });

    if (oldRisk.initialRisk.impact !== newRisk.initialRisk.impact) changes.push({ field: 'initialRisk.impact', oldValue: oldRisk.initialRisk.impact, newValue: newRisk.initialRisk.impact });
    if (oldRisk.initialRisk.likelihood !== newRisk.initialRisk.likelihood) changes.push({ field: 'initialRisk.likelihood', oldValue: oldRisk.initialRisk.likelihood, newValue: newRisk.initialRisk.likelihood });
    if (oldRisk.residualRisk.impact !== newRisk.residualRisk.impact) changes.push({ field: 'residualRisk.impact', oldValue: oldRisk.residualRisk.impact, newValue: newRisk.residualRisk.impact });
    if (oldRisk.residualRisk.likelihood !== newRisk.residualRisk.likelihood) changes.push({ field: 'residualRisk.likelihood', oldValue: oldRisk.residualRisk.likelihood, newValue: newRisk.residualRisk.likelihood });

    return changes;
  };

  const handleSaveRisk = async (updatedRisk: RiskItem) => {
    if (!canModifyProject(updatedRisk.projectNo)) {
      alert("Access Denied: You do not have permission to modify risks for this project.");
      return;
    }

    try {
      let finalRisk = {
        ...updatedRisk,
        lastUpdatedBy: user?.email || 'System'
      };
      const exists = risks.find(r => r.id === updatedRisk.id);

      if (exists) {
        const changes = calculateRiskChanges(exists, updatedRisk);
        if (changes.length > 0) {
          const snapshot: RiskSnapshot = {
            versionId: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            updatedBy: user?.email || 'System',
            changes: changes
          };
          finalRisk = { ...finalRisk, updatedAt: new Date().toISOString(), history: [...exists.history, snapshot] };
        } else {
          finalRisk = { ...finalRisk, updatedAt: new Date().toISOString() };
        }
      } else {
        // New Risk creation
        finalRisk = {
          ...finalRisk,
          createdBy: user?.email || 'System',
          updatedAt: new Date().toISOString()
        };
      }

      await saveRiskToFirestore(finalRisk);
      setShowForm(false);
      setEditingRisk(undefined);
      setPrefilledProject(null);
    } catch (error) {
      if (isPermissionError(error)) {
        setPermissionDenied(true);
      } else {
        alert("Failed to save risk. Please check your connection.");
      }
      console.error(error);
    }
  };

  const handleDelete = async (risk: RiskItem) => {
    if (!canModifyProject(risk.projectNo)) {
      alert("Access Denied: You do not have permission to delete this risk.");
      return;
    }

    if (confirm('Are you sure you want to delete this risk?')) {
      try {
        await deleteRiskFromFirestore(risk.id);
      } catch (error) {
        if (isPermissionError(error)) setPermissionDenied(true);
        else alert("Failed to delete risk.");
      }
    }
  };

  const handleSort = useCallback((key: string) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.error("Logout failed", error);
    }
  }, []);

  const uniqueProjectData = useMemo(() => {
    const map = new Map<string, { projectNo: string, projectName: string, pmName: string, email: string, industryType?: string, appliedModifiers?: string[] }>();
    risks.forEach(r => {
      if (r.projectNo) {
        map.set(r.projectNo, {
          projectNo: r.projectNo,
          projectName: r.projectName,
          pmName: r.pmName,
          email: r.email,
          industryType: r.industryType,
          appliedModifiers: r.appliedModifiers
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.projectNo.localeCompare(b.projectNo));
  }, [risks]);

  const uniqueProjectNos = useMemo(() => uniqueProjectData.map(p => p.projectNo), [uniqueProjectData]);

  const filteredRisks = useMemo(() => {
    let result = risks.filter(r => {
      const matchesProject = projectFilter === 'All' || r.projectNo === projectFilter;
      const matchesSearch =
        r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.riskId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.owner.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesMatrix = !matrixFilter || (
        matrixFilter.mode === 'initial'
          ? (r.initialRisk.impact === matrixFilter.impact && r.initialRisk.likelihood === matrixFilter.likelihood)
          : (r.residualRisk.impact === matrixFilter.impact && r.residualRisk.likelihood === matrixFilter.likelihood)
      );

      return matchesProject && matchesSearch && matchesMatrix;
    });

    result.sort((a, b) => {
      if (sortConfig.key === 'riskId') {
        return sortConfig.direction === 'asc'
          ? a.riskId.localeCompare(b.riskId, undefined, { numeric: true, sensitivity: 'base' })
          : b.riskId.localeCompare(a.riskId, undefined, { numeric: true, sensitivity: 'base' });
      }
      return 0;
    });

    return result;
  }, [risks, projectFilter, searchQuery, sortConfig, matrixFilter]);

  const currentBaselineScores = useMemo(() => {
    if (projectFilter === 'All') return [];
    const proj = uniqueProjectData.find(p => p.projectNo === projectFilter);
    if (!proj) return [];
    const mods = PROJECT_MODIFIERS.filter(m => proj.appliedModifiers?.includes(m.item));
    return getIndustryBaselineScores(proj.industryType || 'Power Plants', mods);
  }, [projectFilter, uniqueProjectData]);

  const getNextRiskId = () => {
    if (risks.length === 0) return 'R-001';
    const existingIds = risks.map(r => {
      const match = r.riskId.match(/R-(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    }).filter(n => !isNaN(n));
    if (existingIds.length === 0) return 'R-001';
    const maxId = Math.max(...existingIds);
    return `R-${String(maxId + 1).padStart(3, '0')}`;
  };

  const getRiskBadge = (impact: number, likelihood: number) => {
    const level = getRiskLevel(impact, likelihood);
    const colorClass = getRiskLevelColor(level);
    return (
      <div className="flex flex-col items-center">
        <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${colorClass} whitespace-nowrap`}>{level}</span>
        <span className="text-[10px] text-gray-400 mt-0.5">I:{impact} / L:{likelihood}</span>
      </div>
    );
  };

  const handleCreateProject = async (
    project: { projectNo: string, projectName: string, pmName: string, email: string, industryType?: string },
    copySourceProjectNo?: string,
    modifiers?: ProjectModifier[]
  ) => {
    setIsLoading(true);
    try {
      if (copySourceProjectNo) {
        const sourceRisks = risks.filter(r => r.projectNo === copySourceProjectNo);
        if (sourceRisks.length > 0) {
          const clonedRisks: RiskItem[] = sourceRisks.map(r => ({
            ...r,
            id: crypto.randomUUID(),
            projectNo: project.projectNo,
            projectName: project.projectName,
            pmName: project.pmName,
            email: project.email,
            industryType: project.industryType || '',
            history: [],
            createdBy: user?.email || 'System',
            lastUpdatedBy: user?.email || 'System',
            updatedAt: new Date().toISOString()
          }));
          await batchSaveRisks(clonedRisks);
        }
      } else if (modifiers && modifiers.length > 0) {
        // Fetch current baseline risks from Firestore
        const currentBaseline = await fetchBaselineRisks();

        // Generate baseline risks
        const baselineRisks = generateBaselineRiskItems(
          {
            projectNo: project.projectNo,
            projectName: project.projectName,
            pmName: project.pmName,
            email: project.email,
            industryType: project.industryType || 'Power Plants'
          },
          modifiers,
          user?.email || 'System',
          currentBaseline // Pass the dynamic baseline
        );
        await batchSaveRisks(baselineRisks);
      }

      // Automatically grant ownership to the current user
      if (userProfile && !isAdmin) {
        await assignProjectToUser(userProfile.id, project.projectNo);
        // Update local profile state for immediate effect
        setUserProfile(prev => prev ? {
          ...prev,
          assignedProjects: [...new Set([...prev.assignedProjects, project.projectNo])]
        } : null);
      }

      setPrefilledProject(project);
      setShowProjectForm(false);
      setShowForm(true);
    } catch (error) {
      alert("Failed to create project data.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProject = async (
    project: { projectNo: string, projectName: string, pmName: string, email: string, industryType?: string, appliedModifiers?: string[] },
    _?: string,
    modifiers?: ProjectModifier[]
  ) => {
    setIsLoading(true);
    try {
      if (!canModifyProject(project.projectNo)) {
        alert("Access Denied: You do not have permission to modify this project.");
        return;
      }

      await updateProjectDetails(project.projectNo, project);

      // Check if we should re-sync baseline risks
      if (modifiers && modifiers.length > 0) {
        const shouldSync = window.confirm(
          "Project context has changed. Would you like to re-calculate (re-sync) the baseline risk scores for this project?"
        );
        if (shouldSync) {
          await syncBaselineRisks(project.projectNo, project.industryType || 'Power Plants', modifiers);
        }
      }

      setShowProjectForm(false);
      setEditingProject(undefined);
    } catch (error) {
      alert("Failed to update project details.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Render Auth Guard ---
  if (authLoading || checkingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 transition-colors">
        <div className="flex flex-col items-center">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
          <p className="text-gray-500 dark:text-slate-400 text-sm">Verifying credentials and profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  if (mustChangePassword) {
    return (
      <ChangePasswordScreen
        onSuccess={() => setMustChangePassword(false)}
        onCancel={() => setMustChangePassword(false)}
      />
    );
  }

  // --- Render Main App ---
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col transition-colors duration-300">
      {/* Navbar */}
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
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 hidden group-hover:block z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-3 border-b border-gray-50 mb-1">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Logged in as</p>
                    {isAdmin && <ShieldCheck className="w-3 h-3 text-emerald-500" />}
                  </div>
                  <p className="text-sm font-medium text-gray-900 truncate">{user.email}</p>
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

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">

        {permissionDenied ? (
          <div className="space-y-6">
            <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
              <ShieldAlert className="w-12 h-12 text-red-600 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900">Permission Denied</h2>
              <p className="text-gray-600 mt-2">
                The application cannot read or write data because of Firestore Security Rules.
              </p>
            </div>
            <PermissionsGuide />
          </div>
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
            <p className="text-gray-500">Loading risks from database...</p>
          </div>
        ) : (
          <>
            {/* Dashboard Section */}
            <div className="space-y-8 mb-12">
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
                {/* Stats & Title */}
                <div className="xl:col-span-3 space-y-4">
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm h-full flex flex-col transition-colors">
                    <h2 className="text-lg font-extrabold text-gray-800 dark:text-slate-100 flex items-center gap-2">
                      Dashboard
                    </h2>
                    <p className="text-[11px] text-gray-400 mt-0.5 uppercase tracking-wider font-bold">
                      {projectFilter === 'All' ? 'Consolidated Data' : (
                        <span className="flex items-center gap-2">
                          {projectFilter}
                          {uniqueProjectData.find(p => p.projectNo === projectFilter)?.industryType && (
                            <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded text-[9px] border border-blue-100 normal-case font-medium">
                              {uniqueProjectData.find(p => p.projectNo === projectFilter)?.industryType}
                            </span>
                          )}
                        </span>
                      )}
                    </p>

                    {/* Applied Modifiers Column Display */}
                    {projectFilter !== 'All' && uniqueProjectData.find(p => p.projectNo === projectFilter)?.appliedModifiers && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {uniqueProjectData.find(p => p.projectNo === projectFilter)?.appliedModifiers?.map(mod => (
                          <span key={mod} className="bg-white text-gray-400 px-1.5 py-0.5 rounded-[4px] text-[7px] border border-gray-100 uppercase tracking-tighter font-bold shadow-sm">
                            {mod}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-3 mt-6 flex-1">
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
                        <span className="text-[10px] text-gray-400 dark:text-slate-500 uppercase font-bold tracking-widest">Total Risks</span>
                        <span className="text-xl font-black text-gray-900 dark:text-slate-100">{filteredRisks.length}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/10 rounded-lg">
                        <span className="text-[10px] text-green-600/60 dark:text-green-400/60 uppercase font-bold tracking-widest">Closed</span>
                        <span className="text-xl font-black text-green-600 dark:text-green-400">
                          {filteredRisks.filter(r => r.status === 'Closed').length}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/10 rounded-lg">
                        <span className="text-[10px] text-red-600/60 dark:text-red-400/60 uppercase font-bold tracking-widest">Severe Risks</span>
                        <span className="text-xl font-black text-red-600 dark:text-red-400">
                          {filteredRisks.filter(r => getRiskLevel(r.residualRisk.impact, r.residualRisk.likelihood) === 'Extreme' || getRiskLevel(r.residualRisk.impact, r.residualRisk.likelihood) === 'Critical').length}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Comparison Bar Chart */}
                <div className="xl:col-span-9">
                  <RiskBarChart risks={filteredRisks} />
                </div>
              </div>

              {/* Status & Overdue Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-12 gap-6 items-stretch">
                <div className="xl:col-span-6">
                  <StatusBarChart
                    risks={filteredRisks}
                    comparisonRisks={projectFilter !== 'All' ? risks : undefined}
                  />
                </div>
                <div className="xl:col-span-6">
                  <OverdueRiskChart risks={filteredRisks} />
                </div>
              </div>

              {/* Heatmaps Comparison - Side by Side */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {showBenchmark && projectFilter !== 'All' ? (
                  <>
                    <RiskMatrix
                      risks={filteredRisks}
                      mode="residual"
                      title="Project Actual Risk Matrix"
                      onSelect={(i, l) => setMatrixFilter({ impact: i, likelihood: l, mode: 'residual' })}
                      selectedImpact={matrixFilter?.mode === 'residual' ? matrixFilter.impact : undefined}
                      selectedLikelihood={matrixFilter?.mode === 'residual' ? matrixFilter.likelihood : undefined}
                    />
                    <BaselineComparisonMatrix
                      actualRisks={filteredRisks}
                      baselineScores={currentBaselineScores}
                    />
                  </>
                ) : (
                  <>
                    <RiskMatrix
                      risks={filteredRisks}
                      mode="initial"
                      title="Initial Risk Heatmap (Pre-Mitigation)"
                      onSelect={(i, l) => setMatrixFilter({ impact: i, likelihood: l, mode: 'initial' })}
                      selectedImpact={matrixFilter?.mode === 'initial' ? matrixFilter.impact : undefined}
                      selectedLikelihood={matrixFilter?.mode === 'initial' ? matrixFilter.likelihood : undefined}
                    />
                    <RiskMatrix
                      risks={filteredRisks}
                      mode="residual"
                      title="Residual Risk Heatmap (Post-Mitigation)"
                      onSelect={(i, l) => setMatrixFilter({ impact: i, likelihood: l, mode: 'residual' })}
                      selectedImpact={matrixFilter?.mode === 'residual' ? matrixFilter.impact : undefined}
                      selectedLikelihood={matrixFilter?.mode === 'residual' ? matrixFilter.likelihood : undefined}
                    />
                  </>
                )}
              </div>
            </div>

            <div className="h-px bg-gray-200 w-full mb-8"></div>

            {/* Filters & Table Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1 rounded-lg border border-gray-200 dark:border-slate-800 shadow-sm transition-colors">
                <div className="px-3 py-2 border-r border-gray-100 dark:border-slate-800 text-gray-500 dark:text-slate-400">
                  <Filter className="w-4 h-4" />
                </div>
                <select
                  className="px-2 py-1 bg-transparent text-sm font-medium text-gray-700 dark:text-slate-200 outline-none cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                  value={projectFilter}
                  onChange={(e) => setProjectFilter(e.target.value)}
                >
                  <option value="All" className="dark:bg-slate-900">All Projects</option>
                  {uniqueProjectNos.map(p => <option key={p} value={p} className="dark:bg-slate-900">{p}</option>)}
                </select>

                {projectFilter !== 'All' && (
                  <button
                    onClick={() => {
                      const proj = uniqueProjectData.find(p => p.projectNo === projectFilter);
                      if (proj) {
                        setEditingProject(proj);
                        setShowProjectForm(true);
                      }
                    }}
                    className="ml-1 p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors border-l border-gray-100"
                    title="Edit Project Details"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}

                {projectFilter !== 'All' && (
                  <button
                    onClick={() => setShowBenchmark(!showBenchmark)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm border ${showBenchmark
                      ? 'bg-blue-600 border-blue-600 text-white shadow-blue-100'
                      : 'bg-white border-gray-200 text-gray-400 hover:border-blue-400 hover:text-blue-600'
                      }`}
                  >
                    <TrendingDown className="w-3.5 h-3.5" />
                    {showBenchmark ? 'Close Benchmark' : 'Industry Benchmark'}
                  </button>
                )}

                {matrixFilter && (
                  <button
                    onClick={() => setMatrixFilter(null)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-all shadow-sm animate-in fade-in zoom-in duration-200"
                  >
                    <X className="w-3 h-3" />
                    Clear Matrix: {matrixFilter.mode === 'initial' ? 'Initial' : 'Residual'} ({matrixFilter.impact}x{matrixFilter.likelihood})
                  </button>
                )}
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-500 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search risks..."
                  className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-blue-500 dark:text-slate-200 outline-none shadow-sm transition-colors"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden transition-colors">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-800">
                  <thead className="bg-gray-50 dark:bg-slate-800/50">
                    <tr>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition select-none group"
                        onClick={() => handleSort('riskId')}
                      >
                        <div className="flex items-center gap-1">
                          Risk ID
                          {sortConfig.key === 'riskId' ? (
                            sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 text-blue-600" /> : <ChevronDown className="w-3 h-3 text-blue-600" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-gray-300 group-hover:text-gray-400" />
                          )}
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Project</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider w-1/3">Description</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Initial</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Residual</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-800 transition-colors">
                    {filteredRisks.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-slate-500">
                          No risks found matching your criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredRisks.map(risk => {
                        const canModify = canModifyProject(risk.projectNo);
                        return (
                          <tr key={risk.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors group/row border-b border-gray-100 dark:border-slate-800/50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-slate-100">{risk.riskId}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">
                              <div className="flex items-center gap-1.5">
                                {risk.projectNo}
                                {!canModify && <Lock className="w-2.5 h-2.5 text-gray-300 dark:text-slate-600" title="Read Only Access" />}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-slate-300 max-w-xs truncate" title={risk.description}>{risk.description}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              {getRiskBadge(risk.initialRisk.impact, risk.initialRisk.likelihood)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              {getRiskBadge(risk.residualRisk.impact, risk.residualRisk.likelihood)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${risk.status === 'Open' ? 'bg-red-100 text-red-800' :
                                risk.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-green-100 text-green-800'
                                }`}>
                                {risk.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center justify-end gap-2">
                                <button onClick={() => setViewHistoryRisk(risk)} className="text-gray-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 p-1" title="History"><History className="w-4 h-4" /></button>

                                <button
                                  onClick={() => { setEditingRisk(risk); setShowForm(true); setPrefilledProject(null); }}
                                  className={`p-1 transition-colors ${canModify ? 'text-gray-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400' : 'text-gray-200 dark:text-slate-800 cursor-not-allowed'}`}
                                  disabled={!canModify}
                                  title={canModify ? "Edit Risk" : "Read Only"}
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>

                                <button
                                  onClick={() => handleDelete(risk)}
                                  className={`p-1 transition-colors ${canModify ? 'text-gray-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400' : 'text-gray-200 dark:text-slate-800 cursor-not-allowed'}`}
                                  disabled={!canModify}
                                  title={canModify ? "Delete Risk" : "Read Only"}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Modals */}
      {showForm && (
        <Suspense fallback={<ModalLoader />}>
          <RiskForm
            initialData={editingRisk}
            prefilledProject={prefilledProject}
            onSave={handleSaveRisk}
            onCancel={() => { setShowForm(false); setEditingRisk(undefined); setPrefilledProject(null); }}
            existingProjects={uniqueProjectData}
            nextId={getNextRiskId()}
            userProfile={userProfile}
          />
        </Suspense>
      )}
      {showProjectForm && (
        <ProjectForm
          existingProjects={uniqueProjectData}
          initialData={editingProject}
          onSuccess={editingProject ? handleUpdateProject : handleCreateProject}
          onCancel={() => { setShowProjectForm(false); setEditingProject(undefined); }}
        />
      )}
      {viewHistoryRisk && <RiskHistory risk={viewHistoryRisk} onClose={() => setViewHistoryRisk(null)} />}
      {showSummary && <Suspense fallback={<ModalLoader />}><RiskSummary risks={filteredRisks} onClose={() => setShowSummary(false)} filterName={projectFilter === 'All' ? 'All Projects' : projectFilter} /></Suspense>}
      {showImport && <Suspense fallback={<ModalLoader />}><RiskImportModal onClose={() => setShowImport(false)} /></Suspense>}
      {showAdmin && <Suspense fallback={<ModalLoader />}><AdminPanel onClose={() => setShowAdmin(false)} currentUserEmail={user?.email || ''} /></Suspense>}
      {showUserAccount && (
        <Suspense fallback={<ModalLoader />}>
          <UserAccountPage
            user={user}
            userProfile={userProfile}
            onClose={() => setShowUserAccount(false)}
            onOpenAdmin={() => {
              setShowUserAccount(false);
              setShowAdmin(true);
            }}
            onChangePassword={() => {
              setShowUserAccount(false);
              setMustChangePassword(true);
            }}
          />
        </Suspense>
      )}
    </div >
  );
}

export default App;
