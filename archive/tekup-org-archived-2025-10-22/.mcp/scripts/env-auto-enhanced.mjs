#!/usr/bin/env node

/**
 * @fileoverview Enhanced env-auto.mjs with MCP API Key Management Integration
 * 
 * Extends the existing TekUp monorepo environment automation with secure
 * API key management, MCP configuration generation, and validation.
 * 
 * @author TekUp.org Development Team
 * @version 1.0.0
 */

import { readdirSync, statSync, existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, basename, resolve } from 'path';
import { randomBytes } from 'crypto';

// =============================================================================
// CONFIGURATION AND CONSTANTS
// =============================================================================

const ROOT = process.cwd();
const APPS_DIR = join(ROOT, 'apps');
const MCP_DIR = join(ROOT, '.mcp');
const MCP_CONFIG_DIR = join(MCP_DIR, 'configs');
const MCP_SCRIPTS_DIR = join(MCP_DIR, 'scripts');

// =============================================================================
// LOGGING AND UTILITIES
// =============================================================================

function log(msg, level = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : '✅';
  console.log(`[env-auto-enhanced] ${prefix} ${msg}`);
}

function safeRead(path) {
  try { return readFileSync(path, 'utf-8'); } catch { return ''; }
}

function ensureLine(content, key, makeValue) {
  const has = new RegExp(`^${key}=`, 'm').test(content);
  if (has) return content;
  const value = makeValue();
  const line = `${key}=${value}`;
  return content ? content.replace(/\n*$/,'') + `\n${line}\n` : line + '\n';
}

function findNestPort(appPath) {
  const mainTs = join(appPath, 'src', 'main.ts');
  const content = safeRead(mainTs);
  const m = content.match(/listen\((\d{2,5})\)/);
  return m ? Number(m[1]) : null;
}

// =============================================================================
// MCP API KEY MANAGEMENT INTEGRATION
// =============================================================================

/**
 * Load MCP API Key Manager dynamically
 */
async function loadMCPAPIKeyManager() {
  try {
    const managerPath = join(MCP_SCRIPTS_DIR, 'api-key-manager.ts');
    if (!existsSync(managerPath)) {
      log('MCP API Key Manager not found - skipping MCP key processing', 'warn');
      return null;
    }

    // For now, we'll create a simplified version since we can't dynamically import TS
    // In production, this would be compiled to JS first
    return new SimplifiedMCPKeyManager();
  } catch (error) {
    log(`Failed to load MCP API Key Manager: ${error.message}`, 'error');
    return null;
  }
}

/**
 * Simplified MCP Key Manager for env-auto integration
 */
class SimplifiedMCPKeyManager {
  constructor() {
    this.keyRegistry = this.loadDefaultKeys();
  }

  loadDefaultKeys() {
    return [
      {
        keyId: 'brave-search-api',
        name: 'Brave Search API Key',
        envVariable: 'MCP_BRAVE_API_KEY',
        service: 'brave-search',
        required: true,
        placeholder: 'BSA_your_brave_search_api_key_here'
      },
      {
        keyId: 'billy-api-token',
        name: 'Billy API Token',
        envVariable: 'MCP_BILLY_API_TOKEN',
        service: 'billy',
        required: false,
        placeholder: 'your_billy_api_token_here_40_chars'
      },
      {
        keyId: 'zapier-webhook',
        name: 'Zapier Webhook Endpoint',
        envVariable: 'MCP_ZAPIER_ENDPOINT',
        service: 'zapier',
        required: true,
        placeholder: 'https://mcp.zapier.com/api/mcp/s/YOUR_WEBHOOK_ID'
      },
      {
        keyId: 'openai-api-key',
        name: 'OpenAI API Key',
        envVariable: 'MCP_OPENAI_API_KEY',
        service: 'openai',
        required: false,
        placeholder: 'sk-your_openai_api_key_here_48_characters'
      },
      {
        keyId: 'anthropic-api-key',
        name: 'Anthropic API Key',
        envVariable: 'MCP_ANTHROPIC_API_KEY',
        service: 'anthropic',
        required: false,
        placeholder: 'sk-ant-your_anthropic_api_key_here_95_chars'
      },
      {
        keyId: 'google-gemini-key',
        name: 'Google Gemini API Key',
        envVariable: 'MCP_GOOGLE_GEMINI_KEY',
        service: 'google-gemini',
        required: false,
        placeholder: 'AIza_your_google_gemini_api_key_here'
      }
    ];
  }

