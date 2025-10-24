"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePartialSchema = exports.validateSchema = exports.updateOrganizationSchema = exports.organizationSettingsSchema = exports.updateQualityChecklistSchema = exports.createQualityChecklistSchema = exports.qualityChecklistItemSchema = exports.createReviewSchema = exports.createMessageSchema = exports.updateTimeEntrySchema = exports.createTimeEntrySchema = exports.updateTeamMemberSchema = exports.createTeamMemberSchema = exports.updateCustomerSchema = exports.createCustomerSchema = exports.customerPreferencesSchema = exports.updateJobStatusSchema = exports.updateJobSchema = exports.createJobSchema = exports.profitabilitySchema = exports.jobPhotoSchema = exports.checklistItemSchema = exports.jobStatusSchema = exports.serviceTypeSchema = exports.updateUserSchema = exports.createUserSchema = exports.userRoleSchema = exports.paginationSchema = exports.addressSchema = exports.postalCodeSchema = exports.phoneSchema = exports.emailSchema = exports.uuidSchema = void 0;
const zod_1 = require("zod");
exports.uuidSchema = zod_1.z.string().uuid('Invalid UUID format');
exports.emailSchema = zod_1.z.string().email('Invalid email format');
exports.phoneSchema = zod_1.z.string().regex(/^(\+45\s?)?(\d{2}\s?\d{2}\s?\d{2}\s?\d{2})$/, 'Invalid Danish phone number');
exports.postalCodeSchema = zod_1.z.string().regex(/^\d{4}$/, 'Invalid Danish postal code');
exports.addressSchema = zod_1.z.object({
    street: zod_1.z.string().min(1, 'Street is required').max(200, 'Street too long'),
    city: zod_1.z.string().min(1, 'City is required').max(100, 'City too long'),
    postal_code: exports.postalCodeSchema,
    country: zod_1.z.string().default('Denmark'),
    coordinates: zod_1.z.object({
        lat: zod_1.z.number().min(-90).max(90),
        lng: zod_1.z.number().min(-180).max(180),
    }).optional(),
});
exports.paginationSchema = zod_1.z.object({
    page: zod_1.z.number().int().min(1).default(1),
    limit: zod_1.z.number().int().min(1).max(100).default(20),
    sortBy: zod_1.z.string().optional(),
    sortOrder: zod_1.z.enum(['asc', 'desc']).default('asc'),
    search: zod_1.z.string().optional(),
});
exports.userRoleSchema = zod_1.z.enum(['owner', 'admin', 'employee', 'customer']);
exports.createUserSchema = zod_1.z.object({
    email: exports.emailSchema,
    password: zod_1.z.string().min(8, 'Password must be at least 8 characters'),
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
    role: exports.userRoleSchema,
    organizationId: exports.uuidSchema,
    phone: exports.phoneSchema.optional(),
});
exports.updateUserSchema = exports.createUserSchema.partial().omit({ password: true });
exports.serviceTypeSchema = zod_1.z.enum(['standard', 'deep', 'window', 'moveout', 'office']);
exports.jobStatusSchema = zod_1.z.enum(['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'rescheduled']);
exports.checklistItemSchema = zod_1.z.object({
    id: zod_1.z.string(),
    title: zod_1.z.string().min(1, 'Title is required'),
    completed: zod_1.z.boolean().default(false),
    photo_required: zod_1.z.boolean().default(false),
    photo_url: zod_1.z.string().url().optional(),
    notes: zod_1.z.string().optional(),
});
exports.jobPhotoSchema = zod_1.z.object({
    id: zod_1.z.string(),
    url: zod_1.z.string().url(),
    type: zod_1.z.enum(['before', 'after', 'during', 'issue']),
    caption: zod_1.z.string().optional(),
    uploaded_at: zod_1.z.string().datetime(),
});
exports.profitabilitySchema = zod_1.z.object({
    total_price: zod_1.z.number().min(0),
    labor_cost: zod_1.z.number().min(0),
    material_cost: zod_1.z.number().min(0),
    travel_cost: zod_1.z.number().min(0),
    profit_margin: zod_1.z.number(),
});
exports.createJobSchema = zod_1.z.object({
    customer_id: exports.uuidSchema,
    service_type: exports.serviceTypeSchema,
    scheduled_date: zod_1.z.string().datetime('Invalid date format'),
    estimated_duration: zod_1.z.number().int().min(30, 'Minimum 30 minutes').max(480, 'Maximum 8 hours'),
    location: exports.addressSchema,
    special_instructions: zod_1.z.string().max(1000, 'Instructions too long').optional(),
    checklist: zod_1.z.array(exports.checklistItemSchema).default([]),
    recurring_job_id: exports.uuidSchema.optional(),
});
exports.updateJobSchema = exports.createJobSchema.partial();
exports.updateJobStatusSchema = zod_1.z.object({
    status: exports.jobStatusSchema,
    actual_duration: zod_1.z.number().int().min(1).optional(),
    quality_score: zod_1.z.number().int().min(1).max(5).optional(),
    customer_signature: zod_1.z.string().optional(),
    profitability: exports.profitabilitySchema.optional(),
});
exports.customerPreferencesSchema = zod_1.z.object({
    preferred_time: zod_1.z.string().optional(),
    special_instructions: zod_1.z.string().max(1000).optional(),
    key_location: zod_1.z.string().max(200).optional(),
    contact_method: zod_1.z.enum(['email', 'phone', 'sms']).optional(),
});
exports.createCustomerSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
    email: exports.emailSchema.optional(),
    phone: exports.phoneSchema.optional(),
    address: exports.addressSchema,
    preferences: exports.customerPreferencesSchema.default({}),
    notes: zod_1.z.string().max(2000, 'Notes too long').optional(),
});
exports.updateCustomerSchema = exports.createCustomerSchema.partial();
exports.createTeamMemberSchema = zod_1.z.object({
    user_id: exports.uuidSchema,
    employee_id: zod_1.z.string().optional(),
    skills: zod_1.z.array(zod_1.z.string()).default([]),
    hourly_rate: zod_1.z.number().min(0).optional(),
    availability: zod_1.z.record(zod_1.z.any()).default({}),
    hire_date: zod_1.z.string().date().optional(),
});
exports.updateTeamMemberSchema = exports.createTeamMemberSchema.partial();
exports.createTimeEntrySchema = zod_1.z.object({
    job_id: exports.uuidSchema,
    team_member_id: exports.uuidSchema,
    start_time: zod_1.z.string().datetime(),
    end_time: zod_1.z.string().datetime().optional(),
    break_duration: zod_1.z.number().int().min(0).default(0),
    notes: zod_1.z.string().max(500).optional(),
    location: zod_1.z.object({
        lat: zod_1.z.number(),
        lng: zod_1.z.number(),
    }).optional(),
});
exports.updateTimeEntrySchema = exports.createTimeEntrySchema.partial();
exports.createMessageSchema = zod_1.z.object({
    customer_id: exports.uuidSchema,
    job_id: exports.uuidSchema.optional(),
    sender_type: zod_1.z.enum(['customer', 'employee', 'system']),
    message_type: zod_1.z.enum(['text', 'photo', 'file']).default('text'),
    content: zod_1.z.string().min(1, 'Content is required').max(2000, 'Content too long'),
    attachments: zod_1.z.array(zod_1.z.string().url()).default([]),
});
exports.createReviewSchema = zod_1.z.object({
    job_id: exports.uuidSchema,
    rating: zod_1.z.number().int().min(1).max(5),
    review_text: zod_1.z.string().max(1000).optional(),
    photos: zod_1.z.array(zod_1.z.string().url()).default([]),
    is_public: zod_1.z.boolean().default(true),
});
exports.qualityChecklistItemSchema = zod_1.z.object({
    id: zod_1.z.string(),
    title: zod_1.z.string().min(1),
    required: zod_1.z.boolean().default(true),
    photo_required: zod_1.z.boolean().default(false),
});
exports.createQualityChecklistSchema = zod_1.z.object({
    service_type: exports.serviceTypeSchema,
    name: zod_1.z.string().min(1, 'Name is required').max(100, 'Name too long'),
    items: zod_1.z.array(exports.qualityChecklistItemSchema),
});
exports.updateQualityChecklistSchema = exports.createQualityChecklistSchema.partial();
exports.organizationSettingsSchema = zod_1.z.object({
    timezone: zod_1.z.string().default('Europe/Copenhagen'),
    currency: zod_1.z.string().default('DKK'),
    language: zod_1.z.string().default('da'),
    business_hours: zod_1.z.record(zod_1.z.object({
        open: zod_1.z.string(),
        close: zod_1.z.string(),
        closed: zod_1.z.boolean().optional(),
    })).optional(),
});
exports.updateOrganizationSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100).optional(),
    email: exports.emailSchema.optional(),
    phone: exports.phoneSchema.optional(),
    address: exports.addressSchema.optional(),
    settings: exports.organizationSettingsSchema.optional(),
});
const validateSchema = (schema, data) => {
    const result = schema.safeParse(data);
    if (!result.success) {
        const errors = result.error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
        throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
    return result.data;
};
exports.validateSchema = validateSchema;
const validatePartialSchema = (schema, data) => {
    const partialSchema = schema.partial();
    return (0, exports.validateSchema)(partialSchema, data);
};
exports.validatePartialSchema = validatePartialSchema;
//# sourceMappingURL=validation.schemas.js.map