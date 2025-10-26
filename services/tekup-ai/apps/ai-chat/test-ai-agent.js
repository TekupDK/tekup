#!/usr/bin/env node

/**
 * Comprehensive AI Agent Test Suite for tekup-chat
 * Tests: OpenAI integration, TekupVault RAG, session storage, response quality
 * Node.js 18+ required for native fetch support
 */

const API_URL = 'http://localhost:3002/api/chat';
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Test scenarios for tekup-chat
const TEST_SCENARIOS = [
  {
    category: 'Knowledge Base',
    tests: [
      {
        name: 'TekupVault Integration - Repository Query',
        message: 'Hvad er TIER systemet i Tekup repositories?',
        expectedKeywords: ['TIER', 'repository', 'prioritering', '1-5'],
        minLength: 100
      },
      {
        name: 'Strategic Context Awareness',
        message: 'Skal jeg slette flow-api repository for at spare plads?',
        expectedKeywords: ['nej', 'ikke', 'vigtig', 'TIER'],
        minLength: 80
      },
      {
        name: 'Code Standards Query',
        message: 'Hvilke coding standards bruger Tekup?',
        expectedKeywords: ['TypeScript', 'NestJS', 'standards'],
        minLength: 100
      }
    ]
  },
  {
    category: 'Danish Language',
    tests: [
      {
        name: 'Natural Danish Response',
        message: 'Hvordan fungerer voice agent systemet?',
        expectedKeywords: ['voice', 'agent', 'dansk'],
        minLength: 80
      },
      {
        name: 'Complex Danish Question',
        message: 'Hvad er forskellen mellem flow-api og tekup-crm-api?',
        expectedKeywords: ['API', 'flow', 'CRM', 'forskel'],
        minLength: 100
      }
    ]
  },
  {
    category: 'Context & Memory',
    tests: [
      {
        name: 'Multi-turn Conversation',
        messages: [
          'Hvad er Jarvis systemet?',
          'Hvordan virker det med feature flags?'
        ],
        expectedKeywords: ['Jarvis', 'AI', 'feature', 'flag'],
        minLength: 80
      }
    ]
  },
  {
    category: 'Technical Queries',
    tests: [
      {
        name: 'Architecture Question',
        message: 'Forklar Tekup monorepo strukturen',
        expectedKeywords: ['monorepo', 'pnpm', 'workspace', 'apps', 'packages'],
        minLength: 120
      },
      {
        name: 'Deployment Query',
        message: 'Hvordan deployer jeg en Tekup app?',
        expectedKeywords: ['deploy', 'build', 'Docker'],
        minLength: 100
      }
    ]
  },
  {
    category: 'Error Handling',
    tests: [
      {
        name: 'Empty Input',
        message: '',
        expectError: true
      },
      {
        name: 'Very Long Input',
        message: 'Hvad er ' + 'Tekup '.repeat(200) + '?',
        expectedKeywords: ['Tekup'],
        minLength: 50
      },
      {
        name: 'Special Characters',
        message: 'Hvad betyder @tekup/* packages i package.json? 🤔',
        expectedKeywords: ['package', 'workspace', 'shared'],
        minLength: 80
      }
    ]
  }
];

