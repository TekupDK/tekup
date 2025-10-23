import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseEntity } from '../../common/entities/base.entity';

export class TimeEntry extends BaseEntity {
  @ApiPropertyOptional({ example: '00000000-0000-0000-0000-000000000001', description: 'Associated job ID' })
  job_id?: string;

  @ApiProperty({ example: '00000000-0000-0000-0000-000000000001', description: 'Team member ID' })
  team_member_id: string;

  @ApiProperty({ example: '2024-01-15T08:00:00Z', description: 'Start time of work' })
  start_time: string;

  @ApiPropertyOptional({ example: '2024-01-15T17:00:00Z', description: 'End time of work' })
  end_time?: string;

  @ApiProperty({ example: 30, description: 'Break duration in minutes' })
  break_duration: number;

  @ApiPropertyOptional({ example: 'Worked on customer site cleanup', description: 'Notes about the work performed' })
  notes?: string;
}