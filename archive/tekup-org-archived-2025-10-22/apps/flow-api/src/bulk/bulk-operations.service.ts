import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { StructuredLogger } from '../common/logging/structured-logger.service.js';
import { AsyncContextService } from '../common/logging/async-context.service.js';
import { MetricsService } from '../metrics/metrics.service.js';
import { Readable, Transform } from 'stream';
import { pipeline } from 'stream/promises';

export interface BulkUpdateRequest {
  tenantId: string;
  leadIds: string[];
  updates: Record<string, any>;
  validateData?: boolean;
  batchSize?: number;
}

export interface BulkStatusUpdateRequest extends BulkUpdateRequest {
  newStatus: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'LOST';
  reason?: string;
  actor?: string;
}

export interface BulkImportRequest {
  tenantId: string;
  data: any[];
  format: 'json' | 'csv';
  options?: BulkImportOptions;
}

export interface BulkImportOptions {
  validateOnly?: boolean;
  skipInvalid?: boolean;
  batchSize?: number;
  duplicateHandling?: 'skip' | 'update' | 'create_new';
  customFieldMapping?: Record<string, string>;
}

export interface BulkExportRequest {
  tenantId: string;
  format: 'json' | 'csv' | 'xlsx';
  filters?: any;
  fields?: string[];
  options?: BulkExportOptions;
}

export interface BulkExportOptions {
  includeRelated?: boolean;
  streaming?: boolean;
  compression?: 'gzip' | 'brotli';
  maxRecords?: number;
  chunkSize?: number;
}

export interface BulkOperationResult {
  operationId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  totalRecords: number;
  processedRecords: number;
  successCount: number;
  errorCount: number;
  errors: BulkOperationError[];
  startTime: Date;
  endTime?: Date;
  executionTime?: number;
  metadata?: Record<string, any>;
}

export interface BulkOperationError {
  recordIndex?: number;
  recordId?: string;
  field?: string;
  error: string;
  code?: string;
}

export interface ImportValidationResult {
  isValid: boolean;
  validRecords: number;
  invalidRecords: number;
  errors: BulkOperationError[];
  warnings: string[];
  fieldMapping: Record<string, string>;
  preview: any[];
}

export interface ExportStream {
  stream: Readable;
  metadata: {
    totalRecords: number;
    format: string;
    compression?: string;
    estimatedSize: number;
  };
}

@Injectable()
export class BulkOperationsService {
  private readonly logger = new Logger(BulkOperationsService.name);
  private readonly operations = new Map<string, BulkOperationResult>();
  private readonly defaultBatchSize = 100;
  private readonly maxBatchSize = 1000;
  private readonly maxExportRecords = 100000;

  constructor(
    private readonly prisma: PrismaService,
    private readonly structuredLogger: StructuredLogger,
    private readonly contextService: AsyncContextService,
    private readonly metricsService: MetricsService
  ) {
    // Clean up completed operations periodically
    setInterval(() => this.cleanupCompletedOperations(), 300000); // 5 minutes
  }

