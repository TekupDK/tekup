import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../modules/app.module.js';
import request from 'supertest';

// NOTE: This assumes seeded tenant & api key present; adapt with dynamic lookup if needed.
const API_KEY = process.env.TEST_TENANT_API_KEY || 'dev-tenant-key-1';

describe('Lead events endpoint (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => { await app.close(); });

  it('returns empty array for new lead then shows event after status change', async () => {
    // create lead via ingestion
    const createRes = await request(app.getHttpServer())
      .post('/ingest/form')
      .set('x-tenant-key', API_KEY)
      .send({ source: 'form', payload: { email: 'test@example.com' } })
      .expect(201)
    const leadId = createRes.body.id;

    // events empty
    const eventsEmpty = await request(app.getHttpServer())
      .get(`/leads/${leadId}/events`)
      .set('x-tenant-key', API_KEY)
      .expect(200)
    expect(eventsEmpty.body).toEqual([]);

    // status change
    await request(app.getHttpServer())
      .patch(`/leads/${leadId}/status`)
      .set('x-tenant-key', API_KEY)
      .send({ status: 'contacted' })
      .expect(200);

    const eventsAfter = await request(app.getHttpServer())
      .get(`/leads/${leadId}/events`)
      .set('x-tenant-key', API_KEY)
      .expect(200)
    expect(eventsAfter.body.length).toBeGreaterThanOrEqual(1);
    expect(eventsAfter.body[0].toStatus).toBe('contacted');
  });
});
