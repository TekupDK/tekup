import { z } from 'zod';
import {
  createUserSchema,
  loginSchema,
  createJobSchema,
  createCustomerSchema,
  addressSchema,
} from '../validation';

describe('Validation Schemas', () => {
  describe('loginSchema', () => {
    it('should validate correct login data', () => {
      const validLogin = {
        email: 'test@example.com',
        password: 'password123',
      };
      
      expect(() => loginSchema.parse(validLogin)).not.toThrow();
    });

    it('should reject invalid email', () => {
      const invalidLogin = {
        email: 'not-an-email',
        password: 'password123',
      };
      
      expect(() => loginSchema.parse(invalidLogin)).toThrow();
    });

    it('should reject empty password', () => {
      const invalidLogin = {
        email: 'test@example.com',
        password: '',
      };
      
      expect(() => loginSchema.parse(invalidLogin)).toThrow();
    });
  });

  describe('createUserSchema', () => {
    it('should validate correct user data', () => {
      const validUser = {
        email: 'test@example.com',
        password: 'password123',
        name: 'John Doe',
        role: 'owner', // Lowercase as per enum
        organizationId: '550e8400-e29b-41d4-a716-446655440000',
        phone: '+45 12 34 56 78',
      };
      
      expect(() => createUserSchema.parse(validUser)).not.toThrow();
    });

    it('should reject short password', () => {
      const invalidUser = {
        email: 'test@example.com',
        password: 'short',
        name: 'John Doe',
        role: 'OWNER',
        organizationId: '550e8400-e29b-41d4-a716-446655440000',
      };
      
      expect(() => createUserSchema.parse(invalidUser)).toThrow();
    });

    it('should reject invalid UUID for organizationId', () => {
      const invalidUser = {
        email: 'test@example.com',
        password: 'password123',
        name: 'John Doe',
        role: 'owner',
        organizationId: 'not-a-uuid',
      };
      
      expect(() => createUserSchema.parse(invalidUser)).toThrow();
    });
  });

  describe('addressSchema', () => {
    it('should validate correct address', () => {
      const validAddress = {
        street: 'Hovedgaden 123',
        city: 'Copenhagen',
        postal_code: '2100',
        country: 'Denmark',
      };
      
      expect(() => addressSchema.parse(validAddress)).not.toThrow();
    });

    it('should set default country', () => {
      const addressWithoutCountry = {
        street: 'Hovedgaden 123',
        city: 'Copenhagen',
        postal_code: '2100',
      };
      
      const result = addressSchema.parse(addressWithoutCountry);
      expect(result.country).toBe('Denmark');
    });

    it('should reject invalid postal code', () => {
      const invalidAddress = {
        street: 'Hovedgaden 123',
        city: 'Copenhagen',
        postal_code: '123', // Too short
        country: 'Denmark',
      };
      
      expect(() => addressSchema.parse(invalidAddress)).toThrow();
    });
  });

  describe('createJobSchema', () => {
    it('should validate correct job data', () => {
      const validJob = {
        customer_id: '550e8400-e29b-41d4-a716-446655440000',
        service_type: 'window', // Lowercase as per enum
        scheduled_date: '2025-10-25T10:00:00Z',
        estimated_duration: 120,
        location: {
          street: 'Hovedgaden 123',
          city: 'Copenhagen',
          postal_code: '2100',
          country: 'Denmark',
        },
        special_instructions: 'Ring ved ankomst',
      };
      
      expect(() => createJobSchema.parse(validJob)).not.toThrow();
    });

    it('should reject duration out of range', () => {
      const invalidJob = {
        customer_id: '550e8400-e29b-41d4-a716-446655440000',
        service_type: 'window',
        scheduled_date: '2025-10-25T10:00:00Z',
        estimated_duration: 10, // Too short
        location: {
          street: 'Hovedgaden 123',
          city: 'Copenhagen',
          postal_code: '2100',
        },
      };
      
      expect(() => createJobSchema.parse(invalidJob)).toThrow();
    });
  });

  describe('createCustomerSchema', () => {
    it('should validate correct customer data', () => {
      const validCustomer = {
        name: 'John Doe Company',
        email: 'john@example.com',
        phone: '+45 12 34 56 78',
        address: {
          street: 'Hovedgaden 123',
          city: 'Copenhagen',
          postal_code: '2100',
        },
        preferences: {
          preferred_time: 'morning',
          contact_method: 'email' as const,
        },
      };
      
      expect(() => createCustomerSchema.parse(validCustomer)).not.toThrow();
    });

    it('should allow minimal customer data', () => {
      const minimalCustomer = {
        name: 'John Doe',
        address: {
          street: 'Hovedgaden 123',
          city: 'Copenhagen',
          postal_code: '2100',
        },
      };
      
      expect(() => createCustomerSchema.parse(minimalCustomer)).not.toThrow();
    });

    it('should reject short name', () => {
      const invalidCustomer = {
        name: 'J',
        address: {
          street: 'Hovedgaden 123',
          city: 'Copenhagen',
          postal_code: '2100',
        },
      };
      
      expect(() => createCustomerSchema.parse(invalidCustomer)).toThrow();
    });
  });
});