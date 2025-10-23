import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { BaseService } from '../common/services/base.service';
import { SupabaseService } from '../supabase/supabase.service';
import { TimeEntry } from './entities/time-entry.entity';
import { TimeCorrection } from './entities/time-correction.entity';
import { 
  CreateTimeEntryDto, 
  UpdateTimeEntryDto, 
  CreateTimeCorrectionDto,
  TimeEntryFiltersDto 
} from './dto';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';
import { QueryBuilderUtil } from '../common/utils/query-builder.util';
import { PaginationUtil } from '../common/utils/pagination.util';

@Injectable()
export class TimeTrackingService extends BaseService<TimeEntry> {
  protected tableName = 'time_entries';
  protected searchFields = ['notes'];

  constructor(protected readonly supabaseService: SupabaseService) {
    super(supabaseService);
  }

  async findAllWithFilters(
    organizationId: string,
    filters: TimeEntryFiltersDto,
  ): Promise<PaginatedResponseDto<TimeEntry>> {
    const { 
      employee_id, 
      job_id, 
      date,
      start_date,
      end_date,
      search 
    } = filters;

    // Build base query
    let query = this.supabaseService.client
      .from('time_entries')
      .select(`
        *,
        team_members!inner(id, user_id, users(name, email)),
        jobs(id, job_number, service_type, customer_id)
      `)
      .eq('team_members.organization_id', organizationId);

    // Apply filters
    const queryFilters: Record<string, any> = {};
    
    if (employee_id) queryFilters.team_member_id = employee_id;
    if (job_id) queryFilters.job_id = job_id;

    if (Object.keys(queryFilters).length > 0) {
      query = QueryBuilderUtil.applyFilters(query, queryFilters);
    }

    // Date filters
    if (date) {
      const startOfDay = `${date}T00:00:00`;
      const endOfDay = `${date}T23:59:59`;
      query = query.gte('start_time', startOfDay).lte('start_time', endOfDay);
    } else if (start_date && end_date) {
      query = query.gte('start_time', start_date).lte('start_time', end_date);
    }

    // Search filter
    if (search) {
      query = QueryBuilderUtil.applySearch(query, this.searchFields, search);
    }

    // Get total count
    const total = await this.getFilteredCount(organizationId, filters);

    // Apply pagination and execute
    query = QueryBuilderUtil.applyPagination(query, filters);
    query = query.order('start_time', { ascending: false });
    
    const { data, error } = await query;

    if (error) {
      throw new BadRequestException(`Failed to fetch time entries: ${error.message}`);
    }

    return PaginationUtil.createPaginatedResponse(data || [], total, filters);
  }

  async create(createTimeEntryDto: CreateTimeEntryDto, organizationId: string): Promise<TimeEntry> {
    // Verify team member exists and belongs to organization
    await this.validateTeamMember(createTimeEntryDto.team_member_id, organizationId);

    // Verify job exists if provided
    if (createTimeEntryDto.job_id) {
      await this.validateJob(createTimeEntryDto.job_id, organizationId);
    }

    // Check for overlapping active time entries
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
      throw new BadRequestException(`Failed to create time entry: ${error.message}`);
    }

