#!/usr/bin/env node

/**
 * RenOS Calendar Intelligence MCP Server
 * Model Context Protocol server for intelligent booking validation and automation
 * 
 * The 5 Killer Features (MVP):
 * 1. validate_booking_date - Stop alle dato/ugedag fejl
 * 2. check_booking_conflicts - 0 dobbeltbookinger garanteret
 * 3. auto_create_invoice - Ingen glemte fakturaer nogensinde
 * 4. track_overtime_risk - Live alerts efter +1 time overtid
 * 5. get_customer_memory - Husker ALT om hver kunde
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import dotenv from 'dotenv';
import { logger } from './utils/logger.js';
import config, { validateConfiguration } from './config.js';

// Load environment variables
dotenv.config();

// Import integrations
import { initSupabase } from './integrations/supabase.js';
import { initCalendar } from './integrations/google-calendar.js';
import { initTwilio } from './integrations/twilio-voice.js';

// Import tool implementations
import { validateBookingDate, checkBookingConflicts } from './tools/booking-validator.js';
import { autoCreateInvoice } from './tools/invoice-automation.js';
import { trackOvertimeRisk } from './tools/overtime-tracker.js';
import { getCustomerMemory } from './tools/customer-memory.js';

// Import tool schemas
import {
  ValidateBookingDateSchema,
  CheckBookingConflictsSchema,
  AutoCreateInvoiceSchema,
  TrackOvertimeRiskSchema,
  GetCustomerMemorySchema,
} from './types.js';

/**
 * Initialize all integrations
 */
async function initializeIntegrations() {
  logger.info('Initializing RenOS Calendar Intelligence MCP...');

  // Validate configuration
  const configValidation = validateConfiguration();
  if (!configValidation.valid) {
    logger.warn('Configuration issues detected:', {
      errors: configValidation.errors,
    });
  }

  // Initialize integrations
  const supabase = initSupabase();
  if (supabase) {
    logger.info('✓ Supabase initialized');
  } else {
    logger.warn('⚠ Supabase not configured - running without database');
  }

  const calendar = initCalendar();
  if (calendar) {
    logger.info('✓ Google Calendar initialized');
  } else {
    logger.warn('⚠ Google Calendar not configured - running in dry-run mode');
  }

  const twilio = initTwilio();
  if (twilio && config.features.voiceAlerts) {
    logger.info('✓ Twilio voice alerts initialized');
  } else if (!config.features.voiceAlerts) {
    logger.info('⚠ Voice alerts disabled via configuration');
  } else {
    logger.warn('⚠ Twilio not configured - voice alerts disabled');
  }

  logger.info('Initialization complete', {
    serverName: config.server.name,
    env: config.server.env,
    features: {
      voiceAlerts: config.features.voiceAlerts,
      autoInvoice: config.features.autoInvoice,
      failSafeMode: config.features.failSafeMode,
    },
  });
}

/**
 * Create and configure MCP server
 */
async function createServer(): Promise<McpServer> {
  const server = new McpServer({
    name: config.server.name,
    version: '0.1.0',
  });

  // ==================== TOOL 1: VALIDATE BOOKING DATE ====================
  server.tool(
    'validate_booking_date',
    'Validér booking dato og tjek mod ugedag. Stopper "28. oktober er mandag" fejl (det er tirsdag!). Tjekker også mod kundens faste mønstre.',
    ValidateBookingDateSchema.shape,
    async (params) => {
      try {
        const result = await validateBookingDate(params);
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify(result, null, 2),
          }],
          isError: !result.valid,
        };
      } catch (error) {
        logger.error('validate_booking_date failed', error);
        return {
          content: [{
            type: 'text' as const,
            text: `Fejl: ${error instanceof Error ? error.message : 'Unknown error'}`,
          }],
          isError: true,
        };
      }
    }
  );

  // ==================== TOOL 2: CHECK BOOKING CONFLICTS ====================
  server.tool(
    'check_booking_conflicts',
    'Tjek for dobbeltbookinger i Google Calendar. 0 dobbeltbookinger garanteret!',
    CheckBookingConflictsSchema.shape,
    async (params) => {
      try {
        const result = await checkBookingConflicts(params);
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify(result, null, 2),
          }],
          isError: !result.valid,
        };
      } catch (error) {
        logger.error('check_booking_conflicts failed', error);
        return {
          content: [{
            type: 'text' as const,
            text: `Fejl: ${error instanceof Error ? error.message : 'Unknown error'}`,
          }],
          isError: true,
        };
      }
    }
  );

  // ==================== TOOL 3: AUTO CREATE INVOICE ====================
  server.tool(
    'auto_create_invoice',
    'Automatisk opret faktura via Billy.dk MCP efter booking. Ingen glemte fakturaer nogensinde!',
    AutoCreateInvoiceSchema.shape,
    async (params) => {
      try {
        const result = await autoCreateInvoice(params);
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify(result, null, 2),
          }],
          isError: result.status === 'failed',
        };
      } catch (error) {
        logger.error('auto_create_invoice failed', error);
        return {
          content: [{
            type: 'text' as const,
            text: `Fejl: ${error instanceof Error ? error.message : 'Unknown error'}`,
          }],
          isError: true,
        };
      }
    }
  );

  // ==================== TOOL 4: TRACK OVERTIME RISK ====================
  server.tool(
    'track_overtime_risk',
    'Track job duration og send voice alerts ved overtid. Stopper Vinni/Kate situationer (9 timer vs 6 timer)!',
    TrackOvertimeRiskSchema.shape,
    async (params) => {
      try {
        const result = await trackOvertimeRisk(params);
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify(result, null, 2),
          }],
          isError: result.status === 'alert',
        };
      } catch (error) {
        logger.error('track_overtime_risk failed', error);
        return {
          content: [{
            type: 'text' as const,
            text: `Fejl: ${error instanceof Error ? error.message : 'Unknown error'}`,
          }],
          isError: true,
        };
      }
    }
  );

  // ==================== TOOL 5: GET CUSTOMER MEMORY ====================
  server.tool(
    'get_customer_memory',
    'Hent komplet kunde-intelligence: mønstre, præferencer, historik. Husker "Jes = kun mandage", "nøgle under potte", etc.',
    GetCustomerMemorySchema.shape,
    async (params) => {
      try {
        const result = await getCustomerMemory(params);
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify(result, null, 2),
          }],
          isError: !result.found,
        };
      } catch (error) {
        logger.error('get_customer_memory failed', error);
        return {
          content: [{
            type: 'text' as const,
            text: `Fejl: ${error instanceof Error ? error.message : 'Unknown error'}`,
          }],
          isError: true,
        };
      }
    }
  );

  logger.info('MCP server configured with 5 killer features');
  return server;
}

/**
 * Main entry point
 */
async function main() {
  try {
    await initializeIntegrations();
    
    const server = await createServer();
    const transport = new StdioServerTransport();
    
    await server.connect(transport);
    
    logger.info('RenOS Calendar Intelligence MCP server running', {
      transport: 'stdio',
      tools: 5,
    });
    
  } catch (error) {
    logger.error('Fatal error starting MCP server', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Start server
main().catch((error) => {
  logger.error('Unhandled error in main', error);
  process.exit(1);
});

