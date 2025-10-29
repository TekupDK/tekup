import { IsNumber, IsString, IsOptional, Min, Max, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReviewDto {
  @ApiProperty({ 
    example: 5, 
    description: 'Overall rating (1-5)' 
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({ 
    example: 5, 
    description: 'Punctuality score (1-5)' 
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  punctualityScore?: number;

  @ApiPropertyOptional({ 
    example: 5, 
    description: 'Work quality score (1-5)' 
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  qualityScore?: number;

  @ApiPropertyOptional({ 
    example: 5, 
    description: 'Communication score (1-5)' 
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  communicationScore?: number;

  @ApiPropertyOptional({ 
    example: 'Excellent work, very professional', 
    description: 'Review comments' 
  })
  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  comments?: string;
}
