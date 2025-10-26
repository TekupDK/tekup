/**
 * Zod validation schemas for RestaurantIQ API
 * Used for request/response validation and type safety
 */

import { z } from 'zod';

// Base schemas
export const UUIDSchema = z.string().uuid();
export const DateTimeSchema = z.string().datetime();
export const DateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const CurrencyAmountSchema = z.number().int().nonnegative(); // øre
export const EmailSchema = z.string().email();
export const PhoneSchema = z.string().regex(/^(\+45)?\d{8}$/); // Danish phone
export const CVRNumberSchema = z.string().regex(/^\d{8}$/); // Danish CVR

// Query schemas
export const BaseQuerySchema = z.object({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(20),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional().default('asc'),
  search: z.string().optional(),
});

export const DateRangeQuerySchema = z.object({
  startDate: DateSchema.optional(),
  endDate: DateSchema.optional(),
});

// Authentication schemas
export const LoginSchema = z.object({
  email: EmailSchema,
  password: z.string().min(8),
  tenantDomain: z.string().min(1),
});

export const RegisterSchema = z.object({
  email: EmailSchema,
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number'),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  tenantName: z.string().min(1).max(100),
  tenantDomain: z.string()
    .min(3)
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Domain can only contain lowercase letters, numbers, and hyphens'),
});

export const ForgotPasswordSchema = z.object({
  email: EmailSchema,
  tenantDomain: z.string().min(1),
});

export const ResetPasswordSchema = z.object({
  token: z.string(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number'),
});

// Tenant schemas
export const TenantSettingsSchema = z.object({
  locale: z.literal('da-DK'),
  currency: z.literal('DKK'),
  timezone: z.literal('Europe/Copenhagen'),
  businessHours: z.object({
    monday: z.object({
      isOpen: z.boolean(),
      openTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
      closeTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    }),
    tuesday: z.object({
      isOpen: z.boolean(),
      openTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
      closeTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    }),
    wednesday: z.object({
      isOpen: z.boolean(),
      openTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
      closeTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    }),
    thursday: z.object({
      isOpen: z.boolean(),
      openTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
      closeTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    }),
    friday: z.object({
      isOpen: z.boolean(),
      openTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
      closeTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    }),
    saturday: z.object({
      isOpen: z.boolean(),
      openTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
      closeTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    }),
    sunday: z.object({
      isOpen: z.boolean(),
      openTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
      closeTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    }),
  }),
  features: z.object({
    aiForecasting: z.boolean(),
    advancedScheduling: z.boolean(),
    multiLocation: z.boolean(),
    posIntegration: z.boolean(),
    accountingIntegration: z.boolean(),
    mobilePayIntegration: z.boolean(),
    analyticsReporting: z.boolean(),
    customBranding: z.boolean(),
  }),
});

export const CreateTenantSchema = z.object({
  name: z.string().min(1).max(100),
  domain: z.string()
    .min(3)
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Domain can only contain lowercase letters, numbers, and hyphens'),
  cvrNumber: CVRNumberSchema.optional(),
  settings: TenantSettingsSchema.optional(),
});

// Location schemas
export const AddressSchema = z.object({
  street: z.string().min(1).max(200),
  city: z.string().min(1).max(100),
  postalCode: z.string().regex(/^\d{4}$/, 'Danish postal code must be 4 digits'),
  region: z.string().optional(),
  country: z.literal('DK'),
  coordinates: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }).optional(),
});

export const ContactInfoSchema = z.object({
  phone: PhoneSchema.optional(),
  email: EmailSchema.optional(),
  website: z.string().url().optional(),
});

export const CreateLocationSchema = z.object({
  name: z.string().min(1).max(100),
  address: AddressSchema,
  contactInfo: ContactInfoSchema,
  settings: z.object({
    maxCapacity: z.number().int().positive().optional(),
    tableCount: z.number().int().positive().optional(),
    kitchenCapacity: z.number().int().positive().optional(),
    operatingHours: TenantSettingsSchema.shape.businessHours,
    preferences: z.object({
      defaultTaxRate: z.number().min(0).max(50).default(25), // Danish MOMS
      autoOrderEnabled: z.boolean().default(false),
      wasteTrackingEnabled: z.boolean().default(true),
      staffOptimizationEnabled: z.boolean().default(true),
      realTimeUpdatesEnabled: z.boolean().default(true),
    }),
  }),
});

// Inventory schemas
export const InventoryCategorySchema = z.enum([
  'meat', 'seafood', 'dairy', 'vegetables', 'fruits', 'grains',
  'spices', 'beverages', 'alcohol', 'cleaning', 'packaging', 'disposables', 'other'
]);

export const MeasurementUnitSchema = z.enum([
  'kg', 'g', 'l', 'ml', 'stk', 'pk', 'ds', 'kasse', 'm', 'cm'
]);

export const AllergenSchema = z.enum([
  'gluten', 'crustaceans', 'eggs', 'fish', 'peanuts', 'soybeans',
  'milk', 'nuts', 'celery', 'mustard', 'sesame', 'sulphites', 'lupin', 'molluscs'
]);

