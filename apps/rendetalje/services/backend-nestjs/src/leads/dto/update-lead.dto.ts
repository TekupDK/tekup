import { PartialType } from '@nestjs/swagger';
import { CreateLeadDto } from './create-lead.dto';
import { IsEnum, IsOptional, IsInt, IsNumber, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { LeadStatus, LeadPriority } from '../entities/lead.entity';

export class UpdateLeadDto extends PartialType(CreateLeadDto) {
  @ApiPropertyOptional({ enum: LeadStatus, description: 'Lead status' })
  @IsOptional()
  @IsEnum(LeadStatus)
  status?: LeadStatus;

  @ApiPropertyOptional({ example: 2, description: 'Number of follow-up attempts' })
  @IsOptional()
  @IsInt()
  followUpAttempts?: number;

  @ApiPropertyOptional({ example: '2024-01-10T10:00:00Z', description: 'Last follow-up date' })
  @IsOptional()
  @IsDateString()
  lastFollowUpDate?: string;

  @ApiPropertyOptional({ example: 'Acme Corp', description: 'Company name from enrichment' })
  @IsOptional()
  companyName?: string;

  @ApiPropertyOptional({ example: 'Technology', description: 'Industry sector' })
  @IsOptional()
  industry?: string;

  @ApiPropertyOptional({ example: '11-50 employees', description: 'Estimated company size' })
  @IsOptional()
  estimatedSize?: string;

  @ApiPropertyOptional({ example: 5000, description: 'Estimated lead value in DKK' })
  @IsOptional()
  @IsNumber()
  estimatedValue?: number;

  @ApiPropertyOptional({ example: 75, description: 'Lead score (0-100)' })
  @IsOptional()
  @IsInt()
  score?: number;

  @ApiPropertyOptional({ enum: LeadPriority, description: 'Lead priority' })
  @IsOptional()
  @IsEnum(LeadPriority)
  priority?: LeadPriority;
}
