import { UserInteraction, BehaviorPattern } from './AdaptiveUI';

export interface UserSession {
  userId: string;
  sessionId: string;
  startTime: number;
  lastActivity: number;
  interactions: UserInteraction[];
}

export class BehaviorTracker {
  private sessions: Map<string, UserSession>;
  private eventListeners: Map<string, (event: Event) => void>;
  private isTracking: boolean;

  constructor() {
    this.sessions = new Map();
    this.eventListeners = new Map();
    this.isTracking = false;
  }

  /**
   * Start tracking user behavior
   */
  startTracking(): void {
    if (this.isTracking) return;
    
    this.isTracking = true;
    this.setupEventListeners();
    this.startSession();
  }

  /**
   * Stop tracking user behavior
   */
  stopTracking(): void {
    if (!this.isTracking) return;
    
    this.isTracking = false;
    this.removeEventListeners();
    this.endSession();
  }

  /**
   * Get current user session
   */
  getCurrentUser(): UserSession | null {
    const currentSessionId = this.getCurrentSessionId();
    return this.sessions.get(currentSessionId) || null;
  }

  /**
   * Analyze user behavior patterns
   */
  analyzeUserPattern(session: UserSession): BehaviorPattern {
    const interactions = session.interactions;
    const timeSpent = Date.now() - session.startTime;
    
    // Calculate engagement score based on interaction frequency
    const engagementScore = this.calculateEngagementScore(interactions, timeSpent);
    
    // Calculate completion rate based on goal completion
    const completionRate = this.calculateCompletionRate(interactions);
    
    // Determine user preferences
    const preferences = this.analyzePreferences(interactions);
    
    return {
      userId: session.userId,
      sessionId: session.sessionId,
      interactions,
      timeSpent,
      completionRate,
      engagementScore,
      preferences
    };
  }

  /**
   * Track a specific user interaction
   */
  trackInteraction(interaction: UserInteraction): void {
    const currentSession = this.getCurrentUser();
    if (currentSession) {
      currentSession.interactions.push(interaction);
      currentSession.lastActivity = Date.now();
    }
  }

  /**
   * Get all tracked sessions
   */
  getAllSessions(): UserSession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Clear all tracked data
   */
  clearData(): void {
    this.sessions.clear();
  }

  /**
   * Setup event listeners for tracking
   */
  private setupEventListeners(): void {
    // Track clicks
    const clickListener = (event: Event) => {
      const target = event.target as HTMLElement;
      if (target) {
        this.trackInteraction({
          type: 'click',
          elementId: target.id || target.className || target.tagName,
          timestamp: Date.now(),
          coordinates: this.getEventCoordinates(event as MouseEvent),
          metadata: {
            tagName: target.tagName,
            className: target.className,
            textContent: target.textContent?.substring(0, 100)
          }
        });
      }
    };

    // Track hover events
    const hoverListener = (event: Event) => {
      const target = event.target as HTMLElement;
      if (target) {
        this.trackInteraction({
          type: 'hover',
          elementId: target.id || target.className || target.tagName,
          timestamp: Date.now(),
          coordinates: this.getEventCoordinates(event as MouseEvent)
        });
      }
    };

    // Track scroll events
    const scrollListener = () => {
      this.trackInteraction({
        type: 'scroll',
        elementId: 'document',
        timestamp: Date.now(),
        metadata: {
          scrollY: window.scrollY,
          scrollX: window.scrollX
        }
      });
    };

    // Track input events
    const inputListener = (event: Event) => {
      const target = event.target as HTMLInputElement;
      if (target) {
        this.trackInteraction({
          type: 'input',
          elementId: target.id || target.name || target.tagName,
          timestamp: Date.now(),
          metadata: {
            inputType: target.type,
            valueLength: target.value?.length || 0
          }
        });
      }
    };

    // Add event listeners
    document.addEventListener('click', clickListener);
    document.addEventListener('mouseover', hoverListener);
    document.addEventListener('scroll', scrollListener);
    document.addEventListener('input', inputListener);

    // Store references for removal
    this.eventListeners.set('click', clickListener);
    this.eventListeners.set('hover', hoverListener);
    this.eventListeners.set('scroll', scrollListener);
    this.eventListeners.set('input', inputListener);
  }

  /**
   * Remove all event listeners
   */
  private removeEventListeners(): void {
    this.eventListeners.forEach((listener, eventType) => {
      document.removeEventListener(eventType, listener);
    });
    this.eventListeners.clear();
  }

  /**
   * Start a new user session
   */
  private startSession(): void {
    const sessionId = this.generateSessionId();
    const userId = this.getUserId();
    
    const session: UserSession = {
      userId,
      sessionId,
      startTime: Date.now(),
      lastActivity: Date.now(),
      interactions: []
    };
    
    this.sessions.set(sessionId, session);
  }

