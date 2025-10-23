/**
 * Health Check Integration Tests
 * Tests the /health endpoint
 */

import request from 'supertest';

const API_URL = 'http://localhost:3001';

describe('Health Check Endpoint', () => {
  test('GET /health should return 200 and health status', async () => {
    const response = await request(API_URL)
      .get('/health')
      .expect(200)
      .expect('Content-Type', /json/);

    expect(response.body).toHaveProperty('status');
    expect(response.body).toHaveProperty('version', '0.1.0');
    expect(response.body).toHaveProperty('uptime');
    expect(response.body).toHaveProperty('checks');
    expect(response.body).toHaveProperty('features');
    expect(response.body).toHaveProperty('timestamp');
  });

  test('Health check should include feature flags', async () => {
    const response = await request(API_URL)
      .get('/health')
      .expect(200);

    const { features } = response.body;
    expect(features).toHaveProperty('voiceAlerts');
    expect(features).toHaveProperty('autoInvoice');
    expect(features).toHaveProperty('failSafeMode');
  });

  test('Health check should include configuration status', async () => {
    const response = await request(API_URL)
      .get('/health')
      .expect(200);

    const { configuration } = response.body;
    expect(configuration).toHaveProperty('valid');
    expect(configuration).toHaveProperty('errors');
  });

  test('Health check should include service checks', async () => {
    const response = await request(API_URL)
      .get('/health')
      .expect(200);

    const { checks } = response.body;
    expect(checks).toHaveProperty('database');
    expect(checks).toHaveProperty('googleCalendar');
    expect(checks).toHaveProperty('billyMcp');
    expect(checks).toHaveProperty('twilio');
  });
});

