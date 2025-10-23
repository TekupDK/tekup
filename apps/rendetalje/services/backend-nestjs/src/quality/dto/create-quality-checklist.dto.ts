import { IsEnum, IsString, IsOptional, IsArray, ValidateNested, IsBoolean, IsInt, Min, Max, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceType } from '../../jobs/entities/job.entity';

class ChecklistItemDto {
  @ApiProperty({ example: 'vacuum_floors', description: 'Unique item ID' })
  @IsString()
  id: string;

  @ApiProperty({ example: 'Støvsug alle gulve', description: 'Item title' })
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ example: 'Støvsug alle gulvtyper grundigt', description: 'Item description' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ example: true, description: 'Whether item is required' })
  @IsBoolean()
  required: boolean;

  @ApiProperty({ example: false, description: 'Whether photo documentation is required' })
  @IsBoolean()
  photo_required: boolean;

  @ApiProperty({ example: 1, description: 'Display order' })
  @IsInt()
  @Min(1)
  order: number;

  @ApiPropertyOptional({ example: 'floors', description: 'Item category' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 5, description: 'Points awarded for completion' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  points?: number;
}

export class CreateQualityChecklistDto {
  @ApiProperty({ enum: ServiceType, example: ServiceType.STANDARD, description: 'Service type' })
  @IsEnum(ServiceType)
  service_type: ServiceType;

  @ApiProperty({ example: 'Standard Cleaning Checklist', description: 'Checklist name' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: 'Comprehensive checklist for standard cleaning services', description: 'Checklist description' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ description: 'Checklist items' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChecklistItemDto)
  items: ChecklistItemDto[];
}