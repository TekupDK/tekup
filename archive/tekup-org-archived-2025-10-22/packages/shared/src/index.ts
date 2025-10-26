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

// Domain exports
export * from './voice';
export * from './lead';
export * from './runtime/env';

// Event system for cross-app communication
export * from './events/event.types';
export * from './events/websocket-event-bus';

// Workflow system for cross-app automation
export { 
  Workflow, 
  WorkflowExecution, 
  WorkflowStep,
  WorkflowCondition, 
  RetryPolicy, 
  ErrorHandling,
  WorkflowTrigger,
  WorkflowTemplate,
  LEAD_CREATION_WORKFLOW,
  COMPLIANCE_CHECK_WORKFLOW,
  BACKUP_WORKFLOW
} from './workflows/workflow.types';
export { WorkflowEngine as CrossAppWorkflowEngine } from './workflows/workflow-engine';

// Monitoring and performance tracking
export * from './monitoring';

// Logging infrastructure
export * from './logging';

// MCP shared types
export * from './mcp';

// Lead Bridge integration with proven system
// export * from './lead-bridge'; // TODO: Implement lead-bridge module
