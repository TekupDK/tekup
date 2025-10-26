/**
 * End-to-end integration tests for Flow API complete workflows
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import axios from 'axios';
import { spawn } from 'child_process';
import { createLogger } from '../../packages/shared/dist/logging/index.js';

const logger = createLogger('e2e-flow-api');

const API_BASE_URL = 'http://localhost:4000';
const TEST_API_KEY = 'demo-tenant-key-1';
const TEST_TIMEOUT = 30000;

let apiProcess;

beforeAll(async () => {
  logger.info('Starting Flow API for E2E tests...');
  
  // Start Flow API with auto-seed enabled
  apiProcess = spawn('pnpm', ['flow:dev'], {
    env: { ...process.env, PX_AUTO_SEED: 'true', NODE_ENV: 'test' },
    stdio: 'pipe'
  });

  // Wait for API to be ready
  await waitForAPI(API_BASE_URL + '/health', 15000);
  logger.info('Flow API is ready for testing');
}, TEST_TIMEOUT);

afterAll(async () => {
  if (apiProcess) {
    logger.info('Stopping Flow API...');
    apiProcess.kill('SIGTERM');
    
    // Give process time to cleanup
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
});

describe('Flow API - Complete Workflows', () => {
  
  test('Health Check Endpoint', async () => {
    const response = await axios.get(`${API_BASE_URL}/health`);
    
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('status', 'ok');
    expect(response.data).toHaveProperty('timestamp');
  });

  test('Metrics Endpoint (Public)', async () => {
    const response = await axios.get(`${API_BASE_URL}/metrics`);
    
    expect(response.status).toBe(200);
    expect(response.data).toContain('# HELP');
    expect(response.data).toContain('http_requests_total');
  });

  test('API Key Authentication Required', async () => {
    try {
      await axios.get(`${API_BASE_URL}/api/leads`);
      expect(true).toBe(false); // Should not reach here
    } catch (error) {
      expect(error.response.status).toBe(401);
      expect(error.response.data).toHaveProperty('error');
    }
  });

  test('Complete Lead Management Workflow', async () => {
    const apiClient = axios.create({
      baseURL: API_BASE_URL,
      headers: { 'x-api-key': TEST_API_KEY }
    });

    // 1. Create a new lead
    const createResponse = await apiClient.post('/api/leads', {
      email: 'test@example.com',
      source: 'e2e-test',
      status: 'new',
      data: {
        priority: 'high',
        description: 'E2E integration test lead'
      }
    });

    expect(createResponse.status).toBe(201);
    expect(createResponse.data.success).toBe(true);
    expect(createResponse.data.data).toHaveProperty('id');
    expect(createResponse.data.data.email).toBe('test@example.com');
    expect(createResponse.data.meta).toHaveProperty('tenant_id');

    const leadId = createResponse.data.data.id;

    // 2. Retrieve the lead
    const getResponse = await apiClient.get(`/api/leads/${leadId}`);
    
    expect(getResponse.status).toBe(200);
    expect(getResponse.data.success).toBe(true);
    expect(getResponse.data.data.id).toBe(leadId);

    // 3. Update lead status
    const updateResponse = await apiClient.patch(`/api/leads/${leadId}`, {
      status: 'in_progress',
      data: {
        assignee: 'e2e-tester',
        notes: 'Updated via E2E test'
      }
    });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.data.success).toBe(true);
    expect(updateResponse.data.data.status).toBe('in_progress');

    // 4. List leads with filters
    const listResponse = await apiClient.get('/api/leads', {
      params: {
        status: 'in_progress',
        limit: 10
      }
    });

    expect(listResponse.status).toBe(200);
    expect(listResponse.data.success).toBe(true);
    expect(Array.isArray(listResponse.data.data)).toBe(true);
    expect(listResponse.data.data.some(lead => lead.id === leadId)).toBe(true);

    // 5. Complete the lead
    const completeResponse = await apiClient.patch(`/api/leads/${leadId}`, {
      status: 'completed',
      data: {
        resolution: 'Successfully processed via E2E test',
        completed_at: new Date().toISOString()
      }
    });

    expect(completeResponse.status).toBe(200);
    expect(completeResponse.data.data.status).toBe('completed');
  });

  test('Multi-Tenant Isolation', async () => {
    const tenant1Client = axios.create({
      baseURL: API_BASE_URL,
      headers: { 'x-api-key': 'demo-tenant-key-1' }
    });

    const tenant2Client = axios.create({
      baseURL: API_BASE_URL,
      headers: { 'x-api-key': 'demo-tenant-key-2' }
    });

    // Create lead for tenant 1
    const tenant1Lead = await tenant1Client.post('/api/leads', {
      email: 'tenant1@example.com',
      source: 'tenant1-test'
    });

    // Create lead for tenant 2
    const tenant2Lead = await tenant2Client.post('/api/leads', {
      email: 'tenant2@example.com',
      source: 'tenant2-test'
    });

    // Verify tenant 1 cannot access tenant 2's leads
    const tenant1LeadId = tenant1Lead.data.data.id;
    const tenant2LeadId = tenant2Lead.data.data.id;

    try {
      await tenant1Client.get(`/api/leads/${tenant2LeadId}`);
      expect(true).toBe(false); // Should not reach here
    } catch (error) {
      expect(error.response.status).toBe(404);
    }

    // Verify tenant 2 cannot access tenant 1's leads
    try {
      await tenant2Client.get(`/api/leads/${tenant1LeadId}`);
      expect(true).toBe(false); // Should not reach here
    } catch (error) {
      expect(error.response.status).toBe(404);
    }

    // Verify each tenant can only see their own leads
    const tenant1List = await tenant1Client.get('/api/leads');
    const tenant2List = await tenant2Client.get('/api/leads');

    expect(tenant1List.data.data.some(lead => lead.id === tenant1LeadId)).toBe(true);
    expect(tenant1List.data.data.some(lead => lead.id === tenant2LeadId)).toBe(false);

    expect(tenant2List.data.data.some(lead => lead.id === tenant2LeadId)).toBe(true);
    expect(tenant2List.data.data.some(lead => lead.id === tenant1LeadId)).toBe(false);
  });

  test('Rate Limiting', async () => {
    const apiClient = axios.create({
      baseURL: API_BASE_URL,
      headers: { 'x-api-key': TEST_API_KEY }
    });

    // Make rapid requests to trigger rate limiting
    const requests = Array.from({ length: 150 }, (_, i) => 
      apiClient.get('/api/leads').catch(err => err.response)
    );

    const responses = await Promise.all(requests);
    
    // Some requests should be rate limited (429)
    const rateLimitedResponses = responses.filter(r => r.status === 429);
    expect(rateLimitedResponses.length).toBeGreaterThan(0);
    
    // Verify rate limit headers are present
    const successfulResponse = responses.find(r => r.status === 200);
    expect(successfulResponse.headers).toHaveProperty('x-ratelimit-limit');
    expect(successfulResponse.headers).toHaveProperty('x-ratelimit-remaining');
  });

  test('Error Handling and Response Format', async () => {
    const apiClient = axios.create({
      baseURL: API_BASE_URL,
      headers: { 'x-api-key': TEST_API_KEY }
    });

    try {
      // Invalid lead creation
      await apiClient.post('/api/leads', {
        email: 'invalid-email',
        status: 'invalid-status'
      });
      expect(true).toBe(false); // Should not reach here
    } catch (error) {
      expect(error.response.status).toBe(400);
      expect(error.response.data.success).toBe(false);
      expect(error.response.data).toHaveProperty('error');
      expect(error.response.data.error).toHaveProperty('code');
      expect(error.response.data.error).toHaveProperty('message');
      expect(error.response.data.meta).toHaveProperty('timestamp');
      expect(error.response.data.meta).toHaveProperty('request_id');
    }
  });

});

/**
 * Wait for API to be ready by polling health endpoint
 */
async function waitForAPI(url, timeout = 10000) {
  const start = Date.now();
  
  while (Date.now() - start < timeout) {
    try {
      await axios.get(url, { timeout: 1000 });
      return;
    } catch (error) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  throw new Error(`API not ready after ${timeout}ms`);
}
