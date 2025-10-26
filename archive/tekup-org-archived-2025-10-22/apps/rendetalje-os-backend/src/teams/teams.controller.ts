import { Controller, Post, Get, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard as TekUpAuthGuard, CurrentUser, CurrentTenant } from '../auth/auth.guard';
import { TeamsService, CreateTeamDto, UpdateTeamDto, CreateEmployeeDto } from './teams.service';

@ApiTags('teams')
@ApiBearerAuth()
@UseGuards(TekUpAuthGuard)
@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post()
  @ApiOperation({ summary: 'Create new cleaning team' })
  async createTeam(
    @Body() data: CreateTeamDto,
    @CurrentTenant() tenant: any
  ) {
    return this.teamsService.createTeam(data);
  }

  @Get()
  @ApiOperation({ summary: 'Get all cleaning teams' })
  async getTeams(@CurrentTenant() tenant: any) {
    return this.teamsService.getTeams();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get team by ID with members and equipment' })
  async getTeamById(
    @Param('id') id: string,
    @CurrentTenant() tenant: any
  ) {
    return this.teamsService.getTeamById(id);
  }

  @Post(':teamId/members')
  @ApiOperation({ summary: 'Add member to cleaning team' })
  async addTeamMember(
    @Param('teamId') teamId: string,
    @Body() memberData: CreateEmployeeDto,
    @CurrentTenant() tenant: any
  ) {
    return this.teamsService.addTeamMember(teamId, memberData);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update cleaning team' })
  async updateTeam(
    @Param('id') id: string,
    @Body() data: UpdateTeamDto,
    @CurrentTenant() tenant: any
  ) {
    return this.teamsService.updateTeam(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete cleaning team' })
  async deleteTeam(
    @Param('id') id: string,
    @CurrentTenant() tenant: any
  ) {
    return this.teamsService.deleteTeam(id);
  }
}
