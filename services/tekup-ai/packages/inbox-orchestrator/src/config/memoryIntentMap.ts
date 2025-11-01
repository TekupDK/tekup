/**
 * Memory to Intent Mapping Configuration
 *
 * Maps each intent to required memories and their priority.
 * This enables selective memory injection to reduce token usage.
 */

export interface MemoryConfig {
  memoryId: string;
  priority: "critical" | "important" | "nice-to-have";
  description: string; // Short description for selective injection
  tokenEstimate: number; // Approximate tokens this memory adds
}

export const MEMORY_DEFINITIONS: Record<string, MemoryConfig> = {
  MEMORY_1: {
    memoryId: "MEMORY_1",
    priority: "critical",
    description: "Time check - validate dates/times before operations",
    tokenEstimate: 45,
  },
  MEMORY_4: {
    memoryId: "MEMORY_4",
    priority: "critical",
    description: "Lead source rules - reply strategy per source",
    tokenEstimate: 65,
  },
  MEMORY_5: {
    memoryId: "MEMORY_5",
    priority: "critical",
    description: "Calendar check before suggesting bookings",
    tokenEstimate: 55,
  },
  MEMORY_7: {
    memoryId: "MEMORY_7",
    priority: "critical",
    description: "Email search first - avoid double quotes",
    tokenEstimate: 60,
  },
  MEMORY_8: {
    memoryId: "MEMORY_8",
    priority: "critical",
    description: "Overtime communication - +1h rule, not +3-5h",
    tokenEstimate: 70,
  },
  MEMORY_11: {
    memoryId: "MEMORY_11",
    priority: "critical",
    description: "Quote format - must include all required fields",
    tokenEstimate: 85,
  },
  MEMORY_23: {
    memoryId: "MEMORY_23",
    priority: "critical",
    description: "Price calculation - 349 kr/t based on m²",
    tokenEstimate: 50,
  },
  MEMORY_3: {
    memoryId: "MEMORY_3",
    priority: "important",
    description: "Customer service approach - honest, direct",
    tokenEstimate: 75,
  },
  MEMORY_9: {
    memoryId: "MEMORY_9",
    priority: "important",
    description: "Conflict resolution - acknowledge quickly",
    tokenEstimate: 80,
  },
  MEMORY_10: {
    memoryId: "MEMORY_10",
    priority: "important",
    description: "Lead follow-up - 7-10 days after quote",
    tokenEstimate: 70,
  },
  MEMORY_6: {
    memoryId: "MEMORY_6",
    priority: "nice-to-have",
    description: "Calendar systematization - mail + invoices → calendar",
    tokenEstimate: 90,
  },
  // Add remaining memories as needed (MEMORY_2, 12-24)
};

/**
 * Get memory configs for an intent (sorted by priority)
 */
export function getMemoryConfigsForIntent(_intent: string): MemoryConfig[] {
  // This will be populated by intent detector integration
  // For now, return critical memories
  return Object.values(MEMORY_DEFINITIONS).filter(
    (m) => m.priority === "critical"
  );
}

/**
 * Get token estimate for a set of memories
 */
export function estimateMemoryTokens(memoryIds: string[]): number {
  return memoryIds.reduce((sum, id) => {
    const config = MEMORY_DEFINITIONS[id];
    return sum + (config?.tokenEstimate || 0);
  }, 0);
}
