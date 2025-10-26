import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

export interface LeadSyncConfig {
  tenantId: string;
  flowApiUrl: string;
  syncInterval: number;
}

@Injectable()
export class LeadSyncService {
  private readonly logger = new Logger(LeadSyncService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async syncLeadsFromFlowApi(tenantId: string | { tenantId: string }) {
    const actualTenantId = typeof tenantId === 'string' ? tenantId : tenantId.tenantId;
    try {
      const flowApiUrl = this.configService.get<string>('FLOW_API_URL');
      if (!flowApiUrl) {
        throw new Error('FLOW_API_URL not configured');
      }

      // Fetch leads from Flow API
      const response = await fetch(`${flowApiUrl}/api/leads?tenantId=${actualTenantId}`);
      const leads = await response.json();

      let syncedCount = 0;
      for (const flowLead of leads) {
        // Check if lead already exists
        const existingLead = await this.prisma.Lead.findFirst({
          where: {
            flowApiId: flowLead.id,
            tenantId: actualTenantId,
          },
        });

        if (!existingLead) {
          // Create new lead
          await this.prisma.Lead.create({
            data: {
              tenantId: actualTenantId,
              source: flowLead.source || 'flow-api',
              status: flowLead.status || 'new',
              score: flowLead.score || 0,
              flowApiId: flowLead.id,
              title: flowLead.name || flowLead.title,
            },
          });
          syncedCount++;
        } else {
          // Update existing lead
          await this.prisma.Lead.update({
            where: { id: existingLead.id },
            data: {
              status: flowLead.status || existingLead.status,
              score: flowLead.score || existingLead.score,
              title: flowLead.name || flowLead.title,
            },
          });
        }
      }

      this.logger.log(`Synced ${syncedCount} leads from Flow API for tenant ${actualTenantId}`);
      return { 
        success: true, 
        leadsImported: syncedCount, 
        leadsUpdated: leads.length - syncedCount,
        errors: [],
        lastSync: new Date(),
        syncedCount, 
        totalLeads: leads.length 
      };
    } catch (error) {
      this.logger.error(`Failed to sync leads from Flow API: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getLeadStats(tenantId: string) {
    try {
      const totalLeads = await this.prisma.Lead.count({
        where: { tenantId },
      });

      const convertedLeads = await this.prisma.Lead.count({
        where: { 
          tenantId,
          status: 'converted',
        },
      });

      const lastSync = await this.prisma.Lead.findFirst({
        where: { tenantId },
        orderBy: { updatedAt: 'desc' },
      });

      return {
        totalLeads,
        convertedLeads,
        conversionRate: totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0,
        lastSync: lastSync?.updatedAt,
      };
    } catch (error) {
      this.logger.error(`Failed to get lead stats: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getSyncStatus(tenantId: string) {
    try {
      const stats = await this.getLeadStats(tenantId);
      return {
        ...stats,
        lastSync: stats.lastSync || new Date(),
        isActive: true,
      };
    } catch (error) {
      this.logger.error(`Failed to get sync status: ${error.message}`, error.stack);
      throw error;
    }
  }

  async convertLeadToDeal(leadId: string, tenantId: string, dealData: any) {
    try {
      // Find the lead
      const lead = await this.prisma.Lead.findFirst({
        where: { id: leadId, tenantId },
      });

      if (!lead) {
        throw new Error('Lead not found');
      }

      // Create deal
      const deal = await this.prisma.Deal.create({
        data: {
          tenantId,
          companyId: lead.companyId,
          name: dealData.name || `Deal from ${lead.title}`,
          description: dealData.description || `Converted from lead: ${lead.title}`,
          value: dealData.value || 0,
          currency: dealData.currency || 'DKK',
          stageId: dealData.stageId,
        },
      });

      // Update lead status
      await this.prisma.Lead.update({
        where: { id: leadId },
        data: { 
          status: 'converted',
          convertedAt: new Date(),
        },
      });

      // Create lead conversion record
      await this.prisma.LeadConversion.create({
        data: {
          tenantId,
          leadId,
          dealId: deal.id,
          contactId: lead.contactId,
          companyId: lead.companyId,
        },
      });

      return { success: true, dealId: deal.id };
    } catch (error) {
      this.logger.error(`Failed to convert lead to deal: ${error.message}`, error.stack);
      throw error;
    }
  }
}