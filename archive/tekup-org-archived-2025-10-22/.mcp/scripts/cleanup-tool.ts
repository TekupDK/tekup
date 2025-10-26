#!/usr/bin/env node

/**
 * @fileoverview TekUp MCP Configuration Cleanup Tool
 * 
 * Comprehensive cleanup system for identifying and removing obsolete MCP 
 * configurations, duplicates, and unused environment variables.
 * 
 * @author TekUp.org Development Team
 * @version 1.0.0
 */

import { writeFileSync, readFileSync, existsSync, unlinkSync, readdirSync, statSync, mkdirSync } from 'fs';
import { resolve, join, dirname, basename, relative, extname } from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

export interface CleanupConfig {
  version: string;
  scan: {
    searchPaths: string[];
    excludePaths: string[];
    filePatterns: string[];
    maxDepth: number;
  };
  rules: {
    removeOrphaned: boolean;
    removeDuplicates: boolean;
    removeEmpty: boolean;
    removeOldBackups: boolean;
    backupRetentionDays: number;
    confirmBeforeDelete: boolean;
  };
  safety: {
    dryRun: boolean;
    createBackupsBeforeDelete: boolean;
    backupLocation: string;
  };
}

export interface CleanupItem {
  id: string;
  type: 'duplicate' | 'orphaned' | 'empty' | 'old-backup' | 'unused-env' | 'obsolete';
  filePath: string;
  reason: string;
  severity: 'low' | 'medium' | 'high';
  size: number;
  lastModified: string;
  duplicates?: string[];
  references?: string[];
  action: 'delete' | 'archive' | 'skip' | 'manual-review';
  metadata?: Record<string, any>;
}

export interface CleanupReport {
  timestamp: string;
  version: string;
  summary: {
    totalScanned: number;
    itemsFound: number;
    itemsProcessed: number;
    spaceSaved: number; // bytes
    duration: number;
    byType: { [type: string]: number };
    bySeverity: { [severity: string]: number };
  };
  items: CleanupItem[];
  recommendations: string[];
  warnings: string[];
}

// =============================================================================
// CLEANUP TOOL CLASS
// =============================================================================

export class MCPCleanupTool {
  private config: CleanupConfig;
  private cleanupItems: CleanupItem[] = [];
  private scannedFiles: Set<string> = new Set();
  private fileHashes: Map<string, string> = new Map();
  private startTime: number = 0;

  constructor(configPath?: string) {
    this.loadCleanupConfig(configPath);
    this.initializeDirectories();
  }

  /**
   * Load cleanup configuration
   */
  private loadCleanupConfig(configPath?: string): void {
    const defaultPath = resolve(process.cwd(), '.mcp', 'configs', 'cleanup-config.json');
    const path = configPath || defaultPath;

    if (existsSync(path)) {
      try {
        const content = readFileSync(path, 'utf8');
        this.config = JSON.parse(content);
        console.log(`✅ Loaded cleanup config from ${path}`);
      } catch (error) {
        console.warn(`⚠️  Failed to load cleanup config, using defaults`);
        this.config = this.createDefaultCleanupConfig();
      }
    } else {
      console.log('📋 Creating default cleanup configuration');
      this.config = this.createDefaultCleanupConfig();
      this.saveCleanupConfig();
    }
  }

  /**
   * Create default cleanup configuration
   */
  private createDefaultCleanupConfig(): CleanupConfig {
    return {
      version: '1.0.0',
      scan: {
        searchPaths: [
          '.vscode',
          '.cursor',
          '.windsurf',
          '.mcp',
          'apps',
          'packages',
          'tools'
        ],
        excludePaths: [
          'node_modules',
          '.git',
          'dist',
          'build',
          'coverage'
        ],
        filePatterns: [
          '*.json',
          '*.yaml',
          '*.yml',
          '*.toml',
          '*.env*',
          '.mcp-*',
          '*mcp*',
          'browser-*.json'
        ],
        maxDepth: 10
      },
      rules: {
        removeOrphaned: true,
        removeDuplicates: true,
        removeEmpty: true,
        removeOldBackups: true,
        backupRetentionDays: 30,
        confirmBeforeDelete: true
      },
      safety: {
        dryRun: false,
        createBackupsBeforeDelete: true,
        backupLocation: '.mcp/backups/cleanup'
      }
    };
  }

