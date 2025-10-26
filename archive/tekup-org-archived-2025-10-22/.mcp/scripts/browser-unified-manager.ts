#!/usr/bin/env node

/**
 * @fileoverview TekUp Unified Browser MCP Server Manager
 * 
 * Orchestrates multiple browser MCP servers with load balancing, health monitoring,
 * and intelligent routing based on the unified browser configuration.
 * 
 * @author TekUp.org Development Team
 * @version 1.0.0
 */

import { EventEmitter } from 'events';
import { spawn, ChildProcess } from 'child_process';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { loadMCPConfig } from './config-loader.js';
import type { MCPConfig, BrowserServerConfig } from '../schemas/types.js';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

export interface BrowserServer {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  priority: number;
  process?: ChildProcess;
  status: 'stopped' | 'starting' | 'running' | 'stopping' | 'error';
  health: 'healthy' | 'unhealthy' | 'unknown';
  lastHealthCheck: number;
  startTime?: number;
  config: BrowserServerConfig;
  stats: {
    requests: number;
    errors: number;
    avgResponseTime: number;
    uptime: number;
  };
}

export interface LoadBalancerStats {
  strategy: string;
  totalRequests: number;
  activeServers: number;
  healthyServers: number;
  averageResponseTime: number;
}

export interface UnifiedBrowserConfig {
  servers: Record<string, BrowserServerConfig>;
  loadBalancing: {
    enabled: boolean;
    strategy: string;
    fallbackChain: string[];
    healthCheckInterval: number;
    failoverTimeout: number;
    circuitBreaker: {
      enabled: boolean;
      failureThreshold: number;
      recoveryTimeout: number;
    };
  };
  routing: {
    rules: Array<{
      pattern: string;
      preferredServer: string;
      fallback: boolean;
    }>;
  };
  monitoring: {
    enabled: boolean;
    metrics: Record<string, boolean>;
    alerts: Record<string, any>;
  };
}

// =============================================================================
// UNIFIED BROWSER MANAGER CLASS
// =============================================================================

export class UnifiedBrowserManager extends EventEmitter {
  private config: UnifiedBrowserConfig;
  private servers: Map<string, BrowserServer> = new Map();
  private healthCheckInterval?: NodeJS.Timeout;
  private currentRequestId = 0;
  private circuitBreakerStates: Map<string, {
    failures: number;
    lastFailure: number;
    state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
    nextAttempt: number;
  }> = new Map();

  constructor(private configPath?: string) {
    super();
    this.loadConfiguration();
  }

  /**
   * Load unified browser configuration
   */
  private loadConfiguration(): void {
    try {
      const configFile = this.configPath || resolve(process.cwd(), '.mcp/configs/browser-unified.json');
      const configContent = readFileSync(configFile, 'utf8');
      this.config = JSON.parse(configContent) as UnifiedBrowserConfig;
      
      console.log('✅ Unified browser configuration loaded');
      this.initializeServers();
    } catch (error) {
      console.error('❌ Failed to load unified browser configuration:', error);
      throw error;
    }
  }

  /**
   * Initialize browser servers from configuration
   */
  private initializeServers(): void {
    for (const [serverId, serverConfig] of Object.entries(this.config.servers)) {
      const server: BrowserServer = {
        id: serverId,
        name: serverConfig.name,
        type: serverConfig.type,
        enabled: this.parseBoolean(serverConfig.enabled),
        priority: serverConfig.priority,
        status: 'stopped',
        health: 'unknown',
        lastHealthCheck: 0,
        config: serverConfig,
        stats: {
          requests: 0,
          errors: 0,
          avgResponseTime: 0,
          uptime: 0
        }
      };
      
      this.servers.set(serverId, server);
      this.initializeCircuitBreaker(serverId);
    }
    
    console.log(`🚀 Initialized ${this.servers.size} browser servers`);
  }

  /**
   * Initialize circuit breaker for a server
   */
  private initializeCircuitBreaker(serverId: string): void {
    this.circuitBreakerStates.set(serverId, {
      failures: 0,
      lastFailure: 0,
      state: 'CLOSED',
      nextAttempt: 0
    });
  }

