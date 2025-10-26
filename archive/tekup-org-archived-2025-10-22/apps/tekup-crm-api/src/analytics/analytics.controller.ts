import { Controller, Get, UseGuards, Query, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get comprehensive dashboard metrics' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (ISO format)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (ISO format)' })
  @ApiResponse({ status: 200, description: 'Dashboard metrics retrieved successfully' })
  async getDashboardMetrics(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.analyticsService.getDashboardMetrics(req.user.tenantId, startDate, endDate);
  }

  @Get('revenue')
  @ApiOperation({ summary: 'Get revenue analytics' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (ISO format)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (ISO format)' })
  @ApiResponse({ status: 200, description: 'Revenue analytics retrieved successfully' })
  async getRevenueAnalytics(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.analyticsService.getRevenueAnalytics(req.user.tenantId, startDate, endDate);
  }

  @Get('performance')
  @ApiOperation({ summary: 'Get performance analytics' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (ISO format)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (ISO format)' })
  @ApiResponse({ status: 200, description: 'Performance analytics retrieved successfully' })
  async getPerformanceAnalytics(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.analyticsService.getPerformanceAnalytics(req.user.tenantId, startDate, endDate);
  }

  @Get('jobs/by-type')
  @ApiOperation({ summary: 'Get job analytics by type' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (ISO format)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (ISO format)' })
  @ApiResponse({ status: 200, description: 'Job analytics by type retrieved successfully' })
  async getJobAnalyticsByType(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.analyticsService.getJobAnalyticsByType(req.user.tenantId, startDate, endDate);
  }

  @Get('team/performance')
  @ApiOperation({ summary: 'Get team performance analytics' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (ISO format)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (ISO format)' })
  @ApiResponse({ status: 200, description: 'Team performance analytics retrieved successfully' })
  async getTeamPerformanceAnalytics(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.analyticsService.getTeamPerformanceAnalytics(req.user.tenantId, startDate, endDate);
  }

  @Get('customers')
  @ApiOperation({ summary: 'Get customer analytics' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (ISO format)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (ISO format)' })
  @ApiResponse({ status: 200, description: 'Customer analytics retrieved successfully' })
  async getCustomerAnalytics(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.analyticsService.getCustomerAnalytics(req.user.tenantId, startDate, endDate);
  }
}
