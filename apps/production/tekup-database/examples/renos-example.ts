/**
 * Example usage of RenOS client
 */

import { renos } from '../src/client/renos';

async function leadManagementExample() {
  console.log('=== Lead Management Example ===\n');

  // Create a customer
  const customer = await renos.createCustomer({
    name: 'Copenhagen Office ApS',
    email: 'contact@copenhagenoffice.dk',
    phone: '+45 12 34 56 78',
    address: 'Nyhavn 12, 1051 København K',
    companyName: 'Copenhagen Office ApS',
  });

  console.log('Created customer:', customer.id);

  // Create a lead
  const lead = await renos.createLead({
    source: 'website_form',
    name: 'Office Cleaning Inquiry',
    email: customer.email,
    phone: customer.phone,
    address: customer.address,
    customerId: customer.id,
  });

  console.log('Created lead:', lead.id);

  // Score the lead
  await renos.updateLeadScore(lead.id, 85, 'high', {
    factors: ['large_office', 'repeat_customer', 'high_budget'],
    confidence: 0.92,
  });

  console.log('Lead scored: 85 (high priority)');

  // Enrich lead
  await renos.enrichLead(lead.id, {
    companyName: 'Copenhagen Office ApS',
    industry: 'Professional Services',
    estimatedSize: '500-1000 sqm',
    estimatedValue: 15000,
  });

  console.log('Lead enriched with company data');
}

async function bookingExample() {
  console.log('\n=== Booking & Time Tracking Example ===\n');

  // Find customer
  const customer = await renos.findCustomer('contact@copenhagenoffice.dk');
  if (!customer) throw new Error('Customer not found');

  // Create booking
  const booking = await renos.createBooking({
    customerId: customer.id,
    serviceType: 'office_cleaning',
    address: customer.address,
    scheduledAt: new Date('2025-10-22T09:00:00'),
    estimatedDuration: 180, // 3 hours
  });

  console.log('Booking created:', booking.id);
  console.log('Scheduled for:', booking.scheduledAt);

  // Start timer
  await renos.startTimer(booking.id);
  console.log('Timer started at:', new Date());

  // Simulate break
  const breakRecord = await renos.addBreak(booking.id, 'lunch');
  console.log('Break started (lunch)');

  // End break after 30 minutes (simulated)
  await new Promise((resolve) => setTimeout(resolve, 1000)); // 1 sec in real time
  await renos.endBreak(breakRecord.id);
  console.log('Break ended');

  // Complete booking
  const completed = await renos.stopTimer(booking.id);
  console.log('Booking completed!');
  console.log('Estimated duration:', completed.estimatedDuration, 'min');
  console.log('Actual duration:', completed.actualDuration, 'min');
  console.log('Efficiency score:', completed.efficiencyScore?.toFixed(2));
}

async function invoiceExample() {
  console.log('\n=== Invoice Example ===\n');

  const customer = await renos.findCustomer('contact@copenhagenoffice.dk');
  if (!customer) throw new Error('Customer not found');

  // Create invoice
  const invoice = await renos.createInvoice({
    invoiceNumber: '2025-001',
    customerId: customer.id,
    customerName: customer.name,
    customerEmail: customer.email,
    dueDate: new Date('2025-11-22'),
    lineItems: [
      {
        description: 'Office Cleaning - 500 sqm',
        quantity: 1,
        unitPrice: 3500,
      },
      {
        description: 'Window Cleaning - 20 windows',
        quantity: 20,
        unitPrice: 150,
      },
      {
        description: 'Deep Carpet Cleaning',
        quantity: 1,
        unitPrice: 2000,
      },
    ],
  });

  console.log('Invoice created:', invoice.invoiceNumber);
  console.log('Subtotal:', invoice.subtotal, 'DKK');
  console.log('VAT (25%):', invoice.vatAmount, 'DKK');
  console.log('Total:', invoice.total, 'DKK');

  // Mark as paid
  await renos.markInvoicePaid(
    invoice.id,
    invoice.total,
    'bank_transfer',
    'REF-2025-001'
  );

  console.log('Invoice marked as paid');
}

