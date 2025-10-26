import { parseAdHelp } from './adhelp.js';
import { RawEmailInput } from '../types.js';

describe('AdHelp Parser', () => {
  it('parses basic AdHelp email with structured data', () => {
    const input: RawEmailInput = {
      mailbox: 'leads@rendetalje.dk',
      subject: 'Nyt lead fra AdHelp',
      from: 'sp@adhelp.dk',
      rawText: 'Navn: John Doe\nTelefon: +45 12 34 56 78\nE-mail: john@example.com\nAdresse: Gade 123\nPostnr: 2100\nBy: København\nType: Privat rengøring\nFrekvens: Ugentlig'
    };
    
    const result = parseAdHelp(input);
    
    expect(result).toBeDefined();
    expect(result!.payload.source).toBe('adhelp');
    expect(result!.payload.brand).toBe('rendetalje');
    expect(result!.payload.name).toBe('John Doe');
    expect(result!.payload.phone).toBe('+4512345678');
    expect(result!.payload.email).toBe('john@example.com');
    expect(result!.payload.address).toBe('Gade 123');
    expect(result!.payload.postal_code).toBe('2100');
    expect(result!.payload.city).toBe('København');
    expect(result!.payload.service_type).toBe('privat');
    expect(result!.payload.frequency).toBe('ugentlig');
    expect(result!.confidence).toBeGreaterThan(0.8);
  });

  it('parses AdHelp email with Silas Printz sender', () => {
    const input: RawEmailInput = {
      mailbox: 'leads@foodtruck.dk',
      subject: 'Catering lead',
      from: 'silas@adhelp.dk',
      rawText: 'Kunde: Silas Printz\nTlf: 4512345678\nEmail: silas@example.com\nAdresse: Vej 456\nBy: Aarhus\nService: Catering til firmafest\nAntal personer: 50\nDato: 2023-12-15'
    };
    
    const result = parseAdHelp(input);
    
    expect(result).toBeDefined();
    expect(result!.payload.source).toBe('adhelp');
    expect(result!.payload.brand).toBe('foodtruck');
    expect(result!.payload.name).toBe('Silas Printz');
    expect(result!.payload.phone).toBe('+4512345678');
    expect(result!.payload.email).toBe('silas@example.com');
    expect(result!.payload.service_type).toBe('catering');
    expect(result!.confidence).toBeGreaterThan(0.7);
  });

  it('parses AdHelp email with variable format and colon separators', () => {
    const input: RawEmailInput = {
      mailbox: 'leads@tekup.dk',
      subject: 'IT support lead',
      from: 'sp@adhelp.dk',
      rawText: 'Navn: TekUp Client\nPhone: +45 87 65 43 21\nEmail: client@tekup.dk\nService Type: IT Support\nBeskrivelse: Need help with backup system\nBemærkning: Urgent request'
    };
    
    const result = parseAdHelp(input);
    
    expect(result).toBeDefined();
    expect(result!.payload.source).toBe('adhelp');
    expect(result!.payload.brand).toBe('tekup');
    expect(result!.payload.name).toBe('TekUp Client');
    expect(result!.payload.phone).toBe('+4587654321');
    expect(result!.payload.email).toBe('client@tekup.dk');
    expect(result!.payload.service_type).toBe('erhverv');
    expect(result!.payload.notes).toContain('Urgent request');
    expect(result!.confidence).toBeGreaterThan(0.7);
  });

  it('parses AdHelp email with area extraction', () => {
    const input: RawEmailInput = {
      mailbox: 'leads@rendetalje.dk',
      subject: 'Office cleaning lead',
      from: 'sp@adhelp.dk',
      rawText: 'Customer: Office Corp\nPhone: 12345678\nEmail: office@example.com\nAddress: Business Park 1\nArea: 200 m2\nService: Office cleaning\nFrequency: Monthly'
    };
    
    const result = parseAdHelp(input);
    
    expect(result).toBeDefined();
    expect(result!.payload.source).toBe('adhelp');
    expect(result!.payload.brand).toBe('rendetalje');
    expect(result!.payload.name).toBe('Office Corp');
    expect(result!.payload.area_sqm).toBe(200);
    expect(result!.payload.service_type).toBe('erhverv');
    expect(result!.payload.frequency).toBe('månedlig');
    expect(result!.confidence).toBeGreaterThan(0.8);
  });

  it('returns undefined for non-AdHelp emails', () => {
    const input: RawEmailInput = {
      mailbox: 'leads@rendetalje.dk',
      subject: 'Random email',
      from: 'random@example.com',
      rawText: 'This is not an AdHelp email'
    };
    
    const result = parseAdHelp(input);
    expect(result).toBeUndefined();
  });

  it('handles forwarded emails with quote blocks', () => {
    const input: RawEmailInput = {
      mailbox: 'leads@rendetalje.dk',
      subject: 'Fwd: Ny kunde',
      from: 'sp@adhelp.dk',
      rawText: 'Navn: Forwarded Customer\nTelefon: +45 11 22 33 44\nEmail: fwd@example.com\n\n-- \n\nFra: Original Sender\nDato: 2023-01-01\nThis is a forwarded email'
    };
    
    const result = parseAdHelp(input);
    
    expect(result).toBeDefined();
    expect(result!.payload.source).toBe('adhelp');
    expect(result!.payload.name).toBe('Forwarded Customer');
    expect(result!.payload.phone).toBe('+4511223344');
    expect(result!.payload.email).toBe('fwd@example.com');
    expect(result!.confidence).toBeGreaterThan(0.7);
  });

  it('handles very short or unclear emails with low confidence', () => {
    const input: RawEmailInput = {
      mailbox: 'leads@rendetalje.dk',
      subject: 'Kort lead',
      from: 'sp@adhelp.dk',
      rawText: 'Ring til: 12345678'
    };
    
    const result = parseAdHelp(input);
    
    expect(result).toBeDefined();
    expect(result!.payload.source).toBe('adhelp');
    expect(result!.payload.phone).toBe('+4512345678');
    expect(result!.payload.partial).toBe(true);
    expect(result!.notes).toContain('Low confidence parsing');
    expect(result!.confidence).toBeLessThan(0.5);
  });
});