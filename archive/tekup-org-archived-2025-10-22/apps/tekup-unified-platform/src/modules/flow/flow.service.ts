import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../core/services/prisma.service';
import type { 
  Flow, 
  FlowTemplate, 
  FlowExecution,
  FlowStep 
} from './flow.controller';

interface FlowExecutionOptions {
  workflowId?: string;
  status?: string;
  limit?: number;
}

// Available workflow templates - these could come from database later
const AVAILABLE_TEMPLATES: FlowTemplate[] = [
  {
    id: 'lead-creation-workflow',
    name: 'Lead Creation Workflow',
    description: 'Automatic processing of new leads',
    steps: [
      {
        id: 'validate-lead',
        name: 'Validate Lead Data',
        type: 'validation',
        config: { required_fields: ['email', 'name'] }
      },
      {
        id: 'enrich-lead',
        name: 'Enrich Lead Data',
        type: 'enrichment',
        config: { sources: ['linkedin', 'company_api'] }
      },
      {
        id: 'assign-lead',
        name: 'Assign to Sales Rep',
        type: 'assignment',
        config: { criteria: 'round_robin' }
      }
    ],
    variables: {
      assignment_criteria: 'round_robin',
      auto_enrich: true
    },
    parameters: {
      timeout_minutes: 30,
      retry_attempts: 3
    }
  },
  {
    id: 'compliance-check-workflow',
    name: 'Compliance Check Workflow', 
    description: 'GDPR and data compliance checks',
    steps: [
      {
        id: 'gdpr-check',
        name: 'GDPR Compliance Check',
        type: 'compliance',
        config: { regulations: ['gdpr', 'ccpa'] }
      },
      {
        id: 'data-retention',
        name: 'Data Retention Policy',
        type: 'retention',
        config: { policy: 'auto_delete_after_expiry' }
      }
    ],
    variables: {
      retention_days: 2555
    },
    parameters: {
      strict_mode: true
    }
  }
];

