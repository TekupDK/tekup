#!/usr/bin/env node

import http from 'http';
import { URL } from 'url';
import { createLogger } from '@tekup/shared';
const logger = createLogger('apps-flow-api-scripts-load-tes');


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

class LoadTester {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || 'http://localhost:4000';
    this.apiKey = options.apiKey || 'demo-tenant-key-1';
    this.concurrency = options.concurrency || 10;
    this.duration = options.duration || 30; // seconds
    this.rampUp = options.rampUp || 5; // seconds
    
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      responseTimes: [],
      errors: {},
      startTime: null,
      endTime: null,
    };
  }

  async runLoadTest() {
    log(`${colors.bright}${colors.magenta}🚀 Load Testing Suite${colors.reset}`);
    log(`${colors.cyan}Target URL: ${this.baseUrl}${colors.reset}`);
    log(`${colors.cyan}Concurrency: ${this.concurrency} users${colors.reset}`);
    log(`${colors.cyan}Duration: ${this.duration} seconds${colors.reset}`);
    log(`${colors.cyan}Ramp-up: ${this.rampUp} seconds${colors.reset}`);
    
    await this.warmUp();
    await this.executeLoadTest();
    this.generateReport();
  }

  async warmUp() {
    log(`\n${colors.blue}🔥 Warming up application...${colors.reset}`);
    
    try {
      // Make a few requests to warm up the application
      for (let i = 0; i < 5; i++) {
        await this.makeRequest('/health');
        await this.sleep(200);
      }
      
      log(`${colors.green}✓ Application warmed up${colors.reset}`);
    } catch (error) {
      log(`${colors.red}✗ Warm-up failed: ${error.message}${colors.reset}`);
      throw error;
    }
  }

  async executeLoadTest() {
    log(`\n${colors.blue}⚡ Starting load test...${colors.reset}`);
    
    this.stats.startTime = Date.now();
    
    // Create workers with ramp-up
    const workers = [];
    const rampUpDelay = (this.rampUp * 1000) / this.concurrency;
    
    for (let i = 0; i < this.concurrency; i++) {
      setTimeout(() => {
        workers.push(this.createWorker(i));
      }, i * rampUpDelay);
    }
    
    // Wait for test duration
    await this.sleep(this.duration * 1000);
    
    // Stop all workers
    this.stopWorkers = true;
    
    // Wait for workers to finish
    await Promise.all(workers);
    
    this.stats.endTime = Date.now();
    
    log(`${colors.green}✓ Load test completed${colors.reset}`);
  }

  async createWorker(workerId) {
    const scenarios = [
      { path: '/leads', weight: 40 },
      { path: '/health', weight: 20 },
      { path: '/metrics', weight: 10 },
      { path: '/leads?limit=10', weight: 20 },
      { path: '/search', method: 'POST', body: { query: 'test', options: { limit: 5 } }, weight: 10 },
    ];
    
    while (!this.stopWorkers) {
      try {
        // Select scenario based on weight
        const scenario = this.selectScenario(scenarios);
        
        const startTime = Date.now();
        const response = await this.makeRequest(scenario.path, scenario.method, scenario.body);
        const responseTime = Date.now() - startTime;
        
        this.recordSuccess(responseTime);
        
        // Think time between requests
        await this.sleep(Math.random() * 1000 + 500); // 0.5-1.5 seconds
        
      } catch (error) {
        this.recordError(error);
        await this.sleep(1000); // Wait before retrying
      }
    }
  }

  selectScenario(scenarios) {
    const totalWeight = scenarios.reduce((sum, s) => sum + s.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const scenario of scenarios) {
      random -= scenario.weight;
      if (random <= 0) {
        return scenario;
      }
    }
    
    return scenarios[0]; // Fallback
  }

  async makeRequest(path, method = 'GET', body = null) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, this.baseUrl);
      
      const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method,
        headers: {
          'x-tenant-key': this.apiKey,
          'User-Agent': 'LoadTester/1.0',
        },
      };
      
      if (body) {
        options.headers['Content-Type'] = 'application/json';
        body = JSON.stringify(body);
        options.headers['Content-Length'] = Buffer.byteLength(body);
      }
      
      const req = http.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 400) {
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              body: data,
            });
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        });
      });
      
      req.on('error', reject);
      
      if (body) {
        req.write(body);
      }
      
      req.end();
      
      // Timeout after 30 seconds
      setTimeout(() => {
        req.destroy();
        reject(new Error('Request timeout'));
      }, 30000);
    });
  }

  recordSuccess(responseTime) {
    this.stats.totalRequests++;
    this.stats.successfulRequests++;
    this.stats.responseTimes.push(responseTime);
  }

  recordError(error) {
    this.stats.totalRequests++;
    this.stats.failedRequests++;
    
    const errorType = error.message.split(':')[0];
    this.stats.errors[errorType] = (this.stats.errors[errorType] || 0) + 1;
  }

  generateReport() {
    log(`\n${colors.bright}${colors.magenta}📊 Load Test Results${colors.reset}`);
    log('═'.repeat(60));
    
    const duration = (this.stats.endTime - this.stats.startTime) / 1000;
    const throughput = this.stats.totalRequests / duration;
    const errorRate = (this.stats.failedRequests / this.stats.totalRequests) * 100;
    
    // Calculate response time percentiles
    const sortedTimes = this.stats.responseTimes.sort((a, b) => a - b);
    const avg = sortedTimes.reduce((sum, time) => sum + time, 0) / sortedTimes.length;
    const p50 = this.percentile(sortedTimes, 0.5);
    const p95 = this.percentile(sortedTimes, 0.95);
    const p99 = this.percentile(sortedTimes, 0.99);
    const min = Math.min(...sortedTimes);
    const max = Math.max(...sortedTimes);
    
    // Overall metrics
    log(`${colors.cyan}Duration:${colors.reset} ${duration.toFixed(1)}s`);
    log(`${colors.cyan}Total Requests:${colors.reset} ${this.stats.totalRequests}`);
    log(`${colors.cyan}Successful:${colors.reset} ${this.stats.successfulRequests} (${((this.stats.successfulRequests / this.stats.totalRequests) * 100).toFixed(1)}%)`);
    log(`${colors.cyan}Failed:${colors.reset} ${this.stats.failedRequests} (${errorRate.toFixed(1)}%)`);
    log(`${colors.cyan}Throughput:${colors.reset} ${throughput.toFixed(2)} req/s`);
    
    log('\nResponse Times:');
    log(`${colors.cyan}Average:${colors.reset} ${avg.toFixed(1)}ms`);
    log(`${colors.cyan}Min:${colors.reset} ${min}ms`);
    log(`${colors.cyan}Max:${colors.reset} ${max}ms`);
    log(`${colors.cyan}P50:${colors.reset} ${p50}ms`);
    log(`${colors.cyan}P95:${colors.reset} ${p95}ms`);
    log(`${colors.cyan}P99:${colors.reset} ${p99}ms`);
    
    // Performance assessment
    log('\nPerformance Assessment:');
    
    const p95Target = 400; // ms
    const throughputTarget = 50; // req/s
    const errorRateTarget = 5; // %
    
    const p95Pass = p95 <= p95Target;
    const throughputPass = throughput >= throughputTarget;
    const errorRatePass = errorRate <= errorRateTarget;
    
    log(`${colors.cyan}P95 Response Time:${colors.reset} ${p95}ms ${p95Pass ? colors.green + '✓' : colors.red + '✗'} (target: ≤${p95Target}ms)${colors.reset}`);
    log(`${colors.cyan}Throughput:${colors.reset} ${throughput.toFixed(2)} req/s ${throughputPass ? colors.green + '✓' : colors.red + '✗'} (target: ≥${throughputTarget} req/s)${colors.reset}`);
    log(`${colors.cyan}Error Rate:${colors.reset} ${errorRate.toFixed(1)}% ${errorRatePass ? colors.green + '✓' : colors.red + '✗'} (target: ≤${errorRateTarget}%)${colors.reset}`);
    
    // Error breakdown
    if (this.stats.failedRequests > 0) {
      log('\nError Breakdown:');
      for (const [errorType, count] of Object.entries(this.stats.errors)) {
        log(`${colors.red}${errorType}:${colors.reset} ${count}`);
      }
    }
    
    log('═'.repeat(60));
    
    const allPassed = p95Pass && throughputPass && errorRatePass;
    
    if (allPassed) {
      log(`${colors.green}${colors.bright}🎉 Load test PASSED - Performance targets met!${colors.reset}`);
    } else {
      log(`${colors.red}${colors.bright}❌ Load test FAILED - Performance targets not met${colors.reset}`);
    }
    
    // Save detailed report
    const report = {
      timestamp: new Date().toISOString(),
      configuration: {
        baseUrl: this.baseUrl,
        concurrency: this.concurrency,
        duration: this.duration,
        rampUp: this.rampUp,
      },
      results: {
        duration,
        totalRequests: this.stats.totalRequests,
        successfulRequests: this.stats.successfulRequests,
        failedRequests: this.stats.failedRequests,
        throughput,
        errorRate,
        responseTimes: {
          avg,
          min,
          max,
          p50,
          p95,
          p99,
        },
        errors: this.stats.errors,
      },
      assessment: {
        p95Pass,
        throughputPass,
        errorRatePass,
        overallPass: allPassed,
      },
    };
    
    const fs = await import('fs');
    fs.writeFileSync('load-test-report.json', JSON.stringify(report, null, 2));
    log(`\n${colors.cyan}📄 Detailed report saved to: load-test-report.json${colors.reset}`);
    
    return allPassed;
  }

  percentile(sortedArray, percentile) {
    const index = Math.ceil(sortedArray.length * percentile) - 1;
    return sortedArray[Math.max(0, index)];
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Command line interface
async function main() {
  const args = process.argv.slice(2);
  
  const options = {
    baseUrl: 'http://localhost:4000',
    apiKey: 'demo-tenant-key-1',
    concurrency: 10,
    duration: 30,
    rampUp: 5,
  };
  
  // Parse command line arguments
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i];
    const value = args[i + 1];
    
    switch (key) {
      case '--url':
        options.baseUrl = value;
        break;
      case '--api-key':
        options.apiKey = value;
        break;
      case '--concurrency':
      case '-c':
        options.concurrency = parseInt(value);
        break;
      case '--duration':
      case '-d':
        options.duration = parseInt(value);
        break;
      case '--ramp-up':
      case '-r':
        options.rampUp = parseInt(value);
        break;
      case '--help':
      case '-h':
        logger.info(`
Load Testing Tool

Usage: node scripts/load-test.js [options]

Options:
  --url <url>           Target URL (default: http://localhost:4000)
  --api-key <key>       API key for authentication (default: demo-tenant-key-1)
  --concurrency, -c     Number of concurrent users (default: 10)
  --duration, -d        Test duration in seconds (default: 30)
  --ramp-up, -r         Ramp-up time in seconds (default: 5)
  --help, -h            Show this help message

Examples:
  node scripts/load-test.js --concurrency 20 --duration 60
  node scripts/load-test.js --url http://localhost:3000 --api-key my-key
        `);
        process.exit(0);
    }
  }
  
  const tester = new LoadTester(options);
  const success = await tester.runLoadTest();
  
  process.exit(success ? 0 : 1);
}

main().catch(error => {
  log(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
  process.exit(1);
});