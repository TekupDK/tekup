import { MetricsService } from './metrics.service.js';

describe('MetricsService', () => {
  it('increments generic counters and renders prometheus text', () => {
    const svc = new MetricsService();
    svc.increment('lead_created_total', { tenant: 'tenantA', source: 'form' });
    svc.increment('lead_created_total', { tenant: 'tenantA', source: 'form' });
    svc.increment('lead_status_transition_total', { tenant: 'tenantA', from: 'NEW', to: 'CONTACTED' });
    const text = svc.renderPrometheus();
    expect(text).toContain('lead_created_total');
    expect(text).toContain('tenant="tenantA"');
  const lines = text.split(/\n+/);
  const createdLine = lines.find(l => l.startsWith('lead_created_total'))!;
  expect(createdLine).toMatch(/lead_created_total\{/);
  expect(createdLine).toContain('tenant="tenantA"');
  expect(createdLine).toContain('source="form"');
  expect(createdLine.endsWith(' 2')).toBe(true);
  const transitionLine = lines.find(l => l.startsWith('lead_status_transition_total'))!;
  expect(transitionLine).toContain('from="NEW"');
  expect(transitionLine).toContain('to="CONTACTED"');
  expect(transitionLine).toContain('tenant="tenantA"');
  expect(transitionLine.endsWith(' 1')).toBe(true);
  });
});
