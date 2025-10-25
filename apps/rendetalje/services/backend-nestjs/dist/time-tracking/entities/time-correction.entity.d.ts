export declare class TimeCorrection {
    id: string;
    originalEntryId: string;
    originalStartTime: Date;
    originalEndTime?: Date;
    originalBreakDuration: number;
    correctedStartTime: Date;
    correctedEndTime?: Date;
    correctedBreakDuration: number;
    reason: string;
    status: string;
    submittedBy: string;
    approvedBy?: string;
    approvedAt?: Date;
    rejectedBy?: string;
    rejectedAt?: Date;
    rejectionReason?: string;
    createdAt: Date;
    updatedAt: Date;
}
