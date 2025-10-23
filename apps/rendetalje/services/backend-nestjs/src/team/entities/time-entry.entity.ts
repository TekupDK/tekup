import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseEntity } from '../../common/entities/base.entity';

export interface LocationCoordinates {
  lat: number;
  lng: number;
}

export class TimeEntry extends BaseEntity {
  @ApiProperty({ example: '00000000-0000-0000-0000-000000000001', description: 'Job ID' })
  job_id: string;

  @ApiProperty({ example: '00000000-0000-0000-0000-000000000002', description: 'Team member ID' })
  team_member_id: string;

  @ApiProperty({ example: '2024-01-15T08:00:00.000Z', description: 'Start time' })
  start_time: string;

  @ApiPropertyOptional({ example: '2024-01-15T10:30:00.000Z', description: 'End time' })
  end_time?: string;

  @ApiProperty({ example: 15, description: 'Break duration in minutes' })
  break_duration: number;

  @ApiPropertyOptional({ example: 'Completed all tasks on schedule', description: 'Notes about the time entry' })
  notes?: string;

  @ApiPropertyOptional({ 
    description: 'GPS location for verification',
    example: { lat: 55.6761, lng: 12.5683 }
  })
  location?: LocationCoordinates;
}