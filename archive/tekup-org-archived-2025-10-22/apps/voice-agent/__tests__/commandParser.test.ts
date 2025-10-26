import { describe, it, expect } from 'vitest';

// Placeholder: adapt when real parser util is added to shared package
// For now we simulate a minimal intent matcher.
function matchIntent(input: string): { intent: string } | null {
  const normalized = input.toLowerCase().trim();
  if (normalized.includes('vis') && normalized.includes('leads')) return { intent: 'list_leads' };
  if (normalized.startsWith('opret') && normalized.includes('lead')) return { intent: 'create_lead' };
  if (normalized.includes('skift') && normalized.includes('tenant')) return { intent: 'switch_tenant' };
  return null;
}

describe('command intent parsing (da)', () => {
  it('recognises list leads', () => {
    expect(matchIntent('Vis alle leads')).toEqual({ intent: 'list_leads' });
  });
  it('recognises create lead', () => {
    expect(matchIntent('Opret ny lead')).toEqual({ intent: 'create_lead' });
  });
  it('recognises tenant switch', () => {
    expect(matchIntent('Skift tenant til rendetalje')).toEqual({ intent: 'switch_tenant' });
  });
  it('returns null on unknown', () => {
    expect(matchIntent('hvad er vejret')).toBeNull();
  });
});
