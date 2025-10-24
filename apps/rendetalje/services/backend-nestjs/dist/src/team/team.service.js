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
exports.TeamService = void 0;
const common_1 = require("@nestjs/common");
const base_service_1 = require("../common/services/base.service");
const supabase_service_1 = require("../supabase/supabase.service");
const query_builder_util_1 = require("../common/utils/query-builder.util");
const pagination_util_1 = require("../common/utils/pagination.util");
let TeamService = class TeamService extends base_service_1.BaseService {
    constructor(supabaseService) {
        super(supabaseService);
        this.supabaseService = supabaseService;
        this.tableName = 'team_members';
        this.searchFields = ['employee_id'];
    }
    async findAllWithFilters(organizationId, filters) {
        const { is_active, skills, hired_after, hired_before, search } = filters;
        let query = this.supabaseService.client
            .from('team_members')
            .select(`
        *,
        users!inner(id, name, email, phone, avatar_url)
      `)
            .eq('organization_id', organizationId);
        const queryFilters = {};
        if (is_active !== undefined)
            queryFilters.is_active = is_active;
        if (Object.keys(queryFilters).length > 0) {
            query = query_builder_util_1.QueryBuilderUtil.applyFilters(query, queryFilters);
        }
        if (skills && skills.length > 0) {
            query = query.contains('skills', skills);
        }
        if (hired_after) {
            query = query.gte('hire_date', hired_after);
        }
        if (hired_before) {
            query = query.lte('hire_date', hired_before);
        }
        if (search) {
            query = query.or(`employee_id.ilike.%${search}%,users.name.ilike.%${search}%,users.email.ilike.%${search}%`);
        }
        const total = await this.getFilteredCount(organizationId, filters);
        query = query_builder_util_1.QueryBuilderUtil.applyPagination(query, filters);
        const { data, error } = await query;
        if (error) {
            throw new common_1.BadRequestException(`Failed to fetch team members: ${error.message}`);
        }
        return pagination_util_1.PaginationUtil.createPaginatedResponse(data || [], total, filters);
    }
    async create(createTeamMemberDto, organizationId) {
        await this.validateUser(createTeamMemberDto.user_id, organizationId);
        const { data: existingMember } = await this.supabaseService.client
            .from('team_members')
            .select('id')
            .eq('user_id', createTeamMemberDto.user_id)
            .eq('organization_id', organizationId)
            .single();
        if (existingMember) {
            throw new common_1.ConflictException('Team member already exists for this user');
        }
        const employeeId = createTeamMemberDto.employee_id || await this.generateEmployeeId(organizationId);
        const teamMemberData = {
            ...createTeamMemberDto,
            organization_id: organizationId,
            employee_id: employeeId,
            performance_metrics: this.getDefaultPerformanceMetrics(),
            is_active: true,
        };
        const { data, error } = await this.supabaseService.client
            .from('team_members')
            .insert(teamMemberData)
            .select(`
        *,
        users!inner(id, name, email, phone, avatar_url)
      `)
            .single();
        if (error) {
            throw new common_1.BadRequestException(`Failed to create team member: ${error.message}`);
        }
        return data;
    }
    async getTeamMemberSchedule(teamMemberId, organizationId, dateFrom, dateTo) {
        await this.findById(teamMemberId, organizationId);
        let query = this.supabaseService.client
            .from('job_assignments')
            .select(`
        *,
        jobs!inner(
          id,
          job_number,
          service_type,
          status,
          scheduled_date,
          estimated_duration,
          location,
          customers!inner(id, name, phone)
        )
      `)
            .eq('team_member_id', teamMemberId)
            .eq('jobs.organization_id', organizationId);
        if (dateFrom) {
            query = query.gte('jobs.scheduled_date', dateFrom);
        }
        if (dateTo) {
            query = query.lte('jobs.scheduled_date', dateTo);
        }
        query = query.order('jobs.scheduled_date', { ascending: true });
        const { data, error } = await query;
        if (error) {
            throw new common_1.BadRequestException(`Failed to fetch team member schedule: ${error.message}`);
        }
        return data || [];
    }
    async getTeamMemberPerformance(teamMemberId, organizationId) {
        const teamMember = await this.findById(teamMemberId, organizationId);
        const { data: jobData, error: jobError } = await this.supabaseService.client
            .from('job_assignments')
            .select(`
        jobs!inner(
          id,
          status,
          scheduled_date,
          actual_duration,
          quality_score,
          customer_reviews(rating)
        )
      `)
            .eq('team_member_id', teamMemberId)
            .eq('jobs.organization_id', organizationId);
        if (jobError) {
            throw new common_1.BadRequestException(`Failed to fetch performance data: ${jobError.message}`);
        }
        const { data: timeData, error: timeError } = await this.supabaseService.client
            .from('time_entries')
            .select('start_time, end_time, break_duration')
            .eq('team_member_id', teamMemberId)
            .not('end_time', 'is', null);
        if (timeError) {
            throw new common_1.BadRequestException(`Failed to fetch time data: ${timeError.message}`);
        }
        const completedJobs = jobData?.filter(ja => ja.jobs.status === 'completed') || [];
        const totalHours = this.calculateTotalHours(timeData || []);
        const averageRating = this.calculateAverageRating(completedJobs);
        const performance = {
            jobs_completed: completedJobs.length,
            total_jobs_assigned: jobData?.length || 0,
            completion_rate: jobData?.length ? (completedJobs.length / jobData.length) * 100 : 0,
            average_job_duration: this.calculateAverageJobDuration(completedJobs),
            average_quality_score: this.calculateAverageQualityScore(completedJobs),
            customer_satisfaction: averageRating,
            total_hours_worked: totalHours.regular,
            overtime_hours: totalHours.overtime,
            current_metrics: teamMember.performance_metrics,
        };
        return performance;
    }
    async createTimeEntry(createTimeEntryDto, organizationId) {
        await this.validateJobAssignment(createTimeEntryDto.job_id, createTimeEntryDto.team_member_id, organizationId);
        await this.checkTimeEntryOverlap(createTimeEntryDto, organizationId);
        const { data, error } = await this.supabaseService.client
            .from('time_entries')
            .insert(createTimeEntryDto)
            .select(`
        *,
        jobs!inner(id, job_number, service_type),
        team_members!inner(
          id,
          employee_id,
          users!inner(id, name)
        )
      `)
            .single();
        if (error) {
            throw new common_1.BadRequestException(`Failed to create time entry: ${error.message}`);
        }
        return data;
    }
    async findTimeEntries(organizationId, filters) {
        const { job_id, team_member_id, date_from, date_to } = filters;
        let query = this.supabaseService.client
            .from('time_entries')
            .select(`
        *,
        jobs!inner(id, job_number, service_type, organization_id),
        team_members!inner(
          id,
          employee_id,
          organization_id,
          users!inner(id, name)
        )
      `)
            .eq('jobs.organization_id', organizationId);
        if (job_id) {
            query = query.eq('job_id', job_id);
        }
        if (team_member_id) {
            query = query.eq('team_member_id', team_member_id);
        }
        if (date_from) {
            query = query.gte('start_time', date_from);
        }
        if (date_to) {
            query = query.lte('start_time', date_to);
        }
        const total = await this.getTimeEntriesCount(organizationId, filters);
        query = query_builder_util_1.QueryBuilderUtil.applyPagination(query, filters);
        const { data, error } = await query;
        if (error) {
            throw new common_1.BadRequestException(`Failed to fetch time entries: ${error.message}`);
        }
        return pagination_util_1.PaginationUtil.createPaginatedResponse(data || [], total, filters);
    }
    async updateTimeEntry(id, updateTimeEntryDto, organizationId) {
        await this.validateTimeEntryAccess(id, organizationId);
        const { data, error } = await this.supabaseService.client
            .from('time_entries')
            .update(updateTimeEntryDto)
            .eq('id', id)
            .select(`
        *,
        jobs!inner(id, job_number, service_type),
        team_members!inner(
          id,
          employee_id,
          users!inner(id, name)
        )
      `)
            .single();
        if (error) {
            throw new common_1.BadRequestException(`Failed to update time entry: ${error.message}`);
        }
        return data;
    }
    async deleteTimeEntry(id, organizationId) {
        await this.validateTimeEntryAccess(id, organizationId);
        const { error } = await this.supabaseService.client
            .from('time_entries')
            .delete()
            .eq('id', id);
        if (error) {
            throw new common_1.BadRequestException(`Failed to delete time entry: ${error.message}`);
        }
    }
    async getTeamPerformanceReport(organizationId) {
        const { data: teamMembers, error } = await this.supabaseService.client
            .from('team_members')
            .select(`
        *,
        users!inner(id, name, email)
      `)
            .eq('organization_id', organizationId)
            .eq('is_active', true);
        if (error) {
            throw new common_1.BadRequestException(`Failed to fetch team members: ${error.message}`);
        }
        const performanceData = await Promise.all((teamMembers || []).map(async (member) => {
            const performance = await this.getTeamMemberPerformance(member.id, organizationId);
            return {
                team_member: member,
                performance,
            };
        }));
        const teamAverages = this.calculateTeamAverages(performanceData);
        return {
            team_performance: performanceData,
            team_averages: teamAverages,
            total_team_members: teamMembers?.length || 0,
        };
    }
    async validateUser(userId, organizationId) {
        const { data, error } = await this.supabaseService.client
            .from('users')
            .select('id')
            .eq('id', userId)
            .eq('organization_id', organizationId)
            .single();
        if (error || !data) {
            throw new common_1.NotFoundException('User not found');
        }
    }
    async validateJobAssignment(jobId, teamMemberId, organizationId) {
        const { data, error } = await this.supabaseService.client
            .from('job_assignments')
            .select('id')
            .eq('job_id', jobId)
            .eq('team_member_id', teamMemberId);
        if (error || !data || data.length === 0) {
            throw new common_1.BadRequestException('Team member is not assigned to this job');
        }
        const { data: jobData, error: jobError } = await this.supabaseService.client
            .from('jobs')
            .select('id')
            .eq('id', jobId)
            .eq('organization_id', organizationId)
            .single();
        if (jobError || !jobData) {
            throw new common_1.NotFoundException('Job not found');
        }
    }
    async validateTimeEntryAccess(timeEntryId, organizationId) {
        const { data, error } = await this.supabaseService.client
            .from('time_entries')
            .select(`
        id,
        jobs!inner(organization_id)
      `)
            .eq('id', timeEntryId)
            .eq('jobs.organization_id', organizationId)
            .single();
        if (error || !data) {
            throw new common_1.NotFoundException('Time entry not found');
        }
    }
    async checkTimeEntryOverlap(createTimeEntryDto, organizationId) {
        if (!createTimeEntryDto.end_time) {
            return;
        }
        const { data, error } = await this.supabaseService.client
            .from('time_entries')
            .select(`
        id,
        start_time,
        end_time,
        jobs!inner(organization_id)
      `)
            .eq('team_member_id', createTimeEntryDto.team_member_id)
            .eq('jobs.organization_id', organizationId)
            .not('end_time', 'is', null)
            .or(`start_time.lte.${createTimeEntryDto.end_time},end_time.gte.${createTimeEntryDto.start_time}`);
        if (error) {
            throw new common_1.BadRequestException(`Failed to check time entry overlap: ${error.message}`);
        }
        if (data && data.length > 0) {
            throw new common_1.ConflictException('Time entry overlaps with existing entry');
        }
    }
    async generateEmployeeId(organizationId) {
        const year = new Date().getFullYear();
        const { data, error } = await this.supabaseService.client
            .from('team_members')
            .select('employee_id')
            .eq('organization_id', organizationId)
            .like('employee_id', `EMP-${year}-%`)
            .order('created_at', { ascending: false })
            .limit(1);
        let nextNumber = 1;
        if (data && data.length > 0) {
            const lastId = data[0].employee_id;
            const match = lastId.match(/EMP-\d{4}-(\d{4})/);
            if (match) {
                nextNumber = parseInt(match[1]) + 1;
            }
        }
        return `EMP-${year}-${nextNumber.toString().padStart(4, '0')}`;
    }
    getDefaultPerformanceMetrics() {
        return {
            jobs_completed: 0,
            average_job_duration: 0,
            average_quality_score: 0,
            customer_satisfaction: 0,
            punctuality_score: 0,
            efficiency_rating: 0,
            total_hours_worked: 0,
            overtime_hours: 0,
        };
    }
    calculateTotalHours(timeEntries) {
        let totalMinutes = 0;
        timeEntries.forEach(entry => {
            if (entry.start_time && entry.end_time) {
                const start = new Date(entry.start_time);
                const end = new Date(entry.end_time);
                const duration = (end.getTime() - start.getTime()) / (1000 * 60);
                totalMinutes += duration - (entry.break_duration || 0);
            }
        });
        const totalHours = totalMinutes / 60;
        const regularHours = Math.min(totalHours, 160);
        const overtimeHours = Math.max(0, totalHours - 160);
        return { regular: regularHours, overtime: overtimeHours };
    }
    calculateAverageRating(completedJobs) {
        const ratings = completedJobs
            .flatMap(ja => ja.jobs.customer_reviews || [])
            .map(review => review.rating);
        return ratings.length > 0
            ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
            : 0;
    }
    calculateAverageJobDuration(completedJobs) {
        const durations = completedJobs
            .map(ja => ja.jobs.actual_duration)
            .filter(duration => duration != null);
        return durations.length > 0
            ? durations.reduce((sum, duration) => sum + duration, 0) / durations.length
            : 0;
    }
    calculateAverageQualityScore(completedJobs) {
        const scores = completedJobs
            .map(ja => ja.jobs.quality_score)
            .filter(score => score != null);
        return scores.length > 0
            ? scores.reduce((sum, score) => sum + score, 0) / scores.length
            : 0;
    }
    calculateTeamAverages(performanceData) {
        if (performanceData.length === 0) {
            return {
                average_completion_rate: 0,
                average_customer_satisfaction: 0,
                average_quality_score: 0,
                total_hours_worked: 0,
            };
        }
        const totals = performanceData.reduce((acc, member) => {
            acc.completion_rate += member.performance.completion_rate;
            acc.customer_satisfaction += member.performance.customer_satisfaction;
            acc.quality_score += member.performance.average_quality_score;
            acc.hours_worked += member.performance.total_hours_worked;
            return acc;
        }, { completion_rate: 0, customer_satisfaction: 0, quality_score: 0, hours_worked: 0 });
        return {
            average_completion_rate: totals.completion_rate / performanceData.length,
            average_customer_satisfaction: totals.customer_satisfaction / performanceData.length,
            average_quality_score: totals.quality_score / performanceData.length,
            total_hours_worked: totals.hours_worked,
        };
    }
    async getFilteredCount(organizationId, filters) {
        const { is_active, skills, hired_after, hired_before, search } = filters;
        let query = this.supabaseService.client
            .from('team_members')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', organizationId);
        if (is_active !== undefined)
            query = query.eq('is_active', is_active);
        if (skills && skills.length > 0)
            query = query.contains('skills', skills);
        if (hired_after)
            query = query.gte('hire_date', hired_after);
        if (hired_before)
            query = query.lte('hire_date', hired_before);
        if (search) {
            query = query.or(`employee_id.ilike.%${search}%`);
        }
        const { count, error } = await query;
        if (error) {
            throw new common_1.BadRequestException(`Failed to count team members: ${error.message}`);
        }
        return count || 0;
    }
    async getTimeEntriesCount(organizationId, filters) {
        const { job_id, team_member_id, date_from, date_to } = filters;
        let query = this.supabaseService.client
            .from('time_entries')
            .select(`
        *,
        jobs!inner(organization_id)
      `, { count: 'exact', head: true })
            .eq('jobs.organization_id', organizationId);
        if (job_id)
            query = query.eq('job_id', job_id);
        if (team_member_id)
            query = query.eq('team_member_id', team_member_id);
        if (date_from)
            query = query.gte('start_time', date_from);
        if (date_to)
            query = query.lte('start_time', date_to);
        const { count, error } = await query;
        if (error) {
            throw new common_1.BadRequestException(`Failed to count time entries: ${error.message}`);
        }
        return count || 0;
    }
};
exports.TeamService = TeamService;
exports.TeamService = TeamService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], TeamService);
//# sourceMappingURL=team.service.js.map