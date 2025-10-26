#!/usr/bin/env node

/**
 * TekUp Complete Integration Test Suite
 * Tests all integration features: WebSocket, Voice, CRM, Lead Scoring
 */

import fetch from 'node-fetch';
import { io } from 'socket.io-client';

const CONFIG = {
  FLOW_API_URL: 'http://localhost:4000',
  CRM_API_URL: 'http://localhost:4001',
  VOICE_AGENT_URL: 'http://localhost:3001',
  TENANT_KEY: 'demo-tenant-key-1',
  TENANT_ID: 'demo1',
};

class CompleteIntegrationTester {
  constructor() {
    this.results = {
      flowApi: { success: false, details: [] },
      websocket: { success: false, details: [] },
      voiceIntegration: { success: false, details: [] },
      crmSync: { success: false, details: [] },
      leadScoring: { success: false, details: [] },
      eventSystem: { success: false, details: [] },
    };
    this.socket = null;
  }

  async runAllTests() {
    console.log('🚀 TekUp Complete Integration Test Suite\n');
    
    console.log('🔍 Testing Flow API...');
    await this.testFlowApi();
    
    console.log('\n🔌 Testing WebSocket Connection...');
    await this.testWebSocketConnection();
    
    console.log('\n🎤 Testing Voice Integration...');
    await this.testVoiceIntegration();
    
    console.log('\n💼 Testing CRM Sync...');
    await this.testCrmSync();
    
    console.log('\n📊 Testing Lead Scoring...');
    await this.testLeadScoring();
    
    console.log('\n📡 Testing Event System...');
    await this.testEventSystem();
    
    console.log('\n📊 Final Results:');
    this.printResults();
    
    // Cleanup
    if (this.socket) {
      this.socket.disconnect();
    }
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
          message: 'Testing complete integration',
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
        
        // Store lead ID for later tests
        this.testLeadId = lead.id;
      } else {
        this.results.flowApi.details.push('❌ Lead creation failed');
      }

    } catch (error) {
      this.results.flowApi.details.push(`❌ Flow API test failed: ${error.message}`);
    }
  }

  async testWebSocketConnection() {
    try {
      // Connect to WebSocket
      this.socket = io(`${CONFIG.FLOW_API_URL}/events`, {
        extraHeaders: {
          'x-tenant-key': CONFIG.TENANT_KEY,
        },
        timeout: 10000,
      });

      return new Promise((resolve) => {
        this.socket.on('connect', () => {
          this.results.websocket.details.push('✅ WebSocket connected successfully');
          this.results.websocket.success = true;
          resolve();
        });

        this.socket.on('connect_error', (error) => {
          this.results.websocket.details.push(`❌ WebSocket connection failed: ${error.message}`);
          resolve();
        });

        // Timeout after 10 seconds
        setTimeout(() => {
          if (!this.results.websocket.success) {
            this.results.websocket.details.push('❌ WebSocket connection timeout');
          }
          resolve();
        }, 10000);
      });

    } catch (error) {
      this.results.websocket.details.push(`❌ WebSocket test failed: ${error.message}`);
    }
  }

  async testVoiceIntegration() {
    try {
      if (!this.socket || !this.results.websocket.success) {
        this.results.voiceIntegration.details.push('⚠️ WebSocket not available for voice test');
        return;
      }

      // Test voice command execution
      const voiceCommand = {
        command: 'get_leads',
        parameters: { limit: 5 },
        tenantId: CONFIG.TENANT_ID,
      };

      return new Promise((resolve) => {
        // Listen for response
        this.socket.on('voice_command_response', (response) => {
          if (response.success) {
            this.results.voiceIntegration.details.push(`✅ Voice command executed: ${response.data?.message || 'Success'}`);
            this.results.voiceIntegration.success = true;
          } else {
            this.results.voiceIntegration.details.push(`❌ Voice command failed: ${response.error}`);
          }
          resolve();
        });

        // Send command
        this.socket.emit('execute_voice_command', voiceCommand);

        // Timeout after 15 seconds
        setTimeout(() => {
          if (!this.results.voiceIntegration.success) {
            this.results.voiceIntegration.details.push('❌ Voice command execution timeout');
          }
          resolve();
        }, 15000);
      });

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
        this.results.crmSync.details.push(`✅ Lead sync successful: ${result.leadsImported || 0} imported`);
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

  async testLeadScoring() {
    try {
      if (!this.testLeadId) {
        this.results.leadScoring.details.push('⚠️ No lead ID available for scoring test');
        return;
      }

      // Test lead scoring endpoint
      const scoreResponse = await fetch(`${CONFIG.FLOW_API_URL}/leads/${this.testLeadId}/score`, {
        method: 'POST',
        headers: {
          'x-tenant-key': CONFIG.TENANT_KEY,
        },
      });

      if (scoreResponse.ok) {
        const score = await scoreResponse.json();
        this.results.leadScoring.details.push(`✅ Lead scored: ${score.grade} (${score.totalScore})`);
        this.results.leadScoring.details.push(`📊 Factors: ${Object.keys(score.factors).length} scoring factors`);
        this.results.leadScoring.details.push(`💡 Next action: ${score.nextAction}`);
        this.results.leadScoring.success = true;
      } else {
        this.results.leadScoring.details.push(`❌ Lead scoring failed: ${scoreResponse.status}`);
      }

      // Test scoring statistics
      const statsResponse = await fetch(`${CONFIG.FLOW_API_URL}/leads/scoring/stats`, {
        headers: {
          'x-tenant-key': CONFIG.TENANT_KEY,
        },
      });

      if (statsResponse.ok) {
        const stats = await statsResponse.json();
        this.results.leadScoring.details.push(`📈 Scoring stats: ${stats.totalLeads} leads, avg: ${Math.round(stats.averageScore)}`);
      }

    } catch (error) {
      this.results.leadScoring.details.push(`❌ Lead scoring test failed: ${error.message}`);
    }
  }

  async testEventSystem() {
    try {
      if (!this.socket || !this.results.websocket.success) {
        this.results.eventSystem.details.push('⚠️ WebSocket not available for event test');
        return;
      }

      // Test event subscription
      let eventReceived = false;

      return new Promise((resolve) => {
        // Listen for lead events
        this.socket.on('lead_event', (event) => {
          this.results.eventSystem.details.push(`✅ Lead event received: ${event.type}`);
          eventReceived = true;
        });

        // Listen for voice events
        this.socket.on('voice_event', (event) => {
          this.results.eventSystem.details.push(`✅ Voice event received: ${event.type}`);
          eventReceived = true;
        });

        // Listen for integration events
        this.socket.on('integration_event', (event) => {
          this.results.eventSystem.details.push(`✅ Integration event received: ${event.type}`);
          eventReceived = true;
        });

        // Test event publishing by creating another lead
        const testEventData = {
          source: 'event-test',
          payload: {
            email: 'event-test@example.com',
            name: 'Event Test User',
            company: 'Event Test Company',
          },
        };

        fetch(`${CONFIG.FLOW_API_URL}/ingest/form`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-tenant-key': CONFIG.TENANT_KEY,
          },
          body: JSON.stringify(testEventData),
        }).then(() => {
          // Wait a bit for events to be processed
          setTimeout(() => {
            if (eventReceived) {
              this.results.eventSystem.details.push('✅ Event system working correctly');
              this.results.eventSystem.success = true;
            } else {
              this.results.eventSystem.details.push('⚠️ No events received (may be normal)');
            }
            resolve();
          }, 5000);
        });

        // Timeout after 10 seconds
        setTimeout(() => {
          if (!eventReceived) {
            this.results.eventSystem.details.push('⚠️ Event test timeout (may be normal)');
          }
          resolve();
        }, 10000);
      });

    } catch (error) {
      this.results.eventSystem.details.push(`❌ Event system test failed: ${error.message}`);
    }
  }

  printResults() {
    const sections = [
      { name: 'Flow API', result: this.results.flowApi },
      { name: 'WebSocket', result: this.results.websocket },
      { name: 'Voice Integration', result: this.results.voiceIntegration },
      { name: 'CRM Sync', result: this.results.crmSync },
      { name: 'Lead Scoring', result: this.results.leadScoring },
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
      console.log('\n🎉 All integration tests passed! TekUp apps are fully integrated and production ready!');
      console.log('\n🚀 System Features:');
      console.log('   • Real-time voice command processing');
      console.log('   • WebSocket event system');
      console.log('   • CRM lead synchronization');
      console.log('   • Intelligent lead scoring');
      console.log('   • Cross-app communication');
    } else if (passedTests > totalTests / 2) {
      console.log('\n⚠️ Most integration tests passed. System is mostly integrated but needs attention.');
      console.log('\n🔧 Next Steps:');
      console.log('   • Fix failed tests');
      console.log('   • Complete remaining integrations');
      console.log('   • Run end-to-end testing');
    } else {
      console.log('\n❌ Many integration tests failed. System needs significant work before production.');
      console.log('\n🚨 Critical Issues:');
      console.log('   • Review failed test details');
      console.log('   • Check service configurations');
      console.log('   • Verify dependencies are running');
    }

    // Integration maturity assessment
    const maturityLevel = this.assessIntegrationMaturity();
    console.log(`\n📈 Integration Maturity: ${maturityLevel.level} (${maturityLevel.percentage}%)`);
    console.log(`   ${maturityLevel.description}`);
  }

  assessIntegrationMaturity() {
    const sections = Object.values(this.results);
    const passedTests = sections.filter(s => s.success).length;
    const totalTests = sections.length;
    const percentage = Math.round((passedTests / totalTests) * 100);

    if (percentage >= 90) {
      return {
        level: 'PRODUCTION READY',
        percentage,
        description: 'All critical integrations working. System ready for production use.',
      };
    } else if (percentage >= 70) {
      return {
        level: 'NEARLY READY',
        percentage,
        description: 'Most integrations working. Minor issues to resolve before production.',
      };
    } else if (percentage >= 50) {
      return {
        level: 'PARTIALLY INTEGRATED',
        percentage,
        description: 'Basic integrations working. Significant work needed for production.',
      };
    } else if (percentage >= 30) {
      return {
        level: 'EARLY STAGE',
        percentage,
        description: 'Foundation in place. Major development work required.',
      };
    } else {
      return {
        level: 'DEVELOPMENT',
        percentage,
        description: 'Basic functionality only. Not ready for integration testing.',
      };
    }
  }
}

// Run the tests
async function main() {
  try {
    const tester = new CompleteIntegrationTester();
    await tester.runAllTests();
  } catch (error) {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  }
}

main();