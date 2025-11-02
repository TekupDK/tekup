import { TRPCClientError } from "@trpc/client";

/**
 * Exponential backoff with jitter for retry delays
 * Reduces thundering herd problem by randomizing retry times
 */
export function exponentialBackoffWithJitter(attemptIndex: number): number {
  const baseDelay = 1000; // 1 second
  const maxDelay = 30000; // 30 seconds
  const exponentialDelay = Math.min(baseDelay * 2 ** attemptIndex, maxDelay);

  // Add jitter: random value between 0 and 50% of delay
  const jitter = Math.random() * exponentialDelay * 0.5;

  return exponentialDelay + jitter;
}

/**
 * Calculate delay until retry-after timestamp
 */
export function calculateRetryAfterDelay(retryAfter: Date | null): number {
  if (!retryAfter) return exponentialBackoffWithJitter(0);

  const now = new Date();
  const msUntilRetry = Math.max(0, retryAfter.getTime() - now.getTime());

  // If retry-after is in the past, use small delay with jitter
  if (msUntilRetry === 0) {
    return 1000 + Math.random() * 2000; // 1-3 seconds
  }

  return msUntilRetry + Math.random() * 1000; // Add small jitter to avoid burst
}

/**
 * Check if error is a rate limit error
 */
export function isRateLimitError(error: unknown): boolean {
  if (!(error instanceof TRPCClientError)) return false;

  const message = (error.message || "").toLowerCase();
  return (
    message.includes("rate limit") ||
    message.includes("rate limit exceeded") ||
    message.includes("too many requests") ||
    message.includes("429") ||
    (error.data as any)?.code === "RATE_LIMIT_EXCEEDED"
  );
}

/**
 * Extract retry-after timestamp from error
 */
export function extractRetryAfter(error: unknown): Date | null {
  if (!(error instanceof TRPCClientError)) return null;

  const message = error.message || "";
  const retryAfterMatch = message.match(/retry after ([^,]+)/i);

  if (retryAfterMatch) {
    try {
      const timestamp = new Date(retryAfterMatch[1].trim());
      if (!isNaN(timestamp.getTime())) {
        return timestamp;
      }
    } catch {
      // Invalid date, ignore
    }
  }

  // Also check error.data
  const retryAfter = (error.data as any)?.retryAfter;
  if (retryAfter) {
    try {
      const timestamp = new Date(retryAfter);
      if (!isNaN(timestamp.getTime())) {
        return timestamp;
      }
    } catch {
      // Invalid date, ignore
    }
  }

  return null;
}

/**
 * Intelligent retry delay function for React Query
 * Handles rate limits, exponential backoff, and jitter
 */
export function intelligentRetryDelay(
  attemptIndex: number,
  error: unknown
): number {
  // For rate limit errors, use retry-after if available
  if (isRateLimitError(error)) {
    const retryAfter = extractRetryAfter(error);
    if (retryAfter) {
      return calculateRetryAfterDelay(retryAfter);
    }
    // If no retry-after, use longer exponential backoff
    return exponentialBackoffWithJitter(attemptIndex) * 2;
  }

  // For other errors, use exponential backoff with jitter
  return exponentialBackoffWithJitter(attemptIndex);
}

/**
 * Determine if request should retry based on error type
 */
export function shouldRetry(attemptIndex: number, error: unknown): boolean {
  // Don't retry rate limit errors after first attempt
  if (isRateLimitError(error) && attemptIndex > 0) {
    return false;
  }

  // Max 3 attempts for other errors
  return attemptIndex < 3;
}
