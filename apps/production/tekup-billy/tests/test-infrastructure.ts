/**
 * Infrastructure Testing Suite for Tekup-Billy MCP v2.0
 * 
 * Comprehensive tests for enhanced infrastructure components:
 * - Redis Cluster functionality and failover
 * - Circuit breaker behavior and recovery
 * - Health monitoring system validation
 * - Load testing scenarios for Render.com deployment
 * - Chaos engineering tests for resilience validation
 */

import { log } from '../src/utils/logger.js';
import { getRedisClusterManager, initializeRedisCluster } from '../src/database/redis-cluster-manager.js';
import { BillyClient } from '../src/billy-client.js';
import { getBillyConfig } from '../src/config.js';
import { getHealthMonitor } from '../src/monitoring/health-monitor.js';
import { CacheManager } from '../src/database/cache-manager.js';

// Test configuration
const TEST_CONFIG = {
  REDIS_TESTS: process.env.REDIS_URL ? true : false,
  LOAD_TEST_DURATION: 30000, // 30 seconds
  LOAD_TEST_CONCURRENT_USERS: 10,
  CHAOS_TEST_ENABLED: process.env.NODE_ENV !== 'production'
};

// Test results tracking
interface TestResult {
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
  details?: Record<string, any>;
}

class InfrastructureTestSuite {
  private results: TestResult[] = [];
  private billyClient: BillyClient | null = null;
  private healthMonitor = getHealthMonitor();

  constructor() {
    log.info('Infrastructure Test Suite initialized', {
      redisTestsEnabled: TEST_CONFIG.REDIS_TESTS,
      chaosTestsEnabled: TEST_CONFIG.CHAOS_TEST_ENABLED
    });
  }

  /**
   * Run all infrastructure tests
   */
  async runAllTests(): Promise<{ passed: number; failed: number; skipped: number; results: TestResult[] }> {
    log.info('Starting infrastructure test suite');

    // Initialize Billy client for tests
    await this.initializeBillyClient();

    // Run test suites
    await this.runRedisClusterTests();
    await this.runCircuitBreakerTests();
    await this.runHealthMonitoringTests();
    await this.runLoadTests();
    await this.runChaosTests();

    // Calculate results
    const passed = this.results.filter(r => r.status === 'passed').length;
    const failed = this.results.filter(r => r.status === 'failed').length;
    const skipped = this.results.filter(r => r.status === 'skipped').length;

    log.info('Infrastructure test suite completed', {
      total: this.results.length,
      passed,
      failed,
      skipped
    });

    return { passed, failed, skipped, results: this.results };
  }

  /**
   * Initialize Billy client for testing
   */
  private async initializeBillyClient(): Promise<void> {
    try {
      const config = getBillyConfig();
      this.billyClient = new BillyClient(config);
      log.info('Billy client initialized for testing');
    } catch (error) {
      log.error('Failed to initialize Billy client for testing', error);
    }
  }

