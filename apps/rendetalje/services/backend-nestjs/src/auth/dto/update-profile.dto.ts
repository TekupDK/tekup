import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional({ 
    example: 'John Doe', 
    description: 'Full name of the user'
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ 
    example: '+4512345678', 
    description: 'Phone number'
  })
  @IsOptional()
  @IsString()
  phone?: string;
}