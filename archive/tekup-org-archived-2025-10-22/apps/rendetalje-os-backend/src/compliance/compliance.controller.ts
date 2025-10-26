import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard as TekUpAuthGuard, CurrentUser, CurrentTenant } from '../auth/auth.guard';
import { DanishEmploymentComplianceService, DateRange } from './danish-employment-compliance.service';

@ApiTags('compliance')
@ApiBearerAuth()
@UseGuards(TekUpAuthGuard)
@Controller('compliance')
export class ComplianceController {
  constructor(private readonly complianceService: DanishEmploymentComplianceService) {}

  @Get('working-time/:teamId')
  @ApiOperation({ summary: 'Monitor working time compliance for team' })
  async getWorkingTimeCompliance(
    @Param('teamId') teamId: string,
    @Body() period: DateRange,
    @CurrentTenant() tenant: any
  ) {
    return this.complianceService.monitorWorkingTimeCompliance(teamId, period);
  }

  @Post('break-schedule')
  @ApiOperation({ summary: 'Generate mandatory break schedule' })
  async generateBreakSchedule(
    @Body() workSchedule: any,
    @CurrentTenant() tenant: any
  ) {
    return this.complianceService.generateMandatoryBreakSchedule(workSchedule);
  }

  @Get('overtime/:employeeId')
  @ApiOperation({ summary: 'Calculate overtime compensation' })
  async calculateOvertime(
    @Param('employeeId') employeeId: string,
    @Body() period: DateRange,
    @CurrentTenant() tenant: any
  ) {
    return this.complianceService.calculateOvertimeCompensation(employeeId, period);
  }

  @Get('documentation/:employeeId')
  @ApiOperation({ summary: 'Generate employment documentation' })
  async getEmploymentDocumentation(
    @Param('employeeId') employeeId: string,
    @CurrentTenant() tenant: any
  ) {
    return this.complianceService.generateEmploymentDocumentation(employeeId);
  }

  @Get('health-safety/:teamId')
  @ApiOperation({ summary: 'Monitor health & safety compliance' })
  async getHealthSafetyCompliance(
    @Param('teamId') teamId: string,
    @CurrentTenant() tenant: any
  ) {
    return this.complianceService.monitorHealthSafetyCompliance(teamId);
  }
}
