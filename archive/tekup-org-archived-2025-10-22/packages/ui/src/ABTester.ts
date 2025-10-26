import { UILayout, PerformanceMetrics } from './AdaptiveUI';

export interface ABTestResult {
  variationId: string;
  layout: UILayout;
  metrics: PerformanceMetrics;
  userCount: number;
  conversionRate: number;
  confidence: number;
  winner: boolean;
}

export interface TestConfig {
  testDuration: number; // in milliseconds
  minUsers: number;
  confidenceLevel: number;
  metrics: string[];
}

export class ABTester {
  private activeTests: Map<string, ABTest>;
  private testResults: Map<string, ABTestResult[]>;
  private defaultConfig: TestConfig;

  constructor() {
    this.activeTests = new Map();
    this.testResults = new Map();
    this.defaultConfig = {
      testDuration: 1000 * 60 * 60 * 24, // 24 hours
      minUsers: 100,
      confidenceLevel: 0.95,
      metrics: ['conversionRate', 'userSatisfaction', 'renderTime']
    };
  }

  /**
   * Run A/B tests on layout variations
   */
  runTests(variations: UILayout[]): ABTestResult[] {
    const results: ABTestResult[] = [];
    
    variations.forEach(variation => {
      const test = this.createTest(variation);
      const result = this.runSingleTest(test);
      results.push(result);
    });
    
    // Determine winner
    const winner = this.determineWinner(results);
    if (winner) {
      winner.winner = true;
    }
    
    return results;
  }

  /**
   * Start a new A/B test
   */
  startTest(variations: UILayout[], config?: Partial<TestConfig>): string {
    const testId = `test_${Date.now()}`;
    const testConfig = { ...this.defaultConfig, ...config };
    
    const test: ABTest = {
      id: testId,
      variations: variations.map(v => ({ ...v, id: `${v.id}_test` })),
      config: testConfig,
      startTime: Date.now(),
      endTime: Date.now() + testConfig.testDuration,
      status: 'running',
      participants: new Map(),
      metrics: new Map()
    };
    
    this.activeTests.set(testId, test);
    
    // Start automatic testing
    this.runAutomaticTest(test);
    
    return testId;
  }

  /**
   * Stop an active test
   */
  stopTest(testId: string): ABTestResult[] | null {
    const test = this.activeTests.get(testId);
    if (!test) return null;
    
    test.status = 'stopped';
    test.endTime = Date.now();
    
    const results = this.generateTestResults(test);
    this.testResults.set(testId, results);
    
    return results;
  }

  /**
   * Get test results
   */
  getTestResults(testId: string): ABTestResult[] | null {
    return this.testResults.get(testId) || null;
  }

  /**
   * Get all active tests
   */
  getActiveTests(): ABTest[] {
    return Array.from(this.activeTests.values());
  }

  /**
   * Get test status
   */
  getTestStatus(testId: string): string | null {
    const test = this.activeTests.get(testId);
    return test ? test.status : null;
  }

  /**
   * Create a test instance
   */
  private createTest(variation: UILayout): ABTest {
    const testId = `single_test_${Date.now()}`;
    
    return {
      id: testId,
      variations: [variation],
      config: this.defaultConfig,
      startTime: Date.now(),
      endTime: Date.now() + this.defaultConfig.testDuration,
      status: 'running',
      participants: new Map(),
      metrics: new Map()
    };
  }

  /**
   * Run a single test
   */
  private runSingleTest(test: ABTest): ABTestResult {
    // Simulate test results
    const variation = test.variations[0];
    const metrics = this.simulateMetrics(variation);
    const userCount = Math.floor(Math.random() * 100) + 50;
    const conversionRate = Math.random() * 0.3 + 0.1;
    const confidence = Math.random() * 0.3 + 0.7;
    
    return {
      variationId: variation.id,
      layout: variation,
      metrics,
      userCount,
      conversionRate,
      confidence,
      winner: false
    };
  }

