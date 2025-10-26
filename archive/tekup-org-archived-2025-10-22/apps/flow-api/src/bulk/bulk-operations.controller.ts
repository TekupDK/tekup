import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Res,
  UseInterceptors,
  BadRequestException,
  NotFoundException,
  Req,
  StreamableFile,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { 
  BulkOperationsService, 
  BulkUpdateRequest, 
  BulkStatusUpdateRequest,
  BulkImportRequest,
  BulkExportRequest,
  BulkOperationResult
} from './bulk-operations.service.js';
import { MetricsInterceptor } from '../metrics/metrics.interceptor.js';
import { RateLimitingInterceptor, RateLimit } from '../common/rate-limiting/rate-limiting.interceptor.js';
import { ValidationPipe } from '../common/validation/validation.pipe.js';
import { 
  BulkUpdateDto, 
  BulkStatusUpdateDto, 
  BulkImportDto, 
  BulkExportDto 
} from './dto/bulk-operations.dto.js';

@Controller('bulk')
@UseInterceptors(MetricsInterceptor, RateLimitingInterceptor)
export class BulkOperationsController {
  constructor(private readonly bulkOperationsService: BulkOperationsService) {}

  /**
   * Bulk update leads
   */
  @Put('leads/update')
  @RateLimit({
    windowMs: 300000, // 5 minutes
    maxRequests: 10,  // Limited for bulk operations
  })
  async bulkUpdateLeads(
    @Body(ValidationPipe) bulkUpdateDto: BulkUpdateDto,
    @Req() req: Request
  ): Promise<BulkOperationResult> {
    const tenantId = this.extractTenantId(req);
    
    if (!bulkUpdateDto.leadIds || bulkUpdateDto.leadIds.length === 0) {
      throw new BadRequestException('Lead IDs are required');
    }

    if (bulkUpdateDto.leadIds.length > 10000) {
      throw new BadRequestException('Maximum 10,000 leads can be updated at once');
    }

    const request: BulkUpdateRequest = {
      tenantId,
      leadIds: bulkUpdateDto.leadIds,
      updates: bulkUpdateDto.updates,
      validateData: bulkUpdateDto.validateData,
      batchSize: bulkUpdateDto.batchSize,
    };

    return this.bulkOperationsService.bulkUpdateLeads(request);
  }

  /**
   * Bulk status update with event logging
   */
  @Put('leads/status')
  @RateLimit({
    windowMs: 300000, // 5 minutes
    maxRequests: 15,  // Slightly higher for status updates
  })
  async bulkUpdateStatus(
    @Body(ValidationPipe) bulkStatusUpdateDto: BulkStatusUpdateDto,
    @Req() req: Request
  ): Promise<BulkOperationResult> {
    const tenantId = this.extractTenantId(req);
    
    if (!bulkStatusUpdateDto.leadIds || bulkStatusUpdateDto.leadIds.length === 0) {
      throw new BadRequestException('Lead IDs are required');
    }

    if (!bulkStatusUpdateDto.newStatus) {
      throw new BadRequestException('New status is required');
    }

    const request: BulkStatusUpdateRequest = {
      tenantId,
      leadIds: bulkStatusUpdateDto.leadIds,
      updates: {}, // Not used for status updates
      newStatus: bulkStatusUpdateDto.newStatus,
      reason: bulkStatusUpdateDto.reason,
      actor: bulkStatusUpdateDto.actor || this.extractActor(req),
      batchSize: bulkStatusUpdateDto.batchSize,
    };

    return this.bulkOperationsService.bulkUpdateStatus(request);
  }

  /**
   * Import leads from uploaded data
   */
  @Post('leads/import')
  @RateLimit({
    windowMs: 600000, // 10 minutes
    maxRequests: 5,   // Very limited for imports
  })
  async importLeads(
    @Body(ValidationPipe) bulkImportDto: BulkImportDto,
    @Req() req: Request
  ): Promise<BulkOperationResult> {
    const tenantId = this.extractTenantId(req);
    
    if (!bulkImportDto.data || bulkImportDto.data.length === 0) {
      throw new BadRequestException('Import data is required');
    }

    if (bulkImportDto.data.length > 50000) {
      throw new BadRequestException('Maximum 50,000 records can be imported at once');
    }

    const request: BulkImportRequest = {
      tenantId,
      data: bulkImportDto.data,
      format: bulkImportDto.format || 'json',
      options: {
        validateOnly: bulkImportDto.validateOnly,
        skipInvalid: bulkImportDto.skipInvalid,
        batchSize: bulkImportDto.batchSize,
        duplicateHandling: bulkImportDto.duplicateHandling,
        customFieldMapping: bulkImportDto.customFieldMapping,
      },
    };

    return this.bulkOperationsService.importLeads(request);
  }

