#!/usr/bin/env node

/**
 * TekUp Integration Test Script
 * Validates Flow API backend and Nexus Dashboard form submission
 */

import fetch from 'node-fetch';

const CONFIG = {
  API_URL: 'http://localhost:4000',
  TENANT_KEY: 'demo-tenant-key-1',
  FRONTEND_URL: 'http://localhost:5173'
};

async function testApiHealth() {
  console.log('🔍 Testing Flow API health...');
  try {
    const response = await fetch(`${CONFIG.API_URL}/metrics`);
    console.log(`✅ API accessible: ${response.status}`);
    return response.ok;
  } catch (error) {
    console.log(`❌ API not accessible: ${error.message}`);
    return false;
  }
}

async function testApiKeyValidation() {
  console.log('🔑 Testing API key validation...');
  try {
    const response = await fetch(`${CONFIG.API_URL}/ingest/form`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-key': CONFIG.TENANT_KEY
      },
      body: JSON.stringify({
        source: 'integration-test',
        payload: {
          email: 'test@example.com',
          name: 'Integration Test',
          company: 'TekUp Test',
          message: 'Testing API key validation and lead ingestion'
        }
      })
    });

    console.log(`✅ Form submission: ${response.status}`);
    
    if (response.ok) {
      const result = await response.json();
      console.log(`📋 Lead created: ${result.id}`);
      return true;
    } else {
      const error = await response.text();
      console.log(`❌ Submission failed: ${error}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Request failed: ${error.message}`);
    return false;
  }
}

async function testInvalidApiKey() {
  console.log('🚫 Testing invalid API key rejection...');
  try {
    const response = await fetch(`${CONFIG.API_URL}/ingest/form`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-key': 'invalid-key'
      },
      body: JSON.stringify({
        source: 'invalid-test',
        payload: { email: 'test@example.com' }
      })
    });

    if (response.status === 401) {
      console.log('✅ Invalid key properly rejected');
      return true;
    } else {
      console.log(`❌ Expected 401, got ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Request failed: ${error.message}`);
    return false;
  }
}

async function testFrontendAccess() {
  console.log('🌐 Testing Nexus Dashboard accessibility...');
  try {
    const response = await fetch(CONFIG.FRONTEND_URL);
    console.log(`✅ Frontend accessible: ${response.status}`);
    return response.ok;
  } catch (error) {
    console.log(`❌ Frontend not accessible: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('🚀 TekUp Integration Test Suite\n');
  
  const results = {
    apiHealth: await testApiHealth(),
    frontendAccess: await testFrontendAccess(),
    apiKeyValidation: await testApiKeyValidation(),
    invalidKeyRejection: await testInvalidApiKey()
  };

  console.log('\n📊 Test Summary:');
  console.log(`API Health: ${results.apiHealth ? '✅' : '❌'}`);
  console.log(`Frontend Access: ${results.frontendAccess ? '✅' : '❌'}`);
  console.log(`Valid API Key: ${results.apiKeyValidation ? '✅' : '❌'}`);
  console.log(`Invalid Key Rejection: ${results.invalidKeyRejection ? '✅' : '❌'}`);

  const allPassed = Object.values(results).every(r => r);
  console.log(`\n${allPassed ? '🎉' : '⚠️'} Overall: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);

  if (allPassed) {
    console.log('\n✅ TekUp Flow API and Nexus Dashboard integration is working correctly!');
    console.log('🔗 You can now test form submission at http://localhost:5173');
  } else {
    console.log('\n❌ Integration issues detected. Check the following:');
    if (!results.apiHealth) console.log('  - Start Flow API: cd apps/flow-api && pnpm dev');
    if (!results.frontendAccess) console.log('  - Start Nexus Dashboard: cd apps/nexus-dashboard && pnpm dev');
    if (!results.apiKeyValidation) console.log('  - Check PostgreSQL is running and migrations applied');
    if (!results.invalidKeyRejection) console.log('  - Check API key middleware configuration');
  }
}

runTests().catch(console.error);
