/**
 * @fileoverview MCP Service Discovery System
 * 
 * Manages dynamic service registration, health checking, and load balancing
 * for containerized MCP services with automatic failover capabilities.
 */

import { EventEmitter } from 'events';
import axios, { AxiosInstance } from 'axios';
import { MCPLogger } from './logger.js';

// =============================================================================
// INTERFACES
// =============================================================================

export interface ServiceConfig {
  id: string;
  name: string;
  url: string;
  port: number;
  healthy: boolean;
  lastHealthCheck: Date;
  capabilities: string[];
  metadata: Record<string, any>;
  priority: number;
}

export interface ServiceRegistry {
  [serviceId: string]: ServiceConfig;
}

export interface HealthCheckResult {
  healthy: boolean;
  responseTime: number;
  error?: string;
  metadata?: Record<string, any>;
}

// =============================================================================
// SERVICE DISCOVERY CLASS
// =============================================================================

export class MCPServiceDiscovery extends EventEmitter {
  private services: Map<string, ServiceConfig> = new Map();
  private httpClient: AxiosInstance;
  private healthCheckInterval?: NodeJS.Timeout;
  private config: any;
  private logger: MCPLogger;
  
  constructor(config: any, logger: MCPLogger) {
    super();
    this.config = config;
    this.logger = logger;
    
    // Configure HTTP client with timeouts
    this.httpClient = axios.create({
      timeout: 5000,
      headers: {
        'User-Agent': 'MCP-Gateway-ServiceDiscovery/1.0.0'
      }
    });
  }
  
  /**
   * Initialize service discovery with configuration
   */
  async initialize(): Promise<void> {
    try {
      // Register services from configuration
      await this.registerServicesFromConfig();
      
      // Start health monitoring
      this.startHealthChecking();
      
      this.logger.info('Service discovery initialized', {
        serviceCount: this.services.size
      });
    } catch (error) {
      this.logger.error('Failed to initialize service discovery', error);
      throw error;
    }
  }
  
  /**
   * Register services from configuration
   */
  private async registerServicesFromConfig(): Promise<void> {
    if (!this.config.mcpServers) {
      this.logger.warn('No MCP servers configured');
      return;
    }
    
    for (const [serviceId, serviceConfig] of Object.entries(this.config.mcpServers)) {
      try {
        await this.registerService({
          id: serviceId,
          name: serviceConfig.name || serviceId,
          url: this.getServiceUrl(serviceId),
          port: this.getServicePort(serviceId),
          healthy: false, // Will be determined by health check
          lastHealthCheck: new Date(0),
          capabilities: this.extractCapabilities(serviceConfig),
          metadata: {
            version: serviceConfig.version || '1.0.0',
            transport: serviceConfig.transport?.type || 'http',
            config: serviceConfig.config || {}
          },
          priority: serviceConfig.priority || 1
        });
        
        this.logger.info('Service registered', { serviceId, url: this.getServiceUrl(serviceId) });
      } catch (error) {
        this.logger.error('Failed to register service', { serviceId, error: error.message });
      }
    }
  }
  
  /**
   * Get service URL from environment or configuration
   */
  private getServiceUrl(serviceId: string): string {
    const envKey = `MCP_SERVICES_${serviceId.toUpperCase()}_URL`;
    const envUrl = process.env[envKey];
    
    if (envUrl) {
      return envUrl;
    }
    
    // Fallback to container name with default port
    const port = this.getServicePort(serviceId);
    return `http://mcp-${serviceId}:${port}`;
  }
  
  /**
   * Get service port based on service ID
   */
  private getServicePort(serviceId: string): number {
    const portMap: Record<string, number> = {
      'browser': 3001,
      'filesystem': 3002,
      'search': 3003
    };
    
    return portMap[serviceId] || 3000;
  }
  
  /**
   * Extract capabilities from service configuration
   */
  private extractCapabilities(serviceConfig: any): string[] {
    const capabilities: string[] = [];
    
    if (serviceConfig.capabilities) {
      if (serviceConfig.capabilities.tools?.length > 0) {
        capabilities.push('tools');
      }
      if (serviceConfig.capabilities.resources?.length > 0) {
        capabilities.push('resources');
      }
      if (serviceConfig.capabilities.prompts?.length > 0) {
        capabilities.push('prompts');
      }
      if (serviceConfig.capabilities.sampling) {
        capabilities.push('sampling');
      }
    }
    
    return capabilities;
  }
  
  /**
   * Register a new service
   */
  async registerService(serviceConfig: ServiceConfig): Promise<void> {
    this.services.set(serviceConfig.id, serviceConfig);
    
    // Perform initial health check
    const healthResult = await this.performHealthCheck(serviceConfig);
    serviceConfig.healthy = healthResult.healthy;
    serviceConfig.lastHealthCheck = new Date();
    
    this.emit('serviceRegistered', {
      serviceId: serviceConfig.id,
      config: serviceConfig,
      healthy: healthResult.healthy
    });
    
    this.logger.info('Service registered successfully', {
      serviceId: serviceConfig.id,
      url: serviceConfig.url,
      healthy: healthResult.healthy
    });
  }
  
  /**
   * Unregister a service
   */
  async unregisterService(serviceId: string): Promise<void> {
    const service = this.services.get(serviceId);
    if (!service) {
      this.logger.warn('Attempted to unregister unknown service', { serviceId });
      return;
    }
    
    this.services.delete(serviceId);
    
    this.emit('serviceUnregistered', {
      serviceId,
      config: service
    });
    
    this.logger.info('Service unregistered', { serviceId });
  }
  
