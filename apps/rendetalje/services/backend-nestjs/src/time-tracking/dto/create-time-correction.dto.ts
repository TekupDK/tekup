import { IsUUID, IsDateString, IsNumber, IsString, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTimeCorrectionDto {
  @ApiProperty({ example: 'clxyz456', description: 'Original time entry ID' })
  @IsUUID()
  originalEntryId: string;

  @ApiProperty({ example: '2024-01-15T08:15:00Z', description: 'Corrected start time' })
  @IsDateString()
  correctedStartTime: string;

  @ApiPropertyOptional({ example: '2024-01-15T17:15:00Z', description: 'Corrected end time' })
  @IsOptional()
  @IsDateString()
  correctedEndTime?: string;

  @ApiProperty({ example: 45, description: 'Corrected break duration in minutes' })
  @IsNumber()
  @Min(0)
  correctedBreakDuration: number;

  @ApiProperty({ example: 'Forgot to clock in on time due to traffic', description: 'Reason for the correction' })
  @IsString()
  reason: string;
}