import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from "@shared/const";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { getLoginUrl } from "./const";
import "./index.css";
import { requestQueue } from "./lib/requestQueue";
import { intelligentRetryDelay, shouldRetry } from "./lib/retryStrategy";

// Optimized QueryClient for better performance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Intelligent caching: Different staleTime based on data type
      // Can be overridden per-query for emails (30-60s), labels (5min), etc.
      staleTime: 60 * 1000, // 1 minute default (opdateret fra 30s)
      // Keep unused data for 15 minutes (opdateret fra 5 minutter)
      gcTime: 15 * 60 * 1000,
      // Enable structural sharing for better cache hit rates
      structuralSharing: true,
      // Don't refetch on window focus for better performance
      refetchOnWindowFocus: false,
      // Don't refetch on reconnect immediately
      refetchOnReconnect: false,
      // Intelligent retry with exponential backoff and jitter
      retry: shouldRetry,
      // Custom retry delay with rate limit handling and jitter
      retryDelay: intelligentRetryDelay,
    },
    mutations: {
      // Retry failed mutations with intelligent strategy
      retry: shouldRetry,
      retryDelay: intelligentRetryDelay,
    },
  },
});

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  window.location.href = getLoginUrl();
};

// Store rate limit state globally
let globalRateLimitState: {
  isRateLimited: boolean;
  retryAfter: Date | null;
} = {
  isRateLimited: false,
  retryAfter: null,
};

/**
 * Extract retry-after from error message
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
};

/**
 * Check if error is rate limit error
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

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);

    // Handle rate limit errors
    if (isRateLimitError(error)) {
      const retryAfter = extractRetryAfter(error);
      if (retryAfter) {
        globalRateLimitState = {
          isRateLimited: true,
          retryAfter,
        };
        // Update request queue with rate limit
        requestQueue.setRateLimitUntil(retryAfter);
        console.warn("[Rate Limit]", {
          retryAfter: retryAfter.toISOString(),
          message: error.message,
          queueSize: requestQueue.getQueueSize(),
        });
      }
    }

    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);

    // Handle rate limit errors
    if (isRateLimitError(error)) {
      const retryAfter = extractRetryAfter(error);
      if (retryAfter) {
        globalRateLimitState = {
          isRateLimited: true,
          retryAfter,
        };
        // Update request queue with rate limit
        requestQueue.setRateLimitUntil(retryAfter);
        console.warn("[Rate Limit]", {
          retryAfter: retryAfter.toISOString(),
          message: error.message,
          queueSize: requestQueue.getQueueSize(),
        });
      }
    }

    console.error("[API Mutation Error]", error);
  }
});

// Auto-clear rate limit when retry-after time passes
setInterval(() => {
  if (globalRateLimitState.isRateLimited && globalRateLimitState.retryAfter) {
    const now = new Date();
    if (now >= globalRateLimitState.retryAfter) {
      globalRateLimitState = {
        isRateLimited: false,
        retryAfter: null,
      };
      // Clear request queue rate limit
      requestQueue.clearRateLimit();
    }
  }
}, 1000); // Check every second

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);
