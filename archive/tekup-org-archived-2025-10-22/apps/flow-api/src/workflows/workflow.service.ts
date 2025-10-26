import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../websocket/websocket.gateway';
import {
  Workflow,
  WorkflowExecution,
  WorkflowTemplate,
  WorkflowContext,
  workflowEngine,
  workflowRegistry,
  LEAD_CREATION_WORKFLOW,
  COMPLIANCE_CHECK_WORKFLOW,
  BACKUP_WORKFLOW,
} from '@tekup/shared';

export interface WorkflowExecutionOptions {
  workflowId?: string;
  status?: string;
  limit?: number;
}

@Injectable()
export class WorkflowService {
  private readonly logger = new Logger(WorkflowService.name);
  private readonly availableTemplates: WorkflowTemplate[] = [
    LEAD_CREATION_WORKFLOW,
    COMPLIANCE_CHECK_WORKFLOW,
    BACKUP_WORKFLOW,
  ];

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  /**
   * Get available workflow templates
   */
  getAvailableTemplates(): WorkflowTemplate[] {
    return this.availableTemplates;
  }

  /**
   * Get workflow by ID
   */
  async getWorkflow(id: string, tenantId: string): Promise<Workflow | null> {
    try {
      const workflow = await this.prisma.workflow.findFirst({
        where: { id, tenantId },
      });

      if (!workflow) {
        return null;
      }

      return this.mapPrismaWorkflowToWorkflow(workflow);
    } catch (error) {
      this.logger.error(`Failed to get workflow ${id}:`, error);
      throw error;
    }
  }

  /**
   * List workflows for tenant
   */
  async listWorkflows(tenantId: string): Promise<Workflow[]> {
    try {
      const workflows = await this.prisma.workflow.findMany({
        where: { tenantId },
        orderBy: { updatedAt: 'desc' },
      });

      return workflows.map(w => this.mapPrismaWorkflowToWorkflow(w));
    } catch (error) {
      this.logger.error(`Failed to list workflows for tenant ${tenantId}:`, error);
      throw error;
    }
    }

  /**
   * Execute workflow by ID
   */
  async executeWorkflow(
    workflowId: string,
    tenantId: string,
    variables: Record<string, any> = {},
    metadata: Record<string, any> = {},
  ): Promise<WorkflowExecution> {
    try {
      const workflow = await this.getWorkflow(workflowId, tenantId);
      if (!workflow) {
        throw new Error(`Workflow not found: ${workflowId}`);
      }

      // Create execution record
      const execution = await this.prisma.workflowExecution.create({
        data: {
          id: this.generateExecutionId(),
          workflowId,
          tenantId,
          status: 'running',
          currentStep: workflow.steps[0]?.id || '',
          variables: variables,
          metadata: metadata,
          startedAt: new Date(),
        },
      });

      // Execute workflow using engine
      const workflowContext: Partial<WorkflowContext> = {
        executionId: execution.id,
        workflowId,
        tenantId,
        variables,
        metadata,
      };

      const engineExecution = await workflowEngine.executeWorkflow(workflow, workflowContext);

      // Update execution with engine results
      await this.prisma.workflowExecution.update({
        where: { id: execution.id },
        data: {
          status: engineExecution.status,
          currentStep: engineExecution.currentStep,
          stepResults: engineExecution.stepResults,
          completedAt: engineExecution.completedAt,
          error: engineExecution.error,
        },
      });

      // Publish workflow event
      await this.eventsGateway.publishIntegrationEvent({
        type: 'WORKFLOW_STARTED',
        tenantId,
        source: 'flow-api',
        data: {
          executionId: execution.id,
          workflowId,
          status: 'started',
        },
      });

      return this.mapPrismaExecutionToExecution(execution);
    } catch (error) {
      this.logger.error(`Failed to execute workflow ${workflowId}:`, error);
      throw error;
    }
  }

