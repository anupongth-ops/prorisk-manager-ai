import React, { useState, useEffect, Suspense, lazy } from 'react';
import { RiskItem } from './types';
import { RiskHistory } from './components/RiskHistory';
import { RiskMatrix } from './components/RiskMatrix';
import { ProjectForm } from './components/ProjectForm';
import { RiskBarChart } from './components/RiskBarChart';
import { StatusBarChart } from './components/StatusBarChart';
import { CategoryBarChart } from './components/CategoryBarChart';
import { OverdueRiskChart } from './components/OverdueRiskChart';
import { LoginPage } from './components/LoginPage';
import { ChangePasswordScreen } from './components/ChangePasswordScreen';
import { PermissionsGuide } from './components/PermissionsGuide';
import { Loader2, ShieldAlert } from 'lucide-react';

// Hooks
import { useAuth } from './hooks/useAuth';
import { useRisks } from './hooks/useRisks';
import { useFilters } from './hooks/useFilters';

// UI Components
import { Navbar } from './components/Navbar';
import { DashboardStats } from './components/DashboardStats';
import { DashboardControls } from './components/DashboardControls';
import { RiskTable } from './components/RiskTable';
import { RiskGuideModal } from './components/RiskGuideModal';

// Lazy-loaded heavy components (code splitting)
const RiskForm = lazy(() => import('./components/RiskForm').then(m => ({ default: m.RiskForm })));
const RiskSummary = lazy(() => import('./components/RiskSummary').then(m => ({ default: m.RiskSummary })));
const RiskImportModal = lazy(() => import('./components/RiskImportModal').then(m => ({ default: m.RiskImportModal })));
const RiskExportModal = lazy(() => import('./components/RiskExportModal').then(m => ({ default: m.RiskExportModal })));
const AdminPanel = lazy(() => import('./components/AdminPanel').then(m => ({ default: m.AdminPanel })));
const UserAccountPage = lazy(() => import('./components/UserAccountPage').then(m => ({ default: m.UserAccountPage })));
const BaselineComparisonMatrix = lazy(() => import('./components/BaselineComparisonMatrix').then(m => ({ default: m.BaselineComparisonMatrix })));
const RiskLibraryModal = lazy(() => import('./components/RiskLibraryModal').then(m => ({ default: m.RiskLibraryModal })));

const ModalLoader = () => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-xl flex items-center gap-3">
      <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      <span className="text-gray-700 dark:text-gray-200">Loading...</span>
    </div>
  </div>
);

