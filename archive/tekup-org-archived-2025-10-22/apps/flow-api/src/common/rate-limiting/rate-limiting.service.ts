import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { StructuredLogger } from '../logging/structured-logger.service.js';
import { AsyncContextService } from '../logging/async-context.service.js';
import { MetricsService } from '../../metrics/metrics.service.js';
import { TooManyRequestsException } from '../exceptions/custom-exceptions.js';

// Import adaptive rate limiting types (avoid circular dependency)
export interface AdaptiveRateLimitingService {
  recordRequest(identifier: string, endpoint: string, responseTime: number, isError?: boolean, userAgent?: string, sourceIp?: string): Promise<void>;
  getAdaptiveRateLimit(identifier: string, endpoint: string, baseConfig: RateLimitConfig): Promise<RateLimitConfig>;
}

export interface RateLimitConfig {
  windowMs: number;          // Time window in milliseconds
  maxRequests: number;       // Maximum requests per window
  keyGenerator?: string;     // Redis key pattern
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  skipIf?: (key: string) => boolean;
  onLimitReached?: (key: string, limit: RateLimitInfo) => void;
}

export interface RateLimitInfo {
  totalRequests: number;
  remainingRequests: number;
  resetTime: Date;
  retryAfter: number;       // Seconds until reset
  windowMs: number;
  maxRequests: number;
  isLimited: boolean;
}

export interface TenantRateLimitConfig {
  tenantId: string;
  globalLimit: RateLimitConfig;
  endpointLimits: Record<string, RateLimitConfig>;
  apiKeyLimits: Record<string, RateLimitConfig>;
  customRules: RateLimitRule[];
}

export interface RateLimitRule {
  pattern: string;          // Endpoint pattern (e.g., '/api/leads/*')
  method?: string;          // HTTP method filter
  userAgent?: string;       // User agent pattern
  config: RateLimitConfig;
}

@Injectable()
export class RateLimitingService {
  private readonly logger = new Logger(RateLimitingService.name);
  private readonly redis: Redis;
  private readonly defaultConfig: RateLimitConfig;
  private readonly tenantConfigs = new Map<string, TenantRateLimitConfig>();

  constructor(
    private readonly configService: ConfigService,
    private readonly structuredLogger: StructuredLogger,
    private readonly contextService: AsyncContextService,
    private readonly metricsService: MetricsService
  ) {
    // Initialize Redis connection
    this.redis = new Redis({
      host: this.configService.get('REDIS_HOST', 'localhost'),
      port: this.configService.get('REDIS_PORT', 6379),
      password: this.configService.get('REDIS_PASSWORD'),
      db: this.configService.get('REDIS_RATE_LIMIT_DB', 2),
      keyPrefix: 'rate_limit:',
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
    });

    // Default rate limit configuration
    this.defaultConfig = {
      windowMs: 60000,        // 1 minute
      maxRequests: 100,       // 100 requests per minute
    };

    this.initializeDefaultConfigs();
  }

  private adaptiveService?: AdaptiveRateLimitingService;

  /**
   * Set the adaptive rate limiting service (to avoid circular dependency)
   */
  setAdaptiveService(adaptiveService: AdaptiveRateLimitingService): void {
    this.adaptiveService = adaptiveService;
  }

  /**
   * Check rate limit for a request
   */
  async checkRateLimit(
    tenantId: string,
    identifier: string,
    endpoint: string,
    method: string = 'GET',
    userAgent?: string,
    sourceIp?: string,
    responseTime?: number,
    isError?: boolean
  ): Promise<RateLimitInfo> {
    let config = this.getRateLimitConfig(tenantId, endpoint, method, userAgent);
    
    // Get adaptive rate limit if available
    if (this.adaptiveService) {
      try {
        config = await this.adaptiveService.getAdaptiveRateLimit(identifier, endpoint, config);
      } catch (error) {
        this.logger.error('Failed to get adaptive rate limit:', error);
      }
    }
    
    const key = this.generateKey(tenantId, identifier, endpoint, config);

    try {
      const rateLimitInfo = await this.performSlidingWindowCheck(key, config);
      
      // Record metrics
      this.metricsService.increment('rate_limit_checks_total', {
        tenant: tenantId,
        endpoint,
        method,
        result: rateLimitInfo.isLimited ? 'limited' : 'allowed',
      });

      if (rateLimitInfo.isLimited) {
        this.metricsService.increment('rate_limit_violations_total', {
          tenant: tenantId,
          endpoint,
          method,
        });

        this.structuredLogger.warn(
          'Rate limit exceeded',
          {
            ...this.contextService.toLogContext(),
            metadata: {
              tenantId,
              identifier,
              endpoint,
              method,
              limit: config.maxRequests,
              window: config.windowMs,
              currentCount: rateLimitInfo.totalRequests,
            },
          }
        );

        if (config.onLimitReached) {
          config.onLimitReached(key, rateLimitInfo);
        }
      } else {
        // Record successful request for adaptive analysis
        if (this.adaptiveService && responseTime !== undefined) {
          try {
            await this.adaptiveService.recordRequest(
              identifier,
              endpoint,
              responseTime,
              isError || false,
              userAgent,
              sourceIp
            );
          } catch (error) {
            this.logger.error('Failed to record request for adaptive analysis:', error);
          }
        }
      }

      return rateLimitInfo;
    } catch (error) {
      this.logger.error(`Rate limit check failed for ${key}:`, error);
      this.metricsService.increment('rate_limit_errors_total', {
        tenant: tenantId,
        endpoint,
        error: 'redis_error',
      });

      // Fail open - allow request if Redis is unavailable
      return {
        totalRequests: 0,
        remainingRequests: config.maxRequests,
        resetTime: new Date(Date.now() + config.windowMs),
        retryAfter: 0,
        windowMs: config.windowMs,
        maxRequests: config.maxRequests,
        isLimited: false,
      };
    }
  }

