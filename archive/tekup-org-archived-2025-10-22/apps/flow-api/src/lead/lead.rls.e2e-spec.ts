import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../modules/app.module.js';
import request from 'supertest';

// This test assumes migration seed created at least 2 tenants + api keys.
// We fetch two distinct api keys via direct SQL call (unsafe for prod, fine in test) OR accept provided env overrides.

const KEY_A = process.env.TEST_TENANT_KEY_A || process.env.TEST_TENANT_API_KEY || 'dev-tenant-key-1';
const KEY_B = process.env.TEST_TENANT_KEY_B || 'dev-tenant-key-2';

// NOTE: If the seed only created a single dev key, set TEST_TENANT_KEY_B to another key manually before running.

describe('RLS isolation (e2e)', () => {
  let app: INestApplication;
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });
  afterAll(async () => { await app.close(); });

  let leadA: string;
  let leadB: string;

  it('creates lead for tenant A', async () => {
    const res = await request(app.getHttpServer())
      .post('/ingest/form')
      .set('x-tenant-key', KEY_A)
      .send({ source: 'form', payload: { email: 'a@example.com' } })
      .expect(201);
    leadA = res.body.id;
  });

  it('creates lead for tenant B', async () => {
    const res = await request(app.getHttpServer())
      .post('/ingest/form')
      .set('x-tenant-key', KEY_B)
      .send({ source: 'form', payload: { email: 'b@example.com' } })
      .expect(201);
    leadB = res.body.id;
  });

  it('tenant A cannot see tenant B lead', async () => {
    const list = await request(app.getHttpServer())
      .get('/leads')
      .set('x-tenant-key', KEY_A)
      .expect(200);
    expect(list.body.some((l: any) => l.id === leadB)).toBe(false);
  });

  it('tenant B cannot see tenant A lead', async () => {
    const list = await request(app.getHttpServer())
      .get('/leads')
      .set('x-tenant-key', KEY_B)
      .expect(200);
    expect(list.body.some((l: any) => l.id === leadA)).toBe(false);
  });
});
