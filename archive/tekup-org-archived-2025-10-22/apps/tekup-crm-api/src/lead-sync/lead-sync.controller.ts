import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { LeadSyncService, LeadSyncConfig } from './lead-sync.service';
import { JwtAuthGuard } from '@tekup/auth';

export interface SyncLeadsRequest {
  flowApiUrl: string;
  apiKey: string;
  tenantId: string;
}

export interface SyncLeadsResponse {
  success: boolean;
  leadsImported: number;
  leadsUpdated: number;
  errors: string[];
  lastSync: Date;
  message: string;
}

export interface SyncStatusResponse {
  lastSync: Date | null;
  totalLeads: number;
  convertedLeads: number;
  conversionRate: number;
  message: string;
}

@Controller('lead-sync')
@UseGuards(JwtAuthGuard)
export class LeadSyncController {
  constructor(private readonly leadSyncService: LeadSyncService) {}

  /**
   * Sync leads from Flow API to CRM
   */
  @Post('sync')
  @HttpCode(HttpStatus.OK)
  async syncLeadsFromFlowApi(
    @Body() request: SyncLeadsRequest
  ): Promise<SyncLeadsResponse> {
    try {
      const result = await this.leadSyncService.syncLeadsFromFlowApi(request);
      
      return {
        ...result,
        message: result.success
          ? `Successfully synced ${result.leadsImported} leads from Flow API`
          : `Sync failed with ${result.errors.length} errors`,
      };
    } catch (error) {
      return {
        success: false,
        leadsImported: 0,
        leadsUpdated: 0,
        errors: [error.message],
        lastSync: new Date(),
        message: `Sync failed: ${error.message}`,
      };
    }
  }

  /**
   * Get sync status for a tenant
   */
  @Get('status')
  async getSyncStatus(
    @Query('tenantId') tenantId: string
  ): Promise<SyncStatusResponse> {
    try {
      if (!tenantId) {
        throw new Error('Tenant ID is required');
      }

      const status = await this.leadSyncService.getSyncStatus(tenantId);
      
      return {
        ...status,
        message: `Sync status for tenant ${tenantId}`,
      };
    } catch (error) {
      return {
        lastSync: null,
        totalLeads: 0,
        convertedLeads: 0,
        conversionRate: 0,
        message: `Failed to get sync status: ${error.message}`,
      };
    }
  }

  /**
   * Convert a lead to deal
   */
  @Post('convert/:leadId')
  async convertLeadToDeal(
    @Query('leadId') leadId: string,
    @Query('tenantId') tenantId: string,
    @Body() dealData: {
      name: string;
      value: number;
      currency: string;
      description?: string;
    }
  ) {
    try {
      if (!leadId || !tenantId) {
        throw new Error('Lead ID and Tenant ID are required');
      }

      const result = await this.leadSyncService.convertLeadToDeal(
        leadId,
        tenantId,
        dealData
      );

      return {
        success: true,
        data: result,
        message: 'Lead successfully converted to deal',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: `Failed to convert lead: ${error.message}`,
      };
    }
  }

  /**
   * Manual sync trigger for testing
   */
  @Post('manual-sync')
  async manualSync(
    @Body() config: LeadSyncConfig
  ): Promise<SyncLeadsResponse> {
    try {
      const result = await this.leadSyncService.syncLeadsFromFlowApi(config.tenantId);
      
      return {
        ...result,
        message: result.success
          ? `Manual sync completed: ${result.leadsImported} leads imported`
          : `Manual sync failed: ${result.errors.join(', ')}`,
      };
    } catch (error) {
      return {
        success: false,
        leadsImported: 0,
        leadsUpdated: 0,
        errors: [error.message],
        lastSync: new Date(),
        message: `Manual sync failed: ${error.message}`,
      };
    }
  }
}