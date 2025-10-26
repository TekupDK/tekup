import {
  Workflow,
  WorkflowExecution,
  WorkflowContext,
  WorkflowStep,
  StepResult,
  WorkflowEngine as IWorkflowEngine,
  WorkflowRegistry as IWorkflowRegistry,
} from './workflow.types';
// Import removed - types not available in current structure
import { WebSocketEventBus } from '../events/websocket-event-bus';
import { createLogger } from '../logging';

const logger = createLogger('packages-shared-src-workflows-');

export class WorkflowEngine implements IWorkflowEngine {
  private executions: Map<string, WorkflowExecution> = new Map();
  private eventBus = new WebSocketEventBus(process.env.NEXT_PUBLIC_EVENT_BUS_URL || 'ws://localhost:4000/events');

  async executeWorkflow(
    workflow: Workflow,
    context: Partial<WorkflowContext>
  ): Promise<WorkflowExecution> {
    const executionId = this.generateExecutionId();
    const execution: WorkflowExecution = {
      id: executionId,
      workflowId: workflow.id,
      tenantId: context.tenantId || workflow.tenantId,
      status: 'running',
      currentStep: workflow.steps[0]?.id || '',
      variables: { ...context.variables },
      stepResults: [],
      startedAt: new Date(),
      metadata: { ...context.metadata },
    };

    this.executions.set(executionId, execution);

    // Start execution in background
    this.executeWorkflowSteps(workflow, execution).catch((error: Error) => {
      logger.error(`Workflow execution failed: ${executionId}`, error);
      execution.status = 'failed';
      execution.error = error.message;
      execution.completedAt = new Date();
    });

    return execution;
  }

  private async executeWorkflowSteps(workflow: Workflow, execution: WorkflowExecution) {
    try {
      let currentStepId: string | null = workflow.steps[0]?.id || null;

      while (currentStepId && execution.status === 'running') {
        const step = workflow.steps.find(s => s.id === currentStepId);
        if (!step) {
          throw new Error(`Step not found: ${currentStepId}`);
        }

        // Execute step
        const stepResult = await this.executeStep(step, execution);
        execution.stepResults.push(stepResult);
        if (step) {
          execution.currentStep = step.id;
        }

        // Check if step failed
        if (stepResult.status === 'failed') {
          if (step.errorHandling?.onError === 'stop') {
            execution.status = 'failed';
            execution.error = stepResult.error;
            break;
          } else if (step.errorHandling?.onError === 'retry' && step.retryPolicy) {
            // Implement retry logic
            const retryResult = await this.retryStep(step, execution, step.retryPolicy);
            if (retryResult.status === 'failed') {
              execution.status = 'failed';
              execution.error = retryResult.error;
              break;
            }
          }
        }

        // Determine next step
        currentStepId = this.determineNextStep(step, stepResult, execution);

        // Add delay if step type is delay
        if (step.type === 'delay') {
          await this.handleDelay(step, execution);
        }
      }

      if (execution.status === 'running') {
        execution.status = 'completed';
        execution.completedAt = new Date();
      }

      // Publish completion event
      await this.eventBus.publish({
        id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        type: 'WORKFLOW_COMPLETED',
        tenantId: execution.tenantId,
        source: 'workflow-engine',
        data: {
          executionId: execution.id,
          workflowId: execution.workflowId,
          status: execution.status,
          duration: execution.completedAt
            ? execution.completedAt.getTime() - execution.startedAt.getTime()
            : 0,
          error: execution.error,
        },
      });

    } catch (error) {
      execution.status = 'failed';
      if (error instanceof Error) {
        execution.error = error.message;
      }
      execution.completedAt = new Date();
      throw error;
    }
  }

  private async executeStep(step: WorkflowStep, execution: WorkflowExecution): Promise<StepResult> {
    const startTime = Date.now();

    try {
      logger.info(`Executing workflow step: ${step.name} (${step.type})`);

      let result: any;

      switch (step.type) {
        case 'voice_command':
          result = await this.executeVoiceCommand(step, execution);
          break;
        case 'api_call':
          result = await this.executeApiCall(step, execution);
          break;
        case 'data_sync':
          result = await this.executeDataSync(step, execution);
          break;
        case 'notification':
          result = await this.executeNotification(step, execution);
          break;
        case 'decision':
          result = await this.executeDecision(step, execution);
          break;
        case 'delay':
          result = await this.executeDelay(step, execution);
          break;
        default:
          throw new Error(`Unknown step type: ${step.type}`);
      }

      const duration = Date.now() - startTime;

      return {
        stepId: step.id,
        status: 'success',
        result,
        duration,
        timestamp: new Date(),
      };

    } catch (error) {
      const duration = Date.now() - startTime;

      return {
        stepId: step.id,
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
        duration,
        timestamp: new Date(),
      };
    }
  }

