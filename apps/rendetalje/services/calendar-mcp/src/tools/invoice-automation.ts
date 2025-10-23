/**
 * RenOS Calendar Intelligence MCP - Invoice Automation Tool
 * Tool 3: auto_create_invoice
 * Ingen glemte fakturaer nogensinde!
 */

import axios from 'axios';
import { z } from 'zod';
import { logger } from '../utils/logger.js';
import { AutoCreateInvoiceSchema, InvoiceAutomation } from '../types.js';
import config from '../config.js';
import undoManager from '../utils/undo-manager.js';

/**
 * Tool 3: Auto Create Invoice
 * Automatically create invoice via Billy MCP after booking completion
 */
export async function autoCreateInvoice(
  input: z.infer<typeof AutoCreateInvoiceSchema>
): Promise<InvoiceAutomation> {
  logger.info('Auto-creating invoice', input);

  // Check if feature is enabled
  if (!config.features.autoInvoice) {
    logger.info('Auto-invoice feature disabled - skipping');
    return {
      bookingId: input.bookingId,
      customerId: 'dry-run',
      status: 'pending',
      items: [],
      subtotal: 0,
      tax: 0,
      total: 0,
    };
  }

  // Check if Billy MCP is configured
  if (!config.billy.isConfigured) {
    throw new Error('Billy MCP not configured - cannot create invoice');
  }

  try {
    // TODO: Fetch booking details from RenOS database
    // For now, using placeholder data
    const bookingData = {
      customerId: 'placeholder-customer-id',
      customerName: 'Placeholder Customer',
      serviceType: 'Flytterengøring',
      hours: 3,
      hourlyRate: config.business.customerRate,
    };

    // Calculate invoice items
    const subtotal = bookingData.hours * bookingData.hourlyRate;
    const tax = subtotal * 0.25; // 25% Danish moms
    const total = subtotal + tax;

    const items = [
      {
        productId: 'REN-002', // Billy product ID for Flytterengøring
        description: `${bookingData.serviceType} - ${bookingData.hours} timer`,
        quantity: bookingData.hours,
        unitPrice: bookingData.hourlyRate,
        total: subtotal,
      },
    ];

    // Call Billy MCP to create invoice
    const billyResponse = await axios.post(
      `${config.billy.mcpUrl}/api/v1/tools/create_invoice`,
      {
        customerId: bookingData.customerId,
        lines: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          description: item.description,
        })),
        entryDate: new Date().toISOString().split('T')[0],
        paymentTermsDays: 1, // 24 timer betalingsfrist
      },
      {
        headers: {
          'X-API-Key': config.billy.apiKey,
          'Content-Type': 'application/json',
        },
      }
    );

    const billyInvoice = billyResponse.data.data;

    const invoiceAutomation: InvoiceAutomation = {
      bookingId: input.bookingId,
      customerId: bookingData.customerId,
      status: 'created',
      billyInvoiceId: billyInvoice.id,
      items,
      subtotal,
      tax,
      total,
      createdAt: new Date().toISOString(),
    };

    // Register undo action
    undoManager.registerAction({
      type: 'invoice_created',
      entityId: billyInvoice.id,
      entityType: 'invoice',
      before: {},
      after: invoiceAutomation,
      performedBy: 'system',
    });

    // Optionally send invoice immediately
    if (input.sendImmediately) {
      try {
        await axios.post(
          `${config.billy.mcpUrl}/api/v1/tools/send_invoice`,
          { invoiceId: billyInvoice.id },
          {
            headers: {
              'X-API-Key': config.billy.apiKey,
              'Content-Type': 'application/json',
            },
          }
        );

        invoiceAutomation.status = 'sent';
        invoiceAutomation.sentAt = new Date().toISOString();
        
        logger.info('Invoice sent automatically', {
          invoiceId: billyInvoice.id,
          bookingId: input.bookingId,
        });
      } catch (sendError) {
        logger.warn('Failed to send invoice automatically', {
          invoiceId: billyInvoice.id,
          error: sendError,
        });
      }
    }

    logger.info('Invoice created successfully', {
      bookingId: input.bookingId,
      invoiceId: billyInvoice.id,
      total,
      status: invoiceAutomation.status,
    });

    return invoiceAutomation;
  } catch (error) {
    logger.error('Failed to create invoice', error, {
      bookingId: input.bookingId,
    });

    return {
      bookingId: input.bookingId,
      customerId: 'error',
      status: 'failed',
      items: [],
      subtotal: 0,
      tax: 0,
      total: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}

/**
 * Check for missing invoices (background job)
 */
export async function checkMissingInvoices(): Promise<{
  missing: Array<{
    bookingId: string;
    customerName: string;
    bookingDate: string;
    amount: number;
  }>;
}> {
  logger.info('Checking for missing invoices');

  // TODO: Query RenOS database for completed bookings without invoices
  // This would run as a background job

  return {
    missing: [],
  };
}

export default {
  autoCreateInvoice,
  checkMissingInvoices,
};

