import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsOptional,
  IsEmail,
  IsUrl,
  IsEnum,
  IsPhoneNumber,
  IsObject,
} from 'class-validator';
import { CuisineType } from '../entities/restaurant.entity';

export class CreateRestaurantDto {
  @ApiProperty({
    description: 'Restaurant name',
    example: 'Noma Copenhagen',
    maxLength: 255,
  })
  @IsString({ message: 'Restaurant name must be a string' })
  @IsNotEmpty({ message: 'Restaurant name is required' })
  @MaxLength(255, { message: 'Restaurant name cannot exceed 255 characters' })
  name: string;

  @ApiProperty({
    description: 'Restaurant description',
    example: 'Fine dining restaurant specializing in Nordic cuisine',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  description?: string;

  @ApiProperty({
    description: 'Restaurant address',
    example: 'Refshalevej 96',
    maxLength: 500,
  })
  @IsString({ message: 'Address must be a string' })
  @IsNotEmpty({ message: 'Address is required' })
  @MaxLength(500, { message: 'Address cannot exceed 500 characters' })
  address: string;

  @ApiProperty({
    description: 'Restaurant city',
    example: 'Copenhagen',
    maxLength: 100,
  })
  @IsString({ message: 'City must be a string' })
  @IsNotEmpty({ message: 'City is required' })
  @MaxLength(100, { message: 'City cannot exceed 100 characters' })
  city: string;

  @ApiProperty({
    description: 'Restaurant postal code',
    example: '1432',
    maxLength: 20,
  })
  @IsString({ message: 'Postal code must be a string' })
  @IsNotEmpty({ message: 'Postal code is required' })
  @MaxLength(20, { message: 'Postal code cannot exceed 20 characters' })
  postalCode: string;

  @ApiProperty({
    description: 'Restaurant country',
    example: 'Denmark',
    default: 'Denmark',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Country must be a string' })
  @MaxLength(100, { message: 'Country cannot exceed 100 characters' })
  country?: string;

  @ApiProperty({
    description: 'Restaurant phone number',
    example: '+45 32 96 32 97',
  })
  @IsPhoneNumber('DK', { message: 'Please provide a valid Danish phone number' })
  @IsNotEmpty({ message: 'Phone number is required' })
  phoneNumber: string;

  @ApiProperty({
    description: 'Restaurant email address',
    example: 'info@noma.dk',
    required: false,
  })
  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email?: string;

  @ApiProperty({
    description: 'Restaurant website URL',
    example: 'https://noma.dk',
    required: false,
  })
  @IsOptional()
  @IsUrl({}, { message: 'Please provide a valid website URL' })
  websiteUrl?: string;

  @ApiProperty({
    enum: CuisineType,
    description: 'Type of cuisine served',
    default: CuisineType.INTERNATIONAL,
    required: false,
  })
  @IsOptional()
  @IsEnum(CuisineType, { message: 'Please provide a valid cuisine type' })
  cuisineType?: CuisineType;

  @ApiProperty({
    description: 'Restaurant logo URL',
    required: false,
  })
  @IsOptional()
  @IsUrl({}, { message: 'Please provide a valid logo URL' })
  logoUrl?: string;

  @ApiProperty({
    description: 'Restaurant cover image URL',
    required: false,
  })
  @IsOptional()
  @IsUrl({}, { message: 'Please provide a valid cover image URL' })
  coverImageUrl?: string;

  @ApiProperty({
    description: 'Restaurant opening hours as JSON object',
    example: {
      monday: { open: '11:00', close: '22:00', closed: false },
      tuesday: { open: '11:00', close: '22:00', closed: false },
      wednesday: { open: '11:00', close: '22:00', closed: false },
      thursday: { open: '11:00', close: '22:00', closed: false },
      friday: { open: '11:00', close: '23:00', closed: false },
      saturday: { open: '11:00', close: '23:00', closed: false },
      sunday: { closed: true }
    },
    required: false,
  })
  @IsOptional()
  @IsObject({ message: 'Opening hours must be a valid JSON object' })
  openingHours?: Record<string, any>;

  @ApiProperty({
    description: 'Restaurant settings as JSON object',
    required: false,
  })
  @IsOptional()
  @IsObject({ message: 'Settings must be a valid JSON object' })
  settings?: Record<string, any>;
}