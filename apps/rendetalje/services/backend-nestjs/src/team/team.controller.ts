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
import { TeamService } from './team.service';
import { 
  CreateTeamMemberDto, 
  UpdateTeamMemberDto, 
  CreateTimeEntryDto, 
  UpdateTimeEntryDto,
  TeamFiltersDto,
  TimeEntryFiltersDto
} from './dto';
import { TeamMember } from './entities/team-member.entity';
import { TimeEntry } from './entities/time-entry.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { ApiPaginatedResponse } from '../common/decorators/api-paginated-response.decorator';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';

@ApiTags('Team')
@Controller('team')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  // Team Member Management
  @Post('members')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new team member' })
  @ApiResponse({ status: 201, description: 'Team member created successfully', type: TeamMember })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async createMember(@Body() createTeamMemberDto: CreateTeamMemberDto, @Request() req): Promise<TeamMember> {
    return this.teamService.create(createTeamMemberDto, req.user.organizationId);
  }

  @Get('members')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Get all team members with filters and pagination' })
  @ApiPaginatedResponse(TeamMember)
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async findAllMembers(
    @Query() filters: TeamFiltersDto,
    @Request() req,
  ): Promise<PaginatedResponseDto<TeamMember>> {
    return this.teamService.findAllWithFilters(req.user.organizationId, filters);
  }

  @Get('performance-report')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get team performance report' })
  @ApiResponse({ status: 200, description: 'Team performance report retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getPerformanceReport(@Request() req) {
    return this.teamService.getTeamPerformanceReport(req.user.organizationId);
  }

  @Get('members/:id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Get team member by ID' })
  @ApiResponse({ status: 200, description: 'Team member retrieved successfully', type: TeamMember })
  @ApiResponse({ status: 404, description: 'Team member not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findOneMember(@Param('id') id: string, @Request() req): Promise<TeamMember> {
    return this.teamService.findById(id, req.user.organizationId);
  }

  @Get('members/:id/schedule')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Get team member schedule' })
  @ApiResponse({ status: 200, description: 'Team member schedule retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Team member not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMemberSchedule(
    @Param('id') id: string,
    @Query('date_from') dateFrom: string,
    @Query('date_to') dateTo: string,
    @Request() req,
  ) {
    return this.teamService.getTeamMemberSchedule(id, req.user.organizationId, dateFrom, dateTo);
  }

  @Get('members/:id/performance')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Get team member performance metrics' })
  @ApiResponse({ status: 200, description: 'Team member performance retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Team member not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMemberPerformance(@Param('id') id: string, @Request() req) {
    return this.teamService.getTeamMemberPerformance(id, req.user.organizationId);
  }

  @Patch('members/:id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update team member' })
  @ApiResponse({ status: 200, description: 'Team member updated successfully', type: TeamMember })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Team member not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async updateMember(
    @Param('id') id: string,
    @Body() updateTeamMemberDto: UpdateTeamMemberDto,
    @Request() req,
  ): Promise<TeamMember> {
    return this.teamService.update(id, updateTeamMemberDto, req.user.organizationId);
  }

  @Delete('members/:id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete team member' })
  @ApiResponse({ status: 204, description: 'Team member deleted successfully' })
  @ApiResponse({ status: 404, description: 'Team member not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async removeMember(@Param('id') id: string, @Request() req): Promise<void> {
    return this.teamService.delete(id, req.user.organizationId);
  }

  // Time Entry Management
  @Post('time-entries')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Create a new time entry' })
  @ApiResponse({ status: 201, description: 'Time entry created successfully', type: TimeEntry })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async createTimeEntry(@Body() createTimeEntryDto: CreateTimeEntryDto, @Request() req): Promise<TimeEntry> {
    return this.teamService.createTimeEntry(createTimeEntryDto, req.user.organizationId);
  }

  @Get('time-entries')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Get all time entries with filters and pagination' })
  @ApiPaginatedResponse(TimeEntry)
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async findAllTimeEntries(
    @Query() filters: TimeEntryFiltersDto,
    @Request() req,
  ): Promise<PaginatedResponseDto<TimeEntry>> {
    return this.teamService.findTimeEntries(req.user.organizationId, filters);
  }

  @Patch('time-entries/:id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Update time entry' })
  @ApiResponse({ status: 200, description: 'Time entry updated successfully', type: TimeEntry })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Time entry not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async updateTimeEntry(
    @Param('id') id: string,
    @Body() updateTimeEntryDto: UpdateTimeEntryDto,
    @Request() req,
  ): Promise<TimeEntry> {
    return this.teamService.updateTimeEntry(id, updateTimeEntryDto, req.user.organizationId);
  }

  @Delete('time-entries/:id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EMPLOYEE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete time entry' })
  @ApiResponse({ status: 204, description: 'Time entry deleted successfully' })
  @ApiResponse({ status: 404, description: 'Time entry not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async removeTimeEntry(@Param('id') id: string, @Request() req): Promise<void> {
    return this.teamService.deleteTimeEntry(id, req.user.organizationId);
  }
}