async function emailExample() {
  console.log('\n=== Email Management Example ===\n');

  // Create email thread
  const thread = await renos.createEmailThread({
    gmailThreadId: 'thread_abc123',
    subject: 'Re: Cleaning Service Inquiry',
    snippet: 'Thank you for your interest...',
    participants: ['contact@copenhagenoffice.dk', 'info@tekup.com'],
  });

  console.log('Email thread created:', thread.id);

  // Add incoming message
  await renos.addEmailMessage({
    gmailThreadId: thread.gmailThreadId,
    threadId: thread.id,
    from: 'contact@copenhagenoffice.dk',
    to: ['info@tekup.com'],
    subject: 'Cleaning Service Inquiry',
    body: 'We need weekly office cleaning for our 500 sqm office.',
    direction: 'inbound',
    sentAt: new Date(),
  });

  console.log('Inbound message added');

  // Generate AI response (to be approved)
  const response = await renos.createEmailResponse({
    leadId: 'lead_123',
    recipientEmail: 'contact@copenhagenoffice.dk',
    subject: 'Re: Cleaning Service Inquiry',
    body: 'Thank you for your inquiry! We would love to help...',
    aiModel: 'gpt-4',
  });

  console.log('AI response generated (pending approval)');

  // Approve and send
  await renos.approveEmailResponse(response.id, thread.gmailThreadId);
  await renos.sendEmailResponse(response.id, 'msg_xyz789');

  console.log('Response approved and sent');
}

async function analyticsExample() {
  console.log('\n=== Analytics Example ===\n');

  // Track various metrics
  await renos.trackMetric('leads_generated', 12, { source: 'website' });
  await renos.trackMetric('bookings_completed', 8);
  await renos.trackMetric('revenue', 45000, { currency: 'DKK' });
  await renos.trackMetric('customer_satisfaction', 4.8, { scale: '1-5' });

  console.log('Metrics tracked');

  // Get metrics for date range
  const startDate = new Date('2025-10-01');
  const endDate = new Date('2025-10-31');

  const revenueMetrics = await renos.getMetrics('revenue', startDate, endDate);
  const totalRevenue = revenueMetrics.reduce((sum, m) => sum + m.value, 0);

  console.log('Total revenue this month:', totalRevenue, 'DKK');
}

async function cleaningPlanExample() {
  console.log('\n=== Cleaning Plan Example ===\n');

  const customer = await renos.findCustomer('contact@copenhagenoffice.dk');
  if (!customer) throw new Error('Customer not found');

  // Create comprehensive cleaning plan
  const plan = await renos.createCleaningPlan({
    customerId: customer.id,
    name: 'Weekly Office Cleaning - Copenhagen Office',
    description: 'Standard weekly cleaning for 500 sqm office space',
    serviceType: 'office_cleaning',
    frequency: 'weekly',
    estimatedDuration: 180,
    squareMeters: 500,
    address: customer.address,
    tasks: [
      {
        name: 'Vacuum all floors',
        description: 'Vacuum carpets and rugs in all rooms',
        category: 'floors',
        estimatedTime: 45,
        isRequired: true,
      },
      {
        name: 'Empty trash bins',
        description: 'Empty and replace liners in all trash bins',
        category: 'general',
        estimatedTime: 15,
        isRequired: true,
      },
      {
        name: 'Clean desks',
        description: 'Wipe down all desk surfaces',
        category: 'surfaces',
        estimatedTime: 30,
        isRequired: true,
      },
      {
        name: 'Clean bathrooms',
        description: 'Deep clean all bathroom facilities',
        category: 'bathrooms',
        estimatedTime: 40,
        isRequired: true,
      },
      {
        name: 'Kitchen cleaning',
        description: 'Clean kitchen surfaces, sink, and appliances',
        category: 'kitchen',
        estimatedTime: 25,
        isRequired: true,
      },
      {
        name: 'Window cleaning',
        description: 'Clean interior windows',
        category: 'windows',
        estimatedTime: 25,
        isRequired: false,
      },
    ],
  });

  console.log('Cleaning plan created:', plan.name);
  console.log('Total tasks:', plan.tasks.length);
  console.log('Estimated duration:', plan.estimatedDuration, 'minutes');
}

// Run all examples
async function runAllExamples() {
  try {
    await leadManagementExample();
    await bookingExample();
    await invoiceExample();
    await emailExample();
    await analyticsExample();
    await cleaningPlanExample();

    console.log('\n✅ All examples completed successfully!');
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Uncomment to run
// runAllExamples();

export { runAllExamples };
