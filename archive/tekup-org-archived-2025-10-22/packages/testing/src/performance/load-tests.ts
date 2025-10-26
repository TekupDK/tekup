import { faker } from '@faker-js/faker';
import { VoiceAgentTester } from '../agents/voice-agent';
import { createFoodtruckFiestaTester } from '../suites/foodtruck-fiesta';

export interface LoadTestConfig {
  concurrentUsers: number;
  duration: number; // in seconds
  rampUpTime: number; // in seconds
  targetRPS: number; // requests per second
  businessType: 'foodtruck' | 'perfume' | 'construction' | 'cross-business';
  testScenario: 'voice' | 'api' | 'workflow' | 'mixed';
}

export interface LoadTestResult {
  success: boolean;
  summary: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    requestsPerSecond: number;
    errorRate: number;
  };
  details: {
    responseTimes: number[];
    errors: Array<{ timestamp: Date; error: string; count: number }>;
    businessMetrics: Record<string, any>;
  };
  recommendations: string[];
}

export class LoadTester {
  private voiceTester: VoiceAgentTester;
  private testResults: Array<{
    timestamp: Date;
    responseTime: number;
    success: boolean;
    error?: string;
    businessType: string;
  }> = [];

  constructor() {
    this.voiceTester = new VoiceAgentTester();
  }

  // Test voice agent performance under load
  async testVoiceAgentLoad(config: LoadTestConfig): Promise<LoadTestResult> {
    const startTime = Date.now();
    const endTime = startTime + (config.duration * 1000);
    const rampUpEndTime = startTime + (config.rampUpTime * 1000);
    
    const commands = this.voiceTester.getCommandsByBusiness(config.businessType);
    let totalRequests = 0;
    let successfulRequests = 0;
    let failedRequests = 0;
    const responseTimes: number[] = [];
    const errors: Map<string, { timestamp: Date; error: string; count: number }> = new Map();

    logger.info(`🚀 Starting voice agent load test for ${config.businessType}`);
    logger.info(`📊 Target: ${config.concurrentUsers} concurrent users, ${config.targetRPS} RPS`);

    while (Date.now() < endTime) {
      const currentTime = Date.now();
      const elapsed = (currentTime - startTime) / 1000;
      
      // Calculate current concurrent users based on ramp-up
      let currentConcurrentUsers = config.concurrentUsers;
      if (currentTime < rampUpEndTime) {
        currentConcurrentUsers = Math.floor(
          (config.concurrentUsers * (currentTime - startTime)) / (config.rampUpTime * 1000)
        );
      }

      // Execute concurrent requests
      const promises = Array.from({ length: currentConcurrentUsers }, async () => {
        const command = commands[Math.floor(Math.random() * commands.length)];
        const requestStart = Date.now();
        
        try {
          const response = await this.voiceTester.testVoiceRecognition(command);
          const responseTime = Date.now() - requestStart;
          
          this.testResults.push({
            timestamp: new Date(),
            responseTime,
            success: true,
            businessType: config.businessType,
          });
          
          responseTimes.push(responseTime);
          successfulRequests++;
          
          return { success: true, responseTime };
        } catch (error) {
          const responseTime = Date.now() - requestStart;
          
          this.testResults.push({
            timestamp: new Date(),
            responseTime,
            success: false,
            error: error.message,
            businessType: config.businessType,
          });
          
          responseTimes.push(responseTime);
          failedRequests++;
          
          const errorKey = error.message;
          if (errors.has(errorKey)) {
            errors.get(errorKey)!.count++;
          } else {
            errors.set(errorKey, {
              timestamp: new Date(),
              error: error.message,
              count: 1,
            });
          }
          
          return { success: false, responseTime, error: error.message };
        }
      });

      await Promise.all(promises);
      totalRequests += currentConcurrentUsers;

      // Rate limiting to achieve target RPS
      const targetDelay = 1000 / config.targetRPS;
      const actualDelay = Math.max(0, targetDelay - (Date.now() - currentTime));
      if (actualDelay > 0) {
        await new Promise(resolve => setTimeout(resolve, actualDelay));
      }
    }

    return this.generateLoadTestResult({
      totalRequests,
      successfulRequests,
      failedRequests,
      responseTimes,
      errors: Array.from(errors.values()),
      businessType: config.businessType,
    });
  }

