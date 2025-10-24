import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export interface LocationCoordinates {
  lat: number;
  lng: number;
}

export class TimeEntry {
  @ApiProperty({ example: 'clxxx...', description: 'Time entry ID' })
  id: string;

  @ApiProperty({ example: 'clyyy...', description: 'Team member ID' })
  teamMemberId: string;

  @ApiPropertyOptional({ example: 'clzzz...', description: 'Lead ID' })
  leadId?: string;

  @ApiPropertyOptional({ example: 'clkkk...', description: 'Booking ID' })
  bookingId?: string;

  @ApiProperty({ example: '2024-01-15T08:00:00.000Z', description: 'Start time' })
  startTime: Date;

  @ApiPropertyOptional({ example: '2024-01-15T10:30:00.000Z', description: 'End time' })
  endTime?: Date;

  @ApiProperty({ example: 15, description: 'Break duration in minutes' })
  breakDuration: number;

  @ApiPropertyOptional({ example: 'Completed all tasks on schedule', description: 'Notes about the time entry' })
  notes?: string;

  @ApiPropertyOptional({ 
    description: 'GPS location for verification',
    example: { lat: 55.6761, lng: 12.5683 }
  })
  location?: LocationCoordinates;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}