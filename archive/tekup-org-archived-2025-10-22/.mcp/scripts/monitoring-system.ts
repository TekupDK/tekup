#!/usr/bin/env node

/**
 * @fileoverview TekUp MCP Infrastructure Monitoring System
 * 
 * Comprehensive monitoring, health checks, performance metrics, and alerting
 * for the entire MCP infrastructure including servers, API keys, and connections.
 * 
 * @author TekUp.org Development Team
 * @version 1.0.0
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, join } from 'path';
import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import MCPAPIKeyManager from './api-key-manager.js';
import MCPKeyRotationScheduler from './key-rotation-scheduler.js';

const execAsync = promisify(exec);

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

export interface HealthCheckResult {
  componentId: string;
  name: string;
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  message: string;
  responseTime: number;
  timestamp: string;
  metadata?: Record<string, any>;
  checks: {
    [checkName: string]: {
      status: boolean;
      message: string;
      value?: any;
    };
  };
}

export interface PerformanceMetric {
  metricId: string;
  componentId: string;
  name: string;
  value: number;
  unit: string;
  timestamp: string;
  tags?: Record<string, string>;
}

export interface Alert {
  alertId: string;
  componentId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  timestamp: string;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
  metadata?: Record<string, any>;
}

export interface MonitoringConfig {
  version: string;
  healthChecks: {
    interval: number; // seconds
    timeout: number; // seconds
    retries: number;
    components: ComponentConfig[];
  };
  metrics: {
    collection: {
      enabled: boolean;
      interval: number; // seconds
      retention: number; // days
    };
    storage: {
      type: 'file' | 'memory';
      path?: string;
    };
  };
  alerting: {
    enabled: boolean;
    channels: AlertChannel[];
    rules: AlertRule[];
  };
}

export interface ComponentConfig {
  id: string;
  name: string;
  type: 'mcp-server' | 'browser-server' | 'api-key' | 'environment' | 'custom';
  enabled: boolean;
  endpoint?: string;
  port?: number;
  checks: HealthCheck[];
  thresholds?: {
    [key: string]: { warning: number; critical: number };
  };
}

export interface HealthCheck {
  name: string;
  type: 'http' | 'tcp' | 'process' | 'file' | 'custom';
  target: string;
  timeout: number;
  expectedStatus?: number | string;
  customScript?: string;
}

export interface AlertChannel {
  id: string;
  type: 'console' | 'file' | 'email' | 'slack' | 'webhook';
  config: Record<string, any>;
  enabled: boolean;
}

export interface AlertRule {
  id: string;
  condition: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  enabled: boolean;
}

// =============================================================================
// MAIN MONITORING SYSTEM CLASS
// =============================================================================

export class MCPMonitoringSystem {
  private config: MonitoringConfig;
  private healthResults: Map<string, HealthCheckResult> = new Map();
  private metrics: PerformanceMetric[] = [];
  private alerts: Alert[] = [];
  private monitoringInterval?: NodeJS.Timeout;
  private metricsInterval?: NodeJS.Timeout;
  private isRunning: boolean = false;
  private keyManager?: MCPAPIKeyManager;
  private rotationScheduler?: MCPKeyRotationScheduler;

  constructor(configPath?: string) {
    this.loadConfiguration(configPath);
    this.initializeDirectories();
    this.loadHistoricalData();
  }

  /**
   * Initialize monitoring with key manager and rotation scheduler
   */
  initialize(keyManager?: MCPAPIKeyManager, rotationScheduler?: MCPKeyRotationScheduler): void {
    this.keyManager = keyManager;
    this.rotationScheduler = rotationScheduler;
    console.log('✅ MCP Monitoring System initialized');
  }

  /**
   * Load monitoring configuration
   */
  private loadConfiguration(configPath?: string): void {
    const defaultConfigPath = resolve(process.cwd(), '.mcp/configs/monitoring-config.json');
    const path = configPath || defaultConfigPath;

    if (existsSync(path)) {
      try {
        const content = readFileSync(path, 'utf8');
        this.config = JSON.parse(content);
        console.log(`✅ Loaded monitoring configuration from ${path}`);
      } catch (error) {
        console.warn(`⚠️  Failed to load config from ${path}, using defaults`);
        this.config = this.createDefaultConfiguration();
      }
    } else {
      console.log('📋 Creating default monitoring configuration');
      this.config = this.createDefaultConfiguration();
      this.saveConfiguration();
    }
  }

  /**
   * Create default monitoring configuration
   */
  private createDefaultConfiguration(): MonitoringConfig {
    return {
      version: '1.0.0',
      healthChecks: {
        interval: 30, // Check every 30 seconds
        timeout: 5000, // 5 second timeout
        retries: 2,
        components: [
          {
            id: 'browser-mcp-unified',
            name: 'Browser MCP Unified Server',
            type: 'browser-server',
            enabled: true,
            port: 3001,
            checks: [
              {
                name: 'port-check',
                type: 'tcp',
                target: 'localhost:3001',
                timeout: 5000
              },
              {
                name: 'health-endpoint',
                type: 'http',
                target: 'http://localhost:3001/health',
                timeout: 5000,
                expectedStatus: 200
              }
            ],
            thresholds: {
              responseTime: { warning: 1000, critical: 5000 },
              errorRate: { warning: 5, critical: 10 }
            }
          },
          {
            id: 'mcp-gateway',
            name: 'MCP Gateway Service',
            type: 'mcp-server',
            enabled: true,
            port: 3000,
            checks: [
              {
                name: 'process-check',
                type: 'process',
                target: 'mcp-gateway',
                timeout: 1000
              },
              {
                name: 'config-validity',
                type: 'file',
                target: '.mcp/mcp.json',
                timeout: 1000
              }
            ]
          },
          {
            id: 'api-keys',
            name: 'API Keys Health',
            type: 'api-key',
            enabled: true,
            checks: [
              {
                name: 'key-validation',
                type: 'custom',
                target: 'validate-all-keys',
                timeout: 10000
              },
              {
                name: 'rotation-schedule',
                type: 'custom',
                target: 'check-rotation-schedule',
                timeout: 5000
              }
            ]
          },
          {
            id: 'environment',
            name: 'Environment Variables',
            type: 'environment',
            enabled: true,
            checks: [
              {
                name: 'required-vars',
                type: 'custom',
                target: 'check-required-env-vars',
                timeout: 2000
              },
              {
                name: 'env-files',
                type: 'file',
                target: '.env',
                timeout: 1000
              }
            ]
          }
        ]
      },
      metrics: {
        collection: {
          enabled: true,
          interval: 60, // Collect metrics every minute
          retention: 30 // Keep 30 days of metrics
        },
        storage: {
          type: 'file',
          path: '.mcp/metrics'
        }
      },
      alerting: {
        enabled: true,
        channels: [
          {
            id: 'console',
            type: 'console',
            config: {},
            enabled: true
          },
          {
            id: 'file-log',
            type: 'file',
            config: {
              path: '.mcp/logs/alerts.log'
            },
            enabled: true
          }
        ],
        rules: [
          {
            id: 'health-critical',
            condition: 'status == "critical"',
            severity: 'critical',
            description: 'Component health is critical',
            enabled: true
          },
          {
            id: 'response-time-high',
            condition: 'responseTime > thresholds.responseTime.critical',
            severity: 'high',
            description: 'Response time exceeds critical threshold',
            enabled: true
          },
          {
            id: 'key-rotation-overdue',
            condition: 'keyRotationOverdue == true',
            severity: 'medium',
            description: 'API key rotation is overdue',
            enabled: true
          }
        ]
      }
    };
  }

  /**
   * Initialize required directories
   */
  private initializeDirectories(): void {
    const dirs = [
      '.mcp/logs',
      '.mcp/metrics',
      '.mcp/configs',
      '.mcp/backups'
    ];

    dirs.forEach(dir => {
      const fullPath = resolve(process.cwd(), dir);
      if (!existsSync(fullPath)) {
        mkdirSync(fullPath, { recursive: true });
      }
    });
  }

  /**
   * Load historical monitoring data
   */
  private loadHistoricalData(): void {
    this.loadAlerts();
    this.loadMetrics();
  }

  /**
   * Save monitoring configuration
   */
  private saveConfiguration(): void {
    try {
      const configPath = resolve(process.cwd(), '.mcp/configs/monitoring-config.json');
      writeFileSync(configPath, JSON.stringify(this.config, null, 2));
    } catch (error) {
      console.error('❌ Failed to save monitoring configuration:', error);
    }
  }

  /**
   * Start the monitoring system
   */
  startMonitoring(): void {
    if (this.isRunning) {
      console.log('⚠️  Monitoring system is already running');
      return;
    }

    this.isRunning = true;

    // Start health check monitoring
    this.runHealthChecks();
    this.monitoringInterval = setInterval(() => {
      this.runHealthChecks();
    }, this.config.healthChecks.interval * 1000);

    // Start metrics collection if enabled
    if (this.config.metrics.collection.enabled) {
      this.collectMetrics();
      this.metricsInterval = setInterval(() => {
        this.collectMetrics();
      }, this.config.metrics.collection.interval * 1000);
    }

    console.log(`✅ Monitoring system started`);
    console.log(`   Health checks: every ${this.config.healthChecks.interval} seconds`);
    console.log(`   Metrics: every ${this.config.metrics.collection.interval} seconds`);
  }

  /**
   * Stop the monitoring system
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }

    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = undefined;
    }

    this.isRunning = false;
    console.log('⏹️  Monitoring system stopped');
  }

  /**
   * Run health checks for all components
   */
  private async runHealthChecks(): Promise<void> {
    const timestamp = new Date().toISOString();
    
    for (const component of this.config.healthChecks.components) {
      if (!component.enabled) continue;

      try {
        const result = await this.runComponentHealthCheck(component);
        this.healthResults.set(component.id, result);

        // Check for alerts
        this.evaluateAlerts(result);
      } catch (error) {
        console.error(`❌ Health check failed for ${component.name}:`, error);
        
        const errorResult: HealthCheckResult = {
          componentId: component.id,
          name: component.name,
          status: 'critical',
          message: `Health check failed: ${error.message}`,
          responseTime: 0,
          timestamp,
          checks: {
            'system-error': {
              status: false,
              message: error.message
            }
          }
        };

        this.healthResults.set(component.id, errorResult);
        this.evaluateAlerts(errorResult);
      }
    }
  }

  /**
   * Run health check for a specific component
   */
  private async runComponentHealthCheck(component: ComponentConfig): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();
    const checks: HealthCheckResult['checks'] = {};
    let overallStatus: HealthCheckResult['status'] = 'healthy';
    let overallMessage = 'All checks passed';

    for (const check of component.checks) {
      try {
        const checkResult = await this.runIndividualCheck(check, component);
        checks[check.name] = checkResult;

        if (!checkResult.status) {
          if (overallStatus === 'healthy') overallStatus = 'warning';
          overallMessage = `Check failed: ${check.name}`;
        }
      } catch (error) {
        checks[check.name] = {
          status: false,
          message: error.message
        };
        overallStatus = 'critical';
        overallMessage = `Critical failure in ${check.name}`;
      }
    }

    const responseTime = Date.now() - startTime;

    // Apply thresholds if configured
    if (component.thresholds) {
      if (component.thresholds.responseTime) {
        if (responseTime > component.thresholds.responseTime.critical) {
          overallStatus = 'critical';
          overallMessage = `Response time critical: ${responseTime}ms`;
        } else if (responseTime > component.thresholds.responseTime.warning) {
          if (overallStatus === 'healthy') overallStatus = 'warning';
          overallMessage = `Response time high: ${responseTime}ms`;
        }
      }
    }

    return {
      componentId: component.id,
      name: component.name,
      status: overallStatus,
      message: overallMessage,
      responseTime,
      timestamp,
      checks
    };
  }

  /**
   * Run individual health check
   */
  private async runIndividualCheck(check: HealthCheck, component: ComponentConfig): Promise<{ status: boolean; message: string; value?: any }> {
    switch (check.type) {
      case 'http':
        return await this.httpCheck(check);
      case 'tcp':
        return await this.tcpCheck(check);
      case 'process':
        return await this.processCheck(check);
      case 'file':
        return await this.fileCheck(check);
      case 'custom':
        return await this.customCheck(check, component);
      default:
        throw new Error(`Unknown check type: ${check.type}`);
    }
  }

  /**
   * HTTP health check
   */
  private async httpCheck(check: HealthCheck): Promise<{ status: boolean; message: string; value?: any }> {
    try {
      const response = await fetch(check.target, {
        method: 'GET',
        signal: AbortSignal.timeout(check.timeout)
      });

      const expectedStatus = check.expectedStatus || 200;
      if (response.status === expectedStatus) {
        return {
          status: true,
          message: `HTTP check successful (${response.status})`,
          value: response.status
        };
      } else {
        return {
          status: false,
          message: `HTTP check failed: expected ${expectedStatus}, got ${response.status}`,
          value: response.status
        };
      }
    } catch (error) {
      return {
        status: false,
        message: `HTTP check failed: ${error.message}`
      };
    }
  }

  /**
   * TCP connection check
   */
  private async tcpCheck(check: HealthCheck): Promise<{ status: boolean; message: string }> {
    return new Promise((resolve) => {
      const net = require('net');
      const [host, port] = check.target.split(':');
      const client = new net.Socket();
      
      const timeout = setTimeout(() => {
        client.destroy();
        resolve({
          status: false,
          message: `TCP connection timeout to ${check.target}`
        });
      }, check.timeout);

      client.connect(parseInt(port), host, () => {
        clearTimeout(timeout);
        client.destroy();
        resolve({
          status: true,
          message: `TCP connection successful to ${check.target}`
        });
      });

      client.on('error', (error) => {
        clearTimeout(timeout);
        resolve({
          status: false,
          message: `TCP connection failed: ${error.message}`
        });
      });
    });
  }

  /**
   * Process existence check
   */
  private async processCheck(check: HealthCheck): Promise<{ status: boolean; message: string }> {
    try {
      const { stdout } = await execAsync(`pgrep -f "${check.target}"`);
      const processes = stdout.trim().split('\n').filter(line => line.length > 0);
      
      if (processes.length > 0) {
        return {
          status: true,
          message: `Process ${check.target} is running (${processes.length} instances)`
        };
      } else {
        return {
          status: false,
          message: `Process ${check.target} is not running`
        };
      }
    } catch (error) {
      return {
        status: false,
        message: `Process check failed: ${error.message}`
      };
    }
  }

  /**
   * File existence and validity check
   */
  private async fileCheck(check: HealthCheck): Promise<{ status: boolean; message: string }> {
    const filePath = resolve(process.cwd(), check.target);
    
    if (!existsSync(filePath)) {
      return {
        status: false,
        message: `File not found: ${check.target}`
      };
    }

    try {
      const content = readFileSync(filePath, 'utf8');
      
      // If it's a JSON file, try to parse it
      if (filePath.endsWith('.json')) {
        JSON.parse(content);
        return {
          status: true,
          message: `JSON file is valid: ${check.target}`
        };
      }
      
      return {
        status: true,
        message: `File exists and is readable: ${check.target}`
      };
    } catch (error) {
      return {
        status: false,
        message: `File check failed: ${error.message}`
      };
    }
  }

  /**
   * Custom health check
   */
  private async customCheck(check: HealthCheck, component: ComponentConfig): Promise<{ status: boolean; message: string; value?: any }> {
    switch (check.target) {
      case 'validate-all-keys':
        return await this.validateAllKeysCheck();
      case 'check-rotation-schedule':
        return await this.checkRotationScheduleCheck();
      case 'check-required-env-vars':
        return await this.checkRequiredEnvVarsCheck();
      default:
        if (check.customScript) {
          return await this.runCustomScript(check.customScript);
        }
        throw new Error(`Unknown custom check target: ${check.target}`);
    }
  }

  /**
   * Validate all API keys custom check
   */
  private async validateAllKeysCheck(): Promise<{ status: boolean; message: string; value?: any }> {
    if (!this.keyManager) {
      return { status: false, message: 'Key manager not initialized' };
    }

    try {
      const keys = this.keyManager.getAllKeyReferences();
      const validationResults = await this.keyManager.validateKeys(keys.map(k => k.keyId));
      
      const failedKeys = Object.entries(validationResults)
        .filter(([_, result]) => !result.valid)
        .map(([keyId, _]) => keyId);

      if (failedKeys.length === 0) {
        return {
          status: true,
          message: `All ${keys.length} API keys are valid`,
          value: { total: keys.length, valid: keys.length, invalid: 0 }
        };
      } else {
        return {
          status: false,
          message: `${failedKeys.length}/${keys.length} API keys failed validation: ${failedKeys.join(', ')}`,
          value: { total: keys.length, valid: keys.length - failedKeys.length, invalid: failedKeys.length }
        };
      }
    } catch (error) {
      return {
        status: false,
        message: `Key validation check failed: ${error.message}`
      };
    }
  }

  /**
   * Check rotation schedule custom check
   */
  private async checkRotationScheduleCheck(): Promise<{ status: boolean; message: string; value?: any }> {
    if (!this.rotationScheduler) {
      return { status: false, message: 'Rotation scheduler not initialized' };
    }

    try {
      const issues = this.rotationScheduler.getKeysRequiringAttention();
      const criticalIssues = issues.filter(i => i.priority === 'critical');
      
      if (criticalIssues.length === 0) {
        return {
          status: true,
          message: `Rotation schedule is healthy (${issues.length} minor issues)`,
          value: { total: issues.length, critical: 0 }
        };
      } else {
        return {
          status: false,
          message: `${criticalIssues.length} critical rotation issues found`,
          value: { total: issues.length, critical: criticalIssues.length }
        };
      }
    } catch (error) {
      return {
        status: false,
        message: `Rotation schedule check failed: ${error.message}`
      };
    }
  }

  /**
   * Check required environment variables
   */
  private async checkRequiredEnvVarsCheck(): Promise<{ status: boolean; message: string; value?: any }> {
    const requiredVars = [
      'NODE_ENV',
      'MCP_PORT',
      'BROWSER_MCP_PORT'
      // Add more required variables as needed
    ];

    const missing: string[] = [];
    const present: string[] = [];

    requiredVars.forEach(varName => {
      if (process.env[varName]) {
        present.push(varName);
      } else {
        missing.push(varName);
      }
    });

    if (missing.length === 0) {
      return {
        status: true,
        message: `All ${requiredVars.length} required environment variables are set`,
        value: { required: requiredVars.length, present: present.length, missing: 0 }
      };
    } else {
      return {
        status: false,
        message: `${missing.length} required environment variables missing: ${missing.join(', ')}`,
        value: { required: requiredVars.length, present: present.length, missing: missing.length }
      };
    }
  }

  /**
   * Run custom script check
   */
  private async runCustomScript(script: string): Promise<{ status: boolean; message: string; value?: any }> {
    try {
      const { stdout, stderr } = await execAsync(script);
      return {
        status: true,
        message: `Custom script executed successfully`,
        value: { stdout: stdout.trim(), stderr: stderr.trim() }
      };
    } catch (error) {
      return {
        status: false,
        message: `Custom script failed: ${error.message}`
      };
    }
  }

  /**
   * Collect performance metrics
   */
  private async collectMetrics(): Promise<void> {
    const timestamp = new Date().toISOString();

    try {
      // System metrics
      await this.collectSystemMetrics(timestamp);
      
      // Component-specific metrics
      await this.collectComponentMetrics(timestamp);
      
      // API key metrics
      await this.collectAPIKeyMetrics(timestamp);
      
      // Clean up old metrics
      this.cleanupOldMetrics();
      
      // Save metrics
      this.saveMetrics();
    } catch (error) {
      console.error('❌ Failed to collect metrics:', error);
    }
  }

  /**
   * Collect system metrics
   */
  private async collectSystemMetrics(timestamp: string): Promise<void> {
    // Memory usage
    const memUsage = process.memoryUsage();
    this.metrics.push({
      metricId: `system-memory-${Date.now()}`,
      componentId: 'system',
      name: 'memory.heap.used',
      value: memUsage.heapUsed,
      unit: 'bytes',
      timestamp
    });

    this.metrics.push({
      metricId: `system-memory-total-${Date.now()}`,
      componentId: 'system',
      name: 'memory.heap.total',
      value: memUsage.heapTotal,
      unit: 'bytes',
      timestamp
    });

    // CPU usage (simplified)
    const cpuUsage = process.cpuUsage();
    this.metrics.push({
      metricId: `system-cpu-${Date.now()}`,
      componentId: 'system',
      name: 'cpu.user',
      value: cpuUsage.user,
      unit: 'microseconds',
      timestamp
    });
  }

  /**
   * Collect component-specific metrics
   */
  private async collectComponentMetrics(timestamp: string): Promise<void> {
    for (const [componentId, healthResult] of this.healthResults) {
      this.metrics.push({
        metricId: `health-response-time-${componentId}-${Date.now()}`,
        componentId,
        name: 'health.responseTime',
        value: healthResult.responseTime,
        unit: 'milliseconds',
        timestamp
      });

      this.metrics.push({
        metricId: `health-status-${componentId}-${Date.now()}`,
        componentId,
        name: 'health.status',
        value: this.statusToNumber(healthResult.status),
        unit: 'status',
        timestamp
      });
    }
  }

  /**
   * Collect API key metrics
   */
  private async collectAPIKeyMetrics(timestamp: string): Promise<void> {
    if (!this.keyManager) return;

    const keys = this.keyManager.getAllKeyReferences();
    
    this.metrics.push({
      metricId: `apikeys-total-${Date.now()}`,
      componentId: 'api-keys',
      name: 'keys.total',
      value: keys.length,
      unit: 'count',
      timestamp
    });

    const rotatableKeys = keys.filter(k => k.rotatable).length;
    this.metrics.push({
      metricId: `apikeys-rotatable-${Date.now()}`,
      componentId: 'api-keys',
      name: 'keys.rotatable',
      value: rotatableKeys,
      unit: 'count',
      timestamp
    });

    const requiredKeys = keys.filter(k => k.required).length;
    this.metrics.push({
      metricId: `apikeys-required-${Date.now()}`,
      componentId: 'api-keys',
      name: 'keys.required',
      value: requiredKeys,
      unit: 'count',
      timestamp
    });
  }

  /**
   * Convert status to number for metrics
   */
  private statusToNumber(status: string): number {
    switch (status) {
      case 'healthy': return 1;
      case 'warning': return 0.5;
      case 'critical': return 0;
      case 'unknown': return -1;
      default: return -1;
    }
  }

  /**
   * Clean up old metrics based on retention policy
   */
  private cleanupOldMetrics(): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.metrics.collection.retention);
    
    this.metrics = this.metrics.filter(metric => {
      return new Date(metric.timestamp) >= cutoffDate;
    });
  }

  /**
   * Save metrics to storage
   */
  private saveMetrics(): void {
    if (this.config.metrics.storage.type === 'file') {
      const metricsPath = resolve(process.cwd(), this.config.metrics.storage.path!, 'metrics.json');
      const data = {
        version: '1.0.0',
        lastUpdated: new Date().toISOString(),
        metrics: this.metrics
      };
      
      try {
        writeFileSync(metricsPath, JSON.stringify(data, null, 2));
      } catch (error) {
        console.error('❌ Failed to save metrics:', error);
      }
    }
  }

  /**
   * Load metrics from storage
   */
  private loadMetrics(): void {
    if (this.config.metrics.storage.type === 'file') {
      const metricsPath = resolve(process.cwd(), this.config.metrics.storage.path!, 'metrics.json');
      
      if (existsSync(metricsPath)) {
        try {
          const content = readFileSync(metricsPath, 'utf8');
          const data = JSON.parse(content);
          this.metrics = data.metrics || [];
        } catch (error) {
          console.error('❌ Failed to load metrics:', error);
          this.metrics = [];
        }
      }
    }
  }

  /**
   * Evaluate alerts based on health check results
   */
  private evaluateAlerts(healthResult: HealthCheckResult): void {
    if (!this.config.alerting.enabled) return;

    for (const rule of this.config.alerting.rules) {
      if (!rule.enabled) continue;

      const shouldAlert = this.evaluateAlertCondition(rule.condition, healthResult);
      
      if (shouldAlert) {
        const existingAlert = this.alerts.find(alert => 
          alert.componentId === healthResult.componentId && 
          !alert.resolved &&
          alert.title.includes(rule.description)
        );

        if (!existingAlert) {
          const alert: Alert = {
            alertId: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            componentId: healthResult.componentId,
            severity: rule.severity,
            title: `${healthResult.name}: ${rule.description}`,
            message: `${rule.description}: ${healthResult.message}`,
            timestamp: new Date().toISOString(),
            resolved: false,
            metadata: {
              ruleId: rule.id,
              healthResult
            }
          };

          this.alerts.push(alert);
          this.sendAlert(alert);
        }
      }
    }
  }

  /**
   * Evaluate alert condition
   */
  private evaluateAlertCondition(condition: string, healthResult: HealthCheckResult): boolean {
    try {
      // Simple condition evaluation (in production, use a proper expression evaluator)
      const context = {
        status: healthResult.status,
        responseTime: healthResult.responseTime,
        keyRotationOverdue: false // Would be set by rotation scheduler
      };

      // Replace variables in condition
      let evaluatedCondition = condition;
      Object.entries(context).forEach(([key, value]) => {
        evaluatedCondition = evaluatedCondition.replace(new RegExp(key, 'g'), String(value));
      });

      // Simple evaluation (replace with proper expression evaluator)
      if (condition.includes('status == "critical"')) {
        return healthResult.status === 'critical';
      }
      
      return false;
    } catch (error) {
      console.error(`❌ Failed to evaluate alert condition: ${condition}`, error);
      return false;
    }
  }

  /**
   * Send alert through configured channels
   */
  private async sendAlert(alert: Alert): Promise<void> {
    for (const channel of this.config.alerting.channels) {
      if (!channel.enabled) continue;

      try {
        await this.sendAlertToChannel(channel, alert);
      } catch (error) {
        console.error(`❌ Failed to send alert to channel ${channel.id}:`, error);
      }
    }

    this.saveAlerts();
  }

  /**
   * Send alert to specific channel
   */
  private async sendAlertToChannel(channel: AlertChannel, alert: Alert): Promise<void> {
    const message = `🚨 [${alert.severity.toUpperCase()}] ${alert.title}\n${alert.message}\nTime: ${alert.timestamp}`;

    switch (channel.type) {
      case 'console':
        console.log(`🚨 ALERT: ${message}`);
        break;
        
      case 'file':
        const logPath = resolve(process.cwd(), channel.config.path);
        const logEntry = `${alert.timestamp} [${alert.severity.toUpperCase()}] ${alert.title}: ${alert.message}\n`;
        writeFileSync(logPath, logEntry, { flag: 'a' });
        break;
        
      case 'webhook':
        // In production, implement actual webhook sending
        console.log(`🔗 Webhook alert would be sent to: ${channel.config.url}`);
        break;
        
      // Add more channel implementations as needed
    }
  }

  /**
   * Load alerts from storage
   */
  private loadAlerts(): void {
    const alertsPath = resolve(process.cwd(), '.mcp/logs/alerts.json');
    if (existsSync(alertsPath)) {
      try {
        const content = readFileSync(alertsPath, 'utf8');
        const data = JSON.parse(content);
        this.alerts = data.alerts || [];
      } catch (error) {
        console.error('❌ Failed to load alerts:', error);
        this.alerts = [];
      }
    }
  }

  /**
   * Save alerts to storage
   */
  private saveAlerts(): void {
    try {
      const alertsPath = resolve(process.cwd(), '.mcp/logs/alerts.json');
      const data = {
        version: '1.0.0',
        lastUpdated: new Date().toISOString(),
        alerts: this.alerts
      };
      
      writeFileSync(alertsPath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('❌ Failed to save alerts:', error);
    }
  }

  /**
   * Get current system status
   */
  getSystemStatus(): any {
    const healthSummary = {
      healthy: 0,
      warning: 0,
      critical: 0,
      unknown: 0
    };

    this.healthResults.forEach(result => {
      healthSummary[result.status]++;
    });

    const activeAlerts = this.alerts.filter(alert => !alert.resolved);
    const recentMetrics = this.metrics.filter(metric => {
      const metricTime = new Date(metric.timestamp);
      const cutoff = new Date(Date.now() - 5 * 60 * 1000); // Last 5 minutes
      return metricTime >= cutoff;
    });

    return {
      timestamp: new Date().toISOString(),
      overallStatus: this.calculateOverallStatus(),
      components: {
        total: this.healthResults.size,
        ...healthSummary
      },
      alerts: {
        active: activeAlerts.length,
        total: this.alerts.length
      },
      metrics: {
        recent: recentMetrics.length,
        total: this.metrics.length
      },
      isMonitoring: this.isRunning
    };
  }

  /**
   * Calculate overall system status
   */
  private calculateOverallStatus(): string {
    if (this.healthResults.size === 0) return 'unknown';

    let hasWarning = false;
    for (const result of this.healthResults.values()) {
      if (result.status === 'critical') return 'critical';
      if (result.status === 'warning') hasWarning = true;
    }

    return hasWarning ? 'warning' : 'healthy';
  }
}

