export declare class ConsentRecord {
    id: string;
    userId: string;
    consentType: string;
    granted: boolean;
    grantedAt: Date;
    revokedAt?: Date;
    ipAddress: string;
    userAgent: string;
    version: string;
    createdAt: Date;
    updatedAt: Date;
}
