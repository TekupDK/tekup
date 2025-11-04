/**
 * Idempotency Manager
 *
 * Purpose: Prevent duplicate action executions
 * - Store idempotency keys with results
 * - Check if action was already executed
 * - Return cached result if duplicate detected
 *
 * Storage: In-memory for MVP (can be Redis or DB later)
 * TTL: 24 hours (configurable)
 */

interface IdempotencyRecord {
  key: string;
  actionType: string;
  userId: number;
  result: any;
  timestamp: Date;
  expiresAt: Date;
}

// In-memory store (use Redis in production for multi-instance support)
const idempotencyStore = new Map<string, IdempotencyRecord>();

const DEFAULT_TTL_HOURS = 24;

/**
 * Generate idempotency key from action details
 */
export function generateIdempotencyKey(
  userId: number,
  actionType: string,
  conversationId: number,
  actionId: string
): string {
  return `${userId}:${actionType}:${conversationId}:${actionId}`;
}

/**
 * Check if action was already executed
 */
export function checkIdempotency(
  idempotencyKey: string
): { isDuplicate: true; result: any } | { isDuplicate: false } {
  cleanupExpired();

  const record = idempotencyStore.get(idempotencyKey);
  if (!record) {
    return { isDuplicate: false };
  }

  // Check if expired
  if (record.expiresAt < new Date()) {
    idempotencyStore.delete(idempotencyKey);
    return { isDuplicate: false };
  }

  console.log(`[Idempotency] Duplicate detected: ${idempotencyKey}`);
  return { isDuplicate: true, result: record.result };
}

/**
 * Store action result with idempotency key
 */
export function storeIdempotencyRecord(
  idempotencyKey: string,
  actionType: string,
  userId: number,
  result: any,
  ttlHours: number = DEFAULT_TTL_HOURS
): void {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlHours * 60 * 60 * 1000);

  const record: IdempotencyRecord = {
    key: idempotencyKey,
    actionType,
    userId,
    result,
    timestamp: now,
    expiresAt,
  };

  idempotencyStore.set(idempotencyKey, record);
  console.log(
    `[Idempotency] Stored: ${idempotencyKey} (expires: ${expiresAt.toISOString()})`
  );
}

/**
 * Delete specific idempotency record (for testing or manual cleanup)
 */
export function deleteIdempotencyRecord(idempotencyKey: string): boolean {
  return idempotencyStore.delete(idempotencyKey);
}

/**
 * Clean up expired records (run periodically)
 */
function cleanupExpired(): void {
  const now = new Date();
  let cleaned = 0;

  for (const [key, record] of Array.from(idempotencyStore.entries())) {
    if (record.expiresAt < now) {
      idempotencyStore.delete(key);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    console.log(`[Idempotency] Cleaned up ${cleaned} expired records`);
  }
}

/**
 * Get store stats (for monitoring)
 */
export function getIdempotencyStats(): {
  totalRecords: number;
  activeRecords: number;
  expiredRecords: number;
} {
  const now = new Date();
  let active = 0;
  let expired = 0;

  for (const record of Array.from(idempotencyStore.values())) {
    if (record.expiresAt >= now) {
      active++;
    } else {
      expired++;
    }
  }

  return {
    totalRecords: idempotencyStore.size,
    activeRecords: active,
    expiredRecords: expired,
  };
}

// Run cleanup every hour
setInterval(cleanupExpired, 60 * 60 * 1000);
