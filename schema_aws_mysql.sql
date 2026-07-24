-- ==============================================================================
-- Risk Manager E-PO-PM (v0.2) - AWS RDS / Aurora MySQL Database Schema
-- Standard Reference: EPM-03-014 Rev F3 & ISO 31000:2018
-- Target Environment: AWS RDS MySQL 8.0+ / Amazon Aurora MySQL
-- Generated At: 2026-07-24
-- ==============================================================================

SET FOREIGN_KEY_CHECKS = 0;

DROP VIEW IF EXISTS vw_overdue_risks;
DROP VIEW IF EXISTS vw_project_risk_summary;

DROP TABLE IF EXISTS risk_history;
DROP TABLE IF EXISTS risks;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- ------------------------------------------------------------------------------
-- 1. USERS TABLE
-- Stores user profiles, roles (Admin, Project_Manager, User), and assigned project numbers
-- ------------------------------------------------------------------------------
CREATE TABLE users (
    id VARCHAR(128) NOT NULL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    role VARCHAR(32) NOT NULL DEFAULT 'User',
    assigned_projects JSON NULL,                              -- Array of Project Numbers e.g. ["SH-20-23002"]
    is_default_password TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_role (role),
    INDEX idx_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 2. PROJECTS TABLE
-- Master project data, PM assignment, Industry Type, and ISO 31000 Risk Appetite
-- ------------------------------------------------------------------------------
CREATE TABLE projects (
    project_no VARCHAR(64) NOT NULL PRIMARY KEY,
    project_name VARCHAR(255) NOT NULL,
    pm_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    industry_type VARCHAR(128) NULL,
    risk_appetite VARCHAR(32) NOT NULL DEFAULT 'Low',         -- Low, Significant, Critical (ISO 31000 Cl.5.4.1)
    review_frequency VARCHAR(32) NOT NULL DEFAULT 'Monthly',  -- Monthly, Bi-monthly, Quarterly, Semi-Annually, Annually
    applied_modifiers JSON NULL,                              -- Optional custom tags/modifiers
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_projects_pm_email (email),
    INDEX idx_projects_industry (industry_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 3. RISKS TABLE
-- Main Risk Register storing Initial Risk (I*L), Treatment Strategy, and Residual Risk
-- ------------------------------------------------------------------------------
CREATE TABLE risks (
    id VARCHAR(128) NOT NULL PRIMARY KEY,
    risk_id VARCHAR(64) NOT NULL,
    project_no VARCHAR(64) NOT NULL,
    
    -- Project Snapshot
    project_name VARCHAR(255) NOT NULL,
    pm_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    industry_type VARCHAR(128) NULL,
    
    -- Risk Classification & Identification
    risk_category VARCHAR(128) NOT NULL,
    description TEXT NOT NULL,
    possible_effects JSON NOT NULL,                           -- Array of Possible Effects e.g. ["C", "T"]
    
    -- Initial Risk (Inherent Risk before treatment)
    initial_impact TINYINT NOT NULL CHECK (initial_impact BETWEEN 1 AND 5),
    initial_likelihood TINYINT NOT NULL CHECK (initial_likelihood BETWEEN 1 AND 5),
    initial_score SMALLINT GENERATED ALWAYS AS (initial_impact * initial_likelihood) STORED,
    initial_level VARCHAR(32) NULL,                           -- Very Low, Low, Significant, Critical, Extreme
    
    -- Risk Treatment Strategy & Control Action Plan
    mitigation_strategy VARCHAR(16) NOT NULL CHECK (mitigation_strategy IN ('A', 'T', 'M', 'AC')),
    action_to_control TEXT NOT NULL,
    owner VARCHAR(255) NOT NULL,
    cost_to_mitigate VARCHAR(8) NULL DEFAULT '',
    probability_of_success VARCHAR(8) NULL DEFAULT '',
    
    -- Residual Risk (Risk after treatment)
    residual_impact TINYINT NOT NULL CHECK (residual_impact BETWEEN 1 AND 5),
    residual_likelihood TINYINT NOT NULL CHECK (residual_likelihood BETWEEN 1 AND 5),
    residual_score SMALLINT GENERATED ALWAYS AS (residual_impact * residual_likelihood) STORED,
    residual_level VARCHAR(32) NULL,                          -- Very Low, Low, Significant, Critical, Extreme
    
    -- Governance & Monitoring Dates
    raised_date DATE NOT NULL,
    deadline_date DATE NOT NULL,
    next_review_date DATE NULL,
    finished_date DATE NULL,
    review_frequency VARCHAR(32) NOT NULL DEFAULT 'Monthly',
    risk_appetite VARCHAR(32) NOT NULL DEFAULT 'Low',
    status VARCHAR(32) NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Closed')),
    comment TEXT NULL,
    
    -- Audit Metadata
    created_by VARCHAR(255) NULL,
    last_updated_by VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_risks_projects FOREIGN KEY (project_no) REFERENCES projects(project_no) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_risks_project_no (project_no),
    INDEX idx_risks_status (status),
    INDEX idx_risks_category (risk_category),
    INDEX idx_risks_next_review (next_review_date),
    INDEX idx_risks_deadline (deadline_date),
    INDEX idx_risks_residual_level (residual_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 4. RISK HISTORY / AUDIT LOG TABLE
-- Full audit trail of version changes per risk item
-- ------------------------------------------------------------------------------
CREATE TABLE risk_history (
    version_id VARCHAR(128) NOT NULL PRIMARY KEY,
    risk_item_id VARCHAR(128) NOT NULL,
    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(255) NULL,
    changes JSON NOT NULL,                                    -- Array of { field, oldValue, newValue }
    CONSTRAINT fk_history_risks FOREIGN KEY (risk_item_id) REFERENCES risks(id) ON DELETE CASCADE,
    INDEX idx_risk_history_item (risk_item_id),
    INDEX idx_risk_history_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
        WHEN r.next_review_date < CURDATE() THEN 'Overdue Review Date'
        WHEN r.deadline_date < CURDATE() THEN 'Overdue Target Deadline'
        ELSE 'On Schedule'
    END AS overdue_reason
FROM risks r
WHERE r.status != 'Closed'
  AND (r.next_review_date < CURDATE() OR r.deadline_date < CURDATE());

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
    COUNT(CASE WHEN r.status != 'Closed' AND (r.next_review_date < CURDATE() OR r.deadline_date < CURDATE()) THEN 1 END) AS overdue_risks,
    COUNT(CASE WHEN r.status != 'Closed' AND r.residual_score >= 12 THEN 1 END) AS critical_or_extreme_risks
FROM projects p
LEFT JOIN risks r ON p.project_no = r.project_no
GROUP BY p.project_no, p.project_name, p.pm_name, p.email, p.risk_appetite;

-- ------------------------------------------------------------------------------
-- 6. SAMPLE SEED DATA (INITIAL ADMIN USER & TEST PROJECT)
-- ------------------------------------------------------------------------------

INSERT INTO users (id, email, role, assigned_projects, is_default_password)
VALUES 
    ('usr_admin_01', 'admin@prorisk.ai', 'Admin', '[]', 1),
    ('usr_pm_01', 'anupong.th@email.com', 'Project_Manager', '["SH-20-23002"]', 1)
ON DUPLICATE KEY UPDATE email=email;

INSERT INTO projects (project_no, project_name, pm_name, email, industry_type, risk_appetite, review_frequency)
VALUES 
    ('SH-20-23002', 'Rayong Plant Expansion Project', 'Anupong Th.', 'anupong.th@email.com', 'Petrochemical Plants', 'Low', 'Monthly')
ON DUPLICATE KEY UPDATE project_name=project_name;

INSERT INTO risks (
    id, risk_id, project_no, project_name, pm_name, email, industry_type,
    risk_category, description, possible_effects,
    initial_impact, initial_likelihood, initial_level,
    mitigation_strategy, action_to_control, owner,
    residual_impact, residual_likelihood, residual_level,
    raised_date, deadline_date, next_review_date, status, created_by
) VALUES (
    'risk_001', '7.1', 'SH-20-23002', 'Rayong Plant Expansion Project', 'Anupong Th.', 'anupong.th@email.com', 'Petrochemical Plants',
    'Procurement/Contract', 'Control Valve long-lead item delivery delay', '["C", "T"]',
    4, 4, 'Critical',
    'M', 'Assign expediting team to supplier shop and secure domestic backup supplier', 'Procurement PM',
    2, 2, 'Low',
    CURDATE(), DATE_ADD(CURDATE(), INTERVAL 90 DAY), DATE_ADD(CURDATE(), INTERVAL 30 DAY), 'In Progress', 'admin@prorisk.ai'
) ON DUPLICATE KEY UPDATE id=id;

-- ==============================================================================
-- END OF SCHEMA FILE (AWS RDS MySQL)
-- ==============================================================================
