import { Workflow, WorkflowExecution, WorkflowContext, WorkflowEngine as IWorkflowEngine, WorkflowRegistry as IWorkflowRegistry } from './workflow.types';
export declare class WorkflowEngine implements IWorkflowEngine {
    private executions;
    private eventBus;
    executeWorkflow(workflow: Workflow, context: Partial<WorkflowContext>): Promise<WorkflowExecution>;
    private executeWorkflowSteps;
    private executeStep;
    private executeVoiceCommand;
    private executeApiCall;
    private executeDataSync;
    private executeNotification;
    private executeDecision;
    private executeDelay;
    private handleDelay;
    private retryStep;
    private determineNextStep;
    private getFieldValue;
    private evaluateCondition;
    pauseWorkflow(executionId: string): Promise<void>;
    resumeWorkflow(executionId: string): Promise<void>;
    cancelWorkflow(executionId: string): Promise<void>;
    getExecutionStatus(executionId: string): Promise<WorkflowExecution>;
    private generateExecutionId;
}
export declare class WorkflowRegistry implements IWorkflowRegistry {
    private workflows;
    registerWorkflow(workflow: Workflow): Promise<void>;
    getWorkflow(id: string): Promise<Workflow | null>;
    listWorkflows(tenantId: string): Promise<Workflow[]>;
    updateWorkflow(workflow: Workflow): Promise<void>;
    deleteWorkflow(id: string): Promise<void>;
}
export declare const workflowEngine: WorkflowEngine;
export declare const workflowRegistry: WorkflowRegistry;
//# sourceMappingURL=workflow-engine.d.ts.map