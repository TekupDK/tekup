import { 
  IsString, 
  IsOptional, 
  IsEmail, 
  IsPhoneNumber, 
  MaxLength, 
  IsObject,
  ValidateNested,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsDateString,
  Matches,
  IsNotEmpty,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ValidateWith } from '../validation/validation.pipe.js';

export enum LeadStatus {
  NEW = 'NEW',
  CONTACTED = 'CONTACTED',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export enum SortField {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  STATUS = 'status',
}

export class LeadPayloadDto {
  @ApiPropertyOptional({ 
    description: 'Lead email address',
    example: 'john.doe@example.com',
    maxLength: 255,
  })
  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @MaxLength(255, { message: 'Email must not exceed 255 characters' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email?: string;

  @ApiPropertyOptional({ 
    description: 'Lead phone number',
    example: '+1-555-123-4567',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @Matches(/^[\+]?[0-9\s\-\(\)]{1,20}$/, { 
    message: 'Please provide a valid phone number' 
  })
  @Transform(({ value }) => value?.replace(/[^\d\+\-\(\)\s]/g, ''))
  phone?: string;

  @ApiPropertyOptional({ 
    description: 'Lead full name',
    example: 'John Doe',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Name must not exceed 255 characters' })
  @Transform(({ value }) => value?.trim())
  name?: string;

  @ApiPropertyOptional({ 
    description: 'Lead message or inquiry',
    example: 'I am interested in your services',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000, { message: 'Message must not exceed 2000 characters' })
  @Transform(({ value }) => value?.trim())
  message?: string;

  @ApiPropertyOptional({ 
    description: 'Company name',
    example: 'Acme Corporation',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Company name must not exceed 255 characters' })
  @Transform(({ value }) => value?.trim())
  company?: string;

  @ApiPropertyOptional({ 
    description: 'Job title',
    example: 'Marketing Manager',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Job title must not exceed 255 characters' })
  @Transform(({ value }) => value?.trim())
  jobTitle?: string;
}

@ValidateWith('createLead')
export class CreateLeadDto {
  @ApiProperty({ 
    description: 'Source of the lead',
    example: 'website_form',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty({ message: 'Source is required' })
  @MaxLength(100, { message: 'Source must not exceed 100 characters' })
  @Matches(/^[a-zA-Z0-9_\-]+$/, { 
    message: 'Source can only contain letters, numbers, underscores, and hyphens' 
  })
  @Transform(({ value }) => value?.trim().toLowerCase())
  source: string;

  @ApiProperty({ 
    description: 'Lead payload data',
    type: LeadPayloadDto,
  })
  @IsObject()
  @ValidateNested()
  @Type(() => LeadPayloadDto)
  payload: LeadPayloadDto;
}

@ValidateWith('updateLeadStatus')
export class UpdateLeadStatusDto {
  @ApiProperty({ 
    description: 'New status for the lead',
    enum: LeadStatus,
    example: LeadStatus.CONTACTED,
  })
  @IsEnum(LeadStatus, { 
    message: 'Status must be either NEW or CONTACTED' 
  })
  status: LeadStatus;
}

@ValidateWith('pagination')
export class LeadListDto {
  @ApiPropertyOptional({ 
    description: 'Number of items per page',
    example: 20,
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Limit must be an integer' })
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit cannot exceed 100' })
  limit?: number = 20;

  @ApiPropertyOptional({ 
    description: 'Cursor for pagination',
    example: 'eyJpZCI6IjEyMyIsImNyZWF0ZWRBdCI6IjIwMjMtMTAtMTVUMTA6MDA6MDBaIn0=',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Cursor must not exceed 255 characters' })
  cursor?: string;

  @ApiPropertyOptional({ 
    description: 'Field to sort by',
    enum: SortField,
    example: SortField.CREATED_AT,
    default: SortField.CREATED_AT,
  })
  @IsOptional()
  @IsEnum(SortField, { 
    message: 'Sort field must be one of: createdAt, updatedAt, status' 
  })
  sortField?: SortField = SortField.CREATED_AT;

  @ApiPropertyOptional({ 
    description: 'Sort order',
    enum: SortOrder,
    example: SortOrder.DESC,
    default: SortOrder.DESC,
  })
  @IsOptional()
  @IsEnum(SortOrder, { 
    message: 'Sort order must be either asc or desc' 
  })
  sortOrder?: SortOrder = SortOrder.DESC;

  @ApiPropertyOptional({ 
    description: 'Search term for filtering leads',
    example: 'john@example.com',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Search term must not exceed 255 characters' })
  @Transform(({ value }) => value?.trim())
  search?: string;

  @ApiPropertyOptional({ 
    description: 'Filter by lead status',
    enum: LeadStatus,
    example: LeadStatus.NEW,
  })
  @IsOptional()
  @IsEnum(LeadStatus, { 
    message: 'Status must be either NEW or CONTACTED' 
  })
  status?: LeadStatus;

  @ApiPropertyOptional({ 
    description: 'Filter by lead source',
    example: 'website_form',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Source must not exceed 100 characters' })
  @Transform(({ value }) => value?.trim().toLowerCase())
  source?: string;

  @ApiPropertyOptional({ 
    description: 'Filter leads created after this date',
    example: '2023-10-15T00:00:00Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'createdAfter must be a valid ISO date string' })
  createdAfter?: string;

  @ApiPropertyOptional({ 
    description: 'Filter leads created before this date',
    example: '2023-10-16T00:00:00Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'createdBefore must be a valid ISO date string' })
  createdBefore?: string;
}

@ValidateWith('pagination')
export class PaginationDto {
  @ApiPropertyOptional({ 
    description: 'Number of items per page',
    example: 20,
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Limit must be an integer' })
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit cannot exceed 100' })
  limit?: number = 20;

  @ApiPropertyOptional({ 
    description: 'Cursor for pagination',
    example: 'eyJpZCI6IjEyMyIsImNyZWF0ZWRBdCI6IjIwMjMtMTAtMTVUMTA6MDA6MDBaIn0=',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Cursor must not exceed 255 characters' })
  cursor?: string;

  @ApiPropertyOptional({ 
    description: 'Field to sort by',
    enum: SortField,
    example: SortField.CREATED_AT,
    default: SortField.CREATED_AT,
  })
  @IsOptional()
  @IsEnum(SortField, { 
    message: 'Sort field must be one of: createdAt, updatedAt, status' 
  })
  sortField?: SortField = SortField.CREATED_AT;

  @ApiPropertyOptional({ 
    description: 'Sort order',
    enum: SortOrder,
    example: SortOrder.DESC,
    default: SortOrder.DESC,
  })
  @IsOptional()
  @IsEnum(SortOrder, { 
    message: 'Sort order must be either asc or desc' 
  })
  sortOrder?: SortOrder = SortOrder.DESC;
}

export class HealthCheckDto {
  @ApiPropertyOptional({ 
    description: 'Include detailed service information',
    example: false,
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  detailed?: boolean = false;
}