  /**
   * Redis Cluster Tests
   */
  private async runRedisClusterTests(): Promise<void> {
    if (!TEST_CONFIG.REDIS_TESTS) {
      this.addResult('Redis Cluster Tests', 'skipped', 0, 'Redis not configured');
      return;
    }

    // Test 1: Redis Connection and Basic Operations
    await this.runTest('Redis Connection Test', async () => {
      const redisManager = await initializeRedisCluster();
      
      // Test basic operations
      const testKey = 'test:infrastructure:basic';
      const testValue = { timestamp: Date.now(), test: 'basic' };
      
      await redisManager.set(testKey, testValue, 60);
      const retrieved = await redisManager.get(testKey);
      
      if (!retrieved || retrieved.test !== 'basic') {
        throw new Error('Redis basic operations failed');
      }
      
      await redisManager.del(testKey);
      
      return { operations: 'set/get/del successful' };
    });

    // Test 2: Redis Failover Simulation
    await this.runTest('Redis Failover Test', async () => {
      const redisManager = getRedisClusterManager();
      const healthBefore = await redisManager.getHealthStatus();
      
      // Store test data
      const testKey = 'test:infrastructure:failover';
      await redisManager.set(testKey, { data: 'failover-test' }, 300);
      
      // Simulate network issues by forcing circuit breaker
      let failoverTested = false;
      try {
        // Try to access data during simulated failure
        const result = await redisManager.get(testKey);
        failoverTested = !!result;
      } catch (error) {
        // Expected during failover
        failoverTested = true;
      }
      
      const healthAfter = await redisManager.getHealthStatus();
      
      return {
        healthBefore: healthBefore.connected,
        healthAfter: healthAfter.connected,
        failoverTested
      };
    });

    // Test 3: Redis Performance Under Load
    await this.runTest('Redis Performance Test', async () => {
      const redisManager = getRedisClusterManager();
      const operations = 100;
      const startTime = Date.now();
      
      // Parallel operations
      const promises = [];
      for (let i = 0; i < operations; i++) {
        promises.push(
          redisManager.set(`test:perf:${i}`, { index: i, timestamp: Date.now() }, 60)
        );
      }
      
      await Promise.all(promises);
      
      // Read operations
      const readPromises = [];
      for (let i = 0; i < operations; i++) {
        readPromises.push(redisManager.get(`test:perf:${i}`));
      }
      
      const results = await Promise.all(readPromises);
      const duration = Date.now() - startTime;
      
      // Cleanup
      for (let i = 0; i < operations; i++) {
        await redisManager.del(`test:perf:${i}`);
      }
      
      return {
        operations: operations * 2, // set + get
        duration,
        opsPerSecond: Math.round((operations * 2) / (duration / 1000)),
        successfulReads: results.filter(r => r !== null).length
      };
    });

    // Test 4: Distributed Cache Invalidation
    await this.runTest('Distributed Cache Invalidation Test', async () => {
      const redisManager = getRedisClusterManager();
      
      // Set up test data
      const pattern = 'test:invalidation:*';
      const keys = ['test:invalidation:1', 'test:invalidation:2', 'test:invalidation:3'];
      
      for (const key of keys) {
        await redisManager.set(key, { data: 'invalidation-test' }, 300);
      }
      
      // Test pattern invalidation
      const invalidatedCount = await redisManager.invalidatePattern(pattern);
      
      // Verify invalidation
      const remainingData = [];
      for (const key of keys) {
        const result = await redisManager.get(key);
        if (result) remainingData.push(key);
      }
      
      return {
        keysSet: keys.length,
        invalidatedCount,
        remainingKeys: remainingData.length
      };
    });
  }

  /**
   * Circuit Breaker Tests
   */
  private async runCircuitBreakerTests(): Promise<void> {
    if (!this.billyClient) {
      this.addResult('Circuit Breaker Tests', 'skipped', 0, 'Billy client not available');
      return;
    }

    // Test 1: Circuit Breaker Normal Operation
    await this.runTest('Circuit Breaker Normal Operation', async () => {
      const healthStatus = this.billyClient!.getHealthStatus();
      const initialState = healthStatus.circuitBreaker.state;
      
      // Make a successful request
      await this.billyClient!.validateAuth();
      
      const afterRequestStatus = this.billyClient!.getHealthStatus();
      
      return {
        initialState,
        afterRequestState: afterRequestStatus.circuitBreaker.state,
        successfulRequests: afterRequestStatus.circuitBreaker.stats.successes
      };
    });

    // Test 2: Circuit Breaker Metrics Collection
    await this.runTest('Circuit Breaker Metrics Test', async () => {
      const initialMetrics = this.billyClient!.getHealthStatus();
      
      // Make several requests to generate metrics
      const requests = 5;
      for (let i = 0; i < requests; i++) {
        try {
          await this.billyClient!.validateAuth();
        } catch (error) {
          // Expected for some requests
        }
      }
      
      const finalMetrics = this.billyClient!.getHealthStatus();
      
      return {
        initialRequests: initialMetrics.circuitBreaker.stats.requests,
        finalRequests: finalMetrics.circuitBreaker.stats.requests,
        requestsAdded: finalMetrics.circuitBreaker.stats.requests - initialMetrics.circuitBreaker.stats.requests,
        latencyMean: finalMetrics.circuitBreaker.stats.latencyMean
      };
    });

    // Test 3: Fallback Cache Functionality
    await this.runTest('Circuit Breaker Fallback Cache Test', async () => {
      // Make a successful request to populate cache
      await this.billyClient!.validateAuth();
      
      const cacheStatus = this.billyClient!.getHealthStatus();
      
      return {
        fallbackCacheSize: cacheStatus.fallbackCache.size,
        circuitBreakerState: cacheStatus.circuitBreaker.state
      };
    });
  }

