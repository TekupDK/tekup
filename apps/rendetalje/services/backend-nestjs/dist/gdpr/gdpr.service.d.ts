import { PrismaService } from '../database/prisma.service';
import { DataExportRequest } from './entities/data-export-request.entity';
import { DataDeletionRequest } from './entities/data-deletion-request.entity';
import { ConsentRecord } from './entities/consent-record.entity';
export declare class GdprService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    requestDataExport(userId: string, email: string): Promise<DataExportRequest>;
    getDataExportStatus(userId: string): Promise<DataExportRequest | null>;
    requestDataDeletion(userId: string, email: string, reason?: string): Promise<DataDeletionRequest>;
    cancelDataDeletion(userId: string): Promise<boolean>;
    recordConsent(userId: string, consentType: string, granted: boolean, ipAddress: string, userAgent: string, version?: string): Promise<ConsentRecord>;
    getConsentStatus(userId: string, consentType?: string): Promise<ConsentRecord[]>;
    getPrivacyPolicy(version?: string): Promise<any>;
    updatePrivacyPolicy(content: string, version: string): Promise<void>;
    cleanupExpiredData(): Promise<void>;
    processScheduledDeletions(): Promise<void>;
}
