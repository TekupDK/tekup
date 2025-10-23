import { PartialType } from '@nestjs/swagger';
import { IsOptional, IsDateString, IsNumber, IsString, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateTimeEntryDto } from './create-time-entry.dto';

export class UpdateTimeEntryDto extends PartialType(CreateTimeEntryDto) {
  @ApiPropertyOptional({ example: '2024-01-15T17:00:00Z', description: 'End time of work' })
  @IsOptional()
  @IsDateString()
  end_time?: string;

  @ApiPropertyOptional({ example: 30, description: 'Break duration in minutes' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  break_duration?: number;

  @ApiPropertyOptional({ example: 'Completed all tasks successfully', description: 'Updated notes about the work' })
  @IsOptional()
  @IsString()
  notes?: string;
}