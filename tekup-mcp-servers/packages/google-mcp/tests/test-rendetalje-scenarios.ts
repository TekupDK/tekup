/**
 * Rendetalje Lead Management - Complex Scenario Tests
 * 
 * This file demonstrates all Google MCP tools working with realistic
 * Rendetalje lead management scenarios based on inbox handling.
 */

import { log } from '../src/utils/logger.js';
import { getGoogleMcpConfig } from '../src/config.js';
import * as calendarTools from '../src/tools/calendar.js';
import * as gmailTools from '../src/tools/gmail.js';

/**
 * Test Scenario 1: New Lead Processing
 * Search for unread emails, identify leads, and create follow-up tasks
 */
async function testScenario1_NewLeadProcessing() {
  log.info('=== Scenario 1: New Lead Processing ===');
  
  try {
    // Step 1: Search for unread emails from today
    log.info('Step 1: Searching for unread emails from today');
    const unreadEmails = await gmailTools.searchEmails({
      query: 'is:unread newer_than:1d',
      maxResults: 10,
    });
    
    log.info(`Found ${unreadEmails.messages.length} unread emails`);
    
    // Step 2: For each email, simulate lead processing
    for (const email of unreadEmails.messages.slice(0, 3)) {
      log.info(`Processing email from: ${email.from}`);
      
      // Check if email contains lead keywords
      const isLead = email.subject?.toLowerCase().includes('tilbud') ||
                     email.subject?.toLowerCase().includes('pris') ||
                     email.subject?.toLowerCase().includes('forespørgsel');
      
      if (isLead) {
        log.info('  → Identified as lead email');
        
        // Step 3: Create follow-up calendar event
        const followUpDate = new Date();
        followUpDate.setDate(followUpDate.getDate() + 2);
        followUpDate.setHours(10, 0, 0, 0);
        
        log.info('  → Creating follow-up calendar event');
        const event = await calendarTools.createCalendarEvent({
          summary: `Opfølgning: Lead fra ${email.from}`,
          description: `Follow-up på lead email med emne: ${email.subject}`,
          startTime: followUpDate.toISOString(),
          endTime: new Date(followUpDate.getTime() + 30 * 60000).toISOString(),
        });
        
        log.info(`  → Calendar event created: ${event.id}`);
        
        // Step 4: Mark email as read (processed)
        log.info('  → Marking email as read');
        await gmailTools.markEmailAsRead({ messageId: email.id });
        
        log.info('  ✓ Lead processed successfully');
      }
    }
    
    log.info('✓ Scenario 1 completed successfully');
    return true;
  } catch (error) {
    log.error('✗ Scenario 1 failed', error);
    return false;
  }
}

/**
 * Test Scenario 2: Lead Thread Analysis
 * Find all emails from a specific sender and check for scheduled meetings
 */
async function testScenario2_LeadThreadAnalysis() {
  log.info('=== Scenario 2: Lead Thread Analysis ===');
  
  try {
    // Step 1: Search for emails from specific sender (last 30 days)
    log.info('Step 1: Searching for emails from specific lead');
    const threadEmails = await gmailTools.searchEmails({
      query: 'newer_than:30d',
      maxResults: 5,
    });
    
    log.info(`Found ${threadEmails.messages.length} emails in thread`);
    
    if (threadEmails.messages.length > 0) {
      const firstEmail = threadEmails.messages[0];
      const leadEmail = firstEmail.from || 'unknown';
      
      // Step 2: Analyze thread
      log.info(`Analyzing thread from: ${leadEmail}`);
      log.info(`  Subject: ${firstEmail.subject}`);
      log.info(`  Date: ${firstEmail.date}`);
      
      // Step 3: Check calendar for meetings with this lead
      log.info('Step 2: Checking calendar for scheduled meetings');
      const upcomingEvents = await calendarTools.listCalendarEvents({
        maxResults: 10,
      });
      
      const leadMeetings = upcomingEvents.filter(event => 
        event.summary?.toLowerCase().includes('opfølgning') ||
        event.description?.toLowerCase().includes(leadEmail)
      );
      
      log.info(`Found ${leadMeetings.length} meetings related to this lead`);
      
      if (leadMeetings.length > 0) {
        leadMeetings.forEach(meeting => {
          log.info(`  → Meeting: ${meeting.summary} at ${meeting.start.dateTime}`);
        });
      } else {
        log.info('  → No meetings scheduled yet');
      }
    }
    
    log.info('✓ Scenario 2 completed successfully');
    return true;
  } catch (error) {
    log.error('✗ Scenario 2 failed', error);
    return false;
  }
}

/**
 * Test Scenario 3: Automated Lead Qualification
 * Search for pricing inquiries and automatically schedule calls if calendar is available
 */
