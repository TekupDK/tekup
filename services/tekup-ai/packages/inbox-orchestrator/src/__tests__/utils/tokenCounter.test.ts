/**
 * Tests for Token Counter utilities
 */

import {
  estimateTokens,
  calculateTotalTokens,
  estimateCost,
  validatePromptSize,
} from '../../utils/tokenCounter';

describe('Token Counter Utilities', () => {
  describe('estimateTokens', () => {
    it('should return 0 for empty string', () => {
      expect(estimateTokens('')).toBe(0);
    });

    it('should estimate tokens correctly for short text', () => {
      // ~14 characters = ~4 tokens (3.5 chars per token)
      const text = 'Hello, Friday AI!';
      const tokens = estimateTokens(text);
      expect(tokens).toBeGreaterThan(0);
      expect(tokens).toBeLessThan(10);
    });

    it('should estimate tokens for longer text', () => {
      const text = 'A'.repeat(100);
      const tokens = estimateTokens(text);
      expect(tokens).toBe(Math.ceil(100 / 3.5));
    });

    it('should handle Danish text', () => {
      const danishText = 'Hej! Jeg er Friday AI. Jeg kan hjælpe med leads og booking.';
      const tokens = estimateTokens(danishText);
      expect(tokens).toBeGreaterThan(0);
    });
  });

  describe('calculateTotalTokens', () => {
    it('should sum prompt and completion tokens', () => {
      const prompt = 'Hello';
      const response = 'Hi there';
      const total = calculateTotalTokens(prompt, response);
      expect(total).toBe(estimateTokens(prompt) + estimateTokens(response));
    });
  });

  describe('estimateCost', () => {
    it('should calculate cost correctly', () => {
      const inputTokens = 1000;
      const outputTokens = 500;
      const cost = estimateCost(inputTokens, outputTokens);
      
      // (1000/1000) * 0.00005 + (500/1000) * 0.00015 = 0.00005 + 0.000075 = 0.000125 DKK
      expect(cost).toBeCloseTo(0.000125, 6);
    });

    it('should return 0 for zero tokens', () => {
      expect(estimateCost(0, 0)).toBe(0);
    });
  });

  describe('validatePromptSize', () => {
    it('should validate prompt within limits', () => {
      const prompt = 'Short prompt';
      const result = validatePromptSize(prompt, 4000);
      expect(result.valid).toBe(true);
      expect(result.tokens).toBeGreaterThan(0);
    });

    it('should warn when close to limit', () => {
      const prompt = 'A'.repeat(3000 * 3.5); // ~3000 tokens
      const result = validatePromptSize(prompt, 4000);
      expect(result.valid).toBe(true);
      if (result.tokens > 4000 * 0.8) {
        expect(result.warning).toBeDefined();
      }
    });

    it('should reject prompt exceeding limit', () => {
      const prompt = 'A'.repeat(5000 * 3.5); // ~5000 tokens
      const result = validatePromptSize(prompt, 4000);
      expect(result.valid).toBe(false);
      expect(result.warning).toContain('exceeds');
    });
  });
});