  /**
   * Get all registered services
   */
  getServices(): Map<string, ServiceConfig> {
    return new Map(this.services);
  }
  
  /**
   * Get a specific service by ID
   */
  getService(serviceId: string): ServiceConfig | undefined {
    return this.services.get(serviceId);
  }
  
  /**
   * Check if a service exists
   */
  hasService(serviceId: string): boolean {
    return this.services.has(serviceId);
  }
  
  /**
   * Get healthy services only
   */
  getHealthyServices(): Map<string, ServiceConfig> {
    const healthyServices = new Map<string, ServiceConfig>();
    
    for (const [serviceId, service] of this.services) {
      if (service.healthy) {
        healthyServices.set(serviceId, service);
      }
    }
    
    return healthyServices;
  }
  
  /**
   * Get services by capability
   */
  getServicesByCapability(capability: string): ServiceConfig[] {
    const matchingServices: ServiceConfig[] = [];
    
    for (const service of this.services.values()) {
      if (service.healthy && service.capabilities.includes(capability)) {
        matchingServices.push(service);
      }
    }
    
    // Sort by priority (higher priority first)
    return matchingServices.sort((a, b) => b.priority - a.priority);
  }
  
  /**
   * Start health checking for all services
   */
  private startHealthChecking(): void {
    const healthCheckIntervalMs = this.config.global?.monitoring?.healthCheckInterval || 30000;
    
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthChecksForAllServices();
    }, healthCheckIntervalMs);
    
    this.logger.info('Health checking started', {
      intervalMs: healthCheckIntervalMs,
      serviceCount: this.services.size
    });
  }
  
  /**
   * Stop health checking
   */
  private stopHealthChecking(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
      this.logger.info('Health checking stopped');
    }
  }
  
  /**
   * Perform health checks for all registered services
   */
  private async performHealthChecksForAllServices(): Promise<void> {
    const healthCheckPromises = Array.from(this.services.values()).map(service =>
      this.performHealthCheck(service).then(result => ({
        service,
        result
      }))
    );
    
    const results = await Promise.allSettled(healthCheckPromises);
    
    for (const result of results) {
      if (result.status === 'fulfilled') {
        const { service, result: healthResult } = result.value;
        const wasHealthy = service.healthy;
        
        service.healthy = healthResult.healthy;
        service.lastHealthCheck = new Date();
        
        // Emit events on health status changes
        if (wasHealthy && !healthResult.healthy) {
          this.emit('serviceUnhealthy', {
            serviceId: service.id,
            service,
            error: healthResult.error
          });
          this.logger.warn('Service became unhealthy', {
            serviceId: service.id,
            error: healthResult.error
          });
        } else if (!wasHealthy && healthResult.healthy) {
          this.emit('serviceHealthy', {
            serviceId: service.id,
            service
          });
          this.logger.info('Service became healthy', {
            serviceId: service.id
          });
        }
      } else {
        this.logger.error('Health check failed', {
          error: result.reason
        });
      }
    }
  }
  
  /**
   * Perform health check for a specific service
   */
  async performHealthCheck(service: ServiceConfig): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      const response = await this.httpClient.get(`${service.url}/health`, {
        timeout: 5000,
        validateStatus: (status) => status === 200
      });
      
      const responseTime = Date.now() - startTime;
      
      return {
        healthy: true,
        responseTime,
        metadata: response.data
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error.response?.statusText || error.message || 'Unknown error';
      
      return {
        healthy: false,
        responseTime,
        error: errorMessage
      };
    }
  }
  
  /**
   * Update service configuration
   */
  async updateConfiguration(newConfig: any): Promise<void> {
    this.config = newConfig;
    
    // Clear existing services
    this.services.clear();
    
    // Re-register services with new configuration
    await this.registerServicesFromConfig();
    
    this.emit('configurationUpdated', {
      serviceCount: this.services.size
    });
    
    this.logger.info('Service discovery configuration updated', {
      serviceCount: this.services.size
    });
  }
  
  /**
   * Get service discovery statistics
   */
  getStatistics(): Record<string, any> {
    const services = Array.from(this.services.values());
    const healthyCount = services.filter(s => s.healthy).length;
    const unhealthyCount = services.length - healthyCount;
    
    const capabilityStats: Record<string, number> = {};
    services.forEach(service => {
      service.capabilities.forEach(capability => {
        capabilityStats[capability] = (capabilityStats[capability] || 0) + 1;
      });
    });
    
    return {
      totalServices: services.length,
      healthyServices: healthyCount,
      unhealthyServices: unhealthyCount,
      capabilities: capabilityStats,
      lastUpdate: new Date().toISOString()
    };
  }
  
  /**
   * Find best service for a given capability with load balancing
   */
  findBestService(capability: string, excludeServices: string[] = []): ServiceConfig | null {
    const candidates = this.getServicesByCapability(capability)
      .filter(service => !excludeServices.includes(service.id));
    
    if (candidates.length === 0) {
      return null;
    }
    
    // Simple round-robin load balancing based on current time
    const index = Date.now() % candidates.length;
    return candidates[index];
  }
  
  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    this.stopHealthChecking();
    this.services.clear();
    this.removeAllListeners();
    
    this.logger.info('Service discovery cleanup completed');
  }
}

export default MCPServiceDiscovery;
