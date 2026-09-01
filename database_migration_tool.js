/**
 * ProRisk Manager AI - Relational Database Migration & Backup Tool (CLI)
 * 
 * Extracts collections from Firebase Firestore (users, baseline_risks, risks, tor_projects)
 * and generates clean SQL Dump files for PostgreSQL and MySQL.
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';

const SERVICE_ACCOUNT_FILE = './firebase-service-account.json';

function escapeSQL(val, dialect = 'postgresql') {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') {
    if (dialect === 'sqlserver') return val ? '1' : '0';
    return val ? 'TRUE' : 'FALSE';
  }
  if (typeof val === 'number') return isNaN(val) ? 'NULL' : String(val);
  if (Array.isArray(val) || typeof val === 'object') {
    return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
  }
  return `'${String(val).replace(/'/g, "''")}'`;
}

async function runAdminMigration() {
  console.log("==================================================");
  console.log("  PRORISK MANAGER AI - DATABASE MIGRATION UTILITY ");
  console.log("==================================================");

  if (!fs.existsSync(SERVICE_ACCOUNT_FILE)) {
    console.error(`\n[Notice] Service account key not found at: ${path.resolve(SERVICE_ACCOUNT_FILE)}`);
    console.log("\n📌 เพื่อดึงข้อมูลผ่าน CLI ด้วยสิทธิ์ Admin SDK:");
    console.log("1. เข้าไปที่ https://console.firebase.google.com/project/epc-project-management-5e14a/settings/serviceaccounts/adminsdk");
    console.log("2. คลิก 'Generate new private key' แล้วบันทึกไฟล์เป็น 'firebase-service-account.json' ในโฟลเดอร์นี้");
    console.log("3. รันคำสั่งอีกครั้ง: node database_migration_tool.js");
    console.log("\n💡 หรือวิธีที่ง่ายที่สุด: เข้าใช้งานหน้าเว็บที่ https://www.gcmeapp.com/epopm -> เมนู Admin -> System Backup -> กดปุ่ม 'Export PostgreSQL' หรือ 'Export MySQL' เพื่อดาวน์โหลดได้ทันที 1-Click!\n");
    process.exit(1);
  }

  console.log("Initializing Firebase Admin SDK...");
  const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_FILE, 'utf8'));

  initializeApp({
    credential: cert(serviceAccount)
  });

  const db = getFirestore();
  const timestamp = new Date().toISOString();

  // Fetch all collections
  console.log("\n[1/4] Extracting baseline_risks...");
  const baselineSnap = await db.collection('baseline_risks').get();
  console.log(`-> Found ${baselineSnap.size} baseline definition(s).`);

  console.log("\n[2/4] Extracting users...");
  const usersSnap = await db.collection('users').get();
  console.log(`-> Found ${usersSnap.size} user profile(s).`);

  console.log("\n[3/4] Extracting risks...");
  const risksSnap = await db.collection('risks').get();
  console.log(`-> Found ${risksSnap.size} risk item(s).`);

  console.log("\n[4/4] Extracting tor_projects...");
  const torSnap = await db.collection('tor_projects').get();
  console.log(`-> Found ${torSnap.size} TOR project(s).`);

  // Build PostgreSQL Script
  const pgLines = [];
  pgLines.push(`-- ProRisk Manager AI - PostgreSQL Database Backup Dump`);
  pgLines.push(`-- Generated At: ${timestamp}`);
  pgLines.push(`BEGIN;\n`);

  baselineSnap.forEach(doc => {
    const d = doc.data();
    pgLines.push(`INSERT INTO baseline_risks (id, discipline, factor, base_impact, base_likelihood) VALUES (` +
      `${escapeSQL(doc.id, 'postgresql')}, ` +
      `${escapeSQL(d.discipline, 'postgresql')}, ` +
      `${escapeSQL(d.factor, 'postgresql')}, ` +
      `${Number(d.baseImpact) || 3}, ` +
      `${Number(d.baseLikelihood) || 3}` +
      `) ON CONFLICT (id) DO NOTHING;`
    );
  });

  usersSnap.forEach(doc => {
    const d = doc.data();
    const arr = `ARRAY[${(d.assignedProjects || []).map(p => escapeSQL(p, 'postgresql')).join(', ')}]::TEXT[]`;
    pgLines.push(`INSERT INTO users (id, email, role, assigned_projects, is_default_password, created_at, updated_at) VALUES (` +
      `${escapeSQL(doc.id, 'postgresql')}, ` +
      `${escapeSQL(d.email, 'postgresql')}, ` +
      `${escapeSQL(d.role || 'User', 'postgresql')}, ` +
      `${d.assignedProjects && d.assignedProjects.length > 0 ? arr : "'{}'::TEXT[]"}, ` +
      `${d.isDefaultPassword ? 'TRUE' : 'FALSE'}, ` +
      `${escapeSQL(d.createdAt || timestamp, 'postgresql')}, ` +
      `${escapeSQL(d.updatedAt || null, 'postgresql')}` +
      `) ON CONFLICT (id) DO NOTHING;`
    );
  });

  risksSnap.forEach(doc => {
    const d = doc.data();
    const effStr = Array.isArray(d.possibleEffect) ? d.possibleEffect.join('+') : String(d.possibleEffect || '');
    const modsArr = `ARRAY[${(d.appliedModifiers || []).map(m => escapeSQL(m, 'postgresql')).join(', ')}]::TEXT[]`;

    pgLines.push(`INSERT INTO risks (` +
      `id, risk_id, project_no, project_name, pm_name, email, industry_type, ` +
      `risk_category, description, possible_effect, initial_impact, initial_likelihood, ` +
      `mitigation_strategy, action_to_control, residual_impact, residual_likelihood, ` +
      `owner, raised_date, deadline_date, next_review_date, finished_date, ` +
      `status, cost_to_mitigate, probability_of_success, comment, risk_appetite, ` +
      `review_frequency, applied_modifiers, created_by, last_updated_by, updated_at` +
      `) VALUES (` +
      `${escapeSQL(doc.id, 'postgresql')}, ` +
      `${escapeSQL(d.riskId, 'postgresql')}, ` +
      `${escapeSQL(d.projectNo, 'postgresql')}, ` +
      `${escapeSQL(d.projectName, 'postgresql')}, ` +
      `${escapeSQL(d.pmName, 'postgresql')}, ` +
      `${escapeSQL(d.email, 'postgresql')}, ` +
      `${escapeSQL(d.industryType || null, 'postgresql')}, ` +
      `${escapeSQL(d.riskCategory, 'postgresql')}, ` +
      `${escapeSQL(d.description, 'postgresql')}, ` +
      `${escapeSQL(effStr, 'postgresql')}, ` +
      `${Number(d.initialRisk?.impact) || 3}, ` +
      `${Number(d.initialRisk?.likelihood) || 3}, ` +
      `${escapeSQL(d.mitigationStrategy, 'postgresql')}, ` +
      `${escapeSQL(d.actionToControl, 'postgresql')}, ` +
      `${Number(d.residualRisk?.impact) || 2}, ` +
      `${Number(d.residualRisk?.likelihood) || 2}, ` +
      `${escapeSQL(d.owner, 'postgresql')}, ` +
      `${escapeSQL(d.raisedDate, 'postgresql')}, ` +
      `${escapeSQL(d.deadlineDate, 'postgresql')}, ` +
      `${escapeSQL(d.nextReviewDate || null, 'postgresql')}, ` +
      `${escapeSQL(d.finishedDate || null, 'postgresql')}, ` +
      `${escapeSQL(d.status || 'Open', 'postgresql')}, ` +
      `${escapeSQL(d.costToMitigate || '', 'postgresql')}, ` +
      `${escapeSQL(d.probabilityOfSuccess || '', 'postgresql')}, ` +
      `${escapeSQL(d.comment || '', 'postgresql')}, ` +
      `${escapeSQL(d.riskAppetite || 'Low', 'postgresql')}, ` +
      `${escapeSQL(d.reviewFrequency || 'Monthly', 'postgresql')}, ` +
      `${d.appliedModifiers && d.appliedModifiers.length > 0 ? modsArr : "'{}'::TEXT[]"}, ` +
      `${escapeSQL(d.createdBy || 'System', 'postgresql')}, ` +
      `${escapeSQL(d.lastUpdatedBy || 'System', 'postgresql')}, ` +
      `${escapeSQL(d.updatedAt || timestamp, 'postgresql')}` +
      `) ON CONFLICT (id) DO NOTHING;`
    );

    if (Array.isArray(d.history)) {
      d.history.forEach(h => {
        pgLines.push(`INSERT INTO risk_history (version_id, risk_item_id, timestamp, updated_by, changes) VALUES (` +
          `${escapeSQL(h.versionId || Math.random().toString(), 'postgresql')}, ` +
          `${escapeSQL(doc.id, 'postgresql')}, ` +
          `${escapeSQL(h.timestamp, 'postgresql')}, ` +
          `${escapeSQL(h.updatedBy || null, 'postgresql')}, ` +
          `${escapeSQL(h.changes || [], 'postgresql')}::JSONB` +
          `) ON CONFLICT (version_id) DO NOTHING;`
        );
      });
    }
  });

  torSnap.forEach(doc => {
    const d = doc.data();
    pgLines.push(`INSERT INTO tor_projects (` +
      `id, proposal_code, project_title, client_name, estimated_budget, submission_deadline, ` +
      `objectives, scope_of_work, internal_context, external_context, strategic_recommendations, ` +
      `constraints, risks, created_by, updated_at` +
      `) VALUES (` +
      `${escapeSQL(doc.id, 'postgresql')}, ` +
      `${escapeSQL(d.proposalCode || '', 'postgresql')}, ` +
      `${escapeSQL(d.projectTitle, 'postgresql')}, ` +
      `${escapeSQL(d.clientName, 'postgresql')}, ` +
      `${Number(d.estimatedBudget) || 0}, ` +
      `${escapeSQL(d.submissionDeadline || null, 'postgresql')}, ` +
      `${escapeSQL(d.objectives || '', 'postgresql')}, ` +
      `${escapeSQL(d.scopeOfWork || '', 'postgresql')}, ` +
      `${escapeSQL(d.internalContext || '', 'postgresql')}, ` +
      `${escapeSQL(d.externalContext || '', 'postgresql')}, ` +
      `${escapeSQL(d.strategicRecommendations || '', 'postgresql')}, ` +
      `${escapeSQL(d.constraints || [], 'postgresql')}::JSONB, ` +
      `${escapeSQL(d.risks || [], 'postgresql')}::JSONB, ` +
      `${escapeSQL(d.createdBy || null, 'postgresql')}, ` +
      `${escapeSQL(d.updatedAt || timestamp, 'postgresql')}` +
      `) ON CONFLICT (id) DO NOTHING;`
    );
  });

  pgLines.push(`\nCOMMIT;`);

  fs.writeFileSync('migration_data_postgresql.sql', pgLines.join('\n'));
  console.log("\n==================================================");
  console.log("  SUCCESSFULLY GENERATED SQL DUMPS!");
  console.log(`  PostgreSQL: ${path.resolve('migration_data_postgresql.sql')}`);
  console.log("==================================================");
}

runAdminMigration().catch(console.error);
