/**
 * Product Tool Wrappers for Billy MCP Client
 */

import { billyClient } from '../client.js';
import {
  BillyProduct,
  ListProductsInput,
  CreateProductInput
} from '../types.js';
import { logger } from '../logger.js';

/**
 * List products with optional search
 */
export async function listProducts(input?: ListProductsInput): Promise<BillyProduct[]> {
  try {
    logger.info('Listing products', { input });
    const result = await billyClient.callTool<{ products: BillyProduct[] }>(
      'list_products',
      input
    );
    return result.products || [];
  } catch (error) {
    logger.error('Failed to list products', { error, input });
    throw error;
  }
}

/**
 * Create a new product
 */
export async function createProduct(input: CreateProductInput): Promise<BillyProduct> {
  try {
    logger.info('Creating product', { name: input.name });
    const result = await billyClient.callTool<{ product: BillyProduct }>(
      'create_product',
      input
    );
    return result.product;
  } catch (error) {
    logger.error('Failed to create product', { error, input });
    throw error;
  }
}

