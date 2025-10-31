/**
 * MCP Streamable HTTP Transport Implementation
 * 
 * Implements MCP Protocol Specification 2025-03-26
 * https://modelcontextprotocol.io/specification/2025-03-26/basic/transports#streamable-http
 * 
 * This replaces the deprecated HTTP+SSE transport (2024-11-05) with the new
 * Streamable HTTP transport that Claude.ai custom connectors require.
 * 
 * Key Differences:
 * - Single /mcp endpoint handles both POST and GET (not separate /mcp/messages)
 * - Session ID passed via Mcp-Session-Id header (not query param)
 * - POST can return either JSON or SSE stream based on Accept header
 * - Proper support for JSON-RPC batching
 */

import { Request, Response } from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { v4 as uuidv4 } from 'uuid';
import { log } from './utils/logger.js';
import { BillyClient } from './billy-client.js';
import { getBillyConfig } from './config.js';

// Import Billy tool modules
import * as invoiceTools from './tools/invoices.js';
import * as customerTools from './tools/customers.js';
import * as productTools from './tools/products.js';
import * as revenueTools from './tools/revenue.js';
import * as testTools from './tools/test-runner.js';
import * as presetTools from './tools/presets.js';
import * as debugTools from './tools/debug.js';

// Initialize Billy client (shared instance for all MCP requests)
const billyConfig = getBillyConfig();
const billyClient = new BillyClient(billyConfig);

// Log available tools at startup
log.info('MCP Streamable Transport initialized', {
    toolCount: 27,
    breakdown: 'invoice:8, customer:4, product:3, preset:6, debug:2, other:4'
});

/**
 * Session management
 */
interface McpSession {
    id: string;
    server: McpServer;
    createdAt: Date;
    lastActivity: Date;
    eventStream?: Response; // For SSE connections
}

const sessions = new Map<string, McpSession>();

// Session cleanup - remove inactive sessions after 30 minutes
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
setInterval(() => {
    const now = new Date();
    for (const [sessionId, session] of sessions.entries()) {
        if (now.getTime() - session.lastActivity.getTime() > SESSION_TIMEOUT_MS) {
            log.info('Cleaning up inactive MCP session', { sessionId });
            sessions.delete(sessionId);
        }
    }
}, 60 * 1000); // Check every minute

/**
 * Get or create session
 */
function getOrCreateSession(sessionId?: string): McpSession {
    if (sessionId && sessions.has(sessionId)) {
        const session = sessions.get(sessionId)!;
        session.lastActivity = new Date();
        return session;
    }

    // Create new session
    const newSessionId = sessionId || uuidv4();
    const server = new McpServer({
        name: 'tekup-billy-server',
        version: '1.2.0',
        description: 'Billy.dk API integration via MCP'
    });

    const session: McpSession = {
        id: newSessionId,
        server,
        createdAt: new Date(),
        lastActivity: new Date()
    };

    sessions.set(newSessionId, session);
    log.info('Created new MCP session', {
        sessionId: newSessionId,
        toolCount: 27
    });

    return session;
}

/**
 * Handle POST /mcp
 * 
 * Receives JSON-RPC messages and returns either:
 * - JSON response (Content-Type: application/json)
 * - SSE stream (Content-Type: text/event-stream)
 * 
 * Based on Accept header and message type.
 */
