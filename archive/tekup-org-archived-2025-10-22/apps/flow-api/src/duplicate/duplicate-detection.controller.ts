import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseInterceptors,
  BadRequestException,
  NotFoundException,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { 
  DuplicateDetectionService,
  DuplicateDetectionConfig,
  DuplicateCandidate,
  DuplicateGroup,
  MergeOperation
} from './duplicate-detection.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { MetricsInterceptor } from '../metrics/metrics.interceptor.js';
import { RateLimitingInterceptor, RateLimit } from '../common/rate-limiting/rate-limiting.interceptor.js';
import { ValidationPipe } from '../common/validation/validation.pipe.js';
import { 
  FindDuplicatesDto,
  MergeDuplicatesDto,
  UpdateConfigDto,
  ResolveGroupDto
} from './dto/duplicate.dto.js';

@Controller('duplicate')
@UseInterceptors(MetricsInterceptor, RateLimitingInterceptor)
export class DuplicateDetectionController {
  constructor(
    private readonly duplicateDetectionService: DuplicateDetectionService,
    private readonly prisma: PrismaService
  ) {}

  /**
   * Find potential duplicates for a lead
   */
  @Post('check/:leadId')
  @RateLimit({
    windowMs: 60000,  // 1 minute
    maxRequests: 100, // Reasonable limit for duplicate checks
  })
  async findDuplicates(
    @Param('leadId') leadId: string,
    @Body(ValidationPipe) findDuplicatesDto: FindDuplicatesDto,
    @Req() req: Request
  ): Promise<DuplicateCandidate[]> {
    const tenantId = this.extractTenantId(req);
    
    if (!leadId || leadId.trim().length === 0) {
      throw new BadRequestException('Lead ID is required');
    }

    return this.duplicateDetectionService.findDuplicates(leadId, tenantId);
  }

  /**
   * Get all duplicate groups for a tenant
   */
  @Get('groups')
  @RateLimit({
    windowMs: 60000,
    maxRequests: 50,
  })
  async getDuplicateGroups(
    @Query('resolved') resolved?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Req() req: Request
  ): Promise<DuplicateGroup[]> {
    const tenantId = this.extractTenantId(req);
    
    const options = {
      resolved: resolved === 'true',
      limit: limit ? Math.min(parseInt(limit, 10), 100) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    };

    return this.duplicateDetectionService.getDuplicateGroups(tenantId, options);
  }

  /**
   * Get a specific duplicate group
   */
  @Get('groups/:groupId')
  @RateLimit({
    windowMs: 60000,
    maxRequests: 100,
  })
  async getDuplicateGroup(
    @Param('groupId') groupId: string,
    @Req() req: Request
  ): Promise<DuplicateGroup> {
    const tenantId = this.extractTenantId(req);
    
    if (!groupId || groupId.trim().length === 0) {
      throw new BadRequestException('Group ID is required');
    }

    try {
      const group = await this.duplicateDetectionService.getDuplicateGroup(groupId, tenantId);
      return group;
    } catch (error) {
      throw new NotFoundException(`Duplicate group ${groupId} not found: ${error.message}`);
    }
  }

  /**
   * Merge duplicate leads
   */
  @Post('merge')
  @RateLimit({
    windowMs: 300000, // 5 minutes
    maxRequests: 20,  // Limited for merge operations
  })
  async mergeDuplicates(
    @Body(ValidationPipe) mergeDuplicatesDto: MergeDuplicatesDto,
    @Req() req: Request
  ): Promise<MergeOperation> {
    const tenantId = this.extractTenantId(req);
    const performedBy = this.extractActor(req);
    
    if (!mergeDuplicatesDto.sourceLeadId) {
      throw new BadRequestException('Source lead ID is required');
    }

    if (!mergeDuplicatesDto.targetLeadId) {
      throw new BadRequestException('Target lead ID is required');
    }

    return this.duplicateDetectionService.mergeDuplicates(
      mergeDuplicatesDto.sourceLeadId,
      mergeDuplicatesDto.targetLeadId,
      tenantId,
      performedBy,
      mergeDuplicatesDto.fieldResolutions
    );
  }

  /**
   * Create a duplicate group
   */
  @Post('groups')
  @RateLimit({
    windowMs: 300000,
    maxRequests: 10,
  })
  async createDuplicateGroup(
    @Body('leadIds') leadIds: string[],
    @Req() req: Request
  ): Promise<DuplicateGroup> {
    const tenantId = this.extractTenantId(req);
    
    if (!leadIds || !Array.isArray(leadIds) || leadIds.length < 2) {
      throw new BadRequestException('At least 2 lead IDs are required');
    }

    return this.duplicateDetectionService.createDuplicateGroup(tenantId, leadIds);
  }

  /**
   * Resolve a duplicate group
   */
  @Put('groups/:groupId/resolve')
  @RateLimit({
    windowMs: 300000,
    maxRequests: 10,
  })
  async resolveDuplicateGroup(
    @Param('groupId') groupId: string,
    @Body(ValidationPipe) resolveGroupDto: ResolveGroupDto,
    @Req() req: Request
  ): Promise<DuplicateGroup> {
    const tenantId = this.extractTenantId(req);
    
    if (!groupId || groupId.trim().length === 0) {
      throw new BadRequestException('Group ID is required');
    }

    try {
      const resolvedGroup = await this.duplicateDetectionService.resolveDuplicateGroup(
        groupId,
        tenantId,
        resolveGroupDto.resolutionMethod,
        resolveGroupDto.primaryLeadId
      );
      
      return resolvedGroup;
    } catch (error) {
      throw new BadRequestException(`Failed to resolve duplicate group: ${error.message}`);
    }
  }

