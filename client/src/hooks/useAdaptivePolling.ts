import { useEffect, useRef, useState } from "react";

interface AdaptivePollingOptions {
  /**
   * Base polling interval in milliseconds
   */
  baseInterval: number;

  /**
   * Minimum interval (when user is active)
   */
  minInterval: number;

  /**
   * Maximum interval (when user is inactive)
   */
  maxInterval: number;

  /**
   * Time in ms before considering user inactive
   */
  inactivityThreshold: number;

  /**
   * Whether to pause polling when page is not visible
   */
  pauseOnHidden?: boolean;

  /**
   * Callback to execute on each poll
   */
  onPoll: () => void | Promise<void>;

  /**
   * Whether polling is enabled
   */
  enabled?: boolean;
}

/**
 * Adaptive polling hook that adjusts interval based on user activity
 *
 * Features:
 * - Faster polling when user is active
 * - Slower polling when user is inactive
 * - Pauses when page is hidden (if enabled)
 * - Respects Page Visibility API
 */
export function useAdaptivePolling({
  baseInterval,
  minInterval,
  maxInterval,
  inactivityThreshold,
  pauseOnHidden = true,
  onPoll,
  enabled = true,
}: AdaptivePollingOptions) {
  const [currentInterval, setCurrentInterval] = useState(baseInterval);
  const lastActivityRef = useRef<number>(Date.now());
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isVisibleRef = useRef<boolean>(!document.hidden);

  // Track user activity
  useEffect(() => {
    if (!enabled) return;

    const updateActivity = () => {
      lastActivityRef.current = Date.now();
      // Reset to min interval when user becomes active
      if (currentInterval > minInterval) {
        setCurrentInterval(minInterval);
      }
    };

    // Track mouse and keyboard activity
    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];
    events.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity);
      });
    };
  }, [enabled, currentInterval, minInterval]);

  // Track page visibility
  useEffect(() => {
    if (!enabled || !pauseOnHidden) return;

    const handleVisibilityChange = () => {
      isVisibleRef.current = !document.hidden;

      if (document.hidden) {
        // Pause polling when hidden
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      } else {
        // Resume polling when visible - start immediately
        lastActivityRef.current = Date.now();
        setCurrentInterval(minInterval);
        // Trigger poll immediately when page becomes visible
        onPoll();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enabled, pauseOnHidden, minInterval, onPoll]);

  // Adaptive polling logic
  useEffect(() => {
    if (!enabled) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    // Don't poll if page is hidden and pauseOnHidden is enabled
    if (pauseOnHidden && document.hidden) {
      return;
    }

    // Check if user is inactive
    const timeSinceActivity = Date.now() - lastActivityRef.current;
    const isInactive = timeSinceActivity > inactivityThreshold;

    // Adjust interval based on activity
    let nextInterval = currentInterval;
    if (isInactive && currentInterval < maxInterval) {
      // Gradually increase interval when inactive
      nextInterval = Math.min(
        currentInterval * 1.5, // Increase by 50%
        maxInterval
      );
      setCurrentInterval(nextInterval);
    } else if (!isInactive && currentInterval > minInterval) {
      // Reset to min interval when active
      nextInterval = minInterval;
      setCurrentInterval(nextInterval);
    }

    // Schedule next poll
    const scheduleNext = (interval: number) => {
      timeoutRef.current = setTimeout(async () => {
        try {
          await onPoll();
        } catch (error) {
          console.error("[AdaptivePolling] Error in poll callback:", error);
        }

        // Re-check interval before scheduling next
        const timeSinceActivity = Date.now() - lastActivityRef.current;
        const isInactive = timeSinceActivity > inactivityThreshold;

        let nextInterval = interval;
        if (isInactive && interval < maxInterval) {
          nextInterval = Math.min(interval * 1.5, maxInterval);
        } else if (!isInactive && interval > minInterval) {
          nextInterval = minInterval;
        }

        setCurrentInterval(nextInterval);
        scheduleNext(nextInterval);
      }, interval);
    };

    scheduleNext(nextInterval);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [
    enabled,
    inactivityThreshold,
    minInterval,
    maxInterval,
    pauseOnHidden,
    onPoll,
  ]); // Removed currentInterval from deps to prevent loop

  return {
    currentInterval,
    isActive: Date.now() - lastActivityRef.current < inactivityThreshold,
    isVisible: isVisibleRef.current,
  };
}