export async function handleMcpPost(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    try {
        // Get session ID from header
        const sessionId = req.headers['mcp-session-id'] as string | undefined;

        // Parse Accept header
        const acceptHeader = req.headers['accept'] || 'application/json'; // Default to JSON if not specified
        const supportsSSE = acceptHeader.includes('text/event-stream');
        const supportsJSON = acceptHeader.includes('application/json') || acceptHeader.includes('*/*') || !req.headers['accept'];

        log.info('MCP POST request', {
            ip: req.ip,
            sessionId: sessionId || 'new',
            acceptHeader,
            supportsSSE,
            supportsJSON,
            bodySize: JSON.stringify(req.body).length,
            userAgent: req.headers['user-agent']
        });

        // Validate body
        if (!req.body) {
            res.status(400).json({
                jsonrpc: '2.0',
                error: {
                    code: -32700,
                    message: 'Parse error: No request body'
                }
            });
            return;
        }

        // Check if body contains only responses/notifications (no requests)
        const messages = Array.isArray(req.body) ? req.body : [req.body];
        const hasRequests = messages.some(
            (msg: any) => msg.method && !msg.result && !msg.error
        );

        // If only responses/notifications → return 202 Accepted
        if (!hasRequests) {
            log.info('MCP POST: Only responses/notifications received, returning 202');
            res.status(202).send();
            return;
        }

        // Get or create session
        const session = getOrCreateSession(sessionId);

        // If this is an initialize request, return session ID in header
        const isInitialize = messages.some((msg: any) => msg.method === 'initialize');
        if (isInitialize && !sessionId) {
            res.setHeader('Mcp-Session-Id', session.id);
            log.info('New MCP session initialized', { sessionId: session.id });
        }

        // Decide response format based on Accept header and server capabilities
        if (supportsSSE && messages.length > 0) {
            // Return SSE stream
            log.info('MCP POST: Opening SSE stream for response');

            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

            // Store event stream in session
            session.eventStream = res;

            // Process messages and stream responses
            for (const message of messages) {
                try {
                    const response = await processJsonRpcMessage(session.server, message);

                    // Send as SSE event
                    const eventData = JSON.stringify(response);
                    res.write(`data: ${eventData}\n\n`);

                } catch (error) {
                    log.error('Error processing MCP message', error instanceof Error ? error : new Error(String(error)));
                    const errorResponse = {
                        jsonrpc: '2.0',
                        id: message.id,
                        error: {
                            code: -32603,
                            message: error instanceof Error ? error.message : 'Internal error'
                        }
                    };
                    res.write(`data: ${JSON.stringify(errorResponse)}\n\n`);
                }
            }

            // Keep connection open for potential server-initiated messages
            // Connection will timeout after SESSION_TIMEOUT_MS or client disconnect

        } else if (supportsJSON) {
            // Return JSON response
            log.info('MCP POST: Returning JSON response');

            if (messages.length === 1) {
                // Single message → single response
                const messageStartTime = Date.now();
                const response = await processJsonRpcMessage(session.server, messages[0]);
                const messageDuration = Date.now() - messageStartTime;
                
                log.info('MCP message processed', {
                    method: messages[0].method,
                    duration: messageDuration,
                    sessionId: session.id
                });

                // Notifications don't get responses (response will be null)
                if (response === null) {
                    res.status(202).end(); // Accepted, no content
                } else {
                    res.json(response);
                }
            } else {
                // Batch → batch response (filter out null responses from notifications)
                const responses = await Promise.all(
                    messages.map(async (msg) => {
                        const msgStartTime = Date.now();
                        const response = await processJsonRpcMessage(session.server, msg);
                        const msgDuration = Date.now() - msgStartTime;
                        log.debug('MCP batch message processed', {
                            method: msg.method,
                            duration: msgDuration
                        });
                        return response;
                    })
                );
                const filteredResponses = responses.filter(r => r !== null);

                if (filteredResponses.length === 0) {
                    res.status(202).end(); // All notifications, no content
                } else {
                    res.json(filteredResponses);
                }
            }

        } else {
            // No acceptable content type (should not happen with updated logic above)
            log.warn('Client sent unsupported Accept header', { acceptHeader });
            res.status(406).json({
                jsonrpc: '2.0',
                error: {
                    code: -32000,
                    message: 'Not Acceptable: Client must support application/json or text/event-stream',
                    data: {
                        acceptHeader: acceptHeader,
                        supportedTypes: ['application/json', 'text/event-stream', '*/*']
                    }
                }
            });
        }

    } catch (error) {
        const totalDuration = Date.now() - startTime;
        log.error('MCP POST error', error instanceof Error ? error : new Error(String(error)), {
            method: req.method,
            path: req.path,
            duration: totalDuration,
            headers: {
                ...req.headers,
                'x-api-key': req.headers['x-api-key'] ? '[REDACTED]' : undefined
            },
            body: req.body ? (typeof req.body === 'string' ? req.body.substring(0, 200) : JSON.stringify(req.body).substring(0, 200)) : undefined,
            errorStack: error instanceof Error ? error.stack : undefined
        });

        if (!res.headersSent) {
            res.status(500).json({
                jsonrpc: '2.0',
                error: {
                    code: -32603,
                    message: error instanceof Error ? error.message : 'Internal error',
                    data: {
                        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
                    }
                }
            });
        }
    } finally {
        const totalDuration = Date.now() - startTime;
        if (totalDuration > 1000) {
            log.warn('MCP POST took longer than expected', {
                duration: totalDuration,
                path: req.path
            });
        }
    }
}

