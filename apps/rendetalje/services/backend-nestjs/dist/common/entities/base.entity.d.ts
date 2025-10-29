import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
export { ApiProperty, ApiPropertyOptional };
export declare abstract class BaseEntity {
    id: string;
    created_at: string;
    updated_at: string;
}
export declare abstract class OrganizationEntity extends BaseEntity {
    organization_id: string;
}