  /**
   * Bulk update lead records
   */
  async bulkUpdateLeads(request: BulkUpdateRequest): Promise<BulkOperationResult> {
    const operationId = this.generateOperationId();
    const startTime = Date.now();

    const operation: BulkOperationResult = {
      operationId,
      status: 'processing',
      totalRecords: request.leadIds.length,
      processedRecords: 0,
      successCount: 0,
      errorCount: 0,
      errors: [],
      startTime: new Date(),
    };

    this.operations.set(operationId, operation);

    try {
      this.validateBulkUpdateRequest(request);
      
      const batchSize = Math.min(request.batchSize || this.defaultBatchSize, this.maxBatchSize);
      const batches = this.chunkArray(request.leadIds, batchSize);

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        try {
          const result = await this.processBulkUpdateBatch(
            request.tenantId,
            batch,
            request.updates,
            request.validateData || false
          );

          operation.processedRecords += result.processedCount;
          operation.successCount += result.successCount;
          operation.errorCount += result.errorCount;
          operation.errors.push(...result.errors);

          // Update progress
          this.operations.set(operationId, { ...operation });

          // Record batch metrics
          this.recordBatchMetrics('update', result, request.tenantId);

        } catch (batchError) {
          this.logger.error(`Batch ${i + 1} failed:`, batchError);
          operation.errorCount += batch.length;
          operation.errors.push({
            error: `Batch ${i + 1} failed: ${batchError.message}`,
            code: 'BATCH_FAILURE',
          });
        }
      }

      const executionTime = Date.now() - startTime;
      operation.status = operation.errorCount === 0 ? 'completed' : 'completed';
      operation.endTime = new Date();
      operation.executionTime = executionTime;

      this.operations.set(operationId, operation);

      // Log completion
      this.logBulkOperation('update', operation, request.tenantId);

      return operation;
    } catch (error) {
      operation.status = 'failed';
      operation.endTime = new Date();
      operation.executionTime = Date.now() - startTime;
      operation.errors.push({
        error: error.message,
        code: 'OPERATION_FAILURE',
      });

      this.operations.set(operationId, operation);
      throw error;
    }
  }

  /**
   * Bulk status updates with event logging
   */
  async bulkUpdateStatus(request: BulkStatusUpdateRequest): Promise<BulkOperationResult> {
    const operationId = this.generateOperationId();
    const startTime = Date.now();

    const operation: BulkOperationResult = {
      operationId,
      status: 'processing',
      totalRecords: request.leadIds.length,
      processedRecords: 0,
      successCount: 0,
      errorCount: 0,
      errors: [],
      startTime: new Date(),
    };

    this.operations.set(operationId, operation);

    try {
      const batchSize = Math.min(request.batchSize || this.defaultBatchSize, this.maxBatchSize);
      const batches = this.chunkArray(request.leadIds, batchSize);

      for (const batch of batches) {
        try {
          // Update leads and create events in transaction
          const result = await this.prisma.$transaction(async (tx) => {
            // Get current status for event logging
            const leads = await tx.lead.findMany({
              where: { id: { in: batch }, tenantId: request.tenantId },
              select: { id: true, status: true },
            });

            // Update leads
            const updateResult = await tx.lead.updateMany({
              where: { id: { in: batch }, tenantId: request.tenantId },
              data: { status: request.newStatus, updatedAt: new Date() },
            });

            // Create events for each lead
            const events = leads.map(lead => ({
              leadId: lead.id,
              actor: request.actor || 'system',
              fromStatus: lead.status,
              toStatus: request.newStatus,
              notes: request.reason || `Bulk status update to ${request.newStatus}`,
              metadata: {
                operationId,
                bulkOperation: true,
              },
            }));

            await tx.leadEvent.createMany({ data: events });

            return {
              processedCount: updateResult.count,
              successCount: updateResult.count,
              errorCount: 0,
              errors: [],
            };
          });

          operation.processedRecords += result.processedCount;
          operation.successCount += result.successCount;

        } catch (batchError) {
          this.logger.error('Status update batch failed:', batchError);
          operation.errorCount += batch.length;
          operation.errors.push({
            error: `Batch failed: ${batchError.message}`,
            code: 'STATUS_UPDATE_FAILURE',
          });
        }

        this.operations.set(operationId, { ...operation });
      }

      const executionTime = Date.now() - startTime;
      operation.status = 'completed';
      operation.endTime = new Date();
      operation.executionTime = executionTime;

      this.operations.set(operationId, operation);
      return operation;

    } catch (error) {
      operation.status = 'failed';
      operation.endTime = new Date();
      operation.errors.push({ error: error.message, code: 'OPERATION_FAILURE' });
      this.operations.set(operationId, operation);
      throw error;
    }
  }

  /**
   * Import leads with validation
   */
  async importLeads(request: BulkImportRequest): Promise<BulkOperationResult> {
    const operationId = this.generateOperationId();
    const startTime = Date.now();

    const operation: BulkOperationResult = {
      operationId,
      status: 'processing',
      totalRecords: request.data.length,
      processedRecords: 0,
      successCount: 0,
      errorCount: 0,
      errors: [],
      startTime: new Date(),
    };

    this.operations.set(operationId, operation);

    try {
      // Validate import data
      const validation = await this.validateImportData(request);
      
      if (!validation.isValid && !request.options?.skipInvalid) {
        operation.status = 'failed';
        operation.errors = validation.errors;
        operation.endTime = new Date();
        this.operations.set(operationId, operation);
        return operation;
      }

      if (request.options?.validateOnly) {
        operation.status = 'completed';
        operation.endTime = new Date();
        operation.metadata = { validation };
        this.operations.set(operationId, operation);
        return operation;
      }

      // Process valid records
      const validData = request.options?.skipInvalid 
        ? this.filterValidRecords(request.data, validation)
        : request.data;

      const batchSize = Math.min(request.options?.batchSize || this.defaultBatchSize, this.maxBatchSize);
      const batches = this.chunkArray(validData, batchSize);

      for (const batch of batches) {
        try {
          const result = await this.processImportBatch(
            request.tenantId,
            batch,
            request.options || {}
          );

          operation.processedRecords += result.processedCount;
          operation.successCount += result.successCount;
          operation.errorCount += result.errorCount;
          operation.errors.push(...result.errors);

        } catch (batchError) {
          this.logger.error('Import batch failed:', batchError);
          operation.errorCount += batch.length;
          operation.errors.push({
            error: `Import batch failed: ${batchError.message}`,
            code: 'IMPORT_BATCH_FAILURE',
          });
        }

        this.operations.set(operationId, { ...operation });
      }

      const executionTime = Date.now() - startTime;
      operation.status = 'completed';
      operation.endTime = new Date();
      operation.executionTime = executionTime;

      this.operations.set(operationId, operation);
      return operation;

    } catch (error) {
      operation.status = 'failed';
      operation.endTime = new Date();
      operation.errors.push({ error: error.message, code: 'IMPORT_FAILURE' });
      this.operations.set(operationId, operation);
      throw error;
    }
  }

  /**
   * Export leads with streaming support
   */
  async exportLeads(request: BulkExportRequest): Promise<ExportStream> {
    try {
      this.validateExportRequest(request);

      // Get total count
      const totalCount = await this.getExportCount(request);
      
      if (totalCount > (request.options?.maxRecords || this.maxExportRecords)) {
        throw new BadRequestException(
          `Export too large: ${totalCount} records. Maximum allowed: ${request.options?.maxRecords || this.maxExportRecords}`
        );
      }

      // Create streaming export
      const stream = this.createExportStream(request);
      
      return {
        stream,
        metadata: {
          totalRecords: totalCount,
          format: request.format,
          compression: request.options?.compression,
          estimatedSize: this.estimateExportSize(totalCount, request.fields?.length || 10),
        },
      };

    } catch (error) {
      this.logger.error('Export creation failed:', error);
      throw error;
    }
  }

  /**
   * Get operation status
   */
  getOperationStatus(operationId: string): BulkOperationResult | null {
    return this.operations.get(operationId) || null;
  }

  /**
   * Cancel operation
   */
  cancelOperation(operationId: string): boolean {
    const operation = this.operations.get(operationId);
    if (operation && operation.status === 'processing') {
      operation.status = 'cancelled';
      operation.endTime = new Date();
      this.operations.set(operationId, operation);
      return true;
    }
    return false;
  }

  /**
   * Validate import data structure and content
   */
  async validateImportData(request: BulkImportRequest): Promise<ImportValidationResult> {
    const errors: BulkOperationError[] = [];
    const warnings: string[] = [];
    let validRecords = 0;
    let invalidRecords = 0;

    const requiredFields = ['source'];
    const allowedFields = [
      'source', 'payload', 'complianceType', 'severity', 'scanId',
      'findingCategory', 'recommendation', 'autoActionable', 'slaDeadline',
      'affectedSystems', 'evidence'
    ];

    // Validate each record
    for (let i = 0; i < request.data.length; i++) {
      const record = request.data[i];
      let recordValid = true;

      // Check required fields
      for (const field of requiredFields) {
        if (!record[field] || record[field].toString().trim().length === 0) {
          errors.push({
            recordIndex: i,
            field,
            error: `Required field '${field}' is missing or empty`,
            code: 'REQUIRED_FIELD_MISSING',
          });
          recordValid = false;
        }
      }

      // Check field validity
      for (const [field, value] of Object.entries(record)) {
        if (!allowedFields.includes(field)) {
          warnings.push(`Record ${i}: Unknown field '${field}' will be ignored`);
          continue;
        }

        // Type-specific validation
        if (field === 'slaDeadline' && value) {
          const date = new Date(value as string);
          if (isNaN(date.getTime())) {
            errors.push({
              recordIndex: i,
              field,
              error: 'Invalid date format',
              code: 'INVALID_DATE',
            });
            recordValid = false;
          }
        }

        if (field === 'autoActionable' && value !== undefined) {
          if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
            errors.push({
              recordIndex: i,
              field,
              error: 'Must be boolean value',
              code: 'INVALID_BOOLEAN',
            });
            recordValid = false;
          }
        }
      }

      if (recordValid) {
        validRecords++;
      } else {
        invalidRecords++;
      }
    }

    return {
      isValid: invalidRecords === 0,
      validRecords,
      invalidRecords,
      errors,
      warnings,
      fieldMapping: this.generateFieldMapping(allowedFields),
      preview: request.data.slice(0, 5), // First 5 records as preview
    };
  }

  private validateBulkUpdateRequest(request: BulkUpdateRequest): void {
    if (!request.leadIds || request.leadIds.length === 0) {
      throw new BadRequestException('Lead IDs are required');
    }

    if (request.leadIds.length > 10000) {
      throw new BadRequestException('Maximum 10,000 leads can be updated at once');
    }

    if (!request.updates || Object.keys(request.updates).length === 0) {
      throw new BadRequestException('Update data is required');
    }

    const allowedFields = ['status', 'source', 'payload', 'complianceType', 'severity', 
                          'findingCategory', 'recommendation', 'autoActionable', 'slaDeadline'];
    
    for (const field of Object.keys(request.updates)) {
      if (!allowedFields.includes(field)) {
        throw new BadRequestException(`Field '${field}' is not allowed for bulk update`);
      }
    }
  }

  private validateExportRequest(request: BulkExportRequest): void {
    const allowedFormats = ['json', 'csv', 'xlsx'];
    if (!allowedFormats.includes(request.format)) {
      throw new BadRequestException(`Format '${request.format}' is not supported`);
    }

    if (request.fields && request.fields.length > 50) {
      throw new BadRequestException('Maximum 50 fields can be exported');
    }
  }

  private async processBulkUpdateBatch(
    tenantId: string,
    leadIds: string[],
    updates: Record<string, any>,
    validate: boolean
  ): Promise<{
    processedCount: number;
    successCount: number;
    errorCount: number;
    errors: BulkOperationError[];
  }> {
    try {
      if (validate) {
        // Verify all leads exist and belong to tenant
        const existingLeads = await this.prisma.lead.findMany({
          where: { id: { in: leadIds }, tenantId },
          select: { id: true },
        });

        if (existingLeads.length !== leadIds.length) {
          const foundIds = existingLeads.map(l => l.id);
          const missingIds = leadIds.filter(id => !foundIds.includes(id));
          
          return {
            processedCount: leadIds.length,
            successCount: existingLeads.length,
            errorCount: missingIds.length,
            errors: missingIds.map(id => ({
              recordId: id,
              error: 'Lead not found or access denied',
              code: 'LEAD_NOT_FOUND',
            })),
          };
        }
      }

      const result = await this.prisma.lead.updateMany({
        where: { id: { in: leadIds }, tenantId },
        data: { ...updates, updatedAt: new Date() },
      });

      return {
        processedCount: leadIds.length,
        successCount: result.count,
        errorCount: leadIds.length - result.count,
        errors: [],
      };

    } catch (error) {
      return {
        processedCount: leadIds.length,
        successCount: 0,
        errorCount: leadIds.length,
        errors: [{
          error: error.message,
          code: 'UPDATE_FAILED',
        }],
      };
    }
  }

  private async processImportBatch(
    tenantId: string,
    batch: any[],
    options: BulkImportOptions
  ): Promise<{
    processedCount: number;
    successCount: number;
    errorCount: number;
    errors: BulkOperationError[];
  }> {
    let successCount = 0;
    let errorCount = 0;
    const errors: BulkOperationError[] = [];

    for (const record of batch) {
      try {
        const leadData = {
          tenantId,
          source: record.source,
          payload: record.payload || {},
          complianceType: record.complianceType || null,
          severity: record.severity || null,
          scanId: record.scanId || null,
          findingCategory: record.findingCategory || null,
          recommendation: record.recommendation || null,
          autoActionable: record.autoActionable || false,
          slaDeadline: record.slaDeadline ? new Date(record.slaDeadline) : null,
          affectedSystems: record.affectedSystems || [],
          evidence: record.evidence || null,
        };

        await this.prisma.lead.create({ data: leadData });
        successCount++;

      } catch (error) {
        errorCount++;
        errors.push({
          error: error.message,
          code: 'CREATE_FAILED',
        });
      }
    }

    return {
      processedCount: batch.length,
      successCount,
      errorCount,
      errors,
    };
  }

  private createExportStream(request: BulkExportRequest): Readable {
    const chunkSize = request.options?.chunkSize || 1000;
    let offset = 0;
    let finished = false;

    return new Readable({
      objectMode: false,
      async read() {
        if (finished) {
          this.push(null);
          return;
        }

        try {
          const leads = await this.prisma.lead.findMany({
            where: { 
              tenantId: request.tenantId,
              ...(request.filters || {})
            },
            select: this.buildSelectFields(request.fields),
            skip: offset,
            take: chunkSize,
            include: request.options?.includeRelated ? {
              events: { take: 10, orderBy: { createdAt: 'desc' } }
            } : undefined,
          });

          if (leads.length === 0) {
            finished = true;
            
            // Add closing bracket for JSON format
            if (request.format === 'json') {
              this.push('\n]');
            }
            
            this.push(null);
            return;
          }

          let chunk: string;
          
          if (request.format === 'json') {
            if (offset === 0) {
              chunk = '[\n' + leads.map(lead => JSON.stringify(lead)).join(',\n');
            } else {
              chunk = ',\n' + leads.map(lead => JSON.stringify(lead)).join(',\n');
            }
          } else if (request.format === 'csv') {
            if (offset === 0) {
              // Add CSV header
              const headers = Object.keys(leads[0] || {}).join(',');
              chunk = headers + '\n' + this.convertToCSV(leads);
            } else {
              chunk = this.convertToCSV(leads);
            }
          } else {
            chunk = JSON.stringify(leads);
          }

          this.push(chunk);
          offset += chunkSize;

        } catch (error) {
          this.emit('error', error);
        }
      }
    });
  }

  private convertToCSV(data: any[]): string {
    return data.map(row => {
      return Object.values(row).map(value => {
        if (value === null || value === undefined) return '';
        if (typeof value === 'object') return JSON.stringify(value);
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value.toString();
      }).join(',');
    }).join('\n') + '\n';
  }

  private buildSelectFields(fields?: string[]): Record<string, boolean> {
    if (!fields || fields.length === 0) {
      return {
        id: true,
        source: true,
        status: true,
        payload: true,
        complianceType: true,
        severity: true,
        createdAt: true,
        updatedAt: true,
      };
    }

    const select: Record<string, boolean> = {};
    fields.forEach(field => {
      select[field] = true;
    });
    
    return select;
  }

  private async getExportCount(request: BulkExportRequest): Promise<number> {
    return this.prisma.lead.count({
      where: {
        tenantId: request.tenantId,
        ...(request.filters || {})
      }
    });
  }

  private estimateExportSize(recordCount: number, fieldCount: number): number {
    // Rough estimation: average 100 bytes per field
    return recordCount * fieldCount * 100;
  }

  private filterValidRecords(data: any[], validation: ImportValidationResult): any[] {
    const invalidIndexes = new Set(
      validation.errors.map(error => error.recordIndex).filter(idx => idx !== undefined)
    );
    
    return data.filter((_, index) => !invalidIndexes.has(index));
  }

  private generateFieldMapping(allowedFields: string[]): Record<string, string> {
    const mapping: Record<string, string> = {};
    allowedFields.forEach(field => {
      mapping[field] = field;
    });
    return mapping;
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  private generateOperationId(): string {
    return `bulk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private recordBatchMetrics(
    operation: string,
    result: any,
    tenantId: string
  ): void {
    this.metricsService.histogram('bulk_operation_batch_size', result.processedCount, {
      operation,
      tenant: tenantId,
    });

    this.metricsService.histogram('bulk_operation_success_rate', 
      result.successCount / result.processedCount * 100, {
      operation,
      tenant: tenantId,
    });

    if (result.errorCount > 0) {
      this.metricsService.increment('bulk_operation_errors_total', {
        operation,
        tenant: tenantId,
      });
    }
  }

  private logBulkOperation(
    operation: string,
    result: BulkOperationResult,
    tenantId: string
  ): void {
    this.structuredLogger.info(
      `Bulk ${operation} operation completed`,
      {
        ...this.contextService.toLogContext(),
        metadata: {
          operationId: result.operationId,
          tenantId,
          totalRecords: result.totalRecords,
          successCount: result.successCount,
          errorCount: result.errorCount,
          executionTime: result.executionTime,
          status: result.status,
        },
      }
    );
  }

  private cleanupCompletedOperations(): void {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    for (const [operationId, operation] of this.operations.entries()) {
      if (operation.endTime && (now - operation.endTime.getTime()) > maxAge) {
        this.operations.delete(operationId);
      }
    }
  }
}