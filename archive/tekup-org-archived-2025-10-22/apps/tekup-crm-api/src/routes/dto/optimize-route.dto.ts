import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class OptimizeRouteDto {
  @ApiProperty({
    description: 'Route ID to optimize',
    example: 'route-123',
  })
  @IsString()
  routeId: string;

  @ApiProperty({
    description: 'Optimization algorithm',
    enum: ['shortest_distance', 'shortest_time', 'balanced'],
    example: 'balanced',
    required: false,
  })
  @IsOptional()
  @IsEnum(['shortest_distance', 'shortest_time', 'balanced'], {
    message: 'Please provide a valid optimization algorithm',
  })
  algorithm?: string;
}
