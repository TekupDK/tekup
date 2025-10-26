import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/modules/app.module';

describe('Ingestion form negative scenarios (e2e)', () => {
  let app: INestApplication;
  const VALID_KEY = process.env.TEST_TENANT_API_KEY || 'dev-tenant-key-1';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => { await app.close(); });

  it('responds with tenant missing when API key middleware not applied', async () => {
    const res = await request(app.getHttpServer())
      .post('/ingest/form')
      .send({ payload: { email: 'a@b.com' } })
      .expect(400);
    expect(res.text).toMatch(/tenant/);
  });

  it('rejects invalid payload (no email/phone)', async () => {
    await request(app.getHttpServer())
      .post('/ingest/form')
      .send({ payload: { foo: 'bar' } })
      .expect(400);
  });
});
