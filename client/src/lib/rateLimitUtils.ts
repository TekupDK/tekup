/**
 * Throttle utility to limit function calls
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCall;

    if (timeSinceLastCall >= delay) {
      lastCall = now;
      func(...args);
    } else {
      // Schedule call for after delay period
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      const remainingTime = delay - timeSinceLastCall;
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        func(...args);
      }, remainingTime);
    }
  };
}

/**
 * Debounce utility to delay function calls until after inactivity
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
}

/**
 * Check if we should block API requests due to rate limiting
 * Returns true if request should be blocked
 */
export function shouldBlockRequest(
  isRateLimited: boolean,
  retryAfter: Date | null
): boolean {
  if (!isRateLimited) return false;
  if (!retryAfter) return false;

  const now = new Date();
  return now < retryAfter;
}

/**
 * Get milliseconds until retry
 */
export function getMsUntilRetry(retryAfter: Date | null): number {
  if (!retryAfter) return 0;
  const now = new Date();
  return Math.max(0, retryAfter.getTime() - now.getTime());
}
