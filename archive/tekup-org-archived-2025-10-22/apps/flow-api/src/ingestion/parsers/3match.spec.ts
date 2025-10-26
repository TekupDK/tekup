import { parse3match } from './3match.js';
import { RawEmailInput } from '../types.js';

describe('3match Parser', () => {
  it('parses 3match email with portal link', () => {
    const input: RawEmailInput = {
      mailbox: 'leads@rendetalje.dk',
      subject: 'Nyt lead fra 3match',
      from: 'no-reply@app.3match.dk',
      rawText: 'Hej Rendetalje,\n\nDu har modtaget et nyt lead gennem 3match.\n\nKlik her for at se detaljerne: https://app.3match.dk/leads/12345\n\nVenlig hilsen\n3match Team'
    };
    
    const result = parse3match(input);
    
    expect(result).toBeDefined();
    expect(result!.payload.source).toBe('3match');
    expect(result!.payload.brand).toBe('rendetalje');
    expect(result!.payload.needs_portal_fetch).toBe(true);
    expect(result!.payload.portal_url).toBe('https://app.3match.dk/leads/12345');
    expect(result!.confidence).toBeGreaterThan(0.8);
  });

  it('parses 3match email with different portal URL format', () => {
    const input: RawEmailInput = {
      mailbox: 'leads@foodtruck.dk',
      subject: 'Nyt lead fra 3match',
      from: 'no-reply@3match.dk',
      rawText: 'Du har modtaget et nyt lead!\n\nSe detaljer her: https://app.3match.dk/leads/view/67890\n\nMvh\n3match'
    };
    
    const result = parse3match(input);
    
    expect(result).toBeDefined();
    expect(result!.payload.source).toBe('3match');
    expect(result!.payload.brand).toBe('foodtruck');
    expect(result!.payload.needs_portal_fetch).toBe(true);
    expect(result!.payload.portal_url).toBe('https://app.3match.dk/leads/view/67890');
    expect(result!.confidence).toBeGreaterThan(0.8);
  });

  it('returns undefined for non-3match emails', () => {
    const input: RawEmailInput = {
      mailbox: 'leads@rendetalje.dk',
      subject: 'Random email',
      from: 'random@example.com',
      rawText: 'This is not a 3match email'
    };
    
    const result = parse3match(input);
    expect(result).toBeUndefined();
  });

  it('handles emails with multiple 3match links', () => {
    const input: RawEmailInput = {
      mailbox: 'leads@tekup.dk',
      subject: 'Multiple 3match links',
      from: 'no-reply@app.3match.dk',
      rawText: 'Check these links:\nhttps://app.3match.dk/leads/11111\nhttps://app.3match.dk/leads/22222\n\nFirst one is the correct lead.'
    };
    
    const result = parse3match(input);
    
    expect(result).toBeDefined();
    expect(result!.payload.source).toBe('3match');
    expect(result!.payload.brand).toBe('tekup');
    expect(result!.payload.needs_portal_fetch).toBe(true);
    // Should pick the first link
    expect(result!.payload.portal_url).toBe('https://app.3match.dk/leads/11111');
    expect(result!.confidence).toBeGreaterThan(0.8);
  });

  it('handles emails with no links but 3match branding', () => {
    const input: RawEmailInput = {
      mailbox: 'leads@rendetalje.dk',
      subject: 'Nyt lead fra 3match',
      from: 'support@3match.dk',
      rawText: 'Hej,\n\nDu har modtaget et nyt lead gennem 3match platformen.\n\nLog ind på portalen for at se detaljerne.\n\nVenlig hilsen\n3match Support'
    };
    
    const result = parse3match(input);
    
    expect(result).toBeDefined();
    expect(result!.payload.source).toBe('3match');
    expect(result!.payload.brand).toBe('rendetalje');
    expect(result!.payload.needs_portal_fetch).toBe(true);
    expect(result!.payload.partial).toBe(true);
    expect(result!.confidence).toBeGreaterThan(0.5);
    expect(result!.confidence).toBeLessThan(0.8);
  });
});