    return data;
  }

  async update(id: string, updateTimeEntryDto: UpdateTimeEntryDto, organizationId: string): Promise<TimeEntry> {
    // Verify time entry exists and belongs to organization
    const existingEntry = await this.findById(id, organizationId);

    // Validate end time is after start time
    if (updateTimeEntryDto.end_time) {
      const startTime = new Date(existingEntry.start_time);
      const endTime = new Date(updateTimeEntryDto.end_time);
      
      if (endTime <= startTime) {
        throw new BadRequestException('End time must be after start time');
      }
    }

    const { data, error } = await this.supabaseService.client
      .from('time_entries')
      .update(updateTimeEntryDto)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(`Failed to update time entry: ${error.message}`);
    }

    return data;
  }

  async getDailySummary(employeeId: string, date: string, organizationId: string): Promise<any> {
    // Verify team member exists and belongs to organization
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
      throw new BadRequestException(`Failed to fetch daily summary: ${error.message}`);
    }

    // Calculate totals
    let totalWorkedMinutes = 0;
    let totalBreakMinutes = 0;
    let activeEntry = null;

    entries?.forEach(entry => {
      if (entry.end_time) {
        const start = new Date(entry.start_time);
        const end = new Date(entry.end_time);
        const duration = (end.getTime() - start.getTime()) / 1000 / 60; // minutes
        totalWorkedMinutes += duration - (entry.break_duration || 0);
        totalBreakMinutes += entry.break_duration || 0;
      } else {
        activeEntry = entry;
      }
    });

    const isOvertime = totalWorkedMinutes > 8 * 60; // 8 hours

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

  async getOvertimeReport(startDate: string, endDate: string, organizationId: string): Promise<any> {
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
      throw new BadRequestException(`Failed to fetch overtime report: ${error.message}`);
    }

    // Group by employee and date
    const employeeData: Record<string, any> = {};

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

    // Calculate overtime
    Object.values(employeeData).forEach((employee: any) => {
      Object.entries(employee.dailyHours).forEach(([date, minutes]: [string, number]) => {
        if (minutes > 8 * 60) {
          employee.totalOvertime += minutes - 8 * 60;
        }
      });
    });

    return {
      period: { startDate, endDate },
      employees: Object.values(employeeData).filter((emp: any) => emp.totalOvertime > 0),
    };
  }

  async createCorrection(
    createTimeCorrectionDto: CreateTimeCorrectionDto, 
    organizationId: string,
    submittedBy: string
  ): Promise<TimeCorrection> {
    // Verify original time entry exists and belongs to organization
    const originalEntry = await this.findById(createTimeCorrectionDto.original_entry_id, organizationId);

    // Verify the employee can only correct their own entries
    const { data: teamMember } = await this.supabaseService.client
      .from('team_members')
      .select('id')
      .eq('user_id', submittedBy)
      .eq('organization_id', organizationId)
      .single();

    if (!teamMember || teamMember.id !== originalEntry.team_member_id) {
      throw new ForbiddenException('You can only correct your own time entries');
    }

    // Check if there's already a pending correction for this entry
    const { data: existingCorrection } = await this.supabaseService.client
      .from('time_corrections')
      .select('id')
      .eq('original_entry_id', createTimeCorrectionDto.original_entry_id)
      .eq('status', 'pending')
      .single();

    if (existingCorrection) {
      throw new BadRequestException('There is already a pending correction for this time entry');
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
      throw new BadRequestException(`Failed to create time correction: ${error.message}`);
    }

    return data;
  }

  async getCorrections(
    organizationId: string, 
    employeeId?: string, 
    status?: string,
    date?: string
  ): Promise<TimeCorrection[]> {
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

    // Filter by organization through team member
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
      throw new BadRequestException(`Failed to fetch time corrections: ${error.message}`);
    }

    // Filter by organization
    const filteredData = data?.filter(correction => 
      correction.time_entries?.team_members?.organization_id === organizationId
    ) || [];

    return filteredData;
  }

  async approveCorrection(id: string, organizationId: string, approvedBy: string): Promise<TimeCorrection> {
    const correction = await this.getCorrectionById(id, organizationId);

    if (correction.status !== 'pending') {
      throw new BadRequestException('Only pending corrections can be approved');
    }

    // Update the original time entry
    await this.supabaseService.client
      .from('time_entries')
      .update({
        start_time: correction.corrected_start_time,
        end_time: correction.corrected_end_time,
        break_duration: correction.corrected_break_duration,
      })
      .eq('id', correction.original_entry_id);

    // Update correction status
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
      throw new BadRequestException(`Failed to approve correction: ${error.message}`);
    }

    return data;
  }

  async rejectCorrection(
    id: string, 
    reason: string, 
    organizationId: string, 
    rejectedBy: string
  ): Promise<TimeCorrection> {
    const correction = await this.getCorrectionById(id, organizationId);

    if (correction.status !== 'pending') {
      throw new BadRequestException('Only pending corrections can be rejected');
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
      throw new BadRequestException(`Failed to reject correction: ${error.message}`);
    }

    return data;
  }

  private async validateTeamMember(teamMemberId: string, organizationId: string): Promise<void> {
    const { data, error } = await this.supabaseService.client
      .from('team_members')
      .select('id')
      .eq('id', teamMemberId)
      .eq('organization_id', organizationId)
      .single();

    if (error || !data) {
      throw new NotFoundException('Team member not found');
    }
  }

  private async validateJob(jobId: string, organizationId: string): Promise<void> {
    const { data, error } = await this.supabaseService.client
      .from('jobs')
      .select('id')
      .eq('id', jobId)
      .eq('organization_id', organizationId)
      .single();

    if (error || !data) {
      throw new NotFoundException('Job not found');
    }
  }

  private async checkForActiveTimeEntry(teamMemberId: string): Promise<void> {
    const { data, error } = await this.supabaseService.client
      .from('time_entries')
      .select('id')
      .eq('team_member_id', teamMemberId)
      .is('end_time', null)
      .single();

    if (data) {
      throw new BadRequestException('Employee already has an active time entry');
    }
  }

  private async getCorrectionById(id: string, organizationId: string): Promise<TimeCorrection> {
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
      throw new NotFoundException('Time correction not found');
    }

    if (data.time_entries?.team_members?.organization_id !== organizationId) {
      throw new ForbiddenException('Access denied');
    }

    return data;
  }

  private async getFilteredCount(organizationId: string, filters: TimeEntryFiltersDto): Promise<number> {
    const { employee_id, job_id, date, start_date, end_date, search } = filters;

    let query = this.supabaseService.client
      .from('time_entries')
      .select('*', { count: 'exact', head: true })
      .eq('team_members.organization_id', organizationId);

    // Apply same filters as main query
    const queryFilters: Record<string, any> = {};
    if (employee_id) queryFilters.team_member_id = employee_id;
    if (job_id) queryFilters.job_id = job_id;

    if (Object.keys(queryFilters).length > 0) {
      query = QueryBuilderUtil.applyFilters(query, queryFilters);
    }

    if (date) {
      const startOfDay = `${date}T00:00:00`;
      const endOfDay = `${date}T23:59:59`;
      query = query.gte('start_time', startOfDay).lte('start_time', endOfDay);
    } else if (start_date && end_date) {
      query = query.gte('start_time', start_date).lte('start_time', end_date);
    }

    if (search) query = QueryBuilderUtil.applySearch(query, this.searchFields, search);

    const { count, error } = await query;

    if (error) {
      throw new BadRequestException(`Failed to count time entries: ${error.message}`);
    }

    return count || 0;
  }
}