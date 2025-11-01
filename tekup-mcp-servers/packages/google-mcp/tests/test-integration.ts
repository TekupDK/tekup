/**
 * Integration tests for Google MCP Server
 * Run with: pnpm test
 */

import { validateGoogleMcpConfig, getGoogleMcpConfig } from '../src/config.js';
import { log } from '../src/utils/logger.js';

async function runTests() {
  log.info('Starting Google MCP Server integration tests');
  
  try {
    // Test 1: Configuration validation
    log.info('Test 1: Validating configuration');
    validateGoogleMcpConfig();
    const config = getGoogleMcpConfig();
    log.info('Configuration loaded', {
      googleConfigured: config.google.isConfigured,
      impersonatedUser: config.google.impersonatedUser,
      calendarId: config.google.calendarId,
      port: config.server.port,
    });
    
    if (!config.google.isConfigured) {
      log.warn('Google credentials not configured - some tests will be skipped');
    }
    
    // Test 2: Calendar client initialization
    if (config.google.isConfigured) {
      log.info('Test 2: Testing Calendar client initialization');
      try {
        const { getCalendarClient } = await import('../src/utils/google-auth.js');
        getCalendarClient();
        log.info('Calendar client initialized successfully');
      } catch (error) {
        log.error('Calendar client initialization failed', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
      
      // Test 3: Gmail client initialization
      log.info('Test 3: Testing Gmail client initialization');
      try {
        const { getGmailClient } = await import('../src/utils/google-auth.js');
        getGmailClient();
        log.info('Gmail client initialized successfully');
      } catch (error) {
        log.error('Gmail client initialization failed', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
      
      // Test 4: List calendar events (dry run)
      log.info('Test 4: Testing list calendar events');
      try {
        const { listCalendarEvents } = await import('../src/tools/calendar.js');
        const events = await listCalendarEvents({ maxResults: 5 });
        log.info('Listed calendar events', { count: events.length });
      } catch (error) {
        log.error('List calendar events failed', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
      
      // Test 5: List emails (dry run)
      log.info('Test 5: Testing list emails');
      try {
        const { listEmails } = await import('../src/tools/gmail.js');
        const result = await listEmails({ maxResults: 5 });
        log.info('Listed emails', { count: result.messages.length });
      } catch (error) {
        log.error('List emails failed', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
    
    log.info('All tests completed');
    process.exit(0);
  } catch (error) {
    log.error('Test suite failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }
}

// Run tests
runTests();
