export declare enum LeadStatusShared {
    NEW = "NEW",
    CONTACTED = "CONTACTED"
}
export interface LeadPayloadShared {
    email?: string;
    phone?: string;
    name?: string;
    message?: string;
    company?: string;
    jobTitle?: string;
    [key: string]: unknown;
}
export interface LeadShared {
    id: string;
    tenantId: string;
    source: string;
    status: LeadStatusShared;
    payload?: LeadPayloadShared;
    createdAt: string;
    updatedAt: string;
}
export interface LeadStatusTransitionRequest {
    status: LeadStatusShared.CONTACTED;
}
export interface LeadStatusTransitionEvent {
    id: string;
    leadId: string;
    fromStatus: LeadStatusShared;
    toStatus: LeadStatusShared;
    createdAt: string;
}
//# sourceMappingURL=lead.d.ts.map