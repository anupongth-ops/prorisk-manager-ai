-- =========================================================================
-- PRORISK MANAGER AI - MICROSOFT SQL SERVER (T-SQL) DATABASE SETUP SCHEMA
-- Target Engine: Microsoft SQL Server 2016 or newer (MS SQL Server / Azure SQL)
-- Supported Language: Unicode Thai & English (using NVARCHAR columns)
-- =========================================================================

-- 1. Create Database (If you want to run this in a new DB, uncomment the lines below)
/*
CREATE DATABASE ProRiskDB;
GO
USE ProRiskDB;
GO
*/

-- Disable constraints temporarily to prevent key errors on recreation
IF OBJECT_ID('dbo.risk_history', 'U') IS NOT NULL DROP TABLE dbo.risk_history;
IF OBJECT_ID('dbo.risk_modifiers', 'U') IS NOT NULL DROP TABLE dbo.risk_modifiers;
IF OBJECT_ID('dbo.risks', 'U') IS NOT NULL DROP TABLE dbo.risks;
IF OBJECT_ID('dbo.baseline_risks', 'U') IS NOT NULL DROP TABLE dbo.baseline_risks;
IF OBJECT_ID('dbo.user_assigned_projects', 'U') IS NOT NULL DROP TABLE dbo.user_assigned_projects;
IF OBJECT_ID('dbo.users', 'U') IS NOT NULL DROP TABLE dbo.users;
GO

-- ==========================================
-- CREATE DATABASE TABLES (SCHEMA)
-- ==========================================

-- A. Users Table (Firebase Authentication profiles)
CREATE TABLE dbo.users (
    id VARCHAR(50) PRIMARY KEY, -- Firebase Auth UID
    email VARCHAR(255) NOT NULL UNIQUE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('Admin', 'User')),
    is_default_password BIT NOT NULL DEFAULT 1,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NULL
);

-- B. User Assigned Projects Table (Junction for multi-project authorization)
CREATE TABLE dbo.user_assigned_projects (
    user_id VARCHAR(50) NOT NULL,
    project_no NVARCHAR(100) NOT NULL,
    PRIMARY KEY (user_id, project_no),
    FOREIGN KEY (user_id) REFERENCES dbo.users(id) ON DELETE CASCADE
);

-- C. Baseline Risks Definitions Table
CREATE TABLE dbo.baseline_risks (
    id VARCHAR(50) PRIMARY KEY,
    discipline NVARCHAR(100) NOT NULL,
    factor NVARCHAR(255) NOT NULL,
    base_impact TINYINT NOT NULL CHECK (base_impact BETWEEN 1 AND 5),
    base_likelihood TINYINT NOT NULL CHECK (base_likelihood BETWEEN 1 AND 5)
);

-- D. Project Risks Transactions Table
CREATE TABLE dbo.risks (
    id VARCHAR(50) PRIMARY KEY, -- Document Unique Key
    risk_id VARCHAR(50) NOT NULL, -- UI display risk ID, e.g. B-001 / C-001
    project_no NVARCHAR(100) NOT NULL,
    project_name NVARCHAR(255) NOT NULL,
    pm_name NVARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    industry_type NVARCHAR(100) NULL,
    risk_category NVARCHAR(100) NOT NULL,
    description NVARCHAR(MAX) NOT NULL,
    
    -- Flattened initialRisk scores
    initial_impact TINYINT NOT NULL CHECK (initial_impact BETWEEN 1 AND 5),
    initial_likelihood TINYINT NOT NULL CHECK (initial_likelihood BETWEEN 1 AND 5),
    
    possible_effect VARCHAR(10) NOT NULL CHECK (possible_effect IN ('C', 'T', 'Q', 'HSE')),
    mitigation_strategy VARCHAR(10) NOT NULL CHECK (mitigation_strategy IN ('A', 'T', 'M', 'AC')),
    action_to_control NVARCHAR(MAX) NOT NULL,
    
    -- Flattened residualRisk scores
    residual_impact TINYINT NOT NULL CHECK (residual_impact BETWEEN 1 AND 5),
    residual_likelihood TINYINT NOT NULL CHECK (residual_likelihood BETWEEN 1 AND 5),
    
    owner NVARCHAR(255) NOT NULL,
    raised_date DATE NOT NULL,
    deadline_date DATE NOT NULL,
    finished_date DATE NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('Open', 'In Progress', 'Closed')),
    comment NVARCHAR(MAX) NULL,
    
    created_by VARCHAR(255) NULL,
    last_updated_by VARCHAR(255) NULL,
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE()
);