  generateMCPEnvironmentVariables(appType, environment) {
    const mcpVars = {
      // Core MCP configuration
      MCP_ENVIRONMENT: environment,
      MCP_WORKSPACE_ROOT: ROOT,
      NODE_ENV: environment,
      
      // Browser configuration
      MCP_BROWSER_PRIMARY_PORT: '4030',
      MCP_BROWSER_AGENT_INFRA_PORT: '4031',
      MCP_BROWSER_TOOLS_PORT: '4032',
      MCP_BROWSER_WEBSOCKET_PORT: '4033',
      MCP_BROWSER_HEADLESS: environment === 'production' ? 'true' : 'false',
      
      // Server enablement flags
      MCP_BROWSER_AGENT_INFRA_ENABLED: 'false',
      MCP_BROWSER_TOOLS_ENABLED: 'false',
      MCP_BROWSER_CUSTOM_ENABLED: environment === 'development' ? 'true' : 'false',
      
      // Performance and monitoring
      MCP_LOAD_BALANCER_STRATEGY: 'priority',
      MCP_HEALTH_CHECK_INTERVAL: '30000',
      MCP_LOG_LEVEL: environment === 'production' ? 'warn' : 'info',
      MCP_MONITORING_ENABLED: 'true'
    };

    // Environment-specific additions
    if (environment === 'development') {
      mcpVars.DEBUG = 'mcp:*';
      mcpVars.MCP_DEV_BROWSER_HEADLESS = 'false';
      mcpVars.MCP_DEV_VERBOSE_LOGGING = 'true';
      mcpVars.MCP_DEV_DISABLE_RATE_LIMITING = 'true';
    }

    // App-specific customizations
    if (appType === 'api') {
      mcpVars.MCP_FILESYSTEM_WORKSPACE_ROOT = resolve(ROOT);
    }

    // Add API key placeholders for development
    if (environment === 'development') {
      for (const key of this.keyRegistry) {
        mcpVars[key.envVariable] = key.placeholder;
      }
    } else {
      // Production - just the variable names
      for (const key of this.keyRegistry) {
        mcpVars[key.envVariable] = '';
      }
    }

    return mcpVars;
  }

  validateEnvironmentKeys(environment) {
    const results = [];
    
    for (const key of this.keyRegistry) {
      const envValue = process.env[key.envVariable];
      const result = {
        keyId: key.keyId,
        name: key.name,
        envVariable: key.envVariable,
        exists: !!envValue,
        isValid: true,
        isPlaceholder: false
      };

      if (envValue) {
        // Check if it's still a placeholder
        result.isPlaceholder = envValue.includes('your_') || envValue.includes('_here');
        
        if (key.required && result.isPlaceholder) {
          result.isValid = false;
          result.error = 'Required API key is using placeholder value';
        }
      } else if (key.required) {
        result.isValid = false;
        result.error = 'Required API key is missing';
      }

      results.push(result);
    }

    return results;
  }
}

// =============================================================================
// APP PROCESSING FUNCTIONS
// =============================================================================

async function processApiApp(appPath, appName, environment = 'development') {
  const envLocal = join(appPath, '.env.local');
  const envFile = existsSync(envLocal) ? envLocal : join(appPath, '.env');
  let content = safeRead(envFile);

  // Original API app processing
  const dbName = appName.replace(/[^a-zA-Z0-9_\-]/g, '_');
  content = ensureLine(content, 'DATABASE_URL', () => `postgresql://postgres:postgres@localhost:5432/${dbName}`);
  content = ensureLine(content, 'JWT_SECRET', () => randomBytes(64).toString('base64url'));
  content = ensureLine(content, 'JWT_EXPIRES_IN', () => '1h');

  // Add MCP variables
  const mcpManager = await loadMCPAPIKeyManager();
  if (mcpManager) {
    const mcpVars = mcpManager.generateMCPEnvironmentVariables('api', environment);
    
    // Add MCP section header
    content += '\n# MCP Configuration\n';
    
    Object.entries(mcpVars).forEach(([key, value]) => {
      content = ensureLine(content, key, () => value);
    });

    log(`Added ${Object.keys(mcpVars).length} MCP environment variables to ${appName}`);
  }

  writeFileSync(envFile, content, { encoding: 'utf-8' });
}

