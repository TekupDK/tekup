import { z } from 'zod';
export declare enum JobStatus {
    SCHEDULED = "scheduled",
    CONFIRMED = "confirmed",
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed",
    CANCELLED = "cancelled",
    RESCHEDULED = "rescheduled"
}
export declare enum ServiceType {
    STANDARD = "standard",
    DEEP = "deep",
    WINDOW = "window",
    MOVEOUT = "moveout",
    OFFICE = "office",
    CONSTRUCTION = "construction"
}
export declare const AddressSchema: z.ZodObject<{
    street: z.ZodString;
    city: z.ZodString;
    postalCode: z.ZodString;
    country: z.ZodDefault<z.ZodString>;
    coordinates: z.ZodOptional<z.ZodObject<{
        lat: z.ZodNumber;
        lng: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        lat: number;
        lng: number;
    }, {
        lat: number;
        lng: number;
    }>>;
}, "strip", z.ZodTypeAny, {
    street: string;
    city: string;
    postalCode: string;
    country: string;
    coordinates?: {
        lat: number;
        lng: number;
    } | undefined;
}, {
    street: string;
    city: string;
    postalCode: string;
    country?: string | undefined;
    coordinates?: {
        lat: number;
        lng: number;
    } | undefined;
}>;
export type Address = z.infer<typeof AddressSchema>;
export declare const TaskItemSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    completed: z.ZodDefault<z.ZodBoolean>;
    completedAt: z.ZodOptional<z.ZodDate>;
    completedBy: z.ZodOptional<z.ZodString>;
    required: z.ZodDefault<z.ZodBoolean>;
    estimatedMinutes: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    id: string;
    completed: boolean;
    title: string;
    required: boolean;
    description?: string | undefined;
    completedAt?: Date | undefined;
    completedBy?: string | undefined;
    estimatedMinutes?: number | undefined;
}, {
    id: string;
    title: string;
    completed?: boolean | undefined;
    description?: string | undefined;
    completedAt?: Date | undefined;
    completedBy?: string | undefined;
    required?: boolean | undefined;
    estimatedMinutes?: number | undefined;
}>;
export type TaskItem = z.infer<typeof TaskItemSchema>;
export declare const JobPhotoSchema: z.ZodObject<{
    id: z.ZodString;
    url: z.ZodString;
    type: z.ZodEnum<["before", "during", "after", "issue"]>;
    description: z.ZodOptional<z.ZodString>;
    uploadedBy: z.ZodString;
    uploadedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: "before" | "during" | "after" | "issue";
    url: string;
    uploadedBy: string;
    uploadedAt: Date;
    description?: string | undefined;
}, {
    id: string;
    type: "before" | "during" | "after" | "issue";
    url: string;
    uploadedBy: string;
    uploadedAt: Date;
    description?: string | undefined;
}>;
export type JobPhoto = z.infer<typeof JobPhotoSchema>;
export declare const JobProfitabilitySchema: z.ZodObject<{
    estimatedRevenue: z.ZodNumber;
    actualRevenue: z.ZodOptional<z.ZodNumber>;
    estimatedCosts: z.ZodNumber;
    actualCosts: z.ZodOptional<z.ZodNumber>;
    laborHours: z.ZodOptional<z.ZodNumber>;
    materialCosts: z.ZodOptional<z.ZodNumber>;
    travelCosts: z.ZodOptional<z.ZodNumber>;
    profitMargin: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    estimatedRevenue: number;
    estimatedCosts: number;
    actualRevenue?: number | undefined;
    actualCosts?: number | undefined;
    laborHours?: number | undefined;
    materialCosts?: number | undefined;
    travelCosts?: number | undefined;
    profitMargin?: number | undefined;
}, {
    estimatedRevenue: number;
    estimatedCosts: number;
    actualRevenue?: number | undefined;
    actualCosts?: number | undefined;
    laborHours?: number | undefined;
    materialCosts?: number | undefined;
    travelCosts?: number | undefined;
    profitMargin?: number | undefined;
}>;
export type JobProfitability = z.infer<typeof JobProfitabilitySchema>;
export declare const JobSchema: z.ZodObject<{
    id: z.ZodString;
    organizationId: z.ZodString;
    customerId: z.ZodString;
    serviceType: z.ZodNativeEnum<typeof ServiceType>;
    status: z.ZodNativeEnum<typeof JobStatus>;
    scheduledDate: z.ZodDate;
    estimatedDuration: z.ZodNumber;
    actualDuration: z.ZodOptional<z.ZodNumber>;
    assignedTeamMembers: z.ZodArray<z.ZodString, "many">;
    location: z.ZodObject<{
        street: z.ZodString;
        city: z.ZodString;
        postalCode: z.ZodString;
        country: z.ZodDefault<z.ZodString>;
        coordinates: z.ZodOptional<z.ZodObject<{
            lat: z.ZodNumber;
            lng: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            lat: number;
            lng: number;
        }, {
            lat: number;
            lng: number;
        }>>;
    }, "strip", z.ZodTypeAny, {
        street: string;
        city: string;
        postalCode: string;
        country: string;
        coordinates?: {
            lat: number;
            lng: number;
        } | undefined;
    }, {
        street: string;
        city: string;
        postalCode: string;
        country?: string | undefined;
        coordinates?: {
            lat: number;
            lng: number;
        } | undefined;
    }>;
    specialInstructions: z.ZodOptional<z.ZodString>;
    checklist: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        title: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        completed: z.ZodDefault<z.ZodBoolean>;
        completedAt: z.ZodOptional<z.ZodDate>;
        completedBy: z.ZodOptional<z.ZodString>;
        required: z.ZodDefault<z.ZodBoolean>;
        estimatedMinutes: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        completed: boolean;
        title: string;
        required: boolean;
        description?: string | undefined;
        completedAt?: Date | undefined;
        completedBy?: string | undefined;
        estimatedMinutes?: number | undefined;
    }, {
        id: string;
        title: string;
        completed?: boolean | undefined;
        description?: string | undefined;
        completedAt?: Date | undefined;
        completedBy?: string | undefined;
        required?: boolean | undefined;
        estimatedMinutes?: number | undefined;
    }>, "many">>;
    photos: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        url: z.ZodString;
        type: z.ZodEnum<["before", "during", "after", "issue"]>;
        description: z.ZodOptional<z.ZodString>;
        uploadedBy: z.ZodString;
        uploadedAt: z.ZodDate;
    }, "strip", z.ZodTypeAny, {
        id: string;
        type: "before" | "during" | "after" | "issue";
        url: string;
        uploadedBy: string;
        uploadedAt: Date;
        description?: string | undefined;
    }, {
        id: string;
        type: "before" | "during" | "after" | "issue";
        url: string;
        uploadedBy: string;
        uploadedAt: Date;
        description?: string | undefined;
    }>, "many">>;
    customerSignature: z.ZodOptional<z.ZodString>;
    qualityScore: z.ZodOptional<z.ZodNumber>;
    profitability: z.ZodOptional<z.ZodObject<{
        estimatedRevenue: z.ZodNumber;
        actualRevenue: z.ZodOptional<z.ZodNumber>;
        estimatedCosts: z.ZodNumber;
        actualCosts: z.ZodOptional<z.ZodNumber>;
        laborHours: z.ZodOptional<z.ZodNumber>;
        materialCosts: z.ZodOptional<z.ZodNumber>;
        travelCosts: z.ZodOptional<z.ZodNumber>;
        profitMargin: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        estimatedRevenue: number;
        estimatedCosts: number;
        actualRevenue?: number | undefined;
        actualCosts?: number | undefined;
        laborHours?: number | undefined;
        materialCosts?: number | undefined;
        travelCosts?: number | undefined;
        profitMargin?: number | undefined;
    }, {
        estimatedRevenue: number;
        estimatedCosts: number;
        actualRevenue?: number | undefined;
        actualCosts?: number | undefined;
        laborHours?: number | undefined;
        materialCosts?: number | undefined;
        travelCosts?: number | undefined;
        profitMargin?: number | undefined;
    }>>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    organizationId: string;
    status: JobStatus;
    createdAt: Date;
    updatedAt: Date;
    customerId: string;
    serviceType: ServiceType;
    scheduledDate: Date;
    estimatedDuration: number;
    assignedTeamMembers: string[];
    location: {
        street: string;
        city: string;
        postalCode: string;
        country: string;
        coordinates?: {
            lat: number;
            lng: number;
        } | undefined;
    };
    checklist: {
        id: string;
        completed: boolean;
        title: string;
        required: boolean;
        description?: string | undefined;
        completedAt?: Date | undefined;
        completedBy?: string | undefined;
        estimatedMinutes?: number | undefined;
    }[];
    photos: {
        id: string;
        type: "before" | "during" | "after" | "issue";
        url: string;
        uploadedBy: string;
        uploadedAt: Date;
        description?: string | undefined;
    }[];
    actualDuration?: number | undefined;
    specialInstructions?: string | undefined;
    customerSignature?: string | undefined;
    qualityScore?: number | undefined;
    profitability?: {
        estimatedRevenue: number;
        estimatedCosts: number;
        actualRevenue?: number | undefined;
        actualCosts?: number | undefined;
        laborHours?: number | undefined;
        materialCosts?: number | undefined;
        travelCosts?: number | undefined;
        profitMargin?: number | undefined;
    } | undefined;
}, {
    id: string;
    organizationId: string;
    status: JobStatus;
    createdAt: Date;
    updatedAt: Date;
    customerId: string;
    serviceType: ServiceType;
    scheduledDate: Date;
    estimatedDuration: number;
    assignedTeamMembers: string[];
    location: {
        street: string;
        city: string;
        postalCode: string;
        country?: string | undefined;
        coordinates?: {
            lat: number;
            lng: number;
        } | undefined;
    };
    actualDuration?: number | undefined;
    specialInstructions?: string | undefined;
    checklist?: {
        id: string;
        title: string;
        completed?: boolean | undefined;
        description?: string | undefined;
        completedAt?: Date | undefined;
        completedBy?: string | undefined;
        required?: boolean | undefined;
        estimatedMinutes?: number | undefined;
    }[] | undefined;
    photos?: {
        id: string;
        type: "before" | "during" | "after" | "issue";
        url: string;
        uploadedBy: string;
        uploadedAt: Date;
        description?: string | undefined;
    }[] | undefined;
    customerSignature?: string | undefined;
    qualityScore?: number | undefined;
    profitability?: {
        estimatedRevenue: number;
        estimatedCosts: number;
        actualRevenue?: number | undefined;
        actualCosts?: number | undefined;
        laborHours?: number | undefined;
        materialCosts?: number | undefined;
        travelCosts?: number | undefined;
        profitMargin?: number | undefined;
    } | undefined;
}>;
export type Job = z.infer<typeof JobSchema>;
export declare const CreateJobSchema: z.ZodObject<{
    customerId: z.ZodString;
    serviceType: z.ZodNativeEnum<typeof ServiceType>;
    scheduledDate: z.ZodDate;
    estimatedDuration: z.ZodNumber;
    location: z.ZodObject<{
        street: z.ZodString;
        city: z.ZodString;
        postalCode: z.ZodString;
        country: z.ZodDefault<z.ZodString>;
        coordinates: z.ZodOptional<z.ZodObject<{
            lat: z.ZodNumber;
            lng: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            lat: number;
            lng: number;
        }, {
            lat: number;
            lng: number;
        }>>;
    }, "strip", z.ZodTypeAny, {
        street: string;
        city: string;
        postalCode: string;
        country: string;
        coordinates?: {
            lat: number;
            lng: number;
        } | undefined;
    }, {
        street: string;
        city: string;
        postalCode: string;
        country?: string | undefined;
        coordinates?: {
            lat: number;
            lng: number;
        } | undefined;
    }>;
    specialInstructions: z.ZodOptional<z.ZodString>;
    assignedTeamMembers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    customerId: string;
    serviceType: ServiceType;
    scheduledDate: Date;
    estimatedDuration: number;
    location: {
        street: string;
        city: string;
        postalCode: string;
        country: string;
        coordinates?: {
            lat: number;
            lng: number;
        } | undefined;
    };
    assignedTeamMembers?: string[] | undefined;
    specialInstructions?: string | undefined;
}, {
    customerId: string;
    serviceType: ServiceType;
    scheduledDate: Date;
    estimatedDuration: number;
    location: {
        street: string;
        city: string;
        postalCode: string;
        country?: string | undefined;
        coordinates?: {
            lat: number;
            lng: number;
        } | undefined;
    };
    assignedTeamMembers?: string[] | undefined;
    specialInstructions?: string | undefined;
}>;
export type CreateJobRequest = z.infer<typeof CreateJobSchema>;
export declare const UpdateJobSchema: z.ZodObject<{
    serviceType: z.ZodOptional<z.ZodNativeEnum<typeof ServiceType>>;
    status: z.ZodOptional<z.ZodNativeEnum<typeof JobStatus>>;
    scheduledDate: z.ZodOptional<z.ZodDate>;
    estimatedDuration: z.ZodOptional<z.ZodNumber>;
    assignedTeamMembers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    location: z.ZodOptional<z.ZodObject<{
        street: z.ZodString;
        city: z.ZodString;
        postalCode: z.ZodString;
        country: z.ZodDefault<z.ZodString>;
        coordinates: z.ZodOptional<z.ZodObject<{
            lat: z.ZodNumber;
            lng: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            lat: number;
            lng: number;
        }, {
            lat: number;
            lng: number;
        }>>;
    }, "strip", z.ZodTypeAny, {
        street: string;
        city: string;
        postalCode: string;
        country: string;
        coordinates?: {
            lat: number;
            lng: number;
        } | undefined;
    }, {
        street: string;
        city: string;
        postalCode: string;
        country?: string | undefined;
        coordinates?: {
            lat: number;
            lng: number;
        } | undefined;
    }>>;
    specialInstructions: z.ZodOptional<z.ZodString>;
    actualDuration: z.ZodOptional<z.ZodNumber>;
    qualityScore: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    status?: JobStatus | undefined;
    serviceType?: ServiceType | undefined;
    scheduledDate?: Date | undefined;
    estimatedDuration?: number | undefined;
    actualDuration?: number | undefined;
    assignedTeamMembers?: string[] | undefined;
    location?: {
        street: string;
        city: string;
        postalCode: string;
        country: string;
        coordinates?: {
            lat: number;
            lng: number;
        } | undefined;
    } | undefined;
    specialInstructions?: string | undefined;
    qualityScore?: number | undefined;
}, {
    status?: JobStatus | undefined;
    serviceType?: ServiceType | undefined;
    scheduledDate?: Date | undefined;
    estimatedDuration?: number | undefined;
    actualDuration?: number | undefined;
    assignedTeamMembers?: string[] | undefined;
    location?: {
        street: string;
        city: string;
        postalCode: string;
        country?: string | undefined;
        coordinates?: {
            lat: number;
            lng: number;
        } | undefined;
    } | undefined;
    specialInstructions?: string | undefined;
    qualityScore?: number | undefined;
}>;
export type UpdateJobRequest = z.infer<typeof UpdateJobSchema>;
export declare const JobAssignmentSchema: z.ZodObject<{
    id: z.ZodString;
    jobId: z.ZodString;
    teamMemberId: z.ZodString;
    role: z.ZodDefault<z.ZodString>;
    assignedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    role: string;
    jobId: string;
    teamMemberId: string;
    assignedAt: Date;
}, {
    id: string;
    jobId: string;
    teamMemberId: string;
    assignedAt: Date;
    role?: string | undefined;
}>;
export type JobAssignment = z.infer<typeof JobAssignmentSchema>;
export declare const TimeEntrySchema: z.ZodObject<{
    id: z.ZodString;
    jobId: z.ZodString;
    teamMemberId: z.ZodString;
    startTime: z.ZodDate;
    endTime: z.ZodOptional<z.ZodDate>;
    breakDuration: z.ZodDefault<z.ZodNumber>;
    notes: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: Date;
    jobId: string;
    teamMemberId: string;
    startTime: Date;
    breakDuration: number;
    endTime?: Date | undefined;
    notes?: string | undefined;
}, {
    id: string;
    createdAt: Date;
    jobId: string;
    teamMemberId: string;
    startTime: Date;
    endTime?: Date | undefined;
    breakDuration?: number | undefined;
    notes?: string | undefined;
}>;
export type TimeEntry = z.infer<typeof TimeEntrySchema>;
export interface JobWithRelations extends Job {
    customer: {
        id: string;
        name: string;
        email: string;
        phone: string;
    };
    assignedTeam: Array<{
        id: string;
        name: string;
        role: string;
    }>;
    timeEntries: TimeEntry[];
    assignments: JobAssignment[];
}
export interface JobStatistics {
    totalJobs: number;
    completedJobs: number;
    cancelledJobs: number;
    averageDuration: number;
    averageQualityScore: number;
    totalRevenue: number;
    averageRevenue: number;
    completionRate: number;
}
