import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseEntity } from '../../common/entities/base.entity';

export class TimeCorrection extends BaseEntity {
  @ApiProperty({ example: '00000000-0000-0000-0000-000000000001', description: 'Original time entry ID' })
  original_entry_id: string;

  @ApiProperty({ example: '2024-01-15T08:00:00Z', description: 'Original start time' })
  original_start_time: string;

  @ApiPropertyOptional({ example: '2024-01-15T17:00:00Z', description: 'Original end time' })
  original_end_time?: string;

  @ApiProperty({ example: 30, description: 'Original break duration in minutes' })
  original_break_duration: number;

  @ApiProperty({ example: '2024-01-15T08:15:00Z', description: 'Corrected start time' })
  corrected_start_time: string;

  @ApiPropertyOptional({ example: '2024-01-15T17:15:00Z', description: 'Corrected end time' })
  corrected_end_time?: string;

  @ApiProperty({ example: 45, description: 'Corrected break duration in minutes' })
  corrected_break_duration: number;

  @ApiProperty({ example: 'Forgot to clock in on time', description: 'Reason for the correction' })
  reason: string;

  @ApiProperty({ example: 'pending', enum: ['pending', 'approved', 'rejected'], description: 'Status of the correction' })
  status: 'pending' | 'approved' | 'rejected';

  @ApiProperty({ example: '00000000-0000-0000-0000-000000000001', description: 'User who submitted the correction' })
  submitted_by: string;

  @ApiPropertyOptional({ example: '00000000-0000-0000-0000-000000000001', description: 'User who approved the correction' })
  approved_by?: string;

  @ApiPropertyOptional({ example: '2024-01-16T09:00:00Z', description: 'When the correction was approved' })
  approved_at?: string;

  @ApiPropertyOptional({ example: '00000000-0000-0000-0000-000000000001', description: 'User who rejected the correction' })
  rejected_by?: string;

  @ApiPropertyOptional({ example: '2024-01-16T09:00:00Z', description: 'When the correction was rejected' })
  rejected_at?: string;

  @ApiPropertyOptional({ example: 'Insufficient justification', description: 'Reason for rejection' })
  rejection_reason?: string;
}