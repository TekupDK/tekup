import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { createApiClient } from '@tekup/api-client';

export interface LeadSyncConfig {
  tenantId: string;
  flowApiUrl: string;
  syncInterval: number;
}

export interface SyncResult {
  success: boolean;
  leadsImported: number;
  leadsUpdated: number;
  errors: string[];
  lastSync: Date;
}

@Injectable()
export class LeadSyncService {
  private readonly logger = new Logger(LeadSyncService.name);
  private flowApiClient: ReturnType<typeof createApiClient>;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Initialize the Flow API client
   */
  private initializeFlowApiClient(config: LeadSyncConfig) {
    this.flowApiClient = createApiClient({
      baseUrl: config.flowApiUrl,
      tenantId: config.tenantId,
    });
  }

  /**
   * Sync leads from Flow API to CRM
   */
  async syncLeadsFromFlowApi(config: LeadSyncConfig): Promise<SyncResult> {
    this.initializeFlowApiClient(config);
    
    const result: SyncResult = {
      success: false,
      leadsImported: 0,
      leadsUpdated: 0,
      errors: [],
      lastSync: new Date(),
    };

    try {
      this.logger.log(`Starting lead sync for tenant: ${config.tenantId}`);

      // Get leads from Flow API
      const flowLeads = await this.flowApiClient.getLeads({ limit: 1000 });
      
      if (!flowLeads.data || flowLeads.data.length === 0) {
        this.logger.log('No leads found in Flow API');
        result.success = true;
        return result;
      }

      this.logger.log(`Found ${flowLeads.data.length} leads in Flow API`);

      // Process each lead
      for (const flowLead of flowLeads.data) {
        try {
          await this.processFlowLead(flowLead, config.tenantId);
          result.leadsImported++;
        } catch (error) {
          const errorMsg = `Failed to process lead ${flowLead.id}: ${error.message}`;
          this.logger.error(errorMsg);
          result.errors.push(errorMsg);
        }
      }

      result.success = true;
      this.logger.log(`Lead sync completed: ${result.leadsImported} imported, ${result.leadsUpdated} updated`);

    } catch (error) {
      const errorMsg = `Lead sync failed: ${error.message}`;
      this.logger.error(errorMsg);
      result.errors.push(errorMsg);
    }

    return result;
  }

  /**
   * Process a single lead from Flow API
   */
  private async processFlowLead(flowLead: any, tenantId: string) {
    // Check if lead already exists in CRM
    const existingLead = await this.prisma.Lead.findFirst({
      where: {
        flowApiId: flowLead.id,
        tenantId: tenantId,
      },
    });

    if (existingLead) {
      // Update existing lead
      await this.updateExistingLead(existingLead.id, flowLead);
      return;
    }

    // Create new lead
    await this.createNewLead(flowLead, tenantId);
  }

  /**
   * Create a new lead in CRM from Flow API data
   */
  private async createNewLead(flowLead: any, tenantId: string) {
    const { payload } = flowLead;
    
    // Create contact if email exists
    let contactId: string | null = null;
    if (payload?.email) {
      contactId = await this.createOrUpdateContact(payload, tenantId);
    }

    // Create company if company name exists
    let companyId: string | null = null;
    if (payload?.company) {
      companyId = await this.createOrUpdateCompany(payload, tenantId);
    }

    // Create the lead
    await this.prisma.Lead.create({
      data: {
        flowApiId: flowLead.id,
        tenantId: tenantId,
        source: flowLead.source,
        status: this.mapLeadStatus(flowLead.status),
        title: payload?.name || 'Unknown Lead',
        description: payload?.message || '',
        contactId: contactId,
        companyId: companyId,
        metadata: {
          originalPayload: payload,
          flowApiData: flowLead,
        },
        createdAt: new Date(flowLead.createdAt),
        updatedAt: new Date(flowLead.updatedAt),
      },
    });

    this.logger.log(`Created new lead: ${flowLead.id}`);
  }

  /**
   * Update existing lead in CRM
   */
  private async updateExistingLead(leadId: string, flowLead: any) {
    const { payload } = flowLead;
    
    // Update lead data
    await this.prisma.Lead.update({
      where: { id: leadId },
      data: {
        status: this.mapLeadStatus(flowLead.status),
        title: payload?.name || 'Unknown Lead',
        description: payload?.message || '',
        updatedAt: new Date(flowLead.updatedAt),
        metadata: {
          originalPayload: payload,
          flowApiData: flowLead,
          lastSync: new Date(),
        },
      },
    });

    this.logger.log(`Updated existing lead: ${leadId}`);
  }

