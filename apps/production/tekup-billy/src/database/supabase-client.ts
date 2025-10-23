/**
 * Supabase Client for Tekup-Billy MCP
 * 
 * Provides connection to Supabase database with:
 * - Typed clients (anon and service role)
 * - Organization management
 * - Cache operations (get/set with TTL)
 * - Audit logging
 * - Encryption utilities for Billy.dk API keys
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';
import dotenv from 'dotenv';
import { log as logger } from '../utils/logger.js';

// Load environment variables
dotenv.config();

// Simple logger helper
function log(operation: string, level: 'info' | 'error' | 'success', data: Record<string, any>) {
    logger.info(`Supabase: ${operation}`, { level, ...data });
}

// =====================================================
// ENVIRONMENT VARIABLES
// =====================================================

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-dev-key-change-in-prod';
const ENCRYPTION_SALT = process.env.ENCRYPTION_SALT || 'default-dev-salt-change';

// Check if Supabase is configured
const SUPABASE_ENABLED = !!(SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_SERVICE_KEY);

if (!SUPABASE_ENABLED) {
    logger.warn('Supabase not configured - running without caching, audit logs, and analytics', {
        suggestion: 'Set SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_KEY in .env',
        docs: 'See docs/SUPABASE_SETUP.md'
    });
} else {
    logger.info('Supabase enabled - caching and analytics active', {
        serviceKeyEnding: SUPABASE_SERVICE_KEY?.substring(SUPABASE_SERVICE_KEY.length - 10)
    });
}

// =====================================================
// TYPE DEFINITIONS
// =====================================================

export interface BillyOrganization {
    id: string;
    name: string;
    billy_api_key: string; // Encrypted
    billy_organization_id: string;
    created_at: string;
    updated_at: string;
    settings: Record<string, any>;
    is_active: boolean;
    api_key_rotated_at: string;
}

export interface BillyUser {
    id: string;
    email: string;
    organization_id: string;
    role: 'admin' | 'user' | 'readonly';
    created_at: string;
    last_login_at?: string;
    is_active: boolean;
    metadata: Record<string, any>;
}

export interface CachedResource<T = any> {
    id: string;
    organization_id: string;
    billy_id: string;
    data: T;
    cached_at: string;
    expires_at: string;
}

export interface AuditLogEntry {
    organization_id?: string;
    user_id?: string;
    tool_name: string;
    action: 'read' | 'create' | 'update' | 'delete';
    resource_type?: string;
    resource_id?: string;
    input_params?: Record<string, any>;
    output_data?: Record<string, any>;
    success: boolean;
    error_message?: string;
    duration_ms?: number;
    ip_address?: string;
    user_agent?: string;
}

export interface UsageMetric {
    organization_id: string;
    date: string;
    hour: number;
    tool_name: string;
    call_count: number;
    success_count: number;
    error_count: number;
    avg_duration_ms: number;
    cache_hit_rate: number;
}

export interface CacheStats {
    resource_type: string;
    total_cached: number;
    active_cached: number;
    expired_cached: number;
    last_cached_at?: string;
}

// =====================================================
// SUPABASE CLIENTS
// =====================================================

/**
 * Anon client - for user-facing operations with RLS enforced
 * Returns null if Supabase is not configured
 */
export const supabase: SupabaseClient | null = SUPABASE_ENABLED 
    ? createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    })
    : null;

/**
 * Admin client - for backend operations, bypasses RLS
 * Returns null if Supabase is not configured
 */
export const supabaseAdmin: SupabaseClient | null = SUPABASE_ENABLED
    ? createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    })
    : null;

/**
 * Check if Supabase is available
 */
export function isSupabaseEnabled(): boolean {
    return SUPABASE_ENABLED;
}

/**
 * Helper to ensure supabaseAdmin is available
 */
function requireSupabaseAdmin(): SupabaseClient {
    if (!supabaseAdmin) {
        throw new Error('Supabase is not configured. Set SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_KEY in .env');
    }
    return supabaseAdmin;
}

