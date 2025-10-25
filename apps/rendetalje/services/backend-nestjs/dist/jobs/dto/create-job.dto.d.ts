import { ServiceType } from '../entities/job.entity';
declare class AddressDto {
    street: string;
    city: string;
    postal_code: string;
    country: string;
    coordinates?: {
        lat: number;
        lng: number;
    };
}
declare class ChecklistItemDto {
    id: string;
    title: string;
    completed?: boolean;
    photo_required?: boolean;
    photo_url?: string;
    notes?: string;
}
export declare class CreateJobDto {
    customer_id: string;
    service_type: ServiceType;
    scheduled_date: string;
    estimated_duration: number;
    location: AddressDto;
    special_instructions?: string;
    checklist?: ChecklistItemDto[];
    recurring_job_id?: string;
}
export {};
