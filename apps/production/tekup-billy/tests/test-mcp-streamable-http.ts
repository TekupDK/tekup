/**
 * Test MCP Streamable HTTP Transport (2025-03-26)
 * 
 * Tests the new /mcp endpoint to verify it works with Claude.ai custom connectors
 */

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

interface TestResult {
    name: string;
    passed: boolean;
    message: string;
    details?: any;
}

const results: TestResult[] = [];

function log(message: string) {
    console.log(`[${new Date().toISOString()}] ${message}`);
}

async function test(name: string, fn: () => Promise<void>): Promise<void> {
    try {
        log(`🧪 Testing: ${name}`);
        await fn();
        results.push({ name, passed: true, message: '✅ PASSED' });
        log(`✅ ${name} - PASSED`);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        results.push({ name, passed: false, message: `❌ FAILED: ${message}`, details: error });
        log(`❌ ${name} - FAILED: ${message}`);
    }
}

async function makeRequest(
    method: 'POST' | 'GET' | 'DELETE',
    path: string,
    body?: any,
    headers: Record<string, string> = {}
): Promise<Response> {
    const url = `${BASE_URL}${path}`;

    const options: RequestInit = {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...headers
        }
    };

    if (body && (method === 'POST' || method === 'DELETE')) {
        options.body = JSON.stringify(body);
    }

    log(`${method} ${url}`);
    if (body) {
        log(`Body: ${JSON.stringify(body, null, 2)}`);
    }

    const response = await fetch(url, options);

    log(`Response: ${response.status} ${response.statusText}`);

    return response;
}

