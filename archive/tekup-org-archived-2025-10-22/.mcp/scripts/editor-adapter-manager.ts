#!/usr/bin/env node

/**
 * @fileoverview Editor Adapter Manager for MCP Configuration Integration
 * 
 * Central orchestrator for managing all editor adapters (VS Code, Cursor, Windsurf, etc.)
 * providing unified interface for synchronization, monitoring, and management.
 * 
 * @author TekUp.org Development Team
 * @version 1.0.0
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, join } from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';

// Import all editor adapters
import BaseEditorAdapter, { EditorInfo, AdapterStats } from './editor-adapters/base-editor-adapter.js';
import VSCodeAdapter from './editor-adapters/vscode-adapter.js';
import CursorAdapter from './editor-adapters/cursor-adapter.js';
import WindsurfAdapter from './editor-adapters/windsurf-adapter.js';
import MCPConfigurationLoader from './config-loader.js';

const execAsync = promisify(exec);

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

export interface AdapterManagerConfig {
  version: string;
  adapters: {
    [editorName: string]: {
      enabled: boolean;
      autoSync: boolean;
      hotReload: boolean;
      priority: number;
    };
  };
  sync: {
    parallel: boolean;
    timeout: number; // seconds
    retryAttempts: number;
    retryDelay: number; // seconds
  };
  monitoring: {
    enabled: boolean;
    interval: number; // seconds
    healthChecks: boolean;
  };
}

export interface SyncResult {
  editorName: string;
  success: boolean;
  duration: number;
  errors: string[];
  warnings: string[];
  configSize: number;
}

export interface SyncSummary {
  timestamp: string;
  totalAdapters: number;
  successCount: number;
  failureCount: number;
  warningCount: number;
  totalDuration: number;
  results: SyncResult[];
}

export interface ManagerStats {
  lastSync: string;
  totalSyncs: number;
  successRate: number;
  averageDuration: number;
  adapters: {
    [editorName: string]: {
      installed: boolean;
      version?: string;
      lastSync: string;
      syncCount: number;
      errorCount: number;
      status: 'healthy' | 'warning' | 'error' | 'disabled';
    };
  };
}

// =============================================================================
// EDITOR ADAPTER MANAGER CLASS
// =============================================================================

export class EditorAdapterManager {
  private config: AdapterManagerConfig;
  private configLoader: MCPConfigurationLoader;
  private adapters: Map<string, BaseEditorAdapter> = new Map();
  private stats: ManagerStats;
  private monitoringInterval?: NodeJS.Timeout;
  private isMonitoring: boolean = false;

  constructor(configPath?: string) {
    this.configLoader = new MCPConfigurationLoader();
    this.loadManagerConfig(configPath);
    this.stats = this.loadStats();
    this.initializeDirectories();
  }

  /**
   * Load manager configuration
   */
  private loadManagerConfig(configPath?: string): void {
    const defaultPath = resolve(process.cwd(), '.mcp', 'configs', 'adapter-manager.json');
    const path = configPath || defaultPath;

    if (existsSync(path)) {
      try {
        const content = readFileSync(path, 'utf8');
        this.config = JSON.parse(content);
        console.log(`✅ Loaded adapter manager config from ${path}`);
      } catch (error) {
        console.warn(`⚠️  Failed to load manager config, using defaults`);
        this.config = this.createDefaultConfig();
      }
    } else {
      console.log('📋 Creating default adapter manager configuration');
      this.config = this.createDefaultConfig();
      this.saveManagerConfig();
    }
  }

  /**
   * Create default manager configuration
   */
  private createDefaultConfig(): AdapterManagerConfig {
    return {
      version: '1.0.0',
      adapters: {
        vscode: {
          enabled: true,
          autoSync: true,
          hotReload: true,
          priority: 1
        },
        cursor: {
          enabled: true,
          autoSync: true,
          hotReload: true,
          priority: 2
        },
        windsurf: {
          enabled: true,
          autoSync: true,
          hotReload: true,
          priority: 3
        },
        kiro: {
          enabled: true,
          autoSync: false,
          hotReload: false,
          priority: 4
        },
        trae: {
          enabled: true,
          autoSync: false,
          hotReload: false,
          priority: 5
        }
      },
      sync: {
        parallel: true,
        timeout: 30,
        retryAttempts: 2,
        retryDelay: 5
      },
      monitoring: {
        enabled: true,
        interval: 300, // 5 minutes
        healthChecks: true
      }
    };
  }

  /**
   * Save manager configuration
   */
  private saveManagerConfig(): void {
    try {
      const configPath = resolve(process.cwd(), '.mcp', 'configs', 'adapter-manager.json');
      writeFileSync(configPath, JSON.stringify(this.config, null, 2));
    } catch (error) {
      console.error('❌ Failed to save adapter manager config:', error);
    }
  }

  /**
   * Load manager statistics
   */
  private loadStats(): ManagerStats {
    const statsPath = resolve(process.cwd(), '.mcp', 'stats', 'adapter-manager.json');
    
    if (existsSync(statsPath)) {
      try {
        const content = readFileSync(statsPath, 'utf8');
        return JSON.parse(content);
      } catch (error) {
        console.warn('⚠️  Failed to load adapter manager stats');
      }
    }

    return {
      lastSync: '',
      totalSyncs: 0,
      successRate: 100,
      averageDuration: 0,
      adapters: {}
    };
  }

  /**
   * Save manager statistics
   */
  private saveStats(): void {
    try {
      const statsPath = resolve(process.cwd(), '.mcp', 'stats', 'adapter-manager.json');
      writeFileSync(statsPath, JSON.stringify(this.stats, null, 2));
    } catch (error) {
      console.error('❌ Failed to save adapter manager stats:', error);
    }
  }

  /**
   * Initialize required directories
   */
  private initializeDirectories(): void {
    const dirs = [
      '.mcp/configs',
      '.mcp/stats',
      '.mcp/logs',
      '.mcp/backups/editors'
    ];

    dirs.forEach(dir => {
      const fullPath = resolve(process.cwd(), dir);
      if (!existsSync(fullPath)) {
        mkdirSync(fullPath, { recursive: true });
      }
    });
  }

  /**
   * Initialize all editor adapters
   */
  async initializeAdapters(): Promise<void> {
    console.log('🔧 Initializing editor adapters...');

    // Initialize each enabled adapter
    const adapterClasses: { [key: string]: any } = {
      vscode: VSCodeAdapter,
      cursor: CursorAdapter,
      windsurf: WindsurfAdapter
      // Add more adapters as they are implemented
    };

    for (const [editorName, adapterConfig] of Object.entries(this.config.adapters)) {
      if (!adapterConfig.enabled) {
        console.log(`⏭️  Skipping disabled adapter: ${editorName}`);
        continue;
      }

      const AdapterClass = adapterClasses[editorName];
      if (!AdapterClass) {
        console.warn(`⚠️  No adapter class found for ${editorName}`);
        continue;
      }

      try {
        const adapter = new AdapterClass(this.configLoader);
        await adapter.initialize();
        
        this.adapters.set(editorName, adapter);
        
        const editorInfo = adapter.getAdapterInfo().editor;
        this.updateAdapterStats(editorName, editorInfo);
        
        console.log(`✅ Initialized ${editorName} adapter`);
        
        // Start hot reload if enabled
        if (adapterConfig.hotReload && editorInfo.installed) {
          adapter.startHotReload();
        }

      } catch (error) {
        console.error(`❌ Failed to initialize ${editorName} adapter:`, error);
        this.updateAdapterStats(editorName, null, 'error');
      }
    }

    console.log(`✅ Initialized ${this.adapters.size} editor adapters`);
  }

  /**
   * Update adapter statistics
   */
  private updateAdapterStats(editorName: string, editorInfo: EditorInfo | null, status?: string): void {
    if (!this.stats.adapters[editorName]) {
      this.stats.adapters[editorName] = {
        installed: false,
        lastSync: '',
        syncCount: 0,
        errorCount: 0,
        status: 'disabled'
      };
    }

    const adapterStat = this.stats.adapters[editorName];
    
    if (editorInfo) {
      adapterStat.installed = editorInfo.installed;
      adapterStat.version = editorInfo.version;
      adapterStat.status = editorInfo.installed ? 'healthy' : 'error';
    }

    if (status) {
      adapterStat.status = status as any;
    }
  }

  /**
   * Synchronize MCP configuration with all editors
   */
  async syncAllAdapters(): Promise<SyncSummary> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();
    const results: SyncResult[] = [];
    
    console.log('🔄 Starting synchronization with all editors...');

    // Get enabled adapters sorted by priority
    const enabledAdapters = Array.from(this.adapters.entries())
      .filter(([name]) => this.config.adapters[name]?.enabled)
      .sort(([nameA], [nameB]) => {
        const priorityA = this.config.adapters[nameA]?.priority || 999;
        const priorityB = this.config.adapters[nameB]?.priority || 999;
        return priorityA - priorityB;
      });

    if (this.config.sync.parallel) {
      // Parallel synchronization
      const syncPromises = enabledAdapters.map(([name, adapter]) => 
        this.syncSingleAdapter(name, adapter)
      );
      
      const syncResults = await Promise.allSettled(syncPromises);
      
      syncResults.forEach((result, index) => {
        const [name] = enabledAdapters[index];
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            editorName: name,
            success: false,
            duration: 0,
            errors: [result.reason.message || 'Unknown error'],
            warnings: [],
            configSize: 0
          });
        }
      });
    } else {
      // Sequential synchronization
      for (const [name, adapter] of enabledAdapters) {
        const result = await this.syncSingleAdapter(name, adapter);
        results.push(result);
      }
    }

    const totalDuration = Date.now() - startTime;
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    const warningCount = results.reduce((sum, r) => sum + r.warnings.length, 0);

    // Update statistics
    this.stats.lastSync = timestamp;
    this.stats.totalSyncs++;
    this.stats.successRate = Math.round((this.stats.totalSyncs > 0 ? 
      (this.stats.successRate * (this.stats.totalSyncs - 1) + (successCount / results.length * 100)) / this.stats.totalSyncs : 
      100));
    this.stats.averageDuration = Math.round((this.stats.averageDuration + totalDuration) / 2);

    // Update individual adapter stats
    results.forEach(result => {
      if (this.stats.adapters[result.editorName]) {
        this.stats.adapters[result.editorName].lastSync = timestamp;
        this.stats.adapters[result.editorName].syncCount++;
        if (!result.success) {
          this.stats.adapters[result.editorName].errorCount++;
          this.stats.adapters[result.editorName].status = 'error';
        } else if (result.warnings.length > 0) {
          this.stats.adapters[result.editorName].status = 'warning';
        } else {
          this.stats.adapters[result.editorName].status = 'healthy';
        }
      }
    });

    this.saveStats();

    const summary: SyncSummary = {
      timestamp,
      totalAdapters: results.length,
      successCount,
      failureCount,
      warningCount,
      totalDuration,
      results
    };

    // Log summary
    console.log('\n📊 Synchronization Summary:');
    console.log(`   Total: ${results.length} adapters`);
    console.log(`   Success: ${successCount} ✅`);
    console.log(`   Failed: ${failureCount} ❌`);
    console.log(`   Warnings: ${warningCount} ⚠️`);
    console.log(`   Duration: ${totalDuration}ms`);

    // Save sync log
    this.saveSyncLog(summary);

    return summary;
  }

  /**
   * Synchronize single adapter with retry logic
   */
  private async syncSingleAdapter(name: string, adapter: BaseEditorAdapter): Promise<SyncResult> {
    const startTime = Date.now();
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.sync.retryAttempts + 1; attempt++) {
      try {
        console.log(`🔄 Syncing ${name} (attempt ${attempt})...`);
        
        // Create timeout promise
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Sync timeout')), this.config.sync.timeout * 1000);
        });

        // Race between sync and timeout
        const success = await Promise.race([
          adapter.syncConfiguration(),
          timeoutPromise
        ]);

        if (success) {
          const duration = Date.now() - startTime;
          const adapterInfo = adapter.getAdapterInfo();
          
          console.log(`✅ Successfully synced ${name} in ${duration}ms`);
          
          return {
            editorName: name,
            success: true,
            duration,
            errors: [],
            warnings: [],
            configSize: adapterInfo.stats?.configSize || 0
          };
        } else {
          throw new Error('Sync returned false');
        }

      } catch (error) {
        lastError = error as Error;
        console.warn(`⚠️  Sync attempt ${attempt} failed for ${name}: ${error.message}`);
        
        if (attempt <= this.config.sync.retryAttempts) {
          console.log(`⏳ Retrying ${name} in ${this.config.sync.retryDelay}s...`);
          await new Promise(resolve => setTimeout(resolve, this.config.sync.retryDelay * 1000));
        }
      }
    }

    const duration = Date.now() - startTime;
    console.error(`❌ Failed to sync ${name} after ${this.config.sync.retryAttempts + 1} attempts`);

    return {
      editorName: name,
      success: false,
      duration,
      errors: [lastError?.message || 'Unknown error'],
      warnings: [],
      configSize: 0
    };
  }

  /**
   * Test sync for all adapters without writing files
   */
  async testSyncAll(): Promise<{ [editorName: string]: any }> {
    const results: { [editorName: string]: any } = {};
    
    console.log('🧪 Testing synchronization for all editors...');

    for (const [name, adapter] of this.adapters) {
      if (!this.config.adapters[name]?.enabled) continue;
      
      try {
        console.log(`🧪 Testing ${name}...`);
        const testResult = await adapter.testSync();
        results[name] = testResult;
        
        if (testResult.success) {
          console.log(`✅ ${name} test passed`);
        } else {
          console.log(`❌ ${name} test failed:`);
          testResult.issues.forEach((issue: string) => console.log(`   - ${issue}`));
        }
      } catch (error) {
        console.error(`❌ Test failed for ${name}:`, error);
        results[name] = {
          success: false,
          issues: [error.message],
          transformed: null
        };
      }
    }

    return results;
  }

  /**
   * Get comprehensive status of all adapters
   */
  getManagerStatus(): any {
    const adapterStatuses = Array.from(this.adapters.entries()).map(([name, adapter]) => {
      const info = adapter.getAdapterInfo();
      const config = this.config.adapters[name];
      const stats = this.stats.adapters[name];
      
      return {
        name,
        displayName: info.editor.displayName,
        installed: info.editor.installed,
        version: info.editor.version,
        enabled: config?.enabled || false,
        autoSync: config?.autoSync || false,
        hotReload: config?.hotReload || false,
        status: stats?.status || 'unknown',
        lastSync: stats?.lastSync || '',
        syncCount: stats?.syncCount || 0,
        errorCount: stats?.errorCount || 0,
        configPath: info.config.targetPath
      };
    });

    return {
      timestamp: new Date().toISOString(),
      version: this.config.version,
      isMonitoring: this.isMonitoring,
      stats: this.stats,
      adapters: adapterStatuses,
      config: {
        parallel: this.config.sync.parallel,
        timeout: this.config.sync.timeout,
        retryAttempts: this.config.sync.retryAttempts,
        monitoringEnabled: this.config.monitoring.enabled
      }
    };
  }

  /**
   * Start monitoring all adapters
   */
  startMonitoring(): void {
    if (this.isMonitoring || !this.config.monitoring.enabled) {
      return;
    }

    this.isMonitoring = true;
    
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.runHealthChecks();
        
        // Auto-sync if enabled
        const needsSync = Array.from(this.adapters.entries())
          .some(([name]) => this.config.adapters[name]?.autoSync);
        
        if (needsSync) {
          await this.syncAllAdapters();
        }
      } catch (error) {
        console.error('❌ Monitoring error:', error);
      }
    }, this.config.monitoring.interval * 1000);

    console.log(`👁️  Started monitoring (interval: ${this.config.monitoring.interval}s)`);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
      this.isMonitoring = false;
      console.log('⏹️  Stopped monitoring');
    }
  }

  /**
   * Run health checks on all adapters
   */
  private async runHealthChecks(): Promise<void> {
    if (!this.config.monitoring.healthChecks) return;

    for (const [name, adapter] of this.adapters) {
      try {
        const testResult = await adapter.testSync();
        const status = testResult.success ? 'healthy' : 'warning';
        this.updateAdapterStats(name, null, status);
      } catch (error) {
        this.updateAdapterStats(name, null, 'error');
      }
    }
  }

  /**
   * Save sync log for audit trail
   */
  private saveSyncLog(summary: SyncSummary): void {
    try {
      const logPath = resolve(process.cwd(), '.mcp', 'logs', 'sync-history.json');
      let history: SyncSummary[] = [];
      
      if (existsSync(logPath)) {
        const content = readFileSync(logPath, 'utf8');
        history = JSON.parse(content);
      }
      
      history.push(summary);
      
      // Keep only last 100 sync logs
      if (history.length > 100) {
        history = history.slice(-100);
      }
      
      writeFileSync(logPath, JSON.stringify(history, null, 2));
    } catch (error) {
      console.error('❌ Failed to save sync log:', error);
    }
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    this.stopMonitoring();
    
    // Stop hot reload for all adapters
    for (const [name, adapter] of this.adapters) {
      adapter.stopHotReload();
    }
    
    // Clean up old backups
    for (const [name, adapter] of this.adapters) {
      adapter.cleanupBackups(10);
    }
    
    console.log('🧹 Cleaned up adapter manager resources');
  }
}

