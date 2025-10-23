/**
 * Ops automation tools for Tekup-Billy MCP
 * - list_audit_logs: query today's Supabase audit logs (server-side)
 * - run_ops_check: run a quick end-to-end check (Billy auth + audit count)
 */

import { z } from 'zod';
import { BillyClient } from '../billy-client.js';
import { getBillyConfig } from '../config.js';
import { supabaseAdmin, isSupabaseEnabled } from '../database/supabase-client.js';
import { log } from '../utils/logger.js';

const listAuditLogsSchema = z.object({
  sinceDate: z.string().optional().describe('ISO date (YYYY-MM-DD). Default: today'),
  limit: z.number().int().min(1).max(500).optional().describe('Max rows (1-500). Default: 50'),
});

export async function listAuditLogs(_client: BillyClient, args: unknown) {
  const start = Date.now();
  try {
    const { sinceDate, limit = 50 } = listAuditLogsSchema.parse(args);

    if (!isSupabaseEnabled() || !supabaseAdmin) {
      throw new Error('Supabase is not configured on the server');
    }

    const { organizationId } = getBillyConfig();

    // Default sinceDate = today in server timezone (UTC-based)
    const isoDate = sinceDate ?? new Date().toISOString().slice(0, 10);

    const { data, error } = await supabaseAdmin
      .from('billy_audit_logs')
      .select('*')
      .eq('organization_id', organizationId)
      .gte('created_at', `${isoDate}T00:00:00.000Z`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(error.message);
    }

    const response = {
      success: true,
      organizationId,
      sinceDate: isoDate,
      count: data?.length ?? 0,
      rows: data ?? [],
      tookMs: Date.now() - start,
    };

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(response, null, 2) }],
      structuredContent: response,
    };
  } catch (err: any) {
    const response = {
      success: false,
      error: err?.message ?? 'Unknown error',
      tookMs: Date.now() - start,
    };
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(response, null, 2) }],
      isError: true,
    };
  }
}

const runOpsCheckSchema = z.object({
  includeDiagnostics: z.boolean().optional().describe('If true, include additional timing/metrics fields'),
});

export async function runOpsCheck(client: BillyClient, args: unknown) {
  const startedAt = Date.now();
  try {
    const { includeDiagnostics = false } = runOpsCheckSchema.parse(args);

    // 1) Validate Billy authentication
    const authStart = Date.now();
    const auth = await client.validateAuth();
    const authMs = Date.now() - authStart;

    // 2) List today audit logs (if Supabase is enabled)
    let auditCount: number | null = null;
    let auditPreview: any[] | null = null;
    let sinceDate = new Date().toISOString().slice(0, 10);

    if (isSupabaseEnabled() && supabaseAdmin) {
      const { organizationId } = getBillyConfig();
      const { data, error } = await supabaseAdmin
        .from('billy_audit_logs')
        .select('*')
        .eq('organization_id', organizationId)
        .gte('created_at', `${sinceDate}T00:00:00.000Z`)
        .order('created_at', { ascending: false })
        .limit(10);
      if (!error && data) {
        auditCount = data.length; // preview count only; not full day count to keep it lightweight
        auditPreview = data;
      }
    }

    const payload: any = {
      success: true,
      billyAuth: {
        valid: auth.valid,
        error: auth.error,
        organization: auth.organization ? { id: auth.organization.id, name: auth.organization.name } : undefined,
        tookMs: authMs,
      },
      supabase: isSupabaseEnabled()
        ? { enabled: true, todayPreviewCount: auditCount, sinceDate, preview: auditPreview }
        : { enabled: false },
    };

    if (includeDiagnostics) {
      payload.tookMs = Date.now() - startedAt;
      payload.timestamp = new Date().toISOString();
      payload.nodeVersion = process.version;
    }

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(payload, null, 2) }],
      structuredContent: payload,
    };
  } catch (err: any) {
    const failure = {
      success: false,
      error: err?.message ?? 'Unknown error',
      tookMs: Date.now() - startedAt,
    };
    log.error('run_ops_check failed', err);
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(failure, null, 2) }],
      isError: true,
    };
  }
}
