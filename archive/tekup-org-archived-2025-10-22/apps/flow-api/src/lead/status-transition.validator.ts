import { InvalidStatusTransitionError } from '../common/domain-error.js';

// Explicit matrix for allowed transitions (MVP)
const ALLOWED: Record<string, string[]> = {
  NEW: ['CONTACTED'],
  CONTACTED: [],
};

export function validateStatusTransition(from: string, to: string) {
  if (from === to) {
    throw new InvalidStatusTransitionError(`No-op transition ${from} -> ${to}`);
  }
  const allowed = ALLOWED[from] || [];
  if (!allowed.includes(to)) {
    throw new InvalidStatusTransitionError(`Disallowed transition ${from} -> ${to}`);
  }
}

export function allowedNextStatuses(from: string) {
  return (ALLOWED[from] || []).slice();
}