// =============================================================================
// CLI INTERFACE
// =============================================================================

async function main() {
  const command = process.argv[2];
  const monitoring = new MCPMonitoringSystem();

  // Initialize with key manager if available
  try {
    const keyManager = new MCPAPIKeyManager();
    const rotationScheduler = new MCPKeyRotationScheduler(keyManager);
    monitoring.initialize(keyManager, rotationScheduler);
  } catch (error) {
    console.warn('⚠️  Could not initialize key management components:', error.message);
  }

  switch (command) {
    case 'start':
      monitoring.startMonitoring();
      
      console.log('Press Ctrl+C to stop monitoring');
      process.on('SIGINT', () => {
        monitoring.stopMonitoring();
        process.exit(0);
      });
      break;

    case 'status':
      const status = monitoring.getSystemStatus();
      console.log('\n📊 MCP System Status:');
      console.log(`   Overall Status: ${status.overallStatus}`);
      console.log(`   Components: ${status.components.healthy} healthy, ${status.components.warning} warning, ${status.components.critical} critical`);
      console.log(`   Active Alerts: ${status.alerts.active}`);
      console.log(`   Monitoring: ${status.isMonitoring ? 'Running' : 'Stopped'}`);
      break;

    case 'check':
      // Run health checks once
      await monitoring['runHealthChecks']();
      const results = monitoring['healthResults'];
      
      console.log('\n🔍 Health Check Results:');
      results.forEach(result => {
        const statusIcon = result.status === 'healthy' ? '✅' : 
                         result.status === 'warning' ? '⚠️' : '❌';
        console.log(`   ${statusIcon} ${result.name}: ${result.status} (${result.responseTime}ms)`);
        console.log(`      ${result.message}`);
      });
      break;

    default:
      console.log(`
TekUp MCP Infrastructure Monitoring System

Usage: node monitoring-system.js <command>

Commands:
  start   - Start continuous monitoring
  status  - Show current system status
  check   - Run health checks once

Examples:
  node monitoring-system.js start
  node monitoring-system.js status
  node monitoring-system.js check
      `);
  }
}

// Run CLI if this is the main module
if (require.main === module) {
  main().catch(console.error);
}

export default MCPMonitoringSystem;