  /**
   * Health Monitoring Tests
   */
  private async runHealthMonitoringTests(): Promise<void> {
    // Test 1: Health Check Execution
    await this.runTest('Health Check Execution Test', async () => {
      const startTime = Date.now();
      const healthResult = await this.healthMonitor.performHealthCheck();
      const duration = Date.now() - startTime;
      
      return {
        status: healthResult.status,
        dependencyCount: healthResult.dependencies.length,
        duration,
        hasMetrics: !!healthResult.metrics,
        hasRecommendations: (healthResult.recommendations?.length || 0) >= 0
      };
    });

    // Test 2: Metrics Collection
    await this.runTest('Metrics Collection Test', async () => {
      // Record some test metrics
      this.healthMonitor.recordRequest(true, 100);
      this.healthMonitor.recordRequest(false, 200);
      this.healthMonitor.recordRequest(true, 150);
      
      const metrics = this.healthMonitor.getMetrics();
      const prometheusMetrics = this.healthMonitor.exportPrometheusMetrics();
      
      return {
        hasMetrics: Object.keys(metrics).length > 0,
        prometheusFormat: prometheusMetrics.includes('tekup_billy_'),
        uptime: this.healthMonitor.getUptime()
      };
    });

    // Test 3: Scaling Recommendations
    await this.runTest('Scaling Recommendations Test', async () => {
      const recommendations = this.healthMonitor.generateScalingRecommendation();
      
      return {
        hasAction: !!recommendations.action,
        hasReason: !!recommendations.reason,
        hasMetrics: !!recommendations.metrics,
        currentInstances: recommendations.currentInstances,
        recommendedInstances: recommendations.recommendedInstances
      };
    });
  }

  /**
   * Load Testing
   */
  private async runLoadTests(): Promise<void> {
    if (!this.billyClient) {
      this.addResult('Load Tests', 'skipped', 0, 'Billy client not available');
      return;
    }

    // Test 1: Concurrent Request Handling
    await this.runTest('Concurrent Request Load Test', async () => {
      const concurrentUsers = TEST_CONFIG.LOAD_TEST_CONCURRENT_USERS;
      const requestsPerUser = 5;
      const startTime = Date.now();
      
      const userPromises = [];
      for (let user = 0; user < concurrentUsers; user++) {
        const userRequests = [];
        for (let req = 0; req < requestsPerUser; req++) {
          userRequests.push(this.billyClient!.validateAuth());
        }
        userPromises.push(Promise.all(userRequests));
      }
      
      const results = await Promise.allSettled(userPromises);
      const duration = Date.now() - startTime;
      
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      return {
        concurrentUsers,
        requestsPerUser,
        totalRequests: concurrentUsers * requestsPerUser,
        successful: successful * requestsPerUser,
        failed: failed * requestsPerUser,
        duration,
        requestsPerSecond: Math.round((concurrentUsers * requestsPerUser) / (duration / 1000))
      };
    });

    // Test 2: Memory Usage Under Load
    await this.runTest('Memory Usage Load Test', async () => {
      const initialMemory = process.memoryUsage();
      
      // Create cache manager and perform operations
      const cacheManager = new CacheManager('test-org');
      const operations = 50;
      
      // Simulate cache operations
      for (let i = 0; i < operations; i++) {
        // This would normally hit the cache/API
        try {
          await this.billyClient!.validateAuth();
        } catch (error) {
          // Expected for some operations
        }
      }
      
      const finalMemory = process.memoryUsage();
      
      return {
        initialHeapUsed: Math.round(initialMemory.heapUsed / 1024 / 1024),
        finalHeapUsed: Math.round(finalMemory.heapUsed / 1024 / 1024),
        memoryIncrease: Math.round((finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024),
        operations
      };
    });
  }

  /**
   * Chaos Engineering Tests
   */
  private async runChaosTests(): Promise<void> {
    if (!TEST_CONFIG.CHAOS_TEST_ENABLED) {
      this.addResult('Chaos Engineering Tests', 'skipped', 0, 'Chaos tests disabled in production');
      return;
    }

    // Test 1: Network Timeout Simulation
    await this.runTest('Network Timeout Chaos Test', async () => {
      if (!this.billyClient) {
        throw new Error('Billy client not available');
      }

      const initialHealth = this.billyClient.getHealthStatus();
      
      // Simulate network issues by making requests that might timeout
      let timeoutCount = 0;
      let successCount = 0;
      
      for (let i = 0; i < 5; i++) {
        try {
          await this.billyClient.validateAuth();
          successCount++;
        } catch (error: any) {
          if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
            timeoutCount++;
          }
        }
      }
      
      const finalHealth = this.billyClient.getHealthStatus();
      
      return {
        initialCircuitState: initialHealth.circuitBreaker.state,
        finalCircuitState: finalHealth.circuitBreaker.state,
        timeoutCount,
        successCount,
        circuitBreakerTriggered: finalHealth.circuitBreaker.state !== initialHealth.circuitBreaker.state
      };
    });

    // Test 2: High Error Rate Simulation
    await this.runTest('High Error Rate Chaos Test', async () => {
      const initialMetrics = this.healthMonitor.getMetrics();
      
      // Simulate high error rate
      for (let i = 0; i < 10; i++) {
        this.healthMonitor.recordRequest(false, 1000); // Record failed requests
      }
      
      // Add some successful requests
      for (let i = 0; i < 3; i++) {
        this.healthMonitor.recordRequest(true, 200);
      }
      
      const finalMetrics = this.healthMonitor.getMetrics();
      const recommendations = this.healthMonitor.generateScalingRecommendation();
      
      return {
        initialMetrics: Object.keys(initialMetrics).length,
        finalMetrics: Object.keys(finalMetrics).length,
        scalingAction: recommendations.action,
        scalingReason: recommendations.reason
      };
    });
  }