export const CreateInventoryItemSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  category: InventoryCategorySchema,
  unit: MeasurementUnitSchema,
  currentStock: z.number().nonnegative(),
  minStock: z.number().nonnegative(),
  maxStock: z.number().nonnegative(),
  costPerUnit: CurrencyAmountSchema,
  supplierInfo: z.object({
    name: z.string().min(1).max(200),
    contactPerson: z.string().max(100).optional(),
    email: EmailSchema.optional(),
    phone: PhoneSchema.optional(),
    deliveryDays: z.array(z.number().int().min(0).max(6)),
    minOrderAmount: CurrencyAmountSchema.optional(),
    leadTime: z.number().int().nonnegative(),
    qualityScore: z.number().min(1).max(5).optional(),
  }).optional(),
  allergens: z.array(AllergenSchema).default([]),
  expirationTracking: z.boolean().default(true),
  barcodes: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
});

export const InventoryTransactionSchema = z.object({
  itemId: UUIDSchema,
  transactionType: z.enum(['purchase', 'usage', 'waste', 'adjustment', 'transfer', 'return', 'sample']),
  quantity: z.number(),
  costPerUnit: CurrencyAmountSchema,
  referenceId: z.string().optional(),
  batchNumber: z.string().optional(),
  expirationDate: DateSchema.optional(),
  notes: z.string().max(1000).optional(),
});

// Menu schemas
export const MenuCategorySchema = z.enum([
  'appetizers', 'main_courses', 'desserts', 'salads', 'soups',
  'beverages', 'alcohol', 'coffee_tea', 'sides', 'kids_menu', 'lunch_specials', 'seasonal'
]);

export const DietaryInfoSchema = z.object({
  isVegetarian: z.boolean().default(false),
  isVegan: z.boolean().default(false),
  isGlutenFree: z.boolean().default(false),
  isDairyFree: z.boolean().default(false),
  isKeto: z.boolean().default(false),
  isOrganic: z.boolean().default(false),
  isLocallySourced: z.boolean().default(false),
});

export const CreateMenuItemSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  category: MenuCategorySchema,
  price: CurrencyAmountSchema,
  dietaryInfo: DietaryInfoSchema.optional(),
  allergens: z.array(AllergenSchema).default([]),
  preparationTime: z.number().int().nonnegative(),
  servingSize: z.string().max(100).optional(),
  calories: z.number().int().nonnegative().optional(),
  tags: z.array(z.string()).default([]),
});

export const RecipeIngredientSchema = z.object({
  inventoryItemId: UUIDSchema,
  quantity: z.number().positive(),
  unit: MeasurementUnitSchema,
  notes: z.string().max(500).optional(),
  isOptional: z.boolean().default(false),
  alternatives: z.array(UUIDSchema).default([]),
});

