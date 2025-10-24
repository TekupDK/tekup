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
exports.JobsService = void 0;
const common_1 = require("@nestjs/common");
const base_service_1 = require("../common/services/base.service");
const prisma_service_1 = require("../database/prisma.service");
const job_entity_1 = require("./entities/job.entity");
const pagination_util_1 = require("../common/utils/pagination.util");
let JobsService = class JobsService extends base_service_1.BaseService {
    constructor(prismaService) {
        super(prismaService);
        this.prismaService = prismaService;
        this.modelName = 'jobs';
        this.searchFields = ['job_number', 'special_instructions'];
    }
    async findAllWithFilters(organizationId, filters) {
        const { status, service_type, customer_id, team_member_id, date_from, date_to, city, search } = filters;
        let query = this.supabaseService.client
            .from('jobs')
            .select(`
        *,
        customers!inner(id, name, email, phone),
        job_assignments!left(
          id,
          team_member_id,
          role,
          team_members!inner(
            id,
            employee_id,
            users!inner(id, name, email)
          )
        )
      `)
            .eq('organization_id', organizationId);
        const queryFilters = {};
        if (status)
            queryFilters.status = status;
        if (service_type)
            queryFilters.service_type = service_type;
        if (customer_id)
            queryFilters.customer_id = customer_id;
        if (Object.keys(queryFilters).length > 0) {
            query = QueryBuilderUtil.applyFilters(query, queryFilters);
        }
        if (date_from) {
            query = query.gte('scheduled_date', date_from);
        }
        if (date_to) {
            query = query.lte('scheduled_date', date_to);
        }
        if (city) {
            query = query.ilike('location->city', `%${city}%`);
        }
        if (team_member_id) {
            query = query.eq('job_assignments.team_member_id', team_member_id);
        }
        if (search) {
            query = QueryBuilderUtil.applySearch(query, this.searchFields, search);
        }
        const total = await this.getFilteredCount(organizationId, filters);
        query = QueryBuilderUtil.applyPagination(query, filters);
        const { data, error } = await query;
        if (error) {
            throw new common_1.BadRequestException(`Failed to fetch jobs: ${error.message}`);
        }
        return pagination_util_1.PaginationUtil.createPaginatedResponse(data || [], total, filters);
    }
    async create(createJobDto, organizationId) {
        await this.validateCustomer(createJobDto.customer_id, organizationId);
        await this.checkSchedulingConflicts(createJobDto.scheduled_date, organizationId);
        const jobData = {
            ...createJobDto,
            organization_id: organizationId,
            status: job_entity_1.JobStatus.SCHEDULED,
            checklist: createJobDto.checklist || [],
            photos: [],
        };
        const { data, error } = await this.supabaseService.client
            .from('jobs')
            .insert(jobData)
            .select()
            .single();
        if (error) {
            throw new common_1.BadRequestException(`Failed to create job: ${error.message}`);
        }
        return data;
    }
    async updateStatus(id, updateStatusDto, organizationId) {
        const currentJob = await this.findById(id, organizationId);
        this.validateStatusTransition(currentJob.status, updateStatusDto.status);
        const { data, error } = await this.supabaseService.client
            .from('jobs')
            .update({
            status: updateStatusDto.status,
            actual_duration: updateStatusDto.actual_duration,
            quality_score: updateStatusDto.quality_score,
            customer_signature: updateStatusDto.customer_signature,
            profitability: updateStatusDto.profitability,
        })
            .eq('id', id)
            .eq('organization_id', organizationId)
            .select()
            .single();
        if (error) {
            throw new common_1.BadRequestException(`Failed to update job status: ${error.message}`);
        }
        await this.handleStatusChange(data, currentJob.status);
        return data;
    }
    async assignTeamMembers(id, assignJobDto, organizationId) {
        await this.findById(id, organizationId);
        for (const assignment of assignJobDto.assignments) {
            await this.validateTeamMember(assignment.team_member_id, organizationId);
        }
        await this.supabaseService.client
            .from('job_assignments')
            .delete()
            .eq('job_id', id);
        const assignmentData = assignJobDto.assignments.map(assignment => ({
            job_id: id,
            team_member_id: assignment.team_member_id,
            role: assignment.role,
        }));
        const { data, error } = await this.supabaseService.client
            .from('job_assignments')
            .insert(assignmentData)
            .select(`
        *,
        team_members!inner(
          id,
          employee_id,
          users!inner(id, name, email)
        )
      `);
        if (error) {
            throw new common_1.BadRequestException(`Failed to assign team members: ${error.message}`);
        }
        return data;
    }
    async getJobAssignments(id, organizationId) {
        await this.findById(id, organizationId);
        const { data, error } = await this.supabaseService.client
            .from('job_assignments')
            .select(`
        *,
        team_members!inner(
          id,
          employee_id,
          users!inner(id, name, email)
        )
      `)
            .eq('job_id', id);
        if (error) {
            throw new common_1.BadRequestException(`Failed to fetch job assignments: ${error.message}`);
        }
        return data || [];
    }
    async rescheduleJob(id, newScheduledDate, organizationId) {
        const currentJob = await this.findById(id, organizationId);
        if (currentJob.status === job_entity_1.JobStatus.COMPLETED || currentJob.status === job_entity_1.JobStatus.CANCELLED) {
            throw new common_1.BadRequestException('Cannot reschedule completed or cancelled jobs');
        }
        await this.checkSchedulingConflicts(newScheduledDate, organizationId, id);
        const rescheduledJob = await this.create({
            customer_id: currentJob.customer_id,
            service_type: currentJob.service_type,
            scheduled_date: newScheduledDate,
            estimated_duration: currentJob.estimated_duration,
            location: currentJob.location,
            special_instructions: currentJob.special_instructions,
            checklist: currentJob.checklist,
            recurring_job_id: currentJob.recurring_job_id,
        }, organizationId);
        await this.supabaseService.client
            .from('jobs')
            .update({
            status: job_entity_1.JobStatus.RESCHEDULED,
            parent_job_id: rescheduledJob.id
        })
            .eq('id', id);
        return rescheduledJob;
    }
    async getJobProfitability(organizationId) {
        const { data, error } = await this.supabaseService.client
            .from('jobs')
            .select('profitability, service_type, scheduled_date')
            .eq('organization_id', organizationId)
            .eq('status', job_entity_1.JobStatus.COMPLETED)
            .not('profitability', 'is', null);
        if (error) {
            throw new common_1.BadRequestException(`Failed to fetch profitability data: ${error.message}`);
        }
        const metrics = {
            total_revenue: 0,
            total_costs: 0,
            total_profit: 0,
            profit_margin_percentage: 0,
            by_service_type: {},
            monthly_trends: {},
        };
        data.forEach(job => {
            const profit = job.profitability;
            if (!profit)
                return;
            metrics.total_revenue += profit.total_price;
            metrics.total_costs += profit.labor_cost + profit.material_cost + profit.travel_cost;
            metrics.total_profit += profit.profit_margin;
            if (!metrics.by_service_type[job.service_type]) {
                metrics.by_service_type[job.service_type] = {
                    revenue: 0,
                    costs: 0,
                    profit: 0,
                    count: 0,
                };
            }
            const serviceMetrics = metrics.by_service_type[job.service_type];
            serviceMetrics.revenue += profit.total_price;
            serviceMetrics.costs += profit.labor_cost + profit.material_cost + profit.travel_cost;
            serviceMetrics.profit += profit.profit_margin;
            serviceMetrics.count += 1;
            const month = new Date(job.scheduled_date).toISOString().substring(0, 7);
            if (!metrics.monthly_trends[month]) {
                metrics.monthly_trends[month] = {
                    revenue: 0,
                    costs: 0,
                    profit: 0,
                    count: 0,
                };
            }
            const monthMetrics = metrics.monthly_trends[month];
            monthMetrics.revenue += profit.total_price;
            monthMetrics.costs += profit.labor_cost + profit.material_cost + profit.travel_cost;
            monthMetrics.profit += profit.profit_margin;
            monthMetrics.count += 1;
        });
        metrics.profit_margin_percentage = metrics.total_revenue > 0
            ? (metrics.total_profit / metrics.total_revenue) * 100
            : 0;
        return metrics;
    }
    async validateCustomer(customerId, organizationId) {
        const { data, error } = await this.supabaseService.client
            .from('customers')
            .select('id')
            .eq('id', customerId)
            .eq('organization_id', organizationId)
            .single();
        if (error || !data) {
            throw new common_1.NotFoundException('Customer not found');
        }
    }
    async validateTeamMember(teamMemberId, organizationId) {
        const { data, error } = await this.supabaseService.client
            .from('team_members')
            .select('id')
            .eq('id', teamMemberId)
            .eq('organization_id', organizationId)
            .single();
        if (error || !data) {
            throw new common_1.NotFoundException('Team member not found');
        }
    }
    async checkSchedulingConflicts(scheduledDate, organizationId, excludeJobId) {
        const startTime = new Date(scheduledDate);
        const endTime = new Date(startTime.getTime() + 4 * 60 * 60 * 1000);
        let query = this.supabaseService.client
            .from('jobs')
            .select('id, scheduled_date, estimated_duration')
            .eq('organization_id', organizationId)
            .in('status', [job_entity_1.JobStatus.SCHEDULED, job_entity_1.JobStatus.CONFIRMED, job_entity_1.JobStatus.IN_PROGRESS])
            .gte('scheduled_date', startTime.toISOString())
            .lte('scheduled_date', endTime.toISOString());
        if (excludeJobId) {
            query = query.neq('id', excludeJobId);
        }
        const { data, error } = await query;
        if (error) {
            throw new common_1.BadRequestException(`Failed to check scheduling conflicts: ${error.message}`);
        }
        if (data && data.length > 0) {
            throw new common_1.ConflictException('Scheduling conflict detected with existing jobs');
        }
    }
    validateStatusTransition(currentStatus, newStatus) {
        const validTransitions = {
            [job_entity_1.JobStatus.SCHEDULED]: [job_entity_1.JobStatus.CONFIRMED, job_entity_1.JobStatus.CANCELLED, job_entity_1.JobStatus.RESCHEDULED],
            [job_entity_1.JobStatus.CONFIRMED]: [job_entity_1.JobStatus.IN_PROGRESS, job_entity_1.JobStatus.CANCELLED, job_entity_1.JobStatus.RESCHEDULED],
            [job_entity_1.JobStatus.IN_PROGRESS]: [job_entity_1.JobStatus.COMPLETED, job_entity_1.JobStatus.CANCELLED],
            [job_entity_1.JobStatus.COMPLETED]: [],
            [job_entity_1.JobStatus.CANCELLED]: [],
            [job_entity_1.JobStatus.RESCHEDULED]: [],
        };
        if (!validTransitions[currentStatus].includes(newStatus)) {
            throw new common_1.BadRequestException(`Invalid status transition from ${currentStatus} to ${newStatus}`);
        }
    }
    async handleStatusChange(job, previousStatus) {
        switch (job.status) {
            case job_entity_1.JobStatus.COMPLETED:
                await this.handleJobCompletion(job);
                break;
            case job_entity_1.JobStatus.IN_PROGRESS:
                await this.handleJobStart(job);
                break;
            case job_entity_1.JobStatus.CANCELLED:
                await this.handleJobCancellation(job);
                break;
        }
    }
    async handleJobCompletion(job) {
        await this.updateCustomerStats(job.customer_id);
    }
    async handleJobStart(job) {
    }
    async handleJobCancellation(job) {
    }
    async updateCustomerStats(customerId) {
    }
    async getFilteredCount(organizationId, filters) {
        const { status, service_type, customer_id, team_member_id, date_from, date_to, city, search } = filters;
        let query = this.supabaseService.client
            .from('jobs')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', organizationId);
        const queryFilters = {};
        if (status)
            queryFilters.status = status;
        if (service_type)
            queryFilters.service_type = service_type;
        if (customer_id)
            queryFilters.customer_id = customer_id;
        if (Object.keys(queryFilters).length > 0) {
            query = QueryBuilderUtil.applyFilters(query, queryFilters);
        }
        if (date_from)
            query = query.gte('scheduled_date', date_from);
        if (date_to)
            query = query.lte('scheduled_date', date_to);
        if (city)
            query = query.ilike('location->city', `%${city}%`);
        if (search)
            query = QueryBuilderUtil.applySearch(query, this.searchFields, search);
        const { count, error } = await query;
        if (error) {
            throw new common_1.BadRequestException(`Failed to count jobs: ${error.message}`);
        }
        return count || 0;
    }
};
exports.JobsService = JobsService;
exports.JobsService = JobsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], JobsService);
//# sourceMappingURL=jobs.service.js.map