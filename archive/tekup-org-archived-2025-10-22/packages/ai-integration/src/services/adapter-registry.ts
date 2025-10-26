import { AIServiceCategory } from '@tekup/sso';
import { createLogger } from '@tekup/shared';
import {
  IAIServiceAdapter,
  AdapterRegistry,
  ServiceHealth,
  ServiceMetrics
} from '../types/integration.types.js';

/**
 * Central registry for managing AI service adapters
 * Provides unified access to all integrated AI services
 */
export class TekUpAdapterRegistry implements AdapterRegistry {
  private readonly logger = createLogger('adapter-registry');
  private adapters = new Map<AIServiceCategory, IAIServiceAdapter>();
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private readonly healthCheckIntervalMs = 30000; // 30 seconds

  constructor() {
    this.logger.info('Initializing TekUp Adapter Registry');
    this.startHealthMonitoring();
  }

  /**
   * Register an AI service adapter
   */
  register(adapter: IAIServiceAdapter): void {
    const serviceCategory = adapter.config.serviceCategory;
    
    if (this.adapters.has(serviceCategory)) {
      this.logger.warn(`Adapter for ${serviceCategory} already registered, replacing`);
    }

    this.adapters.set(serviceCategory, adapter);
    
    this.logger.info(`Registered adapter for ${serviceCategory}`, {
      serviceName: adapter.config.serviceName,
      version: adapter.config.version,
      enabled: adapter.config.enabled
    });
  }

  /**
   * Unregister an AI service adapter
   */
  unregister(serviceCategory: AIServiceCategory): void {
    const adapter = this.adapters.get(serviceCategory);
    
    if (adapter) {
      // Stop the adapter before unregistering
      adapter.stop().catch(error => {
        this.logger.error(`Error stopping adapter ${serviceCategory}:`, error);
      });
      
      this.adapters.delete(serviceCategory);
      this.logger.info(`Unregistered adapter for ${serviceCategory}`);
    } else {
      this.logger.warn(`No adapter found for ${serviceCategory} to unregister`);
    }
  }

  /**
   * Get specific adapter by service category
   */
  get(serviceCategory: AIServiceCategory): IAIServiceAdapter | undefined {
    return this.adapters.get(serviceCategory);
  }

  /**
   * Get all registered adapters
   */
  getAll(): IAIServiceAdapter[] {
    return Array.from(this.adapters.values());
  }

  /**
   * Check if all adapters are healthy
   */
  isHealthy(): boolean {
    const adapters = this.getAll();
    
    if (adapters.length === 0) {
      this.logger.warn('No adapters registered');
      return false;
    }

    return adapters.every(adapter => {
      const health = adapter.health;
      return health.status === 'healthy';
    });
  }

  /**
   * Get enabled adapters only
   */
  getEnabledAdapters(): IAIServiceAdapter[] {
    return this.getAll().filter(adapter => adapter.config.enabled);
  }

  /**
   * Get unhealthy adapters
   */
  getUnhealthyAdapters(): Array<{ category: AIServiceCategory; adapter: IAIServiceAdapter; health: ServiceHealth }> {
    return this.getAll()
      .map(adapter => ({
        category: adapter.config.serviceCategory,
        adapter,
        health: adapter.health
      }))
      .filter(item => item.health.status !== 'healthy');
  }

  /**
   * Initialize all registered adapters
   */
  async initializeAll(): Promise<void> {
    const adapters = this.getEnabledAdapters();
    
    this.logger.info(`Initializing ${adapters.length} adapters`);
    
    const initPromises = adapters.map(async (adapter) => {
      try {
        await adapter.initialize();
        this.logger.info(`Initialized ${adapter.config.serviceName}`);
      } catch (error) {
        this.logger.error(`Failed to initialize ${adapter.config.serviceName}:`, error);
        throw error;
      }
    });

    await Promise.all(initPromises);
    this.logger.info('All adapters initialized successfully');
  }

  /**
   * Start all registered adapters
   */
  async startAll(): Promise<void> {
    const adapters = this.getEnabledAdapters();
    
    this.logger.info(`Starting ${adapters.length} adapters`);
    
    const startPromises = adapters.map(async (adapter) => {
      try {
        await adapter.start();
        this.logger.info(`Started ${adapter.config.serviceName}`);
      } catch (error) {
        this.logger.error(`Failed to start ${adapter.config.serviceName}:`, error);
        throw error;
      }
    });

    await Promise.all(startPromises);
    this.logger.info('All adapters started successfully');
  }

