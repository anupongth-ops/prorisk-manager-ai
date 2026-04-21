import { useState, useMemo, useCallback } from 'react';
import { RiskItem } from '../types';
import { getIndustryBaselineScores } from '../services/riskBaselineService';
import { PROJECT_MODIFIERS } from '../constants/riskConstants';

export function useFilters(
    risks: RiskItem[],
    uniqueProjectData: { projectNo: string, projectName: string, pmName: string, email: string, industryType?: string, appliedModifiers?: string[] }[]
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