  /**
   * Execute workflow by template
   */
  async executeWorkflowByTemplate(
    templateId: string,
    tenantId: string,
    variables: Record<string, any> = {},
    metadata: Record<string, any> = {},
  ): Promise<WorkflowExecution> {
    try {
      const template = this.availableTemplates.find(t => t.id === templateId);
      if (!template) {
        throw new Error(`Template not found: ${templateId}`);
      }

      // Create workflow from template
      const workflow: Workflow = {
        id: this.generateWorkflowId(),
        name: template.name,
        description: template.description,
        version: '1.0.0',
        tenantId,
        triggers: [],
        steps: template.steps.map((step, index) => ({
          ...step,
          id: `step_${index + 1}`,
        })),
        variables: template.variables,
        metadata: template.parameters,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'active',
      };

      // Save workflow to database
      await this.prisma.workflow.create({
        data: {
          id: workflow.id,
          name: workflow.name,
          description: workflow.description,
          version: workflow.version,
          tenantId: workflow.tenantId,
          triggers: workflow.triggers,
          steps: workflow.steps,
          variables: workflow.variables,
          metadata: workflow.metadata,
          createdAt: workflow.createdAt,
          updatedAt: workflow.updatedAt,
          status: workflow.status,
        },
      });

      // Execute the workflow
      return this.executeWorkflow(workflow.id, tenantId, variables, metadata);
    } catch (error) {
      this.logger.error(`Failed to execute workflow by template ${templateId}:`, error);
      throw error;
    }
  }

  /**
   * Get execution status
   */
  async getExecutionStatus(executionId: string, tenantId: string): Promise<WorkflowExecution> {
    try {
      const execution = await this.prisma.workflowExecution.findFirst({
        where: { id: executionId, tenantId },
      });

      if (!execution) {
        throw new Error(`Execution not found: ${executionId}`);
      }

      return this.mapPrismaExecutionToExecution(execution);
    } catch (error) {
      this.logger.error(`Failed to get execution status ${executionId}:`, error);
      throw error;
    }
  }

  /**
   * List executions for tenant
   */
  async listExecutions(
    tenantId: string,
    options: WorkflowExecutionOptions = {},
  ): Promise<WorkflowExecution[]> {
    try {
      const where: any = { tenantId };
      
      if (options.workflowId) {
        where.workflowId = options.workflowId;
      }
      
      if (options.status) {
        where.status = options.status;
      }

      const executions = await this.prisma.workflowExecution.findMany({
        where,
        orderBy: { startedAt: 'desc' },
        take: options.limit || 50,
      });

      return executions.map(e => this.mapPrismaExecutionToExecution(e));
    } catch (error) {
      this.logger.error(`Failed to list executions for tenant ${tenantId}:`, error);
      throw error;
    }
  }

  /**
   * Pause workflow execution
   */
  async pauseWorkflow(executionId: string, tenantId: string): Promise<void> {
    try {
      await workflowEngine.pauseWorkflow(executionId);
      
      await this.prisma.workflowExecution.update({
        where: { id: executionId, tenantId },
        data: { status: 'paused' },
      });

      // Publish event
      await this.eventsGateway.publishIntegrationEvent({
        type: 'WORKFLOW_PAUSED',
        tenantId,
        source: 'flow-api',
        data: { executionId },
      });
    } catch (error) {
      this.logger.error(`Failed to pause workflow ${executionId}:`, error);
      throw error;
    }
  }

  /**
   * Resume workflow execution
   */
  async resumeWorkflow(executionId: string, tenantId: string): Promise<void> {
    try {
      await workflowEngine.resumeWorkflow(executionId);
      
      await this.prisma.workflowExecution.update({
        where: { id: executionId, tenantId },
        data: { status: 'running' },
      });

      // Publish event
      await this.eventsGateway.publishIntegrationEvent({
        type: 'WORKFLOW_RESUMED',
        tenantId,
        source: 'flow-api',
        data: { executionId },
      });
    } catch (error) {
      this.logger.error(`Failed to resume workflow ${executionId}:`, error);
      throw error;
    }
  }

