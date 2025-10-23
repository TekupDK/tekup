/**
 * Database Backup Script
 * 
 * Creates a backup of the entire database or specific schemas
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://tekup:tekup123@localhost:5432/tekup_db';
const BACKUP_DIR = process.env.BACKUP_PATH || './backups';

interface BackupOptions {
  schema?: string;
  outputFile?: string;
}

async function backup(options: BackupOptions = {}) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const schema = options.schema || 'all';
  const filename = options.outputFile || `backup_${schema}_${timestamp}.sql`;
  const outputPath = path.join(BACKUP_DIR, filename);

  // Ensure backup directory exists
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  console.log(`📦 Creating backup: ${filename}`);
  console.log(`   Schema: ${schema}`);
  console.log(`   Output: ${outputPath}`);

  try {
    let command = `pg_dump "${DATABASE_URL}"`;
    
    if (options.schema && options.schema !== 'all') {
      command += ` --schema=${options.schema}`;
    }
    
    command += ` > "${outputPath}"`;

    await execAsync(command);

    const stats = fs.statSync(outputPath);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

    console.log(`✅ Backup created successfully!`);
    console.log(`   Size: ${fileSizeMB} MB`);
    console.log(`   Location: ${outputPath}`);

    return outputPath;
  } catch (error) {
    console.error(`❌ Backup failed:`, error);
    throw error;
  }
}

// CLI usage
const args = process.argv.slice(2);
const schemaArg = args.find(arg => arg.startsWith('--schema='));
const schema = schemaArg ? schemaArg.split('=')[1] : undefined;

backup({ schema }).catch(console.error);
