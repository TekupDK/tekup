import {
  Controller,
  Get,
  Post,
  UseInterceptors,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { DatabaseOptimizationService } from './database-optimization.service.js';
import { MetricsInterceptor } from '../metrics/metrics.interceptor.js';
import { RateLimitingInterceptor, RateLimit } from '../common/rate-limiting/rate-limiting.interceptor.js';

@Controller('database-optimization')
@UseInterceptors(MetricsInterceptor, RateLimitingInterceptor)
export class DatabaseOptimizationController {
  constructor(
    private readonly databaseOptimizationService: DatabaseOptimizationService,
  ) {}

  /**
   * Get database optimization recommendations
   */
  @Get('recommendations')
  @RateLimit({
    windowMs: 300000, // 5 minutes
    maxRequests: 10, // Limited for analysis operations
  })
  async getRecommendations(@Req() req: Request) {
    try {
      const indexRecommendations = await this.databaseOptimizationService.analyzeQueryPatterns();
      const partitionRecommendations = await this.databaseOptimizationService.recommendPartitioning();
      const connectionPoolOptimizations = await this.databaseOptimizationService.optimizeConnectionPooling();

      return {
        success: true,
        data: {
          indexRecommendations,
          partitionRecommendations,
          connectionPoolOptimizations,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to get recommendations: ${error.message}`,
      );
    }
  }

  /**
   * Generate comprehensive database optimization report
   */
  @Get('report')
  @RateLimit({
    windowMs: 600000, // 10 minutes
    maxRequests: 5, // Very limited for report generation
  })
  async generateReport(@Req() req: Request) {
    try {
      const report = await this.databaseOptimizationService.generateOptimizationReport();

      return {
        success: true,
        data: report,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to generate report: ${error.message}`,
      );
    }
  }

  /**
   * Apply database optimizations (simulated)
   */
  @Post('apply')
  @RateLimit({
    windowMs: 3600000, // 1 hour
    maxRequests: 1, // Very limited for optimization application
  })
  async applyOptimizations(@Req() req: Request) {
    try {
      // In a real implementation, this would apply the optimizations
      // For now, we'll just return a simulation
      
      const tenantId = this.extractTenantId(req);
      
      return {
        success: true,
        message: 'Database optimizations applied successfully (simulated)',
        tenantId,
        timestamp: new Date().toISOString(),
        details: {
          indexesCreated: 5,
          partitionsConfigured: 2,
          connectionPoolOptimized: true,
        },
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to apply optimizations: ${error.message}`,
      );
    }
  }

  private extractTenantId(req: Request): string {
    const tenantId = (req as any).tenantId as string | undefined;
    if (!tenantId) {
      throw new BadRequestException('Tenant ID is required');
    }
    return tenantId;
  }
}