import { IsUUID, IsDateString, IsNumber, IsString, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTimeCorrectionDto {
  @ApiProperty({ example: '00000000-0000-0000-0000-000000000001', description: 'Original time entry ID' })
  @IsUUID()
  original_entry_id: string;

  @ApiProperty({ example: '2024-01-15T08:15:00Z', description: 'Corrected start time' })
  @IsDateString()
  corrected_start_time: string;

  @ApiPropertyOptional({ example: '2024-01-15T17:15:00Z', description: 'Corrected end time' })
  @IsOptional()
  @IsDateString()
  corrected_end_time?: string;

  @ApiProperty({ example: 45, description: 'Corrected break duration in minutes' })
  @IsNumber()
  @Min(0)
  corrected_break_duration: number;

  @ApiProperty({ example: 'Forgot to clock in on time due to traffic', description: 'Reason for the correction' })
  @IsString()
  reason: string;
}