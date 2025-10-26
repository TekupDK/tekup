#!/usr/bin/env node

/**
 * @fileoverview TekUp MCP Secure API Key Management System
 * 
 * Provides secure API key management with environment variable references,
 * key rotation, validation, and integration with env-auto.mjs system.
 * 
 * @author TekUp.org Development Team
 * @version 1.0.0
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, join } from 'path';
import { randomBytes, createHash } from 'crypto';
import { loadMCPConfig } from './config-loader.js';
import type { MCPConfig } from '../schemas/types.js';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

export interface APIKeyReference {
  keyId: string;
  name: string;
  description: string;
  envVariable: string;
  service: string;
  required: boolean;
  rotatable: boolean;
  lastRotated?: string;
  expiresAt?: string;
  createdAt: string;
  validationPattern?: string;
  metadata?: Record<string, any>;
}

export interface KeyValidationResult {
  keyId: string;
  isValid: boolean;
  exists: boolean;
  error?: string;
  warnings?: string[];
  lastChecked: string;
}

export interface KeyRotationConfig {
  enabled: boolean;
  schedule?: string; // cron format
  retentionDays: number;
  notifications: {
    enabled: boolean;
    methods: string[];
    beforeExpiryDays: number;
  };
  backupLocation?: string;
}

export interface EnvironmentKeyMapping {
  [environment: string]: {
    [keyId: string]: {
      envVariable: string;
      value?: string; // Only for development/testing
      secure: boolean;
    };
  };
}

// =============================================================================
// API KEY MANAGER CLASS
// =============================================================================

export class MCPAPIKeyManager {
  private configDir: string;
  private keysConfigPath: string;
  private keyRegistry: Map<string, APIKeyReference> = new Map();
  private rotationConfig: KeyRotationConfig;
  
  constructor(configDir?: string) {
    this.configDir = configDir || resolve(process.cwd(), '.mcp');
    this.keysConfigPath = join(this.configDir, 'configs', 'api-keys.json');
    
    // Default rotation configuration
    this.rotationConfig = {
      enabled: true,
      schedule: '0 2 * * 0', // Weekly on Sundays at 2 AM
      retentionDays: 30,
      notifications: {
        enabled: true,
        methods: ['log', 'file'],
        beforeExpiryDays: 7
      },
      backupLocation: join(this.configDir, 'backups', 'api-keys')
    };
    
    this.loadKeyRegistry();
  }

  /**
   * Load API key registry from configuration
   */
  private loadKeyRegistry(): void {
    try {
      if (existsSync(this.keysConfigPath)) {
        const content = readFileSync(this.keysConfigPath, 'utf8');
        const data = JSON.parse(content);
        
        if (data.keys) {
          for (const key of data.keys) {
            this.keyRegistry.set(key.keyId, key);
          }
        }
        
        if (data.rotationConfig) {
          this.rotationConfig = { ...this.rotationConfig, ...data.rotationConfig };
        }
        
        console.log(`✅ Loaded ${this.keyRegistry.size} API key references`);
      } else {
        console.log('📋 No existing API key registry found - creating default configuration');
        this.createDefaultKeyRegistry();
      }
    } catch (error) {
      console.error('❌ Failed to load API key registry:', error);
      this.createDefaultKeyRegistry();
    }
  }

  /**
   * Create default API key registry based on inventory analysis
   */
  private createDefaultKeyRegistry(): void {
    const defaultKeys: APIKeyReference[] = [
      {
        keyId: 'brave-search-api',
        name: 'Brave Search API Key',
        description: 'API key for Brave Search service integration',
        envVariable: 'MCP_BRAVE_API_KEY',
        service: 'brave-search',
        required: true,
        rotatable: true,
        createdAt: new Date().toISOString(),
        validationPattern: '^BSA[A-Za-z0-9]{20,40}$',
        metadata: {
          provider: 'Brave',
          scopes: ['search', 'local-search'],
          rateLimit: '1000/hour'
        }
      },
      {
        keyId: 'billy-api-token',
        name: 'Billy API Token',
        description: 'Authentication token for Billy invoice service',
        envVariable: 'MCP_BILLY_API_TOKEN',
        service: 'billy',
        required: false,
        rotatable: true,
        createdAt: new Date().toISOString(),
        validationPattern: '^[a-f0-9]{40}$',
        metadata: {
          provider: 'Billy',
          environment: 'development',
          usage: 'invoice-management'
        }
      },
      {
        keyId: 'zapier-webhook',
        name: 'Zapier Webhook Endpoint',
        description: 'Webhook endpoint for Zapier automation integration',
        envVariable: 'MCP_ZAPIER_ENDPOINT',
        service: 'zapier',
        required: true,
        rotatable: false,
        createdAt: new Date().toISOString(),
        validationPattern: '^https://mcp\\.zapier\\.com/api/mcp/s/[A-Za-z0-9]+.*$',
        metadata: {
          provider: 'Zapier',
          type: 'webhook',
          triggers: ['automation', 'workflow']
        }
      },
      {
        keyId: 'openai-api-key',
        name: 'OpenAI API Key',
        description: 'API key for OpenAI GPT services',
        envVariable: 'MCP_OPENAI_API_KEY',
        service: 'openai',
        required: false,
        rotatable: true,
        createdAt: new Date().toISOString(),
        validationPattern: '^sk-[A-Za-z0-9]{48}$',
        metadata: {
          provider: 'OpenAI',
          models: ['gpt-4', 'gpt-3.5-turbo'],
          usage: 'ai-assistance'
        }
      },
      {
        keyId: 'anthropic-api-key',
        name: 'Anthropic API Key',
        description: 'API key for Claude AI services',
        envVariable: 'MCP_ANTHROPIC_API_KEY',
        service: 'anthropic',
        required: false,
        rotatable: true,
        createdAt: new Date().toISOString(),
        validationPattern: '^sk-ant-[A-Za-z0-9\\-_]{95}$',
        metadata: {
          provider: 'Anthropic',
          models: ['claude-3', 'claude-2'],
          usage: 'ai-assistance'
        }
      },
      {
        keyId: 'google-gemini-key',
        name: 'Google Gemini API Key',
        description: 'API key for Google Gemini AI services',
        envVariable: 'MCP_GOOGLE_GEMINI_KEY',
        service: 'google-gemini',
        required: false,
        rotatable: true,
        createdAt: new Date().toISOString(),
        validationPattern: '^AIza[A-Za-z0-9\\-_]{35}$',
        metadata: {
          provider: 'Google',
          models: ['gemini-pro', 'gemini-vision'],
          usage: 'ai-assistance'
        }
      }
    ];

    for (const key of defaultKeys) {
      this.keyRegistry.set(key.keyId, key);
    }

    this.saveKeyRegistry();
    console.log(`✅ Created default API key registry with ${defaultKeys.length} keys`);
  }

  /**
   * Save API key registry to configuration file
   */
  private saveKeyRegistry(): void {
    try {
      const configDir = join(this.configDir, 'configs');
      if (!existsSync(configDir)) {
        mkdirSync(configDir, { recursive: true });
      }

      const data = {
        version: '1.0.0',
        lastUpdated: new Date().toISOString(),
        rotationConfig: this.rotationConfig,
        keys: Array.from(this.keyRegistry.values())
      };

      writeFileSync(this.keysConfigPath, JSON.stringify(data, null, 2));
      console.log('✅ API key registry saved successfully');
    } catch (error) {
      console.error('❌ Failed to save API key registry:', error);
      throw error;
    }
  }

  /**
   * Add or update an API key reference
   */
  addKeyReference(keyRef: Omit<APIKeyReference, 'createdAt'>): void {
    const fullKeyRef: APIKeyReference = {
      ...keyRef,
      createdAt: new Date().toISOString()
    };

    this.keyRegistry.set(keyRef.keyId, fullKeyRef);
    this.saveKeyRegistry();
    
    console.log(`✅ Added API key reference: ${keyRef.name} (${keyRef.keyId})`);
  }

  /**
   * Remove an API key reference
   */
  removeKeyReference(keyId: string): boolean {
    const deleted = this.keyRegistry.delete(keyId);
    if (deleted) {
      this.saveKeyRegistry();
      console.log(`✅ Removed API key reference: ${keyId}`);
    }
    return deleted;
  }

  /**
   * Get all API key references
   */
  getAllKeyReferences(): APIKeyReference[] {
    return Array.from(this.keyRegistry.values());
  }

  /**
   * Get API key reference by ID
   */
  getKeyReference(keyId: string): APIKeyReference | undefined {
    return this.keyRegistry.get(keyId);
  }

  /**
   * Validate all API keys in current environment
   */
  async validateAllKeys(): Promise<KeyValidationResult[]> {
    console.log('🔍 Validating all API keys...');
    
    const results: KeyValidationResult[] = [];
    
    for (const [keyId, keyRef] of this.keyRegistry) {
      const result = await this.validateSingleKey(keyId, keyRef);
      results.push(result);
    }
    
    const valid = results.filter(r => r.isValid).length;
    const total = results.length;
    
    console.log(`📊 Validation Results: ${valid}/${total} keys valid`);
    
    return results;
  }

  /**
   * Validate a single API key
   */
  private async validateSingleKey(keyId: string, keyRef: APIKeyReference): Promise<KeyValidationResult> {
    const result: KeyValidationResult = {
      keyId,
      isValid: false,
      exists: false,
      lastChecked: new Date().toISOString()
    };

    try {
      // Check if environment variable exists
      const envValue = process.env[keyRef.envVariable];
      result.exists = !!envValue;

      if (!result.exists) {
        result.error = `Environment variable ${keyRef.envVariable} is not set`;
        return result;
      }

      // Validate format if pattern is provided
      if (keyRef.validationPattern && envValue) {
        const pattern = new RegExp(keyRef.validationPattern);
        if (!pattern.test(envValue)) {
          result.error = `API key format validation failed for pattern: ${keyRef.validationPattern}`;
          return result;
        }
      }

      // Check if key is required
      if (keyRef.required && !envValue) {
        result.error = `Required API key is missing`;
        return result;
      }

      // Check expiration
      if (keyRef.expiresAt) {
        const expiryDate = new Date(keyRef.expiresAt);
        const now = new Date();
        
        if (expiryDate <= now) {
          result.error = `API key expired on ${keyRef.expiresAt}`;
          return result;
        }
        
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysUntilExpiry <= this.rotationConfig.notifications.beforeExpiryDays) {
          result.warnings = [`API key expires in ${daysUntilExpiry} days`];
        }
      }

      result.isValid = true;
      
    } catch (error) {
      result.error = `Validation error: ${error.message}`;
    }

    return result;
  }

  /**
   * Generate environment variables mapping for env-auto.mjs integration
   */
  generateEnvironmentMapping(environment: string = 'development'): EnvironmentKeyMapping {
    const mapping: EnvironmentKeyMapping = {
      [environment]: {}
    };

    for (const [keyId, keyRef] of this.keyRegistry) {
      mapping[environment][keyId] = {
        envVariable: keyRef.envVariable,
        secure: keyRef.required || keyRef.service !== 'development',
        // Only include actual values for development environment and non-sensitive keys
        ...(environment === 'development' && !keyRef.required ? { value: '' } : {})
      };
    }

    return mapping;
  }

  /**
   * Generate .env template content
   */
  generateEnvTemplate(environment: string = 'development', includeExamples: boolean = true): string {
    let content = `# =============================================================================
# TekUp MCP API Keys - ${environment.toUpperCase()} Environment
# =============================================================================
# Generated: ${new Date().toISOString()}
# 
# SECURITY NOTE: Never commit actual API keys to version control!
# This file should be added to .gitignore
# =============================================================================

`;

    for (const [keyId, keyRef] of this.keyRegistry) {
      content += `# ${keyRef.name}
# ${keyRef.description}
# Service: ${keyRef.service}
# Required: ${keyRef.required}
# Rotatable: ${keyRef.rotatable}
`;

      if (keyRef.validationPattern) {
        content += `# Format: ${keyRef.validationPattern}
`;
      }

      if (keyRef.metadata) {
        content += `# Metadata: ${JSON.stringify(keyRef.metadata)}
`;
      }

      // Add the environment variable
      if (includeExamples && environment === 'development') {
        // Provide example/placeholder for development
        const placeholder = this.generatePlaceholder(keyRef);
        content += `${keyRef.envVariable}=${placeholder}
`;
      } else {
        // Just the variable name for production
        content += `${keyRef.envVariable}=
`;
      }

      content += '\n';
    }

    content += `# =============================================================================
# Additional MCP Configuration
# =============================================================================

# Environment identifier
MCP_ENVIRONMENT=${environment}

# Node environment  
NODE_ENV=${environment}

# Debug mode (development only)
${environment === 'development' ? 'DEBUG=mcp:*' : '# DEBUG=mcp:*'}

# Log level
MCP_LOG_LEVEL=${environment === 'production' ? 'warn' : 'info'}

# =============================================================================
# Usage Instructions:
# 1. Copy this file to .env in your project root
# 2. Fill in the actual API key values
# 3. Never commit the .env file to version control
# 4. Use different .env files for different environments
# =============================================================================
`;

    return content;
  }

  /**
   * Generate placeholder value for development environment
   */
  private generatePlaceholder(keyRef: APIKeyReference): string {
    if (keyRef.validationPattern) {
      // Generate a realistic placeholder based on the pattern
      switch (keyRef.keyId) {
        case 'brave-search-api':
          return 'BSA_your_brave_search_api_key_here';
        case 'billy-api-token':
          return 'your_billy_api_token_here_40_chars';
        case 'zapier-webhook':
          return 'https://mcp.zapier.com/api/mcp/s/YOUR_WEBHOOK_ID';
        case 'openai-api-key':
          return 'sk-your_openai_api_key_here_48_characters';
        case 'anthropic-api-key':
          return 'sk-ant-your_anthropic_api_key_here_95_chars';
        case 'google-gemini-key':
          return 'AIza_your_google_gemini_api_key_here';
        default:
          return `your_${keyRef.service}_api_key_here`;
      }
    }
    return `your_${keyRef.service}_api_key_here`;
  }

  /**
   * Generate key rotation schedule for a key
   */
  scheduleKeyRotation(keyId: string, rotationInterval: number = 30): boolean {
    const keyRef = this.keyRegistry.get(keyId);
    if (!keyRef || !keyRef.rotatable) {
      console.log(`⚠️  Key ${keyId} is not rotatable`);
      return false;
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + rotationInterval);

    keyRef.expiresAt = expiresAt.toISOString();
    keyRef.lastRotated = new Date().toISOString();
    
    this.keyRegistry.set(keyId, keyRef);
    this.saveKeyRegistry();
    
    console.log(`✅ Scheduled rotation for ${keyRef.name} on ${expiresAt.toDateString()}`);
    return true;
  }

  /**
   * Get keys that need rotation
   */
  getKeysNeedingRotation(): APIKeyReference[] {
    const now = new Date();
    const warningThreshold = new Date();
    warningThreshold.setDate(now.getDate() + this.rotationConfig.notifications.beforeExpiryDays);

    return Array.from(this.keyRegistry.values()).filter(key => {
      if (!key.rotatable || !key.expiresAt) return false;
      
      const expiryDate = new Date(key.expiresAt);
      return expiryDate <= warningThreshold;
    });
  }

  /**
   * Create backup of API key configuration
   */
  createBackup(reason: string = 'manual'): string {
    try {
      const backupDir = this.rotationConfig.backupLocation || join(this.configDir, 'backups');
      if (!existsSync(backupDir)) {
        mkdirSync(backupDir, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFile = join(backupDir, `api-keys-backup-${timestamp}.json`);
      
      const backupData = {
        timestamp: new Date().toISOString(),
        reason,
        version: '1.0.0',
        keys: Array.from(this.keyRegistry.values()),
        rotationConfig: this.rotationConfig
      };

      writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
      console.log(`✅ Created API key backup: ${backupFile}`);
      
      return backupFile;
    } catch (error) {
      console.error('❌ Failed to create backup:', error);
      throw error;
    }
  }

  /**
   * Generate integration code for env-auto.mjs
   */
  generateEnvAutoIntegration(): string {
    return `
// =============================================================================
// MCP API Key Management Integration
// =============================================================================

const { MCPAPIKeyManager } = require('../.mcp/scripts/api-key-manager.js');

/**
 * Process MCP API keys for the application
 */
function processMCPAPIKeys(appPath, appType, environment = 'development') {
  try {
    const keyManager = new MCPAPIKeyManager();
    
    // Generate environment-specific key mapping
    const keyMapping = keyManager.generateEnvironmentMapping(environment);
    
    // Validate existing keys
    const validationResults = await keyManager.validateAllKeys();
    const invalidKeys = validationResults.filter(r => !r.isValid);
    
    if (invalidKeys.length > 0) {
      console.warn(\`⚠️  \${invalidKeys.length} API keys failed validation:\`);
      invalidKeys.forEach(result => {
        console.warn(\`   - \${result.keyId}: \${result.error}\`);
      });
    }
    
    // Generate .env content for MCP keys
    const envTemplate = keyManager.generateEnvTemplate(environment, environment === 'development');
    
    return {
      envContent: envTemplate,
      keyMapping: keyMapping[environment],
      validationResults
    };
    
  } catch (error) {
    console.error('❌ MCP API key processing failed:', error);
    return null;
  }
}

// Export for integration with env-auto.mjs
module.exports = { processMCPAPIKeys };
`;
  }

  /**
   * Generate documentation for key naming conventions
   */
  generateKeyNamingDocumentation(): string {
    return `# TekUp MCP API Key Naming Conventions

## Environment Variable Naming

### Standard Format
\`\`\`
MCP_<SERVICE>_<TYPE>_<QUALIFIER>
\`\`\`

### Examples
- \`MCP_BRAVE_API_KEY\` - Brave Search API key
- \`MCP_BILLY_API_TOKEN\` - Billy service token
- \`MCP_ZAPIER_ENDPOINT\` - Zapier webhook endpoint
- \`MCP_OPENAI_API_KEY\` - OpenAI API key
- \`MCP_ANTHROPIC_API_KEY\` - Anthropic Claude API key

### Rules
1. **Always prefix with \`MCP_\`** - Identifies MCP-related variables
2. **Use UPPERCASE** - Follow environment variable conventions  
3. **Use underscores** - Separate words with underscores
4. **Be descriptive** - Clear service and purpose identification
5. **Avoid abbreviations** - Use full service names when possible

## Key ID Format

### Standard Format
\`\`\`
<service-name>-<key-type>
\`\`\`

### Examples
- \`brave-search-api\` - Brave Search API key
- \`billy-api-token\` - Billy API token
- \`zapier-webhook\` - Zapier webhook
- \`openai-api-key\` - OpenAI API key

## Service Categories

### AI Services
- \`openai\` - OpenAI GPT services
- \`anthropic\` - Anthropic Claude
- \`google-gemini\` - Google Gemini

### Search Services  
- \`brave-search\` - Brave Search API
- \`google-search\` - Google Search API

### Automation Services
- \`zapier\` - Zapier webhooks
- \`billy\` - Billy invoicing

### Browser Services
- \`browserless\` - Browserless automation
- \`puppeteer\` - Puppeteer cloud

## Security Classifications

### Public Keys (Development)
- Can be included in development templates
- Non-sensitive configuration values
- Example: Service endpoints, non-auth URLs

### Private Keys (Secure)
- Must never be committed to version control
- Require secure storage/retrieval
- Example: API keys, tokens, secrets

### Rotatable Keys
- Support automatic rotation
- Have expiration dates
- Example: Most API keys

### Fixed Keys  
- Cannot be rotated automatically
- Require manual intervention
- Example: Webhook URLs, service endpoints

## Best Practices

### Development
1. Use placeholder values in templates
2. Document expected format/pattern
3. Provide clear setup instructions
4. Include validation patterns

### Production
1. Use secure secret management
2. Implement key rotation schedules
3. Monitor key expiration dates
4. Maintain audit logs

### Documentation
1. Document all keys with descriptions
2. Include service provider information
3. Specify rotation requirements
4. Provide troubleshooting guides
`;
  }
}

// =============================================================================
// CLI INTERFACE
// =============================================================================

async function main() {
  const manager = new MCPAPIKeyManager();
  
  const command = process.argv[2];
  
  switch (command) {
    case 'validate':
      await manager.validateAllKeys();
      break;
      
    case 'generate-env':
      const environment = process.argv[3] || 'development';
      const template = manager.generateEnvTemplate(environment);
      const outputFile = `.env.${environment}.template`;
      writeFileSync(outputFile, template);
      console.log(`✅ Generated environment template: ${outputFile}`);
      break;
      
    case 'backup':
      const reason = process.argv[3] || 'cli-backup';
      manager.createBackup(reason);
      break;
      
    case 'list':
      const keys = manager.getAllKeyReferences();
      console.log('\n📋 API Key References:');
      keys.forEach(key => {
        console.log(`   ${key.keyId}: ${key.name} (${key.envVariable})`);
        console.log(`      Service: ${key.service}, Required: ${key.required}, Rotatable: ${key.rotatable}`);
      });
      break;
      
    case 'check-rotation':
      const needingRotation = manager.getKeysNeedingRotation();
      if (needingRotation.length > 0) {
        console.log(`⚠️  ${needingRotation.length} keys need rotation:`);
        needingRotation.forEach(key => {
          console.log(`   - ${key.name} (expires: ${key.expiresAt})`);
        });
      } else {
        console.log('✅ No keys need rotation at this time');
      }
      break;
      
    case 'generate-docs':
      const docs = manager.generateKeyNamingDocumentation();
      writeFileSync('.mcp/docs/api-key-conventions.md', docs);
      console.log('✅ Generated API key naming conventions documentation');
      break;
      
    default:
      console.log(`
TekUp MCP API Key Manager

Usage: node api-key-manager.js <command>

Commands:
  validate        - Validate all API keys
  generate-env    - Generate .env template [environment]
  backup          - Create backup [reason]
  list            - List all key references
  check-rotation  - Check keys needing rotation
  generate-docs   - Generate naming conventions documentation

Examples:
  node api-key-manager.js validate
  node api-key-manager.js generate-env production
  node api-key-manager.js backup pre-deployment
      `);
  }
}

// Run CLI if this is the main module
if (require.main === module) {
  main().catch(console.error);
}

export default MCPAPIKeyManager;