/**
 * Example usage of CRM client
 */

import { crm } from '../src/client/crm';

async function contactManagementExample() {
  console.log('=== Contact Management Example ===\n');

  // Create a company
  const company = await crm.createCompany({
    name: 'Acme Corporation',
    website: 'https://acme.com',
    industry: 'Software',
    owner: 'user_123',
  });

  console.log('Created company:', company.id);

  // Create a contact
  const contact = await crm.createContact({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@acme.com',
    phone: '+45 12 34 56 78',
    title: 'CTO',
    companyId: company.id,
    owner: 'user_123',
    source: 'website',
  });

  console.log('Created contact:', contact.id);

  // Find contacts
  const contacts = await crm.findContacts({
    status: 'active',
    owner: 'user_123',
  });

  console.log(`Found ${contacts.length} contacts\n`);
}

async function dealPipelineExample() {
  console.log('=== Deal Pipeline Example ===\n');

  // Create a deal
  const deal = await crm.createDeal({
    title: 'Enterprise License - Acme Corp',
    value: 50000,
    owner: 'user_123',
    stage: 'qualification',
    expectedCloseDate: new Date('2025-12-31'),
  });

  console.log('Created deal:', deal.id);

  // Add product to deal
  await crm.addProductToDeal({
    dealId: deal.id,
    productName: 'Enterprise License',
    quantity: 1,
    unitPrice: 50000,
    discount: 10, // 10% discount
  });

  console.log('Added product to deal');

  // Move through pipeline
  await crm.moveDealToStage(deal.id, 'proposal');
  console.log('Moved to proposal stage');

  await crm.moveDealToStage(deal.id, 'negotiation');
  console.log('Moved to negotiation stage');

  // Close deal
  await crm.closeDeal(deal.id, true); // Won!
  console.log('Deal closed - WON! 🎉\n');
}

async function activityTrackingExample() {
  console.log('=== Activity Tracking Example ===\n');

  // Log a call
  await crm.logActivity({
    type: 'call',
    subject: 'Discovery call with John',
    description: 'Discussed requirements and timeline',
    owner: 'user_123',
    durationMinutes: 45,
    outcome: 'successful',
  });

  console.log('Logged phone call');

  // Log a meeting
  await crm.logActivity({
    type: 'meeting',
    subject: 'Demo presentation',
    description: 'Demonstrated product features',
    owner: 'user_123',
    durationMinutes: 60,
    outcome: 'successful',
  });

  console.log('Logged meeting\n');
}

async function taskManagementExample() {
  console.log('=== Task Management Example ===\n');

  // Create tasks
  const task = await crm.createTask({
    title: 'Follow up with John',
    description: 'Send proposal document',
    assignedTo: 'user_123',
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days
    priority: 'high',
  });

  console.log('Created task:', task.id);

  // Get my tasks
  const tasks = await crm.getTasks({
    assignedTo: 'user_123',
    status: 'todo',
  });

  console.log(`You have ${tasks.length} pending tasks`);

  // Complete task
  await crm.completeTask(task.id);
  console.log('Task completed ✓\n');
}

async function analyticsExample() {
  console.log('=== Analytics Example ===\n');

  // Track metrics
  await crm.trackMetric('deals_created', 1);
  await crm.trackMetric('deals_won', 1);
  await crm.trackMetric('revenue', 50000);

  console.log('Tracked metrics');

  // Get pipeline metrics
  const pipelineMetrics = await crm.getPipelineMetrics('user_123');
  
  console.log('Pipeline metrics:', {
    totalValue: pipelineMetrics.totalValue,
    stages: Object.keys(pipelineMetrics.byStage).length,
  });

  console.log('\n✅ All CRM examples completed!\n');
}

async function runAllExamples() {
  try {
    await contactManagementExample();
    await dealPipelineExample();
    await activityTrackingExample();
    await taskManagementExample();
    await analyticsExample();
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Uncomment to run
// runAllExamples();

export { runAllExamples };
