#!/usr/bin/env node

/**
 * Demo script showcasing the comprehensive testing infrastructure
 * Run with: npx tsx demo.ts
 */

import { createComprehensiveTestRunner } from './src/runners/comprehensive-test-runner';
import { createVoiceAgentTester } from './src/agents/voice-agent';
import { createMobileAgentTester } from './src/agents/mobile-agent';
import { createMCPServerTester } from './src/agents/mcp-server';
import { createLoadTester } from './src/performance/load-tests';
import { createSecurityTester } from './src/security/security-tester';
import { createPerformanceMonitor } from './src/performance/performance-monitor';
import { createChaosEngineer } from './src/chaos/chaos-engineer';
import { createAnalyticsEngine } from './src/analytics/analytics-engine';
import { createProductionValidator } from './src/production/production-validator';

// Mock Prisma client for demo purposes
const mockPrisma = {} as any;

async function runDemo() {
  console.log('🚀 TEKUP-ORG COMPREHENSIVE TESTING DEMO');
  console.log('=========================================\n');

  try {
    // 1. Demonstrate Voice Agent Testing
    console.log('🎤 VOICE AGENT TESTING DEMO');
    console.log('----------------------------');
    const voiceTester = createVoiceAgentTester();
    
    // Test Danish language processing
    const danishResults = await voiceTester.testDanishLanguageProcessing();
    console.log(`✅ Danish language processing: ${danishResults.results.length} commands tested`);
    
    // Test voice recognition
    const recognitionResult = await voiceTester.testVoiceRecognition({
      text: 'Vis alle leads',
      expectedIntent: 'list_leads',
      business: 'foodtruck',
    });
    console.log(`✅ Voice recognition: ${recognitionResult.success ? 'PASSED' : 'FAILED'}`);
    
    // Test intent classification
    const intentResult = await voiceTester.testIntentClassification({
      text: 'Opret ny lead',
      expectedIntent: 'create_lead',
      business: 'perfume',
    });
    console.log(`✅ Intent classification: ${intentResult.success ? 'PASSED' : 'FAILED'}`);
    
    console.log('');

    // 2. Demonstrate Mobile Agent Testing
    console.log('📱 MOBILE AGENT TESTING DEMO');
    console.log('------------------------------');
    const mobileTester = createMobileAgentTester();
    
    // Test cross-platform compatibility
    const compatibilityResult = await mobileTester.testCrossPlatformCompatibility();
    console.log(`✅ Cross-platform compatibility: ${compatibilityResult.success ? 'PASSED' : 'FAILED'}`);
    console.log(`   Tested ${compatibilityResult.results.length} devices`);
    
    // Test network resilience
    const resilienceResult = await mobileTester.testNetworkResilience('iphone-15-pro');
    console.log(`✅ Network resilience: ${resilienceResult.success ? 'PASSED' : 'FAILED'}`);
    console.log(`   Tested ${resilienceResult.results.length} network conditions`);
    
    // Test user interactions
    const interactionResult = await mobileTester.testUserInteractions('iphone-15-pro', 10);
    console.log(`✅ User interactions: ${interactionResult.success ? 'PASSED' : 'FAILED'}`);
    console.log(`   Tested ${interactionResult.interactions.length} interactions`);
    
    console.log('');

    // 3. Demonstrate MCP Server Testing
    console.log('🖥️ MCP SERVER TESTING DEMO');
    console.log('-----------------------------');
    const mcpTester = createMCPServerTester();
    
    // Test server deployment
    const deploymentResult = await mcpTester.testServerDeployment('mcp-primary');
    console.log(`✅ Server deployment: ${deploymentResult.success ? 'PASSED' : 'FAILED'}`);
    console.log(`   ${deploymentResult.tests.filter(t => t.passed).length}/${deploymentResult.tests.length} tests passed`);
    
    // Test health checks
    const healthResult = await mcpTester.testHealthChecks('mcp-primary');
    console.log(`✅ Health checks: ${healthResult.success ? 'PASSED' : 'FAILED'}`);
    console.log(`   Server status: ${healthResult.health.status}`);
    
    // Test workflow execution
    const workflowResult = await mcpTester.testWorkflowExecution('mcp-primary', 'demo-workflow');
    console.log(`✅ Workflow execution: ${workflowResult.success ? 'PASSED' : 'FAILED'}`);
    console.log(`   Workflow duration: ${workflowResult.performance.totalDuration}s`);
    
    console.log('');

    // 4. Demonstrate Performance Testing
    console.log('⚡ PERFORMANCE TESTING DEMO');
    console.log('----------------------------');
    const loadTester = createLoadTester();
    
    // Test voice agent load
    const voiceLoadResult = await loadTester.testVoiceAgentLoad(50, 25);
    console.log(`✅ Voice agent load test: ${voiceLoadResult.success ? 'PASSED' : 'FAILED'}`);
    console.log(`   ${voiceLoadResult.totalRequests} requests, ${Math.round(voiceLoadResult.successRate * 100)}% success rate`);
    
    // Test business workflow load
    const workflowLoadResult = await loadTester.testBusinessWorkflowLoad(25, 10);
    console.log(`✅ Business workflow load test: ${workflowLoadResult.success ? 'PASSED' : 'FAILED'}`);
    console.log(`   ${workflowLoadResult.totalRequests} requests, ${Math.round(workflowLoadResult.successRate * 100)}% success rate`);
    
    // Test mixed workload
    const mixedLoadResult = await loadTester.testMixedWorkload(100, 50);
    console.log(`✅ Mixed workload test: ${mixedLoadResult.success ? 'PASSED' : 'FAILED'}`);
    console.log(`   ${mixedLoadResult.totalRequests} requests, ${Math.round(mixedLoadResult.successRate * 100)}% success rate`);
    
    console.log('');

    // 5. Demonstrate Comprehensive Test Runner
    console.log('🏃 COMPREHENSIVE TEST RUNNER DEMO');
    console.log('----------------------------------');
    const comprehensiveRunner = createComprehensiveTestRunner(mockPrisma);
    
    // Run a subset of tests for demo purposes
    console.log('Running business suite tests...');
    const businessResults = await comprehensiveRunner.runBusinessSuiteTests();
    console.log(`✅ Business suites tested: ${businessResults.length}`);
    console.log(`   Passed: ${businessResults.filter(r => r.success).length}`);
    
    console.log('Running AI agent tests...');
    const agentResults = await comprehensiveRunner.runAIAgentTests();
    console.log(`✅ AI agents tested: ${agentResults.length}`);
    console.log(`   Passed: ${agentResults.filter(r => r.success).length}`);
    
    console.log('Running performance tests...');
    const performanceResults = await comprehensiveRunner.runPerformanceTests();
    console.log(`✅ Performance scenarios tested: ${performanceResults.length}`);
    console.log(`   Passed: ${performanceResults.filter(r => r.success).length}`);
    
    console.log('');

    // 6. Demonstrate Security Testing
    console.log('🔒 SECURITY TESTING DEMO');
    console.log('-------------------------');
    const securityTester = createSecurityTester(mockPrisma);
    
    // Run security assessment
    const securityAssessment = await securityTester.runSecurityAssessment();
    console.log(`✅ Security assessment: ${securityAssessment.results.length} tests completed`);
    console.log(`   Passed: ${securityAssessment.results.filter(r => r.success).length}`);
    console.log(`   Vulnerabilities found: ${securityAssessment.vulnerabilities.length}`);
    console.log(`   Overall security score: ${securityAssessment.metrics.overallScore}/100`);
    
    console.log('');

    // 7. Demonstrate Performance Monitoring
    console.log('📈 PERFORMANCE MONITORING DEMO');
    console.log('--------------------------------');
    const performanceMonitor = createPerformanceMonitor();
    
    // Start monitoring
    performanceMonitor.startCollection(5000); // Collect every 5 seconds
    
    // Simulate some performance data
    setTimeout(() => {
      performanceMonitor.collectData('unit-tests', 'performance', {
        responseTime: 150,
        throughput: 1000,
        errorRate: 0.5,
        uptime: 99.9,
      });
      
      performanceMonitor.collectData('voice-agent', 'ai-agents', {
        responseTime: 800,
        accuracy: 95.2,
        latency: 120,
        uptime: 99.8,
      });
      
      performanceMonitor.collectData('business-suites', 'business-logic', {
        orderVolume: 150,
        customerSatisfaction: 88.5,
        responseTime: 450,
        errorRate: 1.2,
        uptime: 99.7,
      });
    }, 2000);
    
    // Wait for monitoring to collect data
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Stop monitoring and generate report
    performanceMonitor.stopCollection();
    const performanceReport = performanceMonitor.generateReport('daily');
    console.log(`✅ Performance monitoring: ${performanceReport.summary.totalTests} data points collected`);
    console.log(`   System health: ${performanceReport.systemHealth.overall}/100`);
    console.log(`   Active alerts: ${performanceMonitor.getDashboardData().activeAlerts.length}`);
    
    console.log('');

    // 8. Demonstrate Chaos Engineering
    console.log('🧪 CHAOS ENGINEERING DEMO');
    console.log('--------------------------');
    const chaosEngineer = createChaosEngineer();
    
    // Run resilience test suite
    const chaosReport = await chaosEngineer.runResilienceTestSuite();
    console.log(`✅ Chaos engineering: ${chaosReport.summary.totalExperiments} experiments completed`);
    console.log(`   Successful: ${chaosReport.summary.successfulExperiments}`);
    console.log(`   Failed: ${chaosReport.summary.failedExperiments}`);
    console.log(`   System resilience score: ${chaosReport.summary.systemResilienceScore}/100`);
    console.log(`   Average recovery time: ${chaosReport.summary.averageRecoveryTime}s`);
    
    console.log('');

    // 9. Demonstrate Analytics Engine
    console.log('📊 ANALYTICS ENGINE DEMO');
    console.log('-------------------------');
    const analyticsEngine = createAnalyticsEngine();
    
    // Start analytics collection
    analyticsEngine.startCollection(3000); // Collect every 3 seconds
    
    // Simulate analytics data collection
    setTimeout(() => {
      analyticsEngine.collectData('unit-tests', 'reliability', {
        success: 1,
        responseTime: 120,
        coverage: 95.8,
        uptime: 100,
      });
      
      analyticsEngine.collectData('voice-agent', 'ai-agents', {
        responseTime: 750,
        accuracy: 94.5,
        uptime: 99.9,
        orderVolume: 25,
        customerSatisfaction: 92.0,
      });
      
      analyticsEngine.collectData('business-suites', 'business-logic', {
        orderVolume: 180,
        customerSatisfaction: 89.2,
        systemUptime: 99.8,
        responseTime: 420,
        errorRate: 0.8,
        revenueImpact: 12500,
      });
    }, 2000);
    
    // Wait for analytics to collect data
    await new Promise(resolve => setTimeout(resolve, 8000));
    
    // Stop collection and generate reports
    analyticsEngine.stopCollection();
    const dailyReport = analyticsEngine.generateReport('daily');
    const weeklyReport = analyticsEngine.generateReport('weekly');
    
    console.log(`✅ Analytics engine: ${analyticsEngine.getData().length} data points collected`);
    console.log(`   Daily report: ${dailyReport.summary.totalTests} tests, ${dailyReport.summary.successRate}% success rate`);
    console.log(`   Weekly report: ${weeklyReport.summary.totalTests} tests, ${weeklyReport.summary.successRate}% success rate`);
    console.log(`   System health: ${dailyReport.systemHealth.overall}/100 (${dailyReport.systemHealth.trend})`);
    
    console.log('');

    // 10. Demonstrate Production Validation
    console.log('🔍 PRODUCTION VALIDATION DEMO');
    console.log('-------------------------------');
    const productionValidator = createProductionValidator();
    
    // Run production validation for staging environment
    const stagingValidation = await productionValidator.runProductionValidation('staging');
    console.log(`✅ Staging validation: ${stagingValidation.summary.totalValidations} validations completed`);
    console.log(`   Passed: ${stagingValidation.summary.passed}`);
    console.log(`   Failed: ${stagingValidation.summary.failed}`);
    console.log(`   Warnings: ${stagingValidation.summary.warnings}`);
    console.log(`   Overall score: ${stagingValidation.summary.overallScore}/100`);
    console.log(`   Readiness level: ${stagingValidation.summary.readinessLevel}`);
    console.log(`   Deployment ready: ${stagingValidation.deploymentReadiness ? 'YES' : 'NO'}`);
    
    // Run health checks
    const healthChecks = await productionValidator.runHealthChecks(['database', 'redis', 'api-gateway', 'voice-agent']);
    console.log(`✅ Health checks: ${healthChecks.length} components checked`);
    console.log(`   Healthy: ${healthChecks.filter(h => h.status === 'healthy').length}`);
    console.log(`   Degraded: ${healthChecks.filter(h => h.status === 'degraded').length}`);
    console.log(`   Unhealthy: ${healthChecks.filter(h => h.status === 'unhealthy').length}`);
    
    console.log('');

    // 11. Show Test Results Summary
    console.log('📊 DEMO RESULTS SUMMARY');
    console.log('-------------------------');
    
    const totalBusinessTests = businessResults.flatMap(r => r.tests).length;
    const passedBusinessTests = businessResults.flatMap(r => r.tests).filter(t => t.passed).length;
    
    const totalAgentTests = agentResults.flatMap(r => r.tests).length;
    const passedAgentTests = agentResults.flatMap(r => r.tests).filter(t => t.passed).length;
    
    const totalPerformanceTests = performanceResults.length;
    const passedPerformanceTests = performanceResults.filter(r => r.success).length;
    
    console.log(`Business Suites: ${passedBusinessTests}/${totalBusinessTests} tests passed`);
    console.log(`AI Agents: ${passedAgentTests}/${totalAgentTests} tests passed`);
    console.log(`Performance: ${passedPerformanceTests}/${totalPerformanceTests} tests passed`);
    
    // Security testing results
    const securityResults = securityAssessment.results;
    const passedSecurityTests = securityResults.filter(r => r.success).length;
    console.log(`Security: ${passedSecurityTests}/${securityResults.length} tests passed`);
    
    // Chaos engineering results
    const chaosResults = chaosReport.experiments;
    const passedChaosTests = chaosResults.filter(e => e.results.success).length;
    console.log(`Chaos Engineering: ${passedChaosTests}/${chaosResults.length} experiments passed`);
    
    // Production validation results
    const validationResults = stagingValidation.validations;
    const passedValidations = validationResults.filter(v => v.status === 'passed').length;
    console.log(`Production Validation: ${passedValidations}/${validationResults.length} validations passed`);
    
    const overallSuccess = businessResults.every(r => r.success) && 
                          agentResults.every(r => r.success) && 
                          performanceResults.every(r => r.success) &&
                          passedSecurityTests === securityResults.length &&
                          passedChaosTests === chaosResults.length &&
                          passedValidations === validationResults.length;
    
    console.log(`\n🎯 Overall Demo Result: ${overallSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
    
    if (!overallSuccess) {
      console.log('\n💡 Areas for improvement:');
      businessResults.forEach(result => {
        if (!result.success) {
          console.log(`  • ${result.suite}: ${result.errors.join(', ')}`);
        }
      });
      agentResults.forEach(result => {
        if (!result.success) {
          console.log(`  • ${result.agent}: ${result.errors.join(', ')}`);
        }
      });
      
      if (passedSecurityTests < securityResults.length) {
        console.log(`  • Security: ${securityResults.filter(r => !r.success).length} tests failed`);
      }
      
      if (passedChaosTests < chaosResults.length) {
        console.log(`  • Chaos Engineering: ${chaosResults.filter(e => !e.results.success).length} experiments failed`);
      }
      
      if (passedValidations < validationResults.length) {
        console.log(`  • Production Validation: ${validationResults.filter(v => v.status !== 'passed').length} validations failed`);
      }
    }

  } catch (error) {
    console.error('❌ Demo failed:', error.message);
    process.exit(1);
  }
}

// Run the demo
if (require.main === module) {
  runDemo().catch(console.error);
}

export { runDemo };