  /**
   * Create or update contact
   */
  private async createOrUpdateContact(payload: any, tenantId: string): Promise<string> {
    const existingContact = await this.prisma.Contact.findFirst({
      where: {
        email: payload.email,
        tenantId: tenantId,
      },
    });

    if (existingContact) {
      // Update existing contact
      await this.prisma.Contact.update({
        where: { id: existingContact.id },
        data: {
          firstName: payload.name?.split(' ')[0] || '',
          lastName: payload.name?.split(' ').slice(1).join(' ') || '',
          phone: payload.phone || '',
          jobTitle: payload.jobTitle || '',
          updatedAt: new Date(),
        },
      });
      return existingContact.id;
    }

    // Create new contact
    const newContact = await this.prisma.Contact.create({
      data: {
        tenantId: tenantId,
        firstName: payload.name?.split(' ')[0] || '',
        lastName: payload.name?.split(' ').slice(1).join(' ') || '',
        email: payload.email,
        phone: payload.phone || '',
        jobTitle: payload.jobTitle || '',
      },
    });

    return newContact.id;
  }

  /**
   * Create or update company
   */
  private async createOrUpdateCompany(payload: any, tenantId: string): Promise<string> {
    const existingCompany = await this.prisma.Company.findFirst({
      where: {
        name: payload.company,
        tenantId: tenantId,
      },
    });

    if (existingCompany) {
      return existingCompany.id;
    }

    // Create new company
    const newCompany = await this.prisma.Company.create({
      data: {
        tenantId: tenantId,
        name: payload.company,
        industry: 'Unknown',
        website: '',
      },
    });

    return newCompany.id;
  }

  /**
   * Map Flow API lead status to CRM status
   */
  private mapLeadStatus(flowStatus: string): string {
    switch (flowStatus) {
      case 'NEW':
        return 'NEW';
      case 'CONTACTED':
        return 'CONTACTED';
      default:
        return 'NEW';
    }
  }

  /**
   * Convert a lead to deal/opportunity
   */
  async convertLeadToDeal(
    leadId: string,
    dealData: {
      name: string;
      value: number;
      currency: string;
      description?: string;
    },
    tenantId: string
  ) {
    try {
      // Get the lead
      const lead = await this.prisma.Lead.findFirst({
        where: { id: leadId, tenantId },
        include: { contact: true, company: true },
      });

      if (!lead) {
        throw new Error('Lead not found');
      }

      // Create deal
      const deal = await this.prisma.Deal.create({
        data: {
          tenantId: tenantId,
          name: dealData.name,
          value: dealData.value,
          currency: dealData.currency,
          description: dealData.description || '',
          companyId: lead.companyId,
          stageId: await this.getDefaultStageId(tenantId),
        },
      });

      // Update lead status
      await this.prisma.Lead.update({
        where: { id: leadId },
        data: { status: 'CONVERTED', convertedAt: new Date() },
      });

      // Create activity
      await this.prisma.Activity.create({
        data: {
          tenantId: tenantId,
          activityTypeId: await this.getDefaultActivityTypeId(tenantId),
          subject: `Lead converted to deal: ${dealData.name}`,
          description: `Lead "${lead.title}" was converted to deal "${dealData.name}"`,
          type: 'LEAD_CONVERTED',
        },
      });

      this.logger.log(`Successfully converted lead ${leadId} to deal ${deal.id}`);

      return {
        success: true,
        dealId: deal.id,
        message: 'Lead successfully converted to deal',
      };

    } catch (error) {
      this.logger.error(`Failed to convert lead ${leadId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get sync status for a tenant
   */
  async getSyncStatus(tenantId: string) {
    const lastSync = await this.prisma.Lead.findFirst({
      where: { tenantId },
      orderBy: { updatedAt: 'desc' },
      select: { updatedAt: true },
    });

    const totalLeads = await this.prisma.Lead.count({
      where: { tenantId },
    });

    const convertedLeads = await this.prisma.Lead.count({
      where: { tenantId, status: 'CONVERTED' },
    });

    return {
      lastSync: lastSync?.updatedAt || null,
      totalLeads,
      convertedLeads,
      conversionRate: totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0,
    };
  }

  /**
   * Get default stage ID for new deals
   */
  private async getDefaultStageId(tenantId: string): Promise<string> {
    const defaultStage = await this.prisma.DealStage.findFirst({
      where: { 
        tenantId,
        name: { contains: 'Prospect' }
      },
    });

    if (defaultStage) {
      return defaultStage.id;
    }

    // Create default stage if none exists
    const newStage = await this.prisma.DealStage.create({
      data: {
        tenantId,
        name: 'Prospecting',
        order: 1,
        isClosed: false,
        isWon: false,
      },
    });

    return newStage.id;
  }

  /**
   * Get default activity type ID
   */
  private async getDefaultActivityTypeId(tenantId: string): Promise<string> {
    const defaultType = await this.prisma.ActivityType.findFirst({
      where: { 
        tenantId,
        name: { contains: 'Lead' }
      },
    });

    if (defaultType) {
      return defaultType.id;
    }

    // Create default activity type if none exists
    const newType = await this.prisma.ActivityType.create({
      data: {
        tenantId,
        name: 'Lead Conversion',
        color: '#10b981',
        isActive: true,
      },
    });

    return newType.id;
  }
}