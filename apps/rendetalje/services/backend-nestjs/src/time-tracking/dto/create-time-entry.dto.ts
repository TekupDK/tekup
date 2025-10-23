import { IsOptional, IsString, IsDateString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTimeEntryDto {
  @ApiPropertyOptional({ example: '00000000-0000-0000-0000-000000000001', description: 'Associated job ID' })
  @IsOptional()
  @IsUUID()
  job_id?: string;

  @ApiProperty({ example: '00000000-0000-0000-0000-000000000001', description: 'Team member ID' })
  @IsUUID()
  team_member_id: string;

  @ApiProperty({ example: '2024-01-15T08:00:00Z', description: 'Start time of work' })
  @IsDateString()
  start_time: string;

  @ApiPropertyOptional({ example: 'Started work on customer site', description: 'Notes about the work' })
  @IsOptional()
  @IsString()
  notes?: string;
}