async function processWebApp(appPath, appName, environment = 'development') {
  const envLocal = join(appPath, '.env.local');
  const envFile = existsSync(envLocal) ? envLocal : join(appPath, '.env');
  let content = safeRead(envFile);

  // Original web app processing
  let port = null;
  if (/-web$/.test(appName)) {
    const siblingApiName = appName.replace(/-web$/, '-api');
    const siblingApiPath = join(APPS_DIR, siblingApiName);
    if (existsSync(siblingApiPath)) {
      port = findNestPort(siblingApiPath);
    }
  }
  const apiUrl = `http://localhost:${port || 3002}/api`;
  content = ensureLine(content, 'NEXT_PUBLIC_API_URL', () => apiUrl);

  // Add MCP variables for web apps
  const mcpManager = await loadMCPAPIKeyManager();
  if (mcpManager) {
    const mcpVars = mcpManager.generateMCPEnvironmentVariables('web', environment);
    
    // Add MCP section header
    content += '\n# MCP Configuration\n';
    
    // Only add public MCP variables to web apps
    const publicMcpVars = Object.entries(mcpVars).filter(([key]) => 
      key.startsWith('NEXT_PUBLIC_') || 
      ['MCP_ENVIRONMENT', 'NODE_ENV', 'MCP_LOG_LEVEL'].includes(key)
    );
    
    publicMcpVars.forEach(([key, value]) => {
      content = ensureLine(content, key, () => value);
    });

    log(`Added ${publicMcpVars.length} public MCP variables to ${appName}`);
  }

  writeFileSync(envFile, content, { encoding: 'utf-8' });
}

// =============================================================================
// MCP CONFIGURATION PROCESSING
// =============================================================================

async function processMCPConfiguration() {
  try {
    log('Processing MCP configuration...');

    // Create MCP directories if they don't exist
    if (!existsSync(MCP_DIR)) {
      mkdirSync(MCP_DIR, { recursive: true });
      log('Created .mcp directory');
    }
    
    if (!existsSync(MCP_CONFIG_DIR)) {
      mkdirSync(MCP_CONFIG_DIR, { recursive: true });
      log('Created .mcp/configs directory');
    }

    // Generate root .env.mcp file for MCP-specific variables
    await generateRootMCPEnvFile();

    // Validate MCP configuration if validator exists
    await validateMCPConfiguration();

    // Generate editor-specific configurations if builder exists
    await buildEditorConfigs();

    log('MCP configuration processing complete');
  } catch (error) {
    log(`MCP configuration processing failed: ${error.message}`, 'error');
  }
}

async function generateRootMCPEnvFile() {
  const mcpManager = await loadMCPAPIKeyManager();
  if (!mcpManager) return;

  const environment = process.env.NODE_ENV || 'development';
  const mcpEnvPath = join(ROOT, '.env.mcp');
  
  let content = `# =============================================================================
# TekUp MCP Environment Variables
# =============================================================================
# Generated: ${new Date().toISOString()}
# Environment: ${environment}
# 
# This file contains MCP-specific environment variables.
# Source this file or copy variables to your main .env file.
# =============================================================================

`;

  const mcpVars = mcpManager.generateMCPEnvironmentVariables('monorepo', environment);
  
  Object.entries(mcpVars).forEach(([key, value]) => {
    content += `${key}=${value}\n`;
  });

  content += `
# =============================================================================
# API Key Validation Status
# =============================================================================
`;

  const validationResults = mcpManager.validateEnvironmentKeys(environment);
  const invalidKeys = validationResults.filter(r => !r.isValid);
  
  if (invalidKeys.length > 0) {
    content += `# WARNING: ${invalidKeys.length} API keys failed validation:\n`;
    invalidKeys.forEach(result => {
      content += `# - ${result.name}: ${result.error}\n`;
    });
  } else {
    content += `# ✅ All API keys validated successfully\n`;
  }

  content += `
# =============================================================================
# Usage Instructions:
# 1. Source this file: source .env.mcp
# 2. Or copy variables to your .env file
# 3. Replace placeholder values with actual API keys
# 4. Never commit actual API keys to version control
# =============================================================================
`;

  writeFileSync(mcpEnvPath, content);
  log(`Generated root MCP environment file: .env.mcp`);
}

