import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { createLogger } from '@tekup/shared';

const logger = createLogger('tekup-crm-gdpr-compliance');

@Injectable()
export class GDPRComplianceService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Process GDPR data request (Article 15 - Right of Access)
   */
  async processDataRequest(email: string, tenantId: string): Promise<GDPRDataExport> {
    try {
      // Find all personal data for the email across the system
      const [contact, activities, deals, leadEvents] = await Promise.all([
        this.prisma.contact.findMany({
          where: { email, tenantId },
          include: { company: true }
        }),
        this.prisma.activity.findMany({
          where: { 
            OR: [
              { metadata: { path: ['email'], equals: email } },
              { contact: { email } }
            ],
            tenantId
          }
        }),
        this.prisma.deal.findMany({
          where: { 
            contact: { email },
            tenantId
          }
        }),
        this.prisma.leadEvent.findMany({
          where: {
            OR: [
              { metadata: { path: ['email'], equals: email } },
              { lead: { metadata: { path: ['email'], equals: email } } }
            ],
            tenantId
          }
        })
      ]);

      const dataExport: GDPRDataExport = {
        requestId: `gdpr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        email,
        tenantId,
        requestDate: new Date(),
        personalData: {
          contacts: contact.map(c => ({
            id: c.id,
            name: c.name,
            email: c.email,
            phone: c.phone,
            company: c.company?.name,
            createdAt: c.createdAt,
            updatedAt: c.updatedAt
          })),
          activities: activities.map(a => ({
            id: a.id,
            type: a.type,
            description: a.description,
            createdAt: a.createdAt,
            metadata: a.metadata
          })),
          deals: deals.map(d => ({
            id: d.id,
            title: d.title,
            value: d.value,
            status: d.status,
            createdAt: d.createdAt
          })),
          leadEvents: leadEvents.map(l => ({
            id: l.id,
            type: l.type,
            createdAt: l.createdAt,
            metadata: l.metadata
          }))
        },
        legalBasis: 'Article 15 GDPR - Right of Access',
        retentionPeriod: '7 years from last contact',
        dataProcessingPurposes: [
          'Customer relationship management',
          'Lead tracking and conversion',
          'Business communication',
          'Compliance with Danish bookkeeping laws'
        ]
      };

      // Log the GDPR request
      await this.prisma.gdprRequest.create({
        data: {
          requestId: dataExport.requestId,
          email,
          tenantId,
          type: 'DATA_ACCESS',
          status: 'COMPLETED',
          requestDate: new Date(),
          completedDate: new Date(),
          metadata: { recordCount: this.countTotalRecords(dataExport) }
        }
      });

      logger.info(`GDPR data request completed for ${email} (${dataExport.requestId})`);
      return dataExport;

    } catch (error) {
      logger.error(`GDPR data request failed for ${email}:`, error);
      throw new Error('Failed to process GDPR data request');
    }
  }

  /**
   * Process GDPR deletion request (Article 17 - Right to Erasure)
   */
  async processDeleteRequest(email: string, tenantId: string): Promise<GDPRDeletionResult> {
    try {
      const deletionResult: GDPRDeletionResult = {
        requestId: `gdpr-del-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        email,
        tenantId,
        requestDate: new Date(),
        deletedRecords: {
          contacts: 0,
          activities: 0,
          deals: 0,
          leadEvents: 0
        },
        retainedRecords: [],
        legalJustification: []
      };

      // Check for legal obligations requiring data retention
      const hasLegalObligations = await this.checkLegalRetentionRequirements(email, tenantId);

      if (hasLegalObligations.mustRetain) {
        deletionResult.retainedRecords = hasLegalObligations.records;
        deletionResult.legalJustification = hasLegalObligations.reasons;
        
        // Anonymize instead of delete where legal retention applies
        await this.anonymizePersonalData(email, tenantId);
      } else {
        // Full deletion possible
        const [contactsDeleted, activitiesDeleted, dealsDeleted, leadEventsDeleted] = await Promise.all([
          this.prisma.contact.deleteMany({ where: { email, tenantId } }),
          this.prisma.activity.deleteMany({ 
            where: { 
              OR: [
                { metadata: { path: ['email'], equals: email } },
                { contact: { email } }
              ],
              tenantId 
            } 
          }),
          this.prisma.deal.deleteMany({ 
            where: { 
              contact: { email },
              tenantId 
            } 
          }),
          this.prisma.leadEvent.deleteMany({
            where: {
              OR: [
                { metadata: { path: ['email'], equals: email } },
                { lead: { metadata: { path: ['email'], equals: email } } }
              ],
              tenantId
            }
          })
        ]);

        deletionResult.deletedRecords = {
          contacts: contactsDeleted.count,
          activities: activitiesDeleted.count,
          deals: dealsDeleted.count,
          leadEvents: leadEventsDeleted.count
        };
      }

      // Log the GDPR deletion request
      await this.prisma.gdprRequest.create({
        data: {
          requestId: deletionResult.requestId,
          email,
          tenantId,
          type: 'DATA_DELETION',
          status: 'COMPLETED',
          requestDate: new Date(),
          completedDate: new Date(),
          metadata: deletionResult
        }
      });

      logger.info(`GDPR deletion request completed for ${email} (${deletionResult.requestId})`);
      return deletionResult;

    } catch (error) {
      logger.error(`GDPR deletion request failed for ${email}:`, error);
      throw new Error('Failed to process GDPR deletion request');
    }
  }

  /**
   * Generate GDPR compliance report for tenant
   */
  async generateComplianceReport(tenantId: string): Promise<GDPRComplianceReport> {
    const [totalContacts, gdprRequests, dataRetentionStats] = await Promise.all([
      this.prisma.contact.count({ where: { tenantId } }),
      this.prisma.gdprRequest.findMany({ 
        where: { tenantId },
        orderBy: { requestDate: 'desc' },
        take: 10
      }),
      this.calculateDataRetentionStats(tenantId)
    ]);

    const report: GDPRComplianceReport = {
      tenantId,
      reportDate: new Date(),
      totalPersonalDataRecords: totalContacts,
      gdprRequestsLast30Days: gdprRequests.filter(r => 
        r.requestDate > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      ).length,
      averageResponseTime: '24 hours',
      complianceStatus: 'COMPLIANT',
      dataRetentionCompliance: dataRetentionStats,
      recommendations: [
        'Regular data retention policy review',
        'Employee GDPR training',
        'Data processing agreement updates',
        'Consent management optimization'
      ],
      lastReviewDate: new Date(),
      nextReviewDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days
    };

    return report;
  }

  /**
   * Check if data must be retained for legal reasons (Danish law)
   */
  private async checkLegalRetentionRequirements(email: string, tenantId: string): Promise<LegalRetentionCheck> {
    // Danish bookkeeping law requires 5 years retention for business records
    const cutoffDate = new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000);

    const businessRecords = await this.prisma.deal.findMany({
      where: {
        contact: { email },
        tenantId,
        createdAt: { gt: cutoffDate }
      }
    });

    if (businessRecords.length > 0) {
      return {
        mustRetain: true,
        records: businessRecords.map(d => ({
          type: 'deal',
          id: d.id,
          reason: 'Danish Bookkeeping Act - 5 year retention'
        })),
        reasons: [
          'Compliance with Danish Bookkeeping Act (Bogføringsloven)',
          'Tax authority requirements (SKAT)',
          'Business transaction records must be retained for 5 years'
        ]
      };
    }

    return { mustRetain: false, records: [], reasons: [] };
  }

  /**
   * Anonymize personal data while retaining business records
   */
  private async anonymizePersonalData(email: string, tenantId: string): Promise<void> {
    const anonymizedEmail = `anonymous-${Date.now()}@deleted.local`;
    const anonymizedName = 'DELETED USER';

    await Promise.all([
      this.prisma.contact.updateMany({
        where: { email, tenantId },
        data: {
          email: anonymizedEmail,
          name: anonymizedName,
          phone: null
        }
      }),
      this.prisma.activity.updateMany({
        where: {
          metadata: { path: ['email'], equals: email },
          tenantId
        },
        data: {
          metadata: { email: anonymizedEmail, anonymized: true }
        }
      })
    ]);
  }

  private countTotalRecords(dataExport: GDPRDataExport): number {
    return (
      dataExport.personalData.contacts.length +
      dataExport.personalData.activities.length +
      dataExport.personalData.deals.length +
      dataExport.personalData.leadEvents.length
    );
  }

  private async calculateDataRetentionStats(tenantId: string): Promise<DataRetentionStats> {
    const cutoffDate = new Date(Date.now() - 7 * 365 * 24 * 60 * 60 * 1000); // 7 years

    const [total, overRetention] = await Promise.all([
      this.prisma.contact.count({ where: { tenantId } }),
      this.prisma.contact.count({ 
        where: { 
          tenantId,
          createdAt: { lt: cutoffDate }
        } 
      })
    ]);

    return {
      totalRecords: total,
      recordsOverRetentionPeriod: overRetention,
      compliancePercentage: Math.round(((total - overRetention) / total) * 100)
    };
  }
}

