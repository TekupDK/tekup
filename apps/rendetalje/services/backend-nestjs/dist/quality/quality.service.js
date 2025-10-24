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
var QualityService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.QualityService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../database/prisma.service");
const quality_checklists_service_1 = require("./quality-checklists.service");
const photo_documentation_service_1 = require("./photo-documentation.service");
let QualityService = QualityService_1 = class QualityService {
    constructor(prisma, qualityChecklistsService, photoDocumentationService) {
        this.prisma = prisma;
        this.qualityChecklistsService = qualityChecklistsService;
        this.photoDocumentationService = photoDocumentationService;
        this.logger = new common_1.Logger(QualityService_1.name);
    }
    async createAssessment(createDto, assessedBy) {
        this.logger.log(`Creating quality assessment for job: ${createDto.job_id}`);
        const job = await this.prisma.renosLead.findUnique({
            where: { id: createDto.job_id },
        });
        if (!job) {
            throw new common_1.NotFoundException(`Job with ID ${createDto.job_id} not found`);
        }
        await this.qualityChecklistsService.findById(createDto.checklist_id);
        const scores = this.calculateScores(createDto.completed_items);
        const assessment = await this.prisma.renosQualityAssessment.create({
            data: {
                leadId: createDto.job_id,
                checklistId: createDto.checklist_id,
                assessedBy,
                completedItems: createDto.completed_items,
                overallScore: createDto.overall_score,
                percentageScore: scores.percentage,
                totalPointsEarned: scores.totalPoints,
                maxPossiblePoints: scores.maxPoints,
                notes: createDto.notes,
                status: 'completed',
            },
        });
        this.logger.log(`Quality assessment created with score: ${createDto.overall_score}`);
        return assessment;
    }
    async getJobAssessment(jobId) {
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
        return assessment;
    }
    async updateAssessment(assessmentId, updates) {
        this.logger.log(`Updating assessment: ${assessmentId}`);
        const existing = await this.prisma.renosQualityAssessment.findUnique({
            where: { id: assessmentId },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Quality assessment not found');
        }
        let updateData = { ...updates };
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
        return updated;
    }
    async getOrganizationQualityMetrics() {
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
        const scoreDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        assessments.forEach((assessment) => {
            scoreDistribution[assessment.overallScore]++;
        });
        const byServiceType = {};
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
        const monthlyTrends = {};
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
    async getQualityIssues(severity = 'medium') {
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
    async generateQualityReport(dateFrom, dateTo) {
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
    calculateScores(completedItems) {
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
};
exports.QualityService = QualityService;
exports.QualityService = QualityService = QualityService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        quality_checklists_service_1.QualityChecklistsService,
        photo_documentation_service_1.PhotoDocumentationService])
], QualityService);
//# sourceMappingURL=quality.service.js.map