import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';
import { DocumentationAI } from './documentation-ai.js';
import {
  UserFeedback,
  AIConfig,
  FeedbackConfig,
  FeedbackSuggestion,
  ImprovementRequest,
  FeedbackAnalysis
} from './types.js';

export interface FeedbackConfig {
  enabled: boolean;
  anonymousAllowed: boolean;
  moderationEnabled: boolean;
  autoResponseEnabled: boolean;
  improvementThreshold: number;
  storagePath?: string;
}

export interface FeedbackSuggestion {
  id: string;
  documentId: string;
  type: 'content' | 'structure' | 'examples' | 'clarity' | 'accuracy';
  suggestion: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  submittedBy?: string;
  timestamp: Date;
  status: 'pending' | 'approved' | 'rejected' | 'implemented';
  votes: number;
}

export interface ImprovementRequest {
  id: string;
  documentId: string;
  title: string;
  description: string;
  category: 'missing-info' | 'outdated' | 'error' | 'enhancement' | 'translation';
  priority: 'low' | 'medium' | 'high' | 'critical';
  submittedBy?: string;
  timestamp: Date;
  status: 'open' | 'in-progress' | 'completed' | 'closed';
  assignedTo?: string;
  estimatedEffort: 'low' | 'medium' | 'high';
}

export interface FeedbackAnalysis {
  documentId: string;
  overallRating: number;
  totalFeedback: number;
  sentimentScore: number;
  commonIssues: Array<{
    issue: string;
    frequency: number;
    severity: 'low' | 'medium' | 'high';
  }>;
  improvementSuggestions: string[];
  userSatisfaction: 'low' | 'medium' | 'high';
}

export class FeedbackSystem extends EventEmitter {
  private documentationAI: DocumentationAI;
  private config: FeedbackConfig;
  private feedback: Map<string, UserFeedback[]> = new Map();
  private suggestions: Map<string, FeedbackSuggestion> = new Map();
  private improvementRequests: Map<string, ImprovementRequest> = new Map();

  constructor(aiConfig: AIConfig, config: FeedbackConfig) {
    super();
    this.documentationAI = new DocumentationAI(aiConfig);
    this.config = config;
    
    // Load existing feedback data
    this.loadFeedbackData();
  }

  /**
   * Submit user feedback for a document
   */
  async submitFeedback(
    documentId: string,
    rating: number,
    comment: string,
    helpful: boolean,
    userId?: string,
    metadata?: Record<string, any>
  ): Promise<string> {
    if (!this.config.enabled) {
      throw new Error('Feedback system is disabled');
    }

    if (!this.config.anonymousAllowed && !userId) {
      throw new Error('Anonymous feedback not allowed');
    }

    const feedback: UserFeedback = {
      rating: Math.max(1, Math.min(5, rating)), // Ensure rating is between 1-5
      comment: this.config.moderationEnabled ? await this.moderateContent(comment) : comment,
      timestamp: new Date(),
      userId,
      helpful,
      metadata
    };

    // Store feedback
    const documentFeedback = this.feedback.get(documentId) || [];
    documentFeedback.push(feedback);
    this.feedback.set(documentId, documentFeedback);

    // Generate feedback ID
    const feedbackId = `feedback-${documentId}-${Date.now()}`;

    // Analyze feedback for immediate insights
    if (rating <= 2 || comment.toLowerCase().includes('error') || comment.toLowerCase().includes('wrong')) {
      await this.handleNegativeFeedback(documentId, feedback);
    }

    // Auto-generate improvement suggestions if enabled
    if (this.config.autoResponseEnabled && comment.length > 10) {
      await this.generateImprovementSuggestions(documentId, feedback);
    }

    // Save feedback data
    await this.saveFeedbackData();

    this.emit('feedback-submitted', { documentId, feedback, feedbackId });

    return feedbackId;
  }

