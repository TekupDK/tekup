export declare enum LeadStatus {
    NEW = "new",
    CONTACTED = "contacted",
    QUALIFIED = "qualified",
    CONVERTED = "converted",
    LOST = "lost"
}
export declare enum LeadPriority {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    URGENT = "urgent"
}
export declare class Lead {
    id: string;
    sessionId?: string;
    customerId?: string;
    source?: string;
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    squareMeters?: number;
    rooms?: number;
    taskType?: string;
    preferredDates: string[];
    status: LeadStatus;
    emailThreadId?: string;
    followUpAttempts: number;
    lastFollowUpDate?: Date;
    idempotencyKey?: string;
    companyName?: string;
    industry?: string;
    estimatedSize?: string;
    estimatedValue?: number;
    enrichmentData?: Record<string, any>;
    lastEnriched?: Date;
    score: number;
    priority: LeadPriority;
    lastScored?: Date;
    scoreMetadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
