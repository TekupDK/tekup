import { BaseService } from '../common/services/base.service';
import { PrismaService } from '../database/prisma.service';
import { Job } from './entities/job.entity';
import { JobAssignment } from './entities/job-assignment.entity';
import { CreateJobDto, UpdateJobStatusDto, AssignJobDto, JobFiltersDto } from './dto';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';
export declare class JobsService extends BaseService<Job> {
    protected readonly prismaService: PrismaService;
    protected modelName: string;
    protected searchFields: string[];
    constructor(prismaService: PrismaService);
    findAllWithFilters(organizationId: string, filters: JobFiltersDto): Promise<PaginatedResponseDto<Job>>;
    create(createJobDto: CreateJobDto, organizationId: string): Promise<Job>;
    updateStatus(id: string, updateStatusDto: UpdateJobStatusDto, organizationId: string): Promise<Job>;
    assignTeamMembers(id: string, assignJobDto: AssignJobDto, organizationId: string): Promise<JobAssignment[]>;
    getJobAssignments(id: string, organizationId: string): Promise<JobAssignment[]>;
    rescheduleJob(id: string, newScheduledDate: string, organizationId: string): Promise<Job>;
    getJobProfitability(organizationId: string): Promise<any>;
    private validateCustomer;
    private validateTeamMember;
    private checkSchedulingConflicts;
    private validateStatusTransition;
    private handleStatusChange;
    private handleJobCompletion;
    private handleJobStart;
    private handleJobCancellation;
    private updateCustomerStats;
    private getFilteredCount;
}