  /**
   * Submit improvement suggestion
   */
  async submitSuggestion(
    documentId: string,
    type: FeedbackSuggestion['type'],
    suggestion: string,
    submittedBy?: string
  ): Promise<string> {
    const suggestionId = `suggestion-${Date.now()}`;
    
    const feedbackSuggestion: FeedbackSuggestion = {
      id: suggestionId,
      documentId,
      type,
      suggestion: this.config.moderationEnabled ? await this.moderateContent(suggestion) : suggestion,
      priority: await this.calculateSuggestionPriority(suggestion),
      submittedBy,
      timestamp: new Date(),
      status: 'pending',
      votes: 0
    };

    this.suggestions.set(suggestionId, feedbackSuggestion);
    await this.saveFeedbackData();

    this.emit('suggestion-submitted', feedbackSuggestion);

    return suggestionId;
  }

  /**
   * Submit improvement request
   */
  async submitImprovementRequest(
    documentId: string,
    title: string,
    description: string,
    category: ImprovementRequest['category'],
    submittedBy?: string
  ): Promise<string> {
    const requestId = `request-${Date.now()}`;
    
    const request: ImprovementRequest = {
      id: requestId,
      documentId,
      title,
      description: this.config.moderationEnabled ? await this.moderateContent(description) : description,
      category,
      priority: await this.calculateRequestPriority(category, description),
      submittedBy,
      timestamp: new Date(),
      status: 'open',
      estimatedEffort: await this.estimateEffort(description)
    };

    this.improvementRequests.set(requestId, request);
    await this.saveFeedbackData();

    this.emit('improvement-request-submitted', request);

    return requestId;
  }

  /**
   * Vote on a suggestion
   */
  async voteOnSuggestion(suggestionId: string, vote: 'up' | 'down'): Promise<void> {
    const suggestion = this.suggestions.get(suggestionId);
    if (!suggestion) {
      throw new Error('Suggestion not found');
    }

    suggestion.votes += vote === 'up' ? 1 : -1;
    
    // Auto-approve highly voted suggestions
    if (suggestion.votes >= 5 && suggestion.status === 'pending') {
      suggestion.status = 'approved';
      this.emit('suggestion-approved', suggestion);
    }

    await this.saveFeedbackData();
    this.emit('suggestion-voted', { suggestionId, vote, newVotes: suggestion.votes });
  }

  /**
   * Get feedback for a document
   */
  getDocumentFeedback(documentId: string): UserFeedback[] {
    return this.feedback.get(documentId) || [];
  }

  /**
   * Get suggestions for a document
   */
  getDocumentSuggestions(documentId: string): FeedbackSuggestion[] {
    return Array.from(this.suggestions.values())
      .filter(s => s.documentId === documentId);
  }

  /**
   * Get improvement requests for a document
   */
  getDocumentImprovementRequests(documentId: string): ImprovementRequest[] {
    return Array.from(this.improvementRequests.values())
      .filter(r => r.documentId === documentId);
  }

  /**
   * Analyze feedback for a document
   */
  async analyzeFeedback(documentId: string): Promise<FeedbackAnalysis> {
    const documentFeedback = this.getDocumentFeedback(documentId);
    
    if (documentFeedback.length === 0) {
      return {
        documentId,
        overallRating: 0,
        totalFeedback: 0,
        sentimentScore: 0,
        commonIssues: [],
        improvementSuggestions: [],
        userSatisfaction: 'low'
      };
    }

    // Calculate overall rating
    const overallRating = documentFeedback.reduce((sum, f) => sum + f.rating, 0) / documentFeedback.length;

    // Analyze sentiment using AI
    const comments = documentFeedback.map(f => f.comment).filter(c => c.length > 0);
    const sentimentScore = await this.analyzeSentiment(comments);

    // Identify common issues
    const commonIssues = await this.identifyCommonIssues(comments);

    // Generate improvement suggestions
    const improvementSuggestions = await this.generateImprovementSuggestions(documentId, documentFeedback);

    // Determine user satisfaction
    const userSatisfaction = overallRating >= 4 ? 'high' : overallRating >= 3 ? 'medium' : 'low';

    return {
      documentId,
      overallRating,
      totalFeedback: documentFeedback.length,
      sentimentScore,
      commonIssues,
      improvementSuggestions,
      userSatisfaction
    };
  }

