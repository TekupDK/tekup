import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FlowService } from './flow.service';
import { TenantId } from '../core/decorators/tenant-id.decorator';

export interface FlowTemplate {
  id: string;
  name: string;
  description: string;
  steps: FlowStep[];
  variables: Record<string, any>;
  parameters: Record<string, any>;
}

export interface FlowStep {
  id: string;
  name: string;
  type: string;
  config: Record<string, any>;
  conditions?: Record<string, any>[];
}

export interface Flow {
  id: string;
  name: string;
  description?: string;
  version: string;
  tenantId: string;
  triggers: any[];
  steps: FlowStep[];
  variables: Record<string, any>;
  metadata: Record<string, any>;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FlowExecution {
  id: string;
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  steps: Array<{
    id: string;
    name: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
    startTime?: Date;
    endTime?: Date;
    duration?: number;
    result?: any;
    error?: string;
  }>;
  metadata: Record<string, any>;
  result?: any;
  error?: string;
}

@Controller('flow')
export class FlowController {
  constructor(private readonly flowService: FlowService) {}

  /**
   * Get available workflow templates
   */
  @Get('templates')
  async getFlowTemplates(): Promise<FlowTemplate[]> {
    return this.flowService.getAvailableTemplates();
  }

  /**
   * Get workflow by ID
   */
  @Get(':id')
  async getFlow(
    @Param('id') id: string,
    @TenantId() tenantId: string,
  ): Promise<Flow | null> {
    return this.flowService.getFlow(id, tenantId);
  }

  /**
   * List all workflows for tenant
   */
  @Get()
  async listFlows(@TenantId() tenantId: string): Promise<Flow[]> {
    return this.flowService.listFlows(tenantId);
  }

  /**
   * Execute a workflow
   */
  @Post('execute')
  async executeFlow(
    @Body() request: {
      workflowId: string;
      variables?: Record<string, any>;
      metadata?: Record<string, any>;
    },
    @TenantId() tenantId: string,
  ): Promise<FlowExecution> {
    return this.flowService.executeFlow(
      request.workflowId,
      tenantId,
      request.variables || {},
      request.metadata || {},
    );
  }

  /**
   * Execute workflow by template
   */
  @Post('execute/template')
  async executeFlowByTemplate(
    @Body() request: {
      templateId: string;
      variables?: Record<string, any>;
      metadata?: Record<string, any>;
    },
    @TenantId() tenantId: string,
  ): Promise<FlowExecution> {
    return this.flowService.executeFlowByTemplate(
      request.templateId,
      tenantId,
      request.variables || {},
      request.metadata || {},
    );
  }

  /**
   * Get workflow execution status
   */
  @Get('executions/:executionId')
  async getExecutionStatus(
    @Param('executionId') executionId: string,
    @TenantId() tenantId: string,
  ): Promise<FlowExecution> {
    return this.flowService.getExecutionStatus(executionId, tenantId);
  }

  /**
   * List workflow executions for tenant
   */
  @Get('executions')
  async listExecutions(
    @Query('workflowId') workflowId?: string,
    @Query('status') status?: string,
    @Query('limit') limit: number = 50,
    @TenantId() tenantId?: string,
  ): Promise<FlowExecution[]> {
    return this.flowService.listExecutions(tenantId, {
      workflowId,
      status,
      limit,
    });
  }

  /**
   * Pause workflow execution
   */
  @Post('executions/:executionId/pause')
  async pauseFlow(
    @Param('executionId') executionId: string,
    @TenantId() tenantId: string,
  ): Promise<{ success: boolean; message: string }> {
    await this.flowService.pauseFlow(executionId, tenantId);
    return { success: true, message: 'Flow paused successfully' };
  }

  /**
   * Resume workflow execution
   */
  @Post('executions/:executionId/resume')
  async resumeFlow(
    @Param('executionId') executionId: string,
    @TenantId() tenantId: string,
  ): Promise<{ success: boolean; message: string }> {
    await this.flowService.resumeFlow(executionId, tenantId);
    return { success: true, message: 'Flow resumed successfully' };
  }

  /**
   * Cancel workflow execution
   */
  @Post('executions/:executionId/cancel')
  async cancelFlow(
    @Param('executionId') executionId: string,
    @TenantId() tenantId: string,
  ): Promise<{ success: boolean; message: string }> {
    await this.flowService.cancelFlow(executionId, tenantId);
    return { success: true, message: 'Flow cancelled successfully' };
  }

  /**
   * Get workflow statistics
   */
  @Get('stats/overview')
  async getFlowStats(@TenantId() tenantId: string): Promise<{
    totalFlows: number;
    activeExecutions: number;
    completedExecutions: number;
    failedExecutions: number;
    averageExecutionTime: number;
  }> {
    return this.flowService.getFlowStats(tenantId);
  }

  /**
   * Get workflow execution history
   */
  @Get('executions/:executionId/history')
  async getExecutionHistory(
    @Param('executionId') executionId: string,
    @TenantId() tenantId: string,
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
    return this.flowService.getExecutionHistory(executionId, tenantId);
  }

  /**
   * Retry failed workflow step
   */
  @Post('executions/:executionId/retry/:stepId')
  async retryFlowStep(
    @Param('executionId') executionId: string,
    @Param('stepId') stepId: string,
    @TenantId() tenantId: string,
  ): Promise<{ success: boolean; message: string }> {
    await this.flowService.retryFlowStep(executionId, stepId, tenantId);
    return { success: true, message: 'Flow step retried successfully' };
  }

  /**
   * Get workflow performance metrics
   */
  @Get('metrics/performance')
  async getFlowPerformanceMetrics(
    @Query('timeWindow') timeWindow: number = 24, // hours
    @TenantId() tenantId: string,
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
    return this.flowService.getPerformanceMetrics(tenantId, timeWindow);
  }
}
