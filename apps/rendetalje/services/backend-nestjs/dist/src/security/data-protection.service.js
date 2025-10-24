"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var DataProtectionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataProtectionService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
const security_service_1 = require("./security.service");
const audit_service_1 = require("./audit.service");
let DataProtectionService = DataProtectionService_1 = class DataProtectionService {
    constructor(supabaseService, securityService, auditService) {
        this.supabaseService = supabaseService;
        this.securityService = securityService;
        this.auditService = auditService;
        this.logger = new common_1.Logger(DataProtectionService_1.name);
        this.defaultRetentionPolicies = [
            { entityType: 'audit_logs', retentionPeriodDays: 2555, autoDelete: true, archiveBeforeDelete: true },
            { entityType: 'customer_messages', retentionPeriodDays: 1095, autoDelete: false, archiveBeforeDelete: true },
            { entityType: 'chat_messages', retentionPeriodDays: 365, autoDelete: true, archiveBeforeDelete: false },
            { entityType: 'notifications', retentionPeriodDays: 90, autoDelete: true, archiveBeforeDelete: false },
            { entityType: 'time_entries', retentionPeriodDays: 1825, autoDelete: false, archiveBeforeDelete: true },
        ];
    }
    async exportUserData(request) {
        try {
            this.logger.log(`Starting data export for user ${request.userId}`);
            const exportData = {};
            let totalRecords = 0;
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
            await this.auditService.logDataExport(request.organizationId, request.userId, request.dataTypes.join(','), totalRecords);
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
        }
        catch (error) {
            this.logger.error('Error exporting user data', error);
            throw new common_1.BadRequestException(`Failed to export user data: ${error.message}`);
        }
    }
    async deleteUserData(userId, organizationId, adminUserId, retainAuditLogs = true) {
        try {
            this.logger.log(`Starting data deletion for user ${userId}`);
            let deletedRecords = 0;
            let retainedRecords = 0;
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
            if (!userError)
                deletedRecords++;
            const { error: customerError } = await this.supabaseService.client
                .from('customers')
                .delete()
                .eq('user_id', userId)
                .eq('organization_id', organizationId);
            if (!customerError)
                deletedRecords++;
            const { error: messageError } = await this.supabaseService.client
                .from('customer_messages')
                .update({
                content: '[Message deleted for privacy]',
                attachments: [],
            })
                .eq('sender_id', userId)
                .eq('organization_id', organizationId);
            if (!messageError)
                deletedRecords++;
            const { error: chatError } = await this.supabaseService.client
                .from('chat_sessions')
                .delete()
                .eq('user_id', userId)
                .eq('organization_id', organizationId);
            if (!chatError)
                deletedRecords++;
            const { error: notificationError } = await this.supabaseService.client
                .from('notifications')
                .delete()
                .eq('user_id', userId)
                .eq('organization_id', organizationId);
            if (!notificationError)
                deletedRecords++;
            if (!retainAuditLogs) {
                const { error: auditError } = await this.supabaseService.client
                    .from('audit_logs')
                    .delete()
                    .eq('user_id', userId)
                    .eq('organization_id', organizationId);
                if (!auditError)
                    deletedRecords++;
            }
            else {
                const { error: auditError } = await this.supabaseService.client
                    .from('audit_logs')
                    .update({ user_id: null })
                    .eq('user_id', userId)
                    .eq('organization_id', organizationId);
                if (!auditError)
                    retainedRecords++;
            }
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
        }
        catch (error) {
            this.logger.error('Error deleting user data', error);
            throw new common_1.BadRequestException(`Failed to delete user data: ${error.message}`);
        }
    }
    async recordConsent(userId, organizationId, consentType, granted, ipAddress, userAgent) {
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
        }
        catch (error) {
            this.logger.error('Error recording consent', error);
            throw error;
        }
    }
    async getUserConsents(userId, organizationId) {
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
                user_id: log.user_id,
                organization_id: log.organization_id,
                consent_type: log.entity_id,
                granted: log.new_values?.granted || false,
                granted_at: log.new_values?.granted_at,
                revoked_at: log.new_values?.revoked_at,
                ip_address: log.ip_address,
                user_agent: log.user_agent,
            }));
        }
        catch (error) {
            this.logger.error('Error getting user consents', error);
            throw error;
        }
    }
    async applyRetentionPolicies(organizationId) {
        try {
            this.logger.log(`Applying data retention policies for organization ${organizationId}`);
            const deletedRecords = {};
            const archivedRecords = {};
            for (const policy of this.defaultRetentionPolicies) {
                const cutoffDate = new Date();
                cutoffDate.setDate(cutoffDate.getDate() - policy.retentionPeriodDays);
                const cutoffIso = cutoffDate.toISOString();
                if (policy.archiveBeforeDelete) {
                    const archived = await this.archiveOldRecords(policy.entityType, organizationId, cutoffIso);
                    archivedRecords[policy.entityType] = archived;
                }
                if (policy.autoDelete) {
                    const deleted = await this.deleteOldRecords(policy.entityType, organizationId, cutoffIso);
                    deletedRecords[policy.entityType] = deleted;
                }
            }
            await this.auditService.logAction({
                organization_id: organizationId,
                action: 'retention_policy_applied',
                entity_type: 'data_retention',
                new_values: { deletedRecords, archivedRecords },
            });
            this.logger.log(`Retention policies applied: ${JSON.stringify({ deletedRecords, archivedRecords })}`);
            return { deletedRecords, archivedRecords };
        }
        catch (error) {
            this.logger.error('Error applying retention policies', error);
            throw error;
        }
    }
    async anonymizeUserData(userId, organizationId, adminUserId) {
        try {
            this.logger.log(`Starting data anonymization for user ${userId}`);
            let anonymizedRecords = 0;
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
            if (!userError)
                anonymizedRecords++;
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
            if (!customerError)
                anonymizedRecords++;
            const { error: messageError } = await this.supabaseService.client
                .from('customer_messages')
                .update({
                content: '[Content anonymized]',
                attachments: [],
            })
                .eq('sender_id', userId)
                .eq('organization_id', organizationId);
            if (!messageError)
                anonymizedRecords++;
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
        }
        catch (error) {
            this.logger.error('Error anonymizing user data', error);
            throw error;
        }
    }
    async handleDataBreach(organizationId, breachDescription, affectedUserIds, severity, adminUserId) {
        try {
            this.logger.error(`Data breach reported for organization ${organizationId}: ${breachDescription}`);
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
        }
        catch (error) {
            this.logger.error('Error handling data breach', error);
            throw error;
        }
    }
    async getPrivacyPolicy(organizationId, language = 'da') {
        return {
            version: '1.0',
            language,
            lastUpdated: '2024-01-01',
            content: this.getPrivacyPolicyTemplate(language),
        };
    }
    async getTermsOfService(organizationId, language = 'da') {
        return {
            version: '1.0',
            language,
            lastUpdated: '2024-01-01',
            content: this.getTermsOfServiceTemplate(language),
        };
    }
    async generateComplianceReport(organizationId) {
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
        }
        catch (error) {
            this.logger.error('Error generating compliance report', error);
            throw error;
        }
    }
    async getUserCustomerIds(userId, organizationId) {
        const { data } = await this.supabaseService.client
            .from('customers')
            .select('id')
            .eq('user_id', userId)
            .eq('organization_id', organizationId);
        return (data || []).map(c => c.id).join(',') || 'none';
    }
    sanitizeExportData(data) {
        const { created_at, updated_at, organization_id, ...sanitized } = data;
        return sanitized;
    }
    generateAnonymousId() {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    }
    async archiveOldRecords(entityType, organizationId, cutoffDate) {
        const { count } = await this.supabaseService.client
            .from(entityType)
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', organizationId)
            .lt('created_at', cutoffDate);
        return count || 0;
    }
    async deleteOldRecords(entityType, organizationId, cutoffDate) {
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
    async getOrganizationConsents(organizationId) {
        const { data } = await this.supabaseService.client
            .from('audit_logs')
            .select('*')
            .eq('organization_id', organizationId)
            .eq('action', 'consent_recorded')
            .order('created_at', { ascending: false })
            .limit(1000);
        return data || [];
    }
    async getDataExportHistory(organizationId) {
        const { data } = await this.supabaseService.client
            .from('audit_logs')
            .select('*')
            .eq('organization_id', organizationId)
            .eq('action', 'data_export')
            .order('created_at', { ascending: false })
            .limit(100);
        return data || [];
    }
    async getDataDeletionHistory(organizationId) {
        const { data } = await this.supabaseService.client
            .from('audit_logs')
            .select('*')
            .eq('organization_id', organizationId)
            .eq('action', 'user_data_deletion')
            .order('created_at', { ascending: false })
            .limit(100);
        return data || [];
    }
    async performRiskAssessment(organizationId) {
        const securityEvents = await this.auditService.getSecurityEvents(organizationId, {
            dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        });
        const highSeverityEvents = securityEvents.filter(e => e.new_values?.severity === 'high' || e.new_values?.severity === 'critical');
        let riskLevel = 'low';
        const riskFactors = [];
        if (highSeverityEvents.length > 5) {
            riskLevel = 'high';
            riskFactors.push('Multiple high-severity security events');
        }
        else if (highSeverityEvents.length > 2) {
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
    getPrivacyPolicyTemplate(language) {
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
    getTermsOfServiceTemplate(language) {
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
};
exports.DataProtectionService = DataProtectionService;
exports.DataProtectionService = DataProtectionService = DataProtectionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService,
        security_service_1.SecurityService,
        audit_service_1.AuditService])
], DataProtectionService);
//# sourceMappingURL=data-protection.service.js.map