  /**
   * Get feedback analytics across all documents
   */
  async getFeedbackAnalytics(): Promise<{
    totalFeedback: number;
    averageRating: number;
    satisfactionDistribution: Record<string, number>;
    topIssues: Array<{ issue: string; frequency: number }>;
    improvementOpportunities: string[];
  }> {
    const allFeedback = Array.from(this.feedback.values()).flat();
    
    if (allFeedback.length === 0) {
      return {
        totalFeedback: 0,
        averageRating: 0,
        satisfactionDistribution: {},
        topIssues: [],
        improvementOpportunities: []
      };
    }

    const totalFeedback = allFeedback.length;
    const averageRating = allFeedback.reduce((sum, f) => sum + f.rating, 0) / totalFeedback;

    // Satisfaction distribution
    const satisfactionDistribution = {
      'very-satisfied': allFeedback.filter(f => f.rating === 5).length,
      'satisfied': allFeedback.filter(f => f.rating === 4).length,
      'neutral': allFeedback.filter(f => f.rating === 3).length,
      'dissatisfied': allFeedback.filter(f => f.rating === 2).length,
      'very-dissatisfied': allFeedback.filter(f => f.rating === 1).length
    };

    // Analyze all comments for common issues
    const allComments = allFeedback.map(f => f.comment).filter(c => c.length > 0);
    const topIssues = await this.identifyCommonIssues(allComments);

    // Generate improvement opportunities
    const improvementOpportunities = await this.generateGlobalImprovements(allFeedback);

    return {
      totalFeedback,
      averageRating,
      satisfactionDistribution,
      topIssues,
      improvementOpportunities
    };
  }

  /**
   * Moderate content using AI
   */
  private async moderateContent(content: string): Promise<string> {
    try {
      // Use AI to check for inappropriate content
      const prompt = `
Please review the following user feedback content and flag any inappropriate content:

Content: "${content}"

Return the content as-is if appropriate, or return a moderated version if needed.
Flag content that contains:
- Offensive language
- Personal attacks
- Spam
- Irrelevant content

Moderated content:
`;

      const moderatedContent = await this.documentationAI['generateContent'](prompt);
      return moderatedContent.trim() || content;
    } catch (error) {
      console.warn('Content moderation failed:', error);
      return content;
    }
  }

  /**
   * Calculate suggestion priority using AI
   */
  private async calculateSuggestionPriority(suggestion: string): Promise<FeedbackSuggestion['priority']> {
    try {
      const prompt = `
Analyze the following documentation improvement suggestion and determine its priority:

Suggestion: "${suggestion}"

Consider:
- Impact on user experience
- Urgency of the issue
- Effort required to implement

Return one of: low, medium, high, critical
`;

      const priority = await this.documentationAI['generateContent'](prompt);
      const normalizedPriority = priority.toLowerCase().trim();
      
      if (['low', 'medium', 'high', 'critical'].includes(normalizedPriority)) {
        return normalizedPriority as FeedbackSuggestion['priority'];
      }
      
      return 'medium'; // Default
    } catch (error) {
      console.warn('Priority calculation failed:', error);
      return 'medium';
    }
  }

  /**
   * Calculate improvement request priority
   */
  private async calculateRequestPriority(
    category: ImprovementRequest['category'],
    description: string
  ): Promise<ImprovementRequest['priority']> {
    // Simple priority mapping based on category
    const categoryPriority: Record<ImprovementRequest['category'], ImprovementRequest['priority']> = {
      'error': 'critical',
      'outdated': 'high',
      'missing-info': 'medium',
      'enhancement': 'low',
      'translation': 'medium'
    };

    let priority = categoryPriority[category];

    // Use AI to refine priority based on description
    try {
      const prompt = `
Analyze this improvement request and adjust the priority if needed:

Category: ${category}
Description: "${description}"
Current Priority: ${priority}

Should the priority be adjusted based on the description? Return: low, medium, high, or critical
`;

      const aiPriority = await this.documentationAI['generateContent'](prompt);
      const normalizedPriority = aiPriority.toLowerCase().trim();
      
      if (['low', 'medium', 'high', 'critical'].includes(normalizedPriority)) {
        priority = normalizedPriority as ImprovementRequest['priority'];
      }
    } catch (error) {
      console.warn('AI priority calculation failed:', error);
    }

    return priority;
  }

