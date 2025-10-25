import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TimeTrackingService } from './time-tracking.service';
import { CreateTimeCorrectionDto } from './dto/create-time-correction.dto';
import { TimeCorrection } from './entities/time-correction.entity';

@ApiTags('time-tracking')
@Controller('time-tracking')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TimeTrackingController {
  constructor(private readonly timeTrackingService: TimeTrackingService) {}

  @Get('corrections')
  @ApiOperation({ summary: 'Get time corrections with filters' })
  @ApiResponse({ status: 200, description: 'List of time corrections', type: [TimeCorrection] })
  @ApiQuery({ name: 'employeeId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['pending', 'approved', 'rejected'] })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async getCorrections(
    @Query('employeeId') employeeId?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<TimeCorrection[]> {
    return this.timeTrackingService.getCorrections(employeeId, status, startDate, endDate);
  }

  @Get('corrections/:id')
  @ApiOperation({ summary: 'Get a time correction by ID' })
  @ApiResponse({ status: 200, description: 'Time correction details', type: TimeCorrection })
  @ApiResponse({ status: 404, description: 'Time correction not found' })
  async getCorrectionById(@Param('id') id: string): Promise<TimeCorrection> {
    return this.timeTrackingService.getCorrectionById(id);
  }

  @Post('corrections')
  @ApiOperation({ summary: 'Create a time correction request' })
  @ApiResponse({ status: 201, description: 'Time correction created', type: TimeCorrection })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Original time entry not found' })
  async createCorrection(
    @Request() req: any,
    @Body() dto: CreateTimeCorrectionDto,
  ): Promise<TimeCorrection> {
    return this.timeTrackingService.createCorrection(dto, req.user.id);
  }

  @Post('corrections/:id/approve')
  @ApiOperation({ summary: 'Approve a time correction (managers only)' })
  @ApiResponse({ status: 200, description: 'Time correction approved', type: TimeCorrection })
  @ApiResponse({ status: 400, description: 'Only pending corrections can be approved' })
  @ApiResponse({ status: 404, description: 'Time correction not found' })
  async approveCorrection(
    @Request() req: any,
    @Param('id') id: string,
  ): Promise<TimeCorrection> {
    return this.timeTrackingService.approveCorrection(id, req.user.id);
  }

  @Post('corrections/:id/reject')
  @ApiOperation({ summary: 'Reject a time correction (managers only)' })
  @ApiResponse({ status: 200, description: 'Time correction rejected', type: TimeCorrection })
  @ApiResponse({ status: 400, description: 'Only pending corrections can be rejected' })
  @ApiResponse({ status: 404, description: 'Time correction not found' })
  async rejectCorrection(
    @Request() req: any,
    @Param('id') id: string,
    @Body('rejectionReason') rejectionReason: string,
  ): Promise<TimeCorrection> {
    return this.timeTrackingService.rejectCorrection(id, rejectionReason, req.user.id);
  }

  @Get('overtime-report')
  @ApiOperation({ summary: 'Get overtime report for a date range' })
  @ApiResponse({ status: 200, description: 'Overtime report' })
  @ApiQuery({ name: 'startDate', required: true, type: String, example: '2025-01-01' })
  @ApiQuery({ name: 'endDate', required: true, type: String, example: '2025-01-31' })
  async getOvertimeReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<any> {
    return this.timeTrackingService.getOvertimeReport(startDate, endDate);
  }
}
