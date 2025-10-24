import { PaginationDto } from '../../common/dto/pagination.dto';
import { LeadStatus, LeadPriority } from '../entities/lead.entity';
export declare class LeadFiltersDto extends PaginationDto {
    status?: LeadStatus;
    priority?: LeadPriority;
    source?: string;
    minEstimatedValue?: number;
    minScore?: number;
    email?: string;
    phone?: string;
}
