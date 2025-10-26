import { IsString, IsOptional, IsEnum, IsObject, IsNumber, IsBoolean } from 'class-validator';

/**
 * Proposal Status Enum
 */
export enum ProposalStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

/**
 * Create Proposal DTO
 */
export class CreateProposalDto {
  @IsString()
  transcriptId: string;

  @IsOptional()
  @IsString()
  clientName?: string;

  @IsOptional()
  @IsString()
  projectType?: string;

  @IsOptional()
  @IsNumber()
  estimatedValue?: number;

  @IsOptional()
  @IsString()
  urgency?: 'low' | 'medium' | 'high';

  @IsOptional()
  @IsObject()
  customInstructions?: Record<string, any>;

  @IsOptional()
  @IsString()
  templateId?: string;

  @IsOptional()
  @IsBoolean()
  includeResearch?: boolean = true;

  @IsOptional()
  @IsBoolean()
  includePricing?: boolean = true;

  @IsOptional()
  @IsString()
  tone?: 'professional' | 'friendly' | 'urgent' | 'consultative';
}

/**
 * Proposal Response DTO
 */
export class ProposalResponse {
  @IsBoolean()
  success: boolean;

  @IsOptional()
  proposal?: any;

  @IsString()
  message: string;
}

/**
 * Buying Signal DTO
 */
export class BuyingSignalDto {
  @IsString()
  type: 'pain_point' | 'budget_indicator' | 'timeline_signal' | 'decision_maker' | 'competitor_mention';

  @IsString()
  content: string;

  @IsNumber()
  confidence: number; // 0-1

  @IsString()
  context: string;

  @IsNumber()
  timestamp: number; // seconds into transcript
}

/**
 * Research Context DTO
 */
export class ResearchContextDto {
  @IsString()
  topic: string;

  @IsString()
  content: string;

  @IsString()
  source: string;

  @IsString()
  url?: string;

  @IsNumber()
  relevanceScore: number; // 0-1
}

/**
 * Narrative Section DTO
 */
export class NarrativeSectionDto {
  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsString()
  type: 'introduction' | 'problem_analysis' | 'solution_overview' | 'pricing' | 'timeline' | 'conclusion';

  @IsNumber()
  order: number;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

/**
 * Document Assembly DTO
 */
export class DocumentAssemblyDto {
  @IsString()
  title: string;

  @IsString()
  clientName: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NarrativeSectionDto)
  sections: NarrativeSectionDto[];

  @IsOptional()
  @IsObject()
  styling?: {
    fontFamily?: string;
    primaryColor?: string;
    secondaryColor?: string;
    logoUrl?: string;
  };

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

/**
 * MCP Agent Execution DTO
 */
export class MCPAgentExecutionDto {
  @IsString()
  proposalId: string;

  @IsString()
  tenantId: string;

  @IsString()
  transcriptId: string;

  @ValidateNested()
  @Type(() => CreateProposalDto)
  options: CreateProposalDto;
}

/**
 * MCP Agent Result DTO
 */
export class MCPAgentResultDto {
  @IsBoolean()
  success: boolean;

  @IsOptional()
  @IsString()
  documentUrl?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsString()
  error?: string;
}

// Import validation decorators
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';