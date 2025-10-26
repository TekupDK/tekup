import { IsString, IsEnum, IsOptional, IsBoolean, IsArray, IsObject, IsUUID } from 'class-validator';

export enum ComplianceTypeDto {
  NIS2_FINDING = 'nis2_finding',
  COPILOT_RISK = 'copilot_risk',
  BACKUP_FAILURE = 'backup_failure'
}

export enum SeverityLevelDto {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export class CreateComplianceLeadDto {
  @IsEnum(ComplianceTypeDto)
  type!: ComplianceTypeDto;

  @IsEnum(SeverityLevelDto)
  severity!: SeverityLevelDto;

  @IsString()
  scanId!: string;

  @IsString()
  category!: string;

  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsString()
  recommendation!: string;

  @IsBoolean()
  hasQuickFix!: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  affectedSystems?: string[];

  @IsOptional()
  @IsObject()
  evidence?: object;

  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsString()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;
}

export class ComplianceLeadResponseDto {
  @IsUUID()
  leadId!: string;

  @IsString()
  slaDeadline!: string; // ISO datetime

  @IsBoolean()
  autoActionable!: boolean;

  @IsString()
  estimatedEffort!: string;

  @IsString()
  status!: string;
}