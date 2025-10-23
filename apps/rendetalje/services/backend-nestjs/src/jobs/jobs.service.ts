import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { BaseService } from '../common/services/base.service';
import { PrismaService } from '../database/prisma.service';
import { Job, JobStatus, ServiceType } from './entities/job.entity';
import { JobAssignment } from './entities/job-assignment.entity';
import { CreateJobDto, UpdateJobDto, UpdateJobStatusDto, AssignJobDto, JobFiltersDto } from './dto';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';
import { PaginationUtil } from '../common/utils/pagination.util';

@Injectable()
export class JobsService extends BaseService<Job> {
  protected modelName = 'jobs';
  protected searchFields = ['job_number', 'special_instructions'];

  constructor(protected readonly prismaService: PrismaService) {
    super(prismaService);
  }

  async findAllWithFilters(
    organizationId: string,
    filters: JobFiltersDto,
  ): Promise<PaginatedResponseDto<Job>> {
    const { 
      status, 
      service_type, 
      customer_id, 
      team_member_id, 
      date_from, 
      date_to, 
      city,
      search 
    } = filters;

    // Build base query with joins
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

    // Apply filters
    const queryFilters: Record<string, any> = {};
    
    if (status) queryFilters.status = status;
    if (service_type) queryFilters.service_type = service_type;
    if (customer_id) queryFilters.customer_id = customer_id;

    if (Object.keys(queryFilters).length > 0) {
      query = QueryBuilderUtil.applyFilters(query, queryFilters);
    }

    // Date range filter
    if (date_from) {
      query = query.gte('scheduled_date', date_from);
    }
    if (date_to) {
      query = query.lte('scheduled_date', date_to);
    }

    // City filter (JSON field)
    if (city) {
      query = query.ilike('location->city', `%${city}%`);
    }

    // Team member filter (through job_assignments)
    if (team_member_id) {
      query = query.eq('job_assignments.team_member_id', team_member_id);
    }

    // Search filter
    if (search) {
      query = QueryBuilderUtil.applySearch(query, this.searchFields, search);
    }

    // Get total count
    const total = await this.getFilteredCount(organizationId, filters);

    // Apply pagination and execute
    query = QueryBuilderUtil.applyPagination(query, filters);
    const { data, error } = await query;

    if (error) {
      throw new BadRequestException(`Failed to fetch jobs: ${error.message}`);
    }

    return PaginationUtil.createPaginatedResponse(data || [], total, filters);
  }

  async create(createJobDto: CreateJobDto, organizationId: string): Promise<Job> {
    // Validate customer exists and belongs to organization
    await this.validateCustomer(createJobDto.customer_id, organizationId);

    // Check for scheduling conflicts
    await this.checkSchedulingConflicts(createJobDto.scheduled_date, organizationId);

    // Generate job number if not provided
    const jobData = {
      ...createJobDto,
      organization_id: organizationId,
      status: JobStatus.SCHEDULED,
      checklist: createJobDto.checklist || [],
      photos: [],
    };

    const { data, error } = await this.supabaseService.client
      .from('jobs')
      .insert(jobData)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(`Failed to create job: ${error.message}`);
    }