/**
 * Handle GET /mcp
 * 
 * Opens an SSE stream for server-initiated messages.
 * Optional - servers can return 405 if they don't support this.
 */
export async function handleMcpGet(req: Request, res: Response): Promise<void> {
    try {
        // Get session ID from header
        const sessionId = req.headers['mcp-session-id'] as string | undefined;

        // Check Accept header
        const acceptHeader = req.headers['accept'] || '';
        if (!acceptHeader.includes('text/event-stream')) {
            res.status(406).json({
                error: 'Not Acceptable: GET /mcp requires Accept: text/event-stream'
            });
            return;
        }

        log.info('MCP GET request (SSE stream)', {
            ip: req.ip,
            sessionId: sessionId || 'new'
        });

        // Get or create session
        const session = getOrCreateSession(sessionId);

        // If new session, include session ID in header
        if (!sessionId) {
            res.setHeader('Mcp-Session-Id', session.id);
        }

        // Open SSE stream
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');

        // Store event stream in session
        session.eventStream = res;

        // Send connection established event
        res.write(`data: ${JSON.stringify({ type: 'connected', sessionId: session.id })}\n\n`);

        log.info('SSE stream opened', { sessionId: session.id });

        // Keep connection alive with periodic heartbeat
        const heartbeat = setInterval(() => {
            res.write(`: heartbeat\n\n`);
        }, 30000); // Every 30 seconds

        // Clean up on disconnect
        req.on('close', () => {
            clearInterval(heartbeat);
            if (session.eventStream === res) {
                session.eventStream = undefined;
            }
            log.info('SSE stream closed', { sessionId: session.id });
        });

    } catch (error) {
        log.error('MCP GET error', error instanceof Error ? error : new Error(String(error)));

        if (!res.headersSent) {
            res.status(500).send('Failed to establish SSE stream');
        }
    }
}

/**
 * Handle DELETE /mcp
 * 
 * Explicitly terminate a session.
 */
export async function handleMcpDelete(req: Request, res: Response): Promise<void> {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;

    if (!sessionId) {
        res.status(400).json({
            error: 'Missing Mcp-Session-Id header'
        });
        return;
    }

    const session = sessions.get(sessionId);
    if (!session) {
        res.status(404).json({
            error: 'Session not found'
        });
        return;
    }

    // Close SSE stream if open
    if (session.eventStream && !session.eventStream.closed) {
        session.eventStream.end();
    }

    // Remove session
    sessions.delete(sessionId);
    log.info('Session terminated', { sessionId });

    res.status(200).json({
        message: 'Session terminated'
    });
}

/**
 * Execute a tool call by delegating to the appropriate tool module
 */
