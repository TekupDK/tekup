import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TekUpAuthGuard, CurrentUser, CurrentTenant } from '@tekup/sso';
import { DanishFoodSafetyService } from './danish-food-safety.service';

@ApiTags('compliance')
@ApiBearerAuth()
@UseGuards(TekUpAuthGuard)
@Controller('compliance')
export class ComplianceController {
  constructor(private readonly complianceService: DanishFoodSafetyService) {}

  @Post('register/:truckId')
  @ApiOperation({ summary: 'Register food truck with Danish food safety authorities' })
  async registerTruck(
    @Param('truckId') truckId: string,
    @CurrentTenant() tenant: any
  ) {
    return this.complianceService.registerWithFoodSafetyAuthority(truckId);
  }

  @Get('haccp-plan/:truckId')
  @ApiOperation({ summary: 'Generate HACCP plan for food truck' })
  async getHACCPPlan(
    @Param('truckId') truckId: string,
    @CurrentTenant() tenant: any
  ) {
    return this.complianceService.generateHACCPPlan(truckId);
  }

  @Post('temperature-log/:truckId')
  @ApiOperation({ summary: 'Log temperature reading' })
  async logTemperature(
    @Param('truckId') truckId: string,
    @Body() tempData: { temperature: number; location: string },
    @CurrentTenant() tenant: any
  ) {
    return this.complianceService.logTemperature(
      truckId, 
      tempData.temperature, 
      tempData.location
    );
  }

  @Get('reports/:truckId/daily/:date')
  @ApiOperation({ summary: 'Generate daily compliance report' })
  async getDailyReport(
    @Param('truckId') truckId: string,
    @Param('date') date: string,
    @CurrentTenant() tenant: any
  ) {
    return this.complianceService.generateDailyComplianceReport(truckId, new Date(date));
  }
}
