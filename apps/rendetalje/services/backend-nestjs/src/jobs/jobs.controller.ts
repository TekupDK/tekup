import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JobsService } from './jobs.service';
import { CreateJobDto, UpdateJobDto, UpdateJobStatusDto, AssignJobDto, JobFiltersDto } from './dto';
import { Job } from './entities/job.entity';
import { JobAssignment } from './entities/job-assignment.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { ApiPaginatedResponse } from '../common/decorators/api-paginated-response.decorator';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';

@ApiTags('Jobs')
@Controller('jobs')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new job' })
  @ApiResponse({ status: 201, description: 'Job created successfully', type: Job })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async create(@Body() createJobDto: CreateJobDto, @Request() req): Promise<Job> {
    return this.jobsService.create(createJobDto, req.user.organizationId);
  }

  @Get()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Get all jobs with filters and pagination' })
  @ApiPaginatedResponse(Job)
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async findAll(
    @Query() filters: JobFiltersDto,
    @Request() req,
  ): Promise<PaginatedResponseDto<Job>> {
    return this.jobsService.findAllWithFilters(req.user.organizationId, filters);
  }

  @Get('profitability')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get job profitability analytics' })
  @ApiResponse({ status: 200, description: 'Profitability data retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getProfitability(@Request() req) {
    return this.jobsService.getJobProfitability(req.user.organizationId);
  }

  @Get(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Get job by ID' })
  @ApiResponse({ status: 200, description: 'Job retrieved successfully', type: Job })
  @ApiResponse({ status: 404, description: 'Job not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findOne(@Param('id') id: string, @Request() req): Promise<Job> {
    return this.jobsService.findById(id, req.user.organizationId);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update job' })
  @ApiResponse({ status: 200, description: 'Job updated successfully', type: Job })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async update(
    @Param('id') id: string,
    @Body() updateJobDto: UpdateJobDto,
    @Request() req,
  ): Promise<Job> {
    return this.jobsService.update(id, updateJobDto, req.user.organizationId);
  }

  @Patch(':id/status')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Update job status' })
  @ApiResponse({ status: 200, description: 'Job status updated successfully', type: Job })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateJobStatusDto,
    @Request() req,
  ): Promise<Job> {
    return this.jobsService.updateStatus(id, updateStatusDto, req.user.organizationId);
  }

  @Post(':id/assign')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Assign team members to job' })
  @ApiResponse({ status: 200, description: 'Team members assigned successfully', type: [JobAssignment] })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async assignTeamMembers(
    @Param('id') id: string,
    @Body() assignJobDto: AssignJobDto,
    @Request() req,
  ): Promise<JobAssignment[]> {
    return this.jobsService.assignTeamMembers(id, assignJobDto, req.user.organizationId);
  }

  @Get(':id/assignments')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Get job assignments' })
  @ApiResponse({ status: 200, description: 'Job assignments retrieved successfully', type: [JobAssignment] })
  @ApiResponse({ status: 404, description: 'Job not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getAssignments(@Param('id') id: string, @Request() req): Promise<JobAssignment[]> {
    return this.jobsService.getJobAssignments(id, req.user.organizationId);
  }

  @Post(':id/reschedule')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Reschedule job' })
  @ApiResponse({ status: 201, description: 'Job rescheduled successfully', type: Job })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  @ApiResponse({ status: 409, description: 'Scheduling conflict' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async reschedule(
    @Param('id') id: string,
    @Body('scheduled_date') scheduledDate: string,
    @Request() req,
  ): Promise<Job> {
    return this.jobsService.rescheduleJob(id, scheduledDate, req.user.organizationId);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete job' })
  @ApiResponse({ status: 204, description: 'Job deleted successfully' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async remove(@Param('id') id: string, @Request() req): Promise<void> {
    return this.jobsService.delete(id, req.user.organizationId);
  }
}