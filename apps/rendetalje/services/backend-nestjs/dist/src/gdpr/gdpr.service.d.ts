import { SupabaseService } from '../supabase/supabase.service';
import { ConfigService } from '@nestjs/config';
export interface DataExportRequest {
    userId: string;
    email: string;
    requestDate: Date;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    downloadUrl?: string;
    expiresAt?: Date;
}
export interface DataDeletionRequest {
    userId: string;
    email: string;
    requestDate: Date;
    scheduledDeletionDate: Date;
    status: 'pending' | 'processing' | 'completed' | 'cancelled';
    reason?: string;
}
export interface ConsentRecord {
    userId: string;
    consentType: string;
    granted: boolean;
    grantedAt: Date;
    revokedAt?: Date;
    ipAddress: string;
    userAgent: string;
    version: string;
}
export declare class GdprService {
    private readonly supabaseService;
    private readonly configService;
    private readonly logger;
    private readonly encryptionKey;
    constructor(supabaseService: SupabaseService, configService: ConfigService);
    requestDataExport(userId: string, email: string): Promise<DataExportRequest>;
    private processDataExport;
    private collectUserData;
    requestDataDeletion(userId: string, email: string, reason?: string): Promise<DataDeletionRequest>;
    cancelDataDeletion(userId: string): Promise<boolean>;
    processScheduledDeletions(): Promise<void>;
    private executeDataDeletion;
    recordConsent(userId: string, consentType: string, granted: boolean, ipAddress: string, userAgent: string, version?: string): Promise<ConsentRecord>;
    getConsentStatus(userId: string, consentType?: string): Promise<ConsentRecord[]>;
    private encryptData;
    private decryptData;
    private generateSecureDownloadUrl;
    cleanupExpiredData(): Promise<void>;
    getPrivacyPolicy(version?: string): Promise<any>;
    updatePrivacyPolicy(content: string, version: string): Promise<void>;
}
