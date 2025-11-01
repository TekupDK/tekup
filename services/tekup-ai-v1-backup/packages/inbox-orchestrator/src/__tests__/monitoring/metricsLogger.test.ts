/**
 * Tests for Metrics Logger
 */

import {
  logMetrics,
  getAllMetrics,
  getMetricsSummary,
  clearMetrics,
  type RequestMetrics,
} from '../../monitoring/metricsLogger';

describe('Metrics Logger', () => {
  beforeEach(() => {
    clearMetrics();
  });

  describe('logMetrics', () => {
    it('should log metrics successfully', () => {
      // Suppress console.log in tests
      const originalConsoleLog = console.log;
      console.log = jest.fn();
      
      const metrics: RequestMetrics = {
        requestId: 'test-1',
        timestamp: new Date().toISOString(),
        intent: 'lead_processing',
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
        latency: 200,
        cost: 0.001,
        endpoint: '/chat',
        success: true,
      };

      expect(() => logMetrics(metrics)).not.toThrow();
      
      console.log = originalConsoleLog;
    });

    it('should limit stored metrics to maxSize', () => {
      // Log more than maxSize (1000) metrics
      for (let i = 0; i < 1100; i++) {
      // Suppress console.log in tests
      const originalConsoleLog = console.log;
      console.log = jest.fn();
      
      logMetrics({
        requestId: `test-${i}`,
        timestamp: new Date().toISOString(),
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
        latency: 200,
        cost: 0.001,
        endpoint: '/chat',
        success: true,
      });
      
      console.log = originalConsoleLog;
      }

      const allMetrics = getAllMetrics();
      expect(allMetrics.length).toBeLessThanOrEqual(1000);
    });
  });

  describe('getAllMetrics', () => {
    it('should return all logged metrics', () => {
      logMetrics({
        requestId: 'test-1',
        timestamp: new Date().toISOString(),
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
        latency: 200,
        cost: 0.001,
        endpoint: '/chat',
        success: true,
      });

      const all = getAllMetrics();
      expect(all.length).toBe(1);
      expect(all[0].requestId).toBe('test-1');
    });

    it('should return empty array initially', () => {
      const all = getAllMetrics();
      expect(all).toEqual([]);
    });
  });

  describe('getMetricsSummary', () => {
    it('should calculate summary correctly', () => {
      logMetrics({
        requestId: 'test-1',
        timestamp: new Date().toISOString(),
        intent: 'lead_processing',
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
        latency: 200,
        cost: 0.001,
        endpoint: '/chat',
        success: true,
      });

      logMetrics({
        requestId: 'test-2',
        timestamp: new Date().toISOString(),
        intent: 'booking',
        promptTokens: 200,
        completionTokens: 100,
        totalTokens: 300,
        latency: 300,
        cost: 0.002,
        endpoint: '/chat',
        success: true,
      });

      const summary = getMetricsSummary();
      expect(summary.totalRequests).toBe(2);
      expect(summary.averageTokens).toBe(225); // (150 + 300) / 2
      expect(summary.averageLatency).toBe(250); // (200 + 300) / 2
      expect(summary.totalCost).toBeCloseTo(0.003, 6);
      expect(summary.successRate).toBe(100);
      expect(summary.requestsByIntent).toHaveProperty('lead_processing', 1);
      expect(summary.requestsByIntent).toHaveProperty('booking', 1);
    });

    it('should handle empty metrics', () => {
      const summary = getMetricsSummary();
      expect(summary.totalRequests).toBe(0);
      expect(summary.averageTokens).toBe(0);
      expect(summary.successRate).toBe(0);
    });

    it('should respect time window', () => {
      // Log old metric
      logMetrics({
        requestId: 'old',
        timestamp: new Date(Date.now() - 86400000).toISOString(), // 24h ago
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
        latency: 200,
        cost: 0.001,
        endpoint: '/chat',
        success: true,
      });

      // Log recent metric
      logMetrics({
        requestId: 'recent',
        timestamp: new Date().toISOString(),
        promptTokens: 200,
        completionTokens: 100,
        totalTokens: 300,
        latency: 300,
        cost: 0.002,
        endpoint: '/chat',
        success: true,
      });

      // Summary for last hour should only include recent
      const summary = getMetricsSummary(3600000); // 1 hour
      expect(summary.totalRequests).toBe(1);
      expect(summary.averageTokens).toBe(300);
    });
  });

  describe('clearMetrics', () => {
    it('should clear all metrics', () => {
      logMetrics({
        requestId: 'test-1',
        timestamp: new Date().toISOString(),
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
        latency: 200,
        cost: 0.001,
        endpoint: '/chat',
        success: true,
      });

      expect(getAllMetrics().length).toBe(1);
      clearMetrics();
      expect(getAllMetrics().length).toBe(0);
    });
  });
});

