import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JobTeamMembersService } from './job-team-members.service';
import { AssignTeamMemberDto } from './dto/assign-team-member.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('Job Team Members')
@Controller('jobs/:jobId/team-members')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class JobTeamMembersController {
  constructor(private readonly jobTeamMembersService: JobTeamMembersService) {}

  @Post('assign')
  @ApiOperation({ summary: 'Assign team member to job' })
  @ApiResponse({ status: 201, description: 'Team member assigned successfully' })
  @ApiResponse({ status: 400, description: 'Team member already assigned to job' })
  @ApiResponse({ status: 404, description: 'Job or team member not found' })
  async assign(
    @Request() req,
    @Param('jobId') jobId: string,
    @Body() assignDto: AssignTeamMemberDto,
  ) {
    return this.jobTeamMembersService.assign(req.user.tenantId, jobId, assignDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all team members assigned to job' })
  @ApiResponse({ status: 200, description: 'Team members retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async getJobTeamMembers(@Request() req, @Param('jobId') jobId: string) {
    return this.jobTeamMembersService.getJobTeamMembers(req.user.tenantId, jobId);
  }

  @Patch(':teamMemberId/role')
  @ApiOperation({ summary: 'Update team member role in job' })
  @ApiResponse({ status: 200, description: 'Role updated successfully' })
  @ApiResponse({ status: 404, description: 'Job or assignment not found' })
  async updateRole(
    @Request() req,
    @Param('jobId') jobId: string,
    @Param('teamMemberId') teamMemberId: string,
    @Body() body: { role: string },
  ) {
    return this.jobTeamMembersService.updateRole(req.user.tenantId, jobId, teamMemberId, body.role);
  }

  @Delete(':teamMemberId')
  @ApiOperation({ summary: 'Remove team member from job' })
  @ApiResponse({ status: 200, description: 'Team member removed successfully' })
  @ApiResponse({ status: 404, description: 'Job or assignment not found' })
  async unassign(
    @Request() req,
    @Param('jobId') jobId: string,
    @Param('teamMemberId') teamMemberId: string,
  ) {
    return this.jobTeamMembersService.unassign(req.user.tenantId, jobId, teamMemberId);
  }
}

@ApiTags('Team Member Jobs')
@Controller('team-members/:teamMemberId/jobs')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TeamMemberJobsController {
  constructor(private readonly jobTeamMembersService: JobTeamMembersService) {}

  @Get()
  @ApiOperation({ summary: 'Get jobs for team member' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (ISO format)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (ISO format)' })
  @ApiResponse({ status: 200, description: 'Jobs retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Team member not found' })
  async getTeamMemberJobs(
    @Request() req,
    @Param('teamMemberId') teamMemberId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.jobTeamMembersService.getTeamMemberJobs(req.user.tenantId, teamMemberId, startDate, endDate);
  }
}
