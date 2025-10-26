import { createLogger } from './simple-logger.js';
import { 
  ExternalService, 
  ExternalServiceSchema,
  ServiceRegistryConfig,
  ServiceRegistryConfigSchema,
  ServiceHealth,
  ServiceHealthSchema,
  APIKeyRotationResult,
  ServiceOperationResult,
  ServiceStatus
} from './types.js';
import { HealthMonitor } from './health-monitor.js';
import { APIKeyManager } from './api-key-manager.js';
import { ServiceDashboard } from './dashboard.js';
import { IncidentResponseSystem } from './incident-response.js';
import * as crypto from 'crypto';

export class ServiceRegistry {
  private logger = createLogger('service-registry');
  private services = new Map<string, ExternalService>();
  private healthMonitor: HealthMonitor;
  private apiKeyManager: APIKeyManager;
  private config: ServiceRegistryConfig;
  private dashboard?: ServiceDashboard;
  private incidentResponse?: IncidentResponseSystem;

  constructor(config?: Partial<ServiceRegistryConfig>) {
    this.config = ServiceRegistryConfigSchema.parse(config || {});
    this.healthMonitor = new HealthMonitor(this);
    this.apiKeyManager = new APIKeyManager(this);
    
    // Load initial services
    this.config.services.forEach(service => {
      this.services.set(service.id, service);
    });

    this.logger.info(`Service registry initialized with ${this.services.size} services`);
  }

  /**
   * Register a new external service
   */
  async registerService(serviceConfig: Partial<ExternalService>): Promise<ServiceOperationResult> {
    const startTime = Date.now();
    
    try {
      const service = ExternalServiceSchema.parse({
        ...serviceConfig,
        id: serviceConfig.id || this.generateServiceId(serviceConfig.name || 'unknown'),
        updatedAt: new Date()
      });

      // Validate service doesn't already exist
      if (this.services.has(service.id)) {
        throw new Error(`Service with ID '${service.id}' already exists`);
      }

      // Store service
      this.services.set(service.id, service);
      
      // Start health monitoring if enabled
      if (service.healthCheck.enabled && this.config.monitoring.enabled) {
        await this.healthMonitor.startMonitoring(service.id);
      }

      this.logger.info(`Registered service: ${service.name} (${service.id})`);

      return {
        success: true,
        serviceId: service.id,
        operation: 'register',
        timestamp: new Date(),
        duration: Date.now() - startTime,
        metadata: { serviceName: service.name, serviceType: service.type }
      };
    } catch (error) {
      this.logger.error('Failed to register service:', error);
      return {
        success: false,
        serviceId: serviceConfig.id || 'unknown',
        operation: 'register',
        timestamp: new Date(),
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {}
      };
    }
  }

  /**
   * Update an existing service configuration
   */
  async updateService(serviceId: string, updates: Partial<ExternalService>): Promise<ServiceOperationResult> {
    const startTime = Date.now();
    
    try {
      const existingService = this.services.get(serviceId);
      if (!existingService) {
        throw new Error(`Service with ID '${serviceId}' not found`);
      }

      const updatedService = ExternalServiceSchema.parse({
        ...existingService,
        ...updates,
        id: serviceId, // Ensure ID doesn't change
        updatedAt: new Date()
      });

      this.services.set(serviceId, updatedService);
      
      // Restart health monitoring if configuration changed
      if (updates.healthCheck && this.config.monitoring.enabled) {
        await this.healthMonitor.restartMonitoring(serviceId);
      }

      this.logger.info(`Updated service: ${updatedService.name} (${serviceId})`);

      return {
        success: true,
        serviceId,
        operation: 'update',
        timestamp: new Date(),
        duration: Date.now() - startTime,
        metadata: { updatedFields: Object.keys(updates) }
      };
    } catch (error) {
      this.logger.error(`Failed to update service ${serviceId}:`, error);
      return {
        success: false,
        serviceId,
        operation: 'update',
        timestamp: new Date(),
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {}
      };
    }
  }

