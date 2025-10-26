#!/usr/bin/env node

/**
 * Automated TypeDoc Build Script
 * This script is called during the build process to regenerate documentation
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = level === 'error' ? '❌' : level === 'success' ? '✅' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function main() {
  try {
    log('Starting automated TypeDoc generation...');
    
    // Check if packages have changed
    const packagesDir = join(rootDir, 'packages');
    if (!existsSync(packagesDir)) {
      log('No packages directory found, skipping TypeDoc generation');
      return;
    }
    
    // Run the main generation script
    execSync('node scripts/generate-typedoc.mjs', { 
      cwd: rootDir, 
      stdio: 'inherit' 
    });
    
    log('Automated TypeDoc generation completed', 'success');
  } catch (error) {
    log(`Automated TypeDoc generation failed: ${error.message}`, 'error');
    process.exit(1);
  }
}

main();
