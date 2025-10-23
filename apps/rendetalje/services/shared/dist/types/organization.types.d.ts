export interface Organization {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    address?: {
        street: string;
        city: string;
        postal_code: string;
        country: string;
    };
    settings: {
        timezone: string;
        currency: string;
        language: string;
        business_hours?: {
            [key: string]: {
                open: string;
                close: string;
                closed?: boolean;
            };
        };
    };
    subscription_plan: string;
    created_at: string;
    updated_at: string;
}
