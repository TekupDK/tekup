import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { JobsService } from '../jobs/jobs.service';
import { QualityChecklistsService } from './quality-checklists.service';
import { PhotoDocumentationService } from './photo-documentation.service';
import { JobQualityAssessment, CompletedChecklistItem } from './entities/job-quality-assessment.entity';
import { CreateQualityAssessmentDto } from './dto';

@Injectable()
export class QualityService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly jobsService: JobsService,
    private readonly qualityChecklistsService: QualityChecklistsService,
    private readonly photoDocumentationService: PhotoDocumentationService,
  ) {}

  async createAssessment(
    createDto: CreateQualityAssessmentDto,
    organizationId: string,
    assessedBy: string,
  ): Promise<JobQualityAssessment> {
    // Verify job exists and belongs to organization
    await this.jobsService.findById(createDto.job_id, organizationId);

    // Verify checklist exists
    await this.qualityChecklistsService.findById(createDto.checklist_id, organizationId);

    // Calculate scores
    const scores = this.calculateScores(createDto.completed_items);

    const assessmentData = {
      ...createDto,
      assessed_by: assessedBy,
      percentage_score: scores.percentage,
      total_points_earned: scores.totalPoints,
      max_possible_points: scores.maxPoints,
      status: 'completed' as const,
    };

    const { data, error } = await this.supabaseService.client
      .from('job_quality_assessments')
      .insert(assessmentData)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(`Failed to create quality assessment: ${error.message}`);
    }

    // Update job quality score
    await this.jobsService.update(
      createDto.job_id,
      { quality_score: createDto.overall_score },
      organizationId,
    );

    return data;
  }

  async getJobAssessment(jobId: string, organizationId: string): Promise<JobQualityAssessment | null> {
    // Verify job belongs to organization
    await this.jobsService.findById(jobId, organizationId);

    const { data, error } = await this.supabaseService.client
      .from('job_quality_assessments')
      .select(`
        *,
        quality_checklists!inner(id, name, service_type),
        users(id, name, email)
      `)
      .eq('job_id', jobId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new BadRequestException(`Failed to get job assessment: ${error.message}`);
    }

    return data;
  }

  async updateAssessment(
    assessmentId: string,
    updates: Partial<JobQualityAssessment>,
    organizationId: string,
  ): Promise<JobQualityAssessment> {
    // Verify assessment exists and belongs to organization
    const { data: existing } = await this.supabaseService.client
      .from('job_quality_assessments')
      .select(`
        id,
        jobs!inner(organization_id)
      `)
      .eq('id', assessmentId)
      .eq('jobs.organization_id', organizationId)
      .single();

    if (!existing) {
      throw new NotFoundException('Quality assessment not found');
    }

    // Recalculate scores if completed_items changed
    if (updates.completed_items) {
      const scores = this.calculateScores(updates.completed_items);
      updates.percentage_score = scores.percentage;
      updates.total_points_earned = scores.totalPoints;
      updates.max_possible_points = scores.maxPoints;
    }

    const { data, error } = await this.supabaseService.client
      .from('job_quality_assessments')
      .update(updates)
      .eq('id', assessmentId)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(`Failed to update quality assessment: ${error.message}`);
    }

    return data;
  }

  async getOrganizationQualityMetrics(organizationId: string): Promise<any> {
    const { data: assessments, error } = await this.supabaseService.client
      .from('job_quality_assessments')
      .select(`
        id,
        overall_score,
        percentage_score,
        created_at,
        jobs!inner(organization_id, service_type, status),
        quality_checklists!inner(service_type, name)
      `)
      .eq('jobs.organization_id', organizationId);

    if (error) {
      throw new BadRequestException(`Failed to get quality metrics: ${error.message}`);
    }

    if (!assessments || assessments.length === 0) {
      return {
        total_assessments: 0,
        average_score: 0,
        average_percentage: 0,
        score_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        by_service_type: {},
        monthly_trends: {},
        quality_trends: [],
      };
    }

    // Calculate metrics
    const totalAssessments = assessments.length;
    const averageScore = assessments.reduce((sum, a) => sum + a.overall_score, 0) / totalAssessments;
    const averagePercentage = assessments.reduce((sum, a) => sum + a.percentage_score, 0) / totalAssessments;

    // Score distribution
    const scoreDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    assessments.forEach(assessment => {
      scoreDistribution[assessment.overall_score as keyof typeof scoreDistribution]++;
    });

    // By service type
    const byServiceType: Record<string, any> = {};
    assessments.forEach(assessment => {
      const serviceType = assessment.jobs.service_type;
      if (!byServiceType[serviceType]) {
        byServiceType[serviceType] = {
          count: 0,
          average_score: 0,
          average_percentage: 0,
          total_score: 0,
          total_percentage: 0,
        };
      }
      byServiceType[serviceType].count++;
      byServiceType[serviceType].total_score += assessment.overall_score;
      byServiceType[serviceType].total_percentage += assessment.percentage_score;
    });

    // Calculate averages for service types
    Object.keys(byServiceType).forEach(serviceType => {
      const data = byServiceType[serviceType];
      data.average_score = data.total_score / data.count;
      data.average_percentage = data.total_percentage / data.count;
    });

    // Monthly trends
    const monthlyTrends: Record<string, any> = {};
    assessments.forEach(assessment => {
      const month = assessment.created_at.substring(0, 7); // YYYY-MM
      if (!monthlyTrends[month]) {
        monthlyTrends[month] = {
          count: 0,
          average_score: 0,
          average_percentage: 0,
          total_score: 0,
          total_percentage: 0,
        };
      }
      monthlyTrends[month].count++;
      monthlyTrends[month].total_score += assessment.overall_score;
      monthlyTrends[month].total_percentage += assessment.percentage_score;
    });

    // Calculate monthly averages
    Object.keys(monthlyTrends).forEach(month => {
      const data = monthlyTrends[month];
      data.average_score = data.total_score / data.count;
      data.average_percentage = data.total_percentage / data.count;
    });

    // Quality trends (last 12 months)
    const qualityTrends = Object.keys(monthlyTrends)
      .sort()
      .slice(-12)
      .map(month => ({
        month,
        average_score: monthlyTrends[month].average_score,
        average_percentage: monthlyTrends[month].average_percentage,
        count: monthlyTrends[month].count,
      }));

    return {
      total_assessments: totalAssessments,
      average_score: Math.round(averageScore * 100) / 100,
      average_percentage: Math.round(averagePercentage * 100) / 100,
      score_distribution: scoreDistribution,
      by_service_type: byServiceType,
      monthly_trends: monthlyTrends,
      quality_trends: qualityTrends,
    };
  }

  async getQualityIssues(organizationId: string, severity: 'low' | 'medium' | 'high' = 'medium'): Promise<any[]> {
    const scoreThresholds = {
      low: 4,    // Issues when score < 4
      medium: 3, // Issues when score < 3
      high: 2,   // Issues when score < 2
    };

    const threshold = scoreThresholds[severity];

    const { data: assessments, error } = await this.supabaseService.client
      .from('job_quality_assessments')
      .select(`
        id,
        overall_score,
        percentage_score,
        notes,
        completed_items,
        created_at,
        jobs!inner(id, job_number, organization_id, service_type, customer_id),
        customers!inner(id, name, email, phone)
      `)
      .eq('jobs.organization_id', organizationId)
      .lt('overall_score', threshold)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      throw new BadRequestException(`Failed to get quality issues: ${error.message}`);
    }

    return (assessments || []).map(assessment => ({
      assessment_id: assessment.id,
      job: assessment.jobs,
      customer: assessment.customers,
      score: assessment.overall_score,
      percentage: assessment.percentage_score,
      issues: this.extractIssuesFromCompletedItems(assessment.completed_items),
      notes: assessment.notes,
      created_at: assessment.created_at,
    }));
  }

  async generateQualityReport(
    organizationId: string,
    dateFrom: string,
    dateTo: string,
  ): Promise<any> {
    const metrics = await this.getOrganizationQualityMetrics(organizationId);
    const issues = await this.getQualityIssues(organizationId, 'medium');
    
    // Get photo statistics
    const photos = await this.photoDocumentationService.organizePhotosByDate(
      organizationId,
      dateFrom,
      dateTo,
    );

    const totalPhotos = Object.values(photos).reduce((sum, dayPhotos) => sum + dayPhotos.length, 0);

    return {
      period: { from: dateFrom, to: dateTo },
      quality_metrics: metrics,
      quality_issues: issues,
      photo_documentation: {
        total_photos: totalPhotos,
        photos_by_date: photos,
      },
      recommendations: this.generateQualityRecommendations(metrics, issues),
    };
  }

  private calculateScores(completedItems: CompletedChecklistItem[]): {
    percentage: number;
    totalPoints: number;
    maxPoints: number;
  } {
    let totalPoints = 0;
    let maxPoints = 0;

    completedItems.forEach(item => {
      const itemPoints = item.points_earned || 0;
      const maxItemPoints = item.points_earned || 5; // Default 5 points if not specified
      
      if (item.completed) {
        totalPoints += itemPoints;
      }
      maxPoints += maxItemPoints;
    });

    const percentage = maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0;

    return {
      percentage,
      totalPoints,
      maxPoints,
    };
  }

  private extractIssuesFromCompletedItems(completedItems: CompletedChecklistItem[]): string[] {
    const issues: string[] = [];

    completedItems.forEach(item => {
      if (!item.completed) {
        issues.push(`Incomplete: ${item.id}`);
      }
      if (item.notes && item.notes.toLowerCase().includes('issue')) {
        issues.push(`Issue noted: ${item.notes}`);
      }
    });

    return issues;
  }

  private generateQualityRecommendations(metrics: any, issues: any[]): string[] {
    const recommendations: string[] = [];

    if (metrics.average_score < 3.5) {
      recommendations.push('Overall quality scores are below target. Consider additional training for team members.');
    }

    if (metrics.average_percentage < 80) {
      recommendations.push('Checklist completion rates are low. Review checklist items and ensure they are achievable.');
    }

    const lowPerformingServices = Object.entries(metrics.by_service_type)
      .filter(([_, data]: [string, any]) => data.average_score < 3.5)
      .map(([service, _]) => service);

    if (lowPerformingServices.length > 0) {
      recommendations.push(`Focus on improving quality for: ${lowPerformingServices.join(', ')}`);
    }

    if (issues.length > 10) {
      recommendations.push('High number of quality issues detected. Consider implementing additional quality control measures.');
    }

    if (recommendations.length === 0) {
      recommendations.push('Quality metrics are good. Continue current practices and monitor for consistency.');
    }

    return recommendations;
  }
}