  // Test business workflow performance under load
  async testBusinessWorkflowLoad(config: LoadTestConfig): Promise<LoadTestResult> {
    const startTime = Date.now();
    const endTime = startTime + (config.duration * 1000);
    const rampUpEndTime = startTime + (config.rampUpTime * 1000);
    
    let totalRequests = 0;
    let successfulRequests = 0;
    let failedRequests = 0;
    const responseTimes: number[] = [];
    const errors: Map<string, { timestamp: Date; error: string; count: number }> = new Map();

    logger.info(`🏢 Starting business workflow load test for ${config.businessType}`);
    logger.info(`📊 Target: ${config.concurrentUsers} concurrent users, ${config.targetRPS} RPS`);

    while (Date.now() < endTime) {
      const currentTime = Date.now();
      const elapsed = (currentTime - startTime) / 1000;
      
      // Calculate current concurrent users based on ramp-up
      let currentConcurrentUsers = config.concurrentUsers;
      if (currentTime < rampUpEndTime) {
        currentConcurrentUsers = Math.floor(
          (config.concurrentUsers * (currentTime - startTime)) / (config.rampUpTime * 1000)
        );
      }

      // Execute concurrent workflow requests
      const promises = Array.from({ length: currentConcurrentUsers }, async () => {
        const requestStart = Date.now();
        
        try {
          // Simulate different business workflows based on business type
          const workflowResult = await this.simulateBusinessWorkflow(config.businessType);
          const responseTime = Date.now() - requestStart;
          
          this.testResults.push({
            timestamp: new Date(),
            responseTime,
            success: workflowResult.success,
            businessType: config.businessType,
          });
          
          responseTimes.push(responseTime);
          if (workflowResult.success) {
            successfulRequests++;
          } else {
            failedRequests++;
            const errorKey = workflowResult.error || 'Unknown error';
            if (errors.has(errorKey)) {
              errors.get(errorKey)!.count++;
            } else {
              errors.set(errorKey, {
                timestamp: new Date(),
                error: errorKey,
                count: 1,
              });
            }
          }
          
          return { success: workflowResult.success, responseTime, error: workflowResult.error };
        } catch (error) {
          const responseTime = Date.now() - requestStart;
          
          this.testResults.push({
            timestamp: new Date(),
            responseTime,
            success: false,
            error: error.message,
            businessType: config.businessType,
          });
          
          responseTimes.push(responseTime);
          failedRequests++;
          
          const errorKey = error.message;
          if (errors.has(errorKey)) {
            errors.get(errorKey)!.count++;
          } else {
            errors.set(errorKey, {
              timestamp: new Date(),
              error: error.message,
              count: 1,
            });
          }
          
          return { success: false, responseTime, error: error.message };
        }
      });

      await Promise.all(promises);
      totalRequests += currentConcurrentUsers;

      // Rate limiting to achieve target RPS
      const targetDelay = 1000 / config.targetRPS;
      const actualDelay = Math.max(0, targetDelay - (Date.now() - currentTime));
      if (actualDelay > 0) {
        await new Promise(resolve => setTimeout(resolve, actualDelay));
      }
    }

    return this.generateLoadTestResult({
      totalRequests,
      successfulRequests,
      failedRequests,
      responseTimes,
      errors: Array.from(errors.values()),
      businessType: config.businessType,
    });
  }