  /**
   * Run automatic test with real-time metrics
   */
  private runAutomaticTest(test: ABTest): void {
    const interval = setInterval(() => {
      if (test.status !== 'running') {
        clearInterval(interval);
        return;
      }
      
      // Simulate new participants
      this.simulateParticipants(test);
      
      // Collect metrics
      this.collectMetrics(test);
      
      // Check if test should end
      if (this.shouldEndTest(test)) {
        this.endAutomaticTest(test);
        clearInterval(interval);
      }
    }, 1000 * 60 * 5); // Check every 5 minutes
  }

  /**
   * Simulate participants joining the test
   */
  private simulateParticipants(test: ABTest): void {
    const newParticipants = Math.floor(Math.random() * 10) + 1;
    
    for (let i = 0; i < newParticipants; i++) {
      const participantId = `user_${Date.now()}_${i}`;
      const variationIndex = Math.floor(Math.random() * test.variations.length);
      
      test.participants.set(participantId, {
        id: participantId,
        variationIndex,
        joinTime: Date.now(),
        interactions: []
      });
    }
  }

  /**
   * Collect metrics from participants
   */
  private collectMetrics(test: ABTest): void {
    test.participants.forEach((participant, participantId) => {
      const variation = test.variations[participant.variationIndex];
      const metrics = this.simulateMetrics(variation);
      
      test.metrics.set(participantId, {
        participantId,
        variationId: variation.id,
        metrics,
        timestamp: Date.now()
      });
    });
  }

  /**
   * Check if test should end
   */
  private shouldEndTest(test: ABTest): boolean {
    const now = Date.now();
    const timeElapsed = now - test.startTime;
    const participantCount = test.participants.size;
    
    // End if time limit reached or minimum users reached
    return timeElapsed >= test.config.testDuration || participantCount >= test.config.minUsers;
  }

  /**
   * End automatic test
   */
  private endAutomaticTest(test: ABTest): void {
    test.status = 'completed';
    test.endTime = Date.now();
    
    const results = this.generateTestResults(test);
    this.testResults.set(test.id, results);
  }

  /**
   * Generate test results from collected data
   */
  private generateTestResults(test: ABTest): ABTestResult[] {
    const results: ABTestResult[] = [];
    
    test.variations.forEach((variation, variationIndex) => {
      const variationParticipants = Array.from(test.participants.values())
        .filter(p => p.variationIndex === variationIndex);
      
      const variationMetrics = Array.from(test.metrics.values())
        .filter(m => m.variationId === variation.id);
      
      if (variationParticipants.length === 0) return;
      
      const metrics = this.aggregateMetrics(variationMetrics.map(m => m.metrics));
      const conversionRate = this.calculateConversionRate(variationParticipants);
      const confidence = this.calculateConfidence(variationParticipants.length, conversionRate);
      
      results.push({
        variationId: variation.id,
        layout: variation,
        metrics,
        userCount: variationParticipants.length,
        conversionRate,
        confidence,
        winner: false
      });
    });
    
    // Determine winner
    const winner = this.determineWinner(results);
    if (winner) {
      winner.winner = true;
    }
    
    return results;
  }

  /**
   * Aggregate metrics from multiple participants
   */
  private aggregateMetrics(metricsList: PerformanceMetrics[]): PerformanceMetrics {
    if (metricsList.length === 0) {
      return {
        loadTime: 0,
        renderTime: 0,
        interactionLatency: 0,
        userSatisfaction: 0,
        conversionRate: 0
      };
    }
    
    const aggregated: PerformanceMetrics = {
      loadTime: 0,
      renderTime: 0,
      interactionLatency: 0,
      userSatisfaction: 0,
      conversionRate: 0
    };
    
    metricsList.forEach(metrics => {
      aggregated.loadTime += metrics.loadTime;
      aggregated.renderTime += metrics.renderTime;
      aggregated.interactionLatency += metrics.interactionLatency;
      aggregated.userSatisfaction += metrics.userSatisfaction;
      aggregated.conversionRate += metrics.conversionRate;
    });
    
    const count = metricsList.length;
    aggregated.loadTime /= count;
    aggregated.renderTime /= count;
    aggregated.interactionLatency /= count;
    aggregated.userSatisfaction /= count;
    aggregated.conversionRate /= count;
    
    return aggregated;
  }

