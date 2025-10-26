import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { RoutesService } from './routes.service';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';
import { OptimizeRouteDto } from './dto/optimize-route.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RouteStatus } from '@prisma/client';

@ApiTags('Routes')
@Controller('routes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RoutesController {
  constructor(private readonly routesService: RoutesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new route' })
  @ApiResponse({ status: 201, description: 'Route created successfully' })
  @ApiResponse({ status: 400, description: 'One or more jobs not found' })
  @ApiResponse({ status: 404, description: 'Team member not found' })
  async create(@Request() req, @Body() createRouteDto: CreateRouteDto) {
    return this.routesService.create(req.user.tenantId, createRouteDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all routes for tenant' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiQuery({ name: 'status', required: false, enum: RouteStatus, description: 'Filter by route status' })
  @ApiResponse({ status: 200, description: 'Routes retrieved successfully' })
  async findAll(
    @Request() req,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: RouteStatus,
  ) {
    return this.routesService.findAll(req.user.tenantId, page, limit, status);
  }

  @Get('team-member/:teamMemberId')
  @ApiOperation({ summary: 'Get routes by team member' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (ISO format)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (ISO format)' })
  @ApiResponse({ status: 200, description: 'Routes retrieved successfully' })
  async getTeamMemberRoutes(
    @Request() req,
    @Param('teamMemberId') teamMemberId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.routesService.getTeamMemberRoutes(req.user.tenantId, teamMemberId, startDate, endDate);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get route statistics' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date for statistics (ISO format)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date for statistics (ISO format)' })
  @ApiResponse({ status: 200, description: 'Route statistics retrieved successfully' })
  async getRouteStatistics(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.routesService.getRouteStatistics(req.user.tenantId, startDate, endDate);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get route by ID' })
  @ApiResponse({ status: 200, description: 'Route retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Route not found' })
  async findOne(@Request() req, @Param('id') id: string) {
    return this.routesService.findOne(req.user.tenantId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update route' })
  @ApiResponse({ status: 200, description: 'Route updated successfully' })
  @ApiResponse({ status: 404, description: 'Route not found' })
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateRouteDto: UpdateRouteDto,
  ) {
    return this.routesService.update(req.user.tenantId, id, updateRouteDto);
  }

  @Post(':id/optimize')
  @ApiOperation({ summary: 'Optimize route' })
  @ApiResponse({ status: 200, description: 'Route optimized successfully' })
  @ApiResponse({ status: 400, description: 'Can only optimize planned routes' })
  @ApiResponse({ status: 404, description: 'Route not found' })
  async optimize(
    @Request() req,
    @Param('id') id: string,
    @Body() optimizeRouteDto: OptimizeRouteDto,
  ) {
    return this.routesService.optimize(req.user.tenantId, { ...optimizeRouteDto, routeId: id });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete route' })
  @ApiResponse({ status: 200, description: 'Route deleted successfully' })
  @ApiResponse({ status: 404, description: 'Route not found' })
  async remove(@Request() req, @Param('id') id: string) {
    return this.routesService.remove(req.user.tenantId, id);
  }
}