// =====================================================
// ENCRYPTION UTILITIES (AES-256-GCM)
// =====================================================

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Derive encryption key from password and salt using scrypt
 */
function deriveKey(password: string, salt: string): Buffer {
    return scryptSync(password, salt, KEY_LENGTH);
}

/**
 * Encrypt sensitive data (like Billy.dk API keys)
 * @param plaintext - Data to encrypt
 * @returns Encrypted data as base64 string (format: iv:authTag:encrypted)
 */
export function encrypt(plaintext: string): string {
    try {
        const key = deriveKey(ENCRYPTION_KEY, ENCRYPTION_SALT);
        const iv = randomBytes(IV_LENGTH);
        const cipher = createCipheriv(ALGORITHM, key, iv);

        let encrypted = cipher.update(plaintext, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        const authTag = cipher.getAuthTag();

        // Format: iv:authTag:encrypted (all hex)
        return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    } catch (error) {
        log('encrypt', 'error', { error: error instanceof Error ? error.message : String(error) });
        throw new Error('Encryption failed');
    }
}

/**
 * Decrypt sensitive data
 * @param ciphertext - Encrypted data (format: iv:authTag:encrypted)
 * @returns Decrypted plaintext
 */
export function decrypt(ciphertext: string): string {
    try {
        const parts = ciphertext.split(':');
        if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) {
            throw new Error('Invalid ciphertext format');
        }

        const ivHex: string = parts[0];
        const authTagHex: string = parts[1];
        const encryptedHex: string = parts[2];

        const key = deriveKey(ENCRYPTION_KEY, ENCRYPTION_SALT);
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');

        const decipher = createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);

        const decryptedBuffer = decipher.update(encryptedHex, 'hex');
        const finalBuffer = decipher.final();
        const decrypted = Buffer.concat([decryptedBuffer, finalBuffer]).toString('utf8');

        return decrypted;
    } catch (error) {
        log('decrypt', 'error', { error: error instanceof Error ? error.message : String(error) });
        throw new Error('Decryption failed');
    }
}

// =====================================================
// ORGANIZATION OPERATIONS
// =====================================================

/**
 * Get organization by ID
 */
export async function getOrganization(organizationId: string): Promise<BillyOrganization | null> {
    try {
        const client = requireSupabaseAdmin();
        const { data, error } = await client
            .from('billy_organizations')
            .select('*')
            .eq('id', organizationId)
            .eq('is_active', true)
            .single();

        if (error) {
            log('getOrganization', 'error', { organizationId, error: error.message });
            return null;
        }

        return data as BillyOrganization;
    } catch (error) {
        log('getOrganization', 'error', { organizationId, error: error instanceof Error ? error.message : String(error) });
        return null;
    }
}

/**
 * Get organization by Billy.dk organization ID
 */
export async function getOrganizationByBillyId(billyOrgId: string): Promise<BillyOrganization | null> {
    try {
        const { data, error } = await requireSupabaseAdmin() 
            .from('billy_organizations')
            .select('*')
            .eq('billy_organization_id', billyOrgId)
            .eq('is_active', true)
            .single();

        if (error) {
            log('getOrganizationByBillyId', 'error', { billyOrgId, error: error.message });
            return null;
        }

        return data as BillyOrganization;
    } catch (error) {
        log('getOrganizationByBillyId', 'error', { billyOrgId, error: error instanceof Error ? error.message : String(error) });
        return null;
    }
}

/**
 * Create new organization
 */
export async function createOrganization(
    name: string,
    billyApiKey: string,
    billyOrgId: string,
    settings: Record<string, any> = {}
): Promise<BillyOrganization | null> {
    try {
        // Encrypt Billy.dk API key
        const encryptedKey = encrypt(billyApiKey);

        const { data, error } = await requireSupabaseAdmin() 
            .from('billy_organizations')
            .insert({
                name,
                billy_api_key: encryptedKey,
                billy_organization_id: billyOrgId,
                settings,
            })
            .select()
            .single();

        if (error) {
            log('createOrganization', 'error', { name, billyOrgId, error: error.message });
            return null;
        }

        log('createOrganization', 'success', { organizationId: data.id, name });
        return data as BillyOrganization;
    } catch (error) {
        log('createOrganization', 'error', { name, billyOrgId, error: error instanceof Error ? error.message : String(error) });
        return null;
    }
}

