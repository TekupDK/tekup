import { IngestionController } from './ingestion.controller.js';
import { LeadService } from '../lead/lead.service.js';
import { MetricsService } from '../metrics/metrics.service.js';

describe('IngestionController', () => {
  const make = () => {
    const metrics = new MetricsService();
    const leadService: Partial<LeadService> = {
      create: jest.fn(async (d: any) => ({ id: 'L1', status: 'NEW', ...d }))
    } as any;
    const controller = new IngestionController(leadService as LeadService, metrics);
    const req: any = { tenantId: 't1' };
    return { controller, metrics, leadService, req };
  };

  it('ingests form with email', async () => {
    const { controller, req } = make();
    const lead = await controller.ingestForm({ source: 'form', payload: { email: 'a@b.com' } }, req);
    expect(lead.id).toBe('L1');
  });

  it('rejects invalid payload', async () => {
    const { controller, req } = make();
    await expect(controller.ingestForm({ source: 'form', payload: { foo: 'bar' } } as any, req)).rejects.toBeTruthy();
  });
});
