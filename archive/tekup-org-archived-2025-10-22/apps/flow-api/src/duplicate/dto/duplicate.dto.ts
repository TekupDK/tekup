import { IsString, IsOptional, IsArray, IsNumber, IsBoolean, IsEnum, ValidateNested, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class FindDuplicatesDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fieldsToCheck?: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  @Transform(({ value }) => parseFloat(value))
  threshold?: number;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return Boolean(value);
  })
  includeResolved?: boolean;
}

export class MergeDuplicatesDto {
  @IsString()
  sourceLeadId: string;

  @IsString()
  targetLeadId: string;

  @IsOptional()
  fieldResolutions?: Record<string, any>;

  @IsOptional()
  @IsString()
  mergeReason?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return Boolean(value);
  })
  createAuditTrail?: boolean;
}

export class UpdateConfigDto {
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return Boolean(value);
  })
  enabled?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  @Transform(({ value }) => parseFloat(value))
  threshold?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fieldsToCompare?: string[];

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return Boolean(value);
  })
  fuzzyMatchingEnabled?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  @Transform(({ value }) => parseFloat(value))
  fuzzyThreshold?: number;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return Boolean(value);
  })
  autoMergeEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return Boolean(value);
  })
  notificationEnabled?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DuplicateRuleDto)
  customRules?: DuplicateRuleDto[];
}

export class DuplicateRuleDto {
  @IsString()
  name: string;

  @IsArray()
  @IsString({ each: true })
  fields: string[];

  @IsNumber()
  @Min(0)
  @Max(1)
  @Transform(({ value }) => parseFloat(value))
  weight: number;

  @IsEnum(['exact', 'fuzzy', 'regex'])
  condition: 'exact' | 'fuzzy' | 'regex';

  @IsOptional()
  @IsString()
  pattern?: string;
}

export class ResolveGroupDto {
  @IsEnum(['merged', 'separate', 'manual'])
  resolutionMethod: 'merged' | 'separate' | 'manual';

  @IsOptional()
  @IsString()
  primaryLeadId?: string;

  @IsOptional()
  @IsString()
  resolutionNotes?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return Boolean(value);
  })
  notifyUsers?: boolean;
}

export class BulkCheckDto {
  @IsArray()
  @IsString({ each: true })
  leadIds: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  @Transform(({ value }) => parseFloat(value))
  threshold?: number;
}

// Response DTOs

export class DuplicateCandidateDto {
  @IsString()
  leadId: string;

  @IsNumber()
  @Min(0)
  @Max(1)
  similarityScore: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  confidenceScore: number;

  @IsArray()
  @IsString({ each: true })
  matchedFields: string[];

  details: Record<string, any>;
}

export class DuplicateGroupDto {
  @IsString()
  groupId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DuplicateCandidateDto)
  candidates: DuplicateCandidateDto[];

  @IsString()
  primaryLeadId: string;

  @IsString()
  createdAt: string;

  @IsBoolean()
  resolved: boolean;

  @IsOptional()
  @IsEnum(['merged', 'separate', 'manual'])
  resolutionMethod?: 'merged' | 'separate' | 'manual';
}

export class MergeOperationDto {
  @IsString()
  sourceLeadId: string;

  @IsString()
  targetLeadId: string;

  mergedFields: Record<string, any>;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MergeConflictDto)
  conflicts: MergeConflictDto[];

  @IsString()
  performedBy: string;

  @IsString()
  performedAt: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MergeAuditEventDto)
  auditTrail: MergeAuditEventDto[];
}

export class MergeConflictDto {
  @IsString()
  field: string;

  sourceValue: any;

  targetValue: any;

  @IsEnum(['source', 'target', 'custom'])
  resolution: 'source' | 'target' | 'custom';

  @IsOptional()
  customValue?: any;
}

export class MergeAuditEventDto {
  @IsString()
  timestamp: string;

  @IsString()
  action: string;

  @IsString()
  actor: string;

  @IsOptional()
  details?: Record<string, any>;
}

export class DuplicateDetectionConfigDto {
  @IsString()
  tenantId: string;

  @IsBoolean()
  enabled: boolean;

  @IsNumber()
  @Min(0)
  @Max(1)
  threshold: number;

  @IsArray()
  @IsString({ each: true })
  fieldsToCompare: string[];

  @IsBoolean()
  fuzzyMatchingEnabled: boolean;

  @IsNumber()
  @Min(0)
  @Max(1)
  fuzzyThreshold: number;

  @IsBoolean()
  autoMergeEnabled: boolean;

  @IsBoolean()
  notificationEnabled: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DuplicateRuleDto)
  customRules?: DuplicateRuleDto[];
}

// Advanced DTOs

export class AdvancedDuplicateCheckDto extends FindDuplicatesDto {
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return Boolean(value);
  })
  useMachineLearning?: boolean;

  @IsOptional()
  @IsString()
  modelVersion?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  excludeLeadIds?: string[];

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  @Transform(({ value }) => parseInt(value))
  maxResults?: number;
}

export class BulkMergeDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MergePairDto)
  mergePairs: MergePairDto[];

  @IsOptional()
  @IsString()
  batchName?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return Boolean(value);
  })
  stopOnError?: boolean;
}

export class MergePairDto {
  @IsString()
  sourceLeadId: string;

  @IsString()
  targetLeadId: string;

  @IsOptional()
  fieldResolutions?: Record<string, any>;
}

export class DuplicateStatsDto {
  @IsString()
  tenantId: string;

  @IsNumber()
  totalGroups: number;

  @IsNumber()
  unresolvedGroups: number;

  @IsNumber()
  autoMerged: number;

  @IsNumber()
  manuallyMerged: number;

  @IsNumber()
  falsePositives: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  accuracyRate: number;

  @IsString()
  lastChecked: string;
}

// Validation groups

export const DUPLICATE_CHECK_GROUP = 'duplicate_check';
export const MERGE_DUPLICATES_GROUP = 'merge_duplicates';
export const CONFIG_UPDATE_GROUP = 'config_update';
export const BULK_CHECK_GROUP = 'bulk_check';
export const RESOLVE_GROUP = 'resolve_group';