import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseEntity } from '../../common/entities/base.entity';

export class CustomerReview extends BaseEntity {
  @ApiProperty({ example: '00000000-0000-0000-0000-000000000001', description: 'Job ID' })
  job_id: string;

  @ApiProperty({ example: '00000000-0000-0000-0000-000000000002', description: 'Customer ID' })
  customer_id: string;

  @ApiProperty({ example: 5, description: 'Rating (1-5 stars)', minimum: 1, maximum: 5 })
  rating: number;

  @ApiPropertyOptional({ example: 'Fantastisk service! Meget tilfreds med rengøringen.', description: 'Review text' })
  review_text?: string;

  @ApiProperty({ 
    description: 'Review photos',
    example: ['https://example.com/after1.jpg', 'https://example.com/after2.jpg']
  })
  photos: string[];

  @ApiProperty({ example: true, description: 'Whether review is publicly visible' })
  is_public: boolean;
}