  /**
   * Stop all registered adapters
   */
  async stopAll(): Promise<void> {
    const adapters = this.getAll();
    
    this.logger.info(`Stopping ${adapters.length} adapters`);
    
    const stopPromises = adapters.map(async (adapter) => {
      try {
        await adapter.stop();
        this.logger.info(`Stopped ${adapter.config.serviceName}`);
      } catch (error) {
        this.logger.error(`Failed to stop ${adapter.config.serviceName}:`, error);
      }
    });

    await Promise.allSettled(stopPromises);
    this.stopHealthMonitoring();
    this.logger.info('All adapters stopped');
  }

  /**
   * Restart all adapters
   */
  async restartAll(): Promise<void> {
    await this.stopAll();
    await this.startAll();
  }

  /**
   * Restart specific adapter
   */
  async restartAdapter(serviceCategory: AIServiceCategory): Promise<void> {
    const adapter = this.get(serviceCategory);
    
    if (!adapter) {
      throw new Error(`No adapter found for ${serviceCategory}`);
    }

    this.logger.info(`Restarting adapter for ${serviceCategory}`);
    await adapter.restart();
    this.logger.info(`Restarted adapter for ${serviceCategory}`);
  }

  /**
   * Get comprehensive health status for all adapters
   */
  async getHealthStatus(): Promise<{
    overall: 'healthy' | 'degraded' | 'unhealthy';
    totalAdapters: number;
    healthyAdapters: number;
    degradedAdapters: number;
    unhealthyAdapters: number;
    adapters: Array<{
      category: AIServiceCategory;
      serviceName: string;
      health: ServiceHealth;
    }>;
  }> {
    const adapters = this.getAll();
    const healthChecks = await Promise.all(
      adapters.map(async (adapter) => ({
        category: adapter.config.serviceCategory,
        serviceName: adapter.config.serviceName,
        health: await adapter.checkHealth()
      }))
    );

    const healthyCount = healthChecks.filter(hc => hc.health.status === 'healthy').length;
    const degradedCount = healthChecks.filter(hc => hc.health.status === 'degraded').length;
    const unhealthyCount = healthChecks.filter(hc => hc.health.status === 'unhealthy').length;

    let overall: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (unhealthyCount > 0) {
      overall = 'unhealthy';
    } else if (degradedCount > 0) {
      overall = 'degraded';
    }

    return {
      overall,
      totalAdapters: adapters.length,
      healthyAdapters: healthyCount,
      degradedAdapters: degradedCount,
      unhealthyAdapters: unhealthyCount,
      adapters: healthChecks
    };
  }

  /**
   * Get aggregated metrics from all adapters
   */
  async getAggregatedMetrics(): Promise<{
    totalRequests: number;
    totalSuccessful: number;
    totalFailed: number;
    averageResponseTime: number;
    totalTokensUsed: number;
    totalAICost: number;
    adapters: Array<{
      category: AIServiceCategory;
      serviceName: string;
      metrics: ServiceMetrics;
    }>;
  }> {
    const adapters = this.getAll();
    const metricsData = await Promise.all(
      adapters.map(async (adapter) => ({
        category: adapter.config.serviceCategory,
        serviceName: adapter.config.serviceName,
        metrics: await adapter.getMetrics()
      }))
    );

    // Aggregate metrics
    const totals = metricsData.reduce(
      (acc, item) => {
        acc.totalRequests += item.metrics.requests.total;
        acc.totalSuccessful += item.metrics.requests.successful;
        acc.totalFailed += item.metrics.requests.failed;
        acc.totalResponseTime += item.metrics.performance.averageResponseTime;
        acc.totalTokensUsed += item.metrics.ai.tokensUsed;
        acc.totalAICost += item.metrics.ai.aiCost;
        return acc;
      },
      {
        totalRequests: 0,
        totalSuccessful: 0,
        totalFailed: 0,
        totalResponseTime: 0,
        totalTokensUsed: 0,
        totalAICost: 0
      }
    );

    return {
      ...totals,
      averageResponseTime: adapters.length > 0 ? totals.totalResponseTime / adapters.length : 0,
      adapters: metricsData
    };
  }