  private async executeVoiceCommand(step: WorkflowStep, execution: WorkflowExecution): Promise<any> {
    // This would integrate with the voice agent service
    logger.info(`Executing voice command: ${step.action}`);

    const request = {
      command: step.action,
      parameters: step.parameters,
      timestamp: new Date(),
    };

    // Simulate voice command execution
    return {
      success: true,
      timestamp: new Date(),
      transcription: `Executed ${step.action}`,
    };
  }

  private async executeApiCall(step: WorkflowStep, execution: WorkflowExecution): Promise<any> {
    const { app, action, parameters } = step;

    // This would make actual API calls to the specified app
    logger.info(`Making API call to ${app}: ${action}`);

    // Simulate API call
    return {
      app,
      action,
      parameters,
      success: true,
      response: { status: 'success' },
      timestamp: new Date(),
    };
  }

  private async executeDataSync(step: WorkflowStep, execution: WorkflowExecution): Promise<any> {
    logger.info(`Executing data sync: ${step.action}`);

    // Simulate data sync
    return {
      action: step.action,
      recordsProcessed: 10,
      success: true,
      timestamp: new Date(),
    };
  }

  private async executeNotification(step: WorkflowStep, execution: WorkflowExecution): Promise<any> {
    logger.info(`Sending notification: ${step.action}`);

    // This would send actual notifications
    return {
      action: step.action,
      recipients: ['user@example.com'],
      success: true,
      timestamp: new Date(),
    };
  }

  private async executeDecision(step: WorkflowStep, execution: WorkflowExecution): Promise<any> {
    const { parameters } = step;
    const conditions = parameters.conditions || [];

    // Evaluate conditions
    const results = conditions.map((condition: any) => {
      const value = this.getFieldValue(condition.field, execution);
      return this.evaluateCondition(condition, value);
    });

    return {
      conditions: results,
      decision: results.every((r: { result: boolean; }) => r.result),
      timestamp: new Date(),
    };
  }

  private async executeDelay(step: WorkflowStep, execution: WorkflowExecution): Promise<any> {
    const { parameters } = step;
    const hours = parameters.hours || 0;

    logger.info(`Waiting for ${hours} hours...`);

    // In a real implementation, this would use a job scheduler
    // For now, we'll just return immediately
    return {
      delayHours: hours,
      timestamp: new Date(),
    };
  }

  private async handleDelay(step: WorkflowStep, execution: WorkflowExecution): Promise<void> {
    const { parameters } = step;
    const hours = parameters.hours || 0;

    if (hours > 0) {
      // In production, this would use a proper job scheduler
      // For now, we'll simulate with a small delay
      await new Promise(resolve => setTimeout(resolve, Math.min(hours * 1000, 5000)));
    }
  }