  // Test mixed workload (voice + API + workflows)
  async testMixedWorkload(config: LoadTestConfig): Promise<LoadTestResult> {
    const startTime = Date.now();
    const endTime = startTime + (config.duration * 1000);
    const rampUpEndTime = startTime + (config.rampUpTime * 1000);
    
    let totalRequests = 0;
    let successfulRequests = 0;
    let failedRequests = 0;
    const responseTimes: number[] = [];
    const errors: Map<string, { timestamp: Date; error: string; count: number }> = new Map();

    logger.info(`🔄 Starting mixed workload test for ${config.businessType}`);
    logger.info(`📊 Target: ${config.concurrentUsers} concurrent users, ${config.targetRPS} RPS`);

    while (Date.now() < endTime) {
      const currentTime = Date.now();
      const elapsed = (currentTime - startTime) / 1000;
      
      // Calculate current concurrent users based on ramp-up
      let currentConcurrentUsers = config.concurrentUsers;
      if (currentTime < rampUpEndTime) {
        currentConcurrentUsers = Math.floor(
          (config.concurrentUsers * (currentTime - startTime)) / (config.rampUpTime * 1000)
        );
      }

      // Execute mixed workload requests
      const promises = Array.from({ length: currentConcurrentUsers }, async () => {
        const requestStart = Date.now();
        const workloadType = Math.random();
        
        try {
          let result;
          
          if (workloadType < 0.4) {
            // 40% voice commands
            const commands = this.voiceTester.getCommandsByBusiness(config.businessType);
            const command = commands[Math.floor(Math.random() * commands.length)];
            result = await this.voiceTester.testVoiceRecognition(command);
            result = { success: true, data: result };
          } else if (workloadType < 0.7) {
            // 30% API calls
            result = await this.simulateAPICall(config.businessType);
          } else {
            // 30% business workflows
            result = await this.simulateBusinessWorkflow(config.businessType);
          }
          
          const responseTime = Date.now() - requestStart;
          
          this.testResults.push({
            timestamp: new Date(),
            responseTime,
            success: result.success,
            businessType: config.businessType,
          });
          
          responseTimes.push(responseTime);
          if (result.success) {
            successfulRequests++;
          } else {
            failedRequests++;
            const errorKey = result.error || 'Unknown error';
            if (errors.has(errorKey)) {
              errors.get(errorKey)!.count++;
            } else {
              errors.set(errorKey, {
                timestamp: new Date(),
                error: errorKey,
                count: 1,
              });
            }
          }
          
          return { success: result.success, responseTime, error: result.error };
        } catch (error) {
          const responseTime = Date.now() - requestStart;
          
          this.testResults.push({
            timestamp: new Date(),
            responseTime,
            success: false,
            error: error.message,
            businessType: config.businessType,
          });
          
          responseTimes.push(responseTime);
          failedRequests++;
          
          const errorKey = error.message;
          if (errors.has(errorKey)) {
            errors.get(errorKey)!.count++;
          } else {
            errors.set(errorKey, {
              timestamp: new Date(),
              error: error.message,
              count: 1,
            });
          }
          
          return { success: false, responseTime, error: error.message };
        }
      });

      await Promise.all(promises);
      totalRequests += currentConcurrentUsers;

      // Rate limiting to achieve target RPS
      const targetDelay = 1000 / config.targetRPS;
      const actualDelay = Math.max(0, targetDelay - (Date.now() - currentTime));
      if (actualDelay > 0) {
        await new Promise(resolve => setTimeout(resolve, actualDelay));
      }
    }

    return this.generateLoadTestResult({
      totalRequests,
      successfulRequests,
      failedRequests,
      responseTimes,
      errors: Array.from(errors.values()),
      businessType: config.businessType,
    });
  }

