import { IsOptional, IsBoolean, IsArray, IsString, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class TeamFiltersDto extends PaginationDto {
  @ApiPropertyOptional({ example: true, description: 'Filter by active status' })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;

  @ApiPropertyOptional({ 
    description: 'Filter by skills',
    example: ['standard_cleaning', 'deep_cleaning']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @ApiPropertyOptional({ example: '2024-01-01', description: 'Hired after date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  hiredAfter?: string;

  @ApiPropertyOptional({ example: '2024-12-31', description: 'Hired before date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  hiredBefore?: string;
}