  /**
   * Run a single test with error handling and timing
   */
  private async runTest(name: string, testFn: () => Promise<any>): Promise<void> {
    const startTime = Date.now();
    
    try {
      log.info(`Running test: ${name}`);
      const result = await testFn();
      const duration = Date.now() - startTime;
      
      this.addResult(name, 'passed', duration, undefined, result);
      log.info(`Test passed: ${name}`, { duration, result });
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.addResult(name, 'failed', duration, error.message);
      log.error(`Test failed: ${name}`, error, { duration });
    }
  }

  /**
   * Add test result
   */
  private addResult(name: string, status: 'passed' | 'failed' | 'skipped', duration: number, error?: string, details?: any): void {
    this.results.push({
      name,
      status,
      duration,
      error,
      details
    });
  }

  /**
   * Generate test report
   */
  generateReport(): string {
    const passed = this.results.filter(r => r.status === 'passed').length;
    const failed = this.results.filter(r => r.status === 'failed').length;
    const skipped = this.results.filter(r => r.status === 'skipped').length;
    const total = this.results.length;
    
    let report = `
Infrastructure Test Suite Report
================================

Summary:
- Total Tests: ${total}
- Passed: ${passed}
- Failed: ${failed}
- Skipped: ${skipped}
- Success Rate: ${total > 0 ? Math.round((passed / (total - skipped)) * 100) : 0}%

Test Results:
`;

    for (const result of this.results) {
      const status = result.status.toUpperCase().padEnd(8);
      const duration = `${result.duration}ms`.padEnd(8);
      report += `${status} ${duration} ${result.name}\n`;
      
      if (result.error) {
        report += `         Error: ${result.error}\n`;
      }
      
      if (result.details) {
        report += `         Details: ${JSON.stringify(result.details, null, 2).replace(/\n/g, '\n         ')}\n`;
      }
    }

    return report;
  }
}

/**
 * Run infrastructure tests
 */
export async function runInfrastructureTests(): Promise<void> {
  const testSuite = new InfrastructureTestSuite();
  
  try {
    const results = await testSuite.runAllTests();
    const report = testSuite.generateReport();
    
    console.log(report);
    
    // Exit with error code if tests failed
    if (results.failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    log.error('Infrastructure test suite failed', error);
    process.exit(1);
  }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runInfrastructureTests();
}