  // Generate comprehensive load test results
  private generateLoadTestResult(data: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    responseTimes: number[];
    errors: Array<{ timestamp: Date; error: string; count: number }>;
    businessType: string;
  }): LoadTestResult {
    const { totalRequests, successfulRequests, failedRequests, responseTimes, errors, businessType } = data;
    
    // Calculate response time percentiles
    const sortedResponseTimes = [...responseTimes].sort((a, b) => a - b);
    const p95Index = Math.floor(sortedResponseTimes.length * 0.95);
    const p99Index = Math.floor(sortedResponseTimes.length * 0.99);
    
    const averageResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    const p95ResponseTime = sortedResponseTimes[p95Index] || 0;
    const p99ResponseTime = sortedResponseTimes[p99Index] || 0;
    
    const requestsPerSecond = totalRequests / (this.testResults.length > 0 ? 
      (this.testResults[this.testResults.length - 1].timestamp.getTime() - this.testResults[0].timestamp.getTime()) / 1000 : 1);
    
    const errorRate = (failedRequests / totalRequests) * 100;
    
    // Generate recommendations
    const recommendations: string[] = [];
    
    if (errorRate > 5) {
      recommendations.push('Error rate is high (>5%). Investigate system stability and error handling.');
    }
    
    if (p95ResponseTime > 2000) {
      recommendations.push('95th percentile response time is high (>2s). Consider performance optimization.');
    }
    
    if (p99ResponseTime > 5000) {
      recommendations.push('99th percentile response time is very high (>5s). Investigate performance bottlenecks.');
    }
    
    if (averageResponseTime > 1000) {
      recommendations.push('Average response time is high (>1s). Consider caching or optimization.');
    }
    
    if (requestsPerSecond < 10) {
      recommendations.push('Throughput is low (<10 RPS). Consider scaling or optimization.');
    }

    return {
      success: errorRate < 10 && p95ResponseTime < 5000,
      summary: {
        totalRequests,
        successfulRequests,
        failedRequests,
        averageResponseTime: Math.round(averageResponseTime),
        p95ResponseTime: Math.round(p95ResponseTime),
        p99ResponseTime: Math.round(p99ResponseTime),
        requestsPerSecond: Math.round(requestsPerSecond * 100) / 100,
        errorRate: Math.round(errorRate * 100) / 100,
      },
      details: {
        responseTimes,
        errors,
        businessMetrics: {
          businessType,
          testDuration: this.testResults.length > 0 ? 
            (this.testResults[this.testResults.length - 1].timestamp.getTime() - this.testResults[0].timestamp.getTime()) / 1000 : 0,
          peakConcurrentUsers: Math.max(...Array.from({ length: Math.ceil(this.testResults.length / 100) }, (_, i) => 
            this.testResults.slice(i * 100, (i + 1) * 100).length
          )),
        },
      },
      recommendations,
    };
  }

  // Simulate business workflow execution
  private async simulateBusinessWorkflow(businessType: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Simulate different workflow complexities based on business type
      const workflowComplexity = {
        foodtruck: 3,
        perfume: 2,
        construction: 4,
        'cross-business': 5,
      }[businessType] || 3;

      // Simulate workflow steps
      for (let i = 0; i < workflowComplexity; i++) {
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
        
        // Simulate occasional failures
        if (Math.random() < 0.05) { // 5% failure rate
          throw new Error(`Workflow step ${i + 1} failed`);
        }
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Simulate API call execution
  private async simulateAPICall(businessType: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Simulate API call with varying response times
      const baseDelay = {
        foodtruck: 100,
        perfume: 80,
        construction: 120,
        'cross-business': 150,
      }[businessType] || 100;

      const delay = baseDelay + Math.random() * 100;
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Simulate occasional API failures
      if (Math.random() < 0.03) { // 3% failure rate
        throw new Error('API call failed');
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get test results for analysis
  getTestResults() {
    return [...this.testResults];
  }

  // Clear test results
  clearTestResults() {
    this.testResults = [];
  }
}

// Factory function for creating load testers
export function createLoadTester(): LoadTester {
import { createLogger } from '@tekup/shared';
const logger = createLogger('packages-testing-src-performan');

  return new LoadTester();
}