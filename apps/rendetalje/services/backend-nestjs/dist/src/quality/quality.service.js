"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QualityService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
const jobs_service_1 = require("../jobs/jobs.service");
const quality_checklists_service_1 = require("./quality-checklists.service");
const photo_documentation_service_1 = require("./photo-documentation.service");
let QualityService = class QualityService {
    constructor(supabaseService, jobsService, qualityChecklistsService, photoDocumentationService) {
        this.supabaseService = supabaseService;
        this.jobsService = jobsService;
        this.qualityChecklistsService = qualityChecklistsService;
        this.photoDocumentationService = photoDocumentationService;
    }
    async createAssessment(createDto, organizationId, assessedBy) {
        await this.jobsService.findById(createDto.job_id, organizationId);
        await this.qualityChecklistsService.findById(createDto.checklist_id, organizationId);
        const scores = this.calculateScores(createDto.completed_items);
        const assessmentData = {
            ...createDto,
            assessed_by: assessedBy,
            percentage_score: scores.percentage,
            total_points_earned: scores.totalPoints,
            max_possible_points: scores.maxPoints,
            status: 'completed',
        };
        const { data, error } = await this.supabaseService.client
            .from('job_quality_assessments')
            .insert(assessmentData)
            .select()
            .single();
        if (error) {
            throw new common_1.BadRequestException(`Failed to create quality assessment: ${error.message}`);
        }
        await this.jobsService.update(createDto.job_id, { quality_score: createDto.overall_score }, organizationId);
        return data;
    }
    async getJobAssessment(jobId, organizationId) {
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
            throw new common_1.BadRequestException(`Failed to get job assessment: ${error.message}`);
        }
        return data;
    }
    async updateAssessment(assessmentId, updates, organizationId) {
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
            throw new common_1.NotFoundException('Quality assessment not found');
        }
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
            throw new common_1.BadRequestException(`Failed to update quality assessment: ${error.message}`);
        }
        return data;
    }
    async getOrganizationQualityMetrics(organizationId) {
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
            throw new common_1.BadRequestException(`Failed to get quality metrics: ${error.message}`);
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
        const totalAssessments = assessments.length;
        const averageScore = assessments.reduce((sum, a) => sum + a.overall_score, 0) / totalAssessments;
        const averagePercentage = assessments.reduce((sum, a) => sum + a.percentage_score, 0) / totalAssessments;
        const scoreDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        assessments.forEach(assessment => {
            scoreDistribution[assessment.overall_score]++;
        });
        const byServiceType = {};
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
        Object.keys(byServiceType).forEach(serviceType => {
            const data = byServiceType[serviceType];
            data.average_score = data.total_score / data.count;
            data.average_percentage = data.total_percentage / data.count;
        });
        const monthlyTrends = {};
        assessments.forEach(assessment => {
            const month = assessment.created_at.substring(0, 7);
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
        Object.keys(monthlyTrends).forEach(month => {
            const data = monthlyTrends[month];
            data.average_score = data.total_score / data.count;
            data.average_percentage = data.total_percentage / data.count;
        });
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
    async getQualityIssues(organizationId, severity = 'medium') {
        const scoreThresholds = {
            low: 4,
            medium: 3,
            high: 2,
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
            throw new common_1.BadRequestException(`Failed to get quality issues: ${error.message}`);
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
    async generateQualityReport(organizationId, dateFrom, dateTo) {
        const metrics = await this.getOrganizationQualityMetrics(organizationId);
        const issues = await this.getQualityIssues(organizationId, 'medium');
        const photos = await this.photoDocumentationService.organizePhotosByDate(organizationId, dateFrom, dateTo);
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
    calculateScores(completedItems) {
        let totalPoints = 0;
        let maxPoints = 0;
        completedItems.forEach(item => {
            const itemPoints = item.points_earned || 0;
            const maxItemPoints = item.points_earned || 5;
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
    extractIssuesFromCompletedItems(completedItems) {
        const issues = [];
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
    generateQualityRecommendations(metrics, issues) {
        const recommendations = [];
        if (metrics.average_score < 3.5) {
            recommendations.push('Overall quality scores are below target. Consider additional training for team members.');
        }
        if (metrics.average_percentage < 80) {
            recommendations.push('Checklist completion rates are low. Review checklist items and ensure they are achievable.');
        }
        const lowPerformingServices = Object.entries(metrics.by_service_type)
            .filter(([_, data]) => data.average_score < 3.5)
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
};
exports.QualityService = QualityService;
exports.QualityService = QualityService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService,
        jobs_service_1.JobsService,
        quality_checklists_service_1.QualityChecklistsService,
        photo_documentation_service_1.PhotoDocumentationService])
], QualityService);
//# sourceMappingURL=quality.service.js.map