
export interface BaselineRisk {
    discipline: string;
    factor: string;
    baseImpact: number;
    baseLikelihood: number;
}

export interface ProjectModifier {
    category: string;
    item: string;
    applyTo: 'Impact' | 'Likelihood' | 'Both';
    values: {
        'Power Plants': number;
        'Petrochemical Plants': number;
        'Oil and Gas Plants': number;
        'Data Centres': number;
    };
}

export const BASELINE_RISKS: BaselineRisk[] = [
    // ENGINEERING
    { discipline: 'ENGINEERING', factor: 'Design Change', baseImpact: 3, baseLikelihood: 3 },
    { discipline: 'ENGINEERING', factor: 'Constructability', baseImpact: 3, baseLikelihood: 3 },
    { discipline: 'ENGINEERING', factor: 'Design Maturity', baseImpact: 2, baseLikelihood: 4 },
    { discipline: 'ENGINEERING', factor: 'Information Flow', baseImpact: 3, baseLikelihood: 3 },
    { discipline: 'ENGINEERING', factor: 'Design Accuracy', baseImpact: 3, baseLikelihood: 3 },
    { discipline: 'ENGINEERING', factor: 'Standard Compliance', baseImpact: 4, baseLikelihood: 2 },
    { discipline: 'ENGINEERING', factor: 'Safety in Design', baseImpact: 4, baseLikelihood: 2 },

    // PROCUREMENT
    { discipline: 'PROCUREMENT', factor: 'Market Condition', baseImpact: 4, baseLikelihood: 3 },
    { discipline: 'PROCUREMENT', factor: 'Vendor Pricing', baseImpact: 3, baseLikelihood: 3 },
    { discipline: 'PROCUREMENT', factor: 'Supply Chain Stability', baseImpact: 4, baseLikelihood: 2 },
    { discipline: 'PROCUREMENT', factor: 'Logistics Complexity', baseImpact: 3, baseLikelihood: 3 },
    { discipline: 'PROCUREMENT', factor: 'Vendor Capability', baseImpact: 3, baseLikelihood: 3 },
    { discipline: 'PROCUREMENT', factor: 'Inspection & Test', baseImpact: 3, baseLikelihood: 2 },
    { discipline: 'PROCUREMENT', factor: 'Material Quality', baseImpact: 4, baseLikelihood: 2 },
    { discipline: 'PROCUREMENT', factor: 'Transportation Safety', baseImpact: 4, baseLikelihood: 2 },

    // CONSTRUCTION
    { discipline: 'CONSTRUCTION', factor: 'Productivity', baseImpact: 4, baseLikelihood: 3 },
    { discipline: 'CONSTRUCTION', factor: 'Change Management', baseImpact: 4, baseLikelihood: 3 },
    { discipline: 'CONSTRUCTION', factor: 'Labor Availability', baseImpact: 4, baseLikelihood: 4 },
    { discipline: 'CONSTRUCTION', factor: 'Site Condition', baseImpact: 3, baseLikelihood: 3 },
    { discipline: 'CONSTRUCTION', factor: 'Weather & Nature', baseImpact: 2, baseLikelihood: 3 },
    { discipline: 'CONSTRUCTION', factor: 'Workmanship', baseImpact: 3, baseLikelihood: 2 },
    { discipline: 'CONSTRUCTION', factor: 'HSE Management', baseImpact: 3, baseLikelihood: 3 },
    { discipline: 'CONSTRUCTION', factor: 'Fire & Explosion', baseImpact: 5, baseLikelihood: 2 },

    // COMMISSIONING
    { discipline: 'COMMISSIONING', factor: 'Performance Guarantee', baseImpact: 3, baseLikelihood: 3 },
    { discipline: 'COMMISSIONING', factor: 'Operating Cost', baseImpact: 3, baseLikelihood: 3 },
    { discipline: 'COMMISSIONING', factor: 'System Readiness', baseImpact: 4, baseLikelihood: 2 },
    { discipline: 'COMMISSIONING', factor: 'Start-up Complexity', baseImpact: 4, baseLikelihood: 3 },
    { discipline: 'COMMISSIONING', factor: 'Reliability', baseImpact: 3, baseLikelihood: 3 },
    { discipline: 'COMMISSIONING', factor: 'Certification', baseImpact: 3, baseLikelihood: 2 },
    { discipline: 'COMMISSIONING', factor: 'Pre-Commissioning', baseImpact: 5, baseLikelihood: 2 },
    { discipline: 'COMMISSIONING', factor: 'Environmental', baseImpact: 5, baseLikelihood: 2 },
];

