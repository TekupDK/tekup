import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Tenant Isolation and Cross-Tenant Access (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('Basic Tenant Isolation', () => {
    it('should prevent cross-tenant data access', async () => {
      // Create API keys for different tenants
      const tenant1Key = 'tenant1-api-key';
      const tenant2Key = 'tenant2-api-key';

      // Create data in tenant 1
      await request(app.getHttpServer())
        .post('/leads')
        .set('x-tenant-key', tenant1Key)
        .send({ source: 'test', payload: { test: 'data' } })
        .expect(201);

      // Attempt to access tenant 1 data with tenant 2 key
      await request(app.getHttpServer())
        .get('/leads')
        .set('x-tenant-key', tenant2Key)
        .expect(200)
        .then(response => {
          expect(response.body).toHaveLength(0); // Should see no data
        });
    });

    it('should enforce tenant context in all operations', async () => {
      const tenantKey = 'test-tenant-key';

      // Create lead
      const createResponse = await request(app.getHttpServer())
        .post('/leads')
        .set('x-tenant-key', tenantKey)
        .send({ source: 'test', payload: { test: 'data' } })
        .expect(201);

      expect(createResponse.body.tenantId).toBeDefined();

      // Retrieve leads
      const getResponse = await request(app.getHttpServer())
        .get('/leads')
        .set('x-tenant-key', tenantKey)
        .expect(200);

      expect(getResponse.body).toBeDefined();
      // All leads should belong to the same tenant
      getResponse.body.forEach((lead: any) => {
        expect(lead.tenantId).toBe(createResponse.body.tenantId);
      });
    });
  });

  describe('Cross-Tenant Access Controls', () => {
    it('should enforce cross-tenant scope requirements', async () => {
      const regularKey = 'regular-api-key';
      const crossTenantKey = 'cross-tenant-api-key';

      // Attempt cross-tenant operation with insufficient permissions
      await request(app.getHttpServer())
        .get('/leads/analytics/cross-tenant')
        .set('x-tenant-key', regularKey)
        .expect(403);

      // Cross-tenant operation with proper permissions
      await request(app.getHttpServer())
        .get('/leads/analytics/cross-tenant')
        .set('x-tenant-key', crossTenantKey)
        .expect(200);
    });

    it('should require admin scope for cross-tenant operations', async () => {
      const nonAdminKey = 'non-admin-api-key';
      const adminKey = 'admin-api-key';

      // Non-admin key should be denied
      await request(app.getHttpServer())
        .get('/leads/analytics/cross-tenant')
        .set('x-tenant-key', nonAdminKey)
        .expect(403);

      // Admin key should be allowed
      await request(app.getHttpServer())
        .get('/leads/analytics/cross-tenant')
        .set('x-tenant-key', adminKey)
        .expect(200);
    });
  });

  describe('Business-Specific Access Controls', () => {
    it('should enforce business-specific permissions', async () => {
      const foodtruckKey = 'foodtruck-api-key';
      const essenzaKey = 'essenza-api-key';

      // Foodtruck key should access Foodtruck endpoints
      await request(app.getHttpServer())
        .get('/leads/foodtruck/special')
        .set('x-tenant-key', foodtruckKey)
        .expect(200);

      // Essenza key should be denied access to Foodtruck endpoints
      await request(app.getHttpServer())
        .get('/leads/foodtruck/special')
        .set('x-tenant-key', essenzaKey)
        .expect(403);
    });

    it('should allow TekUp admin access to all business endpoints', async () => {
      const tekupAdminKey = 'tekup-admin-api-key';

      // TekUp admin should access all business endpoints
      await request(app.getHttpServer())
        .get('/leads/foodtruck/special')
        .set('x-tenant-key', tekupAdminKey)
        .expect(200);

      await request(app.getHttpServer())
        .get('/leads/essenza/special')
        .set('x-tenant-key', tekupAdminKey)
        .expect(200);

      await request(app.getHttpServer())
        .get('/leads/rendetalje/special')
        .set('x-tenant-key', tekupAdminKey)
        .expect(200);
    });
  });

  describe('Scope Validation', () => {
    it('should validate required scopes', async () => {
      const noScopeKey = 'no-scope-api-key';
      const readScopeKey = 'read-scope-api-key';

      // Key without required scope should be denied
      await request(app.getHttpServer())
        .get('/leads')
        .set('x-tenant-key', noScopeKey)
        .expect(403);

      // Key with required scope should be allowed
      await request(app.getHttpServer())
        .get('/leads')
        .set('x-tenant-key', readScopeKey)
        .expect(200);
    });

    it('should allow admin scope to bypass all restrictions', async () => {
      const adminKey = 'admin-api-key';

      // Admin should access all endpoints regardless of scope requirements
      await request(app.getHttpServer())
        .get('/leads')
        .set('x-tenant-key', adminKey)
        .expect(200);

      await request(app.getHttpServer())
        .get('/leads/analytics/cross-tenant')
        .set('x-tenant-key', adminKey)
        .expect(200);

      await request(app.getHttpServer())
        .get('/leads/foodtruck/special')
        .set('x-tenant-key', adminKey)
        .expect(200);
    });
  });

  describe('GDPR Compliance Endpoints', () => {
    it('should enforce GDPR endpoint permissions', async () => {
      const regularKey = 'regular-api-key';
      const adminKey = 'admin-api-key';

      // Regular key should be denied access to GDPR endpoints
      await request(app.getHttpServer())
        .get('/gdpr/compliance-summary')
        .set('x-tenant-key', regularKey)
        .expect(403);

      // Admin key should access GDPR endpoints
      await request(app.getHttpServer())
        .get('/gdpr/compliance-summary')
        .set('x-tenant-key', adminKey)
        .expect(200);
    });

    it('should handle GDPR data subject requests', async () => {
      const adminKey = 'admin-api-key';

      const requestData = {
        customerId: 'customer-123',
        requestType: 'access',
        notes: 'Customer wants to see their data',
      };

      const response = await request(app.getHttpServer())
        .post('/gdpr/data-subject-request')
        .set('x-tenant-key', adminKey)
        .send(requestData)
        .expect(201);

      expect(response.body.requestId).toBeDefined();
      expect(response.body.status).toBe('processing');
    });
  });

  describe('Error Handling', () => {
    it('should provide clear error messages for permission failures', async () => {
      const regularKey = 'regular-api-key';

      const response = await request(app.getHttpServer())
        .get('/leads/analytics/cross-tenant')
        .set('x-tenant-key', regularKey)
        .expect(403);

      expect(response.body.error).toBe('insufficient_cross_tenant_permissions');
      expect(response.body.message).toContain('Cross-tenant operations require specific permissions');
    });

    it('should handle missing API key gracefully', async () => {
      const response = await request(app.getHttpServer())
        .get('/leads')
        .expect(401);

      expect(response.body.error).toBe('missing_api_key');
    });

    it('should handle invalid API key gracefully', async () => {
      const response = await request(app.getHttpServer())
        .get('/leads')
        .set('x-tenant-key', 'invalid-key')
        .expect(401);

      expect(response.body.error).toBe('invalid_api_key');
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle multiple concurrent requests efficiently', async () => {
      const tenantKey = 'test-tenant-key';
      const concurrentRequests = 10;

      const promises = Array.from({ length: concurrentRequests }, () =>
        request(app.getHttpServer())
          .get('/leads')
          .set('x-tenant-key', tenantKey)
      );

      const responses = await Promise.all(promises);

      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });

    it('should maintain tenant isolation under load', async () => {
      const tenant1Key = 'tenant1-api-key';
      const tenant2Key = 'tenant2-api-key';

      // Create data in both tenants
      await request(app.getHttpServer())
        .post('/leads')
        .set('x-tenant-key', tenant1Key)
        .send({ source: 'test', payload: { tenant: 'tenant1' } })
        .expect(201);

      await request(app.getHttpServer())
        .post('/leads')
        .set('x-tenant-key', tenant2Key)
        .send({ source: 'test', payload: { tenant: 'tenant2' } })
        .expect(201);

      // Verify isolation is maintained
      const tenant1Response = await request(app.getHttpServer())
        .get('/leads')
        .set('x-tenant-key', tenant1Key)
        .expect(200);

      const tenant2Response = await request(app.getHttpServer())
        .get('/leads')
        .set('x-tenant-key', tenant2Key)
        .expect(200);

      expect(tenant1Response.body).toHaveLength(1);
      expect(tenant2Response.body).toHaveLength(1);
      expect(tenant1Response.body[0].payload.tenant).toBe('tenant1');
      expect(tenant2Response.body[0].payload.tenant).toBe('tenant2');
    });
  });
});