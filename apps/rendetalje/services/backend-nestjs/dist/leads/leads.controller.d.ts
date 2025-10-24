import { LeadsService } from './leads.service';
import { CreateLeadDto, UpdateLeadDto, LeadFiltersDto } from './dto';
import { Lead, LeadPriority } from './entities/lead.entity';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';
export declare class LeadsController {
    private readonly leadsService;
    constructor(leadsService: LeadsService);
    create(createLeadDto: CreateLeadDto): Promise<Lead>;
    findAll(filters: LeadFiltersDto): Promise<PaginatedResponseDto<Lead>>;
    findOne(id: string): Promise<Lead>;
    update(id: string, updateLeadDto: UpdateLeadDto): Promise<Lead>;
    remove(id: string): Promise<void>;
    enrichLead(id: string, enrichmentData: {
        companyName?: string;
        industry?: string;
        estimatedSize?: string;
        estimatedValue?: number;
        enrichmentData?: Record<string, any>;
    }): Promise<Lead>;
    scoreLead(id: string, scoreData: {
        score: number;
        priority: LeadPriority;
        metadata?: Record<string, any>;
    }): Promise<Lead>;
    incrementFollowUp(id: string): Promise<Lead>;
}