function App() {
  const {
    user, userProfile, authLoading, mustChangePassword, checkingProfile, permissionDenied,
    setMustChangePassword, setPermissionDenied, setUserProfile, handleLogout, isAdmin, canModifyProject
  } = useAuth();

  const {
    risks, isLoading, uniqueProjectData, uniqueProjectNos,
    handleSaveRisk, handleDelete, getNextRiskId, handleCreateProject, handleUpdateProject, handleDeleteProject,
    handleBatchImportFromLibrary
  } = useRisks(user, mustChangePassword, setPermissionDenied, canModifyProject, userProfile?.id, isAdmin, setUserProfile);

  const {
    projectFilter, setProjectFilter, searchQuery, setSearchQuery, showBenchmark, setShowBenchmark,
    matrixFilter, setMatrixFilter, sortConfig, handleSort, filteredRisks, currentBaselineScores
  } = useFilters(risks, uniqueProjectData);

  // UI State for Modals/Forms
  const [editingRisk, setEditingRisk] = useState<RiskItem | undefined>(undefined);
  const [editingProject, setEditingProject] = useState<{ projectNo: string, projectName: string, pmName: string, email: string, industryType?: string } | undefined>(undefined);
  const [showForm, setShowForm] = useState(false);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showRiskLibrary, setShowRiskLibrary] = useState(false);
  const [showUserAccount, setShowUserAccount] = useState(false);
  const [viewHistoryRisk, setViewHistoryRisk] = useState<RiskItem | null>(null);
  const [prefilledProject, setPrefilledProject] = useState<{ projectNo: string, projectName: string, pmName: string, email: string, industryType?: string } | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

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

  // Auth Guards
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

  if (!user) return <LoginPage />;

  if (mustChangePassword) {
    return (
      <ChangePasswordScreen
        onSuccess={() => setMustChangePassword(false)}
        onCancel={() => setMustChangePassword(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col transition-colors duration-300">
      <Navbar
        user={user}
        userProfile={userProfile}
        isAdmin={isAdmin}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        setShowImport={setShowImport}
        setShowExport={setShowExport}
        setShowSummary={setShowSummary}
        setShowAdmin={setShowAdmin}
        setShowRiskLibrary={setShowRiskLibrary}
        setShowProjectForm={setShowProjectForm}
        setEditingRisk={setEditingRisk}
        setShowForm={setShowForm}
        setPrefilledProject={setPrefilledProject}
        setShowUserAccount={setShowUserAccount}
        handleLogout={handleLogout}
        setShowGuide={setShowGuide}
      />

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
            <div className="space-y-8 mb-12">
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
                <div className="xl:col-span-3 space-y-4">
                  <DashboardStats
                    projectFilter={projectFilter}
                    filteredRisks={filteredRisks}
                    uniqueProjectData={uniqueProjectData}
                  />
                </div>
                <div className="xl:col-span-9">
                  <RiskBarChart risks={filteredRisks} />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-12 gap-6 items-stretch">
                <div className="xl:col-span-4">
                  <CategoryBarChart risks={filteredRisks} />
                </div>
                <div className="xl:col-span-4">
                  <StatusBarChart
                    risks={filteredRisks}
                    comparisonRisks={projectFilter !== 'All' ? risks : undefined}
                  />
                </div>
                <div className="xl:col-span-4">
                  <OverdueRiskChart risks={filteredRisks} />
                </div>
              </div>

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

            <DashboardControls
              projectFilter={projectFilter}
              setProjectFilter={setProjectFilter}
              uniqueProjectNos={uniqueProjectNos}
              uniqueProjectData={uniqueProjectData}
              setEditingProject={setEditingProject}
              setShowProjectForm={setShowProjectForm}
              showBenchmark={showBenchmark}
              setShowBenchmark={setShowBenchmark}
              matrixFilter={matrixFilter}
              setMatrixFilter={setMatrixFilter}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              filteredRisks={filteredRisks}
            />

            <RiskTable
              filteredRisks={filteredRisks}
              sortConfig={sortConfig}
              handleSort={handleSort}
              canModifyProject={canModifyProject}
              setViewHistoryRisk={setViewHistoryRisk}
              setEditingRisk={setEditingRisk}
              setShowForm={setShowForm}
              setPrefilledProject={setPrefilledProject}
              handleDelete={handleDelete}
            />
          </>
        )}
      </main>

      {/* Modals */}
      {showForm && (
        <Suspense fallback={<ModalLoader />}>
          <RiskForm
            initialData={editingRisk}
            prefilledProject={prefilledProject}
            onSave={(risk) => handleSaveRisk(risk, () => {
              setShowForm(false);
              setEditingRisk(undefined);
              setPrefilledProject(null);
            })}
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
          isAdmin={isAdmin}
          onDeleteProject={(projectNo) => handleDeleteProject(projectNo, () => {
            setShowProjectForm(false);
            setEditingProject(undefined);
            if (projectFilter === projectNo) setProjectFilter('All');
          })}
          onSuccess={(proj, src, mods) => {
            if (editingProject) {
              handleUpdateProject(proj, () => {
                setShowProjectForm(false);
                setEditingProject(undefined);
              }, mods);
            } else {
              handleCreateProject(proj, () => {
                setShowProjectForm(false);
                setShowForm(true);
                setPrefilledProject(proj);
              }, src, mods);
            }
          }}
          onCancel={() => { setShowProjectForm(false); setEditingProject(undefined); }}
        />
      )}
      {viewHistoryRisk && <RiskHistory risk={viewHistoryRisk} onClose={() => setViewHistoryRisk(null)} />}
      {showSummary && <Suspense fallback={<ModalLoader />}><RiskSummary risks={filteredRisks} onClose={() => setShowSummary(false)} filterName={projectFilter === 'All' ? 'All Projects' : projectFilter} /></Suspense>}
      {showImport && <Suspense fallback={<ModalLoader />}><RiskImportModal onClose={() => setShowImport(false)} /></Suspense>}
      {showExport && (
        <Suspense fallback={<ModalLoader />}>
          <RiskExportModal
            risks={filteredRisks}
            projectFilter={projectFilter}
            onClose={() => setShowExport(false)}
          />
        </Suspense>
      )}
      {showAdmin && (
        <Suspense fallback={<ModalLoader />}>
          <AdminPanel
            onClose={() => setShowAdmin(false)}
            currentUserEmail={user?.email || ''}
            existingProjects={uniqueProjectNos}
            allRisks={risks}
            uniqueProjectData={uniqueProjectData}
          />
        </Suspense>
      )}
      {showRiskLibrary && (
        <Suspense fallback={<ModalLoader />}>
          <RiskLibraryModal
            allRisks={risks}
            existingProjects={uniqueProjectData}
            userProfile={userProfile}
            currentUserEmail={user?.email || ''}
            getNextRiskId={getNextRiskId}
            onImport={handleBatchImportFromLibrary}
            onClose={() => setShowRiskLibrary(false)}
          />
        </Suspense>
      )}
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
      {showGuide && <RiskGuideModal onClose={() => setShowGuide(false)} />}
    </div>
  );
}

export default App;