  /**
   * Start all enabled browser servers
   */
  async startAll(): Promise<void> {
    console.log('🔄 Starting unified browser server manager...');
    
    const enabledServers = Array.from(this.servers.values())
      .filter(server => server.enabled)
      .sort((a, b) => a.priority - b.priority);
    
    for (const server of enabledServers) {
      try {
        await this.startServer(server.id);
      } catch (error) {
        console.error(`❌ Failed to start server ${server.id}:`, error);
        // Continue with other servers
      }
    }
    
    // Start health monitoring
    this.startHealthMonitoring();
    
    console.log(`✅ Browser server manager started with ${enabledServers.length} servers`);
  }

  /**
   * Start a specific browser server
   */
  async startServer(serverId: string): Promise<void> {
    const server = this.servers.get(serverId);
    if (!server) {
      throw new Error(`Server ${serverId} not found`);
    }
    
    if (server.status === 'running') {
      console.log(`⚠️  Server ${serverId} is already running`);
      return;
    }
    
    console.log(`🔄 Starting server ${serverId} (${server.name})...`);
    server.status = 'starting';
    server.startTime = Date.now();
    
    try {
      const transportConfig = server.config.transport.config;
      
      // Resolve environment variables in command and args
      const command = this.resolveEnvironmentVariables(transportConfig.command);
      const args = transportConfig.args?.map(arg => this.resolveEnvironmentVariables(arg)) || [];
      
      // Prepare environment variables
      const env = {
        ...process.env,
        ...transportConfig.env
      };
      
      // Resolve environment variables in env
      for (const [key, value] of Object.entries(env)) {
        if (typeof value === 'string') {
          env[key] = this.resolveEnvironmentVariables(value);
        }
      }
      
      // Spawn the process
      server.process = spawn(command, args, {
        cwd: transportConfig.cwd || process.cwd(),
        env,
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      // Setup process event handlers
      this.setupProcessHandlers(server);
      
      // Wait for startup
      await this.waitForServerStartup(server);
      
      server.status = 'running';
      server.health = 'healthy';
      
      console.log(`✅ Server ${serverId} started successfully`);
      this.emit('serverStarted', { serverId, server });
      
    } catch (error) {
      server.status = 'error';
      server.health = 'unhealthy';
      console.error(`❌ Failed to start server ${serverId}:`, error);
      this.emit('serverError', { serverId, error });
      throw error;
    }
  }

  /**
   * Setup process event handlers
   */
  private setupProcessHandlers(server: BrowserServer): void {
    if (!server.process) return;
    
    server.process.on('exit', (code, signal) => {
      console.log(`📤 Server ${server.id} exited with code ${code}, signal ${signal}`);
      server.status = code === 0 ? 'stopped' : 'error';
      server.health = 'unhealthy';
      server.process = undefined;
      
      this.emit('serverStopped', { serverId: server.id, code, signal });
      
      // Auto-restart if needed
      if (server.enabled && code !== 0) {
        console.log(`🔄 Auto-restarting server ${server.id}...`);
        setTimeout(() => this.startServer(server.id), 5000);
      }
    });
    
    server.process.on('error', (error) => {
      console.error(`❌ Server ${server.id} process error:`, error);
      server.status = 'error';
      server.health = 'unhealthy';
      
      this.recordServerFailure(server.id);
      this.emit('serverError', { serverId: server.id, error });
    });
    
    // Handle stdout/stderr
    if (server.process.stdout) {
      server.process.stdout.on('data', (data) => {
        const message = data.toString().trim();
        console.log(`📝 [${server.id}] ${message}`);
      });
    }
    
    if (server.process.stderr) {
      server.process.stderr.on('data', (data) => {
        const message = data.toString().trim();
        console.error(`📝 [${server.id}] ${message}`);
      });
    }
  }

  /**
   * Wait for server startup
   */
  private async waitForServerStartup(server: BrowserServer): Promise<void> {
    const timeout = server.config.transport.config.timeout || 30000;
    const startTime = Date.now();
    
    return new Promise<void>((resolve, reject) => {
      const checkStartup = () => {
        if (Date.now() - startTime > timeout) {
          reject(new Error(`Server ${server.id} startup timeout`));
          return;
        }
        
        // For now, just wait a short time - in real implementation,
        // you would check if the server is actually responding
        if (Date.now() - startTime > 2000) {
          resolve();
        } else {
          setTimeout(checkStartup, 100);
        }
      };
      
      checkStartup();
    });
  }

  /**
   * Stop a specific server
   */
  async stopServer(serverId: string): Promise<void> {
    const server = this.servers.get(serverId);
    if (!server) {
      throw new Error(`Server ${serverId} not found`);
    }
    
    if (server.status === 'stopped') {
      console.log(`⚠️  Server ${serverId} is already stopped`);
      return;
    }
    
    console.log(`🔄 Stopping server ${serverId}...`);
    server.status = 'stopping';
    
    if (server.process) {
      server.process.kill('SIGTERM');
      
      // Wait for graceful shutdown
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          if (server.process && !server.process.killed) {
            console.log(`⚠️  Force killing server ${serverId}`);
            server.process.kill('SIGKILL');
          }
          resolve();
        }, 5000);
        
        server.process!.on('exit', () => {
          clearTimeout(timeout);
          resolve();
        });
      });
    }
    
    server.status = 'stopped';
    server.health = 'unknown';
    server.process = undefined;
    
    console.log(`✅ Server ${serverId} stopped`);
    this.emit('serverStopped', { serverId });
  }

  /**
   * Stop all servers
   */
  async stopAll(): Promise<void> {
    console.log('🔄 Stopping all browser servers...');
    
    // Stop health monitoring
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    const runningServers = Array.from(this.servers.values())
      .filter(server => server.status === 'running');
    
    await Promise.all(
      runningServers.map(server => this.stopServer(server.id))
    );
    
    console.log('✅ All browser servers stopped');
  }

  /**
   * Route request to appropriate server
   */
  async routeRequest(method: string, params: any): Promise<BrowserServer | null> {
    // Find matching routing rule
    const rule = this.config.routing.rules.find(rule => {
      const pattern = new RegExp(rule.pattern);
      return pattern.test(method);
    });
    
    const preferredServerId = rule?.preferredServer || 'primary';
    const allowFallback = rule?.fallback !== false;
    
    // Try preferred server first
    let server = await this.getHealthyServer(preferredServerId);
    
    // Try fallback chain if needed
    if (!server && allowFallback && this.config.loadBalancing.enabled) {
      for (const serverId of this.config.loadBalancing.fallbackChain) {
        server = await this.getHealthyServer(serverId);
        if (server) break;
      }
    }
    
    if (server) {
      server.stats.requests++;
      this.emit('requestRouted', { method, params, serverId: server.id });
    }
    
    return server;
  }

  /**
   * Get a healthy server instance
   */
  private async getHealthyServer(serverId: string): Promise<BrowserServer | null> {
    const server = this.servers.get(serverId);
    
    if (!server || !server.enabled || server.status !== 'running') {
      return null;
    }
    
    // Check circuit breaker
    if (this.config.loadBalancing.circuitBreaker.enabled) {
      const cbState = this.circuitBreakerStates.get(serverId);
      if (cbState?.state === 'OPEN') {
        if (Date.now() < cbState.nextAttempt) {
          return null; // Still in open state
        } else {
          cbState.state = 'HALF_OPEN';
          console.log(`🔄 Circuit breaker for ${serverId} transitioning to HALF_OPEN`);
        }
      }
    }
    
    return server.health === 'healthy' ? server : null;
  }

  /**
   * Record server failure for circuit breaker
   */
  private recordServerFailure(serverId: string): void {
    const server = this.servers.get(serverId);
    if (server) {
      server.stats.errors++;
    }
    
    if (!this.config.loadBalancing.circuitBreaker.enabled) return;
    
    const cbState = this.circuitBreakerStates.get(serverId);
    if (!cbState) return;
    
    cbState.failures++;
    cbState.lastFailure = Date.now();
    
    if (cbState.failures >= this.config.loadBalancing.circuitBreaker.failureThreshold) {
      cbState.state = 'OPEN';
      cbState.nextAttempt = Date.now() + this.config.loadBalancing.circuitBreaker.recoveryTimeout;
      
      console.log(`⚠️  Circuit breaker OPENED for server ${serverId}`);
      this.emit('circuitBreakerOpened', { serverId });
    }
  }

  /**
   * Record server success for circuit breaker
   */
  private recordServerSuccess(serverId: string): void {
    const cbState = this.circuitBreakerStates.get(serverId);
    if (!cbState) return;
    
    if (cbState.state === 'HALF_OPEN' || cbState.state === 'OPEN') {
      cbState.state = 'CLOSED';
      cbState.failures = 0;
      
      console.log(`✅ Circuit breaker CLOSED for server ${serverId}`);
      this.emit('circuitBreakerClosed', { serverId });
    }
  }

  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    const interval = this.config.loadBalancing.healthCheckInterval || 30000;
    
    this.healthCheckInterval = setInterval(() => {
      this.performHealthChecks();
    }, interval);
    
    console.log(`💚 Health monitoring started (interval: ${interval}ms)`);
  }

  /**
   * Perform health checks on all servers
   */
  private async performHealthChecks(): Promise<void> {
    const servers = Array.from(this.servers.values())
      .filter(server => server.enabled && server.status === 'running');
    
    for (const server of servers) {
      try {
        const isHealthy = await this.checkServerHealth(server);
        const wasHealthy = server.health === 'healthy';
        
        server.health = isHealthy ? 'healthy' : 'unhealthy';
        server.lastHealthCheck = Date.now();
        
        if (isHealthy && !wasHealthy) {
          console.log(`💚 Server ${server.id} is now healthy`);
          this.recordServerSuccess(server.id);
          this.emit('serverHealthy', { serverId: server.id });
        } else if (!isHealthy && wasHealthy) {
          console.log(`💔 Server ${server.id} is now unhealthy`);
          this.recordServerFailure(server.id);
          this.emit('serverUnhealthy', { serverId: server.id });
        }
        
      } catch (error) {
        console.error(`❌ Health check failed for server ${server.id}:`, error);
        server.health = 'unhealthy';
        this.recordServerFailure(server.id);
      }
    }
  }

  /**
   * Check individual server health
   */
  private async checkServerHealth(server: BrowserServer): Promise<boolean> {
    // For now, just check if process is running
    // In real implementation, you would make actual health check requests
    return server.process !== undefined && !server.process.killed;
  }

  /**
   * Get load balancer statistics
   */
  getStats(): LoadBalancerStats {
    const servers = Array.from(this.servers.values());
    const activeServers = servers.filter(s => s.status === 'running').length;
    const healthyServers = servers.filter(s => s.health === 'healthy').length;
    const totalRequests = servers.reduce((sum, s) => sum + s.stats.requests, 0);
    const avgResponseTime = servers.reduce((sum, s) => sum + s.stats.avgResponseTime, 0) / servers.length;
    
    return {
      strategy: this.config.loadBalancing.strategy,
      totalRequests,
      activeServers,
      healthyServers,
      averageResponseTime: avgResponseTime || 0
    };
  }

  /**
   * Get server status
   */
  getServerStatus(serverId: string): BrowserServer | null {
    return this.servers.get(serverId) || null;
  }

  /**
   * Get all servers status
   */
  getAllServersStatus(): BrowserServer[] {
    return Array.from(this.servers.values());
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  /**
   * Parse boolean from string or boolean
   */
  private parseBoolean(value: any): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      const resolved = this.resolveEnvironmentVariables(value);
      return resolved.toLowerCase() === 'true';
    }
    return false;
  }

  /**
   * Resolve environment variables in strings
   */
  private resolveEnvironmentVariables(value: string): string {
    return value.replace(/\${([^}]+)}/g, (match, varName) => {
      return process.env[varName] || match;
    });
  }
}

// =============================================================================
// CLI INTERFACE
// =============================================================================

async function main() {
  const manager = new UnifiedBrowserManager();
  
  // Handle process signals
  process.on('SIGINT', async () => {
    console.log('\n🔄 Received SIGINT, shutting down...');
    await manager.stopAll();
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    console.log('\n🔄 Received SIGTERM, shutting down...');
    await manager.stopAll();
    process.exit(0);
  });
  
  try {
    await manager.startAll();
    
    // Keep the process running
    console.log('🎯 Unified Browser Manager is running. Press Ctrl+C to stop.');
    
  } catch (error) {
    console.error('❌ Failed to start unified browser manager:', error);
    process.exit(1);
  }
}

// Run if this is the main module
if (require.main === module) {
  main().catch(console.error);
}

export default UnifiedBrowserManager;