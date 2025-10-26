import { IsString, IsOptional, IsEnum, IsArray, IsNumber, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CleaningType, VisitFrequency } from '@prisma/client';

export class CreateCustomerLocationDto {
  @ApiProperty({
    description: 'Location name',
    example: 'Hovedkontor',
  })
  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  name: string;

  @ApiProperty({
    description: 'Location address',
    example: 'Vesterbrogade 123',
  })
  @IsString()
  @MinLength(5, { message: 'Address must be at least 5 characters long' })
  address: string;

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
    description: 'Square meters of the location',
    example: 500,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  squareMeters?: number;

  @ApiProperty({
    description: 'Type of cleaning required',
    enum: CleaningType,
    example: CleaningType.OFFICE,
    required: false,
  })
  @IsOptional()
  @IsEnum(CleaningType, { message: 'Please provide a valid cleaning type' })
  cleaningType?: CleaningType;

  @ApiProperty({
    description: 'How often the location needs cleaning',
    enum: VisitFrequency,
    example: VisitFrequency.WEEKLY,
    required: false,
  })
  @IsOptional()
  @IsEnum(VisitFrequency, { message: 'Please provide a valid visit frequency' })
  visitFrequency?: VisitFrequency;

  @ApiProperty({
    description: 'Special requirements for this location',
    example: ['Laboratorie-forrum', 'Miljøvenlige produkter'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specialRequirements?: string[];
}