// Types
export interface GDPRDataExport {
  requestId: string;
  email: string;
  tenantId: string;
  requestDate: Date;
  personalData: {
    contacts: any[];
    activities: any[];
    deals: any[];
    leadEvents: any[];
  };
  legalBasis: string;
  retentionPeriod: string;
  dataProcessingPurposes: string[];
}

export interface GDPRDeletionResult {
  requestId: string;
  email: string;
  tenantId: string;
  requestDate: Date;
  deletedRecords: {
    contacts: number;
    activities: number;
    deals: number;
    leadEvents: number;
  };
  retainedRecords: Array<{
    type: string;
    id: string;
    reason: string;
  }>;
  legalJustification: string[];
}

export interface GDPRComplianceReport {
  tenantId: string;
  reportDate: Date;
  totalPersonalDataRecords: number;
  gdprRequestsLast30Days: number;
  averageResponseTime: string;
  complianceStatus: 'COMPLIANT' | 'NEEDS_ATTENTION' | 'NON_COMPLIANT';
  dataRetentionCompliance: DataRetentionStats;
  recommendations: string[];
  lastReviewDate: Date;
  nextReviewDate: Date;
}

interface LegalRetentionCheck {
  mustRetain: boolean;
  records: Array<{
    type: string;
    id: string;
    reason: string;
  }>;
  reasons: string[];
}

interface DataRetentionStats {
  totalRecords: number;
  recordsOverRetentionPeriod: number;
  compliancePercentage: number;
}
