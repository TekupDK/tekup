import { trpc } from "@/lib/trpc";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, type RenderOptions } from "@testing-library/react";
import { httpBatchLink } from "@trpc/client";
import { ReactElement } from "react";
import superjson from "superjson";

/**
 * Custom test render function that wraps components with necessary providers
 * Uses REAL tRPC client pointing to real backend (must be running)
 */
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  // Create REAL tRPC client pointing to backend
  // Backend must be running on the URL specified (default: http://localhost:3000)
  const backendUrl = process.env.VITE_API_URL || "http://localhost:3000";
  const trpcClient = trpc.createClient({
    links: [
      httpBatchLink({
        url: `${backendUrl}/api/trpc`,
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

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </trpc.Provider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...options });
}

// Re-export everything from @testing-library/react
export * from "@testing-library/react";
export { customRender as render };
