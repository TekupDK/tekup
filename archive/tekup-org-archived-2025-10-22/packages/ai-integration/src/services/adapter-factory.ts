import { AIServiceCategory } from '@tekup/sso';
import { createLogger } from '@tekup/shared';
import {
  IAIServiceAdapter,
  AdapterFactory,
  AIServiceConfig
} from '../types/integration.types.js';

// Import all adapter implementations
import { ProposalEngineAdapter } from '../adapters/proposal-adapter.js';
import { ContentGeneratorAdapter } from '../adapters/content-adapter.js';
// Note: Other adapters would be imported here as they're implemented
// import { SupportAdapter } from '../adapters/support-adapter.js';
// import { CRMAdapter } from '../adapters/crm-adapter.js';
// import { MarketingAdapter } from '../adapters/marketing-adapter.js';
// import { ProjectAdapter } from '../adapters/project-adapter.js';
// import { AnalyticsAdapter } from '../adapters/analytics-adapter.js';
// import { VoiceAIAdapter } from '../adapters/voice-ai-adapter.js';
// import { BIAdapter } from '../adapters/bi-adapter.js';

/**
 * Factory for creating AI service adapters
 * Provides standardized creation and configuration of adapters
 */
export class TekUpAdapterFactory implements AdapterFactory {
  private readonly logger = createLogger('adapter-factory');

  /**
   * Create an adapter for the specified service category
   */
  createAdapter(serviceCategory: AIServiceCategory, config?: Partial<AIServiceConfig>): IAIServiceAdapter {
    this.logger.info(`Creating adapter for ${serviceCategory}`, { config });

    try {
      switch (serviceCategory) {
        case AIServiceCategory.PROPOSAL:
          return new ProposalEngineAdapter(config);
        
        case AIServiceCategory.CONTENT:
          return new ContentGeneratorAdapter(config);
        
        // case AIServiceCategory.SUPPORT:
        //   return new SupportAdapter(config);
        
        // case AIServiceCategory.CRM:
        //   return new CRMAdapter(config);
        
        // case AIServiceCategory.MARKETING:
        //   return new MarketingAdapter(config);
        
        // case AIServiceCategory.PROJECT:
        //   return new ProjectAdapter(config);
        
        // case AIServiceCategory.ANALYTICS:
        //   return new AnalyticsAdapter(config);
        
        // case AIServiceCategory.VOICE_AI:
        //   return new VoiceAIAdapter(config);
        
        // case AIServiceCategory.BUSINESS_INTELLIGENCE:
        //   return new BIAdapter(config);
        
        default:
          throw new Error(`Unsupported service category: ${serviceCategory}`);
      }
    } catch (error) {
      this.logger.error(`Failed to create adapter for ${serviceCategory}:`, error);
      throw error;
    }
  }

  /**
   * Get list of available adapter categories
   */
  getAvailableAdapters(): AIServiceCategory[] {
    return [
      AIServiceCategory.PROPOSAL,
      AIServiceCategory.CONTENT,
      // Add other categories as adapters are implemented
      // AIServiceCategory.SUPPORT,
      // AIServiceCategory.CRM,
      // AIServiceCategory.MARKETING,
      // AIServiceCategory.PROJECT,
      // AIServiceCategory.ANALYTICS,
      // AIServiceCategory.VOICE_AI,
      // AIServiceCategory.BUSINESS_INTELLIGENCE
    ];
  }

  /**
   * Validate adapter configuration
   */
  validateConfig(config: AIServiceConfig): boolean {
    try {
      // Basic validation
      if (!config.serviceName || !config.serviceCategory || !config.version) {
        this.logger.error('Missing required config fields', { config });
        return false;
      }

      // Service category validation
      if (!this.getAvailableAdapters().includes(config.serviceCategory)) {
        this.logger.error(`Unsupported service category: ${config.serviceCategory}`);
        return false;
      }

      // Database config validation
      if (!config.database?.connectionString && !process.env.DATABASE_URL) {
        this.logger.warn('No database connection string provided');
      }

      // AI provider validation
      if (!config.ai?.provider) {
        this.logger.error('AI provider not specified');
        return false;
      }

      // Limits validation
      if (config.limits) {
        if (config.limits.maxRequestsPerMinute <= 0 || 
            config.limits.maxRequestsPerDay <= 0 || 
            config.limits.maxTokensPerRequest <= 0) {
          this.logger.error('Invalid limits configuration');
          return false;
        }
      }

      return true;
    } catch (error) {
      this.logger.error('Config validation error:', error);
      return false;
    }
  }

