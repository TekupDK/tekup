/**
 * Tests for Intent Detector
 */

import { detectIntent, getRelevantMemoriesForIntent } from '../../utils/intentDetector';

describe('Intent Detector', () => {
  describe('detectIntent', () => {
    it('should detect lead_processing intent', () => {
      const result = detectIntent('Hvad har vi fået af nye leads i dag?');
      expect(result.intent).toBe('lead_processing');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    it('should detect booking intent', () => {
      const result = detectIntent('Book tid til nyt lead');
      expect(result.intent).toBe('booking');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    it('should detect quote_generation intent', () => {
      const result = detectIntent('Lav et tilbud til det nye lead');
      expect(result.intent).toBe('quote_generation');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    it('should detect conflict_resolution intent', () => {
      const result = detectIntent('Kunden klager over prisen');
      expect(result.intent).toBe('conflict_resolution');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    it('should detect calendar_query intent', () => {
      const result = detectIntent('Hvad er vores opgaver i dag?');
      expect(result.intent).toBe('calendar_query');
    });

    it('should default to general for unclear intent', () => {
      const result = detectIntent('Hej hvordan går det?');
      expect(result.intent).toBe('general');
    });

    it('should extract keywords', () => {
      const result = detectIntent('Hvad har vi fået af nye leads i dag?');
      expect(result.keywords).toBeDefined();
      expect(result.keywords!.length).toBeGreaterThan(0);
    });
  });

  describe('getRelevantMemoriesForIntent', () => {
    it('should return correct memories for lead_processing', () => {
      const memories = getRelevantMemoriesForIntent('lead_processing');
      expect(memories).toContain('MEMORY_1');
      expect(memories).toContain('MEMORY_4');
      expect(memories).toContain('MEMORY_7');
    });

    it('should return correct memories for booking', () => {
      const memories = getRelevantMemoriesForIntent('booking');
      expect(memories).toContain('MEMORY_1');
      expect(memories).toContain('MEMORY_5');
    });

    it('should return correct memories for quote_generation', () => {
      const memories = getRelevantMemoriesForIntent('quote_generation');
      expect(memories).toContain('MEMORY_1');
      expect(memories).toContain('MEMORY_11');
      expect(memories).toContain('MEMORY_23');
    });

    it('should return correct memories for conflict_resolution', () => {
      const memories = getRelevantMemoriesForIntent('conflict_resolution');
      expect(memories).toContain('MEMORY_3');
      expect(memories).toContain('MEMORY_9');
    });

    it('should return minimal memories for unknown intent', () => {
      const memories = getRelevantMemoriesForIntent('unknown');
      expect(memories).toEqual(['MEMORY_1']);
    });
  });
});

