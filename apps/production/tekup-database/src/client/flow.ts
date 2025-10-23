/**
 * Flow Schema Client
 * Workflow Automation database queries
 */

import { prisma } from './index';

export const flow = {
  // ===================================
  // WORKFLOW MANAGEMENT
  // ===================================

  async findWorkflows(filters?: {
    status?: string;
    owner?: string;
    isTemplate?: boolean;
    limit?: number;
  }) {
    return prisma.flowWorkflow.findMany({
      where: {
        ...(filters?.status && { status: filters.status }),
        ...(filters?.owner && { owner: filters.owner }),
        ...(filters?.isTemplate !== undefined && { isTemplate: filters.isTemplate }),
      },
      take: filters?.limit || 50,
      orderBy: { updatedAt: 'desc' },
    });
  },

  async createWorkflow(data: {
    name: string;
    description?: string;
    owner: string;
    trigger: any;
    nodes: any;
    edges: any;
    isTemplate?: boolean;
  }) {
    return prisma.flowWorkflow.create({ data });
  },

  async updateWorkflow(id: string, data: any) {
    return prisma.flowWorkflow.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  },

  async activateWorkflow(id: string) {
    return prisma.flowWorkflow.update({
      where: { id },
      data: { status: 'active' },
    });
  },

  async pauseWorkflow(id: string) {
    return prisma.flowWorkflow.update({
      where: { id },
      data: { status: 'paused' },
    });
  },

  // ===================================
  // EXECUTION MANAGEMENT
  // ===================================

  async executeWorkflow(workflowId: string, input?: any, triggeredBy?: string) {
    const workflow = await prisma.flowWorkflow.findUnique({
      where: { id: workflowId },
    });

    if (!workflow) throw new Error('Workflow not found');
    if (workflow.status !== 'active') throw new Error('Workflow is not active');

    const execution = await prisma.flowExecution.create({
      data: {
        workflowId,
        input,
        triggeredBy: triggeredBy || 'manual',
        status: 'running',
      },
    });

    // Update workflow stats
    await prisma.flowWorkflow.update({
      where: { id: workflowId },
      data: {
        executionCount: { increment: 1 },
        lastExecutedAt: new Date(),
      },
    });

    return execution;
  },

  async getExecution(id: string) {
    return prisma.flowExecution.findUnique({
      where: { id },
      include: {
        workflow: true,
        steps: {
          orderBy: { createdAt: 'asc' },
        },
        logs: {
          orderBy: { timestamp: 'asc' },
        },
      },
    });
  },

  async getExecutions(filters?: {
    workflowId?: string;
    status?: string;
    limit?: number;
  }) {
    return prisma.flowExecution.findMany({
      where: {
        ...(filters?.workflowId && { workflowId: filters.workflowId }),
        ...(filters?.status && { status: filters.status }),
      },
      take: filters?.limit || 100,
      orderBy: { startedAt: 'desc' },
      include: {
        workflow: { select: { name: true } },
      },
    });
  },

  async completeExecution(id: string, output?: any, error?: string) {
    const now = new Date();
    const execution = await prisma.flowExecution.findUnique({
      where: { id },
      select: { startedAt: true, workflowId: true },
    });

    if (!execution) throw new Error('Execution not found');

    const durationMs = now.getTime() - execution.startedAt.getTime();
    const status = error ? 'failed' : 'completed';

    // Update execution
    const updated = await prisma.flowExecution.update({
      where: { id },
      data: {
        status,
        output,
        error,
        completedAt: now,
        durationMs,
      },
    });

    // Update workflow stats
    if (status === 'completed') {
      await prisma.flowWorkflow.update({
        where: { id: execution.workflowId },
        data: {
          successCount: { increment: 1 },
          avgDurationMs: durationMs, // Simplified, should calculate proper average
        },
      });
    } else {
      await prisma.flowWorkflow.update({
        where: { id: execution.workflowId },
        data: {
          failureCount: { increment: 1 },
        },
      });
    }

    return updated;
  },

  // ===================================
  // STEP MANAGEMENT
  // ===================================

  async createExecutionStep(data: {
    executionId: string;
    stepId: string;
    stepName: string;
    stepType: string;
    input?: any;
  }) {
    return prisma.flowExecutionStep.create({
      data: {
        ...data,
        status: 'running',
        startedAt: new Date(),
      },
    });
  },

  async completeExecutionStep(
    id: string,
    output?: any,
    error?: string
  ) {
    const now = new Date();
    const step = await prisma.flowExecutionStep.findUnique({
      where: { id },
      select: { startedAt: true },
    });

    if (!step?.startedAt) throw new Error('Step not found or not started');

    const durationMs = now.getTime() - step.startedAt.getTime();

    return prisma.flowExecutionStep.update({
      where: { id },
      data: {
        status: error ? 'failed' : 'completed',
        output,
        error,
        completedAt: now,
        durationMs,
      },
    });
  },

  // ===================================
  // LOGGING
  // ===================================

  async log(executionId: string, level: string, message: string, data?: any, stepId?: string) {
    return prisma.flowExecutionLog.create({
      data: {
        executionId,
        level,
        message,
        data,
        stepId,
      },
    });
  },

  // ===================================
  // SCHEDULING
  // ===================================

  async createSchedule(data: {
    workflowId: string;
    name: string;
    cronExpression?: string;
    intervalMinutes?: number;
    timezone?: string;
  }) {
    if (!data.cronExpression && !data.intervalMinutes) {
      throw new Error('Either cronExpression or intervalMinutes must be provided');
    }

    return prisma.flowSchedule.create({
      data: {
        ...data,
        timezone: data.timezone || 'Europe/Copenhagen',
      },
    });
  },

  async getSchedules(workflowId?: string) {
    return prisma.flowSchedule.findMany({
      where: workflowId ? { workflowId } : {},
      include: {
        workflow: { select: { name: true } },
      },
      orderBy: { nextRun: 'asc' },
    });
  },

  async updateScheduleNextRun(id: string, nextRun: Date) {
    return prisma.flowSchedule.update({
      where: { id },
      data: {
        lastRun: new Date(),
        nextRun,
        currentRuns: { increment: 1 },
      },
    });
  },

  // ===================================
  // WEBHOOKS
  // ===================================

  async createWebhook(data: {
    workflowId: string;
    name: string;
    url: string;
    secret?: string;
  }) {
    return prisma.flowWebhook.create({ data });
  },

  async getWebhook(url: string) {
    return prisma.flowWebhook.findUnique({
      where: { url },
    });
  },

  async logWebhookRequest(webhookId: string) {
    return prisma.flowWebhook.update({
      where: { id: webhookId },
      data: {
        requestCount: { increment: 1 },
        lastRequestAt: new Date(),
      },
    });
  },

  // ===================================
  // INTEGRATIONS
  // ===================================

  async createIntegration(data: {
    name: string;
    type: string;
    config: any;
    owner: string;
  }) {
    return prisma.flowIntegration.create({ data });
  },

  async getIntegrations(owner?: string, type?: string) {
    return prisma.flowIntegration.findMany({
      where: {
        ...(owner && { owner }),
        ...(type && { type }),
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async updateIntegrationUsage(id: string) {
    return prisma.flowIntegration.update({
      where: { id },
      data: {
        usageCount: { increment: 1 },
        lastUsedAt: new Date(),
      },
    });
  },

  // ===================================
  // VARIABLES
  // ===================================

  async setVariable(key: string, value: string, workflowId?: string, isSecret = false) {
    return prisma.flowVariable.upsert({
      where: {
        workflowId_key: {
          workflowId: workflowId || null,
          key,
        },
      },
      create: {
        key,
        value,
        workflowId,
        isSecret,
        encrypted: isSecret,
      },
      update: {
        value,
        updatedAt: new Date(),
      },
    });
  },

  async getVariable(key: string, workflowId?: string) {
    return prisma.flowVariable.findUnique({
      where: {
        workflowId_key: {
          workflowId: workflowId || null,
          key,
        },
      },
    });
  },

  async getVariables(workflowId?: string) {
    return prisma.flowVariable.findMany({
      where: { workflowId },
      orderBy: { key: 'asc' },
    });
  },

  // ===================================
  // ANALYTICS
  // ===================================

  async trackMetric(metric: string, value: number, workflowId?: string, metadata?: any) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);

    return prisma.flowMetric.upsert({
      where: {
        date_metric_workflowId: {
          date,
          metric,
          workflowId: workflowId || null,
        },
      },
      create: { date, metric, value, workflowId, metadata },
      update: { value, metadata },
    });
  },

  async getMetrics(metric: string, startDate: Date, endDate: Date, workflowId?: string) {
    return prisma.flowMetric.findMany({
      where: {
        metric,
        date: {
          gte: startDate,
          lte: endDate,
        },
        ...(workflowId && { workflowId }),
      },
      orderBy: { date: 'asc' },
    });
  },
};

export default flow;