/**
 * Get decrypted Billy.dk API key for organization
 */
export async function getBillyApiKey(organizationId: string): Promise<string | null> {
    try {
        const org = await getOrganization(organizationId);
        if (!org) {
            return null;
        }

        return decrypt(org.billy_api_key);
    } catch (error) {
        log('getBillyApiKey', 'error', { organizationId, error: error instanceof Error ? error.message : String(error) });
        return null;
    }
}

// =====================================================
// CACHE OPERATIONS
// =====================================================

type CacheTable = 'billy_cached_invoices' | 'billy_cached_customers' | 'billy_cached_products';

/**
 * Get cached resource
 */
export async function getCachedData<T = any>(
    table: CacheTable,
    organizationId: string,
    billyId: string
): Promise<T | null> {
    try {
        const { data, error } = await requireSupabaseAdmin() 
            .from(table)
            .select('data, expires_at')
            .eq('organization_id', organizationId)
            .eq('billy_id', billyId)
            .single();

        if (error || !data) {
            return null;
        }

        // Check if expired
        const expiresAt = new Date(data.expires_at);
        if (expiresAt < new Date()) {
            // Expired - delete it
            await requireSupabaseAdmin() 
                .from(table)
                .delete()
                .eq('organization_id', organizationId)
                .eq('billy_id', billyId);

            return null;
        }

        return data.data as T;
    } catch (error) {
        log('getCachedData', 'error', { table, organizationId, billyId, error: error instanceof Error ? error.message : String(error) });
        return null;
    }
}

/**
 * Set cached resource
 */
export async function setCachedData<T = any>(
    table: CacheTable,
    organizationId: string,
    billyId: string,
    data: T,
    ttlMinutes: number = 5
): Promise<boolean> {
    try {
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + ttlMinutes);

        const { error } = await requireSupabaseAdmin() 
            .from(table)
            .upsert({
                organization_id: organizationId,
                billy_id: billyId,
                data,
                cached_at: new Date().toISOString(),
                expires_at: expiresAt.toISOString(),
            }, {
                onConflict: 'organization_id,billy_id',
            });

        if (error) {
            log('setCachedData', 'error', { table, organizationId, billyId, error: error.message });
            return false;
        }

        return true;
    } catch (error) {
        log('setCachedData', 'error', { table, organizationId, billyId, error: error instanceof Error ? error.message : String(error) });
        return false;
    }
}

/**
 * Invalidate cached resource
 */
