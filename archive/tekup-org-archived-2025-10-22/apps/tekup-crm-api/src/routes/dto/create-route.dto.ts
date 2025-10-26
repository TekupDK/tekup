import { IsString, IsOptional, IsArray, IsDateString, IsObject, IsUUID, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRouteDto {
  @ApiProperty({
    description: 'Team member ID',
    example: 'tm-123',
  })
  @IsString()
  @IsUUID()
  teamMemberId: string;

  @ApiProperty({
    description: 'Route date',
    example: '2025-09-15',
  })
  @IsDateString()
  date: string;

  @ApiProperty({
    description: 'Array of job IDs to include in route',
    example: ['job-1', 'job-2', 'job-3'],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one job must be provided' })
  @IsString({ each: true })
  @IsUUID('4', { each: true })
  jobIds: string[];

  @ApiProperty({
    description: 'Start location',
    example: {
      address: 'Rengøringsfirmaet A/S',
      city: 'København',
      postalCode: '2100',
      coordinates: { lat: 55.6761, lng: 12.5683 }
    },
    required: false,
  })
  @IsOptional()
  @IsObject()
  startLocation?: any;

  @ApiProperty({
    description: 'End location',
    example: {
      address: 'Rengøringsfirmaet A/S',
      city: 'København',
      postalCode: '2100',
      coordinates: { lat: 55.6761, lng: 12.5683 }
    },
    required: false,
  })
  @IsOptional()
  @IsObject()
  endLocation?: any;
}
