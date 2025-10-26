import { IsString, IsOptional, IsEmail, IsEnum, IsBoolean, IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTenantDto {
  @ApiProperty({
    description: 'Tenant name',
    example: 'Rengøringsfirmaet A/S',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Tenant domain (optional)',
    example: 'demo.rengoeringsfirmaet.dk',
    required: false,
  })
  @IsOptional()
  @IsString()
  domain?: string;

  @ApiProperty({
    description: 'Danish CVR number',
    example: '12345678',
    required: false,
  })
  @IsOptional()
  @IsString()
  cvrNumber?: string;

  @ApiProperty({
    description: 'Business address',
    example: 'Hovedgaden 123',
    required: false,
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({
    description: 'City',
    example: 'København',
    required: false,
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({
    description: 'Danish postal code (4 digits)',
    example: '2100',
    required: false,
  })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiProperty({
    description: 'Phone number',
    example: '+45 33 12 34 56',
    required: false,
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    description: 'Email address',
    example: 'info@rengoeringsfirmaet.dk',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    description: 'Subscription tier',
    enum: ['basic', 'professional', 'enterprise'],
    example: 'enterprise',
    required: false,
  })
  @IsOptional()
  @IsEnum(['basic', 'professional', 'enterprise'])
  subscriptionTier?: string;

  @ApiProperty({
    description: 'Maximum number of users',
    example: 50,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  maxUsers?: number;

  @ApiProperty({
    description: 'Maximum number of jobs',
    example: 1000,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10000)
  maxJobs?: number;
}
