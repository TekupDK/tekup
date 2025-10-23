import { IsUUID, IsInt, Min, Max, IsString, IsOptional, IsArray, IsBoolean, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReviewDto {
  @ApiProperty({ example: '00000000-0000-0000-0000-000000000001', description: 'Job ID' })
  @IsUUID()
  job_id: string;

  @ApiProperty({ example: 5, description: 'Rating (1-5 stars)', minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({ example: 'Fantastisk service! Meget tilfreds med rengøringen.', description: 'Review text' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  review_text?: string;

  @ApiPropertyOptional({ 
    description: 'Review photos',
    example: ['https://example.com/after1.jpg', 'https://example.com/after2.jpg']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photos?: string[];

  @ApiProperty({ example: true, description: 'Whether review is publicly visible' })
  @IsBoolean()
  is_public: boolean = true;
}