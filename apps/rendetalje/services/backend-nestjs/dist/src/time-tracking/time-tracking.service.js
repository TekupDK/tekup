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
exports.TimeTrackingService = void 0;
const common_1 = require("@nestjs/common");
const base_service_1 = require("../common/services/base.service");
const supabase_service_1 = require("../supabase/supabase.service");
const query_builder_util_1 = require("../common/utils/query-builder.util");
const pagination_util_1 = require("../common/utils/pagination.util");
let TimeTrackingService = class TimeTrackingService extends base_service_1.BaseService {
    constructor(supabaseService) {
        super(supabaseService);
        this.supabaseService = supabaseService;
        this.tableName = 'time_entries';
        this.searchFields = ['notes'];
    }
    async findAllWithFilters(organizationId, filters) {
        const { employee_id, job_id, date, start_date, end_date, search } = filters;
        let query = this.supabaseService.client
            .from('time_entries')
            .select(`
        *,
        team_members!inner(id, user_id, users(name, email)),
        jobs(id, job_number, service_type, customer_id)
      `)
            .eq('team_members.organization_id', organizationId);
        const queryFilters = {};
        if (employee_id)
            queryFilters.team_member_id = employee_id;
        if (job_id)
            queryFilters.job_id = job_id;
        if (Object.keys(queryFilters).length > 0) {
            query = query_builder_util_1.QueryBuilderUtil.applyFilters(query, queryFilters);
        }
        if (date) {
            const startOfDay = `${date}T00:00:00`;
            const endOfDay = `${date}T23:59:59`;
            query = query.gte('start_time', startOfDay).lte('start_time', endOfDay);
        }
        else if (start_date && end_date) {
            query = query.gte('start_time', start_date).lte('start_time', end_date);
        }
        if (search) {
            query = query_builder_util_1.QueryBuilderUtil.applySearch(query, this.searchFields, search);
        }
        const total = await this.getFilteredCount(organizationId, filters);
        query = query_builder_util_1.QueryBuilderUtil.applyPagination(query, filters);
        query = query.order('start_time', { ascending: false });
        const { data, error } = await query;
        if (error) {
            throw new common_1.BadRequestException(`Failed to fetch time entries: ${error.message}`);
        }
        return pagination_util_1.PaginationUtil.createPaginatedResponse(data || [], total, filters);
    }
    async create(createTimeEntryDto, organizationId) {
        await this.validateTeamMember(createTimeEntryDto.team_member_id, organizationId);
        if (createTimeEntryDto.job_id) {
            await this.validateJob(createTimeEntryDto.job_id, organizationId);
        }
        await this.checkForActiveTimeEntry(createTimeEntryDto.team_member_id);
        const timeEntryData = {
            ...createTimeEntryDto,
            break_duration: 0,
        };
        const { data, error } = await this.supabaseService.client
            .from('time_entries')
            .insert(timeEntryData)
            .select()
            .single();
        if (error) {
            throw new common_1.BadRequestException(`Failed to create time entry: ${error.message}`);
        }
        return data;
    }
    async update(id, updateTimeEntryDto, organizationId) {
        const existingEntry = await this.findById(id, organizationId);
        if (updateTimeEntryDto.end_time) {
            const startTime = new Date(existingEntry.start_time);
            const endTime = new Date(updateTimeEntryDto.end_time);
            if (endTime <= startTime) {
                throw new common_1.BadRequestException('End time must be after start time');
            }
        }
        const { data, error } = await this.supabaseService.client
            .from('time_entries')
            .update(updateTimeEntryDto)
            .eq('id', id)
            .select()
            .single();
        if (error) {
            throw new common_1.BadRequestException(`Failed to update time entry: ${error.message}`);
        }
        return data;
    }
    async getDailySummary(employeeId, date, organizationId) {
        await this.validateTeamMember(employeeId, organizationId);
        const startOfDay = `${date}T00:00:00`;
        const endOfDay = `${date}T23:59:59`;
        const { data: entries, error } = await this.supabaseService.client
            .from('time_entries')
            .select(`
        *,
        jobs(id, job_number, service_type)
      `)
            .eq('team_member_id', employeeId)
            .gte('start_time', startOfDay)
            .lte('start_time', endOfDay)
            .order('start_time', { ascending: true });
        if (error) {
            throw new common_1.BadRequestException(`Failed to fetch daily summary: ${error.message}`);
        }
        let totalWorkedMinutes = 0;
        let totalBreakMinutes = 0;
        let activeEntry = null;
        entries?.forEach(entry => {
            if (entry.end_time) {
                const start = new Date(entry.start_time);
                const end = new Date(entry.end_time);
                const duration = (end.getTime() - start.getTime()) / 1000 / 60;
                totalWorkedMinutes += duration - (entry.break_duration || 0);
                totalBreakMinutes += entry.break_duration || 0;
            }
            else {
                activeEntry = entry;
            }
        });
        const isOvertime = totalWorkedMinutes > 8 * 60;
        return {
            date,
            entries: entries || [],
            activeEntry,
            summary: {
                totalWorkedMinutes,
                totalBreakMinutes,
                totalEntries: entries?.length || 0,
                isOvertime,
                overtimeMinutes: isOvertime ? totalWorkedMinutes - 8 * 60 : 0,
            },
        };
    }
    async getOvertimeReport(startDate, endDate, organizationId) {
        const { data: entries, error } = await this.supabaseService.client
            .from('time_entries')
            .select(`
        *,
        team_members!inner(id, user_id, users(name, email))
      `)
            .eq('team_members.organization_id', organizationId)
            .gte('start_time', startDate)
            .lte('start_time', endDate)
            .not('end_time', 'is', null);
        if (error) {
            throw new common_1.BadRequestException(`Failed to fetch overtime report: ${error.message}`);
        }
        const employeeData = {};
        entries?.forEach(entry => {
            const employeeId = entry.team_member_id;
            const date = entry.start_time.split('T')[0];
            const start = new Date(entry.start_time);
            const end = new Date(entry.end_time);
            const workedMinutes = (end.getTime() - start.getTime()) / 1000 / 60 - (entry.break_duration || 0);
            if (!employeeData[employeeId]) {
                employeeData[employeeId] = {
                    employee: entry.team_members.users,
                    dailyHours: {},
                    totalOvertime: 0,
                };
            }
            if (!employeeData[employeeId].dailyHours[date]) {
                employeeData[employeeId].dailyHours[date] = 0;
            }
            employeeData[employeeId].dailyHours[date] += workedMinutes;
        });
        Object.values(employeeData).forEach((employee) => {
            Object.entries(employee.dailyHours).forEach(([date, minutes]) => {
                if (minutes > 8 * 60) {
                    employee.totalOvertime += minutes - 8 * 60;
                }
            });
        });
        return {
            period: { startDate, endDate },
            employees: Object.values(employeeData).filter((emp) => emp.totalOvertime > 0),
        };
    }
    async createCorrection(createTimeCorrectionDto, organizationId, submittedBy) {
        const originalEntry = await this.findById(createTimeCorrectionDto.original_entry_id, organizationId);
        const { data: teamMember } = await this.supabaseService.client
            .from('team_members')
            .select('id')
            .eq('user_id', submittedBy)
            .eq('organization_id', organizationId)
            .single();
        if (!teamMember || teamMember.id !== originalEntry.team_member_id) {
            throw new common_1.ForbiddenException('You can only correct your own time entries');
        }
        const { data: existingCorrection } = await this.supabaseService.client
            .from('time_corrections')
            .select('id')
            .eq('original_entry_id', createTimeCorrectionDto.original_entry_id)
            .eq('status', 'pending')
            .single();
        if (existingCorrection) {
            throw new common_1.BadRequestException('There is already a pending correction for this time entry');
        }
        const correctionData = {
            ...createTimeCorrectionDto,
            original_start_time: originalEntry.start_time,
            original_end_time: originalEntry.end_time,
            original_break_duration: originalEntry.break_duration || 0,
            status: 'pending',
            submitted_by: submittedBy,
        };
        const { data, error } = await this.supabaseService.client
            .from('time_corrections')
            .insert(correctionData)
            .select()
            .single();
        if (error) {
            throw new common_1.BadRequestException(`Failed to create time correction: ${error.message}`);
        }
        return data;
    }
    async getCorrections(organizationId, employeeId, status, date) {
        let query = this.supabaseService.client
            .from('time_corrections')
            .select(`
        *,
        time_entries!original_entry_id(
          team_member_id,
          team_members(
            user_id,
            users(name, email)
          )
        )
      `);
        if (employeeId) {
            query = query.eq('time_entries.team_member_id', employeeId);
        }
        if (status) {
            query = query.eq('status', status);
        }
        if (date) {
            const startOfDay = `${date}T00:00:00`;
            const endOfDay = `${date}T23:59:59`;
            query = query.gte('original_start_time', startOfDay).lte('original_start_time', endOfDay);
        }
        query = query.order('created_at', { ascending: false });
        const { data, error } = await query;
        if (error) {
            throw new common_1.BadRequestException(`Failed to fetch time corrections: ${error.message}`);
        }
        const filteredData = data?.filter(correction => correction.time_entries?.team_members?.organization_id === organizationId) || [];
        return filteredData;
    }
    async approveCorrection(id, organizationId, approvedBy) {
        const correction = await this.getCorrectionById(id, organizationId);
        if (correction.status !== 'pending') {
            throw new common_1.BadRequestException('Only pending corrections can be approved');
        }
        await this.supabaseService.client
            .from('time_entries')
            .update({
            start_time: correction.corrected_start_time,
            end_time: correction.corrected_end_time,
            break_duration: correction.corrected_break_duration,
        })
            .eq('id', correction.original_entry_id);
        const { data, error } = await this.supabaseService.client
            .from('time_corrections')
            .update({
            status: 'approved',
            approved_by: approvedBy,
            approved_at: new Date().toISOString(),
        })
            .eq('id', id)
            .select()
            .single();
        if (error) {
            throw new common_1.BadRequestException(`Failed to approve correction: ${error.message}`);
        }
        return data;
    }
    async rejectCorrection(id, reason, organizationId, rejectedBy) {
        const correction = await this.getCorrectionById(id, organizationId);
        if (correction.status !== 'pending') {
            throw new common_1.BadRequestException('Only pending corrections can be rejected');
        }
        const { data, error } = await this.supabaseService.client
            .from('time_corrections')
            .update({
            status: 'rejected',
            rejection_reason: reason,
            rejected_by: rejectedBy,
            rejected_at: new Date().toISOString(),
        })
            .eq('id', id)
            .select()
            .single();
        if (error) {
            throw new common_1.BadRequestException(`Failed to reject correction: ${error.message}`);
        }
        return data;
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
    async validateJob(jobId, organizationId) {
        const { data, error } = await this.supabaseService.client
            .from('jobs')
            .select('id')
            .eq('id', jobId)
            .eq('organization_id', organizationId)
            .single();
        if (error || !data) {
            throw new common_1.NotFoundException('Job not found');
        }
    }
    async checkForActiveTimeEntry(teamMemberId) {
        const { data, error } = await this.supabaseService.client
            .from('time_entries')
            .select('id')
            .eq('team_member_id', teamMemberId)
            .is('end_time', null)
            .single();
        if (data) {
            throw new common_1.BadRequestException('Employee already has an active time entry');
        }
    }
    async getCorrectionById(id, organizationId) {
        const { data, error } = await this.supabaseService.client
            .from('time_corrections')
            .select(`
        *,
        time_entries!original_entry_id(
          team_member_id,
          team_members!inner(organization_id)
        )
      `)
            .eq('id', id)
            .single();
        if (error || !data) {
            throw new common_1.NotFoundException('Time correction not found');
        }
        if (data.time_entries?.team_members?.organization_id !== organizationId) {
            throw new common_1.ForbiddenException('Access denied');
        }
        return data;
    }
    async getFilteredCount(organizationId, filters) {
        const { employee_id, job_id, date, start_date, end_date, search } = filters;
        let query = this.supabaseService.client
            .from('time_entries')
            .select('*', { count: 'exact', head: true })
            .eq('team_members.organization_id', organizationId);
        const queryFilters = {};
        if (employee_id)
            queryFilters.team_member_id = employee_id;
        if (job_id)
            queryFilters.job_id = job_id;
        if (Object.keys(queryFilters).length > 0) {
            query = query_builder_util_1.QueryBuilderUtil.applyFilters(query, queryFilters);
        }
        if (date) {
            const startOfDay = `${date}T00:00:00`;
            const endOfDay = `${date}T23:59:59`;
            query = query.gte('start_time', startOfDay).lte('start_time', endOfDay);
        }
        else if (start_date && end_date) {
            query = query.gte('start_time', start_date).lte('start_time', end_date);
        }
        if (search)
            query = query_builder_util_1.QueryBuilderUtil.applySearch(query, this.searchFields, search);
        const { count, error } = await query;
        if (error) {
            throw new common_1.BadRequestException(`Failed to count time entries: ${error.message}`);
        }
        return count || 0;
    }
};
exports.TimeTrackingService = TimeTrackingService;
exports.TimeTrackingService = TimeTrackingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], TimeTrackingService);
//# sourceMappingURL=time-tracking.service.js.map