  /**
   * Enforce rate limit and throw exception if exceeded
   */
  async enforceRateLimit(
    tenantId: string,
    identifier: string,
    endpoint: string,
    method: string = 'GET',
    userAgent?: string
  ): Promise<RateLimitInfo> {
    const rateLimitInfo = await this.checkRateLimit(
      tenantId,
      identifier,
      endpoint,
      method,
      userAgent
    );

    if (rateLimitInfo.isLimited) {
      throw new TooManyRequestsException(
        'Rate limit exceeded',
        {
          limit: rateLimitInfo.maxRequests,
          window: rateLimitInfo.windowMs,
          retryAfter: rateLimitInfo.retryAfter,
          resetTime: rateLimitInfo.resetTime,
        }
      );
    }

    return rateLimitInfo;
  }

  /**
   * Configure rate limits for a tenant
   */
  setTenantConfig(config: TenantRateLimitConfig): void {
    this.tenantConfigs.set(config.tenantId, config);
    
    this.structuredLogger.log(
      `Rate limit configuration updated for tenant: ${config.tenantId}`,
      {
        ...this.contextService.toLogContext(),
        metadata: {
          tenantId: config.tenantId,
          endpointCount: Object.keys(config.endpointLimits).length,
          apiKeyCount: Object.keys(config.apiKeyLimits).length,
          customRuleCount: config.customRules.length,
        },
      }
    );
  }

  /**
   * Get current rate limit status
   */
  async getRateLimitStatus(
    tenantId: string,
    identifier: string,
    endpoint: string
  ): Promise<RateLimitInfo | null> {
    const config = this.getRateLimitConfig(tenantId, endpoint);
    const key = this.generateKey(tenantId, identifier, endpoint, config);

    try {
      return await this.getCurrentLimitInfo(key, config);
    } catch (error) {
      this.logger.error(`Failed to get rate limit status for ${key}:`, error);
      return null;
    }
  }

  /**
   * Reset rate limit for a specific key
   */
  async resetRateLimit(
    tenantId: string,
    identifier: string,
    endpoint: string
  ): Promise<boolean> {
    const config = this.getRateLimitConfig(tenantId, endpoint);
    const key = this.generateKey(tenantId, identifier, endpoint, config);

    try {
      await this.redis.del(key);
      
      this.structuredLogger.log(
        `Rate limit reset for key: ${key}`,
        {
          ...this.contextService.toLogContext(),
          metadata: { tenantId, identifier, endpoint },
        }
      );
      
      return true;
    } catch (error) {
      this.logger.error(`Failed to reset rate limit for ${key}:`, error);
      return false;
    }
  }

  /**
   * Get rate limit statistics for monitoring
   */
  async getRateLimitStats(tenantId: string): Promise<{
    activeKeys: number;
    totalViolations: number;
    configuredEndpoints: number;
  }> {
    try {
      const pattern = `rate_limit:${tenantId}:*`;
      const keys = await this.redis.keys(pattern);
      
      return {
        activeKeys: keys.length,
        totalViolations: 0, // This would need to be tracked separately
        configuredEndpoints: this.tenantConfigs.get(tenantId)?.endpointLimits 
          ? Object.keys(this.tenantConfigs.get(tenantId)!.endpointLimits).length 
          : 0,
      };
    } catch (error) {
      this.logger.error(`Failed to get rate limit stats for tenant ${tenantId}:`, error);
      return { activeKeys: 0, totalViolations: 0, configuredEndpoints: 0 };
    }
  }

