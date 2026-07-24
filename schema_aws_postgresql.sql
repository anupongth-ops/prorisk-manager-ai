-- ==============================================================================
-- Risk Manager E-PO-PM (v0.2) - AWS RDS / Aurora PostgreSQL Database Schema
-- Standard Reference: EPM-03-014 Rev F3 & ISO 31000:2018
-- Target Environment: AWS RDS PostgreSQL 13+ / Amazon Aurora PostgreSQL
-- Generated At: 2026-07-24
-- ==============================================================================

-- Drop tables if exists (for clean re-initialization)
DROP VIEW IF EXISTS vw_overdue_risks CASCADE;
DROP VIEW IF EXISTS vw_project_risk_summary CASCADE;
DROP VIEW IF EXISTS vw_risk_matrix CASCADE;

DROP TABLE IF EXISTS risk_history CASCADE;
DROP TABLE IF EXISTS risks CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ------------------------------------------------------------------------------
-- 1. USERS TABLE
-- Stores user profile, roles (Admin, Project_Manager, User), and assigned project scope
-- ------------------------------------------------------------------------------
CREATE TABLE users (
    id VARCHAR(128) PRIMARY KEY,                             -- User UID (from Auth/Firebase or UUID)
    email VARCHAR(255) UNIQUE NOT NULL,                       -- User Email Address
    role VARCHAR(32) NOT NULL DEFAULT 'User',                 -- 'Admin', 'Project_Manager', 'User'
    assigned_projects TEXT[] DEFAULT '{}',                    -- Array of Project Numbers assigned to PM
    is_default_password BOOLEAN NOT NULL DEFAULT TRUE,       -- Must change password flag
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);

