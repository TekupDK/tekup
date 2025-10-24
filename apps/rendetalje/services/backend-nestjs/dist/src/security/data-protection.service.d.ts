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
export declare class DataProtectionService {
    private readonly supabaseService;
    private readonly securityService;
    private readonly auditService;
    private readonly logger;
    private readonly defaultRetentionPolicies;
    constructor(supabaseService: SupabaseService, securityService: SecurityService, auditService: AuditService);
    exportUserData(request: DataExportRequest): Promise<any>;
    deleteUserData(userId: string, organizationId: string, adminUserId: string, retainAuditLogs?: boolean): Promise<{
        deletedRecords: number;
        retainedRecords: number;
    }>;
    recordConsent(userId: string, organizationId: string, consentType: string, granted: boolean, ipAddress?: string, userAgent?: string): Promise<ConsentRecord>;
    getUserConsents(userId: string, organizationId: string): Promise<ConsentRecord[]>;
    applyRetentionPolicies(organizationId: string): Promise<{
        deletedRecords: Record<string, number>;
        archivedRecords: Record<string, number>;
    }>;
    anonymizeUserData(userId: string, organizationId: string, adminUserId: string): Promise<{
        anonymizedRecords: number;
    }>;
    handleDataBreach(organizationId: string, breachDescription: string, affectedUserIds: string[], severity: 'low' | 'medium' | 'high' | 'critical', adminUserId: string): Promise<void>;
    getPrivacyPolicy(organizationId: string, language?: string): Promise<any>;
    getTermsOfService(organizationId: string, language?: string): Promise<any>;
    generateComplianceReport(organizationId: string): Promise<any>;
    private getUserCustomerIds;
    private sanitizeExportData;
    private generateAnonymousId;
    private archiveOldRecords;
    private deleteOldRecords;
    private getOrganizationConsents;
    private getDataExportHistory;
    private getDataDeletionHistory;
    private performRiskAssessment;
    private getPrivacyPolicyTemplate;
    private getTermsOfServiceTemplate;
}
