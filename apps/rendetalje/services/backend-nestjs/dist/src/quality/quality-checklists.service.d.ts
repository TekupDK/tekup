import { BaseService } from '../common/services/base.service';
import { SupabaseService } from '../supabase/supabase.service';
import { QualityChecklist, ChecklistItem } from './entities/quality-checklist.entity';
import { CreateQualityChecklistDto } from './dto';
import { ServiceType } from '../jobs/entities/job.entity';
export declare class QualityChecklistsService extends BaseService<QualityChecklist> {
    protected readonly supabaseService: SupabaseService;
    protected tableName: string;
    protected searchFields: string[];
    constructor(supabaseService: SupabaseService);
    create(createDto: CreateQualityChecklistDto, organizationId: string): Promise<QualityChecklist>;
    getByServiceType(serviceType: ServiceType, organizationId: string): Promise<QualityChecklist | null>;
    createNewVersion(checklistId: string, organizationId: string, updates: Partial<QualityChecklist>): Promise<QualityChecklist>;
    getChecklistVersions(serviceType: ServiceType, organizationId: string): Promise<QualityChecklist[]>;
    duplicateChecklist(checklistId: string, organizationId: string, newServiceType: ServiceType, newName: string): Promise<QualityChecklist>;
    validateChecklistItems(items: ChecklistItem[]): Promise<{
        isValid: boolean;
        errors: string[];
    }>;
    getChecklistAnalytics(organizationId: string): Promise<any>;
    initializeDefaultChecklists(organizationId: string): Promise<QualityChecklist[]>;
}
