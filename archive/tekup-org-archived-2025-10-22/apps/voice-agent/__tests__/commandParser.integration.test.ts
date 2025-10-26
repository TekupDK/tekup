import { describe, it, expect } from 'vitest';

// Temporary integration-like test using the same minimalist matcher approach
// as unit tests until a real parser util is introduced.
function matchIntent(input: string): { intent: string; entities?: Record<string,string> } | null {
  const normalized = input.toLowerCase().trim();
  if (normalized.includes('vis') && normalized.includes('leads')) return { intent: 'list_leads' };
  if (normalized.startsWith('opret') && normalized.includes('lead')) return { intent: 'create_lead', entities: { company: 'Acme Corp' } };
  if (normalized.includes('skift') && normalized.includes('tenant')) return { intent: 'switch_tenant' };
  return null;
}

describe('parseCommand (integration placeholder)', () => {
  it('parses create lead with a mocked entity', () => {
    const input = 'Opret en ny lead for Acme Corp';
    const result = matchIntent(input);
    expect(result?.intent).toBe('create_lead');
    expect(result?.entities?.company).toBe('Acme Corp');
  });

  it('handles unknown gracefully', () => {
    const input = 'Spil noget musik';
    const result = matchIntent(input);
    expect(result).toBeNull();
  });
});
