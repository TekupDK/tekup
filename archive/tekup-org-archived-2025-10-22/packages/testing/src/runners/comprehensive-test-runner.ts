import { PrismaClient } from '@prisma/client';
import { 
  createFoodtruckFiestaTester,
  createEssenzaPerfumeTester,
  createRendetaljeTester,
  createCrossBusinessTester,
  createVoiceAgentTester,
  createMobileAgentTester,
  createMCPServerTester,
  createLoadTester,
} from '../index';

export interface TestSuiteResult {
  suite: string;
  success: boolean;
  tests: Array<{ name: string; passed: boolean; details: any }>;
  duration: number;
  errors: string[];
}

export interface AgentTestResult {
  agent: string;
  success: boolean;
  tests: Array<{ name: string; passed: boolean; details: any }>;
  duration: number;
  errors: string[];
}

export interface PerformanceTestResult {
  scenario: string;
  success: boolean;
  metrics: {
    totalRequests: number;
    successRate: number;
    averageResponseTime: number;
    p95ResponseTime: number;
    errorRate: number;
  };
  duration: number;
  recommendations: string[];
}

export interface ComprehensiveTestReport {
  summary: {
    totalSuites: number;
    passedSuites: number;
    totalTests: number;
    passedTests: number;
    overallSuccess: boolean;
    totalDuration: number;
  };
  businessSuites: TestSuiteResult[];
  aiAgents: AgentTestResult[];
  performance: PerformanceTestResult[];
  recommendations: string[];
  timestamp: Date;
}

