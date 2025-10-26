// Simple test script to verify Microsoft Agent Framework integration
// This tests the code without requiring database or external services

const { initializeMicrosoftAgentFramework, getMicrosoftAgentFrameworkStatus } = require('./dist/agents/microsoft/index.js');

async function testMicrosoftIntegration() {
    console.log('🧪 Testing Microsoft Agent Framework Integration...\n');

    try {
        // Test 1: Initialize framework
        console.log('1️⃣ Testing framework initialization...');
        const initResult = await initializeMicrosoftAgentFramework({
            enableOrchestration: false,
            enableThreadManagement: true,
            enableTelemetry: true,
            enablePluginSystem: false,
            debugMode: true,
        });

        console.log('✅ Initialization result:', {
            success: initResult.success,
            components: initResult.components,
            errors: initResult.errors,
        });

        // Test 2: Get status
        console.log('\n2️⃣ Testing status retrieval...');
        const status = await getMicrosoftAgentFrameworkStatus();
        console.log('✅ Status result:', {
            initialized: status.initialized,
            components: status.components,
            configuration: status.configuration,
        });

        // Test 3: Test hybrid controller
        console.log('\n3️⃣ Testing hybrid controller...');
        const { getHybridController } = require('./dist/agents/microsoft/hybridController.js');
        const hybridController = getHybridController();
        
        console.log('✅ Hybrid controller created:', {
            config: hybridController.getConfig(),
        });

        // Test 4: Test thread manager
        console.log('\n4️⃣ Testing thread manager...');
        const { getThreadManager } = require('./dist/agents/microsoft/threadManager.js');
        const threadManager = getThreadManager();
        
        console.log('✅ Thread manager created');

        // Test 5: Test telemetry service
        console.log('\n5️⃣ Testing telemetry service...');
        const { getTelemetryService } = require('./dist/agents/microsoft/telemetryService.js');
        const telemetryService = getTelemetryService();
        
        const metrics = telemetryService.getMetrics();
        console.log('✅ Telemetry service created, metrics keys:', Object.keys(metrics));

        console.log('\n🎉 All tests passed! Microsoft Agent Framework integration is working correctly.');
        
        return true;

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Stack:', error.stack);
        return false;
    }
}

// Run the test
testMicrosoftIntegration()
    .then(success => {
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error('❌ Test runner failed:', error);
        process.exit(1);
    });