export const CreateRecipeSchema = z.object({
  menuItemId: UUIDSchema,
  name: z.string().min(1).max(200),
  instructions: z.string().min(1),
  ingredients: z.array(RecipeIngredientSchema).min(1),
  yield: z.number().int().positive(),
  preparationTime: z.number().int().nonnegative(),
  cookingTime: z.number().int().nonnegative(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  equipmentNeeded: z.array(z.string()).default([]),
  notes: z.string().max(1000).optional(),
});

// Employee schemas
export const PositionSchema = z.enum([
  'chef', 'sous_chef', 'cook', 'prep_cook', 'server', 'bartender',
  'host', 'manager', 'assistant_manager', 'dishwasher', 'cleaner', 'delivery', 'trainee'
]);

export const DepartmentSchema = z.enum(['kitchen', 'service', 'bar', 'management', 'cleaning', 'delivery']);

export const EmploymentTypeSchema = z.enum(['full_time', 'part_time', 'temporary', 'seasonal', 'intern', 'trainee']);

export const CreateEmployeeSchema = z.object({
  employeeNumber: z.string().min(1).max(50),
  personalInfo: z.object({
    firstName: z.string().min(1).max(50),
    lastName: z.string().min(1).max(50),
    dateOfBirth: DateSchema,
    nationalId: z.string().optional(), // Encrypted/anonymized CPR
    address: z.object({
      street: z.string().min(1).max(200),
      city: z.string().min(1).max(100),
      postalCode: z.string().regex(/^\d{4}$/),
    }).optional(),
  }),
  workInfo: z.object({
    position: PositionSchema,
    department: DepartmentSchema,
    employmentType: EmploymentTypeSchema,
    startDate: DateSchema,
    endDate: DateSchema.optional(),
    hourlyRate: CurrencyAmountSchema,
    contractHours: z.number().min(0).max(60),
  }),
  contactInfo: ContactInfoSchema,
  emergencyContact: z.object({
    name: z.string().min(1).max(100),
    relationship: z.string().min(1).max(50),
    phone: PhoneSchema,
    email: EmailSchema.optional(),
  }).optional(),
});

export const ScheduleSchema = z.object({
  employeeId: UUIDSchema,
  shiftDate: DateSchema,
  shiftType: z.enum(['opening', 'morning', 'lunch', 'afternoon', 'dinner', 'closing', 'split', 'double']),
  startTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
  endTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
  department: DepartmentSchema,
  position: PositionSchema,
  breaks: z.array(z.object({
    startTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
    endTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
    type: z.enum(['meal', 'rest', 'other']),
    paid: z.boolean(),
  })).default([]),
  notes: z.string().max(500).optional(),
});

// Sales transaction schemas
export const PaymentMethodSchema = z.enum([
  'mobilepay', 'card', 'cash', 'swish', 'vipps', 'gift_card', 'voucher', 'credit'
]);

export const OrderTypeSchema = z.enum(['dine_in', 'takeaway', 'delivery', 'catering', 'online']);

export const SalesItemSchema = z.object({
  menuItemId: UUIDSchema,
  name: z.string().min(1),
  quantity: z.number().int().positive(),
  unitPrice: CurrencyAmountSchema,
  totalPrice: CurrencyAmountSchema,
  modifications: z.array(z.string()).optional(),
  notes: z.string().max(500).optional(),
});

export const CreateSalesTransactionSchema = z.object({
  posTransactionId: z.string().optional(),
  transactionDate: DateTimeSchema.optional(),
  orderType: OrderTypeSchema,
  paymentMethod: PaymentMethodSchema,
  items: z.array(SalesItemSchema).min(1),
  customerId: UUIDSchema.optional(),
  tableNumber: z.number().int().positive().optional(),
  serverId: UUIDSchema.optional(),
  tip: CurrencyAmountSchema.optional(),
  discount: CurrencyAmountSchema.optional(),
  notes: z.string().max(1000).optional(),
});

// Analytics and reporting schemas
export const ReportTypeSchema = z.enum([
  'sales_summary', 'inventory_analysis', 'staff_productivity', 'menu_performance',
  'waste_analysis', 'profit_loss', 'customer_analytics', 'forecasting_accuracy', 'compliance_report'
]);

export const GenerateReportSchema = z.object({
  reportType: ReportTypeSchema,
  locationIds: z.array(UUIDSchema).min(1),
  period: z.object({
    startDate: DateSchema,
    endDate: DateSchema,
  }),
  format: z.enum(['json', 'csv', 'excel', 'pdf']).default('json'),
  filters: z.record(z.string(), z.any()).optional(),
});

// File upload schemas
export const FileCategorySchema = z.enum([
  'menu_image', 'receipt', 'invoice', 'employee_photo', 'logo', 'document', 'report'
]);

export const FileUploadSchema = z.object({
  category: FileCategorySchema,
  locationId: UUIDSchema.optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

// API Response schemas
export const ApiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.record(z.string(), z.any()).optional(),
  timestamp: DateTimeSchema,
});

export const PaginationMetaSchema = z.object({
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  totalPages: z.number().int().nonnegative(),
  totalCount: z.number().int().nonnegative(),
  hasNextPage: z.boolean(),
  hasPreviousPage: z.boolean(),
});

export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: ApiErrorSchema.optional(),
    metadata: z.object({
      pagination: PaginationMetaSchema.optional(),
      filters: z.record(z.string(), z.any()).optional(),
      sort: z.object({
        field: z.string(),
        order: z.enum(['asc', 'desc']),
      }).optional(),
      totalCount: z.number().int().nonnegative().optional(),
      executionTime: z.number().nonnegative().optional(),
    }).optional(),
  });

// Health check schema
export const HealthCheckSchema = z.object({
  status: z.enum(['healthy', 'unhealthy', 'degraded']),
  timestamp: DateTimeSchema,
  services: z.array(z.object({
    name: z.string(),
    status: z.enum(['healthy', 'unhealthy']),
    responseTime: z.number().nonnegative().optional(),
    error: z.string().optional(),
  })),
  uptime: z.number().nonnegative(),
  version: z.string(),
});

// Export type inference helpers
export type LoginRequest = z.infer<typeof LoginSchema>;
export type RegisterRequest = z.infer<typeof RegisterSchema>;
export type CreateTenantRequest = z.infer<typeof CreateTenantSchema>;
export type CreateLocationRequest = z.infer<typeof CreateLocationSchema>;
export type CreateInventoryItemRequest = z.infer<typeof CreateInventoryItemSchema>;
export type CreateMenuItemRequest = z.infer<typeof CreateMenuItemSchema>;
export type CreateEmployeeRequest = z.infer<typeof CreateEmployeeSchema>;
export type CreateSalesTransactionRequest = z.infer<typeof CreateSalesTransactionSchema>;
export type GenerateReportRequest = z.infer<typeof GenerateReportSchema>;

// Utility function for validation middleware
export const validateSchema = <T extends z.ZodSchema>(schema: T) => {
  return (data: unknown): z.infer<T> => {
    return schema.parse(data);
  };
};
