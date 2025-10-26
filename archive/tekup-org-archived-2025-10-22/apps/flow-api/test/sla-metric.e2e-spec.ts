import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/modules/app.module';

// Simple test to ensure SLA histogram appears after a status transition
describe.skip('SLA processing metric (e2e)', () => {
  let app: INestApplication;
  const KEY = process.env.TEST_TENANT_API_KEY || 'dev-tenant-key-1';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => { await app.close(); });

  it('emits sla_processing_duration_seconds after NEW -> CONTACTED transition', async () => {
    const leadRes = await request(app.getHttpServer())
      .post('/ingest/form')
      .set('x-tenant-key', KEY)
      .send({ payload: { email: 'sla@test.com' } })
      .expect(201);
    const leadId = leadRes.body.id;
    await request(app.getHttpServer())
      .post(`/leads/${leadId}/status`)
      .set('x-tenant-key', KEY)
      .send({ status: 'CONTACTED' })
      .expect(200);
    const metrics = await request(app.getHttpServer()).get('/metrics').set('x-tenant-key', KEY).expect(200);
    expect(metrics.text).toMatch(/sla_processing_duration_seconds_bucket/);
  });
});
