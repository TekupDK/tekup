import { GdprService } from './gdpr.service';
import { DataExportRequest } from './entities/data-export-request.entity';
import { DataDeletionRequest } from './entities/data-deletion-request.entity';
import { ConsentRecord } from './entities/consent-record.entity';
import { RequestDataDeletionDto, RecordConsentDto, UpdatePrivacyPolicyDto } from './dto';
export declare class GdprController {
    private readonly gdprService;
    constructor(gdprService: GdprService);
    requestDataExport(req: any): Promise<DataExportRequest>;
    getDataExportStatus(req: any): Promise<DataExportRequest | null>;
    requestDataDeletion(req: any, dto: RequestDataDeletionDto): Promise<DataDeletionRequest>;
    cancelDataDeletion(req: any): Promise<{
        success: boolean;
    }>;
    recordConsent(req: any, dto: RecordConsentDto): Promise<ConsentRecord>;
    getConsentStatus(req: any, consentType?: string): Promise<ConsentRecord[]>;
    getPrivacyPolicy(version?: string): Promise<any>;
    updatePrivacyPolicy(dto: UpdatePrivacyPolicyDto): Promise<{
        success: boolean;
    }>;
    cleanupExpiredData(): Promise<{
        success: boolean;
    }>;
    processScheduledDeletions(): Promise<{
        success: boolean;
    }>;
}
