import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { GdprService, DataExportRequest, DataDeletionRequest, ConsentRecord } from './gdpr.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('GDPR')
@Controller('gdpr')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class GdprController {
  constructor(private readonly gdprService: GdprService) {}

  @Post('data-export')
  @ApiOperation({ summary: 'Request data export (Right to Data Portability)' })
  @ApiResponse({ status: 201, description: 'Data export request created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async requestDataExport(@Request() req): Promise<DataExportRequest> {
    const userId = req.user.sub;
    const email = req.user.email;
    return this.gdprService.requestDataExport(userId, email);
  }

  @Get('data-export/status')
  @ApiOperation({ summary: 'Get data export request status' })
  @ApiResponse({ status: 200, description: 'Export status retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getDataExportStatus(@Request() req): Promise<DataExportRequest | null> {
    const userId = req.user.sub;
    const email = req.user.email;
    
    // This would need to be implemented to check existing requests
    return this.gdprService.requestDataExport(userId, email);
  }

  @Post('data-deletion')
  @ApiOperation({ summary: 'Request data deletion (Right to be Forgotten)' })
  @ApiResponse({ status: 201, description: 'Data deletion request created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async requestDataDeletion(
    @Request() req,
    @Body('reason') reason?: string
  ): Promise<DataDeletionRequest> {
    const userId = req.user.sub;
    const email = req.user.email;
    return this.gdprService.requestDataDeletion(userId, email, reason);
  }

  @Delete('data-deletion')
  @ApiOperation({ summary: 'Cancel data deletion request' })
  @ApiResponse({ status: 200, description: 'Data deletion request cancelled successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @HttpCode(HttpStatus.OK)
  async cancelDataDeletion(@Request() req): Promise<{ success: boolean }> {
    const userId = req.user.sub;
    const success = await this.gdprService.cancelDataDeletion(userId);
    return { success };
  }

  @Post('consent')
  @ApiOperation({ summary: 'Record user consent' })
  @ApiResponse({ status: 201, description: 'Consent recorded successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async recordConsent(
    @Request() req,
    @Body('consentType') consentType: string,
    @Body('granted') granted: boolean,
    @Body('version') version?: string
  ): Promise<ConsentRecord> {
    const userId = req.user.sub;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';
    
    return this.gdprService.recordConsent(
      userId,
      consentType,
      granted,
      ipAddress,
      userAgent,
      version || '1.0'
    );
  }

  @Get('consent')
  @ApiOperation({ summary: 'Get user consent status' })
  @ApiResponse({ status: 200, description: 'Consent status retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getConsentStatus(
    @Request() req,
    @Query('type') consentType?: string
  ): Promise<ConsentRecord[]> {
    const userId = req.user.sub;
    return this.gdprService.getConsentStatus(userId, consentType);
  }

  @Get('privacy-policy')
  @ApiOperation({ summary: 'Get current privacy policy' })
  @ApiResponse({ status: 200, description: 'Privacy policy retrieved successfully' })
  async getPrivacyPolicy(@Query('version') version?: string): Promise<any> {
    return this.gdprService.getPrivacyPolicy(version);
  }

  // Admin endpoints
  @Post('privacy-policy')
  @UseGuards(RolesGuard)
  @Roles('owner', 'admin')
  @ApiOperation({ summary: 'Update privacy policy (Admin only)' })
  @ApiResponse({ status: 201, description: 'Privacy policy updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async updatePrivacyPolicy(
    @Body('content') content: string,
    @Body('version') version: string
  ): Promise<{ success: boolean }> {
    await this.gdprService.updatePrivacyPolicy(content, version);
    return { success: true };
  }

  @Post('cleanup-expired')
  @UseGuards(RolesGuard)
  @Roles('owner', 'admin')
  @ApiOperation({ summary: 'Cleanup expired data (Admin only)' })
  @ApiResponse({ status: 200, description: 'Expired data cleanup completed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @HttpCode(HttpStatus.OK)
  async cleanupExpiredData(): Promise<{ success: boolean }> {
    await this.gdprService.cleanupExpiredData();
    return { success: true };
  }

  @Post('process-deletions')
  @UseGuards(RolesGuard)
  @Roles('owner', 'admin')
  @ApiOperation({ summary: 'Process scheduled deletions (Admin only)' })
  @ApiResponse({ status: 200, description: 'Scheduled deletions processed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @HttpCode(HttpStatus.OK)
  async processScheduledDeletions(): Promise<{ success: boolean }> {
    await this.gdprService.processScheduledDeletions();
    return { success: true };
  }
}

// DTO classes for request validation
export class RecordConsentDto {
  consentType: string;
  granted: boolean;
  version?: string;
}

export class RequestDataDeletionDto {
  reason?: string;
}

export class UpdatePrivacyPolicyDto {
  content: string;
  version: string;
}