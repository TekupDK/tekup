/**
 * Performance benchmarking and load testing suite for TekUp APIs
 */

import { check, sleep } from 'k6';
import http from 'k6/http';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('error_rate');
const responseTime = new Trend('response_time');
const slaBreaches = new Counter('sla_breaches');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 20 },   // Ramp up to 20 users over 2 minutes
    { duration: '5m', target: 20 },   // Stay at 20 users for 5 minutes
    { duration: '2m', target: 50 },   // Ramp up to 50 users over 2 minutes
    { duration: '5m', target: 50 },   // Stay at 50 users for 5 minutes
    { duration: '2m', target: 100 },  // Ramp up to 100 users over 2 minutes
    { duration: '5m', target: 100 },  // Stay at 100 users for 5 minutes
    { duration: '2m', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    // SLA: 95% of requests should be under 2000ms (2 seconds)
    'http_req_duration': ['p(95)<2000'],
    // Error rate should be less than 1%
    'error_rate': ['rate<0.01'],
    // SLA breaches should be minimal
    'sla_breaches': ['count<10'],
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:4000';
const API_KEY = __ENV.API_KEY || 'demo-tenant-key-1';

const headers = {
  'Content-Type': 'application/json',
  'x-api-key': API_KEY,
};

export function setup() {
  // Warm up the API
  console.log('Warming up API...');
  const warmupResponse = http.get(`${BASE_URL}/health`);
  check(warmupResponse, { 'warmup successful': (r) => r.status === 200 });
  
  // Create some test data for realistic load testing
  console.log('Setting up test data...');
  for (let i = 0; i < 10; i++) {
    http.post(`${BASE_URL}/api/leads`, JSON.stringify({
      email: `loadtest-${i}@example.com`,
      source: 'k6-setup',
      status: 'new',
      data: { priority: 'normal' }
    }), { headers });
  }
  
  return { baseUrl: BASE_URL };
}

export default function(data) {
  const scenarios = [
    () => testHealthEndpoint(data.baseUrl),
    () => testMetricsEndpoint(data.baseUrl),
    () => testLeadCreation(data.baseUrl),
    () => testLeadRetrieval(data.baseUrl),
    () => testLeadListing(data.baseUrl),
    () => testLeadUpdate(data.baseUrl),
  ];
  
  // Randomly select a scenario (weighted distribution)
  const weights = [0.1, 0.1, 0.2, 0.3, 0.2, 0.1]; // Health, Metrics, Create, Get, List, Update
  const scenario = selectWeightedScenario(scenarios, weights);
  scenario();
  
  sleep(Math.random() * 2 + 1); // Random sleep between 1-3 seconds
}

function testHealthEndpoint(baseUrl) {
  const response = http.get(`${baseUrl}/health`);
  
  check(response, {
    'health status is 200': (r) => r.status === 200,
    'health has status ok': (r) => JSON.parse(r.body).status === 'ok',
  });
  
  recordMetrics(response, 'health');
}

function testMetricsEndpoint(baseUrl) {
  const response = http.get(`${baseUrl}/metrics`);
  
  check(response, {
    'metrics status is 200': (r) => r.status === 200,
    'metrics contains prometheus data': (r) => r.body.includes('# HELP'),
  });
  
  recordMetrics(response, 'metrics');
}

function testLeadCreation(baseUrl) {
  const payload = {
    email: `k6-test-${Date.now()}@example.com`,
    source: 'k6-load-test',
    status: 'new',
    data: {
      priority: Math.random() > 0.5 ? 'high' : 'normal',
      description: `Load test lead created at ${new Date().toISOString()}`
    }
  };
  
  const response = http.post(`${baseUrl}/api/leads`, JSON.stringify(payload), { headers });
  
  const success = check(response, {
    'create lead status is 201': (r) => r.status === 201,
    'create lead success is true': (r) => JSON.parse(r.body).success === true,
    'create lead has id': (r) => JSON.parse(r.body).data.id !== undefined,
  });
  
  if (!success) {
    console.error(`Lead creation failed: ${response.status} ${response.body}`);
  }
  
  recordMetrics(response, 'create_lead');
}

function testLeadRetrieval(baseUrl) {
  // First get a list to find a lead ID
  const listResponse = http.get(`${baseUrl}/api/leads?limit=1`, { headers });
  
  if (listResponse.status === 200) {
    const leads = JSON.parse(listResponse.body).data;
    if (leads.length > 0) {
      const leadId = leads[0].id;
      
      const response = http.get(`${baseUrl}/api/leads/${leadId}`, { headers });
      
      check(response, {
        'get lead status is 200': (r) => r.status === 200,
        'get lead success is true': (r) => JSON.parse(r.body).success === true,
        'get lead has correct id': (r) => JSON.parse(r.body).data.id === leadId,
      });
      
      recordMetrics(response, 'get_lead');
    }
  }
}

function testLeadListing(baseUrl) {
  const params = [
    '?limit=10',
    '?limit=25',
    '?status=new',
    '?status=in_progress',
    '?source=k6-load-test'
  ];
  
  const param = params[Math.floor(Math.random() * params.length)];
  const response = http.get(`${baseUrl}/api/leads${param}`, { headers });
  
  check(response, {
    'list leads status is 200': (r) => r.status === 200,
    'list leads success is true': (r) => JSON.parse(r.body).success === true,
    'list leads returns array': (r) => Array.isArray(JSON.parse(r.body).data),
  });
  
  recordMetrics(response, 'list_leads');
}

function testLeadUpdate(baseUrl) {
  // Get a lead to update
  const listResponse = http.get(`${baseUrl}/api/leads?limit=1`, { headers });
  
  if (listResponse.status === 200) {
    const leads = JSON.parse(listResponse.body).data;
    if (leads.length > 0) {
      const leadId = leads[0].id;
      
      const updatePayload = {
        status: Math.random() > 0.5 ? 'in_progress' : 'completed',
        data: {
          updated_by: 'k6-load-test',
          updated_at: new Date().toISOString()
        }
      };
      
      const response = http.patch(`${baseUrl}/api/leads/${leadId}`, 
        JSON.stringify(updatePayload), { headers });
      
      check(response, {
        'update lead status is 200': (r) => r.status === 200,
        'update lead success is true': (r) => JSON.parse(r.body).success === true,
      });
      
      recordMetrics(response, 'update_lead');
    }
  }
}

function recordMetrics(response, operation) {
  const duration = response.timings.duration;
  
  // Record response time
  responseTime.add(duration);
  
  // Check for errors
  const isError = response.status >= 400;
  errorRate.add(isError);
  
  // Check SLA breach (2 second limit)
  if (duration > 2000) {
    slaBreaches.add(1);
    console.warn(`SLA breach: ${operation} took ${duration}ms`);
  }
  
  // Log slow requests
  if (duration > 1000) {
    console.info(`Slow ${operation}: ${duration}ms`);
  }
}

function selectWeightedScenario(scenarios, weights) {
  const random = Math.random();
  let weightSum = 0;
  
  for (let i = 0; i < scenarios.length; i++) {
    weightSum += weights[i];
    if (random <= weightSum) {
      return scenarios[i];
    }
  }
  
  return scenarios[0]; // Fallback
}

export function teardown(data) {
  console.log('Load test completed');
  // Cleanup test data if needed
}
