#!/usr/bin/env node

/**
 * Service Registry Monitoring Demo
 * 
 * This demo showcases the comprehensive monitoring capabilities including:
 * - Health monitoring
 * - Service dashboard
 * - Incident response system
 * - Real-time alerts and notifications
 */

import { ServiceRegistry, ServiceDashboard, IncidentResponseSystem } from './src/index.js';

async function runMonitoringDemo() {
  console.log('🚀 Starting TekUp Service Registry Monitoring Demo\n');

  // Create service registry
  const registry = new ServiceRegistry({
    monitoring: {
      enabled: true,
      dashboardEnabled: true,
      metricsRetentionDays: 30
    }
  });

  try {
    // Register some demo services
    console.log('📝 Registering demo services...');
    
    await registry.registerService({
      id: 'demo-openai',
      name: 'Demo OpenAI',
      type: 'ai',
      provider: 'openai',
      baseUrl: 'https://api.openai.com/v1',
      apiKey: 'demo-key-12345',
      apiKeyHeader: 'Authorization',
      apiKeyPrefix: 'Bearer',
      enabled: true,
      environment: 'development',
      rateLimit: {
        requestsPerMinute: 60,
        requestsPerHour: 1000,
        requestsPerDay: 10000
      },
      retryPolicy: {
        maxRetries: 3,
        baseDelayMs: 1000,
        maxDelayMs: 10000,
        backoffMultiplier: 2,
        retryableStatusCodes: [429, 500, 502, 503, 504]
      },
      healthCheck: {
        enabled: true,
        endpoint: '/models',
        intervalMs: 30000,
        timeoutMs: 10000,
        expectedStatusCodes: [200],
        retries: 2
      }
    });

    await registry.registerService({
      id: 'demo-stripe',
      name: 'Demo Stripe',
      type: 'payment',
      provider: 'stripe',
      baseUrl: 'https://api.stripe.com/v1',
      apiKey: 'sk_test_demo123',
      apiKeyHeader: 'Authorization',
      apiKeyPrefix: 'Bearer',
      enabled: true,
      environment: 'development',
      rateLimit: {
        requestsPerMinute: 100,
        requestsPerHour: 1000,
        requestsPerDay: 10000
      },
      retryPolicy: {
        maxRetries: 3,
        baseDelayMs: 1000,
        maxDelayMs: 5000,
        backoffMultiplier: 2,
        retryableStatusCodes: [429, 500, 502, 503, 504]
      },
      healthCheck: {
        enabled: true,
        endpoint: '/account',
        intervalMs: 60000,
        timeoutMs: 5000,
        expectedStatusCodes: [200],
        retries: 2
      }
    });

    await registry.registerService({
      id: 'demo-unstable',
      name: 'Demo Unstable Service',
      type: 'api',
      provider: 'demo',
      baseUrl: 'https://httpstat.us',
      apiKey: 'demo-key',
      enabled: true,
      environment: 'development',
      healthCheck: {
        enabled: true,
        endpoint: '/500', // This will always return 500 to simulate failures
        intervalMs: 15000,
        timeoutMs: 5000,
        expectedStatusCodes: [200],
        retries: 1
      }
    });

    console.log('✅ Services registered successfully\\n');

    // Start all monitoring systems
    console.log('🔧 Starting monitoring systems...');
    
    await registry.startAllMonitoring({
      dashboardPort: 3001,
      incidentConfig: {
        webhookUrl: 'https://httpbin.org/post', // Demo webhook endpoint
        emailConfig: {
          recipients: ['admin@tekup.org', 'alerts@tekup.org']
        }
      }
    });

    console.log('✅ All monitoring systems started\\n');

    // Display service information
    console.log('📊 Registered Services:');
    const services = registry.getServices();
    services.forEach(service => {
      console.log(`  • ${service.name} (${service.id}) - ${service.type} - ${service.enabled ? '🟢 Enabled' : '🔴 Disabled'}`);
    });

    console.log('\\n🌐 Service Dashboard: http://localhost:3001');
    console.log('   - Real-time service health monitoring');
    console.log('   - Performance metrics and statistics');
    console.log('   - Service configuration overview');

    // Demonstrate incident response
    console.log('\\n🚨 Incident Response Demo:');
    const incidentSystem = registry.getIncidentResponse();
    
    if (incidentSystem) {
      // Create a demo incident
      const incident = await incidentSystem.createIncident(
        'demo-unstable',
        'high',
        'Demo service experiencing high error rates',
        {
          errorRate: 0.8,
          responseTime: 15000,
          consecutiveFailures: 5
        }
      );

      console.log(`   • Created incident: ${incident.id}`);
      console.log(`   • Severity: ${incident.severity}`);
      console.log(`   • Description: ${incident.description}`);

      // Wait a moment then resolve the incident
      setTimeout(async () => {
        await incidentSystem.updateIncident(incident.id, {
          status: 'resolved',
          resolvedAt: new Date()
        }, 'demo-user');
        console.log(`   • Resolved incident: ${incident.id}`);
      }, 5000);
    }

    // Show real-time health monitoring
    console.log('\\n💓 Health Monitoring:');
    console.log('   Checking service health every 30 seconds...');
    console.log('   Unstable service will generate incidents automatically');

    // Display health status every 10 seconds
    const healthInterval = setInterval(async () => {
      try {
        const healthData = await registry.getAllServiceHealth();
        console.log('\\n📈 Current Health Status:');
        
        for (const [serviceId, health] of healthData) {
          const service = registry.getService(serviceId);
          const statusIcon = health.status === 'healthy' ? '🟢' : 
                           health.status === 'degraded' ? '🟡' : '🔴';
          
          console.log(`   ${statusIcon} ${service?.name || serviceId}: ${health.status} (${health.responseTimeMs}ms)`);
          
          if (health.issues && health.issues.length > 0) {
            health.issues.forEach(issue => {
              console.log(`      ⚠️  ${issue.message}`);
            });
          }
        }

        // Show incident statistics
        if (incidentSystem) {
          const stats = incidentSystem.getIncidentStats();
          if (stats.total > 0) {
            console.log('\\n🚨 Incident Statistics:');
            console.log(`   • Total: ${stats.total}`);
            console.log(`   • Open: ${stats.open}`);
            console.log(`   • Resolved: ${stats.resolved}`);
            console.log(`   • Critical: ${stats.bySeverity.critical}`);
            console.log(`   • High: ${stats.bySeverity.high}`);
            console.log(`   • Average Resolution Time: ${stats.averageResolutionTime}ms`);
          }
        }
      } catch (error) {
        console.error('Error fetching health data:', error.message);
      }
    }, 10000);

    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\\n🛑 Shutting down monitoring demo...');
      clearInterval(healthInterval);
      
      try {
        await registry.stopAllMonitoring();
        console.log('✅ All monitoring systems stopped');
        process.exit(0);
      } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
      }
    });

    console.log('\\n🎯 Demo Features:');
    console.log('   • Real-time health monitoring');
    console.log('   • Automatic incident detection');
    console.log('   • Web dashboard with live updates');
    console.log('   • Configurable alerting and escalation');
    console.log('   • Service performance metrics');
    console.log('   • API key management and rotation');
    console.log('\\n💡 Tips:');
    console.log('   • Visit http://localhost:3001 for the web dashboard');
    console.log('   • The unstable service will generate incidents');
    console.log('   • Press Ctrl+C to stop the demo');
    console.log('\\n🔄 Monitoring active... (Press Ctrl+C to stop)');

  } catch (error) {
    console.error('❌ Demo failed:', error);
    process.exit(1);
  }
}

// Run the demo
runMonitoringDemo().catch(console.error);