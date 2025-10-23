/**
 * MCP SSE Server for Shortwave Integration
 * 
 * Provides Server-Sent Events (SSE) endpoint for MCP protocol
 * Compatible with Shortwave email app and other remote MCP clients
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { Request, Response } from 'express';
import { z } from 'zod';
import { log } from './utils/logger.js';
import { BillyClient } from './billy-client.js';
import { getBillyConfig } from './config.js';

// Import tool functions
import { listInvoices, createInvoice, getInvoice, sendInvoice } from './tools/invoices.js';
import { listCustomers, createCustomer, getCustomer } from './tools/customers.js';
import { listProducts, createProduct } from './tools/products.js';
import { getRevenue } from './tools/revenue.js';
import { listTestScenarios, runTestScenario, generateTestData } from './tools/test-runner.js';

// Server information
const SERVER_INFO = {
    name: 'tekup-billy-server',
    version: '1.2.0',
    description: 'MCP server for Billy.dk API integration - invoice, customer, product, and revenue management',
};

export class McpSseServer {
    private billyClient: BillyClient | null = null;
    private activeServers: Map<string, McpServer> = new Map();

    constructor() {
        // Initialize Billy client
        try {
            const config = getBillyConfig();
            this.billyClient = new BillyClient(config);
            log.info('Billy client initialized for MCP SSE');
        } catch (error) {
            log.error('Failed to initialize Billy client', error instanceof Error ? error : new Error(String(error)));
        }
    }

    /**
     * Handle SSE connection for MCP protocol
     */
    async handleSseConnection(req: Request, res: Response): Promise<string> {
        log.info('New MCP SSE connection requested', { ip: req.ip });

        // Set SSE headers
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no'); // Disable buffering in nginx

        // Generate unique session ID (UUID format for compatibility)
        const sessionId = `${Date.now().toString(16)}-${Math.random().toString(36).substring(2, 15)}`;

        try {
            // Create new MCP server instance for this connection
            const mcpServer = new McpServer(SERVER_INFO);
            this.setupTools(mcpServer);
            this.activeServers.set(sessionId, mcpServer);

            // Create SSE transport with session-specific endpoint
            const transport = new SSEServerTransport(`/mcp/messages?sessionId=${sessionId}`, res);

            // Connect server to transport
            await mcpServer.connect(transport);

            log.info('MCP SSE connection established', { sessionId });

            // Handle connection close
            req.on('close', () => {
                log.info('MCP SSE connection closed', { sessionId });
                this.activeServers.delete(sessionId);
                mcpServer.close();
            });

            return sessionId;

        } catch (error) {
            log.error('SSE connection error', error instanceof Error ? error : new Error(String(error)));
            this.activeServers.delete(sessionId);
            throw error;
        }
    }

    /**
     * Handle incoming message for a specific session
     */
    async handleMessage(sessionId: string, message: any): Promise<void> {
        const server = this.activeServers.get(sessionId);
        if (!server) {
            throw new Error(`Session ${sessionId} not found`);
        }
        log.info('MCP message received', {
            sessionId,
            messageSize: JSON.stringify(message).length
        });
    }

    /**
     * Get active server for session
     */
    getSession(sessionId: string): McpServer | undefined {
        return this.activeServers.get(sessionId);
    }

    /**
     * Setup MCP tools
     */
    private setupTools(server: McpServer): void {
        if (!this.billyClient) {
            throw new Error('Billy client not initialized');
        }

        const client = this.billyClient;

        // Invoice tools
        server.tool(
            'list_invoices',
            'List invoices from Billy with optional filters',
            {
                page: z.number().optional().describe('Page number (default: 1)'),
                pageSize: z.number().optional().describe('Items per page (default: 50)'),
                state: z.string().optional().describe('Filter by state (draft, approved, sent, etc.)'),
            },
            async (args) => listInvoices(client, args)
        );

        server.tool(
            'create_invoice',
            'Create a new invoice in Billy',
            {
                contactId: z.string().describe('Customer contact ID'),
                entryDate: z.string().optional().describe('Invoice date (YYYY-MM-DD)'),
                paymentTermsDays: z.number().optional().describe('Payment terms in days'),
                lines: z.array(z.object({
                    productId: z.string(),
                    quantity: z.number(),
                    unitPrice: z.number(),
                    description: z.string().optional(),
                })).describe('Invoice lines'),
            },
            async (args) => createInvoice(client, args)
        );

        server.tool(
            'get_invoice',
            'Get details of a specific invoice by ID',
            {
                invoiceId: z.string().describe('Invoice ID'),
            },
            async (args) => getInvoice(client, args)
        );

        server.tool(
            'send_invoice',
            'Send invoice to customer via email',
            {
                invoiceId: z.string().describe('Invoice ID'),
                email: z.string().optional().describe('Override recipient email'),
                message: z.string().optional().describe('Custom message to include'),
            },
            async (args) => sendInvoice(client, args)
        );

        // Customer tools
        server.tool(
            'list_customers',
            'List customers/contacts from Billy',
            {
                page: z.number().optional().describe('Page number (default: 1)'),
                pageSize: z.number().optional().describe('Items per page (default: 50)'),
            },
            async (args) => listCustomers(client, args)
        );

        server.tool(
            'create_customer',
            'Create a new customer in Billy',
            {
                name: z.string().describe('Customer name'),
                email: z.string().optional().describe('Customer email'),
                phone: z.string().optional().describe('Customer phone'),
                address: z.object({
                    street: z.string().optional(),
                    city: z.string().optional(),
                    zipcode: z.string().optional(),
                    country: z.string().optional(),
                }).optional().describe('Customer address'),
            },
            async (args) => createCustomer(client, args)
        );

        server.tool(
            'get_customer',
            'Get details of a specific customer by ID',
            {
                customerId: z.string().describe('Customer ID'),
            },
            async (args) => getCustomer(client, args)
        );

        // Product tools
        server.tool(
            'list_products',
            'List products from Billy',
            {
                page: z.number().optional().describe('Page number (default: 1)'),
                pageSize: z.number().optional().describe('Items per page (default: 50)'),
            },
            async (args) => listProducts(client, args)
        );

        server.tool(
            'create_product',
            'Create a new product in Billy',
            {
                name: z.string().describe('Product name'),
                productNo: z.string().optional().describe('Product number/SKU'),
                description: z.string().optional().describe('Product description'),
                prices: z.array(z.object({
                    currencyId: z.string(),
                    unitPrice: z.number(),
                })).describe('Product prices'),
            },
            async (args) => createProduct(client, args)
        );

        // Revenue tool
        server.tool(
            'get_revenue',
            'Get revenue analytics from Billy',
            {
                startDate: z.string().describe('Start date (YYYY-MM-DD)'),
                endDate: z.string().describe('End date (YYYY-MM-DD)'),
                groupBy: z.enum(['day', 'week', 'month', 'year']).optional().describe('Group by period'),
            },
            async (args) => getRevenue(client, args)
        );

        // Test tools
        server.tool(
            'list_test_scenarios',
            'List available test scenarios',
            {},
            async (args) => listTestScenarios(client, args)
        );

        server.tool(
            'run_test_scenario',
            'Run a specific test scenario',
            {
                scenarioId: z.string().describe('Test scenario ID'),
            },
            async (args) => runTestScenario(client, args)
        );

        server.tool(
            'generate_test_data',
            'Generate test data for a business type',
            {
                businessType: z.string().describe('Business type (restaurant, retail, etc.)'),
                count: z.number().optional().describe('Number of items to generate'),
            },
            async (args) => generateTestData(client, args)
        );

        log.info('MCP tools registered', { toolCount: 13 });
    }

    /**
     * Get server statistics
     */
    getStats() {
        return {
            activeConnections: this.activeServers.size,
            billyConnected: this.billyClient !== null,
        };
    }
}

