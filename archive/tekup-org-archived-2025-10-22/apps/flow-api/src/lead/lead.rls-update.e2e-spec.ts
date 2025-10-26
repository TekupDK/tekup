import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../modules/app.module.js';
import request from 'supertest';

const KEY_A = process.env.TEST_TENANT_KEY_A || 'dev-tenant-key-1';
const KEY_B = process.env.TEST_TENANT_KEY_B || 'dev-tenant-key-2';

describe('RLS update/delete isolation', () => {
  let app: INestApplication; let leadA: string;
  beforeAll(async () => { const m = await Test.createTestingModule({ imports: [AppModule] }).compile(); app = m.createNestApplication(); await app.init(); });
  afterAll(async () => { await app.close(); });
  it('create lead for tenant A', async () => {
    const r = await request(app.getHttpServer()).post('/ingest/form').set('x-tenant-key', KEY_A).send({ payload: { email: 'x@a.com' } });
    leadA = r.body.id;
  });
  it('tenant B cannot mark tenant A lead contacted', async () => {
    await request(app.getHttpServer()).patch(`/leads/${leadA}/status`).set('x-tenant-key', KEY_B).send({ toStatus: 'CONTACTED' }).expect(500); // generic error due to not_found
  });
});