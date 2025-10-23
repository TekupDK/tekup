"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePostalCode = exports.validatePhone = exports.validateEmail = exports.createCustomerSchema = exports.createJobSchema = exports.addressSchema = exports.jobStatusSchema = exports.serviceTypeSchema = exports.loginSchema = exports.createUserSchema = exports.userRoleSchema = void 0;
const zod_1 = require("zod");
const types_1 = require("../types");
// User validation schemas
exports.userRoleSchema = zod_1.z.nativeEnum(types_1.UserRole);
exports.createUserSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8),
    name: zod_1.z.string().min(2).max(100),
    role: exports.userRoleSchema,
    organizationId: zod_1.z.string().uuid(),
    phone: zod_1.z.string().optional(),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1),
});
// Job validation schemas
exports.serviceTypeSchema = zod_1.z.nativeEnum(types_1.ServiceType);
exports.jobStatusSchema = zod_1.z.nativeEnum(types_1.JobStatus);
exports.addressSchema = zod_1.z.object({
    street: zod_1.z.string().min(1),
    city: zod_1.z.string().min(1),
    postal_code: zod_1.z.string().regex(/^\d{4}$/),
    country: zod_1.z.string().default('Denmark'),
});
exports.createJobSchema = zod_1.z.object({
    customer_id: zod_1.z.string().uuid(),
    service_type: exports.serviceTypeSchema,
    scheduled_date: zod_1.z.string().datetime(),
    estimated_duration: zod_1.z.number().min(30).max(480),
    location: exports.addressSchema,
    special_instructions: zod_1.z.string().optional(),
});
// Customer validation schemas
exports.createCustomerSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(100),
    email: zod_1.z.string().email().optional(),
    phone: zod_1.z.string().optional(),
    address: exports.addressSchema,
    preferences: zod_1.z.object({
        preferred_time: zod_1.z.string().optional(),
        special_instructions: zod_1.z.string().optional(),
        key_location: zod_1.z.string().optional(),
        contact_method: zod_1.z.enum(['email', 'phone', 'sms']).optional(),
    }).optional(),
});
// Utility functions
const validateEmail = (email) => {
    return zod_1.z.string().email().safeParse(email).success;
};
exports.validateEmail = validateEmail;
const validatePhone = (phone) => {
    // Danish phone number validation
    const danishPhoneRegex = /^(\+45\s?)?(\d{2}\s?\d{2}\s?\d{2}\s?\d{2})$/;
    return danishPhoneRegex.test(phone);
};
exports.validatePhone = validatePhone;
const validatePostalCode = (postalCode) => {
    // Danish postal code validation (4 digits)
    return /^\d{4}$/.test(postalCode);
};
exports.validatePostalCode = validatePostalCode;
