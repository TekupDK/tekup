import { IsOptional, IsUUID, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class TimeEntryFiltersDto extends PaginationDto {
  @ApiPropertyOptional({ example: 'clxxx...', description: 'Filter by lead ID' })
  @IsOptional()
  @IsUUID()
  leadId?: string;

  @ApiPropertyOptional({ example: 'clyyy...', description: 'Filter by booking ID' })
  @IsOptional()
  @IsUUID()
  bookingId?: string;

  @ApiPropertyOptional({ example: 'clzzz...', description: 'Filter by team member ID' })
  @IsOptional()
  @IsUUID()
  teamMemberId?: string;

  @ApiPropertyOptional({ example: '2024-01-01', description: 'Filter by date from (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ example: '2024-01-31', description: 'Filter by date to (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;
}