export async function invalidateCache(
    table: CacheTable,
    organizationId: string,
    billyId: string
): Promise<boolean> {
    try {
        const { error } = await requireSupabaseAdmin() 
            .from(table)
            .delete()
            .eq('organization_id', organizationId)
            .eq('billy_id', billyId);

        if (error) {
            log('invalidateCache', 'error', { table, organizationId, billyId, error: error.message });
            return false;
        }

        return true;
    } catch (error) {
        log('invalidateCache', 'error', { table, organizationId, billyId, error: error instanceof Error ? error.message : String(error) });
        return false;
    }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<CacheStats[]> {
    try {
        const { data, error } = await requireSupabaseAdmin() 
            .from('billy_cache_stats')
            .select('*');

        if (error) {
            log('getCacheStats', 'error', { error: error.message });
            return [];
        }

        return data as CacheStats[];
    } catch (error) {
        log('getCacheStats', 'error', { error: error instanceof Error ? error.message : String(error) });
        return [];
    }
}

// =====================================================
// AUDIT LOGGING
// =====================================================

/**
 * Log audit event
 */
export async function logAuditEvent(entry: AuditLogEntry): Promise<boolean> {
    try {
        const { error } = await requireSupabaseAdmin() 
            .from('billy_audit_logs')
            .insert({
                ...entry,
                created_at: new Date().toISOString(),
            });

        if (error) {
            log('logAuditEvent', 'error', { tool: entry.tool_name, error: error.message });
            return false;
        }

        return true;
    } catch (error) {
        log('logAuditEvent', 'error', { tool: entry.tool_name, error: error instanceof Error ? error.message : String(error) });
        return false;
    }
}

// =====================================================
// USAGE METRICS
// =====================================================

/**
 * Record usage metric
 */
export async function recordUsageMetric(
    organizationId: string,
    toolName: string,
    success: boolean,
    durationMs: number,
    cacheHit: boolean = false
): Promise<boolean> {
    try {
        const now = new Date();
        const date = now.toISOString().split('T')[0];
        const hour = now.getHours();

        // Use upsert to increment counters
        const { error } = await requireSupabaseAdmin().rpc('increment_usage_metric', {
            p_organization_id: organizationId,
            p_date: date,
            p_hour: hour,
            p_tool_name: toolName,
            p_success: success,
            p_duration_ms: durationMs,
            p_cache_hit: cacheHit,
        });

        if (error) {
            // If RPC doesn't exist yet, fall back to direct insert
            const { error: insertError } = await requireSupabaseAdmin() 
                .from('billy_usage_metrics')
                .insert({
                    organization_id: organizationId,
                    date,
                    hour,
                    tool_name: toolName,
                    call_count: 1,
                    success_count: success ? 1 : 0,
                    error_count: success ? 0 : 1,
                    avg_duration_ms: durationMs,
                    cache_hit_rate: cacheHit ? 100 : 0,
                });

            if (insertError && !insertError.message.includes('duplicate')) {
                log('recordUsageMetric', 'error', { organizationId, toolName, error: insertError.message });
                return false;
            }
        }

        return true;
    } catch (error) {
        log('recordUsageMetric', 'error', { organizationId, toolName, error: error instanceof Error ? error.message : String(error) });
        return false;
    }
}

// =====================================================
// RATE LIMITING
// =====================================================

/**
 * Check and increment rate limit
 */
export async function checkRateLimit(
    organizationId: string,
    endpoint: string,
    windowMinutes: number = 60,
    maxRequests: number = 1000
): Promise<{ allowed: boolean; remaining: number }> {
    try {
        const windowStart = new Date();
        windowStart.setMinutes(Math.floor(windowStart.getMinutes() / windowMinutes) * windowMinutes);
        windowStart.setSeconds(0, 0);

        const { data, error } = await requireSupabaseAdmin().rpc('increment_billy_rate_limit', {
            org_id: organizationId,
            endpoint_path: endpoint,
            window_start_time: windowStart.toISOString(),
        });

        if (error) {
            log('checkRateLimit', 'error', { organizationId, endpoint, error: error.message });
            // On error, allow the request (fail open)
            return { allowed: true, remaining: maxRequests };
        }

        const count = data[0]?.count || 0;
        const remaining = Math.max(0, maxRequests - count);

        return {
            allowed: count <= maxRequests,
            remaining,
        };
    } catch (error) {
        log('checkRateLimit', 'error', { organizationId, endpoint, error: error instanceof Error ? error.message : String(error) });
        // On error, allow the request (fail open)
        return { allowed: true, remaining: maxRequests };
    }
}

// =====================================================
// HEALTH CHECK
// =====================================================

/**
 * Test Supabase connection
 */
export async function testConnection(): Promise<boolean> {
    try {
        const { error } = await requireSupabaseAdmin() 
            .from('billy_organizations')
            .select('id')
            .limit(1);

        if (error) {
            log('testConnection', 'error', { error: error.message });
            return false;
        }

        log('testConnection', 'success', {});
        return true;
    } catch (error) {
        log('testConnection', 'error', { error: error instanceof Error ? error.message : String(error) });
        return false;
    }
}

