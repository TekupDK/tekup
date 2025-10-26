import { IsString, IsOptional, IsArray, IsNumber, IsBoolean, IsEnum, ValidateNested, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export enum LeadStatusDto {
  NEW = 'NEW',
  CONTACTED = 'CONTACTED',
  QUALIFIED = 'QUALIFIED',
  LOST = 'LOST',
}

export enum ExportFormatDto {
  JSON = 'json',
  CSV = 'csv',
  XLSX = 'xlsx',
}

export enum ImportFormatDto {
  JSON = 'json',
  CSV = 'csv',
}

export enum DuplicateHandlingDto {
  SKIP = 'skip',
  UPDATE = 'update',
  CREATE_NEW = 'create_new',
}

export enum CompressionDto {
  GZIP = 'gzip',
  BROTLI = 'brotli',
}

export class BulkUpdateDto {
  @IsArray()
  @IsString({ each: true })
  leadIds: string[];

  updates: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return Boolean(value);
  })
  validateData?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  @Transform(({ value }) => parseInt(value))
  batchSize?: number;
}

export class BulkStatusUpdateDto {
  @IsArray()
  @IsString({ each: true })
  leadIds: string[];

  @IsEnum(LeadStatusDto)
  newStatus: LeadStatusDto;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  actor?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  @Transform(({ value }) => parseInt(value))
  batchSize?: number;
}

export class BulkImportDto {
  @IsArray()
  data: any[];

  @IsOptional()
  @IsEnum(ImportFormatDto)
  format?: ImportFormatDto;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return Boolean(value);
  })
  validateOnly?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return Boolean(value);
  })
  skipInvalid?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  @Transform(({ value }) => parseInt(value))
  batchSize?: number;

  @IsOptional()
  @IsEnum(DuplicateHandlingDto)
  duplicateHandling?: DuplicateHandlingDto;

  @IsOptional()
  customFieldMapping?: Record<string, string>;
}

export class BulkExportDto {
  @IsOptional()
  @IsEnum(ExportFormatDto)
  format?: ExportFormatDto;

  @IsOptional()
  filters?: any;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fields?: string[];

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return Boolean(value);
  })
  includeRelated?: boolean;

  @IsOptional()
  @IsEnum(CompressionDto)
  compression?: CompressionDto;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100000)
  @Transform(({ value }) => parseInt(value))
  maxRecords?: number;

  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(5000)
  @Transform(({ value }) => parseInt(value))
  chunkSize?: number;
}

// Advanced DTOs for complex operations

export class AdvancedBulkUpdateDto extends BulkUpdateDto {
  @IsOptional()
  @IsBoolean()
  createEvents?: boolean;

  @IsOptional()
  @IsString()
  eventReason?: string;

  @IsOptional()
  @IsBoolean()
  notifyUsers?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  notificationRecipients?: string[];
}

export class ConditionalBulkUpdateDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkUpdateConditionDto)
  conditions: BulkUpdateConditionDto[];

  updates: Record<string, any>;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  batchSize?: number;
}

export class BulkUpdateConditionDto {
  @IsString()
  field: string;

  @IsString()
  operator: string; // eq, ne, gt, lt, in, etc.

  value: any;
}

export class BulkDeleteDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  leadIds?: string[];

  @IsOptional()
  filters?: any;

  @IsOptional()
  @IsBoolean()
  softDelete?: boolean;

  @IsOptional()
  @IsString()
  deleteReason?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  batchSize?: number;
}

export class BulkExportWithFiltersDto extends BulkExportDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => ExportFiltersDto)
  advancedFilters?: ExportFiltersDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExportSortDto)
  sorting?: ExportSortDto[];

  @IsOptional()
  @IsString()
  filename?: string;

  @IsOptional()
  @IsBoolean()
  includeHeaders?: boolean;

  @IsOptional()
  @IsString()
  dateFormat?: string;
}

export class ExportFiltersDto {
  @IsOptional()
  @IsArray()
  @IsEnum(LeadStatusDto, { each: true })
  status?: LeadStatusDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  source?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => DateRangeDto)
  dateRange?: DateRangeDto;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  complianceType?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  severity?: string[];
}

export class DateRangeDto {
  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;
}

export class ExportSortDto {
  @IsString()
  field: string;

  @IsEnum(['asc', 'desc'])
  direction: 'asc' | 'desc';
}

// Response DTOs

export class BulkOperationResultDto {
  operationId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  totalRecords: number;
  processedRecords: number;
  successCount: number;
  errorCount: number;
  errors: BulkOperationErrorDto[];
  startTime: string;
  endTime?: string;
  executionTime?: number;
  metadata?: Record<string, any>;
}

export class BulkOperationErrorDto {
  recordIndex?: number;
  recordId?: string;
  field?: string;
  error: string;
  code?: string;
}

export class ImportValidationResultDto {
  isValid: boolean;
  validRecords: number;
  invalidRecords: number;
  errors: BulkOperationErrorDto[];
  warnings: string[];
  fieldMapping: Record<string, string>;
  preview: any[];
}

export class BulkOperationStatsDto {
  totalOperations: number;
  completedOperations: number;
  failedOperations: number;
  avgProcessingTime: number;
  operationsByType: Record<string, number>;
  recentOperations: Array<{
    operationId: string;
    type: string;
    status: string;
    recordCount: number;
    timestamp: string;
  }>;
}

// Template DTOs

export class ImportTemplateDto {
  source: string;
  complianceType?: string;
  severity?: string;
  scanId?: string;
  findingCategory?: string;
  recommendation?: string;
  autoActionable?: boolean;
  slaDeadline?: string;
  affectedSystems?: string[];
  evidence?: Record<string, any>;
}

export class UpdateTemplateDto {
  leadIds: string[];
  updates: Record<string, any>;
  validateData?: boolean;
  batchSize?: number;
}

export class StatusUpdateTemplateDto {
  leadIds: string[];
  newStatus: LeadStatusDto;
  reason?: string;
  batchSize?: number;
}

// Validation groups for different use cases
export const BULK_UPDATE_GROUP = 'bulk_update';
export const BULK_IMPORT_GROUP = 'bulk_import';
export const BULK_EXPORT_GROUP = 'bulk_export';
export const BULK_DELETE_GROUP = 'bulk_delete';
export const TEMPLATE_GROUP = 'template';