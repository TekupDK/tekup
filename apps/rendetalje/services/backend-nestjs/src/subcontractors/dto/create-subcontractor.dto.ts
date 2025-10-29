import { IsString, IsEmail, IsOptional, IsEnum, MinLength, MaxLength, IsUrl, IsPhoneNumber, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum SubcontractorStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

export class CreateSubcontractorDto {
  @ApiProperty({ 
    example: 'RenGør ApS', 
    description: 'Subcontractor company name' 
  })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  companyName: string;

  @ApiProperty({ 
    example: 'Anders Hansen', 
    description: 'Primary contact person name' 
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  contactName: string;

  @ApiProperty({ 
    example: 'anders@rengoer.dk', 
    description: 'Contact email address' 
  })
  @IsEmail()
  email: string;

  @ApiProperty({ 
    example: '+45 12 34 56 78', 
    description: 'Contact phone number' 
  })
  @IsString()
  @Matches(/^(\+45\s?)?[0-9\s]{8,15}$/, {
    message: 'Phone number must be valid Danish format',
  })
  phone: string;

  @ApiPropertyOptional({ 
    example: 'Hovedgade 123, 2000 Frederiksberg', 
    description: 'Business address' 
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @ApiPropertyOptional({ 
    example: 'DK12345678', 
    description: 'CVR number (Danish business registration)' 
  })
  @IsOptional()
  @IsString()
  @Matches(/^DK\d{8}$/, {
    message: 'CVR must be in format DK12345678',
  })
  cvrNumber?: string;

  @ApiPropertyOptional({ 
    example: 'https://rengoer.dk', 
    description: 'Company website' 
  })
  @IsOptional()
  @IsUrl()
  websiteUrl?: string;

  @ApiPropertyOptional({ 
    example: SubcontractorStatus.ACTIVE, 
    description: 'Current status',
    enum: SubcontractorStatus
  })
  @IsOptional()
  @IsEnum(SubcontractorStatus)
  status?: SubcontractorStatus;

  @ApiPropertyOptional({ 
    example: 'Specializes in deep cleaning and carpet services. Reliable and punctual.', 
    description: 'Internal notes' 
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
