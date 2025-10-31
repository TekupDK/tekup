#!/usr/bin/env node

/**
 * Tekup-Billy MCP Server
 * Model Context Protocol server for Billy.dk API integration
 * Provides invoice, customer, product, and revenue management tools
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import dotenv from 'dotenv';
import { z } from 'zod';
import { log } from './utils/logger.js';

// Load environment variables
dotenv.config();

import { getBillyConfig, validateEnvironment } from './config.js';
import { BillyClient } from './billy-client.js';
import { createCacheManager, CacheManager } from './database/cache-manager.js';
import { createAuditor, AuditLogger } from './middleware/audit-logger.js';
import { isSupabaseEnabled } from './database/supabase-client.js';

// Import tool functions
import { 
  listInvoices, 
  createInvoice, 
  getInvoice, 
  sendInvoice,
  updateInvoice,
  approveInvoice,
  cancelInvoice,
  markInvoicePaid
} from './tools/invoices.js';
import { 
  listCustomers, 
  createCustomer, 
  getCustomer,
  updateCustomer
} from './tools/customers.js';
import { 
  listProducts, 
  createProduct,
  updateProduct
} from './tools/products.js';
import { getRevenue } from './tools/revenue.js';
import { listTestScenarios, runTestScenario, generateTestData } from './tools/test-runner.js';
import { validateAuth, testConnection } from './tools/debug.js';
import { 
  analyzeUserPatterns, 
  generatePersonalizedPresets, 
  getRecommendedPresets, 
  executePreset, 
  listPresets, 
  createCustomPreset 
} from './tools/presets.js';
import { 
  analyzeFeedback, 
  analyzeUsageData, 
  analyzeAdoptionRisks, 
  analyzeABTest, 
  analyzeSegmentAdoption 
} from './tools/analytics.js';

// Server information
const SERVER_INFO = {
  name: 'tekup-billy-server',
  version: '1.4.4',
  description: 'MCP server for Billy.dk API integration - invoice, customer, product, revenue management, and data analytics',
};

class TekupBillyServer {
  private server: McpServer;
  private billyClient: BillyClient | null = null;
  private cacheManager: CacheManager | null = null;
  private auditor: AuditLogger | null = null;
  private organizationId: string | null = null;

  constructor() {
    this.server = new McpServer(SERVER_INFO);
    this.setupTools();
    this.setupErrorHandling();
  }

  private async initializeBillyClient(): Promise<BillyClient> {
    if (!this.billyClient) {
      // Validate environment variables
      validateEnvironment();

      // Get configuration
      const config = getBillyConfig();

      // Store organization ID for caching and audit logging
      this.organizationId = config.organizationId;

      // Initialize Billy client
      this.billyClient = new BillyClient(config);
    }

    return this.billyClient;
  }

  private async initializeCacheManager(): Promise<CacheManager> {
    if (!this.cacheManager) {
      // Ensure Billy client is initialized first (to get organizationId)
      await this.initializeBillyClient();

      if (!this.organizationId) {
        throw new Error('Organization ID not available');
      }

      // Initialize cache manager with 5 minute TTL
      this.cacheManager = createCacheManager(this.organizationId, 5);
    }

    return this.cacheManager;
  }

  private async initializeAuditor(): Promise<AuditLogger> {
    if (!this.auditor) {
      // Ensure Billy client is initialized first (to get organizationId)
      await this.initializeBillyClient();

      if (!this.organizationId) {
        throw new Error('Organization ID not available');
      }

      // Initialize auditor
      this.auditor = createAuditor(this.organizationId);
    }

    return this.auditor;
  }

  /**
   * Helper function to wrap tool execution with audit logging
   */
  private async wrapToolWithAudit<T>(
    toolName: string,
    action: 'read' | 'create' | 'update' | 'delete',
    toolFunction: (client: BillyClient, args: any) => Promise<T>,
    args: any
  ): Promise<T> {
    const client = await this.initializeBillyClient();
    const auditor = await this.initializeAuditor();

    const wrappedTool = auditor.wrap(toolName, action, async (toolArgs: any) => {
      return await toolFunction(client, toolArgs);
    });

    return await wrappedTool(args);
  }

  private setupTools(): void {
    // Register list invoices tool
    this.server.registerTool(
      'list_invoices',
      {
        description: 'List invoices with optional filtering by date range, state, or customer',
        inputSchema: {
          startDate: z.string().optional().describe('Start date in YYYY-MM-DD format'),
          endDate: z.string().optional().describe('End date in YYYY-MM-DD format'),
          state: z.enum(['draft', 'approved', 'sent', 'paid', 'cancelled']).optional().describe('Invoice state filter'),
          contactId: z.string().optional().describe('Filter by customer contact ID'),
        },
      },
      async (args: any) => {
        return await this.wrapToolWithAudit('list_invoices', 'read', listInvoices, args);
      }
    );

    // Register create invoice tool
    this.server.registerTool(
      'create_invoice',
      {
        description: 'Create a new invoice for a customer',
        inputSchema: {
          contactId: z.string().describe('Customer contact ID'),
          entryDate: z.string().describe('Invoice date in YYYY-MM-DD format'),
          paymentTermsDays: z.number().optional().describe('Payment terms in days (default: 30)'),
          lines: z.array(z.object({
            description: z.string().describe('Line item description'),
            quantity: z.number().positive().describe('Quantity'),
            unitPrice: z.number().describe('Unit price'),
            productId: z.string().describe('Product ID (required - use list_products to find valid IDs)'),
          })).min(1).describe('Invoice line items'),
        },
      },
      async (args: any) => {
        return await this.wrapToolWithAudit('create_invoice', 'create', createInvoice, args);
      }
    );

    // Register get invoice tool
    this.server.registerTool(
      'get_invoice',
      {
        description: 'Get a specific invoice by ID',
        inputSchema: {
          invoiceId: z.string().describe('Invoice ID to retrieve'),
        },
      },
      async (args: any) => {
        return await this.wrapToolWithAudit('get_invoice', 'read', getInvoice, args);
      }
    );

    // Register send invoice tool
    this.server.registerTool(
      'send_invoice',
      {
        description: 'Send an invoice to the customer via email',
        inputSchema: {
          invoiceId: z.string().describe('Invoice ID to send'),
          message: z.string().optional().describe('Optional message to include with the invoice'),
        },
      },
      async (args: any) => {
        return await this.wrapToolWithAudit('send_invoice', 'update', sendInvoice, args);
      }
    );

    // Sprint 1: New invoice lifecycle tools
    
    // Register update invoice tool
    this.server.registerTool(
      'update_invoice',
      {
        description: 'Update an existing invoice',
        inputSchema: {
          invoiceId: z.string().describe('Invoice ID to update'),
          contactId: z.string().optional().describe('Customer contact ID'),
          entryDate: z.string().optional().describe('Invoice date in YYYY-MM-DD format'),
          paymentTermsDays: z.number().optional().describe('Payment terms in days'),
          lines: z.array(z.object({
            description: z.string().describe('Line item description'),
            quantity: z.number().positive().describe('Quantity'),
            unitPrice: z.number().describe('Unit price'),
            productId: z.string().describe('Product ID (required by Billy API)'),
          })).optional().describe('Invoice line items'),
        },
      },
      async (args: any) => {
        return await this.wrapToolWithAudit('update_invoice', 'update', updateInvoice, args);
      }
    );

    // Register approve invoice tool
    this.server.registerTool(
      'approve_invoice',
      {
        description: '⚠️ Approve an invoice (PERMANENT - assigns final invoice number). Only use when invoice has been reviewed and is ready. DO NOT call automatically after create_invoice - let user review first!',
        inputSchema: {
          invoiceId: z.string().describe('Invoice ID to approve'),
        },
      },
      async (args: any) => {
        return await this.wrapToolWithAudit('approve_invoice', 'update', approveInvoice, args);
      }
    );

    // Register cancel invoice tool
    this.server.registerTool(
      'cancel_invoice',
      {
        description: 'Cancel an invoice',
        inputSchema: {
          invoiceId: z.string().describe('Invoice ID to cancel'),
          reason: z.string().optional().describe('Optional reason for cancellation'),
        },
      },
      async (args: any) => {
        return await this.wrapToolWithAudit('cancel_invoice', 'update', cancelInvoice, args);
      }
    );

    // Register mark invoice paid tool
    this.server.registerTool(
      'mark_invoice_paid',
      {
        description: 'Mark an invoice as paid',
        inputSchema: {
          invoiceId: z.string().describe('Invoice ID to mark as paid'),
          paymentDate: z.string().describe('Payment date in YYYY-MM-DD format'),
          amount: z.number().optional().describe('Payment amount (defaults to invoice total)'),
        },
      },
      async (args: any) => {
        return await this.wrapToolWithAudit('mark_invoice_paid', 'update', markInvoicePaid, args);
      }
    );

    // Register list customers tool
    this.server.registerTool(
      'list_customers',
      {
        description: 'List all customers with optional search filtering',
        inputSchema: {
          search: z.string().optional().describe('Search term to filter customers by name or email'),
        },
      },
      async (args: any) => {
        return await this.wrapToolWithAudit('list_customers', 'read', listCustomers, args);
      }
    );

    // Register create customer tool
    this.server.registerTool(
      'create_customer',
      {
        description: 'Create a new customer',
        inputSchema: {
          name: z.string().describe('Customer name'),
          email: z.string().optional().describe('Customer email'),
          phone: z.string().optional().describe('Customer phone number'),
          address: z.object({
            street: z.string().optional(),
            city: z.string().optional(),
            zipCode: z.string().optional(),
            country: z.string().optional(),
          }).optional(),
        },
      },
      async (args: any) => {
        return await this.wrapToolWithAudit('create_customer', 'create', createCustomer, args);
      }
    );

    // Register get customer tool
    this.server.registerTool(
      'get_customer',
      {
        description: 'Get a specific customer by ID',
        inputSchema: {
          contactId: z.string().describe('Customer contact ID'),
        },
      },
      async (args: any) => {
        return await this.wrapToolWithAudit('get_customer', 'read', getCustomer, args);
      }
    );

    // Sprint 1: Update customer tool
    
    // Register update customer tool
    this.server.registerTool(
      'update_customer',
      {
        description: 'Update an existing customer',
        inputSchema: {
          contactId: z.string().describe('Customer contact ID to update'),
          name: z.string().optional().describe('Customer name'),
          email: z.string().optional().describe('Customer email'),
          phone: z.string().optional().describe('Customer phone number'),
          address: z.object({
            street: z.string().optional(),
            city: z.string().optional(),
            zipcode: z.string().optional(),
            country: z.string().optional(),
          }).optional(),
        },
      },
      async (args: any) => {
        return await this.wrapToolWithAudit('update_customer', 'update', updateCustomer, args);
      }
    );

    // Register list products tool
    this.server.registerTool(
      'list_products',
      {
        description: 'List all products with optional search filtering',
        inputSchema: {
          search: z.string().optional().describe('Search term to filter products by name'),
        },
      },
      async (args: any) => {
        return await this.wrapToolWithAudit('list_products', 'read', listProducts, args);
      }
    );

    // Register create product tool
    this.server.registerTool(
      'create_product',
      {
        description: 'Create a new product',
        inputSchema: {
          name: z.string().describe('Product name'),
          description: z.string().optional().describe('Product description'),
          prices: z.array(z.object({
            unitPrice: z.number().describe('Unit price'),
            currencyId: z.string().optional().describe('Currency ID (default: DKK)'),
          })).describe('Product prices'),
        },
      },
      async (args: any) => {
        return await this.wrapToolWithAudit('create_product', 'create', createProduct, args);
      }
    );

    // Sprint 1: Update product tool
    
    // Register update product tool
    this.server.registerTool(
      'update_product',
      {
        description: 'Update an existing product',
        inputSchema: {
          productId: z.string().describe('Product ID to update'),
          name: z.string().optional().describe('Product name'),
          description: z.string().optional().describe('Product description'),
          prices: z.array(z.object({
            unitPrice: z.number().describe('Unit price'),
            currencyId: z.string().optional().describe('Currency ID (default: DKK)'),
          })).optional().describe('Product prices'),
        },
      },
      async (args: any) => {
        return await this.wrapToolWithAudit('update_product', 'update', updateProduct, args);
      }
    );

    // Register get revenue tool
    this.server.registerTool(
      'get_revenue',
      {
        description: 'Get revenue analysis for a specific date range',
        inputSchema: {
          startDate: z.string().describe('Start date in YYYY-MM-DD format'),
          endDate: z.string().describe('End date in YYYY-MM-DD format'),
        },
      },
      async (args: any) => {
        return await this.wrapToolWithAudit('get_revenue', 'read', getRevenue, args);
      }
    );

    // Register test scenario tools
    this.server.registerTool(
      'list_test_scenarios',
      {
        description: 'List all available test scenarios for different business types and use cases',
        inputSchema: {},
      },
      async (args: any) => {
        return await this.wrapToolWithAudit('list_test_scenarios', 'read', listTestScenarios, args);
      }
    );

    this.server.registerTool(
      'run_test_scenario',
      {
        description: 'Run a specific test scenario to populate the system with test data',
        inputSchema: {
          scenarioId: z.string().describe('ID of the test scenario to run'),
          cleanup: z.boolean().optional().describe('Whether to clean up test data after running (default: false)'),
        },
      },
      async (args: any) => {
        return await this.wrapToolWithAudit('run_test_scenario', 'create', runTestScenario, args);
      }
    );

    this.server.registerTool(
      'generate_test_data',
      {
        description: 'Generate customized test data based on business type and requirements',
        inputSchema: {
          businessType: z.enum(['freelancer', 'retail', 'service']).describe('Type of business to generate data for'),
          customerCount: z.number().min(1).max(50).optional().describe('Number of customers to create (default: 5)'),
          productCount: z.number().min(1).max(20).optional().describe('Number of products to create (default: 3)'),
          invoiceCount: z.number().min(1).max(30).optional().describe('Number of invoices to create (default: 10)'),
          dateRange: z.object({
            startDate: z.string().describe('Start date in YYYY-MM-DD format'),
            endDate: z.string().describe('End date in YYYY-MM-DD format'),
          }).optional().describe('Date range for generated invoices'),
        },
      },
      async (args: any) => {
        return await this.wrapToolWithAudit('generate_test_data', 'create', generateTestData, args);
      }
    );

    // Register debug tools
    this.server.registerTool(
      'validate_auth',
      {
        description: 'Validate Billy API authentication and connection',
        inputSchema: {},
      },
      async (args: any) => {
        return await this.wrapToolWithAudit('validate_auth', 'read', validateAuth, args);
      }
    );

    this.server.registerTool(
      'test_connection',
      {
        description: 'Test connection to specific Billy API endpoint',
        inputSchema: {
          endpoint: z.string().optional().describe('Specific endpoint to test (organization, contacts, products, invoices)'),
        },
      },
      async (args: any) => {
        return await this.wrapToolWithAudit('test_connection', 'read', testConnection, args);
      }
    );

    // Register preset system tools
    this.server.registerTool(
      'analyze_user_patterns',
      {
        description: 'Analyze user behavior patterns and generate insights and recommendations',
        inputSchema: {
          userId: z.string().optional().describe('User ID to analyze (defaults to current user)'),
        },
      },
      async (args: any) => {
        const client = await this.initializeBillyClient();
        const result = await analyzeUserPatterns(client, args);
        return result;
      }
    );

    this.server.registerTool(
      'generate_personalized_presets',
      {
        description: 'Generate personalized workflow presets based on user behavior patterns',
        inputSchema: {
          userId: z.string().optional().describe('User ID to generate presets for (defaults to current user)'),
          limit: z.number().min(1).max(20).optional().describe('Maximum number of presets to return'),
        },
      },
      async (args: any) => {
        const client = await this.initializeBillyClient();
        const result = await generatePersonalizedPresets(client, args);
        return result;
      }
    );

    this.server.registerTool(
      'get_recommended_presets',
      {
        description: 'Get recommended presets based on user patterns or business type',
        inputSchema: {
          userId: z.string().optional().describe('User ID for personalized recommendations'),
          businessType: z.enum(['freelancer', 'retail', 'service']).optional().describe('Business type filter'),
          limit: z.number().min(1).max(20).optional().describe('Maximum number of presets to return'),
        },
      },
      async (args: any) => {
        const client = await this.initializeBillyClient();
        const result = await getRecommendedPresets(client, args);
        return result;
      }
    );

    this.server.registerTool(
      'execute_preset',
      {
        description: 'Execute a preset workflow with optional parameter overrides',
        inputSchema: {
          presetId: z.string().describe('ID of the preset to execute'),
          overrideParams: z.record(z.any()).optional().describe('Parameters to override in the preset'),
        },
      },
      async (args: any) => {
        const client = await this.initializeBillyClient();
        const result = await executePreset(client, args);
        return result;
      }
    );

    this.server.registerTool(
      'list_presets',
      {
        description: 'List all available presets with optional filtering and usage statistics',
        inputSchema: {
          businessType: z.enum(['freelancer', 'retail', 'service', 'general']).optional().describe('Filter by business type'),
          includeUsage: z.boolean().optional().describe('Include usage statistics'),
        },
      },
      async (args: any) => {
        const client = await this.initializeBillyClient();
        const result = await listPresets(client, args);
        return result;
      }
    );

    this.server.registerTool(
      'create_custom_preset',
      {
        description: 'Create a custom workflow preset with specified actions',
        inputSchema: {
          name: z.string().describe('Name of the preset'),
          description: z.string().describe('Description of what the preset does'),
          businessType: z.enum(['freelancer', 'retail', 'service', 'general']).describe('Business type this preset is for'),
          actions: z.array(z.object({
            tool: z.string().describe('Tool name (customers, products, invoices)'),
            action: z.string().describe('Action name (create, list, get, send)'),
            parameters: z.record(z.any()).describe('Parameters for the action'),
            description: z.string().describe('Description of this action step'),
          })).min(1).describe('Array of actions to execute in order'),
        },
      },
      async (args: any) => {
        const client = await this.initializeBillyClient();
        const result = await createCustomPreset(client, args);
        return result;
      }
    );

    // Register analytics tools
    this.server.registerTool(
      'analyze_feedback',
      {
        description: 'Analyze user feedback and identify key themes with sentiment analysis and product implications',
        inputSchema: {
          feedback: z.array(z.object({
            id: z.string().optional().describe('Unique feedback ID'),
            text: z.string().describe('Feedback text content'),
            category: z.string().optional().describe('Feedback category'),
            rating: z.number().min(1).max(5).optional().describe('User rating (1-5)'),
            timestamp: z.string().optional().describe('Feedback timestamp'),
            source: z.string().optional().describe('Feedback source'),
          })).min(1).describe('Array of user feedback objects'),
          themesCount: z.number().min(1).max(10).optional().default(4).describe('Number of themes to identify'),
        },
      },
      async (args: any) => {
        const client = await this.initializeBillyClient();
        const result = await analyzeFeedback(client, args);
        return result;
      }
    );

    this.server.registerTool(
      'analyze_usage_data',
      {
        description: 'Analyze product usage data to identify behavioral trends and user needs',
        inputSchema: {
          usageData: z.array(z.object({
            userId: z.string().optional().describe('User ID'),
            feature: z.string().describe('Feature name'),
            usageCount: z.number().describe('Number of times feature was used'),
            sessionDuration: z.number().optional().describe('Session duration in minutes'),
            timestamp: z.string().describe('Usage timestamp'),
            userSegment: z.string().optional().describe('User segment'),
          })).min(1).describe('Array of usage data objects'),
          trendsCount: z.number().min(1).max(5).optional().default(3).describe('Number of trends to identify'),
        },
      },
      async (args: any) => {
        const client = await this.initializeBillyClient();
        const result = await analyzeUsageData(client, args);
        return result;
      }
    );

    this.server.registerTool(
      'analyze_adoption_risks',
      {
        description: 'Analyze product rollout plan and identify risks to successful adoption',
        inputSchema: {
          rolloutPlan: z.object({
            features: z.array(z.object({
              name: z.string().describe('Feature name'),
              complexity: z.enum(['low', 'medium', 'high']).describe('Feature complexity'),
              dependencies: z.array(z.string()).optional().describe('Feature dependencies'),
              targetAdoption: z.number().min(0).max(100).describe('Target adoption percentage'),
              rolloutPhase: z.string().describe('Rollout phase'),
            })).min(1).describe('Array of features in rollout'),
            timeline: z.object({
              startDate: z.string().describe('Rollout start date'),
              endDate: z.string().describe('Rollout end date'),
              phases: z.array(z.object({
                name: z.string().describe('Phase name'),
                duration: z.number().describe('Phase duration in days'),
                features: z.array(z.string()).describe('Features in this phase'),
              })).min(1).describe('Rollout phases'),
            }).describe('Rollout timeline'),
            userSegments: z.array(z.object({
              name: z.string().describe('Segment name'),
              size: z.number().describe('Segment size'),
              techSavviness: z.enum(['low', 'medium', 'high']).describe('Technical savviness level'),
              resistanceToChange: z.enum(['low', 'medium', 'high']).describe('Resistance to change level'),
            })).min(1).describe('User segments'),
          }).describe('Product rollout plan'),
          risksCount: z.number().min(1).max(10).optional().default(5).describe('Number of risks to identify'),
        },
      },
      async (args: any) => {
        const client = await this.initializeBillyClient();
        const result = await analyzeAdoptionRisks(client, args);
        return result;
      }
    );

    this.server.registerTool(
      'analyze_ab_test',
      {
        description: 'Analyze A/B test results with statistical significance and recommendations',
        inputSchema: {
          testData: z.object({
            testName: z.string().describe('Name of the A/B test'),
            variantA: z.object({
              name: z.string().describe('Variant A name'),
              sampleSize: z.number().describe('Sample size for variant A'),
              conversions: z.number().describe('Number of conversions for variant A'),
              conversionRate: z.number().describe('Conversion rate for variant A'),
              revenue: z.number().optional().describe('Revenue for variant A'),
              otherMetrics: z.record(z.number()).optional().describe('Other metrics for variant A'),
            }).describe('Variant A data'),
            variantB: z.object({
              name: z.string().describe('Variant B name'),
              sampleSize: z.number().describe('Sample size for variant B'),
              conversions: z.number().describe('Number of conversions for variant B'),
              conversionRate: z.number().describe('Conversion rate for variant B'),
              revenue: z.number().optional().describe('Revenue for variant B'),
              otherMetrics: z.record(z.number()).optional().describe('Other metrics for variant B'),
            }).describe('Variant B data'),
            testDuration: z.number().optional().describe('Test duration in days'),
            confidenceLevel: z.number().min(0.8).max(0.99).optional().default(0.95).describe('Confidence level for statistical significance'),
          }).describe('A/B test data'),
        },
      },
      async (args: any) => {
        const client = await this.initializeBillyClient();
        const result = await analyzeABTest(client, args);
        return result;
      }
    );

    this.server.registerTool(
      'analyze_segment_adoption',
      {
        description: 'Compare feature adoption across different customer segments',
        inputSchema: {
          adoptionData: z.array(z.object({
            segment: z.string().describe('Customer segment'),
            feature: z.string().describe('Feature name'),
            adoptionRate: z.number().min(0).max(100).describe('Adoption rate percentage'),
            usageFrequency: z.number().describe('Usage frequency'),
            retentionRate: z.number().min(0).max(100).describe('Retention rate percentage'),
            revenue: z.number().optional().describe('Revenue generated'),
            userCount: z.number().describe('Number of users in segment'),
          })).min(1).describe('Array of segment adoption data'),
          segments: z.array(z.string()).min(2).describe('Customer segments to compare'),
          features: z.array(z.string()).min(1).describe('Features to analyze'),
        },
      },
      async (args: any) => {
        const client = await this.initializeBillyClient();
        const result = await analyzeSegmentAdoption(client, args);
        return result;
      }
    );
  }

  private setupErrorHandling(): void {
    // Handle process errors
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await this.server.close();
      process.exit(0);
    });

    process.on('uncaughtException', (error) => {
      log.error('[Uncaught Exception]', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      log.error('[Unhandled Rejection]', reason instanceof Error ? reason : new Error(String(reason)), { promise });
      process.exit(1);
    });
  }

  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    log.info('Tekup-Billy MCP Server started', {
      version: SERVER_INFO.version,
      availableTools: 'invoices, customers, products, revenue, test-scenarios, presets, analytics'
    });
  }
}

// Start the server
async function main() {
  try {
    const server = new TekupBillyServer();
    await server.start();
  } catch (error) {
    log.error('Failed to start server', error instanceof Error ? error : new Error(String(error)));
    process.exit(1);
  }
}

// Graceful shutdown handler
async function shutdown() {
  log.info('Shutting down gracefully');
  process.exit(0);
}

// Handle shutdown signals
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Handle uncaught errors
process.on('uncaughtException', async (error) => {
  log.error('Uncaught exception', error);
  process.exit(1);
});

process.on('unhandledRejection', async (reason, promise) => {
  log.error('Unhandled rejection', reason instanceof Error ? reason : new Error(String(reason)), { promise });
});

// Only run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(async (error) => {
    log.error('Server crashed', error instanceof Error ? error : new Error(String(error)));
    process.exit(1);
  });
}