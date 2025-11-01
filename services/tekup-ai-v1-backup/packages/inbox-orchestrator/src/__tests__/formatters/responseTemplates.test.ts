/**
 * Tests for Response Templates
 */

import {
  formatLeadSummary,
  formatBookingConfirmation,
  formatQuote,
  formatCalendarTasks,
  formatAvailableSlots,
  formatNextSteps,
} from '../../formatters/responseTemplates';
import type { Lead } from '../../leadParser';

describe('Response Templates', () => {
  describe('formatLeadSummary', () => {
    it('should format empty leads list', () => {
      const result = formatLeadSummary([]);
      expect(result).toBe('Ingen nye leads.');
    });

    it('should format single lead', () => {
      const leads: Lead[] = [
        {
          name: 'John Doe',
          type: 'Fast',
          bolig: { sqm: 80, type: 'Lejlighed', rooms: 3 },
          contact: { email: 'john@example.com' },
          priceEstimate: { formatted: '698-1047kr' },
          source: 'Rengøring.nu',
          status: 'Needs Reply',
        } as Lead,
      ];
      const result = formatLeadSummary(leads);
      expect(result).toContain('John Doe');
      expect(result).toContain('80m²');
      expect(result).toContain('698-1047kr');
    });

    it('should limit to 10 leads', () => {
      const leads: Lead[] = Array.from({ length: 15 }, (_, i) => ({
        name: `Lead ${i}`,
        type: 'Fast',
        bolig: { sqm: 100 },
        contact: {},
        source: 'Rengøring.nu',
        status: 'Needs Reply',
      } as Lead));
      const result = formatLeadSummary(leads);
      // Should only show 10 leads
      const lines = result.split('\n').filter(line => line.includes('Lead'));
      expect(lines.length).toBeLessThanOrEqual(10);
    });
  });

  describe('formatBookingConfirmation', () => {
    it('should format booking confirmation', () => {
      const result = formatBookingConfirmation({
        date: '2025-11-05',
        time: '10:00',
        customerName: 'John Doe',
        serviceType: 'Flytterengøring',
      });
      expect(result).toContain('✓ Booking');
      expect(result).toContain('2025-11-05');
      expect(result).toContain('10:00');
      expect(result).toContain('John Doe');
    });
  });

  describe('formatQuote', () => {
    it('should format quote with all fields', () => {
      const result = formatQuote({
        customerName: 'John Doe',
        serviceType: 'Fast rengøring',
        sqm: 150,
        workers: 2,
        hours: 5,
        price: '3490kr',
      });
      expect(result).toContain('John Doe');
      expect(result).toContain('150m²');
      expect(result).toContain('2 pers');
      expect(result).toContain('5t');
      expect(result).toContain('3490kr');
    });

    it('should include available dates if provided', () => {
      const result = formatQuote({
        customerName: 'John Doe',
        serviceType: 'Fast',
        sqm: 100,
        workers: 1,
        hours: 3,
        price: '1047kr',
        availableDates: ['2025-11-05', '2025-11-06', '2025-11-07'],
      });
      expect(result).toContain('Ledige tider');
      expect(result).toContain('2025-11-05');
    });
  });

  describe('formatCalendarTasks', () => {
    it('should format empty events list', () => {
      const result = formatCalendarTasks([]);
      expect(result).toBe('Ingen opgaver planlagt.');
    });

    it('should format single event', () => {
      const events = [
        {
          summary: 'Rengøring',
          start: '2025-11-05T10:00:00',
          end: '2025-11-05T14:00:00',
          location: 'Ahornvej 1',
        },
      ];
      const result = formatCalendarTasks(events);
      expect(result).toContain('Rengøring');
      expect(result).toContain('Ahornvej 1');
    });
  });

  describe('formatAvailableSlots', () => {
    it('should format empty slots', () => {
      const result = formatAvailableSlots([]);
      expect(result).toContain('Alle tider er ledige');
    });

    it('should format occupied slots', () => {
      const slots = [
        {
          start: '2025-11-05T10:00:00',
          end: '2025-11-05T14:00:00',
          summary: 'Optaget',
        },
      ];
      const result = formatAvailableSlots(slots);
      expect(result).toContain('Optagne tider');
      expect(result).toContain('Optaget');
    });
  });

  describe('formatNextSteps', () => {
    it('should format empty steps', () => {
      const result = formatNextSteps([]);
      expect(result).toBe('Ingen aktuelle action items.');
    });

    it('should format steps with numbering', () => {
      const steps = ['Ring til kunde', 'Send tilbud', 'Følg op'];
      const result = formatNextSteps(steps);
      expect(result).toContain('Næste skridt');
      expect(result).toContain('Ring til kunde');
      expect(result).toContain('Send tilbud');
    });
  });
});

