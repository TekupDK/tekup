import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TimeCorrection {
  @ApiProperty({ example: 'clxyz123', description: 'Correction ID' })
  id: string;

  @ApiProperty({ example: 'clxyz456', description: 'Original time entry ID' })
  originalEntryId: string;

  @ApiProperty({ example: '2024-01-15T08:00:00Z', description: 'Original start time' })
  originalStartTime: Date;

  @ApiPropertyOptional({ example: '2024-01-15T17:00:00Z', description: 'Original end time' })
  originalEndTime?: Date;

  @ApiProperty({ example: 30, description: 'Original break duration in minutes' })
  originalBreakDuration: number;

  @ApiProperty({ example: '2024-01-15T08:15:00Z', description: 'Corrected start time' })
  correctedStartTime: Date;

  @ApiPropertyOptional({ example: '2024-01-15T17:15:00Z', description: 'Corrected end time' })
  correctedEndTime?: Date;

  @ApiProperty({ example: 45, description: 'Corrected break duration in minutes' })
  correctedBreakDuration: number;

  @ApiProperty({ example: 'Forgot to clock in on time', description: 'Reason for the correction' })
  reason: string;

  @ApiProperty({ example: 'pending', enum: ['pending', 'approved', 'rejected'], description: 'Status of the correction' })
  status: string;

  @ApiProperty({ example: 'clxyz789', description: 'User who submitted the correction' })
  submittedBy: string;

  @ApiPropertyOptional({ example: 'clxyz111', description: 'User who approved the correction' })
  approvedBy?: string;

  @ApiPropertyOptional({ example: '2024-01-16T09:00:00Z', description: 'When the correction was approved' })
  approvedAt?: Date;

  @ApiPropertyOptional({ example: 'clxyz222', description: 'User who rejected the correction' })
  rejectedBy?: string;

  @ApiPropertyOptional({ example: '2024-01-16T09:00:00Z', description: 'When the correction was rejected' })
  rejectedAt?: Date;

  @ApiPropertyOptional({ example: 'Insufficient justification', description: 'Reason for rejection' })
  rejectionReason?: string;

  @ApiProperty({ example: '2024-01-15T10:00:00Z', description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-16T09:00:00Z', description: 'Last update timestamp' })
  updatedAt: Date;
}