  private async performSlidingWindowCheck(
    key: string,
    config: RateLimitConfig
  ): Promise<RateLimitInfo> {
    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Lua script for atomic sliding window operations
    const luaScript = `
      local key = KEYS[1]
      local window_start = tonumber(ARGV[1])
      local now = tonumber(ARGV[2])
      local max_requests = tonumber(ARGV[3])
      local window_ms = tonumber(ARGV[4])
      
      -- Remove expired entries
      redis.call('ZREMRANGEBYSCORE', key, 0, window_start)
      
      -- Count current requests in window
      local current_count = redis.call('ZCARD', key)
      
      -- Check if limit exceeded
      if current_count >= max_requests then
        local oldest_entry = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
        local reset_time = window_start + window_ms
        if #oldest_entry > 0 then
          reset_time = tonumber(oldest_entry[2]) + window_ms
        end
        
        return {current_count, 0, reset_time, 1}
      end
      
      -- Add current request
      redis.call('ZADD', key, now, now)
      redis.call('EXPIRE', key, math.ceil(window_ms / 1000))
      
      local remaining = max_requests - current_count - 1
      local reset_time = now + window_ms
      
      return {current_count + 1, remaining, reset_time, 0}
    `;

    const result = await this.redis.eval(
      luaScript,
      1,
      key,
      windowStart.toString(),
      now.toString(),
      config.maxRequests.toString(),
      config.windowMs.toString()
    ) as number[];

    const [totalRequests, remainingRequests, resetTime, isLimited] = result;

    return {
      totalRequests,
      remainingRequests,
      resetTime: new Date(resetTime),
      retryAfter: Math.ceil((resetTime - now) / 1000),
      windowMs: config.windowMs,
      maxRequests: config.maxRequests,
      isLimited: Boolean(isLimited),
    };
  }

  private async getCurrentLimitInfo(
    key: string,
    config: RateLimitConfig
  ): Promise<RateLimitInfo> {
    const now = Date.now();
    const windowStart = now - config.windowMs;

    await this.redis.zremrangebyscore(key, 0, windowStart);
    const currentCount = await this.redis.zcard(key);

    return {
      totalRequests: currentCount,
      remainingRequests: Math.max(0, config.maxRequests - currentCount),
      resetTime: new Date(now + config.windowMs),
      retryAfter: Math.ceil(config.windowMs / 1000),
      windowMs: config.windowMs,
      maxRequests: config.maxRequests,
      isLimited: currentCount >= config.maxRequests,
    };
  }

  private getRateLimitConfig(
    tenantId: string,
    endpoint: string,
    method: string = 'GET',
    userAgent?: string
  ): RateLimitConfig {
    const tenantConfig = this.tenantConfigs.get(tenantId);
    
    if (!tenantConfig) {
      return this.defaultConfig;
    }

    // Check custom rules first
    for (const rule of tenantConfig.customRules) {
      if (this.matchesRule(rule, endpoint, method, userAgent)) {
        return rule.config;
      }
    }

    // Check endpoint-specific limits
    const endpointKey = `${method}:${endpoint}`;
    if (tenantConfig.endpointLimits[endpointKey]) {
      return tenantConfig.endpointLimits[endpointKey];
    }

    // Use global tenant limit or default
    return tenantConfig.globalLimit || this.defaultConfig;
  }

  private matchesRule(
    rule: RateLimitRule,
    endpoint: string,
    method: string,
    userAgent?: string
  ): boolean {
    // Simple pattern matching (could be enhanced with regex)
    const patternMatch = endpoint.includes(rule.pattern.replace('*', ''));
    const methodMatch = !rule.method || rule.method === method;
    const userAgentMatch = !rule.userAgent || 
      (userAgent && userAgent.includes(rule.userAgent));

    return patternMatch && methodMatch && userAgentMatch;
  }

  private generateKey(
    tenantId: string,
    identifier: string,
    endpoint: string,
    config: RateLimitConfig
  ): string {
    if (config.keyGenerator) {
      return config.keyGenerator
        .replace('{tenantId}', tenantId)
        .replace('{identifier}', identifier)
        .replace('{endpoint}', endpoint);
    }

    return `${tenantId}:${identifier}:${endpoint}`;
  }

  private initializeDefaultConfigs(): void {
    // Default tenant configurations for common use cases
    this.setTenantConfig({
      tenantId: 'default',
      globalLimit: {
        windowMs: 60000,      // 1 minute
        maxRequests: 100,     // 100 requests per minute
      },
      endpointLimits: {
        'POST:/leads': {
          windowMs: 60000,
          maxRequests: 20,    // Lower limit for lead creation
        },
        'GET:/leads': {
          windowMs: 60000,
          maxRequests: 200,   // Higher limit for read operations
        },
        'PATCH:/leads': {
          windowMs: 60000,
          maxRequests: 50,    // Moderate limit for updates
        },
      },
      apiKeyLimits: {},
      customRules: [],
    });
  }
}