  /**
   * Cancel workflow execution
   */
  async cancelWorkflow(executionId: string, tenantId: string): Promise<void> {
    try {
      await workflowEngine.cancelWorkflow(executionId);
      
      await this.prisma.workflowExecution.update({
        where: { id: executionId, tenantId },
        data: { 
          status: 'failed',
          error: 'Workflow cancelled by user',
          completedAt: new Date(),
        },
      });

      // Publish event
      await this.eventsGateway.publishIntegrationEvent({
        type: 'WORKFLOW_CANCELLED',
        tenantId,
        source: 'flow-api',
        data: { executionId },
      });
    } catch (error) {
      this.logger.error(`Failed to cancel workflow ${executionId}:`, error);
      throw error;
    }
  }

  /**
   * Get workflow statistics
   */
  async getWorkflowStats(tenantId: string): Promise<{
    totalWorkflows: number;
    activeExecutions: number;
    completedExecutions: number;
    failedExecutions: number;
    averageExecutionTime: number;
  }> {
    try {
      const [
        totalWorkflows,
        activeExecutions,
        completedExecutions,
        failedExecutions,
        avgExecutionTime,
      ] = await Promise.all([
        this.prisma.workflow.count({ where: { tenantId } }),
        this.prisma.workflowExecution.count({ 
          where: { tenantId, status: 'running' } 
        }),
        this.prisma.workflowExecution.count({ 
          where: { tenantId, status: 'completed' } 
        }),
        this.prisma.workflowExecution.count({ 
          where: { tenantId, status: 'failed' } 
        }),
        this.prisma.workflowExecution.aggregate({
          where: { 
            tenantId, 
            status: { in: ['completed', 'failed'] },
            completedAt: { not: null },
            startedAt: { not: null },
          },
          _avg: {
            _raw: 'EXTRACT(EPOCH FROM (completed_at - started_at))',
          },
        }),
      ]);

      return {
        totalWorkflows,
        activeExecutions,
        completedExecutions,
        failedExecutions,
        averageExecutionTime: avgExecutionTime._avg._raw || 0,
      };
    } catch (error) {
      this.logger.error(`Failed to get workflow stats for tenant ${tenantId}:`, error);
      throw error;
    }
  }

  /**
   * Get execution history
   */
  async getExecutionHistory(
    executionId: string,
    tenantId: string,
  ): Promise<{
    execution: WorkflowExecution;
    stepHistory: Array<{
      stepId: string;
      stepName: string;
      status: string;
      startTime: Date;
      endTime?: Date;
      duration?: number;
      result?: any;
      error?: string;
    }>;
  }> {
    try {
      const execution = await this.getExecutionStatus(executionId, tenantId);
      
      // Extract step history from step results
      const stepHistory = execution.stepResults.map(step => ({
        stepId: step.stepId,
        stepName: step.stepId, // In a real implementation, this would come from workflow definition
        status: step.status,
        startTime: step.timestamp,
        endTime: step.timestamp, // In a real implementation, this would be tracked separately
        duration: step.duration,
        result: step.result,
        error: step.error,
      }));

      return {
        execution,
        stepHistory,
      };
    } catch (error) {
      this.logger.error(`Failed to get execution history ${executionId}:`, error);
      throw error;
    }
  }