  /**
   * Delete a duplicate group (mark as not duplicate)
   */
  @Delete('groups/:groupId')
  @RateLimit({
    windowMs: 300000,
    maxRequests: 10,
  })
  async deleteDuplicateGroup(
    @Param('groupId') groupId: string,
    @Req() req: Request
  ): Promise<{ success: boolean; message: string }> {
    const tenantId = this.extractTenantId(req);
    
    if (!groupId || groupId.trim().length === 0) {
      throw new BadRequestException('Group ID is required');
    }

    try {
      await this.duplicateDetectionService.deleteDuplicateGroup(groupId, tenantId);
      
      return {
        success: true,
        message: `Duplicate group ${groupId} deleted successfully`,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to delete duplicate group: ${error.message}`,
      };
    }
  }

  /**
   * Get tenant duplicate detection configuration
   */
  @Get('config')
  @RateLimit({
    windowMs: 300000, // 5 minutes
    maxRequests: 50,  // Higher limit for config reads
  })
  async getTenantConfig(@Req() req: Request): Promise<DuplicateDetectionConfig> {
    const tenantId = this.extractTenantId(req);
    return this.duplicateDetectionService.getTenantConfig(tenantId);
  }

  /**
   * Update tenant duplicate detection configuration
   */
  @Put('config')
  @RateLimit({
    windowMs: 300000, // 5 minutes
    maxRequests: 10,  // Limited for config updates
  })
  async updateTenantConfig(
    @Body(ValidationPipe) updateConfigDto: UpdateConfigDto,
    @Req() req: Request
  ): Promise<DuplicateDetectionConfig> {
    const tenantId = this.extractTenantId(req);
    
    return this.duplicateDetectionService.updateTenantConfig(
      tenantId,
      updateConfigDto
    );
  }

  /**
   * Get duplicate detection statistics
   */
  @Get('stats')
  @RateLimit({
    windowMs: 300000, // 5 minutes
    maxRequests: 20,
  })
  async getDuplicateStats(@Req() req: Request) {
    const tenantId = this.extractTenantId(req);
    
    try {
      // Get total groups
      const totalGroups = await this.prisma.duplicateGroup.count({
        where: { tenantId },
      });

      // Get unresolved groups
      const unresolvedGroups = await this.prisma.duplicateGroup.count({
        where: { tenantId, resolved: false },
      });

      // Get resolved groups by method
      const resolvedGroups = await this.prisma.duplicateGroup.findMany({
        where: { tenantId, resolved: true },
        select: { resolutionMethod: true },
      });

      const autoMerged = resolvedGroups.filter(g => g.resolutionMethod === 'merged').length;
      const manuallyMerged = resolvedGroups.filter(g => g.resolutionMethod === 'manual').length;
      const separated = resolvedGroups.filter(g => g.resolutionMethod === 'separate').length;

      return {
        tenantId,
        totalGroups,
        unresolvedGroups,
        autoMerged,
        manuallyMerged,
        separated,
        accuracyRate: totalGroups > 0 ? (autoMerged + manuallyMerged) / totalGroups : 0,
        lastChecked: new Date().toISOString(),
      };
    } catch (error) {
      // Fallback to basic structure if there's an error
      return {
        tenantId,
        totalGroups: 0,
        unresolvedGroups: 0,
        autoMerged: 0,
        manuallyMerged: 0,
        separated: 0,
        accuracyRate: 0,
        lastChecked: new Date().toISOString(),
      };
    }
  }

  /**
   * Bulk duplicate check for multiple leads
   */
  @Post('bulk-check')
  @RateLimit({
    windowMs: 600000, // 10 minutes
    maxRequests: 5,   // Very limited for bulk operations
  })
  async bulkDuplicateCheck(
    @Body('leadIds') leadIds: string[],
    @Req() req: Request
  ): Promise<{ leadId: string; duplicates: DuplicateCandidate[] }[]> {
    const tenantId = this.extractTenantId(req);
    
    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      throw new BadRequestException('Lead IDs are required');
    }

    if (leadIds.length > 100) {
      throw new BadRequestException('Maximum 100 leads can be checked at once');
    }

    const results = [];
    
    for (const leadId of leadIds) {
      try {
        const duplicates = await this.duplicateDetectionService.findDuplicates(leadId, tenantId);
        results.push({ leadId, duplicates });
      } catch (error) {
        results.push({ leadId, duplicates: [], error: error.message });
      }
    }

    return results;
  }

  private extractTenantId(req: Request): string {
    const tenantId = (req as any).tenantId as string | undefined;
    if (!tenantId) {
      throw new BadRequestException('Tenant ID is required');
    }
    return tenantId;
  }

  private extractActor(req: Request): string {
    // Extract actor from request context or headers
    return (req as any).user?.id || (req as any).apiKey?.id || 'system';
  }
}