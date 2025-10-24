import { IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class CustomerFiltersDto extends PaginationDto {
  @ApiPropertyOptional({ example: 'active', description: 'Filter by status' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: 'vip', description: 'Filter by tag' })
  @IsOptional()
  @IsString()
  tag?: string;

  @ApiPropertyOptional({ example: 10, description: 'Minimum number of leads' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minLeads?: number;

  @ApiPropertyOptional({ example: 5, description: 'Minimum number of bookings' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minBookings?: number;

  @ApiPropertyOptional({ example: 5000, description: 'Minimum total revenue' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minRevenue?: number;
}