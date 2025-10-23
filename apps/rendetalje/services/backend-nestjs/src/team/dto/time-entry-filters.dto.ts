import { IsOptional, IsUUID, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class TimeEntryFiltersDto extends PaginationDto {
  @ApiPropertyOptional({ example: '00000000-0000-0000-0000-000000000001', description: 'Filter by job ID' })
  @IsOptional()
  @IsUUID()
  job_id?: string;

  @ApiPropertyOptional({ example: '00000000-0000-0000-0000-000000000002', description: 'Filter by team member ID' })
  @IsOptional()
  @IsUUID()
  team_member_id?: string;

  @ApiPropertyOptional({ example: '2024-01-01', description: 'Filter by date from (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  date_from?: string;

  @ApiPropertyOptional({ example: '2024-01-31', description: 'Filter by date to (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  date_to?: string;
}