  /**
   * Validate import data without importing
   */
  @Post('leads/validate-import')
  @RateLimit({
    windowMs: 300000, // 5 minutes
    maxRequests: 20,  // Higher limit for validation
  })
  async validateImport(
    @Body(ValidationPipe) bulkImportDto: BulkImportDto,
    @Req() req: Request
  ) {
    const tenantId = this.extractTenantId(req);
    
    if (!bulkImportDto.data || bulkImportDto.data.length === 0) {
      throw new BadRequestException('Import data is required');
    }

    const request: BulkImportRequest = {
      tenantId,
      data: bulkImportDto.data,
      format: bulkImportDto.format || 'json',
      options: {
        validateOnly: true,
        customFieldMapping: bulkImportDto.customFieldMapping,
      },
    };

    const result = await this.bulkOperationsService.importLeads(request);
    
    return {
      valid: result.errorCount === 0,
      totalRecords: result.totalRecords,
      errors: result.errors,
      validation: result.metadata?.validation,
      operationId: result.operationId,
    };
  }

  /**
   * Export leads data
   */
  @Post('leads/export')
  @RateLimit({
    windowMs: 600000, // 10 minutes
    maxRequests: 3,   // Very limited for exports
  })
  async exportLeads(
    @Body(ValidationPipe) bulkExportDto: BulkExportDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request
  ) {
    const tenantId = this.extractTenantId(req);
    
    const request: BulkExportRequest = {
      tenantId,
      format: bulkExportDto.format || 'json',
      filters: bulkExportDto.filters,
      fields: bulkExportDto.fields,
      options: {
        includeRelated: bulkExportDto.includeRelated,
        streaming: true, // Always use streaming for exports
        compression: bulkExportDto.compression,
        maxRecords: bulkExportDto.maxRecords,
        chunkSize: bulkExportDto.chunkSize,
      },
    };

    const exportStream = await this.bulkOperationsService.exportLeads(request);
    
    // Set appropriate headers
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `leads_export_${timestamp}.${request.format}`;
    
    res.setHeader('Content-Type', this.getContentType(request.format));
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    if (request.options?.compression) {
      res.setHeader('Content-Encoding', request.options.compression);
    }

    return new StreamableFile(exportStream.stream, {
      type: this.getContentType(request.format),
      disposition: `attachment; filename="${filename}"`,
    });
  }

  /**
   * Get export as downloadable file (non-streaming)
   */
  @Get('leads/export/:format')
  @RateLimit({
    windowMs: 600000, // 10 minutes
    maxRequests: 5,
  })
  async downloadExport(
    @Param('format') format: string,
    @Query('filters') filters?: string,
    @Query('fields') fields?: string,
    @Query('limit') limit?: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const tenantId = this.extractTenantId(req);
    
    if (!['json', 'csv', 'xlsx'].includes(format)) {
      throw new BadRequestException('Supported formats: json, csv, xlsx');
    }

    const parsedFilters = filters ? JSON.parse(filters) : undefined;
    const parsedFields = fields ? fields.split(',') : undefined;
    const maxRecords = limit ? Math.min(parseInt(limit, 10), 10000) : 1000;

    const request: BulkExportRequest = {
      tenantId,
      format: format as any,
      filters: parsedFilters,
      fields: parsedFields,
      options: {
        streaming: true,
        maxRecords,
        chunkSize: 500,
      },
    };

    const exportStream = await this.bulkOperationsService.exportLeads(request);
    
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `leads_${timestamp}.${format}`;
    
    res.setHeader('Content-Type', this.getContentType(format));
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('X-Total-Records', exportStream.metadata.totalRecords.toString());
    res.setHeader('X-Estimated-Size', exportStream.metadata.estimatedSize.toString());

    return new StreamableFile(exportStream.stream);
  }

  /**
   * Get bulk operation status
   */
  @Get('operations/:operationId')
  @RateLimit({
    windowMs: 60000,  // 1 minute
    maxRequests: 100, // High frequency for status checks
  })
  async getOperationStatus(
    @Param('operationId') operationId: string
  ): Promise<BulkOperationResult> {
    if (!operationId || operationId.trim().length === 0) {
      throw new BadRequestException('Operation ID is required');
    }

    const operation = this.bulkOperationsService.getOperationStatus(operationId);
    
    if (!operation) {
      throw new NotFoundException(`Operation ${operationId} not found`);
    }

    return operation;
  }

