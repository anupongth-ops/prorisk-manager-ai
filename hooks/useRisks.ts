import { useState, useEffect, useMemo, useCallback } from 'react';
import { RiskItem, RiskSnapshot, RiskChange } from '../types';
import {
    subscribeToRisks,
    saveRiskToFirestore,
    deleteRiskFromFirestore,
    isPermissionError,
    batchSaveRisks,
    assignProjectToUser,
    updateProjectDetails,
    syncBaselineRisks,
    registerListener,
    unregisterListener,
    fetchBaselineRisks
} from '../services/firebaseService';
import { generateBaselineRiskItems, getIndustryBaselineScores } from '../services/riskBaselineService';
import { ProjectModifier, PROJECT_MODIFIERS } from '../constants/riskConstants';

export function useRisks(
    user: any,
    mustChangePassword: boolean,
    setPermissionDenied: (denied: boolean) => void,
    canModifyProject: (projectNo: string) => boolean,
    userProfileId?: string,
    isAdmin?: boolean,
    setUserProfile?: React.Dispatch<React.SetStateAction<any>>
) {
    const [risks, setRisks] = useState<RiskItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Subscription Effect
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

        registerListener('risks-subscription', unsubscribeRisks);

        return () => {
            unsubscribeRisks();
            unregisterListener('risks-subscription');
        };
    }, [user, mustChangePassword, setPermissionDenied]);

    // Modifiers tracking memo
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

    const calculateRiskChanges = useCallback((oldRisk: RiskItem, newRisk: RiskItem): RiskChange[] => {
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
    }, []);

    const handleSaveRisk = useCallback(async (
        updatedRisk: RiskItem,
        onSuccess: () => void
    ) => {
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
                finalRisk = {
                    ...finalRisk,
                    createdBy: user?.email || 'System',
                    updatedAt: new Date().toISOString()
                };
            }

            await saveRiskToFirestore(finalRisk);
            onSuccess();
        } catch (error) {
            if (isPermissionError(error)) {
                setPermissionDenied(true);
            } else {
                alert("Failed to save risk. Please check your connection.");
            }
            console.error(error);
        }
    }, [canModifyProject, risks, calculateRiskChanges, setPermissionDenied, user?.email]);

    const handleDelete = useCallback(async (risk: RiskItem) => {
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
    }, [canModifyProject, setPermissionDenied]);

    const getNextRiskId = useCallback(() => {
        if (risks.length === 0) return 'R-001';
        const existingIds = risks.map(r => {
            const match = r.riskId.match(/R-(\d+)/);
            return match ? parseInt(match[1], 10) : 0;
        }).filter(n => !isNaN(n));
        if (existingIds.length === 0) return 'R-001';
        const maxId = Math.max(...existingIds);
        return `R-${String(maxId + 1).padStart(3, '0')}`;
    }, [risks]);

    const handleCreateProject = useCallback(async (
        project: { projectNo: string, projectName: string, pmName: string, email: string, industryType?: string },
        onSuccess: () => void,
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
                const currentBaseline = await fetchBaselineRisks();
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
                    currentBaseline
                );
                await batchSaveRisks(baselineRisks);
            }

            if (userProfileId && !isAdmin && setUserProfile) {
                await assignProjectToUser(userProfileId, project.projectNo);
                setUserProfile(prev => prev ? {
                    ...prev,
                    assignedProjects: [...new Set([...prev.assignedProjects, project.projectNo])]
                } : null);
            }

            onSuccess();
        } catch (error) {
            alert("Failed to create project data.");
        } finally {
            setIsLoading(false);
        }
    }, [risks, user?.email, userProfileId, isAdmin, setUserProfile]);

    const handleUpdateProject = useCallback(async (
        project: { projectNo: string, projectName: string, pmName: string, email: string, industryType?: string, appliedModifiers?: string[] },
        onSuccess: () => void,
        modifiers?: ProjectModifier[]
    ) => {
        setIsLoading(true);
        try {
            if (!canModifyProject(project.projectNo)) {
                alert("Access Denied: You do not have permission to modify this project.");
                return;
            }

            await updateProjectDetails(project.projectNo, project);

            if (modifiers && modifiers.length > 0) {
                const shouldSync = window.confirm(
                    "Project context has changed. Would you like to re-calculate (re-sync) the baseline risk scores for this project?"
                );
                if (shouldSync) {
                    await syncBaselineRisks(project.projectNo, project.industryType || 'Power Plants', modifiers);
                }
            }
            onSuccess();
        } catch (error) {
            alert("Failed to update project details.");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [canModifyProject]);

    return {
        risks,
        isLoading,
        uniqueProjectData,
        uniqueProjectNos,
        handleSaveRisk,
        handleDelete,
        getNextRiskId,
        handleCreateProject,
        handleUpdateProject
    };
}
