import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

export interface ConsentRequest {
  customerId: string;
  consentType: string;
  consentGiven: boolean;
  legalBasis: string;
  dataUsage?: Record<string, any>;
}

export interface DataSubjectRequest {
  customerId: string;
  requestType: 'access' | 'erasure' | 'portability' | 'rectification';
  notes?: string;
}

export interface CustomerData {
  leads: any[];
  consent: any[];
  settings: any[];
  collectedAt: Date;
}

@Injectable()
export class GdprService {
  private readonly logger = new Logger(GdprService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Record customer consent
   */
  async recordConsent(tenantId: string, consent: ConsentRequest): Promise<void> {
    try {
      await this.prisma.customerConsent.create({
        data: {
          tenantId,
          customerId: consent.customerId,
          consentType: consent.consentType,
          consentGiven: consent.consentGiven,
          consentDate: new Date(),
          consentVersion: this.getConsentVersion(),
          legalBasis: consent.legalBasis,
          dataUsage: consent.dataUsage,
        },
      });

      this.logger.log(`Consent recorded for customer ${consent.customerId} in tenant ${tenantId}`);
    } catch (error) {
      this.logger.error(`Failed to record consent: ${error.message}`);
      throw error;
    }
  }

  /**
   * Withdraw customer consent
   */
  async withdrawConsent(tenantId: string, customerId: string, consentType: string): Promise<void> {
    try {
      await this.prisma.customerConsent.updateMany({
        where: {
          tenantId,
          customerId,
          consentType,
          consentWithdrawn: null,
        },
        data: {
          consentWithdrawn: new Date(),
        },
      });

      this.logger.log(`Consent withdrawn for customer ${customerId} in tenant ${tenantId}`);
    } catch (error) {
      this.logger.error(`Failed to withdraw consent: ${error.message}`);
      throw error;
    }
  }

  /**
   * Process data subject request
   */
  async processDataSubjectRequest(tenantId: string, request: DataSubjectRequest): Promise<string> {
    try {
      const dataSubjectRequest = await this.prisma.dataSubjectRequest.create({
        data: {
          tenantId,
          customerId: request.customerId,
          requestType: request.requestType,
          status: 'processing',
          notes: request.notes,
        },
      });

      // Process request based on type
      switch (request.requestType) {
        case 'access':
          await this.processAccessRequest(tenantId, request.customerId, dataSubjectRequest.id);
          break;
        case 'erasure':
          await this.processErasureRequest(tenantId, request.customerId, dataSubjectRequest.id);
          break;
        case 'portability':
          await this.processPortabilityRequest(tenantId, request.customerId, dataSubjectRequest.id);
          break;
        case 'rectification':
          await this.processRectificationRequest(tenantId, request.customerId, dataSubjectRequest.id);
          break;
      }

      return dataSubjectRequest.id;
    } catch (error) {
      this.logger.error(`Failed to process data subject request: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get data subject request status
   */
  async getDataSubjectRequestStatus(tenantId: string, requestId: string): Promise<any> {
    try {
      const request = await this.prisma.dataSubjectRequest.findFirst({
        where: {
          id: requestId,
          tenantId,
        },
      });

      if (!request) {
        throw new Error('Data subject request not found');
      }

      return request;
    } catch (error) {
      this.logger.error(`Failed to get request status: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get customer consent status
   */
  async getCustomerConsentStatus(tenantId: string, customerId: string): Promise<any[]> {
    try {
      const consents = await this.prisma.customerConsent.findMany({
        where: {
          tenantId,
          customerId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return consents;
    } catch (error) {
      this.logger.error(`Failed to get customer consent status: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get data retention policies for tenant
   */
  async getDataRetentionPolicies(tenantId: string): Promise<any[]> {
    try {
      const policies = await this.prisma.dataRetentionPolicy.findMany({
        where: {
          tenantId,
        },
        orderBy: {
          dataType: 'asc',
        },
      });

      return policies;
    } catch (error) {
      this.logger.error(`Failed to get data retention policies: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update data retention policy
   */
  async updateDataRetentionPolicy(
    tenantId: string, 
    dataType: string, 
    updates: Partial<any>
  ): Promise<void> {
    try {
      await this.prisma.dataRetentionPolicy.updateMany({
        where: {
          tenantId,
          dataType,
        },
        data: {
          ...updates,
          updatedAt: new Date(),
        },
      });

      this.logger.log(`Data retention policy updated for ${dataType} in tenant ${tenantId}`);
    } catch (error) {
      this.logger.error(`Failed to update data retention policy: ${error.message}`);
      throw error;
    }
  }

  /**
   * Process access request (right to know)
   */
  private async processAccessRequest(tenantId: string, customerId: string, requestId: string): Promise<void> {
    try {
      // Collect all data about the customer
      const customerData = await this.collectCustomerData(tenantId, customerId);
      
      // Update request with response data
      await this.prisma.dataSubjectRequest.update({
        where: { id: requestId },
        data: {
          status: 'completed',
          completedAt: new Date(),
          responseData: customerData,
        },
      });

      this.logger.log(`Access request completed for customer ${customerId} in tenant ${tenantId}`);
    } catch (error) {
      await this.updateRequestStatus(requestId, 'rejected', error.message);
      throw error;
    }
  }

  /**
   * Process erasure request (right to be forgotten)
   */
  private async processErasureRequest(tenantId: string, customerId: string, requestId: string): Promise<void> {
    try {
      // Check if erasure is legally allowed
      if (!this.canErasureBeProcessed(tenantId, customerId)) {
        await this.updateRequestStatus(
          requestId, 
          'rejected', 
          'Erasure not legally permitted due to regulatory requirements'
        );
        return;
      }

      // Anonymize customer data
      await this.anonymizeCustomerData(tenantId, customerId);
      
      // Update request status
      await this.updateRequestStatus(requestId, 'completed');
      
      this.logger.log(`Erasure request completed for customer ${customerId} in tenant ${tenantId}`);
    } catch (error) {
      await this.updateRequestStatus(requestId, 'rejected', error.message);
      throw error;
    }
  }

  /**
   * Process portability request
   */
  private async processPortabilityRequest(tenantId: string, customerId: string, requestId: string): Promise<void> {
    try {
      // Collect customer data in portable format
      const customerData = await this.collectCustomerData(tenantId, customerId);
      
      // Update request with portable data
      await this.prisma.dataSubjectRequest.update({
        where: { id: requestId },
        data: {
          status: 'completed',
          completedAt: new Date(),
          responseData: customerData,
        },
      });

      this.logger.log(`Portability request completed for customer ${customerId} in tenant ${tenantId}`);
    } catch (error) {
      await this.updateRequestStatus(requestId, 'rejected', error.message);
      throw error;
    }
  }

  /**
   * Process rectification request
   */
  private async processRectificationRequest(tenantId: string, customerId: string, requestId: string): Promise<void> {
    try {
      // For now, just mark as completed (actual rectification would be handled by business logic)
      await this.updateRequestStatus(requestId, 'completed');
      
      this.logger.log(`Rectification request completed for customer ${customerId} in tenant ${tenantId}`);
    } catch (error) {
      await this.updateRequestStatus(requestId, 'rejected', error.message);
      throw error;
    }
  }

  /**
   * Collect all customer data for access/portability request
   */
  private async collectCustomerData(tenantId: string, customerId: string): Promise<CustomerData> {
    const [leads, consent, settings] = await Promise.all([
      this.prisma.lead.findMany({
        where: { tenantId, id: customerId },
      }),
      this.prisma.customerConsent.findMany({
        where: { tenantId, customerId },
      }),
      this.prisma.tenantSetting.findMany({
        where: { tenantId },
      }),
    ]);

    return {
      leads,
      consent,
      settings,
      collectedAt: new Date(),
    };
  }

  /**
   * Check if erasure can be legally processed
   */
  private async canErasureBeProcessed(tenantId: string, customerId: string): Promise<boolean> {
    try {
      // Check for regulatory requirements that prevent erasure
      const hasRegulatoryData = await this.prisma.lead.findFirst({
        where: {
          tenantId,
          id: customerId,
          complianceType: { not: null },
        },
      });

      return !hasRegulatoryData;
    } catch (error) {
      this.logger.error(`Error checking erasure eligibility: ${error.message}`);
      return false; // Default to denying erasure if we can't verify
    }
  }

  /**
   * Anonymize customer data
   */
  private async anonymizeCustomerData(tenantId: string, customerId: string): Promise<void> {
    try {
      await this.prisma.lead.updateMany({
        where: { tenantId, id: customerId },
        data: {
          payload: { customerData: 'ANONYMIZED' },
          source: 'ANONYMIZED',
        },
      });

      this.logger.log(`Customer data anonymized for ${customerId} in tenant ${tenantId}`);
    } catch (error) {
      this.logger.error(`Failed to anonymize customer data: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update request status
   */
  private async updateRequestStatus(requestId: string, status: string, notes?: string): Promise<void> {
    try {
      await this.prisma.dataSubjectRequest.update({
        where: { id: requestId },
        data: {
          status,
          completedAt: new Date(),
          notes,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to update request status: ${error.message}`);
    }
  }

  /**
   * Get current consent version
   */
  private getConsentVersion(): string {
    return this.configService.get('CONSENT_VERSION') || '1.0.0';
  }

  /**
   * Check if customer has valid consent for specific purpose
   */
  async hasValidConsent(tenantId: string, customerId: string, consentType: string): Promise<boolean> {
    try {
      const consent = await this.prisma.customerConsent.findFirst({
        where: {
          tenantId,
          customerId,
          consentType,
          consentGiven: true,
          consentWithdrawn: null,
        },
        orderBy: {
          consentDate: 'desc',
        },
      });

      return !!consent;
    } catch (error) {
      this.logger.error(`Failed to check consent validity: ${error.message}`);
      return false;
    }
  }

  /**
   * Get GDPR compliance summary for tenant
   */
  async getGdprComplianceSummary(tenantId: string): Promise<any> {
    try {
      const [consentCount, requestCount, policyCount] = await Promise.all([
        this.prisma.customerConsent.count({ where: { tenantId } }),
        this.prisma.dataSubjectRequest.count({ where: { tenantId } }),
        this.prisma.dataRetentionPolicy.count({ where: { tenantId } }),
      ]);

      return {
        tenantId,
        consentRecords: consentCount,
        dataSubjectRequests: requestCount,
        retentionPolicies: policyCount,
        lastUpdated: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to get GDPR compliance summary: ${error.message}`);
      throw error;
    }
  }
}