  /**
   * Estimate effort for improvement request
   */
  private async estimateEffort(description: string): Promise<ImprovementRequest['estimatedEffort']> {
    try {
      const prompt = `
Estimate the effort required to implement this documentation improvement:

Description: "${description}"

Consider:
- Complexity of the change
- Amount of content to modify
- Research required
- Testing needed

Return one of: low, medium, high
`;

      const effort = await this.documentationAI['generateContent'](prompt);
      const normalizedEffort = effort.toLowerCase().trim();
      
      if (['low', 'medium', 'high'].includes(normalizedEffort)) {
        return normalizedEffort as ImprovementRequest['estimatedEffort'];
      }
      
      return 'medium'; // Default
    } catch (error) {
      console.warn('Effort estimation failed:', error);
      return 'medium';
    }
  }

  /**
   * Handle negative feedback
   */
  private async handleNegativeFeedback(documentId: string, feedback: UserFeedback): Promise<void> {
    // Create automatic improvement request for negative feedback
    const requestId = await this.submitImprovementRequest(
      documentId,
      `Address negative feedback (Rating: ${feedback.rating})`,
      `User feedback: "${feedback.comment}"\n\nThis feedback indicates user dissatisfaction and should be addressed.`,
      'enhancement',
      'system'
    );

    this.emit('negative-feedback-detected', { documentId, feedback, requestId });
  }

  /**
   * Analyze sentiment of comments
   */
  private async analyzeSentiment(comments: string[]): Promise<number> {
    if (comments.length === 0) return 0;

    try {
      const prompt = `
Analyze the sentiment of these user comments about documentation:

Comments:
${comments.map((c, i) => `${i + 1}. "${c}"`).join('\n')}

Return a sentiment score from -1 (very negative) to 1 (very positive), with 0 being neutral.
Consider the overall tone, satisfaction level, and constructiveness of the feedback.

Sentiment score:
`;

      const sentimentText = await this.documentationAI['generateContent'](prompt);
      const sentiment = parseFloat(sentimentText.trim());
      
      return isNaN(sentiment) ? 0 : Math.max(-1, Math.min(1, sentiment));
    } catch (error) {
      console.warn('Sentiment analysis failed:', error);
      return 0;
    }
  }

  /**
   * Identify common issues from comments
   */
  private async identifyCommonIssues(comments: string[]): Promise<Array<{
    issue: string;
    frequency: number;
    severity: 'low' | 'medium' | 'high';
  }>> {
    if (comments.length === 0) return [];

    try {
      const prompt = `
Analyze these user comments and identify common issues or complaints:

Comments:
${comments.map((c, i) => `${i + 1}. "${c}"`).join('\n')}

Identify the top 5 most common issues mentioned. For each issue, provide:
1. A brief description of the issue
2. How many comments mention it (frequency)
3. Severity level (low/medium/high)

Format as JSON array:
[
  {
    "issue": "Description of issue",
    "frequency": number,
    "severity": "low|medium|high"
  }
]
`;

      const issuesText = await this.documentationAI['generateContent'](prompt);
      const issues = JSON.parse(issuesText);
      
      return Array.isArray(issues) ? issues : [];
    } catch (error) {
      console.warn('Issue identification failed:', error);
      return [];
    }
  }

