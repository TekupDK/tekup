import { GdprService, DataExportRequest, DataDeletionRequest, ConsentRecord } from './gdpr.service';
export declare class GdprController {
    private readonly gdprService;
    constructor(gdprService: GdprService);
    requestDataExport(req: any): Promise<DataExportRequest>;
    getDataExportStatus(req: any): Promise<DataExportRequest | null>;
    requestDataDeletion(req: any, reason?: string): Promise<DataDeletionRequest>;
    cancelDataDeletion(req: any): Promise<{
        success: boolean;
    }>;
    recordConsent(req: any, consentType: string, granted: boolean, version?: string): Promise<ConsentRecord>;
    getConsentStatus(req: any, consentType?: string): Promise<ConsentRecord[]>;
    getPrivacyPolicy(version?: string): Promise<any>;
    updatePrivacyPolicy(content: string, version: string): Promise<{
        success: boolean;
    }>;
    cleanupExpiredData(): Promise<{
        success: boolean;
    }>;
    processScheduledDeletions(): Promise<{
        success: boolean;
    }>;
}
export declare class RecordConsentDto {
    consentType: string;
    granted: boolean;
    version?: string;
}
export declare class RequestDataDeletionDto {
    reason?: string;
}
export declare class UpdatePrivacyPolicyDto {
    content: string;
    version: string;
}