  /**
   * Calculate conversion rate from participants
   */
  private calculateConversionRate(participants: any[]): number {
    if (participants.length === 0) return 0;
    
    const conversions = participants.filter(p => 
      p.interactions.some((i: any) => i.type === 'conversion')
    ).length;
    
    return conversions / participants.length;
  }

  /**
   * Calculate statistical confidence
   */
  private calculateConfidence(sampleSize: number, conversionRate: number): number {
    // Simplified confidence calculation using normal approximation
    if (sampleSize === 0) return 0;
    
    const standardError = Math.sqrt((conversionRate * (1 - conversionRate)) / sampleSize);
    const zScore = 1.96; // 95% confidence level
    
    return Math.min(1, Math.max(0, 1 - (zScore * standardError)));
  }

  /**
   * Determine winner based on results
   */
  private determineWinner(results: ABTestResult[]): ABTestResult | null {
    if (results.length === 0) return null;
    
    // Sort by conversion rate and confidence
    const sortedResults = [...results].sort((a, b) => {
      const scoreA = a.conversionRate * a.confidence;
      const scoreB = b.conversionRate * b.confidence;
      return scoreB - scoreA;
    });
    
    const winner = sortedResults[0];
    
    // Check if winner is statistically significant
    if (winner.confidence >= 0.8 && winner.conversionRate > 0.1) {
      return winner;
    }
    
    return null;
  }

  /**
   * Simulate performance metrics for a layout
   */
  private simulateMetrics(layout: UILayout): PerformanceMetrics {
    // Simulate realistic metrics based on layout complexity
    const componentCount = layout.components.length;
    const complexity = Math.min(componentCount / 10, 1);
    
    return {
      loadTime: Math.random() * 100 + 50 + (complexity * 200),
      renderTime: Math.random() * 50 + 20 + (complexity * 100),
      interactionLatency: Math.random() * 20 + 5 + (complexity * 30),
      userSatisfaction: Math.random() * 0.4 + 0.6 - (complexity * 0.2),
      conversionRate: Math.random() * 0.2 + 0.1 - (complexity * 0.1)
    };
  }

  /**
   * Get test summary
   */
  getTestSummary(testId: string): any {
    const test = this.activeTests.get(testId);
    const results = this.testResults.get(testId);
    
    if (!test) return null;
    
    return {
      id: test.id,
      status: test.status,
      startTime: test.startTime,
      endTime: test.endTime,
      duration: test.endTime - test.startTime,
      participantCount: test.participants.size,
      variationCount: test.variations.length,
      results: results || []
    };
  }

  /**
   * Clean up old tests
   */
  cleanupOldTests(maxAge: number = 1000 * 60 * 60 * 24 * 7): void {
    const now = Date.now();
    const cutoff = now - maxAge;
    
    // Clean up old active tests
    for (const [testId, test] of this.activeTests.entries()) {
      if (test.startTime < cutoff) {
        this.activeTests.delete(testId);
      }
    }
    
    // Clean up old results
    for (const [testId, results] of this.testResults.entries()) {
      const test = this.activeTests.get(testId);
      if (!test || test.startTime < cutoff) {
        this.testResults.delete(testId);
      }
    }
  }
}

// Supporting interfaces
interface ABTest {
  id: string;
  variations: UILayout[];
  config: TestConfig;
  startTime: number;
  endTime: number;
  status: 'running' | 'stopped' | 'completed';
  participants: Map<string, TestParticipant>;
  metrics: Map<string, TestMetric>;
}

interface TestParticipant {
  id: string;
  variationIndex: number;
  joinTime: number;
  interactions: any[];
}

interface TestMetric {
  participantId: string;
  variationId: string;
  metrics: PerformanceMetrics;
  timestamp: number;
}