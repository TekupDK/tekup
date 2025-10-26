import { SettingsService } from './settings.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { MetricsService } from '../metrics/metrics.service.js';

describe('SettingsService', () => {
  const make = () => {
    const store: any[] = []; const events: any[] = [];
    const prisma = {
      tenantSetting: {
        findMany: jest.fn(async ({ where }: any) => store.filter(r => r.tenantId === where.tenantId)),
        upsert: jest.fn(async ({ where, update, create }: any) => {
          const idx = store.findIndex(r => r.tenantId === where.tenantId_key.tenantId && r.key === where.tenantId_key.key);
          if (idx >= 0) { store[idx].value = update.value; return store[idx]; }
          const rec = { tenantId: create.tenantId, key: create.key, value: create.value }; store.push(rec); return rec; }),
      },
      settingsEvent: { create: jest.fn(async ({ data }: any) => { events.push(data); return data; }) },
      $transaction: jest.fn(async (fn: any) => fn(prisma))
    } as unknown as PrismaService;
    const metrics = new MetricsService();
    const service = new SettingsService(prisma, metrics);
    return { service, store, events, prisma, metrics };
  };

  describe('validation', () => {
    it('validates keys and rejects invalid values', async () => {
      const { service } = make();
      await expect(service.update('t1', { sla_response_minutes: 30 })).resolves.toBeTruthy();
      await expect(service.update('t1', { sla_response_minutes: 3 })).rejects.toThrow('invalid_sla_response_minutes');
      await expect(service.update('t1', { theme_primary_color: 'blue' })).rejects.toThrow('invalid_theme_primary_color');
    });

    it('rejects empty brand display name', async () => {
      const { service } = make();
      await expect(service.update('t1', { brand_display_name: '' })).rejects.toThrow('invalid_brand_display_name');
    });

    it('rejects brand display name that is too long', async () => {
      const { service } = make();
      const longName = 'a'.repeat(121); // Exceeds 120 character limit
      await expect(service.update('t1', { brand_display_name: longName })).rejects.toThrow('invalid_brand_display_name');
    });

    it('accepts valid brand display name', async () => {
      const { service } = make();
      await expect(service.update('t1', { brand_display_name: 'Valid Brand Name' })).resolves.toBeTruthy();
    });

    it('rejects invalid hex color formats', async () => {
      const { service } = make();
      const invalidColors = ['#12345', '#1234567', 'blue', '#GGGGGG', '123456', ''];
      
      for (const color of invalidColors) {
        await expect(service.update('t1', { theme_primary_color: color }))
          .rejects.toThrow('invalid_theme_primary_color');
      }
    });

    it('accepts valid hex colors', async () => {
      const { service } = make();
      const validColors = ['#ff0000', '#FF0000', '#123456', '#abcdef', '#ABCDEF'];
      
      for (const color of validColors) {
        await expect(service.update('t1', { theme_primary_color: color })).resolves.toBeTruthy();
      }
    });

    it('rejects SLA response minutes out of range', async () => {
      const { service } = make();
      await expect(service.update('t1', { sla_response_minutes: 4 })).rejects.toThrow('invalid_sla_response_minutes'); // Too low
      await expect(service.update('t1', { sla_response_minutes: 1441 })).rejects.toThrow('invalid_sla_response_minutes'); // Too high
      await expect(service.update('t1', { sla_response_minutes: 5.5 })).rejects.toThrow('invalid_sla_response_minutes'); // Not integer
    });

    it('rejects duplicate window minutes out of range', async () => {
      const { service } = make();
      await expect(service.update('t1', { duplicate_window_minutes: 4 })).rejects.toThrow('invalid_duplicate_window_minutes'); // Too low
      await expect(service.update('t1', { duplicate_window_minutes: 10081 })).rejects.toThrow('invalid_duplicate_window_minutes'); // Too high
      await expect(service.update('t1', { duplicate_window_minutes: 10.5 })).rejects.toThrow('invalid_duplicate_window_minutes'); // Not integer
    });

    it('accepts valid boolean for enable_advanced_parser', async () => {
      const { service } = make();
      await expect(service.update('t1', { enable_advanced_parser: true })).resolves.toBeTruthy();
      await expect(service.update('t1', { enable_advanced_parser: false })).resolves.toBeTruthy();
    });

    it('rejects invalid boolean for enable_advanced_parser', async () => {
      const { service } = make();
      await expect(service.update('t1', { enable_advanced_parser: 'true' })).rejects.toThrow('invalid_enable_advanced_parser');
      await expect(service.update('t1', { enable_advanced_parser: 1 })).rejects.toThrow('invalid_enable_advanced_parser');
    });

    it('throws error when no valid keys provided', async () => {
      const { service } = make();
      await expect(service.update('t1', { invalid_key: 'value' })).rejects.toThrow('no_valid_keys');
    });

    it('ignores invalid keys and processes valid ones', async () => {
      const { service } = make();
      const result = await service.update('t1', { 
        invalid_key: 'ignored',
        sla_response_minutes: 30 
      });
      expect(result.sla_response_minutes).toBe(30);
    });
  });

  describe('caching', () => {
    it('caches loads and invalidates after update', async () => {
      const { service, prisma } = make();
      const first = await service.getResolved('t2');
      expect(prisma.tenantSetting.findMany).toHaveBeenCalledTimes(1);
      const again = await service.getResolved('t2');
      expect(prisma.tenantSetting.findMany).toHaveBeenCalledTimes(1); // from cache
      await service.update('t2', { duplicate_window_minutes: 90 });
      await service.getResolved('t2');
      // After update invalidation triggers a fresh load inside update (getResolved) plus our manual call => total 3
      expect(prisma.tenantSetting.findMany).toHaveBeenCalledTimes(3);
      expect(first.duplicate_window_minutes).toBe(60);
      const updated = await service.getResolved('t2');
      expect(updated.duplicate_window_minutes).toBe(90);
    });

    it('respects cache TTL', async () => {
      const { service, prisma } = make();
      
      // Mock Date.now to control time
      const originalNow = Date.now;
      let mockTime = 1000000;
      jest.spyOn(Date, 'now').mockImplementation(() => mockTime);

      try {
        // First load
        await service.getResolved('t3');
        expect(prisma.tenantSetting.findMany).toHaveBeenCalledTimes(1);

        // Second load within TTL - should use cache
        mockTime += 20000; // 20 seconds later (TTL is 30 seconds)
        await service.getResolved('t3');
        expect(prisma.tenantSetting.findMany).toHaveBeenCalledTimes(1);

        // Third load after TTL - should reload
        mockTime += 15000; // 35 seconds total (exceeded TTL)
        await service.getResolved('t3');
        expect(prisma.tenantSetting.findMany).toHaveBeenCalledTimes(2);
      } finally {
        Date.now = originalNow;
      }
    });

    it('maintains separate cache per tenant', async () => {
      const { service, prisma } = make();
      
      await service.getResolved('tenant1');
      await service.getResolved('tenant2');
      await service.getResolved('tenant1'); // Should use cache
      
      expect(prisma.tenantSetting.findMany).toHaveBeenCalledTimes(2);
      expect(prisma.tenantSetting.findMany).toHaveBeenCalledWith({ where: { tenantId: 'tenant1' }});
      expect(prisma.tenantSetting.findMany).toHaveBeenCalledWith({ where: { tenantId: 'tenant2' }});
    });

    it('cache invalidation only affects specific tenant', async () => {
      const { service, prisma } = make();
      
      // Load settings for both tenants
      await service.getResolved('tenant1');
      await service.getResolved('tenant2');
      expect(prisma.tenantSetting.findMany).toHaveBeenCalledTimes(2);

      // Update tenant1 - should invalidate only tenant1 cache
      await service.update('tenant1', { sla_response_minutes: 30 });
      
      // Access tenant1 again - should reload
      await service.getResolved('tenant1');
      
      // Access tenant2 again - should use cache
      await service.getResolved('tenant2');
      
      // tenant1: initial load + load in update + load after update = 3 calls for tenant1
      // tenant2: initial load + cached access = 1 call for tenant2
      // Total: 4 calls (2 initial + 1 in update + 1 reload for tenant1)
      expect(prisma.tenantSetting.findMany).toHaveBeenCalledTimes(4);
    });
  });

  describe('auditing and events', () => {
    it('creates audit events for settings updates', async () => {
      const { service, events } = make();
      
      await service.update('tenant1', { 
        sla_response_minutes: 45,
        theme_primary_color: '#ff0000' 
      }, 'test-user');
      
      expect(events).toHaveLength(2);
      expect(events[0]).toMatchObject({
        tenantId: 'tenant1',
        key: 'sla_response_minutes',
        oldValue: undefined, // No existing value
        newValue: 45,
        actor: 'test-user'
      });
      expect(events[1]).toMatchObject({
        tenantId: 'tenant1',
        key: 'theme_primary_color',
        oldValue: undefined,
        newValue: '#ff0000',
        actor: 'test-user'
      });
    });

    it('tracks old values in audit events for updates', async () => {
      const { service, events, store } = make();
      
      // Pre-populate some settings
      store.push({ tenantId: 'tenant1', key: 'sla_response_minutes', value: 60 });
      
      await service.update('tenant1', { sla_response_minutes: 45 }, 'admin');
      
      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        tenantId: 'tenant1',
        key: 'sla_response_minutes',
        oldValue: 60,
        newValue: 45,
        actor: 'admin'
      });
    });

    it('handles updates without actor', async () => {
      const { service, events } = make();
      
      await service.update('tenant1', { sla_response_minutes: 45 }); // No actor provided
      
      expect(events[0].actor).toBeUndefined();
    });
  });

  describe('metrics', () => {
    it('increments settings_load_total metric on cache miss', async () => {
      const { service, metrics } = make();
      const incrementSpy = jest.spyOn(metrics, 'increment');
      
      await service.getResolved('tenant1');
      await service.getResolved('tenant1'); // Second call should use cache
      
      expect(incrementSpy).toHaveBeenCalledWith('settings_load_total', { tenant: 'tenant1' });
      expect(incrementSpy).toHaveBeenCalledTimes(1); // Only once due to caching
    });

    it('increments settings_update_total metric with correct count', async () => {
      const { service, metrics } = make();
      const incrementSpy = jest.spyOn(metrics, 'increment');
      
      await service.update('tenant1', { 
        sla_response_minutes: 45,
        theme_primary_color: '#ff0000',
        enable_advanced_parser: true
      });
      
      expect(incrementSpy).toHaveBeenCalledWith('settings_update_total', { 
        tenant: 'tenant1', 
        count: '3' 
      });
    });

    it('reports correct count when mixed valid and invalid keys', async () => {
      const { service, metrics } = make();
      const incrementSpy = jest.spyOn(metrics, 'increment');
      
      await service.update('tenant1', { 
        sla_response_minutes: 45,
        invalid_key: 'ignored',
        theme_primary_color: '#ff0000'
      });
      
      expect(incrementSpy).toHaveBeenCalledWith('settings_update_total', { 
        tenant: 'tenant1', 
        count: '2' // Only valid keys counted
      });
    });
  });

  describe('defaults', () => {
    it('returns default values for new tenant', async () => {
      const { service } = make();
      
      const settings = await service.getResolved('new-tenant');
      
      expect(settings).toMatchObject({
        sla_response_minutes: 60,
        duplicate_window_minutes: 60,
        enable_advanced_parser: false
      });
    });

    it('merges stored settings with defaults', async () => {
      const { service, store } = make();
      
      // Pre-populate some settings
      store.push({ tenantId: 'tenant1', key: 'sla_response_minutes', value: 120 });
      store.push({ tenantId: 'tenant1', key: 'brand_display_name', value: 'Custom Brand' });
      
      const settings = await service.getResolved('tenant1');
      
      expect(settings).toMatchObject({
        sla_response_minutes: 120, // Overridden
        duplicate_window_minutes: 60, // Default
        enable_advanced_parser: false, // Default
        brand_display_name: 'Custom Brand' // Stored
      });
    });

    it('handles tenant with no stored settings', async () => {
      const { service, prisma } = make();
      
      const settings = await service.getResolved('empty-tenant');
      
      expect(settings).toEqual({
        sla_response_minutes: 60,
        duplicate_window_minutes: 60,
        enable_advanced_parser: false
      });
      expect(prisma.tenantSetting.findMany).toHaveBeenCalledWith({ 
        where: { tenantId: 'empty-tenant' } 
      });
    });
  });

  describe('transaction handling', () => {
    it('uses transaction for atomic updates', async () => {
      const { service, prisma } = make();
      
      await service.update('tenant1', { 
        sla_response_minutes: 45,
        theme_primary_color: '#ff0000'
      });
      
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('rolls back on validation failure during transaction', async () => {
      const { service, store, events } = make();
      
      // Mock upsert to succeed for first call but validation to fail on second
      let callCount = 0;
      const originalUpsert = service['prisma'].tenantSetting.upsert;
      (service['prisma'].tenantSetting.upsert as jest.Mock).mockImplementation(async (args) => {
        callCount++;
        if (callCount === 1) {
          // First call succeeds
          return originalUpsert(args);
        }
        // Second call would happen but validation fails before we get here
        throw new Error('This should not be reached');
      });
      
      try {
        await service.update('tenant1', { 
          sla_response_minutes: 45, // Valid
          theme_primary_color: 'invalid-color' // Invalid
        });
        fail('Expected update to fail due to invalid color');
      } catch (error: any) {
        expect(error.message).toBe('invalid_theme_primary_color');
      }
      
      // Verify no partial updates occurred
      expect(store).toHaveLength(0);
      expect(events).toHaveLength(0);
    });
  });
});