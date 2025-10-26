export interface WorkflowStep {
    id: string;
    name: string;
    type: 'voice_command' | 'api_call' | 'data_sync' | 'notification' | 'decision' | 'delay';
    app: string;
    action: string;
    parameters: Record<string, any>;
    conditions?: WorkflowCondition[];
    timeout?: number;
    retryPolicy?: RetryPolicy;
    nextSteps: string[];
    errorHandling?: ErrorHandling;
}
export interface WorkflowCondition {
    field: string;
    operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'exists';
    value: any;
    logicalOperator?: 'AND' | 'OR';
}
export interface RetryPolicy {
    maxAttempts: number;
    delayMs: number;
    backoffMultiplier: number;
}
export interface ErrorHandling {
    onError: 'continue' | 'stop' | 'retry' | 'fallback';
    fallbackStep?: string;
    errorNotification?: boolean;
}
export interface Workflow {
    id: string;
    name: string;
    description: string;
    version: string;
    tenantId: string;
    triggers: WorkflowTrigger[];
    steps: WorkflowStep[];
    variables: WorkflowVariable[];
    metadata: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
    status: 'active' | 'inactive' | 'draft';
}
export interface WorkflowTrigger {
    type: 'voice_command' | 'lead_created' | 'lead_status_changed' | 'compliance_check' | 'scheduled' | 'manual';
    conditions: WorkflowCondition[];
    parameters?: Record<string, any>;
}
export interface WorkflowVariable {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    defaultValue?: any;
    description?: string;
}
export interface WorkflowExecution {
    id: string;
    workflowId: string;
    tenantId: string;
    status: 'running' | 'completed' | 'failed' | 'paused';
    currentStep: string;
    variables: Record<string, any>;
    stepResults: StepResult[];
    startedAt: Date;
    completedAt?: Date;
    error?: string;
    metadata: Record<string, any>;
}
export interface StepResult {
    stepId: string;
    status: 'success' | 'failed' | 'skipped';
    result?: any;
    error?: string;
    duration: number;
    timestamp: Date;
}
export interface WorkflowContext {
    executionId: string;
    workflowId: string;
    tenantId: string;
    userId?: string;
    variables: Record<string, any>;
    stepResults: Record<string, StepResult>;
    metadata: Record<string, any>;
}
export interface WorkflowEngine {
    executeWorkflow(workflow: Workflow, context: Partial<WorkflowContext>): Promise<WorkflowExecution>;
    pauseWorkflow(executionId: string): Promise<void>;
    resumeWorkflow(executionId: string): Promise<void>;
    cancelWorkflow(executionId: string): Promise<void>;
    getExecutionStatus(executionId: string): Promise<WorkflowExecution>;
}
export interface WorkflowRegistry {
    registerWorkflow(workflow: Workflow): Promise<void>;
    getWorkflow(id: string): Promise<Workflow | null>;
    listWorkflows(tenantId: string): Promise<Workflow[]>;
    updateWorkflow(workflow: Workflow): Promise<void>;
    deleteWorkflow(id: string): Promise<void>;
}
export interface WorkflowTemplate {
    id: string;
    name: string;
    description: string;
    category: 'lead_management' | 'compliance' | 'backup' | 'reporting' | 'customer_service';
    steps: Omit<WorkflowStep, 'id'>[];
    variables: WorkflowVariable[];
    parameters: Record<string, any>;
}
export declare const LEAD_CREATION_WORKFLOW: WorkflowTemplate;
export declare const COMPLIANCE_CHECK_WORKFLOW: WorkflowTemplate;
export declare const BACKUP_WORKFLOW: WorkflowTemplate;
//# sourceMappingURL=workflow.types.d.ts.map