async function executeToolCall(toolName: string, args: any): Promise<any> {
    // Map tool names to their implementations
    switch (toolName) {
        // Invoice tools
        case 'list_invoices':
            return await invoiceTools.listInvoices(billyClient, args);
        case 'create_invoice':
            return await invoiceTools.createInvoice(billyClient, args);
        case 'get_invoice':
            return await invoiceTools.getInvoice(billyClient, args);
        case 'send_invoice':
            return await invoiceTools.sendInvoice(billyClient, args);
        case 'update_invoice':
            return await invoiceTools.updateInvoice(billyClient, args);
        case 'approve_invoice':
            return await invoiceTools.approveInvoice(billyClient, args);
        case 'cancel_invoice':
            return await invoiceTools.cancelInvoice(billyClient, args);
        case 'mark_invoice_paid':
            return await invoiceTools.markInvoicePaid(billyClient, args);

        // Customer tools
        case 'list_customers':
            return await customerTools.listCustomers(billyClient, args);
        case 'create_customer':
            return await customerTools.createCustomer(billyClient, args);
        case 'get_customer':
            return await customerTools.getCustomer(billyClient, args);
        case 'update_customer':
            return await customerTools.updateCustomer(billyClient, args);

        // Product tools
        case 'list_products':
            return await productTools.listProducts(billyClient, args);
        case 'create_product':
            return await productTools.createProduct(billyClient, args);
        case 'update_product':
            return await productTools.updateProduct(billyClient, args);

        // Revenue tools
        case 'get_revenue':
            return await revenueTools.getRevenue(billyClient, args);

        // Preset tools
        case 'analyze_user_patterns':
            return await presetTools.analyzeUserPatterns(billyClient, args);
        case 'generate_personalized_presets':
            return await presetTools.generatePersonalizedPresets(billyClient, args);
        case 'get_recommended_presets':
            return await presetTools.getRecommendedPresets(billyClient, args);
        case 'execute_preset':
            return await presetTools.executePreset(billyClient, args);
        case 'list_presets':
            return await presetTools.listPresets(billyClient, args);
        case 'create_custom_preset':
            return await presetTools.createCustomPreset(billyClient, args);

        // Debug tools
        case 'validate_auth':
            return await debugTools.validateAuth(billyClient, args);
        case 'test_connection':
            return await debugTools.testConnection(billyClient, args);

        // Test tools
        case 'list_test_scenarios':
            return await testTools.listTestScenarios(billyClient, args);
        case 'run_test_scenario':
            return await testTools.runTestScenario(billyClient, args);
        case 'generate_test_data':
            return await testTools.generateTestData(billyClient, args);

        default:
            throw new Error(`Unknown tool: ${toolName}`);
    }
}

/**
 * Process a single JSON-RPC message
 * 
 * Handles MCP protocol methods:
 * - initialize: Initialize MCP session
 * - tools/list: List available tools
 * - tools/call: Execute a specific tool
 * - (more can be added as needed)
 */
