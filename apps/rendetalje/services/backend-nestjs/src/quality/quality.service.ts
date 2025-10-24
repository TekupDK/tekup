import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { QualityChecklistsService } from './quality-checklists.service';
import { PhotoDocumentationService } from './photo-documentation.service';
import { JobQualityAssessment, CompletedChecklistItem } from './entities/job-quality-assessment.entity';
import { CreateQualityAssessmentDto } from './dto';

@Injectable()
export class QualityService {
  private readonly logger = new Logger(QualityService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly qualityChecklistsService: QualityChecklistsService,
    private readonly photoDocumentationService: PhotoDocumentationService,
  ) {}

  async createAssessment(
    createDto: CreateQualityAssessmentDto,
    assessedBy: string,
  ): Promise<JobQualityAssessment> {
    this.logger.log(`Creating quality assessment for job: ${createDto.job_id}`);

    // Verify job exists
    const job = await this.prisma.renosLead.findUnique({
      where: { id: createDto.job_id },
    });

    if (!job) {
      throw new NotFoundException(`Job with ID ${createDto.job_id} not found`);
    }

    // Verify checklist exists
    await this.qualityChecklistsService.findById(createDto.checklist_id);

    // Calculate scores
    const scores = this.calculateScores(createDto.completed_items);

    const assessment = await this.prisma.renosQualityAssessment.create({
      data: {
        leadId: createDto.job_id,
        checklistId: createDto.checklist_id,
        assessedBy,
        completedItems: createDto.completed_items as any,
        overallScore: createDto.overall_score,
        percentageScore: scores.percentage,
        totalPointsEarned: scores.totalPoints,
        maxPossiblePoints: scores.maxPoints,
        notes: createDto.notes,
        status: 'completed',
      },
    });

    this.logger.log(`Quality assessment created with score: ${createDto.overall_score}`);
    return assessment as any;
  }

  async getJobAssessment(jobId: string): Promise<JobQualityAssessment | null> {
    const assessment = await this.prisma.renosQualityAssessment.findFirst({
      where: { leadId: jobId },
      include: {
        checklist: true,
        assessor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return assessment as any;
  }

  async updateAssessment(
    assessmentId: string,
    updates: Partial<JobQualityAssessment>,
  ): Promise<JobQualityAssessment> {
    this.logger.log(`Updating assessment: ${assessmentId}`);

    const existing = await this.prisma.renosQualityAssessment.findUnique({
      where: { id: assessmentId },
    });

    if (!existing) {
      throw new NotFoundException('Quality assessment not found');
    }

    // Recalculate scores if completed_items changed
    let updateData: any = { ...updates };

    if (updates.completed_items) {
      const scores = this.calculateScores(updates.completed_items);
      updateData.percentageScore = scores.percentage;
      updateData.totalPointsEarned = scores.totalPoints;
      updateData.maxPossiblePoints = scores.maxPoints;
      updateData.completedItems = updates.completed_items;
      delete updateData.completed_items;
    }

    const updated = await this.prisma.renosQualityAssessment.update({
      where: { id: assessmentId },
      data: updateData,
    });

    return updated as any;
  }

  async getOrganizationQualityMetrics(): Promise<any> {
    this.logger.log('Generating organization quality metrics');

    const assessments = await this.prisma.renosQualityAssessment.findMany({
      include: {
        lead: {
          select: {
            taskType: true,
            status: true,
            createdAt: true,
          },
        },
        checklist: {
          select: {
            serviceType: true,
            name: true,
          },
        },
      },
    });

    if (assessments.length === 0) {
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

    const totalAssessments = assessments.length;
    const averageScore = assessments.reduce((sum, a) => sum + a.overallScore, 0) / totalAssessments;
    const averagePercentage = assessments.reduce((sum, a) => sum + a.percentageScore, 0) / totalAssessments;

    // Score distribution
    const scoreDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    assessments.forEach((assessment) => {
      scoreDistribution[assessment.overallScore as keyof typeof scoreDistribution]++;
    });

    // By service type
    const byServiceType: Record<string, any> = {};
    assessments.forEach((assessment) => {
      const serviceType = assessment.checklist.serviceType;
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
      byServiceType[serviceType].total_score += assessment.overallScore;
      byServiceType[serviceType].total_percentage += assessment.percentageScore;
    });

    Object.keys(byServiceType).forEach((serviceType) => {
      const data = byServiceType[serviceType];
      data.average_score = data.total_score / data.count;
      data.average_percentage = data.total_percentage / data.count;
    });

    // Monthly trends
    const monthlyTrends: Record<string, any> = {};
    assessments.forEach((assessment) => {
      const month = assessment.createdAt.toISOString().substring(0, 7);
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
      monthlyTrends[month].total_score += assessment.overallScore;
      monthlyTrends[month].total_percentage += assessment.percentageScore;
    });

    Object.keys(monthlyTrends).forEach((month) => {
      const data = monthlyTrends[month];
      data.average_score = data.total_score / data.count;
      data.average_percentage = data.total_percentage / data.count;
    });

    const qualityTrends = Object.keys(monthlyTrends)
      .sort()
      .slice(-12)
      .map((month) => ({
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

  async getQualityIssues(severity: 'low' | 'medium' | 'high' = 'medium'): Promise<any[]> {
    const scoreThresholds = {
      low: 4,
      medium: 3,
      high: 2,
    };

    const threshold = scoreThresholds[severity];

    const assessments = await this.prisma.renosQualityAssessment.findMany({
      where: {
        overallScore: {
          lt: threshold,
        },
      },
      include: {
        lead: {
          select: {
            id: true,
            name: true,
            address: true,
            taskType: true,
            status: true,
          },
        },
        checklist: {
          select: {
            name: true,
            serviceType: true,
          },
        },
        assessor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        overallScore: 'asc',
      },
    });

    return assessments;
  }

  async generateQualityReport(dateFrom: string, dateTo: string): Promise<any> {
    this.logger.log(`Generating quality report from ${dateFrom} to ${dateTo}`);

    const assessments = await this.prisma.renosQualityAssessment.findMany({
      where: {
        createdAt: {
          gte: new Date(dateFrom),
          lte: new Date(dateTo),
        },
      },
      include: {
        lead: true,
        checklist: true,
        assessor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    const metrics = await this.getOrganizationQualityMetrics();
    const issues = await this.getQualityIssues('medium');

    return {
      dateRange: { from: dateFrom, to: dateTo },
      summary: {
        totalAssessments: assessments.length,
        averageScore: metrics.average_score,
        averagePercentage: metrics.average_percentage,
      },
      assessments,
      issues,
      trends: metrics.quality_trends,
    };
  }

  private calculateScores(completedItems: CompletedChecklistItem[]): {
    percentage: number;
    totalPoints: number;
    maxPoints: number;
  } {
    const totalPoints = completedItems
      .filter((item) => item.completed)
      .reduce((sum, item) => sum + (item.points_earned || 0), 0);

    const maxPoints = completedItems.reduce((sum, item) => sum + (item.points_earned || 10), 0);

    const percentage = maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0;

    return {
      percentage,
      totalPoints,
      maxPoints,
    };
  }
}