export const PROJECT_MODIFIERS: ProjectModifier[] = [
    // 1. Project Nature & Complexity
    { category: 'Project Nature & Complexity', item: 'Lowerfield project', applyTo: 'Likelihood', values: { 'Power Plants': 1, 'Petrochemical Plants': 1, 'Oil and Gas Plants': 1, 'Data Centres': 1 } },
    { category: 'Project Nature & Complexity', item: 'Brownfield / Live Plant', applyTo: 'Both', values: { 'Power Plants': 1, 'Petrochemical Plants': 2, 'Oil and Gas Plants': 2, 'Data Centres': 1 } },
    { category: 'Project Nature & Complexity', item: 'Fast-track project', applyTo: 'Impact', values: { 'Power Plants': 1, 'Petrochemical Plants': 2, 'Oil and Gas Plants': 2, 'Data Centres': 1 } },
    { category: 'Project Nature & Complexity', item: 'Multi-Process Integration', applyTo: 'Both', values: { 'Power Plants': 1, 'Petrochemical Plants': 2, 'Oil and Gas Plants': 2, 'Data Centres': 1 } },
    { category: 'Project Nature & Complexity', item: 'Modular Construction', applyTo: 'Likelihood', values: { 'Power Plants': -1, 'Petrochemical Plants': 0, 'Oil and Gas Plants': 0, 'Data Centres': -1 } },

    // 2. Technology & System Criticality
    { category: 'Technology & System Criticality', item: 'Proven Technology', applyTo: 'Likelihood', values: { 'Power Plants': -1, 'Petrochemical Plants': -1, 'Oil and Gas Plants': -1, 'Data Centres': -1 } },
    { category: 'Technology & System Criticality', item: 'New / Proprietary Tech', applyTo: 'Impact', values: { 'Power Plants': 1, 'Petrochemical Plants': 2, 'Oil and Gas Plants': 2, 'Data Centres': 1 } },
    { category: 'Technology & System Criticality', item: 'High Automation Level', applyTo: 'Likelihood', values: { 'Power Plants': 0, 'Petrochemical Plants': 1, 'Oil and Gas Plants': 1, 'Data Centres': 2 } },
    { category: 'Technology & System Criticality', item: 'Critical Utility Dependence', applyTo: 'Both', values: { 'Power Plants': 1, 'Petrochemical Plants': 1, 'Oil and Gas Plants': 2, 'Data Centres': 2 } },

    // 3. Schedule & Commercial Pressure
    { category: 'Schedule & Commercial Pressure', item: 'Fixed Price / Lump Sum', applyTo: 'Likelihood', values: { 'Power Plants': 1, 'Petrochemical Plants': 1, 'Oil and Gas Plants': 2, 'Data Centres': 2 } },
    { category: 'Schedule & Commercial Pressure', item: 'Tight Milestone / COD', applyTo: 'Impact', values: { 'Power Plants': 1, 'Petrochemical Plants': 2, 'Oil and Gas Plants': 2, 'Data Centres': 1 } },
    { category: 'Schedule & Commercial Pressure', item: 'LD-Driven Contract', applyTo: 'Impact', values: { 'Power Plants': 1, 'Petrochemical Plants': 1, 'Oil and Gas Plants': 2, 'Data Centres': 2 } },
    { category: 'Schedule & Commercial Pressure', item: 'Phased Commissioning', applyTo: 'Likelihood', values: { 'Power Plants': 1, 'Petrochemical Plants': 1, 'Oil and Gas Plants': 2, 'Data Centres': 2 } },

    // 4. Location, Environment & Regulation
    { category: 'Location, Environment & Regulation', item: 'Remote / Offshore location', applyTo: 'Likelihood', values: { 'Power Plants': 1, 'Petrochemical Plants': 1, 'Oil and Gas Plants': 2, 'Data Centres': 0 } },
    { category: 'Location, Environment & Regulation', item: 'Extreme Climate', applyTo: 'Likelihood', values: { 'Power Plants': 1, 'Petrochemical Plants': 1, 'Oil and Gas Plants': 2, 'Data Centres': 1 } },
    { category: 'Location, Environment & Regulation', item: 'High Environmental Sensitivity', applyTo: 'Impact', values: { 'Power Plants': 1, 'Petrochemical Plants': 2, 'Oil and Gas Plants': 2, 'Data Centres': 1 } },
    { category: 'Location, Environment & Regulation', item: 'Complex Permitting', applyTo: 'Both', values: { 'Power Plants': 1, 'Petrochemical Plants': 2, 'Oil and Gas Plants': 2, 'Data Centres': 2 } },

    // 5. Supply Chain & Market Condition
    { category: 'Supply Chain & Market Condition', item: 'Long Lead Equipment', applyTo: 'Both', values: { 'Power Plants': 1, 'Petrochemical Plants': 2, 'Oil and Gas Plants': 2, 'Data Centres': 2 } },
    { category: 'Supply Chain & Market Condition', item: 'Single Source Vendor', applyTo: 'Impact', values: { 'Power Plants': 1, 'Petrochemical Plants': 2, 'Oil and Gas Plants': 2, 'Data Centres': 0 } },
    { category: 'Supply Chain & Market Condition', item: 'Volatile Commodity Market', applyTo: 'Both', values: { 'Power Plants': 1, 'Petrochemical Plants': 2, 'Oil and Gas Plants': 2, 'Data Centres': 2 } },
    { category: 'Supply Chain & Market Condition', item: 'Local Content Requirement', applyTo: 'Likelihood', values: { 'Power Plants': 1, 'Petrochemical Plants': 2, 'Oil and Gas Plants': 2, 'Data Centres': 1 } },

    // 6. Construction & Workforce
    { category: 'Construction & Workforce', item: 'Skilled Labor Shortage', applyTo: 'Likelihood', values: { 'Power Plants': 1, 'Petrochemical Plants': 1, 'Oil and Gas Plants': 2, 'Data Centres': 1 } },
    { category: 'Construction & Workforce', item: 'Congested Site', applyTo: 'Both', values: { 'Power Plants': 1, 'Petrochemical Plants': 2, 'Oil and Gas Plants': 2, 'Data Centres': 0 } },
    { category: 'Construction & Workforce', item: 'Heavy Lifting / Heavy Movement', applyTo: 'Both', values: { 'Power Plants': 1, 'Petrochemical Plants': 2, 'Oil and Gas Plants': 2, 'Data Centres': 1 } },
    { category: 'Construction & Workforce', item: 'Multi-Contractor Interface', applyTo: 'Both', values: { 'Power Plants': 1, 'Petrochemical Plants': 2, 'Oil and Gas Plants': 2, 'Data Centres': 1 } },

    // 7. Commissioning & Operation Readiness
    { category: 'Commissioning & Operation Readiness', item: 'Complex Start-up Sequence', applyTo: 'Likelihood', values: { 'Power Plants': 1, 'Petrochemical Plants': 2, 'Oil and Gas Plants': 2, 'Data Centres': 0 } },
    { category: 'Commissioning & Operation Readiness', item: 'Utility / Feedstock Dependence', applyTo: 'Impact', values: { 'Power Plants': 1, 'Petrochemical Plants': 2, 'Oil and Gas Plants': 2, 'Data Centres': 1 } },
    { category: 'Commissioning & Operation Readiness', item: 'Performance Guarantees', applyTo: 'Both', values: { 'Power Plants': 1, 'Petrochemical Plants': 2, 'Oil and Gas Plants': 2, 'Data Centres': 1 } },
    { category: 'Commissioning & Operation Readiness', item: 'Operator Readiness Low', applyTo: 'Both', values: { 'Power Plants': 1, 'Petrochemical Plants': 2, 'Oil and Gas Plants': 2, 'Data Centres': 1 } },
];
