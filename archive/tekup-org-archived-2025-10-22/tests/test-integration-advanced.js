#!/usr/bin/env node

/**
 * TekUp Advanced Integration Test Script
 * Tests Voice Agent ↔ Flow API integration, CRM sync, and event system
 */

import fetch from 'node-fetch';

const CONFIG = {
  FLOW_API_URL: 'http://localhost:4000',
  CRM_API_URL: 'http://localhost:4001',
  VOICE_AGENT_URL: 'http://localhost:3001',
  TENANT_KEY: 'demo-tenant-key-1',
  TENANT_ID: 'demo1',
};

class IntegrationTester {
  constructor() {
    this.results = {
      flowApi: { success: false, details: [] },
      voiceIntegration: { success: false, details: [] },
      crmSync: { success: false, details: [] },
      eventSystem: { success: false, details: [] },
    };
  }

  async runAllTests() {
    console.log('🚀 TekUp Advanced Integration Test Suite\n');
    
    console.log('🔍 Testing Flow API...');
    await this.testFlowApi();
    
    console.log('\n🎤 Testing Voice Integration...');
    await this.testVoiceIntegration();
    
    console.log('\n💼 Testing CRM Sync...');
    await this.testCrmSync();
    
    console.log('\n📡 Testing Event System...');
    await this.testEventSystem();
    
    console.log('\n📊 Final Results:');
    this.printResults();
  }

  async testFlowApi() {
    try {
      // Test health endpoint
      const healthResponse = await fetch(`${CONFIG.FLOW_API_URL}/metrics`);
      if (healthResponse.ok) {
        this.results.flowApi.details.push('✅ Health endpoint accessible');
      } else {
        this.results.flowApi.details.push('❌ Health endpoint failed');
        return;
      }

      // Test lead creation
      const leadData = {
        source: 'integration-test',
        payload: {
          email: 'test@example.com',
          name: 'Integration Test User',
          company: 'Test Company',
          message: 'Testing advanced integration',
        },
      };

      const leadResponse = await fetch(`${CONFIG.FLOW_API_URL}/ingest/form`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-key': CONFIG.TENANT_KEY,
        },
        body: JSON.stringify(leadData),
      });

      if (leadResponse.ok) {
        const lead = await leadResponse.json();
        this.results.flowApi.details.push(`✅ Lead created: ${lead.id}`);
        this.results.flowApi.success = true;
      } else {
        this.results.flowApi.details.push('❌ Lead creation failed');
      }

    } catch (error) {
      this.results.flowApi.details.push(`❌ Flow API test failed: ${error.message}`);
    }
  }

  async testVoiceIntegration() {
    try {
      // Test voice command execution endpoint (if implemented)
      const voiceCommand = {
        command: 'get_leads',
        parameters: { limit: 5 },
        tenantId: CONFIG.TENANT_ID,
      };

      const voiceResponse = await fetch(`${CONFIG.FLOW_API_URL}/voice/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-key': CONFIG.TENANT_KEY,
        },
        body: JSON.stringify(voiceCommand),
      });

      if (voiceResponse.ok) {
        const result = await voiceResponse.json();
        this.results.voiceIntegration.details.push(`✅ Voice command executed: ${result.success}`);
        this.results.voiceIntegration.success = true;
      } else if (voiceResponse.status === 404) {
        this.results.voiceIntegration.details.push('⚠️ Voice endpoint not yet implemented');
      } else {
        this.results.voiceIntegration.details.push(`❌ Voice command failed: ${voiceResponse.status}`);
      }

    } catch (error) {
      this.results.voiceIntegration.details.push(`❌ Voice integration test failed: ${error.message}`);
    }
  }

  async testCrmSync() {
    try {
      // Test CRM API health
      const crmHealthResponse = await fetch(`${CONFIG.CRM_API_URL}/health`);
      if (crmHealthResponse.ok) {
        this.results.crmSync.details.push('✅ CRM API accessible');
      } else {
        this.results.crmSync.details.push('⚠️ CRM API not accessible (may not be running)');
        return;
      }

      // Test lead sync endpoint
      const syncData = {
        flowApiUrl: CONFIG.FLOW_API_URL,
        apiKey: CONFIG.TENANT_KEY,
        tenantId: CONFIG.TENANT_ID,
      };

      const syncResponse = await fetch(`${CONFIG.CRM_API_URL}/lead-sync/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Note: In real implementation, this would need proper JWT auth
        },
        body: JSON.stringify(syncData),
      });

      if (syncResponse.ok) {
        const result = await syncResponse.json();
        this.results.crmSync.details.push(`✅ Lead sync successful: ${result.leadsImported} imported`);
        this.results.crmSync.success = true;
      } else if (syncResponse.status === 401) {
        this.results.crmSync.details.push('⚠️ CRM sync requires authentication');
      } else {
        this.results.crmSync.details.push(`❌ CRM sync failed: ${syncResponse.status}`);
      }

    } catch (error) {
      this.results.crmSync.details.push(`❌ CRM sync test failed: ${error.message}`);
    }
  }

  async testEventSystem() {
    try {
      // Test WebSocket event system
      const wsUrl = CONFIG.FLOW_API_URL.replace('http', 'ws') + '/events';
      
      // For now, we'll just test if the endpoint exists
      // In a real implementation, we'd test WebSocket connection
      this.results.eventSystem.details.push('⚠️ Event system test requires WebSocket implementation');
      this.results.eventSystem.success = false;

    } catch (error) {
      this.results.eventSystem.details.push(`❌ Event system test failed: ${error.message}`);
    }
  }

  printResults() {
    const sections = [
      { name: 'Flow API', result: this.results.flowApi },
      { name: 'Voice Integration', result: this.results.voiceIntegration },
      { name: 'CRM Sync', result: this.results.crmSync },
      { name: 'Event System', result: this.results.eventSystem },
    ];

    sections.forEach(section => {
      const status = section.result.success ? '✅' : '❌';
      console.log(`${status} ${section.name}: ${section.result.success ? 'PASSED' : 'FAILED'}`);
      
      section.result.details.forEach(detail => {
        console.log(`   ${detail}`);
      });
      console.log('');
    });

    const totalTests = sections.length;
    const passedTests = sections.filter(s => s.result.success).length;
    const successRate = ((passedTests / totalTests) * 100).toFixed(1);

    console.log(`📊 Overall Results: ${passedTests}/${totalTests} tests passed (${successRate}%)`);

    if (passedTests === totalTests) {
      console.log('\n🎉 All integration tests passed! TekUp apps are fully integrated.');
    } else if (passedTests > 0) {
      console.log('\n⚠️ Some integration tests failed. Check the details above.');
    } else {
      console.log('\n❌ All integration tests failed. System needs attention.');
    }
  }
}

// Run the tests
async function main() {
  try {
    const tester = new IntegrationTester();
    await tester.runAllTests();
  } catch (error) {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  }
}

main();