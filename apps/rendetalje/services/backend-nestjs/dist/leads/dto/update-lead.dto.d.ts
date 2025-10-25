import { CreateLeadDto } from './create-lead.dto';
import { LeadStatus, LeadPriority } from '../entities/lead.entity';
declare const UpdateLeadDto_base: import("@nestjs/common").Type<Partial<CreateLeadDto>>;
export declare class UpdateLeadDto extends UpdateLeadDto_base {
    status?: LeadStatus;
    followUpAttempts?: number;
    lastFollowUpDate?: string;
    companyName?: string;
    industry?: string;
    estimatedSize?: string;
    estimatedValue?: number;
    score?: number;
    priority?: LeadPriority;
}
export {};
