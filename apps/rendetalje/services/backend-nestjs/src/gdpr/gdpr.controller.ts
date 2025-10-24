import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { GdprService } from './gdpr.service';
import { DataExportRequest } from './entities/data-export-request.entity';
import { DataDeletionRequest } from './entities/data-deletion-request.entity';
import { ConsentRecord } from './entities/consent-record.entity';
import { RequestDataDeletionDto, RecordConsentDto, UpdatePrivacyPolicyDto } from './dto';

@ApiTags('gdpr')
@Controller('gdpr')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class GdprController {
  constructor(private readonly gdprService: GdprService) {}

  @Post('data-export')
  @ApiOperation({ summary: 'Request data export (Right to Data Portability)' })
  @ApiResponse({ status: 201, description: 'Data export request created', type: DataExportRequest })
  async requestDataExport(@Request() req: any): Promise<DataExportRequest> {
    return this.gdprService.requestDataExport(req.user.id, req.user.email);
  }

  @Get('data-export/status')
  @ApiOperation({ summary: 'Get data export request status' })
  @ApiResponse({ status: 200, description: 'Export status', type: DataExportRequest })
  async getDataExportStatus(@Request() req: any): Promise<DataExportRequest | null> {
    return this.gdprService.getDataExportStatus(req.user.id);
  }

  @Post('data-deletion')
  @ApiOperation({ summary: 'Request data deletion (Right to be Forgotten)' })
  @ApiResponse({ status: 201, description: 'Data deletion request created', type: DataDeletionRequest })
  async requestDataDeletion(
    @Request() req: any,
    @Body() dto: RequestDataDeletionDto,
  ): Promise<DataDeletionRequest> {
    return this.gdprService.requestDataDeletion(req.user.id, req.user.email, dto.reason);
  }

  @Delete('data-deletion')
  @ApiOperation({ summary: 'Cancel data deletion request' })
  @ApiResponse({ status: 200, description: 'Deletion request cancelled' })
  @HttpCode(HttpStatus.OK)
  async cancelDataDeletion(@Request() req: any): Promise<{ success: boolean }> {
    const success = await this.gdprService.cancelDataDeletion(req.user.id);
    return { success };
  }

  @Post('consent')
  @ApiOperation({ summary: 'Record user consent' })
  @ApiResponse({ status: 201, description: 'Consent recorded', type: ConsentRecord })
  async recordConsent(
    @Request() req: any,
    @Body() dto: RecordConsentDto,
  ): Promise<ConsentRecord> {
    const ipAddress = req.ip || req.connection?.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || '';
    
    return this.gdprService.recordConsent(
      req.user.id,
      dto.consentType,
      dto.granted,
      ipAddress,
      userAgent,
      dto.version || '1.0',
    );
  }

  @Get('consent')
  @ApiOperation({ summary: 'Get user consent status' })
  @ApiResponse({ status: 200, description: 'Consent records', type: [ConsentRecord] })
  @ApiQuery({ name: 'type', required: false, description: 'Consent type filter' })
  async getConsentStatus(
    @Request() req: any,
    @Query('type') consentType?: string,
  ): Promise<ConsentRecord[]> {
    return this.gdprService.getConsentStatus(req.user.id, consentType);
  }

  @Get('privacy-policy')
  @ApiOperation({ summary: 'Get privacy policy' })
  @ApiResponse({ status: 200, description: 'Privacy policy' })
  @ApiQuery({ name: 'version', required: false, description: 'Policy version' })
  async getPrivacyPolicy(@Query('version') version?: string): Promise<any> {
    return this.gdprService.getPrivacyPolicy(version);
  }

  @Post('privacy-policy')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update privacy policy (Admin only)' })
  @ApiResponse({ status: 201, description: 'Privacy policy updated' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async updatePrivacyPolicy(@Body() dto: UpdatePrivacyPolicyDto): Promise<{ success: boolean }> {
    await this.gdprService.updatePrivacyPolicy(dto.content, dto.version);
    return { success: true };
  }

  @Post('cleanup-expired')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Cleanup expired data (Admin only)' })
  @ApiResponse({ status: 200, description: 'Expired data cleaned up' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @HttpCode(HttpStatus.OK)
  async cleanupExpiredData(): Promise<{ success: boolean }> {
    await this.gdprService.cleanupExpiredData();
    return { success: true };
  }

  @Post('process-deletions')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Process scheduled deletions (Admin only)' })
  @ApiResponse({ status: 200, description: 'Scheduled deletions processed' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @HttpCode(HttpStatus.OK)
  async processScheduledDeletions(): Promise<{ success: boolean }> {
    await this.gdprService.processScheduledDeletions();
    return { success: true };
  }
}
