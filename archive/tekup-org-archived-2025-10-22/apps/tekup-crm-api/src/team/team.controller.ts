import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TeamService } from './team.service';
import { CreateTeamMemberDto } from './dto/create-team-member.dto';
import { UpdateTeamMemberDto } from './dto/update-team-member.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TeamRole, CleaningSkill } from '@prisma/client';

@ApiTags('Team')
@Controller('team')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new team member' })
  @ApiResponse({ status: 201, description: 'Team member created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid Danish phone number or availability structure' })
  @ApiResponse({ status: 403, description: 'Team member with email already exists' })
  async create(@Request() req, @Body() createTeamMemberDto: CreateTeamMemberDto) {
    return this.teamService.create(req.user.tenantId, createTeamMemberDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all team members for tenant' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiQuery({ name: 'role', required: false, enum: TeamRole, description: 'Filter by team role' })
  @ApiResponse({ status: 200, description: 'Team members retrieved successfully' })
  async findAll(
    @Request() req,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('role') role?: TeamRole,
  ) {
    return this.teamService.findAll(req.user.tenantId, page, limit, role);
  }

  @Get('role/:role')
  @ApiOperation({ summary: 'Get team members by role' })
  @ApiResponse({ status: 200, description: 'Team members retrieved successfully' })
  async findByRole(@Request() req, @Param('role') role: TeamRole) {
    return this.teamService.findByRole(req.user.tenantId, role);
  }

  @Get('skill/:skill')
  @ApiOperation({ summary: 'Get team members by skill' })
  @ApiResponse({ status: 200, description: 'Team members retrieved successfully' })
  async findBySkill(@Request() req, @Param('skill') skill: CleaningSkill) {
    return this.teamService.findBySkill(req.user.tenantId, skill);
  }

  @Get('available')
  @ApiOperation({ summary: 'Get available team members for specific date and time' })
  @ApiQuery({ name: 'date', description: 'Date (ISO format)', example: '2025-09-15' })
  @ApiQuery({ name: 'startTime', description: 'Start time (HH:MM)', example: '09:00' })
  @ApiQuery({ name: 'endTime', description: 'End time (HH:MM)', example: '17:00' })
  @ApiQuery({ name: 'skills', required: false, description: 'Required skills (comma-separated)', example: 'BASIC_CLEANING,WINDOW_CLEANING' })
  @ApiResponse({ status: 200, description: 'Available team members retrieved successfully' })
  async getAvailableMembers(
    @Request() req,
    @Query('date') date: string,
    @Query('startTime') startTime: string,
    @Query('endTime') endTime: string,
    @Query('skills') skills?: string,
  ) {
    const skillsArray = skills ? skills.split(',') as CleaningSkill[] : undefined;
    return this.teamService.getAvailableMembers(req.user.tenantId, date, startTime, endTime, skillsArray);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get team statistics' })
  @ApiResponse({ status: 200, description: 'Team statistics retrieved successfully' })
  async getTeamStatistics(@Request() req) {
    return this.teamService.getTeamStatistics(req.user.tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get team member by ID' })
  @ApiResponse({ status: 200, description: 'Team member retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Team member not found' })
  async findOne(@Request() req, @Param('id') id: string) {
    return this.teamService.findOne(req.user.tenantId, id);
  }

  @Get(':id/statistics')
  @ApiOperation({ summary: 'Get team member statistics' })
  @ApiResponse({ status: 200, description: 'Team member statistics retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Team member not found' })
  async getStatistics(@Request() req, @Param('id') id: string) {
    return this.teamService.getStatistics(req.user.tenantId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update team member' })
  @ApiResponse({ status: 200, description: 'Team member updated successfully' })
  @ApiResponse({ status: 404, description: 'Team member not found' })
  @ApiResponse({ status: 400, description: 'Invalid Danish phone number or availability structure' })
  @ApiResponse({ status: 403, description: 'Team member with email already exists' })
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateTeamMemberDto: UpdateTeamMemberDto,
  ) {
    return this.teamService.update(req.user.tenantId, id, updateTeamMemberDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete team member (soft delete)' })
  @ApiResponse({ status: 200, description: 'Team member deleted successfully' })
  @ApiResponse({ status: 404, description: 'Team member not found' })
  async remove(@Request() req, @Param('id') id: string) {
    return this.teamService.remove(req.user.tenantId, id);
  }
}
