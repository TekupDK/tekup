#!/usr/bin/env node

/**
 * OpenAPI Export Script
 * Exports OpenAPI specifications from all NestJS applications
 */

import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const apps = [
  { name: 'flow-api', port: 3000 },
  { name: 'tekup-crm-api', port: 3001 },
  { name: 'tekup-lead-platform', port: 3002 },
  { name: 'secure-platform', port: 3003 },
  { name: 'voicedk-api', port: 3004 },
];

function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = level === 'error' ? '❌' : level === 'success' ? '✅' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

async function exportOpenAPI() {
  log('🚀 Starting OpenAPI export...');
  
  for (const app of apps) {
    try {
      log(`Exporting OpenAPI spec for ${app.name}...`);
      
      const appPath = join(rootDir, 'apps', app.name);
      
      // Build the app first
      execSync('pnpm build', { 
        cwd: appPath, 
        stdio: 'pipe' 
      });
      
      // Export OpenAPI spec
      execSync('node dist/main.js', { 
        cwd: appPath, 
        stdio: 'pipe',
        env: { ...process.env, EXPORT_OPENAPI: '1' },
        timeout: 5000
      });
      
      log(`✅ Exported OpenAPI spec for ${app.name}`, 'success');
    } catch (error) {
      log(`❌ Failed to export OpenAPI spec for ${app.name}: ${error.message}`, 'error');
    }
  }
  
  log('✨ OpenAPI export completed!', 'success');
}

exportOpenAPI();