  /**
   * Create multiple adapters from configuration array
   */
  createMultipleAdapters(configs: Array<{ category: AIServiceCategory; config?: Partial<AIServiceConfig> }>): IAIServiceAdapter[] {
    const adapters: IAIServiceAdapter[] = [];
    
    for (const { category, config } of configs) {
      try {
        const adapter = this.createAdapter(category, config);
        adapters.push(adapter);
        this.logger.info(`Created adapter for ${category}`);
      } catch (error) {
        this.logger.error(`Failed to create adapter for ${category}:`, error);
        // Continue creating other adapters even if one fails
      }
    }

    return adapters;
  }

  /**
   * Create all available adapters with default configurations
   */
  createAllAdapters(globalConfig?: Partial<AIServiceConfig>): IAIServiceAdapter[] {
    const configs = this.getAvailableAdapters().map(category => ({
      category,
      config: globalConfig
    }));

    return this.createMultipleAdapters(configs);
  }

  /**
   * Get default configuration for a service category
   */
  getDefaultConfig(serviceCategory: AIServiceCategory): Partial<AIServiceConfig> {
    const baseConfig: Partial<AIServiceConfig> = {
      enabled: true,
      database: {
        poolSize: 10,
        timeout: 30000
      },
      cache: {
        enabled: true,
        ttl: 3600
      },
      events: {
        enabled: true,
        publishEvents: [],
        subscribeEvents: []
      },
      ai: {
        provider: 'gemini',
        maxTokens: 4000,
        temperature: 0.3
      },
      limits: {
        maxRequestsPerMinute: 50,
        maxRequestsPerDay: 1000,
        maxTokensPerRequest: 4000
      }
    };

    // Service-specific defaults
    switch (serviceCategory) {
      case AIServiceCategory.PROPOSAL:
        return {
          ...baseConfig,
          ai: {
            ...baseConfig.ai,
            maxTokens: 8000,
            temperature: 0.3
          },
          limits: {
            ...baseConfig.limits,
            maxTokensPerRequest: 8000
          }
        };

      case AIServiceCategory.CONTENT:
        return {
          ...baseConfig,
          ai: {
            ...baseConfig.ai,
            temperature: 0.7 // Higher creativity for content
          },
          cache: {
            ...baseConfig.cache,
            ttl: 7200 // Longer cache for content
          }
        };

      case AIServiceCategory.SUPPORT:
        return {
          ...baseConfig,
          ai: {
            ...baseConfig.ai,
            temperature: 0.2 // Lower for more consistent responses
          },
          limits: {
            ...baseConfig.limits,
            maxRequestsPerMinute: 100 // Higher for support
          }
        };

      case AIServiceCategory.ANALYTICS:
        return {
          ...baseConfig,
          ai: {
            ...baseConfig.ai,
            temperature: 0.1 // Very low for analytical accuracy
          },
          cache: {
            ...baseConfig.cache,
            ttl: 1800 // Shorter cache for analytics
          }
        };

      default:
        return baseConfig;
    }
  }

  /**
   * Create adapter with enhanced configuration merging
   */
  createAdapterWithDefaults(
    serviceCategory: AIServiceCategory, 
    customConfig?: Partial<AIServiceConfig>
  ): IAIServiceAdapter {
    const defaultConfig = this.getDefaultConfig(serviceCategory);
    const mergedConfig = this.mergeConfigs(defaultConfig, customConfig);

    if (!this.validateConfig(mergedConfig as AIServiceConfig)) {
      throw new Error(`Invalid configuration for ${serviceCategory}`);
    }

    return this.createAdapter(serviceCategory, mergedConfig);
  }

