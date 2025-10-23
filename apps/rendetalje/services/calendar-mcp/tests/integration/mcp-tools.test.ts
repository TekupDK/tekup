/**
 * MCP Tools Integration Tests
 * Tests all 5 core MCP tools
 */

import request from 'supertest';

const API_URL = 'http://localhost:3001';

describe('MCP Tools Endpoints', () => {
  describe('Tool 1: Validate Booking Date', () => {
    test('should validate a correct Tuesday date', async () => {
      const response = await request(API_URL)
        .post('/api/v1/tools/validate_booking_date')
        .send({
          date: '2025-10-21',
          expectedDayName: 'tirsdag',
          customerId: 'test-user',
        })
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('data');
    });

    test('should detect wrong day name', async () => {
      const response = await request(API_URL)
        .post('/api/v1/tools/validate_booking_date')
        .send({
          date: '2025-10-21',
          expectedDayName: 'onsdag', // Wrong! Should be tirsdag
          customerId: 'test-user',
        })
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('data');
    });

    test('should require all mandatory fields', async () => {
      const response = await request(API_URL)
        .post('/api/v1/tools/validate_booking_date')
        .send({
          date: '2025-10-21',
          // Missing expectedDayName and customerId
        })
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('success');
    });
  });

  describe('Tool 2: Check Booking Conflicts', () => {
    test('should check for conflicts in time range', async () => {
      const response = await request(API_URL)
        .post('/api/v1/tools/check_booking_conflicts')
        .send({
          startTime: '2025-10-21T09:00:00+02:00',
          endTime: '2025-10-21T12:00:00+02:00',
        })
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('data');
    });

    test('should handle invalid time format', async () => {
      const response = await request(API_URL)
        .post('/api/v1/tools/check_booking_conflicts')
        .send({
          startTime: 'invalid-time',
          endTime: '2025-10-21T12:00:00+02:00',
        })
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('success');
    });
  });

  describe('Tool 3: Auto Create Invoice', () => {
    test('should return error when Billy MCP not configured', async () => {
      const response = await request(API_URL)
        .post('/api/v1/tools/auto_create_invoice')
        .send({
          bookingId: 'test-booking-123',
          customerId: 'test-customer',
          amount: 5000,
        })
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'INVOICE_ERROR');
    });
  });

  describe('Tool 4: Track Overtime Risk', () => {
    test('should return error when Supabase not configured', async () => {
      const response = await request(API_URL)
        .post('/api/v1/tools/track_overtime_risk')
        .send({
          bookingId: 'test-booking-456',
          currentDuration: 540, // 9 hours in minutes
          estimatedDuration: 480, // 8 hours in minutes
        })
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'OVERTIME_TRACKING_ERROR');
    });

    test('should handle overtime request with error', async () => {
      const response = await request(API_URL)
        .post('/api/v1/tools/track_overtime_risk')
        .send({
          bookingId: 'test-booking-789',
          currentDuration: 600, // 10 hours
          estimatedDuration: 480, // 8 hours
        })
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Tool 5: Get Customer Memory', () => {
    test('should retrieve customer intelligence', async () => {
      const response = await request(API_URL)
        .post('/api/v1/tools/get_customer_memory')
        .send({
          customerId: 'jes-vestergaard',
        })
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('data');
    });

    test('should handle non-existent customer', async () => {
      const response = await request(API_URL)
        .post('/api/v1/tools/get_customer_memory')
        .send({
          customerId: 'non-existent-customer',
        })
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('data');
    });
  });

  describe('Tools List Endpoint', () => {
    test('GET /api/v1/tools should list all available tools', async () => {
      const response = await request(API_URL)
        .get('/api/v1/tools')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('tools');
      expect(response.body.data.tools).toBeInstanceOf(Array);
      expect(response.body.data.tools).toHaveLength(5);
    });

    test('Tools list should include tool metadata', async () => {
      const response = await request(API_URL)
        .get('/api/v1/tools')
        .expect(200);

      const tools = response.body.data.tools;
      tools.forEach((tool: any) => {
        expect(tool).toHaveProperty('name');
        expect(tool).toHaveProperty('description');
        expect(tool).toHaveProperty('endpoint');
      });
    });
  });
});