export class ComprehensiveTestRunner {
  private prisma: PrismaClient;
  private results: ComprehensiveTestReport;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.results = {
      summary: {
        totalSuites: 0,
        passedSuites: 0,
        totalTests: 0,
        passedTests: 0,
        overallSuccess: false,
        totalDuration: 0,
      },
      businessSuites: [],
      aiAgents: [],
      performance: [],
      recommendations: [],
      timestamp: new Date(),
    };
  }

  // Run all business suite tests
  async runBusinessSuiteTests(): Promise<TestSuiteResult[]> {
    const results: TestSuiteResult[] = [];
    const startTime = Date.now();

    // Test Foodtruck Fiesta
    try {
      logger.info('🧪 Testing Foodtruck Fiesta business suite...');
      const foodtruckTester = createFoodtruckFiestaTester(this.prisma);
      
      const foodtruckResult = await this.runFoodtruckTests(foodtruckTester);
      results.push(foodtruckResult);
      
      logger.info(`✅ Foodtruck Fiesta: ${foodtruckResult.success ? 'PASSED' : 'FAILED'}`);
    } catch (error) {
      logger.error(`❌ Foodtruck Fiesta test failed: ${error.message}`);
      results.push({
        suite: 'Foodtruck Fiesta',
        success: false,
        tests: [],
        duration: 0,
        errors: [error.message],
      });
    }

    // Test Essenza Perfume
    try {
      logger.info('🧪 Testing Essenza Perfume business suite...');
      const perfumeTester = createEssenzaPerfumeTester(this.prisma);
      
      const perfumeResult = await this.runPerfumeTests(perfumeTester);
      results.push(perfumeResult);
      
      logger.info(`✅ Essenza Perfume: ${perfumeResult.success ? 'PASSED' : 'FAILED'}`);
    } catch (error) {
      logger.error(`❌ Essenza Perfume test failed: ${error.message}`);
      results.push({
        suite: 'Essenza Perfume',
        success: false,
        tests: [],
        duration: 0,
        errors: [error.message],
      });
    }

    // Test Rendetalje
    try {
      logger.info('🧪 Testing Rendetalje business suite...');
      const rendetaljeTester = createRendetaljeTester(this.prisma);
      
      const rendetaljeResult = await this.runRendetaljeTests(rendetaljeTester);
      results.push(rendetaljeResult);
      
      logger.info(`✅ Rendetalje: ${rendetaljeResult.success ? 'PASSED' : 'FAILED'}`);
    } catch (error) {
      logger.error(`❌ Rendetalje test failed: ${error.message}`);
      results.push({
        suite: 'Rendetalje',
        success: false,
        tests: [],
        duration: 0,
        errors: [error.message],
      });
    }

    // Test Cross-Business
    try {
      logger.info('🧪 Testing Cross-Business suite...');
      const crossBusinessTester = createCrossBusinessTester(this.prisma);
      
      const crossBusinessResult = await this.runCrossBusinessTests(crossBusinessTester);
      results.push(crossBusinessResult);
      
      logger.info(`✅ Cross-Business: ${crossBusinessResult.success ? 'PASSED' : 'FAILED'}`);
    } catch (error) {
      logger.error(`❌ Cross-Business test failed: ${error.message}`);
      results.push({
        suite: 'Cross-Business',
        success: false,
        tests: [],
        duration: 0,
        errors: [error.message],
      });
    }

    const totalDuration = Date.now() - startTime;
    logger.info(`🏁 Business suite tests completed in ${totalDuration}ms`);

    return results;
  }

  // Run all AI agent tests
  async runAIAgentTests(): Promise<AgentTestResult[]> {
    const results: AgentTestResult[] = [];
    const startTime = Date.now();

    // Test Voice Agent
    try {
      logger.info('🤖 Testing Voice Agent...');
      const voiceTester = createVoiceAgentTester();
      
      const voiceResult = await this.runVoiceAgentTests(voiceTester);
      results.push(voiceResult);
      
      logger.info(`✅ Voice Agent: ${voiceResult.success ? 'PASSED' : 'FAILED'}`);
    } catch (error) {
      logger.error(`❌ Voice Agent test failed: ${error.message}`);
      results.push({
        agent: 'Voice Agent',
        success: false,
        tests: [],
        duration: 0,
        errors: [error.message],
      });
    }

    // Test Mobile Agent
    try {
      logger.info('📱 Testing Mobile Agent...');
      const mobileTester = createMobileAgentTester();
      
      const mobileResult = await this.runMobileAgentTests(mobileTester);
      results.push(mobileResult);
      
      logger.info(`✅ Mobile Agent: ${mobileResult.success ? 'PASSED' : 'FAILED'}`);
    } catch (error) {
      logger.error(`❌ Mobile Agent test failed: ${error.message}`);
      results.push({
        agent: 'Mobile Agent',
        success: false,
        tests: [],
        duration: 0,
        errors: [error.message],
      });
    }

    // Test MCP Server
    try {
      logger.info('🖥️ Testing MCP Server...');
      const mcpTester = createMCPServerTester();
      
      const mcpResult = await this.runMCPServerTests(mcpTester);
      results.push(mcpResult);
      
      logger.info(`✅ MCP Server: ${mcpResult.success ? 'PASSED' : 'FAILED'}`);
    } catch (error) {
      logger.error(`❌ MCP Server test failed: ${error.message}`);
      results.push({
        agent: 'MCP Server',
        success: false,
        tests: [],
        duration: 0,
        errors: [error.message],
      });
    }

    const totalDuration = Date.now() - startTime;
    logger.info(`🏁 AI Agent tests completed in ${totalDuration}ms`);

    return results;
  }

  // Run performance tests
  async runPerformanceTests(): Promise<PerformanceTestResult[]> {
    const results: PerformanceTestResult[] = [];
    const startTime = Date.now();

    try {
      logger.info('⚡ Running performance tests...');
      const loadTester = createLoadTester();
      
      // Test voice agent performance
      const voicePerformance = await this.runVoicePerformanceTest(loadTester);
      results.push(voicePerformance);
      
      // Test business workflow performance
      const workflowPerformance = await this.runWorkflowPerformanceTest(loadTester);
      results.push(workflowPerformance);
      
      // Test mixed workload performance
      const mixedPerformance = await this.runMixedWorkloadTest(loadTester);
      results.push(mixedPerformance);
      
      logger.info(`✅ Performance tests completed`);
    } catch (error) {
      logger.error(`❌ Performance tests failed: ${error.message}`);
    }

    const totalDuration = Date.now() - startTime;
    logger.info(`🏁 Performance tests completed in ${totalDuration}ms`);

    return results;
  }

  // Run comprehensive test suite
  async runComprehensiveTests(): Promise<ComprehensiveTestReport> {
    logger.info('🚀 Starting comprehensive test suite...\n');
    const overallStartTime = Date.now();

    try {
      // Run business suite tests
      this.results.businessSuites = await this.runBusinessSuiteTests();
      
      // Run AI agent tests
      this.results.aiAgents = await this.runAIAgentTests();
      
      // Run performance tests
      this.results.performance = await this.runPerformanceTests();
      
      // Calculate summary
      this.calculateSummary();
      
      // Generate recommendations
      this.generateRecommendations();
      
    } catch (error) {
      logger.error(`❌ Comprehensive test suite failed: ${error.message}`);
      this.results.summary.overallSuccess = false;
    }

    const totalDuration = Date.now() - overallStartTime;
    this.results.summary.totalDuration = totalDuration;
    this.results.timestamp = new Date();

    logger.info('\n🏁 Comprehensive test suite completed!');
    this.printSummary();
    
    return this.results;
  }

  // Helper methods for running specific test suites
  private async runFoodtruckTests(tester: any): Promise<TestSuiteResult> {
    const startTime = Date.now();
    const tests = [];
    const errors: string[] = [];

    try {
      // Test location services
      const locationResult = await tester.testLocationServices();
      tests.push({
        name: 'Location Services',
        passed: locationResult.success,
        details: locationResult,
      });

      // Test mobile ordering
      const orderingResult = await tester.testMobileOrdering();
      tests.push({
        name: 'Mobile Ordering',
        passed: orderingResult.success,
        details: orderingResult,
      });

      // Test payment processing
      const paymentResult = await tester.testPaymentProcessing();
      tests.push({
        name: 'Payment Processing',
        passed: paymentResult.success,
        details: paymentResult,
      });

      // Test voice integration
      const voiceResult = await tester.testVoiceIntegration();
      tests.push({
        name: 'Voice Integration',
        passed: voiceResult.success,
        details: voiceResult,
      });

      // Test complete workflow
      const workflowResult = await tester.testCompleteWorkflow();
      tests.push({
        name: 'Complete Workflow',
        passed: workflowResult.success,
        details: workflowResult,
      });

    } catch (error) {
      errors.push(error.message);
    }

    const duration = Date.now() - startTime;
    const success = tests.every(test => test.passed) && errors.length === 0;

    return {
      suite: 'Foodtruck Fiesta',
      success,
      tests,
      duration,
      errors,
    };
  }

  private async runPerfumeTests(tester: any): Promise<TestSuiteResult> {
    const startTime = Date.now();
    const tests = [];
    const errors: string[] = [];

    try {
      // Test inventory management
      const inventoryResult = await tester.testInventoryManagement();
      tests.push({
        name: 'Inventory Management',
        passed: inventoryResult.success,
        details: inventoryResult,
      });

      // Test customer recommendations
      const recommendationsResult = await tester.testCustomerRecommendations();
      tests.push({
        name: 'Customer Recommendations',
        passed: recommendationsResult.success,
        details: recommendationsResult,
      });

      // Test e-commerce integration
      const ecommerceResult = await tester.testEcommerceIntegration();
      tests.push({
        name: 'E-commerce Integration',
        passed: ecommerceResult.success,
        details: ecommerceResult,
      });

      // Test voice integration
      const voiceResult = await tester.testVoiceIntegration();
      tests.push({
        name: 'Voice Integration',
        passed: voiceResult.success,
        details: voiceResult,
      });

      // Test complete workflow
      const workflowResult = await tester.testCompleteWorkflow();
      tests.push({
        name: 'Complete Workflow',
        passed: workflowResult.success,
        details: workflowResult,
      });

    } catch (error) {
      errors.push(error.message);
    }

    const duration = Date.now() - startTime;
    const success = tests.every(test => test.passed) && errors.length === 0;

    return {
      suite: 'Essenza Perfume',
      success,
      tests,
      duration,
      errors,
    };
  }

  private async runRendetaljeTests(tester: any): Promise<TestSuiteResult> {
    const startTime = Date.now();
    const tests = [];
    const errors: string[] = [];

    try {
      // Test project management
      const projectResult = await tester.testProjectManagement();
      tests.push({
        name: 'Project Management',
        passed: projectResult.success,
        details: projectResult,
      });

      // Test customer communications
      const communicationResult = await tester.testCustomerCommunications();
      tests.push({
        name: 'Customer Communications',
        passed: communicationResult.success,
        details: communicationResult,
      });

      // Test scheduling system
      const schedulingResult = await tester.testSchedulingSystem();
      tests.push({
        name: 'Scheduling System',
        passed: schedulingResult.success,
        details: schedulingResult,
      });

      // Test voice integration
      const voiceResult = await tester.testVoiceIntegration();
      tests.push({
        name: 'Voice Integration',
        passed: voiceResult.success,
        details: voiceResult,
      });

      // Test complete workflow
      const workflowResult = await tester.testCompleteWorkflow();
      tests.push({
        name: 'Complete Workflow',
        passed: workflowResult.success,
        details: workflowResult,
      });

    } catch (error) {
      errors.push(error.message);
    }

    const duration = Date.now() - startTime;
    const success = tests.every(test => test.passed) && errors.length === 0;

    return {
      suite: 'Rendetalje',
      success,
      tests,
      duration,
      errors,
    };
  }

  private async runCrossBusinessTests(tester: any): Promise<TestSuiteResult> {
    const startTime = Date.now();
    const tests = [];
    const errors: string[] = [];

    try {
      // Test analytics dashboard
      const analyticsResult = await tester.testAnalyticsDashboard();
      tests.push({
        name: 'Analytics Dashboard',
        passed: analyticsResult.success,
        details: analyticsResult,
      });

      // Test customer synchronization
      const syncResult = await tester.testCustomerSync();
      tests.push({
        name: 'Customer Synchronization',
        passed: syncResult.success,
        details: syncResult,
      });

      // Test financial consolidation
      const financeResult = await tester.testFinancialConsolidation();
      tests.push({
        name: 'Financial Consolidation',
        passed: financeResult.success,
        details: financeResult,
      });

      // Test cross-business workflows
      const workflowResult = await tester.testCrossBusinessWorkflows();
      tests.push({
        name: 'Cross-Business Workflows',
        passed: workflowResult.success,
        details: workflowResult,
      });

      // Test voice integration
      const voiceResult = await tester.testVoiceIntegration();
      tests.push({
        name: 'Voice Integration',
        passed: voiceResult.success,
        details: voiceResult,
      });

      // Test complete workflow
      const completeWorkflowResult = await tester.testCompleteWorkflow();
      tests.push({
        name: 'Complete Workflow',
        passed: completeWorkflowResult.success,
        details: completeWorkflowResult,
      });

    } catch (error) {
      errors.push(error.message);
    }

    const duration = Date.now() - startTime;
    const success = tests.every(test => test.passed) && errors.length === 0;

    return {
      suite: 'Cross-Business',
      success,
      tests,
      duration,
      errors,
    };
  }

  // Helper methods for running AI agent tests
  private async runVoiceAgentTests(tester: any): Promise<AgentTestResult> {
    const startTime = Date.now();
    const tests = [];
    const errors: string[] = [];

    try {
      // Test voice recognition
      const recognitionResult = await tester.testVoiceRecognition();
      tests.push({
        name: 'Voice Recognition',
        passed: recognitionResult.success,
        details: recognitionResult,
      });

      // Test intent classification
      const intentResult = await tester.testIntentClassification();
      tests.push({
        name: 'Intent Classification',
        passed: intentResult.success,
        details: intentResult,
      });

      // Test entity extraction
      const entityResult = await tester.testEntityExtraction();
      tests.push({
        name: 'Entity Extraction',
        passed: entityResult.success,
        details: entityResult,
      });

      // Test Danish language processing
      const danishResult = await tester.testDanishLanguageProcessing();
      tests.push({
        name: 'Danish Language Processing',
        passed: danishResult.success,
        details: danishResult,
      });

    } catch (error) {
      errors.push(error.message);
    }

    const duration = Date.now() - startTime;
    const success = tests.every(test => test.passed) && errors.length === 0;

    return {
      agent: 'Voice Agent',
      success,
      tests,
      duration,
      errors,
    };
  }

  private async runMobileAgentTests(tester: any): Promise<AgentTestResult> {
    const startTime = Date.now();
    const tests = [];
    const errors: string[] = [];

    try {
      // Test cross-platform compatibility
      const compatibilityResult = await tester.testCrossPlatformCompatibility();
      tests.push({
        name: 'Cross-Platform Compatibility',
        passed: compatibilityResult.success,
        details: compatibilityResult,
      });

      // Test network resilience
      const resilienceResult = await tester.testNetworkResilience('iphone-15-pro');
      tests.push({
        name: 'Network Resilience',
        passed: resilienceResult.success,
        details: resilienceResult,
      });

      // Test user interactions
      const interactionResult = await tester.testUserInteractions('iphone-15-pro');
      tests.push({
        name: 'User Interactions',
        passed: interactionResult.success,
        details: interactionResult,
      });

      // Test offline functionality
      const offlineResult = await tester.testOfflineFunctionality('iphone-15-pro');
      tests.push({
        name: 'Offline Functionality',
        passed: offlineResult.success,
        details: offlineResult,
      });

      // Test battery efficiency
      const batteryResult = await tester.testBatteryEfficiency('iphone-15-pro');
      tests.push({
        name: 'Battery Efficiency',
        passed: batteryResult.success,
        details: batteryResult,
      });

    } catch (error) {
      errors.push(error.message);
    }

    const duration = Date.now() - startTime;
    const success = tests.every(test => test.passed) && errors.length === 0;

    return {
      agent: 'Mobile Agent',
      success,
      tests,
      duration,
      errors,
    };
  }

  private async runMCPServerTests(tester: any): Promise<AgentTestResult> {
    const startTime = Date.now();
    const tests = [];
    const errors: string[] = [];

    try {
      // Test server deployment
      const deploymentResult = await tester.testServerDeployment('mcp-primary');
      tests.push({
        name: 'Server Deployment',
        passed: deploymentResult.success,
        details: deploymentResult,
      });

      // Test health checks
      const healthResult = await tester.testHealthChecks('mcp-primary');
      tests.push({
        name: 'Health Checks',
        passed: healthResult.success,
        details: healthResult,
      });

      // Test workflow execution
      const workflowResult = await tester.testWorkflowExecution('mcp-primary', 'test-workflow');
      tests.push({
        name: 'Workflow Execution',
        passed: workflowResult.success,
        details: workflowResult,
      });

      // Test cross-agent communication
      const communicationResult = await tester.testCrossAgentCommunication('mcp-primary');
      tests.push({
        name: 'Cross-Agent Communication',
        passed: communicationResult.success,
        details: communicationResult,
      });

      // Test server performance
      const performanceResult = await tester.testServerPerformance('mcp-primary', 'medium');
      tests.push({
        name: 'Server Performance',
        passed: performanceResult.success,
        details: performanceResult,
      });

    } catch (error) {
      errors.push(error.message);
    }

    const duration = Date.now() - startTime;
    const success = tests.every(test => test.passed) && errors.length === 0;

    return {
      agent: 'MCP Server',
      success,
      tests,
      duration,
      errors,
    };
  }

  // Helper methods for running performance tests
  private async runVoicePerformanceTest(loadTester: any): Promise<PerformanceTestResult> {
    const startTime = Date.now();
    
    const result = await loadTester.testVoiceAgentLoad(100, 50);
    
    const duration = Date.now() - startTime;
    
    return {
      scenario: 'Voice Agent Load Test',
      success: result.success,
      metrics: {
        totalRequests: result.totalRequests,
        successRate: result.successRate,
        averageResponseTime: result.averageResponseTime,
        p95ResponseTime: result.p95ResponseTime,
        errorRate: result.errorRate,
      },
      duration,
      recommendations: result.recommendations,
    };
  }

  private async runWorkflowPerformanceTest(loadTester: any): Promise<PerformanceTestResult> {
    const startTime = Date.now();
    
    const result = await loadTester.testBusinessWorkflowLoad(50, 25);
    
    const duration = Date.now() - startTime;
    
    return {
      scenario: 'Business Workflow Load Test',
      success: result.success,
      metrics: {
        totalRequests: result.totalRequests,
        successRate: result.successRate,
        averageResponseTime: result.averageResponseTime,
        p95ResponseTime: result.p95ResponseTime,
        errorRate: result.errorRate,
      },
      duration,
      recommendations: result.recommendations,
    };
  }

  private async runMixedWorkloadTest(loadTester: any): Promise<PerformanceTestResult> {
    const startTime = Date.now();
    
    const result = await loadTester.testMixedWorkload(200, 100);
    
    const duration = Date.now() - startTime;
    
    return {
      scenario: 'Mixed Workload Test',
      success: result.success,
      metrics: {
        totalRequests: result.totalRequests,
        successRate: result.successRate,
        averageResponseTime: result.averageResponseTime,
        p95ResponseTime: result.p95ResponseTime,
        errorRate: result.errorRate,
      },
      duration,
      recommendations: result.recommendations,
    };
  }

  // Calculate summary statistics
  private calculateSummary(): void {
    const businessTests = this.results.businessSuites.flatMap(suite => suite.tests);
    const agentTests = this.results.aiAgents.flatMap(agent => agent.tests);
    const allTests = [...businessTests, ...agentTests];

    this.results.summary = {
      totalSuites: this.results.businessSuites.length + this.results.aiAgents.length,
      passedSuites: this.results.businessSuites.filter(s => s.success).length + 
                   this.results.aiAgents.filter(a => a.success).length,
      totalTests: allTests.length,
      passedTests: allTests.filter(t => t.passed).length,
      overallSuccess: this.results.businessSuites.every(s => s.success) && 
                     this.results.aiAgents.every(a => a.success),
      totalDuration: this.results.businessSuites.reduce((sum, s) => sum + s.duration, 0) +
                    this.results.aiAgents.reduce((sum, a) => sum + a.duration, 0),
    };
  }

  // Generate recommendations based on test results
  private generateRecommendations(): void {
    const recommendations: string[] = [];

    // Business suite recommendations
    this.results.businessSuites.forEach(suite => {
      if (!suite.success) {
        recommendations.push(`Focus on fixing issues in ${suite.suite} business suite`);
      }
    });

    // AI agent recommendations
    this.results.aiAgents.forEach(agent => {
      if (!agent.success) {
        recommendations.push(`Improve ${agent.agent} testing and functionality`);
      }
    });

    // Performance recommendations
    this.results.performance.forEach(perf => {
      if (!perf.success) {
        recommendations.push(`Optimize performance for ${perf.scenario}`);
      }
    });

    // General recommendations
    if (this.results.summary.passedTests / this.results.summary.totalTests < 0.9) {
      recommendations.push('Overall test coverage needs improvement');
    }

    if (this.results.summary.totalDuration > 300000) { // 5 minutes
      recommendations.push('Consider optimizing test execution time');
    }

    this.results.recommendations = recommendations;
  }

  // Print summary to console
  private printSummary(): void {
    logger.info('\n📊 COMPREHENSIVE TEST SUMMARY');
    logger.info('================================');
    logger.info(`Overall Success: ${this.results.summary.overallSuccess ? '✅ PASSED' : '❌ FAILED'}`);
    logger.info(`Total Suites: ${this.results.summary.totalSuites}`);
    logger.info(`Passed Suites: ${this.results.summary.passedSuites}/${this.results.summary.totalSuites}`);
    logger.info(`Total Tests: ${this.results.summary.totalTests}`);
    logger.info(`Passed Tests: ${this.results.summary.passedTests}/${this.results.summary.totalTests}`);
    logger.info(`Total Duration: ${Math.round(this.results.summary.totalDuration / 1000)}s`);
    logger.info(`Success Rate: ${Math.round((this.results.summary.passedTests / this.results.summary.totalTests) * 100)}%`);

    if (this.results.recommendations.length > 0) {
      logger.info('\n💡 RECOMMENDATIONS:');
      this.results.recommendations.forEach(rec => logger.info(`  • ${rec}`));
    }
  }

  // Get test results
  getResults(): ComprehensiveTestReport {
    return this.results;
  }

  // Export results to JSON
  exportResults(): string {
    return JSON.stringify(this.results, null, 2);
  }
}

// Factory function for creating comprehensive test runners
export function createComprehensiveTestRunner(prisma: PrismaClient): ComprehensiveTestRunner {
import { createLogger } from '@tekup/shared';
const logger = createLogger('packages-testing-src-runners-c');

  return new ComprehensiveTestRunner(prisma);
}