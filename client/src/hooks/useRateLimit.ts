import { TRPCClientError } from "@trpc/client";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Rate limit state interface
 */
interface RateLimitState {
  isRateLimited: boolean;
  retryAfter: Date | null;
  retryAfterMs: number | null;
}

/**
 * Hook to handle rate limiting from TRPC errors
 * Extracts retry-after information and manages rate limit state
 */
export function useRateLimit() {
  const [rateLimitState, setRateLimitState] = useState<RateLimitState>({
    isRateLimited: false,
    retryAfter: null,
    retryAfterMs: null,
  });

  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Extract retry-after timestamp from error message
   * Format: "Retry after 2025-11-02T21:05:34.392Z"
   */
  const extractRetryAfter = (error: unknown): Date | null => {
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

    // Also check error.data for structured retry-after
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
  };

  /**
   * Handle rate limit error
   */
  const handleRateLimitError = useCallback((error: unknown) => {
    const retryAfter = extractRetryAfter(error);

    if (retryAfter) {
      const now = new Date();
      const msUntilRetry = Math.max(0, retryAfter.getTime() - now.getTime());

      setRateLimitState({
        isRateLimited: true,
        retryAfter,
        retryAfterMs: msUntilRetry,
      });

      // Clear any existing timeout
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }

      // Auto-clear rate limit after retry-after time
      if (msUntilRetry > 0) {
        retryTimeoutRef.current = setTimeout(() => {
          setRateLimitState({
            isRateLimited: false,
            retryAfter: null,
            retryAfterMs: null,
          });
        }, msUntilRetry + 1000); // Add 1 second buffer
      }
    }
  }, []);

  /**
   * Check if error is a rate limit error
   */
  const isRateLimitError = (error: unknown): boolean => {
    if (!(error instanceof TRPCClientError)) return false;

    const message = (error.message || "").toLowerCase();
    return (
      message.includes("rate limit") ||
      message.includes("rate limit exceeded") ||
      message.includes("too many requests") ||
      message.includes("429") ||
      (error.data as any)?.code === "RATE_LIMIT_EXCEEDED"
    );
  };

  /**
   * Clear rate limit manually
   */
  const clearRateLimit = () => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    setRateLimitState({
      isRateLimited: false,
      retryAfter: null,
      retryAfterMs: null,
    });
  };

  /**
   * Get formatted time until retry
   */
  const getRetryAfterText = (): string | null => {
    if (!rateLimitState.retryAfter || !rateLimitState.retryAfterMs) {
      return null;
    }

    const seconds = Math.ceil(rateLimitState.retryAfterMs / 1000);

    if (seconds < 60) {
      return `${seconds} sekunder`;
    }

    const minutes = Math.ceil(seconds / 60);
    if (minutes < 60) {
      return `${minutes} ${minutes === 1 ? "minut" : "minutter"}`;
    }

    const hours = Math.ceil(minutes / 60);
    return `${hours} ${hours === 1 ? "time" : "timer"}`;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  return {
    ...rateLimitState,
    handleRateLimitError,
    isRateLimitError,
    clearRateLimit,
    getRetryAfterText,
  };
}
