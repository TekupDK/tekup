import { PartialType } from '@nestjs/swagger';
import { CreateRestaurantDto } from './create-restaurant.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { RestaurantStatus } from '../entities/restaurant.entity';

export class UpdateRestaurantDto extends PartialType(CreateRestaurantDto) {
  @ApiProperty({
    enum: RestaurantStatus,
    description: 'Restaurant status',
    required: false,
  })
  @IsOptional()
  @IsEnum(RestaurantStatus, { message: 'Please provide a valid restaurant status' })
  status?: RestaurantStatus;
}