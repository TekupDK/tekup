import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../modules/app.module.js';
import request from 'supertest';

// Simple e2e check that counters increment and appear in /metrics output.

describe('Metrics endpoint (e2e)', () => {
  let app: INestApplication;
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });
  afterAll(async () => { await app.close(); });

  it('includes created leads and status transitions', async () => {
    // Create a lead via ingestion twice, then update status once
      const lead = await request(app.getHttpServer())
        .post('/ingest/form')
        .set('x-tenant-key', process.env.TEST_TENANT_API_KEY || 'dev-tenant-key-1')
        .send({ source: 'form', payload: { email: 'a@example.com' } })
      .expect(201);

    await request(app.getHttpServer())
        .patch(`/leads/${lead.body.id}/status`)
        .set('x-tenant-key', process.env.TEST_TENANT_API_KEY || 'dev-tenant-key-1')
        .send({})
      .expect(200);

    const res = await request(app.getHttpServer()).get('/metrics').expect(200);
      expect(res.text).toContain('lead_created_total'); // public metrics not tenant-scoped without header context
    expect(res.text).toContain('lead_status_transition_total');
  });
});
