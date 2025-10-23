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
export declare const AddressSchema: any;
export type Address = z.infer<typeof AddressSchema>;
export declare const TaskItemSchema: any;
export type TaskItem = z.infer<typeof TaskItemSchema>;
export declare const JobPhotoSchema: any;
export type JobPhoto = z.infer<typeof JobPhotoSchema>;
export declare const JobProfitabilitySchema: any;
export type JobProfitability = z.infer<typeof JobProfitabilitySchema>;
export declare const JobSchema: any;
export type Job = z.infer<typeof JobSchema>;
export declare const CreateJobSchema: any;
export type CreateJobRequest = z.infer<typeof CreateJobSchema>;
export declare const UpdateJobSchema: any;
export type UpdateJobRequest = z.infer<typeof UpdateJobSchema>;
export declare const JobAssignmentSchema: any;
export type JobAssignment = z.infer<typeof JobAssignmentSchema>;
export declare const TimeEntrySchema: any;
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
