/**
 * ProRisk Manager AI - Relational Database Migration Tool
 * 
 * This tool connects to your Firebase Firestore database, extracts all collections,
 * and generates a clean 'migration_data.sql' file containing complete SQL INSERT 
 * statements ready to be executed on a PostgreSQL or MySQL server.
 * 
 * Supported Methods:
 * 1. Admin SDK Mode (Recommended - Requires Service Account JSON key): Bypasses all Security Rules.
 * 2. Client SDK Mode: Requires public read permissions on Firestore.
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';

// --- CONFIGURATION ---
const SERVICE_ACCOUNT_FILE = './firebase-service-account.json'; // Path to your Firebase service account key

// SQL Utility: Escapes SQL strings securely
function escapeSQL(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (typeof val === 'number') return val;
  return `'${String(val).replace(/'/g, "''")}'`;
}

async function runAdminMigration() {
  console.log("==================================================");
  console.log("  PRORISK MANAGER AI - DATABASE MIGRATION UTILITY ");
  console.log("==================================================");

  // Check if service account key exists
  if (!fs.existsSync(SERVICE_ACCOUNT_FILE)) {
    console.error(`[Error] Service account key not found at: ${path.resolve(SERVICE_ACCOUNT_FILE)}`);
    console.log("\nTo retrieve this key:");
    console.log("1. Go to Firebase Console -> Project Settings -> Service Accounts.");
    console.log("2. Click 'Generate new private key'.");
    console.log("3. Save it as 'firebase-service-account.json' in this project folder.");
    console.log("4. Re-run this migration tool: node database_migration_tool.js\n");
    process.exit(1);
  }

  console.log("Initializing Firebase Admin SDK...");
  const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_FILE, 'utf8'));
  
  initializeApp({
    credential: cert(serviceAccount)
  });

  const db = getFirestore();
  const sqlStatements = [];
  
  sqlStatements.push(`-- ProRisk Manager AI - Production Relational SQL Migration Dump`);
  sqlStatements.push(`-- Generated on: ${new Date().toISOString()}`);
  sqlStatements.push(`-- Target Engine: PostgreSQL / MySQL\n`);
  sqlStatements.push(`BEGIN;\n`);

  try {
    // 1. Fetch baseline_risks
    console.log("\n[1/3] Extracting baseline_risks...");
    const baselineSnapshot = await db.collection('baseline_risks').get();
    console.log(`-> Found ${baselineSnapshot.size} baseline definition(s).`);
    baselineSnapshot.forEach(doc => {
      const data = doc.data();
      sqlStatements.push(`INSERT INTO baseline_risks (id, discipline, factor, base_impact, base_likelihood) VALUES (` +
        `${escapeSQL(doc.id)}, ` +
        `${escapeSQL(data.discipline)}, ` +
        `${escapeSQL(data.factor)}, ` +
        `${data.baseImpact || 3}, ` +
        `${data.baseLikelihood || 3}` +
        `) ON CONFLICT (id) DO NOTHING;`
      );
    });

    // 2. Fetch users
    console.log("\n[2/3] Extracting users & authorization lists...");
    const usersSnapshot = await db.collection('users').get();
    console.log(`-> Found ${usersSnapshot.size} user profile(s).`);
    usersSnapshot.forEach(doc => {
      const data = doc.data();
      const userId = doc.id;
      sqlStatements.push(`INSERT INTO users (id, email, role, is_default_password, created_at, updated_at) VALUES (` +
        `${escapeSQL(userId)}, ` +
        `${escapeSQL(data.email)}, ` +
        `${escapeSQL(data.role || 'User')}, ` +
        `${data.isDefaultPassword ? 'TRUE' : 'FALSE'}, ` +
        `${escapeSQL(data.createdAt || new Date().toISOString())}, ` +
        `${escapeSQL(data.updatedAt || null)}` +
        `) ON CONFLICT (id) DO NOTHING;`
      );

      // Map assigned projects array to junction table
      const assignedProjects = data.assignedProjects || [];
      assignedProjects.forEach(proj => {
        sqlStatements.push(`INSERT INTO user_assigned_projects (user_id, project_no) VALUES (` +
          `${escapeSQL(userId)}, ` +
          `${escapeSQL(proj)}` +
          `) ON CONFLICT (user_id, project_no) DO NOTHING;`
        );
      });
    });

    // 3. Fetch risks
    console.log("\n[3/3] Extracting risks & transaction history...");
    const risksSnapshot = await db.collection('risks').get();
    console.log(`-> Found ${risksSnapshot.size} active risk item(s).`);
    risksSnapshot.forEach(doc => {
      const data = doc.data();
      const riskItemId = doc.id;

      const initialImpact = data.initialRisk?.impact || 3;
      const initialLikelihood = data.initialRisk?.likelihood || 3;
      const residualImpact = data.residualRisk?.impact || 2;
      const residualLikelihood = data.residualRisk?.likelihood || 2;

      sqlStatements.push(`INSERT INTO risks (` +
        `id, risk_id, project_no, project_name, pm_name, email, industry_type, ` +
        `risk_category, description, initial_impact, initial_likelihood, ` +
        `possible_effect, mitigation_strategy, action_to_control, ` +
        `residual_impact, residual_likelihood, owner, raised_date, ` +
        `deadline_date, finished_date, status, comment, created_by, ` +
        `last_updated_by, updated_at` +
        `) VALUES (` +
        `${escapeSQL(riskItemId)}, ` +
        `${escapeSQL(data.riskId)}, ` +
        `${escapeSQL(data.projectNo)}, ` +
        `${escapeSQL(data.projectName)}, ` +
        `${escapeSQL(data.pmName)}, ` +
        `${escapeSQL(data.email)}, ` +
        `${escapeSQL(data.industryType || null)}, ` +
        `${escapeSQL(data.riskCategory)}, ` +
        `${escapeSQL(data.description)}, ` +
        `${initialImpact}, ` +
        `${initialLikelihood}, ` +
        `${escapeSQL(data.possibleEffect)}, ` +
        `${escapeSQL(data.mitigationStrategy)}, ` +
        `${escapeSQL(data.actionToControl)}, ` +
        `${residualImpact}, ` +
        `${residualLikelihood}, ` +
        `${escapeSQL(data.owner)}, ` +
        `${escapeSQL(data.raisedDate)}, ` +
        `${escapeSQL(data.deadlineDate)}, ` +
        `${escapeSQL(data.finishedDate || null)}, ` +
        `${escapeSQL(data.status || 'Open')}, ` +
        `${escapeSQL(data.comment || '')}, ` +
        `${escapeSQL(data.createdBy || null)}, ` +
        `${escapeSQL(data.lastUpdatedBy || null)}, ` +
        `${escapeSQL(data.updatedAt || new Date().toISOString())}` +
        `) ON CONFLICT (id) DO NOTHING;`
      );

      // Map applied modifiers array to junction table
      const appliedModifiers = data.appliedModifiers || [];
      appliedModifiers.forEach(mod => {
        sqlStatements.push(`INSERT INTO risk_modifiers (risk_item_id, modifier_name) VALUES (` +
          `${escapeSQL(riskItemId)}, ` +
          `${escapeSQL(mod)}` +
          `) ON CONFLICT (risk_item_id, modifier_name) DO NOTHING;`
        );
      });

      // Map history snapshots logs
      const history = data.history || [];
      history.forEach(hist => {
        const changesJson = JSON.stringify(hist.changes || []);
        sqlStatements.push(`INSERT INTO risk_history (risk_item_id, version_id, timestamp, updated_by, changes) VALUES (` +
          `${escapeSQL(riskItemId)}, ` +
          `${escapeSQL(hist.versionId)}, ` +
          `${escapeSQL(hist.timestamp)}, ` +
          `${escapeSQL(hist.updatedBy || null)}, ` +
          `${escapeSQL(changesJson)}` +
          `);`
        );
      });
    });

    sqlStatements.push(`\nCOMMIT;`);

    // Output to file
    const outputFilename = 'migration_data.sql';
    fs.writeFileSync(outputFilename, sqlStatements.join('\n'));
    console.log("\n==================================================");
    console.log("  SUCCESSFULLY GENERATED SQL DUMP!");
    console.log(`  File location: ${path.resolve(outputFilename)}`);
    console.log("==================================================");

  } catch (error) {
    console.error("\n[Error during migration execution]:", error);
  }
}

runAdminMigration();
