import { PrismaService } from '../database/prisma.service';
import { QualityChecklistsService } from './quality-checklists.service';
import { PhotoDocumentationService } from './photo-documentation.service';
import { JobQualityAssessment } from './entities/job-quality-assessment.entity';
import { CreateQualityAssessmentDto } from './dto';
export declare class QualityService {
    private readonly prisma;
    private readonly qualityChecklistsService;
    private readonly photoDocumentationService;
    private readonly logger;
    constructor(prisma: PrismaService, qualityChecklistsService: QualityChecklistsService, photoDocumentationService: PhotoDocumentationService);
    createAssessment(createDto: CreateQualityAssessmentDto, assessedBy: string): Promise<JobQualityAssessment>;
    getJobAssessment(jobId: string): Promise<JobQualityAssessment | null>;
    updateAssessment(assessmentId: string, updates: Partial<JobQualityAssessment>): Promise<JobQualityAssessment>;
    getOrganizationQualityMetrics(): Promise<any>;
    getQualityIssues(severity?: 'low' | 'medium' | 'high'): Promise<any[]>;
    generateQualityReport(dateFrom: string, dateTo: string): Promise<any>;
    private calculateScores;
}