  /**
   * Cancel bulk operation
   */
  @Delete('operations/:operationId')
  @RateLimit({
    windowMs: 60000,
    maxRequests: 50,
  })
  async cancelOperation(
    @Param('operationId') operationId: string
  ): Promise<{ success: boolean; message: string }> {
    if (!operationId || operationId.trim().length === 0) {
      throw new BadRequestException('Operation ID is required');
    }

    const cancelled = this.bulkOperationsService.cancelOperation(operationId);
    
    if (!cancelled) {
      return {
        success: false,
        message: 'Operation not found or cannot be cancelled',
      };
    }

    return {
      success: true,
      message: `Operation ${operationId} cancelled successfully`,
    };
  }

  /**
   * Get bulk operation statistics
   */
  @Get('stats')
  @RateLimit({
    windowMs: 300000, // 5 minutes
    maxRequests: 20,
  })
  async getBulkOperationStats(@Req() req: Request) {
    const tenantId = this.extractTenantId(req);
    
    // This would typically aggregate from metrics or database
    // For now, returning a basic structure
    return {
      tenantId,
      totalOperations: 0,
      completedOperations: 0,
      failedOperations: 0,
      avgProcessingTime: 0,
      lastOperation: null,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get supported import/export formats and limits
   */
  @Get('formats')
  @RateLimit({
    windowMs: 300000, // 5 minutes
    maxRequests: 50,
  })
  async getSupportedFormats() {
    return {
      importFormats: ['json', 'csv'],
      exportFormats: ['json', 'csv', 'xlsx'],
      limits: {
        maxImportRecords: 50000,
        maxExportRecords: 100000,
        maxBulkUpdate: 10000,
        maxBatchSize: 1000,
      },
      supportedFields: [
        'source', 'status', 'payload', 'complianceType', 'severity',
        'scanId', 'findingCategory', 'recommendation', 'autoActionable',
        'slaDeadline', 'affectedSystems', 'evidence'
      ],
      requiredFields: ['source'],
    };
  }

  /**
   * Get bulk operation templates
   */
  @Get('templates/:type')
  @RateLimit({
    windowMs: 300000, // 5 minutes
    maxRequests: 30,
  })
  async getTemplate(
    @Param('type') type: string,
    @Query('format') format?: string
  ) {
    const supportedTypes = ['import', 'update', 'status-update'];
    
    if (!supportedTypes.includes(type)) {
      throw new BadRequestException(`Supported template types: ${supportedTypes.join(', ')}`);
    }

    const templates = {
      import: {
        json: [
          {
            source: "web_form",
            complianceType: "NIS2_FINDING",
            severity: "HIGH",
            findingCategory: "Security Gap",
            recommendation: "Implement multi-factor authentication",
            autoActionable: false,
            slaDeadline: "2024-12-31T23:59:59Z",
            affectedSystems: ["web-server", "database"],
            evidence: { "details": "Evidence details here" }
          }
        ],
        csv: `source,complianceType,severity,findingCategory,recommendation,autoActionable,slaDeadline,affectedSystems,evidence
web_form,NIS2_FINDING,HIGH,Security Gap,Implement multi-factor authentication,false,2024-12-31T23:59:59Z,"[""web-server"",""database""]","{""details"":""Evidence details here""}"`
      },
      update: {
        leadIds: ["lead-id-1", "lead-id-2"],
        updates: {
          status: "CONTACTED",
          severity: "MEDIUM",
          recommendation: "Updated recommendation"
        },
        validateData: true,
        batchSize: 100
      },
      'status-update': {
        leadIds: ["lead-id-1", "lead-id-2"],
        newStatus: "CONTACTED",
        reason: "Bulk status update reason",
        batchSize: 100
      }
    };

    const template = templates[type as keyof typeof templates];
    
    if (type === 'import' && format) {
      return {
        type,
        format,
        template: template[format as keyof typeof template.json] || template.json,
      };
    }

    return {
      type,
      template,
    };
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

  private getContentType(format: string): string {
    switch (format) {
      case 'json':
        return 'application/json';
      case 'csv':
        return 'text/csv';
      case 'xlsx':
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      default:
        return 'application/octet-stream';
    }
  }
}