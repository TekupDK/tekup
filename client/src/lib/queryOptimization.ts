/**
 * Query Optimization Utilities
 *
 * Provides utilities for request deduplication and intelligent caching
 */

/**
 * Generate consistent cache key from query parameters
 * Used for deduplication across components
 */
export function generateQueryKey(procedure: string, input?: unknown): string {
  if (!input) {
    return procedure;
  }

  // Sort object keys for consistency
  if (typeof input === "object" && input !== null) {
    const sorted = Object.keys(input)
      .sort()
      .reduce(
        (acc, key) => {
          acc[key] = (input as any)[key];
          return acc;
        },
        {} as Record<string, unknown>
      );

    return `${procedure}:${JSON.stringify(sorted)}`;
  }

  return `${procedure}:${JSON.stringify(input)}`;
}

/**
 * Check if two queries are identical (for deduplication)
 */
export function areQueriesIdentical(
  query1: { procedure: string; input?: unknown },
  query2: { procedure: string; input?: unknown }
): boolean {
  return (
    query1.procedure === query2.procedure &&
    generateQueryKey(query1.procedure, query1.input) ===
      generateQueryKey(query2.procedure, query2.input)
  );
}

/**
 * Deduplicate queries in a batch
 * Prevents duplicate requests within the same batch window
 */
export function deduplicateQueries<
  T extends { procedure: string; input?: unknown },
>(queries: T[]): T[] {
  const seen = new Set<string>();
  const deduplicated: T[] = [];

  for (const query of queries) {
    const key = generateQueryKey(query.procedure, query.input);
    if (!seen.has(key)) {
      seen.add(key);
      deduplicated.push(query);
    }
  }

  return deduplicated;
}
