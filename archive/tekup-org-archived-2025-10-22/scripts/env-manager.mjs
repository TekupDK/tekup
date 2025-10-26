#!/usr/bin/env node
/**
 * Environment Manager for TekUp Monorepo
 * 
 * Usage:
 *   node scripts/env-manager.mjs init           # Create .env from .env.example
 *   node scripts/env-manager.mjs sync          # Sync env vars across apps
 *   node scripts/env-manager.mjs validate      # Validate all env configurations
 *   node scripts/env-manager.mjs copy-to-apps  # Copy root .env to all apps
 *   node scripts/env-manager.mjs status        # Show env status across monorepo
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.dirname(__dirname);

// Apps that need .env files
const APPS_WITH_ENV = [
  'flow-api',
  'flow-web', 
  'agentrooms-backend',
  'agentrooms-frontend',
  'agents-hub',
  'inbox-ai',
  'secure-platform',
  'tekup-crm-api',
  'tekup-crm-web',
  'tekup-lead-platform',
  'tekup-lead-platform-web',
  'voice-agent',
  'website'
];

// Environment variables that should exist everywhere
const CORE_ENV_VARS = [
  'NODE_ENV',
  'DATABASE_URL',
  'FLOW_API_URL',
  'FLOW_API_KEY'
];

class EnvManager {
  constructor() {
    this.rootEnvPath = path.join(rootDir, '.env');
    this.rootEnvExamplePath = path.join(rootDir, 'env.example');
  }

  // Initialize .env from env.example
  init() {
    console.log('🚀 Initializing environment configuration...');
    
    if (!fs.existsSync(this.rootEnvExamplePath)) {
      console.error('❌ env.example not found in root directory');
      return;
    }

    if (fs.existsSync(this.rootEnvPath)) {
      console.log('⚠️  .env already exists in root directory');
      const answer = this.prompt('Overwrite existing .env? (y/N): ');
      if (answer.toLowerCase() !== 'y') {
        console.log('Cancelled.');
        return;
      }
    }

    // Copy env.example to .env
    const exampleContent = fs.readFileSync(this.rootEnvExamplePath, 'utf8');
    fs.writeFileSync(this.rootEnvPath, exampleContent);
    
    console.log('✅ Created .env from env.example');
    console.log('📝 Please edit .env with your actual values');
  }

  // Sync environment variables across all apps
  sync() {
    console.log('🔄 Syncing environment variables across apps...');
    
    if (!fs.existsSync(this.rootEnvPath)) {
      console.error('❌ Root .env file not found. Run: node scripts/env-manager.mjs init');
      return;
    }

    const rootEnvContent = fs.readFileSync(this.rootEnvPath, 'utf8');
    const rootEnvVars = this.parseEnvFile(rootEnvContent);
    
    let syncedCount = 0;
    
    for (const appName of APPS_WITH_ENV) {
      const appEnvPath = path.join(rootDir, 'apps', appName, '.env');
      const appDir = path.dirname(appEnvPath);
      
      if (!fs.existsSync(appDir)) {
        console.log(`⚠️  Skipping ${appName} - directory not found`);
        continue;
      }

      // Create or update app .env
      let appEnvContent = '';
      let existingVars = {};
      
      if (fs.existsSync(appEnvPath)) {
        appEnvContent = fs.readFileSync(appEnvPath, 'utf8');
        existingVars = this.parseEnvFile(appEnvContent);
      }

      // Merge root vars with existing app vars (app vars take precedence)
      const mergedVars = { ...rootEnvVars, ...existingVars };
      const newContent = this.generateEnvContent(mergedVars, appName);
      
      fs.writeFileSync(appEnvPath, newContent);
      syncedCount++;
      
      console.log(`✅ Synced ${appName}`);
    }
    
    console.log(`🎉 Synced environment variables to ${syncedCount} apps`);
  }

  // Validate environment configurations
  validate() {
    console.log('🔍 Validating environment configurations...');
    
    const issues = [];
    
    // Check root .env
    if (!fs.existsSync(this.rootEnvPath)) {
      issues.push('❌ Root .env file missing');
    } else {
      const rootVars = this.parseEnvFile(fs.readFileSync(this.rootEnvPath, 'utf8'));
      
      for (const coreVar of CORE_ENV_VARS) {
        if (!rootVars[coreVar] || rootVars[coreVar].includes('your-') || rootVars[coreVar].includes('example')) {
          issues.push(`⚠️  ${coreVar} not properly configured in root .env`);
        }
      }
    }
    
    // Check app .env files
    for (const appName of APPS_WITH_ENV) {
      const appEnvPath = path.join(rootDir, 'apps', appName, '.env');
      const appDir = path.dirname(appEnvPath);
      
      if (!fs.existsSync(appDir)) continue;
      
      if (!fs.existsSync(appEnvPath)) {
        issues.push(`⚠️  ${appName} missing .env file`);
      } else {
        const appVars = this.parseEnvFile(fs.readFileSync(appEnvPath, 'utf8'));
        
        for (const coreVar of CORE_ENV_VARS) {
          if (!appVars[coreVar]) {
            issues.push(`⚠️  ${appName} missing ${coreVar}`);
          }
        }
      }
    }
    
    if (issues.length === 0) {
      console.log('✅ All environment configurations look good!');
    } else {
      console.log('Issues found:');
      issues.forEach(issue => console.log(issue));
      console.log('\n💡 Run: node scripts/env-manager.mjs sync');
    }
  }

  // Copy root .env to all apps
  copyToApps() {
    console.log('📋 Copying root .env to all apps...');
    
    if (!fs.existsSync(this.rootEnvPath)) {
      console.error('❌ Root .env file not found');
      return;
    }

    const rootEnvContent = fs.readFileSync(this.rootEnvPath, 'utf8');
    let copiedCount = 0;
    
    for (const appName of APPS_WITH_ENV) {
      const appEnvPath = path.join(rootDir, 'apps', appName, '.env');
      const appDir = path.dirname(appEnvPath);
      
      if (!fs.existsSync(appDir)) {
        console.log(`⚠️  Skipping ${appName} - directory not found`);
        continue;
      }

      const appEnvContent = this.generateEnvContent(
        this.parseEnvFile(rootEnvContent),
        appName
      );
      
      fs.writeFileSync(appEnvPath, appEnvContent);
      copiedCount++;
      
      console.log(`✅ Copied to ${appName}`);
    }
    
    console.log(`🎉 Copied .env to ${copiedCount} apps`);
  }

  // Show environment status across monorepo
  status() {
    console.log('📊 Environment Status Across Monorepo\n');
    
    // Root status
    console.log('🏠 Root Directory:');
    console.log(`  .env: ${fs.existsSync(this.rootEnvPath) ? '✅' : '❌'}`);
    console.log(`  env.example: ${fs.existsSync(this.rootEnvExamplePath) ? '✅' : '❌'}`);
    
    if (fs.existsSync(this.rootEnvPath)) {
      const rootVars = this.parseEnvFile(fs.readFileSync(this.rootEnvPath, 'utf8'));
      console.log(`  Variables: ${Object.keys(rootVars).length}`);
    }
    
    console.log('\\n📱 Applications:');
    
    for (const appName of APPS_WITH_ENV) {
      const appEnvPath = path.join(rootDir, 'apps', appName, '.env');
      const appDir = path.dirname(appEnvPath);
      
      if (!fs.existsSync(appDir)) {
        console.log(`  ${appName}: 🚫 Not found`);
        continue;
      }
      
      const hasEnv = fs.existsSync(appEnvPath);
      let varCount = 0;
      let missingCore = [];
      
      if (hasEnv) {
        const appVars = this.parseEnvFile(fs.readFileSync(appEnvPath, 'utf8'));
        varCount = Object.keys(appVars).length;
        missingCore = CORE_ENV_VARS.filter(v => !appVars[v]);
      }
      
      const status = hasEnv ? '✅' : '❌';
      const coreStatus = missingCore.length === 0 ? '✅' : `⚠️  (missing: ${missingCore.join(', ')})`;
      
      console.log(`  ${appName}: ${status} .env (${varCount} vars) ${hasEnv ? coreStatus : ''}`);
    }
  }

  // Parse .env file content into key-value object
  parseEnvFile(content) {
    const vars = {};
    const lines = content.split('\\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [key, ...valueParts] = trimmed.split('=');
        const value = valueParts.join('=').trim();
        vars[key.trim()] = value;
      }
    }
    
    return vars;
  }

  // Generate .env content with app-specific header
  generateEnvContent(vars, appName) {
    const header = `# TekUp ${appName.toUpperCase()} Environment Variables
# Auto-generated by env-manager.mjs
# Last updated: ${new Date().toISOString()}

`;
    
    const lines = Object.entries(vars).map(([key, value]) => `${key}=${value}`);
    return header + lines.join('\\n') + '\\n';
  }

  // Simple prompt for Node.js (synchronous)
  prompt(question) {
    process.stdout.write(question);
    const fd = process.stdin.fd;
    const buffer = Buffer.alloc(256);
    const bytesRead = fs.readSync(fd, buffer, 0, 256, null);
    return buffer.toString('utf8', 0, bytesRead).trim();
  }
}

// CLI Interface
const manager = new EnvManager();
const command = process.argv[2];

switch (command) {
  case 'init':
    manager.init();
    break;
  case 'sync':
    manager.sync();
    break;
  case 'validate':
    manager.validate();
    break;
  case 'copy-to-apps':
    manager.copyToApps();
    break;
  case 'status':
    manager.status();
    break;
  default:
    console.log(`
TekUp Environment Manager

Usage:
  node scripts/env-manager.mjs <command>

Commands:
  init          Create .env from env.example
  sync          Sync env vars across apps (recommended)
  validate      Validate all env configurations  
  copy-to-apps  Copy root .env to all apps (overwrites)
  status        Show env status across monorepo

Examples:
  node scripts/env-manager.mjs init
  node scripts/env-manager.mjs sync
  node scripts/env-manager.mjs status
`);
    break;
}
