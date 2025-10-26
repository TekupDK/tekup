/**
 * Customer Tool Wrappers for Billy MCP Client
 */

import { billyClient } from '../client.js';
import {
  BillyCustomer,
  ListCustomersInput,
  CreateCustomerInput,
  GetCustomerInput
} from '../types.js';
import { logger } from '../logger.js';

/**
 * List customers with optional search
 */
export async function listCustomers(input?: ListCustomersInput): Promise<BillyCustomer[]> {
  try {
    logger.info('Listing customers', { input });
    const result = await billyClient.callTool<{ customers: BillyCustomer[] }>(
      'list_customers',
      input
    );
    return result.customers || [];
  } catch (error) {
    logger.error('Failed to list customers', { error, input });
    throw error;
  }
}

/**
 * Create a new customer
 */
export async function createCustomer(input: CreateCustomerInput): Promise<BillyCustomer> {
  try {
    logger.info('Creating customer', { name: input.name });
    const result = await billyClient.callTool<{ customer: BillyCustomer }>(
      'create_customer',
      input
    );
    return result.customer;
  } catch (error) {
    logger.error('Failed to create customer', { error, input });
    throw error;
  }
}

/**
 * Get customer by ID
 */
export async function getCustomer(customerId: string): Promise<BillyCustomer> {
  try {
    logger.debug('Getting customer', { customerId });
    const result = await billyClient.callTool<{ customer: BillyCustomer }>(
      'get_customer',
      { customerId }
    );
    return result.customer;
  } catch (error) {
    logger.error('Failed to get customer', { error, customerId });
    throw error;
  }
}

