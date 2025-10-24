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
exports.CustomersService = void 0;
const common_1 = require("@nestjs/common");
const base_service_1 = require("../common/services/base.service");
const prisma_service_1 = require("../database/prisma.service");
const pagination_util_1 = require("../common/utils/pagination.util");
let CustomersService = class CustomersService extends base_service_1.BaseService {
    constructor(prismaService) {
        super(prismaService);
        this.prismaService = prismaService;
        this.modelName = 'customers';
        this.searchFields = ['name', 'email', 'phone'];
    }
    async findAllWithFilters(organizationId, filters) {
        const { city, is_active, min_satisfaction, min_jobs, min_revenue, search, page = 1, limit = 10 } = filters;
        const skip = (page - 1) * limit;
        const where = {
            organization_id: organizationId,
        };
        if (is_active !== undefined) {
            where.is_active = is_active;
        }
        if (city) {
            where.address = {
                path: ['city'],
                string_contains: city,
            };
        }
        if (min_satisfaction !== undefined) {
            where.satisfaction_score = {
                gte: min_satisfaction,
            };
        }
        if (min_jobs !== undefined) {
            where.total_jobs = {
                gte: min_jobs,
            };
        }
        if (min_revenue !== undefined) {
            where.total_revenue = {
                gte: min_revenue,
            };
        }
        if (search) {
            where.OR = this.searchFields.map(field => ({
                [field]: {
                    contains: search,
                    mode: 'insensitive',
                },
            }));
        }
        try {
            const [data, total] = await Promise.all([
                this.prismaService.customers.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: { created_at: 'desc' },
                }),
                this.prismaService.customers.count({ where }),
            ]);
            return pagination_util_1.PaginationUtil.createPaginatedResponse(data, total, filters);
        }
        catch (error) {
            throw new common_1.BadRequestException(`Failed to fetch customers: ${error.message}`);
        }
    }
    async create(createCustomerDto, organizationId) {
        if (createCustomerDto.email) {
            await this.checkDuplicateEmail(createCustomerDto.email, organizationId);
        }
        const customerData = {
            ...createCustomerDto,
            organization_id: organizationId,
            preferences: createCustomerDto.preferences || {},
            total_jobs: 0,
            total_revenue: 0,
            is_active: true,
        };
        try {
            const data = await this.prismaService.customers.create({
                data: customerData,
            });
            return data;
        }
        catch (error) {
            throw new common_1.BadRequestException(`Failed to create customer: ${error.message}`);
        }
    }
    async getCustomerHistory(id, organizationId) {
        await this.findById(id, organizationId);
        try {
            const jobs = await this.prismaService.jobs.findMany({
                where: {
                    customer_id: id,
                },
                select: {
                    id: true,
                    job_number: true,
                    service_type: true,
                    status: true,
                    scheduled_date: true,
                    actual_duration: true,
                    quality_score: true,
                    profitability: true,
                },
                orderBy: {
                    scheduled_date: 'desc',
                },
            });
            const reviews = await this.prismaService.customerReviews.findMany({
                where: {
                    customer_id: id,
                },
                orderBy: {
                    created_at: 'desc',
                },
            });
            const completedJobs = jobs.filter(job => job.status === 'completed');
            const totalRevenue = completedJobs.reduce((sum, job) => {
                return sum + (job.profitability?.total_price || 0);
            }, 0);
            const averageRating = reviews.length > 0
                ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
                : null;
            return {
                jobs,
                reviews,
                statistics: {
                    total_jobs: jobs.length,
                    completed_jobs: completedJobs.length,
                    total_revenue: totalRevenue,
                    average_rating: averageRating,
                    last_job_date: jobs.length > 0 ? jobs[0].scheduled_date : null,
                },
            };
        }
        catch (error) {
            throw new common_1.BadRequestException(`Failed to fetch customer history: ${error.message}`);
        }
    }
    async getCustomerMessages(customerId, organizationId, jobId) {
        await this.findById(customerId, organizationId);
        try {
            const where = {
                customer_id: customerId,
                organization_id: organizationId,
            };
            if (jobId) {
                where.job_id = jobId;
            }
            const messages = await this.prismaService.customerMessages.findMany({
                where,
                include: {
                    users: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
                orderBy: {
                    created_at: 'desc',
                },
            });
            return messages;
        }
        catch (error) {
            throw new common_1.BadRequestException(`Failed to fetch customer messages: ${error.message}`);
        }
    }
    async createMessage(createMessageDto, organizationId, senderId) {
        await this.findById(createMessageDto.customer_id, organizationId);
        if (createMessageDto.job_id) {
            await this.validateJob(createMessageDto.job_id, organizationId);
        }
        const messageData = {
            ...createMessageDto,
            organization_id: organizationId,
            sender_id: senderId,
            attachments: createMessageDto.attachments || [],
            is_read: false,
        };
        try {
            const data = await this.prismaService.customerMessages.create({
                data: messageData,
            });
            return data;
        }
        catch (error) {
            throw new common_1.BadRequestException(`Failed to create message: ${error.message}`);
        }
    }
    async markMessageAsRead(messageId, organizationId) {
        try {
            await this.prismaService.customerMessages.update({
                where: {
                    id: messageId,
                    organization_id: organizationId,
                },
                data: {
                    is_read: true,
                },
            });
        }
        catch (error) {
            throw new common_1.BadRequestException(`Failed to mark message as read: ${error.message}`);
        }
    }
    async getCustomerReviews(customerId, organizationId) {
        await this.findById(customerId, organizationId);
        try {
            const reviews = await this.prismaService.customerReviews.findMany({
                where: {
                    customer_id: customerId,
                },
                include: {
                    jobs: {
                        select: {
                            id: true,
                            job_number: true,
                            service_type: true,
                            scheduled_date: true,
                        },
                    },
                },
                orderBy: {
                    created_at: 'desc',
                },
            });
            return reviews;
        }
        catch (error) {
            throw new common_1.BadRequestException(`Failed to fetch customer reviews: ${error.message}`);
        }
    }
    async createReview(createReviewDto, customerId, organizationId) {
        await this.findById(customerId, organizationId);
        await this.validateJobBelongsToCustomer(createReviewDto.job_id, customerId, organizationId);
        try {
            const existingReview = await this.prismaService.customerReviews.findFirst({
                where: {
                    job_id: createReviewDto.job_id,
                    customer_id: customerId,
                },
                select: { id: true },
            });
            if (existingReview) {
                throw new common_1.BadRequestException('Review already exists for this job');
            }
            const reviewData = {
                ...createReviewDto,
                customer_id: customerId,
                photos: createReviewDto.photos || [],
            };
            const data = await this.prismaService.customerReviews.create({
                data: reviewData,
            });
            await this.updateCustomerSatisfactionScore(customerId);
            return data;
        }
        catch (error) {
            if (error instanceof common_1.BadRequestException) {
                throw error;
            }
            throw new common_1.BadRequestException(`Failed to create review: ${error.message}`);
        }
    }
    async getCustomerAnalytics(organizationId, timeRange = '30d') {
        try {
            const totalCustomers = await this.prismaService.customers.count({
                where: { organization_id: organizationId },
            });
            const activeCustomers = await this.prismaService.customers.count({
                where: {
                    organization_id: organizationId,
                    is_active: true,
                },
            });
            const now = new Date();
            let startDate;
            switch (timeRange) {
                case '7d':
                    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case '90d':
                    startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                    break;
                case '1y':
                    startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                    break;
                default:
                    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            }
            const newCustomersThisMonth = await this.prismaService.customers.count({
                where: {
                    organization_id: organizationId,
                    created_at: {
                        gte: startDate,
                    },
                },
            });
            return {
                totalCustomers,
                activeCustomers,
                newCustomersThisMonth,
                averageSatisfaction: 0,
                totalRevenue: 0,
                averageJobsPerCustomer: 0,
            };
        }
        catch (error) {
            throw new common_1.BadRequestException(`Failed to fetch customer analytics: ${error.message}`);
        }
    }
    async getCustomerSatisfactionMetrics(organizationId) {
        try {
            return {
                average_rating: 0,
                total_reviews: 0,
                rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
                monthly_trends: {},
            };
        }
        catch (error) {
            throw new common_1.BadRequestException(`Failed to fetch satisfaction metrics: ${error.message}`);
        }
    }
    async deactivateCustomer(id, organizationId) {
        return this.update(id, { is_active: false }, organizationId);
    }
    async activateCustomer(id, organizationId) {
        return this.update(id, { is_active: true }, organizationId);
    }
    async checkDuplicateEmail(email, organizationId, excludeId) {
        try {
            const where = {
                email,
                organization_id: organizationId,
            };
            if (excludeId) {
                where.NOT = {
                    id: excludeId,
                };
            }
            const existingCustomer = await this.prismaService.customers.findFirst({
                where,
                select: { id: true },
            });
            if (existingCustomer) {
                throw new common_1.BadRequestException('Customer with this email already exists');
            }
        }
        catch (error) {
            if (error instanceof common_1.BadRequestException) {
                throw error;
            }
            throw new common_1.BadRequestException(`Failed to check duplicate email: ${error.message}`);
        }
    }
    async validateJob(jobId, organizationId) {
        try {
            const job = await this.prismaService.jobs.findFirst({
                where: {
                    id: jobId,
                    organization_id: organizationId,
                },
                select: { id: true },
            });
            if (!job) {
                throw new common_1.NotFoundException('Job not found');
            }
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            throw new common_1.BadRequestException(`Failed to validate job: ${error.message}`);
        }
    }
    async validateJobBelongsToCustomer(jobId, customerId, organizationId) {
        try {
            const job = await this.prismaService.jobs.findFirst({
                where: {
                    id: jobId,
                    customer_id: customerId,
                    organization_id: organizationId,
                },
                select: { id: true },
            });
            if (!job) {
                throw new common_1.ForbiddenException('Job does not belong to this customer');
            }
        }
        catch (error) {
            if (error instanceof common_1.ForbiddenException) {
                throw error;
            }
            throw new common_1.BadRequestException(`Failed to validate job ownership: ${error.message}`);
        }
    }
    async updateCustomerSatisfactionScore(customerId) {
        try {
            const reviews = await this.prismaService.customerReviews.findMany({
                where: {
                    customer_id: customerId,
                },
                select: {
                    rating: true,
                },
            });
            if (reviews.length === 0) {
                return;
            }
            const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
            await this.prismaService.customers.update({
                where: {
                    id: customerId,
                },
                data: {
                    satisfaction_score: Math.round(averageRating * 100) / 100,
                },
            });
        }
        catch (error) {
            console.error('Failed to update customer satisfaction score:', error);
        }
    }
};
exports.CustomersService = CustomersService;
exports.CustomersService = CustomersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CustomersService);
//# sourceMappingURL=customers.service.js.map