async function testScenario3_AutomatedQualification() {
  log.info('=== Scenario 3: Automated Lead Qualification ===');
  
  try {
    // Step 1: Search for pricing inquiries
    log.info('Step 1: Searching for pricing inquiries');
    const pricingEmails = await gmailTools.searchEmails({
      query: 'subject:(tilbud OR pris) newer_than:7d',
      maxResults: 5,
    });
    
    log.info(`Found ${pricingEmails.messages.length} pricing inquiries`);
    
    // Step 2: Check calendar availability for next week
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 3);
    targetDate.setHours(10, 0, 0, 0);
    
    const endDate = new Date(targetDate.getTime() + 60 * 60000); // 1 hour later
    
    log.info('Step 2: Checking calendar availability');
    const conflicts = await calendarTools.checkCalendarConflicts({
      startTime: targetDate.toISOString(),
      endTime: endDate.toISOString(),
    });
    
    if (conflicts.hasConflict) {
      log.info(`  ⚠ Time slot has ${conflicts.conflicts.length} conflict(s)`);
      conflicts.conflicts.forEach(conflict => {
        log.info(`    - ${conflict.summary} at ${conflict.start.dateTime}`);
      });
    } else {
      log.info('  ✓ Time slot is available');
      
      // Step 3: Create meeting for high-priority lead
      if (pricingEmails.messages.length > 0) {
        const firstLead = pricingEmails.messages[0];
        log.info('Step 3: Scheduling call with high-priority lead');
        
        const meeting = await calendarTools.createCalendarEvent({
          summary: `Telefon: Opfølgning på ${firstLead.subject}`,
          description: `Lead: ${firstLead.from}\nEmail ID: ${firstLead.id}`,
          startTime: targetDate.toISOString(),
          endTime: endDate.toISOString(),
        });
        
        log.info(`  ✓ Meeting scheduled: ${meeting.id}`);
      }
    }
    
    log.info('✓ Scenario 3 completed successfully');
    return true;
  } catch (error) {
    log.error('✗ Scenario 3 failed', error);
    return false;
  }
}

/**
 * Test Scenario 4: Daily Lead Digest
 * Create a summary of all new leads with priority categorization
 */
async function testScenario4_DailyLeadDigest() {
  log.info('=== Scenario 4: Daily Lead Digest ===');
  
  try {
    // Step 1: Get all emails from last 24 hours
    log.info('Step 1: Fetching emails from last 24 hours');
    const recentEmails = await gmailTools.searchEmails({
      query: 'newer_than:1d',
      maxResults: 20,
    });
    
    log.info(`Found ${recentEmails.messages.length} recent emails`);
    
    // Step 2: Categorize by priority
    const highPriority: typeof recentEmails.messages = [];
    const normalPriority: typeof recentEmails.messages = [];
    
    recentEmails.messages.forEach(email => {
      const subject = email.subject?.toLowerCase() || '';
      const isHighPriority = 
        subject.includes('pris') ||
        subject.includes('tilbud') ||
        subject.includes('køb') ||
        subject.includes('akut');
      
      if (isHighPriority) {
        highPriority.push(email);
      } else {
        normalPriority.push(email);
      }
    });
    
    // Step 3: Generate digest
    log.info('Step 2: Generating lead digest');
    log.info('');
    log.info('📊 DAGLIG LEAD RAPPORT');
    log.info('='.repeat(50));
    log.info(`Total emails: ${recentEmails.messages.length}`);
    log.info(`Høj prioritet: ${highPriority.length}`);
    log.info(`Normal prioritet: ${normalPriority.length}`);
    log.info('');
    
    if (highPriority.length > 0) {
      log.info('🔴 HØJ PRIORITET LEADS:');
      highPriority.forEach((email, idx) => {
        log.info(`${idx + 1}. ${email.from}`);
        log.info(`   Emne: ${email.subject}`);
        log.info(`   Anbefaling: Send tilbud inden 24 timer, book møde`);
        log.info('');
      });
    }
    
    if (normalPriority.length > 0) {
      log.info('⚪ NORMAL PRIORITET:');
      normalPriority.slice(0, 3).forEach((email, idx) => {
        log.info(`${idx + 1}. ${email.from} - ${email.subject}`);
      });
    }
    
    log.info('✓ Scenario 4 completed successfully');
    return true;
  } catch (error) {
    log.error('✗ Scenario 4 failed', error);
    return false;
  }
}

/**
 * Test Scenario 5: Lead Nurturing Automation
 * Find old leads without recent contact and send reminders
 */
