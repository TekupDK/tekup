import { 
  Controller, 
  Get, 
  Post, 
  Delete, 
  Body, 
  Param, 
  Query,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { 
  RateLimitingService, 
  TenantRateLimitConfig, 
  RateLimitConfig 
} from './rate-limiting.service.js';
import { AdaptiveRateLimitingService } from './adaptive-rate-limiting.service.js';
import { StructuredLogger } from '../logging/structured-logger.service.js';
import { AsyncContextService } from '../logging/async-context.service.js';

export class CreateRateLimitConfigDto {
  tenantId: string;
  globalLimit: RateLimitConfig;
  endpointLimits?: Record<string, RateLimitConfig>;
  apiKeyLimits?: Record<string, RateLimitConfig>;
}

export class RateLimitStatusDto {
  tenantId: string;
  identifier: string;
  endpoint: string;
}

@Controller('admin/rate-limits')
export class RateLimitingController {
  constructor(
    private readonly rateLimitingService: RateLimitingService,
    private readonly adaptiveRateLimitingService: AdaptiveRateLimitingService,
    private readonly logger: StructuredLogger,
    private readonly contextService: AsyncContextService
  ) {}

  /**
   * Get rate limit statistics for a tenant
   */
  @Get('stats/:tenantId')
  async getRateLimitStats(@Param('tenantId') tenantId: string) {
    if (!tenantId) {
      throw new BadRequestException('Tenant ID is required');
    }

    const stats = await this.rateLimitingService.getRateLimitStats(tenantId);
    
    this.logger.logBusinessEvent(
      'rate_limit_stats_requested',
      'rate_limit',
      tenantId,
      {
        ...this.contextService.toLogContext(),
        metadata: { stats },
      }
    );

    return {
      tenantId,
      stats,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Configure rate limits for a tenant
   */
  @Post('config')
  async setTenantConfig(@Body() dto: CreateRateLimitConfigDto) {
    if (!dto.tenantId || !dto.globalLimit) {
      throw new BadRequestException('Tenant ID and global limit are required');
    }

    // Validate rate limit configurations
    this.validateRateLimitConfig(dto.globalLimit);
    
    if (dto.endpointLimits) {
      Object.values(dto.endpointLimits).forEach(config => 
        this.validateRateLimitConfig(config)
      );
    }

    if (dto.apiKeyLimits) {
      Object.values(dto.apiKeyLimits).forEach(config => 
        this.validateRateLimitConfig(config)
      );
    }

    const config: TenantRateLimitConfig = {
      tenantId: dto.tenantId,
      globalLimit: dto.globalLimit,
      endpointLimits: dto.endpointLimits || {},
      apiKeyLimits: dto.apiKeyLimits || {},
      customRules: [],
    };

    this.rateLimitingService.setTenantConfig(config);

    this.logger.logBusinessEvent(
      'rate_limit_config_updated',
      'rate_limit',
      dto.tenantId,
      {
        ...this.contextService.toLogContext(),
        metadata: {
          globalLimit: dto.globalLimit,
          endpointCount: Object.keys(dto.endpointLimits || {}).length,
          apiKeyCount: Object.keys(dto.apiKeyLimits || {}).length,
        },
      }
    );

    return {
      message: 'Rate limit configuration updated successfully',
      tenantId: dto.tenantId,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get current rate limit status for a specific key
   */
  @Get('status')
  async getRateLimitStatus(@Query() dto: RateLimitStatusDto) {
    if (!dto.tenantId || !dto.identifier || !dto.endpoint) {
      throw new BadRequestException('tenantId, identifier, and endpoint are required');
    }

    const status = await this.rateLimitingService.getRateLimitStatus(
      dto.tenantId,
      dto.identifier,
      dto.endpoint
    );

    return {
      tenantId: dto.tenantId,
      identifier: dto.identifier,
      endpoint: dto.endpoint,
      status,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Reset rate limit for a specific key
   */
  @Delete('reset')
  async resetRateLimit(@Query() dto: RateLimitStatusDto) {
    if (!dto.tenantId || !dto.identifier || !dto.endpoint) {
      throw new BadRequestException('tenantId, identifier, and endpoint are required');
    }

    const success = await this.rateLimitingService.resetRateLimit(
      dto.tenantId,
      dto.identifier,
      dto.endpoint
    );

    this.logger.logBusinessEvent(
      'rate_limit_reset',
      'rate_limit',
      `${dto.tenantId}:${dto.identifier}:${dto.endpoint}`,
      {
        ...this.contextService.toLogContext(),
        metadata: {
          tenantId: dto.tenantId,
          identifier: dto.identifier,
          endpoint: dto.endpoint,
          success,
        },
      }
    );

    return {
      message: success ? 'Rate limit reset successfully' : 'Failed to reset rate limit',
      success,
      tenantId: dto.tenantId,
      identifier: dto.identifier,
      endpoint: dto.endpoint,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Health check for rate limiting service
   */
  @Get('health')
  async getHealth() {
    try {
      // Test rate limiting service by checking a dummy configuration
      const testStats = await this.rateLimitingService.getRateLimitStats('health-check');
      
      return {
        status: 'healthy',
        service: 'rate-limiting',
        redis: 'connected',
        timestamp: new Date().toISOString(),
        testStats,
      };
    } catch (error) {
      this.logger.error('Rate limiting health check failed', {
        error: error.message,
        stack: error.stack,
      });

      return {
        status: 'unhealthy',
        service: 'rate-limiting',
        redis: 'disconnected',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Get adaptive rate limiting statistics
   */
  @Get('adaptive/limits')
  async getAdaptiveLimits() {
    const activeLimits = this.adaptiveRateLimitingService.getActiveAdaptiveLimits();
    
    return {
      activeLimits,
      count: activeLimits.length,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get current anomalies detected by adaptive rate limiting
   */
  @Get('adaptive/anomalies')
  async getAnomalies() {
    const activeAnomalies = this.adaptiveRateLimitingService.getActiveAnomalies();
    
    return {
      anomalies: activeAnomalies,
      count: activeAnomalies.length,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Reset adaptive rate limit for a specific identifier/endpoint
   */
  @Delete('adaptive/reset')
  async resetAdaptiveLimit(@Query() dto: RateLimitStatusDto) {
    if (!dto.identifier || !dto.endpoint) {
      throw new BadRequestException('identifier and endpoint are required');
    }

    const success = this.adaptiveRateLimitingService.resetAdaptiveLimit(
      dto.identifier,
      dto.endpoint
    );

    this.logger.logBusinessEvent(
      'adaptive_rate_limit_reset',
      'rate_limit',
      `${dto.identifier}:${dto.endpoint}`,
      {
        ...this.contextService.toLogContext(),
        metadata: {
          identifier: dto.identifier,
          endpoint: dto.endpoint,
          success,
        },
      }
    );

    return {
      message: success ? 'Adaptive rate limit reset successfully' : 'No adaptive limit found',
      success,
      identifier: dto.identifier,
      endpoint: dto.endpoint,
      timestamp: new Date().toISOString(),
    };
  }

  private validateRateLimitConfig(config: RateLimitConfig): void {
    if (!config.windowMs || config.windowMs <= 0) {
      throw new BadRequestException('windowMs must be a positive number');
    }

    if (!config.maxRequests || config.maxRequests <= 0) {
      throw new BadRequestException('maxRequests must be a positive number');
    }

    if (config.windowMs < 1000) {
      throw new BadRequestException('windowMs must be at least 1000ms (1 second)');
    }

    if (config.maxRequests > 10000) {
      throw new BadRequestException('maxRequests cannot exceed 10,000 per window');
    }
  }
}