  /**
   * End current session
   */
  private endSession(): void {
    const currentSession = this.getCurrentUser();
    if (currentSession) {
      currentSession.lastActivity = Date.now();
    }
  }

  /**
   * Get current session ID
   */
  private getCurrentSessionId(): string {
    // In a real implementation, this would get the current session ID
    // For now, return the first session ID
    const sessionIds = Array.from(this.sessions.keys());
    return sessionIds[sessionIds.length - 1] || 'default';
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get user ID (in production, this would come from authentication)
   */
  private getUserId(): string {
    // In a real implementation, this would get the authenticated user ID
    // For now, generate a random user ID
    return `user_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get event coordinates
   */
  private getEventCoordinates(event: MouseEvent): { x: number; y: number } | undefined {
    if (event.clientX !== undefined && event.clientY !== undefined) {
      return {
        x: event.clientX,
        y: event.clientY
      };
    }
    return undefined;
  }

  /**
   * Calculate engagement score based on interactions and time
   */
  private calculateEngagementScore(interactions: UserInteraction[], timeSpent: number): number {
    if (timeSpent === 0) return 0;
    
    // Base score from interaction frequency
    const interactionScore = Math.min(interactions.length / 10, 1);
    
    // Time-based score (normalized to 0-1)
    const timeScore = Math.min(timeSpent / (1000 * 60 * 5), 1); // 5 minutes max
    
    // Weighted combination
    return (interactionScore * 0.7) + (timeScore * 0.3);
  }

  /**
   * Calculate completion rate based on goal completion
   */
  private calculateCompletionRate(interactions: UserInteraction[]): number {
    // This is a simplified calculation
    // In production, you'd define specific goals and track completion
    
    const goalInteractions = interactions.filter(interaction => 
      interaction.type === 'click' && 
      (interaction.elementId.includes('submit') || 
       interaction.elementId.includes('complete') ||
       interaction.elementId.includes('finish'))
    );
    
    const totalGoals = 3; // Example: assume 3 main goals
    return Math.min(goalInteractions.length / totalGoals, 1);
  }

  /**
   * Analyze user preferences from interactions
   */
  private analyzePreferences(interactions: UserInteraction[]): BehaviorPattern['preferences'] {
    // Analyze layout preferences
    const layoutStyle = this.analyzeLayoutPreference(interactions);
    
    // Analyze color scheme preferences
    const colorScheme = this.analyzeColorPreference(interactions);
    
    // Analyze interaction style
    const interactionStyle = this.analyzeInteractionStyle(interactions);
    
    return {
      layoutStyle,
      colorScheme,
      interactionStyle
    };
  }

  /**
   * Analyze layout preference
   */
  private analyzeLayoutPreference(interactions: UserInteraction[]): 'minimal' | 'detailed' | 'compact' | 'spacious' {
    // Simple heuristic based on interaction patterns
    const avgInteractionsPerMinute = interactions.length / 5; // Assume 5 minutes
    
    if (avgInteractionsPerMinute < 2) return 'minimal';
    if (avgInteractionsPerMinute < 5) return 'detailed';
    if (avgInteractionsPerMinute < 10) return 'compact';
    return 'spacious';
  }

  /**
   * Analyze color preference
   */
  private analyzeColorPreference(interactions: UserInteraction[]): 'light' | 'dark' | 'auto' {
    // Check if user has interacted with theme toggle
    const themeInteractions = interactions.filter(interaction =>
      interaction.elementId.includes('theme') ||
      interaction.elementId.includes('dark') ||
      interaction.elementId.includes('light')
    );
    
    if (themeInteractions.length === 0) return 'auto';
    
    // Analyze the last theme interaction
    const lastThemeInteraction = themeInteractions[themeInteractions.length - 1];
    if (lastThemeInteraction.elementId.includes('dark')) return 'dark';
    if (lastThemeInteraction.elementId.includes('light')) return 'light';
    
    return 'auto';
  }

  /**
   * Analyze interaction style
   */
  private analyzeInteractionStyle(interactions: UserInteraction[]): 'direct' | 'guided' | 'exploratory' {
    // Analyze interaction patterns
    const clickInteractions = interactions.filter(i => i.type === 'click');
    const hoverInteractions = interactions.filter(i => i.type === 'hover');
    
    const clickToHoverRatio = clickInteractions.length / (hoverInteractions.length + 1);
    
    if (clickToHoverRatio > 2) return 'direct';
    if (clickToHoverRatio > 0.5) return 'guided';
    return 'exploratory';
  }
}