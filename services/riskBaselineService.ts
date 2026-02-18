
import { RiskItem, PossibleEffect, MitigationStrategy } from '../types';
import { BASELINE_RISKS, PROJECT_MODIFIERS, ProjectModifier } from '../constants/riskConstants';

export const calculateAdjustedScore = (
    baseScore: number,
    modifierType: 'Impact' | 'Likelihood',
    selectedModifiers: ProjectModifier[],
    industryType: string
): number => {
    let score = baseScore;

    selectedModifiers.forEach(mod => {
        if (mod.applyTo === 'Both' || mod.applyTo === modifierType) {
            const adjustment = mod.values[industryType as keyof typeof mod.values] || 0;
            score += adjustment;
        }
    });

    // Clamp score between 1 and 5
    return Math.max(1, Math.min(5, score));
};

export const generateBaselineRiskItems = (
    project: {
        projectNo: string;
        projectName: string;
        pmName: string;
        email: string;
        industryType: string;
    },
    selectedModifiers: ProjectModifier[],
    userEmail: string,
    providedBaseline?: any[]
): RiskItem[] => {
    const baselineSource = providedBaseline || BASELINE_RISKS;
    return baselineSource.map((base, index) => {
        const impact = calculateAdjustedScore(base.baseImpact, 'Impact', selectedModifiers, project.industryType);
        const likelihood = calculateAdjustedScore(base.baseLikelihood, 'Likelihood', selectedModifiers, project.industryType);

        return {
            id: crypto.randomUUID(),
            riskId: `B-${String(index + 1).padStart(3, '0')}`, // Baseline ID prefix
            projectNo: project.projectNo,
            projectName: project.projectName,
            pmName: project.pmName,
            email: project.email,
            industryType: project.industryType,
            appliedModifiers: selectedModifiers.map(m => m.item),
            riskCategory: base.discipline,
            description: `Baseline: ${base.factor}`,
            initialRisk: {
                impact,
                likelihood
            },
            possibleEffect: PossibleEffect.Cost, // Default
            mitigationStrategy: MitigationStrategy.Mitigate, // Default
            actionToControl: 'Standard baseline control measures to be defined.',
            residualRisk: {
                impact: Math.max(1, impact - 1), // Default slight improvement
                likelihood: Math.max(1, likelihood - 1)
            },
            owner: project.pmName,
            raisedDate: new Date().toISOString().split('T')[0],
            deadlineDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 90 days default
            status: 'Open',
            comment: 'Automatically generated from risk factor baseline.',
            createdBy: userEmail,
            lastUpdatedBy: userEmail,
            updatedAt: new Date().toISOString(),
            history: []
        } as RiskItem;
    });
};

export const getIndustryBaselineScores = (
    industryType: string,
    selectedModifiers: ProjectModifier[],
    providedBaseline?: any[]
): { impact: number, likelihood: number, category: string }[] => {
    const baselineSource = providedBaseline || BASELINE_RISKS;
    return baselineSource.map(base => ({
        impact: calculateAdjustedScore(base.baseImpact, 'Impact', selectedModifiers, industryType),
        likelihood: calculateAdjustedScore(base.baseLikelihood, 'Likelihood', selectedModifiers, industryType),
        category: base.discipline
    }));
};
