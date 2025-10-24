import { SupabaseService } from '../supabase/supabase.service';
import { JobsService } from '../jobs/jobs.service';
import { QualityChecklistsService } from './quality-checklists.service';
import { PhotoDocumentationService } from './photo-documentation.service';
import { JobQualityAssessment } from './entities/job-quality-assessment.entity';
import { CreateQualityAssessmentDto } from './dto';
export declare class QualityService {
    private readonly supabaseService;
    private readonly jobsService;
    private readonly qualityChecklistsService;
    private readonly photoDocumentationService;
    constructor(supabaseService: SupabaseService, jobsService: JobsService, qualityChecklistsService: QualityChecklistsService, photoDocumentationService: PhotoDocumentationService);
    createAssessment(createDto: CreateQualityAssessmentDto, organizationId: string, assessedBy: string): Promise<JobQualityAssessment>;
    getJobAssessment(jobId: string, organizationId: string): Promise<JobQualityAssessment | null>;
    updateAssessment(assessmentId: string, updates: Partial<JobQualityAssessment>, organizationId: string): Promise<JobQualityAssessment>;
    getOrganizationQualityMetrics(organizationId: string): Promise<any>;
    getQualityIssues(organizationId: string, severity?: 'low' | 'medium' | 'high'): Promise<any[]>;
    generateQualityReport(organizationId: string, dateFrom: string, dateTo: string): Promise<any>;
    private calculateScores;
    private extractIssuesFromCompletedItems;
    private generateQualityRecommendations;
}
