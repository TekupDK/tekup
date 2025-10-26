import { IsString, IsOptional, IsEmail, IsEnum, IsArray, IsNumber, IsDateString, IsObject, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CustomerSegment, ServiceLevel } from '@prisma/client';

export class CreateCustomerDto {
  @ApiProperty({
    description: 'Customer name',
    example: 'Copenhagen Business Center',
  })
  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  name: string;

  @ApiProperty({
    description: 'Customer segment',
    enum: CustomerSegment,
    example: CustomerSegment.COMMERCIAL,
    required: false,
  })
  @IsOptional()
  @IsEnum(CustomerSegment, { message: 'Please provide a valid customer segment' })
  segment?: CustomerSegment;

  @ApiProperty({
    description: 'Customer email address',
    example: 'kontakt@cbcenter.dk',
    required: false,
  })
  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email?: string;

  @ApiProperty({
    description: 'Customer phone number',
    example: '+45 33 12 34 56',
    required: false,
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    description: 'Customer website',
    example: 'https://cbcenter.dk',
    required: false,
  })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiProperty({
    description: 'Business address',
    example: 'Vesterbrogade 123',
    required: false,
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({
    description: 'City',
    example: 'København V',
    required: false,
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({
    description: 'Danish postal code (4 digits)',
    example: '1620',
    required: false,
  })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiProperty({
    description: 'Danish CVR number',
    example: '87654321',
    required: false,
  })
  @IsOptional()
  @IsString()
  cvrNumber?: string;

  @ApiProperty({
    description: 'Annual contract value in DKK',
    example: 500000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  annualContractValue?: number;

  @ApiProperty({
    description: 'Contract start date',
    example: '2025-01-01',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  contractStart?: string;

  @ApiProperty({
    description: 'Contract end date',
    example: '2025-12-31',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  contractEnd?: string;

  @ApiProperty({
    description: 'Service level',
    enum: ServiceLevel,
    example: ServiceLevel.ENTERPRISE,
    required: false,
  })
  @IsOptional()
  @IsEnum(ServiceLevel, { message: 'Please provide a valid service level' })
  serviceLevel?: ServiceLevel;

  @ApiProperty({
    description: 'Cleaning preferences',
    example: {
      preferredTime: 'evening',
      accessMethod: 'doorman',
      specialInstructions: ['Ingen støj efter 20:00'],
      allergyNotes: ['Ingen nødder i kantineområder'],
      fragrance: 'none',
      environmentalPreferences: 'eco'
    },
    required: false,
  })
  @IsOptional()
  @IsObject()
  cleaningPreferences?: any;

  @ApiProperty({
    description: 'Access instructions',
    example: 'Reception, 2. sal til højre',
    required: false,
  })
  @IsOptional()
  @IsString()
  accessInstructions?: string;

  @ApiProperty({
    description: 'Special requirements',
    example: ['Miljøvenlige produkter kun', 'Ingen kemikalier i laboratorieområder'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specialRequirements?: string[];
}
