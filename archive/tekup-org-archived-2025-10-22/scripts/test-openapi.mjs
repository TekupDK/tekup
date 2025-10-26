#!/usr/bin/env node

/**
 * Test OpenAPI Generation
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : level === 'success' ? '✅' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function ensureDir(dir) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
    log(`Created directory: ${dir}`);
  }
}

// Test with flow-api first
async function testFlowAPI() {
  try {
    log('🚀 Testing OpenAPI generation for flow-api');
    
    const outputDir = join(rootDir, 'docs/site/static/openapi');
    ensureDir(outputDir);
    
    const appPath = join(rootDir, 'apps/flow-api');
    
    log('Building flow-api...');
    execSync('pnpm build', { 
      cwd: appPath, 
      stdio: 'inherit'
    });
    
    log('Exporting OpenAPI spec...');
    execSync('node dist/main.js', { 
      cwd: appPath, 
      stdio: 'inherit',
      env: { ...process.env, EXPORT_OPENAPI: '1' },
      timeout: 15000
    });
    
    // Check if the file was created
    const specPath = join(outputDir, 'flow-api.json');
    if (existsSync(specPath)) {
      log('✅ OpenAPI spec generated successfully!', 'success');
      const spec = JSON.parse(readFileSync(specPath, 'utf8'));
      log(`📊 Found ${Object.keys(spec.paths || {}).length} endpoints`);
    } else {
      log('❌ OpenAPI spec file not found', 'error');
    }
    
  } catch (error) {
    log(`❌ Failed: ${error.message}`, 'error');
    console.error(error);
  }
}

testFlowAPI();