import { Controller, Post, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard as TekUpAuthGuard, CurrentUser, CurrentTenant } from '../auth/auth.guard';
import { DanishRouteOptimizationService } from './danish-route-optimization.service';
import { RouteOptimizationRequest, SchedulingRequest } from './types';

@ApiTags('scheduling')
@ApiBearerAuth()
@UseGuards(TekUpAuthGuard)
@Controller('scheduling')
export class SchedulingController {
  constructor(private readonly schedulingService: DanishRouteOptimizationService) {}

  @Post('routes/optimize')
  @ApiOperation({ summary: 'Optimize cleaning routes with Danish geography and traffic' })
  async optimizeRoutes(
    @Body() request: RouteOptimizationRequest,
    @CurrentTenant() tenant: any
  ) {
    return this.schedulingService.optimizeRoutes(request);
  }

  @Post('jobs/schedule')
  @ApiOperation({ summary: 'Schedule cleaning jobs with Danish employment compliance' })
  async scheduleJobs(
    @Body() request: SchedulingRequest,
    @CurrentTenant() tenant: any
  ) {
    return this.schedulingService.scheduleCleaningJobs(request);
  }

  @Patch('jobs/:jobId/progress')
  @ApiOperation({ summary: 'Update job progress and adjust subsequent schedules' })
  async updateJobProgress(
    @Param('jobId') jobId: string,
    @Body() update: any,
    @CurrentTenant() tenant: any
  ) {
    return this.schedulingService.updateJobProgress(jobId, update);
  }
}
