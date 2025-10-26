import { runParsers } from './parser.js';
import { RawEmailInput } from './types.js';

describe('runParsers', () => {
  it('parses leadpoint style email', () => {
    const input: RawEmailInput = {
      mailbox: 'leads@rendetalje.dk',
      subject: 'Nyt rengøringslead',
      from: 'notify@leadpoint.io',
      rawText: 'Navn: Test Person\nTelefon: +4511223344\nE-mail: test@example.com\nAdresse: Gade 1\nOpgave: Kontorrengøring 120 m2'
    };
    const r = runParsers(input)!;
    expect(r).toBeTruthy();
    expect(r.payload.source).toBe('leadpoint');
    expect(r.payload.email).toBe('test@example.com');
    expect(r.confidence).toBeGreaterThan(0);
    expect(r.confidence).toBeLessThanOrEqual(1);
  });

  it('parses leadmail style email', () => {
    const input: RawEmailInput = {
      mailbox: 'leads@rendetalje.dk',
      subject: 'Rengøring.nu forespørgsel',
      from: 'kontakt@leadmail.no',
      rawText: 'Navn: Firma A\nTelefon: 12345678\nE-mail: firma@example.com\nAdresse: Vej 2\nPostnr: 2100\nBy: København'
    };
    const r = runParsers(input)!;
    expect(r.payload.source).toBe('leadmail');
    expect(r.payload.postal_code).toBe('2100');
  });

  it('returns undefined for unrelated email', () => {
    const input: RawEmailInput = {
      mailbox: 'support@rendetalje.dk',
      subject: 'Question',
      from: 'user@example.com',
      rawText: 'Hello just saying hi'
    };
    const r = runParsers(input);
    expect(r).toBeUndefined();
  });
});