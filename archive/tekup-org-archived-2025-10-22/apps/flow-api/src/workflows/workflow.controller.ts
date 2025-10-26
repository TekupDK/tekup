import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  CacheInterceptor,
} from '@nestjs/common';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { ScopesGuard } from '../auth/scopes.guard';
import { RequireScopes } from '../auth/scopes.decorator';
import { TenantId } from '../auth/tenant-id.decorator';
import { SCOPE_READ_LEADS } from '../auth/scopes.constants';
import { WorkflowService } from './workflow.service';
import { Workflow, WorkflowExecution, WorkflowTemplate } from '@tekup/shared';

@Controller('workflows')
@UseGuards(ApiKeyGuard, ScopesGuard)
@UseInterceptors(CacheInterceptor)
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  /**
   * Get available workflow templates
   */
  @Get('templates')
  @RequireScopes(SCOPE_READ_LEADS)
  async getWorkflowTemplates(): Promise<WorkflowTemplate[]> {
    return this.workflowService.getAvailableTemplates();
  }

  /**
   * Get workflow by ID
   */
  @Get(':id')
  @RequireScopes(SCOPE_READ_LEADS)
  async getWorkflow(
    @Param('id') id: string,
    @TenantId() tenantId: string,
  ): Promise<Workflow | null> {
    return this.workflowService.getWorkflow(id, tenantId);
  }

  /**
   * List all workflows for tenant
   */
  @Get()
  @RequireScopes(SCOPE_READ_LEADS)
  async listWorkflows(@TenantId() tenantId: string): Promise<Workflow[]> {
    return this.workflowService.listWorkflows(tenantId);
  }

  /**
   * Execute a workflow
   */
  @Post('execute')
  @RequireScopes(SCOPE_READ_LEADS)
  async executeWorkflow(
    @Body() request: {
      workflowId: string;
      variables?: Record<string, any>;
      metadata?: Record<string, any>;
    },
    @TenantId() tenantId: string,
  ): Promise<WorkflowExecution> {
    return this.workflowService.executeWorkflow(
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
  @RequireScopes(SCOPE_READ_LEADS)
  async executeWorkflowByTemplate(
    @Body() request: {
      templateId: string;
      variables?: Record<string, any>;
      metadata?: Record<string, any>;
    },
    @TenantId() tenantId: string,
  ): Promise<WorkflowExecution> {
    return this.workflowService.executeWorkflowByTemplate(
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
  @RequireScopes(SCOPE_READ_LEADS)
  async getExecutionStatus(
    @Param('executionId') executionId: string,
    @TenantId() tenantId: string,
  ): Promise<WorkflowExecution> {
    return this.workflowService.getExecutionStatus(executionId, tenantId);
  }

  /**
   * List workflow executions for tenant
   */
  @Get('executions')
  @RequireScopes(SCOPE_READ_LEADS)
  async listExecutions(
    @Query('workflowId') workflowId?: string,
    @Query('status') status?: string,
    @Query('limit') limit: number = 50,
    @TenantId() tenantId?: string,
  ): Promise<WorkflowExecution[]> {
    return this.workflowService.listExecutions(tenantId, {
      workflowId,
      status,
      limit,
    });
  }

  /**
   * Pause workflow execution
   */
  @Post('executions/:executionId/pause')
  @RequireScopes(SCOPE_READ_LEADS)
  async pauseWorkflow(
    @Param('executionId') executionId: string,
    @TenantId() tenantId: string,
  ): Promise<{ success: boolean; message: string }> {
    await this.workflowService.pauseWorkflow(executionId, tenantId);
    return { success: true, message: 'Workflow paused successfully' };
  }

  /**
   * Resume workflow execution
   */
  @Post('executions/:executionId/resume')
  @RequireScopes(SCOPE_READ_LEADS)
  async resumeWorkflow(
    @Param('executionId') executionId: string,
    @TenantId() tenantId: string,
  ): Promise<{ success: boolean; message: string }> {
    await this.workflowService.resumeWorkflow(executionId, tenantId);
    return { success: true, message: 'Workflow resumed successfully' };
  }

  /**
   * Cancel workflow execution
   */
  @Post('executions/:executionId/cancel')
  @RequireScopes(SCOPE_READ_LEADS)
  async cancelWorkflow(
    @Param('executionId') executionId: string,
    @TenantId() tenantId: string,
  ): Promise<{ success: boolean; message: string }> {
    await this.workflowService.cancelWorkflow(executionId, tenantId);
    return { success: true, message: 'Workflow cancelled successfully' };
  }

  /**
   * Get workflow statistics
   */
  @Get('stats/overview')
  @RequireScopes(SCOPE_READ_LEADS)
  async getWorkflowStats(@TenantId() tenantId: string): Promise<{
    totalWorkflows: number;
    activeExecutions: number;
    completedExecutions: number;
    failedExecutions: number;
    averageExecutionTime: number;
  }> {
    return this.workflowService.getWorkflowStats(tenantId);
  }

  /**
   * Get workflow execution history
   */
  @Get('executions/:executionId/history')
  @RequireScopes(SCOPE_READ_LEADS)
  async getExecutionHistory(
    @Param('executionId') executionId: string,
    @TenantId() tenantId: string,
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
    return this.workflowService.getExecutionHistory(executionId, tenantId);
  }

  /**
   * Retry failed workflow step
   */
  @Post('executions/:executionId/retry/:stepId')
  @RequireScopes(SCOPE_READ_LEADS)
  async retryWorkflowStep(
    @Param('executionId') executionId: string,
    @Param('stepId') stepId: string,
    @TenantId() tenantId: string,
  ): Promise<{ success: boolean; message: string }> {
    await this.workflowService.retryWorkflowStep(executionId, stepId, tenantId);
    return { success: true, message: 'Workflow step retried successfully' };
  }

  /**
   * Get workflow performance metrics
   */
  @Get('metrics/performance')
  @RequireScopes(SCOPE_READ_LEADS)
  async getWorkflowPerformanceMetrics(
    @Query('timeWindow') timeWindow: number = 24, // hours
    @TenantId() tenantId: string,
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
    return this.workflowService.getPerformanceMetrics(tenantId, timeWindow);
  }
}