/**
 * RenOS Calendar Intelligence MCP - Supabase Integration
 * Database client for customer intelligence, booking validations, and pattern learning
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import config from '../config.js';
import { logger } from '../utils/logger.js';
import {
  CustomerIntelligence,
  BookingValidationLog,
  OvertimeLog,
  LearnedPattern,
  UndoAction,
} from '../types.js';

let supabase: SupabaseClient | null = null;

/**
 * Initialize Supabase client
 */
export function initSupabase(): SupabaseClient | null {
  if (supabase) return supabase;

  if (!config.supabase.isConfigured) {
    logger.warn('Supabase not configured - running without database');
    return null;
  }

  try {
    supabase = createClient(
      config.supabase.url!,
      config.supabase.serviceKey!,
      {
        auth: {
          persistSession: false,
        },
      }
    );

    logger.info('Supabase client initialized', {
      url: config.supabase.url,
    });

    return supabase;
  } catch (error) {
    logger.error('Failed to initialize Supabase client', error);
    return null;
  }
}

/**
 * Get Supabase client instance
 */
export function getSupabase(): SupabaseClient {
  if (!supabase) {
    supabase = initSupabase();
  }
  if (!supabase) {
    throw new Error('Supabase not configured');
  }
  return supabase;
}

// ==================== CUSTOMER INTELLIGENCE ====================

export async function getCustomerIntelligence(
  customerId: string
): Promise<CustomerIntelligence | null> {
  const client = getSupabase();
  
  const { data, error } = await client
    .from('customer_intelligence')
    .select('*')
    .eq('customer_id', customerId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found - return null
      return null;
    }
    logger.error('Failed to get customer intelligence', error, { customerId });
    throw error;
  }

  return data as CustomerIntelligence;
}

export async function upsertCustomerIntelligence(
  intelligence: Partial<CustomerIntelligence>
): Promise<CustomerIntelligence> {
  const client = getSupabase();
  
  const { data, error } = await client
    .from('customer_intelligence')
    .upsert(intelligence, {
      onConflict: 'customer_id',
    })
    .select()
    .single();

  if (error) {
    logger.error('Failed to upsert customer intelligence', error, { customerId: intelligence.customerId });
    throw error;
  }

  logger.info('Customer intelligence updated', {
    customerId: intelligence.customerId,
    customerName: intelligence.customerName,
  });

  return data as CustomerIntelligence;
}

export async function searchCustomersByName(
  name: string
): Promise<CustomerIntelligence[]> {
  const client = getSupabase();
  
  const { data, error } = await client
    .from('customer_intelligence')
    .select('*')
    .ilike('customer_name', `%${name}%`)
    .limit(10);

  if (error) {
    logger.error('Failed to search customers by name', error, { name });
    throw error;
  }

  return (data as CustomerIntelligence[]) || [];
}

// ==================== BOOKING VALIDATION LOGS ====================

export async function logBookingValidation(
  log: Omit<BookingValidationLog, 'id' | 'createdAt'>
): Promise<BookingValidationLog> {
  const client = getSupabase();
  
  const { data, error } = await client
    .from('booking_validations')
    .insert({
      ...log,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    logger.error('Failed to log booking validation', error, { bookingId: log.bookingId });
    throw error;
  }

  return data as BookingValidationLog;
}

export async function getValidationHistory(
  bookingId: string
): Promise<BookingValidationLog[]> {
  const client = getSupabase();
  
  const { data, error } = await client
    .from('booking_validations')
    .select('*')
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Failed to get validation history', error, { bookingId });
    throw error;
  }

  return (data as BookingValidationLog[]) || [];
}

// ==================== OVERTIME LOGS ====================

export async function createOvertimeLog(
  log: Omit<OvertimeLog, 'id' | 'createdAt'>
): Promise<OvertimeLog> {
  const client = getSupabase();
  
  const { data, error } = await client
    .from('overtime_logs')
    .insert({
      ...log,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    logger.error('Failed to create overtime log', error, { bookingId: log.bookingId });
    throw error;
  }

  logger.info('Overtime log created', {
    bookingId: log.bookingId,
    overtimeHours: log.overtimeHours,
  });

  return data as OvertimeLog;
}

export async function updateOvertimeLog(
  id: string,
  updates: Partial<OvertimeLog>
): Promise<OvertimeLog> {
  const client = getSupabase();
  
  const { data, error } = await client
    .from('overtime_logs')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    logger.error('Failed to update overtime log', error, { id });
    throw error;
  }

  return data as OvertimeLog;
}

export async function getOvertimeLog(
  bookingId: string
): Promise<OvertimeLog | null> {
  const client = getSupabase();
  
  const { data, error } = await client
    .from('overtime_logs')
    .select('*')
    .eq('booking_id', bookingId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    logger.error('Failed to get overtime log', error, { bookingId });
    throw error;
  }

  return data as OvertimeLog;
}

// ==================== LEARNED PATTERNS ====================

export async function learnPattern(
  pattern: Omit<LearnedPattern, 'id' | 'createdAt'>
): Promise<LearnedPattern> {
  const client = getSupabase();
  
  const { data, error } = await client
    .from('learned_patterns')
    .insert({
      ...pattern,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    logger.error('Failed to learn pattern', error, { 
      patternType: pattern.patternType,
      entityId: pattern.entityId,
    });
    throw error;
  }

  logger.info('Pattern learned', {
    patternType: pattern.patternType,
    entityId: pattern.entityId,
    confidence: pattern.confidence,
  });

  return data as LearnedPattern;
}

export async function getPatterns(
  patternType: LearnedPattern['patternType'],
  entityId?: string
): Promise<LearnedPattern[]> {
  const client = getSupabase();
  
  let query = client
    .from('learned_patterns')
    .select('*')
    .eq('pattern_type', patternType);

  if (entityId) {
    query = query.eq('entity_id', entityId);
  }

  const { data, error } = await query
    .order('confidence', { ascending: false })
    .order('last_observed', { ascending: false });

  if (error) {
    logger.error('Failed to get patterns', error, { patternType, entityId });
    throw error;
  }

  return (data as LearnedPattern[]) || [];
}

// ==================== UNDO ACTIONS ====================

export async function saveUndoAction(
  action: UndoAction
): Promise<void> {
  const client = getSupabase();
  
  const { error } = await client
    .from('undo_actions')
    .insert(action);

  if (error) {
    logger.error('Failed to save undo action', error, { actionId: action.id });
    throw error;
  }
}

export default {
  initSupabase,
  getSupabase,
  getCustomerIntelligence,
  upsertCustomerIntelligence,
  searchCustomersByName,
  logBookingValidation,
  getValidationHistory,
  createOvertimeLog,
  updateOvertimeLog,
  getOvertimeLog,
  learnPattern,
  getPatterns,
  saveUndoAction,
};