-- E. Risk Applied Modifiers Table (Junction for modifiers array)
CREATE TABLE dbo.risk_modifiers (
    risk_item_id VARCHAR(50) NOT NULL,
    modifier_name NVARCHAR(255) NOT NULL,
    PRIMARY KEY (risk_item_id, modifier_name),
    FOREIGN KEY (risk_item_id) REFERENCES dbo.risks(id) ON DELETE CASCADE
);

-- F. Risk History Snapshots logs Table
CREATE TABLE dbo.risk_history (
    id INT IDENTITY(1,1) PRIMARY KEY,
    risk_item_id VARCHAR(50) NOT NULL,
    version_id VARCHAR(50) NOT NULL,
    timestamp DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_by VARCHAR(255) NULL,
    changes NVARCHAR(MAX) NOT NULL, -- JSON string mapping of changes
    FOREIGN KEY (risk_item_id) REFERENCES dbo.risks(id) ON DELETE CASCADE
);
GO

-- Create database indexes for execution efficiency
CREATE INDEX idx_risks_project_no ON dbo.risks(project_no);
CREATE INDEX idx_risks_status ON dbo.risks(status);
CREATE INDEX idx_risk_history_item ON dbo.risk_history(risk_item_id);
GO


-- ==========================================
-- INSERT SYSTEM BASELINE RISKS SEED DATA
-- ==========================================

PRINT 'Seeding baseline_risks default records...';

INSERT INTO dbo.baseline_risks (id, discipline, factor, base_impact, base_likelihood) VALUES
-- ENGINEERING
('baseline_001', N'ENGINEERING', N'Design Change', 3, 3),
('baseline_002', N'ENGINEERING', N'Constructability', 3, 3),
('baseline_003', N'ENGINEERING', N'Design Maturity', 2, 4),
('baseline_004', N'ENGINEERING', N'Information Flow', 3, 3),
('baseline_005', N'ENGINEERING', N'Design Accuracy', 3, 3),
('baseline_006', N'ENGINEERING', N'Standard Compliance', 4, 2),
('baseline_007', N'ENGINEERING', N'Safety in Design', 4, 2),

-- PROCUREMENT
('baseline_008', N'PROCUREMENT', N'Market Condition', 4, 3),
('baseline_009', N'PROCUREMENT', N'Vendor Pricing', 3, 3),
('baseline_010', N'PROCUREMENT', N'Supply Chain Stability', 4, 2),
('baseline_011', N'PROCUREMENT', N'Logistics Complexity', 3, 3),
('baseline_012', N'PROCUREMENT', N'Vendor Capability', 3, 3),
('baseline_013', N'PROCUREMENT', N'Inspection & Test', 3, 2),
('baseline_014', N'PROCUREMENT', N'Material Quality', 4, 2),
('baseline_015', N'PROCUREMENT', N'Transportation Safety', 4, 2),

-- CONSTRUCTION
('baseline_016', N'CONSTRUCTION', N'Productivity', 4, 3),
('baseline_017', N'CONSTRUCTION', N'Change Management', 4, 3),
('baseline_018', N'CONSTRUCTION', N'Labor Availability', 4, 4),
('baseline_019', N'CONSTRUCTION', N'Site Condition', 3, 3),
('baseline_020', N'CONSTRUCTION', N'Weather & Nature', 2, 3),
('baseline_021', N'CONSTRUCTION', N'Workmanship', 3, 2),
('baseline_022', N'CONSTRUCTION', N'HSE Management', 3, 3),
('baseline_023', N'CONSTRUCTION', N'Fire & Explosion', 5, 2),

-- COMMISSIONING
('baseline_024', N'COMMISSIONING', N'Performance Guarantee', 3, 3),
('baseline_025', N'COMMISSIONING', N'Operating Cost', 3, 3),
('baseline_026', N'COMMISSIONING', N'System Readiness', 4, 2),
('baseline_027', N'COMMISSIONING', N'Start-up Complexity', 4, 3),
('baseline_028', N'COMMISSIONING', N'Reliability', 3, 3),
('baseline_029', N'COMMISSIONING', N'Certification', 3, 2),
('baseline_030', N'COMMISSIONING', N'Pre-Commissioning', 5, 2),
('baseline_031', N'COMMISSIONING', N'Environmental', 5, 2);

PRINT 'Database schemas created and default baseline risks successfully seeded!';
GO
