import { z } from 'zod';

// Job Status
export enum JobStatus {
  SCHEDULED = 'scheduled',
  CONFIRMED = 'confirmed', 
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  RESCHEDULED = 'rescheduled'
}

// Service Types
export enum ServiceType {
  STANDARD = 'standard',
  DEEP = 'deep',
  WINDOW = 'window',
  MOVEOUT = 'moveout',
  OFFICE = 'office',
  CONSTRUCTION = 'construction'
}

// Address Schema
export const AddressSchema = z.object({
  street: z.string().min(1),
  city: z.string().min(1),
  postalCode: z.string().regex(/^\d{4}$/),
  country: z.string().default('Denmark'),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number()
  }).optional()
});

export type Address = z.infer<typeof AddressSchema>;

// Task Item Schema
export const TaskItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  completed: z.boolean().default(false),
  completedAt: z.date().optional(),
  completedBy: z.string().uuid().optional(),
  required: z.boolean().default(false),
  estimatedMinutes: z.number().optional()
});

export type TaskItem = z.infer<typeof TaskItemSchema>;

// Job Photo Schema
export const JobPhotoSchema = z.object({
  id: z.string().uuid(),
  url: z.string().url(),
  type: z.enum(['before', 'during', 'after', 'issue']),
  description: z.string().optional(),
  uploadedBy: z.string().uuid(),
  uploadedAt: z.date()
});

export type JobPhoto = z.infer<typeof JobPhotoSchema>;

// Job Profitability Schema
export const JobProfitabilitySchema = z.object({
  estimatedRevenue: z.number(),
  actualRevenue: z.number().optional(),
  estimatedCosts: z.number(),
  actualCosts: z.number().optional(),
  laborHours: z.number().optional(),
  materialCosts: z.number().optional(),
  travelCosts: z.number().optional(),
  profitMargin: z.number().optional()
});

export type JobProfitability = z.infer<typeof JobProfitabilitySchema>;

// Main Job Schema
export const JobSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  customerId: z.string().uuid(),
  serviceType: z.nativeEnum(ServiceType),
  status: z.nativeEnum(JobStatus),
  scheduledDate: z.date(),
  estimatedDuration: z.number().min(30), // minutes
  actualDuration: z.number().optional(),
  assignedTeamMembers: z.array(z.string().uuid()),
  location: AddressSchema,
  specialInstructions: z.string().optional(),
  checklist: z.array(TaskItemSchema).default([]),
  photos: z.array(JobPhotoSchema).default([]),
  customerSignature: z.string().optional(),
  qualityScore: z.number().min(1).max(5).optional(),
  profitability: JobProfitabilitySchema.optional(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export type Job = z.infer<typeof JobSchema>;

// Create Job Request
export const CreateJobSchema = z.object({
  customerId: z.string().uuid(),
  serviceType: z.nativeEnum(ServiceType),
  scheduledDate: z.date(),
  estimatedDuration: z.number().min(30),
  location: AddressSchema,
  specialInstructions: z.string().optional(),
  assignedTeamMembers: z.array(z.string().uuid()).optional()
});

export type CreateJobRequest = z.infer<typeof CreateJobSchema>;

// Update Job Request
export const UpdateJobSchema = z.object({
  serviceType: z.nativeEnum(ServiceType).optional(),
  status: z.nativeEnum(JobStatus).optional(),
  scheduledDate: z.date().optional(),
  estimatedDuration: z.number().min(30).optional(),
  assignedTeamMembers: z.array(z.string().uuid()).optional(),
  location: AddressSchema.optional(),
  specialInstructions: z.string().optional(),
  actualDuration: z.number().optional(),
  qualityScore: z.number().min(1).max(5).optional()
});

export type UpdateJobRequest = z.infer<typeof UpdateJobSchema>;

// Job Assignment
export const JobAssignmentSchema = z.object({
  id: z.string().uuid(),
  jobId: z.string().uuid(),
  teamMemberId: z.string().uuid(),
  role: z.string().default('cleaner'),
  assignedAt: z.date()
});

export type JobAssignment = z.infer<typeof JobAssignmentSchema>;

// Time Entry
export const TimeEntrySchema = z.object({
  id: z.string().uuid(),
  jobId: z.string().uuid(),
  teamMemberId: z.string().uuid(),
  startTime: z.date(),
  endTime: z.date().optional(),
  breakDuration: z.number().default(0), // minutes
  notes: z.string().optional(),
  createdAt: z.date()
});

export type TimeEntry = z.infer<typeof TimeEntrySchema>;

// Job with Relations
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

// Job Statistics
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