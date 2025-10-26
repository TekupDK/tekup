import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/modules/app.module';
import { MetricsService } from '../src/metrics/metrics.service';

// E2E tests for /metrics endpoint (Tasks 6.1-6.4)

describe('/metrics exporter (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /metrics returns HELP & TYPE lines and a counter sample (6.1)', async () => {
  const res = await request(app.getHttpServer()).get('/metrics').expect(200);
    expect(res.text).toMatch(/# HELP lead_created_total/);
    expect(res.text).toMatch(/# TYPE lead_created_total counter/);
    expect(res.text).toMatch(/lead_created_total /);
  // Task 9.1 regression: ensure legacy canonical metric still present
  expect(res.text).toContain('lead_created_total');
  });

  it('POST /metrics returns 405 with Allow header (6.2)', async () => {
  const res = await request(app.getHttpServer()).post('/metrics').send({}).expect(405);
    expect(res.headers['allow']).toBe('GET');
    expect(res.text).toMatch(/# ERROR method_not_allowed/);
  });

  it('Simulated render error returns 500 + # ERROR line (6.3)', async () => {
    // Monkey patch service method by briefly replacing renderPrometheus on provider instance
  const metricsService = app.get(MetricsService as any);
    const original = metricsService.renderPrometheus;
    metricsService.renderPrometheus = () => { throw new Error('boom'); };
    const res = await request(app.getHttpServer()).get('/metrics').expect(500);
    expect(res.text.trim()).toBe('# ERROR render_failed');
    // Restore
    metricsService.renderPrometheus = original;
  });

  it('Protection toggle returns 401 without key and 200 with key (6.4)', async () => {
    process.env.PX_METRICS_PROTECT = '1';
    // Without key
    await request(app.getHttpServer()).get('/metrics').expect(401);
    // With key (re-using existing seeded key header if middleware expects)
  const resOk = await request(app.getHttpServer())
      .get('/metrics')
      .set('x-tenant-key', process.env.TEST_TENANT_API_KEY || 'dev-tenant-key-1')
      .expect(200);
    expect(resOk.text).toMatch(/lead_created_total/);
    delete process.env.PX_METRICS_PROTECT;
  });
  // TODO(metrics-histogram 8.2): future HTTP render latency histogram integration point
});
