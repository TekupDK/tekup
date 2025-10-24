import { z } from 'zod';
import { UserRole, ServiceType, JobStatus } from '../types';
export declare const userRoleSchema: z.ZodNativeEnum<typeof UserRole>;
export declare const createUserSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    name: z.ZodString;
    role: z.ZodNativeEnum<typeof UserRole>;
    organizationId: z.ZodString;
    phone: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    organizationId: string;
    email: string;
    name: string;
    role: UserRole;
    password: string;
    phone?: string | undefined;
}, {
    organizationId: string;
    email: string;
    name: string;
    role: UserRole;
    password: string;
    phone?: string | undefined;
}>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const serviceTypeSchema: z.ZodNativeEnum<typeof ServiceType>;
export declare const jobStatusSchema: z.ZodNativeEnum<typeof JobStatus>;
export declare const addressSchema: z.ZodObject<{
    street: z.ZodString;
    city: z.ZodString;
    postal_code: z.ZodString;
    country: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    street: string;
    city: string;
    country: string;
    postal_code: string;
}, {
    street: string;
    city: string;
    postal_code: string;
    country?: string | undefined;
}>;
export declare const createJobSchema: z.ZodObject<{
    customer_id: z.ZodString;
    service_type: z.ZodNativeEnum<typeof ServiceType>;
    scheduled_date: z.ZodString;
    estimated_duration: z.ZodNumber;
    location: z.ZodObject<{
        street: z.ZodString;
        city: z.ZodString;
        postal_code: z.ZodString;
        country: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        street: string;
        city: string;
        country: string;
        postal_code: string;
    }, {
        street: string;
        city: string;
        postal_code: string;
        country?: string | undefined;
    }>;
    special_instructions: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    location: {
        street: string;
        city: string;
        country: string;
        postal_code: string;
    };
    customer_id: string;
    service_type: ServiceType;
    scheduled_date: string;
    estimated_duration: number;
    special_instructions?: string | undefined;
}, {
    location: {
        street: string;
        city: string;
        postal_code: string;
        country?: string | undefined;
    };
    customer_id: string;
    service_type: ServiceType;
    scheduled_date: string;
    estimated_duration: number;
    special_instructions?: string | undefined;
}>;
export declare const createCustomerSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    address: z.ZodObject<{
        street: z.ZodString;
        city: z.ZodString;
        postal_code: z.ZodString;
        country: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        street: string;
        city: string;
        country: string;
        postal_code: string;
    }, {
        street: string;
        city: string;
        postal_code: string;
        country?: string | undefined;
    }>;
    preferences: z.ZodOptional<z.ZodObject<{
        preferred_time: z.ZodOptional<z.ZodString>;
        special_instructions: z.ZodOptional<z.ZodString>;
        key_location: z.ZodOptional<z.ZodString>;
        contact_method: z.ZodOptional<z.ZodEnum<["email", "phone", "sms"]>>;
    }, "strip", z.ZodTypeAny, {
        special_instructions?: string | undefined;
        preferred_time?: string | undefined;
        key_location?: string | undefined;
        contact_method?: "email" | "phone" | "sms" | undefined;
    }, {
        special_instructions?: string | undefined;
        preferred_time?: string | undefined;
        key_location?: string | undefined;
        contact_method?: "email" | "phone" | "sms" | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    address: {
        street: string;
        city: string;
        country: string;
        postal_code: string;
    };
    email?: string | undefined;
    phone?: string | undefined;
    preferences?: {
        special_instructions?: string | undefined;
        preferred_time?: string | undefined;
        key_location?: string | undefined;
        contact_method?: "email" | "phone" | "sms" | undefined;
    } | undefined;
}, {
    name: string;
    address: {
        street: string;
        city: string;
        postal_code: string;
        country?: string | undefined;
    };
    email?: string | undefined;
    phone?: string | undefined;
    preferences?: {
        special_instructions?: string | undefined;
        preferred_time?: string | undefined;
        key_location?: string | undefined;
        contact_method?: "email" | "phone" | "sms" | undefined;
    } | undefined;
}>;
export declare const validateEmail: (email: string) => boolean;
export declare const validatePhone: (phone: string) => boolean;
export declare const validatePostalCode: (postalCode: string) => boolean;
