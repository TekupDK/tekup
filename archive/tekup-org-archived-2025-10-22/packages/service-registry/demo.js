import { ServiceRegistry, createServiceRegistryFromEnv } from './dist/index.js';

async function demo() {
  console.log('🚀 Service Registry Demo');
  console.log('========================');

  // Create a new service registry
  const registry = new ServiceRegistry({
    monitoring: {
      enabled: true,
      dashboardEnabled: true,
      metricsRetentionDays: 30
    }
  });

  console.log('\n📝 Registering OpenAI service...');
  
  // Register OpenAI service
  const result = await registry.registerService({
    id: 'openai-demo',
    name: 'OpenAI Demo',
    type: 'ai-provider',
    provider: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    apiKey: 'sk-demo-key-for-testing-only',
    description: 'Demo OpenAI service for testing'
  });

  console.log('Registration result:', {
    success: result.success,
    serviceId: result.serviceId,
    operation: result.operation,
    duration: `${result.duration}ms`
  });

  if (result.success) {
    console.log('\n📊 Service Registry Stats:');
    const stats = registry.getStats();
    console.log(stats);

    console.log('\n🔍 Getting registered service:');
    const service = registry.getService(result.serviceId);
    console.log({
      id: service?.id,
      name: service?.name,
      type: service?.type,
      provider: service?.provider,
      enabled: service?.enabled
    });

    console.log('\n🔧 Updating service description...');
    const updateResult = await registry.updateService(result.serviceId, {
      description: 'Updated demo service description'
    });
    console.log('Update result:', {
      success: updateResult.success,
      operation: updateResult.operation
    });

    console.log('\n🧪 Testing service connectivity...');
    const testResult = await registry.testService(result.serviceId);
    console.log('Test result:', {
      success: testResult.success,
      operation: testResult.operation,
      metadata: testResult.metadata
    });

    console.log('\n📋 Exporting configuration (masked):');
    const config = registry.exportConfig(true);
    console.log('Services:', config.services.map(s => ({
      id: s.id,
      name: s.name,
      type: s.type,
      apiKey: s.apiKey // This should be masked
    })));

    console.log('\n🧹 Cleaning up...');
    const removeResult = await registry.removeService(result.serviceId);
    console.log('Remove result:', {
      success: removeResult.success,
      operation: removeResult.operation
    });
  }

  console.log('\n✅ Demo completed successfully!');
}

demo().catch(console.error);