async function runTests() {
    log('🚀 Starting MCP Streamable HTTP Transport Tests');
    log(`📍 Testing server: ${BASE_URL}`);
    log('');

    // Test 1: POST /mcp with initialize request
    await test('POST /mcp - Initialize Session', async () => {
        const response = await makeRequest('POST', '/mcp', {
            jsonrpc: '2.0',
            id: 1,
            method: 'initialize',
            params: {
                protocolVersion: '2025-03-26',
                capabilities: {},
                clientInfo: {
                    name: 'test-client',
                    version: '1.0.0'
                }
            }
        }, {
            'Accept': 'application/json, text/event-stream'
        });

        if (!response.ok) {
            throw new Error(`Expected 200, got ${response.status}`);
        }

        // Check for session ID in header
        const sessionId = response.headers.get('Mcp-Session-Id');
        if (!sessionId) {
            throw new Error('Missing Mcp-Session-Id header in response');
        }

        const data = await response.json();
        log(`Session ID: ${sessionId}`);
        log(`Response: ${JSON.stringify(data, null, 2)}`);

        if (!data.result || !data.result.protocolVersion) {
            throw new Error('Invalid initialize response format');
        }

        if (data.result.protocolVersion !== '2025-03-26') {
            throw new Error(`Expected protocol version 2025-03-26, got ${data.result.protocolVersion}`);
        }
    });

    // Test 2: POST /mcp with tools/list request
    await test('POST /mcp - List Tools', async () => {
        const response = await makeRequest('POST', '/mcp', {
            jsonrpc: '2.0',
            id: 2,
            method: 'tools/list',
            params: {}
        }, {
            'Accept': 'application/json'
        });

        if (!response.ok) {
            throw new Error(`Expected 200, got ${response.status}`);
        }

        const data = await response.json();
        log(`Response: ${JSON.stringify(data, null, 2)}`);

        if (!data.result || !Array.isArray(data.result.tools)) {
            throw new Error('Invalid tools/list response format');
        }

        const toolCount = data.result.tools.length;
        if (toolCount < 13) {
            throw new Error(`Expected at least 13 tools, got ${toolCount}`);
        }

        log(`Found ${toolCount} tools`);
    });

    // Test 3: POST /mcp with batch request
    await test('POST /mcp - Batch Request', async () => {
        const response = await makeRequest('POST', '/mcp', [
            {
                jsonrpc: '2.0',
                id: 3,
                method: 'initialize',
                params: {
                    protocolVersion: '2025-03-26',
                    capabilities: {},
                    clientInfo: { name: 'test', version: '1.0' }
                }
            },
            {
                jsonrpc: '2.0',
                id: 4,
                method: 'tools/list',
                params: {}
            }
        ], {
            'Accept': 'application/json'
        });

        if (!response.ok) {
            throw new Error(`Expected 200, got ${response.status}`);
        }

        const data = await response.json();
        log(`Response: ${JSON.stringify(data, null, 2)}`);

        if (!Array.isArray(data)) {
            throw new Error('Expected array response for batch request');
        }

        if (data.length !== 2) {
            throw new Error(`Expected 2 responses, got ${data.length}`);
        }
    });

    // Test 4: POST /mcp with only notifications (should return 202)
    await test('POST /mcp - Notification Only (202)', async () => {
        const response = await makeRequest('POST', '/mcp', {
            jsonrpc: '2.0',
            method: 'notifications/initialized',
            params: {}
        }, {
            'Accept': 'application/json'
        });

        if (response.status !== 202) {
            throw new Error(`Expected 202 Accepted, got ${response.status}`);
        }

        log('Correctly returned 202 Accepted for notification-only request');
    });

    // Test 5: POST /mcp with invalid JSON-RPC
    await test('POST /mcp - Invalid JSON-RPC (Error Response)', async () => {
        const response = await makeRequest('POST', '/mcp', {
            jsonrpc: '1.0', // Wrong version
            id: 5,
            method: 'test'
        }, {
            'Accept': 'application/json'
        });

        if (!response.ok) {
            throw new Error(`Expected 200 (with error in body), got ${response.status}`);
        }

        const data = await response.json();
        log(`Response: ${JSON.stringify(data, null, 2)}`);

        if (!data.error) {
            throw new Error('Expected error response for invalid JSON-RPC');
        }

        if (data.error.code !== -32600) {
            throw new Error(`Expected error code -32600, got ${data.error.code}`);
        }
    });

    // Test 6: DELETE /mcp - Session cleanup
    await test('DELETE /mcp - Terminate Session', async () => {
        // First create a session
        const initResponse = await makeRequest('POST', '/mcp', {
            jsonrpc: '2.0',
            id: 6,
            method: 'initialize',
            params: {
                protocolVersion: '2025-03-26',
                capabilities: {},
                clientInfo: { name: 'test', version: '1.0' }
            }
        }, {
            'Accept': 'application/json'
        });

        const sessionId = initResponse.headers.get('Mcp-Session-Id');
        if (!sessionId) {
            throw new Error('No session ID returned from initialize');
        }

        log(`Created session: ${sessionId}`);

        // Now delete it
        const deleteResponse = await makeRequest('DELETE', '/mcp', undefined, {
            'Mcp-Session-Id': sessionId
        });

        if (!deleteResponse.ok) {
            throw new Error(`Expected 200, got ${deleteResponse.status}`);
        }

        const data = await deleteResponse.json();
        log(`Delete response: ${JSON.stringify(data, null, 2)}`);

        if (!data.message || !data.message.includes('terminated')) {
            throw new Error('Expected termination confirmation');
        }
    });

    // Test 7: Legacy endpoint still works
    await test('Legacy Endpoint - /mcp/legacy (Backwards Compat)', async () => {
        const response = await makeRequest('GET', '/mcp/legacy');

        // GET to SSE endpoint will timeout, but we can check it starts streaming
        // For now, just verify endpoint exists (should get timeout or connection, not 404)

        if (response.status === 404) {
            throw new Error('Legacy endpoint not found - backwards compatibility broken');
        }

        log('Legacy endpoint accessible (backwards compatibility maintained)');
    });

    // Summary
    log('');
    log('📊 Test Results Summary:');
    log('═'.repeat(60));

    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    const total = results.length;

    results.forEach(result => {
        log(`${result.message} - ${result.name}`);
    });

    log('═'.repeat(60));
    log(`Total: ${total} | Passed: ${passed} | Failed: ${failed}`);

    if (failed > 0) {
        log('');
        log('❌ SOME TESTS FAILED');
        process.exit(1);
    } else {
        log('');
        log('✅ ALL TESTS PASSED!');
        log('');
        log('🎉 Streamable HTTP transport is ready for Claude.ai!');
    }
}

// Run tests
runTests().catch(error => {
    console.error('💥 Test runner crashed:', error);
    process.exit(1);
});