async function testScenario5_LeadNurturing() {
  log.info('=== Scenario 5: Lead Nurturing Automation ===');
  
  try {
    // Step 1: Find old leads (from last month, but not contacted in 2 weeks)
    log.info('Step 1: Searching for old leads needing follow-up');
    const oldLeads = await gmailTools.searchEmails({
      query: 'newer_than:30d older_than:14d',
      maxResults: 5,
    });
    
    log.info(`Found ${oldLeads.messages.length} leads needing nurturing`);
    
    // Step 2: Create tentative meeting for each lead
    for (const lead of oldLeads.messages.slice(0, 2)) {
      log.info(`Processing lead: ${lead.from}`);
      
      // Create tentative meeting 1 week from now
      const meetingDate = new Date();
      meetingDate.setDate(meetingDate.getDate() + 7);
      meetingDate.setHours(14, 0, 0, 0);
      
      log.info('  → Creating tentative meeting');
      const event = await calendarTools.createCalendarEvent({
        summary: `Tentativt: Opfølgning ${lead.from}`,
        description: `Follow-up på tidligere henvendelse\nOriginal emne: ${lead.subject}`,
        startTime: meetingDate.toISOString(),
        endTime: new Date(meetingDate.getTime() + 60 * 60000).toISOString(),
      });
      
      log.info(`  ✓ Tentative meeting created: ${event.id}`);
      
      // Note: In production, would also send reminder email
      log.info('  → Would send reminder email (skipped in test)');
    }
    
    log.info('✓ Scenario 5 completed successfully');
    return true;
  } catch (error) {
    log.error('✗ Scenario 5 failed', error);
    return false;
  }
}

/**
 * Test Scenario 6: Email Labels Management
 * Retrieve and display all Gmail labels for organization
 */
async function testScenario6_LabelManagement() {
  log.info('=== Scenario 6: Email Labels Management ===');
  
  try {
    log.info('Step 1: Fetching all Gmail labels');
    const labels = await gmailTools.getEmailLabels();
    
    log.info(`Found ${labels.length} labels`);
    
    // Categorize labels
    const systemLabels = labels.filter(l => l.type === 'system');
    const userLabels = labels.filter(l => l.type === 'user');
    
    log.info('');
    log.info('📁 SYSTEM LABELS:');
    systemLabels.slice(0, 5).forEach(label => {
      log.info(`  - ${label.name}`);
    });
    
    if (userLabels.length > 0) {
      log.info('');
      log.info('📁 CUSTOM LABELS:');
      userLabels.forEach(label => {
        log.info(`  - ${label.name}`);
      });
    }
    
    log.info('✓ Scenario 6 completed successfully');
    return true;
  } catch (error) {
    log.error('✗ Scenario 6 failed', error);
    return false;
  }
}

/**
 * Main test runner
 */
async function runAllScenarios() {
  const config = getGoogleMcpConfig();
  
  log.info('╔════════════════════════════════════════════════════════╗');
  log.info('║   RENDETALJE LEAD MANAGEMENT - SCENARIO TESTS         ║');
  log.info('╚════════════════════════════════════════════════════════╝');
  log.info('');
  log.info(`Google Configured: ${config.google.isConfigured}`);
  log.info(`Impersonated User: ${config.google.impersonatedUser}`);
  log.info('');
  
  if (!config.google.isConfigured) {
    log.warn('⚠️  Google credentials not configured - tests will fail');
    log.warn('   Set GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY to run tests');
    process.exit(1);
  }
  
  const results: Record<string, boolean> = {};
  
  // Run all scenarios
  results['Scenario 1: New Lead Processing'] = await testScenario1_NewLeadProcessing();
  log.info('');
  
  results['Scenario 2: Lead Thread Analysis'] = await testScenario2_LeadThreadAnalysis();
  log.info('');
  
  results['Scenario 3: Automated Qualification'] = await testScenario3_AutomatedQualification();
  log.info('');
  
  results['Scenario 4: Daily Lead Digest'] = await testScenario4_DailyLeadDigest();
  log.info('');
  
  results['Scenario 5: Lead Nurturing'] = await testScenario5_LeadNurturing();
  log.info('');
  
  results['Scenario 6: Label Management'] = await testScenario6_LabelManagement();
  log.info('');
  
  // Summary
  log.info('╔════════════════════════════════════════════════════════╗');
  log.info('║                    TEST SUMMARY                        ║');
  log.info('╚════════════════════════════════════════════════════════╝');
  log.info('');
  
  const passed = Object.values(results).filter(r => r).length;
  const total = Object.keys(results).length;
  
  Object.entries(results).forEach(([name, success]) => {
    const status = success ? '✓' : '✗';
    log.info(`${status} ${name}`);
  });
  
  log.info('');
  log.info(`Total: ${passed}/${total} scenarios passed`);
  
  if (passed === total) {
    log.info('');
    log.info('🎉 ALL TESTS PASSED! All tools are fully functional.');
    log.info('');
    log.info('The Google MCP server is ready for:');
    log.info('  ✓ Processing Rendetalje lead emails');
    log.info('  ✓ Automating follow-up scheduling');
    log.info('  ✓ Analyzing email threads');
    log.info('  ✓ Managing calendar events');
    log.info('  ✓ Daily lead reporting');
    log.info('  ✓ Lead nurturing automation');
  } else {
    log.error(`⚠️  ${total - passed} scenario(s) failed`);
    process.exit(1);
  }
}

// Run tests
runAllScenarios().catch(error => {
  log.error('Fatal error running scenarios', error);
  process.exit(1);
});
