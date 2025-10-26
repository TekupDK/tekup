import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';
import { DocumentationAI } from './documentation-ai.js';
import {
  UsageAnalytics,
  UserFeedback,
  ContentOptimization,
  OptimizationSuggestion,
  AIConfig,
  AnalyticsConfig,
  UserSession,
  SearchQuery,
  ContentInteraction,
  PersonalizationProfile
} from './types.js';

export interface AnalyticsConfig {
  trackingEnabled: boolean;
  anonymizeUsers: boolean;
  retentionDays: number;
  optimizationThreshold: number;
  feedbackEnabled: boolean;
  personalizationEnabled: boolean;
  storageType: 'file' | 'database' | 'memory';
  storagePath?: string;
}

export interface UserSession {
  id: string;
  userId?: string;
  startTime: Date;
  endTime?: Date;
  userAgent: string;
  referrer?: string;
  interactions: ContentInteraction[];
}

export interface ContentInteraction {
  documentId: string;
  action: 'view' | 'search' | 'feedback' | 'bookmark' | 'share' | 'copy';
  timestamp: Date;
  duration?: number;
  metadata?: Record<string, any>;
}

export interface SearchQuery {
  query: string;
  timestamp: Date;
  userId?: string;
  sessionId: string;
  results: number;
  clickedResults: string[];
}

export interface PersonalizationProfile {
  userId: string;
  role: 'developer' | 'business' | 'admin' | 'unknown';
  interests: string[];
  preferredLanguage: 'en' | 'da';
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  frequentTopics: string[];
  lastActive: Date;
}

export class AnalyticsEngine extends EventEmitter {
  private documentationAI: DocumentationAI;
  private config: AnalyticsConfig;
  private sessions: Map<string, UserSession> = new Map();
  private analytics: Map<string, UsageAnalytics> = new Map();
  private searchQueries: SearchQuery[] = [];
  private userProfiles: Map<string, PersonalizationProfile> = new Map();

  constructor(aiConfig: AIConfig, config: AnalyticsConfig) {
    super();
    this.documentationAI = new DocumentationAI(aiConfig);
    this.config = config;
    
    // Load existing data
    this.loadAnalyticsData();
    
    // Set up periodic optimization
    this.startOptimizationScheduler();
  }

  /**
   * Track user interaction with documentation
   */
  async trackInteraction(
    sessionId: string,
    documentId: string,
    action: ContentInteraction['action'],
    metadata?: Record<string, any>
  ): Promise<void> {
    if (!this.config.trackingEnabled) {
      return;
    }

    const session = this.sessions.get(sessionId);
    if (!session) {
      console.warn(`Session ${sessionId} not found`);
      return;
    }

    const interaction: ContentInteraction = {
      documentId,
      action,
      timestamp: new Date(),
      metadata
    };

    session.interactions.push(interaction);

    // Update document analytics
    await this.updateDocumentAnalytics(documentId, interaction);

    // Update user profile if personalization is enabled
    if (this.config.personalizationEnabled && session.userId) {
      await this.updateUserProfile(session.userId, interaction);
    }

    this.emit('interaction-tracked', { sessionId, interaction });
  }

  /**
   * Start a new user session
   */
  async startSession(
    sessionId: string,
    userAgent: string,
    userId?: string,
    referrer?: string
  ): Promise<void> {
    const session: UserSession = {
      id: sessionId,
      userId: this.config.anonymizeUsers ? undefined : userId,
      startTime: new Date(),
      userAgent,
      referrer,
      interactions: []
    };

    this.sessions.set(sessionId, session);
    this.emit('session-started', session);
  }

