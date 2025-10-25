import { PrismaService } from '../database/prisma.service';
import { Lead, LeadPriority } from './entities/lead.entity';
import { CreateLeadDto, UpdateLeadDto, LeadFiltersDto } from './dto';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';
export declare class LeadsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(filters: LeadFiltersDto): Promise<PaginatedResponseDto<Lead>>;
    findOne(id: string): Promise<Lead>;
    create(data: CreateLeadDto): Promise<Lead>;
    update(id: string, data: UpdateLeadDto): Promise<Lead>;
    remove(id: string): Promise<void>;
    enrichLead(id: string, enrichmentData: {
        companyName?: string;
        industry?: string;
        estimatedSize?: string;
        estimatedValue?: number;
        enrichmentData?: Record<string, any>;
    }): Promise<Lead>;
    scoreLead(id: string, score: number, priority: LeadPriority, metadata?: Record<string, any>): Promise<Lead>;
    incrementFollowUpAttempts(id: string): Promise<Lead>;
}
