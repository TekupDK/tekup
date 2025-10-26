import { IsString, IsOptional, IsEnum, IsArray, IsNumber, IsDateString, IsObject, MinLength, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CleaningJobType, JobPriority } from '@prisma/client';

export class CreateJobDto {
  @ApiProperty({
    description: 'Customer ID',
    example: 'cust-123',
  })
  @IsString()
  @IsUUID()
  customerId: string;

  @ApiProperty({
    description: 'Customer location ID (optional)',
    example: 'loc-123',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsUUID()
  locationId?: string;

  @ApiProperty({
    description: 'Job title',
    example: 'Ugeligt kontorrenhold - Hovedkontor',
  })
  @IsString()
  @MinLength(5, { message: 'Title must be at least 5 characters long' })
  title: string;

  @ApiProperty({
    description: 'Job description',
    example: 'Fuld rengøring af kontorområder, køkkener, toiletter og mødelokaler.',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Type of cleaning job',
    enum: CleaningJobType,
    example: CleaningJobType.KONTORRENHOLD,
  })
  @IsEnum(CleaningJobType, { message: 'Please provide a valid job type' })
  jobType: CleaningJobType;

  @ApiProperty({
    description: 'Job priority',
    enum: JobPriority,
    example: JobPriority.HIGH,
    required: false,
  })
  @IsOptional()
  @IsEnum(JobPriority, { message: 'Please provide a valid priority' })
  priority?: JobPriority;

  @ApiProperty({
    description: 'Scheduled date',
    example: '2025-09-15T18:00:00Z',
  })
  @IsDateString()
  scheduledDate: string;

  @ApiProperty({
    description: 'Scheduled time (HH:MM format)',
    example: '18:00',
  })
  @IsString()
  scheduledTime: string;

  @ApiProperty({
    description: 'Estimated duration in minutes',
    example: 240,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  estimatedDuration?: number;

  @ApiProperty({
    description: 'Location details',
    example: {
      address: 'Vesterbrogade 123',
      city: 'København V',
      postalCode: '1620',
      coordinates: { lat: 55.6761, lng: 12.5683 },
      accessInstructions: 'Reception, 2. sal til højre',
      parkingInstructions: 'Besøgsparking i gård, maks 4 timer',
      floor: 2
    },
    required: false,
  })
  @IsOptional()
  @IsObject()
  locationDetails?: any;

  @ApiProperty({
    description: 'Recurring configuration',
    example: {
      frequency: 'weekly',
      interval: 1,
      weekdays: [1, 3, 5],
      skipHolidays: true,
      autoConfirm: true
    },
    required: false,
  })
  @IsOptional()
  @IsObject()
  recurringConfig?: any;

  @ApiProperty({
    description: 'Equipment requirements',
    example: [
      { name: 'Støvsuger - industriel', quantity: 2, required: true },
      { name: 'Gulvvasker', quantity: 1, required: true }
    ],
    required: false,
  })
  @IsOptional()
  @IsArray()
  equipmentRequirements?: any[];

  @ApiProperty({
    description: 'Supply requirements',
    example: [
      { name: 'Øko rengøringsmiddel', quantity: 2, unit: 'liter', cost: 45 },
      { name: 'Mikrofiberklude', quantity: 10, unit: 'stk', cost: 125 }
    ],
    required: false,
  })
  @IsOptional()
  @IsArray()
  supplyRequirements?: any[];

  @ApiProperty({
    description: 'Special requirements',
    example: ['Miljøvenlige produkter kun', 'Ingen kemikalier i laboratorieområder'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specialRequirements?: string[];

  @ApiProperty({
    description: 'Cost details',
    example: {
      basePrice: 2800,
      hourlyRate: 350,
      supplies: 205,
      equipment: 0,
      total: 3005,
      currency: 'DKK',
      invoiced: false
    },
    required: false,
  })
  @IsOptional()
  @IsObject()
  costDetails?: any;
}
