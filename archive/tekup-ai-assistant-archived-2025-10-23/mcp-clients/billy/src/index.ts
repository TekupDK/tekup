/**
 * Billy MCP Client - Main Entry Point
 * Production-ready client for Tekup-Billy MCP Server
 * 
 * @author TekUp Team
 * @version 1.0.0
 */

// Export client
export { BillyMCPClient, billyClient, BillyApiError } from './client.js';

// Export configuration
export { getBillyMCPConfig, validateBillyMCPConfig, DEFAULT_CONFIG } from './config.js';
export type { BillyConfig } from './config.js';

// Export types
export * from './types.js';

// Export tool functions
export * as invoices from './tools/invoices.js';
export * as customers from './tools/customers.js';
export * as products from './tools/products.js';

// Export logger
export { logger } from './logger.js';

/**
 * Quick Start Example:
 * 
 * ```typescript
 * import { billyClient, invoices, customers } from '@tekup/billy-mcp-client';
 * 
 * // List invoices
 * const allInvoices = await invoices.listInvoices();
 * 
 * // Create customer
 * const customer = await customers.createCustomer({
 *   name: 'Acme Corp',
 *   email: 'billing@acme.com'
 * });
 * 
 * // Create invoice
 * const invoice = await invoices.createInvoice({
 *   contactId: customer.id,
 *   entryDate: '2025-10-16',
 *   lines: [{
 *     description: 'Consulting services',
 *     quantity: 4,
 *     unitPrice: 850,
 *     productId: 'product-id-here'
 *   }]
 * });
 * ```
 */