class AIAgentTester {
  constructor() {
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      errors: [],
      timings: [],
      startTime: Date.now()
    };
  }

  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  async testChat(message, conversationHistory = []) {
    const startTime = Date.now();
    
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          messages: conversationHistory
        })
      });

      const duration = Date.now() - startTime;
      
      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}`,
          duration
        };
      }

      const data = await response.json();
      
      return {
        success: true,
        response: data.message || '',
        duration,
        tokensUsed: data.tokensUsed || 0
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        duration: Date.now() - startTime
      };
    }
  }

  validateResponse(response, test) {
    const checks = {
      hasContent: response.length > 0,
      meetsMinLength: response.length >= (test.minLength || 0),
      containsKeywords: true,
      notError: !response.toLowerCase().includes('fejl')
    };

    // Check keywords if provided
    if (test.expectedKeywords && test.expectedKeywords.length > 0) {
      const lowerResponse = response.toLowerCase();
      const foundKeywords = test.expectedKeywords.filter(keyword => 
        lowerResponse.includes(keyword.toLowerCase())
      );
      checks.containsKeywords = foundKeywords.length >= Math.ceil(test.expectedKeywords.length / 2);
      checks.foundKeywords = foundKeywords;
      checks.missingKeywords = test.expectedKeywords.filter(k => 
        !foundKeywords.includes(k)
      );
    }

    checks.passed = Object.values(checks).every(v => v === true || Array.isArray(v));
    
    return checks;
  }

  async runTest(test, categoryName) {
    this.results.total++;
    this.log(`\n  Testing: ${test.name}`, 'cyan');
    
    // Handle multi-turn conversations
    if (test.messages) {
      let conversationHistory = [];
      let lastResponse = null;
      
      for (const msg of test.messages) {
        const result = await this.testChat(msg, conversationHistory);
        
        if (!result.success) {
          this.results.failed++;
          this.results.errors.push({
            category: categoryName,
            test: test.name,
            error: result.error
          });
          this.log(`  ❌ FAILED: ${result.error}`, 'red');
          return;
        }
        
        conversationHistory.push(
          { role: 'user', content: msg, timestamp: new Date().toISOString() },
          { role: 'assistant', content: result.response, timestamp: new Date().toISOString() }
        );
        
        lastResponse = result.response;
        this.results.timings.push(result.duration);
      }
      
      const validation = this.validateResponse(lastResponse, test);
      
      if (validation.passed) {
        this.results.passed++;
        this.log(`  ✅ PASSED (${conversationHistory.length / 2} turns)`, 'green');
      } else {
        this.results.failed++;
        this.log(`  ❌ FAILED: Validation issues`, 'red');
        if (validation.missingKeywords?.length > 0) {
          this.log(`     Missing keywords: ${validation.missingKeywords.join(', ')}`, 'yellow');
        }
      }
      
      return;
    }
    
    // Single message test
    const result = await this.testChat(test.message);
    this.results.timings.push(result.duration);
    
    if (test.expectError) {
      if (!result.success) {
        this.results.passed++;
        this.log(`  ✅ PASSED (Error handled correctly)`, 'green');
      } else {
        this.results.failed++;
        this.log(`  ❌ FAILED: Should have errored`, 'red');
      }
      return;
    }
    
    if (!result.success) {
      this.results.failed++;
      this.results.errors.push({
        category: categoryName,
        test: test.name,
        error: result.error
      });
      this.log(`  ❌ FAILED: ${result.error}`, 'red');
      return;
    }
    
    const validation = this.validateResponse(result.response, test);
    
    if (validation.passed) {
      this.results.passed++;
      this.log(`  ✅ PASSED (${result.duration}ms, ${result.response.length} chars)`, 'green');
    } else {
      this.results.failed++;
      this.log(`  ❌ FAILED: Validation issues`, 'red');
      
      if (!validation.hasContent) {
        this.log(`     No content in response`, 'yellow');
      }
      if (!validation.meetsMinLength) {
        this.log(`     Too short: ${result.response.length} < ${test.minLength}`, 'yellow');
      }
      if (!validation.containsKeywords && test.expectedKeywords) {
        this.log(`     Missing keywords: ${validation.missingKeywords?.join(', ')}`, 'yellow');
      }
    }
  }

  async runAllTests() {
    this.log('\n' + '='.repeat(70), 'blue');
    this.log('🤖 TEKUP-CHAT AI AGENT TEST SUITE', 'blue');
    this.log('='.repeat(70) + '\n', 'blue');

    for (const scenario of TEST_SCENARIOS) {
      this.log(`\n📋 ${scenario.category}`, 'yellow');
      this.log('-'.repeat(70), 'yellow');
      
      for (const test of scenario.tests) {
        await this.runTest(test, scenario.category);
      }
    }

    this.generateReport();
  }

  generateReport() {
    const duration = Date.now() - this.results.startTime;
    const avgResponseTime = this.results.timings.length > 0
      ? Math.round(this.results.timings.reduce((a, b) => a + b, 0) / this.results.timings.length)
      : 0;
    const maxResponseTime = Math.max(...this.results.timings, 0);
    const minResponseTime = Math.min(...this.results.timings, Infinity);

    this.log('\n' + '='.repeat(70), 'blue');
    this.log('📊 TEST RESULTS SUMMARY', 'blue');
    this.log('='.repeat(70), 'blue');

    this.log(`\n✅ Passed: ${this.results.passed}/${this.results.total}`, 'green');
    this.log(`❌ Failed: ${this.results.failed}/${this.results.total}`, 'red');
    this.log(`📈 Success Rate: ${((this.results.passed / this.results.total) * 100).toFixed(1)}%`, 'cyan');

    this.log(`\n⏱️  Performance Metrics:`, 'yellow');
    this.log(`   Average Response Time: ${avgResponseTime}ms`);
    this.log(`   Min Response Time: ${minResponseTime}ms`);
    this.log(`   Max Response Time: ${maxResponseTime}ms`);
    this.log(`   Total Test Duration: ${(duration / 1000).toFixed(2)}s`);

    if (this.results.errors.length > 0) {
      this.log(`\n❌ Errors Encountered:`, 'red');
      this.results.errors.forEach(err => {
        this.log(`   [${err.category}] ${err.test}: ${err.error}`, 'red');
      });
    }

    this.log('\n' + '='.repeat(70) + '\n', 'blue');

    // Save results to file
    const reportData = {
      timestamp: new Date().toISOString(),
      system: 'tekup-chat',
      version: '1.1.0',
      results: this.results,
      metrics: {
        avgResponseTime,
        maxResponseTime,
        minResponseTime,
        totalDuration: duration
      }
    };

    const fs = require('fs');
    const reportPath = './test-results-tekup-chat.json';
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    this.log(`📄 Full report saved to: ${reportPath}`, 'green');
  }
}

// Run tests
(async () => {
  const tester = new AIAgentTester();
  await tester.runAllTests();
})();
