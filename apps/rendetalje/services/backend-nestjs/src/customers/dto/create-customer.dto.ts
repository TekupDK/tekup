import { IsString, IsEmail, IsOptional, IsObject, ValidateNested, IsPhoneNumber, MaxLength, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class CustomerAddressDto {
  @ApiProperty({ example: 'Hovedgade 123', description: 'Street address' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  street: string;

  @ApiProperty({ example: 'København', description: 'City' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  city: string;

  @ApiProperty({ example: '1000', description: 'Postal code' })
  @IsString()
  postal_code: string;

  @ApiProperty({ example: 'Denmark', description: 'Country' })
  @IsString()
  @MaxLength(100)
  country: string;
}

class CustomerPreferencesDto {
  @ApiPropertyOptional({ example: 'morning', description: 'Preferred time of day' })
  @IsOptional()
  @IsString()
  preferred_time?: string;

  @ApiPropertyOptional({ example: 'Ring på før ankomst', description: 'Special instructions' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  special_instructions?: string;

  @ApiPropertyOptional({ example: 'Under dørmåtten', description: 'Key location' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  key_location?: string;

  @ApiPropertyOptional({ example: 'phone', description: 'Preferred contact method', enum: ['email', 'phone', 'sms'] })
  @IsOptional()
  @IsString()
  contact_method?: 'email' | 'phone' | 'sms';
}

export class CreateCustomerDto {
  @ApiProperty({ example: 'John Doe', description: 'Customer full name' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: 'john.doe@example.com', description: 'Customer email address' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+45 12 34 56 78', description: 'Customer phone number' })
  @IsOptional()
  @IsPhoneNumber()
  phone?: string;

  @ApiProperty({ description: 'Customer address' })
  @ValidateNested()
  @Type(() => CustomerAddressDto)
  address: CustomerAddressDto;

  @ApiPropertyOptional({ description: 'Customer preferences' })
  @IsOptional()
  @ValidateNested()
  @Type(() => CustomerPreferencesDto)
  preferences?: CustomerPreferencesDto;

  @ApiPropertyOptional({ example: 'VIP customer, always pays on time', description: 'Internal notes about customer' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}