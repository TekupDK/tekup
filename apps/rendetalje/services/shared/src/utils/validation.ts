import { z } from 'zod';
import { UserRole, ServiceType, JobStatus } from '../types';

// User validation schemas
export const userRoleSchema = z.nativeEnum(UserRole);

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2).max(100),
  role: userRoleSchema,
  organizationId: z.string().uuid(),
  phone: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Job validation schemas
export const serviceTypeSchema = z.nativeEnum(ServiceType);
export const jobStatusSchema = z.nativeEnum(JobStatus);

export const addressSchema = z.object({
  street: z.string().min(1),
  city: z.string().min(1),
  postal_code: z.string().regex(/^\d{4}$/),
  country: z.string().default('Denmark'),
});

export const createJobSchema = z.object({
  customer_id: z.string().uuid(),
  service_type: serviceTypeSchema,
  scheduled_date: z.string().datetime(),
  estimated_duration: z.number().min(30).max(480),
  location: addressSchema,
  special_instructions: z.string().optional(),
});

// Customer validation schemas
export const createCustomerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: addressSchema,
  preferences: z.object({
    preferred_time: z.string().optional(),
    special_instructions: z.string().optional(),
    key_location: z.string().optional(),
    contact_method: z.enum(['email', 'phone', 'sms']).optional(),
  }).optional(),
});

// Utility functions
export const validateEmail = (email: string): boolean => {
  return z.string().email().safeParse(email).success;
};

export const validatePhone = (phone: string): boolean => {
  // Danish phone number validation
  const danishPhoneRegex = /^(\+45\s?)?(\d{2}\s?\d{2}\s?\d{2}\s?\d{2})$/;
  return danishPhoneRegex.test(phone);
};

export const validatePostalCode = (postalCode: string): boolean => {
  // Danish postal code validation (4 digits)
  return /^\d{4}$/.test(postalCode);
};