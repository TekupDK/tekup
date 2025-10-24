import { OrganizationEntity } from '../../common/entities/base.entity';
export declare enum ServiceType {
    STANDARD = "standard",
    DEEP = "deep",
    WINDOW = "window",
    MOVEOUT = "moveout",
    OFFICE = "office"
}
export declare enum JobStatus {
    SCHEDULED = "scheduled",
    CONFIRMED = "confirmed",
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed",
    CANCELLED = "cancelled",
    RESCHEDULED = "rescheduled"
}
export interface Address {
    street: string;
    city: string;
    postal_code: string;
    country: string;
    coordinates?: {
        lat: number;
        lng: number;
    };
}
export interface ChecklistItem {
    id: string;
    title: string;
    completed: boolean;
    photo_required: boolean;
    photo_url?: string;
    notes?: string;
}
export interface JobPhoto {
    id: string;
    url: string;
    type: 'before' | 'after' | 'during' | 'issue';
    caption?: string;
    uploaded_at: string;
}
export interface Profitability {
    total_price: number;
    labor_cost: number;
    material_cost: number;
    travel_cost: number;
    profit_margin: number;
}
export declare class Job extends OrganizationEntity {
    customer_id: string;
    job_number: string;
    service_type: ServiceType;
    status: JobStatus;
    scheduled_date: string;
    estimated_duration: number;
    actual_duration?: number;
    location: Address;
    special_instructions?: string;
    checklist: ChecklistItem[];
    photos: JobPhoto[];
    customer_signature?: string;
    quality_score?: number;
    profitability?: Profitability;
    recurring_job_id?: string;
    parent_job_id?: string;
    invoice_id?: string;
}
