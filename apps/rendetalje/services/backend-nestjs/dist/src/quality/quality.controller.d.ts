import { QualityService } from './quality.service';
import { QualityChecklistsService } from './quality-checklists.service';
import { PhotoDocumentationService } from './photo-documentation.service';
import { CreateQualityChecklistDto, CreateQualityAssessmentDto } from './dto';
import { ServiceType } from '../jobs/entities/job.entity';
export declare class QualityController {
    private readonly qualityService;
    private readonly qualityChecklistsService;
    private readonly photoDocumentationService;
    constructor(qualityService: QualityService, qualityChecklistsService: QualityChecklistsService, photoDocumentationService: PhotoDocumentationService);
    createChecklist(createChecklistDto: CreateQualityChecklistDto, req: any): Promise<import("./entities/quality-checklist.entity").QualityChecklist>;
    getChecklists(req: any): Promise<import("../common/dto/pagination.dto").PaginatedResponseDto<import("./entities/quality-checklist.entity").QualityChecklist>>;
    getChecklistByServiceType(serviceType: ServiceType, req: any): Promise<import("./entities/quality-checklist.entity").QualityChecklist>;
    getChecklist(id: string, req: any): Promise<import("./entities/quality-checklist.entity").QualityChecklist>;
    updateChecklist(id: string, updates: Partial<CreateQualityChecklistDto>, req: any): Promise<import("./entities/quality-checklist.entity").QualityChecklist>;
    duplicateChecklist(id: string, data: {
        serviceType: ServiceType;
        name: string;
    }, req: any): Promise<import("./entities/quality-checklist.entity").QualityChecklist>;
    getChecklistVersions(serviceType: ServiceType, req: any): Promise<import("./entities/quality-checklist.entity").QualityChecklist[]>;
    initializeDefaultChecklists(req: any): Promise<import("./entities/quality-checklist.entity").QualityChecklist[]>;
    createAssessment(createAssessmentDto: CreateQualityAssessmentDto, req: any): Promise<import("./entities/job-quality-assessment.entity").JobQualityAssessment>;
    getJobAssessment(jobId: string, req: any): Promise<import("./entities/job-quality-assessment.entity").JobQualityAssessment>;
    updateAssessment(id: string, updates: Partial<CreateQualityAssessmentDto>, req: any): Promise<import("./entities/job-quality-assessment.entity").JobQualityAssessment>;
    uploadPhotos(files: Express.Multer.File[], metadata: {
        jobId: string;
        checklistItemId?: string;
        type: 'before' | 'after' | 'during' | 'issue' | 'quality';
        description?: string;
    }, req: any): Promise<string[]>;
    getJobPhotos(jobId: string, type?: string, req: any): Promise<{
        url: string;
        metadata: any;
    }[]>;
    deletePhoto(photoUrl: string, req: any): Promise<void>;
    comparePhotos(data: {
        beforePhotoUrl: string;
        afterPhotoUrl: string;
    }): Promise<import("./photo-documentation.service").PhotoComparison>;
    generatePhotoReport(jobId: string, req: any): Promise<{
        totalPhotos: number;
        photosByType: Record<string, number>;
        beforeAfterPairs: import("./photo-documentation.service").PhotoComparison[];
        issues: string[];
    }>;
    organizePhotosByDate(dateFrom: string, dateTo: string, req: any): Promise<Record<string, {
        url: string;
        metadata: any;
    }[]>>;
    getQualityMetrics(req: any): Promise<any>;
    getQualityIssues(severity: 'low' | 'medium' | 'high', req: any): Promise<any[]>;
    generateQualityReport(dateFrom: string, dateTo: string, req: any): Promise<any>;
    getChecklistAnalytics(req: any): Promise<any>;
}