  /**
   * Remove a service from the registry
   */
  async removeService(serviceId: string): Promise<ServiceOperationResult> {
    const startTime = Date.now();
    
    try {
      const service = this.services.get(serviceId);
      if (!service) {
        throw new Error(`Service with ID '${serviceId}' not found`);
      }

      // Stop health monitoring
      await this.healthMonitor.stopMonitoring(serviceId);
      
      // Remove from registry
      this.services.delete(serviceId);

      this.logger.info(`Removed service: ${service.name} (${serviceId})`);

      return {
        success: true,
        serviceId,
        operation: 'remove',
        timestamp: new Date(),
        duration: Date.now() - startTime,
        metadata: { serviceName: service.name }
      };
    } catch (error) {
      this.logger.error(`Failed to remove service ${serviceId}:`, error);
      return {
        success: false,
        serviceId,
        operation: 'remove',
        timestamp: new Date(),
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {}
      };
    }
  }

  /**
   * Get a service by ID
   */
  getService(serviceId: string): ExternalService | undefined {
    return this.services.get(serviceId);
  }

  /**
   * Get all services, optionally filtered by type or status
   */
  getServices(filters?: {
    type?: string;
    status?: ServiceStatus;
    enabled?: boolean;
    environment?: string;
  }): ExternalService[] {
    let services = Array.from(this.services.values());

    if (filters) {
      if (filters.type) {
        services = services.filter(s => s.type === filters.type);
      }
      if (filters.enabled !== undefined) {
        services = services.filter(s => s.enabled === filters.enabled);
      }
      if (filters.environment) {
        services = services.filter(s => s.environment === filters.environment);
      }
    }

    return services;
  }

  /**
   * Get service health status
   */
  async getServiceHealth(serviceId: string): Promise<ServiceHealth | undefined> {
    return this.healthMonitor.getServiceHealth(serviceId);
  }

  /**
   * Get health status for all services
   */
  async getAllServiceHealth(): Promise<Map<string, ServiceHealth>> {
    return this.healthMonitor.getAllServiceHealth();
  }

  /**
   * Rotate API key for a service
   */
  async rotateAPIKey(serviceId: string, newApiKey?: string): Promise<APIKeyRotationResult> {
    return this.apiKeyManager.rotateAPIKey(serviceId, newApiKey);
  }

  /**
   * Test service connectivity
   */
  async testService(serviceId: string): Promise<ServiceOperationResult> {
    const startTime = Date.now();
    
    try {
      const service = this.services.get(serviceId);
      if (!service) {
        throw new Error(`Service with ID '${serviceId}' not found`);
      }

      const health = await this.healthMonitor.checkServiceHealth(serviceId);
      
      return {
        success: health.status === 'healthy',
        serviceId,
        operation: 'test',
        timestamp: new Date(),
        duration: Date.now() - startTime,
        metadata: { 
          status: health.status,
          responseTime: health.responseTimeMs,
          errorRate: health.errorRate
        }
      };
    } catch (error) {
      this.logger.error(`Failed to test service ${serviceId}:`, error);
      return {
        success: false,
        serviceId,
        operation: 'test',
        timestamp: new Date(),
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {}
      };
    }
  }

  /**
   * Enable or disable a service
   */
  async toggleService(serviceId: string, enabled: boolean): Promise<ServiceOperationResult> {
    return this.updateService(serviceId, { enabled });
  }

  /**
   * Get service configuration for external use (with masked API keys)
   */
  getServiceConfig(serviceId: string, maskSecrets = true): Partial<ExternalService> | undefined {
    const service = this.services.get(serviceId);
    if (!service) return undefined;

    if (maskSecrets) {
      return {
        ...service,
        apiKey: this.maskApiKey(service.apiKey)
      };
    }

    return service;
  }

  /**
   * Export all service configurations (with masked secrets)
   */
  exportConfig(maskSecrets = true): ServiceRegistryConfig {
    const services = Array.from(this.services.values()).map(service => {
      if (maskSecrets) {
        return {
          ...service,
          apiKey: this.maskApiKey(service.apiKey)
        };
      }
      return service;
    });

    return {
      ...this.config,
      services
    };
  }

