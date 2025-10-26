"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateSchema = exports.HealthCheckSchema = exports.ApiResponseSchema = exports.PaginationMetaSchema = exports.ApiErrorSchema = exports.FileUploadSchema = exports.FileCategorySchema = exports.GenerateReportSchema = exports.ReportTypeSchema = exports.CreateSalesTransactionSchema = exports.SalesItemSchema = exports.OrderTypeSchema = exports.PaymentMethodSchema = exports.ScheduleSchema = exports.CreateEmployeeSchema = exports.EmploymentTypeSchema = exports.DepartmentSchema = exports.PositionSchema = exports.CreateRecipeSchema = exports.RecipeIngredientSchema = exports.CreateMenuItemSchema = exports.DietaryInfoSchema = exports.MenuCategorySchema = exports.InventoryTransactionSchema = exports.CreateInventoryItemSchema = exports.AllergenSchema = exports.MeasurementUnitSchema = exports.InventoryCategorySchema = exports.CreateLocationSchema = exports.ContactInfoSchema = exports.AddressSchema = exports.CreateTenantSchema = exports.TenantSettingsSchema = exports.ResetPasswordSchema = exports.ForgotPasswordSchema = exports.RegisterSchema = exports.LoginSchema = exports.DateRangeQuerySchema = exports.BaseQuerySchema = exports.CVRNumberSchema = exports.PhoneSchema = exports.EmailSchema = exports.CurrencyAmountSchema = exports.DateSchema = exports.DateTimeSchema = exports.UUIDSchema = void 0;
const zod_1 = require("zod");
exports.UUIDSchema = zod_1.z.string().uuid();
exports.DateTimeSchema = zod_1.z.string().datetime();
exports.DateSchema = zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
exports.CurrencyAmountSchema = zod_1.z.number().int().nonnegative();
exports.EmailSchema = zod_1.z.string().email();
exports.PhoneSchema = zod_1.z.string().regex(/^(\+45)?\d{8}$/);
exports.CVRNumberSchema = zod_1.z.string().regex(/^\d{8}$/);
exports.BaseQuerySchema = zod_1.z.object({
    page: zod_1.z.number().int().positive().optional().default(1),
    limit: zod_1.z.number().int().positive().max(100).optional().default(20),
    sort: zod_1.z.string().optional(),
    order: zod_1.z.enum(['asc', 'desc']).optional().default('asc'),
    search: zod_1.z.string().optional(),
});
exports.DateRangeQuerySchema = zod_1.z.object({
    startDate: exports.DateSchema.optional(),
    endDate: exports.DateSchema.optional(),
});
exports.LoginSchema = zod_1.z.object({
    email: exports.EmailSchema,
    password: zod_1.z.string().min(8),
    tenantDomain: zod_1.z.string().min(1),
});
exports.RegisterSchema = zod_1.z.object({
    email: exports.EmailSchema,
    password: zod_1.z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number'),
    firstName: zod_1.z.string().min(1).max(50),
    lastName: zod_1.z.string().min(1).max(50),
    tenantName: zod_1.z.string().min(1).max(100),
    tenantDomain: zod_1.z.string()
        .min(3)
        .max(50)
        .regex(/^[a-z0-9-]+$/, 'Domain can only contain lowercase letters, numbers, and hyphens'),
});
exports.ForgotPasswordSchema = zod_1.z.object({
    email: exports.EmailSchema,
    tenantDomain: zod_1.z.string().min(1),
});
exports.ResetPasswordSchema = zod_1.z.object({
    token: zod_1.z.string(),
    password: zod_1.z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number'),
});
exports.TenantSettingsSchema = zod_1.z.object({
    locale: zod_1.z.literal('da-DK'),
    currency: zod_1.z.literal('DKK'),
    timezone: zod_1.z.literal('Europe/Copenhagen'),
    businessHours: zod_1.z.object({
        monday: zod_1.z.object({
            isOpen: zod_1.z.boolean(),
            openTime: zod_1.z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
            closeTime: zod_1.z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
        }),
        tuesday: zod_1.z.object({
            isOpen: zod_1.z.boolean(),
            openTime: zod_1.z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
            closeTime: zod_1.z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
        }),
        wednesday: zod_1.z.object({
            isOpen: zod_1.z.boolean(),
            openTime: zod_1.z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
            closeTime: zod_1.z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
        }),
        thursday: zod_1.z.object({
            isOpen: zod_1.z.boolean(),
            openTime: zod_1.z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
            closeTime: zod_1.z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
        }),
        friday: zod_1.z.object({
            isOpen: zod_1.z.boolean(),
            openTime: zod_1.z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
            closeTime: zod_1.z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
        }),
        saturday: zod_1.z.object({
            isOpen: zod_1.z.boolean(),
            openTime: zod_1.z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
            closeTime: zod_1.z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
        }),
        sunday: zod_1.z.object({
            isOpen: zod_1.z.boolean(),
            openTime: zod_1.z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
            closeTime: zod_1.z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
        }),
    }),
    features: zod_1.z.object({
        aiForecasting: zod_1.z.boolean(),
        advancedScheduling: zod_1.z.boolean(),
        multiLocation: zod_1.z.boolean(),
        posIntegration: zod_1.z.boolean(),
        accountingIntegration: zod_1.z.boolean(),
        mobilePayIntegration: zod_1.z.boolean(),
        analyticsReporting: zod_1.z.boolean(),
        customBranding: zod_1.z.boolean(),
    }),
});
exports.CreateTenantSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
    domain: zod_1.z.string()
        .min(3)
        .max(50)
        .regex(/^[a-z0-9-]+$/, 'Domain can only contain lowercase letters, numbers, and hyphens'),
    cvrNumber: exports.CVRNumberSchema.optional(),
    settings: exports.TenantSettingsSchema.optional(),
});
exports.AddressSchema = zod_1.z.object({
    street: zod_1.z.string().min(1).max(200),
    city: zod_1.z.string().min(1).max(100),
    postalCode: zod_1.z.string().regex(/^\d{4}$/, 'Danish postal code must be 4 digits'),
    region: zod_1.z.string().optional(),
    country: zod_1.z.literal('DK'),
    coordinates: zod_1.z.object({
        latitude: zod_1.z.number().min(-90).max(90),
        longitude: zod_1.z.number().min(-180).max(180),
    }).optional(),
});
exports.ContactInfoSchema = zod_1.z.object({
    phone: exports.PhoneSchema.optional(),
    email: exports.EmailSchema.optional(),
    website: zod_1.z.string().url().optional(),
});
exports.CreateLocationSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
    address: exports.AddressSchema,
    contactInfo: exports.ContactInfoSchema,
    settings: zod_1.z.object({
        maxCapacity: zod_1.z.number().int().positive().optional(),
        tableCount: zod_1.z.number().int().positive().optional(),
        kitchenCapacity: zod_1.z.number().int().positive().optional(),
        operatingHours: exports.TenantSettingsSchema.shape.businessHours,
        preferences: zod_1.z.object({
            defaultTaxRate: zod_1.z.number().min(0).max(50).default(25),
            autoOrderEnabled: zod_1.z.boolean().default(false),
            wasteTrackingEnabled: zod_1.z.boolean().default(true),
            staffOptimizationEnabled: zod_1.z.boolean().default(true),
            realTimeUpdatesEnabled: zod_1.z.boolean().default(true),
        }),
    }),
});
exports.InventoryCategorySchema = zod_1.z.enum([
    'meat', 'seafood', 'dairy', 'vegetables', 'fruits', 'grains',
    'spices', 'beverages', 'alcohol', 'cleaning', 'packaging', 'disposables', 'other'
]);
exports.MeasurementUnitSchema = zod_1.z.enum([
    'kg', 'g', 'l', 'ml', 'stk', 'pk', 'ds', 'kasse', 'm', 'cm'
]);
exports.AllergenSchema = zod_1.z.enum([
    'gluten', 'crustaceans', 'eggs', 'fish', 'peanuts', 'soybeans',
    'milk', 'nuts', 'celery', 'mustard', 'sesame', 'sulphites', 'lupin', 'molluscs'
]);
exports.CreateInventoryItemSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(200),
    description: zod_1.z.string().max(1000).optional(),
    category: exports.InventoryCategorySchema,
    unit: exports.MeasurementUnitSchema,
    currentStock: zod_1.z.number().nonnegative(),
    minStock: zod_1.z.number().nonnegative(),
    maxStock: zod_1.z.number().nonnegative(),
    costPerUnit: exports.CurrencyAmountSchema,
    supplierInfo: zod_1.z.object({
        name: zod_1.z.string().min(1).max(200),
        contactPerson: zod_1.z.string().max(100).optional(),
        email: exports.EmailSchema.optional(),
        phone: exports.PhoneSchema.optional(),
        deliveryDays: zod_1.z.array(zod_1.z.number().int().min(0).max(6)),
        minOrderAmount: exports.CurrencyAmountSchema.optional(),
        leadTime: zod_1.z.number().int().nonnegative(),
        qualityScore: zod_1.z.number().min(1).max(5).optional(),
    }).optional(),
    allergens: zod_1.z.array(exports.AllergenSchema).default([]),
    expirationTracking: zod_1.z.boolean().default(true),
    barcodes: zod_1.z.array(zod_1.z.string()).default([]),
    tags: zod_1.z.array(zod_1.z.string()).default([]),
});
exports.InventoryTransactionSchema = zod_1.z.object({
    itemId: exports.UUIDSchema,
    transactionType: zod_1.z.enum(['purchase', 'usage', 'waste', 'adjustment', 'transfer', 'return', 'sample']),
    quantity: zod_1.z.number(),
    costPerUnit: exports.CurrencyAmountSchema,
    referenceId: zod_1.z.string().optional(),
    batchNumber: zod_1.z.string().optional(),
    expirationDate: exports.DateSchema.optional(),
    notes: zod_1.z.string().max(1000).optional(),
});
exports.MenuCategorySchema = zod_1.z.enum([
    'appetizers', 'main_courses', 'desserts', 'salads', 'soups',
    'beverages', 'alcohol', 'coffee_tea', 'sides', 'kids_menu', 'lunch_specials', 'seasonal'
]);
exports.DietaryInfoSchema = zod_1.z.object({
    isVegetarian: zod_1.z.boolean().default(false),
    isVegan: zod_1.z.boolean().default(false),
    isGlutenFree: zod_1.z.boolean().default(false),
    isDairyFree: zod_1.z.boolean().default(false),
    isKeto: zod_1.z.boolean().default(false),
    isOrganic: zod_1.z.boolean().default(false),
    isLocallySourced: zod_1.z.boolean().default(false),
});
exports.CreateMenuItemSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(200),
    description: zod_1.z.string().max(1000).optional(),
    category: exports.MenuCategorySchema,
    price: exports.CurrencyAmountSchema,
    dietaryInfo: exports.DietaryInfoSchema.optional(),
    allergens: zod_1.z.array(exports.AllergenSchema).default([]),
    preparationTime: zod_1.z.number().int().nonnegative(),
    servingSize: zod_1.z.string().max(100).optional(),
    calories: zod_1.z.number().int().nonnegative().optional(),
    tags: zod_1.z.array(zod_1.z.string()).default([]),
});
exports.RecipeIngredientSchema = zod_1.z.object({
    inventoryItemId: exports.UUIDSchema,
    quantity: zod_1.z.number().positive(),
    unit: exports.MeasurementUnitSchema,
    notes: zod_1.z.string().max(500).optional(),
    isOptional: zod_1.z.boolean().default(false),
    alternatives: zod_1.z.array(exports.UUIDSchema).default([]),
});
exports.CreateRecipeSchema = zod_1.z.object({
    menuItemId: exports.UUIDSchema,
    name: zod_1.z.string().min(1).max(200),
    instructions: zod_1.z.string().min(1),
    ingredients: zod_1.z.array(exports.RecipeIngredientSchema).min(1),
    yield: zod_1.z.number().int().positive(),
    preparationTime: zod_1.z.number().int().nonnegative(),
    cookingTime: zod_1.z.number().int().nonnegative(),
    difficulty: zod_1.z.enum(['easy', 'medium', 'hard']),
    equipmentNeeded: zod_1.z.array(zod_1.z.string()).default([]),
    notes: zod_1.z.string().max(1000).optional(),
});
exports.PositionSchema = zod_1.z.enum([
    'chef', 'sous_chef', 'cook', 'prep_cook', 'server', 'bartender',
    'host', 'manager', 'assistant_manager', 'dishwasher', 'cleaner', 'delivery', 'trainee'
]);
exports.DepartmentSchema = zod_1.z.enum(['kitchen', 'service', 'bar', 'management', 'cleaning', 'delivery']);
exports.EmploymentTypeSchema = zod_1.z.enum(['full_time', 'part_time', 'temporary', 'seasonal', 'intern', 'trainee']);
exports.CreateEmployeeSchema = zod_1.z.object({
    employeeNumber: zod_1.z.string().min(1).max(50),
    personalInfo: zod_1.z.object({
        firstName: zod_1.z.string().min(1).max(50),
        lastName: zod_1.z.string().min(1).max(50),
        dateOfBirth: exports.DateSchema,
        nationalId: zod_1.z.string().optional(),
        address: zod_1.z.object({
            street: zod_1.z.string().min(1).max(200),
            city: zod_1.z.string().min(1).max(100),
            postalCode: zod_1.z.string().regex(/^\d{4}$/),
        }).optional(),
    }),
    workInfo: zod_1.z.object({
        position: exports.PositionSchema,
        department: exports.DepartmentSchema,
        employmentType: exports.EmploymentTypeSchema,
        startDate: exports.DateSchema,
        endDate: exports.DateSchema.optional(),
        hourlyRate: exports.CurrencyAmountSchema,
        contractHours: zod_1.z.number().min(0).max(60),
    }),
    contactInfo: exports.ContactInfoSchema,
    emergencyContact: zod_1.z.object({
        name: zod_1.z.string().min(1).max(100),
        relationship: zod_1.z.string().min(1).max(50),
        phone: exports.PhoneSchema,
        email: exports.EmailSchema.optional(),
    }).optional(),
});
exports.ScheduleSchema = zod_1.z.object({
    employeeId: exports.UUIDSchema,
    shiftDate: exports.DateSchema,
    shiftType: zod_1.z.enum(['opening', 'morning', 'lunch', 'afternoon', 'dinner', 'closing', 'split', 'double']),
    startTime: zod_1.z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
    endTime: zod_1.z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
    department: exports.DepartmentSchema,
    position: exports.PositionSchema,
    breaks: zod_1.z.array(zod_1.z.object({
        startTime: zod_1.z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
        endTime: zod_1.z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
        type: zod_1.z.enum(['meal', 'rest', 'other']),
        paid: zod_1.z.boolean(),
    })).default([]),
    notes: zod_1.z.string().max(500).optional(),
});
exports.PaymentMethodSchema = zod_1.z.enum([
    'mobilepay', 'card', 'cash', 'swish', 'vipps', 'gift_card', 'voucher', 'credit'
]);
exports.OrderTypeSchema = zod_1.z.enum(['dine_in', 'takeaway', 'delivery', 'catering', 'online']);
exports.SalesItemSchema = zod_1.z.object({
    menuItemId: exports.UUIDSchema,
    name: zod_1.z.string().min(1),
    quantity: zod_1.z.number().int().positive(),
    unitPrice: exports.CurrencyAmountSchema,
    totalPrice: exports.CurrencyAmountSchema,
    modifications: zod_1.z.array(zod_1.z.string()).optional(),
    notes: zod_1.z.string().max(500).optional(),
});
exports.CreateSalesTransactionSchema = zod_1.z.object({
    posTransactionId: zod_1.z.string().optional(),
    transactionDate: exports.DateTimeSchema.optional(),
    orderType: exports.OrderTypeSchema,
    paymentMethod: exports.PaymentMethodSchema,
    items: zod_1.z.array(exports.SalesItemSchema).min(1),
    customerId: exports.UUIDSchema.optional(),
    tableNumber: zod_1.z.number().int().positive().optional(),
    serverId: exports.UUIDSchema.optional(),
    tip: exports.CurrencyAmountSchema.optional(),
    discount: exports.CurrencyAmountSchema.optional(),
    notes: zod_1.z.string().max(1000).optional(),
});
exports.ReportTypeSchema = zod_1.z.enum([
    'sales_summary', 'inventory_analysis', 'staff_productivity', 'menu_performance',
    'waste_analysis', 'profit_loss', 'customer_analytics', 'forecasting_accuracy', 'compliance_report'
]);
exports.GenerateReportSchema = zod_1.z.object({
    reportType: exports.ReportTypeSchema,
    locationIds: zod_1.z.array(exports.UUIDSchema).min(1),
    period: zod_1.z.object({
        startDate: exports.DateSchema,
        endDate: exports.DateSchema,
    }),
    format: zod_1.z.enum(['json', 'csv', 'excel', 'pdf']).default('json'),
    filters: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional(),
});
exports.FileCategorySchema = zod_1.z.enum([
    'menu_image', 'receipt', 'invoice', 'employee_photo', 'logo', 'document', 'report'
]);
exports.FileUploadSchema = zod_1.z.object({
    category: exports.FileCategorySchema,
    locationId: exports.UUIDSchema.optional(),
    metadata: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional(),
});
exports.ApiErrorSchema = zod_1.z.object({
    code: zod_1.z.string(),
    message: zod_1.z.string(),
    details: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional(),
    timestamp: exports.DateTimeSchema,
});
exports.PaginationMetaSchema = zod_1.z.object({
    page: zod_1.z.number().int().positive(),
    limit: zod_1.z.number().int().positive(),
    totalPages: zod_1.z.number().int().nonnegative(),
    totalCount: zod_1.z.number().int().nonnegative(),
    hasNextPage: zod_1.z.boolean(),
    hasPreviousPage: zod_1.z.boolean(),
});
const ApiResponseSchema = (dataSchema) => zod_1.z.object({
    success: zod_1.z.boolean(),
    data: dataSchema.optional(),
    error: exports.ApiErrorSchema.optional(),
    metadata: zod_1.z.object({
        pagination: exports.PaginationMetaSchema.optional(),
        filters: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional(),
        sort: zod_1.z.object({
            field: zod_1.z.string(),
            order: zod_1.z.enum(['asc', 'desc']),
        }).optional(),
        totalCount: zod_1.z.number().int().nonnegative().optional(),
        executionTime: zod_1.z.number().nonnegative().optional(),
    }).optional(),
});
exports.ApiResponseSchema = ApiResponseSchema;
exports.HealthCheckSchema = zod_1.z.object({
    status: zod_1.z.enum(['healthy', 'unhealthy', 'degraded']),
    timestamp: exports.DateTimeSchema,
    services: zod_1.z.array(zod_1.z.object({
        name: zod_1.z.string(),
        status: zod_1.z.enum(['healthy', 'unhealthy']),
        responseTime: zod_1.z.number().nonnegative().optional(),
        error: zod_1.z.string().optional(),
    })),
    uptime: zod_1.z.number().nonnegative(),
    version: zod_1.z.string(),
});
const validateSchema = (schema) => {
    return (data) => {
        return schema.parse(data);
    };
};
exports.validateSchema = validateSchema;
//# sourceMappingURL=validation.js.map