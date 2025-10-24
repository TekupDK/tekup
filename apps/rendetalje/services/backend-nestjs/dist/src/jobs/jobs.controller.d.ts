import { JobsService } from './jobs.service';
import { CreateJobDto, UpdateJobDto, UpdateJobStatusDto, AssignJobDto, JobFiltersDto } from './dto';
import { Job } from './entities/job.entity';
import { JobAssignment } from './entities/job-assignment.entity';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';
export declare class JobsController {
    private readonly jobsService;
    constructor(jobsService: JobsService);
    create(createJobDto: CreateJobDto, req: any): Promise<Job>;
    findAll(filters: JobFiltersDto, req: any): Promise<PaginatedResponseDto<Job>>;
    getProfitability(req: any): Promise<any>;
    findOne(id: string, req: any): Promise<Job>;
    update(id: string, updateJobDto: UpdateJobDto, req: any): Promise<Job>;
    updateStatus(id: string, updateStatusDto: UpdateJobStatusDto, req: any): Promise<Job>;
    assignTeamMembers(id: string, assignJobDto: AssignJobDto, req: any): Promise<JobAssignment[]>;
    getAssignments(id: string, req: any): Promise<JobAssignment[]>;
    reschedule(id: string, scheduledDate: string, req: any): Promise<Job>;
    remove(id: string, req: any): Promise<void>;
}
