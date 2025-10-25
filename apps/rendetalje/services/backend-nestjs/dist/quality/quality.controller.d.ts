import { QualityService } from './quality.service';
import { QualityChecklistsService } from './quality-checklists.service';
import { PhotoDocumentationService } from './photo-documentation.service';
import { CreateQualityChecklistDto, CreateQualityAssessmentDto } from './dto';
export declare class QualityController {
    private readonly qualityService;
    private readonly qualityChecklistsService;
    private readonly photoDocumentationService;
    constructor(qualityService: QualityService, qualityChecklistsService: QualityChecklistsService, photoDocumentationService: PhotoDocumentationService);
    createChecklist(createChecklistDto: CreateQualityChecklistDto): Promise<import("./entities/quality-checklist.entity").QualityChecklist>;
    getChecklists(serviceType?: string, isActive?: boolean): Promise<import("./entities/quality-checklist.entity").QualityChecklist[]>;
    getChecklistByServiceType(serviceType: string): Promise<import("./entities/quality-checklist.entity").QualityChecklist>;
    getChecklist(id: string): Promise<import("./entities/quality-checklist.entity").QualityChecklist>;
    updateChecklist(id: string, updates: Partial<CreateQualityChecklistDto>): Promise<import("./entities/quality-checklist.entity").QualityChecklist>;
    duplicateChecklist(id: string, data: {
        serviceType: string;
        name: string;
    }): Promise<import("./entities/quality-checklist.entity").QualityChecklist>;
    getChecklistVersions(serviceType: string): Promise<import("./entities/quality-checklist.entity").QualityChecklist[]>;
    initializeDefaultChecklists(): Promise<import("./entities/quality-checklist.entity").QualityChecklist[]>;
    createAssessment(createAssessmentDto: CreateQualityAssessmentDto, req: any): Promise<import("./entities/job-quality-assessment.entity").JobQualityAssessment>;
    getJobAssessment(jobId: string): Promise<import("./entities/job-quality-assessment.entity").JobQualityAssessment>;
    updateAssessment(id: string, updates: Partial<CreateQualityAssessmentDto>): Promise<import("./entities/job-quality-assessment.entity").JobQualityAssessment>;
    uploadPhotos(files: Express.Multer.File[], metadata: {
        jobId: string;
        checklistItemId?: string;
        type: 'before' | 'after' | 'during' | 'issue' | 'quality';
        description?: string;
    }, req: any): Promise<any[]>;
    getJobPhotos(jobId: string, type?: string): Promise<any[]>;
    deletePhoto(photoUrl: string): Promise<void>;
    comparePhotos(data: {
        beforePhotoUrl: string;
        afterPhotoUrl: string;
    }): Promise<any>;
    generatePhotoReport(jobId: string): Promise<any>;
    organizePhotosByDate(dateFrom: string, dateTo: string): Promise<any>;
    getQualityMetrics(): Promise<any>;
    getQualityIssues(severity?: 'low' | 'medium' | 'high'): Promise<any[]>;
    generateQualityReport(dateFrom: string, dateTo: string): Promise<any>;
    getChecklistAnalytics(): Promise<any>;
}
