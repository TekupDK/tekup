/**
 * Tekup Chat API Test Suite
 * Tests chat endpoint with various scenarios
 */

const API_URL = 'http://localhost:3001/api/chat';

// Test scenarios
const testScenarios = [
  {
    name: 'Basic Query',
    input: 'Hvad kan du hjælpe mig med?',
    expectedKeywords: ['hjælpe', 'Tekup', 'Billy', 'projekter'],
  },
  {
    name: 'Billy.dk Invoice Query',
    input: 'Hvordan laver jeg en faktura i Billy.dk?',
    expectedKeywords: ['faktura', 'Billy', 'API', 'POST'],
    expectedSources: true,
  },
  {
    name: 'Strategic Decision - Tekup-org',
    input: 'Skal jeg slette Tekup-org for at spare disk space?',
    expectedKeywords: ['ADVARSEL', 'værdi', 'extract', 'arkiver'],
    expectedSources: true,
  },
  {
    name: 'TekupVault Knowledge',
    input: 'Hvordan virker TekupVault RAG?',
    expectedKeywords: ['TekupVault', 'RAG', 'semantic', 'search'],
    expectedSources: true,
  },
  {
    name: 'Code Help - MCP Tools',
    input: 'Vis mig hvordan jeg laver en ny MCP tool',
    expectedKeywords: ['MCP', 'tool', 'TypeScript', 'export'],
    expectedSources: true,
  },
  {
    name: 'Multi-turn Context',
    input: 'Hvad er TIER systemet?',
    expectedKeywords: ['TIER', 'prioritering', 'repository'],
  },
];

// Test runner
async function runTests() {
  console.log('🚀 Starting Tekup Chat API Tests\n');
  console.log('=' .repeat(60));
  
  const results = {
    passed: 0,
    failed: 0,
    total: testScenarios.length,
    details: [],
  };

  for (const scenario of testScenarios) {
    console.log(`\n📝 Test: ${scenario.name}`);
    console.log(`Query: "${scenario.input}"`);
    
    const startTime = Date.now();
    
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: scenario.input,
          messages: [],
        }),
      });

      const duration = Date.now() - startTime;

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Validate response structure
      if (!data.message) {
        throw new Error('Response missing message field');
      }

      // Check expected keywords
      const message = data.message.toLowerCase();
      const missingKeywords = scenario.expectedKeywords.filter(
        keyword => !message.includes(keyword.toLowerCase())
      );

      // Check sources if expected
      if (scenario.expectedSources && (!data.sources || data.sources.length === 0)) {
        console.log(`⚠️  Warning: Expected sources but got none`);
      }

      if (missingKeywords.length > 0) {
        console.log(`⚠️  Warning: Missing keywords: ${missingKeywords.join(', ')}`);
      }

      // Log results
      console.log(`✅ PASS (${duration}ms)`);
      console.log(`   Response length: ${data.message.length} chars`);
      console.log(`   Sources: ${data.sources?.length || 0}`);
      if (data.sources && data.sources.length > 0) {
        console.log(`   Top source: ${data.sources[0].repository}/${data.sources[0].path}`);
      }

      results.passed++;
      results.details.push({
        scenario: scenario.name,
        status: 'PASS',
        duration,
        responseLength: data.message.length,
        sourcesCount: data.sources?.length || 0,
        missingKeywords,
      });

    } catch (error) {
      console.log(`❌ FAIL: ${error.message}`);
      results.failed++;
      results.details.push({
        scenario: scenario.name,
        status: 'FAIL',
        error: error.message,
      });
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Test Summary:');
  console.log(`   Total: ${results.total}`);
  console.log(`   ✅ Passed: ${results.passed}`);
  console.log(`   ❌ Failed: ${results.failed}`);
  console.log(`   Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);

  return results;
}

// Run tests
runTests()
  .then(results => {
    console.log('\n✅ Tests completed!\n');
    process.exit(results.failed > 0 ? 1 : 0);
  })
  .catch(error => {
    console.error('\n❌ Test runner failed:', error);
    process.exit(1);
  });