    return data;
  }

  async updateStatus(
    id: string, 
    updateStatusDto: UpdateJobStatusDto, 
    organizationId: string
  ): Promise<Job> {
    // Get current job
    const currentJob = await this.findById(id, organizationId);

    // Validate status transition
    this.validateStatusTransition(currentJob.status, updateStatusDto.status);

    // Update job
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
      throw new BadRequestException(`Failed to update job status: ${error.message}`);
    }

    // Handle status-specific logic
    await this.handleStatusChange(data, currentJob.status);

    return data;
  }

  async assignTeamMembers(
    id: string, 
    assignJobDto: AssignJobDto, 
    organizationId: string
  ): Promise<JobAssignment[]> {
    // Verify job exists and belongs to organization
    await this.findById(id, organizationId);

    // Validate team members exist and belong to organization
    for (const assignment of assignJobDto.assignments) {
      await this.validateTeamMember(assignment.team_member_id, organizationId);
    }

    // Remove existing assignments
    await this.supabaseService.client
      .from('job_assignments')
      .delete()
      .eq('job_id', id);

    // Create new assignments
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
      throw new BadRequestException(`Failed to assign team members: ${error.message}`);
    }

    return data;
  }

  async getJobAssignments(id: string, organizationId: string): Promise<JobAssignment[]> {
    // Verify job exists and belongs to organization
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
      throw new BadRequestException(`Failed to fetch job assignments: ${error.message}`);
    }

    return data || [];
  }

  async rescheduleJob(
    id: string, 
    newScheduledDate: string, 
    organizationId: string
  ): Promise<Job> {
    const currentJob = await this.findById(id, organizationId);

    // Check if job can be rescheduled
    if (currentJob.status === JobStatus.COMPLETED || currentJob.status === JobStatus.CANCELLED) {
      throw new BadRequestException('Cannot reschedule completed or cancelled jobs');
    }

    // Check for conflicts with new date
    await this.checkSchedulingConflicts(newScheduledDate, organizationId, id);

    // Create new job with rescheduled status
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

    // Update original job to rescheduled status and link to new job
    await this.supabaseService.client
      .from('jobs')
      .update({ 
        status: JobStatus.RESCHEDULED,
        parent_job_id: rescheduledJob.id 
      })
      .eq('id', id);

    return rescheduledJob;
  }

  async getJobProfitability(organizationId: string): Promise<any> {
    const { data, error } = await this.supabaseService.client
      .from('jobs')
      .select('profitability, service_type, scheduled_date')
      .eq('organization_id', organizationId)
      .eq('status', JobStatus.COMPLETED)
      .not('profitability', 'is', null);

    if (error) {
      throw new BadRequestException(`Failed to fetch profitability data: ${error.message}`);
    }

    // Calculate aggregated profitability metrics
    const metrics = {
      total_revenue: 0,
      total_costs: 0,
      total_profit: 0,
      profit_margin_percentage: 0,
      by_service_type: {} as Record<ServiceType, any>,
      monthly_trends: {} as Record<string, any>,
    };

    data.forEach(job => {
      const profit = job.profitability;
      if (!profit) return;

      metrics.total_revenue += profit.total_price;
      metrics.total_costs += profit.labor_cost + profit.material_cost + profit.travel_cost;
      metrics.total_profit += profit.profit_margin;

      // By service type
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

      // Monthly trends
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

  private async validateCustomer(customerId: string, organizationId: string): Promise<void> {
    const { data, error } = await this.supabaseService.client
      .from('customers')
      .select('id')
      .eq('id', customerId)
      .eq('organization_id', organizationId)
      .single();

    if (error || !data) {
      throw new NotFoundException('Customer not found');
    }
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

  private async checkSchedulingConflicts(
    scheduledDate: string, 
    organizationId: string, 
    excludeJobId?: string
  ): Promise<void> {
    const startTime = new Date(scheduledDate);
    const endTime = new Date(startTime.getTime() + 4 * 60 * 60 * 1000); // 4 hours buffer

    let query = this.supabaseService.client
      .from('jobs')
      .select('id, scheduled_date, estimated_duration')
      .eq('organization_id', organizationId)
      .in('status', [JobStatus.SCHEDULED, JobStatus.CONFIRMED, JobStatus.IN_PROGRESS])
      .gte('scheduled_date', startTime.toISOString())
      .lte('scheduled_date', endTime.toISOString());

    if (excludeJobId) {
      query = query.neq('id', excludeJobId);
    }

    const { data, error } = await query;

    if (error) {
      throw new BadRequestException(`Failed to check scheduling conflicts: ${error.message}`);
    }

    if (data && data.length > 0) {
      throw new ConflictException('Scheduling conflict detected with existing jobs');
    }
  }

  private validateStatusTransition(currentStatus: JobStatus, newStatus: JobStatus): void {
    const validTransitions: Record<JobStatus, JobStatus[]> = {
      [JobStatus.SCHEDULED]: [JobStatus.CONFIRMED, JobStatus.CANCELLED, JobStatus.RESCHEDULED],
      [JobStatus.CONFIRMED]: [JobStatus.IN_PROGRESS, JobStatus.CANCELLED, JobStatus.RESCHEDULED],
      [JobStatus.IN_PROGRESS]: [JobStatus.COMPLETED, JobStatus.CANCELLED],
      [JobStatus.COMPLETED]: [], // No transitions from completed
      [JobStatus.CANCELLED]: [], // No transitions from cancelled
      [JobStatus.RESCHEDULED]: [], // No transitions from rescheduled
    };

    if (!validTransitions[currentStatus].includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${currentStatus} to ${newStatus}`
      );
    }
  }

  private async handleStatusChange(job: Job, previousStatus: JobStatus): Promise<void> {
    // Handle status-specific business logic
    switch (job.status) {
      case JobStatus.COMPLETED:
        await this.handleJobCompletion(job);
        break;
      case JobStatus.IN_PROGRESS:
        await this.handleJobStart(job);
        break;
      case JobStatus.CANCELLED:
        await this.handleJobCancellation(job);
        break;
    }
  }

  private async handleJobCompletion(job: Job): Promise<void> {
    // Update customer statistics
    await this.updateCustomerStats(job.customer_id);
    
    // TODO: Trigger invoice generation via Billy.dk integration
    // TODO: Send completion notification to customer
    // TODO: Request customer review
  }

  private async handleJobStart(job: Job): Promise<void> {
    // TODO: Send start notification to customer
    // TODO: Update team member location tracking
  }

  private async handleJobCancellation(job: Job): Promise<void> {
    // TODO: Send cancellation notification to customer
    // TODO: Handle refunds if applicable
  }

  private async updateCustomerStats(customerId: string): Promise<void> {
    // This will be handled by database triggers, but we can add additional logic here
    // TODO: Update customer satisfaction scores
    // TODO: Update customer lifetime value
  }

  private async getFilteredCount(organizationId: string, filters: JobFiltersDto): Promise<number> {
    const { status, service_type, customer_id, team_member_id, date_from, date_to, city, search } = filters;

    let query = this.supabaseService.client
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId);

    // Apply same filters as main query
    const queryFilters: Record<string, any> = {};
    if (status) queryFilters.status = status;
    if (service_type) queryFilters.service_type = service_type;
    if (customer_id) queryFilters.customer_id = customer_id;

    if (Object.keys(queryFilters).length > 0) {
      query = QueryBuilderUtil.applyFilters(query, queryFilters);
    }

    if (date_from) query = query.gte('scheduled_date', date_from);
    if (date_to) query = query.lte('scheduled_date', date_to);
    if (city) query = query.ilike('location->city', `%${city}%`);
    if (search) query = QueryBuilderUtil.applySearch(query, this.searchFields, search);

    const { count, error } = await query;

    if (error) {
      throw new BadRequestException(`Failed to count jobs: ${error.message}`);
    }

    return count || 0;
  }
}