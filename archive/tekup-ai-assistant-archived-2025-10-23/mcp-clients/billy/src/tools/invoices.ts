/**
 * Invoice Tool Wrappers for Billy MCP Client
 * Provides type-safe wrappers around Billy MCP invoice tools
 */

import { billyClient } from '../client.js';
import {
  BillyInvoice,
  ListInvoicesInput,
  CreateInvoiceInput,
  GetInvoiceInput,
  SendInvoiceInput
} from '../types.js';
import { logger } from '../logger.js';

/**
 * List invoices with optional filtering
 */
export async function listInvoices(input?: ListInvoicesInput): Promise<BillyInvoice[]> {
  try {
    logger.info('Listing invoices', { input });
    const result = await billyClient.callTool<{ invoices: BillyInvoice[] }>(
      'list_invoices',
      input
    );
    return result.invoices || [];
  } catch (error) {
    logger.error('Failed to list invoices', { error, input });
    throw error;
  }
}

/**
 * Create a new invoice
 */
export async function createInvoice(input: CreateInvoiceInput): Promise<BillyInvoice> {
  try {
    logger.info('Creating invoice', { customerId: input.contactId });
    const result = await billyClient.callTool<{ invoice: BillyInvoice }>(
      'create_invoice',
      input
    );
    return result.invoice;
  } catch (error) {
    logger.error('Failed to create invoice', { error, input });
    throw error;
  }
}

/**
 * Get invoice by ID
 */
export async function getInvoice(invoiceId: string): Promise<BillyInvoice> {
  try {
    logger.debug('Getting invoice', { invoiceId });
    const result = await billyClient.callTool<{ invoice: BillyInvoice }>(
      'get_invoice',
      { invoiceId }
    );
    return result.invoice;
  } catch (error) {
    logger.error('Failed to get invoice', { error, invoiceId });
    throw error;
  }
}

/**
 * Send invoice to customer
 */
export async function sendInvoice(input: SendInvoiceInput): Promise<boolean> {
  try {
    logger.info('Sending invoice', { invoiceId: input.invoiceId });
    await billyClient.callTool('send_invoice', input);
    return true;
  } catch (error) {
    logger.error('Failed to send invoice', { error, input });
    throw error;
  }
}

/**
 * Update an existing invoice
 */
export async function updateInvoice(invoiceId: string, updates: Partial<CreateInvoiceInput>): Promise<BillyInvoice> {
  try {
    logger.info('Updating invoice', { invoiceId });
    const result = await billyClient.callTool<{ invoice: BillyInvoice }>(
      'update_invoice',
      { invoiceId, ...updates }
    );
    return result.invoice;
  } catch (error) {
    logger.error('Failed to update invoice', { error, invoiceId });
    throw error;
  }
}

/**
 * Approve an invoice (change status from draft to approved)
 */
export async function approveInvoice(invoiceId: string): Promise<BillyInvoice> {
  try {
    logger.info('Approving invoice', { invoiceId });
    const result = await billyClient.callTool<{ invoice: BillyInvoice }>(
      'approve_invoice',
      { invoiceId }
    );
    return result.invoice;
  } catch (error) {
    logger.error('Failed to approve invoice', { error, invoiceId });
    throw error;
  }
}

