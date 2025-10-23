"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeEntrySchema = exports.JobAssignmentSchema = exports.UpdateJobSchema = exports.CreateJobSchema = exports.JobSchema = exports.JobProfitabilitySchema = exports.JobPhotoSchema = exports.TaskItemSchema = exports.AddressSchema = exports.ServiceType = exports.JobStatus = void 0;
const zod_1 = require("zod");
// Job Status
var JobStatus;
(function (JobStatus) {
    JobStatus["SCHEDULED"] = "scheduled";
    JobStatus["CONFIRMED"] = "confirmed";
    JobStatus["IN_PROGRESS"] = "in_progress";
    JobStatus["COMPLETED"] = "completed";
    JobStatus["CANCELLED"] = "cancelled";
    JobStatus["RESCHEDULED"] = "rescheduled";
})(JobStatus || (exports.JobStatus = JobStatus = {}));
// Service Types
var ServiceType;
(function (ServiceType) {
    ServiceType["STANDARD"] = "standard";
    ServiceType["DEEP"] = "deep";
    ServiceType["WINDOW"] = "window";
    ServiceType["MOVEOUT"] = "moveout";
    ServiceType["OFFICE"] = "office";
    ServiceType["CONSTRUCTION"] = "construction";
})(ServiceType || (exports.ServiceType = ServiceType = {}));
// Address Schema
exports.AddressSchema = zod_1.z.object({
    street: zod_1.z.string().min(1),
    city: zod_1.z.string().min(1),
    postalCode: zod_1.z.string().regex(/^\d{4}$/),
    country: zod_1.z.string().default('Denmark'),
    coordinates: zod_1.z.object({
        lat: zod_1.z.number(),
        lng: zod_1.z.number()
    }).optional()
});
// Task Item Schema
exports.TaskItemSchema = zod_1.z.object({
    id: zod_1.z.string(),
    title: zod_1.z.string(),
    description: zod_1.z.string().optional(),
    completed: zod_1.z.boolean().default(false),
    completedAt: zod_1.z.date().optional(),
    completedBy: zod_1.z.string().uuid().optional(),
    required: zod_1.z.boolean().default(false),
    estimatedMinutes: zod_1.z.number().optional()
});
// Job Photo Schema
exports.JobPhotoSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    url: zod_1.z.string().url(),
    type: zod_1.z.enum(['before', 'during', 'after', 'issue']),
    description: zod_1.z.string().optional(),
    uploadedBy: zod_1.z.string().uuid(),
    uploadedAt: zod_1.z.date()
});
// Job Profitability Schema
exports.JobProfitabilitySchema = zod_1.z.object({
    estimatedRevenue: zod_1.z.number(),
    actualRevenue: zod_1.z.number().optional(),
    estimatedCosts: zod_1.z.number(),
    actualCosts: zod_1.z.number().optional(),
    laborHours: zod_1.z.number().optional(),
    materialCosts: zod_1.z.number().optional(),
    travelCosts: zod_1.z.number().optional(),
    profitMargin: zod_1.z.number().optional()
});
// Main Job Schema
exports.JobSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    organizationId: zod_1.z.string().uuid(),
    customerId: zod_1.z.string().uuid(),
    serviceType: zod_1.z.nativeEnum(ServiceType),
    status: zod_1.z.nativeEnum(JobStatus),
    scheduledDate: zod_1.z.date(),
    estimatedDuration: zod_1.z.number().min(30), // minutes
    actualDuration: zod_1.z.number().optional(),
    assignedTeamMembers: zod_1.z.array(zod_1.z.string().uuid()),
    location: exports.AddressSchema,
    specialInstructions: zod_1.z.string().optional(),
    checklist: zod_1.z.array(exports.TaskItemSchema).default([]),
    photos: zod_1.z.array(exports.JobPhotoSchema).default([]),
    customerSignature: zod_1.z.string().optional(),
    qualityScore: zod_1.z.number().min(1).max(5).optional(),
    profitability: exports.JobProfitabilitySchema.optional(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date()
});
// Create Job Request
exports.CreateJobSchema = zod_1.z.object({
    customerId: zod_1.z.string().uuid(),
    serviceType: zod_1.z.nativeEnum(ServiceType),
    scheduledDate: zod_1.z.date(),
    estimatedDuration: zod_1.z.number().min(30),
    location: exports.AddressSchema,
    specialInstructions: zod_1.z.string().optional(),
    assignedTeamMembers: zod_1.z.array(zod_1.z.string().uuid()).optional()
});
// Update Job Request
exports.UpdateJobSchema = zod_1.z.object({
    serviceType: zod_1.z.nativeEnum(ServiceType).optional(),
    status: zod_1.z.nativeEnum(JobStatus).optional(),
    scheduledDate: zod_1.z.date().optional(),
    estimatedDuration: zod_1.z.number().min(30).optional(),
    assignedTeamMembers: zod_1.z.array(zod_1.z.string().uuid()).optional(),
    location: exports.AddressSchema.optional(),
    specialInstructions: zod_1.z.string().optional(),
    actualDuration: zod_1.z.number().optional(),
    qualityScore: zod_1.z.number().min(1).max(5).optional()
});
// Job Assignment
exports.JobAssignmentSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    jobId: zod_1.z.string().uuid(),
    teamMemberId: zod_1.z.string().uuid(),
    role: zod_1.z.string().default('cleaner'),
    assignedAt: zod_1.z.date()
});
// Time Entry
exports.TimeEntrySchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    jobId: zod_1.z.string().uuid(),
    teamMemberId: zod_1.z.string().uuid(),
    startTime: zod_1.z.date(),
    endTime: zod_1.z.date().optional(),
    breakDuration: zod_1.z.number().default(0), // minutes
    notes: zod_1.z.string().optional(),
    createdAt: zod_1.z.date()
});