  /**
   * Get adapter capabilities summary
   */
  getCapabilitiesSummary(): {
    totalServices: number;
    totalEndpoints: number;
    totalFeatures: number;
    supportedFormats: string[];
    services: Array<{
      category: AIServiceCategory;
      serviceName: string;
      endpoints: string[];
      features: string[];
    }>;
  } {
    const adapters = this.getAll();
    const services = adapters.map(adapter => {
      const capabilities = adapter.getCapabilities();
      return {
        category: adapter.config.serviceCategory,
        serviceName: adapter.config.serviceName,
        endpoints: capabilities.endpoints,
        features: capabilities.features
      };
    });

    const allFormats = new Set<string>();
    let totalEndpoints = 0;
    let totalFeatures = 0;

    adapters.forEach(adapter => {
      const capabilities = adapter.getCapabilities();
      totalEndpoints += capabilities.endpoints.length;
      totalFeatures += capabilities.features.length;
      capabilities.supportedFormats.forEach(format => allFormats.add(format));
    });

    return {
      totalServices: adapters.length,
      totalEndpoints,
      totalFeatures,
      supportedFormats: Array.from(allFormats),
      services
    };
  }

  /**
   * Find adapters by capability
   */
  findAdaptersByCapability(capability: string): IAIServiceAdapter[] {
    return this.getAll().filter(adapter => {
      const capabilities = adapter.getCapabilities();
      return capabilities.features.includes(capability) ||
             capabilities.endpoints.some(endpoint => endpoint.includes(capability));
    });
  }

  /**
   * Get adapter by service name
   */
  getByServiceName(serviceName: string): IAIServiceAdapter | undefined {
    return this.getAll().find(adapter => adapter.config.serviceName === serviceName);
  }

  /**
   * Check if service category is supported
   */
  isServiceSupported(serviceCategory: AIServiceCategory): boolean {
    return this.adapters.has(serviceCategory);
  }

  /**
   * Get available service categories
   */
  getAvailableServices(): AIServiceCategory[] {
    return Array.from(this.adapters.keys());
  }

  /**
   * Start health monitoring for all adapters
   */
  private startHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      return; // Already running
    }

    this.healthCheckInterval = setInterval(async () => {
      try {
        const unhealthyAdapters = this.getUnhealthyAdapters();
        
        if (unhealthyAdapters.length > 0) {
          this.logger.warn(`Found ${unhealthyAdapters.length} unhealthy adapters:`, 
            unhealthyAdapters.map(item => ({
              service: item.category,
              status: item.health.status,
              errorRate: item.health.errorRate
            }))
          );

          // Optionally attempt to restart severely unhealthy adapters
          for (const item of unhealthyAdapters) {
            if (item.health.status === 'unhealthy' && item.health.errorRate > 0.8) {
              this.logger.info(`Attempting to restart unhealthy adapter: ${item.category}`);
              try {
                await this.restartAdapter(item.category);
              } catch (error) {
                this.logger.error(`Failed to restart adapter ${item.category}:`, error);
              }
            }
          }
        }
      } catch (error) {
        this.logger.error('Health monitoring error:', error);
      }
    }, this.healthCheckIntervalMs);

    this.logger.info(`Started health monitoring (interval: ${this.healthCheckIntervalMs}ms)`);
  }

  /**
   * Stop health monitoring
   */
  private stopHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
      this.logger.info('Stopped health monitoring');
    }
  }

  /**
   * Get registry statistics
   */
  getStatistics(): {
    totalAdapters: number;
    enabledAdapters: number;
    runningAdapters: number;
    healthyAdapters: number;
    registeredServices: AIServiceCategory[];
    uptime: number;
  } {
    const adapters = this.getAll();
    const enabledAdapters = this.getEnabledAdapters();
    const healthyAdapters = adapters.filter(adapter => adapter.health.status === 'healthy');
    
    return {
      totalAdapters: adapters.length,
      enabledAdapters: enabledAdapters.length,
      runningAdapters: adapters.filter(adapter => adapter.health.status !== 'unhealthy').length,
      healthyAdapters: healthyAdapters.length,
      registeredServices: Array.from(this.adapters.keys()),
      uptime: process.uptime()
    };
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    this.logger.info('Shutting down adapter registry');
    await this.stopAll();
    this.adapters.clear();
    this.logger.info('Adapter registry shutdown complete');
  }
}

