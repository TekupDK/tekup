#!/usr/bin/env node

/**
 * @fileoverview Base Editor Adapter for MCP Configuration Integration
 * 
 * Universal adapter system for integrating centralized MCP configuration
 * with different code editors (Windsurf, Kiro, VS Code, Trae, Cursor).
 * 
 * @author TekUp.org Development Team
 * @version 1.0.0
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync, copyFileSync } from 'fs';
import { resolve, join, dirname, basename } from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';
import MCPConfigurationLoader from '../config-loader.js';
import type { MCPConfiguration, EditorSpecificConfig } from '../types/mcp-types.js';

const execAsync = promisify(exec);

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

export interface EditorInfo {
  name: string;
  displayName: string;
  configDir: string;
  configFile: string;
  format: 'json' | 'yaml' | 'toml' | 'custom';
  executable?: string;
  version?: string;
  installed: boolean;
}

export interface AdapterConfig {
  editor: EditorInfo;
  sourceConfigPath: string;
  targetConfigPath: string;
  backupPath: string;
  transformationRules: TransformationRule[];
  validationRules: ValidationRule[];
  hotReload: boolean;
}

export interface TransformationRule {
  id: string;
  description: string;
  sourceField: string;
  targetField?: string;
  transformer?: (value: any, config: MCPConfiguration) => any;
  condition?: (config: MCPConfiguration) => boolean;
}

export interface ValidationRule {
  id: string;
  description: string;
  validator: (config: any, originalConfig: MCPConfiguration) => ValidationResult;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface AdapterStats {
  lastSync: string;
  syncCount: number;
  errorCount: number;
  warningCount: number;
  configSize: number;
  backupCount: number;
}

// =============================================================================
// BASE EDITOR ADAPTER CLASS
// =============================================================================

export abstract class BaseEditorAdapter {
  protected config: AdapterConfig;
  protected configLoader: MCPConfigurationLoader;
  protected stats: AdapterStats;
  private syncInterval?: NodeJS.Timeout;
  private isWatching: boolean = false;

  constructor(editorInfo: EditorInfo, configLoader: MCPConfigurationLoader) {
    this.configLoader = configLoader;
    this.config = this.initializeAdapterConfig(editorInfo);
    this.stats = this.loadStats();
    this.ensureDirectories();
  }

  // =============================================================================
  // ABSTRACT METHODS (Must be implemented by subclasses)
  // =============================================================================

  /**
   * Get editor-specific transformation rules
   */
  abstract getTransformationRules(): TransformationRule[];

  /**
   * Get editor-specific validation rules
   */
  abstract getValidationRules(): ValidationRule[];

  /**
   * Transform MCP configuration to editor-specific format
   */
  abstract transformConfig(mcpConfig: MCPConfiguration): any;

  /**
   * Validate transformed configuration
   */
  abstract validateTransformedConfig(transformedConfig: any, originalConfig: MCPConfiguration): ValidationResult;

  /**
   * Write configuration to editor's config file
   */
  abstract writeEditorConfig(transformedConfig: any, targetPath: string): Promise<void>;

  /**
   * Read existing editor configuration (for merging)
   */
  abstract readExistingEditorConfig(configPath: string): Promise<any>;

  /**
   * Detect if editor is installed and get version info
   */
  abstract detectEditor(): Promise<EditorInfo>;

  // =============================================================================
  // CORE ADAPTER FUNCTIONALITY
  // =============================================================================

  /**
   * Initialize adapter configuration
   */
  private initializeAdapterConfig(editorInfo: EditorInfo): AdapterConfig {
    const configRoot = resolve(process.cwd(), '.mcp');
    const editorConfigDir = resolve(process.cwd(), editorInfo.configDir);
    
    return {
      editor: editorInfo,
      sourceConfigPath: resolve(configRoot, 'configs'),
      targetConfigPath: resolve(editorConfigDir, editorInfo.configFile),
      backupPath: resolve(configRoot, 'backups', 'editors', editorInfo.name),
      transformationRules: [],
      validationRules: [],
      hotReload: process.env.NODE_ENV === 'development'
    };
  }

  /**
   * Load adapter statistics
   */
  private loadStats(): AdapterStats {
    const statsPath = resolve(process.cwd(), '.mcp', 'stats', `${this.config.editor.name}-adapter.json`);
    
    if (existsSync(statsPath)) {
      try {
        const content = readFileSync(statsPath, 'utf8');
        return JSON.parse(content);
      } catch (error) {
        console.warn(`⚠️  Failed to load stats for ${this.config.editor.name}:`, error.message);
      }
    }

    return {
      lastSync: '',
      syncCount: 0,
      errorCount: 0,
      warningCount: 0,
      configSize: 0,
      backupCount: 0
    };
  }

  /**
   * Save adapter statistics
   */
  private saveStats(): void {
    try {
      const statsPath = resolve(process.cwd(), '.mcp', 'stats', `${this.config.editor.name}-adapter.json`);
      const statsDir = dirname(statsPath);
      
      if (!existsSync(statsDir)) {
        mkdirSync(statsDir, { recursive: true });
      }
      
      writeFileSync(statsPath, JSON.stringify(this.stats, null, 2));
    } catch (error) {
      console.error(`❌ Failed to save stats for ${this.config.editor.name}:`, error);
    }
  }

  /**
   * Ensure required directories exist
   */
  private ensureDirectories(): void {
    const dirs = [
      this.config.backupPath,
      dirname(this.config.targetConfigPath),
      resolve(process.cwd(), '.mcp', 'stats'),
      resolve(process.cwd(), '.mcp', 'logs', 'adapters')
    ];

    dirs.forEach(dir => {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Create backup of existing editor configuration
   */
  private createBackup(): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `${this.config.editor.name}-config-${timestamp}.backup`;
    const backupFilePath = resolve(this.config.backupPath, backupFileName);

    if (existsSync(this.config.targetConfigPath)) {
      try {
        copyFileSync(this.config.targetConfigPath, backupFilePath);
        this.stats.backupCount++;
        console.log(`📁 Created backup: ${backupFileName}`);
        return backupFilePath;
      } catch (error) {
        console.error(`❌ Failed to create backup for ${this.config.editor.name}:`, error);
        throw error;
      }
    }

    return '';
  }

  /**
   * Log adapter activity
   */
  private logActivity(level: 'info' | 'warn' | 'error', message: string, details?: any): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      editor: this.config.editor.name,
      message,
      details
    };

    const logPath = resolve(process.cwd(), '.mcp', 'logs', 'adapters', `${this.config.editor.name}.log`);
    const logLine = `${timestamp} [${level.toUpperCase()}] ${message}${details ? ' ' + JSON.stringify(details) : ''}\n`;
    
    try {
      writeFileSync(logPath, logLine, { flag: 'a' });
    } catch (error) {
      console.error(`❌ Failed to write log for ${this.config.editor.name}:`, error);
    }
  }

  // =============================================================================
  // PUBLIC METHODS
  // =============================================================================

  /**
   * Initialize the adapter
   */
  async initialize(): Promise<void> {
    console.log(`🔧 Initializing ${this.config.editor.displayName} adapter...`);

    // Detect editor installation
    this.config.editor = await this.detectEditor();
    
    if (!this.config.editor.installed) {
      console.warn(`⚠️  ${this.config.editor.displayName} is not installed or not found`);
      return;
    }

    // Initialize transformation and validation rules
    this.config.transformationRules = this.getTransformationRules();
    this.config.validationRules = this.getValidationRules();

    console.log(`✅ ${this.config.editor.displayName} adapter initialized`);
    console.log(`   Version: ${this.config.editor.version || 'Unknown'}`);
    console.log(`   Config: ${this.config.targetConfigPath}`);
    console.log(`   Rules: ${this.config.transformationRules.length} transformation, ${this.config.validationRules.length} validation`);

    this.logActivity('info', 'Adapter initialized', {
      version: this.config.editor.version,
      configPath: this.config.targetConfigPath
    });
  }

  /**
   * Synchronize MCP configuration with editor
   */
  async syncConfiguration(): Promise<boolean> {
    try {
      console.log(`🔄 Syncing configuration for ${this.config.editor.displayName}...`);
      
      // Load current MCP configuration
      const mcpConfig = this.configLoader.loadConfiguration();
      
      // Create backup of existing editor config
      const backupPath = this.createBackup();
      
      // Read existing editor configuration for merging
      let existingConfig = {};
      if (existsSync(this.config.targetConfigPath)) {
        existingConfig = await this.readExistingEditorConfig(this.config.targetConfigPath);
      }

      // Transform MCP configuration to editor format
      const transformedConfig = this.transformConfig(mcpConfig);
      
      // Merge with existing configuration (preserve non-MCP settings)
      const mergedConfig = this.mergeConfigurations(existingConfig, transformedConfig);
      
      // Validate the transformed configuration
      const validationResult = this.validateTransformedConfig(mergedConfig, mcpConfig);
      
      if (!validationResult.valid) {
        console.error(`❌ Validation failed for ${this.config.editor.name}:`);
        validationResult.errors.forEach(error => console.error(`   - ${error}`));
        this.stats.errorCount++;
        this.logActivity('error', 'Configuration validation failed', { errors: validationResult.errors });
        return false;
      }

      if (validationResult.warnings.length > 0) {
        console.warn(`⚠️  Validation warnings for ${this.config.editor.name}:`);
        validationResult.warnings.forEach(warning => console.warn(`   - ${warning}`));
        this.stats.warningCount++;
      }

      // Write the configuration to editor's config file
      await this.writeEditorConfig(mergedConfig, this.config.targetConfigPath);
      
      // Update statistics
      this.stats.lastSync = new Date().toISOString();
      this.stats.syncCount++;
      this.stats.configSize = JSON.stringify(mergedConfig).length;
      this.saveStats();

      console.log(`✅ Configuration synced for ${this.config.editor.displayName}`);
      this.logActivity('info', 'Configuration synced successfully', {
        configSize: this.stats.configSize,
        backupCreated: backupPath !== ''
      });

      return true;

    } catch (error) {
      console.error(`❌ Failed to sync configuration for ${this.config.editor.name}:`, error);
      this.stats.errorCount++;
      this.saveStats();
      this.logActivity('error', 'Configuration sync failed', { error: error.message });
      return false;
    }
  }

  /**
   * Merge existing editor config with transformed MCP config
   */
  protected mergeConfigurations(existing: any, transformed: any): any {
    // Default implementation: deep merge with transformed taking precedence for MCP settings
    const merged = { ...existing };
    
    // If the editor uses nested MCP configuration, merge at the right level
    if (transformed.mcp || transformed.mcpServers) {
      merged.mcp = transformed.mcp;
      merged.mcpServers = transformed.mcpServers;
    } else {
      // Otherwise, merge all transformed properties
      Object.assign(merged, transformed);
    }

    return merged;
  }

  /**
   * Start watching for configuration changes (hot reload)
   */
  startHotReload(intervalMs: number = 5000): void {
    if (this.isWatching || !this.config.hotReload) {
      return;
    }

    this.isWatching = true;
    
    this.syncInterval = setInterval(async () => {
      try {
        // Check if MCP configuration has been updated
        const lastModified = this.configLoader.getLastModified();
        if (lastModified > this.stats.lastSync) {
          console.log(`🔄 Detected MCP configuration change, resyncing ${this.config.editor.displayName}...`);
          await this.syncConfiguration();
        }
      } catch (error) {
        console.error(`❌ Hot reload error for ${this.config.editor.name}:`, error);
      }
    }, intervalMs);

    console.log(`👁️  Started hot reload for ${this.config.editor.displayName} (checking every ${intervalMs}ms)`);
  }

  /**
   * Stop watching for configuration changes
   */
  stopHotReload(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = undefined;
      this.isWatching = false;
      console.log(`⏹️  Stopped hot reload for ${this.config.editor.displayName}`);
    }
  }

  /**
   * Get adapter statistics and health information
   */
  getAdapterInfo(): any {
    return {
      editor: this.config.editor,
      stats: this.stats,
      config: {
        hotReload: this.config.hotReload,
        isWatching: this.isWatching,
        targetPath: this.config.targetConfigPath,
        backupPath: this.config.backupPath
      },
      rules: {
        transformation: this.config.transformationRules.length,
        validation: this.config.validationRules.length
      }
    };
  }

  /**
   * Test configuration sync without actually writing files
   */
  async testSync(): Promise<{ success: boolean; issues: string[]; transformed: any }> {
    const issues: string[] = [];
    
    try {
      // Load MCP configuration
      const mcpConfig = this.configLoader.loadConfiguration();
      
      // Transform configuration
      const transformedConfig = this.transformConfig(mcpConfig);
      
      // Validate transformed configuration
      const validationResult = this.validateTransformedConfig(transformedConfig, mcpConfig);
      
      issues.push(...validationResult.errors);
      issues.push(...validationResult.warnings);

      return {
        success: validationResult.valid,
        issues,
        transformed: transformedConfig
      };

    } catch (error) {
      issues.push(`Sync test failed: ${error.message}`);
      return {
        success: false,
        issues,
        transformed: null
      };
    }
  }

  /**
   * Restore configuration from backup
   */
  async restoreFromBackup(backupFileName?: string): Promise<boolean> {
    try {
      const backupFiles = require('fs').readdirSync(this.config.backupPath)
        .filter((file: string) => file.endsWith('.backup'))
        .sort()
        .reverse();

      if (backupFiles.length === 0) {
        console.error(`❌ No backups found for ${this.config.editor.name}`);
        return false;
      }

      const fileToRestore = backupFileName || backupFiles[0]; // Use latest if not specified
      const backupFilePath = resolve(this.config.backupPath, fileToRestore);
      
      if (!existsSync(backupFilePath)) {
        console.error(`❌ Backup file not found: ${fileToRestore}`);
        return false;
      }

      copyFileSync(backupFilePath, this.config.targetConfigPath);
      
      console.log(`✅ Restored configuration for ${this.config.editor.displayName} from ${fileToRestore}`);
      this.logActivity('info', 'Configuration restored from backup', { backupFile: fileToRestore });
      
      return true;

    } catch (error) {
      console.error(`❌ Failed to restore backup for ${this.config.editor.name}:`, error);
      this.logActivity('error', 'Backup restoration failed', { error: error.message });
      return false;
    }
  }

  /**
   * Clean up old backups (keep only the most recent N backups)
   */
  cleanupBackups(keepCount: number = 10): number {
    try {
      const backupFiles = require('fs').readdirSync(this.config.backupPath)
        .filter((file: string) => file.endsWith('.backup'))
        .map((file: string) => ({
          name: file,
          path: resolve(this.config.backupPath, file),
          stat: require('fs').statSync(resolve(this.config.backupPath, file))
        }))
        .sort((a, b) => b.stat.mtime.getTime() - a.stat.mtime.getTime());

      const filesToDelete = backupFiles.slice(keepCount);
      let deletedCount = 0;

      filesToDelete.forEach(file => {
        try {
          require('fs').unlinkSync(file.path);
          deletedCount++;
        } catch (error) {
          console.warn(`⚠️  Failed to delete backup file ${file.name}:`, error.message);
        }
      });

      if (deletedCount > 0) {
        console.log(`🗑️  Cleaned up ${deletedCount} old backup files for ${this.config.editor.displayName}`);
        this.logActivity('info', `Cleaned up ${deletedCount} old backup files`);
      }

      return deletedCount;

    } catch (error) {
      console.error(`❌ Failed to cleanup backups for ${this.config.editor.name}:`, error);
      return 0;
    }
  }
}

export default BaseEditorAdapter;