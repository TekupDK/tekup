import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConvertLeadDto } from './dto/convert-lead.dto';
import { SyncService } from '../sync/sync.service';
import { createLogger } from '@tekup/shared';

const logger = createLogger('apps-tekup-crm-api-src-lead-conversion');

@Injectable()
export class LeadConversionService {
  constructor(
    private prisma: PrismaService,
    private syncService: SyncService,
  ) {}

  async convertLead(convertLeadDto: ConvertLeadDto, tenantId: string) {
    const { leadId, contactData, companyData, dealData } = convertLeadDto;

    // Check if lead has already been converted
    const existingConversion = await this.prisma.LeadConversion.findFirst({
      where: {
        leadId,
        tenantId,
      },
    });

    if (existingConversion) {
      throw new Error('Lead has already been converted');
    }

    // Create contact if provided
    let contactId: string | undefined;
    if (contactData) {
      const contact = await this.prisma.Contact.create({
        data: {
          ...contactData,
          tenantId,
        },
      });
      contactId = contact.id;
    }

    // Create company if provided
    let companyId: string | undefined;
    if (companyData) {
      const company = await this.prisma.Company.create({
        data: {
          ...companyData,
          tenantId,
        },
      });
      companyId = company.id;
    }

    // Create deal if provided
    let dealId: string | undefined;
    if (dealData) {
      const deal = await this.prisma.Deal.create({
        data: {
          ...dealData,
          tenantId,
          companyId: companyId || dealData.companyId,
        },
      });
      dealId = deal.id;
    }

    // Create lead conversion record
    const leadConversion = await this.prisma.LeadConversion.create({
      data: {
        leadId,
        tenantId,
        contactId,
        companyId,
        dealId,
      },
    });

    // Notify flow-api about the conversion
    try {
      await this.syncService.notifyLeadConversion(leadId, tenantId, {
        contactId,
        companyId,
        dealId,
      });
    } catch (error) {
      // Log error but don't fail the conversion
      logger.error('Failed to notify lead conversion:', error);
    }

    return {
      leadConversion,
      contactId,
      companyId,
      dealId,
    };
  }

  async getConversionByLeadId(leadId: string, tenantId: string) {
    return this.prisma.LeadConversion.findFirst({
      where: {
        leadId,
        tenantId,
      },
      include: {
        contact: true,
        company: true,
        deal: true,
      },
    });
  }
}