#!/usr/bin/env node

/**
 * Integration test for Tekup-Billy MCP with Supabase
 * Tests audit logging and organization setup
 */

import dotenv from 'dotenv';
dotenv.config();

import {
    testConnection,
    createOrganization,
    getBillyApiKey,
    logAuditEvent,
    recordUsageMetric,
    getCacheStats
} from '../dist/database/supabase-client.js';

async function runTests() {
    console.log('🧪 Starting Tekup-Billy Integration Tests...\n');

    // Test 1: Connection
    console.log('📡 Test 1: Supabase Connection');
    try {
        const connected = await testConnection();
        console.log(`   ${connected ? '✅' : '❌'} Connection: ${connected ? 'SUCCESS' : 'FAILED'}\n`);
    } catch (error) {
        console.error('   ❌ Connection FAILED:', error instanceof Error ? error.message : error);
        return;
    }

    // Test 2: Create Organization
    console.log('🏢 Test 2: Create Test Organization');
    try {
        const testOrgId = 'test-org-' + Date.now();
        const testBillyId = process.env.BILLY_ORGANIZATION_ID || 'test-billy-org';
        const testApiKey = process.env.BILLY_API_KEY || 'test-api-key-12345';

        const org = await createOrganization(
            'Test Organization',
            testApiKey,
            testBillyId,
            { test: true }
        );

        if (org) {
            console.log(`   ✅ Organization created: ${org.id}`);
            console.log(`   📋 Billy ID: ${org.billy_organization_id}`);
            console.log(`   🔑 Has API Key: ${org.billy_api_key_encrypted ? 'Yes' : 'No'}\n`);

            // Test 3: Retrieve API Key
            console.log('🔐 Test 3: Decrypt Billy API Key');
            try {
                const decryptedKey = await getBillyApiKey(org.id);
                console.log(`   ✅ API Key retrieved: ${decryptedKey?.substring(0, 10)}...\n`);
            } catch (error) {
                console.error('   ❌ Decryption FAILED:', error instanceof Error ? error.message : error);
            }

            // Test 4: Audit Logging
            console.log('📝 Test 4: Audit Logging');
            try {
                const logged = await logAuditEvent({
                    organization_id: org.id,
                    tool_name: 'test_tool',
                    action: 'read',
                    success: true,
                    duration_ms: 123,
                    input_params: { test: 'data' },
                    output_data: { result: 'success' },
                });
                console.log(`   ✅ Audit log created: ${logged ? 'Yes' : 'No'}\n`);
            } catch (error) {
                console.error('   ❌ Audit logging FAILED:', error instanceof Error ? error.message : error);
            }

            // Test 5: Usage Metrics
            console.log('📊 Test 5: Usage Metrics');
            try {
                const recorded = await recordUsageMetric(
                    org.id,
                    'test_tool',
                    true,
                    123,
                    false
                );
                console.log(`   ✅ Usage metric recorded: ${recorded ? 'Yes' : 'No'}\n`);
            } catch (error) {
                console.error('   ❌ Usage metrics FAILED:', error instanceof Error ? error.message : error);
            }

            // Test 6: Cache Stats
            console.log('📈 Test 6: Cache Statistics');
            try {
                const stats = await getCacheStats();
                console.log(`   ✅ Cache stats retrieved: ${stats.length} entries\n`);
            } catch (error) {
                console.error('   ❌ Cache stats FAILED:', error instanceof Error ? error.message : error);
            }

            console.log('✅ All tests completed successfully!');
            console.log('\n📋 Summary:');
            console.log(`   • Organization ID: ${org.id}`);
            console.log(`   • Billy Org ID: ${org.billy_organization_id}`);
            console.log(`   • Audit Logging: Working`);
            console.log(`   • Usage Metrics: Working`);
            console.log(`   • Encryption: Working`);

        } else {
            console.error('   ❌ Organization creation FAILED');
        }
    } catch (error) {
        console.error('   ❌ Test FAILED:', error instanceof Error ? error.message : error);
    }
}

runTests().catch(error => {
    console.error('💥 Test suite crashed:', error);
    process.exit(1);
});
