import { OrganizationEntity } from '../../common/entities/base.entity';
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
    jobs_completed: number;
    average_job_duration: number;
    average_quality_score: number;
    customer_satisfaction: number;
    punctuality_score: number;
    efficiency_rating: number;
    total_hours_worked: number;
    overtime_hours: number;
}
export declare class TeamMember extends OrganizationEntity {
    user_id: string;
    employee_id: string;
    skills: string[];
    hourly_rate?: number;
    availability: WeeklyAvailability;
    performance_metrics: PerformanceMetrics;
    is_active: boolean;
    hire_date?: string;
}
