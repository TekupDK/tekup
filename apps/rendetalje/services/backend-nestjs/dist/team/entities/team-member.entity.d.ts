export interface WeeklyAvailability {
    monday?: {
        start: string;
        end: string;
        available: boolean;
    };
    tuesday?: {
        start: string;
        end: string;
        available: boolean;
    };
    wednesday?: {
        start: string;
        end: string;
        available: boolean;
    };
    thursday?: {
        start: string;
        end: string;
        available: boolean;
    };
    friday?: {
        start: string;
        end: string;
        available: boolean;
    };
    saturday?: {
        start: string;
        end: string;
        available: boolean;
    };
    sunday?: {
        start: string;
        end: string;
        available: boolean;
    };
}
export interface PerformanceMetrics {
    jobsCompleted: number;
    averageJobDuration: number;
    averageQualityScore: number;
    customerSatisfaction: number;
    punctualityScore: number;
    efficiencyRating: number;
    totalHoursWorked: number;
    overtimeHours: number;
}
export declare class TeamMember {
    id: string;
    userId: string;
    employeeId: string;
    skills: string[];
    hourlyRate?: number;
    availability: WeeklyAvailability;
    performanceMetrics: PerformanceMetrics;
    isActive: boolean;
    hireDate?: Date;
    createdAt: Date;
    updatedAt: Date;
}
