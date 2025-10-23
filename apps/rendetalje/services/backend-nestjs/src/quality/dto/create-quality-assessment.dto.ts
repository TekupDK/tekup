import { IsUUID, IsArray, ValidateNested, IsOptional, IsString, IsBoolean, IsInt, Min, Max, IsDateString, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class CompletedItemDto {
  @ApiProperty({ example: 'vacuum_floors', description: 'Checklist item ID' })
  @IsString()
  id: string;

  @ApiProperty({ example: true, description: 'Whether item was completed' })
  @IsBoolean()
  completed: boolean;

  @ApiProperty({ 
    description: 'Photo URLs for documentation',
    example: ['https://example.com/photo1.jpg', 'https://example.com/photo2.jpg']
  })
  @IsArray()
  @IsString({ each: true })
  photo_urls: string[];

  @ApiPropertyOptional({ example: 'Extra attention given to corners', description: 'Additional notes' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @ApiPropertyOptional({ example: 5, description: 'Points earned for this item' })
  @IsOptional()
  @IsInt()
  @Min(0)
  points_earned?: number;

  @ApiPropertyOptional({ example: '2024-01-15T10:30:00.000Z', description: 'When item was completed' })
  @IsOptional()
  @IsDateString()
  completion_time?: string;
}

export class CreateQualityAssessmentDto {
  @ApiProperty({ example: '00000000-0000-0000-0000-000000000001', description: 'Job ID' })
  @IsUUID()
  job_id: string;

  @ApiProperty({ example: '00000000-0000-0000-0000-000000000002', description: 'Quality checklist ID' })
  @IsUUID()
  checklist_id: string;

  @ApiProperty({ description: 'Completed checklist items' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CompletedItemDto)
  completed_items: CompletedItemDto[];

  @ApiProperty({ example: 4, description: 'Overall quality score (1-5)', minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  overall_score: number;

  @ApiPropertyOptional({ example: 'Excellent work, all areas cleaned thoroughly', description: 'Assessment notes' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}