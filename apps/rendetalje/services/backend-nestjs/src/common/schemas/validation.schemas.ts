import { z } from 'zod';

// Base schemas
export const uuidSchema = z.string().uuid('Invalid UUID format');
export const emailSchema = z.string().email('Invalid email format');
export const phoneSchema = z.string().regex(/^(\+45\s?)?(\d{2}\s?\d{2}\s?\d{2}\s?\d{2})$/, 'Invalid Danish phone number');
export const postalCodeSchema = z.string().regex(/^\d{4}$/, 'Invalid Danish postal code');

// Address schema
export const addressSchema = z.object({
  street: z.string().min(1, 'Street is required').max(200, 'Street too long'),
  city: z.string().min(1, 'City is required').max(100, 'City too long'),
  postal_code: postalCodeSchema,
  country: z.string().default('Denmark'),
  coordinates: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }).optional(),
});

// Pagination schema
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  search: z.string().optional(),
});

// User schemas
export const userRoleSchema = z.enum(['owner', 'admin', 'employee', 'customer']);

export const createUserSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  role: userRoleSchema,
  organizationId: uuidSchema,
  phone: phoneSchema.optional(),
});

export const updateUserSchema = createUserSchema.partial().omit({ password: true });

// Job schemas
export const serviceTypeSchema = z.enum(['standard', 'deep', 'window', 'moveout', 'office']);
export const jobStatusSchema = z.enum(['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'rescheduled']);

export const checklistItemSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Title is required'),
  completed: z.boolean().default(false),
  photo_required: z.boolean().default(false),
  photo_url: z.string().url().optional(),
  notes: z.string().optional(),
});

export const jobPhotoSchema = z.object({
  id: z.string(),
  url: z.string().url(),
  type: z.enum(['before', 'after', 'during', 'issue']),
  caption: z.string().optional(),
  uploaded_at: z.string().datetime(),
});

export const profitabilitySchema = z.object({
  total_price: z.number().min(0),
  labor_cost: z.number().min(0),
  material_cost: z.number().min(0),
  travel_cost: z.number().min(0),
  profit_margin: z.number(),
});

export const createJobSchema = z.object({
  customer_id: uuidSchema,
  service_type: serviceTypeSchema,
  scheduled_date: z.string().datetime('Invalid date format'),
  estimated_duration: z.number().int().min(30, 'Minimum 30 minutes').max(480, 'Maximum 8 hours'),
  location: addressSchema,
  special_instructions: z.string().max(1000, 'Instructions too long').optional(),
  checklist: z.array(checklistItemSchema).default([]),
  recurring_job_id: uuidSchema.optional(),
});

export const updateJobSchema = createJobSchema.partial();

export const updateJobStatusSchema = z.object({
  status: jobStatusSchema,
  actual_duration: z.number().int().min(1).optional(),
  quality_score: z.number().int().min(1).max(5).optional(),
  customer_signature: z.string().optional(),
  profitability: profitabilitySchema.optional(),
});

// Customer schemas
export const customerPreferencesSchema = z.object({
  preferred_time: z.string().optional(),
  special_instructions: z.string().max(1000).optional(),
  key_location: z.string().max(200).optional(),
  contact_method: z.enum(['email', 'phone', 'sms']).optional(),
});

export const createCustomerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
  address: addressSchema,
  preferences: customerPreferencesSchema.default({}),
  notes: z.string().max(2000, 'Notes too long').optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

// Team member schemas
export const createTeamMemberSchema = z.object({
  user_id: uuidSchema,
  employee_id: z.string().optional(),
  skills: z.array(z.string()).default([]),
  hourly_rate: z.number().min(0).optional(),
  availability: z.record(z.any()).default({}),
  hire_date: z.string().date().optional(),
});

export const updateTeamMemberSchema = createTeamMemberSchema.partial();

// Time entry schemas
export const createTimeEntrySchema = z.object({
  job_id: uuidSchema,
  team_member_id: uuidSchema,
  start_time: z.string().datetime(),
  end_time: z.string().datetime().optional(),
  break_duration: z.number().int().min(0).default(0),
  notes: z.string().max(500).optional(),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
  }).optional(),
});

export const updateTimeEntrySchema = createTimeEntrySchema.partial();

// Message schemas
export const createMessageSchema = z.object({
  customer_id: uuidSchema,
  job_id: uuidSchema.optional(),
  sender_type: z.enum(['customer', 'employee', 'system']),
  message_type: z.enum(['text', 'photo', 'file']).default('text'),
  content: z.string().min(1, 'Content is required').max(2000, 'Content too long'),
  attachments: z.array(z.string().url()).default([]),
});

// Review schemas
export const createReviewSchema = z.object({
  job_id: uuidSchema,
  rating: z.number().int().min(1).max(5),
  review_text: z.string().max(1000).optional(),
  photos: z.array(z.string().url()).default([]),
  is_public: z.boolean().default(true),
});

// Quality checklist schemas
export const qualityChecklistItemSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  required: z.boolean().default(true),
  photo_required: z.boolean().default(false),
});

export const createQualityChecklistSchema = z.object({
  service_type: serviceTypeSchema,
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  items: z.array(qualityChecklistItemSchema),
});

export const updateQualityChecklistSchema = createQualityChecklistSchema.partial();

// Organization schemas
export const organizationSettingsSchema = z.object({
  timezone: z.string().default('Europe/Copenhagen'),
  currency: z.string().default('DKK'),
  language: z.string().default('da'),
  business_hours: z.record(z.object({
    open: z.string(),
    close: z.string(),
    closed: z.boolean().optional(),
  })).optional(),
});

export const updateOrganizationSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
  address: addressSchema.optional(),
  settings: organizationSettingsSchema.optional(),
});

// Validation helper functions
export const validateSchema = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errors = result.error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
    throw new Error(`Validation failed: ${errors.join(', ')}`);
  }
  return result.data;
};

export const validatePartialSchema = <T>(schema: z.ZodObject<any>, data: unknown): Partial<T> => {
  const partialSchema = schema.partial();
  return validateSchema(partialSchema, data);
};