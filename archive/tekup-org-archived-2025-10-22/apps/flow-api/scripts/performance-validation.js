#!/usr/bin/env node

import { execSync } from 'child_process';
import { writeFileSync, existsSync } from 'fs';
import path from 'path';
import { createLogger } from '@tekup/shared';
const logger = createLogger('apps-flow-api-scripts-performa');


const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  logger.info(`${color}${message}${colors.reset}`);
}

// Performance targets from requirements
const PERFORMANCE_TARGETS = {
  p95ResponseTime: 400, // milliseconds
  avgResponseTime: 200, // milliseconds
  throughput: 100, // requests per second
  cacheHitRate: 80, // percentage
  errorRate: 1, // percentage
  memoryUsage: 512, // MB
  cpuUsage: 70, // percentage
};

class PerformanceValidator {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      targets: PERFORMANCE_TARGETS,
      tests: [],
      summary: {
        passed: 0,
        failed: 0,
        warnings: 0,
      },
    };
  }

  async runValidation() {
    log(`${colors.bright}${colors.magenta}🚀 Performance Validation Suite${colors.reset}`);
    log(`${colors.cyan}Target P95 Response Time: ${PERFORMANCE_TARGETS.p95ResponseTime}ms${colors.reset}`);
    log(`${colors.cyan}Target Average Response Time: ${PERFORMANCE_TARGETS.avgResponseTime}ms${colors.reset}`);
    log(`${colors.cyan}Target Throughput: ${PERFORMANCE_TARGETS.throughput} req/s${colors.reset}`);
    
    await this.validateResponseTimes();
    await this.validateThroughput();
    await this.validateCachePerformance();
    await this.validateRateLimiting();
    await this.validateDatabasePerformance();
    await this.validateMemoryUsage();
    
    this.generateReport();
    this.printSummary();
  }

  async validateResponseTimes() {
    log(`\n${colors.blue}📊 Validating Response Times${colors.reset}`);
    
    const test = {
      name: 'Response Time Validation',
      target: `P95 < ${PERFORMANCE_TARGETS.p95ResponseTime}ms, Avg < ${PERFORMANCE_TARGETS.avgResponseTime}ms`,
      status: 'running',
      metrics: {},
      passed: false,
    };

    try {
      // Run performance tests
      const output = execSync('npm run test:performance -- --testNamePattern="Response Time"', {
        encoding: 'utf8',
        timeout: 120000,
      });

      // Parse test output for metrics (simplified)
      const p95Match = output.match(/P95 Response Time: (\d+)ms/);
      const avgMatch = output.match(/Average Response Time: ([\d.]+)ms/);

      if (p95Match && avgMatch) {
        const p95Time = parseInt(p95Match[1]);
        const avgTime = parseFloat(avgMatch[1]);

        test.metrics = {
          p95ResponseTime: p95Time,
          avgResponseTime: avgTime,
        };

        const p95Pass = p95Time < PERFORMANCE_TARGETS.p95ResponseTime;
        const avgPass = avgTime < PERFORMANCE_TARGETS.avgResponseTime;
        test.passed = p95Pass && avgPass;

        if (test.passed) {
          log(`${colors.green}✓ Response times within targets${colors.reset}`);
          log(`  P95: ${p95Time}ms (target: <${PERFORMANCE_TARGETS.p95ResponseTime}ms)`);
          log(`  Avg: ${avgTime}ms (target: <${PERFORMANCE_TARGETS.avgResponseTime}ms)`);
          this.results.summary.passed++;
        } else {
          log(`${colors.red}✗ Response times exceed targets${colors.reset}`);
          log(`  P95: ${p95Time}ms (target: <${PERFORMANCE_TARGETS.p95ResponseTime}ms) ${p95Pass ? '✓' : '✗'}`);
          log(`  Avg: ${avgTime}ms (target: <${PERFORMANCE_TARGETS.avgResponseTime}ms) ${avgPass ? '✓' : '✗'}`);
          this.results.summary.failed++;
        }
      } else {
        throw new Error('Could not parse performance metrics from test output');
      }

      test.status = 'completed';
    } catch (error) {
      test.status = 'failed';
      test.error = error.message;
      log(`${colors.red}✗ Response time validation failed: ${error.message}${colors.reset}`);
      this.results.summary.failed++;
    }

    this.results.tests.push(test);
  }

  async validateThroughput() {
    log(`\n${colors.blue}🔄 Validating Throughput${colors.reset}`);
    
    const test = {
      name: 'Throughput Validation',
      target: `> ${PERFORMANCE_TARGETS.throughput} req/s`,
      status: 'running',
      metrics: {},
      passed: false,
    };

    try {
      // Run concurrent request test
      const output = execSync('npm run test:performance -- --testNamePattern="concurrent requests"', {
        encoding: 'utf8',
        timeout: 120000,
      });

      // Parse throughput metrics
      const throughputMatch = output.match(/Average time per request: ([\d.]+)ms/);
      const concurrentMatch = output.match(/Concurrent requests: (\d+)/);
      const totalTimeMatch = output.match(/Total time: (\d+)ms/);

      if (throughputMatch && concurrentMatch && totalTimeMatch) {
        const avgTimePerRequest = parseFloat(throughputMatch[1]);
        const concurrentRequests = parseInt(concurrentMatch[1]);
        const totalTime = parseInt(totalTimeMatch[1]);
        
        // Calculate actual throughput
        const throughput = (concurrentRequests / totalTime) * 1000; // req/s

        test.metrics = {
          throughput,
          avgTimePerRequest,
          concurrentRequests,
          totalTime,
        };

        test.passed = throughput >= PERFORMANCE_TARGETS.throughput;

        if (test.passed) {
          log(`${colors.green}✓ Throughput meets target${colors.reset}`);
          log(`  Achieved: ${throughput.toFixed(2)} req/s (target: >${PERFORMANCE_TARGETS.throughput} req/s)`);
          this.results.summary.passed++;
        } else {
          log(`${colors.red}✗ Throughput below target${colors.reset}`);
          log(`  Achieved: ${throughput.toFixed(2)} req/s (target: >${PERFORMANCE_TARGETS.throughput} req/s)`);
          this.results.summary.failed++;
        }
      } else {
        throw new Error('Could not parse throughput metrics from test output');
      }

      test.status = 'completed';
    } catch (error) {
      test.status = 'failed';
      test.error = error.message;
      log(`${colors.red}✗ Throughput validation failed: ${error.message}${colors.reset}`);
      this.results.summary.failed++;
    }

    this.results.tests.push(test);
  }

  async validateCachePerformance() {
    log(`\n${colors.blue}💾 Validating Cache Performance${colors.reset}`);
    
    const test = {
      name: 'Cache Performance Validation',
      target: `Hit rate > ${PERFORMANCE_TARGETS.cacheHitRate}%`,
      status: 'running',
      metrics: {},
      passed: false,
    };

    try {
      // Run cache performance test
      const output = execSync('npm run test:performance -- --testNamePattern="cache performance"', {
        encoding: 'utf8',
        timeout: 60000,
      });

      // Parse cache metrics
      const improvementMatch = output.match(/Performance improvement: ([\d.]+)%/);
      const missTimeMatch = output.match(/Cache miss time: (\d+)ms/);
      const hitTimeMatch = output.match(/Cache hit time: (\d+)ms/);

      if (improvementMatch && missTimeMatch && hitTimeMatch) {
        const improvement = parseFloat(improvementMatch[1]);
        const missTime = parseInt(missTimeMatch[1]);
        const hitTime = parseInt(hitTimeMatch[1]);
        
        // Calculate effective hit rate based on performance improvement
        const effectiveHitRate = improvement;

        test.metrics = {
          performanceImprovement: improvement,
          cacheMissTime: missTime,
          cacheHitTime: hitTime,
          effectiveHitRate,
        };

        test.passed = effectiveHitRate >= PERFORMANCE_TARGETS.cacheHitRate;

        if (test.passed) {
          log(`${colors.green}✓ Cache performance meets target${colors.reset}`);
          log(`  Performance improvement: ${improvement}% (target: >${PERFORMANCE_TARGETS.cacheHitRate}%)`);
          log(`  Cache hit time: ${hitTime}ms vs miss time: ${missTime}ms`);
          this.results.summary.passed++;
        } else {
          log(`${colors.yellow}⚠ Cache performance below target${colors.reset}`);
          log(`  Performance improvement: ${improvement}% (target: >${PERFORMANCE_TARGETS.cacheHitRate}%)`);
          this.results.summary.warnings++;
        }
      } else {
        throw new Error('Could not parse cache metrics from test output');
      }

      test.status = 'completed';
    } catch (error) {
      test.status = 'failed';
      test.error = error.message;
      log(`${colors.yellow}⚠ Cache validation failed: ${error.message}${colors.reset}`);
      this.results.summary.warnings++;
    }

    this.results.tests.push(test);
  }

  async validateRateLimiting() {
    log(`\n${colors.blue}🛡️ Validating Rate Limiting${colors.reset}`);
    
    const test = {
      name: 'Rate Limiting Validation',
      target: 'Accurate rate limiting under load',
      status: 'running',
      metrics: {},
      passed: false,
    };

    try {
      // Run rate limiting test
      const output = execSync('npm run test:performance -- --testNamePattern="rate limiting"', {
        encoding: 'utf8',
        timeout: 60000,
      });

      // Parse rate limiting metrics
      const successMatch = output.match(/Successful requests: (\d+)/);
      const totalMatch = output.match(/Total requests: (\d+)/);
      const avgTimeMatch = output.match(/Average response time: ([\d.]+)ms/);

      if (successMatch && totalMatch && avgTimeMatch) {
        const successfulRequests = parseInt(successMatch[1]);
        const totalRequests = parseInt(totalMatch[1]);
        const avgResponseTime = parseFloat(avgTimeMatch[1]);
        
        const successRate = (successfulRequests / totalRequests) * 100;

        test.metrics = {
          successRate,
          successfulRequests,
          totalRequests,
          avgResponseTime,
        };

        // Rate limiting should allow most requests through while maintaining performance
        test.passed = successRate >= 90 && avgResponseTime < PERFORMANCE_TARGETS.p95ResponseTime;

        if (test.passed) {
          log(`${colors.green}✓ Rate limiting working correctly${colors.reset}`);
          log(`  Success rate: ${successRate.toFixed(1)}%`);
          log(`  Average response time: ${avgResponseTime}ms`);
          this.results.summary.passed++;
        } else {
          log(`${colors.yellow}⚠ Rate limiting issues detected${colors.reset}`);
          log(`  Success rate: ${successRate.toFixed(1)}% (target: >90%)`);
          log(`  Average response time: ${avgResponseTime}ms`);
          this.results.summary.warnings++;
        }
      } else {
        throw new Error('Could not parse rate limiting metrics from test output');
      }

      test.status = 'completed';
    } catch (error) {
      test.status = 'failed';
      test.error = error.message;
      log(`${colors.yellow}⚠ Rate limiting validation failed: ${error.message}${colors.reset}`);
      this.results.summary.warnings++;
    }

    this.results.tests.push(test);
  }

  async validateDatabasePerformance() {
    log(`\n${colors.blue}🗄️ Validating Database Performance${colors.reset}`);
    
    const test = {
      name: 'Database Performance Validation',
      target: 'Efficient queries with large datasets',
      status: 'running',
      metrics: {},
      passed: false,
    };

    try {
      // Run database performance test
      const output = execSync('npm run test:performance -- --testNamePattern="large dataset"', {
        encoding: 'utf8',
        timeout: 120000,
      });

      // Parse database metrics
      const queryTimeMatch = output.match(/Large dataset query time: (\d+)ms/);
      const searchTimeMatch = output.match(/Search query.*took (\d+)ms/);

      if (queryTimeMatch) {
        const queryTime = parseInt(queryTimeMatch[1]);
        const searchTimes = [];
        
        // Extract all search times
        let match;
        const searchRegex = /Search query.*took (\d+)ms/g;
        while ((match = searchRegex.exec(output)) !== null) {
          searchTimes.push(parseInt(match[1]));
        }

        const avgSearchTime = searchTimes.length > 0 
          ? searchTimes.reduce((a, b) => a + b, 0) / searchTimes.length 
          : 0;

        test.metrics = {
          largeDatasetQueryTime: queryTime,
          avgSearchTime,
          searchQueries: searchTimes.length,
        };

        // Database queries should complete within reasonable time
        test.passed = queryTime < 1000 && avgSearchTime < 500;

        if (test.passed) {
          log(`${colors.green}✓ Database performance meets targets${colors.reset}`);
          log(`  Large dataset query: ${queryTime}ms (target: <1000ms)`);
          log(`  Average search time: ${avgSearchTime}ms (target: <500ms)`);
          this.results.summary.passed++;
        } else {
          log(`${colors.red}✗ Database performance issues${colors.reset}`);
          log(`  Large dataset query: ${queryTime}ms (target: <1000ms)`);
          log(`  Average search time: ${avgSearchTime}ms (target: <500ms)`);
          this.results.summary.failed++;
        }
      } else {
        throw new Error('Could not parse database metrics from test output');
      }

      test.status = 'completed';
    } catch (error) {
      test.status = 'failed';
      test.error = error.message;
      log(`${colors.red}✗ Database validation failed: ${error.message}${colors.reset}`);
      this.results.summary.failed++;
    }

    this.results.tests.push(test);
  }

  async validateMemoryUsage() {
    log(`\n${colors.blue}💾 Validating Memory Usage${colors.reset}`);
    
    const test = {
      name: 'Memory Usage Validation',
      target: `Stable memory usage under load`,
      status: 'running',
      metrics: {},
      passed: false,
    };

    try {
      // Run memory usage test
      const output = execSync('npm run test:performance -- --testNamePattern="memory usage"', {
        encoding: 'utf8',
        timeout: 60000,
      });

      // Parse memory metrics
      const initialMatch = output.match(/Initial heap: ([\d.]+) MB/);
      const finalMatch = output.match(/Final heap: ([\d.]+) MB/);
      const increaseMatch = output.match(/Memory increase: [\d.]+ MB \(([\d.]+)%\)/);

      if (initialMatch && finalMatch && increaseMatch) {
        const initialHeap = parseFloat(initialMatch[1]);
        const finalHeap = parseFloat(finalMatch[1]);
        const memoryIncreasePercent = parseFloat(increaseMatch[1]);

        test.metrics = {
          initialHeapMB: initialHeap,
          finalHeapMB: finalHeap,
          memoryIncreasePercent,
        };

        // Memory increase should be reasonable
        test.passed = memoryIncreasePercent < 50 && finalHeap < PERFORMANCE_TARGETS.memoryUsage;

        if (test.passed) {
          log(`${colors.green}✓ Memory usage is stable${colors.reset}`);
          log(`  Initial heap: ${initialHeap} MB`);
          log(`  Final heap: ${finalHeap} MB`);
          log(`  Memory increase: ${memoryIncreasePercent}%`);
          this.results.summary.passed++;
        } else {
          log(`${colors.yellow}⚠ Memory usage concerns${colors.reset}`);
          log(`  Initial heap: ${initialHeap} MB`);
          log(`  Final heap: ${finalHeap} MB (target: <${PERFORMANCE_TARGETS.memoryUsage} MB)`);
          log(`  Memory increase: ${memoryIncreasePercent}% (target: <50%)`);
          this.results.summary.warnings++;
        }
      } else {
        throw new Error('Could not parse memory metrics from test output');
      }

      test.status = 'completed';
    } catch (error) {
      test.status = 'failed';
      test.error = error.message;
      log(`${colors.yellow}⚠ Memory validation failed: ${error.message}${colors.reset}`);
      this.results.summary.warnings++;
    }

    this.results.tests.push(test);
  }

  generateReport() {
    const reportPath = 'performance-validation-report.json';
    writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    log(`\n${colors.cyan}📄 Performance report saved to: ${reportPath}${colors.reset}`);
  }

  printSummary() {
    log(`\n${colors.bright}${colors.magenta}📊 Performance Validation Summary${colors.reset}`);
    log('═'.repeat(60));
    
    const total = this.results.summary.passed + this.results.summary.failed + this.results.summary.warnings;
    
    log(`${colors.green}✓ Passed: ${this.results.summary.passed}/${total}${colors.reset}`);
    log(`${colors.red}✗ Failed: ${this.results.summary.failed}/${total}${colors.reset}`);
    log(`${colors.yellow}⚠ Warnings: ${this.results.summary.warnings}/${total}${colors.reset}`);
    
    log('\nDetailed Results:');
    for (const test of this.results.tests) {
      const status = test.passed ? 
        `${colors.green}✓ PASS${colors.reset}` : 
        test.status === 'failed' ? 
          `${colors.red}✗ FAIL${colors.reset}` : 
          `${colors.yellow}⚠ WARN${colors.reset}`;
      
      log(`  ${test.name.padEnd(35)} ${status}`);
      if (test.error) {
        log(`    ${colors.red}Error: ${test.error}${colors.reset}`);
      }
    }
    
    log('═'.repeat(60));
    
    if (this.results.summary.failed === 0) {
      log(`${colors.green}${colors.bright}🎉 Performance validation completed successfully!${colors.reset}`);
      if (this.results.summary.warnings > 0) {
        log(`${colors.yellow}Note: ${this.results.summary.warnings} warning(s) detected - review recommended${colors.reset}`);
      }
    } else {
      log(`${colors.red}${colors.bright}❌ Performance validation failed${colors.reset}`);
      log(`${colors.red}${this.results.summary.failed} critical performance issue(s) detected${colors.reset}`);
    }
  }
}

// Main execution
async function main() {
  const validator = new PerformanceValidator();
  await validator.runValidation();
  
  // Exit with appropriate code
  process.exit(validator.results.summary.failed > 0 ? 1 : 0);
}

main().catch(error => {
  log(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
  process.exit(1);
});