import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    private prisma: PrismaService,
    private httpService: HttpService,
    private configService: ConfigService,
  ) {}

  async syncLeadsWithCRM(tenantId: string) {
    try {
      const flowApiUrl = this.configService.get<string>('FLOW_API_URL');
      if (!flowApiUrl) {
        throw new Error('FLOW_API_URL not configured');
      }

      // Fetch leads from flow-api
      const leadsResponse = await firstValueFrom(
        this.httpService.get(`${flowApiUrl}/api/leads`, {
          headers: {
            'X-Tenant-ID': tenantId,
          },
        }),
      );

      const leads = leadsResponse.data;

      // Process each lead
      for (const lead of leads) {
        // Check if lead has already been converted
        const existingConversion = await this.prisma.LeadConversion.findFirst({
          where: {
            leadId: lead.id,
            tenantId,
          },
        });

        if (!existingConversion) {
          // Lead hasn't been converted yet, create a pending conversion record
          await this.prisma.LeadConversion.create({
            data: {
              leadId: lead.id,
              tenantId: tenantId,
            },
          });

          this.logger.log(`Created pending conversion record for lead ${lead.id}`);
        }
      }

      this.logger.log(`Synced ${leads.length} leads with CRM for tenant ${tenantId}`);
      return { success: true, count: leads.length };
    } catch (error) {
      this.logger.error(`Failed to sync leads with CRM: ${error.message}`, error.stack);
      throw error;
    }
  }

  async notifyLeadConversion(leadId: string, tenantId: string, conversionData: any) {
    try {
      const flowApiUrl = this.configService.get<string>('FLOW_API_URL');
      if (!flowApiUrl) {
        throw new Error('FLOW_API_URL not configured');
      }

      // Notify flow-api about lead conversion
      await firstValueFrom(
        this.httpService.post(
          `${flowApiUrl}/api/leads/${leadId}/conversion`,
          {
            convertedAt: new Date(),
            conversionData,
          },
          {
            headers: {
              'X-Tenant-ID': tenantId,
            },
          },
        ),
      );

      this.logger.log(`Notified flow-api about conversion of lead ${leadId}`);
      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to notify lead conversion: ${error.message}`, error.stack);
      throw error;
    }
  }

  async syncWithLeadPlatform(tenantId: string) {
    try {
      const leadPlatformUrl = this.configService.get<string>('LEAD_PLATFORM_URL');
      if (!leadPlatformUrl) {
        throw new Error('LEAD_PLATFORM_URL not configured');
      }

      // Fetch qualified leads from lead platform
      const leadsResponse = await firstValueFrom(
        this.httpService.get(`${leadPlatformUrl}/api/qualified-leads`, {
          headers: {
            'X-Tenant-ID': tenantId,
          },
        }),
      );

      const qualifiedLeads = leadsResponse.data;

      // Process each qualified lead
      for (const lead of qualifiedLeads) {
        // Check if lead has already been converted
        const existingConversion = await this.prisma.LeadConversion.findFirst({
          where: {
            leadId: lead.id,
            tenantId,
          },
        });

        if (!existingConversion) {
          // Lead hasn't been converted yet, create a pending conversion record
          await this.prisma.LeadConversion.create({
            data: {
              leadId: lead.id,
              tenantId: tenantId,
            },
          });

          this.logger.log(`Created pending conversion record for qualified lead ${lead.id}`);
        }
      }

      this.logger.log(`Synced ${qualifiedLeads.length} qualified leads with CRM for tenant ${tenantId}`);
      return { success: true, count: qualifiedLeads.length };
    } catch (error) {
      this.logger.error(`Failed to sync with lead platform: ${error.message}`, error.stack);
      throw error;
    }
  }
}