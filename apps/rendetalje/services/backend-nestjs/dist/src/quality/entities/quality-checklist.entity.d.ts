import { OrganizationEntity } from '../../common/entities/base.entity';
import { ServiceType } from '../../jobs/entities/job.entity';
export interface ChecklistItem {
    id: string;
    title: string;
    description?: string;
    required: boolean;
    photo_required: boolean;
    order: number;
    category?: string;
    points?: number;
}
export declare class QualityChecklist extends OrganizationEntity {
    service_type: ServiceType;
    name: string;
    description?: string;
    items: ChecklistItem[];
    is_active: boolean;
    version: number;
}
