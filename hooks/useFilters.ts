import { useState, useMemo, useCallback } from 'react';
import { RiskItem, RiskAppetite, ReviewFrequency } from '../types';
import { getIndustryBaselineScores } from '../services/riskBaselineService';
import { PROJECT_MODIFIERS } from '../constants/riskConstants';

export function useFilters(
    risks: RiskItem[],
    uniqueProjectData: { projectNo: string, projectName: string, pmName: string, email: string, industryType?: string, appliedModifiers?: string[], riskAppetite?: RiskAppetite, reviewFrequency?: ReviewFrequency }[]
) {
    const [projectFilter, setProjectFilter] = useState<string>('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [showBenchmark, setShowBenchmark] = useState(false);
    const [matrixFilter, setMatrixFilter] = useState<{ impact: number; likelihood: number; mode: 'initial' | 'residual'; } | null>(null);

    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
        key: 'riskId',
        direction: 'asc'
    });

    const handleSort = useCallback((key: string) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }));
    }, []);

    const filteredRisks = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        const q = searchQuery.toLowerCase().trim();

        let result = risks.filter(r => {
            const matchesProject = projectFilter === 'All' || r.projectNo === projectFilter;

            let matchesSearch = true;
            if (q) {
                if (q === 'overdue' || q === 'deadline') {
                    matchesSearch = r.status !== 'Closed' && !!r.deadlineDate && r.deadlineDate < today;
                } else if (q === 'review' || q === 'review due') {
                    matchesSearch = r.status !== 'Closed' && !!r.nextReviewDate && r.nextReviewDate < today;
                } else {
                    matchesSearch =
                        r.description.toLowerCase().includes(q) ||
                        r.riskId.toLowerCase().includes(q) ||
                        r.owner.toLowerCase().includes(q) ||
                        r.status.toLowerCase().includes(q) ||
                        (!!r.deadlineDate && r.deadlineDate.includes(q)) ||
                        (!!r.nextReviewDate && r.nextReviewDate.includes(q));
                }
            }

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

    return {
        projectFilter,
        setProjectFilter,
        searchQuery,
        setSearchQuery,
        showBenchmark,
        setShowBenchmark,
        matrixFilter,
        setMatrixFilter,
        sortConfig,
        handleSort,
        filteredRisks,
        currentBaselineScores
    };
}