  /**
   * Generate improvement suggestions based on feedback
   */
  private async generateImprovementSuggestions(
    documentId: string,
    feedback: UserFeedback | UserFeedback[]
  ): Promise<string[]> {
    const feedbackArray = Array.isArray(feedback) ? feedback : [feedback];
    const comments = feedbackArray.map(f => f.comment).filter(c => c.length > 0);
    
    if (comments.length === 0) return [];

    try {
      const prompt = `
Based on this user feedback, suggest specific improvements for the documentation:

Feedback:
${comments.map((c, i) => `${i + 1}. "${c}"`).join('\n')}

Provide 3-5 specific, actionable improvement suggestions that would address the user concerns.
Focus on practical changes that can be implemented.

Suggestions:
`;

      const suggestionsText = await this.documentationAI['generateContent'](prompt);
      
      // Parse suggestions (assuming they're in a list format)
      const suggestions = suggestionsText
        .split('\n')
        .filter(line => line.trim().length > 0)
        .map(line => line.replace(/^\d+\.\s*/, '').trim())
        .filter(suggestion => suggestion.length > 10);

      return suggestions;
    } catch (error) {
      console.warn('Improvement suggestion generation failed:', error);
      return [];
    }
  }

  /**
   * Generate global improvement opportunities
   */
  private async generateGlobalImprovements(allFeedback: UserFeedback[]): Promise<string[]> {
    const lowRatingFeedback = allFeedback.filter(f => f.rating <= 2);
    const comments = lowRatingFeedback.map(f => f.comment).filter(c => c.length > 0);
    
    if (comments.length === 0) return [];

    try {
      const prompt = `
Analyze this negative feedback across all documentation and identify system-wide improvement opportunities:

Negative Feedback:
${comments.map((c, i) => `${i + 1}. "${c}"`).join('\n')}

Identify 5 high-level improvement opportunities that would address common issues across the documentation system.
Focus on structural, process, or content strategy improvements.

Opportunities:
`;

      const opportunitiesText = await this.documentationAI['generateContent'](prompt);
      
      const opportunities = opportunitiesText
        .split('\n')
        .filter(line => line.trim().length > 0)
        .map(line => line.replace(/^\d+\.\s*/, '').trim())
        .filter(opportunity => opportunity.length > 10);

      return opportunities;
    } catch (error) {
      console.warn('Global improvement generation failed:', error);
      return [];
    }
  }

  /**
   * Load feedback data from storage
   */
  private async loadFeedbackData(): Promise<void> {
    if (!this.config.storagePath) return;

    try {
      const feedbackPath = path.join(this.config.storagePath, 'feedback.json');
      const data = await fs.readFile(feedbackPath, 'utf-8');
      const parsed = JSON.parse(data);

      // Load feedback
      if (parsed.feedback) {
        for (const [documentId, feedbackArray] of Object.entries(parsed.feedback)) {
          this.feedback.set(documentId, feedbackArray as UserFeedback[]);
        }
      }

      // Load suggestions
      if (parsed.suggestions) {
        for (const [suggestionId, suggestion] of Object.entries(parsed.suggestions)) {
          this.suggestions.set(suggestionId, suggestion as FeedbackSuggestion);
        }
      }

      // Load improvement requests
      if (parsed.improvementRequests) {
        for (const [requestId, request] of Object.entries(parsed.improvementRequests)) {
          this.improvementRequests.set(requestId, request as ImprovementRequest);
        }
      }
    } catch (error) {
      console.warn('Could not load feedback data:', error);
    }
  }

  /**
   * Save feedback data to storage
   */
  private async saveFeedbackData(): Promise<void> {
    if (!this.config.storagePath) return;

    try {
      await fs.mkdir(this.config.storagePath, { recursive: true });

      const data = {
        feedback: Object.fromEntries(this.feedback),
        suggestions: Object.fromEntries(this.suggestions),
        improvementRequests: Object.fromEntries(this.improvementRequests),
        lastUpdated: new Date().toISOString()
      };

      const feedbackPath = path.join(this.config.storagePath, 'feedback.json');
      await fs.writeFile(feedbackPath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error saving feedback data:', error);
    }
  }
}