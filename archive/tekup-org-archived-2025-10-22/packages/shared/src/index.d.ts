export type UUID = string;
export interface User {
    id: UUID;
    email: string;
    name: string;
    tenantId: string;
    role: string;
    createdAt: Date;
    updatedAt: Date;
}
export * from './voice';
export * from './lead';
export * from './runtime/env';
export * from './events/event.types';
export * from './events/websocket-event-bus';
export { Workflow, WorkflowExecution, WorkflowStep, WorkflowCondition, RetryPolicy, ErrorHandling, WorkflowTrigger, WorkflowTemplate, LEAD_CREATION_WORKFLOW, COMPLIANCE_CHECK_WORKFLOW, BACKUP_WORKFLOW } from './workflows/workflow.types';
export { WorkflowEngine as CrossAppWorkflowEngine } from './workflows/workflow-engine';
export * from './monitoring';
export * from './logging';
export * from './mcp';
//# sourceMappingURL=index.d.ts.map