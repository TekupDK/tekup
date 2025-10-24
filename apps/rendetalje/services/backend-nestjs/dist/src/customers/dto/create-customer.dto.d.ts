declare class CustomerAddressDto {
    street: string;
    city: string;
    postal_code: string;
    country: string;
}
declare class CustomerPreferencesDto {
    preferred_time?: string;
    special_instructions?: string;
    key_location?: string;
    contact_method?: 'email' | 'phone' | 'sms';
}
export declare class CreateCustomerDto {
    name: string;
    email?: string;
    phone?: string;
    address: CustomerAddressDto;
    preferences?: CustomerPreferencesDto;
    notes?: string;
}
export {};
