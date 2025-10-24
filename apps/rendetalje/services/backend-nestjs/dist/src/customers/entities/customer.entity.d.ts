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
export declare class Customer extends OrganizationEntity {
    user_id?: string;
    name: string;
    email?: string;
    phone?: string;
    address: CustomerAddress;
    preferences: CustomerPreferences;
    total_jobs: number;
    total_revenue: number;
    satisfaction_score?: number;
    notes?: string;
    is_active: boolean;
}