@Injectable()
export class FlowService {
  private readonly logger = new Logger(FlowService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get available workflow templates
   */
  getAvailableTemplates(): FlowTemplate[] {
    return AVAILABLE_TEMPLATES;
  }

  /**
   * Get workflow by ID
   */
  async getFlow(id: string, tenantId: string): Promise<Flow | null> {
    try {
      const flow = await this.prisma.flow.findFirst({
        where: { id, tenantId },
      });

      if (!flow) {
        return null;
      }

      return this.mapPrismaFlowToFlow(flow);
    } catch (error) {
      this.logger.error(`Failed to get flow ${id}:`, error);
      throw error;
    }
  }

  /**
   * List flows for tenant
   */
  async listFlows(tenantId: string): Promise<Flow[]> {
    try {
      const flows = await this.prisma.flow.findMany({
        where: { tenantId },
        orderBy: { updatedAt: 'desc' },
      });

      return flows.map(f => this.mapPrismaFlowToFlow(f));
    } catch (error) {
      this.logger.error(`Failed to list flows for tenant ${tenantId}:`, error);
      throw error;
    }
  }

  /**
   * Execute workflow by ID
   */
  async executeFlow(
    workflowId: string,
    tenantId: string,
    variables: Record<string, any> = {},
    metadata: Record<string, any> = {},
  ): Promise<FlowExecution> {
    try {
      const flow = await this.getFlow(workflowId, tenantId);
      if (!flow) {
        throw new Error(`Flow not found: ${workflowId}`);
      }

      // Create execution record
      const execution = await this.prisma.flowRun.create({
        data: {
          flowId: workflowId,
          userId: 'system', // TODO: Get from auth context
          status: 'running',
          input: JSON.stringify(variables),
          startedAt: new Date(),
        },
      });

      // Execute workflow steps
      const executionResult = await this.executeWorkflowSteps(
        flow, 
        execution.id, 
        variables, 
        metadata
      );

      // Update execution with results
      await this.prisma.flowRun.update({
        where: { id: execution.id },
        data: {
          status: executionResult.status,
          output: JSON.stringify(executionResult.result),
          error: executionResult.error,
          finishedAt: executionResult.status !== 'running' ? new Date() : undefined,
        },
      });

      return {
        id: execution.id,
        workflowId,
        status: executionResult.status as any,
        startTime: execution.startedAt,
        endTime: executionResult.status !== 'running' ? new Date() : undefined,
        steps: executionResult.steps || [],
        metadata,
        result: executionResult.result,
        error: executionResult.error,
      };
    } catch (error) {
      this.logger.error(`Failed to execute flow ${workflowId}:`, error);
      throw error;
    }
  }

  /**
   * Execute workflow by template
   */
  async executeFlowByTemplate(
    templateId: string,
    tenantId: string,
    variables: Record<string, any> = {},
    metadata: Record<string, any> = {},
  ): Promise<FlowExecution> {
    try {
      const template = AVAILABLE_TEMPLATES.find(t => t.id === templateId);
      if (!template) {
        throw new Error(`Template not found: ${templateId}`);
      }

      // Create workflow from template
      const flow: Flow = {
        id: this.generateFlowId(),
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
      await this.prisma.flow.create({
        data: {
          id: flow.id,
          name: flow.name,
          description: flow.description,
          definition: {
            version: flow.version,
            triggers: flow.triggers,
            steps: flow.steps,
            variables: flow.variables,
            metadata: flow.metadata,
          } as any,
          active: flow.status === 'active',
          tenantId: flow.tenantId,
          createdBy: 'system', // TODO: Get from auth context
          createdAt: flow.createdAt,
          updatedAt: flow.updatedAt,
        },
      });

      // Execute the workflow
      return this.executeFlow(flow.id, tenantId, variables, metadata);
    } catch (error) {
      this.logger.error(`Failed to execute flow by template ${templateId}:`, error);
      throw error;
    }
  }

  /**
   * Get execution status
   */
  async getExecutionStatus(executionId: string, tenantId: string): Promise<FlowExecution> {
    try {
      const execution = await this.prisma.flowRun.findFirst({
        where: { id: executionId },
        include: { flow: true },
      });

      if (!execution || execution.flow.tenantId !== tenantId) {
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
    options: FlowExecutionOptions = {},
  ): Promise<FlowExecution[]> {
    try {
      const executions = await this.prisma.flowRun.findMany({
        where: {
          flow: { tenantId },
          ...(options.workflowId && { flowId: options.workflowId }),
          ...(options.status && { status: options.status }),
        },
        include: { flow: true },
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
  async pauseFlow(executionId: string, tenantId: string): Promise<void> {
    try {
      await this.prisma.flowRun.update({
        where: { id: executionId },
        data: { status: 'failed' }, // Using 'failed' as we don't have 'paused' in schema
      });

      this.logger.log(`Flow execution paused: ${executionId}`);
    } catch (error) {
      this.logger.error(`Failed to pause flow ${executionId}:`, error);
      throw error;
    }
  }

  /**
   * Resume workflow execution
   */
  async resumeFlow(executionId: string, tenantId: string): Promise<void> {
    try {
      await this.prisma.flowRun.update({
        where: { id: executionId },
        data: { status: 'running' },
      });

      this.logger.log(`Flow execution resumed: ${executionId}`);
    } catch (error) {
      this.logger.error(`Failed to resume flow ${executionId}:`, error);
      throw error;
    }
  }

  /**
   * Cancel workflow execution
   */
  async cancelFlow(executionId: string, tenantId: string): Promise<void> {
    try {
      await this.prisma.flowRun.update({
        where: { id: executionId },
        data: {
          status: 'failed',
          error: 'Workflow cancelled by user',
          finishedAt: new Date(),
        },
      });

      this.logger.log(`Flow execution cancelled: ${executionId}`);
    } catch (error) {
      this.logger.error(`Failed to cancel flow ${executionId}:`, error);
      throw error;
    }
  }

  /**
   * Get workflow statistics
   */
  async getFlowStats(tenantId: string): Promise<{
    totalFlows: number;
    activeExecutions: number;
    completedExecutions: number;
    failedExecutions: number;
    averageExecutionTime: number;
  }> {
    try {
      const [totalFlows, activeExecutions, completedExecutions, failedExecutions] = await Promise.all([
        this.prisma.flow.count({ where: { tenantId } }),
        this.prisma.flowRun.count({
          where: { flow: { tenantId }, status: 'running' }
        }),
        this.prisma.flowRun.count({
          where: { flow: { tenantId }, status: 'completed' }
        }),
        this.prisma.flowRun.count({
          where: { flow: { tenantId }, status: 'failed' }
        }),
      ]);

      // Calculate average execution time
      const completedRuns = await this.prisma.flowRun.findMany({
        where: {
          flow: { tenantId },
          status: { in: ['completed', 'failed'] },
          finishedAt: { not: null },
        },
        select: { startedAt: true, finishedAt: true },
      });

      const averageExecutionTime = completedRuns.length > 0
        ? completedRuns.reduce((sum, run) => {
            const duration = run.finishedAt!.getTime() - run.startedAt.getTime();
            return sum + duration;
          }, 0) / completedRuns.length / 1000 // Convert to seconds
        : 0;

      return {
        totalFlows,
        activeExecutions,
        completedExecutions,
        failedExecutions,
        averageExecutionTime,
      };
    } catch (error) {
      this.logger.error(`Failed to get flow stats for tenant ${tenantId}:`, error);
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
    execution: FlowExecution;
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

      const stepHistory = execution.steps.map(step => ({
        stepId: step.id,
        stepName: step.name,
        status: step.status,
        startTime: step.startTime || execution.startTime,
        endTime: step.endTime,
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
  async retryFlowStep(
    executionId: string,
    stepId: string,
    tenantId: string,
  ): Promise<void> {
    try {
      this.logger.log(`Retrying flow step ${stepId} in execution ${executionId}`);
      // TODO: Implement step retry logic
      // This would re-execute a specific step in a workflow
    } catch (error) {
      this.logger.error(`Failed to retry flow step ${stepId}:`, error);
      throw error;
    }
  }

  /**
   * Get workflow performance metrics
   */
  async getPerformanceMetrics(
    tenantId: string,
    timeWindow: number = 24,
  ): Promise<{
    totalExecutions: number;
    successRate: number;
    averageExecutionTime: number;
    errorRate: number;
    topPerformingFlows: Array<{
      flowId: string;
      flowName: string;
      successRate: number;
      averageExecutionTime: number;
    }>;
  }> {
    try {
      const since = new Date(Date.now() - timeWindow * 60 * 60 * 1000);

      const executions = await this.prisma.flowRun.findMany({
        where: {
          flow: { tenantId },
          startedAt: { gte: since },
        },
        include: { flow: true },
      });

      const totalExecutions = executions.length;
      const completedExecutions = executions.filter(e => e.status === 'completed').length;
      const failedExecutions = executions.filter(e => e.status === 'failed').length;

      const successRate = totalExecutions > 0 ? (completedExecutions / totalExecutions) * 100 : 0;
      const errorRate = totalExecutions > 0 ? (failedExecutions / totalExecutions) * 100 : 0;

      // Calculate average execution time
      const finishedExecutions = executions.filter(e => e.finishedAt);
      const averageExecutionTime = finishedExecutions.length > 0
        ? finishedExecutions.reduce((sum, e) => {
            const duration = e.finishedAt!.getTime() - e.startedAt.getTime();
            return sum + duration;
          }, 0) / finishedExecutions.length / 1000
        : 0;

      // Top performing flows
      const flowStats = new Map<string, {
        name: string;
        total: number;
        completed: number;
        totalTime: number;
      }>();

      executions.forEach(e => {
        const flowId = e.flowId;
        const stats = flowStats.get(flowId) || {
          name: e.flow.name,
          total: 0,
          completed: 0,
          totalTime: 0,
        };

        stats.total++;
        if (e.status === 'completed') {
          stats.completed++;
          if (e.finishedAt) {
            stats.totalTime += e.finishedAt.getTime() - e.startedAt.getTime();
          }
        }

        flowStats.set(flowId, stats);
      });

      const topPerformingFlows = Array.from(flowStats.entries())
        .map(([flowId, stats]) => ({
          flowId,
          flowName: stats.name,
          successRate: stats.total > 0 ? (stats.completed / stats.total) * 100 : 0,
          averageExecutionTime: stats.completed > 0 ? stats.totalTime / stats.completed / 1000 : 0,
        }))
        .sort((a, b) => b.successRate - a.successRate)
        .slice(0, 5);

      return {
        totalExecutions,
        successRate,
        averageExecutionTime,
        errorRate,
        topPerformingFlows,
      };
    } catch (error) {
      this.logger.error(`Failed to get performance metrics for tenant ${tenantId}:`, error);
      throw error;
    }
  }

  // Helper methods

  private generateFlowId(): string {
    return 'flow_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private mapPrismaFlowToFlow(prismaFlow: any): Flow {
    return {
      id: prismaFlow.id,
      name: prismaFlow.name,
      description: prismaFlow.description,
      version: prismaFlow.definition?.version || '1.0.0',
      tenantId: prismaFlow.tenantId,
      triggers: prismaFlow.definition?.triggers || [],
      steps: prismaFlow.definition?.steps || [],
      variables: prismaFlow.definition?.variables || {},
      metadata: prismaFlow.definition?.metadata || {},
      status: prismaFlow.active ? 'active' : 'inactive',
      createdAt: prismaFlow.createdAt,
      updatedAt: prismaFlow.updatedAt,
    };
  }

  private mapPrismaExecutionToExecution(prismaExecution: any): FlowExecution {
    return {
      id: prismaExecution.id,
      workflowId: prismaExecution.flowId,
      status: prismaExecution.status as any,
      startTime: prismaExecution.startedAt,
      endTime: prismaExecution.finishedAt,
      duration: prismaExecution.finishedAt
        ? prismaExecution.finishedAt.getTime() - prismaExecution.startedAt.getTime()
        : undefined,
      steps: [], // TODO: Extract from execution data
      metadata: {},
      result: prismaExecution.output,
      error: prismaExecution.error,
    };
  }

  private async executeWorkflowSteps(
    flow: Flow,
    executionId: string,
    variables: Record<string, any>,
    metadata: Record<string, any>,
  ): Promise<{
    status: 'completed' | 'failed' | 'running';
    steps?: any[];
    result?: any;
    error?: string;
  }> {
    try {
      // Simple workflow execution - just mark as completed for now
      // In a real implementation, this would execute each step
      this.logger.log(`Executing workflow ${flow.id} with ${flow.steps.length} steps`);

      const steps = flow.steps.map(step => ({
        id: step.id,
        name: step.name,
        status: 'completed',
        startTime: new Date(),
        endTime: new Date(),
        duration: 100, // Mock duration
        result: { message: `Step ${step.name} completed successfully` },
      }));

      return {
        status: 'completed',
        steps,
        result: { message: 'Workflow completed successfully', steps: steps.length },
      };
    } catch (error) {
      return {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
