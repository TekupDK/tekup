import { IsString, IsEmail, IsOptional, IsInt, IsArray, IsNumber, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLeadDto {
  @ApiPropertyOptional({ example: 'ses_123abc', description: 'Chat session ID' })
  @IsOptional()
  @IsString()
  sessionId?: string;

  @ApiPropertyOptional({ example: 'cus_123abc', description: 'Customer ID if already exists' })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiPropertyOptional({ example: 'website', description: 'Lead source' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  source?: string;

  @ApiPropertyOptional({ example: 'John Doe', description: 'Lead name' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ example: 'john@example.com', description: 'Email address' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+4512345678', description: 'Phone number' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @ApiPropertyOptional({ example: 'Hovedgade 123, 1000 København', description: 'Address' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 85.5, description: 'Square meters to clean' })
  @IsOptional()
  @IsNumber()
  squareMeters?: number;

  @ApiPropertyOptional({ example: 3, description: 'Number of rooms' })
  @IsOptional()
  @IsInt()
  rooms?: number;

  @ApiPropertyOptional({ example: 'standard', description: 'Type of cleaning task' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  taskType?: string;

  @ApiPropertyOptional({ 
    description: 'Preferred dates for service', 
    type: [String], 
    example: ['2024-01-15', '2024-01-16'] 
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredDates?: string[];

  @ApiPropertyOptional({ example: 'idempotency_key_123', description: 'Idempotency key for deduplication' })
  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}