  /**
   * Deep merge configuration objects
   */
  private mergeConfigs(
    defaultConfig: Partial<AIServiceConfig>, 
    customConfig?: Partial<AIServiceConfig>
  ): Partial<AIServiceConfig> {
    if (!customConfig) {
      return defaultConfig;
    }

    const merged = { ...defaultConfig };

    // Deep merge nested objects
    if (customConfig.database) {
      merged.database = { ...defaultConfig.database, ...customConfig.database };
    }

    if (customConfig.cache) {
      merged.cache = { ...defaultConfig.cache, ...customConfig.cache };
    }

    if (customConfig.events) {
      merged.events = { ...defaultConfig.events, ...customConfig.events };
    }

    if (customConfig.ai) {
      merged.ai = { ...defaultConfig.ai, ...customConfig.ai };
    }

    if (customConfig.limits) {
      merged.limits = { ...defaultConfig.limits, ...customConfig.limits };
    }

    // Override other properties
    Object.keys(customConfig).forEach(key => {
      if (!['database', 'cache', 'events', 'ai', 'limits'].includes(key)) {
        merged[key] = customConfig[key];
      }
    });

    return merged;
  }

  /**
   * Create adapters from environment configuration
   */
  createAdaptersFromEnv(): IAIServiceAdapter[] {
    const adapters: IAIServiceAdapter[] = [];
    const enabledServices = process.env.ENABLED_AI_SERVICES?.split(',') || [];

    for (const serviceStr of enabledServices) {
      const category = serviceStr.trim() as AIServiceCategory;
      
      if (this.getAvailableAdapters().includes(category)) {
        try {
          const envConfig = this.getEnvConfigForService(category);
          const adapter = this.createAdapterWithDefaults(category, envConfig);
          adapters.push(adapter);
          
          this.logger.info(`Created adapter for ${category} from environment config`);
        } catch (error) {
          this.logger.error(`Failed to create adapter for ${category} from env:`, error);
        }
      } else {
        this.logger.warn(`Skipping unsupported service category: ${category}`);
      }
    }

    return adapters;
  }

  /**
   * Get environment-specific configuration for a service
   */
  private getEnvConfigForService(category: AIServiceCategory): Partial<AIServiceConfig> {
    const prefix = category.toUpperCase().replace('-', '_');
    
    return {
      enabled: process.env[`${prefix}_ENABLED`] !== 'false',
      database: {
        connectionString: process.env[`${prefix}_DATABASE_URL`] || process.env.DATABASE_URL,
        poolSize: parseInt(process.env[`${prefix}_DB_POOL_SIZE`] || '10'),
        timeout: parseInt(process.env[`${prefix}_DB_TIMEOUT`] || '30000')
      },
      cache: {
        enabled: process.env[`${prefix}_CACHE_ENABLED`] !== 'false',
        ttl: parseInt(process.env[`${prefix}_CACHE_TTL`] || '3600'),
        keyPrefix: process.env[`${prefix}_CACHE_PREFIX`] || category
      },
      ai: {
        provider: (process.env[`${prefix}_AI_PROVIDER`] || process.env.AI_PROVIDER || 'gemini') as any,
        apiKey: process.env[`${prefix}_AI_API_KEY`] || process.env.AI_API_KEY,
        model: process.env[`${prefix}_AI_MODEL`],
        maxTokens: parseInt(process.env[`${prefix}_AI_MAX_TOKENS`] || '4000'),
        temperature: parseFloat(process.env[`${prefix}_AI_TEMPERATURE`] || '0.3')
      },
      limits: {
        maxRequestsPerMinute: parseInt(process.env[`${prefix}_MAX_REQUESTS_PER_MINUTE`] || '50'),
        maxRequestsPerDay: parseInt(process.env[`${prefix}_MAX_REQUESTS_PER_DAY`] || '1000'),
        maxTokensPerRequest: parseInt(process.env[`${prefix}_MAX_TOKENS_PER_REQUEST`] || '4000')
      }
    };
  }

  /**
   * Check if adapter is available for service category
   */
  isAdapterAvailable(serviceCategory: AIServiceCategory): boolean {
    return this.getAvailableAdapters().includes(serviceCategory);
  }

  /**
   * Get adapter implementation status
   */
  getImplementationStatus(): {
    implemented: AIServiceCategory[];
    pending: AIServiceCategory[];
    total: number;
    percentage: number;
  } {
    const allServices = Object.values(AIServiceCategory);
    const implemented = this.getAvailableAdapters();
    const pending = allServices.filter(service => !implemented.includes(service));

    return {
      implemented,
      pending,
      total: allServices.length,
      percentage: Math.round((implemented.length / allServices.length) * 100)
    };
  }
}

