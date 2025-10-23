import { IsUUID, IsDateString, IsOptional, IsInt, Min, IsString, IsObject, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LocationCoordinates } from '../entities/time-entry.entity';

export class CreateTimeEntryDto {
  @ApiProperty({ example: '00000000-0000-0000-0000-000000000001', description: 'Job ID' })
  @IsUUID()
  job_id: string;

  @ApiProperty({ example: '00000000-0000-0000-0000-000000000002', description: 'Team member ID' })
  @IsUUID()
  team_member_id: string;

  @ApiProperty({ example: '2024-01-15T08:00:00.000Z', description: 'Start time' })
  @IsDateString()
  start_time: string;

  @ApiPropertyOptional({ example: '2024-01-15T10:30:00.000Z', description: 'End time' })
  @IsOptional()
  @IsDateString()
  end_time?: string;

  @ApiProperty({ example: 15, description: 'Break duration in minutes' })
  @IsInt()
  @Min(0)
  break_duration: number = 0;

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