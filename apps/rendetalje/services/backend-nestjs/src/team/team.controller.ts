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
import { ApiPaginatedResponse } from '../common/decorators/api-paginated-response.decorator';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';

@ApiTags('Team')
@Controller('team')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  // ==================== Team Member Management ====================

  @Post('members')
  @ApiOperation({ summary: 'Create a new team member' })
  @ApiResponse({ status: 201, description: 'Team member created successfully', type: TeamMember })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createMember(@Body() createTeamMemberDto: CreateTeamMemberDto): Promise<TeamMember> {
    return this.teamService.create(createTeamMemberDto);
  }

  @Get('members')
  @ApiOperation({ summary: 'Get all team members with filters and pagination' })
  @ApiPaginatedResponse(TeamMember)
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAllMembers(
    @Query() filters: TeamFiltersDto,
  ): Promise<PaginatedResponseDto<TeamMember>> {
    return this.teamService.findAllWithFilters(filters);
  }

  @Get('members/:id')
  @ApiOperation({ summary: 'Get team member by ID' })
  @ApiResponse({ status: 200, description: 'Team member retrieved successfully', type: TeamMember })
  @ApiResponse({ status: 404, description: 'Team member not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findMemberById(@Param('id') id: string): Promise<TeamMember> {
    return this.teamService.findById(id);
  }

  @Patch('members/:id')
  @ApiOperation({ summary: 'Update team member' })
  @ApiResponse({ status: 200, description: 'Team member updated successfully', type: TeamMember })
  @ApiResponse({ status: 404, description: 'Team member not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateMember(
    @Param('id') id: string,
    @Body() updateTeamMemberDto: UpdateTeamMemberDto,
  ): Promise<TeamMember> {
    return this.teamService.update(id, updateTeamMemberDto);
  }

  @Post('members/:id/deactivate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate team member' })
  @ApiResponse({ status: 200, description: 'Team member deactivated successfully', type: TeamMember })
  @ApiResponse({ status: 404, description: 'Team member not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deactivateMember(@Param('id') id: string): Promise<TeamMember> {
    return this.teamService.deactivate(id);
  }

  @Post('members/:id/activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activate team member' })
  @ApiResponse({ status: 200, description: 'Team member activated successfully', type: TeamMember })
  @ApiResponse({ status: 404, description: 'Team member not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async activateMember(@Param('id') id: string): Promise<TeamMember> {
    return this.teamService.activate(id);
  }

  @Delete('members/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete team member' })
  @ApiResponse({ status: 204, description: 'Team member deleted successfully' })
  @ApiResponse({ status: 404, description: 'Team member not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async removeMember(@Param('id') id: string): Promise<void> {
    return this.teamService.remove(id);
  }

  // ==================== Schedule Management ====================

  @Get('members/:id/schedule')
  @ApiOperation({ summary: 'Get team member schedule' })
  @ApiResponse({ status: 200, description: 'Team member schedule retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Team member not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMemberSchedule(
    @Param('id') id: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ): Promise<any[]> {
    return this.teamService.getTeamMemberSchedule(id, dateFrom, dateTo);
  }

  // ==================== Performance Management ====================

  @Get('members/:id/performance')
  @ApiOperation({ summary: 'Get team member performance metrics' })
  @ApiResponse({ status: 200, description: 'Team member performance metrics retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Team member not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMemberPerformance(@Param('id') id: string): Promise<any> {
    return this.teamService.getTeamMemberPerformance(id);
  }

  // ==================== Time Entry Management ====================

  @Post('time-entries')
  @ApiOperation({ summary: 'Create a new time entry' })
  @ApiResponse({ status: 201, description: 'Time entry created successfully', type: TimeEntry })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createTimeEntry(@Body() createTimeEntryDto: CreateTimeEntryDto): Promise<TimeEntry> {
    return this.teamService.createTimeEntry(createTimeEntryDto);
  }

  @Get('time-entries')
  @ApiOperation({ summary: 'Get all time entries with filters and pagination' })
  @ApiPaginatedResponse(TimeEntry)
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAllTimeEntries(
    @Query() filters: TimeEntryFiltersDto,
  ): Promise<PaginatedResponseDto<TimeEntry>> {
    return this.teamService.findTimeEntries(filters);
  }

  @Get('time-entries/:id')
  @ApiOperation({ summary: 'Get time entry by ID' })
  @ApiResponse({ status: 200, description: 'Time entry retrieved successfully', type: TimeEntry })
  @ApiResponse({ status: 404, description: 'Time entry not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findTimeEntryById(@Param('id') id: string): Promise<TimeEntry> {
    return this.teamService.findTimeEntryById(id);
  }

  @Patch('time-entries/:id')
  @ApiOperation({ summary: 'Update time entry' })
  @ApiResponse({ status: 200, description: 'Time entry updated successfully', type: TimeEntry })
  @ApiResponse({ status: 404, description: 'Time entry not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateTimeEntry(
    @Param('id') id: string,
    @Body() updateTimeEntryDto: UpdateTimeEntryDto,
  ): Promise<TimeEntry> {
    return this.teamService.updateTimeEntry(id, updateTimeEntryDto);
  }

  @Delete('time-entries/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete time entry' })
  @ApiResponse({ status: 204, description: 'Time entry deleted successfully' })
  @ApiResponse({ status: 404, description: 'Time entry not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteTimeEntry(@Param('id') id: string): Promise<void> {
    return this.teamService.deleteTimeEntry(id);
  }
}
