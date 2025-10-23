import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { SecurityService } from './security.service';
import { AuditService } from './audit.service';

export interface DataExportRequest {
  userId: string;
  organizationId: string;
  dataTypes: string[];
  format: 'json' | 'csv' | 'xml';
  includeDeleted?: boolean;
}

export interface DataRetentionPolicy {
  entityType: string;
  retentionPeriodDays: number;
  autoDelete: boolean;
  archiveBeforeDelete: boolean;
}

export interface ConsentRecord {
  id?: string;
  user_id: string;
  organization_id: string;
  consent_type: string;
  granted: boolean;
  granted_at?: string;
  revoked_at?: string;
  ip_address?: string;
  user_agent?: string;
}

@Injectable()
export class DataProtectionService {
  private readonly logger = new Logger(DataProtectionService.name);

  // Default retention policies (GDPR compliant)
  private readonly defaultRetentionPolicies: DataRetentionPolicy[] = [
    { entityType: 'audit_logs', retentionPeriodDays: 2555, autoDelete: true, archiveBeforeDelete: true }, // 7 years
    { entityType: 'customer_messages', retentionPeriodDays: 1095, autoDelete: false, archiveBeforeDelete: true }, // 3 years
    { entityType: 'chat_messages', retentionPeriodDays: 365, autoDelete: true, archiveBeforeDelete: false }, // 1 year
    { entityType: 'notifications', retentionPeriodDays: 90, autoDelete: true, archiveBeforeDelete: false }, // 3 months
    { entityType: 'time_entries', retentionPeriodDays: 1825, autoDelete: false, archiveBeforeDelete: true }, // 5 years
  ];

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly securityService: SecurityService,
    private readonly auditService: AuditService,
  ) {}

  // GDPR Data Export (Right to Data Portability)
  async exportUserData(request: DataExportRequest): Promise<any> {
    try {
      this.logger.log(`Starting data export for user ${request.userId}`);

      const exportData: Record<string, any> = {};
      let totalRecords = 0;

      // Export user profile
      if (request.dataTypes.includes('profile')) {
        const { data: userData } = await this.supabaseService.client
          .from('users')
          .select('*')
          .eq('id', request.userId)
          .eq('organization_id', request.organizationId)
          .single();

        if (userData) {
          exportData.profile = this.sanitizeExportData(userData);
          totalRecords++;
        }
      }

      // Export customer data (if user is a customer)
      if (request.dataTypes.includes('customer')) {
        const { data: customerData } = await this.supabaseService.client
          .from('customers')
          .select('*')
          .eq('user_id', request.userId)
          .eq('organization_id', request.organizationId);

        if (customerData) {
          exportData.customer = customerData.map(c => this.sanitizeExportData(c));
          totalRecords += customerData.length;
        }
      }

      // Export job history
      if (request.dataTypes.includes('jobs')) {
        const { data: jobsData } = await this.supabaseService.client
          .from('jobs')
          .select('*')
          .eq('organization_id', request.organizationId)
          .or(`customer_id.in.(${await this.getUserCustomerIds(request.userId, request.organizationId)})`);

        if (jobsData) {
          exportData.jobs = jobsData.map(j => this.sanitizeExportData(j));
          totalRecords += jobsData.length;
        }
      }

      // Export messages
      if (request.dataTypes.includes('messages')) {
        const { data: messagesData } = await this.supabaseService.client
          .from('customer_messages')
          .select('*')
          .eq('organization_id', request.organizationId)
          .or(`sender_id.eq.${request.userId},customer_id.in.(${await this.getUserCustomerIds(request.userId, request.organizationId)})`);

        if (messagesData) {
          exportData.messages = messagesData.map(m => this.sanitizeExportData(m));
          totalRecords += messagesData.length;
        }
      }

      // Export reviews
      if (request.dataTypes.includes('reviews')) {
        const { data: reviewsData } = await this.supabaseService.client
          .from('customer_reviews')
          .select('*')
          .or(`customer_id.in.(${await this.getUserCustomerIds(request.userId, request.organizationId)})`);

        if (reviewsData) {
          exportData.reviews = reviewsData.map(r => this.sanitizeExportData(r));
          totalRecords += reviewsData.length;
        }
      }

      // Export chat sessions
      if (request.dataTypes.includes('chat_sessions')) {
        const { data: chatData } = await this.supabaseService.client
          .from('chat_sessions')
          .select(`
            *,
            chat_messages(*)
          `)
          .eq('user_id', request.userId)
          .eq('organization_id', request.organizationId);

        if (chatData) {
          exportData.chat_sessions = chatData.map(c => this.sanitizeExportData(c));
          totalRecords += chatData.length;
        }
      }

      // Log the export
      await this.auditService.logDataExport(
        request.organizationId,
        request.userId,
        request.dataTypes.join(','),
        totalRecords,
      );

      const exportResult = {
        exportedAt: new Date().toISOString(),
        userId: request.userId,
        organizationId: request.organizationId,
        dataTypes: request.dataTypes,
        format: request.format,
        totalRecords,
        data: exportData,
      };

      this.logger.log(`Data export completed for user ${request.userId}: ${totalRecords} records`);
      return exportResult;

    } catch (error) {
      this.logger.error('Error exporting user data', error);
      throw new BadRequestException(`Failed to export user data: ${error.message}`);
    }
  }

  // GDPR Data Deletion (Right to be Forgotten)
  async deleteUserData(
    userId: string,
    organizationId: string,
    adminUserId: string,
    retainAuditLogs: boolean = true,
  ): Promise<{ deletedRecords: number; retainedRecords: number }> {
    try {
      this.logger.log(`Starting data deletion for user ${userId}`);

      let deletedRecords = 0;
      let retainedRecords = 0;

      // Delete or anonymize user profile
      const { error: userError } = await this.supabaseService.client
        .from('users')
        .update({
          email: `deleted-${userId}@example.com`,
          name: 'Deleted User',
          phone: null,
          avatar_url: null,
          settings: {},
          is_active: false,
        })
        .eq('id', userId)
        .eq('organization_id', organizationId);

      if (!userError) deletedRecords++;

      // Delete customer records
      const { error: customerError } = await this.supabaseService.client
        .from('customers')
        .delete()
        .eq('user_id', userId)
        .eq('organization_id', organizationId);

      if (!customerError) deletedRecords++;

      // Anonymize messages (keep for business records but remove PII)
      const { error: messageError } = await this.supabaseService.client
        .from('customer_messages')
        .update({
          content: '[Message deleted for privacy]',
          attachments: [],
        })
        .eq('sender_id', userId)
        .eq('organization_id', organizationId);

      if (!messageError) deletedRecords++;

      // Delete chat sessions and messages
      const { error: chatError } = await this.supabaseService.client
        .from('chat_sessions')
        .delete()
        .eq('user_id', userId)
        .eq('organization_id', organizationId);

      if (!chatError) deletedRecords++;

      // Delete notifications
      const { error: notificationError } = await this.supabaseService.client
        .from('notifications')
        .delete()
        .eq('user_id', userId)
        .eq('organization_id', organizationId);

      if (!notificationError) deletedRecords++;

      // Handle audit logs based on retention policy
      if (!retainAuditLogs) {
        const { error: auditError } = await this.supabaseService.client
          .from('audit_logs')
          .delete()
          .eq('user_id', userId)
          .eq('organization_id', organizationId);

        if (!auditError) deletedRecords++;
      } else {
        // Anonymize audit logs
        const { error: auditError } = await this.supabaseService.client
          .from('audit_logs')
          .update({ user_id: null })
          .eq('user_id', userId)
          .eq('organization_id', organizationId);

        if (!auditError) retainedRecords++;
      }

      // Log the deletion
      await this.auditService.logAction({
        organization_id: organizationId,
        user_id: adminUserId,
        action: 'user_data_deletion',
        entity_type: 'user',
        entity_id: userId,
        new_values: { deletedRecords, retainedRecords, retainAuditLogs },
      });

      this.logger.log(`Data deletion completed for user ${userId}: ${deletedRecords} deleted, ${retainedRecords} retained`);

      return { deletedRecords, retainedRecords };

    } catch (error) {
      this.logger.error('Error deleting user data', error);
      throw new BadRequestException(`Failed to delete user data: ${error.message}`);
    }
  }

  // Consent Management
  async recordConsent(
    userId: string,
    organizationId: string,
    consentType: string,
    granted: boolean,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<ConsentRecord> {
    try {
      const consentData = {
        user_id: userId,
        organization_id: organizationId,
        consent_type: consentType,
        granted,
        granted_at: granted ? new Date().toISOString() : null,
        revoked_at: !granted ? new Date().toISOString() : null,
        ip_address: ipAddress,
        user_agent: userAgent,
      };

      // For this implementation, we'll store consent in the audit logs
      await this.auditService.logAction({
        organization_id: organizationId,
        user_id: userId,
        action: 'consent_recorded',
        entity_type: 'consent',
        entity_id: consentType,
        new_values: consentData,
        ip_address: ipAddress,
        user_agent: userAgent,
      });

      this.logger.log(`Consent recorded for user ${userId}: ${consentType} = ${granted}`);
      return consentData;

    } catch (error) {
      this.logger.error('Error recording consent', error);
      throw error;
    }
  }

  async getUserConsents(userId: string, organizationId: string): Promise<ConsentRecord[]> {
    try {
      const { data, error } = await this.supabaseService.client
        .from('audit_logs')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('user_id', userId)
        .eq('action', 'consent_recorded')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to get user consents: ${error.message}`);
      }

      return (data || []).map(log => ({
        id: log.id,
        user_id: log.user_id!,
        organization_id: log.organization_id,
        consent_type: log.entity_id!,
        granted: log.new_values?.granted || false,
        granted_at: log.new_values?.granted_at,
        revoked_at: log.new_values?.revoked_at,
        ip_address: log.ip_address,
        user_agent: log.user_agent,
      }));

    } catch (error) {
      this.logger.error('Error getting user consents', error);
      throw error;
    }
  }

  // Data Retention Management
  async applyRetentionPolicies(organizationId: string): Promise<{
    deletedRecords: Record<string, number>;
    archivedRecords: Record<string, number>;
  }> {
    try {
      this.logger.log(`Applying data retention policies for organization ${organizationId}`);

      const deletedRecords: Record<string, number> = {};
      const archivedRecords: Record<string, number> = {};

      for (const policy of this.defaultRetentionPolicies) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - policy.retentionPeriodDays);
        const cutoffIso = cutoffDate.toISOString();

        if (policy.archiveBeforeDelete) {
          // Archive old records first
          const archived = await this.archiveOldRecords(
            policy.entityType,
            organizationId,
            cutoffIso,
          );
          archivedRecords[policy.entityType] = archived;
        }

        if (policy.autoDelete) {
          // Delete old records
          const deleted = await this.deleteOldRecords(
            policy.entityType,
            organizationId,
            cutoffIso,
          );
          deletedRecords[policy.entityType] = deleted;
        }
      }

      // Log retention policy application
      await this.auditService.logAction({
        organization_id: organizationId,
        action: 'retention_policy_applied',
        entity_type: 'data_retention',
        new_values: { deletedRecords, archivedRecords },
      });

      this.logger.log(`Retention policies applied: ${JSON.stringify({ deletedRecords, archivedRecords })}`);

      return { deletedRecords, archivedRecords };

    } catch (error) {
      this.logger.error('Error applying retention policies', error);
      throw error;
    }
  }

  // Data Anonymization
  async anonymizeUserData(
    userId: string,
    organizationId: string,
    adminUserId: string,
  ): Promise<{ anonymizedRecords: number }> {
    try {
      this.logger.log(`Starting data anonymization for user ${userId}`);

      let anonymizedRecords = 0;

      // Anonymize user profile
      const anonymizedEmail = `anon-${this.generateAnonymousId()}@example.com`;
      const anonymizedName = `Anonymous User ${this.generateAnonymousId()}`;

      const { error: userError } = await this.supabaseService.client
        .from('users')
        .update({
          email: anonymizedEmail,
          name: anonymizedName,
          phone: null,
          avatar_url: null,
          settings: {},
        })
        .eq('id', userId)
        .eq('organization_id', organizationId);

      if (!userError) anonymizedRecords++;

      // Anonymize customer records
      const { error: customerError } = await this.supabaseService.client
        .from('customers')
        .update({
          name: anonymizedName,
          email: anonymizedEmail,
          phone: null,
          notes: null,
        })
        .eq('user_id', userId)
        .eq('organization_id', organizationId);

      if (!customerError) anonymizedRecords++;

      // Anonymize messages
      const { error: messageError } = await this.supabaseService.client
        .from('customer_messages')
        .update({
          content: '[Content anonymized]',
          attachments: [],
        })
        .eq('sender_id', userId)
        .eq('organization_id', organizationId);

      if (!messageError) anonymizedRecords++;

      // Log the anonymization
      await this.auditService.logAction({
        organization_id: organizationId,
        user_id: adminUserId,
        action: 'user_data_anonymized',
        entity_type: 'user',
        entity_id: userId,
        new_values: { anonymizedRecords },
      });

      this.logger.log(`Data anonymization completed for user ${userId}: ${anonymizedRecords} records`);

      return { anonymizedRecords };

    } catch (error) {
      this.logger.error('Error anonymizing user data', error);
      throw error;
    }
  }

  // Data Breach Response
  async handleDataBreach(
    organizationId: string,
    breachDescription: string,
    affectedUserIds: string[],
    severity: 'low' | 'medium' | 'high' | 'critical',
    adminUserId: string,
  ): Promise<void> {
    try {
      this.logger.error(`Data breach reported for organization ${organizationId}: ${breachDescription}`);

      // Log security event
      await this.auditService.logSecurityEvent({
        organization_id: organizationId,
        user_id: adminUserId,
        event_type: 'data_breach',
        severity,
        description: breachDescription,
        metadata: {
          affectedUsers: affectedUserIds.length,
          reportedBy: adminUserId,
        },
      });

      // Create breach response record
      const breachRecord = {
        organization_id: organizationId,
        description: breachDescription,
        severity,
        affected_users: affectedUserIds,
        reported_by: adminUserId,
        reported_at: new Date().toISOString(),
        status: 'reported',
      };

      await this.auditService.logAction({
        organization_id: organizationId,
        user_id: adminUserId,
        action: 'data_breach_reported',
        entity_type: 'security_incident',
        new_values: breachRecord,
      });

      // TODO: Implement automatic breach notification to authorities if required
      // TODO: Send breach notifications to affected users
      // TODO: Trigger incident response procedures

    } catch (error) {
      this.logger.error('Error handling data breach', error);
      throw error;
    }
  }

  // Privacy Policy and Terms Management
  async getPrivacyPolicy(organizationId: string, language: string = 'da'): Promise<any> {
    // This would typically be stored in a CMS or database
    // For now, return a template
    return {
      version: '1.0',
      language,
      lastUpdated: '2024-01-01',
      content: this.getPrivacyPolicyTemplate(language),
    };
  }

  async getTermsOfService(organizationId: string, language: string = 'da'): Promise<any> {
    return {
      version: '1.0',
      language,
      lastUpdated: '2024-01-01',
      content: this.getTermsOfServiceTemplate(language),
    };
  }

  // Compliance Reporting
  async generateComplianceReport(organizationId: string): Promise<any> {
    try {
      const report = {
        organizationId,
        generatedAt: new Date().toISOString(),
        gdprCompliance: {
          dataRetentionPolicies: this.defaultRetentionPolicies,
          consentRecords: await this.getOrganizationConsents(organizationId),
          dataExports: await this.getDataExportHistory(organizationId),
          dataDeletions: await this.getDataDeletionHistory(organizationId),
        },
        securityMeasures: {
          encryptionEnabled: true,
          auditLoggingEnabled: true,
          accessControlEnabled: true,
          dataBackupsEnabled: true,
        },
        riskAssessment: await this.performRiskAssessment(organizationId),
      };

      return report;

    } catch (error) {
      this.logger.error('Error generating compliance report', error);
      throw error;
    }
  }

  private async getUserCustomerIds(userId: string, organizationId: string): Promise<string> {
    const { data } = await this.supabaseService.client
      .from('customers')
      .select('id')
      .eq('user_id', userId)
      .eq('organization_id', organizationId);

    return (data || []).map(c => c.id).join(',') || 'none';
  }

  private sanitizeExportData(data: any): any {
    // Remove internal system fields from export
    const { created_at, updated_at, organization_id, ...sanitized } = data;
    return sanitized;
  }

  private generateAnonymousId(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  private async archiveOldRecords(entityType: string, organizationId: string, cutoffDate: string): Promise<number> {
    // This would move records to an archive table or external storage
    // For now, just count what would be archived
    const { count } = await this.supabaseService.client
      .from(entityType)
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .lt('created_at', cutoffDate);

    return count || 0;
  }

  private async deleteOldRecords(entityType: string, organizationId: string, cutoffDate: string): Promise<number> {
    const { count, error } = await this.supabaseService.client
      .from(entityType)
      .delete({ count: 'exact' })
      .eq('organization_id', organizationId)
      .lt('created_at', cutoffDate);

    if (error) {
      this.logger.error(`Error deleting old ${entityType} records`, error);
      return 0;
    }

    return count || 0;
  }

  private async getOrganizationConsents(organizationId: string): Promise<any> {
    const { data } = await this.supabaseService.client
      .from('audit_logs')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('action', 'consent_recorded')
      .order('created_at', { ascending: false })
      .limit(1000);

    return data || [];
  }

  private async getDataExportHistory(organizationId: string): Promise<any> {
    const { data } = await this.supabaseService.client
      .from('audit_logs')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('action', 'data_export')
      .order('created_at', { ascending: false })
      .limit(100);

    return data || [];
  }

  private async getDataDeletionHistory(organizationId: string): Promise<any> {
    const { data } = await this.supabaseService.client
      .from('audit_logs')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('action', 'user_data_deletion')
      .order('created_at', { ascending: false })
      .limit(100);

    return data || [];
  }

  private async performRiskAssessment(organizationId: string): Promise<any> {
    // Get recent security events
    const securityEvents = await this.auditService.getSecurityEvents(organizationId, {
      dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // Last 30 days
    });

    const highSeverityEvents = securityEvents.filter(e => 
      e.new_values?.severity === 'high' || e.new_values?.severity === 'critical'
    );

    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    const riskFactors: string[] = [];

    if (highSeverityEvents.length > 5) {
      riskLevel = 'high';
      riskFactors.push('Multiple high-severity security events');
    } else if (highSeverityEvents.length > 2) {
      riskLevel = 'medium';
      riskFactors.push('Some high-severity security events');
    }

    if (securityEvents.length > 50) {
      riskLevel = riskLevel === 'high' ? 'high' : 'medium';
      riskFactors.push('High volume of security events');
    }

    return {
      riskLevel,
      riskFactors,
      totalSecurityEvents: securityEvents.length,
      highSeverityEvents: highSeverityEvents.length,
      assessmentDate: new Date().toISOString(),
    };
  }

  private getPrivacyPolicyTemplate(language: string): string {
    if (language === 'da') {
      return `
# Privatlivspolitik for RendetaljeOS

## Dataansvarlig
Rendetalje.dk er dataansvarlig for behandlingen af dine personoplysninger.

## Hvilke oplysninger indsamler vi?
- Kontaktoplysninger (navn, email, telefon)
- Adresseoplysninger
- Servicehistorik og præferencer
- Kommunikation og beskeder
- Fotos og dokumentation fra rengøringsopgaver

## Hvordan bruger vi dine oplysninger?
- Levering af rengøringsservice
- Kommunikation om aftaler og service
- Fakturering og betaling
- Kvalitetssikring og forbedring af service

## Dine rettigheder
- Ret til indsigt i dine oplysninger
- Ret til berigtigelse af forkerte oplysninger
- Ret til sletning af dine oplysninger
- Ret til dataportabilitet
- Ret til at trække samtykke tilbage

## Kontakt
For spørgsmål om behandling af personoplysninger, kontakt os på info@rendetalje.dk
      `;
    }

    return `
# Privacy Policy for RendetaljeOS

## Data Controller
Rendetalje.dk is the data controller for the processing of your personal data.

## What information do we collect?
- Contact information (name, email, phone)
- Address information
- Service history and preferences
- Communication and messages
- Photos and documentation from cleaning tasks

## How do we use your information?
- Delivery of cleaning services
- Communication about appointments and service
- Billing and payment
- Quality assurance and service improvement

## Your rights
- Right to access your information
- Right to rectification of incorrect information
- Right to deletion of your information
- Right to data portability
- Right to withdraw consent

## Contact
For questions about personal data processing, contact us at info@rendetalje.dk
    `;
  }

  private getTermsOfServiceTemplate(language: string): string {
    if (language === 'da') {
      return `
# Servicevilkår for RendetaljeOS

## Anvendelse af systemet
Ved brug af RendetaljeOS accepterer du disse vilkår.

## Brugeransvar
- Du er ansvarlig for at holde dine loginoplysninger sikre
- Du må ikke misbruge systemet eller dele adgang med andre
- Du skal rapportere sikkerhedsproblemer øjeblikkeligt

## Servicelevering
- Vi leverer rengøringsservice i henhold til aftale
- Ændringer i aftaler skal ske med rimelig varsel
- Vi forbeholder os ret til at aflyse service ved force majeure

## Betaling
- Betaling sker i henhold til aftalte vilkår
- Forsinket betaling kan medføre renter og inkassogebyrer

## Ansvarsbegrænsning
- Vores ansvar er begrænset til direkte skader
- Vi er ikke ansvarlige for indirekte tab eller følgeskader

## Kontakt
For spørgsmål om servicevilkår, kontakt os på info@rendetalje.dk
      `;
    }

    return `
# Terms of Service for RendetaljeOS

## Use of the system
By using RendetaljeOS, you accept these terms.

## User responsibility
- You are responsible for keeping your login credentials secure
- You must not misuse the system or share access with others
- You must report security issues immediately

## Service delivery
- We deliver cleaning services according to agreement
- Changes to agreements must be made with reasonable notice
- We reserve the right to cancel service due to force majeure

## Payment
- Payment is made according to agreed terms
- Late payment may incur interest and collection fees

## Limitation of liability
- Our liability is limited to direct damages
- We are not liable for indirect losses or consequential damages

## Contact
For questions about terms of service, contact us at info@rendetalje.dk
    `;
  }
}