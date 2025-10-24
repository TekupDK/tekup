import { PrismaService } from '../database/prisma.service';
import { QualityChecklist } from './entities/quality-checklist.entity';
import { CreateQualityChecklistDto } from './dto';
export declare class QualityChecklistsService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    create(createDto: CreateQualityChecklistDto): Promise<QualityChecklist>;
    findAll(filters?: {
        serviceType?: string;
        isActive?: boolean;
    }): Promise<QualityChecklist[]>;
    findById(id: string): Promise<QualityChecklist>;
    getByServiceType(serviceType: string): Promise<QualityChecklist | null>;
    createNewVersion(checklistId: string, updates: Partial<CreateQualityChecklistDto>): Promise<QualityChecklist>;
    duplicateChecklist(checklistId: string, newServiceType: string, newName: string): Promise<QualityChecklist>;
    getChecklistVersions(serviceType: string): Promise<QualityChecklist[]>;
    initializeDefaultChecklists(): Promise<QualityChecklist[]>;
    getChecklistAnalytics(): Promise<any>;
}
