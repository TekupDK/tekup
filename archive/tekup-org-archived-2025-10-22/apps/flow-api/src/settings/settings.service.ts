import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { MetricsService } from '../metrics/metrics.service.js';

// Allowed editable keys and lightweight validation logic
const SCHEMA: Record<string, (v: any) => boolean> = {
  brand_display_name: v => typeof v === 'string' && v.length > 0 && v.length <= 120,
  theme_primary_color: v => typeof v === 'string' && /^#([0-9a-f]{6})$/i.test(v),
  sla_response_minutes: v => Number.isInteger(v) && v >= 5 && v <= 1440,
  duplicate_window_minutes: v => Number.isInteger(v) && v >= 5 && v <= 10080,
  enable_advanced_parser: v => typeof v === 'boolean'
};

const DEFAULTS: Record<string, any> = {
  sla_response_minutes: 60,
  duplicate_window_minutes: 60,
  enable_advanced_parser: false
};

export interface SettingsMap { [k: string]: any }

@Injectable()
export class SettingsService {
  private cache = new Map<string, { value: SettingsMap; loadedAt: number }>();
  private ttlMs = 30_000;
  constructor(private prisma: PrismaService, private metrics: MetricsService) {}

  private async load(tenantId: string): Promise<SettingsMap> {
    const row = await this.prisma.tenantSetting.findMany({ where: { tenantId } });
    const map: SettingsMap = { ...DEFAULTS };
    for (const s of row) map[s.key] = s.value;
    return map;
  }

  async getResolved(tenantId: string): Promise<SettingsMap> {
    const c = this.cache.get(tenantId);
    const now = Date.now();
    if (c && now - c.loadedAt < this.ttlMs) return c.value;
    const value = await this.load(tenantId);
    this.cache.set(tenantId, { value, loadedAt: now });
    this.metrics.increment('settings_load_total', { tenant: tenantId });
    return value;
  }

  async update(tenantId: string, updates: SettingsMap, actor?: string): Promise<SettingsMap> {
    const validEntries = Object.entries(updates).filter(([k,v]) => k in SCHEMA);
    if (!validEntries.length) throw new Error('no_valid_keys');
    for (const [k,v] of validEntries) {
      if (!SCHEMA[k](v)) throw new Error(`invalid_${k}`);
    }
  return this.prisma.$transaction(async (tx: any) => {
      const existing = await tx.tenantSetting.findMany({ where: { tenantId } });
      const existingMap: Record<string, any> = {};
      for (const e of existing) existingMap[e.key] = e.value;
      for (const [k,v] of validEntries) {
        await tx.tenantSetting.upsert({
          where: { tenantId_key: { tenantId, key: k } },
            update: { value: v },
            create: { tenantId, key: k, value: v }
        });
        await tx.settingsEvent.create({ data: { tenantId, key: k, oldValue: existingMap[k], newValue: v, actor } });
      }
      // invalidate cache
      this.cache.delete(tenantId);
      this.metrics.increment('settings_update_total', { tenant: tenantId, count: String(validEntries.length) });
      return this.getResolved(tenantId);
    });
  }
}
