import { IsUUID, IsDateString, IsOptional, IsInt, Min, IsString, IsObject, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LocationCoordinates } from '../entities/time-entry.entity';

export class CreateTimeEntryDto {
  @ApiProperty({ example: 'clxxx...', description: 'Team member ID' })
  @IsUUID()
  teamMemberId: string;

  @ApiPropertyOptional({ example: 'clyyy...', description: 'Lead ID' })
  @IsOptional()
  @IsUUID()
  leadId?: string;

  @ApiPropertyOptional({ example: 'clzzz...', description: 'Booking ID' })
  @IsOptional()
  @IsUUID()
  bookingId?: string;

  @ApiProperty({ example: '2024-01-15T08:00:00.000Z', description: 'Start time' })
  @IsDateString()
  startTime: string;

  @ApiPropertyOptional({ example: '2024-01-15T10:30:00.000Z', description: 'End time' })
  @IsOptional()
  @IsDateString()
  endTime?: string;

  @ApiProperty({ example: 15, description: 'Break duration in minutes' })
  @IsInt()
  @Min(0)
  breakDuration: number = 0;

  @ApiPropertyOptional({ example: 'Completed all tasks on schedule', description: 'Notes about the time entry' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @ApiPropertyOptional({ 
    description: 'GPS location for verification',
    example: { lat: 55.6761, lng: 12.5683 }
  })
  @IsOptional()
  @IsObject()
  location?: LocationCoordinates;
}