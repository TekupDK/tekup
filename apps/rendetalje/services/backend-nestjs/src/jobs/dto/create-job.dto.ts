import { IsUUID, IsEnum, IsDateString, IsInt, Min, Max, IsObject, IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceType } from '../entities/job.entity';

class AddressDto {
  @ApiProperty({ example: 'Hovedgade 123', description: 'Street address' })
  @IsString()
  street: string;

  @ApiProperty({ example: 'København', description: 'City' })
  @IsString()
  city: string;

  @ApiProperty({ example: '1000', description: 'Postal code' })
  @IsString()
  postal_code: string;

  @ApiProperty({ example: 'Denmark', description: 'Country' })
  @IsString()
  country: string;

  @ApiPropertyOptional({ 
    description: 'GPS coordinates',
    example: { lat: 55.6761, lng: 12.5683 }
  })
  @IsOptional()
  @IsObject()
  coordinates?: {
    lat: number;
    lng: number;
  };
}

class ChecklistItemDto {
  @ApiProperty({ example: 'vacuum_floors', description: 'Checklist item ID' })
  @IsString()
  id: string;

  @ApiProperty({ example: 'Støvsug alle gulve', description: 'Checklist item title' })
  @IsString()
  title: string;

  @ApiProperty({ example: false, description: 'Whether item is completed' })
  @IsOptional()
  completed?: boolean = false;

  @ApiProperty({ example: true, description: 'Whether photo is required' })
  @IsOptional()
  photo_required?: boolean = false;

  @ApiPropertyOptional({ example: 'https://example.com/photo.jpg', description: 'Photo URL' })
  @IsOptional()
  @IsString()
  photo_url?: string;

  @ApiPropertyOptional({ example: 'Extra notes', description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateJobDto {
  @ApiProperty({ example: '00000000-0000-0000-0000-000000000002', description: 'Customer ID' })
  @IsUUID()
  customer_id: string;

  @ApiProperty({ enum: ServiceType, example: ServiceType.STANDARD, description: 'Type of service' })
  @IsEnum(ServiceType)
  service_type: ServiceType;

  @ApiProperty({ example: '2024-01-15T10:00:00.000Z', description: 'Scheduled date and time' })
  @IsDateString()
  scheduled_date: string;

  @ApiProperty({ example: 120, description: 'Estimated duration in minutes', minimum: 30, maximum: 480 })
  @IsInt()
  @Min(30)
  @Max(480)
  estimated_duration: number;

  @ApiProperty({ description: 'Job location address' })
  @ValidateNested()
  @Type(() => AddressDto)
  location: AddressDto;

  @ApiPropertyOptional({ example: 'Ring på før ankomst', description: 'Special instructions' })
  @IsOptional()
  @IsString()
  special_instructions?: string;

  @ApiPropertyOptional({ description: 'Job checklist items' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChecklistItemDto)
  checklist?: ChecklistItemDto[];

  @ApiPropertyOptional({ example: '00000000-0000-0000-0000-000000000003', description: 'Recurring job template ID' })
  @IsOptional()
  @IsUUID()
  recurring_job_id?: string;
}