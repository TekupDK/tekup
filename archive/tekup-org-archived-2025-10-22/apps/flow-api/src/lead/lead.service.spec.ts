import { LeadService } from './lead.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { MetricsService } from '../metrics/metrics.service.js';
import { SettingsService } from '../settings/settings.service.js';

type MockStore = { leads: any[]; events: any[] };

// Minimal mock Prisma + metrics
const createDeps = () => {
  const store: MockStore = { leads: [], events: [] };
  const prisma = {
    lead: {
      findMany: jest.fn(async ({ where }: any) => store.leads.filter((l: any) => l.tenantId === where.tenantId)),
  create: jest.fn(async ({ data }: any) => { const rec = { status: 'NEW', createdAt: new Date(), updatedAt: new Date(), ...data, id: data.id || 'L'+(store.leads.length+1) }; store.leads.push(rec); return rec; }),
      findFirst: jest.fn(async ({ where }: any) => {
        // duplicate path OR query or by id lookup
        if (where.id) {
          return store.leads.find((l: any) => l.id === where.id && l.tenantId === where.tenantId);
        }
        // duplicate detection shape: { tenantId, status: 'NEW', createdAt: { gte: Date }, OR: [ { payload:... }, ... ] }
        return store.leads.find((l: any) => l.tenantId === where.tenantId && l.status === where.status && l.createdAt >= where.createdAt.gte && where.OR.some((cond: any) => {
          if (cond?.payload?.path?.[0] === 'email') {
            return (l.payload?.email || '').toLowerCase() === cond.payload.equals;
          }
          if (cond?.payload?.path?.[0] === 'phone') {
            return (l.payload?.phone || '') === cond.payload.equals;
          }
          return false;
        }));
      }),
      update: jest.fn(async ({ where, data }: any) => { const i = store.leads.findIndex((l: any) => l.id === where.id); store.leads[i] = { ...store.leads[i], ...data }; return store.leads[i]; })
    },
    leadEvent: { 
      create: jest.fn(async ({ data }: any) => { store.events.push({ ...data, id: data.id || 'E'+(store.events.length+1), createdAt: new Date() }); return data; }),
      findMany: jest.fn(async ({ where }: any) => store.events.filter(e => e.leadId === where.leadId))
    }
  } as unknown as PrismaService;
  const metrics = new MetricsService();
  const settings: Partial<SettingsService> = {
    getResolved: jest.fn(async () => ({ duplicate_window_minutes: 60 }))
  } as any;
  return { prisma, metrics, settings, store };
};

describe('LeadService', () => {
  it('creates lead with NEW and transitions to CONTACTED once', async () => {
    const { prisma, metrics, settings } = createDeps();
    const svc = new LeadService(prisma, metrics, settings as SettingsService);
    const lead = await svc.create({ tenantId: 't1', source: 'form' });
    expect(lead.status).toBe('NEW');
    const updated = await svc.changeStatus(lead.id, 't1', 'CONTACTED');
    expect(updated.status).toBe('CONTACTED');
    const updatedAgain = await svc.changeStatus(lead.id, 't1', 'CONTACTED');
    expect(updatedAgain.status).toBe('CONTACTED'); // idempotent
  const events = await svc.events(lead.id, 't1');
  expect(events.length).toBe(1);
  });

  it('deduplicates leads within window', async () => {
    const { prisma, metrics, settings } = createDeps();
    const svc = new LeadService(prisma, metrics, settings as SettingsService);
    const first = await svc.create({ tenantId: 't1', source: 'form', payload: { email: 'User@Example.com' } });
    const dup = await svc.create({ tenantId: 't1', source: 'form', payload: { email: 'user@example.com' } });
    expect(dup.id).toBe(first.id);
  });
});