  private async retryStep(
    step: WorkflowStep,
    execution: WorkflowExecution,
    retryPolicy: any
  ): Promise<StepResult> {
    logger.info(`Retrying step: ${step.name}`);

    // Implement retry logic with exponential backoff
    for (let attempt = 1; attempt <= retryPolicy.maxAttempts; attempt++) {
      try {
        const delay = retryPolicy.delayMs * Math.pow(retryPolicy.backoffMultiplier, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));

        const result = await this.executeStep(step, execution);
        if (result.status === 'success') {
          return result;
        }
      } catch (error) {
        if (error instanceof Error) {
          logger.info(`Retry attempt ${attempt} failed: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }

    return {
      stepId: step.id,
      status: 'failed',
      error: `Failed after ${retryPolicy.maxAttempts} retry attempts`,
      duration: 0,
      timestamp: new Date(),
    };
  }

  private determineNextStep(
    step: WorkflowStep,
    stepResult: StepResult,
    execution: WorkflowExecution
  ): string | null {
    if (step.type === 'decision') {
      // For decision steps, determine next step based on conditions
      const conditions = step.parameters.conditions || [];
      const results = conditions.map((condition: any) => {
        const value = this.getFieldValue(condition.field, execution);
        return this.evaluateCondition(condition, value);
      });

      if (results.every((r: { result: boolean; }) => r.result)) {
        // All conditions met, take first next step
        return step.nextSteps[0] || null;
      } else {
        // Conditions not met, take alternative path if available
        return step.nextSteps[1] || null;
      }
    }

    // For regular steps, take the first next step
    return step.nextSteps[0] || null;
  }

  private getFieldValue(field: string, execution: WorkflowExecution): any {
    // Support both direct variables and nested paths
    if (field.includes('.')) {
      const [object, property] = field.split('.');
      return execution.variables[object]?.[property];
    }

    return execution.variables[field];
  }

  private evaluateCondition(condition: any, value: any): { result: boolean; details: string } {
    const { operator, value: expectedValue } = condition;

    let result = false;
    let details = '';

    switch (operator) {
      case 'equals':
        result = value === expectedValue;
        details = `${value} === ${expectedValue}`;
        break;
      case 'not_equals':
        result = value !== expectedValue;
        details = `${value} !== ${expectedValue}`;
        break;
      case 'greater_than':
        result = Number(value) > Number(expectedValue);
        details = `${value} > ${expectedValue}`;
        break;
      case 'less_than':
        result = Number(value) < Number(expectedValue);
        details = `${value} < ${expectedValue}`;
        break;
      case 'contains':
        result = String(value).includes(String(expectedValue));
        details = `"${value}".includes("${expectedValue}")`;
        break;
      case 'exists':
        result = value !== undefined && value !== null;
        details = `value exists: ${value !== undefined && value !== null}`;
        break;
      default:
        result = false;
        details = `Unknown operator: ${operator}`;
    }

    return { result, details };
  }

  async pauseWorkflow(executionId: string): Promise<void> {
    const execution = this.executions.get(executionId);
    if (execution && execution.status === 'running') {
      execution.status = 'paused';

      await this.eventBus.publish({
        id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        type: 'WORKFLOW_PAUSED',
        tenantId: execution.tenantId,
        source: 'workflow-engine',
        data: { executionId, workflowId: execution.workflowId, status: 'paused' },
      });
    }
  }

  async resumeWorkflow(executionId: string): Promise<void> {
    const execution = this.executions.get(executionId);
    if (execution && execution.status === 'paused') {
      execution.status = 'running';

      // Resume execution
      // This would require more complex state management in production

      await this.eventBus.publish({
        id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        type: 'WORKFLOW_RESUMED',
        tenantId: execution.tenantId,
        source: 'workflow-engine',
        data: { executionId, workflowId: execution.workflowId, status: 'running' },
      });
    }
  }

  async cancelWorkflow(executionId: string): Promise<void> {
    const execution = this.executions.get(executionId);
    if (execution) {
      execution.status = 'failed';
      execution.error = 'Workflow cancelled by user';
      execution.completedAt = new Date();

      await this.eventBus.publish({
        id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        type: 'WORKFLOW_CANCELLED',
        tenantId: execution.tenantId,
        source: 'workflow-engine',
        data: { executionId, workflowId: execution.workflowId, status: 'failed', error: 'Workflow cancelled by user' },
      });
    }
  }

  async getExecutionStatus(executionId: string): Promise<WorkflowExecution> {
    const execution = this.executions.get(executionId);
    if (!execution) {
      throw new Error(`Execution not found: ${executionId}`);
    }
    return execution;
  }

  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export class WorkflowRegistry implements IWorkflowRegistry {
  private workflows: Map<string, Workflow> = new Map();

  async registerWorkflow(workflow: Workflow): Promise<void> {
    this.workflows.set(workflow.id, workflow);
    logger.info(`Registered workflow: ${workflow.name} (${workflow.id})`);
  }

  async getWorkflow(id: string): Promise<Workflow | null> {
    return this.workflows.get(id) || null;
  }

  async listWorkflows(tenantId: string): Promise<Workflow[]> {
    return Array.from(this.workflows.values()).filter(w => w.tenantId === tenantId);
  }

  async updateWorkflow(workflow: Workflow): Promise<void> {
    this.workflows.set(workflow.id, workflow);
    logger.info(`Updated workflow: ${workflow.name} (${workflow.id})`);
  }

  async deleteWorkflow(id: string): Promise<void> {
    const workflow = this.workflows.get(id);
    if (workflow) {
      this.workflows.delete(id);
      logger.info(`Deleted workflow: ${workflow.name} (${workflow.id})`);
    }
  }
}

// Export singleton instances
export const workflowEngine = new WorkflowEngine();
export const workflowRegistry = new WorkflowRegistry();