  /**
   * End a user session
   */
  async endSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return;
    }

    session.endTime = new Date();
    
    // Process session data
    await this.processSessionData(session);
    
    // Remove from active sessions
    this.sessions.delete(sessionId);
    
    this.emit('session-ended', session);
  }

  /**
   * Track search query
   */
  async trackSearch(
    sessionId: string,
    query: string,
    results: number,
    clickedResults: string[] = []
  ): Promise<void> {
    if (!this.config.trackingEnabled) {
      return;
    }

    const session = this.sessions.get(sessionId);
    const searchQuery: SearchQuery = {
      query,
      timestamp: new Date(),
      userId: session?.userId,
      sessionId,
      results,
      clickedResults
    };

    this.searchQueries.push(searchQuery);

    // Update analytics for searched documents
    for (const documentId of clickedResults) {
      const analytics = this.analytics.get(documentId);
      if (analytics) {
        analytics.searchQueries.push(query);
      }
    }

    this.emit('search-tracked', searchQuery);
  }

  /**
   * Submit user feedback
   */
  async submitFeedback(
    sessionId: string,
    documentId: string,
    rating: number,
    comment: string,
    helpful: boolean
  ): Promise<void> {
    if (!this.config.feedbackEnabled) {
      return;
    }

    const session = this.sessions.get(sessionId);
    const feedback: UserFeedback = {
      rating,
      comment,
      timestamp: new Date(),
      userId: session?.userId,
      helpful
    };

    // Update document analytics
    const analytics = this.analytics.get(documentId);
    if (analytics) {
      analytics.userFeedback.push(feedback);
    }

    // Track as interaction
    await this.trackInteraction(sessionId, documentId, 'feedback', {
      rating,
      comment,
      helpful
    });

    this.emit('feedback-submitted', { documentId, feedback });
  }

  /**
   * Get analytics for a specific document
   */
  getDocumentAnalytics(documentId: string): UsageAnalytics | undefined {
    return this.analytics.get(documentId);
  }

  /**
   * Get all analytics data
   */
  getAllAnalytics(): UsageAnalytics[] {
    return Array.from(this.analytics.values());
  }

  /**
   * Get user personalization profile
   */
  getUserProfile(userId: string): PersonalizationProfile | undefined {
    return this.userProfiles.get(userId);
  }

  /**
   * Generate content optimization recommendations
   */
  async generateOptimizations(): Promise<ContentOptimization[]> {
    const optimizations: ContentOptimization[] = [];

    for (const [documentId, analytics] of this.analytics) {
      // Only optimize documents with sufficient data
      if (analytics.views < this.config.optimizationThreshold) {
        continue;
      }

      try {
        const optimization = await this.documentationAI.optimizeContent(
          '', // Would need to load document content
          analytics
        );

        optimizations.push(optimization);
      } catch (error) {
        console.error(`Error generating optimization for ${documentId}:`, error);
      }
    }

    return optimizations;
  }

  /**
   * Get personalized recommendations for a user
   */
  async getPersonalizedRecommendations(userId: string): Promise<string[]> {
    if (!this.config.personalizationEnabled) {
      return [];
    }

    const profile = this.userProfiles.get(userId);
    if (!profile) {
      return [];
    }

    // Find documents matching user interests and skill level
    const recommendations: string[] = [];
    
    for (const [documentId, analytics] of this.analytics) {
      // Simple recommendation logic based on user profile
      const matchesInterests = profile.interests.some(interest =>
        analytics.searchQueries.some(query => 
          query.toLowerCase().includes(interest.toLowerCase())
        )
      );

      const hasGoodRating = analytics.userFeedback.length > 0 &&
        analytics.userFeedback.reduce((sum, f) => sum + f.rating, 0) / 
        analytics.userFeedback.length >= 4;

      if (matchesInterests && hasGoodRating) {
        recommendations.push(documentId);
      }
    }

    return recommendations.slice(0, 10); // Limit to top 10
  }

  /**
   * Get popular content
   */
  getPopularContent(limit: number = 10): Array<{ documentId: string; analytics: UsageAnalytics }> {
    return Array.from(this.analytics.entries())
      .sort(([, a], [, b]) => b.views - a.views)
      .slice(0, limit)
      .map(([documentId, analytics]) => ({ documentId, analytics }));
  }

  /**
   * Get trending searches
   */
  getTrendingSearches(days: number = 7): Array<{ query: string; count: number }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const searchCounts = new Map<string, number>();

    for (const search of this.searchQueries) {
      if (search.timestamp >= cutoffDate) {
        const count = searchCounts.get(search.query) || 0;
        searchCounts.set(search.query, count + 1);
      }
    }

    return Array.from(searchCounts.entries())
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
  }

  /**
   * Generate analytics report
   */
  async generateReport(startDate: Date, endDate: Date): Promise<{
    summary: {
      totalViews: number;
      uniqueUsers: number;
      totalSessions: number;
      averageSessionDuration: number;
      totalSearches: number;
      feedbackCount: number;
      averageRating: number;
    };
    topDocuments: Array<{ documentId: string; views: number }>;
    topSearches: Array<{ query: string; count: number }>;
    userEngagement: {
      bounceRate: number;
      averageTimeSpent: number;
      returnUserRate: number;
    };
  }> {
    // Calculate summary statistics
    const allAnalytics = this.getAllAnalytics();
    const totalViews = allAnalytics.reduce((sum, a) => sum + a.views, 0);
    const uniqueUsers = new Set(
      Array.from(this.sessions.values())
        .filter(s => s.userId)
        .map(s => s.userId)
    ).size;

    const totalSessions = this.sessions.size;
    const averageSessionDuration = Array.from(this.sessions.values())
      .filter(s => s.endTime)
      .reduce((sum, s) => sum + (s.endTime!.getTime() - s.startTime.getTime()), 0) / 
      totalSessions / 1000; // Convert to seconds

    const totalSearches = this.searchQueries.length;
    const allFeedback = allAnalytics.flatMap(a => a.userFeedback);
    const feedbackCount = allFeedback.length;
    const averageRating = feedbackCount > 0 ?
      allFeedback.reduce((sum, f) => sum + f.rating, 0) / feedbackCount : 0;

    // Top documents
    const topDocuments = allAnalytics
      .sort((a, b) => b.views - a.views)
      .slice(0, 10)
      .map(a => ({ documentId: a.documentId, views: a.views }));

    // Top searches
    const topSearches = this.getTrendingSearches(
      Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    ).slice(0, 10);

    // User engagement metrics
    const sessionsWithInteractions = Array.from(this.sessions.values())
      .filter(s => s.interactions.length > 0);
    
    const bounceRate = 1 - (sessionsWithInteractions.length / totalSessions);
    const averageTimeSpent = allAnalytics.reduce((sum, a) => sum + a.timeSpent, 0) / 
      allAnalytics.length;

    // Return user rate (simplified)
    const returnUserRate = 0.3; // Would need more sophisticated tracking

    return {
      summary: {
        totalViews,
        uniqueUsers,
        totalSessions,
        averageSessionDuration,
        totalSearches,
        feedbackCount,
        averageRating
      },
      topDocuments,
      topSearches,
      userEngagement: {
        bounceRate,
        averageTimeSpent,
        returnUserRate
      }
    };
  }

  /**
   * Update document analytics
   */
  private async updateDocumentAnalytics(
    documentId: string,
    interaction: ContentInteraction
  ): Promise<void> {
    let analytics = this.analytics.get(documentId);
    
    if (!analytics) {
      analytics = {
        documentId,
        views: 0,
        timeSpent: 0,
        searchQueries: [],
        userFeedback: [],
        popularSections: []
      };
      this.analytics.set(documentId, analytics);
    }

    // Update based on interaction type
    switch (interaction.action) {
      case 'view':
        analytics.views++;
        if (interaction.duration) {
          analytics.timeSpent += interaction.duration;
        }
        break;
      case 'search':
        // Search queries are tracked separately
        break;
      case 'feedback':
        // Feedback is added separately
        break;
    }

    // Update popular sections if metadata includes section info
    if (interaction.metadata?.section) {
      const section = interaction.metadata.section;
      const existingSection = analytics.popularSections.find(s => s === section);
      if (!existingSection) {
        analytics.popularSections.push(section);
      }
    }
  }

  /**
   * Update user profile based on interaction
   */
  private async updateUserProfile(
    userId: string,
    interaction: ContentInteraction
  ): Promise<void> {
    let profile = this.userProfiles.get(userId);
    
    if (!profile) {
      profile = {
        userId,
        role: 'unknown',
        interests: [],
        preferredLanguage: 'en',
        skillLevel: 'beginner',
        frequentTopics: [],
        lastActive: new Date()
      };
      this.userProfiles.set(userId, profile);
    }

    profile.lastActive = new Date();

    // Update interests based on document topics
    if (interaction.metadata?.topics) {
      const topics = Array.isArray(interaction.metadata.topics) 
        ? interaction.metadata.topics 
        : [interaction.metadata.topics];
      
      for (const topic of topics) {
        if (!profile.interests.includes(topic)) {
          profile.interests.push(topic);
        }
      }
    }

    // Update skill level based on document complexity
    if (interaction.metadata?.complexity) {
      const complexity = interaction.metadata.complexity;
      if (complexity === 'advanced' && profile.skillLevel !== 'advanced') {
        profile.skillLevel = 'intermediate';
      }
    }
  }

  /**
   * Process session data when session ends
   */
  private async processSessionData(session: UserSession): Promise<void> {
    // Calculate session metrics
    const sessionDuration = session.endTime 
      ? session.endTime.getTime() - session.startTime.getTime()
      : 0;

    // Update analytics for all documents viewed in session
    const viewedDocuments = new Set(
      session.interactions
        .filter(i => i.action === 'view')
        .map(i => i.documentId)
    );

    for (const documentId of viewedDocuments) {
      const analytics = this.analytics.get(documentId);
      if (analytics) {
        // Add session duration to time spent (distributed across viewed docs)
        analytics.timeSpent += sessionDuration / viewedDocuments.size / 1000; // Convert to seconds
      }
    }

    // Save session data if needed
    if (this.config.storageType === 'file') {
      await this.saveSessionData(session);
    }
  }

  /**
   * Start optimization scheduler
   */
  private startOptimizationScheduler(): void {
    // Run optimization every 24 hours
    setInterval(async () => {
      try {
        const optimizations = await this.generateOptimizations();
        if (optimizations.length > 0) {
          this.emit('optimizations-generated', optimizations);
        }
      } catch (error) {
        console.error('Error in optimization scheduler:', error);
      }
    }, 24 * 60 * 60 * 1000);
  }

  /**
   * Load analytics data from storage
   */
  private async loadAnalyticsData(): Promise<void> {
    if (this.config.storageType !== 'file' || !this.config.storagePath) {
      return;
    }

    try {
      const analyticsPath = path.join(this.config.storagePath, 'analytics.json');
      const data = await fs.readFile(analyticsPath, 'utf-8');
      const parsed = JSON.parse(data);

      // Load analytics
      if (parsed.analytics) {
        for (const [documentId, analytics] of Object.entries(parsed.analytics)) {
          this.analytics.set(documentId, analytics as UsageAnalytics);
        }
      }

      // Load user profiles
      if (parsed.userProfiles) {
        for (const [userId, profile] of Object.entries(parsed.userProfiles)) {
          this.userProfiles.set(userId, profile as PersonalizationProfile);
        }
      }

      // Load search queries
      if (parsed.searchQueries) {
        this.searchQueries = parsed.searchQueries.map((q: any) => ({
          ...q,
          timestamp: new Date(q.timestamp)
        }));
      }
    } catch (error) {
      console.warn('Could not load analytics data:', error);
    }
  }

  /**
   * Save analytics data to storage
   */
  async saveAnalyticsData(): Promise<void> {
    if (this.config.storageType !== 'file' || !this.config.storagePath) {
      return;
    }

    try {
      await fs.mkdir(this.config.storagePath, { recursive: true });

      const data = {
        analytics: Object.fromEntries(this.analytics),
        userProfiles: Object.fromEntries(this.userProfiles),
        searchQueries: this.searchQueries,
        lastUpdated: new Date().toISOString()
      };

      const analyticsPath = path.join(this.config.storagePath, 'analytics.json');
      await fs.writeFile(analyticsPath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error saving analytics data:', error);
    }
  }

  /**
   * Save session data
   */
  private async saveSessionData(session: UserSession): Promise<void> {
    if (!this.config.storagePath) {
      return;
    }

    try {
      const sessionsPath = path.join(this.config.storagePath, 'sessions');
      await fs.mkdir(sessionsPath, { recursive: true });

      const sessionFile = path.join(sessionsPath, `${session.id}.json`);
      await fs.writeFile(sessionFile, JSON.stringify(session, null, 2));
    } catch (error) {
      console.error('Error saving session data:', error);
    }
  }

  /**
   * Clean up old data based on retention policy
   */
  async cleanupOldData(): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);

    // Clean up old search queries
    this.searchQueries = this.searchQueries.filter(
      query => query.timestamp >= cutoffDate
    );

    // Clean up old user profiles (inactive users)
    for (const [userId, profile] of this.userProfiles) {
      if (profile.lastActive < cutoffDate) {
        this.userProfiles.delete(userId);
      }
    }

    // Save cleaned data
    await this.saveAnalyticsData();
  }
}