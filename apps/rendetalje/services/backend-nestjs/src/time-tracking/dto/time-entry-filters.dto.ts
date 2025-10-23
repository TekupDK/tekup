import { IsOptional, IsString, IsUUID, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class TimeEntryFiltersDto extends PaginationDto {
  @ApiPropertyOptional({ example: '00000000-0000-0000-0000-000000000001', description: 'Filter by employee ID' })
  @IsOptional()
  @IsUUID()
  employee_id?: string;

  @ApiPropertyOptional({ example: '00000000-0000-0000-0000-000000000001', description: 'Filter by job ID' })
  @IsOptional()
  @IsUUID()
  job_id?: string;

  @ApiPropertyOptional({ example: '2024-01-15', description: 'Filter by specific date (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiPropertyOptional({ example: '2024-01-01T00:00:00Z', description: 'Filter from start date' })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({ example: '2024-01-31T23:59:59Z', description: 'Filter to end date' })
  @IsOptional()
  @IsDateString()
  end_date?: string;
}