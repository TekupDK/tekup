export interface WorkflowStep {
  id: string;
  name: string;
  type: 'voice_command' | 'api_call' | 'data_sync' | 'notification' | 'decision' | 'delay';
  app: string; // 'voice-agent' | 'flow-api' | 'crm' | 'inbox-ai' | 'secure-platform'
  action: string;
  parameters: Record<string, any>;
  conditions?: WorkflowCondition[];
  timeout?: number;
  retryPolicy?: RetryPolicy;
  nextSteps: string[]; // IDs of next steps
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

// Predefined workflow templates
export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: 'lead_management' | 'compliance' | 'backup' | 'reporting' | 'customer_service';
  steps: Omit<WorkflowStep, 'id'>[];
  variables: WorkflowVariable[];
  parameters: Record<string, any>;
}

export const LEAD_CREATION_WORKFLOW: WorkflowTemplate = {
  id: 'lead_creation_workflow',
  name: 'Lead Creation & Follow-up',
  description: 'Automated workflow for new lead processing and follow-up',
  category: 'lead_management',
  variables: [
    { name: 'leadId', type: 'string', description: 'ID of the created lead' },
    { name: 'leadScore', type: 'number', description: 'Calculated lead score' },
    { name: 'followUpDelay', type: 'number', defaultValue: 24, description: 'Hours to wait before follow-up' },
  ],
  steps: [
    {
      name: 'Create Lead',
      type: 'voice_command',
      app: 'voice-agent',
      action: 'create_lead',
      parameters: {},
      nextSteps: ['calculate_score'],
    },
    {
      name: 'Calculate Lead Score',
      type: 'api_call',
      app: 'flow-api',
      action: 'calculate_lead_score',
      parameters: { leadId: '{{leadId}}' },
      nextSteps: ['decision_branch'],
    },
    {
      name: 'Decision Branch',
      type: 'decision',
      app: 'workflow-engine',
      action: 'evaluate_score',
      parameters: {
        conditions: [
          { field: 'leadScore', operator: 'greater_than', value: 80 },
          { field: 'leadScore', operator: 'greater_than', value: 60 },
        ],
      },
      nextSteps: ['high_priority_followup', 'standard_followup', 'nurture_campaign'],
    },
    {
      name: 'High Priority Follow-up',
      type: 'notification',
      app: 'crm',
      action: 'schedule_immediate_call',
      parameters: { leadId: '{{leadId}}', priority: 'high' },
      nextSteps: [],
    },
    {
      name: 'Standard Follow-up',
      type: 'delay',
      app: 'workflow-engine',
      action: 'wait',
      parameters: { hours: '{{followUpDelay}}' },
      nextSteps: ['schedule_followup'],
    },
    {
      name: 'Schedule Follow-up',
      type: 'api_call',
      app: 'crm',
      action: 'schedule_followup_call',
      parameters: { leadId: '{{leadId}}', priority: 'medium' },
      nextSteps: [],
    },
    {
      name: 'Nurture Campaign',
      type: 'api_call',
      app: 'crm',
      action: 'add_to_nurture_campaign',
      parameters: { leadId: '{{leadId}}', campaign: 'general_nurture' },
      nextSteps: [],
    },
  ],
  parameters: {
    defaultFollowUpDelay: 24,
    highPriorityThreshold: 80,
    mediumPriorityThreshold: 60,
  },
};

export const COMPLIANCE_CHECK_WORKFLOW: WorkflowTemplate = {
  id: 'compliance_check_workflow',
  name: 'Automated Compliance Check',
  description: 'Runs compliance checks and generates reports',
  category: 'compliance',
  variables: [
    { name: 'checkType', type: 'string', description: 'Type of compliance check' },
    { name: 'severity', type: 'string', description: 'Minimum severity level' },
    { name: 'reportUrl', type: 'string', description: 'URL to generated report' },
  ],
  steps: [
    {
      name: 'Start Compliance Check',
      type: 'voice_command',
      app: 'voice-agent',
      action: 'compliance_check',
      parameters: {},
      nextSteps: ['run_checks'],
    },
    {
      name: 'Run Compliance Checks',
      type: 'api_call',
      app: 'secure-platform',
      action: 'run_compliance_checks',
      parameters: { type: '{{checkType}}', severity: '{{severity}}' },
      nextSteps: ['generate_report'],
    },
    {
      name: 'Generate Report',
      type: 'api_call',
      app: 'secure-platform',
      action: 'generate_compliance_report',
      parameters: { checkResults: '{{checkResults}}' },
      nextSteps: ['send_notifications'],
    },
    {
      name: 'Send Notifications',
      type: 'notification',
      app: 'flow-api',
      action: 'send_compliance_notifications',
      parameters: { reportUrl: '{{reportUrl}}' },
      nextSteps: [],
    },
  ],
  parameters: {
    defaultCheckType: 'nis2',
    defaultSeverity: 'medium',
    notificationChannels: ['email', 'slack'],
  },
};

export const BACKUP_WORKFLOW: WorkflowTemplate = {
  id: 'backup_workflow',
  name: 'Automated Backup Process',
  description: 'Initiates and monitors backup processes',
  category: 'backup',
  variables: [
    { name: 'backupType', type: 'string', description: 'Type of backup to run' },
    { name: 'priority', type: 'string', description: 'Backup priority level' },
    { name: 'backupStatus', type: 'string', description: 'Current backup status' },
  ],
  steps: [
    {
      name: 'Start Backup',
      type: 'voice_command',
      app: 'voice-agent',
      action: 'start_backup',
      parameters: {},
      nextSteps: ['monitor_backup'],
    },
    {
      name: 'Monitor Backup',
      type: 'api_call',
      app: 'secure-platform',
      action: 'monitor_backup_status',
      parameters: { backupId: '{{backupId}}' },
      nextSteps: ['decision_complete'],
    },
    {
      name: 'Check if Complete',
      type: 'decision',
      app: 'workflow-engine',
      action: 'evaluate_backup_status',
      parameters: {
        conditions: [
          { field: 'backupStatus', operator: 'equals', value: 'completed' },
          { field: 'backupStatus', operator: 'equals', value: 'failed' },
        ],
      },
      nextSteps: ['send_completion_notification', 'handle_backup_failure'],
    },
    {
      name: 'Send Completion Notification',
      type: 'notification',
      app: 'flow-api',
      action: 'send_backup_completion_notification',
      parameters: { backupId: '{{backupId}}', status: 'success' },
      nextSteps: [],
    },
    {
      name: 'Handle Backup Failure',
      type: 'api_call',
      app: 'secure-platform',
      action: 'handle_backup_failure',
      parameters: { backupId: '{{backupId}}', error: '{{backupError}}' },
      nextSteps: ['send_failure_notification'],
    },
    {
      name: 'Send Failure Notification',
      type: 'notification',
      app: 'flow-api',
      action: 'send_backup_failure_notification',
      parameters: { backupId: '{{backupId}}', error: '{{backupError}}' },
      nextSteps: [],
    },
  ],
  parameters: {
    defaultBackupType: 'full',
    defaultPriority: 'normal',
    monitoringInterval: 300, // 5 minutes
    maxRetries: 3,
  },
};