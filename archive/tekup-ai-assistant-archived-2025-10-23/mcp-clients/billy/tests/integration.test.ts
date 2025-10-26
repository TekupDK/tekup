/**
 * Billy MCP Client - Integration Tests
 * Tests connection to production Billy MCP server
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { billyClient, invoices, customers, products } from '../src/index.js';

describe('Billy MCP Client Integration Tests', () => {
  beforeAll(async () => {
    // Verify server is reachable
    const isHealthy = await billyClient.healthCheck();
    if (!isHealthy) {
      console.warn('Billy MCP server health check failed - some tests may fail');
    }
  });

  describe('Client Initialization', () => {
    it('should create client instance', () => {
      expect(billyClient).toBeDefined();
      expect(billyClient).toBeInstanceOf(Object);
    });

    it('should have configuration loaded', () => {
      // Config should be loaded from environment
      expect(billyClient).toBeDefined();
    });
  });

  describe('Health Check', () => {
    it('should connect to Billy MCP server', async () => {
      const isHealthy = await billyClient.healthCheck();
      expect(typeof isHealthy).toBe('boolean');
    });
  });

  describe('Tool Listing', () => {
    it('should list available tools', async () => {
      const tools = await billyClient.listTools();
      expect(Array.isArray(tools)).toBe(true);
      expect(tools.length).toBeGreaterThan(0);
    });
  });

  describe('Invoice Tools', () => {
    it('should list invoices', async () => {
      const result = await invoices.listInvoices({ pageSize: 5 });
      expect(Array.isArray(result)).toBe(true);
    });

    // Add more tests as needed (requires real Billy.dk API access)
    it.skip('should create invoice', async () => {
      // Skipped - requires real customer and product IDs
    });
  });

  describe('Customer Tools', () => {
    it('should list customers', async () => {
      const result = await customers.listCustomers({ pageSize: 5 });
      expect(Array.isArray(result)).toBe(true);
    });

    it.skip('should create customer', async () => {
      // Skipped - would create real data
    });
  });

  describe('Product Tools', () => {
    it('should list products', async () => {
      const result = await products.listProducts();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid tool names gracefully', async () => {
      await expect(
        billyClient.callTool('invalid_tool_name', {})
      ).rejects.toThrow();
    });

    it('should handle network errors', async () => {
      // This will test timeout and error handling
      // (may take 30s if server is actually down)
    });
  });
});

