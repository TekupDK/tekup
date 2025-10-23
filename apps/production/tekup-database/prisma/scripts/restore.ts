/**
 * Database Restore Script
 * 
 * Restores database from a backup file
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';

const execAsync = promisify(exec);

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://tekup:tekup123@localhost:5432/tekup_db';

interface RestoreOptions {
  backupFile: string;
  clean?: boolean;
}

async function restore(options: RestoreOptions) {
  const { backupFile, clean = false } = options;

  if (!fs.existsSync(backupFile)) {
    throw new Error(`Backup file not found: ${backupFile}`);
  }

  console.log(`📥 Restoring database from: ${backupFile}`);
  
  if (clean) {
    console.log(`⚠️  Clean restore - will drop existing data!`);
  }

  try {
    let command = `psql "${DATABASE_URL}"`;
    
    if (clean) {
      command += ` --clean`;
    }
    
    command += ` < "${backupFile}"`;

    await execAsync(command);

    console.log(`✅ Database restored successfully!`);
  } catch (error) {
    console.error(`❌ Restore failed:`, error);
    throw error;
  }
}

// CLI usage
const args = process.argv.slice(2);
const backupFile = args[0];
const clean = args.includes('--clean');

if (!backupFile) {
  console.error('Usage: tsx restore.ts <backup-file> [--clean]');
  process.exit(1);
}

restore({ backupFile, clean }).catch(console.error);
