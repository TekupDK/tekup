import { z } from 'zod';
export declare const uuidSchema: z.ZodString;
export declare const emailSchema: z.ZodString;
export declare const phoneSchema: z.ZodString;
export declare const postalCodeSchema: z.ZodString;
export declare const addressSchema: z.ZodObject<{
    street: z.ZodString;
    city: z.ZodString;
    postal_code: z.ZodString;
    country: z.ZodDefault<z.ZodString>;
    coordinates: z.ZodOptional<z.ZodObject<{
        lat: z.ZodNumber;
        lng: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        lat?: number;
        lng?: number;
    }, {
        lat?: number;
        lng?: number;
    }>>;
}, "strip", z.ZodTypeAny, {
    street?: string;
    city?: string;
    postal_code?: string;
    country?: string;
    coordinates?: {
        lat?: number;
        lng?: number;
    };
}, {
    street?: string;
    city?: string;
    postal_code?: string;
    country?: string;
    coordinates?: {
        lat?: number;
        lng?: number;
    };
}>;
export declare const paginationSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    sortBy: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
    search: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
}, {
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
}>;
export declare const userRoleSchema: z.ZodEnum<["owner", "admin", "employee", "customer"]>;
export declare const createUserSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    name: z.ZodString;
    role: z.ZodEnum<["owner", "admin", "employee", "customer"]>;
    organizationId: z.ZodString;
    phone: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name?: string;
    role?: "employee" | "customer" | "owner" | "admin";
    email?: string;
    phone?: string;
    password?: string;
    organizationId?: string;
}, {
    name?: string;
    role?: "employee" | "customer" | "owner" | "admin";
    email?: string;
    phone?: string;
    password?: string;
    organizationId?: string;
}>;
export declare const updateUserSchema: z.ZodObject<Omit<{
    email: z.ZodOptional<z.ZodString>;
    password: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    role: z.ZodOptional<z.ZodEnum<["owner", "admin", "employee", "customer"]>>;
    organizationId: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "password">, "strip", z.ZodTypeAny, {
    name?: string;
    role?: "employee" | "customer" | "owner" | "admin";
    email?: string;
    phone?: string;
    organizationId?: string;
}, {
    name?: string;
    role?: "employee" | "customer" | "owner" | "admin";
    email?: string;
    phone?: string;
    organizationId?: string;
}>;
export declare const serviceTypeSchema: z.ZodEnum<["standard", "deep", "window", "moveout", "office"]>;
export declare const jobStatusSchema: z.ZodEnum<["scheduled", "confirmed", "in_progress", "completed", "cancelled", "rescheduled"]>;
export declare const checklistItemSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    completed: z.ZodDefault<z.ZodBoolean>;
    photo_required: z.ZodDefault<z.ZodBoolean>;
    photo_url: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    title?: string;
    id?: string;
    completed?: boolean;
    photo_required?: boolean;
    photo_url?: string;
    notes?: string;
}, {
    title?: string;
    id?: string;
    completed?: boolean;
    photo_required?: boolean;
    photo_url?: string;
    notes?: string;
}>;
export declare const jobPhotoSchema: z.ZodObject<{
    id: z.ZodString;
    url: z.ZodString;
    type: z.ZodEnum<["before", "after", "during", "issue"]>;
    caption: z.ZodOptional<z.ZodString>;
    uploaded_at: z.ZodString;
}, "strip", z.ZodTypeAny, {
    url?: string;
    type?: "before" | "after" | "during" | "issue";
    id?: string;
    caption?: string;
    uploaded_at?: string;
}, {
    url?: string;
    type?: "before" | "after" | "during" | "issue";
    id?: string;
    caption?: string;
    uploaded_at?: string;
}>;
export declare const profitabilitySchema: z.ZodObject<{
    total_price: z.ZodNumber;
    labor_cost: z.ZodNumber;
    material_cost: z.ZodNumber;
    travel_cost: z.ZodNumber;
    profit_margin: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    total_price?: number;
    labor_cost?: number;
    material_cost?: number;
    travel_cost?: number;
    profit_margin?: number;
}, {
    total_price?: number;
    labor_cost?: number;
    material_cost?: number;
    travel_cost?: number;
    profit_margin?: number;
}>;
export declare const createJobSchema: z.ZodObject<{
    customer_id: z.ZodString;
    service_type: z.ZodEnum<["standard", "deep", "window", "moveout", "office"]>;
    scheduled_date: z.ZodString;
    estimated_duration: z.ZodNumber;
    location: z.ZodObject<{
        street: z.ZodString;
        city: z.ZodString;
        postal_code: z.ZodString;
        country: z.ZodDefault<z.ZodString>;
        coordinates: z.ZodOptional<z.ZodObject<{
            lat: z.ZodNumber;
            lng: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            lat?: number;
            lng?: number;
        }, {
            lat?: number;
            lng?: number;
        }>>;
    }, "strip", z.ZodTypeAny, {
        street?: string;
        city?: string;
        postal_code?: string;
        country?: string;
        coordinates?: {
            lat?: number;
            lng?: number;
        };
    }, {
        street?: string;
        city?: string;
        postal_code?: string;
        country?: string;
        coordinates?: {
            lat?: number;
            lng?: number;
        };
    }>;
    special_instructions: z.ZodOptional<z.ZodString>;
    checklist: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        title: z.ZodString;
        completed: z.ZodDefault<z.ZodBoolean>;
        photo_required: z.ZodDefault<z.ZodBoolean>;
        photo_url: z.ZodOptional<z.ZodString>;
        notes: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        title?: string;
        id?: string;
        completed?: boolean;
        photo_required?: boolean;
        photo_url?: string;
        notes?: string;
    }, {
        title?: string;
        id?: string;
        completed?: boolean;
        photo_required?: boolean;
        photo_url?: string;
        notes?: string;
    }>, "many">>;
    recurring_job_id: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    customer_id?: string;
    service_type?: "standard" | "deep" | "window" | "moveout" | "office";
    scheduled_date?: string;
    estimated_duration?: number;
    location?: {
        street?: string;
        city?: string;
        postal_code?: string;
        country?: string;
        coordinates?: {
            lat?: number;
            lng?: number;
        };
    };
    special_instructions?: string;
    checklist?: {
        title?: string;
        id?: string;
        completed?: boolean;
        photo_required?: boolean;
        photo_url?: string;
        notes?: string;
    }[];
    recurring_job_id?: string;
}, {
    customer_id?: string;
    service_type?: "standard" | "deep" | "window" | "moveout" | "office";
    scheduled_date?: string;
    estimated_duration?: number;
    location?: {
        street?: string;
        city?: string;
        postal_code?: string;
        country?: string;
        coordinates?: {
            lat?: number;
            lng?: number;
        };
    };
    special_instructions?: string;
    checklist?: {
        title?: string;
        id?: string;
        completed?: boolean;
        photo_required?: boolean;
        photo_url?: string;
        notes?: string;
    }[];
    recurring_job_id?: string;
}>;
export declare const updateJobSchema: z.ZodObject<{
    customer_id: z.ZodOptional<z.ZodString>;
    service_type: z.ZodOptional<z.ZodEnum<["standard", "deep", "window", "moveout", "office"]>>;
    scheduled_date: z.ZodOptional<z.ZodString>;
    estimated_duration: z.ZodOptional<z.ZodNumber>;
    location: z.ZodOptional<z.ZodObject<{
        street: z.ZodString;
        city: z.ZodString;
        postal_code: z.ZodString;
        country: z.ZodDefault<z.ZodString>;
        coordinates: z.ZodOptional<z.ZodObject<{
            lat: z.ZodNumber;
            lng: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            lat?: number;
            lng?: number;
        }, {
            lat?: number;
            lng?: number;
        }>>;
    }, "strip", z.ZodTypeAny, {
        street?: string;
        city?: string;
        postal_code?: string;
        country?: string;
        coordinates?: {
            lat?: number;
            lng?: number;
        };
    }, {
        street?: string;
        city?: string;
        postal_code?: string;
        country?: string;
        coordinates?: {
            lat?: number;
            lng?: number;
        };
    }>>;
    special_instructions: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    checklist: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        title: z.ZodString;
        completed: z.ZodDefault<z.ZodBoolean>;
        photo_required: z.ZodDefault<z.ZodBoolean>;
        photo_url: z.ZodOptional<z.ZodString>;
        notes: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        title?: string;
        id?: string;
        completed?: boolean;
        photo_required?: boolean;
        photo_url?: string;
        notes?: string;
    }, {
        title?: string;
        id?: string;
        completed?: boolean;
        photo_required?: boolean;
        photo_url?: string;
        notes?: string;
    }>, "many">>>;
    recurring_job_id: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    customer_id?: string;
    service_type?: "standard" | "deep" | "window" | "moveout" | "office";
    scheduled_date?: string;
    estimated_duration?: number;
    location?: {
        street?: string;
        city?: string;
        postal_code?: string;
        country?: string;
        coordinates?: {
            lat?: number;
            lng?: number;
        };
    };
    special_instructions?: string;
    checklist?: {
        title?: string;
        id?: string;
        completed?: boolean;
        photo_required?: boolean;
        photo_url?: string;
        notes?: string;
    }[];
    recurring_job_id?: string;
}, {
    customer_id?: string;
    service_type?: "standard" | "deep" | "window" | "moveout" | "office";
    scheduled_date?: string;
    estimated_duration?: number;
    location?: {
        street?: string;
        city?: string;
        postal_code?: string;
        country?: string;
        coordinates?: {
            lat?: number;
            lng?: number;
        };
    };
    special_instructions?: string;
    checklist?: {
        title?: string;
        id?: string;
        completed?: boolean;
        photo_required?: boolean;
        photo_url?: string;
        notes?: string;
    }[];
    recurring_job_id?: string;
}>;
export declare const updateJobStatusSchema: z.ZodObject<{
    status: z.ZodEnum<["scheduled", "confirmed", "in_progress", "completed", "cancelled", "rescheduled"]>;
    actual_duration: z.ZodOptional<z.ZodNumber>;
    quality_score: z.ZodOptional<z.ZodNumber>;
    customer_signature: z.ZodOptional<z.ZodString>;
    profitability: z.ZodOptional<z.ZodObject<{
        total_price: z.ZodNumber;
        labor_cost: z.ZodNumber;
        material_cost: z.ZodNumber;
        travel_cost: z.ZodNumber;
        profit_margin: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        total_price?: number;
        labor_cost?: number;
        material_cost?: number;
        travel_cost?: number;
        profit_margin?: number;
    }, {
        total_price?: number;
        labor_cost?: number;
        material_cost?: number;
        travel_cost?: number;
        profit_margin?: number;
    }>>;
}, "strip", z.ZodTypeAny, {
    status?: "scheduled" | "confirmed" | "in_progress" | "completed" | "cancelled" | "rescheduled";
    actual_duration?: number;
    customer_signature?: string;
    quality_score?: number;
    profitability?: {
        total_price?: number;
        labor_cost?: number;
        material_cost?: number;
        travel_cost?: number;
        profit_margin?: number;
    };
}, {
    status?: "scheduled" | "confirmed" | "in_progress" | "completed" | "cancelled" | "rescheduled";
    actual_duration?: number;
    customer_signature?: string;
    quality_score?: number;
    profitability?: {
        total_price?: number;
        labor_cost?: number;
        material_cost?: number;
        travel_cost?: number;
        profit_margin?: number;
    };
}>;
export declare const customerPreferencesSchema: z.ZodObject<{
    preferred_time: z.ZodOptional<z.ZodString>;
    special_instructions: z.ZodOptional<z.ZodString>;
    key_location: z.ZodOptional<z.ZodString>;
    contact_method: z.ZodOptional<z.ZodEnum<["email", "phone", "sms"]>>;
}, "strip", z.ZodTypeAny, {
    special_instructions?: string;
    preferred_time?: string;
    key_location?: string;
    contact_method?: "email" | "phone" | "sms";
}, {
    special_instructions?: string;
    preferred_time?: string;
    key_location?: string;
    contact_method?: "email" | "phone" | "sms";
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
        coordinates: z.ZodOptional<z.ZodObject<{
            lat: z.ZodNumber;
            lng: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            lat?: number;
            lng?: number;
        }, {
            lat?: number;
            lng?: number;
        }>>;
    }, "strip", z.ZodTypeAny, {
        street?: string;
        city?: string;
        postal_code?: string;
        country?: string;
        coordinates?: {
            lat?: number;
            lng?: number;
        };
    }, {
        street?: string;
        city?: string;
        postal_code?: string;
        country?: string;
        coordinates?: {
            lat?: number;
            lng?: number;
        };
    }>;
    preferences: z.ZodDefault<z.ZodObject<{
        preferred_time: z.ZodOptional<z.ZodString>;
        special_instructions: z.ZodOptional<z.ZodString>;
        key_location: z.ZodOptional<z.ZodString>;
        contact_method: z.ZodOptional<z.ZodEnum<["email", "phone", "sms"]>>;
    }, "strip", z.ZodTypeAny, {
        special_instructions?: string;
        preferred_time?: string;
        key_location?: string;
        contact_method?: "email" | "phone" | "sms";
    }, {
        special_instructions?: string;
        preferred_time?: string;
        key_location?: string;
        contact_method?: "email" | "phone" | "sms";
    }>>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name?: string;
    notes?: string;
    email?: string;
    phone?: string;
    address?: {
        street?: string;
        city?: string;
        postal_code?: string;
        country?: string;
        coordinates?: {
            lat?: number;
            lng?: number;
        };
    };
    preferences?: {
        special_instructions?: string;
        preferred_time?: string;
        key_location?: string;
        contact_method?: "email" | "phone" | "sms";
    };
}, {
    name?: string;
    notes?: string;
    email?: string;
    phone?: string;
    address?: {
        street?: string;
        city?: string;
        postal_code?: string;
        country?: string;
        coordinates?: {
            lat?: number;
            lng?: number;
        };
    };
    preferences?: {
        special_instructions?: string;
        preferred_time?: string;
        key_location?: string;
        contact_method?: "email" | "phone" | "sms";
    };
}>;
export declare const updateCustomerSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    phone: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    address: z.ZodOptional<z.ZodObject<{
        street: z.ZodString;
        city: z.ZodString;
        postal_code: z.ZodString;
        country: z.ZodDefault<z.ZodString>;
        coordinates: z.ZodOptional<z.ZodObject<{
            lat: z.ZodNumber;
            lng: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            lat?: number;
            lng?: number;
        }, {
            lat?: number;
            lng?: number;
        }>>;
    }, "strip", z.ZodTypeAny, {
        street?: string;
        city?: string;
        postal_code?: string;
        country?: string;
        coordinates?: {
            lat?: number;
            lng?: number;
        };
    }, {
        street?: string;
        city?: string;
        postal_code?: string;
        country?: string;
        coordinates?: {
            lat?: number;
            lng?: number;
        };
    }>>;
    preferences: z.ZodOptional<z.ZodDefault<z.ZodObject<{
        preferred_time: z.ZodOptional<z.ZodString>;
        special_instructions: z.ZodOptional<z.ZodString>;
        key_location: z.ZodOptional<z.ZodString>;
        contact_method: z.ZodOptional<z.ZodEnum<["email", "phone", "sms"]>>;
    }, "strip", z.ZodTypeAny, {
        special_instructions?: string;
        preferred_time?: string;
        key_location?: string;
        contact_method?: "email" | "phone" | "sms";
    }, {
        special_instructions?: string;
        preferred_time?: string;
        key_location?: string;
        contact_method?: "email" | "phone" | "sms";
    }>>>;
    notes: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    name?: string;
    notes?: string;
    email?: string;
    phone?: string;
    address?: {
        street?: string;
        city?: string;
        postal_code?: string;
        country?: string;
        coordinates?: {
            lat?: number;
            lng?: number;
        };
    };
    preferences?: {
        special_instructions?: string;
        preferred_time?: string;
        key_location?: string;
        contact_method?: "email" | "phone" | "sms";
    };
}, {
    name?: string;
    notes?: string;
    email?: string;
    phone?: string;
    address?: {
        street?: string;
        city?: string;
        postal_code?: string;
        country?: string;
        coordinates?: {
            lat?: number;
            lng?: number;
        };
    };
    preferences?: {
        special_instructions?: string;
        preferred_time?: string;
        key_location?: string;
        contact_method?: "email" | "phone" | "sms";
    };
}>;
export declare const createTeamMemberSchema: z.ZodObject<{
    user_id: z.ZodString;
    employee_id: z.ZodOptional<z.ZodString>;
    skills: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    hourly_rate: z.ZodOptional<z.ZodNumber>;
    availability: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodAny>>;
    hire_date: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    user_id?: string;
    employee_id?: string;
    skills?: string[];
    hourly_rate?: number;
    availability?: Record<string, any>;
    hire_date?: string;
}, {
    user_id?: string;
    employee_id?: string;
    skills?: string[];
    hourly_rate?: number;
    availability?: Record<string, any>;
    hire_date?: string;
}>;
export declare const updateTeamMemberSchema: z.ZodObject<{
    user_id: z.ZodOptional<z.ZodString>;
    employee_id: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    skills: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodString, "many">>>;
    hourly_rate: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    availability: z.ZodOptional<z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodAny>>>;
    hire_date: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    user_id?: string;
    employee_id?: string;
    skills?: string[];
    hourly_rate?: number;
    availability?: Record<string, any>;
    hire_date?: string;
}, {
    user_id?: string;
    employee_id?: string;
    skills?: string[];
    hourly_rate?: number;
    availability?: Record<string, any>;
    hire_date?: string;
}>;
export declare const createTimeEntrySchema: z.ZodObject<{
    job_id: z.ZodString;
    team_member_id: z.ZodString;
    start_time: z.ZodString;
    end_time: z.ZodOptional<z.ZodString>;
    break_duration: z.ZodDefault<z.ZodNumber>;
    notes: z.ZodOptional<z.ZodString>;
    location: z.ZodOptional<z.ZodObject<{
        lat: z.ZodNumber;
        lng: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        lat?: number;
        lng?: number;
    }, {
        lat?: number;
        lng?: number;
    }>>;
}, "strip", z.ZodTypeAny, {
    location?: {
        lat?: number;
        lng?: number;
    };
    notes?: string;
    job_id?: string;
    team_member_id?: string;
    start_time?: string;
    end_time?: string;
    break_duration?: number;
}, {
    location?: {
        lat?: number;
        lng?: number;
    };
    notes?: string;
    job_id?: string;
    team_member_id?: string;
    start_time?: string;
    end_time?: string;
    break_duration?: number;
}>;
export declare const updateTimeEntrySchema: z.ZodObject<{
    job_id: z.ZodOptional<z.ZodString>;
    team_member_id: z.ZodOptional<z.ZodString>;
    start_time: z.ZodOptional<z.ZodString>;
    end_time: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    break_duration: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    notes: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    location: z.ZodOptional<z.ZodOptional<z.ZodObject<{
        lat: z.ZodNumber;
        lng: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        lat?: number;
        lng?: number;
    }, {
        lat?: number;
        lng?: number;
    }>>>;
}, "strip", z.ZodTypeAny, {
    location?: {
        lat?: number;
        lng?: number;
    };
    notes?: string;
    job_id?: string;
    team_member_id?: string;
    start_time?: string;
    end_time?: string;
    break_duration?: number;
}, {
    location?: {
        lat?: number;
        lng?: number;
    };
    notes?: string;
    job_id?: string;
    team_member_id?: string;
    start_time?: string;
    end_time?: string;
    break_duration?: number;
}>;
export declare const createMessageSchema: z.ZodObject<{
    customer_id: z.ZodString;
    job_id: z.ZodOptional<z.ZodString>;
    sender_type: z.ZodEnum<["customer", "employee", "system"]>;
    message_type: z.ZodDefault<z.ZodEnum<["text", "photo", "file"]>>;
    content: z.ZodString;
    attachments: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    customer_id?: string;
    job_id?: string;
    sender_type?: "employee" | "customer" | "system";
    message_type?: "text" | "photo" | "file";
    content?: string;
    attachments?: string[];
}, {
    customer_id?: string;
    job_id?: string;
    sender_type?: "employee" | "customer" | "system";
    message_type?: "text" | "photo" | "file";
    content?: string;
    attachments?: string[];
}>;
export declare const createReviewSchema: z.ZodObject<{
    job_id: z.ZodString;
    rating: z.ZodNumber;
    review_text: z.ZodOptional<z.ZodString>;
    photos: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    is_public: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    photos?: string[];
    job_id?: string;
    rating?: number;
    review_text?: string;
    is_public?: boolean;
}, {
    photos?: string[];
    job_id?: string;
    rating?: number;
    review_text?: string;
    is_public?: boolean;
}>;
export declare const qualityChecklistItemSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    required: z.ZodDefault<z.ZodBoolean>;
    photo_required: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    required?: boolean;
    title?: string;
    id?: string;
    photo_required?: boolean;
}, {
    required?: boolean;
    title?: string;
    id?: string;
    photo_required?: boolean;
}>;
export declare const createQualityChecklistSchema: z.ZodObject<{
    service_type: z.ZodEnum<["standard", "deep", "window", "moveout", "office"]>;
    name: z.ZodString;
    items: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        title: z.ZodString;
        required: z.ZodDefault<z.ZodBoolean>;
        photo_required: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        required?: boolean;
        title?: string;
        id?: string;
        photo_required?: boolean;
    }, {
        required?: boolean;
        title?: string;
        id?: string;
        photo_required?: boolean;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    name?: string;
    items?: {
        required?: boolean;
        title?: string;
        id?: string;
        photo_required?: boolean;
    }[];
    service_type?: "standard" | "deep" | "window" | "moveout" | "office";
}, {
    name?: string;
    items?: {
        required?: boolean;
        title?: string;
        id?: string;
        photo_required?: boolean;
    }[];
    service_type?: "standard" | "deep" | "window" | "moveout" | "office";
}>;
export declare const updateQualityChecklistSchema: z.ZodObject<{
    service_type: z.ZodOptional<z.ZodEnum<["standard", "deep", "window", "moveout", "office"]>>;
    name: z.ZodOptional<z.ZodString>;
    items: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        title: z.ZodString;
        required: z.ZodDefault<z.ZodBoolean>;
        photo_required: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        required?: boolean;
        title?: string;
        id?: string;
        photo_required?: boolean;
    }, {
        required?: boolean;
        title?: string;
        id?: string;
        photo_required?: boolean;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    name?: string;
    items?: {
        required?: boolean;
        title?: string;
        id?: string;
        photo_required?: boolean;
    }[];
    service_type?: "standard" | "deep" | "window" | "moveout" | "office";
}, {
    name?: string;
    items?: {
        required?: boolean;
        title?: string;
        id?: string;
        photo_required?: boolean;
    }[];
    service_type?: "standard" | "deep" | "window" | "moveout" | "office";
}>;
export declare const organizationSettingsSchema: z.ZodObject<{
    timezone: z.ZodDefault<z.ZodString>;
    currency: z.ZodDefault<z.ZodString>;
    language: z.ZodDefault<z.ZodString>;
    business_hours: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
        open: z.ZodString;
        close: z.ZodString;
        closed: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        close?: string;
        open?: string;
        closed?: boolean;
    }, {
        close?: string;
        open?: string;
        closed?: boolean;
    }>>>;
}, "strip", z.ZodTypeAny, {
    language?: string;
    timezone?: string;
    currency?: string;
    business_hours?: Record<string, {
        close?: string;
        open?: string;
        closed?: boolean;
    }>;
}, {
    language?: string;
    timezone?: string;
    currency?: string;
    business_hours?: Record<string, {
        close?: string;
        open?: string;
        closed?: boolean;
    }>;
}>;
export declare const updateOrganizationSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodObject<{
        street: z.ZodString;
        city: z.ZodString;
        postal_code: z.ZodString;
        country: z.ZodDefault<z.ZodString>;
        coordinates: z.ZodOptional<z.ZodObject<{
            lat: z.ZodNumber;
            lng: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            lat?: number;
            lng?: number;
        }, {
            lat?: number;
            lng?: number;
        }>>;
    }, "strip", z.ZodTypeAny, {
        street?: string;
        city?: string;
        postal_code?: string;
        country?: string;
        coordinates?: {
            lat?: number;
            lng?: number;
        };
    }, {
        street?: string;
        city?: string;
        postal_code?: string;
        country?: string;
        coordinates?: {
            lat?: number;
            lng?: number;
        };
    }>>;
    settings: z.ZodOptional<z.ZodObject<{
        timezone: z.ZodDefault<z.ZodString>;
        currency: z.ZodDefault<z.ZodString>;
        language: z.ZodDefault<z.ZodString>;
        business_hours: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
            open: z.ZodString;
            close: z.ZodString;
            closed: z.ZodOptional<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            close?: string;
            open?: string;
            closed?: boolean;
        }, {
            close?: string;
            open?: string;
            closed?: boolean;
        }>>>;
    }, "strip", z.ZodTypeAny, {
        language?: string;
        timezone?: string;
        currency?: string;
        business_hours?: Record<string, {
            close?: string;
            open?: string;
            closed?: boolean;
        }>;
    }, {
        language?: string;
        timezone?: string;
        currency?: string;
        business_hours?: Record<string, {
            close?: string;
            open?: string;
            closed?: boolean;
        }>;
    }>>;
}, "strip", z.ZodTypeAny, {
    name?: string;
    email?: string;
    phone?: string;
    address?: {
        street?: string;
        city?: string;
        postal_code?: string;
        country?: string;
        coordinates?: {
            lat?: number;
            lng?: number;
        };
    };
    settings?: {
        language?: string;
        timezone?: string;
        currency?: string;
        business_hours?: Record<string, {
            close?: string;
            open?: string;
            closed?: boolean;
        }>;
    };
}, {
    name?: string;
    email?: string;
    phone?: string;
    address?: {
        street?: string;
        city?: string;
        postal_code?: string;
        country?: string;
        coordinates?: {
            lat?: number;
            lng?: number;
        };
    };
    settings?: {
        language?: string;
        timezone?: string;
        currency?: string;
        business_hours?: Record<string, {
            close?: string;
            open?: string;
            closed?: boolean;
        }>;
    };
}>;
export declare const validateSchema: <T>(schema: z.ZodSchema<T>, data: unknown) => T;
export declare const validatePartialSchema: <T>(schema: z.ZodSchema<T>, data: unknown) => Partial<T>;
