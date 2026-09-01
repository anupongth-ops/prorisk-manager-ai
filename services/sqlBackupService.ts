/**
 * ProRisk Manager AI - SQL Backup & Database Export Service
 * Generates ready-to-execute SQL Dump files (PostgreSQL, MySQL, SQL Server)
 * from live Firestore collections (users, risks, baseline_risks, tor_projects).
 */

import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebaseService';
import { RiskItem, UserProfile, BaselineRisk } from '../types';
import { TorProject } from '../types/torRisk';

export type SqlDialect = 'postgresql' | 'mysql' | 'sqlserver';

/**
 * Escapes SQL string literals securely.
 */
export function escapeSqlString(val: any, dialect: SqlDialect = 'postgresql'): string {
    if (val === null || val === undefined) return 'NULL';
    if (typeof val === 'boolean') {
        if (dialect === 'sqlserver') return val ? '1' : '0';
        return val ? 'TRUE' : 'FALSE';
    }
    if (typeof val === 'number') {
        if (isNaN(val)) return 'NULL';
        return String(val);
    }
    if (Array.isArray(val) || typeof val === 'object') {
        const jsonStr = JSON.stringify(val).replace(/'/g, "''");
        return `'${jsonStr}'`;
    }
    return `'${String(val).replace(/'/g, "''")}'`;
}

export interface FullBackupData {
    timestamp: string;
    stats: {
        usersCount: number;
        risksCount: number;
        baselineCount: number;
        torCount: number;
    };
    users: UserProfile[];
    risks: RiskItem[];
    baselineRisks: BaselineRisk[];
    torProjects: TorProject[];
}

/**
 * Fetches all Firestore collections across the entire system.
 */
export async function fetchCompleteDatabase(): Promise<FullBackupData> {
    if (!db) throw new Error("Firestore database is not initialized");

    // 1. Users
    const usersSnap = await getDocs(collection(db, 'users'));
    const users: UserProfile[] = [];
    usersSnap.forEach(docSnap => {
        const data = docSnap.data() as any;
        users.push({
            id: docSnap.id,
            email: data.email || '',
            role: data.role || 'User',
            assignedProjects: Array.isArray(data.assignedProjects) ? data.assignedProjects : [],
            isDefaultPassword: !!data.isDefaultPassword,
            createdAt: data.createdAt || new Date().toISOString(),
            updatedAt: data.updatedAt || undefined,
            name: data.name || undefined
        });
    });

    // 2. Risks
    const risksSnap = await getDocs(collection(db, 'risks'));
    const risks: RiskItem[] = [];
    risksSnap.forEach(docSnap => {
        risks.push(docSnap.data() as RiskItem);
    });

    // 3. Baseline Risks
    const baselineSnap = await getDocs(collection(db, 'baseline_risks'));
    const baselineRisks: BaselineRisk[] = [];
    baselineSnap.forEach(docSnap => {
        baselineRisks.push({
            id: docSnap.id,
            ...(docSnap.data() as any)
        });
    });

    // 4. TOR Projects
    const torSnap = await getDocs(collection(db, 'tor_projects'));
    const torProjects: TorProject[] = [];
    torSnap.forEach(docSnap => {
        torProjects.push(docSnap.data() as TorProject);
    });

    return {
        timestamp: new Date().toISOString(),
        stats: {
            usersCount: users.length,
            risksCount: risks.length,
            baselineCount: baselineRisks.length,
            torCount: torProjects.length
        },
        users,
        risks,
        baselineRisks,
        torProjects
    };
}

/**
 * Generates clean, production-ready SQL statements for PostgreSQL / Supabase / AWS RDS
 */
export function generatePostgreSqlDump(data: FullBackupData): string {
    const lines: string[] = [];

    lines.push(`-- ==============================================================================`);
    lines.push(`-- ProRisk Manager AI - Complete PostgreSQL Database Backup Dump`);
    lines.push(`-- Generated At: ${data.timestamp}`);
    lines.push(`-- Statistics: ${data.stats.usersCount} users, ${data.stats.risksCount} risks, ${data.stats.baselineCount} baseline risks, ${data.stats.torCount} TOR projects`);
    lines.push(`-- ==============================================================================\n`);

    lines.push(`BEGIN;\n`);

    // Schema DDL
    lines.push(`-- 1. Create Tables`);
    lines.push(`CREATE TABLE IF NOT EXISTS users (`);
    lines.push(`    id VARCHAR(128) PRIMARY KEY,`);
    lines.push(`    email VARCHAR(255) NOT NULL,`);
    lines.push(`    role VARCHAR(32) NOT NULL DEFAULT 'User',`);
    lines.push(`    assigned_projects TEXT[] DEFAULT '{}',`);
    lines.push(`    is_default_password BOOLEAN NOT NULL DEFAULT TRUE,`);
    lines.push(`    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,`);
    lines.push(`    updated_at TIMESTAMP WITH TIME ZONE`);
    lines.push(`);\n`);

    lines.push(`CREATE TABLE IF NOT EXISTS baseline_risks (`);
    lines.push(`    id VARCHAR(128) PRIMARY KEY,`);
    lines.push(`    discipline VARCHAR(128) NOT NULL,`);
    lines.push(`    factor TEXT NOT NULL,`);
    lines.push(`    base_impact SMALLINT NOT NULL DEFAULT 3,`);
    lines.push(`    base_likelihood SMALLINT NOT NULL DEFAULT 3`);
    lines.push(`);\n`);

    lines.push(`CREATE TABLE IF NOT EXISTS risks (`);
    lines.push(`    id VARCHAR(128) PRIMARY KEY,`);
    lines.push(`    risk_id VARCHAR(64) NOT NULL,`);
    lines.push(`    project_no VARCHAR(64) NOT NULL,`);
    lines.push(`    project_name VARCHAR(255) NOT NULL,`);
    lines.push(`    pm_name VARCHAR(255) NOT NULL,`);
    lines.push(`    email VARCHAR(255) NOT NULL,`);
    lines.push(`    industry_type VARCHAR(128),`);
    lines.push(`    risk_category VARCHAR(128) NOT NULL,`);
    lines.push(`    description TEXT NOT NULL,`);
    lines.push(`    possible_effect TEXT,`);
    lines.push(`    initial_impact SMALLINT NOT NULL,`);
    lines.push(`    initial_likelihood SMALLINT NOT NULL,`);
    lines.push(`    mitigation_strategy VARCHAR(16) NOT NULL,`);
    lines.push(`    action_to_control TEXT NOT NULL,`);
    lines.push(`    residual_impact SMALLINT NOT NULL,`);
    lines.push(`    residual_likelihood SMALLINT NOT NULL,`);
    lines.push(`    owner VARCHAR(255) NOT NULL,`);
    lines.push(`    raised_date VARCHAR(32),`);
    lines.push(`    deadline_date VARCHAR(32),`);
    lines.push(`    next_review_date VARCHAR(32),`);
    lines.push(`    finished_date VARCHAR(32),`);
    lines.push(`    status VARCHAR(32) NOT NULL DEFAULT 'Open',`);
    lines.push(`    cost_to_mitigate VARCHAR(16),`);
    lines.push(`    probability_of_success VARCHAR(16),`);
    lines.push(`    comment TEXT,`);
    lines.push(`    risk_appetite VARCHAR(32),`);
    lines.push(`    review_frequency VARCHAR(32),`);
    lines.push(`    applied_modifiers TEXT[] DEFAULT '{}',`);
    lines.push(`    created_by VARCHAR(255),`);
    lines.push(`    last_updated_by VARCHAR(255),`);
    lines.push(`    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,`);
    lines.push(`    updated_at TIMESTAMP WITH TIME ZONE`);
    lines.push(`);\n`);

    lines.push(`CREATE TABLE IF NOT EXISTS risk_history (`);
    lines.push(`    version_id VARCHAR(128) PRIMARY KEY,`);
    lines.push(`    risk_item_id VARCHAR(128) NOT NULL,`);
    lines.push(`    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,`);
    lines.push(`    updated_by VARCHAR(255),`);
    lines.push(`    changes JSONB NOT NULL DEFAULT '[]'`);
    lines.push(`);\n`);

    lines.push(`CREATE TABLE IF NOT EXISTS tor_projects (`);
    lines.push(`    id VARCHAR(128) PRIMARY KEY,`);
    lines.push(`    proposal_code VARCHAR(64),`);
    lines.push(`    project_title VARCHAR(255) NOT NULL,`);
    lines.push(`    client_name VARCHAR(255) NOT NULL,`);
    lines.push(`    estimated_budget NUMERIC(18,2) NOT NULL DEFAULT 0,`);
    lines.push(`    submission_deadline VARCHAR(32),`);
    lines.push(`    objectives TEXT,`);
    lines.push(`    scope_of_work TEXT,`);
    lines.push(`    internal_context TEXT,`);
    lines.push(`    external_context TEXT,`);
    lines.push(`    strategic_recommendations TEXT,`);
    lines.push(`    constraints JSONB DEFAULT '[]',`);
    lines.push(`    risks JSONB DEFAULT '[]',`);
    lines.push(`    created_by VARCHAR(255),`);
    lines.push(`    updated_at TIMESTAMP WITH TIME ZONE`);
    lines.push(`);\n`);

    // 2. Insert Baseline Risks
    if (data.baselineRisks.length > 0) {
        lines.push(`-- 2. Data Inserts: baseline_risks (${data.baselineRisks.length} records)`);
        for (const b of data.baselineRisks) {
            lines.push(`INSERT INTO baseline_risks (id, discipline, factor, base_impact, base_likelihood) VALUES (` +
                `${escapeSqlString(b.id, 'postgresql')}, ` +
                `${escapeSqlString(b.discipline, 'postgresql')}, ` +
                `${escapeSqlString(b.factor, 'postgresql')}, ` +
                `${Number(b.baseImpact) || 3}, ` +
                `${Number(b.baseLikelihood) || 3}` +
                `) ON CONFLICT (id) DO UPDATE SET discipline = EXCLUDED.discipline, factor = EXCLUDED.factor, base_impact = EXCLUDED.base_impact, base_likelihood = EXCLUDED.base_likelihood;`
            );
        }
        lines.push('');
    }

    // 3. Insert Users
    if (data.users.length > 0) {
        lines.push(`-- 3. Data Inserts: users (${data.users.length} records)`);
        for (const u of data.users) {
            const projectsArrayLiteral = `ARRAY[${(u.assignedProjects || []).map(p => escapeSqlString(p, 'postgresql')).join(', ')}]::TEXT[]`;
            lines.push(`INSERT INTO users (id, email, role, assigned_projects, is_default_password, created_at, updated_at) VALUES (` +
                `${escapeSqlString(u.id, 'postgresql')}, ` +
                `${escapeSqlString(u.email, 'postgresql')}, ` +
                `${escapeSqlString(u.role || 'User', 'postgresql')}, ` +
                `${u.assignedProjects && u.assignedProjects.length > 0 ? projectsArrayLiteral : "'{}'::TEXT[]"}, ` +
                `${u.isDefaultPassword ? 'TRUE' : 'FALSE'}, ` +
                `${escapeSqlString(u.createdAt || new Date().toISOString(), 'postgresql')}, ` +
                `${escapeSqlString(u.updatedAt || null, 'postgresql')}` +
                `) ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, role = EXCLUDED.role, assigned_projects = EXCLUDED.assigned_projects, updated_at = EXCLUDED.updated_at;`
            );
        }
        lines.push('');
    }

    // 4. Insert Risks & History
    if (data.risks.length > 0) {
        lines.push(`-- 4. Data Inserts: risks (${data.risks.length} records)`);
        for (const r of data.risks) {
            const possibleEffectStr = Array.isArray(r.possibleEffect) ? r.possibleEffect.join('+') : String(r.possibleEffect || '');
            const appliedModsArray = `ARRAY[${(r.appliedModifiers || []).map(m => escapeSqlString(m, 'postgresql')).join(', ')}]::TEXT[]`;

            lines.push(`INSERT INTO risks (` +
                `id, risk_id, project_no, project_name, pm_name, email, industry_type, ` +
                `risk_category, description, possible_effect, initial_impact, initial_likelihood, ` +
                `mitigation_strategy, action_to_control, residual_impact, residual_likelihood, ` +
                `owner, raised_date, deadline_date, next_review_date, finished_date, ` +
                `status, cost_to_mitigate, probability_of_success, comment, risk_appetite, ` +
                `review_frequency, applied_modifiers, created_by, last_updated_by, updated_at` +
                `) VALUES (` +
                `${escapeSqlString(r.id, 'postgresql')}, ` +
                `${escapeSqlString(r.riskId, 'postgresql')}, ` +
                `${escapeSqlString(r.projectNo, 'postgresql')}, ` +
                `${escapeSqlString(r.projectName, 'postgresql')}, ` +
                `${escapeSqlString(r.pmName, 'postgresql')}, ` +
                `${escapeSqlString(r.email, 'postgresql')}, ` +
                `${escapeSqlString(r.industryType || null, 'postgresql')}, ` +
                `${escapeSqlString(r.riskCategory, 'postgresql')}, ` +
                `${escapeSqlString(r.description, 'postgresql')}, ` +
                `${escapeSqlString(possibleEffectStr, 'postgresql')}, ` +
                `${Number(r.initialRisk?.impact) || 3}, ` +
                `${Number(r.initialRisk?.likelihood) || 3}, ` +
                `${escapeSqlString(r.mitigationStrategy, 'postgresql')}, ` +
                `${escapeSqlString(r.actionToControl, 'postgresql')}, ` +
                `${Number(r.residualRisk?.impact) || 2}, ` +
                `${Number(r.residualRisk?.likelihood) || 2}, ` +
                `${escapeSqlString(r.owner, 'postgresql')}, ` +
                `${escapeSqlString(r.raisedDate, 'postgresql')}, ` +
                `${escapeSqlString(r.deadlineDate, 'postgresql')}, ` +
                `${escapeSqlString(r.nextReviewDate || null, 'postgresql')}, ` +
                `${escapeSqlString(r.finishedDate || null, 'postgresql')}, ` +
                `${escapeSqlString(r.status || 'Open', 'postgresql')}, ` +
                `${escapeSqlString(r.costToMitigate || '', 'postgresql')}, ` +
                `${escapeSqlString(r.probabilityOfSuccess || '', 'postgresql')}, ` +
                `${escapeSqlString(r.comment || '', 'postgresql')}, ` +
                `${escapeSqlString(r.riskAppetite || 'Low', 'postgresql')}, ` +
                `${escapeSqlString(r.reviewFrequency || 'Monthly', 'postgresql')}, ` +
                `${r.appliedModifiers && r.appliedModifiers.length > 0 ? appliedModsArray : "'{}'::TEXT[]"}, ` +
                `${escapeSqlString(r.createdBy || 'System', 'postgresql')}, ` +
                `${escapeSqlString(r.lastUpdatedBy || 'System', 'postgresql')}, ` +
                `${escapeSqlString(r.updatedAt || new Date().toISOString(), 'postgresql')}` +
                `) ON CONFLICT (id) DO UPDATE SET ` +
                `description = EXCLUDED.description, mitigation_strategy = EXCLUDED.mitigation_strategy, ` +
                `action_to_control = EXCLUDED.action_to_control, residual_impact = EXCLUDED.residual_impact, ` +
                `residual_likelihood = EXCLUDED.residual_likelihood, status = EXCLUDED.status, updated_at = EXCLUDED.updated_at;`
            );

            // History
            if (Array.isArray(r.history) && r.history.length > 0) {
                for (const h of r.history) {
                    lines.push(`INSERT INTO risk_history (version_id, risk_item_id, timestamp, updated_by, changes) VALUES (` +
                        `${escapeSqlString(h.versionId || crypto.randomUUID(), 'postgresql')}, ` +
                        `${escapeSqlString(r.id, 'postgresql')}, ` +
                        `${escapeSqlString(h.timestamp, 'postgresql')}, ` +
                        `${escapeSqlString(h.updatedBy || null, 'postgresql')}, ` +
                        `${escapeSqlString(h.changes || [], 'postgresql')}::JSONB` +
                        `) ON CONFLICT (version_id) DO NOTHING;`
                    );
                }
            }
        }
        lines.push('');
    }

    // 5. Insert TOR Projects
    if (data.torProjects.length > 0) {
        lines.push(`-- 5. Data Inserts: tor_projects (${data.torProjects.length} records)`);
        for (const t of data.torProjects) {
            lines.push(`INSERT INTO tor_projects (` +
                `id, proposal_code, project_title, client_name, estimated_budget, submission_deadline, ` +
                `objectives, scope_of_work, internal_context, external_context, strategic_recommendations, ` +
                `constraints, risks, created_by, updated_at` +
                `) VALUES (` +
                `${escapeSqlString(t.id, 'postgresql')}, ` +
                `${escapeSqlString(t.proposalCode || '', 'postgresql')}, ` +
                `${escapeSqlString(t.projectTitle, 'postgresql')}, ` +
                `${escapeSqlString(t.clientName, 'postgresql')}, ` +
                `${Number(t.estimatedBudget) || 0}, ` +
                `${escapeSqlString(t.submissionDeadline || null, 'postgresql')}, ` +
                `${escapeSqlString(t.objectives || '', 'postgresql')}, ` +
                `${escapeSqlString(t.scopeOfWork || '', 'postgresql')}, ` +
                `${escapeSqlString(t.internalContext || '', 'postgresql')}, ` +
                `${escapeSqlString(t.externalContext || '', 'postgresql')}, ` +
                `${escapeSqlString(t.strategicRecommendations || '', 'postgresql')}, ` +
                `${escapeSqlString(t.constraints || [], 'postgresql')}::JSONB, ` +
                `${escapeSqlString(t.risks || [], 'postgresql')}::JSONB, ` +
                `${escapeSqlString(t.createdBy || null, 'postgresql')}, ` +
                `${escapeSqlString(t.updatedAt || new Date().toISOString(), 'postgresql')}` +
                `) ON CONFLICT (id) DO UPDATE SET ` +
                `project_title = EXCLUDED.project_title, client_name = EXCLUDED.client_name, ` +
                `estimated_budget = EXCLUDED.estimated_budget, risks = EXCLUDED.risks, updated_at = EXCLUDED.updated_at;`
            );
        }
        lines.push('');
    }

    lines.push(`COMMIT;\n`);
    return lines.join('\n');
}

/**
 * Generates MySQL / MariaDB compatible SQL Dump
 */
export function generateMySqlDump(data: FullBackupData): string {
    const lines: string[] = [];

    lines.push(`-- ==============================================================================`);
    lines.push(`-- ProRisk Manager AI - Complete MySQL / MariaDB Database Backup Dump`);
    lines.push(`-- Generated At: ${data.timestamp}`);
    lines.push(`-- Statistics: ${data.stats.usersCount} users, ${data.stats.risksCount} risks, ${data.stats.baselineCount} baseline risks, ${data.stats.torCount} TOR projects`);
    lines.push(`-- ==============================================================================\n`);

    lines.push(`START TRANSACTION;\n`);

    // Schema DDL
    lines.push(`CREATE TABLE IF NOT EXISTS \`users\` (`);
    lines.push(`    \`id\` VARCHAR(128) PRIMARY KEY,`);
    lines.push(`    \`email\` VARCHAR(255) NOT NULL,`);
    lines.push(`    \`role\` VARCHAR(32) NOT NULL DEFAULT 'User',`);
    lines.push(`    \`assigned_projects\` JSON,`);
    lines.push(`    \`is_default_password\` BOOLEAN NOT NULL DEFAULT TRUE,`);
    lines.push(`    \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,`);
    lines.push(`    \`updated_at\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`);
    lines.push(`) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n`);

    lines.push(`CREATE TABLE IF NOT EXISTS \`baseline_risks\` (`);
    lines.push(`    \`id\` VARCHAR(128) PRIMARY KEY,`);
    lines.push(`    \`discipline\` VARCHAR(128) NOT NULL,`);
    lines.push(`    \`factor\` TEXT NOT NULL,`);
    lines.push(`    \`base_impact\` TINYINT NOT NULL DEFAULT 3,`);
    lines.push(`    \`base_likelihood\` TINYINT NOT NULL DEFAULT 3`);
    lines.push(`) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n`);

    lines.push(`CREATE TABLE IF NOT EXISTS \`risks\` (`);
    lines.push(`    \`id\` VARCHAR(128) PRIMARY KEY,`);
    lines.push(`    \`risk_id\` VARCHAR(64) NOT NULL,`);
    lines.push(`    \`project_no\` VARCHAR(64) NOT NULL,`);
    lines.push(`    \`project_name\` VARCHAR(255) NOT NULL,`);
    lines.push(`    \`pm_name\` VARCHAR(255) NOT NULL,`);
    lines.push(`    \`email\` VARCHAR(255) NOT NULL,`);
    lines.push(`    \`industry_type\` VARCHAR(128),`);
    lines.push(`    \`risk_category\` VARCHAR(128) NOT NULL,`);
    lines.push(`    \`description\` TEXT NOT NULL,`);
    lines.push(`    \`possible_effect\` VARCHAR(128),`);
    lines.push(`    \`initial_impact\` TINYINT NOT NULL,`);
    lines.push(`    \`initial_likelihood\` TINYINT NOT NULL,`);
    lines.push(`    \`mitigation_strategy\` VARCHAR(16) NOT NULL,`);
    lines.push(`    \`action_to_control\` TEXT NOT NULL,`);
    lines.push(`    \`residual_impact\` TINYINT NOT NULL,`);
    lines.push(`    \`residual_likelihood\` TINYINT NOT NULL,`);
    lines.push(`    \`owner\` VARCHAR(255) NOT NULL,`);
    lines.push(`    \`raised_date\` VARCHAR(32),`);
    lines.push(`    \`deadline_date\` VARCHAR(32),`);
    lines.push(`    \`next_review_date\` VARCHAR(32),`);
    lines.push(`    \`finished_date\` VARCHAR(32),`);
    lines.push(`    \`status\` VARCHAR(32) NOT NULL DEFAULT 'Open',`);
    lines.push(`    \`cost_to_mitigate\` VARCHAR(16),`);
    lines.push(`    \`probability_of_success\` VARCHAR(16),`);
    lines.push(`    \`comment\` TEXT,`);
    lines.push(`    \`risk_appetite\` VARCHAR(32),`);
    lines.push(`    \`review_frequency\` VARCHAR(32),`);
    lines.push(`    \`applied_modifiers\` JSON,`);
    lines.push(`    \`created_by\` VARCHAR(255),`);
    lines.push(`    \`last_updated_by\` VARCHAR(255),`);
    lines.push(`    \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,`);
    lines.push(`    \`updated_at\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`);
    lines.push(`) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n`);

    lines.push(`CREATE TABLE IF NOT EXISTS \`risk_history\` (`);
    lines.push(`    \`version_id\` VARCHAR(128) PRIMARY KEY,`);
    lines.push(`    \`risk_item_id\` VARCHAR(128) NOT NULL,`);
    lines.push(`    \`timestamp\` VARCHAR(64) NOT NULL,`);
    lines.push(`    \`updated_by\` VARCHAR(255),`);
    lines.push(`    \`changes\` JSON NOT NULL`);
    lines.push(`) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n`);

    lines.push(`CREATE TABLE IF NOT EXISTS \`tor_projects\` (`);
    lines.push(`    \`id\` VARCHAR(128) PRIMARY KEY,`);
    lines.push(`    \`proposal_code\` VARCHAR(64),`);
    lines.push(`    \`project_title\` VARCHAR(255) NOT NULL,`);
    lines.push(`    \`client_name\` VARCHAR(255) NOT NULL,`);
    lines.push(`    \`estimated_budget\` DECIMAL(18,2) NOT NULL DEFAULT 0.00,`);
    lines.push(`    \`submission_deadline\` VARCHAR(32),`);
    lines.push(`    \`objectives\` TEXT,`);
    lines.push(`    \`scope_of_work\` TEXT,`);
    lines.push(`    \`internal_context\` TEXT,`);
    lines.push(`    \`external_context\` TEXT,`);
    lines.push(`    \`strategic_recommendations\` TEXT,`);
    lines.push(`    \`constraints\` JSON,`);
    lines.push(`    \`risks\` JSON,`);
    lines.push(`    \`created_by\` VARCHAR(255),`);
    lines.push(`    \`updated_at\` DATETIME DEFAULT CURRENT_TIMESTAMP`);
    lines.push(`) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n`);

    // Inserts: baseline_risks
    if (data.baselineRisks.length > 0) {
        lines.push(`-- 2. Inserts: baseline_risks`);
        for (const b of data.baselineRisks) {
            lines.push(`INSERT INTO \`baseline_risks\` (\`id\`, \`discipline\`, \`factor\`, \`base_impact\`, \`base_likelihood\`) VALUES (` +
                `${escapeSqlString(b.id, 'mysql')}, ` +
                `${escapeSqlString(b.discipline, 'mysql')}, ` +
                `${escapeSqlString(b.factor, 'mysql')}, ` +
                `${Number(b.baseImpact) || 3}, ` +
                `${Number(b.baseLikelihood) || 3}` +
                `) ON DUPLICATE KEY UPDATE \`discipline\`=VALUES(\`discipline\`), \`factor\`=VALUES(\`factor\`), \`base_impact\`=VALUES(\`base_impact\`), \`base_likelihood\`=VALUES(\`base_likelihood\`);`
            );
        }
        lines.push('');
    }

    // Inserts: users
    if (data.users.length > 0) {
        lines.push(`-- 3. Inserts: users`);
        for (const u of data.users) {
            const projectsJson = JSON.stringify(u.assignedProjects || []);
            lines.push(`INSERT INTO \`users\` (\`id\`, \`email\`, \`role\`, \`assigned_projects\`, \`is_default_password\`, \`created_at\`, \`updated_at\`) VALUES (` +
                `${escapeSqlString(u.id, 'mysql')}, ` +
                `${escapeSqlString(u.email, 'mysql')}, ` +
                `${escapeSqlString(u.role || 'User', 'mysql')}, ` +
                `${escapeSqlString(projectsJson, 'mysql')}, ` +
                `${u.isDefaultPassword ? 'TRUE' : 'FALSE'}, ` +
                `${escapeSqlString(u.createdAt || new Date().toISOString(), 'mysql')}, ` +
                `${escapeSqlString(u.updatedAt || null, 'mysql')}` +
                `) ON DUPLICATE KEY UPDATE \`email\`=VALUES(\`email\`), \`role\`=VALUES(\`role\`), \`assigned_projects\`=VALUES(\`assigned_projects\`);`
            );
        }
        lines.push('');
    }

    // Inserts: risks
    if (data.risks.length > 0) {
        lines.push(`-- 4. Inserts: risks`);
        for (const r of data.risks) {
            const possibleEffectStr = Array.isArray(r.possibleEffect) ? r.possibleEffect.join('+') : String(r.possibleEffect || '');
            const modsJson = JSON.stringify(r.appliedModifiers || []);

            lines.push(`INSERT INTO \`risks\` (` +
                `\`id\`, \`risk_id\`, \`project_no\`, \`project_name\`, \`pm_name\`, \`email\`, \`industry_type\`, ` +
                `\`risk_category\`, \`description\`, \`possible_effect\`, \`initial_impact\`, \`initial_likelihood\`, ` +
                `\`mitigation_strategy\`, \`action_to_control\`, \`residual_impact\`, \`residual_likelihood\`, ` +
                `\`owner\`, \`raised_date\`, \`deadline_date\`, \`next_review_date\`, \`finished_date\`, ` +
                `\`status\`, \`cost_to_mitigate\`, \`probability_of_success\`, \`comment\`, \`risk_appetite\`, ` +
                `\`review_frequency\`, \`applied_modifiers\`, \`created_by\`, \`last_updated_by\`, \`updated_at\`` +
                `) VALUES (` +
                `${escapeSqlString(r.id, 'mysql')}, ` +
                `${escapeSqlString(r.riskId, 'mysql')}, ` +
                `${escapeSqlString(r.projectNo, 'mysql')}, ` +
                `${escapeSqlString(r.projectName, 'mysql')}, ` +
                `${escapeSqlString(r.pmName, 'mysql')}, ` +
                `${escapeSqlString(r.email, 'mysql')}, ` +
                `${escapeSqlString(r.industryType || null, 'mysql')}, ` +
                `${escapeSqlString(r.riskCategory, 'mysql')}, ` +
                `${escapeSqlString(r.description, 'mysql')}, ` +
                `${escapeSqlString(possibleEffectStr, 'mysql')}, ` +
                `${Number(r.initialRisk?.impact) || 3}, ` +
                `${Number(r.initialRisk?.likelihood) || 3}, ` +
                `${escapeSqlString(r.mitigationStrategy, 'mysql')}, ` +
                `${escapeSqlString(r.actionToControl, 'mysql')}, ` +
                `${Number(r.residualRisk?.impact) || 2}, ` +
                `${Number(r.residualRisk?.likelihood) || 2}, ` +
                `${escapeSqlString(r.owner, 'mysql')}, ` +
                `${escapeSqlString(r.raisedDate, 'mysql')}, ` +
                `${escapeSqlString(r.deadlineDate, 'mysql')}, ` +
                `${escapeSqlString(r.nextReviewDate || null, 'mysql')}, ` +
                `${escapeSqlString(r.finishedDate || null, 'mysql')}, ` +
                `${escapeSqlString(r.status || 'Open', 'mysql')}, ` +
                `${escapeSqlString(r.costToMitigate || '', 'mysql')}, ` +
                `${escapeSqlString(r.probabilityOfSuccess || '', 'mysql')}, ` +
                `${escapeSqlString(r.comment || '', 'mysql')}, ` +
                `${escapeSqlString(r.riskAppetite || 'Low', 'mysql')}, ` +
                `${escapeSqlString(r.reviewFrequency || 'Monthly', 'mysql')}, ` +
                `${escapeSqlString(modsJson, 'mysql')}, ` +
                `${escapeSqlString(r.createdBy || 'System', 'mysql')}, ` +
                `${escapeSqlString(r.lastUpdatedBy || 'System', 'mysql')}, ` +
                `${escapeSqlString(r.updatedAt || new Date().toISOString(), 'mysql')}` +
                `) ON DUPLICATE KEY UPDATE ` +
                `\`description\`=VALUES(\`description\`), \`mitigation_strategy\`=VALUES(\`mitigation_strategy\`), ` +
                `\`action_to_control\`=VALUES(\`action_to_control\`), \`status\`=VALUES(\`status\`), \`updated_at\`=VALUES(\`updated_at\`);`
            );

            // History
            if (Array.isArray(r.history) && r.history.length > 0) {
                for (const h of r.history) {
                    lines.push(`INSERT INTO \`risk_history\` (\`version_id\`, \`risk_item_id\`, \`timestamp\`, \`updated_by\`, \`changes\`) VALUES (` +
                        `${escapeSqlString(h.versionId || crypto.randomUUID(), 'mysql')}, ` +
                        `${escapeSqlString(r.id, 'mysql')}, ` +
                        `${escapeSqlString(h.timestamp, 'mysql')}, ` +
                        `${escapeSqlString(h.updatedBy || null, 'mysql')}, ` +
                        `${escapeSqlString(JSON.stringify(h.changes || []), 'mysql')}` +
                        `) ON DUPLICATE KEY UPDATE \`timestamp\`=VALUES(\`timestamp\`);`
                    );
                }
            }
        }
        lines.push('');
    }

    // Inserts: tor_projects
    if (data.torProjects.length > 0) {
        lines.push(`-- 5. Inserts: tor_projects`);
        for (const t of data.torProjects) {
            lines.push(`INSERT INTO \`tor_projects\` (` +
                `\`id\`, \`proposal_code\`, \`project_title\`, \`client_name\`, \`estimated_budget\`, \`submission_deadline\`, ` +
                `\`objectives\`, \`scope_of_work\`, \`internal_context\`, \`external_context\`, \`strategic_recommendations\`, ` +
                `\`constraints\`, \`risks\`, \`created_by\`, \`updated_at\`` +
                `) VALUES (` +
                `${escapeSqlString(t.id, 'mysql')}, ` +
                `${escapeSqlString(t.proposalCode || '', 'mysql')}, ` +
                `${escapeSqlString(t.projectTitle, 'mysql')}, ` +
                `${escapeSqlString(t.clientName, 'mysql')}, ` +
                `${Number(t.estimatedBudget) || 0}, ` +
                `${escapeSqlString(t.submissionDeadline || null, 'mysql')}, ` +
                `${escapeSqlString(t.objectives || '', 'mysql')}, ` +
                `${escapeSqlString(t.scopeOfWork || '', 'mysql')}, ` +
                `${escapeSqlString(t.internalContext || '', 'mysql')}, ` +
                `${escapeSqlString(t.externalContext || '', 'mysql')}, ` +
                `${escapeSqlString(t.strategicRecommendations || '', 'mysql')}, ` +
                `${escapeSqlString(JSON.stringify(t.constraints || []), 'mysql')}, ` +
                `${escapeSqlString(JSON.stringify(t.risks || []), 'mysql')}, ` +
                `${escapeSqlString(t.createdBy || null, 'mysql')}, ` +
                `${escapeSqlString(t.updatedAt || new Date().toISOString(), 'mysql')}` +
                `) ON DUPLICATE KEY UPDATE \`project_title\`=VALUES(\`project_title\`), \`estimated_budget\`=VALUES(\`estimated_budget\`), \`risks\`=VALUES(\`risks\`);`
            );
        }
        lines.push('');
    }

    lines.push(`COMMIT;\n`);
    return lines.join('\n');
}