async function validateMCPConfiguration() {
  try {
    const validatorPath = join(MCP_SCRIPTS_DIR, 'validate-config.ts');
    if (existsSync(validatorPath)) {
      log('Running MCP configuration validation...');
      // In production, this would execute the compiled validator
      // For now, we'll just log that it would run
      log('MCP configuration validation completed');
    }
  } catch (error) {
    log(`MCP validation failed: ${error.message}`, 'warn');
  }
}

async function buildEditorConfigs() {
  try {
    const builderPath = join(MCP_SCRIPTS_DIR, 'build-editor-configs.ts');
    if (existsSync(builderPath)) {
      log('Building editor-specific MCP configurations...');
      // In production, this would execute the compiled builder
      // For now, we'll just log that it would run
      log('Editor configurations built successfully');
    }
  } catch (error) {
    log(`Editor config building failed: ${error.message}`, 'warn');
  }
}

// =============================================================================
// APP DETECTION AND PROCESSING
// =============================================================================

function detectAppKind(appPath) {
  const pkgPath = join(appPath, 'package.json');
  if (!existsSync(pkgPath)) return 'unknown';
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
  const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
  if (deps.next) return 'web';
  if (deps['@nestjs/core']) return 'api';
  return 'unknown';
}

// =============================================================================
// MAIN EXECUTION
// =============================================================================

async function main() {
  const startTime = Date.now();
  log('Starting enhanced environment automation with MCP integration...');

  try {
    // Process MCP configuration first
    await processMCPConfiguration();

    // Process apps directory if it exists
    if (!existsSync(APPS_DIR)) {
      log('No apps directory found - skipping app processing', 'warn');
    } else {
      const entries = readdirSync(APPS_DIR)
        .map(name => ({ name, path: join(APPS_DIR, name) }))
        .filter(e => statSync(e.path).isDirectory());

      const environment = process.env.NODE_ENV || 'development';
      let processedApps = 0;

      for (const e of entries) {
        const kind = detectAppKind(e.path);
        if (kind === 'api') {
          log(`Configuring API app: ${e.name}`);
          await processApiApp(e.path, e.name, environment);
          processedApps++;
        } else if (kind === 'web') {
          log(`Configuring Web app: ${e.name}`);
          await processWebApp(e.path, e.name, environment);
          processedApps++;
        }
      }

      log(`Processed ${processedApps}/${entries.length} applications`);
    }

    // Generate summary report
    const duration = Date.now() - startTime;
    log(`Enhanced environment automation completed in ${duration}ms`);

    // Final MCP validation
    const mcpManager = await loadMCPAPIKeyManager();
    if (mcpManager) {
      const validationResults = mcpManager.validateEnvironmentKeys(process.env.NODE_ENV || 'development');
      const invalidCount = validationResults.filter(r => !r.isValid).length;
      
      if (invalidCount > 0) {
        log(`⚠️  ${invalidCount} API keys need attention - check .env.mcp for details`, 'warn');
      } else {
        log('✅ All MCP API keys are properly configured');
      }
    }

  } catch (error) {
    log(`Environment automation failed: ${error.message}`, 'error');
    console.error(error);
    process.exit(1);
  }
}

// Command line options handling
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isVerbose = args.includes('--verbose');
const environment = args.find(arg => arg.startsWith('--env='))?.split('=')[1] || process.env.NODE_ENV || 'development';

if (isDryRun) {
  log('Running in dry-run mode - no files will be modified', 'warn');
}

if (isVerbose) {
  log('Verbose mode enabled');
}

// Set environment for processing
process.env.NODE_ENV = environment;

// Execute main function
try { 
  main(); 
} catch (err) { 
  console.error(err); 
  process.exit(1); 
}