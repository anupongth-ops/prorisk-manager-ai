
export enum ImpactLevel {
  VeryLow = 1,
  Low = 2,
  Medium = 3,
  High = 4,
  VeryHigh = 5
}

export enum LikelihoodLevel {
  VeryLow = 1,
  Low = 2,
  Medium = 3,
  High = 4,
  VeryHigh = 5
}

export enum PossibleEffect {
  Cost = 'C',
  Time = 'T',
  Quality = 'Q',
  HSE = 'HSE'
}

export enum MitigationStrategy {
  Avoid = 'A',
  Transfer = 'T',
  Mitigate = 'M',
  Accept = 'AC'
}

export interface RiskScore {
  impact: ImpactLevel;
  likelihood: LikelihoodLevel;
}

export interface RiskChange {
  field: string;
  oldValue: any;
  newValue: any;
}

export type UserRole = 'Admin' | 'User';

export interface UserProfile {
  id: string; // Firestore Doc ID (uid)
  email: string;
  role: UserRole;
  assignedProjects: string[]; // List of project numbers the user can modify
  isDefaultPassword: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface RiskItem {
  id: string;
  riskId: string;
  projectNo: string;
  projectName: string;
  pmName: string;
  email: string;
  industryType?: string;
  appliedModifiers?: string[];
  riskCategory: string;
  description: string;
  initialRisk: RiskScore;

  possibleEffect: PossibleEffect;
  mitigationStrategy: MitigationStrategy;
  actionToControl: string;

  residualRisk: RiskScore;

  owner: string;
  raisedDate: string;
  deadlineDate: string;
  finishedDate?: string;
  status: 'Open' | 'In Progress' | 'Closed';
  comment: string;

  createdBy?: string;
  lastUpdatedBy?: string;
  updatedAt: string;
  history: RiskSnapshot[];
}

export interface RiskSnapshot {
  versionId: string;
  timestamp: string;
  updatedBy?: string;
  // New format: stores only changes
  changes?: RiskChange[];
  // Legacy support: stores full object
  data?: Omit<RiskItem, 'history'>;
}

// Updated Labels based on User Request
export const IMPACT_LABELS: Record<number, string> = {
  1: 'Insignificant',
  2: 'Minor',
  3: 'Moderate',
  4: 'Major',
  5: 'Severe'
};

export const LIKELIHOOD_LABELS: Record<number, string> = {
  1: 'Rarely',
  2: 'Unlikely',
  3: 'Occasional',
  4: 'Likely',
  5: 'Most Likely'
};

export const EFFECT_LABELS: Record<string, string> = {
  C: 'Cost', T: 'Time', Q: 'Quality', HSE: 'HSE'
};

export const STRATEGY_LABELS: Record<string, string> = {
  A: 'Avoid', T: 'Transfer', M: 'Mitigate', AC: 'Accept'
};

export const RISK_CATEGORIES = [
  "Construction",
  "Corporate",
  "Engineering",
  "Government/Community",
  "Operations/Commissioning",
  "Procurement/Contract",
  "Project Management",
  "Quality",
  "Regulatory (Compliance)",
  "SHE",
  "Strategic/Finance",
  "Technology/Systems"
];

export const INDUSTRY_TYPES = [
  "Power Plants",
  "Petrochemical Plants",
  "Oil and Gas Plants",
  "Data Centres"
];

export type RiskLevel = 'Very Low' | 'Low' | 'Significant' | 'Critical' | 'Extreme';

export const getRiskLevel = (impact: number, likelihood: number): RiskLevel => {
  // Row 5: Severe
  if (impact === 5) {
    if (likelihood >= 4) return 'Extreme';
    if (likelihood === 3) return 'Critical';
    if (likelihood === 2) return 'Significant';
    return 'Low';
  }
  // Row 4: Major
  if (impact === 4) {
    if (likelihood === 5) return 'Extreme';
    if (likelihood >= 3) return 'Critical';
    if (likelihood === 2) return 'Significant';
    return 'Low';
  }
  // Row 3: Moderate
  if (impact === 3) {
    if (likelihood >= 4) return 'Critical';
    if (likelihood === 3) return 'Significant';
    return 'Low'; // Assuming Low based on Typical Matrix if not specified (User img: Low)
  }
  // Row 2: Minor
  if (impact === 2) {
    if (likelihood >= 4) return 'Significant';
    if (likelihood >= 2) return 'Low';
    return 'Very Low';
  }
  // Row 1: Insignificant
  if (impact === 1) {
    if (likelihood >= 3) return 'Low';
    return 'Very Low';
  }
  return 'Low';
};

export const getRiskLevelColor = (level: RiskLevel): string => {
  switch (level) {
    case 'Very Low': return 'bg-emerald-400 text-white';
    case 'Low': return 'bg-yellow-300 text-gray-900';
    case 'Significant': return 'bg-orange-400 text-white';
    case 'Critical': return 'bg-red-500 text-white';
    case 'Extreme': return 'bg-red-900 text-white';
    default: return 'bg-gray-200 text-gray-800';
  }
};

export const getRiskWeight = (level: RiskLevel): number => {
  switch (level) {
    case 'Extreme': return 5;
    case 'Critical': return 4;
    case 'Significant': return 3;
    case 'Low': return 2;
    case 'Very Low': return 1;
    default: return 0;
  }
};

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * Formats a YYYY-MM-DD date string to DD-MMM-YYYY for display.
 * e.g., 2023-06-04 -> 04-Jun-2023
 */
export const formatDateDisplay = (dateStr: string | undefined | null): string => {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      const monthIndex = parseInt(month, 10) - 1;
      if (monthIndex >= 0 && monthIndex < 12) {
        return `${day}-${MONTH_NAMES[monthIndex]}-${year}`;
      }
    }
    return dateStr;
  } catch (e) {
    return dateStr || '';
  }
};
