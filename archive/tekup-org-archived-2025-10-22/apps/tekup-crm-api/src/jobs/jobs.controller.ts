import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CleaningJobType, JobStatus } from '@prisma/client';

@ApiTags('Jobs')
@Controller('jobs')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new cleaning job' })
  @ApiResponse({ status: 201, description: 'Job created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid data or Danish holiday conflict' })
  @ApiResponse({ status: 404, description: 'Customer or location not found' })
  async create(@Request() req, @Body() createJobDto: CreateJobDto) {
    return this.jobsService.create(req.user.tenantId, createJobDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all jobs for tenant' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiQuery({ name: 'status', required: false, enum: JobStatus, description: 'Filter by job status' })
  @ApiQuery({ name: 'jobType', required: false, enum: CleaningJobType, description: 'Filter by job type' })
  @ApiResponse({ status: 200, description: 'Jobs retrieved successfully' })
  async findAll(
    @Request() req,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: JobStatus,
    @Query('jobType') jobType?: CleaningJobType,
  ) {
    return this.jobsService.findAll(req.user.tenantId, page, limit, status, jobType);
  }

  @Get('status/:status')
  @ApiOperation({ summary: 'Get jobs by status' })
  @ApiResponse({ status: 200, description: 'Jobs retrieved successfully' })
  async findByStatus(@Request() req, @Param('status') status: JobStatus) {
    return this.jobsService.findByStatus(req.user.tenantId, status);
  }

  @Get('customer/:customerId')
  @ApiOperation({ summary: 'Get jobs by customer' })
  @ApiResponse({ status: 200, description: 'Jobs retrieved successfully' })
  async findByCustomer(@Request() req, @Param('customerId') customerId: string) {
    return this.jobsService.findByCustomer(req.user.tenantId, customerId);
  }

  @Get('date-range')
  @ApiOperation({ summary: 'Get jobs by date range' })
  @ApiQuery({ name: 'startDate', description: 'Start date (ISO format)', example: '2025-01-01' })
  @ApiQuery({ name: 'endDate', description: 'End date (ISO format)', example: '2025-01-31' })
  @ApiResponse({ status: 200, description: 'Jobs retrieved successfully' })
  async findByDateRange(
    @Request() req,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.jobsService.findByDateRange(req.user.tenantId, startDate, endDate);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get job statistics' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date for statistics (ISO format)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date for statistics (ISO format)' })
  @ApiResponse({ status: 200, description: 'Job statistics retrieved successfully' })
  async getStatistics(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.jobsService.getStatistics(req.user.tenantId, startDate, endDate);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get job by ID' })
  @ApiResponse({ status: 200, description: 'Job retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async findOne(@Request() req, @Param('id') id: string) {
    return this.jobsService.findOne(req.user.tenantId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update job' })
  @ApiResponse({ status: 200, description: 'Job updated successfully' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  @ApiResponse({ status: 400, description: 'Invalid data or Danish holiday conflict' })
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateJobDto: UpdateJobDto,
  ) {
    return this.jobsService.update(req.user.tenantId, id, updateJobDto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update job status' })
  @ApiResponse({ status: 200, description: 'Job status updated successfully' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async updateStatus(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { status: JobStatus; completedAt?: string },
  ) {
    const completedAt = body.completedAt ? new Date(body.completedAt) : undefined;
    return this.jobsService.updateStatus(req.user.tenantId, id, body.status, completedAt);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete job (soft delete - sets status to CANCELLED)' })
  @ApiResponse({ status: 200, description: 'Job deleted successfully' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async remove(@Request() req, @Param('id') id: string) {
    return this.jobsService.remove(req.user.tenantId, id);
  }
}
