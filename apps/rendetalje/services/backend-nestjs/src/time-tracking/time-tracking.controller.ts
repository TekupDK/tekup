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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TimeTrackingService } from './time-tracking.service';
import { 
  CreateTimeEntryDto, 
  UpdateTimeEntryDto, 
  CreateTimeCorrectionDto,
  TimeEntryFiltersDto 
} from './dto';
import { TimeEntry } from './entities/time-entry.entity';
import { TimeCorrection } from './entities/time-correction.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { ApiPaginatedResponse } from '../common/decorators/api-paginated-response.decorator';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';

@ApiTags('Time Tracking')
@Controller('time-entries')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TimeTrackingController {
  constructor(private readonly timeTrackingService: TimeTrackingService) {}

  @Post()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Start a new time entry' })
  @ApiResponse({ status: 201, description: 'Time entry created successfully', type: TimeEntry })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(@Body() createTimeEntryDto: CreateTimeEntryDto, @Request() req): Promise<TimeEntry> {
    return this.timeTrackingService.create(createTimeEntryDto, req.user.organizationId);
  }

  @Get()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Get time entries with filters' })
  @ApiPaginatedResponse(TimeEntry)
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(
    @Query() filters: TimeEntryFiltersDto,
    @Request() req,
  ): Promise<PaginatedResponseDto<TimeEntry>> {
    return this.timeTrackingService.findAllWithFilters(req.user.organizationId, filters);
  }

  @Get('daily-summary')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Get daily time summary for employee' })
  @ApiResponse({ status: 200, description: 'Daily summary retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getDailySummary(
    @Query('employee_id') employeeId: string,
    @Query('date') date: string,
    @Request() req,
  ) {
    return this.timeTrackingService.getDailySummary(employeeId, date, req.user.organizationId);
  }

  @Get('overtime-report')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get overtime report' })
  @ApiResponse({ status: 200, description: 'Overtime report retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getOvertimeReport(
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
    @Request() req,
  ) {
    return this.timeTrackingService.getOvertimeReport(startDate, endDate, req.user.organizationId);
  }

  @Get(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Get time entry by ID' })
  @ApiResponse({ status: 200, description: 'Time entry retrieved successfully', type: TimeEntry })
  @ApiResponse({ status: 404, description: 'Time entry not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findOne(@Param('id') id: string, @Request() req): Promise<TimeEntry> {
    return this.timeTrackingService.findById(id, req.user.organizationId);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Update time entry' })
  @ApiResponse({ status: 200, description: 'Time entry updated successfully', type: TimeEntry })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Time entry not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async update(
    @Param('id') id: string,
    @Body() updateTimeEntryDto: UpdateTimeEntryDto,
    @Request() req,
  ): Promise<TimeEntry> {
    return this.timeTrackingService.update(id, updateTimeEntryDto, req.user.organizationId);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete time entry' })
  @ApiResponse({ status: 204, description: 'Time entry deleted successfully' })
  @ApiResponse({ status: 404, description: 'Time entry not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async remove(@Param('id') id: string, @Request() req): Promise<void> {
    return this.timeTrackingService.delete(id, req.user.organizationId);
  }
}

@ApiTags('Time Corrections')
@Controller('time-corrections')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TimeCorrectionsController {
  constructor(private readonly timeTrackingService: TimeTrackingService) {}

  @Post()
  @Roles(UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Submit time entry correction' })
  @ApiResponse({ status: 201, description: 'Time correction submitted successfully', type: TimeCorrection })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(@Body() createTimeCorrectionDto: CreateTimeCorrectionDto, @Request() req): Promise<TimeCorrection> {
    return this.timeTrackingService.createCorrection(createTimeCorrectionDto, req.user.organizationId, req.user.id);
  }

  @Get()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Get time corrections' })
  @ApiResponse({ status: 200, description: 'Time corrections retrieved successfully', type: [TimeCorrection] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(
    @Query('employee_id') employeeId?: string,
    @Query('status') status?: string,
    @Query('date') date?: string,
    @Request() req = {},
  ): Promise<TimeCorrection[]> {
    return this.timeTrackingService.getCorrections(req.user.organizationId, employeeId, status, date);
  }

  @Patch(':id/approve')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Approve time correction' })
  @ApiResponse({ status: 200, description: 'Time correction approved successfully', type: TimeCorrection })
  @ApiResponse({ status: 404, description: 'Time correction not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async approve(@Param('id') id: string, @Request() req): Promise<TimeCorrection> {
    return this.timeTrackingService.approveCorrection(id, req.user.organizationId, req.user.id);
  }

  @Patch(':id/reject')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Reject time correction' })
  @ApiResponse({ status: 200, description: 'Time correction rejected successfully', type: TimeCorrection })
  @ApiResponse({ status: 404, description: 'Time correction not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async reject(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Request() req,
  ): Promise<TimeCorrection> {
    return this.timeTrackingService.rejectCorrection(id, reason, req.user.organizationId, req.user.id);
  }
}