// =============================================================================
// CLI INTERFACE
// =============================================================================

async function main() {
  const command = process.argv[2];
  const manager = new EditorAdapterManager();

  try {
    await manager.initializeAdapters();

    switch (command) {
      case 'sync':
        const syncSummary = await manager.syncAllAdapters();
        process.exit(syncSummary.failureCount > 0 ? 1 : 0);
        break;

      case 'test':
        const testResults = await manager.testSyncAll();
        const hasFailures = Object.values(testResults).some((result: any) => !result.success);
        process.exit(hasFailures ? 1 : 0);
        break;

      case 'status':
        const status = manager.getManagerStatus();
        console.log('\n📊 Editor Adapter Manager Status:');
        console.log(`   Last Sync: ${status.stats.lastSync || 'Never'}`);
        console.log(`   Success Rate: ${status.stats.successRate}%`);
        console.log(`   Monitoring: ${status.isMonitoring ? 'Running' : 'Stopped'}`);
        console.log('\n📝 Adapters:');
        status.adapters.forEach((adapter: any) => {
          const statusIcon = adapter.installed ? 
            (adapter.status === 'healthy' ? '✅' : 
             adapter.status === 'warning' ? '⚠️' : '❌') : '⏹️';
          console.log(`   ${statusIcon} ${adapter.displayName} (${adapter.name})`);
          console.log(`      Version: ${adapter.version || 'Unknown'}`);
          console.log(`      Enabled: ${adapter.enabled}`);
          console.log(`      Syncs: ${adapter.syncCount}, Errors: ${adapter.errorCount}`);
        });
        break;

      case 'monitor':
        manager.startMonitoring();
        console.log('Press Ctrl+C to stop monitoring');
        process.on('SIGINT', async () => {
          await manager.cleanup();
          process.exit(0);
        });
        break;

      default:
        console.log(`
TekUp Editor Adapter Manager

Usage: node editor-adapter-manager.js <command>

Commands:
  sync     - Synchronize MCP configuration with all editors
  test     - Test sync without writing files
  status   - Show status of all adapters
  monitor  - Start continuous monitoring and auto-sync

Examples:
  node editor-adapter-manager.js sync
  node editor-adapter-manager.js test
  node editor-adapter-manager.js status
        `);
    }
  } catch (error) {
    console.error('❌ Manager error:', error);
    process.exit(1);
  }
}

// Run CLI if this is the main module
if (require.main === module) {
  main().catch(console.error);
}

export default EditorAdapterManager;