  /**
   * Retry failed workflow step
   */
  async retryWorkflowStep(
    executionId: string,
    stepId: string,
    tenantId: string,
  ): Promise<void> {
    try {
      // This would require more complex implementation in the workflow engine
      // For now, we'll just log the retry attempt
      this.logger.log(`Retry requested for step ${stepId} in execution ${executionId}`);
      
      // Publish event
      await this.eventsGateway.publishIntegrationEvent({
        type: 'WORKFLOW_STEP_RETRY',
        tenantId,
        source: 'flow-api',
        data: { executionId, stepId },
      });
    } catch (error) {
      this.logger.error(`Failed to retry workflow step ${stepId}:`, error);
      throw error;
    }
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(
    tenantId: string,
    timeWindow: number,
  ): Promise<{
    totalExecutions: number;
    successRate: number;
    averageExecutionTime: number;
    errorRate: number;
    topPerformingWorkflows: Array<{
      workflowId: string;
      workflowName: string;
      successRate: number;
      averageExecutionTime: number;
    }>;
  }> {
    try {
      const startTime = new Date(Date.now() - timeWindow * 60 * 60 * 1000);
      
      const executions = await this.prisma.workflowExecution.findMany({
        where: {
          tenantId,
          startedAt: { gte: startTime },
        },
        include: {
          workflow: true,
        },
      });

      const totalExecutions = executions.length;
      const successfulExecutions = executions.filter(e => e.status === 'completed').length;
      const failedExecutions = executions.filter(e => e.status === 'failed').length;
      
      const successRate = totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0;
      const errorRate = totalExecutions > 0 ? (failedExecutions / totalExecutions) * 100 : 0;

      // Calculate average execution time
      const completedExecutions = executions.filter(e => 
        e.status === 'completed' && e.completedAt && e.startedAt
      );
      
      let averageExecutionTime = 0;
      if (completedExecutions.length > 0) {
        const totalTime = completedExecutions.reduce((sum, e) => {
          return sum + (e.completedAt!.getTime() - e.startedAt.getTime());
        }, 0);
        averageExecutionTime = totalTime / completedExecutions.length;
      }

      // Get top performing workflows
      const workflowStats = new Map<string, { success: number; total: number; totalTime: number }>();
      
      executions.forEach(execution => {
        const workflowId = execution.workflowId;
        const stats = workflowStats.get(workflowId) || { success: 0, total: 0, totalTime: 0 };
        
        stats.total++;
        if (execution.status === 'completed') {
          stats.success++;
        }
        
        if (execution.completedAt && execution.startedAt) {
          stats.totalTime += execution.completedAt.getTime() - execution.startedAt.getTime();
        }
        
        workflowStats.set(workflowId, stats);
      });

      const topPerformingWorkflows = Array.from(workflowStats.entries())
        .map(([workflowId, stats]) => {
          const workflow = executions.find(e => e.workflowId === workflowId)?.workflow;
          return {
            workflowId,
            workflowName: workflow?.name || 'Unknown',
            successRate: (stats.success / stats.total) * 100,
            averageExecutionTime: stats.total > 0 ? stats.totalTime / stats.total : 0,
          };
        })
        .sort((a, b) => b.successRate - a.successRate)
        .slice(0, 5);

      return {
        totalExecutions,
        successRate,
        averageExecutionTime,
        errorRate,
        topPerformingWorkflows,
      };
    } catch (error) {
      this.logger.error(`Failed to get performance metrics for tenant ${tenantId}:`, error);
      throw error;
    }
  }

  /**
   * Helper methods
   */
  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateWorkflowId(): string {
    return `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private mapPrismaWorkflowToWorkflow(prismaWorkflow: any): Workflow {
    return {
      id: prismaWorkflow.id,
      name: prismaWorkflow.name,
      description: prismaWorkflow.description,
      version: prismaWorkflow.version,
      tenantId: prismaWorkflow.tenantId,
      triggers: prismaWorkflow.triggers || [],
      steps: prismaWorkflow.steps || [],
      variables: prismaWorkflow.variables || [],
      metadata: prismaWorkflow.metadata || {},
      createdAt: prismaWorkflow.createdAt,
      updatedAt: prismaWorkflow.updatedAt,
      status: prismaWorkflow.status,
    };
  }

  private mapPrismaExecutionToExecution(prismaExecution: any): WorkflowExecution {
    return {
      id: prismaExecution.id,
      workflowId: prismaExecution.workflowId,
      tenantId: prismaExecution.tenantId,
      status: prismaExecution.status,
      currentStep: prismaExecution.currentStep,
      variables: prismaExecution.variables || {},
      stepResults: prismaExecution.stepResults || [],
      startedAt: prismaExecution.startedAt,
      completedAt: prismaExecution.completedAt,
      error: prismaExecution.error,
      metadata: prismaExecution.metadata || {},
    };
  }
}