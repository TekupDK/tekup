import { AnalyticsEngine } from '../analytics-engine.js';
import { AIConfig, AnalyticsConfig } from '../types.js';

// Mock dependencies
jest.mock('../documentation-ai.js');

describe('AnalyticsEngine', () => {
  let analyticsEngine: AnalyticsEngine;
  let mockAIConfig: AIConfig;
  let mockConfig: AnalyticsConfig;

  beforeEach(() => {
    mockAIConfig = {
      openai: {
        apiKey: 'test-key',
        model: 'gpt-4',
        maxTokens: 4000
      },
      defaultProvider: 'openai',
      translationProvider: 'openai'
    };

    mockConfig = {
      trackingEnabled: true,
      anonymizeUsers: false,
      retentionDays: 30,
      optimizationThreshold: 10,
      feedbackEnabled: true,
      personalizationEnabled: true,
      storageType: 'memory'
    };

    analyticsEngine = new AnalyticsEngine(mockAIConfig, mockConfig);
  });

  describe('session management', () => {
    it('should start a new session', async () => {
      const sessionId = 'test-session-1';
      const userAgent = 'Mozilla/5.0 Test Browser';
      const userId = 'user-123';

      await analyticsEngine.startSession(sessionId, userAgent, userId);

      // Session should be created
      expect(analyticsEngine['sessions'].has(sessionId)).toBe(true);
      
      const session = analyticsEngine['sessions'].get(sessionId);
      expect(session?.id).toBe(sessionId);
      expect(session?.userId).toBe(userId);
      expect(session?.userAgent).toBe(userAgent);
    });

    it('should end a session', async () => {
      const sessionId = 'test-session-1';
      
      // Start session first
      await analyticsEngine.startSession(sessionId, 'Test Browser');
      expect(analyticsEngine['sessions'].has(sessionId)).toBe(true);

      // End session
      await analyticsEngine.endSession(sessionId);
      expect(analyticsEngine['sessions'].has(sessionId)).toBe(false);
    });

    it('should anonymize users when configured', async () => {
      const configWithAnonymization = { ...mockConfig, anonymizeUsers: true };
      const anonymizedEngine = new AnalyticsEngine(mockAIConfig, configWithAnonymization);

      const sessionId = 'test-session-1';
      const userId = 'user-123';

      await anonymizedEngine.startSession(sessionId, 'Test Browser', userId);

      const session = anonymizedEngine['sessions'].get(sessionId);
      expect(session?.userId).toBeUndefined();
    });
  });

  describe('interaction tracking', () => {
    beforeEach(async () => {
      // Start a session for testing
      await analyticsEngine.startSession('test-session', 'Test Browser', 'user-123');
    });

    it('should track document view interaction', async () => {
      const documentId = 'doc-1';
      
      await analyticsEngine.trackInteraction('test-session', documentId, 'view', {
        duration: 30000 // 30 seconds
      });

      const analytics = analyticsEngine.getDocumentAnalytics(documentId);
      expect(analytics?.views).toBe(1);
      expect(analytics?.documentId).toBe(documentId);
    });

    it('should track multiple interactions', async () => {
      const documentId = 'doc-1';
      
      await analyticsEngine.trackInteraction('test-session', documentId, 'view');
      await analyticsEngine.trackInteraction('test-session', documentId, 'bookmark');
      await analyticsEngine.trackInteraction('test-session', documentId, 'share');

      const analytics = analyticsEngine.getDocumentAnalytics(documentId);
      expect(analytics?.views).toBe(1); // Only view interactions count towards views
      
      const session = analyticsEngine['sessions'].get('test-session');
      expect(session?.interactions).toHaveLength(3);
    });

    it('should not track when tracking is disabled', async () => {
      const disabledConfig = { ...mockConfig, trackingEnabled: false };
      const disabledEngine = new AnalyticsEngine(mockAIConfig, disabledConfig);

      await disabledEngine.startSession('test-session', 'Test Browser');
      await disabledEngine.trackInteraction('test-session', 'doc-1', 'view');

      const analytics = disabledEngine.getDocumentAnalytics('doc-1');
      expect(analytics).toBeUndefined();
    });
  });

  describe('search tracking', () => {
    beforeEach(async () => {
      await analyticsEngine.startSession('test-session', 'Test Browser', 'user-123');
    });

    it('should track search queries', async () => {
      await analyticsEngine.trackSearch('test-session', 'API documentation', 5, ['doc-1', 'doc-2']);

      const searches = analyticsEngine['searchQueries'];
      expect(searches).toHaveLength(1);
      expect(searches[0].query).toBe('API documentation');
      expect(searches[0].results).toBe(5);
      expect(searches[0].clickedResults).toEqual(['doc-1', 'doc-2']);
    });

    it('should update document analytics with search queries', async () => {
      await analyticsEngine.trackSearch('test-session', 'API guide', 3, ['doc-1']);

      const analytics = analyticsEngine.getDocumentAnalytics('doc-1');
      expect(analytics?.searchQueries).toContain('API guide');
    });
  });

  describe('feedback submission', () => {
    beforeEach(async () => {
      await analyticsEngine.startSession('test-session', 'Test Browser', 'user-123');
    });

    it('should submit feedback', async () => {
      const documentId = 'doc-1';
      
      await analyticsEngine.submitFeedback('test-session', documentId, 4, 'Great documentation!', true);

      const analytics = analyticsEngine.getDocumentAnalytics(documentId);
      expect(analytics?.userFeedback).toHaveLength(1);
      expect(analytics?.userFeedback[0].rating).toBe(4);
      expect(analytics?.userFeedback[0].comment).toBe('Great documentation!');
      expect(analytics?.userFeedback[0].helpful).toBe(true);
    });

    it('should not submit feedback when disabled', async () => {
      const disabledConfig = { ...mockConfig, feedbackEnabled: false };
      const disabledEngine = new AnalyticsEngine(mockAIConfig, disabledConfig);

      await disabledEngine.startSession('test-session', 'Test Browser');
      await disabledEngine.submitFeedback('test-session', 'doc-1', 4, 'Great!', true);

      const analytics = disabledEngine.getDocumentAnalytics('doc-1');
      expect(analytics?.userFeedback || []).toHaveLength(0);
    });
  });

  describe('analytics retrieval', () => {
    beforeEach(async () => {
      await analyticsEngine.startSession('test-session', 'Test Browser', 'user-123');
      
      // Add some test data
      await analyticsEngine.trackInteraction('test-session', 'doc-1', 'view');
      await analyticsEngine.trackInteraction('test-session', 'doc-2', 'view');
      await analyticsEngine.trackInteraction('test-session', 'doc-1', 'view');
    });

    it('should get document analytics', () => {
      const analytics = analyticsEngine.getDocumentAnalytics('doc-1');
      expect(analytics?.documentId).toBe('doc-1');
      expect(analytics?.views).toBe(2);
    });

    it('should get all analytics', () => {
      const allAnalytics = analyticsEngine.getAllAnalytics();
      expect(allAnalytics).toHaveLength(2);
      
      const doc1Analytics = allAnalytics.find(a => a.documentId === 'doc-1');
      const doc2Analytics = allAnalytics.find(a => a.documentId === 'doc-2');
      
      expect(doc1Analytics?.views).toBe(2);
      expect(doc2Analytics?.views).toBe(1);
    });

    it('should get popular content', () => {
      const popular = analyticsEngine.getPopularContent(5);
      expect(popular).toHaveLength(2);
      expect(popular[0].documentId).toBe('doc-1'); // Most viewed
      expect(popular[0].analytics.views).toBe(2);
    });
  });

  describe('trending searches', () => {
    beforeEach(async () => {
      await analyticsEngine.startSession('test-session', 'Test Browser');
      
      // Add some search data
      await analyticsEngine.trackSearch('test-session', 'API documentation', 5);
      await analyticsEngine.trackSearch('test-session', 'API documentation', 3);
      await analyticsEngine.trackSearch('test-session', 'user guide', 2);
    });

    it('should get trending searches', () => {
      const trending = analyticsEngine.getTrendingSearches(7);
      expect(trending).toHaveLength(2);
      expect(trending[0].query).toBe('API documentation');
      expect(trending[0].count).toBe(2);
      expect(trending[1].query).toBe('user guide');
      expect(trending[1].count).toBe(1);
    });
  });

  describe('personalization', () => {
    it('should update user profile when personalization is enabled', async () => {
      const userId = 'user-123';
      await analyticsEngine.startSession('test-session', 'Test Browser', userId);
      
      await analyticsEngine.trackInteraction('test-session', 'doc-1', 'view', {
        topics: ['API', 'authentication'],
        complexity: 'advanced'
      });

      const profile = analyticsEngine.getUserProfile(userId);
      expect(profile?.userId).toBe(userId);
      expect(profile?.interests).toContain('API');
      expect(profile?.interests).toContain('authentication');
    });

    it('should not update user profile when personalization is disabled', async () => {
      const disabledConfig = { ...mockConfig, personalizationEnabled: false };
      const disabledEngine = new AnalyticsEngine(mockAIConfig, disabledConfig);

      const userId = 'user-123';
      await disabledEngine.startSession('test-session', 'Test Browser', userId);
      await disabledEngine.trackInteraction('test-session', 'doc-1', 'view', {
        topics: ['API']
      });

      const profile = disabledEngine.getUserProfile(userId);
      expect(profile).toBeUndefined();
    });
  });

  describe('report generation', () => {
    beforeEach(async () => {
      // Set up test data
      await analyticsEngine.startSession('session-1', 'Browser 1', 'user-1');
      await analyticsEngine.startSession('session-2', 'Browser 2', 'user-2');
      
      await analyticsEngine.trackInteraction('session-1', 'doc-1', 'view');
      await analyticsEngine.trackInteraction('session-2', 'doc-2', 'view');
      await analyticsEngine.submitFeedback('session-1', 'doc-1', 5, 'Excellent!', true);
      await analyticsEngine.trackSearch('session-1', 'API docs', 3);
      
      await analyticsEngine.endSession('session-1');
      await analyticsEngine.endSession('session-2');
    });

    it('should generate analytics report', async () => {
      const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
      const endDate = new Date();

      const report = await analyticsEngine.generateReport(startDate, endDate);

      expect(report.summary.totalViews).toBe(2);
      expect(report.summary.uniqueUsers).toBe(2);
      expect(report.summary.totalSessions).toBe(0); // Sessions ended
      expect(report.summary.totalSearches).toBe(1);
      expect(report.summary.feedbackCount).toBe(1);
      expect(report.summary.averageRating).toBe(5);

      expect(report.topDocuments).toHaveLength(2);
      expect(report.topSearches).toHaveLength(1);
      expect(report.topSearches[0].query).toBe('API docs');
    });
  });

  describe('event emission', () => {
    it('should emit events for interactions', async () => {
      const eventSpy = jest.fn();
      analyticsEngine.on('interaction-tracked', eventSpy);

      await analyticsEngine.startSession('test-session', 'Test Browser');
      await analyticsEngine.trackInteraction('test-session', 'doc-1', 'view');

      expect(eventSpy).toHaveBeenCalledWith({
        sessionId: 'test-session',
        interaction: expect.objectContaining({
          documentId: 'doc-1',
          action: 'view'
        })
      });
    });

    it('should emit events for sessions', async () => {
      const startSpy = jest.fn();
      const endSpy = jest.fn();
      
      analyticsEngine.on('session-started', startSpy);
      analyticsEngine.on('session-ended', endSpy);

      await analyticsEngine.startSession('test-session', 'Test Browser');
      expect(startSpy).toHaveBeenCalled();

      await analyticsEngine.endSession('test-session');
      expect(endSpy).toHaveBeenCalled();
    });
  });
});