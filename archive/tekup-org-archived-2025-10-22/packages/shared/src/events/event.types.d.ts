export interface BaseEvent {
    id: string;
    type: string;
    tenantId: string;
    timestamp: Date;
    source: string;
    metadata?: Record<string, any>;
}
export interface LeadEvent extends BaseEvent {
    type: 'LEAD_CREATED' | 'LEAD_UPDATED' | 'LEAD_CONVERTED' | 'LEAD_STATUS_CHANGED';
    leadId: string;
    data: {
        status: string;
        source: string;
        payload?: any;
    };
}
export interface VoiceEvent extends BaseEvent {
    type: 'VOICE_COMMAND_EXECUTED' | 'VOICE_SESSION_STARTED' | 'VOICE_SESSION_ENDED';
    data: {
        command?: string;
        parameters?: Record<string, any>;
        response?: any;
        sessionId?: string;
    };
}
export interface CrmEvent extends BaseEvent {
    type: 'DEAL_CREATED' | 'DEAL_UPDATED' | 'CONTACT_CREATED' | 'COMPANY_CREATED';
    data: {
        entityId: string;
        entityType: string;
        changes?: Record<string, any>;
    };
}
export interface IntegrationEvent extends BaseEvent {
    type: 'SYNC_STARTED' | 'SYNC_COMPLETED' | 'SYNC_FAILED' | 'API_CALL_MADE';
    data: {
        operation: string;
        result?: any;
        error?: string;
        duration?: number;
    };
}
export interface WorkflowEvent extends BaseEvent {
    type: 'WORKFLOW_STARTED' | 'WORKFLOW_COMPLETED' | 'WORKFLOW_FAILED' | 'WORKFLOW_PAUSED' | 'WORKFLOW_RESUMED' | 'WORKFLOW_CANCELLED';
    data: {
        workflowId: string;
        executionId: string;
        status?: string;
        duration?: number;
        error?: string;
    };
}
export type AppEvent = LeadEvent | VoiceEvent | CrmEvent | IntegrationEvent | WorkflowEvent;
export interface EventBus {
    publish(event: AppEvent): Promise<void>;
    subscribe(eventType: string, handler: (event: AppEvent) => void): void;
    unsubscribe(eventType: string, handler: (event: AppEvent) => void): void;
}
export interface EventHandler<T extends AppEvent = AppEvent> {
    handle(event: T): Promise<void>;
}
export interface EventFilter {
    tenantId?: string;
    eventType?: string;
    source?: string;
    fromTimestamp?: Date;
    toTimestamp?: Date;
}
export interface EventSubscription {
    id: string;
    eventType: string;
    handler: (event: AppEvent) => void;
    filter?: EventFilter;
}
//# sourceMappingURL=event.types.d.ts.map