  /**
   * Import service configurations
   */
  async importConfig(config: ServiceRegistryConfig): Promise<ServiceOperationResult[]> {
    const results: ServiceOperationResult[] = [];
    
    for (const serviceConfig of config.services) {
      const result = await this.registerService(serviceConfig);
      results.push(result);
    }

    return results;
  }

  /**
   * Start all monitoring services
   */
  async startMonitoring(): Promise<void> {
    if (!this.config.monitoring.enabled) {
      this.logger.info('Monitoring is disabled');
      return;
    }

    await this.healthMonitor.startAll();
    this.logger.info('Service monitoring started');
  }

  /**
   * Stop all monitoring services
   */
  async stopMonitoring(): Promise<void> {
    await this.healthMonitor.stopAll();
    this.logger.info('Service monitoring stopped');
  }

  /**
   * Get registry statistics
   */
  getStats(): {
    totalServices: number;
    enabledServices: number;
    servicesByType: Record<string, number>;
    servicesByStatus: Record<string, number>;
  } {
    const services = Array.from(this.services.values());
    const enabledServices = services.filter(s => s.enabled);
    
    const servicesByType = services.reduce((acc, service) => {
      acc[service.type] = (acc[service.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Note: Status would need to be fetched from health monitor
    const servicesByStatus = { healthy: 0, degraded: 0, down: 0, unknown: services.length };

    return {
      totalServices: services.length,
      enabledServices: enabledServices.length,
      servicesByType,
      servicesByStatus
    };
  }

  /**
   * Generate a unique service ID
   */
  private generateServiceId(name: string): string {
    const normalized = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const hash = crypto.createHash('md5').update(name + Date.now()).digest('hex').substring(0, 8);
    return `${normalized}-${hash}`;
  }

  /**
   * Start service dashboard
   */
  async startDashboard(port?: number): Promise<void> {
    if (!this.dashboard) {
      this.dashboard = new ServiceDashboard(this, { port });
    }
    await this.dashboard.start();
    this.logger.info(`Service dashboard started on port ${port || 3001}`);
  }

  /**
   * Stop service dashboard
   */
  async stopDashboard(): Promise<void> {
    if (this.dashboard) {
      await this.dashboard.stop();
      this.dashboard = undefined;
      this.logger.info('Service dashboard stopped');
    }
  }

  /**
   * Start incident response system
   */
  async startIncidentResponse(config?: any): Promise<void> {
    if (!this.incidentResponse) {
      this.incidentResponse = new IncidentResponseSystem(this, config);
    }
    await this.incidentResponse.start();
    this.logger.info('Incident response system started');
  }

  /**
   * Stop incident response system
   */
  async stopIncidentResponse(): Promise<void> {
    if (this.incidentResponse) {
      await this.incidentResponse.stop();
      this.incidentResponse = undefined;
      this.logger.info('Incident response system stopped');
    }
  }

  /**
   * Get incident response system
   */
  getIncidentResponse(): IncidentResponseSystem | undefined {
    return this.incidentResponse;
  }

  /**
   * Start all monitoring systems (health, dashboard, incidents)
   */
  async startAllMonitoring(options?: {
    dashboardPort?: number;
    incidentConfig?: any;
  }): Promise<void> {
    await this.startMonitoring(); // existing health monitoring
    await this.startDashboard(options?.dashboardPort);
    await this.startIncidentResponse(options?.incidentConfig);
    this.logger.info('All monitoring systems started');
  }

  /**
   * Stop all monitoring systems
   */
  async stopAllMonitoring(): Promise<void> {
    await this.stopMonitoring(); // existing health monitoring
    await this.stopDashboard();
    await this.stopIncidentResponse();
    this.logger.info('All monitoring systems stopped');
  }

  /**
   * Mask API key for display purposes
   */
  private maskApiKey(apiKey: string): string {
    if (apiKey.length <= 8) return '***';
    return apiKey.substring(0, 4) + '***' + apiKey.substring(apiKey.length - 4);
  }
}