import { ServiceType } from '../../jobs/entities/job.entity';
declare class ChecklistItemDto {
    id: string;
    title: string;
    description?: string;
    required: boolean;
    photo_required: boolean;
    order: number;
    category?: string;
    points?: number;
}
export declare class CreateQualityChecklistDto {
    service_type: ServiceType;
    name: string;
    description?: string;
    items: ChecklistItemDto[];
}
export {};
