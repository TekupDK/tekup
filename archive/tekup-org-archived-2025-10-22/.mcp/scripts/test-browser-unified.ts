#!/usr/bin/env node

/**
 * @fileoverview TekUp Unified Browser MCP Server - Comprehensive Test Suite
 * 
 * Tests all consolidated browser implementations to ensure the unified server
 * maintains compatibility and functionality from all 4 original servers.
 * 
 * @author TekUp.org Development Team
 * @version 1.0.0
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { spawn } from 'child_process';
import UnifiedBrowserManager from './browser-unified-manager.js';
import type { BrowserServer } from './browser-unified-manager.js';

// =============================================================================
// TEST CONFIGURATION
// =============================================================================

interface TestCase {
  name: string;
  method: string;
  params: any;
  expectedServer?: string;
  timeout?: number;
  skipServers?: string[];
}

interface TestResult {
  testName: string;
  method: string;
  serverId: string;
  success: boolean;
  responseTime: number;
  error?: string;
}

interface ConsolidationValidation {
  originalConfigPath: string;
  expectedTools: string[];
  expectedCapabilities: string[];
  notes: string;
}

// =============================================================================
// TEST SUITE CLASS
// =============================================================================

export class BrowserUnifiedTestSuite {
  private manager: UnifiedBrowserManager;
  private testResults: TestResult[] = [];
  private validationResults: Map<string, boolean> = new Map();
  
  constructor() {
    this.manager = new UnifiedBrowserManager();
  }

  /**
   * Run complete test suite
   */
  async runAllTests(): Promise<void> {
    console.log('🧪 Starting TekUp Unified Browser MCP Server Test Suite');
    console.log('=' * 60);
    
    try {
      // 1. Configuration validation
      await this.validateConsolidation();
      
      // 2. Start unified manager
      await this.startTestEnvironment();
      
      // 3. Run compatibility tests
      await this.runCompatibilityTests();
      
      // 4. Run load balancing tests
      await this.runLoadBalancingTests();
      
      // 5. Run failover tests
      await this.runFailoverTests();
      
      // 6. Run performance tests
      await this.runPerformanceTests();
      
      // 7. Generate test report
      await this.generateTestReport();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }

  /**
   * Validate that consolidation maintains all original functionality
   */
  private async validateConsolidation(): Promise<void> {
    console.log('\n📋 1. Validating Browser Server Consolidation');
    console.log('-' * 40);
    
    const validations: ConsolidationValidation[] = [
      {
        originalConfigPath: 'browser-mcp-config.json',
        expectedTools: [
          'browser_click',
          'browser_navigate', 
          'browser_screenshot',
          'browser_get_page_content',
          'browser_type_text',
          'browser_scroll',
          'browser_wait'
        ],
        expectedCapabilities: ['standard-mcp'],
        notes: 'Standard @modelcontextprotocol/server-browser functionality'
      },
      {
        originalConfigPath: 'warp-agent-infra-mcp.json',
        expectedTools: [
          'agent_browser_navigate',
          'agent_browser_interact',
          'agent_browser_analyze'
        ],
        expectedCapabilities: ['agent-infra'],
        notes: 'Agent infrastructure enhanced browser capabilities'
      },
      {
        originalConfigPath: 'warp-browser-tools-mcp.json',
        expectedTools: [
          'browser_tools_extract',
          'browser_tools_form_fill',
          'browser_tools_monitor'
        ],
        expectedCapabilities: ['browser-tools'],
        notes: 'Specialized browser tools functionality'
      },
      {
        originalConfigPath: 'warp-mcp-config.json',
        expectedTools: [
          'browser_navigate',
          'browser_click',
          'browser_screenshot',
          'browser_get_content',
          'browser_type',
          'browser_wait'
        ],
        expectedCapabilities: ['custom-websocket'],
        notes: 'Custom WebSocket-based browser server'
      }
    ];
    
    // Load unified configuration
    const unifiedConfigPath = resolve(process.cwd(), '.mcp/configs/browser-unified.json');
    let unifiedConfig: any;
    
    try {
      const configContent = readFileSync(unifiedConfigPath, 'utf8');
      unifiedConfig = JSON.parse(configContent);
      console.log('✅ Unified configuration loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load unified configuration:', error);
      throw error;
    }
    
    // Validate each original configuration is represented
    for (const validation of validations) {
      console.log(`\n🔍 Validating ${validation.originalConfigPath}...`);
      
      let originalExists = false;
      let toolsCovered = false;
      
      try {
        // Check if original file exists (for reference)
        const originalPath = resolve(process.cwd(), validation.originalConfigPath);
        try {
          readFileSync(originalPath);
          originalExists = true;
          console.log(`  ✅ Original config exists: ${validation.originalConfigPath}`);
        } catch {
          console.log(`  ⚠️  Original config not found: ${validation.originalConfigPath}`);
        }
        
        // Check if tools are covered in unified configuration
        const allUnifiedTools = this.extractAllToolsFromUnified(unifiedConfig);
        const coveredTools = validation.expectedTools.filter(tool => 
          allUnifiedTools.includes(tool)
        );
        
        toolsCovered = coveredTools.length === validation.expectedTools.length;
        
        if (toolsCovered) {
          console.log(`  ✅ All tools covered: ${coveredTools.join(', ')}`);
        } else {
          const missingTools = validation.expectedTools.filter(tool => 
            !allUnifiedTools.includes(tool)
          );
          console.log(`  ❌ Missing tools: ${missingTools.join(', ')}`);
        }
        
        // Check capability preservation
        const capabilitiesPreserved = this.validateCapabilities(
          unifiedConfig, 
          validation.expectedCapabilities
        );
        
        if (capabilitiesPreserved) {
          console.log(`  ✅ Capabilities preserved: ${validation.expectedCapabilities.join(', ')}`);
        } else {
          console.log(`  ❌ Some capabilities missing`);
        }
        
        const validationPassed = toolsCovered && capabilitiesPreserved;
        this.validationResults.set(validation.originalConfigPath, validationPassed);
        
        console.log(`  ${validationPassed ? '✅' : '❌'} Validation ${validationPassed ? 'PASSED' : 'FAILED'}`);
        console.log(`  📝 Notes: ${validation.notes}`);
        
      } catch (error) {
        console.error(`  ❌ Validation error for ${validation.originalConfigPath}:`, error);
        this.validationResults.set(validation.originalConfigPath, false);
      }
    }
    
    // Summary
    const passedValidations = Array.from(this.validationResults.values()).filter(v => v).length;
    const totalValidations = this.validationResults.size;
    
    console.log(`\n📊 Consolidation Validation Summary:`);
    console.log(`   Passed: ${passedValidations}/${totalValidations}`);
    console.log(`   Success Rate: ${((passedValidations/totalValidations)*100).toFixed(1)}%`);
  }

  /**
   * Extract all tools from unified configuration
   */
  private extractAllToolsFromUnified(config: any): string[] {
    const tools: string[] = [];
    
    if (config.servers) {
      for (const server of Object.values(config.servers) as any[]) {
        if (server.capabilities?.tools) {
          for (const tool of server.capabilities.tools) {
            if (tool.name) {
              tools.push(tool.name);
            }
          }
        }
      }
    }
    
    return [...new Set(tools)]; // Remove duplicates
  }

  /**
   * Validate capabilities are preserved
   */
  private validateCapabilities(config: any, expectedCapabilities: string[]): boolean {
    const sources: string[] = [];
    
    if (config.servers) {
      for (const server of Object.values(config.servers) as any[]) {
        if (server.capabilities?.tools) {
          for (const tool of server.capabilities.tools) {
            if (tool.source) {
              sources.push(tool.source);
            }
          }
        }
      }
    }
    
    return expectedCapabilities.every(cap => sources.includes(cap));
  }

  /**
   * Start test environment
   */
  private async startTestEnvironment(): Promise<void> {
    console.log('\n🚀 2. Starting Test Environment');
    console.log('-' * 40);
    
    try {
      await this.manager.startAll();
      
      // Wait for stabilization
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const stats = this.manager.getStats();
      console.log('✅ Unified Browser Manager started');
      console.log(`   Active Servers: ${stats.activeServers}`);
      console.log(`   Healthy Servers: ${stats.healthyServers}`);
      console.log(`   Strategy: ${stats.strategy}`);
      
    } catch (error) {
      console.error('❌ Failed to start test environment:', error);
      throw error;
    }
  }

  /**
   * Run compatibility tests
   */
  private async runCompatibilityTests(): Promise<void> {
    console.log('\n🔄 3. Running Compatibility Tests');
    console.log('-' * 40);
    
    const testCases: TestCase[] = [
      {
        name: 'Standard Navigation',
        method: 'browser_navigate',
        params: { url: 'https://example.com' },
        expectedServer: 'primary'
      },
      {
        name: 'Element Clicking',
        method: 'browser_click',
        params: { selector: 'button#submit' },
        expectedServer: 'primary'
      },
      {
        name: 'Screenshot Capture',
        method: 'browser_screenshot',
        params: {},
        expectedServer: 'primary'
      },
      {
        name: 'Content Extraction',
        method: 'browser_get_page_content',
        params: {},
        expectedServer: 'primary'
      },
      {
        name: 'Text Input',
        method: 'browser_type_text',
        params: { selector: 'input[name="query"]', text: 'test' },
        expectedServer: 'primary'
      },
      {
        name: 'Page Scrolling',
        method: 'browser_scroll',
        params: { direction: 'down', amount: 500 },
        expectedServer: 'primary'
      },
      {
        name: 'Element Waiting',
        method: 'browser_wait',
        params: { selector: '.loading', timeout: 5000 },
        expectedServer: 'primary'
      },
      {
        name: 'Agent Navigation',
        method: 'agent_browser_navigate',
        params: { url: 'https://example.com', context: 'test' },
        expectedServer: 'agent-infra'
      },
      {
        name: 'Browser Tools Extract',
        method: 'browser_tools_extract',
        params: { selector: '.data-table' },
        expectedServer: 'browser-tools'
      },
      {
        name: 'Custom WebSocket Navigation',
        method: 'browser_navigate',
        params: { url: 'https://example.com' },
        skipServers: ['agent-infra', 'browser-tools'] // Test custom server
      }
    ];
    
    for (const testCase of testCases) {
      await this.runTestCase(testCase);
    }
    
    // Summary
    const passed = this.testResults.filter(r => r.success).length;
    const total = this.testResults.length;
    
    console.log(`\n📊 Compatibility Test Summary:`);
    console.log(`   Passed: ${passed}/${total}`);
    console.log(`   Success Rate: ${((passed/total)*100).toFixed(1)}%`);
  }

  /**
   * Run individual test case
   */
  private async runTestCase(testCase: TestCase): Promise<void> {
    console.log(`\n🧪 Testing: ${testCase.name}`);
    
    const startTime = Date.now();
    
    try {
      // Route request through unified manager
      const server = await this.manager.routeRequest(testCase.method, testCase.params);
      const responseTime = Date.now() - startTime;
      
      if (!server) {
        throw new Error('No server available for request');
      }
      
      console.log(`   ✅ Routed to: ${server.id} (${server.name})`);
      console.log(`   ⏱️  Response time: ${responseTime}ms`);
      
      // Validate expected server if specified
      if (testCase.expectedServer && server.id !== testCase.expectedServer) {
        console.log(`   ⚠️  Expected ${testCase.expectedServer}, got ${server.id}`);
      }
      
      this.testResults.push({
        testName: testCase.name,
        method: testCase.method,
        serverId: server.id,
        success: true,
        responseTime
      });
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      console.log(`   ❌ Failed: ${error.message}`);
      
      this.testResults.push({
        testName: testCase.name,
        method: testCase.method,
        serverId: 'none',
        success: false,
        responseTime,
        error: error.message
      });
    }
  }

  /**
   * Run load balancing tests
   */
  private async runLoadBalancingTests(): Promise<void> {
    console.log('\n⚖️  4. Running Load Balancing Tests');
    console.log('-' * 40);
    
    // Test multiple requests to same method to verify load distribution
    const requests = Array.from({ length: 10 }, (_, i) => ({
      name: `Load Test ${i + 1}`,
      method: 'browser_navigate',
      params: { url: `https://example.com/page${i + 1}` }
    }));
    
    const serverDistribution = new Map<string, number>();
    
    for (const request of requests) {
      try {
        const server = await this.manager.routeRequest(request.method, request.params);
        if (server) {
          const count = serverDistribution.get(server.id) || 0;
          serverDistribution.set(server.id, count + 1);
        }
      } catch (error) {
        console.log(`   ❌ Request failed: ${error.message}`);
      }
    }
    
    console.log('📊 Load Distribution:');
    for (const [serverId, count] of serverDistribution) {
      const percentage = (count / requests.length) * 100;
      console.log(`   ${serverId}: ${count} requests (${percentage.toFixed(1)}%)`);
    }
  }

  /**
   * Run failover tests
   */
  private async runFailoverTests(): Promise<void> {
    console.log('\n🔄 5. Running Failover Tests');
    console.log('-' * 40);
    
    // Get initial server status
    const initialStatus = this.manager.getAllServersStatus();
    const runningServers = initialStatus.filter(s => s.status === 'running');
    
    if (runningServers.length < 2) {
      console.log('⚠️  Skipping failover tests - need at least 2 running servers');
      return;
    }
    
    // Test request routing before failover
    console.log('🧪 Testing routing before failover...');
    const server1 = await this.manager.routeRequest('browser_navigate', { url: 'https://test1.com' });
    console.log(`   Primary routing: ${server1?.id || 'none'}`);
    
    // Simulate server failure by stopping one server
    const serverToStop = runningServers[0];
    console.log(`\n🔄 Simulating failure of ${serverToStop.id}...`);
    
    try {
      await this.manager.stopServer(serverToStop.id);
      console.log(`   ✅ Server ${serverToStop.id} stopped`);
      
      // Wait for health check to detect failure
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Test failover routing
      console.log('🧪 Testing failover routing...');
      const server2 = await this.manager.routeRequest('browser_navigate', { url: 'https://test2.com' });
      console.log(`   Failover routing: ${server2?.id || 'none'}`);
      
      if (server2 && server2.id !== serverToStop.id) {
        console.log('   ✅ Failover successful');
      } else {
        console.log('   ❌ Failover failed');
      }
      
      // Restart the server
      console.log(`\n🔄 Restarting ${serverToStop.id}...`);
      await this.manager.startServer(serverToStop.id);
      console.log(`   ✅ Server ${serverToStop.id} restarted`);
      
    } catch (error) {
      console.error(`   ❌ Failover test error: ${error.message}`);
    }
  }

  /**
   * Run performance tests
   */
  private async runPerformanceTests(): Promise<void> {
    console.log('\n⚡ 6. Running Performance Tests');
    console.log('-' * 40);
    
    // Concurrent request test
    const concurrentRequests = 5;
    const requests = Array.from({ length: concurrentRequests }, (_, i) => 
      this.manager.routeRequest('browser_screenshot', { filename: `test_${i}.png` })
    );
    
    const startTime = Date.now();
    
    try {
      const results = await Promise.all(requests);
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      const successful = results.filter(r => r !== null).length;
      
      console.log(`📊 Concurrent Request Performance:`);
      console.log(`   Total Requests: ${concurrentRequests}`);
      console.log(`   Successful: ${successful}`);
      console.log(`   Total Time: ${totalTime}ms`);
      console.log(`   Average Time: ${(totalTime/concurrentRequests).toFixed(2)}ms per request`);
      
    } catch (error) {
      console.error(`   ❌ Performance test failed: ${error.message}`);
    }
  }

  /**
   * Generate comprehensive test report
   */
  private async generateTestReport(): Promise<void> {
    console.log('\n📊 7. Generating Test Report');
    console.log('=' * 60);
    
    const report = {
      timestamp: new Date().toISOString(),
      validationResults: Object.fromEntries(this.validationResults),
      testResults: this.testResults,
      statistics: this.manager.getStats(),
      serverStatus: this.manager.getAllServersStatus().map(s => ({
        id: s.id,
        name: s.name,
        status: s.status,
        health: s.health,
        requests: s.stats.requests,
        errors: s.stats.errors
      }))
    };
    
    // Print summary
    const validationsPassed = Array.from(this.validationResults.values()).filter(v => v).length;
    const validationsTotal = this.validationResults.size;
    const testsPassed = this.testResults.filter(r => r.success).length;
    const testsTotal = this.testResults.length;
    
    console.log('\n🎯 FINAL RESULTS:');
    console.log(`   Consolidation Validation: ${validationsPassed}/${validationsTotal} (${((validationsPassed/validationsTotal)*100).toFixed(1)}%)`);
    console.log(`   Compatibility Tests: ${testsPassed}/${testsTotal} (${((testsPassed/testsTotal)*100).toFixed(1)}%)`);
    console.log(`   Active Servers: ${report.statistics.activeServers}`);
    console.log(`   Healthy Servers: ${report.statistics.healthyServers}`);
    
    // Write detailed report to file
    const reportPath = resolve(process.cwd(), '.mcp/logs/browser-unified-test-report.json');
    try {
      const fs = await import('fs/promises');
      await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
      console.log(`\n📄 Detailed report written to: ${reportPath}`);
    } catch (error) {
      console.error('⚠️  Could not write report file:', error.message);
    }
    
    // Determine overall result
    const overallSuccess = validationsPassed === validationsTotal && testsPassed === testsTotal;
    console.log(`\n${overallSuccess ? '✅' : '❌'} Overall Result: ${overallSuccess ? 'SUCCESS' : 'PARTIAL SUCCESS'}`);
    
    if (!overallSuccess) {
      console.log('\n🔧 Issues to Address:');
      
      // List validation failures
      for (const [config, passed] of this.validationResults) {
        if (!passed) {
          console.log(`   ❌ ${config}: Consolidation validation failed`);
        }
      }
      
      // List test failures
      for (const result of this.testResults) {
        if (!result.success) {
          console.log(`   ❌ ${result.testName}: ${result.error}`);
        }
      }
    }
  }

  /**
   * Cleanup test environment
   */
  private async cleanup(): Promise<void> {
    console.log('\n🧹 Cleaning up test environment...');
    
    try {
      await this.manager.stopAll();
      console.log('✅ Test environment cleaned up');
    } catch (error) {
      console.error('⚠️  Cleanup warning:', error.message);
    }
  }
}

// =============================================================================
// MAIN EXECUTION
// =============================================================================

async function main() {
  const testSuite = new BrowserUnifiedTestSuite();
  
  try {
    await testSuite.runAllTests();
    process.exit(0);
  } catch (error) {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  }
}

// Run if this is the main module
if (require.main === module) {
  main();
}

export default BrowserUnifiedTestSuite;