  /**
   * Save cleanup configuration
   */
  private saveCleanupConfig(): void {
    try {
      const configPath = resolve(process.cwd(), '.mcp', 'configs', 'cleanup-config.json');
      writeFileSync(configPath, JSON.stringify(this.config, null, 2));
    } catch (error) {
      console.error('❌ Failed to save cleanup config:', error);
    }
  }

  /**
   * Initialize required directories
   */
  private initializeDirectories(): void {
    const dirs = [
      '.mcp/configs',
      '.mcp/backups/cleanup',
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
   * Run comprehensive cleanup scan
   */
  async runCleanupScan(): Promise<CleanupReport> {
    this.startTime = Date.now();
    console.log('🔍 Starting comprehensive cleanup scan...');

    if (this.config.safety.dryRun) {
      console.log('🧪 Running in DRY RUN mode - no files will be deleted');
    }

    // Reset scan state
    this.cleanupItems = [];
    this.scannedFiles = new Set();
    this.fileHashes = new Map();

    // Scan for various types of cleanup items
    await this.scanForFiles();
    await this.detectDuplicates();
    await this.detectOrphanedFiles();
    await this.detectEmptyFiles();
    await this.detectOldBackups();
    await this.detectUnusedEnvironmentVariables();
    await this.detectObsoleteConfigurations();

    // Process cleanup items
    if (!this.config.safety.dryRun) {
      await this.processCleanupItems();
    }

    // Generate and save report
    const report = this.generateCleanupReport();
    this.saveCleanupReport(report);

    return report;
  }

  /**
   * Scan for all relevant files
   */
  private async scanForFiles(): Promise<void> {
    console.log('📂 Scanning for files...');

    for (const searchPath of this.config.scan.searchPaths) {
      const fullPath = resolve(process.cwd(), searchPath);
      if (existsSync(fullPath)) {
        await this.scanDirectory(fullPath, 0);
      }
    }

    console.log(`📊 Scanned ${this.scannedFiles.size} files`);
  }

  /**
   * Recursively scan directory
   */
  private async scanDirectory(dirPath: string, depth: number): Promise<void> {
    if (depth > this.config.scan.maxDepth) return;

    try {
      const entries = readdirSync(dirPath);

      for (const entry of entries) {
        const fullPath = join(dirPath, entry);
        const relativePath = relative(process.cwd(), fullPath);

        // Skip excluded paths
        if (this.isExcluded(relativePath)) continue;

        const stat = statSync(fullPath);

        if (stat.isDirectory()) {
          await this.scanDirectory(fullPath, depth + 1);
        } else if (stat.isFile() && this.matchesFilePattern(entry)) {
          this.scannedFiles.add(fullPath);
          
          // Calculate file hash for duplicate detection
          try {
            const content = readFileSync(fullPath, 'utf8');
            const hash = this.calculateHash(content);
            this.fileHashes.set(fullPath, hash);
          } catch (error) {
            // Skip files that can't be read
          }
        }
      }
    } catch (error) {
      console.warn(`⚠️  Failed to scan directory ${dirPath}: ${error.message}`);
    }
  }

  /**
   * Check if path should be excluded
   */
  private isExcluded(path: string): boolean {
    return this.config.scan.excludePaths.some(excludePath => {
      return path.includes(excludePath) || path.startsWith(excludePath);
    });
  }

  /**
   * Check if file matches patterns
   */
  private matchesFilePattern(filename: string): boolean {
    return this.config.scan.filePatterns.some(pattern => {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(filename);
    });
  }

  /**
   * Calculate simple hash for file content
   */
  private calculateHash(content: string): string {
    const crypto = require('crypto');
    return crypto.createHash('md5').update(content).digest('hex');
  }

  /**
   * Detect duplicate files
   */
  private async detectDuplicates(): Promise<void> {
    if (!this.config.rules.removeDuplicates) return;

    console.log('🔍 Detecting duplicate files...');
    
    const hashGroups: { [hash: string]: string[] } = {};

    // Group files by hash
    for (const [filePath, hash] of this.fileHashes.entries()) {
      if (!hashGroups[hash]) {
        hashGroups[hash] = [];
      }
      hashGroups[hash].push(filePath);
    }

    // Find duplicates
    for (const [hash, files] of Object.entries(hashGroups)) {
      if (files.length > 1) {
        // Keep the first file (usually the one in the most appropriate location)
        const [keep, ...duplicates] = this.sortFilesByPriority(files);
        
        for (const duplicate of duplicates) {
          const stat = statSync(duplicate);
          
          const cleanupItem: CleanupItem = {
            id: `duplicate-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'duplicate',
            filePath: duplicate,
            reason: `Duplicate of ${relative(process.cwd(), keep)}`,
            severity: 'medium',
            size: stat.size,
            lastModified: stat.mtime.toISOString(),
            duplicates: files,
            action: 'delete',
            metadata: {
              hash,
              originalFile: keep
            }
          };

          this.cleanupItems.push(cleanupItem);
        }
      }
    }

    console.log(`🔍 Found ${this.cleanupItems.filter(item => item.type === 'duplicate').length} duplicate files`);
  }

  /**
   * Sort files by priority (prefer certain locations)
   */
  private sortFilesByPriority(files: string[]): string[] {
    return files.sort((a, b) => {
      const aScore = this.getLocationScore(a);
      const bScore = this.getLocationScore(b);
      return bScore - aScore; // Higher score = higher priority
    });
  }

  /**
   * Get priority score for file location
   */
  private getLocationScore(filePath: string): number {
    const relativePath = relative(process.cwd(), filePath);
    let score = 0;

    // Prefer files in .mcp directory
    if (relativePath.startsWith('.mcp/')) score += 100;
    
    // Prefer newer files
    try {
      const stat = statSync(filePath);
      score += Math.floor((Date.now() - stat.mtime.getTime()) / (1000 * 60 * 60 * 24)); // Days old
    } catch (error) {
      // Ignore
    }

    // Prefer shorter paths (more likely to be in the right place)
    score += Math.max(0, 50 - relativePath.length);

    return score;
  }

  /**
   * Detect orphaned configuration files
   */
  private async detectOrphanedFiles(): Promise<void> {
    if (!this.config.rules.removeOrphaned) return;

    console.log('🔍 Detecting orphaned configuration files...');

    for (const filePath of this.scannedFiles) {
      if (await this.isOrphaned(filePath)) {
        const stat = statSync(filePath);
        
        const cleanupItem: CleanupItem = {
          id: `orphaned-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'orphaned',
          filePath,
          reason: 'Configuration file with no corresponding project or references',
          severity: 'low',
          size: stat.size,
          lastModified: stat.mtime.toISOString(),
          references: [],
          action: 'manual-review'
        };

        this.cleanupItems.push(cleanupItem);
      }
    }

    console.log(`🔍 Found ${this.cleanupItems.filter(item => item.type === 'orphaned').length} potentially orphaned files`);
  }

  /**
   * Check if file appears to be orphaned
   */
  private async isOrphaned(filePath: string): boolean {
    const relativePath = relative(process.cwd(), filePath);
    const dirName = dirname(relativePath);
    const fileName = basename(filePath);

    // Skip files in active directories
    if (relativePath.startsWith('.mcp/')) return false;

    // Check if directory has other relevant files
    try {
      const siblings = readdirSync(dirname(filePath));
      const hasProjectFiles = siblings.some(sibling => {
        return ['package.json', 'tsconfig.json', 'README.md', '.gitignore'].includes(sibling);
      });

      // If no project files in the same directory, might be orphaned
      if (!hasProjectFiles) {
        // Check if it's a config file in an otherwise empty directory
        const configFiles = siblings.filter(sibling => 
          this.matchesFilePattern(sibling) && sibling !== fileName
        );
        
        return configFiles.length === 0;
      }
    } catch (error) {
      return false;
    }

    return false;
  }

  /**
   * Detect empty or minimal configuration files
   */
  private async detectEmptyFiles(): Promise<void> {
    if (!this.config.rules.removeEmpty) return;

    console.log('🔍 Detecting empty or minimal configuration files...');

    for (const filePath of this.scannedFiles) {
      try {
        const content = readFileSync(filePath, 'utf8').trim();
        const stat = statSync(filePath);
        
        let isEmpty = false;
        let reason = '';

        // Check for completely empty files
        if (content.length === 0) {
          isEmpty = true;
          reason = 'File is completely empty';
        }
        // Check for files with only whitespace or basic JSON structure
        else if (content.length < 10) {
          isEmpty = true;
          reason = 'File contains only whitespace or minimal content';
        }
        // Check for empty JSON objects
        else if (filePath.endsWith('.json')) {
          try {
            const parsed = JSON.parse(content);
            if (typeof parsed === 'object' && Object.keys(parsed).length === 0) {
              isEmpty = true;
              reason = 'JSON file contains only empty object';
            }
          } catch (error) {
            // Not valid JSON, skip
          }
        }

        if (isEmpty) {
          const cleanupItem: CleanupItem = {
            id: `empty-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'empty',
            filePath,
            reason,
            severity: 'low',
            size: stat.size,
            lastModified: stat.mtime.toISOString(),
            action: 'delete'
          };

          this.cleanupItems.push(cleanupItem);
        }
      } catch (error) {
        // Skip files that can't be read
      }
    }

    console.log(`🔍 Found ${this.cleanupItems.filter(item => item.type === 'empty').length} empty files`);
  }

  /**
   * Detect old backup files
   */
  private async detectOldBackups(): Promise<void> {
    if (!this.config.rules.removeOldBackups) return;

    console.log('🔍 Detecting old backup files...');

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.rules.backupRetentionDays);

    for (const filePath of this.scannedFiles) {
      const fileName = basename(filePath);
      
      // Check if file appears to be a backup
      if (this.isBackupFile(fileName)) {
        try {
          const stat = statSync(filePath);
          
          if (stat.mtime < cutoffDate) {
            const cleanupItem: CleanupItem = {
              id: `old-backup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              type: 'old-backup',
              filePath,
              reason: `Backup file older than ${this.config.rules.backupRetentionDays} days`,
              severity: 'low',
              size: stat.size,
              lastModified: stat.mtime.toISOString(),
              action: 'delete',
              metadata: {
                age: Math.floor((Date.now() - stat.mtime.getTime()) / (1000 * 60 * 60 * 24))
              }
            };

            this.cleanupItems.push(cleanupItem);
          }
        } catch (error) {
          // Skip files that can't be accessed
        }
      }
    }

    console.log(`🔍 Found ${this.cleanupItems.filter(item => item.type === 'old-backup').length} old backup files`);
  }

  /**
   * Check if file appears to be a backup
   */
  private isBackupFile(fileName: string): boolean {
    const backupIndicators = [
      '.backup',
      '.bak',
      '.old',
      '.orig',
      '_backup',
      '_bak',
      '_old'
    ];

    return backupIndicators.some(indicator => fileName.includes(indicator)) ||
           /\.\d{4}-\d{2}-\d{2}/.test(fileName) || // Date pattern
           /\.backup$/.test(fileName);
  }

  /**
   * Detect unused environment variables
   */
  private async detectUnusedEnvironmentVariables(): Promise<void> {
    console.log('🔍 Detecting unused environment variables...');

    // This is a simplified implementation - in a real scenario you'd want to
    // scan all code files to see which environment variables are actually used
    
    const envFiles = Array.from(this.scannedFiles).filter(file => 
      basename(file).startsWith('.env')
    );

    for (const envFile of envFiles) {
      try {
        const content = readFileSync(envFile, 'utf8');
        const lines = content.split('\n');
        const unusedVars: string[] = [];

        for (const line of lines) {
          if (line.trim() && !line.trim().startsWith('#') && line.includes('=')) {
            const [varName] = line.split('=');
            const trimmedVarName = varName.trim();
            
            // Simple check - this would need to be more sophisticated in practice
            if (trimmedVarName.includes('DEPRECATED') || 
                trimmedVarName.includes('UNUSED') ||
                trimmedVarName.includes('OLD_')) {
              unusedVars.push(trimmedVarName);
            }
          }
        }

        if (unusedVars.length > 0) {
          const stat = statSync(envFile);
          
          const cleanupItem: CleanupItem = {
            id: `unused-env-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'unused-env',
            filePath: envFile,
            reason: `Contains ${unusedVars.length} potentially unused environment variables`,
            severity: 'medium',
            size: stat.size,
            lastModified: stat.mtime.toISOString(),
            action: 'manual-review',
            metadata: {
              unusedVariables: unusedVars
            }
          };

          this.cleanupItems.push(cleanupItem);
        }
      } catch (error) {
        // Skip files that can't be read
      }
    }

    console.log(`🔍 Found ${this.cleanupItems.filter(item => item.type === 'unused-env').length} files with potentially unused environment variables`);
  }

  /**
   * Detect obsolete configuration files
   */
  private async detectObsoleteConfigurations(): Promise<void> {
    console.log('🔍 Detecting obsolete configuration files...');

    // Look for configurations that appear to be from old/deprecated systems
    const obsoletePatterns = [
      /\.mcp-old/,
      /browser-mcp-\d+/,
      /old-mcp/,
      /deprecated/,
      /legacy/
    ];

    for (const filePath of this.scannedFiles) {
      const fileName = basename(filePath);
      const relativePath = relative(process.cwd(), filePath);

      if (obsoletePatterns.some(pattern => pattern.test(relativePath))) {
        const stat = statSync(filePath);
        
        const cleanupItem: CleanupItem = {
          id: `obsolete-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'obsolete',
          filePath,
          reason: 'File appears to be from deprecated or obsolete system',
          severity: 'medium',
          size: stat.size,
          lastModified: stat.mtime.toISOString(),
          action: 'manual-review'
        };

        this.cleanupItems.push(cleanupItem);
      }
    }

    console.log(`🔍 Found ${this.cleanupItems.filter(item => item.type === 'obsolete').length} potentially obsolete files`);
  }

  /**
   * Process cleanup items based on their action
   */
  private async processCleanupItems(): Promise<void> {
    console.log('🗑️  Processing cleanup items...');

    // Create backup if enabled
    if (this.config.safety.createBackupsBeforeDelete) {
      await this.createCleanupBackups();
    }

    for (const item of this.cleanupItems) {
      try {
        switch (item.action) {
          case 'delete':
            if (!this.config.rules.confirmBeforeDelete || await this.confirmAction(item)) {
              unlinkSync(item.filePath);
              console.log(`🗑️  Deleted: ${relative(process.cwd(), item.filePath)}`);
            }
            break;

          case 'archive':
            // Move to archive location
            const archivePath = join(this.config.safety.backupLocation, 'archive', basename(item.filePath));
            await this.moveFile(item.filePath, archivePath);
            console.log(`📦 Archived: ${relative(process.cwd(), item.filePath)}`);
            break;

          case 'manual-review':
          case 'skip':
            console.log(`⏭️  Skipped: ${relative(process.cwd(), item.filePath)} (${item.action})`);
            break;
        }
      } catch (error) {
        console.error(`❌ Failed to process ${item.filePath}: ${error.message}`);
      }
    }
  }

  /**
   * Create backups before cleanup
   */
  private async createCleanupBackups(): Promise<void> {
    console.log('📁 Creating backups before cleanup...');

    const backupTimestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = resolve(process.cwd(), this.config.safety.backupLocation, backupTimestamp);

    if (!existsSync(backupDir)) {
      mkdirSync(backupDir, { recursive: true });
    }

    for (const item of this.cleanupItems) {
      if (item.action === 'delete' || item.action === 'archive') {
        try {
          const backupPath = join(backupDir, basename(item.filePath));
          const fs = require('fs');
          fs.copyFileSync(item.filePath, backupPath);
        } catch (error) {
          console.warn(`⚠️  Failed to backup ${item.filePath}: ${error.message}`);
        }
      }
    }
  }

  /**
   * Confirm action with user (simplified - would need proper prompt in CLI)
   */
  private async confirmAction(item: CleanupItem): Promise<boolean> {
    // In a real implementation, this would prompt the user
    // For now, we'll auto-confirm low severity items
    return item.severity === 'low';
  }

  /**
   * Move file to new location
   */
  private async moveFile(source: string, target: string): Promise<void> {
    const targetDir = dirname(target);
    if (!existsSync(targetDir)) {
      mkdirSync(targetDir, { recursive: true });
    }

    const fs = require('fs');
    fs.copyFileSync(source, target);
    fs.unlinkSync(source);
  }

  /**
   * Generate cleanup report
   */
  private generateCleanupReport(): CleanupReport {
    const duration = Date.now() - this.startTime;
    const processedItems = this.cleanupItems.filter(item => 
      item.action !== 'skip' && item.action !== 'manual-review'
    );
    
    const spaceSaved = processedItems.reduce((total, item) => total + item.size, 0);
    
    const byType: { [type: string]: number } = {};
    const bySeverity: { [severity: string]: number } = {};
    
    this.cleanupItems.forEach(item => {
      byType[item.type] = (byType[item.type] || 0) + 1;
      bySeverity[item.severity] = (bySeverity[item.severity] || 0) + 1;
    });

    const report: CleanupReport = {
      timestamp: new Date().toISOString(),
      version: this.config.version,
      summary: {
        totalScanned: this.scannedFiles.size,
        itemsFound: this.cleanupItems.length,
        itemsProcessed: processedItems.length,
        spaceSaved,
        duration,
        byType,
        bySeverity
      },
      items: this.cleanupItems,
      recommendations: this.generateRecommendations(),
      warnings: this.generateWarnings()
    };

    return report;
  }

  /**
   * Generate recommendations based on cleanup results
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    const manualReviewItems = this.cleanupItems.filter(item => item.action === 'manual-review');
    if (manualReviewItems.length > 0) {
      recommendations.push(`Review ${manualReviewItems.length} items marked for manual review.`);
    }

    const duplicates = this.cleanupItems.filter(item => item.type === 'duplicate');
    if (duplicates.length > 0) {
      recommendations.push(`${duplicates.length} duplicate files found. Consider consolidating configurations.`);
    }

    const unusedEnv = this.cleanupItems.filter(item => item.type === 'unused-env');
    if (unusedEnv.length > 0) {
      recommendations.push('Review environment files for unused variables to improve security.');
    }

    if (this.cleanupItems.length === 0) {
      recommendations.push('No cleanup items found. Your MCP configuration is well-organized.');
    } else {
      recommendations.push('Consider running cleanup regularly to maintain a clean configuration structure.');
    }

    return recommendations;
  }

  /**
   * Generate warnings based on cleanup results
   */
  private generateWarnings(): string[] {
    const warnings: string[] = [];

    const highSeverityItems = this.cleanupItems.filter(item => item.severity === 'high');
    if (highSeverityItems.length > 0) {
      warnings.push(`${highSeverityItems.length} high-severity items require careful review.`);
    }

    const obsoleteItems = this.cleanupItems.filter(item => item.type === 'obsolete');
    if (obsoleteItems.length > 0) {
      warnings.push('Obsolete configurations found. Ensure no active systems depend on them.');
    }

    if (this.config.safety.dryRun) {
      warnings.push('Dry run mode was used. No files were actually modified.');
    }

    return warnings;
  }

  /**
   * Save cleanup report
   */
  private saveCleanupReport(report: CleanupReport): void {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const reportPath = resolve(process.cwd(), '.mcp', 'reports', `cleanup-report-${timestamp}.json`);
      writeFileSync(reportPath, JSON.stringify(report, null, 2));
      
      console.log(`📊 Cleanup report saved: ${relative(process.cwd(), reportPath)}`);
    } catch (error) {
      console.error('❌ Failed to save cleanup report:', error);
    }
  }
}

// =============================================================================
// CLI INTERFACE
// =============================================================================

async function main() {
  const command = process.argv[2];
  const cleanupTool = new MCPCleanupTool();

  switch (command) {
    case 'scan':
      const dryRun = process.argv.includes('--dry-run');
      if (dryRun) {
        console.log('🧪 Running cleanup scan in DRY RUN mode');
        cleanupTool['config'].safety.dryRun = true;
      }

      const report = await cleanupTool.runCleanupScan();
      
      console.log('\n📊 Cleanup Summary:');
      console.log(`   Files Scanned: ${report.summary.totalScanned}`);
      console.log(`   Items Found: ${report.summary.itemsFound}`);
      console.log(`   Items Processed: ${report.summary.itemsProcessed}`);
      console.log(`   Space Saved: ${Math.round(report.summary.spaceSaved / 1024)} KB`);
      console.log(`   Duration: ${report.summary.duration}ms`);
      
      console.log('\n📋 By Type:');
      Object.entries(report.summary.byType).forEach(([type, count]) => {
        console.log(`   ${type}: ${count}`);
      });

      if (report.recommendations.length > 0) {
        console.log('\n💡 Recommendations:');
        report.recommendations.forEach(rec => console.log(`   - ${rec}`));
      }

      if (report.warnings.length > 0) {
        console.log('\n⚠️  Warnings:');
        report.warnings.forEach(warning => console.log(`   - ${warning}`));
      }
      
      break;

    default:
      console.log(`
TekUp MCP Configuration Cleanup Tool

Usage: node cleanup-tool.js <command> [options]

Commands:
  scan           - Scan for cleanup opportunities
  scan --dry-run - Scan without making changes

Examples:
  node cleanup-tool.js scan
  node cleanup-tool.js scan --dry-run
      `);
  }
}

// Run CLI if this is the main module
if (require.main === module) {
  main().catch(console.error);
}

export default MCPCleanupTool;