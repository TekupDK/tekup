/**
 * Example usage of Flow client
 */

import { flow } from '../src/client/flow';

async function workflowManagementExample() {
  console.log('=== Workflow Management Example ===\n');

  // Create a workflow
  const workflow = await flow.createWorkflow({
    name: 'Invoice Approval Workflow',
    description: 'Automatically approve invoices under 5000 DKK',
    owner: 'user_123',
    trigger: {
      type: 'webhook',
      event: 'invoice.created',
    },
    nodes: [
      { id: 'start', type: 'trigger', name: 'Invoice Created' },
      { id: 'check_amount', type: 'condition', name: 'Check Amount', config: { field: 'amount', operator: 'less_than', value: 5000 } },
      { id: 'auto_approve', type: 'action', name: 'Auto Approve', config: { action: 'approve_invoice' } },
      { id: 'notify_manager', type: 'action', name: 'Notify Manager', config: { action: 'send_email' } },
      { id: 'end', type: 'end', name: 'End' },
    ],
    edges: [
      { from: 'start', to: 'check_amount' },
      { from: 'check_amount', to: 'auto_approve', condition: 'true' },
      { from: 'check_amount', to: 'notify_manager', condition: 'false' },
      { from: 'auto_approve', to: 'end' },
      { from: 'notify_manager', to: 'end' },
    ],
  });

  console.log('Created workflow:', workflow.id);

  // Activate workflow
  await flow.activateWorkflow(workflow.id);
  console.log('Workflow activated\n');

  return workflow;
}

async function executionExample(workflowId: string) {
  console.log('=== Workflow Execution Example ===\n');

  // Execute workflow
  const execution = await flow.executeWorkflow(
    workflowId,
    {
      invoiceId: 'inv_123',
      amount: 3500,
      customer: 'Acme Corp',
    },
    'webhook'
  );

  console.log('Started execution:', execution.id);

  // Create and complete steps
  const step1 = await flow.createExecutionStep({
    executionId: execution.id,
    stepId: 'check_amount',
    stepName: 'Check Amount',
    stepType: 'condition',
    input: { amount: 3500 },
  });

  await flow.log(execution.id, 'info', 'Checking invoice amount', { amount: 3500 }, step1.id);

  await flow.completeExecutionStep(step1.id, { result: true });

  const step2 = await flow.createExecutionStep({
    executionId: execution.id,
    stepId: 'auto_approve',
    stepName: 'Auto Approve',
    stepType: 'action',
  });

  await flow.log(execution.id, 'info', 'Auto-approving invoice');

  await flow.completeExecutionStep(step2.id, { approved: true });

  // Complete execution
  await flow.completeExecution(execution.id, {
    status: 'approved',
    approvedBy: 'system',
  });

  console.log('Execution completed successfully ✓\n');

  return execution;
}

async function schedulingExample(workflowId: string) {
  console.log('=== Scheduling Example ===\n');

  // Create a daily schedule
  const schedule = await flow.createSchedule({
    workflowId,
    name: 'Daily Invoice Check',
    cronExpression: '0 9 * * *', // Every day at 9 AM
    timezone: 'Europe/Copenhagen',
  });

  console.log('Created schedule:', schedule.id);
  console.log('Next run:', schedule.nextRun);

  // Create an interval schedule
  const intervalSchedule = await flow.createSchedule({
    workflowId,
    name: 'Hourly Sync',
    intervalMinutes: 60,
  });

  console.log('Created interval schedule:', intervalSchedule.id, '\n');
}

async function webhookExample(workflowId: string) {
  console.log('=== Webhook Example ===\n');

  // Create webhook
  const webhook = await flow.createWebhook({
    workflowId,
    name: 'Invoice Webhook',
    url: `https://flow.tekup.com/webhooks/${workflowId}`,
    secret: 'super_secret_key_123',
  });

  console.log('Created webhook:', webhook.url);

  // Simulate webhook call
  await flow.logWebhookRequest(webhook.id);
  console.log('Logged webhook request\n');
}

async function integrationExample() {
  console.log('=== Integration Example ===\n');

  // Create Slack integration
  const slackIntegration = await flow.createIntegration({
    name: 'Slack Notifications',
    type: 'slack',
    config: {
      webhookUrl: 'https://hooks.slack.com/services/xxx',
      channel: '#invoices',
    },
    owner: 'user_123',
  });

  console.log('Created Slack integration:', slackIntegration.id);

  // Create email integration
  const emailIntegration = await flow.createIntegration({
    name: 'Email Service',
    type: 'email',
    config: {
      provider: 'sendgrid',
      apiKey: 'sg_xxx',
      from: 'noreply@tekup.com',
    },
    owner: 'user_123',
  });

  console.log('Created email integration:', emailIntegration.id);

  // Track usage
  await flow.updateIntegrationUsage(slackIntegration.id);
  console.log('Tracked integration usage\n');
}

async function variablesExample(workflowId: string) {
  console.log('=== Variables Example ===\n');

  // Set workflow-specific variable
  await flow.setVariable('approval_threshold', '5000', workflowId);
  console.log('Set approval threshold');

  // Set global variable
  await flow.setVariable('company_name', 'Tekup', undefined);
  console.log('Set global variable');

  // Set secret variable
  await flow.setVariable('api_key', 'secret_key_123', workflowId, true);
  console.log('Set secret variable');

  // Get variable
  const threshold = await flow.getVariable('approval_threshold', workflowId);
  console.log('Retrieved threshold:', threshold?.value, '\n');
}

async function analyticsExample(workflowId: string) {
  console.log('=== Analytics Example ===\n');

  // Track metrics
  await flow.trackMetric('executions', 1, workflowId);
  await flow.trackMetric('success_rate', 100, workflowId);
  await flow.trackMetric('avg_duration', 1500, workflowId, { unit: 'ms' });

  console.log('Tracked workflow metrics');

  // Get metrics
  const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Last 7 days
  const endDate = new Date();

  const metrics = await flow.getMetrics('executions', startDate, endDate, workflowId);
  console.log(`Total executions in last 7 days: ${metrics.length}`);

  console.log('\n✅ All Flow examples completed!\n');
}

async function runAllExamples() {
  try {
    const workflow = await workflowManagementExample();
    await executionExample(workflow.id);
    await schedulingExample(workflow.id);
    await webhookExample(workflow.id);
    await integrationExample();
    await variablesExample(workflow.id);
    await analyticsExample(workflow.id);
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Uncomment to run
// runAllExamples();

export { runAllExamples };
