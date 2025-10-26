import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { ScopesGuard } from '../auth/scopes.guard';
import { RequireScopes } from '../auth/scopes.decorator';
import { SCOPE_ADMIN, SCOPE_MANAGE_LEADS, SCOPE_READ_LEADS } from '../auth/scopes.constants';
import { GdprService, ConsentRequest, DataSubjectRequest } from './gdpr.service';

@Controller('gdpr')
@UseGuards(ApiKeyGuard, ScopesGuard)
export class GdprController {
  constructor(private readonly gdprService: GdprService) {}

  // Customer Consent Management
  @Post('consent')
  @RequireScopes([SCOPE_MANAGE_LEADS])
  async recordConsent(
    @Body() consent: ConsentRequest,
    @Request() req: any,
  ) {
    return this.gdprService.recordConsent(req.tenantId, consent);
  }

  @Post('consent/withdraw')
  @RequireScopes([SCOPE_MANAGE_LEADS])
  async withdrawConsent(
    @Body() body: { customerId: string; consentType: string },
    @Request() req: any,
  ) {
    return this.gdprService.withdrawConsent(req.tenantId, body.customerId, body.consentType);
  }

  @Get('consent/:customerId')
  @RequireScopes([SCOPE_READ_LEADS])
  async getCustomerConsentStatus(
    @Param('customerId') customerId: string,
    @Request() req: any,
  ) {
    return this.gdprService.getCustomerConsentStatus(req.tenantId, customerId);
  }

  @Get('consent/:customerId/validate/:consentType')
  @RequireScopes([SCOPE_READ_LEADS])
  async validateConsent(
    @Param('customerId') customerId: string,
    @Param('consentType') consentType: string,
    @Request() req: any,
  ) {
    const hasConsent = await this.gdprService.hasValidConsent(req.tenantId, customerId, consentType);
    return {
      customerId,
      consentType,
      hasValidConsent: hasConsent,
      validatedAt: new Date(),
    };
  }

  // Data Subject Requests
  @Post('data-subject-request')
  @RequireScopes([SCOPE_ADMIN])
  async processDataSubjectRequest(
    @Body() request: DataSubjectRequest,
    @Request() req: any,
  ) {
    const requestId = await this.gdprService.processDataSubjectRequest(req.tenantId, request);
    return {
      requestId,
      status: 'processing',
      message: 'Data subject request submitted successfully',
    };
  }

  @Get('data-subject-request/:requestId')
  @RequireScopes([SCOPE_ADMIN])
  async getDataSubjectRequestStatus(
    @Param('requestId') requestId: string,
    @Request() req: any,
  ) {
    return this.gdprService.getDataSubjectRequestStatus(req.tenantId, requestId);
  }

  // Data Retention Policies
  @Get('retention-policies')
  @RequireScopes([SCOPE_ADMIN])
  async getDataRetentionPolicies(@Request() req: any) {
    return this.gdprService.getDataRetentionPolicies(req.tenantId);
  }

  @Post('retention-policies/:dataType')
  @RequireScopes([SCOPE_ADMIN])
  async updateDataRetentionPolicy(
    @Param('dataType') dataType: string,
    @Body() updates: any,
    @Request() req: any,
  ) {
    await this.gdprService.updateDataRetentionPolicy(req.tenantId, dataType, updates);
    return {
      message: 'Data retention policy updated successfully',
      dataType,
      updatedAt: new Date(),
    };
  }

  // GDPR Compliance Summary
  @Get('compliance-summary')
  @RequireScopes([SCOPE_ADMIN])
  async getGdprComplianceSummary(@Request() req: any) {
    return this.gdprService.getGdprComplianceSummary(req.tenantId);
  }

  // Health Check
  @Get('health')
  async getHealth() {
    return {
      status: 'healthy',
      service: 'gdpr-controller',
      timestamp: new Date().toISOString(),
      features: [
        'customer-consent-management',
        'data-subject-requests',
        'data-retention-policies',
        'gdpr-compliance-monitoring',
      ],
    };
  }

  // GDPR Rights Information
  @Get('rights')
  async getGdprRights() {
    return {
      rights: [
        {
          right: 'Right to Access',
          description: 'Customers can request access to their personal data',
          endpoint: 'POST /gdpr/data-subject-request',
          requestType: 'access',
        },
        {
          right: 'Right to Rectification',
          description: 'Customers can request correction of inaccurate data',
          endpoint: 'POST /gdpr/data-subject-request',
          requestType: 'rectification',
        },
        {
          right: 'Right to Erasure',
          description: 'Customers can request deletion of their data (Right to be Forgotten)',
          endpoint: 'POST /gdpr/data-subject-request',
          requestType: 'erasure',
        },
        {
          right: 'Right to Data Portability',
          description: 'Customers can request their data in a portable format',
          endpoint: 'POST /gdpr/data-subject-request',
          requestType: 'portability',
        },
        {
          right: 'Right to Object',
          description: 'Customers can object to data processing',
          endpoint: 'POST /gdpr/consent/withdraw',
        },
        {
          right: 'Right to Withdraw Consent',
          description: 'Customers can withdraw previously given consent',
          endpoint: 'POST /gdpr/consent/withdraw',
        },
      ],
      legalBasis: [
        {
          basis: 'Consent',
          description: 'Customer has given explicit consent for data processing',
        },
        {
          basis: 'Legitimate Interest',
          description: 'Data processing is necessary for legitimate business interests',
        },
        {
          basis: 'Contract',
          description: 'Data processing is necessary to fulfill a contract',
        },
        {
          basis: 'Legal Obligation',
          description: 'Data processing is required by law',
        },
      ],
      dataTypes: [
        {
          type: 'leads',
          retentionPeriod: '7 years',
          reason: 'Business records retention requirement',
        },
        {
          type: 'customer_data',
          retentionPeriod: '3 years',
          reason: 'GDPR compliance - customer data retention',
        },
        {
          type: 'financial_records',
          retentionPeriod: '10 years',
          reason: 'Tax and accounting compliance requirements',
        },
      ],
    };
  }
}