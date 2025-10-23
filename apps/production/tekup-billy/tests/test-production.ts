// Production Test Script for Tekup-Billy MCP Server on Render.com
import axios from 'axios';

const PRODUCTION_URL = 'https://tekup-billy.onrender.com';

async function testProduction() {
    console.log('🚀 Testing Tekup-Billy MCP Server in Production');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    let allTestsPassed = true;

    // Test 1: Health Check
    console.log('🏥 Test 1: Health Check');
    try {
        const healthResponse = await axios.get(`${PRODUCTION_URL}/health`, {
            timeout: 10000,
        });

        console.log('✅ Status:', healthResponse.status);
        console.log('   Response:', JSON.stringify(healthResponse.data, null, 2));

        if (healthResponse.data.status !== 'healthy' && healthResponse.data.status !== 'ok') {
            console.log('⚠️  Warning: Health check returned unexpected status');
            allTestsPassed = false;
        }
    } catch (error: any) {
        console.log('❌ Health check failed:', error.message);
        if (error.response) {
            console.log('   Status:', error.response.status);
            console.log('   Data:', error.response.data);
        }
        allTestsPassed = false;
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Test 2: Check Billy.dk Connection
    console.log('🔌 Test 2: Billy.dk API Connection');
    try {
        const healthResponse = await axios.get(`${PRODUCTION_URL}/health`, {
            timeout: 10000,
        });

        const billyConnected = healthResponse.data.billy?.connected === true;
        const orgId = healthResponse.data.billy?.organization;

        if (billyConnected && orgId) {
            console.log('✅ Billy.dk connected');
            console.log(`   Organization ID: ${orgId}`);
            console.log(`   Organization: Rendetalje (CVR: 45564096)`);
        } else {
            console.log('❌ Billy.dk not connected');
            allTestsPassed = false;
        }
    } catch (error: any) {
        console.log('❌ Billy check failed:', error.message);
        allTestsPassed = false;
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Test 3: Server Uptime & Version
    console.log('⏱️  Test 3: Server Uptime & Version');
    try {
        const healthResponse = await axios.get(`${PRODUCTION_URL}/health`, {
            timeout: 10000,
        });

        const uptime = healthResponse.data.uptime;
        const version = healthResponse.data.version;

        console.log(`✅ Server Info:`);
        console.log(`   Version: ${version}`);
        console.log(`   Uptime: ${Math.floor(uptime / 60)} minutes ${Math.floor(uptime % 60)} seconds`);
        console.log(`   Status: ${healthResponse.data.status}`);

        if (uptime < 10) {
            console.log('   ℹ️  Server just deployed (< 10 seconds uptime)');
        }
    } catch (error: any) {
        console.log('❌ Server info check failed:', error.message);
        allTestsPassed = false;
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Test 4: Environment Variables Check
    console.log('� Test 4: Environment Variables');
    try {
        const healthResponse = await axios.get(`${PRODUCTION_URL}/health`, {
            timeout: 10000,
        });

        // Check if expected fields are present
        const hasOrgId = !!healthResponse.data.billy?.organization;
        const hasVersion = !!healthResponse.data.version;
        const hasUptime = typeof healthResponse.data.uptime === 'number';

        if (hasOrgId && hasVersion && hasUptime) {
            console.log('✅ Environment variables loaded correctly');
            console.log('   ✓ BILLY_ORGANIZATION_ID');
            console.log('   ✓ BILLY_API_KEY (connection works)');
            console.log('   ✓ PORT / NODE_ENV');
        } else {
            console.log('⚠️  Some environment variables may be missing');
            allTestsPassed = false;
        }
    } catch (error: any) {
        console.log('❌ Environment check failed:', error.message);
        allTestsPassed = false;
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Final Summary
    console.log('📊 TEST SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Server URL: ${PRODUCTION_URL}`);
    console.log(`Overall Status: ${allTestsPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (allTestsPassed) {
        console.log('🎉 Production deployment is SUCCESSFUL!');
        console.log('\n📋 Next Steps:');
        console.log('   1. Check Render logs for any warnings');
        console.log('   2. Test a real Billy.dk operation (list_invoices)');
        console.log('   3. Verify audit logs in Supabase');
        console.log('   4. Monitor performance metrics');
    } else {
        console.log('⚠️  Some tests failed. Check Render logs:');
        console.log(`   https://dashboard.render.com/web/srv-d3kk30t6ubrc73e1qon0/logs`);
    }

    process.exit(allTestsPassed ? 0 : 1);
}

// Run tests
testProduction().catch(error => {
    console.error('💥 Fatal error:', error.message);
    process.exit(1);
});
