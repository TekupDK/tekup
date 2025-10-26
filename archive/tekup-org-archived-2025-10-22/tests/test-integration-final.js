#!/usr/bin/env node

/**
 * TekUp Final Integration Test Suite
 * Tests ALL integration features including Gemini Live, Workflows, and Performance Monitoring
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

class FinalIntegrationTester {
  constructor() {
    this.results = {
      flowApi: { success: false, details: [] },
      websocket: { success: false, details: [] },
      voiceIntegration: { success: false, details: [] },
      crmSync: { success: false, details: [] },
      leadScoring: { success: false, details: [] },
      eventSystem: { success: false, details: [] },
      geminiLive: { success: false, details: [] },
      workflows: { success: false, details: [] },
      performanceMonitoring: { success: false, details: [] },
      crossAppWorkflows: { success: false, details: [] },
    };
    this.socket = null;
    this.testLeadId = null;
  }

  async runAllTests() {
    console.log('🚀 TekUp Final Integration Test Suite\n');
    console.log('🎯 Testing ALL integration features for 100% completion\n');
    
    console.log('🔍 Phase 1: Core API Testing...');
    await this.testFlowApi();
    
    console.log('\n🔌 Phase 2: WebSocket Infrastructure...');
    await this.testWebSocketConnection();
    
    console.log('\n🎤 Phase 3: Voice Integration...');
    await this.testVoiceIntegration();
    
    console.log('\n💼 Phase 4: CRM Integration...');
    await this.testCrmSync();
    
    console.log('\n📊 Phase 5: Lead Scoring...');
    await this.testLeadScoring();
    
    console.log('\n📡 Phase 6: Event System...');
    await this.testEventSystem();
    
    console.log('\n🤖 Phase 7: Gemini Live Integration...');
    await this.testGeminiLive();
    
    console.log('\n⚡ Phase 8: Workflow Engine...');
    await this.testWorkflows();
    
    console.log('\n📈 Phase 9: Performance Monitoring...');
    await this.testPerformanceMonitoring();
    
    console.log('\n🔄 Phase 10: Cross-App Workflows...');
    await this.testCrossAppWorkflows();
    
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
        source: 'final-integration-test',
        payload: {
          email: 'final-test@example.com',
          name: 'Final Integration Test User',
          company: 'Final Test Company',
          message: 'Testing complete integration suite',
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

      const voiceCommand = {
        command: 'get_metrics',
        parameters: { period: 'today' },
        tenantId: CONFIG.TENANT_ID,
      };

      return new Promise((resolve) => {
        this.socket.on('voice_command_response', (response) => {
          if (response.success) {
            this.results.voiceIntegration.details.push(`✅ Voice command executed: ${response.data?.message || 'Success'}`);
            this.results.voiceIntegration.success = true;
          } else {
            this.results.voiceIntegration.details.push(`❌ Voice command failed: ${response.error}`);
          }
          resolve();
        });

        this.socket.emit('execute_voice_command', voiceCommand);

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
      const crmHealthResponse = await fetch(`${CONFIG.CRM_API_URL}/health`);
      if (crmHealthResponse.ok) {
        this.results.crmSync.details.push('✅ CRM API accessible');
      } else {
        this.results.crmSync.details.push('⚠️ CRM API not accessible (may not be running)');
        return;
      }

      const syncData = {
        flowApiUrl: CONFIG.FLOW_API_URL,
        apiKey: CONFIG.TENANT_KEY,
        tenantId: CONFIG.TENANT_ID,
      };

      const syncResponse = await fetch(`${CONFIG.CRM_API_URL}/lead-sync/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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

      let eventReceived = false;

      return new Promise((resolve) => {
        this.socket.on('lead_event', (event) => {
          this.results.eventSystem.details.push(`✅ Lead event received: ${event.type}`);
          eventReceived = true;
        });

        this.socket.on('voice_event', (event) => {
          this.results.eventSystem.details.push(`✅ Voice event received: ${event.type}`);
          eventReceived = true;
        });

        this.socket.on('integration_event', (event) => {
          this.results.eventSystem.details.push(`✅ Integration event received: ${event.type}`);
          eventReceived = true;
        });

        const testEventData = {
          source: 'final-event-test',
          payload: {
            email: 'final-event@example.com',
            name: 'Final Event Test User',
            company: 'Final Event Test Company',
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

  async testGeminiLive() {
    try {
      // Test Gemini Live integration endpoints
      const geminiResponse = await fetch(`${CONFIG.FLOW_API_URL}/voice/gemini/status`, {
        headers: {
          'x-tenant-key': CONFIG.TENANT_KEY,
        },
      });

      if (geminiResponse.ok) {
        const status = await geminiResponse.json();
        this.results.geminiLive.details.push(`✅ Gemini Live status: ${status.status}`);
        this.results.geminiLive.success = true;
      } else if (geminiResponse.status === 404) {
        this.results.geminiLive.details.push('⚠️ Gemini Live endpoints not yet implemented');
      } else {
        this.results.geminiLive.details.push(`❌ Gemini Live test failed: ${geminiResponse.status}`);
      }

    } catch (error) {
      this.results.geminiLive.details.push(`❌ Gemini Live test failed: ${error.message}`);
    }
  }

  async testWorkflows() {
    try {
      // Test workflow engine endpoints
      const workflowResponse = await fetch(`${CONFIG.FLOW_API_URL}/workflows/templates`, {
        headers: {
          'x-tenant-key': CONFIG.TENANT_KEY,
        },
      });

      if (workflowResponse.ok) {
        const templates = await workflowResponse.json();
        this.results.workflows.details.push(`✅ Workflow templates available: ${templates.length} templates`);
        this.results.workflows.success = true;
      } else if (workflowResponse.status === 404) {
        this.results.workflows.details.push('⚠️ Workflow endpoints not yet implemented');
      } else {
        this.results.workflows.details.push(`❌ Workflow test failed: ${workflowResponse.status}`);
      }

    } catch (error) {
      this.results.workflows.details.push(`❌ Workflow test failed: ${error.message}`);
    }
  }

  async testPerformanceMonitoring() {
    try {
      // Test performance monitoring endpoints
      const perfResponse = await fetch(`${CONFIG.FLOW_API_URL}/monitoring/health`, {
        headers: {
          'x-tenant-key': CONFIG.TENANT_KEY,
        },
      });

      if (perfResponse.ok) {
        const health = await perfResponse.json();
        this.results.performanceMonitoring.details.push(`✅ Performance monitoring: ${health.status} (${health.score})`);
        this.results.performanceMonitoring.success = true;
      } else if (perfResponse.status === 404) {
        this.results.performanceMonitoring.details.push('⚠️ Performance monitoring endpoints not yet implemented');
      } else {
        this.results.performanceMonitoring.details.push(`❌ Performance monitoring test failed: ${perfResponse.status}`);
      }

    } catch (error) {
      this.results.performanceMonitoring.details.push(`❌ Performance monitoring test failed: ${error.message}`);
    }
  }

  async testCrossAppWorkflows() {
    try {
      // Test cross-app workflow execution
      const workflowResponse = await fetch(`${CONFIG.FLOW_API_URL}/workflows/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-key': CONFIG.TENANT_KEY,
        },
        body: JSON.stringify({
          workflowId: 'lead_creation_workflow',
          variables: {
            leadId: this.testLeadId,
            followUpDelay: 24,
          },
        }),
      });

      if (workflowResponse.ok) {
        const result = await workflowResponse.json();
        this.results.crossAppWorkflows.details.push(`✅ Cross-app workflow executed: ${result.executionId}`);
        this.results.crossAppWorkflows.success = true;
      } else if (workflowResponse.status === 404) {
        this.results.crossAppWorkflows.details.push('⚠️ Cross-app workflow endpoints not yet implemented');
      } else {
        this.results.crossAppWorkflows.details.push(`❌ Cross-app workflow test failed: ${workflowResponse.status}`);
      }

    } catch (error) {
      this.results.crossAppWorkflows.details.push(`❌ Cross-app workflow test failed: ${error.message}`);
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
      { name: 'Gemini Live', result: this.results.geminiLive },
      { name: 'Workflows', result: this.results.workflows },
      { name: 'Performance Monitoring', result: this.results.performanceMonitoring },
      { name: 'Cross-App Workflows', result: this.results.crossAppWorkflows },
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

    // Integration maturity assessment
    const maturityLevel = this.assessIntegrationMaturity();
    console.log(`\n📈 Integration Maturity: ${maturityLevel.level} (${maturityLevel.percentage}%)`);
    console.log(`   ${maturityLevel.description}`);

    // Production readiness assessment
    const productionReadiness = this.assessProductionReadiness();
    console.log(`\n🚀 Production Readiness: ${productionReadiness.level} (${productionReadiness.percentage}%)`);
    console.log(`   ${productionReadiness.description}`);

    // Next steps recommendations
    this.printNextSteps();
  }

  assessIntegrationMaturity() {
    const sections = Object.values(this.results);
    const passedTests = sections.filter(s => s.success).length;
    const totalTests = sections.length;
    const percentage = Math.round((passedTests / totalTests) * 100);

    if (percentage >= 95) {
      return {
        level: 'COMPLETE',
        percentage,
        description: 'All integration features working. System is fully integrated and production ready.',
      };
    } else if (percentage >= 85) {
      return {
        level: 'NEARLY COMPLETE',
        percentage,
        description: 'Most integration features working. Minor implementation needed for remaining features.',
      };
    } else if (percentage >= 70) {
      return {
        level: 'HIGHLY INTEGRATED',
        percentage,
        description: 'Core integrations working. Significant work needed for advanced features.',
      };
    } else if (percentage >= 50) {
      return {
        level: 'PARTIALLY INTEGRATED',
        percentage,
        description: 'Basic integrations working. Major development work required for full integration.',
      };
    } else {
      return {
        level: 'EARLY STAGE',
        percentage,
        description: 'Foundation in place. Extensive development work required.',
      };
    }
  }

  assessProductionReadiness() {
    const coreFeatures = [
      this.results.flowApi,
      this.results.websocket,
      this.results.voiceIntegration,
      this.results.crmSync,
      this.results.leadScoring,
      this.results.eventSystem,
    ];

    const advancedFeatures = [
      this.results.geminiLive,
      this.results.workflows,
      this.results.performanceMonitoring,
      this.results.crossAppWorkflows,
    ];

    const coreScore = (coreFeatures.filter(f => f.success).length / coreFeatures.length) * 100;
    const advancedScore = (advancedFeatures.filter(f => f.success).length / advancedFeatures.length) * 100;

    // Weighted score: 70% core features, 30% advanced features
    const weightedScore = Math.round(coreScore * 0.7 + advancedScore * 0.3);

    if (weightedScore >= 90) {
      return {
        level: 'PRODUCTION READY',
        percentage: weightedScore,
        description: 'All critical features working. System ready for production deployment.',
      };
    } else if (weightedScore >= 75) {
      return {
        level: 'PRODUCTION READY (CORE)',
        percentage: weightedScore,
        description: 'Core features production ready. Advanced features can be deployed incrementally.',
      };
    } else if (weightedScore >= 60) {
      return {
        level: 'BETA READY',
        percentage: weightedScore,
        description: 'Core functionality working. Ready for beta testing and limited production use.',
      };
    } else {
      return {
        level: 'DEVELOPMENT',
        percentage: weightedScore,
        description: 'System needs more development before production deployment.',
      };
    }
  }

  printNextSteps() {
    const failedTests = Object.entries(this.results)
      .filter(([_, result]) => !result.success)
      .map(([name, _]) => name);

    if (failedTests.length === 0) {
      console.log('\n🎉 CONGRATULATIONS! All integration tests passed!');
      console.log('\n🚀 System Status: FULLY INTEGRATED AND PRODUCTION READY');
      console.log('\n✨ What you can do now:');
      console.log('   • Deploy to production');
      console.log('   • Start using all integration features');
      console.log('   • Scale up user base');
      console.log('   • Monitor system performance');
      console.log('   • Plan next feature development');
    } else {
      console.log('\n🔧 Next Steps to Complete Integration:');
      failedTests.forEach(test => {
        console.log(`   • Fix ${test} integration`);
      });
      
      console.log('\n📋 Implementation Priority:');
      console.log('   1. Core API integrations (Flow API, CRM, Voice)');
      console.log('   2. Event system and WebSocket infrastructure');
      console.log('   3. Advanced features (Gemini Live, Workflows)');
      console.log('   4. Performance monitoring and optimization');
      
      console.log('\n💡 Tips for Success:');
      console.log('   • Start with core integrations first');
      console.log('   • Test each feature incrementally');
      console.log('   • Use the integration guide for reference');
      console.log('   • Monitor system performance during development');
    }
  }
}

// Run the tests
async function main() {
  try {
    const tester = new FinalIntegrationTester();
    await tester.runAllTests();
  } catch (error) {
    console.error('❌ Final test suite failed:', error);
    process.exit(1);
  }
}

main();