-- ------------------------------------------------------------------------------
-- 2. PROJECTS TABLE
-- Master project data, PM assignment, Industry Type, and ISO 31000 Risk Appetite
-- ------------------------------------------------------------------------------
CREATE TABLE projects (
    project_no VARCHAR(64) PRIMARY KEY,                       -- e.g. 'SH-20-23002'
    project_name VARCHAR(255) NOT NULL,                       -- Full Project Title
    pm_name VARCHAR(255) NOT NULL,                            -- Project Manager Name
    email VARCHAR(255) NOT NULL,                              -- Project Manager Email
    industry_type VARCHAR(128),                               -- Power Plants, Petrochemical, Data Centres, etc.
    risk_appetite VARCHAR(32) NOT NULL DEFAULT 'Low',         -- Low, Significant, Critical (ISO 31000 Cl.5.4.1)
    review_frequency VARCHAR(32) NOT NULL DEFAULT 'Monthly',  -- Monthly, Bi-monthly, Quarterly, Semi-Annually, Annually
    applied_modifiers TEXT[] DEFAULT '{}',                    -- Optional custom modifiers/tags
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_projects_pm_email ON projects(email);
CREATE INDEX idx_projects_industry ON projects(industry_type);

-- ------------------------------------------------------------------------------
-- 3. RISKS TABLE
-- Main Risk Register storing Initial Risk (I*L), Treatment Strategy, and Residual Risk
-- ------------------------------------------------------------------------------
CREATE TABLE risks (
    id VARCHAR(128) PRIMARY KEY,                             -- Auto-generated UUID or Doc ID
    risk_id VARCHAR(64) NOT NULL,                             -- Item Risk ID e.g. '7.1', '8.2'
    project_no VARCHAR(64) NOT NULL REFERENCES projects(project_no) ON DELETE CASCADE ON UPDATE CASCADE,
    
    -- Project Snapshot
    project_name VARCHAR(255) NOT NULL,
    pm_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    industry_type VARCHAR(128),
    
    -- Risk Classification & Identification
    risk_category VARCHAR(128) NOT NULL,                     -- Construction, Engineering, SHE, Procurement, etc.
    description TEXT NOT NULL,                               -- Risk Event Description
    possible_effects TEXT[] NOT NULL DEFAULT '{}',            -- Array of Possible Effects ['C', 'T', 'Q', 'HS', 'E', 'R']
    
    -- Initial Risk (Inherent Risk before treatment)
    initial_impact SMALLINT NOT NULL CHECK (initial_impact BETWEEN 1 AND 5),
    initial_likelihood SMALLINT NOT NULL CHECK (initial_likelihood BETWEEN 1 AND 5),
    initial_score SMALLINT GENERATED ALWAYS AS (initial_impact * initial_likelihood) STORED,
    initial_level VARCHAR(32),                               -- Very Low, Low, Significant, Critical, Extreme
    
    -- Risk Treatment Strategy & Control Action Plan
    mitigation_strategy VARCHAR(16) NOT NULL CHECK (mitigation_strategy IN ('A', 'T', 'M', 'AC')), -- Avoid, Transfer, Mitigate, Accept
    action_to_control TEXT NOT NULL,                         -- Action Plan
    owner VARCHAR(255) NOT NULL,                             -- Action Owner
    cost_to_mitigate VARCHAR(8) DEFAULT '',                  -- H, M, L, ''
    probability_of_success VARCHAR(8) DEFAULT '',            -- H, M, L, ''
    
    -- Residual Risk (Risk after treatment)
    residual_impact SMALLINT NOT NULL CHECK (residual_impact BETWEEN 1 AND 5),
    residual_likelihood SMALLINT NOT NULL CHECK (residual_likelihood BETWEEN 1 AND 5),
    residual_score SMALLINT GENERATED ALWAYS AS (residual_impact * residual_likelihood) STORED,
    residual_level VARCHAR(32),                              -- Very Low, Low, Significant, Critical, Extreme
    
    -- Governance & Monitoring Dates
    raised_date DATE NOT NULL DEFAULT CURRENT_DATE,          -- Risk Raised Date
    deadline_date DATE NOT NULL,                             -- Target Deadline Date
    next_review_date DATE,                                   -- ISO 31000 Cl.6.6 Monitoring Review Date
    finished_date DATE,                                      -- Closed Date
    review_frequency VARCHAR(32) NOT NULL DEFAULT 'Monthly',  -- Review Cycle
    risk_appetite VARCHAR(32) NOT NULL DEFAULT 'Low',         -- Project Appetite Threshold
    status VARCHAR(32) NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Closed')),
    comment TEXT DEFAULT '',
    
    -- Audit Metadata
    created_by VARCHAR(255),
    last_updated_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for AWS Performance & Quick Queries
CREATE INDEX idx_risks_project_no ON risks(project_no);
CREATE INDEX idx_risks_status ON risks(status);
CREATE INDEX idx_risks_category ON risks(risk_category);
CREATE INDEX idx_risks_next_review ON risks(next_review_date);
CREATE INDEX idx_risks_deadline ON risks(deadline_date);
CREATE INDEX idx_risks_residual_level ON risks(residual_level);

-- ------------------------------------------------------------------------------
-- 4. RISK HISTORY / AUDIT LOG TABLE
-- Full audit trail of version changes per risk item
-- ------------------------------------------------------------------------------
CREATE TABLE risk_history (
    version_id VARCHAR(128) PRIMARY KEY,
    risk_item_id VARCHAR(128) NOT NULL REFERENCES risks(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(255),
    changes JSONB NOT NULL DEFAULT '[]'::jsonb                -- Array of { field, oldValue, newValue }
);

CREATE INDEX idx_risk_history_item ON risk_history(risk_item_id);
CREATE INDEX idx_risk_history_timestamp ON risk_history(timestamp);

-- ------------------------------------------------------------------------------
-- 5. USEFUL MONITORING & REPORTING VIEWS
-- ------------------------------------------------------------------------------

-- View 1: Overdue Risks (Overdue Review or Overdue Target Deadline)
CREATE OR REPLACE VIEW vw_overdue_risks AS
SELECT 
    r.id,
    r.risk_id,
    r.project_no,
    r.project_name,
    r.pm_name,
    r.email AS pm_email,
    r.risk_category,
    r.description,
    r.residual_impact,
    r.residual_likelihood,
    r.residual_score,
    r.residual_level,
    r.owner,
    r.next_review_date,
    r.deadline_date,
    r.status,
    CASE 
        WHEN r.next_review_date < CURRENT_DATE THEN 'Overdue Review Date'
        WHEN r.deadline_date < CURRENT_DATE THEN 'Overdue Target Deadline'
        ELSE 'On Schedule'
    END AS overdue_reason
FROM risks r
WHERE r.status != 'Closed'
  AND (r.next_review_date < CURRENT_DATE OR r.deadline_date < CURRENT_DATE);

-- View 2: Project Risk Summary & Statistics
CREATE OR REPLACE VIEW vw_project_risk_summary AS
SELECT 
    p.project_no,
    p.project_name,
    p.pm_name,
    p.email AS pm_email,
    p.risk_appetite,
    COUNT(r.id) AS total_risks,
    COUNT(CASE WHEN r.status = 'Open' THEN 1 END) AS open_risks,
    COUNT(CASE WHEN r.status = 'In Progress' THEN 1 END) AS in_progress_risks,
    COUNT(CASE WHEN r.status = 'Closed' THEN 1 END) AS closed_risks,
    COUNT(CASE WHEN r.status != 'Closed' AND (r.next_review_date < CURRENT_DATE OR r.deadline_date < CURRENT_DATE) THEN 1 END) AS overdue_risks,
    COUNT(CASE WHEN r.status != 'Closed' AND r.residual_score >= 12 THEN 1 END) AS critical_or_extreme_risks
FROM projects p
LEFT JOIN risks r ON p.project_no = r.project_no
GROUP BY p.project_no, p.project_name, p.pm_name, p.email, p.risk_appetite;

-- ------------------------------------------------------------------------------
-- 6. SAMPLE SEED DATA (INITIAL ADMIN USER & TEST PROJECT)
-- ------------------------------------------------------------------------------

-- Seed Admin User (Change password on first login)
INSERT INTO users (id, email, role, assigned_projects, is_default_password)
VALUES 
    ('usr_admin_01', 'admin@prorisk.ai', 'Admin', '{}', TRUE),
    ('usr_pm_01', 'anupong.th@email.com', 'Project_Manager', ARRAY['SH-20-23002'], TRUE)
ON CONFLICT (id) DO NOTHING;

-- Seed Sample Project
INSERT INTO projects (project_no, project_name, pm_name, email, industry_type, risk_appetite, review_frequency)
VALUES 
    ('SH-20-23002', 'Rayong Plant Expansion Project', 'Anupong Th.', 'anupong.th@email.com', 'Petrochemical Plants', 'Low', 'Monthly')
ON CONFLICT (project_no) DO NOTHING;

-- Seed Sample Risk Item (EPM-03-014 Reference)
INSERT INTO risks (
    id, risk_id, project_no, project_name, pm_name, email, industry_type,
    risk_category, description, possible_effects,
    initial_impact, initial_likelihood, initial_level,
    mitigation_strategy, action_to_control, owner,
    residual_impact, residual_likelihood, residual_level,
    raised_date, deadline_date, next_review_date, status, created_by
) VALUES (
    'risk_001', '7.1', 'SH-20-23002', 'Rayong Plant Expansion Project', 'Anupong Th.', 'anupong.th@email.com', 'Petrochemical Plants',
    'Procurement/Contract', 'Control Valve long-lead item delivery delay', ARRAY['C', 'T'],
    4, 4, 'Critical',
    'M', 'Assign expediting team to supplier shop and secure domestic backup supplier', 'Procurement PM',
    2, 2, 'Low',
    CURRENT_DATE, CURRENT_DATE + INTERVAL '90 days', CURRENT_DATE + INTERVAL '30 days', 'In Progress', 'admin@prorisk.ai'
) ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- END OF SCHEMA FILE (AWS RDS PostgreSQL)
-- ==============================================================================
