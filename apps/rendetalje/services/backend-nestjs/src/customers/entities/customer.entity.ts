import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrganizationEntity } from '../../common/entities/base.entity';

export interface CustomerAddress {
  street: string;
  city: string;
  postal_code: string;
  country: string;
}

export interface CustomerPreferences {
  preferred_time?: string;
  special_instructions?: string;
  key_location?: string;
  contact_method?: 'email' | 'phone' | 'sms';
}

export class Customer extends OrganizationEntity {
  @ApiPropertyOptional({ example: '00000000-0000-0000-0000-000000000001', description: 'Associated user ID (if customer has login)' })
  user_id?: string;

  @ApiProperty({ example: 'John Doe', description: 'Customer full name' })
  name: string;

  @ApiPropertyOptional({ example: 'john.doe@example.com', description: 'Customer email address' })
  email?: string;

  @ApiPropertyOptional({ example: '+45 12 34 56 78', description: 'Customer phone number' })
  phone?: string;

  @ApiProperty({ 
    description: 'Customer address',
    example: {
      street: 'Hovedgade 123',
      city: 'København',
      postal_code: '1000',
      country: 'Denmark'
    }
  })
  address: CustomerAddress;

  @ApiProperty({ 
    description: 'Customer preferences',
    example: {
      preferred_time: 'morning',
      special_instructions: 'Ring på før ankomst',
      key_location: 'Under dørmåtten',
      contact_method: 'phone'
    }
  })
  preferences: CustomerPreferences;

  @ApiProperty({ example: 15, description: 'Total number of completed jobs' })
  total_jobs: number;

  @ApiProperty({ example: 18500.50, description: 'Total revenue from customer' })
  total_revenue: number;

  @ApiPropertyOptional({ example: 4.5, description: 'Average satisfaction score (1-5)' })
  satisfaction_score?: number;

  @ApiPropertyOptional({ example: 'VIP customer, always pays on time', description: 'Internal notes about customer' })
  notes?: string;

  @ApiProperty({ example: true, description: 'Whether customer is active' })
  is_active: boolean;
}