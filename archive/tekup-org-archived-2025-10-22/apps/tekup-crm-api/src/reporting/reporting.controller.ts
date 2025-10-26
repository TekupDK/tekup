import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ReportingService } from './reporting.service';
import { JwtAuthGuard } from '@tekup/auth';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportingController {
  constructor(private readonly reportingService: ReportingService) {}

  @Get('sales-performance')
  getSalesPerformance(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();
    
    // In a real implementation, we would get tenantId from the authenticated user
    return this.reportingService.getSalesPerformanceReport('tenant-id', start, end);
  }

  @Get('deal-conversion')
  getDealConversion() {
    // In a real implementation, we would get tenantId from the authenticated user
    return this.reportingService.getDealConversionReport('tenant-id');
  }

  @Get('activity-completion')
  getActivityCompletion(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();
    
    // In a real implementation, we would get tenantId from the authenticated user
    return this.reportingService.getActivityCompletionReport('tenant-id', start, end);
  }
}