async function processJsonRpcMessage(server: McpServer, message: any): Promise<any> {
    // Validate JSON-RPC format
    if (!message.jsonrpc || message.jsonrpc !== '2.0') {
        return {
            jsonrpc: '2.0',
            id: message.id || null,
            error: {
                code: -32600,
                message: 'Invalid Request: jsonrpc must be "2.0"'
            }
        };
    }

    // Handle different message types
    if (message.method) {
        // Request or Notification
        try {
            const method = message.method;
            const params = message.params || {};

            // Handle MCP protocol methods
            switch (method) {
                case 'initialize':
                case 'mcp/initialize':
                    // Return the exact protocol version the client requested
                    // This ensures compatibility with clients expecting specific versions
                    const requestedVersion = params.protocolVersion || '2024-11-05';
                    
                    // Support common protocol versions
                    const supportedVersions = ['2024-11-05', '2025-03-26', '2025-06-18'];
                    const protocolVersion = supportedVersions.includes(requestedVersion)
                        ? requestedVersion
                        : '2024-11-05'; // Default to most compatible

                    log.info('MCP Initialize', {
                        protocolVersion,
                        clientRequested: requestedVersion
                    });

                    // Return server capabilities
                    return {
                        jsonrpc: '2.0',
                        id: message.id,
                        result: {
                            protocolVersion: protocolVersion,
                            capabilities: {
                                tools: {},
                                resources: {},
                                prompts: {}
                            },
                            serverInfo: {
                                name: 'tekup-billy-server',
                                version: '1.2.0'
                            }
                        }
                    };

                case 'notifications/initialized':
                    // Client confirms initialization - no response needed for notifications
                    log.info('MCP Client initialized notification received');
                    return null; // Notifications don't get responses

                case 'tools/list':
                case 'mcp/list_tools':
                    // List available tools with full schemas (matching index.ts definitions)
                    return {
                        jsonrpc: '2.0',
                        id: message.id,
                        result: {
                            tools: [
                                {
                                    name: 'list_invoices',
                                    description: 'List invoices with optional filtering by date range, state, or customer',
                                    inputSchema: {
                                        type: 'object',
                                        properties: {
                                            startDate: { type: 'string', description: 'Start date in YYYY-MM-DD format' },
                                            endDate: { type: 'string', description: 'End date in YYYY-MM-DD format' },
                                            state: { type: 'string', enum: ['draft', 'approved', 'sent', 'paid', 'cancelled'], description: 'Invoice state filter' },
                                            contactId: { type: 'string', description: 'Filter by customer contact ID' }
                                        }
                                    }
                                },
                                {
                                    name: 'create_invoice',
                                    description: 'Create a new invoice for a customer',
                                    inputSchema: {
                                        type: 'object',
                                        properties: {
                                            contactId: { type: 'string', description: 'Customer contact ID' },
                                            entryDate: { type: 'string', description: 'Invoice date in YYYY-MM-DD format' },
                                            paymentTermsDays: { type: 'number', description: 'Payment terms in days (default: 30)' },
                                            lines: {
                                                type: 'array',
                                                items: {
                                                    type: 'object',
                                                    properties: {
                                                        description: { type: 'string', description: 'Line item description' },
                                                        quantity: { type: 'number', description: 'Quantity' },
                                                        unitPrice: { type: 'number', description: 'Unit price' },
                                                        productId: { type: 'string', description: 'Optional product ID' }
                                                    },
                                                    required: ['description', 'quantity', 'unitPrice']
                                                },
                                                minItems: 1,
                                                description: 'Invoice line items'
                                            }
                                        },
                                        required: ['contactId', 'entryDate', 'lines']
                                    }
                                },
                                {
                                    name: 'get_invoice',
                                    description: 'Get a specific invoice by ID',
                                    inputSchema: {
                                        type: 'object',
                                        properties: {
                                            invoiceId: { type: 'string', description: 'Invoice ID to retrieve' }
                                        },
                                        required: ['invoiceId']
                                    }
                                },
                                {
                                    name: 'send_invoice',
                                    description: 'Send an invoice to the customer via email',
                                    inputSchema: {
                                        type: 'object',
                                        properties: {
                                            invoiceId: { type: 'string', description: 'Invoice ID to send' },
                                            message: { type: 'string', description: 'Optional message to include with the invoice' }
                                        },
                                        required: ['invoiceId']
                                    }
                                },
                                {
                                    name: 'update_invoice',
                                    description: 'Update an existing invoice',
                                    inputSchema: {
                                        type: 'object',
                                        properties: {
                                            invoiceId: { type: 'string', description: 'Invoice ID to update' },
                                            entryDate: { type: 'string', description: 'Entry date in YYYY-MM-DD format' },
                                            paymentTermsDays: { type: 'number', description: 'Number of days until payment is due' },
                                            lines: {
                                                type: 'array',
                                                items: {
                                                    type: 'object',
                                                    properties: {
                                                        productId: { type: 'string', description: 'Product ID (required - use list_products to find)' },
                                                        description: { type: 'string', description: 'Line item description' },
                                                        quantity: { type: 'number', description: 'Quantity' },
                                                        unitPrice: { type: 'number', description: 'Unit price' }
                                                    },
                                                    required: ['productId', 'description', 'quantity', 'unitPrice']
                                                },
                                                description: 'Invoice line items'
                                            }
                                        },
                                        required: ['invoiceId']
                                    }
                                },
                                {
                                    name: 'approve_invoice',
                                    description: '⚠️ Approve an invoice (PERMANENT - assigns final invoice number). Only use when invoice has been reviewed and is ready. DO NOT call automatically after create_invoice - let user review first!',
                                    inputSchema: {
                                        type: 'object',
                                        properties: {
                                            invoiceId: { type: 'string', description: 'Invoice ID to approve' }
                                        },
                                        required: ['invoiceId']
                                    }
                                },
                                {
                                    name: 'cancel_invoice',
                                    description: 'Cancel an invoice',
                                    inputSchema: {
                                        type: 'object',
                                        properties: {
                                            invoiceId: { type: 'string', description: 'Invoice ID to cancel' }
                                        },
                                        required: ['invoiceId']
                                    }
                                },
                                {
                                    name: 'mark_invoice_paid',
                                    description: 'Mark an invoice as paid',
                                    inputSchema: {
                                        type: 'object',
                                        properties: {
                                            invoiceId: { type: 'string', description: 'Invoice ID to mark as paid' },
                                            paidDate: { type: 'string', description: 'Date invoice was paid (YYYY-MM-DD format)' },
                                            amountPaid: { type: 'number', description: 'Amount paid' }
                                        },
                                        required: ['invoiceId', 'paidDate', 'amountPaid']
                                    }
                                },
                                {
                                    name: 'list_customers',
                                    description: 'List all customers with optional search filtering',
                                    inputSchema: {
                                        type: 'object',
                                        properties: {
                                            search: { type: 'string', description: 'Search term to filter customers by name or email' }
                                        }
                                    }
                                },
                                {
                                    name: 'create_customer',
                                    description: 'Create a new customer',
                                    inputSchema: {
                                        type: 'object',
                                        properties: {
                                            name: { type: 'string', description: 'Customer name' },
                                            email: { type: 'string', description: 'Customer email' },
                                            phone: { type: 'string', description: 'Customer phone number' },
                                            address: {
                                                type: 'object',
                                                properties: {
                                                    street: { type: 'string' },
                                                    city: { type: 'string' },
                                                    zipCode: { type: 'string' },
                                                    country: { type: 'string' }
                                                }
                                            }
                                        },
                                        required: ['name']
                                    }
                                },
                                {
                                    name: 'get_customer',
                                    description: 'Get a specific customer by ID',
                                    inputSchema: {
                                        type: 'object',
                                        properties: {
                                            contactId: { type: 'string', description: 'Customer contact ID' }
                                        },
                                        required: ['contactId']
                                    }
                                },
                                {
                                    name: 'update_customer',
                                    description: 'Update an existing customer',
                                    inputSchema: {
                                        type: 'object',
                                        properties: {
                                            contactId: { type: 'string', description: 'Customer contact ID to update' },
                                            name: { type: 'string', description: 'Customer name' },
                                            email: { type: 'string', description: 'Customer email' },
                                            phone: { type: 'string', description: 'Customer phone number' },
                                            address: {
                                                type: 'object',
                                                properties: {
                                                    street: { type: 'string' },
                                                    city: { type: 'string' },
                                                    zipCode: { type: 'string' },
                                                    country: { type: 'string' }
                                                }
                                            }
                                        },
                                        required: ['contactId']
                                    }
                                },
                                {
                                    name: 'list_products',
                                    description: 'List all products with optional search filtering',
                                    inputSchema: {
                                        type: 'object',
                                        properties: {
                                            search: { type: 'string', description: 'Search term to filter products' }
                                        }
                                    }
                                },
                                {
                                    name: 'create_product',
                                    description: 'Create a new product',
                                    inputSchema: {
                                        type: 'object',
                                        properties: {
                                            name: { type: 'string', description: 'Product name' },
                                            description: { type: 'string', description: 'Product description' },
                                            price: { type: 'number', description: 'Product price' },
                                            account: { type: 'string', description: 'Account number for bookkeeping' }
                                        },
                                        required: ['name', 'price']
                                    }
                                },
                                {
                                    name: 'update_product',
                                    description: 'Update an existing product',
                                    inputSchema: {
                                        type: 'object',
                                        properties: {
                                            productId: { type: 'string', description: 'Product ID to update' },
                                            name: { type: 'string', description: 'Product name' },
                                            description: { type: 'string', description: 'Product description' },
                                            price: { type: 'number', description: 'Product price' },
                                            account: { type: 'string', description: 'Account number for bookkeeping' }
                                        },
                                        required: ['productId']
                                    }
                                },
                                {
                                    name: 'get_revenue',
                                    description: 'Get revenue analytics for a date range',
                                    inputSchema: {
                                        type: 'object',
                                        properties: {
                                            startDate: { type: 'string', description: 'Start date in YYYY-MM-DD format' },
                                            endDate: { type: 'string', description: 'End date in YYYY-MM-DD format' },
                                            groupBy: { type: 'string', enum: ['day', 'week', 'month'], description: 'Group results by period' }
                                        },
                                        required: ['startDate', 'endDate']
                                    }
                                },
                                {
                                    name: 'list_test_scenarios',
                                    description: 'List available test scenarios for Billy.dk operations',
                                    inputSchema: {
                                        type: 'object',
                                        properties: {}
                                    }
                                },
                                {
                                    name: 'run_test_scenario',
                                    description: 'Run a specific test scenario',
                                    inputSchema: {
                                        type: 'object',
                                        properties: {
                                            scenario: { type: 'string', enum: ['freelancer', 'retailBusiness', 'serviceBusiness'], description: 'Test scenario to run' }
                                        },
                                        required: ['scenario']
                                    }
                                },
                                {
                                    name: 'generate_test_data',
                                    description: 'Generate test data (customers, products, invoices)',
                                    inputSchema: {
                                        type: 'object',
                                        properties: {
                                            customerCount: { type: 'number', description: 'Number of test customers to create', default: 2 },
                                            productCount: { type: 'number', description: 'Number of test products to create', default: 3 },
                                            invoiceCount: { type: 'number', description: 'Number of test invoices to create', default: 1 }
                                        }
                                    }
                                },
                                {
                                    name: 'analyze_user_patterns',
                                    description: 'Analyze user behavior patterns and generate insights and recommendations',
                                    inputSchema: {
                                        type: 'object',
                                        properties: {
                                            userId: { type: 'string', description: 'User ID to analyze (defaults to current user)' }
                                        }
                                    }
                                },
                                {
                                    name: 'generate_personalized_presets',
                                    description: 'Generate personalized workflow presets based on user behavior patterns',
                                    inputSchema: {
                                        type: 'object',
                                        properties: {
                                            userId: { type: 'string', description: 'User ID to generate presets for (defaults to current user)' },
                                            limit: { type: 'number', description: 'Maximum number of presets to return (1-20)', minimum: 1, maximum: 20 }
                                        }
                                    }
                                },
                                {
                                    name: 'get_recommended_presets',
                                    description: 'Get recommended presets based on user patterns or business type',
                                    inputSchema: {
                                        type: 'object',
                                        properties: {
                                            userId: { type: 'string', description: 'User ID for personalized recommendations' },
                                            businessType: { type: 'string', enum: ['freelancer', 'retail', 'service'], description: 'Business type filter' },
                                            limit: { type: 'number', description: 'Maximum number of presets to return (1-20)', minimum: 1, maximum: 20 }
                                        }
                                    }
                                },
                                {
                                    name: 'execute_preset',
                                    description: 'Execute a preset workflow with optional parameter overrides',
                                    inputSchema: {
                                        type: 'object',
                                        properties: {
                                            presetId: { type: 'string', description: 'ID of the preset to execute' },
                                            overrideParams: { type: 'object', description: 'Parameters to override in the preset' }
                                        },
                                        required: ['presetId']
                                    }
                                },
                                {
                                    name: 'list_presets',
                                    description: 'List all available presets with optional filtering and usage statistics',
                                    inputSchema: {
                                        type: 'object',
                                        properties: {
                                            businessType: { type: 'string', enum: ['freelancer', 'retail', 'service', 'general'], description: 'Filter by business type' },
                                            includeUsage: { type: 'boolean', description: 'Include usage statistics' }
                                        }
                                    }
                                },
                                {
                                    name: 'create_custom_preset',
                                    description: 'Create a custom workflow preset with specified actions',
                                    inputSchema: {
                                        type: 'object',
                                        properties: {
                                            name: { type: 'string', description: 'Name of the preset' },
                                            description: { type: 'string', description: 'Description of what the preset does' },
                                            businessType: { type: 'string', enum: ['freelancer', 'retail', 'service', 'general'], description: 'Business type this preset is for' },
                                            actions: {
                                                type: 'array',
                                                items: {
                                                    type: 'object',
                                                    properties: {
                                                        tool: { type: 'string', description: 'Tool name (customers, products, invoices)' },
                                                        action: { type: 'string', description: 'Action name (create, list, get, send)' },
                                                        parameters: { type: 'object', description: 'Parameters for the action' },
                                                        description: { type: 'string', description: 'Description of this action step' }
                                                    },
                                                    required: ['tool', 'action', 'parameters', 'description']
                                                },
                                                minItems: 1,
                                                description: 'Array of actions to execute in order'
                                            }
                                        },
                                        required: ['name', 'description', 'businessType', 'actions']
                                    }
                                },
                                {
                                    name: 'validate_auth',
                                    description: 'Validate Billy API authentication and connection',
                                    inputSchema: {
                                        type: 'object',
                                        properties: {}
                                    }
                                },
                                {
                                    name: 'test_connection',
                                    description: 'Test connection to specific Billy API endpoint',
                                    inputSchema: {
                                        type: 'object',
                                        properties: {
                                            endpoint: { type: 'string', description: 'Specific endpoint to test (organization, contacts, products, invoices)' }
                                        }
                                    }
                                }
                            ]
                        }
                    };

                case 'tools/call':
                case 'mcp/call_tool':
                    // Call a specific tool
                    const toolName = params.name;
                    const toolArgs = params.arguments || {};

                    log.mcpTool(toolName, 'start', { args: toolArgs });

                    try {
                        const toolResult = await executeToolCall(toolName, toolArgs);
                        log.mcpTool(toolName, 'success', { resultSize: JSON.stringify(toolResult).length });
                        return {
                            jsonrpc: '2.0',
                            id: message.id,
                            result: {
                                content: [
                                    {
                                        type: 'text',
                                        text: typeof toolResult === 'string'
                                            ? toolResult
                                            : JSON.stringify(toolResult, null, 2)
                                    }
                                ]
                            }
                        };
                    } catch (error) {
                        log.mcpTool(toolName, 'error', {
                            error: error instanceof Error ? error.message : String(error),
                            args: toolArgs
                        });
                        return {
                            jsonrpc: '2.0',
                            id: message.id,
                            error: {
                                code: -32603,
                                message: error instanceof Error ? error.message : 'Tool execution failed'
                            }
                        };
                    }

                default:
                    // Method not found
                    return {
                        jsonrpc: '2.0',
                        id: message.id,
                        error: {
                            code: -32601,
                            message: `Method not found: ${method}`
                        }
                    };
            }
        } catch (error) {
            return {
                jsonrpc: '2.0',
                id: message.id,
                error: {
                    code: -32603,
                    message: error instanceof Error ? error.message : 'Internal error'
                }
            };
        }
    } else if (message.result !== undefined || message.error !== undefined) {
        // Response - just acknowledge
        return {
            jsonrpc: '2.0',
            id: null
        };
    } else {
        return {
            jsonrpc: '2.0',
            id: message.id || null,
            error: {
                code: -32600,
                message: 'Invalid Request: missing method, result, or error'
            }
        };
    }
}

/**
 * Export session management for testing
 */
export { sessions, getOrCreateSession };

