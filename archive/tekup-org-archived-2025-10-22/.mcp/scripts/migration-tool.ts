#!/usr/bin/env node

/**
 * @fileoverview TekUp MCP Configuration Migration Tool
 * 
 * Comprehensive migration system for converting legacy MCP configurations
 * to the new centralized format with backup, validation, and reporting.
 * 
 * @author TekUp.org Development Team
 * @version 1.0.0
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync, copyFileSync, readdirSync, statSync } from 'fs';
import { resolve, join, dirname, basename, relative } from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

export interface MigrationConfig {
  version: string;
  source: {
    searchPaths: string[];
    patterns: string[];
    excludePatterns: string[];
  };
  target: {
    configRoot: string;
    backupRoot: string;
  };
  migration: {
    dryRun: boolean;
    createBackups: boolean;
    validateAfterMigration: boolean;
    generateReport: boolean;
  };
  legacy: {
    editorConfigs: LegacyEditorConfig[];
    browserConfigs: LegacyBrowserConfig[];
  };
}

export interface LegacyEditorConfig {
  editor: string;
  configPaths: string[];
  format: 'json' | 'yaml' | 'toml';
  mcpSection?: string;
  transformation: {
    [legacyKey: string]: string; // Maps legacy key to new key
  };
}

export interface LegacyBrowserConfig {
  name: string;
  configPath: string;
  serverCommand?: string;
  port?: number;
  features: string[];
}

export interface MigrationItem {
  id: string;
  type: 'editor-config' | 'browser-config' | 'api-key' | 'environment';
  sourcePath: string;
  targetPath: string;
  backupPath?: string;
  status: 'pending' | 'migrated' | 'failed' | 'skipped';
  issues: string[];
  warnings: string[];
  metadata?: Record<string, any>;
}

export interface MigrationReport {
  timestamp: string;
  version: string;
  summary: {
    totalItems: number;
    migratedCount: number;
    failedCount: number;
    skippedCount: number;
    warningCount: number;
    duration: number;
  };
  items: MigrationItem[];
  issues: {
    critical: string[];
    warnings: string[];
    info: string[];
  };
  recommendations: string[];
}

// =============================================================================
// MIGRATION TOOL CLASS
// =============================================================================

export class MCPMigrationTool {
  private config: MigrationConfig;
  private migrationItems: MigrationItem[] = [];
  private startTime: number = 0;

  constructor(configPath?: string) {
    this.loadMigrationConfig(configPath);
    this.initializeDirectories();
  }

  /**
   * Load migration configuration
   */
  private loadMigrationConfig(configPath?: string): void {
    const defaultPath = resolve(process.cwd(), '.mcp', 'configs', 'migration-config.json');
    const path = configPath || defaultPath;

    if (existsSync(path)) {
      try {
        const content = readFileSync(path, 'utf8');
        this.config = JSON.parse(content);
        console.log(`✅ Loaded migration config from ${path}`);
      } catch (error) {
        console.warn(`⚠️  Failed to load migration config, using defaults`);
        this.config = this.createDefaultMigrationConfig();
      }
    } else {
      console.log('📋 Creating default migration configuration');
      this.config = this.createDefaultMigrationConfig();
      this.saveMigrationConfig();
    }
  }

  /**
   * Create default migration configuration
   */
  private createDefaultMigrationConfig(): MigrationConfig {
    return {
      version: '1.0.0',
      source: {
        searchPaths: [
          '.vscode',
          '.cursor',
          '.windsurf',
          'apps',
          'packages',
          'tools'
        ],
        patterns: [
          '**/mcp.json',
          '**/settings.json',
          '**/.mcp-*',
          '**/browser-*.json',
          '**/*mcp*.config.*'
        ],
        excludePatterns: [
          'node_modules/**',
          '.git/**',
          'dist/**',
          'build/**',
          '.mcp/**'
        ]
      },
      target: {
        configRoot: '.mcp',
        backupRoot: '.mcp/backups/migration'
      },
      migration: {
        dryRun: false,
        createBackups: true,
        validateAfterMigration: true,
        generateReport: true
      },
      legacy: {
        editorConfigs: [
          {
            editor: 'vscode',
            configPaths: ['.vscode/settings.json'],
            format: 'json',
            mcpSection: 'mcp',
            transformation: {
              'mcp.servers': 'mcpServers',
              'mcp.enabled': 'settings.enabled',
              'mcp.logLevel': 'settings.logLevel',
              'mcp.timeout': 'settings.timeout'
            }
          },
          {
            editor: 'cursor',
            configPaths: ['.cursor/settings.json'],
            format: 'json',
            mcpSection: 'mcp',
            transformation: {
              'mcp.servers': 'mcpServers',
              'cursor.ai.enabled': 'cursorAI.enabled',
              'cursor.ai.model': 'cursorAI.model'
            }
          },
          {
            editor: 'windsurf',
            configPaths: ['.windsurf/settings.json'],
            format: 'json',
            mcpSection: 'mcp',
            transformation: {
              'mcp.servers': 'mcpServers',
              'windsurf.ai.enabled': 'windsurfAI.enabled'
            }
          }
        ],
        browserConfigs: [
          {
            name: 'browser-mcp-1',
            configPath: 'tools/browser-mcp/config.json',
            serverCommand: 'node browser-server.js',
            port: 3001,
            features: ['automation', 'scraping']
          },
          {
            name: 'browser-mcp-2',
            configPath: 'apps/browser-tools/mcp-config.json',
            serverCommand: 'npm run browser-server',
            port: 3002,
            features: ['testing', 'automation']
          },
          {
            name: 'browser-mcp-3',
            configPath: 'packages/browser-automation/mcp.json',
            serverCommand: 'pnpm start:mcp',
            port: 3003,
            features: ['automation', 'monitoring']
          },
          {
            name: 'browser-mcp-4',
            configPath: 'browser-mcp-server/config.json',
            serverCommand: 'node server.js',
            port: 3004,
            features: ['websocket', 'automation']
          }
        ]
      }
    };
  }

  /**
   * Save migration configuration
   */
  private saveMigrationConfig(): void {
    try {
      const configPath = resolve(process.cwd(), '.mcp', 'configs', 'migration-config.json');
      writeFileSync(configPath, JSON.stringify(this.config, null, 2));
    } catch (error) {
      console.error('❌ Failed to save migration config:', error);
    }
  }

  /**
   * Initialize required directories
   */
  private initializeDirectories(): void {
    const dirs = [
      '.mcp/configs',
      '.mcp/backups/migration',
      '.mcp/reports',
      '.mcp/logs'
    ];

    dirs.forEach(dir => {
      const fullPath = resolve(process.cwd(), dir);
      if (!existsSync(fullPath)) {
        mkdirSync(fullPath, { recursive: true });
      }
    });
  }

  /**
   * Discover all legacy MCP configurations
   */
  async discoverLegacyConfigurations(): Promise<void> {
    console.log('🔍 Discovering legacy MCP configurations...');
    this.migrationItems = [];

    // Search for editor configurations
    for (const editorConfig of this.config.legacy.editorConfigs) {
      await this.discoverEditorConfigs(editorConfig);
    }

    // Search for browser configurations
    for (const browserConfig of this.config.legacy.browserConfigs) {
      await this.discoverBrowserConfigs(browserConfig);
    }

    // Search for generic MCP files using patterns
    await this.discoverGenericMCPFiles();

    console.log(`📊 Discovery complete: found ${this.migrationItems.length} items to migrate`);
  }

  /**
   * Discover editor-specific configurations
   */
  private async discoverEditorConfigs(editorConfig: LegacyEditorConfig): Promise<void> {
    for (const configPath of editorConfig.configPaths) {
      for (const searchPath of this.config.source.searchPaths) {
        const fullPath = resolve(process.cwd(), searchPath, configPath);
        
        if (existsSync(fullPath)) {
          try {
            const content = readFileSync(fullPath, 'utf8');
            const parsed = JSON.parse(content);
            
            // Check if it contains MCP configuration
            if (this.containsMCPConfig(parsed, editorConfig.mcpSection)) {
              const migrationItem: MigrationItem = {
                id: `editor-${editorConfig.editor}-${Date.now()}`,
                type: 'editor-config',
                sourcePath: fullPath,
                targetPath: resolve(process.cwd(), this.config.target.configRoot, 'configs', `${editorConfig.editor}-migrated.json`),
                status: 'pending',
                issues: [],
                warnings: [],
                metadata: {
                  editor: editorConfig.editor,
                  format: editorConfig.format,
                  mcpSection: editorConfig.mcpSection
                }
              };
              
              this.migrationItems.push(migrationItem);
              console.log(`📁 Found ${editorConfig.editor} config: ${relative(process.cwd(), fullPath)}`);
            }
          } catch (error) {
            console.warn(`⚠️  Failed to parse ${fullPath}: ${error.message}`);
          }
        }
      }
    }
  }

  /**
   * Discover browser-specific configurations
   */
  private async discoverBrowserConfigs(browserConfig: LegacyBrowserConfig): Promise<void> {
    const fullPath = resolve(process.cwd(), browserConfig.configPath);
    
    if (existsSync(fullPath)) {
      const migrationItem: MigrationItem = {
        id: `browser-${browserConfig.name}-${Date.now()}`,
        type: 'browser-config',
        sourcePath: fullPath,
        targetPath: resolve(process.cwd(), this.config.target.configRoot, 'configs', `browser-${browserConfig.name}-migrated.json`),
        status: 'pending',
        issues: [],
        warnings: [],
        metadata: {
          browserName: browserConfig.name,
          serverCommand: browserConfig.serverCommand,
          port: browserConfig.port,
          features: browserConfig.features
        }
      };
      
      this.migrationItems.push(migrationItem);
      console.log(`🌐 Found browser config: ${browserConfig.name} at ${relative(process.cwd(), fullPath)}`);
    }
  }

  /**
   * Discover generic MCP files using patterns
   */
  private async discoverGenericMCPFiles(): Promise<void> {
    for (const searchPath of this.config.source.searchPaths) {
      const fullSearchPath = resolve(process.cwd(), searchPath);
      
      if (existsSync(fullSearchPath)) {
        await this.searchDirectory(fullSearchPath, searchPath);
      }
    }
  }

  /**
   * Recursively search directory for MCP files
   */
  private async searchDirectory(dirPath: string, relativePath: string): Promise<void> {
    try {
      const entries = readdirSync(dirPath);
      
      for (const entry of entries) {
        const fullPath = join(dirPath, entry);
        const entryRelativePath = join(relativePath, entry);
        
        // Skip excluded patterns
        if (this.isExcluded(entryRelativePath)) {
          continue;
        }
        
        const stat = statSync(fullPath);
        
        if (stat.isDirectory()) {
          await this.searchDirectory(fullPath, entryRelativePath);
        } else if (stat.isFile()) {
          if (this.matchesPattern(entry)) {
            await this.processGenericMCPFile(fullPath);
          }
        }
      }
    } catch (error) {
      console.warn(`⚠️  Failed to search directory ${dirPath}: ${error.message}`);
    }
  }

  /**
   * Check if path is excluded
   */
  private isExcluded(path: string): boolean {
    return this.config.source.excludePatterns.some(pattern => {
      const regex = new RegExp(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'));
      return regex.test(path);
    });
  }

  /**
   * Check if filename matches search patterns
   */
  private matchesPattern(filename: string): boolean {
    return this.config.source.patterns.some(pattern => {
      const regex = new RegExp(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'));
      return regex.test(filename);
    });
  }

  /**
   * Process generic MCP file
   */
  private async processGenericMCPFile(filePath: string): Promise<void> {
    try {
      const content = readFileSync(filePath, 'utf8');
      
      // Try to parse as JSON
      let parsed: any = null;
      try {
        parsed = JSON.parse(content);
      } catch {
        // Not JSON, skip for now
        return;
      }
      
      // Check if it looks like an MCP configuration
      if (this.looksLikeMCPConfig(parsed)) {
        const migrationItem: MigrationItem = {
          id: `generic-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'api-key',
          sourcePath: filePath,
          targetPath: resolve(process.cwd(), this.config.target.configRoot, 'configs', `migrated-${basename(filePath)}`),
          status: 'pending',
          issues: [],
          warnings: [],
          metadata: {
            originalName: basename(filePath),
            detectedType: this.detectConfigType(parsed)
          }
        };
        
        this.migrationItems.push(migrationItem);
        console.log(`📄 Found generic MCP config: ${relative(process.cwd(), filePath)}`);
      }
    } catch (error) {
      console.warn(`⚠️  Failed to process ${filePath}: ${error.message}`);
    }
  }

  /**
   * Check if configuration contains MCP settings
   */
  private containsMCPConfig(config: any, mcpSection?: string): boolean {
    if (mcpSection) {
      return config[mcpSection] && typeof config[mcpSection] === 'object';
    }
    
    // Look for common MCP keys
    const mcpKeys = ['mcp', 'mcpServers', 'servers', 'browserAutomation'];
    return mcpKeys.some(key => config[key]);
  }

  /**
   * Check if configuration looks like MCP config
   */
  private looksLikeMCPConfig(config: any): boolean {
    if (!config || typeof config !== 'object') return false;
    
    const mcpIndicators = [
      'servers', 'mcpServers', 'browserAutomation', 'transport', 
      'command', 'args', 'env', 'initializationOptions'
    ];
    
    return mcpIndicators.some(indicator => {
      return this.hasNestedKey(config, indicator);
    });
  }

  /**
   * Check if object has nested key
   */
  private hasNestedKey(obj: any, key: string): boolean {
    if (obj[key]) return true;
    
    for (const value of Object.values(obj)) {
      if (typeof value === 'object' && value !== null) {
        if (this.hasNestedKey(value, key)) return true;
      }
    }
    
    return false;
  }

  /**
   * Detect configuration type based on content
   */
  private detectConfigType(config: any): string {
    if (config.servers || config.mcpServers) return 'mcp-servers';
    if (config.browserAutomation) return 'browser-automation';
    if (config.transport) return 'transport-config';
    if (config.command && config.args) return 'server-config';
    return 'unknown';
  }

  /**
   * Run the migration process
   */
  async runMigration(): Promise<MigrationReport> {
    this.startTime = Date.now();
    console.log('🚀 Starting migration process...');
    
    if (this.config.migration.dryRun) {
      console.log('🧪 Running in DRY RUN mode - no files will be modified');
    }

    // Discover configurations
    await this.discoverLegacyConfigurations();

    // Create backups if enabled
    if (this.config.migration.createBackups && !this.config.migration.dryRun) {
      await this.createBackups();
    }

    // Migrate each item
    for (const item of this.migrationItems) {
      await this.migrateItem(item);
    }

    // Validate migrated configurations
    if (this.config.migration.validateAfterMigration) {
      await this.validateMigratedConfigurations();
    }

    // Generate report
    const report = this.generateMigrationReport();
    
    if (this.config.migration.generateReport) {
      this.saveMigrationReport(report);
    }

    return report;
  }

  /**
   * Create backups of all source files
   */
  private async createBackups(): Promise<void> {
    console.log('📁 Creating backups...');
    
    const backupTimestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    for (const item of this.migrationItems) {
      try {
        const backupDir = resolve(process.cwd(), this.config.target.backupRoot, backupTimestamp);
        if (!existsSync(backupDir)) {
          mkdirSync(backupDir, { recursive: true });
        }
        
        const backupPath = join(backupDir, `${basename(item.sourcePath)}.backup`);
        copyFileSync(item.sourcePath, backupPath);
        item.backupPath = backupPath;
        
        console.log(`📋 Backed up: ${relative(process.cwd(), item.sourcePath)} → ${relative(process.cwd(), backupPath)}`);
      } catch (error) {
        console.error(`❌ Failed to backup ${item.sourcePath}: ${error.message}`);
        item.issues.push(`Backup failed: ${error.message}`);
      }
    }
  }

  /**
   * Migrate individual item
   */
  private async migrateItem(item: MigrationItem): Promise<void> {
    try {
      console.log(`🔄 Migrating: ${relative(process.cwd(), item.sourcePath)}`);
      
      // Read source configuration
      const sourceContent = readFileSync(item.sourcePath, 'utf8');
      let sourceConfig: any;
      
      try {
        sourceConfig = JSON.parse(sourceContent);
      } catch (error) {
        throw new Error(`Failed to parse source JSON: ${error.message}`);
      }

      // Transform configuration based on type
      let migratedConfig: any;
      
      switch (item.type) {
        case 'editor-config':
          migratedConfig = await this.migrateEditorConfig(sourceConfig, item);
          break;
        case 'browser-config':
          migratedConfig = await this.migrateBrowserConfig(sourceConfig, item);
          break;
        case 'api-key':
        default:
          migratedConfig = await this.migrateGenericConfig(sourceConfig, item);
          break;
      }

      // Write migrated configuration
      if (!this.config.migration.dryRun) {
        const targetDir = dirname(item.targetPath);
        if (!existsSync(targetDir)) {
          mkdirSync(targetDir, { recursive: true });
        }
        
        writeFileSync(item.targetPath, JSON.stringify(migratedConfig, null, 2));
      }

      item.status = 'migrated';
      console.log(`✅ Migrated: ${relative(process.cwd(), item.targetPath)}`);

    } catch (error) {
      console.error(`❌ Failed to migrate ${item.sourcePath}: ${error.message}`);
      item.status = 'failed';
      item.issues.push(error.message);
    }
  }

  /**
   * Migrate editor-specific configuration
   */
  private async migrateEditorConfig(sourceConfig: any, item: MigrationItem): Promise<any> {
    const editorName = item.metadata?.editor;
    const editorConfig = this.config.legacy.editorConfigs.find(ec => ec.editor === editorName);
    
    if (!editorConfig) {
      throw new Error(`No editor configuration found for ${editorName}`);
    }

    const migratedConfig: any = {
      version: '1.0.0',
      environment: 'development',
      mcpServers: {},
      settings: {},
      [`${editorName}AI`]: {}
    };

    // Apply transformations
    for (const [legacyKey, newKey] of Object.entries(editorConfig.transformation)) {
      const value = this.getNestedValue(sourceConfig, legacyKey);
      if (value !== undefined) {
        this.setNestedValue(migratedConfig, newKey, value);
      }
    }

    // Extract MCP servers if they exist
    const mcpSection = sourceConfig[editorConfig.mcpSection || 'mcp'];
    if (mcpSection && mcpSection.servers) {
      migratedConfig.mcpServers = mcpSection.servers;
    }

    return migratedConfig;
  }

  /**
   * Migrate browser configuration
   */
  private async migrateBrowserConfig(sourceConfig: any, item: MigrationItem): Promise<any> {
    const browserName = item.metadata?.browserName;
    const serverCommand = item.metadata?.serverCommand;
    const port = item.metadata?.port;
    const features = item.metadata?.features || [];

    const migratedConfig: any = {
      version: '1.0.0',
      environment: 'development',
      mcpServers: {
        [`browser-${browserName}`]: {
          command: serverCommand || 'node',
          args: sourceConfig.args || [],
          env: sourceConfig.env || {},
          transport: {
            type: 'websocket',
            host: 'localhost',
            port: port || 3001
          },
          initializationOptions: sourceConfig.initializationOptions || {},
          enabled: sourceConfig.enabled !== false
        }
      },
      browserAutomation: {
        enabled: true,
        defaultBrowser: sourceConfig.browser || 'chrome',
        headless: sourceConfig.headless !== false,
        timeout: sourceConfig.timeout || 30000,
        features: features
      }
    };

    return migratedConfig;
  }

  /**
   * Migrate generic configuration
   */
  private async migrateGenericConfig(sourceConfig: any, item: MigrationItem): Promise<any> {
    const detectedType = item.metadata?.detectedType;
    
    const migratedConfig: any = {
      version: '1.0.0',
      environment: 'development',
      metadata: {
        migratedFrom: item.sourcePath,
        originalType: detectedType,
        migrationDate: new Date().toISOString()
      }
    };

    // Copy configuration with some intelligent mapping
    if (sourceConfig.servers) {
      migratedConfig.mcpServers = sourceConfig.servers;
    }

    if (sourceConfig.browserAutomation) {
      migratedConfig.browserAutomation = sourceConfig.browserAutomation;
    }

    // Copy other relevant keys
    const relevantKeys = ['settings', 'env', 'transport', 'initializationOptions'];
    relevantKeys.forEach(key => {
      if (sourceConfig[key]) {
        migratedConfig[key] = sourceConfig[key];
      }
    });

    return migratedConfig;
  }

  /**
   * Validate migrated configurations
   */
  private async validateMigratedConfigurations(): Promise<void> {
    console.log('🔍 Validating migrated configurations...');
    
    for (const item of this.migrationItems) {
      if (item.status !== 'migrated') continue;
      
      try {
        if (existsSync(item.targetPath)) {
          const content = readFileSync(item.targetPath, 'utf8');
          const config = JSON.parse(content);
          
          // Basic validation
          if (!config.version) {
            item.warnings.push('Missing version field');
          }
          
          if (!config.environment) {
            item.warnings.push('Missing environment field');
          }
          
          // Validate MCP servers
          if (config.mcpServers) {
            for (const [serverName, serverConfig] of Object.entries(config.mcpServers)) {
              const server = serverConfig as any;
              if (!server.command) {
                item.issues.push(`Server ${serverName} missing command`);
              }
            }
          }
        }
      } catch (error) {
        item.issues.push(`Validation failed: ${error.message}`);
      }
    }
  }

  /**
   * Generate migration report
   */
  private generateMigrationReport(): MigrationReport {
    const duration = Date.now() - this.startTime;
    const migratedCount = this.migrationItems.filter(item => item.status === 'migrated').length;
    const failedCount = this.migrationItems.filter(item => item.status === 'failed').length;
    const skippedCount = this.migrationItems.filter(item => item.status === 'skipped').length;
    const warningCount = this.migrationItems.reduce((sum, item) => sum + item.warnings.length, 0);

    const allIssues = this.migrationItems.flatMap(item => item.issues);
    const allWarnings = this.migrationItems.flatMap(item => item.warnings);

    const report: MigrationReport = {
      timestamp: new Date().toISOString(),
      version: this.config.version,
      summary: {
        totalItems: this.migrationItems.length,
        migratedCount,
        failedCount,
        skippedCount,
        warningCount,
        duration
      },
      items: this.migrationItems,
      issues: {
        critical: allIssues,
        warnings: allWarnings,
        info: []
      },
      recommendations: this.generateRecommendations()
    };

    return report;
  }

  /**
   * Generate recommendations based on migration results
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    const failedItems = this.migrationItems.filter(item => item.status === 'failed');
    if (failedItems.length > 0) {
      recommendations.push(`Review ${failedItems.length} failed migrations and address the issues manually.`);
    }

    const warningItems = this.migrationItems.filter(item => item.warnings.length > 0);
    if (warningItems.length > 0) {
      recommendations.push(`Review ${warningItems.length} configurations with warnings to ensure they work correctly.`);
    }

    if (this.migrationItems.length === 0) {
      recommendations.push('No legacy configurations found. Your system may already be using the new format.');
    } else if (this.migrationItems.filter(item => item.status === 'migrated').length === this.migrationItems.length) {
      recommendations.push('All configurations migrated successfully. Consider running cleanup to remove legacy files.');
    }

    recommendations.push('Test the migrated configurations with your editors to ensure everything works correctly.');
    recommendations.push('Update your documentation and scripts to reference the new configuration locations.');

    return recommendations;
  }

  /**
   * Save migration report
   */
  private saveMigrationReport(report: MigrationReport): void {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const reportPath = resolve(process.cwd(), '.mcp', 'reports', `migration-report-${timestamp}.json`);
      writeFileSync(reportPath, JSON.stringify(report, null, 2));
      
      console.log(`📊 Migration report saved: ${relative(process.cwd(), reportPath)}`);
    } catch (error) {
      console.error('❌ Failed to save migration report:', error);
    }
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Set nested value in object using dot notation
   */
  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((current, key) => {
      if (!(key in current)) {
        current[key] = {};
      }
      return current[key];
    }, obj);
    
    target[lastKey] = value;
  }
}

// =============================================================================
// CLI INTERFACE
// =============================================================================

async function main() {
  const command = process.argv[2];
  const migrationTool = new MCPMigrationTool();

  switch (command) {
    case 'discover':
      await migrationTool.discoverLegacyConfigurations();
      break;

    case 'migrate':
      const dryRun = process.argv.includes('--dry-run');
      if (dryRun) {
        console.log('🧪 Running migration in DRY RUN mode');
        migrationTool['config'].migration.dryRun = true;
      }
      
      const report = await migrationTool.runMigration();
      
      console.log('\n📊 Migration Summary:');
      console.log(`   Total Items: ${report.summary.totalItems}`);
      console.log(`   Migrated: ${report.summary.migratedCount} ✅`);
      console.log(`   Failed: ${report.summary.failedCount} ❌`);
      console.log(`   Warnings: ${report.summary.warningCount} ⚠️`);
      console.log(`   Duration: ${report.summary.duration}ms`);
      
      if (report.recommendations.length > 0) {
        console.log('\n💡 Recommendations:');
        report.recommendations.forEach(rec => console.log(`   - ${rec}`));
      }
      
      process.exit(report.summary.failedCount > 0 ? 1 : 0);
      break;

    default:
      console.log(`
TekUp MCP Migration Tool

Usage: node migration-tool.js <command> [options]

Commands:
  discover        - Discover legacy MCP configurations
  migrate         - Run the migration process
  migrate --dry-run - Test migration without making changes

Examples:
  node migration-tool.js discover
  node migration-tool.js migrate
  node migration-tool.js migrate --dry-run
      `);
  }
}

// Run CLI if this is the main module
if (require.main === module) {
  main().catch(console.error);
}

export default MCPMigrationTool;